# Traveller review evidence

Read [executed results](../../art/TRAVELER_BROWSER_RESULTS_2026-09-30.md) for
scope, methods, negative evidence and pending human acceptance.

- `BROWSER_REPORT.json`: final full-gate actual traveller checks. Synthetic
  framebuffer coverage is explicitly separate from accepted gameplay.
- `LOCAL_VERIFICATION.json`: actual full local gate, counts and completion.
- `PREVIEW_RECEIPT.json`: stable loopback response hash and launcher/listener
  identity after confirming the previous server was absent.
- `GPU_BEFORE.json` / `GPU_AFTER.json`: matched PR23/final-HTML RTX headless
  interval samples; `GPU_SCENES.json` gives the exact setup. Camera collision
  makes the workshop shot cropped; it is a cost comparison, not art acceptance.
- `TRAVELER_GAMEPLAY.mp4`: normal-time hardware-rendered, command-earned fresh
  bow checkpoint; walking, blade/bow practice and both native camera styles.
- `RECORDING_REPORT.json`, `GAMEPLAY_ACTIONS.json`, `BOW_CRAFTED_EARNED.json`
  and `EARNED_BOW_JOURNEY.log`: recorded method and legitimate source.
- `DIORAMA.png`, `BLADE_PRACTICE.png`, `BOW_PRACTICE.png`: actual footage
  frames at14/22/27 seconds; no generated concept image is substituted.
- `RECEIPT_REPRESENTATIONS.json`: original D bytes versus normalized review
  JSON; JSON values agree, media bytes agree.

Original logs, interrupted/failed variants, native WebM, full shader/GPU
receipts and the fresh remote clone stay under
`D:/07-GAMES/Firstlight/artifacts/traveler-art-2026-09-30`.
Exact final pushed-head clone and hosted results are recorded in the PR and
external delivery receipt, after this evidence commit. The source clone uses
shared installed development tools with isolated browser profiles.

Video is silent1280x720, H.264/yuv420p, 25 encoded fps, duration32.68 seconds.
Encoding and a full decode to null both exited0. This encoding rate is not
measured gameplay FPS. SHA256:
`9db7dbeb8bd8935cccde0a697465e11e2db7accf1e7e8203e952fc5fd9358919`.
Personal saves, profiles and data are absent from this evidence.
