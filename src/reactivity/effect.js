
const targetMap = new Map()
let activeEffect;
const effectStack = []

 export const effect = (fn, scheduler = null) => {
    const effectFn = () => {
        try{
            effectStack.push(effectFn)
            // 赋值后可以 return
            activeEffect = effectFn
            return fn()
        } finally {
            effectStack.pop()
            activeEffect = effectStack[effectStack.length - 1]
        }
    }
    effectFn()

    // 挂在调度函数
    if(scheduler) {
        effectFn.scheduler = scheduler;
    }

    return effectFn
}

// 收集阶段
 export const track = (target,key) => {
    if(!activeEffect) {
        return; 
    }
    let depsMap = targetMap.get(target)
    if(!depsMap) {
        depsMap = new Map()
        targetMap.set(target,depsMap)
    }
    let deps = depsMap.get(key)
    if(!deps) {
        deps = new Set()
        depsMap.set(key, deps)
    }
    // 保存
    deps.add(activeEffect)
}

// 更新阶段
 export const trigger = (target, key) => {
    // 获取目标是否存在
    const depsMap = targetMap.get(target)
    if(!depsMap) {
        return;
    }
    const deps = depsMap.get(key)
    if(!deps) {
        return;
    }
    deps.forEach( effectFn => {
        // 存在调度函数，优先处理调度函数
        // 否则执行 effect 本身
        effectFn.scheduler ? effectFn.scheduler(effectFn) : effectFn();
    });
}
