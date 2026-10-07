"""CPU preflight failures for the bounded actual-movie driver; no GPU claims."""
from pathlib import Path
import copy
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
spec=importlib.util.spec_from_file_location('short_fieldcraft',ROOT/'tools/capture_earth_fieldcraft.py')
tool=importlib.util.module_from_spec(spec);spec.loader.exec_module(tool)

def synthetic():
    ids=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./src/earth-expedition.js').definition.steps.slice(0,6).map(s=>s.id)))"],cwd=ROOT,text=True))
    return {'version':9,'adventure':{'version':12,'started':True,'hp':100,'equipment':{'weapon':'trail_bow'},'owned':['trail_bow']},
            'earthExpedition':{'version':1,'story':{'accepted':True,'claimed':False,'steps':ids,'branch':'managed-coppice'},'patrol':{'lastClaim':0,'active':None}}}

class ShortCapturePreflight(unittest.TestCase):
    def test_prefix_is_bound_to_the_actual_existing_definition(self):
        world=synthetic();before=copy.deepcopy(world)
        self.assertEqual(tool.validate_source(world),world['earthExpedition']['story']['steps'])
        self.assertEqual(world,before)

    def test_recorded_paid_partial_or_reordered_work_cannot_be_used_as_a_fresh_fitting(self):
        world=synthetic()
        cases=[]
        for key,value in [('accepted',False),('claimed',True),('steps',world['earthExpedition']['story']['steps'][:-1]),('steps',list(reversed(world['earthExpedition']['story']['steps']))),('steps',world['earthExpedition']['story']['steps']+['brace-root-channel'])]:
            c=copy.deepcopy(world);c['earthExpedition']['story'][key]=value;cases.append(c)
        c=copy.deepcopy(world);c['earthExpedition']['patrol']['lastClaim']=1;cases.append(c)
        for c in cases:
            before=copy.deepcopy(c)
            with self.assertRaises(ValueError):tool.validate_source(c)
            self.assertEqual(c,before)

    def test_old_schema_dead_or_unowned_equipment_is_refused_without_mutation(self):
        world=synthetic();cases=[]
        for key,value in [('version',11),('hp',0),('owned',[]),('started',False)]:
            c=copy.deepcopy(world);c['adventure'][key]=value;cases.append(c)
        c=copy.deepcopy(world);c['version']=8;cases.append(c)
        for c in cases:
            before=copy.deepcopy(c)
            with self.assertRaises(ValueError):tool.validate_source(c)
            self.assertEqual(c,before)

    def test_cli_refuses_existing_evidence_before_importing_playwright_or_mutating_it(self):
        with tempfile.TemporaryDirectory(prefix='fieldcraft-preflight-') as d:
            p=Path(d);sentinel=p/'KEEP.txt';sentinel.write_text('preserve failed evidence',encoding='utf-8')
            result=subprocess.run([sys.executable,'-B',str(ROOT/'tools/capture_earth_fieldcraft.py'),'--source',str(p/'absent.json'),'--output',str(p),'--renderer','hardware'],capture_output=True,text=True,cwd=ROOT)
            self.assertEqual(result.returncode,2);self.assertEqual(sentinel.read_text(encoding='utf-8'),'preserve failed evidence')
            self.assertEqual(sorted(q.name for q in p.iterdir()),['KEEP.txt'])

if __name__=='__main__':unittest.main()
