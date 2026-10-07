# Independent review of the native approach repair

The candidate fixes the reproduced concave-corner steering defect in the intended two-observed-RAF controller. Its source changes are confined to the declared approach helper and waypoint rule. The four actual-Core CPU cases and all 27 installed boundary regressions pass. A prolonged-input stress case still oscillates and times out: eight maximum-size Core movement frames per hold. This limitation is retained below. These results support the parent-owned repaired native experiment; they do not qualify native death, clearance, persistence, or the complete boundary gate.

Reviewed ROOT was clean `668c501acdac688bd4efc5906025093721b7fbc1`. Candidate `../native-approach-repair01/earth_wild_signs_boundaries_browser.py` is 37,528 bytes, SHA256 `683fcb6bf3775312789101619e4fe7359a53c0af014547b59688e0f49f6dd0ab`. ROOT, STATION, the candidate, earlier stages, and personal saves were read-only throughout. No browser or GPU was started, and no installed source, generated HTML, resource, geometry, enemy, navigation, save, state, proof, or reward authority was changed by this review.

## Cause and source scope

The retained actual native Boundary02 report is failed, at source668, with the old driver SHA256 `14bc628fc4e8ec0d45dcf3e316530463dcbabc990ef645d31cf3984a6537fc91`. The first case has 1,563 intermediate checks; the second has 6,662 before `walk_keys` reaches its 240-second timeout. Both contexts and the server are recorded closed; no browser error or external request is recorded. Death/clearance and the later capacity case are not established by that failed epoch. `EVIDENCE_RECEIPT.json` binds the actual report and its bounded extract.

Actual `Core.pathfind` returns `(-19.2,-18)` then `(-29,-20)` from `(-15,-46)`. Both complete original segments pass actual `World.segment` at radius0.31. The original driver drops the first waypoint merely for being within1.05m. Its next direction then points across a concave ground corner. Independently executing the exact extracted original method against actual `Core.manual` reaches an immobilized position `(-19.7533275563,-18.9000057770)`, 9.31187084m from the goal. From that point the direct segment to the target is false, while the segment back to the retained waypoint is true. This exact coordinate is CPU evidence, not a recorded native coordinate; it differs slightly from the parent's earlier independently measured CPU endpoint and does not contradict the native report, which did not retain a final approach coordinate.

The new waypoint pop requires the actual full-body segment from the live player to the next waypoint to be supported. When it is not, the original waypoint stays and the new helper continues steering toward it down to0.15m. The helper keeps the original eight key choices and inverse camera basis. The final target success distance remains1.1m, and the original240-second cap and remaining-budget propagation remain. The shared consignment helper and its1.05m following stop are untouched.

`SOURCE_AUDIT.log` verifies exact raw-byte reversal: remove the one import and one helper, reverse the single waypoint-loop patch and single helper-call substitution, and the result equals the installed old driver bytes. This rules out any other driver change, including weakening the primary fresh-cohort validator, exact checkpoint admission, death/claim/refusal assertions, proof expiry, or storage failure restoration. The primary suite and real base, Core, and World hashes are bound in `PROBE_RECEIPT.json`. The new evaluator calls actual `World.segment` only; it does not issue movement, witnesses, damage, owner records, or rewards.

## Independent CPU results and retained negatives

| Check | Result | Receipt |
| --- | --- | --- |
| Exact author's current four tests against old installed driver | 4 expected simulated240-second errors | `ORIGINAL_RED.log` |
| Same four tests against the candidate | 4 pass, no skips | `CANDIDATE_FOUR.log` |
| All original installed boundary regressions with staged candidate import | 27 pass, no skips | `ORIGINAL27.log` |
| Own hold grid:2/4/8 frames; dt1/60,0.05,0.1; yawπ/2,0.7,0 | 24 pass, 3 retained timeouts | `PROBE.log`, `PROBE_RECEIPT.json` |
| Own instrumented maximum-dt2/6/8-frame grid | 6 pass; all three8-frame cases timeout | `DETAIL.log`, `DETAIL_RECEIPT.json` |
| Bad player/target/yaw metadata, including booleans, missing/null/string fields, NaN/infinity, non-mappings and huge integer | 18 refuse before returning keys | `PROBE_RECEIPT.json`, `EVIDENCE_RECEIPT.json` |
| Far-target key basis and0.15m precision stop | Same original keys for five finite yaw angles; precision stop behaves as declared | `PROBE_RECEIPT.json` |
| Exact source reversal, actual geometry, close readback | Pass; candidate unchanged; ROOT clean668 | `SOURCE_AUDIT.log`, `EVIDENCE_RECEIPT.json` |

The source method is extracted by AST unchanged, not replaced with a no-op or an alternate controller. Actual Core/path/manual and World/segment run in a Node child. Browser diagnostics, keyboard delivery, and monotonic time are explicitly labelled CPU IPC surfaces. The controller sees the real simulated position and actual support checks. `Core.tick`/combat and real browser frame scheduling are not part of these CPU fixtures. There is no claim that fixture convergence under35 simulated seconds measures native performance.

The eight-frame stress case repeats positions on either side of the retained corner, never entering the1.05m pop radius. At yawπ/2 or0 it alternates `(-17.87058008,-17.52941992)` and `(-20.43058008,-17.52941992)`, ending8.91844850m from the goal; at yaw0.7 it alternates `(-19.14153269,-18.84409444)` and `(-19.35988636,-16.29342361)`, ending10.32814115m away. The unchanged simulated240-second deadline refuses these attempts. All tested two/four/six maximum-dt holds converge, as do eight-frame holds at dt1/60 and0.05.

Actual `hold_native_keys_for_frames` verifies exactly two bounded ordinary RAF callbacks and releases keys in `finally`. That observation counts callbacks inside its evaluator, not every movement frame while key-down/evaluator/key-up IPC is in flight. The eight-frame stress therefore describes a remaining timing sensitivity; it is not proof that ordinary native input actually produces those prolonged holds. Native timing and complete hostile approach must be measured by the next parent-owned browser epoch. If that epoch exposes prolonged holds or renewed corner oscillation, the controller needs another bounded repair rather than a longer timeout or relaxed support checks.

Malformed finite fields consistently raise `ValueError`; non-mapping arguments raise `AttributeError`, and an excessively large integer raises `OverflowError`. All tested forms fail before keys are returned. The helper does not promise one uniform diagnostic for every malformed object. It receives actual current diagnostic/path fields in its real caller; this review found no admission or gameplay-authority bypass through those failures.

## Reproduction and boundary

Use process-local `PYTHONUTF8=1`, `PYTHONDONTWRITEBYTECODE=1`, `TEMP`/`TMP`=`D:/07-GAMES/Firstlight/cache/browser-temp`, and `FIRSTLIGHT_ROOT` pointing to ROOT. Author tests select the candidate with `WILD_BOUNDARY_DRIVER`; original regressions select it with `FIRSTLIGHT_WILD_BOUNDARY_DRIVER`. These are distinct environment variables. Invoke Python with `-B` so no installed bytecode is written.

`review_probe.py` reproduces the independent grid and source reversal; its exit1 deliberately reports the retained three stress failures. `detail_probe.py` records their actual CPU positions. `evidence_readback.py` reproduces the original method's blockage and binds the actual native negative. `SOURCE_AUDIT.log` was rerun after the audit read was tightened to compare raw decoded bytes without newline normalization; unchanged movement cases were not rerun solely for that audit change.

This is an independent source/CPU review with a concrete residual timing limit. It is not blanket approval, integration, deployment, native qualification, human feel acceptance, or a release. Parent owns installing any repair and running the new full native gate. All earlier negative epochs and sealed stages remain preserved.
