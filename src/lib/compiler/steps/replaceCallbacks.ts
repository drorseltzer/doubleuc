export const replaceCallbacks = (replaceString: string, wcString: string, callbacks?: string[]) => {
  if (!callbacks) {
    return wcString.replace(replaceString, '');
  }
  let callString = '';
  for (const callback of callbacks) {
    callString += `this.${callback}();\n`;
  }
  return wcString.replace(replaceString, callString);
};
