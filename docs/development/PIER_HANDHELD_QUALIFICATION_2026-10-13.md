# Hand-held pier animation: exact qualification

Draft [PR75](https://github.com/EternitiesAi/eternities-firstlight/pull/75) is stacked
on PR74. Base92fff25f82ab2df6cd99e6a5693203df923a41d8; qualified runtime/test
head **8bc49eb4ab66071213f7e6242abea9bc2894447d**. Later delivery commits contain only docs/evidence.
Branch: gameplay/pier-handheld-animation-20261013. No main merge or deployment.

The traveler casts, holds and reels a borrowed rod through the articulated rig.
Solved hands own grip alignment. Display facing eases without changing physical
yaw; scene generations and identity changes end its transient ownership. Reduced
motion is static. Existing catch/release, tension and pause rules remain authoritative.
World9 / Adventure12: **no migration**; no new saved owner, reward, inventory,
XP, currency, socket, equipment, story or character-choice changes.

## Delivered source

- 1f1af16acb488ca14a0f56484a76e5c369f64fae: accepted fishing clocks, pose/hand
  attachment, actual traveler caller, focused tests and immutable old cloth fixture.
- 443be8be20a47e32ca91486726cb4b7c4a7a99e0: eased display facing and reachable initial targets.
- 289043429e2925e9ded26b3fd609ccaa909ba11d: same-room scene invalidation.
- 8bc49eb4ab66071213f7e6242abea9bc2894447d: upright acquisition fixes observed low onset sweep.

Runtime: src/pier-fishing.js, src/pier-fishing-art.js, src/traveler-art.js,
src/world.js and both generated HTML files. Tests: pier_handheld, pier_fishing,
traveler_cloth and tests/fixtures/traveler-art-pre-fishing.cjs. No new assets,
external library or licensed-content dependency.

## Actual verification

Run from the clean reused remote qualification checkout on D:

`python -B tools/verify.py --rule-workers 4 --output <ARC>/REMOTE_SOURCE03 --cpu-temp C:/Users/Dom/AppData/Local/Temp`

Complete Source03 passed **223 commands; Node 2,246 passed, 0 failed, 2 skipped; Python 490 tests run, 8 skipped, no failures**. It includes150 syntax
checks and159 Node rule files, both continuous ten-chapter variants (blade and
blade-to-bow), all five earned Briar continuations and original source deadlines.
No test threshold or acceptance guard was weakened. The source gate's original
commands/logs/hashes and fresh host admission are in the evidence bundle.

Native02, run by `python -B <ARC>/qualify_handheld02.py`, passed **87 checks**.
Fresh character, current command-earned starter blade and Chapter IV bow use the
visible production import owner; no planted inventory, position or quest facts.
It checks accepted casting/reeling/easing, hold buttons, menu/photo/real pause,
explicit catch/release and cancel, both cameras, exact active world and inactive
character slots across one whole-browser restart. All pages used a random owned
loopback origin and isolated D profile. Browser errors/external requests: zero.
Owned browser, driver and server all closed. Fresh admission for both launches:
8671644 KiB, 9088472 KiB; threshold6291456KiB.

Actual submitted geometry: 99 samples; max hand-attachment
error3.55315e-15m; minimum rod-to-head-centre clearance
after rod radius0.421585m, exceeding the
conservative0.19m head sphere. Ordinary crank geometry travels in both views.
These sampled assertions do not prove all possible occlusion or human naturalness.

The cold-start ordinary-RAF recording uses actual UI only, without explicit
test-render/accelerated ticks: **48.80s / 3,665,860 bytes / 1220 decoded frames**. Full decode passed; SHA256
`2b1871aaf4ba89eca2f1c6f94c439bd98ed7630b4bd022d583e5031a965ce60b`. Initial three setup cases remain labelled accelerated.
Read VIDEO_OBSERVATION_FINAL.json for the separate frame review and its limits.
The adventure sequence visibly clears the former Briar sweep. Diorama's early
cast is less legible behind the small avatar, lantern and labels; later line
extension/float is visible. Selected stills do not prove continuous clearance,
exact phase timing or smoothness. Lantern projection overlap remains a limit.

Generated index.html and FIRSTLIGHT_VALLEY.html are byte-identical:3,408,067B,
SHA256 `31a406704aee2438bcb022de565b7b6a5090770fad6ae2a266819c185df9a6a5`.
Final delivery remote readback reuses the existing clean qualification checkout,
checks the exact remote head, builds twice and validates retained evidence blobs.
It is explicitly a fresh fetch/readback, **not a new clone**. No extra full game
copy was made, respecting the current storage policy. Its final receipt is local
ARC/REMOTE_READBACK01.json because it identifies the final delivery commit itself.

## Preserved failures and review

RED01 contains expected preimplementation failures. FOCUSED02's one floating-point
comparison failure is preserved; only tolerance changed to1e-12, and FOCUSED03
passed78 checks. Final upright-focused suite passed10. Source01/02 and Native01
are historical intermediate-head results, not substituted for final Source03/Native02.
Native01 passed84 automated checks but actual03.20s footage showed a low rod across
Briar's silhouette. Upright1.42rad acquisition replaces the low initial angle;
the before frame, original logs and final both-view recapture remain.

Two independent read-only Sol6.1 xhigh reviewers inspected source/controller and
visual evidence. Their scope, findings and corrections are in REVIEW_NOTES.md;
they did not execute tests or certify the game. Parent implemented/executed.

Hosted [run38459480155](https://github.com/EternitiesAi/eternities-firstlight/actions/runs/38459480155)
shows failed job statuses, but jobs have no executed steps: GitHub reports
"The job was not started because your account is locked due to a billing issue."
Representative source/browser annotations are preserved in HOSTED_RUN01.json.
**Hosted verification is unavailable**, not passed and not a demonstrated code
test failure. Dom owns account resolution; no billing action was attempted.

## Remaining gates and use

Current full `--browser` is still open: road-account admission has historical
SOURCE_EXPECTATIONS04 pins. Review a new explicit expectation epoch separately;
never weaken old guards. Targeted native success is not that broad gate. Four
current Briar variants remain CPU-only at the prior camera milestone. No new RTX
measurement, human enjoyment/comfort approval or AAA/draft-completion claim.
Fishing audio and a retained catch/profession economy are outside this milestone.

Launch the integrated PLAY_FIRSTLIGHT_WINDOWS.cmd with the player's usual origin
and browser. At the lantern pier: E, Cast a line, explicit Look along the line,
hook, reel/ease and Release silverfin. V switches cameras. Follow the pending
[fresh/returning human route](../playtests/PIER_HANDHELD_2026-10-13.md).
Next product arc is the three familiar village residents, not another realm.

Evidence: [bounded manifest](../evidence/pier-handheld-2026-10-13/qualification-8bc49eb/MANIFEST.json).
ROOT/STATION reused on D; no VM, Claude work, personal saves, unrelated processes,
paid provider, cleanup or blocked deletion retry. Goal active; heartbeat paused.
