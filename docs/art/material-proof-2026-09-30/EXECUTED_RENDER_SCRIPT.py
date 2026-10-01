"""Original Hearthwater material study. Run with Blender --background --python.

No network, add-ons, imported geometry, displacement, or gameplay writes.
Requires --factory-startup --background. Arguments after --: --source-root,
--output-root, --blend-root, --samples, --replace-proof (explicit authored rerender).
"""
import argparse
import hashlib
import json
import math
import sys
import time
from pathlib import Path

import bpy
from mathutils import Vector

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source-root', type=Path, default=Path('D:/07-GAMES/Firstlight/assets/sources/polyhaven'))
parser.add_argument('--output-root', type=Path, default=Path('D:/07-GAMES/Firstlight/renders/material-proof-2026-09-30'))
parser.add_argument('--blend-root', type=Path, default=Path('D:/07-GAMES/Firstlight/authoring/blender'))
parser.add_argument('--samples', type=int, default=48)
parser.add_argument('--replace-proof', action='store_true', help='Explicitly replace this author-owned proof output; never use on an edited scene.')
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
script_bytes = Path(__file__).read_bytes()
script_sha256 = hashlib.sha256(script_bytes).hexdigest()
if '--factory-startup' not in sys.argv or not any(flag in sys.argv for flag in ['--background', '-b']):
    raise RuntimeError('Use a separate Blender process with --factory-startup --background. Do not run inside a personal scene.')
if not 8 <= args.samples <= 128:
    raise ValueError('Use 8–128 samples for this bounded proof.')
blend_path = args.blend_root / 'HEARTHWATER_MATERIAL_PROOF.blend'
output_names = ['HEARTHWATER_DAYLIGHT.png', 'HEARTHWATER_EVENING.png',
                'MATERIAL_SWATCHES_DAYLIGHT.png', 'REPORT.json', 'EXECUTED_SCRIPT.py']
conflicts = [p for p in [blend_path, *[args.output_root / n for n in output_names]] if p.exists()]
if conflicts and not args.replace_proof:
    raise FileExistsError('Existing proof artifacts are preserved. Choose fresh directories or explicitly use --replace-proof for an author-owned rerender: '+', '.join(map(str, conflicts)))

SETS = [
    ('weathered_planks', 'WEATHERED TIMBER', 2.0, .24),
    ('rock_boulder_dry', 'PALE STONE', 1.8, .28),
    ('white_plaster_02', 'PLASTER', 1.0, .16),
    ('clay_roof_tiles_02', 'CLAY ROOF', 2.5, .32),
    ('brown_mud_02', 'WORKED GROUND', 1.3, .25),
]
inputs = []
for asset, label, repeat, strength in SETS:
    for suffix, fmt, space in [('diff', 'jpg', 'sRGB'), ('nor_gl', 'png', 'Non-Color'), ('rough', 'jpg', 'Non-Color')]:
        path = args.source_root / asset / f'{asset}_{suffix}_1k.{fmt}'
        if not path.is_file():
            raise FileNotFoundError(f'Missing approved source map: {path}')
        inputs.append({'asset': asset, 'map': suffix, 'path': str(path.resolve()), 'bytes': path.stat().st_size,
                       'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'color_space': space})
args.output_root.mkdir(parents=True, exist_ok=True)
args.blend_root.mkdir(parents=True, exist_ok=True)
started = time.perf_counter()
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for mat in list(bpy.data.materials):
    bpy.data.materials.remove(mat)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = args.samples
scene.cycles.use_denoising = True
scene.cycles.adaptive_threshold = .05
scene.render.threads_mode = 'FIXED'
scene.render.threads = 4
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'
scene.render.image_settings.color_depth = '8'
scene.render.film_transparent = False
scene.view_settings.view_transform = 'AgX'
scene.view_settings.exposure = 0
bpy.context.preferences.filepaths.save_version = 0

materials = {}
repeat_meters = {}
for asset, label, repeat, strength in SETS:
    mat = bpy.data.materials.new(label + ' | Poly Haven CC0')
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    shader = nodes.get('Principled BSDF')
    shader.inputs['Metallic'].default_value = 0
    for suffix, fmt, space in [('diff', 'jpg', 'sRGB'), ('nor_gl', 'png', 'Non-Color'), ('rough', 'jpg', 'Non-Color')]:
        img = bpy.data.images.load(str(args.source_root / asset / f'{asset}_{suffix}_1k.{fmt}'), check_existing=True)
        img.colorspace_settings.name = space
        node = nodes.new('ShaderNodeTexImage')
        node.name = suffix
        node.label = suffix + ' | ' + space
        node.image = img
        node.extension = 'REPEAT'
        node.interpolation = 'Linear'
        node.location = (-560, {'diff': 250, 'nor_gl': -180, 'rough': 50}[suffix])
        if suffix == 'diff':
            links.new(node.outputs['Color'], shader.inputs['Base Color'])
        elif suffix == 'rough':
            links.new(node.outputs['Color'], shader.inputs['Roughness'])
        else:
            normal = nodes.new('ShaderNodeNormalMap')
            normal.space = 'TANGENT'
            normal.inputs['Strength'].default_value = strength
            normal.location = (-250, -180)
            links.new(node.outputs['Color'], normal.inputs['Color'])
            links.new(normal.outputs['Normal'], shader.inputs['Normal'])
    mat['asset_id'] = asset
    mat['source_page'] = 'https://polyhaven.com/a/' + asset
    mat['texture_repeat_meters'] = repeat
    mat['normal_strength'] = strength
    mat['displacement'] = 'None: normal mapping only'
    materials[asset] = mat
    repeat_meters[mat.name] = repeat

def plain(name, color, roughness=.7, metallic=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    return mat

wood, stone, plaster, roof, ground = [materials[s[0]] for s in SETS]
iron = plain('Authored dark iron', (.055, .065, .067), .42, .8)
water = plain('Authored muted channel water', (.10, .23, .27), .22)
clay = plain('Authored unglazed crockery', (.36, .15, .07), .82)
green = plain('Authored garden leaves', (.09, .19, .055), .9)
board = plain('Study plinth charcoal', (.035, .044, .044), .9)
letter = plain('Study lettering ivory', (.72, .69, .57), .9)
backdrop = plain('Studio ground', (.12, .15, .15), .92)

def finish(obj, mat, bevel=0):
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new('Small worked edge', 'BEVEL')
        mod.width = bevel
        mod.segments = 2
    return obj

def box(name, p, size, mat, bevel=.015):
    # Physical local dimensions, not scaled UVs: tangent normal mapping stays coherent.
    x, y, z = [s / 2 for s in size]
    verts = [(-x,-y,-z), (x,-y,-z), (x,y,-z), (-x,y,-z),
             (-x,-y,z), (x,-y,z), (x,y,z), (-x,y,z)]
    faces = [(0,3,2,1), (4,5,6,7), (0,1,5,4), (1,2,6,5), (2,3,7,6), (3,0,4,7)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    uv = mesh.uv_layers.new(name='UVMap')
    repeat = repeat_meters.get(mat.name, 1)
    for face in mesh.polygons:
        axis = max(range(3), key=lambda a: abs(face.normal[a]))
        a, b = ((0,1) if axis == 2 else (0,2) if axis == 1 else (1,2))
        for li in face.loop_indices:
            co = mesh.vertices[mesh.loops[li].vertex_index].co
            uv.data[li].uv = (co[a] / repeat, co[b] / repeat)
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    obj.location = p
    return finish(obj, mat, bevel)

def beam(name, a, b, width=.15, depth=None, mat=wood):
    delta = Vector(b) - Vector(a)
    obj = box(name, (Vector(a)+Vector(b))/2, (width, depth or width, delta.length), mat, min(.018, width*.12))
    obj.rotation_mode = 'QUATERNION'
    obj.rotation_quaternion = delta.to_track_quat('Z', 'Y')
    return obj

def mesh_surface(name, verts, faces, uvs, mat):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    uv = mesh.uv_layers.new(name='UVMap')
    for face in mesh.polygons:
        for li in face.loop_indices:
            uv.data[li].uv = uvs[mesh.loops[li].vertex_index]
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    return finish(obj, mat)

def text(body, p, size=.16, rotation=(math.pi/2, 0, 0), mat=letter):
    data = bpy.data.curves.new(body, 'FONT')
    data.body = body
    data.align_x = 'CENTER'
    data.size = size
    data.extrude = .0005
    obj = bpy.data.objects.new(body, data)
    scene.collection.objects.link(obj)
    obj.location, obj.rotation_euler = p, rotation
    obj.data.materials.append(mat)
    return obj

# Modest original corner: an entrance, one window, courses, beam joints and roof field.
box('Earth study base', (-.6, 1, -.19), (8, 6.4, .32), ground, .09)
box('Studio floor', (0, 0, -.38), (200, 200, .12), backdrop, 0)
for row in range(3):
    for j in range(6):
        x = -2.65 + j*.66 + (.08 if row%2 else 0)
        box('Front riverstone course', (x, -.04, .13+row*.23), (.62, .35, .22), stone, .04)
    for j in range(4):
        box('Side riverstone course', (1.03, .36+j*.72, .13+row*.23), (.35, .69, .22), stone, .04)
box('Left plaster infill', (-2.43, .04, 1.77), (1.10, .18, 2.05), plaster)
box('Right plaster infill', (.18, .04, 1.77), (1.50, .18, 2.05), plaster)
box('Side low plaster', (1, 1.5, 1.15), (.18, 3, .8), plaster)
box('Side upper plaster', (1, 1.5, 2.62), (.18, 3, .48), plaster)
box('Side front plaster', (1, .40, 1.97), (.18, .8, .82), plaster)
box('Side rear plaster', (1, 2.46, 1.97), (.18, 1.08, .82), plaster)
for x,y in [(-3,0),(-1.83,0),(-.64,0),(1,0),(1,3)]:
    beam('Main oak upright', (x,y,.69), (x,y,2.92), .18)
beam('Front wall plate', (-3.08,-.08,2.91), (1.08,-.08,2.91), .21)
beam('Side wall plate', (1.06,-.05,2.91), (1.06,3.08,2.91), .21)
beam('Front working brace', (-2.98,-.11,2.24), (-2.30,-.11,2.86), .12)
beam('Side working brace', (1.11,2.24,2.87), (1.11,2.95,2.22), .12)
box('Stone threshold', (-1.24,-.21,.19), (1.27,.70,.18), stone, .05)
for j in range(6):
    beam('Closed worked door board', (-1.70+j*.185,-.10,.33), (-1.70+j*.185,-.10,2.40), .174, .065)
for z in [.58,2.10]:
    beam('Door cross batten', (-1.72,-.155,z), (-.76,-.155,z), .09, .08)
box('Iron door latch', (-.92,-.20,1.20), (.045,.055,.19), iron, .01)
box('Window recess', (1.02,1.35,1.97), (.10,1.03,.79), iron)
for y in [.87,1.85]:
    beam('Window vertical frame', (1.15,y,1.54), (1.15,y,2.39), .08)
for z in [1.56,2.37]:
    beam('Window sill and lintel', (1.15,.83,z), (1.15,1.89,z), .10)
beam('Window mullion', (1.16,1.35,1.60), (1.16,1.35,2.35), .045)
beam('Window crosspiece', (1.16,.89,1.98), (1.16,1.82,1.98), .045)
gable = [(-3,0,2.95),(1,0,2.95),(-1,0,4.14)]
mesh_surface('Front plaster gable', gable, [(0,1,2)], [(x/1,z/1) for x,y,z in gable], plaster)
for a,b in [(gable[0],gable[2]),(gable[1],gable[2])]:
    beam('Gable verge timber', (a[0],-.10,a[2]), (b[0],-.10,b[2]), .16)
beam('Gable king post', (-1,-.13,2.94), (-1,-.13,4.14), .15)
for side,x in [('left',-3.35),('right',1.35)]:
    verts = [(x,-.35,2.93),(x,3.35,2.93),(-1,3.35,4.29),(-1,-.35,4.29)]
    slope = math.hypot(x+1,1.36)
    face = (3,2,1,0) if side == 'left' else (0,1,2,3)
    obj = mesh_surface('Clay roof '+side, verts, [face], [(0,0),(3.7/2.5,0),(3.7/2.5,slope/2.5),(0,slope/2.5)], roof)
    mod = obj.modifiers.new('Roof thickness, no displacement', 'SOLIDIFY')
    mod.thickness = .09
    beam('Worked eave fascia', (x,-.39,2.88), (x,3.39,2.88), .17)
beam('Roof ridge timber', (-1,-.43,4.24), (-1,3.43,4.24), .18)

# A compact waterwheel identifies the working mill without a larger asset pipeline.
cx,cy,cz,radius = 2.04,1.71,1.30,1.05
for x in [cx-.28,cx+.28]:
    for i in range(16):
        a,b = i*math.tau/16,(i+1)*math.tau/16
        beam('Wheel rim segment', (x,cy+math.cos(a)*radius,cz+math.sin(a)*radius), (x,cy+math.cos(b)*radius,cz+math.sin(b)*radius), .13)
    for i in range(8):
        a = i*math.tau/8
        beam('Wheel radial spoke', (x,cy,cz), (x,cy+math.cos(a)*.94,cz+math.sin(a)*.94), .095)
for i in range(16):
    a = i*math.tau/16
    beam('Wheel paddle', (cx-.35,cy+math.cos(a)*1.10,cz+math.sin(a)*1.10), (cx+.35,cy+math.cos(a)*1.10,cz+math.sin(a)*1.10), .22, .075)
beam('Iron wheel axle', (1.05,cy,cz), (2.50,cy,cz), .15, mat=iron)
box('Shallow worked channel water', (2.13,2.15,.02), (.95,3.8,.06), water, .03)
for x in [1.53,2.71]:
    for j in range(5):
        box('Channel bank stone', (x,.45+j*.8,.10), (.28,.74,.28), stone, .045)
beam('Public bench seat', (-3.12,-.75,.62), (-1.95,-.75,.62), .26, .10)
for x in [-2.98,-2.10]:
    beam('Bench foot', (x,-.75,.12), (x,-.75,.57), .11)
box('Mill flower box', (1.28,1.36,1.49), (.34,.92,.20), wood, .02)
for i in range(5):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=.16, location=(1.30,1.01+i*.17,1.67))
    finish(bpy.context.object, green)

# Readable 1.2 x 1.1 m swatch faces; all five use the same light.
for i,(asset,label,repeat,strength) in enumerate(SETS):
    x = -3.6 + i*1.8
    box('Swatch plinth '+asset, (x,-3.06,.16), (1.58,.42,.38), board, .03)
    box('Physical material face '+asset, (x,-3.05,.91), (1.20,.12,1.10), materials[asset], .035)
    text(label, (x,-3.285,.15), .115)
    text('1K / '+str(repeat)+' m / N '+str(strength), (x,-3.285,.045), .075)
titles = [text('HEARTHWATER / MATERIAL PROOF', (0,-3.28,1.75), .22),
          text('Original geometry / CC0 maps / no displacement', (0,-3.28,1.51), .12)]

def camera(name, p, target, scale):
    data = bpy.data.cameras.new(name)
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = p
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
    data.type = 'ORTHO'
    data.ortho_scale = scale
    data.lens = 50
    return obj

hero = camera('House corner camera', (10,-13,9), (-.35,.20,1.45), 12.5)
swatches = camera('Front swatch camera', (0,-13,4.1), (0,-3.1,.86), 9.7)

def light(name, kind, p, energy, color, target=None, size=5):
    data = bpy.data.lights.new(name, kind)
    data.energy, data.color = energy, color
    if kind == 'AREA': data.shape, data.size = 'DISK', size
    if kind == 'SUN': data.angle = math.radians(9)
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = p
    if target is not None: obj.rotation_euler = (Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
    return obj

sun = light('Sun', 'SUN', (-6,-5,8), 2.4, (1,.87,.72), (0,0,0))
fill = light('Soft sky fill', 'AREA', (2,-3,8), 550, (.68,.81,1), (0,1,1), 7)
lamp = light('Occupied doorway lamp', 'AREA', (-1.22,-.9,2.6), 0, (1,.39,.14), (-1.22,-.1,1.4), 1)
world = bpy.data.worlds.new('Authored sky: no HDRI')
world.use_nodes = True
scene.world = world
bg = world.node_tree.nodes.get('Background')

def daylight():
    sun.data.energy, sun.data.color = 2.4, (1,.87,.72)
    sun.location = (-6,-5,8)
    sun.rotation_euler = (Vector((0,0,0))-sun.location).to_track_quat('-Z','Y').to_euler()
    fill.data.energy, fill.data.color = 550, (.68,.81,1)
    lamp.data.energy = 0
    bg.inputs['Color'].default_value = (.43,.57,.72,1)
    bg.inputs['Strength'].default_value = .34

def evening():
    sun.data.energy, sun.data.color = 1.7, (1,.53,.27)
    sun.location = (-7,-5,3)
    sun.rotation_euler = (Vector((0,0,0))-sun.location).to_track_quat('-Z','Y').to_euler()
    fill.data.energy, fill.data.color = 260, (.49,.65,1)
    lamp.data.energy = 75
    bg.inputs['Color'].default_value = (.21,.29,.46,1)
    bg.inputs['Strength'].default_value = .20

renders = []
def render(name, cam, width, height):
    for title in titles:
        title.hide_render = cam == hero
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y = width, height
    scene.render.filepath = str(args.output_root / (name+'.png'))
    began = time.perf_counter()
    bpy.ops.render.render(write_still=True)
    path = Path(scene.render.filepath)
    renders.append({'file': str(path.resolve()), 'dimensions': [width,height], 'seconds': round(time.perf_counter()-began,3),
                    'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    print('PROOF_RENDER '+json.dumps(renders[-1]), flush=True)

daylight()
render('HEARTHWATER_DAYLIGHT', hero, 1400, 1000)
evening()
render('HEARTHWATER_EVENING', hero, 1400, 1000)
daylight()
render('MATERIAL_SWATCHES_DAYLIGHT', swatches, 1600, 600)
scene.camera = hero
for title in titles:
    title.hide_render = True
scene.render.resolution_x, scene.render.resolution_y = 1400, 1000
scene.render.filepath = str(args.output_root / 'HEARTHWATER_DAYLIGHT.png')

image_receipts = []
for image in bpy.data.images:
    if image.source == 'FILE' and image.users:
        image.pack()
        image_receipts.append({'name': image.name, 'dimensions': list(image.size),
                               'color_space': image.colorspace_settings.name, 'packed': bool(image.packed_file),
                               'packed_bytes': image.packed_file.size if image.packed_file else 0})
report = {
    'proof_id': 'firstlight-hearthwater-material-proof-v1',
    'status': 'Authored material proof, not browser integration or production approval',
    'blender_version': bpy.app.version_string, 'blender_build_hash': bpy.app.build_hash.decode(),
    'render_backend': scene.render.engine, 'device': scene.cycles.device, 'cpu_threads': scene.render.threads,
    'samples_max': args.samples, 'adaptive_threshold': scene.cycles.adaptive_threshold, 'denoising': scene.cycles.use_denoising,
    'color_management': {'view_transform': scene.view_settings.view_transform, 'look': scene.view_settings.look,
                         'exposure': scene.view_settings.exposure},
    'units': 'meters', 'swatch_face_dimensions_meters': [1.2, 1.1],
    'source_root': str(args.source_root.resolve()), 'geometry': 'Original script-authored; no imported meshes',
    'mesh_objects': sum(o.type=='MESH' for o in scene.objects), 'text_objects': sum(o.type=='FONT' for o in scene.objects),
    'displacement': False, 'external_hdris': False, 'materials': [
        {'asset_id': a, 'label': l, 'repeat_meters': r, 'normal_strength': n,
         'source_page': 'https://polyhaven.com/a/'+a, 'license': 'CC0'} for a,l,r,n in SETS],
    'inputs': inputs, 'packed_images': image_receipts, 'renders': renders,
    'limits': ['CPU study timings are not gameplay performance benchmarks.',
               'No collision, animation, game export, browser material support or production asset approval.',
               'Pale stone source is a boulder surface applied to authored riverstone forms.',
               'White Plaster 02 current metadata dimensions are 1 m; its legacy scale text says 1.5 m.',
               'Roof tile orientation and material scale require human art-direction review.'],
}
note = bpy.data.texts.new('MATERIAL_PROOF_README')
note.write(json.dumps(report, indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
report['blend'] = {'file': str(blend_path.resolve()), 'bytes': blend_path.stat().st_size,
                   'sha256': hashlib.sha256(blend_path.read_bytes()).hexdigest()}
executed_script = args.output_root / 'EXECUTED_SCRIPT.py'
executed_script.write_bytes(script_bytes)
report['script'] = {'file': str(Path(__file__).resolve()), 'sha256': script_sha256,
                    'executed_copy': str(executed_script.resolve()), 'hash_captured': 'Before scene mutation and rendering'}
report['total_seconds'] = round(time.perf_counter()-started,3)
(args.output_root / 'REPORT.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
print('PROOF_COMPLETE '+json.dumps({'blend':report['blend'], 'total_seconds':report['total_seconds']}), flush=True)
