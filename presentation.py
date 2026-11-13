"""Small, fail-closed HTML presentation changes; no loader or payload edits."""
import hashlib
import re
import json
import os
import subprocess


def add_release_status(root, source):
    """Publish revision metadata for automatic checks and explicit updates."""
    revision = os.environ.get('GITHUB_SHA', '')
    if not revision:
        try:
            revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=source.parent,
                                               text=True).strip()
        except (OSError, subprocess.CalledProcessError):
            revision = 'local-build'
    if not re.fullmatch(r'[a-f0-9]{40}|local-build', revision):
        raise ValueError('Invalid build revision')
    asset = root / 'includes/js/site-status.js'
    asset.write_bytes((source / 'site-status.js').read_bytes())
    index = root / 'index.html'
    html = index.read_text(encoding='utf-8')
    anchor = '<p id="PS4FW" class="text-white/70 text-lg mt-4 mb-6"></p>'
    if html.count(anchor) != 1 or html.count('</body>') != 1:
        raise ValueError('Status insertion point changed')
    panel = ('\n<div id="bx-site-status" data-revision="' + revision + '">'
             '<span id="bx-site-revision">Verificando atualização...</span>'
             '<span id="bx-site-network">Rede não informada</span>'
             '<button type="button" id="bx-site-check" hidden disabled style="display:none">Atualizar agora</button>'
             '<p id="bx-site-message" role="status" aria-live="polite" aria-atomic="true">'
             'Conferindo se existe uma nova versão do site.</p></div>')
    # Keep the original event target for the PS4 cache handler, out of the UI.
    old_button = '<button id="updateCache"'
    if html.count(old_button) != 1:
        raise ValueError('Original cache control changed')
    html = html.replace(old_button, old_button + ' hidden aria-hidden="true" tabindex="-1" style="display:none"', 1)
    html = html.replace(anchor, anchor + panel, 1)
    html = html.replace('</body>', '<script src="./includes/js/site-status.js"></script>\n</body>', 1)
    index.write_text(html, encoding='utf-8')
    (root / 'release.json').write_text(json.dumps({'schema_version': 1, 'revision': revision}) + '\n',
                                     encoding='utf-8')
    for path in (root / 'includes/caches/manifest').glob('*.manifest'):
        text = path.read_text(encoding='utf-8')
        if text.count('CACHE:') != 1:
            raise ValueError('Missing cache section')
        text = text.replace('CACHE:', 'CACHE:\n../../../includes/js/site-status.js', 1)
        path.write_text(text, encoding='utf-8')


def harden_preferences(html):
    """Storage failures and stale preferences must not abort early UI startup."""
    marker = '// Prevent "Theme Flash"'
    start = html.find(marker)
    end = html.find('</script>', start)
    if start == -1 or end == -1 or html.count(marker) != 1:
        raise ValueError('Early preference script changed')
    script = html[start:end]
    helper = """function bxReadPreference(key) {
            try { return localStorage.getItem(key); } catch (ignore) { return null; }
        }
        """
    script = script.replace('localStorage.getItem(', 'bxReadPreference(')
    anchor = '        if (savedTheme) {'
    if script.count(anchor) != 1:
        raise ValueError('Theme validation marker changed')
    script = script.replace(anchor, """        if (!/^(index|neon|painel)$/.test(savedTheme)) savedTheme = 'index';
        if (!/^(default|vibrant|catppuccino|ruby|brasil)$/.test(savedColor)) savedColor = 'default';
""" + anchor, 1)
    return html[:start] + helper + script + html[end:]


def improve_html(html):
    old = 'content="width=device-width, initial-scale=1.0, maximum-scale=1"'
    if html.count(old) != 1:
        raise ValueError('Viewport markup changed; review presentation patch')
    html = html.replace(old, 'content="width=device-width, initial-scale=1.0"')
    # Provide a stylesheet even when the early preference script cannot run.
    for key, path in [('main', 'layouts/index'), ('color', 'colors/default')]:
        old = 'id="' + key + '-stylesheet" href=""'
        if html.count(old) != 1:
            raise ValueError('Stylesheet markup changed: ' + key)
        html = html.replace(old, 'id="' + key + '-stylesheet" href="./includes/css/' + path + '.css"')
    labels = {'pslogo': 'Iniciar host PS4', 'scrollDown': 'Abrir ferramentas',
              'ps4IpInput': 'Endereço IP do PS4', 'ps4FwSelect': 'Firmware do PS4'}
    for key, label in labels.items():
        old = 'id="' + key + '"'
        if html.count(old) != 1:
            raise ValueError('Control markup changed: ' + key)
        html = html.replace(old, old + ' aria-label="' + label + '"')
    for handler, label in [('settingsPopup()', 'Configurações'), ('aboutPopup()', 'Sobre o host'),
                           ('themePopup()', 'Personalizar aparência')]:
        html = html.replace('<button onclick="' + handler + '"',
                            '<button aria-label="' + label + '" onclick="' + handler + '"')
    # Closing a popup must not be announced as opening its settings again.
    for label, target in [('Configurações', 'close-settings'), ('Sobre o host', 'close-about')]:
        pattern = r'(<button aria-label=")' + re.escape(label) + r'("[^>]*id="' + target + r'")'
        html = re.sub(pattern, lambda match: match[1] + 'Fechar' + match[2], html)
    # Sharing metadata must point to this host, while upstream credits stay intact.
    html = html.replace('content="WebKitty"', 'content="BX-CT7 PS4 HOST"')
    html = html.replace('http://webkitty.arabpixel.net/includes/assets/icons/webkitty.svg',
                        'https://ct7-bx.github.io/BX-CT7.github.io/includes/assets/icons/webkitty.svg')
    html = html.replace('content="http://webkitty.arabpixel.net"',
                        'content="https://ct7-bx.github.io/BX-CT7.github.io/"')
    return html


def ensure_hen_cache(root):
    """Cache the existing experimental HEN; never rewrite executable bytes."""
    assets = ('includes/payloads/HEN/nexHEN-ps4.elf',
              'includes/payloads/Bins/elfldr.bin', 'includes/payloads/Bins/elfldr.elf')
    for asset in assets:
        if not (root / asset).is_file():
            raise ValueError('Missing nexHEN dependency: ' + asset)
    manifests = list((root / 'includes/caches/manifest').glob('*.manifest'))
    if not manifests:
        raise ValueError('Missing offline manifests')
    for path in manifests:
        text = path.read_text(encoding='utf-8')
        if text.count('CACHE:') != 1:
            raise ValueError('Cache section changed: ' + path.name)
        cache_section = text.split('CACHE:', 1)[1].split('NETWORK:', 1)[0].split('FALLBACK:', 1)[0]
        missing = ['../../../' + asset for asset in assets
                   if '../../../' + asset not in cache_section.splitlines()]
        if missing:
            text = text.replace('CACHE:', 'CACHE:\n' + '\n'.join(missing), 1)
            path.write_text(text, encoding='utf-8')


def ensure_catalog_cache(root):
    """Make the existing local catalog usable with the host's offline cache."""
    assets = ('bx-hen/store/index.html', 'bx-hen/store/catalog.json')
    for asset in assets:
        if not (root / asset).is_file():
            raise ValueError('Missing catalog asset: ' + asset)
    for path in (root / 'includes/caches/manifest').glob('*.manifest'):
        text = path.read_text(encoding='utf-8')
        if text.count('CACHE:') != 1:
            raise ValueError('Cache section changed: ' + path.name)
        entries = text.split('CACHE:', 1)[1].split('NETWORK:', 1)[0].splitlines()
        missing = ['../../../' + asset for asset in assets if '../../../' + asset not in entries]
        if missing:
            path.write_text(text.replace('CACHE:', 'CACHE:\n' + '\n'.join(missing), 1), encoding='utf-8')


def stamp_manifests(root):
    """Invalidate AppCache on content changes, including builds without GITHUB_SHA."""
    manifests = sorted((root / 'includes/caches/manifest').glob('*.manifest'))
    digest = hashlib.sha256()
    for path in sorted(root.rglob('*')):
        if path.is_file() and path not in manifests:
            name = path.relative_to(root).as_posix().encode('utf-8')
            digest.update(len(name).to_bytes(8, 'big') + name)
            digest.update(path.stat().st_size.to_bytes(8, 'big'))
            with path.open('rb') as asset:
                for chunk in iter(lambda: asset.read(1024 * 1024), b''):
                    digest.update(chunk)
    marker = '# BX-CT7 content: ' + digest.hexdigest()
    for path in manifests:
        text = re.sub(r'^# BX-CT7 content: [^\n]*\n?', '', path.read_text(encoding='utf-8'), flags=re.M)
        path.write_text(text.rstrip() + '\n' + marker + '\n', encoding='utf-8')
    return marker
