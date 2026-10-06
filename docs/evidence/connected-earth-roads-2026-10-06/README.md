# Connected Earth roads: implementation evidence

The qualified source is `24c458037aec59f783840c2a9311896e95de1c54`, based on
`483ac5e03a83b71b5cabe424d2459ed1ee9a5973` (PR #49). PR #50 is a draft review
stacked against that gameplay branch. Main remains unmerged; nothing was
publicly deployed.

Hearthwater's orchard/ridge approach now has a supported, signed road to
Coastward's bridge, settlement, fields and Elderweald. The player reads the
route and explicitly continues at the nearby sign. Both numbered maps call
the canonical endpoint. Original Firstlight departure and cold home resume
remain intact. This connects authored scenes; it does not stream a continent.
Existing Merren work keeps its declared once-only reward. Travel grants no
items, XP, quest acceptance or implicit story choice.

## Exact-source qualification

The complete verifier ran in the reused, clean, freshly fetched independent
remote checkout on D. `complete/PROCESS_EXIT.json` contains the actual process
completion time, exit code and console digest. `SOURCE_BINDER.json` binds the
source changes and identical generated HTML to that run.
`complete/COMMAND_LOGS.json` hashes all 235 command outputs; empty successful
outputs are represented there rather than added as hundreds of empty files.

```text
python -B tools/verify.py --browser
  --output <D artifact root>/remote-full04
  --browser-output <D artifact root>/remote-full04-browser
  --browser-output-mode supported
```

| Check | Actual result |
| --- | --- |
| Complete verifier | Exit 0; 235 successful commands in one invocation |
| JavaScript syntax | 121 modules |
| Node rules | 1,556 total; 1,554 passed; 2 explicit generic-cohort skips; 0 failed |
| Python discovery | Ran 243 tests; 237 method passes; 6 method skips; 2 skipped class setup records; 0 failed |
| Current mandatory Earth preflight | 26 native and 37 recording-controller checks passed without skips |
| Strict whole-draft earned preflight | 7 passed without skips |
| Browser regression gate | All 48 suites passed |
| Focused road/regression tests | 37 passed; 0 failed or skipped |
| Road browser UI/persistence | 285 checks passed; no browser errors; 8 complete browser restarts |
| Earth native journey | 6,205 checks passed; 30 command-earned stages |
| Normal-RAF paused road reading | 8.2169 seconds; world clock frozen; subsequent explicit crossing succeeded |

The two Node skips explicitly require current cohorts which generic discovery
does not provide. Python also preserves missing explicit-cohort and Windows
symlink-privilege skips. Mandatory Earth and whole-draft checks run separately
against the current earned inputs; the command logs preserve exactly which
checks executed. Hosted Linux coverage did not execute in this run.

Both generated pages are byte-identical: **3,048,605 bytes**, SHA-256
`14c23bbf9325048407b50fe094d7f14cafea31e2c21f94b0347be2b30ede6d4d`.
World schema **9**, adventure **12** and earthHomecoming **1** remain unchanged.
No durable migration, personal-save inspection or old-key replacement occurred.

## Visible gameplay and measurement

[Actual road and bridge recording](media/ACTUAL_ROAD_AND_BRIDGE.webm) is a
32.88-second silent recording at 1280 × 720, encoded at 25 fps. It starts from
the current command-earned blade fixture. Northern-approach setup uses
accelerated production walking; the visible fork, deliberate crossing, bridge
walk and camera changes use normal RAF. `video/REPORT.json`, `ACTIONS.json`,
`PROVENANCE.json` and the earned input retain the source and action receipts.
This is actual gameplay, not concept art or a simulated video.

Current inspected images:

- [Hearthwater in third person](media/HEARTHWATER-THIRD.png)
- [Coastward diorama](media/COASTWARD-DIORAMA.png)
- [Compact road terms](media/COMPACT-ROAD.png)
- [Decoded bridge frame from the movie](media/DECODED-BRIDGE.png)

The recorded hardware renderer was ANGLE / NVIDIA GeForce RTX 3080 / D3D11;
Chromium 143.0.7499.4, driver 610.74, balanced quality. Headless callback
intervals during the normal-RAF portion were:

| Scene | Samples | p50 | p95 | p99 | Maximum | Over 50 ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Hearthwater | 292 | 16.7 ms | 16.7 ms | 16.8 ms | 16.8 ms | 0 |
| Coastward | 1,418 | 16.7 ms | 16.8 ms | 16.8 ms | 199.9 ms | 1 |

These are recorded callback intervals on a shared desktop, with recorder/menu
overhead. They are not foreground display FPS or GPU timer measurements. The
single Coastward stutter is retained; its cause remains unlocalized. No 60-fps,
mobile performance, human enjoyment or AAA completion claim follows from them.

## Retained failures and external blocker

`negative/complete01` retains the failed legacy-geometry tests; the road now
uses a local tagged overlay after unchanged legacy emissions. `complete02`
retains the failed non-D fixture tests; their inert path fixtures now explicitly
remain on C despite D-based TEMP. `complete03` was deliberately cancelled when
the numbered atlas exposed an unsupported endpoint. The source fix aligns the
actual map point and timber-ground normal axes, and current browser checks
exercise the real numbered controls. Those attempts are not counted as green
complete gates.

GitHub [run 37524631245](https://github.com/EternitiesAi/eternities-firstlight/actions/runs/37524631245)
at the qualified source reported failures **before any job could start**, with
the annotation that the account is locked due to a billing issue. Primary run
and annotation receipts are under `hosted/`. This supplies no hosted execution
evidence. No billing changes or workflow retries were made.

## Acceptance and next work

Dom's fresh and returning-character playtests remain pending: Did you know
where to go and how to return? Was the work and danger clear in either camera?
Did the useful result make another outing appealing?

The wider production goal remains active. The next review slice is physical
fitting of the existing Living Road support. Its small rules/art proposals are
staged separately; they are not integrated into this build. Full streamed
countries, mounts, the larger Regent war, Answering and Briar resolution remain
production work. The old continuation heartbeat stays paused. The staged rules, art, UI and
command-gate proposals passed 111 combined Node tests, but actual app/event/camera
and earned/native integration remain pending; those proposals are outside this PR.

`MANIFEST.json` hashes every package payload except itself. Only one current
short movie and four useful images are included; browser profiles, raw frames,
personal saves and duplicate full games are excluded.

After complete qualification and exact report retention, root retired only three
closed, explicitly disposable synthetic Atlantis profiles: 33,194,243 logical
bytes. Native final bytes, eight restart receipts per character and final worlds
remain in the unchanged report. Refusal, failure, migration and ambiguous
profiles remain; personal profiles and the blocked standalone clone were untouched.
The exact scope and per-leaf inventory are in `retention/SUCCESS_PROFILE_RETIREMENT.json`.
