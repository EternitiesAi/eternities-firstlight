from pathlib import Path
s=Path('D:/07-GAMES/Firstlight/artifacts/local-life-20261003/encode_and_verify.py').read_text(encoding='utf-8')
s=s.replace('local-life-20261003/normal-ui-rtx-03','home-remembers-20261003/normal-ui-rtx-01').replace("r['passed']==19","r['passed']==24").replace('LOCAL_LIFE_NORMAL_UI','HOME_NORMAL_UI').replace('MOBILE_LOCAL_LIFE','MOBILE_HOME')
s=s.replace("assert abs(c['decoded_seconds']-65)<.08", "assert abs(c['decoded_seconds']-min(65,b['decoded_seconds']))<.08")
s=s.replace('Two600-interval Cosmos samples','Two600-interval retreat samples').replace('authoring_base_head','exact_source_head')
s=s.replace('Mobile is the final65s','Mobile is at most the final65s')
exec(compile(s,__file__,'exec'))
