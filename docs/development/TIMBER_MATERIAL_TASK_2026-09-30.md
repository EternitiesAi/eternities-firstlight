# Timber in the playable mill

Started 2026-09-30 on `gameplay/timber-material-proof`, from PR22's reviewed
current head `f6e41b62addda91ba50a93cbca60e6aac009de18`. Origin and PR21/22
comments were checked; neither had new review comments. This branch is stacked
against `art/cc0-material-proof`, preserving the latest gameplay and authoring.

Prove one verified CC0 weathered-timber material on existing mill boards and
woodwork. Keep their exact transforms, triangle counts and navigation ownership.
Embed optimized 512px color/roughness maps in the identical standalone HTML;
no runtime download, normal-map claim, new renderer or GLB pipeline. The grain
is an artistic surface experiment, not new canon or founder acceptance.

The engine owns image decode and texture lifetime. Use a plain-color fallback
until both maps are valid, preserve untextured materials and scene transitions,
and stop stale uploads after disposal/context loss. Reflections, shadows,
cutaway, low quality, reduced motion and both cameras retain their behavior.
Report image bytes, decoded/mipmap texture allocation estimate, added batches,
unchanged geometry, and CPU decode/upload-submit timing separately from GPU
completion and sampled browser frame intervals.

Save versions remain world9/adventure10 and existing nested schemas. No save,
XP, choice, equipment, socket, class, companion, housing, crafting or music
changes. Personal profiles are unnecessary and untouched. The older live
preview stays at its original origin while isolated verification serves this
branch. Heavy artifacts and new worktrees stay under D:/07-GAMES/Firstlight.

Ownership: renderer worker owns engine.js and focused loader tests; asset
worker owns derivative preparation, maps/provenance and assembly; root owns
Earth surface selection, actual-browser regression, integration and delivery.
Use no more than the two authorized Sol6.1 xhigh workers.

Acceptance: actual decoded maps and visible grain in both cameras; controlled
fallback/error/context-loss checks; repeated Earth/valley rebuild without
texture reload; reflection/cutaway/low-mode integrity; current full verifier;
short real-time gameplay footage and labelled real-GPU comparison; a clean
remote clone reproducing the exact pushed source and browser checks. Return
one draft PR, exact head, limitations and pending human taste/camera questions.
Do not merge main, deploy publicly, change billing or imply human approval.
