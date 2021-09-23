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

let activeEffect;
const effectStack = [];
class ReactiveEffect {
    constructor(func, schduler = null) {
        this.func = func;
        this.schduler = schduler;
        this.func = func;
        this.schduler = schduler;
    }
    run() {
        if (!effectStack.includes(this)) {
            try {
                effectStack.push(activeEffect = this);
                return this.func();
            }
            finally {
                effectStack.pop();
                const { length } = effectStack;
                activeEffect = length > 0 ? effectStack[length - 1] : void 0;
            }
        }
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
var WatcherFlush;
(function (WatcherFlush) {
    WatcherFlush["async"] = "async";
    WatcherFlush["sync"] = "sync";
})(WatcherFlush || (WatcherFlush = {}));
const watcherFlushValues = Object.values(WatcherFlush);
function watch(targetSource, cb, options = EMPTY_OBJECT) {
    if (!isFunc(cb)) {
        console.error(`The second parameter of 'watch' ———— 'cb' must be a function!`);
        return;
    }
    const { flush = WatcherFlush.async, immediate = false } = options;
    const targetValueGetter = () => targetSource();
    let oldValue = {};
    const baseJob = () => {
        const newValue = _effect.run();
        if (hasChanged(newValue, oldValue)) {
            cb.apply(null, [newValue, oldValue]);
            oldValue = newValue;
        }
    };
    if (!watcherFlushValues.includes(flush)) {
        console.warn(`The 'flush' parameter value of 'watch' options should be one of the two options: ${watcherFlushValues.join('、')}`);
    }
    const schduler = flush === WatcherFlush.async ? () => nextTick(baseJob) : baseJob;
    const _effect = new ReactiveEffect(targetValueGetter, schduler);
    if (immediate) {
        schduler();
    }
    else {
        oldValue = _effect.run();
    }
}

const objEffectWeakMap = new WeakMap();
function track(target, key) {
    let effectDepMap = objEffectWeakMap.get(target);
    if (!effectDepMap) {
        objEffectWeakMap.set(target, effectDepMap = new Map());
    }
    let effectFuncDeps = effectDepMap.get(key);
    if (!effectFuncDeps) {
        effectDepMap.set(key, effectFuncDeps = new Set([activeEffect]));
    }
    else {
        effectFuncDeps.add(activeEffect);
    }
}
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
            ((_a = effectFunc.schduler) === null || _a === void 0 ? void 0 : _a.call(effectFunc)) || effectFunc.run();
        });
    }
}

const __REACTIVE__ = '__reactive__';
const isReactive = (value) => {
    return isReferenceType(value) ? Reflect.get(value, __REACTIVE__) : false;
};
function reactive(value) {
    if (!isReferenceType(value)) {
        console.warn(`The parameter of 'reactive' must be a object!`);
        return;
    }
    if (isReactive(value)) {
        return value;
    }
    const proxyObj = new Proxy(value, {
        get: createGetter(),
        set: createSetter(),
    });
    Reflect.defineProperty(proxyObj, __REACTIVE__, {
        configurable: false,
        enumerable: false,
        get: () => true,
    });
    return proxyObj;
}
function createGetter() {
    return (target, key, receiver) => {
        track(target, key);
        return Reflect.get(target, key);
    };
}
function createSetter() {
    return (target, key, newValue) => {
        const oldValue = Reflect.get(target, key);
        let result = true;
        if (hasChanged(newValue, oldValue)) {
            trigger(target, key, newValue, oldValue);
            result = Reflect.set(target, key, newValue);
        }
        return result;
    };
}

export { EMPTY_OBJECT, ReactiveEffect, WatcherFlush, __REACTIVE__, activeEffect, createGetter, createSetter, effect, effectStack, hasChanged, isFunc, isReactive, isReferenceType, nextTick, objEffectWeakMap, reactive, track, trigger, watch };