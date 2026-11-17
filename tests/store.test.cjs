const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('overrides/bx-hen-site/store/index.html', 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
function environment(options = {}) {
  function node(tag) { return { tag, children: [], textContent: '', attributes: {}, value: '',
    appendChild(n) { this.children.push(n); }, removeChild(n) { this.children.splice(this.children.indexOf(n), 1); },
    get firstChild() { return this.children[0]; }, setAttribute(k, v) { this.attributes[k] = v; } }; }
  const nodes = {}, requests = [], timers = new Map();
  let timerId = 0;
  const setTimeout = (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id; };
  const clearTimeout = id => timers.delete(id);
  for (const id of ['items', 'search', 'filter', 'summary', 'status', 'refresh']) nodes[id] = node('div');
  nodes.filter.value = 'all';
  class XHR {
    constructor() { requests.push(this); }
    open(method, url) { this.url = url; } send() {} abort() { this.aborted = true; }
    respond(data, status = 200) { this.readyState = 4; this.status = status; this.responseText = JSON.stringify(data); this.onreadystatechange(); }
  }
  vm.runInNewContext(source, { document: { getElementById(id) { return nodes[id]; }, createElement: node },
    location: { search: options.search || '', hash: options.hash || '' }, XMLHttpRequest: XHR, setTimeout, clearTimeout });
  return {
    nodes, requests, refresh: () => nodes.refresh.onclick(),
    timers,
    oldTimer: () => [...timers.values()][0]?.callback,
    fireTimer: () => {
      const entry = [...timers.entries()][0];
      assert.ok(entry, 'missing fallback timer');
      assert.equal(entry[1].delay, 12000);
      timers.delete(entry[0]); entry[1].callback();
    },
  };
}
function item(extra = {}) { return { title: 'Example', description: 'Description', category: 'Tools', version: '1.0',
  license: 'MIT', status: 'planned', ...extra }; }
function catalog(items) { return { schema_version: 1, items }; }
test('empty catalog is valid and displays an empty state', () => {
  const env = environment(); env.requests[0].respond(catalog([]));
  assert.match(env.nodes.items.children[0].textContent, /Nenhum aplicativo/);
  assert.match(env.nodes.status.textContent, /0 itens exibidos/);
});
test('late previous response cannot overwrite current catalog', () => {
  const env = environment(); const old = env.requests[0]; env.refresh(); assert.equal(old.aborted, true);
  env.requests[1].respond(catalog([item({ title: 'Newest' })]));
  old.respond(catalog([item({ title: 'Stale' })])); old.onerror();
  assert.equal(env.nodes.items.children[0].children[0].textContent, 'Newest');
});
test('invalid response and network failure preserve last valid catalog', () => {
  const env = environment(); env.requests[0].respond(catalog([item()]));
  env.refresh(); env.requests[1].respond(catalog([null]));
  assert.equal(env.nodes.items.children[0].children[0].textContent, 'Example');
  assert.match(env.nodes.status.textContent, /último catálogo/);
  env.refresh(); env.requests[2].onerror(); assert.match(env.nodes.status.textContent, /Falha/);
  env.refresh(); env.requests[3].respond({}, 0); env.requests[3].ontimeout(); assert.match(env.nodes.status.textContent, /esgotado/);
  assert.equal(env.requests[3].timeout, 12000);
});
test('unsafe download URLs remain disabled and content is rendered as text', () => {
  const env = environment(); env.requests[0].respond(catalog([item({ title: '<img onerror=alert(1)>',
    status: 'available', download_url: 'javascript:alert(1)', sha256: 'a'.repeat(64) })]));
  const card = env.nodes.items.children[0];
  assert.equal(card.children[0].textContent, '<img onerror=alert(1)>');
  assert.equal(card.children.find(n => n.tag === 'a'), undefined);
  assert.equal(card.children.find(n => n.tag === 'button').disabled, true);
});
test('valid downloads and filters work after refresh', () => {
  const env = environment(); env.requests[0].respond(catalog([item({ status: 'available',
    download_url: 'https://example.com/app.pkg', sha256: 'a'.repeat(64) }), item({ title: 'Planned' })]));
  assert.equal(env.nodes.items.children[0].children.find(n => n.tag === 'a').href, 'https://example.com/app.pkg');
  env.nodes.filter.value = 'planned'; env.nodes.filter.onchange();
  assert.equal(env.nodes.items.children.length, 1);
  assert.equal(env.nodes.items.children[0].children[0].textContent, 'Planned');
  env.nodes.search.value = 'missing'; env.nodes.search.oninput();
  assert.match(env.nodes.items.children[0].textContent, /Nenhum aplicativo/);
});


test('first network failure tries the cached catalog once and ignores late network completion', () => {
  const env = environment(); const original = env.requests[0]; original.onerror();
  assert.equal(env.requests.length, 2);
  assert.equal(env.requests[1].url, './catalog.json');
  env.requests[1].respond(catalog([item({title:'Saved'})]));
  assert.match(env.nodes.status.textContent, /Catálogo salvo/);
  original.respond(catalog([item({title:'Late'})])); original.ontimeout();
  assert.equal(env.nodes.items.children[0].children[0].textContent, 'Saved');
  env.nodes.search.oninput(); assert.match(env.nodes.status.textContent, /Catálogo salvo/);
});

test('cached fallback cannot loop and refresh returns to a fresh network request', () => {
  const env = environment(); env.requests[0].ontimeout(); env.requests[1].onerror();
  assert.equal(env.requests.length, 2);
  assert.match(env.nodes.status.textContent, /Falha/);
  env.refresh(); assert.match(env.requests[2].url, /catalog.json\?v=/);
  env.requests[2].respond(catalog([item()]));
  assert.doesNotMatch(env.nodes.status.textContent, /Catálogo salvo/);
  assert.match(env.nodes.status.textContent, /1 item exibido/);
});

test('fragment catalog links preserve offline resource identity and older query links still work', () => {
  for (const options of [{hash:'#q=Hello%20world'},{search:'?q=Hello+world'}]) {
    const env = environment(options); assert.equal(env.nodes.search.value, 'Hello world');
  }
});


test('legacy WebKit fallback timeout aborts a stalled catalog request', () => {
  const env = environment();
  assert.equal(env.timers.size, 1);
  env.fireTimer();
  assert.equal(env.requests[0].aborted, true);
  assert.equal(env.requests.length, 2, 'the cached catalog is attempted once');
  assert.equal(env.requests[1].url, './catalog.json');
  assert.equal(env.timers.size, 1);
  env.fireTimer();
  assert.equal(env.requests.length, 2, 'cached fallback must not loop');
  assert.equal(env.requests[1].aborted, true);
  assert.equal(env.timers.size, 0);
  assert.match(env.nodes.status.textContent, /esgotado/);
});

test('late responses and callbacks cannot replace a newer successful catalog', () => {
  const env = environment();
  const old = env.requests[0], lateCallback = env.oldTimer();
  env.refresh();
  assert.equal(env.timers.size, 1);
  env.requests[1].respond(catalog([item({title:'Current'})]));
  assert.equal(env.timers.size, 0);
  lateCallback();
  old.respond(catalog([item({title:'Old'})]));
  assert.equal(env.nodes.items.children[0].children[0].textContent, 'Current');
});

test('timer is cleared on success and errors preserve previous rows', () => {
  const env = environment();
  env.requests[0].respond(catalog([item({title:'Saved'})]));
  assert.equal(env.timers.size, 0);
  env.refresh();
  env.fireTimer();
  assert.equal(env.nodes.items.children[0].children[0].textContent, 'Saved');
  assert.match(env.nodes.status.textContent, /último catálogo/);
  assert.equal(env.timers.size, 0);
  env.refresh();
  env.requests[2].onerror();
  assert.equal(env.timers.size, 0);
  assert.equal(env.nodes.items.children[0].children[0].textContent, 'Saved');
});

test('an excessively large catalog response cannot replace the last valid list', () => {
  const env = environment();
  env.requests[0].respond(catalog([item({title:'Valid'})]));
  env.refresh();
  env.requests[1].respond({schema_version:1,items:[item({description:'x'.repeat(262200)})]});
  assert.equal(env.timers.size, 0);
  assert.equal(env.nodes.items.children[0].children[0].textContent, 'Valid');
  assert.match(env.nodes.status.textContent, /interpretado/);
});


test('invalid fresh catalog retries a previously cached copy once', () => {
  const env = environment();
  const original = env.requests[0];
  original.respond({schema_version:1,items:[null]});
  assert.equal(env.requests.length, 2);
  assert.equal(env.requests[1].url, './catalog.json');
  env.requests[1].respond(catalog([item({title:'Previously cached'})]));
  assert.equal(env.requests.length, 2);
  assert.equal(env.timers.size, 0);
  assert.equal(env.nodes.items.children[0].children[0].textContent, 'Previously cached');
  assert.match(env.nodes.status.textContent, /Catálogo salvo/);
  original.onerror();
  assert.equal(env.nodes.items.children[0].children[0].textContent, 'Previously cached');
});

test('invalid live and cached catalogs terminate without repeating requests', () => {
  const env = environment();
  const invalid = {schema_version:1,items:[null]};
  env.requests[0].respond(invalid);
  assert.equal(env.requests.length, 2);
  env.requests[1].respond(invalid);
  assert.equal(env.requests.length, 2);
  assert.equal(env.timers.size, 0);
  assert.match(env.nodes.status.textContent, /interpretado/);
});
