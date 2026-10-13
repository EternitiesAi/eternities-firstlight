from pathlib import Path
import json

ARC=Path(__file__).resolve().parent
ROOT=Path('D:/07-GAMES/Firstlight/authoring/atlantis-harbour-campaign-20261004')
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
n=read(ARC/'NATIVE02/REPORT.json');s=read(ARC/'SOURCE_SUMMARY_FINAL.json');m=read(ARC/'VIDEO_DECODE02.json')
assert n['status']=='passed' and n['ownedBrowserDriverClosed'] and n['ownedServerClosed']
assert s['head']==n['head']==m['head'] and m['exitCode']==0
checks=len(n['checks']);assert all(c['passed'] for c in n['checks'])
link='development/PIER_HANDHELD_QUALIFICATION_2026-10-13.md'
qualified=n['head']
source='223 commands; Node 2,246 passed, 0 failed, 2 skipped; Python 490 tests run, 8 skipped, no failures'
native=f'{checks} native checks passed'
clip=f"{m['durationSeconds']:.2f}s / {m['bytes']:,} bytes / {m['decodedFrames']} decoded frames"
fronts={
'AGENTS.md':f'''# Hand-held pier animation qualified, 2026-10-13

Continue gameplay/pier-handheld-animation-20261013 / draft PR75, stacked on
PR74 at92fff25f82ab2df6cd99e6a5693203df923a41d8. Qualified runtime/test head:
{qualified}. Subsequent delivery edits are documentation/evidence.
Read docs/development/PIER_HANDHELD_QUALIFICATION_2026-10-13.md.

Complete Source03 passed {source}.
Both continuous ten-chapter variants and five earned Briar continuations passed.
Native02: {native}; fresh, earned starter blade and Chapter IV bow,
exact cold save readback and ordinary-time cast/reel in both cameras. One short
clip: {clip}. Software WebGL2/Low; no human or GPU certification.

The rod/grip/crank follow solved hands; display facing eases without changing
physical yaw. Scene generations clear transient orientation. Upright acquisition
repairs the first clip's low sweep near Briar. Keep that negative visual evidence.
World9/Adventure12 and every persistent owner remain; no migration or fishing reward.

Hosted run38459480155 could not start jobs because GitHub reports an account
billing lock. No billing changes. Full current --browser still awaits a reviewed
road-account expectation epoch; never relax SOURCE_EXPECTATIONS04's old guards.
Human acceptance and real GPU qualification remain open. Next bounded product
arc: articulate only Ilan/Mara/Oren in existing places, preserving Core ownership.

Reuse ROOT/STATION on D. Fresh host-only6GiB admission before complete source or
every whole browser; four Node workers and original Node180/Python600 deadlines.
No VM/Claude/personal profiles/unrelated workers, cleanup, new game copy, blocked
deletion retry, paid provider, main merge or public deploy. Production unfinished.
Goal service ACTIVE; separate heartbeat remains PAUSED.
''',
'docs/CURRENT_STATE.md':f'''# A rod held by the traveler, 2026-10-13

The lantern-pier activity now uses the traveler's articulated arms: a short cast,
a held rod and a reeling hand. Displayed facing eases toward the line; physical
facing, camera preference and equipment remain. Reduced motion retains a stable
held stance and every control. The existing catch-and-release rules stay in charge.

Draft PR75, gameplay/pier-handheld-animation-20261013, is stacked on PR74.
Qualified source: {qualified}. Complete source passed
{source}. Both continuous ten-chapter draft variants
and all five earned Briar cases passed. Native02: {native}, including
fresh/blade/bow, both views and exact cold save ownership. Final clip: {clip}.

World9/Adventure12: no migration, new persistent owner, XP, inventory or reward.
An earlier low cast sweep near Briar was found visually despite green checks,
then repaired and recaptured. [Evidence, failures and limits]({link}).
Hosted checks did not start because of GitHub's billing lock. Current full
--browser, human enjoyment and real GPU qualification remain open. No complete
game or AAA claim follows. Integrated/qualification checkouts were reused on D.
''',
'docs/NEXT_TASK.md':f'''# Next: the people who inhabit the village, 2026-10-13

Continue gameplay/pier-handheld-animation-20261013 / PR75 after fetching and
checking ownership. [The fishing animation qualification]({link}) records the
current source, actual footage, failures and limits. The finite realm draft is
already present; improve its lived-in character before adding more breadth.

1. Adapt the existing rig for Ilan, Mara and Oren only. Give their actual routes
   articulated walk-to-stop motion, distinct silhouettes and hand-aligned props.
   Preserve Core's schedules, physical positions/yaw, dialogue and project facts.
   Keep generic person() and RealmGiversArt callers unchanged. Use transient
   per-resident/world/scene ownership, pause/reduced motion and a measured art
   budget. Observe actual movement and an interior in both cameras. This is a
   scoped next assignment, not an implemented feature or new canon commitment.
2. Close the current complete --browser gate separately. Review an explicit new
   road-account expectation epoch for the newer heading helpers; preserve the
   original SOURCE_EXPECTATIONS04 and negative receipts. Four current Briar
   variants remain CPU-only at the prior camera milestone.
3. GitHub's account billing lock prevents hosted jobs from starting. Leave billing
   to Dom; local successful checks do not turn unavailable hosted jobs green.
4. Keep [the hand-held pier human route](playtests/PIER_HANDHELD_2026-10-13.md)
   pending. Human comfort/recognition/enjoyment and real GPU performance are open.

Reuse ROOT/STATION; fresh host-only free memory >=6291456KiB before complete source
or each browser. Four workers, Node180/Python600 remain. VM/Claude/personal saves
and unrelated workers excluded. No cleanup, new full copy, blocked deletion retry,
paid provider, automatic main merge/deploy or heartbeat resume. Game unfinished.
''',
'docs/PLAYTEST_NOTES.md':f'''# Hand-held casting and reeling observations, 2026-10-13

Native02 passed {checks} checks on source{qualified}. Its initial
fresh, earned blade and earned Chapter IV bow cases use labelled accelerated
accepted ticks. A cold browser restart then records ordinary RAF only, using
actual controls: cast, hook, pause, reel/ease, switch cameras, catch, release,
and a second cast/cancel in the other view. No manual render calls or accelerated
ticks occur in this recorded phase. Video: {clip}; full decode passed.

Automated geometry samples check actual submitted grips/crank and head clearance.
The initial Native01 checks passed but its first cast projected a low rod across
Briar. That visual failure remains recorded. Source8bc49eb starts acquisition
upright; final raw movie frames are reviewed separately from the geometric checks.
See [the final visual observation and qualification]({link}).

The footage is automated software-WebGL2/Low play, not human play or frame-rate
qualification. Cast-frame timing is approximately aligned to the trace; no exact
frame-clock claim. No personal profile was opened. World owners and inactive
character slots survive exact cold readback. Pending questions for Dom: do the
cast/body turn/reel feel connected, can you read the line in both views, and is
this a pleasant quiet activity? [Human route](playtests/PIER_HANDHELD_2026-10-13.md).
''',
'docs/DECISIONS.md':f'''# Fishing presentation follows accepted rules and solved hands, 2026-10-13

Keep the existing transient fishing session as sole owner of timing, tension,
catch and release. Its accepted fight/reel clocks drive presentation. The cast
uses0.85s within the existing3.5s bite wait. The actual articulated rig solves
both arms, and rod grip/reel handle attach to its resulting hands. No new timer,
callback, reward or persistent state; World9/Adventure12 stay unchanged.

Displayed orientation eases independently of physical player yaw and saved camera
preferences. Identity/scene changes invalidate the cache; WorldArt.begin clears
it even for a same-room rebuild. Reduced motion uses a stable held pose. Combat
and swimming retain their existing articulation and equipment.

The original cloth source fixture is now an immutable copy of the exact PR74
traveler source; its old reconstructed-source hash remains enforced. Later rig
development cannot silently rewrite the historical comparison.

Treat visual review as evidence with its own failures. Native01's automated pass
did not excuse the low rod sweep across Briar; upright acquisition, regression
coverage and final recapture address it. Geometry is not human animation approval.
Keep the old failure and one final short published clip. [Qualification]({link}).
No paid service, billing change, cleanup, VM/Claude action, main merge or deploy.
'''
}
for relative,front in fronts.items():
 p=ROOT/relative;old=p.read_text(encoding='utf8');assert not old.startswith(front.splitlines()[0]);p.write_text(front+'\n---\n\n'+old,encoding='utf8')
q=f'''# Hand-held pier animation: exact qualification

Draft [PR75](https://github.com/EternitiesAi/eternities-firstlight/pull/75) is stacked
on PR74. Base92fff25f82ab2df6cd99e6a5693203df923a41d8; qualified runtime/test
head **{qualified}**. Later delivery commits contain only docs/evidence.
Branch: gameplay/pier-handheld-animation-20261013. No main merge or deployment.

The traveler casts, holds and reels a borrowed rod through the articulated rig.
Solved hands own grip alignment. Display facing eases without changing physical
yaw; scene generations and identity changes end its transient ownership. Reduced
motion is static. Existing catch/release, tension and pause rules remain authoritative.
World9 / Adventure12: **no migration**; no new saved owner, reward, inventory,
XP, currency, socket, equipment, story or character-choice changes.

## Delivered source

- 1f1af16acb488ca14a0f56484a76e5c369f64fae: accepted fishing clocks, pose/hand
  attachment, actual traveler caller, focused tests and immutable old cloth fixture.
- 443be8b: eased display facing and reachable initial targets.
- 289043429e2925e9ded26b3fd609ccaa909ba11d: same-room scene invalidation.
- {qualified}: upright acquisition fixes observed low onset sweep.

Runtime: src/pier-fishing.js, src/pier-fishing-art.js, src/traveler-art.js,
src/world.js and both generated HTML files. Tests: pier_handheld, pier_fishing,
traveler_cloth and tests/fixtures/traveler-art-pre-fishing.cjs. No new assets,
external library or licensed-content dependency.

## Actual verification

Run from the clean reused remote qualification checkout on D:

`python -B tools/verify.py --rule-workers 4 --output <ARC>/REMOTE_SOURCE03 --cpu-temp C:/Users/Dom/AppData/Local/Temp`

Complete Source03 passed **{source}**. It includes150 syntax
checks and159 Node rule files, both continuous ten-chapter variants (blade and
blade-to-bow), all five earned Briar continuations and original source deadlines.
No test threshold or acceptance guard was weakened. The source gate's original
commands/logs/hashes and fresh host admission are in the evidence bundle.

Native02, run by `python -B <ARC>/qualify_handheld02.py`, passed **{checks} checks**.
Fresh character, current command-earned starter blade and Chapter IV bow use the
visible production import owner; no planted inventory, position or quest facts.
It checks accepted casting/reeling/easing, hold buttons, menu/photo/real pause,
explicit catch/release and cancel, both cameras, exact active world and inactive
character slots across one whole-browser restart. All pages used a random owned
loopback origin and isolated D profile. Browser errors/external requests: zero.
Owned browser, driver and server all closed. Fresh admission for both launches:
{', '.join(str(a['freeHostKiB'])+' KiB' for a in n['admissions'])}; threshold6291456KiB.

Actual submitted geometry: {n['motion']['samples']} samples; max hand-attachment
error{n['motion']['maximumHandErrorMetres']:.6g}m; minimum rod-to-head-centre clearance
after rod radius{n['motion']['minimumRodHeadClearanceMetres']:.6f}m, exceeding the
conservative0.19m head sphere. Ordinary crank geometry travels in both views.
These sampled assertions do not prove all possible occlusion or human naturalness.

The cold-start ordinary-RAF recording uses actual UI only, without explicit
test-render/accelerated ticks: **{clip}**. Full decode passed; SHA256
`{m['sha256']}`. Initial three setup cases remain labelled accelerated.
Read VIDEO_OBSERVATION_FINAL.json for the separate frame review and its limits.

Generated index.html and FIRSTLIGHT_VALLEY.html are byte-identical:3,408,067B,
SHA256 `31a406704aee2438bcb022de565b7b6a5090770fad6ae2a266819c185df9a6a5`.
Final delivery remote readback reuses the existing clean qualification checkout,
checks the exact remote head, builds twice and validates retained evidence blobs.
It is explicitly a fresh fetch/readback, **not a new clone**. No extra full game
copy was made, respecting the current storage policy. Its final receipt is local
ARC/REMOTE_READBACK01.json because it identifies the final delivery commit itself.

## Preserved failures and review

RED01 contains expected preimplementation failures. FOCUSED02's one floating-point
comparison failure is preserved; only tolerance changed to1e-12, and FOCUSED03
passed78 checks. Final upright-focused suite passed10. Source01/02 and Native01
are historical intermediate-head results, not substituted for final Source03/Native02.
Native01 passed84 automated checks but actual03.20s footage showed a low rod across
Briar's silhouette. Upright1.42rad acquisition replaces the low initial angle;
the before frame, original logs and final both-view recapture remain.

Two independent read-only Sol6.1 xhigh reviewers inspected source/controller and
visual evidence. Their scope, findings and corrections are in REVIEW_NOTES.md;
they did not execute tests or certify the game. Parent implemented/executed.

Hosted [run38459480155](https://github.com/EternitiesAi/eternities-firstlight/actions/runs/38459480155)
shows failed job statuses, but jobs have no executed steps: GitHub reports
"The job was not started because your account is locked due to a billing issue."
Representative source/browser annotations are preserved in HOSTED_RUN01.json.
**Hosted verification is unavailable**, not passed and not a demonstrated code
test failure. Dom owns account resolution; no billing action was attempted.

## Remaining gates and use

Current full `--browser` is still open: road-account admission has historical
SOURCE_EXPECTATIONS04 pins. Review a new explicit expectation epoch separately;
never weaken old guards. Targeted native success is not that broad gate. Four
current Briar variants remain CPU-only at the prior camera milestone. No new RTX
measurement, human enjoyment/comfort approval or AAA/draft-completion claim.
Fishing audio and a retained catch/profession economy are outside this milestone.

Launch the integrated PLAY_FIRSTLIGHT_WINDOWS.cmd with the player's usual origin
and browser. At the lantern pier: E, Cast a line, explicit Look along the line,
hook, reel/ease and Release silverfin. V switches cameras. Follow the pending
[fresh/returning human route](../playtests/PIER_HANDHELD_2026-10-13.md).
Next product arc is the three familiar village residents, not another realm.

Evidence: [bounded manifest](../evidence/pier-handheld-2026-10-13/qualification-8bc49eb/MANIFEST.json).
ROOT/STATION reused on D; no VM, Claude work, personal saves, unrelated processes,
paid provider, cleanup or blocked deletion retry. Goal active; heartbeat paused.
'''
(ROOT/'docs/development/PIER_HANDHELD_QUALIFICATION_2026-10-13.md').write_text(q,encoding='utf8')
print(json.dumps({'nativeChecks':checks,'sourceHead':qualified,'clip':clip,'fronts':list(fronts)}))
