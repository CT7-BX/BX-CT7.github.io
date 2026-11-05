/* BX-HEN: read-only UI health checks; no network scans or kernel access.
 * ES5 syntax for older PS4 WebKit. */
(function () {
'use strict';
function el(id){return document.getElementById(id);}
function text(node,t){if(node)node.textContent=String(t);}
function make(parent,tag,cls){var x=document.createElement(tag);if(cls)x.className=cls;parent.appendChild(x);return x;}
var history=[];
function log(message){var now=new Date(),stamp=now.toLocaleTimeString();history.push('['+stamp+'] '+message);if(history.length>30)history.shift();var v=el('bx-history');if(v)text(v,history.join('\n'));}
function storeRead(key){try{return window.localStorage?localStorage.getItem(key):null;}catch(e){return null;}}
function storeWrite(key,value){try{localStorage.setItem(key,value);}catch(e){}}
function deviceInfo(){
var ua=navigator.userAgent||'',platform=navigator.platform||'',os='Desconhecido',device='Desconhecido',version='Não informada',browser='Desconhecido',m;
if(/PlayStation 4/i.test(ua)){os='PlayStation 4';device='Console PS4';}
else if(/PlayStation 5/i.test(ua)){os='PlayStation 5';device='Console PS5';}
else if(/Xbox/i.test(ua)){os='Xbox';device='Console Xbox';}
else if(/Nintendo/i.test(ua)){os='Nintendo';device='Console Nintendo';}
else if(/Android/i.test(ua)){os='Android';device=/Mobile/i.test(ua)?'Celular':'Tablet / outro Android';}
else if(/iPhone|iPad|iPod/i.test(ua)){os='iOS / iPadOS';device=/iPad/i.test(ua)?'Tablet':'Celular / iPod';}
else if(/Windows NT/i.test(ua)){os='Windows';device='Computador';}
else if(/Mac OS X/i.test(ua)){os='macOS (ou iPadOS em modo desktop)';device='Computador / tablet';}
else if(/CrOS/i.test(ua)){os='ChromeOS';device='Computador';}
else if(/Linux/i.test(ua)){os='Linux';device='Computador / outro';}
else if(/FreeBSD/i.test(ua)){os='FreeBSD';device='Computador';}
if(/PlayStation 4/i.test(ua)){m=ua.match(/PlayStation 4[^;)]*;?\s*([0-9]+(?:\.[0-9]+)+)/i);if(m)version=m[1];}
else if(/Android\s+([0-9.]+)/i.test(ua))version=RegExp.$1;
else if(/(?:iPhone|iPad|iPod).*?OS\s+([0-9_]+)/i.test(ua))version=RegExp.$1.replace(/_/g,'.');
else if(/Windows NT\s+([0-9.]+)/i.test(ua))version='NT '+RegExp.$1;
else if(/Mac OS X\s+([0-9_.]+)/i.test(ua))version=RegExp.$1.replace(/_/g,'.');
if(/Edg\//i.test(ua))browser='Microsoft Edge';
else if(/OPR\//i.test(ua))browser='Opera';
else if(/Firefox\//i.test(ua))browser='Firefox';
else if(/CriOS\//i.test(ua))browser='Chrome (iOS)';
else if(/Chrome\//i.test(ua))browser='Chrome / Chromium';
else if(/Safari\//i.test(ua))browser='Safari / WebKit';
else if(/PlayStation/i.test(ua))browser='Navegador PlayStation';
return {os:os,device:device,version:version,browser:browser,platform:platform||'Não informada'};
}
function check(){var info=deviceInfo(),isps4=info.os==='PlayStation 4';
var support=typeof window.applicationCache!=='undefined';
var js=typeof document.addEventListener==='function';
var store=false;
try{localStorage.setItem('bx-hen-health-temp','ok');store=localStorage.getItem('bx-hen-health-temp')==='ok';localStorage.removeItem('bx-hen-health-temp');}catch(e){}
var results=[['Sistema detectado',info.os],['Tipo de dispositivo',info.device],['Versão informada pelo navegador',info.version],['Navegador',info.browser],['Plataforma',info.platform],['Armazenamento',store?'Operacional':'Indisponível'],['Cache offline',support?'API disponível':'Não suportado'],['JavaScript',js?'Operacional':'Limitado'],['Conexão',navigator.onLine===false?'Offline':'Sem confirmação de conexão'],['Kernel / HEN','Não verificável']];
var target=el('bx-test-results');if(target){while(target.firstChild)target.removeChild(target.firstChild);for(var i=0;i<results.length;i++){var x=make(target,'div','bx-test'),b=make(x,'b'),span=make(x,'span');text(b,results[i][0]);text(span,results[i][1]);}}
log('Autoverificação do navegador realizada: '+info.os+'.');
text(el('bx-last-checked'),'Última verificação local: '+new Date().toLocaleString());
}
function copyLogs(){var area=el('report-text');if(!area)return;area.style.display='block';area.value='BX-HEN 0.2 - Eventos locais\n'+history.join('\n');area.focus();area.select();try{document.execCommand('copy');}catch(e){}log('Registro selecionado para cópia.');}
function toggleCompact(){var root=document.body;var active=root.className.indexOf('bx-compact')!==-1;if(active)root.className=root.className.replace(/\bbx-compact\b/g,'');else root.className+=' bx-compact';storeWrite('bx-hen-compact',active?'0':'1');text(el('bx-compact-toggle'),active?'Modo compacto':'Modo espaçado');log('Preferência visual '+(active?'normal':'compacta')+'.');}
function init(){
var main=document.querySelector('main.main');if(!main||el('bx-enhancements'))return;
var section=make(main,'section','panel bx-release');section.id='bx-enhancements';
var left=make(section,'div'),title=make(left,'strong');text(title,'BX-HEN • Atualizações e manutenção');var sub=make(left,'small');text(sub,'Verificações agendadas às 08h, 14h e 20h (Mato Grosso). Sem atualização automática do código-fonte.');
var actions=make(section,'div','bx-release-actions');
var compact=make(actions,'button','bx-mini');compact.id='bx-compact-toggle';text(compact,'Modo compacto');compact.onclick=toggleCompact;
var btn=make(actions,'button','bx-mini');text(btn,'Verificar navegador');btn.onclick=check;
var section2=make(main,'section','panel');section2.id='bx-health';
var heading=make(section2,'div','box-title');text(heading,'▣ Autoverificação e histórico local');
var inner=make(section2,'div','inner');
var help=make(inner,'p','bx-alert');text(help,'Identificação aproximada pelo navegador (User-Agent), sem acesso ao sistema. Pode estar incompleta ou incorreta; não comprova desbloqueio e não executa payloads.');
var grid=make(inner,'div','bx-testgrid');grid.id='bx-test-results';
var last=make(inner,'p','bx-alert');last.id='bx-last-checked';
var logBox=make(inner,'div','bx-log');logBox.id='bx-history';
var copy=make(inner,'button','bx-mini');text(copy,'Copiar histórico');copy.onclick=copyLogs;
var diag=el('diagnostics');if(diag&&diag.parentNode===main){main.insertBefore(section,diag);main.insertBefore(section2,diag);} 
if(storeRead('bx-hen-compact')==='1'){document.body.className+=' bx-compact';text(compact,'Modo espaçado');}
log('Painel BX-HEN 0.2 carregado.');
check();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,false);else init();
})();
