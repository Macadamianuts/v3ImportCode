import { SHAPEFLAG } from '../shared';
import { isArray, isNumber, isObject, isString } from '../utils';

export const Text = Symbol('Text');
export const Fragment = Symbol('Fragment');

// 创建 vnode
export const h = (type, props, children) => {
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
// 处理不同的返回值形式
export const normalizeVNode = (result) => {
  if (isArray(result)) {
    return h(Fragment, null, result);
  }
  if (isObject(result)) {
    return result;
  }
  // string, number
  return h(Text, null, result.toString());
}
