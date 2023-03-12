export const replaceMethods = (wcString: string, methods?: Record<string, (this: HTMLElement, args: unknown) => unknown>) => {
  if (!methods) {
    return wcString.replace('{{METHODS}}', '');
  }
  let methodString = '';
  for (const methodsKey in methods) {
    methodString += `\n${methods[methodsKey].toString().replace('function', methodsKey)}\n`;
  }
  return wcString.replace('{{METHODS}}', methodString);
};
