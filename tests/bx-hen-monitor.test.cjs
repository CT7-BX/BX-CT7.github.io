// Browser-only monitor regression tests, run with Node (no PS4 or jailbreak validation).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('overrides/bx-hen-site/test-monitor.js', 'utf8');

function environment(options = {}) {
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
    constructor() { if(options.constructorFails)throw Error('blocked');requests.push(this); this.readyState = 0; this.status = 0; this.aborted = false; }
    open(method, url, async) { if(options.openFails)throw Error('blocked');this.method = method; this.url = url; this.async = async; }
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

test('status announcements and refresh control remain accessible', () => {
  const env = environment();
  const status = env.get('bx-monitor-status');
  const button = env.get('bx-monitor').children[1].children[1].children[2];
  assert.equal(status.attributes.role, 'status');
  assert.equal(status.attributes['aria-live'], 'polite');
  assert.equal(status.attributes['aria-atomic'], 'true');
  assert.equal(button.type, 'button');
  env.requests[0].respond(200, report([]));
  assert.match(status.textContent, /Nenhuma execução/);
  env.refresh();
  assert.match(status.textContent, /Consultando histórico/);
});

test('temporary HTTP failure keeps the last successful report visible', () => {
  const env = environment();
  env.requests[0].respond(200, report([run(321)]));
  assert.equal(env.get('bx-monitor-runs').children.length, 1);
  env.refresh();
  env.requests[1].respond(503, '');
  assert.equal(env.get('bx-monitor-runs').children.length, 1);
  assert.equal(env.get('bx-monitor-count').textContent, '1 registro');
  assert.match(env.get('bx-monitor-status').textContent, /HTTP 503/);
});

test('malformed reports cannot partially erase the last valid list', () => {
  const env = environment();env.requests[0].respond(200, report([run(321)]));
  env.refresh();env.requests[1].respond(200, report([run(456), null]));
  assert.equal(env.get('bx-monitor-runs').children.length, 1);
  assert.match(env.get('bx-monitor-runs').children[0].children[0].children[0].textContent, /321/);
  assert.match(env.get('bx-monitor-status').textContent, /Não foi possível ler/);
});

test('optional CI metadata outage is explicit and preserves visible runs', () => {
  const env = environment();env.requests[0].respond(200, report([run(321)]));
  env.refresh();env.requests[1].respond(200, JSON.stringify({runs:[],collection_status:'unavailable'}));
  assert.match(env.get('bx-monitor-status').textContent, /não pôde ser coletado/);
  assert.equal(env.get('bx-monitor-runs').children.length, 1);
});

test('log links are always built from the run ID, never an arbitrary response URL', () => {
  const env = environment();const item = run(123);item.url='javascript:alert(1)';
  env.requests[0].respond(200,report([item]));
  assert.equal(env.get('bx-monitor-runs').children[0].children[2].href,
    'https://github.com/CT7-BX/BX-CT7.github.io/actions/runs/123');
});

test('XHR construction/open failures are reported and late errors cannot replace success', () => {
  for(const option of ['constructorFails','openFails']){
    const env=environment({[option]:true});assert.match(env.get('bx-monitor-status').textContent,/não é suportada/);
  }
  const env=environment();env.requests[0].respond(200,report([run(123)]));
  const message=env.get('bx-monitor-status').textContent;
  env.requests[0].onerror();env.requests[0].ontimeout();
  assert.equal(env.get('bx-monitor-status').textContent,message);
});

test('monitor uses singular and plural record labels', () => {
  const env = environment();
  env.requests[0].respond(200, report([run(1)]));
  assert.equal(env.get('bx-monitor-count').textContent, '1 registro');
  env.refresh();
  env.requests[1].respond(200, report([run(1), run(2)]));
  assert.equal(env.get('bx-monitor-count').textContent, '2 registros');
});


test('completed XHR with status zero reports a connection failure and keeps prior results', () => {
  const env = environment();
  env.requests[0].respond(200, report([run(321)]));
  env.refresh();
  env.requests[1].respond(0, '');
  assert.match(env.get('bx-monitor-status').textContent, /Falha de conexão/);
  assert.equal(env.get('bx-monitor-runs').children.length, 1);
  assert.equal(env.get('bx-monitor-count').textContent, '1 registro');
});

test('invalid run identifiers never replace the last valid report', () => {
  const env = environment();
  env.requests[0].respond(200, report([run(321)]));
  for (const invalidId of [0, -1, 1.5, '123', null]) {
    env.refresh();
    env.requests[env.requests.length - 1].respond(200, report([run(invalidId)]));
    assert.equal(env.get('bx-monitor-runs').children.length, 1);
    assert.match(env.get('bx-monitor-runs').children[0].children[0].children[0].textContent, /321/);
    assert.equal(env.get('bx-monitor-count').textContent, '1 registro');
    assert.match(env.get('bx-monitor-status').textContent, /Não foi possível ler/);
  }
});


test('oversized and non-array reports cannot replace the last valid history', () => {
  const env = environment();
  env.requests[0].respond(200, report([run(321)]));
  const invalidReports = [
    JSON.stringify({ runs: Array.from({ length: 31 }, (_, i) => run(i + 1)) }),
    JSON.stringify({ runs: { 0: run(123), length: 1 } }),
  ];
  for (const invalidReport of invalidReports) {
    env.refresh();
    env.requests[env.requests.length - 1].respond(200, invalidReport);
    assert.equal(env.get('bx-monitor-runs').children.length, 1);
    assert.match(env.get('bx-monitor-runs').children[0].children[0].children[0].textContent, /321/);
    assert.equal(env.get('bx-monitor-count').textContent, '1 registro');
    assert.match(env.get('bx-monitor-status').textContent, /Não foi possível ler/);
  }
});


test('history is a focusable, labelled region and announces pending requests', () => {
  const env = environment();
  const monitor = env.get('bx-monitor');
  const history = env.get('bx-monitor-runs');
  assert.equal(monitor.children[0].tagName, 'h2');
  assert.equal(monitor.attributes['aria-labelledby'], 'bx-monitor-heading');
  assert.equal(history.attributes.role, 'region');
  assert.equal(history.attributes.tabindex, '0');
  assert.match(history.attributes['aria-label'], /Histórico/);
  assert.equal(history.attributes['aria-busy'], 'true');
  env.requests[0].respond(200, report([run(123)]));
  assert.equal(history.attributes['aria-busy'], 'false');
  env.refresh();
  assert.equal(history.attributes['aria-busy'], 'true');
  env.requests[1].respond(503, '');
  assert.equal(history.attributes['aria-busy'], 'false');
  assert.equal(history.children.length, 1);
});

test('oversized responses cannot freeze or overwrite a previously valid history', () => {
  const env = environment();
  env.requests[0].respond(200, report([run(321)]));
  env.refresh();
  env.requests[1].respond(200, 'x'.repeat(131073));
  assert.match(env.get('bx-monitor-status').textContent, /maior que o limite/);
  assert.equal(env.get('bx-monitor-runs').attributes['aria-busy'], 'false');
  assert.equal(env.get('bx-monitor-runs').children.length, 1);
  assert.equal(env.get('bx-monitor-count').textContent, '1 registro');
});

test('unreasonably long CI fields are rejected without losing prior results', () => {
  const env = environment();
  env.requests[0].respond(200, report([run(321)]));
  const bad = run(999);
  bad.commit = 'a'.repeat(129);
  env.refresh();
  env.requests[1].respond(200, report([bad]));
  assert.match(env.get('bx-monitor-status').textContent, /Não foi possível ler/);
  assert.equal(env.get('bx-monitor-runs').children.length, 1);
  assert.equal(env.get('bx-monitor-count').textContent, '1 registro');
});
