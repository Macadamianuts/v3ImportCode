import { extend, isHTMLTag, isVoidTag } from '../utils';
import { createRoot, ElementTypes, NodeTypes } from './ast';

// defaultParserOptions 默认插值表达式 
export const defaultParserOptions = {
  delimiters: ['{{', '}}'],
  isVoidTag,
  isHTMLTag
};

// createParserContext 仅实现了：source
const createParserContext = (content, rwaOptions) =>{
  const options = extend({}, defaultParserOptions);

  let key;
  for (key in rwaOptions) {
    options[key] =
      rwaOptions[key] === undefined
        ? defaultParserOptions[key]
        : rwaOptions[key];
  }
  return {
    options,
    source: content
  };
}

// baseParse
export const baseParse = (content, options = {}) => {
  const context = createParserContext(content, options);
  const children = parseChildren(context);

  return createRoot(children);
}

// parseChildren
const parseChildren = (context) => {
  const nodes = [];

  while (!isEnd(context)) {
    const s = context.source;
    let node;

    // 此处做了简化 仅判断标签
    if (startsWith(s, context.options.delimiters[0])) {
      node = parseInterpolation(context);
    } else if (s[0] === '<') {
      node = parseElement(context);
    } else if(startsWith(s, "{{")) {
        node = parseInterpolation(context)
    } else {
      node = parseText(context);
    }

    // 源码中写了个 pushNode 方法来控制，这里直接写出来了
    nodes.push(node);
  }

  let removeWhitespace = false;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === NodeTypes.TEXT) {
      if (!/[^\t\r\n\f ]/.test(node.content)) {
        const prev = nodes[i - 1];
        const next = nodes[i + 1];

        if (
          !prev ||
          !next ||
          (prev.type === NodeTypes.ELEMENT &&
            next.type === NodeTypes.ELEMENT &&
            /[\r\n]/.test(node.content))
        ) {
          removeWhitespace = true;
          nodes[i] = null;
        } else {
          node.content = ' ';
        }
      } else {
        node.content = node.content.replace(/[\t\r\f\n ]+/g, ' ');
      }
    }
  }

  return removeWhitespace ? nodes.filter(Boolean) : nodes;

  // return nodes;
}

// parseElement 解析元素节点
const parseElement = (context) => {
  const element = parseTag(context);

  // 如果是自闭合标签就不用解析子节点和闭合标签了
  // <br /> 合法，<br> 也是合法的
  if (element.isSelfClosing || context.options.isVoidTag(element.tag)) {
    return element;
  }

  element.children = parseChildren(context);

  // 只是要分割掉闭合标签 </div>，不用接收
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context);
  }

  return element;
}

// parseTag 解析标签
// <div class="a" v-bind:b="c">parse {{ element }}</div>
const parseTag = (context) => {
  const tagNameReg = /^<\/?([a-z][^\t\r\n\f />]*)/i;
  const match = tagNameReg.exec(context.source);
  const tag = match[1];

  // 此时 content.source ===> class="a" v-bind:b="c">parse {{ element }}</div> 
  advanceBy(context, match[0].length);
  advanceSpaces(context);


  let props = parseAttributes(context);
  let isSelfClosing = startsWith(context.source, '/>');

  // 分割掉 /> 或者 >
  advanceBy(context, isSelfClosing ? 2 : 1);

  // 判断是 组件 还是 元素
  const tagType = isComponent(tag, context)
    ? ElementTypes.COMPONENT
    : ElementTypes.ELEMENT;

  return {
    type: NodeTypes.ELEMENT,
    tag,
    tagType,
    props,
    isSelfClosing,
    children: [],
    codegenNode: undefined
  };
}

// 进来时长这样
// class="a" v-bind:b="c">parse {{ element }}</div>
const parseAttributes = (context) => {
  const props = [];
  const attributeNames = new Set();

  // 遇到 ">" 或者 "/>" 或者 context.source 为空字符串了才停止解析
  while (
    context.source.length > 0 &&
    !startsWith(context.source, '>') &&
    !startsWith(context.source, '/>')
  ) {
    const attr = parseAttribute(context, attributeNames);
    props.push(attr);
    advanceSpaces(context);
  }
  return props;
}

// 进来时长这样
// class="a" v-bind:b="c">parse {{ element }}</div>
const parseAttribute = (context, nameSet) => {
  const attrNameRE = /^[^\t\r\n\f />][^\t\r\n\f />=]*/;
  const match = attrNameRE.exec(context.source);
  const name = match[0];

  nameSet.add(name);
  advanceBy(context, name.length);

  let value;
  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    advanceSpaces(context);
    advanceBy(context, 1);
    advanceSpaces(context);

    value = parseAttributeValue(context);
  }

  if (/^(v-[A-Za-z0-9-]|:|\.|@|#)/.test(name)) {
    const match =
      /(?:^v-([a-z0-9-]+))?(?:(?::|^\.|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(
        name
      );

    let isPropShorthand = startsWith(name, '.');
    let dirName =
      match[1] ||
      (isPropShorthand || startsWith(name, ':')
        ? 'bind'
        : startsWith(name, '@')
        ? 'on'
        : '');

    let arg;
    if (match[2]) {
      let content = match[2];
      let isStatic = true;
      if (content.startsWith('[')) {
        isStatic = false;
        if (content.endsWith(']')) {
          content = content.slice(1, content.length - 1);
        }
      }
      arg = {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content,
        isStatic
      };
    }

    const modifiers = match[3] ? match[3].slice(1).split('.') : [];
    if (isPropShorthand) modifiers.push('prop');

    return {
      type: NodeTypes.DIRECTIVE,
      name: dirName,
      exp: value && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: value,
        isStatic: false
      },
      arg,
      modifiers
    };
  }

  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value
    }
  };
}

// 进来时是这样的
// "a" v-bind:b="c">parse {{ element }}</div>
const parseAttributeValue = (context) => {
  const quote = context.source[0];
  advanceBy(context, 1);

  const endIndex = context.source.indexOf(quote);
  const content = parseTextData(context, endIndex);
  advanceBy(context, 1);

  return content;
}

// 进来时是这样的
// {{ element }}</div>
const parseInterpolation = (context) => {
//   const [open, close] = ['{{', '}}']
  const [open, close] = context.options.delimiters;
  advanceBy(context, open.length);
  const closeIndex = context.source.indexOf(close);

  const content = parseTextData(context, closeIndex).trim();
  advanceBy(context, close.length);
//   </div>
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content
    }
  };
}

// 进来时是这样的
// parse {{ element }}</div>
const parseText = (context) => {
//   const endTokens = ['<', '{{'];
  const endTokens = ['<', context.options.delimiters[0]]
  let endIndex = context.source.length;
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1);
    // 找最靠前的一个结束标识
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  // 结束标识钱的内容进行分割
  const content = parseTextData(context, endIndex);

  return {
    type: NodeTypes.TEXT,
    content
  };
}

// ----- 工具函数 --------
const startsWith = (source, searchString) => {
  return source.startsWith(searchString);
}

// advanceBy
const advanceBy = (context, numberOfCharacters) => {
  const { source } = context;
  context.source = source.slice(numberOfCharacters);
}

// advanceSpaces
const advanceSpaces = (context) => {
  const spaceRE = /^[\t\r\n\f ]+/;
  const match = spaceRE.exec(context.source);
  if (match) {
    advanceBy(context, match[0].length);
  }
}

// startsWithEndTagOpen
const startsWithEndTagOpen = (source, tag) => {
  return (
    startsWith(source, '</') &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase() &&
    /[\t\r\n\f />]/.test(source[2 + tag.length] || '>')
  );
}

// isEnd
const isEnd = (context) => {
  const s = context.source;
  return !s || startsWith(s, '</');
}

// isComponent
const isComponent = (tag, context) => {
  const { isHTMLTag } = context.options;
  return !isHTMLTag(tag);
}

// parseTextData
const parseTextData = (context, length) => {
  const rawText = context.source.slice(0, length);
  advanceBy(context, length);
  return rawText;
}
