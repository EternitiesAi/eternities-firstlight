"""CPU-only admission boundaries. Miniature receipts cannot qualify gameplay."""
from pathlib import Path
import importlib.util,json,tempfile,unittest,hashlib

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('briar_native',ROOT/'tools/briar_outing_browser.py')
N=importlib.util.module_from_spec(spec);spec.loader.exec_module(N)

class Admission(unittest.TestCase):
    def test_failure_keeps_original_bytes_before_close_and_capture_error(self):
        # SYNTHETIC transport only. No Chromium/profile/source qualification.
        with tempfile.TemporaryDirectory(prefix='firstlight-briar-failure-cpu-')as temp:
            h=N.Native.__new__(N.Native);h.folder=Path(temp);h.row={};calls=[]
            class Page:
                def screenshot(self,**kwargs):
                    calls.append('screenshot');raise RuntimeError('SYNTHETIC screenshot unavailable')
            class Context:
                def close(self):calls.append('close')
            h.page=Page();h.context=Context();h.state=lambda:{'label':'SYNTHETIC failed live state'}
            h.diag=lambda:{'label':'SYNTHETIC failed diagnostics'}
            h.ev=lambda code:'SYNTHETIC original native bytes'
            h.retain_failure();self.assertNotIn('close',calls)
            self.assertEqual((h.folder/'FAILURE_NATIVE_BYTES.json').read_text(),'SYNTHETIC original native bytes')
            self.assertEqual(len(h.row['failureEvidence']),3)
            self.assertTrue(all(r['beforeClose']for r in h.row['failureEvidence']))
            self.assertEqual(len(h.row['captureErrors']),1)
            h.finish();self.assertEqual(calls,['screenshot','close']);self.assertTrue(h.row['closed'])

    def test_fact_action_cannot_hide_health_settings_or_economy_mutation(self):
        before={'briarMoments':{'version':1,'revision':0,'moments':[]},'adventure':{'revision':3,'hp':10,'coins':9},
            'settings':{'cameraFov':60},'journal':[],'nextEvent':8,'day':2,'hour':17}
        after=json.loads(json.dumps(before));after['briarMoments']['moments'].append(N.FACTS[0])
        after['briarMoments']['revision']+=1;after['adventure']['revision']+=1;after['nextEvent']+=1
        after['journal'].append({'kind':'briar-moment','seq':8,'day':2,'hour':17,'text':'SYNTHETIC oracle token'})
        self.assertTrue(N.fact_boundary(before,after,N.FACTS[0]))
        for owner,key in [('adventure','hp'),('adventure','coins'),('settings','cameraFov')]:
            changed=json.loads(json.dumps(after));changed[owner][key]+=1
            self.assertFalse(N.fact_boundary(before,changed,N.FACTS[0]))

    def test_current_source_success_uses_real_names_and_retains_every_stage(self):
        # SYNTHETIC CPU boundary, never executed game/source qualification.
        with tempfile.TemporaryDirectory(prefix='firstlight-briar-gate-cpu-')as temp:
            root=Path(temp);(root/'tools').mkdir();(root/'src').mkdir();(root/'tests').mkdir()
            (root/'src/core.js').write_text('// SYNTHETIC',encoding='utf8')
            (root/'tests/example.test.cjs').write_text('// SYNTHETIC',encoding='utf8')
            verifier=root/'tools/verify.py'
            verifier.write_text("def main(args):\n run('additional-source-owner',[])\n if args.browser:\n  run('browser-only',[])\n",encoding='utf8')
            stages=['build','syntax-core','rules','python','additional-source-owner','whole-draft-earned','briar-outing-earned']
            console=root/'CONSOLE.log'
            console.write_text(''.join('Running '+n+'...\nPASS: '+n+'\n'for n in stages)+
                'Verification passed. Automated checks do not qualify human pacing or device performance.\n',encoding='utf8')
            rules=root/'rules-command.json'
            rules.write_text(json.dumps({'root':str(root),'ruleFiles':['tests/example.test.cjs'],'ruleFileCount':1,
                'requestedWorkers':4,'verifierSha256':N.sha(verifier),'rulesTimeoutSeconds':180,'pythonTimeoutSeconds':600}),encoding='utf8')
            row=lambda p:{'path':str(p),'sha256':N.sha(p),'bytes':p.stat().st_size}
            receipt={'exitCode':0,'sourceHead':'a'*40,'headAfter':'a'*40,'statusAfter':[],
                'command':['python','-B','tools/verify.py','--rule-workers','4','--output',str(root)],'requestedRuleWorkers':4,
                'console':row(console),'rulesCommand':row(rules)}
            p=root/'EXIT.json';p.write_text(json.dumps(receipt),encoding='utf8')
            self.assertEqual(N.source_gate(p,root,'a'*40)['commandsPassed'],len(stages))
            # Matching green footer and PASS list are still insufficient when a
            # current owner was omitted. Freeze the actual altered log link.
            console.write_text(console.read_text().replace('Running additional-source-owner...\nPASS: additional-source-owner\n',''),encoding='utf8')
            receipt['console']=row(console);p.write_text(json.dumps(receipt),encoding='utf8')
            with self.assertRaises(ValueError):N.source_gate(p,root,'a'*40)

    def test_preservation_retains_economy_identity_and_conversations(self):
        # SYNTHETIC projection only; no playable or command-earned claim.
        value={'adventure':{'xp':80,'coins':7,'equipment':{'weapon':'labelled-fake'},'elapsed':0},
            'sandbox':{'inventory':{'wood':2},'elapsed':0},'residents':[{'id':'fake','conversations':1,'x':0,'z':0,'yaw':0,'progress':0}]}
        moved=json.loads(json.dumps(value));moved['residents'][0].update(x=3,z=2,progress=.1)
        self.assertEqual(N.stable(value),N.stable(moved))
        for field in ('coins','xp'):
            changed=json.loads(json.dumps(value));changed['adventure'][field]+=1
            self.assertNotEqual(N.stable(value),N.stable(changed))
        moved['residents'][0]['conversations']=0
        self.assertNotEqual(N.stable(value),N.stable(moved))
        value['settings']={'quality':'balanced','timeFlow':True,'cameraMode':'adventure','cameraViews':{},
            'cameraFov':60,'reducedMotion':True,'cameraCutaway':True,'labels':True,'sound':False}
        changed=json.loads(json.dumps(value));changed['settings'].update(quality='low',timeFlow=False,cameraMode='follow')
        self.assertEqual(N.stable(value),N.stable(changed))
        for key in ('cameraFov','reducedMotion','cameraCutaway','labels','sound'):
            changed=json.loads(json.dumps(value));changed['settings'][key]=61 if key=='cameraFov'else not value['settings'][key]
            self.assertNotEqual(N.stable(value),N.stable(changed))

    def test_scope_requires_exact_unique_labels_and_discloses_no_native_cpu_claim(self):
        report={'status':'passed','acceleratedTicks':True,'inMemoryProductionStore':True,
                'browserExecuted':False,'nativePersistence':False,'normalRAF':False,'humanPacing':False,
                **{k:0 for k in N.ZERO},'cases':[{'label':s}for s in N.EARLY]}
        self.assertEqual(N.report_terms(report,'early-only'),N.EARLY)
        with self.assertRaises(ValueError):N.report_terms(report,'complete')
        for change in ('duplicate','unknown','boolean-zero','native-claim'):
            value=json.loads(json.dumps(report))
            if change=='duplicate':value['cases'][1]['label']=value['cases'][0]['label']
            elif change=='unknown':value['cases'][1]['label']='unreviewed-old-save'
            elif change=='boolean-zero':value['inventoryGrants']=False
            else:value['nativePersistence']=True
            with self.subTest(change=change),self.assertRaises(ValueError):N.report_terms(value,'early-only')

    def test_checkpoint_bytes_and_namespace_cannot_be_substituted(self):
        with tempfile.TemporaryDirectory(prefix='firstlight-briar-native-cpu-')as temp:
            base=Path(temp);p=base/'INPUT_WORLD.json';p.write_text('{"label":"SYNTHETIC byte boundary only"}',encoding='utf8')
            row={'path':str(p),'sha256':N.sha(p),'bytes':p.stat().st_size}
            self.assertEqual(N.link(row,base),p.resolve())
            for key,value in [('sha256','0'*64),('bytes',True),('bytes',row['bytes']+1)]:
                with self.subTest(key=key),self.assertRaises(ValueError):N.link({**row,key:value},base)
            with self.assertRaises(ValueError):N.link(row,base/'other-cohort')
            p.write_text('changed synthetic bytes',encoding='utf8')
            with self.assertRaises(ValueError):N.link(row,base)

    def test_equal_stale_html_and_source_membership_drift_refuse(self):
        with tempfile.TemporaryDirectory(prefix='firstlight-briar-source-cpu-')as temp:
            root=Path(temp);(root/'src').mkdir()
            files={'src/core.js':b'// SYNTHETIC source-boundary token only\n',
                   'build.py':b'# SYNTHETIC build token\n',
                   'index.html':b'// SYNTHETIC source-boundary token only\n',
                   'FIRSTLIGHT_VALLEY.html':b'// SYNTHETIC source-boundary token only\n',
                   'tests/briar_outing_journey.cjs':b'// never executed\n',
                   'tools/whole_draft_readback.cjs':b'// never executed\n'}
            for name,body in files.items():p=root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(body)
            frozen={p:N.sha(root/p)for p in files};self.assertEqual(N.source_epoch(root,frozen),frozen)
            for name in ('index.html','FIRSTLIGHT_VALLEY.html'):(root/name).write_bytes(b'old equal unembedded pages')
            frozen={p:N.sha(root/p)for p in files}
            with self.assertRaisesRegex(ValueError,'embedded'):N.source_epoch(root,frozen)
            for name in ('index.html','FIRSTLIGHT_VALLEY.html'):(root/name).write_bytes(files[name])
            with self.assertRaises(ValueError):N.source_epoch(root,{p:h for p,h in frozen.items()if p!='src/core.js'})

    def test_complete_source_receipt_cannot_hide_failure_or_dirty_head(self):
        with tempfile.TemporaryDirectory(prefix='firstlight-briar-source-gate-cpu-')as temp:
            root=Path(temp);p=root/'EXIT.json'
            for value in ({'exitCode':1},{'exitCode':0,'sourceHead':'a'*40,'headAfter':'b'*40,'statusAfter':[]},
                          {'exitCode':0,'sourceHead':'a'*40,'headAfter':'a'*40,'statusAfter':[' M src/app.js']}):
                p.write_text(json.dumps(value),encoding='utf8')
                with self.subTest(value=value),self.assertRaises(ValueError):N.source_gate(p,root,'a'*40)

if __name__=='__main__':unittest.main(verbosity=2)
