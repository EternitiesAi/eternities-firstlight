# Starter and bridge playback evidence review, 2026-10-03

The recorded starter outings complete a coherent accept–collect–fight–return–claim–equip–practice loop. Their known-route automation is much shorter than a human 10–20 minute first session, which remains unmeasured. Both rewards change actual equipped damage, with part of the increase coming from earned XP. The bridge shows continuous supported walking and an explicit camera choice, but its side view has foreground post and approach-lamp occlusion.

This is a read-only review of three reports, their labelled source/final worlds and **18 actual PNGs**, using `view_image`. No browser, GPU run, FFmpeg invocation, new media or whole-video playback occurred. A compressed recording's complete decode, audio quality and human experience are outside this review. All three reports identify RTX 3080/D3D11 at 1280×900 Balanced, ordinary RAF, zero artificial ticks/position edits/manual damage/inventory grants during filming, no browser errors/external requests, and `human_acceptance:false`. These are report assertions, not a fresh run by this reviewer.

## Frozen evidence

All paths below are under `D:/07-GAMES/Firstlight/artifacts/world-production-2026-10-03/`.

| Capture | Offline HTML SHA256 | REPORT.json SHA256 |
| --- | --- | --- |
| `starter-blade-pilot-02` | `60a89cdf2e2747511f9d59f358923c93a96394dea5e5c4e0895838cc8b8eb16c` | `ec09227fd36bf592db9269a1e2fb21b9f22ad34f1cebbaddf66f072ebe2eeb8f` |
| `starter-bow-pilot-01` | Same **older 60a89** build | `536b643844c761abc5fbc31cb39202c8a0454421ad3323e709b8753229ad2b75` |
| `bridge-moment-rtx-01` | **Newer bridge b392:** `b39255cb47b3ac03e38c52a85f49c647b4a4c39c5eb120a837835286d721389c` | `15436596ea50778b5a6cc994291e9a4a3dfd022e0424c71fcbc18a102010daf8` |

The blade/bridge input is `sources/starter-blade-kit-earned.json`, SHA256 `ca9056936dfef03494162889915f63b241ba58fb67929e74c57995af4eb95eda`. The bow input is `sources/starter-bow-crafted-earned.json`, SHA256 `28a4a2db0e99f04d6a9ac316f126d2c63fc064c6b1c2ef0a93cb85ae779c0dff`. Both start at 0 XP with the starter quest unaccepted; the bow already exists through prior command-earned crafting. Neither pilot measures acquiring the initial kit or crafting that bow. Fixture setup is distinct from a native character-import/persistence qualification.

## Gameplay and reward matrix

| Aspect | Starter blade, older 60a89 | Starter bow, older 60a89 | Bridge, b392 / implication |
| --- | --- | --- | --- |
| Known-route clock | Explicit acceptance at 2.335s, claim at 33.520s: **31.185s**. Report run clock 46.131s. | Acceptance 2.373s, claim 36.812s: **34.440s**. Run clock 49.825s. | Two recorded 73m crossings take **22.836s / 22.830s**; run clock 128.433s includes repeated framing/routes. These are wall-clock event differences, not decoded clip durations or novice playtime. |
| Real encounters | West/east/Old Bristle: **0.752 / 0.664 / 2.914s**; one total Brace input, 11 windup samples; HP after each **100 / 100 / 101**. | **1.713 / 1.780 / 4.877s**; three Brace inputs, 39 windup samples; HP **96 / 96 / 80**. | No combat, XP or starter acceptance. Blade approaches 1m closer than bow, so these are not controlled weapon-DPS comparisons. |
| XP and money | **0→61 XP**, level **1→2**, coins **0→6**, ore **0→0**. | Same. | Unchanged **0 XP / 0 coins / 0 ore**, starter unaccepted. Source/final inventories match in all three cases. |
| Reward contribution | `trail_blade`→`oren_sunblade`; attack **16→22**, actual practice impact **22**. | `trail_bow`→`oren_reedbow`; attack **13→19**, actual practice impact **19**. | Each +6 combines **+4 weapon attack and +2 level attack**. This is not a gear-only +6. Existing weapons remain owned, and claim precedes a separate equip action. |
| Route / visible state | Arrival HUD names the supply task; Old Bristle defeat changes it to “Return to Oren and choose your reward.” | Same, then practice target reports “Last confirmed impact · 19 · no XP or loot.” | Bridge terms disclose free return, no allegiance/class/story choice and a separate framing button. Both camera modes and actual home return are recorded. |

The XP split follows `src/starter.js:11` and `:78`: skitters **8+8**, Old Bristle **20**, explicit claim **25**, totaling **61**. `src/adventure.js:47–48` supplies the level threshold/base-attack contribution. Final worlds retain all three defeated/drop IDs, with caches uncollected; the six sunmarks are the quest claim, not collected enemy loot. HP after Old Bristle includes the level-up heal, so it is not a direct measure of damage avoided.

The first two blade fights recorded no windup samples. The bow/Old Bristle reports demonstrate sampled real windup states and Brace inputs, not that every input blocked a hit. The reviewed stills are arrival/defeat/practice frames, not windup frames. Actual damage numbers and practice confirmation are visible. These pilots do **not** isolate moving-target misses, arrow-wall obstruction, recovery-only damage, perfect guarding or controller behavior; stationary autoattack is their actual combat route.

Root subsequently proposed fixed ordinary-skitter HP **32→40**, preserving damage, XP, Old Bristle and gear. That would require three initial blade hits or four initial bow hits. This is a separate, unqualified parameter candidate here. Compare actual cue/guard opportunity on the same physical routes; an extra attack cycle does not establish human session length. The ordinary skitters also remain avoidable: `Starter.complete` requires the three bundles and Old Bristle, not both ordinary defeats.

## Models and camera readability

Before-equipment arrival frames show the initial grey blade or wooden bow; after-equipment photo frames show river-green blade furniture or bow bindings. The reward is visibly different in the close third-person photos. Diorama preserves the overall weapon silhouette, with small bindings much harder to read and the exit sign partly covering the lower body. These are **not matched before/after model comparisons**: positions, facing and framing differ. The requested 4m reward portrait distance actually clamps to **1.4483m** near the exit props; the diorama uses half-width 5. These photos cannot establish default gameplay-scale readability.

The bow practice-impact frame's foreground target disk hides much of the held bow/arms even while its confirmed **19** and HUD remain readable. This is a visible composition limit, not evidence of a miss or failed projectile collision.

At bridge `(0,55)`, the explicit side view uses yaw `3π/2`, perspective elevation .14/distance 14.5 or diorama elevation .39/half-width 9. Deck timber, water-facing support and continuous walking are visible. The perspective rail aperture reveals the body, but an opaque post aligns with the lower legs. At `(0,19)`, the foreground lamp at `(-7,19)` hides most of the head/torso in third person; diorama remains more readable.

**Bounded recommendation sent to Root before changes:** opt only existing bridge posts and four approach-lamp assemblies into the existing main-view cutaway, preserving their geometry, colors, ground, collision and camera-solid policy. Their original `src/world-atlantis-earth.js:165–169` and `:188` decoration inherits `cutaway:false`. Root subsequently reports implementing the opt-in at `a69d6fdffad9821675e240d04f692f78e79d844b`, HTML `83d035fd7bda9359da0f80e08349fa52d2899eb2a23d73441f147400770900ed`. **That repair is not rendered or independently qualified by these b392 stills.** Its main/reflection, on/off, edge-focus and unchanged-physics checks belong to a separate receipt.

## Exact stills inspected

| Directory | PNG files directly viewed |
| --- | --- |
| `starter-blade-pilot-02` | `oren-explicit-terms-blade`, `riverbank-blade-arrival`, `river-old-bristle-actual-defeat`, `deliberate-blade-reward-review`, `deliberately-equipped-blade-reward`, `reward-blade-held-third`, `reward-blade-held-diorama` |
| `starter-bow-pilot-01` | `riverbank-bow-arrival`, `river-old-bristle-actual-defeat`, `deliberately-equipped-bow-reward`, `reward-bow-actual-practice-impact`, `reward-bow-held-third`, `reward-bow-held-diorama` |
| `bridge-moment-rtx-01` | `explicit-bridge-third-choice`, `supported-bridge-third-side`, `supported-bridge-diorama-side`, `normal-crossing-third-far-bank`, `normal-crossing-diorama-far-bank` |

All names have `.png` suffixes. No viewing or listening claim is made for the WebMs. UI timing, optional sound, sustained performance, final post-fix views and human 10–20 minute pacing require their own evidence.
