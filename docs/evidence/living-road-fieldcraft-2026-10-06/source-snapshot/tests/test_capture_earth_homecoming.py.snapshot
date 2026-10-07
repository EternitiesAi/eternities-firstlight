"""CPU controller/guard checks. No browser, profiles or earned gameplay here."""
from pathlib import Path
import copy
import ast
import contextlib
import io
import importlib.util
import json
import math
import os
import subprocess
import sys
import tempfile
import time
from types import SimpleNamespace
import unittest
from unittest.mock import Mock,patch

HERE = Path(__file__).resolve().parent
TOOL=HERE/'capture_earth_homecoming.py'
if not TOOL.is_file():TOOL=HERE.parent/'tools/capture_earth_homecoming.py'
spec=importlib.util.spec_from_file_location('earth_capture_cpu',TOOL)
H=importlib.util.module_from_spec(spec);spec.loader.exec_module(H)
ROOT=Path(os.environ.get('FIRSTLIGHT_ROOT',HERE.parent if (HERE.parent/'src/core.js').is_file() else 'D:/07-GAMES/Firstlight/authoring/atlantis-harbour-campaign-20261004')).resolve()

PREPARED={'earthHomecoming':{'version':1,'accepted':True,'steps':['bridge-record','register-record','inspect-claim','west-relay-isolated','east-relay-isolated'],'choice':None,'claimed':False}}

class InitialBoundaries(unittest.TestCase):
    def test_eight_headings_at_unrotated_camera(self):
        d={'adventure':{'player':{'x':0,'z':0}},'camera':{'yaw':0}}
        for point,keys in [((0,-2),['w']),((2,-2),['d','w']),((2,0),['d']),((2,2),['d','s']),((0,2),['s']),((-2,2),['a','s']),((-2,0),['a']),((-2,-2),['a','w'])]:
            with self.subTest(point=point):self.assertEqual(H.direction_keys(dict(zip(('x','z'),point)),d),keys)

    def test_rotated_camera_and_near_diagonal_choose_native_chord(self):
        d={'adventure':{'player':{'x':1,'z':-35}},'camera':{'yaw':math.pi/2}}
        self.assertEqual(H.direction_keys({'x':3,'z':-35},d),['s'])
        d['camera']['yaw']=0
        self.assertEqual(H.direction_keys({'x':2,'z':-33.5},d),['d','s'])
        self.assertEqual(H.direction_keys({'x':1,'z':-35},d),[])

    def test_completed_or_reordered_work_cannot_be_called_prepared(self):
        for change in (lambda q:q['steps'].append('challenge-regent'),lambda q:q['steps'].reverse(),lambda q:q.update(choice='public-watch'),lambda q:q.update(claimed=True)):
            value=copy.deepcopy(PREPARED);change(value['earthHomecoming'])
            with self.assertRaises(ValueError):H.prepared_terms(value)

    def test_preparation_is_read_only(self):
        value=copy.deepcopy(PREPARED);before=copy.deepcopy(value)
        self.assertEqual(H.prepared_terms(value),value['earthHomecoming']);self.assertEqual(value,before)

    def test_only_physical_interactions_have_a_step_selector(self):
        self.assertIn('challenge-regent',H.action_selector('challenge-regent'))
        for identifier in ('regent-repelled','aftermath','claim','unknown'):
            with self.assertRaises(ValueError):H.action_selector(identifier)

    def test_damage_bands_require_real_hp_change_at_boundary(self):
        for hp,band in [(168,'claims'),(112.01,'claims'),(112,'false-shelter'),(56.01,'false-shelter'),(56,'local-stand'),(1,'local-stand'),(0,'exhausted')]:
            self.assertEqual(H.remaining_band(hp),band)

    def test_nonfinite_diagnostics_are_refused_before_keyboard_input(self):
        for value in (math.nan,math.inf,-math.inf):
            d={'adventure':{'player':{'x':0,'z':0}},'camera':{'yaw':value}}
            with self.assertRaises(ValueError):H.direction_keys({'x':1,'z':1},d)

    def test_partial_return_cannot_be_reported_as_completed_homecoming(self):
        warnings=[(p,v) for p in ('claim-lane','false-shelter','closing-ring') for v in ('adventure','follow')]
        q={'earthHomecoming':{'steps':['regent-repelled','passage-secured','aftermath']}}
        self.assertTrue(H.minimum_excerpt(q,warnings))
        self.assertFalse(H.minimum_excerpt(q,warnings[:-1]))
        q['earthHomecoming']['steps'].remove('aftermath');self.assertFalse(H.minimum_excerpt(q,warnings))

    def test_interval_percentiles_count_stutters_without_fps_claim(self):
        # Synthetic clock samples, never a native performance measurement.
        s=H.frame_statistics([100,110,130,160,260],2)
        self.assertEqual((s['callbacks'],s['intervals']), (5,4))
        self.assertEqual(s['p50_ms'],25);self.assertAlmostEqual(s['p95_ms'],89.5)
        self.assertAlmostEqual(s['p99_ms'],97.9);self.assertEqual(s['max_ms'],100)
        self.assertEqual(s['over_50_ms'],1);self.assertTrue(s['truncated'])

    def test_invalid_intervals_are_not_silently_dropped_from_statistics(self):
        for stamps in ([10,10],[10,9],[1,math.nan],[0,math.inf]):
            with self.assertRaises(ValueError):H.frame_statistics(stamps)
        self.assertIsNone(H.frame_statistics([])['p95_ms'])
        self.assertIsNone(H.frame_statistics([12])['max_ms'])

    def test_threshold_counts_are_strict_with_no_invented_intervals(self):
        s=H.frame_statistics([0,50,150,400,651])
        self.assertEqual((s['over_50_ms'],s['over_100_ms'],s['over_250_ms']), (3,2,1))
        self.assertFalse(s['truncated']);self.assertEqual(s['dropped_callbacks'],0)

def controller(page=None):
    args=SimpleNamespace(root=ROOT,output=HERE/'NEVER_CREATED_NATIVE_OUTPUT',max_take_seconds=90)
    report={k:[] for k in ('condition_evaluations','inputs','errors','console_errors')}
    report['native_guard_inputs']=0
    c=H.Capture(args,report,copy.deepcopy(PREPARED));c.page=page
    return c

class ControllerResourceBoundaries(unittest.TestCase):
    def test_failed_key_hold_releases_every_native_chord(self):
        keyboard=Mock();page=SimpleNamespace(keyboard=keyboard,wait_for_timeout=Mock(side_effect=RuntimeError('synthetic browser boundary failure')))
        c=controller(page)
        with self.assertRaises(RuntimeError):c.hold(['d','w'],90)
        self.assertEqual([v.args[0] for v in keyboard.down.call_args_list],['d','w'])
        self.assertEqual(set(v.args[0] for v in keyboard.up.call_args_list),{'d','w'})
        self.assertEqual(c.held,set())

    def test_declared_play_bound_does_not_stop_or_scale_game_time(self):
        c=controller();c.play_started=time.monotonic()-91;c.playing=True
        with self.assertRaises(H.TakeBoundReached):c.budget()
        self.assertEqual(c.report['inputs'],[])
        c.playing=False;c.budget();self.assertEqual(c.report['inputs'],[])

    def test_cleanup_keeps_playwright_alive_until_video_is_finalized(self):
        order=[];c=controller();c.context=SimpleNamespace(close=lambda:order.append('close-context'))
        c.pw=SimpleNamespace(stop=lambda:order.append('stop-playwright'))
        c.server=SimpleNamespace(shutdown=lambda:order.append('shutdown-server'),server_close=lambda:order.append('close-server'))
        c.raw_receipt=lambda:order.append('finalize-video');c.stop()
        self.assertEqual(order,['close-context','finalize-video','stop-playwright','shutdown-server','close-server'])

    def test_cleanup_stops_service_even_when_movie_finalize_fails(self):
        c=controller();c.pw=Mock();c.server=Mock();c.raw_receipt=Mock(side_effect=OSError('synthetic video finalization'))
        with self.assertRaises(OSError):c.stop()
        c.pw.stop.assert_called_once();c.server.shutdown.assert_called_once();c.server.server_close.assert_called_once()

    def test_failed_interval_observation_still_preserves_the_raw_take(self):
        order=[];c=controller();c.stop_raf=Mock(side_effect=ValueError('invalid observed interval'))
        c.context=SimpleNamespace(close=lambda:order.append('close-context'))
        c.raw_receipt=lambda:order.append('finalize-video');c.pw=SimpleNamespace(stop=lambda:order.append('stop-playwright'))
        with self.assertRaisesRegex(ValueError,'invalid observed interval'):c.stop()
        self.assertEqual(order,['close-context','finalize-video','stop-playwright'])
        self.assertIn('raf_cleanup_failure',c.report)

    def test_stored_home_snapshot_is_committed_after_native_pause(self):
        # A narrow external UI boundary double records the controller's actual
        # order. No Core/storage/validator is replaced or called earned play.
        c=controller();order=[];paused=False;c.original_camera='adventure';c.imported={}
        c.close=lambda:None
        def press(key):
            nonlocal paused
            order.append(key)
            if key=='p':paused=True
        c.press=press;c.diag=lambda:{'adventure':{'paused':paused},'scene':'valley'}
        def camera(view):
            order.append(('native-camera-save',paused));raise RuntimeError('stop after observed UI boundary')
        c.camera=camera
        with self.assertRaises(RuntimeError):c.finish_receipt()
        self.assertEqual(order,['p',('native-camera-save',True)])

class ActualProductionController(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not (ROOT/'src/core.js').is_file():raise unittest.SkipTest('Explicit installed FIRSTLIGHT_ROOT is needed for actual owner/controller checks.')

    def node(self,program,payload):
        result=subprocess.run(['node','-e',program,str(ROOT)],input=json.dumps(payload),capture_output=True,text=True,check=True)
        return json.loads(result.stdout)

    def test_steering_chords_advance_actual_core_using_exact_frame_expression(self):
        # Explicit synthetic position fixtures; not an earned movement receipt.
        inputs=[]
        for yaw in (0,.22,math.pi/2,-.8):
            for dx,dz in ((0,-1),(1,-1),(1,0),(1,1),(0,1),(-1,1),(-1,0),(-1,-1)):
                snapshot={'adventure':{'player':{'x':1,'z':-32.9}},'camera':{'yaw':yaw}}
                inputs.append({'yaw':yaw,'dx':dx,'dz':dz,'keys':H.direction_keys({'x':1+dx,'z':-32.9+dz},snapshot)})
        result=self.node(r"""
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=process.argv[1],C=require(path.join(root,'src/core.js'));
const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8'),frame=app.slice(app.indexOf('function frame(now)'));
const start=frame.indexOf('let dx='),end=frame.indexOf(';if(sim.worldDive',start);
assert.ok(start>=0&&end>start);const declarations=frame.slice(start,end);
const manual=frame.match(/sim\.manual\([^;]+\);/)[0];const samples=JSON.parse(fs.readFileSync(0,'utf8'));
const out=[];for(const input of samples){const sim=new C.Simulation(C.fresh());sim.room='world-earthlands';
sim.state.player={x:1,z:-32.9,yaw:0};const before={...sim.state.player};
vm.runInNewContext(declarations+';'+manual,{sim,dt:.08,keys:new Set(input.keys),camera:{yaw:input.yaw},Math});
const dx=sim.state.player.x-before.x,dz=sim.state.player.z-before.z;
assert.ok(C.walkable(sim.state.player.x,sim.state.player.z,sim.navRoom,.31));
out.push({advance:dx*input.dx+dz*input.dz,angle:Math.acos(Math.min(1,(dx*input.dx+dz*input.dz)/(Math.hypot(dx,dz)*Math.hypot(input.dx,input.dz))))});}
console.log(JSON.stringify(out));
""",inputs)
        self.assertEqual(len(result),32)
        for row in result:self.assertGreater(row['advance'],0);self.assertLess(row['angle'],math.pi/8+.001)

    def test_brace_consumes_real_production_cooldown_schema(self):
        d=self.node(r"""
const fs=require('node:fs'),path=require('node:path'),root=process.argv[1];
const C=require(path.join(root,'src/core.js')),T=require(path.join(root,'src/combat.js'));
const sim=new C.Simulation(C.fresh());const tactics=T.runtime(sim);
console.log(JSON.stringify({adventure:{tactics,enemies:[{id:'earth-regent-incursion-v1',mode:'windup'}]}}));
""",{})
        c=controller();c.diag=lambda:d;c.state=lambda:{'adventure':{'hp':100,'stamina':100,'elapsed':1,'tonics':0}}
        pressed=[];c.press=pressed.append;c.defend();self.assertEqual(pressed,['3'])
        d['adventure']['tactics']['cooldowns']['guard']=9;c.defend();self.assertEqual(pressed,['3'])
        c.state=lambda:{'adventure':{'hp':100,'stamina':19,'elapsed':10,'tonics':0}};c.defend();self.assertEqual(pressed,['3'])

    def test_requested_camera_projection_matches_exact_installed_camera_dispatch(self):
        actual=self.node(r"""
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),root=process.argv[1];
const C=require(path.join(root,'src/core.js')),W=require(path.join(root,'src/world-foundations.js'));
const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8'),start=app.indexOf('function updateCamera(dt)'),end=app.indexOf('function cameraPreset(',start);
const sim=new C.Simulation(C.fresh());sim.room='world-earthlands';const out={};
for(const preset of['adventure','follow']){let projection=null;
const scope={sim,RealmWorldFoundations:W,RealmEarth:require(path.join(root,'src/earth.js')),RealmCosmos:require(path.join(root,'src/cosmos.js')),
 Math,innerWidth:1440,innerHeight:900,follow:null,fieldcraftFocus:()=>null,sceneHeight:()=>W.height(sim.room,sim.state.player.x,sim.state.player.z),
 camera:{preset,yaw:.22,elevation:.28,distance:7.5,actualDistance:7.5,fov:60,half:17,center:[0,3,0],tour:false,overview:false},
 engine:{clearCameraDistance:()=>7.5,setCamera:v=>{projection=v.projection||'orthographic';}}};
vm.runInNewContext(app.slice(start,end)+';updateCamera(.016)',scope);out[preset]=projection;}
console.log(JSON.stringify(out));
""",{})
        for view,want in actual.items():self.assertEqual(H.camera_projection(view),want)

    def test_raf_observer_only_timestamps_bounded_callbacks_and_never_reads_game(self):
        result=self.node(r"""
const fs=require('node:fs'),vm=require('node:vm'),input=JSON.parse(fs.readFileSync(0,'utf8')),queue=[];
const scope={window:{},performance:{now:()=>12},requestAnimationFrame:f=>queue.push(f)};
Object.defineProperty(scope,'Realm',{get(){throw new Error('observer must not read game');}});
vm.createContext(scope);vm.runInContext('('+input.start+')()',scope);scope.window.__earthTakeRaf.limit=3;
for(const t of[10,26,43,76])queue.shift()(t);
const stopped=vm.runInContext('('+input.stop+')()',scope);queue.shift()(100);
console.log(JSON.stringify({stopped,remaining:queue.length,active:scope.window.__earthTakeRaf.active}));
""",{'start':H.RAF_START,'stop':H.RAF_STOP})
        self.assertEqual(result['stopped']['timestamps'],[10,26,43]);self.assertEqual(result['stopped']['dropped'],1)
        self.assertFalse(result['active']);self.assertEqual(result['remaining'],0)

class ActualEarnedPreflight(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        source=os.environ.get('FIRSTLIGHT_EARTH_CAPTURE_SOURCE');cohort=os.environ.get('FIRSTLIGHT_EARTH_CAPTURE_COHORT_SHA')
        if not source and not cohort:raise unittest.SkipTest('Capture preflight needs an explicit current earned source and cohort SHA; generic discovery cannot substitute old private inputs.')
        if not source or not cohort:raise AssertionError('Both explicit earned source and cohort SHA are required.')
        cls.source=Path(source).resolve();cls.cohort=cohort;cls.guards=H.load_guards(ROOT)
        cls.callers=Path(os.environ.get('FIRSTLIGHT_EARTH_EARNED_CALLER_ROOT',ROOT/'tools/earth-homecoming-journey'))
        # Installed tests live inside the checkout. Capture outputs must remain
        # outside it; the sibling temp directory also stays on D on Windows.
        cls.temp=tempfile.TemporaryDirectory(prefix='cpu-earth-take-paths-',dir=ROOT.parent);cls.base=Path(cls.temp.name)
        cls.proof,cls.frozen=cls.guards.read_provenance(cls.source.parents[2],('blade',),cohort,ROOT,cls.callers)

    @classmethod
    def tearDownClass(cls):cls.temp.cleanup()

    def preflight(self,source=None,output=None,cohort=None):
        return H.preflight(source or self.source,output or self.base/'never-created-take',ROOT,cohort or self.cohort,self.callers)

    def test_actual_full_report_binds_ordered_prepared_checkpoint_without_output(self):
        source,output,world,proof,frozen,guards=self.preflight()
        self.assertEqual(source,self.source);self.assertFalse(output.exists());H.prepared_terms(world)
        self.assertEqual(frozen[str(source)],H.sha(source));self.assertTrue(proof['journey']['all12Paid'])
        self.assertEqual(proof['journey']['positionEdits'],0);self.assertGreaterEqual(len(frozen),170)

    def test_wrong_cohort_sha_rejected_before_new_take(self):
        with self.assertRaisesRegex(ValueError,'Linked bytes differ'):self.preflight(cohort='0'*64)
        self.assertFalse((self.base/'never-created-take').exists())

    def test_prepared_path_must_be_exact_full_journey_link(self):
        modified=copy.deepcopy(self.proof);modified['blade']['checkpoints']['02_RELAYS']=str(self.source.with_name('03_REGENT_REPELLED.json'))
        with patch.object(self.guards,'read_provenance',return_value=(modified,self.frozen)):
            with self.assertRaisesRegex(ValueError,'checkpoint path and bytes'):
                H.preflight(self.source,self.base/'never-created-take',ROOT,self.cohort,self.callers,guards=self.guards)

    def test_prepared_sha_is_rechecked_even_after_linked_report_validation(self):
        bad={**self.frozen,str(self.source):'0'*64}
        with patch.object(self.guards,'read_provenance',return_value=(self.proof,bad)):
            with self.assertRaisesRegex(ValueError,'checkpoint path and bytes'):
                H.preflight(self.source,self.base/'never-created-take',ROOT,self.cohort,self.callers,guards=self.guards)

    def test_existing_output_and_source_checkout_are_not_overwritten(self):
        for out in (self.base,ROOT/'NEW_CAPTURE_MUST_NOT_EXIST',self.source.parents[2]/'NEW_CAPTURE_MUST_NOT_EXIST'):
            with self.assertRaises((FileExistsError,ValueError)):self.preflight(output=out)

    def test_claimed_checkpoint_cannot_resume_a_fake_live_encounter(self):
        with self.assertRaisesRegex(ValueError,'02_RELAYS'):self.preflight(source=self.source.with_name('07_PAID.json'))

    def test_nonblade_take_is_refused_without_equipping_or_profiles(self):
        with self.assertRaisesRegex(ValueError,'blade path only'):
            self.preflight(source=self.source.parents[2]/'bow/earth/02_RELAYS.json')

    def test_preflight_only_has_no_capture_server_or_profile_side_effect(self):
        args=['--root',str(ROOT),'--source',str(self.source),'--output',str(self.base/'cli-no-output'),'--cohort-sha',self.cohort,'--earned-caller-root',str(self.callers),'--preflight-only']
        with patch.object(H.Capture,'start_and_play',side_effect=AssertionError('browser must not start')),patch.object(H,'ThreadingHTTPServer',side_effect=AssertionError('server must not start')),contextlib.redirect_stdout(io.StringIO()) as stream:
            self.assertEqual(H.main(args),0)
        result=json.loads(stream.getvalue());self.assertFalse(result['output_created']);self.assertFalse(result['browser_launched']);self.assertFalse(result['server_started'])
        self.assertFalse((self.base/'cli-no-output').exists())


# Repair regressions use labelled synthetic input boundaries. The Node bridge
# executes actual installed Core/app manual expression/roster/AI/contact; it is
# not a browser, native input, earned journey or normal-time measurement.
RECORDED={'x':1.0499835647073648,'z':-33.65656595597995,'yaw':2.3307963267948963}
QUIET={'x':1,'z':-33.95}

class CoreBridge:
    def __init__(self,yaw=.76):
        self.yaw=yaw;self.calls=[]
        self.process=subprocess.Popen(['node',str(HERE/'actual_manual_controller.cjs'),str(ROOT)],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
        self.request({'action':'state'})
    def request(self,value):
        value={**value,'yaw':self.yaw};self.process.stdin.write(json.dumps(value)+'\n');self.process.stdin.flush()
        line=self.process.stdout.readline()
        if not line:raise AssertionError('actual Core bridge failed: '+self.process.stderr.read())
        result=json.loads(line)
        if 'error' in result:raise AssertionError(result['error'])
        return result
    def diagnostics(self):return self.request({'action':'state'})
    def hold(self,keys,ms):
        self.calls.append({'keys':list(keys),'ms':ms});return self.request({'action':'hold','keys':list(keys),'ms':ms})
    def wait(self,ms):return self.request({'action':'wait','ms':ms})
    def close(self):
        self.process.stdin.close();self.process.wait(timeout=10)
        error=self.process.stderr.read();self.process.stdout.close();self.process.stderr.close()
        if self.process.returncode:raise AssertionError(error)

def quiet_controller(bridge):
    c=controller(SimpleNamespace(wait_for_timeout=bridge.wait));c.report['movements']=[]
    c.close=lambda:None;c.budget=lambda:None;c.defend=lambda:None;c.diag=bridge.diagnostics;c.hold=bridge.hold;c.mark=lambda label:None
    return c

class QuietControllerRepair(unittest.TestCase):
    def test_recorded_old_stop_is_inside_actual_danger_despite_default_destination_acceptance(self):
        b=CoreBridge()
        try:
            c=quiet_controller(b);c.steer(QUIET,'ordinary default remains unchanged')
            self.assertEqual(b.calls,[])
            p=b.diagnostics()['adventure']['player'];self.assertEqual(p['x'],RECORDED['x']);self.assertEqual(p['z'],RECORDED['z'])
            boundary=b.request({'action':'boundaries'});self.assertTrue(boundary['danger']);self.assertTrue(boundary['owned'])
            self.assertGreater(math.hypot(p['x']-1,p['z']+35),1.26)
        finally:b.close()

    def test_real_quiet_response_moves_recorded_pose_and_actual_ring_contact_misses_in_both_camera_frames(self):
        for yaw in (.76,.22):
            with self.subTest(cameraYaw=yaw):
                b=CoreBridge(yaw)
                try:
                    c=quiet_controller(b);c.quiet_ring_response()
                    q=c.report['quiet_centre_response'];self.assertFalse(q['contactHit']);self.assertGreater(len(b.calls),0)
                    self.assertLess(math.hypot(q['player']['x']-1,q['player']['z']+35),q['frame']['innerRadius']-.24)
                    self.assertLess(math.hypot(q['player']['x']-QUIET['x'],q['player']['z']-QUIET['z']),.10)
                finally:b.close()

    def test_tighter_destination_has_strict_body_clearance_and_boundary_retains_real_contact(self):
        b=CoreBridge()
        try:
            c=quiet_controller(b);c.steer(QUIET,'strict quiet',arrival_tolerance=.10)
            self.assertGreater(len(b.calls),0)
            boundary=b.request({'action':'boundaries'});self.assertFalse(boundary['inside']);self.assertTrue(boundary['edge']);self.assertTrue(boundary['danger'])
            self.assertEqual(boundary['innerRadius'],1.5);self.assertEqual(boundary['outerRadius'],3.2)
        finally:b.close()

    def test_invalid_or_looser_tolerance_is_refused_before_inputs(self):
        c=controller();c.close=Mock()
        for tolerance in (0,-.1,.321,math.nan,math.inf,True):
            with self.subTest(tolerance=tolerance),self.assertRaises(ValueError):c.steer(QUIET,'invalid',arrival_tolerance=tolerance)
        c.close.assert_not_called();self.assertEqual(c.report['inputs'],[])

class CallbackArrivalRepair(unittest.TestCase):
    def test_animation_and_callback_arrival_clocks_have_different_retained_distributions(self):
        arrival=H.callback_arrival_statistics([0,16,32,48],[2,18,35,140],2)
        animation=H.frame_statistics([0,16,32,48],2)
        self.assertEqual(animation['max_ms'],16);self.assertEqual(arrival['max_ms'],105)
        self.assertEqual(arrival['callbacks'],animation['callbacks']);self.assertEqual(arrival['dropped_callbacks'],2)
        self.assertIn('not GPU',arrival['scope']);self.assertIn('callback-arrival',arrival['scope'])

    def test_paired_clocks_refuse_nonfinite_unequal_or_nonadvancing_samples(self):
        for stamps,arrivals in [([0,16],[1]),([0,16],[1,math.nan]),([0,16],[1,math.inf]),([0,16],[1,1]),([0,16],[2,1]),([0,math.nan],[1,2]),([0,16],[1,True])]:
            with self.subTest(stamps=stamps,arrivals=arrivals),self.assertRaises(ValueError):H.callback_arrival_statistics(stamps,arrivals)

    def test_same_bounded_observer_pairs_arrivals_with_animation_samples_without_game_read(self):
        result=ActualProductionController.node(self,r"""
const fs=require('node:fs'),vm=require('node:vm'),input=JSON.parse(fs.readFileSync(0,'utf8')),queue=[];
let now=12;const scope={window:{},performance:{now:()=>now},requestAnimationFrame:f=>queue.push(f)};
Object.defineProperty(scope,'Realm',{get(){throw new Error('observer must not read game');}});
vm.createContext(scope);vm.runInContext('('+input.start+')()',scope);scope.window.__earthTakeRaf.limit=3;
for(const [animation,arrival]of[[10,13],[26,31],[43,90],[76,100]]){now=arrival;queue.shift()(animation);}
const stopped=vm.runInContext('('+input.stop+')()',scope);queue.shift()(120);
console.log(JSON.stringify({stopped,remaining:queue.length,active:scope.window.__earthTakeRaf.active}));
""",{'start':H.RAF_START,'stop':H.RAF_STOP})
        self.assertEqual(result['stopped']['timestamps'],[10,26,43]);self.assertEqual(result['stopped']['callback_arrival_timestamps'],[13,31,90])
        self.assertEqual(result['stopped']['dropped'],1);self.assertEqual(result['remaining'],0);self.assertFalse(result['active'])

class FailedReportRepair(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        source=os.environ.get('FIRSTLIGHT_EARTH_CAPTURE_SOURCE');cohort=os.environ.get('FIRSTLIGHT_EARTH_CAPTURE_COHORT_SHA')
        if not source and not cohort:raise unittest.SkipTest('Report lifecycle preflight needs explicit current earned source/cohort; no private input substitution.')
        if not source or not cohort:raise AssertionError('Both explicit earned source and cohort SHA are required.')

    def test_latest_six_warning_pairs_survive_general_failure_and_cleanup_failure(self):
        # External lifecycle doubles only. Actual provenance is verified and all
        # source hashes are read. No browser/server/movie or fake success exists.
        source=os.environ.get('FIRSTLIGHT_EARTH_CAPTURE_SOURCE');cohort=os.environ.get('FIRSTLIGHT_EARTH_CAPTURE_COHORT_SHA')
        self.assertTrue(source and cohort,'explicit actual capture input required for this regression')
        pairs={(p,v)for p in ('claim-lane','false-shelter','closing-ring')for v in ('adventure','follow')}
        for cleanup_failure in (False,True):
            with self.subTest(cleanup_failure=cleanup_failure),tempfile.TemporaryDirectory(prefix='cpu-report-failure-',dir=ROOT.parent) as temp:
                output=Path(temp)/'new-json-only-output';caught={}
                def factory(args,report,initial):
                    c=SimpleNamespace(warning_pairs=set(),started=time.monotonic(),page=None)
                    def fail():c.warning_pairs.update(pairs);raise RuntimeError('synthetic external capture failure after warnings')
                    def stop():
                        if cleanup_failure:raise RuntimeError('synthetic external cleanup failure')
                    c.start_and_play=fail;c.stop=stop;c.report=report;caught['capture']=c;return c
                args=['--root',str(ROOT),'--source',source,'--output',str(output),'--cohort-sha',cohort,'--earned-caller-root',str(ROOT/'tools/earth-homecoming-journey')]
                with patch.object(H,'Capture',side_effect=factory),contextlib.redirect_stdout(io.StringIO()):self.assertEqual(H.main(args),1)
                report=json.loads((output/'REPORT.json').read_text());self.assertEqual(report['status'],'failed')
                self.assertEqual(set(map(tuple,report['warning_pairs'])),pairs);self.assertEqual(report['raw_file_count'],0)

if __name__=='__main__':unittest.main()
