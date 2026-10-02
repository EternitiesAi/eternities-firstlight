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
    def drover_probe(label,sent=False,arrived=False):
      before=state();render();d=ev('()=>Realm.test.drover()');f=d['frame'];parts=d['parts'];report.setdefault('drover_states',{})[label]=d
      check(label+' one drover and cart use their existing story locations',f['anchor']['x']==(2 if sent else 8.8) and f['anchor']['z']==(-43 if sent else 5) and f['cart']['x']==(-3 if sent else 9.3) and f['cart']['z']==(-43 if sent else 7))
      check(label+' readable load follows confirmed arrival only',sum(p['droverPart']=='flour-sack' for p in parts)==(2 if arrived else 4) and sum(p['droverPart']=='apple' for p in parts)==(0 if arrived else 5) and any(p['droverPart']=='folded-cover' for p in parts)==arrived)
      check(label+' bounded finite submitted parts exclude camera and cutaway authority',len(parts)==f['partCount'] and len(parts)<=160 and all(__import__('math').isfinite(v) for p in parts for v in p['m']+p['p']+p['s']) and all(not p['cameraSolid'] and not p['cutaway'] for p in parts))
      check(label+' wheel rims meet actual terrain',ev('()=>Realm.test.drover().parts.filter(p=>p.droverPart==="wheel-rim").every(p=>Math.abs(p.p[1]-p.s[1]/2-RealmEarth.height(p.p[0],p.p[2]))<.00001)'))
      check(label+' coil grasp shares its submitted transform',ev('()=>{const d=Realm.test.drover(),p=d.parts.find(p=>p.droverPart==="right-hand"),w=RealmEngine.M.transform(d.frame.coilRoot,[.14,.06,0]);return p.p.every((v,i)=>Math.abs(v-w[i])<.00001)}'))
      check(label+' art cannot change consent inventory or payment',state()==before)
      return d
    def drover_photo(label,sent=False):
      close();walk(0 if sent else 7,-43 if sent else 4.2);ev('()=>Realm.test.setTime(16)')
      for mode in ['third','diorama']:
        if (ev('()=>Realm.diagnostics.camera.projection')=='orthographic')!=(mode=='diorama'):page.keyboard.press('v')
        ev('()=>Realm.test.view({yaw:-.15,elevation:Realm.diagnostics.camera.projection==="orthographic"?.78:.28,distance:8.2,zoom:.35,half:8})');render();page.screenshot(path=str(OUT/('FENNA_'+label+'_'+mode.upper()+'.png')))
        check(label+' drover and cart submit in '+mode,ev('()=>Realm.test.drover().frame.partCount')<=160)
    def quarry_probe(label,phase,blocks,grade):
      before=state();render();q=ev('()=>Realm.test.quarry()');f=q['frame'];parts=q['parts'];actor=[p for p in parts if p.get('stoneworkerPart')];report.setdefault('quarry_states',{})[label]=q
      check(label+' Darric retains existing supported quarry anchor',f['actor']['anchor']['x']==14.3 and f['actor']['anchor']['z']==-26 and ev('()=>RealmEarth.walkable(14.3,-26)&&RealmEarth.line({x:12,z:-26},{x:14.3,z:-26})'))
      check(label+' one bounded finite actor submits vest cloth gloves and mallet',len(actor)==f['actor']['partCount'] and len(actor)<=64 and {'vest-back','cloth-knot','left-glove','right-glove','mallet-handle','mallet-head'}.issubset({p['stoneworkerPart'] for p in actor}) and all(__import__('math').isfinite(v) for p in actor for v in p['m']+p['p']+p['s']))
      check(label+' saved work alone selects reserved blocks and flush grade',f['actor']['phase']==phase and len(f['works']['blockIds'])==blocks and len(f['works']['gradeIds'])==grade and sum(p.get('quarryPart')=='reserved-block' for p in parts)==blocks and sum(p.get('quarryPart')=='packed-grade' for p in parts)==grade)
      check(label+' art stays out of camera cutaway and consent authority',all(not p['cameraSolid'] and not p['cutaway'] for p in parts) and state()==before)
      check(label+' both submitted gloves meet the actual mallet handle',ev('()=>{const q=Realm.test.quarry(),a=q.frame.actor;return [["left",-.20],["right",.055]].every(([name,x])=>{const p=q.parts.find(p=>p.stoneworkerPart===name+"-glove"),v=RealmEngine.M.transform(a.toolRoot,[x,0,0]);return p.p.every((n,i)=>Math.abs(n-v[i])<.00001)})}'))
    def quarry_photo(label):
      close();walk(16.4,-24.7);ev('()=>Realm.test.setTime(16)')
      for mode in ['third','diorama']:
        if (ev('()=>Realm.diagnostics.camera.projection')=='orthographic')!=(mode=='diorama'):page.keyboard.press('v')
        ev('()=>Realm.test.view({yaw:-.95,elevation:Realm.diagnostics.camera.projection==="orthographic"?.65:.28,distance:6.2,zoom:.35,half:6})');render();page.screenshot(path=str(OUT/('DARRIC_'+label+'_'+mode.upper()+'.png')))
        check(label+' quarry actor submits in '+mode,ev('()=>Realm.test.quarry().frame.actor.partCount')<=64)
    routes={'fresh-blade-detour':('detour',['detour-ridge','detour-shelter','detour-mark']),'fresh-bow-quarry':('quarry',['quarry-reserve','quarry-grade']),'veteran-mill':('mill',['mill-root','mill-gate'])}
    for variant,(route,steps) in routes.items():
      close();fixture=json.loads((ROOT/'docs/evidence/road-after-rain'/f'{variant}_SOURCE.json').read_text(encoding='utf-8'));ev('(w)=>Realm.test.replace(w)',fixture);render();before=state();enter();walk(7,5);page.keyboard.press('e');render()
      content=page.locator('#rpg-content').inner_text()
      check(variant+' contract declares all routes, cost, reward and escort method',all(t in content for t in ['Ansel','Darric','detour','2 timber','3 copper ore','4 sunmarks','2 fibre','0 XP','offscreen','Sunward Beacon']))
      check(variant+' inspection grants no hidden progress',not state()['adventure']['earthStory']['accepted'])
      if route=='detour':
        page.screenshot(path=str(OUT/'CONTRACT.png'));camera=ev('()=>Realm.diagnostics.camera.preset');page.keyboard.press('v');render();check('dialog consumes camera shortcut',ev('()=>Realm.diagnostics.camera.preset')==camera)
      if route=='detour':drover_probe('unaccepted')
      if route=='quarry':quarry_probe('unaccepted','waiting',3,0)
      click('accept');check(variant+' explicit accept preserves inventory',state()['sandbox']['inventory']==before['sandbox']['inventory'])
      if route=='detour':
        drover_probe('accepted');drover_photo('DEPARTURE')
        # Actual submitted actor and held coil, rendered in isolation; not gameplay.
        pixels=ev('''()=>{const d=Realm.test.drover(),root=d.frame.root,c=document.createElement('canvas'),e=new RealmEngine.Engine(c);e.resize(384,384,1);e.quality='low';e.noWater=true;const g=e.gl,read=()=>{g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);const a=new Uint8Array(384*384*4);g.readPixels(0,0,384,384,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;},diff=(a,b)=>a.reduce((n,v,i)=>n+(v!==b[i]),0),cases=[];for(const projection of['perspective','orthographic']){e.clear();e.setCamera({eye:[2.5,2.5,4.5],target:[0,.95,0],projection,half:1.25,fov:45,aspect:1});e.render(0,16,false);const empty=read();const render=coil=>{e.clear();for(const kind of['box','round','octa'])e.batch(kind,d.parts.filter(p=>p.kind===kind&&p.droverGroup==='actor'&&(coil||!p.droverPart.startsWith('rope-'))).map(p=>{const m=new Float32Array(p.m),v=p.p.map((n,i)=>n-root[12+i]);for(let i=0;i<3;i++)m[12+i]-=root[12+i];return{p:v,s:p.s,m,c:p.c,rough:p.rough};}));e.render(0,16,false);return read();};const body=render(false),full=render(true);cases.push({projection,bodyChannels:diff(empty,body),coilChannels:diff(body,full)});}const result={cases,error:g.getError(),image:c.toDataURL('image/png')};e.disposeSurfaceMaterials();g.getExtension('WEBGL_lose_context').loseContext();return result;}''')
        import base64
        (OUT/'FENNA_ISOLATED.png').write_bytes(base64.b64decode(pixels.pop('image').split(',')[1]));report['drover_framebuffer']=pixels
        for sample in pixels['cases']:
          check('submitted Fenna body contributes isolated pixels in '+sample['projection'],sample['bodyChannels']>1000)
          check('submitted rope coil contributes isolated pixels in '+sample['projection'],sample['coilChannels']>20)
        check('isolated Fenna framebuffer has no WebGL error',pixels['error']==0)
      reload()
      if route=='quarry':quarry_probe('accepted-reloaded','reserved',3,0);quarry_photo('RESERVED')
      for i,id in enumerate(steps):
        walk(7,5);page.keyboard.press('e');render();click('walk',id)
        ev('()=>{for(let i=0;i<4500&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render()}');point=ev('(id)=>RealmEarthStory.STEPS.find(s=>s.id===id)',id)
        check('task navigation uses real path to '+id,ev('([x,z])=>Math.hypot(Realm.diagnostics.adventure.player.x-x,Realm.diagnostics.adventure.player.z-z)<.3',[point['x'],point['z']]))
        if id=='detour-ridge':check('ridge prompt favors available scouting over a blocked repair','Survey the ridge' in page.locator('#context').inner_text())
        if id=='mill-gate':
          jammed=ev('()=>Realm.test.millGate()');before_work=state();ansel=ev('()=>Realm.test.millwright()')
          check('Ansel retains his supported reachable mill anchor',ansel['frame']['anchor']['x']==8.7 and ansel['frame']['anchor']['z']==-6.6 and ev('()=>RealmEarth.walkable(8.7,-6.6)&&RealmEarth.line({x:7,z:-7},{x:8.7,z:-6.6})'))
          check('dedicated apron cap and square submit finite actor parts within budget',len(ansel['parts'])<=64 and len(ansel['parts'])==ansel['frame']['partCount'] and all(__import__('math').isfinite(v) for p in ansel['parts'] for v in p['m']+p['p']+p['s']) and all(not p['cameraSolid'] and not p['cutaway'] for p in ansel['parts']) and {'apron-bib','cap-brim','square-stock','square-blade'}.issubset({p['millwrightPart'] for p in ansel['parts']}))
          check('actor drawing cannot replay repair or payment',state()['adventure']==before_work['adventure'] and state()['sandbox']==before_work['sandbox'])
          # Isolated labelled framebuffer probe of the production submitted NPC.
          pixels=ev("""()=>{const s=Realm.test.millwright(),root=s.frame.root,c=document.createElement('canvas'),e=new RealmEngine.Engine(c);e.resize(384,384,1);e.quality='low';e.noWater=true;const g=e.gl,read=()=>{g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);const a=new Uint8Array(384*384*4);g.readPixels(0,0,384,384,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;},diff=(a,b)=>a.reduce((n,v,i)=>n+(v!==b[i]),0);const results=[];for(const mode of['perspective','orthographic']){e.clear();e.setCamera({eye:[2.5,2.5,4.5],target:[0,.95,0],projection:mode,half:1.25,fov:45,aspect:1});e.render(0,16,false);const empty=read();const render=tool=>{e.clear();for(const kind of['box','round','octa'])e.batch(kind,s.parts.filter(it=>it.kind===kind&&(tool||!it.millwrightPart.startsWith('square-'))).map(it=>{const p=it.p.map((v,i)=>v-root[12+i]),m=new Float32Array(it.m);for(let i=0;i<3;i++)m[12+i]-=root[12+i];return{p,s:it.s,m,c:it.c,rough:it.rough};}));e.render(0,16,false);return read();};const body=render(false),full=render(true);results.push({mode,bodyChannels:diff(empty,body),toolChannels:diff(body,full)});}const result={cases:results,error:g.getError(),image:c.toDataURL('image/png')};e.disposeSurfaceMaterials();g.getExtension('WEBGL_lose_context').loseContext();return result;}""")
          import base64
          (OUT/'ANSEL_ISOLATED.png').write_bytes(base64.b64decode(pixels.pop('image').split(',')[1]));report['millwright_framebuffer']=pixels
          for sample in pixels['cases']:
            check('actual millwright body produces isolated pixels in '+sample['mode'],sample['bodyChannels']>1000)
            check('actual held square contributes isolated pixels in '+sample['mode'],sample['toolChannels']>20)
          check('isolated millwright framebuffer has no WebGL error',pixels['error']==0)
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
        if id.startswith('quarry-'):
          released=id=='quarry-reserve';quarry_probe(id+'-complete','released' if released else 'packed',0,0 if released else 12)
          content=page.locator('[data-rain-task="'+id+'"]').inner_text();check(id+' comparison describes only accepted visual work',('CURRENT · RELEASED' if released else 'CURRENT · PACKED') in content and page.locator('[data-rpg="rain-step"][data-id="'+id+'"]').count()==0)
          earned=state();camera=ev('()=>Realm.state.settings.cameraViews');click('watch',id)
          check(id+' local view restores focus and preserves state',not page.locator('#rpg-window').evaluate('(e)=>e.open') and not ev('()=>Realm.diagnostics.adventure.paused') and ev('()=>document.activeElement.id')=='world' and state()==earned and ev('()=>Realm.state.settings.cameraViews')==camera)
          if released:
            quarry_photo('RELEASED');walk(12,-26)
            pixels=ev("""()=>{const q=Realm.test.quarry(),root=q.frame.actor.root,c=document.createElement('canvas'),e=new RealmEngine.Engine(c);e.resize(384,384,1);e.quality='low';e.noWater=true;const g=e.gl,read=()=>{g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);const a=new Uint8Array(384*384*4);g.readPixels(0,0,384,384,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;},diff=(a,b)=>a.reduce((n,v,i)=>n+(v!==b[i]),0),cases=[];for(const projection of['perspective','orthographic']){e.clear();e.setCamera({eye:[2.5,2.5,4.5],target:[0,.95,0],projection,half:1.25,fov:45,aspect:1});e.render(0,16,false);const empty=read();const render=tool=>{e.clear();for(const kind of['box','round','octa'])e.batch(kind,q.parts.filter(p=>p.kind===kind&&p.stoneworkerPart&&(tool||!p.stoneworkerPart.startsWith('mallet-'))).map(p=>{const m=new Float32Array(p.m),v=p.p.map((n,i)=>n-root[12+i]);for(let i=0;i<3;i++)m[12+i]-=root[12+i];return{p:v,s:p.s,m,c:p.c,rough:p.rough};}));e.render(0,16,false);return read();};const body=render(false),full=render(true);cases.push({projection,bodyChannels:diff(empty,body),toolChannels:diff(body,full)});}const result={cases,error:g.getError(),image:c.toDataURL('image/png')};e.disposeSurfaceMaterials();g.getExtension('WEBGL_lose_context').loseContext();return result;}""")
            import base64
            (OUT/'DARRIC_ISOLATED.png').write_bytes(base64.b64decode(pixels.pop('image').split(',')[1]));report['quarry_framebuffer']=pixels
            for case in pixels['cases']:
              check('submitted quarry body contributes pixels in '+case['projection'],case['bodyChannels']>1000);check('actual mallet contributes pixels in '+case['projection'],case['toolChannels']>20)
            check('isolated quarry pixels have no WebGL error',pixels['error']==0)
          else:
            walk(16.4,-11.3)
            for mode in ['third','diorama']:
              if (ev('()=>Realm.diagnostics.camera.projection')=='orthographic')!=(mode=='diorama'):page.keyboard.press('v')
              ev('()=>Realm.test.view({yaw:1.15,elevation:Realm.diagnostics.camera.projection==="orthographic"?.65:.55,distance:7.8,zoom:.35,half:6})');render();page.screenshot(path=str(OUT/('QUARRY_PACKED_'+mode.upper()+'.png')))
          reload();quarry_probe(id+'-reloaded','released' if released else 'packed',0,0 if released else 12);walk(point['x'],point['z'])
          page.keyboard.press('e');render()
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
          walk(9.7,-4.8)
          for mode in ['third','diorama']:
            if (ev('()=>Realm.diagnostics.camera.projection')=='orthographic')!=(mode=='diorama'):page.keyboard.press('v')
            ev('()=>Realm.test.view({yaw:1.4,elevation:Realm.diagnostics.camera.projection==="orthographic"?.78:.28,distance:5.5,half:8,zoom:.35})');render();page.screenshot(path=str(OUT/('ANSEL_'+mode.upper()+'.png')))
            check('millwright presentation stays submitted in '+mode,ev('()=>Realm.test.millwright().parts.length')==len(ansel['parts']))
            ev('()=>Realm.test.view({yaw:-1.2,elevation:Realm.diagnostics.camera.projection==="orthographic"?.78:.28,distance:5.5,zoom:.35})');render();page.screenshot(path=str(OUT/('ANSEL_FRONT_'+mode.upper()+'.png')))
          walk(7,-7)
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
        def normal_frames():
          normal.evaluate('''()=>new Promise(resolve=>{let start;requestAnimationFrame(function sample(t){if(start===undefined)start=t;if(t-start>=300)resolve();else requestAnimationFrame(sample)})})''')
        def nw(x,z):
          result=normal.evaluate('([x,z])=>{const r=Realm.test.move(x,z);if(!r.ok)return r;for(let i=0;i<4500&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render();return r}',[x,z]);assert result['ok']
        nw(0,23);normal.keyboard.press('e');normal.locator('[data-rpg="earth-confirm"]').click();nw(7,-7);normal.bring_to_front();check('normal-time actor page is visible before sampling',normal.evaluate('()=>!document.hidden'))
        normal.keyboard.press('e');normal.locator('[data-rpg="rain-watch"]').click();normal.evaluate('()=>Realm.test.render()');w1=normal.evaluate('()=>Realm.test.millGate().wheel');normal_frames();w2=normal.evaluate('()=>Realm.test.millGate().wheel')
        check('normal-time watch advances the actually submitted repaired wheel',w1!=w2)
        n1=normal.evaluate('()=>({actor:Realm.test.millwright(),paused:Realm.diagnostics.adventure.paused,reduced:Realm.state.settings.reducedMotion,hidden:document.hidden,visibility:document.visibilityState,wheel:Realm.test.millGate().wheel})');normal_frames();n2=normal.evaluate('()=>({actor:Realm.test.millwright(),paused:Realm.diagnostics.adventure.paused,reduced:Realm.state.settings.reducedMotion,hidden:document.hidden,visibility:document.visibilityState,wheel:Realm.test.millGate().wheel})');report['normal_millwright']={'before':n1,'after':n2};check('normal-time Ansel adjusts the actually submitted hand and square frame',n1['actor']['parts']!=n2['actor']['parts'])
        normal.keyboard.press('e');normal.evaluate('()=>Realm.test.render()');a1=normal.evaluate('()=>Realm.test.millwright().parts');normal_frames();a2=normal.evaluate('()=>Realm.test.millwright().parts');check('repair dialog pauses the complete millwright stance',a1==a2);normal.locator('#rpg-close').click()
        normal.evaluate('()=>{Realm.test.pause(true);Realm.test.render()}');w1=normal.evaluate('()=>Realm.test.millGate().wheel');normal_frames();w2=normal.evaluate('()=>Realm.test.millGate().wheel');check('normal-time explicit pause freezes the submitted wheel',w1==w2)
        a1=normal.evaluate('()=>Realm.test.millwright().parts');normal_frames();a2=normal.evaluate('()=>Realm.test.millwright().parts');check('explicit pause freezes the complete millwright frame',a1==a2)
        normal.evaluate("()=>{Realm.test.pause(false);let w=Realm.state;w.settings.reducedMotion=true;Realm.test.replace(w)}");nw(0,23);normal.keyboard.press('e');normal.locator('[data-rpg="earth-confirm"]').click();nw(7,-7);normal.evaluate('()=>Realm.test.render()');w1=normal.evaluate('()=>Realm.test.millGate().wheel');normal_frames();w2=normal.evaluate('()=>Realm.test.millGate().wheel');check('normal-time reduced motion freezes the repaired silhouette',w1==w2);a1=normal.evaluate('()=>Realm.test.millwright().parts');normal_frames();a2=normal.evaluate('()=>Realm.test.millwright().parts');check('reduced motion holds one connected millwright stance',a1==a2);normal.keyboard.press('e');normal.locator('#rpg-close').click()
        # Fenna uses the same normal-time app clock, independent of personal saves.
        normal.evaluate('()=>{Realm.test.pause(false);let w=Realm.state;w.settings.reducedMotion=false;Realm.test.replace(w)}');nw(0,23);normal.keyboard.press('e');normal.locator('[data-rpg="earth-confirm"]').click();nw(7,5);normal.bring_to_front();normal.evaluate('()=>Realm.test.render()')
        d1=normal.evaluate('()=>({actor:Realm.test.drover(),paused:Realm.diagnostics.adventure.paused,reduced:Realm.state.settings.reducedMotion,hidden:document.hidden})');normal_frames();d2=normal.evaluate('()=>({actor:Realm.test.drover(),paused:Realm.diagnostics.adventure.paused,reduced:Realm.state.settings.reducedMotion,hidden:document.hidden})');report['normal_drover']={'before':d1,'after':d2}
        check('normal-time visible Fenna moves the actually submitted hand and coil',not d1['hidden'] and not d2['hidden'] and d1['actor']['parts']!=d2['actor']['parts'])
        normal.keyboard.press('e');normal.evaluate('()=>Realm.test.render()');d1=normal.evaluate('()=>Realm.test.drover().parts');normal_frames();d2=normal.evaluate('()=>Realm.test.drover().parts');check('delivery dialog pauses the whole drover and load',d1==d2);normal.locator('#rpg-close').click()
        normal.evaluate('()=>{Realm.test.pause(true);Realm.test.render()}');d1=normal.evaluate('()=>Realm.test.drover().parts');normal_frames();d2=normal.evaluate('()=>Realm.test.drover().parts');check('explicit pause freezes whole drover and load',d1==d2)
        normal.evaluate('()=>{Realm.test.pause(false);let w=Realm.state;w.settings.reducedMotion=true;Realm.test.replace(w)}');nw(0,23);normal.keyboard.press('e');normal.locator('[data-rpg="earth-confirm"]').click();nw(7,5);normal.evaluate('()=>Realm.test.render()');d1=normal.evaluate('()=>Realm.test.drover().parts');normal_frames();d2=normal.evaluate('()=>Realm.test.drover().parts');check('reduced motion holds one complete drover stance',d1==d2)
        normal.evaluate('()=>{Realm.test.pause(false);let w=Realm.state;w.settings.reducedMotion=false;Realm.test.replace(w)}');nw(0,23);normal.keyboard.press('e');normal.locator('[data-rpg="earth-confirm"]').click();nw(12,-26);normal.bring_to_front();normal.evaluate('()=>Realm.test.render()')
        q1=normal.evaluate('()=>({q:Realm.test.quarry(),hidden:document.hidden,paused:Realm.diagnostics.adventure.paused})');normal_frames();q2=normal.evaluate('()=>({q:Realm.test.quarry(),hidden:document.hidden,paused:Realm.diagnostics.adventure.paused})');report['normal_quarry']={'before':q1,'after':q2};check('ordinary visible app RAF moves submitted quarry hands and mallet',not q1['hidden'] and not q2['hidden'] and not q1['paused'] and not q2['paused'] and q1['q']['parts']!=q2['q']['parts'])
        normal.keyboard.press('e');normal.evaluate('()=>Realm.test.render()');q1=normal.evaluate('()=>Realm.test.quarry().parts');normal_frames();q2=normal.evaluate('()=>Realm.test.quarry().parts');check('task dialog freezes the whole connected quarry stance',q1==q2);normal.locator('#rpg-close').click()
        normal.evaluate('()=>{Realm.test.pause(true);Realm.test.render()}');q1=normal.evaluate('()=>Realm.test.quarry().parts');normal_frames();q2=normal.evaluate('()=>Realm.test.quarry().parts');check('explicit pause freezes quarry tool and hands',q1==q2)
        normal.evaluate('()=>{Realm.test.pause(false);let w=Realm.state;w.settings.reducedMotion=true;Realm.test.replace(w)}');nw(0,23);normal.keyboard.press('e');normal.locator('[data-rpg="earth-confirm"]').click();nw(12,-26);normal.evaluate('()=>Realm.test.render()');q1=normal.evaluate('()=>Realm.test.quarry().parts');normal_frames();q2=normal.evaluate('()=>Realm.test.quarry().parts');check('reduced motion retains one complete quarry stance',q1==q2);normal_context.close()
      walk(7,5);page.keyboard.press('e');render()
      if route=='mill':check('remote repaired-gate action offers actual walking rather than watch',page.locator('[data-rpg="rain-watch"]').count()==0 and page.locator('[data-rpg="rain-walk"][data-id="mill-gate"]').count()==1)
      check('only completed route can be dispatched',page.locator('[data-rpg="rain-dispatch"]').count()==1);click('dispatch',route);check('explicit dispatch keeps payment unpaid',not state()['adventure']['earthStory']['claimed'])
      if route=='detour':drover_probe('dispatched-not-confirmed',sent=True)
      reload();walk(0,-43);page.keyboard.press('e');render()
      if route=='detour':drover_probe('dispatched-reloaded',sent=True)
      click('arrive');check('arrival is visible before payment',state()['adventure']['earthStory']['arrived'] and not state()['adventure']['earthStory']['claimed'])
      if route=='detour':drover_probe('arrived-unpaid',sent=True,arrived=True);drover_photo('ARRIVAL',sent=True)
      reload();walk(0,-43);page.keyboard.press('e');render()
      if route=='detour':drover_probe('arrived-reloaded',sent=True,arrived=True)
      click('claim');paid=state()
      if route=='detour':drover_probe('paid',sent=True,arrived=True)
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
    close();ev('()=>Realm.test.leave()');render();check('millwright frame is absent outside its Earth scene',ev('()=>Realm.test.millwright()') is None);check('drover frame is absent outside its Earth scene',ev('()=>Realm.test.drover()') is None)
    check('quarry diagnostic frame clears on leaving Earth',ev('()=>Realm.test.quarry()') is None)
    check('no runtime errors',not report['browser_errors']);context.close()
except Exception as e:
  report['errors'].append(str(e));traceback.print_exc()
finally:
  server.shutdown();server.server_close();(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(f"Road After Rain browser checks: {sum(x['passed'] for x in report['checks'])}/{len(report['checks'])}; errors: {len(report['errors'])}",flush=True)
if report['errors'] or report['browser_errors']:raise SystemExit(1)
