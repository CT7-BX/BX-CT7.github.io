const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('overrides/homebrew-catalog.js','utf8');
function environment(options={}){
  function node(tag){return {tag,children:[],attributes:{},textContent:'',appendChild(n){this.children.push(n);},
    setAttribute(k,v){this.attributes[k]=v;},getAttribute(k){return this.attributes[k];}};}
  const container=node('div'),requests=[],window={};
  const all=(n=container)=>[n,...n.children.flatMap(c=>all(c))];
  class XHR{
    constructor(){if(options.constructorFails)throw Error('blocked');requests.push(this);}
    open(){if(options.openFails)throw Error('blocked');}send(){}abort(){this.aborted=true;}
    respond(data,status=200){this.readyState=4;this.status=status;this.responseText=JSON.stringify(data);this.onreadystatechange();}
  }
  vm.runInNewContext(source,{window,document:{createElement:node,getElementById(id){return all().find(n=>n.id===id)||null;}},XMLHttpRequest:XHR});
  return {container,requests,all,render(){window.bxRenderHomebrewCards(container);}};
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
  assert.ok(env.all().find(n=>n.tag==='a').href.startsWith('./bx-hen/store/?q='));
});
