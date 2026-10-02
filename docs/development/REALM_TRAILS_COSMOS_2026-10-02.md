# Two Stations, One Honest Bearing

This bounded, provisional commission adds one deeply frozen pure catalogue entry, `cosmos-split-bearing-v1`. It uses existing Near Expanse ground and the existing Teren at Three Lamps. It does not add terrain, move canon places, grant travel, write saves, pay rewards or implement a UI. Root owns the visible adjustable frames, numeric setting validation, physical proximity, claim persistence and integration.

## Authored comparisons

The west station is `west-sight` at X -14, Z -28, foot Y 4.343333333333334. The east station is `east-sight` at X 14, Z -28, at the same actual floor height. Both are dry. The existing sky-image centre in `src/cosmos-art.js` is X -52, Z -110; the existing 24-part observatory arch has its crown axis at X 3, Z -49. The catalogue names these targets “fixed sky image” and “observatory crown”.

For each station, form the two horizontal yaw angles with `atan2(target.x - station.x, target.z - station.z)`. The comparator target is the absolute wrapped difference, `abs(atan2(sin(a - b), cos(a - b))) * 180 / PI`. The resulting west value is 63.85469061425735 and east value is 11.183849541231728 scale degrees. Each instrument has minimum 0, maximum 90, tolerance 2 and initial setting 45. The initial setting is outside both acceptance bands. These are horizontal comparisons of authored image geometry, not apparent pixel angles, celestial distance estimates, physical astronomy or a reachable sky road.

Both station steps are available independently. `service-arm`, at X -1, Z -43, foot Y 4.77 on the existing observatory apron, requires both accepted readings. It is outside the main solid instrument at X 3, Z -47. Returning to Teren at X 3, Z 7 allows the declared once-only reward of 25 XP, 10 coins and 2 ore. This commission does not create a second weapon fitting bonus; the shared finite fitting retains its own cost and identity rules.

## Source attribution and deliberate limits

Recovered sources are design documents under `C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/cosmos-design-2026-09-14/`, read without running archive code:

- `design/01_WORLD_AND_CIVILIZATION.md`, definitions of Bearing and Sky image (lines 42–50), and CO01 Near Expanse (lines 118–130): local bearings can be useful while sky-image origin and navigation remain uncertain; Three Lamps supports practical work on grounded approaches.
- `design/02_FIRST_PROTOTYPE.md`, Teren and Anik (lines 26–32), Chart Court comparison (lines 89–91), and bounded Parallax Fitting proposal (lines 137–145): supports local navigation work and practical instruments. This commission is not the whole prototype or its fitting implementation.
- `design/06_QUEST_AND_EVENT_ATLAS.md`, CT01 (lines 8–11), CT21 (lines 118–121), and ME07 (lines 246–247): motivates a station-dependent relationship with an accessible untimed comparison. The School of Three Horizons remains its proposed province; it is not relocated to this opening. This is not completion of CT01, CT21 or a scheduled Night of Two Bearings event.

The new title, step IDs, local comparator commission, dialogue, readings and fee are provisional implementation terms. Existing Three Lamps, Teren, Near Expanse and observatory anchors retain their source identity. No followers, trading, online authority, allegiance, class entitlement, Luna claim or completed cosmology is introduced.

## Geometry and acceptance

The explicit reference circuit uses the northern side of Farroad refuge, then the west road, Common Landing, east station and observatory apron before returning on the east road. It has 22 supported production `RealmCosmos.segment` legs and 3,505 radius-safe samples at intervals no greater than 0.05 world units. Its measured XZ length is 173.77652619462182 world units; this is not a human duration estimate. The apparent straight shortcut from (-6, 10) to (-14, 0) crosses the refuge wall and is rejected. The central ridge also rejects a direct crossing between the stations.

Focused checks in `tests/realm_trails_cosmos.test.cjs` validate finite schema, immutable nested data, prerequisite topology, exact fees and readings, actual submitted sky-image/arch geometry through a deterministic CPU writer, dry floor heights, radius clearance, complete circuit geometry and authority-free browser data loading. They do not validate rendered frame readability, slider/input ownership, command persistence, native storage, hardware performance or human enjoyment.

Root integration acceptance remains: two visibly adjustable world frames and a legible textual equivalent; physical station proximity and dry body medium; strict finite numeric setting ranges; rejected wrong settings with no cost or history change; tolerance acceptance; accepted settings retained through a valid save; service arm unavailable until both accepted readings; one capacity-checked atomic payment; duplicates/reload/character switching cannot pay again; both cameras, old Cosmos visits and all existing outings retain their owners. The source catalogue does not claim those runtime checks passed.

## Bounded verification

Base: `56d4c25b389d6f93941f32aafc0469a14e89cf32`. Both `node --check src/realm-trails-cosmos.js` and `node --check tests/realm_trails_cosmos.test.cjs` passed. `node --test tests/realm_trails_cosmos.test.cjs` passed all seven tests with zero failures or skips. `git diff --check` passed. No builds, browser/GPU tasks, full gate, personal save or shared runtime edit was run for this catalogue handoff.
