# Final local verification: frozen 8ad runtime

`python tools/verify.py --browser` completed with exit 0 on Windows against the exact checked-in and regenerated HTML: 2,424,144 bytes, SHA256 `8ad7e3f020eb93b79b2d812e51a86248780c54b28593face9a115412f7e7b5bf`. Both HTML outputs remained identical; the verifier refuses stale outputs. The observed runtime commit was `329caa5aea6d90bdafc639e7535ad3699f2840a6`, with delivery documentation and the exercised recording tool still pending their separate commit.

| Actual result | Count |
| --- | ---: |
| Source syntax modules passed | 72 |
| Node rule tests passed / failed / skipped | 856 / 0 / 0 |
| Python cases passed / skipped / failed | 53 / 1 / 0 |
| Command-earned journeys passed | 34 |
| Browser suites passed | 25 |
| Named browser assertions passed | 2,458 |
| Final gate failures | 0 |
| Original command logs | 134 |

The one Python skip is the existing Windows symlink helper case. Read [the full local receipt](LOCAL_VERIFICATION.json), [the complete verifier output](local-gate-logs/COMPLETE.log), [rule output](local-gate-logs/rules.log), and [Python output](local-gate-logs/python.log). Nonempty command logs are portable with LF newlines; original log hashes include the original line endings. Empty successful syntax logs remain inventoried in the JSON receipt.

The 25 current suites include the earlier campaign, companion, character/class, equipment, gathering, building, notes/music, map, camera, cutaway, reflection and native-origin coverage, plus three realm-trail suites. The new suites report 95 southern, 259 northern and 38 comparator assertions in this default full invocation. Earlier focused invocations retain their own counts and settings.

The 34 journeys use actual production commands with labelled fixtures and accelerated/in-memory rules where declared. Native-origin browser tests use isolated storage and whole-browser restarts. Neither is Dom's personal save or a human playtest. Normal-time RTX footage and 11 short cadence samples are separately recorded in MEDIA.json and the seven capture reports; the geometry review is explicitly synthetic CPU evidence.

The review PR identifies the exact later publication head, fresh remote clone, commands and resulting counts. This local receipt alone is not remote reproduction or hosted Linux verification. Hosted CI and its actual status must be reported separately; billing changes, main merge and public deployment are outside the task. Prior failed attempts and repaired defects remain in FAILED_ATTEMPTS.json and the attributed review notes.
