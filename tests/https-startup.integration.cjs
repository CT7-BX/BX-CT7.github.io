// Evaluate only the early presentation preferences; no loader or exploit code.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

test('first PS4 HTTPS visit stays on BX-CT7 without a transport confirmation',()=>{
 const html=fs.readFileSync('dist/index.html','utf8');
 const source=Array.from(html.matchAll(/<script>([\s\S]*?)<\/script>/g),m=>m[1]).find(s=>s.includes('// Prevent "Theme Flash"'));
 assert.ok(source,'Early preference script remains present');
 for(const savedChoice of [null,'1']){
  const stored={dontHTTPS:savedChoice},links={};
  const location={protocol:'https:',hostname:'ct7-bx.github.io',href:'https://ct7-bx.github.io/BX-CT7.github.io/'};
  const window={location};
  vm.runInNewContext(source,{
   window, navigator:{userAgent:'Mozilla/5.0 (PlayStation 4/13.52) AppleWebKit/605.1.15'},
   localStorage:{getItem(key){return stored[key]||null;},setItem(key,value){stored[key]=value;}},
   document:{getElementById(id){return {setAttribute(key,value){links[id]=value;}};}},
   confirm(){throw Error('A first-visit confirmation must not interrupt startup');}
  });
  assert.equal(location.href,'https://ct7-bx.github.io/BX-CT7.github.io/');
  assert.equal(window.abortLoading,undefined);
  assert.ok(links['main-stylesheet']);assert.ok(links['color-stylesheet']);
 }
 assert.doesNotMatch(source,/switch to http instead|dontHTTPS|http:\/\/webkitty\.arabpixel\.net/);
});
