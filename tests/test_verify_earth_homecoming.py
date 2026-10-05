"""Portable CPU checks of actual verifier/native provenance and orchestration.

Tiny synthetic receipt/source fixtures exercise validators only: they are not
command-earned saves or native evidence. No browser, server or profile launches.
The one orchestration test records subprocess requests rather than running them.
"""
import ast
import contextlib
import copy
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
NATIVE = ROOT/'tools/earth_homecoming_browser.py'
VERIFY = ROOT/'tools/verify.py'
spec=importlib.util.spec_from_file_location('actual_proposed_verifier',VERIFY)
V=importlib.util.module_from_spec(spec);spec.loader.exec_module(V)
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()

def put(p,value):
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(value)+'\n',encoding='utf8')
    return {'path':str(p.resolve()),'bytes':p.stat().st_size,'sha256':sha(p)}

def text(p,value):
    p.parent.mkdir(parents=True,exist_ok=True);p.write_text(value,encoding='utf8')

class Fixture:
    """Small labelled link fixture, not a game checkout or earned progression."""
    def __init__(self,base):
        self.root=base/'synthetic-repo';self.logs=base/'logs';self.sources=self.logs/'earth-homecoming-earned';self.output=base/'browser'/'earth_homecoming_browser'
        self.root.mkdir();self.sources.mkdir(parents=True)
        text(self.root/'tools/earth_homecoming_browser.py',NATIVE.read_text(encoding='utf8'))
        text(self.root/'tools/heaven_campaign_browser.py','# synthetic CPU import guard: never executed\n')
        text(self.root/'tools/browser_support.py','# synthetic CPU dependency: never executed\n')
        text(self.root/'tools/earth-homecoming-journey/caller.cjs','// synthetic caller hash only\n')
        self.callers=self.root/'tools/earth-homecoming-journey'
        modules=('earth-homecoming-data.js','earth-homecoming.js','earth-homecoming-ui.js','earth-homecoming-art.js','core.js','characters.js','adventure.js','adventure-ui.js','adventure-art.js','arsenal.js','combat.js','rpg-ui.js','world-foundations.js','world-foundations-ui.js','world.js','app.js')
        for name in modules:text(self.root/'src'/name,'// synthetic source token: '+name+'\n')
        html='\n'.join((self.root/'src'/name).read_text().strip() for name in modules)
        text(self.root/'index.html',html);text(self.root/'FIRSTLIGHT_VALLEY.html',html);text(self.root/'build.py','# synthetic build token\n')
        text(self.root/'tests/synthetic.test.cjs','// not executed; orchestration discovery only\n')
        names=['src/'+name for name in modules]+['index.html','FIRSTLIGHT_VALLEY.html','build.py']
        for n in range(132):
            name=f'synthetic-source-tokens/{n}.txt';text(self.root/name,'synthetic source-boundary token '+str(n));names.append(name)
        actual={name:sha(self.root/name) for name in names}
        manifest=put(self.root/'SOURCE_EPOCH.json',{'sourceHashes':actual,'scope':'synthetic validator fixture, no executed gameplay'})
        self.epoch={'actual':actual,'manifests':{'installedManifest':manifest},'stages':{'caller/caller.cjs':sha(self.callers/'caller.cjs')}}
        origin_report=put(self.root/'SYNTHETIC_ORIGIN_REPORT.json',{'scope':'synthetic validator boundary only'})
        self.rows=[];self.journeys={}
        variants={'blade':('public-watch',False),'bow':('reviewed-custody',True),'strongest':('public-watch',True)}
        cold=('accepted','ordered-relays','regent-repelled','chosen','verified-away-from-home','home-unpaid','paid')
        checkpoints=('01_ACCEPTED','02_RELAYS','03_REGENT_REPELLED','04_CHOICE','05_VERIFIED','06_HOME_UNPAID','07_PAID','FINAL_WORLD')
        fresh={'version':1,'accepted':False,'steps':[],'choice':None,'claimed':False}
        for variant,(choice,prepared) in variants.items():
            folder=self.sources/variant
            old={'syntheticValidatorOnly':variant}
            old_link=put(self.root/'synthetic-historical-inputs'/variant/'OLD_SOURCE.json',old)
            migrated={**old,'earthHomecoming':copy.deepcopy(fresh)}
            migrated_link=put(folder/'MIGRATED_INPUT.json',migrated)
            lineage=[];previous=migrated_link
            if variant=='strongest':
                for i in range(4):
                    current=put(folder/'prerequisites'/f'EDGE{i+1}.json',{**migrated,'syntheticEdge':i+1})
                    lineage.append({'input':previous,'output':current,'report':origin_report});previous=current
                input_link=put(folder/'prerequisites/FINAL_WORLD.json',json.loads(Path(previous['path']).read_text()))
            else:input_link=migrated_link
            links=[]
            for stem in checkpoints:
                world={**old,'earthHomecoming':{'version':1,'accepted':True,'steps':[],'choice':choice,'claimed':stem in ('07_PAID','FINAL_WORLD')}}
                links.append(put(folder/'earth'/f'{stem}.json',world))
            j={'status':'passed','variant':variant,'choice':choice,'prepared':prepared,'sourceFrozen':True,'all12Paid':True,'priorOwnersPreserved':True,'syntheticGameplaySetup':False,'browserExecuted':False,
               'scope':'Synthetic validator fixture: declarations are input data, not real gameplay proof',
               'sourceEpoch':self.epoch,'input':input_link,'final':links[-1],'checkpoints':links,
               'combat':{'enemy':'earth-regent-incursion-v1','style':'bow' if variant=='bow' else 'blade','weaponImpacts':[{'caller':'production projectile impact' if variant=='bow' else 'production blade contact'}],
                         'contacts':[{}],'guards':[{}],'arrowFrames':[1] if variant=='bow' else [],'frames':[{'frame':{'pattern':p}} for p in ('claim-lane','false-shelter','closing-ring')]},
               'coldReloads':[{'label':label,'wholeSnapshotPreserved':True} for label in cold]}
            for key in ('positionEdits','actorPositionEdits','inventoryGrants','healthGrants','manualDamage','plantedDefeats','plantedQuestFacts','forcedModes','forcedCycles'):j[key]=0
            self.journeys[variant]=folder/'earth/EARTH_HOMECOMING_JOURNEY_REPORT.json'
            jl=put(self.journeys[variant],j)
            origin={'kind':'fixture-origin synthetic validator' if variant=='strongest' else 'continuous synthetic validator','rootReport':origin_report}
            if variant!='strongest':origin.update(original={'report':origin_report,'stages':[old_link],'reports':[]},lineage=[])
            self.rows.append({'variant':variant,'earthReport':jl,'migration':{'source':old_link,'output':migrated_link},'origin':origin,'prerequisiteLineage':lineage})
        self.cohort={'status':'passed','sourceFrozen':True,'variants':3,'results':self.rows,'sourceEpoch':self.epoch,'scope':'Synthetic link/validator fixture only'}
        for key in ('positionEdits','actorPositionEdits','inventoryGrants','healthGrants','manualDamage','plantedDefeats','plantedQuestFacts','forcedModes','forcedCycles'):self.cohort[key]=0
        self.cohort_path=self.sources/'CONNECTED_EARTH_HOMECOMING_REPORT.json';self.refresh()
    def refresh(self):put(self.cohort_path,self.cohort);self.cohort_sha=sha(self.cohort_path)
    def spec(self,**kw):
        args={'root':self.root,'sources':self.sources,'cohort_path':self.cohort_path,'cohort_sha':self.cohort_sha,'output':self.output,'windows':False};args.update(kw)
        return V.earth_homecoming_browser_run_spec(**args)
    def change_journey(self,variant,edit):
        p=self.journeys[variant];j=json.loads(p.read_text());edit(j);link=put(p,j)
        next(r for r in self.cohort['results'] if r['variant']==variant)['earthReport']=link;self.refresh()

class EarthNativeVerifier(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(prefix='firstlight-earth-verifier-cpu-')
        self.addCleanup(self.tmp.cleanup);self.f=Fixture(Path(self.tmp.name))
    def test_actual_strict_validator_builds_explicit_current_command_without_output_creation(self):
        command,env=self.f.spec();self.assertEqual(command[:2],[sys.executable,'tools/earth_homecoming_browser.py'])
        expected={'--root':str(self.f.root),'--sources':str(self.f.sources),'--cohort-sha':self.f.cohort_sha,'--earned-caller-root':str(self.f.callers),'--output':str(self.f.output),'--renderer':'software','--variant':'all'}
        self.assertEqual(dict(zip(command[2::2],command[3::2])),expected);self.assertEqual(env,{'FIRSTLIGHT_ROOT':str(self.f.root),'PYTHONDONTWRITEBYTECODE':'1'})
        self.assertFalse(self.f.output.exists());self.assertFalse(any('isolated-profile' in str(p) for p in Path(self.tmp.name).rglob('*')))
    def test_old_hash_and_mutated_cohort_refuse_instead_of_rehashing(self):
        original=self.f.cohort_sha;self.f.cohort['scope']='modified receipt';self.f.refresh()
        with self.assertRaisesRegex(ValueError,'hash changed'):self.f.spec(cohort_sha=original)
        with self.assertRaisesRegex(ValueError,'hash changed'):self.f.spec(cohort_sha='bad')
    def test_failed_or_seed_only_report_refuses_even_when_hash_matches(self):
        self.f.cohort['status']='failed';self.f.refresh()
        with self.assertRaisesRegex(ValueError,'Complete three-path'):self.f.spec()
        self.f.cohort['status']='passed';self.f.cohort['results']=[];self.f.refresh()
        with self.assertRaisesRegex(ValueError,'Unique blade'):self.f.spec()
    def test_missing_zero_or_boolean_impostor_refuses(self):
        self.f.cohort.pop('forcedModes');self.f.refresh()
        with self.assertRaisesRegex(ValueError,'Complete three-path'):self.f.spec()
        self.f.cohort['forcedModes']=False;self.f.refresh()
        with self.assertRaisesRegex(ValueError,'Complete three-path'):self.f.spec()
    def test_failed_journey_and_wrong_cold_boundary_refuse(self):
        self.f.change_journey('bow',lambda j:j.update(status='failed'))
        with self.assertRaisesRegex(ValueError,'Complete actual installed'):self.f.spec()
        self.f.change_journey('bow',lambda j:(j.update(status='passed'),j['coldReloads'].pop()))
        with self.assertRaisesRegex(ValueError,'cold-reload'):self.f.spec()
    def test_checkpoint_tamper_is_refused_without_profile_creation(self):
        link=self.f.rows[0]['earthReport'];j=json.loads(Path(link['path']).read_text());p=Path(j['checkpoints'][0]['path']);p.write_bytes(p.read_bytes()+b' ')
        with self.assertRaisesRegex(ValueError,'Linked bytes'):self.f.spec()
        self.assertFalse(self.f.output.exists())
    def test_checkpoint_escape_is_refused_even_with_correct_hash(self):
        outside=put(Path(self.tmp.name)/'OUTSIDE.json',{'synthetic':'outside'})
        def edit(j):j['checkpoints'][0]={**outside,'path':str(Path(self.tmp.name)/'01_ACCEPTED.json')}
        Path(self.tmp.name,'01_ACCEPTED.json').write_bytes(Path(outside['path']).read_bytes())
        self.f.change_journey('blade',edit)
        with self.assertRaisesRegex(ValueError,'escapes'):self.f.spec()
    def test_actual_source_or_manifest_drift_refuses(self):
        p=self.f.root/'src/core.js';p.write_text('changed source',encoding='utf8')
        with self.assertRaisesRegex(ValueError,'Installed source drift'):self.f.spec()
    def test_manifest_disagreement_refuses_despite_new_valid_manifest_hash(self):
        manifest=self.f.root/'SOURCE_EPOCH.json';changed=json.loads(manifest.read_text());changed['sourceHashes']['src/core.js']='0'*64
        self.f.cohort['sourceEpoch']['manifests']['installedManifest']=put(manifest,changed);self.f.refresh()
        with self.assertRaisesRegex(ValueError,'Manifest and earned'):self.f.spec()
    def test_unaccepted_seed_and_actually_paid_outcome_are_required(self):
        original=json.loads(self.f.journeys['blade'].read_text());value=json.loads(Path(original['input']['path']).read_text());value['earthHomecoming']['accepted']=True
        # Separate linked input avoids an earlier migration-output hash failure,
        # so this probe reaches the actual unaccepted-seed semantic guard.
        link=put(self.f.sources/'blade/ACCEPTED_INPUT.json',value)
        self.f.change_journey('blade',lambda j:j.update(input=link))
        with self.assertRaisesRegex(ValueError,'unaccepted'):self.f.spec()
        self.f.change_journey('blade',lambda j:j.update(input=original['input']))
        final=Path(original['final']['path']);value=json.loads(final.read_text());value['earthHomecoming']['claimed']=False;unpaid=put(final,value)
        def edit(j):j['final']=unpaid;j['checkpoints'][-1]=unpaid
        self.f.change_journey('blade',edit)
        with self.assertRaisesRegex(ValueError,'paid Earth outcome'):self.f.spec()
    def test_native_gate_is_in_browser_branch_only_and_cohort_hash_is_captured_once(self):
        tree=ast.parse(VERIFY.read_text(encoding='utf8'))
        main=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='main')
        branches=[n for n in main.body if isinstance(n,ast.If) and isinstance(n.test,ast.Attribute) and n.test.attr=='browser']
        self.assertEqual(len(branches),1)
        calls=[n for n in ast.walk(branches[0]) if isinstance(n,ast.Call) and isinstance(n.func,ast.Name) and n.func.id=='run']
        self.assertTrue(any(isinstance(c.args[0],ast.Constant) and c.args[0].value=='earth_homecoming_browser' for c in calls))
        native_all=[n for n in ast.walk(main) if isinstance(n,ast.Call) and isinstance(n.func,ast.Name) and n.func.id=='run' and n.args and isinstance(n.args[0],ast.Constant) and n.args[0].value=='earth_homecoming_browser']
        self.assertEqual(len(native_all),1)
        captures=[n for n in main.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='homecoming_cohort_sha' for t in n.targets)]
        self.assertEqual(len(captures),1)
        self.assertIn('homecoming_cohort_sha',ast.unparse(branches[0]))
    def test_missing_source_epoch_member_refuses(self):
        self.f.cohort['sourceEpoch']=copy.deepcopy(self.f.epoch);self.f.cohort['sourceEpoch']['actual'].pop('src/core.js');self.f.refresh()
        with self.assertRaisesRegex(ValueError,'every current source'):self.f.spec()
    def test_wrong_root_or_missing_callers_refuse(self):
        with self.assertRaisesRegex(ValueError,'explicit root'):self.f.spec(root=Path(self.tmp.name)/'missing-root')
        wrong=Path(self.tmp.name)/'other-root';(wrong/'tools/earth-homecoming-journey').mkdir(parents=True);text(wrong/'tools/earth_homecoming_browser.py',NATIVE.read_text(encoding='utf8'))
        with self.assertRaises((ValueError,OSError)):
            self.f.spec(root=wrong)
    def test_cohort_must_be_exact_child_of_given_sources(self):
        other=put(self.f.sources/'OTHER_REPORT.json',self.f.cohort)
        with self.assertRaisesRegex(ValueError,'exact cohort'):self.f.spec(cohort_path=other['path'])
    def test_existing_overlapping_and_drive_root_outputs_refuse(self):
        self.f.output.mkdir(parents=True);(self.f.output/'OLD_REPORT.json').write_bytes(b'preserve')
        with self.assertRaisesRegex(ValueError,'new bounded'):self.f.spec()
        self.assertEqual((self.f.output/'OLD_REPORT.json').read_bytes(),b'preserve')
        with self.assertRaisesRegex(ValueError,'separate trees'):self.f.spec(output=self.f.sources/'new-output')
        with self.assertRaisesRegex(ValueError,'new bounded'):self.f.spec(output=Path(self.tmp.name).anchor)
    def test_windows_non_d_output_is_refused_without_requiring_d_for_cpu_fixtures(self):
        with self.assertRaisesRegex(ValueError,'D: on Windows'):self.f.spec(windows=True,output=Path(self.tmp.name)/'new-native')
        self.assertFalse(self.f.output.exists())
    def test_platform_portable_repo_default_env_override_and_explicit_cli_root(self):
        with patch.dict(os.environ,{},clear=True):
            spec=importlib.util.spec_from_file_location('portable_default_native',NATIVE);n=importlib.util.module_from_spec(spec);spec.loader.exec_module(n)
            self.assertEqual(n.ROOT,ROOT)
        with patch.dict(os.environ,{'FIRSTLIGHT_ROOT':str(self.f.root)}):
            spec=importlib.util.spec_from_file_location('portable_env_native',NATIVE);n=importlib.util.module_from_spec(spec);spec.loader.exec_module(n)
            self.assertEqual(n.ROOT,self.f.root)
        with patch.dict(os.environ,{'FIRSTLIGHT_ROOT':str(Path(self.tmp.name)/'wrong-env')}):
            command,_=self.f.spec();self.assertEqual(command[command.index('--root')+1],str(self.f.root))
    def test_main_dispatches_native_only_after_current_earned_preflight_in_same_invocation(self):
        calls=[]
        def fake_run(command,**kw):
            calls.append((command,kw));kw['stdout'].write(b'CPU orchestration sink: no subprocess launched\n');return SimpleNamespace(returncode=0)
        browser=Path(self.tmp.name)/'main-browser';args=['verify.py','--browser','--output',str(self.f.logs),'--browser-output',str(browser),'--browser-output-mode','supported']
        # os is local to V; pathlib/native retain the actual host. This tests
        # portable POSIX output routing on every platform, without browser work.
        with patch.object(V,'ROOT',self.f.root),patch.object(V,'os',SimpleNamespace(name='posix',environ=os.environ)),patch.object(V.sys,'argv',args),patch.object(V.shutil,'which',return_value='node'),patch.object(V.subprocess,'check_output',return_value='v24.18.0\n'),patch.object(V.subprocess,'run',side_effect=fake_run),patch.object(V,'prepare_browser_sources',return_value=None),contextlib.redirect_stdout(io.StringIO()):V.main()
        labels=[command[1] for command,_ in calls if len(command)>1]
        native=[(c,k) for c,k in calls if len(c)>1 and c[1]=='tools/earth_homecoming_browser.py'];self.assertEqual(len(native),1)
        c,k=native[0];self.assertEqual(k['timeout'],1800);self.assertEqual(c[c.index('--cohort-sha')+1],self.f.cohort_sha);self.assertEqual(c[c.index('--output')+1],str(browser/'earth_homecoming_browser'))
        self.assertLess(labels.index('tools/earth_homecoming_journey.cjs'),labels.index('tests/test_earth_homecoming_native.py'));self.assertLess(labels.index('tests/test_earth_homecoming_native.py'),labels.index('tools/earth_homecoming_browser.py'))
        existing=[(c,k) for c,k in calls if len(c)>1 and c[1].startswith('tests/') and c[1].endswith('_browser.py')]
        self.assertEqual(len(existing),45);self.assertEqual(len({c[1] for c,k in existing}),45)
        for c,k in existing:
            suite=Path(c[1]).stem;expected=1200 if suite in ('cosmos_campaign_browser','atlantis_campaign_browser','heaven_campaign_browser','hell_campaign_browser','realm_givers_browser','local_life_browser') else 600
            self.assertEqual(k['timeout'],expected,suite)
            spec_command,spec_env=V.browser_run_spec(suite,browser,'supported');self.assertEqual(c,spec_command);self.assertTrue(spec_env.items()<=k['env'].items())
        self.assertFalse((browser/'earth_homecoming_browser').exists());self.assertFalse(any('isolated-profile' in str(p) for p in browser.rglob('*')))
    def test_legacy_guarded_supported_and_default_routing_remain_exact(self):
        guarded={'realm_givers_browser','realm_trails_north_browser','coastward_bridge_posts_browser','practice_visibility_browser','hell_campaign_browser','heaven_campaign_browser','atlantis_campaign_browser','cosmos_campaign_browser'}
        self.assertEqual(set(V.GUARDED_BROWSER_OUTPUTS),guarded)
        for suite in guarded:
            c,e=V.browser_run_spec(suite,self.f.output);self.assertIn('--output',c);self.assertEqual(e,{})
        for suite in ['bridge_browser','earth_story_transactions_browser',*V.ENV_BROWSER_OUTPUTS]:
            self.assertEqual(V.browser_run_spec(suite,self.f.output),([sys.executable,f'tests/{suite}.py'],{}))
        for suite in V.CLI_BROWSER_OUTPUTS:
            c,e=V.browser_run_spec(suite,self.f.output,'supported');self.assertEqual(c[c.index('--output')+1],str(self.f.output/suite));self.assertEqual(e,{})
        for suite,key in V.ENV_BROWSER_OUTPUTS.items():self.assertEqual(V.browser_run_spec(suite,self.f.output,'supported'),([sys.executable,f'tests/{suite}.py'],{key:str(self.f.output/suite)}))
        self.assertEqual(V.browser_run_spec('realm_givers_browser',None),([sys.executable,'tests/realm_givers_browser.py'],{}))

if __name__=='__main__':unittest.main(verbosity=2)
