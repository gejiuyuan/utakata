import { track, trigger } from "./deps";
import type { PlainObject, ReactiveIdentification } from "./typing";
import { hasChanged, isReferenceType, ReactiveTargetMarker } from "./utils";

export const reactiveTargetMap = new WeakMap<ReactiveIdentification, any>();

export function reactive<T extends object>(value: T): ReactiveIdentification<T> | undefined {
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
  const proxyObj = new Proxy<ReactiveIdentification<T>>(value, {
    get: createGetter(),
    set: createSetter(),
  });
  /**
   * 可配置以便可删除
   */
  Reflect.defineProperty(proxyObj, ReactiveTargetMarker.__REACTIVE__, {
    configurable: true,
    enumerable: false,
    get: () => true,
  });
  reactiveTargetMap.set(value, proxyObj);
  return proxyObj;
}

export function createGetter<T extends PlainObject>() {
  return function get(target: T, key: string | symbol, receiver: T) {
    const res = Reflect.get(target, key);
    track(target, key);
    if (isReferenceType(res)) {
      return reactive(res);
    }
    return res;
  }
}

export function createSetter<T extends PlainObject>() {
  return function set(target: T, key: string | symbol, newValue: any) {
    const oldValue = Reflect.get(target, key);
    let result = true;
    if (hasChanged(newValue, oldValue)) {
      result = Reflect.set(target, key, newValue);
      trigger(target, key, newValue, oldValue);
    }
    return result;
  }
}