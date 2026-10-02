# Bounded finite fitting geometry review

The submitted blade and uppermost bow collars preserve the existing equipment geometry and clear the River, temper, socket and socket-mount markers in **504 bounded CPU specimens**. This is source and geometry evidence; it is not a browser, GPU, video or human acceptance review.

Reviewed checkout: `D:/07-GAMES/Firstlight/authoring/bridge-moment`. Observed HEAD after the probe: `329caa5aea6d90bdafc639e7535ad3699f2840a6`; status was clean at that observation. All **24 imported/key source files** were hashed before and after the short probe and remained unchanged. The exact inventory is in [FITTING_GEOMETRY_REVIEW.json](FITTING_GEOMETRY_REVIEW.json).

- Equipment art SHA256: `11ab5758a1056e9fa5c1fe2df95af978e13e1ce141c21d35f7a71f3fc1c7f2e9`.
- Equipment test source SHA256: `90a679e12c5d91e0beca53dddff6ba9de637a7ad35c8c9a866404c4133e82dba`.
- Separately observed `index.html`: `8ad7e3f020eb93b79b2d812e51a86248780c54b28593face9a115412f7e7b5bf`, 2,424,144 bytes. This does not establish a source-to-build match or capture acceptance.

The replayable [fitting_geometry_review.cjs](fitting_geometry_review.cjs) uses actual production `Traveler.pose/draw`, `TravelerEquipmentArt.draw` and submitted matrices. Ownership, prior River/temper/socket history, claimed trail and fitting are explicitly synthetic. It covers seven canonical weapons, held/stowed, three phases, three progress values, guard on/off and reduced motion on/off: **216 bow and 288 blade cases**, at root yaw .83 and base 2.4. No game commands or rewards were earned in this probe.

The review checks exact preservation of every non-realm-fitting part, read-only state, one violet body and two brass trims, body/trim attachment and face joins, and separating-axis tests on the submitted oriented boxes. All 504 baseline geometry comparisons and state comparisons pass. Minimum separating-axis clearance from protected markers is **0.08611456** world units. The six box face axes plus nine non-degenerate cross axes are used; separation must exceed 0.000001. Socket-octahedron bounds are conservative.

Blade source anchors: `src/traveler-equipment-art.js:60-64` and `:93-94`. The old River stage-2 interval is .3095–.3705. The new body at .54 spans .495–.585; brass trims at .4825 and .5975 span .47–.495 and .585–.61. That gives **.0995** separation from stage 2 and exact face-to-face trim joins. The body remains on the rendered blade/sheath axis.

Bow source anchors: `src/traveler-equipment-art.js:120-124`. The body follows the actual upper `nodes[3]→nodes[4]` midpoint and beam basis, with .05 body length and .015 trims at ±.0325. The **.08 total assembly** fits the shortest submitted segment, **0.10700897**, leaving at least **0.01350449** longitudinal margin at each end. Maximum normalized axis error is 3.039e-8; maximum trim-join error is 5.172e-7.

The earlier nodes2→3 midpoint proposal is retained as a detecting regression specimen: the .14 assembly produces **180 intersecting protected-marker pairs** across 216 bow cases, with worst SAT gap **-0.03997443**. The upper-segment treatment resolves that marker interference. This comparison reuses each actual submitted limb basis, so root yaw does not substitute a different cross-section orientation.

**Intentional tip joining remains:** the upper band intersects the original round bow-tip cap's bounding box (432 collar/cap OBB pairs). Root explicitly accepted this ornamental joining. The original tip's geometry and colour are unchanged. The cap is round, so these counts are bounds evidence; no claim that every equipment part is disjoint is made. Actual visibility and the resulting ornament require Root's paired captures.

The existing fitting browser assertion checks only bonus/presence. Root's new source regression at `tests/traveler_equipment.test.cjs:169-188` meaningfully checks all old parts unchanged, colours, physical center/basis, read-only state and OBB separation from River/temper/socket. Root separately reported its 84 synthetic catalogue poses passed and that the same regression failed the prior lower placement. That test was **not rerun** here.

Replay command: `node fitting_geometry_review.cjs D:/07-GAMES/Firstlight/authoring/bridge-moment`. A replay against changed source is new evidence, not this receipt. No runtime, tests, builds or repository files were edited; only these new heavy review artifacts were written. No suite, browser, GPU, service, personal-save or network action was run.
