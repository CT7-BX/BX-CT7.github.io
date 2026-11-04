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

# Dois layouts BX-CT7, escolhidos pelo seletor nativo setLayout().
# Permanecem disponíveis o Padrão e o Compacto do WebKitty.
update('index.html',
       '<input type="radio" name="theme" value="compact" onchange="setLayout(this.value);">',
       '<input type="radio" name="theme" value="compact" onchange="setLayout(this.value);">')
update('index.html',
       '                        <p id="compactTheme">Compact</p>\n                    </label>',
       '''                        <p id="compactTheme">Compact</p>
                    </label>
                    <label class="flex items-center text-white/80">
                        <input type="radio" name="theme" value="neon" onchange="setLayout(this.value);">
                        <p>Neon BX-CT7</p>
                    </label>
                    <label class="flex items-center text-white/80">
                        <input type="radio" name="theme" value="painel" onchange="setLayout(this.value);">
                        <p>Painel BX-CT7</p>
                    </label>''')

# Launcher shells use the actual existing click handlers, not mock buttons.
# Two wholly different layouts are provided by their respective CSS files.
# Duas interfaces distintas, ocultas em Padrão/Compacto via CSS global.
# Os botões chamam as funções já presentes no WebKitty.
launcher_intro = '''<div id="bx-neon-launcher" class="bx-launcher-only">
  <nav class="bx-neon-rail" aria-label="Menu lateral Neon">
    <div class="bx-neon-logo">BX<span>CT7</span><small>COMMAND CENTER</small></div>
    <button onclick="ui.exploitScreen.scrollIntoView({block:'start'});">▦ <span>Biblioteca</span></button>
    <button onclick="themePopup();">◈ <span>Aparência</span></button>
    <button onclick="settingsPopup();">⚙ <span>Ajustes</span></button>
    <button onclick="aboutPopup();">ⓘ <span>Informações</span></button>
    <button class="bx-neon-cache" onclick="document.getElementById('updateCache').click();">⟳ <span>Atualizar cache</span></button>
  </nav>
  <div class="bx-neon-stage">
    <div class="bx-neon-header"><span class="bx-neon-dot"></span> PS4 HOST SYSTEM <em>EDIÇÃO 2.2</em></div>
    <div class="bx-neon-content">
      <div class="bx-neon-kicker">CENTRO DE COMANDO / BX-CT7</div>
      <h1>CONTROLE<br><b>TOTAL.</b></h1>
      <p>Ferramentas, ajustes e biblioteca numa central construída para o seu console.</p>
      <div class="bx-neon-buttons">
        <button class="bx-neon-primary" onclick="document.getElementById('ps-logo-container').click();">▶ INICIAR HOST</button>
        <button onclick="ui.exploitScreen.scrollIntoView({block:'start'});">ABRIR BIBLIOTECA ↗</button>
      </div>
    </div>
    <div class="bx-neon-bottom"><span>● PS4 WEB HOST</span><span>BX-CT7 / 2026</span></div>
  </div>
</div>
<div id="bx-painel-launcher" class="bx-launcher-only">
  <div class="bx-painel-top"><strong>◉ BX-CT7</strong><span>PS4 LAUNCHER <b>2.2</b></span>
    <button onclick="themePopup();">PERSONALIZAR ⚙</button></div>
  <div class="bx-painel-feature">
    <div class="bx-painel-feature-copy">
      <div class="bx-painel-kicker">ÁREA PRINCIPAL / HOST</div>
      <h1>PRONTO<br>PARA JOGAR.</h1>
      <p>Seu espaço de ferramentas para PlayStation 4.</p>
      <button onclick="document.getElementById('ps-logo-container').click();">▶ INICIAR</button>
    </div>
    <div class="bx-painel-symbol" aria-hidden="true">PS4</div>
  </div>
  <div class="bx-painel-sectiontitle">ACESSO RÁPIDO <span>ESCOLHA UMA ÁREA</span></div>
  <div class="bx-painel-tiles">
    <button onclick="ui.exploitScreen.scrollIntoView({block:'start'});"><span>01</span><strong>▦ Ferramentas</strong><small>Ferramentas e homebrew</small></button>
    <button onclick="settingsPopup();"><span>02</span><strong>⚙ Sistema</strong><small>Configurações</small></button>
    <button onclick="themePopup();"><span>03</span><strong>◈ Temas</strong><small>Alterar visual</small></button>
    <button onclick="aboutPopup();"><span>04</span><strong>ⓘ Sobre</strong><small>Projeto e créditos</small></button>
  </div>
  <div class="bx-painel-footer"><span>BX-CT7 • CONSOLE DASHBOARD</span>
    <button onclick="document.getElementById('updateCache').click();">⟳ CACHE</button></div>
</div>'''
update('index.html', '            <!-- Header Buttons -->',
       '            ' + launcher_intro + '\n            <!-- Header Buttons -->')
# The upstream placeholder '-' has no meaning; CheckFW supplies real status on a PS4.
update('index.html', '<p id="PS4FW" class="text-white/70 text-lg mt-4 mb-6">-</p>',
       '<p id="PS4FW" class="text-white/70 text-lg mt-4 mb-6"></p>')

update('index.html', '<title>WebKitty</title>', '<title>BX-CT7 PS4 HOST</title>')
update('index.html', '<html lang="en">', '<html lang="pt-BR">')
# Versão da edição personalizada BX-CT7; código-base continua WebKitty 2.0.
update('index.html', '<p>Version: 2.0</p>',
       '<p>Version: 2.2</p>')
# Creditar a personalização sem apagar o reconhecimento aos autores upstream.
update('index.html', '<h3 class="text-l font-bold mt-4 mb-2" id="creditsHeader">Credits</h3>',
       '<h3 class="text-l font-bold mt-4 mb-2" id="creditsHeader">Credits</h3>'
       '<div class="mb-3 rounded-lg border border-white/20 p-3 text-center">'
       '<a href="https://github.com/CT7-BX" target="_blank" rel="noopener noreferrer" '
       'class="font-bold text-white">🇧🇷 BX-CT7</a>'
       '<p class="text-sm text-white/70">Personalização e edição BX-CT7</p>'
       '</div>')

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

# A troca entre layouts deve controlar os dois launchers também em caches
# ou navegadores legados. Não depender exclusivamente da ordem dos CSS.
update('includes/js/design.js', 'function setLayout(theme) {',
       '''function bxApplyLauncherVisibility(theme) {
    var neon = document.getElementById('bx-neon-launcher');
    var painel = document.getElementById('bx-painel-launcher');
    if (document.body) document.body.setAttribute('data-bx-layout', theme);
    if (neon) neon.style.setProperty('display', theme === 'neon' ? 'flex' : 'none', 'important');
    if (painel) painel.style.setProperty('display', theme === 'painel' ? 'flex' : 'none', 'important');
}
function setLayout(theme) {''')
update('includes/js/design.js', "storage.set('theme', theme);",
       "storage.set('theme', theme);\n        bxApplyLauncherVisibility(theme);")
update('includes/js/design.js',
       "    if (radioElement) {\n        radioElement.checked = true;\n    }\n}\n\nfunction loadTheme()",
       "    if (radioElement) {\n        radioElement.checked = true;\n    }\n    bxApplyLauncherVisibility(savedTheme);\n}\n\nfunction loadTheme()")

# Opções experimentais: mostrar controles em firmwares reconhecidos.
# Não ampliar a lista de firmwares nem alterar payloads ou exploit chains.
update('index.html', '<li class="hidden flex-1 advancedPayloadsTab"',
       '<li class="flex-1 advancedPayloadsTab"')
update('index.html', '<li class="hidden flex-1" id="customPayloadsTab"',
       '<li class="flex-1" id="customPayloadsTab"')
update('index.html', '                loadSettings();',
       '''                loadSettings();
                if (typeof setAdvancedPayloads === 'function') {
                    setAdvancedPayloads(true);
                }''')
update('includes/js/initial.js',
       "advancedPayloads: storage.getBoolean('advancedPayloads', false),",
       "advancedPayloads: storage.getBoolean('advancedPayloads', true),")
update('includes/js/checkFw.js',
       "'click-to-start-text', 'chooseGoldHEN', 'advancedPayloads', 'chooseExploitChain', 'reloadAfterJb',",
       "'click-to-start-text', 'chooseGoldHEN', 'chooseExploitChain', 'reloadAfterJb',")
update('includes/js/checkFw.js',
       "var toRemove = ['exploit-main-screen', 'scrollDown', 'advancedPayloads'];",
       "var toRemove = ['exploit-main-screen', 'scrollDown'];")
update('includes/js/checkFw.js',
       "var toRemove2 = ['exploit-main-screen', 'scrollDown', 'advancedPayloads', 'custom-tab'];",
       "var toRemove2 = ['exploit-main-screen', 'scrollDown', 'custom-tab'];")

# nexHEN aparece quando a cadeia do próprio WebKitty é reconhecida.
# Evitar prometer funcionamento do HEN com base apenas nesse reconhecimento.
update('includes/js/HENs.js',
       'var hidenexHEN = !devMode;',
       'var hidenexHEN = !isFirmwareSupported(fwNum);')
update('includes/js/HENs.js',
       "function saveJbFlavor(name, value) {\n    storage.set('jailbreakFlavor', value);",
       """function saveJbFlavor(name, value) {
    if (value === 'nexHEN') {
        var fw = getPs4FwVersion();
        if (!fw || !isFirmwareSupported(fw)) {
            alert('nexHEN experimental: o host não reconhece uma cadeia compatível neste firmware.');
            loadJbFlavor();
            return;
        }
        if (!confirm('O nexHEN é experimental; firmware reconhecido não comprova suporte do HEN. Deseja selecioná-lo?')) {
            loadJbFlavor();
            return;
        }
    }
    storage.set('jailbreakFlavor', value);""")

# Existing compatibility checks are preserved.
for f in source.iterdir():
    if f.is_file():
        target = root / 'includes/css' / f.name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(f, target)

# Cada layout é um CSS integral, não depende de importações em navegadores antigos.
for layout in ('neon', 'painel'):
    layout_source = source / 'layouts' / (layout + '.css')
    if not layout_source.is_file():
        raise RuntimeError('Layout BX-CT7 ausente: ' + layout)
    layout_target = root / 'includes/css/layouts' / (layout + '.css')
    layout_target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(layout_source, layout_target)

for manifest in (root / 'includes/caches/manifest').glob('*.manifest'):
    txt = manifest.read_text(encoding='utf-8')
    for asset in [
        '../../../includes/css/bx-ct7.css',
        '../../../includes/css/colors/ruby.css',
        '../../../includes/css/colors/brasil.css',
        '../../../includes/css/layouts/neon.css',
        '../../../includes/css/layouts/painel.css'
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
