/* BX-HEN Compatibility Center: non-invasive local diagnostics.
   ES5 for older PS4 WebKit. Never accesses kernel, sends data, or executes payloads. */
(function () {
 'use strict';
 var last = null;
 function el(id) { return document.getElementById(id); }
 function add(p,t,c) { var x=document.createElement(t); if(c)x.className=c;p.appendChild(x);return x; }
 function set(x,t) { if(x)x.textContent=String(t); }
 function testStorage(kind) {
   var s;try { s=window[kind]; if(!s)return 'indisponível';
     var k='bx-hen-compatibility-probe';s.setItem(k,'ok');var good=s.getItem(k)==='ok';s.removeItem(k);
     return good?'operacional':'falhou';
   } catch(e) {return 'bloqueado';}
 }
 function testCanvas() {
   try{var c=document.createElement('canvas');return typeof c.getContext==='function'&&!!c.getContext('2d')?'operacional':'indisponível';}
   catch(e){return 'bloqueado';}
 }
 function testWebGL() {
   try{var c=document.createElement('canvas');return (c.getContext('webgl')||c.getContext('experimental-webgl'))?'disponível':'indisponível';}
   catch(e){return 'bloqueado';}
 }
 function run() {
   var ua=navigator.userAgent||'', ps4=ua.indexOf('PlayStation 4')!==-1, fw='Não informado';
   var m=ua.match(/PlayStation 4[\/ ]([0-9]{1,2}\.[0-9]{1,2})(?=$|[); \/])/);
   if(m)fw=m[1];
   var items=[
     ['Plataforma',ps4?'PS4':'Navegador externo'],
     ['Firmware informado',fw],
     ['Alvo 13.53',fw==='13.53'?'corresponde':'não confirmado'],
     ['localStorage',testStorage('localStorage')],
     ['sessionStorage',testStorage('sessionStorage')],
     ['Canvas 2D',testCanvas()],
     ['WebGL',testWebGL()],
     ['Cache offline',typeof window.applicationCache!=='undefined'?'API presente':'indisponível'],
     ['WebAssembly',typeof window.WebAssembly!=='undefined'?'API presente':'indisponível'],
     ['HTTPS',location.protocol==='https:'?'sim':'não'],
     ['Idioma do navegador',navigator.language||navigator.userLanguage||'não informado'],
     ['Estado de rede (indicativo)',typeof navigator.onLine==='boolean'?(navigator.onLine?'navegador indica online':'navegador indica offline'):'não informado'],
     ['Viewport (CSS px)',(document.documentElement.clientWidth||0)+' x '+(document.documentElement.clientHeight||0)],
     ['Tela (CSS px)',(window.screen&&screen.width||0)+' x '+(window.screen&&screen.height||0)],
     ['Escala de pixels',typeof window.devicePixelRatio==='number'?String(window.devicePixelRatio):'não informada'],
     ['Desbloqueio BX-HEN','não implementado'],
     ['GoldHEN ativo','não verificável pela página']
   ];
   last={project:'BX-HEN',module:'Compatibility Center 0.1',timestamp:new Date().toISOString(),scope:'diagnóstico local, não é teste de jailbreak',results:items};
   var results=el('bx-compat-results');
   if(results){while(results.firstChild)results.removeChild(results.firstChild);
     for(var i=0;i<items.length;i++){var r=add(results,'div','bx-compat-row');set(add(r,'span'),items[i][0]);set(add(r,'strong'),items[i][1]);}
   }
   set(el('bx-compat-status'),'Diagnóstico executado localmente. Nenhum dado enviado.');
   return last;
 }
 function copy() {
   var data=last||run(),area=el('bx-compat-report');
   if(!area)return;
   area.style.display='block';area.value=JSON.stringify(data,null,2);area.focus();area.select();
   var copied=false;
   try{copied=document.execCommand('copy');}catch(e){}
   set(el('bx-compat-status'),copied?'Relatório copiado; também disponível no campo abaixo.':'Selecione e copie o relatório no campo abaixo.');
 }
 function reset(){
   last=null;var r=el('bx-compat-results');if(r)while(r.firstChild)r.removeChild(r.firstChild);
   var area=el('bx-compat-report');if(area){area.value='';area.style.display='none';}
   set(el('bx-compat-status'),'Resultados locais limpos. Testes de armazenamento usam somente chave temporária.');
 }
 function init(){
   var main=document.querySelector('main.main');if(!main||el('bx-compat'))return;
   var sec=add(main,'section','panel bx-compat');sec.id='bx-compat';
   set(add(sec,'div','box-title'),'▣ BX-HEN — Centro de Compatibilidade');
   var body=add(sec,'div','inner');
   set(add(body,'p','bx-alert'),'Verifica capacidades do navegador e a versão informada no User-Agent. Não confirma a execução de HEN nem o suporte a jailbreak.');
   var actions=add(body,'div','bx-compat-actions');
   var start=add(actions,'button','bx-mini');start.type='button';set(start,'Executar testes locais');start.onclick=run;
   var cp=add(actions,'button','bx-mini');cp.type='button';set(cp,'Copiar relatório JSON');cp.onclick=copy;
   var clear=add(actions,'button','bx-mini');clear.type='button';set(clear,'Limpar resultados');clear.onclick=reset;
   var status=add(body,'p','bx-alert');status.id='bx-compat-status';set(status,'Pronto para executar os testes.');
   var results=add(body,'div','bx-compat-results');results.id='bx-compat-results';
   var area=add(body,'textarea','bx-compat-report');area.id='bx-compat-report';area.readOnly=true;area.setAttribute('aria-label','Relatório JSON local');
   var before=el('diagnostics');if(before&&before.parentNode===main)main.insertBefore(sec,before);
   var nav=document.querySelector('.sidebar');
   if(nav){var a=add(nav,'a','side-link');a.href='#bx-compat';set(a,'◉ Compatibilidade');}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,false);else init();
})();
