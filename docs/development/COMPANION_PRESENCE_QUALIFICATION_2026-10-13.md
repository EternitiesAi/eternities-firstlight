# Lantern pier and companion presence

The existing lantern pier now offers an optional catch-and-release activity:
cast, wait for a sustained bite, hook, manage tension, then explicitly release
the silverfin. Fresh characters need no expedition kit or campaign progress.
The old quiet-water rest remains a separate choice. Names and tuning are
provisional design judgments informed by the founder's Earth charter.

Briar's peaceful Follow settles on supported ground beside the player. The
shared-house rest target is beside the doorway, and a crowded fox yields before
resting or allowing Remember. This is stable idle spacing, not guaranteed
shoulder formation while traveling. The pier sign now participates in camera
cutaway; it no longer forces the same solid obstruction in the carried-cloth view.

## Source and save contract

- Base: `fced43a050fa6feda1abf98aceb66a48d2ff477b`, PR72,
  `gameplay/briar-shared-outing-20261013`.
- Review branch: `gameplay/companion-presence-20261013`, stacked on that base.
- Qualified runtime/test head: `1f233c9c71c30161a8db105fa85d88187aa66a90`.
- Generated HTML: 3,401,029 bytes;
  SHA-256 `47ab42ac7866a7e5e7e6ef4cd43c7c336cd3285b1ab8c474ae1f7c90960991c8`.
- World9, Adventure12, Expedition1, WildSigns1 and BriarMoments1 unchanged.
  No new save field, key, migration, equipment, XP, money, bait cost, collection
  or reward payout. A partial fishing session deliberately ends on reload.
  Existing explicit cloth/rest facts keep their IDs and sole save owner.

Fishing uses the accepted simulation clock and actual supported location.
Pause, menus and photo mode suspend it without elapsed catch-up. Global E
cannot operate a hidden line; H/Escape retain photo controls. Walking away,
scene/death/character replacement or page loss ends the transient activity.
Native buttons support Space/Enter without triggering dodge. The explicit
Look action frames the water in the selected camera style without changing FOV.

## Executed verification

Source08 ran in the clean reused qualification checkout, fetched from GitHub at
the exact qualified head. `python -B tools/verify.py --rule-workers 4 --output
D:/07-GAMES/Firstlight/artifacts/companion-presence-20261013/REMOTE_SOURCE08
--cpu-temp C:/Users/Dom/AppData/Local/Temp` passed all **223 commands**, including
150 syntax checks. Original Node180/Python600 timeouts were retained.

| Check | Actual result |
| --- | --- |
| Node rules, 157 files | 2,225 passed, 0 failed, 2 existing skips |
| Python | 488 methods OK, 8 skip records |
| Whole-draft earned journey | 2 continuous blade / blade-to-bow variants, 10 chapters each |
| Briar earned continuation | 5 cases, 2,699 supported tick segments, 2 fact writes each |
| Native fishing, Native05 | 44 passed checks; fresh and earned Chapter IV bow; whole-browser reload |
| Native Briar, Native02 | 103 passed checks; early rescued blade only; 3 exact-byte restarts |

The other four Briar fixtures are CPU-only in this qualification. Native Briar
has four balanced owned driver starts/stops and 703 accepted tick segments.
All final native browser/request error lists are empty, and owned browsers,
drivers and loopback servers closed. These are isolated synthetic/command-earned
profiles, never Dom's saves. Six final whole-browser admissions all exceeded
6 GiB free host RAM; the source admission was 9,860,896 KiB. No VM, guest,
Claude Code, personal profile or unrelated process was accessed or controlled.

Native runs used software WebGL2 and Low quality. Fishing's first two cases use
accelerated accepted setup ticks; after its cold launch the recording uses
ordinary RAF only. The saved returning character retains equipment and story
owners. The clip is **46.36 seconds, 4,237,185 bytes, 1,159 decoded frames**.
This is encoded media duration, not measured game FPS or human play. The shorter
42.818-second observation interval begins after page readiness.

## Visible results and remaining limits

The float and landed fish are visible beyond the pier in both screenshots taken
after the explicit Look action. Those images qualify the framed views, not every
possible default orbit. The cloth is visible in the close-camera pier view,
with the obstructing board cut away. Diorama shows the separated doorstep rest.
The retained third-person doorstep image is **too tightly framed against the
house wall**: its pose check passes, but the resting fox is poorly visible. This
is an open camera-quality defect, not a fully polished two-camera presentation.

The rod is an original procedural model in a pier holder. Hand casting/reeling
animation, fishing audio, more species, collection and an economic profession
are not implemented. Human pacing/enjoyment, real-GPU performance and the complete
current `python tools/verify.py --browser` regression remain open. Historical
full-browser passes are not relabelled as current. Production is unfinished.

## Preserved failures

Source01 declined allocation below the RAM floor. Source02 failed five legacy
App test-host checks because those hosts omitted the new dependency; the narrow
host repair retained their original assertions. Source03–07 passed their own
earlier heads and are superseded. Initial RED and corrective focused logs remain.

Native01 exposed a real HUD/settings overlap, now fixed. Native02 tried closing
an already-closed import dialog; Native03 used the hidden legacy Explore button;
Native04 asserted before asynchronous import confirmation became visible. Native05
uses visible More → Explore and waits for visible controls, with the same oracles.
Briar Native01 sampled while the accepted house walk was still underway and the
fox was yielding. Reviewed Native02 waits at most 240 accepted 0.05s ticks for
actual rest/readiness, then runs every original pose assertion. Nothing moves by
coordinate injection. The first media decode failed because bundled FFmpeg lacks
the null muxer; Decode02 fully decoded and re-encoded to the Windows null device
with one thread, producing no second stored movie. Earlier failures remain failed.

## Evidence, launch and next acceptance

[The byte manifest](../evidence/companion-presence-2026-10-13/qualification-1f233c9/MANIFEST.json)
lists 175 retained evidence files / 14,020,398 bytes: original receipts, selected
screenshots, reviewed callers, failures and one finished clip. Byte-preserving
Git attributes protect the hashes. Original diagnostic profiles and receipts
remain in the bounded D-drive artifact folder; no full game was copied or removed.
The integrated authoring and independent qualification checkouts were reused.

Run `PLAY_FIRSTLIGHT_WINDOWS.cmd` or `python tools/play_local.py` from the reviewed
checkout. The usual launcher origin is `http://127.0.0.1:8780/`; preserve the usual
browser/profile for personal saves. Follow [the short playtest](../playtests/PIER_AND_COMPANION_2026-10-13.md).
Next engineering priority is close-camera readability around buildings and
character/companion animation, with the current full-browser gate still required.
Dom's fresh/returning play remains pending: could you find the activity, read the
line in both views, and enjoy spending time here with Briar?
