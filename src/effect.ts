import { ReactiveIdentification } from "./reactive";
import { CommonFunc } from "./typing";
import { EMPTY_OBJECT, hasChanged, isFunc, nextTick } from "./utils";

export let activeEffect: ReactiveEffect | undefined;
export const effectStack: ReactiveEffect[] = [];

export type ReactiveEffectFunc = CommonFunc & {
  effect?: ReactiveEffect;
}
export class ReactiveEffect {
  static cleanUpEffect(effect: InstanceType<typeof ReactiveEffect>) {
    const { deps } = effect;
    deps.forEach((dep) => {
      dep.delete(effect);
    });
    deps.length = 0;
  }
  public deps: Set<ReactiveEffect>[] = [];
  constructor(
    public func: ReactiveEffectFunc,
    public schduler: CommonFunc | null = null
  ) { }

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

export enum WatcherFlush {
  async = 'async',
  sync = 'sync',
}
const watcherFlushValues = Object.values(WatcherFlush);
export interface WatcherOptions {
  flush?: WatcherFlush;
  immediate?: boolean;
}

const INITIAL_WATCHER_VALUE = {}
export function watch(
  targetSource: () => ReactiveIdentification | ReactiveIdentification[],
  cb: CommonFunc,
  options: WatcherOptions = EMPTY_OBJECT
) {
  if (!isFunc(cb)) {
    console.error(`The second parameter of 'watch' ———— 'cb' must be a function!`)
    return;
  }
  const { flush = WatcherFlush.async, immediate = false } = options;
  const targetValueGetter = () => targetSource();
  let oldValue = INITIAL_WATCHER_VALUE;
  const baseJob = () => {
    const newValue = _effect.run();
    if (hasChanged(newValue, oldValue)) {
      cb.apply(null, [newValue, oldValue === INITIAL_WATCHER_VALUE ? void 0 : oldValue]);
      oldValue = newValue;
    }
  }
  if (!watcherFlushValues.includes(flush)) {
    console.warn(`The 'flush' parameter value of 'watch' options should be one of the two options: ${watcherFlushValues.join('、')}`)
  }
  const schduler = flush === WatcherFlush.async ? () => nextTick(baseJob) : baseJob;
  const _effect = new ReactiveEffect(targetValueGetter, schduler);

  if (immediate) {
    schduler();
  } else {
    oldValue = _effect.run();
  }
  return () => {
    _effect.stop();
  }
}
