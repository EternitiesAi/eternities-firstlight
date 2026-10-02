# Frozen world persistence and recovery review

Reviewed Root `aeec64232804dc6325fb11fd8ac5ed39f7893d26` in `D:/07-GAMES/Firstlight/authoring/bridge-moment` on 2026-10-02. Independent bounded read-only review by the Heaven/Hell worker; no source, repository test, or documentation changes.

**No concrete save-loss, duplicate payout, mistaken consent, or permanently blocked work defect found within this scope.** This conclusion is bounded to the inspected callers and fixtures, rather than inferred from a broad suite pass.

The source paths that support the conclusion are:

- `src/world-foundations.js:18-34`: only an omitted old optional journeys field migrates to fresh records. Present malformed/future versions, missing/foreign realm records, discontinuous runs, wrong opening/survey kind, duplicate/unknown objectives, and foreign local defeats are refused. Run/counter/claim bounds and `active.run === lastClaim + 1` prevent invented gaps in payout history.
- `src/world-foundations.js:53-64`: single-use travel consent is bound to the actual simulation, active character, library revision, room and position. Persistence must succeed before changing the scene. The prior runtime graph is isolated before scene sync and restored by identity on failure, along with the prior room, path, home and trip. Existing realm-to-realm travel keeps the original valid valley checkpoint.
- `src/world-foundations.js:68-90`, `src/app.js:13-14`, `src/characters.js:54-75`: accept, observation and claim use a complete validated candidate. One Store write persists journey history, balances, revision and journal together before applying the live result. Quota/refusal leaves the current run and currency intact. Claim replay is fenced by the monotonic paid run independently of a request ID. Ore/coin capacity refusal retains completed unpaid work; XP uses the existing explicit 9999 ceiling.
- `src/core.js:82-92`, `src/app.js:12,98,127-134`, `src/characters.js:85-112`: snapshots substitute the saved outdoor checkpoint for transient realm/depth coordinates. A character switch saves the complete outgoing world and selection in one transaction before creating the replacement simulation. Each character keeps its own journeys; old travel tickets fail against a new simulation or revision.
- `src/world-foundations-ui.js:14-26,31,37-39,42`, `src/rpg-ui.js:69-77`, `src/app.js:12,180`, `src/adventure.js:103,141`: crossing and local work have separate explicit actions. Return is free and not gated by local foes or completed work. The fallen modal's production revive leaves the transient trip and returns to the spring while retaining accepted work and belongings. Targeted keyboard Escape may clear combat intent/open the existing expedition menu before the app return branch; the persistent Return to Firstlight action remains the direct free-return path.

Read the relevant rule tests in `tests/world_foundations.test.cjs`, `tests/characters.test.cjs`, `tests/world_combat.test.cjs`, plus the source of `tests/world_foundations_journey.cjs` and the relevant world browser assertions. The journey/browser scripts were not executed in this review.

Ran this focused selection, with **9 passed, 0 failed**, reported Node duration 291.4373 ms:

```text
node --test --test-name-pattern='new schema|save refusal|claim fences|failure after scene sync|switching saves|quota failures|stale UI|falls in' tests/world_foundations.test.cjs tests/characters.test.cjs tests/world_combat.test.cjs
```

The two selected fall cases use the command-earned blade/Hell and bow/Earth fixtures, ordinary production enemy hits, movement and accelerated ticks; they do not grant HP, gear or a defeat. They are domain evidence, not normal-time media or human feel measurements.

Also ran `node D:/07-GAMES/Firstlight/artifacts/world-foundations-night-2026-10-02/final-source-review/review_probes.cjs`: **6 bounded probe groups passed**. Actual production Core/Store/world functions used isolated in-memory storage and the labelled initial-kit fixture SHA-256 `d5dae74922159450b291054999ca6f1bc0600e26f1bca566d05b2815db2c457c`. Direct boundary positioning was explicitly used here; this is not a walking proof. The probes check live state remains unchanged inside every candidate write, five quota refusals plus five successful work writes, exact Earth `+28 XP/+12 coins/+2 ore`, three claim replays including cold reload, complete preservation projection, partial-work character switching, two stale travel-ticket cases, cross-realm post-sync rollback with the original runtime object, foreign-source refusal, and seven malformed history refusals. Details are in `PROBES.json`.

Limits: no browser, hardware/GPU, native localStorage/Web Locks, abrupt process termination, renderer/audio failure injection, or full suite was run. Actual app DOM event dispatch was read, not executed. Legacy Earth/Cosmos travel internals were consulted only for return/checkpoint compatibility and are not comprehensively re-audited here. Combat local-defeat/death changes follow the existing autosave/explicit-save lifecycle; this review does not claim unsaved transient changes survive abrupt shutdown. Numeric history/revision caps and browser storage capacity remain explicit refusal boundaries. This review does not certify all consumers, human pacing, whole-video behavior, or deployment.
