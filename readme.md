# DoubleUC - Declarative Web Component Generator

## Overview

`DoubleUC` is a tool to generate web component based on declaration schema.

It's doing all the heavy lifting and boiler plates code that WC APIs has.

It's purpose it to simplify & make it easier to create a small web building block to use anywhere.

#### Small Web Building Block?
well in my perspective, web components hasn't lifted as it should have been.

one of the reasons is that it's easy to do all in any frontend modern framework.

but, the use of multiple frameworks on the same app has increased in the recently years.

big and complex state managed components are most likely to be build from smaller components that are also built
from smaller components, why it needed to migrate, update and maintain components across different frameworks?

if we can break down component to its smallest building blocks - the ones without too much state handling or much logic - a pure
ui function - this is the basic building block.

modern framework should manage components state, but why waste time on pieces of the app that should look, feel and behave exactly the same across the app on multiple frameworks?

**doubleuc is a pure ui functions generator tool**

## Features

- Standard Web Component - based on declarative object.
- Shipped without any extra code.
- Compatible with all modern browsers - 100% Native.
- Compatible with all modern frontend frameworks: React, Vue, Angular, Svelte and any other u can think of.
- Templating with auto attribute/method binding - inline or html file.
- Styling - CSS/SASS, inline or file.
- Styling Templating - WIP.
- Slots - WIP.
- Attribute auto initiation and observing.
- Event Listening auto binding.
- Lifecycle Hooks - connected, disconnected, adopted, attributeChanged
- Pretty code - prettier.
- minification - terser.
- Tree Shaking - WIP.
- CLI - WIP.
- npm - WIP.

## Declarative Web Component

```typescript
const dwc: DeclarativeWebComponent = {
  tagName: 'example-component', // html tag name - required
  templateHtml: `<h1>Hello {{world}}!</h1>`, // inline template html - required or file
  templateFile: './src/mock/mock.html', // file based templated html - required or inline
  style: 'h1 {font-size: 2rem}', // inline style - scss
  styleFile: './src/mock/mock.scss', // file based style - scss
  attributes: [ // array of wc attributes - optional
    {
      name: 'world', // attribute name
      initValue: 'world', // initiated value
      observed: true // observe changes
    }
  ],
  methods: { // private methods to call from all over the wc flow - must be a function scope - optional
    connected: function() {
      console.log('connected!');
    },
    disconnected: function() {
      console.log('disconnected!');
    },
    adopted: function() {
      console.log('adopted!');
    },
    attributeChanged: function(name, oldValue, newValue) {
      console.log({ name, oldValue, newValue });
    },
    clicked: function() {
      console.log('click')
    }
  },
  hooks: { // lifecycle hooks - optional
    connected: ['connected'], // on wc connect - cbs are the methods names to call - optional
    disconnected: ['disconnected'], // on wc disconnect - cbs are the methods names to call - optional
    adopted: ['adopted'], // on wc adopted - cbs are the methods names to call - optional
    attributeChanged: ['attributeChanged'] // on wc attribute change - cbs are the methods names to call - optional
  },
  listeners: [ // event listeners - initiated after every render - optional
    {
      target: 'h1', // target selector
      event: 'click', // event name
      methods: ['clicked'] // cbs are the methods names to call
    },
  ],
  config: { // generator config - optional
    outputDir: './output', // output directory - optional
    outputFilename: 'example-component', // output file name - optional
    minify: {
      enabled: true, // enabled terser minification - optional
      config: {} // terser config - optional
    }
  }
};
```

### Examples

#### Counter Component:

```typescript
const mockCounter: DeclarativeWebComponent = {
  tagName: 'mock-counter',
  templateHtml: `
    <div>
      <p>Counter: {{counter}}</p>
      <button id="count">count</button>
      <button id="reset">reset</button>
    </div>    
  `,
  style: 'p {font-size: 2rem}',
  attributes: [{ name: 'counter', initValue: '0', observed: true }],
  methods: {
    count: function() {
      this.setAttribute(
        'counter',
        (parseInt(this.getAttribute('counter') as string) + 1).toString()
      );
    },
    reset: function() {
      this.setAttribute('counter', '0');
    }
  },
  listeners: [
    { target: '#count', event: 'click', methods: ['count'] },
    { target: '#reset', event: 'click', methods: ['reset'] }
  ]
};
```

Will produce this file:

```typescript
// mock-counter.js

class MockCounter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  #count() {
    this.setAttribute(
      "counter",
      (parseInt(this.getAttribute("counter")) + 1).toString()
    );
  }

  #reset() {
    this.setAttribute("counter", "0");
  }

  #initAttributes() {
    this.setAttribute("counter", "0");
  }

  #initListeners() {
    this.shadowRoot.querySelectorAll("#count").forEach((ele) =>
      ele.addEventListener("click", (ev) => {
        this.#count(ev);
      })
    );
    this.shadowRoot.querySelectorAll("#reset").forEach((ele) =>
      ele.addEventListener("click", (ev) => {
        this.#reset(ev);
      })
    );
  }

  static get observedAttributes() {
    return ["counter"];
  }

  connectedCallback() {
    this.#initAttributes();

    this.render();
  }

  disconnectedCallback() {
  }

  adoptedCallback() {
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (newValue !== oldValue) this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>h1{font-size:2rem}</style>
      <div>
        <p>Counter: ${this.getAttribute("counter")}</p>
        <button id="count">count</button>
        <button id="reset">reset</button>
      </div>
    `.trim();
    this.#initListeners();
  }
}

customElements.define("mock-counter", MockCounter);
```