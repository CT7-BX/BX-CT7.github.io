const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('approved GTA theme is included after existing styles and cached for every firmware',()=>{
 const html=fs.readFileSync('dist/index.html','utf8');
 assert.equal((html.match(/href="\.\/includes\/css\/gta-vi.css"/g)||[]).length,1);
 assert.ok(html.indexOf('includes/css/gta-vi.css')>html.indexOf('includes/css/minimal.css'));
 assert.equal(fs.readFileSync('dist/includes/css/gta-vi.css','utf8'),fs.readFileSync('overrides/gta-vi.css','utf8'));
 for(const name of fs.readdirSync('dist/includes/caches/manifest'))if(name.endsWith('.manifest'))assert.match(fs.readFileSync('dist/includes/caches/manifest/'+name,'utf8'),/includes\/css\/gta-vi.css/);
});
test('theme contains only paint properties, preserving layout and original live loaders',()=>{
 const css=fs.readFileSync('dist/includes/css/gta-vi.css','utf8').replace(/\/\*[\s\S]*?\*\//g,'');
 const allowed=new Set(['background','background-image','color','text-shadow','border-color','box-shadow','fill','filter','outline-color','accent-color']);
 for(const block of css.matchAll(/\{([^}]*)\}/g))for(const declaration of block[1].split(';')){
  if(!declaration.trim())continue;assert.ok(allowed.has(declaration.split(':')[0].trim()),declaration);
 }
 const html=fs.readFileSync('dist/index.html','utf8');
 assert.match(html,/includes\/js\/deliverPayload.js/);assert.match(html,/includes\/js\/host-return.js/);
 assert.doesNotMatch(html,/PS4 13.52<\/p>|fancheck=a1e111d/);
});
test('diagnostics button has explicit light text on its specific dark background',()=>{
 const css=fs.readFileSync('dist/includes/css/gta-vi.css','utf8');
 const rule=css.match(/#settings-popup #bx-dev-button\{([^}]*)\}/);assert.ok(rule);
 const foreground=rule[1].match(/(?:^|;)color:(#[a-f0-9]{6})!important/)[1];
 const background=rule[1].match(/background:(#[a-f0-9]{6})!important/)[1];
 function luminance(hex){const c=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4));return c[0]*0.2126+c[1]*0.7152+c[2]*0.0722;}
 const a=luminance(foreground),b=luminance(background);assert.ok((Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)>=7);
});
