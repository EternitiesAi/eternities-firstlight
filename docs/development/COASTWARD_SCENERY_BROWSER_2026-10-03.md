# Coastward scenery: production integration qualification

This bounded check reviews the original settlement and woodland presentation at integrated source `7c50f8a9f96fc2de5ed77f7a6aa427a37cb1b529`. The generated HTML is 2,484,452 bytes with SHA256 `60a89cdf2e2747511f9d59f358923c93a96394dea5e5c4e0895838cc8b8eb16c`. A separate clean local clone was made from Root's shared Git repository; concurrent capture/measurement tool edits in Root's working checkout were preserved. The qualification branch owns only the new browser check and this note.

The author of this harness also authored the pure scenery modules. Review of those modules is **author review**. Review of Root's real caller, renderer, navigation and character-import integration is a separate integration review. Neither is human acceptance.

## Scope and source attribution

Dom's attributed Earth direction in [the realm charter](../design/FIRSTLIGHT_REALM_CHARTER_2026-09-11.md) calls for woodland greens, water blues, wood/ground browns, ordinary villages and living textures. Recovered Earth design describes working Crownfields and mixed woodland, coppice and clearings. The broader recovered setting is not implemented by these three houses and ten trees. Coastward, Merren, Vessa, the house dressing and mixed crown profiles remain original provisional interpretation; they are not promoted to recovered canon.

The important production ownership paths are:

- `src/world-atlantis-earth.js`: calls both pure decorators in the existing Earth decoration path, replacing the three roof/front calls and old stacked crown cones.
- `src/world-foundations-art.js`: still draws ground from canonical patch partitions and each original authoritative solid box. Bank appearance does not become an additional floor or collider.
- `src/world.js`: `WorldArt.add` preserves supplied matrices and appearance metadata, then the actual `commit` submits these records to static renderer batches.
- `src/engine.js`: `batch` creates actual supported-kind VAOs; `updateBatch` stores Float32 instance matrices; `solidBounds` excludes `cameraSolid:false`; ordinary cutaway and foliage wind retain their existing shader owners.
- `src/core.js`, `src/characters.js`, `src/app.js` and the production menus continue to own import, movement, travel and persistence. The observer invokes none of their commands directly.

Settlement roofs/facades retain `cutaway:true` and matching parent IDs, while woodland parts retain `cutaway:false`. All new records are appearance-only and `cameraSolid:false`. Generic wall/trunk boxes remain authoritative. Closed doors/shutters/packed boards add no entrances, stock, new interaction, schedule, reward or harvest entitlement.

The existing wind shader deforms individual crown vertices. CPU bounds reserve its 0.095 m X and 0.05 m Y envelope; the browser's positive pixel check does not establish a rigid animated branch/leaf joint. Both opaque crown readability and cutaway taste still need human review.

## Browser method

`tests/coastward_scenery_browser.py` launches headless Chromium with **software SwiftShader** into a disposable native profile on an ephemeral loopback origin. It does not access a personal browser profile or the existing preview server. Low graphics are selected through Settings, and time flow is disabled through the same normal menu. Native RAF and elapsed simulation time are never intercepted, synthesized or accelerated.

The exact checked-in `examples/CHAPTER_COMPLETED_EARNED.json` has SHA256 `27cb70f57c3584f7de69f667544c8215c6fbc5f7f3d45d7fb7bc241f1cabce49`. It is a **command-earned Chapter I completed checkpoint**, not Chapter IV. The test selects it through Import character's actual native file chooser and confirms its addition as a separate character. It verifies the earned Briar bond/reward and unassigned class. No ancestry or class is inferred from scenery.

The test uses visible Roads, Local map Walk, Pause, camera and free-home controls. It walks from the home checkpoint to the five-light gate, crosses deliberately, traverses the long channel bridge and woodland approach, reaches the field-water point and settlement register, and returns home. No test-mode hook, teleport, coordinate assignment, direct move/step command, quest acceptance or payout is used. Native writes made by those deliberate controls belong solely to the disposable profile.

A read-only wrapper observes the actual Coastward `WorldArt.commit`, preserves its call/return and immediately restores the prototype. It reads actual static items, VAOs, instance-buffer matrices, renderer meshes and camera-solid metadata. Full-body route/anchor checks use the submitted transformed mesh bounds, not a separately generated copy of the scenery.

For each scenery group in both camera styles, a **single actual frame** has an explicitly labelled appearance ablation. The original renderer is called with identical time/hour/weather/camera arguments, once with actual geometry, once with only the selected appearance records omitted, then once restored. Every original batch/item/data reference and render writer is restored synchronously before the next simulation frame. The check compares the actual main framebuffer, records pixel differences and verifies exact recovered pixels plus unchanged canonical state/camera/collision. Ablated images are diagnostic counterfactuals, not gameplay footage. These added rendering passes are not performance samples.

## Focused results

The focused browser run completed with **33 passed checks, 0 failures and 0 browser/application errors**, in 154.397 seconds of wall time. Its exact runtime/source epoch is the commit/HTML pair above. The passing harness SHA256 is `1bb6e832520af740a89454845d1d3e19bf2475f038d61ae677e3822a8fc8a359`. The report is at `D:/07-GAMES/Firstlight/artifacts/realm-outings-2026-10-02/coastward-scenery-software-7c50/run-06/REPORT.json`, SHA256 `f947a057586daf7061cdd0918db9d8ea18389d0f6fe8e285ed6180ead1497251`. It inventories all 17 PNG outputs with exact hashes and byte counts, the imported fixture, eleven reviewed production source files, submitted meshes, actual navigation/camera diagnostics and matched renderer counters.

Production submission checks observed the complete 140-part woodland and 177-part settlement, positive finite actual full matrices/mesh vertices, supported VAOs/kinds, grounded roots/roof shells, unchanged thirteen authoritative parent boxes, expected cutaway metadata and no scenery camera/collision authority. Conservative full-body tests cover every authored Earth route and current foundation/trail anchor. Actual ordinary-time UI walking reached the channel crossing, field-water point and delivery register; the free-home control returned to the saved five-light checkpoint. This does not establish that every possible route was walked.

Both real camera styles produced positive appearance contributions at the actual stopped character positions:

| Group/view | Removed appearance records | Changed pixels in 1088 × 680 main framebuffer | Recovered RGB difference |
| --- | ---: | ---: | ---: |
| Woodland, third person | 140 | 22,320 | 0 |
| Woodland, diorama | 140 | 7,068 | 0 |
| Settlement, third person | 177 | 33,319 | 0 |
| Settlement, diorama | 177 | 53,540 | 0 |

The difference threshold is summed absolute RGB greater than 6 per pixel. Each comparison restored all original batch/item/data references and method ownership, and found no canonical state, actual character, camera or collision change. The ordinary outing left equipment/inventory/XP/currencies/class/companion/trail/journey ownership unchanged. Inspection of these four actual UI stills finds attached crowns and grounded exterior shells with readable open ground; it does not establish human enjoyment, dense forest character, roof-material quality or camera comfort in all locations. The ten trees still form a sparse opening, and the three buildings retain simple walls beneath the added dressing.

The submitted woodland inventory is 140 instances rather than the old 30 cone crowns. Its current meshes contain 30,768 vertices / 10,256 triangles per geometry pass. The 177 settlement instances contain 6,336 vertices / 2,112 triangles per geometry pass. The actual static Coastward scene contains 1,234 instances and twenty camera-solid boxes. In each matched low-mode ablation, draw calls stayed at 15 while the selected group's instances/triangles disappeared and returned exactly. Existing kinds share existing batches; unchanged draw counts do not mean zero vertex/shading cost. Dynamic marker counts differ slightly between the four stopped views, so compare each actual/ablated pair rather than combining total-scene counters across views. These numbers are not sustained FPS, draw cost on another device, mobile suitability or full shadow/reflection performance.

Replay from the repository root with the existing Playwright Python environment:

```text
python tests/coastward_scenery_browser.py
```

`FIRSTLIGHT_TEST_ROOT` can select a repository checkout. Optional `FIRSTLIGHT_EXPECT_HEAD` and `FIRSTLIGHT_EXPECT_HTML_SHA` assert its requested epoch; `FIRSTLIGHT_SCENERY_OUTPUT` selects the evidence directory. Otherwise the report/PNGs use `evidence10/coastward-scenery-browser`. The test-only handoff commit is later than the tested runtime commit; it adds this harness/note without changing that runtime.

## Retained failed harness evidence and limits

Earlier receipts remain in `D:/07-GAMES/Firstlight/artifacts/realm-outings-2026-10-02/coastward-scenery-software-7c50/`:

- Runs 01 and 02 clicked Import character but assigned the input separately, allowing the unconsumed native chooser's cancellation to invalidate the file read. The file itself validates against production Core. Consuming the actual chooser fixes the harness interaction; no fixture/runtime bypass was introduced.
- Run 03 looked for an All five roads button on an already-open all-roads page. The repaired harness follows the actual visible gate action there.
- Run 04 compared double-authored matrices to the Float32 buffer with an inappropriate 1e-6 tolerance at large Z coordinates. Exact equality to `Math.fround` of each authored matrix element now checks the real buffer contract; finite meshes, positive bases and supported VAOs were already observed. No geometry was changed to satisfy the check.
- Run 05 read the persisted `Realm.state.player` home checkpoint while waiting for an actual visit position. Its retained screenshot and diagnostics show that the real character had already arrived at the channel crossing. The correct public `Realm.diagnostics.adventure.player` supplies transient route positions. Snapshot/home-checkpoint semantics were preserved, rather than changed to make the harness pass.

This focused software check does not run the full gate, hardware GPU captures, native abrupt-close durability experiments, mobile/accessibility coverage, every route/animal encounter or human playtesting. No whole woodland/world, new interior, gathering system, character grant, performance certification or founder enjoyment is claimed. Root owns hardware/caller build integration and final delivery proof.
