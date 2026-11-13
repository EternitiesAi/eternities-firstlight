"""Bake the CC0 Human Base Meshes bundle into the traveler rig's part envelopes.

blender -b human_base_meshes_bundle.blend --python tools/bodies/bake_bodies.py -- \
    RIG_PARTS.json BODY_PARTS.json REPORT.json

RIG_PARTS.json comes from tools/bodies/export_rig_parts.cjs. The stylized male body is decimated and
split into parts per FACE: each face joins the segment it is nearest to, and also any neighbouring
segment within MARGIN, so seams overlap and close when a joint bends. The source has no bone weights,
so the nearest joint segment per face stands in for majority bone weight. Head and hands come from
their own objects. The coat and robe are offset shells of the baked torso and legs (arms excluded).
Wing feathers are a tapered curved plane. 'body-hidden' is an empty kind: legacy rig parts that a baked
figure must not draw are moved to it, which keeps the 49-part pin. Everything is in the rig's own axes
(+X right, +Y up, +Z forward); the body is scaled so the feet sit on y=0 and the crown on HEAD_TOP.
"""
import bpy
import bmesh
import hashlib
import json
import math
import random
import sys
from mathutils import Vector

random.seed(0)  # the bake uses no randomness; the seed pins any future use
argv = sys.argv[sys.argv.index('--') + 1:]
RIG_PATH, OUT_PATH, REPORT_PATH = argv[0], argv[1], argv[2]
RIG = json.load(open(RIG_PATH))
PARTS = {p['name']: p for p in RIG['parts']}
HEAD_TOP = 1.745
MARGIN = 0.012  # metres: a face this close to a second joint segment joins that part too
LIMBS = ('upper_arm', 'forearm', 'thigh', 'shin')
SOURCE = {'body': 'GEO-body_male_stylized', 'head': 'GEO-head_stylized', 'hand': 'Hand - Stylized'}
TARGET_TRIS = {'body': 2000, 'head': 600, 'hand': 90}


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
    """Faces whose longest edge spans more than the whole rig envelope are spikes; keep the rest."""
    kept = []
    for a, b, c in tris:
        longest = max((points[a] - points[b]).length, (points[b] - points[c]).length, (points[c] - points[a]).length)
        if longest <= limit:
            kept.append((a, b, c))
    return kept


def vertex_normals(points, tris):
    bm = bmesh.new()
    bv = [bm.verts.new(tuple(p)) for p in points]
    for a, b, c in tris:
        try:
            bm.faces.new((bv[a], bv[b], bv[c]))
        except ValueError:
            pass
    bm.normal_update()
    out = [Vector(v.normal) for v in bv]
    bm.free()
    return out


def normalise(verts):
    lo = Vector((min(v[0] for v in verts), min(v[1] for v in verts), min(v[2] for v in verts)))
    hi = Vector((max(v[0] for v in verts), max(v[1] for v in verts), max(v[2] for v in verts)))
    c = (lo + hi) * 0.5
    size = hi - lo
    unit = [((v[0] - c.x) / size.x, (v[1] - c.y) / size.y, (v[2] - c.z) / size.z) for v in verts]
    return unit, [size.x, size.y, size.z]


def mesh_out(kind, verts, tris, size=(1.0, 1.0, 1.0), source=''):
    """Triangles with smooth per-vertex normals from the final connectivity."""
    bm = bmesh.new()
    bverts = [bm.verts.new(tuple(v)) for v in verts]
    for a, b, c in tris:
        try:
            bm.faces.new((bverts[a], bverts[b], bverts[c]))
        except ValueError:
            pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    flat, index = [], []
    for v in bm.verts:
        flat.extend([round(v.co.x, 6), round(v.co.y, 6), round(v.co.z, 6),
                     round(v.normal.x, 6), round(v.normal.y, 6), round(v.normal.z, 6)])
    for f in bm.faces:
        if len(f.verts) == 3:
            index.extend([v.index for v in f.verts])
    bm.free()
    return {'kind': kind, 'vertices': flat, 'indices': index, 'size': [round(s, 6) for s in size],
            'triangles': len(index) // 3, 'source': source}


def feather_mesh():
    """A tapered, bowed feather plane: one kind, instanced per feather with its own colour."""
    n = 8
    verts, tris, rows = [], [], []
    for i in range(n + 1):
        u = i / n
        w = 0.13 * (1.0 - u) ** 0.8 + 0.012
        rows.append(len(verts))
        verts.append((-w * 0.5, u, 0.09 * u * u))
        verts.append((w * 0.5, u, 0.09 * u * u))
    for i in range(n):
        a, b = rows[i], rows[i + 1]
        tris.append((a, a + 1, b + 1))
        tris.append((a, b + 1, b))
    unit, dims = normalise(verts)
    return mesh_out('body-feather', unit, tris, size=dims, source='procedural tapered feather')


def main():
    random.seed(0)
    out = {'kind': 'human-bodies-v1', 'stride': 6, 'bundle': 'Human Base Meshes v1.4.1 (CC0 per the README in the file)',
           'blender': bpy.app.version_string, 'source_objects': SOURCE, 'kinds': {}}
    report = {'objects': {}, 'kinds': {}}

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

    segs = {
        'upper_arm': (joint('left-upper-arm', 0), joint('left-upper-arm', 1)),
        'forearm': (joint('left-forearm', 0), joint('left-forearm', 1)),
        'thigh': (joint('left-thigh', 0), joint('left-thigh', 1)),
        'shin': (joint('left-shin', 0), joint('left-shin', 1)),
        'torso': (Vector((0.0, 1.09, 0.0)), Vector((0.0, 1.42, 0.0))),
        'neck': (Vector((0.0, 1.42, 0.0)), Vector((0.0, 1.50, 0.0))),
    }
    hand_joint = joint('left-forearm', 1)

    # per face: the nearest segment is its primary; every segment within MARGIN of it also takes the face.
    faces_by, primary = {}, {}
    for ti, tri in enumerate(btris):
        pts = [body[i] for i in tri]
        c = (pts[0] + pts[1] + pts[2]) / 3.0
        if c.y < 0.12:
            if c.x <= 0.0:
                faces_by.setdefault('foot', []).append(tri)
                primary[ti] = 'foot'
            continue
        if c.y > 1.50 or (c - hand_joint).length < 0.11:
            continue
        ds = sorted((seg_dist(c, a, b), name) for name, (a, b) in segs.items())
        best = ds[0][0]
        if best > 0.30:
            continue
        primary[ti] = ds[0][1]
        for d, name in ds:
            if d > 0.30 or d - best > MARGIN:
                continue
            if name in LIMBS and c.x > 0.0:
                continue
            faces_by.setdefault(name, []).append(tri)

    def pack(tris, source_pts):
        used = sorted({i for t in tris for i in t})
        remap = {old: new for new, old in enumerate(used)}
        return [source_pts[i] for i in used], [(remap[a], remap[b], remap[c]) for a, b, c in tris]

    for who, tris in sorted(faces_by.items()):
        verts, ftris = pack(tris, body)
        report['kinds'][who] = {'faces': len(ftris)}
        if who == 'torso':
            keep = [i for i, p in enumerate(verts) if abs(p.x) <= 0.20]
            ftris = [t for t in ftris if all(i in keep for i in t)]
            verts, ftris = pack(ftris, verts)
            fitted = fit_box(verts)
            upts = [fitted(p) for p in verts]
            out['kinds']['body-torso'] = mesh_out('body-torso', [tuple(u) for u in upts], drop_slivers(upts, ftris), source=SOURCE['body'])
        elif who == 'neck':
            verts2 = [p for p in verts]
            keep = [i for i, p in enumerate(verts2) if abs(p.x) <= 0.10]
            ftris = [t for t in ftris if all(i in keep for i in t)]
            verts, ftris = pack(ftris, verts2)
            fitted = fit_box(verts)
            upts = [fitted(p) for p in verts]
            out['kinds']['body-neck'] = mesh_out('body-neck', [tuple(u) for u in upts], drop_slivers(upts, ftris), source=SOURCE['body'])
        elif who in LIMBS:
            a, b = segs[who]
            fitted = fit_limb(verts, a, b)
            kind = {'upper_arm': 'body-upper-arm', 'forearm': 'body-forearm', 'thigh': 'body-thigh', 'shin': 'body-shin'}[who]
            upts = [fitted(p) for p in verts]
            out['kinds'][kind] = mesh_out(kind, [tuple(u) for u in upts], drop_slivers(upts, ftris), source=SOURCE['body'])
        elif who == 'foot':
            fitted = fit_box(verts)
            upts = [fitted(p) for p in verts]
            out['kinds']['body-foot'] = mesh_out('body-foot', [tuple(u) for u in upts], drop_slivers(upts, ftris), source=SOURCE['body'])

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

    # shells: offsets of the baked torso and legs in rig metres, flared at the hem; the arms are left out.
    normals = vertex_normals(body, btris)

    def shell(kind, names, y_lo, y_hi, flare_top, flare, offset):
        keep = [ti for ti, name in primary.items() if name in names
                and y_lo <= (body[btris[ti][0]].y + body[btris[ti][1]].y + body[btris[ti][2]].y) / 3.0 <= y_hi]
        used = sorted({i for ti in keep for i in btris[ti]})
        remap = {old: new for new, old in enumerate(used)}
        verts = []
        for i in used:
            q = body[i] + normals[i] * offset
            if q.y < flare_top:
                f = 1.0 + flare * (flare_top - q.y) / max(1e-6, flare_top - y_lo)
                q = Vector((q.x * f, q.y, q.z * f))
            verts.append(tuple(q))
        tris = [tuple(remap[i] for i in btris[ti]) for ti in keep]
        return mesh_out(kind, verts, tris, source='offset shell of the baked body')

    out['kinds']['body-coat'] = shell('body-coat', ('torso', 'thigh', 'shin'), 0.34, 1.36, 0.62, 0.22, 0.028)
    out['kinds']['body-robe'] = shell('body-robe', ('torso', 'thigh', 'shin', 'neck'), 0.03, 1.40, 0.55, 0.30, 0.034)
    out['kinds']['body-feather'] = feather_mesh()
    out['kinds']['body-hidden'] = mesh_out('body-hidden', [], [], source='empty: legacy rig parts drawn for baked figures')

    out['kinds'] = {k: out['kinds'][k] for k in sorted(out['kinds'])}
    report['kind_triangles'] = {k: v['triangles'] for k, v in out['kinds'].items()}
    body_kinds = ('body-head', 'body-neck', 'body-torso', 'body-upper-arm', 'body-forearm', 'body-hand',
                  'body-thigh', 'body-shin', 'body-foot')
    report['body_unique_triangles'] = sum(out['kinds'][k]['triangles'] for k in body_kinds)
    text = json.dumps(out, sort_keys=True, separators=(',', ':'))
    with open(OUT_PATH, 'w', encoding='utf-8') as fh:
        fh.write(text + '\n')
    report['sha256'] = hashlib.sha256((text + '\n').encode('utf-8')).hexdigest()
    with open(REPORT_PATH, 'w', encoding='utf-8') as fh:
        json.dump(report, fh, indent=1, sort_keys=True)
    print('BAKE_OK', report['sha256'], 'body triangles', report['body_unique_triangles'], flush=True)


main()
