/* BX-HEN 0.2 - experimental diagnostics / UI, not a console jailbreak.
 * Read-only. ES5 for PS4 WebKit compatibility; no network access.
 * No GoldHEN replacement, kernel modification, exploit chain or payload loader. */
(function () {
  'use strict';
  var VERSION = 'BX-HEN 0.2.0';
  var SOURCE = 'https://github.com/CT7-BX/BX-CT7.github.io/tree/bx-hen-01353/bx-hen';
  function el(id) { return document.getElementById(id); }
  function append(parent, tag, value, className) {
    var x = document.createElement(tag);
    if (typeof value === 'string') x.textContent = value;
    if (className) x.className = className;
    parent.appendChild(x);
    return x;
  }
  function detect(ua) {
    var out = {isPS4:false, detected:false, target:false, firmware:null};
    if (typeof ua !== 'string') return out;
    var pos = ua.indexOf('PlayStation 4');
    if (pos < 0) return out;
    out.isPS4 = true;
    var text = ua.substring(pos + 'PlayStation 4'.length);
    var m = text.match(/^[\/ ]([0-9]{1,2})\.([0-9]{1,2})(?=$|[); \/])/);
    if (!m) return out;
    var major = Number(m[1]), minor = Number(m[2]);
    out.detected = true;
    out.firmware = major + '.' + ('0'+minor).slice(-2);
    out.target = major === 13 && minor === 53;
    return out;
  }
  function localStatus() {
    try {
      if (!window.localStorage) return 'Indisponível';
      var key = 'bx-hen-diagnostic-test';
      localStorage.setItem(key, '1');
      var pass = localStorage.getItem(key) === '1';
      localStorage.removeItem(key);
      return pass ? 'Operacional' : 'Falhou';
    } catch(e) {return 'Bloqueado pelo navegador';}
  }
  function report() {
    var f=detect(navigator.userAgent || '');
    return [
      ['Versão do módulo',VERSION],
      ['Plataforma',f.isPS4?'PS4':'Navegador externo'],
      ['Firmware informado pelo navegador',f.detected?f.firmware:'Não identificado'],
      ['Alvo 13.53',f.target?'Detectado (sem desbloqueio)':'Não detectado'],
      ['Dados locais',localStatus()],
      ['Cache offline',typeof window.applicationCache!=='undefined'?'API presente':'API indisponível'],
      ['JavaScript',typeof document.addEventListener==='function'?'Operacional':'Limitado'],
      ['BX-HEN ativo no kernel','Não implementado'],
      ['GoldHEN ativo no kernel','Não verificável por esta página']
    ];
  }
  function refresh() {
    var root=el('bx-hen-results');
    if (!root) return;
    while (root.firstChild) root.removeChild(root.firstChild);
    var rows=report();
    for (var i=0;i<rows.length;i++) {
      var row=append(root,'div',null,'bx-hen-row');
      append(row,'span',rows[i][0]);
      append(row,'strong',rows[i][1]);
    }
    var f=detect(navigator.userAgent || '');
    var status=el('bx-hen-fw-status');
    if (status) status.textContent=f.target ? 'Firmware 13.53 reconhecido' : (f.isPS4?'Firmware 13.53 não confirmado':'Modo demonstração: navegador externo');
    var when=el('bx-hen-scan-time');
    if (when) when.textContent='Diagnóstico atualizado: '+new Date().toLocaleTimeString();
  }
  function reportText() {
    var rows=report(), text=['BX-HEN 0.2 — diagnóstico de navegador (sem jailbreak)'];
    for (var i=0;i<rows.length;i++) text.push(rows[i][0]+': '+rows[i][1]);
    return text.join('\n');
  }
  function exportReport() {
    var text=reportText(), area=el('bx-hen-report');
    if (!area) return;
    area.style.display='block';
    area.value=text;
    area.focus();area.select();
    try {document.execCommand('copy');} catch(e){}
    var note=el('bx-hen-report-hint');
    if (note) note.textContent='Relatório selecionado. Use Copiar no navegador caso necessário.';
  }
  function close() { if (el('bx-hen-overlay')) el('bx-hen-overlay').style.display='none'; }
  function open() {
    if (!el('bx-hen-overlay')) return;
    refresh();
    el('bx-hen-overlay').style.display='flex';
  }
  function card(parent,title,subtitle,kind) {
    var item=append(parent,'div',null,'bx-hen-feature '+kind);
    append(item,'strong',title);
    append(item,'span',subtitle);
    return item;
  }
  function make() {
    if (el('bx-hen-overlay') || !document.body) return;
    var overlay=append(document.body,'div',null,'bx-hen-overlay');
    overlay.id='bx-hen-overlay';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-label','BX-HEN 0.2 painel de diagnóstico');
    var panel=append(overlay,'section',null,'bx-hen-panel');
    var head=append(panel,'div',null,'bx-hen-head');
    var logo=append(head,'div',null,'bx-hen-logo');
    logo.innerHTML='<svg viewBox="0 0 84 84" width="72" height="72" aria-label="Emblema BX-HEN" role="img"><path d="M42 4L72 17v21c0 18-12 32-30 41C24 70 12 56 12 38V17Z" fill="#0e2743" stroke="#38ddff" stroke-width="3"/><path d="M42 17L31 42h11l-6 24 21-32H45l9-17Z" fill="#61eaff"/><path d="M17 21L42 10l25 11" fill="none" stroke="#76f2ff" stroke-width="2" opacity=".8"/></svg>';
    var brand=append(head,'div',null,'bx-hen-brand');
    append(brand,'h2','BX-HEN 0.2');
    append(brand,'span','DIAGNÓSTICO • EXPERIMENTAL • PS4 13.53');
    var exit=append(head,'button','Fechar ✕');exit.type='button';exit.onclick=close;
    append(panel,'p','Esta é uma ferramenta experimental de diagnóstico; não desbloqueia o PS4, não executa payloads e não substitui o GoldHEN.','bx-hen-explain');
    var box=append(panel,'div',null,'bx-hen-status');
    append(box,'span','Estado do projeto');
    append(box,'strong','Módulo de diagnóstico implementado');
    var state=append(box,'small','');state.id='bx-hen-fw-status';
    append(panel,'h3','Funções existentes','bx-hen-section-title');
    var features=append(panel,'div',null,'bx-hen-features');
    card(features,'Identificação do console','Lê o User-Agent informado pelo navegador','ready');
    card(features,'Leitura de firmware','Reconhece versões expressas no User-Agent','ready');
    card(features,'Diagnóstico de navegador','Testa APIs básicas e armazenamento local','ready');
    card(features,'Relatório copiável','Resumo para compartilhar na depuração','ready');
    card(features,'Jailbreak e patches de kernel','Não disponíveis no BX-HEN 0.2','future');
    card(features,'Plugins, FTP e BinLoader','Não implementados no BX-HEN 0.2','future');
    append(panel,'h3','Detalhes do diagnóstico','bx-hen-section-title');
    var results=append(panel,'div');results.id='bx-hen-results';
    var updated=append(panel,'p',null,'bx-hen-timestamp');updated.id='bx-hen-scan-time';
    var actions=append(panel,'div',null,'bx-hen-actions');
    var scan=append(actions,'button','Atualizar diagnóstico');scan.type='button';scan.onclick=refresh;
    var copy=append(actions,'button','Copiar relatório');copy.type='button';copy.onclick=exportReport;
    var docs=append(actions,'a','Código-fonte BX-HEN');docs.href=SOURCE;
    docs.target='_blank';docs.rel='noopener noreferrer';
    var area=append(panel,'textarea',null,'bx-hen-report');area.id='bx-hen-report';area.readOnly=true;
    area.setAttribute('aria-label','Relatório de diagnóstico');
    var hint=append(panel,'p','As funções do GoldHEN original são independentes deste módulo.','bx-hen-note');
    hint.id='bx-hen-report-hint';
    overlay.onclick=function(event){if(event.target===overlay)close();};
    var settings=el('settings-popup');
    if (settings) {
      var btn=document.createElement('button');
      btn.type='button';btn.id='bx-hen-settings-button';
      btn.textContent='⚡ BX-HEN 0.2 — Painel experimental';
      btn.onclick=open;
      var old=el('bx-dev-button');
      if(old&&old.parentNode===settings)settings.insertBefore(btn,old.nextSibling);
      else settings.insertBefore(btn,settings.firstChild);
    }
  }
  window.bxHen01={detect:detect,getReport:report,open:open,close:close};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',make,false);
  else make();
})();