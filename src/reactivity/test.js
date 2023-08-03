import { effect, trigger, track } from "./effect.js";
import { ref } from './ref.js'
import { computed } from "./computed.js";

const count = ref(1)

effect(() => {
    console.log(`count.value的值 ${count.value}`);
})

console.log("------------- 下面是测试 computed 缓存机制使用 -------------");

const a = ref(0);
const b = computed(() => a.value + (Math.random().toFixed(2) - ''));

const fn = effect(() => {
    console.log(`b.value: ${b.value}`);
});

console.log('开始');

fn();
fn();

a.value = 10;
a.value = 20;

console.log('结束');