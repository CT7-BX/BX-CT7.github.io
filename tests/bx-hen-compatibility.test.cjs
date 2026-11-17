// Browser-only compatibility diagnostics; never executes PS4 payloads.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('overrides/bx-hen-site/compatibility.js', 'utf8');

function testPage(storage) {
  function element(tag) {
    return {tagName: tag, children: [], textContent: '', attributes: {}, style: {},
      appendChild(x) { x.parentNode = this; this.children.push(x); return x; },
      removeChild(x) { this.children.splice(this.children.indexOf(x), 1); x.parentNode = null; },
      get firstChild() { return this.children[0] || null; },
      setAttribute(k,v) { this.attributes[k] = v; },
      focus() {}, select() {},
    };
  }
  const main = element('main');
  const sidebar = element('nav');
  function find(id, root) {return root.id === id ? root : root.children.map(x => find(id,x)).find(Boolean);}
  const document = { readyState:'complete', documentElement:{clientWidth:1024,clientHeight:768},
    createElement: element, getElementById(id) {return find(id,main)||find(id,sidebar);},
    querySelector(selector) {return selector==='main.main'?main:selector==='.sidebar'?sidebar:null;},
  };
  const window = {localStorage:storage,sessionStorage:storage,screen:{width:1920,height:1080},devicePixelRatio:1};
  const navigator = {userAgent:'Browser test',language:'pt-BR',onLine:true};
  vm.runInNewContext(source, {document,window,navigator,location:{protocol:'https:'},screen:window.screen,Date,Math,JSON}, {filename:'compatibility.js',timeout:1000});
  const section = find('bx-compat',main);
  section.children[1].children[1].children[0].onclick();
  return find('bx-compat-results',main).children;
}

function values(rows) {
  return Object.fromEntries(rows.map(row => [row.children[0].textContent, row.children[1].textContent]));
}

test('compatibility probes do not overwrite the legacy storage key or leave temporary keys', () => {
  const entries = new Map([['bx-hen-compatibility-probe','valor preservado'],['user-setting','persistente']]);
  const storage = {
    setItem(k,v) {entries.set(k,v);},
    getItem(k) {return entries.has(k)?entries.get(k):null;},
    removeItem(k) {entries.delete(k);},
  };
  const results = values(testPage(storage));
  assert.equal(results.localStorage,'operacional');
  assert.equal(results.sessionStorage,'operacional');
  assert.equal(entries.get('bx-hen-compatibility-probe'),'valor preservado');
  assert.equal(entries.get('user-setting'),'persistente');
  assert.equal(entries.size,2);
});

test('blocked storage is reported without interrupting other diagnostics', () => {
  const storage = {setItem() {throw new Error('blocked');},removeItem() {},getItem() {return null;}};
  const results = values(testPage(storage));
  assert.equal(results.localStorage,'bloqueado');
  assert.equal(results.sessionStorage,'bloqueado');
  assert.equal(results.HTTPS,'sim');
});


test('colliding compatibility probe never overwrites or removes existing data', () => {
  let writes = 0, deletes = 0;
  const storage = {
    getItem(k) {return k.startsWith('bx-hen-compatibility-probe-') ? 'existing' : null;},
    setItem() {writes++;},
    removeItem() {deletes++;},
  };
  const result = values(testPage(storage));
  assert.equal(result.localStorage, 'bloqueado');
  assert.equal(result.sessionStorage, 'bloqueado');
  assert.equal(writes, 0);
  assert.equal(deletes, 0);
});
