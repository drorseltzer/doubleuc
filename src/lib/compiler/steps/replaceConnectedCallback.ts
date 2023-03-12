export const replaceConnectedCallback = (wcString: string, callbacks?: string[]) => {
  if (!callbacks) {
    return wcString.replace('{{CONNECTED_CALLBACKS}}', '');
  }
  let callString = '';
  for (const callback of callbacks) {
    callString += `this.${callback}();\n`;
  }
  return wcString.replace('{{CONNECTED_CALLBACKS}}', callString);
};
