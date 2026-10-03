# Exact ground-cell coalescing

The connected Elderweald extension introduces a larger continuous Earth footprint. The existing shared ground renderer partitions the whole realm at every canonical patch X/Z edge. The chosen-owner partition is correct, but its global grid produces **955** Earth rectangles and **1,904** submitted floor/shore-mass boxes before other scenery. This pure optimization reduces the same terrain to **64** rectangles and **126** boxes. It retains every square metre, selected patch owner, color, height, gallery classification and other data metadata.

This is an engineering presentation change. It adds no canon, terrain, collision, save field, job, reward, interaction or quality-dependent support. Elderweald's attributed design direction and the original local geometry remain in `ELDERWEALD_WORLD_2026-10-03.md`. Root owns `src/world-foundations-art.js`, script/build wiring and actual rendered parity checks. This isolated slice owns only `src/world-ground-coalescing.js`, `tests/world_ground_coalescing.test.cjs` and this note. Its baseline is the clean geography branch after `b8ee25a82fa36e985993c42e3221b62c93fc9c9f`.

## Small API and integration contract

The frozen global `RealmWorldGroundCoalescing` and CommonJS export contain only `{coalesce}`. `coalesce(cells)` receives the already selected canonical-owner rectangles. It first merges complete horizontally adjacent edges, then vertically adjacent edges with identical spans, repeating those two bounded passes until no rectangle count decreases. This handles a vertical merge that enables a later horizontal merge and makes output replay stable. **All nongeometry enumerable data values participate in equality**, including `source`, `color`, `y`, `gallery` and nested metadata. Property order does not alter equality. Exact numeric adjacency is required; a small positive gap never becomes a bridge through an epsilon comparison.

The function returns fresh deterministic rectangles and deep copies of metadata. It preserves holes and refuses ambiguous overlapping cell interiors, nonfinite/nonpositive extents, unsupported functions/classes/cycles/symbols/accessors, hidden cell metadata and nonfinite output extents. It reads no engine, DOM, simulation, settings, save or clock. Empty input returns a fresh empty array; applying it again returns the same rectangle data.

Root's intended caller is:

1. `rawPartitions(def)` chooses canonical owner/color/height at every patch and dive-volume edge.
2. Each raw cell records its actual `gallery` boolean before coalescing.
3. `partitions(def)` returns `RealmWorldGroundCoalescing.coalesce(rawPartitions(def))` for floor/mass submission.
4. **Coast-bank generation continues to use the raw partition cells.** Its midpoint neighbor test relies on the fine edge segmentation. A coalesced rectangle edge can face only a partial neighboring rectangle; testing that edge once at its midpoint could hide a real shore or emit an internal skirt. Ground rectangles are safe to merge; that is not proof that the bank consumer may reinterpret their larger edges.

The gallery tag is necessary. Existing same-owner Atlantis court/causeway cells can lie on both sides of the dive-volume edge. Without the tag, legal metadata-equal merges could cross that edge and the renderer's centroid classification would change shore mass/cutaway coverage. The focused test retains an explicit untagged negative control and proves that the tagged output never crosses the gallery boundary. The realm-independent helper does not guess a boundary absent from its input.

## Exact CPU evidence

The focused test obtains raw cells from the actual production partition function and uses a composed Earth data fixture that includes the extension exactly once. It supports source-only code and installed production's `rawPartitions`/`partitions` exports. In source-only runs the fixture explicitly supplies the caller-owned gallery tag. When the installed raw export exists, the test also requires actual raw tagging and exact equality with the installed coalesced output. This is geometry/data qualification, not an earned character route or browser/GPU capture.

| Shared renderer footprint | Raw rectangles | Coalesced rectangles | Floor/mass boxes before → after | Box vertices per geometry pass before → after |
| --- | ---: | ---: | ---: | ---: |
| Older Coastward control | 304 | 41 | 605 → 81 | 21,780 → 2,916 |
| Coastward + Elderweald | 955 | 64 | 1,904 → 126 | 68,544 → 4,536 |
| Atlantis, gallery tagged | 122 | 22 | 238 → 41 | 8,568 → 1,476 |
| Heaven | 7 | 4 | 14 → 8 | 504 → 288 |
| Hell | 13 | 5 | 26 → 10 | 936 → 360 |

Expanded Earth retains exactly **18,379.5m²** of raw partition area. That area includes all existing Coastward ground; it is not the area of only the new woodland. Both Earth bridge source footprints still each produce one exact supported rectangle. The four-metre river void remains a hole. Atlantis's gallery retains three coalesced tagged cells in place of six raw cells, with identical wet/dry area and boundary ownership. Cosmos has its own scene/height owner and does not use this shared ground renderer; it is not represented as a flat test case.

The exact-union check partitions the combined input/output boundary grid and compares coverage count and full metadata at every elementary open cell. It independently compares total area and per-owner/metadata area. Additional controls cover corners, L-shaped partial neighbors, holes, tiny gaps, differing color/height/gallery/bridge fields, deep-fresh nested metadata, input permutations, replay, malformed data and finite actual `Engine.geometry('box')` transformed vertices.

Run `node --check src/world-ground-coalescing.js` and `node --test tests/world_ground_coalescing.test.cjs`. The source-only focused suite passes **11/11**, zero skips. One initial Earth coalescing sample took about **11.2ms** in local Node; this single CPU sample is not a browser frame budget or sustained performance result. The overlap guard is quadratic in input-cell count, intentionally bounded here by the actual 955-cell production footprint; it is not a general large-map spatial index.

Removing these internal boxes saves **1,778 static instances** and **64,008 submitted vertices per geometry pass** for expanded Earth. On the earlier integrated balanced source submission of 3,045 static records, the corresponding arithmetic predicts 1,267 after the replacement, holding all other submissions constant. That is a prediction pending Root's actual caller measurement. Instanced mesh groups may keep the same draw-call count. Reflection/shadow passes, GPU timings, memory, both-camera pixels and native traversal remain Root verification work; exact CPU union/ownership is not pixel parity or human readability certification.
