import { pascalToKebab } from '../utils.js';
import { DeclarativeWebComponentAttribute } from '../../../types.js';

export const replaceGetters = (attributes: DeclarativeWebComponentAttribute[], wcString: string) => {
  if (!attributes.length) {
    return wcString.replace('{{GETTERS_SETTERS}}', '');
  }
  let attributesGettersString = '';
  for (const attribute of attributes) {
    let getterString, setterString;
    switch (attribute.type) {
      case 'number':
        getterString = `this.hasAttribute('${pascalToKebab(attribute.name)}') ? +this.getAttribute('${pascalToKebab(attribute.name)}') : undefined`;
        setterString = `if (typeof value !== 'number') throw new TypeError('not a number');\n  this.setAttribute('${pascalToKebab(attribute.name)}', value.toString());`;
        break;
      case 'boolean':
        getterString = `this.hasAttribute('${pascalToKebab(attribute.name)}') ? this.getAttribute('${pascalToKebab(attribute.name)}') === 'true' : false`;
        setterString = `if (typeof value !== 'boolean') throw new TypeError('not a boolean');\n  this.setAttribute('${pascalToKebab(
          attribute.name
        )}', !!value ? 'true' : 'false');`;
        break;
      case 'array':
        getterString = `this.hasAttribute('${pascalToKebab(attribute.name)}') ? JSON.parse(this.getAttribute('${pascalToKebab(attribute.name)}')) : undefined`;
        setterString = `if (!Array.isArray(value)) throw new TypeError('not an array');\n  this.setAttribute('${pascalToKebab(attribute.name)}', JSON.stringify(value));`;
        break;
      case 'json':
        getterString = `this.hasAttribute('${pascalToKebab(attribute.name)}') ? JSON.parse(this.getAttribute('${pascalToKebab(attribute.name)}')) : undefined`;
        setterString = `if (typeof value !== 'string') throw new TypeError('not a json');\n  this.setAttribute('${pascalToKebab(attribute.name)}', JSON.stringify(value));`;
        break;
      default:
        getterString = `this.getAttribute('${pascalToKebab(attribute.name)}')`;
        setterString = `if (typeof value !== 'string') throw new TypeError('not a string');\n  this.setAttribute('${pascalToKebab(attribute.name)}', value);`;
    }
    attributesGettersString += `
        get ${attribute.name}() {
          return ${getterString};
        }
        
        set ${attribute.name}(value) {
          ${setterString};
        }
      `;
  }
  return wcString.replace('{{GETTERS_SETTERS}}', attributesGettersString);
};
