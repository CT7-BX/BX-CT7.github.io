// Host network simulation only: never executes received payloads.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
function env(options={}){
 const requests=[],timers=[],calls=[];
 class XHR {
  constructor(){if(options.constructorThrows)throw Error('blocked');this.status=0;this.readyState=0;requests.push(this);}
  open(method,url){this.method=method;this.url=url;if(options.openThrows)throw Error('blocked');}
  setRequestHeader(){}
  send(data){this.data=data;if(options.sendThrows)throw Error('blocked');}
  abort(){this.aborted=true;this.status=0;if(this.onabort)this.onabort({});}
  respond(status=200,bytes=4){this.readyState=4;this.status=status;this.response=new ArrayBuffer(bytes);this.responseText='ok';this.onload({});}
 }
 const c=vm.createContext({XMLHttpRequest:XHR,Uint8Array,ArrayBuffer,
  setTimeout(fn,ms){timers.push({fn,ms,cleared:false});return timers.length;},clearTimeout(id){timers[id-1].cleared=true;}});
 vm.runInContext(fs.readFileSync('dist/includes/js/deliverPayload.js','utf8'),c);
 return {c,requests,timers,calls,callback(...args){calls.push(args);}};
}
test('successful download returns original bytes once and clears deadline',()=>{
 const e=env();e.c.getPayload('/file.bin',e.callback);e.requests[0].respond();
 assert.equal(e.calls.length,1);assert.equal(e.calls[0][0],e.requests[0]);assert.equal(e.timers[0].cleared,true);
 e.requests[0].onerror({});e.timers[0].fn();assert.equal(e.calls.length,1);
});
test('download timeout cancels before callback and late success cannot resend',()=>{
 const e=env();e.c.getPayload('/file.bin',(...args)=>{assert.equal(e.requests[0].aborted,true);e.callback(...args);});
 e.timers[0].fn();assert.equal(e.calls[0][0],null);e.requests[0].respond();assert.equal(e.calls.length,1);
});
test('construction, opening and sending failures settle exactly once',()=>{
 for(const opt of ['constructorThrows','openThrows','sendThrows']){
  const e=env({[opt]:true});assert.doesNotThrow(()=>e.c.getPayload('/file.bin',e.callback));assert.equal(e.calls.length,1);assert.equal(e.calls[0][0],null);
 }
});
test('empty downloads are refused and 404 status is preserved for the host error message',()=>{
 const empty=env();empty.c.getPayload('/empty.bin',empty.callback);empty.requests[0].respond(200,0);assert.equal(empty.calls[0][0],null);
 const missing=env();missing.c.getPayload('/missing.bin',missing.callback);missing.requests[0].respond(404);assert.equal(missing.calls[0][0].status,404);
});
test('POST timeout aborts once without retrying and late events cannot claim success',()=>{
 const e=env();const data=new Uint8Array([1,2,3]);e.c.sendPayloadWithTimeout('/loader',data,5000,e.callback);
 assert.equal(e.requests[0].data,data);assert.equal(e.timers[0].ms,5000);e.timers[0].fn();e.requests[0].respond(202);
 assert.equal(e.calls.length,1);assert.equal(e.calls[0][0],false);assert.equal(e.requests.length,1);
});
test('POST accepts 200/202 but not HTTP errors',()=>{
 for(const status of [200,202,404,500]){const e=env();e.c.sendPayloadWithTimeout('/loader',new Uint8Array([1]),5000,e.callback);e.requests[0].respond(status);assert.equal(e.calls[0][0],status===200||status===202);}
});
test('ELF download failure never starts a POST, and successful ELF transfer keeps exact bytes',()=>{
 const e=env();e.c.loadAndSend('/file.elf',e.callback);e.requests[0].respond(200,0);assert.equal(e.requests.length,1);assert.equal(e.calls[0][0],0);
 const ok=env();ok.c.loadAndSend('/file.elf',ok.callback);ok.requests[0].respond();assert.equal(ok.requests.length,2);assert.equal(ok.requests[1].data.buffer,ok.requests[0].response);
 ok.requests[1].respond(202);assert.equal(ok.calls[0][0],202);
});
test('new binary matches pinned source and every existing GoldHEN cache includes it',()=>{
 const m=JSON.parse(fs.readFileSync('dist/payload-update.json'));assert.equal(m.physical_ps4_tested,false);
 for(const [file,hash] of Object.entries(m.files)){const b=fs.readFileSync('dist/'+file);assert.equal(crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex'),hash);}
 for(const file of fs.readdirSync('dist/includes/caches/manifest'))if(file.endsWith('.manifest')){
  const text=fs.readFileSync('dist/includes/caches/manifest/'+file,'utf8');if(text.includes('goldhen_v2.4b18.13'))assert.match(text,/goldhen_v2\.4b18\.14.bin/);
 }
});

test('return recovery is included once in the page and available in all offline manifests',()=>{
 const html=fs.readFileSync('dist/index.html','utf8');assert.equal((html.match(/src=".\/includes\/js\/host-return.js"/g)||[]).length,1);
 assert.equal(fs.readFileSync('dist/includes/js/host-return.js','utf8'),fs.readFileSync('overrides/host-return.js','utf8'));
 for(const name of fs.readdirSync('dist/includes/caches/manifest'))if(name.endsWith('.manifest'))assert.match(fs.readFileSync('dist/includes/caches/manifest/'+name,'utf8'),/includes\/js\/host-return.js/);
});
