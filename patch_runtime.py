#!/usr/bin/env python3
"""Conservative BX-CT7 branding/translation patch; never changes exploit internals."""
from pathlib import Path
import sys, re, shutil, hashlib

root = Path(sys.argv[1]).resolve()
source = Path(__file__).resolve().parent / 'overrides'

def update(path, old, new):
    file = root / path
    if not file.exists():
        print('Aviso: ausente', path)
        return False
    text = file.read_text(encoding='utf-8')
    if old not in text:
        print('Aviso: upstream mudou, marcador não encontrado:', path, repr(old[:48]))
        return False
    file.write_text(text.replace(old, new, 1), encoding='utf-8')
    return True

index = root / 'index.html'
if not index.exists():
    raise RuntimeError('WebKitty não contém index.html')

update('index.html', '<title>WebKitty</title>', '<title>BX-CT7 PS4 HOST</title>')
update('index.html', '<html lang="en">', '<html lang="pt-BR">')
update('index.html', '</head>', '<link rel="stylesheet" href="./includes/css/bx-ct7.css">\n</head>')
update('index.html', '<body class="bg-gray-900 text-white">',
       '<body class="bg-gray-900 text-white"><a class="bx-brand-top" href="https://github.com/CT7-BX" target="_blank" rel="noopener noreferrer">🇧🇷 BX-CT7</a>')
update('index.html', '<span class="text-base font-semibold text-white/90 select-none">nexHEN</span>',
       '<span class="text-base font-semibold text-white/90 select-none" title="Revisão upstream de 01/11/2026; compatibilidade do firmware 13.53 não confirmada">nexHEN (experimental · 01/11)</span>')
update('index.html', '<!-- Language options -->',
       '<!-- Language options --><label class="flex items-center text-white/80"><input type="radio" name="language" value="pt-br" class="ml-2" onchange="saveLanguage(this.value);"><p>🇧🇷 Português (Brasil)</p></label>')
update('index.html', 'var savedTheme = localStorage.getItem(\'theme\') || "index";',
       'try { if (localStorage.getItem(\'bxCT7LanguageInitialized\') !== "1") { localStorage.setItem("language","pt-br"); localStorage.setItem("bxCT7LanguageInitialized","1"); } } catch(e) {} var savedTheme = localStorage.getItem(\'theme\') || "index";')
update('includes/js/initial.js', 'var projectName = "WebKitty";',
       'var projectName = "BX-CT7 PS4 HOST";')
update('includes/js/initial.js', "currentLanguage: storage.getString('language', 'en'),",
       "currentLanguage: storage.getString('language', 'pt-br'),")

base_path = root / 'includes/css/colors/default.css'
if base_path.exists():
    base = base_path.read_text(encoding='utf-8')
    for name, replacements in {
        'ruby': {'#3b82f6': '#f43f5e', '#2563eb': '#e11d48',
                 '#1d4ed8': '#be123c', '#60a5fa': '#fb7185'},
        'brasil': {'#3b82f6': '#2f9b61', '#2563eb': '#1b7b4b',
                   '#1d4ed8': '#176d42', '#60a5fa': '#facc15'}
    }.items():
        css = base
        for before, after in replacements.items():
            css = css.replace(before, after).replace(before.upper(), after)
        (root / ('includes/css/colors/' + name + '.css')).write_text(css, encoding='utf-8')

    html = index.read_text(encoding='utf-8')
    anchor = re.search(
        r'<label class="flex items-center text-white/80">\s*'
        r'<input type="radio" name="colorTheme" value="vibrant"[^>]*>.*?</label>',
        html, re.S)
    if anchor:
        options = ''.join(
            '<label class="flex items-center text-white/80">'
            '<input type="radio" name="colorTheme" value="' + name +
            '" onchange="setTheme(this.value);"><p>' + label + '</p></label>'
            for name, label in [('ruby', 'Rubi BX-CT7'), ('brasil', 'Brasil')])
        html = html[:anchor.end()] + options + html[anchor.end():]
        index.write_text(html, encoding='utf-8')

# Existing compatibility checks are preserved.
for f in source.iterdir():
    if f.is_file():
        target = root / 'includes/css' / f.name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(f, target)

for manifest in (root / 'includes/caches/manifest').glob('*.manifest'):
    txt = manifest.read_text(encoding='utf-8')
    for asset in [
        '../../../includes/css/bx-ct7.css',
        '../../../includes/css/colors/ruby.css',
        '../../../includes/css/colors/brasil.css'
    ]:
        if asset not in txt and 'CACHE:' in txt:
            txt = txt.replace('CACHE:', 'CACHE:\n' + asset, 1)
    manifest.write_text(txt, encoding='utf-8')

def gitblob(data):
    return hashlib.sha1(('blob %d\0' % len(data)).encode() + data).hexdigest()

for path, sha in {
    'includes/payloads/HEN/nexHEN-ps4.elf':
        'e9675ca11fb9307bdbe3ddee563b9033592341ed',
    'includes/payloads/Bins/elfldr.elf':
        'd67e13a7f976f19c0249586431745df8ab371c28'
}.items():
    f = root / path
    if not f.is_file() or gitblob(f.read_bytes()) != sha:
        raise RuntimeError('Falha na verificação de integridade: ' + path)

if not (root / 'LICENSE').is_file():
    raise RuntimeError('Licença upstream ausente')
print('BX-CT7: pacote personalizado e hashes confirmados.')
