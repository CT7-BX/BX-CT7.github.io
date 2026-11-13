const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function environment(language='pt-br'){
 const scripts=[],timers=new Map(),queries=[];let next=0;
 const head={appendChild(s){scripts.push(s);s.parentNode=head;},removeChild(s){const i=scripts.indexOf(s);if(i>=0)scripts.splice(i,1);s.parentNode=null;}};
 const window={setTimeout(fn,ms){assert.equal(ms,8000);timers.set(++next,fn);return next;},clearTimeout(id){timers.delete(id);}};
 const user={currentLanguage:language};
 const context={window,user,Promise,document:{head,getElementById(id){return scripts.find(s=>s.id===id);},createElement(){return {};},querySelector(selector){queries.push(selector);return {checked:false};}}};
 vm.createContext(context);vm.runInContext(fs.readFileSync('overrides/language-loader.js','utf8'),context);
 return {window,user,scripts,timers,queries,load(){return context.loadLanguage();},latest(){return scripts[scripts.length-1];},success(strings){window.lang=strings;this.latest().onload();},fail(){this.latest().onerror();},timeout(){const fn=timers.values().next().value;fn();}};
}
const en={clickToStart:'Start',waitingUserInput:'Waiting'};
test('selected language merges with English and clears its timeouts',async()=>{
 const e=environment(),result=e.load();e.success({...en});e.success({clickToStart:'Iniciar'});
 const data=await result;assert.equal(data.clickToStart,'Iniciar');assert.equal(data.waitingUserInput,'Waiting');assert.equal(e.user.currentLanguage,'pt-br');assert.equal(e.timers.size,0);
});
test('selected language failure uses English and ignores a late failed-script execution',async()=>{
 const e=environment(),result=e.load();e.success({...en});const late=e.latest();e.fail();await result;
 assert.equal(e.user.currentLanguage,'en');e.window.lang={clickToStart:'Late'};late.onload();assert.equal(e.window.lang.clickToStart,'Start');
});
test('English failure still allows the local Portuguese file to load',async()=>{
 const e=environment(),result=e.load();e.fail();assert.match(e.latest().src,/pt-br\.js$/);e.success({clickToStart:'Iniciar'});assert.equal((await result).clickToStart,'Iniciar');
});
test('two stalled requests settle as a failure instead of hanging indefinitely',async()=>{
 const e=environment(),result=e.load();const rejected=assert.rejects(result,/No interface language/);e.timeout();e.timeout();await rejected;assert.equal(e.timers.size,0);
});
test('untrusted stored language cannot enter a selector or script path',async()=>{
 const e=environment('../../bad"]'),result=e.load();assert.equal(e.user.currentLanguage,'pt-br');assert.doesNotMatch(e.queries[0],/bad/);e.success({...en});e.success({clickToStart:'Iniciar'});await result;
});
test('superseded request cannot replace the latest committed language',async()=>{
 const e=environment('en'),first=e.load();const rejected=assert.rejects(first,/superseded/),old=e.latest();
 e.user.currentLanguage='pt-br';const latest=e.load();e.success({...en});e.success({clickToStart:'Iniciar'});await latest;
 e.window.lang={clickToStart:'Old'};old.onload();await rejected;assert.equal(e.window.lang.clickToStart,'Iniciar');assert.equal(e.timers.size,0);
});
