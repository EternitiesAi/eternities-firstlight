"""Four local-life commissions through actual native UI and whole-browser restarts.

Fresh blade, fresh bow and a command-earned strongest returning character first
earn the existing northern prerequisites through production movement/combat.
They import through the real character manager into isolated loopback profiles.
Visible buttons own accept/assembly/work/payment; production walking/swimming
uses explicitly accelerated ticks. This is software WebGL integration evidence,
not normal-time footage, human pacing, personal saves or hardware performance.
One-frame appearance ablations preserve state/camera/collision and restore the
actual renderer batches. No progress, position, inventory or damage is injected.
"""
from pathlib import Path
from contextlib import ExitStack
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import argparse,base64,hashlib,json,os,subprocess,sys,tempfile,threading,traceback,urllib.request
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--variant',choices=['fresh-blade','fresh-bow','returning-strongest']);args=parser.parse_args()
ROOT=Path(os.environ.get('FIRSTLIGHT_TEST_ROOT',Path(__file__).resolve().parents[1])).resolve()
OUT=Path(os.environ.get('FIRSTLIGHT_LOCAL_LIFE_OUTPUT',ROOT/'evidence10/local-life-browser')).resolve()
OUT.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
report={'method':__doc__,'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'html_sha256':sha(ROOT/'index.html'),'sources':{str(p.relative_to(ROOT)):sha(p) for p in sorted((ROOT/'src').glob('*')) if p.is_file()},'harness_sha256':sha(Path(__file__)),'scope':'all-three-earned-characters' if args.variant is None else 'focused-'+args.variant,'appearance_framing':'Inspect from the physical completion site; Cosmos walks its clear working floor to face the board. Select each camera in visible UI, then explicit R reset. Imported saved profiles are checked before that deliberate action; arbitrary orbit visibility is not promised.','checks':[],'browser_errors':[],'errors':[],'variants':{}}
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/index.html'
context=None;page=None
def check(name,ok,evidence=None):
 row={'name':name,'passed':bool(ok)}
 if evidence is not None:row['evidence']=evidence
 report['checks'].append(row);print(('PASS ' if ok else 'FAIL ')+name,flush=True)
 if not ok:raise AssertionError(name)
def ev(js,arg=None):return page.evaluate(js,arg)
def state():return ev('Realm.state')
def diag():return ev('Realm.diagnostics')
def render():ev('Realm.test.render()')
def close():
 if page.locator('#rpg-window').evaluate('e=>e.open'):page.locator('#rpg-close').click()
 if page.locator('#drawer').evaluate('e=>e.classList.contains("open")'):page.locator('#close-panel').click()
def workspace(tab):
 close();page.keyboard.press('j');page.locator('#rpg-tabs [data-rpg="open"][data-id="'+tab+'"]').click();render()
def local(realm):
 workspace('journal');page.locator('[data-rpg="civic-open"][data-id="'+realm+'"]').first.click();render()
def shot(label):render();page.screenshot(path=str(OUT/(variant+'-'+label+'.png')))
def preserved(s):
 return {**{k:s[k] for k in ['realmTrails','journeys','earthExpedition','notes','score','scoreRevision','retreat','visitor','flowers']},'gear':{k:s['adventure'][k] for k in ['owned','equipment','arsenal','companion','realmCraft','earthBinding','starter','pursuit','classPath','road','beacon','crossing','earthStory','earthNotes','earthGathering','defeated','drops','reward']}}
def economic(s):return {'wallet':{k:s['adventure'][k] for k in ['xp','coins','ore']},'inventory':s['sandbox']['inventory']}
def walk(x,z,label):
 close();r=ev('''([x,z])=>{const r=Realm.test.move(x,z);if(!r.ok)return r;let frames=0;while(Realm.test.path.length&&frames++<18000){Realm.test.step(.05);if(Realm.state.adventure.hp<=0)return{ok:false,error:'Traveler died'};}Realm.test.render();const p=Realm.diagnostics.adventure.player;return{ok:Math.hypot(p.x-x,p.z-z)<.3,frames,player:p};}''',[x,z])
 check(variant+' production walk '+label,r.get('ok'),r);record['walks'].append({'label':label,**r})
def walk_button(id,target,label):
 local(definition['realm']);page.locator('[data-rpg="civic-walk"][data-id="'+id+'"]').first.click()
 r=ev('''p=>{let frames=0;while(Realm.test.path.length&&frames++<18000)Realm.test.step(.05);Realm.test.render();const q=Realm.diagnostics.adventure.player;return{ok:Math.hypot(q.x-p.x,q.z-p.z)<=2.8&&Realm.state.adventure.hp>0,frames,player:q};}''',target)
 check(variant+' visible local route '+label,r['ok'],r);record['walks'].append({'label':label,**r})
def swim(target):
 close();r=ev('''t=>{const sim=Realm.test.worldContext().sim,d=RealmWorldFoundations.definition(sim.room).dive;let frames=0;while(frames++<2400){const p=sim.state.player,y=RealmWorldFoundations.playerHeight(sim),dx=t[0]-p.x,dz=t[2]-p.z,dy=t[1]-y,dist=Math.hypot(dx,dz);if(dist<.015&&Math.abs(dy)<.015)break;const dt=dist>.005?Math.min(.05,dist/2.6):Math.min(.05,Math.abs(dy)/2.6),step=dt*2.6;Realm.test.worldSwim(dist>.005?dx:0,dist>.005?dz:0,step?dy/step:0,dt);if(!RealmWorldFoundations.swimClear(d,sim.state.player.x,RealmWorldFoundations.playerHeight(sim),sim.state.player.z))return{ok:false,error:'Body collision'};}Realm.test.render();return{ok:frames<2400,frames,status:Realm.test.worldDiveStatus()};}''',target)
 check(variant+' actual full-body swim '+str(target),r['ok'],r);record['swims'].append({'target':target,**r})
def arm():
 ev('''()=>{const proto=RealmArt.WorldArt.prototype,commit=proto.commit;proto.commit=function(...args){const r=commit.apply(this,args);if(RealmWorldFoundations.definition(this.room)){window.__localArtOwner=this;proto.commit=commit;}return r;};}''')
def enter(realm):
 if diag()['scene']=='valley' and not ev('RealmWorldFoundations.atRoad(Realm.test.worldContext().sim)'):walk(18,6,'Roads of Light')
 arm();workspace('worlds')
 if page.locator('[data-rpg="world-list"]').count():page.locator('[data-rpg="world-list"]').click()
 page.locator('[data-rpg="world-select"][data-id="'+realm+'"]').click();page.locator('[data-rpg="world-preview"]').click();page.locator('[data-rpg="world-confirm"]').click();render()
 check(variant+' visible checkpoint crossing '+realm,diag()['scene']==('cosmos-near-expanse' if realm=='cosmos' else 'world-'+realm))
def home():
 close()
 if diag()['scene']!='valley':page.locator('#world-home').click();render()
 check(variant+' free return keeps home checkpoint',diag()['scene']=='valley')
def legacy_cosmos():
 walk(14,-5,'original Cosmos invitation');checkpoint=diag()['adventure']['player'];arm();workspace('atlas');page.locator('[data-rpg="cosmos-invitation"]').click();page.locator('[data-rpg="cosmos-confirm"]').click();render()
 check('legacy Cosmos visit retains its unaccepted presentation',diag()['scene']=='cosmos-near-expanse' and page.locator('#cosmos-home').is_visible() and not page.locator('#world-home').is_visible())
 return checkpoint
def stored():return ev('''()=>{const r=RealmCharacters.validate(JSON.parse(localStorage.getItem(RealmCharacters.KEY)));return r.slots.find(s=>s.id===r.active).world;}''')
def restart(label):
 global context,page
 close();before=state();save=stored();check(variant+' durable local work before '+label,save['localLife']==before['localLife'] and preserved(save)==preserved(before) and economic(save)==economic(before))
 raw=ev('localStorage.getItem(RealmCharacters.KEY)');record.setdefault('checkpoints',{})[label]={'before':before,'stored':save,'storage_sha256':hashlib.sha256(raw.encode()).hexdigest(),'library_revision':json.loads(raw)['revision']}
 with page.expect_event('close'):page.close(run_before_unload=True)
 context.close();context=start();page=spawn();after=state();record['checkpoints'][label]['after']=after
 check(variant+' whole Chromium restart '+label,diag()['scene']=='valley' and after['localLife']==before['localLife'] and preserved(after)==preserved(before) and economic(after)==economic(before) and after['settings']['cameraViews']==before['settings']['cameraViews'],{'ledger':after['localLife']==before['localLife'],'prior_systems':preserved(after)==preserved(before),'economic':economic(after)==economic(before),'characters':diag()['characters']})
 record['restarts'].append(label)
def parts():return ev('''()=>{const e=__localArtOwner.e;return e.dynamic.flatMap(b=>b.items.filter(i=>i.localLifeQuest).map(i=>({kind:b.kind,...i})));}''')
def pixels(label,quest):
 close();render()
 data=ev('''quest=>{const e=__localArtOwner.e,sim=Realm.test.worldContext().sim,selected=i=>i.localLifeQuest===quest&&!i.localLifePart.includes('ring')&&!i.localLifePart.startsWith('carried-'),saved=e.dynamic.map(b=>({b,items:b.items,data:b.data,count:b.count})),sig=()=>JSON.stringify({state:Realm.state,player:sim.state.player,dive:sim.worldDive,camera:e.camera,vp:Array.from(e.vp),solids:e.cameraSolids}),before=sig(),args=[sim.elapsed,sim.state.hour,sim.state.weather==='rain'];
 const read=()=>{const g=e.gl,a=new Uint8Array(e.mainF.w*e.mainF.h*4);g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);g.readPixels(0,0,e.mainF.w,e.mainF.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;},png=a=>{const c=document.createElement('canvas');c.width=e.mainF.w;c.height=e.mainF.h;const g=c.getContext('2d'),im=g.createImageData(c.width,c.height);for(let y=0;y<c.height;y++)im.data.set(a.subarray((c.height-1-y)*c.width*4,(c.height-y)*c.width*4),y*c.width*4);g.putImageData(im,0,0);return c.toDataURL('image/png');};
 let removed=0;try{e.render(...args);const baseline=read();for(const{b}of saved){const a=b.items.filter(i=>!selected(i));removed+=b.items.length-a.length;if(a.length!==b.items.length){b.items=a;e.updateBatch(b);}}e.render(...args);const absent=read();for(const{b,items,data}of saved){b.items=items;b.data=data;e.updateBatch(b);}e.render(...args);const restored=read();for(const{b}of saved)if(b.items.some(selected)){b.items=b.items.filter(i=>!selected(i)).concat(__localPriorParts[b.kind]||[]);e.updateBatch(b);}e.render(...args);const prior=read();for(const{b,items,data}of saved){b.items=items;b.data=data;e.updateBatch(b);}e.render(...args);const finalRestored=read();let changed=0,priorChanged=0,restoration=0;for(let i=0;i<baseline.length;i+=4){let n=0;for(let k=0;k<3;k++){n+=Math.abs(baseline[i+k]-absent[i+k]);restoration+=Math.abs(baseline[i+k]-restored[i+k])+Math.abs(baseline[i+k]-finalRestored[i+k]);}if(n>6)changed++;let np=0;for(let k=0;k<3;k++)np+=Math.abs(baseline[i+k]-prior[i+k]);if(np>6)priorChanged++;}return{priorChangedPixels:priorChanged,removed,changedPixels:changed,restorationRGBDelta:restoration,unchanged:before===sig(),batchesRestored:saved.every(({b,items,data,count})=>b.items===items&&b.data===data&&b.count===count),glError:e.gl.getError(),camera:e.camera,baselinePNG:png(baseline),absentPNG:png(absent),priorPNG:png(prior)};}finally{for(const{b,items,data}of saved){b.items=items;b.data=data;e.updateBatch(b);}}}''',quest)
 for key in ['baselinePNG','absentPNG','priorPNG']:(OUT/(variant+'-'+label+'-'+key+'.png')).write_bytes(base64.b64decode(data.pop(key).split(',')[1]))
 check(variant+' '+label+' installed work contributes actual pixels',data['removed']>0 and data['changedPixels']>0,data)
 check(variant+' '+label+' completed change differs from actual earlier submitted work at the same camera and frame',data['priorChangedPixels']>0,data)
 check(variant+' '+label+' ablation exactly restores state camera collision batches and pixels',data['unchanged'] and data['batchesRestored'] and data['restorationRGBDelta']==0 and data['glError']==0,data)
 record['pixel_checks'].append({'label':label,**data});shot(label)
def assembly(step):
 local(definition['realm']);before=state()
 if step.get('assembly'):
  wrong=next(o for o in step['assembly']['options'] if o['id']!=step['assembly']['correct']);page.locator('[data-rpg="civic-step"][data-id="'+step['id']+':'+wrong['id']+'"]').click();render()
  check(variant+' wrong visible assembly refuses without mutation '+step['id'],state()==before)
  id=step['id']+':'+step['assembly']['correct']
 else:id=step['id']
 if step['id']=='fit-filter' and variant=='fresh-blade':
  ev('''()=>{window.__localSaveWrites=0;window.__localOriginalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===RealmCharacters.KEY){__localSaveWrites++;throw new DOMException('Labelled synthetic quota refusal','QuotaExceededError');}return __localOriginalSet.call(this,k,v);};}''')
  try:page.locator('[data-rpg="civic-step"][data-id="'+id+'"]').click();render();check('native refused save preserves completed work and money',ev('__localSaveWrites>0') and state()==before)
  finally:ev('()=>{Storage.prototype.setItem=__localOriginalSet;}')
 page.locator('[data-rpg="civic-step"][data-id="'+id+'"]').click();render();after=state()
 check(variant+' visible physical work '+step['id'],step['id'] in after['localLife']['records'][definition['id']]['steps'] and after['sandbox']['inventory']==before['sandbox']['inventory'] and preserved(after)==preserved(before))

try:
 with urllib.request.urlopen(url,timeout=10) as response:check('loopback server returns the exact regenerated HTML before launching Chromium',hashlib.sha256(response.read()).hexdigest()==report['html_sha256'])
 with sync_playwright() as pw:
  for variant,flags in [('fresh-blade',[]),('fresh-bow',['--bow']),('returning-strongest',['--veteran'])]:
   if args.variant and variant!=args.variant:continue
   with (OUT/(variant+'-seed.log')).open('wb') as log:subprocess.run(['node','tests/local_life_journey.cjs','--seed-only','--output',str(OUT/'earned-seeds'),*flags],cwd=ROOT,stdout=log,stderr=subprocess.STDOUT,check=True,timeout=360)
   seed=OUT/'earned-seeds'/variant/'00_EARNED_REGIONAL_HISTORY.json';source=json.loads(seed.read_text(encoding='utf-8'));source.pop('localLife')
   fixture=OUT/(variant+'-earned-before-localLife.json');fixture.write_text(json.dumps(source,indent=2)+'\n',encoding='utf-8')
   record={'seed_sha256':sha(seed),'import_sha256':sha(fixture),'migration_label':'Only optional localLife is omitted from earned history; no progress or resources changed.','walks':[],'swims':[],'restarts':[],'pixel_checks':[]};report['variants'][variant]=record
   with ExitStack() as cleanup:
    profile=cleanup.enter_context(tempfile.TemporaryDirectory(prefix='local-life-native-',dir=OUT))
    def release():
     global context
     if context:
      try:
       if page and (sys.exc_info()[0] is not None or report['checks'] and not report['checks'][-1]['passed']):
        try:page.screenshot(path=str(OUT/'FAILURE.png'));report['last_ui']={'url':page.url,'text':page.locator('body').inner_text(),'ready':ev('document.readyState'),'diagnostics':diag(),'state':state()}
        except Exception as e:report['errors'].append('Failure inspection: '+str(e))
      finally:context.close();context=None
    cleanup.callback(release)
    def start():return pw.chromium.launch_persistent_context(profile,**chromium_launch_kwargs(),viewport={'width':1280,'height':800})
    def spawn():
     global page
     record.setdefault('startup_pages',[]).append([p.url for p in context.pages]);p=context.pages[0] if context.pages else context.new_page();page=p
     for other in context.pages:
      if other!=p:other.close()
     p.bring_to_front();p.on('pageerror',lambda e:report['browser_errors'].append(str(e)));p.on('requestfailed',lambda r:report.setdefault('network_failures',[]).append({'url':r.url,'failure':r.failure}));p.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;window.__localStartupKey=localStorage.getItem("eternities.realm10.characters.v1");');print(variant+' navigating owned browser page',flush=True)
     r=p.goto(url,wait_until='load',timeout=60000);p.wait_for_function('()=>!!window.Realm',polling=100);check(variant+' served identical generated HTML',hashlib.sha256(r.body()).hexdigest()==report['html_sha256']);raw=p.evaluate('__localStartupKey');loaded=json.loads(raw) if raw else None;record.setdefault('startup_libraries',[]).append({'sha256':hashlib.sha256(raw.encode()).hexdigest() if raw else None,'revision':loaded['revision'] if loaded else None,'active':loaded['active'] if loaded else None,'localLife':next(s['world'].get('localLife') for s in loaded['slots'] if s['id']==loaded['active']) if loaded else None,'profile':profile,'origin':url});p.evaluate("Realm.test.quality('low');Realm.test.render()");return p
    context=start();page=spawn();workspace('characters');old_key=ev('localStorage.getItem(RealmCore.KEY)')
    with page.expect_file_chooser() as chooser:page.locator('[data-rpg="chars-import"]').click()
    chooser.value.set_files(str(fixture));page.wait_for_selector('[data-rpg="chars-confirm-import"]');page.locator('[data-rpg="chars-confirm-import"]').click();page.wait_for_function('()=>Realm.diagnostics.characters.active==="character-2"',polling=100);render();initial=state()
    check(variant+' native migration retains real earned history wallet inventory and old browser key',preserved(initial)==preserved(source) and economic(initial)==economic(source) and initial['localLife']==ev('RealmLocalLife.fresh()') and ev('localStorage.getItem(RealmCore.KEY)')==old_key)
    check(variant+' migrated camera preferences retained before deliberate reset',initial['settings']['cameraMode']==source['settings']['cameraMode'] and initial['settings']['cameraFov']==source['settings']['cameraFov'] and initial['settings']['cameraViews']==source['settings']['cameraViews'])
    for definition in ev('RealmLocalLife.definitions'):
     realm=definition['realm'];qid=definition['id'];choice=definition['choices'][0 if variant=='fresh-blade' else 1]
     checkpoint=legacy_cosmos() if realm=='cosmos' and variant=='fresh-blade' else None
     if checkpoint is None:enter(realm)
     local(realm);before=state();text=page.locator('#rpg-content').inner_text()
     check(variant+' declared terms '+realm,all(t in text for t in ['Route and danger','Exact once-only payment',str(definition['reward']['xp'])+' XP',choice['name'],'inventory is unchanged']) and state()==before)
     shot(realm+'-terms');walk_button('giver',definition['giver'],definition['giver']['name']);local(realm)
     page.locator('[data-rpg="civic-accept"][data-id="'+choice['id']+'"]').click();render();check(variant+' explicit arrangement '+realm,state()['localLife']['records'][qid]['choice']==choice['id'] and preserved(state())==preserved(before))
     if checkpoint:
      close();render();check('accepted local work takes over legacy Cosmos presentation and single return control',page.locator('#world-home').is_visible() and not page.locator('#cosmos-home').is_visible() and page.locator('#cosmos-labels span').count()==0 and page.locator('body').evaluate('e=>e.classList.contains("in-world-foundation")'))
      workspace('atlas');check('legacy entry now exposes the actual local-work route legend',page.locator('.local-life-map-key').count()==1 and page.locator('[data-local-marker]').count()>0);home();p=diag()['adventure']['player'];check('adopted legacy return keeps original valley checkpoint',abs(p['x']-checkpoint['x'])<.01 and abs(p['z']-checkpoint['z'])<.01);enter(realm)
     restart(realm+' accepted');enter(realm)
     for index,original in enumerate(definition['steps']):
      step=ev('([id,step,choice])=>RealmLocalLife.stepSite(RealmLocalLife.definition(id),step,choice)',[qid,original,choice['id']])
      if realm=='atlantis' and step['medium']=='water':
       walk(8,-16,'Tide Steps');close();page.keyboard.press('e');page.locator('[data-rpg="world-dive"]').click();render();check(variant+' native gallery entry is actual body transfer',diag()['world']['dive'] is not None)
       swim([8,-.5,-19.5]);swim([8,step['y'],-22])
      elif realm=='atlantis' and step['medium']=='court':
       for p in [[8,-1.8,-26],[8,-2.7,-29.5],[8,-2.7,-32],[step['x'],step['y'],step['z']]]:swim(p)
      else:walk_button(step['id'],step,step['name'])
      if index==len(definition['steps'])-1:ev('id=>{const e=__localArtOwner.e;window.__localPriorParts=Object.fromEntries(e.dynamic.map(b=>[b.kind,structuredClone(b.items.filter(i=>i.localLifeQuest===id&&!i.localLifePart.includes("ring")&&!i.localLifePart.startsWith("carried-")))]));}',qid)
      assembly(step)
      if definition.get('carry',{}).get('after')==step['id']:check(variant+' actual carried supplied part '+realm,any(p.get('carriedSupply') for p in parts()))
      if index==0:
       restart(realm+' partial work');enter(realm)
      if index==len(definition['steps'])-1:
       if realm=='cosmos':
        walk(-6,8.3,'Farroad supported approach');walk(-6,6.5,'face the fitted board from its clear working floor')
       for view in ['adventure','follow']:
        close();page.locator('[data-rpg="camera"][data-id="'+view+'"]').click();page.keyboard.press('r');render();check(variant+' explicit reset selects '+view+' projection '+realm,diag()['camera']['projection']==('perspective' if view=='adventure' else 'orthographic'));pixels(realm+'-installed-'+view,qid)
     if realm=='atlantis':
      local(realm);check(variant+' diving completion explains exit instead of dry walk',page.locator('[data-rpg="civic-walk"]').count()==0 and 'far dry gallery landing' in page.locator('#rpg-content').inner_text())
      workspace('atlas');check(variant+' diving atlas explains actual exit',page.locator('.local-life-map-key [data-rpg="civic-walk"]').count()==0 and 'far dry gallery landing' in page.locator('.local-life-map-key').inner_text())
      for p in [[8,-2.7,-32],[8,-2.7,-29.5],[8,-1.8,-29],[12,-1.8,-29],[12,-1.4,-39.3]]:swim(p)
      close();page.keyboard.press('e');render();check(variant+' actual dry landing exit',diag()['world']['dive'] is None)
     restart(realm+' completed unpaid');enter(realm);receiver=definition.get('returner',definition['giver']);walk_button('return',receiver,'payment receiver');local(realm);before=state()
     if realm=='atlantis' and variant=='fresh-blade':
      durable=ev('localStorage.getItem(RealmCharacters.KEY)');ev('''()=>{window.__localSaveWrites=0;window.__localOriginalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===RealmCharacters.KEY){__localSaveWrites++;throw new DOMException('Labelled synthetic claim quota refusal','QuotaExceededError');}return __localOriginalSet.call(this,k,v);};}''')
      try:page.locator('[data-rpg="civic-claim"]').click();render();check('native refused claim preserves ready unpaid work wallet inventory and durable bytes',ev('__localSaveWrites>0') and state()==before and ev('localStorage.getItem(RealmCharacters.KEY)')==durable)
      finally:ev('()=>{Storage.prototype.setItem=__localOriginalSet;}')
     page.locator('[data-rpg="civic-claim"]').click();render();after=state();reward=definition['reward']
     check(variant+' exact whole once-only payment '+realm,after['localLife']['records'][qid]['claimed'] and all(after['adventure'][k]-before['adventure'][k]==reward[k] for k in ['xp','coins','ore']) and all(after['sandbox']['inventory'][k]-before['sandbox']['inventory'][k]==n for k,n in reward.get('materials',{}).items()) and preserved(after)==preserved(before))
     dup=ev('id=>Realm.test.localLifeCommand("claim",{quest:id,request:"new-request"})',qid);check(variant+' changed request cannot repay '+realm,dup.get('duplicate') and state()==after);shot(realm+'-paid');restart(realm+' paid');check(variant+' old browser key still untouched '+realm,ev('localStorage.getItem(RealmCore.KEY)')==old_key)
     enter(realm);before=state();durable=ev('localStorage.getItem(RealmCharacters.KEY)');dup=ev('id=>Realm.test.localLifeCommand("claim",{quest:id,request:"after-full-browser-restart"})',qid);check(variant+' cold duplicate changes neither live nor durable bytes '+realm,dup.get('duplicate') and state()==before and ev('localStorage.getItem(RealmCharacters.KEY)')==durable);home()
    final=state();record['final_world']=final;check(variant+' preserves campaign XP curve gear sockets and all prior history',preserved(final)==preserved(initial) and all(final['adventure'][k]-initial['adventure'][k]==n for k,n in {'xp':92,'coins':33,'ore':2}.items()) and all(final['sandbox']['inventory'][k]-initial['sandbox']['inventory'][k]==n for k,n in {'wood':4,'fiber':5,'crystal':1}.items()))
    check(variant+' no runtime errors',not diag()['errors'] and not report['browser_errors']);context.close();context=None
 check('HTML and all runtime sources unchanged throughout native qualification',sha(ROOT/'index.html')==report['html_sha256'] and sha(ROOT/'FIRSTLIGHT_VALLEY.html')==report['html_sha256'] and all(sha(ROOT/p)==h for p,h in report['sources'].items()));report['status']='passed'
except Exception:
 report['status']='failed';report['errors'].append(traceback.format_exc());print(report['errors'][-1])
 try:page.screenshot(path=str(OUT/'FAILURE.png'));report['last_ui']=page.locator('body').inner_text()
 except Exception:pass
finally:
 if context:
  try:context.close()
  except Exception as e:report['errors'].append('Cleanup: '+str(e))
 server.shutdown();server.server_close();report['passed']=sum(c['passed'] for c in report['checks']);report['failed']=sum(not c['passed'] for c in report['checks']);(OUT/'REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':report['status'],'passed':report['passed'],'failed':report['failed'],'out':str(OUT)},indent=2));raise SystemExit(0 if report['status']=='passed' else 1)
