import { DeclarativeWebComponentListener } from '../../../types.js';

export const replaceListenersInits = (wcString: string, listeners?: DeclarativeWebComponentListener[]) => {
  if (!listeners) {
    return wcString.replace('{{LISTENERS_INITS}}', '');
  }
  let listenersString = '';
  let index = 1;
  for (const listener of listeners) {
    const { target, event, methods } = listener;
    for (const method of methods) {
      const name = `this.${target.replace(/[^a-zA-Z0-9]+/g, '')}${event}${index}Handler`;
      const handler = `if(!${name}) ${name} = (ev) => {this.${method}(ev)};\n`;
      listenersString += `${handler}this.shadowRoot.querySelectorAll('${target}').forEach(ele => {
          if (ele.hasAttribute('ref-ev-set')) return;
          ele.removeEventListener('${event}', ${name});
          ele.addEventListener('${event}', ${name});
          ele.setAttribute('ref-ev-set','');
        });\n`;
    }
    index++;
  }
  return wcString.replace('{{LISTENERS_INITS}}', listenersString);
};
