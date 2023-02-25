import { kebabToPascal, pascalToKebab } from './utils.js';
import path from 'path';
import fs from 'fs';
import { DeclarativeWebComponentOutputType } from '../types.js';

export class DoubleUCComponentGenerator {
  name: string;
  className: string;
  tagName: string;
  componentString = '';

  constructor(name: string) {
    this.name = name;
    this.className = !name.includes('-') ? name : kebabToPascal(name);
    this.tagName = pascalToKebab(this.className);
  }

  generateComponentDeclarationFiles(
    outputType: DeclarativeWebComponentOutputType = DeclarativeWebComponentOutputType.FILE
  ) {
    return this.getTemplateFile()
      .replaceTagName()
      .replaceTemplateFilePath()
      .replaceStyleFilePath()
      .createDir()
      .output(outputType);
  }

  private getTemplateFile() {
    const filePath = path.join(__dirname, '../../src/lib', '.wc-component-template');
    const file = fs.readFileSync(filePath);
    this.componentString = file.toString();

    return this;
  }

  private replaceTagName() {
    this.componentString = this.componentString.replaceAll('{{COMPONENT_TAG_NAME}}', this.tagName);

    return this;
  }

  private replaceTemplateFilePath() {
    const htmlFilePath = path.join(process.cwd(), this.tagName, this.tagName + '.html');
    this.componentString = this.componentString.replaceAll('{{TEMPLATE_FILE_PATH}}', htmlFilePath);

    return this;
  }

  private replaceStyleFilePath() {
    const scssFilePath = path.join(process.cwd(), this.tagName, this.tagName + '.scss');
    this.componentString = this.componentString.replaceAll('{{STYLE_FILE_PATH}}', scssFilePath);

    return this;
  }

  private createDir() {
    const dirPath = path.join(process.cwd(), this.tagName);

    try {
      fs.accessSync(dirPath);
    } catch (e) {
      fs.mkdirSync(dirPath);
    }

    return this;
  }

  private output(outputType: DeclarativeWebComponentOutputType) {
    switch (outputType) {
      case DeclarativeWebComponentOutputType.FILE:
        return this.outputFile();
      case DeclarativeWebComponentOutputType.STRING:
        return this.componentString.toString();
    }
  }

  private outputFile() {
    const jsFilePath = path.join(process.cwd(), this.tagName, this.tagName + '.js');
    const htmlFilePath = path.join(process.cwd(), this.tagName, this.tagName + '.html');
    const scssFilePath = path.join(process.cwd(), this.tagName, this.tagName + '.scss');
    fs.writeFileSync(jsFilePath, Buffer.from(this.componentString));
    fs.writeFileSync(htmlFilePath, Buffer.from(''));
    fs.writeFileSync(scssFilePath, Buffer.from(''));

    return [jsFilePath, htmlFilePath, scssFilePath];
  }
}
