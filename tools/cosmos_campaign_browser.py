#!/usr/bin/env python3
"""Earned Cosmos native candidate. Execution requires an exclusive browser slot.

Only production moveTo and .05-second time adapters accelerate play. Native
import, travel, consent, fitting, target keys, weapons, account and fee use the
actual UI. No earned poses, HP, inventory, facts, modes or cycles are injected.
Three separately labelled derivative profiles test fee refusal and old history.
No video or profile copies. Importing this module launches nothing and generates
no fixtures. Prepared CPU checks are not completed native qualification.
"""
from pathlib import Path, PureWindowsPath
import argparse
import hashlib
import importlib.util
import json
import math
import os
import sys
import traceback

sys.dont_write_bytecode = True
ROOT = Path(os.environ.get('FIRSTLIGHT_ROOT', Path(__file__).resolve().parents[1])).resolve()
CAMPAIGN = 'cosmos-open-confluence-v1'
PREREQUISITE = 'cosmos-split-bearing-v1'
VARIANTS = {'blade': ('fresh-blade', 'public-record', (('material', 'ordinary'), ('living', 'supplied'))),
            'bow': ('fresh-bow', 'bounded-account', (('living', 'ordinary'), ('observation', 'supplied'))),
            'veteran': ('returning-strongest', 'public-record', (('material', 'supplied'), ('observation', 'ordinary')))}
INJECTIONS = ('positionEdits', 'actorPositionEdits', 'inventoryGrants', 'healthGrants',
              'manualDamage', 'plantedDefeats', 'plantedQuestFacts', 'forcedModes', 'forcedCycles')
CHECKPOINTS = ('00_EARNED_SEED', '01_ACCEPTED', '02_DISTINCT_SUPPORTS', '03_ACTUAL_RECLAIMER_SETTLED',
               '04_ACTUAL_GUARDIAN_READY', 'CHECKPOINT_RELEASE_WEST_LIVE', 'CHECKPOINT_RELEASE_EAST_LIVE',
               '05_ACTUAL_GUARDIAN_SETTLED', '06_CENTRAL_LINK_DISABLED', '07_DELIBERATE_ACCOUNT',
               '08_INDEPENDENT_SUPPORT_SETTINGS', '09_LOCAL_APPARATUS_OPEN', '10_VERIFIED_UNPAID',
               '11_PAID_ONCE', 'FINAL_WORLD')
JOURNEY_DEPENDENCIES = ('build.py', 'index.html', 'tests/realm_trails_journey.cjs',
                        'tests/realm_trails_cosmos_journey.cjs', 'tests/atlantis_campaign_journey.cjs',
                        'tests/heaven_campaign_journey.cjs')
VETERAN_FIXTURE = 'docs/evidence/world-production-2026-10-03/captures/returning-fit-final-01/FINAL_WORLD.json'
FRESH = {'version': 1, 'accepted': False, 'steps': [], 'choice': None, 'opened': False, 'claimed': False}


def checkpoint_names(flag):
    # The strongest source path honestly releases after exhaustion; fresh
    # blade/bow independently exercise live releases. Bind their actual names.
    if flag == 'veteran':
        return tuple({'CHECKPOINT_RELEASE_WEST_LIVE': 'CHECKPOINT_release-west-feed',
                      'CHECKPOINT_RELEASE_EAST_LIVE': 'CHECKPOINT_release-east-feed'}.get(n, n) for n in CHECKPOINTS)
    return CHECKPOINTS


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def digest(text):
    return hashlib.sha256(text.encode('utf8')).hexdigest() if text is not None else None


def read_json(path):
    value = json.loads(Path(path).read_text(encoding='utf-8-sig'))
    if not isinstance(value, dict):
        raise ValueError('Receipt must be a JSON object: ' + str(path))
    return value


def within(path, parent):
    return path == parent or parent in path.parents


def bounded(path, *, windows=None):
    p = Path(path).resolve()
    if p == Path(p.anchor):
        raise ValueError('Evidence must be a bounded directory, not a drive root.')
    if os.name == 'nt' if windows is None else windows:
        w = PureWindowsPath(str(p))
        if not w.is_absolute() or w.drive.upper() != 'D:':
            raise ValueError('Native evidence, earned inputs and profiles must resolve to D:.')
    return p


def guard_paths(output, sources, *, windows=None):
    output, sources = bounded(output, windows=windows), bounded(sources, windows=windows)
    if output.exists():
        raise FileExistsError('Use a new evidence root; previous evidence is never overwritten.')
    if not sources.is_dir() or within(output, sources) or within(sources, output):
        raise ValueError('Complete earned inputs and new native output must be separate trees.')
    return output, sources


def profile_path(output, label, *, windows=None):
    allowed = {v[0] for v in VARIANTS.values()} | {
        'fresh-blade-SYNTHETIC-crystal-capacity', 'fresh-blade-SYNTHETIC-claim-write-refusal',
        'returning-strongest-SYNTHETIC-old-save-migration'}
    if label not in allowed:
        raise ValueError('Unknown profile; this suite permits exactly six named families.')
    root = bounded(output, windows=windows)
    p = bounded(root / (label + '-isolated-profile'), windows=windows)
    if not within(p, root) or p.exists():
        raise FileExistsError('A profile must be a fresh, resolved child of the evidence root.')
    return p


def source_epoch(root=ROOT):
    root = Path(root).resolve()
    paths = sorted(p for p in (root / 'src').iterdir() if p.is_file())
    paths += [root / p for p in JOURNEY_DEPENDENCIES]
    return {p.relative_to(root).as_posix(): sha(p) for p in paths}


def read_provenance(sources, flags, root=ROOT):
    """Require complete current-source journeys; seed-only and stale runs refuse."""
    sources, root = Path(sources).resolve(), Path(root).resolve()
    epoch, result, frozen = source_epoch(root), {}, {}
    harness_hash = sha(root / 'tests/cosmos_campaign_journey.cjs')
    for flag in flags:
        label, choice, supports = VARIANTS[flag]
        folder = (sources / label).resolve()
        if folder == sources or not within(folder, sources):
            raise ValueError('Earned family escapes its root.')
        expected_checkpoints = checkpoint_names(flag)
        names = (*expected_checkpoints, 'SEED_PROVENANCE', 'COSMOS_CAMPAIGN_JOURNEY_REPORT')
        paths = {n: folder / (n + '.json') for n in names}
        if any(not p.is_file() or not within(p.resolve(), folder) for p in paths.values()):
            raise ValueError('Complete linked journey files are required: ' + label)
        seed, proof, journey = (read_json(paths[n]) for n in
                                ('00_EARNED_SEED', 'SEED_PROVENANCE', 'COSMOS_CAMPAIGN_JOURNEY_REPORT'))
        if proof.get('variant') != label or journey.get('variant') != label or proof.get('seedSha256') != sha(paths['00_EARNED_SEED']):
            raise ValueError('Seed identity/hash mismatch: ' + label)
        if any(type(v.get(k)) is not int or v[k] != 0 for v in (proof, journey) for k in INJECTIONS):
            raise ValueError('All nine no-injection counters must be explicit integer zero.')
        if not (proof.get('sourceHashes') == journey.get('sourceHashes') == journey.get('finalHashes') == epoch):
            raise ValueError('Complete source epoch must match actual current files.')
        if proof.get('harnessSha256') != harness_hash or journey.get('harnessSha256') != harness_hash:
            raise ValueError('Journey harness byte hash differs from the actual installed caller.')
        if (journey.get('status') != 'passed' or journey.get('sourceDrift') is not False or
                journey.get('campaignComplete') is not True or journey.get('canonicalPreservation') is not True or
                proof.get('prerequisite') != PREREQUISITE or journey.get('prerequisite') != PREREQUISITE or
                proof.get('prerequisiteClaimed') is not True or journey.get('prerequisiteClaimed') is not True):
            raise ValueError('A complete successful comparator/Cosmos journey is required.')
        expected_plan = [{'id': s, 'mode': m} for s, m in supports]
        if journey.get('plan', {}).get('supports') != expected_plan or journey.get('plan', {}).get('choice') != choice:
            raise ValueError('Representative support/account plan is incomplete or changed.')
        checkpoints, links = journey.get('checkpoints'), journey.get('checkpointHashes')
        if (not isinstance(checkpoints, list) or len(checkpoints) != len(set(checkpoints)) or
                set(checkpoints) != set(expected_checkpoints) or not isinstance(links, dict) or set(links) != set(checkpoints)):
            raise ValueError('Every complete earned checkpoint needs a unique linked byte hash.')
        for name, expected in links.items():
            if not isinstance(name, str) or any(c in name for c in '/\\:') or name in ('.', '..'):
                raise ValueError('Unsafe checkpoint stem.')
            p = folder / (name + '.json')
            if not p.is_file() or not within(p.resolve(), folder) or sha(p) != expected:
                raise ValueError('Checkpoint hash or containment mismatch: ' + name)
        if (not seed.get('adventure', {}).get('started') or
                seed.get('realmTrails', {}).get('records', {}).get(PREREQUISITE, {}).get('claimed') is not True or
                seed.get('cosmosCampaign') != FRESH):
            raise ValueError('Import must be an earned kit/comparator seed with unaccepted campaign.')
        final = read_json(paths['FINAL_WORLD']).get('cosmosCampaign', {})
        if not final.get('claimed') or not final.get('opened') or final.get('choice') != choice:
            raise ValueError('Actual paid/open final state is required.')
        fights = journey.get('fights', [])
        if {f.get('enemy') for f in fights} != {'cosmos-optical-reclaimer-v1', 'cosmos-still-meridian-guardian-v1'} or len(fights) != 2:
            raise ValueError('Two distinct actual encounter receipts are required.')
        if any(not f.get('weapons') or not f.get('impacts') or not f.get('frames') or not isinstance(f.get('contacts'), list) for f in fights):
            raise ValueError('Owned combat needs real weapon, HP and warning evidence; contact list remains honest, including zero.')
        if flag == 'bow' and any(f.get('style') != 'bow' or f.get('arrows') is not True or
                               not any(w.get('caller') == 'production projectile impact' for w in f['weapons']) for f in fights):
            raise ValueError('Bow requires actual traveling projectiles and attributed impact in both encounters.')
        if not journey.get('walks') or not journey.get('saveCount'):
            raise ValueError('Actual route/save evidence is missing.')
        if flag == 'veteran':
            original = root / VETERAN_FIXTURE
            receipt = journey.get('source', {})
            source_path = proof.get('fixture')
            canonical_tail = PureWindowsPath(VETERAN_FIXTURE).parts
            if (not original.is_file() or proof.get('fixtureHash') != sha(original) or receipt.get('sha256') != sha(original) or
                    not isinstance(source_path, str) or source_path != receipt.get('path') or
                    PureWindowsPath(source_path).parts[-len(canonical_tail):] != canonical_tail):
                raise ValueError('Strongest provenance must match the original canonical fixture bytes.')
            # Source roots may differ in a portable byte-identical checkout;
            # canonical identity and both linked hashes still bind the bytes.
            frozen[str(original)] = sha(original)
        result[label] = {'proof': proof, 'journey': journey, 'seed_sha256': sha(paths['00_EARNED_SEED'])}
        for p in sorted(folder.glob('*.json')):
            if not within(p.resolve(), folder):
                raise ValueError('Earned input escapes its family.')
            frozen[str(p)] = sha(p)
    return result, frozen


def ownership(world):
    # Elapsed life resources can regrow; actions may spend stamina/tonics.
    a = world['adventure']
    return {'adventure': {k: v for k, v in a.items() if k not in
                         ('elapsed', 'hp', 'stamina', 'tonics', 'revision', 'xp', 'coins', 'ore', 'receipts')},
            'world': {k: world[k] for k in ('journeys', 'realmTrails', 'earthExpedition', 'hellCampaign',
                         'heavenCampaign', 'atlantisCampaign', 'bridgeCommunity', 'localLife', 'homeHistory',
                         'notes', 'score', 'scoreRevision', 'retreat', 'visitor', 'flowers', 'seed', 'version', 'visited')},
            'sandbox': {k: world['sandbox'][k] for k in ('placed', 'nextId', 'stats', 'milestones', 'bridge', 'recentCommands')}}


def write_new(path, value):
    with Path(path).open('x', encoding='utf8') as handle:
        json.dump(value, handle, indent=2, ensure_ascii=False)
        handle.write('\n')


class CosmosMixin:
    def workspace(self, tab='cosmos-campaign'):
        self.close_workspace()
        self.page.keyboard.press('j')
        if tab == 'cosmos-campaign':
            self.page.locator('#rpg-content [data-rpg="cosmos-campaign-open"]').first.click()
        elif tab == 'cosmos':
            # Cosmos has an invitation on the native Map page, not a top tab.
            self.page.locator('#rpg-tabs [data-rpg="open"][data-id="atlas"]').click()
            self.page.locator('#rpg-content [data-rpg="cosmos-invitation"]').first.click()
        else:
            self.page.locator(f'#rpg-tabs [data-rpg="open"][data-id="{tab}"]').click()
        self.render()

    def begin_record(self, label, choice):
        self.variant = label
        self.record = {'choice': choice, 'navigation': [], 'native_write_receipts': [], 'restarts': [],
                       'screenshots': [], 'walks': [], 'pixel_controls': [], 'combat': [], 'warnings': [], 'misses': []}
        paths = self.report.setdefault('profile_paths', [])
        self.check('at most six owned profiles', len(paths) < 6)
        self.profile = profile_path(self.args.output, label)
        self.profile.mkdir(exist_ok=False)
        paths.append(str(self.profile))
        self.last_native_write = self.original_slot = None
        self.shot_serial = 0

    def shot(self, label):
        self.shot_serial += 1
        # Repeated genuine warnings get unique files, preserving prior frames.
        return super().shot(f'{self.shot_serial:02d}-'+label)

    def enter(self):
        if self.diag()['scene'] != 'valley':
            return
        gate = self.ev('RealmCosmos.GATE')
        self.walk_exact(gate['x'], gate['z'], 'ordinary Cosmos invitation')
        self.ev(r"""()=>{if(window.__hvcHooked)return;window.__hvcHooked=true;
         const p=RealmArt.WorldArt.prototype,original=p.commit;
         p.commit=function(...a){const r=original.apply(this,a);window.__hvcArt=this;const e=this.e;
          if(!e.__hvcRenderObserved){e.__hvcRenderObserved=true;const render=e.render;
           e.render=function(...a){this.__hvcLastRender=a.slice();return render.apply(this,a);};}return r;};}""")
        self.workspace('cosmos')
        self.check('native travel has explicit Cosmos confirmation', self.page.locator('[data-rpg="cosmos-confirm"]').is_visible())
        self.page.locator('[data-rpg="cosmos-confirm"]').click()
        self.render()
        self.check('actual Cosmos physical owner handles the connected service road',
                   self.diag()['scene'] == self.definition['room'] and self.diag()['cosmos']['walkable'] is True)
        self.check('no resolved machine recreates on native reentry', self.ev(r"""()=>{const sim=Realm.test.worldContext().sim,d=RealmCosmosCampaign.definition;
         return d.enemies.every(t=>!sim.state.cosmosCampaign.steps.includes(t.defeatStep)||!RealmAdventure.runtime(sim).enemies.some(e=>e.id===t.id));}"""))

    def defend(self):
        d, a = self.diag()['adventure'], self.state()['adventure']
        self.check('traveller survives actual production movement/combat', a['hp'] > 0)
        if any(e['mode'] == 'windup' for e in d['enemies']) and a['stamina'] >= 20 and a['elapsed'] >= d['tactics']['cooldowns']['guard']:
            self.page.locator('#skill-guard').click()
            self.record.setdefault('brace_commands', 0)
            self.record['brace_commands'] += 1
        if a['hp'] < 45 and a['tonics'] and a['elapsed'] >= self.ev('RealmAdventure.runtime(Realm.test.worldContext().sim).cooldowns.heal'):
            self.page.locator('#skill-heal').click()

    def settle_walk(self, point, label):
        valid = self.ev(r"""()=>{const sim=Realm.test.worldContext().sim,N=RealmCosmos;let p={...sim.state.player};
         for(const q of sim.playerPath){if(!(sim.room===N.ROOM?N.segment(p,q,.31):RealmCore.segment(p,q,sim.navRoom,.31)))return false;p=q;}return true;}""")
        self.check('whole supported body route reaches ' + label, valid)
        frames = 0
        while self.ev('Realm.test.path.length') and frames < 18000:
            self.defend()
            result = self.ev(r"""()=>{const sim=Realm.test.worldContext().sim,N=RealmCosmos;let count=0;
             for(;count<6&&sim.playerPath.length;count++){const p={...sim.state.player};Realm.test.step(.05);window.__hvcCombat?.sample();
              if(!(sim.room===N.ROOM?N.segment(p,sim.state.player,.31):RealmCore.segment(p,sim.state.player,sim.navRoom,.31)))return{ok:false,error:'unsupported body leg'};
              if(sim.state.adventure.hp<=0)return{ok:false,error:'traveller died'};}return{ok:true,count};}""")
            self.check('actual supported walking leg ' + label, result.get('ok'), result)
            frames += result['count']
        self.render()
        p = self.diag()['adventure']['player']
        self.check('production movement arrives near ' + label, frames < 18000 and math.hypot(p['x']-point['x'], p['z']-point['z']) <= 2.8)
        self.record['walks'].append({'label': label, 'frames': frames, 'player': p})

    def walk_ui(self, identifier):
        self.workspace()
        target = self.definition['giver'] if identifier in ('giver', 'claim') else self.step(identifier)
        control = self.page.locator(f'[data-rpg="cosmos-campaign-walk"][data-id="{identifier}"]')
        if control.count():
            control.first.click()
            self.settle_walk(target, target['name'])
        else:
            self.check('actual position already reaches ' + identifier,
                       self.ev('p=>RealmCosmosCampaign.at(Realm.test.worldContext().sim,p)', target))
            self.close_workspace()

    def step(self, identifier):
        return next(s for s in self.definition['steps'] if s['id'] == identifier)

    def companion_mode(self, mode):
        self.workspace('companion')
        self.page.locator(f'[data-rpg="companion"][data-id="{mode}"]').click()
        self.render()
        self.check('ordinary native companion control retains ' + mode, self.state()['adventure']['companion']['mode'] == mode)
        self.record.setdefault('companion_ui_commands', []).append(mode)
        self.close_workspace()

    def witness(self, identifier):
        terms = next(w for w in self.definition['witnesses'] if w['id'] == identifier)
        status = self.diag()['cosmos']['campaign']['witnesses']
        expected = [w['id'] for w in self.definition['witnesses'] if all(s in self.state()['cosmosCampaign']['steps'] for s in w['appearsAfter'])]
        self.check('actual transient witness membership follows only accepted facts', [w['id'] for w in status] == expected and identifier in expected)
        # A witness may stand on a sound court beside a gap. Choose a reachable
        # viewing side through the real planner instead of assuming its left
        # side has ground. This does not move the witness or relax walk checks.
        approach = self.ev(r"""w=>{const sim=Realm.test.worldContext().sim,N=RealmCosmos;
         const candidates=[{x:w.x-1.2,z:w.z},{x:w.x+1.2,z:w.z},{x:w.x,z:w.z-1.2},{x:w.x,z:w.z+1.2}];
         return candidates.find(p=>N.walkable(p.x,p.z,.31)&&RealmCore.pathfind(sim.state.player,p,sim.navRoom))||null;}""", terms)
        self.check('a full-body supported production route reaches the witness viewing side', approach is not None, approach)
        self.walk_exact(approach['x'], approach['z'], 'view owned ' + terms['name'])
        for view in ('adventure', 'follow'):
            self.pixel_control(identifier, view, 'owned-'+identifier)

    def action(self, identifier, *, exact=False):
        s = self.step(identifier)
        self.check('native controls cannot manually grant defeat/choice', s['kind'] in ('interact', 'configure'))
        if exact:
            self.walk_exact(s['x'], s['z'], s['name'])
        else:
            self.walk_ui(identifier)
        self.workspace()
        kind = 'configure' if s['kind'] == 'configure' else 'step'
        before = self.state()
        frame = self.ev('()=>{const e=RealmAdventure.runtime(Realm.test.worldContext().sim).enemies.find(e=>e.mode==="windup");return e?{id:e.id,strike:e.strike}:null;}')
        self.page.locator(f'[data-rpg="cosmos-campaign-{kind}"][data-id="{identifier}"]').click()
        self.render()
        after = self.state()
        self.check('actual physical UI operation records ' + identifier, identifier in after['cosmosCampaign']['steps'])
        self.check('operation never pays an independent fee ' + identifier,
                   all(after['adventure'][k] == before['adventure'][k] for k in ('xp', 'coins', 'ore')) and after['sandbox']['inventory'] == before['sandbox']['inventory'])
        if frame and identifier in ('release-west-feed', 'release-east-feed'):
            self.check('release does not replace a currently locked frame', self.ev('f=>{const e=RealmAdventure.runtime(Realm.test.worldContext().sim).enemies.find(e=>e.id===f.id);return JSON.stringify(e.strike)===JSON.stringify(f.strike);}', frame))
        self.close_workspace()

    def restart(self, label):
        self.close_workspace()
        result = self.ev('Realm.test.save()')
        self.check(label + ' saves through native owner', result.get('ok'), result)
        before, raw = self.state(), self.ev('localStorage.getItem(RealmCharacters.KEY)')
        stored = self.native_world(raw)
        self.check(label + ' exact native full world is persisted', stored == before)
        self.original_slot_unchanged(label)
        self.page.close(run_before_unload=True)
        self.context.close()
        self.context = self.page = None
        expected = self.last_native_write or raw
        self.start()
        startup, after = self.ev('window.__hvcStartup'), self.state()
        self.check(label + ' whole-Chromium startup preserves exact bytes', startup == expected)
        self.check(label + ' preserves previous history, opened/account facts and kit',
                   self.diag()['scene'] == 'valley' and self.diag()['characters']['active'] == self.active and
                   self.native_world(startup) == stored and after['cosmosCampaign'] == before['cosmosCampaign'] and
                   ownership(after) == ownership(before) and after['sandbox']['inventory'] == before['sandbox']['inventory'] and
                   all(after['adventure'][k] == before['adventure'][k] for k in ('xp', 'coins', 'ore')))
        self.record['restarts'].append({'label': label, 'startup_native_bytes': startup, 'startup_sha256': digest(startup), 'campaign': after['cosmosCampaign']})
        self.original_slot_unchanged(label + ' cold load')

    def pixel_control(self, selection, view, label):
        self.close_workspace()
        self.page.locator(f'#rpg-hud [data-rpg="camera"][data-id="{view}"]').click()
        self.page.keyboard.press('r')
        self.render()
        self.check('actual requested camera ' + view, self.diag()['camera']['projection'] == ('perspective' if view == 'adventure' else 'orthographic'))
        result = self.ev(r"""selection=>{const e=__hvcArt.e,sim=Realm.test.worldContext().sim,d=RealmCosmosCampaign.definition;
         const saved=[...e.batches,...e.dynamic].map(b=>({b,items:b.items,data:b.data,count:b.count}));
         const selected=i=>['line','cross','annulus'].includes(selection)?i.cosmosCampaignTelegraph===true&&i.cosmosCampaignPattern===selection:
          selection==='paired-warning'?i.cosmosCampaignTelegraph===true&&i.cosmosCampaignPart.endsWith('-inlay'):
          d.enemies.some(v=>v.id===selection)?i.cosmosCampaignActor===selection&&!i.cosmosCampaignTelegraph:
          d.witnesses.some(v=>v.id===selection)?i.cosmosCampaignWitness===selection:
          selection==='account'?i.cosmosCampaignPart==='public-mechanical-account':i.cosmosCampaignFixture===selection;
         const signature=()=>JSON.stringify({state:Realm.state,player:sim.state.player,camera:e.camera,view:Array.from(e.vp)}),before=signature();
         const read=()=>{const g=e.gl,a=new Uint8Array(e.mainF.w*e.mainF.h*4);g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);g.readPixels(0,0,e.mainF.w,e.mainF.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;};
         const args=e.__hvcLastRender.slice();e.render(...args);const present=read();let parts=0;
         try{for(const q of saved){q.b.items=q.items.filter(i=>!selected(i));parts+=q.items.length-q.b.items.length;e.updateBatch(q.b);}e.render(...args);const absent=read();
          for(const q of saved){q.b.items=q.items;q.b.data=q.data;e.updateBatch(q.b);q.b.count=q.count;}e.render(...args);const restored=read();let changed=0,delta=0;
          for(let i=0;i<present.length;i+=4){if(Math.max(...[0,1,2].map(k=>Math.abs(present[i+k]-absent[i+k])))>2)changed++;for(let k=0;k<3;k++)delta+=Math.abs(present[i+k]-restored[i+k]);}
          return{parts,changedPixels:changed,restorationRGBDelta:delta,pure:before===signature(),glError:e.gl.getError(),restored:saved.every(q=>q.b.items===q.items&&q.b.data===q.data&&q.b.count===q.count)};
         }finally{for(const q of saved){q.b.items=q.items;q.b.data=q.data;e.updateBatch(q.b);q.b.count=q.count;}}}""", selection)
        self.check(label + ' causal pixels restore exactly', result['parts'] > 0 and result['changedPixels'] > 10 and result['restorationRGBDelta'] == 0 and result['pure'] and result['glError'] == 0 and result['restored'], result)
        self.record['pixel_controls'].append({'selection': selection, 'view': view, 'label': label, **result})
        self.shot(label + '-' + view)

    def warning(self, enemy, kind):
        result = self.ev(r"""p=>{const sim=Realm.test.worldContext().sim;for(let n=0;n<800;n++){
         const e=RealmAdventure.runtime(sim).enemies.find(e=>e.id===p.id);if(!e||sim.state.adventure.hp<=0)return{ok:false,error:'encounter ended'};
         if(e.mode==='windup'&&e.timer>.65&&e.strike?.kind===p.kind)return{ok:true,frame:e.strike,anchored:e.x===p.x&&e.z===p.z,owned:RealmCosmosCampaign.owned(sim,e),stats:{hp:e.maxHP,damage:e.damage}};
         Realm.test.step(.05);window.__hvcCombat?.sample();}return{ok:false,error:'requested actual warning not observed'};}""", {**enemy, 'kind': kind})
        self.check('actual anchored owned ' + kind + ' lock with declared stats', result.get('ok') and result.get('anchored') and result.get('owned') and result.get('stats') == {'hp': enemy['hp'], 'damage': enemy['damage']}, result)
        self.record['warnings'].append(result)
        self.render()
        footprint = self.ev(r"""id=>{const sim=Realm.test.worldContext().sim,e=RealmAdventure.runtime(sim).enemies.find(e=>e.id===id),s=e.strike,N=RealmCosmos;
         let body=0,warnings=0;const errors=[];
         for(const b of __hvcArt.e.dynamic)for(const p of b.items){if(p.cosmosCampaignActor!==id)continue;const g=RealmEngine.geometry(b.kind);
          for(let i=0;i<g.length;i+=6){const v=RealmEngine.M.transform(p.m,Array.from(g.slice(i,i+3))),dx=v[0]-s.x,dz=v[2]-s.z;
           if(!v.every(Number.isFinite)){errors.push('nonfinite');continue;}
           if(!p.cosmosCampaignTelegraph){body++;const t=RealmCosmosCampaign.encounter(e);if(Math.hypot(v[0]-e.x,v[2]-e.z)>t.radius+1e-4)errors.push('actor body');continue;}
           warnings++;if(!N.walkable(v[0],v[2],0))errors.push('unsupported warning');
           const rectangle=(yaw,negative,positive)=>{const x=dx*Math.cos(yaw)-dz*Math.sin(yaw),z=dx*Math.sin(yaw)+dz*Math.cos(yaw);return Math.abs(x)<=s.halfWidth+1e-4&&z>=-negative-1e-4&&z<=positive+1e-4;};
           if(s.kind==='line'&&!rectangle(s.yaw,0,s.length))errors.push('line frame');
           if(s.kind==='cross'&&!s.arms.some(a=>rectangle(s.yaw+a.axis,a.negative,a.positive)))errors.push('cross frame');
           if(s.kind==='annulus'&&(Math.hypot(dx,dz)>s.outerRadius+1e-4||Math.hypot(dx,dz)<s.innerRadius-.12))errors.push('annulus rim');
          }}return{body,warnings,errors,frozen:Object.isFrozen(s)&&(!s.arms||Object.isFrozen(s.arms)&&s.arms.every(Object.isFrozen))};}""", enemy['id'])
        self.check('actual submitted actor and warning vertices fit whole supported locked geometry', footprint['body']>0 and footprint['warnings']>0 and not footprint['errors'] and footprint['frozen'], footprint)
        for view in ('adventure', 'follow'):
            self.pixel_control(enemy['id'], view, enemy['pattern'] + '-body')
            self.pixel_control(kind, view, enemy['pattern'] + '-' + kind + '-warning')
            self.pixel_control('paired-warning', view, enemy['pattern'] + '-' + kind + '-paired-inlay')
        return result['frame']

    def miss(self, enemy, kind):
        # Select a body-qualified local safe point from the actual immutable
        # footprint. Production movement/time creates the miss, never poses.
        frame = self.warning(enemy, kind)
        result = self.ev(r"""id=>{const sim=Realm.test.worldContext().sim,e=RealmAdventure.runtime(sim).enemies.find(e=>e.id===id),N=RealmCosmos,p=sim.state.player;
         const candidates=[];for(let dx=-2;dx<=2;dx+=.25)for(let dz=-2;dz<=2;dz+=.25){const q={x:p.x+dx,z:p.z+dz},n=Math.hypot(dx,dz);
          if(n>.25&&n<=1.25&&N.segment(p,q,.31)&&!RealmCosmosCampaign.strikeContains(e,q))candidates.push({...q,n});}
         candidates.sort((a,b)=>a.n-b.n);return candidates[0]||null;}""", enemy['id'])
        self.check('real ' + kind + ' warning has a reachable short safe response', result is not None)
        before = self.state()['adventure']['hp']
        contact_before = self.ev('id=>RealmAdventure.runtime(Realm.test.worldContext().sim).enemies.find(e=>e.id===id).contactAt??null', enemy['id'])
        self.walk_exact(result['x'], result['z'], 'leave actual ' + kind + ' contact')
        outcome = self.ev(r"""p=>{const sim=Realm.test.worldContext().sim,e=RealmAdventure.runtime(sim).enemies.find(e=>e.id===p.id),locked=e.strike;let n=0;
         while(e.mode==='windup'&&n++<100)Realm.test.step(.05);window.__hvcCombat?.sample();return{same:JSON.stringify(locked)===JSON.stringify(p.frame)&&e.strike===locked,hit:e.contactHit,hp:sim.state.adventure.hp,contactAt:e.contactAt};}""", {'id': enemy['id'], 'frame': frame})
        self.check('actual locked ' + kind + ' misses without contact damage', outcome['same'] and outcome['hit'] is False and outcome['hp'] == before and outcome['contactAt'] is not None and outcome['contactAt'] != contact_before, outcome)
        self.record['misses'].append({'kind': kind, 'frame': frame, 'safe': result, **outcome})

    def fight(self, enemy, *, live_releases=False, probes=False):
        before = self.state()
        self.install_combat_observer(enemy['id'])
        style = self.diag()['adventure']['weapon']['style']
        stand = (3.5 if enemy['pattern'] == 'reclaimer' else 3) if style == 'bow' else 1.1
        guards_before = self.record.get('brace_commands', 0)
        ticks = 0
        try:
            self.walk_exact(enemy['x'], enemy['z'] + stand, 'ordinary ' + style + ' machine range')
            for _ in range(8):
                self.page.keyboard.press('Tab')
                if self.diag()['adventure']['tactics']['target'] == enemy['id']:
                    break
            self.check('native target key owns actual ' + enemy['name'], self.diag()['adventure']['tactics']['target'] == enemy['id'])
            if enemy['pattern'] == 'reclaimer':
                if probes:
                    self.miss(enemy, 'line')
                    self.walk_exact(enemy['x'], enemy['z'] + stand, 'weapon approach after optical miss')
                else:
                    self.warning(enemy, 'line')
            else:
                # At radius3 the original ring threatens blade/bow. A live
                # release shortens only later frames; current frames are kept.
                self.walk_exact(enemy['x'], enemy['z'] + 3, 'read original annulus and cross')
                original_ring = self.warning(enemy, 'annulus')
                if probes:
                    self.walk_exact(enemy['x'], enemy['z'] + 2.2, 'approach the readable quiet inner circle')
                    self.miss(enemy, 'annulus')
                else:
                    self.defend(); self.tick(35)
                self.walk_exact(enemy['x'], enemy['z'] + 3, 'read original primary and transverse cross')
                original_cross = self.warning(enemy, 'cross')
                self.defend(); self.tick(35)
                if live_releases:
                    self.walk_exact(47, -47, 'supported outside west guardian approach')
                    self.action('release-west-feed', exact=True)
                    for x,z in ((54,-48),(61,-48),(61,-39)):
                        self.walk_exact(x,z,'supported outside guardian feed loop')
                    self.action('release-east-feed', exact=True)
                    self.walk_exact(enemy['x'], enemy['z'] + 3, 'read physically released future frames')
                    shortened_ring = self.warning(enemy, 'annulus')
                    self.defend(); self.tick(35)
                    shortened_cross = self.warning(enemy, 'cross')
                    self.check('physical releases measurably change only future warning mechanisms',
                               original_ring['outerRadius'] == 4.6 and shortened_ring['outerRadius'] == 3.2 and
                               len(original_cross['arms']) == 2 and len(shortened_cross['arms']) == 1)
                    self.defend(); self.tick(35)
                if probes:
                    self.walk_exact(enemy['x'], enemy['z'] + 1.1, 'quiet inner circle before directional miss')
                    self.miss(enemy, 'cross')
                self.walk_exact(enemy['x'], enemy['z'] + stand, 'ordinary final weapon approach')
            self.framebuffer_positive_control()
            self.page.keyboard.press('f')
            self.defend(); self.tick(8)
            if enemy['defeatStep'] not in self.state()['cosmosCampaign']['steps']:
                self.page.locator('#skill-auto').click()
            while enemy['defeatStep'] not in self.state()['cosmosCampaign']['steps'] and ticks < 4000:
                self.defend()
                actual = self.tick(6)
                ticks += 6
                self.check('bounded native ordinary weapon combat survives', actual['ok'], actual)
            self.check('actual zero-HP exhaustion records only owned ' + enemy['defeatStep'], ticks < 4000 and enemy['defeatStep'] in self.state()['cosmosCampaign']['steps'])
        finally:
            result = self.ev('()=>{const r=window.__hvcCombat?.finish();delete window.__hvcCombat;return r;}')
            tactics = self.diag()['adventure']['tactics']
            if tactics['auto'] or tactics['target'] is not None:
                # Frozen test time must not wait on the attack button's real
                # cooldown. Escape is the production clear-target control.
                self.page.keyboard.press('Escape')
                self.render()
                cleared = self.diag()['adventure']['tactics']
                self.check('native clear-target ends combat without a cooldown wait',
                           cleared['auto'] is False and cleared['target'] is None)
        self.check('actual blade/projectile callers contribute to exhaustion', bool(result['weaponImpacts']), result)
        if style == 'bow':
            self.check('actual bow arrow travels and collides', result['arrows'] and any(h['source'] == 'production projectile contact' for h in result['weaponImpacts']))
        after = self.state()
        self.check('no independent encounter fee, legacy drop or planted defeat',
                   all(after['adventure'][k] == before['adventure'][k] for k in ('xp', 'coins', 'ore', 'drops', 'defeated')) and after['sandbox']['inventory'] == before['sandbox']['inventory'])
        self.record['combat'].append({**result, 'live_releases': live_releases, 'brace_commands': self.record.get('brace_commands', 0)-guards_before})

    def confirmation(self, choice):
        self.walk_ui('accountability')
        self.workspace()
        before = self.state()
        review = f'[data-rpg="cosmos-campaign-review"][data-id="{choice}"]'
        confirm = f'[data-rpg="cosmos-campaign-confirm"][data-id="{choice}"]'
        self.page.locator(review).click(); self.render()
        self.check('account preview grants nothing', self.state() == before and self.page.locator('.cosmos-campaign-confirm').is_visible())
        self.page.locator('[data-rpg="cosmos-campaign-cancel"]').click(); self.render()
        self.check('account cancel retains undecided record', self.state() == before)
        self.page.locator(review).click(); self.page.locator(confirm).click(); self.render()
        self.check('deliberate current-owner confirmation retains exact local account', self.state()['cosmosCampaign']['choice'] == choice)
        self.close_workspace()

    def claim_fee(self):
        self.workspace()
        before = self.state()
        self.page.locator('[data-rpg="cosmos-campaign-claim"]').click(); self.render()
        paid, fee = self.state(), self.definition['reward']
        inventory = dict(before['sandbox']['inventory'])
        for k, n in fee['materials'].items():
            inventory[k] += n
        self.check('deliberate whole fixed fee pays once without equip/refill', paid['cosmosCampaign']['claimed'] and
                   paid['adventure']['xp']-before['adventure']['xp'] == min(fee['xp'], 9999-before['adventure']['xp']) and
                   all(paid['adventure'][k]-before['adventure'][k] == fee[k] for k in ('coins', 'ore')) and
                   paid['sandbox']['inventory'] == inventory and
                   all(paid['adventure'][k] == before['adventure'][k] for k in ('hp', 'stamina', 'tonics')))
        return before, paid

    def run_variant(self, flag):
        label, choice, supports = VARIANTS[flag]
        source = self.args.sources / label / '00_EARNED_SEED.json'
        self.begin_record(label, choice)
        self.report['variants'][label] = self.record
        self.start(); self.import_character(source)
        self.record['original_native_slot'] = self.original_slot
        self.definition = self.ev('RealmCosmosCampaign.definition')
        initial = self.state()
        self.check('native seed imports genuinely earned comparator and kit', initial['cosmosCampaign'] == FRESH and initial['adventure']['started'] and initial['realmTrails']['records'][PREREQUISITE]['claimed'])
        self.enter(); self.walk_ui('giver'); self.workspace()
        self.page.locator('[data-rpg="cosmos-campaign-accept"]').click(); self.render()
        self.check('native separate acceptance pays nothing', self.state()['cosmosCampaign']['accepted'] and self.state()['sandbox']['inventory'] == initial['sandbox']['inventory'])
        self.restart('accepted'); self.enter()
        self.action('read-local-cost')
        self.witness('cosmos-raven-service-v1')
        for lead, mode in supports:
            if mode == 'ordinary':
                self.action(lead + '-inspect'); self.action(lead + '-fit')
            else:
                self.action('assist-' + lead)
        self.action('test-service-route')
        self.restart('two-distinct-supports'); self.enter()
        companion = dict(initial['adventure']['companion'])
        if companion['bonded'] and companion['mode'] == 'follow':
            # Actual native Stay allows readable mechanism probes; no actor or
            # mode is forced by a test API. Restore the saved choice afterward.
            self.companion_mode('stay')
        self.action('challenge-reclaimer')
        self.fight(self.definition['enemies'][0], probes=flag == 'blade')
        self.restart('actual-reclaimer-settled'); self.enter()
        self.action('isolate-service-feed'); self.action('challenge-guardian')
        self.restart('guardian-ready'); self.enter()
        self.fight(self.definition['enemies'][1], live_releases=True, probes=flag == 'blade')
        if companion['bonded'] and companion['mode'] == 'follow':
            self.companion_mode('follow')
        self.restart('guardian-settled-with-physical-feeds'); self.enter()
        self.action('disable-central-link')
        self.witness('cosmos-avar-senn-v1')
        self.restart('central-disabled'); self.enter()
        self.confirmation(choice)
        self.restart('deliberate-account'); self.enter()
        for lead, _ in supports:
            self.action('configure-' + lead)
        self.action('open-confluence')
        for view in ('adventure', 'follow'):
            self.pixel_control('open-confluence', view, choice + '-independent-apparatus')
            self.pixel_control('account', view, choice + '-persistent-account')
        self.restart('independently-open'); self.enter()
        self.action('verify-open-bearings')
        self.workspace()
        terms = next(c for c in self.definition['choices'] if c['id'] == choice)
        content = self.page.locator('#rpg-content').inner_text()
        self.check('actual authored recognition caller remains visible and unpaid', all(v['name'] + ':' in content and v['text'] in content for v in terms['recognition']) and not self.state()['cosmosCampaign']['claimed'])
        unpaid = self.state()
        self.check('all native work and combat leave the separate fee unpaid', all(unpaid['adventure'][k] == initial['adventure'][k] for k in ('xp', 'coins', 'ore')) and unpaid['sandbox']['inventory'] == initial['sandbox']['inventory'])
        self.restart('verified-unpaid'); self.enter(); self.walk_ui('claim')
        self.ready_probe_world = self.state()
        _, paid = self.claim_fee()
        self.check('all previous owners, gear, sockets and choices remain', ownership(paid) == ownership(initial))
        self.restart('paid-once'); self.enter()
        before = self.state()
        retry = self.ev('()=>Realm.test.cosmosCampaignCommand("claim",{quest:RealmCosmosCampaign.definition.id,expectedRevision:Realm.state.adventure.revision,expectedActive:Realm.test.worldContext().active})')
        self.check('labelled production replay never duplicates the native fee', retry.get('duplicate') and self.state() == before)
        return_point = self.ev('RealmCosmos.POINTS.find(p=>p.kind==="return")')
        self.walk_exact(return_point['x'], return_point['z'], 'ordinary supported return at Three Lamps')
        self.page.locator('#world-home').click(); self.render()
        self.check('normal native return keeps open/account/paid facts', self.diag()['scene'] == 'valley' and self.state()['cosmosCampaign'] == before['cosmosCampaign'])
        self.record['final_world'] = self.state()
        self.record['final_native_bytes'] = self.ev('localStorage.getItem(RealmCharacters.KEY)')
        self.record['final_native_sha256'] = digest(self.record['final_native_bytes'])
        self.original_slot_unchanged('whole earned campaign')
        self.context.close(); self.context = self.page = None
        self.synthetic_probes(label, choice, read_json(source), ('crystal-capacity', 'claim-write-refusal') if flag == 'blade' else ('old-save-migration',) if flag == 'veteran' else ())

    def synthetic_probes(self, earned_label, choice, seed, kinds):
        for kind in kinds:
            world = json.loads(json.dumps(seed if kind == 'old-save-migration' else self.ready_probe_world))
            edits = {'cosmosCampaign': 'absent optional owner'} if kind == 'old-save-migration' else {}
            if kind == 'old-save-migration':
                world.pop('cosmosCampaign')
            elif kind == 'crystal-capacity':
                world['sandbox']['inventory']['crystal'] = 999
                edits = {'sandbox.inventory.crystal': 999}
            label = earned_label + '-SYNTHETIC-' + kind
            source = self.args.output / (label + '-IMPORTED_DERIVATIVE.json')
            write_new(source, world)
            self.begin_record(label, choice)
            self.report['synthetic_profiles'][label] = self.record
            self.record['synthetic_provenance'] = {'source': str(source), 'sha256': sha(source), 'parent': earned_label, 'edits': edits,
                'label': 'Separate derivative native profile; never used as earned progress. No actor, HP or defeat edits.'}
            self.start(); self.import_character(source)
            if kind == 'old-save-migration':
                now = self.state()
                self.check('rich old optional absence adds only empty Cosmos owner', now['cosmosCampaign'] == FRESH and ownership(now) == ownership(world) and now['settings'] == world['settings'] and now['sandbox']['inventory'] == world['sandbox']['inventory'])
                self.restart('SYNTHETIC-old-owner-absent')
            else:
                self.enter(); self.walk_ui('claim'); self.workspace()
                before, raw = self.state(), self.ev('localStorage.getItem(RealmCharacters.KEY)')
                if kind == 'claim-write-refusal':
                    self.ev(r"""()=>{window.__ccRefusal=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===RealmCharacters.KEY)throw Error('Labelled isolated Cosmos claim refusal');return __ccRefusal.call(this,k,v);};}""")
                try:
                    self.page.locator('[data-rpg="cosmos-campaign-claim"]').click(); self.render()
                    self.check('atomic ' + kind + ' leaves complete state and native bytes unchanged', self.state() == before and self.ev('localStorage.getItem(RealmCharacters.KEY)') == raw)
                    self.check('atomic refusal visibly stays unpaid and open', 'Open and verified · unpaid' in self.page.locator('#rpg-content').inner_text() and self.state()['cosmosCampaign']['opened'] and not self.state()['cosmosCampaign']['claimed'])
                finally:
                    if kind == 'claim-write-refusal':
                        self.ev('Storage.prototype.setItem=window.__ccRefusal;delete window.__ccRefusal')
                if kind == 'claim-write-refusal':
                    self.claim_fee()
            self.original_slot_unchanged('isolated synthetic fixture')
            self.record['final_world'] = self.state()
            self.record['final_native_bytes'] = self.ev('localStorage.getItem(RealmCharacters.KEY)')
            self.record['final_native_sha256'] = digest(self.record['final_native_bytes'])
            self.context.close(); self.context = self.page = None


def load_base(root=ROOT):
    # The qualified helper imports Playwright only here, at explicit CLI run.
    spec = importlib.util.spec_from_file_location('firstlight_cosmos_native_helpers', Path(root) / 'tools/heaven_campaign_browser.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.ROOT = Path(root)
    return module


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--sources', required=True, type=Path)
    parser.add_argument('--renderer', choices=('software', 'hardware'), default='software')
    parser.add_argument('--variant', choices=(*VARIANTS, 'all'), default='all')
    args = parser.parse_args(argv)
    root = args.root.resolve()
    flags = tuple(VARIANTS) if args.variant == 'all' else (args.variant,)
    try:
        args.output, args.sources = guard_paths(args.output, args.sources)
        provenance, seed_hashes = read_provenance(args.sources, flags, root)
        html = (root / 'index.html').read_text(encoding='utf-8-sig')
        modules = ('cosmos-campaign-data.js', 'cosmos-campaign.js', 'cosmos-campaign-ui.js', 'cosmos-campaign-art.js',
                   'cosmos.js', 'cosmos-art.js', 'cosmos-ui.js', 'world-foundations.js', 'adventure.js', 'adventure-art.js',
                   'arsenal.js', 'combat.js', 'core.js', 'rpg-ui.js', 'app.js')
        if any((root / 'src' / p).read_text(encoding='utf-8-sig').strip() not in html for p in modules) or sha(root/'index.html') != sha(root/'FIRSTLIGHT_VALLEY.html'):
            raise ValueError('Both identical HTML files must embed every actual Cosmos and combat caller.')
        args.output.mkdir(parents=True, exist_ok=False)
    except (ValueError, OSError, json.JSONDecodeError) as error:
        parser.error(str(error))
    inputs = [*sorted(p for p in (root/'src').iterdir() if p.is_file()), *[root/p for p in JOURNEY_DEPENDENCIES],
              root/'FIRSTLIGHT_VALLEY.html', root/'tests/cosmos_campaign_journey.cjs', root/'tools/heaven_campaign_browser.py',
              root/'tools/browser_support.py', Path(__file__),
              Path(__file__).resolve().parents[1]/'tests/cosmos_campaign_browser.py',
              Path(__file__).resolve().parents[1]/'tests/test_cosmos_campaign_browser_storage.py']
    hashes = {str(p): sha(p) for p in inputs}
    report = {'method': __doc__, 'status': 'running', 'renderer_requested': args.renderer, 'html_sha256': sha(root/'index.html'),
              'source_hashes': hashes, 'seed_input_hashes': seed_hashes, 'seed_provenance': provenance,
              'checks': [], 'variants': {}, 'synthetic_profiles': {}, 'browser_errors': [], 'console_errors': [], 'errors': [],
              'accelerated_ticks': True, 'tick_seconds': .05, 'accelerated_scope': 'production moveTo and time only',
              'normal_time_footage': False, 'human_pacing': False, 'performance_claim': False, 'native_persistence': True,
              'profile_limit': 6, 'videos_recorded': 0, 'earned_actor_position_edits': 0, 'earned_health_grants': 0,
              'earned_inventory_grants': 0, 'earned_manual_damage': 0, 'earned_forced_modes': 0, 'earned_forced_cycles': 0, 'earned_planted_facts': 0}
    harness = None
    try:
        base = load_base(root)
        browser = type('CosmosCampaignBrowser', (CosmosMixin, base.CampaignBrowser), {})
        harness = browser(args, report)
        with base.sync_playwright() as pw:
            harness.pw = pw
            try:
                for flag in flags:
                    harness.run_variant(flag)
            except Exception:
                if harness.page is not None:
                    # Missing Realm must not prevent independent browser-safe
                    # evidence, or hide the original journey exception.
                    if 'navigation_failure' not in harness.record:
                        harness.record['failure_page'] = base.capture_navigation_failure(
                            harness.page, harness.url, report['html_sha256'],
                            args.output / f'{harness.variant}-FAILURE.png')
                    if 'navigation_failure' in harness.record:
                        harness.record['failure_realm_capture'] = 'Unavailable after navigation failure; no new renderer evaluation.'
                    else:
                        for name, capture in (('failure_world', harness.state),
                                              ('failure_diagnostics', harness.diag)):
                            try:
                                harness.record[name] = capture()
                            except Exception:
                                report['errors'].append(name + ' capture failed: ' + traceback.format_exc())
                raise
            finally:
                if harness.context is not None:
                    harness.context.close(); harness.context = harness.page = None
        harness.variant = None
        harness.check('all source, checkpoints and provenance bytes remain frozen', source_epoch(root) == next(iter(provenance.values()))['journey']['sourceHashes'] and all(sha(p) == h for p,h in {**hashes, **seed_hashes}.items()))
        harness.check('no browser or console error is hidden', not report['browser_errors'] and not report['console_errors'])
        report['status'] = 'passed'
    except Exception:
        report['status'] = 'failed'; report['errors'].append(traceback.format_exc())
    finally:
        if harness:
            try:
                harness.stop()
            except Exception:
                report['status'] = 'failed'; report['errors'].append(traceback.format_exc())
        report['final_source_hashes'] = {p: sha(p) if Path(p).is_file() else None for p in hashes}
        report['final_seed_input_hashes'] = {p: sha(p) if Path(p).is_file() else None for p in seed_hashes}
        report['source_drift'] = report['final_source_hashes'] != hashes or report['final_seed_input_hashes'] != seed_hashes
        try:
            report['final_source_epoch'] = source_epoch(root)
            report['source_drift'] |= report['final_source_epoch'] != next(iter(provenance.values()))['journey']['sourceHashes']
        except OSError:
            report['source_drift'] = True
            report['errors'].append('Final source membership could not be read: '+traceback.format_exc())
        if report['source_drift']:
            report['status'] = 'failed'
        report['profile_disposal_candidates'] = [{'path': str(args.output/(label+'-isolated-profile')), 'reason': 'Successful isolated profile only; root owns cleanup after checking exact cold-start/native-byte/final-world receipts.'}
            for label, record in {**report['variants'], **report['synthetic_profiles']}.items() if report['status'] == 'passed' and record.get('final_world') and record.get('final_native_bytes')]
        write_new(args.output/'REPORT.json', report)
    print(f'Cosmos native: {sum(c["passed"] for c in report["checks"])}/{len(report["checks"])}; {report["status"]}', flush=True)
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
