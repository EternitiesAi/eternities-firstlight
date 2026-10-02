# Firstlight engineering constraints

Current complete local release: **Realm10 /10.0.0 — Bellweather Crossing**. Browser offline custom WebGL2 prototype; Unreal is later. Preserve all three earlier chapters, music exports, construction, decoration, companion and saved data. Do not regress to Shared Commons07.

Read README.md, VALIDATION.md, docs/BELLWEATHER_CROSSING.md and docs/NEXT_SESSION.md. Source facts are the files, not previous confident prose. `python build.py` and `node --test tests/*.test.cjs` are the default gates. Current browser acceptance: tests/crossing_browser.py and tests/regression09_browser.py. Historical browser scripts may target hidden old controls; do not claim they passed this UI.

Keep rules separate from art/UI. Validate before mutation. No duplicate loot, hidden inventory grants, offline saves treated as online authority, destructive reset on migration or silent unbounded currency. Targets and fight runtime are transient; durable chapter checkpoints are explicit. Space/1–6 are combat, C/I/K/J/M menus; modal text must never leak into game input.

Use actual browser screenshots, never concept art presented as gameplay. Distinguish automated tactics/time and storage fixtures from human/device testing. No FPS, production multiplayer, consciousness, completed remote import or deployment claims without evidence. No API keys or paid infrastructure in the offline build. No public license, Heaven merge or protected-resident changes without founder direction.

## Continuous development (2026-09-12)

Start at `docs/CURRENT_STATE.md`, then `docs/NEXT_TASK.md`, `docs/PLAYTEST_NOTES.md` and `docs/DECISIONS.md`. The founder charter preserves direction; its recommendations remain proposals. The later bootstrap handoff takes priority over the archived edition's old task ordering. Source facts and fresh tests take priority over historical pass counts.

Dom directs taste, names and human playtesting. ChatGPT supplies strategy, design, prototypes and review. Codex owns the primary integration checkout and build/test verification. This is a repository handoff protocol, not an automatic live connection between sessions.

Use one bounded task branch from an explicit base commit. Inspect status, fetch origin, compare newer work, and preserve concurrent edits. Separate agents use separate worktrees. Every handoff names base/head, changed files, save migrations, commands actually run, failures and next acceptance condition. Never replace a newer tree wholesale with a chat ZIP. Keep personal save exports outside Git; use only labelled synthetic or command-earned fixtures for automation.

Run `python tools/verify.py` for build identity, syntax, rules, helper cases and both Chapter IV journeys. Use `python tools/verify.py --browser` with the optional development dependencies for the current browser suites; the latest extension below names the current gates. Record skips separately from passes. A fresh clone of the pushed branch must reproduce the build and tests before reporting a complete source import. Root `VALIDATION.md`, `GITHUB_STATUS.json` and dated provenance describe the original delivery, not fresh runs.

The bootstrap authorizes source import, separate portable tooling/CI, continuity records, pushing a review branch and opening its PR. It does not authorize merging main, tagging a release, deploying publicly or activating `.import/READY.json` / the old `import-source.yml` workflow. Keep that historical workflow dormant. The next gameplay priority is starter-region questing, leveling, loot, visible equipment progression and combat feel. A new realm or Unreal rewrite is outside that milestone.


## Starter progression extension

The riverbank is owned by `starter.js`, `starter-ui.js`, `starter-art.js`; generic adventure/combat/arsenal/core dispatch remains authoritative. Read the dated task/results notes. Preserve stable IDs, adventure-6/starter-1 migration, the 1–5 curve, atomic single reward, weapon identity/socket and existing browser keys.

The current portable verifier includes fresh starter blade/bow and a newly earned four-chapter strongest veteran journey. `--browser` runs six suites including native persistence and starter UI. Report actual counts (432 rules / 147 starter UI checks at this checkpoint). Record real browser footage with fixture/hash/renderer provenance; no concept art or animation substitute. Human feedback remains a separate acceptance step.

## Perspective camera extension

Read the 2026-09-13 task/results notes. Adventure is true perspective; Follow/Tactical/Wide retain orthographic contracts. Preserve inverse ground picking, behind-eye/sky rejection, visible-body selection, camera-relative movement, text/menu input boundaries and stationary attacks. Camera mode/FOV are optional world9 preferences; no progression migration.

Static opaque shapes block camera clearance by default; dynamic construction/mine solids opt in with `cameraSolid`. Exclude actors, effects, ghosts and wind foliage. The camera browser gate belongs in the portable verifier and CI. Actual footage/desktop measurements remain distinct from software WebGL tests and human comfort. Extend the current branch without reimporting archives or merging/deploying automatically.

## Interchangeable views

Dom wants both diorama and third person retained. V swaps styles; R resets the current mode. Optional `cameraViews` version 1 holds per-mode framing. Keep orthographic user zoom separate from the fitted scene half-width so interior/viewport limits never overwrite outdoor framing. Preserve the internal mode IDs and world9/adventure6/starter1 contracts. Validate older/invalid preferences without discarding game state. The 51-case camera browser gate includes switching/reload, scene clamps, live combat intent and actual notebook/menu input; current rules total 444. Report fresh results, not these counts alone.

## Equipment pursuit extension

Read `docs/development/UPGRADE_HUNT_TASK_2026-09-14.md` and its results. `pursuit.js` owns versioned survey/claim/fitting rules; `pursuit-ui.js` projects real catalogue/recipes. `starter` owns the shared riverbank scene; active surveys temporarily select their own encounter/objective IDs. Art never creates quest or payout state.

Preserve optional pursuit version 1 on adventure 6. A complete unclaimed run is valid durable state. Exact run identity and observed prior claim counter survive request-receipt eviction; individual survey enemies never enter legacy defeated/drop rewards. Capacity/cost refusal must leave all ownership, balances and entitlement unchanged. The two fitting steps retain identity, socket and separate Oren temper. Never auto-equip, assign classes, raise the cap or discard stored XP.

The current verifier has 29 source syntax checks, 462 rules, eight command journeys and eight browser suites, including `pursuit_browser.py`. Historical counts above describe their checkpoints only. Fresh verification and exact pushed-head clone evidence are required for delivery. The new source/browser CI matrix has ten jobs. Preserve both cameras and all creative/campaign checks; gameplay footage and human acceptance remain distinct.

## Independent character extension

Read the dated character task/results notes. `characters.js` stores 1–3 complete canonical worlds in the optional `eternities.realm10.characters.v1` envelope. The same write commits outgoing state and active selection. Never use `Simulation.save()` directly for managed app saves, split identity/payload into uncoordinated keys, reuse deleted IDs, or replace existing slots during import. A Web Lock and exact source bytes protect managed writes. Legacy recovery keys stay present.

Switch only after persistence succeeds, through the full app restore path. Clear transient combat/input/music/UI state, and use the validated simulation state after migration. Pending file/audio operations must retain their starting character identity. World9/adventure6/starter1/pursuit1/cameraViews1 and XP1–5 rules remain unchanged; classes stay unassigned. The verifier adds the roster journey/browser gate; use fresh exact-head evidence and keep human playtesting distinct.

## Chosen class extension

Read the dated class task/results. `classes.js` owns explicit choice and technique rules; adventure schema7 requires classPathv1 and migrates earlier worlds to unassigned without changing XP or history. `damageEnemy` accepts an explicit source label; only player blade attacks and actual arrow collisions may consume Hunter's transient mark. Companion/soul/spell/default damage must retain their source distinction. Class cooldown persists, mark does not. Do not turn class choice into gear replacement, profession, morality or an implicit respec rule.

`classes-ui.js` uses canonical definitions/stats and production commands. X adds one optional technique; all prior controls and modal input boundaries remain. Timed archery medals exclude class techniques. The verifier adds the complete class survey journey and `classes_browser.py` to the previous gates. Report exact-head fresh source/browser evidence and actual footage separately from founder enjoyment.

## Connected outing and import ownership

Read the dated outing readability results. Practice links reuse accepted navigation and the existing riverbank entry; HUD directions reflect the current scene and claim proximity. Presentation never grants a class, equipment or survey reward. Keep class badges tied to the complete world in each roster slot.

World-file reads must retain their starting simulation, active identity, saved revision, import mode and latest request token. A character switch or superseding selection invalidates the old read before preview; older cleanup must not clear newer input. Keep delayed-file regressions alongside score/export ownership tests. World9/adventure7 and existing nested versions remain unchanged. Frame-interval reports identify actual renderer, driver, drawing-buffer resolution, source hash, scene setup and measurement limits.

`tools/play_local.py` and `PLAY_FIRSTLIGHT_WINDOWS.cmd` serve only the identical generated game on a stable loopback origin. Preserve the default 8780 port, exact-build reuse, conflicting-server refusal and Windows exclusive binding. Never stop another server or select a different save origin automatically. Launcher tests belong in the existing Python source gate.

## Cosmos M1 and recovered realm vision

Read the comprehensive vision index and dated Cosmos task/results. Dom resumed this bounded scene after the earlier timed window; historical no-new-realm constraints describe the earlier equipment milestone. `cosmos.js` owns fixed ground/solids/height and transient travel; art/UI cannot invent durable visits, payouts or progression. Save versions and XP remain unchanged. Confirm entry against the current simulation, character, revision, source and destination, save before scene mutation, and roll back failed construction. Reopen/switch resumes at the disclosed valley checkpoint.

Preserve height-aware player, companion, camera and click handling, complete movement segments at corners, both cameras and low/reduced-motion routes. Sky images are visual geometry with no collision, shadow or payout authority. The verifier includes `cosmos_journey.cjs` using a freshly command-earned veteran source and `cosmos_browser.py` for actual UI, keyboard, storage, companion and roster boundaries. The checked-in veteran browser fixture is labelled synthetic automation evidence; never request personal saves to satisfy these gates. Earth is the home anchor. Other realm packages remain design sources until their own bounded implementation branch.

## Road After Rain, Earth E2

Read the dated Road After Rain task/results. `earth-story.js` owns finite task/dispatch/arrival/claim rules; `earth-story-ui.js` projects them; Earth art reads them. Adventure8 requires earthStory1 and migrates schema7 to unaccepted work, preserving prior data. Do not weaken forward-version refusal, infer consent from scenery, or turn the completed story into a repeatable payout. The three routes are compatible; one delivery and one payment remain authoritative across reload, request-ID changes, capacity refusal and later improvements.

Mill repair explicitly costs2 timber. Quarry blocks and detour notes stay quest-only; no hidden normal-inventory mutation. All reward capacities validate before any grant. The west-road handoff does not bypass Bellweather chapters. Offscreen cart travel is disclosed and not an escort simulation. Both cameras, existing local checkpoints, stored XP, gear identity/sockets/fittings, independent characters, companion and creative systems remain.

The portable verifier includes three command-earned Earth-story journeys and `earth_story_browser.py`; CI adds its isolated browser job. Keep synthetic capacity/malformed-state tests labelled separately from earned journeys and normal-time GPU footage. Report exact-head fresh clone results and real failures/skips; human enjoyment remains separate.


## Mara's field-note extension

Read the Marks Beneath the Rain task/results and fresh canon intake. `earth-notes.js` owns accepted observations, comparison and one tentative interpretation; UI owns transient bearing and art reads state. Adventure9 requires earthNotes1, migrating schema8 to unaccepted notes without altering unpaid delivery or prior canonical data. Do not coerce array/object values into stable interpretation IDs or weaken forward refusal.

Both 0° and180° match the north–south axis. Physical proximity/line and all three observations are required at comparison. The chart grants no XP, item or currency and does not overwrite personal notes/music. Distinguish observed marks, Mara's hypotheses and world truth; do not silently turn an optional mystery into confirmed cosmology. Her existing schedule stays intact; a field note does not claim she is always present.

The portable verifier adds three command-earned continuations and `earth_notes_browser.py`, including diagram dimensions, both camera presets, save/reload and character ownership. Keep actual normal-time GPU footage separate from accelerated coverage and human playtesting. Preserve all prior systems and no automatic merge/deploy.


## Living world, native gathering and visual atlas

The active integration uses adventure10 and required earthGathering1. Native Adventure validation/commands own this state; the historical adapter and staged candidate builder do not patch the normal app. Migration9 adds empty, unaccepted hospitality only. Preserve strict future refusal, each character's complete world, Fenna's separate unpaid claim, existing XP and all personal creations.

Arrangement confirmation captures simulation/revision and rechecks proximity. Audio preview is optional and cancellable across mute, menu departure, blur, hidden page, restore and character switch. Audio getters must remain pure: mutual exclusion belongs at explicit personal/gathering play entrypoints. Previewing or muting never writes the player's score.

Art must share reachable interaction anchors, read rules and preserve navigation solids; test the visible location as well as canonical point constants. Decorative details stay out of camera bounds as appropriate. Keep Earth height-aware cutaways, both camera styles and reduced-motion wheel behavior. Report geometry count and measured hardware cost separately.

The realm atlas is read-only concept direction. Available Earth/Cosmos actions use existing invitations; Heaven/Hell/Atlantis remain future realms. Preserve original generated rasters/provenance, committed compressed runtime assets, dependency-free offline assembly and exact identical HTML. Do not add network fetches, infer canon from a painting or claim Blender/GLB support without proving an import path.

The verifier includes three native gathering continuations, gathering_browser and realm_atlas_browser alongside all older suites. Keep real-time GPU footage, software-WebGL regression evidence, source review and human acceptance distinct. No automatic main merge or public deployment.


## CC0 material authoring and heavy storage

Dom authorized Firstlight asset acquisition and heavy storage on D: on 2026-09-30. New source maps, Blender files, caches, captures and verification clones belong under `D:/07-GAMES/Firstlight`; keep lightweight source and current live checkout paths stable unless a separate checked worktree move is needed. Read `docs/art/MATERIAL_LIBRARY.md`. Selected completed C artifact leaves move only with exact manifests, verified D copies, retained originals and C junctions. Never move personal profiles, the canonical repository or active/shared tools implicitly.

`tools/authoring` is an optional authoring workflow, not a runtime dependency. The five Poly Haven surfaces are CC0; website example renders/logos are excluded. Freeze membership and verify publisher sizes/checksums plus local SHA256; replay must not download or overwrite acquired files. Source maps and packed .blend files stay outside Git. A Blender material study is not browser texture support, gameplay footage or founder art approval. The existing offline renderer still needs a measured UV/material integration proof before these maps enter gameplay. Keep both cameras and all save/progression contracts.

## Embedded timber material proof

Read the 2026-09-30 timber task/results. `surface-assets.js` embeds the verified 512px JPEG color and grayscale PNG roughness through the dependency-free builder. Source/derivative receipts and actual headers must agree; full sources and Blender outputs stay on D. `timber-panel` retains box extent/normals/instancing and supplies six-face UVs. Keep per-batch material flags separate from wind/sky/terrain parameters.

The Engine owns the image pair and texture lifetime. Both images validate before upload; scene clear retains maps, disposal/context loss retires callbacks, and failure renders the existing plain material. Color uses sRGB sampling, roughness is scalar. The measured strip reference is an artistic palette calibration, not a full PBR model. Preserve reflections, shadows, cutaway, both cameras and low/reduced-motion behavior. No new save version or reward authority belongs in art.

`timber_browser` checks actual texel values, visible fallback/cutaway/reflection pixels, repeated scene rebuilds, source-side reload and the app's context-loss map/save/export path. Its synthetic probes are not progression. The verifier and isolated CI matrix include this suite. Report decoder/upload CPU time and estimated storage separately from GPU completion; texture-toggle RAF samples are not monitor timing, a full old/new benchmark or human approval.

## Traveller silhouette and attachment ownership

Read `docs/art/TRAVELER_BROWSER_RESULTS_2026-09-30.md` and its task note. `traveler-art.js` owns pure distance-driven motion/pose and existing-batch body geometry; `traveler-equipment-art.js` projects canonical owned equipment onto that same joint frame. WorldArt owns transient motion and accepted release ordering. Reset on simulation/scene/restore discontinuity; never serialize animation or derive successful hits from pose. Existing adventure/arsenal art retains enemies, projectiles, hit effects and range scenery, without duplicate held weapons.

Successful existing weapon-equip receipts delimit presentation epochs, including multiple commands before one frame. Preserve new accepted releases after equip, fence old releases before equip and same-frame re-equips, and respect scene/paused-command refusal. Read actual command ordering rather than requiring a render between inputs. A finite transform is not proof of live visibility; keep submitted matrix checks, isolated framebuffer probes, gameplay footage and human visual acceptance distinct. No combat rule, camera or save migration belongs in this art slice.


## Crafted mill gate projection

Read the 2026-10-01 mill task/results. `mill-gate-art.js` owns pure fixed frame
and moving leaf geometry, projecting the existing saved `mill-gate` objective.
Keep root/repair prerequisites, two-timber charge, once-only payment and
navigation in their current rule owners. WorldArt's dynamic timber group exists
only in Earth; local X follows vertical plank grain through positive-determinant
matrices. Preserve map/fallback/shadow/reflection/cutaway ownership and exclude
decorative joinery from camera solids. No new save/migration authority in art.

Completed local inspection closes through RPGUI's ordinary pause/focus path;
remote inspection offers real walking. Never force resume or camera preferences.
The wheel uses simulation time and respects reduced motion. Keep original
static-eight material assertions alongside explicit gate-member coverage.
Normal-RAF animation probes need separate storage and runtime-error listeners;
submitted transforms are not framebuffer motion or GPU timing. Both views,
all existing suites and exact-head fresh clone remain delivery requirements.


## Dedicated millwright presentation

Read `docs/art/ANSEL_RESULTS_2026-10-01.md` and the dated task. `millwright-art.js`
owns Ansel's pure body/tool frame at his existing anchor. Earth art supplies
simulation time, ground height and reduced motion; WorldArt clears the transient
frame on scene rebuild. Keep palms and square in one matrix frame and connect
limbs through full3D segment bases. Do not reuse player appearance, equipment,
accepted-release epochs or stored quest data as NPC animation state.

Every body/tool part excludes camera solids and actor cutaway. Preserve the 64
instance budget and existing box/round/octa groups. A held measuring tool does
not imply repair progress or contact with the distant sluice. Quest acceptance,
cost, retry and payment retain their existing rule owners; no migration in art.

Normal-time browser probes foreground their separate page, assert visibility and
record hidden/pause/reduced state. Await actual normal RAF samples; a timeout or
test-owned callback alone is not evidence that app.js rendered a new frame.
Keep isolated pixel contribution, full-scene readability, actual video, GPU frame
intervals and human recognition/comfort as distinct evidence. Both cameras and
all existing suites plus exact-head fresh clone remain delivery requirements.

## Fenna drover presentation extension

Read the dated Fenna task/results and actual screenshot receipts. `drover-art.js`
is pure presentation: existing dispatch/arrival state chooses exact resident/cart
anchors and opened cargo. `earth-story.js` retains consent, route and payment.
No schedule, escort, material grant, player-appearance owner or save field moved.
Simulation time freezes through pause/dialog; reduced motion retains one pose.
The holding hand/coil and proper 3D limbs share actual transforms. Four wheel rims
meet per-footprint ground; shafts must clear both actor and gathering approach.

Preserve shape kinds when checking conservative actor bounds: Engine octa Y uses
plus/minus 0.65 rather than box 0.5. Source/math tests alone missed the initial
shaft overlap. Keep reproduced failures, interrupted proof, final exact-source
gates and real full-scene screenshots distinct. Both cameras, all current suites
and exact-head clean clone remain required. World/key 9, adventure 10 unchanged.
Heavy work stays on D; no paid-provider/billing/personal-profile/merge/deploy action.


## Hearthwater bridge and world-oriented weather

Read the 2026-10-01 bridge task/results and actual screenshots/video. `earth.js`
owns one frozen bridge ground/span/deck definition. Pure `bridge-art.js` reads it;
Earth art omits filled terrain beneath the crossing. Preserve entry/return/bridge
anchors and supported movement/picking segments. The rail-mounted visual marker
must clear the full actual traveller corridor, not only isolated bridge parts.

The two bounded vault/ridge meshes require outward normals and exact visible
clearance checks. Clouds use the real reflected P×V×H ray basis; Earth current/wakes
read shared channel uniforms. Keep water y0.01, low fallback, reduced-motion time,
non-Earth rendering and material lifetime. No backdrop/camera action can grant
progression or own saved state; side framing closes the existing dialog path and
retains both V/R/orbit camera contracts. World/key9, adventure10 are unchanged.

The verifier/isolated CI matrix adds bridge_browser. Keep independent same-time
framebuffer cloud/current toggles, separate normal visible app RAF walking/pause,
all older suites and exact-head clean clone. Report source geometry, software pixels,
normal-time actual video, short hardware intervals and human taste separately.
No concept art presented as gameplay or implied photorealism. Heavy work stays on D;
preserve stable8780 save origin, personal data and no automatic merge/deployment.


## Bridge shoreline and authored mountain atmosphere

Read the dated shoreline task/results. Pure bridge art dresses existing support with7steep skirts/12lowrocks and36ridgeparts;Earth navigation/anchors stay unchanged. The72-triangle bank-slope meets the grass underside,floods its lower seam,and leaves the full bridge opening/corridor clear. Test transformed actual meshes and exact seam heights,not only part tags. Keep bank dressing below supported feet and no unsupported flat shelves. Distant hill crowns intersect parents without altering the deterministic random sequence. Engine mountain-only haze resets per batch and uses authored depth,not camera-eye distance or wind/sky/terrain flags. Earth optical profile keeps P*V*H/y.01 and non-Earth invariance;both-camera same-time pixel probes,ordinary visible RAF and all older gates remain. No new texture,render pass,save schema or reward owner in this slice. Narrowcap/stylizedreflection/nearrail-leg overlap and human taste remain honest limits;heavy artifacts onD,bounded Cproof allowed for measured I/O stalls. No bypass of the previous preview guard.

## Bridge rail visibility extension

Read the dated traveller task/results. Only44bridgeRail boxes share a dedicated
static box instance batch. Reset uRailCutaway each geometry batch;main/Earth/
supported span/existing cameraCutaway only. Do not alter generic alpha/wind/terrain
channels,physical geometry,traveller pose,reflection/shadow,marker or saves.
Keep actual-geometry leg/reference pixel coverage with water excluded only from
the test ID pass. Translated static pose tests are distinct from ordinary app
RAF footage,human comfort and sustained GPU performance. Preserve both cameras
and all existing owners;fetch latest review heads before the next local outing.

## Selected foe action readability

Read the 2026-10-01 combat-opening task/results. Combat's transient `threat`
projection reads the actual selected foe's owner, mode and current timer; AI,
damage and payout stay in Adventure/Beacon/Crossing. Preserve separate HP/player
readiness. Bell inner/outer rings, ward-directed strikes and untimed charges have
distinct copy. Countdown rounds positive fractions upward; recovery never implies
guaranteed reach, stamina or impact. Brace copy reflects real active/cooldown/cost
state. Clear cues on pause/death/invalid selection without mutating AI timers.
Narrow ward layout follows target border-box size through ResizeObserver, with no
per-frame forced measurement. Keep synthetic layout/owner boundaries distinct
from earned blade/bow/veteran fights and normal-time RTX footage. The verifier/CI
adds combat_cue_browser; all older gates and fresh pushed-head clone remain.
World/key9/adventure10 unchanged. Dom approved the bridge appearance and stated
future open-world/massive-water ambition; that is direction, not implemented scale
or a combat/comfort playtest. Saves, cameras and review/deployment boundaries stay.
