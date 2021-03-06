import { trackRef, triggerRef } from "./deps";
import { ReactiveEffect } from "./effect";
import type { ComputedSetter, ComputedGetter, ComputedOptions } from "./typing";
import { isFunc } from './utils';

export class ComputedImplement<T> {

  readonly __isRef__ = true;

  /**
   * 此处必须初始化赋值，否则编译成js后将不存在该属性
   */
  deps?: Set<ReactiveEffect> = void 0;

  private _refresh = true;

  private _value!: T;

  private effect: InstanceType<typeof ReactiveEffect>;

  constructor(
    private readonly getter: ComputedGetter<T>,
    private readonly setter?: ComputedSetter<T>
  ) {
    this.effect = new ReactiveEffect(this.getter, () => {
      if (!this._refresh) {
        this._refresh = true;
        triggerRef(this);
      }
    })
    Reflect.defineProperty(this, '__isRef__', {
      configurable: false,
      enumerable: false,
    });
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