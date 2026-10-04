"""Earned community work through native UI, full browser restarts and actual pixels.

Command-earned kit / campaign seeds are imported as separate characters. UI
owns crossing, acceptance, allocation, work, payment and home craft. Production
movement is accelerated explicitly. Capacity/quota are labelled synthetic
refusal boundaries restored before the legitimate route continues. No progress,
gear or materials are granted. Software WebGL is not human/GPU qualification.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
import hashlib,json,os,subprocess,tempfile,threading,traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs
ROOT=Path(os.environ.get('FIRSTLIGHT_TEST_ROOT',Path(__file__).resolve().parents[1])).resolve()
OUT=Path(os.environ.get('FIRSTLIGHT_BRIDGE_COMMUNITY_OUTPUT',ROOT/'evidence10/bridge-community-browser')).resolve();OUT.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
report={'method':__doc__,'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'html_sha256':sha(ROOT/'index.html'),'harness_sha256':sha(Path(__file__)),'sources':{str(p.relative_to(ROOT)):sha(p) for p in sorted((ROOT/'src').glob('*')) if p.is_file()},'checks':[],'variants':{},'browser_errors':[],'errors':[]}
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/index.html'
context=None;page=None
def check(name,ok,data=None):
 report['checks'].append({'name':name,'passed':bool(ok),'evidence':data});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
 if not ok:raise AssertionError(name)
def ev(js,arg=None):return page.evaluate(js,arg)
def state():return ev('Realm.state')
def render():ev('Realm.test.render()')
def raw():return ev('localStorage.getItem(RealmCharacters.KEY)')
def preserved(s):
 a={k:v for k,v in s['adventure'].items() if k not in ['elapsed','hp','stamina','lumen','revision','coins']}
 return {'adventure':a,**{k:s[k] for k in ['localLife','realmTrails','journeys','earthExpedition','notes','score','scoreRevision','visitor','flowers']}}
def close():
 if page.locator('#rpg-window').evaluate('e=>e.open'):page.locator('#rpg-close').click()
 if page.locator('#drawer').evaluate('e=>e.classList.contains("open")'):page.locator('#close-panel').click()
def workspace(tab):
 close();page.keyboard.press('j');page.locator('#rpg-tabs [data-rpg="open"][data-id="'+tab+'"]').click();render()
def community():
 workspace('journal');page.locator('[data-rpg="community-open"]').first.click();render()
def room():close();ev('Realm.test.openPanel("retreat")');render()
def walk(x,z):
 close();r=ev('''([x,z])=>{const r=Realm.test.move(x,z);if(!r.ok)return r;let n=0;while(Realm.test.path.length&&n++<7000)Realm.test.step(.2);Realm.test.render();let p=Realm.diagnostics.adventure.player;return{ok:n<7000&&Math.hypot(p.x-x,p.z-z)<.3&&Realm.state.adventure.hp>0,n,p};}''',[x,z]);check(variant+' supported walking '+str((x,z)),r['ok'],r)
def entry():
 if ev('Realm.diagnostics.scene')!='valley':close();page.locator('#world-home').click()
 walk(18,6);ev('''()=>{const p=RealmArt.WorldArt.prototype,commit=p.commit;p.commit=function(...a){let r=commit.apply(this,a);window.__communityArt=this;return r;};}''');workspace('worlds')
 if page.locator('[data-rpg="world-list"]').count():page.locator('[data-rpg="world-list"]').click()
 page.locator('[data-rpg="world-select"][data-id="earthlands"]').click();page.locator('[data-rpg="world-preview"]').click();page.locator('[data-rpg="world-confirm"]').click();render();check(variant+' deliberate checkpoint crossing',ev('Realm.diagnostics.scene')=='world-earthlands')
def settlement():
 for x,z in [(0,16),(14,-34),(4,-41),(-6,-68)]:walk(x,z)
def site():
 if choice=='shelter':settlement();walk(-9,-63.5)
 else:
  for x,z in [(0,16),(14,-19),(30,-20)]:walk(x,z)
def click(action,id=None):
 community();selector='[data-rpg="community-'+action+'"]'+('[data-id="'+id+'"]' if id else '');page.locator(selector).first.click();render()
def quota(on):
 if on:ev('''()=>{window.__communitySet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===RealmCharacters.KEY)throw Error('labelled community quota refusal');return __communitySet.call(this,k,v);};}''')
 else:ev('()=>{Storage.prototype.setItem=__communitySet;}')
def spawn():
 global page
 page=context.pages[0] if context.pages else context.new_page();page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
 page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;window.__communityStartup=localStorage.getItem("eternities.realm10.characters.v1");')
 response=page.goto(url,wait_until='load');page.wait_for_function('()=>!!window.Realm');check(variant+' exact standalone HTML',hashlib.sha256(response.body()).hexdigest()==report['html_sha256']);ev('Realm.test.quality("low")');render()
 page.on('console',lambda m:record.setdefault('writes',[]).append(json.loads(m.text[13:])) if m.text.startswith('__BC_WRITE__ ') else None)
 ev('''()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){const r=set.call(this,k,v);if(k===RealmCharacters.KEY)console.debug('__BC_WRITE__ '+JSON.stringify(v));return r;};}''')
def restart(label):
 global context
 close();before=state();stored=json.loads(raw());slot=next(s for s in stored['slots'] if s['id']==stored['active'])['world'];check(variant+' production storage before '+label,slot['bridgeCommunity']==before['bridgeCommunity'] and slot['homeHistory']==before['homeHistory'] and slot['sandbox']['inventory']==before['sandbox']['inventory'])
 prior=raw()
 with page.expect_event('close'):page.close(run_before_unload=True)
 latest=record.get('writes',[])[-1] if record.get('writes') else prior;context.close();context=start();spawn();startup=ev('__communityStartup');after=state()
 check(variant+' exact latest successful native write at raw startup '+label,startup==latest,{'expected':hashlib.sha256(latest.encode()).hexdigest(),'startup':hashlib.sha256(startup.encode()).hexdigest() if startup else None})
 check(variant+' loaded full durable checkpoint '+label,after['bridgeCommunity']==before['bridgeCommunity'] and after['homeHistory']==before['homeHistory'] and after['retreat']==before['retreat'] and after['sandbox']['inventory']==before['sandbox']['inventory'] and preserved(after)==preserved(before) and after['settings']['cameraViews']==before['settings']['cameraViews'])
 record.setdefault('restarts',[]).append({'label':label,'method':'whole Chromium, awaited page close','sha256':hashlib.sha256(startup.encode()).hexdigest()})
def pixels(view,home=False):
 close();page.locator('[data-rpg="camera"][data-id="'+({'third-person':'adventure','diorama':'follow'}[view])+'"]').click();page.keyboard.press('r');render()
 data=ev('''home=>{const e=__communityArt.e,sim=Realm.test.worldContext().sim,groups=home?e.batches:e.dynamic,saved=groups.map(b=>({b,items:b.items,data:b.data,count:b.count})),sig=()=>JSON.stringify({s:Realm.state,c:e.camera,v:Array.from(e.vp),p:sim.state.player}),before=sig(),read=()=>{const g=e.gl,a=new Uint8Array(e.mainF.w*e.mainF.h*4);g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);g.readPixels(0,0,e.mainF.w,e.mainF.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;},args=[sim.elapsed,sim.state.hour,sim.state.weather==='rain'];e.render(...args);const baseline=read(),selected=i=>home?i.homeMemoryKind==='memory-crossing':!!i.communityPart;let parts=0;try{for(const q of saved){q.b.items=q.items.filter(i=>!selected(i));parts+=q.items.length-q.b.items.length;e.updateBatch(q.b);}e.render(...args);const absent=read();for(const q of saved){q.b.items=q.items;q.b.data=q.data;e.updateBatch(q.b);q.b.count=q.count;}e.render(...args);const restored=read();let changed=0,delta=0;for(let i=0;i<baseline.length;i+=4){if(Math.max(...[0,1,2].map(k=>Math.abs(baseline[i+k]-absent[i+k])))>2)changed++;for(let k=0;k<3;k++)delta+=Math.abs(baseline[i+k]-restored[i+k]);}return{parts,changedPixels:changed,restorationRGBDelta:delta,invariants:before===sig(),glError:e.gl.getError(),batchesRestored:saved.every(q=>q.b.items===q.items&&q.b.data===q.data&&q.b.count===q.count)};}finally{for(const q of saved){q.b.items=q.items;q.b.data=q.data;e.updateBatch(q.b);q.b.count=q.count;}}}''',home)
 check(variant+' requested shoulder distance remains usable '+('home' if home else choice),view!='third-person' or home or ev('Realm.diagnostics.camera.actualDistance/Realm.diagnostics.camera.distance')>.8,ev('Realm.diagnostics.camera'));check(variant+' actual '+('home board' if home else choice)+' pixels '+view,data['parts']>8 and data['changedPixels']>10 and data['restorationRGBDelta']==0 and data['invariants'] and data['glError']==0 and data['batchesRestored'],data);page.screenshot(path=str(OUT/(variant+('-home-' if home else '-fixture-')+view+'.png')))
try:
 with sync_playwright() as pw:
  for variant,choice,flags in [('fresh-blade','shelter',[]),('fresh-bow','river-lookout',['--bow']),('returning-strongest','shelter',['--veteran'])]:
   record={};report['variants'][variant]=record
   r=subprocess.run(['node','tests/bridge_community_journey.cjs','--seed-only','--output',str(OUT/'seeds'),*flags],cwd=ROOT,capture_output=True,text=True);check(variant+' command-earned seed',r.returncode==0,r.stdout+r.stderr)
   seed=OUT/'seeds'/variant/'00_EARNED_SEED.json';source=json.loads(seed.read_text());source.pop('bridgeCommunity',None);fixture=OUT/(variant+'-old-world.json');fixture.write_text(json.dumps(source));record['seed_sha256']=sha(fixture)
   profile=tempfile.mkdtemp(prefix='bridge-community-native-',dir=OUT)
   def start():return pw.chromium.launch_persistent_context(profile,**chromium_launch_kwargs(),viewport={'width':1280,'height':800})
   context=start();spawn();workspace('characters');old=ev('localStorage.getItem(RealmCore.KEY)')
   with page.expect_file_chooser() as chooser:page.locator('[data-rpg="chars-import"]').click()
   chooser.value.set_files(str(fixture));page.locator('[data-rpg="chars-confirm-import"]').click();page.wait_for_function('()=>Realm.diagnostics.characters.active==="character-2"');render();initial=state()
   check(variant+' additive migration preserves old systems and old key',preserved(initial)==preserved(source) and initial['bridgeCommunity']==ev('RealmBridgeCommunity.fresh()') and initial['homeHistory']==source['homeHistory'] and ev('localStorage.getItem(RealmCore.KEY)')==old)
   entry();settlement();community();terms=page.locator('.community-page').inner_text();check(variant+' exact terms and both choices visible before consent',all(t in terms for t in ['10 sunmarks','2 timber','4 meadow fibre','No XP or ore','Sheltered sorting bench','River observation stand','No campaign chapter']))
   before=state();stored=raw();quota(True)
   try:page.locator('[data-rpg="community-accept"]').click();render();check(variant+' quota-refused acceptance is unchanged',state()==before and raw()==stored)
   finally:quota(False)
   click('accept');check(variant+' deliberate acceptance',state()['bridgeCommunity']['accepted']);restart('accepted');entry();settlement()
   for x,z in [(14,-34),(0,16),(0,96),(-7,97)]:walk(x,z)
   click('fittings');restart('carried fittings');entry();site();click('fit',choice+':crossed');check(variant+' wrong assembly retains carried state',state()['bridgeCommunity']['steps']==['fittings']);click('fit',choice+':matched');restart('fitted but uninspected');entry();site()
   close();ev('Realm.test.step(5)');render();pixels('third-person');pixels('diorama');click('inspect');restart('complete unpaid');entry();settlement();community();before=state();stored=raw();quota(True)
   try:page.locator('[data-rpg="community-claim"]').click();render();check(variant+' quota-refused whole fee is unchanged',state()==before and raw()==stored)
   finally:quota(False)
   # Capacity refusal uses one labelled temporary boundary; restore before fee.
   saved_coins=state()['adventure']['coins'];ev('Realm.test.worldContext().sim.state.adventure.coins=9999');community();boundary=state();stored=raw();page.locator('[data-rpg="community-claim"]').click();render();check(variant+' capacity-refused whole fee is unchanged',state()==boundary and raw()==stored);ev('n=>Realm.test.worldContext().sim.state.adventure.coins=n',saved_coins)
   click('claim');paid=state();check(variant+' declared fee and prior history retained',paid['bridgeCommunity']['claimed'] and paid['adventure']['coins']==initial['adventure']['coins']+10 and paid['sandbox']['inventory']['wood']==initial['sandbox']['inventory']['wood']+2 and paid['sandbox']['inventory']['fiber']==initial['sandbox']['inventory']['fiber']+4 and preserved(paid)==preserved(initial))
   before=state();stored=raw();r=ev('Realm.test.bridgeCommunityCommand("claim",{request:"new-id"})');check(variant+' new request ID cannot duplicate fee',r.get('duplicate') and state()==before and raw()==stored);restart('paid before crafting')
   walk(11,9);room();page.locator('[data-action="memory-pin"][data-id="memory-crossing"]').click();page.locator('[data-action="memory-craft"][data-id="memory-crossing"]').click();render();made=state();check(variant+' deliberate exact-cost home board',made['homeHistory']['owned']==initial['homeHistory']['owned']+['memory-crossing'] and made['sandbox']['inventory']['wood']==initial['sandbox']['inventory']['wood'] and made['sandbox']['inventory']['fiber']==initial['sandbox']['inventory']['fiber']+3 and not any(i['kind']=='memory-crossing' for i in made['retreat']['items']));restart('board crafted')
   ev('''()=>{const p=RealmArt.WorldArt.prototype,make=p.makeRetreat;p.makeRetreat=function(...a){window.__communityArt=this;return make.apply(this,a);};}''');walk(37,0);close();ev('Realm.test.enter("retreat")');render();room();page.locator('[data-action="slot"][data-id="w"]').click();page.locator('[data-action="memory-propose"][data-id="memory-crossing"]').click();page.locator('[data-action="memory-place"]').click();render();check(variant+' deliberate layout places exactly one board',sum(i['kind']=='memory-crossing' for i in state()['retreat']['items'])==1);pixels('third-person',True);pixels('diorama',True);restart('board placed');record['final_world']=state();context.close();context=None
 check('sources and both generated HTML remain identical',sha(ROOT/'index.html')==report['html_sha256'] and sha(ROOT/'FIRSTLIGHT_VALLEY.html')==report['html_sha256'] and all(sha(ROOT/p)==h for p,h in report['sources'].items()));check('no browser runtime errors',not report['browser_errors'],report['browser_errors']);report['status']='passed'
except Exception:
 report['status']='failed';report['errors'].append(traceback.format_exc());print(report['errors'][-1])
 if page:
  try:page.screenshot(path=str(OUT/'FAILURE.png'));report['last_state']=state();report['last_ui']=page.locator('body').inner_text()
  except Exception:pass
finally:
 if context:
  try:context.close()
  except Exception as e:report['cleanup_error']=str(e)
 server.shutdown();report['passed']=sum(r['passed'] for r in report['checks']);report['failed']=sum(not r['passed'] for r in report['checks']);(OUT/'BRIDGE_BROWSER_REPORT.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'status':report['status'],'passed':report['passed'],'failed':report['failed'],'out':str(OUT)},indent=2));raise SystemExit(0 if report['status']=='passed' else 1)
