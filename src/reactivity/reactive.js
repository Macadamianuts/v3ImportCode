import {effect, track, trigger} from './effect'

export const reactive = target => {
    return new Proxy(target, {
        get(target,key,receiver) {
            let res = Reflect.get(target,key,receiver)
            console.log("数据收集");
            track(target,key)
            return res
        },
        set(target, key, receiver) {
            let res = Reflect.set(target, key, receiver)
            console.log("数据更新");
            trigger(target,key)
            return res
        }
    })
}