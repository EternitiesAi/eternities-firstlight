"""Original connected torso study. Factory-startup Blender, no rendering/GPU.

Authoring units are metres. Game axes X-right/Y-up/Z-forward map to Blender
X/-Y/Z. Export is baked position+smooth-normal triangles for Engine's stride6.
This prepares an asset; it does not install a new primitive in the game.
"""
import argparse
import sys
import bpy
import bmesh
import hashlib
import json
import math
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
DEST = args.output.resolve()
if not args.output.is_absolute() or DEST.exists():
    raise RuntimeError('Use a fresh absolute output directory; existing authoring is preserved')
DEST.mkdir(parents=True)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
# z, half-width, belly height, back height. Rump, ribcage, tucked waist and
# shoulder share rings; this is not a union of intersecting ellipsoids.
RINGS = [
    (-.91, .045, .75, .91),
    (-.79, .23, .56, 1.08),
    (-.56, .39, .48, 1.19),
    (-.28, .39, .475, 1.185),
    (-.04, .345, .52, 1.16),
    (.19, .31, .57, 1.17),
    (.38, .32, .585, 1.185),
    (.55, .22, .72, 1.145),
    (.66, .06, .88, 1.06),
]
SIDES = 12
vertices = []
for z, width, low, high in RINGS:
    for i in range(SIDES):
        a = i * math.tau / SIDES
        # A broad ribcage and gently flattened back, with a narrower underside.
        lower_taper = 1 - .13 * max(0, -math.sin(a))
        x = width * math.cos(a) * lower_taper
        y = (low + high) / 2 + (high-low) / 2 * math.sin(a)
        vertices.append((x, -z, y))
faces = []
for row in range(len(RINGS)-1):
    for i in range(SIDES):
        j = (i+1) % SIDES
        faces.append((row*SIDES+i, row*SIDES+j, (row+1)*SIDES+j, (row+1)*SIDES+i))
faces.extend([tuple(reversed(range(SIDES))), tuple((len(RINGS)-1)*SIDES+i for i in range(SIDES))])
mesh = bpy.data.meshes.new('Original grazer torso loft')
mesh.from_pydata(vertices, [], faces)
mesh.update()
bm = bmesh.new()
bm.from_mesh(mesh)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bm.to_mesh(mesh)
bm.free()
obj = bpy.data.objects.new('Moss grazer - connected torso study', mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
for p in mesh.polygons:
    p.use_smooth = True
mat = bpy.data.materials.new('Slate hide - existing palette')
mat.diffuse_color = (100/255, 121/255, 130/255, 1)
obj.data.materials.append(mat)
sub = obj.modifiers.new('One bounded surface pass', 'SUBSURF')
sub.subdivision_type = 'CATMULL_CLARK'
sub.levels = sub.render_levels = 1

depsgraph = bpy.context.evaluated_depsgraph_get()
evaluated = obj.evaluated_get(depsgraph)
surface = evaluated.to_mesh()
surface.calc_loop_triangles()
bm = bmesh.new()
bm.from_mesh(surface)
assert all(e.is_manifold for e in bm.edges), 'Closed two-face edges required'
bm.free()
raw = []
for triangle in surface.loop_triangles:
    for index in triangle.vertices:
        vertex = surface.vertices[index]
        x, y, z = vertex.co
        nx, ny, nz = vertex.normal
        raw.extend(round(float(v), 7) for v in (x, z, -y, nx, nz, -ny))
positions = [raw[i:i+3] for i in range(0, len(raw), 6)]
assert len(raw) % 18 == 0
assert len(raw) // 18 <= 1000, 'Bounded original torso budget'
assert all(-1.4 <= p[0] <= 1.4 and 0 <= p[1] <= 1.45 and abs(p[2]) <= 1.4 for p in positions)
report = dict(
    label='Original Blender connected torso authoring study, NOT integrated gameplay',
    blender=bpy.app.version_string,
    units='metres', gameAxes='X-right/Y-up/Z-forward',
    sourceRings=RINGS, sides=SIDES, subdivisions=1,
    baseVertices=len(mesh.vertices), evaluatedVertices=len(surface.vertices),
    triangles=len(raw)//18, stride=6, manifold=True,
    bounds=dict(min=[min(p[i] for p in positions) for i in range(3)],
                max=[max(p[i] for p in positions) for i in range(3)]),
    physics='Unchanged owner/path/collision; source asset only',
    rendererAllocated=False,
)
evaluated.to_mesh_clear()
asset = {'kind':'earth-grazer-body-v1','stride':6,'vertices':raw}
payload = json.dumps(asset, separators=(',', ':')) + '\n'
(DEST/'GRAZER_BODY.json').write_bytes(payload.encode('utf-8'))
report['jsonSha256'] = hashlib.sha256((DEST/'GRAZER_BODY.json').read_bytes()).hexdigest()
(DEST/'AUTHORING_REPORT.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
bpy.context.scene.render.engine = 'CYCLES'
bpy.context.scene.cycles.device = 'CPU'
bpy.context.scene.render.threads_mode = 'FIXED'
bpy.context.scene.render.threads = 1
for material in list(bpy.data.materials):
    if material.users == 0:
        bpy.data.materials.remove(material)
bpy.ops.wm.save_as_mainfile(filepath=str(DEST/'GRAZER_BODY.blend'), check_existing=False)
print('FIRSTLIGHT_BODY_REPORT '+json.dumps(report))
