# Continuous accepted traveler releases, 2026-10-02

Base: `25d932057bc91305a5c16c3291432a2351e7dfbf` on the clean dedicated
`agent/traveler-feel-20261002` worktree. Ownership is limited to
`traveler-art.js`, `traveler-equipment-art.js`, their focused tests, and this
note. These are original prototype pose choices, not founder character canon.

The concrete presentation defect was the blade's discontinuity between full
anticipation and recovery: its right hand jumped approximately 0.59 metres and
its authored axis turned approximately 129 degrees at that boundary. The rig
tests previously required distinct poses and connected bones, but did not test
the join. A fitting still also showed the upright ready blade crossing part of
the face from one view; that is a camera/silhouette observation, not evidence of
the temporal defect. The inspected existing still is
`D:/07-GAMES/Firstlight/artifacts/realm-outings-2026-10-02/veteran-delivery-rtx-03/fitted-held-close-third.png`
(SHA256 `1df9b12aa8ef7d5ac3e27ca4731efc1a619930a0356f68f5fc4ee058d800cd17`).

## Actual timing and integration boundary

At this base, `Combat.tick` in `src/combat.js:116` creates a real queued windup
for the last 0.12 seconds before an eligible autoattack release. It rechecks the
selected target, reach, stamina, visibility, weapon and authoritative cooldown.
Only an accepted production `adventureCommand('attack')` records its motion.
`Combat.pose` exposes that real anticipation, then 0.28 seconds of recovery.
The weapon cooldowns remain blade 0.52 seconds and bow 0.75 seconds.

Direct accepted F/Q strikes have no such windup. `WorldArt.traveler` falls back
to accepted slash/pulse or `lastShot` releases at `src/world.js:251`. Root owns
the minimal caller update: set `releaseOrigin:'ready'` on this accepted-release
fallback and pass `combat.releaseOrigin` into `TravelerArt.pose`. The optional
field normalizes to `ready` or `queued`, defaulting to `queued` for the existing
`Combat.pose` autoattack projection. It is copied into the drawn frame.

No caller, rule, timing, projectile, feedback, input, save, UI or movement file
is edited in this slice. An accepted shot is allowed to miss; a displayed cut
does not assert a successful hit. Cancelling a windup still returns to idle
through the existing caller, with no invented recovery cut or damage. This
slice does not add a separate cancellation animation epoch.

## Pure pose and attachment change

Queued blade recovery starts exactly at its real full windup endpoint. Direct
recovery starts exactly at ready. The blade then passes outside the right
shoulder, crosses forward, and settles; the key fractions 0, 0.19, 0.38 and 1
occupy the existing recovery interval (0, 53.2, 106.4 and 280 milliseconds).
Direction interpolation follows the spherical arc rather than normalizing a
near-opposed linear vector. The ready blade tilts modestly outward. A small
upper-body turn/lean connects the shoulder line, coat, collar, head and cloak to
the arms while preserving every hip, leg and foot anchor at the same gait/time.
The physical player position, yaw and camera root remain unchanged.

Bow recovery now joins the actual drawing palms and then relaxes the connected
string to ready. Direct shots start from ready and do not fabricate a preceding
draw. The rig supplies a continuous blade direction/lateral basis to equipment;
this avoids the old arbitrary reference switch at `abs(axis.z)==0.85` rolling a
flat blade mid-cut. The carried weapon and hip sheath retain their independent
frames. All canonical weapon families, colors, sockets, Oren temper, River
fittings and the finite violet/brass realm collar remain read-only projections.

Brace and swimming suppress the attack body turn and retain their own palm
poses. Reduced motion suppresses body turn/lean, blade axis sweep and secondary
bow recoil. Its blade hand cue stays below 0.12 metres; the essential connected
bow draw/release remains. Existing gait reduction, pause/scene reset, profile,
armor and lantern ownership are retained. The same world geometry serves both
cameras; no camera preference, shake, zoom or mode is introduced.

## Focused evidence and preserved failures

Executed CPU command:

```text
node --test tests/traveler_feel.test.cjs tests/traveler_rig.test.cjs tests/traveler_equipment.test.cjs tests/combat-feel.test.cjs
```

The final focused result is **51 tests passed, 0 failed, 0 skipped**. The eleven
new feel cases cover all-joint queued/direct joins, the submitted blade matrix
basis, conservative head-volume clearance across all four blade families,
fixed feet, visible body balance, reduced-motion limits, guard/swim overrides,
canonical grip/frame purity, unchanged carry/sheath, and a production
command-earned blade's actual windup/cadence. The existing equipment suite also
gathers and command-crafts its bow; exhaustive catalogue/fitting specimens are
explicitly synthetic. Existing combat tests retain actual blade/bow cadence and
stop/range/target/pause/death/missed-projectile behavior.

The new endpoint tests first failed on unchanged source (both selected tests
failed, exit 1): `blade leftElbow release boundary: 0.021889309708073745` and
`blade direct rightElbow: 0.32092159706808493`. The complete first red run also
reported missing new frame fields; that is separate from the numerical joins.
A first candidate passed 45/48 while exposing the intentionally obsolete
reduced-motion immediate-bow-snap assertion, an equipment test that had not
loaded the production rig, and a shoulder test that measured one endpoint
instead of the loaded shoulder line. Those tests were corrected to assert the
new explicit joins, load the actual pure owner, and measure the line's rotation.

The first endpoint-only blade arc crossed the conservative head bounds at
queued recovery fractions 0.15–0.19. The retained head test failed at
`trail_blade queued recover 0.15 blade crosses the head` (1 test, 1 failure,
exit 1). The outside-shoulder path repairs that real submitted-volume defect;
the four-family test now samples 3,232 poses without an overlap. A labelled
in-memory negative control reinstating only the old switched equipment basis
fails the submitted-basis test; the disk sources are never altered by that
control. These negative results must not be reported as ordinary suite passes.

CPU receipt under `D:/07-GAMES/Firstlight/artifacts/traveler-feel-2026-10-02/`:

- Body budget: 49 instances, unchanged.
- Maximum equipment with synthetic complete markers: 30 instances, below 40;
  no new geometry kind, batch, asset, texture, scene support or obstacle.
- Queued right-hand boundary error: approximately `1.39e-17` metres;
  direct-ready boundary error: zero.
- Maximum right-hand step at 84 samples of the 0.28-second recovery:
  approximately 0.0331 metres.
- Minimum consecutive submitted blade-basis dot product: approximately 0.9848.
- Maximum reduced-motion blade hand cue: approximately 0.0927 metres.

These are source/CPU/submitted-transform checks. No build, browser, GPU, new
media, full suite, personal profile or save was used. Head checks use a
conservative box around the rendered round head; they do not prove screen-space
face visibility from every camera. Existing screenshots are prior source
epochs. The remaining acceptance belongs to Root: wire the exact optional
origin field; inspect real auto/direct blade and bow strikes in both cameras,
Brace, swimming, carry and reduced motion; preserve release/equip/scene epoch
regressions; and run current integration/full gates. Human comfort, aesthetics
and sustained performance are not established by this slice.
