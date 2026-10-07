"""CPU preparation only: real earned byte links and tampered receipt negatives.
No browser/profile/server is created; native preparation is not native success.
"""
import ast
import copy
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import unittest
from unittest.mock import patch

HERE=Path(__file__).resolve().parent
_default_tool=HERE/'earth_homecoming_browser.py'
if not _default_tool.is_file():
    _default_tool=Path(os.environ.get('FIRSTLIGHT_ROOT',str(HERE.parent)))/'tools/earth_homecoming_browser.py'
TOOL=Path(os.environ.get('EARTH_NATIVE_TOOL',str(_default_tool))).resolve()
spec=importlib.util.spec_from_file_location('prepared_earth_native',TOOL)
N=importlib.util.module_from_spec(spec);spec.loader.exec_module(N)
SOURCES=Path(os.environ['EARTH_EARNED_SOURCES']) if os.environ.get('EARTH_EARNED_SOURCES') else None
COHORT_SHA=os.environ.get('EARTH_EARNED_COHORT_SHA')


class OptionalCatalogueOracle(unittest.TestCase):
    def historical(self):
        source=N.ROOT/'tests/fixtures/earth-homecoming-prerequisites/blade/ALL_TWELVE_PREREQUISITES_EARNED.json'
        self.assertEqual(N.sha(source),N.HISTORICAL_INPUTS['blade'][1])
        return source,N.read_json(source)

    def test_exact_legacy_input_preserves_all_facts_and_adds_only_literal_fresh_defaults(self):
        source,old=self.historical();original=copy.deepcopy(old);expected=copy.deepcopy(old)
        expected['earthHomecoming']={'version':1,'accepted':False,'steps':[],'choice':None,'claimed':False}
        expected['earthWildSigns']={'version': 1, 'accepted': False, 'evidence': [], 'observed': False, 'resolution': None, 'cleared': False, 'claimed': False}
        expected['localLife']['records']['earth-first-load-through-v1']={'accepted':False,'choice':None,'steps':[],'claimed':False}
        self.assertEqual(N.expected_optional_defaults(old),expected)
        self.assertEqual(old,original);self.assertEqual(N.sha(source),N.HISTORICAL_INPUTS['blade'][1])

    def test_existing_fifth_history_never_receives_fresh_record_allowance(self):
        _,old=self.historical()
        for record in ({'accepted':True,'choice':'south-stormfall','steps':[],'claimed':False},
                       {'accepted':True,'choice':'south-stormfall','steps':['arrive-meadow-stop'],'claimed':False}):
            with self.subTest(record=record):
                before=copy.deepcopy(old);before['localLife']['records']['earth-first-load-through-v1']=record
                expected=N.expected_optional_defaults(before)
                self.assertEqual(expected['localLife'],before['localLife'])
                bad=copy.deepcopy(expected);bad['localLife']['records']['earth-first-load-through-v1']={'accepted':False,'choice':None,'steps':[],'claimed':False}
                self.assertNotEqual(expected,bad)
        for mutate in (lambda w:w['localLife']['records'].pop('cosmos-drawing-shelf-v1'),
                       lambda w:w['localLife']['records'].update(unknown={}),
                       lambda w:w['localLife'].update(version=True)):
            before=copy.deepcopy(old);mutate(before)
            self.assertEqual(N.expected_optional_defaults(before)['localLife'],before['localLife'])

    def test_present_wild_signs_history_never_receives_fresh_allowance(self):
        _,old=self.historical()
        fresh={'version': 1, 'accepted': False, 'evidence': [], 'observed': False, 'resolution': None, 'cleared': False, 'claimed': False}
        for owner in (None, fresh, {**fresh,'accepted':True},
                      {**fresh,'accepted':True,'evidence':['timber-gouge','feeding-track'],
                       'observed':True}, {**fresh,'claimed':True}):
            before=copy.deepcopy(old);before['earthWildSigns']=copy.deepcopy(owner)
            original=copy.deepcopy(before);expected=N.expected_optional_defaults(before)
            self.assertEqual(expected['earthWildSigns'],owner)
            self.assertEqual(before,original)
            changed=copy.deepcopy(expected);changed['earthWildSigns']={**fresh,'observed':True}
            self.assertNotEqual(expected,changed)
        source,old=self.historical();expected=N.expected_optional_defaults(old)
        self.assertEqual(expected['earthWildSigns'],fresh)
        for key,value in (('accepted',True),('evidence',['timber-gouge']),
                          ('observed',True),('resolution','signed-loop'),('cleared',True),
                          ('claimed',True),('version',2)):
            changed=copy.deepcopy(expected);changed['earthWildSigns'][key]=value
            self.assertNotEqual(expected,changed)
        self.assertEqual(N.sha(source),N.HISTORICAL_INPUTS['blade'][1])

    def test_existing_homecoming_is_refused_instead_of_reset(self):
        _,old=self.historical()
        for owner in (None,N.FRESH,{**N.FRESH,'accepted':True}):
            before=copy.deepcopy(old);before['earthHomecoming']=owner;original=copy.deepcopy(before)
            with self.assertRaisesRegex(ValueError,'must lack'):N.expected_optional_defaults(before)
            self.assertEqual(before,original)


if SOURCES is None:
    class ExplicitCurrentCohortRequired(unittest.TestCase):
        @unittest.skip('Run the verifier current Earth earned cohort and explicit native preflight; generic discovery has no cohort.')
        def test_explicit_current_earned_cohort_required(self):
            pass
else:
    class NativePreflight(unittest.TestCase):
        @classmethod
        def setUpClass(cls):
            cls.proof,cls.frozen=N.read_provenance(SOURCES,tuple(N.VARIANTS),COHORT_SHA,caller_root=os.environ.get('EARTH_EARNED_CALLER_ROOT'))
            cls.journey=cls.proof['bow']['journey']
            cls.text=TOOL.read_text(encoding='utf8')

        def altered(self,edit,pattern):
            value=copy.deepcopy(self.journey);edit(value)
            with self.assertRaisesRegex(ValueError,pattern):N.validate_journey(value,'bow')

        def test_actual_complete_cohort_has_three_exact_unaccepted_inputs(self):
            self.assertEqual(set(self.proof),{'blade','bow','strongest'})
            for p in self.proof.values():self.assertEqual(N.read_json(p['seed'])['earthHomecoming'],N.FRESH)
            required={str(Path(link['path']).resolve()) for row in self.proof.values() for link in [row['journey']['input'],row['journey']['final'],*row['journey']['checkpoints']]}
            required.update(str((N.ROOT/name).resolve()) for name in self.proof['blade']['journey']['sourceEpoch']['actual'])
            self.assertTrue(required.issubset(self.frozen))

        def test_same_named_strongest_inputs_never_replace_earth_final(self):
            p=self.proof['strongest'];self.assertEqual(Path(p['seed']).stem,'FINAL_WORLD')
            self.assertNotEqual(Path(p['seed']).resolve(),Path(p['checkpoints']['FINAL_WORLD']).resolve())
            self.assertFalse(N.read_json(p['seed'])['earthHomecoming']['accepted'])
            self.assertTrue(N.read_json(p['checkpoints']['FINAL_WORLD'])['earthHomecoming']['claimed'])

        def test_altered_checkpoint_byte_link_refuses(self):
            link=copy.deepcopy(self.journey['checkpoints'][0]);link['sha256']='0'*64
            with self.assertRaisesRegex(ValueError,'Linked bytes'):N.verify_link(link,SOURCES)

        def test_portable_fixture_contract_rejects_changed_origin_or_source_delta(self):
            metadata=N.read_json(N.ROOT/'tests/fixtures/earth-homecoming-prerequisites/PROVENANCE.json')
            expected=metadata['records']['blade'];epoch=self.proof['blade']['journey']['sourceEpoch']
            row={'migration':{'source':{'path':str(N.ROOT/expected['path']),'sha256':expected['sha256']}},
                 'origin':{**expected['origin'],'portableInputScope':metadata['scope'],'originalReportsReplayed':False},
                 'historicalSourceHashes':expected['sourceHashes'],
                 'sourceDeltas':[{'path':k,'historicalSha256':v,'currentActualSha256':epoch['actual'].get(k)} for k,v in expected['sourceHashes'].items() if epoch['actual'].get(k)!=v]}
            self.assertIn('not replayed',N.portable_origin(row,'blade',N.ROOT,epoch,{}))
            changed=copy.deepcopy(row);changed['origin']['originalReportsReplayed']=True
            with self.assertRaisesRegex(ValueError,'disclosure'):N.portable_origin(changed,'blade',N.ROOT,epoch,{})
            changed=copy.deepcopy(row);changed['sourceDeltas'].pop()
            with self.assertRaisesRegex(ValueError,'source changes'):N.portable_origin(changed,'blade',N.ROOT,epoch,{})
            changed=copy.deepcopy(row);changed['migration']['source']=self.proof['strongest']['cohort_row']['migration']['source']
            with self.assertRaisesRegex(ValueError,'escapes|declared'):N.portable_origin(changed,'blade',N.ROOT,epoch,{})

        def test_wrong_link_size_refuses(self):
            link=copy.deepcopy(self.journey['checkpoints'][0]);link['bytes']+=1
            with self.assertRaisesRegex(ValueError,'Linked size'):N.verify_link(link,SOURCES)

        def test_checkpoint_escaping_source_root_refuses_even_with_real_hash(self):
            link=self.proof['blade']['cohort_row']['migration']['source']
            with self.assertRaisesRegex(ValueError,'escapes'):N.verify_link(link,SOURCES)

        def test_wrong_cohort_hash_refuses_before_any_runtime_import(self):
            with self.assertRaisesRegex(ValueError,'Linked bytes'):N.read_provenance(SOURCES,('blade',),'0'*64)

        def test_missing_integer_zero_and_boolean_impostor_refuse(self):
            self.altered(lambda j:j.pop('forcedCycles'),'integer zero')
            self.altered(lambda j:j.update(manualDamage=False),'integer zero')
            self.altered(lambda j:j.update(positionEdits=1),'integer zero')

        def test_seed_only_or_failed_earned_receipt_refuses(self):
            self.altered(lambda j:j.update(status='seed-only'),'Complete actual')
            self.altered(lambda j:j.update(all12Paid=False),'Complete actual')

        def test_changed_choice_and_prepared_plan_refuse(self):
            self.altered(lambda j:j.update(choice='public-watch'),'representative plan')
            self.altered(lambda j:j.update(prepared=False),'representative plan')

        def test_unearned_or_synthetic_gameplay_receipt_refuses(self):
            self.altered(lambda j:j.update(syntheticGameplaySetup=True),'Complete actual')
            self.altered(lambda j:j.update(sourceFrozen=False),'Complete actual')

        def test_missing_normal_ai_tell_or_weapon_impact_refuses(self):
            self.altered(lambda j:j['combat'].update(frames=[]),'naturally scheduled')
            self.altered(lambda j:j['combat'].update(weaponImpacts=[]),'naturally scheduled')

        def test_bow_cannot_be_certified_by_aggregate_or_companion_damage(self):
            self.altered(lambda j:j['combat'].update(arrowFrames=0),'traveling arrows')
            self.altered(lambda j:j['combat']['weaponImpacts'][0].update(caller='aggregate HP loss'),'attributed production')

        def test_missing_cold_boundary_or_failed_snapshot_refuses(self):
            self.altered(lambda j:j['coldReloads'].pop(4),'Every complete')
            self.altered(lambda j:j['coldReloads'][0].update(wholeSnapshotPreserved=False),'preservation evidence')

        def test_existing_or_nested_output_never_overwrites_evidence(self):
            with self.assertRaises(FileExistsError):N.guard_paths(SOURCES,SOURCES)
            with self.assertRaisesRegex(ValueError,'separate'):N.guard_paths(SOURCES/'unused-new-output',SOURCES)

        def test_only_six_explicit_profile_names_and_no_parent_escape(self):
            self.assertEqual(len(N.PROFILES),6)
            with self.assertRaisesRegex(ValueError,'Exactly six'):N.profile_path(HERE/'NOT_CREATED','../personal')
            with self.assertRaisesRegex(ValueError,'bounded'):N.bounded(Path('D:/'),windows=True)

        def test_import_is_inert_and_cli_help_never_loads_playwright(self):
            self.assertNotIn('firstlight_earth_native_infrastructure',sys.modules)
            p=subprocess.run([sys.executable,str(TOOL),'--help'],capture_output=True,text=True)
            self.assertEqual(p.returncode,0,p.stderr);self.assertIn('--preflight-only',p.stdout)

        def test_cohort_hash_is_mandatory_before_any_browser_import(self):
            output=HERE/'NOT_CREATED-implicit-old-cohort'
            p=subprocess.run([sys.executable,str(TOOL),'--sources',str(SOURCES),'--output',str(output),'--preflight-only'],capture_output=True,text=True)
            self.assertNotEqual(p.returncode,0);self.assertIn('--cohort-sha',p.stderr);self.assertFalse(output.exists())

        def test_embedded_native_javascript_compiles_without_executing_a_client(self):
            tree=ast.parse(self.text);strings=[N.INITIALIZE,N.COMBAT_OBSERVER]
            for call in ast.walk(tree):
                if isinstance(call,ast.Call) and isinstance(call.func,ast.Attribute) and call.func.attr in ('ev','wait_for_function') and call.args and isinstance(call.args[0],ast.Constant) and isinstance(call.args[0].value,str):strings.append(call.args[0].value)
            compiler="const fs=require('fs'),s=JSON.parse(fs.readFileSync(0,'utf8'));for(const x of s)new Function(x);console.log(s.length);"
            p=subprocess.run(['node','-e',compiler],input=json.dumps(strings),capture_output=True,text=True)
            self.assertEqual(p.returncode,0,p.stderr);self.assertGreater(int(p.stdout),25)
            red=subprocess.run(['node','-e',compiler],input=json.dumps(strings+['()=>{unclosed(']),capture_output=True,text=True)
            self.assertNotEqual(red.returncode,0);self.assertIn('SyntaxError',red.stderr)

        def test_preflight_only_never_calls_browser_or_creates_output(self):
            output=HERE/'NOT_CREATED-preflight-output'
            self.assertFalse(output.exists())
            with patch.object(N,'load_base',side_effect=AssertionError('forbidden browser import')):
                args=['--sources',str(SOURCES),'--output',str(output),'--cohort-sha',COHORT_SHA,'--preflight-only']
                if os.environ.get('EARTH_EARNED_CALLER_ROOT'):args+=['--earned-caller-root',os.environ['EARTH_EARNED_CALLER_ROOT']]
                self.assertEqual(N.main(args),0)
            self.assertFalse(output.exists())

        def test_native_earned_path_has_no_test_ledger_damage_pose_or_camera_grants(self):
            banned=(r'Realm\.test\.(?:adventure|earthHomecomingCommand|replace|enter|leave|view|weather|quality|save|setTime|pause)\(',
                    r'\.hp\s*=(?!=)',r'\.mode\s*=(?!=)',r'\.steps\.(?:push|splice)\(',r'\.state\.player\s*=(?!=)',r'\.claimed\s*=(?!=)')
            for rule in banned:self.assertIsNone(re.search(rule,self.text),rule)
            self.assertIn("self.page.keyboard.press('f')",self.text)
            self.assertIn("self.page.locator('#skill-auto').click()",self.text)
            self.assertIn("self.page.locator('#skill-guard').click()",self.text)

        def test_refused_exhaustion_and_derivatives_are_separate_not_earned_flags(self):
            self.assertIn("self.enemy()['hp']==1 and 'regent-repelled' not in",self.text)
            self.assertIn("self.ready_worlds['blade']",self.text)
            self.assertIn("self.provenance['blade']['checkpoints']['02_RELAYS']",self.text)
            self.assertIn("'never_earned_progress':True",self.text)
            self.assertNotIn('record_video_dir',self.text)

        def test_cleanup_remains_inside_playwright_and_failed_completion_is_not_pooled(self):
            tree=ast.parse(self.text);main=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='main')
            with_nodes=[n for n in ast.walk(main) if isinstance(n,ast.With)]
            self.assertTrue(any(any(isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and n.func.attr=='close' for n in ast.walk(w)) for w in with_nodes))
            self.assertIn("report['completed_earned_stages']=sum",self.text)
            self.assertIn("report['planned_earned_stages']=len(flags)*len(STAGES)",self.text)

        def test_every_link_and_actual_source_stays_unchanged_through_cpu_preparation(self):
            self.assertTrue(all(N.sha(p)==h for p,h in self.frozen.items()))

        def test_exact_observer_attributes_real_key_attack_without_payload_target(self):
            # Synthetic room/position boundary only, actual byte-bound earned relays,
            # Core/Character Store/quest command/roster/weapon owners. No browser,
            # planted challenge/HP/defeat, or validator/roster facade.
            payload={'root':str(N.ROOT),'source':self.proof['blade']['checkpoints']['02_RELAYS'],'observer':N.COMBAT_OBSERVER}
            js=r"""const fs=require('fs'),path=require('path'),assert=require('assert/strict'),p=JSON.parse(process.argv[1]);
             const load=n=>require(path.join(p.root,'src',n+'.js')),C=load('core'),CS=load('characters'),H=load('earth-homecoming'),A=load('adventure'),W=load('world-foundations');
             const sim=new C.Simulation(JSON.parse(fs.readFileSync(p.source))),values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},store=new CS.Store(storage);store.load();assert.ok(store.save(sim.snapshot()).ok);
             sim.room=H.definition.room;sim.state.player={x:H.definition.enemy.x,z:H.definition.enemy.z,yaw:0};const ctx={sim,active:store.active};assert.ok(H.command(ctx,'step',{quest:H.definition.id,step:'challenge-regent',expectedActive:ctx.active,expectedRevision:sim.state.adventure.revision},{save:world=>store.save(world)}).ok);
             A.tick(sim,.05);const e=A.runtime(sim).enemies.find(e=>e.id===H.definition.enemy.id);assert.ok(H.owned(sim,e));global.window=globalThis;const install=eval('('+p.observer+')');install(sim);
             sim.state.player.z=e.z+12;const missed=sim.adventureCommand('CPU-key-out-of-reach','attack',{});assert.equal(missed.ok,false);assert.equal(__hvcCombat.weaponImpacts.length,0);
             sim.state.player.z=e.z+2.1;const before=e.hp,result=sim.adventureCommand('CPU-native-F-payload','attack',{});assert.ok(result.ok,result.error);assert.ok(e.hp<before);const impacts=__hvcCombat.finish().weaponImpacts;assert.equal(impacts.length,1);assert.equal(impacts[0].source,'production blade contact');assert.equal(impacts[0].before,before);assert.equal(impacts[0].after,e.hp);delete global.window;delete global.__hvcCombat;
             console.log(JSON.stringify({syntheticPositionBoundary:true,actualOwners:true,commandPayload:{},contacts:impacts.length,browser:false}));"""
            r=subprocess.run(['node','-e',js,json.dumps(payload)],capture_output=True,text=True)
            self.assertEqual(r.returncode,0,r.stderr);self.assertEqual(json.loads(r.stdout)['contacts'],1)

        def test_actual_installed_core_eligibility_optional_migration_ui_and_support(self):
            # Real installed module loading, no validator/snapshot/roster facade.
            # Minimal RPG object supplies presentation context only; no command is
            # dispatched. Synthetic room selection labels UI projection, not play.
            payload={'root':str(N.ROOT),'proof':{k:{'seed':v['seed'],'checkpoints':v['checkpoints'],'cohort_row':{'migration':{'source':v['cohort_row']['migration']['source']}}} for k,v in self.proof.items()}}
            js=r"""const fs=require('fs'),path=require('path'),assert=require('assert/strict'),p=JSON.parse(process.argv[1]);
             const load=n=>require(path.join(p.root,'src',n+'.js'));load('engine');const C=load('core'),H=load('earth-homecoming'),A=load('adventure'),W=load('world-foundations'),UI=load('earth-homecoming-ui'),Art=load('earth-homecoming-art');load('earth-story');
             const read=f=>JSON.parse(fs.readFileSync(f));for(const[k,v]of Object.entries(p.proof)){const seed=read(v.seed),world=C.validate(seed);assert.deepEqual(world,seed);assert.ok(H.eligible(world));assert.deepEqual(world.earthHomecoming,H.fresh());const final=C.validate(read(v.checkpoints.FINAL_WORLD));assert.ok(H.ready(final)&&final.earthHomecoming.claimed);}
             const old=read(p.proof.strongest.cohort_row.migration.source.path),expected=structuredClone(old),m=C.validate(old);assert.deepEqual(m.earthHomecoming,H.fresh());delete m.earthHomecoming;
             if(!('earthWildSigns' in old))expected.earthWildSigns={version:1,accepted:false,evidence:[],observed:false,resolution:null,cleared:false,claimed:false};
             const ids=['heaven-propagation-bed-v1','hell-refuge-water-v1','atlantis-bellglass-lamp-v1','cosmos-drawing-shelf-v1'].sort(),l=expected.localLife;
             if(l.version===1&&Object.keys(l).length===2&&Object.hasOwn(l,'version')&&Object.hasOwn(l,'records')&&Object.keys(l.records).length===ids.length&&ids.every(id=>Object.hasOwn(l.records,id)))l.records['earth-first-load-through-v1']={accepted:false,choice:null,steps:[],claimed:false};
             assert.deepEqual(m,expected);assert.deepEqual(read(p.proof.strongest.cohort_row.migration.source.path),old);
             const accepted=new C.Simulation(read(p.proof.blade.checkpoints['01_ACCEPTED'])),rpg={sim:accepted,api:{worldContext:()=>({sim:accepted,active:'CPU-display-context',revision:1})}},ui=new UI.EarthHomecomingUI(rpg);
             const panel=ui.panel().html;assert.ok(panel.includes('world-select')&&panel.includes('earthlands')&&panel.includes('Broad claim lane')&&panel.includes('Narrow false shelter')&&panel.includes('Closing ring'));assert.ok(!panel.includes('earth-homecoming-claim"'));
             accepted.room=H.definition.room;const atEarth=ui.panel().html;assert.ok(atEarth.includes('earth-homecoming-walk')&&atEarth.includes('bridge-record'));assert.ok(!atEarth.includes('data-rpg="earth-homecoming-step" data-id="regent-repelled"'));
             for(const q of[H.definition.enemy,...H.definition.steps.filter(s=>s.room===H.definition.room)])assert.ok(W.walkable(H.definition.room,q.x,q.z,q.radius||.31));
             const snapshot=accepted.snapshot(),out={box:[],octa:[],round:[],disc:[]};Art.draw(out,accepted);assert.deepEqual(accepted.snapshot(),snapshot);assert.ok(out.box.some(p=>p.earthHomecomingFixture==='west-relay-isolated'));assert.ok(out.box.every(p=>p.appearanceOnly===true&&p.cameraSolid===false));
             console.log(JSON.stringify({cases:8,actualOwners:true,syntheticRoomProjection:true,browser:false}));"""
            r=subprocess.run(['node','-e',js,json.dumps(payload)],capture_output=True,text=True)
            self.assertEqual(r.returncode,0,r.stderr);self.assertEqual(json.loads(r.stdout)['cases'],8)


if __name__=='__main__':
    unittest.main(verbosity=2)
