export const replaceBeforeRenderHook = (wcString: string, callbacks?: string[]) => {
  if (!callbacks) {
    return wcString.replace('{{BEFORE_RENDER_HOOK}}', '');
  }
  let callString = '';
  for (const callback of callbacks) {
    callString += `this.${callback}();\n`;
  }
  return wcString.replace('{{BEFORE_RENDER_HOOK}}', callString);
};
