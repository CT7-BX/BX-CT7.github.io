#!/usr/bin/env python3
"""Conservative BX-CT7 branding/translation patch; never changes exploit internals."""
from pathlib import Path
import sys, re, shutil, hashlib, os

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

# Neon é o layout padrão. Compacto foi retirado do seletor; resta o Painel.
# A opção antiga "Default" não é exibida no seletor.
# Restaurar o layout nativo do WebKitty como opção independente.
# Seus temas de cor continuam sendo os arquivos originais, sem alterações.
update('index.html',
       '''                    <label class="flex items-center text-white/80">
                        <input type="radio" name="theme" value="index" onchange="setLayout(this.value);">
                        <p id="defaultTheme">Default</p>
                    </label>
''',
       '''                    <label class="flex items-center text-white/80">
                        <input type="radio" name="theme" value="index" onchange="setLayout(this.value);">
                        <p id="defaultTheme">Padrão (WebKitty original)</p>
                    </label>
''')
# Substituir a opção Compacto pelas duas opções de launcher.
update('index.html',
       '''                    <label class="flex items-center text-white/80">
                        <input type="radio" name="theme" value="compact" onchange="setLayout(this.value);">
                        <p id="compactTheme">Compact</p>
                    </label>''',
       '''                    <label class="flex items-center text-white/80">
                        <input type="radio" name="theme" value="neon" onchange="setLayout(this.value);">
                        <p>Default BX-CT7 (Neon)</p>
                    </label>
                    <label class="flex items-center text-white/80">
                        <input type="radio" name="theme" value="painel" onchange="setLayout(this.value);">
                        <p>Painel BX-CT7</p>
                    </label>''')

# Launcher shells use the actual existing click handlers, not mock buttons.
# Two wholly different layouts are provided by their respective CSS files.
# Duas interfaces distintas, ocultas em outros layouts via CSS global.
# Os botões chamam as funções já presentes no WebKitty.
launcher_intro = '''<div id="bx-neon-launcher" class="bx-launcher-only">
  <nav class="bx-neon-rail" aria-label="Menu lateral Neon">
    <div class="bx-neon-logo">BX<span>CT7</span><small>COMMAND CENTER</small></div>
    <button onclick="ui.exploitScreen.scrollIntoView({block:'start'});">▦ <span>Biblioteca</span></button>
    <button onclick="themePopup();">◈ <span>Aparência</span></button>
    <button onclick="settingsPopup();">⚙ <span>Ajustes</span></button>
    <button onclick="window.location.href='./bx-hen/';">⚡ <span>BX-HEN</span></button>
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
    <button onclick="window.location.href='./bx-hen/';"><span>05</span><strong>⚡ BX-HEN</strong><small>Painel experimental 0.2</small></button>
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

update('index.html', '</head>',
       '<link rel="stylesheet" href="./includes/css/bx-ct7.css">\n'
       '<link rel="stylesheet" href="./includes/css/bx-theme-bridge.css">\n</head>')
update('index.html', '<body class="bg-gray-900 text-white">',
       '<body class="bg-gray-900 text-white"><a class="bx-brand-top" href="https://github.com/CT7-BX" target="_blank" rel="noopener noreferrer">🇧🇷 BX-CT7</a>')
update('index.html', '<span class="text-base font-semibold text-white/90 select-none">nexHEN</span>',
       '<span class="text-base font-semibold text-white/90 select-none" title="Revisão upstream de 01/11/2026; compatibilidade do firmware 13.53 não confirmada">nexHEN (experimental · 01/11)</span>')
update('index.html', '<!-- Language options -->',
       '<!-- Language options --><label class="flex items-center text-white/80"><input type="radio" name="language" value="pt-br" class="ml-2" onchange="saveLanguage(this.value);"><p>🇧🇷 Português (Brasil)</p></label>')
# Migração: quem utilizava o Default antigo passa ao Neon; outras escolhas são preservadas.
update('index.html',
       "var savedTheme = localStorage.getItem('theme') || \"index\";",
       "var savedTheme = localStorage.getItem('theme') || 'neon';"
       " if (savedTheme === 'compact') { savedTheme = 'neon';"
       " try { localStorage.setItem('theme', 'neon'); } catch(e) {} }")
update('index.html', 'var savedColor = localStorage.getItem(\'color\') || "default";',
       'try { if (localStorage.getItem("bxCT7LanguageInitialized") !== "1") { localStorage.setItem("language","pt-br"); localStorage.setItem("bxCT7LanguageInitialized","1"); } } catch(e) {}\n        var savedColor = localStorage.getItem(\'color\') || "default";')
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
update('includes/js/design.js',
       "var savedTheme = storage.getString('theme', 'index');",
       "var savedTheme = storage.getString('theme', 'neon');"
       " if (savedTheme === 'compact') { savedTheme = 'neon'; storage.set('theme', 'neon'); }")
update('includes/js/design.js',
       "savedTheme = 'index';",
       "savedTheme = 'neon';")
update('includes/js/design.js',
       'radioElement = document.querySelector(\'input[name="theme"][value="index"]\');',
       'radioElement = document.querySelector(\'input[name="theme"][value="neon"]\');')
update('includes/js/design.js',
       "storage.set('theme', 'index');",
       "storage.set('theme', 'neon');")
update('includes/js/design.js', 'function setLayout(theme) {',
       '''function bxApplyLauncherVisibility(theme) {
    var neon = document.getElementById('bx-neon-launcher');
    var painel = document.getElementById('bx-painel-launcher');
    if (document.body) document.body.setAttribute('data-bx-layout', theme);
    if (neon) neon.style.setProperty('display', theme === 'neon' ? 'flex' : 'none', 'important');
    if (painel) painel.style.setProperty('display', theme === 'painel' ? 'flex' : 'none', 'important');
}
function setLayout(theme) {
    if (theme === 'compact') theme = 'neon';''')
update('includes/js/design.js', "storage.set('theme', theme);",
       "storage.set('theme', theme);\n        bxApplyLauncherVisibility(theme);")
# Sincronização de cor com CSS específico dos novos layouts.
update('includes/js/design.js', "storage.set('color', color);",
       "storage.set('color', color);\n        bxApplyColorTheme(color);")
update('includes/js/design.js', 'function setTheme(color) {',
       '''function bxApplyColorTheme(color) {
    if (document.body) document.body.setAttribute('data-bx-color', color);
}
function setTheme(color) {''')

update('includes/js/design.js',
       "    if (radioElement) {\n        radioElement.checked = true;\n    }\n}\n\nfunction loadTheme()",
       "    if (radioElement) {\n        radioElement.checked = true;\n    }\n    bxApplyLauncherVisibility(savedTheme);\n}\n\nfunction loadTheme()")

# A cor salva também precisa ser aplicada no carregamento inicial.
design_path = root / 'includes/js/design.js'
design_text = design_path.read_text(encoding='utf-8')
color_section = design_text.find('function loadTheme()')
if color_section < 0:
    raise RuntimeError('Função de tema original não encontrada')
head, tail = design_text[:color_section], design_text[color_section:]
old_tail = "    if (radioElement) {" + chr(10) + "        radioElement.checked = true;" + chr(10) + "    }" + chr(10) + "}"
if old_tail not in tail:
    raise RuntimeError('Marcador loadTheme não encontrado')
new_tail = "    if (radioElement) {" + chr(10) + "        radioElement.checked = true;" + chr(10) + "    }" + chr(10) + "    bxApplyColorTheme(savedColor);" + chr(10) + "}"
tail = tail.replace(old_tail, new_tail, 1)
design_path.write_text(head + tail, encoding='utf-8')

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

# Painel de diagnóstico: observa funções do host sem habilitar funções
# internas não documentadas do GoldHEN e sem contornar firmware.
update('index.html',
       '<h2 class="text-2xl font-bold mb-4">WebKitty settings</h2>',
       '<h2 class="text-2xl font-bold mb-4">WebKitty settings</h2>'
       '<button type="button" id="bx-dev-button" onclick="bxOpenDiagnostics()">'
       '⚙ Diagnóstico do Host / Desenvolvedor</button>')
update('index.html', '</body>',
       '<script src="./includes/js/dev-diagnostics.js"></script>\n</body>')
dev_src = source / 'dev-diagnostics.js'
dev_dest = root / 'includes/js/dev-diagnostics.js'
if not dev_src.is_file():
    raise RuntimeError('Diagnóstico BX-CT7 ausente')
shutil.copy2(dev_src, dev_dest)

# BX-HEN 0.1: diagnóstico de firmware independente e somente leitura.
# Não confundir com GoldHEN executável: não altera sistemas ou payloads.
bxhen_src = source / 'bx-hen-browser.js'
bxhen_target = root / 'includes/js/bx-hen-browser.js'
if not bxhen_src.is_file():
    raise RuntimeError('Módulo BX-HEN do navegador ausente')
shutil.copy2(bxhen_src, bxhen_target)
if not update('index.html', '</body>',
              '<script src="./includes/js/bx-hen-browser.js"></script>\n</body>'):
    raise RuntimeError('Não foi possível incluir BX-HEN no host')

# Publicar o painel BX-HEN em rota própria (sem interceptar jailbreak).
# HTML independente, sem bibliotecas externas ou conteúdo executável de kernel.
bx_site_src = source / 'bx-hen-site' / 'index.html'
bx_site_dest = root / 'bx-hen' / 'index.html'
if not bx_site_src.is_file():
    raise RuntimeError('Página BX-HEN não encontrada')
bx_site_dest.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(bx_site_src, bx_site_dest)
# BX-HEN Core: browser-side lifecycle, loaded before dashboard enhancements.
core_source = source / 'bx-hen-site' / 'core.js'
if not core_source.is_file():
    raise RuntimeError('BX-HEN Core ausente')
shutil.copy2(core_source, bx_site_dest.parent / 'core.js')
bx_page = bx_site_dest.read_text(encoding='utf-8')
if '</head>' not in bx_page:
    raise RuntimeError('BX-HEN HTML sem head')
bx_page = bx_page.replace('</head>', '<script src="./core.js"></script>\n</head>', 1)
bx_site_dest.write_text(bx_page, encoding='utf-8')

# Loja de PKGs: catálogo estático para URLs HTTPS autorizadas, sem instalador.
store_source = source / 'bx-hen-site' / 'store'
store_dest = bx_site_dest.parent / 'store'
store_dest.mkdir(parents=True, exist_ok=True)
for store_name in ('index.html', 'catalog.json'):
    store_file = store_source / store_name
    if not store_file.is_file():
        raise RuntimeError('Arquivo da loja BX-HEN ausente: ' + store_name)
    shutil.copy2(store_file, store_dest / store_name)

for extra_name in ('extras.css', 'extras.js', 'test-monitor.css', 'test-monitor.js', 'compatibility.css', 'compatibility.js'):
    extra_src = source / 'bx-hen-site' / extra_name
    if not extra_src.is_file():
        raise RuntimeError('Arquivo de interface BX-HEN ausente: ' + extra_name)
    shutil.copy2(extra_src, bx_site_dest.parent / extra_name)
if not update('index.html', '</body>',
              '<script>document.addEventListener("DOMContentLoaded",function(){var s=document.getElementById("settings-popup");if(!s||document.getElementById("bx-hen-dashboard-link"))return;var a=document.createElement("a");a.id="bx-hen-dashboard-link";a.href="./bx-hen/";a.textContent="⚡ Abrir painel BX-HEN completo";a.style.cssText="display:block;padding:13px;margin:8px 0 15px;background:#103b66;border:1px solid #36bfff;border-radius:8px;color:white;text-align:center;font-weight:bold;text-decoration:none";s.insertBefore(a,s.firstChild);});</script>\n</body>'):
    raise RuntimeError('Link BX-HEN para configurações não foi injetado')

# Acesso rápido à loja web pelo menu de configurações do host.
if not update('index.html', '</body>',
              '<script>document.addEventListener("DOMContentLoaded",function(){'
              'var p=document.getElementById("settings-popup");'
              'if(!p||document.getElementById("bx-ct7-store-link"))return;'
              'var a=document.createElement("a");a.id="bx-ct7-store-link";'
              'a.href="./bx-hen/store/";a.textContent="Loja BX-HEN - catálogo de PKGs";'
              'a.style.cssText="display:block;padding:12px;margin:8px 0 15px;background:#112c46;'
              'border:1px solid #2ea7c9;border-radius:8px;color:#fff;text-align:center;'
              'font-weight:bold;text-decoration:none";p.insertBefore(a,p.firstChild);'
              '});</script>\n</body>'):
    raise RuntimeError('Link da loja não foi adicionado ao host')

# Atalho externo para a área experimental, no rodapé do BX-Host principal.
# Não incorporar conteúdo protegido nem alterar os payloads.
if not update('index.html', '</body>',
              '<div id="bx-host-test-link" style="position:relative;z-index:10;'
              'margin:22px auto;padding:12px;text-align:center;max-width:650px;'
              'border:1px solid #286b98;border-radius:8px;background:#10283d;">'
              '<a href="https://bx-hen.4rt949zpj8.workers.dev/teste/" '
              'target="_blank" rel="noopener noreferrer" '
              'style="color:#b5eaff;text-decoration:underline;">'
              'BX-HEN — Área de testes experimental</a></div>\n</body>'):
    raise RuntimeError('Link da área de testes não foi adicionado ao BX-Host')

# Homebrew exibe projetos cadastrados, mas nunca os trata como payloads .bin.
homebrew_js_src = source / 'homebrew-catalog.js'
homebrew_js_dest = root / 'includes/js/homebrew-catalog.js'
if not homebrew_js_src.is_file():
    raise RuntimeError('Catálogo Homebrew BX-CT7 ausente')
shutil.copy2(homebrew_js_src, homebrew_js_dest)
if not update('includes/js/payloadsHandler.js',
              '\n}\n\nfunction loadAdvancedPayloads() {',
              '\n    if (firstCategory === "homebrew" && typeof window.bxRenderHomebrewCards === "function") {\n'
              '        window.bxRenderHomebrewCards(ui.homebrewSection);\n'
              '    }\n}\n\nfunction loadAdvancedPayloads() {'):
    raise RuntimeError('Não foi possível integrar a aba Homebrew')
if not update('index.html', '</body>',
              '<script src="./includes/js/homebrew-catalog.js"></script>\n</body>'):
    raise RuntimeError('Não foi possível carregar catálogo Homebrew')

# O botão nativo continua visualmente idêntico. Só no PS4 14.00
# redireciona para a página oficial do Afterglow, armazenada localmente.
# A detecção ocorre no navegador, sem forçar firmware ou alterar kernel.
update('index.html', '</body>',
       '<script src="./includes/js/afterglow-router.js"></script>\n</body>')
router_src = source / 'afterglow-router.js'
router_dest = root / 'includes/js/afterglow-router.js'
if not router_src.is_file():
    raise RuntimeError('Afterglow router ausente')
shutil.copy2(router_src, router_dest)

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

# Tela de atualização: usar o tema selecionado, sem trocar o layout
# nem modificar os scripts dos exploits.
cache_page = root / 'cache.html'
if cache_page.is_file():
    cache_text = cache_page.read_text(encoding='utf-8')
    cache_text = cache_text.replace('<html lang="en">', '<html lang="pt-BR">')
    cache_text = cache_text.replace('<title>WebKitty - Caching</title>',
                                    '<title>BX-CT7 — Atualizando cache</title>')
    cache_text = cache_text.replace('Caching WebKitty', 'Atualizando BX-CT7 PS4 Host')
    cache_text = cache_text.replace('Firmware-Based Caching System', 'Cache offline do PS4')
    cache_text = cache_text.replace('Preparing...', 'Preparando...')
    cache_text = cache_text.replace("Downloading... ", "Baixando... ")
    cache_text = cache_text.replace("Downloading... (", "Baixando... (")
    cache_text = cache_text.replace("' of '", "' de '")
    cache_text = cache_text.replace('Already cached! Redirecting...', 'Cache atualizado! Redirecionando...')
    cache_text = cache_text.replace('Done! Redirecting...', 'Concluído! Redirecionando...')
    cache_text = cache_text.replace('Checking cache...', 'Verificando cache...')
    cache_text = cache_text.replace('Caching files...', 'Salvando arquivos...')
    cache_text = cache_text.replace('Cache error: ', 'Erro no cache: ')
    cache_text = cache_text.replace('Unknown error', 'Erro desconhecido')
    cache_text = cache_text.replace('Starting cache for firmware ', 'Iniciando cache para firmware ')
    cache_text = cache_text.replace('<link rel="stylesheet" href="./includes/css/colors/default.css">',
                                    '<link id="bx-cache-color" rel="stylesheet" href="./includes/css/colors/default.css">')
    cache_text = cache_text.replace('<link rel="stylesheet" href="./includes/css/layouts/index.css">',
                                    '<link id="bx-cache-layout" rel="stylesheet" href="./includes/css/layouts/index.css">')
    cache_text = cache_text.replace('</head>', '''<script>
        (function(){
            try {
                var color = localStorage.getItem('color') || 'default';
                if (!/^(default|vibrant|catppuccino|ruby|brasil)$/.test(color)) color='default';
                var el = document.getElementById('bx-cache-color');
                if (el) el.href='./includes/css/colors/'+color+'.css';
            } catch(e) {}
        })();
    </script>
</head>''')
    cache_page.write_text(cache_text, encoding='utf-8')

bridge_src = source / 'bx-theme-bridge.css'
if not bridge_src.is_file():
    raise RuntimeError('Ponte de cores BX-CT7 ausente')
bridge_dest = root / 'includes/css/bx-theme-bridge.css'
shutil.copy2(bridge_src, bridge_dest)

for manifest in (root / 'includes/caches/manifest').glob('*.manifest'):
    txt = manifest.read_text(encoding='utf-8')
    for asset in [
        '../../../includes/css/bx-ct7.css',
        '../../../includes/css/bx-theme-bridge.css',
        '../../../includes/css/colors/ruby.css',
        '../../../includes/css/colors/brasil.css',
        '../../../includes/css/layouts/neon.css',
        '../../../includes/css/layouts/painel.css',
        '../../../includes/js/afterglow-router.js',
        '../../../includes/js/dev-diagnostics.js',
        '../../../includes/js/bx-hen-browser.js',
        '../../../includes/js/homebrew-catalog.js'
    ]:
        if asset not in txt and 'CACHE:' in txt:
            txt = txt.replace('CACHE:', 'CACHE:\n' + asset, 1)
    # AppCache will not refetch an unchanged manifest. Each Pages build gets
    # a revision marker so updated layout/JS assets reach the PS4.
    revision = os.environ.get('GITHUB_SHA', 'local-build')
    if not re.fullmatch(r'[0-9A-Za-z._-]{1,80}', revision):
        revision = 'local-build'
    txt += '\n# BX-CT7 release: ' + revision + '\n'
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
# Validate what is actually shipped, rather than treating a successful archive
# download as proof that customizations survived upstream changes.
out = index.read_text(encoding='utf-8')
checks = {
    'layout Padrão original': 'value="index" onchange="setLayout(this.value);"',
    'ponte de cores': 'bx-theme-bridge.css',
    'layout Neon': 'value="neon" onchange="setLayout(this.value);"',
    'layout Painel': 'value="painel" onchange="setLayout(this.value);"',
    'versão 2.2': 'Version: 2.2',
    'créditos BX-CT7': 'Personalização e edição BX-CT7',
    'roteador firmware 14.00': 'afterglow-router.js',
    'painel de diagnóstico': 'bx-dev-button',
    'módulo BX-HEN 0.1': 'bx-hen-browser.js',
    'link de entrada do BX-HEN': 'bx-hen/',
    'Homebrew BX-CT7': 'homebrew-catalog.js',
    'atalho loja no host': 'bx-ct7-store-link',
    'link de testes no rodapé do host': 'bx-host-test-link'
}
for desc, token in checks.items():
    if token not in out:
        raise RuntimeError('Verificação falhou: ' + desc)
for old in ('value="compact" onchange="setLayout(this.value);"',):
    if old in out:
        raise RuntimeError('Layout removido ainda aparece: ' + old)
for asset in ('includes/css/layouts/neon.css', 'includes/css/layouts/painel.css',
              'includes/js/afterglow-router.js', 'includes/js/dev-diagnostics.js',
              'includes/js/bx-hen-browser.js', 'includes/js/homebrew-catalog.js',
              'includes/css/bx-theme-bridge.css',
              'bx-hen/index.html', 'cache.html'):
    if not (root / asset).is_file():
        raise RuntimeError('Arquivo não encontrado: ' + asset)

bx_html = (root / 'bx-hen/index.html').read_text(encoding='utf-8')
for token in ('BX-HEN 0.2', 'id="diagnostics"', 'Não implementado', 'id="run-check"'):
    if token not in bx_html:
        raise RuntimeError('Página BX-HEN incompleta: ' + token)
for asset in ('extras.css', 'extras.js', 'test-monitor.css', 'test-monitor.js', 'compatibility.css', 'compatibility.js'):
    if './' + asset not in bx_html or not (root / 'bx-hen' / asset).is_file():
        raise RuntimeError('Recurso BX-HEN ausente da publicação: ' + asset)
for store_file in ('bx-hen/store/index.html', 'bx-hen/store/catalog.json'):
    if not (root / store_file).is_file():
        raise RuntimeError('Loja não publicada: ' + store_file)
handler_text = (root / 'includes/js/payloadsHandler.js').read_text(encoding='utf-8')
if 'window.bxRenderHomebrewCards(ui.homebrewSection)' not in handler_text:
    raise RuntimeError('Homebrew sem cartões BX-CT7')
print('BX-CT7: pacote personalizado e hashes confirmados.')


# Minimal single-page presentation: preserve original loader implementation.
# Keep former diagnostic route for old bookmarks, but forward visitors to the
# single main host page. No firmware or payload logic is modified.
minimal_source = source / 'minimal.css'
if not minimal_source.is_file():
    raise RuntimeError('Interface minimalista não encontrada')
minimal_target = root / 'includes/css/minimal.css'
shutil.copy2(minimal_source, minimal_target)
main_html = index.read_text(encoding='utf-8')
if '</head>' not in main_html:
    raise RuntimeError('Host sem head para interface minimalista')
main_html = main_html.replace(
    '</head>',
    '<link rel="stylesheet" href="./includes/css/minimal.css">\n</head>', 1)
# Existing browsers using Neon/Painel are migrated once to the same page.
minimal_boot = """<script>
(function(){
 try {
  if (localStorage.getItem('bx-minimal-v1') !== '1') {
   localStorage.setItem('theme','index');
   localStorage.setItem('color','default');
   localStorage.setItem('bx-minimal-v1','1');
  }
 } catch(e) {}
})();
</script>
"""
main_html = main_html.replace(
    '<script>\n        // Prevent "Theme Flash"',
    minimal_boot + '<script>\n        // Prevent "Theme Flash"', 1)
# The original settings, HEN selection and primary PS4 control remain intact.
# Remove redundant links to separate dashboard and experimental site.
main_html = main_html.replace('window.location.href=\'./bx-hen/\';',
                              'document.getElementById(\'ps-logo-container\').click();')
main_html = main_html.replace(
    '<script src="./includes/js/dev-diagnostics.js"></script>',
    '<script src="./includes/js/dev-diagnostics.js"></script>', 1)
index.write_text(main_html, encoding='utf-8')
# Legacy BX-HEN URL now leads to the one supported main interface.
legacy_dashboard = root / 'bx-hen/index.html'
if legacy_dashboard.is_file():
    legacy_html = legacy_dashboard.read_text(encoding='utf-8')
    legacy_html = legacy_html.replace(
        '</head>',
        '<script>window.location.replace("../");</script>\n</head>', 1)
    legacy_dashboard.write_text(legacy_html, encoding='utf-8')
# Cache manifest includes presentation CSS for offline PS4 use.
for manifest in (root / 'includes/caches/manifest').glob('*.manifest'):
    txt = manifest.read_text(encoding='utf-8')
    item = '../../../includes/css/minimal.css'
    if item not in txt and 'CACHE:' in txt:
        txt = txt.replace('CACHE:', 'CACHE:\n' + item, 1)
        manifest.write_text(txt, encoding='utf-8')
if 'includes/css/minimal.css' not in index.read_text(encoding='utf-8'):
    raise RuntimeError('Interface minimalista não integrada ao host')
from presentation import improve_html, ensure_hen_cache, stamp_manifests
index.write_text(improve_html(index.read_text(encoding='utf-8')), encoding='utf-8')
ensure_hen_cache(root)
stamp_manifests(root)
print('BX-CT7 Minimal: uma página principal, arquivos do HEN preservados.')
