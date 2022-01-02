import type { CommonFunc, PlainObject, ReactiveIdentification, RefCommon } from "../typing";

export function isFunc(ins: any): ins is CommonFunc {
  return typeof ins === 'function';
}

export function NOOP(...args: any[]):any {}

export const isArray = Array.isArray;

export const isBoolean = (val: any): val is boolean => typeof val === 'boolean';

export const isObject = (val: any): val is PlainObject => typeof val === 'object' && val !== null;

export const isSet = (val: any): val is Set<unknown> => val instanceof Set;

export const isMap = (val: any): val is Map<unknown, unknown> => val instanceof Map;

export const EMPTY_OBJECT = Object.create(null);

export function isReferenceType(ins: any) {
  return Object(ins) === ins;
}

export function hasChanged(ins1: any, ins2: any) {
  return !Object.is(ins1, ins2);
}

export const nextTick = (() => {
  const { queueMicrotask, Promise } = globalThis || window || global || self;
  if (queueMicrotask) {
    return function nextTick(cb: CommonFunc) {
      return queueMicrotask(cb);
    }
  }
  return function nextTick(cb: CommonFunc) {
    return Promise.resolve().then(cb);
  }
})();

export function isRef<T>(ins: any): ins is RefCommon<T> {
  return ins.__isRef__ === true && Reflect.has(ins, 'deps') && Reflect.has(ins, 'value');
}


export enum ReactiveTargetMarker {
  __REACTIVE__ = '__reactive__',
}

export const isReactive = (value: any): value is ReactiveIdentification => {
  return isReferenceType(value) ? Reflect.get(value, ReactiveTargetMarker.__REACTIVE__) : false;
}