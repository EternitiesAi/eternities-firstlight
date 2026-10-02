# An honest next equipment step

Player promise: I can pursue a weapon, understand the next real recipe and its
whole cost, and decide whether to equip its result without confusing a prerequisite
with the finished project. Browser target, existing solo outing and both cameras.

Base: PR31 / `fc43ef35e7dee725f7abf0d89cf9f241e048b9fd`, fetched with no newer
gameplay head or review comment observed. Branch `gameplay/equipment-step-preview`
reuses the clean, isolated D authoring worktree. No merge or deployment.

## Observed comparison and intended result

At current XP and otherwise unchanged equipment, the fresh initial blade has
16 attack, 1 guard, 100 maximum health, 0.52s cooldown, 2.65 reach and 0 stamina
per strike. Selecting the unowned copper longbow previews 21 attack, 0.75s,
11 reach and 6 stamina, but its next real recipe creates Ashwood with 13 attack.
The existing table calls 21 "After crafting" beside that Ashwood button.

| Case | Equipped attack | Actual next result | If equipped after step | Project target |
| --- | ---: | --- | ---: | ---: |
| Fresh blade pursuing copper longbow | 16 | Ashwood prerequisite | 13 | 21 |
| Fresh Ashwood bow pursuing copper longbow | 13 | Copper longbow | 21 | 21 |
| Owned initial blade, fitting I | 16 | Same weapon, +2 finite attack | 18 | Owned weapon |
| Owned blade after fitting I | 18 | Same weapon, fitting II | 20 | Owned weapon |
| Earned veteran Dawn's edge, Oren temper retained | 44 | Same weapon, fitting I | 46 | Owned weapon |
| Finished owned project | Existing stats | No third fitting | No recipe | Existing weapon |

Guard, health, range, cooldown, stamina and socket are computed from the real
result weapon and current loadout, rather than attack alone. Socket gems stay
on their original weapons. Current-XP comparisons do not include a future XP
reward; Oren's table will say so explicitly. No XP reward, curve or cap changes.

## Ownership and scope

`pursuit.js` adds a pure next-step projection resolving the actual `recipe`
result: forge -> copper blade, arsenal-craft -> payload item, finite fitting ->
payload weapon and stage. Keep existing long-term `compare` semantics. Only a
cloned adventure is projected; costs, command authority and ownership stay intact.
`pursuit-ui.js`/`pursuit.css` separate the next-step comparison from the project
target with readable three-column tables and explicit prerequisite copy.
`starter-ui.js` labels current-XP reward previews; no claim rule change.

World/key9, adventure10, pursuit1 and all nested save owners remain unchanged.
No migration, new weapon, economy change, auto-equip, socket transfer, replayed
reward, new levels/classes, personal data, preview bypass or renderer alteration.

## Acceptance

Compare preview to actual accepted craft/fit then explicit equip, for blade,
bow and an earned veteran. Cover sockets, Oren temper, both finite stages,
finished/noncraft projects, invalid IDs and pure repeated previews. Exercise
visible guide selection/cost/confirmation/reload at desktop, 820 and 390 widths;
verify text/menu input keeps both cameras. Add assertions to an existing earned
journey rather than inventing rewards. Run the full current verifier/browser
gates, exact pushed-head fresh clone and actual screenshots/short gameplay media.
Keep human legibility/reward usefulness pending, and hosted billing-lock and
older stable preview separate. Heavy evidence and clone objects stay on D.
