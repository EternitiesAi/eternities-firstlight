# Briar actual-caller browser qualification — 2 October 2026

This worker owns only `tests/companion_presentation_browser.py` and this note.
Root owns the presentation module, artwork and label callers, the test snapshot,
build and integration. No product or shared runtime file was edited by this worker.
The test runs against the clean, separate local clone at
`D:/07-GAMES/Firstlight/authoring/journey-qualification`.

## Source and fixture identity

The strengthened qualification target is Root commit
`8b5ee8ad6c1da8229c56e2d89cc169683007ae43`, with generated `index.html`
SHA256 `897c9da85150f28a75592164956fccf9fd2b5eab0bb37029f115748fe7e60676`
(2,471,207 bytes). The test gates requested commit and HTML identity before using
the app, verifies the HTTP response against that built artifact, and records the
actual source, harness and fixture hashes in its report.

`examples/CHAPTER_COMPLETED_EARNED.json`, SHA256
`27cb70f57c3584f7de69f667544c8215c6fbc5f7f3d45d7fb7bc241f1cabce49`, is a
historical **Chapter I complete** checkpoint: its legitimate reward is the Warden
Stone and Briar is already bonded in Follow mode. This is not Chapter IV evidence.
`examples/CHAPTER_START_EARNED.json`, SHA256
`22937e2c17d2e5ea76c674c260365d6dc8256ad83aa20bfe16aa1ae9bdd5b46e`, supplies
the separate earned initial kit, repaired crossing and pickaxe, with Briar still
unbonded. Both fixtures enter through native local storage and actual application
loading/validation. No positions, bond, health, inventory, objectives or quest
outcomes are added to pretend that gameplay occurred.

## Scope and method

One disposable native Chromium profile per earned checkpoint, loopback HTTP,
headless SwiftShader and low graphics. A controlled requestAnimationFrame
scheduler retains and calls the **real application frame**, using actual keyboard
events; it changes scheduling, not movement or authority. Long routes use the
existing production pathfinder and accelerated simulation stepping. Pause proof
uses the real frame, because the existing step helper temporarily resumes time.
There are no synthetic height/reset or bond fixtures in this suite.

The suite observes `Realm.test.companion()` from the actual emitted draw and tests
its defensive snapshot copy inside the browser. A test-only read observer wraps
the original `RealmAdventureArt.draw`, calls it with unchanged arguments, retains
its original output and return value, and copies emitted item descriptors. This
separately proves the injured warm octa marker, which is intentionally outside
the public rig-parts snapshot. It cannot move or grant anything.

Coverage includes the Hearthwater raised quarry road, raised Cosmos road,
Coastward channel bridge, Atlantis dry arrival quay, actual scene ownership,
Follow/Stay, accepted displacement and articulated gait, settled/refused-path
intent, real modal pause, V projection exchange, actual reduced-motion setting,
native create/switch/reload, home checkpoint and retained earned state. Rig paw
bottoms and roots are compared to the canonical physical support dispatcher.
DOM labels are compared to a separately projected physical base plus 1.45 metres.
The original economic/progression records and prior receipts remain intact;
only the real, deliberately executed companion-mode controls add their exact
production receipt terms.

## Preserved negative evidence

All receipts and screenshots live in the qualification clone under
`evidence10/companion-presentation-browser/` and are ignored artifacts, not
committed saves or built HTML.

- `FAILURE_01_EXPECTED_MODE_RECEIPTS.json` and `.png`: the first run at
  `4d509c8022479e03f0faad94f92802120f93192e` reached 83 passing checks and then
  failed my overly broad assertion that no receipt could be added. Real Follow
  and Stay controls intentionally add companion-mode receipts. The corrected
  assertion retains every earlier receipt and permits only the exact observed
  real control receipts, while separately preserving costs, items and quests.
- `FAILURE_02_LABEL_HEIGHT_4D509C8.json` and `.png`: a true product failure at
  the same source epoch, report SHA256
  `f8a093f460d850b68e128ba0e718b1348ea78c24da89a8984babbd392ffeddd9`.
  Briar's physical support was 2.024141583 metres, at x12.425562770,
  z−24.959735451. The expected supported label projected to
  (660.2146003, 439.6750359); actual DOM (659.837, 483.905) matched the old 1.58
  metre anchor. The label was **44.23 pixels too low**. Root changed only this
  label to use the same pure support dispatcher as the actual rig at `8b5ee8a`.
  The original failure is retained and the same assertion passes in the new run.
- `FAILURE_03_NATIVE_WAIT_RAF_8B5EE8A.json`: 94 named checks passed at `8b5ee8a`
  before Playwright's default RAF-based native-create wait timed out under the
  harness's original generic RAF interception. The scheduler now captures only
  the named production `frame` callback, leaves all other native RAF consumers
  alone, and uses explicit timed polling for asynchronous character operations.
  This is harness failure evidence, not a reproduced game defect. The file with
  `STALE_PICTURE` in its name is explicitly an older screenshot copy, not visual
  evidence of the wait timeout. Future exception capture occurs before closing
  the browser context, so teardown cannot mask the actual failing state.

## Verification result

The complete strengthened focused run at exact `8b5ee8a` **passed 119 named
checks**, with zero failed checks, execution errors, browser page errors or
application errors. `REPORT.json` and the retained
`REPORT_119_AT_8B5EE8A.json` have SHA256
`c4794f32b8a2b81e2ab94dffde0b590b28e06ac061215a786594b9596d59020e`.
The qualified harness SHA256 is
`8e333f68a24a34249bca863e0739893ad54e74abd141c7750c76201ed41e96fa`.
Python compile and `git diff --check` passed. The qualification checkout remained
clean; the worker's two old generated HTML changes were not staged or modified.

The corrected quarry label is (660.215, 439.675), matching the independently
projected supported anchor (660.2146003, 439.6750359). Native creation proves no
inherited bond, native switching and reload retain the legitimate bonded Stay
policy and earned inventory/progression, and their fresh runtime samples start
at phase and blend zero. Real cave entry emits 30 unbonded parts plus exactly one
separate marker at (−8, 3.08, 2), size (.17, .30, .17), color `0xf1d3a3`.

Quarry, Cosmos perspective and orthographic, Coastward, Atlantis and injured-mine
screenshots were inspected. `hearthwater-briar.png` shows the corrected supported
label; `cosmos-briar-first-view.png` is perspective and
`cosmos-briar-second-view.png` is orthographic. `injured-mine-marker.png` shows
the actual starting cave view: the fox/cue lies near the upper HUD in that default
entrance framing. Its actual emission and identity are verified; this screenshot
does not certify human cue legibility or accessibility from every camera.

Run from the worker checkout with the existing verified browser environment:

```powershell
$env:FIRSTLIGHT_TEST_ROOT='D:/07-GAMES/Firstlight/authoring/journey-qualification'
$env:FIRSTLIGHT_EXPECT_HEAD='8b5ee8ad6c1da8229c56e2d89cc169683007ae43'
$env:FIRSTLIGHT_EXPECT_HTML_SHA='897c9da85150f28a75592164956fccf9fd2b5eab0bb37029f115748fe7e60676'
& 'C:/dev/firstlight-artifacts/bootstrap-2026-09-12/browser-env/Scripts/python.exe' tests/companion_presentation_browser.py
```

This is a bounded caller/state/visual software-browser check. It is not hardware
GPU measurement, device or controller coverage, human feel/accessibility
acceptance, end-to-end completion of later chapters, a full suite, deployment or
production certification. Root retains the integration and final qualification
gates. Personal saves, shared preview, protected sanctuary, main and deployment
were not touched.
