# ET06: The Masterwork Without a Name

Implementation checkpoint based on `8ec3764c7869a9549eb7681cca7746c7142804b2`,
on `gameplay/earth-masterwork-20261013`. The broad PR77 regression is still open;
attempt02 was refused before launch by host memory admission. No browser worker
is running. This note is the bounded design before source implementation, not
gameplay qualification. Both Sol colleagues reached their usage limit; the
parent continues without a provider or billing change.

## Canon and playable contract

Primary canon: the founder Earth `EARTH_STORY_EVENT_ATLAS.md`, ET06, lines64–72,
in the supplied 2026-09-15 cosmos/2026-09-14 Earth design archive. A prestigious
commission carries the wrong craftsperson's credit. An apprentice fears losing
work. Compare toolmarks and records, then support private acknowledgment or an
evidence-backed public challenge with the apprentice's participation.

Use the existing Firstlight workshop and Hearthwater quarry road. The apprentice
is a local fictional role, not another persistent resident mind. This commission
and its evidence are separate from Fenna's load and Darric's reserved road blocks.
It requires Oren's initial kit only; no chapter, soul, class, level or payment gate.
No combat or timer is required to investigate. Return roads remain available.

Stable quest ID: `earth-masterwork-without-name-v1`. Evidence IDs:
`tool-sample`, `commission-order`, `credited-plaque`. Compare at the workshop,
then record the apprentice's participation (`private` or `coauthor`). Resolve as
`private-correction` or `public-correction`; public correction requires `coauthor`.
Both finish the commission and offer exactly the same optional workshop lesson.
Reading, walking and opening Journal never change progress. A wrong comparison
has an explanatory refusal and no penalty. Public/private credit is retained in
the record and modest physical inscription. No simulated online audience.

## Optional weapon lesson and honest comparison

One finite choice of one already-owned blade or bow; no auto-equip, materials,
currency, XP or raw attack tier. The ordinary special remains selectable. Learning
and enabling are separate explicit actions; other weapons keep their original
special. The form uses existing 2/Q, sharing its cooldown across all switches.
An active form does not reset cooldown, refill stamina, change primary attacks,
choose a class/soul, remove sockets/fittings or modify companion/history.

| Special | Attack multiplier | Stamina | Cooldown | Contact |
| --- | ---: | ---: | ---: | --- |
| Dawn sweep, existing blade | 1.50 | 30 | 5.5s | All visible enemies within3.6m |
| Measured cut, proposed blade | 1.25 | 16 | 3.2s | One selected visible enemy within2.65m |
| Piercing light, existing bow | 1.65 | 30 | 5.5s | Actual arrow, up to2 bodies, aim within11m |
| Quick draw, proposed bow | 1.35 | 12 | 3.2s | Actual arrow, first body only, aim within11m |

Primary blade remains1.00×/0stamina/.52s/2.65m; primary bow1.00×/6/.75s/11m.
These lessons trade burst and coverage for a lower-cost supplementary strike.
They do not replace primary cadence. For a starter blade's16 attack, the cut
deals20 instead of the sweep's24 per target; two enemies favor48 sweep damage
over20 cut damage. At16 stamina, only the cut is available. At a crafted fresh
bow's13 attack, Quick draw rounds to18 versus21 piercing damage per body; two
aligned bodies favor42 over18. The existing15stamina/second recovery and unchanged
Brace/dodge costs remain. Returning weapons use exactly the same coefficients,
not invisible enemy scaling or stronger item creation. Encounter measurements
must still establish useful situations; this table alone is not balance approval.

## Ownership and migration

One strict nested `adventure.earthMasterwork` version1 owns acceptance, evidence,
comparison, participation, resolution, one bound weapon and enabled state.
Adventure12→13 deliberately adds an empty record; World9 and Arsenal1 remain.
Old keys, stored XP, chapters, all ledgers, inventory, sockets and explicit choices
retain their owners. New current-schema missing/invalid records fail validation.
No old completion backfill. Arsenal resolves the canonical special descriptor
from the validated record; it does not mirror the entitlement.

Quest actions create a full canonical candidate and save before adopting only
the quest record, revision and journal. Refusal, thrown/asynchronous saver,
candidate mutation or changed owner prevents adoption. App supplies a scoped
current-character check. Stale character/revision envelopes refuse. Duplicate
accept/inspect/resolve/learn operations cannot add rewards under another request
ID. The finite state itself is the claim record. Paused gameplay refuses physical
work; explicit technique enable/disable in equipment may work while paused.

Source owners: new `earth-masterwork.js`, `earth-masterwork-ui.js` and bounded
appearance module; Adventure migration/blade contact; Arsenal descriptor and
frozen projectile; RPG/legacy skill labels/costs; App durable writer; build/shell.
Art is read-only and does not create new navigation. Both cameras are retained.

## Verification and delivery still required

Boundary tests for all state transitions, no-save/no-partial mutation, owner
switch, stale envelope, legacy migration, full reload at every stage, deliberate
weapon choice and switches, invalid/blocked targets, true projectile impacts,
misses, two-body tradeoff, frozen flight and default behavior. A command-earned
blade and genuinely crafted bow journey must visit existing ground, retain both
outcomes and use the lesson. Browser proof needs actual UI, cold persistence,
both cameras, physical before/after and a short clip when host memory admits it.
Full current source/native gates remain required. Human clarity, enjoyment,
reward usefulness and real-GPU performance remain unanswered.
