import type { ReactiveEffect } from "../effect";
import type { ReactiveTargetMarker } from "../utils";

export type CommonFunc = (...args: any[]) => any;

export type PlainObject<T = any> = Record<string, T>;

export type ComputedGetter<T> = (...args:any[]) => T;

export type ComputedSetter<T> = (value: T) => void;

export type ComputedOptions<T> = {
  get:ComputedGetter<T>,
  set: ComputedSetter<T>,
}

export type RefCommon<T> = {
  deps?: Set<ReactiveEffect>,
  value: T
}

export type WatcherSourceGetter = () => ReactiveIdentification | ReactiveIdentification[];

export type ReactiveIdentification<T extends object = object> = T & PlainObject & {
  readonly [ReactiveTargetMarker.__REACTIVE__]?: boolean;
}
