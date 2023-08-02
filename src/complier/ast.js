export const NodeTypes = {
  // AST
  ROOT: 'ROOT',
  ELEMENT: 'ELEMENT',
  TEXT: 'TEXT',
  SIMPLE_EXPRESSION: 'SIMPLE_EXPRESSION',
  INTERPOLATION: 'INTERPOLATION',
  ATTRIBUTE: 'ATTRIBUTE',
  DIRECTIVE: 'DIRECTIVE',

  //container
  TEXT_CALL: 'TEXT_CALL',
  COMPOUND_EXPRESSION: 'COMPOUND_EXPRESSION',

  // JS
  VNODE_CALL: 'VNODE_CALL',
  JS_PROPERTY: 'JS_PROPERTY',
  JS_CALL_EXPRESSION: 'JS_CALL_EXPRESSION',
  JS_ARRAY_EXPRESSION: 'JS_ARRAY_EXPRESSION',
  JS_OBJECT_EXPRESSION: 'JS_OBJECT_EXPRESSION'
};

const ElementTypes = {
    ELEMENT: 'ELEMENT',
    COMPONENT: 'COMPONENT'
}

const createRoot = children => {
    return {
        type: NodeTypes.ROOT,
        children
    }
}