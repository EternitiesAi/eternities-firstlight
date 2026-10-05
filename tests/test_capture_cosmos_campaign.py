"""CPU-only portable capture guards/controller tests.

Small synthetic receipt schemas are never played or claimed as earned evidence.
The opt-in current-cohort case reads real complete source journeys without
launching Chromium, Playwright, game fixtures or native capture.
"""
from pathlib import Path
from types import SimpleNamespace
import ast
import contextlib
import importlib.util
import io
import json
import math
import os
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import Mock, patch

sys.dont_write_bytecode = True
STAGE = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path(os.environ.get('FIRSTLIGHT_ROOT', STAGE if (STAGE/'tools/cosmos_campaign_browser.py').is_file()
                                 else 'D:/07-GAMES/Firstlight/authoring/atlantis-harbour-campaign-20261004')).resolve()


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


H = load(STAGE/'tools/capture_cosmos_campaign.py', 'cosmos_ordinary_capture_cpu')


class ReceiptGuards(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.guards = H.load_guards(SOURCE_ROOT)
        cls.temp = tempfile.TemporaryDirectory(prefix='cpu-capture-schema-', dir=STAGE)
        cls.base = Path(cls.temp.name)
        cls.root = cls.base/'synthetic-source-schema'
        (cls.root/'src').mkdir(parents=True)
        # These are byte owners for pure preflight only, not game facades.
        cls.names = ('cosmos-campaign-data.js','cosmos-campaign.js','cosmos-campaign-ui.js','cosmos-campaign-art.js',
                     'cosmos.js','cosmos-art.js','cosmos-ui.js','core.js','adventure.js','arsenal.js','combat.js','rpg-ui.js','app.js')
        for name in cls.names:
            (cls.root/'src'/name).write_text('// synthetic schema owner '+name,encoding='utf8')
        html='\n'.join((cls.root/'src'/n).read_text(encoding='utf8') for n in cls.names)
        for name in (*cls.guards.JOURNEY_DEPENDENCIES, 'FIRSTLIGHT_VALLEY.html',
                     'tests/cosmos_campaign_journey.cjs',cls.guards.VETERAN_FIXTURE):
            p=cls.root/name;p.parent.mkdir(parents=True,exist_ok=True)
            p.write_text(html if name.endswith('.html') else 'synthetic receipt bytes only',encoding='utf8')
        cls.sources=cls.base/'complete-synthetic-cohort';cls.sources.mkdir()
        for flag,(label,choice,supports) in cls.guards.VARIANTS.items():
            folder=cls.sources/label;folder.mkdir()
            seed={'adventure':{'started':True},'realmTrails':{'records':{cls.guards.PREREQUISITE:{'claimed':True}}},'cosmosCampaign':cls.guards.FRESH}
            prepared={'cosmosCampaign':{'version':1,'accepted':True,'steps':['read-local-cost',
                       *[step for s,mode in supports for step in ([s+'-inspect',s+'-fit'] if mode=='ordinary' else ['assist-'+s])]],
                       'choice':None,'opened':False,'claimed':False}}
            links={};stems=cls.guards.checkpoint_names(flag)
            for stem in stems:
                value=seed if stem=='00_EARNED_SEED' else prepared if stem==H.CHECKPOINT else {'cosmosCampaign':{'claimed':True,'opened':True,'choice':choice}}
                H.write_new(folder/(stem+'.json'),value);links[stem]=H.sha(folder/(stem+'.json'))
            epoch=cls.guards.source_epoch(cls.root)
            proof={'variant':label,'seedSha256':links['00_EARNED_SEED'],'prerequisite':cls.guards.PREREQUISITE,
                   'prerequisiteClaimed':True,'sourceHashes':epoch,'harnessSha256':H.sha(cls.root/'tests/cosmos_campaign_journey.cjs'),
                   **dict.fromkeys(cls.guards.INJECTIONS,0)}
            report={**proof,'status':'passed','sourceDrift':False,'campaignComplete':True,'canonicalPreservation':True,
                    'finalHashes':epoch,'plan':{'choice':choice,'supports':[{'id':s,'mode':m} for s,m in supports]},
                    'checkpoints':list(stems),'checkpointHashes':links,'walks':[{'label':'synthetic schema'}],'saveCount':1,
                    'fights':[{'enemy':e,'style':'bow' if flag=='bow' else 'blade','arrows':flag=='bow',
                               'weapons':[{'caller':'production projectile impact'}],'impacts':[{}],'frames':[{}],'contacts':[]}
                              for e in ('cosmos-optical-reclaimer-v1','cosmos-still-meridian-guardian-v1')]}
            if flag=='veteran':
                original=cls.root/cls.guards.VETERAN_FIXTURE
                proof.update(fixture=str(original),fixtureHash=H.sha(original))
                report['source']={'path':str(original),'sha256':H.sha(original)}
            H.write_new(folder/'SEED_PROVENANCE.json',proof)
            H.write_new(folder/'COSMOS_CAMPAIGN_JOURNEY_REPORT.json',report)
        cls.original={p.relative_to(cls.base):p.read_bytes() for p in cls.base.rglob('*') if p.is_file()}

    def tearDown(self):
        for p in self.base.rglob('*'):
            if p.is_file() and p.relative_to(self.base) not in self.original:p.unlink()
        for relative,value in self.original.items():
            p=self.base/relative
            if not p.exists() or p.read_bytes()!=value:p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(value)

    @classmethod
    def tearDownClass(cls):cls.temp.cleanup()

    def source(self,flag='blade'):return self.sources/self.guards.VARIANTS[flag][0]/(H.CHECKPOINT+'.json')
    def run_preflight(self,source=None,output=None):
        # Portable small schema scratch is not a native profile or earned take.
        return H.preflight(source or self.source(),output or self.base/'new-capture',self.root,guards=self.guards,windows=False)
    def mutate_report(self,callback,flag='blade'):
        p=self.source(flag).with_name('COSMOS_CAMPAIGN_JOURNEY_REPORT.json')
        value=self.guards.read_json(p);callback(value);p.write_text(json.dumps(value),encoding='utf8')

    def test_complete_all_three_prepared_schemas_bind_exact_bytes(self):
        for flag in self.guards.VARIANTS:
            source,output,initial,receipt,frozen,_=self.run_preflight(self.source(flag),self.base/('new-'+flag))
            self.assertEqual(receipt['journey']['checkpointHashes'][H.CHECKPOINT],H.sha(source))
            self.assertFalse(output.exists());self.assertEqual(len(frozen),18 if flag=='veteran' else 17)
            self.assertEqual(len(initial['cosmosCampaign']['steps']),4)

    def test_seed_only_incomplete_report_is_refused(self):
        self.source().with_name('FINAL_WORLD.json').unlink()
        with self.assertRaisesRegex(ValueError,'Complete linked'):self.run_preflight()

    def test_stale_current_source_is_refused_before_output(self):
        (self.root/'src/core.js').write_text('changed current owner',encoding='utf8')
        with self.assertRaisesRegex(ValueError,'source epoch'):self.run_preflight()
        self.assertFalse((self.base/'new-capture').exists())

    def test_unlinked_or_tampered_prepared_bytes_are_refused(self):
        self.source().write_text('{}',encoding='utf8')
        with self.assertRaisesRegex(ValueError,'Checkpoint hash'):self.run_preflight()

    def test_failed_or_injected_full_journey_is_refused(self):
        self.mutate_report(lambda r:r.update(forcedCycles=1))
        with self.assertRaisesRegex(ValueError,'integer zero'):self.run_preflight()

    def test_future_work_even_with_relinked_hash_is_refused(self):
        p=self.source();v=self.guards.read_json(p);v['cosmosCampaign']['steps'].append('guardian-settled')
        p.write_text(json.dumps(v),encoding='utf8')
        self.mutate_report(lambda r:r['checkpointHashes'].update({H.CHECKPOINT:H.sha(p)}))
        with self.assertRaisesRegex(ValueError,'before either machine'):self.run_preflight()

    def test_prepared_supports_must_match_distinct_source_plan(self):
        p=self.source();v=self.guards.read_json(p);v['cosmosCampaign']['steps'].remove('assist-living')
        p.write_text(json.dumps(v),encoding='utf8')
        self.mutate_report(lambda r:r['checkpointHashes'].update({H.CHECKPOINT:H.sha(p)}))
        with self.assertRaisesRegex(ValueError,'supports must match'):self.run_preflight()

    def test_no_runtime_page_divergence(self):
        (self.root/'FIRSTLIGHT_VALLEY.html').write_text('different assembled page',encoding='utf8')
        with self.assertRaisesRegex(ValueError,'byte-identical'):self.run_preflight()

    def test_exact_prepared_filename_and_absolute_paths_only(self):
        with self.assertRaisesRegex(ValueError,'exact 02_DISTINCT'):self.run_preflight(self.source().with_name('00_EARNED_SEED.json'))
        with self.assertRaisesRegex(ValueError,'absolute'):self.run_preflight(output=Path('relative-capture'))

    def test_existing_and_overlapping_outputs_are_refused(self):
        for output in (self.base,self.source().parent,self.source().parent/'new-output',self.sources):
            with self.assertRaisesRegex(ValueError,'new separate|outside the actual'):self.run_preflight(output=output)

    def test_no_profile_or_report_inside_game_checkout(self):
        with self.assertRaisesRegex(ValueError,'outside the actual source checkout'):
            self.run_preflight(output=self.root/'new-capture')

    def test_windows_native_paths_are_D_only_and_not_drive_root(self):
        for output in ('C:/source-scratch/capture','D:/'):
            with self.assertRaises(ValueError):H.preflight(self.source(),output,self.root,guards=self.guards,windows=True)

    def test_strongest_original_bytes_are_bound(self):
        (self.root/self.guards.VETERAN_FIXTURE).write_text('wrong original',encoding='utf8')
        with self.assertRaisesRegex(ValueError,'Strongest provenance'):self.run_preflight(self.source('veteran'))

    def test_create_only_receipts_do_not_overwrite(self):
        p=self.base/'small-negative.json';H.write_new(p,{'explicit':'synthetic'})
        with self.assertRaises(FileExistsError):H.write_new(p,{'overwrite':True})
        self.assertEqual(json.loads(p.read_text()),{'explicit':'synthetic'})

    def test_preflight_only_CLI_creates_no_profile_and_never_calls_capture(self):
        # The CLI receives an already real-guard-validated synthetic schema;
        # native D-only containment has its own rejecting test above.
        terms=self.run_preflight()
        with patch.object(H,'preflight',return_value=terms),patch.object(H,'epoch',return_value={'synthetic-read-only':'bytes'}),patch.object(H.Capture,'run') as run,contextlib.redirect_stdout(io.StringIO()) as out:
            result=H.main(['--root',str(self.root),'--source',str(self.source()),'--output',str(self.base/'new-capture'),'--preflight-only'])
        self.assertEqual(result,0);run.assert_not_called();self.assertFalse((self.base/'new-capture').exists())
        receipt=json.loads(out.getvalue());self.assertFalse(receipt['browser_launched']);self.assertFalse(receipt['native_capture_completed'])


class Controllers(unittest.TestCase):
    def capture(self):
        report={'inputs':[],'condition_evaluations':[],'viewport':{'width':1440,'height':900}}
        c=H.Capture(SimpleNamespace(root=SOURCE_ROOT,output=STAGE/'never-created-test-profile',renderer='hardware'),report,{})
        c.page=Mock();return c

    def test_eight_directions_follow_actual_camera_transform(self):
        choices=set()
        for yaw in (0,.41,math.pi/2,math.pi,1.73):
            for i in range(360):
                angle=i*math.pi/180;point={'x':math.cos(angle),'z':math.sin(angle)}
                keys=H.direction_keys(point,{'adventure':{'player':{'x':0,'z':0}},'camera':{'yaw':yaw}})
                choices.add(tuple(keys));self.assertTrue(1<=len(keys)<=2)
                dx=('d' in keys)-('a' in keys);dz=('s' in keys)-('w' in keys)
                # Exact app.js keyboard rotation, not a controller-only inverse.
                wx=dx*math.cos(yaw)+dz*math.sin(yaw);wz=-dx*math.sin(yaw)+dz*math.cos(yaw)
                dot=(wx*point['x']+wz*point['z'])/math.hypot(wx,wz)
                self.assertGreaterEqual(dot,math.cos(math.pi/8)-1e-12)
        self.assertEqual(len(choices),8)
        self.assertEqual(H.direction_keys({'x':0,'z':0},{'adventure':{'player':{'x':0,'z':0}},'camera':{'yaw':0}}),[])

    def test_native_key_hold_releases_on_controller_error(self):
        c=self.capture();c.page.wait_for_timeout.side_effect=RuntimeError('synthetic wait failure')
        with self.assertRaises(RuntimeError):c.hold(['w','d'],100)
        self.assertEqual(c.held,set());self.assertEqual(c.page.keyboard.up.call_count,2)
        self.assertEqual(c.report['inputs'][0]['hold'],['w','d'])

    def test_already_near_action_skips_nonexistent_redundant_walk(self):
        c=self.capture();c.definition={'giver':{'x':3,'z':-43}};c.steps={'isolate-service-feed':{'kind':'interact','x':40,'z':-40}}
        c.workspace=Mock();c.close=Mock();walk=Mock();walk.count.return_value=0;action=Mock();action.count.return_value=1
        c.page.locator.side_effect=lambda selector:walk if selector==H.walk_selector('isolate-service-feed') else action
        c.click=Mock();c.walk('isolate-service-feed')
        c.click.assert_not_called();c.close.assert_called_once()

    def test_missing_walk_and_missing_action_refuse_instead_of_injecting(self):
        c=self.capture();c.definition={'giver':{}};c.steps={'challenge-guardian':{'kind':'interact'}};c.workspace=Mock()
        c.page.locator.return_value.count.return_value=0
        with self.assertRaises(AssertionError):c.walk('challenge-guardian')

    def test_physical_selector_cannot_set_defeat_or_choice(self):
        self.assertIn('cosmos-campaign-configure',H.action_selector('configure-living','configure'))
        for kind in ('defeat','choice','pressure','anything'):
            with self.assertRaises(ValueError):H.action_selector('guardian-settled',kind)

    def test_warning_keyboard_waypoints_use_actual_whole_body_Cosmos_ground(self):
        routes=[]
        for enemy,start in (({'id':'cosmos-optical-reclaimer-v1','x':36,'z':-40},{'x':33,'z':-40}),
                            ({'id':'cosmos-still-meridian-guardian-v1','x':54,'z':-44},{'x':47,'z':-44})):
            points=[start,*H.warning_waypoints(enemy),{'x':enemy['x'],'z':enemy['z']+1.4}]
            routes.extend([[a,b] for a,b in zip(points,points[1:])])
        # Real integrated physical modules, no rule facade or actor execution.
        code='const p=process.argv[1];global.RealmCosmosCampaignData=require(p+"/cosmos-campaign-data.js");const N=require(p+"/cosmos.js");const routes='+json.dumps(routes)+';if(routes.some(([a,b])=>!N.segment(a,b,.31)||!N.walkable(b.x,b.z,.31)||N.height(b.x,b.z)!==4.77))throw Error("unsupported body leg");if(N.segment({x:47,z:-44},{x:54,z:-41},.31))throw Error("negative must detect actual west cover");console.log("whole-body routes pass; covered direct leg rejects");'
        result=subprocess.run(['node','-e',code,str(SOURCE_ROOT/'src')],capture_output=True,text=True)
        self.assertEqual(result.returncode,0,result.stderr);self.assertIn('covered direct leg rejects',result.stdout)

    def test_native_map_invitation_is_not_a_nonexistent_top_tab(self):
        c=self.capture();c.close=Mock();c.press=Mock();c.click=Mock();c.workspace('cosmos')
        self.assertEqual([a.args[0] for a in c.click.call_args_list],['#rpg-tabs [data-rpg="open"][data-id="atlas"]','#rpg-content [data-rpg="cosmos-invitation"]'])

    def test_only_one_recorded_context_then_unrecorded_same_profile(self):
        c=self.capture();c.origin='http://127.0.0.1:9876';c.ready=Mock();c.diag=Mock(return_value={'mode':'webgl2','renderer':'ANGLE actual fixture label'})
        c.report.update(html_sha256='expected-html',errors=[],console_errors=[])
        page=Mock();page.goto.return_value.body.return_value=b'actual fixture response'
        context=Mock();context.pages=[page];c.pw=Mock();c.pw.chromium.launch_persistent_context.return_value=context
        support=SimpleNamespace(launch_kwargs=lambda renderer:{'headless':True})
        with patch.object(H,'load_module',return_value=support),patch.object(H.hashlib,'sha256') as hash_:
            hash_.return_value.hexdigest.return_value='expected-html'
            c.new_context(True);c.new_context(False)
        calls=c.pw.chromium.launch_persistent_context.call_args_list
        self.assertEqual(calls[0].args,calls[1].args)
        self.assertIn('record_video_dir',calls[0].kwargs);self.assertNotIn('record_video_dir',calls[1].kwargs)
        context.new_page.assert_not_called()
        script=context.add_init_script.call_args.args[0]
        self.assertIn('localStorage.getItem',script);self.assertNotIn('setItem',script);self.assertNotIn('Realm.',script)

    def test_import_and_cli_help_do_not_import_browser_or_generate_fixtures(self):
        script='import importlib.util,socket; socket.socket.bind=lambda *a,**k:(_ for _ in()).throw(AssertionError("server import side effect")); s=importlib.util.spec_from_file_location("capture",'+repr(str(STAGE/'tools/capture_cosmos_campaign.py'))+'); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); assert "playwright" not in __import__("sys").modules; assert m.main(["--help"]) is None'
        # argparse's successful SystemExit(0) is the expected help result.
        result=subprocess.run([sys.executable,'-B','-c',script],capture_output=True,text=True)
        self.assertEqual(result.returncode,0,result.stderr);self.assertIn('--source',result.stdout)

    def test_controller_AST_has_no_test_step_command_or_owner_mutation(self):
        tree=ast.parse((STAGE/'tools/capture_cosmos_campaign.py').read_text(encoding='utf8'))
        evaluations=[]
        for node in ast.walk(tree):
            if isinstance(node,ast.Call) and isinstance(node.func,ast.Attribute) and node.func.attr=='evaluate':
                self.assertIsInstance(node.args[0],ast.Constant)
                evaluations.append(node.args[0].value)
        for code in evaluations:
            self.assertNotIn('Realm.test.',code);self.assertNotIn('setItem(',code)
            self.assertNotIn('Command(',code);self.assertNotIn('.tick(',code);self.assertNotIn('.damage',code)
        self.assertTrue(any('__cosmosCaptureStartupBytes' in code for code in evaluations))


class ActualCurrentInputs(unittest.TestCase):
    @unittest.skipUnless(os.environ.get('COSMOS_EARNED_SOURCES'),'Explicit read-only complete current-cohort path not supplied.')
    def test_actual_current_complete_earned02_and_all_prepared_links(self):
        sources=Path(os.environ['COSMOS_EARNED_SOURCES']).resolve();guards=H.load_guards(SOURCE_ROOT)
        before={str(p):H.sha(p) for p in sources.rglob('*.json')}
        for flag,(label,_,_) in guards.VARIANTS.items():
            source=sources/label/(H.CHECKPOINT+'.json')
            result=H.preflight(source,sources.parent/('not-created-cosmos-capture-'+flag),SOURCE_ROOT,guards=guards)
            self.assertEqual(result[3]['journey']['status'],'passed')
            self.assertEqual(result[3]['journey']['checkpointHashes'][H.CHECKPOINT],H.sha(source))
            self.assertFalse(result[1].exists());self.assertGreaterEqual(len(result[4]),17)
        self.assertEqual(before,{str(p):H.sha(p) for p in sources.rglob('*.json')})


if __name__=='__main__':unittest.main()
