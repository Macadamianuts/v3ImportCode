import { effect, trigger, track } from "./effect.js";
import { ref } from "./ref.js"

export const computed = getter => {
    return new ComputedRefImpl(getter)
}

class ComputedRefImpl {
    constructor(getter) {
        this._dirty = true
        this.effect = effect(getter, () => {
            if(!this._dirty) {
                // 当我们的锁打开的时候进入
                this._dirty = true
                trigger(this, "value")
            }
        })
    }
    get value() {
        if(this._dirty) {
            this._value = this.effect()
            // 锁上
            this._dirty = false
            track(this, "value")
        }
        return this._value
    }
}

const b = ref(1)
const c = computed(() => b.value + (Math.random().toFixed(2) - ''))

const fn = effect( () => {
    console.log(`c的值 ${c.value}`);
})

fn()
fn()

b.value = 10
b.value = 20