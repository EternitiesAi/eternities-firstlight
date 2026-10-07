#!/usr/bin/env python3
"""Prepared native owner-expiry/refusal companion. Browser execution is pending.

The frozen native suite owns cohort admission, real watches, native movement,
storage and closure. This companion never issues observation or combat proof.
Only the explicitly labelled fibre-capacity derivative edits a saved quantity.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import argparse
import copy
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
import threading
import time
import traceback

FROZEN_SUITE_SHA256 = '24185a183336217365b3f573c195c507f366b19775b4355fd8cb17bfec09240a'
ID = 'earth-beast-wrong-name-v1'
PEST = 'earth-wild-signs-burrow-skitter-v1'
BASELINE = 'earthlands-coppice-skitter'
LOAD = 'earth-first-load-through-v1'
BED = dict(id='bed', out=1, cost=dict(wood=3, fiber=2), station=False)
NATIVE_DEATH_SECONDS = 240
NATIVE_FIGHT_SECONDS = 120


def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def need(ok, text):
    if not ok: raise ValueError(text)
def dump(p, value):
    with Path(p).open('x', encoding='utf-8', newline='\n') as f:
        json.dump(value, f, ensure_ascii=False, indent=2); f.write('\n')
def load_suite(p):
    p = Path(p).resolve()
    need(p.is_file() and sha(p) == FROZEN_SUITE_SHA256, 'Exact frozen native suite bytes required')
    spec = importlib.util.spec_from_file_location('wild_signs_frozen_native', p)
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    return module


def import_equal(before, after):
    """Exact whole snapshot, except the real rememberCamera capture on switch.

    Clocks, HP, owners, receipts, inventory and coins are deliberately retained.
    This is stronger than the original import history/economy predicate.
    """
    a, b = copy.deepcopy(before), copy.deepcopy(after)
    for w in (a, b): w.get('settings', {}).pop('cameraViews', None)
    return a == b


def ready_signed(w):
    r = w.get('earthWildSigns', {})
    return (set(r) == {'version','accepted','evidence','observed','resolution','cleared','claimed'}
            and type(r.get('version')) is int and r['version'] == 1 and r.get('accepted') is True
            and type(r.get('evidence')) is list and all(type(v) is str for v in r['evidence'])
            and set(r.get('evidence', [])) == {'timber-gouge', 'feeding-track', 'pest-scrape'}
            and len(r['evidence']) == 3 and r.get('observed') is True
            and r.get('resolution') == 'signed-loop' and r.get('cleared') is False
            and r.get('claimed') is False)


def capacity_derivative(original):
    need(ready_signed(original), 'Only a genuinely earned unpaid signed-loop source can derive capacity')
    inv = original['sandbox']['inventory']
    need(type(inv['fiber']) is int and inv['fiber'] < 999, 'Exact original fibre quantity required')
    need(type(original['adventure']['coins']) is int and original['adventure']['coins'] <= 9995,
         'The fibre-only boundary must not also start with coin-capacity refusal')
    need(type(inv['wood']) is int and inv['wood'] >= 6 and type(inv['bed']) is int and inv['bed'] <= 997,
         'Two ordinary growing-bed crafts require 6 real timber and two bed spaces; no grant fallback')
    changed = copy.deepcopy(original); changed['sandbox']['inventory']['fiber'] = 999
    need(capacity_relationship(original, changed), 'Capacity derivative must change only fibre to 999')
    return changed


def capacity_relationship(original, changed):
    if not ready_signed(original): return False
    candidate = copy.deepcopy(original)
    candidate['sandbox']['inventory']['fiber'] = 999
    return type(changed['sandbox']['inventory']['fiber']) is int and changed == candidate


def bed_inventory(before):
    after = copy.deepcopy(before)
    after['wood'] -= 3; after['fiber'] -= 2; after['bed'] += 1
    return after


def crafted_sandbox(before, after, item_name):
    """Independently enumerate one canonical craft, including receipt-cap history."""
    expected = copy.deepcopy(before); receipts = after['recentCommands']
    if not receipts: return None
    receipt = receipts[-1]
    fp = json.dumps(dict(type='craft', node=None, recipe='bed', kind=None, gx=None, gz=None,
                         rotation=None, object=None), separators=(',', ':'))
    if (set(receipt) != {'id','fingerprint','result'} or type(receipt['id']) is not str
            or not receipt['id'].startswith('rpg-craft-') or len(receipt['id']) > 100
            or receipt['id'] in {c['id'] for c in before['recentCommands']}
            or receipt['fingerprint'] != fp
            or receipt['result'] != dict(ok=True, text='Crafted 1 × '+item_name)):
        return None
    expected['inventory'] = bed_inventory(before['inventory']); expected['revision'] += 1
    expected['stats']['crafted'] += 1
    expected['recentCommands'] = (before['recentCommands'] + [receipt])[-128:]
    return expected if expected == after else None


def incoming_preserved(base, before, after):
    # Incoming ordinary RAF may legitimately advance its clock/residents. It
    # cannot import transient scene/proof or change any owned fact/economy.
    return (base.import_preserved(before, after)
            and before['earthWildSigns'] == after['earthWildSigns']
            and before['localLife']['records'][LOAD] == after['localLife']['records'][LOAD]
            and before['player'] == after['player'])


def payment(before, after):
    inv = {k: v + (3 if k == 'fiber' else 0) for k, v in before['sandbox']['inventory'].items()}
    expected = copy.deepcopy(before['earthWildSigns']); expected['claimed'] = True
    return (after['earthWildSigns'] == expected
            and after['sandbox']['inventory'] == inv
            and after['adventure']['coins'] == before['adventure']['coins'] + 4
            and after['adventure']['xp'] == before['adventure']['xp']
            and after['adventure']['ore'] == before['adventure']['ore'])


def driver_class(suite, base):
    class Boundaries(suite.driver_class(base)):
        def prefix(self, source, reverse=False):
            self.start(); self.import_world(source['source'])
            self.origin_world = source['world']; self.original_facts = self.stable_facts(self.origin_world)
            self.check('sealed original cohort economy/history and literal fresh owner',
                       base.import_preserved(self.origin_world, self.state()) and self.signs() == suite.FRESH)
            self.row['origin'] = dict(source=str(source['source']), sha256=sha(source['source']),
                journey=str(source['journey']), journeySha256=sha(source['journey']),
                producerSourceHead=source['receipt']['sourceHead'], load=source['receipt']['load'],
                provenance='current-command-earned-claimed-fifth/fresh-signs', prerequisitesReplayedByDriver=False)
            self.enter(); self.walk_sign('elderweald-sela'); self.action('accept')
            order = ['feeding-track', 'timber-gouge'] if reverse else ['timber-gouge', 'feeding-track']
            for mark in order: self.walk_sign(mark); self.action('read', mark)
            self.check('both actual nearby reads earned before witness', self.signs()['evidence'] == order)
            self.walk_sign('grazer-overlook'); self.configure(suite.CONFIGS[0]); self.watch('INITIAL')

        def slot(self, ident):
            return self.ev('id=>{const s=RealmCharacters.validate(JSON.parse(localStorage.getItem(RealmCharacters.KEY)));return s.slots.find(v=>v.id===id)?.world||null;}', ident)

        def switch(self, ident):
            self.workspace('characters'); outgoing = self.diag()['characters']['active']; before = self.state()
            self.click('[data-rpg="chars-switch"][data-id="' + ident + '"]')
            self.page.wait_for_function('id=>Realm.diagnostics.characters.active===id&&Realm.diagnostics.characters.writer===true', arg=ident)
            self.check('native switch persisted exact outgoing world apart from camera capture', import_equal(before, self.slot(outgoing)))
            self.check('native switch resumes the documented cold home checkpoint', self.diag()['scene'] == 'valley')
            self.row.setdefault('ownerTransitions', []).append(dict(kind='switch', outgoing=outgoing, incoming=ident))
            return before

        def expired_observe(self, expected, label):
            self.panel(); view = self.signs_view().get('view') or {}
            self.check(label + ' never adopts stale observed fact', self.signs() == expected and expected['observed'] is False)
            self.check(label + ' exposes no old ready witness or enabled Observe',
                       not view.get('observationReady', False)
                       and self.page.locator('[data-rpg="wild-signs-observe"]:not([disabled])').count() == 0)
            button = self.page.locator('[data-rpg="wild-signs-observe"]')
            if button.count():
                self.check('one actual disabled Observe control', button.count() == 1 and not button.is_enabled())
                button.scroll_into_view_if_needed(); box = button.bounding_box()
                self.check('disabled Observe is visibly addressable by original native pointer', box is not None and box['width'] > 0 and box['height'] > 0)
                before = self.state(); raw = self.ev('()=>localStorage.getItem(RealmCharacters.KEY)')
                self.page.mouse.click(box['x']+box['width']/2, box['y']+box['height']/2)
                self.check('original native disabled-control attempt refuses exact paused wholeworld/native bytes',
                           self.diag()['adventure']['paused'] is True and self.state() == before
                           and self.ev('()=>localStorage.getItem(RealmCharacters.KEY)') == raw)
            self.row.setdefault('expiredObserveChecks', []).append(dict(label=label, nativeAttempt=bool(button.count()), controlDisabled=True, privateTicketExposed=False))

        def expired_clearance(self, expected, label):
            self.panel(); enemies = self.diag()['adventure']['enemies']
            enemy = next((e for e in enemies if e['id'] == PEST), None)
            self.check(label + ' cannot backfill unsaved clearance', self.signs() == expected and not expected['cleared'])
            self.check(label + ' exposes no old dead proof or enabled retry',
                       (enemy is None or enemy['hp'] > 0)
                       and self.page.locator('[data-rpg="wild-signs-retry-clearance"]:not([disabled])').count() == 0)

        def fresh_watch(self, label):
            # Inspect immediately at the new outing's distant entry, before a
            # long walk could genuinely witness a new ordinary-frame sequence.
            self.enter()
            self.expired_observe(copy.deepcopy(self.signs()), label)
            self.walk_sign('grazer-overlook'); self.configure(suite.CONFIGS[0]); self.watch(label)

        def import_added(self, file, incoming):
            expected = json.loads(Path(file).read_text(encoding='utf-8'))
            self.workspace('characters'); outgoing = self.diag()['characters']['active']; before = self.state()
            with self.page.expect_file_chooser() as chooser: self.click('[data-rpg="chars-import"]')
            chooser.value.set_files(str(file)); self.page.wait_for_selector('[data-rpg="chars-confirm-import"]')
            self.click('[data-rpg="chars-confirm-import"]')
            self.page.wait_for_function('id=>Realm.diagnostics.characters.active===id&&Realm.diagnostics.characters.writer===true', arg=incoming)
            self.check('actual import adds a slot and preserves exact outgoing world', import_equal(before, self.slot(outgoing)))
            self.check('new imported owner matches its exact sealed source, not old transient proof',
                       incoming_preserved(base, expected, self.state()) and self.diag()['scene'] == 'valley')
            self.row.setdefault('ownerTransitions', []).append(dict(kind='import-add', outgoing=outgoing, incoming=incoming, source=str(file), sha256=sha(file)))
            self.close()

        def observation_owners(self, source):
            self.prefix(source); expected = copy.deepcopy(self.signs())
            self.switch('character-1')
            self.check('other character has its own untouched fresh signs history', self.signs() == suite.FRESH)
            self.switch('character-2'); self.expired_observe(expected, 'SWITCH_HOME')
            self.fresh_watch('SWITCH_FRESH')
            self.panel(); captured = self.state(); file = self.folder / 'ACTUAL_READY_UNRECORDED_IMPORT.json'
            # The file is the actual current paused snapshot, not planted saved progress.
            dump(file, captured); suite.validate_source(self.args.root, file)
            self.report.setdefault('generatedInputs', {})[str(file)] = sha(file)
            self.import_added(file, 'character-3'); self.expired_observe(expected, 'IMPORT_HOME')
            self.fresh_watch('IMPORT_FRESH'); self.native_observe()
            self.walk_sign('pest-scrape'); self.action('read', 'pest-scrape'); self.action('choose', 'signed-loop')
            self.signed_bypass(); self.walk_sign('elderweald-sela'); self.panel()
            ready = self.state(); self.check('native signed source is really durable unpaid work', ready_signed(ready) and self.stored()['earthWildSigns'] == ready['earthWildSigns'])
            saved = self.folder / 'ACTUAL_SIGNED_READY_UNPAID.json'; dump(saved, ready); suite.validate_source(self.args.root, saved)
            self.report.setdefault('generatedInputs', {})[str(saved)] = sha(saved)
            self.capture('SIGNED_READY'); self.restart('SIGNED_READY_COLD')
            return saved

        def companion_mode(self, mode):
            before = self.state(); companion = before['adventure']['companion']
            if not companion['bonded'] or companion['mode'] == mode: return
            self.workspace('companion'); self.click('[data-rpg="companion"][data-id="' + mode + '"]')
            expected = copy.deepcopy(companion); expected['mode'] = mode
            self.check('native companion command changes only declared mode', self.state()['adventure']['companion'] == expected)
            self.original_facts['adventure']['companion'] = expected; self.guard(); self.close()

        def walk_keys(self, target):
            self.close(); started = time.monotonic(); last = self.diag()['adventure']['player']
            route = self.ev('p=>RealmCore.pathfind(Realm.diagnostics.adventure.player,p,{id:"world-earthlands"})', target)
            self.check('actual Core provides a supported native hostile approach', bool(route))
            while time.monotonic()-started < 240:
                d = self.diag(); player = d['adventure']['player']
                self.check('physical approach stays unpaused and alive', not d['adventure']['paused'] and self.state()['adventure']['hp'] > 0)
                if base.distance(player, target) <= 1.1: break
                while route and base.distance(player, route[0]) <= 1.05: route.pop(0)
                point = route[0] if route else target
                remaining = 240-(time.monotonic()-started)
                if remaining <= 0: raise TimeoutError('Native approach deadline expired before another input interval')
                self.hold_native_keys_for_frames(base.native_keys(player, point, d['camera']['yaw']), timeout_ms=max(1,min(10000,int(remaining*1000))))
                after = self.diag()['adventure']['player']
                self.check('complete native approach segment retains actual support', self.ev('p=>RealmWorldFoundations.segment("world-earthlands",p[0],p[1],.31)', [last,after]))
                last = after
            else: raise TimeoutError('Native existing-hostile approach stalled within240 seconds')
            self.row['walks'].append(dict(kind='native-keys-existing-hostile', target=target, player=player, seconds=time.monotonic()-started))

        def real_death(self, enemy_id=BASELINE):
            self.close()
            before = self.state(); original_hp = before['adventure']['hp']; started = time.monotonic(); hits = []
            predeath = self.public_owner()
            initial = next((e for e in self.diag()['adventure']['enemies'] if e['id'] == enemy_id), None)
            self.check('only live actual canonical hostile is used for death', initial is not None and initial['hp'] > 0)
            last_hp = original_hp
            while time.monotonic() - started < NATIVE_DEATH_SECONDS:
                d = self.diag(); w = self.state(); enemy = next((e for e in d['adventure']['enemies'] if e['id'] == enemy_id), None)
                self.check('ordinary hostile damage has no companion kill or saved clearance',
                           enemy is not None and enemy['hp'] == initial['hp'] and not w['earthWildSigns']['cleared'])
                hp = w['adventure']['hp']
                if hp < last_hp: hits.append(dict(hp=hp, elapsed=w['adventure']['elapsed'], enemyMode=enemy['mode']))
                last_hp = hp
                if hp == 0:
                    death_seconds = time.monotonic()-started
                    self.check('real death occurred within its actual240 second wall deadline', death_seconds <= NATIVE_DEATH_SECONDS)
                    break
                self.check('death waits on real unpaused world', d['scene'] == 'world-earthlands' and not d['adventure']['paused'])
                self.page.wait_for_timeout(100)
            else: raise TimeoutError('Actual hostile did not inflict a real death within240 seconds; no damage fallback')
            self.check('real damage sequence and exactly one new death', bool(hits) and before['adventure']['deaths'] < 9999 and self.state()['adventure']['deaths'] == before['adventure']['deaths'] + 1)
            self.original_facts['adventure']['deaths'] = before['adventure']['deaths'] + 1
            self.page.wait_for_selector('#fallen-dialog[open]'); self.click('#revive-button')
            self.page.wait_for_function('()=>Realm.diagnostics.scene==="valley"&&Realm.state.adventure.hp>0&&!document.querySelector("#fallen-dialog").open')
            self.original_facts['adventure']['tonics'] = 3
            self.check('native revive restores canonical health/tonics without reward or account change',
                       self.state()['adventure']['hp'] == self.diag()['adventure']['stats']['maxHP']
                       and self.state()['adventure']['stamina'] == 100
                       and self.state()['adventure']['tonics'] == 3 and self.signs() == before['earthWildSigns'])
            self.guard(); self.expired_observe(before['earthWildSigns'], 'DEATH_HOME')
            self.row['genuineDeath'] = dict(enemy=enemy_id, deathSeconds=death_seconds, reviveAndRefusalWallSeconds=time.monotonic()-started, hits=hits, nativeRevive=True, manualDamage=False,
                predeparture=self.row.get('predeathDeparture'), predeath=predeath,
                readinessAlreadyUnavailableBeforeDeath=not bool((predeath.get('view') or {}).get('observationReady')),
                witnessStillReportedBeforeDeath=bool((predeath.get('view') or {}).get('observedBehavior')),
                scope='Actual damage/death/revive lifecycle. Readiness lost while far is not attributed solely to death; no opaque ticket/lease is exposed.')

        def public_owner(self):
            return self.ev('()=>{const d=Realm.diagnostics,v=d.wildSigns?.view;return {active:d.characters.active,scene:d.scene,deaths:Realm.state.adventure.deaths,hp:Realm.state.adventure.hp,view:v?{phase:v.phase,observationReady:v.observationReady,observedBehavior:v.observedBehavior}:null};}')

        def shoot_to_refused_death(self, label):
            self.walk_sign('wild-signs-pest-contact'); self.close()
            self.check('canonical actual equipped bow is retained', self.diag()['adventure']['weapon']['style'] == 'bow')
            for _ in range(12):
                self.page.keyboard.press('Tab')
                if self.diag()['adventure']['tactics'].get('target') == PEST: break
            self.check('native target is the actual new pest', self.diag()['adventure']['tactics'].get('target') == PEST)
            before = self.state(); arrows = set(); shots = 0; started = time.monotonic(); self.refuse(True)
            try:
                while time.monotonic()-started < NATIVE_FIGHT_SECONDS:
                    d = self.diag(); enemy = next((e for e in d['adventure']['enemies'] if e['id'] == PEST), None)
                    self.check('live real pest and player still exist', enemy is not None and self.state()['adventure']['hp'] > 0)
                    if enemy['hp'] == 0:
                        kill_seconds = time.monotonic()-started
                        self.check('real kill occurred within its actual120 second wall deadline', kill_seconds <= NATIVE_FIGHT_SECONDS)
                        break
                    self.page.keyboard.press('f'); shots += 1
                    for _ in range(6):
                        for a in self.diag()['adventure']['arrows']: arrows.add(a['id'])
                        self.page.wait_for_timeout(80)
                else: raise TimeoutError('Actual bow fight did not finish within 120 seconds')
                self.panel(); paused = self.state(); raw = self.ev('()=>localStorage.getItem(RealmCharacters.KEY)')
                self.check('real projectile kill retains unsaved current dead proof', bool(arrows) and shots > 0 and self.ev('()=>window.__flRefused') > 0 and not self.signs()['cleared'])
                self.check('actual pest death gives zero generic rewards/history',
                           paused['sandbox']['inventory'] == before['sandbox']['inventory']
                           and all(paused['adventure'][k] == before['adventure'][k] for k in ('coins','xp','ore','defeated','drops')))
                self.action('retry-clearance', live=True)
                self.check('same paused dead proof refuses atomically and remains retryable',
                           self.state() == paused and self.ev('()=>localStorage.getItem(RealmCharacters.KEY)') == raw and not self.signs()['cleared']
                           and self.page.locator('[data-rpg="wild-signs-retry-clearance"]:not([disabled])').count() == 1)
                self.row.setdefault('actualFights', []).append(dict(label=label, shots=shots, projectileIds=sorted(arrows), killSeconds=kill_seconds, refusalWallSeconds=time.monotonic()-started, quotaRefused=True))
                return copy.deepcopy(self.signs())
            finally: self.refuse(False)

        def death_and_clearance_owners(self, source):
            self.prefix(source, reverse=True)
            original_mode = self.state()['adventure']['companion']['mode']; self.companion_mode('stay')
            self.panel(); self.check('actual unrecorded witnessed browse survives harmless native companion save', self.signs_view()['view']['observationReady'] is True and not self.signs()['observed'])
            self.row['predeathDeparture'] = self.public_owner()
            target = self.ev('()=>RealmWorldFoundations.definition("earthlands").enemies.find(e=>e.id==="earthlands-coppice-skitter")')
            self.check('unchanged baseline hostile is canonical and still alive, never respawned',
                       target is not None and target['x']==-29 and target['z']==-20
                       and any(e['id']==BASELINE and e['hp']>0 for e in self.diag()['adventure']['enemies']))
            self.walk_world('field-water'); self.walk_keys(dict(x=target['x'],z=target['z'])); self.real_death()
            self.fresh_watch('DEATH_FRESH'); self.native_observe()
            self.walk_sign('pest-scrape'); self.action('read', 'pest-scrape'); self.action('choose', 'cleared-pocket')
            expected = self.shoot_to_refused_death('BEFORE_SWITCH')
            self.switch('character-1'); self.switch('character-2'); self.expired_clearance(expected, 'SWITCH_HOME')
            self.enter(); self.expired_clearance(expected, 'SWITCH_NEW_OUTING')
            self.shoot_to_refused_death('FRESH_AFTER_SWITCH'); self.action('retry-clearance', live=True)
            self.check('new real fight plus fresh original retry records clearance', self.signs()['cleared'] is True)
            self.companion_mode(original_mode); self.guard(); self.restart('CLEARED_COLD')

        def refused_claim(self, capacity):
            self.panel(); before = self.state(); raw = self.ev('()=>localStorage.getItem(RealmCharacters.KEY)')
            self.check('ready fee is still unpaid', ready_signed(before) and self.diag()['adventure']['paused'] is True)
            if not capacity: self.refuse(True)
            try:
                self.action('claim', live=True)
                self.check('refused claim preserves exact paused wholeworld and native bytes',
                           self.state() == before and self.ev('()=>localStorage.getItem(RealmCharacters.KEY)') == raw and not self.signs()['claimed'])
                self.check('actual controller discloses refusal', ('Make room' if capacity else 'refus') in self.page.locator('[data-wild-signs-notice]').inner_text())
                if not capacity: self.check('actual Store quota write was attempted', self.ev('()=>window.__flRefused') > 0)
            finally:
                if not capacity: self.refuse(False)
            return before

        def craft_beds(self):
            self.home(); self.workspace('craft')
            self.click('[data-rpg="craft-filter"][data-id="building"]'); self.click('[data-rpg="recipe"][data-id="bed"]')
            self.check('actual canonical recipe is nonstation 1 bed for 3 wood/2 fibre',
                       self.ev('()=>{const r=RealmSandbox.RECIPES.find(r=>r.id==="bed");return {id:r.id,out:r.out,cost:r.cost,station:r.station};}') == BED)
            start = self.state()
            for index in range(2):
                before = self.state(); self.click('[data-rpg="craft"][data-id="bed"]'); after = self.state()
                self.check('ordinary craft spends exact materials and preserves signs/payment',
                           after['sandbox']['inventory'] == bed_inventory(before['sandbox']['inventory'])
                           and after['earthWildSigns'] == before['earthWildSigns']
                           and after['adventure'] == before['adventure'])
                item_name = self.ev('()=>RealmSandbox.ITEMS.bed.name')
                expected = crafted_sandbox(before['sandbox'], after['sandbox'], item_name)
                self.check('one exact canonical craft preserves every other sandbox fact and receipt', expected is not None)
                expected.pop('inventory'); expected.pop('elapsed')
                self.original_facts['sandbox'] = expected; self.guard()
            end = self.state(); self.row['capacityCrafts'] = dict(recipe=BED, count=2, before=start['sandbox']['inventory'], after=end['sandbox']['inventory'], location='valley', native=True)

        def capacity_and_retry(self, source):
            self.row['boundary'] = True
            original = json.loads(Path(source).read_text(encoding='utf-8')); derivative = capacity_derivative(original)
            file = self.folder / 'LABELLED_NEGATIVE_FIBER_999.json'; dump(file, derivative); suite.validate_source(self.args.root, file)
            self.report.setdefault('generatedInputs', {})[str(file)] = sha(file)
            self.row['negativeFixture'] = dict(kind='capacity-only', source=str(source), sourceSha256=sha(source), derivative=str(file), derivativeSha256=sha(file), exactChange='sandbox.inventory.fiber -> 999', positiveQualification=False)
            self.start(); self.import_world(file); self.origin_world = derivative; self.original_facts = self.stable_facts(derivative)
            self.check('native negative import retains all original owners and exact capacity economy', incoming_preserved(base, derivative, self.state()))
            self.enter(); self.walk_sign('elderweald-sela'); self.refused_claim(capacity=True)
            self.capture('CAPACITY_REFUSED'); self.craft_beds()
            self.enter(); self.walk_sign('elderweald-sela'); before = self.refused_claim(capacity=False)
            # Directly click the current paused panel; reopening would invalidate
            # the exact refusal baseline by permitting an ordinary Core interval.
            self.action('claim', live=True); after = self.guard()
            self.check('same earned fee retries once after real craft room/quota removal', payment(before, after))
            self.check('paid page cannot offer a second fee', self.page.locator('[data-rpg="wild-signs-claim"]:not([disabled])').count() == 0)
            self.capture('CAPACITY_RETRY_PAID'); self.restart('CAPACITY_PAID_COLD')
    return Boundaries


def installed_callers(root, suite_path):
    """Read-only exact installed caller identity/commit check, also for admission."""
    root = Path(root).resolve()
    need(Path(__file__).resolve() == root/'tools/earth_wild_signs_boundaries_browser.py'
         and Path(suite_path).resolve() == root/'tools/earth_wild_signs_browser.py',
         'Actual admission requires the exact installed reviewed callers')
    git = ['git', '-c', 'core.longpaths=true', '-C', str(root)]
    callers = ['tools/earth_wild_signs_boundaries_browser.py', 'tools/earth_wild_signs_browser.py']
    subprocess.check_output(git+['ls-files', '--error-unmatch', '--']+callers, text=True)
    need(not subprocess.check_output(git+['status', '--porcelain', '--untracked-files=all', '--']+callers,
                                     text=True).strip(), 'Both native callers must be committed and unchanged')


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('root','suite','cohort','original-cohort','output'): parser.add_argument('--'+name, type=Path, required=True)
    parser.add_argument('--renderer', choices=('hardware','software'), required=True)
    parser.add_argument('--check-only', action='store_true')
    args = parser.parse_args(argv); absolute = args.output.is_absolute(); args.root = args.root.resolve(); args.output = args.output.resolve()
    need(absolute and not args.output.exists() and args.root not in args.output.parents and args.output != args.root
         and (os.name != 'nt' or args.output.drive.lower() == 'd:'), 'Fresh absolute bounded D output outside ROOT required')
    installed_callers(args.root, args.suite)
    suite = load_suite(args.suite); suite.clean_source_tree(args.root); base = suite.load_base(args.root)
    rows, frozen, epoch = suite.preflight(args.root, args.cohort, args.original_cohort, base)
    frozen[str(Path(args.suite).resolve())] = sha(args.suite); frozen[str(Path(__file__).resolve())] = sha(__file__)
    if args.check_only:
        print(json.dumps(dict(status='admitted-only', head=epoch['head'], inputs=frozen, browserExecuted=False, serverStarted=False, filesystemWrites=0), indent=2)); return
    from playwright.sync_api import sync_playwright
    args.output.mkdir(); report = dict(status='running', head=epoch['head'], html_sha256=epoch['htmlSha256'], harnessSha256=sha(__file__), admittedInputs=frozen,
        cases={}, browserErrors=[], externalRequests=[], errors=[], execution='ordinary-RAF/original-native-input', humanAcceptance=False, nativeTicketVisibility=False)
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw): super().__init__(*a, directory=str(args.root), **kw)
        def log_message(self, *a): pass
    server = ThreadingHTTPServer(('127.0.0.1',0), Handler); threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = 'http://127.0.0.1:'+str(server.server_port); report['origin'] = origin; Native = driver_class(suite, base)
    try:
        with sync_playwright() as pw:
            blade = Native(pw, args, report, origin, 'ready-observe-switch-import')
            try: ready = blade.observation_owners(rows['blade'])
            finally: blade.finish()
            bow = Native(pw, args, report, origin, 'genuine-death-clearance-switch')
            try: bow.death_and_clearance_owners(rows['bow'])
            finally: bow.finish()
            capacity = Native(pw, args, report, origin, 'SYNTHETIC-fiber999-signed-capacity-retry')
            try: capacity.capacity_and_retry(ready)
            finally: capacity.finish()
        need(not report['browserErrors'] and not report['externalRequests'], 'Runtime errors/external requests retained')
        need(all(Path(k).is_file() and sha(k)==v for k,v in frozen.items()), 'Input bytes changed during native execution')
        need(all(Path(k).is_file() and sha(k)==v for k,v in report.get('generatedInputs',{}).items()), 'Generated actual/negative source bytes changed during native execution')
        need(base.current_epoch(args.root)==epoch, 'Actual source HEAD changed during native execution')
        suite.clean_source_tree(args.root); installed_callers(args.root, args.suite); report['status'] = 'passed'
    except Exception:
        report['status'] = 'failed'; report['errors'].append(traceback.format_exc()); raise
    finally:
        server.shutdown(); server.server_close(); report['serverClosed'] = True
        report['retention'] = 'All isolated synthetic profiles, failures, close/native-byte receipts and negative derivatives retained; no deletion, video or personal profile.'
        dump(args.output/'WILD_SIGNS_BOUNDARIES_REPORT.json', report)


if __name__ == '__main__': main()
