export const replaceClassName = (className: string, tagName: string, wcString: string) => {
  if (!className) throw new Error(`cannot parse class name for tag ${tagName}`);
  return wcString.replaceAll('{{CLASS_NAME}}', className);
};
