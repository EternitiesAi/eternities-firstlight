"""Native Road After Rain controls and storage on one disposable loopback profile.
Returning inputs come from the command-earned veteran-mill checkpoint. Preparation
uses actual accepted paths and buttons, with accelerated capture-mode walking.
Storage.setItem throws are synthetic refusal fixtures, not measured native quota.
A transparent command observer records actual UI request IDs without altering
rules or outcomes. The existing exact callback proves a same-ID consent retry.
Software Chromium does not certify human pacing, accessibility or GPU performance.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import argparse,datetime,hashlib,json,os,subprocess,tempfile,threading,traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

ROOT=Path(os.environ.get('FIRSTLIGHT_TEST_ROOT',Path(__file__).resolve().parents[1])).resolve()
parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path)
args=parser.parse_args();OUT=(args.output or ROOT/'evidence10/earth-story-transactions-browser').resolve();OUT.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
fixture=ROOT/'docs/evidence/road-after-rain/veteran-mill_SOURCE.json'
source_paths=['src/workshop-transactions.js','src/earth-story.js','src/earth-story-ui.js','src/rpg-ui.js','src/adventure-ui.js','src/app.js','src/characters.js']
report={'method':__doc__,'started':datetime.datetime.now().astimezone().isoformat(),'root':str(ROOT),
 'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
 'html_sha256':sha(ROOT/'index.html'),'harness_sha256':sha(Path(__file__)),
 'fixture':{'path':str(fixture.relative_to(ROOT)),'sha256':sha(fixture)},
 'source_sha256':{p:sha(ROOT/p) for p in source_paths},'checks':[],'errors':[],'browser_errors':[],'external_requests':[],'refusals':[]}
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*a):pass
def check(name,ok):
 report['checks'].append({'name':name,'passed':bool(ok)});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
 if not ok:
  try:page.screenshot(path=str(OUT/'FAILURE.png'))
  except Exception:pass
  raise AssertionError(name)
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with tempfile.TemporaryDirectory(prefix='firstlight-rain-transactions-',dir=OUT) as profile,sync_playwright() as pw:
  context=pw.chromium.launch_persistent_context(profile,**chromium_launch_kwargs(),viewport={'width':1280,'height':800})
  page=context.new_page();page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
  page.on('request',lambda r:report['external_requests'].append(r.url) if not r.url.startswith(('http://127.0.0.1:','data:','blob:')) else None)
  page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
  response=page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='load');page.wait_for_function('()=>!!window.Realm')
  ev=lambda js,arg=None:page.evaluate(js,arg)
  check('browser served exact candidate artifact',hashlib.sha256(response.body()).hexdigest()==report['html_sha256'])
  check('actual caller supports all five exact Earth-story actions',ev('()=>["accept","step","dispatch","arrive","claim"].every(n=>RealmWorkshopTransactions.supports("adventure","earth-story-"+n))'))
  ev('(w)=>Realm.test.replace(w)',json.loads(fixture.read_text(encoding='utf-8')))
  def state():return ev('()=>Realm.state')
  def raw():return ev('()=>localStorage.getItem(RealmCore.KEY)')
  def render():ev('()=>{Realm.test.quality("low");Realm.test.render()}')
  def close():
   if page.locator('#rpg-window').evaluate('(e)=>e.open'):page.locator('#rpg-close').click()
  def walk(x,z):
   close();r=ev('([x,z])=>{const r=Realm.test.move(x,z);if(!r.ok)return r;for(let i=0;i<4500&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render();const p=Realm.diagnostics.adventure.player;return{ok:Math.hypot(p.x-x,p.z-z)<.3}}',[x,z]);check('accepted production path reaches '+str((x,z)),r.get('ok'))
  def open_here():page.keyboard.press('e');render()
  def command(call):
   return ev('c=>{const s=Realm.test.worldContext().sim,p=s.paused;try{s.paused=false;return Realm.test.workshopCommand(c.domain,c.id,c.type,c.payload)}finally{s.paused=p}}',call)
  def refs():
   ev('()=>{const s=Realm.test.worldContext().sim;window.__rainRefs={s,state:s.state,a:s.state.adventure,b:s.state.sandbox,player:s.state.player,path:s.playerPath,returnPos:s.returnPos,runtime:RealmAdventure.runtime(s),runs:s.runs,elapsed:s.elapsed,room:s.room,runtimeBytes:JSON.stringify(RealmAdventure.runtime(s))}}')
  def context_intact(label):
   check(label+' preserves live scene, actor epoch, path, player and clock',ev('()=>{const r=window.__rainRefs,s=Realm.test.worldContext().sim;return s===r.s&&s.state===r.state&&s.state.adventure===r.a&&s.state.sandbox===r.b&&s.state.player===r.player&&s.playerPath===r.path&&s.returnPos===r.returnPos&&RealmAdventure.runtime(s)===r.runtime&&s.runs===r.runs&&s.elapsed===r.elapsed&&s.room===r.room&&JSON.stringify(RealmAdventure.runtime(s))===r.runtimeBytes}'))
  render();walk(0,23);open_here();page.locator('[data-rpg="earth-confirm"]').click();render();walk(0,10);walk(7,5);open_here()
  ev('()=>{window.__rainObserved=[];window.__rainCommand=RealmWorkshopTransactions.command;RealmWorkshopTransactions.command=function(sim,domain,id,type,payload,io){const result=window.__rainCommand(sim,domain,id,type,payload,io);window.__rainObserved.push({domain,id,type,payload:JSON.parse(JSON.stringify(payload)),result:JSON.parse(JSON.stringify(result))});return result}}')
  initial=state();report['earned_input']=initial
  def refused_retry(label,selector,same_id=False,photo=False):
   check(label+' native button is actionable',page.locator(selector).is_visible() and page.locator(selector).is_enabled())
   check(label+' baseline saves normally',ev('()=>Realm.test.save()')['ok']);before=state();saved=raw();refs()
   ev('()=>{window.__rainSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===RealmCore.KEY||k===RealmCharacters.KEY)throw Error("isolated Earth-story quota fixture");return window.__rainSetItem.call(this,k,v)}}')
   page.locator(selector).click();render();call=ev('()=>window.__rainObserved.at(-1)')
   check(label+' reaches actual refused saver',call['result']['ok'] is False and 'isolated Earth-story quota fixture' in call['result'].get('error',''))
   check(label+' preserves the entire canonical world and receipts',state()==before)
   check(label+' preserves exact native durable bytes',raw()==saved);context_intact(label+' refusal')
   check(label+' restores deliberate modal pause',ev('()=>document.querySelector("#rpg-window").open&&Realm.diagnostics.adventure.paused'))
   page.wait_for_function('()=>{const e=document.querySelector("#toast");return e.textContent.includes("isolated Earth-story quota fixture")&&Number(getComputedStyle(e).opacity)>.95}')
   feedback=ev('async()=>{const e=document.querySelector("#toast"),old=e.getAttribute("style");e.style.setProperty("pointer-events","auto","important");await new Promise(requestAnimationFrame);const r=e.getBoundingClientRect(),s=getComputedStyle(e),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);const out={text:e.textContent,frontmost:top===e||e.contains(top),opacity:Number(s.opacity),visibility:s.visibility,rect:{x:r.x,y:r.y,width:r.width,height:r.height}};if(old===null)e.removeAttribute("style");else e.setAttribute("style",old);return out}')
   check(label+' refusal is frontmost in actual dialog',feedback['frontmost'] and feedback['opacity']>.95 and feedback['visibility']=='visible' and feedback['rect']['width']>0 and feedback['rect']['height']>0)
   report['refusals'].append({'label':label,'call':call,'before':before,'after':state(),'raw_sha256':hashlib.sha256(saved.encode()).hexdigest(),'feedback':feedback})
   if photo:page.screenshot(path=str(OUT/'REPAIR_REFUSAL_VISIBLE.png'))
   ev('()=>{Storage.prototype.setItem=window.__rainSetItem}')
   if same_id:
    accepted=command(call);check(label+' retries the exact native refused request ID',accepted['ok'] and not accepted.get('duplicate'));accepted_call=call
   else:
    page.locator(selector).click();render();accepted_call=ev('()=>window.__rainObserved.at(-1)');check(label+' normal native UI retry commits',accepted_call['result']['ok'] and not accepted_call['result'].get('duplicate'))
   context_intact(label+' acceptance');check(label+' saves exact adopted checkpoint',json.loads(raw())==state())
   after=state();durable=raw();dup=command(accepted_call);check(label+' same successful request cannot replay',dup['ok'] and dup.get('duplicate') and state()==after and raw()==durable)
   changed={**accepted_call,'payload':{**accepted_call['payload'],'changedTerms':'different'}};denied=command(changed);check(label+' same ID with changed terms refuses',not denied['ok'] and state()==after and raw()==durable)
   if same_id:close();open_here()
   return before,after
  refused_retry('Consent','[data-rpg="rain-accept"]',same_id=True)
  check('consent preserves all materials and explicit path choice',state()['sandbox']['inventory']==initial['sandbox']['inventory'] and state()['adventure']['classPath']==initial['adventure']['classPath'])
  step=ev('()=>RealmEarthStory.STEPS.find(s=>s.id==="mill-root")');walk(step['x'],step['z']);open_here();page.locator('[data-rpg="rain-step"][data-id="mill-root"]').click();render()
  check('preparation is earned through native root-clearance interaction','mill-root' in state()['adventure']['earthStory']['steps'])
  walk(7,-7);open_here();before,after=refused_retry('Repair','[data-rpg="rain-step"][data-id="mill-gate"]',photo=True)
  check('repair charges exactly the declared 2 timber once',after['sandbox']['inventory']['wood']==before['sandbox']['inventory']['wood']-2)
  check('successful gate status follows saved repair','mill-gate' in after['adventure']['earthStory']['steps'] and ev('()=>Realm.test.millGate().gate.repaired'))
  page.screenshot(path=str(OUT/'REPAIR_ACCEPTED_NATIVE.png'))
  close();page.reload();page.wait_for_function('()=>!!window.Realm');render()
  check('native reload preserves paid timber cost and gate work',state()['sandbox']['inventory']['wood']==after['sandbox']['inventory']['wood'] and state()['adventure']['earthStory']==after['adventure']['earthStory'])
  check('reload resumes at the established home checkpoint',ev('()=>Realm.diagnostics.scene')=='valley')
  walk(0,23);open_here();page.locator('[data-rpg="earth-confirm"]').click();render();walk(0,10);walk(7,5);open_here()
  ev('()=>{window.__rainObserved=[];window.__rainCommand=RealmWorkshopTransactions.command;RealmWorkshopTransactions.command=function(sim,domain,id,type,payload,io){const result=window.__rainCommand(sim,domain,id,type,payload,io);window.__rainObserved.push({domain,id,type,payload:JSON.parse(JSON.stringify(payload)),result:JSON.parse(JSON.stringify(result))});return result}}')
  refused_retry('Dispatch','[data-rpg="rain-dispatch"][data-id="mill"]')
  walk(0,-43);open_here();refused_retry('Arrival','[data-rpg="rain-arrive"]')
  before,paid=refused_retry('Payment','[data-rpg="rain-claim"]')
  check('native once-only payout is exactly 3 copper, 4 sunmarks and 2 fibre',paid['adventure']['ore']==before['adventure']['ore']+3 and paid['adventure']['coins']==before['adventure']['coins']+4 and paid['sandbox']['inventory']['fiber']==before['sandbox']['inventory']['fiber']+2)
  check('story payout awards no XP and changes no class, gear or companion',paid['adventure']['xp']==initial['adventure']['xp'] and all(paid['adventure'][k]==initial['adventure'][k] for k in ['classPath','equipment','owned','companion']))
  page.screenshot(path=str(OUT/'PAYMENT_ACCEPTED_NATIVE.png'))
  denied=command({'domain':'adventure','id':'changed-native-payment-id','type':'earth-story-claim','payload':{}})
  check('changed request ID cannot pay completed delivery again',not denied['ok'] and state()==paid)
  close();page.reload();page.wait_for_function('()=>!!window.Realm');render()
  restored=state();report['final_checkpoint']=restored
  check('native reload preserves payment, repair and exact balances',all(restored[k]==paid[k] for k in ['adventure','sandbox','journal','nextEvent']))
  check('schemas and storage identity remain unchanged',restored['version']==initial['version'] and restored['adventure']['version']==initial['adventure']['version'] and ev('()=>RealmCore.KEY')=='eternities.realm10.save.v9')
  check('no browser application errors or external requests',not report['browser_errors'] and not report['external_requests'])
  context.close()
except Exception:
 report['errors'].append(traceback.format_exc());print(report['errors'][-1],flush=True)
finally:
 server.shutdown();report['finished']=datetime.datetime.now().astimezone().isoformat();report['ending_source_sha256']={p:sha(ROOT/p) for p in source_paths}
 report['source_unchanged']=report['source_sha256']==report['ending_source_sha256'] and report['html_sha256']==sha(ROOT/'index.html') and report['harness_sha256']==sha(Path(__file__))
 report['passed']=not report['errors'] and report['source_unchanged'] and all(c['passed'] for c in report['checks'])
 (OUT/'REPORT.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
 print(json.dumps({'passed':report['passed'],'checks':len(report['checks']),'errors':len(report['errors']),'report':str(OUT/'REPORT.json')}),flush=True)
raise SystemExit(0 if report['passed'] else 1)
