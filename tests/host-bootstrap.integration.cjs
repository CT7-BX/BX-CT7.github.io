// Compile only host initialization; mock every chain/network function.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
test('native and legacy settings use one preparation promise and dispatch only after all preferences',async()=>{
 for(const name of ['jailbreak.js','jailbreak-legacy.js']){
  const source=fs.readFileSync('dist/includes/js/'+name,'utf8'),start=source.indexOf('function loadSettings() {'),end=source.indexOf(name==='jailbreak.js'?'async function ipGuess()':'function ipGuess()',start);
  const calls=[];let release;const language=new Promise(resolve=>release=resolve);
  const c={window:{bxHostRuntime:{prepare(operation){calls.push('prepare');return Promise.resolve().then(operation).then(()=>true);}}},Promise};
  for(const fn of ['CheckFW','loadJbFlavor','loadTheme','loadLayout','renderPayloads','loadAdvancedPayloads','loadLastTab','loadGoldHENVer','getReloadAfterJb','updateBareboneJB','loadExploitChain','autoJailbreak'])c[fn]=()=>calls.push(fn);
  c.payloadsList=[];c.initLanguage=()=>language;vm.createContext(c);vm.runInContext(source.slice(start,end),c);
  const first=c.loadSettings(),second=c.loadSettings();assert.equal(first,second);await Promise.resolve();assert.equal(calls.includes('autoJailbreak'),false);
  release();await first;assert.ok(calls.indexOf('loadExploitChain')<calls.indexOf('autoJailbreak'));assert.equal(calls.filter(x=>x==='autoJailbreak').length,1);
 }
});
test('all critical host scripts have exact content identities and consistent offline entries',()=>{
 const data=JSON.parse(fs.readFileSync('dist/host-runtime.json'));assert.equal(data.schema_version,2);assert.equal(data.cache_protocol,2);assert.equal(data.static_markup_and_styles_preserved,true);assert.equal(data.physical_ps4_tested,false);
 for(const [name,ref] of Object.entries(data.host_assets)){
  const hash=crypto.createHash('sha256').update(fs.readFileSync('dist/'+name)).digest('hex').slice(0,16);assert.equal(ref,name+'?bxv='+hash);
  for(const manifest of fs.readdirSync('dist/includes/caches/manifest'))if(manifest.endsWith('.manifest')){
   const text=fs.readFileSync('dist/includes/caches/manifest/'+manifest,'utf8');assert.ok(!text.split('\n').includes('../../../'+name));
  }
 }
 const html=fs.readFileSync('dist/index.html','utf8');assert.ok(html.includes('./'+data.host_assets['includes/js/host-return.js']));
 const cache=fs.readFileSync('dist/cache.html','utf8');assert.ok(cache.includes('data-bx-cache-revision="'+data.revision+'"'));
 const minimal=fs.readFileSync('dist/exploit.html','utf8');assert.match(minimal,/bxConsumeHostIntent\(\)/);assert.match(minimal,/if \(window.bxHostMinimalArmed && exploitChain/);
});
