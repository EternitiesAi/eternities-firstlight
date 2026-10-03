# Earth expedition art: focused production geometry checks

This receipt covers the integrated Elderweald-facing Earth expedition art at Root commit `0ca889b509b53f7c46064529f779fe9db9fc035f`. The isolated qualification branch merged that source as `523b9546c12f474163446c4325dac659689cbd56`. It adds only the focused CPU test and this note; shared art, rules, save schemas, HTML and camera code remain Root-owned.

Run from the repository root:

```text
node --test tests/earth_expedition_art.test.cjs
```

The final focused run passed **12 tests, zero failures and zero skips** on Node.js `v24.18.0`. These are production-module geometry and caller checks with explicitly synthetic legal ledger/equipment fixtures and a CPU recording renderer. They do not establish earned progression, native persistence, rendered readability, GPU performance, both-camera pixel acceptance or human feel.

## What the checks exercise

The test uses `earth-expedition-art.js`, the installed Earth definition, `elderweald-world.js`, `elderweald-trail-art.js`, `world-foundations-art.js`, `WorldArt.update`, the production traveler rig/equipment renderer and Engine geometry/matrix helpers. Saved-stage fixtures cover every valid first-story prefix, both allocation branches, before/after the explicit claim, and a later patrol record. Appearance is deterministic and read-only; repair and delivery art never precede their recorded steps, and a patrol does not replay or remove the first repair.

Actual Engine mesh vertices establish board/rack contact, prepared-material ground contact, brace/wall contact and fastening attachment. They also establish support for work props and path quads. Every extension route leg and the giver, work, choice and enemy anchors receive a full-body clearance check: radius `0.31m`, height `1.7m`, with the feet `0.03m` above the canonical `1.57m` floor to permit shallow decorative path surfaces. This is a geometric route-envelope check, not a movement or pathfinder run. Understory checks additionally reserve the existing wind shader's maximum horizontal displacement: `0.078m` X and `0.04875m` Z for these octa meshes. Their actual lower vertices deliberately enter the soil; they are rooted decoration and create no support or collision authority.

Binding checks cover **672 production rig specimens**: seven owned weapon identities, held/stowed, two yaws, ordinary/reduced motion, idle/anticipation/recovery, guarded/unguarded and both binding choices. Each emits four new binding parts, attaches the wraps to the actual grip and the pin to a wrap, keeps matrices finite, and preserves every pre-existing socket, Oren/River fitting, starter temper and realm collar part byte-for-byte. The combined equipment submission remains within 48 parts; a separate representative weapon/carry/phase inventory measured a maximum of 34. Actual convex mesh separation, with positive/negative controls, checks the new parts against those old markers. A conservative OBB alone produced a false positive at a tapering socket corner; the actual octa volume is separated. The checks do not claim that every ornamental part of the whole weapon is disjoint, or that all visually possible combinations have human approval.

The actual static caller emits one unchanged physical box per canonical solid, 64 coalesced ground rectangles and the same 70 raw-partition coast-bank records in each tier. The added path/understory factory stays within its explicit 280-part ceiling:

| Quality | Existing static parts | Added trail parts | Total static instances |
| --- | ---: | ---: | ---: |
| Low | 1,135 | 100 | 1,235 |
| Balanced | 1,267 | 186 | 1,453 |
| High | 1,363 | 215 | 1,578 |

These are submitted instance counts, not draw-call, frame-time or total-frame budgets. Shadows/reflections can repeat rendering work. The high-quality scene exceeds 1,500 static instances; this note does not invent a new passing performance limit.

`WorldArt.update` is invoked through its real dynamic timber path after the normal `Adventure.syncScene` lifecycle. A recording engine confirms that its work submissions equal the pure state projection and do not mutate the durable simulation state. Earth fog focus is translation-relative to actual player X/Z; production `geometryPass` submits the same finite fog profile to main and reflection passes. Beginning another room clears Earth fog ownership and the dynamic timber batch. The renderer stub records calls and uniforms; it does not compile shaders or prove framebuffer output.

## Negative evidence and repairs

The initial integrated source at `3c17f89fc2e6255a034bedd63fb0bf130fa37117` failed three concrete contact tests: the brace was `0.0025m` from the east wall; the first delivered board was approximately `0.13m` above the rack and outside its support footprint; and managed allocation bands had no material beneath them. Root fixed these in `a6083bbf867a9cbb65fe0fa10957184e6e811799`: the brace now intersects the outer wall face, delivered boards rest and stack on the rack, and managed stock consists of two grounded, touching timber pieces with attached bands.

That corrected source then failed two route checks. Managed stock crossed the actual managed-approach leg, and three understory pieces overlapped the crossing side-pocket leg. Root's `0ca889b509b53f7c46064529f779fe9db9fc035f` moved the stock to X `-76.58`, preserving the work anchor at `(-78,-2)`, and filtered understory against all extension route legs and points with supported corners. The unchanged strict route and wind-reserved mesh checks pass on this source. No success criteria were weakened to hide these source defects.

Two separate harness corrections were not runtime defects: a recording `WorldArt` fixture initially omitted the normal scene synchronization, and an ad hoc equipment-count probe initially omitted normal module/started-state prerequisites. Neither failed attempt establishes a game bug; the committed production-caller test supplies those prerequisites explicitly.

## Source attribution and scope

The recovered Earth direction is `earth-design-2026-09-14/design/EARTH_WORLD_BIBLE.md`, E03 Elderweald, lines 76–88: managed woods give way to canopy wetlands, root halls and glades; designated or naturally shed material and supported root passages belong to that direction. The local story, names, exact measured route, board, stock, brace, trail marks and weapon binding are original provisional Firstlight adaptations. These checks do not certify a full canon map, forest ecology, logging economy, faction resolution or new harvesting system.

SHA-256 of the reviewed working-tree source bytes:

| Source | SHA-256 |
| --- | --- |
| `src/earth-expedition-art.js` | `5db3bd8a41a8db706bf3d61a2546bb0c5fbdf41efcc65e0d66ee826f14437584` |
| `src/elderweald-trail-art.js` | `e978e735ec1ee8048df1777b190959b832cd37755f682c3d51b9ec3f0a7f0491` |
| `src/traveler-equipment-art.js` | `2fae904d34d8ca5bb07e2601fae216b91b6951d81900a11d2d41b4ab0ab4fa5a` |
| `src/traveler-art.js` | `1d5568af71b7fbfed70b81d197d95c0ee3ef68d2a025c806606b7d90560b56e0` |
| `src/engine.js` | `b3057b44fb10f0f2d89876a9611c5de4592047cf12be6ea7961e9c486ced8952` |
| `src/world.js` | `50efe69aa8629797532234bbc2b14262ccd2134f09651db80210e1232995a320` |
| `src/world-foundations-art.js` | `8e4e4c8cbe3dd3338d950b523e3794b289c8fd3b34e35cfdd5817a3cddb37013` |
| `src/world-foundations.js` | `97f445690fccea753c860e96bf54d4e33a3c8551e8738a31d3d947ce30d1465d` |
| `src/earth-expedition.js` | `7a5de61440a72e74f474ef09afa46c981c631e60e9ed074aff5f6b4adc3775b0` |

These hashes were recomputed after merging `0ca889b509b53f7c46064529f779fe9db9fc035f`; they identify the final reviewed working-tree bytes. Historical failures above remain attributed to their earlier source commits.
