"""Road After Rain production UI with command-earned worlds and isolated storage.
Accelerated walking and setup verify rules/controls, not human pacing or enjoyment.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import hashlib, json, tempfile, threading, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'evidence10/earth-story-browser';OUT.mkdir(parents=True,exist_ok=True)
report={'method':__doc__,'checks':[],'errors':[],'browser_errors':[],'html_sha256':hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()}
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kw):super().__init__(*args,directory=str(ROOT),**kw)
    def log_message(self,*_args):pass
def check(name,value):
    report['checks'].append({'name':name,'passed':bool(value)});print(('PASS ' if value else 'FAIL ')+name,flush=True)
    if not value:raise AssertionError(name)
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
try:
  with tempfile.TemporaryDirectory(prefix='firstlight-rain-') as profile,sync_playwright() as pw:
    context=pw.chromium.launch_persistent_context(profile,**chromium_launch_kwargs(),viewport={'width':1280,'height':800})
    page=context.new_page();page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
    page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
    response=page.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='load');page.wait_for_function('()=>!!window.Realm')
    check('browser loaded exact current build',hashlib.sha256(response.body()).hexdigest()==report['html_sha256'])
    ev=lambda js,arg=None:page.evaluate(js,arg)
    state=lambda:ev('()=>Realm.state')
    def render():ev("()=>{Realm.test.quality('low');Realm.test.render()}")
    def close():
      if page.locator('#rpg-window').evaluate('(e)=>e.open'):page.locator('#rpg-close').click()
    def walk(x,z):
      close();r=ev('([x,z])=>{const r=Realm.test.move(x,z);if(!r.ok)return r;for(let i=0;i<4500&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render();const p=Realm.diagnostics.adventure.player;return{ok:Math.hypot(p.x-x,p.z-z)<.3}}',[x,z]);check(f'walk reaches {x},{z}',r.get('ok'))
    def click(action,id=None):
      selector=f'[data-rpg="rain-{action}"]'+(f'[data-id="{id}"]' if id else '')
      page.locator(selector).click();render()
    def enter():
      walk(0,23);page.keyboard.press('e');render();page.locator('[data-rpg="earth-confirm"]').click();render();walk(0,10)
    def reload():
      close();ev('()=>Realm.test.save()');before=state();page.reload();page.wait_for_function('()=>!!window.Realm');render();check('reload preserves story and unpaid entitlement at valley checkpoint',state()['adventure']['earthStory']==before['adventure']['earthStory'] and ev('()=>Realm.diagnostics.scene')=='valley');enter()
    routes={'fresh-blade-detour':('detour',['detour-ridge','detour-shelter','detour-mark']),'fresh-bow-quarry':('quarry',['quarry-reserve','quarry-grade']),'veteran-mill':('mill',['mill-root','mill-gate'])}
    for variant,(route,steps) in routes.items():
      close();fixture=json.loads((ROOT/'docs/evidence/road-after-rain'/f'{variant}_SOURCE.json').read_text(encoding='utf-8'));ev('(w)=>Realm.test.replace(w)',fixture);render();before=state();enter();walk(7,5);page.keyboard.press('e');render()
      content=page.locator('#rpg-content').inner_text()
      check(variant+' contract declares all routes, cost, reward and escort method',all(t in content for t in ['Ansel','Darric','detour','2 timber','3 copper ore','4 sunmarks','2 fibre','0 XP','offscreen','Sunward Beacon']))
      check(variant+' inspection grants no hidden progress',not state()['adventure']['earthStory']['accepted'])
      if route=='detour':
        page.screenshot(path=str(OUT/'CONTRACT.png'));camera=ev('()=>Realm.diagnostics.camera.preset');page.keyboard.press('v');render();check('dialog consumes camera shortcut',ev('()=>Realm.diagnostics.camera.preset')==camera)
      click('accept');check(variant+' explicit accept preserves inventory',state()['sandbox']['inventory']==before['sandbox']['inventory']);reload()
      for i,id in enumerate(steps):
        walk(7,5);page.keyboard.press('e');render();click('walk',id)
        ev('()=>{for(let i=0;i<4500&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render()}');point=ev('(id)=>RealmEarthStory.STEPS.find(s=>s.id===id)',id)
        check('task navigation uses real path to '+id,ev('([x,z])=>Math.hypot(Realm.diagnostics.adventure.player.x-x,Realm.diagnostics.adventure.player.z-z)<.3',[point['x'],point['z']]))
        if id=='detour-ridge':check('ridge prompt favors available scouting over a blocked repair','Survey the ridge' in page.locator('#context').inner_text())
        if id=='mill-gate':
          jammed=ev('()=>Realm.test.millGate()');before_work=state()
          check('gate remains jammed after root clearance',not jammed['gate']['repaired'] and any(p['millPart']=='jammed-brace' for p in jammed['parts']))
          check('mapped gate has five vertical planks and three fixed members',sum(p['kind']=='timber-panel' for p in jammed['parts'])==8 and sum(p['millPart']=='leaf-plank' for p in jammed['parts'])==5)
          check('gate details stay out of camera and walking authority',all(not p['cameraSolid'] for p in jammed['parts']) and ev('()=>RealmEarth.walkable(7,-7)&&RealmEarth.walkable(5.6,-5.6)&&!RealmEarth.walkable(0,-12)'))
          for mode in ['third','diorama']:
            if (ev('()=>Realm.diagnostics.camera.projection')=='orthographic')!=(mode=='diorama'):page.keyboard.press('v')
            ev('()=>Realm.test.view({yaw:.95,elevation:.36,distance:7.2})');render();page.screenshot(path=str(OUT/('GATE_JAMMED_'+mode.upper()+'.png')))
          page.keyboard.press('e');render()
          task=page.locator('[data-rain-task="mill-gate"]');task.scroll_into_view_if_needed()
          text=task.inner_text();report['pre_repair_ui']=text;check('repair comparison identifies present and proposed change with explicit cost','CURRENT · JAMMED' in text and 'AFTER YOUR REPAIR' in text and 'Cost: 2 timber' in text and task.locator('[data-rpg="rain-step"]').count()==1)
          check('inspection and camera selection grant no repair',state()['adventure']==before_work['adventure'] and state()['sandbox']==before_work['sandbox'])
          page.screenshot(path=str(OUT/'GATE_COMPARISON.png'))
        else:page.keyboard.press('e');render()
        click('step',id);check('accepted local interaction completes '+id,id in state()['adventure']['earthStory']['steps'])
        if id=='mill-gate':
          repaired=ev('()=>Realm.test.millGate()');earned=state();report['mill_gate']={'before':jammed,'after':repaired}
          check('accepted repair raises leaf and adds braced hardware',repaired['gate']['repaired'] and abs(repaired['gate']['center'][1]-jammed['gate']['center'][1]-.74)<1e-6 and any(p['millPart']=='repair-brace' for p in repaired['parts']) and not any(p['millPart']=='jammed-brace' for p in repaired['parts']))
          text=page.locator('[data-rain-task="mill-gate"]').inner_text();check('completed comparison does not offer another timber spend','CURRENT · REPAIRED' in text and '2 timber already spent' in text and page.locator('[data-rpg="rain-step"][data-id="mill-gate"]').count()==0)
          check('completed introduction recognizes repaired gate','Ansel’s headrace gate is braced and working.' in page.locator('#rpg-content').inner_text())
          camera=ev('()=>Realm.state.settings.cameraViews');click('watch','mill-gate')
          check('local watch restores game focus and prior running state',not page.locator('#rpg-window').evaluate('(e)=>e.open') and not ev('()=>Realm.diagnostics.adventure.paused') and ev('()=>document.activeElement.id')=='world')
          check('watch changes no earned state or camera preferences',state()==earned and ev('()=>Realm.state.settings.cameraViews')==camera)
          for mode in ['third','diorama']:
            if (ev('()=>Realm.diagnostics.camera.projection')=='orthographic')!=(mode=='diorama'):page.keyboard.press('v')
            ev('()=>Realm.test.view({yaw:.95,elevation:.36,distance:7.2})');render();page.screenshot(path=str(OUT/('GATE_REPAIRED_'+mode.upper()+'.png')))
          ev('()=>Realm.test.pause(true)');page.keyboard.press('e');render();click('watch','mill-gate')
          check('watch preserves an explicitly paused game',ev('()=>Realm.diagnostics.adventure.paused'));ev('()=>Realm.test.pause(false)')
          page.keyboard.press('e');render()

        close();page.keyboard.press('v');render();check('camera switch retains '+id,id in state()['adventure']['earthStory']['steps'])
        if route=='mill' and i==1:
          ev('()=>Realm.test.view({yaw:-.7,elevation:.36,distance:10})');render();page.screenshot(path=str(OUT/'REPAIRED_MILL.png'))
        if i==0:reload()
      if route=='mill':
        # Normal RAF in a separate page, derived from the command-earned repair.
        normal_context=context.browser.new_context(viewport={'width':1280,'height':800});normal=normal_context.new_page();normal.on('pageerror',lambda e:report['browser_errors'].append('normal-time gate: '+str(e)));normal.add_init_script('window.__ETERNITIES_TEST_MODE=true;');normal.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='load');normal.wait_for_function('()=>!!window.Realm');normal.evaluate('(w)=>Realm.test.replace(w)',state())
        def nw(x,z):
          result=normal.evaluate('([x,z])=>{const r=Realm.test.move(x,z);if(!r.ok)return r;for(let i=0;i<4500&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render();return r}',[x,z]);assert result['ok']
        nw(0,23);normal.keyboard.press('e');normal.locator('[data-rpg="earth-confirm"]').click();nw(7,-7)
        normal.keyboard.press('e');normal.locator('[data-rpg="rain-watch"]').click();normal.evaluate('()=>Realm.test.render()');w1=normal.evaluate('()=>Realm.test.millGate().wheel');normal.wait_for_timeout(300);w2=normal.evaluate('()=>Realm.test.millGate().wheel')
        check('normal-time watch advances the actually submitted repaired wheel',w1!=w2)
        normal.evaluate('()=>{Realm.test.pause(true);Realm.test.render()}');w1=normal.evaluate('()=>Realm.test.millGate().wheel');normal.wait_for_timeout(300);w2=normal.evaluate('()=>Realm.test.millGate().wheel');check('normal-time explicit pause freezes the submitted wheel',w1==w2)
        normal.evaluate("()=>{Realm.test.pause(false);let w=Realm.state;w.settings.reducedMotion=true;Realm.test.replace(w)}");nw(0,23);normal.keyboard.press('e');normal.locator('[data-rpg="earth-confirm"]').click();nw(7,-7);normal.evaluate('()=>Realm.test.render()');w1=normal.evaluate('()=>Realm.test.millGate().wheel');normal.wait_for_timeout(300);w2=normal.evaluate('()=>Realm.test.millGate().wheel');check('normal-time reduced motion freezes the repaired silhouette',w1==w2);normal_context.close()
      walk(7,5);page.keyboard.press('e');render()
      if route=='mill':check('remote repaired-gate action offers actual walking rather than watch',page.locator('[data-rpg="rain-watch"]').count()==0 and page.locator('[data-rpg="rain-walk"][data-id="mill-gate"]').count()==1)
      check('only completed route can be dispatched',page.locator('[data-rpg="rain-dispatch"]').count()==1);click('dispatch',route);check('explicit dispatch keeps payment unpaid',not state()['adventure']['earthStory']['claimed']);reload();walk(0,-43);page.keyboard.press('e');render();click('arrive');check('arrival is visible before payment',state()['adventure']['earthStory']['arrived'] and not state()['adventure']['earthStory']['claimed']);reload();walk(0,-43);page.keyboard.press('e');render();click('claim');paid=state()
      check(variant+' one exact payment',paid['adventure']['ore']==before['adventure']['ore']+3 and paid['adventure']['coins']==before['adventure']['coins']+4 and paid['sandbox']['inventory']['fiber']==before['sandbox']['inventory']['fiber']+2)
      check(variant+' only declared timber cost',paid['sandbox']['inventory']['wood']==before['sandbox']['inventory']['wood']-(2 if route=='mill' else 0))
      check(variant+' gear and prior systems unchanged',all(paid['adventure'][k]==before['adventure'][k] for k in ['xp','equipment','owned','arsenal','starter','pursuit','classPath','road','beacon','crossing','companion']))
      close();result=ev('()=>Realm.test.adventure("rain-ui-new-request","earth-story-claim")');check(variant+' changed request cannot repay',not result['ok'] and state()==paid)
      if route=='detour':
        page.keyboard.press('v');ev('()=>Realm.test.view({yaw:.8,elevation:.38,distance:12})');render();page.screenshot(path=str(OUT/'DELIVERY_THIRD.png'))
        page.keyboard.press('v');render();page.screenshot(path=str(OUT/'DELIVERY_DIORAMA.png'))
      reload();check(variant+' paid story survives reload',state()['adventure']['earthStory']['claimed'])
    # Labelled synthetic capacity boundary derived from a command-earned unpaid delivery.
    close();boundary=json.loads((ROOT/'docs/evidence/road-after-rain/UNPAID_EARNED.json').read_text(encoding='utf-8'));boundary['adventure']['ore']=9999;ev('(w)=>Realm.test.replace(w)',boundary);render();enter();walk(0,-43);page.keyboard.press('e');render();blocked=state();click('claim')
    check('capacity-blocked UI preserves all inventory and unpaid story',state()==blocked)
    check('capacity refusal explains how to retry','Make room for all 3 copper' in page.locator('#toast').inner_text())
    close();retry=state();retry['adventure']['ore']=9990;ev('(w)=>Realm.test.replace(w)',retry);render();enter();walk(0,-43);page.keyboard.press('e');render();click('claim');check('cleared capacity allows the same earned entitlement once',state()['adventure']['earthStory']['claimed'] and state()['adventure']['ore']==9993)
    # One whole-world owner has the delivery; a new character receives no work or payment.
    close();original=ev('()=>Realm.diagnostics.characters.active');old=state()
    def library():
      close();page.locator('[data-rpg="open"][data-id="more"]').first.click();page.locator('#rpg-content [data-rpg="open"][data-id="characters"]').click()
    library();page.locator('#chars-name').fill('Rain witness');page.locator('#chars-create-submit').click();page.wait_for_function('(id)=>Realm.diagnostics.characters.active!==id',arg=original);render()
    check('new character inherits neither accepted work nor claimed reward',not state()['adventure']['earthStory']['accepted'] and state()['adventure']['ore']==0)
    restored='character-1' if original=='legacy' else original;library();page.locator(f'[data-rpg="chars-switch"][data-id="{restored}"]').click();page.wait_for_function('(id)=>Realm.diagnostics.characters.active===id',arg=restored);render()
    check('returning character retains its own completed story',state()['adventure']['earthStory']==old['adventure']['earthStory']);close();enter();page.set_viewport_size({'width':390,'height':844});page.keyboard.press('m');render();click('open');check('compact story actions have no horizontal overflow',page.locator('#rpg-content').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'));page.screenshot(path=str(OUT/'COMPACT_STORY.png'))
    check('no runtime errors',not report['browser_errors']);context.close()
except Exception as e:
  report['errors'].append(str(e));traceback.print_exc()
finally:
  server.shutdown();server.server_close();(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(f"Road After Rain browser checks: {sum(x['passed'] for x in report['checks'])}/{len(report['checks'])}; errors: {len(report['errors'])}",flush=True)
if report['errors'] or report['browser_errors']:raise SystemExit(1)
