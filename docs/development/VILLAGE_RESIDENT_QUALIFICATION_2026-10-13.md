# Village resident articulation: implementation and open visual gate

PR76: https://github.com/EternitiesAi/eternities-firstlight/pull/76

Branch `gameplay/village-resident-articulation-20261013`, stacked on PR75 at
`708411ebe85d9bca75b0e13964564174ec1b61cb`. Current runtime/test head:
`d8d07ad8d34afc1371e13c39e0a685c2a4a61d94`.

Ilan, Mara and Oren now use distance-driven articulated walking and settling in
their existing routines. Their instrument, notebook and folding rule attach to
the actual solved hands. The new adapter preserves their palettes and existing
outdoor/home/atelier/observatory membership. Motion is transient and separately
owned per resident, simulation and scene generation. Pause and reduced motion
retain their intended behavior. No new quests, reward or resident intelligence.

## Exact verification boundaries

| Source | Evidence | Actual result |
|---|---|---|
| `166550d516b6127d831bfef0e96e145fa9a819ae` | Complete REMOTE_SOURCE02 | 224 commands; 151 syntax modules; 160 Node files, 2,256 passed, 0 failed, 2 skipped; Python 490 run, 8 skipped, no failures |
| Same source | Earned journeys within Source02 | Both continuous ten-chapter variants and all five Briar continuations passed |
| Same source | Native03 | 65 checks, one failed; also a negative rendered close-up; not visual acceptance |
| `d8d07ad8d34afc1371e13c39e0a685c2a4a61d94` | Clean remote STATION, REMOTE_TARGETED01 | 28 passed, 0 failed, 0 skipped across camera-clearance, resident-art and traveler-cloth files |
| Current runtime | Complete source / native recapture | Pending host memory admission; prior complete pass does not qualify the later seat repair |

Source02 ran `python -B tools/verify.py --rule-workers 4 --output <REMOTE_SOURCE02>
--cpu-temp C:/Users/Dom/AppData/Local/Temp` with original Node180/Python600 deadlines.
The small inherited CPU temporary-directory exception remains; game checkouts,
browser profiles, logs and media remain on D. Focused current command:
`node --test tests/camera-clearance.test.cjs tests/resident_art.test.cjs
tests/traveler_cloth.test.cjs`.

Current generated HTML pair: 3,415,558 bytes each; SHA256
`6e4bc861f4f55267f57a397fc442ff26a75af36d2cfb9a56fb8c03b664ce8afe`.
Source02's earlier pages were 3,415,279 bytes, SHA256
`41ac8100ae62daf7b29c41c3b7f4ebe314bcd02200cbb46e1c028664b74051ad`.
These are distinct epochs.

## Failures and repairs

- The first full source run had one failing existing homecoming host: it did not
  load the new resident module. Its loader was fixed without weakening assertions;
  focused homecoming passed21/21, then Source02 completed successfully.
- Independent source review rejected Mara's long closed hem; she retains the
  shared short jacket envelope. Actual thigh-triangle clipping rejected Oren's
  first apron. Raising its lower edge to local y=.87 passes120 gait phases in
  each motion setting. These checks do not establish full cloth simulation.
- Native01's bundled Chromium failed before game load with a launch timeout and
  network-service crashes. All six observed owned process IDs were subsequently
  absent; retain the separate closure audit. No unrelated process was stopped.
- Native02 refused memory admission before a browser launch.
- Native03 used installed Chrome155.0.8059.40, a fresh task-only D profile,
  1280x800 software WebGL2/Low. It established nonempty production saves, exact
  whole-browser cold store readback, and five ordinary movement combinations.
  The last Oren diorama pair correctly failed because he arrived home and became
  hidden between samples. Browser, driver and loopback server all closed.
- Native03 also exposed Mara's extreme close-up beside the west commons bench.
  Telemetry read before the screenshot showed7.5m; it was not the screenshot's
  exact frame. An actual WorldArt/Core/production-camera CPU probe then reproduced
  focus containment and the conservative .45m camera fallback.
- Current source reshapes all four commons seats to fit the existing .65m
  navigation reservations; back tops end at worldY2.46, below the2.8 camera focus
  even after .3m padding. Other benches retain original geometry. Enlarging Core
  obstacles was rejected because it would invalidate some existing saved positions.
  The regression first failed on actual mesh corners, then passed. It checks actual
  outgoing/homeward routes and both motion settings, readability in the affected
  corridor, and collision safety every frame. It is not global camera certification.
- Source03 refused launch at5,870,020KiB host free memory, below6,291,456KiB. No
  suite ran. The prepared Source04 and Native04 controllers remain unexecuted at
  this checkpoint unless a later receipt explicitly supersedes it.

## Resources, compatibility and remaining acceptance

World9/Adventure12 and every persistence owner remain unchanged. Exact Git-blob
comparisons retain Core, Adventure, Arsenal, Characters, Creative and
RealmGiversArt; generic person() is unchanged. This is bounded identity evidence,
not a substitute for all subsystem tests. No personal save was inspected.

Submitted family geometry changes from78 to146 instances and22,184 to25,948
triangles, with no new mesh type or dynamic batch. This is a CPU geometry budget,
not performance measurement. Neither software capture nor installed hardware
qualifies RTX performance or human comfort.

Retain Native03's partial7,729,084-byte movie locally as negative evidence; it is
not the final gameplay demonstration. Native04 is prepared to use real P pauses
during view/Follow selection and evidence writes, unchanged strict displacement
checks during unpaused RAF, a combined observation and screenshot-camera brackets.
It must run only after the same installed head passes complete source and fresh
host memory admission before each whole browser launch. Inspect actual new pixels,
decode a final short clip, then record success or repair the next actual failure.

The current full `--browser` gate separately still references SOURCE_EXPECTATIONS04;
preserve its historical pins and failures and review a new explicit epoch before
changing routing. Hosted run38466562932 could not start because GitHub reports an
account billing lock. No billing change was made; hosted jobs are not green.

ROOT and clean remote qualification STATION were reused, not freshly cloned.
No new full-game checkout, VM/Claude intervention, cleanup, main merge, public
deployment, paid provider or heartbeat resume. Goal remains active and production
unfinished. Pending human questions: are the three people recognizable, do their
walking/stopping and carried objects feel connected, and are both views comfortable?

Selected immutable receipts are under
`docs/evidence/village-resident-2026-10-13/checkpoint-d8d07ad/`.
Full local evidence: `D:/07-GAMES/Firstlight/artifacts/village-resident-articulation-20261013`.
