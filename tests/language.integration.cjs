const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function language(name) {
  const window = {};
  vm.runInNewContext(fs.readFileSync('dist/includes/js/languages/' + name + '.js', 'utf8'), { window });
  return window.lang;
}
test('Portuguese covers all upstream keys and preserves substitution parameters', () => {
  const english = language('en'), portuguese = language('pt-br');
  assert.deepEqual(Object.keys(portuguese).sort(), Object.keys(english).sort());
  for (const key of Object.keys(english)) {
    assert.equal(typeof portuguese[key], 'string', key);
    assert.ok(portuguese[key].trim(), key);
    assert.deepEqual((portuguese[key].match(/\{[^}]+\}/g) || []).sort(),
      (english[key].match(/\{[^}]+\}/g) || []).sort(), key);
  }
  assert.equal(portuguese.updateCache, 'Atualizar cache');
  assert.match(portuguese.binLoaderNotResponding, /Payload Loader não responde/);
});
test('all offline manifests include the translation requested by the default language', () => {
  const directory = 'dist/includes/caches/manifest/';
  for (const name of fs.readdirSync(directory).filter(n => n.endsWith('.manifest'))) {
    const entries = fs.readFileSync(directory + name, 'utf8').split('CACHE:')[1].split('NETWORK:')[0].split('\n');
    assert.ok(entries.includes('../../../includes/js/languages/pt-br.js'), name);
  }
});
