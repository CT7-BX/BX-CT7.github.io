/* BX-HEN 0.1 - read-only browser diagnostics, PS4 FW 13.53 target.
 * This is not a jailbreak, a GoldHEN replacement, or proof that HEN is active.
 * No kernel access, payload sending, runtime patching or network requests.
 * ECMAScript 5 syntax for the legacy PS4 browser. */
(function () {
  'use strict';
  var VERSION = 'BX-HEN 0.1.0';
  function byId(id) { return document.getElementById(id); }
  function add(parent, tag, value, className) {
    var item = document.createElement(tag);
    if (typeof value === 'string') item.textContent = value;
    if (className) item.className = className;
    parent.appendChild(item);
    return item;
  }
  function detect(ua) {
    var info = { isPS4: false, detected: false, target: false, firmware: null };
    if (typeof ua !== 'string') return info;
    var marker = 'PlayStation 4';
    var i = ua.indexOf(marker);
    if (i < 0) return info;
    info.isPS4 = true;
    var remainder = ua.substring(i + marker.length);
    var match = remainder.match(/^[\/ ]([0-9]{1,2})\.([0-9]{1,2})(?=$|[); \/])/);
    if (!match) return info;
    var major = Number(match[1]), minor = Number(match[2]);
    info.firmware = major + '.' + ('0' + minor).slice(-2);
    info.detected = true;
    info.target = major === 13 && minor === 53;
    return info;
  }
  function report() {
    var f = detect(navigator.userAgent || '');
    var lines = [
      ['Módulo', VERSION],
      ['Execução', 'Diagnóstico do navegador (somente leitura)'],
      ['Plataforma', f.isPS4 ? 'PlayStation 4' : 'Navegador externo'],
      ['Firmware identificado', f.detected ? f.firmware : 'Não identificado'],
      ['Alvo 13.53', f.target ? 'Identificado' : 'Não confirmado'],
      ['Suporte a jailbreak', 'Não implementado no BX-HEN 0.1'],
      ['GoldHEN ativo', 'Não verificável por este módulo']
    ];
    return lines;
  }
  function refresh() {
    var table = byId('bx-hen-results');
    if (!table) return;
    while (table.firstChild) table.removeChild(table.firstChild);
    var rows = report();
    for (var i = 0; i < rows.length; i++) {
      var row = add(table, 'div', null, 'bx-hen-row');
      add(row, 'span', rows[i][0]);
      add(row, 'strong', rows[i][1]);
    }
  }
  function close() {
    var element = byId('bx-hen-overlay');
    if (element) element.style.display = 'none';
  }
  function open() {
    var element = byId('bx-hen-overlay');
    if (!element) return;
    refresh();
    element.style.display = 'flex';
  }
  function create() {
    if (byId('bx-hen-overlay') || !document.body) return;
    var overlay = add(document.body, 'div', null, 'bx-hen-overlay');
    overlay.id = 'bx-hen-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'BX-HEN diagnóstico experimental');
    var panel = add(overlay, 'section', null, 'bx-hen-panel');
    var heading = add(panel, 'div', null, 'bx-hen-head');
    add(heading, 'h2', 'BX-HEN 0.1 — Experimental');
    var exit = add(heading, 'button', 'Fechar');
    exit.type = 'button';
    exit.onclick = close;
    add(panel, 'p', 'Módulo de diagnóstico do PS4 13.53. Não instala nem inicia um desbloqueio e não substitui o GoldHEN.', 'bx-hen-explain');
    var results = add(panel, 'div');
    results.id = 'bx-hen-results';
    var footer = add(panel, 'div', null, 'bx-hen-actions');
    var refreshButton = add(footer, 'button', 'Atualizar diagnóstico');
    refreshButton.type = 'button';
    refreshButton.onclick = refresh;
    var docs = add(footer, 'a', 'Consultar código-fonte do BX-HEN');
    docs.href = 'https://github.com/CT7-BX/BX-CT7.github.io/tree/bx-hen-01353/bx-hen';
    docs.target = '_blank';
    docs.rel = 'noopener noreferrer';
    overlay.onclick = function(e) { if (e.target === overlay) close(); };
    var settings = byId('settings-popup');
    if (settings) {
      var button = document.createElement('button');
      button.type = 'button';
      button.id = 'bx-hen-settings-button';
      button.textContent = 'BX-HEN 0.1 — diagnóstico experimental';
      button.onclick = open;
      var dev = byId('bx-dev-button');
      if (dev && dev.parentNode === settings) settings.insertBefore(button, dev.nextSibling);
      else settings.insertBefore(button, settings.firstChild);
    }
  }
  window.bxHen01 = { detect: detect, getReport: report, open: open, close: close };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', create, false);
  } else create();
})();