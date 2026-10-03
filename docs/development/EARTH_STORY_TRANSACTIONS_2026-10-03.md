# Road After Rain durable transactions — 2026-10-03 UTC

The actual native mill repair could announce persistent completion after a
refused save. On product `2b2d27ca3a5fb1dd8e4b7faebc06ed5c9db32491`, a synthetic
`Storage.setItem` exception left saved bytes unchanged but spent the player's
two timber in memory and marked `mill-gate` complete. The open dialog displayed
“Work complete · persists on return” and a successful repair toast. Native reload
restored the timber and removed the announced work. This was reproduced through
Fenna's request, root clearance and the actual repair button; no inventory,
position, health or story outcomes were invented.

The narrow correction adds exactly `earth-story-accept`, `earth-story-step`,
`earth-story-dispatch`, `earth-story-arrive` and `earth-story-claim` to the existing
reviewed transaction list. Each handler changes only canonical adventure,
sandbox and journal fields. Existing `AdventureUI.run` and `RPGUI.run` already
route supported commands through the candidate saver and restore the deliberate
reading pause. A refusal therefore leaves work, timber, rewards and command
receipts intact and presents the real error. The same request can retry after
refusal; a successful request cannot replay or reuse its identity with different
terms. No new reward, schema, storage key, migration or live-scene replacement
was introduced. Combat, movement, healing, class/soul changes, hostile shops and
other story effects remain outside this boundary.

All **30 focused CPU tests pass**, including the existing 22 workshop checks
and eight new Earth-story checks. The new coverage proves all five transitions,
prerequisites, insufficient timber, local position/room and pause refusal, exact
one-time cost and payment, zero story XP, all three payment capacities, later
compatible improvements, same-ID retry, different-ID repeat refusal, source
conflict, managed writer refusal, saving before live adoption, and unchanged
runtime/player/path/scene/clock references. CPU boundary placements and balances
are explicitly synthetic. Before the product edit, the existing 22 passed and
all eight new tests failed because these actions were excluded. The first patched
run passed 29/30; its remaining failure was the test retaining an old nested
inventory reference across adoption. Reading the current canonical inventory
fixed that assertion; no product rule or acceptance requirement was relaxed.

Native focused regression is pending at this checkpoint. The new
`tests/earth_story_transactions_browser.py` uses the command-earned
`docs/evidence/road-after-rain/veteran-mill_SOURCE.json`, SHA-256
`4ab77cd0960f8ce17b6814a8d30a60575405d089847c9e45613c08a4b6dd220a`,
actual accepted paths/buttons, one disposable D-drive profile, exact caller
request observation, native reload and frontmost refusal feedback. It includes
a same-ID retry of the original refused native consent request and normal native
retry of repair/dispatch/arrival/payment. Synthetic quota refusal and accelerated
walking are labeled; this is software correctness evidence, not human pacing or
hardware performance.

The original red is preserved under the isolated qualification clone's
`evidence10/production-gap-review-20261002/`: report
`EARTH_REPAIR_REFUSAL_REPORT.json`, SHA-256
`4701023ae0f68a51b228dc3d9dfdf299f3c8083662ea9b47412329d50061892b`;
exact probe `EARTH_REPAIR_REFUSAL_PROBE.py`, SHA-256
`12160e1f1165e2534b05a310c8c6002a1726ce675408a2d3139dc8856d1e0341`;
and inspected `REFUSED_STORAGE_NATIVE_SUCCESS.png`. Product HTML was 2,503,814
bytes, SHA-256 `b39255cb47b3ac03e38c52a85f49c647b4a4c39c5eb120a837835286d721389c`.
The probe passed 19 reproduction assertions with zero browser errors and ran
21:11:39–21:11:46 CDT on October 2, overlapping Root's RTX measurement for about
seven seconds. Its output is a reproduced product failure, not a product pass.

This follows a bounded production-gap review, which produced one consequential
runtime finding. Source inspection of home/death recovery, foreign-scene combat
ownership, text/menu input guards and character-source ownership yielded no
second reproduced defect. That is limited source evidence, not certification of
every game system. The author also wrote the earlier workshop adapter/UI work,
so review of those parts and this correction is self-review. Root owns independent
integration, generated release artifacts, full gates and hardware qualification.
No personal profile, Root worktree, paid service, main branch or deployment was
touched. The isolated generated candidate HTML remains uncommitted.
