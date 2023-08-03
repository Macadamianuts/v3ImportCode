import { render } from './render'
import { h } from './vnode'

render(
    h(
        'ul',
        {
            class: 'classss',
            style: {
                border: '1px solid #000',
                fontSize: '18px',
            },
            onClick: () => console.log('click'),
            id: 'ididid',
        },
        [
            h('li', null, 1), 
            h('li', null, [h(Text, null, '2')]), 
            h('li', null, '3')
        ]
    ),
    document.body
);