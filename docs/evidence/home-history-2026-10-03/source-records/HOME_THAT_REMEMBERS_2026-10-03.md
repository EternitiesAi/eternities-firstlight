# A Home That Remembers

Implementation starts from reviewed/current gameplay `27bdbe585f8970c7695e04b79c7ef171e3bd1055`, on `gameplay/home-that-remembers-20261003`, stacked against PR #39. Dom explicitly requested continued implementation and deferred his playtest. Earlier human-first task recommendations remain pending evidence, not a gate on this authorized continuation.

The recovered vision index describes Earth as the home anchor and a home accumulating material traces of other cultures, professions and journeys. The four objects below are **provisional original adaptations**, not recovered founder names, new canon, allegiance or cosmic revelations.

| Stable recipe and furniture ID | Unlock: claimed local commission | Exact cost | Physical character |
| --- | --- | --- | --- |
| `memory-cuttings` | `heaven-propagation-bed-v1` | 2 timber + 2 meadow fibre | A low slotted nursery tray with separate living cuttings |
| `memory-refuge` | `hell-refuge-water-v1` | 2 stone + 1 timber + 1 meadow fibre | A squat handled wick lamp with open protective guard and stone ballast |
| `memory-bellglass` | `atlantis-bellglass-lamp-v1` | 2 timber + 1 moon crystal | A tall copper/cyan reading instrument with keyed collar and hood |
| `memory-farroad` | `cosmos-drawing-shelf-v1` | 2 timber + 1 meadow fibre | A braced page stand with tied travel folio and star-coloured bindings |

Atlantis and Cosmos payments cover their corresponding recipes if unspent. Heaven supplies fibre but needs timber; Hell's ore is not silently converted into home materials. Ordinary renewable gathering supplies missing resources. Blade, bow and strongest returning equipment use the same honest decoration path; no combat power, class or level-cap changes.

## Player loop and ownership

Read the four designs from the retreat, Journal or Crafting. Pin one home project independently of the equipment field guide. Read its commission without accepting it; claim that work through its existing rules. Return to an existing outdoor workbench, deliberately spend the displayed materials to make one object. Choose a retreat slot, rotate/place it explicitly, and remove/re-place it without another payment. Nothing auto-places or replaces furniture.

`home-history.js` owns four immutable definitions and optional `homeHistory` v1 with revision, one pinned ID and one owned copy of each crafted kind. `creative.js` retains retreat slots, geometry/collision definitions and old unrestricted furnishings. World validation and every decorate/history path check ownership and one-copy capacity. The new wrapper saves a fully validated candidate before adopting costs, ownership, pin, layout or undo history. Refused/stale saves leave all live state and history intact. Repeated craft calls and new request IDs cannot create another copy. Removal does not refund raw materials.

`home-history-ui.js` owns sketches, costs, progress and route controls. `home-history-art.js` owns original geometry only; it never awards progress. The existing eight-slot retreat, doorway and inside-player placement check remain. Each design has a real rendered model; its labelled design sketch is not gameplay footage.

## Migration and evidence

Keep world/key 9, adventure 12, sandbox 1, retreat 1 and character library 1. An absent `homeHistory` becomes empty v1 with no objects or pinned project. Prior claims unlock knowledge only; they do not grant an object or replay payment. Null, malformed/future ledgers, unclaimed ownership and duplicated/unowned earned placements refuse import rather than erase history. Existing notes/music/exports/crops/building/equipment/socket/finite upgrades/stored XP/companion/story/soul history and both camera profiles stay intact.

Required evidence: labelled boundary tests for costs/capacity/refusal/history and migration; command-earned blade/bow/returning journeys; actual native-origin UI craft/place/remove/reload with source receipts; visible models in both cameras; regenerated identical HTML; current verifier and browser regression suites; exact remote source verification; short real gameplay recording. Automation cannot accept clarity, pacing or enjoyment for Dom.

Investigate the prior native-06 rollback separately. It is an unresolved **context-only shutdown rollback**, not an established crash or production bug. Record raw startup key/revisions and close method, await explicit page-close events on the orderly path, and retain negative results. No speculative save rewrite without reproduction.
