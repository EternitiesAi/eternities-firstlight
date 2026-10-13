# A borrowed rod in the traveler's hands

Base PR74 at92fff25f82ab2df6cd99e6a5693203df923a41d8.
Branch gameplay/pier-handheld-animation-20261013; reuse the integrated checkout.

The existing catch-and-release loop currently shows a rod in a holder while the
traveler stands beside it. Give that accepted action an actual cast, supported
rod grip and reeling hand using the existing analytic arm rig. This is the next
inhabited-place refinement, not a new fishing economy or progression owner.

The fishing rules remain sole owner of acceptance, tension, catch and release.
Expose fight time and accumulated accepted reeling time from their transient
session. No persistent field, schema, XP, costs, inventory or new reward. Cast
anticipation/release lasts0.85s inside the existing3.5s wait; it never delays an
essential control or decides a catch. Cosmetic line flight joins the actual float
target. No new callbacks or animation timers. Reduced motion uses a held stance
and immediate float placement, retaining all controls and results.

The existing world traveler caller selects a fishing pose only outside combat
and swimming. The rig solves its own shoulders/elbows/hands; the rendered rod
attaches to the resulting right hand and reel handle to the left hand. Equipment
remains stowed, owned and equipped. The display root faces the line without
writing the player's position/yaw or camera. Fishing art owns only rod, reel,
line and fish meshes. No pose injection into Core or phantom fishing activity.

Pause/menu suspension and skipped long clock gaps freeze accepted activity time.
Reeling advances its visual cycle only during accepted reeling ticks. Explicit
cancel, departure, death, scene/character/world replacement and reload retain the
existing transient cleanup. No stale completion callback can change another run.

Acceptance: connected hand grips through sampled cast/reel phases, finite matrices,
no head intersection, stable foot anchors, blade/bow stow, exact old save-owner
preservation, reduced motion, pause/interruption/recast, real UI and screenshots in
both cameras. Observe actual motion over time, not only endpoint stills. Retain
one short clip if resource admission permits, bounded profiles/evidence, original
full source gate and relevant native tests. Human enjoyment and GPU certification
remain separate. VM/Claude/personal profiles untouched;6GiB fresh host admission,
four source workers, original deadlines. No merge, deploy, paid provider or cleanup.
