# ET07: The Tournament After the Rain

Frontier check: 2026-10-14 | sweep: daily-2026-10-13-frontier-sweep.md@3fd60d1a9bad14f01156b56c04fa5b359ef6d88f | lane: Firstlight | result: no delta. Index527dc1ef575f1677813214b77fa7d9e62f23ca9e; no newer committed sweep. No cited provider/tool was adopted.

Implementation branch: `gameplay/tournament-after-rain-20261013`, based on PR79
head `ba6fe9fa6a93cfadf075bf085a875dc0f63c6050`. This is unfinished development.
PR79 remains separately reviewable; its native art check is still pending. The
independent STATION remains frozen at PR78 delivery88b30bf while MASTERWORK_FULL01
runs. No browser or heavy parallel qualification may compete with that worker.

The earlier plan to wait before any integration is superseded for **source work
in this separate review branch only**. The verified clean ROOT and independent
frozen STATION allow progress without changing the build under test. All native
and exact remote acceptance remain separate requirements. No extra full copy.

## Canon and playable design

Canon: supplied `EARTH_DESIGN_AND_PROTOTYPE_BLUEPRINT_2026-09-14.zip`, entry
`earth-design-2026-09-14/design/EARTH_STORY_EVENT_ATLAS.md`, ET07 lines74–82.
A civic tournament after rain declares its rules and eligibility, provides
competitive/noncompetitive participation, and awards distinction from accepted
outcomes rather than wealth or moral allegiance. Names, timing, scoring and
location below are provisional Codex adaptation.

Build a three-exchange judged exhibition on Hearthwater's north common. One
point for bracing or avoiding each declared strike; one for a primary reply
released and landed in its white-pennant opening. An early-released attack
forfeits the reply point only if it lands. Misses/walls do not score or foul.
Late arrivals cannot revoke a closed exchange. Starter and veteran equipment
retain the same existing primary cadence/reach per family; damage output,
health, sockets, class and upgrades cannot buy points. No gear swaps or HP loss.

The current seven weapon definitions at XP0/260/9999 passed21 profile probes.
The proposed circle at(-5,-32), radius4.5m, passed1,088 current-ground samples
and entry segments. Actor/prop placement and actual camera visibility remain
unqualified. The peaceful Hearthwater scene currently refuses combat/projectiles;
enable a roster and clearance only for an actual owned accepted bout. Rendering
a target alone cannot make it usable by a bow.

Three finite bronze/silver/gold distinctions per family at2/4/6 points. Replays
improve the best score, with no XP/currency/material/item payout. Observation
grants no competition medal. Initial kit is the only progression gate; no forced
class or soul choice. Leaving/reloading withdraws an unproven current attempt,
without deleting recorded results or deciding broader offline-world loss policy.

## State, ownership and migration contract

Stable ID: `earth-tournament-after-rain-v1`; rounds: `rain-edge`, `wide-ribbon`,
`last-pennant`; medals: `rain-bronze`, `rain-silver`, `rain-gold` in each family.
Adventure13→14 adds a strict `earthTournament1` record: issued/closed serials,
best score and completion count by family. Exactly one run may be outstanding.
Old13 saves lacking the record add only its empty default. Ambiguous pre-schema
tournament data must refuse rather than be silently erased or backfilled.
World9, Arsenal1, stored XP1–5/9999 and old browser keys remain unchanged.

The live bout binds Simulation/state/adventure/character, current writer context,
weapon and run. It owns opaque attack tokens created only after real admission,
and consumes them only on accepted melee or swept projectile contact. Menus,
pause, withdrawal and owner/scene/weapon changes need explicit handling. Neither
UI/art nor a damage number can assert a scored contact. No ordinary defeated/drop
entry is written. A pure model receipt is not proof of these production guards.

All record writes use checked candidate snapshots and the existing character
saver. Validate context before and after the writer; refuse asynchronous, failed,
mutated or stale adoption. A refused result leaves the completed live proof
retryable. An adopted closed run cannot pay again with a new request ID. Preserve
all prior owners, gear/socket/fitting/history, companion, housing, notes and music.

Source owners: tournament model/rules/UI/art, small explicit Adventure/Arsenal/
Combat/app/RPG/build hooks, strict migration and real command-earned tests.
Keep competing controls to primary, target/auto, Brace and movement; intercept
non-event powers and consumables before costs or story effects. Explicit gear or
character changes release the bout without restoring a stale copied world.

## Acceptance still required

The staged model has25 focused passes and retained original failures. That does
not qualify this integration. Require atomic-save/ownership/migration negatives,
real blade/bow/veteran rule journeys, native visible entry/controls/results,
whole-browser cold readback, both cameras and reduced motion, valid hit/foul cues,
regenerated identical HTML, current relevant/full verification and exact pushed
remote reproduction. Obtain human timing/fun acceptance separately. Keep original
failures, current gate limits and bounded D evidence. No main merge/deploy, paid
work, VM/Claude/personal-save access, extra copies or heartbeat resume.


## Integrated checkpoint, 2026-10-14

The model is now connected to actual Adventure/Combat/Arsenal contact admission,
scoped peaceful-Earth roster/clearance, live guard/evade/movement, the existing
character saver, and actual app/RPG controls. The world contains a small original
mechanical post, chalk boundary, locked amber ribbon, white pennant, rules stand
and steward. Journal/atlas/nearby context link the terms and results. Neither art
nor the UI owns scoring. No new textures, external asset pack or paid generation.

The earlier(-5,-32) proposal is superseded: it overlapped Gathering’s existing
lantern(-5.8,-35). TOURNAMENT_GEOGRAPHY_RED01 preserves that negative. Final centre
is(5,-31.5), radius4.5; giver(5,-27.6). New current geometry checks sample1,088
body points and entry rays and ensure existing hospitality/roadwork sites lie
outside the circle. Previous staged feasibility receipts still describe their
old proposal; they are not relabelled as proof of this placement.

Evidence below is under
`D:/07-GAMES/Firstlight/artifacts/village-resident-articulation-20261013/next-gate`:

- TOURNAMENT_FOCUSED_FINAL01:47 passed/0 failed/0 skipped across model, production
  writer/migration, real combat, CPU UI and geography. Includes actual walking
  responses, ordinary movement/Brace, true bow contact and a moving-body miss.
- TOURNAMENT_EARNED02: blade11 commands/34 actions, crafted bow27/47, veteran10/32;
  all pass with no pose/inventory/score/damage grants. Two intentionally completed
  exhibitions and one withdrawn cold attempt each. Exact preserved veteran input
  SHA256 eaefe57933fa0cd67d3db08d8a9a1014eab03a92c761418e5e85c8d3332034a2.
  Sources are labelled earned fixtures, never personal saves. CPU/in-memory only.
- TOURNAMENT_PRIOR_OWNERS01:126 passed/0 failed/0 skipped for selected Briar,
  local-life, home-history, WildSigns, homecoming and event movement boundaries.
- TOURNAMENT_PRIOR_MIGRATION01:181 passed/1 failed/0 skipped. The sole failure
  was a remaining literal Adventure13 assertion in the class test. It was
  advanced to14; the class tests subsequently passed in INTEGRATION02(59/0/0).
  Earlier PRIORMIGRATION_RED01 retained95 passes/7 failures from obsolete schema
  assertions and synthetic downgrade fixtures still carrying a future owner.
  The real strict migration was not relaxed. Other earlier focused totals overlap
  these checks and must not be added as independent full-gate coverage.
- TOURNAMENT_NATIVE_ORACLES01:119 tests,18 failures/2 errors/1 explicit-cohort skip.
  All18 failures and2 errors occur in the two roadkeeper source-epoch classes
  because the current runtime was not yet committed. The clean-runtime guard
  correctly precedes their deeper assertions. No guard was removed. Rerun those
  classes after committing; the other CPU migration/preflight cases passed.
- COMBAT_RED01 was an invalid synthetic fixture missing its original return
  checkpoint, refusing entry. After giving it a legitimate labelled return point,
  COMBAT_RED02 had1 pass/6 failures and detected the genuinely missing combat
  integration. COMBAT01 then passed38; later focused suites extend that coverage.
- A first helper-edit script omitted explicit UTF-8 and failed before mutation;
  the explicit-UTF-8 retry completed. BUILD01/02 remain earlier build receipts.
  BUILD03 is the current identical pair:3,485,103 bytes each, SHA256
  d8266f395b46c766c7197c12b84660fb59c778a7b32cc8926b0c2002affff698.

No new native browser, recording, persistent profile or full clone was created
for this event. No new complete verifier was run alongside the frozen baseline
browser gate. Source commit, complete current source gate, native event caller,
actual UI/camera/persistence footage, exact fresh remote qualification,
independent review and human acceptance remain separate unfinished work.
