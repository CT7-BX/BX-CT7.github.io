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
  const nodes = {}, requests = [];
  for (const id of ['items', 'search', 'filter', 'summary', 'status', 'refresh']) nodes[id] = node('div');
  nodes.filter.value = 'all';
  class XHR {
    constructor() { requests.push(this); }
    open(method, url) { this.url = url; } send() {} abort() { this.aborted = true; }
    respond(data, status = 200) { this.readyState = 4; this.status = status; this.responseText = JSON.stringify(data); this.onreadystatechange(); }
  }
  vm.runInNewContext(source, { document: { getElementById(id) { return nodes[id]; }, createElement: node },
    location: { search: options.search || '', hash: options.hash || '' }, XMLHttpRequest: XHR });
  return { nodes, requests, refresh: () => nodes.refresh.onclick() };
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
