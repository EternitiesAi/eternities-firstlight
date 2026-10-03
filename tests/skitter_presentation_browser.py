"""Actual skitter submission, enemy timers and earned combat on disposable profiles.

Fresh kit and riverbank acceptance use real E/dialog controls. A checked-in earned
bow checkpoint supplies the returning character; no HP, coordinates, bond, items
or defeated flags are planted. Existing path stepping accelerates roads. The real
application frame, retained through a named-only RAF scheduler, owns keyboard,
AI, projectile collision, damage and draw. Software SwiftShader is not GPU proof.
A labelled one-frame appearance ablation verifies real framebuffer contribution;
it changes submitted art only and never simulation state or combat authority.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from contextlib import contextmanager
import hashlib, json, math, os, subprocess, tempfile, threading, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

ROOT=Path(os.environ.get('FIRSTLIGHT_TEST_ROOT',Path(__file__).resolve().parents[1])).resolve()
OUT=ROOT/'evidence10/skitter-presentation-browser';OUT.mkdir(parents=True,exist_ok=True)
LEGACY='eternities.realm10.save.v9';FIXTURE=ROOT/'examples/REALM09_BOW_CHAPTER_II_COMPLETE_EARNED.json'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
report={'method':__doc__,'root':str(ROOT),'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
 'html_sha256':sha(ROOT/'index.html'),'harness_sha256':sha(Path(__file__)),
 'source_sha256':{p:sha(ROOT/p) for p in ['src/app.js','src/adventure.js','src/adventure-art.js','src/skitter-art.js','src/combat.js','src/arsenal.js','src/starter.js','src/core.js']},
 'returning_fixture':{'path':str(FIXTURE.relative_to(ROOT)),'sha256':sha(FIXTURE),'source':'checked-in Chapter II complete earned trail-bow checkpoint'},
 'checks':[],'errors':[],'browser_errors':[],'app_errors':[],'observations':{}}
for var,field in [('FIRSTLIGHT_EXPECT_HEAD','head'),('FIRSTLIGHT_EXPECT_HTML_SHA','html_sha256')]:
 if os.environ.get(var) and report[field]!=os.environ[var]:raise RuntimeError('Wrong qualification epoch: '+field)
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/index.html'
def check(name,ok):
 report['checks'].append({'name':name,'passed':bool(ok)});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
 if not ok:
  try:page.screenshot(path=str(OUT/'FAILURE.png'))
  except Exception:pass
  raise AssertionError(name)
@contextmanager
def disposable_context(pw,prefix):
 with tempfile.TemporaryDirectory(prefix=prefix) as profile:
  context=pw.chromium.launch_persistent_context(profile,**chromium_launch_kwargs(),viewport={'width':1280,'height':800})
  try:yield context
  except Exception:
   try:
    failed=context.pages[-1];failed.screenshot(path=str(OUT/'FAILURE.png'))
    report['failure_context']=failed.evaluate('()=>({state:Realm.state,diagnostics:Realm.diagnostics,skitters:Realm.test.skitters()})')
   except Exception:pass
   raise
  finally:context.close()
def ev(js,arg=None):return page.evaluate(js,arg)
def state():return ev('()=>Realm.state')
def diag():return ev('()=>Realm.diagnostics')
def render():ev('()=>Realm.test.render()')
def sample():
 return ev('()=>{const sim=Realm.test.worldContext().sim;return{elapsed:sim.state.adventure.elapsed,paused:sim.paused,models:Realm.test.skitters(),enemies:JSON.parse(JSON.stringify(RealmAdventure.runtime(sim).enemies)),submitted:window.__skitterSubmitted||[],hp:sim.state.adventure.hp,hits:Realm.diagnostics.adventure.tactics.hits}}')
def frames(n=1):
 return ev('n=>{for(let i=0;i<n;i++){window.__skitterNow+=50;const f=window.__skitterFrame;if(f?.name!=="frame")throw Error("actual application frame missing");f(window.__skitterNow)}return true}',n)
def attach(p,returning=False):
 p.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
 p.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__skitterNow=1000;const nativeRAF=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=function(f){if(f.name!=="frame")return nativeRAF(f);window.__skitterFrame=f;return 1};')
 if returning:p.add_init_script(f'if(!localStorage.getItem({json.dumps(LEGACY)}))localStorage.setItem({json.dumps(LEGACY)},{json.dumps(FIXTURE.read_text(encoding="utf8"))});')
 response=p.goto(url,wait_until='load');p.wait_for_function('()=>!!window.Realm',polling=100)
 check('HTTP body matches exact integrated HTML',hashlib.sha256(response.body()).hexdigest()==report['html_sha256'])
 check('actual read-only skitter caller hook exists',p.evaluate('()=>typeof Realm.test.skitters==="function"'))
 # Read the real final caller output, after legacy transforms. Ablation is solely
 # an explicitly requested test appearance toggle, never a gameplay fixture.
 p.evaluate('()=>{const original=RealmAdventureArt.draw;RealmAdventureArt.draw=function(out,sim,t){const result=original(out,sim,t);if(window.__skitterHide)for(const items of Object.values(out))for(let i=items.length-1;i>=0;i--)if(items[i].skitterPart)items.splice(i,1);window.__skitterSubmitted=Object.entries(out).flatMap(([kind,items])=>items.filter(i=>i.skitterPart).map(i=>({kind,...JSON.parse(JSON.stringify(i))})));return result};Realm.test.quality("low");Realm.test.render()}')
 return p
def close():
 if page.locator('#rpg-window').evaluate('(e)=>e.open'):page.locator('#rpg-close').click()
 if page.locator('#drawer').evaluate('(e)=>e.classList.contains("open")'):page.locator('#close-panel').click()
def key(k):page.keyboard.press(k);render()
def walk(x,z):
 close();r=ev('([x,z])=>Realm.test.move(x,z)',[x,z]);check(f'production path accepts {x},{z}',r['ok'])
 arrived=ev('()=>{for(let i=0;i<8000&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render();return !Realm.test.path.length}')
 check(f'production path arrives alive at {x},{z}',arrived and state()['adventure']['hp']>0)
serial=0
def command(t,p=None,accepted=True):
 global serial
 serial+=1;r=ev('([id,t,p])=>Realm.test.adventure(id,t,p)',[f'skitter-browser-{serial}',t,p or {}]);render()
 if accepted:check('actual production command accepts '+t,r['ok'])
 return r
def enter_outing(fresh=False):
 walk(11,9)
 if fresh:key('e');check('fresh expedition kit earned through actual E',state()['adventure']['started'])
 key('e');page.locator('[data-rpg="starter-accept"]').click();render();close()
 check('visible riverbank acceptance retains actual quest identity',state()['adventure']['starter']['accepted'])
 walk(15,7);key('e');check('actual E enters the riverbank',diag()['scene']=='riverbank')
def model(s,id):return next((m for m in s['models'] if m['id']==id),None)
def enemy(s,id):return next(e for e in s['enemies'] if e['id']==id)
near=lambda a,b,t=1e-8:abs(a-b)<t
def vector_near(a,b,t=1e-8):return len(a)==len(b) and all(near(x,y,t) for x,y in zip(a,b))
def validate(s,label):
 correct=True;transforms=True;submitted=True;feet=True;tells=True;feedback=True
 for m in s['models']:
  e=enemy(s,m['id']);p=m['placement'];pose=m['pose'];f=1.32 if e.get('custom')=='river-bristle' else 1
  correct &= e['hp']>0 and e['kind']=='skitter' and len(m['parts'])==(31 if f>1 else 26) and p['named']==(f>1)
  correct &= near(p['x'],e['x']) and near(p['z'],e['z']) and near(p['yaw'],e['yaw']) and near(p['base'],1.58)
  shell=next(v for v in m['parts'] if v['skitterPart']=='carapace');c=math.cos(e['yaw']);sn=math.sin(e['yaw']);rx=p['recoil']['x'];rz=p['recoil']['z']
  expected=[c*.95*f,0,-sn*.95*f,0,0,.84*f,0,0,sn*1.22*f,0,c*1.22*f,0,e['x']+rx,1.58+pose['bodyY']*f,e['z']+rz,1]
  transforms &= vector_near(shell['m'],expected) and vector_near(shell['p'],expected[12:15]) and vector_near(shell['s'],[.95*f,.84*f,1.22*f])
  for part in m['parts']:
   transforms &= all(math.isfinite(v) for v in part['m']) and vector_near(part['p'],part['m'][12:15]) and all(v>0 for v in part['s']) and part['appearanceOnly'] and not part['cameraSolid'] and not part['cutaway']
   submitted &= any(v['skitterPart']==part['skitterPart'] and vector_near(v['m'],part['m']) and vector_near(v['p'],part['p']) and vector_near(v['s'],part['s']) for v in s['submitted'])
   if part['skitterPart'].endswith('-foot'):feet &= part['p'][1]-part['s'][1]/2>=p['base']-.001
  wind=e['mode']=='windup';rec=e['mode']=='recover';duration=e.get('windup',.75);rd=e.get('recovery',1.1)
  u=max(0,min(1,1-e['timer']/duration));v=max(0,min(1,e['timer']/rd))
  tells &= near(pose['crouch'],.09*u*u*(3-2*u) if wind else 0) and near(pose['recovery'],v*v*(3-2*v) if rec else 0)
  feedback &= p['flash']==(e['flash']>s['elapsed']) and (bool(e.get('hitFrom')) or (near(rx,0) and near(rz,0)))
 check(label+' live ordinary and named counts position yaw and ground match actual actors',correct)
 check(label+' submitted full matrices apply named scale and yaw exactly once',transforms and submitted and len(s['submitted'])==sum(len(m['parts']) for m in s['models']))
 check(label+' six feet stay above actual ground',feet)
 check(label+' crouch and recovery follow only actual authoritative timers',tells)
 check(label+' feedback agrees with confirmed actual hit state',feedback)
def pure_render(label):
 before=state();actors=sample()['enemies'];render();render();render()
 check(label+' repeated drawing cannot mutate durable state or enemy actors',state()==before and sample()['enemies']==actors)
def wait_phase(id,phase,limit=130):
 for _ in range(limit):
  s=sample()
  if enemy(s,id)['mode']==phase:return s
  frames()
 raise AssertionError('actual '+id+' never reached '+phase)
def fight(id):
 command('target-select',{'id':id});key('1')
 result=ev('id=>{for(let i=0;i<2000;i++){const a=Realm.state.adventure,e=Realm.diagnostics.adventure.enemies.find(e=>e.id===id);if(!e||e.hp<=0)break;if(a.hp<=0)throw Error("actual combat death");if(a.hp<35&&a.tonics)Realm.test.adventure("skitter-real-heal-"+id+"-"+i,"heal",{});Realm.test.step(.05)}Realm.test.render();return Realm.state.adventure.defeated.includes(id)}',id)
 check('actual attacks defeat '+id,result);command('target-clear')
 s=sample();check('actual defeat clears all '+id+' model parts',model(s,id) is None and enemy(s,id)['hp']==0 and len(s['submitted'])==sum(len(m['parts']) for m in s['models']))

try:
 with sync_playwright() as pw:
  with disposable_context(pw,'firstlight-skitter-fresh-') as context:
   page=attach(context.new_page());enter_outing(fresh=True);initial=sample();report['observations']['fresh_initial']=initial
   check('accepted fresh outing emits two ordinary skitters and Old Bristle',{m['id'] for m in initial['models']}=={'river-skitter-west','river-skitter-east','river-old-bristle'})
   validate(initial,'fresh idle');pure_render('fresh idle')
   snap_before=sample();ev('()=>{const s=Realm.test.skitters();s[0].placement.x=999;s[0].parts[0].m[12]=999}')
   check('read-only skitter snapshot cannot alter the caller or combat cache',sample()==snap_before)
   frames(4);still=sample();check('stationary safe-camp intent invents no displacement gait',all(not m['motion']['moving'] and m['motion']['phase']==0 and m['motion']['blend']==0 for m in still['models']))
   refused=ev('()=>Realm.test.move(-1,1)');frames(6);blocked=sample()
   check('actual boulder destination refuses player path intent',not refused['ok'] and not ev('()=>Realm.test.path.length'))
   check('refused path with stationary actors fabricates no skitter gait',all(not m['motion']['moving'] and m['motion']['phase']==0 and m['motion']['blend']==0 for m in blocked['models']))
   walk(-7,7.4);check('actual chase path is accepted',ev('()=>Realm.test.move(-7,3.4)')['ok'])
   movement=[]
   for _ in range(24):frames();movement.append(sample())
   check('accepted actual pursuit displacement drives gait',any(model(s,'river-skitter-west')['motion']['moving'] and model(s,'river-skitter-west')['pose']['blend']>.1 for s in movement))
   validate(movement[-1],'actual chase');wind=wait_phase('river-skitter-west','windup');frames(4);wind=sample();validate(wind,'actual windup')
   check('real windup has a timed crouch with planted six feet',model(wind,'river-skitter-west')['pose']['crouch']>0 and all(near(l['foot'][1],.045) for l in model(wind,'river-skitter-west')['pose']['legs'].values()))
   key('c');frozen=sample();canonical=state();frames(16);paused=sample()
   check('actual modal pause freezes timers HP poses and submitted matrices',diag()['adventure']['paused'] and state()==canonical and paused['enemies']==frozen['enemies'] and paused['models']==frozen['models'] and paused['submitted']==frozen['submitted'])
   close();frames();recovery=wait_phase('river-skitter-west','recover');validate(recovery,'actual recovery')
   check('enemy strike does not fabricate confirmed player-hit flash or recoil',not model(recovery,'river-skitter-west')['placement']['flash'] and vector_near(list(model(recovery,'river-skitter-west')['placement']['recoil'].values()),[0,0]))
   command('target-select',{'id':'river-skitter-west'});key('1');before=enemy(sample(),'river-skitter-west')['hp'];hit=None
   for _ in range(25):
    frames();s=sample()
    if enemy(s,'river-skitter-west')['hp']<before:hit=s;break
   check('actual blade impact reduces real HP before confirming feedback',hit is not None and enemy(hit,'river-skitter-west')['hp']>0 and any(h['n']==before-enemy(hit,'river-skitter-west')['hp'] for h in hit['hits']))
   check('actual blade impact alone supplies flash and directional recoil',model(hit,'river-skitter-west')['placement']['flash'] and math.hypot(*model(hit,'river-skitter-west')['placement']['recoil'].values())>0)
   key('1');validate(hit,'actual confirmed blade hit');pure_render('confirmed hit');page.screenshot(path=str(OUT/'actual-blade-impact.png'))
   # Frozen clock, real renderer: remove only skitter appearance for one draw.
   pixel=ev('()=>{for(let i=0;i<4;i++)Realm.test.render();const canvas=document.querySelector("#world"),g=canvas.getContext("webgl2"),w=canvas.width,h=canvas.height,read=()=>{const b=new Uint8Array(w*h*4);g.bindFramebuffer(g.FRAMEBUFFER,null);g.readPixels(0,0,w,h,g.RGBA,g.UNSIGNED_BYTE,b);return b};const before=Realm.export();Realm.test.render();const a=read();window.__skitterHide=true;Realm.test.render();const b=read();window.__skitterHide=false;Realm.test.render();let changed=0,nonblack=0;for(let i=0;i<a.length;i+=4){if(a[i]||a[i+1]||a[i+2])nonblack++;if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])changed++}return{changed,nonblack,width:w,height:h,error:g.getError(),sameState:before===Realm.export()}}')
   report['observations']['appearance_only_framebuffer_ablation']=pixel
   check('actual submitted rigs contribute positive framebuffer pixels',pixel['error']==0 and pixel['nonblack']>1000 and pixel['changed']>30 and pixel['sameState'])
   projection=diag()['camera']['projection'];key('v');validate(sample(),'opposite camera');check('V switches actual projection with finite creature rendering',diag()['camera']['projection']!=projection);pure_render('opposite camera');page.screenshot(path=str(OUT/'actual-skitter-diorama.png'));key('v')
   # Finish the real wounded skitter without toggling auto twice.
   fight('river-skitter-west')
   page.locator('#settings').click();page.locator('#setting-reducedMotion').check();page.locator('#close-panel').click();render()
   check('actual reduced-motion setting suppresses only secondary bob',all(m['motion']['reducedMotion'] and m['pose']['reducedMotion'] and m['pose']['bob']==0 for m in sample()['models']))
   walk(5,-3);command('target-select',{'id':'river-skitter-east'});key('1');prior=enemy(sample(),'river-skitter-east')['hp'];rhit=None
   for _ in range(25):
    frames();s=sample()
    if enemy(s,'river-skitter-east')['hp']<prior:rhit=s;break
   check('real reduced-motion impact retains confirmed flash and removes recoil',rhit is not None and model(rhit,'river-skitter-east') is not None and model(rhit,'river-skitter-east')['placement']['flash'] and vector_near(list(model(rhit,'river-skitter-east')['placement']['recoil'].values()),[0,0]))
   key('1');fight('river-skitter-east')
   walk(-5,-11);named=wait_phase('river-old-bristle','windup');frames(3);named=sample();validate(named,'actual named windup')
   check('Old Bristle uses actual longer windup and five distinct spines',enemy(named,'river-old-bristle')['windup']==1.25 and len([p for p in model(named,'river-old-bristle')['parts'] if p['skitterPart'].startswith('river-spine-')])==5)
   check('reduced motion retains the actual named timed crouch',model(named,'river-old-bristle')['pose']['reducedMotion'] and model(named,'river-old-bristle')['pose']['crouch']>0)
   page.screenshot(path=str(OUT/'actual-old-bristle-warning.png'));nrecover=wait_phase('river-old-bristle','recover');validate(nrecover,'actual named recovery')
   check('named recovery reads the actual longer authoritative duration',enemy(nrecover,'river-old-bristle')['recovery']==1.8 and model(nrecover,'river-old-bristle')['pose']['recovery']>0 and model(nrecover,'river-old-bristle')['pose']['crouch']==0)
   fight('river-old-bristle')
   check('actual defeat of every outing skitter leaves no creature model submission',sample()['models']==[] and sample()['submitted']==[])
   report['observations']['fresh_actual_combat_outcome']=state();report['app_errors'].extend(diag()['errors'])
  with disposable_context(pw,'firstlight-skitter-returning-bow-') as context:
   page=attach(context.new_page(),returning=True);check('returning checkpoint keeps the actually earned equipped trail bow',state()['adventure']['equipment']['weapon']=='trail_bow')
   key('c');page.locator('#rpg-tabs [data-rpg="open"][data-id="companion"]').click();page.locator('[data-rpg="companion"][data-id="stay"]').click();render();close()
   check('actual Stay prevents helper attacks in isolated bow proof',state()['adventure']['companion']['mode']=='stay')
   enter_outing();walk(3,2);blocked=sample();p=diag()['adventure']['player'];target=enemy(blocked,'river-skitter-west')
   check('real riverbank boulder blocks an otherwise in-range bow target',math.hypot(p['x']-target['x'],p['z']-target['z'])<11 and not ev('id=>{const sim=Realm.test.worldContext().sim,e=RealmAdventure.runtime(sim).enemies.find(e=>e.id===id);return RealmArsenal.aimClear(sim,sim.state.player,e)}','river-skitter-west'))
   refused=command('attack',{'target':'river-skitter-west'},accepted=False);after=sample()
   check('actual wall-blocked arrow refusal changes no target HP flash recoil or projectile',not refused['ok'] and enemy(after,'river-skitter-west')['hp']==target['hp'] and enemy(after,'river-skitter-west').get('hitAt')==target.get('hitAt') and not diag()['adventure']['arrows'] and not model(after,'river-skitter-west')['placement']['flash'])
   report['observations']['actual_bow_wall_refusal']={'result':refused,'player':p,'target':target};pure_render('wall refusal')
   walk(-5,-10);command('attack',{'target':'river-old-bristle'});shot=sample();bhp=enemy(shot,'river-old-bristle')['hp']
   check('actual bow release creates travelling arrow without instant target damage',bool(diag()['adventure']['arrows']) and not model(shot,'river-old-bristle')['placement']['flash'])
   bhit=None
   for _ in range(30):
    frames();s=sample()
    if enemy(s,'river-old-bristle')['hp']<bhp:bhit=s;break
   check('actual projectile collision causes named HP damage and confirmed feedback',bhit is not None and enemy(bhit,'river-old-bristle')['hp']>0 and model(bhit,'river-old-bristle')['placement']['flash'] and enemy(bhit,'river-old-bristle').get('hitFrom') is not None)
   validate(bhit,'actual travelling bow impact');page.screenshot(path=str(OUT/'actual-bow-impact.png'));report['observations']['actual_projectile_hit']=bhit
   check('rendering retained earned bow and prior main-road completion',state()['adventure']['equipment']['weapon']=='trail_bow' and state()['adventure']['road']['reported'])
   report['app_errors'].extend(diag()['errors'])
 check('focused actual creature paths have no application or page errors',not report['browser_errors'] and not report['app_errors'])
 report['passed']=True
except Exception as e:
 report['errors'].append(str(e));report['traceback']=traceback.format_exc();report['passed']=False;raise
finally:
 (OUT/'REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8');server.shutdown();server.server_close()
