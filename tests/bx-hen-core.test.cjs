// BX-HEN Core 0.1 smoke tests. Run: node --test tests/bx-hen-core.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('overrides/bx-hen-site/core.js', 'utf8');

function freshCore() {
  const window = { isSecureContext: true };
  const context = vm.createContext({ window, navigator: { userAgent: 'BX-HEN CI simulator' }, console });
  vm.runInContext(source, context, { filename: 'core.js', timeout: 2000 });
  return window.BXHENCore;
}

test('core starts inactive with correct version', () => {
  const core = freshCore();
  assert.equal(core.version, '0.1.0');
  assert.equal(core.diagnostics().started, false);
});

test('events support subscribe and unsubscribe', () => {
  const core = freshCore();
  let count = 0;
  const off = core.on('ping', () => count++);
  core.emit('ping', {});
  off();
  core.emit('ping', {});
  assert.equal(count, 1);
});

test('settings can be stored and read', () => {
  const core = freshCore();
  core.setSetting('theme', 'dark');
  assert.equal(core.getSetting('theme'), 'dark');
});

test('duplicate module registration is rejected', () => {
  const core = freshCore();
  core.register('example', { start() {} });
  assert.throws(() => core.register('example', { start() {} }), /duplicate/);
});

test('healthy module starts successfully', async () => {
  const core = freshCore();
  core.register('healthy', { start() {} });
  await core.start();
  assert.equal(core.diagnostics().modules[0].state, 'running');
});

test('failed module does not prevent another from starting', async () => {
  const core = freshCore();
  core.register('broken', { start() { throw new Error('simulated failure'); } });
  core.register('healthy', { start() {} });
  await core.start();
  const states = Object.fromEntries(core.diagnostics().modules.map(m => [m.name, m.state]));
  assert.equal(states.broken, 'failed');
  assert.equal(states.healthy, 'running');
});

test('start sets core ready state', async () => {
  const core = freshCore();
  await core.start();
  assert.equal(core.diagnostics().started, true);
});

test('stop shuts down running modules', async () => {
  const core = freshCore();
  let stopped = false;
  core.register('healthy', { start() {}, stop() { stopped = true; } });
  await core.start();
  await core.stop();
  assert.equal(stopped, true);
  assert.equal(core.diagnostics().started, false);
  assert.equal(core.diagnostics().modules[0].state, 'stopped');
});

test('diagnostics includes event history', () => {
  const core = freshCore();
  core.emit('check', { ok: true });
  assert.equal(core.diagnostics().events[0].type, 'check');
});
