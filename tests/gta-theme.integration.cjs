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
