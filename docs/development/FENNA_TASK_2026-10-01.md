# Fenna and the delivery load

Dom is away and asked for continued development with screenshots. Start from
PR 26 `fd56ca00c0b66e65e3df05bdb0326918fa6c72b7`, stacked on
`gameplay/ansel-millwright`. Origin was fetched; the checkout was clean and
PR 26 had no new comments or reviews. Parent owns implementation and execution;
the collaborating reviewer has read-only source/art review scope.

Make the existing drover recognizable: a weather coat, scarf, satchel, boots and
a connected hand-held rope coil, distinct from Ansel and the player. Refine the
existing cart with grounded wheels, axle/joinery and readable flour/apple cargo.
Before arrival it is loaded; accepted arrival leaves two sacks, a folded cover
and an empty apple crate. This is an authored presentation proposal, not new canon
about quantities or an inventory transaction.

`earth-story.js` alone owns acceptance, route, dispatch, arrival and once-only
payment. `drover-art.js` reads a tiny projection of those existing fields. Keep
resident anchors (8.8,5) / (2,-43), yaw -0.6, and cart anchors (9.3,7) / (-3,-43).
Rule interaction points stay (7,5) / (0,-43). Never reach across those distances
with a fake rein or silently simulate an escort. A personal rope coil is held in
one local frame; actor motion derives only from simulation time, with a stable
reduced-motion pose and normal pause behavior.

Use existing box/round/octa batches, no texture, renderer pass or external asset.
Budget: at most 160 combined actor/cart parts, finite positive transforms and
connected joints. Neither art owns walking/camera solids nor player appearance,
equipment, class, palette or combat state. World/key 9, adventure 10 and all nested
versions stay unchanged; no migration or new save fields.

Proof: pure geometry/state projection tests; actual browser submission, normal
RAF/pause/dialog/reduced motion, accepted dispatch/arrival/reload and unpaid claim
checks; full current verifier, exact-head remote clone, matched hardware samples
and actual screenshots at both existing sites in both cameras. Heavy artifacts
remain on D. Isolated/accelerated tests, normal footage, GPU intervals and Dom's
future taste/comfort verdict remain distinct. No main merge, public deployment,
billing change, paid provider or personal-profile access.
