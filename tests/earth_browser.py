"""Hearthwater E1 UI, physical routes, cameras and safe source-side persistence.

This suite uses only synthetic/current checked-in fixtures. It verifies geography and
boundary integrity, not human pacing or performance qualification.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import hashlib, json, tempfile, threading, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'evidence10/earth-browser';OUT.mkdir(parents=True,exist_ok=True)
report={'method':__doc__,'checks':[],'errors':[],'browser_errors':[],'software_quality':'low','html_sha256':hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()}
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kw):super().__init__(*args,directory=str(ROOT),**kw)
    def log_message(self,*_args):pass
def check(name,value):
    report['checks'].append({'name':name,'passed':bool(value)});print(('PASS ' if value else 'FAIL ')+name,flush=True)
    if not value:raise AssertionError(name)
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/'
try:
  with tempfile.TemporaryDirectory(prefix='firstlight-earth-') as profile,sync_playwright() as pw:
    context=pw.chromium.launch_persistent_context(profile,**chromium_launch_kwargs(),viewport={'width':1280,'height':800})
    page=context.new_page();page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
    page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
    response=page.goto(url,wait_until='load');page.wait_for_function('()=>!!window.Realm')
    check('exact generated build loads',hashlib.sha256(response.body()).hexdigest()==report['html_sha256'])
    ev=lambda js,arg=None:page.evaluate(js,arg)
    state=lambda:ev('()=>Realm.state')
    scene=lambda:ev('()=>Realm.diagnostics.scene')
    def render():ev("()=>{if(Realm.state.settings.quality!=='low')Realm.test.quality('low');Realm.test.render()}")
    def close():
      if page.locator('#rpg-window').evaluate('(e)=>e.open'):page.locator('#rpg-close').click()
    def walk(x,z):
      r=ev('([x,z])=>{const r=Realm.test.move(x,z);if(!r.ok)return r;for(let i=0;i<3500&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render();const p=Realm.diagnostics.adventure.player;return{ok:Math.hypot(p.x-x,p.z-z)<.25}}',[x,z])
      check(f'production walking reaches {x},{z}',r.get('ok'))
    def enter():
      close();walk(0,23);page.keyboard.press('e');render()
      check('physical trail marker opens explicit preview',page.locator('[data-rpg="earth-confirm"]').count()==1)
      page.locator('[data-rpg="earth-confirm"]').click();render();check('explicit input enters Hearthwater',scene()=='earth-hearthwater-approach')
    def shoulder_probe(label):
      before_probe=state();render()
      data=ev('''()=>{const d=Realm.test.earthShoulder(),R=RealmEngine,M=R.M,parts=d.parts.filter(p=>p.quarryShoulder),strips=d.parts.filter(p=>p.terrain&&p.p[0]+p.s[0]/2===18&&p.p[2]>=-23.75&&p.p[2]<=-6.25),matrix=p=>p.m||M.compose(...p.p,...p.s,...(p.r||[0,0,0])),at=(p,v)=>M.transform(matrix(p),v),mesh=R.geometry('bank-slope');
        const seam=strips.every(row=>{const p=parts.find(p=>row.p[2]>=p.seam[0][2]&&row.p[2]<=p.seam[1][2]);if(!p)return false;const a=at(p,[0,1,-.5]),b=at(p,[0,1,.5]);return[-.5,0,.5].every(z=>{const v=at(row,[.5,-.5,z]),t=(v[2]-a[2])/(b[2]-a[2]);return Math.abs(v[1]-a[1]-(b[1]-a[1])*t)<2e-6;});});
        const feet=parts.every(p=>{for(let i=0;i<mesh.length;i+=6)if(Math.abs(mesh[i+1]+.03)<1e-6&&at(p,Array.from(mesh.slice(i,i+3)))[1]>=R.WATER_HEIGHT-.17)return false;return true;});
        return{frame:d.frame,parts,stripCount:strips.length,seam,feet,cameraExcluded:parts.every(p=>R.solidBounds(p.kind,p)===null),finite:parts.every(p=>p.m.every(Number.isFinite)&&p.s.every(v=>v>0)),scene:Realm.diagnostics.scene};}''')
      report.setdefault('shoulder_states',{})[label]=data
      check(label+' submits nine tapering rock sections and thirty-six source strips',data['frame']['partCount']==9 and data['frame']['triangles']==648 and data['stripCount']==36)
      check(label+' actual submitted seam matches every grass underside',data['seam'])
      check(label+' actual lower profile remains submerged',data['feet'])
      check(label+' finite art has no camera authority',data['finite'] and data['cameraExcluded'])
      check(label+' scenery inspection changes no saved world data',state()==before_probe)
    render();walk(0,27);page.keyboard.press('e');render()
    check('existing Lantern Pier rest interaction remains independent',scene()=='valley' and page.locator('[data-rpg="earth-confirm"]').count()==0 and 'quiet moment beside the water' in state()['journal'][-1]['text'])
    render();page.keyboard.press('m');render()
    check('Earth invitation appears beside existing realm invitations',page.locator('[data-rpg="earth-invitation"]').count()==1)
    page.locator('[data-rpg="earth-invitation"]').click();text=page.locator('#rpg-content').inner_text()
    check('remote terms explain work, gates and source-side return',all(t in text for t in ['no new payout','Oren','Bellweather','Return is available']))
    check('remote invitation cannot enter before physical arrival',page.locator('[data-rpg="earth-confirm"]').count()==0)
    page.locator('[data-rpg="earth-walk"][data-id="gate"]').click();ev('()=>{for(let i=0;i<3000&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render()}')
    check('map invitation walks to lake rather than teleporting',scene()=='valley' and ev('()=>Math.hypot(Realm.diagnostics.adventure.player.x,Realm.diagnostics.adventure.player.z-23)<.25'))
    page.keyboard.press('e');render();before=state();page.screenshot(path=str(OUT/'TRAVEL_PREVIEW.png'))
    page.locator('[data-rpg="earth-confirm"]').click();render()
    check('fresh visitor can enter with no class or campaign advancement',scene()=='earth-hearthwater-approach' and state()==before)
    check('Earth diagnostics report supported ground',ev('()=>Realm.diagnostics.earth.walkable'))
    check('E1 introduces no enemies',ev('()=>Realm.diagnostics.adventure.enemies.length')==0)
    check('return is available immediately',page.locator('#earth-home').is_visible())
    walk(0,10);walk(-13,4);page.keyboard.press('e');render()
    check('unassigned visitor sees worksite danger and kit requirement',page.locator('[data-rpg="earth-confirm"]').count()==0 and 'expedition kit' in page.locator('#rpg-content').inner_text())
    close();walk(0,24)
    ev('()=>Realm.test.view({yaw:.15,elevation:.30,distance:10})');render();page.screenshot(path=str(OUT/'ARRIVAL_THIRD.png'))
    # Western orchard route.
    for x,z in [(0,10),(-8,3),(-14,-12),(-12,-23),(-10,-30),(0,-35),(0,-43)]:walk(x,z)
    page.keyboard.press('e');render();content=page.locator('#rpg-content').inner_text()
    check('north boundary explains that existing Bellweather gates remain authoritative','Sunward Beacon' in content and 'prerequisites' in content)
    close();page.keyboard.press('v');render()
    check('diorama works on connected Earth ground',ev('()=>Realm.diagnostics.camera.projection')=='orthographic');page.screenshot(path=str(OUT/'BELLWEATHER_ROAD_DIORAMA.png'))
    # Eastern ridge return proves both routes inhabit one physical scene.
    for x,z in [(0,-35),(12,-26),(16.8,-22)]:walk(x,z)
    shoulder_probe('diorama quarry')
    ev('()=>Realm.test.view({yaw:1.3,elevation:.65,half:12,zoom:.7})');render();page.screenshot(path=str(OUT/'QUARRY_SHOULDER_DIORAMA.png'))
    page.keyboard.press('v');render();shoulder_probe('third-person quarry')
    ev('()=>Realm.test.view({yaw:1.3,elevation:.4,distance:9})');render();page.screenshot(path=str(OUT/'QUARRY_SHOULDER_THIRD.png'))
    rejected_before=state();outboard=ev('()=>Realm.test.move(18.3,-18)')
    check('visible rock outside the ridge never extends ground',not outboard['ok'] and state()==rejected_before)
    check('downward picking accepts the road and rejects decorative rock',ev('()=>!!RealmEarth.pick([16.8,20,-18],[0,-1,0])&&RealmEarth.pick([18.3,20,-18],[0,-1,0])===null'))
    for x,z in [(16.8,-13),(16,-7),(14,-12),(7,2),(0,10),(0,24)]:walk(x,z)
    check('both approaches remain one continuous scene',scene()=='earth-hearthwater-approach')
    check('walking changed no durable adventure systems',all(state()['adventure'][k]==before['adventure'][k] for k in ['xp','owned','equipment','starter','pursuit','road','beacon','crossing','classPath','companion','arsenal']))
    page.locator('#earth-home').click();render()
    check('return restores exact lake checkpoint',scene()=='valley' and state()['player']==before['player'])
    ev('()=>Realm.test.save()');saved=state();page.reload();page.wait_for_function('()=>!!window.Realm');render()
    check('reload remains on acknowledged valley side',scene()=='valley' and state()['player']==saved['player'])
    # Returning equipment state survives the route.
    fixture=ROOT/'docs/evidence/classes/HUNTER_SOURCE.json';returning=json.loads(fixture.read_text(encoding='utf-8'));returning['settings']['reducedMotion']=True
    ev('(w)=>Realm.test.replace(w)',returning);render();before_returning=state();enter()
    check('returning Hunter equipment and fittings remain unchanged',state()['adventure']['equipment']==before_returning['adventure']['equipment'] and state()['adventure']['arsenal']==before_returning['adventure']['arsenal'])
    page.locator('#earth-home').click();render();check('returning history survives Earth round trip',all(state()['adventure'][k]==before_returning['adventure'][k] for k in before_returning['adventure'] if k!='elapsed'))
    # A returning bow Hunter accepts real work, clears it through the orchard
    # entrance, reloads an unpaid run, and receives precisely one normal payout.
    walk(11,9);page.keyboard.press('e');render()
    page.locator('#rpg-content [data-rpg="open"][data-id="pursuit"]').first.click();render()
    page.locator('[data-rpg="pursuit-start"]').click();render();close()
    run=state()['adventure']['pursuit']['active']['id'];prior=state()['adventure']['pursuit']['claimed']
    def worksite():
      enter();walk(0,10);walk(-13,4);page.keyboard.press('e');render()
      check('orchard sign declares current objectives and exact survey reward',all(t in page.locator('#rpg-content').inner_text() for t in ['Materials survey','3 ore, 4 sunmarks and 2 fibre','southern worksite exit']))
      page.locator('[data-rpg="earth-confirm"]').click();render();check('orchard confirmation enters existing combat scene',scene()=='riverbank')
    worksite()
    check('riverbank uses the equipped bow and original run identity',ev('()=>Realm.diagnostics.adventure.weapon.style')=='bow' and state()['adventure']['pursuit']['active']['id']==run)
    page.keyboard.press('m');render();check('riverbank map names the orchard return', 'orchard lane' in page.locator('#rpg-content').inner_text())
    check('riverbank route map is readable rather than icon-sized',page.locator('#starter-map').bounding_box()['height']>200);close()
    def command(kind,payload=None):
      result=ev('([t,p])=>Realm.test.adventure("earth-browser-"+t+"-"+performance.now(),t,p)',[kind,payload or {}]);check('accepted '+kind,result.get('ok'));return result
    def fight(objective):
      result=ev('''objective=>{const cmd=(t,p={})=>Realm.test.adventure('earth-fight-'+t+'-'+performance.now(),t,p);let e=Realm.diagnostics.adventure.enemies.find(e=>e.id.endsWith(':'+objective));if(!e)throw Error('missing encounter '+objective);const id=e.id;cmd('target-select',{id});if(!Realm.diagnostics.adventure.tactics.auto)cmd('auto-toggle');
       for(let i=0;i<3500;i++){const d=Realm.diagnostics.adventure,a=Realm.state.adventure;e=d.enemies.find(e=>e.id===id);if(!e||e.hp<=0){cmd('target-clear');return true;}if(a.hp<=0)return false;if(a.hp<48&&a.tonics)cmd('heal');if(e.mode==='windup'&&a.stamina>=20&&a.elapsed>=d.tactics.cooldowns.guard)cmd('guard');if(!Realm.test.path.length&&(Math.hypot(d.player.x-e.x,d.player.z-e.z)>=d.weapon.reach-.2||!RealmStarter.line(d.player,e))){const rad=d.weapon.style==='bow'?5:1.6;for(let j=0;j<16;j++){const x=e.x+Math.sin(j*Math.PI/8)*rad,z=e.z+Math.cos(j*Math.PI/8)*rad;if(RealmStarter.walkable(x,z)&&RealmStarter.line({x,z},e)&&Realm.test.move(x,z).ok)break;}}Realm.test.step(.1);}return false;}''',objective)
      check('production bow combat clears '+objective,result)
    walk(-7,3);fight('west');walk(-7,3);page.keyboard.press('e');render()
    check('accepted pickup updates the same survey',state()['adventure']['pursuit']['active']['samples']==['west-sample'])
    command('target-clear');ev('()=>Realm.test.save()');page.reload();page.wait_for_function('()=>!!window.Realm');render()
    check('partial survey reload returns to lake with earned objective intact',scene()=='valley' and state()['adventure']['pursuit']['active']['defeated']==['west'])
    worksite();check('re-entry does not recreate the cleared encounter',not ev('()=>Realm.diagnostics.adventure.enemies.some(e=>e.id.endsWith(":west"))'))
    walk(5,-3);fight('east');walk(5,-11);page.keyboard.press('e');render()
    check('both survey objectives complete without a road payout',len(state()['adventure']['pursuit']['active']['samples'])==2 and state()['adventure']['pursuit']['claimed']==prior)
    walk(0,12);page.keyboard.press('e');render()
    check('normal exit input returns to exact orchard checkpoint',scene()=='earth-hearthwater-approach' and ev('()=>Math.hypot(Realm.diagnostics.adventure.player.x+13,Realm.diagnostics.adventure.player.z-4)<.25'))
    check('following companion arrives on the same supported route',ev('()=>!Realm.state.adventure.companion.bonded || (Realm.diagnostics.adventure.companion.room===RealmEarth.ROOM&&RealmEarth.walkable(Realm.diagnostics.adventure.companion.x,Realm.diagnostics.adventure.companion.z))'))
    page.keyboard.press('v');page.keyboard.press('r');render();page.screenshot(path=str(OUT/'ORCHARD_WORKSITE_DIORAMA.png'))
    page.keyboard.press('v');render();page.screenshot(path=str(OUT/'ORCHARD_WORKSITE_THIRD.png'))
    ev('()=>Realm.test.save()');unpaid=state()['adventure']['pursuit'];page.reload();page.wait_for_function('()=>!!window.Realm');render()
    check('completed unpaid run survives reopen before claim',scene()=='valley' and state()['adventure']['pursuit']==unpaid)
    walk(11,9);page.keyboard.press('e');render()
    before_claim=state();page.locator('[data-rpg="pursuit-claim"]').click();render();after_claim=state()
    check('Oren pays exactly the declared old reward',after_claim['adventure']['ore']-before_claim['adventure']['ore']==3 and after_claim['adventure']['coins']-before_claim['adventure']['coins']==4 and after_claim['sandbox']['inventory']['fiber']-before_claim['sandbox']['inventory']['fiber']==2)
    close();result=ev('(run)=>Realm.test.adventure("earth-retry-different-request","pursuit-claim",{run})',run)
    check('changed request cannot claim the completed outing twice',not result.get('ok') and state()==after_claim)
    # Same live route, two independent character worlds; no personal profile.
    enter();walk(0,10);walk(-13,4);page.keyboard.press('e');render();page.locator('[data-rpg="earth-confirm"]').click();render()
    original_id=ev('()=>Realm.diagnostics.characters.active');original=state()
    def library():
      close();page.locator('[data-rpg="open"][data-id="more"]').first.click();page.locator('#rpg-content [data-rpg="open"][data-id="characters"]').click()
    library();page.locator('#chars-name').fill('Orchard route visitor');page.locator('#chars-create-submit').click();page.wait_for_function('(id)=>Realm.diagnostics.characters.active!==id',arg=original_id);render()
    check('new character receives neither travel state nor survey payout',scene()=='valley' and state()['adventure']['pursuit']['claimed']==0 and not state()['adventure']['started'])
    restored_id='character-1' if original_id=='legacy' else original_id
    library();page.locator(f'[data-rpg="chars-switch"][data-id="{restored_id}"]').click();page.wait_for_function('(id)=>Realm.diagnostics.characters.active===id',arg=restored_id);render()
    check('returning character restores valley checkpoint and its own progress',scene()=='valley' and state()['player']==original['player'] and all(state()['adventure'][k]==original['adventure'][k] for k in ['pursuit','starter','equipment','arsenal','classPath','xp']))
    close();enter();page.set_viewport_size({'width':640,'height':720});render();page.keyboard.press('m');render()
    check('compact Earth map has useful map dimensions',page.locator('#earth-map').bounding_box()['height']>200 and page.locator('#earth-map').bounding_box()['width']>250)
    check('compact map exposes a reachable worksite route',page.locator('[data-rpg="earth-walk"][data-id="riverbank"]').is_visible());page.screenshot(path=str(OUT/'COMPACT_ROUTES.png'))
    page.locator('[data-rpg="earth-walk"][data-id="riverbank"]').click();ev('()=>{for(let i=0;i<3500&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render()}');page.keyboard.press('e');render()
    check('map walks to the real worksite marker in compact view',page.locator('[data-rpg="earth-confirm"]').count()==1 and scene()=='earth-hearthwater-approach')
    check('no runtime browser exceptions',not report['browser_errors'])
    context.close()
except Exception as e:
  report['errors'].append(str(e));traceback.print_exc()
finally:
  server.shutdown();server.server_close();(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(f"Earth browser checks: {sum(x['passed'] for x in report['checks'])}/{len(report['checks'])}; errors: {len(report['errors'])}",flush=True)
if report['errors'] or report['browser_errors']:raise SystemExit(1)
