#!/usr/bin/env python3
"""Earned Heaven campaign through native UI and whole-Chromium restart.

Production moveTo walking/combat/escort uses labelled accelerated 50 ms ticks. Native UI,
storage, actual WebGL pixels and source receipts are tested; this is not human
pacing, ordinary-RAF footage, hardware performance or public-release evidence.
No actor teleport, manual damage, inventory grant or planted campaign fact is
used. Capacity/refused-write probes use separate labelled worlds and profiles.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import argparse
import hashlib
import importlib.util
import json
import os
import subprocess
import threading
import time
import traceback
from urllib import request as urlrequest

ROOT = Path(__file__).resolve().parents[1]
from playwright.sync_api import sync_playwright
_support_spec = importlib.util.spec_from_file_location('firstlight_heaven_browser_support', ROOT / 'tools' / 'browser_support.py')
_support = importlib.util.module_from_spec(_support_spec)
_support_spec.loader.exec_module(_support)
launch_kwargs = _support.launch_kwargs

VARIANTS = {'blade': ('fresh-blade', 'accessible-assist'), 'bow': ('fresh-bow', 'broadened-activation'),
            'veteran': ('returning-strongest', 'accessible-assist')}
INITIALIZE = r"""(() => {
 window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;
 const key='eternities.realm10.characters.v1';
 try{window.__hvcStartup=localStorage.getItem(key);}catch(e){window.__hvcStartupError=String(e);}
 const original=Storage.prototype.setItem;
 Storage.prototype.setItem=function(k,v){const r=original.call(this,k,v);
  if(k===key)console.debug('__HVC_NATIVE_WRITE__'+String(v));return r;};
})()"""


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def digest(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest() if text is not None else None


def capture_navigation_failure(page, url, expected_sha, screenshot_path=None):
    """Observe a failed owned page without depending on Realm or retrying it."""
    result = {}
    try:
        result['url'] = page.url
    except Exception as error:
        result['url_error'] = repr(error)
    # Readiness comes from recorded lifecycle events. Do not submit another
    # renderer evaluation after navigation timed out.
    result['document_observation'] = 'Lifecycle events only; no failed-renderer evaluation.'
    if screenshot_path is not None:
        try:
            page.screenshot(path=str(screenshot_path), timeout=3000)
            result['screenshot'] = {'path': str(screenshot_path), 'sha256': sha(screenshot_path)}
        except Exception as error:
            result['screenshot_error'] = repr(error)
    try:
        # This is the harness's own loopback origin. One bounded read only;
        # a successful probe is evidence about HTTP, never a navigation pass.
        with urlrequest.urlopen(url, timeout=3) as response:
            body = response.read(8 * 1024 * 1024 + 1)
            actual_sha = hashlib.sha256(body).hexdigest()
            result['http_probe'] = {'status': response.status, 'bytes': len(body),
                                    'sha256': actual_sha,
                                    'exact_html': response.status == 200 and actual_sha == expected_sha}
    except Exception as error:
        result['http_probe_error'] = repr(error)
    return result


def ownership(world):
    a = world['adventure']
    return {'adventure': {k: v for k, v in a.items() if k not in (
        'elapsed', 'hp', 'stamina', 'revision', 'xp', 'coins', 'ore', 'receipts')},
        'world': {k: world[k] for k in ('journeys', 'realmTrails', 'earthExpedition',
            'hellCampaign', 'bridgeCommunity', 'localLife', 'homeHistory', 'notes', 'score',
            'scoreRevision', 'retreat', 'visitor', 'flowers', 'seed', 'version', 'visited')},
        'sandbox': {k: world['sandbox'][k] for k in ('placed', 'nextId', 'stats',
            'milestones', 'bridge', 'recentCommands')}}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *args):
        pass

    def do_GET(self):
        if self.path != '/':
            return super().do_GET()
        self.navigation_events = self.server.navigation_http_events
        self.navigation_events.append({'event': 'request', 'at': time.monotonic()})
        try:
            super().do_GET()
        except Exception as error:
            self.navigation_events.append({'event': 'handler_error', 'at': time.monotonic(), 'error': repr(error)})
            raise
        else:
            self.navigation_events.append({'event': 'body_write_complete', 'at': time.monotonic()})

    def send_response(self, code, message=None):
        if self.path == '/' and hasattr(self, 'navigation_events'):
            self.navigation_events.append({'event': 'response_status', 'at': time.monotonic(), 'status': code})
        return super().send_response(code, message)

    def end_headers(self):
        super().end_headers()
        if self.path == '/' and hasattr(self, 'navigation_events'):
            self.navigation_events.append({'event': 'headers_write_complete', 'at': time.monotonic()})


class CampaignBrowser:
    def __init__(self, args, report):
        self.args, self.report = args, report
        self.context = self.page = None
        self.variant = self.record = None
        self.last_native_write = None
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        self.server.navigation_http_events = []
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.url = f'http://127.0.0.1:{self.server.server_port}/'

    def check(self, name, ok, detail=None):
        row = {'name': (self.variant + ' · ' if self.variant else '') + name, 'passed': bool(ok)}
        if detail is not None:
            row['detail'] = detail
        self.report['checks'].append(row)
        print(('PASS ' if ok else 'FAIL ') + row['name'], flush=True)
        if not ok:
            raise AssertionError(row['name'])

    def ev(self, js, arg=None):
        return self.page.evaluate(js, arg)

    def state(self):
        return self.ev('Realm.state')

    def diag(self):
        return self.ev('Realm.diagnostics')

    def render(self):
        self.ev('Realm.test.render()')

    def console(self, message):
        text = message.text
        if text.startswith('__HVC_NATIVE_WRITE__'):
            raw = text[len('__HVC_NATIVE_WRITE__'):]
            self.last_native_write = raw
            self.record['native_write_receipts'].append({'sha256': digest(raw), 'bytes': len(raw.encode('utf-8'))})
        elif message.type == 'error':
            self.report['console_errors'].append(text)

    def start(self):
        options = launch_kwargs(self.args.renderer)
        self.context = self.pw.chromium.launch_persistent_context(
            str(self.profile), **options, viewport={'width': 1280, 'height': 800})
        self.context.add_init_script(INITIALIZE)
        self.page = self.context.new_page()
        for blank in self.context.pages:
            if blank != self.page:
                blank.close()
        self.context.route('**/*', lambda route: route.continue_() if route.request.url.startswith(self.url) else route.abort())
        self.page.on('pageerror', lambda e: self.report['browser_errors'].append(str(e)))
        self.page.on('console', self.console)
        events, observation_errors = [], []
        began = time.monotonic()
        self.server.navigation_http_events = []
        page = self.page
        def observe(event, subject=None):
            try:
                detail = {}
                if event in ('request', 'response', 'requestfinished'):
                    request = subject.request if event == 'response' else subject
                    if request.resource_type != 'document':
                        return
                    detail['url'] = subject.url
                    if event == 'response':
                        detail['status'] = subject.status
                elif event == 'commit':
                    if subject != page.main_frame:
                        return
                    detail['url'] = subject.url
                elif event == 'requestfailed':
                    detail = {'url': subject.url, 'failure': subject.failure}
                events.append({'event': event, 'seconds': time.monotonic() - began, **detail})
            except Exception as error:
                observation_errors.append({'event': event, 'error': repr(error)})
        page.on('request', lambda r: observe('request', r))
        page.on('response', lambda r: observe('response', r))
        page.on('requestfinished', lambda r: observe('requestfinished', r))
        page.on('framenavigated', lambda f: observe('commit', f))
        page.on('crash', lambda: observe('crash'))
        page.on('requestfailed', lambda r: observe('requestfailed', r))
        page.on('domcontentloaded', lambda: observe('domcontentloaded'))
        page.on('load', lambda: observe('load'))
        finished, failed_http_events = None, None
        try:
            response = self.page.goto(self.url, wait_until='load', timeout=30000)
            self.page.wait_for_function('()=>!!window.Realm', timeout=30000)
        except Exception:
            finished = time.monotonic()
            failed_http_events = list(self.server.navigation_http_events)
            self.record['navigation_failure'] = capture_navigation_failure(
                self.page, self.url, self.report['html_sha256'],
                self.args.output / f'{self.variant}-STARTUP_FAILURE.png')
            raise
        finally:
            http_events = [{**e, 'seconds': e['at'] - began} for e in (
                failed_http_events if failed_http_events is not None else self.server.navigation_http_events)]
            self.record['navigation'].append({'seconds': (finished or time.monotonic()) - began,
                'events': events, 'http_events': http_events, 'observation_errors': observation_errors})
        self.check('exact frozen HTML is served over isolated loopback',
                   response is not None and digest(response.body().decode('utf-8')) == self.report['html_sha256'])
        self.ev("Realm.test.quality('low');Realm.test.render()")
        self.check('actual WebGL2 client is available', self.diag()['mode'] == 'webgl2', self.diag()['renderer'])
        renderer = self.diag()['renderer'] or ''
        self.record['renderer'] = renderer
        if self.args.renderer == 'software':
            self.check('software renderer is explicitly observed', 'swiftshader' in renderer.lower(), renderer)
        else:
            self.check('hardware renderer is observed without a software renderer',
                       bool(renderer) and not any(v in renderer.lower() for v in ('swiftshader', 'llvmpipe', 'software')), renderer)
        self.page.wait_for_function('()=>!Realm.diagnostics.characters.mode.includes("blocked")&&(!Realm.diagnostics.characters.count||Realm.diagnostics.characters.mode==="legacy"||Realm.diagnostics.characters.writer)', timeout=30000)

    def close_workspace(self):
        if self.page.locator('#rpg-window').evaluate('(e)=>e.open'):
            self.page.locator('#rpg-close').click()
        if self.page.locator('#drawer').evaluate('(e)=>e.classList.contains("open")'):
            self.page.locator('#close-panel').click()

    def workspace(self, tab='heaven-campaign'):
        self.close_workspace()
        self.page.keyboard.press('j')
        if tab == 'heaven-campaign':
            self.page.locator('#rpg-content [data-rpg="heaven-campaign-open"]').first.click()
        else:
            self.page.locator(f'#rpg-tabs [data-rpg="open"][data-id="{tab}"]').click()
        self.render()

    def shot(self, label):
        self.render()
        path = self.args.output / f'{self.variant}-{label}.png'
        self.page.screenshot(path=str(path), timeout=30000)
        self.record['screenshots'].append({'path': str(path), 'sha256': sha(path),
                                           'camera': self.diag()['camera']['projection'], 'label': 'actual rendered software/hardware client'})

    def settle_walk(self, point, label):
        result = self.ev(r"""p=>{let frames=0;const sim=Realm.test.worldContext().sim;
         while(Realm.test.path.length&&frames++<18000){Realm.test.step(.05);if(sim.state.adventure.hp<=0)return{ok:false,error:'traveller died',frames};}
         Realm.test.render();const q=Realm.diagnostics.adventure.player;
         return{ok:frames<18000&&Math.hypot(q.x-p.x,q.z-p.z)<=2.8,frames,player:q,hp:sim.state.adventure.hp};}""", point)
        self.check('production walking reaches ' + label, result.get('ok'), result)
        self.record['walks'].append({'label': label, **result})

    def walk_exact(self, x, z, label):
        self.close_workspace()
        result = self.ev('p=>Realm.test.move(p.x,p.z)', {'x': x, 'z': z})
        self.check('production route is accepted for ' + label, result.get('ok'), result)
        self.settle_walk({'x': x, 'z': z}, label)
        p = self.diag()['adventure']['player']
        self.check('physical arrival has no actor teleport for ' + label,
                   ((p['x'] - x)**2 + (p['z'] - z)**2)**.5 < .3)

    def walk_ui(self, step_id):
        self.workspace()
        target = self.definition['giver'] if step_id in ('giver', 'claim') else next(s for s in self.definition['steps'] if s['id'] == ('invite-wayfarer' if step_id == 'escort-staging' else 'fit-arrival-assist' if step_id == 'instrument' else step_id))
        walk = self.page.locator(f'#rpg-content [data-rpg="heaven-campaign-walk"][data-id="{step_id}"]')
        if not walk.count():
            self.check('current physical location already reaches ' + target['name'],
                       self.ev('p=>RealmHeavenCampaign.at(Realm.test.worldContext().sim,p)', target))
            self.close_workspace()
            return
        walk.first.click()
        self.settle_walk(target, target['name'])

    def enter(self):
        if self.diag()['scene'] != 'valley':
            return
        if not self.ev('RealmWorldFoundations.atRoad(Realm.test.worldContext().sim)'):
            self.walk_exact(18, 6, 'Roads of Light')
        self.ev(r"""()=>{if(window.__hvcHooked)return;window.__hvcHooked=true;
         const p=RealmArt.WorldArt.prototype,original=p.commit;
         p.commit=function(...a){const r=original.apply(this,a);window.__hvcArt=this;const e=this.e;
          if(!e.__hvcRenderObserved){e.__hvcRenderObserved=true;const render=e.render;
           e.render=function(...a){this.__hvcLastRender=a.slice();return render.apply(this,a);};}return r;};}""")
        self.workspace('worlds')
        if self.page.locator('#rpg-content [data-rpg="world-list"]').count():
            self.page.locator('#rpg-content [data-rpg="world-list"]').click()
        self.page.locator('#rpg-content [data-rpg="world-select"][data-id="heaven"]').click()
        self.page.locator('#rpg-content [data-rpg="world-preview"]').click()
        self.check('travel has a visible saved-checkpoint confirmation', self.page.locator('[data-rpg="world-confirm"]').is_visible())
        self.page.locator('[data-rpg="world-confirm"]').click()
        self.render()
        self.check('native confirmed travel reaches Heaven without implicit campaign acceptance', self.diag()['scene'] == 'world-heaven')
        self.check('Heaven reentry cannot reconstruct a resolved apparatus', self.ev('()=>{const sim=Realm.test.worldContext().sim,d=RealmHeavenCampaign.definition;return d.enemies.every(t=>!sim.state.heavenCampaign.steps.includes(t.defeatStep)||!RealmAdventure.runtime(sim).enemies.some(e=>e.id===t.id));}'))

    def native_world(self, raw=None):
        return self.ev(r"""raw=>{const r=RealmCharacters.validate(JSON.parse(raw??localStorage.getItem(RealmCharacters.KEY)));
          return r.slots.find(s=>s.id===r.active).world;}""", raw)

    def restart(self, label):
        self.close_workspace()
        result = self.ev('Realm.test.save()')
        self.check(label + ' saves through the production native store', result.get('ok'), result)
        before = self.state()
        raw = self.ev('localStorage.getItem(RealmCharacters.KEY)')
        stored = self.native_world(raw)
        self.check(label + ' stores the full actual campaign and belongings',
                   stored['heavenCampaign'] == before['heavenCampaign'] and ownership(stored) == ownership(before)
                   and stored['sandbox']['inventory'] == before['sandbox']['inventory']
                   and all(stored['adventure'][k] == before['adventure'][k] for k in ('xp', 'coins', 'ore')))
        self.original_slot_unchanged(label)
        with self.page.expect_event('close'):
            self.page.close(run_before_unload=True)
        self.context.close()
        self.context = self.page = None
        expected_raw = self.last_native_write or raw
        self.check(label + ' observed last successful write remains a valid owned library',
                   json.loads(expected_raw)['active'] == self.active)
        self.start()
        startup = self.ev('window.__hvcStartup')
        self.check(label + ' cold startup bytes equal the actual last successful native write', startup == expected_raw,
                   {'expected_sha256': digest(expected_raw), 'startup_sha256': digest(startup)})
        after = self.state()
        loaded = self.native_world(startup)
        self.check(label + ' whole-Chromium restart loads production storage without imported replacement',
                   self.diag()['scene'] == 'valley' and self.diag()['characters']['active'] == self.active
                   and after['heavenCampaign'] == before['heavenCampaign']
                   and ownership(after) == ownership(before) and loaded == stored
                   and after['sandbox']['inventory'] == before['sandbox']['inventory']
                   and all(after['adventure'][k] == before['adventure'][k] for k in ('xp', 'coins', 'ore')))
        self.record['restarts'].append({'label': label, 'startup_sha256': digest(startup), 'campaign': after['heavenCampaign']})
        self.original_slot_unchanged(label + ' cold load')

    def click_action(self, step_id):
        self.walk_ui(step_id)
        self.page.keyboard.press('e')
        self.render()
        self.page.locator(f'#rpg-content [data-rpg="heaven-campaign-step"][data-id="{step_id}"]').click()
        self.render()
        self.check('visible physical action records ' + step_id, step_id in self.state()['heavenCampaign']['steps'])

    def inspect_map(self):
        before = self.state()
        self.workspace('atlas')
        text = self.page.locator('#rpg-content').inner_text()
        self.check('map visibly distinguishes supported accepted Garden actions',
                   'G labels' in text and 'upper terrace remains closed' in text
                   and self.page.locator('[data-rpg="heaven-campaign-walk"]').count() > 0)
        self.check('map inspection grants no saved work or payment',
                   self.state()['heavenCampaign'] == before['heavenCampaign']
                   and ownership(self.state()) == ownership(before)
                   and all(self.state()['adventure'][k] == before['adventure'][k] for k in ('xp', 'coins', 'ore')))
        self.shot('accepted-map')
        point = next(s for s in self.definition['steps'] if s['id'] == 'witness-account')
        self.page.locator('#rpg-content [data-rpg="heaven-campaign-walk"][data-id="witness-account"]').first.click()
        self.settle_walk(point, 'native atlas Walk link to the waiting witness')
        self.check('native atlas Walk reaches the physical witness without recording its account',
                   self.ev('p=>RealmHeavenCampaign.at(Realm.test.worldContext().sim,p)', point)
                   and self.state()['heavenCampaign'] == before['heavenCampaign'])

    def pixel_control(self, selection, view, label):
        self.close_workspace()
        self.page.locator(f'#rpg-hud [data-rpg="camera"][data-id="{view}"]').click()
        self.page.keyboard.press('r')
        self.render()
        self.check(label + ' uses actual ' + view + ' camera', self.diag()['camera']['projection'] == ('perspective' if view == 'adventure' else 'orthographic'))
        result = self.ev(r"""selection=>{const art=window.__hvcArt,e=art.e,sim=Realm.test.worldContext().sim;
         const saved=e.dynamic.map(b=>({b,items:b.items,data:b.data,count:b.count}));
         const selected=i=>selection==='beam'||selection==='pulse'?i.heavenCampaignTelegraph===true&&i.heavenCampaignPattern===selection:
           selection==='courier'?!!i.heavenCampaignEscort:selection==='glasswing'||selection==='relay'?i.heavenCampaignActor===RealmHeavenCampaign.definition.enemies[selection==='glasswing'?0:1].id&&!i.heavenCampaignTelegraph:
           selection==='ground-mirror'||selection==='arrival-assembly'?i.heavenCampaignFixture===selection:
           selection==='accessible-assist'?['lower-assist-lever','ordinary-assist-grip','request-plate','request-inscription'].includes(i.heavenCampaignPart):
           selection==='broadened-activation'?['broad-activation-plate','ordinary-press-rim','open-activation-inscription','open-activation-mark'].includes(i.heavenCampaignPart):false;
         const sig=()=>JSON.stringify({state:Realm.state,player:sim.state.player,camera:e.camera,view:Array.from(e.vp)}),before=sig();
         const read=()=>{const g=e.gl,a=new Uint8Array(e.mainF.w*e.mainF.h*4);g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);
           g.readPixels(0,0,e.mainF.w,e.mainF.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;};
         const args=e.__hvcLastRender.slice();e.render(...args);const present=read();let parts=0;
         try{for(const q of saved){q.b.items=q.items.filter(i=>!selected(i));parts+=q.items.length-q.b.items.length;e.updateBatch(q.b);}e.render(...args);const absent=read();
          for(const q of saved){q.b.items=q.items;q.b.data=q.data;e.updateBatch(q.b);q.b.count=q.count;}e.render(...args);const restored=read();let changed=0,delta=0;
          for(let i=0;i<present.length;i+=4){if(Math.max(...[0,1,2].map(k=>Math.abs(present[i+k]-absent[i+k])))>2)changed++;for(let k=0;k<3;k++)delta+=Math.abs(present[i+k]-restored[i+k]);}
          return{parts,changedPixels:changed,restorationRGBDelta:delta,pure:before===sig(),glError:e.gl.getError(),actualRenderArguments:args,restored:saved.every(q=>q.b.items===q.items&&q.b.data===q.data&&q.b.count===q.count)};
         }finally{for(const q of saved){q.b.items=q.items;q.b.data=q.data;e.updateBatch(q.b);q.b.count=q.count;}}}""", selection)
        self.check(label + ' actual framebuffer contribution and exact restoration in ' + view,
                   result['parts'] > 0 and result['changedPixels'] > 10 and result['restorationRGBDelta'] == 0
                   and result['pure'] and result['glError'] == 0 and result['restored'], result)
        self.record['pixel_controls'].append({'selection': selection, 'view': view, 'label': label, **result})
        self.shot(label + '-' + view)

    def framebuffer_positive_control(self):
        result = self.ev(r"""()=>{const e=__hvcArt.e,sim=Realm.test.worldContext().sim,saved=[...e.batches,...e.dynamic].map(b=>({b,items:b.items,data:b.data,count:b.count}));
         const read=()=>{const g=e.gl,a=new Uint8Array(e.mainF.w*e.mainF.h*4);g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);g.readPixels(0,0,e.mainF.w,e.mainF.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;};
         const before=JSON.stringify(Realm.state),args=e.__hvcLastRender.slice();e.render(...args);const baseline=read();
         try{for(const q of saved){q.b.items=[];e.updateBatch(q.b);}e.render(...args);const empty=read();let changed=0;
          for(let i=0;i<baseline.length;i+=4)if(Math.max(...[0,1,2].map(k=>Math.abs(baseline[i+k]-empty[i+k])))>2)changed++;
          for(const q of saved){q.b.items=q.items;q.b.data=q.data;e.updateBatch(q.b);q.b.count=q.count;}e.render(...args);const restore=read();let delta=0;for(let i=0;i<baseline.length;i++)delta+=Math.abs(baseline[i]-restore[i]);
          return{changedPixels:changed,restorationByteDelta:delta,pure:before===JSON.stringify(Realm.state),glError:e.gl.getError()};
         }finally{for(const q of saved){q.b.items=q.items;q.b.data=q.data;e.updateBatch(q.b);q.b.count=q.count;}}}""")
        self.check('empty-geometry positive control detects the actual fresh framebuffer',
                   result['changedPixels'] > 100 and result['restorationByteDelta'] == 0 and result['pure'] and result['glError'] == 0, result)

    def original_slot_unchanged(self, label):
        library = self.ev('RealmCharacters.validate(JSON.parse(localStorage.getItem(RealmCharacters.KEY)))')
        self.check(label + ' preserves the full other original native character slot value',
                   next(s for s in library['slots'] if s['id'] == self.original_slot['id']) == self.original_slot)

    def import_character(self, source):
        self.workspace('characters')
        legacy = self.ev('localStorage.getItem(RealmCore.KEY)')
        with self.page.expect_file_chooser() as chooser:
            self.page.locator('[data-rpg="chars-import"]').click()
        chooser.value.set_files(str(source))
        self.page.wait_for_selector('[data-rpg="chars-confirm-import"]')
        self.page.locator('[data-rpg="chars-confirm-import"]').click()
        self.page.wait_for_function('()=>Realm.diagnostics.characters.active==="character-2"&&Realm.diagnostics.characters.writer', timeout=30000)
        self.render()
        self.active = self.diag()['characters']['active']
        library = self.ev('RealmCharacters.validate(JSON.parse(localStorage.getItem(RealmCharacters.KEY)))')
        self.original_slot = next(s for s in library['slots'] if s['id'] != self.active)
        self.check('visible import adds a character and preserves original legacy save bytes',
                   self.diag()['characters']['count'] == 2 and self.ev('localStorage.getItem(RealmCore.KEY)') == legacy)

    def tick(self, frames):
        return self.ev(r"""n=>{const sim=Realm.test.worldContext().sim;for(let i=0;i<n;i++){
         Realm.test.step(.05);window.__hvcCombat?.sample();if(sim.state.adventure.hp<=0)return{ok:false,error:'traveller died',frames:i+1};
        }return{ok:true,frames:n,elapsed:sim.state.adventure.elapsed};}""", frames)

    def until_windup(self, enemy_id):
        result = self.ev(r"""id=>{const sim=Realm.test.worldContext().sim;
         for(let i=0;i<600;i++){const e=RealmAdventure.runtime(sim).enemies.find(e=>e.id===id);if(sim.state.adventure.hp<=0)return{ok:false,error:'traveller died'};
          if(!e)return{ok:false,error:'actual apparatus disappeared before its warning'};
          if(e.mode==='windup'&&e.timer>.65&&(e.strike?.kind!=='beam'||e.strike.length>0))return{ok:true,enemy:{...e,path:undefined},elapsed:sim.state.adventure.elapsed};
          Realm.test.step(.05);window.__hvcCombat?.sample();}return{ok:false,error:'no actual nonempty locked warning'};}""", enemy_id)
        self.check('actual AI enters the authored locked warning for ' + enemy_id, result.get('ok'), result)
        self.render()
        return result

    def install_combat_observer(self, enemy_id):
        self.ev(r"""id=>{const sim=Realm.test.worldContext().sim,A=RealmAdventure,e=A.runtime(sim).enemies.find(e=>e.id===id),command=sim.adventureCommand,damage=A.damageEnemy;
         const o=window.__hvcCombat={id,started:sim.state.adventure.elapsed,initialEnemy:{id:e.id,maxHP:e.maxHP,damage:e.damage,windup:e.windup,recovery:e.recovery},hits:[],weaponImpacts:[],commands:[],arrows:false,lastHP:e.hp,actor:e};
         sim.adventureCommand=function(request,type,payload){const target=A.runtime(this).enemies.find(e=>e.id===id),hp=target?.hp,mode=target?.mode,style=RealmArsenal.weapon(this.state.adventure).style,r=command.call(this,request,type,payload);
          if(type==='attack'&&payload?.target===id){o.commands.push({request,style,ok:r.ok,at:this.state.adventure.elapsed-o.started});if(style==='blade'&&target&&target.hp<hp)o.weaponImpacts.push({source:'production blade attack caller',mode,before:hp,hp:target.hp,at:this.state.adventure.elapsed-o.started});}return r;};
         A.damageEnemy=function(owner,target,n,source){const hp=target?.hp,mode=target?.mode,r=damage.apply(this,arguments);if(owner===sim&&target?.id===id&&source==='weapon'&&target.hp<hp)o.weaponImpacts.push({source:'production projectile contact',mode,before:hp,hp:target.hp,at:sim.state.adventure.elapsed-o.started});return r;};
         o.sample=()=>{o.arrows ||= RealmArsenal.runtime(sim).arrows.length>0;const hp=o.actor.hp;if(hp<o.lastHP)o.hits.push({before:o.lastHP,hp,observedModeAfterTick:o.actor.mode,at:sim.state.adventure.elapsed-o.started});o.lastHP=hp;};
         o.finish=()=>{sim.adventureCommand=command;A.damageEnemy=damage;o.sample();return{id:o.id,initialEnemy:o.initialEnemy,hits:o.hits,weaponImpacts:o.weaponImpacts,attackCommands:o.commands,arrows:o.arrows,seconds:sim.state.adventure.elapsed-o.started,hpAfter:sim.state.adventure.hp,
          observerLabel:'pass-through caller attribution; observers never invoke attack/damage, edit values or grant state; aggregate HP loss may include an owned Briar'};};}""", enemy_id)

    def actor_frame(self, enemy_id):
        result = self.ev(r"""id=>{const sim=Realm.test.worldContext().sim,d=RealmHeavenCampaign.definition,terms=d.enemies.find(e=>e.id===id),e=RealmAdventure.runtime(sim).enemies.find(e=>e.id===id),art=__hvcArt.e;
         let parts=0,maxBodyRadius=0,minForward=Infinity,maxForward=-Infinity,maxSide=0,maxPulseRadius=0;const strike=e.strike,errors=[];
         for(const b of art.dynamic)for(const p of b.items){if(p.heavenCampaignActor!==id)continue;parts++;const g=RealmEngine.geometry(b.kind);if(!p.m){errors.push('missing canonical matrix');continue;}
          for(let i=0;i<g.length;i+=6){const v=RealmEngine.M.transform(p.m,Array.from(g.slice(i,i+3)));if(!v.every(Number.isFinite)){errors.push('non-finite vertex');continue;}
           if(!p.heavenCampaignTelegraph)maxBodyRadius=Math.max(maxBodyRadius,Math.hypot(v[0]-e.x,v[2]-e.z));
           else if(strike.kind==='beam'){const dx=v[0]-strike.x,dz=v[2]-strike.z,f=dx*Math.sin(strike.yaw)+dz*Math.cos(strike.yaw),side=dx*Math.cos(strike.yaw)-dz*Math.sin(strike.yaw);minForward=Math.min(minForward,f);maxForward=Math.max(maxForward,f);maxSide=Math.max(maxSide,Math.abs(side));}
           else maxPulseRadius=Math.max(maxPulseRadius,Math.hypot(v[0]-strike.x,v[2]-strike.z));
          }
         }return{parts,maxBodyRadius,declaredRadius:terms.radius,strike,minForward:Number.isFinite(minForward)?minForward:null,maxForward:Number.isFinite(maxForward)?maxForward:null,maxSide,maxPulseRadius,errors};}""", enemy_id)
        s = result['strike']
        warning_ok = (result['minForward'] is not None and result['minForward'] >= -1e-4 and result['maxForward'] <= s['length'] + 1e-4
                      and result['maxSide'] <= s['halfWidth'] + 1e-4) if s['kind'] == 'beam' else result['maxPulseRadius'] <= s['radius'] + 1e-4
        self.check('integrated actual apparatus and warning matrices use the real actor/locked frame',
                   result['parts'] > 0 and not result['errors'] and result['maxBodyRadius'] <= result['declaredRadius'] + 1e-4 and warning_ok, result)
        self.record['actor_frames'].append(result)

    def fight(self, index):
        enemy = self.definition['enemies'][index]
        self.close_workspace()
        self.install_combat_observer(enemy['id'])
        before = self.state()
        style = self.diag()['adventure']['weapon']['style']
        radius = 4 if style == 'bow' else 1.1
        guards = frames = 0
        try:
            self.walk_exact(enemy['x'], enemy['z'] + radius, 'actual ' + enemy['name'] + ' weapon range')
            for _ in range(8):
                self.page.keyboard.press('Tab')
                if self.diag()['adventure']['tactics']['target'] == enemy['id']:
                    break
            self.check('native Tab selects ' + enemy['id'], self.diag()['adventure']['tactics']['target'] == enemy['id'])
            first = self.until_windup(enemy['id'])
            self.check('fixed authored health/damage and all-live damage policy are retained',
                       first['enemy']['maxHP'] == enemy['hp'] and first['enemy']['damage'] == enemy['damage']
                       and enemy['damageWindow'] == 'all-live-phases', {'actual': first['enemy'], 'authored': enemy})
            expected_windup = enemy['attack']['windup'] + (enemy['attack'].get('support', {}).get('windupBonus', 0) if 'ground-mirror' in self.state()['heavenCampaign']['steps'] else 0)
            self.check('supplied mirror changes only its authored beam warning', abs(first['enemy']['windup'] - expected_windup) < 1e-8)
            self.check('native selected target exposes an actual warning cue', self.page.locator('#target-cue').get_attribute('data-phase') == 'windup')
            self.page.locator('#skill-guard').click()
            guards += 1
            self.render()
            self.check('native Brace provides actual mitigation', self.diag()['adventure']['tactics']['guardUntil'] > first['elapsed'])
            pattern, body = enemy['attack']['kind'], 'glasswing' if index == 0 else 'relay'
            self.actor_frame(enemy['id'])
            for view in ('adventure', 'follow'):
                self.pixel_control(pattern, view, pattern + '-locked-warning')
                self.pixel_control(body, view, body + '-actual-apparatus')
            if index == 0:
                self.framebuffer_positive_control()
            # F is the native owned-weapon control. It is not a test command.
            self.page.keyboard.press('f')
            actual = self.tick(7)
            self.check('native owned-weapon impact advance keeps the traveller alive', actual['ok'], actual)
            during = self.ev('()=>__hvcCombat.weaponImpacts.slice()')
            self.check('real owned weapon accepts contact during the actual warning, without a Hell armor window',
                       any(h['mode'] == 'windup' for h in during), during)
            if enemy['defeatStep'] not in self.state()['heavenCampaign']['steps']:
                self.page.locator('#skill-auto').click()
                self.render()
                self.check('native Autoattack enables production combat intent', self.diag()['adventure']['tactics']['auto'])
            while enemy['defeatStep'] not in self.state()['heavenCampaign']['steps'] and frames < 4000:
                d = self.diag()['adventure']
                t = d['tactics']
                warning = next((e for e in d['enemies'] if e['id'] == enemy['id']), None)
                now = self.state()['adventure']['elapsed']
                if warning and warning['mode'] == 'windup' and self.state()['adventure']['stamina'] >= 20 and now >= t['cooldowns']['guard']:
                    self.page.locator('#skill-guard').click()
                    guards += 1
                result = self.tick(6)
                frames += 6
                if not result['ok']:
                    self.check('bounded production combat stays alive for ' + enemy['id'], False, result)
            self.check('actual combat records the separate authored apparatus defeat', enemy['defeatStep'] in self.state()['heavenCampaign']['steps'] and frames < 4000)
        finally:
            result = self.ev('()=>{const r=window.__hvcCombat?.finish();delete window.__hvcCombat;return r;}')
            if self.diag()['adventure']['tactics']['auto']:
                self.page.locator('#skill-auto').click()
        result.update({'guards': guards, 'frames_after_initial_contact': frames})
        self.check('attributable production weapon contacts contributed to the real defeat', bool(result['weaponImpacts']), result)
        if style == 'bow':
            self.check('bow uses real traveling projectiles and attributed projectile contacts', result['arrows'] and any(h['source'] == 'production projectile contact' for h in result['weaponImpacts']))
        after = self.state()
        self.check('apparatus defeat grants no independent currency, XP, loot or ordinary materials',
                   all(after['adventure'][k] == before['adventure'][k] for k in ('xp', 'coins', 'ore', 'drops', 'defeated')) and after['sandbox']['inventory'] == before['sandbox']['inventory'])
        self.record['combat'].append(result)
        self.render()
        self.shot(enemy['defeatStep'])

    def escort(self):
        return self.ev('()=>{const sim=Realm.test.worldContext().sim;return JSON.parse(JSON.stringify({actor:RealmHeavenCampaign.runtime(sim).escort,status:RealmHeavenCampaign.escortStatus(sim)}));}')

    def invite(self, restart=False):
        self.walk_ui('escort-staging' if restart else 'invite-wayfarer')
        self.workspace()
        before = self.state()
        self.page.locator('[data-rpg="heaven-campaign-invite"]').first.click()
        self.render()
        after, actual = self.state(), self.escort()
        self.check('native deliberate invitation starts the same real courier without a fee or material grant',
                   'invite-wayfarer' in after['heavenCampaign']['steps'] and actual['actor']['phase'] == 'following'
                   and actual['actor']['routeIndex'] == 1 and actual['actor']['id'] == self.definition['escort']['id']
                   and all(after['adventure'][k] == before['adventure'][k] for k in ('xp', 'coins', 'ore'))
                   and after['sandbox']['inventory'] == before['sandbox']['inventory'], actual)
        if restart:
            self.check('native reinvitation retains exactly the existing saved work', after['heavenCampaign'] == before['heavenCampaign'])
        self.close_workspace()

    def lag_and_partial_escort(self):
        self.invite()
        self.walk_exact(-35, -55, 'deliberately walk ahead on the supported service loop')
        lag = self.escort()
        self.check('the actual courier waits when the traveller exceeds the authored following range',
                   lag['actor']['phase'] == 'lagging', lag)
        before = self.state()
        self.tick(40)
        held = self.escort()
        self.check('elapsed waiting cannot move a lagged courier or manufacture actual arrival',
                   (held['actor']['x'], held['actor']['z'], held['actor']['routeIndex']) == (lag['actor']['x'], lag['actor']['z'], lag['actor']['routeIndex'])
                   and self.state()['heavenCampaign'] == before['heavenCampaign'])
        self.walk_exact(held['actor']['x'], held['actor']['z'], 'return to the courier’s actual waiting position')
        point = self.definition['escort']['route'][1]
        self.walk_exact(point['x'], point['z'], 'accompany the first real service segment')
        result = self.ev(r"""()=>{const sim=Realm.test.worldContext().sim;for(let i=0;i<400;i++){
         const e=RealmHeavenCampaign.runtime(sim).escort;if(e.routeIndex>=2)return{ok:true,frames:i,actor:{...e}};Realm.test.step(.05);
        }return{ok:false,error:'courier did not complete the first real segment'};}""")
        self.check('unfinished escort contains an actual completed first route segment', result.get('ok') and result['actor']['routeIndex'] == 2, result)
        self.record['partial_escort'] = result
        self.escort_probe_world = self.state()
        self.restart('unfinished-escort')
        self.enter()
        reset = self.escort()
        self.check('whole-browser restart retains invitation and resets only the unfinished transient walk',
                   'invite-wayfarer' in self.state()['heavenCampaign']['steps'] and 'wayfarer-arrived' not in self.state()['heavenCampaign']['steps']
                   and reset['status']['phase'] == 'reset' and reset['actor']['phase'] == 'idle'
                   and reset['actor']['routeIndex'] == 1 and reset['actor']['x'] == self.definition['escort']['x']
                   and reset['actor']['z'] == self.definition['escort']['z'], reset)
        self.walk_ui('escort-staging')
        for view in ('adventure', 'follow'):
            self.pixel_control('courier', view, 'courier-reset-after-native-restart')
        self.invite(restart=True)

    def finish_escort(self, expect_save=True):
        self.close_workspace()
        result = self.ev(r"""expectSave=>{const sim=Realm.test.worldContext().sim,H=RealmHeavenCampaign,d=H.definition,route=d.escort.route;
         const initial=H.runtime(sim).escort,start={x:initial.x,z:initial.z,routeIndex:initial.routeIndex,phase:initial.phase},milestones=[],targets=[];
         let prior=initial.routeIndex,frames=0,goal=null,clear=true,last={x:initial.x,z:initial.z};
         const move=(x,z,kind)=>{const r=Realm.test.move(x,z);targets.push({x,z,kind,ok:r.ok,at:sim.state.adventure.elapsed});goal=kind;return r.ok;};
         while(frames++<5000){const e=H.runtime(sim).escort,player=sim.state.player,dist=Math.hypot(player.x-e.x,player.z-e.z);
          if(sim.state.adventure.hp<=0)return{ok:false,error:'traveller died',frames};
          if(expectSave&&sim.state.heavenCampaign.steps.includes(d.escort.arrivalStep))return{ok:e.phase==='arrived',frames,start,milestones,targets,clear,actor:{...e}};
          if(!expectSave&&e.phase==='awaiting-save')return{ok:!sim.state.heavenCampaign.steps.includes(d.escort.arrivalStep),frames,start,milestones,targets,clear,actor:{...e}};
          const next=route[Math.min(e.routeIndex,route.length-1)];
          if((e.phase==='lagging'||dist>6.8)&&(goal!=='catch-up'||!Realm.test.path.length)){if(!move(e.x,e.z,'catch-up'))return{ok:false,error:'production catch-up route refused',frames};}
          else if(!Realm.test.path.length){if(!move(next.x,next.z,'supported waypoint '+Math.min(e.routeIndex,route.length-1)))return{ok:false,error:'production route waypoint refused',frames};}
          Realm.test.step(.05);const current=H.runtime(sim).escort;clear &&=RealmWorldFoundations.segment(sim.room,last,current,d.escort.radius);
          last={x:current.x,z:current.z};if(current.routeIndex>prior){milestones.push({routeIndex:current.routeIndex,x:current.x,z:current.z,phase:current.phase,at:sim.state.adventure.elapsed});prior=current.routeIndex;}
         }return{ok:false,error:'bounded complete real escort route did not finish',frames,start,milestones,targets,clear,actor:{...H.runtime(sim).escort}};}""", expect_save)
        self.check('actual owned courier completes every supported service segment' + ('' if expect_save else ' before a labelled arrival-save refusal'), result.get('ok'), result)
        route = self.definition['escort']['route']
        self.check('observed actual escort starts at staging and visits every authored waypoint without actor edits',
                   result['start']['routeIndex'] == 1 and result['start']['x'] == route[0]['x'] and result['start']['z'] == route[0]['z']
                   and result['clear'] and len(result['milestones']) == len(route) - 1
                   and all(m['routeIndex'] == i + 2 and ((m['x'] - route[i + 1]['x'])**2 + (m['z'] - route[i + 1]['z'])**2)**.5 < .001 for i, m in enumerate(result['milestones'])))
        self.record['escorts'].append({'method': 'automated production Realm.test.move/sim.moveTo targets; owned H.tick actor movement; 50 ms accelerated ticks', **result})
        self.render()
        return result

    def activation(self, choice):
        self.walk_ui('instrument')
        self.workspace()
        before = self.state()
        self.page.locator('[data-rpg="heaven-campaign-activate"]').click()
        self.render()
        started = self.ev('()=>JSON.parse(JSON.stringify(RealmHeavenCampaign.runtime(Realm.test.worldContext().sim).activation))')
        self.check('native explicit activation closes the workspace and grants no deed or payment',
                   started['choice'] == choice and started['active'] and not self.page.locator('#rpg-window').evaluate('(e)=>e.open')
                   and self.state() == before, started)
        self.tick(12)
        self.render()
        moving = self.ev('()=>__hvcArt.e.dynamic.flatMap(b=>b.items).some(i=>i.heavenCampaignFixture==="arrival-assembly"&&i.heavenCampaignActivation)')
        self.check('deliberate activation visibly projects its actual bounded transient stroke', moving)
        self.tick(16)
        self.render()
        quiet = self.ev('()=>{const sim=Realm.test.worldContext().sim;return !RealmHeavenCampaign.runtime(sim).activation.active&&!__hvcArt.e.dynamic.flatMap(b=>b.items).some(i=>i.heavenCampaignActivation);}')
        after = self.state()
        self.check('instrument returns to quiet after 1.2 seconds with no persistent progression or payout',
                   quiet and after['heavenCampaign'] == before['heavenCampaign'] and after['adventure']['revision'] == before['adventure']['revision']
                   and [e for e in after['journal'] if e['kind'] == 'heaven-campaign'] == [e for e in before['journal'] if e['kind'] == 'heaven-campaign']
                   and all(after['adventure'][k] == before['adventure'][k] for k in ('xp', 'coins', 'ore'))
                   and after['sandbox']['inventory'] == before['sandbox']['inventory'] and ownership(after) == ownership(before))

    def claim_fee(self):
        self.workspace()
        before = self.state()
        self.page.locator('[data-rpg="heaven-campaign-claim"]').click()
        self.render()
        paid, fee = self.state(), self.definition['reward']
        expected = dict(before['sandbox']['inventory'])
        for k, n in fee['materials'].items():
            expected[k] += n
        self.check('native explicit claim credits the complete fixed fee once within the existing XP cap',
                   paid['heavenCampaign']['claimed'] and paid['adventure']['xp'] - before['adventure']['xp'] == min(fee['xp'], 9999 - before['adventure']['xp'])
                   and all(paid['adventure'][k] - before['adventure'][k] == fee[k] for k in ('coins', 'ore')) and paid['sandbox']['inventory'] == expected)
        return before, paid

    def begin_record(self, label, choice, profile):
        self.variant = label
        self.record = {'choice': choice, 'navigation': [], 'native_write_receipts': [], 'restarts': [], 'screenshots': [],
                       'walks': [], 'pixel_controls': [], 'actor_frames': [], 'combat': [], 'escorts': []}
        self.profile = profile
        self.profile.mkdir()
        self.last_native_write = None
        self.original_slot = None

    def run_variant(self, flag):
        label, choice = VARIANTS[flag]
        self.begin_record(label, choice, self.args.output / (label + '-isolated-profile'))
        self.report['variants'][label] = self.record
        source = self.args.sources / label / '00_EARNED_SEED.json'
        seed = json.loads(source.read_text(encoding='utf-8'))
        copy = self.args.output / (label + '-EARNED_SEED.json')
        copy.write_bytes(source.read_bytes())
        self.record['earned_seed'] = {'path': str(source), 'sha256': sha(source), 'exact_copy': str(copy), 'copy_sha256': sha(copy),
                                     'method': 'legitimate Broken Choir command-earned journey seed; imported once through native Characters UI'}
        self.start()
        self.definition = self.ev('RealmHeavenCampaign.definition')
        self.check('earned seed claims the actual Broken Choir and contains no accepted Heaven continuation',
                   seed['realmTrails']['records'][self.definition['prerequisite']]['claimed'] and not seed['heavenCampaign']['accepted'])
        self.import_character(source)
        initial = self.state()
        self.check('native import preserves the complete owned kit, sockets, choices and older ledgers', ownership(initial) == ownership(seed)
                   and initial['sandbox']['inventory'] == seed['sandbox']['inventory'] and all(initial['adventure'][k] == seed['adventure'][k] for k in ('xp', 'coins', 'ore')))
        self.enter()
        before = self.state()
        self.workspace()
        terms = self.page.locator('#rpg-content').inner_text()
        self.check('visible terms disclose both distinct fixed threats, real escort, exact fee and public access',
                   all(t in terms for t in ('110 health', '12 damage', '75 health', '9 damage', '40 XP', '16 sunmarks', '3 ore',
                       '4 timber', '3 meadow fibre', 'Accessible assist', 'Broadened activation', 'upper terrace remains closed')))
        self.check('reading terms does not accept work or spend anything', self.state() == before)
        self.walk_ui('giver')
        self.workspace()
        self.page.locator('[data-rpg="heaven-campaign-accept"]').click()
        self.render()
        self.check('native explicit acceptance preserves all older owned systems and balances', self.state()['heavenCampaign']['accepted']
                   and ownership(self.state()) == ownership(initial) and self.state()['sandbox']['inventory'] == initial['sandbox']['inventory'])
        self.restart('accepted')
        self.enter()
        self.inspect_map()
        self.walk_ui('witness-account')
        idle = self.escort()
        self.check('accepted opening witness is the actual single waiting courier', idle['actor']['id'] == self.definition['escort']['id']
                   and idle['actor']['phase'] == 'idle' and idle['actor']['x'] == -29 and idle['actor']['z'] == -69, idle)
        for view in ('adventure', 'follow'):
            self.pixel_control('courier', view, 'actual-waiting-courier')
        for step in ('witness-account', 'compare-arrival-marks', 'inspect-false-relay'):
            self.click_action(step)
        self.walk_ui('ground-mirror')
        for view in ('adventure', 'follow'):
            self.pixel_control('ground-mirror', view, 'supplied-loose-mirror')
        self.click_action('ground-mirror')
        for view in ('adventure', 'follow'):
            self.pixel_control('ground-mirror', view, 'deliberately-grounded-mirror')
        self.click_action('begin-watch')
        self.fight(0)
        self.restart('beam-disabled-partial-enemies')
        self.enter()
        self.fight(1)
        self.click_action('secure-service-route')
        self.lag_and_partial_escort()
        self.finish_escort()
        self.check('actual completed courier arrival records one fact without reward', 'wayfarer-arrived' in self.state()['heavenCampaign']['steps']
                   and all(self.state()['adventure'][k] == initial['adventure'][k] for k in ('xp', 'coins', 'ore')))
        for view in ('adventure', 'follow'):
            self.pixel_control('courier', view, 'actual-arrived-courier')
        self.restart('actual-arrival')
        self.enter()
        self.click_action('fit-arrival-assist')
        self.workspace()
        before = self.state()
        self.page.locator(f'[data-rpg="heaven-campaign-review"][data-id="{choice}"]').click()
        self.render()
        self.check('native first-stage preview shows terms without saving a choice', self.page.locator('.heaven-campaign-confirm').is_visible() and self.state() == before)
        self.page.locator('[data-rpg="heaven-campaign-cancel"]').click()
        self.render()
        self.check('native cancel preserves the undecided campaign', self.state() == before and not self.page.locator('.heaven-campaign-confirm').count())
        self.page.locator(f'[data-rpg="heaven-campaign-review"][data-id="{choice}"]').click()
        self.page.locator(f'[data-rpg="heaven-campaign-confirm"][data-id="{choice}"]').click()
        self.render()
        self.check('native explicit second-stage confirmation records the local arrangement', self.state()['heavenCampaign']['choice'] == choice)
        for view in ('adventure', 'follow'):
            self.pixel_control('arrival-assembly', view, choice + '-whole-fitting')
            self.pixel_control(choice, view, choice + '-distinct-fitting-only')
        self.activation(choice)
        self.restart('chosen')
        self.enter()
        self.click_action('verify-welcome')
        self.workspace()
        recognition = self.page.locator('.heaven-campaign-local-recognition').inner_text()
        authored = next(c for c in self.definition['choices'] if c['id'] == choice)
        self.check('verified arrangement quotes all four actual authored recognition callers',
                   all(line['name'] + ':' in recognition and line['text'] in recognition for line in authored['recognition']), recognition)
        self.check('verified campaign remains complete and unpaid', self.ev('RealmHeavenCampaign.ready(Realm.state)') and not self.state()['heavenCampaign']['claimed'])
        self.restart('verified-unpaid')
        self.enter()
        self.walk_ui('claim')
        self.ready_probe_world = self.state()
        _, paid = self.claim_fee()
        expected = dict(initial['sandbox']['inventory'])
        for k, n in self.definition['reward']['materials'].items():
            expected[k] += n
        self.check('the full expedition spends no ordinary materials, owned gear, sockets or older earned ledger', ownership(paid) == ownership(initial)
                   and paid['sandbox']['inventory'] == expected and paid['adventure']['xp'] - initial['adventure']['xp'] == min(40, 9999 - initial['adventure']['xp'])
                   and paid['adventure']['coins'] - initial['adventure']['coins'] == 16 and paid['adventure']['ore'] - initial['adventure']['ore'] == 3)
        self.workspace()
        self.check('claimed UI offers no second payout button', not self.page.locator('[data-rpg="heaven-campaign-claim"]').count())
        self.restart('claimed')
        self.enter()
        self.activation(choice)
        self.original_slot_unchanged('claimed and deliberately activated')
        self.check('native runtime diagnostics contain no actual error', not self.diag()['errors'], self.diag()['errors'])
        self.record['initial_balances'] = {k: initial['adventure'][k] for k in ('xp', 'coins', 'ore')}
        self.record['final_world'] = self.state()
        self.context.close()
        self.context = self.page = None
        self.synthetic_probes(label, choice)

    def synthetic_probes(self, earned_label, choice):
        # These are derivative snapshots in entirely separate browser profiles.
        # The main earned profile is closed and is never reopened for a probe.
        for kind, source_world in (('capacity', self.ready_probe_world), ('claim-write-refusal', self.ready_probe_world),
                                   ('arrival-write-refusal', self.escort_probe_world)):
            label = earned_label + '-SYNTHETIC-' + kind
            world = json.loads(json.dumps(source_world))
            if kind == 'capacity':
                world['adventure']['coins'] = 9999
            source = self.args.output / (label + '-IMPORTED_DERIVATIVE.json')
            source.write_text(json.dumps(world, indent=2), encoding='utf-8')
            self.begin_record(label, choice, self.args.output / (label + '-isolated-profile'))
            self.report['synthetic_profiles'][label] = self.record
            self.record['synthetic_provenance'] = {'source': str(source), 'sha256': sha(source),
                'parent_earned_variant': earned_label, 'parent_stage': 'unfinished physical escort' if kind == 'arrival-write-refusal' else 'verified unpaid campaign',
                'edits': {'adventure.coins': 9999} if kind == 'capacity' else {},
                'label': 'isolated derivative world; never adopted in the earned journey; no fabricated campaign step or physical courier checkpoint'}
            self.start()
            self.import_character(source)
            self.enter()
            if kind == 'arrival-write-refusal':
                self.invite(restart=True)
                self.ev(r"""()=>{window.__hvcRefusalOriginal=Storage.prototype.setItem;window.__hvcRefusalCalls=0;
                 Storage.prototype.setItem=function(k,v){if(k===RealmCharacters.KEY){__hvcRefusalCalls++;throw Error('Labelled separate-profile arrival save refusal');}return __hvcRefusalOriginal.call(this,k,v);};}""")
                try:
                    self.finish_escort(expect_save=False)
                    before, actual = self.state(), self.escort()
                    attempts = self.ev('window.__hvcRefusalCalls')
                    self.tick(10)
                    self.check('separate refused arrival remains unrecorded and writer retry is bounded',
                               actual['actor']['phase'] == 'awaiting-save' and self.escort()['actor']['phase'] == 'awaiting-save'
                               and self.ev('window.__hvcRefusalCalls') == attempts and 'wayfarer-arrived' not in self.state()['heavenCampaign']['steps'])
                    self.workspace()
                    text = self.page.locator('#rpg-content').inner_text()
                    self.check('actual refused-arrival UI explains the wait without wrong reinvitation or manual arrival/payout',
                               'arrival save was refused' in text and 'automatic retries' in text
                               and not self.page.locator('[data-rpg="heaven-campaign-invite"]').count()
                               and not self.page.locator('[data-rpg="heaven-campaign-claim"]').count())
                    self.shot('SYNTHETIC-arrival-save-refused-visible-terms')
                    for view in ('adventure', 'follow'):
                        self.pixel_control('courier', view, 'SYNTHETIC-awaiting-save-real-courier')
                    self.check('refused arrival grants no fee, materials or new recorded action', self.state()['heavenCampaign'] == before['heavenCampaign']
                               and all(self.state()['adventure'][k] == before['adventure'][k] for k in ('xp', 'coins', 'ore'))
                               and self.state()['sandbox']['inventory'] == before['sandbox']['inventory'])
                finally:
                    self.ev('Storage.prototype.setItem=window.__hvcRefusalOriginal;delete window.__hvcRefusalOriginal')
                self.close_workspace()
                self.tick(25)
                self.check('restoring the isolated writer permits the same actual complete courier arrival callback',
                           'wayfarer-arrived' in self.state()['heavenCampaign']['steps'] and self.escort()['actor']['phase'] == 'arrived')
            else:
                self.walk_ui('claim')
                self.workspace()
                before = self.state()
                raw = self.ev('localStorage.getItem(RealmCharacters.KEY)')
                if kind == 'claim-write-refusal':
                    self.ev(r"""()=>{window.__hvcRefusalOriginal=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===RealmCharacters.KEY)throw Error('Labelled separate-profile claim write refusal');return __hvcRefusalOriginal.call(this,k,v);};}""")
                try:
                    self.page.locator('[data-rpg="heaven-campaign-claim"]').click()
                    self.render()
                    self.check('separate synthetic ' + kind + ' preserves actual unpaid state and native bytes',
                               self.state() == before and self.ev('localStorage.getItem(RealmCharacters.KEY)') == raw)
                    text = self.page.locator('#rpg-content').inner_text()
                    self.check('refused isolated claim remains visibly complete and unpaid', 'Complete · unpaid' in text and not self.state()['heavenCampaign']['claimed'])
                    self.shot('SYNTHETIC-' + kind + '-unpaid')
                finally:
                    if kind == 'claim-write-refusal':
                        self.ev('Storage.prototype.setItem=window.__hvcRefusalOriginal;delete window.__hvcRefusalOriginal')
                if kind == 'claim-write-refusal':
                    self.claim_fee()
                    self.check('restored isolated writer pays the same whole fee exactly once', self.state()['heavenCampaign']['claimed'])
            self.original_slot_unchanged('isolated synthetic probe')
            self.record['final_world'] = self.state()
            self.context.close()
            self.context = self.page = None

    def stop(self):
        if self.context is not None:
            self.context.close()
            self.context = self.page = None
        self.server.shutdown()
        self.server.server_close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path, help='A NEW D: evidence directory; existing evidence is refused.')
    parser.add_argument('--sources', required=True, type=Path, help='D: folder with fresh-blade, fresh-bow and returning-strongest earned seed/provenance/report folders.')
    parser.add_argument('--renderer', choices=('software', 'hardware'), default='software')
    parser.add_argument('--variant', choices=('blade', 'bow', 'veteran', 'all'), default='all')
    args = parser.parse_args()
    args.output, args.sources = args.output.resolve(), args.sources.resolve()
    if os.name == 'nt' and (args.output.drive.upper() != 'D:' or args.sources.drive.upper() != 'D:'):
        parser.error('Native profiles, earned seeds and browser evidence must remain on D:.')
    flags = tuple(VARIANTS) if args.variant == 'all' else (args.variant,)
    seed_files = []
    provenance = {}
    for flag in flags:
        folder = args.sources / VARIANTS[flag][0]
        files = [folder / name for name in ('00_EARNED_SEED.json', 'SEED_PROVENANCE.json', 'HEAVEN_CAMPAIGN_JOURNEY_REPORT.json')]
        if any(not p.is_file() for p in files):
            parser.error('Missing earned seed/provenance/journey report in ' + str(folder))
        seed_files.extend(files)
        proof = json.loads(files[1].read_text(encoding='utf-8'))
        journey = json.loads(files[2].read_text(encoding='utf-8'))
        if proof.get('seedSha256') != sha(files[0]) or journey.get('status') != 'passed' or proof.get('variant') != VARIANTS[flag][0]:
            parser.error('Seed hash, variant or full journey receipt is not valid: ' + str(folder))
        if any(journey.get(k) != 0 for k in ('positionEdits', 'inventoryGrants', 'manualDamage', 'forcedModes', 'plantedDefeats')):
            parser.error('Earned seed provenance does not retain the required caller boundaries: ' + str(folder))
        provenance[VARIANTS[flag][0]] = {'proof': proof, 'journey_status': journey['status'], 'journey_method': journey.get('method'), 'journey_source_hashes': journey['sourceHashes']}
    try:
        args.output.mkdir(parents=True, exist_ok=False)
    except FileExistsError:
        parser.error('--output must name a new directory; prior evidence is preserved.')
    inputs = [ROOT / 'build.py', ROOT / 'index.html', ROOT / 'FIRSTLIGHT_VALLEY.html', Path(__file__), ROOT / 'tools' / 'browser_support.py',
              ROOT / 'tests' / 'heaven_campaign_journey.cjs', *sorted(p for p in (ROOT / 'src').iterdir() if p.is_file())]
    source_hashes = {str(p.relative_to(ROOT)): sha(p) for p in inputs}
    seed_hashes = {str(p): sha(p) for p in seed_files}
    report = {'method': __doc__, 'status': 'running', 'renderer_requested': args.renderer,
              'head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
              'source_state': subprocess.check_output(['git', 'status', '--porcelain'], cwd=ROOT, text=True).splitlines(),
              'html_sha256': sha(ROOT / 'index.html'), 'source_hashes': source_hashes, 'seed_input_hashes': seed_hashes,
              'seed_provenance': provenance, 'checks': [], 'variants': {}, 'synthetic_profiles': {}, 'browser_errors': [], 'console_errors': [], 'errors': [],
              'requested_variants': [VARIANTS[f][0] for f in flags], 'accelerated_ticks': True, 'tick_seconds': .05,
              'movement_caller': 'production Realm.test.move/sim.moveTo adapter, plus native journal/map Walk links',
              'normal_time_footage': False, 'native_persistence': True, 'human_pacing': False, 'performance_claim': False,
              'earned_actor_position_edits': 0, 'earned_inventory_grants': 0, 'earned_manual_damage': 0, 'earned_planted_facts': 0,
              'synthetic_scope': 'separate derivative worlds and persistent browser profiles: one capacity edit, one refused claim writer, one refused real arrival writer; never adopted by earned runs'}
    harness = None
    try:
        harness = CampaignBrowser(args, report)
        for label, proof in provenance.items():
            hashes = proof['proof']['sourceHashes']
            harness.check(label + ' seed receipt matches every recorded current source input', all((ROOT / p).is_file() and sha(ROOT / p) == h for p, h in hashes.items()))
            harness.check(label + ' whole earned journey uses the exact same frozen source epoch', hashes == proof['journey_source_hashes'])
        html = (ROOT / 'index.html').read_text(encoding='utf-8')
        modules = ['heaven-campaign-data.js', 'heaven-campaign.js', 'heaven-campaign-ui.js', 'heaven-campaign-art.js', 'adventure.js', 'adventure-art.js', 'arsenal.js', 'combat.js', 'core.js', 'rpg-ui.js', 'app.js']
        harness.check('assembled offline HTML embeds exact current campaign and production callers', all((ROOT / 'src' / p).read_text(encoding='utf-8').strip() in html for p in modules))
        harness.check('both checked-in HTML copies are byte-identical', sha(ROOT / 'FIRSTLIGHT_VALLEY.html') == report['html_sha256'])
        with sync_playwright() as pw:
            harness.pw = pw
            try:
                for flag in flags:
                    harness.run_variant(flag)
            except Exception:
                if harness.page:
                    try:
                        harness.page.screenshot(path=str(args.output / 'FAILURE.png'), timeout=10000)
                        harness.record['failure_world'] = harness.state()
                        harness.record['failure_diagnostics'] = harness.diag()
                    except Exception as error:
                        report['failure_capture_error'] = str(error)
                raise
            finally:
                # Browser cleanup remains inside the live Playwright lifetime.
                if harness.context is not None:
                    try:
                        harness.context.close()
                    finally:
                        harness.context = harness.page = None
        harness.variant = None
        harness.check('all runtime/HTML/tool and earned provenance hashes stay frozen',
                      all(sha(ROOT / p) == h for p, h in source_hashes.items()) and all(sha(Path(p)) == h for p, h in seed_hashes.items()))
        harness.check('no browser or console runtime error was hidden', not report['browser_errors'] and not report['console_errors'],
                      {'browser_errors': report['browser_errors'], 'console_errors': report['console_errors']})
        report['status'] = 'passed'
    except Exception:
        report['status'] = 'failed'
        report['errors'].append(traceback.format_exc())
        print(report['errors'][-1], flush=True)
    finally:
        if harness:
            try:
                harness.stop()
            except Exception as error:
                report['cleanup_error'] = str(error)
                report['status'] = 'failed'
        report['final_source_hashes'] = {p: sha(ROOT / p) if (ROOT / p).is_file() else None for p in source_hashes}
        report['final_seed_input_hashes'] = {p: sha(Path(p)) if Path(p).is_file() else None for p in seed_hashes}
        report['source_drift'] = report['final_source_hashes'] != source_hashes or report['final_seed_input_hashes'] != seed_hashes
        if report['source_drift']:
            report['status'] = 'failed'
        (args.output / 'REPORT.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(f'Heaven campaign browser: {sum(c["passed"] for c in report["checks"])}/{len(report["checks"])} checks; {report["status"]}', flush=True)
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
