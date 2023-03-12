export const replaceAdoptedCallback = (wcString: string, callbacks?: string[]) => {
  if (!callbacks) {
    return wcString.replace('{{ADOPTED_CALLBACKS}}', '');
  }
  let callString = '';
  for (const callback of callbacks) {
    callString += `this.${callback}();\n`;
  }
  return wcString.replace('{{ADOPTED_CALLBACKS}}', callString);
};
