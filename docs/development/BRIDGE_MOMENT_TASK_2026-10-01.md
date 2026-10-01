# The bridge moment — bounded playable proof

Dom's 2026-10-01 vision is the source: realistic water beneath a long bridge,
one traveller running in side profile, mountains and a cloudy sky. The generated
image on D is an aspirational concept, not current gameplay or new castle canon.
His continuation authorizes a playable interpretation. Start from fetched PR27
`ac1533ac48c70a065d28ce0745a055c5d15899ef`, on separate worktree/branch
`gameplay/bridge-moment`, stacked against `gameplay/fenna-drover`. No newer remote
gameplay head or PR27 comments/reviews were found during intake.

Player promise: crossing the existing Hearthwater footbridge is a moment of
travel, water and scale. This browser proof remains single-player and offline.
Replace the old nine-metre decorative bridge over solid terrain with a fifteen
metre, four-vault crossing on the existing lake-to-orchard route. Ground rules
and art share fixed span/deck dimensions. Water beside the narrow bridge is
unsupported; manual movement, pathfinding and picking must agree. Existing
arrival/return/bridge markers and north routes retain their positions.

Ownership: `earth.js` owns the narrowed bridge ground and banks; pure
`bridge-art.js` owns finite stone/rail/mountain presentation. `earth-art.js`
must omit filled terrain beneath the bridge. `engine.js` adds Earth-only flowing
water/pier wakes and world-oriented procedural clouds, preserving the existing
world-plane reflection transform and low-quality fallback. No network assets or
new water physics. `earth-ui.js` and `app.js` offer one explicit local side-view
framing action; V/R/orbit, both saved camera styles, modal input and pause remain.
No automatic camera trigger, shake or speed-dependent FOV. Reduced motion
freezes added water/cloud motion through the existing renderer time contract.

No new quest/reward/visit/save authority. World/key9, adventure10 and nested
schemas, stored XP, story consent/history, notes/scores/exports, equipment and
sockets/fittings, companion, roster, housing/crafting remain unchanged. Earth
is transient: old saves still resume at the disclosed Firstlight lake checkpoint.
No save migration. Use labelled fresh and command-earned returning fixtures;
never personal profiles or saves.

Acceptance: actual fresh and returning walks across the span; off-deck water
refusal; coherent deck/arches/rail/terrain geometry; local explicit framing with
normal camera controls; both camera views, low/reduced motion and save/reload;
actual framebuffer cloud/reflection/water contribution rather than only uniforms;
all current source/browser gates and exact pushed-head fresh clone. Capture
actual gameplay stills and short normal-time footage. Measure labelled matched
RTX frame intervals/cost with hardware provenance, separately from software CI.
Budget: <=420 bridge pieces, <=90 backdrop pieces, two bounded original vault/ridge meshes,
no new texture or extra render pass. This is a prototype interpretation, not a
claim of image-level realism or human memorability/comfort acceptance.

Heavy artifacts stay on D. Preserve the owned existing8780 preview until a
verified refresh; no automatic main merge, public deployment, billing changes,
paid providers, personal data relocation, engine rewrite or sanctuary changes.
