# Root-bank brute: original grounded presentation

This bounded slice replaces no rules. It supplies an original reed-brown, boar-like quadruped interpretation for the accepted Root-bank brute at `(-134,-70)`. Its broad shoulder, blunt snout, small tusks, dark lower legs and short ridge distinguish it from the floating crystal used by the generic sentinel renderer. This is an art interpretation for an existing ordinary encounter, not an approved canon species or a new animal, taming, harvesting or reward system.

Owned files are `src/earth-expedition-beast-art.js`, `tests/earth_expedition_beast_art.test.cjs` and this note. They were authored on `agent/earth-expedition-beast-art-20261003`, from isolated merge `46531a629345ecfa72397e3aed16ca090af49271` of Root's committed integration through `13e0a0e`. Existing shared source, generated HTML, combat, saves and art callers were not edited.

## API and caller ownership

The dependency-free IIFE publishes frozen `RealmEarthExpeditionBeastArt` and the same CommonJS object:

```javascript
const options = {
  x: enemy.x, z: enemy.z, base: actualSupportHeight, yaw: enemy.yaw,
  mode: enemy.mode, timer: enemy.timer,
  windup: enemy.windup, recovery: enemy.recovery,
  aim: enemy.aim, flash: enemy.flash > actualElapsed,
  reducedMotion: actualReducedMotion, time: actualElapsed, paused: actualPaused
};
const pose = RealmEarthExpeditionBeastArt.pose(options);
const parts = RealmEarthExpeditionBeastArt.parts(options);
RealmEarthExpeditionBeastArt.draw({box: [], round: [], octa: []}, options);
```

`parts` and `draw` derive their own pose from the actual options. `idle`, `chase`, `windup` and `recover` are supported; production `pursue` and `return` normalize to the same chase stance. Durations default to this encounter's `1.35s` windup and `2.3s` recovery, but positive authoritative durations are honored. Invalid finite-placement, timer/duration, aim or mode inputs refuse before output. `draw` validates all append arrays before emitting anything.

Every part already contains a complete world matrix and world position, using the supplied support height and yaw exactly once. Local `+Z` faces forward. **The integration must skip the old sentinel scaling/rotation loop for this branch.** If actual `hitAt`/`hitFrom` evidence supplies a recoil offset, the caller can add it to the visual X/Z before invoking this module, once. This module never calculates recoil from clocks, attack intent or health changes. Passing `hitAt` or `hitFrom` alone has no appearance effect. Only an explicit actual `flash: true` recolors the parts; it does not alter their geometry.

Root owns dispatch exclusively for the accepted first-story or patrol `expeditionQuest` and `defeatStep === 'clear-root-pests'`. Other sentinels retain their existing renderer. Dead/hidden suppression, animation sampling, attack aim, warning/target rings, hit feedback lifetime, health bars and diagnostics remain caller responsibilities. The existing kind stays `sentinel`, with the same range and behavior; this art does not imply a charge, tusk collision or new hit reach.

Integration-ready branch inside the existing enemy loop, using its actual `s`, `e`, `sim`, `out` and `support` helper:

```javascript
const terms = G.RealmEarthExpedition;
const rootBank = e.kind === 'sentinel' &&
  e.defeatStep === 'clear-root-pests' &&
  (e.expeditionQuest === terms.definition.id ||
   e.expeditionQuest === terms.patrol.id);
if (rootBank) {
  const reducedMotion = sim.state.settings.reducedMotion;
  const hitAge = s.elapsed - (e.hitAt ?? -9);
  const recoil = !reducedMotion && hitAge >= 0 && hitAge < .18
    ? (1 - hitAge / .18) * .12 : 0;
  const divisor = e.hitFrom
    ? Math.hypot(e.x - e.hitFrom.x, e.z - e.hitFrom.z) || 1 : 1;
  const dx = e.hitFrom ? (e.x - e.hitFrom.x) / divisor * recoil : 0;
  const dz = e.hitFrom ? (e.z - e.hitFrom.z) / divisor * recoil : 0;
  G.RealmEarthExpeditionBeastArt.draw(out, {
    x: e.x + dx, z: e.z + dz, base: support(sim, e.x, e.z),
    yaw: e.yaw, mode: e.mode, timer: e.timer,
    windup: e.windup, recovery: e.recovery, aim: e.aim,
    flash: e.flash > s.elapsed, reducedMotion,
    time: s.elapsed, paused: sim.paused
  });
}
```

This branch belongs before the generic sentinel body. The existing generic post-transform block must also exclude `rootBank`, for example `e.kind !== 'skitter' && !rootBank`; warning and targeting rings remain outside that exclusion. The snippet is an integration recommendation, not a claim that this caller has already landed or passed.

Focused caller acceptance should exercise actual first-story and patrol roster records as positive controls, then use clearly labelled synthetic negative records for these boundaries:

| Record | Expected branch |
| --- | --- |
| First-story or patrol quest ID plus `clear-root-pests`, kind sentinel | Exactly one 41-part brute submission |
| Ordinary mine Prism sentinel, no expedition quest | Unchanged generic sentinel; zero brute parts |
| World-realm sentinel with no expedition quest | Unchanged generic sentinel; zero brute parts |
| Exact expedition quest, different defeat step | Zero brute parts |
| Root defeat step with unknown or merely prefixed/suffixed quest ID | Zero brute parts |
| Exact quest/step on another kind | Zero brute parts |
| Dead record | Existing dead suppression; zero creature parts |

The caller test should also compare unchanged generic-sentinel emissions before/after integration, preserve the actual aim-centered warning/target rings, and compare matrices under a nonzero yaw plus a confirmed hit offset. A no-hit and future/expired-hit sample must supply no recoil; reduced motion must keep the essential combat pose while suppressing that optional recoil. These dispatch checks are pending Root integration and were not included in the ten pure-module passes.

The body lowers and the head settles into a planted anticipation pose using actual remaining windup time. The last windup posture joins the first recovery posture continuously, and the final recovery posture joins rest. Chase has a slightly wider planted stance. There is deliberately no clock-driven gait, breathing, tail sway or input-driven trot: a blocked enemy cannot look as though it is advancing merely because its mode says pursue. Reduced motion retains the essential tell and recovery. Paused samples with unchanged authoritative timers remain identical; the module has no previous-frame cache and does not own timer freezing.

## Geometry and cost

The submission contains **41 parts**: 15 boxes, 16 rounds and 10 octahedra. Four articulated short legs connect their actual body attachment, knee meshes and grounded hoof boxes. Snout, cheeks, eyes, ears, tusks, ridge and tail have attached mesh construction. There are no particles, lights, sounds, terrain, camera blockers or colliders. All records set `appearanceOnly: true`, `cameraSolid: false` and `cutaway: false`.

Across sampled idle, chase, windup and recovery phases at yaw zero, the actual Engine triangle envelope measures:

| Measurement | Metres |
| --- | ---: |
| Width | 1.05 |
| Length, including short tail | 1.412 |
| Maximum height above supplied support | 0.89075 |
| Maximum horizontal radius | 0.75315 |

The shape remains inside the existing `1.2m` sentinel tell radius. This is a visual extent comparison, not a change to collision, attack range or target selection. The actual accepted root-bank pocket supports its mesh footprint. All four hooves meet the supplied ground; the belly remains more than `0.10m` above hoof tops in the sampled deepest posture.

Using the current Engine's existing primitive tessellation, one submission contains **16,140 vertices / 5,380 triangles per geometry pass**. Shadows and reflections can repeat that work. The source respects the requested fewer-than-65-part budget, but this cost inventory does not certify frame time or performance on any device. Root owns subsequent actual rendering measurements and both-camera silhouette/readability review.

## Focused CPU qualification

Run from the repository root:

```text
node --check src/earth-expedition-beast-art.js
node --test tests/earth_expedition_beast_art.test.cjs
```

The final focused run passes **10 tests, zero failures and zero skips**. It checks isolated global-script/CommonJS exports in a Node VM without a simulation or engine dependency; timer-derived posture and transition continuity; fixed stationary/pause/reduced-motion samples; actual mesh triangles across **240** mode/phase/yaw/support/reduced-motion specimens; finite, positive and orthogonal bases; ground contact and compact bounds; actual convex primitive attachment; full world-transform covariance; confirmed-flash geometry invariance; fresh arrays and frozen-input preservation; refusal without partial output; and the actual expedition encounter terms and supported physical pocket.

The encounter fixture assigns a labelled synthetic valid accepted step prefix to a new in-memory simulation. It does not earn consent, movement, kills or rewards. Its before/after checks confirm that projecting this art leaves both source terms and durable simulation state unchanged. First-story and patrol root foes retain `136 HP`, `11 damage`, the `1.35s` tell, `2.3s` recovery and their existing physical anchor. No browser, GPU, complete suite, native save or human playtest was run for this source slice.

## Attribution and exclusions

The recovered Earth world bible, `earth-design-2026-09-14/design/EARTH_WORLD_BIBLE.md`, E03 lines 76–88, describes tended woods, canopy wetlands, root halls, glades and bounded creatures with territory and reasons to retreat. It treats the ancient supported passage as useful living infrastructure rather than a boss unlock. That direction supports an ordinary grounded local creature interpretation; it does not prescribe this boar-like silhouette, palette, anatomy or species name.

The model and colors here are original procedural work using existing primitive kinds. No proprietary assets, Blender pipeline, texture download, new lore facts, protected organism, companion eligibility, damage rule, brain, physics, action, inventory or save field was added. The module's actual caller and rendered appearance remain Root's integration and verification work.
