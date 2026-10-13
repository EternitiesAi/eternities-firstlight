# Readable cameras at building edges

Base: PR73, `cf636d211b765aaa59767099d22616fd1faef714`.
Branch: `gameplay/building-camera-clearance-20261013`.

The retained third-person Briar rest image is a real visual failure: the wall
sweep pulls the eye almost into the player's face. The existing camera browser
test explicitly accepts this short distance. Canonical house geometry reproduces
1.21m clearance at the doorway with the default elevation, falling to 0.45m along
a still-walkable edge. Pitch-only probes clear the doorway only near 80 degrees
and do not clear its closest supported strip, so this is not the selected fix.

Use a transient nearest clear orbit when the desired boom would become unreadable.
Retain a clear side through small movements and restore the requested orbit when
there is enough clearance. Every interpolated angle must be swept again. A fully
enclosed focus keeps the inherited 0.45m minimum-distance fallback; this does not
establish nonpenetration when the focus already lies inside a solid. The actual
perspective movement basis follows the displayed yaw.
The first deliberate drag starts from that displayed yaw. Automatic correction
does not rewrite saved yaw, elevation, distance, FOV or game state.

Ownership: renderer resolves geometry; App owns transient displayed camera and
input conversion. Core movement, combat, saves and art collision envelopes stay
unchanged. Orthographic cameras stay unchanged. Reduced motion uses immediate
resolution. No new save field, schema, content payout or asset pipeline.

Acceptance: canonical wall/dynamic/enclosed cases, actual App smoothing and
preference preservation, supported unframed approaches, real orbit/WASD input,
both views, entry/exit, screenshots and no browser errors. Existing source and
relevant camera/cutaway checks remain required. Automated pictures are not human
comfort, AAA quality or GPU performance approval.

Reuse ROOT and STATION on D. Fresh 6 GiB host-only admission before a complete
source gate or each browser launch. Preserve VM/Claude/personal-save exclusions,
all old failures and the blocked deletion. No merge or deployment.
