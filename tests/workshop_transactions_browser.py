"""Actual K/C/field-guide controls and native storage on disposable loopback profiles.
Fresh bow inputs are command-earned with accelerated production walking/gathering.
Returning checkpoints retain their checked-in earned-source provenance. Quota throws
are labeled synthetic; two tabs exercise the real native character writer lock.
This is software Chromium, not measured native quota, hardware or human pacing.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from contextlib import contextmanager
import hashlib, json, os, subprocess, tempfile, threading, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

ROOT=Path(os.environ.get('FIRSTLIGHT_TEST_ROOT',Path(__file__).resolve().parents[1])).resolve()
OUT=ROOT/'evidence10/workshop-transactions-browser';OUT.mkdir(parents=True,exist_ok=True)
LEGACY='eternities.realm10.save.v9';LIBRARY='eternities.realm10.characters.v1'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
fixture_paths={'guide':ROOT/'docs/evidence/upgrade-hunt/run5_02_PARTIAL.json',
               'socket':ROOT/'examples/REALM09_ARMORY_COMPLETE_EARNED.json'}
report={'method':__doc__,'root':str(ROOT),'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
        'html_sha256':sha(ROOT/'index.html'),'harness_sha256':sha(Path(__file__)),
        'source_sha256':{p:sha(ROOT/p) for p in ['src/app.js','src/rpg-ui.js','src/adventure-ui.js','src/sandbox-ui.js','src/workshop-transactions.js','src/characters.js']},
        'fixtures':{k:{'path':str(p.relative_to(ROOT)),'sha256':sha(p)} for k,p in fixture_paths.items()},
        'checks':[],'errors':[],'browser_errors':[]}
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
  finally:context.close()
def attach(page,seed=None):
 page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
 page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
 if seed is not None:
  page.add_init_script(f'if(!localStorage.getItem({json.dumps(LEGACY)}))localStorage.setItem({json.dumps(LEGACY)},{json.dumps(json.dumps(seed))});')
 response=page.goto(url,wait_until='load');page.wait_for_function('()=>!!window.Realm')
 check('served artifact matches exact integration HTML',sha(ROOT/'index.html')==hashlib.sha256(response.body()).hexdigest())
 check('actual app exposes the reviewed durable workshop callback',page.evaluate('()=>typeof Realm.test.workshopCommand==="function"&&RealmWorkshopTransactions.supports("adventure","pursuit-fit")'))
 page.evaluate('()=>{Realm.test.quality("low");Realm.test.render()}')
 return page
def ev(js,arg=None):return page.evaluate(js,arg)
def state():return ev('()=>Realm.state')
def raw(key=LEGACY):return ev('k=>localStorage.getItem(k)',key)
def render():ev('()=>Realm.test.render()')
def close():
 if page.locator('#rpg-window').evaluate('(e)=>e.open'):page.locator('#rpg-close').click()
def key(k):page.keyboard.press(k);render()
def walk(x,z):
 close();r=ev('([x,z])=>Realm.test.move(x,z)',[x,z]);check(f'production walking accepts {x},{z}',r['ok'])
 result=ev('()=>{for(let i=0;i<12000&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render();return{done:!Realm.test.path.length,hp:Realm.state.adventure.hp}}')
 check(f'production walking arrives able to act at {x},{z}',result['done'] and result['hp']>0)
def quota():
 ev('()=>{window.__workshopSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===RealmCore.KEY||k===RealmCharacters.KEY)throw Error("workshop quota fixture");return window.__workshopSetItem.call(this,k,v)}}')
def restore_quota():ev('()=>{Storage.prototype.setItem=window.__workshopSetItem}')
def capture_calls():
 ev('()=>{const original=RealmWorkshopTransactions.command;RealmWorkshopTransactions.command=function(sim,domain,id,type,payload,io){window.__workshopCall={domain,id,type,payload};return original(sim,domain,id,type,payload,io)}}')
def callback(call):
 return ev('c=>{const s=Realm.test.worldContext().sim,p=s.paused;try{s.paused=false;return Realm.test.workshopCommand(c.domain,c.id,c.type,c.payload)}finally{s.paused=p}}',call)
def assert_ui_refusal(label,selector,key=LEGACY):
 before=state();saved=raw(key);quota();page.locator(selector).click();render()
 check(label+' leaves complete canonical world unchanged',state()==before)
 check(label+' leaves exact native saved bytes unchanged',raw(key)==saved)
 check(label+' exposes real storage refusal without success feedback','workshop quota fixture' in page.locator('#toast').inner_text())
 page.wait_for_function('()=>[...document.querySelectorAll("#toast,[role=status],[role=alert]")].some(e=>e.textContent.includes("workshop quota fixture")&&Number(getComputedStyle(e).opacity)>.95)')
 feedback=ev('async()=>{const out=[];for(const e of [...document.querySelectorAll("#toast,[role=status],[role=alert]")].filter(e=>e.textContent.includes("workshop quota fixture"))){const r=e.getBoundingClientRect(),old=e.getAttribute("style");e.style.setProperty("pointer-events","auto","important");const s=getComputedStyle(e),pointerEventsDuring=s.pointerEvents;await new Promise(requestAnimationFrame);const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(old===null)e.removeAttribute("style");else e.setAttribute("style",old);out.push({id:e.id,role:e.getAttribute("role"),opacity:Number(s.opacity),display:s.display,visibility:s.visibility,pointerEventsDuring,rect:{x:r.x,y:r.y,width:r.width,height:r.height},frontmost:top===e||e.contains(top),topElement:top?.tagName})}return out}')
 report.setdefault('refusal_feedback',[]).append({'name':label,'viewport':page.viewport_size,'candidates':feedback})
 check(label+' is visible above the actual open modal',any(f['frontmost'] and f['opacity']>.95 and f['display']!='none' and f['visibility']=='visible' and f['rect']['width']>0 and f['rect']['height']>0 for f in feedback))
 check(label+' restores paused menu ownership',page.locator('#rpg-window').evaluate('(e)=>e.open') and ev('()=>Realm.diagnostics.adventure.paused'))
 restore_quota();return before
def reload_saved(label,key=LEGACY):
 close();check(label+' saves to native storage',ev('()=>Realm.test.save()')['ok']);before=state();saved=raw(key)
 page.reload(wait_until='load');page.wait_for_function('()=>!!window.Realm');render()
 check(label+' reopens the exact saved bytes',raw(key)==saved)
 check(label+' retains complete economic and work records',all(state()[k]==before[k] for k in ['adventure','sandbox','journal','nextEvent','realmTrails','journeys','visitor']))
 check(label+' reopens at the disclosed home checkpoint',ev('()=>Realm.diagnostics.scene')=='valley')
def guide(weapon):
 close();key('j');page.locator('#rpg-tabs [data-rpg="open"][data-id="pursuit"]').click();page.locator('[data-rpg="pursuit-select"][data-id="'+weapon+'"]').click();render()
def characters():
 close();key('c');page.locator('#rpg-tabs [data-rpg="open"][data-id="characters"]').click();render()
def inspect_item(weapon):
 close();key('c');page.locator('#bag-items [data-rpg="item"][data-id="gear:'+weapon+'"]').click();render()
try:
 with sync_playwright() as pw:
  with disposable_context(pw,'firstlight-workshop-fresh-') as context:
   page=attach(context.new_page());walk(11,9);key('e');check('fresh kit earned through actual E control',state()['adventure']['started']);close()
   serial=0
   for node,hits in [('timber-3',4),('timber-4',4),('fibre-1',1),('fibre-3',1),('stone-1',4)]:
    p=ev('id=>RealmSandbox.NODES.find(n=>n.id===id)',node);walk(p['x']-.9,p['z']+.8)
    for _ in range(hits):
     serial+=1;r=ev('([id,node])=>Realm.test.sandbox(id,"gather",{node})',[f'durable-supplies-{serial}',node]);check('real gather '+node+' swing succeeds',r['ok']);ev('()=>Realm.test.step(.5)')
   check('fresh bow inputs earned without item or position edits',all(state()['sandbox']['inventory'][k]>=n for k,n in {'wood':6,'fiber':4,'stone':2}.items()))
   walk(11,9);check('earned supplies saved before refusal proof',ev('()=>Realm.test.save()')['ok']);report['fresh_command_earned_input']=state()
   key('k');page.locator('[data-rpg="recipe"][data-id="trail_bow"]').click();capture_calls()
   before=assert_ui_refusal('actual K bow craft','[data-rpg="craft"][data-id="trail_bow"]');call=ev('()=>window.__workshopCall');report['refused_ui_bow_request']=call
   check('actual K failure adds no bow receipt or materials spend','trail_bow' not in state()['adventure']['owned'] and state()['adventure']['receipts']==before['adventure']['receipts'])
   retry=callback(call);check('same UI request identity retries safely after storage recovery',retry['ok'] and not retry.get('duplicate',False))
   after=state();check('same identity pays actual bow materials exactly once',all(before['sandbox']['inventory'][k]-after['sandbox']['inventory'][k]==n for k,n in {'wood':6,'fiber':4,'stone':2}.items()))
   check('successful bow remains an explicit equip choice',after['adventure']['equipment']['weapon']=='trail_blade')
   replay=callback(call);check('successful receipt makes exact retry a no-op',replay['ok'] and replay.get('duplicate',False) and state()==after)
   changed={**call,'payload':{'id':'ruby'}};check('receipt identity with changed terms refuses atomically',not callback(changed)['ok'] and state()==after)
   new_id={**call,'id':call['id']+'-new'};check('new identity cannot recraft a unique owned bow',not callback(new_id)['ok'] and state()==after)
   close();key('k');page.locator('[data-rpg="craft-filter"][data-id="components"]').click();page.locator('[data-rpg="recipe"][data-id="plank"]').click()
   before=assert_ui_refusal('actual K sandbox plank craft','[data-rpg="craft"][data-id="plank"]');page.locator('[data-rpg="craft"][data-id="plank"]').click();render()
   check('actual K successful sandbox craft saves its materials and output',before['sandbox']['inventory']['wood']-state()['sandbox']['inventory']['wood']==2 and state()['sandbox']['inventory']['plank']-before['sandbox']['inventory']['plank']==4 and json.loads(raw())['sandbox']==state()['sandbox'])
   page.set_viewport_size({'width':390,'height':844});render();assert_ui_refusal('compact K sandbox craft','[data-rpg="craft"][data-id="plank"]')
   check('compact visible refusal keeps crafting content within the viewport',page.locator('#rpg-content').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'))
   page.screenshot(path=str(OUT/'compact-craft-refused.png'));page.set_viewport_size({'width':1280,'height':800});render()
   inspect_item('trail_bow');before=assert_ui_refusal('actual C equipment change','[data-rpg="equip"][data-id="trail_bow"]');page.locator('[data-rpg="equip"][data-id="trail_bow"]').click();render()
   check('actual C deliberate equip saves the selected bow',state()['adventure']['equipment']['weapon']=='trail_bow' and json.loads(raw())['adventure']['equipment']['weapon']=='trail_bow')
   page.screenshot(path=str(OUT/'fresh-bow-equipped.png'));reload_saved('fresh workshop return');report['fresh_command_earned_output']=state()
  with disposable_context(pw,'firstlight-workshop-return-') as context:
   page=attach(context.new_page(),json.loads(fixture_paths['guide'].read_text(encoding='utf8')));walk(11,9);check('returning earned partial survey and supplies remain intact',state()['adventure']['pursuit']['active']['id']=='riverbank-survey/5' and state()['adventure']['pursuit']['claimed']==4)
   guide('trail_blade');capture_calls();before=assert_ui_refusal('actual field-guide first fitting','[data-rpg="pursuit-recipe"][data-id="trail_blade"]');page.screenshot(path=str(OUT/'guide-fitting-refused.png'))
   page.locator('[data-rpg="pursuit-recipe"][data-id="trail_blade"]').click();render()
   check('actual field-guide fitting saves its exact complete cost',before['adventure']['ore']-state()['adventure']['ore']==3 and before['adventure']['coins']-state()['adventure']['coins']==4 and before['sandbox']['inventory']['fiber']-state()['sandbox']['inventory']['fiber']==2)
   check('field-guide fitting retains unfinished survey identity and earlier loadout',state()['adventure']['pursuit']['active']==before['adventure']['pursuit']['active'] and state()['adventure']['equipment']==before['adventure']['equipment'] and state()['adventure']['owned']==before['adventure']['owned'])
   reload_saved('first fitting return');characters();page.locator('#chars-name').fill('Workshop separate character');page.locator('[data-rpg="chars-create"]').click();page.wait_for_function('()=>Realm.state.visitor.name==="Workshop separate character"');render()
   check('native new character does not inherit prior fitting or survey',state()['adventure']['pursuit']['fittings']=={} and state()['adventure']['pursuit']['active'] is None)
   characters()
   prior=page.locator('[data-rpg="chars-switch"]').get_attribute('data-id');page.locator('[data-rpg="chars-switch"]').click();page.wait_for_function('id=>Realm.diagnostics.characters.active===id',arg=prior);render()
   check('switching back retains first fitting and earned partial survey',state()['adventure']['pursuit']['fittings']['trail_blade']==1 and state()['adventure']['pursuit']['active']['id']=='riverbank-survey/5')
   check('original tab owns actual native character writer lock',ev('()=>Realm.diagnostics.characters.writer'))
   original=page;page=attach(context.new_page());page.wait_for_function('()=>Realm.diagnostics.characters.mode==="managed"')
   check('second native tab cannot acquire the same character writer lock',not ev('()=>Realm.diagnostics.characters.writer'))
   guide('trail_blade');before=state();saved=raw(LIBRARY);page.locator('[data-rpg="pursuit-recipe"][data-id="trail_blade"]').click();render()
   check('actual read-only tab fitting refuses without changing live fields',state()==before)
   check('actual read-only tab fitting preserves prior fitting receipts and native library',raw(LIBRARY)==saved and state()['adventure']['pursuit']['fittings']['trail_blade']==1)
   check('read-only tab explains actual writer refusal','cannot write' in page.locator('#toast').inner_text())
   page.close();page=original;guide('trail_blade');before=assert_ui_refusal('managed library second fitting','[data-rpg="pursuit-recipe"][data-id="trail_blade"]',LIBRARY)
   page.locator('[data-rpg="pursuit-recipe"][data-id="trail_blade"]').click();render()
   check('original writer can complete the finite second fitting',state()['adventure']['pursuit']['fittings']['trail_blade']==2 and before['adventure']['ore']-state()['adventure']['ore']==6 and before['adventure']['coins']-state()['adventure']['coins']==8 and before['sandbox']['inventory']['fiber']-state()['sandbox']['inventory']['fiber']==4)
   check('completed finite fitting keeps the original survey and weapon',state()['adventure']['pursuit']['active']==before['adventure']['pursuit']['active'] and state()['adventure']['equipment']==before['adventure']['equipment'])
   reload_saved('managed complete fitting return',LIBRARY);report['returning_managed_output']=state()
  with disposable_context(pw,'firstlight-workshop-socket-') as context:
   page=attach(context.new_page(),json.loads(fixture_paths['socket'].read_text(encoding='utf8')));inspect_item('copper_bow');page.locator('#rpg-socket').select_option('moonstone')
   before=assert_ui_refusal('actual C veteran socket swap','[data-rpg="socket"][data-id="copper_bow"]');page.locator('[data-rpg="socket"][data-id="copper_bow"]').click();render()
   check('successful actual C swap returns ruby and spends exactly one moonstone',state()['adventure']['arsenal']['sockets']['copper_bow']=='moonstone' and state()['adventure']['arsenal']['gems']['ruby']==before['adventure']['arsenal']['gems']['ruby']+1 and state()['adventure']['arsenal']['gems']['moonstone']==before['adventure']['arsenal']['gems']['moonstone']-1)
   check('socket swap retains existing weapon identity, other socket and historical work',state()['adventure']['owned']==before['adventure']['owned'] and state()['adventure']['equipment']==before['adventure']['equipment'] and state()['adventure']['arsenal']['sockets']['trail_bow']=='amber' and state()['adventure']['arsenal']['rangeMedal']==before['adventure']['arsenal']['rangeMedal'])
   reload_saved('veteran socket return');report['veteran_socket_output']=state()
 check('all focused native-browser paths have no runtime page errors',not report['browser_errors'])
 report['passed']=True
except Exception as e:
 report['errors'].append(str(e));report['traceback']=traceback.format_exc();report['passed']=False
 try:page.screenshot(path=str(OUT/'FAILURE.png'))
 except Exception:pass
 raise
finally:
 (OUT/'REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8');server.shutdown()
