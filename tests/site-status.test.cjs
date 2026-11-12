const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('overrides/site-status.js', 'utf8');
const revision = 'a'.repeat(40);
function environment(options = {}) {
  const nodes = {}, requests = [], events = {};
  for (const id of ['bx-site-status', 'bx-site-check', 'bx-site-message', 'bx-site-network', 'bx-site-revision'])
    nodes[id] = { textContent: '', style: {}, attributes: {}, getAttribute() { return options.revision || revision; },
      setAttribute(k, v) { this.attributes[k] = v; } };
  let cacheClicks = 0, reloads = 0;
  if (!options.missingCache) nodes.updateCache = { click() { cacheClicks++; } };
  const navigator = { onLine: options.offline ? false : true };
  class XHR {
    constructor() { requests.push(this); }
    open(method, url) { this.url = url; if (options.openFails) throw Error('blocked'); }
    send() {}
    abort() { this.aborted = true; }
    respond(data, status = 200) { this.readyState = 4; this.status = status; this.responseText = JSON.stringify(data); this.onreadystatechange(); }
  }
  vm.runInNewContext(source, { document: { readyState: 'complete', getElementById(id) { return nodes[id]; } },
    navigator, window: { applicationCache: options.ps4 ? {} : undefined,
      location: { reload() { reloads++; } }, addEventListener(name, fn) { events[name] = fn; } },
    isPS4Console() { return !!options.ps4; }, XMLHttpRequest: XHR });
  return { nodes, requests, events, navigator, update: () => nodes['bx-site-check'].onclick(),
    message: () => nodes['bx-site-message'].textContent, title: () => nodes['bx-site-revision'].textContent,
    get cacheClicks() { return cacheClicks; }, get reloads() { return reloads; } };
}
function current(env) { env.requests[env.requests.length - 1].respond({ schema_version: 1, revision }); }
function newer(env) { env.requests[env.requests.length - 1].respond({ schema_version: 1, revision: 'a'.repeat(39) + 'b' }); }
test('opening the site checks once automatically and displays latest without technical hashes', () => {
  const env = environment(); assert.equal(env.requests.length, 1);
  assert.equal(env.nodes['bx-site-check'].hidden, true);
  current(env);
  assert.equal(env.title(), 'Versão mais recente');
  assert.match(env.message(), /versão mais recente do site/);
  assert.doesNotMatch(env.title() + env.message(), /aaaaaaa/);
  env.update(); assert.equal(env.reloads, 0); assert.equal(env.cacheClicks, 0);
});
test('new release shows only Atualizar agora and never updates without a click', () => {
  const env = environment(); newer(env);
  assert.equal(env.title(), 'Nova atualização disponível');
  assert.match(env.message(), /nova versão.*liberada/);
  assert.equal(env.nodes['bx-site-check'].textContent, 'Atualizar agora');
  assert.equal(env.nodes['bx-site-check'].hidden, false);
  assert.equal(env.reloads, 0); assert.equal(env.cacheClicks, 0);
});
test('PS4 update delegates to original cache flow once', () => {
  const env = environment({ ps4: true }); newer(env); env.update(); env.update();
  assert.equal(env.cacheClicks, 1); assert.equal(env.reloads, 0);
  assert.equal(env.title(), 'Atualizando o site...');
});
test('other browsers reload only after clicking update', () => {
  const env = environment(); newer(env); env.update(); env.update();
  assert.equal(env.reloads, 1); assert.equal(env.cacheClicks, 0);
});
test('offline never claims latest and reconnecting checks automatically', () => {
  const env = environment({ offline: true }); assert.equal(env.requests.length, 0);
  assert.equal(env.title(), 'Não foi possível verificar');
  assert.equal(env.nodes['bx-site-check'].hidden, true);
  env.navigator.onLine = true; env.events.online(); assert.equal(env.requests.length, 1);
  current(env); assert.equal(env.title(), 'Versão mais recente');
});
test('disconnect cancels pending check and ignores stale completion and failures', () => {
  const env = environment(); const old = env.requests[0];
  env.navigator.onLine = false; env.events.offline(); assert.equal(old.aborted, true);
  old.respond({ schema_version: 1, revision }); old.onerror();
  assert.equal(env.title(), 'Não foi possível verificar');
  env.navigator.onLine = true; env.events.online(); current(env);
  const message = env.message(); old.ontimeout(); env.requests[1].ontimeout();
  assert.equal(env.message(), message);
});
test('invalid schema, HTTP, network, timeout and unsupported XHR cannot report latest', () => {
  for (const fail of [
    request => request.respond({ schema_version: 1, revision: '<script>' }),
    request => request.respond({}, 503),
    request => request.onerror(),
    request => { request.respond({}, 0); request.ontimeout(); }
  ]) {
    const env = environment(); fail(env.requests[0]);
    assert.equal(env.title(), 'Não foi possível verificar');
    assert.equal(env.nodes['bx-site-check'].hidden, true);
  }
  assert.equal(environment({ openFails: true }).title(), 'Não foi possível verificar');
});
test('connection loss before click prevents update and missing PS4 cache target reports failure', () => {
  const offline = environment({ ps4: true }); newer(offline);
  offline.navigator.onLine = false; offline.update(); assert.equal(offline.cacheClicks, 0);
  const missing = environment({ ps4: true, missingCache: true }); newer(missing); missing.update();
  assert.equal(missing.title(), 'Não foi possível atualizar');
  assert.equal(missing.reloads, 0);
});
