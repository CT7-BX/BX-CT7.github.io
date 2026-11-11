"""Small, fail-closed HTML presentation changes; no loader or payload edits."""
import hashlib
import re


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
    # Sharing metadata must point to this host, while upstream credits stay intact.
    html = html.replace('content="WebKitty"', 'content="BX-CT7 PS4 HOST"')
    html = html.replace('http://webkitty.arabpixel.net/includes/assets/icons/webkitty.svg',
                        'https://ct7-bx.github.io/BX-CT7.github.io/includes/assets/icons/webkitty.svg')
    html = html.replace('content="http://webkitty.arabpixel.net"',
                        'content="https://ct7-bx.github.io/BX-CT7.github.io/"')
    return html


def stamp_manifests(root):
    """Invalidate AppCache on content changes, including builds without GITHUB_SHA."""
    manifests = sorted((root / 'includes/caches/manifest').glob('*.manifest'))
    digest = hashlib.sha256()
    for path in sorted(root.rglob('*')):
        if path.is_file() and path not in manifests:
            name = path.relative_to(root).as_posix().encode('utf-8')
            data = path.read_bytes()
            digest.update(len(name).to_bytes(8, 'big') + name)
            digest.update(len(data).to_bytes(8, 'big') + data)
    marker = '# BX-CT7 content: ' + digest.hexdigest()
    for path in manifests:
        text = re.sub(r'^# BX-CT7 content: [^\n]*\n?', '', path.read_text(encoding='utf-8'), flags=re.M)
        path.write_text(text.rstrip() + '\n' + marker + '\n', encoding='utf-8')
    return marker
