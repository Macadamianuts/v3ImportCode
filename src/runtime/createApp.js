import { h } from './vnode';
import { render } from './render';
import { isString } from '../utils';

// createApp  
const createApp = rootComponents => {
    const app = {
        mount(rootContainer) {
            if (isString(rootContainer)) {
        rootContainer = document.querySelector(rootContainer);
      }
      if (!rootComponent.render && !rootComponent.template) {
        rootComponent.template = rootContainer.innerHTML;
      }
      rootContainer.innerHTML = '';

      render(h(rootComponent), rootContainer);
    }

        // use 

        // mixin
    }
    return app
}