// 导入 reactive 动态更新组件值
import { reactive  } from "../reactivity/reactive.js";
import { effect } from "../reactivity/effect.js";
import { ref } from '../reactivity/ref.js'

const SHAPEFLAG = {
    ELEMENT : 1,
    TEXT: 1 << 1,
    TEXT_CHILDREN: 1 << 2,
    ARRAY_CHILDREN: 1 << 3,
    COMPONENT: 1 << 4,
}

const Text = Symbol('Text')

// 创建 vnode
const h = (type, props, children) => {
    // 标记
    let shapeFlag = 0;

    if (typeof type === "string") {
        shapeFlag |= SHAPEFLAG.ELEMENT;
    } else if (type === Text) {
        shapeFlag |= SHAPEFLAG.TEXT;
    } else {
        shapeFlag |= SHAPEFLAG.COMPONENT;
    }

    // 正确检查子节点类型并设置Text vnode的shapeFlag
    if (typeof children === "string") {
        shapeFlag |= SHAPEFLAG.TEXT_CHILDREN;
    } else if (typeof children === "number") {
        shapeFlag |= SHAPEFLAG.TEXT_CHILDREN;
        children = children + '';
    } else if (Array.isArray(children)) {
        shapeFlag |= SHAPEFLAG.ARRAY_CHILDREN;
    }

    return {
        type,
        props,
        children,
        shapeFlag,
        el: null,
        key: props && props.key
    };
};

// 判断是不是一个事件 ‘on’ 开头
const eventReg = /^on[A-Z]/

const render = (vnode, container) => {
    // 旧节点
    const prevNode = container._vnode || null // 设置为null，防止初始渲染时没有旧节点

    if (vnode) {
        if (prevNode) {
            patch(prevNode, vnode, container);
        } else {
            mount(vnode, container);
        }
        container._vnode = vnode;  // 更新当前 vnode
    } else {
        prevNode && unmount(prevNode);
        container._vnode = null;
    }
}

// processTextNode
const processTextNode = (oldNode, newNode, container) => {
    if(oldNode) {
        patchTextNode(oldNode, newNode)
    } else {
        mountTextNode(newNode, container)
    }
}

// processElement
const processElement = (oldNode, newNode, container) => {
    if(oldNode) {
        patchElementNode(oldNode, newNode)
    } else {
        mountElementNode(newNode, container)
    }
}

// patch 对比操作
const patch = (oldNode, newNode, container) => {

    if (oldNode && oldNode.type !== newNode.type) {
        unmount(oldNode);
        oldNode = null;
    }

    const { shapeFlag } = newNode
    if(shapeFlag & SHAPEFLAG.TEXT) {
        processTextNode(oldNode, newNode, container)
    } else if(shapeFlag & SHAPEFLAG.ELEMENT) {
        processElement(oldNode, newNode, container)
    } else if(shapeFlag & SHAPEFLAG.COMPONENT) {
        console.log("----test----");
        // 组件挂载
        processComponent(oldNode, newNode, container)
    }
}

// processComponent 组件挂载
const processComponent = (oldNode, newNode, container) => {
    if(oldNode) {
        // 组件更新
        updateComponent()
    } else {
        // 组件挂载
        mountComponent(newNode, container)
    }
}

// patchTextNode
const patchTextNode = (oldNode, newNode) => {
    newNode.el = oldNode.el
    oldNode.el.textContent = newNode.children
}

// patchElementNode
const patchElementNode = (oldNode, newNode) => {
    newNode.el = oldNode.el

    //
    patchProps(oldNode.props, newNode.props, newNode.el)
    patchChildren(oldNode, newNode, newNode.el)
}


// patchChildren 处理子节点
const patchChildren = (oldNode, newNode, container) => {
    const { shapeFlag: prevShapeFlag, children: prevChildren } = oldNode
    const { shapeFlag: nextShapeFlag, children: nextChildren } = newNode

    if(prevShapeFlag & SHAPEFLAG.TEXT_CHILDREN) {
        if(nextShapeFlag & SHAPEFLAG.TEXT_CHILDREN) {
            container.textContent = nextChildren
        } else if(nextShapeFlag & SHAPEFLAG.ARRAY_CHILDREN) {
            container.textContent = '';
            mountChildren(nextChildren, container)
        } else {
            container.textContent = '';
        }
    } else if(prevShapeFlag & SHAPEFLAG.ARRAY_CHILDREN) {
        if(nextShapeFlag & SHAPEFLAG.TEXT_CHILDREN) {
            unmountChildren(prevChildren)
            container.textContent = nextChildren
        } else if(nextShapeFlag & SHAPEFLAG.ARRAY_CHILDREN) {
            // diff
            // 假设第一个元素有 key 则都有 key
            if (prevChildren.length > 0 && prevChildren[0].key && nextChildren[0].key) {
                patchKeyChildren(oldNode, newNode, container);
            } else {
                patchArrayChildren(prevChildren, nextChildren, container)
            }
        } else {
            unmountChildren(nextChildren, container)
        }
    }
}

// patchKeyChildren 处理 diff 算法
const patchKeyChildren = (oldChild, newChild, container) => {
    // 预处理: 头指针、尾指针
    // 头指针
    let i = 0;
    // 尾指针
    let e1 = oldChild.length - 1
    let e2 = newChild.length - 1

    // 预处理
    // 头指针移动
    while(i <= e1 && i<= e2 && oldChild[i].key === newChild[i].key) { // 还需要比较两者的 key 是否相等再进行移动
        patch(oldChild[i], newChild[i], container);
        i++
    }

    // 尾指针
    while(i <= e1 && i<= e2 && oldChild[e1].key === newChild[e2].key) {
        patch(oldChild[e1], newChild[e2], container);
        e1 --;
        e3 --;
    }

    // 两种情况：
    // 情况 1：i > e1 & i <= e2 ==> i 和 e2 中间不服就是需要挂在到新节点;
    if (i > e1 & i <= e2) {
        for(let j = i; j<= e2; j++) { // 过程持续
            patch(null, newChild[j],container)
        }
    }
    // 情况 2：i < e2 & i <= e1 ==> i 与 e1 中间部分需要卸载的旧节点；
    else if (i < e2 & i <= e1) {
        for(let j = i; j<= e2; j++) { // 过程持续
            unmount(oldChild[j])
        }
    } else {
        // diff 关键部分
        const s1 = i
        const s2 = i

        // 1. 初始化 keyToNewIndexMap
        const keyToNewIndexMap = new Map()

        for(let i = se; i <= e2; i++) {
            keyToNewIndexMap.set(newChild[i].key, i)
        }

        let patched = 0 // 当前已经配置了多少个节点
        let moved = false // 是否需要移动位置
        let maxNewIndex = 0 // 判断是否是上升趋势
        /*
            a ( b c d ) e
            a ( c d b ) e
        */
        let toPatched = e2 - s2 + 1 // 需要被 patch 的节点数量

        const newIndexToOldIndexMap = new Array(toPatched).fill(-1)

        for(let i = s1; i<= e1; i++) {
            const prevChild = oldChild[i]
            // 做一个判断去做卸载
            if(patched > toPatched) {
                unmount(prevChild)
                continue
            }
            // 2. 根据 keyToNewIndexMap 获取 newIndex
            let newIndex = keyToNewIndexMap.get(prevChild.key)

            if(newIndex === undefined) {
                unmount(prevChild)
            } else {
                // 3. 根据 newIndex 更新 newIndexToOldIndexMap
                newIndexToOldIndexMap[newIndex - s2] = i

                // 判断是否上升趋势
                if(newIndex >= maxNewIndex) {
                    maxNewIndex = newIndex
                } else {
                    moved = true
                }
                patch(prevChild, newChild[newIndex], container)
                patched ++;
            }
        }

        // 移动
        const seq = getSequence(newIndexToOldIndexMap)
        let j = seq.length -1;
        // 具体索引需要移动的位置
        for(let i = newIndexToOldIndexMap.length - 1; i >= 0; i--) {
            if(newIndexToOldIndexMap[i] === -1) {
                patch(null,oldChild[i + s2] ,container)
            }else if(moved) {
                if(j < 0 || i !== seq[j]) {
                    // 移动函数
                    move(container, oldChild[i + s2].el, oldChild[newIndexToOldIndexMap[i]].el);
                } else {
                    j--
                }
            }
        }

    }
}

// move 移动函数
const move = (container, el, target) => {
    if (el.nextSibling === target) {
        return;
    }
    if (target.nextSibling === el) {
        container.insertBefore(el, target);
    } else {
        container.insertBefore(el, target.nextSibling);
    }
};

// getSequence 获取最优位置
const getSequence = nums => {
    const response = [nums[0]]
    const pops = [0]

    // 保存最优解
    for(let i = 1; i < nums.length; i++) {
        if(nums[i] === -1) {
            pops.push(-1)
            continue
        }

        if(nums[i] > response[response.length - 1]) {
            response.push(nums[i])
            pops.push(response.length - 1)
        } else {
            for(let j = 0; j < response.length; j++) {
                if(response[j] > nums[i]) {
                    response[j] = nums[i];
                    pops.push(j)
                    break;
                }
            }
        }
    }
    let cur = response.length - 1;
    for(let i = pops.length -1; i >= 0 && cur >= 0;i--) {
        if(pops[i] === -1) {
            continue
        } else if(pops[i] == cur){
            response[cur] = i;
            cur --;
        }
    }
    return response
}

// patchArrayChildren 处理数组子节点
const patchArrayChildren = (prev, next, container) => {
    const oldLength = prev.length
    const newLength = next.length
    const commonLength = Math.min(oldLength, newLength)

    for(let i = 0; i < commonLength; i++) {
        patch(prev[i], next[i], container)
    }

    if(oldLength > newLength) {
        unmountChildren(prev.slice(commonLength))
    } else if(oldLength < newLength) {
        mountChildren(next.slice(commonLength), container)
    }
}


// patchProps
const patchProps = (oldProps, newProps, el) => {
    if(oldProps === newProps) {
        return
    }

    if (!el) {
        return; // 处理 el 为 null 或 undefined 的情况
    }

    for(const key in oldProps) {
        if(newProps[key] == null) {
            patchDomProps(oldProps[key] , null , key , el)
        }
    }

    for(const key in newProps) {
        const prev = oldProps[key]
        const next = newProps[key]

        if(prev !== next) {
            patchDomProps(prev , next , key , el)
        }
    }
}

// patchDomProps 判断方法
const patchDomProps = (prev , next , key , el) => {
    if (!el) {
        return; // 处理 el 为 null 或 undefined 的情况
    }
    switch(key) {
        case 'class':
            el.className = next || '';
            break;
        case 'style':
            if(next == null) {
                el.removeAttribute('style')
            } else {
                if(prev) {
                    for(const styleName in prev) {
                        if(next[styleName] == null) {
                            el.style[styleName] = ''
                        }
                    }
                }
                for(const styleName in next) {
                    el.style[styleName] = next[styleName]
                }
            }
            break;
        default:
            if(eventReg.test(key)) {
                const eventName = key.slice(2).toLowerCase();
                if(prev) {
                    el.removeEventListener(eventName, prev)
                }
                if(next) {
                    el.addEventListener(eventName, next)
                }
            } else {
                if(next == null || next == false) {
                    el.removeAttribute(key)
                }
                if(next) {
                    el.setAttribute(key, next)
                }
            }
            break;
    }
}

// mount
const mount = (vnode, container) => {
    const { shapeFlag } = vnode;
    if(shapeFlag & SHAPEFLAG.TEXT) {
        // 单独调用文本渲染方法
        mountTextNode(vnode, container)
    } else if(shapeFlag & SHAPEFLAG.ELEMENT) {
        // 实现元素节点挂在方法
        mountElementNode(vnode, container)
    } else if( shapeFlag & SHAPEFLAG.COMPONENT) {
        mountComponent(vnode, container)
    }
}

// mountTextNode
const mountTextNode = (vnode, container) => {
    const textNode = document.createTextNode(vnode.children)
    container.appendChild(textNode)

    vnode.el = textNode
}

// mountElementNode
const mountElementNode = (vnode, container) => {
    const {
        type,
        props,
        children,
        shapeFlag,
    } = vnode;

    const el = document.createElement(type);

    mountProps(props, el);

    if (shapeFlag & SHAPEFLAG.TEXT_CHILDREN) {
        mountTextNode(vnode, el);
    } else if (shapeFlag & SHAPEFLAG.ARRAY_CHILDREN) {
        // 修正调用mountChildren处理子节点数组
        mountChildren(children, el);
    }

    // container 添加子元素
    container.appendChild(el);

    vnode.el = el;
};

// mountChildren
const mountChildren = (children, container) => {
    const commonLength = Math.min(children.length, container.childNodes.length);

    for (let i = 0; i < commonLength; i++) {
        const oldChild = container.childNodes[i];
        const newChild = children[i];

        // shouldPatch 判断是否需要对旧子节点和新子节点进行更新
        if (shouldPatch(oldChild, newChild)) {
            patch(oldChild._vnode, newChild, container);
        } else {
            mount(newChild, container);
        }
    }

    // 如果旧子节点比新子节点多，需要将多余的旧子节点卸载
    if (container.childNodes.length > children.length) {
        for (let i = commonLength; i < container.childNodes.length; i++) {
            const oldChild = container.childNodes[i];
            unmount(oldChild._vnode);
        }
    }

    // 如果新子节点比旧子节点多，需要将多余的新子节点挂载
    if (children.length > container.childNodes.length) {
        for (let i = commonLength; i < children.length; i++) {
            const newChild = children[i];
            mount(newChild, container);
        }
    }
};

// 调度定义
let queue = []
let isFlushPending = false // 是否有微任务执行
let currentFlushPromise = null // 正在执行的微任务
let resolvePromise = Promise.resolve() // 调用微任务

// quenueJob
const queueJob = job => {
    // 入队 去重
    if (!queue.includes(job)) {
        queue.push(job)
        quenuFlush()
    }
}

// quenuFlush
const quenuFlush = () => {
    if(!isFlushPending) {
        isFlushPending = true;
        currentFlushPromise = resolvePromise.then(flushJobs)
    }
}

// flushJobs
const flushJobs = async () => {
    try {
        for(const job of queue) {
            await job()
        }
    } finally {
        // 还原操作
        isFlushPending = false
        queue.length = 0
        currentFlushPromise = null
    }
}


const mountComponent = (vnode, container) => {
    const { type: Component } = vnode

    const instance = {
        props: null,
        atrrs: null,
        setupState: null,
        ctx: null,
        subTree: null,
        update: null,
        isMounted: false
    }

    // 初始化 props
    initProps(instance, vnode)

    const { setup } = Component
    if(setup) {
        // 保存setup返回的响应式对象，确保在组件更新时保持响应式状态
        instance.setupState = setup();
        instance.ctx = instance.setupState;
    }

    instance.update = effect(() => {
            if(!instance.isMounted) {
                const subTree = (instance.subTree = Component.render(instance.ctx))

                // vnode的 props 与 instance 的 props 是不是一致
                inheriyAtrrs(instance, subTree)

                patch(null, subTree, container)

                vnode.el = subTree.el

                instance.isMounted = true;
            } else {
                const prevSubTree = instance.subTree
                const nextSubTree = (instance.subTree = Component.render(instance.ctx))

                inheriyAtrrs(instance, nextSubTree)

                patch(prevSubTree, nextSubTree, container)
                // 改变 el
                vnode.el = nextSubTree.el
            }
        },
        // 处理调度函数
        queueJob
    )
}

// inheriyAtrrs 是否存在 atrrs
const inheriyAtrrs = (instance, subTree) => {
    const { atrrs } = instance
    const { props } = subTree
    if(atrrs) {
        subTree.props = {
            ...props,
            ...atrrs
        }
    }
}

// initProps
const initProps = (instance, vnode) => {
    const { type: Component , props: vnodeProps } = vnode

    const props = (instance.props = {})
    const atrrs = (instance.atrrs = {})

    for(const key in vnodeProps) {
        if(Component.props && Component.props.includes(key)) {
            props[key] = vnodeProps[key]
        } else {
            atrrs[key] = vnodeProps[key]
        }
    }
    instance.props = reactive(instance.props)
};



// mountProps
const mountProps = (props, el) => {
    for(const key in props) {
        const value = props[key]
        switch(key) {
            case 'class':
                el.className = value;
                break;
            case 'style':
                for(const styleName in value) {
                    el.style[styleName] = value[styleName]
                }
                break;
            // ....
            default:
                if(eventReg.test(key)) {
                    // 将 onClick 转为 click
                    const envenName = key.slice(2).toLowerCase()
                    // 添加元素的事件监听
                    el.addEventListener(envenName, value)
                } else {
                    el.setAttribute(key, value)
                }
                break;
        }
    }
}

// unmount
const unmount = vnode => {
    const { el } = vnode
    el.parentNode.removeChild(el)
}

// unmountChildren
const unmountChildren = children => {
    children.forEach(child => {
        unmount(child)
    })
}

// createApp
const createApp = rootComponents => {
    const app = {
        mount(rootContainer) {
            if(typeof rootComponents === 'string') {
                rootContainer = document.querySelector(rootContainer)
            }
            render(h(rootComponents), rootContainer)
        }

        // use

        // mixin
    }
    return app
}

// test
// render(
//     h('ul', null, [
//         h('li',null, '我是 first'),
//         h('li',null, [
//             h('li',null, '我是 second的 1'),
//             h('li',null, '我是 second的 2'),
//             h('li',null, '我是 second的 3')
//         ]),
//         h('li',null, '我是 third')
//     ]),
//     document.body // 将目标容器改为 document.body
// );

// setTimeout(() => {
//     render(
//         h('ul', null, [
//             h('li',null, 'first'),
//             h('li',null, [
//                 h('li',null, '我是 second的 first'),
//                 h('li',null, '我是 second的 second'),
//                 h('li',null, '我是 second的 three')
//             ]),
//             h('li',null, 'three')
//         ]),
//         document.body
//     );
// }, 3000); // 等待一段时间再执行第二个 render 函数


// test - 组件
// const MyComp = {
//     props: ['className', 'id'], // 添加 'id' 字段到 props 中
//     setup() {
//         return {
//             text: '这是一段文字',
//             className: '', // 返回 className 字段，并根据需要设置初始值为空字符串
//             id: '' // 返回 id 字段，并根据需要设置初始值
//         };
//     },
//     render(ctx) {
//         return h('div', null, [
//             h('div', { class: ctx.className, id: ctx.id }, ctx.text),
//         ]);
//     }
// }

// render(
//     h(MyComp, {
//         className: 'abc',
//         id: 'div1'
//     }, null),
//     document.body // 将目标容器改为 document.body
// );


// test - 调度器
// const Comp = {
//     setup() {
//         const a = ref(0)
//         const add = () => {
//             a.value ++;
//             a.value ++;
//         }
//         return { a, add}
//     },
//     render(ctx) {
//         console.log('update......');

//         return h('div', null, [
//             h('div', null, ctx.a.value),
//             h('button', {onClick : ctx.add},'add')
//         ])
//     }
// }

// render(h(Comp),document.body)


// test createApp
createApp({
    setup() {
        const count = ref(0)
        const add = () => {
            count.value ++;
        }
        return {
            add,
            count
        }
    },
    render(ctx) {
        return h('div', null, [
            h('div', { id: 'div1'}, ctx.count.value),
            h('button', { onClick: ctx.add , id: 'btn'}, 'add')
        ])
    }
}).mount(document.body)
