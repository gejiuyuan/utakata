import { track, trigger } from "./deps";
import { PlainObject } from "./typing";
import { hasChanged, isReferenceType } from "./utils";

export type ReactiveValue<T extends object = {}> = T & PlainObject & {
  readonly __reactive__: boolean;
}

export const __REACTIVE__ = '__reactive__';

export const isReactive = (value: any): value is ReactiveValue => {
  return isReferenceType(value) ? Reflect.get(value, __REACTIVE__) : false;
}

export function reactive<T extends object>(value: T): ReactiveValue<T> | undefined {
  if (!isReferenceType(value)) {
    console.warn(`The parameter of 'reactive' must be a object!`);
    return;
  }
  if (isReactive(value)) {
    return value;
  }
  const proxyObj = new Proxy(value as ReactiveValue<T>, {
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

export function createGetter<T extends PlainObject>() {
  return (target: T, key: string | symbol, receiver: T) => {
    track(target, key);
    return Reflect.get(target, key);
  }
}

export function createSetter<T extends PlainObject>() {
  return (target: T, key: string | symbol, newValue: any) => {
    const oldValue = Reflect.get(target, key);
    let result = true;
    if (hasChanged(newValue, oldValue)) {
      result = Reflect.set(target, key, newValue);
      trigger(target, key, newValue, oldValue);
    }
    return result;
  }
}