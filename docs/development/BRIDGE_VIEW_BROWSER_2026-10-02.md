# Coastward bridge-view browser qualification — 2026-10-02

The extended `tests/bridge_browser.py` passed **181/181** checks on its first
actual integrated run: all **138 original Hearthwater checks** and **43 new
Coastward checks**, zero failures/browser errors/external requests, native exit 0.
Original rail, optical/framebuffer, returning-save, camera-memory and ordinary-RAF
checks remain in the same suite. No harness adjustment or product change was
needed during qualification.

Exact product source: `52a872e6d8c279f73f06b31951f4eae4f2efc258`. Isolated
qualification branch test head: `ee2360b30bece94553139e525d22e46e18a13026`,
whose only additions over that product head were this test extension and note.
Generated HTML: 2,503,814 bytes, SHA-256
`b39255cb47b3ac03e38c52a85f49c647b4a4c39c5eb120a837835286d721389c`.
Executed harness SHA-256:
`ffd2872e8dec2532c866e92dec623f25e791ff549bbfa7699e0e63501ffbfa70`.

New Coastward setup restores the unassigned command-earned Chapter I example
`examples/CHAPTER_COMPLETED_EARNED.json`, SHA-256
`27cb70f57c3584f7de69f667544c8215c6fbc5f7f3d45d7fb7bc241f1cabce49`.
It uses actual Roads travel, physical route commands, native map/reading clicks
and the exact production bridge-view callback for otherwise inaccessible
refusal probes. Accepted setup paths use labelled accelerated rule ticks;
the later Coastward stride uses only the ordinary visible app RAF. New cases
never edit positions, HP, inventory, quest flags, bond or class choice.

The native graphics controls establish low quality and a nondefault 67-degree
perspective FOV. Both camera actions must keep their preset/FOV, submit finite
camera data, use the reviewed side framing, close their deliberate menu pause,
retain physical position and preserve genuine earlier progression/items.
V must interchange remembered styles and R must reset the current style.
The subsequent ordinary bridge path must still move and animate the traveler.
The actual ordinary-RAF receipt contains 12 visible, unpaused samples with Z
moving from 54.68 to 52.60032 and changing submitted gait, followed by arrival
at the requested supported Z47. Both actual Coastward screenshots were inspected:
real timber deck/rails, traveler and Briar render in the two retained camera
styles. Their scale, rail treatment and software image are engineering evidence;
they are not founder camera taste or human legibility/comfort approval.

Refusals use actual home, arrival/far-bank and Atlantis visitor-gallery states.
Far-bank Z14 is supported land outside the Coastward channel-bridge's Z17..93
extent; the overlapping far bank at Z23 is not mislabeled off-bridge. Wet state
comes from explicit native Tide Steps entry. Before/after callback comparisons
share one JavaScript turn so unrelated camera smoothing cannot masquerade as a
caller mutation. Position evidence always uses actual live diagnostics.

Optional `--output` selects a fresh evidence directory, preserving earlier
receipts. The report records its actual harness hash, generated HTML hash,
fixture provenance, cameras, ordinary stride and runtime/external-request
failures. New Coastward requests are limited to the isolated loopback origin.

Actual command from the qualification clone:

```powershell
& 'C:/dev/firstlight-artifacts/bootstrap-2026-09-12/browser-env/Scripts/python.exe' tests/bridge_browser.py --output 'D:/07-GAMES/Firstlight/authoring/journey-qualification/evidence10/bridge-view-browser/ATTEMPT_01_AT_52A872E'
```

The complete report and screenshots are preserved in that output directory;
full stdout is the adjacent `ATTEMPT_01_AT_52A872E_STDOUT.txt`.
`REPORT.json` SHA-256:
`46f542526be23ddf687bd01ed572dfc8d71dd8d7046cfcf906f8dfe46602c647`.
No red result occurred in this run. Earlier bridge and other worker receipts
were not overwritten or recounted as these 181 checks.

Only the browser-test extension and this dated note are owned by this worker.
Root owns product/UI/helper integration and full/hardware qualification. Python
syntax and scoped diff checks also passed. The suite uses software SwiftShader,
not a hardware/GPU benchmark. No full suite, paid service, personal save, main
merge, deployment, extra worker or preview restart occurred. No blanket release,
device performance, accessibility or human gameplay qualification is implied.
