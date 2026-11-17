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
