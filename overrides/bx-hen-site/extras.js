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
function check(){var ua=navigator.userAgent||'',isps4=ua.indexOf('PlayStation 4')>=0;
var support=typeof window.applicationCache!=='undefined';
var js=typeof document.addEventListener==='function';
var store=false;
try{localStorage.setItem('bx-hen-health-temp','ok');store=localStorage.getItem('bx-hen-health-temp')==='ok';localStorage.removeItem('bx-hen-health-temp');}catch(e){}
var results=[['Navegador',isps4?'PS4 detectado':'Externo'],['Armazenamento',store?'Operacional':'Indisponível'],['Cache offline',support?'API disponível':'Não suportado'],['JavaScript',js?'Operacional':'Limitado'],['Conexão',navigator.onLine===false?'Offline':'Sem confirmação de conexão'],['Kernel / HEN','Não verificável']];
var target=el('bx-test-results');if(target){while(target.firstChild)target.removeChild(target.firstChild);for(var i=0;i<results.length;i++){var x=make(target,'div','bx-test'),b=make(x,'b'),span=make(x,'span');text(b,results[i][0]);text(span,results[i][1]);}}
log('Autoverificação do navegador realizada.');
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
var help=make(inner,'p','bx-alert');text(help,'Estes testes mostram recursos disponíveis no navegador. Não comprovam que o PS4 está desbloqueado e não executam payloads.');
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