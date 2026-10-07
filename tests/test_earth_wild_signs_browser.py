"""Portable caller tests plus optional actual current-cohort admission.

Miniature positive file/DOM/storage hosts remain explicitly synthetic.

These tests exercise the actual proposed admission, live click/refusal and watch
callers. They never start Playwright, issue a grazer witness or qualify pixels.
"""
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
import ast
import copy
import importlib.util
import io
import json
import os
import subprocess
import tempfile
import unittest

HERE=Path(__file__).resolve().parent
ROOT=Path(os.environ.get('FIRSTLIGHT_ROOT',str(HERE.parent))).resolve()
DRIVER=Path(os.environ.get('FIRSTLIGHT_WILD_SIGNS_DRIVER',str(ROOT/'tools/earth_wild_signs_browser.py'))).resolve()
spec=importlib.util.spec_from_file_location('prepared_wild_native',DRIVER)
N=importlib.util.module_from_spec(spec);spec.loader.exec_module(N)
H=N.load_base(ROOT)


def world():
    # Intentionally miniature synthetic records, never a Core-importable save.
    keys=('journeys','realmTrails','hellCampaign','heavenCampaign','atlantisCampaign','cosmosCampaign',
          'earthHomecoming','bridgeCommunity','homeHistory','notes','score','scoreRevision','retreat',
          'visitor','flowers','seed','version','visited')
    w={k:{'retained':k} for k in keys}
    w.update(earthExpedition={'story':{'claimed':True,'branch':'stormfall-recovery'}},
             adventure={'coins':12,'xp':5,'ore':2,'hp':100,'elapsed':1,'revision':4,'stamina':90,
                        'receipts':[{'id':'old-real-receipt'}],'equipment':{'weapon':'old-bow'},
                        'gemSockets':{'old-bow':'old-gem'},'companion':{'bonded':True,'mode':'follow'}},
             localLife={'records':{k:{'old':k} for k in H.OLD_IDS}},
             sandbox={'inventory':{'wood':4,'fiber':5,'stone':2},'elapsed':1,'bridge':{'original':True}},
             earthWildSigns=copy.deepcopy(N.FRESH))
    w['localLife']['records'][N.LOAD]=copy.deepcopy(H.FRESH)
    return w


class SyntheticAdmission:
    """Named in-memory file/producer host; no installed validator substituted in production."""
    def __init__(self):
        self.root=(HERE/'SYNTHETIC_REPO_NOT_CREATED').resolve();self.cohort=(HERE/'SYNTHETIC_EVIDENCE_NOT_CREATED/WILD_SIGNS_COHORT.json').resolve()
        self.old=(HERE/'SYNTHETIC_OLD_NOT_CREATED/FIRST_LOAD_COHORT.json').resolve()
        self.epoch=dict(mode='current-command-earned',head='a'*40,htmlSha256='1'*64,
                        runtimeSources={'src/'+v:'2'*64 for v in N.MODULES},callerSha256='3'*64)
        self.original={};self.values={};self.hashes={};self.canon={}
        for variant in ('blade','bow','veteran'):
            before=world();source=self.old.parent/variant/'04_FIRST_CLAIMED.json';journey=source.parent/'JOURNEY.json'
            self.original[variant]=dict(source=source,journey=journey,world=before)
            self.hashes[str(source)]='4'*64;self.hashes[str(journey)]='5'*64
        self.hashes.update({str(self.old):'6'*64,str(self.root/N.PRODUCER):'7'*64,str(self.root/N.HELPER):'8'*64,
                           str(self.root/'FIRSTLIGHT_VALLEY.html'):'1'*64})
        self.manifest={'schema':'wild-signs-native-cohort-v1','epoch':{k:v for k,v in self.epoch.items() if k!='callerSha256'},
                       'originalCohortSha256':'6'*64,'variants':{},
                       'binding':dict(mode='installed-current-modules',sourceHead='a'*40,sourceHeadAfter='a'*40,inputsUnchanged=True)}
        self.manifest['epoch']['producer']=dict(path=N.PRODUCER,sha256='7'*64)
        for variant in ('blade','bow','veteran'):
            r='north-stormfall' if variant=='veteran' else 'south-stormfall'
            ids=['arrive-'+str(i) for i in range(12 if variant=='veteran' else 5)]
            after=copy.deepcopy(self.original[variant]['world']);after['adventure']['coins']+=4
            after['sandbox']['inventory']['wood']+=2;after['sandbox']['inventory']['fiber']+=2
            after['localLife']['records'][N.LOAD]=dict(accepted=True,choice=r,steps=ids,claimed=True)
            source=self.cohort.parent/variant/'00_CLAIMED_LOAD_FRESH_SIGNS.json';journey=source.parent/'WILD_SIGNS_PREREQUISITES.json'
            self.values[str(source)]=after;self.canon[str(source)]=dict(ok=True,choice=r,arrivalIds=ids)
            receipt=dict(schema='wild-signs-native-prerequisites-v1',status='passed',variant=variant,
                         sourceHead='a'*40,producerSha256='7'*64,helperSha256='8'*64,
                         sourceHashes=self.epoch['runtimeSources'],originalCohortSha256='6'*64,
                         originalSourceSha256='4'*64,originalJourneySha256='5'*64,
                         coldSavedEquality=True,canonicalPreservation=True,priorReceiptsPreserved=True,
                         browserPersistence=False,humanPacing=False,
                         injections={k:0 for k in ('positionEdits','inventoryGrants','hpEdits','manualDamage','plantedDefeats')},
                         metrics=dict(observationFrames=0,clearanceCalls=0,combatCommands=0,coldLoads=1,
                                      claims=[dict(owner=N.LOAD)],workerFrames=30,workerDistance=12,arrivalIds=ids,
                                      positionEdits=0,inventoryGrants=0,hpEdits=0,plantedDefeats=0),
                         load=dict(choice=r,arrivalIds=ids,claimed=True,motionFrames=30,physicalDistance=12))
            self.values[str(journey)]=receipt
            for k,p in (('source',source),('journey',journey)):
                self.hashes[str(p)]='9'*64
                self.manifest['variants'].setdefault(variant,{})[k]=dict(path=p.relative_to(self.cohort.parent).as_posix(),sha256='9'*64)
        self.values[str(self.cohort)]=self.manifest
        self.base=SimpleNamespace(current_preflight=lambda *_:self.original,current_epoch=lambda *_:copy.deepcopy(self.epoch),preserved=H.preserved)
    def run(self):
        with patch.object(Path,'is_file',return_value=True),patch.object(Path,'read_text',return_value='synthetic-module'),\
             patch.object(N,'read',side_effect=lambda p:copy.deepcopy(self.values[str(p)])),\
             patch.object(N,'sha',side_effect=lambda p:self.hashes.get(str(p),'2'*64)):
            return N.preflight(self.root,self.cohort,self.old,self.base,lambda _,p:copy.deepcopy(self.canon[str(p)]))
    def paid(self):return self.values[str(self.cohort.parent/'blade/00_CLAIMED_LOAD_FRESH_SIGNS.json')]
    def receipt(self):return self.values[str(self.cohort.parent/'blade/WILD_SIGNS_PREREQUISITES.json')]


class AdmissionTests(unittest.TestCase):
    def test_synthetic_host_exercises_all_three_admission_relationships(self):
        rows,bound,epoch=SyntheticAdmission().run();self.assertEqual(set(rows),{'blade','bow','veteran'});self.assertGreater(len(bound),15);self.assertEqual(epoch['mode'],'current-command-earned')
    def test_missing_real_new_cohort_refuses_before_launch_or_output(self):
        with self.assertRaisesRegex(ValueError,'Explicit current'):
            N.preflight(ROOT,HERE/'PENDING_NO_ACTUAL_COHORT.json',HERE/'PENDING_NO_ORIGINAL.json')
    def test_historical_or_drifted_epoch_refused(self):
        for key,value in (('head','b'*40),('mode','historical-frozen-native03')):
            f=SyntheticAdmission();f.manifest['epoch'][key]=value
            with self.assertRaisesRegex(ValueError,'current HEAD'):f.run()
    def test_original_economy_only_coin_and_inventory_edits_refused(self):
        for kind in ('coins','wood','stone'):
            f=SyntheticAdmission()
            if kind=='coins':f.paid()['adventure']['coins']+=1
            else:f.paid()['sandbox']['inventory'][kind]+=1
            with self.assertRaises(ValueError):f.run()
    def test_old_history_receipts_and_equipment_are_protected(self):
        for kind in ('equipment','receipts','companion'):
            f=SyntheticAdmission();f.paid()['adventure'][kind]={'forged':True}
            with self.assertRaisesRegex(ValueError,'protected'):f.run()
    def test_labelled_route_cannot_override_actual_story_branch(self):
        f=SyntheticAdmission();f.original['blade']['world']['earthExpedition']['story']['branch']='managed-coppice'
        f.paid()['earthExpedition']['story']['branch']='managed-coppice'
        with self.assertRaisesRegex(ValueError,'route'):f.run()
    def test_paid_progress_and_fresh_signs_are_independently_required(self):
        for kind in ('unpaid','planted'):
            f=SyntheticAdmission()
            if kind=='unpaid':f.paid()['localLife']['records'][N.LOAD]['claimed']=False
            else:f.paid()['earthWildSigns']['observed']=True
            with self.assertRaises(ValueError):f.run()
    def test_unsafe_or_duplicate_source_links_refused(self):
        f=SyntheticAdmission();f.manifest['variants']['blade']['source']['path']='../escape.json'
        with self.assertRaisesRegex(ValueError,'inside'):f.run()
        f=SyntheticAdmission();f.manifest['variants']['bow']['source']=f.manifest['variants']['blade']['source']
        with self.assertRaisesRegex(ValueError,'Duplicate'):f.run()
    def test_planted_proofs_boolean_zero_and_inconsistent_motion_refused(self):
        for key in ('observation','boolean','distance','hidden-metric-edit'):
            f=SyntheticAdmission()
            if key=='observation':f.receipt()['metrics']['observationFrames']=1
            elif key=='boolean':f.receipt()['injections']['hpEdits']=False
            elif key=='distance':f.receipt()['load']['physicalDistance']=0
            else:f.receipt()['metrics']['hpEdits']=1
            with self.assertRaises(ValueError):f.run()
    def test_actual_legacy_file_cannot_be_admitted_as_current_paid_fifth_fresh_signs(self):
        # Genuine retained repository fixture; no miniature fixture substitutes
        # for the actual installed validators. At intake the future Data is absent;
        # after installation this older raw file still cannot silently migrate.
        source=ROOT/'tests/fixtures/earth-homecoming-prerequisites/blade/ALL_TWELVE_PREREQUISITES_EARNED.json'
        p=subprocess.run(['node','-e',N.VALIDATE_JS,str(ROOT),str(source)],capture_output=True,text=True,timeout=30)
        self.assertNotEqual(p.returncode,0)
        self.assertNotIn('new C.Simulation',N.VALIDATE_JS)
    def test_production_git_admission_refuses_untracked_future_owner_and_dirty_tracked_source(self):
        with patch.object(N.subprocess,'check_output',side_effect=['tracked leaves',' M src/app.js\n']):
            with self.assertRaisesRegex(ValueError,'committed unchanged'):N.clean_source_tree(ROOT)
        with patch.object(N.subprocess,'check_output',side_effect=subprocess.CalledProcessError(1,['git'],output='not tracked')):
            with self.assertRaises(subprocess.CalledProcessError):N.clean_source_tree(ROOT)
    def test_check_only_admission_never_creates_output_server_or_browser(self):
        temporary=tempfile.TemporaryDirectory(prefix='wild-signs-admission-',dir=os.environ.get('TEMP'))
        self.addCleanup(temporary.cleanup)
        output=(Path(temporary.name)/'native-not-created').resolve();self.assertFalse(output.exists())
        with patch.object(N,'clean_source_tree'),patch.object(N,'load_base'),\
             patch.object(N,'preflight',return_value=({'blade':{},'bow':{},'veteran':{}},{},{'head':'a'*40})),\
             patch.object(N,'ThreadingHTTPServer',side_effect=AssertionError('server must not start')),\
             patch('sys.stdout',new_callable=io.StringIO) as console:
            N.main(['--root',str(ROOT),'--cohort','SYNTHETIC','--original-cohort','SYNTHETIC-OLD',
                    '--output',str(output),'--renderer','hardware','--check-only'])
        value=json.loads(console.getvalue());self.assertEqual(value['status'],'admitted-only')
        self.assertFalse(value['browserExecuted']);self.assertFalse(value['serverStarted']);self.assertFalse(output.exists())


class FakeDriverBase:
    Native=object
    distance=staticmethod(H.distance)


class CallerTests(unittest.TestCase):
    def harness(self):
        d=object.__new__(N.driver_class(FakeDriverBase));d.row={'samples':[]};d.calls=[]
        d.check=lambda text,ok,detail=None: self.assertTrue(ok,(text,detail))
        d.workspace=lambda tab:d.calls.append(('workspace',tab))
        d.click=lambda selector:d.calls.append(('native-click',selector))
        d.page=SimpleNamespace(wait_for_selector=lambda s:d.calls.append(('wait',s)),wait_for_timeout=lambda _:None)
        return d
    def test_live_observe_and_retry_route_original_native_control_without_menu_reentry(self):
        d=self.harness();d.action('observe',live=True);d.action('retry-clearance',live=True)
        self.assertEqual(len(d.calls),2);self.assertTrue(all(c[0]=='native-click' for c in d.calls))
        self.assertIn('wild-signs-observe',d.calls[0][1]);self.assertIn('wild-signs-retry-clearance',d.calls[1][1])
    def test_ordinary_action_opens_actual_journal_invitation_before_control(self):
        d=self.harness();d.action('read','feeding-track')
        self.assertEqual(d.calls[0],('workspace','journal'));self.assertIn('wild-signs-open',d.calls[1][1]);self.assertIn('feeding-track',d.calls[-1][1])
    def observation_host(self, mutate=False):
        # Explicitly synthetic paused Storage/UI host, no trusted event fixture.
        d=self.harness();s=world();s['earthWildSigns']['accepted']=True
        s['earthWildSigns']['evidence']=['timber-gouge','feeding-track'];refused=[False];attempts=[0]
        d.panel=lambda:d.calls.append(('menu',));d.state=lambda:copy.deepcopy(s);d.signs=lambda:copy.deepcopy(s['earthWildSigns'])
        d.signs_view=lambda:dict(view={'observationReady':True})
        d.refuse=lambda on:refused.__setitem__(0,on)
        d.ev=lambda expression:'exact-paused-native-bytes' if 'localStorage' in expression else attempts[0]
        d.guard=lambda:None
        def click(_):
            if refused[0]:
                attempts[0]+=1
                if mutate:s['adventure']['coins']+=1
            else:s['earthWildSigns']['observed']=True
        d.click=click;return d,s,attempts
    def test_actual_observe_caller_preserves_refused_state_then_explicit_retry(self):
        d,s,attempts=self.observation_host();d.native_observe(quota=True)
        self.assertEqual(attempts[0],1);self.assertTrue(s['earthWildSigns']['observed']);self.assertEqual(d.calls,[('menu',)])
    def test_refused_world_mutation_is_not_hidden_by_new_baseline(self):
        d,_,_=self.observation_host(mutate=True)
        with self.assertRaises(AssertionError):d.native_observe(quota=True)
    def watch_host(self, displaced=True, paused=False):
        d=self.harness();d.capture=lambda label:d.calls.append(('capture',label));d.clear_toast=lambda:None;d.state=lambda:dict(adventure={'hp':100})
        def sample(lower,x,ready=False,walking=False):return dict(elapsed=x,paused=paused,scene='world-earthlands',signs={'observed':False},
           view=dict(phase='walk' if walking else 'browse' if lower>.5 else 'recover',lower=lower,x=x,z=0,walking=walking,observationReady=ready),visibility={'visible':True,'phase':'walk' if walking else 'browse' if lower>.5 else 'recover','lower':lower})
        samples=iter([sample(.9,0),sample(.05,0),sample(0,.06 if displaced else 0,True,True)])
        d.sample=lambda:next(samples);return d
    def test_actual_watch_caller_requires_full_visible_low_recover_displaced_ready_sequence(self):
        d=self.watch_host();d.watch('SYNTHETIC');self.assertEqual(d.calls,[('capture','SYNTHETIC_READY')])
    def test_zero_displacement_or_paused_ready_shape_cannot_pass_watch(self):
        for kw in (dict(displaced=False),dict(paused=True)):
            with self.assertRaises(AssertionError):self.watch_host(**kw).watch('SYNTHETIC-NEGATIVE')
    def test_cached_visibility_from_another_pose_cannot_qualify_current_browse(self):
        d=self.watch_host();original=d.sample
        def stale():
            s=original();s['visibility']['lower']+=.5;return s
        d.sample=stale
        with patch.object(N.time,'monotonic',side_effect=[0,.1,.2,.3,241]):
            with self.assertRaises(TimeoutError):d.watch('SYNTHETIC-STALE-VISIBILITY')
        self.assertEqual(d.calls,[])
    def test_pixel_oracle_rejects_missing_head_restoration_clipping_and_world_mutation(self):
        valid=dict(restored=True,stateUnchanged=True,glError=0,pixels=40,headPixels=7,parts=40,clipped=0,span=dict(width=100,height=80))
        self.assertTrue(N.pixels_valid(valid))
        for key,value in (('restored',False),('stateUnchanged',False),('headPixels',0),('clipped',1),('glError',1282)):
            self.assertFalse(N.pixels_valid({**valid,key:value}))
    def test_actual_gpu_probe_and_validator_javascript_compile_without_execution(self):
        code="const vm=require('node:vm');const x=JSON.parse(require('node:fs').readFileSync(0,'utf8'));for(const s of x)new vm.Script('('+s+')');"
        subprocess.run(['node','-e',code],input=json.dumps([N.PIXELS_JS]),text=True,check=True,capture_output=True)
        subprocess.run(['node','-e',"new(require('node:vm').Script)(require('node:fs').readFileSync(0,'utf8'))"],input=N.VALIDATE_JS,text=True,check=True,capture_output=True)
    def test_all_read_or_render_evaluations_exclude_positive_mutation_issuers(self):
        tree=ast.parse(DRIVER.read_text(encoding='utf-8'))
        calls=[n for n in ast.walk(tree) if isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and n.func.attr=='ev']
        for call in calls:
            if call.args and isinstance(call.args[0],ast.Constant) and isinstance(call.args[0].value,str):
                s=call.args[0].value
                for forbidden in ('Realm.test.','observationTicket(','acknowledge(','grazerNativeIntent=','grazerPresentedFrame=', 'new C.Simulation','sim.manual(','.adventureCommand('):
                    self.assertNotIn(forbidden,s)
        # The pixel helper's only state changes are reversible actual renderer batches.
        self.assertNotIn('Realm.state.',N.PIXELS_JS.split('const before=')[0])
        self.assertNotIn('observationTicket',N.PIXELS_JS);self.assertNotIn('acknowledge',N.PIXELS_JS)


class CurrentInstalledCohortTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        new = os.environ.get('FIRSTLIGHT_WILD_SIGNS_COHORT')
        old = os.environ.get('FIRSTLIGHT_WILD_SIGNS_ORIGINAL_COHORT')
        if not new and not old:
            raise unittest.SkipTest('Actual current dual cohorts are supplied by the mandatory source verifier command')
        if not new or not old:
            raise ValueError('Both current cohort variables are required together')
        if DRIVER != ROOT/'tools/earth_wild_signs_browser.py':
            raise ValueError('Current-cohort admission requires the actual installed driver')
        cls.new, cls.old = Path(new).resolve(), Path(old).resolve()
        N.clean_source_tree(ROOT)
        cls.rows, cls.bound, cls.epoch = N.preflight(ROOT, cls.new, cls.old)

    def test_actual_three_earned_variants_admitted_without_browser_or_output(self):
        self.assertEqual(set(self.rows), {'blade', 'bow', 'veteran'})
        self.assertEqual(self.epoch['mode'], 'current-command-earned')
        self.assertEqual(self.epoch['head'], subprocess.check_output(
            ['git', '-C', str(ROOT), 'rev-parse', 'HEAD'], text=True).strip())
        self.assertGreater(len(self.bound), 15)
        for row in self.rows.values():
            self.assertEqual(row['world']['earthWildSigns'], N.FRESH)
            self.assertTrue(row['world']['localLife']['records'][N.LOAD]['claimed'])


class CurrentCohortEnvironmentGuardTests(unittest.TestCase):
    def test_partial_mandatory_wiring_cannot_be_reported_as_a_skip(self):
        for key in ('FIRSTLIGHT_WILD_SIGNS_COHORT', 'FIRSTLIGHT_WILD_SIGNS_ORIGINAL_COHORT'):
            with self.subTest(key=key), patch.dict(os.environ, {key:'SYNTHETIC_MISSING_CURRENT_FILE'}, clear=True):
                with self.assertRaisesRegex(ValueError, 'required together'):
                    CurrentInstalledCohortTests.setUpClass()

    def test_generic_discovery_without_either_current_cohort_is_explicitly_skipped(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(unittest.SkipTest, 'Actual current dual cohorts'):
                CurrentInstalledCohortTests.setUpClass()


if __name__=='__main__':unittest.main(verbosity=2)
