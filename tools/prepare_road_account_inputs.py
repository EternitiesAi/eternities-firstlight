#!/usr/bin/env python3
"""Freeze caller-supplied actual primary native outputs. Never launch a browser.

Run after the ordinary current WildSigns native suite passes and closes. This
does not earn any progress, modify source, or qualify the future extension.
"""
import argparse
from pathlib import Path
import json
import sys
sys.dont_write_bytecode=True
from road_account_browser import prepare_current_inputs

def main(argv=None):
 parser=argparse.ArgumentParser(description=__doc__)
 for key in ('root','report','output','expectations'):parser.add_argument('--'+key,type=Path,required=True)
 parser.add_argument('--expected-report-head',required=True)
 args=parser.parse_args(argv)
 print(json.dumps(prepare_current_inputs(args.root,args.report,args.expected_report_head,args.output,args.expectations),indent=2))

if __name__=='__main__':main()
