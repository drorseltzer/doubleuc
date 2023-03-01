import { DeclarativeWebComponent, DeclarativeWebComponentOutputType } from '../types';
import path from 'path';
import fs from 'fs';
import prettier from 'prettier';
import { fileExist, kebabToPascal, pascalToKebab } from './utils.js';
import sass from 'sass';
import { minify } from 'terser';

export class DoubleUCGenerator {
  private wcString = '';
  private readonly declaration: DeclarativeWebComponent;
  private className?: string;

  constructor(declaration: DeclarativeWebComponent) {
    this.declaration = declaration;
  }

  async generateWebComponent(
    outputType: DeclarativeWebComponentOutputType = DeclarativeWebComponentOutputType.FILE
  ) {
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
          .format()
          .treeShaking()
          .format()
          .minify()
      ).output(outputType);
    } catch (e) {
      throw new Error(
        `\n [${this.className}] - failed to build component ${tagName} ${(e as Error).message}`
      );
    }
  }

  private getTemplateFile() {
    const filePath = path.join(__dirname, '../../src/lib', '.wc-template');
    if (!fileExist(filePath))
      throw new Error(`\n [${this.className}] - cannot find template file at ${filePath}`);
    const file = fs.readFileSync(filePath);
    this.wcString = file.toString();

    return this;
  }

  private replaceClassName() {
    if (!this.className)
      throw new Error(
        `\n [${this.className}] - cannot parse class name for tag ${this.declaration.tagName}`
      );
    this.wcString = this.wcString.replaceAll('{{CLASS_NAME}}', this.className);

    return this;
  }

  private replaceTagName() {
    if (!this.declaration.tagName)
      throw new Error(`\n [${this.className}] - invalid tag name ${this.declaration.tagName}`);
    this.wcString = this.wcString.replaceAll('{{TAG_NAME}}', this.declaration.tagName);

    return this;
  }

  private replaceTemplateHtml() {
    const html = this.getHtmlFile() || this.declaration.templateHtml;
    const replacedTemplateHtmlListeners = html ? this.replaceHtmlListeners(html) : '';
    const replacedTemplateHtmlClasses = replacedTemplateHtmlListeners
      ? this.replaceHtmlRefAttributes(replacedTemplateHtmlListeners)
      : '';
    const replacedTemplateHtml = replacedTemplateHtmlClasses
      ? this.replaceTemplateHtmlLiterals(replacedTemplateHtmlClasses)
      : '';
    this.wcString = this.wcString.replaceAll('{{TEMPLATE_HTML}}', replacedTemplateHtml || '');

    return this;
  }

  private getHtmlFile() {
    if (!this.declaration.templateFile) return;
    if (!fileExist(this.declaration.templateFile))
      throw new Error(
        `\n component html template file not exists ${this.declaration.templateFile}`
      );
    return fs.readFileSync(this.declaration.templateFile).toString();
  }

  private loadStyleFile() {
    if (!this.declaration.styleFile) return;
    if (!fileExist(this.declaration.styleFile))
      throw new Error(
        `\n [${this.className}] - component style template file not exists ${this.declaration.styleFile}`
      );
    return fs.readFileSync(this.declaration.styleFile).toString();
  }

  private replaceTemplateCssLiterals(css: string) {
    const regex = new RegExp(/{{~(.*?)}}/g);
    const literals = css.match(regex);
    if (!literals) return css;
    let replacedTemplateCss = css.toString();
    for (const literal of literals) {
      const stripped = literal.replaceAll(/({{~|}})/g, '');
      const findAttribute = this.declaration.attributes.find(
        attribute => attribute.name === stripped
      );
      if (!findAttribute)
        throw new Error(`\n [${this.className}] - css template attribute not found ${stripped}`);
      replacedTemplateCss = replacedTemplateCss.replace(
        literal,
        `var(--${pascalToKebab(stripped)});`
      );
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
      const findAttribute = this.declaration.attributes.find(
        attribute => attribute.name === stripped
      );
      if (!findAttribute)
        throw new Error(`\n [${this.className}] - css template attribute not found ${stripped}`);
      replacedCssVars += `--${pascalToKebab(stripped)}: \${this.${stripped}};`;
    }

    this.wcString = this.wcString.replaceAll('{{CSS_VARS}}', replacedCssVars);

    return this;
  }

  private replaceStyle() {
    try {
      const style = this.loadStyleFile() || this.declaration.style;
      const styleString = style && style.length ? this.replaceTemplateCssLiterals(style) : '';
      const compiledStyle = styleString
        ? sass.compileString(styleString, { style: 'compressed' }).css
        : '';
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
          getterString = `this.hasAttribute('${pascalToKebab(
            attribute.name
          )}') ? +this.getAttribute('${pascalToKebab(attribute.name)}') : undefined`;
          setterString = `this.setAttribute('${pascalToKebab(attribute.name)}', value.toString());`;
          break;
        case 'boolean':
          getterString = `this.hasAttribute('${pascalToKebab(
            attribute.name
          )}') ? this.getAttribute('${pascalToKebab(attribute.name)}') === 'true' : false`;
          setterString = `this.setAttribute('${pascalToKebab(attribute.name)}', value === 'true');`;
          break;
        case 'array':
          getterString = `this.hasAttribute('${pascalToKebab(
            attribute.name
          )}') ? JSON.parse(this.getAttribute('${pascalToKebab(attribute.name)}')) : undefined`;
          setterString = `this.setAttribute('${pascalToKebab(
            attribute.name
          )}', JSON.stringify(value));`;
          break;
        case 'json':
          getterString = `this.hasAttribute('${pascalToKebab(
            attribute.name
          )}') ? JSON.parse(this.getAttribute('${pascalToKebab(attribute.name)}')) : undefined`;
          setterString = `this.setAttribute('${pascalToKebab(
            attribute.name
          )}', JSON.stringify(value));`;
          break;
        default:
          getterString = `this.getAttribute('${pascalToKebab(attribute.name)}')`;
          setterString = `this.setAttribute('${pascalToKebab(attribute.name)}', value);`;
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
        this.declaration.listeners.push({ target: `#${id}`, event: eventName, methods: [method] });
        replacedTemplateHtml = replacedTemplateHtml.replace(`${fullEventString}`, '');
      }
    }
    return replacedTemplateHtml;
  }

  private replaceHtmlRefAttributes(html: string) {
    const regex = new RegExp(/<[^>]*\s~attr-[^>]*>/g);
    const classElements = html.matchAll(regex);
    if (!classElements) return html;
    let replacedTemplateHtml = html.toString();
    for (const classElement of classElements) {
      const [elementOpenTag] = classElement;
      const classesRegex = elementOpenTag.matchAll(/~attr-(.*?)="(.*?)"/g);
      if (!classesRegex) continue;
      for (const classRegex of classesRegex) {
        const [full, attribute, value] = classRegex;
        const classString = `${attribute}="\${this.${value}}"`;
        replacedTemplateHtml = replacedTemplateHtml.replace(full, `ref-attribute ${classString}`);
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
      const isFunction = stripped.includes('(');
      if (isFunction) {
        replacedTemplateHtml = replacedTemplateHtml.replace(
          literal,
          `<span class="ref-method ref-method-${stripped.replace(
            /\(.*?\)/g,
            ''
          )}">\${this.${stripped}}</span>`
        );
        continue;
      }

      const findAttribute = this.declaration.attributes.find(
        attribute => attribute.name === stripped
      );
      if (!findAttribute)
        throw new Error(`\n [${this.className}] - template attribute not found ${stripped}`);
      replacedTemplateHtml = replacedTemplateHtml.replace(
        literal,
        `<span class="ref-${
          stripped.startsWith('Style') ? pascalToKebab(stripped) : stripped
        }">\${this.${stripped}}</span>`
      );
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

  private replaceObservedAttributes() {
    const attributes = this.declaration.attributes
      .filter(attr => attr.observed)
      .map(attr => `'${pascalToKebab(attr.name)}'`)
      .join(',');
    this.wcString = this.wcString.replace(
      '{{OBSERVED_ATTRIBUTES}}',
      attributes ? `return [${attributes}];` : ''
    );

    return this;
  }

  private replaceAttributesInits() {
    const attributes = this.declaration.attributes.filter(attr => attr.initValue);
    let attributeInitsString = '';
    for (const attribute of attributes) {
      attributeInitsString += `!this.${attribute.name} && this.setAttribute('${pascalToKebab(
        attribute.name
      )}', '${attribute.initValue}');\n`;
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
    for (const listener of listeners) {
      const { target, event, methods } = listener;
      for (const method of methods) {
        listenersString += `this.shadowRoot.querySelectorAll('${target}').forEach(ele => ele.addEventListener('${event}', ev => {this.${method}(ev)}));\n`;
      }
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
    if (!this.declaration.listeners?.length) {
      this.wcString = this.wcString.replace('initListeners() {}', '');
      this.wcString = this.wcString.replaceAll('this.initListeners();', '');
    }
    if (!this.declaration.attributes.length) {
      this.wcString = this.wcString.replace('initAttributes() {}', '');
      this.wcString = this.wcString.replace('static get observedAttributes() {}', '');
      this.wcString = this.wcString.replace('this.initAttributes();', '');
    }
    if (!this.declaration.slotted) {
      this.wcString = this.wcString.replace('<slot></slot>\n', '');
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
    if (!this.declaration.config?.minify?.enabled) return this;
    try {
      this.wcString =
        (await minify(this.wcString, this.declaration.config?.minify?.config)).code ||
        this.wcString;
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
      const filePath =
        this.declaration.config?.outputDir ||
        path.join(
          process.cwd(),
          'output',
          (this.declaration.config?.outputFilename || this.declaration.tagName) + '.js'
        );
      fs.writeFileSync(filePath, Buffer.from(this.wcString));
      return filePath;
    } catch (e) {
      throw new Error(`\n [${this.className}] - failed to output file ${(e as Error).message}`);
    }
  }
}
