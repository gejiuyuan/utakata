import { CommonFunc } from "../typing";

export function isFunc(ins: any): ins is CommonFunc {
  return typeof ins === 'function';
}

export const EMPTY_OBJECT = Object.create(null);

export function isReferenceType(ins: any): ins is object {
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