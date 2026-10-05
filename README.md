# Firstlight — a connected finite browser draft

Firstlight now connects the original four chapters, useful equipment projects
and repeat outings, local Earth roads, distinct Hell, Heaven, Atlantis and Cosmos
campaigns, and a provisional Earth homecoming. The route has a beginning,
escalation and local ending: I-IV → local Earth → Hell → Heaven → Atlantis →
Cosmos → Earth homecoming. These are supported authored pockets with normal
return routes, rather than streamed continents or the full canonical saga.
Both third-person and diorama cameras, creative tools, housing and companion
play remain available.

The current finite draft is under review in
[PR49](https://github.com/EternitiesAi/eternities-firstlight/pull/49).
At source `b5fee766e6f77a2d901bb953af8faac13175fee4`, full05 actually completed
with exit 0: **230 commands (183 source and 47 browser suites in one invocation),
118 syntax modules, 1,542 Node passes from 1,544 tests with 2 explicit skips**.
Python ran **243 tests**, with **237 method PASS records, 6 skipped methods and
2 skipped class setup records**; class records are not extra test methods.
Both generated pages are 3,033,467 bytes, SHA256
`ccfc2782a33d21e3a75cd93201d5d9b5d89eef41e6397036c13c2f06bda91f9b`.
Evidence commit `972998b5509c184090a55911c52dbb927fbaf278` is pushed and its 409 payloads, manifest and
attributes passed fresh streamed remote byte readback. See the
[qualification record](docs/development/FINITE_DRAFT_QUALIFICATION_2026-10-05.md)
and [current state](docs/CURRENT_STATE.md) for exact epochs and limitations.
Earlier failures stay retained and do not count as this gate's passes.

Journal surfaces usable current actions and readable later prerequisites.
Deliberate tracker selection remains consistent through ticks and shows completed
work; it is transient per Simulation, not a newly persisted preference.
The selected-enemy HUD and local Earth Claim Engine presentation make the foe
and its danger cues readable in both V views while preserving actual attacks,
cameras and existing controls. Automated qualification does not answer human
route clarity, fight feel, reward appeal or sustained device-performance questions.
The [finite first-play guide](docs/playtests/FINITE_DRAFT_FIRST_PLAY_2026-10-05.md)
is the short human invitation accompanying the final records; human acceptance
remains pending.

Save/world version 9, adventure version 12 and optional earthHomecoming version 1
remain unchanged. Returning characters keep levels, gear, sockets and earlier
choices. Blade, crafted bow and strong returning kits have useful paths;
the continuous fresh bow route starts with a blade in I-III and crafts/equips
its bow before IV. Fixed materials support existing projects without promising
all veterans stronger equipment or automatically equipping a reward.

The Earth ending is a local Regent-pattern repulse and chosen homecoming.
Full countries/cities, mounts, the full Regent war, ultimate Answering and the
completed Briar story remain future scope. Historical f351 gameplay excerpts
predate the current art/HUD; current screenshots have their own source epoch.
Official hosted run 37372589333 closed with 47 jobs, 29 failures, 18 cancelled
and 0 executed steps. Only the Ubuntu source job's billing-lock annotation was
inspected; this is hosted nonexecution, not green CI or deployment.

## Original Firstlight 10 baseline and continuing features

Continuous development starts at [docs/CURRENT_STATE.md](docs/CURRENT_STATE.md). Run `python tools/verify.py` for portable source verification. The original edition description below is retained; its delivery-time validation and publication statements are historical. See [the bootstrap record](docs/development/BOOTSTRAP_RESULTS_2026-09-12.md) for this import's actual results and limits.

A complete local action/sandbox RPG prototype for Dom / Eternities, with interchangeable third-person and diorama cameras. Four small chapters, creative tools, construction, a companion, bows, sockets, an equipment workspace, and the village are integrated in one offline application.

The current world pass adds inhabited Coastward scenery, recognizable local people and creatures, smoother accepted attack motion, visible quest work, optional realm ambience and save-before-spend workshop/story actions. [Play and actual footage](docs/evidence/world-production-2026-10-03/README.md) describe the five connected region outings, both cameras and the remaining production gates. Historical results below retain their original source epochs.

The living-Earth continuation adds **A Place Beside the Road**: supplied fittings across the Coastward bridge, your choice of a lasting work site, explicit once-only payment and a finite route-board for home. [Play guide](docs/playtests/LIVING_REGION_2026-10-04.md) and [source/migration contract](docs/development/LIVING_REGION_2026-10-04.md) distinguish this original bounded episode from the larger province and saga.

## Play the current prototype

On Windows, open **PLAY_FIRSTLIGHT_WINDOWS.cmd**. On any supported desktop with Python 3, run `python tools/play_local.py`. The launcher serves the checked build at **http://127.0.0.1:8780/** and opens your browser. Keep its window open while playing. It reuses an existing server only when that server returns the same build; a different version produces an explicit refusal instead of changing the save origin. `--no-browser` starts it without opening a tab.

This local HTTP origin is the tested path for the character library. The server exposes only the generated game, binds only to this computer, and needs no account, CDN, paid service, API key or external asset request. The offline `FIRSTLIGHT_VALLEY.html` and `index.html` still have identical bytes, but file-origin storage is browser-dependent.

Keep the same browser profile and origin to resume your local worlds. **More → Characters** offers up to three separate lives, portable per-character JSON exports and previewed imports into a new slot. Creating another character is deliberate; merely opening the page does not reset your current world. In the older single-world mode, the explicit legacy import still replaces that single world after confirmation; export it first if you intend to keep it. Personal saves do not belong in Git.

**The Roads of Light now open five playable regions.** Collect Oren's initial
expedition kit, then walk east of the workshop to the five-light marker, or use
**J → Roads of Light** to read the routes. Heaven's Garden of Voices, Hell's Kiln
Refuge, Earth's long Coastward bridge and fields, Atlantis's civic court and
visitor gallery, and Cosmos's Near Expanse each offer optional local work with
stated rewards and a free return home. **M** reads local routes; **E** interacts;
**V** exchanges third person and diorama. No campaign chapter or allegiance is
required. First work and deliberately accepted repeat surveys have separate
claim records. See [world results and migration](docs/development/WORLD_FOUNDATIONS_NIGHT_RESULTS_2026-10-02.md)
and [actual gameplay recordings](docs/evidence/world-foundations/README.md).

Atlantis's optional marked gallery uses **F** to ascend and **G** to descend;
release holds depth. **WASD** moves relative to the camera. The Bellglass air
court is dry, and the gallery landing or **Return to Firstlight** ends the dive.
The supplied visitor breath envelope has no timer. Reopening resumes your saved
home checkpoint with accepted work retained. This early visitor commission stays
dry; the later Harbour pressure campaign has separately accepted depth/current
work and dry-quay combat.

For an ordinary outing, collect the expedition kit beside Oren's workshop. **Field guide** shows real equipment recipes and one pinned project; the nearby riverbank materials survey can be deliberately repeated for declared materials. Oren's original once-only supplies quest remains separate. These local loops do not require campaign advancement.

Oren's services and **More → Class path** let a character compare Hunter and Magician, then choose explicitly after the kit. The choice is once per character in this prototype and adds one technique on **X**. Existing characters remain unassigned. The chosen path links to the practice area and equipment projects. Hunter marks with X, then lands a weapon hit; Magician casts directly. **1** starts/stops weapon attacks and **V** swaps third person and diorama.

The four existing chapters remain playable in their original optional order. For a Chapter IV preview, `examples/REALM10_CROSSING_READY_EARNED.json` is a command-earned Chapter III completion with no Chapter IV rewards. Import it into a free character slot, use M to travel to Sunward, then approach the northern arch. Its earlier test character's explicit soul history belongs only to that imported world.

See [current state and compatibility](docs/CURRENT_STATE.md), [latest mystery results](docs/development/MARKS_BENEATH_THE_RAIN_RESULTS_2026-09-20.md), [latest actual gameplay recording](docs/evidence/marks-beneath-the-rain/README.md), and [the earlier class combat recording](docs/evidence/classes/README.md). The edition-10 chapter description below is retained as historical context.

After Fenna's Road After Rain delivery, return to Mara's observatory for **Marks Beneath the Rain**: three physical rubbings, a tracing comparison and a lasting chart. This optional mystery has no cost or XP/item payout and keeps the main campaign open. Both camera styles remain available.

## What's new

- Bellweather Crossing: five exterior buildings, a cobbled square, stream and bridge, wooded trail, and watch-bell court. Rowan gives a quest; Nella provides a free rest on the inn porch; Edda sells a coat/tonic and buys copper/berries; the public forge uses the existing recipes. Building interiors are not newly implemented.
- A full local Chapter IV: meet Rowan, read an inscription, let Briar find the bronze clapper, clear three encounters, repair the bell, ring three resonators, and return for a charm and 18 sunmarks. Completion adds visible windbells to Oren's original workshop.
- The Hushbound Keeper alternates a wide annulus with a safe center and a smaller central strike. The target frame explains whether to step in or out. Existing targeting, skills, bow projectiles, guard and mitigation still apply.
- M opens a numbered map with local walking destinations. Discovered waystones connect the Commons, Sunward Beacon and Bellweather. Travel requires being at an anchor and out of danger; it grants no health, loot or progress.
- Camera cutaway removes part of flagged foreground scenery from the main image when it hides the player. It is configurable. Collision, enemy visibility rules, shadows and water-reflection geometry are not removed with it.
- Two optional village commissions consume actual materials and give one reward each. New lamps or pantry supplies remain in the world. No daily timer or guild/network system is implied.

## Controls

| Key | Action |
|---|---|
| WASD / arrows / click ground | Move. Tab or clicking a visible enemy selects a target without forced chasing. |
| Drag / wheel | Orbit / zoom. |
| R / [ / ] | Reset the current camera style / stepped rotation. |
| Tab / Shift+Tab | Cycle visible targets. Selection does not attack. |
| 1 | Toggle stationary weapon autoattack. |
| 2 | Weapon skill: sweep or piercing arrow. |
| 3 | Brace. |
| 4 | Briar: combat insight; outside immediate combat, contextual scent seeking. The map offers explicit clapper search. |
| 5 | Chosen Aegis or Cinder technique, if learned. |
| 6 | Tonic. |
| X | Optional chosen Hunter or Magician technique. |
| V | Switch between third person and diorama views. |
| Space | Dodge. |
| E | Nearby interaction, dialogue, cache, door or resonator. |
| C / I / K / J / M | Character / Inventory / Crafting / Journal / Map. |
| B / T | Construction / rotate a construction piece. |
| P | Pause. |

The main RPG workspace, including maps and services, pauses the local game and restores the prior pause state on close. Some retained creative/settings drawers follow their earlier behavior. Music and sound remain accessible through their controls; **M now means Map**, not sound.

## What persists

Old supported creative and adventure state, chapter outcomes, owned/equipped items, coins, gems, soul choices, companion bond/name/mode, excavation, buildings, crops, new village attunement, quest flags and commissions. Saving inside an expedition restarts outside at its safe return point. New enemy partial damage, paths, attack warnings, bell input in progress and exact NPC/fox positions are transient.

These are authored game characters, not live Luna residents. The game has no accounts, online multiplayer, server inventory, shared public events, guilds or deployed infrastructure. Editable local JSON is not legitimate online gear. The five realms now include finite local campaigns and the provisional Earth homecoming, with accepted work, chosen outcomes, verification and once-only claim records preserved. Live encounters, warnings and incomplete escort motion remain transient and are resumed through their declared local rules. Larger campaigns, capitals, the monastery, ruined kingdom, living forest and full saga remain future work. Unreal remains a later production-client direction.

## Build and verify

```
python build.py
node --test tests/*.test.cjs
node tests/crossing_journey.cjs
node tests/crossing_journey.cjs --bow
python -m unittest discover -s tests -p 'test_*.py'
```

Optional browser tests require Python Playwright and a compatible Chromium developer environment:

```
python tests/crossing_browser.py
python tests/regression09_browser.py
python tests/cutaway_browser.py
python tests/reflection_browser.py
```

`regression09_browser.py` runs the prior edition's workflows against the **current** HTML; historical screenshot names do not substitute old game bytes. The retained edition-10 package reports and Evidence09 belong to their original epochs and are not counted again. At that historical delivery, native file/loopback navigation was blocked and storage checks used a labelled fixture; see VALIDATION.md for that edition's limits. Current full05 separately completed all 47 required browser suites against the b5 build, including native loopback persistence and the current campaign/onboarding callers. Accelerated production movement/ticks and synthetic capacity, save-refusal or old-owner derivatives remain explicitly labelled; they are not ordinary-speed human play.

The original edition package includes full source and SOURCE.bundle local history, **not evidence of a GitHub push**. Its START_HERE_FOR_CODEX.md documents that archive import. Current review-source and evidence publication are separately recorded in docs/CURRENT_STATE.md.


## Earlier creative milestone — 2026-09-30

At this earlier milestone, the living-world review branch integrated roadside gathering, refined Firstlight/Earth scenery and added an offline five-realm concept atlas. Its [executed results](docs/development/LIVING_WORLD_RESULTS_2026-09-30.md) and [original art direction](docs/art/living-world-2026-09-30/ART_DIRECTION.md) retain that date and scope. Both cameras remain available. The [current-state record](docs/CURRENT_STATE.md) describes the later finite campaigns; broader concept targets remain distinct from playable journeys.
