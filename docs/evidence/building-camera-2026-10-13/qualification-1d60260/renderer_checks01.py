"""Run installed synthetic pixel checks with only source/output path redirection.
No game copy, changed assertion, renderer replacement or personal profile.
"""
from pathlib import Path
import datetime, hashlib, json, os, subprocess, sys, traceback
ROOT=Path('D:/07-GAMES/Firstlight/verification/current-qualified-game')
ARC=Path(__file__).resolve().parent
OUT=ARC/'RENDERER01'
HEAD='1d60260f0bc950b9f0e064555ec750ff38324fe3'
sys.path.insert(0,str(ROOT/'tools'))
import briar_outing_browser as N
assert N.git(ROOT,'rev-parse','HEAD')==HEAD and not N.git(ROOT,'status','--porcelain')
gate=N.read(ARC/'REMOTE_SOURCE06_EXIT.json')
assert gate['exitCode']==0 and gate['sourceHead']==HEAD
N.source_gate(ARC/'REMOTE_SOURCE06_EXIT.json',ROOT,HEAD)
assert not OUT.exists()
OUT.mkdir()
report={'status':'running','head':HEAD,'engineSha256':N.sha(ROOT/'src/engine.js'),'method':__doc__,'cases':[],'errors':[]}
try:
 for suite in ('cutaway','reflection'):
    source=ROOT/'tests'/f'{suite}_browser.py'
    original=source.read_text(encoding='utf-8')
    folder=OUT/suite
    folder.mkdir()
    if suite=='cutaway':
        old="R=Path(__file__).resolve().parents[1];O=R/'evidence10'"
        new=f"R=Path({str(ROOT)!r});O=Path({str(folder)!r})"
        assert original.count(old)==1
        rewritten=original.replace(old,new)
        outputs=['CUTAWAY_BROWSER_REPORT.json']
    else:
        old='root=Path(__file__).resolve().parents[1]'
        assert original.count(old)==1 and original.count("root/'evidence07/regression")==3
        outputs=['REFLECTION_TEST_REPORT.json','REFLECTION_ORIENTATION_SPECIMEN.png']
        rewritten=original.replace(old,f'root=Path({str(ROOT)!r})')
        rewritten=rewritten.replace("(root/'evidence07/regression')",f"Path({str(folder)!r})")
        for name in outputs:
            old_output="root/'evidence07/regression/"+name+"'"
            assert rewritten.count(old_output)==1
            rewritten=rewritten.replace(old_output,f"Path({str(folder/name)!r})")
        assert "root/'evidence07/regression" not in rewritten
    caller=folder/'caller.py';caller.write_text(rewritten,encoding='utf-8',newline='\n')
    compile(rewritten,str(caller),'exec')
    env=dict(os.environ)
    env['PYTHONPATH']=str(ROOT/'tests')+os.pathsep+env.get('PYTHONPATH','')
    row={'suite':suite,'sourceSha256':N.sha(source),'callerSha256':N.sha(caller),
         'changes':'Only original repository/output path expressions; all assertions and launch settings retained',
         'observedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
    report['cases'].append(row)
    row['admission']=N.admission()
    with (folder/'console.log').open('wb') as log:
        result=subprocess.run([sys.executable,'-B',str(caller)],cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=600)
    row['exitCode']=result.returncode
    if result.returncode:raise AssertionError(f'{suite} failed; preserve console')
    receipt=N.read(folder/outputs[0]);assert receipt['passed'] is True
    row['checks']=len(receipt['checks']);row['browserErrors']=receipt['browser_errors']
    row['outputs']=[{'path':str(folder/name),'bytes':(folder/name).stat().st_size,'sha256':N.sha(folder/name)} for name in outputs]
    assert not row['browserErrors'] and N.sha(source)==row['sourceSha256']
 assert N.git(ROOT,'rev-parse','HEAD')==HEAD and not N.git(ROOT,'status','--porcelain')
 report['status']='passed'
except Exception:
 report['status']='failed';report['errors'].append(traceback.format_exc())
finally:
 N.write_new(OUT/'REPORT.json',report)
print(json.dumps(report,indent=2))
sys.exit(0 if report['status']=='passed' else 1)
