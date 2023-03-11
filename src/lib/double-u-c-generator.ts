import { DeclarativeWebComponent, DeclarativeWebComponentOutputType } from '../types';
import path from 'path';
import fs from 'fs';
import prettier from 'prettier';
import { fileExist, kebabToPascal, pascalToKebab } from './utils.js';
import sass from 'sass';
import { minify } from 'terser';

export class DoubleUCGenerator {
  private html = '';
  private wcString = '';
  private readonly declaration: DeclarativeWebComponent;
  private className?: string;

  constructor(declaration: DeclarativeWebComponent) {
    this.declaration = declaration;
  }

  async generateWebComponent(outputType: DeclarativeWebComponentOutputType = DeclarativeWebComponentOutputType.FILE) {
    const { tagName } = this.declaration;
    this.className = kebabToPascal(tagName);

    try {
      return (
        await this.getTemplateFile()
          .replaceClassName()
          .replaceTagName()
          .replaceTemplateHtml()
          .replaceStyle()
          .replaceGetters()
          .replaceMethods()
          .replaceAttributesInits()
          .replaceListenersInits()
          .replaceObservedAttributes()
          .replaceConnectedCallback()
          .replaceDisconnectedCallback()
          .replaceAdoptedCallback()
          .replaceAttributeChangedCallback()
          .replaceBeforeFirstRenderHook()
          .replaceAfterFirstRenderHook()
          .replaceBeforeRenderHook()
          .replaceAfterRenderHook()
          .format()
          .treeShaking()
          .format()
          .minify()
      ).output(outputType);
    } catch (e) {
      console.error(`\n [${this.className}] - failed to build component ${tagName} ${(e as Error).message}`);
    }
  }

  private getTemplateFile() {
    const filePath = path.join(__dirname, '../../src/lib', '.wc-template');
    if (!fileExist(filePath)) throw new Error(`\n [${this.className}] - cannot find template file at ${filePath}`);
    const file = fs.readFileSync(filePath);
    this.wcString = file.toString();

    return this;
  }

  private replaceClassName() {
    if (!this.className) throw new Error(`\n [${this.className}] - cannot parse class name for tag ${this.declaration.tagName}`);
    this.wcString = this.wcString.replaceAll('{{CLASS_NAME}}', this.className);

    return this;
  }

  private replaceTagName() {
    if (!this.declaration.tagName) throw new Error(`\n [${this.className}] - invalid tag name ${this.declaration.tagName}`);
    this.wcString = this.wcString.replaceAll('{{TAG_NAME}}', this.declaration.tagName);

    return this;
  }

  private replaceTemplateHtml() {
    this.html = this.getHtmlFile() || this.declaration.templateHtml || '';
    const replacedTemplateHtmlListeners = this.html ? this.replaceHtmlListeners(this.html) : '';
    const replacedTemplateHtmlRefLists = replacedTemplateHtmlListeners ? this.replaceHtmlRefLists(replacedTemplateHtmlListeners) : '';
    const replacedTemplateHtmlRefAttributes = replacedTemplateHtmlRefLists ? this.replaceHtmlRefAttributes(replacedTemplateHtmlRefLists) : '';
    const replacedTemplateHtmlProps = replacedTemplateHtmlRefAttributes ? this.replaceHtmlRefProps(replacedTemplateHtmlRefAttributes) : '';
    const replacedTemplateHtmlIfs = replacedTemplateHtmlProps ? this.replaceHtmlRefIfs(replacedTemplateHtmlProps) : '';
    const replacedTemplateHtmlElse = replacedTemplateHtmlIfs ? this.replaceHtmlRefElse(replacedTemplateHtmlIfs) : '';
    const replacedTemplateHtml = replacedTemplateHtmlElse ? this.replaceTemplateHtmlLiterals(replacedTemplateHtmlElse) : '';
    this.wcString = this.wcString.replaceAll('{{TEMPLATE_HTML}}', replacedTemplateHtml || '');

    return this;
  }

  private getHtmlFile() {
    if (!this.declaration.templateFile) return;
    if (!fileExist(this.declaration.templateFile)) throw new Error(`\n component html template file not exists ${this.declaration.templateFile}`);
    return fs.readFileSync(this.declaration.templateFile).toString();
  }

  private loadStyleFile() {
    if (!this.declaration.styleFile) return;
    if (!fileExist(this.declaration.styleFile)) throw new Error(`\n [${this.className}] - component style template file not exists ${this.declaration.styleFile}`);
    return fs.readFileSync(this.declaration.styleFile).toString();
  }

  private replaceTemplateCssLiterals(css: string) {
    const regex = new RegExp(/{{~(.*?)}}/g);
    const literals = css.match(regex);
    if (!literals) return css;
    let replacedTemplateCss = css.toString();
    for (const literal of literals) {
      const stripped = literal.replaceAll(/({{~|}})/g, '');
      const findAttribute = this.declaration.attributes.find(attribute => attribute.name === stripped);
      if (!findAttribute) throw new Error(`\n [${this.className}] - css template attribute not found ${stripped}`);
      replacedTemplateCss = replacedTemplateCss.replace(literal, `var(--${pascalToKebab(stripped)});`);
    }
    return replacedTemplateCss;
  }

  private replaceCssVars(css: string) {
    const regex = new RegExp(/{{~(.*?)}}/g);
    const literals = css.match(regex);
    if (!literals) {
      this.wcString = this.wcString.replaceAll('{{CSS_VARS}}', '');
      return this;
    }
    let replacedCssVars = '';
    for (const literal of literals) {
      const stripped = literal.replaceAll(/({{~|}})/g, '');
      const findAttribute = this.declaration.attributes.find(attribute => attribute.name === stripped);
      if (!findAttribute) throw new Error(`\n [${this.className}] - css template attribute not found ${stripped}`);
      replacedCssVars += `--${pascalToKebab(stripped)}: \${this.${stripped}};`;
    }

    this.wcString = this.wcString.replaceAll('{{CSS_VARS}}', replacedCssVars);

    return this;
  }

  private replaceStyle() {
    try {
      const style = this.loadStyleFile() || this.declaration.style;
      const styleString = style && style.length ? this.replaceTemplateCssLiterals(style) : '';
      const compiledStyle = styleString ? sass.compileString(styleString, { style: 'compressed' }).css : '';
      this.wcString = this.wcString.replaceAll('{{STYLE}}', compiledStyle);

      return this.replaceCssVars(style || '');
    } catch (e) {
      throw new Error(`\n [${this.className}] - failed to replace style ${(e as Error).message}`);
    }
  }

  private replaceGetters() {
    const attributes = this.declaration.attributes;
    if (!attributes.length) {
      this.wcString = this.wcString.replace('{{GETTERS_SETTERS}}', '');
      return this;
    }
    let attributesGettersString = '';
    for (const attribute of this.declaration.attributes) {
      let getterString, setterString;
      switch (attribute.type) {
        case 'number':
          getterString = `this.hasAttribute('${pascalToKebab(attribute.name)}') ? +this.getAttribute('${pascalToKebab(attribute.name)}') : undefined`;
          setterString = `if (typeof value !== 'number') throw new TypeError('not a number');\n  this.setAttribute('${pascalToKebab(attribute.name)}', value.toString());`;
          break;
        case 'boolean':
          getterString = `this.hasAttribute('${pascalToKebab(attribute.name)}') ? this.getAttribute('${pascalToKebab(attribute.name)}') === 'true' : false`;
          setterString = `if (typeof value !== 'boolean') throw new TypeError('not a boolean');\n  this.setAttribute('${pascalToKebab(
            attribute.name
          )}', !!value ? 'true' : 'false');`;
          break;
        case 'array':
          getterString = `this.hasAttribute('${pascalToKebab(attribute.name)}') ? JSON.parse(this.getAttribute('${pascalToKebab(attribute.name)}')) : undefined`;
          setterString = `if (!Array.isArray(value)) throw new TypeError('not an array');\n  this.setAttribute('${pascalToKebab(attribute.name)}', JSON.stringify(value));`;
          break;
        case 'json':
          getterString = `this.hasAttribute('${pascalToKebab(attribute.name)}') ? JSON.parse(this.getAttribute('${pascalToKebab(attribute.name)}')) : undefined`;
          setterString = `if (typeof value !== 'string') throw new TypeError('not a json');\n  this.setAttribute('${pascalToKebab(attribute.name)}', JSON.stringify(value));`;
          break;
        default:
          getterString = `this.getAttribute('${pascalToKebab(attribute.name)}')`;
          setterString = `if (typeof value !== 'string') throw new TypeError('not a string');\n  this.setAttribute('${pascalToKebab(attribute.name)}', value);`;
      }
      attributesGettersString += `
        get ${attribute.name}() {
          return ${getterString};
        }
        
        set ${attribute.name}(value) {
          ${setterString};
        }
      `;
    }
    this.wcString = this.wcString.replace('{{GETTERS_SETTERS}}', attributesGettersString);

    return this;
  }

  private replaceHtmlListeners(html: string) {
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
        if (!this.declaration.listeners) {
          this.declaration.listeners = [];
        }
        this.declaration.listeners.push({
          target: `#${id}`,
          event: eventName,
          methods: [method]
        });
        replacedTemplateHtml = replacedTemplateHtml.replace(`${fullEventString}`, '');
      }
    }
    return replacedTemplateHtml;
  }

  private replaceHtmlRefAttributes(html: string) {
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
        const findMethod = isMethod && this.declaration.methods ? Object.keys(this.declaration.methods).includes(value.replace(/\(.*?\)/g, '')) : null;
        const findAttribute = this.declaration.attributes.find(attr => attr.name === value);

        if (!findAttribute && !findMethod) {
          classString = `${attribute}="${value}"`;
        }
        replacedTemplateHtml = replacedTemplateHtml.replace(full, `ref-attribute ${classString}`);
      }
    }
    return replacedTemplateHtml;
  }

  private replaceHtmlRefProps(html: string) {
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
  }

  private replaceHtmlRefIfs(html: string) {
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
  }

  private replaceHtmlRefElse(html: string) {
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
  }

  private replaceHtmlRefLists(html: string) {
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
  }

  private replaceTemplateHtmlLiterals(html: string) {
    const regex = new RegExp(/{{(.*?)}}/g);
    const literals = html.match(regex);
    if (!literals) return html;
    let replacedTemplateHtml = html.toString();
    for (const literal of literals) {
      const stripped = literal.replaceAll(/({{|}})/g, '');
      if (!stripped) continue;
      const isMethod = stripped.includes('(');
      const findMethod = isMethod && this.declaration.methods ? Object.keys(this.declaration.methods).find(method => method === stripped) : null;
      const findAttribute = this.declaration.attributes.find(attribute => attribute.name === stripped);

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
  }

  private replaceMethods() {
    const methods = this.declaration.methods;
    if (!methods) {
      this.wcString = this.wcString.replace('{{METHODS}}', '');
      return this;
    }
    let methodString = '';
    for (const methodsKey in methods) {
      methodString += `\n${methods[methodsKey].toString().replace('function', methodsKey)}\n`;
    }
    this.wcString = this.wcString.replace('{{METHODS}}', methodString);

    return this;
  }

  private replaceConnectedCallback() {
    const callbacks = this.declaration.hooks?.connected;
    if (!callbacks) {
      this.wcString = this.wcString.replace('{{CONNECTED_CALLBACKS}}', '');
      return this;
    }
    let callString = '';
    for (const callback of callbacks) {
      callString += `this.${callback}();\n`;
    }
    this.wcString = this.wcString.replace('{{CONNECTED_CALLBACKS}}', callString);

    return this;
  }

  private replaceDisconnectedCallback() {
    const callbacks = this.declaration.hooks?.disconnected;
    if (!callbacks) {
      this.wcString = this.wcString.replace('{{DISCONNECTED_CALLBACKS}}', '');
      return this;
    }
    let callString = '';
    for (const callback of callbacks) {
      callString += `this.${callback}();\n`;
    }
    this.wcString = this.wcString.replace('{{DISCONNECTED_CALLBACKS}}', callString);

    return this;
  }

  private replaceAdoptedCallback() {
    const callbacks = this.declaration.hooks?.adopted;
    if (!callbacks) {
      this.wcString = this.wcString.replace('{{ADOPTED_CALLBACKS}}', '');
      return this;
    }
    let callString = '';
    for (const callback of callbacks) {
      callString += `this.${callback}();\n`;
    }
    this.wcString = this.wcString.replace('{{ADOPTED_CALLBACKS}}', callString);

    return this;
  }

  private replaceAttributeChangedCallback() {
    const callbacks = this.declaration.hooks?.attributeChanged;
    if (!callbacks) {
      this.wcString = this.wcString.replace('{{ATTRIBUTE_CHANGED_CALLBACKS}}', '');
      return this;
    }
    let callString = '';
    for (const callback of callbacks) {
      callString += `this.${callback}(name, oldValue, newValue);\n`;
    }
    this.wcString = this.wcString.replace('{{ATTRIBUTE_CHANGED_CALLBACKS}}', callString);

    return this;
  }

  private replaceAfterFirstRenderHook() {
    const callbacks = this.declaration.hooks?.firstRendered;
    if (!callbacks) {
      this.wcString = this.wcString.replace('{{AFTER_FIRST_RENDER_HOOK}}', '');
      return this;
    }
    let callString = '';
    for (const callback of callbacks) {
      callString += `this.${callback}();\n`;
    }
    this.wcString = this.wcString.replace('{{AFTER_FIRST_RENDER_HOOK}}', callString);

    return this;
  }

  private replaceBeforeFirstRenderHook() {
    const callbacks = this.declaration.hooks?.beforeFirstRendered;
    if (!callbacks) {
      this.wcString = this.wcString.replace('{{BEFORE_FIRST_RENDER_HOOK}}', '');
      return this;
    }
    let callString = '';
    for (const callback of callbacks) {
      callString += `this.${callback}();\n`;
    }
    this.wcString = this.wcString.replace('{{BEFORE_FIRST_RENDER_HOOK}}', callString);

    return this;
  }

  private replaceAfterRenderHook() {
    const callbacks = this.declaration.hooks?.rendered;
    if (!callbacks) {
      this.wcString = this.wcString.replace('{{AFTER_RENDER_HOOK}}', '');
      return this;
    }
    let callString = '';
    for (const callback of callbacks) {
      callString += `this.${callback}();\n`;
    }
    this.wcString = this.wcString.replace('{{AFTER_RENDER_HOOK}}', callString);

    return this;
  }

  private replaceBeforeRenderHook() {
    const callbacks = this.declaration.hooks?.beforeRendered;
    if (!callbacks) {
      this.wcString = this.wcString.replace('{{BEFORE_RENDER_HOOK}}', '');
      return this;
    }
    let callString = '';
    for (const callback of callbacks) {
      callString += `this.${callback}();\n`;
    }
    this.wcString = this.wcString.replace('{{BEFORE_RENDER_HOOK}}', callString);

    return this;
  }

  private replaceObservedAttributes() {
    const attributes = this.declaration.attributes
      .filter(attr => attr.observed)
      .map(attr => `'${pascalToKebab(attr.name)}'`)
      .join(',');
    this.wcString = this.wcString.replace('{{OBSERVED_ATTRIBUTES}}', attributes ? `return [${attributes}];` : '');

    return this;
  }

  private replaceAttributesInits() {
    const attributes = this.declaration.attributes.filter(attr => attr.initValue);
    let attributeInitsString = '';
    for (const attribute of attributes) {
      attributeInitsString += `!this.${attribute.name} && this.setAttribute('${pascalToKebab(attribute.name)}', '${attribute.initValue}');\n`;
    }
    this.wcString = this.wcString.replace('{{ATTRIBUTES_INITS}}', attributeInitsString);

    return this;
  }

  private replaceListenersInits() {
    const listeners = this.declaration.listeners;
    if (!listeners) {
      this.wcString = this.wcString.replace('{{LISTENERS_INITS}}', '');
      return this;
    }
    let listenersString = '';
    let index = 1;
    for (const listener of listeners) {
      const { target, event, methods } = listener;
      for (const method of methods) {
        const name = `this.${target.replace(/[^a-zA-Z0-9]+/g, '')}${event}${index}Handler`;
        const handler = `if(!${name}) ${name} = (ev) => {this.${method}(ev)};\n`;
        listenersString += `${handler}this.shadowRoot.querySelectorAll('${target}').forEach(ele => {
          if (ele.hasAttribute('ref-ev-set')) return;
          ele.removeEventListener('${event}', ${name});
          ele.addEventListener('${event}', ${name});
          ele.setAttribute('ref-ev-set','');
        });\n`;
      }
      index++;
    }
    this.wcString = this.wcString.replace('{{LISTENERS_INITS}}', listenersString);

    return this;
  }

  private treeShaking() {
    if (!this.declaration.hooks?.disconnected) {
      this.wcString = this.wcString.replace('disconnectedCallback() {}', '');
    }
    if (!this.declaration.hooks?.adopted) {
      this.wcString = this.wcString.replace('adoptedCallback() {}', '');
    }
    if (!this.declaration.hooks?.beforeFirstRendered) {
      this.wcString = this.wcString.replace('this.beforeFirstRender()', '');
      this.wcString = this.wcString.replace('beforeFirstRender() {}', '');
    }
    if (!this.declaration.hooks?.firstRendered) {
      this.wcString = this.wcString.replace('this.afterFirstRender()', '');
      this.wcString = this.wcString.replace('afterFirstRender() {}', '');
    }
    if (!this.declaration.hooks?.beforeRendered) {
      this.wcString = this.wcString.replace('this.beforeRender()', '');
      this.wcString = this.wcString.replace('beforeRender() {}', '');
    }
    if (!this.declaration.hooks?.rendered) {
      this.wcString = this.wcString.replace('this.afterRender()', '');
      this.wcString = this.wcString.replace('afterRender() {}', '');
    }
    if (!this.declaration.listeners?.length) {
      this.wcString = this.wcString.replace('initListeners() {}', '');
      this.wcString = this.wcString.replaceAll('this.initListeners();', '');
    }
    if (!this.declaration.attributes.length) {
      this.wcString = this.wcString.replace('initAttributes() {}', '');
      this.wcString = this.wcString.replace('static get observedAttributes() {}', '');
      this.wcString = this.wcString.replace('this.initAttributes();', '');
    }
    if (!this.declaration.attributes || this.declaration.attributes.every(attr => attr.observed === false)) {
      this.wcString = this.wcString.replaceAll(/this.updateRefsAttributes\(.*?\);/gs, '');
      this.wcString = this.wcString.replaceAll(/this.updateRefs\(.*?\);/gs, '');
      this.wcString = this.wcString.replace(
        /updateRefsAttributes\s*\([^)]*\)\s*\{((?:[^{}]*|\{((?:[^{}]*|\{((?:[^{}]*|\{(?:[^{}]*|\{(?:[^{}]*|\{[\s\S]*?})*?})*?})*?)})*?)})*?)}/gs,
        ''
      );
      this.wcString = this.wcString.replace(/updateRefs\s*\([^)]*\)\s*\{((?:[^{}]*|\{((?:[^{}]*|\{((?:[^{}]*|\{(?:[^{}]*|\{(?:[^{}]*|\{[\s\S]*?})*?})*?})*?)})*?)})*?)}/gs, '');
      this.wcString = this.wcString.replace(
        /attributeChangedCallback\s*\([^)]*\)\s*\{((?:[^{}]*|\{((?:[^{}]*|\{((?:[^{}]*|\{(?:[^{}]*|\{(?:[^{}]*|\{[\s\S]*?})*?})*?})*?)})*?)})*?)}/gs,
        ''
      );
      this.wcString = this.wcString.replace(/render\s*\([^)]*\)\s*\{((?:[^{}]*|\{((?:[^{}]*|\{((?:[^{}]*|\{(?:[^{}]*|\{(?:[^{}]*|\{[\s\S]*?})*?})*?})*?)})*?)})*?)}/gs, '');
    }
    if (!this.declaration.methods || !Object.keys(this.declaration.methods).length) {
      this.wcString = this.wcString.replaceAll(/this.updateMethods\(.*?\);/gs, '');
      this.wcString = this.wcString.replace(/updateMethods\s*\([^)]*\)\s*\{((?:[^{}]*|\{(?:[^{}]*|\{(?:[^{}]*|\{[\s\S]*?})*?})*?})*?)}/gs, '');
    }
    if (!this.declaration.slotted) {
      this.wcString = this.wcString.replace('<slot></slot>\n', '');
    }
    if (!this.declaration.styleFile && !this.declaration.style) {
      this.wcString = this.wcString.replace('<style class="vars">:host {  }</style>', '');
      this.wcString = this.wcString.replace('<style class="style"></style>', '');
      this.wcString = this.wcString.replace(/renderCss\s*\([^)]*\)\s*\{((?:[^{}]*|\{(?:[^{}]*|\{(?:[^{}]*|\{[\s\S]*?})*?})*?})*?)}/gs, '');
      this.wcString = this.wcString.replaceAll(/if\s*\(\s*attribute\.startsWith\s*\(\s*["']style-["']\s*\)\s*\)\s*{\s*this\.renderCss\(\);\s*}/gs, '');
    }

    const ifRegex = new RegExp(/<[^>]*\s~if[^>]*>/g);
    const ifsElements = this.html && this.html.matchAll(ifRegex);
    if (!Array.from(ifsElements || []).length) {
      this.wcString = this.wcString.replaceAll(/this.checkIfs\(.*?\);/gs, '');
      this.wcString = this.wcString.replaceAll(/this.updateRefsIfs\(.*?\);/gs, '');
      this.wcString = this.wcString.replace(/updateRefsIfs\s*\([^)]*\)\s*{(?:[^{}]*|{(?:[^{}]*|{[^{}]*})*})*}/gs, '');
      this.wcString = this.wcString.replace(/checkIfElse\s*\([^)]*\)\s*{(?:[^{}]*|{(?:[^{}]*|{[^{}]*})*})*}/gs, '');
      this.wcString = this.wcString.replace(/uncommentElement\s*\([^)]*\)\s*{(?:[^{}]*|{(?:[^{}]*|{[^{}]*})*})*}/gs, '');
      this.wcString = this.wcString.replace(/commentElement\s*\([^)]*\)\s*{(?:[^{}]*|{(?:[^{}]*|{[^{}]*})*})*}/gs, '');
      this.wcString = this.wcString.replace(/checkIfs\s*\([^)]*\)\s*\{((?:[^{}]*|\{(?:[^{}]*|\{(?:[^{}]*|\{[\s\S]*?})*?})*?})*?)}/gs, '');
    }

    return this;
  }

  private format() {
    try {
      this.wcString = prettier.format(this.wcString, { parser: 'babel' });
      return this;
    } catch (e) {
      throw new Error(`\n [${this.className}] - failed to format ${(e as Error).message}`);
    }
  }

  private async minify() {
    if (this.declaration.config?.minify?.enabled === false) return this;
    try {
      this.wcString = (await minify(this.wcString, this.declaration.config?.minify?.config)).code || this.wcString;
      return this;
    } catch (e) {
      throw new Error(`\n [${this.className}] - failed to minify ${(e as Error).message}`);
    }
  }

  private output(outputType: DeclarativeWebComponentOutputType) {
    switch (outputType) {
      case DeclarativeWebComponentOutputType.FILE:
        return this.outputFile();
      case DeclarativeWebComponentOutputType.STRING:
        return this.wcString.toString();
    }
  }

  private outputFile() {
    try {
      const filePath = this.declaration.config?.outputDir || path.join(process.cwd(), 'output', (this.declaration.config?.outputFilename || this.declaration.tagName) + '.js');
      fs.writeFileSync(filePath, Buffer.from(this.wcString));
      return filePath;
    } catch (e) {
      throw new Error(`\n [${this.className}] - failed to output file ${(e as Error).message}`);
    }
  }
}
