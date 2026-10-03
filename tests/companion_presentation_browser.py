"""Briar's actual emitted rig on earned checkpoints and production travel/control paths.

Disposable native Chromium storage and loopback origin only. Software SwiftShader,
low graphics, and a controlled RAF scheduler call the real application frame with
real keyboard events. Existing production path stepping accelerates long roads.
No player/companion coordinates, bond, health, quests or inventory are written.
The historical completed fixture is Chapter I complete, not a Chapter IV claim.
Snapshots prove the actual draw caller, not a separately invoked presentation rig.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from contextlib import contextmanager
import hashlib, json, os, subprocess, tempfile, threading, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

ROOT=Path(os.environ.get('FIRSTLIGHT_TEST_ROOT',Path(__file__).resolve().parents[1])).resolve()
OUT=ROOT/'evidence10/companion-presentation-browser';OUT.mkdir(parents=True,exist_ok=True)
LEGACY='eternities.realm10.save.v9'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
fixtures={k:ROOT/'examples'/p for k,p in {'bonded':'CHAPTER_COMPLETED_EARNED.json','injured':'CHAPTER_START_EARNED.json'}.items()}
report={'method':__doc__,'root':str(ROOT),'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
 'html_sha256':sha(ROOT/'index.html'),'harness_sha256':sha(Path(__file__)),
 'sources':{p:sha(ROOT/p) for p in ['src/app.js','src/adventure.js','src/adventure-art.js','src/companion-art.js','src/core.js','src/earth.js','src/cosmos.js','src/world-foundations.js','src/characters.js']},
 'fixtures':{k:{'path':str(p.relative_to(ROOT)),'sha256':sha(p),'progression':'checked-in historical earned checkpoint; no invented bond or items'} for k,p in fixtures.items()},
 'checks':[],'errors':[],'browser_errors':[],'app_errors':[],'observations':{}}
if os.environ.get('FIRSTLIGHT_EXPECT_HEAD') and report['head']!=os.environ['FIRSTLIGHT_EXPECT_HEAD']:
 raise RuntimeError('Qualification checkout is not the requested source epoch.')
if os.environ.get('FIRSTLIGHT_EXPECT_HTML_SHA') and report['html_sha256']!=os.environ['FIRSTLIGHT_EXPECT_HTML_SHA']:
 raise RuntimeError('Qualification HTML is not the requested built artifact.')
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*a):pass
def check(name,ok):
 report['checks'].append({'name':name,'passed':bool(ok)});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
 if not ok:
  try:page.screenshot(path=str(OUT/'FAILURE.png'))
  except Exception:pass
  raise AssertionError(name)
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/index.html'
@contextmanager
def disposable_context(pw,prefix):
 with tempfile.TemporaryDirectory(prefix=prefix) as profile:
  context=pw.chromium.launch_persistent_context(profile,**chromium_launch_kwargs(),viewport={'width':1280,'height':800})
  try:yield context
  except Exception:
   try:
    page.screenshot(path=str(OUT/'FAILURE.png'))
    report['failure_context']=page.evaluate('()=>({state:Realm.state,diagnostics:Realm.diagnostics,companion:Realm.test.companion()})')
   except Exception:pass
   raise
  finally:context.close()
def ev(js,arg=None):return page.evaluate(js,arg)
def state():return ev('()=>Realm.state')
def diag():return ev('()=>Realm.diagnostics')
def snap():return ev('()=>Realm.test.companion()')
def render():ev('()=>Realm.test.render()')
def frames(n=1):
 return ev('n=>{for(let i=0;i<n;i++){window.__companionNow+=50;const f=window.__companionFrame;if(typeof f!=="function"||f.name!=="frame")throw Error("actual application frame missing");f(window.__companionNow)}return Realm.test.companion()}',n)
def attach(p,fixture):
 p.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
 # This intercepts scheduling only. Production frame owns keys/manual/tick/draw.
 p.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__companionNow=1000;const nativeRAF=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=function(f){if(f.name!=="frame")return nativeRAF(f);window.__companionFrame=f;return 1};')
 seed=fixtures[fixture].read_text(encoding='utf8')
 p.add_init_script(f'if(!localStorage.getItem({json.dumps(LEGACY)}))localStorage.setItem({json.dumps(LEGACY)},{json.dumps(seed)});')
 response=p.goto(url,wait_until='load');p.wait_for_function('()=>!!window.Realm',polling=100)
 check('served HTML matches the exact source-pinned integration artifact',hashlib.sha256(response.body()).hexdigest()==report['html_sha256'])
 check('actual app exposes only a read-only companion draw snapshot',p.evaluate('()=>typeof Realm.test.companion==="function"'))
 # Observe the real draw boundary without changing output, return, or authority.
 # The public snapshot contains rig parts; the injured cue is a separate marker.
 p.evaluate('()=>{const original=RealmAdventureArt.draw;RealmAdventureArt.draw=function(out,sim,t){const sizes=Object.fromEntries(Object.entries(out).map(([k,v])=>[k,v.length]));const result=original(out,sim,t);window.__companionEmission=Object.entries(out).flatMap(([kind,items])=>items.slice(sizes[kind]).filter(i=>i.companionPart||i.c===0xf1d3a3).map(i=>({kind,p:i.p.slice(),s:i.s.slice(),c:i.c,part:i.companionPart||null})));return result}}')
 p.evaluate('()=>{Realm.test.quality("low");Realm.test.render()}')
 return p
def close():
 if page.locator('#rpg-window').evaluate('(e)=>e.open'):page.locator('#rpg-close').click()
 if page.locator('#drawer').evaluate('(e)=>e.classList.contains("open")'):page.locator('#close-panel').click()
def key(k):page.keyboard.press(k);render()
def walk(x,z,settle=0):
 close();r=ev('([x,z])=>Realm.test.move(x,z)',[x,z]);check(f'actual production path accepts {x},{z}',r['ok'])
 result=ev('()=>{let n=0;for(;n<12000&&Realm.test.path.length;n++)Realm.test.step(.05);Realm.test.render();return{done:!Realm.test.path.length,hp:Realm.state.adventure.hp,steps:n}}')
 check(f'actual production path arrives alive at {x},{z}',result['done'] and result['hp']>0)
 if settle:frames(settle)
def companion_page():
 close();key('c');page.locator('#rpg-tabs [data-rpg="open"][data-id="companion"]').click();render()
control_receipts=[]
def mode(which):
 companion_page();before=state()['adventure']['receipts'];page.locator('[data-rpg="companion"][data-id="'+which+'"]').click();render()
 check('actual '+which+' control retains Briar and changes canonical mode',state()['adventure']['companion']=={'bonded':True,'name':'Briar','mode':which})
 after=state()['adventure']['receipts'];added=after[len(before):]
 check('actual '+which+' command retains prior receipts and records only its real terms',after[:len(before)]==before and len(added)==1 and json.loads(added[0]['fp'])==['companion-mode',{'mode':which}])
 control_receipts.extend(added)
 close();render()
def economic(s):
 a=s['adventure'];keys=['owned','equipment','reward','xp','ore','coins','arsenal','classPath','pursuit','starter','crossing','beacon','road','earthStory','defeated','drops','dug','chips']
 return {'sandbox':s['sandbox']['inventory'],'adventure':{k:a[k] for k in keys},'companion_bond':a['companion']['bonded'],'journeys':s['journeys'],'realmTrails':s['realmTrails']}
def label_anchor(label):
 frames(2)
 evidence=ev('()=>{const s=Realm.test.companion(),p=s.placement,e=[...document.querySelectorAll("#adventure-labels span")].find(e=>e.textContent.startsWith("Briar ·"));return{placement:p,expected:Realm.project(p.x,p.base+1.45,p.z),legacy:Realm.project(p.x,1.58+1.45,p.z),actual:e?{x:parseFloat(e.style.left),y:parseFloat(e.style.top),text:e.textContent}:null}}')
 report['observations'][label+' label']=evidence
 check(label+' actual DOM label follows the same physical support as the rig',evidence['actual'] is not None and evidence['expected']['visible'] and abs(evidence['actual']['x']-evidence['expected']['x'])<.5 and abs(evidence['actual']['y']-evidence['expected']['y'])<.5)
def placement(label,raised=False):
 s=snap();d=diag();expected=ev('()=>{const c=Realm.diagnostics.adventure.companion,room=Realm.test.worldContext().sim.room;return RealmWorldFoundations.handles(room)?RealmWorldFoundations.height(room,c.x,c.z):room===RealmEarth.ROOM?RealmEarth.height(c.x,c.z):room===RealmCosmos.ROOM?RealmCosmos.height(c.x,c.z):room?1.58:1.31}')
 report['observations'][label]={'scene':d['scene'],'runtime':d['adventure']['companion'],'snapshot':s,'physical_support':expected}
 check(label+' emits Briar only for the actual runtime scene owner',s is not None and d['adventure']['companion']['room']==ev('()=>Realm.test.worldContext().sim.room'))
 check(label+' roots the rig at the real physical support height',abs(s['placement']['base']-expected)<1e-9)
 check(label+' retains the bounded 33-part bonded rig',len(s['parts'])==33 and s['placement']['bonded'] and all(p['appearanceOnly'] and not p['cameraSolid'] and not p['cutaway'] for p in s['parts']))
 check(label+' grounds all four feet without embedding a paw',len([p for p in s['parts'] if p['companionPart'].endswith('-paw')])==4 and all(p['p'][1]-p['s'][1]/2>=expected-.001 for p in s['parts'] if p['companionPart'].endswith('-paw')))
 if raised:check(label+' actually reached raised terrain',expected>1.85)
 return s
def road(realm):
 close();key('j');page.locator('[data-rpg="world-list"]').first.click();page.locator('[data-rpg="world-select"][data-id="'+realm+'"]').click();page.locator('[data-rpg="world-preview"]').click();page.locator('[data-rpg="world-confirm"]').click();render()
 check('actual crossing enters '+realm,diag()['scene']==ev('id=>RealmWorldFoundations.definition(id).room',realm))
def world_home():
 close();page.locator('#world-home').click();render();check('actual realm return restores Firstlight',diag()['scene']=='valley')
def characters():
 close();key('c');page.locator('#rpg-tabs [data-rpg="open"][data-id="characters"]').click();render()

try:
 with sync_playwright() as pw:
  with disposable_context(pw,'firstlight-companion-earned-') as context:
   page=attach(context.new_page(),'bonded');frames();initial=state();baseline=economic(initial)
   check('earned Chapter I checkpoint legitimately starts bonded in follow mode',initial['adventure']['companion']=={'bonded':True,'name':'Briar','mode':'follow'} and initial['adventure']['reward']=='warden_stone')
   home=placement('Firstlight earned home');before=state()
   ev('()=>{const copy=Realm.test.companion();copy.placement.base=999;copy.motion.phase=999;copy.parts[0].p[1]=999}')
   check('read-only draw snapshot cannot change canonical state or caller cache',state()==before and snap()==home)
   walk(0,23);key('e');page.locator('[data-rpg="earth-confirm"]').click();render()
   check('actual Hearthwater marker crosses into physical country',diag()['scene']=='earth-hearthwater-approach')
   walk(13,-13);walk(12,-26,20);quarry=placement('Hearthwater quarry road',raised=True)
   page.screenshot(path=str(OUT/'hearthwater-briar.png'));label_anchor('Hearthwater raised ground')
   before=snap();r=ev('()=>Realm.test.move(14,-24)');check('short gait walk is accepted by production pathfinding',r['ok'])
   samples=[]
   for _ in range(16):samples.append(frames())
   moving=[s for s in samples if s and s['motion']['moving']]
   check('accepted companion displacement drives gait in the actual draw',bool(moving) and any(abs(s['motion']['phase']-before['motion']['phase'])>1e-5 for s in moving))
   check('walking paws articulate only while accepted movement supplies blend',any(s['pose']['blend']>.1 and any(l['foot'][1]>.06 for l in s['pose']['legs'].values()) for s in moving))
   walk(14,-24,70);idle=snap();later=frames(12)
   check('settled companion has no moving flag or new stride phase',not later['motion']['moving'] and abs(later['motion']['phase']-idle['motion']['phase'])<1e-8)
   blocked=ev('()=>Realm.test.move(11.7,-18)');unmoved=snap();refused=frames(8)
   check('solid quarry-stack path refuses actual movement intent',not blocked['ok'] and not ev('()=>Realm.test.path.length'))
   check('refused movement intent advances no companion stride or position',refused['placement']==unmoved['placement'] and not refused['motion']['moving'] and refused['motion']['phase']==unmoved['motion']['phase'])
   companion_page();paused=snap();pstate=state();path=ev('()=>Realm.test.path');page.keyboard.down('w');still=frames(20);page.keyboard.up('w')
   check('actual open dialog pauses world and ignores keyboard movement',diag()['adventure']['paused'] and state()==pstate and ev('()=>Realm.test.path')==path)
   check('paused draw preserves phase time and every posed part',still['motion']['phase']==paused['motion']['phase'] and still['motion']['time']==paused['motion']['time'] and still['pose']==paused['pose'] and still['parts']==paused['parts'])
   close();frames();check('closing actual dialog restores prior running policy',not diag()['adventure']['paused'])
   # Real keyboard movement, read-only samples. No call to sim.manual.
   p=diag()['adventure']['player'];page.keyboard.down('s');frames(18);page.keyboard.up('s');frames(10)
   check('actual S keyboard control moves the existing character',diag()['adventure']['player']!=p)
   check('actual follow runtime continues to own its physical scene',diag()['adventure']['companion']['room']=='earth-hearthwater-approach')
   mode('stay');waiting=snap();walk(13,-13,20);later=snap()
   check('Stay leaves actual companion position unchanged while the player walks',later['placement']['x']==waiting['placement']['x'] and later['placement']['z']==waiting['placement']['z'] and not later['motion']['moving'])
   page.locator('#earth-home').click();render()
   check('Stay in the old scene draws no fox in Firstlight',diag()['scene']=='valley' and diag()['adventure']['companion']['room']=='earth-hearthwater-approach' and snap() is None)
   mode('follow');placement('Recalled Firstlight follow')
   walk(14,-5);key('e');page.locator('[data-rpg="cosmos-confirm"]').click();render();check('actual observatory invitation enters Cosmos',diag()['scene']=='cosmos-near-expanse')
   walk(13,-6);walk(15,-30);walk(13,-34,30);placement('Cosmos raised road',raised=True);label_anchor('Cosmos raised ground')
   report['observations']['first_cosmos_camera']=diag()['camera'];page.screenshot(path=str(OUT/'cosmos-briar-first-view.png'))
   before=snap();canonical=diag()['adventure']['companion'];projection=diag()['camera']['projection'];key('v');perspective=placement('Cosmos opposite camera')
   check('V toggles a real projection without changing companion placement',diag()['camera']['projection']!=projection and perspective['placement']==before['placement'] and diag()['adventure']['companion']==canonical)
   report['observations']['second_cosmos_camera']=diag()['camera'];page.screenshot(path=str(OUT/'cosmos-briar-second-view.png'));key('v')
   page.locator('#settings').click();page.locator('#setting-reducedMotion').check();page.locator('#close-panel').click();frames(12);rm=snap()
   check('actual reduced-motion setting reaches companion pose and motion',state()['settings']['reducedMotion'] and rm['motion']['reducedMotion'] and rm['pose']['reducedMotion'])
   check('reduced motion removes body bob head idle ears and tail sway',rm['pose']['bob']==0 and rm['pose']['headPitch']==0 and rm['pose']['headYaw']==0 and rm['pose']['earAngles']==[0,0] and all(q[0]==0 for q in rm['pose']['tail']))
   ev('()=>Realm.test.move(13,-30)');samples=[frames() for _ in range(25)]
   check('reduced motion retains readable accepted walking gait',any(s['motion']['moving'] and s['pose']['blend']>.1 for s in samples))
   close();page.locator('#settings').click();page.locator('#setting-reducedMotion').uncheck();page.locator('#close-panel').click();render()
   page.locator('#cosmos-home').click();render();walk(18,6);road('earthlands');walk(0,88,20);placement('Coastward actual channel bridge')
   page.screenshot(path=str(OUT/'coastward-briar.png'));world_home();walk(18,6);road('atlantis');walk(0,28,20);placement('Atlantis dry safe quay')
   page.screenshot(path=str(OUT/'atlantis-briar.png'));world_home()
   check('optional travel and presentation grants no new economic or quest outcomes',economic(state())==baseline)
   check('only deliberate Follow Stay commands add their actual receipts',state()['adventure']['receipts']==initial['adventure']['receipts']+control_receipts)
   mode('stay');check('actual save keeps the legitimate bond and deliberate Stay mode',ev('()=>Realm.test.save()')['ok']);saved=state()['adventure']['companion'];characters()
   page.locator('#chars-name').fill('Briar separate character');page.locator('[data-rpg="chars-create"]').click();page.wait_for_function('()=>Realm.state.visitor.name==="Briar separate character"',polling=100);render()
   check('native new character has no inherited bond or rendered home companion',not state()['adventure']['companion']['bonded'] and snap() is None)
   characters();prior=page.locator('[data-rpg="chars-switch"]').get_attribute('data-id');page.locator('[data-rpg="chars-switch"]').click();page.wait_for_function('id=>Realm.diagnostics.characters.active===id',arg=prior,polling=100);render()
   restored=placement('Native original character restored')
   check('native switching retains canonical bonded Stay and earned belongings',state()['adventure']['companion']==saved and economic(state())==baseline)
   check('native switching starts a fresh runtime gait sample',restored['motion']['phase']==0 and restored['motion']['blend']==0 and not restored['motion']['moving'])
   close();page.reload(wait_until='load');page.wait_for_function('()=>!!window.Realm',polling=100);render();reopened=placement('Native saved character reopened')
   check('native reload retains active identity and canonical companion policy',diag()['characters']['active']==prior and state()['adventure']['companion']==saved and economic(state())==baseline)
   check('native reload resumes safe home with no obsolete gait phase',diag()['scene']=='valley' and reopened['motion']['phase']==0 and reopened['motion']['blend']==0)
   report['observations']['final_earned_state']=state()
   report['app_errors'].extend(diag()['errors'])
  with disposable_context(pw,'firstlight-companion-injured-') as context:
   page=attach(context.new_page(),'injured');check('earned starting checkpoint has no invented Briar bond',not state()['adventure']['companion']['bonded'])
   walk(0,-48);key('e');render();check('actual mine entry uses earned kit bridge and pickaxe',diag()['scene']=='mine')
   injured=snap();report['observations']['injured_mine']=injured
   check('actual injured mine caller retains the 30-part unbonded fox',injured is not None and not injured['placement']['bonded'] and len(injured['parts'])==30)
   check('injured pose retains a stable still silhouette',injured['pose']['bodyY']==.42 and injured['pose']['blend']==0 and injured['pose']['phase']==0)
   check('injured fox stays at its actual cave anchor and physical cave floor',injured['placement']==ev('()=>({x:RealmAdventure.FOX.x,z:RealmAdventure.FOX.z,base:1.58,yaw:Math.PI*.4,bonded:false})'))
   check('actual source retains a separate warm injured marker above the fox',"if(!bonded)add('octa',x,base+1.5,z,.17,.30,.17,0xf1d3a3,{em:.8})" in (ROOT/'src/adventure-art.js').read_text(encoding='utf8'))
   emitted=ev('()=>window.__companionEmission');report['observations']['injured_actual_emission']=emitted
   check('actual mine draw emits the separate warm injured marker unchanged',len([p for p in emitted if p['part'] is None and p['kind']=='octa' and p['p']==[-8,3.08,2] and p['s']==[.17,.30,.17] and p['c']==0xf1d3a3])==1 and len([p for p in emitted if p['part']])==30)
   key('v');page.screenshot(path=str(OUT/'injured-mine-marker.png'))
   report['app_errors'].extend(diag()['errors'])
 check('focused companion journeys produce no application page errors',not report['browser_errors'] and not report['app_errors'])
 report['passed']=True
except Exception as e:
 report['errors'].append(str(e));report['traceback']=traceback.format_exc();report['passed']=False
 try:page.screenshot(path=str(OUT/'FAILURE.png'))
 except Exception:pass
 raise
finally:
 (OUT/'REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8');server.shutdown()
