import fs from 'fs';

export function kebabToPascal(str: string) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

export function pascalToKebab(str: string) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function fileExist(filePath: string) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch (e) {
    return false;
  }
}
