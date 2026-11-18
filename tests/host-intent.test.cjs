const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function env(options={}){
 const session={payload_path:'/goldhen.bin',bxHostRuntimeSchema:'2'},saved={bareboneJB:'true',exploitChain:'7'};let now=1000;
 const c={window:{location:{pathname:options.path||'/exploit.html'}},document:{documentElement:{getAttribute(){return options.revision||'a'.repeat(40);}}},
  sessionStorage:{getItem:k=>session[k]===undefined?null:session[k],setItem(k,v){if(options.blocked)throw Error('blocked');session[k]=String(v);},removeItem(k){delete session[k];}},
  localStorage:{getItem:k=>saved[k]||null},getPs4FwVersion:()=> '13.52',user:{exploitChain:7},Date:class{getTime(){return now;}}};
 vm.createContext(c);vm.runInContext(fs.readFileSync('overrides/host-intent.js','utf8'),c);
 return{c,session,saved,advance(ms){now+=ms;}};
}
test('minimal host intent is valid only once and matches firmware, revision, chain and payload',()=>{
 const e=env();assert.equal(e.c.window.bxCreateHostIntent(),true);assert.equal(e.c.window.bxConsumeHostIntent(),true);assert.equal(e.c.window.bxConsumeHostIntent(),false);
 for(const field of ['revision','firmware','payload','chain']){const x=env();x.c.window.bxCreateHostIntent();const intent=JSON.parse(x.session.bxHostLaunchIntent);intent[field]='wrong';x.session.bxHostLaunchIntent=JSON.stringify(intent);assert.equal(x.c.window.bxConsumeHostIntent(),false);}
});
test('expired, missing and blocked intents cannot arm a restored minimal page',()=>{
 const e=env();assert.equal(e.c.window.bxConsumeHostIntent(),false);e.c.window.bxCreateHostIntent();e.advance(120001);assert.equal(e.c.window.bxConsumeHostIntent(),false);
 assert.equal(env({blocked:true}).c.window.bxCreateHostIntent(),false);
});
test('legacy attempt flags are retired once on main-page migration without deleting selected payload',()=>{
 const e=env({path:'/index.html'});delete e.session.bxHostRuntimeSchema;e.session.autoJbRetry='true';e.session.jailbreakNow='true';
 vm.runInContext(fs.readFileSync('overrides/host-intent.js','utf8'),e.c);assert.equal(e.session.autoJbRetry,undefined);assert.equal(e.session.jailbreakNow,undefined);assert.equal(e.session.payload_path,'/goldhen.bin');assert.equal(e.session.bxHostRuntimeSchema,'2');
});
