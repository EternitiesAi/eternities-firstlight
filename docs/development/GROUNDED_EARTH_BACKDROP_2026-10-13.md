# Ground the Hearthwater woodland backdrop

Authoring starts at PR78 delivery `88b30bf6e717707def6a81fc544435ca6097d02e`
on `gameplay/grounded-earth-backdrop-20261013`. The reused remote qualification
checkout stays frozen at that base while its complete source/browser gate runs.

The actual quarry screenshot shows decorative trees standing in the water-like
background. The source gives all thirty trunks a base of -0.3, outside every
Hearthwater land patch. The water plane is 0.01; the separately rendered hill
masses are much farther away. A renderer-mesh contact regression reproduces the
problem: the first trunk at (-27,-48) has no ground intersection.

Move those same thirty ornamental trees onto visible upper vertices of the
existing hill meshes. Derive root anchors from actual rendered geometry, keeping
the existing hills, random sequence, all foreground objects, walkable patches,
route/picking/camera authority, both cameras and save state unchanged. Keep the
tree primitive count and materials bounded. Distant woods remain scenery, not
a newly playable forest. This is a visual coherence fix, not a claim of open-world
streaming, final terrain detail or AAA performance.

Acceptance: every root contacts an actual above-water hill triangle; no new
movement/picking/camera volume or state mutation; unchanged legacy geometry
except the declared tree transforms; actual quarry screenshots in diorama and
third person; current build and relevant checks with exact pushed evidence.
The full baseline browser gate must not be interrupted or relabelled as this
later art revision's qualification. No extra recording or full checkout needed.

## Native check prepared while the baseline gate owns the browser

`tools/earth_backdrop_browser.py` is a bounded standalone qualification caller.
It earns Oren's kit and enters Hearthwater through visible controls, walks the
supported route with accepted accelerated ticks, and selects both cameras with V.
Four controlled screenshots inspect arrival and a native right-drag view. A wheel
input widens the diorama view. No body/equipment/quest fixture is injected.

For each frame a synchronous comparison hides only the120 tagged tree pieces,
then restores them. It records main-framebuffer changed pixels, exact restored
pixels, tree origins, camera/projection, state/collision equality and GL errors.
The default diorama need not show the distant horizon; the report retains that
view's actual count, including zero. At least one sampled view must show real
tree pixels, and all controls must restore exactly. Visual inspection remains
required to judge the placement. Ordinary RAF is disabled for these controlled
frames; this is not normal-time gameplay, persistence or GPU performance proof.

The Python AST and embedded JavaScript parse successfully. **This new caller has
not run in Chromium yet.** The unchanged53-suite baseline gate at88b30bf still
owns serial native execution: all230 source commands, masterwork, Earth homecoming
(6,205 checks/30 stages) and onboarding have passed; consignment is running.
Wait for its terminal receipt and inspect the result before starting this caller.
Do not stop it, switch its STATION, or claim its source as this art head.

Run the new caller from the clean exact remote art checkout through the existing
admission wrapper, with fresh D paths and the established browser environment:

```powershell
python -B tools/browser_budget.py --root $FirstlightRoot `
  --output $FreshBudgetOutput --temp-dir D:/07-GAMES/Firstlight/cache/browser-temp `
  -- tools/earth_backdrop_browser.py --output $FreshFrameOutput
```

Retain a failed attempt if any, inspect both camera images, and repair a demonstrated
defect before rerunning. No additional movie or complete game copy is needed.


## Implemented; visible acceptance pending

The rendered round mesh supplies a deterministic upper-shoulder vertex ring.
Candidate roots stay above water and outside every other mass's enclosing box;
spacing keeps crowns separated. Trunk and all three crown layers share each
new origin. Hills, caps, materials, tree sizes/counts and the old field RNG are
unchanged. This does not own navigation, camera obstacles or state.

The original root-contact test failed with “Tree -27,-48 has no rendered ground.”
The repaired contact, attached crowns, authority/picking and unchanged-geometry
checks pass24/24. Two previous literal scene-hash checks initially failed because
of the intentional relocation. Their original PR33 hash remains unchanged:
a separate test helper reconstructs only the120 declared tree positions and
removes their two provenance tags. Every other attribute/primitive still matches
that historical hash. The independent renderer-triangle test owns the new root
positions; the normalization cannot qualify them. All original failures remain
under the existing D next-gate BACKDROP_* evidence paths.

Build:3,448,051 bytes in both HTML files, SHA256
`e026f3821e11d678e612affe992e0520e26fd0a6e0402b4ad6bd0a245b342a2b`.
No save/schema/module-catalogue change or new asset. Native pixels and complete
new-head qualification remain pending behind the live exclusive browser gate
at the prior PR78 source. Do not label this as delivered or human-approved art.
