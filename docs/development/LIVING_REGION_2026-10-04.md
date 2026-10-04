# A Place Beside the Road: implementation contract

Dom approved planning and execution of the living-Earth direction on 2026-10-04. This is its first bounded playable proof, not a completed province. Base: PR40, `4240d9eaefb81d492040295b5b2b70e08e4245c8`; fetched origin and PR40 have no newer head/comments. Review branch: `gameplay/earth-living-region-20261004`, in the existing isolated D-drive checkout.

## Player promise

An ordinary bridge crossing connects useful work to a lasting place that somebody actually uses. The same region supports the existing woodland expedition, blade/bow equipment pursuits, companion and free return. The player chooses a shelter beside the settlement bench or a river observation stand, handles supplied fittings through actual proximity/assembly rules, explicitly receives the declared fee, and may make a route-board for home. Names, dialogue, pricing and new objects are original provisional adaptations, not recovered canon.

Source direction: recovered `earth-design-2026-09-14/design/EARTH_WORLD_BIBLE.md` lines10-16 and28-38 (archive PR14 / local verified Earth package): the Earth world bible (home/town/province, connected causes), Earth art/audio direction (painterly mythic realism, coherent small kit), and Founder Draft D (self-directed useful evenings). The Regent/Answering/Creator chronology and realm ownership remain unchanged.

## Fixed ownership and rules

- `src/bridge-community.js`: optional world `bridgeCommunity.version1`; quest ID `earthlands-bridge-community-v1`. Fields: `accepted`, `choice` (`null`, `shelter`, `river-lookout`), ordered unique `steps`, `claimed`. Missing old field becomes empty; null/future/impossible data refuses.
- Entry: initial kit, living character, dry `world-earthlands`, nearby Merren `(-6,-68)`. No campaign/class/realm/patrol claim prerequisite.
- Explicit sequence: accept; obtain Vessa's labelled fittings at `(-7,97)`; return with cargo; choose/fit either site with matching braces; record the worker's inspection at that site; return to Merren and claim once.
- Shelter approach `(-9,-63.5)` uses the existing bench; lookout approach `(30,-20)` uses the existing shore. Parts are appearance only and keep existing support/solids/roads intact. No new ledge, blocker or water simulation is asserted.
- Fee: 10 sunmarks, 2 timber, 4 meadow fibre; zero XP/ore and no personal cost. Validate all capacities and the complete candidate before synchronous saving/adoption. Completed unpaid work is retryable. New requests/reload/re-entry cannot create another payout.
- A dedicated original road worker uses a short supported route at the selected fixture. The giver anchors stay fixed, preserving every older service, map and proximity consumer. Transient walking uses active simulation time and pauses normally; it is not offline simulation or a resident mind.
- `memory-crossing`: fifth additive homeHistory1 design, unlocked only by this claimed episode; one permanent route-board, cost 2 timber/1 fibre, explicit craft/pin/place with existing layout transactions. Old four objects and owned/pinned state remain unchanged. New IDs are deliberately refused by older clients.
- Fresh blade/bow: fee contributes to their existing chosen equipment project; home board is optional. Strongest returning gear: no new combat-power tier is claimed; the honest reward is ordinary materials plus the finite home design and persistent chosen community fixture.

## Quality work

Traveler: connected rounded sleeve/leg volumes, coherent cloth/skin/leather/metal roughness, retained canonical appearance/armor colours, restrained gait. Bow: a visible shaft only during genuine anticipation, removed on release; keep actual projectile/hit authority. Root-bank brute: distance-driven transient quadruped gait and planted/lifted hooves, settling during windup/recovery, no stationary-intent treadmill. Existing AI/damage/HP/stamina/rewards remain unchanged. Compact HUD chrome while retaining controls, active objective, health/stamina and combat cues.

## Compatibility and evidence

World/key9, adventure12 and homeHistory1 data shape remain. Existing notes/music/exports, characters, construction/crops, inventory, equipped/owned gear, sockets/fittings, companion, banked XP1–5/9999, class/soul/chapter consent and all old quest/run ledgers retain owners. Both cameras, target selection, stationary autoattack, walls/projectiles and dialog input remain.

Finish this arc with rules and real command-earned blade/bow/veteran paths; native UI/restart/capacity/save refusal and visible both-choice/camera controls; existing full verifier; an actual normal-time recording; exact pushed source/fresh remote-clone proof; updated continuity and stacked draft PR. Keep failures, Windows skip, hosted billing block and human enjoyment deferred. No main merge, deployment, paid worker, personal profile, engine rewrite or old-preview bypass.
