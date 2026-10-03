# Bounded integration and measurement review — 2026-10-02

The assigned caller review found one reproducible measurement-integrity defect:
the old browser measurement tool accepted the app's map fallback after losing
its WebGL context. Root corrected the tool, and the same actual-tool negative
case now refuses cleanly; a separate four-frame WebGL case remains accepted.
No additional material gameplay defect was established within this review.
This is not release, hardware, performance, audio-output or human qualification.

## Source and ownership

Initial review: `59a4c4e48d22c29695f88ecfad5257e60d0bb21d`, compared with PR36
base `25d932057bc91305a5c16c3291432a2351e7dfbf`. Correction qualification:
`fc0c70d82f29bf34527b69590f9c8ab4897ccf43`. Both epochs have the same
2,499,700-byte `FIRSTLIGHT_VALLEY.html`, SHA-256
`79bdc75444aaa1bd881216be5d20178804d4bb9de30e5def18b6efcd00792d67`.

Read-only source scope: `src/adventure-art.js`, `src/world.js`,
`src/world-foundations-art.js`, `src/app.js`, `src/rpg-ui.js`,
`src/workshop-transactions.js`, `tools/canvas_film.py` and
`tools/measure_gpu_browser.py`. Actual adjacent callers/rules were read only to
check those contracts, including `tools/capture_realm_trails.py`.

The reviewer previously authored `workshop-transactions.js` and the journal
insertion in `rpg-ui.js`; those parts are **self-review**, not independent
verification. Root's command wiring, craft-handler changes, render callers and
measurement correction were reviewed separately. Earlier workshop/companion/
skitter browser receipts retain their original source epochs and counts; this
review does not recount them as fresh passes at either review epoch.

The exact-source local qualification clone was
`D:/07-GAMES/Firstlight/authoring/journey-qualification`. Only this new note was
committed in the worker checkout. No product or test files were edited; its
older dirty generated HTML remains untouched and uncommitted. Root owns the
actual tool correction, integration and full/hardware gates.

## Confirmed old failure and corrected result

At the initial epoch, renderer/mode provenance was gathered before scene setup.
The sampling loop then checked visibility, pause and scene, but did not require
continued WebGL rendering. The app's existing `webglcontextlost` handler hides
the canvas and provides its state-preserving map fallback. The scene remains
`valley` and the simulation remains unpaused, so the old sampling guards pass.

Reproduction used the actual committed measurement tool, fresh isolated native
browser storage, loopback requests only, software SwiftShader, low quality and
four frames. The labelled setup called the actual canvas's
`WEBGL_lose_context.loseContext()`, then awaited the fallback. This was an
explicit synthetic graphics fault, with no position, HP, inventory, defeat,
quest, bond or reward edits. No fixture was imported.

From the qualification clone:

```powershell
& 'C:/dev/firstlight-artifacts/bootstrap-2026-09-12/browser-env/Scripts/python.exe' tools/measure_gpu_browser.py --renderer software --quality low --frames 4 --scenes 'D:/07-GAMES/Firstlight/authoring/journey-qualification/evidence10/integration-review-20261002/context-loss-scenes.json' --output 'D:/07-GAMES/Firstlight/authoring/journey-qualification/evidence10/integration-review-20261002/CONTEXT_LOSS_REPORT.json'
```

The old tool returned exit 0 and `success: true`: initial mode `webgl2`,
initial renderer SwiftShader, but setup/before/after mode `map`. It counted five
visible/unpaused checks and four map-only RAF samples, with zero browser errors
or external requests. The screenshot was inspected and shows the actual map
fallback and hidden 3D canvas. This is a measurement blocker, not an assertion
that the app's fallback is defective. Hardware-requested mode was not run;
its final hardware assertion also depended only on initial renderer provenance.

Root's correction requires WebGL2 and the originally observed renderer on
every sampled frame, rejects diagnostics exceptions, bounds pending sampling,
and removes its owned RAF/listener when settling. It also records/checks the
measurement harness and launcher hashes. At exact `fc0c70d`, the identical
setup returned **exit 1**, `success: false`, zero accepted scenes and
`Page.evaluate: Error: Sampling lost the original WebGL renderer`. Full stderr
was retained; no pending promise or indefinite wait was observed.

A separate actual-tool positive run omitted `--scenes` and wrote
`WEBGL_POSITIVE_FC0C70D.json`. It returned **exit 0**, `success: true`, four
samples/five checks, before/after `webgl2`, unchanged SwiftShader and zero
browser errors or external requests. Its screenshot was inspected and shows
the actual rendered 3D valley. Raw intervals were approximately
`[1150, 1149.9, 533.3, 550]` ms. These poor software intervals are retained;
the tiny run proves the corrected acceptance path, not acceptable performance.

All immutable receipts below remain under
`D:/07-GAMES/Firstlight/authoring/journey-qualification/evidence10/integration-review-20261002/`:

| Artifact | SHA-256 |
| --- | --- |
| `context-loss-scenes.json` | `a08b3999e7ec18c3749ad862d1855ef3c812ecdfee200079247979f62621bd93` |
| `CONTEXT_LOSS_REPORT.json` — old false success | `54983cda37ffad77594677e7b9f2c4727f2f7c2c59c96cc7d4dc9e03eeae5ba3` |
| `CONTEXT_LOSS_REFUSED_FC0C70D.json` | `9e001d4a9cd54dc9d6cab58f7c0ce2e551fb37d7668f88715ef3e6d451e7126d` |
| `CONTEXT_LOSS_REFUSED_FC0C70D_STDOUT.txt` | `e0669e092d30f69f04a850a51820d2a1f65968e7de637d01f9d3d405d733e119` |
| `WEBGL_POSITIVE_FC0C70D.json` | `d72c5b3662f9bcda6aa604f2b9ddd6151fa2475dbca0babf5674618b0cbd5bbc` |
| `WEBGL_POSITIVE_FC0C70D-1.png` | `55084ae9651ff25861165464190674361b2546e1852cfdf3d2753f58fa7fac79` |

Old measurement harness SHA:
`1e7906d5c82d0ad0562e69e3844136cfffd0215baa911c427317c3ab5d17c7ba`.
Corrected harness SHA:
`bca273c2a0485bdf8f12feeb3527d69a3528cfd36ec18a3b85402911472e1d25`.
Launcher SHA, also present in the corrected reports:
`cb5b8227f4c5e99e89b5ec40a75a3cacc471bd60c287316501c4b2de6cfecaa5`.

## Caller conclusions and limits

- Companion samples are owned by the actual simulation plus companion identity
  and bond state. Scene/time/displacement guards reset motion appropriately;
  render snapshots clear when the actor is not drawn. Skitter samples use actual
  enemy identity, and each draw clears the frame list before excluding defeated
  actors. Replacement does not reuse another actor's gait in the reviewed code.
- Companion/skitter bases use the physical support dispatcher. Briar's label
  uses that same support plus 1.45. Work-giver roots use actual world height;
  Coastward bank geometry is presentation only and does not invent navigation
  ground. Paused samples retain motion phase/time while consuming coordinates;
  reduced motion suppresses optional motion/recoil without erasing combat cues.
- Skitter feedback comes from actual damage-owned `flash`, `hitAt` and
  `hitFrom`. Submitted skitter transforms avoid the old second common yaw/scale
  pass. Traveler releases are fenced by current simulation, scene, item and
  accepted equip/release receipts; the new `releaseOrigin: 'ready'` describes an
  accepted manual release and does not assert a hit.
- The synchronous workshop boundary runs explicit state-only commands on a
  candidate, validates canonical changes, calls the existing character saver
  before adoption, and retains live actors/paths/clocks. Refusal cannot adopt
  candidate costs, items or receipts. Root's actual callback uses the current
  simulation and `worldSave`; durable callers omit a second save. RPG crafting
  restores pause in `finally`, and the existing RPG run policy likewise restores
  deliberate dialog pause after its synchronous command. This module assessment
  is self-review; no new save-failure browser suite was run for this note.

No source-supported second material product suspicion justified a further
gameplay browser reproduction. This is bounded source evidence, not proof of
all scenes, devices, input feel, accessibility, persistence or save fault cases.

## Actual film path and source/timing claims

The actual capture caller requires explicit `--sound-video`, installs the film
hook before app startup, then clicks native `#sound` and waits for enabled,
running audio before recording. The app first connects its own master gain to
the destination during that opt-in. The film helper observes that connection
and adds one removable recording tap, rather than microphone access or an
external soundtrack. No consent mismatch was established for this caller.

Canvas video and app-master audio are combined in one browser MediaRecorder
stream. `elapsedMilliseconds` is page command wall time, including recorder
stop flushing; it is not a decoded WebM duration or proof of constant encoded
frame rate. Canvas footage omits HUD/menu UI, and the separate Playwright video
is silent. These distinctions match the current caller's wording. No new
recording, audio listening test or decoder inspection was performed here.

The old capture report fingerprinted its main script but omitted its imported
film/launcher helpers. The old measurement report omitted its own harness
fingerprint. These were source-lineage limits, not reproduced wrong-track or
wrong-byte failures. Root's correction adds helper/main-source fingerprints
and end-of-run checks. The actual corrected measurement report verified those
checks. Corrected capture fingerprint checks were reviewed in source only;
the hardware-only capture workflow was not executed by this worker.

Current film helper SHA:
`8690143aa65a9b50330ff97ed89dc705d1e7175cf482afbc4849af537d549c2a`.
Corrected capture caller SHA:
`ff49ecab7cb222f066e3e79facbb4c8e6f640e3ee5cd98a4743006af2dc88a4a`.
Start/end file checks detect ordinary drift; they are not filesystem locks or
a claim to freeze every imported byte against adversarial mid-run replacement.

No GPU/hardware benchmark, full suite, paid service, personal save, main merge,
deployment, shared-product/test edit, preview restart or extra worker occurred.
