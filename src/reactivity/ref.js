import { effect,trigger,track } from "./effect.js";
export const ref = value => {
    return new RefImpl(value)
}

class RefImpl {
    constructor(value) {
        this._value = value
    }
    get value() {
        track(this, "value")
        return this._value
    }
    set value(newValue) {
        this._value = newValue
        trigger(this, "value")
    }
}

// 代理 ref
// 自动解构 ref
// 比如在 template 里使用 ref 就不需要加 .value
export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, shallowUnwrapHandlers);
}

export function isRef(value) {
  return !!(value && value.__isRef);
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}