"""Coastward scenery on the real earned Chapter I import and ordinary-time route.

Fresh disposable native Chromium profile; software SwiftShader; production
Import character, Roads, map-walk, pause and camera controls. Native RAF and
simulation time are never intercepted or accelerated. No test-mode hooks,
coordinate writes, progression grants or direct movement commands are used.
Read-only WorldArt/renderer observation records the actual submitted geometry.
A labelled one-frame appearance ablation uses identical render arguments,
restores every batch and the render writer synchronously, and never ticks play.
This is integration/pixel evidence, not hardware performance or human approval.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import base64, hashlib, json, os, subprocess, tempfile, threading, time, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

ROOT = Path(os.environ.get('FIRSTLIGHT_TEST_ROOT', Path(__file__).resolve().parents[1])).resolve()
OUT = Path(os.environ.get('FIRSTLIGHT_SCENERY_OUTPUT', ROOT / 'evidence10/coastward-scenery-browser')).resolve()
OUT.mkdir(parents=True, exist_ok=True)
FIXTURE = ROOT / 'examples/CHAPTER_COMPLETED_EARNED.json'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
sources = ['src/coastward-settlement-art.js', 'src/coastward-woodland-art.js',
           'src/world-atlantis-earth.js', 'src/world-foundations-art.js',
           'src/world-foundations.js', 'src/world.js', 'src/engine.js', 'src/app.js',
           'src/characters.js', 'src/characters-ui.js', 'src/world-foundations-ui.js']
report = {'method': __doc__, 'head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
          'html_sha256': sha(ROOT / 'index.html'), 'html_bytes': (ROOT / 'index.html').stat().st_size,
          'harness_sha256': sha(Path(__file__)), 'sources': {p: sha(ROOT / p) for p in sources},
          'fixture': {'path': str(FIXTURE.relative_to(ROOT)), 'sha256': sha(FIXTURE),
                      'label': 'Checked-in command-earned Chapter I completed checkpoint, imported as a new character; not Chapter IV.'},
          'checks': [], 'errors': [], 'browser_errors': [], 'observations': {}, 'routes': [], 'outputs': {}}
for env, key in [('FIRSTLIGHT_EXPECT_HEAD', 'head'), ('FIRSTLIGHT_EXPECT_HTML_SHA', 'html_sha256')]:
    if os.environ.get(env) and os.environ[env] != report[key]:
        raise RuntimeError('Requested source epoch mismatch: ' + key)

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw): super().__init__(*a, directory=str(ROOT), **kw)
    def log_message(self, *a): pass

def check(name, passed, evidence=None):
    row = {'name': name, 'passed': bool(passed)}
    if evidence is not None: row['evidence'] = evidence
    report['checks'].append(row)
    print(('PASS ' if passed else 'FAIL ') + name, flush=True)
    if not passed: raise AssertionError(name)

def ev(js, arg=None): return page.evaluate(js, arg)
def state(): return ev('()=>Realm.state')
def diag(): return ev('()=>Realm.diagnostics')
def player_position(): return diag()['adventure']['player']
def close():
    if page.locator('#rpg-window').evaluate('(e)=>e.open'): page.locator('#rpg-close').click()
    if page.locator('#drawer').evaluate('(e)=>e.classList.contains("open")'): page.locator('#close-panel').click()
def roads():
    close(); page.keyboard.press('j')
    page.locator('#rpg-tabs [data-rpg="open"][data-id="worlds"]').click()
def walk_point(point, timeout=180000):
    roads(); page.locator('#rpg-tabs [data-rpg="open"][data-id="atlas"]').click()
    page.locator('[data-rpg="world-walk"][data-id="' + point + '"]').click()
    wait_point(point, timeout)
def wait_point(point, timeout=180000):
    started = time.monotonic()
    page.wait_for_function('id=>{const d=Realm.diagnostics,p=RealmWorldFoundations.definition(d.scene).points.find(p=>p.id===id),s=d.adventure.player;return Math.hypot(s.x-p.x,s.z-p.z)<(p.kind==="person"?2:0.8)}', arg=point, polling=250, timeout=timeout)
    report['routes'].append({'destination': point, 'wall_seconds': time.monotonic()-started, 'player': player_position(), 'controls': 'Visible Local map Walk button; native RAF and production pathfinder.'})
    check('normal route reaches ' + point + ' alive and on supported dry ground',
          ev('()=>{const s=Realm.state,d=Realm.diagnostics,p=d.adventure.player;return d.scene==="world-earthlands"&&s.adventure.hp>0&&RealmWorldFoundations.walkable(d.scene,p.x,p.z)&&Math.abs(d.world.height-1.57)<1e-8}'))

# The observer captures the actual WorldArt owner only when its production
# commit creates Coastward. It preserves the original call/return and immediately
# restores the prototype. Snapshot operations never invoke the pure decorator.
OBSERVER = r"""()=>{
 const proto=RealmArt.WorldArt.prototype,original=proto.commit;
 let owner=null;
 proto.commit=function(...args){const result=original.apply(this,args);
  if(this.room==='world-earthlands'){owner=this;proto.commit=original;}return result;};
 const clone=v=>JSON.parse(JSON.stringify(v));
 const selected=(i,group)=>group==='woodland'?!!i.woodlandPart:!!i.settlementPart;
 const signature=()=>JSON.stringify({state:Realm.state,actualPlayer:Realm.diagnostics.adventure.player,camera:owner.e.camera,vp:Array.from(owner.e.vp),
  solids:owner.e.cameraSolids,definition:RealmWorldFoundations.definition('earthlands')});
 window.__coastwardObservation={
  snapshot(){if(!owner)throw Error('No production Coastward commit observed');const e=owner.e,E=RealmEngine,
   def=RealmWorldFoundations.definition('earthlands'),parts=[];
   for(const b of e.batches)for(let index=0;index<b.items.length;index++){
    const item=b.items[index];if(!item.woodlandPart&&!item.settlementPart&&!item.worldSolid)continue;
    const matrix=Array.from(b.data.slice(index*24,index*24+16));
    const data=E.geometry(b.kind),stride=b.kind==='timber-panel'?8:6,min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    let finite=matrix.every(Number.isFinite),vertices=0;
    for(let i=0;i<data.length;i+=stride){const v=E.M.transform(matrix,data.slice(i,i+3));finite=finite&&v.every(Number.isFinite);vertices++;
     for(let k=0;k<3;k++){min[k]=Math.min(min[k],v[k]);max[k]=Math.max(max[k],v[k]);}}
    const expected=item.m||E.M.compose(...item.p,...item.s,...(item.r||[0,0,0]));
    const basis=[0,4,8].map(i=>matrix.slice(i,i+3));
    parts.push({kind:b.kind,vertices,finite,min,max,matrix,matrixMatches:matrix.every((n,i)=>n===Math.fround(expected[i])),
     matrixQuantizationMax:Math.max(...matrix.map((n,i)=>Math.abs(n-expected[i]))),
     positiveBasis:E.dot(basis[0],E.cross(basis[1],basis[2]))>0,
     supported:!!b.vao&&b.geom.count===data.length/stride,
     cameraBounds:E.solidBounds(b.kind,item),item:clone({...item,m:item.m?Array.from(item.m):null})});
   }
   return{parts,definition:clone(def),cameraSolids:clone(e.cameraSolids),metrics:clone(e.metrics),
    totalStaticInstances:e.batches.reduce((n,b)=>n+b.count,0),
    batches:e.batches.map(b=>({kind:b.kind,count:b.count,verticesPerInstance:b.geom.count})),
    observersRestored:proto.commit===original,viewShelters:clone(e.viewShelters),camera:clone(e.camera),renderer:Realm.diagnostics.renderer,
    trailAnchors:clone(RealmTrails.definitions().filter(d=>d.realm==='earthlands').flatMap(d=>[d.giver,...d.steps]))};
  },
  ablate(group){if(!owner)throw Error('No Coastward owner');const e=owner.e,writer=e.render,hadOwn=Object.hasOwn(e,'render');
   const restoreWriter=()=>{if(hadOwn)e.render=writer;else delete e.render;};
   return new Promise((resolve,reject)=>{e.render=function(...args){restoreWriter();
    const saved=e.batches.map(b=>({b,items:b.items,data:b.data,count:b.count})),before=signature();
    const read=()=>{const g=e.gl,a=new Uint8Array(e.mainF.w*e.mainF.h*4);g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);
     g.readPixels(0,0,e.mainF.w,e.mainF.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;};
    const png=a=>{const c=document.createElement('canvas');c.width=e.mainF.w;c.height=e.mainF.h;const ctx=c.getContext('2d'),im=ctx.createImageData(c.width,c.height);
     for(let y=0;y<c.height;y++)im.data.set(a.subarray((c.height-1-y)*c.width*4,(c.height-y)*c.width*4),y*c.width*4);
     ctx.putImageData(im,0,0);return c.toDataURL('image/png');};
    let baseline,absent,recovered,result,baselineMetrics,absentMetrics,recoveredMetrics;
    try{
     result=writer.apply(e,args);baseline=read();baselineMetrics=clone(e.metrics);let removed=0;
     for(const {b} of saved){const filtered=b.items.filter(i=>!selected(i,group));removed+=b.items.length-filtered.length;
      if(filtered.length!==b.items.length){b.items=filtered;e.updateBatch(b);}}
     writer.apply(e,args);absent=read();absentMetrics=clone(e.metrics);
     for(const {b,items,data} of saved){b.items=items;b.data=data;e.updateBatch(b);}writer.apply(e,args);recovered=read();recoveredMetrics=clone(e.metrics);
     let changed=0,maxDelta=0,sumDelta=0,restorationDelta=0;
     for(let i=0;i<baseline.length;i+=4){let delta=0;for(let k=0;k<3;k++){delta+=Math.abs(baseline[i+k]-absent[i+k]);restorationDelta+=Math.abs(baseline[i+k]-recovered[i+k]);}
      if(delta>6)changed++;maxDelta=Math.max(maxDelta,delta);sumDelta+=delta;}
     resolve({group,removed,changedPixels:changed,maxRGBDelta:maxDelta,sumRGBDelta:sumDelta,restorationRGBDelta:restorationDelta,
      width:e.mainF.w,height:e.mainF.h,renderArguments:args,canonicalCameraCollisionUnchanged:before===signature(),
      writerRestored:e.render===writer&&Object.hasOwn(e,'render')===hadOwn,batchObjectsRestored:saved.every(({b,items,count,data})=>b.items===items&&b.count===count&&b.data===data),
      baselineMetrics,absentMetrics,recoveredMetrics,
      glError:e.gl.getError(),baselinePNG:png(baseline),absentPNG:png(absent),recoveredPNG:png(recovered)});
    }catch(error){reject(String(error));}
    finally{for(const {b,items,data} of saved){b.items=items;b.data=data;e.updateBatch(b);}restoreWriter();}
    return result;
   };});
  }
 };
}"""

def economic(s):
    a=s['adventure']
    return {'inventory':s['sandbox']['inventory'],
            'adventure':{k:a.get(k) for k in ['owned','equipment','xp','ore','coins','arsenal','classPath','companion','reward','defeated','realmCraft']},
            'realmTrails':s['realmTrails'], 'journeys':s['journeys']}

def body_intersects(a, b, part):
    """Conservative swept 1.7 m body against actual transformed mesh AABB."""
    low=part['min'][:];high=part['max'][:]
    if part['item'].get('wind')==2:
        low[0]-=.095;high[0]+=.095;low[1]-=.05;high[1]+=.05
    low=[low[0]-.31,low[1]-1.7,low[2]-.31]
    high=[high[0]+.31,high[1],high[2]+.31]
    first,last=0,1
    for start,end,mn,mx in zip(a,b,low,high):
        delta=end-start
        if abs(delta)<1e-9:
            if start<mn or start>mx:return False
        else:
            x,y=(mn-start)/delta,(mx-start)/delta
            first=max(first,min(x,y));last=min(last,max(x,y))
            if first>last:return False
    return True

def capture(label, group):
    data=ev('group=>__coastwardObservation.ablate(group)',group)
    for field, suffix in [('baselinePNG','actual'),('absentPNG','appearance-ablated'),('recoveredPNG','restored')]:
        path=OUT/(label+'-'+suffix+'.png');path.write_bytes(base64.b64decode(data.pop(field).split(',')[1]))
    data['diagnostics']=diag();report['observations'][label]=data
    check(label+' has positive actual pixel contribution from '+group, data['removed']==(140 if group=='woodland' else 177) and data['changedPixels']>100, data['changedPixels'])
    check(label+' single-frame ablation restores all batches, writer, state, camera and collision',
          data['canonicalCameraCollisionUnchanged'] and data['writerRestored'] and data['batchObjectsRestored'] and data['restorationRGBDelta']==0 and data['glError']==0)
    page.screenshot(path=str(OUT/(label+'-ui.png')))

def two_views(label, group):
    page.locator('[data-rpg="camera"][data-id="adventure"]').click()
    page.wait_for_function('()=>Realm.diagnostics.camera.projection==="perspective"',polling=100)
    before=economic(state());placement=player_position();capture(label+'-third',group)
    page.keyboard.press('v')
    page.wait_for_function('()=>Realm.diagnostics.camera.projection==="orthographic"',polling=100)
    capture(label+'-diorama',group)
    check(label+' real V changes projection while preserving character and progression',player_position()==placement and economic(state())==before)

server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
started=time.monotonic();page=None
try:
    with sync_playwright() as pw, tempfile.TemporaryDirectory(prefix='firstlight-scenery-native-') as profile:
        context=pw.chromium.launch_persistent_context(profile,**chromium_launch_kwargs(),viewport={'width':1280,'height':800})
        try:
            page=context.new_page();page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
            response=page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='load')
            page.wait_for_function('()=>!!window.Realm',polling=100)
            check('served production HTML matches the checked-out artifact',hashlib.sha256(response.body()).hexdigest()==report['html_sha256'])
            check('native scheduling runs without test or capture mode',ev('()=>!Realm.test&&!window.__ETERNITIES_CAPTURE_MODE&&!window.__ETERNITIES_TEST_MODE'))
            check('browser uses software SwiftShader WebGL2',diag()['mode']=='webgl2' and 'SwiftShader' in json.dumps(diag()['renderer']))
            page.keyboard.press('c');page.locator('#rpg-tabs [data-rpg="open"][data-id="characters"]').click()
            count=diag()['characters']['count']
            # Consume the actual native chooser. Setting the input separately
            # can let a later chooser-cancel invalidate the legitimate read.
            with page.expect_file_chooser() as chooser:
                page.locator('[data-rpg="chars-import"]').click()
            chooser.value.set_files(str(FIXTURE))
            page.wait_for_function('()=>document.querySelector(".chars-import-preview")||document.querySelector("#toast").textContent.includes("Import refused")',polling=100,timeout=10000)
            check('production save validation accepts the earned fixture into an import preview',page.locator('[data-rpg="chars-confirm-import"]').count()==1,page.locator('#toast').inner_text())
            check('production import preview explicitly adds a new slot without replacement','Nothing is replaced' in page.locator('#rpg-content').inner_text())
            page.locator('[data-rpg="chars-confirm-import"]').click()
            page.wait_for_function('n=>Realm.diagnostics.characters.count===n+1',arg=count,polling=100)
            initial=state();report['observations']['accepted_import']={'characters':diag()['characters'],'adventure_version':initial['adventure']['version'],'player':initial['player']}
            check('earned Chapter I import retains bond, reward and unassigned class',initial['adventure']['companion']['bonded'] and initial['adventure']['reward']=='warden_stone' and initial['adventure']['classPath']['choice'] is None)
            close();page.locator('#settings').click();page.locator('#quality').select_option('low');page.locator('#setting-timeFlow').uncheck();page.locator('#close-panel').click()
            ev(OBSERVER);baseline=economic(state());roads();page.locator('[data-rpg="world-road"]').click()
            page.wait_for_function('()=>{const p=Realm.diagnostics.adventure.player;return Math.hypot(p.x-18,p.z-6)<0.8}',polling=250,timeout=90000)
            check('real Roads walk reaches the existing five-light gate',diag()['scene']=='valley')
            roads();page.locator('[data-rpg="world-select"][data-id="earthlands"]').click()
            page.locator('[data-rpg="world-preview"]').click();page.locator('[data-rpg="world-confirm"]').click()
            page.wait_for_function('()=>Realm.diagnostics.scene==="world-earthlands"',polling=100)
            scene=ev('()=>__coastwardObservation.snapshot()');report['observations']['production_submission']=scene
            parts=scene['parts'];wood=[p for p in parts if p['item'].get('woodlandPart')];houses=[p for p in parts if p['item'].get('settlementPart')]
            check('actual production caller submits the bounded 140 woodland and 177 settlement records',len(wood)==140 and len(houses)==177 and scene['observersRestored'])
            check('actual instance matrices, transformed meshes and renderer VAOs are finite and supported',all(p['finite'] and p['positiveBasis'] and p['matrixMatches'] and p['supported'] for p in wood+houses))
            check('actual scenery creates no camera or collision authority',all(p['item'].get('appearanceOnly') and p['item'].get('cameraSolid') is False and p['cameraBounds'] is None and not p['item'].get('worldSolid') for p in wood+houses))
            check('actual tree/cutaway ownership remains distinct from building cutaway',all(p['item'].get('cutaway') is False for p in wood) and all(p['item'].get('cutaway') is True for p in houses))
            check('actual canopy contains mixed supported meshes and no old stacked cones',len([p for p in wood if p['item'].get('foliage')])==40 and {p['kind'] for p in wood}=={'round','octa','timber-panel'} and all(p['kind']!='cone' for p in wood))
            solids=[p for p in parts if p['item'].get('worldSolid')]
            parents=[s for s in scene['definition']['solids'] if s['id'].startswith('woodland-trunk-') or s['id'] in ['west-house','east-house','field-store']]
            check('all thirteen existing authoritative parent boxes remain unchanged and camera-solid',all(len([p for p in solids if p['item']['worldSolidId']==s['id'] and p['kind']=='box' and p['item']['p']==[s['x'],1.57+s['h']/2,s['z']] and p['item']['s']==[s['w'],s['h'],s['d']] and p['item']['cameraSolid']])==1 for s in parents))
            check('actual low roots are grounded and stay within their reserved parent margin',all(p['min'][1]>=1.57-2e-6 and p['max'][1]<=1.84 and p['min'][0]>=next(s for s in parents if s['id']==p['item']['solidId'])['x']-.475-2e-6 and p['max'][0]<=next(s for s in parents if s['id']==p['item']['solidId'])['x']+.475+2e-6 for p in wood if p['item'].get('lowRoot')))
            check('actual roof shells rest above the unchanged solid wall tops',len([p for p in houses if p['item']['settlementPart']=='roof-shell'])==3 and all(abs(p['min'][1]-(1.57+next(s for s in parents if s['id']==p['item']['solidId'])['h']+.03))<2e-6 for p in houses if p['item']['settlementPart']=='roof-shell'))
            conflicts=[]
            for route in scene['definition']['routes']:
                for a,b in zip(route['points'],route['points'][1:]):
                    for p in wood+houses:
                        if body_intersects([a[0],1.59,a[1]],[b[0],1.59,b[1]],p):conflicts.append([route['id'],p['item']['solidId'],p['item'].get('woodlandPart') or p['item'].get('settlementPart')])
            check('actual submitted scenery clears every authored full-body route including conservative wind',not conflicts,conflicts)
            conflicts=[]
            for point in scene['definition']['points']+scene['trailAnchors']:
                for p in wood+houses:
                    at=[point['x'],1.59,point['z']]
                    if body_intersects(at,at,p):conflicts.append([point['id'],p['item']['solidId']])
            check('actual submitted scenery clears local actor/objective and accepted trail anchors',not conflicts,conflicts)
            report['observations']['scenery_cost']={'woodland_instances':len(wood),'settlement_instances':len(houses),'woodland_vertices_per_geometry_pass':sum(p['vertices'] for p in wood),'settlement_vertices_per_geometry_pass':sum(p['vertices'] for p in houses),'note':'Actual submitted mesh inventory, not measured frame cost; low graphics excludes shadow/reflection passes.'}
            walk_point('channel-view');page.screenshot(path=str(OUT/'bridge-ordinary-route.png'))
            # A visible local-map action starts the long route. Pause is pressed
            # at a real woodland crossing; no position/path field is assigned.
            roads();page.locator('#rpg-tabs [data-rpg="open"][data-id="atlas"]').click();page.locator('[data-rpg="world-walk"][data-id="field-water"]').click()
            page.wait_for_function('()=>Realm.diagnostics.adventure.player.z<=5',polling=100,timeout=180000);page.keyboard.press('p')
            page.wait_for_function('()=>Realm.diagnostics.adventure.paused',polling=100)
            report['observations']['woodland_stopped_player']=player_position();two_views('woodland','woodland')
            page.keyboard.press('p');wait_point('field-water')
            walk_point('delivery-register');page.keyboard.press('p');page.wait_for_function('()=>Realm.diagnostics.adventure.paused',polling=100)
            two_views('settlement','settlement');page.keyboard.press('p')
            check('ordinary scenery outing adds no gear, inventory, class, quest, reward or companion grant',economic(state())==baseline)
            page.locator('#world-home').click();page.wait_for_function('()=>Realm.diagnostics.scene==="valley"',polling=100)
            check('actual free home control returns to the saved five-light checkpoint',ev('()=>{const p=Realm.diagnostics.adventure.player;return Math.hypot(p.x-18,p.z-6)<1}'))
            check('actual application and WebGL report no errors',not report['browser_errors'] and not diag()['errors'])
            report['observations']['final_diagnostics']=diag()
        except Exception:
            try:
                page.screenshot(path=str(OUT/'FAILURE.png'))
                report['failure_diagnostics']=diag()
                report['failure_ui']={'toast':page.locator('#toast').inner_text(),'dialog':page.locator('#rpg-content').inner_text()}
            except Exception:pass
            raise
        finally: context.close()
    report['status']='passed'
except Exception as error:
    report['status']='failed';report['errors'].append(str(error));report['traceback']=traceback.format_exc()
    if page:
        try:page.screenshot(path=str(OUT/'FAILURE.png'));report['failure_diagnostics']=diag()
        except Exception:pass
    print(traceback.format_exc(),flush=True)
finally:
    server.shutdown();server.server_close();report['wall_seconds']=time.monotonic()-started
    report['outputs']={p.name:{'sha256':sha(p),'bytes':p.stat().st_size} for p in OUT.glob('*.png')}
    (OUT/'REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8',newline='\n')
if report['status']!='passed':raise SystemExit(1)
