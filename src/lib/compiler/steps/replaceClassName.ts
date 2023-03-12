export const replaceClassName = (className: string, tagName: string, wcString: string) => {
  if (!className) throw new Error(`\n [${className}] - cannot parse class name for tag ${tagName}`);
  return wcString.replaceAll('{{CLASS_NAME}}', className);
};
