# Living Earth Region Implementation Plan

> **For agentic workers:** Use `dispatching-parallel-agents` for genuinely independent tasks or `executing-plans` for inline task-by-task execution. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Deliver a consequential bridge-community outing and concentrate motion/art quality on its existing Earth region.

**Architecture:** A separate optional quest owner saves full validated candidates before adopting its ledger/payment. UI and original art project those facts; existing route, combat, home and character authorities remain. Root codes/integrates; two read-only Sol6.1 xhigh colleagues review bounded design/source.

**Tech Stack:** Dependency-free JavaScript/WebGL2, Node tests, Python/Playwright; existing embedded offline builder.

**Spec:** `docs/development/LIVING_REGION_2026-10-04.md`.

## Global Constraints

Browser target; both cameras; world/key9; adventure12; homeHistory1; XP1–5/stored9999. No personal saves, paid workers, main merge, public deployment, Unreal rewrite, replayed old rewards or automatic equip/placement. Heavy artifacts remain D:/07-GAMES/Firstlight. Proposals stay attributed.

### Task 1: Durable bridge-community rules and complete earned routes

Files: create `src/bridge-community.js`, `tests/bridge_community.test.cjs`, `tests/bridge_community_journey.cjs`; modify `src/core.js`, `build.py`, `src/shell.html`.

Interface: `RealmBridgeCommunity.{definition,fresh,validate,command,at,next,worker}`; `command({sim},type,payload,{save})` returns `{ok,text,error?,duplicate?}`. The saver is synchronous and receives `RealmCore.validate(candidate)`.

- [x] Write tests for empty old migration, impossible/future state, offsite/order/assembly refusal, acceptance/complete/claim save refusal, all fee capacities, one payout after cold reconstruction, old-state preservation, supported work anchors.
- [x] Run `node --test tests/bridge_community.test.cjs`; demonstrate missing behavior red.
- [x] Implement fixed sequence with candidate-before-adopt:

```js
const candidate=sim.snapshot();
// Validate proximity, prerequisites, exact choice and every capacity first.
const checked=RealmCore.validate(candidate);
const saved=io.save(checked);
if(saved?.then || saved?.ok!==true) return {ok:false,error:'Nothing changed.'};
sim.state.bridgeCommunity=checked.bridgeCommunity;
```

- [x] Run focused tests and three real movement journeys using `createHarness/earnedKit` from `realm_trails_journey.cjs`; reconstruct accepted/partial/complete/unpaid/paid checkpoints with no position/gear grants.

### Task 2: Legible UI, living fixture and deliberate home trace

Files: create `src/bridge-community-ui.js`, `src/bridge-community-art.js`, `src/bridge-community.css`; modify `app.js`, `rpg-ui.js`, `world-foundations-ui.js`, `world-foundations-art.js`, `world.js`, `home-history{,-ui,-art}.js`, `creative.js`, `build.py`, `shell.html`; extend tests.

Interface: `BridgeCommunityUI` consumes `rpg.api.bridgeCommunityCommand(type,payload)`, owns `page/action/context/interact/tick/invitation`; `routePoints(sim)` supplies one next action to labels/map. `worker(sim)` returns supported transient `{x,z,yaw,phase,walking,work}`; no service-point relocation. Home unlock uses `definition.quest` with its explicit owner.

- [x] Add red tests for actual distinct fixture submissions, worker support/pauses, one home entitlement, capacity/cost/save atomicity and no unearned placement.
- [x] Implement explicit offer/fee/danger, proximity actions, matching-brace refusal, one tracked action, NPC recognition, optional home-board recipe; keep the existing deliberate layout wrapper.
- [x] Build using `python build.py`; run rules and focused native UI in isolated profiles, with both choices/cameras and exact write-to-restart reconciliation.

### Task 3: Traveler and creature physical presentation

Files: `traveler-art.js`, `traveler-equipment-art.js`, `earth-expedition-beast-art.js`, `adventure-art.js`, `rpg.css`; tests `traveler_rig/feel/equipment`, `earth_expedition_beast_art/caller`.

- [x] Add red behavior checks: no trot at stationary chase; feet differ after real distance; pause/discontinuity settles safely; hooves follow leg endpoints; reduced motion is quiet; no nocked arrow in idle/recovery/direct shot; original gear/state immutable.
- [x] Feed actual enemy distance sample through a WeakMap using existing `RealmTravelerArt.motion`; draw connected grounded legs. Use existing round batches for fitted limb volumes, separate material roughness and bow anticipation-only shaft.
- [x] Run focused tests, then actual browser appearance and combat/camera checks; inspect matched images, preserve body/equipment clearance.

### Task 4: Delivery and evidence

Files: `tools/verify.py`, `.github/workflows/verify.yml`, new browser/capture tools, `AGENTS.md`, four continuity records and dated results/play guide.

- [x] Register three journeys and isolated browser suite; regenerate identical checked-in HTML.
- [ ] Run current full verifier, retain any red epoch, resolve actual defects and rerun only affected/final gates.
- [ ] Record ordinary RAF/UI footage from labelled earned state, inspect both views and fully decode media; distinguish hardware cadence from GPU/monitor FPS and human feel.
- [ ] Commit/push source, open a stacked draft PR against PR40 branch, attach it, clone exact remote head and run full current verifier there. Preserve source/evidence epochs and return exact results/migration/limits.
