# Firstlight 1.0 story tour

A tour of the main beats on the box GPU. Checkpoints come from the journeys' own commands (`tools/story_tour_saves.cjs`; the nearshore checkpoint comes from the bot's `--save-at nearshore`). The browser tour is `tools/story_tour.py`, run from `tools/story_tour_box.sh`. Lane: look.

## The run

- Final run: `look-tour-6` on box B, from commit `c480cc2`. The lane includes build `80c2053` (merged at `5f3711a`).
- Page: SHA-256 `967ab6f1d8a4d7c7d6bfe6f1bde04b009d897567836d2d2eee48954850f7d1e6`.
- Renderer: NVIDIA L4 (ANGLE, Vulkan). Chromium 143.0.7499.4. 1920 by 1080, balanced, 600 uncapped frame intervals per scene after a 2.5 second settle.
- Tour gate, in a real page: the hook is absent with no flag, with the flag alone, and with the harness global alone. It is present only with both.
- Result: 13 of 17 scenes reached, no page errors. The run exited 1 for the four scenes below.
- Frame paths are under `D:/firstlight/runs/look-tour-6/frames-tour/tour/`. The fps columns are frame intervals in milliseconds, p50 and p95 over 600 intervals. Lower is faster.

## Scenes

| scene | frames | sight | fps p50 / p95 (ms) | verdict |
|---|---|---|---|---|
| envoy | envoy-third.png, envoy-diorama.png | | 2.4 / 3.2 | The commons at the envoy's moment. The journal says the sunward road (5 of 6) while the prompt still says speak with the envoy, and the envoy's wings read flat. |
| feather | feather-third.png, feather-diorama.png | feather-sight.png | 2.4 / 3.4 | The commons with the journal at 0 of 6. The sight frame reads well: the true roads turn gold from the spring and the rest desaturates. |
| beacon | beacon-third.png, beacon-diorama.png | | 2.5 / 3.2 | The lake lookout reads well, but the beacon is small, the Lookout label sits on Briar's head, and the journal says return to the lit beacon at a checkpoint from before it is lit. |
| bellweather | | | | Not reached (see below). |
| night-lit | night-lit-third.png, night-lit-diorama.png | | 2.5 / 3.2 | The crossing at night. The third-person camera is pressed against the Sunward arch, a dark mass fills the centre, and the diorama is covered by the story card. |
| night-quiet | night-quiet-third.png, night-quiet-diorama.png | | 2.6 / 3.1 | The diorama reads: Rowan, the arch, travellers gathered, Briar's slot greyed. The third-person frame has the same arch problem. |
| hell | hell-third.png, hell-diorama.png | | 2.5 / 3.0 | The Kiln Refuge reads as a realm, not the valley, but it is sparse, and the journal still says take the pattern back after the warden is resolved. |
| heaven | heaven-third.png, heaven-diorama.png | | 2.8 / 3.5 | The Garden of Voices reads as a realm. A tooltip line runs off the left edge of the screen. |
| relay | relay-third.png, relay-diorama.png | | 2.9 / 3.7 | The garden again. The seraph fight is not checkpointed, so the relay beat is not shown. |
| witness | witness-third.png, witness-diorama.png | | 2.5 / 3.3 | The Farwake pier reads as a place at night. The drowned witness is absent, the pier is a plain slab, and the Nereme label is clipped by the journal card. |
| cosmos | cosmos-third.png, cosmos-diorama.png | | 2.3 / 3.0 | The Near Expanse reads well: a floating island, three lamps, the rise, dusk. The central link is not shown. |
| nearshore | | | | Not reached (see below). |
| finale-1 | finale-1-third.png, finale-1-diorama.png | | 3.2 / 4.1 | The Regent of Ash in the commons with Briar helping. The journal says he waits at the spring junction. |
| finale-2 | finale-2-third.png, finale-2-diorama.png | | 2.9 / 3.7 | The chains are broken: Briar is helping and a damage number floats over the Regent. The card's speaker names are blank. |
| finale-3 | finale-3-third.png, finale-3-diorama.png | | 2.6 / 3.4 | The offer card covers both frames. The merged valley is not visible. |
| epilogue | | | | Not reached (see below). |
| credits | | | | Not reached (see below). |

## Not reached, and why

- **bellweather.** The crossing checkpoint is from before the bellweather waystone is attuned. `cross-attune` needs the player at the village waystone inside the crossing, which a valley save cannot reach by travel. The run refused the travel with "Discover and attune that waystone first."
- **nearshore.** On box B the bot stopped at its cosmos stage: the helper refuses an output folder inside the checkout. The fix is in `0aedc4a` (the bot writes under `os.tmpdir()`). It has not been run on the box. Locally, on the merged build, the bot's save point exits 0 and the checkpoint is taken before the choice.
- **epilogue and credits.** After the refusal, the finale's last hit did not land, so `saga.finale.won` stayed unset and no epilogue save was written. The credits screen is not reached.

## What still looks unfinished

- The journal and the prompt disagree in the envoy frames: the journal says the sunward road while the prompt says speak with the envoy.
- Journal lines are stale after their beat. Hell still says take the pattern back after the warden is resolved. Finale frames say the Regent waits at the spring junction, but he stands in the commons.
- The finale-2 card shows blank speaker names (a leading colon).
- The finale-3 offer card covers the whole scene, so the merged valley never shows.
- The night set piece: the night-lit diorama sits under the "night the warning failed" card, and both third-person night frames are pressed against the arch.
- The relay beat shows the garden, not the relay.
- The witness pier is a plain slab with no drowned witness in frame.
- The hell refuge is sparse: a flat floor and few props.
- Beacon: the Lookout label sits on Briar, and the beacon stone is small.
- Heaven: a tooltip line runs off the left edge.
- Cosmos: one frame interval reached 253 ms (p99 16.4 ms). Probably a first-frame cost; not investigated.
- The collector's road journey fails on a missing `chapter1` folder. This predates the run. Road is not a tour scene.

## Run history

- `look-tour-5` (commit `8d86f47`): 9 of 17. Bellweather and both night scenes refused the crossing travel, which called the wrong command. The finale ticker waited on the clock for phase 2. The bot stopped at its cosmos stage.
- `look-tour-6` (commit `c480cc2`): 13 of 17, the run above. The travel now uses the adventure command, and the finale breaks each chain with the same defeat the chain rule uses.
