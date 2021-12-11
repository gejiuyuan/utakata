export type CommonFunc = (...args: any[]) => any;

export type PlainObject<T = any> = Record<string, T>;


export type ComputedGetter<T> = (...args:any[]) => T;

export type ComputedSetter<T> = (value: T) => void;

export type ComputedOptions<T> = {
  get:ComputedGetter<T>,
  set: ComputedSetter<T>,
}