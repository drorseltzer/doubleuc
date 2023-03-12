export const replaceTagName = (className: string, tagName: string, wcString: string) => {
  if (!tagName) throw new Error(`\n [${className}] - invalid tag name ${tagName}`);
  return wcString.replaceAll('{{TAG_NAME}}', tagName);
};
