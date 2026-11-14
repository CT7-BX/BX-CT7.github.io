"""Reviewed payload-only update; original kernel chains remain byte-identical."""
import json
from pathlib import Path
from firmware_1402 import download_selected
from runtime_patch import replace_required

REVISION = 'f4caa56a29c4598e1dbd5422c1a0ff83e2a1c5e3'
ASSETS = {'includes/payloads/HEN/goldhen_v2.4b18.14.bin':
          ('includes/payloads/HEN/goldhen_v2.4b18.14.bin', '2d04ed98d2af86677472278d47eefa1fec45bb48')}

def prepare(root):
    download_selected(root, 'ArabPixel/WebKitty', REVISION, ASSETS)
    metadata = {'repository': 'ArabPixel/WebKitty', 'revision': REVISION,
                'physical_ps4_tested': False, 'files': dict(ASSETS.values())}
    (root / 'payload-update.json').write_text(json.dumps(metadata, indent=2) + '\n')
    return metadata

def integrate(root):
    def update(path, old, new):
        replace_required(root, path, old, new)
    hen = 'includes/js/HENs.js'
    update(hen, 'var GOLDHEN_VERSIONS = {', "var GOLDHEN_VERSIONS = {\n    'GHv2.4b18.14': 'goldhen_v2.4b18.14.bin',")
    update(hen, "var GOLDHEN_DEFAULT = 'GHv2.4b18.13';", "var GOLDHEN_DEFAULT = 'GHv2.4b18.14';")
    # Preserve the explicitly chosen compatible 13 on 14.02; normalize older preferences.
    path = root / hen
    source = path.read_text()
    old = "storage.set('GHVer', GOLDHEN_DEFAULT);"
    if source.count(old) != 2:
        raise ValueError('14.02 preference integration changed')
    source = source.replace(old, "storage.set('GHVer', storage.getString('GHVer', GOLDHEN_DEFAULT) === 'GHv2.4b18.13' ? 'GHv2.4b18.13' : GOLDHEN_DEFAULT);")
    source = source.replace("HEN_BASE_PATH + 'goldhen_v2.4b18.13_fw1402.bin'", "HEN_BASE_PATH + (storage.getString('GHVer', GOLDHEN_DEFAULT) === 'GHv2.4b18.13' ? 'goldhen_v2.4b18.13_fw1402.bin' : 'goldhen_v2.4b18.14.bin')")
    source = source.replace("value !== GOLDHEN_DEFAULT)", "value !== GOLDHEN_DEFAULT && value !== 'GHv2.4b18.13')")
    source = source.replace('use o GoldHEN v2.4b18.13 incluído', 'use o GoldHEN v2.4b18.14 ou v2.4b18.13 incluído')
    path.write_text(source)
    update(hen, 'user.ps4Fw > 13.00 && value !== GOLDHEN_DEFAULT', "user.ps4Fw > 13.00 && !(getPs4FwVersion() === '14.02' && value === 'GHv2.4b18.13') && value !== GOLDHEN_DEFAULT")
    update('index.html', 'value="GHv2.4b18.13" onchange="setGoldHENVer(this.value);">', 'value="GHv2.4b18.14" onchange="setGoldHENVer(this.value);">')
    update('index.html', '<p>GoldHEN v2.4b18.13 - </p>', '<p>GoldHEN v2.4b18.14 - </p>')
    marker = '<summary>Other versions</summary>'
    update('index.html', marker, marker + '''
                        <label class="flex items-center text-white/80">
                            <input type="radio" name="goldhen" value="GHv2.4b18.13" onchange="setGoldHENVer(this.value);">
                            <p>GoldHEN v2.4b18.13</p>
                        </label>''')
    update(hen, "    storage.set('GHVer', value);\n}", """    storage.set('GHVer', value);
    var selected = storage.session.getString('payload_path', null);
    if (user.currentJbFlavor === 'GoldHEN' && (!selected || selected.indexOf(HEN_BASE_PATH) === 0)) GoldHEN();
}""")
    # Upstream explicitly excludes elfldr from 14.02; do not advertise it there.
    update('includes/js/payloadsList.js', 'specificFW: "4.71 - latest"', 'specificFW: "4.71 - 14.00"')
    for manifest in (root / 'includes/caches/manifest').glob('*.manifest'):
        text = manifest.read_text()
        if 'goldhen_v2.4b18.13' in text:
            manifest.write_text(text.replace('CACHE:', 'CACHE:\n../../../includes/payloads/HEN/goldhen_v2.4b18.14.bin\n../../../payload-update.json', 1))
    # Replace only the host's transfer helpers, never a kernel or loader binary.
    target = root / 'includes/js/deliverPayload.js'
    text = target.read_text()
    start = text.index('function getPayload(payloadUrl, onLoadEndCallback) {')
    end = text.index('/**\n * Sends a payload to the PS4.', start)
    replacement = (Path(__file__).parent / 'overrides/payload-transport.js').read_text()
    text = text[:start] + replacement + '\n\n' + text[end:]
    # Legacy ELF transfers share the same bounded request helper.
    start = text.index('function sendPayload(bytes, name, onDone, args) {')
    end = text.index('/**\n * A legacy friendly way', start)
    elf = '''function sendPayload(bytes, name, onDone, args) {
    var query = '?pipe=0' + (args ? '&args=' + encodeURIComponent(args) : '');
    bxPayloadRequest('POST', ELFLDR + '/' + encodeURIComponent(name || 'payload.elf') + query,
        bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), false, 8000,
        function (ok, req) { if (onDone) onDone(ok ? req.status : 0, ok ? req.responseText : 'request failed'); }, true);
}
function loadAndSend(url, onDone, name, args) {
    getPayload(url, function (req) {
        if (req && (req.status === 200 || req.status === 304) && req.response && req.response.byteLength > 0) {
            sendPayload(req.response, name || getPayloadName(url), onDone, args);
        } else if (onDone) onDone(0, 'could not load ' + url);
    });
}

'''
    target.write_text(text[:start] + elf + text[end:])

    recovery = 'includes/js/host-return.js'
    (root / recovery).write_bytes((Path(__file__).parent / 'overrides/host-return.js').read_bytes())
    update('index.html', '</body>', '<script src="./includes/js/host-return.js"></script>\n</body>')
    for manifest in (root / 'includes/caches/manifest').glob('*.manifest'):
        manifest.write_text(manifest.read_text().replace('CACHE:', 'CACHE:\n../../../' + recovery, 1))
