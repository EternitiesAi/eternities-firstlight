# Heaven/Hell bounded trail catalogue — 2026-10-02

This change supplies two immutable content definitions for Root's new shared trail rules: **The Broken Choir · a garden answer** and **The Open Cage · a return that holds**. It does not itself implement playable combat, escort AI, saving, UI, art or rewards. Those callers remain Root-owned integration work. This is finite progression inside the existing openings, not complete Heaven/Hell countries or the full Crownkeeper/Warden saga.

Base: `56d4c25b389d6f93941f32aafc0469a14e89cf32`. Authoring branch: `agent/realm-trails-north-20261002`, in `D:/07-GAMES/Firstlight/authoring/world-heaven-hell`. Owned files are `src/realm-trails-north.js`, `tests/realm_trails_north.test.cjs` and this note. The previous delivery was clean before branch creation. No shared source, existing realm geometry, browser/build output or save was changed.

## Canon and adaptation

The recovered designs describe original working proposals. Rielle, Yselle, Istra, Tovan, Neris, Crownkeeper and the new local Route Reeve remain **provisional game-fiction names/adaptations**, not founder-ratified manuscript identities. The new catalogue retains that label in both invitations. The old archive's earlier handoff scope is historical; Dom's current instruction authorizes these connected-realm mechanics.

Relevant source files live under `C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/realms/`:

- `heaven-design/design/HEAVEN_STORY_AND_EVENT_ATLAS.md`, lines 4–20: provisional identities, an ordinary public instrument's missing phrase, a foreign imposed bearing, disabling the construct and returning the mechanism to service. Lines 30–34 establish Yselle's concrete water/garden role; line 66 identifies the Broken Choir prototype spine.
- `heaven-design/design/HEAVEN_PROTOTYPE_SPEC.md`, lines 70–85: bounded accepted restoration and separate optional support; lines 89–93: optional spillway changes a real recovery interval; lines 107–125: grounded maintenance socket, foreign bearing, declared encounter and physical final stabilization. The full upper-terrace large encounter remains outside this compressed service-core version.
- `heaven-design/design/HEAVEN_WORLD_BIBLE.md`, lines 61–70: inhabited public craft, Garden/Ruby Arcade, visual/text access without perfect pitch. The closed summit remains closed.
- `hell-design-2026-09-14/design/HELL_STORY_AND_EVENT_ATLAS.md`, lines 22–26: Istra's honest return, Tovan's useful restitution and Neris's truthful measurements/earlier complicity; line 64: Q06 The Open Cage, demonstrated route safety and explicitly available assisted extraction. Safety is separate from endorsement.
- `hell-design-2026-09-14/design/HELL_PROTOTYPE_SPEC.md`, lines 81–89: a physically able witness who fears the claim-marked route, viable escort and disclosed extraction after safety; lines 99–105: clamps separate actual return from later political disposition; lines 181–187: durable checkpoints vs transient enemy HP/escort position and atomic transitions. The full Veyr/Writ Engine expedition and dispositions remain outside this rescue.
- `hell-design-2026-09-14/design/HELL_ECONOMY_ALLEGIANCE_AND_RECOVERY.md`: real free refuge, explicit finite services and no allegiance requirement for recovery.

Existing `src/world-heaven-hell.js` supplies all land and solids. Its opening surveys and local defeat identities remain separate. Neither old Heaven01 nor protected resident/sanctuary records are touched. The new Reeve does not resurrect the opening's `hell-salvage-sentinel`.

## Frozen contract and ownership

The IIFE publishes `globalThis.RealmTrailsNorth`; CommonJS publishes the same `{definitions}` API. `definitions` is an array of exactly two deeply frozen objects. IDs are `heaven-broken-choir-v1` and `hell-open-cage-v1`. All steps use stable short IDs, declared prerequisite arrays, dry medium and existing ground height `1.57`. There is no function for granting an item, playing an effect, mutating state or starting an outing.

Root owns the optional `realmTrails.version1` story ledger, Adventure 11 migration, explicit acceptance, real physical proximity, durable step validation, enemy runtime/death, escort movement, assisted-extraction fallback, UI/art and atomic candidate saving. A successful explicit giver claim pays Heaven **30 XP /12 coins /2 ore**, or Hell **35 XP /14 coins /3 ore**, once per character/story. Completed unpaid work must survive reload. Repeated claim requests must have no additional payout. Refused saves/capacity checks must not consume the completed story.

Root's separate workshop fitting is **globally once per character**, unlocked by any trail claim. It costs **3 ore +8 coins** and adds **3 attack** to the selected owned canonical blade/bow while retaining identity, socket, Oren temper and pursuit state. A trail definition grants no entitlement item, auto-fit, free weapon or old-survey backfill. Later trail claims still pay only their declared currencies.

## Physical actions and next steps

Heaven giver is existing `heaven-rielle`, at `(-14, 5)`. The three relays are independent, required actions; setting the last relay activates the declared service core. Optional `spillway` never gates completion. Enemy ID is `heaven-choir-core-v1`, stability/HP `90`, damage `9`, ordinary sentinel kind. Root must accept weapon damage only during a real recovery after the core's pulse; optional spillway extends that window by **0.8 seconds**. At zero, the construct folds. Combat is followed by an ordinary physical Garden repair and explicit giver claim.

| Heaven step | Coordinate x,z | Verb | Prerequisites |
|---|---:|---|---|
| `spillway` | 25,-15 | Optional operate | None |
| `relay-west` | -8,-88 | Operate | None |
| `relay-east` | 8,-88 | Operate | None |
| `relay-crown` | 0,-102 | Operate | None |
| `disable-core` | 0,-95 | Actual combat defeat | All three relays |
| `garden-repair` | 0,-1 | Physically fit return arm | `disable-core` |

Hell giver is existing `hell-istra`, at `(-10, 24)`. Cooling is **required** route safety in this adaptation; the paired clamps follow contact and cooling, in either order. Root explicitly approved omitting `openingBonusStep` for Hell. Enemy ID `hell-return-reeve-v1` is a new story machine at `(-35,-90)`, approximately 79.1 units from the old eastern salvage sentinel. It spawns only after all four preparation steps. Its death is a prerequisite for inviting Neris, never a prerequisite for the player's free home return.

| Hell step | Coordinate x,z | Verb | Prerequisites |
|---|---:|---|---|
| `contact-neris` | -36,-102 | Hear witness | None |
| `cooling` | -34,-70 | Operate handle | Contact |
| `clamp-west` | -30,-86 | Set clamp | Contact +cooling |
| `clamp-east` | 14,-100 | Set clamp | Contact +cooling |
| `disable-reeve` | -35,-90 | Actual combat defeat | Contact +cooling +both clamps |
| `escort-start` | -36,-102 | Explicitly invite follow | All preparation +defeat |
| `refuge-arrival` | -12,27 | Automatic actual ally arrival | `escort-start` |

Escort macro anchors are `(-36,-102) → (-31,-83) → (-31,-58) → (-31,-15) → (-29,32) → (-12,27)`. These are destinations for **production pathfinding**, not straight interpolation. The `(-31,-58) → (-31,-15)` direct segment crosses the existing Moth Cut culvert; Core supplies a three-waypoint physical detour. Neris's declared speed is `2.5`, wait distance `10`. Her actual presence at the safe Refuge endpoint completes arrival; the player's arrival alone does not. Text explicitly discloses an assisted-extraction fallback after verified safety if routing fails. Shared rules must visibly bring Neris into the Refuge before recording that fallback as arrival; this catalogue cannot execute or fake it.

There are no new reachable patches, solids, closed-road unlocks, obstacles, water simulation, class requirements, allegiance choices, captivity-only ending, extra enemy drops or changed survey rewards. Coordinate units are compressed browser scene units, not a production country-size claim. All critical instructions are text/shape legible with muted audio and reduced motion.

## Focused evidence and acceptance boundary

Commands actually run in the owned worktree:

```text
node --check src/realm-trails-north.js
node --test tests/realm_trails_north.test.cjs
```

Syntax passed. The focused test run passed **10 tests, 0 failures, 0 skips**, with parent process exit `0` and reported duration **2958.8431 ms**. It covers exact schema/rewards/namespaces, recursive freezing, required DAG and adversarial cycles/unknown/optional gates, unique enemy identities, explicit invitation/actual-arrival definitions, deterministic inert browser/CommonJS loading and guarded host APIs.

The physical tests call the actual production `WorldFoundations.walkable/height/segment` and `Core.pathfind/moveTo/advance`. They check **92 entry/giver/action/home path legs comprising 272 waypoints** against the existing exact collision and connected patch union. Every anchor also fits a `0.7`-radius envelope, beyond the default `0.31` body. Ordered work is physically walked using accepted production movement, and every incremental segment is checked. The movement fixture starts a synthetic scene position; it does not claim command-earned quest completion or execute combat/escort logic.

An isolated production-navigation measurement gives the escort return **152.725224 scene units**, **1835 advance frames at 1/30 second**, or **61.166667 simulated seconds** at declared speed. The culvert detour contributes **43.315762 units** and 521 frames. These are deterministic geometry/kinematic results, not normal-RAF footage, performance, human pacing or actual integrated Neris AI. Real wait/rejoin, assisted extraction, defeat/reload/death, actual recovery-only damage and save/claim invariants are Root's next integration acceptance conditions.

No broad suite, build, browser, GPU capture, personal-save operation, paid service, download, push, main merge or deployment was performed. Useful next evidence is an accepted fresh blade/bow run in both views, actual core-window/optional preparation behavior, actual Neris safe arrival (and separately labelled fallback), cold reload of partial/completed/paid story state, refusal rollback and once-only fitting identity preservation. Passing this content/geometry test does not certify those shared callers or founder acceptance.
