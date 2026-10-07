"""Real Core path/manual CPU regression for the native driver's corner steering.

Only browser/key/clock surfaces are synthetic. No browser, native input, death
or gameplay qualification is claimed. The unmodified driver method executes.
"""
import ast
import importlib.util
import json
import math
import os
from pathlib import Path
import subprocess
from types import SimpleNamespace
import unittest

ROOT=Path(os.environ.get('FIRSTLIGHT_ROOT',str(Path(__file__).resolve().parents[1])))
DRIVER=Path(os.environ.get('WILD_BOUNDARY_DRIVER',str(ROOT/'tools/earth_wild_signs_boundaries_browser.py')))
spec=importlib.util.spec_from_file_location('boundaries_under_test',DRIVER);N=importlib.util.module_from_spec(spec);spec.loader.exec_module(N)
base=N.load_suite(ROOT/'tools/earth_wild_signs_browser.py').load_base(ROOT)

WORKER=r"""
const C=require(process.argv[1]+'/src/core.js'),W=require(process.argv[1]+'/src/world-foundations.js');
const sim=new C.Simulation(C.fresh());sim.room='world-earthlands';sim.state.adventure.started=true;
Object.assign(sim.state.player,{x:-15,z:-46});const yaw=Number(process.argv[2]),dt=Number(process.argv[3]);let elapsed=0;
const rl=require('node:readline').createInterface({input:process.stdin});
rl.on('line',line=>{try{const q=JSON.parse(line);let value;
 switch(q.kind){
 case'diag':value={adventure:{player:{...sim.state.player},paused:false},camera:{yaw}};break;
 case'state':value={adventure:{hp:sim.state.adventure.hp}};break;
 case'path':value=C.pathfind(sim.state.player,q.target,{id:sim.room});break;
 case'segment':value=W.segment(sim.room,q.points[0],q.points[1],.31);break;
 case'hold':{const dx=Number(q.keys.includes('d'))-Number(q.keys.includes('a')),dz=Number(q.keys.includes('s'))-Number(q.keys.includes('w'));
 for(let n=0;n<2;n++)sim.manual(dx*Math.cos(yaw)+dz*Math.sin(yaw),-dx*Math.sin(yaw)+dz*Math.cos(yaw),dt);
 elapsed+=2*dt;value={elapsed,player:{...sim.state.player}};break;}
 default:throw Error('Unknown labelled CPU operation');}
 console.log(JSON.stringify({ok:true,value}));
 }catch(e){console.log(JSON.stringify({ok:false,error:String(e)}));}});
"""

class ActualCoreApproach(unittest.TestCase):
 def run_fixture(self,yaw,frame_step=1/60):
  child=subprocess.Popen(['node','-e',WORKER,str(ROOT),str(yaw),str(frame_step)],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,encoding='utf-8',bufsize=1)
  clock=[0.];rows=[]
  def rpc(kind,**kwargs):
   child.stdin.write(json.dumps(dict(kind=kind,**kwargs))+'\n');child.stdin.flush();value=json.loads(child.stdout.readline());self.assertTrue(value['ok'],value);return value['value']
  def ev(js,*args):
   if 'pathfind' in js:return rpc('path',target=args[0])
   if '.segment' in js:return rpc('segment',points=args[0])
   self.fail('Unexpected actual driver evaluator '+js)
  def hold(keys,timeout_ms=10000):
   self.assertTrue(1<=timeout_ms<=10000);value=rpc('hold',keys=keys);clock[0]=value['elapsed'];rows.append(value);del rows[:-5]
  fn=next(x for x in ast.walk(ast.parse(DRIVER.read_text(encoding='utf-8'))) if isinstance(x,ast.FunctionDef) and x.name=='walk_keys')
  ns={'time':SimpleNamespace(monotonic=lambda:clock[0]),'base':base,'approach_keys':getattr(N,'approach_keys',None),'TimeoutError':TimeoutError}
  exec(compile(ast.Module(body=[fn],type_ignores=[]),str(DRIVER),'exec'),ns)
  d=SimpleNamespace(close=lambda:None,diag=lambda:rpc('diag'),state=lambda:rpc('state'),ev=ev,hold_native_keys_for_frames=hold,
    check=lambda text,ok,detail=None:self.assertTrue(ok,(text,detail)),row={'walks':[]})
  try:
   ns['walk_keys'](d,dict(x=-29,z=-20))
   final=rpc('diag')['adventure']['player'];self.assertLessEqual(math.hypot(final['x']+29,final['z']+20),1.1)
   self.assertLess(clock[0],35,'Conservative supported route must converge, without raising its240-second limit')
   self.assertTrue(d.row['walks']);return dict(yaw=yaw,elapsed=clock[0],final=final,lastInputs=rows)
  finally:
   child.stdin.close();child.wait(timeout=10);stderr=child.stderr.read();child.stdout.close();child.stderr.close();self.assertEqual(child.returncode,0,stderr)
 def test_camera_aligned_corner_reaches_existing_hostile_using_actual_core(self):self.run_fixture(math.pi/2)
 def test_oblique_camera_corner_preserves_actual_support_and_converges(self):self.run_fixture(.7)
 def test_maximum_actual_core_frame_step_corner_converges(self):self.run_fixture(math.pi/2,.1)
 def test_oblique_maximum_core_frame_step_corner_converges(self):self.run_fixture(.7,.1)

if __name__=='__main__':unittest.main(verbosity=2)
