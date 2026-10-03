# Six-legged skitter presentation, 2026-10-03

This bounded original art slice improves the existing ordinary skitter and named river-bristle variation. It preserves the six-legged identity, original body dimensions, +Z facing and named 1.32 scale. A connected carapace, forward head/muzzle, eyes, three jointed legs on each side and attached named spines improve physical readability. Accepted displacement drives a tripod gait; actual windup/recovery timers drive a bounded presentation pose. No attack, hit, damage, movement, reward, creature selection or encounter outcome is created by art.

It was authored on `agent/skitter-art-20261003`, based on `e4230170de49ba693c5f4fb4cb9035318ce2a8d9`, preserving the preceding companion and settlement work. It owns only [the new module](../../src/skitter-art.js), [its focused CPU tests](../../tests/skitter_art.test.cjs), and this note. Root owns AdventureArt callers, per-enemy transient sample identity, actual height/feedback dispatch, build registration, browser/GPU captures and full integration verification. No existing shared source or tests were edited.

## Attribution and boundaries

The base checkout's `src/adventure-art.js:26` supplies the existing skitter body size `.95 × .84 × 1.22`, six legs, warm forward head and lit eyes. Its common named branch at lines 31–35 scales river-bristle by 1.32 and adds five spines. The muted ordinary `0x7e8670`, named `0x866747`, warm head/legs, lit eyes and named spine color are retained. The joint layout and plated shell are original stylized art interpretations rather than a recovered anatomical taxonomy or a new creature type.

The recovered `C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/realms/earth-design-2026-09-14/EARTH_COMPLETE_DESIGN.md` describes Bankroot skitter as the existing riverbank lineage, asking to preserve rule identity while improving readable physical action at line 1273. Line 1274 keeps Old Bristle as the specific familiar starter encounter rather than a unique boss cloned everywhere. Line 1331 asks to retain gameplay bounds while aligning visual contact. This module does not rename, relocate, duplicate or change those encounters and does not make every ordinary skitter Old Bristle.

All existing kind/IDs, HP/damage, aggro/reach, attack/recovery timers, collision, pathfinding, XP/loot, confirmed-hit feedback, warning/target rings and controls remain outside this module. No health bar, warning ring, outcome particle or audio is emitted here. Current art/test evidence is not a canon promotion, independent runtime certification or human acceptance.

## Pure contract and actual caller mapping

`globalThis.RealmSkitterArt` and CommonJS export the same frozen `{motion, pose, parts, draw}` API. There is no dependency on another mutable rig. The module supplies its own pure transform and leg solve; focused tests inspect the production engine meshes/matrices without creating WebGL.

```js
const named = e.custom === 'river-bristle';
const sampled = RealmSkitterArt.motion(previousSample, {
  x: e.x, z: e.z, time: presentationTime,
  scene: sceneIdentity, paused, reducedMotion
});
const posed = RealmSkitterArt.pose({
  ...sampled, named,
  mode: ['pursue', 'return'].includes(e.mode) ? 'chase' : e.mode,
  timer: e.timer,
  windup: e.windup ?? .75,
  recoverDuration: e.recovery ?? 1.1
});
RealmSkitterArt.draw(out, {
  x: e.x, z: e.z, base: actualFloor, yaw: e.yaw, named,
  bodyColor: callerComputedBodyColor, flash: callerConfirmedFlash,
  recoil: callerConfirmedRecoilOffset // optional finite {x,z}; default zero
}, posed);
```

The exact base runtime `adventure.js:199–226` decrements `e.timer`, enters ordinary skitter windup with `e.windup ?? .75`, and uses `e.recovery ?? 1.1` after the real attempt. `starter.js:13` gives Old Bristle windup 1.25 and recovery 1.8. Actual runtime chase modes are `pursue` and `return`; the presentation contract uses `chase`. That caller mapping is required rather than assuming runtime already contains a `chase` mode.

`motion` returns fresh `{lastX,lastZ,lastTime,scene,time,phase,blend,moving,paused,reducedMotion}`. Actual displacement advances a 0.8-metre visual stride cycle; mode or requested walking intent alone cannot advance it. Stationary phase is held while blend settles to rest. Scene changes, bounded teleport/clock discontinuities and long sampling gaps reset the pose. Paused coordinates are consumed while phase, blend and drawable animation time freeze. Use the returned sample's time when posing. Store samples only in Root's transient presentation cache per actual simulation/enemy identity and clear them when that identity is replaced; do not serialize them into saves.

`pose` accepts only `idle`, `chase`, `windup` and `recover` as presentation modes; unknown modes fall back to idle. Only actual `windup` with a finite timer and positive supplied duration creates the crouch/tell. Its normalized progress is `1 - timer/windup`, clamped and eased. Windup plants all six legs; maximum body crouch is 0.09 metres. Actual recovery uses its remaining timer/duration to settle the head without a windup crouch, flash or success signal. The same recovery presentation applies to a miss. No countdown or attack is advanced by this module. Reduced motion retains leg gait and the meaningful timed pose while suppressing gait bob.

`parts` requires finite actual `{x,z,base,yaw}`, explicit `named:boolean`, and integer `bodyColor` in the RGB range. The supplied named pose must match. The caller's already computed body color owns confirmed-hit recoloring; `flash` is metadata, not an autonomous color/event timer. Optional recoil is only a supplied finite X/Z presentation offset. `draw` computes all records first and appends only to existing `out.box`, `out.round` and `out.octa` arrays. Invalid placement/pose/recoil refuses before any partial output.

**Integration must avoid duplicate transforms.** New parts already contain world matrices with yaw, named scale and optional confirmed recoil. Replace only the old `e.kind === 'skitter'` geometry path, and bypass the old common named-spine append and scale/yaw/recoil transforms for these new parts. Keep those common transforms for other enemy paths. Keep all existing warning/target rings, health bars and real combat feedback callers. Drawing old and new geometry or applying the old 1.32 scale again would be incorrect.

## Geometry and budget

The ordinary rig emits **26 dynamic instances**; the named variation emits **31**, below the 40-record ceiling. Only existing `box`, `round` and `octa` kinds are used. The main round shell remains exactly `.95 × .84 × 1.22` before the single named scale. Body center is 0.52 above actual base in ordinary standing pose, matching the old base-relative model. Decorative plates connect to the shell rather than creating an independent collision envelope.

Each leg has a fixed 0.20-metre upper and 0.27-metre lower segment, with shared hip/knee/foot anchors. Two alternating tripod groups provide six-leg gait; swing clearance peaks at 0.065 metres. Feet begin just above supplied ground in planted phases. Hips are embedded in the actual convex shell. Five named octa spines have embedded roots and exact transformed base/tip anchors; their scale is applied once with the rest of the body. These visual changes do not edit any body/hit radius or pathfinding assumption.

All parts carry `cameraSolid:false`, `cutaway:false` and `appearanceOnly:true`. No terrain, floor, collider, shadow exclusion trick, camera preference, AI, health/timer state, grant or persistent record is created. The caller's one actual base is used; feet are not independently terrain-probed by this module.

## Focused verification and limits

Commands run in the owned worktree:

```text
node --check src/skitter-art.js
node --test tests/skitter_art.test.cjs
```

The focused suite passed **16 tests, 0 failures, 0 skips**. It covers isolated global/CommonJS exports, distance/subdivision cadence, blocked intent, stopping/repeated samples, complete pause/resume poses, scene/clock resets, actual-mode/duration gates, recovery without implied success, reduced motion, six fixed-length legs/tripod phases, actual production-mesh clearance/positive transforms, shared limb anchors, shell/plate/spine attachments, single named scale, caller-only color/recoil, fresh data/mutation isolation and refusal before partial output.

Actual mesh ground/bounds checks cover 192 named/reduced-motion/mode/phase combinations. Shared leg-skin attachment checks cover 216 named-scale/yaw/base/phase combinations. Attachment checks use the actual round shell's convex face-plane inradius, not only a visually plausible center. A first-run repeated-sample fixture differed by floating-point rounding in its position; it was corrected to repeat the exact prior position, with an additional rounding-noise check proving phase/blend/time do not advance.

No browser, GPU, build, full suite, combat command, save operation, personal file or protected resident-world action was run. Root still needs the real caller's timer/mode/height/identity integration, unchanged actual-hit feedback/rings, matched ordinary/named views in both cameras, normal-time approach/windup/recovery footage, paused/blocked/reduced-motion checks and integrated render cost. Readability, perceived anticipation, combat feel and human acceptance remain unverified. Distance-driven gait is not a claim of fully planted world-space foot physics or revised creature mechanics.
