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


// 处理子节点
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
            patchArrayChildren(prevChildren, nextChildren, container)
        } else {
            unmountChildren(nextChildren, container)
        }
    }
}

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


const patchProps = (oldProps, newProps, el) => {
    if(oldProps === newProps) {
        return
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

    // container 添加子元素
    container.appendChild(el);

    vnode.el = el;
};


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

const mountComponentNode = (vnode, container) => {

}

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

const unmount = vnode => {
    const { el } = vnode
    el.parentNode.removeChild(el)
}

const unmountChildren = children => {
    children.forEach(child => {
        unmount(child)
    })
}


// test
render(
    h('ul', null, [
        h('li',null, '我是 first'),
        h('li',null, [
            h('li',null, '我是 second的 1'),
            h('li',null, '我是 second的 2'),
            h('li',null, '我是 second的 3')
        ]),
        h('li',null, '我是 third')
    ]),
    document.body // 将目标容器改为 document.body
);

setTimeout(() => {
    render(
        h('ul', null, [
            h('li',null, 'first'),
            h('li',null, [
                h('li',null, '我是 second的 first'),
                h('li',null, '我是 second的 second'),
                h('li',null, '我是 second的 three')
            ]),
            h('li',null, 'three')
        ]),
        document.body
    );
}, 3000); // 等待一段时间再执行第二个 render 函数
