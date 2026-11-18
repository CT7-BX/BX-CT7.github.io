const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function env(){const scripts=[],timers=[],failures=[];let state='running';const window={bxHostRuntime:{state:()=>state,fail:e=>failures.push(e.message)}};
 const c={window,Promise,document:{createElement(){return{};},body:{appendChild(s){scripts.push(s);}}},
 setTimeout(fn,ms){timers.push({fn,ms,cleared:false});return timers.length;},clearTimeout(id){timers[id-1].cleared=true;}};
 vm.createContext(c);vm.runInContext(fs.readFileSync('overrides/script-loader.js','utf8'),c);return{c,window,scripts,timers,failures,interrupt(){state='interrupted';}};}
test('concurrent script requests share one script and preserve module/classic behavior',async()=>{
 const e=env();const first=e.c.getScript('/module.js',true),second=e.c.getScript('/module.js',true);assert.equal(first,second);assert.equal(e.scripts.length,1);assert.equal(e.scripts[0].type,'module');assert.equal(e.scripts[0].async,false);e.scripts[0].onload();await first;assert.equal(e.timers[0].cleared,true);
});
test('script timeout reports once and a late load cannot resolve the failed request',async()=>{
 const e=env();const p=e.c.getScript('/late.js',false),rejected=assert.rejects(p,/limite de espera/);e.timers[0].fn();e.scripts[0].onload();await rejected;assert.equal(e.failures.length,1);
});
test('navigation interruption cannot continue a deferred script stage',async()=>{
 const e=env();const p=e.c.getScript('/stage.js',false),rejected=assert.rejects(p,/interrompido/);e.interrupt();e.scripts[0].onload();await rejected;
});
test('legacy readiness flag remains compatible but has a finite wait',async()=>{
 const e=env();const p=e.c.loadScript('/legacy.js',false);e.scripts[0].onload();await Promise.resolve();e.window.script_loaded=1;e.timers[e.timers.length-1].fn();await p;
 const stalled=env();const wait=stalled.c.loadScript('/legacy.js',false);const rejected=assert.rejects(wait,/não sinalizou/);stalled.scripts[0].onload();await Promise.resolve();
 let n=1;while(n<stalled.timers.length && n<1300){stalled.timers[n++].fn();}await rejected;assert.equal(stalled.failures.length,1);
});
