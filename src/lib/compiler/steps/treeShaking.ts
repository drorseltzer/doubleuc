import { DeclarativeWebComponent } from '../../../types.js';
import { getHtmlFile } from './replaceTemplateHtml.js';

export const treeShaking = (declaration: DeclarativeWebComponent, wcString: string) => {
  const html = getHtmlFile(declaration) || declaration.templateHtml || '';
  let tempWcString = wcString.toString();
  if (!declaration.hooks?.disconnected) {
    tempWcString = tempWcString.replace('disconnectedCallback() {}', '');
  }
  if (!declaration.hooks?.adopted) {
    tempWcString = tempWcString.replace('adoptedCallback() {}', '');
  }
  if (!declaration.hooks?.beforeFirstRendered) {
    tempWcString = tempWcString.replace('this.beforeFirstRender()', '');
    tempWcString = tempWcString.replace('beforeFirstRender() {}', '');
  }
  if (!declaration.hooks?.firstRendered) {
    tempWcString = tempWcString.replace('this.afterFirstRender()', '');
    tempWcString = tempWcString.replace('afterFirstRender() {}', '');
  }
  if (!declaration.hooks?.beforeRendered) {
    tempWcString = tempWcString.replace('this.beforeRender()', '');
    tempWcString = tempWcString.replace('beforeRender() {}', '');
  }
  if (!declaration.hooks?.rendered) {
    tempWcString = tempWcString.replace('this.afterRender()', '');
    tempWcString = tempWcString.replace('afterRender() {}', '');
  }
  if (!declaration.listeners?.length) {
    tempWcString = tempWcString.replace('initListeners() {}', '');
    tempWcString = tempWcString.replaceAll('this.initListeners();', '');
  }
  if (!declaration.attributes.length) {
    tempWcString = tempWcString.replace('initAttributes() {}', '');
    tempWcString = tempWcString.replace('static get observedAttributes() {}', '');
    tempWcString = tempWcString.replace('this.initAttributes();', '');
  }
  if (!declaration.attributes || declaration.attributes.every(attr => attr.observed === false)) {
    tempWcString = tempWcString.replaceAll(/this.updateRefsAttributes\(.*?\);/gs, '');
    tempWcString = tempWcString.replaceAll(/this.updateRefs\(.*?\);/gs, '');
    tempWcString = tempWcString.replace(
      /updateRefsAttributes\s*\([^)]*\)\s*\{((?:[^{}]*|\{((?:[^{}]*|\{((?:[^{}]*|\{(?:[^{}]*|\{(?:[^{}]*|\{[\s\S]*?})*?})*?})*?)})*?)})*?)}/gs,
      ''
    );
    tempWcString = tempWcString.replace(/updateRefs\s*\([^)]*\)\s*\{((?:[^{}]*|\{((?:[^{}]*|\{((?:[^{}]*|\{(?:[^{}]*|\{(?:[^{}]*|\{[\s\S]*?})*?})*?})*?)})*?)})*?)}/gs, '');
    tempWcString = tempWcString.replace(
      /attributeChangedCallback\s*\([^)]*\)\s*\{((?:[^{}]*|\{((?:[^{}]*|\{((?:[^{}]*|\{(?:[^{}]*|\{(?:[^{}]*|\{[\s\S]*?})*?})*?})*?)})*?)})*?)}/gs,
      ''
    );
    tempWcString = tempWcString.replace(/render\s*\([^)]*\)\s*\{((?:[^{}]*|\{((?:[^{}]*|\{((?:[^{}]*|\{(?:[^{}]*|\{(?:[^{}]*|\{[\s\S]*?})*?})*?})*?)})*?)})*?)}/gs, '');
  }
  if (!declaration.methods || !Object.keys(declaration.methods).length) {
    tempWcString = tempWcString.replaceAll(/this.updateMethods\(.*?\);/gs, '');
    tempWcString = tempWcString.replace(/updateMethods\s*\([^)]*\)\s*\{((?:[^{}]*|\{(?:[^{}]*|\{(?:[^{}]*|\{[\s\S]*?})*?})*?})*?)}/gs, '');
  }
  if (!declaration.slotted) {
    tempWcString = tempWcString.replace('<slot></slot>\n', '');
  }
  if (!declaration.styleFile && !declaration.style) {
    tempWcString = tempWcString.replace('<style class="vars">:host {  }</style>', '');
    tempWcString = tempWcString.replace('<style class="style"></style>', '');
    tempWcString = tempWcString.replace(/renderCss\s*\([^)]*\)\s*\{((?:[^{}]*|\{(?:[^{}]*|\{(?:[^{}]*|\{[\s\S]*?})*?})*?})*?)}/gs, '');
    tempWcString = tempWcString.replaceAll(/if\s*\(\s*attribute\.startsWith\s*\(\s*["']style-["']\s*\)\s*\)\s*{\s*this\.renderCss\(\);\s*}/gs, '');
  }

  const ifRegex = new RegExp(/<[^>]*\s~if[^>]*>/g);
  const ifsElements = html && html.matchAll(ifRegex);
  if (!Array.from(ifsElements || []).length) {
    tempWcString = tempWcString.replaceAll(/this.checkIfs\(.*?\);/gs, '');
    tempWcString = tempWcString.replaceAll(/this.updateRefsIfs\(.*?\);/gs, '');
    tempWcString = tempWcString.replace(/updateRefsIfs\s*\([^)]*\)\s*{(?:[^{}]*|{(?:[^{}]*|{[^{}]*})*})*}/gs, '');
    tempWcString = tempWcString.replace(/checkIfElse\s*\([^)]*\)\s*{(?:[^{}]*|{(?:[^{}]*|{[^{}]*})*})*}/gs, '');
    tempWcString = tempWcString.replace(/uncommentElement\s*\([^)]*\)\s*{(?:[^{}]*|{(?:[^{}]*|{[^{}]*})*})*}/gs, '');
    tempWcString = tempWcString.replace(/commentElement\s*\([^)]*\)\s*{(?:[^{}]*|{(?:[^{}]*|{[^{}]*})*})*}/gs, '');
    tempWcString = tempWcString.replace(/checkIfs\s*\([^)]*\)\s*\{((?:[^{}]*|\{(?:[^{}]*|\{(?:[^{}]*|\{[\s\S]*?})*?})*?})*?)}/gs, '');
  }

  tempWcString = tempWcString.replace(/^\s*[\r\n]/gms, '');
  tempWcString = tempWcString.replace(/\t/gms, '');

  return tempWcString;
};
