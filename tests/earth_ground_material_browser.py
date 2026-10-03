"""Actual software-WebGL ground material and appearance-restoration regression.
The child tool uses earned ledgers with labelled synthetic camera/body placement.
No normal-time gameplay or native save claim is implied. Raw/merged reflection
surfaces deliberately differ; low main-image comparisons retain measured bounds.
"""
from pathlib import Path
import os,subprocess,sys
ROOT=Path(os.environ.get('FIRSTLIGHT_TEST_ROOT',Path(__file__).resolve().parents[1])).resolve()
OUT=Path(os.environ.get('FIRSTLIGHT_EARTH_GROUND_OUTPUT',ROOT/'evidence10/earth-ground-material-browser')).resolve()
OUT.mkdir(parents=True,exist_ok=True)
subprocess.run(['node','tests/earth_expedition_journey.cjs','--output',str(OUT/'earned')],cwd=ROOT,check=True,capture_output=True,timeout=180)
subprocess.run([sys.executable,str(ROOT/'tools/inspect_earth_expedition_presentation.py'),'--earned-dir',str(OUT/'earned'),'--output',str(OUT/'frames'),'--quality','low','--variant','fresh-blade'],cwd=ROOT,check=True,timeout=180)
