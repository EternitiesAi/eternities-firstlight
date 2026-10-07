"""CPU preparation only: actual companion callers, miniature negative hosts.

No browser, renderer, native event, grazer witness or gameplay proof is issued.
The sole importable derivative in the planned runner is explicitly capacity-only.
"""
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
import ast
import copy
from contextlib import nullcontext
import importlib.util
import io
import json
import os
import subprocess
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
ROOT = Path(os.environ.get('FIRSTLIGHT_ROOT', str(HERE.parent))).resolve()
DRIVER = Path(os.environ.get('FIRSTLIGHT_WILD_BOUNDARY_DRIVER',str(ROOT/'tools/earth_wild_signs_boundaries_browser.py'))).resolve()
spec = importlib.util.spec_from_file_location('wild_signs_prepared_boundaries', DRIVER)
N = importlib.util.module_from_spec(spec); spec.loader.exec_module(N)
SUITE_FILE = Path(os.environ.get('FIRSTLIGHT_WILD_SIGNS_DRIVER',str(ROOT/'tools/earth_wild_signs_browser.py'))).resolve()
S = N.load_suite(SUITE_FILE); H = S.load_base(ROOT)


def negative_world():
    """Not Core-importable: deliberately miniature capacity/controller host."""
    w = dict(earthWildSigns=dict(version=1,accepted=True,evidence=['feeding-track','timber-gouge','pest-scrape'],
                                observed=True,resolution='signed-loop',cleared=False,claimed=False),
             adventure=dict(coins=12,xp=7,ore=2,hp=100,deaths=0,tonics=3,elapsed=4,revision=3),
             sandbox=dict(inventory=dict(fiber=6,wood=10,bed=0,stone=2),revision=0,elapsed=4,
                          recentCommands=[],stats=dict(crafted=0,gathered=0,harvested=0),
                          placed=[],bridge=True,nodes=[],nextId=1,cooldownUntil=0,milestones=[]),
             localLife=dict(records={N.LOAD:dict(accepted=True,choice='south-stormfall',steps=['arrive-a'],claimed=True)}),
             player=dict(x=18,z=6,yaw=0),settings=dict(cameraViews={'follow':{'yaw':.3}}))
    return w


class MiniatureBase:
    Native = object
    distance = staticmethod(H.distance)
    native_keys = staticmethod(H.native_keys)
    import_preserved = staticmethod(lambda a,b:a['adventure']['coins']==b['adventure']['coins'] and a['sandbox']['inventory']==b['sandbox']['inventory'])


class OracleTests(unittest.TestCase):
    def test_derivative_has_only_one_explicit_capacity_change(self):
        w = negative_world(); result = N.capacity_derivative(w)
        self.assertEqual(result['sandbox']['inventory']['fiber'], 999)
        self.assertTrue(N.capacity_relationship(w, result)); self.assertEqual(w['sandbox']['inventory']['fiber'], 6)
    def test_capacity_cannot_hide_new_progress_economy_gear_or_copied_owner(self):
        w = negative_world(); result = N.capacity_derivative(w)
        for key in ('coins','hp','fifth','claim','oldowner'):
            changed = copy.deepcopy(result)
            if key in ('coins','hp'): changed['adventure'][key] += 1
            elif key == 'fifth': changed['localLife']['records'][N.LOAD]['steps'].append('arrive-forged')
            elif key == 'claim': changed['earthWildSigns']['claimed'] = True
            else: changed['earthExpedition'] = {'planted':True}
            self.assertFalse(N.capacity_relationship(w, changed), key)
    def test_unearned_or_resource_short_source_has_no_capacity_fallback(self):
        for key in ('observed','resolution','claimed','wood','bed','fiber'):
            w = negative_world()
            if key == 'observed': w['earthWildSigns'][key] = False
            elif key == 'resolution': w['earthWildSigns'][key] = 'cleared-pocket'
            elif key == 'claimed': w['earthWildSigns'][key] = True
            elif key == 'wood': w['sandbox']['inventory'][key] = 5
            elif key == 'bed': w['sandbox']['inventory'][key] = 998
            else: w['sandbox']['inventory'][key] = True
            with self.assertRaises(ValueError, msg=key): N.capacity_derivative(w)
    def test_switch_outgoing_exact_world_allowance_is_only_camera_capture(self):
        w = negative_world(); after = copy.deepcopy(w); after['settings']['cameraViews']['follow']['yaw'] = .9
        self.assertTrue(N.import_equal(w,after))
        for key in ('elapsed','coins','hp'):
            changed = copy.deepcopy(after); changed['adventure'][key] += 1
            self.assertFalse(N.import_equal(w,changed),key)
        after['earthWildSigns']['observed'] = False; self.assertFalse(N.import_equal(w,after))
    def test_incoming_runtime_clock_can_advance_but_owned_economy_cannot(self):
        w = negative_world(); after = copy.deepcopy(w); after['adventure']['elapsed'] += .05
        base = SimpleNamespace(import_preserved=lambda a,b:a['adventure']['coins']==b['adventure']['coins'] and a['sandbox']['inventory']==b['sandbox']['inventory'])
        self.assertTrue(N.incoming_preserved(base,w,after))
        for key in ('coins','fiber','observed','fifth'):
            changed = copy.deepcopy(after)
            if key == 'coins': changed['adventure']['coins'] += 1
            elif key == 'fiber': changed['sandbox']['inventory']['fiber'] += 1
            elif key == 'observed': changed['earthWildSigns']['observed'] = False
            else: changed['localLife']['records'][N.LOAD]['claimed'] = False
            self.assertFalse(N.incoming_preserved(base,w,changed),key)
    def test_fee_oracle_requires_exact_owner_economy_xp_ore(self):
        before = negative_world(); after = copy.deepcopy(before)
        after['earthWildSigns']['claimed'] = True; after['adventure']['coins'] += 4; after['sandbox']['inventory']['fiber'] += 3
        self.assertTrue(N.payment(before,after))
        for key in ('coins','fiber','xp','cleared'):
            changed = copy.deepcopy(after)
            if key == 'fiber': changed['sandbox']['inventory']['fiber'] += 1
            elif key == 'cleared': changed['earthWildSigns']['cleared'] = True
            else: changed['adventure'][key] += 1
            self.assertFalse(N.payment(before,changed),key)
    def test_actual_sandbox_two_beds_match_independent_oracle_and_history(self):
        # Explicit negative capacity specimen of the genuine existing Sandbox;
        # no Core world, optional owner, witness or simulation is manufactured.
        code=r"""const fs=require('node:fs'),assert=require('node:assert/strict'),S=require(process.argv[1]);
const raw=JSON.parse(fs.readFileSync(process.argv[2])),s=S.validate(raw.sandbox);assert.deepEqual(s,raw.sandbox);assert.ok(s.inventory.wood>=6);s.inventory.fiber=999;
const result=[];for(let i=0;i<2;i++){const before=JSON.parse(JSON.stringify(s));const r=S.command(s,{x:2.5,z:6},null,'rpg-craft-CPU-'+i,'craft',{recipe:'bed'});if(!r.ok)throw Error(r.text);result.push({before,after:JSON.parse(JSON.stringify(s)),name:S.ITEMS.bed.name});}console.log(JSON.stringify(result));"""
        fixture=ROOT/'tests/fixtures/earth-homecoming-prerequisites/blade/ALL_TWELVE_PREREQUISITES_EARNED.json'
        run=subprocess.run(['node','-e',code,str(ROOT/'src/sandbox.js'),str(fixture)],capture_output=True,text=True,check=True,timeout=20)
        rows=json.loads(run.stdout)
        self.assertEqual(len(rows),2)
        for r in rows:
            self.assertEqual(N.crafted_sandbox(r['before'],r['after'],r['name']),r['after'])
            for key in ('nodes','milestones','recentCommands','stats','revision'):
                bad=copy.deepcopy(r['after'])
                if key == 'stats':bad[key]['harvested']+=1
                elif key == 'revision':bad[key]+=1
                else:bad[key]=[{'forged':True}]
                self.assertIsNone(N.crafted_sandbox(r['before'],bad,r['name']),key)
        self.assertEqual(rows[-1]['after']['inventory']['fiber'],995)
        self.assertEqual(rows[-1]['after']['inventory']['wood'],rows[0]['before']['inventory']['wood']-6)
        self.assertEqual(rows[-1]['after']['inventory']['bed'],2)
    def test_actual_embedded_readonly_path_uses_real_core_nav_descriptor(self):
        tree=ast.parse(DRIVER.read_text(encoding='utf-8'))
        functions=[n for n in ast.walk(tree) if isinstance(n,ast.FunctionDef) and n.name=='walk_keys']
        calls=[n for n in ast.walk(functions[0]) if isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and n.func.attr=='ev']
        js=next(n.args[0].value for n in calls if isinstance(n.args[0],ast.Constant) and 'pathfind' in n.args[0].value)
        code=r"""const fs=require('node:fs'),vm=require('node:vm'),p=process.argv[1],C=require(p+'/src/core.js'),W=require(p+'/src/world-foundations.js');
const a={x:-15,z:-46},b={x:-29,z:-20},f=vm.runInNewContext('('+fs.readFileSync(0,'utf8')+')',{RealmCore:C,Realm:{diagnostics:{adventure:{player:a}}}}),r=f(b);
if(!r?.length)throw Error('Actual canonical Core nav descriptor required');let last=a;for(const q of r){if(!W.segment('world-earthlands',last,q,.31))throw Error('Unsupported approach');last=q;}
if(C.pathfind(a,b,'world-earthlands')!==null)throw Error('Retained string-argument negative unexpectedly accepted');console.log(JSON.stringify({nodes:r.length,end:last}));"""
        result=subprocess.run(['node','-e',code,str(ROOT)],input=js,text=True,capture_output=True,check=True,timeout=20)
        self.assertEqual(json.loads(result.stdout)['end'],{'x':-29,'z':-20})


class CallerTests(unittest.TestCase):
    def host(self):
        d=object.__new__(N.driver_class(S,MiniatureBase)); d.calls=[]; d.row={'samples':[]}; d.report={}
        d.check=lambda text,ok,detail=None:self.assertTrue(ok,(text,detail))
        d.panel=lambda:d.calls.append(('panel',))
        d.close=lambda:d.calls.append(('close',))
        d.workspace=lambda tab:d.calls.append(('workspace',tab))
        d.page=SimpleNamespace(locator=lambda s:SimpleNamespace(count=lambda:0))
        return d
    def test_original_live_observe_and_clearance_route_never_reopens_workspace(self):
        d=self.host(); d.click=lambda s:d.calls.append(('native-click',s))
        d.action('observe',live=True); d.action('retry-clearance',live=True)
        self.assertEqual([v[0] for v in d.calls],['native-click','native-click'])
        self.assertIn('wild-signs-observe',d.calls[0][1]);self.assertIn('retry-clearance',d.calls[1][1])
    def test_expired_observe_requires_both_no_ready_view_and_no_enabled_control(self):
        expected=negative_world()['earthWildSigns'];expected.update(observed=False,resolution=None,evidence=['timber-gouge','feeding-track'])
        for leak in ('none','view','button','adopted'):
            d=self.host(); actual=copy.deepcopy(expected)
            if leak=='adopted':actual['observed']=True
            d.signs=lambda:actual;d.signs_view=lambda:dict(view={'observationReady':leak=='view'})
            d.page.locator=lambda _:SimpleNamespace(count=lambda:int(leak=='button'))
            if leak=='none':d.expired_observe(expected,'MINIATURE-NO-PROOF')
            else:
                with self.assertRaises(AssertionError,msg=leak):d.expired_observe(expected,'MINIATURE-STALE-NEGATIVE')
    def test_expired_clearance_rejects_old_dead_entry_enabled_retry_or_adoption(self):
        expected=negative_world()['earthWildSigns'];expected['resolution']='cleared-pocket'
        for leak in ('none','dead','button','adopted'):
            d=self.host();actual=copy.deepcopy(expected)
            if leak=='adopted':actual['cleared']=True
            d.signs=lambda:actual;d.diag=lambda:dict(adventure={'enemies':[dict(id=N.PEST,hp=0 if leak=='dead' else 72)]})
            d.page.locator=lambda _:SimpleNamespace(count=lambda:int(leak=='button'))
            if leak=='none':d.expired_clearance(expected,'MINIATURE-NO-DEAD-PROOF')
            else:
                with self.assertRaises(AssertionError,msg=leak):d.expired_clearance(expected,'MINIATURE-STALE-DEATH')
    def test_disabled_original_pointer_attempt_preserves_world_bytes_or_detects_mutation(self):
        for mutate in (False,True):
            d=self.host();w=negative_world();w['earthWildSigns'].update(observed=False,resolution=None,evidence=['timber-gouge','feeding-track'])
            d.state=lambda:copy.deepcopy(w);d.signs=lambda:w['earthWildSigns'];d.signs_view=lambda:dict(view={'observationReady':False})
            d.diag=lambda:dict(adventure={'paused':True});d.ev=lambda _:'EXACT-MINIATURE-PAUSED-BYTES'
            control=SimpleNamespace(count=lambda:1,is_enabled=lambda:False,scroll_into_view_if_needed=lambda:None,bounding_box=lambda:dict(x=2,y=3,width=70,height=20))
            d.page.locator=lambda s:SimpleNamespace(count=lambda:0) if ':not' in s else control
            def mouse(x,y):
                d.calls.append(('native-pointer-attempt',x,y))
                if mutate:w['earthWildSigns']['observed']=True
            d.page.mouse=SimpleNamespace(click=mouse)
            if mutate:
                with self.assertRaises(AssertionError):d.expired_observe(copy.deepcopy(w['earthWildSigns']),'MINIATURE-MUTATION')
            else:
                d.expired_observe(copy.deepcopy(w['earthWildSigns']),'MINIATURE-REFUSAL')
                self.assertEqual(d.calls[-1],('native-pointer-attempt',37,13))
    def test_actual_native_switch_caller_checks_exact_outgoing_snapshot(self):
        for mutate in (False,True):
            d=self.host();w=negative_world();active=['character-2'];saved=copy.deepcopy(w)
            if mutate:saved['adventure']['coins']+=1
            d.diag=lambda:dict(characters={'active':active[0]},scene='valley');d.state=lambda:copy.deepcopy(w);d.slot=lambda _:saved
            d.click=lambda s:active.__setitem__(0,'character-1')
            d.page.wait_for_function=lambda s,**kw:d.calls.append(('native-wait-owner',kw['arg']))
            if mutate:
                with self.assertRaises(AssertionError):d.switch('character-1')
            else:
                d.switch('character-1');self.assertEqual(d.calls[-1],('native-wait-owner','character-1'))
    def test_actual_added_import_native_controls_reject_changed_incoming_economy(self):
        for mutate in (False,True):
            d=self.host();before=negative_world();incoming=copy.deepcopy(before);active=['character-2'];live=[before]
            d.state=lambda:copy.deepcopy(live[0]);d.slot=lambda _:copy.deepcopy(before)
            d.diag=lambda:dict(characters={'active':active[0]},scene='valley')
            def click(s):
                d.calls.append(('native-click',s))
                if 'confirm-import' in s:
                    active[0]='character-3';live[0]=copy.deepcopy(incoming)
                    if mutate:live[0]['adventure']['coins']+=1
            d.click=click
            chooser=SimpleNamespace(value=SimpleNamespace(set_files=lambda file:d.calls.append(('native-file-input',file))))
            d.page.expect_file_chooser=lambda:nullcontext(chooser)
            d.page.wait_for_selector=lambda s:None;d.page.wait_for_function=lambda s,**kw:None
            file=HERE/'MINIATURE_SOURCE_NEVER_WRITTEN.json'
            with patch.object(Path,'read_text',return_value=json.dumps(incoming)),patch.object(N,'sha',return_value='a'*64):
                if mutate:
                    with self.assertRaises(AssertionError):d.import_added(file,'character-3')
                else:
                    d.import_added(file,'character-3')
                    self.assertEqual(d.calls[0],('workspace','characters'))
                    self.assertTrue(any(c[0]=='native-file-input' for c in d.calls))
    def refusal_host(self,mutation=None):
        d=self.host();w=negative_world();w['sandbox']['inventory']['fiber']=999;quota=[False];attempts=[0];raw=['ORIGINAL-MINIATURE-NATIVE-BYTES']
        d.state=lambda:copy.deepcopy(w);d.signs=lambda:copy.deepcopy(w['earthWildSigns'])
        d.diag=lambda:dict(adventure={'paused':True});d.refuse=lambda on:quota.__setitem__(0,on)
        d.ev=lambda s:raw[0] if 'localStorage' in s else attempts[0]
        d.page.locator=lambda _:SimpleNamespace(inner_text=lambda:'refused by quota' if quota[0] else 'Make room for fee')
        def click(selector):
            d.calls.append(('native-click',selector))
            if quota[0]:attempts[0]+=1
            if mutation=='world':w['adventure']['elapsed']+=.0167
            elif mutation=='bytes':raw[0]+='MUTATED'
            elif mutation=='adopted':w['earthWildSigns']['claimed']=True
        d.click=click;return d,w,attempts,quota
    def test_actual_refusal_caller_preserves_full_paused_world_bytes_and_direct_click(self):
        for capacity in (True,False):
            d,w,attempts,quota=self.refusal_host();before=copy.deepcopy(w);self.assertEqual(d.refused_claim(capacity),before)
            self.assertEqual(w,before);self.assertFalse(quota[0]);self.assertEqual(attempts[0],int(not capacity))
            self.assertEqual([c[0] for c in d.calls],['panel','native-click'])
    def test_actual_refusal_oracle_rejects_clock_store_and_claim_mutations(self):
        for mutation in ('world','bytes','adopted'):
            for capacity in (True,False):
                d,_,_,quota=self.refusal_host(mutation)
                with self.assertRaises(AssertionError,msg=(mutation,capacity)):d.refused_claim(capacity)
                self.assertFalse(quota[0],'fault injector released even on failed exact-state oracle')
    def test_new_full_watch_is_never_requested_until_old_ready_proof_is_absent(self):
        d=self.host();expected=negative_world()['earthWildSigns'];expected['observed']=False
        d.enter=lambda:d.calls.append(('native-enter',));d.walk_sign=lambda p:d.calls.append(('native-walk',p));d.configure=lambda _:d.calls.append(('native-look-configure',))
        d.signs=lambda:expected;d.signs_view=lambda:dict(view={'observationReady':True});d.watch=lambda _:d.calls.append(('watch',))
        with self.assertRaises(AssertionError):d.fresh_watch('STALE')
        self.assertFalse(any(c[0]=='watch' for c in d.calls))
    def test_real_death_caller_refuses_no_hit_or_wounded_enemy_without_manual_fallback(self):
        # Negative only: no successful death or positive hostile event is forged.
        for failure in ('no-damage','enemy-wounded'):
            d=self.host();w=negative_world();w['earthWildSigns']['resolution']='cleared-pocket'
            d.state=lambda:copy.deepcopy(w);d.walk_sign=lambda _:None
            d.public_owner=lambda:dict(active='MINIATURE',scene='world-earthlands',view=None)
            snapshots=iter([dict(id=N.BASELINE,hp=72,mode='idle'),dict(id=N.BASELINE,hp=71 if failure=='enemy-wounded' else 72,mode='windup')])
            d.diag=lambda:dict(adventure={'enemies':[next(snapshots)],'paused':False},scene='world-earthlands')
            d.page.wait_for_timeout=lambda _:None
            with patch.object(N.time,'monotonic',side_effect=[0,1,241]):
                with self.assertRaises((AssertionError,TimeoutError),msg=failure):d.real_death()
    def test_failed_fight_always_restores_real_storage_fault_hook(self):
        d=self.host();w=negative_world();d.state=lambda:copy.deepcopy(w);d.walk_sign=lambda _:None
        enemy=dict(id=N.PEST,hp=72);d.diag=lambda:dict(adventure={'weapon':{'style':'bow'},'tactics':{'target':N.PEST},'enemies':[enemy]})
        quota=[];d.refuse=lambda on:quota.append(on);d.page.keyboard=SimpleNamespace(press=lambda _:None)
        with patch.object(N.time,'monotonic',side_effect=[0,121]):
            with self.assertRaises(TimeoutError):d.shoot_to_refused_death('NO-PROOF')
        self.assertEqual(quota,[True,False])
    def test_near_terminal_native_approach_uses_remaining_wall_budget_and_propagates_deadline(self):
        d=self.host();d.diag=lambda:dict(adventure={'player':{'x':-15,'z':-46},'paused':False},camera={'yaw':0})
        d.state=lambda:dict(adventure={'hp':100});d.ev=lambda *args:[{'x':-29,'z':-20}]
        budgets=[]
        def held(keys,timeout_ms):
            budgets.append(timeout_ms);raise H.NativeInputDeadline(timeout_ms,0,timeout_ms)
        d.hold_native_keys_for_frames=held
        with patch.object(N.time,'monotonic',side_effect=[0,239.983,239.983]):
            with self.assertRaises(H.NativeInputDeadline):d.walk_keys({'x':-29,'z':-20})
        self.assertTrue(1<=budgets[0]<=17)


class SourceBoundaryTests(unittest.TestCase):
    def test_reads_never_invoke_positive_witness_movement_damage_or_owner_issuers(self):
        tree=ast.parse(DRIVER.read_text(encoding='utf-8'))
        for call in ast.walk(tree):
            if isinstance(call,ast.Call) and isinstance(call.func,ast.Attribute) and call.func.attr=='ev' and call.args and isinstance(call.args[0],ast.Constant):
                js=call.args[0].value
                for forbidden in ('Realm.test','observationTicket(','acknowledge(','grazerNativeIntent=','grazerPresentedFrame=','.takeDamage(','.damageEnemy(','.command(','.manual(','.tick(','.reset('):
                    self.assertNotIn(forbidden,js)
    def test_exact_frozen_suite_and_current_admission_fail_before_resources(self):
        self.assertEqual(N.sha(SUITE_FILE),N.FROZEN_SUITE_SHA256)
        with self.assertRaisesRegex(ValueError,'Exact frozen'):
            N.load_suite(HERE/'ABSENT-FROZEN-SUITE.py')
        temporary=tempfile.TemporaryDirectory(prefix='wild-signs-boundary-',dir=os.environ.get('TEMP'))
        self.addCleanup(temporary.cleanup)
        output=Path(temporary.name)/'native-not-created'
        # Explicit miniature caller transport. Real committed-caller guards have separate negative coverage.
        with (patch.object(N,'installed_callers'),patch.object(S,'clean_source_tree'),patch.object(S,'preflight',side_effect=ValueError('missing actual current claimed-fifth cohort')),
              patch.object(N,'load_suite',return_value=S),patch.object(N,'ThreadingHTTPServer',side_effect=AssertionError('server prohibited'))):
            with self.assertRaisesRegex(ValueError,'current claimed-fifth'):
                N.main(['--root',str(ROOT),'--suite',str(SUITE_FILE),'--cohort','MISSING','--original-cohort','MISSING',
                        '--output',str(output.resolve()),'--renderer','hardware','--check-only'])
        self.assertFalse(output.exists())
    def test_check_only_returns_no_native_or_storage_qualification(self):
        temporary=tempfile.TemporaryDirectory(prefix='wild-signs-boundary-',dir=os.environ.get('TEMP'))
        self.addCleanup(temporary.cleanup)
        output=Path(temporary.name)/'native-not-created'
        # Explicit miniature caller transport; this method never admits a current gameplay source.
        with (patch.object(N,'installed_callers'),patch.object(N,'load_suite',return_value=S),patch.object(S,'clean_source_tree'),patch.object(S,'preflight',return_value=({}, {}, {'head':'a'*40})),
              patch.object(N,'ThreadingHTTPServer',side_effect=AssertionError('server prohibited')),patch('sys.stdout',new_callable=io.StringIO) as console):
            N.main(['--root',str(ROOT),'--suite',str(SUITE_FILE),'--cohort','MISSING','--original-cohort','MISSING',
                    '--output',str(output.resolve()),'--renderer','hardware','--check-only'])
        result=json.loads(console.getvalue());self.assertFalse(result['browserExecuted']);self.assertFalse(result['serverStarted']);self.assertEqual(result['filesystemWrites'],0)
        self.assertFalse(output.exists())


if __name__=='__main__':unittest.main(verbosity=2)
