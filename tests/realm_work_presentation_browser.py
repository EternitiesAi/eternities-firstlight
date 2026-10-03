"""Southern work props through native UI and ordinary-time software Chromium.

A disposable profile imports the checked-in command-earned Chapter I checkpoint
as a new character. Visible Roads/trail routes, accept/step/choice/claim controls,
WASD/F/G, pause and V own all movement/progression. No test mode, coordinate write,
direct rule command, accelerated tick, progress grant or personal save is used.
Read-only observers inspect actual production submissions. Labelled appearance-
only one-frame ablations preserve identical render arguments and restore writer,
batches, state, camera and collision before the next simulation frame. A labelled
native-storage quota refusal tests the real UI save boundary and is restored.
This is software integration/pixel evidence, not hardware cost or human approval.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import base64, hashlib, json, math, os, subprocess, tempfile, threading, time, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

ROOT=Path(os.environ.get('FIRSTLIGHT_TEST_ROOT',Path(__file__).resolve().parents[1])).resolve()
OUT=Path(os.environ.get('FIRSTLIGHT_REALM_WORK_OUTPUT',ROOT/'evidence10/realm-work-presentation-browser')).resolve()
OUT.mkdir(parents=True,exist_ok=True)
FIXTURE=ROOT/'examples/CHAPTER_COMPLETED_EARNED.json'
(OUT/'HARNESS.py').write_bytes(Path(__file__).read_bytes())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
sources=['src/realm-trails-art.js','src/realm-trails-south.js','src/realm-trails.js','src/realm-trails-ui.js',
 'src/world-atlantis-earth.js','src/world-foundations.js','src/world-foundations-art.js','src/world-foundations-ui.js',
 'tests/browser_support.py','src/world.js','src/engine.js','src/app.js','src/core.js','src/characters.js','src/characters-ui.js','build.py']
report={'method':__doc__,'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
 'html_sha256':sha(ROOT/'index.html'),'html_bytes':(ROOT/'index.html').stat().st_size,'harness_sha256':sha(Path(__file__)),
 'sources':{p:sha(ROOT/p) for p in sources},'fixture':{'path':str(FIXTURE.relative_to(ROOT)),'sha256':sha(FIXTURE),
 'label':'Checked-in command-earned Chapter I completed checkpoint; not Chapter IV; native import adds a new isolated slot.'},
 'checks':[],'errors':[],'browser_errors':[],'observations':{},'routes':[],'outputs':{},
 'scope':os.environ.get('FIRSTLIGHT_REALM_WORK_SCOPE','both'),
 'detail_probe':os.environ.get('FIRSTLIGHT_DETAIL_PROBE','all')}
for env,key in [('FIRSTLIGHT_EXPECT_HEAD','head'),('FIRSTLIGHT_EXPECT_HTML_SHA','html_sha256')]:
 if os.environ.get(env) and os.environ[env]!=report[key]:raise RuntimeError('Requested source epoch mismatch: '+key)
if report['scope'] not in ['both','atlantis']:raise RuntimeError('Unknown qualification scope')
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*a):pass
def check(name,passed,evidence=None):
 row={'name':name,'passed':bool(passed)}
 if evidence is not None:row['evidence']=evidence
 report['checks'].append(row);print(('PASS ' if passed else 'FAIL ')+name,flush=True)
 if not passed:raise AssertionError(name)
def ev(js,arg=None):return page.evaluate(js,arg)
def state():return ev('()=>Realm.state')
def diag():return ev('()=>Realm.diagnostics')
def player():return diag()['adventure']['player']
def close():
 if page.locator('#rpg-window').evaluate('(e)=>e.open'):page.locator('#rpg-close').click()
 if page.locator('#drawer').evaluate('(e)=>e.classList.contains("open")'):page.locator('#close-panel').click()
def pause(value):
 close()
 if diag()['adventure']['paused']!=value:page.keyboard.press('p')
 page.wait_for_function('v=>Realm.diagnostics.adventure.paused===v',arg=value,polling=100)
def roads():
 close();page.keyboard.press('j');page.locator('#rpg-tabs [data-rpg="open"][data-id="worlds"]').click()
def local():
 close();page.locator('#tracked-open').click()
def record(realm):return state()['realmTrails']['records'][QUESTS[realm]['id']]
def gear(s):return {k:s['adventure'][k] for k in ['owned','equipment','arsenal','pursuit','starter','classPath','realmCraft','companion']}
def wait_route(target,label,timeout=180000):
 started=time.monotonic();samples=[]
 while time.monotonic()-started<timeout/1000:
  d=diag();p=d['adventure']['player'];distance=math.hypot(p['x']-target['x'],p['z']-target['z'])
  samples.append({'x':p['x'],'z':p['z'],'y':d.get('world',{}).get('height',1.3) if d.get('world') else 1.3,'hp':state()['adventure']['hp']})
  if distance<2.1:break
  if samples[-1]['hp']<=0:raise AssertionError('Route died: '+label)
  page.wait_for_timeout(250)
 else:raise TimeoutError('Normal UI route did not arrive: '+label)
 report['routes'].append({'label':label,'method':'Visible route button and native RAF/pathfinder','wall_seconds':time.monotonic()-started,'target':target,'samples':samples})
 check('normal route reaches '+label+' alive',samples[-1]['hp']>0 and distance<2.1,player())
def walk_step(realm,step=None):
 pause(False);local();id=step or '';page.locator('[data-rpg="trail-walk"][data-id="'+id+'"]').click()
 target=next(s for s in QUESTS[realm]['steps'] if s['id']==step) if step else QUESTS[realm]['giver']
 wait_route(target,step or QUESTS[realm]['giver']['name'])
 page.wait_for_function('p=>{const d=Realm.diagnostics,s=d.adventure.player;return Math.hypot(p.x-s.x,p.z-s.z)<=2.8}',arg=target,polling=100)
def walk_map(point):
 pause(False);roads();page.locator('#rpg-tabs [data-rpg="open"][data-id="atlas"]').click()
 target=ev('id=>RealmWorldFoundations.definition(Realm.diagnostics.scene).points.find(p=>p.id===id)',point)
 label=ev('id=>{const d=RealmWorldFoundations.definition(Realm.diagnostics.scene),n=d.points.findIndex(p=>p.id===id);return(n+1)+". "+d.points[n].name;}',point)
 page.get_by_role('button',name=label,exact=True).click()
 wait_route(target,point)
def enter(realm):
 pause(False);roads()
 if page.locator('[data-rpg="world-list"]').count():page.locator('[data-rpg="world-list"]').click()
 page.locator('[data-rpg="world-select"][data-id="'+realm+'"]').click()
 page.locator('[data-rpg="world-preview"]').click();page.locator('[data-rpg="world-confirm"]').click()
 page.wait_for_function('r=>Realm.diagnostics.scene==="world-"+r',arg=realm,polling=100)
 page.wait_for_function('()=>__realmWorkObservation.ready()',polling=100)
def home():
 close();page.locator('#world-home').click();page.wait_for_function('()=>Realm.diagnostics.scene==="valley"',polling=100)
def reload_home():
 before=state();close();page.reload(wait_until='load');page.wait_for_function('()=>!!window.Realm&&Realm.diagnostics.characters.writer',polling=100)
 check('native reload retains exact trail ledger, inventory and equipment at home',diag()['scene']=='valley' and state()['realmTrails']==before['realmTrails'] and state()['sandbox']['inventory']==before['sandbox']['inventory'] and gear(state())==gear(before))
 ev(OBSERVER)
def native_export(label):
 """Retain an actual production Characters export; never reconstruct progress."""
 close();page.keyboard.press('c');page.locator('#rpg-tabs [data-rpg="open"][data-id="characters"]').click()
 active=diag()['characters']['active']
 with page.expect_download() as downloaded:
  page.locator('[data-rpg="chars-export"][data-id="'+active+'"]').click()
 filename='NATIVE_EARNED_'+label+'.json';downloaded.value.save_as(str(OUT/filename))
 report['observations']['native_export_'+label]={'file':filename,'sha256':sha(OUT/filename),'bytes':(OUT/filename).stat().st_size,'method':'Actual Characters Export button from the natively earned isolated character; no reconstructed ledger or grants.'}
 close()

def act(realm,step,choice=None):
 pause(True);local();id=step+(':'+choice if choice else '')
 page.locator('[data-rpg="trail-step"][data-id="'+id+'"]').click()
 page.wait_for_function('([q,s])=>Realm.state.realmTrails.records[q].steps.includes(s)',arg=[QUESTS[realm]['id'],step],polling=100)
 close();page.wait_for_function('s=>__realmWorkObservation.snapshot().parts.some(p=>p.item.trailStep===s&&p.item.workState==="recorded")',arg=step,polling=100)
 check('visible UI commits '+realm+'/'+step,step in record(realm)['steps'])
def orbit_yaw(target):
 """Normal right-button canvas orbit; no camera field assignment."""
 old=diag()['camera']['yaw'];delta=math.atan2(math.sin(old-target),math.cos(old-target))
 if abs(delta)>.001:
  page.mouse.move(500,400);page.mouse.down(button='right');page.mouse.move(500+delta/.007,400);page.mouse.up(button='right')
 page.wait_for_function('v=>Math.abs(Math.atan2(Math.sin(Realm.diagnostics.camera.yaw-v),Math.cos(Realm.diagnostics.camera.yaw-v)))<.007',arg=target,polling=100)
 return old

def swim(target,label):
 """One real native-frame key pulse; release before settled lightweight read."""
 pause(False);old_yaw=orbit_yaw(0);started=time.monotonic();samples=[]
 route={'label':label,'method':'Normal right-drag yaw alignment, native world-axis WASD/F/G pulse until actual elapsed advances, release then settled read; original yaw restored by right drag','target':target,'samples':samples};report['routes'].append(route)
 sample=lambda:ev('()=>__realmWorkObservation.light()')
 water=label in ['upper-gauge','lower-masonry','modern-marker','far-gallery-landing']
 try:
  while time.monotonic()-started<95:
   d=sample();dx=target[0]-d['p']['x'];dz=target[2]-d['p']['z'];dy=target[1]-d['v']['y'];h=math.hypot(dx,dz)
   samples.append({'x':d['p']['x'],'y':d['v']['y'],'z':d['p']['z'],'body':d['v']['body'],'hp':d['hp'],'elapsed':d['elapsed'],'clear':d['clear']})
   if h<=.15 and abs(dy)<=.15 and d['clear'] and (not water or d['v']['body']=='water'):break
   key=('f' if dy>0 else 'g') if abs(dy)>.15 else (('d' if dx>0 else 'a') if abs(dx)>abs(dz) else ('s' if dz>0 else 'w'))
   try:
    page.keyboard.down(key)
    page.wait_for_function('t=>__realmWorkObservation.light().elapsed>t',arg=d['elapsed'])
   finally:page.keyboard.up(key)
   # These are ordinary RAF callbacks, not generated simulation frames.
   ev('()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
  else:raise TimeoutError('Native swim did not arrive '+label)
 finally:orbit_yaw(old_yaw)
 route['wall_seconds']=time.monotonic()-started
 check('native keys reach '+label+' within .15 m at settled real XYZ and valid full-body clearance',h<=.15 and abs(dy)<=.15 and d['clear'] and d['hp']>0 and (not water or d['v']['body']=='water'),samples[-1])

# Capture the existing WorldArt only through its actual room commit. No pure
# decorator is invoked by the observer, and the wrapper restores itself once
# the requested real realm is committed. Re-arm after each home/reload.
OBSERVER=r"""()=>{
 const proto=RealmArt.WorldArt.prototype,original=proto.commit,originalUpdate=proto.update;let owner=null,subject=null;
 proto.commit=function(...args){const result=original.apply(this,args);if(['world-earthlands','world-atlantis'].includes(this.room)){owner=this;proto.commit=original;}return result;};
 proto.update=function(sim,...args){const result=originalUpdate.call(this,sim,...args);if(this===owner){subject=sim;proto.update=originalUpdate;}return result;};
 const clone=v=>JSON.parse(JSON.stringify(v)),selected=(i,s)=>s.staticRoof?i.worldSolidId===s.staticRoof:i.appearanceOnly&&i.trailStep===(typeof s==='string'?s:s.step)&&(typeof s==='string'||s.roles.includes(i.trailPart));
 const signature=()=>JSON.stringify({state:Realm.state,player:Realm.diagnostics.adventure.player,dive:Realm.diagnostics.world.dive,camera:owner.e.camera,vp:Array.from(owner.e.vp),solids:owner.e.cameraSolids,definition:RealmWorldFoundations.definition(owner.room)});
 window.__realmWorkObservation={
  ready(){return !!owner&&!!subject&&owner.room===Realm.diagnostics.scene&&owner.e.dynamic.some(b=>b.items.some(i=>i.appearanceOnly&&i.trailQuest));},
  light(){if(!subject||!subject.worldDive)throw Error('No real diving subject');const p=subject.state.player,v=subject.worldDive,d=RealmWorldFoundations.definition(subject.room).dive;return{p:{x:p.x,z:p.z},v:{y:v.y,body:RealmWorldFoundations.medium(subject,[p.x,v.y+.85,p.z])},elapsed:subject.elapsed,hp:subject.state.adventure.hp,clear:RealmWorldFoundations.swimClear(d,p.x,v.y,p.z),paused:subject.paused};},
  snapshot(){if(!this.ready())throw Error('No current actual work submission');const e=owner.e,E=RealmEngine,parts=[];
   for(const b of e.dynamic)for(let index=0;index<b.items.length;index++){const item=b.items[index];if(!item.trailQuest)continue;
    const m=Array.from(b.data.slice(index*24,index*24+16)),g=E.geometry(b.kind),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];let finite=m.every(Number.isFinite);
    for(let j=0;j<g.length;j+=6){const v=E.M.transform(m,g.slice(j,j+3));finite=finite&&v.every(Number.isFinite);for(let k=0;k<3;k++){min[k]=Math.min(min[k],v[k]);max[k]=Math.max(max[k],v[k]);}}
    const expected=item.m||E.M.compose(...item.p,...item.s,...(item.r||[0,0,0])),cols=[0,4,8].map(i=>m.slice(i,i+3));
    parts.push({kind:b.kind,min,max,finite,matrix:m,matrixMatches:m.every((v,i)=>v===Math.fround(expected[i])),positiveBasis:E.dot(cols[0],E.cross(cols[1],cols[2]))>0,supported:!!b.vao&&b.geom.count===g.length/6,vertices:g.length/6,cameraBounds:E.solidBounds(b.kind,item),item:clone({...item,m:item.m?Array.from(item.m):null})});
   }return{parts,definition:clone(RealmWorldFoundations.definition(owner.room)),player:Realm.diagnostics.adventure.player,dive:clone(Realm.diagnostics.world.dive),camera:clone(e.camera),cameraSolids:clone(e.cameraSolids),reducedMotion:!!e.reducedMotion,cutaway:!!e.cutaway,roofOpen:!!e.worldRoofOpen,observerRestored:proto.commit===original&&proto.update===originalUpdate};
  },
  ablate(step){if(!this.ready())throw Error('No work owner');const e=owner.e,writer=e.render,hadOwn=Object.hasOwn(e,'render'),restoreWriter=()=>{if(hadOwn)e.render=writer;else delete e.render;};
   return new Promise((resolve,reject)=>{e.render=function(...args){restoreWriter();const saved=[...e.batches,...e.dynamic].map(b=>({b,items:b.items,data:b.data,count:b.count})),before=signature();
    const read=()=>{const g=e.gl,a=new Uint8Array(e.mainF.w*e.mainF.h*4);g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);g.readPixels(0,0,e.mainF.w,e.mainF.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;};
    const png=a=>{const c=document.createElement('canvas');c.width=e.mainF.w;c.height=e.mainF.h;const ctx=c.getContext('2d'),im=ctx.createImageData(c.width,c.height);for(let y=0;y<c.height;y++)im.data.set(a.subarray((c.height-1-y)*c.width*4,(c.height-y)*c.width*4),y*c.width*4);ctx.putImageData(im,0,0);return c.toDataURL('image/png');};
    let result;try{result=writer.apply(e,args);const baseline=read();let originalAppearance=null;
     if(step.markerCompare){for(const {b}of saved){const pp=b.items.filter(i=>!(selected(i,step)&&i.markerFace==='east'));if(pp.length!==b.items.length){b.items=pp;e.updateBatch(b);}}writer.apply(e,args);originalAppearance=read();for(const {b,items,data}of saved){b.items=items;b.data=data;e.updateBatch(b);}}
     let removed=0;
     for(const {b}of saved){const pp=b.items.filter(i=>!selected(i,step));removed+=b.items.length-pp.length;if(pp.length!==b.items.length){b.items=pp;e.updateBatch(b);}}
     writer.apply(e,args);const absent=read();for(const {b,items,data}of saved){b.items=items;b.data=data;e.updateBatch(b);}writer.apply(e,args);const recovered=read();
     let changed=0,delta=0,restoration=0,originalChangedPixels=0,addedFacePixels=0;for(let i=0;i<baseline.length;i+=4){let n=0;for(let k=0;k<3;k++){n+=Math.abs(baseline[i+k]-absent[i+k]);restoration+=Math.abs(baseline[i+k]-recovered[i+k]);}if(n>6)changed++;delta+=n;if(originalAppearance){let old=0,added=0;for(let k=0;k<3;k++){old+=Math.abs(originalAppearance[i+k]-absent[i+k]);added+=Math.abs(baseline[i+k]-originalAppearance[i+k]);}if(old>6)originalChangedPixels++;if(added>6)addedFacePixels++;}}
     resolve({step,removed,changedPixels:changed,originalChangedPixels,addedFacePixels,sumRGBDelta:delta,restorationRGBDelta:restoration,width:e.mainF.w,height:e.mainF.h,renderArguments:args,stateCameraCollisionUnchanged:before===signature(),writerRestored:e.render===writer&&Object.hasOwn(e,'render')===hadOwn,batchesRestored:saved.every(({b,items,data,count})=>b.items===items&&b.data===data&&b.count===count),glError:e.gl.getError(),camera:clone(e.camera),baselinePNG:png(baseline),absentPNG:png(absent),recoveredPNG:png(recovered)});
    }catch(error){reject(String(error));}finally{for(const {b,items,data}of saved){b.items=items;b.data=data;e.updateBatch(b);}restoreWriter();}return result;};});
  }
 };
}"""
def snapshot(label):
 data=ev('()=>__realmWorkObservation.snapshot()');report['observations'][label]=data;pp=data['parts'];work=[p for p in pp if p['item'].get('appearanceOnly')]
 check(label+' actual work matrices and meshes are finite, positive and renderer-supported',bool(work) and all(p['finite'] and p['positiveBasis'] and p['matrixMatches'] and p['supported'] for p in work))
 check(label+' work remains appearance-only without camera bounds',all(p['item']['cameraSolid'] is False and p['item']['cutaway'] is False and p['cameraBounds'] is None for p in work) and data['observerRestored'])
 return data
def fingerprint(data):return json.dumps([(p['kind'],p['item']) for p in data['parts'] if p['item'].get('appearanceOnly')],sort_keys=True)
def role(data,name):return [p for p in data['parts'] if p['item'].get('trailPart')==name]
def capture(label,step,detail=False):
 roles={'fallen-bough':['prepared-bough-piece','wood-cord'],'shore-reeds':['reed-binding','reed-knot'],
 'shore-stone':['sorted-shore-stone'],'road-pack':['packed-bough-piece','packed-job-seal'],
 'upper-gauge':['copied-gauge-tab','gauge-tab-pin'],'lower-masonry':['copied-gauge-tab','gauge-tab-pin'],
 'depth-chart':['charted-upper-layer','charted-lower-layer','charted-depth-connection','charted-court-doorway'],
 'modern-marker':['fitted-landing-plate','modern-route-arrow']}
 request={'step':step,'roles':roles[step]} if detail else step
 if detail and step=='modern-marker':request['markerCompare']=True
 data=ev('s=>__realmWorkObservation.ablate(s)',request)
 for field,suffix in [('baselinePNG','actual'),('absentPNG','appearance-ablated'),('recoveredPNG','restored')]:
  (OUT/(label+'-'+suffix+'.png')).write_bytes(base64.b64decode(data.pop(field).split(',')[1]))
 report['observations'][label]=data
 check(label+(' recorded detail' if detail else ' worksite')+' has positive actual pixel contribution',data['removed']>0 and data['changedPixels']>(0 if detail else 10),{'parts':data['removed'],'changed_pixels':data['changedPixels']})
 if detail and step=='modern-marker':check(label+' same-camera original west-only detail is hidden and the added face contributes pixels',data['originalChangedPixels']==0 and data['addedFacePixels']>0,{'original_changed_pixels':data['originalChangedPixels'],'added_face_pixels':data['addedFacePixels']})
 check(label+' one-frame ablation restores writer, batches, state, camera, collision and exact pixels',data['stateCameraCollisionUnchanged'] and data['writerRestored'] and data['batchesRestored'] and data['restorationRGBDelta']==0 and data['glError']==0)
def roof_control():
 """Actual setting toggle plus labelled one-frame visual ceiling ablation."""
 pause(True);before=state();at=player();depth=diag()['world']['dive']['y']
 check('air-court begins with the imported cutaway preference enabled',before['settings']['cameraCutaway'])
 for enabled in [False,True]:
  page.locator('#settings').click();page.locator('#setting-cameraCutaway').set_checked(enabled);page.locator('#close-panel').click()
  page.wait_for_function('v=>Realm.diagnostics.cutaway.enabled===v',arg=enabled,polling=100)
  page.wait_for_timeout(300);data=ev('()=>__realmWorkObservation.ablate({staticRoof:"bellglass-ceiling"})');label='atlantis-court-roof-'+('on' if enabled else 'off')
  for field,suffix in [('baselinePNG','actual'),('absentPNG','appearance-ablated'),('recoveredPNG','restored')]:
   (OUT/(label+'-'+suffix+'.png')).write_bytes(base64.b64decode(data.pop(field).split(',')[1]))
  report['observations'][label]=data
  check(label+' obeys actual cutaway preference',data['removed']==1 and (data['changedPixels']==0 if enabled else data['changedPixels']>10),{'changed_pixels':data['changedPixels']})
  check(label+' visual-only ceiling control restores exact pixels and all authority',data['restorationRGBDelta']==0 and data['stateCameraCollisionUnchanged'] and data['writerRestored'] and data['batchesRestored'] and data['glError']==0)
 check('roof control restores preference and preserves body depth, ledger and belongings',state()['settings']['cameraCutaway']==before['settings']['cameraCutaway'] and player()==at and diag()['world']['dive']['y']==depth and state()['realmTrails']==before['realmTrails'] and state()['sandbox']['inventory']==before['sandbox']['inventory'] and gear(state())==gear(before))

def two_views(label,step):
 pause(True);page.locator('[data-rpg="camera"][data-id="adventure"]').click()
 page.wait_for_function('()=>Realm.diagnostics.camera.projection==="perspective"',polling=100)
 page.wait_for_timeout(350);before=state();at=player();depth=diag()['world']['dive'];capture(label+'-third',step)
 detail=('-recorded' in label or 'chart-corrected' in label) and report['detail_probe'] in ['all',step]
 if detail:capture(label+'-third-detail',step,True)
 page.keyboard.press('v');page.wait_for_function('()=>Realm.diagnostics.camera.projection==="orthographic"',polling=100);page.wait_for_timeout(350);capture(label+'-diorama',step)
 if detail:capture(label+'-diorama-detail',step,True)
 check(label+' actual V changes camera without player, depth or progress changes',player()==at and diag()['world']['dive']['y']==depth['y'] if depth else player()==at)
 check(label+' camera controls preserve economic/trail facts',state()['realmTrails']==before['realmTrails'] and state()['sandbox']['inventory']==before['sandbox']['inventory'] and gear(state())==gear(before))
def body_hits(a,b,p):
 lo=[p['min'][0]-.31,p['min'][1]-1.7,p['min'][2]-.31];hi=[p['max'][0]+.31,p['max'][1],p['max'][2]+.31];first,last=0,1
 for start,end,mn,mx in zip(a,b,lo,hi):
  delta=end-start
  if abs(delta)<1e-9:
   if start<mn or start>mx:return False
  else:
   x,y=(mn-start)/delta,(mx-start)/delta;first=max(first,min(x,y));last=min(last,max(x,y))
   if first>last:return False
 return True
def clear_routes(data,realm):
 defn=data['definition'];work=[p for p in data['parts'] if p['item'].get('appearanceOnly')];routes=[]
 for r in defn['routes']:routes.extend(([a[0],1.57,a[1]],[b[0],1.57,b[1]]) for a,b in zip(r['points'],r['points'][1:]))
 if defn.get('dive'):
  for r in defn['dive']['routes']:routes.extend((a,b) for a,b in zip(r['points'],r['points'][1:]))
 conflicts=[p['item']['trailPart'] for a,b in routes for p in work if body_hits(a,b,p)]
 check(realm+' actual submitted meshes clear complete authored dry/XYZ body routes',not conflicts,conflicts)
 anchors=QUESTS[realm]['steps']+[{**QUESTS[realm]['giver'],'y':1.57}]
 conflicts=[p['item']['trailPart'] for a in anchors for p in work if body_hits([a['x'],a['y'],a['z']],[a['x'],a['y'],a['z']],p)]
 check(realm+' actual submitted meshes clear unchanged step/giver body anchors',not conflicts,conflicts)

server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
started=time.monotonic();page=None
try:
 with sync_playwright() as pw,tempfile.TemporaryDirectory(prefix='firstlight-realm-work-native-',dir=OUT) as profile:
  context=pw.chromium.launch_persistent_context(profile,**chromium_launch_kwargs(),viewport={'width':1280,'height':800})
  try:
   page=context.new_page();page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
   response=page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='load');page.wait_for_function('()=>!!window.Realm',polling=100)
   check('served regenerated HTML matches the pinned artifact',hashlib.sha256(response.body()).hexdigest()==report['html_sha256'])
   check('normal native scheduling has no test or capture hooks',ev('()=>!Realm.test&&!window.__ETERNITIES_TEST_MODE&&!window.__ETERNITIES_CAPTURE_MODE'))
   check('actual WebGL2 uses software SwiftShader',diag()['mode']=='webgl2' and 'SwiftShader' in str(diag()['renderer']))
   page.keyboard.press('c');page.locator('#rpg-tabs [data-rpg="open"][data-id="characters"]').click();count=diag()['characters']['count']
   with page.expect_file_chooser() as chooser:page.locator('[data-rpg="chars-import"]').click()
   chooser.value.set_files(str(FIXTURE));page.wait_for_selector('[data-rpg="chars-confirm-import"]')
   check('native import previews a validated new slot without replacement','Nothing is replaced' in page.locator('#rpg-content').inner_text())
   page.locator('[data-rpg="chars-confirm-import"]').click();page.wait_for_function('n=>Realm.diagnostics.characters.count===n+1&&Realm.diagnostics.characters.writer',arg=count,polling=100)
   initial=state();check('Chapter I import retains kit, bond and deliberate unassigned class',initial['adventure']['started'] and initial['adventure']['companion']['bonded'] and initial['adventure']['classPath']['choice'] is None)
   close();page.locator('#settings').click();page.locator('#quality').select_option('low');page.locator('#setting-timeFlow').uncheck();page.locator('#close-panel').click()
   QUESTS=ev('()=>Object.fromEntries(RealmTrails.definitions().filter(d=>["earthlands","atlantis"].includes(d.realm)).map(d=>[d.realm,d]))')
   report['observations']['terms']=QUESTS
   if report['scope']=='both':ev(OBSERVER)
   roads();page.locator('[data-rpg="world-road"]').click()
   page.wait_for_function('()=>{const p=Realm.diagnostics.adventure.player;return Math.hypot(p.x-18,p.z-6)<.8}',polling=250,timeout=90000)
   if report['scope']=='both':
    enter('earthlands');pause(True);pre=snapshot('earthlands-unaccepted');clear_routes(pre,'earthlands')
    check('unaccepted props show raw work and no completed packing',len(role(pre,'fallen-bough-bole'))==1 and len(role(pre,'cut-reed-stem'))==6 and not role(pre,'packed-bough-piece') and all(p['item'].get('workState')=='unaccepted' for p in pre['parts'] if p['item'].get('appearanceOnly')))
    two_views('earthlands-unaccepted-pack','road-pack');walk_step('earthlands');pause(True);local();before=state();page.locator('[data-rpg="trail-accept"]').click();close()
    check('explicit Coastward acceptance grants no supplies or earlier survey',record('earthlands')['accepted'] and state()['sandbox']['inventory']==before['sandbox']['inventory'] and state()['journeys']==before['journeys'])
    for step in ['fallen-bough','shore-reeds','shore-stone','road-pack']:
     walk_step('earthlands',step);pause(True);raw=snapshot('earthlands-'+step+'-before');two_views('earthlands-'+step+'-before',step);act('earthlands',step);done=snapshot('earthlands-'+step+'-recorded');two_views('earthlands-'+step+'-recorded',step)
     check(step+' actual prop geometry changes only after recorded work',fingerprint(raw)!=fingerprint(done))
     if step=='fallen-bough':
      expected=fingerprint(done);home();reload_home();enter('earthlands');pause(True);reloaded=snapshot('earthlands-bough-partial-reload')
      check('native partial reload restores the actual prepared bough projection',fingerprint(reloaded)==expected and record('earthlands')['steps']==['fallen-bough'])
    complete=snapshot('earthlands-complete-unpaid');clear_routes(complete,'earthlands')
    check('packed but unpaid work has no material transfer',state()['sandbox']['inventory']==initial['sandbox']['inventory'] and len(role(complete,'packed-bough-piece'))==6 and not record('earthlands')['claimed'])
    close();page.locator('#settings').click();page.locator('#setting-reducedMotion').check();page.locator('#close-panel').click()
    page.wait_for_function('()=>Realm.state.settings.reducedMotion&&__realmWorkObservation.snapshot().reducedMotion',polling=100)
    check('actual reduced-motion setting preserves the same completed work meshes while paused',diag()['adventure']['paused'] and fingerprint(ev('()=>__realmWorkObservation.snapshot()'))==fingerprint(complete))
    page.locator('#settings').click();page.locator('#setting-reducedMotion').uncheck();page.locator('#close-panel').click()
    walk_step('earthlands');pause(True);local();before=state();page.locator('[data-rpg="trail-claim"]').click();close();paid=state()
    check('real claim releases exact finite materials and fee',record('earthlands')['claimed'] and all(paid['sandbox']['inventory'][k]-before['sandbox']['inventory'][k]==v for k,v in QUESTS['earthlands']['reward']['materials'].items()) and paid['adventure']['coins']-before['adventure']['coins']==10 and paid['adventure']['xp']==min(9999,before['adventure']['xp']+25))
    paid_work=snapshot('earthlands-paid');two_views('earthlands-paid-pack','road-pack');expected=fingerprint(paid_work);home();reload_home();enter('earthlands');pause(True)
    check('native paid reload restores completed work without another claim',fingerprint(snapshot('earthlands-paid-reload'))==expected and record('earthlands')['claimed'])
   if report['scope']=='both':home()
   ev(OBSERVER);enter('atlantis');pause(True);raw=snapshot('atlantis-unaccepted');clear_routes(raw,'atlantis')
   check('unaccepted Bellglass preserves both depth scales and has no fitted marker',len(role(raw,'depth-scale-notch'))==4 and not role(raw,'fitted-landing-plate') and not role(raw,'charted-depth-connection'))
   walk_step('atlantis');pause(True);local();page.locator('[data-rpg="trail-accept"]').click();close();check('Sahra accepts through the physical dry UI',record('atlantis')['accepted'])
   walk_map('tide-steps');close();page.keyboard.press('e');page.locator('[data-rpg="world-dive"]').click();page.wait_for_function('()=>!!Realm.diagnostics.world.dive',polling=100)
   for step in ['upper-gauge','lower-masonry']:
    s=next(s for s in QUESTS['atlantis']['steps'] if s['id']==step);swim([s['x'],s['y'],s['z']],step);pause(True);two_views('atlantis-'+step+'-before',step);act('atlantis',step);snapshot('atlantis-'+step+'-recorded')
    if step=='upper-gauge':native_export('UPPER_GAUGE')
    two_views('atlantis-'+step+'-recorded',step)
   swim([8,-2.7,-29.5],'doorway-approach');swim([8,-2.7,-32],'air-court-entry');swim([8,-2.7,-35],'depth-chart');pause(True)
   partial=snapshot('atlantis-chart-two-readings');check('true air-court medium and two recorded slips are visible without a corrected connection',diag()['world']['dive']['body']=='air' and len(role(partial,'upper-reading-slip'))==1 and len(role(partial,'lower-reading-slip'))==1 and not role(partial,'charted-depth-connection'))
   roof_control();two_views('atlantis-chart-before','depth-chart');local();before=state();page.locator('[data-rpg="trail-step"][data-id="depth-chart:one-flat-line"]').click();close()
   check('wrong visible chart choice changes neither ledger nor prop projection',state()==before and fingerprint(ev('()=>__realmWorkObservation.snapshot()'))==fingerprint(partial))
   local();before=state();ev('()=>{window.__workRefusalWrites=0;window.__workStorageOriginal=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key===RealmCharacters.KEY){__workRefusalWrites++;throw new DOMException("Labelled synthetic work save refusal","QuotaExceededError");}return __workStorageOriginal.call(this,key,value);};}')
   try:page.locator('[data-rpg="trail-step"][data-id="depth-chart:depth-layers"]').click()
   finally:ev('()=>{Storage.prototype.setItem=__workStorageOriginal;delete window.__workStorageOriginal;}')
   close();check('labelled native quota refusal leaves chart facts and submitted appearance unchanged',ev('()=>__workRefusalWrites>0') and state()==before and fingerprint(ev('()=>__realmWorkObservation.snapshot()'))==fingerprint(partial))
   act('atlantis','depth-chart','depth-layers');corrected=snapshot('atlantis-chart-corrected');two_views('atlantis-chart-corrected','depth-chart')
   check('committed correct chart reveals both layers, connection and doorway without a payout',len(role(corrected,'charted-depth-connection'))==1 and len(role(corrected,'charted-court-doorway'))==3 and state()['adventure']['coins']==before['adventure']['coins'] and state()['adventure']['ore']==before['adventure']['ore'])
   swim([8,-2.7,-32],'court-return');swim([8,-2.7,-29.5],'court-doorway-out');swim([8,-1.8,-29],'east-lane-depth');swim([12,-1.8,-29],'east-lane');swim([12,-1.4,-38.4],'modern-marker');pause(True)
   two_views('atlantis-marker-before','modern-marker');act('atlantis','modern-marker');complete=snapshot('atlantis-complete-unpaid');clear_routes(complete,'atlantis');two_views('atlantis-marker-recorded','modern-marker')
   check('actual final marker is fitted while older lower-road plate remains',len(role(complete,'fitted-landing-plate'))==2 and len(role(complete,'modern-route-arrow'))==6 and len(role(complete,'old-masonry-plate'))==1 and not record('atlantis')['claimed'])
   swim([12,-1.4,-39.3],'far-gallery-landing');close();page.keyboard.press('e');page.wait_for_function('()=>!Realm.diagnostics.world.dive',polling=100)
   check('real E exits to supported dry quay',ev('()=>{const d=Realm.diagnostics,p=d.adventure.player;return RealmWorldFoundations.walkable(d.scene,p.x,p.z)}'))
   walk_step('atlantis');pause(True);local();before=state();page.locator('[data-rpg="trail-claim"]').click();close();after=state()
   check('actual Sahra claim pays exact finite reward once',record('atlantis')['claimed'] and after['adventure']['coins']-before['adventure']['coins']==12 and after['adventure']['ore']-before['adventure']['ore']==2 and after['adventure']['xp']==min(9999,before['adventure']['xp']+30))
   expected=fingerprint(snapshot('atlantis-paid'));home();reload_home();enter('atlantis');pause(True);reloaded=snapshot('atlantis-paid-reload')
   check('native paid reload restores chart, copied gauges and fitted marker exactly',fingerprint(reloaded)==expected and record('atlantis')['claimed']);clear_routes(reloaded,'atlantis')
   check('work preserves original gear, bond, class and separate survey history',gear(state())==gear(initial) and state()['journeys']==initial['journeys'])
   check('actual application and WebGL have no uncaught errors',not report['browser_errors'] and not diag()['errors'])
   report['observations']['final_diagnostics']=diag();report['earned_final_world']=state()
  except Exception:
   try:report['earned_failure_world']=state();native_export('FAILURE')
   except Exception as export_error:report['native_export_error']=str(export_error)
   try:page.screenshot(path=str(OUT/'FAILURE.png'));report['failure_diagnostics']=diag();report['failure_ui']={'toast':page.locator('#toast').inner_text(),'dialog':page.locator('#rpg-content').inner_text()}
   except Exception:pass
   raise
  finally:context.close()
 report['status']='passed'
except Exception as error:
 report['status']='failed';report['errors'].append(str(error));report['traceback']=traceback.format_exc();print(report['traceback'],flush=True)
finally:
 server.shutdown();server.server_close();report['wall_seconds']=time.monotonic()-started
 report['outputs']={p.name:{'sha256':sha(p),'bytes':p.stat().st_size} for p in OUT.iterdir() if p.suffix=='.png' or p.name=='HARNESS.py' or p.name.startswith('NATIVE_EARNED_')}
 (OUT/'REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8',newline='\n')
if report['status']!='passed':raise SystemExit(1)
