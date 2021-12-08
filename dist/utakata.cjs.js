'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function isFunc(ins) {
    return typeof ins === 'function';
}
const EMPTY_OBJECT = Object.create(null);
function isReferenceType(ins) {
    return Object(ins) === ins;
}
function hasChanged(ins1, ins2) {
    return !Object.is(ins1, ins2);
}
const nextTick = (() => {
    const { queueMicrotask, Promise } = globalThis || window || global || self;
    if (queueMicrotask) {
        return function nextTick(cb) {
            return queueMicrotask(cb);
        };
    }
    return function nextTick(cb) {
        return Promise.resolve().then(cb);
    };
})();

exports.activeEffect = void 0;
const effectStack = [];
class ReactiveEffect {
    constructor(
    /**
     * effect、watch等API的回调（侦听处理器）
     */
    func, 
    /**
     * 异步调度器（优先级高于run）
     */
    schduler = null) {
        this.func = func;
        this.schduler = schduler;
        /**
         * effect副作用对象的deps依赖项
         */
        this.deps = [];
    }
    /**
     * 清空effect副作用对象的deps依赖项
     * @param effect
     * @description
     *  用以终止响应式监听器
     */
    static cleanUpEffect(effect) {
        const { deps } = effect;
        deps.forEach((dep) => {
            dep.delete(effect);
        });
        deps.length = 0;
    }
    /**
     * 侦听器执行者
     * @returns
     */
    run() {
        if (!effectStack.includes(this)) {
            try {
                effectStack.push(exports.activeEffect = this);
                return this.func();
            }
            finally {
                effectStack.pop();
                const { length } = effectStack;
                exports.activeEffect = length > 0 ? effectStack[length - 1] : void 0;
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
function effect(func, options) {
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
exports.WatcherFlush = void 0;
(function (WatcherFlush) {
    /**
     * 异步
     */
    WatcherFlush["async"] = "async";
    /**
     * 同步
     */
    WatcherFlush["sync"] = "sync";
})(exports.WatcherFlush || (exports.WatcherFlush = {}));
const watcherFlushValues = Object.values(exports.WatcherFlush);
/**
 * watch侦听器默认返回的初始值
 */
const INITIAL_WATCHER_VALUE = {};
/**
 * watch响应式侦听器
 * @param targetSource 获取要侦听的响应式数据
 * @param cb 响应式数据更新时，需要处理的任务
 * @param options 执行选项
 * @returns
 */
function watch(targetSource, cb, options = EMPTY_OBJECT) {
    // 如果cb不是函数，终止后续执行
    if (!isFunc(cb)) {
        console.error(`The second parameter of 'watch' ———— 'cb' must be a function!`);
        return;
    }
    // 默认触发机制：响应式数据更新后，异步执行回调任务
    const { flush = exports.WatcherFlush.async, immediate = false } = options;
    // 获取响应式数据的值
    const targetValueGetter = () => targetSource();
    // 旧值
    let oldValue = INITIAL_WATCHER_VALUE;
    // 侦听器的核心处理任务
    const baseJob = () => {
        // 获取响应式数据更新后的值
        const newValue = _effect.run();
        // 如果新值与旧值不同，就执行回调任务
        if (hasChanged(newValue, oldValue)) {
            cb.apply(null, [newValue, oldValue === INITIAL_WATCHER_VALUE ? void 0 : oldValue]);
            // 同时将新值为旧值
            oldValue = newValue;
        }
    };
    if (!watcherFlushValues.includes(flush)) {
        console.warn(`The 'flush' parameter value of 'watch' options should be one of the two options: ${watcherFlushValues.join('、')}`);
    }
    // 调度器（可能是异步，也可能是同步）
    const schduler = flush === exports.WatcherFlush.async ? () => nextTick(baseJob) : baseJob;
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
    return () => {
        _effect.stop();
    };
}

/**
 * 响应式数据收集的依赖集合
 */
const objEffectWeakMap = new WeakMap();
// 是否应该收集依赖
let shouldTrack = true;
/**
 * 是否应该暂停追踪依赖
 * @returns
 * @description
 *  不应该收集的条件：
 *    1、activeEffect为undefined
 *    2、shouldTrack为false
 */
function isPauseTracking() {
    return !shouldTrack && exports.activeEffect === void 0;
}
/**
 * 响应式数据依赖收集
 * @param target
 * @param key
 * @returns
 */
function track(target, key) {
    if (isPauseTracking()) {
        return;
    }
    let effectDepMap = objEffectWeakMap.get(target);
    if (!effectDepMap) {
        objEffectWeakMap.set(target, effectDepMap = new Map());
    }
    let effectFuncDeps = effectDepMap.get(key);
    if (!effectFuncDeps) {
        effectDepMap.set(key, effectFuncDeps = new Set([exports.activeEffect]));
    }
    trackEffect(effectFuncDeps);
}
function trackEffect(effectFuncDeps) {
    // 防止重复收集
    shouldTrack = !effectFuncDeps.has(exports.activeEffect);
    if (shouldTrack) {
        effectFuncDeps.add(exports.activeEffect);
        // 同时建立响应式数据依赖与activeEffect的双向映射
        exports.activeEffect.deps.push(effectFuncDeps);
    }
}
/**
 * 触发响应式数据更新时的任务
 * @param target
 * @param key
 * @param newValue
 * @param oldValue
 * @returns
 */
function trigger(target, key, newValue, oldValue) {
    const targetDepMap = objEffectWeakMap.get(target);
    if (!targetDepMap) {
        return;
    }
    const targetEffectFuncSet = targetDepMap.get(key);
    if (!targetEffectFuncSet) {
        return;
    }
    if (hasChanged(newValue, oldValue)) {
        Array.from(targetEffectFuncSet).forEach(effectFunc => {
            var _a;
            // 优先执行调度器任务，其次是基础获取任务
            ((_a = effectFunc.schduler) === null || _a === void 0 ? void 0 : _a.call(effectFunc)) || effectFunc.run();
        });
    }
}

exports.ReactiveTargetMarker = void 0;
(function (ReactiveTargetMarker) {
    ReactiveTargetMarker["__REACTIVE__"] = "__reactive__";
})(exports.ReactiveTargetMarker || (exports.ReactiveTargetMarker = {}));
const isReactive = (value) => {
    return isReferenceType(value) ? Reflect.get(value, exports.ReactiveTargetMarker.__REACTIVE__) : false;
};
const reactiveTargetMap = new WeakMap();
function reactive(value) {
    if (!isReferenceType(value)) {
        console.warn(`The parameter of 'reactive' must be a object!`);
        return;
    }
    // if (isReactive(value)) {
    //   return value;
    // }
    /**
     * 如果已经是Proxy，直接返回
     */
    const targetIsProxy = reactiveTargetMap.get(value);
    if (targetIsProxy) {
        return targetIsProxy;
    }
    const proxyObj = new Proxy(value, {
        get: createGetter(),
        set: createSetter(),
    });
    /**
     * 可配置以便可删除
     */
    Reflect.defineProperty(proxyObj, exports.ReactiveTargetMarker.__REACTIVE__, {
        configurable: true,
        enumerable: false,
        get: () => true,
    });
    reactiveTargetMap.set(value, proxyObj);
    return proxyObj;
}
function createGetter() {
    return function get(target, key, receiver) {
        const res = Reflect.get(target, key);
        track(target, key);
        if (isReferenceType(res)) {
            return reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, newValue) {
        const oldValue = Reflect.get(target, key);
        let result = true;
        if (hasChanged(newValue, oldValue)) {
            result = Reflect.set(target, key, newValue);
            trigger(target, key, newValue, oldValue);
        }
        return result;
    };
}

exports.EMPTY_OBJECT = EMPTY_OBJECT;
exports.ReactiveEffect = ReactiveEffect;
exports.createGetter = createGetter;
exports.createSetter = createSetter;
exports.effect = effect;
exports.effectStack = effectStack;
exports.hasChanged = hasChanged;
exports.isFunc = isFunc;
exports.isPauseTracking = isPauseTracking;
exports.isReactive = isReactive;
exports.isReferenceType = isReferenceType;
exports.nextTick = nextTick;
exports.objEffectWeakMap = objEffectWeakMap;
exports.reactive = reactive;
exports.reactiveTargetMap = reactiveTargetMap;
exports.track = track;
exports.trackEffect = trackEffect;
exports.trigger = trigger;
exports.watch = watch;
