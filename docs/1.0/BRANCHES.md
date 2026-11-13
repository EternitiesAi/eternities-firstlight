# the branches ... the implementable spec

story architect, 2026-11-13. read `STORY.md` for why; this file is what to build. the spine in `SAGA.md` does not
change: 14 beats, the gates, the api. branches change lines, who shows up, what a place looks like and how the finale
is put together. they never add a region and never block the main path.

every line the branches need is already written in `src/story-script.js` (`G.RealmStoryScript`). a lane calls
`RealmStoryScript.forStep(owner, step, sim.state)` (or `scene(id, sim.state)`) and prints what comes back:
`{ id, beat, where, lines: [{ who, speaker, text }], choice: { id, prompt, options: [{ id, label, sets }] } | null }`.
an unknown id returns `null`, so a lane's own fallback text keeps working until it is wired. `speaker` is the name to
print (`''` for narration); `who` is the cast key. use `forStep`: a bare step id such as `disposition` belongs to two
realms and `scene('disposition')` returns `null` on purpose (`src/hell-campaign-ui.js:9` needs `forStep('hell', id, state)`).

## 1. the choice points

seven choices and one running record. each is asked once, is a lasting deed (a second, different answer is refused),
and is read in at least two later beats, the finale and the epilogue.

| # | choice | beat | scene that asks | field written |
|---|---|---|---|---|
| 1 | Tessa's waybill | `beacon` | `beacon.stranger.answer` | `saga.choices.tessa` |
| 2 | the herald's cinder (exists) | `beacon` | `beacon.herald` | `adventure.beacon.relic` |
| 3 | the quiet engine | `night` | `night.device` | `saga.choices.device` |
| 4 | the people held at the foundry (exists) | `hell` | `hell.choice` | `hellCampaign.choice` |
| 5 | the garden's welcome (exists) | `heaven` | `heaven.choice` | `heavenCampaign.choice` |
| 6 | the witness: the harbour record, and Avar's piece (exist) | `witness` | `witness.choice`, `witness.avar` | `atlantisCampaign.choice`, `cosmosCampaign.choice` |
| 7 | the two foxes, then the last answer | `nearshore`, `finale` | `nearshore.heel`, `finale.offer`, `finale.last` | `saga.briar.falseTrusted`, `earthHomecoming.finale.offer`, `saga.finale.ending` |
| a | did you hear him out (three times) | `beacon`, `hell`, `witness` | `beacon.stranger`, `hell.pattern`, `witness.confluence` | `saga.heard.beacon`, `saga.heard.foundry`, `saga.heard.confluence` |

the ledger sorts every choice by one question: **did you choose a kept thing over a free one** (his cinder, his
permit, his road for Tessa, his engine in your pack, a writ left standing, the fox that never strays). it is not a
goodness score, and the Regent's reading of a choice can be unfair. that is him.

## 2. state

### 2.1 the saga record (exact shape; version stays 1)

new fields are marked `+` below. each is optional on load and reads as its default when absent, the way the witness
lane added `returnedDay` and `homeDay`. no world version bump.

```json
{ "version": 1,
  "beats": {},
  "regent": [],
  "prophecy": [],
  "feather": { "unlocked": false, "uses": 0 },
  "briar": { "state": "with", "habit": {}, "takenDay": null, "returnedDay": null, "homeDay": null,
             "falseTrusted": false },
  "choices": { "tessa": null, "device": null },
  "heard": { "beacon": null, "foundry": null, "confluence": null },
  "echo": { "coercive": [], "freeing": [] },
  "finale": { "phase": 0, "won": false, "ending": null },
  "credits": false,
  "postgame": false }
```

- `+ briar.falseTrusted`: boolean. `true` only when `briar.state` is `nearshore` or `returned`.
- `+ choices.tessa`: `null | "refused" | "hers" | "signed"`. non-null needs `regent` to include `beacon`.
- `+ choices.device`: `null | "open" | "sealed" | "carried"`. non-null needs the `night` beat marked.
- `+ heard.<sighting>`: `null` (not asked yet) `| true` (heard him out) `| false` (cut him off). non-null needs that
  sighting in `regent`.
- `+ finale.ending`: `null | "open" | "kept" | "answered"`. non-null needs `finale.won`. `"kept"` needs
  `earthHomecoming.finale.offer === "taken"`; `"open"` and `"answered"` need it `"refused"`; `"answered"` also needs all
  three `heard` values `true`. on load, a won save with no `ending` reads `"kept"` when its offer was `taken`, else
  `"open"` (so a save that won before this field existed never fails).
- `validate` names each new failure: `Invalid saga: choices`, `heard`, `briar false trust`, `finale ending`.
- `infer` (old saves) leaves every new field at its default.

### 2.2 new saga commands and api

| command (payload) | api | rule |
|---|---|---|
| `choose` `{ key: "tessa" \| "device", value }` | `choose(sim, key, value)` | once. the same value again replays `already`; a different value fails with "That is done, and it stays done." `tessa` needs `beacon` in `regent`; `device` needs the `night` beat. writes a journal event (the option's label). |
| `regent-heard` `{ id, heard }` | `regentHeard(sim, id, heard)` | once per sighting; needs `id` in `regent`. |
| `briar-false` `{}` | `briarFalse(sim)` | sets `falseTrusted` true. allowed while briar is `taken` or `nearshore` with `witness` done. idempotent. |
| `finale-won` `{ ending }` | `finaleWon(sim, ending)` | replaces the no-argument form; `ending` defaults to `"kept"` when the offer was taken, else `"open"`. checks 2.1. needs `finale.phase === 3`. the journal line is the first line of `finale.ending` for that ending. |
| | `ending(world)` | `saga.finale.ending` or `null`. |

**order inside a sighting (fixes the only ordering trap).** the prompts are shown while the sighting scene is open;
nothing is saved until it closes. on close send, in this order: `regent` `{ id }`, then `regent-heard` `{ id, heard }`,
then (beacon only) `choose` `{ key: "tessa", value }`. one save.

`rollCredits` writes the journal line from `epilogue.credits` (it differs by ending).

### 2.3 the echo ledger (the table in `saga.js`)

the ledger's `line` for every row comes from the script: `scene('finale.chain.' + id)` for a chain,
`scene('finale.ally.' + id)` for the person who comes. rows to change or add:

| id | source | value | kind | ally | change |
|---|---|---|---|---|---|
| `beacon-sealed` | `adventure.beacon.relic` | `sealed` | freeing | Mara | ally was Tessa |
| `beacon-renounced` | `adventure.beacon.relic` | `renounced` | freeing | Mara | ally was Tessa |
| `cosmos-bounded` | `cosmosCampaign.choice` | `bounded-account` | freeing | Avar | ally was Anik |
| `tessa-refused` | `saga.choices.tessa` | `refused` | freeing | Tessa | new |
| `tessa-hers` | `saga.choices.tessa` | `hers` | freeing | Tessa | new |
| `tessa-signed` | `saga.choices.tessa` | `signed` | coercive | | new |
| `device-open` | `saga.choices.device` | `open` | freeing | Rowan | new |
| `device-sealed` | `saga.choices.device` | `sealed` | freeing | Oren | new |
| `device-carried` | `saga.choices.device` | `carried` | coercive | | new |
| `nearshore-false` | `saga.briar.falseTrusted` | `true` | coercive | | new |

`earth-watch` and `earth-custody` stay for old saves that carry the retired homecoming choice; their lines are in the
script. the other rows keep their ids, kinds and allies.

**pairing (finale `plan`).** a freed person breaks the chain of their own group if there is one (`hell-unbind` can
only meet a hell chain if the choice were different, so in practice: Tessa never breaks a Tessa chain), else the
oldest unbroken chain, else they simply arrive and stand at their site. every `finale.ally.*` line is written to work
with or without a chain. when the first freed person arrives, play `finale.allies` once.

### 2.4 the facts the script reads

`RealmStoryScript.facts(world)` turns a save into these. every `when` in the script names one of them.

| fact | read from | values |
|---|---|---|
| `bonded` | `adventure.companion.bonded` | `true`, `false` (old saves that never met Briar) |
| `cinder` | `adventure.beacon.relic` | `null`, `accepted`, `sealed`, `renounced` |
| `tessa` | `saga.choices.tessa` | `null`, `refused`, `hers`, `signed` |
| `device` | `saga.choices.device` | `null`, `open`, `sealed`, `carried` |
| `hell` | `hellCampaign.choice` | `null`, `unbind`, `divert`, `license` |
| `heaven` | `heavenCampaign.choice` | `null`, `accessible-assist`, `broadened-activation` |
| `sea` | `atlantisCampaign.choice` | `null`, `publish`, `limited`, `license` |
| `stars` | `cosmosCampaign.choice` | `null`, `public-record`, `bounded-account` |
| `heardBeacon` | `saga.heard.beacon` | `true` only when the field is `true` |
| `heardFoundry` | `saga.heard.foundry` | same |
| `heardConfluence` | `saga.heard.confluence` | same |
| `heard` | counted | `0..3`, how many of the three are `true` |
| `falseFirst` | `saga.briar.falseTrusted` | `true`, `false` |
| `offer` | `earthHomecoming.finale.offer` | `null`, `refused`, `taken` |
| `ending` | `saga.finale.ending` | `null`, `open`, `kept`, `answered` |
| `chains` | counted | how many coercive rows of 2.3 the save holds (legacy `earth-custody` not counted) |
| `freed` | counted | how many freeing rows of 2.3 the save holds |

two tokens are filled in text: `{briar}` (the companion's chosen name, `adventure.companion.name`, default Briar) and
`{habit}` (the name of the landmark `RealmSaga.habitPlace(world)` returns, first letter lower-cased, default "her old
spot").

## 3. each choice: where it is asked, what it writes, where it is read

### 3.1 Tessa's waybill (`beacon`, at the Sunward Beacon, inside the sighting, before the three breaches)

the stranger offers Tessa "a road that never breaks" for one signature. she asks what you would do. it is advice;
she acts on it herself.

- asked in `beacon.stranger.answer`. prompt: "Tessa is holding the waybill. It is grey, and beautifully written."
- options: `refused` "I would tear it up" · `hers` "It is your road. You decide" · `signed` "I would sign. You have
  buried enough"
- records: `choose` `{ key: "tessa", value }` (order in 2.2).
- read:
  - `beacon.tessa` (at once).
  - `night.fall`, `night.across`: refused, her second wagon is on the honest road in the flood and goes in at the
    ford. hers, she had the pencil out. signed, the second wagon and Pell are on his low road, dry, and will not come
    in.
  - `hell.neris`: signed, hers is one of the names; refused or hers, a pencilled name struck out.
  - `hell.after`: signed and `unbind`, her name goes with the rest and Pell is left on a dark hillside.
  - `finale.offer`: he quotes your advice back at you (refused and signed).
  - finale: `tessa-refused` and `tessa-hers` bring Tessa; `tessa-signed` is a chain whose line knows whether Hell cut
    her loose. hers, she also blocks his road in phase 2 (`finale.merged.road`).
  - `epilogue.lookout`: a wagon that pulls to the left, the Honest Road Company, or her name off (or still on) his book.
  - place (new epilogue row `wagon`, at the lookout): one new wagon (refused), three wagons and a painted board
    (hers), one wagon when signed and free, none when signed and still on the book in the kept ending.
- cost of each: refused costs her a wagon. signed keeps her people dry and puts her on his book. hers costs nothing
  you can see, and gives you nothing to stand on: she decides, a month later, without you.

### 3.2 the herald's cinder (`beacon`, exists: `beacon-relic`, `soul-purify`)

- asked in `beacon.herald`. options keep their command ids: `accept` "Keep the cinder" · `seal` "Seal it away".
  renouncing later stays where it is (the beacon stone).
- read:
  - `beacon.cinder` (at once): Briar moves to your other side when you keep it.
  - `bellweather.rowan`: he will not have the coal in his court (accepted); he approves of the jar (sealed).
  - `hell.arrival`, `hell.veyr`: Istra tells you to cover it; Veyr says you are on the payroll, or sneers at the jar.
  - finale: `beacon-cinder` chain, or Mara comes (`beacon-sealed`, `beacon-renounced`).
  - `epilogue.observatory`: the jar, the dead coal you still reach for, or the scorch labelled "put down".

### 3.3 the quiet engine (`night`, on the bridge the morning after)

the broken severing device. no new night state: the night owner offers this prompt whenever `night.envoy` is true,
`saga.choices.device` is `null`, and the player stands at `DEVICE` in the crossing (interact "E · The quiet engine").

- asked in `night.device`. prompt: "The quiet engine. It is yours to place."
- options: `open` "Hang it under the bell, in the open" · `sealed` "Lock it in the observatory" · `carried` "Carry it
  yourself"
- records: `choose` `{ key: "device", value }`.
- read:
  - `night.device.after` (at once).
  - `hell.neris`: she answers each (she would like to see it under a bell; tell the scholar the seam is the hinge;
    she can hear it ticking in your pack and it was hers).
  - `heaven.home`: the envoy answers each.
  - `nearshore.offer`: carried, he suggests you cut both roads with it.
  - finale: `device-open` brings Rowan, `device-sealed` brings Oren, `device-carried` is a chain that hangs on you.
  - `epilogue.bridge`: under the bell, taken apart (it is a hinge, as Neris said), buried under the arch, or silent in
    your pack (kept ending).
  - place (new epilogue row `engine`, drawn from the morning it is placed): under the Bellweather bell (`open`), under
    glass in the observatory (`sealed`), nothing (`carried`). the people lane's severing-device art, small.

### 3.4 the people held at the foundry (`hell`, exists: `hellCampaign.choice`)

412 signed names hold his road. nobody is beaten; they are fed and warm and cannot leave. the ids stay.

- asked in `hell.choice`. options: `unbind` "Cut the writ. Everyone walks" · `divert` "Take the forty out quietly" ·
  `license` "Sign them over to the Ninth Office"
- cost of each, said in the scene: unbind drops his road dark under whoever is on it tonight. divert strands nobody
  and is choosing who counts. license keeps the road up and four hundred people fed, and they are still names on a road.
- read:
  - `hell.after` (at once).
  - `heaven.garden`: four hundred at the garden gate, forty under a hood, or a letter of thanks.
  - `heaven.choice`, `heaven.after`: with unbind the four hundred are standing at the gate while you choose.
  - `witness.harbour`: with unbind, carriers who were on his low roads walked in on foot, furious and free.
  - finale: `hell-unbind` brings Neris; `hell-divert` and `hell-license` are chains.
  - `finale.ending` (answered) and `epilogue.garden`: Neris brings the book; or writes to the line; or the Ninth
    Office sends its letters.

### 3.5 the garden's welcome (`heaven`, exists: `heavenCampaign.choice`)

the relay knew the three-note ceremony. both answers keep the garden open; they differ in whether anyone asks.

- asked in `heaven.choice`. options: `accessible-assist` "Keep the ceremony. A keeper answers those who ask" ·
  `broadened-activation` "A broad plate. Anyone may press"
- read:
  - `heaven.after` (at once).
  - `witness.harbour`: Damar has heard how the gate answers now.
  - finale phase 1: Rielle comes either way (`finale.ally.heaven-*`).
  - finale phase 2, `finale.merged.stair`: with `accessible-assist` Calen refuses the Regent the heaven stair (he
    waits out one extra `pause` at the `ROUTE` waypoint nearest `SITES.heaven`, a free opening); with
    `broadened-activation` he takes the stair, and in phase 1 the freed arrive sooner (`freedDelay` 1.4, not 2.2). the
    two timing changes are optional; the lines alone carry the branch.
  - `epilogue.garden` (new epilogue row `stair`): a white stair to the garden, with a chair and a keeper, or with beans
    up the rail.

### 3.6 the witness (`witness`, exists: `atlantisCampaign.choice`, `cosmosCampaign.choice`)

the sea and the stars open together after heaven and may be played in either order; the script holds lines for both
orders (`witness.confluence` and `witness.trail` read `sea: null`).

- asked in `witness.choice`. options: `publish` "Post it on the harbour wall" · `limited` "Keep it for those who need
  it" · `license` "Take the permit". the permit has a real pull: his roads open to you, including the one the fox is on.
- asked in `witness.avar`. options: `public-record` "Let the marks speak" · `bounded-account` "Let Avar say his piece"
- read:
  - `witness.sea.after`, `witness.stars.after` (at once).
  - `witness.confluence`: the Regent answers both.
  - `nearshore.pier`, `nearshore.offer`: with the permit his road opens for you, and he says you are already a little
    bit kept.
  - finale: `atlantis-publish` and `atlantis-limited` bring Damar, `atlantis-license` is a chain, and in phase 2 the
    permit opens his own road for you (`finale.merged.road`). `cosmos-public` brings Anik, `cosmos-bounded` brings Avar.
    with `publish` the list of forty-one went up the river road, so Rowan and Damar call him Hollis.
  - `finale.ending` (answered): with `publish` the whole road reads the names with you; otherwise only the envoy does.
  - `epilogue.pier` (the page on the pier post, Ilyra's letters, or the unused permit) and `epilogue.observatory`
    (Avar holds one end of Mara's chain, or his diagram hangs by the door).

### 3.7 did you hear him out (three sightings)

each sighting carries a two-way prompt. order of commands is in 2.2.

- `beacon.stranger`: `hear` "Let him finish" · `cut` "That is enough". then `beacon.stranger.answer`.
- `hell.pattern` (shown in the `stabilize-service-engine` step, before that step is sent): `hear` "Let him talk" ·
  `cut` "I am not here to listen". then `hell.regent`.
- `witness.confluence` (at the `open-confluence` step): `hear` "Then say it. I am listening" · `cut` "You have had
  your hearings". then `witness.regent`. the cosmos lane fires `regentSeen('confluence')` on accept; keep that (he is
  seen across the gap in `witness.stars`) and send only `regent-heard` here.
- hearing him has a price where it can: in the foundry, a woman signs while you stand and listen (`hell.regent`,
  `hell.choice`). cutting him off is never punished and never rewarded.
- read: the answer scene at once; `hell.regent` (he noticed the beacon); `heaven.home` (Heaven's number; "I did not,
  once"); `witness.record` (her sentence beside his); `nearshore.offer` (two or more: "you know I mean it");
  `finale.rise` (his opening for 0, 1-2, 3); `finale.last` (all three unlock "Read him his first page").

### 3.8 the two foxes (`nearshore`)

- today the nearshore answers the nearest fox, and the kept fox sits at your heel, so one key press can pick her by
  accident. change: `E` on the fox at your heel opens `nearshore.heel` (prompt "The fox at your heel is waiting to be
  told."): `take` "Take her home" · `wait` "Not yet". only `take` sends saga `briar-false` and plays
  `nearshore.false`. `E` on the real fox needs no prompt and plays `nearshore.real`.
- read: `nearshore.real` (Briar looks at the ash), `finale.offer` (he reminds you), `finale.runs` (she checks that you
  are following her), the `nearshore-false` chain.
- the feather shows both foxes gold (`nearshore.offer` says so): the tool fails, the habit does not.

### 3.9 the last answer (`finale`)

- when phase 2 ends: restore the player's health to full, then open `finale.offer` (the fight stays frozen while it is
  open; the built rule already holds strikes until the offer is answered). options keep the finale lane's ids:
  `refuse` "Refuse him" · `take` "Sign". then `finale.answer`.
- `take`: there is no third fight. call `finaleWon(sim, 'kept')` at once, start the camera rise, play `finale.ending`.
  (today a taken offer leaves a 420 hp body that cannot hurt you; remove that.)
- `refuse`: phase 3 as built. when the body reaches 0 hp, before `finish` (a new hook, `last`; the built `down` line
  belongs to the end of phase 2 and maps to `finale.offer`): resolve `finale.last`. one option (`open` "End it"): take
  it without asking. two options (also `answered` "Read him his first page", when `heard` is 3): ask, fight frozen.
  then `finaleWon(sim, ending)`, the rise, `finale.ending`.

## 4. the endings

| ending | condition | what happens | what the valley shows |
|---|---|---|---|
| `open` · the open road | offer refused, last blow "End it" | you break the book. every page rises as a true road. he tells you they will all get lost. he comes apart. | the lane's six changes as built. windbells out of tune on purpose. the envoy gives her name. |
| `answered` · the first answer | offer refused, heard him all three times, last blow "Read him his first page" | you read him the forty-one. the envoy tells him she was late. nobody forgives him. "then who counts them." "everyone. badly. together." he closes the book himself; a bell keeper is left. | everything in `open`, plus a man on the Bellweather bridge who reads every name each dusk, counts people across, and lets them go; his voice reaches the concert. |
| `kept` · the kept valley | offer taken (you sign) | he does not die and you do not replace him. he writes you down: "received in good order: one traveller, one fox, one valley." | the valley is perfect and still. windbells ring true whatever the wind does; `lanterns` off; every road the pale colour of `grey-roads`; nothing breaks for Oren to mend; the envoy stands at the edge of his road each dusk saying your name; Briar is not at the workshop, she is out past the last lantern, waiting. |

- no ending is hidden behind skill: the player is healed before the offer, and signing is asked for in words.
- there is no way back from `kept` and no line promises one. the postgame is the same free roads, on his terms.
- `epilogue-data.js`: give each row an optional `ending` list. `lanterns`: `open`, `answered`. `grey-roads`: in `kept`
  it covers every road. `briar-curled`: `open`, `answered`; in `kept` add `briar-waiting` (kind `curled-fox`, at the
  lookout end of the valley road, `{ x: 42, z: 5 }`). add rows `wagon` (lookout, 3.1), `stair` (garden, 3.5), `engine`
  (3.3), `keeper` (Bellweather bridge, `answered`). the windbells row sits at the spring arch (as built). all text comes
  from the `epilogue.*` scenes. credits: the first card's line is `epilogue.credits`.

## 5. what each lane wires

`RealmStoryScript.STEPS` holds this map. a step marked **new** is a hook the lane does not have yet; everything else
is a step id, scene key or data id that exists today.

| owner (`forStep` first argument) | step → scene |
|---|---|
| `adventure` (`src/adventure.js`) | `start` → `kit.workshop` · `enter` → `hart.descent` · `rescue` → `hart.briar` · `hart` → `hart.fallen` · **new** `home` (first return to the workshop with the feather) → `hart.home` · **new** `envoy` (the first two `STORY` cards) → `envoy.arrival` · `envoy-prophecy` → `envoy.prophecy` · `envoy-feather` → `feather.sight` · `reward` → `feather.gift` · `road-enter` → `road.gate` · **new** `tessa` (first time near the cart) → `road.tessa` · `cart-repair` → `road.mended` · **new** `habit` (the first time any habit count reaches 3, a toast) → `road.spot` · `road-ram` (the ram falls) → `road.ram` |
| `beacon` (`src/beacon.js`) | `sighting` (`SIGHTING`) → `beacon.stranger` · **new** `sighting-answer` → `beacon.stranger.answer` · **new** `sighting-tessa` → `beacon.tessa` · `answer` → `beacon.door` · `herald` → `beacon.herald` · `relic` → `beacon.cinder` |
| `crossing` (`src/crossing.js`) | `met` → `bellweather.rowan` · `clapper` → `bellweather.clapper` · `keeper` → `bellweather.keeper` · `complete` → `bellweather.bell` |
| `night` (`src/night.js` `SCENE_LINES`) | `begin` → `night.fall` · `found-briar`, `found-tessa` → `night.found` · **new** `all-safe` (when the fifth traveller is across; `safe` fires per traveller and keeps its journal line) → `night.across` · `broken-briar`, `broken-you` → `night.bridge` · **new** `receipt` (appended to the same result) → `night.receipt` · `envoy` → `night.envoy` · **new** `bowl` → `night.quiet` · **new** `device`, `device-after` (3.3) → `night.device`, `night.device.after` |
| `hell` (`src/hell-campaign-data.js`) | **new** `arrive` (accept) → `hell.arrival` · `witness-record` → `hell.neris` · `tovan-account` → `hell.tovan` · `read-service-writ` → `hell.gate` · `challenge-veyr` → `hell.veyr` · `warden-resolved` → `hell.veyr-down` · `stabilize-service-engine` → `hell.pattern` · **new** `sighting` → `hell.regent` · `disposition` → `hell.choice` · `verify-route` → `hell.after` |
| `heaven` (`src/heaven-campaign-data.js`) | **new** `arrive` (first entry) → `heaven.arrival` · `witness-account` → `heaven.garden` · `envoy` (the envoy command, before the reading) → `heaven.home` · `reading` (the same command's result) → `heaven.reading` · `inspect-false-relay` → `heaven.turn` · `relay-disabled` → `heaven.seraph` · `arrangement` → `heaven.choice` · `verify-welcome` → `heaven.after` |
| `atlantis` (`src/atlantis-campaign-data.js`) | `receipt-conflict` → `witness.harbour` · `bearing-exposed` → `witness.guardian` · `custodian-stable` → `witness.record` · `disposition` → `witness.choice` · `verify-passage` → `witness.sea.after` |
| `cosmos` (`src/cosmos-campaign-data.js`) | `read-local-cost` → `witness.stars` · `disable-central-link` → `witness.meridian` · `accountability` → `witness.avar` · **new** `recognition` (after the choice) → `witness.stars.after` · `open-confluence` → `witness.confluence` · **new** `sighting` → `witness.regent` · `verify-open-bearings` → `witness.trail` |
| `nearshore` (`src/nearshore.js` `SCENES`) | **new** `pier` (within 9 of the pier, before `arrive`) → `nearshore.pier` · `arrive` → `nearshore.offer` · **new** `heel` → `nearshore.heel` · `false` → `nearshore.false` · `real` → `nearshore.real` · **new** `plain` (section 6) → `nearshore.plain` · `home` → `nearshore.home` |
| `finale` (`src/finale-data.js` `LINES`) | **new** `eve` (first night at the shared house after the nearshore) → `finale.eve` · `begin` → `finale.rise` · **new** `allies` → `finale.allies` · `runs` → `finale.runs` · **new** `stair` (the `ROUTE` waypoint nearest `SITES.heaven`), `road` and `briar` (any two later waypoints) → `finale.merged.stair`, `finale.merged.road`, `finale.merged.briar` · `down`, `offer` → `finale.offer` · `refused`, `taken` → `finale.answer` · **new** `last` → `finale.last` · `won` → `finale.ending`; chains and allies by echo id → `finale.chain.<id>`, `finale.ally.<id>`; the default chain → `finale.chain.spring` |
| `epilogue` (`src/epilogue-data.js` `CHANGES` ids) | `briar-curled` → `epilogue.workshop` · `windbells`, `spring-arch` → `epilogue.spring` · **new rows** `engine`, `keeper` → `epilogue.bridge` · **new row** `wagon` → `epilogue.lookout` · **new** `observatory` → `epilogue.observatory` · `lanterns` → `epilogue.pier` · **new row** `stair` → `epilogue.garden` · `amphitheatre` → `epilogue.concert` · `credits` → `epilogue.credits` |

small data and rules the lanes add:

- **the bowl.** while `saga.briar.state` is `taken`, the bowl by the shared house door is an interact point ("E · Her
  bowl") that plays `night.quiet`. no state; it may be read again. this is the quiet after the night.
- **the night.** Briar runs onto the bridge as the night begins (as built); `night.found` says so. `night.across`
  plays once, when all five are safe.
- **finale-data `SITES`**: `tessa: { x: 9, z: 4, label: 'the lookout road' }`, `device: { x: 0, z: 5, label: 'your own pack' }`
  (only `device-carried` is a chain in that group), `nearshore: { x: 0, z: 12, label: 'the pier road' }`.
- **finale-data `ALLY_CARDS`**: `beacon-sealed`, `beacon-renounced` → Mara `#7fa3a0`; `cosmos-bounded` → Avar `#9a8fc4`;
  `tessa-refused`, `tessa-hers` → Tessa `#c98f4f`; `device-open` → Rowan `#b08d57`; `device-sealed` → Oren `#a8794a`.
- **the feather (`src/feather-sight.js`).** the script raises it in six beats; today it only draws in the valley, on
  the road and at the crossing. to make the text true: (1) `areaOf` returns `hell` and `heaven` for those rooms;
  (2) add `ROADS` rows: a true `valley-briar-track` (thin, the commons to the shared house door, when bonded), a true
  `hell-master-die` (the foundry gate to the die) among counterfeit `hell-line-*` rows, a counterfeit
  `heaven-causeway` shown from `inspect-false-relay` until `relay-disabled`; (3) the built `bellweather-severing` row
  stays visible by day (the script calls it "a faint red road, old as the flagstones") and should end at the night's
  `DEVICE` (16.4, 18); (4) at the nearshore both foxes are marked true. a road list test (`roadsFor`) belongs with
  that module; the script test only checks the words.
- **no master key, in the hands (optional, small).** at `disable-central-link`, ask the player to stand at one of the
  anchors they set and hold interact for six seconds while the other anchor is off screen; leaving resets it.
  `witness.meridian` plays over it. without this the scene still reads, but it is told, not felt.
- **crossing text.** `src/crossing.js` says the bell "has not answered for a generation"; the story needs about a
  hundred years ("since before my grandfather kept her").

## 6. old saves and edges

- every scene resolves with every fact at its default: a save that never made a choice gets the neutral lines.
- **a save with no bonded Briar** (`bonded` false) gets the plain variants of the night, `hell.pattern` and
  `witness.regent`. decided: the `nearshore` beat for such a save completes at the pier. when `bonded` is false and
  `witness` is done, arriving at the pier plays `nearshore.pier` then `nearshore.plain`, and the saga marks the beat
  (`DERIVE.nearshore`: `briar.state === 'returned'` or the `nearshore` beat marked while `bonded` is false). new
  characters cannot skip the fox: the `hart` beat already needs the mine, and the rescue should be required to leave it.
- the retired homecoming choice still feeds the ledger for old saves (`earth-watch`, `earth-custody`).
- a renamed fox is carried through `{briar}`; lane text that hard-codes "Briar" should read it from the script.

## 7. checks

`tests/story_script.test.cjs`: structure, every `when` names a fact in 2.4, every `sets` names a field in section 2,
every speaker is in the cast, no banned word, `scene()` resolves with at least one line for every combination of the
facts each scene reads, the three endings by their conditions, both orders of the witness, and every ledger row's line.
