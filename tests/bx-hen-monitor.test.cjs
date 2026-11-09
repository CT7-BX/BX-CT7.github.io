// Browser-only monitor regression tests, run with Node (no PS4 or jailbreak validation).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('overrides/bx-hen-site/test-monitor.js', 'utf8');

function environment() {
  function element(tag) {
    return {
      tagName: tag, children: [], attributes: {}, className: '', textContent: '',
      appendChild(child) { child.parentNode = this; this.children.push(child); return child; },
      removeChild(child) { this.children.splice(this.children.indexOf(child), 1); child.parentNode = null; },
      get firstChild() { return this.children[0] || null; },
      setAttribute(name, value) { this.attributes[name] = value; },
    };
  }
  const main = element('main');
  const byId = (id, node = main) => node.id === id ? node : node.children.map(child => byId(id, child)).find(Boolean);
  const requests = [];
  class FakeXHR {
    constructor() { requests.push(this); this.readyState = 0; this.status = 0; this.aborted = false; }
    open(method, url, async) { this.method = method; this.url = url; this.async = async; }
    send() { this.sent = true; }
    abort() { this.aborted = true; }
    respond(status, body) {
      this.readyState = 4; this.status = status; this.responseText = body;
      this.onreadystatechange();
    }
  }
  const document = {
    readyState: 'complete', createElement: element,
    getElementById: byId,
    querySelector: selector => selector === 'main.main' ? main : null,
  };
  vm.runInNewContext(source, { document, XMLHttpRequest: FakeXHR, Date, JSON }, { filename: 'test-monitor.js', timeout: 1000 });
  const get = id => byId(id);
  const refresh = () => get('bx-monitor').children[1].children[1].children[2].onclick();
  return { get, requests, refresh };
}

function report(runs) {
  return JSON.stringify({ generated_at_utc: '2026-11-09T12:00:00+00:00', runs });
}
function run(id, conclusion = 'success') {
  return { id, conclusion, created_at: '2026-11-09T12:00:00Z', event: 'push', commit: 'abc', url: 'https://github.com/example/runs/' + id };
}

test('reports render with independent accessible log labels', () => {
  const env = environment();
  assert.equal(env.requests.length, 1);
  assert.equal(env.requests[0].method, 'GET');
  env.requests[0].respond(200, report([run(123), run(456, 'failure')]));
  const rows = env.get('bx-monitor-runs').children;
  assert.equal(rows.length, 2);
  assert.equal(rows[0].children[2].attributes['aria-label'], 'Ver logs da execução 123');
  assert.equal(rows[1].children[2].attributes['aria-label'], 'Ver logs da execução 456');
  assert.equal(rows[0].children[2].rel, 'noopener noreferrer');
  assert.equal(env.get('bx-monitor-count').textContent, '2 registros');
});

test('manual refresh aborts previous XHR and ignores stale responses', () => {
  const env = environment();
  const first = env.requests[0];
  env.refresh();
  assert.equal(first.aborted, true);
  first.respond(200, report([run(111)]));
  assert.equal(env.get('bx-monitor-runs').children.length, 0);
  env.requests[1].respond(200, report([run(222)]));
  assert.match(env.get('bx-monitor-runs').children[0].children[0].children[0].textContent, /222/);
});

test('empty updated report clears stale runs and updates the count', () => {
  const env = environment();
  env.requests[0].respond(200, report([run(123)]));
  env.refresh();
  env.requests[1].respond(200, report([]));
  assert.equal(env.get('bx-monitor-runs').children.length, 0);
  assert.equal(env.get('bx-monitor-count').textContent, '0 registros');
  assert.match(env.get('bx-monitor-status').textContent, /Nenhuma execução/);
});

test('reports invalid JSON and HTTP failures without inserting rows', () => {
  const env = environment();
  env.requests[0].respond(200, '{invalid');
  assert.match(env.get('bx-monitor-status').textContent, /Não foi possível ler/);
  env.refresh();
  env.requests[1].respond(503, '');
  assert.match(env.get('bx-monitor-status').textContent, /HTTP 503/);
  assert.equal(env.get('bx-monitor-runs').children.length, 0);
});


test('network errors and timeouts show clear status without creating rows', () => {
  const env = environment();
  env.requests[0].onerror();
  assert.match(env.get('bx-monitor-status').textContent, /Falha de conexão/);
  assert.equal(env.get('bx-monitor-runs').children.length, 0);
  env.refresh();
  env.requests[1].ontimeout();
  assert.match(env.get('bx-monitor-status').textContent, /Tempo de consulta esgotado/);
  assert.equal(env.get('bx-monitor-runs').children.length, 0);
});

test('stale network failures do not overwrite a newer successful report', () => {
  const env = environment();
  const old = env.requests[0];
  env.refresh();
  env.requests[1].respond(200, report([run(789)]));
  const status = env.get('bx-monitor-status').textContent;
  old.onerror();
  old.ontimeout();
  assert.equal(env.get('bx-monitor-status').textContent, status);
  assert.equal(env.get('bx-monitor-runs').children.length, 1);
});
