// Read-only browser diagnostics; no network, payload, or kernel execution.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function environment() {
  function node(tag) {
    return { tag, children: [], textContent: '', style: {},
      appendChild(n) { this.children.push(n); return n; },
      removeChild(n) { this.children.splice(this.children.indexOf(n), 1); },
      get firstChild() { return this.children[0]; },
      attributes: {}, setAttribute(k, v) { this.attributes[k] = v; }, getAttribute(k) { return this.attributes[k]; }, focus() { document.activeElement = this; }, select() { this.selected = true; } };
  }
  const body = node('body');
  const state = node('div'); state.id = 'state'; state.textContent = 'Loading ELF';
  const log = node('div'); log.id = 'console'; log.textContent = 'old'.repeat(5000) + 'LAST HOST LINE';
  body.appendChild(state); body.appendChild(log);
  const all = (n = body) => [n, ...n.children.flatMap(c => all(c))];
  const listeners = {};
  const document = { addEventListener(name, fn) { listeners[name] = fn; }, readyState: 'complete', body, createElement: node,
    getElementById(id) { return all().find(n => n.id === id) || null; }, execCommand() { return false; } };
  const window = { localStorage: { getItem() { return null; } } };
  const context = { window, document, localStorage: window.localStorage,
    user: { currentJbFlavor: 'nexHEN', exploitChain: 7 },
    getPs4FwVersion() { return '13.52'; }, isPS4Console() { return true; },
    isFirmwareSupported() { return true; }, devMode: false,
    storage: { session: { getString() { return './includes/payloads/HEN/nexHEN-ps4.elf'; } } },
    XMLHttpRequest() { throw Error('Diagnostics must not make requests'); },
    jailbreak() { throw Error('Diagnostics must not launch'); } };
  vm.runInNewContext(fs.readFileSync('overrides/dev-diagnostics.js', 'utf8'), context, { timeout: 1000 });
  return { window, document, all, listeners, node, body };
}

test('local report includes selected ELF and bounded host logs without executing code', () => {
  const { window, document, all } = environment();
  window.bxOpenDiagnostics();
  assert.equal(document.getElementById('bx-dev-overlay').style.display, 'flex');
  const copy = all().find(n => n.textContent === 'Copiar diagnóstico');
  copy.onclick();
  const report = document.getElementById('bx-dev-report');
  assert.equal(report.selected, true);
  assert.match(report.value, /13\.52/);
  assert.match(report.value, /nexHEN-ps4\.elf/);
  assert.match(report.value, /Loading ELF/);
  assert.match(report.value, /LAST HOST LINE/);
  const tail = report.value.split('Últimas mensagens do host (até 12000 caracteres):\n')[1].split('\n\nRelatório local.')[0];
  assert.equal(tail.length, 12000);
  assert.match(report.value, /execução no console não confirmados/);
});


test('diagnostics moves focus into dialog, traps Tab and restores focus on Escape', () => {
  const { window, document, all, listeners, node } = environment();
  const opener = node('button'); document.activeElement = opener;
  window.bxOpenDiagnostics();
  const close = all().find(n => n.textContent === 'Fechar ✕');
  const last = all().find(n => n.textContent === 'Abrir aba Avançado');
  assert.equal(document.activeElement, close);
  let prevented = false;
  listeners.keydown({ keyCode: 9, shiftKey: true, preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(document.activeElement, last);
  listeners.keydown({ keyCode: 9, shiftKey: false, preventDefault() {} });
  assert.equal(document.activeElement, close);
  listeners.keydown({ keyCode: 27, preventDefault() {} });
  assert.equal(document.activeElement, opener);
  assert.equal(document.getElementById('bx-dev-overlay').style.display, 'none');
  assert.equal(document.getElementById('bx-dev-overlay').attributes['aria-hidden'], 'true');
});

test('reopening clears stale report and failed copy does not claim success', () => {
  const { window, document, all } = environment();
  window.bxOpenDiagnostics();
  all().find(n => n.textContent === 'Copiar diagnóstico').onclick();
  assert.match(document.getElementById('bx-dev-note').textContent, /Cópia automática indisponível/);
  assert.equal(document.activeElement, document.getElementById('bx-dev-report'));
  window.bxCloseDiagnostics(); window.bxOpenDiagnostics();
  assert.equal(document.getElementById('bx-dev-report').value, '');
  assert.equal(document.getElementById('bx-dev-report').style.display, 'none');
});
