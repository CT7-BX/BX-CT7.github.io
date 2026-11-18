// Host lifecycle simulation; never executes a real chain or payload.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function env(options={}){
 const nodes={},events={},timers=[],alerts=[],attrs={};let launches=0,successes=0;
 function node(){const cls=new Set();return {style:{display:'',removeProperty(k){delete this[k];}},classList:{add:k=>cls.add(k),remove:k=>cls.delete(k),contains:k=>cls.has(k)}};}
 for(const id of ['initial-screen','payloadsSection','exploit-main-screen'])nodes[id]=node();
 const main={scrollTop:0,scrollHeight:1000,clientHeight:800};
 const c={Promise,document:{body:node(),documentElement:{setAttribute(k,v){attrs[k]=v;}},getElementById:id=>nodes[id],querySelector:()=>main,
  createEvent(){return{initEvent(type){this.type=type;}};}},user:{blockJailbreak:true},applicationCache:{status:options.cacheStatus||1},
  addEventListener(k,fn){(events[k]||(events[k]=[])).push(fn);},dispatchEvent(e){for(const fn of events[e.type]||[])fn(e);},
  setTimeout(fn,ms){timers.push({fn,ms,cleared:false});return timers.length;},clearTimeout(id){timers[id-1].cleared=true;},location:{href:'unchanged'},
  isPS4Console:()=>true,alert(text){alerts.push(text);},log(){},getReloadAfterJbValue:()=>!!options.returnAfter,
  jailbreak(){launches++;if(options.launchThrows)throw Error('launch failed');c.cleanUp();return options.pending||undefined;},
  cleanUp(){nodes['initial-screen'].classList.add('hidden');nodes.payloadsSection.classList.add('hidden');},
  jailbreakSuccess(){successes++;if(options.successThrows)throw Error('UI failed');},EXPLOIT_HANDLERS:{1:()=>options.handlerResult},mainPage:'./?test=0#section'};
 c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync('overrides/host-return.js','utf8'),c);
 return{c,nodes,events,timers,alerts,attrs,emit(type,props={}){for(const fn of events[type]||[])fn(props);},get launches(){return launches;},get successes(){return successes;}};
}
test('premature clicks do not start an attempt and initialization runs once',async()=>{
 const e=env();await e.c.jailbreak();assert.equal(e.launches,0);assert.equal(e.c.user.blockJailbreak,false);
 let release,calls=0;const wait=new Promise(resolve=>release=resolve);
 const first=e.c.bxHostRuntime.prepare(()=>{calls++;return wait;});const second=e.c.bxHostRuntime.prepare(()=>calls++);
 assert.equal(first,second);await Promise.resolve();await e.c.jailbreak();assert.equal(e.launches,0);
 release();await first;assert.equal(calls,1);assert.equal(e.c.bxHostRuntime.state(),'idle');
});
test('one launch remains busy until the original success callback, not merely a resolved Promise',async()=>{
 const e=env();await e.c.bxHostRuntime.prepare(()=>{});await e.c.jailbreak();await e.c.jailbreak();
 assert.equal(e.launches,1);assert.equal(e.c.bxHostRuntime.state(),'running');
 e.c.jailbreakSuccess();e.c.jailbreakSuccess();assert.equal(e.successes,1);assert.equal(e.c.bxHostRuntime.state(),'completed');
});
test('checking/downloading cache blocks a launch without queueing it',async()=>{
 for(const status of [2,3]){const e=env({cacheStatus:status});await e.c.bxHostRuntime.prepare(()=>{});await e.c.jailbreak();assert.equal(e.launches,0);assert.equal(e.c.user.blockJailbreak,false);assert.match(e.alerts[0],/cache/);}
});
test('initialization and dispatch errors recover UI and cannot silently retry',async()=>{
 const boot=env();assert.equal(await boot.c.bxHostRuntime.prepare(()=>{throw Error('settings');}),false);await boot.c.jailbreak();assert.equal(boot.launches,0);
 const e=env({launchThrows:true});await e.c.bxHostRuntime.prepare(()=>{});await e.c.jailbreak();await e.c.jailbreak();assert.equal(e.launches,1);assert.equal(e.c.bxHostRuntime.state(),'failed');assert.equal(e.nodes['initial-screen'].classList.contains('hidden'),false);
});
test('leaving a run cancels transfers and history cannot execute it again',async()=>{
 const e=env();let cancellations=0;e.c.bxCancelPayloadTransfers=()=>cancellations++;
 await e.c.bxHostRuntime.prepare(()=>{});await e.c.jailbreak();e.emit('pagehide');e.emit('pageshow',{persisted:true});await e.c.jailbreak();
 assert.equal(cancellations,1);assert.equal(e.launches,1);assert.equal(e.c.bxHostRuntime.state(),'interrupted');assert.equal(e.nodes['initial-screen'].classList.contains('hidden'),false);
});
test('a completed page has one cancellable return to the host with the cache return guard',async()=>{
 const e=env({returnAfter:true});await e.c.bxHostRuntime.prepare(()=>{});await e.c.jailbreak();e.c.jailbreakSuccess();assert.equal(e.timers.length,1);
 e.timers[0].fn();assert.equal(e.c.location.href,'./?test=0&cacheReturn=1#section');
 const away=env({returnAfter:true});await away.c.bxHostRuntime.prepare(()=>{});await away.c.jailbreak();away.c.jailbreakSuccess();away.emit('pagehide');assert.equal(away.timers[0].cleared,true);away.emit('pageshow',{persisted:true});away.timers[0].fn();assert.equal(away.c.location.href,'unchanged');
});
test('a UI failure in the success callback is recovered without leaving a blank running state',async()=>{
 const e=env({successThrows:true});await e.c.bxHostRuntime.prepare(()=>{});await e.c.jailbreak();assert.doesNotThrow(()=>e.c.jailbreakSuccess());assert.equal(e.c.bxHostRuntime.state(),'failed');assert.equal(e.nodes['initial-screen'].classList.contains('hidden'),false);
});

test('cache entry navigation is settled before initialization may enable a launch',async()=>{
 const e=env();let finish;e.c.bxCacheEntryReady=new Promise(resolve=>finish=resolve);e.c.bxCacheEntryPending=true;
 const ready=e.c.bxHostRuntime.prepare(()=>{});await Promise.resolve();await e.c.jailbreak();assert.equal(e.launches,0);
 finish(false);assert.equal(await ready,false);assert.equal(e.c.bxHostRuntime.state(),'cache');
});
test('unsupported firmware and a stale asynchronous stage cannot override successful completion',async()=>{
 const e=env();e.c.isFirmwareSupported=()=>false;e.c.getPs4FwVersion=()=> '14.01';await e.c.bxHostRuntime.prepare(()=>{});await e.c.jailbreak();assert.equal(e.launches,0);
 const good=env();await good.c.bxHostRuntime.prepare(()=>{});await good.c.jailbreak();good.c.jailbreakSuccess();good.c.bxHostRuntime.fail(Error('late'));assert.equal(good.c.bxHostRuntime.state(),'completed');
});

test('abandoned asynchronous initialization never re-enables a restored page',async()=>{
 const e=env();let release;const waiting=new Promise(resolve=>release=resolve);const ready=e.c.bxHostRuntime.prepare(()=>waiting);
 await Promise.resolve();e.emit('pagehide');release();assert.equal(await ready,false);assert.equal(e.c.bxHostRuntime.state(),'interrupted');
});
