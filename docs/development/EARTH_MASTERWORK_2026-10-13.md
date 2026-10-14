# ET06: The Masterwork Without a Name

Implementation checkpoint based on `8ec3764c7869a9549eb7681cca7746c7142804b2`,
on `gameplay/earth-masterwork-20261013`. Initial design checkpoint: the broad PR77 regression was still open;
attempt02 was refused before launch by host memory admission. No browser worker
was running at that initial checkpoint. The following design preceded source
implementation; the delivered-state section below supersedes its status. Both Sol colleagues reached their usage limit; the
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
| Measured cut, implemented blade | 1.25 | 16 | 3.2s | One selected visible enemy within2.65m |
| Piercing light, existing bow | 1.65 | 30 | 5.5s | Actual arrow, up to2 bodies, aim within11m |
| Quick draw, implemented bow | 1.35 | 12 | 3.2s | Actual arrow, first body only, aim within11m |

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

## Planned acceptance (initial design record)

Boundary tests for all state transitions, no-save/no-partial mutation, owner
switch, stale envelope, legacy migration, full reload at every stage, deliberate
weapon choice and switches, invalid/blocked targets, true projectile impacts,
misses, two-body tradeoff, frozen flight and default behavior. A command-earned
blade and genuinely crafted bow journey must visit existing ground, retain both
outcomes and use the lesson. Browser proof needs actual UI, cold persistence,
both cameras, physical before/after and a short clip when host memory admits it.
Full current source/native gates remain required. Human clarity, enjoyment,
reward usefulness and real-GPU performance remain unanswered.

## Delivered implementation and evidence

Implementation commit: `da2fb385d2d61f84494c9380d71431157bafadd6`.
Draft [PR78](https://github.com/EternitiesAi/eternities-firstlight/pull/78) is
stacked against PR77, base `8ec3764c7869a9549eb7681cca7746c7142804b2`.
Both pages are3,446,508 bytes with SHA256
`7630b6ada6c2e190f74e47017d391e22257828689582e53f4308a637054c98e9`.
Adventure13, masterwork1; World9 and Arsenal1. The chapter level curve remains1–5.

The implemented comparison uses one selected close blade target or a real
first-body bow projectile. Default specials retain area/piercing advantages.
Selection cannot reset their shared recovery. Denied encounter damage, a missed
arrow and obstructed aim produce no successful contact feedback. Uninspected
records show leads; physical inspection reveals the actual finding.

The quarry commission has its own small stand and pennant beyond Darric, with a
retained private/public credit treatment. The workshop apprentice is a local
fictional role, separate from the three scheduled residents. No new navigation,
AI resident, stockpile consumption, faction economy or crowd is implied.

Focused proof:29 quest/UI/combat tests pass;10 verifier transport cases pass;
45 prior migration-regression cases pass. The earlier359/364 focused attempt,
wrong future-version fixtures, missing bypassed-constructor widget, historical
migration oracle repairs and transport expectation failures are retained. The
standalone veteran journey's first harness attempt named `completed` instead of
canonical `crossing.complete`; it refused before quest work, then the corrected
caller passed. No runtime rule was changed to make that fixture pass.

Fresh command-earned blade and genuinely crafted bow complete the outing. A
retained Chapter IV command-earned Adventure12 character with Dawn's edge and
existing Aegis/cinder history also migrates and completes it. That historical
input's exact path/hash is in EARNED_VETERAN.json; it is not a personal save. The
source verifier additionally regenerates the current veteran before this quest.
Synthetic capped-XP/ruby tests separately cover stronger blade and bow ownership.

Native blade initial layout:37 passed checks, including whole-browser restart.
Current bow/public layout:56 passed checks, both V-selected cameras, actual skill
contact, physical return to the changed quarry and exact original stored bytes
at cold browser startup. Native setup/travel uses production moveTo and accepted
accelerated ticks, with no pose/inventory/quest/damage grants. Quest choices,
camera switches, Tab and Q use native controls. These are software-WebGL checks
at1280×800/Low; they do not measure human pacing or RTX performance.

The actual canvas clip is18.17s/70 decoded frames,1088×680,293565 bytes; its20s
capture window used normal RAF. It visibly reflects slow software rendering.
Only one small new clip and two useful screenshots are published. Full originals
and all failures remain on D; no full-game/profile copies were created.
[Evidence index](../evidence/earth-masterwork-2026-10-13/EVIDENCE_INDEX.json).

The older PR77 full attempt03 at04fd08c passed224 source commands, Node2257pass/
0fail/2skip and Python538run/8skip/no failures. The first native suite reached
1744 passed checks across7/30 stages, then allocation admission refused at
4,109,576KiB free host RAM. No assertion failed, but native qualification is
incomplete. A later local rebuild MemoryError is transcribed honestly; the next
attempt was deferred below6GiB, then an admitted rebuild succeeded. No VM or
unrelated worker was stopped. Current complete source/native qualification is
recorded in the subsequent qualification section when terminal evidence exists.

## Launch and human acceptance

From the integrated checkout run `python tools/play_local.py`, or open
`PLAY_FIRSTLIGHT_WINDOWS.cmd`. The established origin is
`http://127.0.0.1:8780/`; the launcher refuses a different build already owning
that port. No public server or automatic deployment is involved.

Take Oren's initial expedition kit. Speak to the apprentice just east of his
workshop, or open Journal and read The Masterwork Without a Name. Accept, inspect
the workshop sample, cross the lake footbridge into Hearthwater, follow the
quarry road for the original order and commissioned stone, then return. Review
and confirm the correction and optional lesson. Equipment lets you retain the
original special or deliberately enable the learned one; try2/Q at the riverbank
practice bundle. V still switches between diorama and third-person views.

Dom's fresh and returning playtests remain pending: Was the route clear? Did
comparing evidence and choosing the correction feel worthwhile? Is there a
situation where you prefer the learned special, and another where you want the
original? Automated checks do not supply those answers. Both attempted Sol
reviews hit their usage limit; new gameplay has self-review and automated checks,
not a fresh independent review. The larger production goal and broader native,
human and hardware-performance gates remain open.


## Compatibility repairs retained during fresh remote qualification

- Remote02 atda2fb385: Node2288tests,2254pass/32fail/2skip. The old actual-UI
  regression hosts did not load the added component. Three import/context fixture
  additions at a2aef3ec preserve all assertions;43 affected checks pass.
- Remote03 ata2aef3ec: Node2286pass/0fail/2skip; Python538run/13fail/8skip. The
  old resume oracle expected Adventure12. Repair7d35969 adds exactly version13
  and a literal empty masterwork1 when absent; an existing record remains exact.
  It preserves every old journal/event/clock/XP/owner check. Current-schema
  derivatives of the retained capture are labelled CPU evidence; the untouched
  original schema12 output is explicitly rejected as current native proof.
  All53 focused resume tests pass. The first focused attempt's missing SDK path
  and two undeclared historical-output derivatives are retained too.
- Remote04 at7d35969: Node2286pass/0fail/2skip; Python540run/12errors/8skip. A
  synthetic source-boundary fixture lacked the two new required source tokens.
  Repairfbce08e adds only those dependencies and extends missing/stale-embedding
  checks to them.86 verifier tests pass with one existing platform-fixture skip.
- The new native reporter also fails the process when checks are empty/failed,
  source drifts, page errors occur or owned resources fail to close. Its actual
  pure terminal function passes2 CPU tests/eight negative subcases without
  starting a browser or changing global module resolution. Existing evidence
  cannot be overwritten. This closes a potential false exit0 on cleanup/source
  failure; it is not itself native gameplay proof.

All negative receipts remain in the evidence index. No fixture rewrite, generic
owner exclusion, tolerance relaxation or original-suite removal was used.

Remote05 at `fbce08eb5aa384b2ab8709b70cdeaeb26af922c6` passed the Node suite
(2,286 passed, 0 failed, 2 skipped), Python (542 run, 8 skipped, no failures),
and the new earned masterwork journeys, then stopped at the existing consignment
cohort guard. That guard still required Adventure 12. This was a stale integration
guard, not a gameplay or memory failure. Its terminal receipt and original
cohort failure are preserved.

The subsequent bounded audit updates five current-schema callers to Adventure 13:
consignment cohort, three expedition/consignment/fieldcraft capture validators,
and the gathering browser assertion. Historical migration cases remain at 12.
The consignment helper is source-pinned, so `SOURCE_EXPECTATIONS06.json` declares
exactly that one predicate change and retains the old 04 and 05 files byte for
byte. Reversing only the one predicate reproduces the old literal helper hash.
This is parent source review, explicitly **not independent review or native
qualification**. The verifier selects 06 explicitly; no old report is relabelled.

The first epoch check failed six ART fixture tests because their synthetic helper
operand still named the old revision. Updating that explicit operand preserves
all original rejection assertions. The repaired epoch suite passes 21 tests;
the consignment suite runs 78 with one existing platform-fixture skip; capture
tests run 91 with three existing platform-fixture skips. Source repair commits:
`3ed6848d402c77d91d62e40faee7018d5f5bbcaf` and
`e7057553cec50ad9835c7d228636696438911391`.

Remote06 at `e7057553cec50ad9835c7d228636696438911391` passed the Node suite
(2,286 passed, 0 failed, 2 skipped), Python (545 run, 8 skipped, no failures),
and the repaired consignment paths. The later homecoming continuation completed
its three journeys but failed one of 19 readback checks: that independently
specified historical migration expectation still omitted the new record. The
original negative log remains compressed in the evidence index.

The repaired readback adds only the explicit Adventure 12-to-13 version and
missing empty masterwork record. The adjoining native migration oracle and its
real-cohort preflight now specify that same literal allowance independently;
existing records, every old owner and original fixture bytes remain exact. Added
negative cases reject quest backfill and preserve the XP boundaries. The three
earned continuations now pass all 19 readback tests, and actual current-cohort
native preparation passes all 31 CPU checks. Repair commit:
`e9c5bbc93b7166beabc75d6f911e75ec180e480d`. This preflight starts no browser and
does not certify native play.

## Exact remote qualification and remaining gates

Clean reused remote checkout: `D:/07-GAMES/Firstlight/verification/current-qualified-game`.
Source and targeted native head: `e9c5bbc93b7166beabc75d6f911e75ec180e480d`. Runtime implementation is
`da2fb385d2d61f84494c9380d71431157bafadd6`; the subsequent code changes repair
verification integration. Base remains PR77's `8ec3764c7869a9549eb7681cca7746c7142804b2`.

`python -B tools/verify.py --rule-workers 4 --output <fresh D logs> --cpu-temp
C:/Users/Dom/AppData/Local/Temp` passed all 230 commands: 154 syntax modules;
Node 2,286 passed, 0 failed, 2 generic missing-cohort skips; Python 546 run,
8 reported skips, no failures. Mandatory earned/preflight callers run separately
and pass, including all three masterwork variants, whole-draft and Briar outings.
Original 180s Node/600s Python and per-caller limits remain. Source admission
observed 11,912,264 KiB free RAM. Terminal exit0: 2026-10-14T03:52:10.8647077Z.

The subsequent `tools/browser_budget.py` invocation ran
`tools/masterwork_browser.py --both --output <fresh D native directory>`.
Blade/private: **42 passed checks**. Bow/public: **55 passed checks**.
No assertion/page errors, source drift or unclosed owned context/server. Exact
original browser storage survives full restart. Every browser allocation uses
the unchanged fresh 6GiB admission after driver startup. Terminal exit0:
2026-10-14T03:54:31.7663320Z. This is targeted native qualification with software
rendering and accelerated accepted travel, not the complete browser suite.

Both generated HTML outputs remain identical at 3,446,508 bytes, SHA256
`7630b6ada6c2e190f74e47017d391e22257828689582e53f4308a637054c98e9`. The one normal-RAF clip and screenshots show this runtime. The final
delivery commit contains only records/evidence/attributes; its fresh remote
readback checks unchanged runtime/tools/tests/build and exact evidence bytes.

Still open: the complete 53-suite native gate; fresh independent gameplay
review; Dom's human acceptance; real-GPU/device/accessibility/performance
qualification. The earlier PR77 full03 native interruption remains a resource
refusal, not a pass. Hosted run
[38505831025](https://github.com/EternitiesAi/eternities-firstlight/actions/runs/38505831025)
at fbce08e states that jobs did not start because of the account billing lock.
No billing action, main merge, deployment or recurring-worker activation occurred.
The production goal remains active. Existing ROOT/STATION were reused on D;
there are no new full-game or profile copies and no VM/Claude/personal-save work.
