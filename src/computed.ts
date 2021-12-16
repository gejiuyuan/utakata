import { trackRef, triggerRef } from "./deps";
import { ReactiveEffect } from "./effect";
import { ComputedSetter, ComputedGetter, ComputedOptions } from "./typing";
import { isFunc } from './utils';

export class ComputedImplement<T> {

  deps!: Set<ReactiveEffect>;

  private _refresh = true;

  private _value!: T;

  private effect: InstanceType<typeof ReactiveEffect>;

  constructor(
    private readonly getter: ComputedGetter<T>,
    private readonly setter?: ComputedSetter<T>
  ) {
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._refresh) {
        this._refresh = true;
        triggerRef(this);
      }
    })
  }

  get value() {
    trackRef(this);
    if (this._refresh) {
      this._refresh = false;
      this._value = this.effect.run();
    }
    return this._value;
  }

  set value(value: T) {
    this.setter?.(value);
  }

}


export function computed<T>(
  getter: ComputedGetter<T>,
): ComputedImplement<T>;
export function computed<T>(
  options: ComputedOptions<T>,
): ComputedImplement<T>;
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | ComputedOptions<T>
) {
  const getter = isFunc(getterOrOptions) ? getterOrOptions : getterOrOptions.get;
  const setter = isFunc(getterOrOptions) ? void 0 : getterOrOptions.set;
  const computedImplIns = new ComputedImplement(getter, setter);
  return computedImplIns;
}