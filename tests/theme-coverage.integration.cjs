const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const pages=['index.html','cache.html','exploit.html','bx-hen/store/index.html'];
test('host-facing pages share the preference and coverage stylesheet with correct relative paths',()=>{
 for(const page of pages){
  const html=fs.readFileSync('dist/'+page,'utf8');
  for(const [kind,name] of [['href','gta-vi.css'],['href','theme-coverage.css'],['src','theme-choice.js']]){
   const refs=Array.from(html.matchAll(new RegExp(kind+'="([^"]*'+name.replace('.','\\.')+'\\?v=[a-f0-9]{16})"','g')),m=>m[1]);
   assert.equal(refs.length,1,page+' '+name);const file=path.resolve('dist',path.dirname(page),refs[0].split('?')[0]);
   assert.ok(fs.existsSync(file),file);assert.ok(html.indexOf(refs[0])<html.indexOf('<body'),page);
  }
  assert.equal((html.match(/id="bx-theme-stylesheet"/g)||[]).length,1,page);
 }
});
test('shared coverage supports all host dialogs in both themes without layout changes',()=>{
 const css=fs.readFileSync('dist/includes/css/theme-coverage.css','utf8');assert.equal(css,fs.readFileSync('overrides/theme-coverage.css','utf8'));
 for(const theme of ['original','gta'])for(const selector of ['#bx-dev-overlay .bx-dev-card','#about-popup','#theme-popup','#choose-fanThreshold','#bx-hen-overlay .bx-hen-panel','.cache-screen'])assert.ok(css.includes('html[data-bx-theme="'+theme+'"] '+selector),theme+' '+selector);
 const clean=css.replace(/\/\*[\s\S]*?\*\//g,'');const allowed=new Set(['background','color','border-color','outline-color']);
 for(const block of clean.matchAll(/\{([^}]*)\}/g))for(const declaration of block[1].split(';'))if(declaration.trim())assert.ok(allowed.has(declaration.split(':')[0].trim()),declaration);
});
test('offline manifests use the same content-versioned shared appearance as the page',()=>{
 const html=fs.readFileSync('dist/index.html','utf8');const ref=html.match(/href=".\/(includes\/css\/theme-coverage.css\?v=[a-f0-9]{16})"/)[1];
 const hash=crypto.createHash('sha256').update(fs.readFileSync('dist/includes/css/theme-coverage.css')).digest('hex').slice(0,16);assert.ok(ref.endsWith('?v='+hash));
 for(const name of fs.readdirSync('dist/includes/caches/manifest'))if(name.endsWith('.manifest'))assert.ok(fs.readFileSync('dist/includes/caches/manifest/'+name,'utf8').split('\n').includes('../../../'+ref));
});
test('shared diagnostic palettes keep readable text and button contrast',()=>{
 function lum(hex){const v=hex.match(/../g).map(s=>parseInt(s,16)/255).map(x=>x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4));return .2126*v[0]+.7152*v[1]+.0722*v[2];}
 const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
 for(const [text,bg] of [['ededed','181818'],['c6c6c6','181818'],['ffe7f2','24152f'],['d3bedc','24152f'],['25142f','e887b5'],['25142f','a993d8'],['ffffff','292929']])assert.ok(ratio(text,bg)>=4.5,text+' '+bg);
});
