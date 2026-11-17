'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const code = fs.readFileSync('native-store/main.cpp', 'utf8');
test('store native preview remains local and non-installing', () => {
  assert.match(code, /no PKG downloader, installer or remote endpoints/i);
  assert.match(code, /Sem downloads, rede ou instalador nesta versao/);
  assert.doesNotMatch(code, /sceNetSocket|sceNetConnect|sceKernelExecute|sceKernelWrite|sceKernelLoadStartModule|installPkg|downloadPkg|jailbreak\(/);
});
test('store preview navigation and pending state remain visible', () => {
  for (const method of ['DpadDownPressed','DpadUpPressed','XPressed','CirclePressed']) {
    assert.ok(code.includes('pad.' + method + '()'), method);
  }
  assert.match(code, /PENDENTE/);
  assert.match(code, /PKG ainda nao publicado/);
});
