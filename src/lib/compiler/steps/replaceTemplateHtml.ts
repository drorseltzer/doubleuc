import { fileExist, pascalToKebab } from '../utils.js';
import fs from 'fs';
import { DeclarativeWebComponent } from '../../../types.js';

export const replaceTemplateHtml = (declaration: DeclarativeWebComponent, wcString: string) => {
  const html = getHtmlFile(declaration) || declaration.templateHtml || '';
  const replacedTemplateHtmlListeners = replaceHtmlListeners(declaration, html);
  const replacedTemplateHtmlRefLists = replaceHtmlRefLists(replacedTemplateHtmlListeners);
  const replacedTemplateHtmlRefAttributes = replaceHtmlRefAttributes(declaration, replacedTemplateHtmlRefLists);
  const replacedTemplateHtmlProps = replaceHtmlRefProps(replacedTemplateHtmlRefAttributes);
  const replacedTemplateHtmlIfs = replaceHtmlRefIfs(replacedTemplateHtmlProps);
  const replacedTemplateHtmlElse = replaceHtmlRefElse(replacedTemplateHtmlIfs);
  const replacedTemplateHtml = replaceTemplateHtmlLiterals(declaration, replacedTemplateHtmlElse);
  return wcString.replaceAll('{{TEMPLATE_HTML}}', replacedTemplateHtml || '');
};

export const getHtmlFile = (declaration: DeclarativeWebComponent) => {
  if (!declaration.templateFile) return;
  if (!fileExist(declaration.templateFile)) throw new Error(`\n component html template file not exists ${declaration.templateFile}`);
  return fs.readFileSync(declaration.templateFile).toString();
};

export const replaceHtmlListeners = (declaration: DeclarativeWebComponent, html: string) => {
  const regex = new RegExp(/<[^>]*id\s*=\s*["'][^"']*["'][^>]*\s~ev-[^>]*>/g);
  const listenersElements = html.matchAll(regex);
  if (!listenersElements) return html;
  let replacedTemplateHtml = html.toString();
  for (const listenersElement of listenersElements) {
    const [elementOpenTag] = listenersElement;
    const idRegex = elementOpenTag.match(/id="(.*?)"/);
    const eventsRegex = elementOpenTag.matchAll(/~ev-(.*?)="(.*?)"/g);
    if (!idRegex) continue;
    if (!eventsRegex) continue;
    const [, id] = idRegex;
    for (const eventMatch of eventsRegex) {
      const [fullEventString, eventName, method] = eventMatch;
      if (!declaration.listeners) {
        declaration.listeners = [];
      }
      declaration.listeners.push({
        target: `#${id}`,
        event: eventName,
        methods: [method]
      });
      replacedTemplateHtml = replacedTemplateHtml.replace(`${fullEventString}`, '');
    }
  }
  return replacedTemplateHtml;
};

export const replaceHtmlRefLists = (html: string) => {
  const regex = new RegExp(/<([-_\w]+)\s[^>]*~list[^>]*>([\s\S]*?)<\/\1\s*>/gs);
  const listsElements = html.matchAll(regex);
  if (!listsElements) return html;
  let replacedTemplateHtml = html.toString();
  for (const listsElement of listsElements) {
    const [fullElementHTML] = listsElement;
    const html = fullElementHTML.toString();
    const listsRegex = fullElementHTML.matchAll(/~list="(.*?)"/gs);
    if (!listsRegex) continue;
    for (const listRegex of listsRegex) {
      const [full, expression] = listRegex;
      const isOfOrIn = expression.includes('of') ? 'of' : expression.includes('in') ? 'in' : 'of';
      const [index, refAttribute] = expression.split(/ of | in /);
      const listString = html.replace(`${full}`, ``);
      const litteralString = `\${(() => {
          if (!this.${refAttribute}) return;
          const listString = \`${listString}\`;
          let listHtml = listString.repeat(this.${refAttribute}.length);
          for (const ${index} ${isOfOrIn} this.${refAttribute}){
            const regex = new RegExp(\`{${index}(.*?)}\`, 'gs');
            const matches = listString.matchAll(regex);
            for(const match of matches) {
              const [full, additions] = match;
              if (additions) {
                const prop = additions.startsWith('.') ? additions.substring(1).replaceAll('.','][') : additions.replaceAll('.','][');
                const finalProp = prop.startsWith(']') ? prop.substring(1) : prop;
                listHtml = listHtml.replace(full, ${index}[\`\${finalProp}\`]);
              } else {
                listHtml = listHtml.replace(full, ${index});
              }
            }
          }
          return listHtml;
        })()}`;
      replacedTemplateHtml = replacedTemplateHtml.replace(
        fullElementHTML,
        `<span ref-list="${pascalToKebab(refAttribute) || ''}" class="ref-${pascalToKebab(refAttribute) || ''}">${litteralString || ''}</span>`
      );
    }
  }
  return replacedTemplateHtml;
};

export const replaceHtmlRefAttributes = (declaration: DeclarativeWebComponent, html: string) => {
  const regex = new RegExp(/<[^>]*\s~attr-[^>]*>/gs);
  const attrsElements = html.matchAll(regex);
  if (!attrsElements) return html;
  let replacedTemplateHtml = html.toString();
  for (const attrsElement of attrsElements) {
    const [elementOpenTag] = attrsElement;
    const attrsRegex = elementOpenTag.matchAll(/~attr-(.*?)="(.*?)"/gs);
    if (!attrsRegex) continue;
    for (const attrRegex of attrsRegex) {
      const [full, attribute, value] = attrRegex;
      let classString = `${attribute}="\${this.${value}}"`;
      const isMethod = value.includes('(');
      const findMethod = isMethod && declaration.methods ? Object.keys(declaration.methods).includes(value.replace(/\(.*?\)/g, '')) : null;
      const findAttribute = declaration.attributes.find(attr => attr.name === value);

      if (!findAttribute && !findMethod) {
        classString = `${attribute}="${value}"`;
      }
      replacedTemplateHtml = replacedTemplateHtml.replace(full, `ref-attribute ${classString}`);
    }
  }
  return replacedTemplateHtml;
};

export const replaceHtmlRefProps = (html: string) => {
  const regex = new RegExp(/<[^>]*\s~prop-[^>]*>/gs);
  const propsElements = html.matchAll(regex);
  if (!propsElements) return html;
  let replacedTemplateHtml = html.toString();
  for (const propsElement of propsElements) {
    const [elementOpenTag] = propsElement;
    const propsRegex = elementOpenTag.matchAll(/~prop-(.*?)="(.*?)"/gs);
    if (!propsRegex) continue;
    for (const propRegex of propsRegex) {
      const [full, prop, value] = propRegex;
      const propString = `\${this.${value} ? '${prop}' : ''}`;
      replacedTemplateHtml = replacedTemplateHtml.replace(full, `ref-attribute ${propString}`);
    }
  }
  return replacedTemplateHtml;
};

export const replaceHtmlRefIfs = (html: string) => {
  const regex = new RegExp(/<[^>]*\s~if[^>]*>/g);
  const ifsElements = html.matchAll(regex);
  if (!ifsElements) return html;
  let replacedTemplateHtml = html.toString();
  for (const ifElement of ifsElements) {
    const [elementOpenTag] = ifElement;
    const ifsRegex = elementOpenTag.matchAll(/~if="(.*?)"/g);
    if (!ifsRegex) continue;
    for (const ifRegex of ifsRegex) {
      const [full, attribute] = ifRegex;
      const isNotOrBooleanExpression = attribute.startsWith('!') ? (attribute.startsWith('!!') ? (attribute.startsWith('!!!') ? 3 : 2) : 1) : false;
      const stripped = isNotOrBooleanExpression ? attribute.substring(isNotOrBooleanExpression) : attribute;
      const ifString = `ref-if="\${${isNotOrBooleanExpression ? '!'.repeat(isNotOrBooleanExpression) : ''}this.${stripped}}"`;
      replacedTemplateHtml = replacedTemplateHtml.replace(full, `ref-attribute ${ifString}`);
    }
  }
  return replacedTemplateHtml;
};

export const replaceHtmlRefElse = (html: string) => {
  const regex = new RegExp(/<[^>]*\s~else[^>]*>/g);
  const elseElements = html.matchAll(regex);
  if (!elseElements) return html;
  let replacedTemplateHtml = html.toString();
  for (const elseElement of elseElements) {
    const [elementOpenTag] = elseElement;
    const elseRegex = elementOpenTag.matchAll(/~else/g);
    if (!elseRegex) continue;
    for (const elseRegex1 of elseRegex) {
      const [full] = elseRegex1;
      replacedTemplateHtml = replacedTemplateHtml.replace(full, `ref-attribute ref-else`);
    }
  }
  return replacedTemplateHtml;
};

export const replaceTemplateHtmlLiterals = (declaration: DeclarativeWebComponent, html: string) => {
  const regex = new RegExp(/{{(.*?)}}/g);
  const literals = html.match(regex);
  if (!literals) return html;
  let replacedTemplateHtml = html.toString();
  for (const literal of literals) {
    const stripped = literal.replaceAll(/({{|}})/g, '');
    if (!stripped) continue;
    const isMethod = stripped.includes('(');
    const findMethod = isMethod && declaration.methods ? Object.keys(declaration.methods).find(method => method === stripped) : null;
    const findAttribute = declaration.attributes.find(attribute => attribute.name === stripped);

    if (findMethod) {
      replacedTemplateHtml = replacedTemplateHtml.replace(literal, `<span class="ref-method ref-method-${stripped.replace(/\(.*?\)/g, '')}">\${this.${stripped}}</span>`);
      continue;
    }

    if (!findAttribute || (isMethod && !findMethod)) {
      replacedTemplateHtml = replacedTemplateHtml.replace(literal, `\${this.${stripped}}`);
      continue;
    }

    replacedTemplateHtml = replacedTemplateHtml.replace(literal, `<span class="ref-${pascalToKebab(stripped)}">\${this.${stripped}}</span>`);
  }
  return replacedTemplateHtml;
};
