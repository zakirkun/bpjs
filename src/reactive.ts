export function reactive<T extends Record<string, any>>(obj: T): T {
  return new Proxy(obj, {
    get(target, prop, receiver) {
      track(target, prop as string);
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      const result = Reflect.set(target, prop, value, receiver);
      trigger(target, prop as string);
      return result;
    }
  });
}

type Dep = Set<Function>;
const targetMap = new WeakMap<any, Map<string, Dep>>();

let activeEffect: Function | null = null;

export function effect(fn: Function) {
  const effectFn = () => {
    activeEffect = effectFn;
    fn();
    activeEffect = null;
  };
  effectFn();
}

function track(target: any, prop: string) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(prop);
  if (!dep) {
    dep = new Set();
    depsMap.set(prop, dep);
  }
  if (activeEffect) {
    dep.add(activeEffect);
  }
}

function trigger(target: any, prop: string) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const dep = depsMap.get(prop);
  if (dep) {
    dep.forEach(effect => effect());
  }
}