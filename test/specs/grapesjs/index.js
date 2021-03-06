const PluginManager = require('plugin_manager');

describe('GrapesJS', () => {
  describe('Main', () => {
    var obj;
    var fixtures;
    var fixture;
    var editorName;
    var htmlString;
    var config;
    var cssString;
    var documentEl;

    var storage;
    var storageId = 'testStorage';
    var storageMock = {
      store(data, clb) {
        storage = data;
        clb();
      },
      load(keys, clb) {
        return clb(storage);
      }
    };

    before(() => {
      editorName = 'editor-fixture';
    });

    beforeEach(() => {
      storage = {};
      htmlString = '<div class="test1"></div><div class="test2"></div>';
      cssString = '.test2{color:red}.test3{color:blue}';
      documentEl = '<style>' + cssString + '</style>' + htmlString;
      config = {
        container: '#' + editorName,
        storageManager: {
          autoload: 0,
          autosave: 0,
          type: 0
        }
      };
      obj = grapesjs;
      document.body.innerHTML = `<div id="fixtures"><div id="${editorName}"></div></div>`;
      fixtures = document.body.querySelector('#fixtures');
      fixture = document.body.querySelector(`#${editorName}`);
    });

    afterEach(() => {
      var plugins = obj.plugins.getAll();
      for (let id in plugins) {
        if (plugins.hasOwnProperty(id)) {
          delete plugins[id];
        }
      }
    });

    it('Main object should be loaded', () => {
      expect(obj).toExist();
    });

    it('Init new editor', () => {
      var editor = obj.init(config);
      expect(editor).toExist();
    });

    it('Init new editor with node for container', () => {
      var configAlt = {
        container: document.createElement('div'),
        storageManager: {
          autoload: 0,
          type: 'none'
        }
      };
      var editor = obj.init(configAlt);
      expect(editor).toExist();
    });

    it('New editor is empty', () => {
      var editor = obj.init(config);
      var html = editor.getHtml();
      //var css = editor.getCss();
      var protCss = editor.getConfig().protectedCss;
      expect(html ? html : '').toNotExist();
      //expect((css ? css : '')).toEqual(protCss);
      expect(editor.getComponents().length).toEqual(0);
      expect(editor.getStyle().length).toEqual(0);
    });

    it('Editor canvas baseCSS can be overwritten', () => {
      config.components = htmlString;
      config.baseCss = '#wrapper { background-color: #eee; }';
      config.protectedCss = '';

      var editor = obj.init(config);

      expect(window.frames[0].document.documentElement.outerHTML).toInclude(
        config.baseCss
      );
      expect(window.frames[0].document.documentElement.outerHTML)
        .toNotInclude(`body {
      margin: 0;`);
    });

    it('Editor canvas baseCSS defaults to sensible values if not defined', () => {
      config.components = htmlString;
      config.protectedCss = '';

      var editor = obj.init(config);

      expect(window.frames[0].document.documentElement.outerHTML)
        .toInclude(`body {
      margin: 0;`);
    });

    it('Init editor with html', () => {
      config.components = htmlString;
      var editor = obj.init(config);
      var comps = editor.DomComponents.getComponents();
      expect(comps.length).toEqual(2);
      expect(
        comps
          .at(0)
          .get('classes')
          .at(0)
          .get('name')
      ).toEqual('test1');
    });

    it('Init editor with css', () => {
      config.style = cssString;
      var editor = obj.init(config);
      var rules = editor.CssComposer.getAll();
      expect(rules.length).toEqual(2);
      expect(
        rules
          .at(0)
          .get('selectors')
          .at(0)
          .get('name')
      ).toEqual('test2');
    });

    it('Init editor from element', () => {
      config.fromElement = 1;
      config.storageManager = { type: 0 };
      fixture.innerHTML = documentEl;
      const editor = obj.init(config);
      const html = editor.getHtml();
      const css = editor.getCss();
      const protCss = editor.getConfig().protectedCss;
      expect(html).toEqual(htmlString);
      expect(editor.getComponents().length).toEqual(2);
      // .test3 is discarded in CSS
      expect(css).toEqual(`${protCss}.test2{color:red;}`);
      // but it's still there
      expect(editor.getStyle().length).toEqual(2);
    });

    it('Set components as HTML', () => {
      var editor = obj.init(config);
      editor.setComponents(htmlString);
      expect(editor.getComponents().length).toEqual(2);
    });

    it('Set components as array of objects', () => {
      var editor = obj.init(config);
      editor.setComponents([{}, {}, {}]);
      expect(editor.getComponents().length).toEqual(3);
    });

    it('Set style as CSS', () => {
      var editor = obj.init(config);
      editor.setStyle(cssString);
      editor.setStyle(cssString);
      var styles = editor.getStyle();
      expect(styles.length).toEqual(2);
      expect(
        styles
          .at(1)
          .get('selectors')
          .at(0)
          .get('name')
      ).toEqual('test3');
    });

    it('Set style as as array of objects', () => {
      var editor = obj.init(config);
      editor.setStyle([{ selectors: ['test4'] }, { selectors: ['test5'] }]);
      var styles = editor.getStyle();
      expect(styles.length).toEqual(2);
      expect(
        styles
          .at(1)
          .get('selectors')
          .at(0)
          .get('name')
      ).toEqual('test5');
    });

    it.skip('Adds new storage as plugin and store data there', done => {
      const pluginName = storageId + '-p2';
      obj.plugins.add(pluginName, e =>
        e.StorageManager.add(storageId, storageMock)
      );
      config.storageManager.type = storageId;
      config.plugins = [pluginName];
      const editor = obj.init(config);
      editor.setComponents(htmlString);
      editor.store(() => {
        editor.load(data => {
          expect(data.html).toEqual(htmlString);
          done();
        });
      });
    });

    it('Adds a new storage and fetch correctly data from it', done => {
      fixture.innerHTML = documentEl;
      const styleResult = { color: 'white', display: 'block' };
      const style = [
        {
          selectors: [{ name: 'sclass1' }],
          style: { color: 'green' }
        },
        {
          selectors: [{ name: 'test2' }],
          style: styleResult
        },
        {
          selectors: [{ name: 'test3' }],
          style: { color: 'black', display: 'block' }
        }
      ];
      storage = {
        css: '* { box-sizing: border-box; } body {margin: 0;}',
        styles: JSON.stringify(style)
      };

      const pluginName = storageId + '-p';
      obj.plugins.add(pluginName, e =>
        e.StorageManager.add(storageId, storageMock)
      );
      config.fromElement = 1;
      config.storageManager.type = storageId;
      config.plugins = [pluginName];
      config.storageManager.autoload = 1;
      const editor = obj.init(config);
      editor.on('load', () => {
        const cc = editor.CssComposer;
        expect(cc.getAll().length).toEqual(style.length);
        // expect(cc.setClassRule('test2').getStyle()).toEqual(styleResult);
        done();
      });
    });

    it('Execute plugins with custom options', () => {
      var pluginName = storageId + '-plugin-opts';
      obj.plugins.add(pluginName, (edt, opts) => {
        var opts = opts || {};
        edt.customValue = opts.cVal || '';
      });
      config.plugins = [pluginName];
      config.pluginsOpts = {};
      config.pluginsOpts[pluginName] = { cVal: 'TEST' };
      var editor = obj.init(config);
      expect(editor.customValue).toEqual('TEST');
    });

    it('Execute custom command', () => {
      var editor = obj.init(config);
      editor.testVal = '';
      editor.setComponents(htmlString);
      editor.Commands.add('test-command', {
        run(ed, caller, opts) {
          ed.testVal = ed.getHtml() + opts.val;
        }
      });
      editor.runCommand('test-command', { val: 5 });
      expect(editor.testVal).toEqual(htmlString + '5');
    });

    it('Stop custom command', () => {
      var editor = obj.init(config);
      editor.testVal = '';
      editor.setComponents(htmlString);
      editor.Commands.add('test-command', {
        stop(ed, caller, opts) {
          ed.testVal = ed.getHtml() + opts.val;
        }
      });
      editor.stopCommand('test-command', { val: 5 });
      expect(editor.testVal).toEqual(htmlString + '5');
    });

    it('Trigger custom command events', () => {
      const id = 'test-command';
      const editor = obj.init(config);
      const result = {};
      editor.on(`run:${id}`, () => (result.run = 1));
      editor.on(`run:${id}:before`, () => (result.runBefore = 1));
      editor.on(`stop:${id}`, () => (result.stop = 1));
      editor.on(`stop:${id}:before`, () => (result.stopBefore = 1));
      editor.on(`abort:${id}`, () => (result.abort = 1));
      editor.Commands.add(id, {
        run() {},
        stop() {}
      });
      editor.runCommand(id);
      editor.stopCommand(id);
      editor.on(`run:${id}:before`, opts => (opts.abort = 1));
      editor.runCommand(id);
      expect(result).toEqual({
        run: 1,
        runBefore: 1,
        stop: 1,
        stopBefore: 1,
        abort: 1
      });
    });

    it('Set default devices', () => {
      config.deviceManager = {};
      config.deviceManager.devices = [
        { name: '1', width: '2' },
        { name: '3', width: '4' }
      ];
      var editor = obj.init(config);
      expect(editor.DeviceManager.getAll().length).toEqual(2);
    });

    it('There is no active device', () => {
      var editor = obj.init(config);
      expect(editor.getDevice()).toNotExist();
    });

    it('Active another device', () => {
      var editor = obj.init(config);
      editor.setDevice('Tablet');
      expect(editor.getDevice()).toEqual('Tablet');
    });

    // Problems with iframe loading
    it('Init new editor with custom plugin overrides default commands', () => {
      var editor,
        pluginName = 'test-plugin-opts';

      obj.plugins.add(pluginName, (edt, opts) => {
        let cmdm = edt.Commands;
        // Overwrite export template
        cmdm.add('export-template', { test: 1 });
      });
      config.plugins = [pluginName];

      editor = obj.init(config);
      expect(editor.Commands.get('export-template').test).toEqual(1);
    });
  });
});
