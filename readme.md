# DoubleUC - Declarative Web Component Generator

 - [Overview](https://github.com/drorseltzer/doubleuc#overview)
 - [Features](https://github.com/drorseltzer/doubleuc#features)
 - [How To Use](https://github.com/drorseltzer/doubleuc#how-to-use)
   - [Install](https://github.com/drorseltzer/doubleuc#install---wip)
   - [CLI](https://github.com/drorseltzer/doubleuc#cli)
   - [API](https://github.com/drorseltzer/doubleuc#api)
 - [Declarative Web Component](https://github.com/drorseltzer/doubleuc#declarative-web-component)
 - [Attributes](https://github.com/drorseltzer/doubleuc#attributes)
 - [Methods](https://github.com/drorseltzer/doubleuc#methods)
 - [Event Listeners](https://github.com/drorseltzer/doubleuc#event-listeners)
 - [Lifecycle Hooks](https://github.com/drorseltzer/doubleuc#lifecycle-hooks)
 - [Templating](https://github.com/drorseltzer/doubleuc#templating)
   - [HTML Template](https://github.com/drorseltzer/doubleuc#html-template)
   - [Conditional Rendering](https://github.com/drorseltzer/doubleuc#conditional-rendering)
   - [Template Attributes](https://github.com/drorseltzer/doubleuc#template-attributes)
   - [Template Properties](https://github.com/drorseltzer/doubleuc#template-properties)
   - [Template Event Listener](https://github.com/drorseltzer/doubleuc#template-event-listener)
   - [Template Lists](https://github.com/drorseltzer/doubleuc#template-lists)
   - [Nesting Components](https://github.com/drorseltzer/doubleuc#nesting-components)
   - [CSS Template](https://github.com/drorseltzer/doubleuc#css-template--attribute-binding)
 - [Typescript](https://github.com/drorseltzer/doubleuc#typescript)
 - [Examples](https://github.com/drorseltzer/doubleuc#examples)

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

#### DoubleUC is a pure UI functions generator tool

## Features

- Standard Web Component - based on declarative object.
- Shipped without any extra code - almost invisible footprint.
- No base class, no imports to bundle.
- Compatible with all modern browsers - 100% Native.
- Compatible with all modern frontend frameworks: React, Vue, Angular, Svelte and any other u can think of.
- Templating with auto attribute/method binding - inline or html file.
- Styling - CSS/SASS, inline or file.
- Styling Templating - ability to dynamically change css with css vars.
- Slot auto inject.
- Attribute auto initiation and observing.
- Typed Attributes - string | number | boolean | array | json.
- Event Listening auto binding.
- Lifecycle Hooks - connected, disconnected, adopted, attributeChanged
- Pretty code - prettier.
- minification - terser.
- Tree Shaking.
- CLI - build components / generate declaration files, - TODO: init project.
- npm - WIP.

## How To Use

### Install - WIP

```
npm i doubleuc
```

### CLI

**Generate new component declaration file:**

```
npx doubleuc new [component-name] [target: ts|js]
```

**Generate component from declaration file:**

```
npx doubleuc build ./components
npx doubleuc b ./components
// OR
npx doubleuc build ./components/comnponent.js
npx doubleuc b ./components/comnponent.js
```
### API

```typescript
import { DoubleUCGenerator, DeclarativeWebComponent, DeclarativeWebComponentOutputType } from 'doubleuc';

const mockDec: DeclarativeWebComponent = { ... }
const generator = new DoubleUCGenerator(mockDec);
const stringComponent = await generateWebComponent(DeclarativeWebComponentOutputType.STRING);
await generateWebComponent(); // File
```

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
      observed: true, // observe changes
      type: 'string' // attribute type - string | number | boolean | array | json
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
  slotted: false, // inject slot element
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

## Attributes
Each declared attribute will be set on the web component element with its `initValue` - *should be a string no matter the real type*.

If the attribute is `observed`, it will trigger a rerender flow.

Getter function will return the attribute value with its corresponding type - *part of the build flow*.

 - `name`: unique name for the component scope - *camelCased*.
 - `initValue (optional)`: initiated value on connected lifecycle hook - *string*.
 - `observed (optional)`: rerender on attribute updates - *default: false*
 - `type`: string | number | boolean | array | json - *array|json is using the JSON.parse method*.

## Methods
Scoped functions that would be called from different parts of the component.

Methods can call other methods by simply use the `this.` prefix, for example:
```javascript
...
methods: { // private methods to call from all over the wc flow - must be a function scope - optional
 logSomething: function(something) {
   console.log(something);
 },
 clicked: function() {
   this.logSomething('clicked!')
 }
},
...
```

## Event Listeners
Will trigger methods when target selector match with event type - *persistence also after re-rendering*

 - `target`: valid html selector.
 - `event`: any event name.
 - `methods`: array of methods names to call when triggered.

Another alternative is to use [Template Event Listener](https://github.com/drorseltzer/doubleuc#template-event-listener).

## Lifecycle Hooks
 - `connected` - invoked each time the component is injected into the dom.
 - `disconnected` - invoked each time the component is removed from the dom.
 - `adopted` - invoked each time the component is moved to a new dom
 - `attributeChanged` - invoked each time an observed component's attribute has changed.

Array of methods names to call, for example:

```javascript
...
hooks: {
   connected: ['initSomething']
}
...
```

## Templating

### HTML Template
Just like any other html file/inline - no restrictions.

In order to use dynamic attribute binding: `{{[ATTRIBUTE_OR_METHOD_NAME]}}` - *it's not supposed to be populated with much logic or conditioning*.

For Example:
```html
<p>Hello {{name}}}</p>
```

First render will occur on connected lifecycle hook.

Rerender (only the changed parts) will occur each time an observed attribute has changed.

### Conditional Rendering
```html
<div ~if="BooleanAttributeNameOrMethodCall">...</div>
```
 - `~if-` prefix for conditional rendering.

The mechanism here is simply commenting the node content.

**Note that the node including the ~if statement will remain as is and the commenting will only be applied on its content.**

### Template Attributes
```html
<a ~attr-href="attributeNameOrMethodCall">Click</a>
```
 - `~attr-` prefix for dynamic attributes.
 - `disbaled` represent attribute name.

**This is not allowed and will break the code:**
```html
<a href="{{attributeNameOrMethodCall}}">Click</a>
```

### Template Properties
```html
<button ~prop-disbaled="BooleanAttributeNameOrMethodCall">Click</button>
```
 - `~prop-` prefix for dynamic properties.
 - `disbaled` represent property name.

**This is not allowed and will break the code:**
```html
<button disbaled="{{BooleanAttributeNameOrMethodCall}}">Click</button>
```

### Template Event Listener
```html
<button id="button-click" ~ev-click="someMethodName">Click</button>
```
 - `id` most be present within the element.
 - `~ev-` represent event listener here - *can be used multiple times.*
 - `click` represent event name to listen - *can be any valid event name.*

u can also use the declarative way as demonstrated in the [Event Listeners](https://github.com/drorseltzer/doubleuc#event-listeners) section.

### Template Lists
```html
<ul ~if="!!items">
   <a ~list="item of items" ~attr-href="{item.link}">{item.title}</a>
</ul>
```
 - `~list-` represent list iterator.

*Notice that nested list item is wrapped with single `{}`.*

### Nesting Components
```html
<hello-world ~attr-name="name"></hello-world>
```
**Take into consideration that the parent attribute value will override the component internal attribute on change.**

### CSS Template
Just like any other css, scss, saas file/inline - no restrictions.

In order to use dynamic attribute binding: `{{~Style[ATTRIBUTE_NAME]}}`, the `~Style` prefix is required to only update the css part on attribute change - **u can skip the Style part if updating is not needed**.

For Example:
```scss
// style.scss

p {
  font-size: {{~StyleFontSize}};
}
```
Will build to:
```javascript
<style class="vars">:host { --style-font-size: ${this.StyleFontSize}; }</style>
<style class="style">p { font-size: var(--style-font-size) }</style>
```

First render will occur on connected lifecycle hook.

The CSS rendering is divided to two parts:
 - generated variables based on attributes.
 - static css that bundled with the replaced generated attributes variables.

Rerender (only the variables values part) will occur each time an observed attribute has changed.

## Typescript
DUC is written mostly in typescript, all types are exported.
in order to use in a typescript project:
```json
{
   "compilerOptions": {
      "target": "esnext",
      "module": "commonjs",
      "rootDir": "./components",
      "outDir": ".duc"
   },
   "exclude": [".duc"]
}
```
add a build command to `package.json`: `"build:duc": "tsc && npx doubleuc b .duc"`

```typescript
// ./components/button/button.ts

import { DeclarativeWebComponent, DeclarativeWebComponentInterface } from 'doubleuc';

interface Button extends DeclarativeWebComponentInterface {
   name: string;
   disabled: boolean;
   clickEvent: () => void;
   isDisabled: () => string;
}

export = {
   tagName: 'button-component',
   templateFile: './components/button/button.html',
   styleFile: './components/button/button.scss',
   attributes: [
      { name: 'label', type: 'string', initValue: 'Click', observed: true },
      { name: 'disabled', type: 'boolean', initValue: 'false', observed: true }
   ],
   slotted: false,
   methods: {
      clickEvent: function () {
         console.log('clicked!');
         const thisElement = this as unknown as HTMLElement;
         thisElement.dispatchEvent(new Event('clicked', { bubbles: true }));
      },
      isDisabled: function () {
         return this.disabled ? 'disabled' : '';
      }
   },
   listeners: [{ target: '.click', event: 'click', methods: ['clickEvent'] }],
   hooks: {},
   config: {}
} as DeclarativeWebComponent<Button>;
```

## Examples

### Counter Component:

```typescript
import { DeclarativeWebComponent, DeclarativeWebComponentInterface } from 'doubleuc';

interface Counter extends DeclarativeWebComponentInterface {
   counter: number;
   count: () => void;
   reset: () => void;
   counterResetDisabled: () => string;
}

export =  {
  tagName: 'counter-component',
  templateHtml: `
      <div class="counter">
        <p>Counter: {{counter}}</p>
        <button id="count" ~ev-click="count">Count!</button>
        <button id="rest" ~ev-click="reset" ~prop-disabled="counterResetDisabled()">Reset</button>
      </div>
  `,
   attributes: [{ name: 'counter', type: 'number', observed: true, initValue: '0' }],
   methods: {
      count: function() {
         this.counter++;
      },
      reset: function() {
         this.counter = 0;
      },
      counterResetDisabled: function() {
         return this.counter > 0 ? '' : 'disabled';
      }
   }
}as DeclarativeWebComponent<Counter>;
```

Will build into `counter-component.js` `~ 4.4 kb` - no dependencies, ready to use web component.