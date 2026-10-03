# Existing realm work-giver silhouettes, 2026-10-03

Base: `68ba28e8020a7f23cd3d5ad1d2d0e5d5032de6f8`, on the clean isolated
`agent/realm-givers-art-20261003` branch. This slice owns only the new pure
`src/realm-givers-art.js`, its focused test and this note. Root owns source-list
integration and the replacement of the generic person draw in
`src/world-foundations-art.js`. No other person, protected resident, Cosmos
character or Neris escort belongs to this catalogue.

The current realm openings use the same generic person projection for distinct
work givers. These nine original silhouettes retain each current point's exact
ID, name, realm and anchor while making clothing and held tools distinguishable.
The work does not add dialogue, ancestry, classes, capabilities, biography,
quests, items, rewards, collision or save fields. Recognizability in actual full
frames still requires Root's rendered review; CPU geometry does not establish
human readability or camera feel.

## Source attribution and interpretation

The recovered sources are read-only recommendations under
`C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/realms/`; no archive script
was executed. Proposal names remain provisional where the design index marks
them so. Existing adopted local points are not evidence of a completed country
or campaign.

| Existing point | Source-backed role or visual direction | Original bounded interpretation | Instances |
| --- | --- | --- | ---: |
| Rielle, `heaven-rielle` | `heaven-design/design/HEAVEN_STORY_AND_EVENT_ATLAS.md:18–20`: bellwright; bone-white working layers, one ruby cuff | Apron, single right cuff, small held tuning mallet | 37 |
| Calen, `heaven-calen` | Same source, `:24–26`: travel-worn ivory cloak, gold fastening, modest folded wings, practical satchel | Short cloak panels, fastening, satchel, folded field map; two small folded wings with roots on the actual cloak back surface | 44 |
| Yselle, `heaven-yselle` | Same source, `:30–32`: gardener; sage under bone-white fabric and red tool cord | Sage coat, light apron, red cord, held hand cultivator | 38 |
| Istra, `hell-istra` | `hell-design-2026-09-14/design/HELL_STORY_AND_EVENT_ATLAS.md:22`: return keeper; Hell art production palette calls for coal, iron, ash and refuge amber | Ash mantle over charcoal clothing, hood, small warm return lantern | 40 |
| Tovan, `hell-tovan` | Same story source, `:24`: riveter; tactile iron/coal production direction | Broad work apron, iron fastenings, rivet hammer | 37 |
| Vessa, `vessa` | Original provisional Coastward bridge keeper in `src/world-atlantis-earth.js`; not a recovered manuscript character | Brown work coat, contrasting shoulder band, folding rule | 37 |
| Merren, `merren` | Original provisional Coastward field steward in the same runtime catalogue | Olive coat, linen apron, supported field register | 35 |
| Nereme, `nereme` | `atlantis-design-2026-09-14/design/02_FIRST_PROTOTYPE.md:26`: practical pilot; blue/teal/bronze/pearl art direction | Secure short teal coat, pearl collar, small held coil of pilot line | 42 |
| Sahra, `sahra` | Same prototype, `:28`: instrument-maker, distinct from current Earth makers; maintained tide-dial direction | Light work apron, bronze band, supported hand measuring frame and small dial | 42 |

Hell material direction comes from
`hell-design-2026-09-14/design/HELL_ART_AUDIO_PRODUCTION.md:8–36`. Atlantis
materials and secure clothing come from
`atlantis-design-2026-09-14/design/04_SYSTEMS_ART_AND_PRODUCTION.md`, its material
and clothing sections. The founder's
`docs/design/FIRSTLIGHT_REALM_CHARTER_2026-09-11.md` governs the broad Heaven,
Hell and Earth palettes and the protected resident boundary. These sources do
not specify this mesh, tool construction, physical dimensions, skin tones,
haircuts or exact clothing cuts; those are original prototype interpretations.
Calen's explicitly described folded wings are retained by Root's scope
amendment, with no flight or ancestry claim.

## Pure caller contract

The IIFE exports browser `RealmGiversArt` and CommonJS
`{profiles,parts,draw}`. `profiles` is a deeply frozen record keyed by the nine
existing point IDs. `parts(id,{time,reducedMotion,paused})` returns fresh local
box/round/octa geometry. It requires the existing `RealmEngine.M` API.

```js
const frame = RealmGiversArt.draw(out, point, {
  base: WorldFoundations.height(def.room, point.x, point.z),
  yaw: point.yaw ?? Math.PI,
  time: actualTime,
  reducedMotion: sim.state.settings.reducedMotion,
  paused: callerIsPaused,
  realm: def.id
});
```

`out.box`, `out.round` and `out.octa` must be extensible arrays. Unknown IDs,
non-person points, nonfinite anchors/base/yaw/time, an optional mismatched realm,
or invalid output arrays return zero instances without mutation. Every drawn
instance has an explicit finite matrix and is opted out of camera collision and
cutaway. The returned frame provides copied local joints, world tool grips and
instance count for inspection; it owns no physical actor or interaction state.

All soles meet the supplied support height. The bodies share the existing
stationary point yaw and stay within a conservative 0.65m radial envelope and
1.83m height. There are no new feet, terrain, obstructions or route changes.
Tools touch their real palm anchors. Optional breathing is a maximum 3mm upper
translation from caller time; legs and feet remain fixed. Pause and reduced
motion suppress it completely. No tool cycle, false working action or completed
quest presentation reads from arbitrary story flags. Both cameras receive the
same geometry and no camera parameters are changed.

## Focused CPU evidence and limits

Commands:

```text
node --test tests/realm_givers_art.test.cjs
node --check src/realm-givers-art.js
git diff --check
```

The test uses actual vertices from production `RealmEngine.geometry`, not
assumed nominal primitive dimensions: octa tips span ±0.65, while box/round
beam tips span ±0.5. It checks 162 profile/time/reduced-motion/yaw combinations,
finite transformed vertices, exact sole support, budget and radial/height bounds,
current patches and nearby authoritative solids, limb and tool endpoints, a
conservative component-support graph, tool/head clearance, Calen's real cloak
surface attachment and folded-wing clearance, distinct clothing/material/tool
profiles, stationary feet, idle limits, pause/reduced-motion and both-camera
invariance, pure inputs and refusal without partial output.

The first focused run was 6 passed/3 failed: large-world-coordinate Float32 join
precision, the same issue at a tool grip, and frozen output arrays throwing.
At Vessa's z=97, the measured maximum beam endpoint error was
`0.0000037775533957952196m`; one Float32 ULP there is
`0.00000762939453125m`. Join comparisons now use a documented 0.00001m tolerance;
floor support retains its tighter 0.000002m tolerance. Output preflight now
refuses sealed/frozen arrays. The next run was 8 passed/1 failed and exposed
Sahra's two unsupported dial/pointer components (`5 !== 7`); an actual crossbar
connects them to the held frame, and the graph is checked at two yaws.

The final focused result is **9 tests passed, 0 failed, 0 skipped**; module
syntax and the staged whitespace check also pass. The component graph uses
conservative transformed mesh AABBs; it
does not certify every surface contact or visible seam. Exact palm/shaft/wing
matrix joins supplement that check. No build, browser, GPU capture, full suite,
personal profile, gameplay or human-feel test is run by this worker. Root must
check normal third-person and diorama full frames at the actual 1.7m approach,
especially Calen's folded-wing silhouette, small hand tools and label overlap.
