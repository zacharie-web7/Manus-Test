const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const APP_ROOT = path.join(PROJECT_ROOT, 'yooza-avis');

class FakeClassList {
  constructor(initial = '') {
    this.values = new Set(String(initial).split(/\s+/).filter(Boolean));
  }

  add(...names) {
    names.forEach(name => this.values.add(name));
  }

  remove(...names) {
    names.forEach(name => this.values.delete(name));
  }

  contains(name) {
    return this.values.has(name);
  }

  toggle(name, force) {
    if (force === true) {
      this.values.add(name);
      return true;
    }
    if (force === false) {
      this.values.delete(name);
      return false;
    }
    if (this.values.has(name)) {
      this.values.delete(name);
      return false;
    }
    this.values.add(name);
    return true;
  }

  toString() {
    return [...this.values].join(' ');
  }
}

class FakeElement {
  constructor(tagName = 'div', id = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.dataset = {};
    this.style = {};
    this.children = [];
    this.events = new Map();
    this.classList = new FakeClassList();
    this.parentNode = null;
    this.clicked = false;
    this.download = '';
    this.href = '';
  }

  appendChild(child) {
    this.children.push(child);
    child.parentNode = this;
    return child;
  }

  addEventListener(type, handler) {
    this.events.set(type, handler);
  }

  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter(child => child !== this);
    this.parentNode = null;
  }

  click() {
    this.clicked = true;
    const handler = this.events.get('click');
    if (handler) handler({ target: this });
  }

  querySelector(selector) {
    if (selector === 'input' && this.input) return this.input;
    return null;
  }
}

class FakeDocument {
  constructor() {
    this.elements = new Map();
    this.body = new FakeElement('body', 'body');
    this.createdElements = [];
    this.selectedChannel = 'email';
    this.navItems = ['/dashboard', '/clients', '/settings'].map(route => {
      const item = new FakeElement('button');
      item.dataset.route = route;
      return item;
    });
    this.channelOptions = ['email', 'sms', 'whatsapp'].map(value => {
      const option = new FakeElement('div');
      option.input = { value };
      return option;
    });
    this.starButtons = [1, 2, 3, 4, 5].map(note => {
      const button = new FakeElement('button');
      button.dataset.note = String(note);
      return button;
    });
  }

  getElementById(id) {
    if (!this.elements.has(id)) {
      this.elements.set(id, new FakeElement('div', id));
    }
    return this.elements.get(id);
  }

  querySelectorAll(selector) {
    if (selector === '.nav-item') return this.navItems;
    if (selector === '.canal-option') return this.channelOptions;
    if (selector === '.star-btn') return this.starButtons;
    return [];
  }

  querySelector(selector) {
    if (selector === '.canal-option.selected input') {
      return { value: this.selectedChannel };
    }
    return null;
  }

  createElement(tagName) {
    const element = new FakeElement(tagName);
    this.createdElements.push(element);
    return element;
  }

  createTextNode(value) {
    return {
      nodeType: 3,
      textContent: String(value),
      parentNode: null,
    };
  }
}

class FakeLocalStorage {
  constructor(initial = {}) {
    this.values = new Map(
      Object.entries(initial).map(([key, value]) => [key, String(value)])
    );
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }

  clear() {
    this.values.clear();
  }

  snapshot() {
    return Object.fromEntries(this.values.entries());
  }
}

function createHarness(options = {}) {
  const document = new FakeDocument();
  const localStorage = options.localStorage instanceof FakeLocalStorage
    ? options.localStorage
    : new FakeLocalStorage(options.storage);
  const listeners = new Map();
  const warnings = [];
  const location = {
    hash: options.hash || '',
    hostname: 'localhost',
  };

  const window = {
    location,
    isSecureContext: true,
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    scrollTo() {},
  };

  class HarnessURL extends URL {}
  HarnessURL.created = [];
  HarnessURL.revoked = [];
  HarnessURL.createObjectURL = blob => {
    const value = `blob:test-${HarnessURL.created.length + 1}`;
    HarnessURL.created.push({ value, blob });
    return value;
  };
  HarnessURL.revokeObjectURL = value => {
    HarnessURL.revoked.push(value);
  };

  const context = vm.createContext({
    Blob,
    URL: HarnessURL,
    console: {
      log() {},
      warn(...args) {
        warnings.push(args.map(String).join(' '));
      },
      error() {},
    },
    document,
    localStorage,
    location,
    navigator: {
      serviceWorker: {
        register() {
          return Promise.resolve({});
        },
      },
    },
    window,
    confirm: () => true,
    setTimeout(handler) {
      if (typeof handler === 'function') handler();
      return 1;
    },
    clearTimeout() {},
  });

  const scriptFiles = [
    'js/data.js',
    'js/app.js',
    'js/dashboard.js',
    'js/clients.js',
    'js/client-detail.js',
    'js/settings.js',
  ];

  for (const relativePath of scriptFiles) {
    const source = fs.readFileSync(path.join(APP_ROOT, relativePath), 'utf8');
    vm.runInContext(source, context, { filename: relativePath });
  }

  return {
    context,
    document,
    localStorage,
    listeners,
    warnings,
    url: HarnessURL,
    evaluate(source) {
      return vm.runInContext(source, context);
    },
    element(id) {
      return document.getElementById(id);
    },
  };
}

module.exports = {
  APP_ROOT,
  FakeLocalStorage,
  createHarness,
};
