const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function env(ps4=true){
 const events={},nodes={},main={scrollTop:900};let cleanups=0,successes=0;
 for(const id of ['initial-screen','payloadsSection','exploit-main-screen']){
  const classes=new Set();nodes[id]={classList:{contains:k=>classes.has(k),remove:k=>classes.delete(k),add:k=>classes.add(k)},style:{display:'',removeProperty(k){delete this[k];}}};
 }
 const window={cleanUp(){cleanups++;nodes['initial-screen'].classList.add('hidden');nodes.payloadsSection.classList.add('hidden');return 'cleanup';},jailbreakSuccess(){successes++;return 'success';},addEventListener(k,fn){events[k]=fn;}};
 const c=vm.createContext({window,document:{getElementById:id=>nodes[id],querySelector:()=>main},isPS4Console:()=>ps4,lastScrollY:900,lastSection:'exploit'});
 vm.runInContext(fs.readFileSync('overrides/host-return.js','utf8'),c);
 return {window,events,nodes,main,c,get cleanups(){return cleanups;},get successes(){return successes;}};
}
test('completion restores initial and payload screens without rerunning or unlocking the run button',()=>{
 const e=env();assert.equal(e.window.cleanUp(),'cleanup');assert.equal(e.window.jailbreakSuccess(),'success');
 assert.equal(e.nodes['initial-screen'].classList.contains('hidden'),false);assert.equal(e.nodes.payloadsSection.classList.contains('hidden'),false);
 assert.equal(e.cleanups,1);assert.equal(e.successes,1);assert.equal(e.main.scrollTop,900);
});
test('persisted history return restores sections and resets stale scroll exactly without sending payloads',()=>{
 const e=env();e.window.cleanUp();e.window.jailbreakSuccess();e.nodes.payloadsSection.style.display='none';
 e.events.pageshow({persisted:true});e.events.pageshow({persisted:true});
 assert.equal(e.nodes.payloadsSection.style.display,undefined);assert.equal(e.main.scrollTop,0);assert.equal(e.c.lastScrollY,0);assert.equal(e.c.lastSection,'initial');
 assert.equal(e.cleanups,1);assert.equal(e.successes,1);
});
test('history events never reveal or modify an active chain',()=>{
 const e=env();e.window.cleanUp();e.events.pageshow({persisted:true});
 assert.equal(e.nodes['initial-screen'].classList.contains('hidden'),true);assert.equal(e.nodes.payloadsSection.classList.contains('hidden'),true);assert.equal(e.main.scrollTop,900);
});
test('normal opening and external browsers retain their existing visibility',()=>{
 const e=env();e.events.pageshow({persisted:false});assert.equal(e.main.scrollTop,900);
 const pc=env(false);pc.window.cleanUp();pc.window.jailbreakSuccess();pc.events.pageshow({persisted:true});assert.equal(pc.nodes['initial-screen'].classList.contains('hidden'),true);
});

test('completion corrects an out-of-range PS4 scroll offset',()=>{
 const e=env();e.main.scrollHeight=1000;e.main.clientHeight=800;e.window.cleanUp();e.window.jailbreakSuccess();assert.equal(e.main.scrollTop,0);
});
