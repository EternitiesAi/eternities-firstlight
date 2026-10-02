"""Optional atmosphere through real Web Audio and the current production UI.

Travel uses accelerated production walking in isolated software Chromium.
OfflineAudioContext sample measurements qualify the owned graph, not speakers,
human listening, OS background policy, or hardware performance. Hidden/BFCache
events are explicitly synthetic; native reload is a real browser navigation.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import hashlib, json, tempfile, threading, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'evidence10/soundscape-browser'
OUT.mkdir(parents=True, exist_ok=True)
report = {'method': __doc__, 'checks': [], 'errors': [], 'browser_errors': [],
          'html_sha256': hashlib.sha256((ROOT / 'index.html').read_bytes()).hexdigest()}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *args):
        pass


def check(name, ok):
    report['checks'].append({'name': name, 'passed': bool(ok)})
    print(('PASS ' if ok else 'FAIL ') + name, flush=True)
    if not ok:
        raise AssertionError(name)


server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
try:
    with tempfile.TemporaryDirectory(prefix='firstlight-atmosphere-') as profile, sync_playwright() as pw:
        context = pw.chromium.launch_persistent_context(
            profile, **chromium_launch_kwargs(), viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        page.on('pageerror', lambda error: report['browser_errors'].append(str(error)))
        page.add_init_script('window.__ETERNITIES_TEST_MODE=true;')
        response = page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='load')
        page.wait_for_function('()=>!!window.Realm')
        ev = lambda code, arg=None: page.evaluate(code, arg)
        state = lambda: ev('Realm.state')
        ev('Realm.test.quality("low")')

        def expect_audio(profile_id, quiet=False):
            page.wait_for_function('([id,quiet])=>{const a=Realm.diagnostics.audio;return a.enabled&&a.state==="running"&&a.soundscape?.profile===id&&a.soundscape?.quiet===quiet&&a.soundscape?.loopSources===4}', arg=[profile_id, quiet])
            check(f'actual running audio projects {profile_id}, quiet={quiet}', True)

        def close():
            if page.locator('#rpg-window').evaluate('(e)=>e.open'):
                page.locator('#rpg-close').click()

        def walk(x, z):
            close()
            result = ev('([x,z])=>{const r=Realm.test.move(x,z);if(!r.ok)return r;for(let i=0;i<12000&&Realm.test.path.length;i++)Realm.test.step(.05);const p=Realm.diagnostics.adventure.player;return{ok:Math.hypot(p.x-x,p.z-z)<.25,hp:Realm.state.adventure.hp}}', [x, z])
            check(f'production walk {x},{z}', result.get('ok'))

        def enter(realm):
            close()
            walk(18, 6)
            page.keyboard.press('j')
            page.locator('[data-rpg="open"][data-id="worlds"]').click()
            if page.locator('[data-rpg="world-list"]').count():
                page.locator('[data-rpg="world-list"]').click()
            page.locator(f'[data-rpg="world-select"][data-id="{realm}"]').click()
            page.locator('[data-rpg="world-preview"]').click()
            page.locator('[data-rpg="world-confirm"]').click()
            check('actual road enters ' + realm, ev('Realm.diagnostics.world.id') == realm)

        check('current regenerated production HTML', hashlib.sha256(response.body()).hexdigest() == report['html_sha256'])
        check('new page has no implicit audio context or consent', ev('()=>!Realm.diagnostics.audio.enabled&&Realm.diagnostics.audio.state==="not-created"&&Realm.diagnostics.audio.soundscape===null'))
        preserved = state()
        page.locator('#sound').click()
        expect_audio('field')
        check('sound control exposes its actual opt-in state', page.locator('#sound').get_attribute('aria-pressed') == 'true')
        page.keyboard.press('j')
        expect_audio('field', True)
        close()
        expect_audio('field')

        walk(11, 9)
        check('initial kit is genuinely command earned', ev('Realm.test.adventure("sound-kit","start")')['ok'])
        for realm, profile_id in [('heaven', 'heaven'), ('hell', 'hell'), ('earthlands', 'coast'), ('atlantis', 'atlantis')]:
            enter(realm)
            expect_audio(profile_id)
            page.keyboard.press('j')
            expect_audio(profile_id, True)
            close()
            expect_audio(profile_id)
            if realm == 'atlantis':
                landing = ev('RealmWorldFoundations.definition("atlantis").points.find(p=>p.id==="tide-steps")')
                walk(landing['x'], landing['z'])
                page.keyboard.press('e')
                page.locator('[data-rpg="world-dive"]').click()
                # The marked entry is deliberately close to the surface: the
                # torso is still in air there. Descend on the real route first.
                for target in [[8, -1.05, -22], [8, -2.55, -28], [8, -2.7, -29.5],
                               [8, -2.7, -32], [8, -2.7, -35], [8, -2.7, -32],
                               [8, -2.7, -29.5], [8, -1.8, -29], [12, -1.8, -29],
                               [12, -1.4, -38.4], [12, -1.4, -39.3]]:
                    result = ev('target=>{for(let i=0;i<2000;i++){const p=Realm.diagnostics.adventure.player,v=Realm.test.worldDiveStatus(),dx=target[0]-p.x,dz=target[2]-p.z,dy=target[1]-v.y;if(Math.hypot(dx,dz)<.015&&Math.abs(dy)<.015)return true;const h=Math.hypot(dx,dz),dt=h>.005?Math.min(.05,h/2.6):Math.min(.05,Math.abs(dy)/2.6),step=dt*2.6;Realm.test.worldSwim(h>.005?dx:0,h>.005?dz:0,step?dy/step:0,dt);}return false}', target)
                    check('real swim reaches ' + str(target), result)
                    if target == [8, -1.05, -22]:
                        expect_audio('submerged')
                        check('underwater profile follows actual body medium', ev('Realm.test.worldDiveStatus().body') == 'water')
                    if target == [8, -2.7, -32]:
                        expect_audio('atlantis')
                        check('air court restores the air profile in its actual dry volume', ev('Realm.test.worldDiveStatus().body') == 'air')
                expect_audio('submerged')
                check('actual landing exits the gallery', ev('Realm.test.worldDiveExit()')['ok'])
                expect_audio('atlantis')
            close()
            check('explicit return retains the home route', ev('Realm.test.worldReturn()')['ok'])
            expect_audio('field')

        walk(14, -5)
        page.keyboard.press('e')
        page.locator('[data-rpg="cosmos-confirm"]').click()
        expect_audio('cosmos')
        page.locator('#cosmos-home').click()
        expect_audio('field')

        # The graph is shared with the production app; samples are rendered by
        # Chromium's real audio engine, separately from live speaker output.
        samples = ev('''async()=>{
          const out=[];
          for(const [id,p] of Object.entries(RealmSoundscape.PROFILES)){
            const ctx=new OfflineAudioContext(1,72000,24000),master=ctx.createGain();
            master.gain.value=.55;master.connect(ctx.destination);
            const graph=new RealmSoundscape.Soundscape(ctx,master,RealmCore.rng(73));
            const room={field:null,coast:'world-earthlands',heaven:'world-heaven',hell:'world-hell',atlantis:'world-atlantis',submerged:'world-atlantis',cosmos:'cosmos-near-expanse',interior:'retreat'}[id];
            graph.update({room,medium:id==='submerged'?'water':'air'},0);
            const b=await ctx.startRendering(),d=b.getChannelData(0);let energy=0,peak=0,jump=0;
            for(let i=24000;i<d.length;i++){energy+=d[i]*d[i];peak=Math.max(peak,Math.abs(d[i]));jump=Math.max(jump,Math.abs(d[i]-d[i-1]));}
            out.push({id,frames:d.length,sampleRate:b.sampleRate,rms:Math.sqrt(energy/48000),peak,maxSampleStep:jump});graph.dispose();
          }
          const ctx=new OfflineAudioContext(1,24000,24000),master=ctx.createGain();master.gain.value=.55;master.connect(ctx.destination);
          const graph=new RealmSoundscape.Soundscape(ctx,master,()=>.7);graph.update({paused:true},0);
          const b=await ctx.startRendering();let peak=0;for(const v of b.getChannelData(0))peak=Math.max(peak,Math.abs(v));graph.dispose();
          return{profiles:out,quietPeak:peak};
        }''')
        report['offline_audio_measurements'] = samples
        check('all eight original profiles render complete real audio samples', len(samples['profiles']) == 8 and all(p['frames'] == 72000 and p['sampleRate'] == 24000 for p in samples['profiles']))
        check('each profile has bounded nonzero sample energy without clipping', all(.0001 < p['rms'] < .05 and p['peak'] < .15 for p in samples['profiles']))
        check('profile sample steps are bounded through the owned filtered graph', all(p['maxSampleStep'] < .01 for p in samples['profiles']))
        check('a quiet graph renders exact silence', samples['quietPeak'] == 0)

        ev('()=>{Object.defineProperty(document,"hidden",{configurable:true,value:true});document.dispatchEvent(new Event("visibilitychange"));}')
        check('synthetic hidden event fades the owned ambient bus', ev('Realm.diagnostics.audio.soundscape.quiet'))
        ev('()=>{delete document.hidden;document.dispatchEvent(new Event("visibilitychange"));}')
        expect_audio('field')
        ev('()=>window.dispatchEvent(new Event("pagehide"))')
        check('synthetic pagehide retires four owned loops', ev('()=>Realm.diagnostics.audio.soundscape.disposed&&Realm.diagnostics.audio.soundscape.loopSources===0'))
        ev('()=>window.dispatchEvent(new Event("pageshow"))')
        expect_audio('field')
        page.locator('#sound').click()
        check('application mute retains no active ambient consent', ev('()=>!Realm.diagnostics.audio.enabled&&Realm.diagnostics.audio.soundscape.quiet') and page.locator('#sound').get_attribute('aria-pressed') == 'false')
        check('ambient projection preserves notebook, score, house and explicit soul history', all(state()[key] == preserved[key] for key in ['notes', 'score', 'scoreRevision', 'retreat']) and state()['adventure']['beacon']['soul'] == preserved['adventure']['beacon']['soul'])
        check('current character can save after optional audio lifecycle', ev('Realm.test.save()')['ok'])
        page.reload(wait_until='load')
        page.wait_for_function('()=>!!window.Realm')
        check('real native reload requires fresh audio opt-in', ev('()=>!Realm.diagnostics.audio.enabled&&Realm.diagnostics.audio.state==="not-created"&&Realm.diagnostics.audio.soundscape===null'))
        check('no actual browser errors', not report['browser_errors'] and not ev('Realm.diagnostics.errors'))
        report['status'] = 'passed'
        context.close()
except Exception:
    report['status'] = 'failed'
    report['errors'].append(traceback.format_exc())
    raise
finally:
    server.shutdown()
    server.server_close()
    (OUT / 'REPORT.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
