# Building-edge camera readability: qualified source and targeted native checks

Approaching the shared house used to pull the third-person eye within 1.21m of
the focus, and down to its inherited 0.45m fallback at a supported wall edge.
The player filled the view. The camera now seeks a nearby clear orbit, retains
that side through small movements, and restores preferred framing in clear space.
The final native doorway and unframed Briar arrival images show both the traveler
and, on the outing, the fox. Human comfort of the automatic turn is still unknown.

## Exact source

- PR74: `gameplay/building-camera-clearance-20261013`, stacked on PR73.
- Base: `cf636d211b765aaa59767099d22616fd1faef714`.
- Qualified source/test head: `1d60260f0bc950b9f0e064555ec750ff38324fe3`.
- Runtime implementation: `2e90c69eff69093fe0be6ad6127d4b3a8f1b12f0`.
- Diagnostic heading and native-controller alignment: `661e4bdeba2c7754f2af80e11abaa53bfd3e8310`.
- Exact-helper host repairs: `11e40c065eadd312a42fb52e04098ba193c956ac`
  and `1a3668745c7ca0390a5c1bce53df92aedea7e129`.
- Explicit reviewed source-pin fixture repair: `1d60260f0bc950b9f0e064555ec750ff38324fe3`.
- Both generated HTML outputs: **3,403,654 bytes**, SHA-256
  `794fdecde7b750a9d0da5e5d2efea80a1872a4ae4ca63f942f126af2c3faca9c`.

Later delivery commits change only evidence and continuity. The complete source
and native gates belong to the exact qualified head above; final documentation
head readback is separately recorded rather than relabelling earlier tests.

Engine uses the existing padded solid sweep, including opted-in dynamic walls.
App owns transient actualYaw, input conversion and interpolation. Every eased
angle is swept; an obstructed arc between clear endpoints takes the clear endpoint
immediately. Tour exit synchronizes displayed heading. WASD, swimming and
directional dodge follow cameraHeading(). Deliberate drag starts there once,
then retains its own deltas. Diagnostic heading reports the same orientation;
diagnostic yaw still means the preferred orbit. Native movement callers now use
heading, with a fallback for older snapshots. They do not change gameplay state.

Automatic clearance does not save a new yaw, elevation, distance or FOV. Diorama
remains available. World9, Adventure12, old keys, nested owners, stored XP,
equipment, sockets, rewards, story choices, companion poses and Core collision
rules remain unchanged. **No save migration.** Reduced motion resolves immediately.
Fully enclosed focus retains the inherited 0.45m clamp; this does not prove
nonpenetration when the focus already lies inside a solid.

## Final executed results

| Evidence at qualified source | Actual result |
| --- | --- |
| Source06 complete verifier | 223 unique ordered commands passed; clean unchanged HEAD |
| Syntax / Node | 150 syntax stages; 158 rule files, 2,236 passed / 0 failed / 2 skipped |
| Python discovery | 490 tests, OK / 8 skipped |
| Command-earned journeys | Both continuous ten-chapter variants; five Briar continuations; all other configured source journeys/preflights passed |
| Camera02 | 57 checks passed; actual keyboard/orbit, displayed heading, both views, saved framing, house entry/exit, menus, targeting; no browser errors |
| Briar02 early-rescued-blade | 109 checks passed; 3 exact-byte whole-browser restarts; 4 owned driver starts/stops; server and browser closed |
| Cutaway | 6 synthetic framebuffer checks passed; no browser errors |
| Reflection | 8 synthetic framebuffer checks passed; no browser errors |

Source06 ran in reused clean STATION after a completed remote fetch. Command:

```text
python -B tools/verify.py --rule-workers 4 --output D:/07-GAMES/Firstlight/artifacts/building-camera-20261013/REMOTE_SOURCE06 --cpu-temp C:/Users/Dom/AppData/Local/Temp
```

The explicit CPU temporary directory is only for lightweight Python unit fixtures.
Earned worlds, browser profiles, logs and other work remain on D. The complete
verifier retains four Node workers and original Node180/Python600 deadlines.
Source admission observed 7,946,996 KiB free host RAM against 6,291,456 KiB.
Each whole browser received its own fresh host-only admission.

Generic Node skips require explicit fresh Earth/whole-draft cohorts; this invocation
later earned those cohorts and ran their configured checks. Python's eight skips
remain visible: explicit-cohort discovery exclusions, Windows symlink privilege,
and a missing D-drive miniature-fixture positive case. A source controller
preflight also explicitly skips native-input admission until native inputs exist.
These skips are not silently counted as executed native coverage.

Camera02 uses Chromium143.0.7499.4, software WebGL/Low, synthetic saves and real
keyboard/orbit input. Its command walking is accelerated. Briar02 imports the
current command-earned INPUT_WORLD through Characters; accepted production
movement/ticks are accelerated. No position edits, inventory grants, planted
defeats, quest facts or poses. Four other Briar cases remain **CPU-only**.

The Briar caller selects Adventure before the accepted rest route, waits for
actual readiness, then captures REST_UNFRAMED_ARRIVAL **before** cycling presets.
Actual submitted player head/boots and fox body/head envelopes remain inside
explicit canvas bounds. The arriving camera distance is7.489m, player envelope
193.56px of960px height. Parent visual inspection confirms both characters are
visible; projection alone would not establish this. Original both-view pose,
atomic action, old-owner preservation, cold-restart and repeat-refusal checks
remain. Four owned Playwright drivers start/stop once each; three exact closed
save-byte comparisons occur before startup can repair state. No personal save.

Native launchers are retained with their final source gate in the new evidence
bundle: RUN_CAMERA02.ps1, qualify_briar02.py and renderer_checks01.py. The last
redirects only repository/output path expressions of the installed pixel checks,
retaining all assertions and launch settings. Synthetic renderer checks do not
prove in-game image quality, human comfort or hardware performance.

## Preserved failures and repairs

| Attempt | Original outcome and later correction |
| --- | --- |
| Source01 at2e90c69 | Node2,234 passed / 2 failed / 2 skipped: graphics-recovery extraction omitted cameraHeading; exact helper added, focused22 passed |
| Source02 | Not launched: stale-checkout preflight refused, then3,231,260KiB memory admission refused; no threshold relaxation |
| Source03 at23ffc23 | Node2,236/0fail/2skip; Python488 tests FAILED7 failures/6 errors/8skip: old steering and extracted-host assumptions |
| Heading RED / GREEN | New corrected-heading cases initially failed2; actual consumers/hosts repaired;60 Python methods OK/2skip, including expanded64-case actual-Core movement matrix |
| Source04 at661e4bd | Node2,235/1fail/2skip: isolated diagnostics host omitted exact helper; host repair passed21 targeted tests |
| Source05 at1a36687 | Node2,236/0fail/2skip; Python489 FAILED6/8skip: historical source-identity fixture expectations |
| PIN_GREEN01 | Despite its filename, FAILED4/1error across15: selected synthetic helper view omitted the second reviewed pin |
| PIN_GREEN02 |16 passed after explicitly selecting both reviewed helper pins; all mutation/refusal guards retained |
| Source06 at1d60260 | Complete source gate passed; current native results listed above |

The frozen SOURCE_EXPECTATIONS04 is **unchanged**. ART unit tests use a fresh
in-memory copy with exactly the independently reviewed Consignment and WildSigns
helper pins; further changed bytes still fail. Startup tests normalize only the
exact reviewed heading-line substitution before the original historical AST and
prefix comparisons. No production admission or historical epoch is rewritten.
The full current --browser road-account stage still uses the historical pins:
review a new explicit epoch before executing that complete gate.

Earlier tour-exit/obstructed-arc REDs, floating-point equality failure, all source
failures and admission refusals remain. Earlier Camera01's56 checks used an older
HTML and never qualified the final transitions. The historical bundle remains
unchanged. Independent read-only reviews confirmed the runtime transition fixes,
heading consumer deltas, explicit fixture repair and Source06/Camera02 identities;
they are distinct from the parent's executed checks.

## Bounded retention and remaining acceptance

[Final evidence manifest](../evidence/building-camera-2026-10-13/qualification-1d60260/MANIFEST.json):
166 files /10,995,661 bytes, containing source failures, final source logs, current
earned Briar fixtures, native save-byte receipts, reports and selected screenshots.
[Historical evidence](../evidence/building-camera-2026-10-13/implementation-11e40c0/MANIFEST.json)
remains31 files /1,843,627 bytes. No browser profile, new full game copy or movie is
published. Original local artifacts remain on D. Reused remote readback checks
final Git blobs and two identical builds; it is **not a new clone**.

Full current --browser, four additional native Briar cases, human camera comfort,
ordinary-time pacing and real-GPU measurement remain open. Automatic turns can be
abrupt around an obstructing arc. No60-FPS, Unreal, AAA or complete-game claim.
The next product refinement is animation with the existing character/companion
rig, including the still-missing hand casting/reeling for the pier activity.

Launch PLAY_FIRSTLIGHT_WINDOWS.cmd or `python tools/play_local.py` in the current
integrated checkout. Keep the usual origin/profile for personal saves. Approach
the shared-house door without a curated orbit, move along the wall, drag the
camera, then walk into the open. Try Diorama and a remembered rest with Briar.
Pending human questions: Are both characters readable? Does the automatic turn
feel comfortable? Does movement follow the direction you expect?

VM, guests, Claude Code, personal profiles and unrelated workers remain excluded.
No main merge, deployment, deletion, paid work or heartbeat resume. Goal ACTIVE;
production remains unfinished. Preserve the blocked standalone-clone deletion.
