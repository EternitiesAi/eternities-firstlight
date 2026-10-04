"""Visible expedition UI and whole-Chromium restart on isolated native storage.
Starting saves are freshly command-earned. Production movement/combat runs with
labelled accelerated ticks in software WebGL; no human/GPU/normal-time claim.
"""
from pathlib import Path
from contextlib import ExitStack
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
import hashlib,json,math,os,subprocess,tempfile,threading,traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs
ROOT=Path(os.environ.get('FIRSTLIGHT_TEST_ROOT',Path(__file__).resolve().parents[1])).resolve()
OUT=Path(os.environ.get('FIRSTLIGHT_EXPEDITION_OUTPUT',ROOT/'evidence10/earth-expedition-browser')).resolve();OUT.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
report={'method':__doc__,'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'html_sha256':sha(ROOT/'index.html'),'sources_sha256':{str(p.relative_to(ROOT)):sha(p) for p in sorted((ROOT/'src').glob('*')) if p.is_file()},'harness_sha256':sha(Path(__file__)),'checks':[],'browser_errors':[],'variants':{},'errors':[]}
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/'
context=None;serial=0

def check(name,ok,evidence=None):
 row={'name':name,'passed':bool(ok)}
 if evidence is not None:row['evidence']=evidence
 report['checks'].append(row);print(('PASS ' if ok else 'FAIL ')+name,flush=True)
 if not ok:
  try:page.screenshot(path=str(OUT/'FAILURE.png'))
  except Exception:pass
  raise AssertionError(name)
def ev(js,arg=None):return page.evaluate(js,arg)
def state():return ev('Realm.state')
def diag():return ev('Realm.diagnostics')
def render():ev('Realm.test.render()')
def close():
 if page.locator('#rpg-window').evaluate('e=>e.open'):page.locator('#rpg-close').click()
 if page.locator('#drawer').evaluate('e=>e.classList.contains("open")'):page.locator('#close-panel').click()
def workspace(tab):
 close();page.keyboard.press('j');page.locator('#rpg-tabs [data-rpg="open"][data-id="'+tab+'"]').click();render()
def shot(label):render();page.screenshot(path=str(OUT/(variant+'-'+label+'.png')))
def walk(x,z,label):
 close();r=ev('''([x,z])=>{const r=Realm.test.move(x,z);if(!r.ok)return r;let frames=0;for(;frames<18000&&Realm.test.path.length;frames++){Realm.test.step(.05);if(Realm.state.adventure.hp<=0)return{ok:false,error:'Traveler died'};}Realm.test.render();const p=Realm.diagnostics.adventure.player;return{ok:Math.hypot(p.x-x,p.z-z)<.3,frames,player:p,hp:Realm.state.adventure.hp};}''',[x,z]);check(variant+' actual walk '+label,r.get('ok'),r);record['walks'].append({'label':label,**r})
def walk_button(id,target,label):
 workspace('expedition');page.locator('#rpg-content [data-rpg="expedition-walk"][data-id="'+id+'"]').first.click()
 r=ev('''p=>{let frames=0;for(;frames<18000&&Realm.test.path.length;frames++){Realm.test.step(.05);if(Realm.state.adventure.hp<=0)return{ok:false,error:'Traveler died'};}Realm.test.render();const q=Realm.diagnostics.adventure.player;return{ok:Math.hypot(q.x-p.x,q.z-p.z)<=2.8,frames,player:q,hp:Realm.state.adventure.hp};}''',target);check(variant+' visible route '+label,r.get('ok'),r);record['walks'].append({'label':label,**r})
def enter():
 if diag()['scene']=='valley' and not ev('RealmWorldFoundations.atRoad(Realm.test.worldContext().sim)'):walk(18,6,'Roads of Light')
 ev('''()=>{const p=RealmArt.WorldArt.prototype,commit=p.commit;p.commit=function(...a){const r=commit.apply(this,a);window.__encounterArt=this;return r;};}''');workspace('worlds')
 if page.locator('[data-rpg="world-list"]').count():page.locator('[data-rpg="world-list"]').click()
 page.locator('[data-rpg="world-select"][data-id="earthlands"]').click();page.locator('[data-rpg="world-preview"]').click();page.locator('[data-rpg="world-confirm"]').click();render();check(variant+' crosses through visible saved-checkpoint terms',diag()['scene']=='world-earthlands')
def home():
 close()
 if diag()['scene']=='valley':return
 page.locator('#world-home').click();render();check(variant+' free return keeps the home checkpoint',diag()['scene']=='valley')
def retained(s):return {k:s['adventure'][k] for k in ['equipment','owned','arsenal','pursuit','starter','realmCraft','classPath','companion','defeated','drops','earthStory','earthNotes','earthGathering','crossing','road','beacon','reward','relic','angelSeen']}
def ownership(s):return {**retained(s),**{k:s[k] for k in ['notes','score','scoreRevision','retreat','visitor','flowers','journeys','realmTrails']}}
def saved_world():return ev('''()=>{const r=RealmCharacters.validate(JSON.parse(localStorage.getItem(RealmCharacters.KEY)));return r.slots.find(s=>s.id===r.active).world;}''')
def restart(label):
 global context,page
 close();before=state();stored=saved_world();check(variant+' '+label+' durable before closing',stored['earthExpedition']==before['earthExpedition'] and stored['adventure']['earthBinding']==before['adventure']['earthBinding'] and ownership(stored)==ownership(before));context.close();context=start();page=spawn();after=state();check(variant+' whole Chromium restart retains '+label,diag()['scene']=='valley' and after['earthExpedition']==before['earthExpedition'] and after['adventure']['earthBinding']==before['adventure']['earthBinding'] and ownership(after)==ownership(before));record['restarts'].append(label);e=after['earthExpedition'];check(variant+' restored active tracker stays deliberate',not(e['story']['accepted'] and not e['story']['claimed'] or e['patrol']['active']) or 'Living Road' in page.locator('#tracked-title').inner_text())
def command(kind,payload=None):
 global serial
 serial+=1;r=ev('([id,t,p])=>Realm.test.adventure(id,t,p)',[f'expedition-browser-{variant}-{serial}',kind,payload or {}]);check(variant+' accepted production '+kind,r['ok'],r);return r

def fight(step,patrol_run=None):
 close();enemy=ev('([step,run])=>RealmEarthExpedition.enemies(Realm.test.worldContext().sim).find(e=>e.defeatStep===step&&e.expeditionRun===run)',[step['id'],patrol_run]);check(variant+' accepted phase owns actual enemy',enemy is not None)
 radius=4 if record['style']=='bow' else 1.1;walk(enemy['x'],enemy['z']+radius,enemy['id']+' approach');page.keyboard.press('Tab');render();check(variant+' Tab selects '+enemy['id'],diag()['adventure']['tactics']['target']==enemy['id'])
 windup=ev('''id=>{for(let i=0;i<500;i++){const sim=Realm.test.worldContext().sim,e=RealmAdventure.runtime(sim).enemies.find(e=>e.id===id);if(e?.mode==='windup'&&e.timer>.15)return{ok:true,timer:e.timer};if(!e||e.hp<=0)return{ok:false,error:'Actor resolved before tell'};Realm.test.step(.05);}return{ok:false};}''',enemy['id']);check(variant+' actual AI tell occurs',windup['ok'],windup);render();check(variant+' muted visible tell invites Brace or movement',page.locator('#target-cue').get_attribute('data-phase')=='windup' and ('Brace' in page.locator('#target-cue-detail').inner_text() or 'Braced' in page.locator('#target-cue-detail').inner_text()))
 if step['id']=='clear-root-pests' and patrol_run is None:
  check(variant+' actual threat names grounded bank sweep','Bank sweep' in page.locator('#target-cue-title').inner_text())
  for view,quiet in [('follow',False),('follow',True),('adventure',False),('adventure',True)]:
   ev('Realm.test.openPanel("settings")');page.locator('[data-setting="reducedMotion"]').set_checked(quiet);close();render()
   page.locator('#rpg-hud [data-rpg="camera"][data-id="'+view+'"]').click();page.keyboard.press('r');render()
   data=ev("""()=>{const sim=Realm.test.worldContext().sim,e=__encounterArt.e,groups=e.dynamic,saved=groups.map(b=>({b,items:b.items,data:b.data,count:b.count})),read=()=>{const g=e.gl,a=new Uint8Array(e.mainF.w*e.mainF.h*4);g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);g.readPixels(0,0,e.mainF.w,e.mainF.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;},args=[sim.elapsed,sim.state.hour,sim.state.weather==='rain'],before=JSON.stringify(sim.state);e.render(...args);const baseline=read();let parts=0;try{for(const q of saved){q.b.items=q.items.filter(i=>!i.bankSweepPart);parts+=q.items.length-q.b.items.length;e.updateBatch(q.b);}e.render(...args);const absent=read();for(const q of saved){q.b.items=q.items;q.b.data=q.data;e.updateBatch(q.b);q.b.count=q.count;}e.render(...args);const restored=read();let changed=0,delta=0;for(let i=0;i<baseline.length;i+=4){if(Math.max(...[0,1,2].map(k=>Math.abs(baseline[i+k]-absent[i+k])))>2)changed++;for(let k=0;k<3;k++)delta+=Math.abs(baseline[i+k]-restored[i+k]);}return{parts,changed,delta,stateUnchanged:before===JSON.stringify(sim.state),glError:e.gl.getError(),restored:saved.every(q=>q.b.items===q.items&&q.b.data===q.data&&q.b.count===q.count)};}finally{for(const q of saved){q.b.items=q.items;q.b.data=q.data;e.updateBatch(q.b);q.b.count=q.count;}}}""")
   check(variant+' real locked-lane pixels '+view+(' reduced' if quiet else ' normal'),data['parts']==(10 if quiet else 11) and data['changed']>10 and data['delta']==0 and data['stateUnchanged'] and data['glError']==0 and data['restored'],data);shot('sweep-'+view+('-reduced' if quiet else ''))
  ev('Realm.test.openPanel("settings")');page.locator('[data-setting="reducedMotion"]').uncheck();close();render()
  escape=ev("""id=>{const sim=Realm.test.worldContext().sim,e=RealmAdventure.runtime(sim).enemies.find(e=>e.id===id),f={...e.strike},hp=sim.state.adventure.hp,history=JSON.stringify(sim.state.earthExpedition);for(let i=0;i<11;i++){sim.manual(Math.cos(f.yaw),-Math.sin(f.yaw),.05);Realm.test.step(.05);}const outside=!RealmEarthExpedition.strikeContains(e,sim.state.player);for(let i=0;i<35&&e.mode==='windup';i++)Realm.test.step(.05);Realm.test.render();return{outside,unchangedFrame:JSON.stringify(f)===JSON.stringify(e.strike),mode:e.mode,hpBefore:hp,hpAfter:sim.state.adventure.hp,historyUnchanged:history===JSON.stringify(sim.state.earthExpedition),player:{...sim.state.player}};}""",enemy['id'])
  check(variant+' actual supported lateral movement avoids committed contact',escape['outside'] and escape['unchangedFrame'] and escape['mode']=='recover' and escape['hpBefore']==escape['hpAfter'] and escape['historyUnchanged'],escape)
  next_tell=ev("""id=>{const sim=Realm.test.worldContext().sim;for(let i=0;i<500;i++){const e=RealmAdventure.runtime(sim).enemies.find(e=>e.id===id);if(e?.mode==='windup'&&e.timer>.5)return true;if(!e||e.hp<=0)return false;Realm.test.step(.05);}return false;}""",enemy['id']);render();check(variant+' second real tell remains available for Brace',next_tell)
 before=state();page.locator('#skill-guard').click();render();check(variant+' visible Brace arms mitigation',diag()['adventure']['tactics']['guardUntil']>before['adventure']['elapsed']);shot('tell-'+str(patrol_run)+'-'+step['id']);page.locator('#skill-auto').click();render();check(variant+' visible autoattack enables stationary intent',diag()['adventure']['tactics']['auto'])
 outcome=ev('''([step,id,run])=>{const sim=Realm.test.worldContext().sim,old=RealmCombat.hit,packets=[],phases=new Set();let frames=0,guards=0,arrows=false;RealmCombat.hit=(s,e,n)=>{if(s===sim&&e.id===id)packets.push({n,at:s.state.adventure.elapsed,hp:e.hp});return old(s,e,n);};try{while(frames++<3000){const ledger=sim.state.earthExpedition,steps=run===null?ledger.story.steps:ledger.patrol.active?.steps;if(steps?.includes(step))break;const e=RealmAdventure.runtime(sim).enemies.find(e=>e.id===id),a=sim.state.adventure,t=RealmCombat.runtime(sim);if(!e||a.hp<=0)return{ok:false,error:'Fight lost actor or traveler',frames};phases.add(e.mode);if(e.mode==='windup'&&a.stamina>=20&&a.elapsed>=t.cooldowns.guard){if(Realm.test.adventure('field-guard-'+id+'-'+frames,'guard').ok)guards++;}const w=RealmArsenal.weapon(a),r=w.style==='bow'?4:1.1;if(Math.hypot(sim.state.player.x-e.x,sim.state.player.z-e.z)>=w.reach-.2&&!Realm.test.path.length){let move=Realm.test.move(e.x,e.z+r);if(!move.ok)return{ok:false,error:move.error};}Realm.test.step(.05);arrows ||= RealmArsenal.runtime(sim).arrows.length>0;}return{ok:frames<3000,frames,guards,arrows,packets,phases:[...phases],hp:sim.state.adventure.hp};}finally{RealmCombat.hit=old;}}''',[step['id'],enemy['id'],patrol_run]);render();check(variant+' real impacts record accepted defeat',outcome['ok'] and outcome['packets'] and outcome['hp']>0,outcome);check(variant+' quest combat grants no legacy loot',all(state()['adventure'][k]==before['adventure'][k] for k in ['xp','coins','ore','drops','defeated']));
 if record['style']=='bow':check(variant+' bow launches actual projectiles',outcome['arrows'])
 if step['id']=='clear-root-pests':
  projection=ev('''()=>{const sim=Realm.test.worldContext().sim,p=RealmEarthExpeditionArt.parts(sim.state.earthExpedition);return{staged:p.filter(p=>p.opt.expeditionPart==='staged-brace-timber').length,tag:p.find(p=>p.opt.expeditionPart==='patrol-clear-tag')?.opt.patrolRun??null,installed:p.filter(p=>p.opt.expeditionPart==='installed-brace').length};}''')
  check(variant+' saved defeat has correct finite/repeat worksite consequence',projection['staged']==(2 if patrol_run is None else 0) and projection['tag']==patrol_run and projection['installed']==(0 if patrol_run is None else 1),projection)
 record['combats'].append({'id':enemy['id'],**outcome});command('target-clear');close()
def objective(step,run=None):
 walk_button(step['id'],step,step['name'])
 if step['kind']=='defeat':fight(step,run);return
 page.keyboard.press('e');render();action='patrol-step' if run else 'step';page.locator('[data-rpg="expedition-'+action+'"][data-id="'+step['id']+'"]').click();render();steps=state()['earthExpedition']['patrol']['active']['steps'] if run else state()['earthExpedition']['story']['steps'];check(variant+' visible field action '+step['id'],step['id'] in steps);close()

try:
 for flags in [[],['--bow'],['--veteran']]:subprocess.run(['node','tests/earth_expedition_journey.cjs',*flags,'--output',str(OUT/'earned')],cwd=ROOT,check=True,capture_output=True,timeout=180)
 with sync_playwright() as pw:
  for variant in ['fresh-blade','fresh-bow','veteran']:
   fixture=OUT/'earned'/variant/'00_COMMAND_EARNED_SOURCE.json';source=json.loads(fixture.read_text(encoding='utf-8'));record={'source':{'path':str(fixture),'sha256':sha(fixture),'label':'Freshly command-earned production source'},'style':'bow' if variant=='fresh-bow' else 'blade','walks':[],'combats':[],'restarts':[]};report['variants'][variant]=record
   profiles=OUT/'profiles';profiles.mkdir(exist_ok=True)
   with tempfile.TemporaryDirectory(prefix=variant+'-',dir=profiles) as profile,ExitStack() as cleanup:
    def release():
     global context
     if context:
      if report.get('status')!='passed':
       try:
        report['last_ui']={'variant':variant,'text':page.locator('body').inner_text(),'diagnostics':diag()};page.screenshot(path=str(OUT/'LAST_FRAME.png'))
       except Exception as e:report['errors'].append('Failure inspection: '+str(e))
      context.close();context=None
    cleanup.callback(release)
    def start():return pw.chromium.launch_persistent_context(profile,**chromium_launch_kwargs(),accept_downloads=True,viewport={'width':1440,'height':960})
    def spawn():
     p=context.new_page();p.on('pageerror',lambda e:report['browser_errors'].append(str(e)));p.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;');response=p.goto(url,wait_until='load');p.wait_for_function('()=>!!window.Realm');check(variant+' exact assembled HTML loads',sha(ROOT/'index.html')==hashlib.sha256(response.body()).hexdigest());p.evaluate("Realm.test.quality('low');Realm.test.render()");return p
    context=start();page=spawn();workspace('characters');old_key=ev('localStorage.getItem(RealmCore.KEY)');
    with page.expect_file_chooser() as chooser:page.locator('[data-rpg="chars-import"]').click()
    chooser.value.set_files(str(fixture));page.wait_for_selector('[data-rpg="chars-confirm-import"]');page.locator('[data-rpg="chars-confirm-import"]').click();page.wait_for_function('()=>Realm.diagnostics.characters.active==="character-2"');render();check(variant+' native import adds separate complete earned character',diag()['characters']['count']==2 and ownership(state())==ownership(source) and ev('localStorage.getItem(RealmCore.KEY)')==old_key);initial=state();enter();workspace('expedition');text=page.locator('#rpg-content').inner_text();check(variant+' terms expose route danger rewards choices and binding cost',all(t in text for t in ['wetland footbridge','64 health / 9 damage', '136 health / 11 damage', '2.6 m', '3.1 m','45 XP','18 sunmarks','3 ore','8 timber','8 fibre','+2 attack','6 fibre']));check(variant+' reading never accepts or spends',not state()['earthExpedition']['story']['accepted'] and state()['adventure']['coins']==initial['adventure']['coins']);shot('terms')
    giver=ev('RealmEarthExpedition.definition.giver');walk_button('giver',giver,'Rill');page.keyboard.press('e');page.locator('[data-rpg="expedition-accept"]').click();render();check(variant+' explicit acceptance preserves campaign and equipment',state()['earthExpedition']['story']['accepted'] and ownership(state())==ownership(initial));accepted=state()['earthExpedition'];workspace('characters');page.locator('[data-rpg="chars-switch"][data-id="character-1"]').click();page.wait_for_function('()=>Realm.diagnostics.characters.active==="character-1"');workspace('characters');page.locator('[data-rpg="chars-switch"][data-id="character-2"]').click();page.wait_for_function('()=>Realm.diagnostics.characters.active==="character-2"');render();check(variant+' switching restores the living-road tracker',state()['earthExpedition']==accepted and 'Living Road' in page.locator('#tracked-title').inner_text());restart('accepted expedition');page.locator('.tracker-switch [data-id="story"]').click();render();check(variant+' player can switch back to Story',not page.locator('#tracked-chapter').inner_text().startswith('ELDERWEALD'));page.locator('.tracker-switch [data-id="expedition"]').click();render();check(variant+' Living road button restores deliberate tracking','Living Road' in page.locator('#tracked-title').inner_text());enter();definition=ev('RealmEarthExpedition.definition');patrol=ev('RealmEarthExpedition.patrol')
    objective(definition['steps'][0]);branch='managed-coppice' if variant=='fresh-bow' else 'stormfall-recovery';choice=next(c for c in definition['steps'][1]['choices'] if c['id']==branch);walk_button(branch,choice,'material preparation');page.keyboard.press('e');page.locator('[data-rpg="expedition-step"][data-choice="'+branch+'"]').click();render();check(variant+' deliberate allocation persists',state()['earthExpedition']['story']['branch']==branch);restart('chosen supply and partial work');enter()
    for step in definition['steps'][2:]:objective(step)
    restart('objectives complete and unpaid');enter();walk_button('giver',giver,'story return');page.keyboard.press('e');before=state();page.locator('[data-rpg="expedition-claim"]').click();render();after=state();check(variant+' visible claim pays exact story currency',all(after['adventure'][k]-before['adventure'][k]==n for k,n in {'xp':45,'coins':18,'ore':3}.items()) and after['earthExpedition']['story']['claimed']);check(variant+' reward keeps equipment and sockets',retained(after)==retained(before));shot('story-paid');close();page.keyboard.press('e');check(variant+' giver recognizes completion','The living road remembers' in page.locator('#rpg-content').inner_text());close();restart('claimed story payment');enter()
    for run in [1,2]:
     walk_button('giver',giver,'patrol acceptance');page.keyboard.press('e');page.locator('[data-rpg="expedition-patrol-accept"]').click();render();check(variant+' new patrol owns run '+str(run),state()['earthExpedition']['patrol']['active']['run']==run);close()
     for step in patrol['steps']:objective(step,run)
     walk_button('giver',giver,'patrol return');page.keyboard.press('e');before=state();page.locator('[data-rpg="expedition-patrol-claim"]').click();render();after=state();check(variant+' patrol '+str(run)+' pays exact package',all(after['adventure'][k]-before['adventure'][k]==n for k,n in {'xp':5,'coins':4,'ore':3}.items()) and all(after['sandbox']['inventory'][k]-before['sandbox']['inventory'][k]==2 for k in ['wood','fiber']) and after['earthExpedition']['patrol']['lastClaim']==run);close();duplicate=ev('p=>Realm.test.expeditionCommand("patrol-claim",p)',{'quest':patrol['id'],'run':run,'priorClaim':run-1,'request':'different-ui-request'});check(variant+' changed request cannot duplicate payment',duplicate.get('duplicate') and state()==after)
    restart('two independently paid patrols');walk(11,9,'home workbench');workspace('craft');weapon=state()['adventure']['equipment']['weapon'];kind='shelter' if variant=='fresh-bow' else 'edge';before=state();stats=diag()['adventure']['stats'];page.locator('[data-rpg="expedition-binding-preview"][data-id="'+weapon+'"][data-kind="'+kind+'"]').click();render();check(variant+' binding preview compares without spending',all(t in page.locator('.expedition-binding-preview').inner_text() for t in ['Equipped now','Selected weapon','After binding','current XP','socket']) and state()==before);shot('binding-preview');page.locator('[data-rpg="expedition-binding-confirm"]').click();render();after=state();newstats=diag()['adventure']['stats'];check(variant+' binding costs are exact without healing or autoequip',after['adventure']['ore']==before['adventure']['ore']-3 and after['adventure']['coins']==before['adventure']['coins']-8 and after['sandbox']['inventory']['fiber']==before['sandbox']['inventory']['fiber']-6 and after['adventure']['hp']==before['adventure']['hp'] and ownership(after)==ownership(before));check(variant+' finite bound stats are correct',newstats['attack']-stats['attack']==(0 if kind=='shelter' else 2) and newstats['defense']-stats['defense']==(1 if kind=='shelter' else 0) and newstats['maxHP']-stats['maxHP']==(10 if kind=='shelter' else 0));close();restart('finite binding applied');check(variant+' binding cannot be spent twice',not ev('p=>Realm.test.earthBinding(p.weapon,p.kind)',{'weapon':weapon,'kind':kind})['ok']);enter();walk_button('giver',giver,'new unpaid patrol');page.keyboard.press('e');page.locator('[data-rpg="expedition-patrol-accept"]').click();render();check(variant+' next intentional run is three',state()['earthExpedition']['patrol']['active']['run']==3);stale=state();ev('''()=>{document.querySelector('#rpg-content').insertAdjacentHTML('beforeend','<button id="stale-patrol-contract" data-rpg="expedition-patrol-accept" data-run="2" data-prior-claim="1">Old invitation</button>')}''');page.locator('#stale-patrol-contract').click();render();check(variant+' stale rendered contract cannot change later run',state()==stale);close();objective(patrol['steps'][0],3);fight(patrol['steps'][1],3);record['binding']={'weapon':weapon,'kind':kind,'stats_before':stats,'stats_after':newstats}
    for view in ['adventure','follow']:
     close();page.locator('[data-rpg="camera"][data-id="'+view+'"]').click();render();check(variant+' retains '+view+' camera',diag()['camera']['projection']==('perspective' if view=='adventure' else 'orthographic'));shot('bound-'+view)
    home();restart('bound weapon and unpaid third patrol');final=state();check(variant+' all original systems and story history remain',ownership(final)==ownership(initial));record['final_world']=final;check(variant+' no runtime error',not diag()['errors'] and not report['browser_errors']);context.close();context=None
 check('checked-in HTML stayed identical throughout native journey',sha(ROOT/'index.html')==report['html_sha256'] and sha(ROOT/'FIRSTLIGHT_VALLEY.html')==report['html_sha256']);check('all runtime sources stayed identical throughout native journey',all(sha(ROOT/p)==h for p,h in report['sources_sha256'].items()));report['status']='passed'
except Exception:
 report['status']='failed';report['errors'].append(traceback.format_exc());print(report['errors'][-1])
finally:
 if context:
  try:context.close()
  except Exception as e:report['errors'].append('Cleanup: '+str(e))
 server.shutdown();server.server_close();report['passed']=sum(c['passed'] for c in report['checks']);report['failed']=sum(not c['passed'] for c in report['checks']);(OUT/'REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':report['status'],'passed':report['passed'],'failed':report['failed'],'out':str(OUT)},indent=2));raise SystemExit(0 if report['status']=='passed' else 1)
