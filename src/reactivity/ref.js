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