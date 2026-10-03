# Elderweald local dialogue, 2026-10-03

This slice gives the two existing local people concise, useful recognition of the player's saved work. Rill remains a practical forestkeeper; Sela remains optional wetland help. Neither adds a quest, class, faction, relationship or reward. Their names and these lines are original provisional adaptations, not recovered founder-authored characters or dialogue.

The source baseline is Root `13e0a0e67063fc3b412de9cbb5ff2656ba4387bb`, merged into the isolated rules branch as `a881871` with an identical tracked tree. Ownership is only the new `src/earth-expedition-dialogue.js`, its focused test, and this note. Root owns loading, proximity, UI rendering and actions. No shared runtime, UI, save, art, build or old resident file was edited.

## Pure presentation contract

The IIFE and CommonJS export `RealmEarthExpeditionDialogue = {people, reading}`. `people` is a frozen object containing exactly the existing `elderweald-rill` / `Rill · forestkeeper` and `elderweald-sela` / `Sela · herbalist` identities. A caller reads:

```js
const speech = RealmEarthExpeditionDialogue.reading(
  point.id,
  sim.state.earthExpedition,
  sim.state.adventure.earthBinding
);
// speech: {speaker, title, lines, hint}, or null when refused.
```

Every successful call returns a fresh, deeply frozen reading: two–four lines, each at most180characters, and one next-action hint at most240characters. The optional absent ledger normalizes through production `EarthExpedition.validate` to fresh work. Unknown people, malformed ledgers, incomplete claims and incompatible binding records return `null`. A nonempty binding must name a canonical weapon/kind and accompany a claimed story. The API has no full adventure/ownership argument: Core remains responsible for canonical ownership and the durable claim. Reading a record cannot certify how an offline editable save was earned.

The module reads no player name, XP, wallet, inventory, equipment selection, live actor, clock, camera, pause or access preference. In particular, ledger/binding alone cannot determine the capped XP amount actually credited, current supplies, or whether the bound weapon is equipped. The lines do not claim those facts. Canonical weapon names are read from `Adventure.GEAR` only when a nonempty binding is presented; load after `earth-expedition.js` and call after Adventure initialization.

## Situation coverage and wording

Rill and Sela each cover fresh invitation, acceptance/load reading, the two physical preparations, watercourse check, crossing encounter, root reading, bank encounter, actual brace placement, delivery, ready/unpaid work and claimed work. The chosen stormfall or managed-coppice allocation receives distinct recognition as soon as its preparation is recorded, and that choice remains recognized during later patrols. Only a validated paid story or patrol uses “was paid” and the exact fixed sunmarks/ore/material figures; the ready state explicitly remains unpaid and asks for a separate claim at Rill.

Patrol dialogue uses the current accepted circuit number and its five actual next actions. It says that the original brace and living organism remain, rather than repeating a repair or resetting the organism for another payment. The finite record boundary avoids offering an unavailable next circuit. Optional completed binding recognition names its actual recorded weapon/kind without auto-equipping, granting another binding, assuming a refill, or spending anything.

Hints describe current supported routes: the two camp preparations, the bridge's north approach and real rails, the root reading at the corridor's north mouth, the open bank pocket, the brace beyond the walls on the east side, and the glade southeast of the passage. Sela distinguishes close blade reach from farther bow reach, clear arrow lanes/moving misses, stationary autoattack, and Brace or movement during the tell. These are advice, not assertions about a live foe's current position or a new damage restriction. Sela neither records the physical watercourse action nor collects the payment.

## Attribution and exclusions

The recovered design sources are `C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/realms/earth-design-2026-09-14/design/EARTH_STORY_EVENT_ATLAS.md`: ET11 “Roots Under Stone” at lines116–125 supplies the living organism/alternate-support premise; ET12 “A Winter's Wood” at lines126–134 supplies limited stormfall/managed-coppice allocations and the protected refuge/watercourse. `EARTH_WORLD_BIBLE.md` E03 at lines76–88 describes Elderweald wetlands, glades, incorporated masonry and the organism as a living route support rather than an enemy. Those are design premises, not these sentences, names, rewards or completed gameplay evidence.

The current implementation sources are `earth-expedition.js` for exact terms/stable steps/claims/binding, and `elderweald-world.js` for the existing points and route geography. No archived script or acquired code was executed. The broader anchor saga, profession progression, blue-fox event, biosphere simulation and online authority remain outside this slice. No NPC biography, ancestry, cosmic oracle, main-character identity or founder endorsement is invented.

## Focused qualification

`node --check src/earth-expedition-dialogue.js`, `node --check tests/earth_expedition_dialogue.test.cjs` and `node tests/earth_expedition_dialogue.test.cjs` pass. There are14 focused cases and318 frozen-output checks, including every story prefix/branch,512 story subset/claim combinations with strict refusals, every patrol prefix at several run counts and the finite limit, every canonical binding weapon/kind, false binding claims, exact real point identities/support, route direction and blade/bow constraints, a full production world remaining byte-identical across repeated reads, browser-IIFE/CommonJS parity without DOM globals, early browser registry refusal and cached CommonJS fallback without rewriting globals. No test failure occurred in this slice.

These are synthetic pure-presentation and source/contract checks, not new earned progression or native conversations. Root must integrate and qualify the real nearby-person controls, escaped rendering, keyboard/focus behavior, paused/reduced-motion UI and readable presentation in both cameras. No browser, GPU, full suite, media capture, save-profile operation, network action or publication was performed by this slice; human interpretation remains unmeasured.
