#!/usr/bin/env python3
"""Command-earned Atlantis qualification with native UI and whole-Chromium restarts.

Only movement and production time adapters are accelerated in 50 ms ticks.
Native import/consent/pressure/target-key combat/claims/storage and actual WebGL
pixels have real callers. No earned actor poses, HP, inventory or facts are
injected. Separate, labelled derivative profiles cover crystal capacity, refused
writes and old-save migration. This is not normal-time footage, human pacing,
device performance or public release evidence. Importing this module never
imports Playwright or starts a server/browser; the CLI performs those actions.
"""
from pathlib import Path, PureWindowsPath
import argparse
import hashlib
import importlib.util
import json
import math
import os
import traceback

ROOT = Path(__file__).resolve().parents[1]
VARIANTS = {'blade': ('fresh-blade', 'upper', 'publish'),
            'bow': ('fresh-bow', 'lower', 'limited'),
            'veteran': ('returning-strongest', 'upper', 'license')}
INJECTIONS = ('positionEdits', 'inventoryGrants', 'manualDamage', 'forcedModes', 'plantedDefeats')
CHECKPOINTS = ('00_EARNED_SEED', '01_ACCEPTED', '02_RETAINED_APPROACH',
               'CHECKPOINT_INLET', 'CHECKPOINT_EQUALIZER', '07_ACTUAL_BEARING_EXPOSED',
               '08_INDEPENDENT_SAFETY', '09_SELECTED_DISPOSITION', '10_VERIFIED_UNPAID',
               '11_PAID_ONCE', 'FINAL_WORLD')
PREREQUISITE = 'atlantis-bellglass-chart-v1'
CAMPAIGN = 'atlantis-harbour-beneath-v1'
VETERAN_FIXTURE = 'docs/evidence/world-production-2026-10-03/captures/returning-fit-final-01/FINAL_WORLD.json'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def digest(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest() if text is not None else None


def on_d(path):
    value = PureWindowsPath(str(path))
    return value.is_absolute() and value.drive.upper() == 'D:'


def bounded(path, *, windows=None):
    """Resolve existing ancestors/junctions before enforcing the heavy D boundary."""
    value = Path(path).resolve()
    if value == Path(value.anchor):
        raise ValueError('A drive/filesystem root is not a campaign evidence directory.')
    if (os.name == 'nt' if windows is None else windows) and not on_d(value):
        raise ValueError('Native evidence, profiles and earned sources must resolve to D:.')
    return value


def within(path, parent):
    return path == parent or parent in path.parents


def guard_paths(output, sources, *, windows=None):
    output, sources = bounded(output, windows=windows), bounded(sources, windows=windows)
    if output.exists():
        raise FileExistsError('Use a new output directory; prior evidence is never overwritten.')
    if not sources.is_dir():
        raise ValueError('Complete earned source folders are required.')
    if within(output, sources) or within(sources, output):
        raise ValueError('Native output and frozen earned sources must be separate trees.')
    return output, sources


def reserve_output(output):
    output.mkdir(parents=True, exist_ok=False)


def profile_path(output, family, *, windows=None):
    allowed = {v[0] for v in VARIANTS.values()}
    allowed |= {v + '-SYNTHETIC-' + p for v in allowed
                for p in ('crystal-capacity', 'claim-write-refusal', 'old-save-migration')}
    if family not in allowed:
        raise ValueError('Unknown native profile family.')
    root = bounded(output, windows=windows)
    profile = bounded(root / (family + '-isolated-profile'), windows=windows)
    if not within(profile, root) or profile.exists():
        raise FileExistsError('Profile must be a new owned child of this evidence root.')
    return profile


def read_json(path):
    value = json.loads(Path(path).read_text(encoding='utf-8-sig'))
    if not isinstance(value, dict):
        raise ValueError('Expected an object receipt: ' + str(path))
    return value


def source_epoch(root=ROOT):
    paths = [*sorted(p for p in (root / 'src').iterdir() if p.is_file()),
             root / 'build.py', root / 'index.html', root / 'tests/atlantis_campaign_journey.cjs',
             root / 'tests/realm_trails_journey.cjs']
    return {str(p.relative_to(root)).replace('\\', '/'): sha(p) for p in paths}


def read_provenance(sources, flags, root=ROOT):
    """Refuse seed-only, stale epochs, missing counters and incomplete journeys."""
    sources = sources.resolve()
    result, files = {}, []
    expected_epoch = source_epoch(root)
    for flag in flags:
        label, approach, choice = VARIANTS[flag]
        folder = (sources / label).resolve()
        if not within(folder, sources) or folder == sources:
            raise ValueError('Earned family escapes its frozen source root.')
        paths = [folder / (name + '.json') for name in
                 (*CHECKPOINTS, 'SEED_PROVENANCE', 'ATLANTIS_CAMPAIGN_JOURNEY_REPORT')]
        if any(not p.is_file() or not within(p.resolve(), folder) for p in paths):
            raise ValueError('Missing or escaped complete journey receipt in ' + str(folder))
        seed, proof, journey = read_json(paths[0]), read_json(paths[-2]), read_json(paths[-1])
        if proof.get('variant') != label or journey.get('variant') != label or proof.get('seedSha256') != sha(paths[0]):
            raise ValueError('Earned seed identity/hash is invalid: ' + label)
        if flag == 'veteran':
            fixture = root / VETERAN_FIXTURE
            if (proof.get('fixture') != journey.get('fixture') or not proof.get('fixture') or
                    proof.get('fixtureHash') != journey.get('fixtureHash') or
                    not fixture.is_file() or proof.get('fixtureHash') != sha(fixture)):
                raise ValueError('The returning fixture must match its original canonical byte receipt.')
            files.append(fixture)
        if proof.get('prerequisite') != PREREQUISITE or journey.get('status') != 'passed' or journey.get('sourceDrift') is not False:
            raise ValueError('A complete passed, unchanged Bellglass/Atlantis journey is required: ' + label)
        if any(type(receipt.get(k)) is not int or receipt[k] != 0 for receipt in (proof, journey) for k in INJECTIONS):
            raise ValueError('Every no-injection counter must be an explicit integer zero: ' + label)
        if not (proof.get('sourceHashes') == journey.get('sourceHashes') == journey.get('finalHashes') == expected_epoch):
            raise ValueError('Seed and full journey must match the exact current source epoch: ' + label)
        if journey.get('approach') != approach or journey.get('choice') != choice or journey.get('canonicalPreservation') is not True:
            raise ValueError('Full journey branch/preservation evidence is incomplete: ' + label)
        if not set(CHECKPOINTS).issubset(journey.get('checkpoints', [])):
            raise ValueError('Full earned checkpoints are missing: ' + label)
        checkpoint_hashes = journey.get('checkpointHashes')
        if not isinstance(checkpoint_hashes, dict) or not set(CHECKPOINTS).issubset(checkpoint_hashes):
            raise ValueError('Every required earned checkpoint needs its linked byte hash: ' + label)
        for name, expected in checkpoint_hashes.items():
            if not isinstance(name, str) or not name or any(c in name for c in '/\\:') or name in ('.', '..'):
                raise ValueError('Invalid checkpoint identity in ' + label)
            snapshot = folder / (name + '.json')
            if not snapshot.is_file() or not within(snapshot.resolve(), folder) or sha(snapshot) != expected:
                raise ValueError('Earned checkpoint bytes do not match their full-report link: ' + name)
        campaign = seed.get('atlantisCampaign', {})
        if (not seed.get('adventure', {}).get('started') or
                seed.get('realmTrails', {}).get('records', {}).get(PREREQUISITE, {}).get('claimed') is not True or
                campaign != {'version': 1, 'accepted': False, 'steps': [], 'approach': None, 'choice': None, 'claimed': False}):
            raise ValueError('Seed must contain the earned kit/chart and an unaccepted continuation: ' + label)
        final = read_json(folder / 'FINAL_WORLD.json')
        if final.get('atlantisCampaign', {}).get('claimed') is not True or final['atlantisCampaign'].get('choice') != choice:
            raise ValueError('Complete paid final world is missing: ' + label)
        combat = journey.get('combat', {})
        if not combat.get('weaponImpacts') or not combat.get('impacts') or not journey.get('swims'):
            raise ValueError('Actual swimming and attributed weapon evidence are required: ' + label)
        if flag == 'bow' and (combat.get('style') != 'bow' or combat.get('arrows') is not True or
                             not any(v.get('caller') == 'production projectile impact' for v in combat['weaponImpacts'])):
            raise ValueError('Full bow journey needs actual projectile contact evidence.')
        result[label] = {'proof': proof, 'journey': journey, 'seed_sha256': sha(paths[0])}
        # Freeze every source JSON, including additional partial-pressure receipts.
        for p in sorted(folder.glob('*.json')):
            if not within(p.resolve(), folder):
                raise ValueError('An earned input escapes its family folder.')
            files.append(p)
    return result, {str(p): sha(p) for p in files}


def ownership(world):
    """Preserve prior owners; ordinary resource regrowth is elapsed-time work."""
    a = world['adventure']
    return {'adventure': {k: v for k, v in a.items() if k not in
            ('elapsed', 'hp', 'stamina', 'tonics', 'revision', 'xp', 'coins', 'ore', 'receipts')},
            'world': {k: world[k] for k in ('journeys', 'realmTrails', 'earthExpedition', 'hellCampaign',
            'heavenCampaign', 'bridgeCommunity', 'localLife', 'homeHistory', 'notes', 'score',
            'scoreRevision', 'retreat', 'visitor', 'flowers', 'seed', 'version', 'visited')},
            'sandbox': {k: world['sandbox'][k] for k in
            ('placed', 'nextId', 'stats', 'milestones', 'bridge', 'recentCommands')}}


def write_new(path, value):
    with Path(path).open('x', encoding='utf-8') as handle:
        json.dump(value, handle, indent=2, ensure_ascii=False)
        handle.write('\n')


class AtlantisMixin:
    # Inherit qualified loopback/start/import/storage-observer/render helpers
    # only at CLI runtime. Their __hvc namespace is pass-through instrumentation.
    def workspace(self, tab='atlantis-campaign'):
        self.close_workspace()
        self.page.keyboard.press('j')
        if tab == 'atlantis-campaign':
            self.page.locator('#rpg-content [data-rpg="atlantis-campaign-open"]').first.click()
        else:
            self.page.locator(f'#rpg-tabs [data-rpg="open"][data-id="{tab}"]').click()
        self.render()

    def begin_record(self, label, choice, approach=None):
        self.variant = label
        self.record = {'choice': choice, 'approach': approach, 'navigation': [], 'native_write_receipts': [],
                       'restarts': [], 'screenshots': [], 'walks': [], 'swims': [], 'pixel_controls': [],
                       'actor_frames': [], 'combat': [], 'intake_probes': []}
        paths = self.report.setdefault('profile_paths', [])
        self.check('native cohort stays within six owned isolated profiles', len(paths) < 6)
        self.profile = profile_path(self.args.output, label)
        self.profile.mkdir(exist_ok=False)
        paths.append(str(self.profile))
        self.last_native_write = self.original_slot = None

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
        if self.page.locator('[data-rpg="world-list"]').count():
            self.page.locator('[data-rpg="world-list"]').click()
        self.page.locator('[data-rpg="world-select"][data-id="atlantis"]').click()
        self.page.locator('[data-rpg="world-preview"]').click()
        self.check('native travel visibly confirms its saved home checkpoint', self.page.locator('[data-rpg="world-confirm"]').is_visible())
        self.page.locator('[data-rpg="world-confirm"]').click()
        self.render()
        self.check('native travel reaches the actual bounded Atlantis room', self.diag()['scene'] == 'world-atlantis')
        self.check('resolved bearing never recreates a live Custodian on reentry', self.ev(r"""()=>{const sim=Realm.test.worldContext().sim,d=RealmAtlantisCampaign.definition;
         return !sim.state.atlantisCampaign.steps.includes(d.enemy.defeatStep)||!RealmAdventure.runtime(sim).enemies.some(e=>e.id===d.enemy.id);}"""))

    def restart(self, label):
        self.close_workspace()
        result = self.ev('Realm.test.save()')
        self.check(label + ' uses the production native save', result.get('ok'), result)
        before, raw = self.state(), self.ev('localStorage.getItem(RealmCharacters.KEY)')
        stored = self.native_world(raw)
        self.check(label + ' stores the complete actual owner and belongings', stored == before)
        self.original_slot_unchanged(label)
        with self.page.expect_event('close'):
            self.page.close(run_before_unload=True)
        self.context.close()
        self.context = self.page = None
        expected_raw = self.last_native_write or raw
        self.check(label + ' last observed successful write is the owned active library', json.loads(expected_raw)['active'] == self.active)
        self.start()
        startup, after = self.ev('window.__hvcStartup'), self.state()
        self.check(label + ' whole-Chromium cold load preserves exact native bytes', startup == expected_raw,
                   {'expected_sha256': digest(expected_raw), 'startup_sha256': digest(startup)})
        self.check(label + ' loads native history without another import and resets only scene/depth',
                   self.diag()['scene'] == 'valley' and self.diag()['characters']['active'] == self.active
                   and after['atlantisCampaign'] == before['atlantisCampaign'] and ownership(after) == ownership(before)
                   and self.native_world(startup) == stored and after['sandbox']['inventory'] == before['sandbox']['inventory']
                   and all(after['adventure'][k] == before['adventure'][k] for k in ('xp', 'coins', 'ore')))
        self.record['restarts'].append({'label': label, 'startup_sha256': digest(startup),
                                       'startup_native_bytes': startup, 'campaign': after['atlantisCampaign']})
        self.original_slot_unchanged(label + ' cold load')

    def walk_ui(self, identifier):
        self.workspace()
        target = self.definition['giver'] if identifier in ('giver', 'claim') else next(s for s in self.definition['steps'] if s['id'] == identifier)
        self.check('native Walk is never used as a submerged transfer', target.get('medium', 'dry') == 'dry' and not self.diag()['world']['dive'])
        control = self.page.locator(f'[data-rpg="atlantis-campaign-walk"][data-id="{identifier}"]')
        if control.count():
            control.first.click()
            self.settle_walk(target, target['name'])
        else:
            self.check('actual dry location already reaches ' + identifier, self.ev('p=>RealmAtlantisCampaign.at(Realm.test.worldContext().sim,p)', target))
            self.close_workspace()

    def action(self, identifier, pressure=False):
        target = next(s for s in self.definition['steps'] if s['id'] == identifier)
        if target['medium'] == 'dry':
            self.walk_ui(identifier)
        self.workspace()
        prefix = 'pressure' if pressure else 'step'
        self.page.locator(f'[data-rpg="atlantis-campaign-{prefix}"][data-id="{identifier}"]').click()
        self.render()
        self.check('actual visible physical action records ' + identifier, identifier in self.state()['atlantisCampaign']['steps'])
        self.close_workspace()

    def confirmation(self, value, approach=False):
        self.walk_ui('choose-approach' if approach else 'disposition')
        self.workspace()
        before = self.state()
        review, confirm = ('review-approach', 'confirm-approach') if approach else ('review', 'confirm')
        self.page.locator(f'[data-rpg="atlantis-campaign-{review}"][data-id="{value}"]').click()
        self.render()
        self.check('first-stage native preview grants no approach/disposition', self.state() == before and self.page.locator('.atlantis-campaign-confirm').is_visible())
        self.page.locator('[data-rpg="atlantis-campaign-cancel"]').click()
        self.render()
        self.check('native cancel leaves the lasting record undecided', self.state() == before and not self.page.locator('.atlantis-campaign-confirm').count())
        self.page.locator(f'[data-rpg="atlantis-campaign-{review}"][data-id="{value}"]').click()
        self.page.locator(f'[data-rpg="atlantis-campaign-{confirm}"][data-id="{value}"]').click()
        self.render()
        self.check('explicit current-owner second-stage confirmation records ' + value, self.state()['atlantisCampaign']['approach' if approach else 'choice'] == value)
        self.close_workspace()

    def dive(self):
        entry = self.ev('RealmWorldFoundations.definition("atlantis").points.find(p=>p.id==="tide-steps")')
        self.walk_exact(entry['x'], entry['z'], 'actual dry gallery entry')
        self.workspace()
        self.page.locator('[data-rpg="world-dive"]').click()
        self.render()
        self.check('visible existing gallery entry creates real visitor depth', self.diag()['world']['dive'] is not None)

    def swim(self, target):
        self.close_workspace()
        result = self.ev(r"""target=>{const sim=Realm.test.worldContext().sim,W=RealmWorldFoundations,d=W.definition(sim.room).dive;let frames=0;
         if(!sim.worldDive)return{ok:false,error:'not in the actual gallery'};
         for(;frames<4000;frames++){const p=sim.state.player,y=W.playerHeight(sim),dx=target[0]-p.x,dz=target[2]-p.z,dy=target[1]-y,n=Math.hypot(dx,dz);
          if(n<.16&&Math.abs(dy)<.08)break;
          Realm.test.worldSwim(n>.08?dx:0,n>.08?dz:0,dy/.13,.05);Realm.test.step(.05);
          if(!W.swimClear(d,p.x,W.playerHeight(sim),p.z)||sim.state.adventure.hp<=0)return{ok:false,error:'body support or survival failed',frames};
         }Realm.test.render();return{ok:frames<4000,frames,target,actual:{...sim.state.player,y:W.playerHeight(sim)},status:Realm.test.worldDiveStatus(),enemies:RealmAdventure.runtime(sim).enemies.length};}""", target)
        self.check('accelerated production swimming reaches the actual depth route ' + str(target), result.get('ok') and result['enemies'] == 0, result)
        self.record['swims'].append(result)

    def route(self, points):
        for point in points:
            self.swim(point)

    def flow_probe(self):
        self.swim([8, -1.05, -25])
        before = self.diag()
        self.tick(10)
        after = self.diag()
        self.check('actual accepted shallow current shifts only supported horizontal position',
                   after['adventure']['player']['z'] < before['adventure']['player']['z'] - .3
                   and after['world']['dive']['y'] == before['world']['dive']['y']
                   and after['adventure']['player']['x'] == before['adventure']['player']['x'])
        self.swim([8, -2.55, -28])
        quiet = self.diag()
        quiet_hp = self.state()['adventure']['hp']
        self.tick(10)
        self.check('actual lower band remains quiet without air timers or underwater combat',
                   self.diag()['adventure']['player'] == quiet['adventure']['player']
                   and self.diag()['world']['dive']['y'] == quiet['world']['dive']['y']
                   and not self.diag()['adventure']['enemies'] and self.state()['adventure']['hp'] == quiet_hp)

    def pixel_control(self, selection, view, label):
        self.close_workspace()
        self.page.locator(f'#rpg-hud [data-rpg="camera"][data-id="{view}"]').click()
        self.page.keyboard.press('r')
        self.render()
        self.check(label + ' uses the actual ' + view + ' view', self.diag()['camera']['projection'] == ('perspective' if view == 'adventure' else 'orthographic'))
        result = self.ev(r"""selection=>{const e=__hvcArt.e,sim=Realm.test.worldContext().sim,d=RealmAtlantisCampaign.definition;
         const saved=[...e.batches,...e.dynamic].map(b=>({b,items:b.items,data:b.data,count:b.count}));
         const selected=i=>selection==='sweep'||selection==='intake'?i.atlantisCampaignTelegraph===true&&i.atlantisCampaignPattern===selection:
          selection==='actor'?i.atlantisCampaignActor===d.enemy.id&&!i.atlantisCampaignTelegraph:
          selection==='paired-warning'?i.atlantisCampaignTelegraph===true&&i.atlantisCampaignPart.endsWith('-inlay'):
          selection==='ilyra'||selection==='damar'?i.atlantisCampaignWitness===d.witnesses[selection==='ilyra'?0:1].id:
          selection==='publish'?i.atlantisCampaignPart==='paired-checked-outlet':selection==='limited'?i.atlantisCampaignPart==='reviewed-custody-hood':
          selection==='license'?i.atlantisCampaignPart==='personal-permit-seal':selection==='cover'?i.worldSolidId==='custodian-service-bollard'&&i.cameraSolid===true:i.atlantisCampaignFixture===selection;
         const signature=()=>JSON.stringify({state:Realm.state,player:sim.state.player,camera:e.camera,view:Array.from(e.vp)}),before=signature();
         const read=()=>{const g=e.gl,a=new Uint8Array(e.mainF.w*e.mainF.h*4);g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);g.readPixels(0,0,e.mainF.w,e.mainF.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;};
         const args=e.__hvcLastRender.slice();e.render(...args);const present=read();let parts=0;
         try{for(const q of saved){q.b.items=q.items.filter(i=>!selected(i));parts+=q.items.length-q.b.items.length;e.updateBatch(q.b);}e.render(...args);const absent=read();
          for(const q of saved){q.b.items=q.items;q.b.data=q.data;e.updateBatch(q.b);q.b.count=q.count;}e.render(...args);const restored=read();let changed=0,delta=0;
          for(let i=0;i<present.length;i+=4){if(Math.max(...[0,1,2].map(k=>Math.abs(present[i+k]-absent[i+k])))>2)changed++;for(let k=0;k<3;k++)delta+=Math.abs(present[i+k]-restored[i+k]);}
          return{parts,changedPixels:changed,restorationRGBDelta:delta,pure:before===signature(),glError:e.gl.getError(),restored:saved.every(q=>q.b.items===q.items&&q.b.data===q.data&&q.b.count===q.count)};
         }finally{for(const q of saved){q.b.items=q.items;q.b.data=q.data;e.updateBatch(q.b);q.b.count=q.count;}}}""", selection)
        self.check(label + ' has causal actual framebuffer pixels and exact restoration', result['parts'] > 0 and result['changedPixels'] > 10
                   and result['restorationRGBDelta'] == 0 and result['pure'] and result['glError'] == 0 and result['restored'], result)
        self.record['pixel_controls'].append({'selection': selection, 'view': view, 'label': label, **result})
        self.shot(label + '-' + view)

    def until_warning(self, kind):
        result = self.ev(r"""kind=>{const sim=Realm.test.worldContext().sim,id=RealmAtlantisCampaign.definition.enemy.id;
         for(let i=0;i<800;i++){const e=RealmAdventure.runtime(sim).enemies.find(e=>e.id===id);if(!e||e.hp<=0||sim.state.adventure.hp<=0)return{ok:false,error:'actual live encounter ended before requested warning'};
          if(e.mode==='windup'&&e.timer>.75&&e.strike?.kind===kind&&(kind!=='intake'||e.strike.length>0))return{ok:true,enemy:{...e,path:undefined},elapsed:sim.state.adventure.elapsed};
          Realm.test.step(.05);window.__hvcCombat?.sample();}return{ok:false,error:'no actual desired locked warning'};}""", kind)
        self.check('actual AI locks ' + kind + ' with its declared normal stats', result.get('ok'), result)
        self.check('fixed Custodian stats remain 128 health and 10 damage', result['enemy']['maxHP'] == 128 and result['enemy']['damage'] == 10)
        self.render()
        return result

    def actor_frame(self):
        result = self.ev(r"""()=>{const sim=Realm.test.worldContext().sim,d=RealmAtlantisCampaign.definition,e=RealmAdventure.runtime(sim).enemies.find(e=>e.id===d.enemy.id),s=e.strike,errors=[];let body=0,warnings=0;
         for(const b of __hvcArt.e.dynamic)for(const p of b.items){if(p.atlantisCampaignActor!==e.id)continue;const g=RealmEngine.geometry(b.kind);
          for(let i=0;i<g.length;i+=6){const v=RealmEngine.M.transform(p.m,Array.from(g.slice(i,i+3)));if(!v.every(Number.isFinite)){errors.push('nonfinite');continue;}
           if(!p.atlantisCampaignTelegraph){body++;if(Math.hypot(v[0]-e.x,v[2]-e.z)>d.enemy.radius+1e-4)errors.push('body radius');}
           else{warnings++;const x=(v[0]-s.x)*Math.cos(s.yaw)-(v[2]-s.z)*Math.sin(s.yaw),z=(v[0]-s.x)*Math.sin(s.yaw)+(v[2]-s.z)*Math.cos(s.yaw);
            if(s.kind==='intake'&&(Math.abs(x)>s.halfWidth+1e-4||z< -1e-4||z>s.length+1e-4))errors.push('intake frame');
            if(s.kind==='sweep'&&(Math.hypot(x,z)>s.radius+1e-4||Math.abs(Math.atan2(x,z))>s.halfAngle+1e-4))errors.push('sweep frame');
            if(!RealmWorldFoundations.land(sim.room,v[0],v[2],0))errors.push('warning support');}
          }}return{body,warnings,strike:s,errors,anchored:e.x===d.enemy.x&&e.z===d.enemy.z};}""")
        self.check('integrated actor and paired warning vertices fit the actual anchored locked frame', result['body'] > 0 and result['warnings'] > 0 and not result['errors'] and result['anchored'], result)
        self.record['actor_frames'].append(result)

    def finish_phase(self):
        result = self.ev(r"""()=>{const sim=Realm.test.worldContext().sim,e=RealmAdventure.runtime(sim).enemies.find(e=>e.id===RealmAtlantisCampaign.definition.enemy.id),frame=e.strike,before={...sim.state.player},hp=sim.state.adventure.hp;
         let frames=0;while(['windup','intake'].includes(e.mode)&&frames++<100){Realm.test.step(.05);window.__hvcCombat?.sample();if(sim.state.adventure.hp<=0)return{ok:false,error:'traveller died'};if(e.strike!==frame)return{ok:false,error:'frame changed during contact'};}
         Realm.test.render();return{ok:frames<100,frames,before,after:{...sim.state.player},hpBefore:hp,hpAfter:sim.state.adventure.hp,hit:e.contactHit,frame:e.strike,pullDistance:RealmAtlantisCampaign.runtime(sim).pullDistance};}""")
        self.check('real windup/contact/recovery keeps one locked frame and live supported traveller', result.get('ok'), result)
        return result

    def intake_probes(self):
        d = self.definition['enemy']
        self.walk_exact(d['x'], d['z'] + 4, 'actual intake distance four')
        self.until_warning('intake')
        for view in ('adventure', 'follow'):
            self.pixel_control('intake', view, 'actual-intake-warning')
            self.pixel_control('paired-warning', view, 'actual-intake-paired-inlay')
        self.actor_frame()
        hit = self.finish_phase()
        shift = math.hypot(hit['after']['x'] - hit['before']['x'], hit['after']['z'] - hit['before']['z'])
        self.check('actual intake physically pulls the live body and makes one ordinary contact', shift > .3 and hit['hit'] and hit['hpAfter'] < hit['hpBefore'], hit)
        self.record['intake_probes'].append({'kind': 'actual-pull', **hit})
        self.walk_exact(d['x'], d['z'] + 4, 'second actual intake aim')
        self.until_warning('intake')
        self.walk_exact(d['x'] + 2, d['z'] + 4, 'supported sidestep outside the locked lane')
        miss = self.finish_phase()
        self.check('supported movement outside the immutable lane avoids both pull and damage', not miss['hit'] and miss['hpAfter'] == miss['hpBefore'] and miss['after'] == miss['before'], miss)
        self.record['intake_probes'].append({'kind': 'actual-miss', **miss})
        candidate = self.ev(r"""()=>{const sim=Realm.test.worldContext().sim,d=RealmAtlantisCampaign.definition.enemy,W=RealmWorldFoundations,
         q={x:13.4,z:-44.1},s=W.definition(sim.room).solids.find(s=>s.id==='custodian-service-bollard');
         return s&&W.walkable(sim.room,q.x,q.z,.31)&&W.segment(sim.room,d,q,.04)?{...q,solid:s.id,geometry:{x:s.x,z:s.z,w:s.w,d:s.d,h:s.h}}:null;}""")
        self.check('actual anchored intake has the supported centerline-clear municipal cover lane', candidate is not None, candidate)
        self.walk_exact(candidate['x'], candidate['z'], 'actual centerline-clear solid-cover lane')
        warned = self.until_warning('intake')
        self.check('actual opaque cover clips the whole locked width before the reachable target',
                   3.5 < warned['enemy']['strike']['length'] < 4.5
                   and math.hypot(candidate['x'] - warned['enemy']['x'], candidate['z'] - warned['enemy']['z']) > warned['enemy']['strike']['length'] + .24,
                   {'candidate': candidate, 'strike': warned['enemy']['strike']})
        for view in ('adventure', 'follow'):
            self.pixel_control('cover', view, 'actual-collision-owned-service-bollard')
        clipped = self.finish_phase()
        self.check('the real solid-clipped lane grants no through-cover pull or contact', not clipped['hit'] and clipped['hpAfter'] == clipped['hpBefore'] and clipped['after'] == clipped['before'], clipped)
        self.record['intake_probes'].append({'kind': 'actual-solid-clip', 'candidate': candidate, **clipped})

    def fight(self, probes=False):
        enemy = self.definition['enemy']
        self.close_workspace()
        before = self.state()
        self.install_combat_observer(enemy['id'])
        style = self.diag()['adventure']['weapon']['style']
        frames = guards = 0
        try:
            self.walk_exact(enemy['x'], enemy['z'] + (4 if style == 'bow' else 1.1), 'ordinary owned weapon range')
            for _ in range(8):
                self.page.keyboard.press('Tab')
                if self.diag()['adventure']['tactics']['target'] == enemy['id']:
                    break
            self.check('native target key selects the real Custodian', self.diag()['adventure']['tactics']['target'] == enemy['id'])
            self.until_warning('intake' if style == 'bow' else 'sweep')
            self.actor_frame()
            for view in ('adventure', 'follow'):
                self.pixel_control('actor', view, 'actual-municipal-custodian')
                self.pixel_control('intake' if style == 'bow' else 'sweep', view, 'actual-' + ('intake' if style == 'bow' else 'sweep') + '-locked-warning')
                self.pixel_control('paired-warning', view, 'actual-paired-warning-inlay')
            self.framebuffer_positive_control()
            if probes:
                self.finish_phase()
                self.intake_probes()
                self.walk_exact(enemy['x'], enemy['z'] + 1.1, 'blade approach after actual intake probes')
            self.page.keyboard.press('f')
            result = self.tick(8)
            self.check('native owned weapon contact uses real production time and survival', result['ok'], result)
            if enemy['defeatStep'] not in self.state()['atlantisCampaign']['steps']:
                self.page.locator('#skill-auto').click()
            while enemy['defeatStep'] not in self.state()['atlantisCampaign']['steps'] and frames < 4000:
                diag = self.diag()['adventure']
                unit = next((e for e in diag['enemies'] if e['id'] == enemy['id']), None)
                now, a = self.state()['adventure']['elapsed'], self.state()['adventure']
                if unit and unit['mode'] == 'windup' and a['stamina'] >= 20 and now >= diag['tactics']['cooldowns']['guard']:
                    self.page.locator('#skill-guard').click()
                    guards += 1
                if a['hp'] < 45 and a['tonics'] and now >= self.ev('RealmAdventure.runtime(Realm.test.worldContext().sim).cooldowns.heal'):
                    self.page.locator('#skill-heal').click()
                actual = self.tick(6)
                frames += 6
                self.check('bounded actual combat remains alive', actual['ok'], actual)
            self.check('real combat exhausts only the authored bearing', frames < 4000 and enemy['defeatStep'] in self.state()['atlantisCampaign']['steps'])
        finally:
            result = self.ev('()=>{const r=window.__hvcCombat?.finish();delete window.__hvcCombat;return r;}')
            if self.diag()['adventure']['tactics']['auto']:
                self.page.locator('#skill-auto').click()
        self.check('real weapon callers contributed to exhaustion', bool(result['weaponImpacts']), result)
        if style == 'bow':
            self.check('bow has actual traveling projectiles and confirmed collision', result['arrows'] and any(h['source'] == 'production projectile contact' for h in result['weaponImpacts']))
        after = self.state()
        self.check('actual exhaustion has no legacy fee, loot or material payout', all(after['adventure'][k] == before['adventure'][k] for k in ('xp', 'coins', 'ore', 'drops', 'defeated')) and after['sandbox']['inventory'] == before['sandbox']['inventory'])
        self.record['combat'].append({**result, 'guards': guards, 'frames_after_first_weapon': frames})
        self.render()
        self.shot('actual-bearing-exposed')

    def claim_fee(self):
        self.workspace()
        before = self.state()
        self.page.locator('[data-rpg="atlantis-campaign-claim"]').click()
        self.render()
        paid, fee = self.state(), self.definition['reward']
        inventory = dict(before['sandbox']['inventory'])
        for k, n in fee['materials'].items():
            inventory[k] += n
        self.check('native deliberate claim pays the whole fixed fee, including crystal, exactly once', paid['atlantisCampaign']['claimed']
                   and paid['adventure']['xp'] - before['adventure']['xp'] == min(fee['xp'], 9999 - before['adventure']['xp'])
                   and all(paid['adventure'][k] - before['adventure'][k] == fee[k] for k in ('coins', 'ore'))
                   and paid['sandbox']['inventory'] == inventory and all(paid['adventure'][k] == before['adventure'][k] for k in ('hp', 'stamina', 'tonics')))
        return before, paid

    def run_variant(self, flag):
        label, approach, choice = VARIANTS[flag]
        self.begin_record(label, choice, approach)
        self.report['variants'][label] = self.record
        source = self.args.sources / label / '00_EARNED_SEED.json'
        seed = read_json(source)
        self.start()
        self.definition = self.ev('RealmAtlantisCampaign.definition')
        self.import_character(source)
        initial = self.state()
        self.record['initial_world'] = initial
        self.record['original_native_slot'] = self.original_slot
        self.check('actual native import preserves full kit, prior campaign history, sockets and both camera records',
                   ownership(initial) == ownership(seed) and initial['sandbox']['inventory'] == seed['sandbox']['inventory']
                   and initial['settings'] == seed['settings'] and all(initial['adventure'][k] == seed['adventure'][k] for k in ('xp', 'coins', 'ore')))
        self.enter()
        self.workspace()
        before, text = self.state(), self.page.locator('#rpg-content').inner_text()
        self.check('visible terms disclose fixed threats, exact fee, depth, supplied bypass and all dispositions', all(t in text for t in
                   ('128 health', '10 damage', '48 XP', '18 sunmarks', '4 ore', '4 timber', '3 meadow fibre', '1 crystal', 'Upper', 'Lower', 'Publish', 'Limited', 'License', 'manual bypass')))
        self.check('native reading grants no consent, progression or payment', self.state() == before)
        self.walk_ui('giver')
        self.workspace()
        self.page.locator('[data-rpg="atlantis-campaign-accept"]').click()
        self.check('native explicit acceptance has no material charge', self.state()['atlantisCampaign']['accepted'] and self.state()['sandbox']['inventory'] == initial['sandbox']['inventory'])
        self.restart('accepted')
        self.enter()
        self.workspace('atlas')
        self.check('native map distinguishes dry Walk from physical wet depth reading', self.page.locator('[data-rpg="atlantis-campaign-walk"]').count() > 0 and 'H labels' in self.page.locator('#rpg-content').inner_text())
        self.action('receipt-conflict')
        for view in ('adventure', 'follow'):
            self.pixel_control('ilyra', view, 'actual-records-keeper')
        self.confirmation(approach, approach=True)
        self.workspace('atlas')
        wet_link = self.page.locator('[data-rpg="atlantis-campaign-depth"][data-id="upper-reading"]')
        before_depth_read = self.state()
        wet_link.click()
        self.render()
        self.check('native wet map link reads real depth instructions without walking or recording work',
                   self.state() == before_depth_read and not self.diag()['world']['dive']
                   and '1.06 m foot depth' in self.page.locator('#rpg-content').inner_text())
        self.restart('retained-approach')
        self.enter()
        self.dive()
        self.swim([8, -1.05, -22])
        self.action('upper-reading')
        self.check('other evidence never replaces the retained approach or its required reading',
                   self.state()['atlantisCampaign']['approach'] == approach
                   and (approach == 'upper' or not self.ev('()=>RealmAtlantisCampaign.available(Realm.state).some(s=>s.id==="diagnose-flow")')))
        self.flow_probe()
        self.action('lower-reading')
        self.route([[8, -2.7, -29.5], [8, -2.7, -32], [8, -2.7, -35]])
        quiet = self.diag()['adventure']['player']
        self.tick(10)
        self.check('actual Bellglass air court is quiet, dry and combat-free', self.diag()['world']['dive']['body'] == 'air' and not self.diag()['adventure']['enemies'] and self.diag()['adventure']['player'] == quiet)
        self.action('diagnose-flow')
        self.route([[8, -2.7, -32], [8, -2.7, -29.5], [8, -1.8, -29], [12, -1.8, -29]])
        if flag == 'bow':
            self.action('manual-bypass', pressure=True)
            self.check('native supplied bypass stops only the current, not required pressure work', not self.diag()['atlantis']['current']['active'] and 'inlet-set' not in self.state()['atlantisCampaign']['steps'])
        self.route([[8, -1.8, -29], [8, -2.55, -28], [8, -1.05, -22]])
        self.action('inlet-set', pressure=True)
        self.restart('partial-inlet-pressure')
        self.enter()
        self.dive()
        self.route([[8, -2.55, -28], [8, -2.7, -29.5], [8, -2.7, -32], [8, -2.7, -35]])
        self.action('equalizer-set', pressure=True)
        self.route([[8, -2.7, -32], [8, -2.7, -29.5], [8, -1.8, -29], [12, -1.8, -29], [12, -1.4, -38.4]])
        self.action('outlet-set', pressure=True)
        self.check('correct physical outlet independently stops the current', not self.diag()['atlantis']['current']['active'])
        self.swim([12, -1.4, -39.3])
        self.page.keyboard.press('e')
        self.render()
        self.check('native E at the real landing returns to supported dry ground', self.diag()['world']['dive'] is None)
        self.action('secure-carrier')
        for view in ('adventure', 'follow'):
            self.pixel_control('damar', view, 'actual-secured-carrier')
        self.action('challenge-custodian')
        self.fight(probes=flag == 'blade')
        self.restart('actual-bearing-exposed')
        self.enter()
        self.action('release-west', pressure=True)
        self.action('release-east', pressure=True)
        self.action('custodian-stable')
        self.restart('independent-safety-before-disposition')
        self.enter()
        self.confirmation(choice)
        for view in ('adventure', 'follow'):
            self.pixel_control('registry-record', view, choice + '-whole-local-record')
            self.pixel_control(choice, view, choice + '-distinct-local-fitting')
        self.restart('retained-disposition')
        self.enter()
        self.action('verify-passage')
        self.workspace()
        recognition = self.page.locator('.atlantis-campaign-recognition').inner_text()
        terms = next(c for c in self.definition['choices'] if c['id'] == choice)
        self.check('verified local record has every authored recognition caller and remains unpaid', all(l['name'] + ':' in recognition and l['text'] in recognition for l in terms['recognition']) and not self.state()['atlantisCampaign']['claimed'])
        unpaid = self.state()
        self.check('all native acceptance, optional readings, pressure, actual combat and verification leave the fixed fee unpaid',
                   all(unpaid['adventure'][k] == initial['adventure'][k] for k in ('xp', 'coins', 'ore'))
                   and unpaid['sandbox']['inventory'] == initial['sandbox']['inventory'])
        self.restart('verified-unpaid')
        self.enter()
        self.walk_ui('claim')
        self.ready_probe_world = self.state()
        _, paid = self.claim_fee()
        self.check('all previous owners survive the full native campaign without new gear or dropped history', ownership(paid) == ownership(initial))
        self.workspace()
        self.check('paid UI has no repeat payout button', not self.page.locator('[data-rpg="atlantis-campaign-claim"]').count())
        self.restart('paid-once')
        self.enter()
        before = self.state()
        retry = self.ev('()=>Realm.test.atlantisCampaignCommand("claim",{quest:RealmAtlantisCampaign.definition.id,expectedRevision:Realm.state.adventure.revision,expectedActive:Realm.test.worldContext().active})')
        self.check('labelled production command replay after cold load cannot pay twice', retry.get('duplicate') and self.state() == before)
        self.original_slot_unchanged('full earned continuation')
        self.record['final_world'] = self.state()
        self.record['final_native_bytes'] = self.ev('localStorage.getItem(RealmCharacters.KEY)')
        self.record['final_native_sha256'] = digest(self.record['final_native_bytes'])
        self.context.close()
        self.context = self.page = None
        self.synthetic_probes(label, approach, choice, seed,
                              ('crystal-capacity', 'claim-write-refusal') if flag == 'blade' else
                              ('old-save-migration',) if flag == 'veteran' else ())

    def synthetic_probes(self, earned_label, approach, choice, seed, kinds):
        for kind in kinds:
            world = json.loads(json.dumps(seed if kind == 'old-save-migration' else self.ready_probe_world))
            edits = {}
            if kind == 'crystal-capacity':
                world['sandbox']['inventory']['crystal'] = 999
                edits = {'sandbox.inventory.crystal': 999}
            elif kind == 'old-save-migration':
                world.pop('atlantisCampaign')
                edits = {'atlantisCampaign': 'absent optional owner'}
            label = earned_label + '-SYNTHETIC-' + kind
            source = self.args.output / (label + '-IMPORTED_DERIVATIVE.json')
            write_new(source, world)
            self.begin_record(label, choice, approach)
            self.report['synthetic_profiles'][label] = self.record
            self.record['synthetic_provenance'] = {'source': str(source), 'sha256': sha(source), 'parent': earned_label, 'edits': edits,
                'label': 'Separate derivative profile, never adopted in earned play; no fabricated campaign history, HP, actor pose or defeat.'}
            self.start()
            self.import_character(source)
            self.record['original_native_slot'] = self.original_slot
            if kind == 'old-save-migration':
                before = self.state()
                self.check('native legacy import adds only empty unaccepted optional Atlantis history', before['atlantisCampaign'] == {'version': 1, 'accepted': False, 'steps': [], 'approach': None, 'choice': None, 'claimed': False}
                           and ownership(before) == ownership(world) and before['settings'] == world['settings'] and before['sandbox']['inventory'] == world['sandbox']['inventory'])
                self.restart('SYNTHETIC-old-owner-absent-migration')
            else:
                self.enter()
                self.walk_ui('claim')
                self.workspace()
                before, raw = self.state(), self.ev('localStorage.getItem(RealmCharacters.KEY)')
                if kind == 'claim-write-refusal':
                    self.ev(r"""()=>{window.__atRefusal=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===RealmCharacters.KEY)throw Error('Labelled isolated Atlantis claim write refusal');return __atRefusal.call(this,k,v);};}""")
                try:
                    self.page.locator('[data-rpg="atlantis-campaign-claim"]').click()
                    self.render()
                    self.check('isolated ' + kind + ' refuses the whole fee without changing native bytes or state', self.state() == before and self.ev('localStorage.getItem(RealmCharacters.KEY)') == raw)
                    self.check('isolated refusal remains visibly complete and unpaid', 'Complete · unpaid' in self.page.locator('#rpg-content').inner_text() and not self.state()['atlantisCampaign']['claimed'])
                    self.shot('SYNTHETIC-' + kind + '-unpaid')
                finally:
                    if kind == 'claim-write-refusal':
                        self.ev('Storage.prototype.setItem=window.__atRefusal;delete window.__atRefusal')
                if kind == 'claim-write-refusal':
                    self.claim_fee()
            self.original_slot_unchanged('separate labelled synthetic probe')
            self.record['final_world'] = self.state()
            self.record['final_native_bytes'] = self.ev('localStorage.getItem(RealmCharacters.KEY)')
            self.record['final_native_sha256'] = digest(self.record['final_native_bytes'])
            self.context.close()
            self.context = self.page = None


def load_base():
    spec = importlib.util.spec_from_file_location('firstlight_atlantis_qualified_helpers', ROOT / 'tools/heaven_campaign_browser.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--sources', required=True, type=Path)
    parser.add_argument('--renderer', choices=('software', 'hardware'), default='software')
    parser.add_argument('--variant', choices=('blade', 'bow', 'veteran', 'all'), default='all')
    args = parser.parse_args(argv)
    flags = tuple(VARIANTS) if args.variant == 'all' else (args.variant,)
    try:
        args.output, args.sources = guard_paths(args.output, args.sources)
        provenance, seed_hashes = read_provenance(args.sources, flags)
        html = (ROOT / 'index.html').read_text(encoding='utf-8-sig')
        modules = ('atlantis-campaign-data.js', 'atlantis-campaign.js', 'atlantis-campaign-ui.js', 'atlantis-campaign-art.js',
                   'world-atlantis-earth.js', 'world-foundations.js', 'adventure.js', 'adventure-art.js', 'arsenal.js', 'combat.js', 'core.js', 'rpg-ui.js', 'app.js')
        if any((ROOT / 'src' / p).read_text(encoding='utf-8-sig').strip() not in html for p in modules):
            raise ValueError('Frozen HTML does not embed every current Atlantis/production caller.')
        if sha(ROOT / 'index.html') != sha(ROOT / 'FIRSTLIGHT_VALLEY.html'):
            raise ValueError('Both checked-in HTML copies must be byte-identical.')
        reserve_output(args.output)
    except (ValueError, OSError, json.JSONDecodeError) as error:
        parser.error(str(error))
    inputs = [*sorted(p for p in (ROOT / 'src').iterdir() if p.is_file()), ROOT / 'build.py', ROOT / 'index.html', ROOT / 'FIRSTLIGHT_VALLEY.html',
              Path(__file__), ROOT / 'tools/heaven_campaign_browser.py', ROOT / 'tools/browser_support.py', ROOT / 'tests/atlantis_campaign_browser.py',
              ROOT / 'tests/test_atlantis_campaign_browser_storage.py',
              ROOT / 'tests/atlantis_campaign_journey.cjs', ROOT / 'tests/realm_trails_journey.cjs']
    hashes = {str(p.relative_to(ROOT)).replace('\\', '/'): sha(p) for p in inputs}
    report = {'method': __doc__, 'status': 'running', 'renderer_requested': args.renderer, 'html_sha256': sha(ROOT / 'index.html'),
              'source_hashes': hashes, 'seed_input_hashes': seed_hashes, 'seed_provenance': provenance,
              'requested_variants': [VARIANTS[f][0] for f in flags], 'checks': [], 'variants': {}, 'synthetic_profiles': {},
              'browser_errors': [], 'console_errors': [], 'errors': [], 'accelerated_ticks': True, 'tick_seconds': .05,
              'accelerated_scope': 'production moveTo/worldSwim/time adapters only; native UI owns all consent, pressure, target-key combat and claim',
              'native_persistence': True, 'normal_time_footage': False, 'human_pacing': False, 'performance_claim': False,
              'earned_actor_position_edits': 0, 'earned_inventory_grants': 0, 'earned_manual_damage': 0, 'earned_forced_modes': 0, 'earned_planted_facts': 0}
    report['profile_limit'] = 6
    report['storage_policy'] = 'Six fresh isolated profiles at most; no profile/source/video copies. Root may retire successful profiles only after verifying the recorded exact native bytes, cold-start receipts and complete final worlds. Failed profiles remain diagnostic evidence.'
    harness = None
    try:
        base = load_base()
        browser = type('AtlantisCampaignBrowser', (AtlantisMixin, base.CampaignBrowser), {})
        harness = browser(args, report)
        with base.sync_playwright() as pw:
            harness.pw = pw
            try:
                for flag in flags:
                    harness.run_variant(flag)
            except Exception:
                # Capture the actual failing client before closing its context.
                if harness.page is not None:
                    try:
                        harness.record['failure_world'] = harness.state()
                        harness.record['failure_diagnostics'] = harness.diag()
                        harness.shot('FAILURE')
                    except Exception:
                        report['errors'].append('Failure capture could not complete:\n' + traceback.format_exc())
                raise
            finally:
                if harness.context is not None:
                    try:
                        if report['status'] == 'running' and harness.page:
                            harness.record['last_observed_world'] = harness.state()
                    finally:
                        harness.context.close()
                        harness.context = harness.page = None
        harness.variant = None
        harness.check('all frozen source membership and earned input bytes remain unchanged',
                      source_epoch() == next(iter(provenance.values()))['journey']['sourceHashes']
                      and all(sha(ROOT / p) == h for p, h in hashes.items()) and all(sha(Path(p)) == h for p, h in seed_hashes.items()))
        harness.check('no actual browser or console error was hidden', not report['browser_errors'] and not report['console_errors'], {'browser': report['browser_errors'], 'console': report['console_errors']})
        report['status'] = 'passed'
    except Exception:
        report['status'] = 'failed'
        report['errors'].append(traceback.format_exc())
        print(report['errors'][-1], flush=True)
    finally:
        if harness:
            try:
                harness.stop()
            except Exception:
                report['status'] = 'failed'
                report['errors'].append(traceback.format_exc())
        report['final_source_hashes'] = {p: sha(ROOT / p) if (ROOT / p).is_file() else None for p in hashes}
        report['final_seed_input_hashes'] = {p: sha(Path(p)) if Path(p).is_file() else None for p in seed_hashes}
        report['source_drift'] = report['final_source_hashes'] != hashes or report['final_seed_input_hashes'] != seed_hashes
        try:
            report['final_source_epoch'] = source_epoch()
            report['source_drift'] |= report['final_source_epoch'] != next(iter(provenance.values()))['journey']['sourceHashes']
        except OSError:
            report['source_drift'] = True
            report['errors'].append('Frozen source membership could not be read:\n' + traceback.format_exc())
        if report['source_drift']:
            report['status'] = 'failed'
        report['profile_disposal_candidates'] = [
            {'path': str(args.output / (label + '-isolated-profile')),
             'reason': 'Successful isolated profile; exact native restart receipts and full final world are retained in this report. Root owns cleanup.'}
            for label, record in {**report['variants'], **report['synthetic_profiles']}.items()
            if report['status'] == 'passed' and record.get('final_world') and record.get('final_native_bytes')]
        report['videos_recorded'] = 0
        write_new(args.output / 'REPORT.json', report)
    print(f'Atlantis campaign browser: {sum(c["passed"] for c in report["checks"])}/{len(report["checks"])} checks; {report["status"]}', flush=True)
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
