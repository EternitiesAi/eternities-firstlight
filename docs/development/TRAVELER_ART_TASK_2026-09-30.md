# A traveller who belongs in Firstlight

Base: PR23 `gameplay/timber-material-proof`,
`f5c0211348668a37e7e5efc038ed5bf610bf0e9d`. Origin and open PRs were checked;
there are no newer gameplay heads or PR23 comments at intake. This review is
stacked on that branch. Main is not merged. New authoring/evidence stays on D.

Player promise: recognize your traveller, equipped weapon and deliberate combat
stance in both third-person and diorama views. Improve the existing playable
body, rather than assuming an unproved mesh importer. These proportions and
clothes are original prototype choices, not additional founder character canon.

Bounded implementation: a tailored human silhouette, distance-driven connected
walking joints, readable blade/bow anticipation and recovery, an existing weapon
held at the hand in combat and stowed on ordinary travel. Preserve visitor
skin/hair/cloak choices and project the actual armor, socket, Oren temper and
finite fittings. NPC routines/models, physics, target selection, cooldowns,
damage, projectile collisions and rewards keep their existing owners.

`traveler-art.js` owns pure pose/motion and instance geometry. Motion belongs to
WorldArt, resets on simulation/scene discontinuity, and is never saved.
`traveler-equipment-art.js` reads canonical equipment and attaches it to the
same local joint frame. WorldArt owns integration; old blade/bow body-attachment
blocks are removed while projectiles, hit feedback and encounters stay intact.
The two collaborating workers own separate new modules/tests; integration,
build, actual browser checks, footage and continuity remain with the parent.

Budgets: at most 65 body and 40 equipment instances using existing geometry
batches, no new texture/asset/network/runtime dependency, no additional batch
kind or render pass. Measure actual instance/triangle/frame cost. Test pause,
stops, scene/character restores, low quality and reduced motion; secondary sway
must disappear when reduced motion is selected. No camera changes are needed.

Compatibility: no migration; world/key9, adventure10, nested versions and
stored XP remain. No class assignment, forced equip, erased socket/upgrade,
new inventory or changed story history. Personal browser profiles are excluded.
Keep any active older port8780 preview until its owner changes it deliberately.
After resumption the older process was absent and port8780 was free; the normal
launcher now serves the final build on that same origin without opening a browser.

Acceptance: both cameras show a distinct traveller and visible existing gear;
feet/limbs and hand grips remain connected in walking and combat poses; actual
travel drives stride while pause/repeated render cannot advance it. Blade and
bow still complete existing accepted-rule journeys. A fresh and strongest-gear
character preserve state through reload/character switching. Full current
source/browser verifier, exact-head remote clone, actual short gameplay video
and labelled RTX sample supply engineering evidence. Human visual/comfort and
older gameplay questions remain pending. No automatic merge/deploy/billing
change, proprietary asset extraction or new paid service.

Executed follow-up, 2026-10-01: body submission is 49 instances; canonical
equipment is at most 27. Two separate source/test modules are integrated.
WorldArt uses successful existing equip/release/scene-entry receipt ordering
to keep presentation ownership correct even when several actions precede one
draw. No rule module is edited. The starter reward-material regression now
calls the new attachment owner, still checking actual reward color and state
purity. See the results note for actual final gate, footage and measurements.
