import type { CommonFunc, RefCommon, WatcherSourceGetter } from "./typing";
import { isReactive, EMPTY_OBJECT, hasChanged, isArray, isBoolean, isFunc, isObject, isMap, isSet, isRef, isReferenceType, nextTick, NOOP } from "./utils";

export let activeEffect: ReactiveEffect | undefined;
export const effectStack: ReactiveEffect[] = [];

export type ReactiveEffectFunc = CommonFunc & {
  effect?: ReactiveEffect;
}
export class ReactiveEffect {
  /**
   * 清空effect副作用对象的deps依赖项
   * @param effect 
   * @description
   *  用以终止响应式监听器
   */
  static cleanUpEffect(effect: InstanceType<typeof ReactiveEffect>) {
    const { deps } = effect;
    deps.forEach((dep) => {
      dep.delete(effect);
    });
    deps.length = 0;
  }
  /**
   * effect副作用对象的deps依赖项
   */
  public deps: Set<ReactiveEffect>[] = [];
  constructor(
    /**
     * effect、watch等API的回调（侦听处理器）
     */
    public func: ReactiveEffectFunc,
    /**
     * 异步调度器（优先级高于run）
     */
    public schduler: CommonFunc | null = null
  ) { }

  /**
   * 侦听器执行者
   * @returns 
   */
  run() {
    if (!effectStack.includes(this)) {
      try {
        effectStack.push(activeEffect = this);
        return this.func();
      } finally {
        effectStack.pop();
        const { length } = effectStack;
        activeEffect = length > 0 ? effectStack[length - 1] : void 0;
      }
    }
  }
  /**
   * 终止侦听器
   */
  stop() {
    ReactiveEffect.cleanUpEffect(this);
  }
}


export function effect(
  func: ReactiveEffectFunc,
  options?: {
    lazy?: boolean; //是否延迟执行，用于computed中
  }
) {
  func.effect && (func = func.effect.func);
  const _effect = new ReactiveEffect(func);
  if (!options || !options.lazy) {
    _effect.run();
  }
  const runner = _effect.run.bind(_effect);
  Reflect.set(runner, 'effect', _effect);
  return runner;
}

/**
 * 侦听器触发时机
 */
export enum WatcherFlush {
  /**
   * 异步
   */
  async = 'async',
  /**
   * 同步
   */
  sync = 'sync',
}
const watcherFlushValues = Object.values(WatcherFlush);

export type WatcherDeep = boolean | number;

/**
 * watch api执行选项
 */
export interface WatcherOptions {
  /**
   * 刷新时机（触发时机）
   */
  flush?: WatcherFlush;
  /**
   * 是否立即执行
   */
  immediate?: boolean;
  /**
   * 深层监听选项
   */
  deep?: WatcherDeep;
}

/**
 * watch侦听器默认返回的初始值
 */
const INITIAL_WATCHER_VALUE = {}

/**
 * watch响应式侦听器
 * @param targetSource 获取要侦听的响应式数据
 * @param cb 响应式数据更新时，需要处理的任务
 * @param options 执行选项
 * @returns 
 */
export function watch<T>(
  targetSource: RefCommon<T> | WatcherSourceGetter,
  cb: CommonFunc,
  options: WatcherOptions = EMPTY_OBJECT
) {
  // 如果cb不是函数，终止后续执行
  if (!isFunc(cb)) {
    console.error(`The second parameter of 'watch' ———— 'cb' must be a function!`)
    return;
  }
  // 默认触发机制：响应式数据更新后，异步执行回调任务
  const { flush = WatcherFlush.async, immediate = false, deep = 1 } = options;
  let isDeep = false;
  // 获取响应式数据的值
  const targetValueGetter = (() => {
    if (isRef(targetSource)) {
      return () => targetSource.value;
    }
    const realDepth = (() => {
      if (isBoolean(deep)) {
        return deep ? Infinity : 1;
      }
      if (Number.isNaN(deep)) {
        return -Infinity;
      }
      return deep;
    })();
    // 如果指定了有效的监听深度（如2层）
    if (Number.isFinite(realDepth)) {
      isDeep = true;
      return () => {
        let value = targetSource();
        if (isRef(value) || isReactive(value)) {
          value = [value];
        }
        if (isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            new Traverse(value[i]).bfs(realDepth);
          }
        }
        return value;
      }
    }
    // 如果deep为true或Infinity，则递归监听所有子项
    else if (realDepth === Infinity) {
      isDeep = true;
      return () => {
        const value = targetSource();
        new Traverse(value).dfs();
        return value;
      };
    }
    // 其它情况，如deep为0、NaN无效值
    return NOOP;
  })();
  // 旧值
  let oldValue: any = INITIAL_WATCHER_VALUE;
  // 侦听器的核心处理任务
  const baseJob = () => {
    // 获取响应式数据更新后的值
    const newValue = _effect.run();
    /**
     * 满足如下条件，将触发watch回调：
     *  1、开起了deep深度监听
     *  2、新值与旧值变了
     *  3、新值与旧值的其中一项变了
     */
    if (isDeep || hasChanged(newValue, oldValue) || isArray(newValue) && newValue.some((val, i) => hasChanged(val, oldValue[i]))) {
      cb.apply(null, [newValue, oldValue === INITIAL_WATCHER_VALUE ? void 0 : oldValue]);
      // 同时将新值为旧值
      oldValue = newValue;
    }
  }
  if (!watcherFlushValues.includes(flush)) {
    console.warn(`The 'flush' parameter value of 'watch' options should be one of the two options: ${watcherFlushValues.join('、')}`)
  }
  // 调度器（可能是异步，也可能是同步）
  const schduler = flush === WatcherFlush.async ? () => nextTick(baseJob) : baseJob;
  const _effect = new ReactiveEffect(targetValueGetter, schduler);

  // 如果需要立即执行
  if (immediate) {
    schduler();
  }
  // 否则先获取一次旧值
  else {
    oldValue = _effect.run();
  }
  // 返回侦听器中断者
  return function watcherStopper() {
    _effect.stop();
  }
}

/**
 * 响应式数据的深层遍历获取
 */
export class Traverse {

  private hashSet = new Set;

  constructor(private readonly value: unknown) { }

  bfs(depth = -Infinity) {
    const stack = [{ value: this.value, dep: 0 }];
    while (stack.length) {
      const item = stack.pop()!;
      const nextDep = item.dep + 1;
      if (nextDep > depth) {
        break;
      }
      this.each(item.value, (childValue) => {
        stack.push({ value: childValue, dep: nextDep });
      });
    }
  }

  dfs(value: unknown = this.value) {
    this.each(value, this.dfs.bind(this));
  }

  each(value: unknown, handler: (childValue: unknown) => void) {
    if (!isReferenceType(value)) {
      return;
    }
    if (this.hashSet.has(value)) {
      return;
    }
    this.hashSet.add(value);
    if (isRef(value)) {
      handler(value.value);
    }
    else if (isObject(value)) {
      for (const key in value) {
        handler(value[key]);
      }
    }
    else if (isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        handler(value[i]);
      }
    }
    else if (isMap(value) || isSet(value)) {
      value.forEach(handler);
    }
  }

}