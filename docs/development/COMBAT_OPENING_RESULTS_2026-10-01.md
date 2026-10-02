# A readable warning and a useful opening

Dom approved the bridge appearance and envisioned a future open world with the
bridge crossing a massive body of water. Recorded as founder direction; the
current supported crossing is still bounded. No human combat/comfort playtest
was supplied in this continuation.

Base PR30/de3ffb654cd1661d49b6d26ebcd866c09f1b2310. Review branch
`gameplay/combat-opening-readability`; source5633cef5aaf1d25f4eecb5664acb4608c17fd806.
The PR/delivery receipt records the final pushed head and fresh remote proof.

The selected-foe panel now reads the real AI phase without erasing HP or player
readiness. Reedback's previously unlabelled1.1s marked strike and1.6s recovery are
visible. Bell rings retain correct inner/outer directions; Beacon attacks identify
ward versus player; live charges are untimed. Positive fractions round upward.
Brace copy reflects active defense, cost and cooldown. An opening says to strike
if ready and close if out of range; it never fabricates a hit. Pause/death/invalid
selection clear the cue, leaving simulation authority and timer freeze intact.

Only combat projection/UI/CSS and old competing UI writes changed. Narrow ward
position reads target size via ResizeObserver, with12px separation and existing
minimum top. No forced per-frame layout read, simulation/AI tuning, equipment,
reward, input, sound, camera effect, geometry, texture or render-pass change.
World/key9/adventure10/nested saves unchanged; no migration. Both cameras,
explicit targeting/stationary attacks, XP/history/sockets and all prior systems stay.

Clean exact-source `python tools/verify.py --browser`:58syntax,704Node passes,
53Python passes plus1existing Windows symlink-privilege skip,24earned journeys,
1744browser assertions across20suites (new combat cue62),0failures. Identical
HTML2,253,455bytes/hashf5d5405ceb4ea0e116c45eb18af3009bc94c91f378d36d5a6739de57e2b01088.
Earned Earth blade/bow/veteran reports retain5/5/3surveys and16→27/13→25/44→48
confirmed practice damage. Phase traces use real timers; an easy veteran defeat
does not invent recovery. UI covers actual phases for all three equipment cases.

Actual normal-time RTX footage28.52s713frames,29checkpoints,1280×720: both threats
and samples, one payout, explicit first blade fitting16→18. Silent25fps encoding;
no stepped simulation or grants. The source is a legitimately earned accepted
survey, not a personal save or a fresh-from-zero pacing measurement. Both views
show the real opening. Screenshot timer values may advance during PNG output.

Matched short real-GPU selected-survey samples:1920×1080DPR1,balanced,
RTX3080 ANGLE/D3D11,driver610.74,Chromium143.0.7499.4;360ordinary RAF intervals
per view/build. AfterP95≈16.8/max≈16.8ms,0>33.333ms. Sampled draw/geometry counts
match; no new GPU resource/pass. This is not monitor timing,sustainedFPS or fun.

Two read-only Sol6.1xhigh reviews: final source27focused checks, observer5/model12
probes; actual method100paints unchanged state. Visual review of supplied PNGs and
7extracted video frames finds separate HP/readiness/phase, both cameras and narrow
ward clearance; no full-video watching or mobile/human acceptance claim.
[Evidence and receipts](../evidence/combat-opening/README.md) contain exact scope.

Initial findings/failures retained: test fixture incorrectly assumed starter blade
uses stamina; corrected to legitimate labelled bow boundary. Paused browser helper
deliberately advances through pause, so freeze check uses actual Simulation.tick.
Veteran Briar changed enemyHP, so the test checks actual HP instead of fixed56.
Independent review reproduced390px ward overlap before the observer correction
and identified owner fallthrough before exclusive dispatch. Recording attempts
hit CSP string polling, hidden defeated-target clear and Escape opening More after
automatic target clear; final controller uses ordinary async polling and respects
automatic clear. Production CSP and controls were not weakened. Failed/superseded
media/receipt remain onD; final full verification/media are separately identified.

Human playtest remains: did the warning tell you what to do, could you use the
opening, and was the small text comfortable? Bridge appearance approval does not
answer these. Next concrete improvement: separately label equipment-project target
versus actual next recipe (longbow21 versus prerequisite Ashwood13/currentblade16),
plus review Oren's25XP preview boundary. No balance/XP change is implied.

Stable8780 still serves older Fenna bytes80acee... at the fresh read. Prior
automatic approval review rejected owned preview restart with only "blocked by
policy"; no retry or bypass. Hosted/final app-attachment status belongs in the PR
delivery record. No automatic main merge, deployment, paid provider/billing action
or personal-profile access.
