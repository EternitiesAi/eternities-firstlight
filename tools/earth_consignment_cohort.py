#!/usr/bin/env python3
"""Bind existing current command-earned expedition outputs to one native cohort.

This performs no gameplay, browser, profile, server, save or progress mutation.
"""
import argparse,hashlib,importlib.util,json,subprocess
from pathlib import Path
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def load_native(root):
    spec=importlib.util.spec_from_file_location('current_consignment_native',root/'tools/earth_consignment_browser.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def create(root,sources,output):
    root,sources,output=Path(root).resolve(),Path(sources).resolve(),Path(output).resolve()
    if output!=sources/'FIRST_LOAD_COHORT.json' or output.exists():raise ValueError('New cohort must accompany this exact current earned-source root')
    m=load_native(root);html=m.build_epoch(root);variants={}
    for variant,folder in m.VARIANTS.items():
        source=sources/folder/'04_FIRST_CLAIMED.json';journey=sources/folder/'EARTH_EXPEDITION_JOURNEY_REPORT.json'
        world=json.loads(source.read_text(encoding='utf-8'));report=json.loads(journey.read_text(encoding='utf-8'));m.source_check(world,report,variant)
        if report['harnessSha256']!=sha(root/'tests/earth_expedition_journey.cjs'):raise ValueError('Current earned caller changed')
        for name,value in report['sourceHashes'].items():
            if Path(name).name!=name or sha(root/'src'/name)!=value:raise ValueError('Current original expedition source changed: '+name)
        variants[variant]={kind:{'path':str(p.relative_to(sources)).replace('\\','/'),'sha256':sha(p)}for kind,p in [('source',source),('journey',journey)]}
    epoch={'mode':'current-command-earned','head':subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD']).decode().strip(),'htmlSha256':html,'callerSha256':sha(root/'tests/earth_expedition_journey.cjs'),'runtimeSources':{str(p.relative_to(root)).replace('\\','/'):sha(p)for p in sorted((root/'src').glob('*'))if p.is_file()}}
    value={'schema':'first-load-native-cohort-v1','epoch':epoch,'variants':variants,'scope':'Original kit/expedition prerequisites newly command-earned in this invocation; new consignment has no accepted/arrival/payment progress. CPU accelerated caller, not native persistence or human pacing.'}
    with output.open('x',encoding='utf-8',newline='\n')as f:json.dump(value,f,indent=2);f.write('\n')
    m.cohort(output,root);return value
def main():
    p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--sources',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();v=create(a.root,a.sources,a.output);print(json.dumps({'status':'bound','variants':list(v['variants']),'cohortSha256':sha(a.output),'epoch':v['epoch']['mode']}))
if __name__=='__main__':main()
