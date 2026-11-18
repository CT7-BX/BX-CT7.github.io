// Build-time compatibility catalog. Evaluates firmware/selection definitions in
// an isolated VM only; never loads a chain, transmits a payload or uses the network.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

function parseOptions(html, id, label) {
  const pattern = new RegExp('<select\\b[^>]*id="' + id + '"[^>]*>[\\s\\S]*?<\\/select>', 'i');
  const part = html.match(pattern);
  if (!part) throw Error('Missing ' + label + ' selector');
  const values = Array.from(part[0].matchAll(/<option\b[^>]*value="([0-9]{1,2}\.[0-9]{2})"/g), m => m[1]);
  if (values.length < 50 || values.length > 130 || new Set(values).size !== values.length)
    throw Error('Incomplete or duplicate firmware option list');
  return values;
}
function selectedGoldHEN(html) {
  const versions = Array.from(html.matchAll(/<input\b[^>]*name="goldhen"[^>]*value="(GHv2\.4b18\.[0-9]{1,2})"/g), m=>m[1]);
  if (versions.length < 7 || versions.length > 25 || new Set(versions).size !== versions.length)
    throw Error('Incomplete GoldHEN radio choices');
  return versions;
}
function contextFor(fw, firmware, hen) {
  const values = {}, session = {}, notifications = [];
  const ctx = vm.createContext({
    navigator: {userAgent:'Mozilla/5.0 (PlayStation 4/' + fw + ') AppleWebKit/605.1.15'},
    user: {ps4Fw:fw, currentJbFlavor:'GoldHEN'},
    commonMax:14, devMode:false, window:{lang:{}},
    storage:{
      set(k,v){values[k]=v;}, getString(k,def){return values[k]===undefined?def:values[k];},
      session:{set(k,v){session[k]=v;},getString(k,def){return session[k]===undefined?def:session[k];}}
    },
    document:{
      getElementById(){return {checked:false};},
      querySelector(){return {checked:false};},
      querySelectorAll(){return [];}
    },
    toggleVisibility(){}, alert(x){notifications.push(String(x));}, confirm(){return false;}
  });
  vm.runInContext(firmware, ctx, {timeout:1500});
  if (hen) vm.runInContext(hen, ctx, {timeout:1500});
  return {ctx,values,session,notifications};
}
function generate(root, curated) {
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const firmware=fs.readFileSync(path.join(root,'includes/js/firmware.js'),'utf8');
  const hen=fs.readFileSync(path.join(root,'includes/js/HENs.js'),'utf8');
  const options=parseOptions(html,'ps4FwSelect','firmware');
  const goldhen=selectedGoldHEN(html);
  const declared=new Map(curated.entries.map(item=>[item.firmware,item]));
  const inspect=contextFor('14.02',firmware,hen);
  const versionMap=inspect.ctx.GOLDHEN_VERSIONS;
  if (!versionMap || typeof versionMap!=='object') throw Error('GoldHEN registry unavailable');
  const goldhenOptions=goldhen.map(id=>{
    const filename=versionMap[id];
    if (typeof filename!=='string' || !/^goldhen_[A-Za-z0-9._-]+\.bin$/.test(filename))
      throw Error('GoldHEN version has no safely mapped binary: '+id);
    const binary='includes/payloads/HEN/'+filename;
    const full=path.join(root,binary);
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) throw Error('Missing GoldHEN binary: '+binary);
    const sha256=crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
    return {version:id,binary,sha256,verification:'file_and_menu_only',physical_ps4_tested:false};
  });
  const listed=new Set(options);
  const all=Array.from(new Set([...options,...declared.keys()])).sort((a,b)=>{
    const [aa,ab]=a.split('.').map(Number),[ba,bb]=b.split('.').map(Number);
    return aa-ba || ab-bb;
  });
  const entries=all.map(fw=>{
    const probe=contextFor(fw,firmware,null);
    const supported=Boolean(probe.ctx.isFirmwareSupported(fw));
    const available=Array.from(probe.ctx.getAvailableChains(fw));
    const selected=probe.ctx.getDefaultChain(fw);
    assert.equal(supported,available.length>0,'inconsistent firmware route: '+fw);
    if (supported) assert.ok(available.includes(selected),'missing default chain: '+fw);
    else assert.equal(selected,null,'unknown firmware should not receive a route: '+fw);
    const previous=declared.get(fw);
    if (previous && (previous.host_profile==='configured')!==supported)
      throw Error('Reviewed firmware support changed unexpectedly: '+fw);
    const verifiedVersions=[];
    if(supported) for(const id of goldhen) {
      const trial=contextFor(fw,firmware,hen);
      try {
        trial.ctx.setGoldHENVer(id);
        if (trial.values.GHVer!==id) continue;
        trial.ctx.GoldHEN();
        const picked=trial.session.payload_path;
        if (typeof picked!=='string' || !picked.startsWith('./includes/payloads/HEN/')) continue;
        const relative=picked.slice(2);
        if (fs.existsSync(path.join(root,relative))) verifiedVersions.push(id);
      } catch(error) {
        // A selector error does not justify claiming the version works.
      }
    }
    return {
      firmware:fw,
      host_profile:supported?'configured':'not_configured',
      automatic_checks:supported?'static_routing_only':'none',
      console_test:'not_verified',
      ui_listed:listed.has(fw),
      default_chain_id:supported?selected:null,
      goldhen_options_checked:verifiedVersions
    };
  });
  const byId=new Map(entries.map(x=>[x.firmware,x]));
  for (const unsupported of ['13.53','14.01','14.03','14.04']) {
    if (byId.get(unsupported)?.host_profile!=='not_configured') throw Error('Unsupported boundary changed: '+unsupported);
  }
  const fw1402=byId.get('14.02');
  if (!fw1402 || !fw1402.goldhen_options_checked.includes('GHv2.4b18.13') ||
      !fw1402.goldhen_options_checked.includes('GHv2.4b18.14') ||
      fw1402.goldhen_options_checked.some(x=>!['GHv2.4b18.13','GHv2.4b18.14'].includes(x)))
    throw Error('14.02 GoldHEN version selection no longer matches reviewed behavior');
  return {
    ...curated,
    catalog_generated_from:'published_host_firmware_and_goldhen_selectors',
    goldhen_selection_evidence:'sandboxed JavaScript selection and local file existence only',
    physical_ps4_tested:false,jailbreak_validated:false,
    firmware_option_count:options.length,
    goldhen_option_count:goldhen.length,
    goldhen_options:goldhenOptions,
    entries
  };
}
if(require.main===module) {
  const root=process.argv[2], out=process.argv[3];
  if(!root||!out) throw Error('Usage: node generate_compatibility_catalog.cjs <dist> <generated.json>');
  const input=JSON.parse(fs.readFileSync(path.join(__dirname,'compatibility-matrix.json'),'utf8'));
  const result=generate(path.resolve(root),input);
  fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n','utf8');
  process.stdout.write('BX-HEN compatibility: '+result.firmware_option_count+
    ' firmware menu choices; '+result.goldhen_option_count+' GoldHEN versions audited\n');
}
module.exports={generate,parseOptions,selectedGoldHEN};
