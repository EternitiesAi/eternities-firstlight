#!/usr/bin/env python3
"""Earned Hell campaign through native UI and whole-Chromium restart.

Production walking/combat uses labelled accelerated 50 ms ticks. Native UI,
storage, actual WebGL pixels and source receipts are tested; this is not human
pacing, ordinary-RAF footage, hardware performance or public-release evidence.
No actor teleport, manual damage, inventory grant or planted campaign fact is
used. The optional capacity/refused-write checks have separate synthetic labels.
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

ROOT = Path(__file__).resolve().parents[1]
from playwright.sync_api import sync_playwright
_support_spec = importlib.util.spec_from_file_location('firstlight_hell_browser_support', ROOT / 'tools' / 'browser_support.py')
_support = importlib.util.module_from_spec(_support_spec)
_support_spec.loader.exec_module(_support)
launch_kwargs = _support.launch_kwargs

VARIANTS = {'blade': ('fresh-blade', 'unbind'), 'bow': ('fresh-bow', 'divert'),
            'veteran': ('returning-strongest', 'license')}
INITIALIZE = r"""(() => {
 window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;
 const key='eternities.realm10.characters.v1';
 try{window.__hcStartup=localStorage.getItem(key);}catch(e){window.__hcStartupError=String(e);}
 const original=Storage.prototype.setItem;
 Storage.prototype.setItem=function(k,v){const r=original.call(this,k,v);
  if(k===key)console.debug('__HC_NATIVE_WRITE__'+String(v));return r;};
})()"""


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def digest(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest() if text is not None else None


def ownership(world):
    a = world['adventure']
    return {'adventure': {k: v for k, v in a.items() if k not in (
        'elapsed', 'hp', 'stamina', 'revision', 'xp', 'coins', 'ore', 'receipts')},
        'world': {k: world[k] for k in ('journeys', 'realmTrails', 'earthExpedition',
            'bridgeCommunity', 'localLife', 'homeHistory', 'notes', 'score',
            'scoreRevision', 'retreat', 'visitor', 'flowers')},
        'sandbox': {k: world['sandbox'][k] for k in ('placed', 'nextId', 'stats',
            'milestones', 'bridge', 'recentCommands')}}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *args):
        pass


class CampaignBrowser:
    def __init__(self, args, report):
        self.args, self.report = args, report
        self.context = self.page = None
        self.variant = self.record = None
        self.last_native_write = None
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
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
        if text.startswith('__HC_NATIVE_WRITE__'):
            raw = text[len('__HC_NATIVE_WRITE__'):]
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
        events = []
        self.page.on('requestfailed', lambda r: events.append({'event': 'requestfailed', 'url': r.url, 'failure': r.failure}))
        self.page.on('domcontentloaded', lambda: events.append({'event': 'domcontentloaded'}))
        self.page.on('load', lambda: events.append({'event': 'load'}))
        began = time.monotonic()
        try:
            response = self.page.goto(self.url, wait_until='load', timeout=30000)
            self.page.wait_for_function('()=>!!window.Realm', timeout=30000)
        finally:
            self.record['navigation'].append({'seconds': time.monotonic() - began, 'events': events})
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

    def workspace(self, tab='hell-campaign'):
        self.close_workspace()
        self.page.keyboard.press('j')
        if tab == 'hell-campaign':
            self.page.locator('#rpg-content [data-rpg="hell-campaign-open"]').first.click()
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
        target = self.definition['giver'] if step_id in ('giver', 'claim') else next(s for s in self.definition['steps'] if s['id'] == step_id)
        walk = self.page.locator(f'#rpg-content [data-rpg="hell-campaign-walk"][data-id="{step_id}"]')
        if not walk.count():
            self.check('current physical location already reaches ' + target['name'],
                       self.ev('p=>RealmHellCampaign.at(Realm.test.worldContext().sim,p)', target))
            self.close_workspace()
            return
        walk.first.click()
        self.settle_walk(target, target['name'])

    def enter(self):
        if self.diag()['scene'] != 'valley':
            return
        if not self.ev('RealmWorldFoundations.atRoad(Realm.test.worldContext().sim)'):
            self.walk_exact(18, 6, 'Roads of Light')
        self.ev(r"""()=>{if(window.__hcHooked)return;window.__hcHooked=true;
         const p=RealmArt.WorldArt.prototype,original=p.commit;
         p.commit=function(...a){const r=original.apply(this,a);window.__hcArt=this;const e=this.e;
          if(!e.__hcRenderObserved){e.__hcRenderObserved=true;const render=e.render;
           e.render=function(...a){this.__hcLastRender=a.slice();return render.apply(this,a);};}return r;};}""")
        self.workspace('worlds')
        if self.page.locator('#rpg-content [data-rpg="world-list"]').count():
            self.page.locator('#rpg-content [data-rpg="world-list"]').click()
        self.page.locator('#rpg-content [data-rpg="world-select"][data-id="hell"]').click()
        self.page.locator('#rpg-content [data-rpg="world-preview"]').click()
        self.check('travel has a visible saved-checkpoint confirmation', self.page.locator('[data-rpg="world-confirm"]').is_visible())
        self.page.locator('[data-rpg="world-confirm"]').click()
        self.render()
        self.check('native confirmed travel reaches Hell without implicit campaign acceptance', self.diag()['scene'] == 'world-hell')
        if 'warden-resolved' in self.state()['hellCampaign']['steps']:
            self.check('Hell reentry cannot reconstruct the resolved Warden in the actual runtime',
                       self.ev('()=>!RealmHellCampaign.enemies(Realm.test.worldContext().sim).length&&!RealmAdventure.runtime(Realm.test.worldContext().sim).enemies.some(e=>e.hellCampaign)'))

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
                   stored['hellCampaign'] == before['hellCampaign'] and ownership(stored) == ownership(before)
                   and stored['sandbox']['inventory'] == before['sandbox']['inventory']
                   and all(stored['adventure'][k] == before['adventure'][k] for k in ('xp', 'coins', 'ore')))
        with self.page.expect_event('close'):
            self.page.close(run_before_unload=True)
        self.context.close()
        self.context = self.page = None
        expected_raw = self.last_native_write or raw
        self.check(label + ' observed last successful write remains a valid owned library',
                   json.loads(expected_raw)['active'] == self.active)
        self.start()
        startup = self.ev('window.__hcStartup')
        self.check(label + ' cold startup bytes equal the actual last successful native write', startup == expected_raw,
                   {'expected_sha256': digest(expected_raw), 'startup_sha256': digest(startup)})
        after = self.state()
        loaded = self.native_world(startup)
        self.check(label + ' whole-Chromium restart loads production storage without imported replacement',
                   self.diag()['scene'] == 'valley' and self.diag()['characters']['active'] == self.active
                   and after['hellCampaign'] == before['hellCampaign']
                   and ownership(after) == ownership(before) and loaded == stored
                   and after['sandbox']['inventory'] == before['sandbox']['inventory']
                   and all(after['adventure'][k] == before['adventure'][k] for k in ('xp', 'coins', 'ore')))
        self.record['restarts'].append({'label': label, 'startup_sha256': digest(startup), 'campaign': after['hellCampaign']})

    def click_action(self, step_id):
        self.walk_ui(step_id)
        self.page.keyboard.press('e')
        self.render()
        self.page.locator(f'#rpg-content [data-rpg="hell-campaign-step"][data-id="{step_id}"]').click()
        self.render()
        self.check('visible physical action records ' + step_id, step_id in self.state()['hellCampaign']['steps'])

    def inspect_map(self):
        before = self.state()
        self.workspace('atlas')
        text = self.page.locator('#rpg-content').inner_text()
        self.check('map visibly distinguishes supported accepted W actions',
                   'W labels' in text and 'inner works stay closed' in text
                   and self.page.locator('[data-rpg="hell-campaign-walk"]').count() > 0)
        self.check('map inspection grants no saved work or payment',
                   self.state()['hellCampaign'] == before['hellCampaign']
                   and ownership(self.state()) == ownership(before)
                   and all(self.state()['adventure'][k] == before['adventure'][k] for k in ('xp', 'coins', 'ore')))
        self.shot('accepted-map')

    def pixel_control(self, selection, view, label):
        self.close_workspace()
        self.page.locator(f'#rpg-hud [data-rpg="camera"][data-id="{view}"]').click()
        self.page.keyboard.press('r')
        self.render()
        self.check(label + ' uses actual ' + view + ' camera', self.diag()['camera']['projection'] == ('perspective' if view == 'adventure' else 'orthographic'))
        result = self.ev(r"""selection=>{const art=window.__hcArt,e=art.e,sim=Realm.test.worldContext().sim;
         const saved=e.dynamic.map(b=>({b,items:b.items,data:b.data,count:b.count}));
         const selected=i=>selection==='telegraph'?i.hellCampaignTelegraph===true:selection==='actor'?!!i.hellCampaignActor&&!i.hellCampaignTelegraph:
           selection==='service-engine'||selection==='route-plate'?i.hellCampaignFixture===selection:false;
         const sig=()=>JSON.stringify({state:Realm.state,player:sim.state.player,camera:e.camera,view:Array.from(e.vp)}),before=sig();
         const read=()=>{const g=e.gl,a=new Uint8Array(e.mainF.w*e.mainF.h*4);g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);
           g.readPixels(0,0,e.mainF.w,e.mainF.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;};
         const args=e.__hcLastRender.slice();e.render(...args);const present=read();let parts=0;
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
        result = self.ev(r"""()=>{const e=__hcArt.e,sim=Realm.test.worldContext().sim,saved=[...e.batches,...e.dynamic].map(b=>({b,items:b.items,data:b.data,count:b.count}));
         const read=()=>{const g=e.gl,a=new Uint8Array(e.mainF.w*e.mainF.h*4);g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);g.readPixels(0,0,e.mainF.w,e.mainF.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;};
         const before=JSON.stringify(Realm.state),args=e.__hcLastRender.slice();e.render(...args);const baseline=read();
         try{for(const q of saved){q.b.items=[];e.updateBatch(q.b);}e.render(...args);const empty=read();let changed=0;
          for(let i=0;i<baseline.length;i+=4)if(Math.max(...[0,1,2].map(k=>Math.abs(baseline[i+k]-empty[i+k])))>2)changed++;
          for(const q of saved){q.b.items=q.items;q.b.data=q.data;e.updateBatch(q.b);q.b.count=q.count;}e.render(...args);const restore=read();let delta=0;for(let i=0;i<baseline.length;i++)delta+=Math.abs(baseline[i]-restore[i]);
          return{changedPixels:changed,restorationByteDelta:delta,pure:before===JSON.stringify(Realm.state),glError:e.gl.getError()};
         }finally{for(const q of saved){q.b.items=q.items;q.b.data=q.data;e.updateBatch(q.b);q.b.count=q.count;}}}""")
        self.check('empty-geometry positive control detects the actual fresh framebuffer',
                   result['changedPixels'] > 100 and result['restorationByteDelta'] == 0 and result['pure'] and result['glError'] == 0, result)

    def until_windup(self, kind=None):
        result = self.ev(r"""wanted=>{const sim=Realm.test.worldContext().sim,id=RealmHellCampaign.definition.enemy.id;
         for(let i=0;i<600;i++){const e=RealmAdventure.runtime(sim).enemies.find(e=>e.id===id);if(sim.state.adventure.hp<=0)return{ok:false,error:'traveller died'};
          if(e?.mode==='windup'&&e.timer>.9&&(!wanted||e.strike?.kind===wanted))return{ok:true,enemy:{...e,path:undefined},elapsed:sim.state.adventure.elapsed};Realm.test.step(.05);}return{ok:false,error:'no actual warned attack'};}""", kind)
        self.check('actual AI enters ' + (kind or 'a') + ' locked warning', result.get('ok'), result)
        self.render()
        return result

    def fight(self):
        enemy = self.definition['enemy']
        self.close_workspace()
        style = self.diag()['adventure']['weapon']['style']
        radius = 4 if style == 'bow' else 1.1
        self.walk_exact(enemy['x'], enemy['z'] + radius, 'actual Veyr weapon range')
        for _ in range(8):
            self.page.keyboard.press('Tab')
            if self.diag()['adventure']['tactics']['target'] == enemy['id']:
                break
        self.check('native Tab selects the canonical campaign actor', self.diag()['adventure']['tactics']['target'] == enemy['id'])
        first = self.until_windup('sweep')
        self.check('fixed 120 health and 12 damage are retained', first['enemy']['maxHP'] == 120 and first['enemy']['damage'] == 12)
        self.check('selected target has a visible shape/text warning', self.page.locator('#target-cue').get_attribute('data-phase') == 'windup'
                   and ('Brace' in self.page.locator('#target-cue-detail').inner_text() or 'Braced' in self.page.locator('#target-cue-detail').inner_text()))
        self.page.locator('#skill-guard').click()
        self.render()
        self.check('native Brace button sets actual production mitigation', self.diag()['adventure']['tactics']['guardUntil'] > first['elapsed'])
        for view in ('adventure', 'follow'):
            self.pixel_control('telegraph', view, 'sweep-warning')
        self.framebuffer_positive_control()
        if style == 'bow':
            result = self.ev(r"""()=>{const sim=Realm.test.worldContext().sim,e=RealmAdventure.runtime(sim).enemies.find(e=>e.hellCampaign),at=sim.state.adventure.elapsed,hp=e.hp;
             const r=Realm.test.adventure('hc-browser-closed-arrow','attack',{target:e.id});if(!r.ok)return{ok:false,result:r};let arrows=false;
             for(let i=0;i<18;i++){arrows ||= RealmArsenal.runtime(sim).arrows.length>0;Realm.test.step(.05);const fx=RealmAdventure.runtime(sim).fx.filter(f=>f.at>=at);
              if(fx.some(f=>f.kind==='arrow-wall'))return{ok:arrows&&e.hp===hp&&!fx.some(f=>['hit','arrow-hit'].includes(f.kind)),arrows,hp:e.hp,beforeHP:hp,wallCues:fx.filter(f=>f.kind==='arrow-wall').length,hitCues:fx.filter(f=>['hit','arrow-hit'].includes(f.kind)).length};}
             return{ok:false,error:'no actual rejected projectile contact',arrows,hp:e.hp};}""")
            self.check('real closed-window projectile rejects damage and confirmed-hit cues', result.get('ok'), result)
            self.record['closed_projectile'] = result
        second = self.until_windup('line')
        self.check('optional supports lengthen only the matching actual recovery', abs(second['enemy']['recovery'] - 2.8) < 1e-8)
        for view in ('adventure', 'follow'):
            self.pixel_control('telegraph', view, 'line-warning')
        for view in ('adventure', 'follow'):
            self.pixel_control('actor', view, 'actual-warden')
        before = self.state()
        self.page.locator('#skill-auto').click()
        self.render()
        self.check('native Autoattack enables production combat intent', self.diag()['adventure']['tactics']['auto'])
        result = self.ev(r"""()=>{const sim=Realm.test.worldContext().sim,d=RealmHellCampaign.definition,A=RealmAdventure,initial=sim.state.adventure.elapsed,hits=[],warnings=[],weaponImpacts=[],attackCommands=[];
         const command=sim.adventureCommand,damage=A.damageEnemy;
         // Pass-through observers attribute immediate blade impacts and the
         // public damage caller used by actual projectile contacts. They never
         // invoke damage, edit its value, or manufacture an attack command.
         sim.adventureCommand=function(id,type,payload){const e=A.runtime(this).enemies.find(e=>e.id===d.enemy.id),before=e?.hp,mode=e?.mode,style=RealmArsenal.weapon(this.state.adventure).style;
          const r=command.call(this,id,type,payload);if(type==='attack'&&payload?.target===d.enemy.id){attackCommands.push({id,style,ok:r.ok,at:this.state.adventure.elapsed-initial});
           if(style==='blade'&&e&&e.hp<before)weaponImpacts.push({source:'production blade attack command',mode,before,hp:e.hp,at:this.state.adventure.elapsed-initial});}return r;};
         A.damageEnemy=function(owner,e,n,source){const hp=e?.hp,mode=e?.mode,r=damage.apply(this,arguments);
          if(owner===sim&&e?.id===d.enemy.id&&source==='weapon'&&e.hp<hp)weaponImpacts.push({source:'production projectile contact',mode,before:hp,hp:e.hp,at:sim.state.adventure.elapsed-initial});return r;};
         let frames=0,guards=0,arrows=false,lastHP=RealmAdventure.runtime(sim).enemies.find(e=>e.id===d.enemy.id).hp;
         try{while(!sim.state.hellCampaign.steps.includes(d.enemy.defeatStep)&&frames++<4000){const e=RealmAdventure.runtime(sim).enemies.find(e=>e.id===d.enemy.id),a=sim.state.adventure,t=RealmCombat.runtime(sim),cue=RealmCombat.threat(sim);
          if(!e||a.hp<=0)return{ok:false,error:'actor absent or traveller died',frames};if(cue?.phase==='windup'&&!warnings.includes(e.strike?.kind))warnings.push(e.strike?.kind);
          if(cue?.phase==='windup'&&a.stamina>=20&&a.elapsed>=t.cooldowns.guard){const r=Realm.test.adventure('hc-guard-'+frames,'guard');if(!r.ok)return{ok:false,error:r.error};guards++;}
          Realm.test.step(.05);arrows ||= RealmArsenal.runtime(sim).arrows.length>0;
          if(e.hp<lastHP){hits.push({at:a.elapsed-initial,mode:e.mode,before:lastHP,hp:e.hp});lastHP=e.hp;}
         }return{ok:frames<4000&&lastHP===0,frames,guards,arrows,warnings,hits,weaponImpacts,attackCommands,hitLabel:'confirmed actual HP loss; an owned following Briar may also contribute',seconds:sim.state.adventure.elapsed-initial,hpAfter:sim.state.adventure.hp};
         }finally{sim.adventureCommand=command;A.damageEnemy=damage;}}""")
        self.check('actual combat with attributable owned weapon impacts earns Warden resolution',
                   result.get('ok') and len(result['hits']) >= 1 and len(result['weaponImpacts']) >= 1, result)
        self.check('all confirmed actual damage and attributable weapon impacts occur during real recovery',
                   all(h['mode'] == 'recover' for h in result['hits'] + result['weaponImpacts']))
        if self.variant != 'returning-strongest':
            self.check('starter equipment exercises multiple accepted owned weapon impacts', len(result['weaponImpacts']) > 1)
        if style == 'bow':
            self.check('bow victory contains real production projectiles and attributable exposed contacts',
                       result['arrows'] and any(h['source'] == 'production projectile contact' for h in result['weaponImpacts']))
        if self.diag()['adventure']['tactics']['auto']:
            self.page.locator('#skill-auto').click()
        self.render()
        self.check('resolved combat intent is stopped without changing the owned equipment', not self.diag()['adventure']['tactics']['auto'])
        after = self.state()
        self.check('the Warden grants no independent enemy XP, ore, coins or loot',
                   all(after['adventure'][k] == before['adventure'][k] for k in ('xp', 'coins', 'ore', 'drops', 'defeated')))
        self.record['combat'] = result
        self.shot('warden-resolved')

    def refusal_checks(self):
        self.workspace()
        before = self.state()
        raw = self.ev('localStorage.getItem(RealmCharacters.KEY)')
        self.ev(r"""()=>{window.__hcQuotaOriginal=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===RealmCharacters.KEY)throw Error('Labelled synthetic Hell campaign quota refusal');return __hcQuotaOriginal.call(this,k,v);};}""")
        try:
            self.page.locator('[data-rpg="hell-campaign-claim"]').click()
            self.render()
            self.check('synthetic refused native write preserves actual ready/unpaid world and bytes',
                       self.state() == before and self.ev('localStorage.getItem(RealmCharacters.KEY)') == raw)
        finally:
            self.ev('Storage.prototype.setItem=window.__hcQuotaOriginal;delete window.__hcQuotaOriginal')
        result = self.ev(r"""()=>{const actual=Realm.test.worldContext().sim,before=JSON.stringify(Realm.state),clone=new RealmCore.Simulation(Realm.state);
         clone.room=actual.room;clone.returnPos={...actual.returnPos};clone.state.player={...actual.state.player};clone.state.adventure.coins=9999;
         const prior=JSON.stringify(clone.state),ctx={sim:clone,active:'synthetic-capacity',revision:0};let saves=0;
         const r=RealmHellCampaign.command(ctx,'claim',{quest:RealmHellCampaign.definition.id,expectedActive:ctx.active,expectedRevision:clone.state.adventure.revision},{save:()=>{saves++;return{ok:true};}});
         return{ok:!r.ok&&r.error.includes('Make room')&&saves===0&&prior===JSON.stringify(clone.state)&&before===JSON.stringify(Realm.state),result:r,saves,scope:'separate clone; one labelled synthetic coin-capacity edit; never adopted or persisted'};}""")
        self.check('separate synthetic capacity clone refuses the whole fee without any live edit', result.get('ok'), result)
        self.record['synthetic_refusal_checks'] = {'write_refusal': True, 'capacity': result}

    def run_variant(self, flag):
        self.variant, choice = VARIANTS[flag]
        self.record = {'choice': choice, 'navigation': [], 'native_write_receipts': [], 'restarts': [],
                       'screenshots': [], 'walks': [], 'pixel_controls': []}
        self.report['variants'][self.variant] = self.record
        self.profile = self.args.output / (self.variant + '-isolated-profile')
        self.profile.mkdir()
        self.last_native_write = None
        source = self.args.sources / self.variant / '00_EARNED_SEED.json'
        seed = json.loads(source.read_text(encoding='utf-8'))
        source_copy = self.args.output / (self.variant + '-EARNED_SEED.json')
        source_copy.write_bytes(source.read_bytes())
        self.record['earned_seed'] = {'path': str(source), 'sha256': sha(source),
            'exact_evidence_copy': str(source_copy), 'copy_sha256': sha(source_copy),
            'method': 'command-earned by tests/hell_campaign_journey.cjs --seed-only; imported once through Characters UI'}
        self.start()
        self.definition = self.ev('RealmHellCampaign.definition')
        self.check('earned seed has claimed Open Cage and no planted new campaign',
                   seed['realmTrails']['records'][self.definition['prerequisite']]['claimed']
                   and not seed.get('hellCampaign', {}).get('accepted', False))
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
        initial = self.state()
        self.check('visible import adds the complete earned character without replacing the original slot',
                   self.diag()['characters']['count'] == 2 and ownership(initial) == ownership(seed)
                   and self.ev('localStorage.getItem(RealmCore.KEY)') == legacy)
        self.enter()
        before = self.state()
        self.workspace()
        terms = self.page.locator('#rpg-content').inner_text()
        self.check('visible terms disclose fixed combat, equal fee and bounded choice consequences',
                   all(t in terms for t in ('120 health', '12 damage', '1.35', '2.2', '0.6', '45 XP', '20 sunmarks',
                       '4 ore', '3 timber', '2 meadow fibre', 'Unbind', 'Divert', 'License', 'inner works stay closed')))
        self.check('reading does not accept work or spend anything', self.state() == before)
        self.walk_ui('giver')
        self.workspace()
        self.page.locator('[data-rpg="hell-campaign-accept"]').click()
        self.render()
        self.check('native explicit acceptance keeps older systems and equipped gear',
                   self.state()['hellCampaign']['accepted'] and ownership(self.state()) == ownership(initial)
                   and self.state()['sandbox']['inventory'] == initial['sandbox']['inventory'])
        self.restart('accepted')
        self.enter()
        self.inspect_map()
        for step in ('witness-record', 'tovan-account', 'read-service-writ'):
            self.click_action(step)
        self.restart('partial-records')
        self.enter()
        for step in ('west-shunt', 'east-brace', 'challenge-veyr'):
            self.click_action(step)
        self.fight()
        self.restart('warden-resolved')
        self.enter()
        self.click_action('stabilize-service-engine')
        self.workspace()
        before = self.state()
        self.page.locator(f'[data-rpg="hell-campaign-review"][data-id="{choice}"]').click()
        self.render()
        self.check('first-stage choice preview is visible and grants no disposition',
                   self.page.locator('.hell-campaign-confirm').is_visible() and self.state() == before)
        self.page.locator('[data-rpg="hell-campaign-cancel"]').click()
        self.render()
        self.check('cancel preserves the undecided saved campaign', self.state() == before and not self.page.locator('.hell-campaign-confirm').count())
        self.page.locator(f'[data-rpg="hell-campaign-review"][data-id="{choice}"]').click()
        self.page.locator(f'[data-rpg="hell-campaign-confirm"][data-id="{choice}"]').click()
        self.render()
        self.check('native explicit second-stage confirmation records the chosen local deed', self.state()['hellCampaign']['choice'] == choice)
        self.close_workspace()
        for view in ('adventure', 'follow'):
            self.pixel_control('service-engine', view, choice + '-actual-engine')
        self.walk_ui('verify-route')
        for view in ('adventure', 'follow'):
            self.pixel_control('route-plate', view, choice + '-actual-plate')
        parts = self.ev('()=>__hcArt.e.dynamic.flatMap(b=>b.items).filter(i=>i.hellCampaignFixture).map(i=>({fixture:i.hellCampaignFixture,part:i.hellCampaignPart,choice:i.hellCampaignChoice}))')
        expected = {'unbind': 'open-release-handle', 'divert': 'hooded-service-marker', 'license': 'named-crew-seal'}[choice]
        self.check('engine and plate show the chosen physical outcome', all(any(p['fixture'] == f and p['part'] == expected and p['choice'] == choice for p in parts) for f in ('service-engine', 'route-plate')), parts)
        self.restart('chosen')
        self.enter()
        self.click_action('verify-route')
        self.workspace()
        recognition = self.page.locator('.hell-campaign-local-recognition').inner_text()
        self.check('verified local choice has real visible Istra, Tovan and Neris recognition', all(name + ':' in recognition for name in ('Istra', 'Tovan', 'Neris')), recognition)
        self.check('completed campaign remains explicitly unpaid', self.ev('RealmHellCampaign.ready(Realm.state)') and not self.state()['hellCampaign']['claimed'])
        self.restart('ready-unpaid')
        self.enter()
        self.walk_ui('claim')
        self.refusal_checks()
        before = self.state()
        self.page.locator('[data-rpg="hell-campaign-claim"]').click()
        self.render()
        paid = self.state()
        fee = self.definition['reward']
        expected_inventory = {**before['sandbox']['inventory']}
        for k, n in fee['materials'].items():
            expected_inventory[k] += n
        self.check('native explicit claim credits exactly the complete fixed fee within existing XP cap',
                   paid['hellCampaign']['claimed'] and
                   paid['adventure']['xp'] - before['adventure']['xp'] == min(fee['xp'], 9999 - before['adventure']['xp'])
                   and all(paid['adventure'][k] - before['adventure'][k] == fee[k] for k in ('coins', 'ore'))
                   and paid['sandbox']['inventory'] == expected_inventory)
        self.check('claim preserves the baseline gear, sockets, choices and older ledgers', ownership(paid) == ownership(initial))
        expected_total_inventory = {**initial['sandbox']['inventory']}
        for k, n in fee['materials'].items():
            expected_total_inventory[k] += n
        self.check('the entire expedition spends no ordinary inventory or existing fee balance',
                   paid['sandbox']['inventory'] == expected_total_inventory
                   and paid['adventure']['xp'] - initial['adventure']['xp'] == min(fee['xp'], 9999 - initial['adventure']['xp'])
                   and all(paid['adventure'][k] - initial['adventure'][k] == fee[k] for k in ('coins', 'ore')))
        duplicate = self.ev(r"""()=>{const c=Realm.test.worldContext(),d=RealmHellCampaign.definition;
         return Realm.test.hellCampaignCommand('claim',{quest:d.id,expectedRevision:c.sim.state.adventure.revision,expectedActive:c.active,request:'different-native-request'});}""")
        self.check('changed request cannot replay an already paid campaign', duplicate.get('duplicate') and self.state() == paid)
        self.restart('paid')
        self.check('paid native restart retains the exact chosen disposition and fixed credited balances',
                   self.state()['hellCampaign']['choice'] == choice and self.state()['hellCampaign']['claimed']
                   and all(self.state()['adventure'][k] == paid['adventure'][k] for k in ('xp', 'coins', 'ore')))
        self.record['initial_balances'] = {k: initial['adventure'][k] for k in ('xp', 'coins', 'ore')}
        self.record['final_world'] = self.state()
        self.check('no actual runtime diagnostics errors', not self.diag()['errors'], self.diag()['errors'])
        self.context.close()
        self.context = self.page = None

    def stop(self):
        if self.context is not None:
            self.context.close()
        self.server.shutdown()
        self.server.server_close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path, help='A new evidence root; D: required on Windows. Existing evidence is refused.')
    parser.add_argument('--sources', required=True, type=Path, help='Root containing fresh-blade/fresh-bow/returning-strongest command-earned seed folders.')
    parser.add_argument('--renderer', choices=('software', 'hardware'), default='software')
    parser.add_argument('--variant', choices=('blade', 'bow', 'veteran', 'all'), default='all')
    args = parser.parse_args()
    args.output, args.sources = args.output.resolve(), args.sources.resolve()
    if os.name == 'nt' and (args.output.drive.upper() != 'D:' or args.sources.drive.upper() != 'D:'):
        parser.error('Isolated profiles, earned seeds and browser evidence must remain on D: on Windows.')
    flags = tuple(VARIANTS) if args.variant == 'all' else (args.variant,)
    for flag in flags:
        folder = VARIANTS[flag][0]
        if not (args.sources / folder / '00_EARNED_SEED.json').is_file():
            parser.error('Missing command-earned seed: ' + str(args.sources / folder / '00_EARNED_SEED.json'))
    try:
        args.output.mkdir(parents=True, exist_ok=False)
    except FileExistsError:
        parser.error('--output must name a new directory; prior evidence is preserved.')
    inputs = [ROOT / 'build.py', ROOT / 'index.html', ROOT / 'FIRSTLIGHT_VALLEY.html', Path(__file__),
              ROOT / 'tools' / 'browser_support.py', ROOT / 'tests' / 'hell_campaign_journey.cjs',
              *sorted(p for p in (ROOT / 'src').iterdir() if p.is_file())]
    source_hashes = {str(p.relative_to(ROOT)): sha(p) for p in inputs}
    seed_hashes = {str(args.sources / VARIANTS[f][0] / '00_EARNED_SEED.json'):
                   sha(args.sources / VARIANTS[f][0] / '00_EARNED_SEED.json') for f in flags}
    report = {'method': __doc__, 'status': 'running', 'renderer_requested': args.renderer,
              'head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
              'source_state': subprocess.check_output(['git', 'status', '--porcelain'], cwd=ROOT, text=True).splitlines(),
              'html_sha256': sha(ROOT / 'index.html'), 'source_hashes': source_hashes, 'earned_seed_hashes': seed_hashes,
              'checks': [], 'variants': {}, 'browser_errors': [], 'console_errors': [], 'errors': [],
              'requested_variants': [VARIANTS[f][0] for f in flags],
              'accelerated_ticks': True, 'tick_seconds': .05, 'normal_time_footage': False,
              'native_persistence': True, 'human_pacing': False, 'performance_claim': False,
              'earned_campaign_actor_position_edits': 0, 'earned_campaign_inventory_grants': 0,
              'earned_campaign_manual_damage': 0, 'earned_campaign_planted_facts': 0,
              'synthetic_probe_scope': 'one discarded capacity clone and one temporary native-write refusal; no synthetic campaign facts adopted'}
    harness = None
    try:
        harness = CampaignBrowser(args, report)
        html = (ROOT / 'index.html').read_text(encoding='utf-8')
        modules = ['hell-campaign-data.js', 'hell-campaign.js', 'hell-campaign-ui.js', 'hell-campaign-art.js',
                   'adventure.js', 'arsenal.js', 'combat.js', 'core.js', 'rpg-ui.js']
        harness.check('assembled offline HTML embeds each exact current campaign/caller source',
                      all((ROOT / 'src' / p).read_text(encoding='utf-8').strip() in html for p in modules))
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
                if harness.context is not None:
                    try:
                        harness.context.close()
                    finally:
                        harness.context = harness.page = None
        harness.variant = None
        harness.check('all runtime/HTML/harness input hashes stay frozen throughout the native suite',
                      all(sha(ROOT / p) == h for p, h in source_hashes.items())
                      and all(sha(Path(p)) == h for p, h in seed_hashes.items()))
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
        report['final_source_hashes'] = {p: sha(ROOT / p) for p in source_hashes}
        report['final_earned_seed_hashes'] = {p: sha(Path(p)) for p in seed_hashes}
        report['source_drift'] = report['final_source_hashes'] != source_hashes or report['final_earned_seed_hashes'] != seed_hashes
        (args.output / 'REPORT.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(f'Hell campaign browser: {sum(c["passed"] for c in report["checks"])}/{len(report["checks"])} checks; {report["status"]}', flush=True)
    return 0 if report['status'] == 'passed' and not report['source_drift'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
