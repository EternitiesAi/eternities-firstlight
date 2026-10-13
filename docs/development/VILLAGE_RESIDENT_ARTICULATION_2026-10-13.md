# Familiar people in the village

Base: PR75 delivery708411ebe85d9bca75b0e13964564174ec1b61cb.
Branch: gameplay/village-resident-articulation-20261013. Reuse ROOT/STATION on D.

Ilan, Mara and Oren already have authored roles, routes, conversations and shared
history. Their old figures use clock-driven legs and props positioned separately
from the hands. Give this existing family the traveler's articulated skeleton,
distance-driven walking, a gentle stop and deliberate carried objects. This is
presentation of current people, not new quests, personalities or simulation.

Ilan keeps the rust palette, brown hair and recognizable small string instrument.
He carries it quietly; no perpetual performance or implied audio playback. Mara
keeps teal clothing and pale hair, with a short split jacket and a supported
notebook that lowers during travel. Oren keeps ochre, a broader work silhouette,
short apron and compact folding rule. That new small prop is original provisional
art, not inventory or an upgraded project. Adult proportions stay near existing
heights; check actual door and label clearance. No paid or acquired assets.

Source ownership:

- `resident-art.js`: immutable appearance by the three canonical IDs, pure pose
  adapter, solved-hand prop attachment and submitted-geometry metadata. Reuse
  the existing rig/meshes/batches; omit player cloak and ground marker.
- `traveler-art.js`: optional validated hand targets for quiet carrying; absence
  preserves ordinary output. Combat, swimming, recording and fishing keep their
  existing priority. No NPC role branching in the shared skeleton.
- `world.js`: replace only the existing family caller; separate transient motion
  for each visible resident, fenced by simulation/state/actor/room generation.
  Use actual submitted positions and `sim.elapsed`, never render time or hour.
  Keep outdoor and home/atelier/observatory visibility/anchors and support heights.
- `app.js`: observation-only family snapshot through the existing test interface.
  Build registration includes the new module. Core and generic `person()` and
  RealmGiversArt remain unchanged.

Movement advances phase by actual distance. Stopping holds phase and eases blend
to a stance; carry height follows that same blend. Pause/repeated render freeze
the pose. A scene/identity replacement or long clock gap resets transient motion.
Hidden residents relinquish it. Reduced motion retains essential gait and grips
without bob, breathing, cloth sway or decorative gestures. No timers/callbacks.

World9/Adventure12, all keys, owners, XP, routes, story and creative work remain.
No migration. Rendering must preserve the entire world snapshot and Core runs,
including resident coordinates, progress and conversations.

Acceptance: actual family caller and all visibility branches; pure saved/runtime
owners; independent moving/settled/paused/reset lifetimes; finite connected limbs
and prop contact from submitted mesh matrices; original traveler and generic
actors unchanged. Target at most60 instances each /180 total, recording actual
triangles and batch cost without claiming measured performance. Native journey
uses real Settings clock controls and Core routes, then home entry, in both views.
Reapply the actual People Follow control after camera changes. Label accelerated
setup separately; observe ordinary movement over time. No NPC teleport injection.

Complete source gate, targeted browser/visual evidence, exact remote readback and
short bounded footage when useful. Human recognition/warmth and RTX performance
remain separate. Preserve failures. VM/Claude/personal profiles excluded; fresh
host6GiB admission before complete source/every browser, four workers and original
deadlines. No cleanup, full clone, billing action, merge, deploy or heartbeat resume.

Source review identified that a longer closed hem would intersect the forward
thigh at full stride. Retain the shared short hem instead; pale gathered hair
and the held notebook distinguish Mara without pretending a cloth simulation.
A real triangle-versus-apron test also exposed Oren's initial long apron at lifted-knee onset. Shorten its lower edge to local y=.87; 120 phases in each motion setting now clear both thigh meshes. Preserve RED_APRON01 and its successful repair receipt.
