const SHAPEFLAG = {
    ELEMENT : 1,
    TEXT: 1 << 1,
    TEXT_CHILDREN: 1 << 2,
    ARRAY_CHILDREN: 1 << 3,
    COMPONENT: 1 << 4
}


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

const render = (vnode, container) => {
    container.innerHTML = '';
    mount(vnode, container)
}

const mount = (vnode, container) => {
    const { shapeFlag } = vnode;
    if(shapeFlag & SHAPEFLAG.TEXT) {
        // 单独调用文本渲染方法
        mountTextNode(vnode, container)
    } else if(shapeFlag & SHAPEFLAG.ELEMENT) {
        // 实现元素节点挂在方法
        mountElementNode(vnode, container)
    } else if( shapeFlag & SHAPEFLAG.COMPONENT) {
        mountComponentNode(vnode, container)
    }
}

const mountTextNode = (vnode, container) => {
    const textNode = document.createTextNode(vnode.children)
    container.appendChild(textNode)

    vnode.el = textNode
}

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

    container.appendChild(el);

    vnode.el = el;
};


const mountChildren = (children, container) => {
    children.forEach(child => {
        mount(child, container)
    });
}

const mountComponentNode = (vnode, container) => {

}

// 判断是不是一个事件 ‘on’ 开头
const eventReg = /^on[A-Z]/

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

// render(
//     h(
//         'ul', {
//             class: 'classul',
//             style: {
//                 border : '1px soild #000',
//                 fontSize : '18px'
//             },
//             onClick : () => console.log('click'),
//             id : 'idid'
//         },
//             [
//                 h('li', null, 1),
//                 h('li', null, [h(Text, null , '2')]),
//                 h('li', null, '3'), 
//             ]        
//     ),
//     document.body
// )