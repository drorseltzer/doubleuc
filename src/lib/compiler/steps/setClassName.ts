import { kebabToPascal } from '../utils.js';

export const setClassName = (tagName: string) => {
  return kebabToPascal(tagName);
};
