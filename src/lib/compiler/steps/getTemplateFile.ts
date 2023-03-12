import path from 'path';
import { fileExist } from '../utils.js';
import fs from 'fs';

export const getTemplateFile = (className: string) => {
  const filePath = path.join(__dirname, '../../../../src/lib', '.wc-template');
  if (!fileExist(filePath)) throw new Error(`\n [${className}] - cannot find template file at ${filePath}`);
  const file = fs.readFileSync(filePath);
  return file.toString();
};
