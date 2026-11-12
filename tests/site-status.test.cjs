const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('overrides/site-status.js', 'utf8');
const revision = 'a'.repeat(40);
function environment(options = {}) {
  const nodes = {};
  for (const id of ['bx-site-status', 'bx-site-check', 'bx-site-message', 'bx-site-network'])
    nodes[id] = { textContent: '', getAttribute() { return revision; } };
  const requests = [], events = {}, navigator = { onLine: true };
  class XHR {
    constructor() { requests.push(this); }
    open(method, url) { this.url = url; if (options.openFails) throw Error('blocked'); }
    send() {}
    abort() { this.aborted = true; }
    respond(data, status = 200) { this.readyState = 4; this.status = status; this.responseText = JSON.stringify(data); this.onreadystatechange(); }
  }
  vm.runInNewContext(source, { document: { readyState: 'complete', getElementById(id) { return nodes[id]; } },
    navigator, window: { addEventListener(name, fn) { events[name] = fn; } }, XMLHttpRequest: XHR });
  return { nodes, requests, events, navigator, check: () => nodes['bx-site-check'].onclick(), message: () => nodes['bx-site-message'].textContent };
}
test('release status stays local until explicit check and updates network indicator', () => {
  const env = environment(); assert.equal(env.requests.length, 0);
  env.navigator.onLine = false; env.events.offline();
  assert.match(env.nodes['bx-site-network'].textContent, /offline/);
});
test('compares full revision and never automatically navigates or updates cache', () => {
  const env = environment(); env.check();
  env.requests[0].respond({ schema_version: 1, revision });
  assert.match(env.message(), /corresponde/);
  env.check(); env.requests[1].respond({ schema_version: 1, revision: 'a'.repeat(39) + 'b' });
  assert.match(env.message(), /Há uma publicação diferente/);
  assert.equal(env.requests[1].timeout, 10000);
});
test('refresh aborts pending check and ignores stale completion and errors', () => {
  const env = environment(); env.check(); const old = env.requests[0]; env.check();
  assert.equal(old.aborted, true);
  env.requests[1].respond({ schema_version: 1, revision }); const message = env.message();
  old.respond({ schema_version: 1, revision: 'b'.repeat(40) }); old.onerror(); old.ontimeout();
  env.requests[1].ontimeout(); assert.equal(env.message(), message);
});
test('handles invalid JSON schema, HTTP, network, timeout and unsupported XHR', () => {
  const env = environment(); env.check(); env.requests[0].respond({ schema_version: 1, revision: '<script>' });
  assert.match(env.message(), /inválida/);
  env.check(); env.requests[1].respond({}, 503); assert.match(env.message(), /HTTP 503/);
  env.check(); env.requests[2].onerror(); assert.match(env.message(), /Sem resposta/);
  env.check(); env.requests[3].respond({}, 0); env.requests[3].ontimeout(); assert.match(env.message(), /demorou/);
  const blocked = environment({ openFails: true }); blocked.check();
  assert.match(blocked.message(), /não está disponível/);
});
