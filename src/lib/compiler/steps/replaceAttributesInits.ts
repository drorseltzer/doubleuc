import { pascalToKebab } from '../utils.js';
import { DeclarativeWebComponentAttribute } from '../../../types.js';

export const replaceAttributesInits = (attributes: DeclarativeWebComponentAttribute[], wcString: string) => {
  const filteredAttributes = attributes.filter(attr => attr.initValue);
  let attributeInitsString = '';
  for (const attribute of filteredAttributes) {
    attributeInitsString += `!this.${attribute.name} && this.setAttribute('${pascalToKebab(attribute.name)}', '${attribute.initValue}');\n`;
  }
  return wcString.replace('{{ATTRIBUTES_INITS}}', attributeInitsString);
};
