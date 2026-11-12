// Run after build.py. Evaluates selection/UI code only; never executes a payload or exploit.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');

function host(firmware = '13.52', accepted = true) {
  const local = {}, session = {}, nodes = {}, visible = {}, messages = [];
  const user = { currentJbFlavor: 'GoldHEN', ps4Fw: firmware };
  const context = vm.createContext({
    navigator: { userAgent: 'Mozilla/5.0 (PlayStation 4/' + firmware + ') AppleWebKit/605.1.15' },
    user, commonMax: 13.00, devMode: false,
    document: {
      getElementById(id) { return nodes[id] || (nodes[id] = { id }); },
      querySelector(selector) { return nodes[selector] || (nodes[selector] = { checked: false }); },
      querySelectorAll() { return []; }
    },
    storage: { set(k, v) { local[k] = v; }, getString(k, fallback) { return local[k] || fallback; },
      session: { set(k, v) { session[k] = v; } } },
    toggleVisibility(id, value) { visible[id] = value; },
    alert(message) { messages.push(message); }, confirm() { return accepted; }
  });
  for (const file of ['firmware.js', 'HENs.js']) {
    vm.runInContext(fs.readFileSync('dist/includes/js/' + file, 'utf8'), context, { timeout: 1000 });
  }
  return { context, user, local, session, nodes, visible, messages };
}

test('13.52 recognizes the existing Relapse chain and shows nexHEN', () => {
  const h = host();
  assert.equal(h.context.getPs4FwVersion(), '13.52');
  assert.equal(h.context.getDefaultChain('13.52'), h.context.EXPLOIT_CHAINS.RELAPSE);
  h.context.updateHenFlavorVisibility('13.52');
  assert.equal(h.visible['nexHEN-label-initial'], true);
  assert.equal(h.visible['nexHEN-label-exploit'], true);
});

test('confirmed nexHEN selection stores the ELF path and syncs the second selector', () => {
  const h = host();
  h.context.saveJbFlavor('hen', 'nexHEN');
  assert.equal(h.local.jailbreakFlavor, 'nexHEN');
  assert.equal(h.user.currentJbFlavor, 'nexHEN');
  assert.equal(h.session.payload_path, './includes/payloads/HEN/nexHEN-ps4.elf');
  assert.equal(h.nodes['input[name="hen2"][value="nexHEN"]'].checked, true);
});

test('canceling selection preserves GoldHEN and does not change payload path', () => {
  const h = host('13.52', false);
  h.context.saveJbFlavor('hen', 'nexHEN');
  assert.equal(h.user.currentJbFlavor, 'GoldHEN');
  assert.equal(h.session.payload_path, undefined);
});

test('unrecognized firmware is still rejected', () => {
  const h = host('13.53');
  h.context.saveJbFlavor('hen', 'nexHEN');
  assert.equal(h.user.currentJbFlavor, 'GoldHEN');
  assert.equal(h.session.payload_path, undefined);
  assert.equal(h.messages.length, 1);
});

test('published nexHEN and ELF loaders match the reviewed pinned bytes', () => {
  const hashes = {
    'HEN/nexHEN-ps4.elf': '329500a864567bcddc6517ad397633f9898ceab68e5a43d33d836b732d1090ba',
    'Bins/elfldr.bin': 'e66bbf87e4b5cc961a6ac1ddabca22c8c7a5e965c2a31e22e435a61fe83fdcfe',
    'Bins/elfldr.elf': 'fa39e1fb1df62f23703830ed2e2c18cba8ee7582247b09b386851360fe37f8c4'
  };
  for (const [name, expected] of Object.entries(hashes)) {
    const data = fs.readFileSync('dist/includes/payloads/' + name);
    assert.equal(crypto.createHash('sha256').update(data).digest('hex'), expected, name);
    if (name.endsWith('.elf')) assert.equal(data.subarray(0, 4).toString('hex'), '7f454c46');
  }
  const manifest = fs.readFileSync('dist/includes/caches/manifest/1302-1352.manifest', 'utf8');
  const entries = manifest.split('CACHE:')[1].split('NETWORK:')[0].split('\n');
  for (const name of Object.keys(hashes)) assert.ok(entries.includes('../../../includes/payloads/' + name));
});
