// Routing and file integrity only. Never execute a kernel chain or payload.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');

test('14.00 selects the native upstream chain and its own offline cache', () => {
  const context = vm.createContext({navigator:{userAgent:'Mozilla/5.0 (PlayStation 4/14.00) AppleWebKit/605.1.15'}});
  vm.runInContext(fs.readFileSync('dist/includes/js/firmware.js','utf8'),context);
  assert.equal(context.getPs4FwVersion(),'14.00');
  assert.equal(context.getDefaultChain('14.00'),context.EXPLOIT_CHAINS.SLOPKIT_AFTERGLOW);
  assert.equal(context.getCachePage('14.00'),'./includes/caches/cache1400.html');
  assert.equal(context.isFirmwareSupported('14.01'),false);
  assert.equal(context.getDefaultChain('13.52'),context.EXPLOIT_CHAINS.RELAPSE);
});

test('main host uses the native handler without the old landing page redirect', () => {
  const html = fs.readFileSync('dist/index.html','utf8');
  assert.match(html,/id="slopkitAfterglowExp"/);
  assert.doesNotMatch(html,/afterglow-router\.js|\.\/afterglow\/index\.html/);
  assert.equal(fs.existsSync('dist/afterglow'),false);
  for(const filename of ['jailbreak.js','jailbreak-legacy.js']) {
    const source=fs.readFileSync('dist/includes/js/'+filename,'utf8');
    assert.match(source,/EXPLOIT_HANDLERS\[EXPLOIT_CHAINS\.SLOPKIT_AFTERGLOW\] = slopkitAfterglow/);
    assert.match(source,/src\/slopkit-afterglow\/jb\.js/);
  }
});

test('all native 14.00 chain files and kernel patch are available offline', () => {
  const entries=fs.readFileSync('dist/includes/caches/manifest/1400.manifest','utf8').split('CACHE:')[1].split('NETWORK:')[0].split('\n');
  for(const name of ['afterglow.js','core.js','int64.js','jb.js','mem.js','ps4_offsets.js']) {
    assert.ok(entries.includes('../../../src/slopkit-afterglow/'+name),name);
    assert.ok(fs.statSync('dist/src/slopkit-afterglow/'+name).size>0);
  }
  assert.ok(entries.includes('../../../src/kpatches/1400.bin'));
  assert.match(fs.readFileSync('dist/includes/caches/cache1400.html','utf8'),/manifest\/1400\.manifest/);
});

test('published exploit and payload bytes match the downloaded upstream inventory', () => {
  const inventory=JSON.parse(fs.readFileSync('dist/upstream-integrity.json','utf8'));
  assert.equal(inventory.physical_ps4_tested,false);
  assert.match(inventory.revision,/^[a-f0-9]{40}$/);
  assert.ok(Object.keys(inventory.protected_files).length>50);
  for(const [name,expected] of Object.entries(inventory.protected_files)) {
    assert.match(name,/^(src\/|includes\/payloads\/)/);
    const actual=crypto.createHash('sha256').update(fs.readFileSync('dist/'+name)).digest('hex');
    assert.equal(actual,expected,name);
  }
});
