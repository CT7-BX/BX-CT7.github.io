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

test('FAN requires a responding payload server and cannot silently restart the exploit on HTTPS',()=>{
 const e=env();let attempts=0,alerts=0;
 Object.assign(e.c,{
  user:{ip:'127.0.0.1',ps4Fw:'13.52'},isPS4Console:()=>true,isHttps:()=>true,isFirmwareSupported:()=>true,
  getPs4FwVersion:()=> '13.52',log(){},alert(){alerts++;},
  window:{lang:{payloadLoaderSending:'Sending {payload}',payloadLoaderSendFailed:'Failed {payload}',binLoaderNotDetected:'Loader unavailable',payloadRequiresPayloadLoader:'Requires loader'}},
  jailbreak(){attempts++;},storage:{session:{set(){throw Error('Must not prepare another exploit');}}}
 });
 e.c.Loadpayloadlocal('/fan.bin','Fan Threshold','FanThreshold70',true);
 e.requests[0].respond();assert.equal(e.requests.length,2);e.timers[1].fn();
 assert.equal(attempts,0);assert.equal(alerts,1);assert.equal(e.timers.length,2);
 e.timers[e.timers.length-1].fn();assert.equal(alerts,1);assert.equal(attempts,0);
 e.requests[1].respond(200);assert.equal(attempts,0);assert.equal(e.requests.length,2);
});
test('all FAN temperatures carry the required-loader flag through the original router',()=>{
 const nodes={overlay:{id:'overlay'}},routed=[];
 const c=vm.createContext({ui:{chooseFanThresholdOverlay:nodes.overlay},payloadsPath:'./includes/payloads/Bins/',
  isPS4Console:()=>true,toggleVisibility(){},storage:{session:{remove(){}}},payloadRouter(p){routed.push(p);},alert(text){throw Error('Unexpected alert: '+text);}});
 vm.runInContext(fs.readFileSync('dist/includes/js/payloadsHandler.js','utf8'),c);
 for(const temp of ['60','70','80','85'])c.loadFanThreshold(temp);
 assert.equal(routed.length,4);for(const p of routed){assert.equal(p.needsPayloadLoader,true);assert.match(p.src,/fan-thresholds-reviewed\/ps4-fan-threshold(60|70|80|85).bin$/);}
});

test('all revised FAN payloads have the reviewed hashes and are available offline for 13.52',()=>{
 const m=JSON.parse(fs.readFileSync('dist/payload-update.json'));assert.equal(m.fan_revision,'af65b34d4a4899c6fd7c07d074bdb52e20092060');
 const cache=fs.readFileSync('dist/includes/caches/manifest/1302-1352.manifest','utf8');
 for(const t of ['60','70','80','85']){
  const file='includes/payloads/Bins/fan-thresholds-reviewed/ps4-fan-threshold'+t+'.bin';
  assert.equal(fs.statSync('dist/'+file).size,9024);assert.ok(m.files[file]);assert.ok(cache.includes('../../../'+file));
  assert.equal(fs.statSync('dist/includes/payloads/Bins/fan-thresholds/ps4-fan-threshold'+t+'.bin').size,8992);
 }
});
test('FAN 70 follows the complete selector-to-loader path on 13.52 without invoking jailbreak',()=>{
 const e=env();const logs=[];
 Object.assign(e.c,{
  commonMax:14,user:{ip:'127.0.0.1',ps4Fw:'13.52'},ui:{chooseFanThresholdOverlay:{id:'fan'}},payloadsPath:'./includes/payloads/Bins/',
  isPS4Console:()=>true,isPayloadSupported:()=>true,getPs4FwVersion:()=> '13.52',toggleVisibility(){},
  storage:{session:{remove(){}}},jailbreak(){throw Error('FAN must not restart jailbreak');},
  log(text){logs.push(text);},alert(text){throw Error('Unexpected alert: '+text);},
  window:{lang:{payloadLoaderSending:'Sending {payload}',payloadLoaderSendSuccess:'Sent {payload}'}}
 });
 vm.runInContext(fs.readFileSync('dist/includes/js/payloadsHandler.js','utf8'),e.c);
 e.c.loadFanThreshold('70');assert.match(e.requests[0].url,/fan-thresholds-reviewed\/ps4-fan-threshold70.bin$/);
 e.requests[0].respond();assert.equal(e.requests[1].url,'http://127.0.0.1:9090/');e.requests[1].respond(202);
 assert.match(logs.join('\n'),/Sent Fan Threshold \(70°C\)/);assert.equal(e.requests.length,2);
});
