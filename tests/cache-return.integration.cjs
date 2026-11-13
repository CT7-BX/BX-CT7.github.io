// Navigation only; no cache download, kernel or payload execution.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function environment(search='',options={}){
 const events={},replacements=[];
 const location={search,pathname:'/BX-CT7.github.io/',hash:'#section',href:'original'};
 const context={window:{location,applicationCache:{status:options.cached?1:0,UNCACHED:0},
   addEventListener(name,fn){events[name]=fn;},
   history:{replaceState(a,b,url){if(options.historyFails)throw Error('unavailable');replacements.push(url);}}},
   isPS4Console(){return true;},devMode:false,testModeUrl(url){return url;},
   getQueryParam(name){return new URLSearchParams(search).get(name);}};
 vm.runInNewContext(fs.readFileSync('dist/includes/js/cache.js','utf8'),context);events.load();
 return {location,replacements};
}
test('explicit return stays on host and removes only the temporary return flag',()=>{
 const env=environment('?test=0&cacheReturn=1&other=a%3Db');
 assert.equal(env.location.href,'original');
 assert.deepEqual(env.replacements,['/BX-CT7.github.io/?test=0&other=a%3Db#section']);
});
test('blocked history cleanup cannot trap the visitor on the cache screen',()=>{
 const env=environment('?cacheReturn=1',{historyFails:true});
 assert.equal(env.location.href,'original');assert.equal(env.replacements.length,0);
});
test('normal first visit still opens cache while a cached visit stays on host',()=>{
 assert.equal(environment().location.href,'./cache.html');
 assert.equal(environment('',{cached:true}).location.href,'original');
 assert.equal(environment('?cacheReturn=0').location.href,'./cache.html');
});
