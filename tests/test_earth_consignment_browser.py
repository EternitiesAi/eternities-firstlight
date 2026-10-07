"""CPU driver/helper checks only. No Playwright, WebGL or native acceptance run.

Pure negative specimens test the real staged driver's guard and oracle code.
Every unit specimen is explicitly synthetic; actual cohort intake is a separate
strict helper/preflight, not a hidden fallback or a native acceptance claim.
"""
from pathlib import Path
import ast
import copy
import importlib.util
import json
import math
import os
import re
import subprocess
import unittest
from unittest.mock import patch

HERE=Path(__file__).resolve().parent
SOURCE=HERE.parent/'tools/earth_consignment_browser.py'
if not SOURCE.is_file():SOURCE=HERE/'earth_consignment_browser.py'
spec=importlib.util.spec_from_file_location('staged_first_load_native',SOURCE)
H=importlib.util.module_from_spec(spec);spec.loader.exec_module(H)


class DriverCPU(unittest.TestCase):
    def test_standing_follow_boundary_accepts_observed_pre_step_wait_and_refuses_false_progress(self):
        # Labelled native02 geometry, portable literal specimen. This oracle
        # does not open a browser or manufacture a positive gameplay receipt.
        initial={'player':{'x':-106,'z':-103.3}}
        actual={'scene':'world-earthlands','paused':False,'hp':80,'focused':True,'hidden':False,'prefix':[],
                'player':copy.deepcopy(initial['player']),
                'view':{'x':-96.20634026600152,'z':-102.30174680797992,'status':'waiting','reason':'player-far','ready':False,'distanceTraveled':10.1585599999995}}
        limits={'farWait':10,'speed':1.6,'maxDt':.1}
        self.assertLess(H.distance(actual['player'],actual['view']),10)
        self.assertTrue(H.standing_follow_boundary(initial,actual,limits))
        for field,value in [('paused',True),('hp',0),('focused',False),('hidden',True),('scene','valley'),('prefix',['unearned-arrival'])]:
            bad=copy.deepcopy(actual);bad[field]=value
            with self.subTest(field=field):self.assertFalse(H.standing_follow_boundary(initial,bad,limits))
        for field,value in [('x',-96.5),('x',-95),('status','moving'),('reason','waiting'),('ready',True),('distanceTraveled',0)]:
            bad=copy.deepcopy(actual);bad['view'][field]=value
            with self.subTest(view=field,value=value):self.assertFalse(H.standing_follow_boundary(initial,bad,limits))
        moved=copy.deepcopy(actual);moved['player']['x']+=.1;self.assertFalse(H.standing_follow_boundary(initial,moved,limits))
        for value in (None,{}, {'farWait':11,'speed':1.6,'maxDt':.1},{'farWait':10,'speed':float('nan'),'maxDt':.1}):
            with self.subTest(limits=value):self.assertFalse(H.standing_follow_boundary(initial,actual,value))

    @classmethod
    def setUpClass(cls):
        # Deliberately synthetic small structures exercise the driver's actual
        # validators. No original campaign earning is asserted by unit mocks.
        w={'version':9,'adventure':{'version':12,'started':True,'hp':100,'xp':45,'ore':3,'coins':18,'elapsed':0,'revision':0,'equipment':{'weapon':'dawn_edge'},'classPath':{},'earthBinding':{},'companion':{}},'earthExpedition':{'version':1,'story':{'accepted':True,'claimed':True,'steps':list(H.STORY),'branch':'stormfall-recovery'},'patrol':{'lastClaim':0,'active':None}},'localLife':{'version':1,'records':{id:copy.deepcopy(H.FRESH) for id in H.OLD_IDS}},'sandbox':{'version':1,'elapsed':0,'inventory':{'wood':8,'fiber':4,'stone':3}}}
        for k in ('journeys','realmTrails','hellCampaign','heavenCampaign','atlantisCampaign','cosmosCampaign','earthHomecoming','bridgeCommunity','homeHistory','notes','score','scoreRevision','retreat','visitor','flowers','seed','visited'):w[k]={}
        w['adventure']['receipts']=[{'id':'synthetic-existing-receipt','fp':'synthetic-earlier-command','ok':True}]
        receipt={'status':'passed','sourceDrift':False,'positionEdits':0,'inventoryGrants':0,'manualDamage':0,'plantedDefeats':0,'canonicalPreservation':True,'sourceHashes':{id:'a'*64 for id in H.EARNED_MODULES},'harnessSha256':'b'*64,'branch':'stormfall-recovery'}
        cls.originals={}
        for variant in H.VARIANTS:
            world=copy.deepcopy(w);r={**receipt,'variant':H.VARIANTS[variant]}
            if variant=='bow':world['earthExpedition']['story']['branch']='managed-coppice';r['branch']='managed-coppice'
            cls.originals[variant]={'world':world,'receipt':r,'suffix':'coppice' if variant=='bow' else 'stormfall'}

    def test_synthetic_three_cohort_structures_require_both_source_branches(self):
        self.assertEqual(set(self.originals),{'blade','bow','veteran'})
        self.assertEqual({r['suffix'] for r in self.originals.values()},{'stormfall','coppice'})
        self.assertEqual(self.originals['veteran']['world']['adventure']['equipment']['weapon'],'dawn_edge')

    def test_earned_input_rejects_injection_missing_receipts_and_branch_changes(self):
        row=self.originals['blade']
        for field,value in [('positionEdits',1),('manualDamage',None),('inventoryGrants',False),('sourceDrift',True),('canonicalPreservation',False),('branch','managed-coppice')]:
            r=copy.deepcopy(row['receipt']);r[field]=value
            with self.subTest(field=field),self.assertRaises(ValueError):H.source_check(row['world'],r,'blade')

    def test_positive_source_cannot_preplant_new_job_or_patrol(self):
        row=self.originals['blade']
        for mutate in (lambda w:w['localLife']['records'].update({H.JOB:{'accepted':True,'choice':'south-stormfall','steps':[],'claimed':False}}),lambda w:w['earthExpedition']['patrol'].update(lastClaim=1),lambda w:w['earthExpedition']['story']['steps'].pop()):
            w=copy.deepcopy(row['world']);mutate(w)
            with self.assertRaises(ValueError):H.source_check(w,row['receipt'],'blade')

    def test_epoch_refuses_missing_or_unembedded_source_before_browser_import(self):
        class Candidate:
            def __init__(self,exists,name=''):self.exists,self.name=exists,name
            def __truediv__(self,key):return Candidate(self.exists,key)
            def read_text(self,encoding=None):return 'stub HTML' if self.name=='index.html' else 'different module body'
            def is_file(self):return self.exists
        with self.assertRaisesRegex(ValueError,'Integrated exact-source build pending'):
            H.build_epoch(Candidate(False))
        with self.assertRaisesRegex(ValueError,'Integrated exact-source build pending'):
            H.build_epoch(Candidate(True))

    def test_current_prerequisite_caller_and_every_declared_owner_hash_must_match(self):
        r=copy.deepcopy(self.originals['blade']['receipt']);epoch={'callerSha256':r['harnessSha256'],'runtimeSources':{'src/'+k:v for k,v in r['sourceHashes'].items()}}
        H.current_receipt(r,epoch)
        for mutate in [lambda x:x.update(harnessSha256='c'*64),lambda x:x['sourceHashes'].update({'core.js':'c'*64}),lambda x:x['sourceHashes'].pop('earth-fieldcraft.js'),lambda x:x['sourceHashes'].update({'../core.js':'a'*64})]:
            bad=copy.deepcopy(r);mutate(bad)
            with self.assertRaises(ValueError):H.current_receipt(bad,epoch)

    def test_mandatory_preflight_refuses_missing_and_historical_manifest(self):
        with self.assertRaisesRegex(ValueError,'cohort missing'):H.current_preflight(HERE/'MISSING_NATIVE_COHORT.json',HERE)
        with patch.object(Path,'is_file',return_value=True),patch.object(H,'read',return_value={'epoch':{'mode':'historical-frozen-native03'}}):
            with self.assertRaisesRegex(ValueError,'current invocation'):H.current_preflight(HERE/'SYNTHETIC-header.json',HERE)

    def test_current_manifest_epoch_mismatch_refuses_before_link_or_browser_work(self):
        value={'schema':'first-load-native-cohort-v1','epoch':{'mode':'current-command-earned','head':'old'},'variants':{k:{} for k in H.VARIANTS}}
        with patch.object(H,'read',return_value=value),patch.object(H,'current_epoch',return_value={'mode':'current-command-earned','head':'new'}):
            with self.assertRaisesRegex(ValueError,'source epoch changed'):H.cohort(HERE/'SYNTHETIC-header.json',HERE)

    def test_native_follow_reads_real_hp_snapshot_not_absent_diagnostic_field(self):
        # Explicit synthetic CPU fixture: diagnostics has no HP; actual state does.
        # Execute the actual atomic JS sample and the actual dead-traveller guard.
        from types import SimpleNamespace
        tree=ast.parse(SOURCE.read_text());owner=next(n for n in tree.body if isinstance(n,ast.ClassDef) and n.name=='Native')
        sample=next(n for n in owner.body if isinstance(n,ast.FunctionDef) and n.name=='follow_sample')
        text=ast.get_source_segment(SOURCE.read_text(),sample)
        self.assertIn('s=Realm.state',text);self.assertIn('hp:s.adventure.hp',text)
        self.assertNotIn('d.adventure.hp',text)
        runner=r"""const fs=require('fs'),vm=require('vm'),p=JSON.parse(fs.readFileSync(0,'utf8')),canvas={};
         const context={Realm:{diagnostics:{scene:'world-earthlands',adventure:{player:{x:0,z:0},paused:false},
          camera:{yaw:0},fps:5,consignment:{view:{x:0,z:0,status:'moving',ready:false,distanceTraveled:0},frame:{walking:true}}},
          state:{adventure:{hp:p.hp,elapsed:0},settings:{quality:'low'},localLife:{records:{'earth-first-load-through-v1':{steps:[]}}}}},
          document:{activeElement:canvas,hidden:false,querySelector:()=>canvas}};
         const value=vm.runInNewContext('('+p.js+')()',context);
         if(Object.hasOwn(context.Realm.diagnostics.adventure,'hp'))throw Error('Synthetic diagnostic HP must stay absent');
         process.stdout.write(JSON.stringify(value));"""
        for hp in (0,80):
            def evaluate(js,arg=None):
                self.assertIsNone(arg)
                result=subprocess.run(['node','-e',runner],input=json.dumps({'js':js,'hp':hp}),text=True,capture_output=True,check=True,timeout=5)
                return json.loads(result.stdout)
            observer=SimpleNamespace(ev=evaluate,report={'head':'SYNTHETIC-HP-BOUNDARY'},row={})
            value=H.Native.follow_sample(observer)
            self.assertEqual(value['hp'],hp);self.assertEqual(observer.row['followDiagnostics'][-1]['hp'],hp)
            if hp==0:
                released=[];observer.close=lambda:None;observer.view=lambda:value['view'];observer.record=lambda:{'steps':[]}
                observer.follow_sample=lambda:value
                observer.page=SimpleNamespace(locator=lambda selector:SimpleNamespace(focus=lambda:None),keyboard=SimpleNamespace(up=released.append))
                with self.assertRaisesRegex(AssertionError,'Actual traveller died'):H.Native.follow(observer)
                self.assertEqual(set(released),{'w','a','s','d'})

    def test_every_native_case_receives_its_served_origin_and_unique_case(self):
        # Static correspondence catches a real constructor/caller mismatch
        # without starting Playwright or pretending a mock is a native run.
        tree=ast.parse(SOURCE.read_text())
        calls=[n for n in ast.walk(tree) if isinstance(n,ast.Call) and isinstance(n.func,ast.Name) and n.func.id=='Native']
        self.assertEqual(len(calls),2)
        for call in calls:
            self.assertEqual(len(call.args),5)
            self.assertIsInstance(call.args[3],ast.Name)
            self.assertEqual(call.args[3].id,'origin')

    def test_actual_app_basis_follow_controls_do_not_outrun_or_reverse(self):
        self.assertEqual(H.native_keys({'x':0,'z':0},{'x':1,'z':0},.3),())
        for yaw in [0,.22,math.pi/2,-math.pi/2,math.pi,4.8]:
            for angle in [n*math.pi/16 for n in range(32)]:
                target={'x':3*math.cos(angle),'z':3*math.sin(angle)};keys=H.native_keys({'x':0,'z':0},target,yaw)
                dx=int('d' in keys)-int('a' in keys);dz=int('s' in keys)-int('w' in keys)
                wx,wz=dx*math.cos(yaw)+dz*math.sin(yaw),-dx*math.sin(yaw)+dz*math.cos(yaw)
                self.assertGreater((wx*target['x']+wz*target['z'])/(math.hypot(wx,wz)*3),.92)

    def test_preservation_keeps_all_old_owners_full_gear_and_old_four_records(self):
        w=copy.deepcopy(self.originals['blade']['world']);p=H.preserved(w)
        # Explicit tolerated runtime/settings changes, not durable progress edits.
        w['adventure']['elapsed']+=1;w['adventure']['hp']-=1;w['adventure']['revision']+=1;w['adventure']['coins']+=4;w['sandbox']['elapsed']+=1
        w['localLife']['records'][H.JOB]={'accepted':True,'choice':'south-stormfall','steps':['arrive-meadow-stop'],'claimed':False}
        self.assertEqual(H.preserved(w),p)
        for owner in ['earthExpedition','homeHistory','retreat','bridgeCommunity']:
            bad=copy.deepcopy(w);bad[owner]['synthetic-corruption']=1;self.assertNotEqual(H.preserved(bad),p)
        for field in ['xp','ore','equipment','classPath','earthBinding','companion']:
            bad=copy.deepcopy(w);bad['adventure'][field]={'synthetic-corruption':1};self.assertNotEqual(H.preserved(bad),p)
        bad=copy.deepcopy(w);bad['localLife']['records'][H.OLD_IDS[0]]['accepted']=True;self.assertNotEqual(H.preserved(bad),p)

    def test_prior_adventure_command_receipts_cannot_be_erased_or_rewritten(self):
        w=copy.deepcopy(self.originals['blade']['world']);p=H.preserved(w)
        for receipts in ([],[{'id':'synthetic-existing-receipt','fp':'rewritten','ok':True}],[{'id':'synthetic-new-receipt','fp':'unearned-command','ok':True}]):
            bad=copy.deepcopy(w);bad['adventure']['receipts']=receipts
            self.assertNotEqual(H.preserved(bad),p)
        w['adventure']['elapsed']+=1;w['adventure']['revision']+=1
        self.assertEqual(H.preserved(w),p)

    def test_immediate_import_keeps_source_economy_before_route_baseline(self):
        # Synthetic dictionaries exercise the actual read-only predicate only.
        original=copy.deepcopy(self.originals['blade']['world']);imported=copy.deepcopy(original)
        imported['localLife']['records'][H.JOB]=copy.deepcopy(H.FRESH)
        self.assertTrue(H.import_preserved(original,imported))
        for mutate in (lambda w:w['adventure'].update(coins=17),lambda w:w['adventure'].update(coins=19),
                       lambda w:w['sandbox']['inventory'].update(wood=7),lambda w:w['sandbox']['inventory'].update(fiber=5),
                       lambda w:w['sandbox']['inventory'].update(unearned=1),lambda w:w['adventure'].update(coins=18.0),
                       lambda w:w['sandbox']['inventory'].update(wood=8.0),lambda w:w['adventure'].update(coins=True),
                       lambda w:w['sandbox']['inventory'].update(wood=True)):
            bad=copy.deepcopy(imported);mutate(bad)
            self.assertEqual(H.preserved(bad),H.preserved(original),'the old generic predicate cannot see this economy-only defect')
            self.assertFalse(H.import_preserved(original,bad))
        self.assertFalse(H.import_preserved(original,{}))

    def test_actual_native_import_admission_rejects_economy_only_change(self):
        # Extract the actual admission prefix. No browser or route is executed.
        tree=ast.parse(SOURCE.read_text(encoding='utf-8-sig'))
        method=next(n for c in tree.body if isinstance(c,ast.ClassDef) and c.name=='Native' for n in c.body if isinstance(n,ast.FunctionDef) and n.name=='run')
        stop=next(i for i,n in enumerate(method.body) if isinstance(n,ast.Assign) and any(isinstance(t,ast.Subscript) and isinstance(t.slice,ast.Constant) and t.slice.value=='origin' for t in n.targets))
        method=copy.deepcopy(method);method.body=method.body[:stop]+[ast.Return(value=ast.Constant(value=True))]
        namespace=dict(H.__dict__);exec(compile(ast.fix_missing_locations(ast.Module(body=[method],type_ignores=[])),str(SOURCE),'exec'),namespace)
        class Probe:
            check=H.Native.check;record=H.Native.record
            def __init__(self,world):self.world=world;self.case='SYNTHETIC-CPU-native-admission';self.row={'checks':[]}
            def start(self):pass
            def import_world(self,source):pass
            def state(self):return self.world
        original=copy.deepcopy(self.originals['blade']['world']);imported=copy.deepcopy(original)
        imported['localLife']['records'][H.JOB]=copy.deepcopy(H.FRESH);origin={'world':original,'source':'SYNTHETIC-CPU-input.json'}
        with patch('builtins.print'):
            self.assertTrue(namespace['run'](Probe(imported),origin,'south'))
            for mutate in (lambda w:w['adventure'].update(coins=17),lambda w:w['sandbox']['inventory'].update(wood=7),
                           lambda w:w['homeHistory'].update(synthetic_corruption=True),lambda w:w['localLife']['records'][H.JOB].update(accepted=True)):
                bad=copy.deepcopy(imported);mutate(bad)
                with self.assertRaises(AssertionError):namespace['run'](Probe(bad),origin,'south')

    def test_payment_is_whole_exact_four_two_two_with_no_xp_or_other_materials(self):
        before=copy.deepcopy(self.originals['blade']['world']);after=copy.deepcopy(before)
        after['adventure']['coins']+=4
        for k in ['wood','fiber']:after['sandbox']['inventory'][k]+=2
        self.assertTrue(H.payment(before,after))
        for owner,key in [('adventure','xp'),('adventure','ore'),('adventure','coins'),('inventory','wood'),('inventory','stone')]:
            bad=copy.deepcopy(after);target=bad['adventure'] if owner=='adventure' else bad['sandbox']['inventory'];target[key]+=1
            self.assertFalse(H.payment(before,bad))

    def test_pixel_oracle_rejects_invisible_parts_restore_mutation_and_gpu_error(self):
        good={'changed':11,'delta':0,'glError':0,'unchanged':True,'restored':True};self.assertTrue(H.pixels_valid(good))
        for key,value in [('changed',0),('delta',1),('glError',1282),('unchanged',False),('restored',False)]:
            self.assertFalse(H.pixels_valid({**good,key:value}))

    def test_ambiguous_native_controls_are_refused_before_any_click(self):
        class Locator:
            def __init__(self,n):self.n=n
            def count(self):return self.n
            def click(self):raise RuntimeError('should never click an ambiguous control')
        for n in [0,2]:
            h=object.__new__(H.Native);h.page=type('Page',(),{'locator':lambda self,s:Locator(n)})()
            h.check=lambda name,ok,detail=None:self.assertTrue(ok,name)
            with self.assertRaises(AssertionError):h.click('[data-rpg=consignment-claim]')

    def test_close_always_releases_browser_when_receipt_capture_fails(self):
        closed=[];h=object.__new__(H.Native);h.context=type('Context',(),{'close':lambda self:closed.append(True)})();h.page=None;h.folder=HERE;h.row={};h.raw=None
        h.close=lambda:None
        def failing_capture(label):raise OSError('labelled synthetic evidence failure')
        h.capture=failing_capture
        with self.assertRaises(OSError):h.finish()
        self.assertEqual(closed,[True]);self.assertIsNone(h.context);self.assertTrue(h.row['contextClosed']);self.assertIn('closeEvidenceError',h.row)

    def test_close_failure_is_retained_and_never_claimed_as_closed(self):
        h=object.__new__(H.Native);h.page=None;h.folder=HERE;h.row={};h.raw=None
        def fail():raise OSError('synthetic close failure')
        h.context=type('Context',(),{'close':lambda self:fail()})()
        h.close=lambda:None;h.capture=lambda label:None
        with self.assertRaisesRegex(OSError,'synthetic close failure'):h.finish()
        self.assertFalse(h.row['contextClosed']);self.assertIn('contextCloseError',h.row)

    def test_embedded_javascript_compiles_and_a_syntax_error_negative_fails(self):
        tree=ast.parse(SOURCE.read_text());strings=[H.INITIALIZE]
        for node in ast.walk(tree):
            if isinstance(node,ast.Call) and node.args and isinstance(node.func,ast.Attribute) and node.func.attr in ('ev','evaluate','wait_for_function') and isinstance(node.args[0],ast.Constant) and isinstance(node.args[0].value,str):strings.append(node.args[0].value)
        compiler='const fs=require("fs");for(const x of JSON.parse(fs.readFileSync(0,"utf8")))new Function(x);'
        result=subprocess.run(['node','-e',compiler],input=json.dumps(strings),text=True,capture_output=True);self.assertEqual(result.returncode,0,result.stderr);self.assertGreater(len(strings),25)
        bad=subprocess.run(['node','-e',compiler],input=json.dumps(strings+['()=>{broken(']),text=True,capture_output=True);self.assertNotEqual(bad.returncode,0);self.assertIn('SyntaxError',bad.stderr)

    def test_positive_code_has_no_progress_motion_or_reward_backdoor(self):
        text=SOURCE.read_text();tree=ast.parse(text)
        forbidden=[r'Realm\.test',r'RealmCore\.Simulation',r'\.dispatchEvent\(',r'\.consignmentOwnerLease\s*=',r'\.manual\(',r'\.moveTo\(',r'Motion\.(?:update|consume|validateArrival|arrivalTicket)\(',r'__ETERNITIES_(?:TEST|CAPTURE)_MODE\s*=']
        # Realm.test appears only in a read-only typeof refusal assertion.
        for pattern in forbidden[1:]:self.assertIsNone(re.search(pattern,text),pattern)
        for node in ast.walk(tree):
            if isinstance(node,ast.Call) and isinstance(node.func,ast.Attribute) and node.func.attr=='ev' and node.args and isinstance(node.args[0],ast.Constant):
                js=node.args[0].value
                self.assertNotRegex(js,r'localStorage\.setItem|RealmLocalLife\.command|RealmEarthConsignment\.command|\.player\.(?:x|z)\s*=|\.steps\s*=|\.coins\s*=')
        self.assertIn('world[\'adventure\'][\'coins\']=9999',text,'Only explicitly labelled capacity derivative may alter a wallet')


if 'FIRSTLIGHT_CONSIGNMENT_COHORT' in os.environ:
    class ExplicitCurrentIntake(unittest.TestCase):
        def test_verifier_supplied_cohort_is_current_complete_and_exact_source(self):
            value=os.environ['FIRSTLIGHT_CONSIGNMENT_COHORT']
            self.assertTrue(value.strip(),'An explicitly supplied empty cohort is a failure, not a skip')
            root=Path(os.environ.get('FIRSTLIGHT_ROOT',H.ROOT)).resolve()
            rows=H.current_preflight(Path(value),root)
            self.assertEqual(set(rows),set(H.VARIANTS))
            self.assertTrue(all(r['provenance']=='current-command-earned' for r in rows.values()))


if __name__=='__main__':unittest.main()
