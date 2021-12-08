import { activeEffect, ReactiveEffect } from "./effect";
import { PlainObject } from "./typing";
import { hasChanged } from "./utils";

/**
 * 响应式数据收集的依赖集合
 */
export const objEffectWeakMap = new WeakMap<
  object,
  Map<
    string | symbol,
    Set<InstanceType<typeof ReactiveEffect>>
  >
>();

// 是否应该收集依赖
let shouldTrack = true;

/**
 * 是否应该暂停追踪依赖
 * @returns 
 * @description
 *  不应该收集的条件：
 *    1、activeEffect为undefined
 *    2、shouldTrack为false
 */
export function isPauseTracking() {
  return !shouldTrack && activeEffect === void 0;
}

/**
 * 响应式数据依赖收集
 * @param target 
 * @param key 
 * @returns 
 */
export function track(target: PlainObject, key: string | symbol) {
  if (isPauseTracking()) {
    return;
  }
  let effectDepMap = objEffectWeakMap.get(target);
  if (!effectDepMap) {
    objEffectWeakMap.set(target, effectDepMap = new Map());
  }
  let effectFuncDeps = effectDepMap.get(key);
  if (!effectFuncDeps) {
    effectDepMap.set(key, effectFuncDeps = new Set([activeEffect!]))
  }  
  trackEffect(effectFuncDeps);
}

export function trackEffect(effectFuncDeps: Set<ReactiveEffect>) {
  // 防止重复收集
  shouldTrack = !effectFuncDeps.has(activeEffect!);
  if (shouldTrack) {
    effectFuncDeps.add(activeEffect!);
    // 同时建立响应式数据依赖与activeEffect的双向映射
    activeEffect!.deps.push(effectFuncDeps);
  }
}

/**
 * 触发响应式数据更新时的任务
 * @param target 
 * @param key 
 * @param newValue 
 * @param oldValue 
 * @returns 
 */
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
      // 优先执行调度器任务，其次是基础获取任务
      effectFunc.schduler?.() || effectFunc.run();
    });
  }
}

