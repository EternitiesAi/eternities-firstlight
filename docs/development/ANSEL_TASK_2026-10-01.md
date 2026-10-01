# A recognizable person at the mill

Base: PR25 `4126edad7d65265e93389409520dae2d28c10d26`. Fetch/current PR
inspection found no newer head, comments or reviews. This review branch is
`gameplay/ansel-millwright`, stacked on `gameplay/mill-gate-craft`.

Player promise: recognize Ansel as the millwright beside the work just repaired.
Original prototype art: sturdy shirt, rolled sleeves, leather apron, work boots,
cap, beard and a carpenter's try square held in both hands. A gentle inspection
gesture reads simulation time; explicit pause freezes it and reduced motion
uses a stationary stance. No striking animation implies a completed repair.

The existing visible anchor `(8.7,-6.6)` and yaw `-1` remain. This point and the
canonical `mill-gate` interaction `(7,-7)` are walkable, with clear line and
1.746 m separation. Feet use Earth height. Ground/navigation, pond solids,
quest acceptance/prerequisites, two-timber charge, delivery and payment remain
in their existing owners. No new schedule, objective, reward or dialogue loop.

`millwright-art.js` owns a pure dedicated body/tool frame and connected 3D arm
segments. Earth art replaces only this generic NPC call, WorldArt clears the
transient frame on scene rebuild, and the test API reads submitted parts.
Budget: at most 64 instances through existing box/round/octa batches; no new
texture, shader, render pass or external asset pipeline. Do not route this
resident through player equipment, palettes, combat releases or motion state.

Compatibility: world/key9 and adventure10 remain; no migration. Preserve both
cameras, XP, existing equipment/sockets/fittings, classes, companion, independent
worlds, story choices, housing, notes/music/exports. Heavy work remains on D.
Keep the current standard8780 preview until verification permits an owned
same-origin refresh. No personal browser profile or save is needed.

Acceptance: proper hand/tool and connected limb transforms; bounded finite
geometry; grounded/reachable anchor; both camera images and actual gameplay;
normal-time pause/reduced-motion checks; existing quest/cost/reload/character
checks; full verifier, exact-head fresh remote clone and labelled matched RTX
measurement. Human recognition/beauty/comfort acceptance remains pending.
No automatic main merge, public deployment, paid provider or billing change.
