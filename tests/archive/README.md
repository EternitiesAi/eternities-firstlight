# archived source-epoch tests

these three files pin the exact bytes of reviewed source files and historical git heads from the october road-account
reviews (`tools/SOURCE_EXPECTATIONS04-08.json`). any edit to the pinned modules, and any checkout that is not that
frozen state, fails them; on the 2026-11-13 baseline (main b8c3a6f plus docs) they produced 1 failure and 23 errors
before a single 1.0 change, and stopped the verifier before its journeys ran.

for 1.0 the lead took them out of the default gate (lead decision, docs/1.0). they test evidence provenance, not game
behaviour: save safety, migrations, transactions and the journeys stay in the gate. run them by hand against an old
epoch with `python -m unittest discover -s tests/archive -p "test_*.py"`.
