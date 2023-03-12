import prettier from 'prettier';

export const format = (className: string, wcString: string) => {
  try {
    return prettier.format(wcString, { parser: 'babel' });
  } catch (e) {
    throw new Error(`\n [${className}] - failed to format ${(e as Error).message}`);
  }
};
