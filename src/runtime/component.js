import { reactive, effect, proxyRefs } from '../reactivity';
import { patch } from './render';
import { queueJob } from './scheduler';
import { baseCompile } from '../compiler';

const instance = (vnode.component = {
    props: null,
    attrs: null,
    setupState: null,
    ctx: null,
    subTree: null,
    isMounted: false,
    update: null,
    next: null
});

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
        const setupContext = createSetupContext(instance);
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

// 偷懒了，还有 slots 和 emit
function createSetupContext(instance) {
  return {
    attrs: instance.attrs
  };
}
