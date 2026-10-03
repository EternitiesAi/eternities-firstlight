# Earth expedition native capture method, 2026-10-03

`tools/capture_earth_expedition.py` records a caller-supplied, command-earned character taking **Stormfall and the Living Road** through the production interface. The driver is authored separately from Root's runtime integration and recording execution. Its author qualification consists of Python syntax, dry help, source/selector inspection and fixture-shape checks. It has **not been executed in a browser by the author**; a completed `REPORT.json` from Root's later execution is required before claiming a recorded outing.

The final authoring reference is Root `7a17386`, with assembled HTML SHA-256 `f507c14985138791dd6f905357e11658ce318f602d734b2e6fd9243f910b2315` (2,606,071 bytes), after the earlier `fee66ec` dialogue integration. The driver freezes the actual checkout and served HTML at execution. It refuses module/build disagreement or subsequent source drift. Every source file under `src/`, the driver, browser support and build script receives a raw-byte hash and an LF-normalized hash; the exact HTML hash remains authoritative. This reference epoch is not a claim that later recordings use the same build.

## Recorded route

The starting JSON is imported with the actual **Characters → Import → Confirm import** controls, including the native file chooser. It creates a separate second character in an isolated temporary Chromium profile; it does not replace the original character or access Dom's profiles. The original legacy key is read before confirmation and checked unchanged after import. The supplied snapshot must contain Adventure 12, an earned starting kit or the declared veteran weapon, an unaccepted expedition, no Trailward binding, a living traveler, and a player at the Roads gate. The driver's source hash identifies inherited progress; the driver does not independently earn or certify that earlier kit, campaign, socket or fitting history.

After native settings choose balanced quality and disable time flow, the original hour remains. Native camera buttons establish the two requested styles. The recording then shows the crossing description, explicit crossing confirmation, the story's route/danger/payment/allocation/binding terms, the walk to Rill, and actual nearby E acceptance. Every field action follows a visible route button, ordinary physical walking, proximity at most 2.8 m, E, and an explicit work button. Walking alone is checked to leave the expedition ledger unchanged.

The two encounters use Tab to select the accepted actor, wait for a real AI tell, press 3 to Brace, and press 1 for stationary autoattack. Further Braces use actual observed cooldown and stamina. Sampling observes actual actor HP, accepted weapon release epochs, projectile presence for the bow, and the accepted defeat ledger. It neither calls combat functions nor sets damage, HP, movement, targets or timers. A retained following Briar can legitimately contribute during approach and combat; the actor is never restored to full health and the companion is never repositioned, silenced or disabled to stage a fight. The receipt reports HP at arrival separately from declared enemy HP. No claim of exclusive player damage, every hit landing, or human tactical judgment follows from this driver.

The follow-up uses the actual HUD third-person control before each root-bank fight, including patrols, and retains the diorama for crossing fights. It changes the selected native view, not camera orbit values or actor placement. Each marked frame records the camera controls' `aria-pressed`, focus and hover state, and checks that the sole selected control agrees with the actual camera preset. A gold hovered button is therefore distinguishable from the selected camera in the receipt; appearance alone is not treated as proof of selection.

The requested variants deliberately differ:

| Variant | Physical allocation | Deliberate repeat work | Finite binding |
|---|---|---|---|
| `fresh-blade` | Stormfall: 8 timber, 4 fibre | One explicitly accepted and paid patrol, run 1; its 2 fibre cover the remaining cost | Edge on the owned trail blade, +2 attack |
| `fresh-bow` | Managed coppice: 4 timber, 8 fibre | None | Shelter on the owned trail bow, +1 defense and +10 maximum HP |
| `veteran` | Managed coppice: 4 timber, 8 fibre | None | Edge on the owned Dawn Edge, +2 attack beyond retained earlier fittings |

The rules-earned-03 veteran initial source has zero fibre, so the managed choice supplies the real binding cost. No resources are inserted to make the film possible. Story payment is 45 nominal XP, 18 sunmarks and 3 ore plus the chosen allocation; actual XP is capped at stored 9999. Patrol payment is 5 nominal XP, 4 sunmarks, 3 ore, 2 timber and 2 fibre, with no acceptance fee. Complete-but-unpaid UI and full state are captured before the actual claim. Each immediate payment delta must equal that declared package, including actual capped XP.

Installed brace shots use both native cameras at the actual support work point, after the real installation action. The subsequent paid giver stills and reading identify Rill's recognition; their names do not imply that the distant root brace is visible. Sela is approached through the existing local atlas route, read as optional nearby advice, and checked to grant no work. Free home return restores the actual crossing checkpoint. The existing field guide's outdoor Oren route leads physically to the workbench. The binding preview shows costs and before/after statistics, then an explicit confirmation spends exactly 3 ore, 8 sunmarks and 6 fibre. It preserves equipment selection, canonical identity, socket and prior fittings; it does not heal or refill stamina. The model is recorded in both cameras, including an actual V exchange.

A normal page reload ends the route. The actual native character store is read before reload and checked to contain the paid ledger, binding and exact balances. Reload must retain those facts and old ownership. This is a same-profile native **page reload**, not a claim of browser-process restart or OS persistence durability.

## Native practice follow-up

After all expedition payments and before spending the binding cost, the driver follows the existing field-guide Practice route to the riverbank sign, enters with E, then uses the same route inside the riverbank to approach Oren's practice bundle. The real route chooses `(-5, 11.5)` for a blade and `(-5, 6)` for a bow. Tab selects the actual `river-practice` actor. In each camera, native 1 starts autoattack; a newly observed confirmed-hit packet triggers another native 1 to stop it. The target remains selected for the actual **Last confirmed impact: N · no XP or loot** HUD and screenshot. This observes real queued release/projectile and impact timing without injecting damage or simulating ticks.

The actor remains at its canonical 100 HP, and traveler HP, currency, materials, equipment, old histories and expedition work must remain unchanged. This is the riverbank practice bundle, not the separate archery-medal activity. The atlas list's southern exit route and E physically return to Firstlight; the existing field-guide Oren route walks back to the outdoor bench. No ordinary skitter is deliberately targeted or rewarded. A prior active outing is retained, and any unexpected legacy reward fails the recording.

The same two-camera practice round trip runs after the binding. Because both visits occur after the declared XP payments, the comparison isolates the binding from leveling. Edge must increase each actual confirmed impact by exactly 2. Shelter must keep impact damage unchanged while the already checked production stats add 1 defense and 10 maximum health; neither application nor practice heals the traveler. The receipt retains both visits and their actual sampled projectiles/hits. Frame visibility, model readability and human combat feel still require Root's inspection of the recorded output.

The original tool commit `ce9c415` (raw SHA-256 `4122edff67eeb963dca7d681b94dad1f4fce172e02e41301c9385cb0a5164516`) and Root's first blade take remain separate evidence. Root reported that original take passed at `9abfa87` / HTML `b692e1e43648d2a91aff8d05c63a37de2ce124af620ed13fcc1b5e755fba4682`, taking 331.36 wall seconds with 4,351 checks. The author did not independently play or inspect that video. The camera/practice follow-up was authored against that same runtime source and qualified only by syntax/help and bounded caller/selector inspection; its first actual execution remains Root-owned. Later runtime success-caption polish may produce a different HTML hash, which each capture must record rather than relabeling the earlier take.

## Invocation

Run the three variants sequentially while Root holds the runtime and hardware resources quiet. Each output directory must be new. On Windows it must be an absolute D-drive path; the CLI remains portable elsewhere. These commands show the existing labelled source locations; Root may instead supply newly earned current sources with their receipts.

```powershell
$python = 'C:/dev/firstlight-artifacts/bootstrap-2026-09-12/browser-env/Scripts/python.exe'
$earned = 'D:/07-GAMES/Firstlight/artifacts/earth-expedition-2026-10-03/rules-earned-03'
$takes = 'D:/07-GAMES/Firstlight/artifacts/earth-expedition-2026-10-03'
& $python tools/capture_earth_expedition.py --variant fresh-blade --source "$earned/fresh-blade/00_COMMAND_EARNED_SOURCE.json" --output "$takes/native-blade-take01" --renderer hardware
& $python tools/capture_earth_expedition.py --variant fresh-bow --source "$earned/fresh-bow/00_COMMAND_EARNED_SOURCE.json" --output "$takes/native-bow-take01" --renderer hardware
& $python tools/capture_earth_expedition.py --variant veteran --source "$earned/veteran/00_COMMAND_EARNED_SOURCE.json" --output "$takes/native-veteran-take01" --renderer hardware
```

`--renderer software` requests isolated SwiftShader through the existing browser support helper. The receipt records the observed WebGL renderer and rejects software fallback when hardware was requested. It does not assume a particular GPU or certify device performance. The loopback server blocks and records any attempted external requests. No network service, account, downloaded asset or paid API is needed.

## Evidence and preservation

The output retains the original supplied JSON, current pure definitions, full states at significant actions, native saved world, final world, UI readings, screenshots, actual movement samples, combat observations, raw viewport WebM and `REPORT.json`. The WebM is **silent**: Playwright viewport recording does not capture procedural sound, and no replacement audio is added. This task does not encode or qualify a portable MP4.

The preservation projection checks old quest histories, claimed survey/trail records, inventory except the declared timber/fibre changes, owned/equipped gear, sockets, prior fittings, class, companion settings, soul/story choices, tonics/deaths, housing, flowers, notes, music score/revision and visitor identity. Currency, the new expedition/binding, combat HP/stamina, elapsed time, schedules, native presentation settings and bounded command/journal rings have separate scopes. Exact resource-node regrowth and crop ripening are checked against original state, the production Sandbox catalogue and observed elapsed time. Natural regeneration is not treated as a resource grant. The projection does not assert byte equality for the entire world while the simulation is running.

Immediate claim and binding checks prevent unrelated rewards or costs from being hidden in an overall total. Final balances must equal the imported baseline plus the explicitly claimed packages minus the one binding cost. Quest fights must leave legacy XP, coin, ore, drop and defeated records unchanged. Actual combat can reduce HP and stamina; the driver never heals, consumes a tonic or revives to rescue a failed take. Any death, missing route, refused save, absent actor, wrong selector, unexpected reward, failed reload or source drift fails the recording and preserves the last state, diagnostic snapshot, visible UI and screenshot.

Context closure occurs inside the Playwright and temporary-profile lifetimes, flushing the selected page's WebM before video hashing. The loopback server closes in the outer finalizer. Raw failures remain in their fresh output directory. A rerun requires another new directory; there is no overwrite, cleanup or replay of an uncertain in-flight recording.

Ordinary RAF is observed with a separate counter only. No Firstlight test/capture flags, `Realm.test`, simulation stepping, direct game commands, forced camera fields, grants or position edits are installed. Reported wall time, simulation elapsed time, pauses and sampled RAF counts describe this known-route automation. They do not establish human 10–20 minute pacing, whole-world completion, enjoyment, accessibility acceptance, audio quality, continuous monitor FPS or a broad hardware qualification. Root owns actual execution, inspection and subsequent full gates.
