// Firmware routing and offline file inventory only. No chain or payload execution.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync('dist/index.html','utf8'),source=fs.readFileSync('dist/includes/js/firmware.js','utf8');
const dropdown=html.match(/<select[^>]*id="ps4FwSelect"[\s\S]*?<\/select>/)[0];
const versions=[...new Set(Array.from(dropdown.matchAll(/<option[^>]*value="([0-9]+\.[0-9]+)"/g),m=>m[1]))];
const files={0:'src/psfree-lapse/alert.mjs',1:'src/psfree-lapse/bundle.js',2:'src/badhoist/672kexploit.js',3:'src/cssfontface/main.js',4:'src/cssfontface/main.js',5:'src/slopkit/chain_lapse.js',6:'src/slopkit/chain_poops.js',7:'src/relapse/jb.js',8:'src/bpf-double-free/main.js',9:'src/slopkit-afterglow/jb.js'};
function firmware(fw){const c=vm.createContext({navigator:{userAgent:'Mozilla/5.0 (PlayStation 4/'+fw+') AppleWebKit/605.1.15'}});vm.runInContext(source,c);return c;}
test('all firmware choices map consistently to cache pages and cached chain files',()=>{
 const results=[];
 for(const fw of versions){
  const c=firmware(fw);assert.equal(c.getPs4FwVersion(),fw);
  const available=Array.from(c.getAvailableChains(fw)),selected=c.getDefaultChain(fw),supported=c.isFirmwareSupported(fw);
  assert.equal(supported,available.length>0,fw);
  if(!supported){assert.equal(selected,null,fw);results.push({firmware:fw,recognized:false});continue;}
  assert.ok(available.includes(selected),fw);
  const page=path.resolve('dist',c.getCachePage(fw));assert.ok(fs.existsSync(page),fw);
  const manifest=path.resolve(path.dirname(page),fs.readFileSync(page,'utf8').match(/manifest="([^"]+)"/)[1]);
  const entries=fs.readFileSync(manifest,'utf8').split('CACHE:')[1].split('NETWORK:')[0].split('\n');
  for(const id of available){const file=id===9&&fw==='14.02'?'src/slopkit-afterglow-1402/jb.js':files[id];assert.ok(fs.existsSync(path.join('dist',file)),fw+': '+file);assert.ok(entries.includes('../../../'+file),fw+': '+file);}
  results.push({firmware:fw,recognized:true,default_chain:c.FIRMWARE_RANGES.find(r=>r.id===selected).label});
 }
 assert.ok(results.filter(r=>r.recognized).length>=50);
 const revision=JSON.parse(fs.readFileSync('dist/release.json','utf8')).revision;
 fs.writeFileSync('diagnostics/firmware-results.json',JSON.stringify({revision,physical_ps4_tested:false,payloads_executed:false,results},null,2)+'\n');
});
test('unsupported boundaries remain rejected and 14.02 is the highest exact configured target',()=>{
 for(const fw of ['4.49','5.50','6.69','6.73','13.53','14.01','14.03','14.04','15.00']){
  const c=firmware(fw);assert.equal(c.isFirmwareSupported(fw),false,fw);assert.equal(c.getDefaultChain(fw),null,fw);
 }
 const c=firmware('14.00');assert.equal(c.getDefaultChain('14.00'),c.EXPLOIT_CHAINS.SLOPKIT_AFTERGLOW);
 assert.equal(Math.max(...c.FIRMWARE_RANGES.map(r=>r.max)),14.02);
});
