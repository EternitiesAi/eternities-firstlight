# Traveller visibility at the Hearthwater rail

Dom's continuation authorizes a bounded browser presentation pass from PR29,
`3a5b5ad2428b67f90ec7d605423ecf03fe620fba`, after fetching origin and finding
no newer gameplay head or outstanding PR29 comments. Player promise: see the
traveller's legs and boots while running across the bridge in either chosen
camera, without changing the supported crossing or automatically reframing it.

Only the above-deck rail posts, caps and span bars receive explicit `bridgeRail`
metadata. WorldArt separates those static boxes into one batch sharing the
existing box mesh. A rail-only main-pass uniform selects a small lower-body
aperture, using the actual view axis/projection and a near-edge-safe foreground
threshold. The existing saved cameraCutaway checkbox controls it. It is active
only on the supported Earth bridge span; generic scenery cutaway stays unchanged.
Deck, vaults, piers, shoreline, marker, actors, reflection and shadow remain solid.

Budget: one additional instance batch, no extra geometry, texture or render pass.
Source owners: bridge-art for eligibility, world for batching/active location,
engine for main-pass visibility. App test diagnostics may expose submitted batch
metadata; art never owns navigation, damage or saved progress. World/key9 and
adventure10 and every nested save owner remain unchanged; no migration.

Acceptance uses actual submitted traveller geometry against a rail-free pixel
reference, centre/edge and pier/span positions, both projections and opposite
side views. Require revealed leg pixels, solid far rail and unchanged reflection
and shadow, cutaway-off/reload and non-Earth controls. Capture ordinary RAF
walking in both views and review the moving rail edge/water. Match RTX samples
against this exact baseline, then run full source/browser and fresh remote gates.
Tests do not establish founder taste, comfort or sustained GPU performance.

Keep D authoring/heavy evidence, both saved camera profiles and current controls.
No automatic merge/deploy, paid provider, billing action, personal-profile access
or stable-origin server restart. The older preview remains a separate blocker.
