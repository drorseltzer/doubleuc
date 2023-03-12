export const replaceDisconnectedCallback = (wcString: string, callbacks?: string[]) => {
  if (!callbacks) {
    return wcString.replace('{{DISCONNECTED_CALLBACKS}}', '');
  }
  let callString = '';
  for (const callback of callbacks) {
    callString += `this.${callback}();\n`;
  }
  return wcString.replace('{{DISCONNECTED_CALLBACKS}}', callString);
};
