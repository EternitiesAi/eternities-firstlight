"""Portable CPU admission/controller tests; never import or launch Playwright.

Actual checkpoint admission executes installed Core/Data validators. Controller
fixtures below are labelled synthetic unit data, not fake product Core frames or
browser acceptance. Derivatives remain in this owned stage; nothing is deleted.
"""
from pathlib import Path
import ast
import copy
import json
import html
import math
import os
import re
import subprocess
import sys
import tempfile
import unittest
sys.dont_write_bytecode=True
import road_account_browser as h

ROOT=Path(os.environ['FIRSTLIGHT_ROOT']).resolve();HERE=Path(__file__).resolve().parent
MANIFEST=Path(os.environ['ROAD_ACCOUNT_NATIVE_INPUTS']).resolve() if os.environ.get('ROAD_ACCOUNT_NATIVE_INPUTS') else None
EXPECTATIONS=Path(os.environ.get('ROAD_ACCOUNT_NATIVE_EXPECTATIONS',str(HERE/'SOURCE_EXPECTATIONS04.json')))
CPU_OUTPUT=Path(os.environ.get('ROAD_ACCOUNT_CPU_OUTPUT',str(HERE))).resolve()
def unit_world():
 # A real Core fresh dictionary for pure parser unit tests if actual native
 # outputs were not supplied. It is never claimed/imported/ticked/executed.
 if MANIFEST is not None and MANIFEST.is_file():return h.read(h.read(MANIFEST)['cases']['signed-loop']['claimed']['world']['path'] if h.read(MANIFEST)['schema'].endswith('v1') else MANIFEST.parent/h.read(MANIFEST)['cases']['signed-loop']['claimed']['world']['path'])
 return json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require(process.argv[1]+'/src/core.js').fresh()))",str(ROOT)],text=True,timeout=30))

class Admission(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  if MANIFEST is None:raise unittest.SkipTest('Actual native checkpoint manifest not supplied; no native admission is claimed')
  if not MANIFEST.is_file():raise ValueError('Explicitly supplied actual native checkpoint manifest is missing')
  cls.rows,cls.frozen,cls.report=h.admit_inputs(ROOT,MANIFEST,EXPECTATIONS)
  h.need(CPU_OUTPUT.is_dir() and CPU_OUTPUT!=ROOT and ROOT not in CPU_OUTPUT.parents,'Owned CPU derivative output outside ROOT required')
  cls.folder=Path(tempfile.mkdtemp(prefix='retained-cpu-admission-',dir=CPU_OUTPUT))
 def derivative(self,label,world):
  file=self.folder/(label+'.json');h.dump(file,world);return file
 def test_original_before_and_claimed_both_cases_admit_exact_native_identity(self):
  self.assertEqual(set(self.rows),{'signed-loop','cleared-pocket'});self.assertGreaterEqual(len(self.frozen),13)
  for outcome,row in self.rows.items():
   self.assertEqual(row['claimed']['world']['earthWildSigns']['resolution'],outcome)
   self.assertTrue(h.checkpoint_pair(row['claimed']['world'],h.active_world(h.read(row['claimed']['files']['store'])),'claimed'))
 def test_paid_unclaimed_resolution_clearance_or_extra_record_cannot_admit(self):
  for name,outcome,alter in [('unclaimed','signed-loop',lambda w:w['earthWildSigns'].update(claimed=False)),
    ('wrong-resolution','signed-loop',lambda w:w['earthWildSigns'].update(resolution='cleared-pocket')),
    ('uncleared','cleared-pocket',lambda w:w['earthWildSigns'].update(cleared=False)),
    ('extra-record','signed-loop',lambda w:w['earthWildSigns'].update(extra=True))]:
   row=self.rows[outcome]['claimed'];world=copy.deepcopy(row['world']);alter(world)
   with self.subTest(name=name),self.assertRaises(subprocess.CalledProcessError):h.validate_checkpoint(ROOT,self.derivative(name,world),row['expected'],'claimed')
 def test_missing_load_expedition_or_owner_refuses_without_canonical_repair(self):
  row=self.rows['signed-loop']['claimed']
  for name,alter in [('missing-load',lambda w:w['localLife']['records'].pop(h.LOAD)),('missing-expedition',lambda w:w.pop('earthExpedition')),('missing-owner',lambda w:w.pop('earthWildSigns'))]:
   world=copy.deepcopy(row['world']);alter(world)
   with self.subTest(name=name),self.assertRaises(subprocess.CalledProcessError):h.validate_checkpoint(ROOT,self.derivative(name,world),row['expected'],'claimed')
 def test_no_silent_legacy_migration_or_dropped_owner(self):
  row=self.rows['signed-loop']['claimed'];world=copy.deepcopy(row['world']);world.pop('earthHomecoming')
  with self.assertRaises(subprocess.CalledProcessError):h.validate_checkpoint(ROOT,self.derivative('missing-canonical-field',world),row['expected'],'claimed')
 def test_before_unsaved_native_delta_is_only_three_documented_fields(self):
  row=self.rows['signed-loop']['before'];world=row['world'];stored=h.active_world(h.read(row['files']['store']))
  self.assertNotEqual(world,stored);self.assertTrue(h.checkpoint_pair(world,stored,'before'))
  for field in ('hp','coins','xp'):
   changed=copy.deepcopy(world);changed['adventure'][field]+=1;self.assertFalse(h.checkpoint_pair(changed,stored,'before'))
  changed=copy.deepcopy(world);changed['settings']['reducedMotion']=not changed['settings']['reducedMotion'];self.assertFalse(h.checkpoint_pair(changed,stored,'before'))
  changed=copy.deepcopy(world);changed['adventure']['elapsed']=stored['adventure']['elapsed']+6.3;self.assertFalse(h.checkpoint_pair(changed,stored,'before'))
  changed=copy.deepcopy(world);changed['residents'][0]['conversations']+=1;self.assertFalse(h.checkpoint_pair(changed,stored,'before'))
 def test_claimed_world_native_bytes_get_no_delta_exception(self):
  row=self.rows['signed-loop']['claimed'];w=copy.deepcopy(row['world']);w['adventure']['elapsed']+=.1
  self.assertFalse(h.checkpoint_pair(w,row['world'],'claimed'))
 def test_exact_link_type_hash_absolute_path_and_identity(self):
  m=h.read(MANIFEST);base=None if m['schema'].endswith('v1') else MANIFEST.parent
  good=m['report'];self.assertEqual(h.exact_link(good,base),(Path(good['path']) if base is None else base/good['path']).resolve())
  for value in [{**good,'extra':True},{**good,'sha256':'0'*64},{**good,'path':'relative.json'}]:
   with self.subTest(value=value),self.assertRaises(ValueError):h.exact_link(value,base)
 def test_native_library_cannot_use_boolean_revision_or_ambiguous_active_owner(self):
  row=self.rows['signed-loop']['claimed'];raw=h.read(row['files']['store'])
  wrong=copy.deepcopy(raw);wrong['revision']=True
  with self.assertRaises(ValueError):h.active_world(wrong)
  wrong=copy.deepcopy(raw);wrong['slots'].append(copy.deepcopy(wrong['slots'][-1]))
  with self.assertRaises(ValueError):h.active_world(wrong)
  wrong=copy.deepcopy(raw);wrong['slots'].insert(0,copy.deepcopy(wrong['slots'][0]))
  with self.assertRaises(ValueError):h.active_world(wrong)
  wrong=copy.deepcopy(raw);wrong.pop('nextId')
  with self.assertRaises(ValueError):h.active_world(wrong)
 def test_actual_character_validator_refuses_library_migration_or_reused_inactive_id(self):
  row=self.rows['signed-loop']['claimed'];raw=h.read(row['files']['store'])
  for name,mutate in [('library-extra',lambda s:s.update(extra=True)),('library-reused-id',lambda s:s['slots'].insert(0,copy.deepcopy(s['slots'][0]))),('library-nextId',lambda s:s.update(nextId=True))]:
   altered=copy.deepcopy(raw);mutate(altered)
   with self.subTest(name=name),self.assertRaises(subprocess.CalledProcessError):h.validate_library(ROOT,self.derivative(name,altered))
 def test_installed_source_epoch_or_pending_install_refusal_is_explicit(self):
  current=subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()
  if (ROOT/'src/earth-roadkeeper-motion.js').exists():
   admitted=h.installed_epoch(ROOT,current,EXPECTATIONS);self.assertEqual(admitted['head'],current)
   self.assertEqual(h.read(MANIFEST)['schema'],'road-account-native-checkpoints-v2');self.assertEqual(self.report['head'],current);self.assertEqual(self.report['html_sha256'],admitted['htmlSha256'])
  else:
   with self.assertRaises(ValueError):h.installed_epoch(ROOT,current,EXPECTATIONS)
 def test_portable_generator_uses_relative_actual_current_suite_outputs(self):
  original=h.read(MANIFEST);base=None if original['schema'].endswith('v1') else MANIFEST.parent
  report=h.exact_link(original['report'],base);output=self.folder/'portable-current-inputs.json'
  receipt=h.prepare_current_inputs(ROOT,report,h.read(report)['head'],output,EXPECTATIONS)
  self.assertTrue(receipt['prepared']);self.assertFalse(receipt['browserExecuted']);self.assertEqual(receipt['gameTreeWrites'],0)
  portable=h.read(output);self.assertEqual(portable['schema'],'road-account-native-checkpoints-v2');self.assertFalse(Path(portable['report']['path']).is_absolute())
  admitted,frozen,_=h.admit_inputs(ROOT,output,EXPECTATIONS);self.assertEqual(set(admitted),set(self.rows));self.assertGreaterEqual(len(frozen),13)
 def test_portable_report_head_mismatch_refuses_before_writing(self):
  original=h.read(MANIFEST);report=h.exact_link(original['report'],None if original['schema'].endswith('v1') else MANIFEST.parent);output=self.folder/'refused-head.json'
  with self.assertRaises(ValueError):h.prepare_current_inputs(ROOT,report,'0'*40,output,EXPECTATIONS)
  self.assertFalse(output.exists())

class Controller(unittest.TestCase):
 def test_budgets_and_native_configurations_remain_declared_and_bounded(self):
  self.assertEqual(len(h.CONFIGS),h.BUDGETS['viewportConfigurations']);self.assertEqual({c[2] for c in h.CONFIGS},{'adventure','follow'})
  self.assertEqual({c[3] for c in h.CONFIGS},{False,True});self.assertTrue(all(type(v) is int and v>0 for v in h.BUDGETS.values()))
  self.assertEqual(h.BUDGETS['frameInputMs'],10000);self.assertLessEqual(h.BUDGETS['approachSeconds'],h.BUDGETS['caseSeconds']);self.assertLessEqual(h.BUDGETS['cameraCatchSeconds'],h.BUDGETS['approachSeconds'])
 def test_reviewed_text_identity_permits_only_crlf_lf_not_other_byte_changes(self):
  lf=b'const x=1;\nconst y=2;\n';crlf=lf.replace(b'\n',b'\r\n')
  self.assertEqual(h.reviewed_text_sha(lf),h.reviewed_text_sha(crlf))
  for changed in [lf.replace(b'x=1',b'x=2'),b'\xef\xbb\xbf'+lf,lf.rstrip(b'\n'),lf.replace(b'\n',b'\r'),lf+b' ']:self.assertNotEqual(h.reviewed_text_sha(lf),h.reviewed_text_sha(changed))
 def view(self,phase='home',cycle=0,x=None,z=None):
  # Synthetic pure parser fixture, never supplied to a browser or product Core.
  return dict(phase=phase,cycle=cycle,x=h.HOME['x'] if x is None else x,z=h.HOME['z'] if z is None else z)
 def test_complete_ordered_trip_and_home_cycle_are_required(self):
  w=h.TripWitness();w.add(self.view(),0);w.add(self.view('outbound',x=-110),20);w.add(self.view('inspect',x=-148),60);w.add(self.view('return',x=-130),90);w.add(self.view(cycle=1),130)
  self.assertTrue(w.complete);self.assertEqual(w.phases,['home','outbound','inspect','return','home'])
 def test_midtrip_start_cannot_backfill_missing_outbound(self):
  w=h.TripWitness();w.add(self.view('inspect',x=-148),0);w.add(self.view('return',x=-130),20);w.add(self.view(cycle=1),60)
  self.assertFalse(w.complete);self.assertEqual(w.cycle,1)
 def test_partial_cycle_reset_bad_order_speed_or_clock_refuse(self):
  for label,steps in [('cycle-reset',[(self.view(cycle=2),0),(self.view(cycle=0),1)]),
   ('phase-skip',[(self.view(),0),(self.view('inspect'),1),(self.view('return'),2),(self.view(cycle=1),3)]),
   ('speed',[(self.view(),0),(self.view('outbound',x=-110),.1)]),('rollback',[(self.view(),1),(self.view(),0)])]:
   w=h.TripWitness()
   with self.subTest(label=label),self.assertRaises(ValueError):
    for v,t in steps:w.add(v,t)
 def test_reaction_facts_retain_coins_inventory_progress_and_history(self):
  source=unit_world();base=h.reaction_facts(source)
  for kind in ('coin','inventory','account','history','conversation'):
   changed=copy.deepcopy(source)
   if kind=='coin':changed['adventure']['coins']+=1
   if kind=='inventory':changed['sandbox']['inventory']['fiber']+=1
   if kind=='account':changed['earthWildSigns']['claimed']=not changed['earthWildSigns']['claimed']
   if kind=='history':changed['nextEvent']+=1
   if kind=='conversation':changed['residents'][0]['conversations']+=1
   self.assertNotEqual(h.reaction_facts(changed),base)
 def test_public_pose_requires_exact_typed_bounded_fields(self):
  # Synthetic parser data only; never passed to Core, App, or a browser.
  pose=dict(actor=h.ACTOR,resolution='signed-loop',x=h.HOME['x'],z=h.HOME['z'],base=1.57,yaw=0,phase='home',phaseTime=0,gait=0,cycle=0,walking=False,paused=True,suspended='paused',hidden=False,menuOpen=False,reducedMotion=False,radius=.6,height=1.78)
  self.assertTrue(h.safe_view(pose,'signed-loop'))
  for key,value in [('x',float('nan')),('cycle',.5),('walking','yes'),('suspended',True),('phase','teleported'),('actor','other-owner'),('ownerLease',{})]:
   bad={**pose,key:value}
   with self.subTest(key=key):self.assertFalse(h.safe_view(bad,'signed-loop'))
 def test_death_delta_refuses_unrelated_history_owner_or_reward(self):
  # Synthetic acceptance-parser fixture; no generated event is sent to Core.
  before=unit_world();after=copy.deepcopy(before)
  after['adventure']['deaths']+=1;after['adventure']['tonics']=3
  after['adventure']['receipts']=(before['adventure']['receipts']+[dict(id='unit-revive',fp=json.dumps(['revive',{}]),ok=True)])[-100:]
  for kind,text in [('adventure','You fell on an expedition. Your home and belongings are safe.'),('quest','You returned to the spring. Belongings, excavation and completed encounters remain.')]:
   after['journal'].append(dict(seq=after['nextEvent'],day=before['day'],hour=before['hour'],kind=kind,text=text));after['nextEvent']+=1
  after['journal']=after['journal'][-200:];self.assertTrue(h.death_transition(before,after))
  for kind in ('reward','owner','old-history','extra-history','receipt'):
   wrong=copy.deepcopy(after)
   if kind=='reward':wrong['adventure']['coins']+=1
   if kind=='owner':wrong['earthWildSigns']['claimed']=not wrong['earthWildSigns']['claimed']
   if kind=='old-history':wrong['journal'][0]['text']='unit-corruption'
   if kind=='extra-history':wrong['nextEvent']+=1
   if kind=='receipt':wrong['adventure']['receipts'][-1]['fp']=json.dumps(['attack',{}])
   with self.subTest(kind=kind):self.assertFalse(h.death_transition(before,wrong))
 def test_source_has_no_browser_import_at_module_scope_or_product_state_event_proof_injection(self):
  source=(HERE/'road_account_browser.py').read_text(encoding='utf-8');tree=ast.parse(source)
  for node in tree.body:
   if isinstance(node,ast.ImportFrom):self.assertNotIn('playwright',node.module or '')
  # Inspect code actually submitted to evaluate, rather than the literal App
  # source seam that admission searches for. That seam is evidence, not a tick.
  scripts=[h.CHECKPOINT_JS,h.LIBRARY_JS,h.SAMPLE_JS,h.PROJECTION_JS,h.PIXELS_JS]
  for node in ast.walk(tree):
   if isinstance(node,ast.Call) and isinstance(node.func,ast.Attribute) and node.func.attr=='ev' and node.args and isinstance(node.args[0],ast.Constant) and isinstance(node.args[0].value,str):scripts.append(node.args[0].value)
  for script in scripts:
   for prohibited in ('Realm.test.','dispatchEvent(','Object.defineProperty(','sim.tick(','recordClearance(','observationTicket(','acknowledge('):self.assertNotIn(prohibited,script)
  self.assertIn('if not a.execute:',source);self.assertIn('from playwright.sync_api import sync_playwright',source)
  self.assertIn("finally{restore();e.render(t,s.hour,s.weather==='rain');}",h.PIXELS_JS)
 def test_every_javascript_probe_parses_without_executing_core_frame_or_browser(self):
  tree=ast.parse((HERE/'road_account_browser.py').read_text(encoding='utf-8-sig'))
  scripts=[dict(kind='script',source=s) for s in (h.CHECKPOINT_JS,h.LIBRARY_JS)]+[dict(kind='expression',source=s) for s in (h.SAMPLE_JS,h.PROJECTION_JS,h.PIXELS_JS)]
  for node in ast.walk(tree):
   if isinstance(node,ast.Call) and isinstance(node.func,ast.Attribute) and node.func.attr=='ev' and node.args and isinstance(node.args[0],ast.Constant) and isinstance(node.args[0].value,str):scripts.append(dict(kind='expression',source=node.args[0].value))
  code="const fs=require('node:fs'),vm=require('node:vm'),s=JSON.parse(fs.readFileSync(0));for(const p of s)new vm.Script(p.kind==='expression'?'('+p.source+');':p.source);console.log(JSON.stringify({parsed:s.length,executed:false}));"
  receipt=json.loads(subprocess.check_output(['node','-e',code],input=json.dumps(scripts),text=True,timeout=30))
  self.assertEqual(receipt['parsed'],len(scripts));self.assertFalse(receipt['executed'])
 def test_native_approach_uses_actual_projected_ground_and_cannot_claim_coarse_corner_cut(self):
  source=(HERE/'road_account_browser.py').read_text(encoding='utf-8');part=source[source.index('  def approach('):source.index('  def cameras(')]
  self.assertIn('Realm.project',part);self.assertIn('RealmCore.pathfind',part);self.assertIn('self.page.mouse.click',part);self.assertIn('RealmWorldFoundations.segment',part)
  self.assertNotIn('native_keys',part);self.assertNotIn('Realm.navigate',part);self.assertNotIn('moveTo(',part)

SOURCE02_SURFACES_JS=r"""const path=require('node:path'),assert=require('node:assert/strict');
const root=process.argv[1],C=require(path.join(root,'src/core.js')),E=require(path.join(root,'src/earth-expedition.js'));
const CD=require(path.join(root,'src/earth-consignment-data.js')),D=require(path.join(root,'src/earth-wild-signs-data.js'));
require(path.join(root,'src/earth-wild-signs.js'));require(path.join(root,'src/earth-fieldcraft-ui.js'));
const M=require(path.join(root,'src/earth-road-account.js')),UI=require(path.join(root,'src/earth-wild-signs-ui.js')).WildSignsUI,rows=[];
// Explicitly synthetic CPU fixtures through actual validators and UI producers.
// No step, tick, command, save, native import, or browser is performed.
for(const outcome of ['signed-loop','cleared-pocket']){
 const raw=C.fresh();raw.adventure.started=true;
 raw.earthExpedition={version:1,story:{accepted:true,branch:'stormfall-recovery',steps:E.definition.steps.map(s=>s.id),claimed:true},patrol:{lastClaim:0,active:null}};
 raw.localLife.records[CD.ID]={accepted:true,choice:'south-stormfall',steps:CD.required('south-stormfall').slice(),claimed:true};
 raw.earthWildSigns={version:1,accepted:true,evidence:['timber-gouge','feeding-track','pest-scrape'],observed:true,resolution:outcome,cleared:outcome==='cleared-pocket',claimed:true};
 const state=C.validate(raw),sim=new C.Simulation(state);sim.room=D.ROOM;sim.state.player={x:D.giver.x,z:D.giver.z,yaw:0};
 const before=JSON.stringify(sim.state),host={sim,api:{},quest:'story',open(){},close(){},paint(){}},panel=new UI(host).panel();
 assert.ok(panel.includes(M.noticeHTML(sim.state)),'Actual Sela panel contains exact current authored notice');
 for(const person of ['elderweald-sela','elderweald-rill','merren'])rows.push({outcome,person,authored:M.reading(person,sim.state),notice:M.notice(sim.state),noticeHTML:M.noticeHTML(sim.state),roleHTML:M.html(person,sim.state),panel});
 assert.equal(JSON.stringify(sim.state),before,'Readonly authored/UI calls leave every actual world field unchanged');
}
console.log(JSON.stringify({cpuOnly:true,browserExecuted:false,coreAndUIActual:true,rows}));"""

class Source02Surfaces(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  module=ROOT/'src/earth-road-account.js'
  if not module.is_file():raise unittest.SkipTest('Reviewed Source02 module is not installed; actual UI-source contracts remain pending')
  expected=h.read(EXPECTATIONS)['reviewedModulesLF']['earth-road-account.js']
  h.need(h.lf_sha(module)==expected,'Source02 contract requires the exact reviewed module, not a substituted source')
  cls.data=json.loads(subprocess.check_output(['node','-e',SOURCE02_SURFACES_JS,str(ROOT)],text=True,timeout=30))
  cls.rows=cls.data['rows']
 @staticmethod
 def paragraphs(source):return [html.unescape(re.sub(r'<[^>]+>','',s)) for s in re.findall(r'<p\b[^>]*>(.*?)</p>',source,re.S)]
 def test_actual_source02_surface_selection_matches_authored_notice_or_role(self):
  self.assertTrue(self.data['cpuOnly']);self.assertFalse(self.data['browserExecuted']);self.assertTrue(self.data['coreAndUIActual'])
  for row in self.rows:
   sela=row['person']=='elderweald-sela';paragraphs=self.paragraphs(row['noticeHTML'] if sela else row['roleHTML'])
   payment=re.findall(r'<p class="wild-signs-payment">(.*?)</p>',row['panel']) if sela else []
   with self.subTest(person=row['person'],outcome=row['outcome']):self.assertTrue(h.account_surface(row['person'],row['outcome'],row['authored'],paragraphs,row['notice'] if sela else None,payment))
 def test_original_surface_and_repeated_uncertainty_assumptions_are_actual_negative_controls(self):
  for row in self.rows:
   if row['person']=='elderweald-sela':
    # This is the original native03-preparation assertion. Its mismatch is
    # real Source02 output, rather than a fabricated failing paragraph count.
    self.assertNotEqual(self.paragraphs(row['noticeHTML'])+[h.PAID_TEXT],row['authored']['lines'])
   else:self.assertNotIn('unproven',' '.join(row['authored']['lines']).lower())
 def test_wrong_surface_resolution_or_duplicate_payment_cannot_pass(self):
  for row in self.rows:
   person=row['person'];sela=person=='elderweald-sela';source=row['noticeHTML'] if sela else row['roleHTML'];lines=self.paragraphs(source);payment=[h.PAID_TEXT] if sela else []
   other='cleared-pocket' if row['outcome']=='signed-loop' else 'signed-loop'
   self.assertFalse(h.account_surface(person,other,row['authored'],lines,row['notice'],payment))
   self.assertFalse(h.account_surface(person,row['outcome'],row['authored'],lines+['extra claim'],row['notice'],payment))
   if sela:
    self.assertFalse(h.account_surface(person,row['outcome'],row['authored'],row['authored']['lines'],row['notice'],payment))
    self.assertFalse(h.account_surface(person,row['outcome'],row['authored'],lines,row['notice'],payment*2))

if __name__=='__main__':unittest.main(verbosity=2)
