// Read-only browser diagnostics; no network, payload, or kernel execution.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function environment(options = {}) {
  function node(tag) {
    return { tag, children: [], textContent: '', style: {},
      appendChild(n) { this.children.push(n); return n; },
      removeChild(n) { this.children.splice(this.children.indexOf(n), 1); },
      get firstChild() { return this.children[0]; },
      attributes: {}, setAttribute(k, v) { this.attributes[k] = v; }, getAttribute(k) { return this.attributes[k]; }, focus() { document.activeElement = this; }, select() { this.selected = true; } };
  }
  const body = node('body');
  const state = node('div'); state.id = 'state'; state.textContent = 'Estado do processo';
  const log = node('div'); log.id = 'console'; log.textContent = 'old'.repeat(5000) + 'LAST HOST LINE';
  body.appendChild(state); body.appendChild(log);
  const all = (n = body) => [n, ...n.children.flatMap(c => all(c))];
  const listeners = {};
  const document = { documentElement: { getAttribute() { return options.catalogDisabled ? 'disabled' : null; } }, addEventListener(name, fn) { listeners[name] = fn; }, readyState: 'complete', body, createElement: node,
    getElementById(id) { return all().find(n => n.id === id) || null; }, execCommand() { return false; } };
  const window = { localStorage: { getItem(key) { return key === 'GHVer' ? (options.ghVersion || null) : null; } } };
  const context = { window, document, navigator: {language: options.language || 'pt-BR', onLine: options.offline ? false : true}, localStorage: window.localStorage,
    user: { currentJbFlavor: options.flavor || 'nexHEN', exploitChain: 7 },
    getPs4FwVersion() { return options.firmware || '13.52'; }, isPS4Console() { return true; },
    isFirmwareSupported() { return true; }, devMode: false,
    storage: { session: { getString() { return './includes/payloads/HEN/nexHEN-ps4.elf'; } } },
    XMLHttpRequest() { throw Error('Diagnostics must not make requests'); },
    jailbreak() { throw Error('Diagnostics must not launch'); } };
  const reportSource=fs.readFileSync('overrides/dev-diagnostics.js', 'utf8');
  const injected=options.matrix ? reportSource.replace(
    '/* BX_SUPPORT_MATRIX */ null', JSON.stringify(options.matrix)) : reportSource;
  vm.runInNewContext(injected, context, { timeout: 1000 });
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
  assert.match(report.value, /Última linha do registro do host:.*LAST HOST LINE/);
  assert.doesNotMatch(report.value, /Estado do processo/);
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


test('dialog restores scrolling and resets stale copy announcements when reopened', () => {
  const env=environment();env.body.style.overflow='auto';env.window.applicationCache={status:4};
  env.window.bxOpenDiagnostics();assert.equal(env.body.style.overflow,'hidden');
  env.all().find(n=>n.textContent==='Copiar diagnóstico').onclick();
  assert.match(env.document.getElementById('bx-dev-report').value,/Atualização pronta/);
  env.window.bxOpenDiagnostics(); // Opening twice must preserve original overflow.
  assert.match(env.document.getElementById('bx-dev-note').textContent,/Nada é enviado/);
  env.window.bxCloseDiagnostics();assert.equal(env.body.style.overflow,'auto');
});

test('disabled catalog has no dead Advanced shortcut and keyboard focus stays in the diagnostic dialog',()=>{
 const e=environment({catalogDisabled:true});e.window.bxOpenDiagnostics();
 assert.equal(e.all().some(n=>n.textContent==='Abrir aba Avançado'),false);
 const close=e.all().find(n=>n.textContent==='Fechar ✕'),copy=e.all().find(n=>n.textContent==='Copiar diagnóstico');
 e.document.activeElement=close;e.listeners.keydown({keyCode:9,shiftKey:true,preventDefault(){}});assert.equal(e.document.activeElement,copy);
 e.listeners.keydown({keyCode:9,shiftKey:false,preventDefault(){}});assert.equal(e.document.activeElement,close);
});


test('report redacts IPs and common secrets, without sending anything automatically', () => {
 const e=environment();
 const log=e.document.getElementById('console');
 log.textContent='Connection 192.168.12.34 token=supersecret Authorization: Bearer abc123 api_key=xyz';
 e.window.bxOpenDiagnostics();
 e.all().find(n=>n.textContent==='Copiar diagnóstico').onclick();
 const report=e.document.getElementById('bx-dev-report').value;
 assert.match(report,/\[IP oculto\]/);
 assert.match(report,/token=\[oculto\]/);
 assert.match(report,/api_key=\[oculto\]/);
 assert.match(report,/Authorization: Bearer \[oculto\]/);
 assert.doesNotMatch(report,/supersecret|192\.168\.12\.34|abc123/);
 assert.match(report,/Teste físico no console: não verificado/);
});

test('copied report headings support Portuguese, English and Spanish without changing the UI', () => {
 for(const [lang,text] of [
   ['pt-BR','Compatibilidade documentada'],
   ['en-US','Documented compatibility'],
   ['es-ES','Compatibilidad documentada']
 ]) {
   const e=environment({language:lang});
   e.window.bxOpenDiagnostics();
   e.all().find(n=>n.textContent==='Copiar diagnóstico').onclick();
   const report=e.document.getElementById('bx-dev-report').value;
   assert.match(report,new RegExp(text),lang);
   assert.equal(e.all().some(n=>n.textContent==='Copiar diagnóstico'),true);
 }
});


const sampleMatrix={entries:[
 {firmware:'14.02',host_profile:'configured',
  goldhen_options_checked:['GHv2.4b18.13','GHv2.4b18.14']},
 {firmware:'13.53',host_profile:'not_configured',goldhen_options_checked:[]}
]};

function copiedPreflight(options) {
 const e=environment({...options,matrix:sampleMatrix});
 e.window.bxOpenDiagnostics();
 const rowsBefore=e.document.getElementById('bx-dev-diagnostics').children.length;
 e.all().find(n=>n.textContent==='Copiar diagnóstico').onclick();
 return {report:e.document.getElementById('bx-dev-report').value,rowsBefore,e};
}
test('14.02 read-only preflight distinguishes documented GoldHEN choices from activation', () => {
 const a=copiedPreflight({firmware:'14.02',flavor:'GoldHEN',ghVersion:'GHv2.4b18.14'});
 assert.match(a.report,/GoldHEN selecionado consta da lista deste firmware: GHv2\.4b18\.14/);
 assert.match(a.report,/Teste físico no console: não verificado/);
 assert.doesNotMatch(a.report,/GoldHEN ativo no console: Sim/);
 const b=copiedPreflight({firmware:'14.02',flavor:'GoldHEN',ghVersion:'GHv2.4b18.12'});
 assert.match(b.report,/GoldHEN selecionado NÃO consta da lista deste firmware: GHv2\.4b18\.12/);
 assert.equal(a.rowsBefore,b.rowsBefore,'preflight must not introduce visible rows');
});
test('unsupported firmware and offline/cache state produce explicit warnings', () => {
 const noProfile=copiedPreflight({firmware:'13.53',flavor:'GoldHEN',ghVersion:'GHv2.4b18.14'});
 assert.match(noProfile.report,/Perfil não configurado neste host/);
 assert.doesNotMatch(noProfile.report,/GoldHEN selecionado consta/);
 const offline=environment({firmware:'14.02',flavor:'GoldHEN',ghVersion:'GHv2.4b18.13',
   matrix:sampleMatrix,offline:true});
 offline.window.applicationCache={status:5};
 offline.window.bxOpenDiagnostics();
 offline.all().find(n=>n.textContent==='Copiar diagnóstico').onclick();
 const report=offline.document.getElementById('bx-dev-report').value;
 assert.match(report,/O navegador informa ausência de conexão/);
 assert.match(report,/AppCache do navegador está vazio ou obsoleto/);
 assert.match(report,/GHv2\.4b18\.13/);
});
test('GoldHEN preflight does not misclassify other selected HENs', () => {
 const a=copiedPreflight({firmware:'14.02',flavor:'PS4HEN',ghVersion:'GHv2.4b18.12'});
 assert.doesNotMatch(a.report,/GoldHEN selecionado NÃO consta da lista deste firmware/);
 assert.match(a.report,/HEN selecionado \(não prova ativação\): PS4HEN/);
});
test('preflight status remains translated in Portuguese, English and Spanish', () => {
 for(const [lang,needle] of [
   ['pt-BR','Verificações locais (somente leitura):'],
   ['en-US','Local checks (read-only):'],
   ['es-ES','Comprobaciones locales (solo lectura):']
 ]) {
   const e=copiedPreflight({firmware:'14.02',flavor:'GoldHEN',ghVersion:'GHv2.4b18.13',language:lang});
   assert.ok(e.report.includes(needle),lang);
 }
});
