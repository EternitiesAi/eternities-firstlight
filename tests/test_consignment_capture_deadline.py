"""Actual JS/helper/capture caller, labelled CPU scheduling specimens only.

No browser, native input delivery, simulation, GPU, profile or server is opened.
The scheduler models callback timing; it does not assert real gameplay success.
"""
import importlib.util
import json
from pathlib import Path
import subprocess
from types import MethodType, SimpleNamespace
import unittest

ROOT=Path(__file__).resolve().parents[1]


def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    return module


H=load('deadline_actual_native',ROOT/'tools/earth_consignment_browser.py')
C=load('deadline_actual_capture',ROOT/'tools/capture_earth_consignment.py')

# Bounded synthetic scheduler adapted from the portable native input regression.
# Execute the actual JS unchanged, including its own timer and pending RAF.
NODE_SCHEDULE=r"""const fs=require('fs'),vm=require('vm');
(async()=>{const p=JSON.parse(fs.readFileSync(0,'utf8'));let now=p.now||0,id=0,q=[],callbacks=[],done=false,result,error,timers=0;
 const add=(f,t)=>{const i=++id;q.push({i,t,f});return i;};
 const env={performance:{now:()=>now},Error,
  setTimeout:(f,ms)=>add(f,now+ms-((++timers===1&&p.earlyTimer)?p.earlyTimer:0)),
  clearTimeout:i=>{q=q.filter(x=>x.i!==i);},
  requestAnimationFrame:f=>p.stalled?++id:add(()=>{callbacks.push(now);f(now);},
   p.times?p.times.find(t=>t>now):((Math.floor(now/80)+1)*80))};
 const promise=vm.runInNewContext('('+p.js+')('+p.limit+')',env);
 promise.then(v=>{done=true;result=v;},e=>{done=true;error=String(e.message||e);});
 let events=0;
 while(!done&&q.length){if(++events>10)throw Error('Unbounded synthetic scheduling');
  q.sort((a,b)=>a.t-b.t||a.i-b.i);const e=q.shift();now=e.t;e.f();await Promise.resolve();await Promise.resolve();}
 if(!done)throw Error('Actual JS did not settle within synthetic schedule');
 const settled=now,before=JSON.stringify(result),pending=q.length;
 // Exercise a late callback too: it must not create another timer or RAF chain.
 while(q.length){if(++events>12)throw Error('Late callback did not terminate');
  q.sort((a,b)=>a.t-b.t||a.i-b.i);const e=q.shift();now=e.t;e.f();await Promise.resolve();}
 process.stdout.write(JSON.stringify({settled,callbacks,result,error,pending,
  resultUnchanged:before===JSON.stringify(result),remaining:q.length}));
})().catch(e=>{process.stderr.write(String(e.stack));process.exitCode=1;});"""


def schedule(js,limit,now=0,**options):
    r=subprocess.run(['node','-e',NODE_SCHEDULE],input=json.dumps({'js':js,'limit':limit,'now':now,**options}),
                     text=True,capture_output=True,check=True,timeout=5)
    return json.loads(r.stdout)


class CaptureFixture:
    """Labelled timing/observation surface; all positions are synthetic."""
    def __init__(self,*,stalled=False,end_fault=None,walking=True,speed=1.6,error=None):
        self.ms=0;self.stalled=stalled;self.end_fault=end_fault;self.walking=walking;self.speed=speed;self.error=error
        self.keys=set();self.pressed=[];self.released=[];self.budgets=[];self.callbacks=[]
        self.page=SimpleNamespace(locator=lambda s:SimpleNamespace(focus=lambda:None),keyboard=SimpleNamespace(down=self.down,up=self.up))
        self.hold_native_keys_for_frames=MethodType(H.Native.hold_native_keys_for_frames,self)
    def down(self,key):self.keys.add(key);self.pressed.append(key)
    def up(self,key):self.keys.discard(key);self.released.append(key)
    def close(self):pass
    def terminal(self):return self.ms>=1400
    def view(self):
        end=self.terminal();status=self.end_fault if end and self.end_fault in ('blocked','ready','waiting') else 'moving'
        return {'x':self.ms/1000*self.speed,'z':0,'status':status,'ready':status=='ready'}
    def record(self):return {'steps':['synthetic-unrequested-arrival'] if self.terminal() and self.end_fault=='arrival' else []}
    def state(self):return {'adventure':{'hp':0 if self.terminal() and self.end_fault=='death' else 80}}
    def diag(self):
        v=self.view()
        return {'consignment':{'view':v,'frame':{'walking':self.walking}},
                'adventure':{'player':{'x':v['x']-3,'z':0},'paused':self.terminal() and self.end_fault=='paused'},
                'camera':{'yaw':0,'preset':'adventure'}}
    def ev(self,js,arg=None):
        if arg is None:return True
        if js!=H.RAF_NATIVE_INPUT:raise AssertionError('Unexpected synthetic evaluation')
        self.budgets.append(arg)
        if self.error:raise self.error
        value=schedule(js,arg,self.ms,stalled=self.stalled)
        self.ms=value['settled'];self.callbacks+=value['callbacks']
        if value.get('error'):raise RuntimeError(value['error'])
        return value['result']
    def clock(self):return self.ms/1000


class CaptureDeadlineRegression(unittest.TestCase):
    def test_actual_js_120ms_budget_80_160_callbacks_reports_deadline_and_ends_late_callback(self):
        value=schedule(H.RAF_NATIVE_INPUT,120,times=[80,160])
        self.assertEqual(value.get('result'),{'deadline':True,'frames':1,'elapsedMs':120})
        self.assertEqual(value['settled'],120);self.assertEqual(value['callbacks'],[80,160])
        self.assertEqual(value['pending'],1);self.assertEqual(value['remaining'],0);self.assertTrue(value['resultUnchanged'])

    def test_actual_js_two_frames_before_deadline_keep_success_contract(self):
        value=schedule(H.RAF_NATIVE_INPUT,120,times=[40,80])
        self.assertEqual(value['result'],{'frames':2,'elapsedMs':80})
        self.assertEqual(value['settled'],80);self.assertEqual(value['callbacks'],[40,80]);self.assertEqual(value['pending'],0)

    def test_actual_js_early_timer_rechecks_real_clock_and_stalled_wait_reports_zero_frames(self):
        value=schedule(H.RAF_NATIVE_INPUT,120,stalled=True,earlyTimer=2)
        self.assertEqual(value['result'],{'deadline':True,'frames':0,'elapsedMs':120});self.assertEqual(value['settled'],120)

    def test_actual_native_helper_raises_named_deadline_and_releases_controls(self):
        h=CaptureFixture()
        with self.assertRaises(H.NativeInputDeadline) as raised:h.hold_native_keys_for_frames(('d','s'),120)
        error=raised.exception
        self.assertEqual((error.timeout_ms,error.frames,error.elapsed_ms),(120,1,120))
        self.assertIsInstance(error,RuntimeError);self.assertEqual(h.pressed,h.released);self.assertFalse(h.keys)

    def test_malformed_deadline_shapes_remain_unexpected_failures(self):
        invalid=[{'deadline':True,'frames':2,'elapsedMs':120},{'deadline':True,'frames':-1,'elapsedMs':120},
                 {'deadline':True,'frames':True,'elapsedMs':120},{'deadline':True,'frames':1,'elapsedMs':119},
                 {'deadline':True,'frames':1,'elapsedMs':float('nan')},{'deadline':True,'frames':1,'elapsedMs':True},
                 {'deadline':True,'frames':1,'elapsedMs':120,'forged':True},
                 {'deadline':'true','frames':2,'elapsedMs':80},{'deadline':False,'frames':2,'elapsedMs':80}]
        for value in invalid:
            h=CaptureFixture();h.ev=lambda *args:value
            with self.subTest(value=value),self.assertRaises(RuntimeError) as raised:h.hold_native_keys_for_frames(('d',),120)
            self.assertNotIsInstance(raised.exception,H.NativeInputDeadline);self.assertFalse(h.keys);self.assertEqual(h.pressed,h.released)

    def test_actual_capture_finishes_terminal_slow_frames_with_real_existing_motion_guards(self):
        h=CaptureFixture();report={'motionSamples':[]}
        result=C.follow_until(h,H,1.4,report,clock=h.clock)
        self.assertEqual(result['terminalDeadline'],{'budgetMs':120,'frames':1,'elapsedMs':120})
        self.assertEqual(h.ms,1400);self.assertGreaterEqual(result['samples'],2);self.assertTrue(result['walkingObserved'])
        self.assertGreater(H.distance(result['initial'],result['final']),1);self.assertEqual(h.record()['steps'],[])
        self.assertFalse(h.keys);self.assertEqual(h.pressed,h.released);self.assertEqual(h.budgets[-1],120)

    def test_early_named_deadline_is_not_a_terminal_capture_success(self):
        h=CaptureFixture(stalled=True)
        with self.assertRaises(H.NativeInputDeadline):C.follow_until(h,H,12,{'motionSamples':[]},clock=h.clock)
        self.assertEqual(h.ms,10000);self.assertFalse(h.keys);self.assertEqual(h.pressed,h.released)

    def test_unexpected_errors_are_not_swallowed_by_capture(self):
        for error in (OSError('synthetic evaluate failure'),RuntimeError('synthetic RAF deadline text without named type')):
            h=CaptureFixture(error=error)
            with self.subTest(error=error),self.assertRaises(type(error)) as raised:C.follow_until(h,H,1.4,{'motionSamples':[]},clock=h.clock)
            self.assertIs(raised.exception,error);self.assertFalse(h.keys);self.assertEqual(h.pressed,h.released)

    def test_terminal_pause_death_wait_ready_threat_and_arrival_still_refuse(self):
        for fault in ('paused','death','waiting','ready','blocked','arrival'):
            h=CaptureFixture(end_fault=fault)
            with self.subTest(fault=fault),self.assertRaises(AssertionError):C.follow_until(h,H,1.4,{'motionSamples':[]},clock=h.clock)
            self.assertFalse(h.keys);self.assertEqual(h.pressed,h.released)

    def test_missing_walking_or_displacement_or_samples_cannot_pass_terminal_capture(self):
        for options in ({'walking':False},{'speed':0}):
            h=CaptureFixture(**options)
            with self.subTest(options=options),self.assertRaisesRegex(AssertionError,'No real walking'):C.follow_until(h,H,1.4,{'motionSamples':[]},clock=h.clock)
            self.assertFalse(h.keys)
        h=CaptureFixture()
        with self.assertRaisesRegex(AssertionError,'No real walking'):C.follow_until(h,H,0,{'motionSamples':[]},clock=h.clock)


if __name__=='__main__':unittest.main()
