export const replaceAfterRenderHook = (wcString: string, callbacks?: string[]) => {
  if (!callbacks) {
    return wcString.replace('{{AFTER_RENDER_HOOK}}', '');
  }
  let callString = '';
  for (const callback of callbacks) {
    callString += `this.${callback}();\n`;
  }
  return wcString.replace('{{AFTER_RENDER_HOOK}}', callString);
};
