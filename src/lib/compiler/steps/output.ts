import { DeclarativeWebComponentConfig, DeclarativeWebComponentOutputType } from '../../../types.js';
import path from 'path';
import fs from 'fs';

export const output = (outputType: DeclarativeWebComponentOutputType, tagName: string, className: string, wcString: string, config?: DeclarativeWebComponentConfig) => {
  switch (outputType) {
    case DeclarativeWebComponentOutputType.FILE:
      return outputFile(tagName, className, wcString, config);
    case DeclarativeWebComponentOutputType.STRING:
      return wcString.toString();
  }
};

export const outputFile = (tagName: string, className: string, wcString: string, config?: DeclarativeWebComponentConfig) => {
  try {
    const filePath = config?.outputDir || path.join(process.cwd(), 'output', (config?.outputFilename || tagName) + '.js');
    fs.writeFileSync(filePath, Buffer.from(wcString));
    return filePath;
  } catch (e) {
    throw new Error(`\n [${className}] - failed to output file ${(e as Error).message}`);
  }
};
