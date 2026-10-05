#!/usr/bin/env python3
"""Ordinary-time Cosmos excerpts from an earned prepared support checkpoint.

Native import, Map invitation, journal Walk controls, camera buttons, keyboard
combat and deliberate physical actions run on ordinary requestAnimationFrame.
No test mode, simulation stepping, direct game commands, actor/HP/phase/camera
writes, speed scaling or progress injection. Diagnostics are read-only guides.
The take omits kit, comparator, acceptance and support preparation. Completion
observations are not independent tests, fresh-play proof or human/performance
qualification. Importing this module launches nothing or generates fixtures.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import argparse
import hashlib
import importlib.util
import json
import math
import os
import re
import sys
import threading
import time
import traceback

sys.dont_write_bytecode = True
ROOT = Path(os.environ.get('FIRSTLIGHT_ROOT', Path(__file__).resolve().parents[1])).resolve()
CHECKPOINT = '02_DISTINCT_SUPPORTS'
CHOICES = ('public-record', 'bounded-account')
OWNER_KEYS = ('journeys', 'realmTrails', 'earthExpedition', 'hellCampaign', 'heavenCampaign',
              'atlantisCampaign', 'bridgeCommunity', 'localLife', 'homeHistory', 'notes', 'score',
              'scoreRevision', 'retreat', 'visitor', 'flowers')
ADVENTURE_KEYS = ('owned', 'equipment', 'arsenal', 'starter', 'pursuit', 'realmCraft', 'earthBinding',
                  'classPath', 'companion', 'beacon', 'crossing', 'road', 'earthStory', 'earthNotes',
                  'earthGathering', 'defeated', 'drops', 'reward', 'relic', 'angelSeen')
FORBIDDEN_PREPARED = ('test-service-route', 'challenge-reclaimer', 'reclaimer-settled', 'isolate-service-feed', 'challenge-guardian',
                      'release-west-feed', 'release-east-feed', 'guardian-settled', 'disable-central-link',
                      'accountability', 'open-confluence', 'verify-open-bearings')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def digest(value):
    return hashlib.sha256(value.encode('utf8')).hexdigest() if value is not None else None


def load_module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_guards(root=ROOT):
    # Actual integrated pure preflight, not a missing-integration facade.
    path = Path(root)/'tools/cosmos_campaign_browser.py'
    if not path.is_file():
        raise ValueError('Install the actual Cosmos native preflight before capture preparation.')
    return load_module(path, 'firstlight_cosmos_capture_guards')


def wallet(world):
    return {k: world['adventure'][k] for k in ('xp', 'coins', 'ore')}


def direction_keys(point, snapshot):
    """Nearest of eight camera-relative headings, using ordinary WASD only."""
    player, yaw = snapshot['adventure']['player'], snapshot['camera']['yaw']
    dx, dz = point['x']-player['x'], point['z']-player['z']
    x, z = dx*math.cos(yaw)-dz*math.sin(yaw), dx*math.sin(yaw)+dz*math.cos(yaw)
    if x == 0 and z == 0:
        return []
    edge = math.tan(math.pi/8)
    keys = []
    if abs(x) >= abs(z)*edge:
        keys.append('d' if x > 0 else 'a')
    if abs(z) >= abs(x)*edge:
        keys.append('s' if z > 0 else 'w')
    return keys


def walk_selector(identifier):
    return f'#rpg-content [data-rpg="cosmos-campaign-walk"][data-id="{identifier}"]'


def action_selector(identifier, kind):
    if kind not in ('interact', 'configure'):
        raise ValueError('Actual combat and deliberate choice own defeat/account facts.')
    action = 'configure' if kind == 'configure' else 'step'
    return f'#rpg-content [data-rpg="cosmos-campaign-{action}"][data-id="{identifier}"]'


def warning_waypoints(enemy):
    # The northern court road avoids the west cover's full player margin,
    # including when a legitimate action starts at its exact physical anchor.
    if enemy['id']=='cosmos-still-meridian-guardian-v1':
        return [{'x':47,'z':-41},{'x':enemy['x'],'z':enemy['z']+3}]
    return [{'x':enemy['x'],'z':enemy['z']+3}]


def prepared_terms(world, supports):
    q = world.get('cosmosCampaign', {})
    steps = q.get('steps', [])
    if (q.get('version') != 1 or q.get('accepted') is not True or q.get('claimed') is not False or
            q.get('opened') is not False or q.get('choice') is not None or 'read-local-cost' not in steps or
            any(s in steps for s in FORBIDDEN_PREPARED)):
        raise ValueError('Use the earned distinct-support checkpoint before either machine, account or fee.')
    completed = []
    for lead in ('material', 'living', 'observation'):
        if lead+'-fit' in steps or 'assist-'+lead in steps:
            completed.append(lead)
    if len(completed) < 2 or set(completed) != {s['id'] for s in supports}:
        raise ValueError('Prepared supports must match the actual completed source plan.')
    return q


def preflight(source, output, root=ROOT, *, windows=None, guards=None):
    root = Path(root).resolve()
    source_arg = Path(source)
    if not Path(output).is_absolute() or not source_arg.is_absolute():
        raise ValueError('Capture input/output must be explicit absolute paths.')
    guards = guards or load_guards(root)
    source = guards.bounded(source_arg, windows=windows)
    output = guards.bounded(output, windows=windows)
    if guards.within(output, root) or guards.within(root, output):
        raise ValueError('Capture output/profile must be outside the actual source checkout.')
    if output.exists() or output == source.parent or guards.within(output, source.parent) or guards.within(source.parent, output):
        raise ValueError('Use a new separate D capture directory; never overwrite/copy source evidence.')
    if source.name != CHECKPOINT+'.json' or not source.is_file():
        raise ValueError('Capture starts only from exact 02_DISTINCT_SUPPORTS.json.')
    proof = guards.read_json(source.with_name('SEED_PROVENANCE.json'))
    flags = [k for k,v in guards.VARIANTS.items() if v[0] == proof.get('variant')]
    if len(flags) != 1 or source.parent.name != proof.get('variant'):
        raise ValueError('Unknown or mismatched earned family.')
    sources = source.parent.parent
    provenance, frozen = guards.read_provenance(sources, (flags[0],), root)
    receipt = provenance[proof['variant']]
    if receipt['journey']['checkpointHashes'].get(CHECKPOINT) != sha(source):
        raise ValueError('Prepared checkpoint bytes do not match the complete journey link.')
    initial = guards.read_json(source)
    prepared_terms(initial, receipt['journey']['plan']['supports'])
    if sha(root/'index.html') != sha(root/'FIRSTLIGHT_VALLEY.html'):
        raise ValueError('Both checked-in runtime pages must be byte-identical.')
    html = (root/'index.html').read_text(encoding='utf-8-sig')
    for name in ('cosmos-campaign-data.js','cosmos-campaign.js','cosmos-campaign-ui.js','cosmos-campaign-art.js',
                 'cosmos.js','cosmos-art.js','cosmos-ui.js','core.js','adventure.js','arsenal.js','combat.js','rpg-ui.js','app.js'):
        if (root/'src'/name).read_text(encoding='utf-8-sig').strip() not in html:
            raise ValueError('Actual assembled runtime does not embed '+name)
    return source, output, initial, receipt, frozen, guards


def epoch(root=ROOT):
    root = Path(root)
    files = [*sorted(p for p in (root/'src').iterdir() if p.is_file()), root/'build.py',root/'index.html',root/'FIRSTLIGHT_VALLEY.html',
             root/'tools/browser_support.py',root/'tools/cosmos_campaign_browser.py',root/'tests/cosmos_campaign_journey.cjs',Path(__file__).resolve(),
             Path(__file__).resolve().parents[1]/'tests/test_capture_cosmos_campaign.py']
    return {str(p.resolve()): sha(p) for p in files}


def write_new(path, value):
    with Path(path).open('x',encoding='utf8') as handle:
        json.dump(value,handle,indent=2,ensure_ascii=False)
        handle.write('\n')


class Capture:
    def __init__(self, args, report, source_terms):
        self.args,self.report,self.source_terms = args,report,source_terms
        self.page=self.context=self.pw=self.server=self.video=None
        self.held=set();self.started=time.monotonic();self.mark_serial=0

    def check(self,name,ok,detail=None):
        self.report['condition_evaluations'].append({'name':name,'ok':bool(ok),'detail':detail,'seconds':time.monotonic()-self.started})
        if not ok:
            raise AssertionError(name+': '+str(detail))

    def state(self):
        return self.page.evaluate('()=>Realm.state')

    def diag(self):
        return self.page.evaluate('()=>{const d=Realm.diagnostics;return{scene:d.scene,mode:d.mode,renderer:d.renderer,cosmos:d.cosmos,adventure:d.adventure,characters:d.characters,camera:{preset:d.camera.preset,yaw:d.camera.yaw,projection:d.camera.projection},saveState:d.saveState,errors:d.errors};}')

    def click(self,selector):
        control=self.page.locator(selector)
        self.check('unique ordinary native control '+selector,control.count()==1,control.count())
        self.report['inputs'].append({'click':selector,'seconds':time.monotonic()-self.started})
        control.click()

    def press(self,key):
        self.report['inputs'].append({'key':key,'seconds':time.monotonic()-self.started})
        self.page.keyboard.press(key)

    def hold(self,keys,milliseconds):
        self.report['inputs'].append({'hold':list(keys),'milliseconds':milliseconds,'seconds':time.monotonic()-self.started})
        try:
            for key in keys:
                self.page.keyboard.down(key);self.held.add(key)
            self.page.wait_for_timeout(milliseconds)
        finally:
            for key in keys:
                self.page.keyboard.up(key);self.held.discard(key)

    def close(self):
        if self.page.locator('#rpg-window').evaluate('(e)=>e.open'):
            self.click('#rpg-close')

    def workspace(self,tab='cosmos-campaign'):
        self.close();self.press('j')
        if tab=='cosmos-campaign':
            self.click('#rpg-content [data-rpg="cosmos-campaign-open"]')
        elif tab=='cosmos':
            self.click('#rpg-tabs [data-rpg="open"][data-id="atlas"]')
            self.click('#rpg-content [data-rpg="cosmos-invitation"]')
        else:
            self.click(f'#rpg-tabs [data-rpg="open"][data-id="{tab}"]')

    def mark(self,label):
        self.mark_serial+=1
        path=self.args.output/f'{self.mark_serial:02d}_{label}.png'
        self.report['events'].append({'label':label,'seconds':time.monotonic()-self.started,'diagnostics':self.diag(),'campaign':self.state()['cosmosCampaign']})
        self.page.screenshot(path=str(path))
        self.report['screenshots'].append({'path':str(path),'sha256':sha(path)})

    def ready(self):
        self.page.wait_for_function('()=>!!window.Realm',timeout=30000)
        self.page.wait_for_function('()=>getComputedStyle(document.querySelector("#loading")).opacity==="0"',timeout=30000)
        self.check('ordinary interface has no test mode/API',self.page.evaluate('()=>!Reflect.has(Realm,"test")&&!window.__ETERNITIES_TEST_MODE'))

    def new_context(self,record):
        support=load_module(self.args.root/'tools/browser_support.py','cosmos_capture_browser_support')
        options={'viewport':self.report['viewport']}
        if record:
            options.update(record_video_dir=str(self.args.output),record_video_size=self.report['viewport'])
        launch_at=time.monotonic()-self.started
        self.context=self.pw.chromium.launch_persistent_context(str(self.args.output/'profile'),**support.launch_kwargs(self.args.renderer),**options)
        if record:
            self.report['recording_start_wall_interval']=[launch_at,time.monotonic()-self.started]
        # Observe exact cold-start storage before any app update. This does not
        # set a game flag, owner, storage key, clock or simulation state.
        self.context.add_init_script('window.__cosmosCaptureStartupBytes=localStorage.getItem("eternities.realm10.characters.v1");')
        # Reuse the initial page; new_page would create an unnecessary second raw.
        self.check('one native page in the one owned profile',len(self.context.pages)<=1,len(self.context.pages))
        self.page=self.context.pages[0] if self.context.pages else self.context.new_page()
        if record:
            self.video=self.page.video
        self.context.route('**/*',lambda route:route.continue_() if route.request.url.startswith(self.origin+'/') else route.abort())
        self.page.on('pageerror',lambda error:self.report['errors'].append(str(error)))
        self.page.on('console',lambda msg:self.report['console_errors'].append(msg.text) if msg.type=='error' else None)
        response=self.page.goto(self.origin+'/index.html',wait_until='load')
        self.ready()
        self.check('exact frozen HTML is served',response is not None and hashlib.sha256(response.body()).hexdigest()==self.report['html_sha256'])
        d=self.diag()
        self.check('actual WebGL2 client available',d['mode']=='webgl2',d['renderer'])
        self.report.setdefault('renderer',d['renderer'])
        software=any(x in (d['renderer'] or '').lower() for x in ('swiftshader','llvmpipe','software'))
        self.check('requested hardware/software renderer is reported',bool(d['renderer']) and (software if self.args.renderer=='software' else not software),d['renderer'])

    def still_near(self,point,label,timeout=150):
        began,prior,stable=time.monotonic(),None,None
        while time.monotonic()-began<timeout:
            self.defend()
            p=self.diag()['adventure']['player']
            n=math.hypot(p['x']-point['x'],p['z']-point['z'])
            motion=math.inf if prior is None else math.hypot(p['x']-prior['x'],p['z']-prior['z'])
            if n<2.75 and motion<.015:
                stable=stable or time.monotonic()
                if time.monotonic()-stable>.35:
                    return
            else:
                stable=None
            prior=p;self.page.wait_for_timeout(100)
        raise TimeoutError('Native Walk did not settle near '+label)

    def walk(self,identifier):
        self.workspace()
        point=self.definition['giver'] if identifier=='claim' else self.steps[identifier]
        selector=walk_selector(identifier)
        count=self.page.locator(selector).count()
        if count==1:
            self.click(selector);self.still_near(point,identifier)
        elif count==0:
            # The actual UI offers a physical action when already in range.
            # Defeat guidance has no Walk/action button; never invent one.
            expected='[data-rpg="cosmos-campaign-claim"]' if identifier=='claim' else action_selector(identifier,point['kind']) if point['kind'] in ('interact','configure') else '[data-rpg="cosmos-campaign-review"]'
            self.check('current physical UI already reaches '+identifier,self.page.locator(expected).count()>0)
            self.close()
        else:
            self.check('Walk control is unique '+identifier,False,count)

    def physical(self,identifier):
        point=self.steps[identifier]
        self.walk(identifier);self.workspace()
        before=self.state()
        self.click(action_selector(identifier,point['kind']))
        after=self.state()
        self.check('actual saved physical work '+identifier,identifier in after['cosmosCampaign']['steps'])
        self.check('physical work never pays independent fee '+identifier,wallet(before)==wallet(after) and before['sandbox']['inventory']==after['sandbox']['inventory'])
        self.close()

    def defend(self):
        d,world=self.diag(),self.state()
        ad=d['adventure'];a=world['adventure']
        self.check('alive during ordinary route/combat',a['hp']>0)
        if any(e['mode']=='windup' for e in ad['enemies']) and a['stamina']>=20 and a['elapsed']>=ad['tactics']['cooldowns']['guard']:
            self.press('3');self.report['native_guard_inputs']+=1
        if a['hp']<45 and a['tonics'] and time.monotonic()-getattr(self,'last_heal',0)>.5:
            self.press('6');self.last_heal=time.monotonic()

    def steer(self,point,label,tolerance=.16,timeout=40):
        self.close();began=time.monotonic();prior=None;last_change=began
        while time.monotonic()-began<timeout:
            self.defend();d=self.diag();p=d['adventure']['player']
            n=math.hypot(point['x']-p['x'],point['z']-p['z'])
            if n<tolerance:
                self.report['movements'].append({'label':label,'seconds':time.monotonic()-began,'player':p,'ordinaryKeyboard':True})
                return
            if prior and math.hypot(p['x']-prior['x'],p['z']-prior['z'])>.025:
                last_change=time.monotonic()
            self.check('ordinary keyboard route makes progress '+label,time.monotonic()-last_change<6)
            keys=direction_keys(point,d)
            self.hold(keys,min(120,max(35,int(n*55))))
            self.report['native_movement_inputs']+=1
            self.check('actual Cosmos body stays supported',self.diag()['scene']!=self.definition['room'] or self.diag()['cosmos']['walkable'] is True)
            prior=p
        raise TimeoutError('Ordinary keyboard approach did not reach '+label)

    def camera(self,view):
        self.close();self.click(f'#rpg-hud [data-rpg="camera"][data-id="{view}"]');self.press('r')
        expected='perspective' if view=='adventure' else 'orthographic'
        self.page.wait_for_function('p=>Realm.diagnostics.camera.projection===p',arg=expected,timeout=5000)
        self.check('actual native '+view+' projection',self.diag()['camera']['preset']==view)

    def select(self,enemy):
        for _ in range(8):
            self.press('Tab')
            if self.diag()['adventure']['tactics']['target']==enemy['id']:
                break
        self.check('actual native target '+enemy['id'],self.diag()['adventure']['tactics']['target']==enemy['id'])
        self.click('#target-framing')

    def observe_warnings(self,enemy,kinds,label):
        needed={(kind,view) for kind in kinds for view in ('adventure','follow')}
        seen=set();began=time.monotonic();trace=[]
        self.camera('adventure')
        while time.monotonic()-began<90 and not needed.issubset(seen):
            self.defend();d=self.diag();e=next((e for e in d['adventure']['enemies'] if e['id']==enemy['id']),None)
            self.check('live owned machine remains for warning observation',e is not None and e['hp']>0)
            self.check('municipal actor remains at its real foundation',math.hypot(e['x']-enemy['x'],e['z']-enemy['z'])<1e-6 and e['maxHP']==enemy['hp'])
            trace.append({'seconds':time.monotonic()-began,'enemy':e,'player':d['adventure']['player'],'health':self.state()['adventure']['hp']})
            view=d['camera']['preset'];kind=e.get('strike',{}).get('kind') if e.get('strike') else None
            pair=(kind,view)
            if e['mode']=='windup' and e['timer']>.45 and pair in needed and pair not in seen:
                frame=e['strike'];self.mark(label+'_'+kind+'_'+view)
                after=next((e for e in self.diag()['adventure']['enemies'] if e['id']==enemy['id']),None)
                if after and after['mode']=='windup' and after.get('strike')==frame:
                    seen.add(pair)
                else:
                    self.report['missed_warning_frames'].append({'label':label,'kind':kind,'view':view,'reason':'ordinary screenshot latency crossed actual warning phase'})
            if all((k,view) in seen for k in kinds) and any((k,'follow' if view=='adventure' else 'adventure') not in seen for k in kinds):
                self.camera('follow' if view=='adventure' else 'adventure')
            self.page.wait_for_timeout(80)
        self.check('actual '+label+' warnings captured in both native cameras',needed.issubset(seen),sorted(seen))
        self.report['warnings'].append({'label':label,'enemy':enemy['id'],'seen':sorted(seen),'trace':trace,'seconds':time.monotonic()-began})

    def weapon_effect(self,enemy):
        before=self.diag();e=next(e for e in before['adventure']['enemies'] if e['id']==enemy['id'])
        style=before['adventure']['weapon']['style'];arrows=False;began=time.monotonic();hits=[]
        self.press('f')
        while time.monotonic()-began<3:
            d=self.diag();arrows |= bool(d['adventure']['arrows'])
            hits=[h for h in d['adventure']['tactics']['hits'] if h.get('n',0)>0 and math.hypot(h['x']-enemy['x'],h['z']-enemy['z'])<.001]
            live=next((x for x in d['adventure']['enemies'] if x['id']==enemy['id']),None)
            if (live is None and enemy['defeatStep'] in self.state()['cosmosCampaign']['steps']) or (live and live['hp']<e['hp']):
                self.check('native F has confirmed ordinary '+style+' effect',style!='bow' or arrows)
                self.report['weapon_effects'].append({'enemy':enemy['id'],'style':style,'beforeHP':e['hp'],'afterHP':live['hp'] if live else 0,'travelingArrowObserved':arrows,'positiveCoordinateHitValues':hits,'seconds':time.monotonic()-began,'attribution':'Native F, owned target HP decrease and (for bow) actual traveling arrow; no generic hit counter alone proves weapon attribution.'})
                return
            self.page.wait_for_timeout(20)
        self.check('native F produces real target HP effect',False,{'enemy':enemy['id'],'style':style,'arrows':arrows})

    def fight(self,enemy,kinds):
        self.close();before=self.state();style=self.diag()['adventure']['weapon']['style']
        self.camera('adventure');self.select(enemy)
        for i,point in enumerate(warning_waypoints(enemy)):
            self.steer(point,'supported ordinary warning approach '+str(i+1))
        self.observe_warnings(enemy,kinds,enemy['pattern'])
        self.camera('adventure');self.select(enemy)
        self.steer({'x':enemy['x'],'z':enemy['z']+(3.0 if style=='bow' else 1.4)},'ordinary owned '+style+' range')
        self.weapon_effect(enemy)
        if enemy['defeatStep'] not in self.state()['cosmosCampaign']['steps']:
            self.press('1')
        began=time.monotonic();trace=[]
        while time.monotonic()-began<150 and enemy['defeatStep'] not in self.state()['cosmosCampaign']['steps']:
            self.defend();d=self.diag();e=next((e for e in d['adventure']['enemies'] if e['id']==enemy['id']),None)
            self.check('actual actor persists until saved owned exhaustion',e is not None)
            trace.append({'seconds':time.monotonic()-began,'enemy':e,'player':d['adventure']['player'],'hp':self.state()['adventure']['hp']})
            if style=='blade' and math.hypot(d['adventure']['player']['x']-e['x'],d['adventure']['player']['z']-e['z'])>2.15:
                self.hold(direction_keys(e,d),100);self.report['native_movement_inputs']+=1
            if not d['adventure']['tactics']['auto']:
                self.press('1')
            self.page.wait_for_timeout(100)
        after=self.state()
        self.check('real normal-time owned exhaustion '+enemy['defeatStep'],enemy['defeatStep'] in after['cosmosCampaign']['steps'])
        if self.diag()['adventure']['tactics']['auto']:
            self.press('1')
        self.check('machine grants no independent fee or legacy reward',wallet(after)==wallet(before) and after['sandbox']['inventory']==before['sandbox']['inventory'] and all(after['adventure'][k]==before['adventure'][k] for k in ('drops','defeated')))
        self.report['combat'].append({'enemy':enemy['id'],'seconds':time.monotonic()-began,'trace':trace})
        self.mark('actual_'+enemy['defeatStep'])

    def companion(self,mode):
        self.workspace('companion');self.click(f'#rpg-content [data-rpg="companion"][data-id="{mode}"]')
        self.check('deliberate ordinary companion '+mode,self.state()['adventure']['companion']['mode']==mode)
        self.close()

    def run(self):
        root=self.args.root
        class Handler(SimpleHTTPRequestHandler):
            def __init__(self,*a,**kw):super().__init__(*a,directory=str(root),**kw)
            def log_message(self,*a):pass
        self.server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
        threading.Thread(target=self.server.serve_forever,daemon=True).start()
        self.origin='http://127.0.0.1:'+str(self.server.server_port)
        self.report['origin']=self.origin
        from playwright.sync_api import sync_playwright
        self.pw=sync_playwright().start()
        self.new_context(record=True)
        self.report['browser']=self.page.evaluate('navigator.userAgent')
        self.workspace('characters')
        legacy=self.page.evaluate('()=>localStorage.getItem(RealmCore.KEY)')
        with self.page.expect_file_chooser() as chooser:self.click('#rpg-content [data-rpg="chars-import"]')
        chooser.value.set_files(str(self.args.source))
        self.page.wait_for_selector('[data-rpg="chars-confirm-import"]')
        self.click('[data-rpg="chars-confirm-import"]')
        self.page.wait_for_function('()=>Realm.diagnostics.characters.active==="character-2"&&Realm.diagnostics.characters.writer',timeout=30000)
        imported=self.state();self.active=self.diag()['characters']['active']
        self.original_slot=self.page.evaluate('()=>{const r=JSON.parse(localStorage.getItem(RealmCharacters.KEY));return r.slots.find(s=>s.id!==r.active);}')
        self.check('native checkpoint import retains genuinely earned prepared facts',imported['cosmosCampaign']==self.source_terms['cosmosCampaign'])
        self.check('isolated import preserves original legacy bytes',self.page.evaluate('()=>localStorage.getItem(RealmCore.KEY)')==legacy)
        self.definition=self.page.evaluate('RealmCosmosCampaign.definition');self.steps={s['id']:s for s in self.definition['steps']}
        # Native quality is a preference, never a test/renderer mutation API.
        self.close();self.click('#settings')
        self.page.locator('#quality').select_option('balanced')
        self.report['native_quality']='balanced'
        self.click('#close-panel')
        self.workspace('cosmos')
        gatewalk=self.page.locator('#rpg-content [data-rpg="cosmos-walk"][data-id="gate"]')
        if gatewalk.count():
            self.click('#rpg-content [data-rpg="cosmos-walk"][data-id="gate"]')
            gate=self.page.evaluate('RealmCosmos.GATE');self.still_near(gate,'ordinary Cosmos gate')
            self.workspace('cosmos')
        self.click('#rpg-content [data-rpg="cosmos-confirm"]')
        self.check('native Map invitation reaches real Cosmos owner',self.diag()['scene']==self.definition['room'] and self.diag()['cosmos']['walkable'])
        self.mark('earned_prepared_continuation')
        original_companion=imported['adventure']['companion']
        if original_companion['bonded'] and original_companion['mode']=='follow':self.companion('stay')
        self.physical('test-service-route');self.mark('actual_supported_service_route')
        self.physical('challenge-reclaimer')
        self.fight(self.definition['enemies'][0],('line',))
        self.physical('isolate-service-feed');self.mark('actual_service_feed_isolated')
        self.physical('challenge-guardian')
        self.fight(self.definition['enemies'][1],('annulus','cross'))
        # Actual exhaustion is separate from physical feed releases, disabling
        # the central project, deliberate account, open state and fixed fee.
        for identifier in ('release-west-feed','release-east-feed','disable-central-link'):
            self.physical(identifier);self.mark('actual_'+identifier)
        if original_companion['bonded'] and original_companion['mode']=='follow':self.companion('follow')
        self.walk('accountability');self.workspace()
        before_choice=self.state()['cosmosCampaign']
        self.click(f'#rpg-content [data-rpg="cosmos-campaign-review"][data-id="{self.args.choice}"]')
        self.check('account preview grants nothing',self.state()['cosmosCampaign']==before_choice)
        self.mark('deliberate_account_preview')
        self.click(f'#rpg-content .cosmos-campaign-confirm [data-rpg="cosmos-campaign-confirm"][data-id="{self.args.choice}"]')
        self.check('explicit local account retained',self.state()['cosmosCampaign']['choice']==self.args.choice)
        self.close();self.mark('saved_local_account')
        for lead in self.report['support_plan']:
            self.physical('configure-'+lead['id'])
        self.physical('open-confluence')
        for view in ('adventure','follow'):
            self.camera(view);self.mark('independently_open_'+self.args.choice+'_'+view)
        self.physical('verify-open-bearings');self.mark('verified_open_unpaid')
        self.check('complete physical operation remains unpaid',not self.state()['cosmosCampaign']['claimed'] and wallet(self.state())==wallet(imported) and self.state()['sandbox']['inventory']==imported['sandbox']['inventory'])
        self.walk('claim');self.workspace();before=self.state();self.click('#rpg-content [data-rpg="cosmos-campaign-claim"]')
        paid=self.state();fee=self.definition['reward'];expected=dict(before['sandbox']['inventory'])
        for k,n in fee['materials'].items():expected[k]+=n
        self.check('whole fixed fee explicitly claimed once',paid['cosmosCampaign']['claimed'] and paid['adventure']['xp']-before['adventure']['xp']==min(fee['xp'],9999-before['adventure']['xp']) and all(paid['adventure'][k]-before['adventure'][k]==fee[k] for k in ('coins','ore')) and paid['sandbox']['inventory']==expected)
        self.check('fee never equips or refills resources',all(paid['adventure'][k]==before['adventure'][k] for k in ('equipment','hp','stamina','tonics')))
        self.check('all previous owners and companion choice survive',all(paid[k]==imported[k] for k in OWNER_KEYS) and all(paid['adventure'][k]==imported['adventure'][k] for k in ADVENTURE_KEYS))
        self.mark('paid_local_arrangement');self.close()
        self.click('#cosmos-home')
        self.page.wait_for_function('()=>Realm.diagnostics.scene==="valley"',timeout=10000)
        self.check('ordinary native return retains paid arrangement',self.state()['cosmosCampaign']==paid['cosmosCampaign'])
        self.mark('ordinary_native_return_home')
        native=self.page.evaluate('()=>localStorage.getItem(RealmCharacters.KEY)')
        self.report['paid_native_bytes']=native;self.report['paid_native_sha256']=digest(native)
        # Finish the sole raw take, then cold-launch the SAME profile with no
        # recorder. This avoids an extra reload-page take or profile copy.
        self.context.close();self.context=self.page=None
        self.raw_receipt()
        self.new_context(record=False)
        self.page.wait_for_function('active=>Realm.diagnostics.characters.active===active&&Realm.diagnostics.characters.writer',arg=self.active,timeout=30000)
        startup=self.page.evaluate('()=>window.__cosmosCaptureStartupBytes')
        self.check('whole-Chromium cold reload preserves exact native library',startup==native)
        reloaded=self.state()
        self.check('cold load retains actual opened account and exact paid fee',reloaded['cosmosCampaign']==paid['cosmosCampaign'] and wallet(reloaded)==wallet(paid) and reloaded['sandbox']['inventory']==paid['sandbox']['inventory'] and self.diag()['scene']=='valley' and self.diag()['characters']['active']==self.active)
        slot=self.page.evaluate('()=>{const r=JSON.parse(localStorage.getItem(RealmCharacters.KEY));return r.slots.find(s=>s.id!==r.active);}')
        self.check('original other native slot retained',slot==self.original_slot)
        self.report['cold_reload']={'native_bytes':startup,'native_sha256':digest(startup),'world':reloaded,'recorded':False,'same_profile':True,'startup_observation':'Read-only init script before app execution; no storage or game state writes.'}
        self.mark('unrecorded_cold_reload_preserved_home')
        self.check('no browser/console errors hidden',not self.report['errors'] and not self.report['console_errors'])

    def raw_receipt(self):
        if self.video:
            path=Path(self.video.path())
            self.report['raw_video']={'path':str(path),'sha256':sha(path),'bytes':path.stat().st_size,'speed':'ordinary unretimed recorder output'}
            self.video=None

    def stop(self):
        if self.page:
            for key in tuple(self.held):
                try:self.page.keyboard.up(key)
                except Exception:self.report.setdefault('key_release_errors',[]).append(traceback.format_exc())
        try:
            if self.context:self.context.close();self.context=self.page=None
            self.raw_receipt()
        finally:
            if self.pw:self.pw.stop()
            if self.server:self.server.shutdown();self.server.server_close()


def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,default=ROOT)
    parser.add_argument('--source',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--renderer',choices=('hardware','software'),default='hardware')
    parser.add_argument('--choice',choices=CHOICES,default='public-record')
    parser.add_argument('--source-head',help='Optional parent-supplied source head; hashes remain authoritative.')
    parser.add_argument('--preflight-only',action='store_true',help='Read and hash complete earned inputs/current source; create no output or browser.')
    args=parser.parse_args(argv);args.root=args.root.resolve()
    try:
        if args.source_head and not re.fullmatch('[0-9a-f]{40}',args.source_head):raise ValueError('Source head must be a full parent-supplied SHA.')
        args.source,args.output,initial,proof,frozen,guards=preflight(args.source,args.output,args.root)
        hashes=epoch(args.root)
        if args.preflight_only:
            print(json.dumps({'status':'preflight-only','variant':proof['proof']['variant'],'prepared_checkpoint':str(args.source),
                              'prepared_sha256':sha(args.source),'complete_report_sha256':sha(args.source.with_name('COSMOS_CAMPAIGN_JOURNEY_REPORT.json')),
                              'html_sha256':sha(args.root/'index.html'),'frozen_input_files':len(frozen),'source_files':len(hashes),
                              'output_created':False,'browser_launched':False,'native_capture_completed':False},indent=2))
            return 0
        args.output.mkdir(parents=True,exist_ok=False)
    except (OSError,ValueError,json.JSONDecodeError) as error:parser.error(str(error))
    report={'status':'running','method':__doc__,'source':str(args.source),'source_sha256':sha(args.source),'source_receipts':frozen,
            'parent_supplied_head':args.source_head,'html_sha256':sha(args.root/'index.html'),'source_hashes':hashes,
            'complete_earned_report_sha256':sha(args.source.with_name('COSMOS_CAMPAIGN_JOURNEY_REPORT.json')),
            'support_plan':proof['journey']['plan']['supports'],'renderer_requested':args.renderer,'choice_requested':args.choice,
            'viewport':{'width':1440,'height':900},'events':[],'screenshots':[],'inputs':[],'errors':[],'console_errors':[],
            'condition_evaluations':[],'warnings':[],'missed_warning_frames':[],'combat':[],'weapon_effects':[],'movements':[],
            'native_guard_inputs':0,'native_movement_inputs':0,'normal_time_footage':True,'accelerated_ticks':False,'test_mode':False,
            'direct_game_commands':0,'simulation_steps':0,'speed_scaling':0,'manual_damage':0,'planted_quest_facts':0,
            'actor_position_writes':0,'camera_state_writes':0,'inventory_grants':0,'health_grants':0,'forced_modes':0,'forced_cycles':0,
            'profile_limit':1,'raw_take_limit':1,'source_copies':0,'profile_copies':0,'intermediate_movies':0,
            'human_acceptance':False,'performance_qualification':False,'fps_claim':False,
            'scope':'Excerpts from a genuinely earned prepared support checkpoint; kit/comparator/acceptance/preparation omitted.',
            'condition_scope':'Safety/completion observations and repeated polling, not independent test counts.',
            'damage_attribution':'Native F plus actual target HP effect and bow arrow observation; coordinate hit n values alone do not establish weapon-only attribution.'}
    write_new(args.output/'RUN_INPUTS.json',report)
    capture=Capture(args,report,initial)
    try:
        capture.run();report['status']='passed'
    except Exception:
        report['status']='failed';report['failure']=traceback.format_exc()
        if capture.page:
            try:
                capture.mark('FAILURE');report['failure_world']=capture.state();report['failure_diagnostics']=capture.diag()
            except Exception:report['failure_capture_error']=traceback.format_exc()
    finally:
        try:capture.stop()
        except Exception:report['cleanup_failure']=traceback.format_exc();report['status']='failed'
        try:
            report['final_source_hashes']=epoch(args.root)
            report['final_source_receipts']={p:sha(p) if Path(p).is_file() else None for p in frozen}
            report['final_source_epoch']=guards.source_epoch(args.root)
            report['source_frozen']=report['final_source_hashes']==hashes and report['final_source_receipts']==frozen and report['final_source_epoch']==proof['journey']['sourceHashes']
        except Exception:report['source_frozen']=False;report['final_hash_error']=traceback.format_exc()
        raw=list(args.output.glob('*.webm'));report['raw_file_count']=len(raw)
        report['retained_raw_files']=[{'path':str(p),'sha256':sha(p),'bytes':p.stat().st_size} for p in raw]
        if not report['source_frozen'] or len(raw)!=1 or 'raw_video' not in report:report['status']='failed'
        report['wall_seconds']=time.monotonic()-capture.started
        write_new(args.output/'REPORT.json',report)
        print(json.dumps({'status':report['status'],'condition_evaluations':len(report['condition_evaluations']),'observations_are_tests':False,'seconds':report['wall_seconds'],'raw':report.get('raw_video'),'failure':report.get('failure')},indent=2))
    return 0 if report['status']=='passed' else 1


if __name__=='__main__':
    raise SystemExit(main())
