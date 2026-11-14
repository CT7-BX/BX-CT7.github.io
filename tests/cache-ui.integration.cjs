// Generated cache page only: never runs kernel or payload code.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function environment(options={}){
  const nodes={},events={},timers=[],idleTimers=[],allTimers=[];let reloads=0,replaced=null;
  for(const id of ['cacheStatus','progressFill','cacheFrame','bx-cache-retry','bx-cache-back','bx-cache-progress'])
    nodes[id]={style:{},attributes:{},textContent:'',setAttribute(k,v){this.attributes[k]=v;}};
  nodes.cacheFrame.contentWindow={};
  const window={applicationCache:options.unsupported?undefined:{},
    location:{protocol:'https:',host:'example.test',reload(){reloads++;},replace(url){if(options.replaceThrows)throw Error('blocked');replaced=url;}},
    addEventListener(name,fn){events[name]=fn;},setTimeout(fn,ms){const t={fn,ms,cleared:false};allTimers.push(t);(ms===90000?idleTimers:timers).push(t);return allTimers.length;},clearTimeout(id){allTimers[id-1].cleared=true;}};
  vm.runInNewContext(fs.readFileSync('dist/includes/js/cache-status.js','utf8'),{
    window,document:{getElementById(id){return nodes[id];}},mainPage:'./?test=0',
    getPs4FwVersion(){if(options.firmwareThrows)throw Error('failed');return '13.52';},getCachePage(fw){assert.equal(fw,'13.52');return './includes/caches/cache1302-1352.html';}
  });
  return {nodes,timers,idleTimers,events,send(data,extra={}){events.message({source:nodes.cacheFrame.contentWindow,origin:'https://example.test',data,...extra});},
    get reloads(){return reloads;},get replaced(){return replaced;}};
}

test('generated cache page has accessible progress, retry, back link and controller',()=>{
  const html=fs.readFileSync('dist/cache.html','utf8');
  assert.match(html,/id="bx-cache-progress" role="progressbar"/);
  assert.match(html,/id="cacheStatus" role="status"/);
  assert.match(html,/src="\.\/includes\/js\/cache-status.js"/);
  assert.doesNotMatch(html,/maximum-scale=1/);
});
test('accepts progress only from selected same-origin iframe',()=>{
  const env=environment();const before=env.nodes.cacheStatus.textContent;
  env.send({type:'CACHE_COMPLETE'},{origin:'https://other.test'});
  env.send({type:'CACHE_COMPLETE'},{source:{}});
  assert.equal(env.nodes.cacheStatus.textContent,before);assert.equal(env.timers.length,0);
  env.send({type:'CACHE_PROGRESS',percent:45});assert.equal(env.nodes.progressFill.style.width,'45%');
  assert.equal(env.nodes['bx-cache-progress'].attributes['aria-valuenow'],'45');
  env.send({type:'CACHE_PROGRESS',percent:999});env.send({type:'CACHE_PROGRESS',percent:NaN});
  assert.equal(env.nodes.progressFill.style.width,'45%');
});
test('cache error remains visible with retry and cannot trigger an automatic return',()=>{
  const env=environment();env.send({type:'CACHE_ERROR',reason:'Connection interrupted'});
  assert.match(env.nodes.cacheStatus.textContent,/Connection interrupted/);
  assert.equal(env.nodes['bx-cache-retry'].hidden,false);assert.equal(env.timers.length,0);
  env.send({type:'CACHE_COMPLETE'});assert.equal(env.timers.length,0);
  env.nodes['bx-cache-retry'].onclick();assert.equal(env.reloads,1);
});
test('successful completion returns once through the original test-mode destination',()=>{
  const env=environment();env.send({type:'CACHE_COMPLETE'});env.send({type:'CACHE_EXISTS'});
  assert.equal(env.timers.length,1);assert.equal(env.timers[0].ms,1000);
  env.timers[0].fn();assert.equal(env.replaced,'./?test=0');
});
test('unsupported browsers show a readable explanation without starting the iframe',()=>{
  const env=environment({unsupported:true});
  assert.match(env.nodes.cacheStatus.textContent,/não oferece o cache offline/);
  assert.equal(env.nodes.cacheFrame.src,undefined);assert.equal(env.timers.length,0);
});
test('failed cache swap emits error and never reports completion',()=>{
  const events={},messages=[];
  const appCache={addEventListener(name,fn){events[name]=fn;},swapCache(){throw Error('failed');}};
  vm.runInNewContext(fs.readFileSync('dist/includes/js/iframe_cache.js','utf8'),{
    window:{applicationCache:appCache,parent:{postMessage(data){messages.push(data);}}}
  });
  events.updateready();assert.equal(messages.length,1);assert.equal(messages[0].type,'CACHE_ERROR');
});


test('cache preparation errors stay readable and the first failure is preserved',()=>{
  const env=environment({firmwareThrows:true});
  assert.match(env.nodes.cacheStatus.textContent,/preparar a página de cache/);
  assert.equal(env.nodes['bx-cache-retry'].hidden,false);
  const message=env.nodes.cacheStatus.textContent;
  env.nodes.cacheFrame.onerror();
  assert.equal(env.nodes.cacheStatus.textContent,message);
  assert.equal(env.nodes.cacheFrame.src,undefined);
});

test('explicit back link skips automatic cache once while completion uses normal destination',()=>{
  const env=environment();
  assert.equal(env.nodes['bx-cache-back'].href,'./?test=0&cacheReturn=1');
  env.send({type:'CACHE_COMPLETE'});env.timers[0].fn();
  assert.equal(env.replaced,'./?test=0');
});

test('blocked return keeps successful cache status and offers the existing back link',()=>{
 const env=environment({replaceThrows:true});env.send({type:'CACHE_COMPLETE'});
 assert.doesNotThrow(()=>env.timers[0].fn());
 assert.match(env.nodes.cacheStatus.textContent,/Cache atualizado.*Use Voltar ao site/);
 assert.equal(env.nodes['bx-cache-back'].href,'./?test=0&cacheReturn=1');
 assert.equal(env.replaced,null);env.send({type:'CACHE_ERROR'});
 assert.match(env.nodes.cacheStatus.textContent,/Cache atualizado/);
});

test('silent cache shows an honest wait notice and accepts late completion',()=>{
 const e=environment();assert.equal(e.idleTimers[0].ms,90000);e.idleTimers[0].fn();
 assert.match(e.nodes.cacheStatus.textContent,/conclusão ainda não foi confirmada/);assert.equal(e.nodes['bx-cache-retry'].hidden,false);assert.equal(e.timers.length,0);
 e.send({type:'CACHE_COMPLETE'});assert.match(e.nodes.cacheStatus.textContent,/Cache atualizado/);assert.equal(e.timers.length,1);assert.equal(e.nodes['bx-cache-retry'].hidden,true);
});
test('valid progress renews the idle deadline and clears a temporary warning',()=>{
 const e=environment();e.idleTimers[0].fn();e.send({type:'CACHE_PROGRESS',percent:35});
 assert.equal(e.nodes['bx-cache-retry'].hidden,true);assert.equal(e.idleTimers.length,2);
 e.send({type:'CACHE_DOWNLOADING'});assert.equal(e.idleTimers[1].cleared,true);
});
test('navigation and real errors cancel the idle deadline; history resumes waiting',()=>{
 const e=environment();e.events.pagehide();assert.equal(e.idleTimers[0].cleared,true);
 e.events.pageshow({persisted:true});assert.equal(e.idleTimers.length,2);
 e.send({type:'CACHE_ERROR'});assert.equal(e.idleTimers[1].cleared,true);
 const message=e.nodes.cacheStatus.textContent;e.idleTimers[1].fn();assert.equal(e.nodes.cacheStatus.textContent,message);
});
