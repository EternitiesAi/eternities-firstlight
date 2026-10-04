"""Append subsequent exact-head qualification without relabelling older receipts."""
from pathlib import Path
import hashlib,json,subprocess
A=Path('D:/07-GAMES/Firstlight/artifacts/home-remembers-20261003')
F=Path('D:/07-GAMES/Firstlight/artifacts/final-home-history-remote-4240d9e-20261003')
E=Path('D:/07-GAMES/Firstlight/authoring/home-history-evidence-20261003')
P=E/'docs/evidence/home-history-2026-10-03'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
g=json.loads((F/'FULL_GATE_RECEIPT.json').read_text(encoding='utf-8'))
head='4240d9eaefb81d492040295b5b2b70e08e4245c8'
assert g['passed'] and g['head']==head and g['browser_count']==40
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=E,text=True).strip()==head
assert sha(P/'fresh-remote-gate/FULL_GATE_RECEIPT.json')==sha(F/'FULL_GATE_RECEIPT.json')
home=json.loads((P/'fresh-remote-gate/browser-reports/home_history_browser.json').read_text(encoding='utf-8'))
hc=len(home['checks']);restarts=sum(len(v['restarts']) for v in home['variants'].values())
assert hc==243 and restarts==18 and home['head']==head
media=json.loads((P/'normal-ui-rtx-01/MEDIA_RECEIPT.json').read_text(encoding='utf-8'))
assert media['exact_source_head']==head and media['html_sha256']==g['html']['index.html']['sha256']
link='evidence/home-history-2026-10-03/README.md'
summary=(f"A subsequent fresh HTTPS clone of gameplay `{head}` passed all "
 f"{g['browser_count']} browser suites / {g['browser_checks']:,} checks, {g['syntax_passed']} syntax checks, "
 f"{g['rules']['pass']:,} Node rules, {g['python']['passed']} Python cases plus one existing Windows symlink skip, "
 f"and {g['earned_journeys_passed']} command-earned journeys. All {g['tracked_count']:,} tracked files and both "
 "regenerated HTML files retained their exact bytes and membership. This later receipt qualifies the pushed source; it does not rewrite the authoring epochs.")
def supplement(path,text):
 p=E/path;old=p.read_text(encoding='utf-8');marker='## Subsequent home-history qualification, 2026-10-03'
 assert marker not in old,('already supplemented',path)
 i=old.find('\n\n');assert i>=0
 p.write_text(old[:i+2]+marker+'\n\n'+text+'\n\n'+old[i+2:],encoding='utf-8')
supplement('docs/CURRENT_STATE.md',summary+f" [Playable source and immutable receipts]({link}) accompany draft PR40, stacked on PR39. Normal-time RTX footage passes24 UI checks. The separate evidence branch changes records and receipts only. GitHub billing prevented all hosted jobs from starting; local Windows success does not establish hosted/Linux success. Dom's human play remains explicitly deferred.")
supplement('docs/PLAYTEST_NOTES.md',f"The exact pushed-head home suite passes{hc} checks across blade, bow and strongest returning characters, including{restarts} whole-browser restarts (six context-only, twelve awaited page closures). Matching normal-time footage shows gathering, craft, bridge return, placement, both views and remove/undo. [Raw receipts and actual clip]({link}) preserve source epochs. These known routes do not establish novice clarity, taste, touch/controller or personal-save compatibility; prior LocalLife native06 remains unexplained.")
supplement('docs/NEXT_TASK.md',f"Continue from gameplay `{head}` after fetching current comments and concurrent edits; use [the completed subsequent receipts]({link}). Dom explicitly authorizes continued development and defers his playtest. The next recommended implementation arc is a connected Earth settlement return loop: familiar people, readable local needs, deliberate repeat identities and visible consequences. Inspect existing Stormfall/Elderweald/Coastward ownership before choosing a bounded slice. This direction is a recommendation, not implemented by this home branch. Human observations remain pending evidence, without becoming a new permission gate. Keep both cameras, old saves and founder uncertainties.")
supplement('docs/DECISIONS.md',f"Freeze the completed runtime at `{head}` and retain final remote/media qualification on a separate evidence branch. Preserve original byte receipts and exact manifest membership. Native05's pre-commit HEAD stays unchanged; the final fresh-clone home report records the pushed head itself. Keep the six context-only and twelve awaited closures distinct, and do not extend them to crash durability or an explanation of prior LocalLife native06. [The package]({link}) includes earlier negative epochs and a read-only colleague audit. RTX RAF samples describe capture-time callback cadence, not monitor or whole-world performance.")
supplement('docs/development/HOME_HISTORY_RESULTS_2026-10-03.md',summary+f"\n\nThe full verifier ran from `{g['run']['started_at']}` to `{g['run']['ended_at']}`, exit0. The final home browser subset passes{hc} checks with{restarts} restarts. The normal-time RTX capture is at the pushed head,24/24 checks; original/full footage decodes1644 frames over65.76 seconds, with a65-second sharing trim. [Full raw receipts, media and failures](../evidence/home-history-2026-10-03/README.md) preserve the source-commit pending text below as historical evidence. Hosted run37169616583 failed before execution: all42 jobs have zero steps and the account-billing-lock annotation. No fresh hosted/Linux result or billing action is claimed.")
supplement('docs/playtests/HOME_THAT_REMEMBERS_2026-10-03.md',"The engineering slice is qualified at `"+head+"`: fresh source/browser gates and actual normal-time footage are complete. [Watch the known-route clip and read exact receipts](../evidence/home-history-2026-10-03/README.md). Start in Journal or Crafting; completing an eligible local commission teaches its design, then gather, craft and arrange deliberately. Human play is still deferred by Dom; the questions below remain unanswered. The launcher preserves the8780 origin and refuses an older conflicting server.")

readme=f'''# A Home That Remembers: playable source and evidence

Claimed practical work in Heaven, Hell, Atlantis and Cosmos can become four
finite original furnishings in the existing retreat. The player learns a design,
reads its fixed cost, gathers missing ordinary materials, crafts at an outdoor
workbench, then deliberately arranges the owned piece at home. Each can be moved,
rotated, removed and placed again. The home pin is independent of the equipment
project. Nothing accepts work, grants payment, equips gear or places furniture
automatically. These objects add no combat power or farming payout.

Gameplay [draft PR40](https://github.com/EternitiesAi/eternities-firstlight/pull/40)
is stacked on PR39/base `27bdbe585f8970c7695e04b79c7ef171e3bd1055`.
Tested and filmed source: `{head}`. The separate evidence branch adds subsequent
records and receipts only. Main remains unmerged; there is no public deployment.

## Playable loop

Use `PLAY_FIRSTLIGHT_WINDOWS.cmd` or `python tools/play_local.py` from the
gameplay checkout. Preserve the existing `http://127.0.0.1:8780/` save origin and
profile. The launcher refuses a conflicting old build truthfully. Journal or
Crafting → **Read home designs and arrange your room** opens the four cards.
Reading or pinning does not accept a commission. The card links to its existing
terms and shows learned, made and placed status. See the [play guide](../../playtests/HOME_THAT_REMEMBERS_2026-10-03.md).

| Provisional piece | Knowledge prerequisite | Fixed cost | Visible shape |
| --- | --- | --- | --- |
| Returned-cuttings tray / memory-cuttings | Claimed Heaven propagation commission |2 wood,2 fibre|Low tray with six separate green cuttings|
| Refuge hand-lamp / memory-refuge | Claimed Hell water commission |2 stone,1 wood,1 fibre|Warm wick, stone ballast, guard and timber handle|
| Bellglass reading lamp / memory-bellglass | Claimed Atlantis lamp commission |2 wood,1 crystal|Tall cyan crystal, copper collar and hood|
| Farroad page stand / memory-farroad | Claimed Cosmos shelf commission |2 wood,1 fibre|Braced writing stand with tied travel page|

All four are optional for blade, bow and strongest returning gear. Atlantis and
Cosmos require the initial expedition kit without later campaign advancement.
Heaven and Hell retain their existing claimed trail prerequisites. Claimed work
teaches knowledge; it does not provide a free furnishing or replay a reward.
Older eligible characters can use that knowledge honestly. Some commission
payments cover the cost; missing timber/stone still needs normal renewable
gathering. Materials are not silently exchanged or drawn from job-supply records.

At the outdoor home workbench, **Make** validates knowledge, ownership, location,
cost, candidate save and capacity before adoption. Each design owns one finite
copy. Walk over the eastern bridge and enter the lantern house with E. Choose an
owned piece and position, inspect any proposed replacement, then **Confirm this
arrangement**. Remove keeps the owned object; it does not refund raw materials.
Moving it clears its earlier slot. V exchanges cameras and R deliberately resets
framing. Rotate, undo/redo, wall and floor edits also save their candidates before
adoption. A rejected save preserves layout, materials and live undo history.

## Fresh exact-head qualification

The [full receipt](fresh-remote-gate/FULL_GATE_RECEIPT.json) and
[suite summary](fresh-remote-gate/SUMMARY.md) record the actual HTTPS clone and
`python tools/verify.py --browser` run from `{g['run']['started_at']}` to
`{g['run']['ended_at']}`, exit0. All{g['tracked_count']:,} tracked files retain
their hashes and exact membership, and the checkout remains clean.

| Gate | Actual result |
| --- | --- |
|Identical regenerated HTML|{g['html']['index.html']['bytes']:,} bytes each; SHA256 `{g['html']['index.html']['sha256']}`|
|Syntax|{g['syntax_passed']}/{g['source_modules']}|
|Node rules|{g['rules']['pass']:,}/{g['rules']['tests']:,}; zero failures|
|Python|{g['python']['passed']} passed; one existing Windows symlink-privilege skip|
|Command-earned journeys|{g['earned_journeys_passed']}/43|
|Browser suites|{g['browser_count']}/40;{g['browser_checks']:,} checks; zero failed or unknown|
|Home native subset|{hc} checks;{restarts} whole-browser restarts; all three earned characters|

The home journeys earn the campaign/regional claims through actual rules, use
renewable gathering, pay exact crafting costs and place all four pieces through
the existing room owner. Browser checks then exercise visible UI, original-key
preservation, migration, costs/refusals, remove/move/history, quotas and character
replacement. Six context-only and twelve awaited-page-close checkpoints record
raw pre-app startup bytes equal to the last observed save. The awaited closes
observe the production pagehide. Real low-quality framebuffer ablations exercise
all four models in both reset cameras, restoring original state, batches and
pixels exactly. Movement/gathering ticks are explicitly accelerated in this
software-WebGL suite; it is distinct from the recording below.

Authoring Native05 records the original pre-commit HEAD27bdbe5 with the same
bf0bc199…5c9f1 HTML. The recorded authoring source hashes reconcile with the later
source; CRLF/LF checkout differences are retained honestly. Its report is not
rewritten as a4240d9e execution. The fresh home report does record4240d9e itself.
Raw suites, logs and selected actual captures are retained, without profiles or
personal saves. All historical failure epochs keep their actual statuses.

Hosted [run37169616583](https://github.com/EternitiesAi/eternities-firstlight/actions/runs/37169616583)
contains42 failed jobs and zero executed steps. GitHub's annotation says the
account is locked due to billing. Original jobs/annotations are preserved.
Local Windows results do not imply a fresh hosted/Linux pass. No account or
billing action was taken.

## Actual footage and bounded desktop measurement

[Full65.76-second silent gameplay](normal-ui-rtx-01/HOME_NORMAL_UI.mp4) and
[65-second sharing clip](normal-ui-rtx-01/MOBILE_HOME.mp4) show actual ordinary UI
actions and normal game timing: read/pin, gather, make four pieces, cross the
bridge, arrange them, switch cameras and remove/undo.24/24 checks pass, with zero
position edits, resource grants or accelerated ticks. The imported separate
character is a labelled command-earned fixture with all four commissions already
claimed and no home objects. This clip does not show earning every commission or
playing the whole campaign. It is an engineering known route, not novice pacing.
The sharing filename does not imply mobile interaction qualification.

Original WebM and full MP4 completely decode1644 frames/65.76s; the sharing trim
decodes1625 frames/65s, starting0.76s into the full footage. Both preserve speed;
encoder/decode logs, receipts and file hashes are retained. The recording's
report names exact source4240d9e and identical qualified HTML. Screenshots show
actual geometry, not concept art or a synthetic substitute.

Renderer: RTX3080 through ANGLE/D3D11, Chromium143.0.7499.4, balanced1280×800,
headless desktop. Two retreat samples contain600 normal RAF intervals each while
recording: median/P95≈16.7ms and P99/maximum≈16.8ms, with no intervals over33.333
or50ms. These describe browser callback cadence under video load, not GPU render
time, monitor timing, isolated-GPU or sustained whole-world performance. Driver
at capture is not attested. No new whole-game60-FPS claim follows.

## Compatibility and remaining limits

World/key9, adventure12, sandbox1, retreat1 and character-library1 remain.
Optional homeHistory1 starts empty when absent. Claimed local work unlocks only
the matching design; it neither backfills consent nor replays payment. Malformed,
future, duplicate, unearned or unowned placed memory data refuses validation.
Stored XP1–5/9999, notes/music/exports, housing/crops, owned/equipped gear,
sockets/fittings, companion and explicit story/soul/class/claim histories retain
their owners. Personal saves were neither inspected nor used for automation.
Session undo history itself does not persist across full browser restarts.

Earlier home harness failures include clock comparison, camera-profile/cleanup,
receiver-less quota-method restoration and nonexistent batch-method assertions;
these are preserved rather than presented as passes. Native04's207 checks are
an earlier weaker epoch, distinct from Native05's243. The previous LocalLife
native06 rollback after context-only shutdown remains unexplained; these later
passing states do not solve it or establish crash/abrupt-kill durability. See the
separate prior [LocalLife evidence branch](https://github.com/EternitiesAi/eternities-firstlight/tree/c8577cb7820e3de37cb1e32737ad38b7aadbe544/docs/evidence/local-life-2026-10-03).

Dom explicitly deferred human play while authorizing continued development.
Clarity, taste, enjoyment, touch/controller, arbitrary custom camera orbits and
personal-save behavior remain pending. His eventual questions: did the home
objects make the journey feel remembered; were learning/costs/placement clear;
did the connection make you want another outing? Large-country streaming, the
full saga and real multi-client trading remain separate work. Paid power,
offline-loss severity, rare-pet allocation and construction scale remain founder
decisions. This prototype slice is complete; the entire game is not finished.

The previous preview-server restart was rejected before execution by automatic
approval review: `CreateProcess blocked by policy`. This work does not bypass
that action or switch the personal save origin. The PR attachment call timed out;
its app outcome remains unknown although the GitHub PR exists.

`MANIFEST.json` inventories every package file except itself. `COPY_RECEIPT.json`
freezes original source paths, sizes and SHA256s, with exact raw-byte copying.
Scoped `.gitattributes` prevents line-ending conversion. Subsequent prose is
newly written, not an old receipt. Harnesses are historical snapshots with their
original paths, not a promise of portable standalone execution. The pushed
package is separately reconciled as remote raw Git blobs and exact membership.
The bounded colleague review inspects sources and receipts; it is not a second
browser, media-decode or GPU execution.
'''
(P/'README.md').write_text(readme,encoding='utf-8')
files=[{'file':p.relative_to(P).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(P.rglob('*')) if p.is_file() and p.name!='MANIFEST.json']
assert all(f['bytes']<100_000_000 for f in files)
(P/'MANIFEST.json').write_text(json.dumps({'version':1,'source_head':head,'html_sha256':g['html']['index.html']['sha256'],'files':files,'excluded':['MANIFEST.json'],'personal_saves':False,'browser_profiles':False},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'files':len(files),'bytes':sum(f['bytes'] for f in files),'manifest_sha256':sha(P/'MANIFEST.json')},indent=2))
