"""Earned home designs through real native UI, materials, placement and restarts.

Seeds earn all local commissions via production command journeys. Missing the
new optional field is the labelled migration boundary. Movement/gathering use
accelerated production ticks; progress/cost/ownership are never granted. This
software-WebGL test is distinct from normal-time footage and human acceptance.
Context-only and awaited page-close shutdowns retain raw pre-app key receipts.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from contextlib import nullcontext
import hashlib,json,os,subprocess,tempfile,threading,traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs
ROOT=Path(os.environ.get('FIRSTLIGHT_TEST_ROOT',Path(__file__).resolve().parents[1])).resolve()
OUT=Path(os.environ.get('FIRSTLIGHT_HOME_HISTORY_OUTPUT',ROOT/'evidence10/home-history-browser')).resolve();OUT.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
KEY='eternities.realm10.characters.v1'
report={'method':__doc__,'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'html_sha256':sha(ROOT/'index.html'),'harness_sha256':sha(Path(__file__)),'sources':{str(p.relative_to(ROOT)):sha(p) for p in sorted((ROOT/'src').glob('*')) if p.is_file()},'checks':[],'variants':{},'browser_errors':[],'errors':[]}
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/index.html'
context=None;page=None
def check(name,ok,evidence=None):
 row={'name':name,'passed':bool(ok)}
 if evidence is not None:row['evidence']=evidence
 report['checks'].append(row);print(('PASS ' if ok else 'FAIL ')+name,flush=True)
 if not ok:raise AssertionError(name)
def ev(js,arg=None):return page.evaluate(js,arg)
def state():return ev('Realm.state')
def render():ev('Realm.test.render()')
def raw():return ev('localStorage.getItem(RealmCharacters.KEY)')
def close():
 if page.locator('#rpg-window').evaluate('e=>e.open'):page.locator('#rpg-close').click()
 if page.locator('#drawer').evaluate('e=>e.classList.contains("open")'):page.locator('#close-panel').click()
def room():close();ev('Realm.test.openPanel("retreat")');page.wait_for_selector('#drawer.open');render()
def stable(s):
 a={k:v for k,v in s['adventure'].items() if k not in ['elapsed','hp','stamina','lumen']}
 return {'adventure':a,**{k:s[k] for k in ['localLife','realmTrails','journeys','earthExpedition','notes','score','scoreRevision','visitor','flowers']}}
def walk(x,z):
 close();r=ev('''([x,z])=>{const r=Realm.test.move(x,z);if(!r.ok)return r;let frames=0;while(Realm.test.path.length&&frames++<18000)Realm.test.step(.05);Realm.test.render();const p=Realm.diagnostics.adventure.player;return{ok:Math.hypot(p.x-x,p.z-z)<.25&&Realm.state.adventure.hp>0,frames,player:p};}''',[x,z]);check(variant+' real walking '+str((x,z)),r['ok'],r)
def receipt(text):
 if text is None:return None
 r=json.loads(text);return{'sha256':hashlib.sha256(text.encode()).hexdigest(),'revision':r['revision'],'active':r['active'],'world':next(s['world'] for s in r['slots'] if s['id']==r['active'])}
def spawn():
 global page
 page=context.pages[0] if context.pages else context.new_page()
 for other in context.pages:
  if other!=page:other.close()
 page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
 page.add_init_script('''window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;window.__homeStartup=localStorage.getItem('eternities.realm10.characters.v1');''')
 response=page.goto(url,wait_until='load');page.wait_for_function('()=>!!window.Realm');check(variant+' exact standalone HTML',hashlib.sha256(response.body()).hexdigest()==report['html_sha256']);render()
 startup=ev('__homeStartup');record.setdefault('startup',[]).append(receipt(startup));ev("Realm.test.quality('low');Realm.test.render()")
 page.on('console',lambda message:record.setdefault('lifecycle',[]).append(json.loads(message.text[len('__HOME_RECEIPT__'):])) if message.text.startswith('__HOME_RECEIPT__') else None)
 ev('''()=>{const observe=r=>console.debug('__HOME_RECEIPT__'+JSON.stringify(r)),set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){const r=set.call(this,k,v);if(k===RealmCharacters.KEY){const library=JSON.parse(v);observe({event:'successful-native-write',revision:library.revision,active:library.active,raw:v});}return r;};window.addEventListener('pagehide',()=>observe({event:'pagehide-after-production-save',raw:localStorage.getItem(RealmCharacters.KEY)}));}''')
 return startup
def restart(label,method):
 global context
 close();before=state();stored=receipt(raw());check(variant+' exact home/cost checkpoint before '+label,stored['world']['homeHistory']==before['homeHistory'] and stored['world']['retreat']==before['retreat'] and stored['world']['sandbox']['inventory']==before['sandbox']['inventory'] and stable(stored['world'])==stable(before))
 checkpoint={'label':label,'close_method':method,'before':stored};lifecycle_offset=len(record.get('lifecycle',[]));prior_raw=raw()
 if method=='awaited-page-close':
  with page.expect_event('close'):page.close(run_before_unload=True)
 context.close();closed=record.get('lifecycle',[])[lifecycle_offset:];latest=next((row['raw'] for row in reversed(record.get('lifecycle',[])) if row.get('raw')),prior_raw);expected=receipt(latest);checkpoint['shutdown_lifecycle']=closed.copy();checkpoint['last_observed_write_or_post_save']=expected
 if method=='awaited-page-close':check(variant+' awaited close observes production pagehide save '+label,any(row['event']=='pagehide-after-production-save' for row in closed))
 context=start();startup=spawn();initial=receipt(startup);after=state();checkpoint['startup']=initial;checkpoint['after']=receipt(raw());record.setdefault('restarts',[]).append(checkpoint)
 check(variant+' raw startup equals last observed successful native storage '+label,initial is not None and initial['sha256']==expected['sha256'],{'expected_sha256':expected['sha256'],'startup_sha256':initial['sha256'] if initial else None,'shutdown_events':[row['event'] for row in closed]})
 check(variant+' '+method+' startup is latest exact owned checkpoint '+label,initial is not None and initial['active']==stored['active'] and initial['revision']>=stored['revision'] and initial['world']['homeHistory']==before['homeHistory'] and initial['world']['retreat']==before['retreat'] and initial['world']['sandbox']['inventory']==before['sandbox']['inventory'] and stable(initial['world'])==stable(before),{'revision_before':stored['revision'],'revision_startup':initial['revision'] if initial else None,'sha256_before':stored['sha256'],'sha256_startup':initial['sha256'] if initial else None})
 check(variant+' loaded checkpoint keeps home and prior systems '+label,after['homeHistory']==before['homeHistory'] and after['retreat']==before['retreat'] and after['sandbox']['inventory']==before['sandbox']['inventory'] and stable(after)==stable(before) and after['settings']['cameraViews']==before['settings']['cameraViews'])
def quota(on):
 if on:ev('''()=>{window.__homeQuotaSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===RealmCharacters.KEY)throw Error('labelled home quota refusal');return __homeQuotaSet.call(this,k,v);};}''')
 else:ev('()=>{Storage.prototype.setItem=__homeQuotaSet;}')
def visible_models(view):
 close();page.locator('[data-rpg="camera"][data-id="'+view+'"]').click();page.keyboard.press('r');render()
 # One-frame appearance ablation changes only authored batches, never state,
 # camera, collision or player pose. Restore before screenshot/next action.
 data=ev('''()=>{const e=__homeArt.e,sim=Realm.test.worldContext().sim,batches=e.batches,saved=batches.map(b=>({b,items:b.items,data:b.data,count:b.count})),before=JSON.stringify({state:Realm.state,player:sim.state.player,camera:e.camera,vp:Array.from(e.vp),solids:e.cameraSolids}),read=()=>{const g=e.gl,a=new Uint8Array(e.mainF.w*e.mainF.h*4);g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);g.readPixels(0,0,e.mainF.w,e.mainF.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;},args=[sim.elapsed,sim.state.hour,sim.state.weather==='rain'];e.render(...args);const normal=read(),results=[];try{for(const d of RealmHomeHistory.definitions.filter(d=>d.source!=="bridgeCommunity")){for(const q of saved){q.b.items=q.items.filter(i=>i.homeMemoryKind!==d.id);e.updateBatch(q.b);}e.render(...args);const erased=read();let changed=0;for(let i=0;i<normal.length;i+=4)if(Math.max(Math.abs(normal[i]-erased[i]),Math.abs(normal[i+1]-erased[i+1]),Math.abs(normal[i+2]-erased[i+2]))>2)changed++;results.push({id:d.id,parts:saved.reduce((n,q)=>n+q.items.filter(i=>i.homeMemoryKind===d.id).length,0),changedPixels:changed});for(const q of saved){q.b.items=q.items;q.b.data=q.data;e.updateBatch(q.b);q.b.count=q.count;}}}finally{for(const q of saved){q.b.items=q.items;q.b.data=q.data;e.updateBatch(q.b);q.b.count=q.count;}}e.render(...args);const restored=read();let restorationRGBDelta=0;for(let i=0;i<normal.length;i++)restorationRGBDelta+=Math.abs(normal[i]-restored[i]);return{results,restorationRGBDelta,batchesRestored:saved.every(q=>q.b.items===q.items&&q.b.data===q.data&&q.b.count===q.count),glError:e.gl.getError(),invariants:before===JSON.stringify({state:Realm.state,player:sim.state.player,camera:e.camera,vp:Array.from(e.vp),solids:e.cameraSolids})};}''')
 check(variant+' appearance ablation exactly restores batches and framebuffer '+view,data['invariants'] and data['batchesRestored'] and data['restorationRGBDelta']==0 and data['glError']==0,data)
 for row in data['results']:check(variant+' actual low-quality '+view+' model '+row['id'],row['parts']>=7 and row['changedPixels']>10 and data['invariants'],row)
 record.setdefault('appearance',{})[view]=data;page.screenshot(path=str(OUT/(variant+'-room-'+view+'.png')))
try:
 with sync_playwright() as pw:
  for variant,flags in [('fresh-blade',[]),('fresh-bow',['--bow']),('returning-strongest',['--veteran'])]:
   record={};report['variants'][variant]=record
   result=subprocess.run(['node','tests/home_history_journey.cjs','--seed-only','--output',str(OUT/'journeys'),*flags],cwd=ROOT,capture_output=True,text=True,encoding='utf-8');(OUT/(variant+'-seed.log')).write_text(result.stdout+result.stderr,encoding='utf-8');check(variant+' command-earned seed',result.returncode==0)
   seed=OUT/'journeys'/variant/'00_EARNED_HOME_SEED.json';source=json.loads(seed.read_text(encoding='utf-8'));source.pop('homeHistory');fixture=OUT/(variant+'-migration.json');fixture.write_text(json.dumps(source),encoding='utf-8');record['seed']={'sha256':sha(seed),'migration_sha256':sha(fixture),'label':'command-earned local history; only homeHistory absent'}
   # Retain these synthetic profiles privately for shutdown diagnosis. A new
   # artifact epoch always gets new profiles; never reuse a personal profile.
   with nullcontext(tempfile.mkdtemp(prefix='home-native-',dir=OUT)) as profile:
    def start():return pw.chromium.launch_persistent_context(profile,**chromium_launch_kwargs(),viewport={'width':1280,'height':800})
    context=start();spawn();close();page.keyboard.press('j');page.locator('[data-rpg="open"][data-id="characters"]').first.click();old=ev('localStorage.getItem(RealmCore.KEY)')
    with page.expect_file_chooser() as fc:page.locator('[data-rpg="chars-import"]').click()
    fc.value.set_files(str(fixture));page.wait_for_selector('[data-rpg="chars-confirm-import"]');page.locator('[data-rpg="chars-confirm-import"]').click();page.wait_for_function('()=>Realm.diagnostics.characters.active==="character-2"');render();initial=state()
    check(variant+' migration retains earned history and empty new ownership',stable(initial)==stable(source) and initial['retreat']==source['retreat'] and initial['sandbox']['inventory']==source['sandbox']['inventory'] and initial['homeHistory']==ev('RealmHomeHistory.fresh()') and ev('localStorage.getItem(RealmCore.KEY)')==old)
    check(variant+' imported camera profiles retained before deliberate reset',initial['settings']['cameraMode']==source['settings']['cameraMode'] and initial['settings']['cameraFov']==source['settings']['cameraFov'] and initial['settings']['cameraViews']==source['settings']['cameraViews'])
    # Retained imported profiles are checked above. A fresh command journey has
    # no camera profile yet; explicit R deliberately establishes its first one.
    close();page.keyboard.press('r');render();room();before=state();page.locator('[data-action="memory-pin"][data-id="memory-bellglass"]').click();render();check(variant+' deliberate independent home pin',state()['homeHistory']['pinned']=='memory-bellglass' and state()['adventure']['pursuit']==before['adventure']['pursuit']);restart('pinned design','context-only')
    room();text=page.locator('.home-memories').inner_text();check(variant+' declared finite costs and all four designs visible',all(t in text for t in ['Make a place for the journey'.upper(),'DESIGN LEARNED','cost 2','cost 1','nothing auto-places']))
    for definition in ev('RealmHomeHistory.definitions.filter(d=>d.source!=="bridgeCommunity")'):
     kind=definition['id'];room()
     for material,n in definition['cost'].items():
      if state()['sandbox']['inventory'][material]<n:
       page.locator('[data-action="memory-gather"][data-id="'+material+'"]').first.click();r=ev('''([k,n])=>{let ticks=0;while(Realm.state.sandbox.inventory[k]<n&&ticks++<500){Realm.test.step(.5);Realm.test.render();}return{ok:Realm.state.sandbox.inventory[k]>=n,ticks};}''',[material,n]);check(variant+' visible gathering supplies '+material,r['ok'],r);room()
     page.locator('[data-action="memory-bench"]').click();r=ev('''()=>{let ticks=0;while(Realm.test.path.length&&ticks++<500)Realm.test.step(.2);Realm.test.render();return{ok:RealmSandbox.station(Realm.state.sandbox,Realm.diagnostics.adventure.player)&&!Realm.diagnostics.adventure.room,ticks};}''');check(variant+' visible workbench route '+kind,r['ok'],r);room();before=state();stored=raw()
     if kind=='memory-bellglass':
      quota(True);page.locator('[data-action="memory-craft"][data-id="'+kind+'"]').click();render();check(variant+' refused native craft is atomic',state()==before and raw()==stored and 'labelled home quota refusal' in page.locator('#toast').inner_text());quota(False)
     page.locator('[data-action="memory-craft"][data-id="'+kind+'"]').click();render();after=state();check(variant+' exact finite cost and no auto placement '+kind,kind in after['homeHistory']['owned'] and after['retreat']==before['retreat'] and after['adventure']==before['adventure'] and all(after['sandbox']['inventory'][k]==before['sandbox']['inventory'][k]-n for k,n in definition['cost'].items()))
     result=ev('kind=>Realm.test.homeCommand("craft",{kind,expectedRevision:Realm.state.homeHistory.revision,request:"different"})',kind);check(variant+' duplicate new request spends nothing '+kind,result.get('duplicate') and state()==after);restart(kind+' made', 'context-only' if kind=='memory-refuge' else 'awaited-page-close')
    # Capture the real art owner on the next retreat build, without grants.
    ev('''()=>{const p=RealmArt.WorldArt.prototype,make=p.makeRetreat;p.makeRetreat=function(...args){window.__homeArt=this;return make.apply(this,args);};}''')
    walk(37,0);page.keyboard.press('e');render();check(variant+' real retreat entry',ev('Realm.diagnostics.scene')=='retreat')
    for i,kind in enumerate([d['id'] for d in ev('RealmHomeHistory.definitions.filter(d=>d.source!=="bridgeCommunity")')]):
     room();slot=['n','sw','se','w'][i];page.locator('[data-action="slot"][data-id="'+slot+'"]').click();page.locator('[data-action="memory-propose"][data-id="'+kind+'"]').click();check(variant+' deliberate preview names replacement '+kind,'Confirm this arrangement' in page.locator('.home-placement-confirm').inner_text() and (i!=3 or 'Reading sofa' in page.locator('.home-placement-confirm').inner_text()));before=state();stored=raw()
     if i==0:
      quota(True);page.locator('[data-action="memory-place"]').click();render();check(variant+' refused native placement keeps exact world and bytes',state()==before and raw()==stored);quota(False)
     page.locator('[data-action="memory-place"]').click();render();check(variant+' explicit place owns one copy '+kind,len([i for i in state()['retreat']['items'] if i['kind']==kind])==1 and state()['sandbox']['inventory']==before['sandbox']['inventory'])
    visible_models('follow');visible_models('adventure');room();page.locator('[data-action="slot"][data-id="sw"]').click();page.locator('[data-action="remove-furniture"]').click();render();removed=state();check(variant+' removal retains finite ownership',len(removed['homeHistory']['owned'])==4 and not any(i['kind']=='memory-refuge' for i in removed['retreat']['items']));stored=raw();quota(True);page.locator('[data-action="layout-undo"]').click();render();check(variant+' native undo refusal keeps layout and bytes',state()==removed and raw()==stored);quota(False);page.locator('[data-action="layout-undo"]').click();render();check(variant+' undo restores the actual owned piece',any(i['kind']=='memory-refuge' for i in state()['retreat']['items']));page.locator('[data-action="layout-redo"]').click();render();check(variant+' redo removes it without material refund',state()['retreat']['items']==removed['retreat']['items'] and state()['sandbox']['inventory']==removed['sandbox']['inventory']);page.locator('[data-action="layout-undo"]').click();render()
    restart('placed room and history','awaited-page-close');check(variant+' all four pieces and old key survive',len(state()['homeHistory']['owned'])==4 and len([i for i in state()['retreat']['items'] if i['kind'].startswith('memory-')])==4 and ev('localStorage.getItem(RealmCore.KEY)')==old and stable(state())==stable(initial));record['final_world']=state();context.close();context=None
 check('no runtime errors',not report['browser_errors']);check('identical HTML and source identities throughout test',sha(ROOT/'index.html')==report['html_sha256'] and sha(ROOT/'FIRSTLIGHT_VALLEY.html')==report['html_sha256'] and all(sha(ROOT/p)==h for p,h in report['sources'].items()));report['status']='passed'
except Exception:
 report['status']='failed';report['errors'].append(traceback.format_exc());print(report['errors'][-1])
 try:page.screenshot(path=str(OUT/'FAILURE.png'));report['last_ui']=page.locator('body').inner_text()
 except Exception:pass
finally:
 if context:
  try:context.close()
  except Exception as e:report['errors'].append(str(e))
 server.shutdown();server.server_close()
 # Preserve hashes/revision/world receipts, without repetitive raw library text.
 for record in report['variants'].values():
  for row in record.get('lifecycle',[]):
   if row.get('raw'):row['receipt']=receipt(row.pop('raw'))
 report['passed']=sum(c['passed'] for c in report['checks']);report['failed']=sum(not c['passed'] for c in report['checks']);(OUT/'REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':report['status'],'passed':report['passed'],'failed':report['failed'],'output':str(OUT)},indent=2));raise SystemExit(0 if report['status']=='passed' else 1)
