export const replaceAttributeChangedCallback = (wcString: string, callbacks?: string[]) => {
  if (!callbacks) {
    return wcString.replace('{{ATTRIBUTE_CHANGED_CALLBACKS}}', '');
  }
  let callString = '';
  for (const callback of callbacks) {
    callString += `this.${callback}(name, oldValue, newValue);\n`;
  }
  return wcString.replace('{{ATTRIBUTE_CHANGED_CALLBACKS}}', callString);
};
