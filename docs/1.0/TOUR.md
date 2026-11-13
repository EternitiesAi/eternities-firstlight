# Firstlight 1.0 story tour

A tour of the main beats on the box GPU. It lives in `tools/story_tour_saves.cjs` (checkpoints) and `tools/story_tour.py` (the browser tour). Lane: look. Final run: `look-tour-4`, commit `205299c`, served page `0973a17` (the lane build).

## Method

- **Checkpoints.** Each beat's save comes from the owning journey's own commands (the node journeys in `tests/`), written to a folder and read back through the save validator. The beat each save is on is recorded from the saga (`SG.current`, `SG.done`). Nothing is edited by hand, except the night set piece, see limits.
- **Loading.** The page loads a checkpoint through its own restore path, `Realm.test.replace`, under the existing test-mode gate (`window.__ETERNITIES_TEST_MODE`, set only by the harness init script).
- **Camera.** Third person and diorama are the page's own camera buttons (`data-id` `adventure` and `follow`), clicked in the DOM so a pointer overlay cannot fail the frame.
- **Feather's sight.** Held on `z` (`src/feather-sight.js`), which runs the page's own `feather-use` saga command.
- **Frames and speed.** 1920 by 1080, balanced, Chromium 143 on the NVIDIA L4 (ANGLE over Vulkan, checked in every report). Each scene has 600 uncapped frame intervals from the third-person framing, after a 2.5 second settle.

## Scenes

Frame paths are under `D:/firstlight/runs/`. Third-person and diorama frames were reviewed in `look-tour-2` (`5a36d91`), which ran the same saves and capture code; the sight frame and the speed numbers are from `look-tour-4`.

| scene | saga beat | checkpoint | third person | diorama | fps p50 / p95 (ms) |
|---|---|---|---|---|---|
| envoy | the envoy at the spring | chapter/ENVOY_BEFORE_CHOICE | look-tour-2/frames-tour/tour/envoy-third.png | look-tour-2/frames-tour/tour/envoy-diorama.png | 2.6 / 3.5 |
| feather | the feather's sight | chapter/CHAPTER_COMPLETED | look-tour-2/frames-tour/tour/feather-third.png | look-tour-2/frames-tour/tour/feather-diorama.png | 2.4 / 3.4 |
| feather sight | the feather's sight, held | same | look-tour-4/frames-tour/tour/feather-sight.png | | |
| beacon | the beacon stranger | beacon/BEACON_READY_EARNED | look-tour-2/frames-tour/tour/beacon-third.png | look-tour-2/frames-tour/tour/beacon-diorama.png | 2.4 / 3.1 |
| bellweather | Rowan's bell | crossing/CROSSING_READY_EARNED | look-tour-2/frames-tour/tour/bellweather-third.png | look-tour-2/frames-tour/tour/bellweather-diorama.png | 2.3 / 3.1 |
| night-lit | the night set piece | night/night-lit (lead save) | look-tour-2/frames-tour/tour/night-lit-third.png | look-tour-2/frames-tour/tour/night-lit-diorama.png | 2.0 / 2.9 |
| night-quiet | after the bite | night/night-quiet (lead save) | look-tour-2/frames-tour/tour/night-quiet-third.png | look-tour-2/frames-tour/tour/night-quiet-diorama.png | 1.9 / 2.3 |
| hell | the stolen pattern | hell/fresh-blade/04_WARDEN_RESOLVED | look-tour-2/frames-tour/tour/hell-third.png | look-tour-2/frames-tour/tour/hell-diorama.png | 2.4 / 3.1 |
| heaven | the envoy's home | heaven/fresh-blade/05_ACTUAL_COURIER_ARRIVAL | look-tour-2/frames-tour/tour/heaven-third.png | look-tour-2/frames-tour/tour/heaven-diorama.png | 2.3 / 3.1 |
| relay | the relay fight | heaven/fresh-blade/03_FALSE_SIGNAL_WATCH | look-tour-2/frames-tour/tour/relay-third.png | look-tour-2/frames-tour/tour/relay-diorama.png | 2.4 / 2.9 |
| witness | the drowned witness | atlantis/fresh-blade/07_ACTUAL_BEARING_EXPOSED | look-tour-2/frames-tour/tour/witness-third.png | look-tour-2/frames-tour/tour/witness-diorama.png | 2.5 / 3.4 |
| cosmos | the cosmos confluence | cosmos/fresh-blade/08_INDEPENDENT_SUPPORT_SETTINGS | look-tour-2/frames-tour/tour/cosmos-third.png | look-tour-2/frames-tour/tour/cosmos-diorama.png | 2.2 / 2.9 |
| finale 1 | the Regent rises | finale/phase1_rises | look-tour-2/frames-tour/tour/finale-1-third.png | look-tour-2/frames-tour/tour/finale-1-diorama.png | 2.9 / 3.7 |
| finale 2 | chains broken | finale/phase2_chains | look-tour-2/frames-tour/tour/finale-2-third.png | look-tour-2/frames-tour/tour/finale-2-diorama.png | 2.9 / 3.9 |
| finale 3 | the merged valley, the gift | finale/phase3_merged | look-tour-2/frames-tour/tour/finale-3-third.png | look-tour-2/frames-tour/tour/finale-3-diorama.png | 2.6 / 3.5 |
| epilogue | the valley after | finale/epilogue_credits | look-tour-2/frames-tour/tour/epilogue-third.png | look-tour-2/frames-tour/tour/epilogue-diorama.png | 2.2 / 3.4 |
| credits | the credits roll | finale/epilogue_credits | look-tour-2/frames-tour/tour/credits-third.png | look-tour-2/frames-tour/tour/credits-diorama.png | 2.2 / 3.0 |
| nearshore | two foxes | none | not reached | not reached | not measured |

Speed is the frame interval in milliseconds for 600 uncapped frames at 1920 by 1080, balanced. The full p99 and max values are in `look-tour-4/frames-tour/tour.json`; p99 runs from 2.5 to 6.2 ms and the largest single frame is 12.2 ms (finale 1).

## Verdicts, one per frame

- **envoy-third.** Reads well: warm light, the lobed crowns, Briar and the traveller are clear. The envoy's bone-white wings look flat and unfinished.
- **envoy-diorama.** A clear valley overview with labels. The envoy is small, and the journal says sunward road while the prompt still says speak with the envoy.
- **feather-third.** The same valley view, with no sight visible because the key is not held in this frame.
- **feather-diorama.** The commons and workshop from above. No sight visible in this capture.
- **feather-sight (look-tour-4).** Reads well: true roads turn gold from the spring across the commons while the rest of the valley desaturates. No ash-red counterfeit roads are in this framing.
- **beacon-third.** A strong landscape: the lake, the mountains and the warm lantern read well. The "Lookout" label sits on Briar's head, and the beacon stone is small.
- **beacon-diorama.** The island overview with blossom trees. The beacon itself is too small to read.
- **bellweather-third.** Shows the valley commons, not the crossing. The chapter IV quest does not match the frame.
- **bellweather-diorama.** Valley overview again; the bell crossing is not in frame.
- **night-lit-third.** The night palette, warm lanterns and rim light work. The setting is the lookout, with no travellers or claimants for "lead the travellers out".
- **night-lit-diorama.** The lookout island at night with lit paths. The mood reads, but the set piece is absent.
- **night-quiet-third.** Briar's absence reads as quiet: the traveller alone by the lantern. It is still the lookout.
- **night-quiet-diorama.** A quiet island at night. It reads as a pause rather than a set piece.
- **hell-third.** The valley refuge, not the foundry. The journal says go back to the refuge, and there is no hell palette.
- **hell-diorama.** Valley overview; no hell realm.
- **heaven-third.** The valley garden, not heaven. The journal says go back to the garden.
- **heaven-diorama.** Valley overview; no heaven realm.
- **relay-third.** The valley again. The seraph fight is not in the checkpoint.
- **relay-diorama.** Valley overview; no relay realm.
- **witness-third.** The valley again ("revisit Farwake"). The drowned witness is not shown.
- **witness-diorama.** Valley overview; no harbour depth.
- **cosmos-third.** The valley again ("revisit the Near Expanse"). No confluence is shown.
- **cosmos-diorama.** Valley overview; no cosmos realm.
- **finale-1-third.** Night at the spring: the Regent, Briar fighting and the chain line. The Regent reads as a pale, ghostly silhouette.
- **finale-1-diorama.** The spring at night from above. The Regent is labelled "The envoy".
- **finale-2-third.** Almost the same as phase one, with damage numbers and Briar fighting. Little visible change.
- **finale-2-diorama.** Overhead view of phase two. No visible chain change.
- **finale-3-third.** The gift panel covers the scene, with the world paused behind it. The merged valley is not visible.
- **finale-3-diorama.** The same panel. The phase three world is hidden.
- **epilogue-third.** The valley has changed: a new timber arch with hanging windbells in the commons reads well. The journal still says chapter 3, and the envoy prompt remains.
- **epilogue-diorama.** The new arch shows from above. The journal and prompt are stale.
- **credits-third.** No credits screen (see limits). It shows the epilogue valley.
- **credits-diorama.** The same: no credits screen.

## Not reached, and why

- **nearshore (two foxes).** No checkpoint writer for the nearshore in this build; its path is a test file (`tests/witness_nearshore.test.cjs`).
- **bellweather, the crossing.** The crossing checkpoint sits in the valley commons. The crossing room is not reached from the save.
- **hell, heaven, relay, witness, cosmos (the realms).** The campaign checkpoints save the player back in the valley, at the refuge, the garden, Farwake or the Near Expanse. Their realm rooms are not in the saves. Reaching them needs the realm-entry command inside the journey.
- **credits screen.** `RealmCredits` is not defined anywhere in the build. The only reference is a guarded call in `src/earth-homecoming-ui.js`, so no credits screen can appear.
- **finale phase three.** The Regent's gift panel covers the scene, with the world paused behind it.

## Findings for the lead

1. Campaign checkpoints do not hold the realm rooms (see above). Five of the beats the brief names show the valley instead.
2. `RealmCredits` is absent from the build, so the credits screen never appears.
3. HUD and prompt disagree: the envoy and feather frames say speak with the envoy while the journal says the sunward road; the epilogue journal reads chapter 3 with the envoy prompt.
4. In the phase one diorama the Regent is labelled "The envoy".
5. The night frames use the lead's `tools/night_frames_save.cjs`, which writes the night object onto a command-earned chapter save. The night is therefore not a command-driven night, and it sits at the lookout, not the crossing.
6. Not changed by this lane: `src/app.js` line 747 enables `Realm.test` when `location.search` contains "test". Any URL containing "test" exposes the test hooks in normal play.
7. The tour sets no positions. Each frame is the checkpoint's own position and camera, so framing is not optimised.
