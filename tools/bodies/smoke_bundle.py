"""Smoke check for the Human Base Meshes bundle: list its objects and any licence text, then render one PNG.

Run with: blender -b <bundle.blend> --python tools/bodies/smoke_bundle.py -- <out.png>
Prints one SMOKE_JSON line; the render is written to <out.png> with Cycles on the CPU.
"""
import bpy
import json
import sys

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
out_png = argv[0] if argv else None

objects = []
for o in bpy.data.objects:
    entry = {'name': o.name, 'type': o.type, 'hidden': o.hide_viewport}
    if o.type == 'MESH':
        m = o.data
        entry['verts'] = len(m.vertices)
        entry['tris'] = sum(max(0, len(p.vertices) - 2) for p in m.polygons)
        entry['dims'] = [round(x, 4) for x in o.dimensions]
        entry['vertex_groups'] = len(o.vertex_groups)
        entry['modifiers'] = [md.type for md in o.modifiers]
    objects.append(entry)

licence = []
for t in bpy.data.texts:
    for line in t.as_string().splitlines():
        low = line.lower()
        if any(k in low for k in ('cc0', 'creative commons', 'licen', 'public domain')):
            licence.append([t.name, line.strip()[:200]])

summary = {
    'objects': objects,
    'texts': [t.name for t in bpy.data.texts],
    'licence_lines': licence[:20],
    'scene_camera': bpy.context.scene.camera.name if bpy.context.scene.camera else None,
}
print('SMOKE_JSON ' + json.dumps(summary, sort_keys=True))

if out_png:
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 32
    scene.render.resolution_x = 640
    scene.render.resolution_y = 640
    scene.render.filepath = out_png
    bpy.ops.render.render(write_still=True)
    print('SMOKE_RENDER ' + out_png)
