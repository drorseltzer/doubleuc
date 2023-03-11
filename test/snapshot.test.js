describe('snapshot', () => {
  const { DoubleUCGenerator } = require('../dist/index');

  it('basic hello world sanity', async () => {
    const declaration = {
      tagName: 'test-comp',
      templateHtml: '<p>Hello {{name}}</p>',
      style: 'p {font-weight: bold}',
      attributes: [{ name: 'name', type: 'string', initValue: 'world', observed: true }],
      methods: {},
      config: {
        minify: {
          enabled: false
        }
      }
    };
    const duc = new DoubleUCGenerator(declaration);
    let testComponentString = await duc.generateWebComponent(1);
    expect(testComponentString).toMatchSnapshot();
  });

  it('two attributes - observed and unobserved', async () => {
    const declaration = {
      tagName: 'test-comp',
      templateHtml: '<p>Hello {{name}}</p><p>Hello {{name2}}</p>',
      style: 'p {font-weight: bold}',
      attributes: [
        { name: 'name', type: 'string', initValue: 'world', observed: true },
        {
          name: 'name2',
          type: 'string',
          initValue: 'world',
          observed: false
        }
      ],
      methods: {},
      config: {
        minify: {
          enabled: false
        }
      }
    };
    const duc = new DoubleUCGenerator(declaration);
    let testComponentString = await duc.generateWebComponent(1);
    expect(testComponentString).toMatchSnapshot();
  });

  it('methods', async () => {
    const declaration = {
      tagName: 'test-comp',
      templateHtml: '<p>Hello {{testMethod()}}</p>',
      attributes: [],
      methods: {
        testMethod: function () {
          return 'test';
        }
      },
      config: {
        minify: {
          enabled: false
        }
      }
    };
    const duc = new DoubleUCGenerator(declaration);
    let testComponentString = await duc.generateWebComponent(1);
    expect(testComponentString).toMatchSnapshot();
  });

  it('event listeners', async () => {
    const declaration = {
      tagName: 'test-comp',
      templateHtml: '<button id="clickBtn" ~ev-click="clickMethod">click</button>',
      attributes: [],
      methods: {
        clickMethod: function () {
          console.log('clicked');
        }
      },
      config: {
        minify: {
          enabled: false
        }
      }
    };
    const duc = new DoubleUCGenerator(declaration);
    let testComponentString = await duc.generateWebComponent(1);
    expect(testComponentString).toMatchSnapshot();
  });

  it('lifeCycle hooks', async () => {
    const declaration = {
      tagName: 'test-comp',
      attributes: [],
      methods: {
        hookSomething: function () {
          console.log('hooked');
        }
      },
      hooks: {
        connected: ['hookSomething'],
        disconnected: ['hookSomething'],
        adopted: ['hookSomething'],
        attributeChanged: ['hookSomething'],
        beforeFirstRendered: ['hookSomething'],
        firstRendered: ['hookSomething'],
        beforeRendered: ['hookSomething'],
        rendered: ['hookSomething']
      },
      config: {
        minify: {
          enabled: false
        }
      }
    };
    const duc = new DoubleUCGenerator(declaration);
    let testComponentString = await duc.generateWebComponent(1);
    expect(testComponentString).toMatchSnapshot();
  });

  it('conditional if', async () => {
    const declaration = {
      tagName: 'test-comp',
      templateHtml: '<span ~if="name"><p>Hello {{name}}</p></span>',
      style: 'p {font-weight: bold}',
      attributes: [{ name: 'name', type: 'string', initValue: 'world', observed: true }],
      methods: {},
      config: {
        minify: {
          enabled: false
        }
      }
    };
    const duc = new DoubleUCGenerator(declaration);
    let testComponentString = await duc.generateWebComponent(1);
    expect(testComponentString).toMatchSnapshot();
  });

  it('conditional if else', async () => {
    const declaration = {
      tagName: 'test-comp',
      templateHtml: '<span ~if="name"><p>Hello {{name}}</p></span><span ~else><p>Hello Anonymous</p></span>',
      style: 'p {font-weight: bold}',
      attributes: [{ name: 'name', type: 'string', observed: true }],
      methods: {},
      config: {
        minify: {
          enabled: false
        }
      }
    };
    const duc = new DoubleUCGenerator(declaration);
    let testComponentString = await duc.generateWebComponent(1);
    expect(testComponentString).toMatchSnapshot();
  });

  it('Template Attributes', async () => {
    const declaration = {
      tagName: 'test-comp',
      templateHtml: '<a ~attr-href="link">{{text}}</a>',
      attributes: [
        { name: 'text', type: 'string', initValue: 'Google', observed: true },
        { name: 'link', type: 'string', initValue: 'https://google.com', observed: true }
      ],
      methods: {},
      config: {
        minify: {
          enabled: false
        }
      }
    };
    const duc = new DoubleUCGenerator(declaration);
    let testComponentString = await duc.generateWebComponent(1);
    expect(testComponentString).toMatchSnapshot();
  });

  it('Template Properties', async () => {
    const declaration = {
      tagName: 'test-comp',
      templateHtml: '<button ~prop-disabled="disabled">{{text}}</button>',
      attributes: [
        { name: 'text', type: 'string', initValue: 'Google', observed: true },
        { name: 'disabled', type: 'boolean', initValue: 'true', observed: true }
      ],
      methods: {},
      config: {
        minify: {
          enabled: false
        }
      }
    };
    const duc = new DoubleUCGenerator(declaration);
    let testComponentString = await duc.generateWebComponent(1);
    expect(testComponentString).toMatchSnapshot();
  });

  it('Template Lists', async () => {
    const declaration = {
      tagName: 'test-comp',
      templateHtml: '<li ~list="item of items" ~attr-data="{item}">{item}</li>',
      attributes: [{ name: 'items', type: 'array', initValue: '[1,2,3,4]', observed: true }],
      methods: {},
      config: {
        minify: {
          enabled: false
        }
      }
    };
    const duc = new DoubleUCGenerator(declaration);
    let testComponentString = await duc.generateWebComponent(1);
    expect(testComponentString).toMatchSnapshot();
  });
});
