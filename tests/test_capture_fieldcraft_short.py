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
    return {'version':9,'adventure':{'version':14,'started':True,'hp':100,'equipment':{'weapon':'trail_bow'},'owned':['trail_bow']},
            'earthExpedition':{'version':1,'story':{'accepted':True,'claimed':False,'steps':ids,'branch':'managed-coppice'},'patrol':{'lastClaim':0,'active':None}}}

class ShortCapturePreflight(unittest.TestCase):
    def test_producer_digest_identifies_the_report_bytes_whose_checkpoint_was_accepted(self):
        with tempfile.TemporaryDirectory(prefix='synthetic-report-drift-') as d:
            root=Path(d);source=root/'SYNTHETIC_SOURCE.json';journey=root/'SYNTHETIC_JOURNEY.json'
            source.write_text('{"synthetic":true}\n',encoding='utf-8')
            accepted=json.dumps({'status':'passed','sourceDrift':False,'checkpoints':{source.name:{'sha256':tool.sha(source)}}}).encode()
            journey.write_bytes(accepted);accepted_digest=tool.sha(journey)
            class ChangingReport:
                def __str__(self):return str(journey)
                def read_text(self,**kwargs):
                    text=journey.read_text(**kwargs);journey.write_text('{"status":"failed"}',encoding='utf-8');return text
                def read_bytes(self):return journey.read_bytes()
            bound=tool.validate_checkpoint(source,ChangingReport())
            self.assertEqual(bound['sha256'],accepted_digest,'a successful checkpoint must be bound to the parsed report, even if a later path read could change')

    def test_checkpoint_producer_binding_refuses_changed_bytes_missing_map_or_unsuccessful_journey(self):
        with tempfile.TemporaryDirectory(prefix='synthetic-checkpoint-binding-') as d:
            root=Path(d);source=root/'PATROL_1_GLADE_OPEN.json';journey=root/'JOURNEY.json'
            source.write_text('{"synthetic":true}\n',encoding='utf-8')
            accepted={'status':'passed','sourceDrift':False,'harnessSha256':'labelled-synthetic-harness','checkpoints':{source.name:{'sha256':tool.sha(source)}}}
            journey.write_text(json.dumps(accepted),encoding='utf-8');before=source.read_bytes()
            bound=tool.validate_checkpoint(source,journey);self.assertEqual(bound['checkpoint_sha256'],tool.sha(source));self.assertEqual(source.read_bytes(),before)
            cases=[]
            for field,value in [('status','failed'),('sourceDrift',True),('checkpoints',{})]:
                rejected=copy.deepcopy(accepted);rejected[field]=value;cases.append(rejected)
            rejected=copy.deepcopy(accepted);rejected['checkpoints'][source.name]['sha256']='0'*64;cases.append(rejected)
            for rejected in cases:
                journey.write_text(json.dumps(rejected),encoding='utf-8')
                with self.assertRaisesRegex(ValueError,'checkpoint digest'):tool.validate_checkpoint(source,journey)
                self.assertEqual(source.read_bytes(),before)
            journey.write_text(json.dumps(accepted),encoding='utf-8');source.write_bytes(before+b'changed')
            with self.assertRaisesRegex(ValueError,'checkpoint digest'):tool.validate_checkpoint(source,journey)

    def carrier(self):
        world=synthetic();world['earthExpedition']['story']['claimed']=True
        world['earthExpedition']['story']['steps']+=['brace-root-channel','deliver-allocation']
        world['earthExpedition']['patrol']={'lastClaim':0,'active':{'run':1,'steps':['inspect-water','clear-crossing','inspect-root','clear-root-pests']}}
        return world

    def test_carrier_mode_accepts_only_current_original_paid_and_actual_four_step_prefix(self):
        world=self.carrier();before=copy.deepcopy(world)
        actual=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./src/earth-expedition.js').patrol.steps.slice(0,4).map(s=>s.id)))"],cwd=ROOT,text=True))
        self.assertEqual(tool.validate_source(world,'carrier'),actual);self.assertEqual(world,before)
        world['earthExpedition']['patrol']['lastClaim']=1;world['earthExpedition']['patrol']['active']['run']=2
        self.assertEqual(tool.validate_source(world,'carrier'),actual)

    def test_carrier_mode_refuses_recorded_partial_stale_run_or_unpaid_sources_without_mutation(self):
        world=self.carrier();cases=[]
        for run in [True,0,1000001,1.5,'1']:
            c=copy.deepcopy(world);c['earthExpedition']['patrol']['active']['run']=run;cases.append(c)
        for steps in [world['earthExpedition']['patrol']['active']['steps'][:-1],list(reversed(world['earthExpedition']['patrol']['active']['steps'])),world['earthExpedition']['patrol']['active']['steps']+['inspect-glade']]:
            c=copy.deepcopy(world);c['earthExpedition']['patrol']['active']['steps']=steps;cases.append(c)
        c=copy.deepcopy(world);c['earthExpedition']['patrol']['lastClaim']=1;cases.append(c)
        c=copy.deepcopy(world);c['earthExpedition']['story']['claimed']=False;cases.append(c)
        c=copy.deepcopy(world);c['earthExpedition']['patrol']['active']=None;cases.append(c)
        for c in cases:
            before=copy.deepcopy(c)
            with self.assertRaises(ValueError):tool.validate_source(c,'carrier')
            self.assertEqual(c,before)
        with self.assertRaises(ValueError):tool.validate_source(world,'invented')

    def test_current_capture_sources_are_embedded_and_new_cli_mode_is_inert(self):
        html=(ROOT/'index.html').read_bytes().replace(b'\r\n',b'\n')
        for filename in ['earth-patrol-carrier.js','earth-patrol-carrier-ui.js','earth-patrol-carrier-art.js']:
            self.assertTrue((ROOT/'src'/filename).read_bytes().replace(b'\r\n',b'\n') in html, filename+' is not embedded in the checked-in build')
        result=subprocess.run([sys.executable,'-B',str(ROOT/'tools/capture_earth_fieldcraft.py'),'--help'],capture_output=True,text=True,cwd=ROOT)
        self.assertEqual(result.returncode,0);self.assertIn('--work {support,carrier}',result.stdout)
        embedded=tool.validate_build(ROOT);self.assertIn('src/earth-patrol-carrier.js',embedded);self.assertIn('src/app.js',embedded)

    def test_equal_stale_pages_or_unequal_pages_refuse_before_browser_acquisition(self):
        with tempfile.TemporaryDirectory(prefix='synthetic-short-build-') as d:
            root=Path(d);chunks=[]
            for name in tool.CORE_FILES:
                if name.startswith('src/') and name.endswith('.js'):
                    p=root/name;p.parent.mkdir(parents=True,exist_ok=True);body=('/* synthetic runtime '+name+' */\r\n').encode();p.write_bytes(body);chunks.append(body.replace(b'\r\n',b'\n'))
            page=b'<html>'+b'\n'.join(chunks)+b'</html>';(root/'index.html').write_bytes(page);(root/'FIRSTLIGHT_VALLEY.html').write_bytes(page)
            self.assertTrue(tool.validate_build(root))
            (root/'src/earth-patrol-carrier.js').write_bytes(b'/* changed current rule */\n')
            with self.assertRaisesRegex(ValueError,'not embedded'):tool.validate_build(root)
            self.assertEqual((root/'index.html').read_bytes(),page,'recorder never blesses a stale page')
            (root/'FIRSTLIGHT_VALLEY.html').write_bytes(page+b'changed')
            with self.assertRaisesRegex(ValueError,'pages differ'):tool.validate_build(root)

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
        owned_temp=Path('D:/07-GAMES/Firstlight/cache/browser-temp')
        parent=str(owned_temp) if sys.platform=='win32' and owned_temp.is_dir() else None
        with tempfile.TemporaryDirectory(prefix='fieldcraft-preflight-',dir=parent) as d:
            base=Path(d);p=base/'existing-evidence';p.mkdir();sentinel=p/'KEEP.txt';sentinel.write_text('preserve failed evidence',encoding='utf-8')
            source=base/'SYNTHETIC_SOURCE.json';source.write_text(json.dumps(synthetic()),encoding='utf-8')
            journey=base/'SYNTHETIC_JOURNEY.json';journey.write_text(json.dumps({'status':'passed','sourceDrift':False,'checkpoints':{source.name:{'sha256':tool.sha(source)}}}),encoding='utf-8')
            result=subprocess.run([sys.executable,'-B',str(ROOT/'tools/capture_earth_fieldcraft.py'),'--source',str(source),'--journey-report',str(journey),'--output',str(p),'--renderer','hardware'],capture_output=True,text=True,cwd=ROOT)
            self.assertEqual(result.returncode,2);self.assertEqual(sentinel.read_text(encoding='utf-8'),'preserve failed evidence')
            expected='Fresh absolute D-drive output required' if sys.platform=='win32' and p.drive.lower()!='d:' else 'Output must be new and source must exist'
            self.assertIn(expected,result.stderr);self.assertNotIn('the following arguments are required',result.stderr)
            self.assertEqual(sorted(q.name for q in p.iterdir()),['KEEP.txt'])

if __name__=='__main__':unittest.main()
