"""Real blade/bow practice inputs and narrow main-view appearance proof.

Fresh disposable native profiles import current command-earned starter rewards.
The existing Node journey helper generates those sources using accelerated rule
simulation, labelled separately from this ordinary-RAF browser play. Browser
Import/Confirm, E, Tab, F, P, V, Settings, pointer orbit/zoom and native reload are
real controls. Supported legs use accepted production moveTo, never coordinate,
HP/damage/gear/XP assignment. Synchronous dynamic-flag probes restore before RAF
continues. Blue-subject controls are synthetic, not player gameplay photographs.
Every reflection is rendered fresh; actual practice visibility is measured and
separated from synthetic geometry-present positive controls. No hardware/feel claim.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import argparse, base64, hashlib, json, math, os, subprocess, tempfile, threading, time, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs
ROOT=Path(os.environ.get('FIRSTLIGHT_TEST_ROOT',Path(__file__).resolve().parents[1])).resolve()
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--output',type=Path,default=ROOT/'evidence10/practice-visibility-browser')
p.add_argument('--sources',type=Path,default=ROOT/'evidence10/starter')
args=p.parse_args();OUT=args.output.resolve();SOURCES=args.sources.resolve()
if os.name=='nt' and (OUT.drive.upper()!='D:' or SOURCES.drive.upper()!='D:'):raise SystemExit('Windows heavy evidence stays on D:')
OUT.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
files=['src/starter-art.js','src/starter.js','src/starter-ui.js','src/engine.js','src/world.js','src/adventure.js','src/adventure-ui.js','src/combat.js','src/arsenal.js','src/rpg-ui.js','src/app.js']
report={'method':__doc__,'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
 'html_sha256':sha(ROOT/'index.html'),'html_bytes':(ROOT/'index.html').stat().st_size,'harness_sha256':sha(Path(__file__)),
 'sources':{f:sha(ROOT/f) for f in files},'checks':[],'browser_errors':[],'external_requests':[],'errors':[],'variants':{}}
for env,key in [('FIRSTLIGHT_EXPECT_HEAD','head'),('FIRSTLIGHT_EXPECT_HTML_SHA','html_sha256')]:
 if os.environ.get(env) and os.environ[env]!=report[key]:raise SystemExit('Requested source mismatch: '+key)
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*a):pass
def check(name,passed,data=None):
 report['checks'].append({'name':name,'passed':bool(passed),'data':data});print(('PASS ' if passed else 'FAIL ')+name,flush=True)
 if not passed:raise AssertionError(name)
def ev(js,arg=None):return page.evaluate(js,arg)
def state():return ev('()=>Realm.state')
def diag():return ev('()=>Realm.diagnostics')
def close():
 if page.locator('#rpg-window').evaluate('(e)=>e.open'):page.locator('#rpg-close').click()
 if page.locator('#drawer').evaluate('(e)=>e.classList.contains("open")'):page.locator('#close-panel').click()
def pause(value):
 close()
 if diag()['adventure']['paused']!=value:page.keyboard.press('p')
 page.wait_for_function('v=>Realm.diagnostics.adventure.paused===v',arg=value)
def settings(**values):
 close();page.locator('#settings').click()
 for key,value in values.items():
  if key=='quality':page.locator('#quality').select_option(value)
  else:page.locator('#setting-'+key).set_checked(value)
 page.locator('#close-panel').click()
def projection(s):
 a=s['adventure']
 return{'inventory':s['sandbox']['inventory'],'adventure':{k:v for k,v in a.items() if k not in ['elapsed','revision','hp','stamina','receipts']},
        'journeys':s['journeys'],'realmTrails':s['realmTrails']}
def images(label,data):
 for key in list(data):
  if key.endswith('PNG'):(OUT/(label+'-'+key[:-3]+'.png')).write_bytes(base64.b64decode(data.pop(key).split(',')[1]))
def walk(x,z):
 pause(False);r=ev('p=>__postProbe.walk(...p)',[x,z]);check('accepted production route '+str([x,z]),r.get('ok'),r)
 page.wait_for_function('p=>{const q=Realm.diagnostics.adventure.player;return Math.hypot(q.x-p[0],q.z-p[1])<.12}',arg=[x,z],polling=100,timeout=90000)
 pause(True)
def frame(mode):
 close();page.locator('[data-rpg="camera"][data-id="'+('adventure' if mode=='third' else 'follow')+'"]').click()
 d=diag()['camera'];dx=-(2.8-d['yaw'])/.007;dy=((.28 if mode=='third' else .48)-d['elevation'])/.004
 page.mouse.move(650,470);page.mouse.down(button='right');page.mouse.move(650+dx,470+dy,steps=8);page.mouse.up(button='right')
 d=diag()['camera'];current=d['distance'] if mode=='third' else d['half'];desired=6 if mode=='third' else 8
 page.mouse.move(650,470);page.mouse.wheel(0,math.log(desired/current)*1000);page.wait_for_timeout(1000)
 check('native orbit/zoom selects '+mode+' presentation',diag()['camera']['projection']==('perspective' if mode=='third' else 'orthographic') and abs(diag()['camera']['yaw']-2.8)<1e-6,diag()['camera'])
def impact(label,style):
 before=ev('()=>__postProbe.runtime()');before_state=state();pause(False)
 if diag()['adventure']['tactics']['target']!='river-practice':page.keyboard.press('Tab')
 check(label+' Tab selects actual practice actor',diag()['adventure']['tactics']['target']=='river-practice')
 # Paused picture-taking does not advance the real weapon cooldown. Resume
 # ordinary RAF and await its actual ready epoch before the next manual input.
 page.wait_for_function('()=>__postProbe.runtime().attackReady',polling=20,timeout=10000)
 page.keyboard.press('f')
 page.wait_for_function('n=>__postProbe.runtime().impacts.length>n',arg=len(before['impacts']),polling=20,timeout=10000)
 pause(True);after=ev('()=>__postProbe.runtime()');row=after['impacts'][-1]
 check(label+' real F produces exact confirmed '+style+' damage',row['style']==style and row['n']==after['stats']['attack'] and row['actorId']=='river-practice',row)
 check(label+' practice actor/player health and rewards remain unchanged',row['hpBefore']==row['hpAfter']==100 and state()['adventure']['hp']==before_state['adventure']['hp'] and projection(state())==projection(before_state))
 attacks=[c for c in after['commands'][len(before['commands']):] if c['type']=='attack']
 check(label+' production attack command is accepted',len(attacks)==1 and attacks[0]['result']['ok'],attacks)
 if style=='bow':check(label+' accepted bow creates a real travelling projectile',attacks[0]['arrows']>0,attacks)
 page.wait_for_function('n=>[...document.querySelectorAll("#combat-numbers span")].some(e=>e.textContent===String(n))',arg=row['n'])
 check(label+' actual target HUD and confirmed-hit number remain visible',page.locator('#target-frame').is_visible() and page.locator('#target-state').inner_text()==('Last confirmed impact: '+str(row['n'])+' · no XP or loot') and str(row['n']) in page.locator('#combat-numbers span').all_text_contents() and page.locator('#target-health-fill').evaluate('(e)=>e.style.width')=='100%',page.locator('#target-frame').inner_text())
 page.screenshot(path=str(OUT/(label+'-accepted-impact.png')))
 return{'before':before,'after':after,'target_ui':page.locator('#target-frame').inner_text(),'damage_ui':page.locator('#combat-numbers').inner_text()}
def capture(label,gain=False):
 actual=ev('()=>__postProbe.capture()');images(label,actual)
 check(label+' actual dynamic flags affect main only with fresh reflections',actual['reflectedPasses']==7 and actual['noWater'] is False and actual['quality']=='balanced' and actual['reflectionDifference']['channels']==0,actual)
 check(label+' actual target contributes main pixels without authority mutation',actual['practiceAbsentMain']['pixels']>20 and actual['stateCameraCollisionUnchanged'] and actual['restoration']['channels']==0 and actual['disabledDifference']['channels']==0 and actual['glError']==0)
 synthetic=ev('()=>__postProbe.synthetic()');images(label,synthetic)
 diagnostic=synthetic['diagnosticReflection']
 expected=(6 if actual['reducedMotion'] else 5)+(3 if diagnostic else 0)
 check(label+' source practice geometry has a fresh reflection positive control',synthetic['reflectedPasses']==expected and (synthetic['reflectionPositiveControl']['channels']>100 or diagnostic and diagnostic['positiveControl']['channels']>100 and diagnostic['onOff']['channels']==0),{'normal':synthetic['reflectionPositiveControl'],'diagnostic':diagnostic})
 check(label+' controlled reveal preserves reflection and disabled preference',synthetic['reflectionDifference']['channels']==0 and synthetic['disabledDifference']['channels']==0 and synthetic['restoration']['channels']==0 and synthetic['actualStateUnchanged'] and synthetic['glError']==0)
 if gain:check(label+' actual-camera blue subject is positively revealed',synthetic['afterBlue']>synthetic['beforeBlue']+20,[synthetic['beforeBlue'],synthetic['afterBlue']])
 if actual['reducedMotion']:check(label+' reduced-motion main/reflection pixels freeze',synthetic['reducedMotionFreeze']['main']['channels']==0 and synthetic['reducedMotionFreeze']['reflection']['channels']==0)
 actual['reflection_control_interpretation']='Actual camera target reflection visible' if actual['practiceAbsentReflection']['channels']>0 else 'Actual practice absent reflection equals present: inland opaque ground/view hides it; actual fresh passes counted, sourced-geometry positive reflection covered separately.'
 page.screenshot(path=str(OUT/(label+'-native-ui.png')))
 return{'actual':actual,'synthetic':synthetic,'diagnostics':diag()}

OBSERVER = r"""()=>{
 const clone=v=>JSON.parse(JSON.stringify(v)), E=RealmEngine;
 const proto=RealmArt.WorldArt.prototype,commit=proto.commit;
 const sp=RealmCore.Simulation.prototype,move=sp.moveTo,command=sp.adventureCommand,hit=RealmStarter.practiceHit;let owner=null,sim=null,probe=null,initialRender=null;const commands=[],impacts=[];
 sp.adventureCommand=function(id,type,p){const r=command.call(this,id,type,p);commands.push({type,p,result:clone(r),at:this.state.adventure.elapsed,arrows:RealmArsenal.runtime(this).arrows.length});return r;};
 RealmStarter.practiceHit=function(s,e,n){const before=e.hp,r=hit(s,e,n);impacts.push({n,style:RealmArsenal.weapon(s.state.adventure).style,hpBefore:before,hpAfter:e.hp,playerHP:s.state.adventure.hp,at:s.state.adventure.elapsed,actorId:e.id});return r;};
 sp.moveTo=function(...args){sim=this;sp.moveTo=move;return move.apply(this,args);};
 proto.commit=function(...args){const r=commit.apply(this,args);if(this.room==='riverbank'){owner=this;initialRender=this.e.render;proto.commit=commit;}return r;};
 const tagged=i=>!!(i.practicePart);
 const parts=()=>owner.e.dynamic.flatMap(b=>b.items.filter(tagged).map(i=>({kind:b.kind,item:i})));
 const signature=()=>JSON.stringify({state:Realm.state,player:Realm.diagnostics.adventure.player,camera:owner.e.camera,
  vp:Array.from(owner.e.vp),solids:owner.e.cameraSolids,definition:RealmStarter.PRACTICE});
 const read=(e,f)=>{const g=e.gl,a=new Uint8Array(f.w*f.h*4);g.bindFramebuffer(g.FRAMEBUFFER,f.f);
  g.readPixels(0,0,f.w,f.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;};
 const difference=(a,b)=>{let channels=0,pixels=0,sum=0;for(let i=0;i<a.length;i+=4){let d=0;for(let k=0;k<3;k++){const v=Math.abs(a[i+k]-b[i+k]);channels+=v!==0;d+=v;}sum+=d;pixels+=d>6;}return{channels,pixels,sum};};
 const png=(a,w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d'),im=ctx.createImageData(w,h);
  for(let y=0;y<h;y++)im.data.set(a.subarray((h-1-y)*w*4,(h-y)*w*4),y*w*4);ctx.putImageData(im,0,0);return c.toDataURL('image/png');};
 const blue=a=>{let n=0;for(let i=0;i<a.length;i+=4)if(a[i+2]>120&&a[i+2]>2*a[i]&&a[i+2]>2*a[i+1])n++;return n;};
 window.__postProbe={
  walk(x,z){if(!sim)throw Error('No native movement owner observed');return sim.moveTo(x,z);},
  runtime(){return{commands:clone(commands),impacts:clone(impacts),attackReady:sim.state.adventure.elapsed>=RealmAdventure.runtime(sim).cooldowns.attack,training:clone(RealmAdventure.runtime(sim).training||null),actor:clone(RealmAdventure.runtime(sim).enemies.find(e=>e.id===RealmStarter.PRACTICE.id)),stats:clone(RealmAdventure.stats(sim.state.adventure)),weapon:clone(RealmArsenal.weapon(sim.state.adventure)),player:clone(sim.state.player),tactics:clone(RealmCombat.runtime(sim))};},
  restoreHooks(){sp.adventureCommand=command;RealmStarter.practiceHit=hit;return sp.moveTo===move&&proto.commit===commit&&owner.e.render===initialRender;},
  snapshot(){const e=owner.e;return{parts:parts().map(({kind,item})=>{const b=e.dynamic.find(b=>b.kind===kind&&b.items.includes(item)),n=b.items.indexOf(item),m=Array.from(b.data.slice(n*24,n*24+16)),g=E.geometry(kind),stride=6,min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
   for(let k=0;k<g.length;k+=stride){const v=E.M.transform(m,g.slice(k,k+3));for(let j=0;j<3;j++){min[j]=Math.min(min[j],v[j]);max[j]=Math.max(max[j],v[j]);}}return{kind,item:clone(item),matrix:m,min,max,finite:[...m,...min,...max].every(Number.isFinite),cameraBounds:E.solidBounds(kind,item)};}),
   definition:clone(RealmStarter.PRACTICE),cameraSolids:clone(e.cameraSolids),camera:clone(e.camera),cutawayFocus:clone(e.cutawayFocus),prototypesRestored:proto.commit===commit&&sp.moveTo===move,
   renderWriterRestored:e.render===initialRender&&!Object.hasOwn(e,'geometryPass')};},
  capture(){const e=owner.e,writer=e.render,pass=e.geometryPass,hadOwn=Object.hasOwn(e,'render'),hadPass=Object.hasOwn(e,'geometryPass');
   return new Promise((resolve,reject)=>{e.render=function(...args){if(hadOwn)e.render=writer;else delete e.render;
    const saved=e.dynamic.map(b=>({b,items:b.items,data:b.data,flags:b.items.map(i=>i.cutaway)}));
    const before=signature(),cutaway=e.cutaway,lastShadow=e.lastShadow;let reflected=0,result;
    e.geometryPass=function(...a){if(a[5]===true)reflected++;return pass.apply(this,a);};
    const render=()=>{e.lastShadow=-1;result=writer.apply(e,args);return{main:read(e,e.mainF),ref:read(e,e.refF),metrics:clone(e.metrics)};};
    const flags=v=>{for(const {b} of saved){let hit=false;for(const i of b.items)if(tagged(i)){i.cutaway=v;hit=true;}if(hit)e.updateBatch(b);}};
    try{
     const on=render();flags(false);const off=render();flags(true);const restored=render();
     e.cutaway=false;const disabledOn=render();flags(false);const disabledOff=render();flags(true);e.cutaway=cutaway;
     for(const {b} of saved){b.items=b.items.filter(i=>!tagged(i));e.updateBatch(b);}const absent=render();
     for(const {b,items} of saved){b.items=items;e.updateBatch(b);}render();
     resolve({camera:clone(e.camera),focus:clone(e.cutawayFocus),args,reflectedPasses:reflected,noWater:e.noWater,quality:e.quality,reducedMotion:e.reducedMotion,
      practiceAbsentMain:difference(on.main,absent.main),practiceAbsentReflection:difference(on.ref,absent.ref),mainDifference:difference(on.main,off.main),reflectionDifference:difference(on.ref,off.ref),restoration:difference(on.main,restored.main),
      disabledDifference:difference(disabledOn.main,disabledOff.main),stateCameraCollisionUnchanged:before===signature(),glError:e.gl.getError(),
      metrics:on.metrics,width:e.mainF.w,height:e.mainF.h,
      actualOnPNG:png(on.main,e.mainF.w,e.mainF.h),actualOffPNG:png(off.main,e.mainF.w,e.mainF.h),reflectionPNG:png(on.ref,e.refF.w,e.refF.h),absentReflectionPNG:png(absent.ref,e.refF.w,e.refF.h)});
    }catch(error){reject(String(error));}finally{
     for(const {b,items,data,flags} of saved){b.items=items;items.forEach((i,n)=>i.cutaway=flags[n]);e.updateBatch(b);b.data=data;}
     e.cutaway=cutaway;e.lastShadow=lastShadow;if(hadPass)e.geometryPass=pass;else delete e.geometryPass;
     if(hadOwn)e.render=writer;else delete e.render;
    }return result;
   };});
  },
  synthetic(){const actual=owner.e,before=signature();
   if(!probe){probe=new E.Engine(document.createElement('canvas'));probe.resize(800,500,1);probe.quality='balanced';probe.waterStill=true;}
   const e=probe;e.clear();e.setCamera({...clone(actual.camera),aspect:800/500});e.cutawayFocus=clone(actual.cutawayFocus);
   e.noWater=false;e.cutaway=true;e.reducedMotion=actual.reducedMotion;e.theme=actual.theme;e.worldAtmosphere=clone(actual.worldAtmosphere||null);
   const p=Realm.diagnostics.adventure.player,subject={p:[p.x,1.57+.85,p.z],s:[.42,1.7,.42],c:[.01,.05,1],em:.8,cameraSolid:false,cutaway:false};
   e.batch('box',[subject]);const geometry=parts().map(({kind,item})=>({kind,item:{...item,m:item.m?Array.from(item.m):undefined}}));
   const grouped=new Map();for(const {kind,item} of geometry){if(!grouped.has(kind))grouped.set(kind,[]);grouped.get(kind).push(item);}
   for(const [kind,items] of grouped)e.batch(kind,items);
   const pass=e.geometryPass;let reflected=0;e.geometryPass=function(...a){if(a[5]===true)reflected++;return pass.apply(this,a);};
   const render=(time=1)=>{e.lastShadow=-1;e.render(time,16,false);return{main:read(e,e.mainF),ref:read(e,e.refF)};};
   const flags=v=>{for(const b of e.batches){for(const i of b.items)if(tagged(i))i.cutaway=v;e.updateBatch(b);}};
   try{
    flags(false);const off=render();flags(true);const on=render();e.cutaway=false;const disabled=render();e.cutaway=true;
    const all=e.batches;e.batches=all.filter(b=>b.items.includes(subject));const absent=render();e.batches=all;const restored=render();
    const quiet=e.reducedMotion?render(9):null;
    const actualProbeCamera=clone(e.camera),reflectionBounds=[];
    for(const {kind,item} of geometry){const mesh=E.geometry(kind),m=item.m||E.M.compose(...item.p,...item.s,...(item.r||[0,0,0])),lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
     for(let k=0;k<mesh.length;k+=6){const w=E.M.transform(m,mesh.slice(k,k+3)),v=[0,1,2,3].map(row=>e.reflectionMatrix[row]*w[0]+e.reflectionMatrix[4+row]*w[1]+e.reflectionMatrix[8+row]*w[2]+e.reflectionMatrix[12+row]);
      for(let j=0;j<3;j++){const n=v[j]/v[3];lo[j]=Math.min(lo[j],n);hi[j]=Math.max(hi[j],n);}}
     reflectionBounds.push({kind,min:lo,max:hi});}
    let diagnostic=null,diagnosticPNGs={};
    if(difference(off.ref,absent.ref).channels<=100){
     // This camera is a labelled reflection-only control; actual traveler and
     // normal-camera on/off screenshots above are never reframed to hide overlap.
     e.setCamera({...actualProbeCamera,target:[p.x,0,p.z]});flags(false);const dOff=render();flags(true);const dOn=render();
     e.batches=all.filter(b=>b.items.includes(subject));const dAbsent=render();e.batches=all;
     diagnostic={label:'Reflection-only downward diagnostic camera; unchanged submitted geometry, not native gameplay framing.',camera:clone(e.camera),positiveControl:difference(dOff.ref,dAbsent.ref),onOff:difference(dOff.ref,dOn.ref)};
     diagnosticPNGs={diagnosticReflectionOnPNG:png(dOn.ref,e.refF.w,e.refF.h),diagnosticReflectionAbsentPNG:png(dAbsent.ref,e.refF.w,e.refF.h)};
     e.setCamera(actualProbeCamera);
    }
    return{label:'Synthetic blue subject; exact submitted practice meshes and actual current camera, no gameplay claim.',camera:clone(e.camera),focus:clone(e.cutawayFocus),
     beforeBlue:blue(off.main),afterBlue:blue(on.main),absentBlue:blue(absent.main),mainDifference:difference(off.main,on.main),
     reflectedPasses:reflected,reflectionDifference:difference(off.ref,on.ref),reflectionPositiveControl:difference(off.ref,absent.ref),diagnosticReflection:diagnostic,normalReflectionMeshNDCBounds:reflectionBounds,
     reducedMotionFreeze:quiet?{main:difference(on.main,quiet.main),reflection:difference(on.ref,quiet.ref)}:null,
     disabledDifference:difference(off.main,disabled.main),restoration:difference(on.main,restored.main),actualStateUnchanged:before===signature(),glError:e.gl.getError(),
     syntheticOnPNG:png(on.main,e.mainF.w,e.mainF.h),syntheticOffPNG:png(off.main,e.mainF.w,e.mainF.h),
     syntheticReflectionPNG:png(on.ref,e.refF.w,e.refF.h),syntheticAbsentReflectionPNG:png(absent.ref,e.refF.w,e.refF.h),...diagnosticPNGs};
   }finally{delete e.geometryPass;e.clear();}
  }
 };
}"""

server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
started=time.monotonic();page=None
try:
 html=(ROOT/'index.html').read_text(encoding='utf-8')
 check('exact current production sources are embedded',all((ROOT/f).read_text(encoding='utf-8').strip() in html for f in files))
 if SOURCES==ROOT/'evidence10/starter':
  report['source_generation']=[]
  for extra in [[],['--bow']]:
   r=subprocess.run(['node','tests/starter_journey.cjs',*extra],cwd=ROOT,text=True,capture_output=True)
   report['source_generation'].append({'command':['node','tests/starter_journey.cjs',*extra],'exit':r.returncode,'stdout':r.stdout,'stderr':r.stderr,'label':'Existing command-earned journey helper; accelerated fixture synthesis, separate from native browser play.'})
   check('command-earned fixture generation '+str(extra),r.returncode==0,r.stdout)
 report['journey_helper_sha256']=sha(ROOT/'tests/starter_journey.cjs')
 with sync_playwright() as pw:
  for style in ['blade','bow']:
   source=SOURCES/('fresh-'+style)/'06_REWARD_EQUIPPED_EARNED.json'
   receipt=SOURCES/('fresh-'+style)/'STARTER_JOURNEY_REPORT.json'
   data={'source':str(source),'source_sha256':sha(source),'receipt_sha256':sha(receipt),'source_label':'Command-earned starter reward equipped at home; accelerated source generation. Browser below never accelerates simulation.','captures':{}}
   report['variants'][style]=data
   with tempfile.TemporaryDirectory(prefix='firstlight-practice-'+style+'-') as profile:
    context=pw.chromium.launch_persistent_context(profile,**chromium_launch_kwargs(),viewport={'width':1280,'height':900})
    try:
     page=context.new_page();page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
     def route(r):
      if r.request.url.startswith(f'http://127.0.0.1:{server.server_port}/'):r.continue_()
      else:report['external_requests'].append(r.request.url);r.abort()
     page.route('**/*',route)
     response=page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='load');page.wait_for_function('()=>!!window.Realm')
     check(style+' served exact native software build',hashlib.sha256(response.body()).hexdigest()==report['html_sha256'] and 'SwiftShader' in json.dumps(diag()['renderer']) and ev('()=>!Realm.test&&!window.__ETERNITIES_CAPTURE_MODE&&!window.__ETERNITIES_TEST_MODE'))
     page.keyboard.press('c');page.locator('#rpg-tabs [data-rpg="open"][data-id="characters"]').click();n=diag()['characters']['count']
     with page.expect_file_chooser() as chooser:page.locator('[data-rpg="chars-import"]').click()
     chooser.value.set_files(str(source));page.wait_for_selector('[data-rpg="chars-confirm-import"]');page.locator('[data-rpg="chars-confirm-import"]').click()
     page.wait_for_function('n=>Realm.diagnostics.characters.count===n+1',arg=n)
     check(style+' native imported reward is owned/equipped',state()['adventure']['equipment']['weapon']=='oren_'+('sunblade' if style=='blade' else 'reedbow') and state()['adventure']['starter']['reward']['weapon']==state()['adventure']['equipment']['weapon'])
     baseline=projection(state());baseline_receipts=state()['adventure']['receipts'];data['baseline']=baseline;original_settings=state()['settings']
     settings(quality='low',timeFlow=False,cameraCutaway=True,reducedMotion=False);ev(OBSERVER)
     close();page.keyboard.press('e');page.locator('[data-rpg="starter-practice"]').click()
     page.wait_for_function('()=>{const p=Realm.diagnostics.adventure.player;return Math.hypot(p.x-15,p.z-7)<.12}',polling=100,timeout=90000)
     page.keyboard.press('e');page.wait_for_function('()=>Realm.diagnostics.scene==="riverbank"')
     walk(-5,11.5);settings(quality='balanced');pause(True)
     submission=ev('()=>__postProbe.snapshot()');data['submission']=submission
     check(style+' actual dynamic submission has exactly four supported non-solid practice pieces',len(submission['parts'])==4 and all(p['finite'] and p['item']['cameraSolid'] is False and p['item']['cutaway'] is True and p['cameraBounds'] is None for p in submission['parts']))
     expected=[('box',[-5,2.12,10],[.18,1.3,.20],0x796346),('round',[-5,2.75,10],[1.1,1.1,.55],0xb4a779),('box',[-5,2.75,10.28],[.17,.95,.04],0x75988b),('box',[-5,2.75,10.29],[.9,.17,.04],0x75988b)]
     check(style+' actual geometry/colors and physical actor radius remain unchanged',all(any(p['kind']==k and p['item']['p']==pos and p['item']['s']==size and p['item']['c']==color for p in submission['parts']) for k,pos,size,color in expected) and submission['definition']=={'id':'river-practice','name':'Oren’s practice bundle','kind':'practice','x':-5,'z':10,'hp':100,'radius':.65})
     for mode in ['third','diorama']:
      frame(mode);label=style+'-'+mode;data['captures'][label]={'impact':impact(label,style),'render':capture(label,mode=='third')}
     settings(reducedMotion=True)
     for mode in ['third','diorama']:
      frame(mode);data['captures'][style+'-reduced-motion-'+mode]={'render':capture(style+'-reduced-motion-'+mode,mode=='third')}
     frame('third')
     settings(cameraCutaway=False);disabled=ev('()=>__postProbe.capture()');images(style+'-native-disabled',disabled)
     check(style+' native disabled preference keeps the original opaque target',disabled['mainDifference']['channels']==0 and disabled['reflectionDifference']['channels']==0 and disabled['stateCameraCollisionUnchanged'])
     restored=ev('()=>__postProbe.snapshot()');check(style+' all dynamic part flags/matrices and render writer restore exactly',restored['parts']==submission['parts'] and restored['cameraSolids']==submission['cameraSolids'] and restored['definition']==submission['definition'] and restored['renderWriterRestored'])
     check(style+' repeated actual impacts award no XP/coins/ore/loot/defeat or progression',projection(state())==baseline and ev('()=>__postProbe.runtime().actor.hp===100'))
     data['runtime_before_reload']=ev('()=>__postProbe.runtime()');check(style+' all delegated input/hit/movement observer hooks restore',ev('()=>__postProbe.restoreHooks()'))
     page.locator('#target-clear').click()
     # Native M/map return avoids retaining any observer command after restoration.
     pause(False);page.keyboard.press('m');page.locator('[data-rpg="starter-walk"][data-id="river-exit"]').first.click()
     page.wait_for_function('()=>{const p=Realm.diagnostics.adventure.player;return Math.hypot(p.x,p.z-12)<.12}',polling=100,timeout=90000)
     page.keyboard.press('e');page.wait_for_function('()=>Realm.diagnostics.scene==="valley"')
     check(style+' actual southern path returns with unchanged rewards/history',projection(state())==baseline)
     settings(quality=original_settings['quality'],timeFlow=original_settings['timeFlow'],cameraCutaway=original_settings['cameraCutaway'],reducedMotion=original_settings['reducedMotion'])
     # Existing Export control performs the ordinary save before a cold page reload.
     page.keyboard.press('c');page.locator('#rpg-tabs [data-rpg="open"][data-id="characters"]').click()
     with page.expect_download() as download:page.locator('.chars-card.is-current [data-rpg="chars-export"]').click()
     download.value.save_as(str(OUT/(style+'-native-character-export.json')));close();saved_receipts=state()['adventure']['receipts'];page.reload(wait_until='load');page.wait_for_function('()=>!!window.Realm')
     check(style+' cold native reload retains exact paid weapon/history without practice payout',projection(state())==baseline and diag()['scene']=='valley')
     check(style+' old command receipts survive and accepted input receipts reload exactly',state()['adventure']['receipts']==saved_receipts and saved_receipts[:len(baseline_receipts)]==baseline_receipts and len(saved_receipts)>len(baseline_receipts))
     check(style+' no errors or external requests',not report['browser_errors'] and not report['external_requests'] and not diag()['errors'])
     data['final_diagnostics']=diag()
    except Exception:
     try:page.screenshot(path=str(OUT/(style+'-FAILURE.png')));data['failure_diagnostics']=diag();data['failure_ui']=page.locator('#rpg-content').inner_text()
     except Exception:pass
     raise
    finally:context.close()
 report['status']='passed'
except Exception as error:
 report['status']='failed';report['errors'].append(str(error));report['traceback']=traceback.format_exc();print(report['traceback'],flush=True)
finally:
 server.shutdown();server.server_close();report['wall_seconds']=time.monotonic()-started
 report['outputs']={p.name:{'sha256':sha(p),'bytes':p.stat().st_size} for p in OUT.glob('*.png')}
 (OUT/'REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8',newline='\n')
if report['status']!='passed':raise SystemExit(1)
