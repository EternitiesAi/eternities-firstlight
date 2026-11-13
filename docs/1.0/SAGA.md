# the saga ... the main story's spine (contract for every lane)

one new world-level owner, `state.saga`, added the way `earthWildSigns` was: optional on load (absent = inferred from
the save's existing progress), strict `validate`, no world version bump. module `src/saga.js` exports `G.RealmSaga`.
every story lane marks its beats through this api and reads its gates from it. nobody else invents main-path state.

## the acts and beats (main path, in order)

| beat id | act | what happens | where | completes when |
|---|---|---|---|---|
| `kit` | I the valley | oren's expedition kit | oren's workshop | `adventure.started` |
| `hart` | I | the hollow hart falls; the feather lies on its dais | the rootbound underways | `adventure.relic` |
| `envoy` | I | the envoy at the spring; **the prophecy is spoken** | the spring | `adventure.angelSeen` and saga prophecy `spring` heard |
| `feather` | I | the envoy shows you the feather's sight: true roads gold, counterfeit roads ash red | the spring | saga `feather.unlocked` |
| `road` | II the road | sunward road, tessa's caravan, the sunscar ram | sunward road | road chapter complete |
| `beacon` | II | the beacon; **regent sighting 1**: a smiling stranger offers tessa "a road that never breaks" | the beacon | beacon complete and regent sighting `beacon` |
| `bellweather` | II | rowan's bell, the hushbound keeper | bellweather crossing | crossing complete |
| `night` | III the night the warning failed | evacuate travellers; the severing device; **briar is taken**; a long quiet after | bellweather, at night | saga mark `night` |
| `hell` | IV the stolen pattern | hell: the trail of the stolen pattern, the regent's foundry; **regent sighting 2** | hell | hell campaign complete (rewritten) and sighting `foundry` |
| `heaven` | IV | heaven: arrive in peace (no hostiles for the first area), the envoy's home, **the prophecy reread**; then the counterfeit relay turns rescue corridors hostile | heaven | heaven campaign complete and prophecy `heaven` heard |
| `witness` | IV | the drowned witness: atlantis proves the pattern was stolen, the cosmos shows the cure (independent anchors); **regent sighting 3** | atlantis, then cosmos | atlantis and cosmos complete and sighting `confluence` |
| `nearshore` | IV | the nearshore: the regent offers a faultless briar; you know the real one by the habit you actually had; briar returns | the nearshore | saga briar state `returned` |
| `finale` | V firstlight | the regent of ash at the spring junction: phase 1 break the echo-ledger chains, phase 2 the merged valley, phase 3 refuse invulnerability | home valley | saga `finale.won` |
| `epilogue` | V | the valley changes in 5+ places; ilan plays; credits | home valley | saga `credits` |

after `epilogue`: `postgame` is true, the realms stay open as free roads, side work remains.

gates (`RealmSaga.allowed(world, gate)`): `night` after `bellweather`; `hell` after `night`; `heaven` after `hell`;
`atlantis` and `cosmos` after `heaven`; `nearshore` after `witness`; `finale` after `nearshore`. existing realm trails
stay the doors into each realm, but their eligibility also asks the saga. a save that already holds later progress is
never blocked from what it already did (inference keeps it whole).

## state (world-level, `state.saga`)

```
{ version: 1,
  beats: { <beatId>: { day } },              // beats the saga itself marked (derived beats are read live)
  regent: [ 'beacon' | 'foundry' | 'confluence' ],
  prophecy: [ 'spring' | 'heaven' ],
  feather: { unlocked: bool, uses: int },
  briar: { state: 'with' | 'taken' | 'nearshore' | 'returned', habit: { <placeId>: count }, takenDay: int|null },
  echo: { coercive: [id], freeing: [id] },   // filled from existing dispositions when the finale opens
  finale: { phase: 0..3, won: bool },
  credits: bool, postgame: bool }
```

## api (`G.RealmSaga`)

- `fresh()`, `validate(raw, world)` (strict, throws `Invalid saga: <field>`), `infer(world)` (old saves).
- `done(world, beatId)`, `current(world)` -> `{ id, act, title, detail, place: { room|null, x, z, label } } | null`.
- `allowed(world, gate)`.
- `mark(sim, beatId)` (owning lanes only, idempotent, refuses out of order, writes a journal event).
- `regentSeen(sim, sightingId)`, `prophecyHeard(sim, readingId)`, `unlockFeather(sim)`, `featherUse(sim)`.
- `briarTaken(sim)`, `briarReturned(sim)`, `recordHabit(sim, placeId)` (the habit recorder; tick also counts where you
  stop with briar beside you for 4+ seconds outdoors).
- `habitPlace(world)` -> the place id briar's real self goes to in the nearshore test.
- `echoLedger(world)` -> `{ coercive: [{ id, line }], freeing: [{ id, ally, line }] }` from hell/heaven/atlantis/cosmos
  dispositions and earth choices (see `earth-homecoming-data.js` evidence()).
- `finalePhase(sim, phase)`, `finaleWon(sim)`, `rollCredits(sim)`.
- `tick(sim, dt)`.

## definition of done for 1.0 (checked line by line before release)

1. a fresh character goes title -> credits through real commands in the bot journey; a human pace estimate of 2.5-4 h.
2. the main path never requires a fee, a claim or optional side work.
3. boss hp and damage rise along the main path; the regent is the hardest fight (about 1,200 hp over three phases).
4. the regent appears three times before the finale; the prophecy is spoken at the spring and reread in heaven.
5. the feather's sight is used in at least three main beats.
6. briar is taken, returns through the nearshore test, and acts in the finale; old saves are not broken.
7. no player-visible text contains: "not a claim", "provisional", "prototype", "realm 10", "luna", "epoch", "fee" on the
   main path (a grep test enforces it).
8. heaven's first area spawns no hostile for its opening walk.
9. the finale has three distinct phases and changes visibly with the echo ledger.
10. after the credits the valley differs in 5+ places.
11. title screen, continue, settings (volume, text size, keys, motion), pause, credits all exist and work.
12. original score and real sound effects; no code-made beeps where a real sound exists.
13. 30 fps or better on the box gpu at balanced in both cameras; the page loads offline with no network.
14. the full verifier is green on the box at the release head.
