"""Actual Coastward post/lamp main-view qualification in software WebGL.

An isolated native profile imports the command-earned Chapter I checkpoint,
uses visible Roads/map/bridge-view controls and ordinary RAF. Edge/bank legs
call the same accepted Simulation.moveTo that the UI uses; no coordinates,
ticks, HP, gear or rewards are assigned. A synchronous appearance-only probe
changes only the 34 opted-in decorative cutaway flags, restores before play
continues, and captures the actual traveler. A separate blue-box fixture uses
unchanged submitted post/lamp meshes and the actual camera; it is a controlled
occlusion test, not a traveler or gameplay photograph. Every reflection is
freshly rendered with water enabled, including geometry-absent controls.
This is software integration/pixel evidence, not hardware performance or feel.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import argparse, base64, hashlib, json, os, subprocess, tempfile, threading, time, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

ROOT = Path(os.environ.get('FIRSTLIGHT_TEST_ROOT', Path(__file__).resolve().parents[1])).resolve()
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, default=ROOT/'evidence10/coastward-bridge-posts-browser')
OUT = parser.parse_args().output.resolve()
if os.name == 'nt' and OUT.drive.upper() != 'D:':
    raise SystemExit('Windows evidence must remain on D:')
OUT.mkdir(parents=True, exist_ok=True)
FIXTURE = ROOT/'examples/CHAPTER_COMPLETED_EARNED.json'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
sources = ['src/engine.js', 'src/world.js', 'src/world-atlantis-earth.js',
           'src/world-foundations-art.js', 'src/world-foundations.js',
           'src/world-foundations-ui.js', 'src/bridge-moment-view.js', 'src/app.js']
report = {'method': __doc__, 'head': subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
          'html_sha256':sha(ROOT/'index.html'), 'html_bytes':(ROOT/'index.html').stat().st_size,
          'harness_sha256':sha(Path(__file__)), 'sources':{s:sha(ROOT/s) for s in sources},
          'fixture':{'path':str(FIXTURE.relative_to(ROOT)), 'sha256':sha(FIXTURE),
                     'label':'Command-earned Chapter I completed checkpoint; native import adds a new slot.'},
          'checks':[], 'errors':[], 'browser_errors':[], 'external_requests':[], 'routes':[], 'observations':{}}
for env,key in [('FIRSTLIGHT_EXPECT_HEAD','head'),('FIRSTLIGHT_EXPECT_HTML_SHA','html_sha256')]:
    if os.environ.get(env) and os.environ[env] != report[key]:
        raise SystemExit('Requested epoch mismatch: '+key)

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw): super().__init__(*a,directory=str(ROOT),**kw)
    def log_message(self,*a): pass

def check(name, passed, data=None):
    report['checks'].append({'name':name,'passed':bool(passed),'data':data})
    print(('PASS ' if passed else 'FAIL ')+name,flush=True)
    if not passed: raise AssertionError(name)

def ev(js,arg=None): return page.evaluate(js,arg)
def diag(): return ev('()=>Realm.diagnostics')
def state(): return ev('()=>Realm.state')
def close():
    if page.locator('#rpg-window').evaluate('(e)=>e.open'): page.locator('#rpg-close').click()
    if page.locator('#drawer').evaluate('(e)=>e.classList.contains("open")'): page.locator('#close-panel').click()
def roads():
    close();page.keyboard.press('j');page.locator('#rpg-tabs [data-rpg="open"][data-id="worlds"]').click()
def pause(value):
    close()
    if diag()['adventure']['paused'] != value: page.keyboard.press('p')
    page.wait_for_function('v=>Realm.diagnostics.adventure.paused===v',arg=value)
def settings(**values):
    close();page.locator('#settings').click()
    for key,value in values.items():
        if key=='quality':page.locator('#quality').select_option(value)
        else:page.locator('#setting-'+key).set_checked(value)
    page.locator('#close-panel').click()
def economic(s):
    a=s['adventure']
    return {'inventory':s['sandbox']['inventory'],
            'adventure':{k:v for k,v in a.items() if k not in ['elapsed','revision','hp','stamina']},
            'realmTrails':s['realmTrails'],'journeys':s['journeys']}

OBSERVER = r"""()=>{
 const clone=v=>JSON.parse(JSON.stringify(v)), E=RealmEngine;
 const proto=RealmArt.WorldArt.prototype,commit=proto.commit;
 const sp=RealmCore.Simulation.prototype,move=sp.moveTo;let owner=null,sim=null,probe=null,initialRender=null;
 sp.moveTo=function(...args){sim=this;sp.moveTo=move;return move.apply(this,args);};
 proto.commit=function(...args){const r=commit.apply(this,args);if(this.room==='world-earthlands'){owner=this;initialRender=this.e.render;proto.commit=commit;}return r;};
 const tagged=i=>!!(i.coastwardBridgePost||i.coastwardApproachLamp);
 const parts=()=>owner.e.batches.flatMap(b=>b.items.filter(tagged).map(i=>({kind:b.kind,item:i})));
 const signature=()=>JSON.stringify({state:Realm.state,player:Realm.diagnostics.adventure.player,camera:owner.e.camera,
  vp:Array.from(owner.e.vp),solids:owner.e.cameraSolids,definition:RealmWorldFoundations.definition('earthlands')});
 const read=(e,f)=>{const g=e.gl,a=new Uint8Array(f.w*f.h*4);g.bindFramebuffer(g.FRAMEBUFFER,f.f);
  g.readPixels(0,0,f.w,f.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;};
 const difference=(a,b)=>{let channels=0,pixels=0,sum=0;for(let i=0;i<a.length;i+=4){let d=0;for(let k=0;k<3;k++){const v=Math.abs(a[i+k]-b[i+k]);channels+=v!==0;d+=v;}sum+=d;pixels+=d>6;}return{channels,pixels,sum};};
 const png=(a,w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d'),im=ctx.createImageData(w,h);
  for(let y=0;y<h;y++)im.data.set(a.subarray((h-1-y)*w*4,(h-y)*w*4),y*w*4);ctx.putImageData(im,0,0);return c.toDataURL('image/png');};
 const blue=a=>{let n=0;for(let i=0;i<a.length;i+=4)if(a[i+2]>120&&a[i+2]>2*a[i]&&a[i+2]>2*a[i+1])n++;return n;};
 window.__postProbe={
  walk(x,z){if(!sim)throw Error('No native movement owner observed');return sim.moveTo(x,z);},
  snapshot(){const e=owner.e;return{parts:parts().map(({kind,item})=>{const b=e.batches.find(b=>b.kind===kind&&b.items.includes(item)),n=b.items.indexOf(item),m=Array.from(b.data.slice(n*24,n*24+16)),g=E.geometry(kind),stride=kind==='timber-panel'?8:6;
    const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let k=0;k<g.length;k+=stride){const v=E.M.transform(m,g.slice(k,k+3));for(let j=0;j<3;j++){min[j]=Math.min(min[j],v[j]);max[j]=Math.max(max[j],v[j]);}}
    return{kind,item:clone(item),matrix:m,min,max,finite:[...m,...min,...max].every(Number.isFinite),cameraBounds:E.solidBounds(kind,item)};}),
   cameraSolids:clone(e.cameraSolids),camera:clone(e.camera),cutawayFocus:clone(e.cutawayFocus),noWater:e.noWater,
   definition:clone(RealmWorldFoundations.definition('earthlands')),prototypesRestored:proto.commit===commit&&sp.moveTo===move,
   renderWriterRestored:e.render===initialRender&&!Object.hasOwn(e,'geometryPass'),
   boundaries:[0,3.15,3.5,4.1].map(x=>({x,walkable:RealmWorldFoundations.walkable('world-earthlands',x,55)}))};},
  capture(){const e=owner.e,writer=e.render,pass=e.geometryPass,hadOwn=Object.hasOwn(e,'render'),hadPass=Object.hasOwn(e,'geometryPass');
   return new Promise((resolve,reject)=>{e.render=function(...args){if(hadOwn)e.render=writer;else delete e.render;
    const saved=e.batches.map(b=>({b,items:b.items,data:b.data,flags:b.items.map(i=>i.cutaway)}));
    const before=signature(),cutaway=e.cutaway,lastShadow=e.lastShadow;let reflected=0,result;
    e.geometryPass=function(...a){if(a[5]===true)reflected++;return pass.apply(this,a);};
    const render=()=>{e.lastShadow=-1;result=writer.apply(e,args);return{main:read(e,e.mainF),ref:read(e,e.refF),metrics:clone(e.metrics)};};
    const flags=v=>{for(const {b} of saved){let hit=false;for(const i of b.items)if(tagged(i)){i.cutaway=v;hit=true;}if(hit)e.updateBatch(b);}};
    try{
     const on=render();flags(false);const off=render();flags(true);const restored=render();
     e.cutaway=false;const disabledOn=render();flags(false);const disabledOff=render();flags(true);e.cutaway=cutaway;render();
     resolve({camera:clone(e.camera),focus:clone(e.cutawayFocus),args,reflectedPasses:reflected,noWater:e.noWater,quality:e.quality,reducedMotion:e.reducedMotion,
      mainDifference:difference(on.main,off.main),reflectionDifference:difference(on.ref,off.ref),restoration:difference(on.main,restored.main),
      disabledDifference:difference(disabledOn.main,disabledOff.main),stateCameraCollisionUnchanged:before===signature(),glError:e.gl.getError(),
      metrics:on.metrics,width:e.mainF.w,height:e.mainF.h,
      actualOnPNG:png(on.main,e.mainF.w,e.mainF.h),actualOffPNG:png(off.main,e.mainF.w,e.mainF.h),reflectionPNG:png(on.ref,e.refF.w,e.refF.h)});
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
    return{label:'Synthetic blue subject; exact submitted post/lamp meshes and actual current camera, no gameplay claim.',camera:clone(e.camera),focus:clone(e.cutawayFocus),
     beforeBlue:blue(off.main),afterBlue:blue(on.main),absentBlue:blue(absent.main),mainDifference:difference(off.main,on.main),
     reflectedPasses:reflected,reflectionDifference:difference(off.ref,on.ref),reflectionPositiveControl:difference(off.ref,absent.ref),
     reducedMotionFreeze:quiet?{main:difference(on.main,quiet.main),reflection:difference(on.ref,quiet.ref)}:null,
     disabledDifference:difference(off.main,disabled.main),restoration:difference(on.main,restored.main),actualStateUnchanged:before===signature(),glError:e.gl.getError(),
     syntheticOnPNG:png(on.main,e.mainF.w,e.mainF.h),syntheticOffPNG:png(off.main,e.mainF.w,e.mainF.h),
     syntheticReflectionPNG:png(on.ref,e.refF.w,e.refF.h),syntheticAbsentReflectionPNG:png(absent.ref,e.refF.w,e.refF.h)};
   }finally{delete e.geometryPass;e.clear();}
  }
 };
}"""

def images(label,data):
    for key in list(data):
        if key.endswith('PNG'):
            (OUT/(label+'-'+key[:-3]+'.png')).write_bytes(base64.b64decode(data.pop(key).split(',')[1]))

def capture(label, required_gain=False):
    actual=ev('()=>__postProbe.capture()');images(label,actual)
    check(label+' actual submitted flags change only main-view pixels',actual['reflectionDifference']['channels']==0 and actual['reflectedPasses']==6 and actual['noWater'] is False and actual['quality']=='balanced',actual)
    check(label+' exact render restoration and disabled-cutaway equality',actual['restoration']['channels']==0 and actual['disabledDifference']['channels']==0 and actual['stateCameraCollisionUnchanged'] and actual['glError']==0)
    synthetic=ev('()=>__postProbe.synthetic()');images(label,synthetic)
    check(label+' fresh synthetic reflection includes real geometry',synthetic['reflectedPasses']==(6 if actual['reducedMotion'] else 5) and synthetic['reflectionPositiveControl']['channels']>100,synthetic['reflectionPositiveControl'])
    check(label+' synthetic main reveal preserves fresh reflection and preference',synthetic['reflectionDifference']['channels']==0 and synthetic['disabledDifference']['channels']==0 and synthetic['restoration']['channels']==0 and synthetic['actualStateUnchanged'] and synthetic['glError']==0)
    check(label+' cutaway retains or increases visible known subject',synthetic['afterBlue']>=synthetic['beforeBlue'],[synthetic['beforeBlue'],synthetic['afterBlue']])
    if actual['reducedMotion']:
        check(label+' reduced motion freezes controlled main and reflection pixels over time',synthetic['reducedMotionFreeze']['main']['channels']==0 and synthetic['reducedMotionFreeze']['reflection']['channels']==0,synthetic['reducedMotionFreeze'])
    if required_gain:
        check(label+' actual camera has a positive occluded-subject control',synthetic['afterBlue']-synthetic['beforeBlue']>20,[synthetic['beforeBlue'],synthetic['afterBlue']])
        check(label+' actual traveler scene changes at the original obstruction',actual['mainDifference']['pixels']>20,actual['mainDifference'])
    report['observations'][label]={'actual':actual,'synthetic':synthetic,'diagnostics':diag()}
    page.screenshot(path=str(OUT/(label+'-native-ui.png')))

def walk(x,z):
    pause(False);start=time.monotonic();r=ev('p=>__postProbe.walk(...p)',[x,z])
    check('production moveTo accepts supported '+str([x,z]),bool(r.get('ok')),r)
    page.wait_for_function('p=>{const q=Realm.diagnostics.adventure.player;return Math.hypot(q.x-p[0],q.z-p[1])<.12}',arg=[x,z],polling=100,timeout=90000)
    report['routes'].append({'destination':[x,z],'seconds':time.monotonic()-start,'player':diag()['adventure']['player'],'method':'Accepted production moveTo; ordinary RAF, no step/coordinate assignment.'})
    pause(True)

server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
started=time.monotonic();page=None
try:
    html=(ROOT/'index.html').read_text(encoding='utf-8')
    check('exact current source files are embedded in the frozen HTML',all((ROOT/s).read_text(encoding='utf-8').strip() in html for s in sources))
    check('command-earned Chapter I fixture has its declared hash',sha(FIXTURE)=='27cb70f57c3584f7de69f667544c8215c6fbc5f7f3d45d7fb7bc241f1cabce49')
    with sync_playwright() as pw,tempfile.TemporaryDirectory(prefix='firstlight-bridge-posts-') as profile:
        context=pw.chromium.launch_persistent_context(profile,**chromium_launch_kwargs(),viewport={'width':1280,'height':800})
        try:
            page=context.new_page();page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
            def request(route):
                if not route.request.url.startswith(f'http://127.0.0.1:{server.server_port}/'):
                    report['external_requests'].append(route.request.url);route.abort()
                else:route.continue_()
            page.route('**/*',request)
            response=page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='load')
            page.wait_for_function('()=>!!window.Realm')
            check('served frozen production HTML matches source receipt',hashlib.sha256(response.body()).hexdigest()==report['html_sha256'])
            check('actual native RAF without test/capture mode',ev('()=>!Realm.test&&!window.__ETERNITIES_CAPTURE_MODE&&!window.__ETERNITIES_TEST_MODE'))
            check('software WebGL2 renderer explicitly identified',diag()['mode']=='webgl2' and 'SwiftShader' in json.dumps(diag()['renderer']))
            page.keyboard.press('c');page.locator('#rpg-tabs [data-rpg="open"][data-id="characters"]').click()
            n=diag()['characters']['count']
            with page.expect_file_chooser() as chooser:page.locator('[data-rpg="chars-import"]').click()
            chooser.value.set_files(str(FIXTURE));page.wait_for_selector('[data-rpg="chars-confirm-import"]')
            page.locator('[data-rpg="chars-confirm-import"]').click()
            page.wait_for_function('n=>Realm.diagnostics.characters.count===n+1',arg=n)
            initial_settings=state()['settings'];settings(quality='low',timeFlow=False)
            ev(OBSERVER);baseline=economic(state());roads();page.locator('[data-rpg="world-road"]').click()
            page.wait_for_function('()=>{const p=Realm.diagnostics.adventure.player;return Math.hypot(p.x-18,p.z-6)<.8}',polling=100,timeout=90000)
            roads();page.locator('[data-rpg="world-select"][data-id="earthlands"]').click()
            page.locator('[data-rpg="world-preview"]').click();page.locator('[data-rpg="world-confirm"]').click()
            page.wait_for_function('()=>Realm.diagnostics.scene==="world-earthlands"')
            snapshot=ev('()=>__postProbe.snapshot()');report['observations']['submission']=snapshot
            posts=[p for p in snapshot['parts'] if p['item'].get('coastwardBridgePost')]
            lamps=[p for p in snapshot['parts'] if p['item'].get('coastwardApproachLamp')]
            check('actual production submits exactly 22 posts and 12 parts of four approach lamps',len(posts)==22 and len(lamps)==12 and snapshot['prototypesRestored'])
            check('actual opted parts are finite and non-authoritative',all(p['finite'] and p['item']['cameraSolid'] is False and p['item']['cutaway'] is True and p['cameraBounds'] is None for p in posts+lamps))
            check('post placements/mesh extents remain canonical',all(p['kind']=='box' and p['item']['p'][0] in [-3.62,3.62] and p['item']['p'][2] in range(20,91,7) and p['item']['s']==[.23,1.34,.23] and abs(p['min'][1]-1.57)<2e-6 and p['item']['solidId']==('bridge-west-rail' if p['item']['p'][0]<0 else 'bridge-east-rail') for p in posts))
            check('only the exact four approach assemblies opt in',{(p['item']['p'][0],p['item']['p'][2]) for p in lamps}=={(-7,19),(7,19),(-7,98),(7,98)} and {p['kind'] for p in lamps}=={'box','cylinder','cone'})
            check('existing rail boxes preserve support and physical edge refusal',snapshot['boundaries'][0]['walkable'] and snapshot['boundaries'][1]['walkable'] and not snapshot['boundaries'][2]['walkable'] and not snapshot['boundaries'][3]['walkable'],snapshot['boundaries'])
            roads();page.locator('#rpg-tabs [data-rpg="open"][data-id="atlas"]').click();page.locator('[data-rpg="world-walk"][data-id="channel-view"]').click()
            page.wait_for_function('()=>{const p=Realm.diagnostics.adventure.player;return Math.hypot(p.x,p.z-55)<.12}',polling=100,timeout=90000)
            settings(quality='balanced',cameraCutaway=True,reducedMotion=False)
            pause(True);page.locator('[data-rpg="camera"][data-id="adventure"]').click()
            page.keyboard.press('e');page.locator('[data-rpg="world-bridge-view"]').click()
            page.wait_for_timeout(1000);capture('center-third',True)
            page.keyboard.press('v');page.keyboard.press('e');page.locator('[data-rpg="world-bridge-view"]').click()
            page.wait_for_timeout(1000);capture('center-diorama')
            walk(-2.9,55);page.wait_for_timeout(1000);capture('edge-diorama')
            page.keyboard.press('v');page.wait_for_timeout(1000);capture('edge-third')
            walk(0,19);page.wait_for_timeout(1000);capture('bank-third',True)
            page.keyboard.press('v');page.wait_for_timeout(1000);capture('bank-diorama')
            settings(reducedMotion=True);page.wait_for_timeout(1000);capture('bank-reduced-motion-diorama')
            page.keyboard.press('v');page.wait_for_timeout(1000);capture('bank-reduced-motion-third',True)
            check('native settings reach reduced-motion engine without disabling cutaway',report['observations']['bank-reduced-motion-third']['actual']['reducedMotion'] is True)
            settings(cameraCutaway=False);disabled=ev('()=>__postProbe.capture()');images('bank-native-cutaway-disabled',disabled)
            check('native disabled preference preserves the opaque flags-independent image',disabled['mainDifference']['channels']==0 and disabled['reflectionDifference']['channels']==0 and disabled['stateCameraCollisionUnchanged'])
            restored=ev('()=>__postProbe.snapshot()');report['observations']['restored_submission']=restored
            check('all probe flags, submitted matrices, render writers, physical boxes and canonical definitions restore exactly',restored['parts']==snapshot['parts'] and restored['cameraSolids']==snapshot['cameraSolids'] and restored['definition']==snapshot['definition'] and restored['prototypesRestored'] and restored['renderWriterRestored'])
            check('all presentation probes preserve currency, gear, quest/history and companion',economic(state())==baseline)
            settings(quality=initial_settings['quality'],timeFlow=initial_settings['timeFlow'],cameraCutaway=initial_settings['cameraCutaway'],reducedMotion=initial_settings['reducedMotion'])
            pause(False);page.locator('#world-home').click();page.wait_for_function('()=>Realm.diagnostics.scene==="valley"')
            check('native free return remains supported and preserves progression',ev('()=>{const p=Realm.diagnostics.adventure.player;return Math.hypot(p.x-18,p.z-6)<1}') and economic(state())==baseline)
            check('actual application and WebGL complete without browser errors or external requests',not report['browser_errors'] and not report['external_requests'] and not diag()['errors'])
            report['final_diagnostics']=diag();report['status']='passed'
        except Exception:
            try:page.screenshot(path=str(OUT/'FAILURE.png'));report['failure_diagnostics']=diag();report['failure_ui']=page.locator('#rpg-content').inner_text()
            except Exception:pass
            raise
        finally:context.close()
except Exception as error:
    report['status']='failed';report['errors'].append(str(error));report['traceback']=traceback.format_exc();print(report['traceback'],flush=True)
finally:
    server.shutdown();server.server_close();report['wall_seconds']=time.monotonic()-started
    report['outputs']={p.name:{'sha256':sha(p),'bytes':p.stat().st_size} for p in OUT.glob('*.png')}
    (OUT/'REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8',newline='\n')
if report['status']!='passed':raise SystemExit(1)
