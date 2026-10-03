# Firstlight 10 — Bellweather Crossing

Continuous development starts at [docs/CURRENT_STATE.md](docs/CURRENT_STATE.md). Run `python tools/verify.py` for portable source verification. The original edition description below is retained; its delivery-time validation and publication statements are historical. See [the bootstrap record](docs/development/BOOTSTRAP_RESULTS_2026-09-12.md) for this import's actual results and limits.

A complete local action/sandbox RPG prototype for Dom / Eternities, with interchangeable third-person and diorama cameras. Four small chapters, creative tools, construction, a companion, bows, sockets, an equipment workspace, and the village are integrated in one offline application.

The current world pass adds inhabited Coastward scenery, recognizable local people and creatures, smoother accepted attack motion, visible quest work, optional realm ambience and save-before-spend workshop/story actions. [Play and actual footage](docs/evidence/world-production-2026-10-03/README.md) describe the five connected region outings, both cameras and the remaining production gates. Historical results below retain their original source epochs.

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
home checkpoint with accepted work retained. The required civic outing stays dry.

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

These are authored game characters, not live Luna residents. The game has no accounts, online multiplayer, server inventory, shared public events, guilds or deployed infrastructure. Editable local JSON is not legitimate online gear. The five realm openings are playable foundations. Their full campaigns, capitals, the monastery, ruined kingdom and living forest remain future work. Unreal remains a later production-client direction.

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

`regression09_browser.py` runs the prior edition's UI workflows against the **current** HTML. Its historical screenshot names do not mean the prior HTML was substituted. Evidence10 contains this edition's actual reports. Evidence09, when included, is historical; its old pass counts are not counted again. Native file/loopback browser navigation was blocked here; successful browser storage checks use an explicitly labeled fixture. Read VALIDATION.md for exact counts and limitations.

Full source is in this package. SOURCE.bundle contains local Git history, **not evidence of a GitHub push**. See START_HERE_FOR_CODEX.md before importing into a repository.


## Current creative milestone

The living-world review branch integrates the roadside gathering into the normal game, refines Firstlight/Earth scenery and includes an offline five-realm concept atlas. Read [current state](docs/CURRENT_STATE.md), [executed results](docs/development/LIVING_WORLD_RESULTS_2026-09-30.md) and [original art direction](docs/art/living-world-2026-09-30/ART_DIRECTION.md). Both cameras remain available. Concepts for future realms are labelled separately from playable journeys.
