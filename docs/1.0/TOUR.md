# Firstlight 1.0 story tour

A tour of the main beats on the box GPU. Checkpoints come from the journeys' own commands (`tools/story_tour_saves.cjs`). The finale and the nearshore start from the bot's own world after the nearshore choice (`tools/firstlight_journey.cjs --save-at nearshore`). The browser tour is `tools/story_tour.py`, run from `tools/story_tour_box.sh`. Lane: look.

## The run

- Final run: `look-tour-8` on box B, from commit `6364b83`. Build: `8a9a729`, the release candidate, fast-forwarded into the lane.
- Page: SHA-256 `79baeb267cfe5c01951ace970dbc243967915690f52ec1c719a48a161cf00e38`.
- Renderer: NVIDIA L4 (ANGLE, Vulkan). Chromium 143.0.7499.4. 1920 by 1080, balanced.
- Result: exit 0, 17 of 17 scenes reached, 36 frames, no page errors.
- Tour gate, in a real page: the hook is absent with no flag, with the flag alone, and with the harness global alone. It is present only with both.
- Title screen: reached, in its own page in normal play.
- Frame paths are under `D:/firstlight/runs/look-tour-8/frames-tour/tour/`.
- fps is the frame interval in milliseconds over 600 uncapped intervals per scene. Lower is faster.

## Frames

One row per frame. The verdict is for that frame.

| frame | verdict |
|---|---|
| title.png | Reads well: the wordmark, the tagline, four menu entries, and the valley behind. The left panel is dark enough to read. |
| envoy-third.png | The commons at the envoy's moment. The journal says the sunward road (5 of 6) while the prompt still says speak with the envoy. The envoy's wings read flat. |
| envoy-diorama.png | A clear overview with labels. The same journal and prompt mismatch. |
| feather-third.png | The commons after the envoy. Journal and prompt agree (rest). The envoy still stands in frame. |
| feather-diorama.png | The overview at 0 of 6, with the rest prompt. Readable. |
| feather-sight.png | The sight reads: the true roads turn gold from the spring and the rest desaturates. |
| beacon-third.png | The lake lookout reads well. The Lookout label sits on Briar's head, the beacon is small, and the journal says return to the lit beacon before it is lit. |
| beacon-diorama.png | The island overview reads. A realm tooltip sits over the Journal button in the top bar. |
| bellweather-third.png | Poor framing: the camera is pressed against a figure's head, likely Rowan, so the frame is mostly brown and only the waystone shows below. |
| bellweather-diorama.png | The crossing reads well: Rowan, the waystone, the arch and the square. The journal still says attune the waystone, which the run has already done. |
| night-lit-third.png | The camera is pressed against the Sunward arch. A brown mass fills the centre and no travellers show. |
| night-lit-diorama.png | The set piece is covered by the centred story card "The night the warning failed", with the world paused. |
| night-quiet-third.png | The same arch close-up. The journal line "Go home" reads, and Briar's slot is greyed. |
| night-quiet-diorama.png | The crossing at night reads: Rowan, the waystone, the arch, the gathered travellers, and Briar's slot greyed. |
| hell-third.png | The Kiln Refuge reads as a realm, not the valley. The journal still says take the pattern back with 7 done. |
| hell-diorama.png | A sparse overview: a flat floor and one long building. The same stale journal line. |
| heaven-third.png | The Garden of Voices reads. The rewritten step title "Set up a welcome for tired hands" is repeated in a tooltip at the left edge. |
| heaven-diorama.png | A readable garden overview at 9 done, with Calen, the envoy, and the road home. |
| relay-third.png | The garden again, not the relay. The seraph fight is not checkpointed, so the beat is not shown. |
| relay-diorama.png | The same garden overview, "Ground the warning mirror" at 4 done. The relay is not shown. |
| witness-third.png | The harbour pier at night reads. The drowned witness is absent, and a Nereme label clips over the journal card's text. |
| witness-diorama.png | A clean pier overview. The pier is a plain slab and the witness is absent. |
| cosmos-third.png | The Near Expanse reads: three lamps, the rise, and dusk. The journal card's top is blank. The central link is not shown. |
| cosmos-diorama.png | The floating island reads well in overview. The card's top is blank again. |
| nearshore-third.png | The lantern pier in daylight with both foxes in frame. The faultless fox is dithered. The choice is open ("Choose a pier activity"). |
| nearshore-diorama.png | The pier overview reads. The "Roads of Light, five realm openings" tooltip wraps into a narrow four-line box. |
| finale-1-third.png | The Regent of Ash in the commons with Briar helping. The story dialog card sits in the lower third and reads clearly. |
| finale-1-diorama.png | A centred choice card ("There are people coming down every road...", Listen or Continue another time) covers the lower half over the blurred scene. |
| finale-2-third.png | The second fight: the Regent and Briar in combat, with floating damage numbers. No card in this frame. The journal still says he waits at the spring junction. |
| finale-2-diorama.png | A centred choice card ("The last chain parts...") covers the lower half over the blurred overview. It reads, but it hides the scene. |
| finale-3-third.png | The Regent with Briar at the commons after phase three. A dithered column crosses the frame. The offer is not yet on screen. |
| finale-3-diorama.png | The overview with the Regent at the commons. The journal still says he waits at the spring junction. |
| epilogue-third.png | The postgame card reads cleanly ("The roads stay open"). The commons with the envoy and Briar. A dithered column stands by the lantern pillar. |
| epilogue-diorama.png | The postgame overview reads, and the side work card is clean. |
| credits-third.png | The credits roll has barely started: a black screen with the title and Skip. No names are visible. |
| credits-diorama.png | The same early frame. The first credit line is cut by the gold rule. No names are visible. |

## Frame rate

| scene | p50 (ms) | p95 (ms) | p99 (ms) | max (ms) |
|---|---|---|---|---|
| envoy | 2.5 | 3.2 | 3.7 | 9.0 |
| feather | 2.4 | 3.3 | 4.0 | 7.7 |
| beacon | 2.5 | 3.2 | 3.8 | 4.4 |
| bellweather | 3.4 | 3.9 | 4.2 | 4.6 |
| night-lit | 2.8 | 3.5 | 4.4 | 7.8 |
| night-quiet | 2.8 | 3.3 | 4.4 | 8.9 |
| hell | 2.4 | 3.1 | 3.2 | 7.0 |
| heaven | 2.9 | 3.7 | 4.3 | 7.1 |
| relay | 2.8 | 3.4 | 3.9 | 8.3 |
| witness | 2.5 | 3.1 | 3.4 | 3.7 |
| cosmos | 2.4 | 9.2 | 17.6 | 248.5 |
| nearshore | 2.5 | 3.3 | 4.4 | 10.7 |
| finale-1 | 3.4 | 4.2 | 4.6 | 5.1 |
| finale-2 | 2.9 | 3.4 | 4.5 | 8.9 |
| finale-3 | 3.2 | 3.9 | 6.1 | 9.2 |
| epilogue | 2.8 | 3.6 | 4.4 | 8.2 |
| credits | 2.9 | 3.6 | 4.2 | 8.0 |

The cosmos scene has a recurring hitch: its max was about 250 ms in look-tour-6, look-tour-7 and look-tour-8. The cause is not yet explained.

## Story dialog card

finale-1-third.png: the story card "The Regent of Ash: You never once handed me a chain. So this one is mine, and it is the oldest I have." sits in the lower third (about 77 to 83 percent of the frame height), centred, white text on a dark panel. It reads cleanly.

The choice cards in finale-1-diorama and finale-2-diorama are different: centred modals across the lower half over a blurred scene. They read, but they cover the scene.

## What still looks unfinished

- The journal and the prompt disagree in the envoy frames: the journal says the sunward road while the prompt says speak with the envoy.
- Journal lines are stale after their beat. Hell still says take the pattern back with 7 done. Bellweather still asks to attune the waystone after the attune. Beacon says return to the lit beacon before it is lit. The finale frames say the Regent waits at the spring junction, but he stands in the commons.
- Third-person framing: the bellweather, night-lit and night-quiet third-person frames are pressed against a figure or the arch.
- The night set piece is hidden: the night-lit diorama sits under the story card, and no travellers show in the third-person frames.
- Relay shows the garden, not the relay. The seraph fight is not checkpointed.
- Witness: the drowned witness is absent, the pier is a plain slab, and a label clips over the journal card.
- Hell: the Kiln Refuge is sparse.
- Cosmos: the journal card's top is blank, and the recurring hitch above is unexplained.
- Finale-3 and the epilogue: a dithered column crosses the frame, which may be an effect or a glitch.
- Credits: the roll had barely started at the capture point, so no names are on screen.
- Tooltips: the heaven step title is repeated at the left edge, and the realm tooltip overlaps the Journal button in the beacon overview.
- The collector's road journey fails on a missing `chapter1` folder. This predates the run, and road is not a tour scene.

## Runs

- `look-tour-5` (`8d86f47`): 9 of 17. Bellweather and both night scenes refused the crossing travel, which called the wrong command. The finale waited on the clock for phase 2.
- `look-tour-6` (`c480cc2`): 13 of 17. The bot stopped at its cosmos stage on the box, which refuses output inside the checkout. The finale started from an earned fixture that was too weak for the second body.
- `look-tour-7` (`e62d4e2`): 16 of 17. The finale now starts from the bot's world and fights for real. Bellweather failed because the walk check read the home snapshot inside the road room.
- `look-tour-8` (`6364b83`): 17 of 17, the run above.
