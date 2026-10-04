"""Write subsequent verification records only after the exact remote gate passes."""
from pathlib import Path
import hashlib, json

E=Path('D:/07-GAMES/Firstlight/authoring/local-life-evidence-20261003')
P=E/'docs/evidence/local-life-2026-10-03'
F=Path('D:/07-GAMES/Firstlight/artifacts/final-local-life-remote-27bdbe5-20261003')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
g=json.loads((F/'FULL_GATE_RECEIPT.json').read_text(encoding='utf-8'))
assert g['passed'] and all(g['locks'].values())
head=g['head'];short=head[:7];checks=g['browser_checks'];count=g['browser_count']
# Keep the original copy and gate hashes as authority. A newly generated
# manifest must never bless an accidentally edited original receipt.
copy_authority=Path('D:/07-GAMES/Firstlight/artifacts/local-life-20261003/PACKAGE_COPY_RECEIPT.json')
assert sha(P/'COPY_RECEIPT.json')==sha(copy_authority)
copied=json.loads(copy_authority.read_text(encoding='utf-8'))
for name,row in copied.items():
    p=P/name
    assert p.is_file() and p.stat().st_size==row['bytes'] and sha(p)==row['sha256'], ('modified copied receipt',name)
    original=Path(row['original'])
    assert original.is_file() and sha(original)==row['sha256'], ('changed original authority',name)
for suite in g['browser_suites']:
    p=P/'fresh-remote-gate/browser-reports'/(suite['suite']+'.json')
    assert sha(p)==suite['report_sha256'], ('modified frozen browser report',suite['suite'])
local=json.loads((P/'fresh-remote-gate/browser-reports/local_life_browser.json').read_text(encoding='utf-8'))
assert local['scope']=='all-three-earned-characters'
lc=len(local['checks']);restarts=sum(len(v['restarts']) for v in local['variants'].values())
assert lc==next(s['checks'] for s in g['browser_suites'] if s['suite']=='local_life_browser')
assert set(local['variants'])=={'fresh-blade','fresh-bow','returning-strongest'}
media=json.loads((P/'normal-ui-rtx-03/MEDIA_RECEIPT.json').read_text(encoding='utf-8'))
assert media['html_sha256']==g['html']['index.html']['sha256']
assert sha(P/'fresh-remote-gate/FULL_GATE_RECEIPT.json')==sha(F/'FULL_GATE_RECEIPT.json')
link='evidence/local-life-2026-10-03/README.md'
summary=(f"The subsequent fresh HTTPS checkout of gameplay `{head}` passed all "
         f"{count} browser suites /{checks:,} checks, {g['syntax_passed']} syntax checks, "
         f"{g['rules']['pass']:,} Node rules, {g['python']['passed']} Python cases "
         f"plus one existing Windows symlink skip, and {g['earned_journeys_passed']} "
         f"command-earned journeys. All {g['tracked_count']:,} tracked files and "
         "both regenerated HTML files retained their exact bytes and membership. "
         "This is a subsequent receipt, not a backdated authoring result.")

def supplement(path,text):
    p=E/path;old=p.read_text(encoding='utf-8')
    marker='## Subsequent remote qualification, 2026-10-03'
    assert marker not in old, ('already finalized',p)
    i=old.find('\n\n')
    assert i>=0
    p.write_text(old[:i+2]+marker+'\n\n'+text+'\n\n'+old[i+2:],encoding='utf-8')

supplement('docs/CURRENT_STATE.md',summary+f" See [immutable source, media and full reports]({link}). The gameplay review is PR39, stacked on PR38. The separate evidence branch changes documentation and receipts only. Hosted jobs did not start because GitHub reported an account billing lock; local Windows results do not establish hosted/Linux success.")
supplement('docs/PLAYTEST_NOTES.md',f"The complete all-three-character local-life suite passes {lc} checks and {restarts} orderly whole-browser restarts across fresh blade, fresh bow and returning strongest gear. Ordinary-RAF Cosmos footage passes19 UI checks and retains both cameras. [Actual clips and exact source qualification]({link}) include the earlier failed epochs. These are automated known routes, with human clarity, enjoyment and personal saves still pending; native-06's context-close rollback remains unresolved.")
supplement('docs/NEXT_TASK.md',f"Use gameplay `{head}` and [the subsequent exact-head receipts]({link}). All four commissions require Oren's kit; northern commissions add their older claimed local trail. Next acceptance remains Dom's fresh and returning playtest, especially route clarity, identifiable installed work, both views and the Atlantis exit. Correct observed findings before expanding the next country or subsystem. Hosted billing and native-06 abrupt/context-close durability remain separate limitations; no billing, merge or deployment action is authorized here.")
supplement('docs/DECISIONS.md',f"Keep the verified runtime at `{head}` and freeze subsequent footage/full-gate receipts on a separate evidence branch, with raw byte preservation and an exact file manifest. Preserve every earlier negative and scope difference. A headless RTX recording cadence sample does not establish monitor FPS or whole-world performance. Graceful browser restarts do not resolve native-06's context-close rollback. [Final evidence]({link}) records the tested head and pending human acceptance.")

p=E/'docs/development/LOCAL_LIFE_RESULTS_2026-10-03.md'
old=p.read_text(encoding='utf-8')
old=old.replace('A full exact pushed-head remote gate is recorded separately after publication of this review branch; earlier partial native results cannot substitute for it.',
                'At source publication, the full exact pushed-head remote gate was pending; earlier partial native results could not substitute for it. The subsequent completed receipt is recorded below.')
assert '## Subsequent exact-head remote receipt' not in old
p.write_text(old+'\n## Subsequent exact-head remote receipt\n\n'+summary+f"\n\nThe run lasted from `{g['run']['started_at']}` to `{g['run']['ended_at']}`, exit0. The local-life suite passes{lc} checks with{restarts} orderly restarts. [Full gate, raw reports, normal footage and retained negatives](../evidence/local-life-2026-10-03/README.md) distinguish these subsequent results from the original authoring epoch. Hosted run37162979120 had41 failed jobs with no executed steps: the account-billing lock prevented start. No Linux/hosted pass is claimed.\n",encoding='utf-8')

readme=f'''# Local life across the roads: playable source and evidence

Four finite commissions add practical activity to the existing Heaven, Hell,
Atlantis and Cosmos openings. Eight arrangements and thirteen physical actions
leave the player's chosen nursery, water branch, lamp and writing shelf behind.
Earth's connected road, story, repeat patrol and finite binding remain playable.
These are bounded openings, not complete countries or the full saga.

Gameplay PR: [39](https://github.com/EternitiesAi/eternities-firstlight/pull/39).
Tested runtime: `{head}`, stacked on PR38/base
`f3a4df5f8023b385ea5273aa6d90ba5ddf438121`. This separate evidence branch adds
receipts and subsequent documentation only. Main remains unmerged; no deployment.

## Play

Launch `PLAY_FIRSTLIGHT_WINDOWS.cmd` or `python tools/play_local.py` from the
gameplay checkout. Keep the existing `http://127.0.0.1:8780/` save origin/profile.
All four commissions require Oren's initial expedition kit. Heaven additionally
requires the claimed Broken Choir repair; Hell requires the claimed Neris rescue.
Atlantis/Cosmos require no further campaign advancement. Open J → Journal →
Local life to read terms, choices and exact payment. M shows local L routes;
E performs an available physical action. V exchanges cameras; R deliberately
resets current framing. The [clarified play guide](../../playtests/LOCAL_LIFE_2026-10-03.md)
includes the real underwater route and far gallery exit.

| Place | Work | Fixed payment |
| --- | --- | --- |
| Heaven | Inspect a channel or wick connection, prepare supplied cuttings, plant a separate nursery. |20XP,8sunmarks,4fibre|
| Hell | Inspect the cooling connection, fit a cartridge or isolated hand-filter, verify the Refuge outlet. |22XP,9sunmarks,2ore|
| Atlantis | Assemble a keyed cartridge, read the upper visitor gauge, fit the existing air-court lamp. |25XP,8sunmarks,2timber,1crystal|
| Cosmos | Inspect sockets, assemble supports, carry and fit a route shelf or sheltered writing tray, return to Teren. |25XP,8sunmarks,2timber,1fibre|

Job supplies remain separate from normal inventory and equipment. Currency and
ordinary materials contribute to existing crafting/building, including for
strongly equipped returning characters. There is no new universal power tier.
Choices and progress require actual accepted events. Full candidate/capacity
validation and a successful save precede live adoption; a refused payment stays
ready for retry. Each finite claim pays once, including after reload or a changed
request ID.

## Fresh exact-head results

The [full gate receipt](fresh-remote-gate/FULL_GATE_RECEIPT.json) and
[suite-by-suite summary](fresh-remote-gate/SUMMARY.md) record the actual HTTPS clone
and `python tools/verify.py --browser` run from `{g['run']['started_at']}` to
`{g['run']['ended_at']}`, exit0. All{g['tracked_count']:,} tracked files retain
their byte hashes and exact membership; the checkout remains clean.

| Gate | Result |
| --- | --- |
|Regenerated identical HTML|{g['html']['index.html']['bytes']:,} bytes each; SHA256 `{g['html']['index.html']['sha256']}`|
|Syntax|{g['syntax_passed']}/{g['source_modules']}|
|Node rules|{g['rules']['pass']:,}/{g['rules']['tests']:,}; zero failures|
|Python|{g['python']['passed']} passed; one existing Windows symlink-privilege skip|
|Command-earned journeys|{g['earned_journeys_passed']}/40|
|Browser suites|{count}/{count}; {checks:,} checks, zero failed or unknown|
|Local-life native subset|{lc} checks, {restarts} orderly full-browser restarts; all three earned characters|

Local native checks use isolated persistent Chromium profiles, real save paths,
visible acceptance/work/claim UI and actual movement/body-depth rules. Movement
ticks are explicitly accelerated there. Framebuffer controls compare installed
parts against absent and previous parts in both selected reset views. Saved
camera profiles are verified before that deliberate framing action. Arbitrary
wall-facing custom orbits are not qualified. Raw reports, inputs and selected
captures remain under `fresh-remote-gate/`; no personal saves/profiles are packaged.

Hosted [run37162979120](https://github.com/EternitiesAi/eternities-firstlight/actions/runs/37162979120)
had41 failed jobs and no executed steps: GitHub stated the account was locked due
to billing. The original annotations/jobs are retained. Windows local success
does not imply fresh Linux or hosted success. No account/billing action was taken.

## Actual footage and desktop sample

[Full113.44-second silent UI recording](normal-ui-rtx-03/LOCAL_LIFE_NORMAL_UI.mp4)
and [65-second mobile excerpt](normal-ui-rtx-03/MOBILE_LOCAL_LIFE.mp4) are actual
normal-speed Cosmos play, not rendered concept art or accelerated test footage.
They show visible acceptance, inspection, rejected/correct assembly, fitted work,
both cameras and an explicit claim.19/19 UI checks pass with no position/resource
grants or accelerated ticks. Source WebM, all decoded frame counts, hashes,
encoder/decode logs and stills are retained in `normal-ui-rtx-03/`.

The original filming report records authoring basef3a4df5 because changes were
then uncommitted. Its exact HTML hash is identical to tested27bdbe5. The fixture
was command-earned and already had a fresh localLife1 field; this footage is not
itself a missing-field migration test. The original report was not relabelled.

Actual renderer is RTX3080 through ANGLE/D3D11, Chromium143.0.7499.4, balanced
1280×800. Subsequent read-only host metadata reports NVIDIA adapter driver
32.0.16.1074; `DESKTOP_ADAPTERS_20261003.json` preserves its timing and distinguishes
that current-driver read from a driver-at-capture attestation.
Two600-interval Cosmos samples during video capture report maximum and
P99 approximately16.8ms, with no intervals above33.333/50ms. This is headless
browser cadence under recording load, not GPU-render-time, display timing,
isolated-GPU or whole-world qualification. Other apps were not stopped. No new
whole-game60-FPS claim follows.

## Compatibility and remaining acceptance

World/key9 and adventure12 remain; optional localLife1 initializes four unaccepted
records in an old valid world, without backfilled consent or payouts. Malformed or
future local-life data refuses validation. XP1–5/stored9999, gear, sockets, finite
fittings, companion, housing/crops, music/notebook, old quests and explicit
story/soul/class histories retain their owners. No personal-save coverage is claimed.

Native-06 observed a partial-work rollback after context-only browser shutdown.
Its cause remains unresolved. Subsequent graceful page/full-browser restarts
qualify that separate orderly path, not abrupt termination or crash durability.
Earlier native failures, the interrupted native-05 and two video-export failures
remain under `earlier-epochs/`; missing final reports are not turned into passes.
The source-results snapshot preserves the earlier failure chronology.

Human pacing, readability, touch/controller, enjoyment and personal saves remain
pending. Dom should play one fresh and one returning case: did you know where to
go, did the places feel inhabited, could you recognize your chosen work, and did
you want another outing? Paid power, offline loss, rare pets and construction scale
remain founder decisions. Large-country streaming, the full saga, roster/collecting
and real multi-client trading remain separate milestones.

The older preview restart was rejected before execution by automatic approval
review: `CreateProcess blocked by policy`. This work does not bypass that action
or switch the personal save origin. The PR attachment call also did not return;
read-only app reconciliation timed out, so app attachment remains unknown while
the GitHub PR itself exists.

`MANIFEST.json` hashes every package file except itself. `COPY_RECEIPT.json` maps
copied originals without editing their bytes; `.gitattributes` preserves them.
Subsequent records and this README are newly written, not claimed as old receipts.
The pushed package is separately checked as raw Git blobs and exact membership.
The [bounded colleague review](INDEPENDENT_MEDIA_REVIEW.md) is read-only source
and existing-evidence inspection, not a second browser or GPU execution.
'''
(P/'README.md').write_text(readme,encoding='utf-8')
files=[{'file':p.relative_to(P).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}
       for p in sorted(P.rglob('*')) if p.is_file() and p.name!='MANIFEST.json']
assert all(f['bytes']<100_000_000 for f in files)
manifest={'version':1,'source_head':head,'html_sha256':g['html']['index.html']['sha256'],
          'files':files,'excluded':['MANIFEST.json'],'personal_saves':False,'browser_profiles':False}
(P/'MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'files':len(files),'bytes':sum(f['bytes'] for f in files),
                  'manifest_sha256':sha(P/'MANIFEST.json'),'local_checks':lc,'restarts':restarts},indent=2))
