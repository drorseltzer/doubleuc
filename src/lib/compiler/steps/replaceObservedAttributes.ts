import { pascalToKebab } from '../utils.js';
import { DeclarativeWebComponentAttribute } from '../../../types.js';

export const replaceObservedAttributes = (attributes: DeclarativeWebComponentAttribute[], wcString: string) => {
  const attributesString = attributes
    .filter(attr => attr.observed)
    .map(attr => `'${pascalToKebab(attr.name)}'`)
    .join(',');
  return wcString.replace('{{OBSERVED_ATTRIBUTES}}', attributesString ? `return [${attributesString}];` : '');
};
