# Gate Captain Implementation Plan

> **For agentic workers:** Execute inline with `executing-plans`; both authorized
> colleagues are usage-limited. Do not create replacement workers or reroute.

**Goal:** Build the canon-derived gate decision with three physical travellers,
two prepared destinations, recoverable escort checkpoints and a once-only fee.

**Architecture:** A pure definition/state model owns finite progress. A live
motion module owns supported group movement and private arrival proof. An actual
Core command adapter owns save-before-adoption; UI and art submit/read only.

**Tech Stack:** Existing JavaScript/Core/WebGL, Node tests and Python browser
callers. No package install, external service, renderer replacement or new engine.

**Spec:** `docs/development/EARTH_GATE_CAPTAIN_2026-10-14.md`.

## Global constraints

Preserve personal saves, existing owners and explicit choices, both cameras,
World9 and existing browser keys. Deliberate Adventure14→15 migration only.
Keep VM/Claude/unrelated work untouched; no merge/deploy/paid work/new full copy.
Freeze STATION at d13d067 while grazer native admission is pending.

## 1. Finite state and supported route contract

Files: `src/earth-gate-model.js`, `tests/earth-gate-model.test.cjs`.
Public interface: `definition`, `fresh()`, `validate(raw)`, `route(plan)`,
`transition(raw,type,payload) -> {ok,state,duplicate?,cost?,reward?,error?}`.
Transitions are pure proposed records, not world commands or movement proof.

- [x] Define literal fresh state and independent rejection/boundary cases first.
  Example: `assert.throws(()=>M.validate({...M.fresh(),claimed:true}))`;
  `assert.deepEqual(M.transition(fresh,'claim',{}).ok,false)`.
- [x] Implement strict prerequisites, changeable plan before preparation, exact
  shelter costs and terminal outcome/claim consistency; preserve discovery order.
- [x] Verify all three parallel paths with actual Earth point/whole-segment
  predicates, reject mutated definitions and prove no input mutation.
- [x] Run `node --test --test-concurrency=1 tests/earth-gate-model.test.cjs`.

Eight model/geometry tests pass in `GATE_MODEL02.log` under the existing
`village-resident-articulation-20261013/next-gate` artifact directory. The first
implementation run passed seven and failed one: the test passed a room string
where Core requires `{id: room}`. The corrected test also checks Core's entire
segment dispatch and player pathfinding. Original failure retained. The model
is not yet wired into live gameplay; no migration or generated page changed.

## 2. Physical group and durable command ownership

Files: `src/earth-gate-motion.js`, `src/earth-gate.js`, `src/adventure.js`,
`src/core.js`, `tests/earth-gate-motion.test.cjs`, `tests/earth-gate.test.cjs`.
Motion interface: `begin(ctx)`, `tick(ctx,dt)`, `current(ctx)`,
`arrivalTicket(ctx)`, `validateArrival(ctx,ticket)`, `reset(sim,reason)`.
Command interface: `command(ctx,type,payload,io)`, with exact character/revision
fences and `io.save(candidate)`; only a branded physical ticket permits checkpoint.

- [x] Start from actual Core simulations with command-earned initial kits.
  Reject `command(ctx,'checkpoint',{ticket:{}},io)` without a write.
- [x] Add strict migration, candidate validation and selective adoption. Verify
  insufficient supplies, 9,999-coin capacity, double claim, async/throw/quota/
  mutation/owner-switch refusals and every partial save/reload state.
- [x] Advance all three actors at bounded actual dt on supported segments. Verify
  `distance(next,prior)<=speed*dt`, pause/far waits, stale ticket/owner/death/travel
  invalidation, and exact checkpoint respawn with no fabricated arrival.
- [x] Test the command and motion callers together; claims follow actual escort.

## 3. Playable host, readable choices and visible consequences

Files: `src/earth-gate-ui.js`, `src/earth-gate-art.js`, `src/app.js`,
`src/rpg-ui.js`, `src/world.js`, `src/shell.html`, `build.py`, targeted host tests.

- [x] Wire current-character commands and actual App ticks. Retain reached motion
  on save refusal; expose retry rather than silently moving the saved checkpoint.
- [x] Present entry, evidence, exact costs/reward, choice, lead/resume/waiting,
  retry, outcome and fee through the existing Journal/Map/E interaction paths.
- [x] Draw three actual projected travellers and distinct final lane/screen using
  existing humanoid/primitive APIs. Keep navigation clear, quiet motion supported
  and both cameras available. No reward or waypoint from a render callback.
- [x] Regenerate identical HTML after integration and verify missing-module refusal.

## 4. Earned journeys, regression and delivery

Files: `tests/gate_captain_journey.cjs`, `tools/gate_captain_browser.py`,
`tools/verify.py`, focused browser contract tests, continuity/evidence records.

- [x] Command-earn fresh blade, crafted bow and completed-story veteran cases;
  follow both supported paths and preserve complete unrelated state. Save/reload
  after preparation, a middle checkpoint, arrival and payment.
- [ ] Verify real UI/ordinary movement, group pixels, both cameras and whole
  browser persistence in isolated synthetic profiles under existing RAM guards.
- [ ] Run current source/full relevant native gates with unchanged deadlines;
  retain failures/skips. Review exact remote source in reused qualification space
  when the earlier grazer worker releases it. Do not conflate that with fresh clone.
- [ ] Push a stacked review PR with exact base/head, commands, outcomes, migration,
  actual small footage when possible and remaining human questions. No main merge.
