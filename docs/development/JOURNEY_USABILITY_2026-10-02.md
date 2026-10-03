# Saved work you can find again

The Journal previously showed campaign, homestead and starter work without the five realm trails or their separately accepted survey runs. Free return and reload retained the records, but the primary work screen did not show them. This slice adds a saved-work board to Journal, status to the five Roads cards and local map, and walking links to the map's currently available dry trail actions.

Base: `25d932057bc91305a5c16c3291432a2351e7dfbf` (PR36 baseline). Isolated branch: `agent/journey-usability-20261002`, checkout `D:/07-GAMES/Firstlight/authoring/journey-usability`. Root assigned four UI/style files, two new focused tests and this note under Dom's seven-hour production-development authorization. Root owns final build artifacts, verifier/CI registration, full regression, hardware evidence and integration.

## Player promise and contract

The player can return home, reopen their character, press **J**, and see what they accepted, what they can do next, who pays, and whether the fee remains unpaid. A trail and a local survey in the same realm remain different jobs, with different givers, progress and fees. The board reads the current character's saved world each time; it does not capture a previous simulation or create an escort actor.

The direction reference is the existing `REALM_OUTINGS_2026-10-02.md` at the base above, SHA256 `81af9b53e63f912b01bda74bf169af52470e59e159ca6dc86dfd17e0855c58fd`. Its five stable trails, optional work, exact rewards, atomic persistence and one finite fitting control this slice. Current `AGENTS.md` at that base is `d02e13b34581e120b070b37ba9e8203f93531ba449f5cbca23792f0e545435c9`. No direction, reward, save schema, XP curve, class, soul, equipment, craft or migration owner changes.

This is a desktop browser/keyboard flow with a narrow 390px layout check. It retains both third-person and diorama. Touch hardware, controller input, localization, assistive technology, human route comprehension and enjoyment remain unqualified.

Trace map version 1, `FL-JOURNEY-USABILITY-20261002`, revision 1:

| Requirement | Source binding and screen/state path | Observable check |
| --- | --- | --- |
| REQ1: Find retained accepted work | Existing trail/survey retention contract above; J Journal → empty/active/ready/claimed board → existing Roads reading | Native home reload retains partial and unpaid Coastward work and the separate survey; reading changes no state |
| REQ2: Understand the next action and giver | Stable catalogue steps, prerequisites and fees at base; Journal and Roads cards → eligible required actions or ready giver | All five pure projections distinguish unaccepted/active/ready/claimed; optional and prerequisite-locked steps cannot inflate required progress |
| REQ3: Follow a physical route | Existing dry/water/escort ownership above; local M map → dry walking route → E deliberate action | All four Coastward actions are reached and recorded through production walking/UI; underwater and escort markers give their actual controls rather than an impossible dry walk |
| REQ4: See when a fee can be claimed | Existing once-only trail and accepted-run claim contracts above; local reading → complete required trail/run → actual giver → existing claim | Incomplete trail and survey omit premature turn-in; ready trail's existing claim pays the exact declared fee and retains the separate survey |
| REQ5: Keep character and input ownership | Existing independent-character and modal-input rules in AGENTS at the bound base; text field → native create/switch → current Journal; V → both views | Name typing consumes J; a second native character has empty work; switching back restores the earned board; actual V exercises both projections |

Empty work points to a deliberate road reading/acceptance flow. Partial and ready work survive reload. Full capacity or a refused save leaves the existing unpaid record authoritative; this UI does not hide that ready state or replace the rule refusal. Routes do not accept, record, claim, fit or cross. Completed trails are grouped under **Completed trails · claimed once**. Active survey runs stay in the unfinished board even when that realm's trail was paid. Workshop copy distinguishes a locked lesson, an unlocked lesson with full cost/current balances, and an already fitted weapon.

## Changes

- `src/realm-trails-ui.js`: pure saved-work projections; Journal board; Roads/local status; current-state route checks; prerequisite-aware route visibility; ready-only trail claim visibility.
- `src/rpg-ui.js`: one Journal insertion, preserving the earlier starter and chapter presentation below it.
- `src/world-foundations-ui.js`: map actions and dry/wet/escort guidance; road statuses; ready-only survey turn-in; the Road marker action now walks to the current realm's actual return marker rather than always using home coordinates. Unrelated rooms and active diving refuse that walk. No automatic crossing occurs.
- `src/world-foundations.css`: existing-paper style board/cards and compact single-column layout.

The two new tests are `tests/journey_usability.test.cjs` and `tests/journey_usability_browser.py`. Node tests use explicitly synthetic boundary records/placements with production initial-kit commands. Their complete records also pass the canonical save validator. Browser work is earned from a fresh isolated profile through production commands, supported accelerated walking, real map buttons, explicit interactions and the existing explicit claim; it contains no position, inventory or claim edits.

## Performed verification

`node --test tests/journey_usability.test.cjs`: **15 passed, 0 failed, 0 skipped**. Three edited JS modules pass `node --check`; Python test compilation and `git diff --check` pass.

Local `python build.py` produced identical `index.html` and `FIRSTLIGHT_VALLEY.html`, **2,435,488 bytes**, SHA256 `fe7bc7c56e90a188dd4694ca3f307cebc27e8471ad8b2747fc9f6f8828a0861e`. These generated files are intentionally uncommitted in this worker checkout; Root regenerates the integrated build.

The focused software Chromium run uses the existing verified Playwright environment at `C:/dev/firstlight-artifacts/bootstrap-2026-09-12/browser-env/Scripts/python.exe`, with SwiftShader and a disposable profile/loopback origin. `tests/journey_usability_browser.py` passes **90 named checks**, with **0 browser/runtime errors**. Its exact-build report and three actual UI screenshots are in `evidence10/journey-usability-browser/` on D:. Native reloads retain accepted partial, ready-unpaid and claimed work; native create/switch keeps each character's separate board. Screenshots were inspected at 1280×800 and 390×844. The compact board has no horizontal overflow and its navigation buttons retain at least 34px height. Long boards and completed detail still use ordinary Journal scrolling.

Three failed harness receipts remain beside the final report: `FAILURE_01_WRONG_SURVEY_GIVER.json` (the first test wrongly assumed Vessa also gives Merren's survey), `FAILURE_02_ASYNC_CHARACTER_BARRIER.json` (character creation was not awaited), and `FAILURE_03_CSP_WAIT_EXPRESSION.json` (a string wait expression used unsafe eval under the restored character's existing CSP). The corrected harness resolves the giver from canonical data, awaits native identity, and uses function predicates. No game safeguard or acceptance condition was weakened.

Only this focused software gate was run by this worker. This is no full integrated regression, clean remote-clone result, independent review, normal-time gameplay footage, hardware performance measurement, accessibility certification or human play verdict. No main merge, deployment, provider/billing action or personal-save/profile access occurred.

## Integration handoff

Cherry-pick the worker source/tests/note commit into Root's owned integration branch. The automatic Node test glob picks up the 15 new cases. Register `journey_usability_browser.py` and its `evidence10/journey-usability-browser/REPORT.json` in the portable verifier and isolated CI browser matrix. Then regenerate the integrated identical HTML and run Root's required complete gates. The worker's HTML hash binds this UI slice on the old base; Root's Coastward support/bank and other workers' changes will produce a different integrated hash. Human judgment remains pending.
