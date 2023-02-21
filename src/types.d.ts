import { MinifyOptions } from 'terser';

export type DeclarativeWebComponent = {
  tagName: string;
  attributes: DeclarativeWebComponentAttribute[];
  templateHtml?: string;
  templateFile?: string;
  style?: string;
  styleFile?: string;
  hooks?: DeclarativeWebComponentHooks;
  methods?: Record<string, (name?: string, oldValue?: string, newValue?: string) => unknown>;
  listeners?: DeclarativeWebComponentListener[];
  slotted?: boolean;
  config?: DeclarativeWebComponentConfig;
};

export type DeclarativeWebComponentAttribute = {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'json';
  observed?: boolean;
  initValue?: string;
};

export type DeclarativeWebComponentHooks = {
  adopted?: string[];
  connected?: string[];
  disconnected?: string[];
  attributeChanged?: string[];
};

export type DeclarativeWebComponentListener = {
  target: string;
  event: string;
  methods: string[];
};

export declare const enum DeclarativeWebComponentOutputType {
  FILE = 0,
  STRING = 1
}

export type DeclarativeWebComponentConfig = {
  outputDir?: string;
  outputFilename?: string;
  minify?: {
    enabled?: boolean;
    config?: MinifyOptions;
  };
};

export declare class DoubleUCGenerator {
  private wcString;
  private readonly declaration;
  private className?;

  constructor(declaration: DeclarativeWebComponent);

  generateWebComponent(outputType?: DeclarativeWebComponentOutputType): Promise<string>;

  private getTemplateFile;
  private replaceClassName;
  private replaceTagName;
  private replaceTemplateHtml;
  private getHtmlFile;
  private replaceStyle;
  private replaceTemplateHtmlLiterals;
  private replaceMethods;
  private replaceConnectedCallback;
  private replaceDisconnectedCallback;
  private replaceAdoptedCallback;
  private replaceAttributeChangedCallback;
  private replaceObservedAttributes;
  private replaceAttributesInits;
  private replaceListenersInits;
  private treeShaking;
  private format;
  private minify;
  private output;
  private outputFile;
}
