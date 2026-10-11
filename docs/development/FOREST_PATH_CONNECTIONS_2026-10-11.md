# Keep a forest walk on supported ground

This milestone repairs a concrete navigation defect on a review branch stacked against PR62 at6408c2f639429b585ec6b7a15e373d1d493cad9c. It reuses the integrated checkout; the independent remote station remains frozen at56d during its existing full verifier.

## Problem and change

Core.pathfind validates the connection from an off-grid start to nearby grid node s. Graph reconstruction omitted s, and smoothing could consequently emit an untested first graph waypoint. From the retained successful Country15 position (-127.10833981377773,-52.586126232148075), a fresh current CPU request to the canonical root-reading objective (-148,-66) returned a first leg through the expanded west bridge rail. Actual Core advancement confirms the intersection.

Add exactly `rev.unshift(point(s.x,s.z));` before unchanged smoothing. The grid anchor is already supported and connected; subsequent graph legs and the final endpoint connector are already validated. Smoothing still removes redundant points where the longer connection is safe. No geography, radius, search budget, timer, scene/combat owner, renderer or camera changes.

## Evidence and scope

Two independently reviewed source leaves: src/core.js and tests/core_path_radius.test.cjs. All ten original test methods and assertions are the exact prefix; three regressions cover broad/fine searches at radii .31/.4, actual Core.advance at .0166/.05/.1, literal expanded-rail detection, exact known-safe paths across five scene/width cases and blocked endpoint refusal. Original RED:1pass/2fail. Candidate GREEN:13pass/0fail/0skip. Wrong-anchor mutant:0pass/2detecting failures. Parent-installed component:13pass/0fail/0skip in2819.2276ms. Real build: two identical3317150-byte pages, SHA2567244ad08cf03cdfffc67a3ebc1d6c601decbe8a0d3db6aa3544d7ca1dd07b00c.

Small source/raw receipts remain in D:/07-GAMES/Firstlight/staging/first-load-through-20261006/forest-route-repair01 and parent installed/build records in road-account-parent01. Candidate seal1d59f909a84cf58c7e97b919e6f16b55db02f70118ed3441d517d05cf4fe8b40 covers22payloads/117857bytes; parent verified every member and exact base leaves before installation. These are actual-module CPU checks with synthetic coordinates/intervals, not gameplay rendering or human acceptance.

Historical Country15 remains FAILED with UNKNOWN cause because its rejected audit and active path were not retained. A separate current shore-to-root route has safe complete legs and immediate Core frames while its sparse100ms observation chord can fail across a bridge turn. Neither finding recovers that historical run. Later actual ordinary-control observation must retain rejected raw facts before assertion and distinguish immediate movement from a sparse chord, keeping all real physical predicates and deadlines.

Complete current source, exact remote and actual forest/Choir UI qualification remain pending at this commit. Complete Source16 at56d and running remoteFull07 belong to that base only. Native garden launch/framing failures remain visible; no AAA, seamless open-world, measured FPS or human completion claim.

## Compatibility and next acceptance

World9 / Adventure12 / WildSigns1, browser keys, all personal saves, stored XP, history/claims/explicit choices, gear/sockets/upgrades, companion, housing/crafting/music and both cameras remain unchanged. No persistent fields or migration. Parent owns integration and actual native execution; two existing colleagues stage small source. No additional full game or movie/profile was allocated for this repair. No main merge, public deploy, paid provider, personal-save read, unrelated shutdown or blocked deletion retry. Goal ACTIVE unfinished; heartbeat PAUSED.

Next: original complete verifier at the final coherent head, ordinary physical Atlas forest walk, and the complete readable Choir combat/return. Ask Dom later whether the route was clear, the fights better and the deliberate reward useful.
