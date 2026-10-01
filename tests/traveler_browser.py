"""Actual offline WebGL traveller/gear, accepted commands and restore boundaries.

Movement/combat ticks are accelerated coverage, not human pacing. The isolated
framebuffer probe tests visible geometry; imported campaign data is the labelled
command-earned repository example, never a personal browser profile.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import hashlib, json, math, subprocess, threading, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'evidence10/traveler'; OUT.mkdir(parents=True, exist_ok=True)
report = {'method': __doc__, 'checks': [], 'browser_errors': [],
          'html_sha256': hashlib.sha256((ROOT / 'index.html').read_bytes()).hexdigest()}
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=str(ROOT), **k)
    def log_message(self, *_): pass
def check(name, result):
    report['checks'].append({'name': name, 'passed': bool(result)})
    print(('PASS ' if result else 'FAIL ') + name, flush=True)
    if not result: raise AssertionError(name)
def finite_parts(snapshot):
    return all(all(math.isfinite(v) for v in it['p'] + it['s'] + (it['m'] or []))
               and all(v > 0 for v in it['s']) for it in snapshot['parts'])
def same_point(a, b): return math.dist(a, b) < 1e-5
def joint_world(snapshot, name):
    m, p = snapshot['frame']['root'], snapshot['frame']['joints'][name]
    return [m[i]*p[0]+m[4+i]*p[1]+m[8+i]*p[2]+m[12+i] for i in range(3)]
def submitted_grip(snapshot, hand):
    it = next(p for p in snapshot['parts'] if p['weaponPart'] == 'grip')
    return same_point(it['m'][12:15], joint_world(snapshot, hand))
def submitted_strings(snapshot):
    hand = joint_world(snapshot, 'rightHand')
    strings = [p for p in snapshot['parts'] if p['weaponPart'] == 'bow-string']
    return len(strings) == 2 and all(min(math.dist([p['m'][12+i]+sign*p['m'][4+i]*.5 for i in range(3)],hand) for sign in [-1,1]) < 1e-5 for p in strings)
server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/'
try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(**chromium_launch_kwargs())
        ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
        ctx.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
        page = ctx.new_page(); requests = []
        page.on('pageerror', lambda e: report['browser_errors'].append(str(e)))
        page.on('request', lambda r: requests.append(r.url))
        response = page.goto(url, wait_until='load'); page.wait_for_function('window.Realm')
        ev = page.evaluate
        def render(): ev('()=>Realm.test.render()')
        def snapshot(): return ev('()=>Realm.test.traveler()')
        def cmd(kind, payload=None):
            result = ev('([kind,p])=>Realm.test.adventure("traveler-"+kind+"-"+performance.now(),kind,p)', [kind, payload or {}])
            check('accepted ' + kind, result['ok']); render(); return result
        def walk(x, z):
            if page.locator('#rpg-window').evaluate('(e)=>e.open'): page.locator('#rpg-close').click()
            if page.locator('#story-dialog').evaluate('(e)=>e.open'): page.locator('#story-close').click()
            result = ev('''([x,z])=>{const r=Realm.test.move(x,z);if(!r.ok)return r;for(let i=0;i<6000&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render();return{ok:Math.hypot(Realm.diagnostics.adventure.player.x-x,Realm.diagnostics.adventure.player.z-z)<.25}}''', [x,z])
            if not result['ok']: print('WALK REFUSAL', result, ev('()=>Realm.diagnostics.adventure'), flush=True)
            check(f'accepted walk to {x},{z}', result['ok'])
        render()
        check('exact standalone HTML and actual WebGL2', hashlib.sha256(response.body()).hexdigest() == report['html_sha256'] and ev('()=>Realm.diagnostics.mode') == 'webgl2')
        fresh = snapshot()
        check('fresh traveller is finite and unarmed', finite_parts(fresh) and fresh['equipment']['mode'] == 'none')
        check('unarmed body stays inside declared instance budget', len(fresh['parts']) <= 65)
        before = ev('()=>Realm.state'); render(); render()
        check('repeated rendering cannot change saved state', ev('()=>Realm.state') == before)
        check('repeated same sample cannot advance stride', snapshot()['motion']['phase'] == fresh['motion']['phase'])
        ev('()=>Realm.test.move(0,2)')
        samples = []
        for _ in range(6):
            ev('()=>Realm.test.step(.05)'); render(); samples.append(snapshot())
        check('accepted displacement advances stride', samples[-1]['motion']['phase'] != samples[0]['motion']['phase'])
        check('walking frames retain finite submitted geometry', all(finite_parts(s) for s in samples))
        ev('()=>Realm.test.pause(true)'); render(); paused = snapshot()
        render(); render()
        check('pause preserves pose and stride exactly', snapshot() == paused)
        ev('()=>Realm.test.pause(false)')
        walk(11,9); page.keyboard.press('e'); render()
        check('kit earned through production interaction', ev('()=>Realm.state.adventure.started'))
        kit = snapshot()
        check('actual equipped blade is stowed for travel', kit['equipment']['weaponId'] == 'trail_blade' and kit['equipment']['mode'] == 'stowed')
        check('equipped armor projects its real catalogue color', any(it['c'] == '#9c967d' or it['c'] == [156/255,150/255,125/255] for it in kit['parts']))
        for mode in ['adventure', 'follow']:
            page.locator(f'[data-rpg="camera"][data-id="{mode}"]').click(); render()
            check('real ' + mode + ' camera retained', ev('()=>Realm.diagnostics.camera.projection') == ('perspective' if mode == 'adventure' else 'orthographic'))
            s = snapshot(); check('bounded submitted traveller and gear in ' + mode, finite_parts(s) and s['equipment']['instances'] > 0 and len(s['parts']) <= 105)
            point = ev('()=>{const r=Realm.test.traveler().frame.root;return Realm.project(r[12],r[13]+1,r[14])}')
            check('traveller projects inside live viewport in ' + mode, point['visible'] and 0 <= point['x'] <= 1280 and 0 <= point['y'] <= 800)
            page.screenshot(path=str(OUT / ('KIT_' + mode + '.png')))
        # Labelled synthetic framebuffer: render the actual submitted avatar
        # instances alone, so scenery cannot masquerade as a visible traveller.
        pixels = ev('''()=>{const s=Realm.test.traveler(),root=s.frame.root,c=document.createElement('canvas'),e=new RealmEngine.Engine(c);e.resize(384,384,1);e.quality='low';e.noWater=true;e.setCamera({eye:[2.5,2.5,4.5],target:[0,.95,0],half:1.35,aspect:1});const g=e.gl,read=()=>{g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);const a=new Uint8Array(384*384*4);g.readPixels(0,0,384,384,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;},diff=(a,b)=>a.reduce((n,v,i)=>n+(v!==b[i]),0);e.render(0,16,false);const empty=read();const render=gear=>{e.clear();for(const kind of ['box','round','octa','disc']){const items=s.parts.filter(it=>it.kind===kind&&(gear||it.part!=='equipment')).map(it=>{const p=it.p.map((v,i)=>v-root[12+i]),m=it.m?new Float32Array(it.m):undefined;if(m)for(let i=0;i<3;i++)m[12+i]-=root[12+i];return{p,s:it.s,m,c:it.c,rough:.83};});e.batch(kind,items);}e.render(0,16,false);return read();};const body=render(false),full=render(true),result={bodyChannels:diff(empty,body),equipmentChannels:diff(body,full),error:g.getError()};e.disposeSurfaceMaterials();g.getExtension('WEBGL_lose_context').loseContext();return result;}''')
        report['synthetic_visible_geometry'] = pixels
        check('isolated actual traveller instances produce visible pixels', pixels['bodyChannels'] > 1000)
        check('actual stowed equipment changes visible pixels', pixels['equipmentChannels'] > 50)
        check('avatar framebuffer rendering has no WebGL errors', pixels['error'] == 0)
        walk(15,7); cmd('starter-enter')
        check('scene transition resets prior travel motion', snapshot()['motion']['blend'] == 0)
        blade = snapshot()
        check('blade ready grip is on right hand', blade['equipment']['mode'] == 'held' and same_point(blade['equipment']['gripLocal'], blade['frame']['joints']['rightHand']))
        check('actual submitted blade grip meets palm matrix', submitted_grip(blade,'rightHand'))
        walk(-5,12); cmd('target-select', {'id':'river-practice'}); cmd('auto-toggle')
        phases = []
        for _ in range(12):
            ev('()=>Realm.test.step(.05)'); render(); phases.append(snapshot())
        check('actual blade attack provides anticipation and recovery', {'anticipate','recover'} <= {s['frame']['combatPhase'] for s in phases})
        check('blade remains attached throughout attack', all(same_point(s['equipment']['gripLocal'], s['frame']['joints']['rightHand']) for s in phases))
        check('submitted blade grip stays connected throughout attack', all(submitted_grip(s,'rightHand') for s in phases))
        check('practice receives actual weapon hits', ev('()=>Realm.diagnostics.adventure.tactics.hits.some(h=>h.n>0)'))
        cmd('auto-toggle'); ev('()=>Realm.test.step(.8)'); cmd('attack', {'target':'river-practice'})
        check('manual accepted blade strike projects recovery', snapshot()['frame']['combatPhase'] == 'recover')
        cmd('pulse', {'target':'river-practice'})
        check('manual accepted blade sweep projects recovery', snapshot()['frame']['combatPhase'] == 'recover')
        cmd('guard')
        check('accepted guard changes traveller stance', snapshot()['frame']['guarded'])
        ev('()=>Realm.test.save()'); earned = ev('()=>Realm.state'); page.reload(wait_until='load'); page.wait_for_function('window.Realm'); render()
        check('reload preserves complete earned world', ev('()=>Realm.state') == earned)
        check('reload starts a clean presentation clock', snapshot()['motion']['blend'] == 0)
        source_path = ROOT / 'examples/REALM09_BOW_CHAPTER_II_COMPLETE_EARNED.json'
        source = json.loads(source_path.read_text(encoding='utf-8'))
        report['bow_source'] = {'path': str(source_path.relative_to(ROOT)), 'sha256': hashlib.sha256(source_path.read_bytes()).hexdigest(), 'label':'command-earned repository campaign example; imported through full restore'}
        ev('s=>Realm.test.replace(s)', source); render()
        imported = ev('()=>Realm.state')
        check('returning import preserves stored XP and campaign history', imported['adventure']['xp'] == source['adventure']['xp'] and imported['adventure']['defeated'] == source['adventure']['defeated'])
        check('full restore resets previous body motion', snapshot()['motion']['blend'] == 0)
        cmd('equip', {'id':'trail_bow'}); walk(11,9); cmd('range-enter'); cmd('range-start')
        bow = snapshot()
        check('bow uses canonical ranged family and left-hand grip', bow['equipment']['style'] == 'bow' and bow['equipment']['mode'] == 'held' and same_point(bow['equipment']['gripLocal'],bow['frame']['joints']['leftHand']))
        check('actual submitted bow grip meets left-palm matrix', submitted_grip(bow,'leftHand'))
        check('actual submitted bow strings meet right-palm matrix', submitted_strings(bow))
        check('imported amber socket has its actual rendered geometry', bow['equipment']['gem'] == 'amber' and len([p for p in bow['parts'] if p['weaponPart']=='socket' and p['gemId']=='amber']) == 1)
        walk(0,2); cmd('target-select', {'id':'range-mid'}); cmd('auto-toggle')
        bow_phases = []
        for _ in range(32):
            ev('()=>Realm.test.step(.05)'); render(); bow_phases.append(snapshot())
        check('actual bow attack provides anticipation and recovery', {'anticipate','recover'} <= {s['frame']['combatPhase'] for s in bow_phases})
        check('bow grip stays attached while drawing and releasing', all(same_point(s['equipment']['gripLocal'],s['frame']['joints']['leftHand']) for s in bow_phases))
        check('submitted bow grip and string matrices stay connected', all(submitted_grip(s,'leftHand') and submitted_strings(s) for s in bow_phases))
        check('arrows still collide and hit practice through actual rules', ev('()=>Realm.diagnostics.adventure.range.hits["range-mid"]||0') > 0)
        cmd('auto-toggle'); ev('()=>Realm.test.step(.8)'); cmd('attack', {'target':'range-mid'})
        check('manual accepted bow release projects recovery', snapshot()['frame']['combatPhase'] == 'recover')
        cmd('pulse', {'target':'range-mid'})
        check('manual accepted piercing arrow projects recovery', snapshot()['frame']['combatPhase'] == 'recover')
        walk(0,9); cmd('range-leave'); walk(15,7); cmd('starter-enter')
        ev('()=>Realm.test.step(1)'); cmd('attack', {'target':'river-practice'})
        check('fresh scene accepted bow release projects recovery', snapshot()['frame']['combatPhase'] == 'recover')
        cmd('starter-leave'); cmd('starter-enter')
        check('old bow release cannot cross scene re-entry', snapshot()['frame']['combatPhase'] == 'idle' and ev('()=>Realm.diagnostics.adventure.arrows.length') == 0)
        ev('()=>Realm.test.step(1)'); cmd('target-select', {'id':'river-practice'}); cmd('auto-toggle')
        ev('()=>Realm.test.step(.2)'); render()
        check('new auto shot produces owned bow recovery', snapshot()['frame']['combatPhase'] == 'recover')
        ev('()=>Realm.test.pause(true)'); cmd('equip', {'id':'trail_blade'})
        check('old bow recovery cannot transfer to equipped blade', snapshot()['frame']['style'] == 'blade' and snapshot()['frame']['combatPhase'] == 'idle')
        cmd('equip', {'id':'trail_bow'})
        check('re-equipped bow cannot inherit earlier item recovery', snapshot()['frame']['combatPhase'] == 'idle')
        paused_world = ev('()=>Realm.state')
        refusal = ev('()=>Realm.test.adventure("traveler-paused-auto","auto-toggle",{})')
        check('paused combat remains refused without mutation', not refusal['ok'] and ev('()=>Realm.state')==paused_world)
        ev('()=>Realm.test.pause(false)'); cmd('target-clear')
        walk(-5,11.5)
        # Real commands may share one frame. Observe neither equip nor release
        # until the whole batch has completed, including same-family re-equips.
        def batch(actions):
            results = ev('''actions=>actions.map(([type,payload],i)=>Realm.test.adventure("traveler-batch-"+type+"-"+performance.now()+"-"+i,type,payload||{}))''', actions)
            for (kind, *_), result in zip(actions,results): check('accepted batched '+kind, result['ok'])
            render()
        ev('()=>Realm.test.step(1)'); render()
        batch([['equip',{'id':'trail_blade'}],['attack',{'target':'river-practice'}]])
        check('new blade release before its first frame retains recovery and submitted grip', snapshot()['frame']['combatPhase']=='recover' and submitted_grip(snapshot(),'rightHand'))
        ev('()=>Realm.test.step(1)'); render()
        batch([['equip',{'id':'trail_bow'}],['attack',{'target':'river-practice'}]])
        check('new bow release before its first frame retains recovery and submitted strings', snapshot()['frame']['combatPhase']=='recover' and submitted_grip(snapshot(),'leftHand') and submitted_strings(snapshot()))
        ev('()=>Realm.test.step(.1)'); render()
        check('bow recovery survives the projectile impact', snapshot()['frame']['combatPhase']=='recover')
        ev('()=>Realm.test.step(1)'); render()
        batch([['equip',{'id':'trail_blade'}],['attack',{'target':'river-practice'}],['equip',{'id':'trail_bow'}]])
        check('release before a later same-frame equip remains fenced', snapshot()['frame']['combatPhase']=='idle')
        ev('()=>Realm.test.step(1)'); render()
        batch([['attack',{'target':'river-practice'}],['equip',{'id':'trail_blade'}],['equip',{'id':'trail_bow'}]])
        check('same-frame re-equip cannot inherit the earlier bow release', snapshot()['frame']['combatPhase']=='idle')
        walk(0,13); cmd('starter-leave')
        first_sample = ev('''()=>{const cmd=(type,payload={})=>Realm.test.adventure("traveler-first-sample-"+type+"-"+performance.now(),type,payload);const entry=cmd('starter-enter');if(!entry.ok)return{entry};const move=Realm.test.move(-5,11.5);if(!move.ok)return{entry,move};for(let i=0;i<6000&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.step(1);const release=cmd('attack',{target:'river-practice'});Realm.test.step(.2);Realm.test.render();return{entry,move,release,arrows:Realm.diagnostics.adventure.arrows.length};}''')
        check('accepted scene entry and movement before first traveller sample', first_sample['entry']['ok'] and first_sample['move']['ok'])
        check('accepted bow release hit before first traveller sample', first_sample['release']['ok'] and first_sample['arrows']==0)
        check('first scene sample retains its own completed-arrow recovery', snapshot()['frame']['combatPhase']=='recover')
        ev('()=>Realm.test.openPanel("settings")'); page.locator('[data-setting="reducedMotion"]').check(); page.locator('#close-panel').click(); render()
        check('production reduced-motion option reaches traveller', snapshot()['frame']['reducedMotion'])
        ev('()=>Realm.test.quality("low");Realm.test.render()')
        check('low quality retains finite submitted body and equipped bow', finite_parts(snapshot()) and snapshot()['equipment']['style'] == 'bow' and ev('()=>Realm.diagnostics.mode') == 'webgl2')
        saved = ev('()=>Realm.state'); render(); render()
        check('reduced-motion rendering preserves equipment/socket/history', ev('()=>Realm.state') == saved)
        # Strongest campaign equipment with legitimate one-time temper and both
        # finite fittings. This helper is already part of the current gate.
        veteran_path = ROOT / 'evidence10/pursuit/veteran/07_PRACTICE_PERSISTED.json'
        if not veteran_path.exists():
            result = subprocess.run(['node','tests/pursuit_journey.cjs','--veteran'],cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,check=True)
            (OUT/'VETERAN_SOURCE_COMMAND.log').write_bytes(result.stdout)
        veteran = json.loads(veteran_path.read_text(encoding='utf-8'))
        report['veteran_source'] = {'path':str(veteran_path.relative_to(ROOT)), 'sha256':hashlib.sha256(veteran_path.read_bytes()).hexdigest(), 'label':'command-earned complete campaign, one temper and finite fittings; no planted gear'}
        ev('s=>Realm.test.replace(s)',veteran); render()
        result = ev('()=>Realm.test.act("traveler-appearance","appearance",{visitor:{name:"Rowan",skin:2,hair:4,cloak:3}})'); render()
        check('appearance changed through accepted rules',result['ok'])
        advanced = snapshot(); advanced_world = ev('()=>Realm.state')
        check('strongest equipment remains owned/equipped with history', advanced_world['adventure'] == veteran['adventure'] and advanced['equipment']['weaponId'] == 'dawn_edge')
        check('one temper and both fittings have submitted geometry', advanced['equipment']['temper'] == 2 and advanced['equipment']['stage'] == 2 and len([p for p in advanced['parts'] if p['weaponPart']=='temper']) == 1 and len([p for p in advanced['parts'] if p['weaponPart']=='fitting']) == 2)
        palette = ev('()=>({skin:RealmEngine.hex(RealmCreative.SKINS[2]),hair:RealmEngine.hex(RealmCreative.HAIR[4]),cloak:RealmEngine.hex(RealmCreative.CLOAKS[3]),armor:RealmEngine.hex(RealmAdventure.GEAR.keeper_coat.color)})')
        by_part = {p['part']:p for p in advanced['parts'] if p['part']!='equipment'}
        check('custom skin hair cloak and actual armor reach submitted colors', all(by_part[name]['c']==palette[key] for name,key in [('head','skin'),('hair-crown','hair'),('cloak-left','cloak'),('jacket-chest','armor')]))
        def library():
            if page.locator('#rpg-window').evaluate('(e)=>e.open'): page.locator('#rpg-close').click()
            page.locator('[data-rpg="open"][data-id="more"]').click()
            page.locator('#rpg-content [data-rpg="open"][data-id="characters"]').click()
        library(); page.locator('#chars-name').fill('Scout'); page.locator('[data-rpg="chars-palette"][data-id="1"]').click(); page.locator('#chars-create-submit').click()
        page.wait_for_function('()=>Realm.state.visitor.name==="Scout"'); render()
        check('real UI character creation has its own unarmed traveller', snapshot()['equipment']['mode']=='none' and snapshot()['motion']['blend']==0)
        slots = ev('()=>JSON.parse(localStorage.getItem("eternities.realm10.characters.v1")).slots')
        rowan = next(s['id'] for s in slots if s['world']['visitor']['name']=='Rowan')
        library(); page.locator(f'[data-rpg="chars-switch"][data-id="{rowan}"]').click()
        page.wait_for_function('(id)=>Realm.diagnostics.characters.active===id',arg=rowan); render()
        check('real character switch restores gear appearance and clean pose', ev('()=>Realm.state.adventure')==advanced_world['adventure'] and ev('()=>Realm.state.visitor')==advanced_world['visitor'] and snapshot()['equipment']['weaponId']=='dawn_edge' and snapshot()['motion']['blend']==0)
        restored = snapshot(); restored_parts = {p['part']:p for p in restored['parts'] if p['part']!='equipment'}
        check('switched character restores actual custom palette geometry', restored_parts['head']['c']==palette['skin'] and restored_parts['cloak-left']['c']==palette['cloak'])
        ev('()=>Realm.test.save()'); native = ev('()=>Realm.state'); page.reload(wait_until='load'); page.wait_for_function('window.Realm'); render()
        check('native reload retains managed advanced character world', ev('()=>Realm.state')==native and snapshot()['equipment']['stage']==2 and snapshot()['equipment']['temper']==2)
        check('no external asset requests', all(u.startswith((url,'data:','blob:')) for u in requests))
        check('no runtime browser errors', not report['browser_errors'])
        report['body_and_gear'] = snapshot()
        report['metrics'] = ev('()=>Realm.diagnostics.metrics')
        browser.close()
except Exception as error:
    report['error'] = str(error); report['traceback'] = traceback.format_exc()
finally:
    server.shutdown(); report['passed'] = bool(report['checks']) and all(c['passed'] for c in report['checks']) and not report.get('error')
    (OUT / 'REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    count = sum(c['passed'] for c in report['checks'])
    print(f'Traveller browser: {count}/{len(report["checks"])}; errors: {len(report["browser_errors"])}')
    if not report['passed']: print(report.get('traceback','')); raise SystemExit(1)
