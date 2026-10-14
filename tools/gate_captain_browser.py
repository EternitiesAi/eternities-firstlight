"""Gate Captain visible-control qualification in an isolated loopback profile.
Native Journal/E/V controls make choices; production moveTo and accepted ticks
accelerate walking. No position, actor, inventory or objective grants. A labelled
storage-quota injection tests refused arrival and explicit retry. Software WebGL,
not ordinary-RAF footage, human pacing or hardware performance. Run through the
unchanged browser_budget admission wrapper, one browser at a time.
"""
from pathlib import Path
from contextlib import ExitStack
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
import argparse
import functools
import hashlib
import json
import os
import subprocess
import tempfile
import threading
import traceback

ROOT = Path(__file__).resolve().parents[1]
MILESTONES = ('terms', 'preparation', 'three_actors', 'both_cameras', 'menu_pause', 'far_wait', 'quota_retry', 'cold_checkpoint', 'arrival', 'single_fee', 'cold_result', 'preserved_owners')
INIT = """window.__ETERNITIES_TEST_MODE=true;
window.__ETERNITIES_CAPTURE_MODE=true;
window.__gateStartup=Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]));"""
ART_OBSERVER = """()=>{const draw=RealmEarthGateArt.draw;window.__gateArt=[];
    RealmEarthGateArt.draw=function(out,...args){const result=draw.call(this,out,...args);
        window.__gateArt=JSON.parse(JSON.stringify(Object.values(out).flat().filter(i=>i.gatePart)));
        return result;};}"""


def finish_report(report, output):
    """Incomplete routes, falsey evidence and cleanup failures cannot pass."""
    report['passed'] = (
        bool(report['checks']) and all(c['passed'] is True for c in report['checks'])
        and all(report['milestones'].get(k) is True for k in MILESTONES)
        and not any(report[k] for k in ('errors', 'browser_errors', 'external_requests'))
        and report.get('source_unchanged') is True and report.get('clean_source') is True
        and all(report['resources'].get(k) is True
                for k in ('context_closed', 'server_closed', 'profile_removed')))
    with (output/'REPORT.json').open('x', encoding='utf-8') as stream:
        json.dump(report, stream, indent=2)
        stream.write('\n')
    print(json.dumps({'passed': report['passed'], 'checks': len(report['checks']),
                      'errors': len(report['errors'])}), flush=True)
    if not report['passed']:
        raise RuntimeError('Gate captain native qualification is incomplete; see REPORT.json')


def output_path(requested):
    output = requested.resolve()
    if (not requested.is_absolute() or output == Path(output.anchor)
            or output == ROOT or output.is_relative_to(ROOT) or ROOT.is_relative_to(output)
            or os.name == 'nt' and output.drive.upper() != 'D:'):
        raise ValueError('Use fresh bounded D evidence separate from the game')
    if output.exists():
        raise FileExistsError('Keep earlier evidence; choose a fresh attempt directory')
    return output


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--bow', action='store_true')
    parser.add_argument('--both', action='store_true')
    args = parser.parse_args(argv)
    output = output_path(args.output)
    if args.both:
        if args.bow:
            parser.error('Choose --both or --bow, not both')
        main(['--output', str(output/'blade')])
        main(['--output', str(output/'bow'), '--bow'])
        return
    output.mkdir(parents=True, exist_ok=False)
    files = sorted([*ROOT.glob('src/*.js'), *ROOT.glob('src/*.css'), ROOT/'src/shell.html',
                    ROOT/'build.py', ROOT/'index.html', ROOT/'FIRSTLIGHT_VALLEY.html',
                    ROOT/'tools/browser_support.py', ROOT/'tools/browser_budget.py',
                    Path(__file__).resolve()])
    identity = lambda: {p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
                        for p in files}
    status = lambda: subprocess.check_output(
        ['git', 'status', '--porcelain', '--untracked-files=normal'], cwd=ROOT, text=True)
    report = dict(method=__doc__, family='bow' if args.bow else 'blade',
                  head=subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
                  source=identity(), clean_source=not status().strip(),
                  save_versions=dict(world=9, adventure=15, arsenal=1, earthGate=1),
                  checks=[], milestones={}, errors=[], browser_errors=[], external_requests=[],
                  resources=dict(context_closed=False, server_closed=False, profile_removed=False),
                  requested_renderer='software', quality='low', viewport=[1280, 800],
                  human_playtest=False, ordinaryRAF=False, manual_state_grants=False, synthetic_failure_injection='Storage.setItem quota during one arrival')
    server = thread = context = profile_path = None
    family = report['family']

    def check(name, result):
        report['checks'].append(dict(name=name, passed=bool(result)))
        print(('PASS ' if result else 'FAIL ') + name, flush=True)
        if not result:
            raise AssertionError(name)

    def close_context():
        nonlocal context
        if context is not None:
            context.close()
            context = None
            report['resources']['context_closed'] = True

    class Handler(SimpleHTTPRequestHandler):
        def log_message(self, *_args):
            pass

    try:
        check('qualified source is committed and clean', report['clean_source'])
        check('generated HTML outputs are identical',
              report['source']['index.html'] == report['source']['FIRSTLIGHT_VALLEY.html'])
        # Import after output/source admission, and after the budget wrapper set
        # TEMP. Importing this module for CPU boundary checks allocates nothing.
        from playwright.sync_api import sync_playwright
        from browser_support import launch_kwargs
        server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(ROOT)))
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        origin = f'http://127.0.0.1:{server.server_port}'
        with tempfile.TemporaryDirectory(prefix='firstlight-gate-') as profile, sync_playwright() as pw, ExitStack() as owned:
            profile_path = Path(profile)
            # Close the owned Chromium before stopping its driver on every
            # exception path, including failures in the first page's startup.
            owned.callback(close_context)

            def start():
                nonlocal context
                context = pw.chromium.launch_persistent_context(
                    profile, **launch_kwargs(), viewport={'width': 1280, 'height': 800})
                report['resources']['context_closed'] = False
                def local_only(route):
                    url = route.request.url
                    if urlsplit(url).scheme in ('data', 'blob') or urlsplit(url).netloc == urlsplit(origin).netloc:
                        route.continue_()
                    else:
                        report['external_requests'].append(url)
                        route.abort()
                context.route('**/*', local_only)
                page = context.pages[0] if context.pages else context.new_page()
                page.on('pageerror', lambda error: report['browser_errors'].append(str(error)))
                page.add_init_script(INIT)
                response = page.goto(origin+'/', wait_until='load')
                page.wait_for_function('!!window.Realm')
                check('browser received exact source HTML', response.ok and
                      hashlib.sha256(response.body()).hexdigest() == report['source']['index.html'])
                page.evaluate(ART_OBSERVER)
                page.evaluate("Realm.test.quality('low');Realm.test.render()")
                check('actual WebGL software renderer is active', page.evaluate(
                    "Realm.diagnostics.mode==='webgl2'&&/SwiftShader/i.test(Realm.diagnostics.renderer)"))
                report['browser_version'] = (context.browser.version if context.browser
                                             else page.evaluate('navigator.userAgent'))
                report['renderer'] = page.evaluate('Realm.diagnostics.renderer')
                return page

            page = start()
            ev = lambda script, arg=None: page.evaluate(script, arg)
            state = lambda: ev('Realm.state')
            record = lambda: state()['adventure']['earthGate']
            live = lambda: ev('Realm.diagnostics.earthGate.view')
            render = lambda: ev('Realm.test.render()')

            def close():
                if page.locator('#rpg-window').evaluate('e=>e.open'):
                    page.locator('#rpg-close').click()

            def key(value):
                page.locator('#world').focus()
                page.keyboard.press(value)
                render()

            def action(value, prefix='gate-', item=None):
                selector = f'#rpg-content [data-rpg="{prefix}{value}"]'
                if item is not None:
                    selector += f'[data-id="{item}"]'
                page.locator(selector).first.click()
                render()

            def rules():
                close()
                key('j')
                action('open')

            def walk(x, z):
                close()
                result = ev("""([x,z])=>{const r=Realm.test.move(x,z);if(!r.ok)return r;
                    let ticks=0;while(Realm.test.path.length&&ticks++<12000)Realm.test.step(.05);
                    const p=Realm.diagnostics.adventure.player;
                    return {ok:Math.hypot(p.x-x,p.z-z)<.3,ticks};} """, [x, z])
                check(f'accepted body walk to {x},{z}', result.get('ok'))
                render()

            def screenshot(name):
                page.screenshot(path=str(output/(name+'.png')))

            def travel():
                close()
                if ev('Realm.diagnostics.scene') == 'valley':
                    walk(0, 23)
                    key('e')
                    action('confirm', prefix='earth-')
                check('actual gate enters Hearthwater', ev('Realm.diagnostics.scene') == 'earth-hearthwater-approach')
                walk(0, 10)
                walk(-5, -32)
                key('e')
                check('native E opens the gate captain', page.locator('#rpg-content h2').inner_text() == 'The Gate Captain’s Choice')

            def restart():
                nonlocal page, context
                close()
                if not ev('Realm.diagnostics.adventure.paused'):
                    key('p')
                ev('Realm.test.save()')
                expected = state()
                raw = ev('Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))')
                context.close()
                context = None
                page = start()
                check('whole Chromium restart sees exact original stored bytes', ev('window.__gateStartup') == raw)
                check('cold validation retains the whole saved world', state() == expected)
                check('old browser keys remain absent', not any(k in raw for k in
                      ('eternities.realm09.save.v8', 'eternities.realm08.save.v7')))
                return expected

            def protected():
                return ev("""()=>{const s=Realm.state,a=s.adventure;
                    const adventure=Object.fromEntries(['hp','owned','equipment','arsenal','starter','pursuit',
                    'realmCraft','earthBinding','earthMasterwork','classPath','road','beacon','crossing','companion',
                    'reward','defeated','drops','ore','tonics'].map(k=>[k,a[k]]));
                    const world=Object.fromEntries(['notes','score','scoreRevision','retreat','visitor','flowers',
                    'briarMoments','earthWildSigns','earthHomecoming','cosmosCampaign','atlantisCampaign',
                    'heavenCampaign','hellCampaign','bridgeCommunity','homeHistory','localLife','earthExpedition',
                    'realmTrails'].map(k=>[k,s[k]]));return {adventure,world,placed:s.sandbox.placed};}""")

            check('fresh entry has no hidden gate progress', not state()['adventure']['started'] and record()['accepted'] is False)
            walk(11, 9)
            key('e')
            check('native E earns the initial kit', state()['adventure']['started'])
            if args.bow:
                for node in ('timber-1', 'timber-2', 'fibre-1', 'fibre-2', 'stone-1', 'timber-3', 'fibre-3'):
                    point = ev('id=>RealmSandbox.NODES.find(n=>n.id===id)', node)
                    walk(point['x']+1.1, point['z'])
                    check('accepted gathering: '+node, ev("""id=>{let n=0;
                        while(Realm.state.sandbox.nodes.find(n=>n.id===id).hp){
                            const r=Realm.test.sandbox('gate-gather-'+id+'-'+n++,'gather',{node:id});
                            if(!r.ok)return false;Realm.test.step(1.1);}return true;}""", node))
                walk(11, 9)
                check('craft a bow from gathered supplies', ev("Realm.test.adventure('gate-bow','arsenal-craft',{id:'trail_bow'}).ok"))
                check('explicitly equip crafted bow', ev("Realm.test.adventure('gate-equip','equip',{id:'trail_bow'}).ok"))
            initial = protected()
            initial_inventory = state()['sandbox']['inventory']
            initial_coins, initial_xp = state()['adventure']['coins'], state()['adventure']['xp']
            travel()
            terms = page.locator('#rpg-content').inner_text()
            check('visible terms disclose both costs, once-only reward and uncertainty', all(t in terms for t in ('8 sunmarks','15 XP','4 timber + 2 fibre','no material cost','does not establish')))
            check('reading does not accept', not record()['accepted'])
            screenshot('01-TERMS')
            report['milestones']['terms'] = True
            action('accept')
            check('visible acceptance is saved', record()['accepted'])
            for item in ev('RealmEarthGate.definition.evidence'):
                walk(item['x'], item['z'])
                rules()
                action('read', item=item['id'])
                check('physical evidence read: '+item['id'], item['id'] in record()['evidence'])
            plan = 'temporary-shelter' if args.bow else 'inspection-lane'
            action('choose', item=plan)
            check('selection alone spends nothing', state()['sandbox']['inventory'] == initial_inventory)
            point = ev('id=>RealmEarthGate.definition.plans[id].prepare', plan)
            walk(point['x'], point['z'])
            rules()
            action('prepare')
            expected_inventory = dict(initial_inventory)
            if args.bow:
                expected_inventory['wood'] -= 4
                expected_inventory['fiber'] -= 2
            check('preparation charges exactly the stated finite cost', record()['prepared'] and state()['sandbox']['inventory'] == expected_inventory)
            report['milestones']['preparation'] = True
            close()
            walk(-6, 6)
            render()
            check('all three current actors reach actual renderer batches', ev("new Set(window.__gateArt.filter(p=>p.gateActor).map(p=>p.gateActor)).size===3&&window.__gateArt.filter(p=>p.gatePart==='head').length===3"))
            for projection in ('orthographic', 'perspective'):
                if ev('Realm.diagnostics.camera.projection') != projection:
                    key('v')
                check('V retains '+projection, ev('Realm.diagnostics.camera.projection') == projection)
                screenshot('02-GROUP-'+projection)
            report['milestones']['three_actors'] = report['milestones']['both_cameras'] = True
            key('e')
            action('lead')
            check('native lead returns unpaused control', live()['leading'] and not ev('Realm.diagnostics.adventure.paused'))
            page.locator('#settings').click()
            before_actors = live()['actors']
            ev('for(let i=0;i<20;i++)Realm.test.gateContext().sim.tick(.05)')
            check('Settings holds the world and all three actors', ev('Realm.diagnostics.adventure.paused') and live()['actors'] == before_actors)
            page.locator('#close-panel').click()
            check('closing Settings restores running time', not ev('Realm.diagnostics.adventure.paused'))
            report['milestones']['menu_pause'] = True
            walk(5, 6)
            check('group visibly waits for a distant player', live()['status'] == 'waiting-far')
            still = live()['actors']
            ev('Realm.test.step(1)')
            check('far wait does not invent movement', live()['actors'] == still)
            a = live()['actors'][1]
            walk(a['x'], a['z'])
            report['milestones']['far_wait'] = True
            blocked_checkpoint = record()['checkpoint']
            expected_checkpoint = live()['next']
            check('quota injection has a real next checkpoint', expected_checkpoint is not None)
            ev("""()=>{window.__gateOriginalSet=Storage.prototype.setItem;
                Storage.prototype.setItem=function(){throw new DOMException('SYNTHETIC gate quota','QuotaExceededError');};}""")

            def escort_leg():
                return ev("""()=>{const start=Realm.state.adventure.earthGate.checkpoint;let ticks=0;
                    while(!Realm.state.adventure.earthGate.outcome&&Realm.state.adventure.earthGate.checkpoint===start&&!Realm.diagnostics.earthGate.error&&ticks++<1300){
                        const s=Realm.test.gateContext().sim,a=Realm.diagnostics.earthGate.view.actors[1],p=s.state.player;
                        if(Math.hypot(p.x-a.x,p.z-a.z)>2.2){if(RealmEarth.segment(p,a,.31))s.manual(a.x-p.x,a.z-p.z,.05);else{const r=s.moveTo(a.x,a.z);if(!r.ok)return{ok:false,error:r.error};}}
                        Realm.test.step(.05);
                    }Realm.test.render();return{ok:ticks<1300,ticks,record:Realm.state.adventure.earthGate,error:Realm.diagnostics.earthGate.error};}""")

            result = escort_leg()
            report['quota_observation'] = dict(before=blocked_checkpoint, next=expected_checkpoint, result=result, view=live())
            check('quota failure retains physically reached actors and unadvanced record', result['ok'] and result['error'] and live()['ready'] and record()['checkpoint'] == blocked_checkpoint)
            ev('Storage.prototype.setItem=window.__gateOriginalSet')
            rules()
            check('visible refusal offers explicit retry', page.locator('[data-rpg="gate-retry"]').count() == 1)
            action('retry')
            check('native retry adopts the reached stop once', record()['checkpoint'] == expected_checkpoint and ev('Realm.diagnostics.earthGate.error') is None)
            report['milestones']['quota_retry'] = True
            expected = restart()
            travel()
            check('cold checkpoint retained without hidden leading', record() == expected['adventure']['earthGate'] and not live()['leading'])
            close()
            a = live()['actors'][1]
            walk(a['x'], a['z'])
            key('e')
            action('lead')
            report['milestones']['cold_checkpoint'] = True
            for _ in range(6):
                if record()['outcome']:
                    break
                result = escort_leg()
                check('actual group reaches the next supported stop', result['ok'] and not result['error'])
            check('all three arrive at the selected outcome without paying automatically', record()['outcome'] == ('sheltered' if args.bow else 'admitted') and live()['arrived'] and not record()['claimed'] and state()['adventure']['coins'] == initial_coins)
            screenshot('03-ARRIVAL')
            report['milestones']['arrival'] = True
            walk(-5, -32)
            key('e')
            action('claim')
            check('native fee action awards precisely one payout', record()['claimed'] and state()['adventure']['coins'] == initial_coins+8 and state()['adventure']['xp'] == min(9999, initial_xp+15))
            check('claimed page has no second claim action', page.locator('[data-rpg="gate-claim"]').count() == 0)
            report['milestones']['single_fee'] = True
            check('all prior protected owners survive the outing', protected() == initial and state()['sandbox']['inventory'] == expected_inventory)
            report['milestones']['preserved_owners'] = True
            expected = restart()
            rules()
            check('cold result retains full outcome and paid record', record() == expected['adventure']['earthGate'] and 'no second payout' in page.locator('#rpg-content').inner_text())
            screenshot('04-COLD-RESULT')
            report['milestones']['cold_result'] = True
            report['final_record'] = record()
            check('no browser errors or external requests', not report['browser_errors'] and not report['external_requests'])
            close_context()
    except BaseException:
        report['errors'].append(traceback.format_exc())
    finally:
        if context is not None:
            try:
                close_context()
            except Exception as error:
                report['errors'].append('context cleanup: '+str(error))
        if server is not None:
            if thread is not None and thread.is_alive():
                server.shutdown()
            server.server_close()
            if thread is not None:
                thread.join(timeout=5)
            report['resources']['server_closed'] = thread is None or not thread.is_alive()
        report['resources']['profile_removed'] = profile_path is not None and not profile_path.exists()
        report['source_unchanged'] = (identity() == report['source'] and not status().strip()
            and subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip() == report['head'])
        finish_report(report, output)


if __name__ == '__main__':
    main()
