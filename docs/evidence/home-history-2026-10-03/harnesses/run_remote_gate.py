from pathlib import Path
import argparse,datetime,hashlib,json,os,subprocess,sys
ap=argparse.ArgumentParser();ap.add_argument('--head',required=True);args=ap.parse_args()
head=args.head;assert len(head)==40
base=Path('D:/07-GAMES/Firstlight');out=base/'artifacts'/('final-home-history-remote-'+head[:7]+'-20261003');root=base/'authoring'/('home-history-remote-'+head[:7]+'-20261003')
assert not root.exists() and not out.exists(),'Preserve previous checkout/receipt'
out.mkdir(parents=True)
origin='https://github.com/EternitiesAi/eternities-firstlight.git';branch='gameplay/home-that-remembers-20261003'
cmd=['git','clone','--single-branch','--branch',branch,origin,str(root)]
with (out/'REMOTE_CLONE_LOG.txt').open('wb') as f:subprocess.run(cmd,stdout=f,stderr=subprocess.STDOUT,check=True)
actual=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip();assert actual==head,(actual,head)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
tracked=[p for p in subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0') if p]
assert not subprocess.check_output(['git','status','--porcelain'],cwd=root,text=True)
env=dict(os.environ);removed={k:v for k,v in env.items() if k.startswith('FIRSTLIGHT_')}
for k in removed:env.pop(k)
env['PYTHONUNBUFFERED']='1';env['PYTHONUTF8']='1'
start={'started':datetime.datetime.now(datetime.timezone.utc).isoformat(),'head':head,'origin':origin,'clone_command':cmd,'tracked_sha256':{p:sha(root/p) for p in tracked},'html':{p:{'bytes':(root/p).stat().st_size,'sha256':sha(root/p)} for p in ['index.html','FIRSTLIGHT_VALLEY.html']},'environment':{'python':sys.version,'node':subprocess.check_output(['node','--version'],text=True).strip(),'removed_override_names':sorted(removed),'default_browser_scope':True},'portable':{'manifest_sha256':sha(root/'docs/evidence/coastward-expedition-2026-10-03/MANIFEST.json')},'resource_authority':'One Root-owned Firstlight browser gate at a time. Unrelated desktop/GPU workers are neither stopped nor claimed idle.'}
(out/'START_MANIFEST.json').write_text(json.dumps(start,indent=2)+'\n',encoding='utf-8')
run={'command':[sys.executable,'tools/verify.py','--browser','--output',str(out/'commands')],'cwd':str(root),'started_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'browser':True}
(out/'RUN.json').write_text(json.dumps(run,indent=2)+'\n',encoding='utf-8')
print('Fresh remote exact head '+head+' at '+str(root),flush=True)
with (out/'FULL_VERIFY_CONSOLE.log').open('w',encoding='utf-8') as log:
 proc=subprocess.Popen(run['command'],cwd=root,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,encoding='utf-8',errors='replace')
 for line in proc.stdout:
  log.write(line);log.flush()
  if not line.startswith(('Running syntax-','PASS: syntax-')):print(line,end='',flush=True)
 run['exit_code']=proc.wait()
run['ended_at']=datetime.datetime.now(datetime.timezone.utc).isoformat();(out/'RUN.json').write_text(json.dumps(run,indent=2)+'\n',encoding='utf-8')
print(json.dumps(run,indent=2),flush=True)
raise SystemExit(run['exit_code'])
