const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function environment(){
 let hidden=true,calls=0;const events={},nodes={};
 function node(){return {attributes:{},setAttribute(k,v){this.attributes[k]=v;},focus(){document.activeElement=this;},offsetWidth:40,offsetHeight:40,tabIndex:0};}
 const opener=node(),first=node(),close=node(),skipped={...node(),offsetWidth:0,offsetHeight:0,getClientRects(){return[];}};
 const title={};const panel={...node(),querySelector(){return title;},querySelectorAll(){return[first,skipped,close];},contains(el){return[first,close,skipped].includes(el);}};
 nodes['settings-popup']=panel;nodes['settings-popup-overlay']={classList:{contains(){return hidden;}}};nodes['close-settings']=close;nodes['bx-dev-overlay']={style:{display:'none'}};
 const document={readyState:'complete',body:{style:{overflow:'auto'}},activeElement:opener,getElementById(id){return nodes[id];},addEventListener(name,fn){events[name]=fn;}};
 const window={settingsPopup(){calls++;hidden=!hidden;return 'original-result';}};
 vm.runInNewContext(fs.readFileSync('overrides/settings-accessibility.js','utf8'),{window,document});
 return {window,document,panel,first,close,opener,nodes,events,get calls(){return calls;}};
}
test('opening and closing retain original action and restore focus and scrolling',()=>{
 const e=environment();assert.equal(e.window.settingsPopup(),'original-result');assert.equal(e.calls,1);assert.equal(e.document.activeElement,e.close);assert.equal(e.document.body.style.overflow,'hidden');assert.equal(e.panel.attributes.role,'dialog');
 e.window.settingsPopup();assert.equal(e.calls,2);assert.equal(e.document.activeElement,e.opener);assert.equal(e.document.body.style.overflow,'auto');assert.equal(e.panel.attributes['aria-hidden'],'true');
});
test('Tab stays within visible settings controls and Escape closes the dialog',()=>{
 const e=environment();e.window.settingsPopup();let prevented=0;
 const key=(code,shift=false)=>e.events.keydown({keyCode:code,shiftKey:shift,preventDefault(){prevented++;}});
 key(9);assert.equal(e.document.activeElement,e.first);key(9,true);assert.equal(e.document.activeElement,e.close);assert.equal(prevented,2);
 key(27);assert.equal(e.document.activeElement,e.opener);assert.equal(e.calls,2);
});
test('settings keyboard listener leaves the diagnostic dialog in control',()=>{
 const e=environment();e.window.settingsPopup();e.nodes['bx-dev-overlay'].style.display='flex';e.events.keydown({keyCode:27,preventDefault(){throw Error('Must not intercept diagnostic keys');}});assert.equal(e.calls,1);
});

test('an Escape already handled by a nested dialog cannot close settings too',()=>{
 const e=environment();e.window.settingsPopup();
 e.events.keydown({keyCode:27,defaultPrevented:true,preventDefault(){throw Error('Already handled');}});
 assert.equal(e.calls,1);assert.equal(e.panel.attributes['aria-hidden'],'false');
});
