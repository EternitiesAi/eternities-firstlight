# archived source-epoch tests

these three files pin the exact bytes of reviewed source files and historical git heads from the october road-account
reviews (`tools/SOURCE_EXPECTATIONS04-08.json`). any edit to the pinned modules, and any checkout that is not that
frozen state, fails them; on the 2026-11-13 baseline (main b8c3a6f plus docs) they produced 1 failure and 23 errors
before a single 1.0 change, and stopped the verifier before its journeys ran.

for 1.0 the lead took them out of the default gate (lead decision, docs/1.0). they test evidence provenance, not game
behaviour: save safety, migrations, transactions and the journeys stay in the gate. run them by hand against an old
epoch with `python -m unittest discover -s tests/archive -p "test_*.py"`.

# archived homecoming tests (finale lane)

these tests encode the retired Earth homecoming: the twelve-claim gate, the 168 hp repulse, the fee payment and the Earth
room's walk, tracker and journal. they are moved, not deleted, and are out of the default gate. the finale's own tests are
`tests/finale.test.cjs` and `tests/epilogue.test.cjs`. the homecoming's briar migration and preservation tests stay in the
gate. the byte-bound fixture migration checks that still passed when these files moved are the first thing to port to the
finale's record; their fixtures stay in `tests/fixtures`.

- earth_homecoming_app_host.test.cjs
- earth_homecoming_earned.test.cjs
- earth_homecoming_hosts.test.cjs (with earth_homecoming_host_helpers.cjs)
- earth_homecoming_installed.test.cjs
- earth_homecoming_projection.test.cjs
- earth_encounter_art_polish.test.cjs

# archived homecoming verifier chain (integration, 2026-11-13)

`tools/verify.py` no longer runs the retired homecoming's earned cohort (`tools/earth_homecoming_journey.cjs`), its
native preflight, its recording-controller preflight or its native browser gate. These files existed only for that
chain and drive the retired quest (the twelve-claim gate, the 168 hp repulse); they are moved, not deleted:

- test_capture_earth_homecoming.py (with actual_manual_controller.cjs): the recording controller and its quiet-response
  repair, which walks the old quest steps
- test_earth_homecoming_native.py: the native preflight bound to the old earned cohort

`tests/test_verify_earth_homecoming.py` stays in the gate: it unit-tests `earth_homecoming_browser_run_spec` and supplies
the synthetic verifier fixture that `test_verify_onboarding.py` builds on.
