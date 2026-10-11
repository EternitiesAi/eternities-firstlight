#!/usr/bin/env python3
"""Staged future RoadAccount/Roadkeeper native extension; import launches nothing.

Caller-supplied current command-earned synthetic outputs use the original
character controls. Only ordinary production RAF and native input move the world.
No state/event/intent/proof/frame injection, core replacement or quota override.
The separate WildSigns failure/history gate remains parent-owned.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
import argparse
import copy
import hashlib
import importlib.util
import json
import math
import os
import subprocess
import sys
import threading
import time
import traceback
sys.dont_write_bytecode=True

HERE=Path(__file__).resolve().parent
ID='earth-beast-wrong-name-v1';LOAD='earth-first-load-through-v1';ACTOR='earth-wild-signs-roadkeeper-v1'
ROOM='world-earthlands';PEOPLE=('elderweald-sela','elderweald-rill','merren')
HOME=dict(x=-100.6,z=-27.4)
BUDGETS=dict(caseSeconds=1800,tripSeconds=900,approachSeconds=240,deathSeconds=240,
 cameraCatchSeconds=180,frameInputMs=10000,samplesPerTrip=12000,viewportConfigurations=4,pauseMs=1200)
CONFIGS=((1440,960,'adventure',False),(1440,960,'follow',False),(390,844,'adventure',True),(390,844,'follow',True))
SAFE_KEYS={'actor','resolution','x','z','base','yaw','phase','phaseTime','gait','cycle','walking','paused','suspended','hidden','menuOpen','reducedMotion','radius','height'}
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def reviewed_text_sha(raw):return hashlib.sha256(raw.replace(b'\r\n',b'\n')).hexdigest()
def lf_sha(p):return reviewed_text_sha(Path(p).read_bytes())
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def need(ok,text):
 if not ok:raise ValueError(text)
def dump(p,value):
 with Path(p).open('x',encoding='utf-8',newline='\n') as f:json.dump(value,f,indent=2,ensure_ascii=False);f.write('\n')
def load(p,name):
 spec=importlib.util.spec_from_file_location(name,p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def exact_link(link,base=None):
 need(type(link) is dict and set(link)=={'path','sha256'},'Exact native checkpoint link required')
 need(type(link['path']) is str and type(link['sha256']) is str and len(link['sha256'])==64,'Exact typed native link required')
 p=Path(link['path']);need(p.is_absolute() if base is None else not p.is_absolute(),'Explicit absolute historical or relative current link required')
 if base is not None:p=Path(base)/p
 need(p.is_file() and sha(p)==link['sha256'],'Exact native checkpoint bytes required')
 return p.resolve()
def active_world(store):
 # Existing Native.write_new writes literal native JSON bytes, not a quoted
 # JSON string wrapper. Parsing the sealed file therefore yields the library.
 raw=store;need(type(raw) is dict and set(raw)=={'version','revision','nextId','active','slots'} and type(raw['version']) is int and raw['version']==1
  and type(raw['revision']) is int and 1<=raw['revision']<1e9 and type(raw['nextId']) is int and 2<=raw['nextId']<1e9,'Actual managed library required')
 slots=raw.get('slots');need(type(slots) is list and 1<=len(slots)<=3,'Bounded actual character slots required')
 identities=[]
 for s in slots:
  need(type(s) is dict and set(s)=={'id','world'} and type(s['id']) is str and s['id'].startswith('character-') and s['id'][10:].isdigit()
   and s['id'][10:]==str(int(s['id'][10:])) and 1<=int(s['id'][10:])<raw['nextId'] and type(s['world']) is dict,'Actual native slot identity required')
  identities.append(s['id'])
 need(len(set(identities))==len(identities),'Duplicate native slot identity refused')
 matches=[s for s in slots if type(s) is dict and s.get('id')==raw.get('active')]
 need(len(matches)==1,'Exactly one actual active source identity required');return matches[0]['world']

CHECKPOINT_JS=r"""
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.argv[1],world=JSON.parse(fs.readFileSync(process.argv[2])),expected=JSON.parse(process.argv[3]),paid=process.argv[4]==='claimed';
require(path.join(root,'src/core.js'));const C=globalThis.RealmCore,D=globalThis.RealmEarthWildSignsData,CD=globalThis.RealmEarthConsignmentData;
const sorted=v=>JSON.stringify(v,(_,o)=>o&&typeof o==='object'&&!Array.isArray(o)?Object.fromEntries(Object.keys(o).sort().map(k=>[k,o[k]])):o);
assert.equal(sorted(C.validate(world)),sorted(world),'No silent migration/owner repair/canonical byte alteration');
for(const k of ['earthWildSigns','localLife','earthExpedition'])assert.ok(Object.hasOwn(world,k));
assert.ok(Object.hasOwn(world.localLife,'records')&&Object.hasOwn(world.localLife.records,CD.ID));
const load=CD.crossValidate(world.localLife.records[CD.ID],world.earthExpedition);assert.ok(load.accepted&&load.claimed);assert.deepEqual(load.steps,CD.required(load));
assert.deepEqual(Object.keys(expected).sort(),['version','accepted','evidence','observed','resolution','cleared','claimed'].sort());
assert.deepEqual(D.crossValidate(expected,world),expected);assert.deepEqual(D.crossValidate(world.earthWildSigns,world),expected);
assert.equal(expected.accepted,true);assert.equal(expected.claimed,paid);
if(paid){assert.equal(expected.observed,true);assert.deepEqual([...expected.evidence].sort(),D.evidence.map(p=>p.id).sort());assert.ok(D.resolutions.some(r=>r.id===expected.resolution));assert.equal(expected.cleared,expected.resolution==='cleared-pocket');}
else{assert.equal(expected.observed,false);assert.equal(expected.resolution,null);assert.equal(expected.cleared,false);assert.deepEqual([...expected.evidence].sort(),['feeding-track','timber-gouge']);}
assert.equal(D.ID,'earth-beast-wrong-name-v1');assert.deepEqual(D.definition.reward,{xp:0,coins:4,ore:0,materials:{fiber:3}});
console.log(JSON.stringify({ok:true,claimed:paid,choice:load.choice,resolution:expected.resolution}));
"""
def validate_checkpoint(root,source,expected,phase):
 need(phase in ('before','claimed'),'Explicit exact checkpoint phase required')
 return json.loads(subprocess.check_output(['node','-e',CHECKPOINT_JS,str(root),str(source),json.dumps(expected),phase],text=True,timeout=30))

LIBRARY_JS=r"""const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const H=require(path.join(process.argv[1],'src/characters.js')),raw=JSON.parse(fs.readFileSync(process.argv[2]));
const sorted=v=>JSON.stringify(v,(_,o)=>o&&typeof o==='object'&&!Array.isArray(o)?Object.fromEntries(Object.keys(o).sort().map(k=>[k,o[k]])):o);
assert.equal(sorted(H.validate(raw)),sorted(raw),'Actual Character/Core validators must not migrate or repair native library');console.log(JSON.stringify({ok:true,active:raw.active}));"""
def validate_library(root,source):
 return json.loads(subprocess.check_output(['node','-e',LIBRARY_JS,str(root),str(source)],text=True,timeout=30))

def checkpoint_pair(world,stored,phase):
 if phase=='claimed':return world==stored
 # The original BEFORE watch was sampled while ordinary RAF was running.
 # Precisely these three unsaved Core routine/clock fields differ in both real
 # native03 files. No exception for player, HP, settings, reward or any history.
 a,b=copy.deepcopy(world),copy.deepcopy(stored)
 for key in ('adventure','sandbox'):
  newer,older=a[key].pop('elapsed'),b[key].pop('elapsed')
  if not (type(newer) in (int,float) and type(older) in (int,float) and math.isfinite(newer) and math.isfinite(older) and 0<=newer-older<=6.2):return False
 ar,br=a.pop('residents'),b.pop('residents')
 if len(ar)!=len(br) or any(x['id']!=y['id'] or x['conversations']!=y['conversations'] or x['progress']<y['progress'] for x,y in zip(ar,br)):return False
 return a==b

def admit_inputs(root,manifest,expectations):
 m=read(manifest);e=read(expectations)
 historical=m.get('schema')=='road-account-native-checkpoints-v1';portable=m.get('schema')=='road-account-native-checkpoints-v2'
 need(set(m)=={'schema','provenance','report','sourceHead','cases'} and (historical or portable)
  and m['provenance']==('historical-native03-command-earned-synthetic-checkpoints' if historical else 'ordinary-native-command-earned-synthetic-checkpoints'),'Exact declared native provenance required')
 base=None if historical else Path(manifest).resolve().parent
 report_path=exact_link(m['report'],base)
 if historical:need(m['report']['sha256']==e['historicalReportSHA256'],'Original native report identity changed')
 report=read(report_path);need(report.get('status')=='passed' and report.get('head')==m['sourceHead'],'Passed original native source report required')
 need(type(m['sourceHead']) is str and len(m['sourceHead'])==40 and all(c in '0123456789abcdef' for c in m['sourceHead']),'Exact native source HEAD required')
 native_helper=root/'tools/earth_wild_signs_browser.py'
 native_harness=e['helpers']['tools/earth_wild_signs_browser.py'] if historical else sha(native_helper)
 if portable:need(lf_sha(native_helper)==e['helpersLF']['tools/earth_wild_signs_browser.py'] if 'helpersLF' in e else sha(native_helper)==e['helpers']['tools/earth_wild_signs_browser.py'],'Reviewed original native caller text changed')
 need(report.get('serverClosed') is True and report.get('execution')=='ordinary-RAF/original-native-input' and report.get('harnessSha256')==native_harness
  and report.get('browserErrors')==[] and report.get('externalRequests')==[] and report.get('errors')==[],'Closed original ordinary native suite without runtime/request errors required')
 need(set(m['cases'])=={'signed-loop','cleared-pocket'},'Both original outcomes required')
 rows={};frozen={str(Path(manifest).resolve()):sha(manifest),str(Path(expectations).resolve()):sha(expectations),str(report_path):sha(report_path)}
 if portable:
  pins=report.get('admittedInputs');need(type(pins) is dict and 1<=len(pins)<=512,'Bounded current native source/cohort closure required')
  for p,s in pins.items():
   actual=exact_link(dict(path=p,sha256=s));frozen[str(actual)]=s
 used=set()
 for outcome,row in m['cases'].items():
  variant='blade' if outcome=='signed-loop' else 'bow';case=variant+'-'+outcome
  need(set(row)=={'variant','nativeCase','before','claimed'} and row['variant']==variant and row['nativeCase']==case,'Exact original native case identity required')
  receipt=report['cases'][case];need(receipt.get('contextClosed') is True,'Actual original native context closure required')
  checks=receipt.get('checks',[]);need(checks and all(c.get('passed') is True for c in checks),'Original native case contains failed acceptance')
  need(any(c['name']=='exact separate 4 coin/3 fibre one-time payment' for c in checks),'No actual original claim receipt')
  resolved={}
  for phase,names,prefix in [('before',{'world','store','expected'},'FIRST_BROWSE_READY'),('claimed',{'world','store','closedStore','expected'},'PAID')]:
   data=row[phase];need(type(data) is dict and set(data)==names,'Exact checkpoint leaf set required')
   files={k:exact_link(data[k],base) for k in names-{'expected'}}
   need(files['world']==report_path.parent/case/(prefix+'_WORLD.json') and files['store']==report_path.parent/case/(prefix+'_NATIVE_STORE.json'),'Checkpoint must be the original named native output, not substituted progress')
   need(not used.intersection(files.values()),'Duplicate checkpoint leaf refused');used.update(files.values())
   validate_library(root,files['store']);world=read(files['world']);stored=active_world(read(files['store']))
   need(checkpoint_pair(world,stored,phase),'Actual checkpoint/native stored relationship differs')
   need(world['earthWildSigns']==data['expected'],'Exact deliberately expected owner required')
   validate_checkpoint(root,files['world'],data['expected'],phase)
   if phase=='claimed':
    need(files['closedStore']==report_path.parent/case/'PAID_COLD_CLOSED_NATIVE_BYTES.json','Exact original cold close bytes required')
    need(sha(files['closedStore'])==sha(files['store']),'Original PAID and closed native bytes differ')
    need(world['earthWildSigns']['resolution']==outcome,'Native source outcome identity differs')
   frozen.update({str(p):sha(p) for p in files.values()});resolved[phase]=dict(files=files,world=world,expected=data['expected'])
  rows[outcome]=resolved
 return rows,frozen,report

def prepare_current_inputs(root,report_path,expected_report_head,output,expectations):
 # Caller supplies the current primary suite's real report. Relative links make
 # this manifest independent of our private stage and historical D paths.
 root=Path(root).resolve();report_path=Path(report_path).resolve();output=Path(output).resolve();receipt=read(report_path)
 need(not output.exists() and output.parent.is_dir() and output!=root and root not in output.parents,'Fresh manifest outside ROOT required')
 need(report_path.name=='WILD_SIGNS_NATIVE_REPORT.json' and receipt.get('head')==expected_report_head,'Explicit named primary native report and HEAD required')
 def link(p):return dict(path=os.path.relpath(p,output.parent).replace('\\','/'),sha256=sha(p))
 cases={}
 for outcome,variant in [('signed-loop','blade'),('cleared-pocket','bow')]:
  case=variant+'-'+outcome;folder=report_path.parent/case
  cases[outcome]=dict(variant=variant,nativeCase=case,
   before=dict(world=link(folder/'FIRST_BROWSE_READY_WORLD.json'),store=link(folder/'FIRST_BROWSE_READY_NATIVE_STORE.json'),expected=read(folder/'FIRST_BROWSE_READY_WORLD.json')['earthWildSigns']),
   claimed=dict(world=link(folder/'PAID_WORLD.json'),store=link(folder/'PAID_NATIVE_STORE.json'),closedStore=link(folder/'PAID_COLD_CLOSED_NATIVE_BYTES.json'),expected=read(folder/'PAID_WORLD.json')['earthWildSigns']))
 value=dict(schema='road-account-native-checkpoints-v2',provenance='ordinary-native-command-earned-synthetic-checkpoints',report=link(report_path),sourceHead=expected_report_head,cases=cases)
 dump(output,value)
 # Keep the candidate manifest on failure; never erase negative evidence.
 rows,frozen,_=admit_inputs(root,output,expectations)
 return dict(prepared=True,browserExecuted=False,serverStarted=False,gameTreeWrites=0,manifest=dict(path=str(output),sha256=sha(output)),outcomes=sorted(rows),admittedFileCount=len(frozen),sourceHead=expected_report_head)

def installed_epoch(root,expected_head,expectations):
 e=read(expectations);need(type(expected_head) is str and len(expected_head)==40,'Explicit installed integration epoch required')
 head=subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip();need(head==expected_head,'Actual integration HEAD differs')
 need(not subprocess.check_output(['git','-C',str(root),'status','--porcelain','--','src','index.html','FIRSTLIGHT_VALLEY.html','tools/earth_consignment_browser.py','tools/earth_wild_signs_browser.py','tools/earth_wild_signs_boundaries_browser.py','tools/browser_support.py'],text=True).strip(),'Committed unchanged installed runtime/callers/pages required')
 for p,s in e['helpers'].items():need(lf_sha(root/p)==e['helpersLF'][p] if 'helpersLF' in e else sha(root/p)==s,'Actual original browser helper text changed: '+p)
 pages=[root/'index.html',root/'FIRSTLIGHT_VALLEY.html'];need(all(p.is_file() for p in pages) and sha(pages[0])==sha(pages[1]),'Matching actual installed pages required')
 html=pages[0].read_text(encoding='utf-8-sig')
 for name,s in e['reviewedModules'].items():
  p=root/'src'/name;need(p.is_file() and (lf_sha(p)==e['reviewedModulesLF'][name] if 'reviewedModulesLF' in e else sha(p)==s),'Reviewed future runtime is not installed: '+name)
  need(p.read_text(encoding='utf-8-sig') in html,'Actual reviewed module is not embedded: '+name)
 app=(root/'src/app.js').read_text(encoding='utf-8-sig');start='// BEGIN EARTH ROADKEEPER APP HOOKS';end='// END EARTH ROADKEEPER APP HOOKS'
 need(app.count(start)==1 and app.count(end)==1,'Actual App extraction boundaries required')
 body=app[app.index(start)+len(start):app.index(end)]
 need(hashlib.sha256(body.encode()).hexdigest()==e['appHookBodySHA256'],'Actual App hook differs from reviewed source')
 need('roadkeeper:roadkeeperDiagnostics()' in app and 'sim.tick(dt);tickRoadkeeper(dt);' in app,'Actual ordinary Core/diagnostic caller seam missing')
 return dict(head=head,htmlSha256=sha(pages[0]),runtimeSources={p.relative_to(root).as_posix():sha(p) for p in sorted((root/'src').glob('*')) if p.is_file()})

def reaction_facts(world):
 # Native walking/ordinary clocks, resident poses, HP/stamina/revision and view
 # settings may change. Every persistent progression/economy/history owner stays.
 out=copy.deepcopy(world)
 out['residents']=[{k:r[k] for k in ('id','conversations')} for r in out['residents']]
 for k in ('player','day','hour','settings'):out.pop(k,None)
 for k in ('elapsed','hp','stamina','revision'):out['adventure'].pop(k,None)
 out['sandbox'].pop('elapsed',None)
 return out

PAID_TEXT='Sela paid you 4 sunmarks and 3 fibre. Claimed once; no XP or ore.'

def account_surface(person,outcome,authored,paragraphs,notice=None,payment=()):
 # Pure acceptance parser. Native callers supply actual readonly API values
 # and live DOM text; CPU callers are labelled separately. Counts follow the
 # authored API, so a notice is never confused with a role reading or receipt.
 if person not in PEOPLE or outcome not in ('signed-loop','cleared-pocket'):return False
 if type(authored) is not dict or authored.get('personId')!=person or authored.get('resolution')!=outcome:return False
 source=notice if person=='elderweald-sela' else authored
 if type(source) is not dict or source.get('resolution')!=outcome:return False
 lines=source.get('lines')
 if type(lines) is not list or not lines or any(type(s) is not str for s in lines) or paragraphs!=lines:return False
 text=' '.join(lines).lower()
 practical='bypass' in text if outcome=='signed-loop' else 'pocket' in text and 'clear' in text
 if 'grazer' not in text or not practical:return False
 if person=='elderweald-sela':
  if not all(s in text for s in ('feeding','broad','narrow','gouge','burrowing scrape','unproven','older stories')):return False
  if type(payment) not in (list,tuple) or list(payment)!=[PAID_TEXT]:return False
 return not any(s in text for s in ('grazer caused','skitter caused','all roads safe','forest fully cleared'))

def death_transition(before,after,changed_companion=False):
 # Admit only the actual existing fall/revive effects and optional ordinary
 # Stay/Follow receipts. Every other owner/history/economy value stays exact.
 try:
  a,b=reaction_facts(before),reaction_facts(after)
  need(after['adventure']['deaths']==before['adventure']['deaths']+1 and after['adventure']['tonics']==3,'Exactly one existing death/revive required')
  events=[dict(seq=before['nextEvent']+i,day=before['day'],hour=before['hour'],kind=k,text=t) for i,(k,t) in enumerate([
   ('adventure','You fell on an expedition. Your home and belongings are safe.'),('quest','You returned to the spring. Belongings, excavation and completed encounters remain.')])]
  need(after['nextEvent']==before['nextEvent']+2 and after['journal']==(before['journal']+events)[-200:],'Only original fall/revive history is admitted')
  terms=([['companion-mode',{'mode':'stay'}]] if changed_companion else [])+[['revive',{}]]+([['companion-mode',{'mode':before['adventure']['companion']['mode']}]] if changed_companion else [])
  added=after['adventure']['receipts'][-len(terms):]
  need(len(added)==len(terms) and all(r['ok'] is True and json.loads(r['fp'])==t for r,t in zip(added,terms)) and after['adventure']['receipts']==(before['adventure']['receipts']+added)[-100:],'Only original native revive/companion receipts are admitted')
  for facts in (a,b):
   facts.pop('journal');facts.pop('nextEvent')
   for k in ('deaths','tonics','receipts'):facts['adventure'].pop(k)
  return a==b
 except (ValueError,KeyError,TypeError,json.JSONDecodeError):return False
def safe_view(v,outcome):
 return (type(v) is dict and set(v)==SAFE_KEYS and v.get('actor')==ACTOR and v.get('resolution')==outcome
  and all(type(v.get(k)) in (int,float) and math.isfinite(v[k]) for k in ('x','z','base','yaw','phaseTime','gait','cycle','radius','height'))
  and v['radius']==.6 and v['height']==1.78 and type(v['cycle']) is int and v['cycle']>=0 and v['phase'] in ('home','outbound','inspect','return')
  and v['suspended'] in (None,'paused','hidden','menu','hostile-nearby')
  and all(type(v[k]) is bool for k in ('walking','paused','hidden','menuOpen','reducedMotion')))

class TripWitness:
 """Pure controller acceptance; its input is actual ordinary-frame samples."""
 def __init__(self):self.cycle=None;self.phases=[];self.last=None;self.meters=0.;self.complete=False
 def add(self,view,elapsed):
  if self.complete:return
  need(type(elapsed) in (int,float) and math.isfinite(elapsed),'Actual finite elapsed sample required')
  if self.last:
   old,t=self.last;delta=math.hypot(view['x']-old['x'],view['z']-old['z']);need(elapsed>=t and delta<=1.15*(elapsed-t)+.001,'Clock rollback/unsupported speed cannot qualify a trip')
   if self.cycle is not None:self.meters+=delta
  self.last=(copy.deepcopy(view),elapsed)
  if self.cycle is None:
   if view['phase']=='home' and math.hypot(view['x']-HOME['x'],view['z']-HOME['z'])<1e-8:self.cycle=view['cycle'];self.phases=['home']
   return
  need(view['cycle'] in (self.cycle,self.cycle+1),'Routine owner/cycle reset cannot qualify the original trip')
  if view['phase']!=self.phases[-1]:self.phases.append(view['phase'])
  if view['cycle']==self.cycle+1:
   need(self.phases==['home','outbound','inspect','return','home'] and math.hypot(view['x']-HOME['x'],view['z']-HOME['z'])<1e-8,'Complete ordered outbound/inspection/return required')
   self.complete=True

SAMPLE_JS=r"""()=>{const s=Realm.state,d=Realm.diagnostics,v=d.roadkeeper,e=window.__flArt?.e;
return {world:s,view:v,elapsed:s.adventure.elapsed,scene:d.scene,paused:d.adventure.paused,hidden:document.hidden,active:d.characters.active,
player:d.adventure.player,camera:d.camera,parts:e?.dynamic.flatMap(b=>b.items.filter(i=>i.roadkeeperActor==='earth-wild-signs-roadkeeper-v1')).length||0,
enemies:d.adventure.enemies,stored:localStorage.getItem(RealmCharacters.KEY)};}"""

PROJECTION_JS=r"""()=>{const e=window.__flArt?.e,v=Realm.diagnostics.roadkeeper;if(!e||!v)return null;
const parts=e.dynamic.flatMap(b=>b.items.map((item,i)=>({kind:b.kind,item,m:Array.from(b.data.subarray(i*24,i*24+16))}))).filter(q=>q.item.roadkeeperActor==='earth-wild-signs-roadkeeper-v1');
const points=parts.flatMap(q=>{const raw=RealmEngine.geometry(q.kind),out=[];for(let i=0;i<raw.length;i+=6){const p=RealmEngine.M.transform(q.m,Array.from(raw.slice(i,i+3)));out.push(e.project(...p));}return out;});
const bar=document.querySelector('#skillbar').getBoundingClientRect().top,w=e.canvas.clientWidth,h=e.canvas.clientHeight;
return {parts:parts.length,vertices:points.length,clipped:points.filter(p=>!p.visible||p.x<1||p.x>w-1||p.y<1||p.y>Math.min(h-1,bar-8)).length,
span:{width:Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)),height:Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y))},view:v};} """

# Separate actual paused GPU control. Render actual packed batches on/off/back;
# no Core tick, App frame, witness, account command or native intent is issued.
PIXELS_JS=r"""()=>{const e=window.__flArt?.e,g=e?.gl;if(!g||!Realm.diagnostics.adventure.paused)throw Error('Actual native-paused renderer required');
const before=JSON.stringify({world:Realm.state,roadkeeper:Realm.diagnostics.roadkeeper,store:localStorage.getItem(RealmCharacters.KEY)}),s=Realm.state,t=s.adventure.elapsed;
const saved=e.dynamic.map(b=>({b,items:b.items,data:b.data,count:b.count}));
const restore=()=>{for(const q of saved){q.b.items=q.items;q.b.data=q.data;e.updateBatch(q.b);q.b.count=q.count;}};
const pixels=()=>{e.render(t,s.hour,s.weather==='rain');const a=new Uint8Array(e.mainF.w*e.mainF.h*4);g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);g.readPixels(0,0,e.mainF.w,e.mainF.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;};
const diff=(a,b)=>{let n=0;for(let i=0;i<a.length;i+=4)if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>12)n++;return n;};let result;
try{const on=pixels();for(const q of saved){q.b.items=q.items.filter(i=>i.roadkeeperActor!=='earth-wild-signs-roadkeeper-v1');e.updateBatch(q.b);}const off=pixels();restore();const back=pixels();result={pixels:diff(on,off),restoredPixels:diff(on,back),sameMembers:saved.every(q=>q.b.items===q.items&&q.b.data===q.data&&q.b.count===q.count),glError:g.getError()};}
finally{restore();e.render(t,s.hour,s.weather==='rain');}
return {...result,stateUnchanged:before===JSON.stringify({world:Realm.state,roadkeeper:Realm.diagnostics.roadkeeper,store:localStorage.getItem(RealmCharacters.KEY)})};} """

def driver_class(suite,base):
 class RoadAccount(suite.driver_class(base)):
  def __init__(self,*args,**kwargs):
   super().__init__(*args,**kwargs);self.deadline=time.monotonic()+BUDGETS['caseSeconds'];self.closing=False
  def ev(self,js,arg=None):
   if not self.closing:need(time.monotonic()<self.deadline,'Case wall deadline expired; no input/proof fallback')
   return super().ev(js,arg)
  def finish(self):self.closing=True;super().finish()
  def sample(self):return self.ev(SAMPLE_JS)
  def slot(self,ident):return self.ev('id=>RealmCharacters.validate(JSON.parse(localStorage.getItem(RealmCharacters.KEY))).slots.find(s=>s.id===id)?.world||null',ident)
  def import_added(self,file,incoming):
   self.workspace('characters');outgoing=self.diag()['characters']['active'];before=self.state()
   with self.page.expect_file_chooser() as chooser:self.click('[data-rpg="chars-import"]')
   chooser.value.set_files(str(file));self.page.wait_for_selector('[data-rpg="chars-confirm-import"]');self.click('[data-rpg="chars-confirm-import"]')
   self.page.wait_for_function('id=>Realm.diagnostics.characters.active===id&&Realm.diagnostics.characters.writer===true',arg=incoming)
   self.check('native added import preserves exact outgoing facts/economy/history',reaction_facts(before)==reaction_facts(self.slot(outgoing)))
   self.check('native imported claimed source preserved',base.import_preserved(read(file),self.state()))
   self.check('native imported owner starts at cold home without an outgoing civilian',self.diag()['scene']=='valley' and self.ev('()=>Realm.diagnostics.roadkeeper===null'))
   self.close();self.click('#settings');quality='low' if self.args.renderer=='software' else 'balanced'
   self.page.locator('#quality').select_option(quality);self.page.locator('#setting-timeFlow').uncheck();self.click('#close-panel')
   self.check('native claimed owner uses declared graphics/time-flow settings',self.state()['settings']['quality']==quality and self.state()['settings']['timeFlow'] is False)
  def switch(self,ident):
   self.workspace('characters');outgoing=self.diag()['characters']['active'];before=self.state()
   self.click('[data-rpg="chars-switch"][data-id="'+ident+'"]')
   self.page.wait_for_function('id=>Realm.diagnostics.characters.active===id&&Realm.diagnostics.characters.writer===true',arg=ident)
   self.check('native switch preserves outgoing progression/economy/history',reaction_facts(before)==reaction_facts(self.slot(outgoing)))
   self.check('native switch discards transient roadkeeper at home',self.diag()['scene']=='valley' and self.ev('()=>Realm.diagnostics.roadkeeper===null'));self.close()
  def enter_fresh(self,outcome):
   self.enter();self.page.keyboard.press('p');self.page.wait_for_function('()=>Realm.diagnostics.adventure.paused&&Realm.diagnostics.roadkeeper!==null')
   v=self.ev('()=>Realm.diagnostics.roadkeeper');self.check('actual incoming trip begins fresh civilian at supported home',safe_view(v,outcome) and v['cycle']==0 and v['phase']=='home' and base.distance(v,HOME)<1e-8,v)
   self.page.keyboard.press('p')
  def service(self,person,claimed,outcome):
   self.walk_world(person);self.workspace('journal')
   opener={'elderweald-sela':'wild-signs-open','elderweald-rill':'expedition-open','merren':'community-open'}[person]
   self.click('[data-rpg="'+opener+'"]');before=self.state();raw=self.ev('()=>localStorage.getItem(RealmCharacters.KEY)')
   reading=self.page.locator('[data-road-account-service="'+person+'"]');self.check('actual '+person+' reaction follows claimed owner only',reading.count()==(1 if claimed else 0))
   authored=self.ev('id=>RealmEarthRoadAccount.reading(id,Realm.state)',person)
   if claimed:
    self.check('actual '+person+' reaction retains canonical outcome metadata',authored and authored['personId']==person and authored['resolution']==outcome and reading.get_attribute('data-road-account-outcome')==outcome)
    if person!='elderweald-sela':self.check('actual '+person+' renders its current authored practical role lines',account_surface(person,outcome,authored,reading.locator('p').all_text_contents()))
   else:self.check('actual readonly account API also refuses unclaimed reading',authored is None)
   if person=='elderweald-rill':self.check('original deliberate patrol service retained',self.page.locator('.expedition-patrol').count()==1 and self.page.locator('[data-rpg="expedition-patrol-accept"]').count()==1)
   if person=='merren':self.check('original Merren community service retained',self.page.locator('.community-page').count()==1)
   if person=='elderweald-sela':
    self.check('existing field account original panel retained',self.page.locator('[data-wild-signs-panel]').count()==1)
    self.check('all original existing Earth work links retained',all(self.page.locator('.wild-signs-services [data-rpg="'+action+'"]').count()==1 for action in ('world-inspect','expedition-open','community-open','consignment-open','world-return')))
    notice=self.page.locator('[data-road-account-notice]');authored_notice=self.ev('()=>RealmEarthRoadAccount.notice(Realm.state)')
    if claimed:
     self.check('claimed Sela notice preserves observed uncertainty and the current authored route choice',notice.count()==1 and reading.locator('[data-road-account-notice]').count()==1 and notice.get_attribute('data-road-account-outcome')==outcome and account_surface(person,outcome,authored,notice.locator('p').all_text_contents(),authored_notice,reading.locator('.wild-signs-payment').all_text_contents()))
     self.check('claimed Sela renders exactly one existing payment receipt with no enabled claim',self.page.locator('[data-wild-signs-panel] .wild-signs-payment').all_text_contents()==[PAID_TEXT] and self.page.locator('[data-rpg="wild-signs-claim"]:not([disabled])').count()==0)
    else:self.check('unclaimed account has no claimed road notice',notice.count()==0 and authored_notice is None)
   self.page.wait_for_timeout(BUDGETS['pauseMs']);self.check('reading alone changes no paused world or native bytes',self.state()==before and self.ev('()=>localStorage.getItem(RealmCharacters.KEY)')==raw)
   self.row.setdefault('roadAccountReadings',[]).append(dict(person=person,claimed=claimed,outcome=outcome,authored=authored,authoredNotice=authored_notice if person=='elderweald-sela' else None,renderedKind='public-notice-with-existing-payment' if person=='elderweald-sela' else 'role-reading',rendered=reading.inner_text() if claimed else None,scene=self.diag()['scene'],nativePlayer=self.diag()['adventure']['player'],stateUnchanged=True,storedBytesUnchanged=True))
   self.close()
  def pure_diagnostics(self,outcome):
   value=self.ev(r"""()=>{const before=JSON.stringify(Realm.state),raw=localStorage.getItem(RealmCharacters.KEY),first=Realm.diagnostics.roadkeeper;let same=true;
   for(let i=0;i<25;i++)same&&=JSON.stringify(Realm.diagnostics.roadkeeper)===JSON.stringify(first);
   return{same,state:before===JSON.stringify(Realm.state),storage:raw===localStorage.getItem(RealmCharacters.KEY),first};}""")
   self.check('prepared diagnostics are pure/bounded and expose no opaque authority',value['same'] and value['state'] and value['storage'] and safe_view(value['first'],outcome),value)
  def pause_controls(self,outcome):
   self.close();self.page.keyboard.press('p');self.hold_native_keys_for_frames(())
   before=self.sample();self.page.wait_for_timeout(BUDGETS['pauseMs']);after=self.sample()
   self.check('native P stops whole clock/state/civilian and storage',before['world']==after['world'] and before['stored']==after['stored'] and before['view']==after['view'] and after['view']['paused'] is True and not after['view']['walking'])
   self.pure_diagnostics(outcome);self.page.keyboard.press('p');self.panel();self.hold_native_keys_for_frames(())
   before=self.sample();self.page.wait_for_timeout(BUDGETS['pauseMs']);after=self.sample()
   self.check('actual text menu stops world/routine and creates no progress',before['world']==after['world'] and before['stored']==after['stored'] and before['view']==after['view'] and after['view']['paused'] is True and not after['view']['walking'])
   self.close()
  def trip(self,outcome):
   self.walk_world('elderweald-sela');self.close();before=self.state();facts=reaction_facts(before);witness=TripWitness();started=time.monotonic();samples=0;last=None;retained=[];last_phase=None
   trace=self.row['roadkeeperTrip']=dict(samples=retained,totalSamples=0,phaseOrder=[],meters=0,complete=False,before=before)
   reserve=self.ev('()=>({services:RealmWorldFoundations.definition("earthlands").points.filter(p=>p.kind==="person"),notice:{x:RealmEarthWildSignsData.giver.x+1.4,z:RealmEarthWildSignsData.giver.z+.45}})')
   while time.monotonic()-started<BUDGETS['tripSeconds'] and samples<BUDGETS['samplesPerTrip']:
    s=self.sample();v=s['view'];need(safe_view(v,outcome) and s['scene']==ROOM and not s['paused'] and not s['hidden'] and not v['menuOpen'] and v['suspended'] is None,'Actual live same-room unsuspended roadkeeper required')
    need(reaction_facts(s['world'])==facts,'Passive trip changed progression/economy/history')
    need(self.ev('p=>RealmWorldFoundations.walkable("world-earthlands",p.x,p.z,.6)',v),'Sampled civilian ground is unsupported')
    if last:need(self.ev('p=>RealmWorldFoundations.segment("world-earthlands",p[0],p[1],.6)',[last,v]),'Sampled actual civilian segment lost support')
    need(all(base.distance(v,e)>=5.6-1e-6 for e in s['enemies'] if e['hp']>0 and not e.get('hidden')),'Civilian entered a current live threat reserve')
    need(all(base.distance(v,p)>=3.6-1e-6 for p in reserve['services']) and base.distance(v,reserve['notice'])>=1.6-1e-6,'Civilian entered original service/notice reserves')
    witness.add(v,s['elapsed']);samples+=1
    if v['phase']!=last_phase or samples%20==0:retained.append(dict(elapsed=s['elapsed'],view=v));last_phase=v['phase']
    trace.update(totalSamples=samples,phaseOrder=list(witness.phases),meters=witness.meters,wallSeconds=time.monotonic()-started,lastElapsed=s['elapsed'])
    last=v
    if witness.complete:break
    self.page.wait_for_timeout(100)
   self.check('complete ordinary-RAF supported outbound/inspection/return without player reward',witness.complete and witness.meters>200 and reaction_facts(self.state())==facts,dict(phases=witness.phases,meters=witness.meters,samples=samples,wallSeconds=time.monotonic()-started))
   trace.update(complete=True,after=self.state(),noAdditionalProgress=True)

  def orbit(self,yaw,elevation):
   # Original native right-drag controls; no camera assignment or frame command.
   for _ in range(12):
    c=self.diag()['camera'];delta=math.atan2(math.sin(c['yaw']-yaw),math.cos(c['yaw']-yaw));dy=(elevation-c['elevation'])/.004
    if abs(delta)<.01 and abs(dy)<1:break
    box=self.page.locator('#world').bounding_box();need(box is not None,'Native actual canvas must be addressable')
    x=box['x']+box['width']*.5;y=box['y']+box['height']*.45;dx=max(-70,min(70,delta/.007));dy=max(-35,min(35,dy))
    self.page.mouse.move(x,y);self.page.mouse.down(button='right');self.page.mouse.move(x+dx,y+dy,steps=4);self.page.mouse.up(button='right');self.hold_native_keys_for_frames(())
  def approach(self,target,near=.7,seconds=None):
   # Every target is an actual supported waypoint projected by the current
   # Engine; actual native canvas clicks let original Core.moveTo own precision.
   budget=BUDGETS['approachSeconds'] if seconds is None else min(BUDGETS['approachSeconds'],seconds)
   need(type(budget) in (int,float) and math.isfinite(budget) and 0<budget<=BUDGETS['approachSeconds'],'Finite bounded actual approach deadline required')
   self.close();started=time.monotonic();attempts=0;last=self.diag()['adventure']['player']
   while time.monotonic()-started<budget:
    d=self.diag();p=d['adventure']['player']
    if base.distance(p,target)<=near:return
    route=self.ev('t=>RealmCore.pathfind(Realm.diagnostics.adventure.player,t,{id:"world-earthlands"})',target);need(bool(route),'Actual supported approach unavailable')
    q=route[0];distance=base.distance(p,q);need(distance>0,'Actual route cannot advance')
    if distance>3:q=dict(x=p['x']+(q['x']-p['x'])*3/distance,z=p['z']+(q['z']-p['z'])*3/distance)
    self.orbit(math.atan2(p['x']-q['x'],p['z']-q['z']),.5)
    screen=self.ev('p=>Realm.project(p.x,RealmWorldFoundations.height("world-earthlands",p.x,p.z)+.02,p.z)',q)
    box=self.page.locator('#world').bounding_box();need(screen and screen.get('visible') and box and box['x']+2<screen['x']<box['x']+box['width']-2 and box['y']+2<screen['y']<box['y']+box['height']*.78,'Actual supported point is not visibly addressable; no primed-camera fallback')
    self.page.mouse.click(screen['x'],screen['y']);attempts+=1
    # At most3m; wait on actual movement, never skip a concave corner on proximity.
    interval=time.monotonic();moved=False
    while time.monotonic()-interval<5 and time.monotonic()-started<budget:
     after=self.diag()['adventure']['player'];need(self.ev('p=>RealmWorldFoundations.segment("world-earthlands",p[0],p[1],.31)',[last,after]),'Native approach displacement is unsupported');last=after
     moved=moved or base.distance(p,after)>.05
     if base.distance(after,q)<.4:break
     self.page.wait_for_timeout(100)
    need(moved,'Original native projected ground click did not move; no teleport/key/controller success substitute')
   raise TimeoutError('Actual projected-ground native approach failed within '+str(budget)+' seconds, attempts='+str(attempts))
  def cameras(self,outcome):
   # Catch the actor using ordinary movement; pause it only once close enough.
   for index,(width,height,mode,reduced) in enumerate(CONFIGS):
    previous=self.sample();self.close();self.click('#settings');self.page.locator('#camera-mode').select_option(mode);self.page.locator('#setting-reducedMotion').set_checked(reduced);self.click('#close-panel');self.page.set_viewport_size(dict(width=width,height=height));self.hold_native_keys_for_frames(())
    current=self.sample();self.check('native camera/reduced-motion changes retain same owner/routine',safe_view(current['view'],outcome) and current['active']==previous['active'] and current['view']['cycle'] in (previous['view']['cycle'],previous['view']['cycle']+1) and base.distance(previous['view'],current['view'])<=1.15*(current['elapsed']-previous['elapsed'])+.001)
    self.check('actual native camera/reduced-motion selection applied',current['camera']['preset']==mode and current['world']['settings']['reducedMotion'] is reduced)
    caught=time.monotonic()
    while time.monotonic()-caught<BUDGETS['cameraCatchSeconds']:
     s=self.sample();need(safe_view(s['view'],outcome),'Actual current civilian must remain readable for framing')
     if base.distance(s['player'],s['view'])<4:break
     v=s['view'];self.approach(dict(x=v['x'],z=v['z']),near=2.4,seconds=BUDGETS['cameraCatchSeconds']-(time.monotonic()-caught))
    else:raise TimeoutError('Actual civilian was not approached for native camera within180 seconds')
    s=self.sample();self.orbit(math.atan2(s['player']['x']-s['view']['x'],s['player']['z']-s['view']['z']),.45 if mode=='adventure' else .65)
    self.hold_native_keys_for_frames(())
    projection=self.ev(PROJECTION_JS);self.check('actual ordinary WorldArt roadkeeper visible in '+mode+' '+str(width),projection and projection['parts']==19 and projection['clipped']==0 and projection['span']['width']>=10 and projection['span']['height']>=24,projection)
    self.page.screenshot(path=str(self.folder/('ROADKEEPER_ORDINARY_'+str(index)+'.png')))
    self.page.keyboard.press('p');self.hold_native_keys_for_frames(());gpu=self.ev(PIXELS_JS)
    self.check('separate paused actual GPU on/off/restored silhouette is visible and pure',gpu['pixels']>=25 and gpu['restoredPixels']==0 and gpu['sameMembers'] and gpu['stateUnchanged'] and gpu['glError']==0,gpu)
    self.row.setdefault('roadkeeperCameras',[]).append(dict(configuration=[width,height,mode,reduced],ordinaryProjection=projection,pausedGPUControl=gpu,scope='Native camera/ordinary packed WorldArt plus separate paused GPU control; no manual App/Core frame'))
    self.page.keyboard.press('p')
  def death(self):
   self.close();before=self.state();original_mode=before['adventure']['companion']['mode']
   changed_companion=before['adventure']['companion']['bonded'] and original_mode!='stay'
   if changed_companion:self.workspace('companion');self.click('[data-rpg="companion"][data-id="stay"]');self.close()
   enemy=next((e for e in self.diag()['adventure']['enemies'] if e['id']=='earthlands-coppice-skitter' and e['hp']>0),None);need(enemy is not None,'Actual canonical existing baseline hostile unavailable; no planted enemy')
   target=self.ev('e=>{const p=Realm.diagnostics.adventure.player;return Array.from({length:8},(_,i)=>({x:e.x+Math.sin(i*Math.PI/4)*6,z:e.z+Math.cos(i*Math.PI/4)*6})).filter(q=>RealmWorldFoundations.walkable("world-earthlands",q.x,q.z,.31)&&RealmCore.pathfind(p,q,{id:"world-earthlands"})).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0]||null;}',enemy)
   need(target is not None,'Actual supported hostile approach unavailable');self.approach(target);started=time.monotonic();hits=[];last_hp=self.state()['adventure']['hp']
   while time.monotonic()-started<BUDGETS['deathSeconds']:
    s=self.sample();hp=s['world']['adventure']['hp'];current=next((e for e in s['enemies'] if e['id']==enemy['id']),None)
    need(current and current['hp']==enemy['hp'],'Passive civilian/companion must not damage or defeat the baseline hostile')
    need(s['world']['earthWildSigns']==before['earthWildSigns'],'Native damage cannot change the claimed account')
    if hp<last_hp:hits.append(dict(hp=hp,elapsed=s['elapsed']))
    last_hp=hp
    if hp==0:break
    self.page.wait_for_timeout(100)
   self.check('actual existing hostile inflicts death without manual damage',last_hp==0 and hits and self.state()['adventure']['deaths']==before['adventure']['deaths']+1,hits)
   self.check('actual death invalidates prepared civilian',self.ev('()=>Realm.diagnostics.roadkeeper===null'))
   self.page.wait_for_selector('#fallen-dialog[open]');self.click('#revive-button');self.page.wait_for_function('()=>Realm.diagnostics.scene==="valley"&&Realm.state.adventure.hp>0')
   self.check('original revive returns home with no old civilian or additional account/economy progress',self.ev('()=>Realm.diagnostics.roadkeeper===null') and self.state()['earthWildSigns']==before['earthWildSigns'] and self.state()['localLife']==before['localLife'] and self.state()['adventure']['coins']==before['adventure']['coins'] and self.state()['adventure']['xp']==before['adventure']['xp'] and self.state()['sandbox']['inventory']==before['sandbox']['inventory'])
   if changed_companion:self.workspace('companion');self.click('[data-rpg="companion"][data-id="'+original_mode+'"]');self.close()
   self.check('genuine death/revive admits only existing two history events and native receipts',death_transition(before,self.state(),changed_companion))
   self.row['genuineDeath']=dict(enemy=enemy['id'],hits=hits,deathSeconds=time.monotonic()-started,manualDamage=False,injectedState=False,declaredExistingDeathDelta=True,before=before,after=self.state())
  def run_account(self,row,outcome):
   self.start();self.page.set_default_timeout(10000);self.import_world(row['before']['files']['world'])
   self.check('actual imported unclaimed source identity retained',base.import_preserved(row['before']['world'],self.state()));self.enter()
   self.check('unclaimed account cannot start civilian',self.ev('()=>Realm.diagnostics.roadkeeper===null'))
   for person in PEOPLE:self.service(person,False,outcome)
   self.home();self.import_added(row['claimed']['files']['world'],'character-3')
   self.origin_world=row['claimed']['world'];self.original_facts=self.stable_facts(self.origin_world)
   self.enter_fresh(outcome)
   claimed_facts=reaction_facts(self.state())
   for person in PEOPLE:self.service(person,True,outcome)
   self.check('claimed readings do not add payment/progression/history',reaction_facts(self.state())==claimed_facts)
   self.pause_controls(outcome);self.trip(outcome);self.cameras(outcome)
   self.check('entire claimed reading/routine/camera pass adds no progression/economy/history',reaction_facts(self.state())==claimed_facts)
   self.switch('character-2');self.enter();self.check('other unclaimed owner has no claimed reaction or civilian',self.ev('()=>Realm.diagnostics.roadkeeper===null'));self.home()
   self.switch('character-3');self.enter_fresh(outcome);self.home();self.restart('ROAD_ACCOUNT_COLD');self.enter_fresh(outcome)
   if outcome=='signed-loop':self.death()
   self.capture('ROAD_ACCOUNT_FINAL');self.check('ordinary product exposes no Realm.test issuer',self.ev('()=>typeof Realm.test==="undefined"'))
 return RoadAccount

def main(argv=None):
 p=argparse.ArgumentParser(description=__doc__)
 for name in ('root','inputs','expectations','output'):p.add_argument('--'+name,type=Path,required=True)
 p.add_argument('--expected-head',required=True);p.add_argument('--renderer',choices=('hardware','software'),required=True)
 p.add_argument('--execute',action='store_true',help='Parent-owned browser execution only after explicit installed epoch admission; default is read-only check')
 a=p.parse_args(argv);absolute=a.output.is_absolute();a.root=a.root.resolve();a.output=a.output.resolve()
 need(absolute and not a.output.exists() and a.root!=a.output and a.root not in a.output.parents,'Fresh absolute bounded output outside ROOT required')
 rows,frozen,original=admit_inputs(a.root,a.inputs,a.expectations);epoch=installed_epoch(a.root,a.expected_head,a.expectations)
 manifest=read(a.inputs)
 need(manifest['schema']=='road-account-native-checkpoints-v2' and original['head']==epoch['head'] and original['html_sha256']==epoch['htmlSha256'],'Future installed acceptance requires current primary native suite at exactly this HEAD/page, not historical preparation inputs')
 frozen.update({str(Path(__file__).resolve()):sha(__file__),**{str(a.root/k):v for k,v in epoch['runtimeSources'].items()},str(a.root/'index.html'):epoch['htmlSha256'],str(a.root/'FIRSTLIGHT_VALLEY.html'):epoch['htmlSha256']})
 if not a.execute:
  print(json.dumps(dict(status='admitted-only',browserExecuted=False,serverStarted=False,filesystemWrites=0,epoch=epoch,budgets=BUDGETS,inputs=frozen),indent=2));return
 # Resource ownership starts before any execute-only import/startup. No
 # output, original helper, server or browser is created by read-only preflight.
 report=dict(status='running',head=epoch['head'],html_sha256=epoch['htmlSha256'],admittedInputs=frozen,budgets=BUDGETS,cases={},browserErrors=[],externalRequests=[],errors=[],execution='ordinary-production-RAF/original-native-controls',checkpointProvenance=manifest['provenance'],humanAcceptance=False,performanceCertified=False,boundaryHistoryGate='separate parent-owned WildSigns boundaries',hiddenNativeAcceptance='not exercised; no synthetic document visibility override')
 server=None;server_thread=None;server_started=False;output_owned=False;failure=None;serve_entered=threading.Event();stop_requested=threading.Event()
 try:
  report['startupStage']='output-directory';a.output.mkdir();output_owned=True
  report['startupStage']='playwright-import'
  from playwright.sync_api import sync_playwright
  report['startupStage']='original-helper-load'
  suite=load(a.root/'tools/earth_wild_signs_browser.py','road_account_actual_native_suite');base=suite.load_base(a.root);Native=driver_class(suite,base)
  class Handler(SimpleHTTPRequestHandler):
   def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(a.root),**kwargs)
   def log_message(self,*args):pass
  report['startupStage']='server-construction';server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
  def serve_owned():
   if stop_requested.is_set():return
   serve_entered.set();server.serve_forever()
  report['startupStage']='server-thread';server_thread=threading.Thread(target=serve_owned,daemon=True);server_thread.start();server_started=True
  origin='http://127.0.0.1:'+str(server.server_port);report['startupStage']='native-cases'
  with sync_playwright() as pw:
   for outcome in ('signed-loop','cleared-pocket'):
    h=Native(pw,a,report,origin,outcome)
    try:h.run_account(rows[outcome],outcome)
    finally:h.finish()
  need(not report['browserErrors'] and not report['externalRequests'],'Runtime errors/external requests retained')
  need(all(Path(k).is_file() and sha(k)==v for k,v in frozen.items()),'Source/native checkpoint bytes drifted during execution')
  need(installed_epoch(a.root,a.expected_head,a.expectations)==epoch,'Actual installed epoch drifted')
  report['status']='passed'
 except Exception as error:
  failure=error;report['status']='failed';report['errors'].append(traceback.format_exc());raise
 finally:
  close_problem=None;stop_requested.set();report['serverAllocated']=server is not None;report['serverStarted']=server_thread is not None and server_thread.ident is not None;report['serverClosed']=server is None
  if server is not None:
   # The actual owned target signals entry. An unentered/failed start must
   # never call shutdown(), which otherwise waits forever for serve_forever.
   if report['serverStarted'] and server_thread.is_alive() and serve_entered.wait(timeout=1):
    try:server.shutdown()
    except Exception as error:
     close_problem=error;report['status']='failed';report['errors'].append(traceback.format_exc())
   socket_closed=False
   try:server.server_close();socket_closed=True
   except Exception as error:
    close_problem=close_problem or error;report['status']='failed';report['errors'].append(traceback.format_exc())
   if server_thread is not None and server_thread.ident is not None:
    server_thread.join(timeout=5)
    if server_thread.is_alive():
     error=RuntimeError('Owned native server thread did not close within 5 seconds');close_problem=close_problem or error;report['status']='failed';report['errors'].append(str(error))
   report['serverSocketClosed']=socket_closed;report['serverThreadClosed']=server_thread is None or not server_thread.is_alive()
   report['serverClosed']=socket_closed and report['serverThreadClosed'] and close_problem is None
  report['retention']='All isolated synthetic profiles, failures, screenshots, close receipts and exact native bytes retained; no deletion or personal profile.'
  if output_owned and a.output.is_dir():
   try:dump(a.output/'ROAD_ACCOUNT_NATIVE_REPORT.json',report)
   except Exception as error:
    # A failed evidence write cannot hide the original startup/run exception.
    if failure is not None:print('Native report write failed: '+traceback.format_exc(),file=sys.stderr)
    else:close_problem=close_problem or error
  if failure is None and close_problem is not None:raise close_problem

if __name__=='__main__':main()
