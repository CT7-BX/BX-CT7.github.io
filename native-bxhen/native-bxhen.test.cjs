'use strict';
const fs = require('node:fs');
const test = require('node:test');
const assert = require('node:assert/strict');

const cpp = fs.readFileSync(__dirname + '/main.cpp', 'utf8');
const readme = fs.readFileSync(__dirname + '/README.md', 'utf8');

test('BX-HEN identity, version and RUOK999 appear in native UI', () => {
  assert.match(cpp, /"BX-HEN"/);
  assert.match(cpp, /"v2\.2"/);
  assert.match(cpp, /PERSONALIZACAO: RUOK999/);
  assert.match(readme, /Personalização: RUOK999/);
});

test('all eight approved menu labels are present without fake toggles', () => {
  const expected = ['Debug Settings', 'Cheat Settings', 'Plugin Settings',
    'Game Overlay', 'Servers Settings', 'Klog Settings', 'Settings', 'About'];
  for (const name of expected) assert.ok(cpp.includes('{"' + name + '",'), name);
  assert.match(cpp, /MENU_COUNT = sizeof\(MENU\) \/ sizeof\(MENU\[0\]\)/);
});

test('DualShock navigation and exit controls have handlers', () => {
  for (const key of ['DpadDownPressed', 'DpadUpPressed', 'XPressed',
    'CirclePressed', 'StartPressed']) assert.ok(cpp.includes('pad.' + key + '()'), key);
});

test('preview never launches an exploit or changes GoldHEN settings', () => {
  assert.match(cpp, /Modo demonstracao\. Sem alteracoes no console\./);
  assert.doesNotMatch(cpp, /sceKernelExecute|sceKernelWrite|sceKernelLoadStartModule|jailbreak\(|payload_path|sceNetSocket|sceNetConnect/);
  assert.match(readme, /não modifica|Não é uma modificação/i);
});

test('project is separate from the existing website and HEN payload', () => {
  assert.doesNotMatch(cpp, /includes\/payloads\/HEN|bx-hen\/index\.html|patch_runtime\.py/);
  assert.match(readme, /site.*continua intocado/i);
});
