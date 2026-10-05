#!/usr/bin/env python3
"""Prepared native Earth homecoming qualification; no browser runs on import.

Earned progress uses native import/travel/consent/actions/target/attack/Brace/
companion/choice/payment controls. Only actual moveTo and 50ms simulation ticks
accelerate movement and combat. Read-only render/diagnostic/observer adapters and
restored renderer-only ablations measure the actual client. Six fresh D profiles,
no automatic videos. Separate labelled derivatives cover capacity, write refusal
and optional old-save migration. This is not ordinary-RAF or human-feel evidence.
"""
from pathlib import Path, PureWindowsPath
import argparse
import hashlib
import importlib.util
import json
import math
import os
import sys
import time
import traceback

sys.dont_write_bytecode = True
ROOT = Path(os.environ.get('FIRSTLIGHT_ROOT', 'D:/07-GAMES/Firstlight/authoring/atlantis-harbour-campaign-20261004')).resolve()
CAMPAIGN = 'earth-road-can-refuse-v1'
DEFAULT_COHORT_SHA = 'd63e6dfce83b7bad37633eeba1c1709aa8c9fef043ecb4d53e968850ed4bb198'
PORTABLE_PROVENANCE_SHA = '4b18502ab94c1e468013638ae79ffb1c53e100cd4e086abc8576a730ee932a3a'
HISTORICAL_INPUTS = {
 'blade': ('blade/ALL_TWELVE_PREREQUISITES_EARNED.json', '3b8e39f119e5eda83211f036b13f982961a96830d24235a1a86065ee32c99a93'),
 'bow': ('bow/ALL_TWELVE_PREREQUISITES_EARNED.json', 'ea92d097b01b1d9610a25e02300b07a629c257a58d1a57e09e67de27648f657f'),
 'strongest': ('strongest/FINAL_WORLD.json', '1cc37eafe2f1a10943ee11e8eba6423f3ca51be6f15d359bf9928e0fe5cb53e6')}
VARIANTS = {'blade': ('blade', 'public-watch', False), 'bow': ('bow', 'reviewed-custody', True),
            'strongest': ('strongest', 'public-watch', True)}
PROFILES = (*VARIANTS, 'blade-SYNTHETIC-capacity', 'blade-SYNTHETIC-write-refusal', 'strongest-SYNTHETIC-old-owner')
ZERO = ('positionEdits', 'actorPositionEdits', 'inventoryGrants', 'healthGrants', 'manualDamage',
        'plantedDefeats', 'plantedQuestFacts', 'forcedModes', 'forcedCycles')
CHECKPOINTS = ('01_ACCEPTED', '02_RELAYS', '03_REGENT_REPELLED', '04_CHOICE', '05_VERIFIED',
               '06_HOME_UNPAID', '07_PAID', 'FINAL_WORLD')
FRESH = {'version': 1, 'accepted': False, 'steps': [], 'choice': None, 'claimed': False}
STAGES = ('import', 'accept', 'relays', 'partial-retreat', 'combat', 'choice', 'verification', 'physical-home', 'fee', 'free-return')
INITIALIZE = r"""(()=>{window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;
 try{window.__hvcStartup=localStorage.getItem('eternities.realm10.characters.v1');}catch(e){window.__hvcStartupError=String(e);}
 const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){const r=original.call(this,k,v);
 if(k==='eternities.realm10.characters.v1')console.debug('__HVC_NATIVE_WRITE__'+String(v));return r;};})()"""

# Pass-through observer: F submits {}, while Auto supplies the selected id.
# Synchronous actual attack HP loss is weapon contact, with no tick/companion
# callback inside this command. Bow is observed at its real projectile caller.
COMBAT_OBSERVER = r"""s=>{const A=RealmAdventure,e=A.runtime(s).enemies.find(e=>e.id===RealmEarthHomecoming.definition.enemy.id),command=s.adventureCommand,damage=A.damageEnemy;
         const o=window.__hvcCombat={actor:e,weaponImpacts:[],frames:[],contacts:[],arrows:false,lastContact:e.contactAt,seen:new WeakSet()};
         s.adventureCommand=function(id,type,p){const hp=e.hp,mode=e.mode,r=command.call(this,id,type,p);if(RealmArsenal.weapon(this.state.adventure).style==='blade'&&type==='attack'&&(!p?.target||p.target===e.id)&&e.hp<hp)o.weaponImpacts.push({source:'production blade contact',before:hp,after:e.hp,mode});return r;};
         A.damageEnemy=function(current,enemy,n,source){const hp=enemy?.hp,mode=enemy?.mode,r=damage.apply(this,arguments);if(current===s&&enemy===e&&source==='weapon'&&RealmArsenal.weapon(s.state.adventure).style==='bow'&&enemy.hp<hp)o.weaponImpacts.push({source:'production projectile contact',before:hp,after:enemy.hp,mode,n});return r;};
         o.sample=()=>{o.arrows ||=RealmArsenal.runtime(s).arrows.length>0;if(e.strike&&!o.seen.has(e.strike)){o.seen.add(e.strike);o.frames.push({frame:{...e.strike},hp:e.hp,frozen:Object.isFrozen(e.strike)});}if(e.contactAt!==o.lastContact){o.contacts.push({at:e.contactAt,hit:e.contactHit,player:{...s.state.player},hp:s.state.adventure.hp,frame:{...e.strike}});o.lastContact=e.contactAt;}};
         o.finish=()=>{s.adventureCommand=command;A.damageEnemy=damage;return{weaponImpacts:o.weaponImpacts,frames:o.frames,contacts:o.contacts,arrows:o.arrows,hp:e.hp};};}"""


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read_json(path):
    result = json.loads(Path(path).read_text(encoding='utf-8-sig'))
    if not isinstance(result, dict):
        raise ValueError('Expected an object receipt: ' + str(path))
    return result


def within(path, parent):
    return path == parent or parent in path.parents


def bounded(path, windows=None):
    p = Path(path).resolve()
    if p == Path(p.anchor) or ((os.name == 'nt' if windows is None else windows) and
                             (not PureWindowsPath(str(p)).is_absolute() or PureWindowsPath(str(p)).drive.upper() != 'D:')):
        raise ValueError('Use a bounded resolved D directory, never a drive root or personal profile.')
    return p


def guard_paths(output, sources):
    output, sources = bounded(output), bounded(sources)
    if output.exists():
        raise FileExistsError('Use a fresh evidence root; previous receipts are never overwritten.')
    if not sources.is_dir() or within(output, sources) or within(sources, output):
        raise ValueError('Inputs and new output must be separate bounded trees.')
    return output, sources


def profile_path(output, name):
    if name not in PROFILES:
        raise ValueError('Exactly six named isolated profile families are permitted.')
    p = bounded(bounded(output) / (name + '-isolated-profile'))
    if not within(p, Path(output).resolve()) or p.exists():
        raise FileExistsError('A profile must be a fresh child of its new output root.')
    return p


def verify_link(link, parent=None):
    if not isinstance(link, dict) or not isinstance(link.get('path'), str):
        raise ValueError('A byte-linked path receipt is required.')
    p = Path(link['path']).resolve()
    if parent is not None and not within(p, Path(parent).resolve()):
        raise ValueError('Earned payload escapes the exact source root.')
    expected = link.get('sha256')
    if not isinstance(expected, str) or len(expected) != 64 or not p.is_file() or sha(p) != expected:
        raise ValueError('Linked bytes differ: ' + str(p))
    if 'bytes' in link and p.stat().st_size != link['bytes']:
        raise ValueError('Linked size differs: ' + str(p))
    return p


def validate_journey(j, variant):
    label, choice, prepared = VARIANTS[variant]
    if (j.get('status') != 'passed' or j.get('variant') != label or j.get('choice') != choice or
            j.get('prepared') is not prepared or j.get('sourceFrozen') is not True or
            j.get('all12Paid') is not True or j.get('priorOwnersPreserved') is not True or
            j.get('syntheticGameplaySetup') is not False or j.get('browserExecuted') is not False):
        raise ValueError('Complete actual installed earned continuation and representative plan required.')
    if any(type(j.get(k)) is not int or j[k] != 0 for k in ZERO):
        raise ValueError('All nine earned no-injection declarations must be explicit integer zero.')
    combat = j.get('combat', {})
    if (combat.get('enemy') != 'earth-regent-incursion-v1' or not combat.get('weaponImpacts') or
            not combat.get('contacts') or not combat.get('guards') or
            {f.get('frame', {}).get('pattern') for f in combat.get('frames', [])} != {'claim-lane', 'false-shelter', 'closing-ring'}):
        raise ValueError('Actual combat, three naturally scheduled tells and contacts are required.')
    if variant == 'bow' and (combat.get('style') != 'bow' or not combat.get('arrowFrames') or
                            not all(i.get('caller') == 'production projectile impact' for i in combat['weaponImpacts'])):
        raise ValueError('Bow requires traveling arrows and attributed production projectile damage.')
    if [r.get('label') for r in j.get('coldReloads', [])] != ['accepted', 'ordered-relays', 'regent-repelled', 'chosen', 'verified-away-from-home', 'home-unpaid', 'paid']:
        raise ValueError('Every complete earned cold-reload boundary must be present.')
    if not all(r.get('wholeSnapshotPreserved') is True for r in j['coldReloads']):
        raise ValueError('Cold-load preservation evidence is incomplete.')



def portable_origin(row, variant, root, epoch, frozen):
    """Separate repository-fixture contract, never a replacement for live lineage.

    Root's portable caller intentionally retains historical report hashes and
    disclosure, without replaying private report paths on a new checkout.
    Require the exact previously inspected metadata and inherited bytes; bind
    every newly executed edge separately below. Original linked contracts still
    require every original report/character edge.
    """
    folder = Path(root)/'tests/fixtures/earth-homecoming-prerequisites'
    mp = verify_link({'path': str(folder/'PROVENANCE.json'), 'sha256': PORTABLE_PROVENANCE_SHA}, folder)
    metadata = read_json(mp); frozen[str(mp)] = PORTABLE_PROVENANCE_SHA
    if metadata.get('linkedOriginalReportsReplayedByPortableDriver') is not False or set(metadata.get('records', {})) != set(VARIANTS):
        raise ValueError('Exact portable historical disclosure required.')
    expected = metadata['records'][variant]; tail, digest = HISTORICAL_INPUTS[variant]
    relative = 'tests/fixtures/earth-homecoming-prerequisites/'+tail
    if expected.get('path') != relative or expected.get('sha256') != digest:
        raise ValueError('Portable historical fixture identity differs.')
    source = verify_link(row['migration']['source'], folder)
    if source != (Path(root)/relative).resolve() or sha(source) != digest:
        raise ValueError('Portable migration must consume the declared historical fixture.')
    origin = {**expected['origin'], 'portableInputScope':metadata['scope'], 'originalReportsReplayed':False}
    if row.get('origin') != origin or row.get('historicalSourceHashes') != expected.get('sourceHashes'):
        raise ValueError('Portable origin/historical source disclosure differs.')
    deltas = [{'path':name, 'historicalSha256':old, 'currentActualSha256':epoch['actual'].get(name)}
              for name,old in expected['sourceHashes'].items() if epoch['actual'].get(name) != old]
    if sorted(row.get('sourceDeltas', []),key=lambda d:d['path']) != sorted(deltas,key=lambda d:d['path']):
        raise ValueError('Portable historical/current source changes differ.')
    return 'repository-fixture: historical original reports disclosed by hash, not replayed here'


def read_provenance(sources, flags, cohort_sha, root=ROOT, caller_root=None):
    """Freeze complete source, original chronology, migration and each checkpoint."""
    sources, root = Path(sources).resolve(), Path(root).resolve()
    cp = verify_link({'path': str(sources/'CONNECTED_EARTH_HOMECOMING_REPORT.json'), 'sha256': cohort_sha}, sources)
    cohort = read_json(cp)
    if (cohort.get('status') != 'passed' or cohort.get('sourceFrozen') is not True or cohort.get('variants') != 3 or
            any(type(cohort.get(k)) is not int or cohort[k] != 0 for k in ZERO)):
        raise ValueError('Complete three-path earned cohort with explicit no-injection declarations required.')
    epoch = cohort.get('sourceEpoch', {})
    if not isinstance(epoch.get('actual'), dict) or len(epoch['actual']) < 150:
        raise ValueError('Full installed source/helper epoch is required.')
    actual_src={p.relative_to(root).as_posix() for p in (root/'src').iterdir() if p.is_file()}
    if actual_src != {p for p in epoch['actual'] if p.startswith('src/')} or not {'build.py','index.html','FIRSTLIGHT_VALLEY.html'}.issubset(epoch['actual']):
        raise ValueError('The epoch must include every current source file and both built pages.')
    frozen = {str(cp): cohort_sha}
    for relative, expected in epoch['actual'].items():
        p = (root/relative).resolve()
        if not within(p, root) or sha(p) != expected:
            raise ValueError('Installed source drift: ' + relative)
        frozen[str(p)] = expected
    manifest = epoch.get('manifests', {}).get('installedManifest', {})
    mp = verify_link(manifest); frozen[str(mp)] = manifest['sha256']
    manifest_data = read_json(mp)
    if manifest_data.get('sourceHashes') != epoch['actual']:
        raise ValueError('Manifest and earned gameplay epoch differ.')
    callers = Path(caller_root).resolve() if caller_root else mp.parent
    for name, expected in epoch.get('stages', {}).items():
        if not name.startswith('caller/'):
            raise ValueError('An installed cohort cannot rely on a proposal overlay.')
        p = verify_link({'path': str(callers/name[7:]), 'sha256': expected}, callers)
        frozen[str(p)] = expected
    result = {}
    if {r.get('variant') for r in cohort.get('results', [])} != set(VARIANTS):
        raise ValueError('Unique blade/bow/strongest provenance is required.')
    for variant in flags:
        row = next(r for r in cohort['results'] if r['variant'] == variant)
        jp = verify_link(row['earthReport'], sources); frozen[str(jp)] = row['earthReport']['sha256']
        j = read_json(jp); validate_journey(j, variant)
        if j.get('sourceEpoch') != epoch:
            raise ValueError('Journey and cohort source epochs differ.')
        checkpoints = j.get('checkpoints', [])
        if len(checkpoints) != len(CHECKPOINTS) or {Path(p.get('path', '')).stem for p in checkpoints} != set(CHECKPOINTS):
            raise ValueError('Complete unique checkpoint hash links required.')
        paths = {}
        for link in [j['input'], j['final'], *checkpoints, row['migration']['source'], row['migration']['output']]:
            p = verify_link(link, sources if link != row['migration']['source'] else None)
            frozen[str(p)] = link['sha256']; paths[p.stem] = p
        seed = read_json(verify_link(j['input'], sources))
        if seed.get('earthHomecoming') != FRESH:
            raise ValueError('Earned native import must be unaccepted, with all prior claims retained.')
        final = read_json(verify_link(j['final'], sources))
        if not final.get('earthHomecoming', {}).get('claimed') or final['earthHomecoming'].get('choice') != VARIANTS[variant][1]:
            raise ValueError('Complete actually paid Earth outcome is required.')
        migrated = read_json(verify_link(row['migration']['output'], sources))
        old = read_json(verify_link(row['migration']['source']))
        if migrated.pop('earthHomecoming', None) != FRESH or migrated != old:
            raise ValueError('Optional migration must preserve every old field exactly.')
        origin = row.get('origin', {})
        if variant == 'strongest':
            if 'fixture-origin' not in origin.get('kind', '') or len(row.get('prerequisiteLineage', [])) != 4:
                raise ValueError('Strongest origin and actual missing-owner earnings must remain explicit.')
        elif 'continuous' not in origin.get('kind', '') or row.get('prerequisiteLineage'):
            raise ValueError('Blade/bow require their continuous original-campaign history.')
        # Bind original reports, every old continuous edge and strongest missing
        # account edge. No old source epoch is misrepresented as this epoch.
        portable = 'portableInputScope' in origin
        contract = portable_origin(row,variant,root,epoch,frozen) if portable else 'linked-original-reports-and-continuous-character-edges'
        links = [] if portable else [origin.get('rootReport')]
        if variant != 'strongest' and not portable:
            links += [origin['original']['report'], *origin['original']['stages'], *origin['original']['reports']]
            previous = origin['original']['stages'][-1]['sha256']
            for edge in origin.get('lineage', []):
                if edge['input']['sha256'] != previous:
                    raise ValueError('Continuous original character lineage is broken.')
                links += [edge['input'], edge['output'], edge['report']]; previous = edge['output']['sha256']
            if previous != row['migration']['source']['sha256']:
                raise ValueError('Continuous chronology does not reach the migrated source.')
        previous = row['migration']['output']['sha256']
        for edge in row.get('prerequisiteLineage', []):
            if edge['input']['sha256'] != previous:
                raise ValueError('Missing-owner continuation lineage is broken.')
            links += [edge['input'], edge['output'], edge['report']]; previous = edge['output']['sha256']
        if previous != j['input']['sha256']:
            raise ValueError('Actual inherited input link is broken.')
        for link in links:
            p = verify_link(link); frozen[str(p)] = link['sha256']
        result[variant] = {'seed': str(Path(j['input']['path']).resolve()), 'journey': j, 'cohort_row': row,
                           'checkpoints': {Path(p['path']).stem: p['path'] for p in checkpoints}, 'provenance_contract':contract}
    html = (root/'index.html').read_text(encoding='utf-8-sig')
    modules = ('earth-homecoming-data.js', 'earth-homecoming.js', 'earth-homecoming-ui.js', 'earth-homecoming-art.js',
               'core.js', 'characters.js', 'adventure.js', 'adventure-ui.js', 'adventure-art.js', 'arsenal.js',
               'combat.js', 'rpg-ui.js', 'world-foundations.js', 'world-foundations-ui.js', 'world.js', 'app.js')
    if sha(root/'index.html') != sha(root/'FIRSTLIGHT_VALLEY.html') or any((root/'src'/n).read_text(encoding='utf-8-sig').strip() not in html for n in modules):
        raise ValueError('Both equal pages must embed the actual installed Earth/combat/UI owners.')
    for p in (root/'tools/heaven_campaign_browser.py', root/'tools/browser_support.py', Path(__file__)):
        frozen[str(p.resolve())] = sha(p)
    return result, frozen


def ownership(world):
    a = world['adventure']
    return {'adventure': {k: a[k] for k in ('owned', 'equipment', 'arsenal', 'starter', 'pursuit', 'realmCraft', 'earthBinding',
            'classPath', 'companion', 'beacon', 'crossing', 'road', 'earthStory', 'earthNotes', 'earthGathering', 'defeated', 'drops', 'reward', 'relic', 'angelSeen')},
            'world': {k: world[k] for k in ('journeys', 'realmTrails', 'earthExpedition', 'hellCampaign', 'heavenCampaign',
                'atlantisCampaign', 'cosmosCampaign', 'bridgeCommunity', 'localLife', 'homeHistory', 'notes', 'score',
                'scoreRevision', 'retreat', 'visitor', 'flowers')},
            'settings': {k:v for k,v in world['settings'].items() if k not in ('cameraMode','cameraViews')}}


def write_new(path, value):
    with Path(path).open('x', encoding='utf8') as f:
        json.dump(value, f, indent=2); f.write('\n')


class EarthMixin:
    def start(self):
        # Own startup avoids the reference helper's direct test-quality write.
        options = self.base.launch_kwargs(self.args.renderer)
        self.context = self.pw.chromium.launch_persistent_context(str(self.profile), **options, viewport={'width': 1280, 'height': 800})
        self.context.add_init_script(INITIALIZE)
        self.page = self.context.new_page()
        for p in self.context.pages:
            if p != self.page: p.close()
        self.context.route('**/*', lambda r: r.continue_() if r.request.url.startswith(self.url) else r.abort())
        self.page.on('pageerror', lambda e: self.report['browser_errors'].append(str(e)))
        self.page.on('console', self.console)
        response = self.page.goto(self.url, wait_until='load', timeout=30000)
        self.page.wait_for_function('()=>!!window.Realm&&!!RealmEarthHomecoming', timeout=30000)
        self.check('exact frozen actual HTML served', response is not None and hashlib.sha256(response.body()).hexdigest() == self.report['html_sha256'])
        self.ev(r"""()=>{const p=RealmEngine.Engine.prototype,r=p.render;p.render=function(...args){
         window.__hvcArt={e:this};this.__hvcLastRender=args.slice();return r.apply(this,args);};}""")
        self.render()
        d = self.diag(); renderer = d['renderer'] or ''
        self.check('actual WebGL2 renderer', d['mode'] == 'webgl2' and bool(renderer), renderer)
        self.check('requested renderer observed', ('swiftshader' in renderer.lower()) if self.args.renderer == 'software' else not any(s in renderer.lower() for s in ('swiftshader', 'llvmpipe', 'software')), renderer)
        self.page.wait_for_function('()=>Realm.diagnostics.characters.mode==="legacy"||Realm.diagnostics.characters.writer', timeout=30000)
        self.record['navigation'].append({'url': self.url, 'renderer': renderer, 'capture_freezes_ordinary_RAF': True})

    def workspace(self, tab='earth-homecoming'):
        self.close_workspace(); self.page.keyboard.press('j')
        if tab == 'earth-homecoming':
            self.page.locator('#rpg-content [data-rpg="earth-homecoming-open"]').first.click()
        elif tab == 'worlds':
            self.page.locator('#rpg-tabs [data-rpg="open"][data-id="atlas"]').click()
            self.page.locator('#rpg-content [data-rpg="open"][data-id="worlds"]').first.click()
        else:
            self.page.locator(f'#rpg-tabs [data-rpg="open"][data-id="{tab}"]').click()
        self.render()

    def begin(self, name):
        self.variant = name
        self.record = {'navigation': [], 'native_write_receipts': [], 'restarts': [], 'screenshots': [], 'walks': [],
                       'pixel_controls': [], 'combat': [], 'completed_stages': [], 'warnings': [], 'misses': []}
        self.check('at most six isolated profile families', len(self.report['profile_paths']) < 6)
        self.profile = profile_path(self.args.output, name); self.profile.mkdir(exist_ok=False)
        self.report['profile_paths'].append(str(self.profile)); self.last_native_write = self.original_slot = None
        self.shot_serial = 0

    def complete(self, stage):
        self.check('stage reached and completed: '+stage, stage in STAGES and stage not in self.record['completed_stages'])
        self.record['completed_stages'].append(stage)

    def shot(self, name):
        self.shot_serial += 1
        return super().shot(f'{self.shot_serial:02d}-'+name)

    def step(self, name):
        return next(s for s in self.definition['steps'] if s['id'] == name)

    def defend(self):
        a, t = self.state()['adventure'], self.diag()['adventure']['tactics']
        self.check('actual movement and combat keep traveller alive', a['hp'] > 0)
        if any(e['mode'] == 'windup' for e in self.diag()['adventure']['enemies']) and a['stamina'] >= 20 and a['elapsed'] >= t['cooldowns']['guard']:
            self.page.locator('#skill-guard').click(); self.record.setdefault('brace_commands', 0); self.record['brace_commands'] += 1
        if a['hp'] < 45 and a['tonics'] and self.ev('()=>{const s=Realm.test.worldContext().sim;return s.state.adventure.elapsed>=RealmAdventure.runtime(s).cooldowns.heal;}'):
            self.page.locator('#skill-heal').click()

    def settle_walk(self, point, label):
        self.check('whole production body path is supported: '+label, self.ev(r"""()=>{const s=Realm.test.worldContext().sim,W=RealmWorldFoundations;let p=s.state.player;
         for(const q of s.playerPath){if(!(W.handles(s.room)?W.segment(s.room,p,q,.31):RealmCore.segment(p,q,s.navRoom,.31)))return false;p=q;}return true;}"""))
        frames = 0
        while self.ev('Realm.test.path.length') and frames < 18000:
            self.defend()
            result = self.ev(r"""()=>{const s=Realm.test.worldContext().sim,W=RealmWorldFoundations;let n=0;
             for(;n<6&&s.playerPath.length;n++){const p={...s.state.player};Realm.test.step(.05);window.__hvcCombat?.sample();
              if(!(W.handles(s.room)?W.segment(s.room,p,s.state.player,.31):RealmCore.segment(p,s.state.player,s.navRoom,.31)))return{ok:false,error:'unsupported body leg'};
              if(s.state.adventure.hp<=0)return{ok:false,error:'traveller died'};}return{ok:true,n};}""")
            self.check('actual supported walk leg: '+label, result['ok'], result); frames += result['n']
        self.render(); p = self.diag()['adventure']['player']
        self.check('production walking reaches '+label, frames < 18000 and math.hypot(p['x']-point['x'], p['z']-point['z']) <= 2.8)
        self.record['walks'].append({'label': label, 'frames': frames, 'player': p})

    def walk_ui(self, name):
        self.workspace(); p = self.definition['giver'] if name in ('giver', 'claim') else self.step(name)
        button = self.page.locator(f'#rpg-content [data-rpg="earth-homecoming-walk"][data-id="{name}"]')
        if button.count(): button.first.click(); self.settle_walk(p, p.get('name', name))
        else:
            self.check('already physically reaches '+name, self.ev('p=>RealmEarthHomecoming.at(Realm.test.worldContext().sim,p)', p)); self.close_workspace()

    def enter(self):
        if self.diag()['scene'] == self.definition['room']: return
        gate = self.ev('RealmWorldFoundations.GATE'); self.walk_exact(gate['x'], gate['z'], 'actual five-light entry marker')
        self.workspace('worlds')
        if not self.page.locator('[data-rpg="world-select"][data-id="earthlands"]').count():
            self.page.locator('[data-rpg="world-list"]').click(); self.render()
        self.page.locator('[data-rpg="world-select"][data-id="earthlands"]').first.click(); self.render()
        self.page.locator('[data-rpg="world-preview"][data-id="earthlands"]').click(); self.render()
        self.page.locator('[data-rpg="world-confirm"]').click(); self.render()
        self.check('native explicit crossing reaches Earth road', self.diag()['scene'] == self.definition['room'])

    def action(self, name, exact=False):
        p = self.step(name); self.check('no manual defeat/choice/arrival control', p['kind'] == 'interact')
        if exact: self.walk_exact(p['x'], p['z'], p['name'])
        else: self.walk_ui(name)
        self.workspace(); before = self.state()
        self.page.locator(f'#rpg-content [data-rpg="earth-homecoming-step"][data-id="{name}"]').click(); self.render()
        now = self.state(); self.check('physical native action records '+name, name in now['earthHomecoming']['steps'])
        self.check('physical work pays no independent fee', all(now['adventure'][k] == before['adventure'][k] for k in ('xp','coins','ore')) and now['sandbox']['inventory'] == before['sandbox']['inventory'])
        self.close_workspace()

    def restart(self, name):
        self.close_workspace()
        # Selecting the current view is an actual UI save path. No test-save or
        # ledger command substitutes for native checkpoint persistence.
        mode=self.diag()['camera']['preset']; self.page.locator(f'#rpg-hud [data-rpg="camera"][data-id="{mode}"]').click(); self.render()
        self.check('native current-view action saves '+name, self.diag()['saveState']=='saved')
        before, raw = self.state(), self.ev('localStorage.getItem(RealmCharacters.KEY)'); stored = self.native_world(raw)
        self.check('exact full native world persisted '+name, stored == before); self.original_slot_unchanged(name)
        self.page.close(run_before_unload=True); self.context.close(); self.context = self.page = None
        expected = raw; self.start(); startup, now = self.ev('window.__hvcStartup'), self.state()
        self.check('whole Chromium restart loads exact bytes '+name, startup == expected and self.native_world(startup) == stored)
        self.check('actual cold load preserves owners/payment/kit '+name, self.diag()['scene'] == 'valley' and self.diag()['characters']['active'] == self.active and now == stored and ownership(now) == ownership(before) and now['earthHomecoming'] == before['earthHomecoming'] and now['sandbox']['inventory'] == before['sandbox']['inventory'] and all(now['adventure'][k] == before['adventure'][k] for k in ('xp','coins','ore')))
        self.record['restarts'].append({'label': name, 'startup_sha256': hashlib.sha256(startup.encode()).hexdigest(), 'campaign': now['earthHomecoming']})
        self.original_slot_unchanged(name+' cold load')

    def companion(self, mode):
        self.workspace('companion'); self.page.locator(f'[data-rpg="companion"][data-id="{mode}"]').click(); self.render(); self.close_workspace()
        self.check('native companion choice retained '+mode, self.state()['adventure']['companion']['mode'] == mode)

    def pixels(self, selection, view):
        self.close_workspace(); self.page.locator(f'#rpg-hud [data-rpg="camera"][data-id="{view}"]').click(); self.page.keyboard.press('r'); self.render()
        self.check('actual camera projection '+view, self.diag()['camera']['projection'] == ('perspective' if view == 'adventure' else 'orthographic'))
        r = self.ev(r"""selection=>{const e=__hvcArt.e,s=Realm.test.worldContext().sim;
         const saved=[...e.batches,...e.dynamic].map(b=>({b,items:b.items,data:b.data,count:b.count}));
         const selected=i=>selection==='body'?!!i.earthHomecomingActor&&!i.earthHomecomingTelegraph:
          selection==='broad'||selection==='narrow'||selection==='ring'?i.earthHomecomingTelegraph===true&&i.earthHomecomingPattern===({broad:'claim-lane',narrow:'false-shelter',ring:'closing-ring'}[selection]):
          selection==='paired-inlay'?i.earthHomecomingTelegraph===true&&i.earthHomecomingPart.endsWith('-inlay'):
          selection==='road-trace'||selection==='home-trace'?i.earthHomecomingTrace===(selection==='road-trace'?'road':'home'):
          i.earthHomecomingFixture===selection;
         const sig=()=>JSON.stringify({state:Realm.state,player:s.state.player,camera:e.camera,view:Array.from(e.vp)}),before=sig(),args=e.__hvcLastRender.slice();
         const read=()=>{const g=e.gl,a=new Uint8Array(e.mainF.w*e.mainF.h*4);g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);g.readPixels(0,0,e.mainF.w,e.mainF.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;};
         e.render(...args);const present=read();let parts=0;try{for(const q of saved){q.b.items=q.items.filter(i=>!selected(i));parts+=q.items.length-q.b.items.length;e.updateBatch(q.b);}e.render(...args);const absent=read();
          for(const q of saved){q.b.items=q.items;q.b.data=q.data;e.updateBatch(q.b);q.b.count=q.count;}e.render(...args);const restored=read();let changed=0,delta=0;
          for(let i=0;i<present.length;i+=4){if(Math.max(...[0,1,2].map(k=>Math.abs(present[i+k]-absent[i+k])))>2)changed++;for(let k=0;k<3;k++)delta+=Math.abs(present[i+k]-restored[i+k]);}
          return{parts,changedPixels:changed,restorationRGBDelta:delta,pure:before===sig(),glError:e.gl.getError(),restored:saved.every(q=>q.b.items===q.items&&q.b.data===q.data&&q.b.count===q.count)};
         }finally{for(const q of saved){q.b.items=q.items;q.b.data=q.data;e.updateBatch(q.b);q.b.count=q.count;}}}""", selection)
        self.check('causal actual pixels and exact restoration '+selection+' '+view, r['parts']>0 and r['changedPixels']>10 and r['restorationRGBDelta']==0 and r['pure'] and r['restored'] and r['glError']==0, r)
        self.record['pixel_controls'].append({'selection': selection, 'view': view, **r}); self.shot(selection+'-'+view)

    def frame_geometry(self):
        r = self.ev(r"""()=>{const s=Realm.test.worldContext().sim,H=RealmEarthHomecoming,W=RealmWorldFoundations,e=RealmAdventure.runtime(s).enemies.find(e=>e.id===H.definition.enemy.id),engine=__hvcArt.e,M=RealmEngine.M;
         const parts=engine.dynamic.flatMap(b=>b.items.filter(i=>i.earthHomecomingActor===e.id).map(i=>({...i,kind:b.kind}))),f=e.strike;
         let body=0,warnings=0,minY=Infinity,maxRadius=0,bad=[];
         for(const p of parts){const vertices=RealmEngine.geometry(p.kind);for(let n=0;n<vertices.length;n+=6){const q=M.transform(p.m,Array.from(vertices.slice(n,n+3)));if(!q.every(Number.isFinite)){bad.push({part:p.earthHomecomingPart,error:'nonfinite canonical vertex'});continue;}
          if(p.earthHomecomingTelegraph){warnings++;const dx=q[0]-f.x,dz=q[2]-f.z,a=dx*Math.cos(f.yaw)-dz*Math.sin(f.yaw),b=dx*Math.sin(f.yaw)+dz*Math.cos(f.yaw),radius=Math.hypot(dx,dz);
           if(f.kind==='line'&&(Math.abs(a)>f.halfWidth+1e-5||b< -1e-5||b>f.length+1e-5)||f.kind==='annulus'&&(radius<f.innerRadius-1e-5||radius>f.outerRadius+1e-5)||q[1]<W.height(s.room,q[0],q[2])+.12||!W.walkable(s.room,q[0],q[2],0))bad.push({part:p.earthHomecomingPart,q});
          }else{body++;minY=Math.min(minY,q[1]);maxRadius=Math.max(maxRadius,Math.hypot(q[0]-e.x,q[2]-e.z));}}
         }
         return{owned:H.owned(s,e),anchored:e.x===H.definition.enemy.x&&e.z===H.definition.enemy.z,body,warnings,minY,ground:W.height(s.room,e.x,e.z),maxRadius,radius:e.radius,bad,frame:f,allNonColliding:parts.every(p=>p.appearanceOnly===true&&p.cameraSolid===false)};}""")
        self.check('actual whole Regent body grounded within its collision radius and exact raised warning footprint', r['owned'] and r['anchored'] and r['body']>0 and r['warnings']>0 and r['minY']>=r['ground']-1e-5 and r['maxRadius']<=r['radius']+1e-5 and not r['bad'] and r['allNonColliding'], r)

    def target(self):
        for _ in range(8):
            self.page.keyboard.press('Tab')
            if self.diag()['adventure']['tactics']['target'] == self.definition['enemy']['id']: break
        self.check('native Tab selects actual Regent', self.diag()['adventure']['tactics']['target'] == self.definition['enemy']['id'])

    def enemy(self):
        return next(e for e in self.diag()['adventure']['enemies'] if e['id'] == self.definition['enemy']['id'])

    def warning(self, pattern, pixels=True):
        r = self.ev(r"""pattern=>{const s=Realm.test.worldContext().sim;for(let n=0;n<800;n++){
         const e=RealmAdventure.runtime(s).enemies.find(e=>e.id===RealmEarthHomecoming.definition.enemy.id);if(!e||s.state.adventure.hp<=0)return{ok:false};
         if(e.mode==='windup'&&e.timer>.65&&e.strike?.pattern===pattern){window.__ehLocked=e.strike;return{ok:true,frame:e.strike,contactAt:e.contactAt??null,windup:e.windup,recovery:e.recovery,hp:e.hp,maxHP:e.maxHP,damage:e.damage,owned:RealmEarthHomecoming.owned(s,e),frozen:Object.isFrozen(e.strike)};}
         Realm.test.step(.05);window.__hvcCombat?.sample();}return{ok:false};}""", pattern)
        self.check('naturally scheduled immutable actual '+pattern+' warning', r.get('ok') and r.get('owned') and r.get('frozen') and r.get('maxHP')==168 and r.get('damage')==12, r)
        self.render(); self.frame_geometry(); self.record['warnings'].append(r)
        if pixels:
            for view in ('adventure','follow'):
                self.pixels({'claim-lane':'broad','false-shelter':'narrow','closing-ring':'ring'}[pattern], view); self.pixels('body', view); self.pixels('paired-inlay', view)
            self.framebuffer_positive_control()
        return r

    def contact(self, warning, miss=False):
        r = self.ev(r"""p=>{const s=Realm.test.worldContext().sim,e=RealmAdventure.runtime(s).enemies.find(e=>e.id===RealmEarthHomecoming.definition.enemy.id),f=window.__ehLocked;
         for(let n=0;n<100&&(e.contactAt??null)===p.at;n++){Realm.test.step(.05);window.__hvcCombat?.sample();}
         return{same:e.strike===f,contactAt:e.contactAt??null,hit:e.contactHit,hp:s.state.adventure.hp,player:{...s.state.player}};}""", {'at': warning['contactAt']})
        self.check('one actual locked contact preserves its frame', r['same'] and r['contactAt'] != warning['contactAt'] and r['hp']>0, r)
        if miss: self.check('ordinary movement makes the actual locked signal miss', r['hit'] is False, r); self.record['misses'].append(r)
        return r

    def attack(self):
        r = self.ev(r"""()=>{const s=Realm.test.worldContext().sim;for(let n=0;n<100;n++){const a=s.state.adventure,w=RealmArsenal.weapon(a);if(a.elapsed>=RealmAdventure.runtime(s).cooldowns.attack&&a.stamina>=w.stamina)return true;Realm.test.step(.05);window.__hvcCombat?.sample();}return false;}""")
        self.check('actual owned weapon is ready', r)
        before = self.ev('()=>{window.__ehAttackActor=RealmAdventure.runtime(Realm.test.worldContext().sim).enemies.find(e=>e.id===RealmEarthHomecoming.definition.enemy.id);return __ehAttackActor.hp;}')
        self.page.keyboard.press('f')
        for _ in range(8):
            self.defend(); self.tick(4)
            if self.ev('__ehAttackActor.hp')<before or 'regent-repelled' in self.state()['earthHomecoming']['steps']: break
        self.check('native owned attack causes actual weapon damage', self.ev('__ehAttackActor.hp')<before)
        self.ev('delete window.__ehAttackActor')

    def install_observer(self):
        self.ev("()=>("+COMBAT_OBSERVER+")(Realm.test.worldContext().sim)")

    def fight(self, probes=False, refused=False):
        before = self.state(); style = self.diag()['adventure']['weapon']['style']; e = self.definition['enemy']; self.install_observer()
        try:
            self.walk_exact(e['x'],e['z']+2.1,'ordinary close signal approach'); self.target()
            broad = self.warning('claim-lane', pixels=probes)
            self.check('supplied screen changes only broad warning duration', abs(broad['windup']-(1.45+(.4 if 'supplied-screen' in before['earthHomecoming']['steps'] else 0)))<1e-8)
            if probes:
                f=broad['frame']; self.walk_exact(f['x']+math.cos(f['yaw'])*3+math.sin(f['yaw'])*2.1,f['z']-math.sin(f['yaw'])*3+math.cos(f['yaw'])*2.1,'step outside the locked broad lane'); self.contact(broad,miss=True); self.walk_exact(e['x'],e['z']+2.1,'return by actual path')
            else: self.defend(); self.contact(broad)
            while self.enemy()['hp']>112: self.attack()
            if style=='bow': self.walk_exact(e['x'],e['z']-10.5,'actual carried bow firing distance')
            narrow=self.warning('false-shelter',pixels=probes or style=='bow'); self.check('fixed long narrow lane stays declared', narrow['frame']['length']<=11 and narrow['frame']['halfWidth']==.55)
            self.defend(); self.contact(narrow); self.walk_exact(e['x'],e['z']+2.1,'supported next phase weapon approach')
            while self.enemy()['hp']>56: self.attack()
            ring=self.warning('closing-ring',pixels=probes)
            if probes: self.walk_exact(e['x'],e['z']+1.05,'quiet center outside actual Regent body'); self.contact(ring,miss=True)
            else: self.defend(); self.contact(ring)
            if style=='bow': self.walk_exact(e['x'],e['z']-10.5,'actual final bow range')
            self.page.locator('#skill-auto').click(); self.render()
            self.check('native Auto enables real weapon intent', self.diag()['adventure']['tactics']['auto'])
            n=0
            while ('regent-repelled' not in self.state()['earthHomecoming']['steps'] and (not refused or self.enemy()['hp']!=1)) and n<600:
                self.defend(); self.tick(6); n+=6
            self.page.keyboard.press('Escape'); self.render()
            if refused:
                self.check('actual refused exhaustion retains a live HP1 owner without saved fact', self.enemy()['hp']==1 and 'regent-repelled' not in self.state()['earthHomecoming']['steps'])
            else: self.check('actual zero HP combat durably earns local repulse', 'regent-repelled' in self.state()['earthHomecoming']['steps'] and n<600)
        finally:
            result=self.ev('()=>{const r=__hvcCombat.finish();delete window.__hvcCombat;delete window.__ehLocked;return r;}')
        self.check('actual weapon contacts contribute independently of companion', bool(result['weaponImpacts']), result)
        if style=='bow': self.check('real arrows travel and collide', result['arrows'] and any(p['source']=='production projectile contact' for p in result['weaponImpacts']))
        now=self.state(); self.check('no generic enemy loot or payout', all(now['adventure'][k]==before['adventure'][k] for k in ('xp','coins','ore','drops','defeated')) and now['sandbox']['inventory']==before['sandbox']['inventory'])
        self.record['combat'].append(result)

    def confirm(self, choice):
        self.walk_ui('aftermath'); self.workspace(); before=self.state()
        review=f'[data-rpg="earth-homecoming-review"][data-id="{choice}"]'; confirm=f'[data-rpg="earth-homecoming-confirm"][data-id="{choice}"]'
        self.page.locator(review).click(); self.render(); self.check('aftermath preview grants nothing', self.state()==before and self.page.locator('.earth-homecoming-confirm').is_visible())
        self.page.locator('[data-rpg="earth-homecoming-cancel"]').click(); self.render(); self.check('cancel leaves aftermath undecided', self.state()==before)
        self.page.locator(review).click(); self.page.locator(confirm).click(); self.render(); self.check('native current-owner consent retains chosen aftermath', self.state()['earthHomecoming']['choice']==choice); self.close_workspace()

    def fee(self):
        self.workspace(); before=self.state(); self.page.locator('[data-rpg="earth-homecoming-claim"]').click(); self.render(); paid=self.state(); fee=self.definition['reward']; inv=dict(before['sandbox']['inventory'])
        for k,n in fee['materials'].items(): inv[k]+=n
        self.check('whole declared fee pays once without equip/heal', paid['earthHomecoming']['claimed'] and paid['adventure']['xp']-before['adventure']['xp']==min(fee['xp'],9999-before['adventure']['xp']) and all(paid['adventure'][k]-before['adventure'][k]==fee[k] for k in ('coins','ore')) and paid['sandbox']['inventory']==inv and all(paid['adventure'][k]==before['adventure'][k] for k in ('hp','stamina','tonics')))
        return paid

    def return_free(self, name):
        self.workspace(); button=self.page.locator('[data-rpg="world-return"]')
        if not button.count(): self.workspace('atlas'); button=self.page.locator('[data-rpg="world-return"]')
        before=self.state()['earthHomecoming']; button.first.click(); self.render()
        self.check('native free return does not earn Oren home arrival '+name, self.diag()['scene']=='valley' and self.state()['earthHomecoming']==before)

    def finish_record(self):
        self.record['final_world']=self.state(); self.record['completed_count']=len(self.record['completed_stages'])
        self.record['final_native_sha256']=hashlib.sha256(self.ev('localStorage.getItem(RealmCharacters.KEY)').encode()).hexdigest()
        self.original_slot_unchanged('final exact inactive slot'); self.context.close(); self.context=self.page=None

    def run_variant(self, variant):
        label,choice,prepared=VARIANTS[variant]; self.begin(label); self.report['variants'][label]=self.record
        self.record['earned_input']={'path':self.provenance[variant]['seed'],'sha256':sha(self.provenance[variant]['seed']),'origin':self.provenance[variant]['cohort_row']['origin'],'provenance_contract':self.provenance[variant]['provenance_contract']}; self.start(); self.import_character(Path(self.provenance[variant]['seed'])); self.definition=self.ev('RealmEarthHomecoming.definition'); initial=self.state()
        self.check('actual all12 prior claims and unaccepted native import', initial['earthHomecoming']==FRESH and self.ev('RealmEarthHomecoming.eligible(Realm.state)')); self.complete('import')
        self.walk_ui('giver'); self.workspace(); self.page.locator('[data-rpg="earth-homecoming-accept"]').click(); self.render(); self.check('separate native acceptance', self.state()['earthHomecoming']['accepted']); self.complete('accept'); self.restart('accepted')
        companion=initial['adventure']['companion'];
        if companion['bonded'] and companion['mode']!='stay': self.companion('stay')
        self.enter(); self.workspace('atlas'); prior=self.state(); self.check('native map names physical return route', 'R marks' in self.page.locator('#rpg-content').inner_text() and self.page.locator('[data-rpg="earth-homecoming-walk"]').count()>0); self.check('map reading has no progress', self.state()==prior); self.shot('native-map')
        for name in ('bridge-record','register-record','inspect-claim'): self.action(name)
        for view in ('adventure','follow'):
            self.pixels('west-relay-isolated',view); self.pixels('east-relay-isolated',view); self.pixels('supplied-screen',view)
        if prepared: self.action('supplied-screen')
        for name in ('west-relay-isolated','east-relay-isolated'): self.action(name)
        self.complete('relays'); self.restart('ordered-relays'); self.enter(); self.action('challenge-regent'); self.tick(1)
        self.walk_exact(1,-32.9,'actual partial-combat approach'); self.target(); self.attack(); self.check('partial real attack leaves encounter unrecorded', self.enemy()['hp']<168 and 'regent-repelled' not in self.state()['earthHomecoming']['steps']); self.return_free('partial retreat'); self.restart('unfinished-actual-encounter'); self.complete('partial-retreat'); self.enter(); self.tick(1); self.check('unrecorded encounter resets through real reentry', self.enemy()['hp']==168)
        self.fight(probes=variant=='blade'); self.complete('combat'); self.restart('regent-repelled'); self.enter(); self.action('passage-secured'); self.confirm(choice); self.complete('choice')
        for view in ('adventure','follow'): self.pixels('road-trace',view)
        self.restart('chosen'); self.enter(); self.action('return-verified'); self.workspace(); self.check('actual nearby Vessa recognition and unpaid account', 'Vessa:' in self.page.locator('#rpg-content').inner_text() and not self.state()['earthHomecoming']['claimed']); self.complete('verification'); self.restart('verified-unpaid'); self.enter(); self.return_free('verified')
        self.check('menu return alone leaves home arrival incomplete', 'home-return' not in self.state()['earthHomecoming']['steps']); self.action('home-return')
        if companion['bonded'] and self.state()['adventure']['companion']['mode']!=companion['mode']: self.companion(companion['mode'])
        self.complete('physical-home')
        for view in ('adventure','follow'): self.pixels('home-trace',view)
        self.check('home trace rests on actual existing tabletop', self.ev(r"""()=>{const parts=__hvcArt.e.dynamic.flatMap(b=>b.items.filter(i=>i.earthHomecomingTrace==='home'));return parts.length>0&&parts.every(p=>p.appearanceOnly===true&&p.cameraSolid===false)&&parts.filter(p=>p.earthHomecomingPart==='independent-account-plate').every(p=>Math.abs(p.p[0]-12.5)<1e-6&&Math.abs(p.p[2]-8.55)<1e-6&&Math.abs((p.p[1]-p.s[1]/2)-2.13)<1e-5);}"""))
        # Restore native camera preference after explicitly testing both views.
        self.page.locator(f'#rpg-hud [data-rpg="camera"][data-id="{initial["settings"]["cameraMode"]}"]').click(); self.render()
        self.restart('home-unpaid'); self.walk_ui('claim'); self.ready_worlds[label]=self.state(); paid=self.fee(); self.complete('fee'); self.check('all old choices/owners/kit retained', ownership(paid)==ownership(initial)); self.check('original camera preset restored through native UI',paid['settings']['cameraMode']==initial['settings']['cameraMode']); self.record['native_camera_preference_changes']={'before':initial['settings']['cameraViews'],'after':paid['settings']['cameraViews'],'reason':'actual camera selection/reset controls deliberately exercised; other settings preserved'}; self.restart('paid-once'); self.workspace(); before=self.state(); self.check('paid UI offers no replay-payment button', self.page.locator('[data-rpg="earth-homecoming-claim"]').count()==0 and self.state()==before)
        self.enter(); self.workspace('atlas'); self.check('ordinary local exploration remains available after payment', self.page.locator('[data-rpg="world-walk"]').count()>0); self.return_free('after payment'); self.complete('free-return'); self.finish_record()

    def synthetic(self, kind):
        label='strongest-SYNTHETIC-old-owner' if kind=='old-owner' else 'blade-SYNTHETIC-'+kind
        if kind=='old-owner': world=read_json(self.provenance['strongest']['cohort_row']['migration']['source']['path']); edits={'earthHomecoming':'absent optional owner; otherwise exact historical rich world'}
        elif kind=='capacity': world=json.loads(json.dumps(self.ready_worlds['blade'])); world['sandbox']['inventory']['crystal']=999; edits={'sandbox.inventory.crystal':999}
        else: world=read_json(self.provenance['blade']['checkpoints']['02_RELAYS']); edits={'Storage.setItem':'temporary Character Store refusal only; no gameplay facts edited'}
        source=self.args.output/(label+'-DERIVATIVE.json'); write_new(source,world); self.begin(label); self.report['synthetic_profiles'][label]=self.record; self.record['synthetic_provenance']={'path':str(source),'sha256':sha(source),'edits':edits,'never_earned_progress':True}
        self.start(); self.import_character(source); self.definition=self.ev('RealmEarthHomecoming.definition')
        if kind=='old-owner':
            expected=json.loads(json.dumps(world)); expected['earthHomecoming']=FRESH; self.check('real optional migration preserves rich old world', self.state()==expected); self.restart('SYNTHETIC-old-owner')
        elif kind=='capacity':
            self.walk_ui('claim'); self.workspace(); before=self.state(); raw=self.ev('localStorage.getItem(RealmCharacters.KEY)'); self.page.locator('[data-rpg="earth-homecoming-claim"]').click(); self.render(); self.check('whole capacity refusal retains complete unpaid world and native bytes',self.state()==before and self.ev('localStorage.getItem(RealmCharacters.KEY)')==raw and 'whole fee' in self.page.locator('#toast').inner_text())
        else:
            self.enter(); self.action('challenge-regent'); self.tick(1); raw=self.ev('localStorage.getItem(RealmCharacters.KEY)'); self.refuse(True)
            try: self.fight(refused=True); self.check('HP1 refusal changes no persisted claim bytes',self.ev('localStorage.getItem(RealmCharacters.KEY)')==raw)
            finally: self.refuse(False)
            self.target(); self.attack(); self.check('actual weapon retry saves exhaustion after writer recovers','regent-repelled' in self.state()['earthHomecoming']['steps'])
            self.action('passage-secured'); self.confirm('public-watch'); self.action('return-verified'); self.return_free('refusal-profile'); self.action('home-return'); self.workspace(); before=self.state(); raw=self.ev('localStorage.getItem(RealmCharacters.KEY)'); self.refuse(True)
            try: self.page.locator('[data-rpg="earth-homecoming-claim"]').click(); self.render(); self.check('native claim write refusal retains exact full world and bytes',self.state()==before and self.ev('localStorage.getItem(RealmCharacters.KEY)')==raw)
            finally: self.refuse(False)
            self.fee(); self.restart('SYNTHETIC-recovered-claim')
        self.finish_record()

    def refuse(self, on):
        self.ev(r"""on=>{if(on){if(window.__ehWrite)throw Error('already refusing');window.__ehWrite=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===RealmCharacters.KEY)throw Error('Labelled isolated Earth writer refusal');return __ehWrite.call(this,k,v);};}else{Storage.prototype.setItem=window.__ehWrite;delete window.__ehWrite;}}""", on)


def load_base(root):
    spec=importlib.util.spec_from_file_location('firstlight_earth_native_infrastructure', Path(root)/'tools/heaven_campaign_browser.py')
    module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module); module.ROOT=Path(root); return module


def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,default=ROOT); parser.add_argument('--output',required=True,type=Path); parser.add_argument('--sources',required=True,type=Path)
    parser.add_argument('--cohort-sha',required=True,help='Exact inspected full earned-cohort SHA256; no silent old epoch default.'); parser.add_argument('--earned-caller-root',type=Path)
    parser.add_argument('--renderer',choices=('software','hardware'),default='software'); parser.add_argument('--variant',choices=(*VARIANTS,'all'),default='all')
    parser.add_argument('--preflight-only',action='store_true',help='Read/hash inputs and print prepared scope; never launch browser, server or create output.')
    args=parser.parse_args(argv); flags=tuple(VARIANTS) if args.variant=='all' else (args.variant,); root=args.root.resolve()
    try: args.output,args.sources=guard_paths(args.output,args.sources); provenance,frozen=read_provenance(args.sources,flags,args.cohort_sha,root,args.earned_caller_root)
    except (ValueError,OSError,KeyError,TypeError) as e: parser.error(str(e))
    if args.preflight_only:
        print(json.dumps({'status':'prepared-preflight-passed','browser_executed':False,'variants':list(flags),'frozen_files':len(frozen),'profile_limit':6,'videos':0,'html_sha256':sha(root/'index.html')})); return 0
    args.output.mkdir(parents=True,exist_ok=False)
    report={'status':'running','method':__doc__,'parent_reported_initial_runtime_head':'dd6c646a46a6784bcd61d745ddd31bf2ce2eae90','git_executed':False,'html_sha256':sha(root/'index.html'),'source_and_provenance_hashes':frozen,'checks':[],'variants':{},'synthetic_profiles':{},'profile_paths':[],'browser_errors':[],'console_errors':[],'errors':[], 'accelerated_ticks':True,'tick_seconds':.05,'browser_executed':False,'normal_time_footage':False,'human_pacing':False,'performance_claim':False,'videos_recorded':0,'planned_earned_stages_per_variant':list(STAGES),'profile_limit':6}
    harness=None
    try:
        base=load_base(root); browser=type('EarthHomecomingBrowser',(EarthMixin,base.CampaignBrowser),{})
        harness=browser(args,report); harness.base=base; harness.provenance=provenance; harness.ready_worlds={}
        with base.sync_playwright() as pw:
            harness.pw=pw; report['browser_executed']=True
            try:
                for flag in flags: harness.run_variant(flag)
                if 'blade' in flags: harness.synthetic('capacity'); harness.synthetic('write-refusal')
                if 'strongest' in flags: harness.synthetic('old-owner')
            except Exception:
                if harness.page is not None:
                    try: harness.record['failure_world']=harness.state(); harness.record['failure_diagnostics']=harness.diag(); harness.shot('FAILURE')
                    except Exception: report['errors'].append('Failure capture: '+traceback.format_exc())
                raise
            finally:
                if harness.context is not None:
                    try: harness.context.close()
                    finally: harness.context=harness.page=None
        harness.variant=None; harness.check('every source/provenance/checkpoint remains frozen',all(sha(p)==h for p,h in frozen.items()))
        harness.check('no hidden browser or console errors',not report['browser_errors'] and not report['console_errors'])
        report['status']='passed'
    except Exception: report['status']='failed'; report['errors'].append(traceback.format_exc())
    finally:
        if harness is not None:
            try: harness.stop()
            except Exception: report['status']='failed'; report['errors'].append('Cleanup: '+traceback.format_exc())
        report['completed_earned_stages']=sum(len(v.get('completed_stages',[])) for v in report['variants'].values())
        report['planned_earned_stages']=len(flags)*len(STAGES); report['passed_checks']=sum(c['passed'] for c in report['checks']); report['failed_checks']=sum(not c['passed'] for c in report['checks'])
        write_new(args.output/'REPORT.json',report)
    print(json.dumps({'status':report['status'],'completed_earned_stages':report['completed_earned_stages'],'planned_earned_stages':report['planned_earned_stages'],'passed_checks':report['passed_checks'],'failed_checks':report['failed_checks']}))
    return 0 if report['status']=='passed' else 1


if __name__=='__main__':
    raise SystemExit(main())
