// AppCache events only: no browser cache, network, exploit or payload execution.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const revision='a'.repeat(40);
function bridge(options={}){
 const events={},navigation={},messages=[];let swaps=0,reloads=0,updates=0;
 const cache={status:options.status===undefined?0:options.status,addEventListener(k,fn){events[k]=fn;},swapCache(){swaps++;if(options.swapThrows)throw Error('swap');},update(){updates++;if(options.updateThrows)throw Error('update');}};
 vm.runInNewContext(fs.readFileSync('overrides/cache-bridge.js','utf8'),{
  document:{documentElement:{getAttribute(){return options.revision===undefined?revision:options.revision;}}},
  window:{applicationCache:options.unsupported?null:cache,location:{protocol:'https:',host:'example.test',reload(){reloads++;if(options.reloadThrows)throw Error('reload');}},
   addEventListener(k,fn){navigation[k]=fn;},parent:{postMessage(data,origin){messages.push({data,origin});}}}});
 return {events,navigation,messages,get swaps(){return swaps;},get reloads(){return reloads;},get updates(){return updates;}};
}
test('first cache completion carries publication/protocol and uses the exact same origin',()=>{
 const e=bridge();e.events.cached();e.events.noupdate();assert.equal(e.messages.length,1);
 assert.equal(e.messages[0].origin,'https://example.test');assert.equal(e.messages[0].data.revision,revision);assert.equal(e.messages[0].data.protocol,2);
});
test('swap never announces completion until a new document confirms its revision',()=>{
 const old=bridge();old.events.updateready();old.events.cached();old.events.updateready();assert.equal(old.swaps,1);assert.equal(old.reloads,1);
 assert.equal(old.messages.some(x=>/CACHE_COMPLETE|CACHE_EXISTS/.test(x.data.type)),false);
 const loaded=bridge({status:1});assert.equal(loaded.updates,1);loaded.events.noupdate();assert.equal(loaded.messages[0].data.type,'CACHE_EXISTS');
});
test('initial UPDATEREADY and OBSOLETE states cannot be missed by late listeners',()=>{
 const ready=bridge({status:4});assert.equal(ready.swaps,1);assert.equal(ready.reloads,1);
 const obsolete=bridge({status:5});assert.equal(obsolete.messages[0].data.type,'CACHE_ERROR');
});
test('swap, reload, update and unsupported failures never claim cache completion',()=>{
 for(const options of [{status:4,swapThrows:true},{status:4,reloadThrows:true},{status:1,updateThrows:true},{unsupported:true},{revision:''}]){
  const e=bridge(options);assert.equal(e.messages[e.messages.length-1].data.type,'CACHE_ERROR');assert.equal(e.messages.some(x=>x.data.type==='CACHE_COMPLETE'),false);
 }
});
test('navigated cache documents cannot send late completion',()=>{
 const e=bridge();e.navigation.pagehide();e.events.cached();assert.equal(e.messages.length,0);
});
