import { NodeTypes } from '../compiler/ast.js';

export function isObject(target) {
  return typeof target === 'object' && target !== null;
}

export function hasChanged(oldValue, value) {
  return oldValue !== value && !(Number.isNaN(oldValue) && Number.isNaN(value));
}

export function isArray(target) {
  return Array.isArray(target);
}

export function isFunction(target) {
  return typeof target === 'function';
}

export function isString(target) {
  return typeof target === 'string';
}

export function isNumber(target) {
  return typeof target === 'number';
}

export function isBoolean(target) {
  return typeof target === 'boolean';
}

export function isSymbol(val) {
  return typeof val === 'symbol';
}

export function isText(node) {
  return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT;
}


// 常见标签处理
const HTML_TAGS = 'html,body,base,head,link,meta,style,title,address,article,aside,footer,' +
  'header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,div,dd,dl,dt,figcaption,' +
  'figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,' +
  'data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,s,samp,small,span,strong,sub,sup,' +
  'time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,' +
  'canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,' +
  'th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,' +
  'option,output,progress,select,textarea,details,dialog,menu,' +
  'summary,template,blockquote,iframe,tfoot';

const VOID_TAGS = 'area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr';

const makeMap = (str) => {
    const map = Object.create(null);
    const list = str.split(',');
    for (const item of list) {
        map[item] = true;
    }
   return (val) => !!map[val];
};

export const isHTMLTag = makeMap(HTML_TAGS);

export const isVoidTag = makeMap(VOID_TAGS);