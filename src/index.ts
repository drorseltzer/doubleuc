import { DoubleUCGenerator } from './lib/double-u-c-generator.js';
import { DeclarativeWebComponent } from './lib/types.js';

export { DeclarativeWebComponent } from './lib/types.js';
export { DoubleUCGenerator } from './lib/double-u-c-generator.js';

const mockDec: DeclarativeWebComponent = {
  tagName: 'mock-dec',
  templateHtml: `<h1>{{hello()}} {{world}}!</h1>`,
  style: 'h1 {font-size: 2rem}',
  attributes: [{ name: 'world', initValue: 'world', observed: true }],
  methods: {
    hello: function () {
      return 'hello';
    },
    connected: function () {
      console.log('connected!');
    },
    disconnected: function () {
      console.log('disconnected!');
    },
    adopted: function () {
      console.log('adopted!');
    },
    attributeChanged: function (name, oldValue, newValue) {
      console.log({ name, oldValue, newValue });
    }
  },
  hooks: {
    connected: ['connected'],
    disconnected: ['disconnected'],
    adopted: ['adopted'],
    attributeChanged: ['attributeChanged']
  },
  config: {
    minify: {
      enabled: true
    }
  }
};

new DoubleUCGenerator(mockDec).generateWebComponent();
