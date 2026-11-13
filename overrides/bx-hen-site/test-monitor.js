/* BX-HEN Test Monitor: reads sanitized GitHub Actions snapshot only.
   ES5 syntax for older PS4 browsers. No console access or diagnostics upload. */
(function(){
'use strict';
function find(id){return document.getElementById(id);}
function add(parent,tag,text,cls){var n=document.createElement(tag);if(cls)n.className=cls;if(typeof text==='string')n.textContent=text;parent.appendChild(n);return n;}
var requestId=0,activeRequest=null;
function load(){
 var current=++requestId,done=false;
 if(activeRequest){try{activeRequest.abort();}catch(ignore){}}
 activeRequest=null;
 status('Consultando histórico...');
 function fail(message){if(current!==requestId||done)return;done=true;activeRequest=null;status(message);}
 try{
 var x=new XMLHttpRequest(),url='./test-history.json?v='+new Date().getTime();
 activeRequest=x;
 x.open('GET',url,true);
 x.timeout=12000;
 x.onreadystatechange=function(){
  if(x.readyState!==4||current!==requestId||done)return;
  if(x.status===0){fail('Falha de conexão ao consultar os relatórios.');return;}
  if(x.status<200||x.status>=300){fail('Histórico indisponível (HTTP '+x.status+').');return;}
  try{render(JSON.parse(x.responseText));done=true;activeRequest=null;}catch(e){fail('Não foi possível ler o histórico.');}
 };
 x.onerror=function(){fail('Falha de conexão ao consultar os relatórios.');};
 x.ontimeout=function(){fail('Tempo de consulta esgotado.');};
 x.send(null);
 }catch(e){fail('A consulta não é suportada neste navegador.');}
}
function status(message){var n=find('bx-monitor-status');if(n)n.textContent=message;}
function render(data){
 var target=find('bx-monitor-runs');if(!target)return;
 if(!data||!Array.isArray(data.runs)||data.runs.length>30||
    (data.generated_at_utc!==undefined&&typeof data.generated_at_utc!=='string'))throw Error('Invalid report');
 if(data.collection_status==='unavailable'){
  status('O histórico não pôde ser coletado nesta publicação. Os resultados anteriores, se houver, continuam visíveis.');return;
 }
 for(var k=0;k<data.runs.length;k++){
  var entry=data.runs[k];
  if(!entry||typeof entry.id!=='number'||!isFinite(entry.id)||entry.id<=0||Math.floor(entry.id)!==entry.id||
     typeof entry.conclusion!=='string')throw Error('Invalid run');
  var fields=['created_at','event','commit'];
  for(var j=0;j<fields.length;j++)if(entry[fields[j]]!==undefined&&typeof entry[fields[j]]!=='string')throw Error('Invalid run field');
 }
 while(target.firstChild)target.removeChild(target.firstChild);
 if(!data||!data.runs||!data.runs.length){
  var count=find('bx-monitor-count');if(count)count.textContent='0 registros';
  var date=find('bx-monitor-date');if(date)date.textContent=(data&&data.generated_at_utc||'').replace('T',' ').replace('+00:00',' UTC');
  status('Nenhuma execução concluída registrada.');return;
 }
 var ok=0,fail=0;
 for(var i=0;i<data.runs.length;i++){
  var r=data.runs[i];if(r.conclusion==='success')ok++;else fail++;
  var row=add(target,'div',null,'bx-monitor-row');
  var details=add(row,'div',null,'bx-monitor-description');
  var title=add(details,'strong','Execução #'+String(r.id).slice(-7));
  add(details,'small',(r.created_at||'Sem data').replace('T',' ').replace('Z',' UTC')+' • '+(r.event||'')+' • '+(r.commit||''));
  var conclusion=r.conclusion==='success'?'Aprovada':r.conclusion==='failure'?'Falhou':r.conclusion==='cancelled'?'Cancelada':r.conclusion||'Outra';
  add(row,'span',conclusion,'bx-monitor-state '+(r.conclusion==='success'?'pass':'other'));
  var link=add(row,'a','Ver logs');link.setAttribute('aria-label','Ver logs da execução '+String(r.id));link.href='https://github.com/CT7-BX/BX-CT7.github.io/actions/runs/'+String(r.id);link.target='_blank';link.rel='noopener noreferrer';
 }
 status('Últimas '+data.runs.length+' execuções concluídas: '+ok+' com sucesso, '+fail+' com outros resultados.');
 var count=find('bx-monitor-count');if(count)count.textContent=data.runs.length+(data.runs.length===1?' registro':' registros');
 var date=find('bx-monitor-date');if(date)date.textContent=(data.generated_at_utc||'').replace('T',' ').replace('+00:00',' UTC');
}
function init(){
 var main=document.querySelector('main.main');if(!main||find('bx-monitor'))return;
 var box=add(main,'section',null,'panel bx-monitor');box.id='bx-monitor';
 var head=add(box,'div',null,'box-title');head.textContent='▣ BX-HEN Test Monitor — Histórico do GitHub Actions';
 var inner=add(box,'div',null,'inner');
 add(inner,'p','Resultados públicos da compilação e publicação do site. Não são testes de desbloqueio no PS4.','bx-monitor-intro');
 var summary=add(inner,'div',null,'bx-monitor-summary');
 var count=add(summary,'strong','Aguardando relatório...');count.id='bx-monitor-count';
 var date=add(summary,'small','');date.id='bx-monitor-date';
 var update=add(summary,'button','Atualizar histórico','bx-mini');update.type='button';update.onclick=load;
 var state=add(inner,'p','Consultando histórico...','bx-monitor-intro');state.id='bx-monitor-status';state.setAttribute('role','status');state.setAttribute('aria-live','polite');state.setAttribute('aria-atomic','true');
 var list=add(inner,'div',null,'bx-monitor-list');list.id='bx-monitor-runs';
 var info=add(inner,'p','Relatório automático às 08h, 14h e 20h de Mato Grosso, sujeito à fila do GitHub. A execução atual aparece apenas após finalizar e ser coletada em uma publicação posterior.','bx-monitor-intro');
 var ref=find('diagnostics');if(ref&&ref.parentNode===main)main.insertBefore(box,ref);
 load();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,false);else init();
})();
