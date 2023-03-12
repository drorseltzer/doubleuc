import fs from 'fs';

export function kebabToPascal(str: string) {
  try {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  } catch (e) {
    throw new Error(`\n [kebabToPascal] - cannot kebabToPascal ${str}`);
  }
}

export function pascalToKebab(str: string) {
  try {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  } catch (e) {
    throw new Error(`\n [pascalToKebab] - cannot pascalToKebab ${str}`);
  }
}

export function fileExist(filePath: string) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch (e) {
    return false;
  }
}
