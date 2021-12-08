declare type CommonFunc = (...args: any[]) => any;
declare type PlainObject<T = any> = Record<string, T>;

declare type ReactiveIdentification<T extends object = {}> = T & PlainObject & {
    readonly [ReactiveTargetMarker.__REACTIVE__]?: boolean;
};
declare enum ReactiveTargetMarker {
    __REACTIVE__ = "__reactive__"
}
declare const isReactive: (value: any) => value is ReactiveIdentification<{}>;
declare const reactiveTargetMap: WeakMap<ReactiveIdentification<{}>, any>;
declare function reactive<T extends object>(value: T): ReactiveIdentification<T> | undefined;
declare function createGetter<T extends PlainObject>(): (target: T, key: string | symbol, receiver: T) => any;
declare function createSetter<T extends PlainObject>(): (target: T, key: string | symbol, newValue: any) => boolean;

declare let activeEffect: ReactiveEffect | undefined;
declare const effectStack: ReactiveEffect[];
declare type ReactiveEffectFunc = CommonFunc & {
    effect?: ReactiveEffect;
};
declare class ReactiveEffect {
    /**
     * effect、watch等API的回调（侦听处理器）
     */
    func: ReactiveEffectFunc;
    /**
     * 异步调度器（优先级高于run）
     */
    schduler: CommonFunc | null;
    /**
     * 清空effect副作用对象的deps依赖项
     * @param effect
     * @description
     *  用以终止响应式监听器
     */
    static cleanUpEffect(effect: InstanceType<typeof ReactiveEffect>): void;
    /**
     * effect副作用对象的deps依赖项
     */
    deps: Set<ReactiveEffect>[];
    constructor(
    /**
     * effect、watch等API的回调（侦听处理器）
     */
    func: ReactiveEffectFunc, 
    /**
     * 异步调度器（优先级高于run）
     */
    schduler?: CommonFunc | null);
    /**
     * 侦听器执行者
     * @returns
     */
    run(): any;
    /**
     * 终止侦听器
     */
    stop(): void;
}
declare function effect(func: ReactiveEffectFunc, options?: {
    lazy?: boolean;
}): () => any;
/**
 * 侦听器触发时机
 */
declare enum WatcherFlush {
    /**
     * 异步
     */
    async = "async",
    /**
     * 同步
     */
    sync = "sync"
}
/**
 * watch api执行选项
 */
interface WatcherOptions {
    /**
     * 刷新时机（触发时机）
     */
    flush?: WatcherFlush;
    /**
     * 是否立即执行
     */
    immediate?: boolean;
}
/**
 * watch响应式侦听器
 * @param targetSource 获取要侦听的响应式数据
 * @param cb 响应式数据更新时，需要处理的任务
 * @param options 执行选项
 * @returns
 */
declare function watch(targetSource: () => ReactiveIdentification | ReactiveIdentification[], cb: CommonFunc, options?: WatcherOptions): (() => void) | undefined;

/**
 * 响应式数据收集的依赖集合
 */
declare const objEffectWeakMap: WeakMap<object, Map<string | symbol, Set<ReactiveEffect>>>;
/**
 * 是否应该暂停追踪依赖
 * @returns
 * @description
 *  不应该收集的条件：
 *    1、activeEffect为undefined
 *    2、shouldTrack为false
 */
declare function isPauseTracking(): boolean;
/**
 * 响应式数据依赖收集
 * @param target
 * @param key
 * @returns
 */
declare function track(target: PlainObject, key: string | symbol): void;
declare function trackEffect(effectFuncDeps: Set<ReactiveEffect>): void;
/**
 * 触发响应式数据更新时的任务
 * @param target
 * @param key
 * @param newValue
 * @param oldValue
 * @returns
 */
declare function trigger(target: PlainObject, key: string | symbol, newValue: any, oldValue: any): void;

declare function isFunc(ins: any): ins is CommonFunc;
declare const EMPTY_OBJECT: any;
declare function isReferenceType(ins: any): ins is object;
declare function hasChanged(ins1: any, ins2: any): boolean;
declare const nextTick: (cb: CommonFunc) => void;

export { CommonFunc, EMPTY_OBJECT, PlainObject, ReactiveEffect, ReactiveEffectFunc, ReactiveIdentification, ReactiveTargetMarker, WatcherFlush, WatcherOptions, activeEffect, createGetter, createSetter, effect, effectStack, hasChanged, isFunc, isPauseTracking, isReactive, isReferenceType, nextTick, objEffectWeakMap, reactive, reactiveTargetMap, track, trackEffect, trigger, watch };
