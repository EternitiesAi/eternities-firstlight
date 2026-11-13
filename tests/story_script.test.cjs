'use strict';
/* The story script: every main-path scene as data. Structure, the branch facts BRANCHES.md defines, the cast, the
 * banned words, and scene() resolving for every combination of the facts each scene reads. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{test}=require('node:test');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const S=require(path.join(ROOT,'src/story-script.js')),SG=require(path.join(ROOT,'src/saga.js')),C=require(path.join(ROOT,'src/core.js'));
const BRANCHES=fs.readFileSync(path.join(ROOT,'docs/1.0/BRANCHES.md'),'utf8');
const BEATS=SG.BEATS.map(b=>b.id),IDS=S.ids(),own=Object.hasOwn;
const defined=name=>BRANCHES.includes('`'+name+'`');
const whens=s=>[...s.lines.map(l=>l.when),...(s.choice?s.choice.options.map(o=>o.when):[])].filter(Boolean);
const baseFacts=s=>{const out=new Set();for(const w of whens(s))for(const k of Object.keys(w))for(const b of(S.DERIVED[k]||[k]))out.add(b);return[...out];};
function*combos(keys){if(!keys.length){yield{};return;}const[k,...rest]=keys;for(const v of S.FACTS[k])for(const tail of combos(rest))yield{[k]:v,...tail};}
const BANNED=/prototype|provisional|epoch|realm 10|luna|not a claim|\bfees?\b|fixture|\btodo\b/i;

test('scenes are keyed by beat, in story order, with real lines',()=>{
 assert.ok(IDS.length>=60);let last=0;
 for(const id of IDS){
  const s=S.SCENES[id],beat=id.split('.')[0];assert.match(id,/^[a-z]+(\.[a-z0-9-]+)+$/);assert.equal(s.beat,beat,id);assert.ok(BEATS.includes(beat),id);
  const at=BEATS.indexOf(beat);assert.ok(at>=last,'out of order: '+id);last=at;
  assert.ok(typeof s.where==='string'&&s.where,id);assert.ok(Array.isArray(s.lines)&&s.lines.length>0,id);
  for(const l of s.lines){assert.deepEqual(Object.keys(l).filter(k=>!['speaker','text','when'].includes(k)),[],id);assert.ok(typeof l.text==='string'&&l.text.trim()===l.text&&l.text.length>0&&l.text.length<=320,id+': '+l.text);}
 }
 for(const beat of BEATS)assert.ok(S.beatScenes(beat).length>0,'no scene for '+beat);
 assert.ok(Object.isFrozen(S.SCENES)&&Object.isFrozen(S.SCENES[IDS[0]].lines[0]));
});

test('every speaker is in the cast, and the cast holds the people the story needs',()=>{
 for(const id of IDS)for(const l of S.SCENES[id].lines)assert.ok(own(S.CAST,l.speaker),id+': '+l.speaker);
 const names=Object.values(S.CAST).map(c=>c.name);
 for(const n of['Oren','Briar','Tessa','Rowan','Fenna','Ilan','Mara','Neris','Rielle','Damar','Avar','Anik','Vessa','Veyr','The envoy','The Regent of Ash'])assert.ok(names.includes(n),n);
 const used=new Set(IDS.flatMap(id=>S.SCENES[id].lines.map(l=>l.speaker)));
 for(const k of Object.keys(S.CAST))if(k!=='briar')assert.ok(used.has(k),'cast member never speaks: '+k);
});

test('every when names a fact and a value BRANCHES.md defines',()=>{
 for(const k of[...Object.keys(S.FACTS),...Object.keys(S.DERIVED)])assert.ok(defined(k),'BRANCHES.md does not define fact '+k);
 for(const id of IDS)for(const w of whens(S.SCENES[id]))for(const[k,want]of Object.entries(w)){
  if(own(S.DERIVED,k)){assert.ok(want&&typeof want==='object'&&!Array.isArray(want)&&Object.keys(want).every(x=>['min','max'].includes(x))&&Object.values(want).every(Number.isInteger),id+': '+k);continue;}
  assert.ok(own(S.FACTS,k),id+': unknown fact '+k);
  for(const v of Array.isArray(want)?want:[want])assert.ok(S.FACTS[k].includes(v),id+': '+k+' cannot be '+v);
 }
 for(const k of Object.keys(S.FACTS))for(const v of S.FACTS[k])if(typeof v==='string')assert.ok(defined(v),'BRANCHES.md does not name the value '+v+' of '+k);
});

test('every choice sets a field BRANCHES.md defines, with a value the fact can take',()=>{
 const PATH_FACT={'adventure.beacon.relic':'cinder','saga.choices.tessa':'tessa','saga.choices.device':'device','hellCampaign.choice':'hell','heavenCampaign.choice':'heaven','atlantisCampaign.choice':'sea','cosmosCampaign.choice':'stars','earthHomecoming.finale.offer':'offer','saga.finale.ending':'ending'};
 for(const p of S.SETS)assert.ok(defined(p),'BRANCHES.md does not define '+p);
 const seen=new Set(),choiceIds=new Set();
 for(const id of IDS){
  const c=S.SCENES[id].choice;if(!c)continue;
  assert.ok(typeof c.id==='string'&&c.id&&!choiceIds.has(c.id),id);choiceIds.add(c.id);assert.ok(typeof c.prompt==='string'&&c.prompt,id);
  assert.ok(c.options.length>=2&&new Set(c.options.map(o=>o.id)).size===c.options.length,id);
  for(const o of c.options){
   assert.ok(typeof o.label==='string'&&o.label&&o.label.length<=60,id);const entries=Object.entries(o.sets);assert.equal(entries.length,1,id);
   for(const[p,v]of entries){assert.ok(S.SETS.includes(p),id+': '+p);seen.add(p);if(own(PATH_FACT,p))assert.ok(S.FACTS[PATH_FACT[p]].includes(v),id+': '+p+'='+v);else assert.equal(typeof v,'boolean',id);}
  }
 }
 assert.deepEqual([...seen].sort(),[...S.SETS].sort());
 // the existing choices keep the ids their owners already validate
 const optionIds=id=>S.SCENES[id].choice.options.map(o=>Object.values(o.sets)[0]);
 assert.deepEqual(optionIds('hell.choice'),['unbind','divert','license']);
 assert.deepEqual(optionIds('heaven.choice'),['accessible-assist','broadened-activation']);
 assert.deepEqual(optionIds('witness.choice'),['publish','limited','license']);
 assert.deepEqual(optionIds('witness.avar'),['public-record','bounded-account']);
 assert.deepEqual(S.SCENES['finale.offer'].choice.options.map(o=>o.id),['refuse','take']);
});

test('no banned word, no dash, no stray token in anything a player reads',()=>{
 const texts=[];
 for(const id of IDS){const s=S.SCENES[id];texts.push([id,s.where],...s.lines.map(l=>[id,l.text]));if(s.choice)texts.push([id,s.choice.prompt],...s.choice.options.map(o=>[id,o.label]));}
 for(const c of Object.values(S.CAST))texts.push(['cast',c.name]);
 for(const[id,t]of texts){
  assert.doesNotMatch(t,BANNED,id+': '+t);assert.doesNotMatch(t,/[—–]|--/,id+': dash in '+t);assert.doesNotMatch(t,/!/,id+': '+t);
  assert.doesNotMatch(t.replace(/\{briar\}|\{habit\}/g,''),/[{}]/,id+': token in '+t);assert.doesNotMatch(t,/'/,id+': straight apostrophe in '+t);
 }
});

test('scene() resolves for every combination of the facts each scene reads',()=>{
 let checked=0;
 for(const id of IDS){
  const s=S.SCENES[id],keys=baseFacts(s);
  for(const f of combos(keys)){
   const r=S.scene(id,{...f,bonded:own(f,'bonded')?f.bonded:true});checked++;
   assert.ok(r&&r.id===id&&r.beat===s.beat,id);assert.ok(r.lines.length>0,id+' is silent for '+JSON.stringify(f));
   for(const l of r.lines){assert.deepEqual(Object.keys(l),['who','speaker','text']);assert.doesNotMatch(l.text,/[{}]/,id);assert.equal(l.speaker,S.CAST[l.who].name);}
   if(s.choice&&!s.choice.options.some(o=>o.when))assert.equal(r.choice.options.length,s.choice.options.length,id);
   if(!s.choice)assert.equal(r.choice,null,id);
  }
 }
 assert.ok(checked>IDS.length*2);
});

test('the three endings are reached by their conditions and by nothing else',()=>{
 const last=f=>S.scene('finale.last',f).choice;
 for(const f of combos(['offer','heardBeacon','heardFoundry','heardConfluence'])){
  const heard=f.heardBeacon&&f.heardFoundry&&f.heardConfluence,got=last(f);
  if(f.offer==='taken')assert.equal(got,null);
  else assert.deepEqual(got.options.map(o=>o.id),heard?['open','answered']:['open']);
 }
 // signing is the kept ending: no option anywhere sets it, the offer does
 assert.ok(IDS.every(id=>!(S.SCENES[id].choice?.options||[]).some(o=>Object.values(o.sets).includes('kept'))));
 assert.deepEqual(S.SCENES['finale.offer'].choice.options.map(o=>Object.values(o.sets)[0]),['refused','taken']);
 const text=(f)=>S.scene('finale.ending',f).lines.map(l=>l.text).join(' ');
 assert.match(text({ending:'open'}),/comes apart in the morning light/);assert.doesNotMatch(text({ending:'open'}),/Hollis/);
 assert.match(text({ending:'answered'}),/Hollis\. I was late/);assert.match(text({ending:'answered',sea:'publish'}),/on a wall/);assert.doesNotMatch(text({ending:'answered',sea:'limited'}),/on a wall/);
 assert.match(text({ending:'answered'}),/Nobody on the road forgives him/);
 assert.match(text({ending:'kept'}),/Received in good order: one traveller/);assert.doesNotMatch(text({ending:'kept'}),/rise|comes apart/);
 assert.match(S.scene('night.receipt',{}).lines[1].text,/^Received in good order: one fox/);
 const credits=e=>S.scene('epilogue.credits',{ending:e}).lines.map(l=>l.text);
 assert.equal(new Set(['open','kept','answered'].map(e=>credits(e).join('|'))).size,3);
 for(const e of['open','kept','answered']){assert.equal(credits(e).length,1);assert.match(credits(e)[0],/^Firstlight\./);}
});

test('the ledger: every echo entry has its line, and the counts follow the choices',()=>{
 const one=id=>{for(const f of combos(['hell','sea'])){const r=S.scene(id,f);assert.ok(r&&r.lines.length===1,id+' '+JSON.stringify(f));}};
 // rows the saga holds today, minus the one BRANCHES.md re-sorts
 for(const e of SG.ECHO)one('finale.'+(e.kind==='coercive'?'chain':'ally')+'.'+e.id);
 for(const id of['tessa-refused','tessa-hers','device-open','device-sealed'])one('finale.ally.'+id);
 for(const id of['tessa-signed','device-carried','nearshore-false','spring'])one('finale.chain.'+id);
 for(const id of IDS.filter(x=>x.startsWith('finale.chain.')||x.startsWith('finale.ally.'))){const row=id.split('.')[2];assert.ok(row==='spring'||defined(row)||SG.ECHO.some(e=>e.id===row),id);}
 assert.deepEqual([S.facts({}).chains,S.facts({}).freed],[0,0]);
 assert.equal(S.facts({cinder:'accepted',tessa:'signed',device:'carried',hell:'license',sea:'license',falseFirst:true}).chains,6);
 const clean=S.facts({cinder:'sealed',tessa:'hers',device:'sealed',hell:'unbind',heaven:'accessible-assist',sea:'publish',stars:'bounded-account'});
 assert.deepEqual([clean.chains,clean.freed],[0,7]);
 const rise=f=>S.scene('finale.rise',f).lines.map(l=>l.text).join(' ');
 assert.match(rise({}),/Not one/);assert.match(rise({hell:'divert'}),/One or two/);assert.match(rise({hell:'divert',sea:'license',device:'carried'}),/Look how many/);
});

test('either order of the sea and the stars makes sense, and the fox is never set up at heel',()=>{
 const said=(id,f)=>S.scene(id,f).lines.map(l=>l.text).join(' ');
 assert.match(said('witness.confluence',{}),/daybook under the sea/);assert.doesNotMatch(said('witness.confluence',{sea:'publish'}),/daybook under the sea/);
 assert.match(said('witness.trail',{}),/under the sea first/);assert.match(said('witness.trail',{sea:'limited'}),/Then go/);
 for(const id of IDS.filter(x=>!x.startsWith('nearshore.')&&!x.startsWith('finale.')))assert.doesNotMatch(S.SCENES[id].lines.map(l=>l.text).join(' '),/(at|behind) your (left )?heel/,id);
 assert.match(said('hart.briar',{}),/Not at heel/);assert.match(said('nearshore.offer',{}),/comes to your left heel at once/);
 // the kept fox is asked for out loud before it counts
 assert.deepEqual(S.SCENES['nearshore.heel'].choice.options.map(o=>o.sets['saga.briar.falseTrusted']),[true,false]);
});

test('a real save reads as facts, tokens are filled, and nothing is written',()=>{
 const w=C.fresh(),before=JSON.stringify(w);
 const f=S.facts(w);assert.equal(f.cinder,null);assert.equal(f.tessa,null);assert.equal(f.heard,0);assert.equal(f.ending,null);assert.equal(f.briarName,'Briar');
 for(const id of IDS)assert.ok(S.scene(id,w).lines.length>0,id);
 assert.equal(JSON.stringify(w),before);
 const later={adventure:{companion:{bonded:true,name:'Juniper'},beacon:{relic:'sealed'}},hellCampaign:{choice:'unbind'},heavenCampaign:{choice:'broadened-activation'},atlantisCampaign:{choice:'publish'},cosmosCampaign:{choice:'bounded-account'},earthHomecoming:{finale:{offer:'refused'}},
  saga:{choices:{tessa:'hers',device:'open'},heard:{beacon:true,foundry:true,confluence:true},briar:{falseTrusted:true,habit:{market:3}},finale:{ending:'answered'}}};
 const g=S.facts(later);
 assert.deepEqual([g.cinder,g.tessa,g.device,g.hell,g.heaven,g.sea,g.stars,g.heard,g.falseFirst,g.offer,g.ending,g.chains,g.briarName],['sealed','hers','open','unbind','broadened-activation','publish','bounded-account',3,true,'refused','answered',1,'Juniper']);
 assert.match(S.scene('night.receipt',later).lines[1].text,/answering to Juniper/);
 assert.match(S.scene('nearshore.offer',later).lines.at(-1).text,/toward the makers’ exchange\./);
 assert.equal(S.facts({adventure:{beacon:{relic:'stolen'}},saga:{choices:{tessa:'maybe'}}}).cinder,null);
});

test('lanes reach scenes by their own step names; unknown and ambiguous ids fall back',()=>{
 for(const[owner,map]of Object.entries(S.STEPS))for(const[step,id]of Object.entries(map))assert.ok(own(S.SCENES,id),owner+'.'+step+' -> '+id);
 assert.equal(S.forStep('hell','witness-record',{}).id,'hell.neris');assert.equal(S.forStep('night','envoy',{}).id,'night.envoy');
 assert.equal(S.scene('witness-record',{}).id,'hell.neris');
 assert.equal(S.scene('disposition',{}),null);assert.equal(S.scene('no-such-scene',{}),null);assert.equal(S.forStep('hell','nope',{}),null);assert.equal(S.scene(null,{}),null);
 const mapped=new Set(Object.values(S.STEPS).flatMap(m=>Object.values(m)));
 for(const id of IDS)if(!/^finale\.(chain|ally)\./.test(id))assert.ok(mapped.has(id),'no lane step reaches '+id);
});

test('the lines the saga and the first envoy scene already fixed are kept word for word',()=>{
 const said=id=>S.SCENES[id].lines.map(l=>l.text);
 assert.ok(said('envoy.prophecy').includes(SG.PROPHECY_LINES.spring));assert.ok(said('heaven.reading').includes(SG.PROPHECY_LINES.heaven));
 assert.ok(said('envoy.arrival').includes('I was told I would find a fortress. An army. Someone prepared. Instead, I found someone who knows how to begin.'));
 assert.ok(said('bellweather.rowan').includes('The road is open. Now we need a voice to call the lost home.'));
 assert.ok(said('hell.veyr').includes('An escape is a restraint I have not finished.'));
 // the feather is raised in at least three main beats, and fails once on purpose
 const raised=BEATS.filter(b=>S.beatScenes(b).some(id=>said(id).some(t=>/raise the feather|Hold the feather up/.test(t))));
 assert.ok(raised.length>=5,raised.join(','));assert.ok(said('nearshore.offer').some(t=>/Both of them are gold/.test(t)));
 // the regent speaks at three sightings before the finale, and the first two never name him
 for(const id of['beacon.stranger','hell.pattern','hell.regent'])assert.ok(S.SCENES[id].lines.every(l=>l.speaker!=='regent'),id);
 assert.ok(S.SCENES['witness.confluence'].lines.some(l=>l.speaker==='regent'));
});
