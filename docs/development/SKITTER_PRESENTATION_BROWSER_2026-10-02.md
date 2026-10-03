# Actual skitter-caller browser qualification — 2 October 2026

This worker owns only `tests/skitter_presentation_browser.py` and this note.
Root owns the presentation module, actual caller/test hook, build, browser-test
registration and integration. No shared product file or generated HTML was
edited or committed by this worker. Qualification used the clean separate clone
at `D:/07-GAMES/Firstlight/authoring/journey-qualification`.

## Qualified identity and result

Exact Root commit `50ce450a1ccb50c7ed9fd744bdd512f18005eb90`;
`index.html` is 2,480,103 bytes, SHA256
`2b249355a05472b76ead7855f68bcefd7c925c578a04a5012e2e68dc74f74074`.
The harness gates the requested commit and built HTML identity before launching
gameplay, verifies actual HTTP bytes, and records source and fixture hashes.

**119 named checks passed**, zero failed checks, execution errors, browser page
errors or application errors. Python compile and `git diff --check` passed.
Qualified harness SHA256:
`82b2914101c348451e807aaef9271d924b41ca16c3ee06e17a49f3e4e3b92f5f`.
`evidence10/skitter-presentation-browser/REPORT.json` and the retained
`REPORT_119_AT_50CE450.json` have SHA256
`d8ced602e5de93d89dd660481d169dfa43f13a20eb67bc2fccc3c0cfaf883987`.
The earlier complete 110-check positive receipt remains separately preserved as
`REPORT_BEFORE_REFUSED_PATH_50CE450.json`; no failed suite receipt was produced
during this bounded qualification. Artifacts are ignored local evidence, not
committed saves, screenshots or built HTML.

## Actual methods and earned inputs

Disposable native Chromium profiles, loopback HTTP, low graphics and software
SwiftShader. The fresh character earns Oren's initial kit through E, accepts the
riverbank outing through the visible dialog, walks the real path and enters via
E. No item, position, HP, companion bond, objective or defeat flag is planted.

Returning bow input is the checked-in earned checkpoint
`examples/REALM09_BOW_CHAPTER_II_COMPLETE_EARNED.json`, SHA256
`25e42a82b3b0e4302900fc3c68a19c76fbaa521ded901248e52b4a88cfb553bf`.
It already owns and equips a trail bow. Its existing bonded Briar is deliberately
set to Stay through the actual companion UI, keeping helper attacks out of the
bow refusal/projectile proof. Its earned loadout and completed Sunward Road
remain intact.

Long walks and fights use existing production path/command stepping to accelerate
gameplay. Target selection and one explicit arrow use the existing validated
Adventure command path; keyboard 1 supplies actual autoattack. The controlled
RAF scheduler captures only the real named application `frame`, leaving other
native browser callbacks alone. This real frame owns AI, timers, projectile
collision, damage and draw. Modal pause proof uses this frame rather than the
step helper, which intentionally temporarily resumes simulation time.

## What the caller proof establishes

- Actual draw submissions contain 26 parts for ordinary riverbank skitters and
  31 for Old Bristle, including five distinct spines. A final-output observer
  calls the original AdventureArt draw without changing its arguments/return
  and records submitted `m`, `p` and `s`, after any common caller transform.
  Independent trigonometric expectations compare carapace matrix columns,
  root translation, yaw, real actor coordinates and the named 1.32 factor.
  Every hook part also matches a real submitted part and finite positive
  geometry. There is no common second scale or yaw transform.
- All six feet stay above riverbank's canonical 1.58-metre support. Actual
  pursuit displacement supplies gait. Stationary AI return intent at the safe
  camp and an actually refused boulder destination invent no stride/blend.
  This is real stationary/refused intent evidence, not a synthesized blocked
  enemy pathfinding fixture.
- Ordinary windup reads its actual timer and .75-second duration. Old Bristle
  reads its 1.25-second windup and 1.8-second recovery. Crouch occurs only in
  authoritative windup, recovery follows its actual remaining fraction, and
  windup plants the six feet. The actual modal freezes actors, HP, timer,
  complete pose and submitted matrices.
- Real blade damage produces HP loss, a confirmed damage record, flash and
  directional recoil. An enemy's own strike invents no confirmed player-hit
  feedback. The actual reduced-motion setting removes bob and impact recoil,
  while retaining confirmed flash and the actual named windup crouch.
- Fresh real attacks defeat both ordinary skitters and Old Bristle. Every
  authoritative defeat removes that creature's hook model and all submitted
  parts; after all three, both lists are empty. No defeated flag was planted.
- In the returning bow outing, the real boulder blocks an otherwise in-range
  selected target. Actual attack refusal creates no arrow, target HP loss,
  hit timestamp or flash. A separate real bow release creates a travelling
  arrow without instant damage; production collision then reduces Old
  Bristle's HP and supplies confirmed hit feedback. No arbitrary moving-arrow
  miss fixture was introduced, and no such miss claim is made.
- V switches actual perspective/orthographic projection. Both render finite
  geometry. Repeated frozen drawing preserves the complete durable snapshot
  and actual enemy actors, including during confirmed feedback and refusal.
  Mutating the returned snapshot copy inside the browser changes no caller
  cache or combat state.

## Visible framebuffer and screenshots

One explicitly labelled **appearance-only ablation** removes skitter-part
descriptors from a single submitted draw, then restores them on the next draw.
It never changes authoritative simulation, navigation, targeting, HP or timers.
Synchronous reads of the real WebGL framebuffer at a frozen clock differ by
**2,703 pixels** on a 1,088 × 680 canvas; 739,840 pixels are nonblack, GL error is
zero, and `Realm.export()` is byte-identical across the comparison. This proves
a positive visible contribution from the actual submitted rigs collectively,
not visibility or human legibility of each part from every viewpoint.

`actual-blade-impact.png`, `actual-skitter-diorama.png`,
`actual-old-bristle-warning.png` and `actual-bow-impact.png` were inspected. They
show the ordinary creature, named larger body/spines, timed warning and confirmed
impact on the actual scene. Diorama's creatures are smaller and some labels
overlap nearby world objects; this is not a human accessibility/legibility pass.

Run from the worker checkout with the existing verified browser environment:

```powershell
$env:FIRSTLIGHT_TEST_ROOT='D:/07-GAMES/Firstlight/authoring/journey-qualification'
$env:FIRSTLIGHT_EXPECT_HEAD='50ce450a1ccb50c7ed9fd744bdd512f18005eb90'
$env:FIRSTLIGHT_EXPECT_HTML_SHA='2b249355a05472b76ead7855f68bcefd7c925c578a04a5012e2e68dc74f74074'
& 'C:/dev/firstlight-artifacts/bootstrap-2026-09-12/browser-env/Scripts/python.exe' tests/skitter_presentation_browser.py
```

This qualifies a bounded actual caller on the riverbank and earned blade/bow
paths. It does not certify every realm, other enemy families, full campaigns,
controller/device coverage, hardware GPU performance, human combat feel,
accessibility, deployment or production readiness. No full/GPU suite, personal
save, shared preview, protected sanctuary, main or deployment was touched.
