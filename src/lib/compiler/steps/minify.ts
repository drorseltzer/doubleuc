import { DeclarativeWebComponentConfig } from '../../../types.js';
import { minify as terserMinify } from 'terser';

export const minify = async (className: string, wcString: string, config?: DeclarativeWebComponentConfig) => {
  if (config?.minify?.enabled === false) return wcString;
  try {
    return (await terserMinify(wcString, config?.minify?.config)).code || wcString;
  } catch (e) {
    throw new Error(`\n [${className}] - failed to minify ${(e as Error).message}`);
  }
};
