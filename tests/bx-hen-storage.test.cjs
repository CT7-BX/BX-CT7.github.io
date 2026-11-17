'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const extras = fs.readFileSync('overrides/bx-hen-site/extras.js', 'utf8');
const html = fs.readFileSync('overrides/bx-hen-site/index.html', 'utf8');
const dashboard = html.match(/^function storageCheck\(\)\{[^\n]+$/m)?.[0];
assert.ok(dashboard, 'dashboard storage check must be found');
function createStorage(values = new Map()) {
  return {
    values,
    getItem(k) {return values.has(k)?values.get(k):null;},
    setItem(k,v) {values.set(k,v);},
    removeItem(k) {values.delete(k);},
  };
}
function runDashboard(storage) {
  return vm.runInNewContext(dashboard + '\nstorageCheck()', {window:{localStorage:storage}, Date, Math});
}
function runExtras(storage) {
  const context = {
    window: {localStorage:storage},
    navigator: {userAgent:'Browser test',platform:'Test',onLine:true},
    document: {
      readyState:'loading', addEventListener() {}, getElementById() {return null;},
    }, Date, Math,
  };
  const src = extras.replace('function copyLogs(){','window.__healthCheck=check;\nfunction copyLogs(){');
  assert.notEqual(src, extras, 'health hook should exist');
  vm.runInNewContext(src, context, {filename:'extras.js',timeout:1000});
  context.window.__healthCheck();
}
test('dashboard and health checks preserve existing keys and remove own probes', () => {
  const data = new Map([
    ['bx-hen-health-temp','personal-data'],
    ['bx-hen-dashboard-check','previous-data'],
    ['other-preference','keep'],
  ]);
  const storage = createStorage(data);
  assert.equal(runDashboard(storage), 'Disponível');
  runExtras(storage);
  assert.equal(data.size, 3);
  assert.equal(data.get('bx-hen-health-temp'), 'personal-data');
  assert.equal(data.get('bx-hen-dashboard-check'), 'previous-data');
  assert.equal(data.get('other-preference'), 'keep');
});
test('failed storage writes preserve old keys without throwing', () => {
  const data = new Map([['bx-hen-health-temp','keep'],['bx-hen-dashboard-check','keep']]);
  let removes = 0;
  const storage = {
    getItem(k) {return data.has(k)?data.get(k):null;},
    setItem() {throw Error('blocked');},
    removeItem() {removes++;},
  };
  assert.equal(runDashboard(storage), 'Indisponível');
  assert.doesNotThrow(() => runExtras(storage));
  assert.equal(removes, 0);
  assert.equal(data.size, 2);
});
test('collision with an existing temporary-looking key never writes or deletes', () => {
  let writes = 0, removes = 0;
  const storage = {
    getItem(k) {return /bx-hen-(?:health-temp|dashboard-check)-/.test(k)?'already-there':null;},
    setItem() {writes++;},
    removeItem() {removes++;},
  };
  assert.equal(runDashboard(storage), 'Indisponível');
  runExtras(storage);
  assert.equal(writes, 0);
  assert.equal(removes, 0);
});
