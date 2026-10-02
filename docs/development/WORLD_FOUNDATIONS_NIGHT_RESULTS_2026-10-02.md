# Five roads from a living home

Dom authorized an overnight world-foundation milestone through 10 a.m. Chicago
on 2026-10-02. The browser now connects Firstlight to five inhabited openings:
Heaven's Garden of Voices, Hell's Kiln Refuge, Earth's Coastward Road, Atlantis's
Farwake and Bellglass, and the existing Cosmos Near Expanse. Each has physical
routes, authored people, readable local work, a declared payout and a free way
home. The two interchangeable cameras remain available.

Review branch: `gameplay/world-foundations-night-20261002`, stacked against
`gameplay/quarry-natural-shoulder` / PR34 at
`4b5f3c7a7a7672ccefbf2ef8501507f017ec06d3`. Shared implementation checkpoint:
`bf1131998d2cc72fdaadc1d7dc40d0dca3ccb0c0`. Runtime correction checkpoint:
`5e898d035cf436e2057c8f6904ef8f5a71ba8a90`. Exact final head, remote-clone gate,
hosted checks and preview receipts belong in the delivery PR and external
delivery receipt, avoiding a commit made solely to describe its own hash.

## What the player can do

From Firstlight's workshop, walk east to the five-light marker at X18, Z6.
**J → Roads of Light** explains the destination, three objectives, initial-kit
requirement and reward before crossing or accepting work. No chapter, class,
allegiance or soul choice is required. **M** gives the actual local routes;
nearby **E** interactions and the work page record physically reached objectives.
The giver recognizes completion. **Return to Firstlight** is always free.

| Opening | Playable foundation | First accepted completion |
|---|---|---|
| Heaven | Garden, Ruby Arcade, Mirror Causeway, three response plates and cultivated ruby/silver paths | 18 XP, 7 sunmarks |
| Hell | Inhabited refuge, two industrial approaches, Bell Yard route marks, solid cover and an optional salvage sentinel | 22 XP, 9 sunmarks, 2 ore |
| Earth | A supported 76-metre channel bridge, two woodland lanes, fields, a roadside settlement and an optional coppice skitter | 28 XP, 12 sunmarks, 2 ore |
| Atlantis | Dry pier/civic loop plus an optional submerged gallery, real dry air court and separate landing | 24 XP, 10 sunmarks, 1 ore |
| Cosmos | The existing Near Expanse, Three Lamps and occupied observatory, with three accepted bearing records | 15 XP, 6 sunmarks, 1 ore |

After a first claim, a deliberately accepted new survey pays **5 XP and 2
sunmarks**, once for that new run. Reloading, re-entry, reopening a panel or a
different request ID cannot reproduce a paid run. Optional local enemies have
their own persistent defeated identities; they grant no separate loot or XP and
do not respawn for survey repeats. The work routes bypass them.

First completion leaves a small persistent local work detail. Sunmarks and ore
feed the existing item/recipe guide and finite equipment projects at home.
Equipment remains an explicit choice; these outings grant no compulsory weapon.

## Honest equipment and progression comparison

These are command-earned fixtures, not personal saves. Measurements use the
current production catalogue and stats before any new realm reward.

| Case | Equipped attack / guard / health | Weapon behavior | New work's effect |
|---|---|---|---|
| Fresh blade, XP0 | Trail blade: 16 / 1 / 100 | Reach 2.65, cooldown 0.52 s, no strike stamina | Fixed currency/material progress; all five first payouts total 107 XP, reaching existing level 3 |
| Fresh bow, XP0 | Trail bow: 13 / 1 / 100 | Reach 11, cooldown 0.75 s, 6 stamina per strike | Same declared rewards; actual arrows retain ranged behavior |
| Returning Chapter IV, XP563 | Dawn Edge: 48 / 13 / 200, two fittings and Oren temper | Reach 2.65, cooldown 0.52 s, original socket and identity | XP670 after all five first payouts; remains level 5. No further fitting is invented for this completed weapon |

The returning fixture receives the same fixed reward, without enemy or equipment
scaling. A fully fitted strongest weapon gains no new direct weapon improvement
from these outings; the guide displays its completed finite path honestly.
Stored XP remains capped at 9999 and the level curve remains 1–5. This milestone
does not promise a new endgame equipment economy.

## Ownership and migration

World schema/key **9** and adventure schema **10** remain. Optional world field
`journeys.version = 1` owns five fixed realm records. Missing old data initializes
empty, unaccepted work; no old visit, scenery, defeated creature or story choice
becomes consent or a reward. Unknown/future/impossible records are rejected.
Use the current build when retaining these new records; older builds predate
their ownership.

Each realm has definition `<realm>-opening-v1`, objectives `first`, `second`,
`third`, a monotonic accepted-run counter and a contiguous last-claim record.
All completion prerequisites and coin/ore capacity validate before mutation.
Commands save a canonical candidate before applying it. Refused saves or full
pouches leave completed objectives retryable and ownership unchanged.

Travel previews bind the character, simulation, saved revision, position and
destination, then save the home checkpoint before scene construction. Failed
construction restores the prior runtime graph. Scene/depth are transient:
reopening or switching characters resumes the disclosed home checkpoint while
accepted work, paid runs and local defeated identities persist.

`world-foundations.js` owns these rules; the Heaven/Hell and Atlantis/Earth
modules supply pure fixed definitions and original scenery. Cosmos retains its
existing scene owner. UI/art do not invent support, payouts or new allegiance.
The new-region path search checks complete supported segments and all canonical
solids. A coarse grid, cached support and bounded fine fallback reduce measured
Hell return-route calculation from roughly 685 ms to 52 ms in a five-call CPU
probe; this is path calculation, not a rendering claim.

Atlantis has real body height, independently determined body/camera medium,
wall/ceiling collision and a dry courtyard volume. **F/G** ascend/descend;
release holds depth; **WASD** moves relative to the camera. The limited visitor
gallery has a supplied breath envelope with no drowning timer. The companion
waits on dry ground. The landing or free home return ends the dive. Modal menus
consume movement/depth/camera shortcuts.

Gallery deck/water apertures and the visited Hell refuge roof reveal affect the
main view only, respecting cutaway preferences. Collision, reflection and shadow
ownership remain. Native reflection tests now render fresh shelter buffers and
include a positive empty-scene geometry control.

## Verification and actual play evidence

The clean shared checkpoint passed `python tools/verify.py --browser`:
**65 syntax checks, 785 Node tests, 53 Python passes plus one existing Windows
symlink-privilege skip, 27 command-earned journeys, and 2039 browser assertions
across 22 suites**. The three new journeys each complete ten claims through
50 accepted commands and 57 actual walking legs, including reloads at partial,
completed-unpaid and paid states. They use accelerated production ticks and a
memory save boundary; native browser persistence is a separate gate.

Review then caught two wet-page buttons that offered impossible dry walking or
a second gallery entry. Both are removed while diving. Focused visible browser
coverage now passes **184 checks**, including an actually displayed compact
toast and separate depth HUD. The fresh shelter/gallery framebuffer suite passes
**9 checks**. Its prior shelter equality read a stale reflection texture; the
new positive control closes that evidence gap rather than weakening equality.

The final garden build also passes **790 Node tests**. Two added combat cases
let actual enemy hits kill a fresh blade/bow character, then revive through the
real command and retain partial accepted work, paid history and belongings.
Three added garden tests check transformed ground/bed support, flower attachment,
clear routes and deterministic reduced-motion geometry. The cultivated fork adds
207 instances and 2,196 triangles, without changing prior scenery or consuming RNG.

Both checked-in regenerated HTML outputs are identical: **2,362,025 bytes**,
SHA256 `12a44af65c53e80e9e57175e85c63d683421797c33e22da935134a3df9368b1b`.
Recorded Cosmos frames exposed two label/home-button owners. The original
Cosmos UI now clears its labels and hides its home control only while Roads
owns the visit; the quiet legacy invitation retains its own UI and grants no
work consent. Visible regression checks cover both entry routes, explicit work
adoption and the original saved return coordinate. Final captures use the
corrected build. The garden comparison remains labelled as the earlier 3a art
checkpoint; this UI correction changes no geometry.

The corrected frozen build passes **207 focused world-browser checks**, including
legacy/Roads presentation ownership, original-checkpoint return, native partial
work/death/reload and normal held-key swimming. The exact final remote clone
must reproduce this build and the full gate.
Final media and delivery receipts are in
[the evidence directory](../evidence/world-foundations/README.md).

Hardware captures use isolated Chromium on the actual RTX3080, ordinary
animation frames, accepted movement and explicit UI actions. Blade and bow
recordings select the sentinel with Tab, brace during its tell, take a guarded
four-point hit and defeat it through real attacks. Blade deals 16 per hit;
bow deals 13 through actual projectile collisions. No HP, item or combat grants,
accelerated ticks or personal profile are used in those recordings. Imported
setup saves are labelled command-earned fixtures; camera/time framing is
presentation setup. Short frame samples describe RAF cadence, not sustained FPS,
GPU execution time, monitor timing, human comfort or Unreal qualification.

## Sources, failures and remaining scope

Canon comes from the complete recovered realm packages and
[comprehensive vision index](../design/COMPREHENSIVE_VISION_INDEX.md), pinned
archive PR14 at `799a0a467dd11b50742c3b441c45e807e4454443`, founder charter and
current continuity records. The two requested Sol6.1 xhigh colleagues built
disjoint data/art and reviewed source/stills. Root integrated shared behavior,
ran the full gates and captured gameplay. Reviewers did not watch every video,
run the broad hardware gate or infer human acceptance.

Earlier failures remain under the dated D-drive artifact folder: travel/map
dispatch, bounded path-search budget, coincident NPC approach, capture selectors
and key spelling, clock-aware ownership comparison, and the overly broad blue
framebuffer classifier. The classifier was tightened to the known test color.
The two underwater UI defects, Cosmos presentation overlap and stale shelter assertion are also recorded.
Superseded hardware captures retain their older source hashes.
One 197-check browser run overlapped Root's garden regeneration; its original
report and mixed-epoch qualification remain outside Git. It is excluded from
exact-build proof and superseded by the frozen final remote gate. A later
legacy-route browser extension initially tried to cross from the old saved
checkpoint without returning to the five-light marker. The legitimate refusal
is retained; the harness now asserts that original checkpoint and walks back.

These are coherent playable openings and shared foundations. Complete countries,
capital interiors, Broken Choir, the foundry rescue, Atlantis's larger harbour
campaign, region-specific equipment and encounter renewal remain later work.
Coastward Road and its residents are provisional original names. Distant
landscape is scenery beyond the disclosed local routes. No huge continuous
planet, real multiplayer, live residents or settled economy is claimed.
Original Heaven01/sanctuary code and identities remain protected.

Human playtesting is pending. Dom should try one fresh and one returning outing:
**Did you know where to go? Did the fights feel better? Did the reward make you
want another outing?** Also compare both cameras and whether the realms feel
distinct while the home route stays clear. Hosted CI availability is a separate
account gate. No main merge, public deployment, paid provider, billing change or
personal-save access is part of this delivery.
