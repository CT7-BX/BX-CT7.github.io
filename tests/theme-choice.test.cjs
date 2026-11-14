const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function env(options={}){
 const events={},windowEvents={},attributes={},sheet={},feedback={textContent:''},values={};
 if(options.saved!==undefined)values['bx-appearance-v1']=options.saved;
 const radios=[{name:'bx-appearance',value:'original'},{name:'bx-appearance',value:'gta'}];
 const document={readyState:options.loading?'loading':'complete',documentElement:{setAttribute(k,v){attributes[k]=v;}},
  getElementById(id){return id==='bx-theme-stylesheet'?sheet:id==='bx-theme-feedback'?feedback:null;},querySelectorAll(){return radios;},addEventListener(k,fn){events[k]=fn;}};
 vm.runInNewContext(fs.readFileSync('overrides/theme-choice.js','utf8'),{document,window:{addEventListener(k,fn){windowEvents[k]=fn;}},
  localStorage:{getItem(k){if(options.readBlocked)throw Error('blocked');return values[k]||null;},setItem(k,v){if(options.writeBlocked)throw Error('blocked');values[k]=v;}}});
 return {events,windowEvents,attributes,sheet,feedback,values,radios,choose(value){events.change({target:{name:'bx-appearance',value,checked:true}});}};
}
test('existing appearance remains GTA and saved original is applied before DOM readiness',()=>{
 const e=env();assert.equal(e.sheet.media,'all');assert.equal(e.radios[1].checked,true);
 const original=env({saved:'original',loading:true});assert.equal(original.sheet.media,'not all');assert.equal(original.events.change,undefined);
 original.events.DOMContentLoaded();assert.equal(original.radios[0].checked,true);
});
test('theme switches immediately and saves without changing other preferences',()=>{
 const e=env();e.choose('original');assert.equal(e.sheet.media,'not all');assert.equal(e.attributes['data-bx-theme'],'original');
 assert.equal(e.values['bx-appearance-v1'],'original');assert.match(e.feedback.textContent,/salvo/);e.choose('gta');assert.equal(e.sheet.media,'all');assert.equal(e.radios[1].checked,true);
 assert.deepEqual(Object.keys(e.values),['bx-appearance-v1']);
});
test('blocked storage never prevents appearance changes or falsely claims saving',()=>{
 const e=env({readBlocked:true,writeBlocked:true});e.choose('original');assert.equal(e.sheet.media,'not all');assert.match(e.feedback.textContent,/não permitiu salvar/);
});
test('invalid preferences and unrelated controls cannot affect the theme',()=>{
 const e=env({saved:'../../other'});e.choose('bad');e.events.change({target:{name:'goldhen',value:'original',checked:true}});
 assert.equal(e.sheet.media,'all');assert.equal(e.attributes['data-bx-theme'],'gta');assert.equal(e.values['bx-appearance-v1'],'../../other');
});
test('storage changes synchronize other tabs without saving back',()=>{
 const e=env({writeBlocked:true});e.windowEvents.storage({key:'bx-appearance-v1',newValue:'original'});assert.equal(e.sheet.media,'not all');
 e.windowEvents.storage({key:'other',newValue:'gta'});assert.equal(e.sheet.media,'not all');e.windowEvents.storage({key:null,newValue:null});assert.equal(e.sheet.media,'all');
});
