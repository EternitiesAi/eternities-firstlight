"""Bake the CC0 Human Base Meshes bundle into the traveler rig's part envelopes.

blender -b human_base_meshes_bundle.blend --python tools/bodies/bake_bodies.py -- \
    RIG_PARTS.json BODY_PARTS.json REPORT.json

RIG_PARTS.json comes from tools/bodies/export_rig_parts.cjs (the rig's rest parts and limb joints).
The stylized male body, head and hand are decimated (the feet stay the rig's boot boxes), the body is split along the rig's joints,
and every piece is fitted into its envelope in the rig's own axes (+X right, +Y up, +Z forward).
Outfit shells (coat, robe, wings) are generated in the same unit space. BODY_PARTS.json is the
committed source; tools/bake_bodies.cjs packs it into src/body-meshes.js without Blender.
"""
import bpy
import bmesh
import hashlib
import json
import math
import sys
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
RIG_PATH, OUT_PATH, REPORT_PATH = argv[0], argv[1], argv[2]
RIG = json.load(open(RIG_PATH))
PARTS = {p['name']: p for p in RIG['parts']}
HEAD_TOP = 1.745  # the rig's hair top; the body is scaled so its feet sit on y=0 and its crown here

SOURCE = {
    'body': 'GEO-body_male_stylized',
    'head': 'GEO-head_stylized',
    'hand': 'Hand - Stylized',
}
TARGET_TRIS = {'body': 1900, 'head': 600, 'hand': 90}


def find_object(name):
    obj = bpy.data.objects.get(name)
    if obj is None:
        matches = [o for o in bpy.data.objects if o.name.strip() == name.strip()]
        assert matches, 'missing source object ' + name
        obj = matches[0]
    return obj


def decimated(obj, target):
    """Blender's Decimate (collapse) on an evaluated copy, returned in object world space."""
    before = sum(max(0, len(p.vertices) - 2) for p in obj.data.polygons)
    ratio = min(1.0, target / max(1, before))
    copy = obj.copy()
    copy.data = obj.data.copy()
    bpy.context.scene.collection.objects.link(copy)
    mod = copy.modifiers.new('bake_decimate', 'DECIMATE')
    mod.decimate_type = 'COLLAPSE'
    mod.ratio = ratio
    mod.use_collapse_triangulate = True
    depsgraph = bpy.context.evaluated_depsgraph_get()
    depsgraph.update()
    mesh = bpy.data.meshes.new_from_object(copy.evaluated_get(depsgraph))
    mesh.transform(obj.matrix_world)
    mesh.calc_loop_triangles()
    verts = [Vector(v.co) for v in mesh.vertices]
    tris = [tuple(t.vertices) for t in mesh.loop_triangles]
    copy_data = copy.data
    bpy.context.scene.collection.objects.unlink(copy)
    bpy.data.objects.remove(copy, do_unlink=True)  # the object goes before its data in Blender 5
    bpy.data.meshes.remove(copy_data)
    bpy.data.meshes.remove(mesh)
    return verts, tris, before, len(tris)


def to_rig(v):
    """Blender (Z up, front -Y) to the rig (Y up, front +Z); a proper rotation."""
    return Vector((v.x, v.z, -v.y))


def joint(part, index):
    return Vector(PARTS[part]['joints'][index])


def limb_frame(a, b):
    """The traveler rig's limb basis: across = up x reference, forward = across x up."""
    up = (b - a).normalized()
    ref = Vector((0, 0, 1)) if abs(up.z) < 0.9 else Vector((1, 0, 0))
    across = up.cross(ref).normalized()
    forward = across.cross(up)
    return up, across, forward


def fit_box(points):
    lo = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    hi = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    c = (lo + hi) * 0.5
    size = Vector(tuple(max(s, 1e-6) for s in (hi - lo)))
    return lambda p: Vector(((p.x - c.x) / size.x, (p.y - c.y) / size.y, (p.z - c.z) / size.z))


def fit_limb(points, a, b):
    up, across, forward = limb_frame(a, b)
    c = (a + b) * 0.5
    length = (b - a).length
    ma = max(abs((p - c).dot(across)) for p in points) or 1.0
    mf = max(abs((p - c).dot(forward)) for p in points) or 1.0

    def f(p):
        d = p - c
        return Vector((0.5 * d.dot(across) / ma, d.dot(up) / length, 0.5 * d.dot(forward) / mf))
    return f


def seg_dist(p, a, b):
    ab = b - a
    t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.length_squared, 1e-9)))
    return (p - (a + ab * t)).length


def drop_slivers(points, tris, limit=0.6):
    """Faces whose longest edge spans more than the whole rig envelope are the spikes; keep the rest."""
    kept = []
    for a, b, c in tris:
        longest = max((points[a] - points[b]).length, (points[b] - points[c]).length, (points[c] - points[a]).length)
        if longest <= limit:
            kept.append((a, b, c))
    return kept


def mesh_out(kind, verts, tris, size=(1.0, 1.0, 1.0), source=''):
    """Unit-space triangles with smooth per-vertex normals from the final connectivity."""
    bm = bmesh.new()
    bverts = [bm.verts.new(tuple(v)) for v in verts]
    for a, b, c in tris:
        try:
            bm.faces.new((bverts[a], bverts[b], bverts[c]))
        except ValueError:
            pass  # a duplicate face from the decimation; the first copy stays
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    flat, index = [], []
    for v in bm.verts:
        flat.extend([round(v.co.x, 6), round(v.co.y, 6), round(v.co.z, 6),
                     round(v.normal.x, 6), round(v.normal.y, 6), round(v.normal.z, 6)])
    for f in bm.faces:
        if len(f.verts) != 3:
            continue
        index.extend([v.index for v in f.verts])
    bm.free()
    return {'kind': kind, 'vertices': flat, 'indices': index, 'size': [round(s, 6) for s in size],
            'triangles': len(index) // 3, 'source': source}


def shell(kind, profile, rings=20, segments=24, source='procedural'):
    """A closed bell shell: rings of ellipses from the shoulder (t=0) down to the hem (t=1)."""
    verts, tris = [], []
    rows = []
    for i in range(rings + 1):
        t = i / rings
        y, rx, rz = profile(t)
        row = []
        for j in range(segments):
            a = 2 * math.pi * j / segments
            row.append(len(verts))
            verts.append((rx * math.cos(a), y, rz * math.sin(a)))
        rows.append(row)
    for i in range(rings):
        for j in range(segments):
            a, b = rows[i][j], rows[i][(j + 1) % segments]
            c, d = rows[i + 1][(j + 1) % segments], rows[i + 1][j]
            tris.append((a, b, c))
            tris.append((a, c, d))
    top = rows[0]
    centre = len(verts)
    verts.append((0.0, profile(0)[0], 0.0))
    for j in range(segments):
        tris.append((centre, top[(j + 1) % segments], top[j]))
    return verts, tris


def normalise(verts):
    lo = Vector((min(v[0] for v in verts), min(v[1] for v in verts), min(v[2] for v in verts)))
    hi = Vector((max(v[0] for v in verts), max(v[1] for v in verts), max(v[2] for v in verts)))
    c = (lo + hi) * 0.5
    size = hi - lo
    unit = [((v[0] - c.x) / size.x, (v[1] - c.y) / size.y, (v[2] - c.z) / size.z) for v in verts]
    return unit, [size.x, size.y, size.z]


def wing(side):
    """A curved feather plane from the shoulder blade outward and up, two-sided by construction."""
    root = Vector((side * 0.05, 1.40, -0.18))
    tip = Vector((side * 0.46, 1.62, -0.34))
    span = (tip - root)
    n_span = 14
    verts, tris = [], []
    rows = []
    for i in range(n_span + 1):
        u = i / n_span
        width = 0.20 * (1.0 - u) ** 0.6 + 0.03
        base = root + span * u
        bend = Vector((0.0, 0.0, -0.05 * u * u))
        row = []
        for j in range(3):
            v = (j - 1) * 0.5
            row.append(len(verts))
            verts.append(tuple(base + Vector((0.0, v * width, 0.0)) + bend))
        rows.append(row)
    for i in range(n_span):
        for j in range(2):
            a, b = rows[i][j], rows[i][j + 1]
            c, d = rows[i + 1][j + 1], rows[i + 1][j]
            tris.append((a, b, c))
            tris.append((a, c, d))
    return verts, tris


def coat_profile(t):
    return (1.33 - 0.99 * t, 0.185 + 0.02 * t + 0.105 * t ** 2.2, 0.13 + 0.015 * t + 0.08 * t ** 2.2)


def robe_profile(t):
    return (1.36 - 1.33 * t, 0.19 + 0.03 * t + 0.17 * t ** 2.5, 0.13 + 0.02 * t + 0.13 * t ** 2.5)


def main():
    out = {'kind': 'human-bodies-v1', 'stride': 6, 'bundle': 'Human Base Meshes v1.4.1 (CC0 per the README in the file)',
           'blender': bpy.app.version_string, 'source_objects': SOURCE, 'kinds': {}}
    report = {'objects': {}, 'kinds': {}}

    # the body: decimated, moved to the rig's axes, scaled so the feet sit on y=0 and the crown on HEAD_TOP.
    body_obj = find_object(SOURCE['body'])
    bverts, btris, before, after = decimated(body_obj, TARGET_TRIS['body'])
    rig_pts = [to_rig(v) for v in bverts]
    ymin = min(p.y for p in rig_pts)
    ymax = max(p.y for p in rig_pts)
    xc = (min(p.x for p in rig_pts) + max(p.x for p in rig_pts)) * 0.5
    zc = (min(p.z for p in rig_pts) + max(p.z for p in rig_pts)) * 0.5
    s = HEAD_TOP / (ymax - ymin)
    body = [Vector(((p.x - xc) * s, (p.y - ymin) * s, (p.z - zc) * s)) for p in rig_pts]
    report['objects']['body'] = {'name': body_obj.name, 'tris_before': before, 'tris_after': after, 'scale': round(s, 6)}

    labels_seg = {
        'upper_arm': (joint('left-upper-arm', 0), joint('left-upper-arm', 1)),
        'forearm': (joint('left-forearm', 0), joint('left-forearm', 1)),
        'thigh': (joint('left-thigh', 0), joint('left-thigh', 1)),
        'shin': (joint('left-shin', 0), joint('left-shin', 1)),
        'torso': (Vector((0.0, 1.09, 0.0)), Vector((0.0, 1.42, 0.0))),
        'neck': (Vector((0.0, 1.42, 0.0)), Vector((0.0, 1.50, 0.0))),
    }
    hand_joint = joint('left-forearm', 1)

    def label(p):
        if p.y < 0.10 or p.y > 1.50 or (p - hand_joint).length < 0.11:
            return None  # feet, head and hands come from their own objects
        best, who = None, None
        for name, (a, b) in labels_seg.items():
            d = seg_dist(p, a, b)
            if best is None or d < best:
                best, who = d, name
        return who if best is not None and best < 0.30 else None

    faces_by = {}
    for tri in btris:
        pts = [body[i] for i in tri]
        c = (pts[0] + pts[1] + pts[2]) / 3.0
        who = label(c)
        # the left limbs stand for both sides (the rig mirrors them); torso and neck keep both halves.
        if who is None or (who in ('upper_arm', 'forearm', 'thigh', 'shin') and c.x > 0.0):
            continue
        # long slivers join the torso or neck to the shoulder or arm; they read as spikes, so drop them.
        if who in ('torso', 'neck'):
            longest = max((pts[i] - pts[(i + 1) % 3]).length for i in range(3))
            if longest > 0.18 or (who == 'neck' and any(abs(p.x) > 0.10 for p in pts)):
                continue
        faces_by.setdefault(who, []).append(tri)

    def pack(tris, source_pts):
        used = sorted({i for t in tris for i in t})
        remap = {old: new for new, old in enumerate(used)}
        verts = [source_pts[i] for i in used]
        return verts, [(remap[a], remap[b], remap[c]) for a, b, c in tris]

    for who, tris in sorted(faces_by.items()):
        verts, ftris = pack(tris, body)
        report['kinds'][who] = {'faces': len(ftris)}
        if who == 'torso':
            keep = [i for i, p in enumerate(verts) if abs(p.x) <= 0.20]
            ftris = [t for t in ftris if all(i in keep for i in t)]
            verts, ftris = pack(ftris, verts)
            fitted = fit_box(verts)
            upts = [fitted(p) for p in verts]
            ftris = drop_slivers(upts, ftris)
            out['kinds']['body-torso'] = mesh_out('body-torso', [tuple(u) for u in upts], ftris, source=SOURCE['body'])
        elif who == 'neck':
            fitted = fit_box(verts)
            upts = [fitted(p) for p in verts]
            ftris = drop_slivers(upts, ftris)
            out['kinds']['body-neck'] = mesh_out('body-neck', [tuple(u) for u in upts], ftris, source=SOURCE['body'])
        elif who in ('upper_arm', 'forearm', 'thigh', 'shin'):
            a, b = labels_seg[who]
            fitted = fit_limb(verts, a, b)
            kind = {'upper_arm': 'body-upper-arm', 'forearm': 'body-forearm', 'thigh': 'body-thigh', 'shin': 'body-shin'}[who]
            upts = [fitted(p) for p in verts]
            ftris = drop_slivers(upts, ftris)
            out['kinds'][kind] = mesh_out(kind, [tuple(u) for u in upts], ftris, source=SOURCE['body'])

    head_obj = find_object(SOURCE['head'])
    hv, ht, hb, ha = decimated(head_obj, TARGET_TRIS['head'])
    hp = [to_rig(v) for v in hv]
    fitted = fit_box(hp)
    out['kinds']['body-head'] = mesh_out('body-head', [tuple(fitted(p)) for p in hp], ht, source=SOURCE['head'])
    report['objects']['head'] = {'name': head_obj.name, 'tris_before': hb, 'tris_after': ha}

    hand_obj = find_object(SOURCE['hand'])
    nv, nt, nb, na = decimated(hand_obj, TARGET_TRIS['hand'])
    np_ = [to_rig(v) for v in nv]
    fitted = fit_box(np_)
    out['kinds']['body-hand'] = mesh_out('body-hand', [tuple(fitted(p)) for p in np_], nt, source=SOURCE['hand'])
    report['objects']['hand'] = {'name': hand_obj.name, 'tris_before': nb, 'tris_after': na}


    for kind, (verts, tris, size) in {
        'body-coat': (*shell('body-coat', coat_profile), None),
        'body-robe': (*shell('body-robe', robe_profile), None),
    }.items():
        unit, dims = normalise(verts)
        out['kinds'][kind] = mesh_out(kind, unit, tris, size=dims, source='procedural bell shell')
    for side, kind in ((-1, 'body-wing-left'), (1, 'body-wing-right')):
        verts, tris = wing(side)
        unit, dims = normalise(verts)
        out['kinds'][kind] = mesh_out(kind, unit, tris, size=dims, source='procedural feather plane')

    out['kinds'] = {k: out['kinds'][k] for k in sorted(out['kinds'])}
    body_tris = sum(out['kinds'][k]['triangles'] for k in ('body-head', 'body-neck', 'body-torso', 'body-upper-arm',
                                                             'body-forearm', 'body-thigh', 'body-shin', 'body-hand'))
    report['body_unique_triangles'] = body_tris
    text = json.dumps(out, sort_keys=True, separators=(',', ':'))
    with open(OUT_PATH, 'w', encoding='utf-8') as fh:
        fh.write(text + '\n')
    report['sha256'] = hashlib.sha256((text + '\n').encode('utf-8')).hexdigest()
    report['kind_triangles'] = {k: v['triangles'] for k, v in out['kinds'].items()}
    with open(REPORT_PATH, 'w', encoding='utf-8') as fh:
        json.dump(report, fh, indent=1, sort_keys=True)
    print('BAKE_OK', report['sha256'], 'body triangles', body_tris, flush=True)


main()
