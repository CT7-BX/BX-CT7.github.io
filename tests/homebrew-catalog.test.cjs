const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('overrides/homebrew-catalog.js','utf8');
function environment(options={}){
  let now=100000;class Clock{getTime(){return now;}}
  function node(tag){return {tag,children:[],attributes:{},textContent:'',appendChild(n){this.children.push(n);},
    setAttribute(k,v){this.attributes[k]=v;},getAttribute(k){return this.attributes[k];}};}
  const container=node('div'),requests=[],timers=[],window={setTimeout(fn,ms){timers.push({fn,ms,cleared:false});return timers.length;},clearTimeout(id){timers[id-1].cleared=true;}};
  const all=(n=container)=>[n,...n.children.flatMap(c=>all(c))];
  class XHR{
    constructor(){if(options.constructorFails)throw Error('blocked');requests.push(this);}
    open(){if(options.openFails)throw Error('blocked');}send(){}abort(){this.aborted=true;}
    respond(data,status=200){this.readyState=4;this.status=status;this.responseText=JSON.stringify(data);this.onreadystatechange();}
  }
  vm.runInNewContext(source,{window,Date:Clock,document:{createElement:node,getElementById(id){return all().find(n=>n.id===id)||null;}},XMLHttpRequest:XHR});
  return {container,requests,timers,all,advance(ms){now+=ms;},render(){window.bxRenderHomebrewCards(container);}};
}
const items=[{id:'java',title:'Java',description:'Example',status:'planned'}];
test('catalog timeout renders fallback once and ignores late responses',()=>{
  const env=environment();env.render();const request=env.requests[0];
  assert.equal(request.timeout,12000);request.ontimeout();request.onerror();
  request.respond({schema_version:1,items});assert.equal(env.container.children.length,2);
  assert.equal(env.container.bxCatalogRequest,null);
});
test('new render aborts old request and stale completion cannot add cards',()=>{
  const env=environment();env.render();const old=env.requests[0];env.render();
  assert.equal(old.aborted,true);env.requests[1].respond({schema_version:1,items});
  old.respond({schema_version:1,items:[{id:'minecraft-online-manager',title:'Stale'}]});old.onerror();
  assert.equal(env.container.children.length,1);
  assert.equal(env.container.children[0].id,'bx-homebrew-java');
});
test('invalid catalog and unsupported XHR fall back without breaking the tab',()=>{
  for(const option of ['constructorFails','openFails']){
    const env=environment({[option]:true});env.render();assert.equal(env.container.children.length,2);
  }
  const env=environment();env.render();env.requests[0].respond({schema_version:2,items});
  assert.equal(env.container.children.length,2);
});
test('blank distribution permission never marks a file as downloadable',()=>{
  const env=environment();env.render();env.requests[0].respond({schema_version:1,items:[{
    id:'java',title:'<script>Example</script>',status:'available',download_url:'https://example.com/app.pkg',
    sha256:'a'.repeat(64),license:'   '
  }]});
  assert.ok(env.all().find(n=>n.textContent==='<script>Example</script>'));
  assert.ok(env.all().find(n=>n.textContent==='PKG ainda não disponibilizado — sem instalador'));
  assert.ok(env.all().find(n=>n.tag==='a').href.startsWith('./bx-hen/store/index.html#q='));
});

test('legacy timeout fallback aborts the stalled catalog and cannot append late results',()=>{
 const e=environment();e.render();assert.equal(e.timers[0].ms,12000);e.timers[0].fn();
 assert.equal(e.requests[0].aborted,true);assert.equal(e.container.children.length,2);
 e.requests[0].respond({schema_version:1,items});assert.equal(e.container.children.length,2);
});
test('successful catalog is reused when reopening the tab and has no live deadline',()=>{
 const e=environment();e.render();e.requests[0].respond({schema_version:1,items});assert.equal(e.timers[0].cleared,true);
 e.container.children=[];e.render();assert.equal(e.requests.length,1);assert.equal(e.container.children.length,1);
});
test('new render clears the old deadline and unknown-only catalogs show fallback',()=>{
 const e=environment();e.render();e.render();assert.equal(e.timers[0].cleared,true);
 e.timers[0].fn();assert.equal(e.container.children.length,0);
 e.requests[1].respond({schema_version:1,items:[{id:'unknown',title:'Unknown'}]});assert.equal(e.container.children.length,2);
});

test('catalog memory reuse expires after 30 seconds and fetches a fresh result',()=>{
 const e=environment();e.render();e.requests[0].respond({schema_version:1,items});
 e.container.children=[];e.advance(30001);e.render();assert.equal(e.requests.length,2);
 assert.notEqual(e.requests[0].aborted,true);e.requests[1].respond({schema_version:1,items});assert.equal(e.container.children.length,1);
});
