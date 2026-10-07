"""Extracted actual controller / actual JS wait, synthetic 5 Hz browser fixture.

No Playwright, browser, profile, real simulation, terrain, arrival or payout is
executed. This distinguishes input/frame scheduling, not native route success.
"""
import ast
import copy
import json
import hashlib
import math
from pathlib import Path
import subprocess
from types import SimpleNamespace
import unittest

# Installed checks always read this checkout's actual caller, with no override.
SOURCE=Path(__file__).resolve().parents[1]/'tools/earth_consignment_browser.py'
CURRENT=SOURCE.read_bytes()
HISTORICAL_SOURCE_HEAD='287120fc574201597094f209bfeedc822113f81f'
HISTORICAL_SOURCE_RAW_SHA256='3c0b2100f88eb7edcbd6822bca92bccef326dad12a1e9636341d9f0bd728803b'
# Exact historical follow control text, represented with LF in this fixture.
# This hash binds the frozen method, not a replay of its whole historical game.
FROZEN_OLD_FOLLOW_SHA256='f6c997d7318f409c8a42368a0da0b9fa6dc47fe10a4deddf6704c35b436bc34e'
FROZEN_OLD_FOLLOW="    def follow(self,stop_after=None):\n        self.close();start=time.monotonic();initial=self.view();prefix=self.record()['steps'];moving_sample=None\n        self.page.locator('#world').focus()\n        while time.monotonic()-start<240:\n            d=self.diag();v=d['consignment']['view'];p=d['adventure']['player']\n            if self.record()['steps']!=prefix:raise AssertionError('Automatic durable arrival bypassed native record control')\n            if self.state()['adventure']['hp']<=0:raise AssertionError('Actual traveller died; no rescued positive result')\n            if v['status']=='blocked':raise AssertionError('Actual threat/support blocked: '+str(v.get('detail') or v.get('reason')))\n            if v['ready']:\n                self.check('normal RAF actually transported carrier without automatic arrival',distance(initial,v)>.5 and v['distanceTraveled']>0 and moving_sample is not None)\n                self.row['samples'].append({'initial':initial,'ready':v,'seconds':time.monotonic()-start,'movingFrame':moving_sample});return v\n            if v['status']=='moving' and d['consignment']['frame'] and d['consignment']['frame']['walking']:moving_sample=d['consignment']['frame']\n            if stop_after is not None and distance(initial,v)>=stop_after:return v\n            keys=native_keys(p,v,d['camera']['yaw'])\n            try:\n                for key in keys:self.page.keyboard.down(key)\n                self.page.wait_for_timeout(110 if keys else 80)\n            finally:\n                for key in keys:self.page.keyboard.up(key)\n        raise TimeoutError('Real native carrier leg did not complete')\n"

NODE_WAIT=r"""const fs=require('fs'),vm=require('vm');
(async()=>{const p=JSON.parse(fs.readFileSync(0,'utf8'));let now=p.now,id=0,q=[],callbacks=[],done=false,result,error;
 const add=(f,t)=>{const i=++id;q.push({i,t,f});return i;};
 const env={performance:{now:()=>now},Error,
  setTimeout:(f,ms)=>add(f,now+ms),clearTimeout:i=>{q=q.filter(x=>x.i!==i);},
  requestAnimationFrame:f=>p.stalled?++id:add(()=>{callbacks.push(now);f(now);},(Math.floor(now/200)+1)*200)};
 const promise=vm.runInNewContext('('+p.js+')('+p.limit+')',env);
 promise.then(v=>{done=true;result=v;},e=>{done=true;error=String(e.message||e);});
 while(!done&&q.length){q.sort((a,b)=>a.t-b.t||a.i-b.i);const e=q.shift();now=e.t;e.f();await Promise.resolve();await Promise.resolve();}
 if(!done)throw Error('Synthetic scheduler did not settle actual wait');
 process.stdout.write(JSON.stringify({now,callbacks,result,error}));
})().catch(e=>{process.stderr.write(String(e.stack));process.exitCode=1;});"""


class BrowserFixture:
    """Independent straight-ground input oracle; no real game world/progress."""
    def __init__(self,status='moving',paused=False,stalled=False):
        self.now=0.;self.next_frame=200.;self.elapsed=0.;self.keys=set();self.events=[]
        self.player={'x':-2.,'z':0.,'yaw':0.};self.worker={'x':0.,'z':0.}
        self.goal=38. # A long straight-ground leg can expose the real 10m wait.
        self.status=status;self.paused=paused;self.stalled=stalled;self.focused=False
        self.prefix=[];self.distance=0.;self.samples=0;self.callback_times=[]
    def advance(self,target):
        if not self.stalled:
            while self.next_frame<=target+1e-9:
                self.now=self.next_frame;self.next_frame+=200.;self.elapsed+=.1
                if not self.paused:
                    # App/Core speeds are 3.2/1.6; each actual RAF clamps dt=.1.
                    dx=int('d' in self.keys)-int('a' in self.keys)
                    dz=int('s' in self.keys)-int('w' in self.keys)
                    length=math.hypot(dx,dz)
                    if length:self.player['x']+=dx/length*.32;self.player['z']+=dz/length*.32
                    if self.status=='moving':
                        if math.hypot(self.player['x']-self.worker['x'],self.player['z'])>10:self.status='waiting'
                        else:
                            amount=min(.16,self.goal-self.worker['x']);self.worker['x']+=amount;self.distance+=amount
                            if self.worker['x']>=self.goal-1e-9:self.status='ready'
        self.now=target
    def view(self):
        return {**self.worker,'ready':self.status=='ready','status':self.status,
                'reason':'player-far' if self.status=='waiting' else self.status,
                'distanceTraveled':self.distance}
    def sample(self):
        self.advance(self.now+(20 if self.samples==0 else 90));self.samples+=1
        return {'scene':'world-earthlands','player':copy.deepcopy(self.player),'view':self.view(),
                'paused':self.paused,'fps':5.,'yaw':0.,'hp':80,'elapsed':self.elapsed,'quality':'low',
                'prefix':list(self.prefix),'focused':self.focused,'hidden':False,
                'frame':{'walking':self.status=='moving'}}


class Keyboard:
    def __init__(self,b):self.b=b
    def down(self,key):self.b.keys.add(key);self.b.events.append(('down',key,self.b.now))
    def up(self,key):self.b.keys.discard(key);self.b.events.append(('up',key,self.b.now))


class Page:
    def __init__(self,b):self.b=b;self.keyboard=Keyboard(b)
    def locator(self,selector):
        if selector!='#world':raise AssertionError('Unexpected fixture selector '+selector)
        return SimpleNamespace(focus=lambda:setattr(self.b,'focused',True))
    def wait_for_timeout(self,ms):self.b.advance(self.b.now+ms)


class Harness:
    def __init__(self,b):
        self.b=b;self.page=Page(b);self.row={'samples':[]};self.report={'head':'SYNTHETIC-CONTROLLER-SOURCE-ONLY'};self.checks=[]
    def close(self):pass
    def view(self):return self.b.view()
    def record(self):return {'steps':list(self.b.prefix)}
    def state(self):return {'adventure':{'hp':80}}
    def diag(self):
        s=self.b.sample();return {'consignment':{'view':s['view'],'frame':s['frame']},
                                'adventure':{'player':s['player']},'camera':{'yaw':s['yaw']}}
    def check(self,name,ok,detail=None):
        self.checks.append((name,ok));assert ok,(name,detail)
    def ev(self,js,arg=None):
        if arg is None:return self.b.sample()
        out=subprocess.run(['node','-e',NODE_WAIT],input=json.dumps({'js':js,'limit':arg,'now':self.b.now,'stalled':self.b.stalled}),
                           text=True,capture_output=True,check=True,timeout=5)
        value=json.loads(out.stdout)
        self.b.callback_times+=value['callbacks'];self.b.advance(value['now'])
        if value.get('error'):raise RuntimeError(value['error'])
        return value['result']


def extracted(raw,b,old=False):
    tree=ast.parse(raw.decode());owner=next(n for n in tree.body if isinstance(n,ast.ClassDef) and n.name=='Native')
    if old:owner=ast.parse('class Native:\n'+FROZEN_OLD_FOLLOW).body[0]
    names={'follow'} if old else {'follow','follow_sample','hold_native_keys_for_frames'}
    methods=[copy.deepcopy(n) for n in owner.body if isinstance(n,ast.FunctionDef) and n.name in names]
    if {m.name for m in methods}!=names:raise ValueError('Installed frame-held native controller methods are required')
    functions=[copy.deepcopy(n) for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in ('distance','native_keys')]
    constants=[copy.deepcopy(n) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='RAF_NATIVE_INPUT' for t in n.targets)]
    cls=ast.ClassDef(name='Controller',bases=[ast.Name(id='Harness',ctx=ast.Load())],keywords=[],body=methods,decorator_list=[])
    deadlines=[copy.deepcopy(n) for n in tree.body if isinstance(n,ast.ClassDef) and n.name=='NativeInputDeadline']
    module=ast.fix_missing_locations(ast.Module(body=functions+constants+deadlines+[cls],type_ignores=[]))
    namespace={'math':math,'Harness':Harness,'time':SimpleNamespace(monotonic=lambda:b.now/1000)}
    exec(compile(module,'EXTRACTED_ACTUAL_CONTROLLER','exec'),namespace)
    return namespace['Controller'](b)


class NativeInputRegression(unittest.TestCase):
    def test_five_hz_historical_taps_miss_frames_current_controller_crosses_them(self):
        self.assertEqual(hashlib.sha256(FROZEN_OLD_FOLLOW.encode()).hexdigest(),FROZEN_OLD_FOLLOW_SHA256)
        old=BrowserFixture();before=extracted(CURRENT,old,old=True)
        with self.assertRaisesRegex(TimeoutError,'did not complete'):before.follow()
        self.assertEqual(old.player['x'],-2.);self.assertGreater(old.distance,7.)
        self.assertEqual(old.status,'waiting');self.assertEqual(old.prefix,[]);self.assertFalse(old.keys)
        current=BrowserFixture();after=extracted(CURRENT,current);view=after.follow()
        self.assertTrue(view['ready']);self.assertGreater(current.player['x'],-1.)
        self.assertGreater(len(current.callback_times),1);self.assertFalse(current.keys);self.assertEqual(current.prefix,[])
        self.assertEqual(len(after.row['samples']),1);self.assertEqual(len(after.row['followDiagnostics']),5)
        self.assertTrue(all(d['head']=='SYNTHETIC-CONTROLLER-SOURCE-ONLY' for d in after.row['followDiagnostics']))

    def test_cleanup_refuses_incomplete_or_missing_frame_confirmation(self):
        for value in (None,{'frames':1,'elapsedMs':200},{'frames':2,'elapsedMs':10000}):
            b=BrowserFixture();h=extracted(CURRENT,b);h.ev=lambda *args:value
            with self.assertRaisesRegex(RuntimeError,'did not confirm'):h.hold_native_keys_for_frames(('d',))
            self.assertFalse(b.keys)

    def test_waiting_fails_immediately_and_retains_actual_controller_diagnostic(self):
        b=BrowserFixture(status='waiting');h=extracted(CURRENT,b)
        with self.assertRaisesRegex(AssertionError,'waiting / player-far'):h.follow()
        self.assertLess(b.now,1000);self.assertEqual(h.row['followDiagnostics'][-1]['view']['status'],'waiting')
        self.assertIn('waiting',h.row['followError']);self.assertFalse(b.keys);self.assertEqual(b.prefix,[])

    def test_paused_fails_immediately_and_retains_actual_controller_diagnostic(self):
        b=BrowserFixture(paused=True);h=extracted(CURRENT,b)
        with self.assertRaisesRegex(AssertionError,'paused unexpectedly'):h.follow()
        self.assertTrue(h.row['followDiagnostics'][-1]['paused']);self.assertFalse(b.keys)

    def test_prefix_change_remains_refused_without_native_arrival(self):
        b=BrowserFixture();h=extracted(CURRENT,b);actual=h.follow_sample
        def changed():
            value=actual();value['prefix']=['synthetic-forged-arrival'];return value
        h.follow_sample=changed
        with self.assertRaisesRegex(AssertionError,'durable arrival bypassed'):h.follow()
        self.assertEqual(b.callback_times,[]);self.assertFalse(b.keys);self.assertEqual(b.prefix,[])

    def test_actual_javascript_deadline_retains_terminal_diagnostic_and_releases_keys(self):
        b=BrowserFixture(stalled=True);h=extracted(CURRENT,b)
        with self.assertRaisesRegex(RuntimeError,'RAF deadline'):h.follow()
        self.assertEqual(b.now,10020);self.assertEqual(b.callback_times,[]);self.assertFalse(b.keys)
        self.assertEqual(len(h.row['followDiagnostics']),1);self.assertIn('RAF deadline',h.row['followError'])

    def test_frame_budget_refuses_invalid_values_and_honours_small_remaining_budget(self):
        for budget in (0,-1,10001,True,1.5,None):
            b=BrowserFixture();h=extracted(CURRENT,b)
            with self.assertRaisesRegex(ValueError,'budget'):h.hold_native_keys_for_frames(('d',),budget)
            self.assertFalse(b.keys);self.assertEqual(b.events,[])
        b=BrowserFixture();h=extracted(CURRENT,b)
        with self.assertRaisesRegex(RuntimeError,'RAF deadline'):h.hold_native_keys_for_frames(('d',),10)
        self.assertEqual(b.now,10);self.assertEqual(b.callback_times,[]);self.assertFalse(b.keys)


class DelayedWallSampleFixture(BrowserFixture):
    """Synthetic slow diagnostic delivery; never a native gameplay receipt."""
    def __init__(self,trigger,delivered_ms):
        super().__init__();self.goal=1.28;self.trigger=trigger
        self.delivered_ms=delivered_ms;self.delivery=None
    def sample(self):
        value=super().sample()
        due=value['view']['ready'] if self.trigger=='ready' else value['view']['distanceTraveled']>=.5
        if due and self.delivery is None:
            # Actual synthetic motion generated this sample before the slow
            # transport finishes. Wall time advances; no frame/position/progress
            # is granted during the delay, nor is returned data rewritten.
            self.delivery={'observedMs':self.now,'deliveredMs':self.delivered_ms,
                           'view':copy.deepcopy(value['view']),'prefix':list(value['prefix'])}
            if self.delivered_ms<=self.now:raise AssertionError('Synthetic delay must be positive')
            self.now=self.delivered_ms
        return value


class NativeWallDeadlineRegression(unittest.TestCase):
    def refused(self,trigger,delivered_ms,stop_after=None):
        b=DelayedWallSampleFixture(trigger,delivered_ms);h=extracted(CURRENT,b)
        with self.assertRaisesRegex(TimeoutError,'within 240 seconds'):
            h.follow(stop_after=stop_after)
        self.assertIsNotNone(b.delivery)
        self.assertLess(b.delivery['observedMs'],240000)
        self.assertEqual(b.delivery['deliveredMs'],delivered_ms)
        self.assertEqual(h.row['samples'],[])
        self.assertIn('within 240 seconds',h.row['followError'])
        terminal=h.row['followDiagnostics'][-1]
        self.assertEqual(terminal['view'],b.delivery['view'])
        self.assertEqual(terminal['prefix'],[]);self.assertEqual(b.prefix,[])
        self.assertEqual(terminal['head'],'SYNTHETIC-CONTROLLER-SOURCE-ONLY')
        self.assertFalse(b.keys)
        self.assertGreater(len(b.callback_times),1)
        # The shared helper has already held/released real fixture keys, and
        # outer follow cleanup still attempts every allowed key at refusal.
        downs=[key for kind,key,when in b.events if kind=='down']
        ups=[key for kind,key,when in b.events if kind=='up']
        self.assertTrue(downs);self.assertTrue(all(key in ups for key in downs))
        self.assertEqual([key for kind,key,when in b.events[-4:]],['w','a','s','d'])
        self.assertTrue(all(kind=='up' for kind,key,when in b.events[-4:]))
        return b,h
    def test_actual_ready_sample_delivered_after_wall_deadline_refuses_and_retains_truth(self):
        b,h=self.refused('ready',240050)
        self.assertTrue(h.row['followDiagnostics'][-1]['view']['ready'])
        self.assertGreater(b.delivery['view']['distanceTraveled'],.5)
    def test_actual_stop_after_sample_delivered_after_wall_deadline_refuses(self):
        b,h=self.refused('stop',240050,stop_after=.5)
        self.assertFalse(b.delivery['view']['ready'])
        self.assertEqual(b.delivery['view']['status'],'moving')
        self.assertGreaterEqual(b.delivery['view']['distanceTraveled'],.5)
    def test_exact_240_second_sample_is_expired_not_a_success(self):
        self.refused('ready',240000)
    def test_actual_ready_sample_delivered_just_before_deadline_still_passes(self):
        b=DelayedWallSampleFixture('ready',239999);h=extracted(CURRENT,b)
        value=h.follow()
        self.assertTrue(value['ready']);self.assertEqual(b.now,239999)
        self.assertEqual(len(h.row['samples']),1);self.assertNotIn('followError',h.row)
        self.assertTrue(all(ok for name,ok in h.checks));self.assertEqual(b.prefix,[])
        self.assertFalse(b.keys)

if __name__=='__main__':unittest.main()
