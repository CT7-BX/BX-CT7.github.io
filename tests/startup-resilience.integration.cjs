// Presentation and URL handling only; never evaluate an exploit or payload.
const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('dist/index.html','utf8');
const early=Array.from(html.matchAll(/<script>([\s\S]*?)<\/script>/g),m=>m[1]).find(s=>s.includes('// Prevent "Theme Flash"'));
function preferences(values={},blocked=false){
 const links={},document={getElementById(id){return {setAttribute(k,v){links[id]=v;}};}};
 const context={document,localStorage:{getItem(key){if(blocked)throw Error('denied');return values[key]||null;},setItem(){if(blocked)throw Error('denied');}}};
 vm.runInNewContext(early,context);
 return {links,document,context};
}
test('blocked preference storage cannot interrupt early page setup',()=>{
 const env=preferences({},true);
 assert.equal(env.document.dir,'ltr');assert.ok(env.links['main-stylesheet']);
 assert.equal(env.links['color-stylesheet'],'./includes/css/colors/default.css');
 assert.deepEqual(Array.from(env.context.rtlLangs),['ar','fa']);
});
test('stale preference paths use existing stylesheets while valid preferences survive',()=>{
 const invalid=preferences({theme:'../../missing',color:'unknown'});
 assert.equal(invalid.links['main-stylesheet'],'./includes/css/layouts/index.css');
 assert.equal(invalid.links['color-stylesheet'],'./includes/css/colors/default.css');
 const valid=preferences({theme:'painel',color:'ruby',language:'ar'});
 assert.equal(valid.links['main-stylesheet'],'./includes/css/layouts/painel.css');
 assert.equal(valid.links['color-stylesheet'],'./includes/css/colors/ruby.css');assert.equal(valid.document.dir,'rtl');
});
test('clearing the visible console uses readable text even without a translation',()=>{
 const source=fs.readFileSync('dist/includes/js/events.js','utf8');
 const handler=source.match(/ui\.debugConsoleElement\.addEventListener\('click', function \(\) \{([\s\S]*?)\n\}\);/)[1];
 for(const lang of [undefined,{}, {waitingUserInput:'<img src=x onerror=run()>'}]){
  const consoleElement={innerHTML:'unchanged'};
  vm.runInNewContext(handler,{ui:{consoleElement},window:{lang}});
  assert.equal(consoleElement.textContent,lang&&lang.waitingUserInput||'Aguardando uma ação');
  assert.equal(consoleElement.innerHTML,'unchanged');
 }
});
function query(search){
 const values={};const context={window:{location:{search}},document:{body:null},
 storage:{session:{set(k,v){values[k]=v;return true;},getBoolean(k,fallback){return values[k]===undefined?fallback:values[k];}}}};
 vm.runInNewContext(fs.readFileSync('dist/includes/js/testMode.js','utf8'),context);return context;
}
test('malformed URL input cannot abort startup or accidentally activate test mode',()=>{
 for(const search of ['?%=1','?test=%','?test=1=extra','?test=1%3Dextra'])assert.equal(query(search).devMode,false,search);
 assert.equal(query('?%=x&test=0').devMode,false);
 assert.equal(query('?test=1').devMode,true);assert.equal(query('?test=0').devMode,false);
 assert.equal(query('?value=a%3Db').getQueryParam('value'),'a=b');
});
test('popup close buttons announce their actual action',()=>{
 for(const id of ['close-settings','close-about'])assert.match(html,new RegExp('<button aria-label="Fechar"[^>]*id="'+id+'"'));
});
