"""Focused CPU capture guard/controller tests. All fixtures are synthetic.

No passed native report, current cohort or GPU/recording result is fabricated.
Real installed capture preflight remains mandatory before browser import.
"""
from pathlib import Path
from types import SimpleNamespace, MethodType
import ast
import copy
import hashlib
import importlib.util
import json
import subprocess
import sys
import textwrap
import unittest
from unittest.mock import patch

HERE=Path(__file__).resolve().parent
SOURCE=HERE.parent/'tools/capture_earth_consignment.py'
if not SOURCE.is_file():SOURCE=HERE/'capture_earth_consignment.py'
s=importlib.util.spec_from_file_location('capture_first_load_cpu',SOURCE);C=importlib.util.module_from_spec(s);s.loader.exec_module(C)
NATIVE=HERE.parent/'tools/earth_consignment_browser.py'
if not NATIVE.is_file():NATIVE=HERE.parent/'native/earth_consignment_browser.py'
s=importlib.util.spec_from_file_location('capture_native_cpu',NATIVE);H=importlib.util.module_from_spec(s);s.loader.exec_module(H)


def sample():
    # Explicit synthetic header, not a saved or newly earned gameplay cohort.
    epoch={'head':'a'*40,'htmlSha256':'b'*64,'runtimeSources':{'src/core.js':'c'*64}}
    report={'status':'passed','execution':'ordinary-RAF-native-input','cohortProvenance':'current-command-earned','head':epoch['head'],'html_sha256':epoch['htmlSha256'],'sources':epoch['runtimeSources'],'harness_sha256':'d'*64,'cohort_sha256':'e'*64,'browserErrors':[],'externalRequests':[],'errors':[],'serverClosed':True,'humanAcceptance':False,'performanceCertified':False,'cases':{}}
    for name in C.CASES|C.BOUNDARIES:report['cases'][name]={'contextClosed':True,'boundary':name in C.BOUNDARIES,'checks':[{'name':'synthetic header predicate only','passed':True}]}
    return epoch,report


def supplied():
    world={'version':9,'adventure':{'version':12,'hp':100,'coins':8,'xp':20,'ore':0,'equipment':{'weapon':'synthetic-owned'},'elapsed':0,'revision':0},'sandbox':{'version':1,'inventory':{'wood':2,'fiber':3,'stone':4},'elapsed':0},'localLife':{'version':1,'records':{k:copy.deepcopy(H.FRESH) for k in H.OLD_IDS}}}
    for k in ('journeys','realmTrails','earthExpedition','hellCampaign','heavenCampaign','atlantisCampaign','cosmosCampaign','earthHomecoming','bridgeCommunity','homeHistory','notes','score','scoreRevision','retreat','visitor','flowers','seed','visited'):world[k]={}
    original=copy.deepcopy(world);world['localLife']['records'][H.JOB]={'accepted':True,'choice':'south-stormfall','steps':[],'claimed':False}
    store={'version':1,'active':'character-2','slots':[{'id':'character-2','world':copy.deepcopy(world)}]}
    # Hash reads are stubbed explicitly; no receipt file or producer is implied.
    helper=SimpleNamespace(JOB=H.JOB,preserved=H.preserved,sha=lambda path:'f'*64)
    original={'world':original,'suffix':'stormfall','source':HERE/'SYNTHETIC-original.json','journey':HERE/'SYNTHETIC-receipt.json','receipt':{'sourceHashes':{'core.js':'g'*64}}}
    origin={'source':str(original['source']),'journey':str(original['journey']),'sha256':'f'*64,'journey_sha256':'f'*64,'producerSourceHashes':original['receipt']['sourceHashes'],'provenance':'current-command-earned','prerequisitesReplayedByDriver':False,'currentCallerMatched':True}
    return world,store,{'origin':origin},original,helper


class PreflightCPU(unittest.TestCase):
    def test_report_epoch_requires_all_six_routes_and_two_boundaries(self):
        epoch,r=sample();C.validate_report(r,epoch,'d'*64,'e'*64)
        for name in C.CASES|C.BOUNDARIES:
            bad=copy.deepcopy(r);bad['cases'].pop(name)
            with self.assertRaises(ValueError):C.validate_report(bad,epoch,'d'*64,'e'*64)

    def test_failed_historical_drifted_errored_unclosed_report_is_refused(self):
        epoch,r=sample()
        for mutate in (lambda x:x.update(status='failed'),lambda x:x.update(cohortProvenance='historical-frozen-native03'),lambda x:x.update(execution='test-step'),lambda x:x.update(html_sha256='x'*64),lambda x:x['sources'].update({'src/extra.js':'a'*64}),lambda x:x.update(harness_sha256='x'*64),lambda x:x.update(cohort_sha256='x'*64),lambda x:x['errors'].append('failure'),lambda x:x['cases']['blade-south'].update(contextClosed=False),lambda x:x['cases']['blade-south']['checks'][0].update(passed=1),lambda x:x['cases']['blade-south'].update(closeEvidenceError='failed')):
            bad=copy.deepcopy(r);mutate(bad)
            with self.subTest(mutate=mutate),self.assertRaises(ValueError):C.validate_report(bad,epoch,'d'*64,'e'*64)

    def test_exact_supplied_record_and_native_owner_bytes_are_bound(self):
        w,store,row,original,helper=supplied();before=copy.deepcopy(w)
        C.validate_supplied(w,store,'blade-south',row,original,helper);self.assertEqual(w,before)
        for field,value in [('accepted',False),('choice','north-stormfall'),('choice','south-coppice'),('steps',['arrive-meadow-stop']),('claimed',True)]:
            bad=copy.deepcopy(w);bad['localLife']['records'][H.JOB][field]=value
            with self.assertRaises(ValueError):C.validate_supplied(bad,store,'blade-south',row,original,helper)
        bad=copy.deepcopy(store);bad['active']='character-1'
        with self.assertRaises(ValueError):C.validate_supplied(w,bad,'blade-south',row,original,helper)
        bad=copy.deepcopy(store);bad['slots'][0]['world']['sandbox']['inventory']['wood']+=1
        with self.assertRaises(ValueError):C.validate_supplied(w,bad,'blade-south',row,original,helper)

    def test_old_owned_history_inventory_and_forged_original_provenance_are_refused(self):
        w,store,row,original,helper=supplied()
        for mutate in (lambda x:x['earthExpedition'].update(synthetic=1),lambda x:x['homeHistory'].update(synthetic=1),lambda x:x['sandbox']['inventory'].update(wood=5),lambda x:x['adventure'].update(coins=12),lambda x:x['adventure'].update(hp=0)):
            bad=copy.deepcopy(w);mutate(bad)
            with self.assertRaises(ValueError):C.validate_supplied(bad,store,'blade-south',row,original,helper)
        bad=copy.deepcopy(row);bad['origin']['prerequisitesReplayedByDriver']=True
        with self.assertRaises(ValueError):C.validate_supplied(w,store,'blade-south',bad,original,helper)

    def test_software_or_unknown_gpu_cannot_satisfy_rtx_capture(self):
        self.assertTrue(C.hardware_rtx({'mode':'webgl2','renderer':'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11)'}))
        for r in (None,'SwiftShader NVIDIA RTX','ANGLE Intel UHD','ANGLE NVIDIA GTX 1080','llvmpipe'):
            self.assertFalse(C.hardware_rtx({'mode':'webgl2','renderer':r}))
        self.assertFalse(C.hardware_rtx({'mode':'map','renderer':'NVIDIA RTX 3080'}))

    def test_recorder_duration_and_failure_cannot_be_relabelled_as_short_success(self):
        for ms in (15000,17000,20000):self.assertTrue(C.valid_movie({'elapsed_ms':ms,'timedOut':False,'error':None}))
        for bad in ({'elapsed_ms':14999,'timedOut':False,'error':None},{'elapsed_ms':20001,'timedOut':False,'error':None},{'elapsed_ms':17000,'timedOut':True,'error':None},{'elapsed_ms':17000,'timedOut':False,'error':'download failed'}):self.assertFalse(C.valid_movie(bad))

    def test_actual_capture_import_admission_keeps_immediate_source_economy(self):
        # Only the actual two admission statements run against labelled stubs.
        # Sealed intake and final native-byte guards remain separate unchanged checks.
        tree=ast.parse(SOURCE.read_text(encoding='utf-8-sig'));main=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='main')
        def is_import(n):
            return (isinstance(n,ast.Expr) and isinstance(n.value,ast.Call) and isinstance(n.value.func,ast.Attribute)
                    and isinstance(n.value.func.value,ast.Name) and n.value.func.value.id=='h' and n.value.func.attr=='import_world')
        inner=next(n for n in ast.walk(main) if isinstance(n,ast.Try) and any(is_import(s) for s in n.body))
        start=next(i for i,n in enumerate(inner.body) if is_import(n));body=copy.deepcopy(inner.body[start:start+2])
        arguments=ast.arguments(posonlyargs=[],args=[ast.arg(arg=n)for n in ('h','H','a','initial')],vararg=None,kwonlyargs=[],kw_defaults=[],kwarg=None,defaults=[])
        function=ast.FunctionDef(name='admit',args=arguments,body=body+[ast.Return(value=ast.Constant(value=True))],decorator_list=[],type_params=[])
        namespace=dict(C.__dict__);exec(compile(ast.fix_missing_locations(ast.Module(body=[function],type_ignores=[])),str(SOURCE),'exec'),namespace)
        class Probe:
            check=H.Native.check;record=H.Native.record
            def __init__(self,world):self.world=world;self.case='SYNTHETIC-CPU-capture-admission';self.row={'checks':[]}
            def import_world(self,source):pass
            def state(self):return self.world
        initial,_,_,_,_=supplied();a=SimpleNamespace(source=HERE/'SYNTHETIC-CPU-input.json')
        with patch('builtins.print'):
            self.assertTrue(namespace['admit'](Probe(copy.deepcopy(initial)),H,a,initial))
            for mutate in (lambda w:w['adventure'].update(coins=7),lambda w:w['sandbox']['inventory'].update(wood=1),
                           lambda w:w['homeHistory'].update(synthetic_corruption=True),lambda w:w['localLife']['records'][H.JOB].update(claimed=True)):
                bad=copy.deepcopy(initial);mutate(bad)
                with self.assertRaises(AssertionError):namespace['admit'](Probe(bad),H,a,initial)

    def test_final_observed_native_bytes_preserve_exact_source_facts(self):
        world,store,_,_,_=supplied();self.assertTrue(C.saved_facts_match(json.dumps(store),world,H))
        for mutate in (lambda x:x['slots'][0]['world']['localLife']['records'][H.JOB]['steps'].append('arrive-meadow-stop'),lambda x:x['slots'][0]['world']['sandbox']['inventory'].update(wood=4),lambda x:x['slots'][0]['world']['adventure'].update(coins=12),lambda x:x.update(active='character-1')):
            bad=copy.deepcopy(store);mutate(bad);self.assertFalse(C.saved_facts_match(json.dumps(bad),world,H))
        self.assertFalse(C.saved_facts_match('not JSON',world,H))

    def test_existing_output_cli_refuses_before_browser_or_source_intake(self):
        result=subprocess.run([sys.executable,'-B',str(SOURCE),'--output',str(HERE),'--cohort','missing.json','--native-report','missing.json','--source','missing.json','--case','blade-south','--source-sha256','a'*64,'--native-report-sha256','b'*64],capture_output=True,text=True)
        self.assertEqual(result.returncode,2);self.assertIn('New absolute external D output required',result.stderr);self.assertNotIn('playwright',result.stderr.lower())

    def test_preflight_seals_fail_before_native_import_or_browser_work(self):
        a=SimpleNamespace(source_sha256='A'*64,native_report_sha256='b'*64,source=HERE/'SYNTHETIC-world.json',native_report=HERE/'SYNTHETIC-report.json')
        with patch.object(C,'load_native',side_effect=AssertionError('must not import native')):
            with self.assertRaisesRegex(ValueError,'sealed lowercase'):C.preflight(a)
            a.source_sha256='a'*64
            with patch.object(C,'sha',return_value='c'*64):
                with self.assertRaisesRegex(ValueError,'Sealed native input/report bytes changed'):C.preflight(a)


class ControllerCPU(unittest.TestCase):
    def download_helpers(self):
        # Execute the actual nested helpers and terminal guard extracted from
        # this caller. Only the browser/file surfaces are synthetic; no helper
        # implementation is duplicated and no files/GPU are used here.
        source=SOURCE.read_text(encoding='utf-8');tree=ast.parse(source)
        main=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='main')
        nodes={n.name:n for n in main.body if isinstance(n,ast.FunctionDef)}
        helpers=[textwrap.dedent(ast.get_source_segment(source,nodes[name])) for name in ('retain_movie','stop_movie')]
        outer=next(n for n in reversed(main.body) if isinstance(n,ast.Try))
        final=outer.finalbody[:next(i for i,n in enumerate(outer.finalbody) if isinstance(n,ast.Try))]
        final_source=ast.unparse(ast.Module(body=final,type_ignores=[]))
        factory='def factory(h,video,report):\n    download_retained=False\n    download_error=None\n    server=None\n'+''.join(textwrap.indent(s+'\n','    ') for s in helpers)+'    def finalize():\n'+textwrap.indent(final_source+'\n','        ')+'    return retain_movie,stop_movie,finalize,lambda:(download_retained,download_error)\n'
        namespace=dict(C.__dict__);namespace['sha']=lambda p:hashlib.sha256(p.data).hexdigest()
        exec(compile(factory,'<actual-extracted-capture-helpers-CPU>','exec'),namespace)
        class File:
            name=C.MOVIE
            def __init__(self):self.data=None
            def exists(self):return self.data is not None
            def stat(self):return SimpleNamespace(st_size=len(self.data))
            def __str__(self):return 'SYNTHETIC_ONLY_'+self.name
        video=File();page=SimpleNamespace(is_closed=lambda:False,wait_for_function=lambda *a,**k:None,wait_for_timeout=lambda ms:None)
        def ev(js):
            if js==C.READ_RECORDER:return {'intervals':[16,17,18],'elapsed_ms':17000,'timedOut':False,'error':None,'mime':'synthetic-recorder-only'}
            return True
        report={'status':'passed','cleanupErrors':[],'contextClosed':True,'serverClosed':True};retain,stop,finalize,state=namespace['factory'](SimpleNamespace(page=page,ev=ev),video,report)
        class Download:
            def __init__(self,name,content):self.suggested_filename=name;self.content=content;self.saves=0
            def save_as(self,path):self.saves+=1;video.data=self.content
        return video,report,retain,stop,finalize,state,Download

    def test_actual_download_helpers_keep_first_movie_and_refuse_unexpected_second(self):
        video,report,retain,stop,finalize,state,Download=self.download_helpers()
        first=Download(C.MOVIE,b'first valid synthetic retained movie');retain(first);stop();original_hash=report['movie']['sha256']
        unexpected=Download('unexpected.webm',b'must never replace first movie');retain(unexpected)
        self.assertTrue(state()[0]);self.assertIsNotNone(state()[1])
        with self.assertRaisesRegex(RuntimeError,'One exact recording download required'):stop()
        finalize();self.assertEqual(report['status'],'failed');self.assertTrue(report['movie']['partial']);self.assertIn('downloadError',report)
        self.assertEqual(video.data,first.content);self.assertEqual(report['movie']['sha256'],original_hash);self.assertEqual(unexpected.saves,0)

    def test_actual_download_helpers_keep_first_movie_and_refuse_duplicate_second(self):
        video,report,retain,stop,finalize,state,Download=self.download_helpers()
        first=Download(C.MOVIE,b'first valid synthetic retained movie');retain(first);stop();original_hash=report['movie']['sha256']
        duplicate=Download(C.MOVIE,b'must never replace first movie');retain(duplicate)
        self.assertTrue(state()[0]);self.assertIsNotNone(state()[1])
        with self.assertRaisesRegex(RuntimeError,'One exact recording download required'):stop()
        finalize();self.assertEqual(report['status'],'failed');self.assertTrue(report['movie']['partial']);self.assertIn('downloadError',report)
        self.assertEqual(video.data,first.content);self.assertEqual(report['movie']['sha256'],original_hash);self.assertEqual(duplicate.saves,0)

    def driver(self,*,blocked=False,ready=False,auto=False,focus=True,walking=True):
        clock=[0.0];pressed=[];released=[]
        keys=SimpleNamespace(down=lambda k:pressed.append(k),up=lambda k:released.append(k))
        def pulse_refused(ms):raise AssertionError('Capture must share frame-held native input rather than wall-time key pulses')
        page=SimpleNamespace(locator=lambda s:SimpleNamespace(focus=lambda:None),keyboard=keys,wait_for_timeout=pulse_refused)
        def evaluate(js,limit=None):
            if js==H.RAF_NATIVE_INPUT:
                self.assertIsInstance(limit,int);self.assertGreaterEqual(limit,1);self.assertLessEqual(limit,10000)
                if limit<34:
                    clock[0]+=limit/1000
                    return {'deadline':True,'frames':0,'elapsedMs':limit}
                clock[0]+=.034
                return {'frames':2,'elapsedMs':34}
            return focus
        view=lambda:{'x':clock[0]*1.6,'z':0,'status':'blocked' if blocked else 'moving','ready':ready}
        steps=lambda:{'steps':['synthetic-illegal-auto-arrival'] if auto and clock[0]>.1 else []}
        d=SimpleNamespace(page=page,close=lambda:None,ev=evaluate,view=view,record=steps,state=lambda:{'adventure':{'hp':100}},diag=lambda:{'consignment':{'view':view(),'frame':{'walking':walking}},'adventure':{'player':{'x':clock[0]*1.6-2,'z':0},'paused':False},'camera':{'yaw':0,'preset':'adventure'}})
        # The actual shared helper owns key release; this CPU surface supplies
        # labelled callback confirmations, never real gameplay or GPU evidence.
        d.hold_native_keys_for_frames=MethodType(H.Native.hold_native_keys_for_frames,d)
        return d,clock,pressed,released

    def test_follow_controller_uses_native_keys_and_observed_motion(self):
        h,clock,pressed,released=self.driver();r={'motionSamples':[]}
        result=C.follow_until(h,H,1.5,r,clock=lambda:clock[0]);self.assertTrue(result['walkingObserved']);self.assertGreater(len(r['motionSamples']),1);self.assertEqual(pressed,released);self.assertIn('d',pressed)

    def test_missing_focus_threat_early_ready_or_auto_arrival_fails(self):
        for kw in ({'focus':False},{'blocked':True},{'ready':True},{'auto':True},{'walking':False}):
            h,clock,_,_=self.driver(**kw)
            with self.subTest(kw=kw),self.assertRaises(AssertionError):C.follow_until(h,H,1.5,{'motionSamples':[]},clock=lambda:clock[0])

    def test_pressed_native_keys_are_released_when_waiting_throws(self):
        h,clock,pressed,released=self.driver()
        original=h.ev
        def fail(js,limit=None):
            if js==H.RAF_NATIVE_INPUT:raise OSError('synthetic frame-wait failure')
            return original(js,limit)
        h.ev=fail
        with self.assertRaises(OSError):C.follow_until(h,H,1.5,{'motionSamples':[]},clock=lambda:clock[0])
        self.assertEqual(pressed,released)

    def test_evidence_failure_still_closes_owned_context_and_server(self):
        events=[];h=SimpleNamespace(context=SimpleNamespace(close=lambda:events.append('context')));server=SimpleNamespace(shutdown=lambda:events.append('shutdown'),server_close=lambda:events.append('server'));r={'cleanupErrors':[],'contextClosed':False,'serverClosed':False}
        def fail():raise OSError('synthetic output failure')
        C.close_owned(h,server,r,fail);self.assertEqual(events,['context','shutdown','server']);self.assertTrue(r['contextClosed']);self.assertTrue(r['serverClosed']);self.assertEqual(r['cleanupErrors'][0]['phase'],'retain')

    def test_context_and_shutdown_failures_preserve_final_server_close_and_truth(self):
        events=[]
        def fail(phase):events.append(phase);raise OSError('synthetic '+phase)
        h=SimpleNamespace(context=SimpleNamespace(close=lambda:fail('context')));server=SimpleNamespace(shutdown=lambda:fail('shutdown'),server_close=lambda:events.append('server'));r={'cleanupErrors':[],'contextClosed':False,'serverClosed':False}
        C.close_owned(h,server,r,lambda:None);self.assertEqual(events,['context','shutdown','server']);self.assertFalse(r['contextClosed']);self.assertTrue(r['serverClosed']);self.assertEqual([e['phase'] for e in r['cleanupErrors']],['context','server shutdown'])

    def test_recorder_scripts_compile_and_preserve_silent_actual_canvas_contract(self):
        scripts=[C.START_RECORDER,C.STOP_RECORDER,C.READ_RECORDER]
        result=subprocess.run(['node','-e','for(const s of JSON.parse(require("fs").readFileSync(0,"utf8")))new Function(s);'],input=json.dumps(scripts),capture_output=True,text=True);self.assertEqual(result.returncode,0,result.stderr)
        self.assertIn('captureStream(30)',C.START_RECORDER);self.assertIn('getAudioTracks().length',C.START_RECORDER);self.assertIn("s.stopped=performance.now();s.timedOut=true;rec.stop()",C.START_RECORDER);self.assertIn('stream.getTracks().forEach(t=>t.stop())',C.START_RECORDER)
        self.assertIn('s.stopped=performance.now();s.rec.stop()',C.STOP_RECORDER)

    def test_positive_capture_has_no_testmode_tick_arrival_position_or_reward_backdoor(self):
        text=SOURCE.read_text(encoding='utf-8');tree=ast.parse(text)
        for token in ('Realm.test','__ETERNITIES_TEST_MODE','__ETERNITIES_CAPTURE_MODE','dispatchEvent(','Simulation(','.manual(','.moveTo(','.arrivalTicket(','.consume('):
            self.assertNotIn(token,text)
        for n in ast.walk(tree):
            if isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and n.func.attr=='action' and n.args and isinstance(n.args[0],ast.Constant):self.assertIn(n.args[0].value,('wait','continue'))


if __name__=='__main__':unittest.main()
