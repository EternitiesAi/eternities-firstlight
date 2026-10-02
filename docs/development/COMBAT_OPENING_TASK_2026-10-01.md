# Read the fight, then use the opening

Dom continued development after approving the bridge's appearance: "bridge looks
gorgeous". This is visual direction, not a new combat/comfort playtest. His future
vision is a true open world with this bridge crossing a massive body of water.
Preserve that ambition; this task does not expand supported geography or claim
that the open world or swimming exists.

Base: PR30, `de3ffb654cd1661d49b6d26ebcd866c09f1b2310`, fetched and clean.
Branch: `gameplay/combat-opening-readability`, stacked on
`gameplay/bridge-traveler-readability`. The current task records prioritize a
useful local outing after the bridge refinements.

Observed gap: Reedback's real 1.1-second windup and 1.6-second recovery are absent
from the selected-target text. Old Bristle and the Hushbound Keeper have separate
UI overrides which also replace HP/readiness. Existing earned blade/bow/veteran
survey tactics inspect runtime windup directly. The player deserves a readable
projection of that same state, without having to read the automation's code.

Promise: one quiet target cue explaining the actual warning, charge or recovery,
with a countdown only for a real positive timed phase. Keep HP/player readiness
visible. Distinguish Bell inner/outer safe directions and a beacon-targeted strike
from a player-targeted one. A recovery opening never means guaranteed reach,
line of sight, stamina or successful damage. Do not invent a progress bar duration.

Ownership: `combat.js` exposes transient selected-foe phase status; `rpg-ui.js`
projects it, `rpg.css` styles it. Remove only the duplicate combat-state writes
from Starter/Crossing UI; keep their quest, practice and rank functions. Adventure,
Crossing and Beacon remain the sole AI/damage owners. No new quest, reward,
equipment, input command, sound, camera effect, mesh, texture or render pass.
World/key9, adventure10 and nested versions remain; no save migration.

Verify synthetic owner/boundary cases, a fresh command-earned survey journey for
blade/bow/veteran, visible UI at both cameras and narrow width, a normal-time
actual RTX recording, the current full verifier and a clean remote clone.
Keep automation, sampled rendered evidence and human feel separate. D holds
heavy artifacts. Preserve personal saves and stable preview guards. No automatic
main merge, public deployment, paid provider, billing change or preview bypass.
