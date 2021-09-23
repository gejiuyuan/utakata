import { activeEffect, ReactiveEffect } from "./effect";
import { PlainObject } from "./typing";
import { hasChanged } from "./utils";

export const objEffectWeakMap = new WeakMap<
  object,
  Map<
    string | symbol,
    Set<InstanceType<typeof ReactiveEffect>>
  >
>();

export function track(target: PlainObject, key: string | symbol) {
  let effectDepMap = objEffectWeakMap.get(target);
  if (!effectDepMap) {
    objEffectWeakMap.set(target, effectDepMap = new Map());
  }
  let effectFuncDeps = effectDepMap.get(key);
  if (!effectFuncDeps) {
    effectDepMap.set(key, effectFuncDeps = new Set([activeEffect!]))
  } else {
    effectFuncDeps.add(activeEffect!);
  }
}

export function trigger(target: PlainObject, key: string | symbol, newValue: any, oldValue: any) {
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
      effectFunc.schduler?.() || effectFunc.run();
    });
  }
}

