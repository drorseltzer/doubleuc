import sass from 'sass';
import { DeclarativeWebComponent } from '../../../types.js';
import { fileExist, pascalToKebab } from '../utils.js';
import fs from 'fs';

export const replaceStyle = (declaration: DeclarativeWebComponent, className: string, wcString: string) => {
  try {
    const style = loadStyleFile(className, declaration.styleFile) || declaration.style;
    const styleString = style && style.length ? replaceTemplateCssLiterals(declaration, className, style) : '';
    const compiledStyle = styleString ? sass.compileString(styleString, { style: 'compressed' }).css : '';
    const replacedStyle = wcString.replaceAll('{{STYLE}}', compiledStyle);

    return replaceCssVars(declaration, className, style || '', replacedStyle);
  } catch (e) {
    throw new Error(`failed to replace style ${(e as Error).message}`);
  }
};

export const loadStyleFile = (className: string, styleFile?: string) => {
  if (!styleFile) return;
  if (!fileExist(styleFile)) throw new Error(`component style template file not exists ${styleFile}`);
  return fs.readFileSync(styleFile).toString();
};

export const replaceTemplateCssLiterals = (declaration: DeclarativeWebComponent, className: string, css: string) => {
  const regex = new RegExp(/{{~(.*?)}}/g);
  const literals = css.match(regex);
  if (!literals) return css;
  let replacedTemplateCss = css.toString();
  for (const literal of literals) {
    const stripped = literal.replaceAll(/({{~|}})/g, '');
    const findAttribute = declaration.attributes.find(attribute => attribute.name === stripped);
    if (!findAttribute) throw new Error(`css template attribute not found ${stripped}`);
    replacedTemplateCss = replacedTemplateCss.replace(literal, `var(--${pascalToKebab(stripped)});`);
  }
  return replacedTemplateCss;
};

export const replaceCssVars = (declaration: DeclarativeWebComponent, className: string, css: string, wcString: string) => {
  const regex = new RegExp(/{{~(.*?)}}/g);
  const literals = css.match(regex);
  if (!literals) {
    return wcString.replaceAll('{{CSS_VARS}}', '');
  }
  let replacedCssVars = '';
  for (const literal of literals) {
    const stripped = literal.replaceAll(/({{~|}})/g, '');
    const findAttribute = declaration.attributes.find(attribute => attribute.name === stripped);
    if (!findAttribute) throw new Error(`css template attribute not found ${stripped}`);
    replacedCssVars += `--${pascalToKebab(stripped)}: \${this.${stripped}};`;
  }

  return wcString.replaceAll('{{CSS_VARS}}', replacedCssVars);
};
