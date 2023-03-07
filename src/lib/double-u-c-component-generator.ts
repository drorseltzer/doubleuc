import { kebabToPascal, pascalToKebab } from './utils.js';
import path from 'path';
import fs from 'fs';
import { DeclarativeWebComponentGeneratorOutputType } from '../types.js';

export class DoubleUCComponentGenerator {
  name: string;
  className: string;
  tagName: string;
  argPath = '';
  componentString = '';
  outputType: DeclarativeWebComponentGeneratorOutputType;

  constructor(
    name: string,
    outputType: DeclarativeWebComponentGeneratorOutputType = DeclarativeWebComponentGeneratorOutputType.JS
  ) {
    if (name.includes('/')) {
      const parts = name.split('/');
      this.name = parts.at(-1) || '';
      this.argPath = parts.slice(0, -1).join('/');
    } else {
      this.name = name;
    }
    this.className = !this.name.includes('-') ? this.name : kebabToPascal(this.name);
    this.tagName = pascalToKebab(this.className);
    this.outputType = outputType;
  }

  generateComponentDeclarationFiles() {
    return this.getTemplateFile()
      .replaceTagName()
      .replaceTemplateFilePath()
      .replaceStyleFilePath()
      .createDir()
      .output();
  }

  private getTemplateFile() {
    const templateFileName =
      this.outputType === DeclarativeWebComponentGeneratorOutputType.TS
        ? '.wc-component-template-ts'
        : '.wc-component-template';
    const filePath = path.join(__dirname, '../../src/lib', templateFileName);
    const file = fs.readFileSync(filePath);
    this.componentString = file.toString();

    return this;
  }

  private replaceTagName() {
    this.componentString = this.componentString.replaceAll('{{COMPONENT_TAG_NAME}}', this.tagName);

    return this;
  }

  private replaceTemplateFilePath() {
    const htmlFilePath = path.join(
      process.cwd(),
      this.argPath,
      this.tagName,
      this.tagName + '.html'
    );
    console.log(htmlFilePath);
    this.componentString = this.componentString.replaceAll('{{TEMPLATE_FILE_PATH}}', htmlFilePath);

    return this;
  }

  private replaceStyleFilePath() {
    const scssFilePath = path.join(
      process.cwd(),
      this.argPath,
      this.tagName,
      this.tagName + '.scss'
    );
    this.componentString = this.componentString.replaceAll('{{STYLE_FILE_PATH}}', scssFilePath);

    return this;
  }

  private createDir() {
    const dirPath = path.join(process.cwd(), this.argPath, this.tagName);

    try {
      fs.accessSync(dirPath);
    } catch (e) {
      fs.mkdirSync(dirPath);
    }

    return this;
  }

  private output() {
    const extension =
      this.outputType === DeclarativeWebComponentGeneratorOutputType.TS ? '.ts' : '.js';
    const jsFilePath = path.join(
      process.cwd(),
      this.argPath,
      this.tagName,
      this.tagName + extension
    );
    const htmlFilePath = path.join(
      process.cwd(),
      this.argPath,
      this.tagName,
      this.tagName + '.html'
    );
    const scssFilePath = path.join(
      process.cwd(),
      this.argPath,
      this.tagName,
      this.tagName + '.scss'
    );
    fs.writeFileSync(jsFilePath, Buffer.from(this.componentString));
    fs.writeFileSync(htmlFilePath, Buffer.from(''));
    fs.writeFileSync(scssFilePath, Buffer.from(''));

    return [jsFilePath, htmlFilePath, scssFilePath];
  }
}
