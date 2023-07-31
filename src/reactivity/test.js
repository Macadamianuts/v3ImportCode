import { effect, trigger, track } from "./effect.js";
import { ref } from './ref.js'

const count = ref(1)

effect(() => {
    console.log(`count.value的值 ${count.value}`);
})
