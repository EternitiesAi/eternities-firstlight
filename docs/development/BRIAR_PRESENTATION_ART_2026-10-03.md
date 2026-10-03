# Briar presentation rig, 2026-10-03

This original bounded presentation slice improves the existing Briar companion's silhouette and gait. It adds no new pet, species, selection, collectible variant, behavior, technique, rescue outcome or story chapter. The caller supplies actual position, yaw, floor and canonical bond state; existing adventure rules retain all following, waiting, scent, combat and persistence authority.

The module was authored on `agent/briar-presentation-20261003`, retaining the previous settlement commit `db1020902a2bd034dd50fe4979f2faffe47b7d12`. It owns only [the new companion module](../../src/companion-art.js), [its focused CPU tests](../../tests/companion_art.test.cjs), and this note. No existing runtime/art/build/test files were edited. Root owns the real AdventureArt caller, height dispatch, transient sample identity, diagnostics, builds, matched captures and full integration checks.

## Source direction and scope

The base checkout's `src/adventure-art.js:45` already portrays Briar with tawny fur, a cream muzzle/tail tip, dark eyes/lower legs and a teal `0x648e89` bond collar. Those existing colors and the +Z facing convention are retained. The new muzzle, bib, pointed ears, fuller tail and attached joinery are original interpretations; they are not a newly approved species or acquired asset.

The recovered `C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/realms/earth-design-2026-09-14/EARTH_COMPLETE_DESIGN.md` identifies the Briarfox as the existing bonded companion lineage at line 1275, with shared journey/practical scent and retained name/history/techniques. ET02 at lines 659–667 recommends ordinary time together before any later grief arc; it expressly does not add death to that milestone. Lines 270 and 1276 describe a separate future blue-fox concept whose allocation rules are unsettled. This slice implements neither that future collecting event nor a grief/reunion policy. The [vision index](../design/COMPREHENSIVE_VISION_INDEX.md) likewise separates Earth's lived home/progress traces from forced revelation or new grief for Briar.

Current rescue/bond/mode/scent/follow/combat callers in `adventure.js` remain authoritative. An unbonded pose here is only a stationary lower resting silhouette for the existing injured fox; it does not change injury, damage, rescue eligibility or any save field.

## Pure interface

`globalThis.RealmCompanionArt` and CommonJS export the same frozen `{motion, pose, parts, draw}` API. No mutable traveler rig is imported or reused. The module contains its own local transform/basis math; tests use the production engine's mesh and matrix functions without constructing WebGL.

```js
const sample = RealmCompanionArt.motion(previousSample, {
  x: actualFox.x, z: actualFox.z, time: presentationTime,
  scene: sceneIdentity, paused, reducedMotion, walking
});
const posed = RealmCompanionArt.pose({...sample, bonded});
RealmCompanionArt.draw(out, {
  x: actualFox.x, z: actualFox.z, base: actualFloor,
  yaw: actualFox.yaw, bonded
}, posed);
```

`motion` returns a fresh `{lastX,lastZ,lastTime,scene,time,phase,blend,moving,paused,reducedMotion}` sample. Accepted displacement advances a 1.05-metre presentation stride cycle. Walking intent alone never advances it; actual displacement may advance it without that flag. A stationary actor holds phase while the previous leg pose eases to rest. Frame subdivision or a different speed over the same distance preserves phase. This is a distance-driven visual cadence, not a claim of fully planted world-space paw physics.

Sampling consumes coordinates/time while paused but freezes drawable phase, blend and secondary animation time. A resumed frame does not turn skipped travel into steps. Scene changes, teleports beyond the bounded distance tolerance, clock rewind and gaps longer than 0.75 seconds reset the stance. Normal animation-time increments are capped at 0.1 seconds. The caller must use the returned sample's `time` when posing, rather than overwriting it with raw wall time during pause.

The caller owns one transient sample per actual simulation/companion identity and clears it on restore or character replacement. It is presentation state only, never a durable ledger or event source. `pose` reads only supplied options and returns fresh local joints/angles. The unbonded fox forces zero gait and secondary motion at every time. Reduced motion keeps essential leg movement while suppressing bob, head/ear drift and tail sway.

`parts` returns fresh instance records with full positive matrices and semantic `companionPart` names. `draw` computes those parts first and only appends to existing `out.box`, `out.round`, and `out.octa` arrays. Finite actual `{x,z,base,yaw}` and explicit `bonded:boolean` are required; a mismatched bond pose refuses before output mutation. No default floor substitutes for a missing caller height. Root separately fixes the old inline fox's Earth height dispatch.

Replace the existing inline fox geometry rather than drawing both versions. The module does **not** emit the old unbonded rescue/status marker; Root should preserve that existing caller-owned marker if replacing the entire old helper. No new marker, prompt, trigger or entitlement is implied.

## Geometry and motion budget

The bonded fox uses **33 dynamic instances**; the unbonded fox uses **30**, below the 48-part ceiling. Only existing `box`, `round`, and `octa` kinds and original color constants are emitted. The articulated body has a readable tapered cream muzzle/dark nose, pointed ears with shallow patches attached to real outer-ear facets, cream bib, four dark stockings/paws, an overlapping three-part tail with cream tip, and three shallow teal collar faces attached to the neck.

Four legs use diagonal trot pairs. Each leg has two fixed 0.24-metre segments with shared hip/knee/paw anchors. Swing lift peaks at 0.085 metres; paw geometry starts just above the supplied floor in a standing phase. Skin transforms derive from the same anchors as the pose. The neck joins the articulated head, collar faces enter the actual neck mesh, and adjacent tail ellipsoids overlap at their shared anchors to avoid point-connected beads. Full motion stays below 1.4 metres above base and within 1.55 metres horizontally of placement in the inspected pose grid.

All parts carry `cameraSolid:false`, `cutaway:false` and `appearanceOnly:true`, retaining the existing fox's ordinary opaque presentation without introducing camera/body blockers. No wind, lights, new mesh/material registration, audio, GPU resource, AI path, save access, damage, grant or dispatch is created.

## Focused verification and limits

Commands run in the owned worktree:

```text
node --check src/companion-art.js
node --test tests/companion_art.test.cjs
```

The focused suite passed **15 tests, 0 failures, 0 skips**. It covers isolated global/CommonJS exports, displacement/frame-subdivision cadence, blocked intent, easing, complete pause/resume poses, scene/teleport/clock reset, injured stillness, reduced motion, fixed bone lengths, actual production-mesh ground bounds, positive/bounded transforms, shared limb anchors, real tail overlap, neck/collar attachment, actual ear-facet attachment, fresh data, mutation isolation and refusal before partial draw.

The ground test covers 256 bonded/reduced-motion/phase combinations; shared leg-transform attachment checks cover 216 phase/yaw/base combinations. Ear-patch vertices remain within their actual outer-ear triangles and less than 0.009 metres from those planes across nine yaw/time combinations. The collar check uses the actual production neck mesh's convex face-plane inradius and actual collar face centers, rather than assuming that an overlapping box must have a corner inside an ellipsoid. The first run caught signed-zero variation in reduced-motion pose values; those outputs were made deterministically zero. A vertex-only collar check was replaced with that actual face-intersection check because all box corners can sit outside a convex neck while a box face enters it. These are CPU geometry tests, not rendered acceptance.

No browser, GPU, build, full suite, save operation, personal file or protected resident-world action was run. Root still needs the actual caller/height/character-identity integration, matched diorama and third-person views, normal-time movement footage, paused/blocked/rescue/reduced-motion UI proof, and integrated render cost. Silhouette readability, tail/ear material read and human comfort/attachment remain unverified. This authored art and self-test evidence do not certify companion behavior, independent runtime correctness or human feel.
