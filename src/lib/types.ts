export type DeclarativeWebComponent = {
  tagName: string;
  attributes: DeclarativeWebComponentAttribute[];
  templateHtml?: string;
  templateFile?: string;
  style?: string;
  styleFile?: string;
  hooks?: DeclarativeWebComponentHooks;
  methods?: Record<
    string,
    (name?: string, oldValue?: string, newValue?: string) => unknown
  >;
  listeners?: DeclarativeWebComponentListener[];
  outputDir?: string;
  outputFilename?: string;
};

export type DeclarativeWebComponentAttribute = {
  name: string;
  observed?: boolean;
  initValue?: string;
};

type DeclarativeWebComponentHooks = {
  adopted?: string[];
  connected?: string[];
  disconnected?: string[];
  attributeChanged?: string[];
};

type DeclarativeWebComponentListener = {
  target: string;
  event: string;
  methods: string[];
};

export const enum DeclarativeWebComponentOutputType {
  FILE,
  STRING
}
