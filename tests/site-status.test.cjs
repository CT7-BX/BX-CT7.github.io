const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('overrides/site-status.js', 'utf8');
const revision = 'a'.repeat(40);
function environment(options = {}) {
  const nodes = {}, requests = [], events = {}, intervals = [];
  for (const id of ['bx-site-status', 'bx-site-check', 'bx-site-message', 'bx-site-network', 'bx-site-revision'])
    nodes[id] = { textContent: '', style: {}, attributes: {}, getAttribute() { return options.revision || revision; },
      setAttribute(k, v) { this.attributes[k] = v; } };
  let cacheClicks = 0, reloads = 0;
  if (!options.missingCache) nodes.updateCache = { click() { cacheClicks++; if(options.cacheThrows) throw Error('blocked'); } };
  const navigator = { onLine: options.offline ? false : true };
  class XHR {
    constructor() { requests.push(this); }
    open(method, url) { this.url = url; if (options.openFails) throw Error('blocked'); }
    send() {}
    abort() { this.aborted = true; }
    respond(data, status = 200) { this.readyState = 4; this.status = status; this.responseText = JSON.stringify(data); this.onreadystatechange(); }
  }
  const document = { readyState: 'complete', hidden: !!options.hidden, getElementById(id) { return nodes[id]; } };
  vm.runInNewContext(source, { document,
    navigator, window: { applicationCache: options.ps4 ? {} : undefined,
      location: { reload() { reloads++; if(options.reloadThrows) throw Error('blocked'); } }, addEventListener(name, fn) { events[name] = fn; },
      setInterval(fn, delay) { intervals.push({ fn, delay, cleared: false }); return intervals.length; },
      clearInterval(id) { intervals[id - 1].cleared = true; } },
    isPS4Console() { return !!options.ps4; }, XMLHttpRequest: XHR });
  return { nodes, requests, events, navigator, document, intervals,
    tick: () => intervals.filter(t => !t.cleared).forEach(t => t.fn()),
    update: () => nodes['bx-site-check'].onclick(),
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

test('checks immediately and on each 10-second tick without resetting visible status', () => {
  const env = environment();
  assert.equal(env.requests.length, 1);
  assert.equal(env.intervals.length, 1);
  assert.equal(env.intervals[0].delay, 10000);
  current(env); const message = env.message();
  env.tick(); assert.equal(env.requests.length, 2);
  assert.equal(env.title(), 'Versão mais recente');
  assert.equal(env.message(), message);
  current(env); env.tick(); assert.equal(env.requests.length, 3);
  newer(env); assert.equal(env.title(), 'Nova atualização disponível');
  assert.equal(env.nodes['bx-site-check'].hidden, false);
  env.tick(); assert.equal(env.title(), 'Nova atualização disponível');
  assert.equal(env.nodes['bx-site-check'].hidden, false);
  assert.equal(env.reloads, 0); assert.equal(env.cacheClicks, 0);
});

test('hidden documents keep the same timer with no visibility listener', () => {
  const env = environment({ hidden: true }); current(env);
  assert.equal(env.events.visibilitychange, undefined);
  env.tick(); current(env); env.tick();
  assert.equal(env.requests.length, 3);
  assert.equal(env.intervals[0].cleared, false);
});

test('poll cancels an unfinished request and ignores its late response', () => {
  const env = environment(); const old = env.requests[0];
  assert.equal(old.timeout, 8000);
  env.tick(); assert.equal(old.aborted, true);
  newer(env); old.respond({ schema_version: 1, revision }); old.onerror();
  assert.equal(env.title(), 'Nova atualização disponível');
});

test('navigation stops timer and requests; history return resumes exactly once', () => {
  const env = environment(); const old = env.requests[0];
  env.events.pagehide(); assert.equal(old.aborted, true);
  assert.equal(env.intervals[0].cleared, true);
  env.tick(); assert.equal(env.requests.length, 1);
  old.respond({ schema_version: 1, revision });
  env.events.pageshow(); assert.equal(env.requests.length, 2);
  env.events.pageshow(); assert.equal(env.requests.length, 2);
  assert.equal(env.intervals.filter(t => !t.cleared).length, 1);
});

test('starting update stops polling even if the browser has not navigated yet', () => {
  const env = environment({ ps4: true }); newer(env);
  env.tick(); const pending = env.requests[1];
  env.update(); assert.equal(pending.aborted, true);
  assert.equal(env.intervals[0].cleared, true);
  pending.respond({ schema_version: 1, revision });
  env.tick(); env.events.pageshow(); env.events.online();
  assert.equal(env.requests.length, 2);
  assert.equal(env.title(), 'Atualizando o site...');
  assert.equal(env.cacheClicks, 1);
});

test('unchanged results do not rewrite live-region text every 10 seconds', () => {
  const env = environment(); current(env);
  const node = env.nodes['bx-site-message'];
  let value = node.textContent, writes = 0;
  Object.defineProperty(node, 'textContent', { get() { return value; }, set(next) { value = next; writes++; } });
  env.tick(); current(env); env.tick(); current(env);
  assert.equal(writes, 0);
});


test('failed update navigation restores polling and offers a manual retry', () => {
  for(const options of [{ps4:true,cacheThrows:true},{reloadThrows:true}]) {
    const env=environment(options);newer(env);env.update();
    assert.equal(env.title(),'Não foi possível iniciar a atualização');
    assert.equal(env.nodes['bx-site-check'].hidden,false);
    assert.equal(env.intervals.filter(t=>!t.cleared).length,1);
    env.tick();assert.equal(env.requests.length,2);newer(env);
    assert.equal(env.title(),'Nova atualização disponível');
  }
});

test('browser history restore after an update resumes the 10-second checks once', () => {
  const env=environment({ps4:true});newer(env);env.update();env.events.pagehide();
  assert.equal(env.intervals.filter(t=>!t.cleared).length,0);
  env.events.pageshow({persisted:true});
  assert.equal(env.requests.length,2);
  assert.equal(env.intervals.filter(t=>!t.cleared).length,1);
  newer(env);assert.equal(env.title(),'Nova atualização disponível');
  env.events.pageshow({persisted:true});
  assert.equal(env.requests.length,2);
});

test('confirmed update remains available through a transient polling failure',()=>{
 const e=environment();newer(e);e.tick();e.requests[1].onerror();
 assert.equal(e.title(),'Nova atualização disponível');assert.equal(e.nodes['bx-site-check'].hidden,false);assert.match(e.message(),/nova consulta falhou/);
 e.navigator.onLine=false;e.events.offline();assert.equal(e.nodes['bx-site-check'].hidden,true);
 e.navigator.onLine=true;e.events.online();e.requests[2].onerror();assert.equal(e.nodes['bx-site-check'].hidden,false);
 e.tick();current(e);assert.equal(e.title(),'Versão mais recente');e.tick();e.requests[4].onerror();assert.equal(e.title(),'Não foi possível verificar');
});
