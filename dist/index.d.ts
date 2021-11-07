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
    func: ReactiveEffectFunc;
    schduler: CommonFunc | null;
    constructor(func: ReactiveEffectFunc, schduler?: CommonFunc | null);
    run(): any;
}
declare function effect(func: ReactiveEffectFunc, options?: {
    lazy?: boolean;
}): () => any;
declare enum WatcherFlush {
    async = "async",
    sync = "sync"
}
interface WatcherOptions {
    flush?: WatcherFlush;
    immediate?: boolean;
}
declare function watch(targetSource: () => ReactiveIdentification | ReactiveIdentification[], cb: CommonFunc, options?: WatcherOptions): void;

declare const objEffectWeakMap: WeakMap<object, Map<string | symbol, Set<ReactiveEffect>>>;
declare function track(target: PlainObject, key: string | symbol): void;
declare function trigger(target: PlainObject, key: string | symbol, newValue: any, oldValue: any): void;

declare function isFunc(ins: any): ins is CommonFunc;
declare const EMPTY_OBJECT: any;
declare function isReferenceType(ins: any): ins is object;
declare function hasChanged(ins1: any, ins2: any): boolean;
declare const nextTick: (cb: CommonFunc) => void;

export { CommonFunc, EMPTY_OBJECT, PlainObject, ReactiveEffect, ReactiveEffectFunc, ReactiveIdentification, ReactiveTargetMarker, WatcherFlush, WatcherOptions, activeEffect, createGetter, createSetter, effect, effectStack, hasChanged, isFunc, isReactive, isReferenceType, nextTick, objEffectWeakMap, reactive, reactiveTargetMap, track, trigger, watch };
