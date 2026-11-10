'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.join(__dirname, '../overrides/bx-hen-launch.js'), 'utf8');
const style = fs.readFileSync(path.join(__dirname, '../overrides/bx-hen-launch.css'), 'utf8');

function environment() {
  const listeners = {};
  const intervals = [];
  let panel = null, closes = 0;
  const status = { textContent: 'Exploit status' };
  const log = { textContent: '--' };
  const shownStatus = { textContent: '' };
  const shownLog = { textContent: '' };
  const close = { focus() { closes++; } };
  const buttons = { 'bx-hen-close': close, 'bx-hen-console': { focus() {} } };
  const document = {
    readyState: 'complete',
    activeElement: { focus() {} },
    body: { appendChild(node) { panel = node; } },
    createElement() {
      return { id: '', className: '', innerHTML: '', setAttribute() {} };
    },
    getElementById(id) {
      return { ...buttons, state: status, console: log,
        'bx-hen-host-state': shownStatus, 'bx-hen-host-log': shownLog }[id] || null;
    },
    addEventListener(type, fn, capture) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push({ fn, capture });
    }
  };
  const user = { currentJbFlavor: 'GoldHEN', blockJailbreak: false };
  const window = {
    abortLoading: false,
    setInterval(fn) { intervals.push(fn); return intervals.length; },
    clearInterval() {}
  };
  vm.runInNewContext(source, { document, window, user });
  return {
    listeners, intervals, user, window, status, log, shownStatus, shownLog,
    get panel() { return panel; },
    get closeFocusCalls() { return closes; },
    click(id) {
      const event = {
        target: { id, parentNode: document }, defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; },
        stopPropagation() { this.stopped = true; }
      };
      listeners.click[0].fn(event);
      return event;
    },
    key(code) { listeners.keydown[0].fn({ keyCode: code }); }
  };
}

test('Neon opens only on original launch buttons without intercepting their events', () => {
  const app = environment();
  assert.equal(app.panel.className, '');
  assert.equal(app.click('other-button').stopped, undefined);
  assert.equal(app.panel.className, '');
  const event = app.click('ps-logo-container');
  assert.equal(event.defaultPrevented, false);
  assert.equal(event.stopped, undefined);
  assert.equal(app.panel.className, 'bx-open');
});

test('secondary original run button works and close restores original host', () => {
  const app = environment();
  app.click('exploitRun');
  assert.equal(app.panel.className, 'bx-open');
  assert.equal(typeof app.listeners.click[0].capture, 'boolean');
  app.key(27);
  assert.equal(app.panel.className, '');
});

test('any native HEN launch gets visual without changing underlying selection', () => {
  const app = environment();
  app.user.currentJbFlavor = 'PS4HEN';
  app.click('ps-logo-container');
  assert.equal(app.panel.className, 'bx-open');
  assert.equal(app.user.currentJbFlavor, 'PS4HEN');
  app.key(27);
  app.user.currentJbFlavor = 'GoldHEN';
  app.user.blockJailbreak = true;
  app.click('ps-logo-container');
  assert.equal(app.panel.className, '');
});

test('status comes only from upstream host fields, never a simulated success', () => {
  const app = environment();
  app.click('exploitRun');
  assert.equal(app.shownStatus.textContent, 'Aguardando retorno do host original...');
  app.status.textContent = 'Jailbreak successful!';
  app.log.textContent = 'Native host reported completion';
  app.intervals[0]();
  assert.equal(app.shownStatus.textContent, 'Jailbreak successful!');
  assert.equal(app.shownLog.textContent, 'Native host reported completion');
});

test('visual is locally self-contained, branded RUOK999 and isolated from payloads', () => {
  assert.match(source, /BX-HEN v2\.2/);
  assert.match(source, /RUOK999/);
  assert.match(style, /#bx-hen-neon/);
  assert.doesNotMatch(source, /preventDefault\s*\(|stopPropagation\s*\(|jailbreak\s*\(|chooseHEN\s*\(/);
  assert.doesNotMatch(source, /fetch\s*\(|XMLHttpRequest|payload_path\s*=/);
});
