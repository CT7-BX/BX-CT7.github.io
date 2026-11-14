"""Isolated 14.02 add-on. Original older-firmware sources/payloads stay intact."""
import hashlib
import io
import json
import tarfile
import urllib.request
from pathlib import Path
from runtime_patch import replace_required

WEBKITTY = 'b4423641016f05e8782c9c80c066e5f4fbfbc551'
AFTERGLOW = 'd4362d212336f1fe870839aab113ee1438878d38'
ASSETS = {
    'src/slopkit-afterglow/afterglow.js': ('src/slopkit-afterglow-1402/afterglow.js', '6757fbf9e93faefadc3aa3f93c6362a6fb639c23'),
    'src/slopkit-afterglow/core.js': ('src/slopkit-afterglow-1402/core.js', 'd57927566fba55953a6852ecbc325924a2aa7d41'),
    'src/slopkit-afterglow/int64.js': ('src/slopkit-afterglow-1402/int64.js', 'ee8d9e6c7e8d4538449fb5eec02062c4fc64e0ef'),
    'src/slopkit-afterglow/jb.js': ('src/slopkit-afterglow-1402/jb.js', '36ca0626f4d39097e69c0cd6889031469164c117'),
    'src/slopkit-afterglow/mem.js': ('src/slopkit-afterglow-1402/mem.js', 'e60e96f9f33b3a5ad592721f4b4f17e4196b2976'),
    'src/slopkit-afterglow/ps4_offsets.js': ('src/slopkit-afterglow-1402/ps4_offsets.js', 'f67b1624b205ea0580d49b5b87b482d4e09328bd'),
    'includes/payloads/HEN/goldhen_v2.4b18.13.bin': ('includes/payloads/HEN/goldhen_v2.4b18.13_fw1402.bin', '01f35104b8aee0fa9c5f1758ea32c784a869c1ff'),
    'includes/payloads/HEN/PS4HEN.bin': ('includes/payloads/HEN/PS4HEN_fw1402.bin', 'dbf4956bd7a9593b99a8ee0dd69b8f53145006d8'),
}
AUTHOR_ASSETS = {
    'patchset-1402.bin': ('src/kpatches/1402.bin', '92ead7629a84d9425743249c11d4ec472c756e2b'),
    'LICENSE': ('includes/licenses/fw1402/Afterglow-LICENSE', 'be3f7b28e564e7dd05eaf59d64adba1a4065ac0e'),
}


def download_selected(root, repository, revision, assets):
    url = 'https://codeload.github.com/' + repository + '/tar.gz/' + revision
    request = urllib.request.Request(url, headers={'User-Agent': 'BX-CT7-reviewed-1402'})
    with urllib.request.urlopen(request, timeout=75) as response:
        data = response.read()
    seen = set()
    with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as archive:
        for member in archive.getmembers():
            name = '/'.join(Path(member.name).parts[1:])
            if name not in assets:
                continue
            if not member.isfile() or name in seen:
                raise ValueError('Invalid or duplicate pinned component: ' + name)
            target, expected = assets[name]
            content = archive.extractfile(member).read()
            actual = hashlib.sha1(('blob %d\0' % len(content)).encode() + content).hexdigest()
            if actual != expected:
                raise ValueError('Pinned 14.02 component checksum mismatch: ' + name)
            destination = root / target
            if destination.exists():
                raise ValueError('14.02 component would overwrite an existing file: ' + target)
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(content)
            seen.add(name)
    if seen != set(assets):
        raise ValueError('Missing pinned 14.02 component')


def prepare_components(root):
    download_selected(root, 'ArabPixel/WebKitty', WEBKITTY, ASSETS)
    download_selected(root, 'well0nez/afterglow-web', AFTERGLOW, AUTHOR_ASSETS)
    metadata = {'firmware': '14.02', 'webkitty_revision': WEBKITTY,
                'afterglow_revision': AFTERGLOW, 'physical_ps4_tested': False,
                'files': {target: blob for target, blob in list(ASSETS.values()) + list(AUTHOR_ASSETS.values())}}
    (root / 'firmware-1402.json').write_text(json.dumps(metadata, indent=2) + '\n', encoding='utf-8')
    return metadata


def integrate_host(root):
    original_html = (root / 'index.html').read_text(encoding='utf-8')
    original_css = {p.relative_to(root).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
                    for p in (root / 'includes/css').rglob('*.css')}
    def update(path, old, new):
        return replace_required(root, path, old, new)
    update('includes/js/firmware.js',
           '        prefMax:     14.00\n    }\n];',
           """        prefMax:     14.00
    },
    {
        id:          EXPLOIT_CHAINS.SLOPKIT_AFTERGLOW,
        label:       'SlopKit Afterglow',
        min:         14.02,
        max:         14.02,
        isDefault:   true,
        prefMin:     14.02,
        prefMax:     14.02
    }
];""")
    update('includes/js/firmware.js',
           "        { min: 14.00, max: 14.00, page: 'cache1400.html' },",
           "        { min: 14.00, max: 14.00, page: 'cache1400.html' },\n        { min: 14.02, max: 14.02, page: 'cache1402.html' },")
    for script in ('jailbreak.js', 'jailbreak-legacy.js'):
        update('includes/js/' + script, 'getScript("src/slopkit-afterglow/jb.js",',
               'getScript((getPs4FwVersion() === "14.02" ? "src/slopkit-afterglow-1402/jb.js" : "src/slopkit-afterglow/jb.js"),')
    update('includes/js/HENs.js', 'function GoldHEN() {', """function GoldHEN() {
    if (getPs4FwVersion() === '14.02') {
        storage.set('GHVer', GOLDHEN_DEFAULT);
        storage.session.set('payload_path', HEN_BASE_PATH + 'goldhen_v2.4b18.13_fw1402.bin');
        return;
    }""")
    update('includes/js/HENs.js', '    if (getPs4FwVersion() == 4.74)',
           "    if (getPs4FwVersion() === '14.02') PS4HENFile = 'PS4HEN_fw1402.bin';\n    else if (getPs4FwVersion() == 4.74)")
    update('includes/js/HENs.js', 'function setGoldHENVer(value) {', """function setGoldHENVer(value) {
    if (getPs4FwVersion() === '14.02' && value !== GOLDHEN_DEFAULT) {
        alert('No firmware 14.02, use o GoldHEN v2.4b18.13 incluído nesta edição.');
        value = GOLDHEN_DEFAULT;
        var compatible = document.querySelector('input[name="goldhen"][value="' + value + '"]');
        if (compatible) compatible.checked = true;
    }""")
    update('includes/js/HENs.js', 'function loadGoldHENVer() {', """function loadGoldHENVer() {
    if (getPs4FwVersion() === '14.02') {
        storage.set('GHVer', GOLDHEN_DEFAULT);
        var selected = storage.session.getString('payload_path', null);
        if (!selected || selected.indexOf(HEN_BASE_PATH) === 0) chooseHEN();
    }""")
    update('includes/js/HENs.js', 'function loadJbFlavor() {', """function loadJbFlavor() {
    if (getPs4FwVersion() === '14.02' && user.currentJbFlavor === 'nexHEN') {
        user.currentJbFlavor = 'GoldHEN'; storage.set('jailbreakFlavor', 'GoldHEN');
    }""")
    update('includes/js/HENs.js', 'fwNum > 14.00 || fwNum < 5.05', 'fwNum > 14.02 || fwNum < 5.05')
    update('includes/js/HENs.js', 'var hidenexHEN = !isFirmwareSupported(fwNum);',
           'var hidenexHEN = !isFirmwareSupported(fwNum) || fwNum === 14.02;')
    update('includes/js/HENs.js', 'fwNum > commonMax && fwNum != 4.55',
           'fwNum > commonMax && fwNum !== 14.02 && fwNum != 4.55')
    update('includes/js/HENs.js', "if (!fw || !isFirmwareSupported(fw)) {", "if (!fw || !isFirmwareSupported(fw) || fw === '14.02') {")
    update('includes/js/checkFw.js', "if (user.ps4Fw == 14.00) major = '1400';",
           "if (user.ps4Fw == 14.00) major = '1400';\n            if (user.ps4Fw == 14.02) major = '1400';")
    update('index.html', '<option value="14.00">14.00</option>',
           '<option value="14.00">14.00</option>\n                                <option value="14.02">14.02</option>')
    update('index.html', '<p id="fw1400">14.00</p>', '<p id="fw1400">14.00 / 14.02</p>')
    cache = root / 'includes/caches'
    (cache / 'cache1402.html').write_text((cache / 'cache1400.html').read_text().replace('1400.manifest', '1402.manifest'), encoding='utf-8')
    text = (cache / 'manifest/1400.manifest').read_text(encoding='utf-8')
    text = text.replace('src/slopkit-afterglow/', 'src/slopkit-afterglow-1402/').replace('src/kpatches/1400.bin', 'src/kpatches/1402.bin')
    extra = ['../../../includes/payloads/HEN/goldhen_v2.4b18.13_fw1402.bin',
             '../../../includes/payloads/HEN/PS4HEN_fw1402.bin', '../../../firmware-1402.json',
             '../../../includes/licenses/fw1402/Afterglow-LICENSE']
    (cache / 'manifest/1402.manifest').write_text(text.replace('CACHE:', 'CACHE:\n' + '\n'.join(extra), 1), encoding='utf-8')

    # Fail the build if the add-on changes any styling or unrelated markup.
    html = (root / 'index.html').read_text(encoding='utf-8')
    html = html.replace('\n                                <option value="14.02">14.02</option>', '')
    html = html.replace('<p id="fw1400">14.00 / 14.02</p>', '<p id="fw1400">14.00</p>')
    if html != original_html:
        raise ValueError('14.02 add-on changed unrelated host markup')
    current_css = {p.relative_to(root).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
                   for p in (root / 'includes/css').rglob('*.css')}
    if current_css != original_css:
        raise ValueError('14.02 add-on changed host styling')
