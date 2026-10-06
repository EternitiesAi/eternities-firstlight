"""Connected Earth road UI and isolated native-origin persistence.

Command-earned blade/bow inputs use production walking and visible crossing/work
controls. The strongest campaign input is a labelled historical earned fixture.
SwiftShader, accelerated test ticks and screenshots do not qualify GPU speed,
human pacing, mobile play or enjoyment. No personal profile is opened.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import argparse, hashlib, json, os, subprocess, tempfile, threading, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, default=ROOT/'evidence10/earth-road-browser')
args = parser.parse_args()
OUT = args.output.resolve()
if os.name=='nt' and OUT.drive.upper()!='D:': parser.error('Heavy road evidence belongs on D: on Windows')
if OUT==Path(OUT.anchor) or OUT==ROOT or ROOT.is_relative_to(OUT): parser.error('Use a bounded evidence directory, not a game or drive root')
OUT.mkdir(parents=True, exist_ok=False)
report = {'method': __doc__, 'checks': [], 'errors': [], 'browser_errors': [],
          'renderer': 'software SwiftShader', 'quality': 'low',
          'html_sha256': hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest(),
          'states': {}, 'source_hashes': {n: hashlib.sha256((ROOT/'src'/n).read_bytes()).hexdigest()
               for n in ['earth-road.js', 'earth-road-ui.js', 'earth-road-art.js', 'earth.js', 'world-atlantis-earth.js']}}

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw): super().__init__(*a, directory=str(ROOT), **kw)
    def log_message(self, *_): pass

def check(name, value):
    report['checks'].append({'name': name, 'passed': bool(value)})
    print(('PASS ' if value else 'FAIL ')+name, flush=True)
    if not value: raise AssertionError(name)

server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/'
try:
    sources = OUT/'earned-sources'
    subprocess.run(['node', 'tests/earth_road_journey.cjs', '--output', str(sources)], cwd=ROOT, check=True)
    with sync_playwright() as pw:
        for variant in ['blade', 'bow', 'strongest']:
            source = (ROOT/'tests/fixtures/earth-homecoming-prerequisites/strongest/FINAL_WORLD.json'
                      if variant == 'strongest' else sources/variant/'HEARTHWATER_GATE.json')
            raw = json.loads(source.read_text(encoding='utf-8'))
            report.setdefault('inputs', {})[variant] = {'source': str(source), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                   'provenance': 'historical command-earned Chapter IV' if variant == 'strongest' else 'current command-earned road journey'}
            with tempfile.TemporaryDirectory(prefix='isolated-'+variant+'-', dir=OUT) as profile:
                context = None
                def launch():
                    global context, page
                    context = pw.chromium.launch_persistent_context(profile, **chromium_launch_kwargs(), viewport={'width':1280, 'height':800})
                    page = context.new_page()
                    page.on('pageerror', lambda e: report['browser_errors'].append(str(e)))
                    page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
                    response = page.goto(url, wait_until='load')
                    page.wait_for_function('()=>!!window.Realm')
                    check(variant+' exact generated page loads', hashlib.sha256(response.body()).hexdigest() == report['html_sha256'])
                    page.evaluate('''()=>{const p=RealmArt.WorldArt.prototype,original=p.commit;
                      p.commit=function(...a){const r=original.apply(this,a);window.__roadArt=this;return r;};}''')
                def ev(js, arg=None): return page.evaluate(js, arg)
                def state(): return ev('()=>Realm.state')
                def scene(): return ev('()=>Realm.diagnostics.scene')
                def render(): ev("()=>{Realm.test.quality('low');Realm.test.render()}")
                def close():
                    if page.locator('#rpg-window').evaluate('(e)=>e.open'): page.locator('#rpg-close').click()
                def walk(x, z):
                    close()
                    result = ev('''([x,z])=>{let r=Realm.test.move(x,z);if(!r.ok)return r;let frames=0;
                      while(Realm.test.path.length&&frames++<18000)Realm.test.step(.05);
                      Realm.test.render();let p=Realm.diagnostics.adventure.player;
                      return{ok:frames<18000&&Math.hypot(p.x-x,p.z-z)<.25,frames};}''', [x,z])
                    check(variant+f' production walking {scene()} {x},{z}', result.get('ok'))
                def enter_hearth():
                    walk(0,23); page.keyboard.press('e'); render()
                    check(variant+' lake terms require visible confirmation', page.locator('[data-rpg="earth-confirm"]').count() == 1)
                    page.locator('[data-rpg="earth-confirm"]').click(); render()
                    check(variant+' original lake route enters Hearthwater', scene() == 'earth-hearthwater-approach')
                def reach_north():
                    for x,z in [(0,10),(14,-12),(12,-26),(0,-35),(7,-38),(12,-42),(19,-42)]: walk(x,z)
                def road(expected):
                    page.keyboard.press('e'); render()
                    text = page.locator('#rpg-content').inner_text()
                    check(variant+' road declares route danger and original home', all(t in text for t in ['Work and danger','Your original way home','no XP','departure point']))
                    check(variant+' arrived sign offers explicit crossing', page.locator('[data-rpg="earth-road-confirm"]').count() == 1)
                    before = state()
                    camera = ev('()=>Realm.diagnostics.camera.projection')
                    page.keyboard.press('v'); render()
                    check(variant+' view key is consumed inside road dialog', ev('()=>Realm.diagnostics.camera.projection') == camera)
                    if variant == 'blade': page.screenshot(path=str(OUT/(expected+'-TERMS.png')))
                    page.locator('[data-rpg="earth-road-confirm"]').click(); render()
                    check(variant+' explicit continuation reaches '+expected, scene() == expected)
                    check(variant+' crossing grants and accepts nothing', state() == before)
                    check(variant+' source ticket cannot replay', not ev('()=>Realm.test.earthRoadTravel(null).ok'))
                def probe(label):
                    render(); before = state(); data = ev('()=>Realm.test.earthRoad()')
                    check(variant+' '+label+' submitted finite fingerboards', len([p for p in data['parts'] if p.get('earthRoadPart')=='fingerpost']) == 16 and all(all(isinstance(v,(int,float)) for v in p['p']+p['s']) and min(p['s'])>0 for p in data['parts']))
                    check(variant+' '+label+' boards and dressing have no camera authority', all(p.get('cameraSolid') is False for p in data['parts'] if not p.get('worldSolidId')))
                    geometry=ev('''()=>{const E=RealmEngine,road=Realm.test.earthRoad(),height=road.route.room===RealmEarth.ROOM?RealmEarth.height(road.route.x+1.6,road.route.z):RealmWorldFoundations.height(road.route.room,road.route.x+1.6,road.route.z);
                      const parts=road.parts.filter(p=>['fingerpost','post'].includes(p.earthRoadPart)||p.worldSolidId==='hearthwater-fingerpost').map(p=>{
                        const m=p.m||E.M.compose(...p.p,...p.s,...(p.r||[0,0,0])),g=E.geometry(p.kind),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
                        for(let k=0;k<g.length;k+=6){const v=E.M.transform(m,g.slice(k,k+3));for(let j=0;j<3;j++){min[j]=Math.min(min[j],v[j]);max[j]=Math.max(max[j],v[j]);}}
                        return{role:p.worldSolidId?'post':p.earthRoadPart,min,max,finite:[...m,...min,...max].every(Number.isFinite)};});
                      const posts=parts.filter(p=>p.role==='post'),boards=parts.filter(p=>p.role==='fingerpost');
                      return{parts,height,contact:posts.length===1&&Math.abs(posts[0].min[1]-height)<2e-5&&Math.abs((posts[0].min[0]+posts[0].max[0])/2-road.route.x-1.6)<2e-5,
                        bodyClear:boards.every(p=>p.min[1]>height+1.7),finite:parts.every(p=>p.finite)};}''')
                    check(variant+' '+label+' submitted sign touches canonical ground and clears walking body',geometry['finite'] and geometry['contact'] and geometry['bodyClear'])
                    check(variant+' '+label+' inspection preserves world', state() == before)
                    report.setdefault('models', {})[variant+'-'+label] = data
                    if variant == 'blade':
                        ev('()=>Realm.test.view({yaw:1.2,elevation:.45,distance:9,half:10})'); render()
                        def pixels(camera):
                            result=ev('''()=>{const e=window.__roadArt.e,tag=i=>['fingerpost','post'].includes(i.earthRoadPart)||i.worldSolidId==='hearthwater-fingerpost',saved=e.batches.map(b=>({b,items:b.items})),signature=()=>JSON.stringify({world:Realm.state,player:Realm.diagnostics.adventure.player,camera:e.camera,solids:e.cameraSolids}),before=signature(),shadow=e.lastShadow;
                              const read=()=>{e.lastShadow=-1;e.render(12,Realm.state.hour,Realm.state.weather==='rain');const gl=e.gl,a=new Uint8Array(e.mainF.w*e.mainF.h*4);gl.bindFramebuffer(gl.FRAMEBUFFER,e.mainF.f);gl.readPixels(0,0,e.mainF.w,e.mainF.h,gl.RGBA,gl.UNSIGNED_BYTE,a);gl.bindFramebuffer(gl.FRAMEBUFFER,null);return a;},diff=(a,b)=>{let n=0;for(let i=0;i<a.length;i+=4)if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>6)n++;return n;};
                              try{const on=read();for(const{b,items}of saved){b.items=items.filter(i=>!tag(i));e.updateBatch(b);}const off=read();for(const{b,items}of saved){b.items=items;e.updateBatch(b);}const restored=read();return{signPixels:diff(on,off),restoredPixels:diff(on,restored),unchanged:before===signature(),glError:e.gl.getError()};}
                              finally{for(const{b,items}of saved){b.items=items;e.updateBatch(b);}e.lastShadow=shadow;}}''')
                            report.setdefault('pixel_controls',{})[label+'-'+camera]=result
                            check(label+' '+camera+' sign-only positive pixels restore exactly',result['signPixels']>20 and result['restoredPixels']==0 and result['unchanged'] and result['glError']==0)
                            render()
                        pixels('third')
                        page.screenshot(path=str(OUT/(label+'-THIRD.png')))
                        page.keyboard.press('v'); render()
                        check(variant+' '+label+' diorama remains available', ev('()=>Realm.diagnostics.camera.projection') == 'orthographic')
                        pixels('diorama')
                        page.screenshot(path=str(OUT/(label+'-DIORAMA.png')))
                        page.keyboard.press('v'); render()
                def cold(label):
                    close(); ev('()=>Realm.test.save()'); saved = state()
                    report['states'][variant+'-'+label] = saved
                    (OUT/(variant+'-'+label+'.json')).write_text(json.dumps(saved, indent=2)+'\n', encoding='utf-8')
                    context.close(); launch()
                    check(variant+' '+label+' whole Chromium restart returns home', scene() == 'valley' and state() == saved)
                    render()
                launch(); ev('(w)=>Realm.test.replace(w)',raw); render()
                baseline = state()
                enter_hearth()
                page.keyboard.press('m'); render()
                check(variant+' local map exposes signed road', page.locator('[data-rpg="earth-road-read"]').count() == 1 and 'Coastward road' in page.locator('#rpg-content').inner_text())
                page.locator('[data-rpg="earth-road-read"]').click(); render()
                check(variant+' remote invitation cannot cross', page.locator('[data-rpg="earth-road-confirm"]').count() == 0)
                page.locator('[data-rpg="earth-road-walk"]').click()
                ev('()=>{for(let i=0;i<18000&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render()}')
                check(variant+' map route walks to the physical northern fork', scene() == 'earth-hearthwater-approach' and ev('()=>Math.hypot(Realm.diagnostics.adventure.player.x-19,Realm.diagnostics.adventure.player.z+42)<.25'))
                probe('HEARTHWATER'); road('world-earthlands'); probe('COASTWARD')
                page.keyboard.press('m'); render()
                check(variant+' Coastward map draws distinct local connection', page.locator('[data-world-route="hearthwater-connection"]').count() == 1 and page.locator('[data-rpg="earth-road-read"]').count() == 1)
                close(); cold('COASTWARD-ARRIVAL')
                enter_hearth(); reach_north(); road('world-earthlands')
                if variant != 'strongest':
                    for x,z in [(0,104),(0,92),(0,16),(14,15),(14,-34),(4,-41),(4,-67),(-6,-68)]: walk(x,z)
                    page.keyboard.press('e'); render()
                    check(variant+' Merren offers actual local work with declared payment', page.locator('[data-rpg="world-accept"]').count()==1 and '28 XP' in page.locator('#rpg-content').inner_text())
                    page.locator('[data-rpg="world-accept"]').click(); render()
                    run=state()['journeys']['realms']['earthlands']['active']['run']
                    for objective,x,z in [('first',-15,-46),('second',13,-54),('third',8,-69)]:
                        walk(x,z);page.keyboard.press('e');render()
                        page.locator(f'[data-rpg="world-observe"][data-id="{objective}"]').click();render()
                    before=state(); cold('COMPLETED-UNPAID')
                    check(variant+' native restart preserves all three unpaid observations', state()['journeys']['realms']['earthlands']['active']['observed']==['first','second','third'])
                    enter_hearth();reach_north();road('world-earthlands')
                    for x,z in [(0,104),(0,92),(0,16),(14,15),(14,-34),(4,-41),(4,-67),(-6,-68)]:walk(x,z)
                    page.keyboard.press('e');render();before=state();page.locator('[data-rpg="world-claim"]').click();render();after=state()
                    check(variant+' visible turn-in pays exactly once', after['adventure']['xp']-before['adventure']['xp']==28 and after['adventure']['coins']-before['adventure']['coins']==12 and after['adventure']['ore']-before['adventure']['ore']==2)
                    result=ev('(run)=>Realm.test.worldCommand("claim",{realm:"earthlands",run})',run)
                    check(variant+' changed request cannot repeat payout', result.get('duplicate') and state()==after)
                    for x,z in [(4,-67),(4,-41),(14,-34),(14,15),(0,16),(0,92),(0,104),(8,106)]:walk(x,z)
                else:
                    check('strongest returning road preserves equipment sockets and story', all(state()[k]==baseline[k] for k in ['journeys','realmTrails','earthHomecoming']) and all(state()['adventure'][k]==baseline['adventure'][k] for k in ['xp','equipment','arsenal','starter','pursuit','crossing','classPath']))
                road('earth-hearthwater-approach')
                check(variant+' reverse transition dispatches Earth return owner', ev('()=>Realm.diagnostics.earth.trip.active===Realm.diagnostics.characters.active'))
                if variant=='blade':
                    page.set_viewport_size({'width':390,'height':740});page.keyboard.press('e');render()
                    button=page.locator('[data-rpg="earth-road-confirm"]');button.scroll_into_view_if_needed();button.focus()
                    bounds=button.bounding_box()
                    check('compact crossing action is scrollable focusable and inside viewport', page.locator('#rpg-window').bounding_box()['width']<=390 and bounds['x']>=0 and bounds['x']+bounds['width']<=390 and bounds['y']>=0 and bounds['y']+bounds['height']<=740 and button.evaluate('(e)=>e===document.activeElement'))
                    page.screenshot(path=str(OUT/'COMPACT-ROAD.png'));before=state();button.click();render()
                    check('compact native continuation input crosses without rewards',scene()=='world-earthlands' and state()==before)
                    road('earth-hearthwater-approach');close();page.set_viewport_size({'width':1280,'height':800})
                cold('HEARTHWATER-RETURN')
                enter_hearth();close();page.keyboard.press('Escape');render()
                check(variant+' Escape returns to original home after road trip', scene()=='valley' and state()['player']==report['states'][variant+'-HEARTHWATER-RETURN']['player'])
                context.close()
        check('no browser runtime exceptions', not report['browser_errors'])
except Exception as e:
    report['errors'].append(str(e));traceback.print_exc()
finally:
    server.shutdown();server.server_close()
    (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(f"Earth road browser: {sum(x['passed'] for x in report['checks'])}/{len(report['checks'])}; errors {len(report['errors'])}",flush=True)
if report['errors'] or report['browser_errors']:raise SystemExit(1)
