# Deliberate bridge side-view plan

This slice adds only a pure framing planner and focused CPU checks. It introduces no ground, collider, player movement, inventory, story, class, reward or save field. Root owns the actual app callback, existing Hearthwater action, Coastward button at the channel-view point, build and rendered/control proof.

`src/bridge-moment-view.js` exposes frozen `RealmBridgeMomentView` / CommonJS `{plan}`. `plan({scene,player,preset,diving=false,baseHalf})` returns a fresh `{ok,scene,bridgeId,view,message}` or `{ok:false,error,message}`. It never reads a camera, engine, DOM, save, simulation or clock. Optional extra fields are ignored; health is not a camera authority. The caller supplies its actual current `sim.state.player`, rather than a durable visit snapshot's saved home checkpoint.

Eligibility derives from the actual `RealmEarth.BRIDGE` / `RealmEarth.walkable` for Hearthwater, or the one actual `earthlands` `channel-bridge` patch / `RealmWorldFoundations.walkable` for Coastward. Centre membership identifies the bridge; canonical walkability checks complete foot support and real solid/rail exclusions. Both bank joins remain valid. Supported ground just beyond an end does not become bridge identity. No copied bridge dimensions or invented floor are added.

Both bridges preserve the existing successful Hearthwater framing:

- Every view has yaw `Math.PI * 1.5`, `tour:false` and `overview:false`.
- `adventure` has elevation `0.14`, distance `14.5` and actualDistance `14.5`.
- `follow`, `tactical` and `wide` have elevation `0.39`, half `9` and zoom `9 / baseHalf`.

The plan contains no preset, FOV, player, centre or stored profile fields. Root can apply the view to the current camera, clear transient follow, update the actual camera and use the existing preference-save lifecycle after a successful plan. Engine availability remains the caller's responsibility. The plan itself performs none of those actions.

Unknown scenes/presets, nonfinite positions/optional Y or yaw, any diving state, malformed/missing bridge data, unsupported feet and invalid base widths refuse before returning a view. Diorama baseHalf must be positive finite and produce finite positive zoom. Adventure may omit baseHalf because it does not use orthographic width; a supplied invalid value still refuses. The stricter physical eligibility replaces the old Hearthwater guard that checked its visual width alone; valid successful framing numbers and the existing success/off-bridge message remain intact.

Coastward Road is an original provisional extension inspired by the recovered Earth direction. A deliberate view is presentation, not canon expansion or a claim that a whole coast is playable. The source ambition remains Dom's Earth woodland/water/ordinary-life direction in the attributed founder charter. No forced chapter, ancestry, class, allegiance or kit grant is introduced.

Focused commands:

```text
node --check src/bridge-moment-view.js
node --test tests/bridge_moment_view.test.cjs
```

Syntax passed and the focused suite completed with **11 tests passed, 0 failures and 0 skips** (680.437 ms reported by Node). Checks use the actual canonical definitions for both bridges, end joins, supported off-bridge points, full actor edge support, actual rail collisions, all four preset plans and FOV separation. Synthetic fixtures label malformed input/dependency refusal and frozen-input/authority isolation. The source branch starts at integrated `7c50f8a9f96fc2de5ed77f7a6aa427a37cb1b529`; only these three owned files change.

These CPU plans do not prove an integrated button, actual camera clearing, rendering, performance or human preference. Root owns the corresponding normal-control/browser/film proof. No browser, GPU, shared runtime edit, full suite, personal profile/save operation, additional worker or publication was used for this planner slice.
