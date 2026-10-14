"""ET07 visible-control qualification using a disposable loopback character.

Capture mode disables ordinary RAF. Production moveTo and accepted .05s ticks
accelerate travel and advance declared exchanges; native UI, Tab/F/3, V and
settings controls make the decisions. No pose, inventory, damage or score grants.
The bow is command-crafted from actually gathered materials. Whole Chromium
restarts reuse only this caller's temporary profile. Screenshots are controlled
software-WebGL evidence, not human pacing, ordinary-RAF footage or RTX evidence.
Run through tools/browser_budget.py; browser allocation stays serial.
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
MILESTONES = ('terms', 'interruption', 'gold', 'intentional_replay', 'cold_result',
              'both_cameras', 'quiet_motion', 'preserved_owners')
INIT = """window.__ETERNITIES_TEST_MODE=true;
window.__ETERNITIES_CAPTURE_MODE=true;
window.__rainStartup=Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]));"""
ART_OBSERVER = """()=>{const draw=RealmEarthTournamentArt.draw;window.__rainArt=[];
    RealmEarthTournamentArt.draw=function(out,...args){const result=draw.call(this,out,...args);
        window.__rainArt=JSON.parse(JSON.stringify(Object.values(out).flat().filter(i=>i.tournamentPart)));
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
        raise RuntimeError('Rain exhibition native qualification is incomplete; see REPORT.json')


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
                  save_versions=dict(world=9, adventure=14, arsenal=1, earthTournament=1),
                  checks=[], milestones={}, errors=[], browser_errors=[], external_requests=[],
                  resources=dict(context_closed=False, server_closed=False, profile_removed=False),
                  requested_renderer='software', quality='low', viewport=[1280, 800],
                  human_playtest=False, ordinaryRAF=False, manual_state_grants=False)
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
        with tempfile.TemporaryDirectory(prefix='firstlight-rain-') as profile, sync_playwright() as pw, ExitStack() as owned:
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
            record = lambda: state()['adventure']['earthTournament']
            live = lambda: ev('Realm.diagnostics.earthTournament')
            render = lambda: ev('Realm.test.render()')

            def close():
                if page.locator('#rpg-window').evaluate('e=>e.open'):
                    page.locator('#rpg-close').click()

            def key(value):
                page.locator('#world').focus()
                page.keyboard.press(value)
                render()

            def action(value, prefix='tournament-'):
                page.locator(f'#rpg-content [data-rpg="{prefix}{value}"]').first.click()
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

            def until(expression):
                result = ev("""expression=>{let ticks=0;const ready=new Function('return ('+expression+')');
                    while(!ready()&&ticks++<800)Realm.test.step(.05);
                    Realm.test.render();return {ok:!!ready(),ticks};} """, expression)
                check('bounded exchange advancement: '+expression, result['ok'])

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
                walk(5, -27.6)
                key('e')
                check('native E opens the nearby steward', page.locator('#rpg-content h2').inner_text() == 'The Tournament After the Rain')

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
                check('whole Chromium restart sees exact original stored bytes', ev('window.__rainStartup') == raw)
                check('cold validation retains the whole saved world', state() == expected)
                check('old browser keys remain absent', not any(k in raw for k in
                      ('eternities.realm09.save.v8', 'eternities.realm08.save.v7')))
                return expected

            def protected():
                return ev("""()=>{const s=Realm.state,a=s.adventure;
                    const adventure=Object.fromEntries(['xp','hp','owned','equipment','arsenal','starter','pursuit',
                    'realmCraft','earthBinding','earthMasterwork','classPath','road','beacon','crossing','companion',
                    'reward','defeated','drops','coins','ore','tonics'].map(k=>[k,a[k]]));
                    const world=Object.fromEntries(['notes','score','scoreRevision','retreat','visitor','flowers',
                    'briarMoments','earthWildSigns','earthHomecoming','cosmosCampaign','atlantisCampaign',
                    'heavenCampaign','hellCampaign','bridgeCommunity','homeHistory','localLife','earthExpedition',
                    'realmTrails'].map(k=>[k,s[k]]));return {adventure,world,inventory:s.sandbox.inventory,placed:s.sandbox.placed};}""")

            check('initial character has no kit or tournament history',
                  not state()['adventure']['started'] and record()['issued'] == 0)
            walk(11, 9)
            key('e')
            check('native E earns the initial kit', state()['adventure']['started'])
            if args.bow:
                for node in ('timber-1', 'timber-2', 'fibre-1', 'fibre-2', 'stone-1'):
                    point = ev('id=>RealmSandbox.NODES.find(n=>n.id===id)', node)
                    walk(point['x']+1.1, point['z'])
                    check('accepted gathering: '+node, ev("""id=>{let n=0;
                        while(Realm.state.sandbox.nodes.find(n=>n.id===id).hp){
                            const r=Realm.test.sandbox('rain-gather-'+id+'-'+n++,'gather',{node:id});
                            if(!r.ok)return false;Realm.test.step(1.1);}return true;}""", node))
                walk(11, 9)
                check('craft from gathered materials', ev("Realm.test.adventure('rain-bow','arsenal-craft',{id:'trail_bow'}).ok"))
                check('explicitly equip the owned crafted bow', ev("Realm.test.adventure('rain-bow-equip','equip',{id:'trail_bow'}).ok"))
            initial = protected()
            travel()
            terms = page.locator('#rpg-content').inner_text()
            check('visible terms declare scoring, controls, costs and interruption before entry',
                  all(text in terms for text in ('Three exchanges', 'F strikes once', '3 braces',
                      'no attack bonus, XP, currency or material payout', 'an unrecorded result is not saved',
                      '0.52s', '0.75s', '6 stamina', '20 stamina')))
            check('reading terms does not enter', record()['issued'] == 0 and live() is None)
            screenshot('01-TERMS')
            action('observe')
            ev('Realm.test.step(10);Realm.test.render()')
            check('watching a demonstration creates no run or score', record()['issued'] == 0 and live() is None)
            report['milestones']['terms'] = True

            key('e')
            action('enter')
            check('native entry persists one outstanding run without results', record()['issued'] == 1 and
                  record()['closed'] == 0 and record()['finished'][family] == 0)
            restart()
            check('cold entry cannot restore scoring authority', live() is None and record()['issued'] == 1)
            rules()
            check('interruption explains explicit recovery', 'interrupted attempt' in page.locator('#rpg-content').inner_text())
            action('withdraw')
            check('native withdrawal closes only the interrupted run', record()['closed'] == 1 and record()['best'][family] is None)
            report['milestones']['interruption'] = True

            travel()
            action('enter')
            walk(5, -29.8)
            key('Tab')
            check('native Tab selects actual exhibition target', page.locator('#target-name').inner_text() == 'Rain exhibition post')
            check('selection leaves stationary autoattack off', ev('Realm.diagnostics.adventure.tactics.auto') is False)
            before = live()
            rules()
            page.keyboard.press('f')
            page.keyboard.press('3')
            ev('for(let i=0;i<20;i++)Realm.test.tournamentContext().sim.tick(.05)')
            check('real paused ticks and menu keys cannot advance or score the bout', live() == before)
            close()
            before_stamina = state()['adventure']['stamina']
            key('q')
            check('excluded special refuses without cost or point', state()['adventure']['stamina'] == before_stamina and live() == before)
            for index in range(3):
                until(f'Realm.diagnostics.earthTournament.index==={index}&&Realm.diagnostics.earthTournament.phase==="tell"')
                if index == 0:
                    check('actual art draw carries all nine amber ribbon strips', ev(
                        "window.__rainArt.filter(p=>p.tournamentPart==='warning-ribbon').length===9"))
                    for mode in ('orthographic', 'perspective'):
                        if ev('Realm.diagnostics.camera.projection') != mode:
                            key('v')
                        check('native V selects '+mode, ev('Realm.diagnostics.camera.projection') == mode)
                        check('amber cue is visible in '+mode, page.locator('#rain-tournament-hud').is_visible()
                              and 'Amber ribbon' in page.locator('#rain-instruction').inner_text())
                        check('event instructions clear the other HUD controls in '+mode, ev("""()=>{
                            const a=document.querySelector('#rain-tournament-hud').getBoundingClientRect();
                            return a.left>=0&&a.right<=innerWidth&&a.top>=0&&a.bottom<=innerHeight&&
                            ['#target-frame','#quest-tracker','#skillbar','.rpg-nav'].every(selector=>{
                                const el=document.querySelector(selector);if(!el||!el.getClientRects().length)return true;
                                const b=el.getBoundingClientRect();return a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom;
                            });}"""))
                        screenshot('02-AMBER-'+mode)
                    report['milestones']['both_cameras'] = True
                key('3')
                check('native Brace is active at the warning', ev('Realm.diagnostics.adventure.tactics.guardUntil>Realm.state.adventure.elapsed'))
                until('Realm.diagnostics.earthTournament.phase==="opening"')
                check('opening tells the player to reply', 'White pennant' in page.locator('#rain-instruction').inner_text())
                key('f')
                until(f'Realm.diagnostics.earthTournament.rounds[{index}].reply')
                check('real contact adds exactly two points for exchange '+str(index+1), live()['score'] == (index+1)*2)
            until('Realm.diagnostics.earthTournament.complete')
            walk(5, -27.6)
            key('e')
            check('complete result awaits deliberate recording', record()['finished'][family] == 0 and live()['score'] == 6)
            action('record')
            check('native recording retains one gold result', record()['finished'][family] == 1 and record()['best'][family] == 6 and record()['closed'] == 2)
            check('record button disappears after committed result', page.locator('[data-rpg="tournament-record"]').count() == 0)
            screenshot('03-GOLD')
            report['milestones']['gold'] = True

            # A later intentional run must remain possible. This run deliberately
            # attacks early, then defends by accepted sideways body movement.
            # It earns three defense points and leaves the earlier gold intact.
            action('enter')
            walk(5, -29.8)
            key('Tab')
            key('f')
            until('Realm.diagnostics.earthTournament.rounds[0].early')
            check('early actual contact earns no successful reply', live()['score'] == 0 and not live()['rounds'][0]['reply'])
            for index in range(3):
                until(f'Realm.diagnostics.earthTournament.index==={index}&&Realm.diagnostics.earthTournament.phase==="tell"')
                walk(6.65, -29.8)
                until('Realm.diagnostics.earthTournament.phase==="opening"')
                check('actual body clears locked ribbon '+str(index+1), live()['rounds'][index]['defense'] is True)
                walk(5, -29.8)
            until('Realm.diagnostics.earthTournament.complete')
            check('defensive replay has three points, with no invented damage numbers', live()['score'] == 3 and
                  ev('Realm.diagnostics.adventure.tactics.hits.length') == 0)
            walk(5, -27.6)
            key('e')
            action('record')
            check('intentional replay records once without lowering the retained best', record()['issued'] == 3 and
                  record()['closed'] == 3 and record()['finished'][family] == 2 and record()['best'][family] == 6)
            report['milestones']['intentional_replay'] = True

            close()
            page.locator('#settings').click()
            page.locator('#setting-reducedMotion').check()
            page.locator('#close-panel').click()
            render()
            check('native reduced-motion choice is retained', state()['settings']['reducedMotion'] is True)
            check('actual quiet pennant stops decorative rotation', ev(
                "window.__rainArt.filter(p=>p.tournamentPart==='pennant').length===1&&window.__rainArt.find(p=>p.tournamentPart==='pennant').r[1]===0"))
            ev('Realm.test.step(1);Realm.test.render()')
            check('quiet pennant stays still after accepted world time', ev(
                "window.__rainArt.find(p=>p.tournamentPart==='pennant').r[1]===0"))
            report['milestones']['quiet_motion'] = True
            check('quest, gear, currency, music, building and story owners remain intact', protected() == initial)
            report['milestones']['preserved_owners'] = True
            expected = restart()
            rules()
            check('cold result presents retained gold and two completed bouts', record() == expected['adventure']['earthTournament'] and
                  'Gold rain medal' in page.locator('#rpg-content').inner_text())
            check('reopening results cannot reconstruct another payout or live bout', live() is None and
                  page.locator('[data-rpg="tournament-record"]').count() == 0 and record()['finished'][family] == 2)
            report['milestones']['cold_result'] = True
            report['final_record'] = record()
            check('no browser exceptions or external asset requests', not report['browser_errors'] and not report['external_requests'])
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
