/* Portable actual Earth continuation from labelled historical complete worlds.
 * This does not claim a new beginning-to-ending campaign or native persistence. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),cp=require('node:child_process');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const args=process.argv.slice(2),arg=n=>{const i=args.indexOf(n);return i<0?null:args[i+1];};
const output=path.resolve(arg('--output')||path.join(ROOT,'evidence10/earth-homecoming-earned'));
assert.equal(fs.existsSync(output),false,'never overwrite an earlier journey');
if(process.platform==='win32')assert.match(output,/^D:[\\/]/i,'heavy output stays on D');
const source=[],walk=(dir,prefix)=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name),rel=prefix+'/'+e.name;if(e.isDirectory())walk(p,rel);else source.push(rel);}};
walk(path.join(ROOT,'src'),'src');walk(path.join(ROOT,'tools/earth-homecoming-journey'),'tools/earth-homecoming-journey');walk(path.join(ROOT,'tests/fixtures/earth-homecoming-prerequisites'),'tests/fixtures/earth-homecoming-prerequisites');
source.push('build.py','index.html','FIRSTLIGHT_VALLEY.html','tools/earth_homecoming_journey.cjs','tests/earth_homecoming_earned.test.cjs');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const manifest={scope:'installed Earth source freeze',root:fs.realpathSync(ROOT),sourceHashes:Object.fromEntries(source.sort().map(p=>[p,hash(path.join(ROOT,p))])),portableHistoricalInputs:true};
const epochFile=output+'.SOURCE_EPOCH.json';assert.equal(fs.existsSync(epochFile),false);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(epochFile,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
const report=require('./earth-homecoming-journey/connected_homecoming.cjs').run({output,variant:arg('--variant')||'all',epochFile,epochSha:hash(epochFile)});
assert.equal(report.status,'passed');
if((arg('--variant')||'all')==='all'){
 const env={...process.env,FIRSTLIGHT_ROOT:ROOT,EARTH_INSTALLED_EPOCH:epochFile,EARTH_INSTALLED_EPOCH_SHA:hash(epochFile),EARTH_EARNED_REPORT:path.join(output,'CONNECTED_EARTH_HOMECOMING_REPORT.json')};
 const result=cp.spawnSync(process.execPath,['--test','--test-reporter=tap',path.join(ROOT,'tests/earth_homecoming_earned.test.cjs')],{cwd:ROOT,env,encoding:'utf8'});process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');assert.equal(result.status,0,'explicit earned-cohort regression passes');
}
console.log(JSON.stringify({status:report.status,variants:report.variants,output,epochSha256:hash(epochFile),scope:report.scope}));
