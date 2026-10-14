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
