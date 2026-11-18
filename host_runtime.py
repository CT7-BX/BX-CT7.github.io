"""Assemble one authoritative host runtime; protected kernels/payloads stay untouched."""
import hashlib
import json
import posixpath
import re


def assemble_host(root, source):
    revision = json.loads((root/'release.json').read_text())['revision']
    styles_before = {p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*.css')}
    def appearance(text):
        text = re.sub(r'<script\b[^>]*>[\s\S]*?</script>', '', text, flags=re.I)
        text = re.sub(r' data-bx-(?:cache|host)-revision="[^"]*"', '', text)
        return re.sub(r'>\s+<','><',text).strip()
    pages_before = {p.relative_to(root).as_posix():appearance(p.read_text()) for p in root.rglob('*.html')}
    copies = {'cache-entry.js':'cache.js', 'cache-bridge.js':'iframe_cache.js',
              'cache-status.js':'cache-status.js', 'host-return.js':'host-return.js', 'host-intent.js':'host-intent.js'}
    for origin, target in copies.items():
        (root/'includes/js'/target).write_bytes((source/origin).read_bytes())
    (root/'includes/js/deliverPayload.js').write_text((source/'payload-transport.js').read_text() + '\n' + (source/'payload-loader.js').read_text())
    settings = '''function loadSettings() {
  if (window.bxHostSettingsPromise) return window.bxHostSettingsPromise;
  window.bxHostSettingsPromise = window.bxHostRuntime.prepare(function () {
    CheckFW(); loadJbFlavor();
    return initLanguage().then(function () {
      loadTheme(); loadLayout();
      renderPayloads(payloadsList); loadAdvancedPayloads(); loadLastTab();
      loadGoldHENVer(); getReloadAfterJb(); updateBareboneJB(); loadExploitChain();
    });
  }).then(function (ready) { if (ready) autoJailbreak(); return ready; });
  return window.bxHostSettingsPromise;
}

'''
    for name in ('jailbreak.js','jailbreak-legacy.js'):
        path = root/'includes/js'/name
        text = path.read_text()
        start_marker = 'async function loadSettings() {' if name == 'jailbreak.js' else 'function loadSettings() {'
        end_marker = 'async function ipGuess() {' if name == 'jailbreak.js' else 'function ipGuess() {'
        start = text.index(start_marker); end = text.index(end_marker,start)
        text = text[:start]+settings+text[end:]
        old = 'window.location.href = testModeUrl("./exploit.html");'
        new = ('if (!window.bxCreateHostIntent()) throw Error("Não foi possível preparar a página mínima nesta sessão."); '
               'var bxHostTarget = testModeUrl("./exploit.html"); '
               'window.location.href = bxHostTarget + (bxHostTarget.indexOf("?") < 0 ? "?" : "&") + "bxHostRevision=' + revision + '";')
        if text.count(old) != 1: raise ValueError('Minimal host navigation changed')
        path.write_text(text.replace(old,new,1))
    minimal = root/'exploit.html'
    text = minimal.read_text()
    start = text.index('    window.onload = function () {')
    end = text.index('    };',start) + len('    };')
    text = text[:start] + """    window.onload = function () {
      var armed = window.bxHostMinimalArmed === true;
      if (!armed) { window.location.replace(mainPage); return; }
      user.ip = '127.0.0.1';
      window.bxHostRuntime.prepare(function () {
        if (!isFirmwareSupported(getPs4FwVersion()) || typeof EXPLOIT_HANDLERS[exploitChain] !== 'function') throw Error('Cadeia incompatível com o firmware.');
      }).then(function (ready) {
        if (ready) window.bxHostRuntime.run(function () { updateJbStats(1,0); return EXPLOIT_HANDLERS[exploitChain](); });
      });
    };""" + text[end:]
    if text.count('</body>') != 1: raise ValueError('Minimal page root changed')
    text = text.replace('    // Redirect if accessed directly', '    window.bxHostMinimalArmed = window.bxConsumeHostIntent();\n    // Redirect if accessed directly',1)
    text = text.replace('if (exploitChain === EXPLOIT_CHAINS.BADHOIST)', 'if (window.bxHostMinimalArmed && exploitChain === EXPLOIT_CHAINS.BADHOIST)',1)
    minimal.write_text(text.replace('</body>', '<script src="./includes/js/host-return.js"></script>\n</body>',1))
    main = root/'index.html'
    text = main.read_text()
    if text.count('</body>') != 1: raise ValueError('Main page root changed')
    main.write_text(text.replace('</body>', '<script src="./includes/js/host-return.js"></script>\n</body>',1))
    for page in [root/'cache.html'] + list((root/'includes/caches').glob('cache*.html')):
        text = page.read_text()
        text, count = re.subn(r'<html\b', '<html data-bx-cache-revision="'+revision+'"', text, count=1)
        if count != 1: raise ValueError('Missing cache root: '+str(page))
        page.write_text(text)
    events = root/'includes/js/events.js'
    text = events.read_text()
    old = "window.location.href = testModeUrl('./cache.html');"
    new = "var target = testModeUrl('./cache.html');\n    window.location.href = target + (target.indexOf('?') < 0 ? '?' : '&') + 'bxCacheRequest=' + new Date().getTime();"
    if text.count(old) != 1: raise ValueError('Cache navigation handler changed')
    events.write_text(text.replace(old,new,1))
    utility = root/'includes/js/utilities.js'
    text = utility.read_text()
    old = "        setTimeout(function () { window.location.href = mainPage; }, 5000);"
    if text.count(old) != 1: raise ValueError('Host success navigation changed')
    text = text.replace(old, '        // The host coordinator owns the single cancellable return timer.',1)
    start = text.index('function getScript('); end = text.index('function isHttps()',start)
    utility.write_text(text[:start] + (source/'script-loader.js').read_text() + '\n' + text[end:])
    # Bind each critical host resource to its content, avoiding mixed HTTP/AppCache generations.
    names = ['host-intent.js','utilities.js','jailbreak.js','jailbreak-legacy.js','deliverPayload.js','host-return.js',
             'cache.js','cache-status.js','iframe_cache.js','site-status.js','events.js']
    references = {}
    for name in names:
        path = 'includes/js/'+name
        references[path] = path+'?bxv='+hashlib.sha256((root/path).read_bytes()).hexdigest()[:16]
    for page in root.rglob('*.html'):
        text = page.read_text()
        if page in (root/'index.html', root/'exploit.html'):
            text = re.sub(r'<html\b', '<html data-bx-host-revision="'+revision+'"',text,count=1)
            if text.count('</head>') != 1: raise ValueError('Missing host head')
            text = text.replace('</head>', '<script src="./includes/js/host-intent.js"></script>\n</head>',1)
        # src values, plus the two known paths used by the native/legacy dispatcher.
        for path, ref in references.items():
            relative = posixpath.relpath(path,page.parent.relative_to(root).as_posix())
            for value in (relative, './'+relative):
                text = text.replace('src="'+value+'"','src="'+value+'?bxv='+ref.split('=')[-1]+'"')
            if page in (root/'index.html',root/'exploit.html') and path.endswith(('jailbreak.js','jailbreak-legacy.js')):
                text = text.replace("'./"+path+"'", "'./"+ref+"'")
        page.write_text(text)
    for manifest in (root/'includes/caches/manifest').glob('*.manifest'):
        text = manifest.read_text()
        text = text.replace('CACHE:', 'CACHE:\n../../../includes/js/host-intent.js\n../../../includes/js/host-return.js',1)
        text = text.replace('../../../exploit.html\n','../../../exploit.html?bxHostRevision='+revision+'\n')
        for path, ref in references.items():
            text = text.replace('../../../'+path+'\n','../../../'+ref+'\n')
        manifest.write_text(text)
    if styles_before != {p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*.css')}: raise ValueError('Runtime rebuild changed styles')
    if pages_before != {p.relative_to(root).as_posix():appearance(p.read_text()) for p in root.rglob('*.html')}: raise ValueError('Runtime rebuild changed visible markup')
    (root/'host-runtime.json').write_text(json.dumps({'schema_version':2,'revision':revision,
        'cache_protocol':2,'static_markup_and_styles_preserved':True,'physical_ps4_tested':False,'host_assets':references},indent=2)+'\n')
    for manifest in (root/'includes/caches/manifest').glob('*.manifest'):
        text = manifest.read_text()
        manifest.write_text(text.replace('CACHE:', 'CACHE:\n../../../host-runtime.json',1))
