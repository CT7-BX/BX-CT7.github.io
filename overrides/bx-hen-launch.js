/* BX-HEN v2.2 — RUOK999 launch presentation, ES5 / PS4 WebKit.
 * Display only. Native WebKitty click handlers remain the only start path.
 * Original firmware checks, HEN selection and jailbreak lifecycle are unchanged. */
(function () {
  'use strict';
  var panel = null;
  var ticker = null;
  var formerFocus = null;

  function byId(id) { return document.getElementById(id); }

  function createPanel() {
    if (panel || !document.body) return;
    panel = document.createElement('section');
    panel.id = 'bx-hen-neon';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'BX-HEN Neon - acompanhamento do host');
    panel.innerHTML =
      '<div class="bx-wrap">' +
        '<header class="bx-head">' +
          '<div><div class="bx-mark">BX-<b>HEN</b></div><span class="bx-ver">BX-HEN v2.2 / NEON</span></div>' +
          '<div class="bx-author">PERSONALIZACAO: <strong>RUOK999</strong></div>' +
          '<button type="button" class="bx-close" id="bx-hen-close" aria-label="Fechar o visual BX-HEN e voltar ao host">FECHAR X</button>' +
        '</header>' +
        '<div class="bx-stage">' +
          '<div class="bx-art">' +
            '<div class="bx-emblem" aria-hidden="true"></div>' +
            '<h2>BX-HEN</h2>' +
            '<p>V2.2 / VISUAL NEON<br>PERSONALIZACAO RUOK999</p>' +
          '</div>' +
          '<div class="bx-progress bx-border">' +
            '<p class="bx-kicker">CENTRAL DE ACOMPANHAMENTO / BX-HEN</p>' +
            '<h2>INICIANDO PELO HOST</h2>' +
            '<div class="bx-status" role="status" aria-live="polite">' +
              '<span class="bx-status-label">Estado informado pelo host</span>' +
              '<strong id="bx-hen-host-state">Aguardando retorno do host original...</strong>' +
            '</div>' +
            '<p class="bx-status-label">Ultima mensagem disponivel</p>' +
            '<div class="bx-log" id="bx-hen-host-log">Aguardando mensagens do host.</div>' +
            '<p class="bx-info">Este painel acompanha o processo original. Nao modifica verificacoes de firmware, selecao do HEN, payloads ou resultado do desbloqueio.</p>' +
            '<button type="button" id="bx-hen-console" class="bx-console">VER CONSOLE ORIGINAL</button>' +
          '</div>' +
        '</div>' +
        '<footer class="bx-footer"><span>BX-HEN v2.2 — INTERFACE VISUAL</span><span>DESIGN / PERSONALIZACAO: <strong>RUOK999</strong></span></footer>' +
      '</div>';
    document.body.appendChild(panel);
    byId('bx-hen-close').onclick = closePanel;
    byId('bx-hen-console').onclick = closePanel;
  }

  function nativeState() {
    var el = byId('state');
    var raw = el && (el.textContent || el.innerText) || '';
    raw = raw.replace(/^\s+|\s+$/g, '');
    if (!raw || /^(Exploit status|Status do exploit)$/i.test(raw)) {
      return 'Aguardando retorno do host original...';
    }
    return raw.slice(0, 250);
  }

  function nativeLog() {
    var el = byId('console');
    var raw = el && (el.textContent || el.innerText) || '';
    raw = raw.replace(/^\s+|\s+$/g, '');
    if (!raw || raw === '--') return 'Aguardando mensagens do host.';
    return raw.slice(-500);
  }

  function refresh() {
    if (!panel || panel.className.indexOf('bx-open') < 0) return;
    var state = byId('bx-hen-host-state');
    var log = byId('bx-hen-host-log');
    if (state) state.textContent = nativeState();
    if (log) log.textContent = nativeLog();
  }

  function openPanel() {
    createPanel();
    if (!panel) return;
    formerFocus = document.activeElement;
    panel.className = 'bx-open';
    refresh();
    if (ticker) window.clearInterval(ticker);
    ticker = window.setInterval(refresh, 800);
    var closeButton = byId('bx-hen-close');
    if (closeButton && typeof closeButton.focus === 'function') closeButton.focus();
  }

  function closePanel() {
    if (!panel) return;
    panel.className = '';
    if (ticker) window.clearInterval(ticker);
    ticker = null;
    if (formerFocus && typeof formerFocus.focus === 'function') formerFocus.focus();
    formerFocus = null;
  }

  function isOriginalGoldHen() {
    // The page owns HEN selection. Never turn another selection into GoldHEN.
    if (typeof user !== 'undefined' && user && user.currentJbFlavor) {
      return user.currentJbFlavor === 'GoldHEN';
    }
    return false;
  }

  function launchTarget(node) {
    while (node && node !== document) {
      if (node.id === 'exploitRun' || node.id === 'ps-logo-container') return true;
      node = node.parentNode;
    }
    return false;
  }

  function onNativeLaunch(event) {
    if (!launchTarget(event.target)) return;
    if (window.abortLoading) return;
    if (typeof user === 'undefined' || !user || user.blockJailbreak) return;
    if (!isOriginalGoldHen()) return;
    // No preventDefault, stopPropagation, jailbreak(), chooseHEN() or dispatchEvent:
    // the unmodified upstream click listener performs the actual launch.
    openPanel();
  }

  function init() {
    createPanel();
    document.addEventListener('click', onNativeLaunch, true);
    document.addEventListener('keydown', function (event) {
      if (event.keyCode === 27) closePanel();
    }, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, false);
  } else {
    init();
  }
})();
