# Building-edge camera readability

Approaching the shared house used to pull the third-person eye within 1.21m of
the focus, and down to its 0.45m fallback near a supported wall edge. The player
filled the view. The camera now seeks a nearby clear orbit when the requested
ray becomes unreadable, retains that side through small movements, and restores
the requested direction in clear space. This is a transient presentation change.

## Source and ownership

- Base: PR73, `cf636d211b765aaa59767099d22616fd1faef714`,
  `gameplay/companion-presence-20261013`.
- Review branch: `gameplay/building-camera-clearance-20261013`, stacked on PR73.
- Runtime implementation: `2e90c69eff69093fe0be6ad6127d4b3a8f1b12f0`.
- Current test repair: `11e40c065eadd312a42fb52e04098ba193c956ac`.
- Both generated HTML outputs: 3,403,630 bytes, SHA-256
  `463c84437b91a347958169837cc1e0a7da331257f21a610b29b26bc589566da1`.

Engine uses the existing padded solid sweep, including opted-in dynamic walls.
App owns displayed yaw, input conversion and interpolation. Every eased angle
is swept again; an obstructed arc between clear endpoints takes the resolved
endpoint immediately. Tour exit synchronizes the displayed heading. WASD,
swimming and directional dodge follow that displayed orientation. Deliberate
drag begins there once, then retains its own deltas. Automatic correction does
not save a new preferred yaw, elevation, distance or FOV. Diorama remains available.

World9, Adventure12 and all existing nested owners/keys remain unchanged. No
save migration, XP change, reward, equipment alteration or companion pose change.
Core movement, combat and the original collision envelopes remain unchanged.
Reduced motion resolves immediately. Fully enclosed focus retains the inherited
0.45m clamp; no new claim of nonpenetration in that pathological case follows.

## Executed checks and open qualification

| Evidence | Actual result and scope |
| --- | --- |
| Final focused check at `11e40c0` | 53 passed, 0 failed, 0 skipped across six CPU suites |
| New camera regression | 11 tests using actual Engine, canonical house geometry and production App functions |
| Initial Camera01 native run | 56 passed checks, no browser errors, software WebGL / Low, Chromium 143.0.7499.4 |
| Complete Source01 at `2e90c69` | FAILED: 150 syntax checks passed; Node 2,234 passed, 2 failed, 2 skipped; later verifier stages not reached |
| Complete Source02 | NOT LAUNCHED: preflight refused stale checkout; corrected checkout then refused 3,231,260 KiB host RAM, below 6 GiB |
| Final complete source and native camera/Briar | Pending fresh resource admission; no passing current receipt yet |

Final focused command in the reused remote qualification checkout:

```text
node --test --test-concurrency=4 tests/camera-clearance.test.cjs tests/camera.test.cjs tests/camera-views.test.cjs tests/earth_fieldcraft_camera.test.cjs tests/earth_patrol_carrier_camera.test.cjs tests/graphics_context_recovery.test.cjs
```

Camera01 predates the final tour/arc fixes. Its HTML hash is
`c5fdbba9d3431c5408e4197fcfc79f36065cb7bfc41454dd93a5fe13ca784b89`,
3,403,227 bytes. Its doorway screenshot shows the complete player and house
instead of a face close-up. It checks actual keyboard/orbit input, saved view
profiles, both views, menus, entry/exit and target controls. It does **not** close
native qualification of the final runtime or the specific unframed Briar rest.

Source01's two failures came from an isolated graphics-recovery host loading
the actual frame function without its new `cameraHeading` helper. The repair
loads that exact production helper; original assertions are retained. All 11
graphics-recovery tests pass in the final focused check. This is a targeted
repair result, not a complete verifier pass. The initial failing receipt remains.

Independent source review identified and then confirmed the tour-exit and
intervening-arc fixes. That reviewer did not execute tests or inspect browser
pixels. RED reproductions for both defects and subsequent GREEN logs remain.
The earlier float-equality test failure, source preflight refusal, memory refusal
and all native/source failures retain their original outcomes.

## Resource boundary and remaining work

The [bounded byte manifest](../evidence/building-camera-2026-10-13/implementation-11e40c0/MANIFEST.json)
retains 31 evidence files / 1,843,627 bytes: original failures/refusals, focused
passes, the earlier native report with three screenshots, and prepared callers.
Source03 and the Briar wrapper are explicitly unexecuted, not qualification
receipts. Empty syntax logs are omitted; the original source console records
their successful commands. No browser profiles or duplicate game are published.

Read host free memory immediately before the full source verifier and each whole
browser launch; require 6,291,456 KiB. At the latest attempted complete gate only
3,231,260 KiB was available. No VM, guest, Claude Code, personal profile or unrelated
process was accessed or controlled. No timeout, assertion or threshold was reduced.
The final source retry has not run. No task-owned server/browser remains running.

Prepared local callers live in
`D:/07-GAMES/Firstlight/artifacts/building-camera-20261013`:

1. `RUN_REMOTE_SOURCE03.ps1 -SourceHead <exact clean fetched head>` runs the full
   source gate with four Node file workers and original Node180/Python600 limits.
   Each labelled controller is single-use, including admission refusals. Preserve
   its receipts and use a fresh explicit label for any later attempt.
2. From STATION, run its updated `tests/camera_browser.py` after fresh admission,
   setting `FIRSTLIGHT_CAMERA_OUTPUT` to the artifact folder's new `CAMERA02`
   directory. The default output is reusable, so do not accidentally overwrite
   it. Retain final unframed doorstep and interior images.
3. `qualify_briar01.py` requires the successful Source03 earned cohort and exact
   source receipt. It exercises one early-blade native outing, actual rest and
   cold restarts. It adds player/fox projection checks without injecting poses.
   Inspect actual pixels as well; a projected point does not prove visibility.
4. Complete the current full `python tools/verify.py --browser` gate when resources
   permit, including current cutaway/reflection coverage. Human comfort and real
   GPU performance remain separate, unmeasured gates.

The side correction can change heading abruptly around an obstructing arc.
Human comfort and repeated close-quarters movement need playtesting. This is a
browser-prototype camera improvement, not a complete game or AAA certification.
Character/companion animation remains the next product refinement after this
camera result is qualified. No new video or full-game copy was created this pass.

Launch the integrated checkout's `PLAY_FIRSTLIGHT_WINDOWS.cmd`, or run
`python tools/play_local.py`. Use the usual origin/profile to retain personal
saves. Approach the shared-house doorway in third person without setting up a
special orbit, move along its wall, deliberately orbit, then step into the open.
Try Diorama and return. With Briar, repeat the accepted doorstep rest. Ask whether
both characters stay readable and whether the automatic turn feels comfortable.
