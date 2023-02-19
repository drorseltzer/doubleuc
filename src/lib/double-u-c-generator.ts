import { DeclarativeWebComponent, DeclarativeWebComponentOutputType } from './types';
import path from 'path';
import fs from 'fs';
import prettier from 'prettier';
import { kebabToPascal } from './utils.js';
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

    return (
      await this.getTemplateFile()
        .replaceClassName()
        .replaceTagName()
        .replaceTemplateHtml()
        .replaceStyle()
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
  }

  private getTemplateFile() {
    const filePath = path.join(__dirname, '../../src/lib', '.wc-template');
    const file = fs.readFileSync(filePath);
    this.wcString = file.toString();

    return this;
  }

  private replaceClassName() {
    if (!this.className) return this;
    this.wcString = this.wcString.replaceAll('{{CLASS_NAME}}', this.className);

    return this;
  }

  private replaceTagName() {
    this.wcString = this.wcString.replaceAll('{{TAG_NAME}}', this.declaration.tagName);

    return this;
  }

  private replaceTemplateHtml() {
    const html = this.getHtmlFile() || this.declaration.templateHtml;
    const replacedTemplateHtml = html ? this.replaceTemplateHtmlLiterals(html) : '';
    this.wcString = this.wcString.replaceAll('{{TEMPLATE_HTML}}', replacedTemplateHtml || '');

    return this;
  }

  private getHtmlFile() {
    if (!this.declaration.templateFile) return;
    return fs.readFileSync(this.declaration.templateFile).toString();
  }

  private replaceStyle() {
    const style = this.declaration.styleFile
      ? sass.compile(this.declaration.styleFile, { style: 'compressed' }).css
      : this.declaration.style
      ? sass.compileString(this.declaration.style, { style: 'compressed' }).css
      : '';
    this.wcString = this.wcString.replaceAll('{{STYLE}}', style);

    return this;
  }

  private replaceTemplateHtmlLiterals(html: string) {
    const regex = new RegExp(/{{(.*?)}}/g);
    const literals = html.match(regex);
    if (!literals) return this.declaration.templateHtml;
    let replacedTemplateHtml = html.toString();
    for (const literal of literals) {
      const stripped = literal.replaceAll(/({{|}})/g, '');
      const isFunction = stripped.includes('(');
      if (isFunction) {
        replacedTemplateHtml = replacedTemplateHtml.replace(literal, `\${this.#${stripped}}`);
        continue;
      }

      const findAttribute = this.declaration.attributes.find(
        attribute => attribute.name === stripped
      );
      if (!findAttribute) continue;
      replacedTemplateHtml = replacedTemplateHtml.replace(
        literal,
        `\${this.getAttribute('${stripped}')}`
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
      methodString += `\n#${methods[methodsKey].toString().replace('function', methodsKey)}\n`;
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
      callString += `this.#${callback}();\n`;
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
      callString += `this.#${callback}();\n`;
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
      callString += `this.#${callback}();\n`;
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
      callString += `this.#${callback}(name, oldValue, newValue);\n`;
    }
    this.wcString = this.wcString.replace('{{ATTRIBUTE_CHANGED_CALLBACKS}}', callString);

    return this;
  }

  private replaceObservedAttributes() {
    const attributes = this.declaration.attributes
      .filter(attr => attr.observed)
      .map(attr => `'${attr.name}'`)
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
      attributeInitsString += `this.setAttribute('${attribute.name}', '${attribute.initValue}');\n`;
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
        listenersString += `this.shadowRoot.querySelectorAll('${target}').forEach(ele => ele.addEventListener('${event}', ev => {this.#${method}(ev)}));\n`;
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
      this.wcString = this.wcString.replace('#initListeners() {}', '');
      this.wcString = this.wcString.replace('this.#initListeners();', '');
    }
    if (!this.declaration.attributes.length) {
      this.wcString = this.wcString.replace('#initAttributes() {}', '');
      this.wcString = this.wcString.replace('static get observedAttributes() {}', '');
      this.wcString = this.wcString.replace('this.#initAttributes();', '');
    }

    return this;
  }

  private format() {
    this.wcString = prettier.format(this.wcString, { parser: 'babel' });

    return this;
  }

  private async minify() {
    if (!this.declaration.config?.minify?.enabled) return this;
    this.wcString =
      (await minify(this.wcString, this.declaration.config?.minify?.config)).code || this.wcString;

    return this;
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
    const filePath =
      this.declaration.config?.outputDir ||
      path.join(
        __dirname,
        '../../output',
        (this.declaration.config?.outputFilename || this.declaration.tagName) + '.js'
      );
    fs.writeFileSync(filePath, Buffer.from(this.wcString));

    return filePath;
  }
}
