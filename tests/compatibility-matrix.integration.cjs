// Only validates published metadata against WebKitty routing. Never executes payloads.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const data = JSON.parse(fs.readFileSync('dist/compatibility-matrix.json', 'utf8'));
const routing = fs.readFileSync('dist/includes/js/firmware.js', 'utf8');
const report = fs.readFileSync('dist/includes/js/dev-diagnostics.js', 'utf8');
const html = fs.readFileSync('dist/index.html', 'utf8');

test('published compatibility metadata agrees with exact firmware routing', () => {
  assert.equal(data.schema_version, 1);
  assert.equal(data.physical_ps4_tested, false);
  assert.equal(data.jailbreak_validated, false);
  assert.ok(data.entries.length >= 6);
  for (const entry of data.entries) {
    const context = vm.createContext({navigator: {userAgent:'Mozilla (PlayStation 4/'+entry.firmware+')'}});
    vm.runInContext(routing, context);
    assert.equal(context.isFirmwareSupported(entry.firmware),
      entry.host_profile === 'configured', entry.firmware);
    assert.equal(entry.console_test, 'not_verified', entry.firmware);
  }
});

test('matrix is bundled into existing diagnostics with no added visible UI', () => {
  assert.doesNotMatch(report, /BX_SUPPORT_MATRIX/);
  assert.match(report, /"schema_version":1/);
  assert.match(report, /"firmware":"14\.02"/);
  assert.equal(html.includes('compatibility-matrix.json'), false,
    'the matrix is not another network request or a new visible page component');
  assert.match(report, /function copyReport\(\)/);
});

test('no claim of physical jailbreak success is inferred from build metadata', () => {
  assert.equal(data.publication_channel, 'stable');
  assert.match(data.scope, /neither successful jailbreak nor actual console validation/i);
  for (const entry of data.entries) {
    assert.ok(['configured','not_configured'].includes(entry.host_profile));
    assert.ok(['static_routing_only','none'].includes(entry.automatic_checks));
  }
});


test('complete published firmware and GoldHEN catalogs mirror the real unchanged UI', () => {
  const select=html.match(/<select[^>]*id="ps4FwSelect"[\s\S]*?<\/select>/);
  assert.ok(select);
  const firmware=[...new Set(Array.from(select[0].matchAll(/<option[^>]*value="([0-9]{1,2}\.[0-9]{2})"/g),m=>m[1]))];
  const goldhen=Array.from(html.matchAll(/<input[^>]*name="goldhen"[^>]*value="(GHv2\.4b18\.[0-9]{1,2})"/g),m=>m[1]);
  assert.ok(firmware.length>=50);
  assert.ok(goldhen.length>=7);
  assert.equal(data.firmware_option_count,firmware.length);
  assert.equal(data.goldhen_option_count,goldhen.length);
  assert.deepEqual(data.entries.filter(e=>e.ui_listed).map(e=>e.firmware).sort(),
    [...firmware].sort());
  assert.deepEqual(data.goldhen_options.map(e=>e.version).sort(),goldhen.sort());
  assert.equal(data.catalog_generated_from,'published_host_firmware_and_goldhen_selectors');
  assert.equal(data.physical_ps4_tested,false);
  assert.equal(data.jailbreak_validated,false);
});

test('each documented GoldHEN option maps to an existing unchanged binary with correct hash', () => {
  const crypto=require('node:crypto');
  const actualFiles=new Set();
  for(const option of data.goldhen_options) {
    assert.equal(option.physical_ps4_tested,false);
    assert.equal(option.verification,'file_and_menu_only');
    assert.match(option.binary,/^includes\/payloads\/HEN\/goldhen_[A-Za-z0-9._-]+\.bin$/);
    const bin=fs.readFileSync('dist/'+option.binary);
    assert.equal(crypto.createHash('sha256').update(bin).digest('hex'),option.sha256);
    assert.ok(!actualFiles.has(option.version),'duplicate version');
    actualFiles.add(option.version);
  }
});

test('all listed firmwares have matching static routing and bounded GoldHEN version choices', () => {
  const known=new Set(data.goldhen_options.map(x=>x.version));
  for(const item of data.entries) {
    const context=vm.createContext({navigator:{userAgent:'Mozilla (PlayStation 4/'+item.firmware+')'}});
    vm.runInContext(routing,context);
    assert.equal(context.isFirmwareSupported(item.firmware),item.host_profile==='configured',item.firmware);
    assert.equal(item.default_chain_id,context.getDefaultChain(item.firmware),item.firmware);
    for(const version of item.goldhen_options_checked||[]) assert.ok(known.has(version),item.firmware);
    if(item.host_profile!=='configured')assert.deepEqual(item.goldhen_options_checked,[]);
  }
  const selected=data.entries.find(x=>x.firmware==='14.02');
  assert.ok(selected);
  assert.deepEqual([...selected.goldhen_options_checked].sort(),
    ['GHv2.4b18.13','GHv2.4b18.14']);
  for(const fw of ['13.53','14.01','14.03','14.04']){
    const entry=data.entries.find(x=>x.firmware===fw);
    assert.equal(entry.host_profile,'not_configured',fw);
    assert.deepEqual(entry.goldhen_options_checked,[],fw);
  }
});
