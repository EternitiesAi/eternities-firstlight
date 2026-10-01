# Gathering integrated on a later gameplay branch

On `gameplay/living-world-art-direction`, the normal entrypoints now include native gathering and adventure10. Read [current results](docs/development/LIVING_WORLD_RESULTS_2026-09-30.md) and CURRENT_STATE for the applicable verification. The old staged builder is historical and must not be activated as the launcher or used to overwrite this newer checkout.

The following describes PR20 before this integration, retained as provenance:

# A Table After the Rain — development candidate

The normal `index.html`, `FIRSTLIGHT_VALLEY.html`, `build.py`, launcher and trusted save origin remain the reviewed PR19 build. This branch's gathering extension is **not yet a whole-game-qualified release**.

Read [component results and integration gate](docs/development/GATHERING_COMPONENT_RESULTS_2026-09-24.md). The continuation repaired contextual priority, stale arrangement confirmations and asynchronous audio cancellation. Its 48 Node component tests and 31 browser-component assertions passed locally; these do not replace the existing full-game suites.

To work on the isolated candidate in a full checkout, first inspect `tools/build_table_candidate.py`. It reconstructs and hashes the exact reviewed base, then writes a separate output. Do not replace the trusted entrypoints, import a candidate schema10 save into an older client, reset personal data or reuse an archive as a newer gameplay checkout.

The next required milestone is the real app integration and persistence pass, followed by both-camera rendered play. The offline music listening sheet distributed with the change package is only a listening study. There was no merge, deployment or live Luna connection.
