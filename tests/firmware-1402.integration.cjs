// UI/routing, metadata and bytes only; no exploit or payload is executed.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
function host(firmware='14.02',flavor='GoldHEN',savedVersion='GHv2.4b18.12'){
 const values={GHVer:savedVersion},session={},nodes={},visible={},alerts=[];
 const user={ps4Fw:firmware,currentJbFlavor:flavor};
 const storage={set(k,v){values[k]=v;},getString(k,f){return values[k]===undefined?f:values[k];},session:{set(k,v){session[k]=v;},getString(k,f){return session[k]===undefined?f:session[k];}}};
 const c=vm.createContext({window:{lang:{}},navigator:{userAgent:'Mozilla/5.0 (PlayStation 4/'+firmware+') AppleWebKit/605.1.15'},user,storage,commonMax:14,devMode:false,
  document:{getElementById(id){return nodes[id]||(nodes[id]={id});},querySelector(s){return nodes[s]||(nodes[s]={checked:false});},querySelectorAll(){return[];}},
  toggleVisibility(id,v){visible[id]=v;},alert(s){alerts.push(s);},confirm(){throw Error('No experimental selection expected');}});
 for(const file of ['firmware.js','HENs.js'])vm.runInContext(fs.readFileSync('dist/includes/js/'+file,'utf8'),c);
 return {c,values,session,nodes,visible,alerts,user};
}
test('14.02 is recognized exactly and keeps 14.00 routing intact',()=>{
 const h=host();assert.equal(h.c.getDefaultChain('14.02'),h.c.EXPLOIT_CHAINS.SLOPKIT_AFTERGLOW);
 assert.equal(h.c.getCachePage('14.02'),'./includes/caches/cache1402.html');
 assert.equal(h.c.getCachePage('14.00'),'./includes/caches/cache1400.html');
 for(const fw of ['14.01','14.03','14.04'])assert.equal(h.c.isFirmwareSupported(fw),false,fw);
});
test('GoldHEN 14.02 uses only the separate reviewed binary and normalizes stale versions',()=>{
 const h=host();h.c.loadJbFlavor();h.c.loadGoldHENVer();
 assert.equal(h.session.payload_path,'./includes/payloads/HEN/goldhen_v2.4b18.13_fw1402.bin');assert.equal(h.values.GHVer,'GHv2.4b18.13');
 assert.equal(h.nodes['input[name="goldhen"][value="GHv2.4b18.13"]'].checked,true);assert.equal(h.alerts.length,0);
 h.c.setGoldHENVer('GHv2.4b18.12');assert.equal(h.values.GHVer,'GHv2.4b18.13');assert.equal(h.alerts.length,1);
});
test('PS4HEN 14.02 selects its separate binary while old firmware selections are unchanged',()=>{
 const h=host('14.02','PS4HEN');h.c.loadGoldHENVer();assert.equal(h.session.payload_path,'./includes/payloads/HEN/PS4HEN_fw1402.bin');
 for(const fw of ['9.00','13.52','14.00']){
  const old=host(fw,'GoldHEN','GHv2.4b18.13');old.c.GoldHEN();assert.equal(old.session.payload_path,'./includes/payloads/HEN/goldhen_v2.4b18.13.bin');old.c.PS4HEN();assert.equal(old.session.payload_path,'./includes/payloads/HEN/PS4HEN.bin');
 }
});
test('stale experimental HEN settings do not select an unvalidated HEN on 14.02',()=>{
 const h=host('14.02','nexHEN');h.c.loadJbFlavor();h.c.loadGoldHENVer();h.c.updateHenFlavorVisibility('14.02');
 assert.equal(h.user.currentJbFlavor,'GoldHEN');assert.equal(h.visible['nexHEN-label-initial'],false);assert.equal(h.visible['PS4HEN-label-initial'],true);
 assert.match(h.session.payload_path,/fw1402\.bin$/);h.c.saveJbFlavor('hen','nexHEN');assert.equal(h.user.currentJbFlavor,'GoldHEN');
});
test('loading version preferences preserves an explicitly selected custom payload',()=>{
 const h=host();h.session.payload_path='./custom/example.bin';h.c.loadGoldHENVer();assert.equal(h.session.payload_path,'./custom/example.bin');
});
test('14.02 offline manifest contains the isolated chain, both HENs and its own kernel patch',()=>{
 const text=fs.readFileSync('dist/includes/caches/manifest/1402.manifest','utf8');const entries=text.split('CACHE:')[1].split('NETWORK:')[0].split('\n');
 for(const name of ['afterglow.js','core.js','int64.js','jb.js','mem.js','ps4_offsets.js'])assert.ok(entries.includes('../../../src/slopkit-afterglow-1402/'+name),name);
 for(const name of ['src/kpatches/1402.bin','includes/payloads/HEN/PS4HEN_fw1402.bin','includes/payloads/HEN/goldhen_v2.4b18.13_fw1402.bin'])assert.ok(entries.includes('../../../'+name),name);
 assert.ok(!entries.includes('../../../src/kpatches/1400.bin'));
 assert.match(fs.readFileSync('dist/includes/caches/cache1402.html','utf8'),/manifest\/1402\.manifest/);
});
test('all imported components match original author Git blob hashes and metadata',()=>{
 const metadata=JSON.parse(fs.readFileSync('dist/firmware-1402.json','utf8'));assert.equal(metadata.physical_ps4_tested,false);
 for(const [file,expected] of Object.entries(metadata.files)){
  const data=fs.readFileSync('dist/'+file),actual=crypto.createHash('sha1').update(Buffer.from('blob '+data.length+'\0')).update(data).digest('hex');assert.equal(actual,expected,file);
 }
 const patch=fs.statSync('dist/src/kpatches/1402.bin').size;assert.ok(patch>0&&patch<=0x400-0xc0);
});
test('both native and legacy launch controllers route only 14.02 to the isolated module',()=>{
 for(const file of ['jailbreak.js','jailbreak-legacy.js']){
  const source=fs.readFileSync('dist/includes/js/'+file,'utf8');
  const target=source.match(/getScript\((\(getPs4FwVersion\(\) === "14.02" \? "src\/slopkit-afterglow-1402\/jb\.js" : "src\/slopkit-afterglow\/jb\.js"\))/)[1];
  for(const fw of ['13.52','14.00','14.02'])assert.equal(vm.runInNewContext(target,{getPs4FwVersion(){return fw;}}),fw==='14.02'?'src/slopkit-afterglow-1402/jb.js':'src/slopkit-afterglow/jb.js');
 }
});
