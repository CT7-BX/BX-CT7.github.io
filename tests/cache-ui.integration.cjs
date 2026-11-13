// Generated cache page only: never runs kernel or payload code.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function environment(options={}){
  const nodes={},events={},timers=[];let reloads=0,replaced=null;
  for(const id of ['cacheStatus','progressFill','cacheFrame','bx-cache-retry','bx-cache-back','bx-cache-progress'])
    nodes[id]={style:{},attributes:{},textContent:'',setAttribute(k,v){this.attributes[k]=v;}};
  nodes.cacheFrame.contentWindow={};
  const window={applicationCache:options.unsupported?undefined:{},
    location:{protocol:'https:',host:'example.test',reload(){reloads++;},replace(url){replaced=url;}},
    addEventListener(name,fn){events[name]=fn;},setTimeout(fn,ms){timers.push({fn,ms});}};
  vm.runInNewContext(fs.readFileSync('dist/includes/js/cache-status.js','utf8'),{
    window,document:{getElementById(id){return nodes[id];}},mainPage:'./?test=0',
    getPs4FwVersion(){if(options.firmwareThrows)throw Error('failed');return '13.52';},getCachePage(fw){assert.equal(fw,'13.52');return './includes/caches/cache1302-1352.html';}
  });
  return {nodes,timers,events,send(data,extra={}){events.message({source:nodes.cacheFrame.contentWindow,origin:'https://example.test',data,...extra});},
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
