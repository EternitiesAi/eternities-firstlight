#!/usr/bin/env python3
"""Prepare one verified CC0 timber pair with an already-installed Blender.

Run Blender --factory-startup --background --threads 2 --python-exit-code 1 --python
tools/authoring/prepare_timber_maps.py -- [--output-root OWNED_NEW_DIRECTORY].
This authoring tool is optional; the offline build uses only the committed maps
and Python's standard library. Source maps are never written or downloaded.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import struct
import sys
import zlib

import bpy

MATERIAL_ID = 'earth-weathered-timber-v1'
SIZE = 512
BUDGET = 180 * 1024
SOURCES = {
    'color': ('weathered_planks_diff_1k.jpg', '01c9a372cfd7a7bf471b59c2458ed3ccecc93448aebf7ba0cc5b3b5b6ed24349'),
    'roughness': ('weathered_planks_rough_1k.jpg', 'a017728183597417a350d1846a5a46db9702ee6d472a21c5da2f23015d606aa3'),
}
OUTPUTS = {'color': 'color-512.jpg', 'roughness': 'roughness-512.png'}


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def srgb_to_linear(value):
    return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4


def scalar_png(data):
    """Keep the grayscale samples and critical chunks, omit display metadata."""
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('Blender did not produce a PNG.')
    kept = [data[:8]]
    removed = []
    offset = 8
    while offset < len(data):
        length = struct.unpack_from('>I', data, offset)[0]
        end = offset + length + 12
        kind = data[offset + 4:offset + 8]
        payload = data[offset + 8:end - 4]
        if end > len(data) or zlib.crc32(kind + payload) != struct.unpack_from('>I', data, end - 4)[0]:
            raise ValueError('Invalid PNG chunk from Blender.')
        if kind in (b'IHDR', b'IDAT', b'IEND'):
            kept.append(data[offset:end])
        else:
            removed.append(kind.decode('ascii'))
        offset = end
    return b''.join(kept), removed


def verify_scalar_png(image, data):
    """Compare every decoded PNG value to the resized Non-Color image."""
    offset = 8
    compressed = []
    while offset < len(data):
        length = struct.unpack_from('>I', data, offset)[0]
        kind = data[offset + 4:offset + 8]
        payload = data[offset + 8:offset + 8 + length]
        if kind == b'IHDR' and struct.unpack('>IIBBBBB', payload) != (SIZE, SIZE, 8, 0, 0, 0, 0):
            raise ValueError('Expected a 512x512, 8-bit grayscale PNG without alpha.')
        if kind == b'IDAT':
            compressed.append(payload)
        offset += length + 12
    filtered = zlib.decompress(b''.join(compressed))
    if len(filtered) != SIZE * (SIZE + 1):
        raise ValueError('Unexpected scalar PNG decoded length.')
    pixels = image.pixels[:]
    previous = bytearray(SIZE)
    max_error = 0
    for y in range(SIZE):
        filtering = filtered[y * (SIZE + 1)]
        row = bytearray(filtered[y * (SIZE + 1) + 1:(y + 1) * (SIZE + 1)])
        for x in range(SIZE):
            left = row[x - 1] if x else 0
            above = previous[x]
            upper_left = previous[x - 1] if x else 0
            if filtering == 1:
                predictor = left
            elif filtering == 2:
                predictor = above
            elif filtering == 3:
                predictor = (left + above) // 2
            elif filtering == 4:
                p = left + above - upper_left
                distances = (abs(p - left), abs(p - above), abs(p - upper_left))
                predictor = (left, above, upper_left)[distances.index(min(distances))]
            elif filtering == 0:
                predictor = 0
            else:
                raise ValueError('Invalid PNG filtering.')
            row[x] = (row[x] + predictor) & 255
            expected = round(pixels[((SIZE - 1 - y) * SIZE + x) * 4] * 255)
            max_error = max(max_error, abs(row[x] - expected))
        previous = row
    if max_error > 1:
        raise ValueError(f'Roughness export changed scalar values (max error {max_error}/255).')
    return {'compared_pixels': SIZE * SIZE, 'max_scalar_error_in_8bit_steps': max_error,
            'comparison': 'decoded PNG versus resized Blender Non-Color pixels; no gamma curve'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-root', type=Path, default=Path('D:/07-GAMES/Firstlight/assets/sources/polyhaven'))
    parser.add_argument('--manifest-root', type=Path, default=Path('D:/07-GAMES/Firstlight/assets/manifests'))
    parser.add_argument('--output-root', type=Path, default=Path('D:/07-GAMES/Firstlight/assets/runtime/timber'))
    parser.add_argument('--replace-owned-output', action='store_true', help='Replace only a complete, hash-matching previous output of this tool. Unknown or edited files refuse.')
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    if '--factory-startup' not in sys.argv or not any(flag in sys.argv for flag in ('--background', '-b')):
        raise RuntimeError('Use a separate factory-startup background process, never a personal scene.')
    if bpy.data.filepath:
        raise RuntimeError('A loaded Blender scene is preserved; no input .blend is allowed.')
    output = args.output_root.resolve()
    source_root = args.source_root.resolve()
    if output == source_root or source_root in output.parents or output in source_root.parents:
        raise ValueError('Derivative output must be separate from acquired source maps.')
    paths = [output / name for name in (*OUTPUTS.values(), 'provenance.json')]
    if any(path.exists() for path in paths):
        if not args.replace_owned_output:
            raise FileExistsError('Existing results are preserved. Choose a fresh owned output directory: ' + str(output))
        if any(path.is_symlink() for path in paths) or any(path.name not in {p.name for p in paths} for path in output.iterdir()):
            raise ValueError('Output contains symlinks or unknown files; refusing to replace it.')
        old = json.loads((output / 'provenance.json').read_text(encoding='utf-8'))
        if old.get('schema') != 1 or old.get('material_id') != MATERIAL_ID:
            raise ValueError('Output is not a previous owned timber preparation.')
        for channel, name in OUTPUTS.items():
            if old['derivatives'][channel]['file'] != name or sha256((output / name).read_bytes()) != old['derivatives'][channel]['sha256']:
                raise ValueError('Existing derivative was edited; refusing to overwrite: ' + name)
    manifest_bytes = (args.manifest_root / 'EARTH_MATERIALS_1K.json').read_bytes()
    manifest = json.loads(manifest_bytes)
    intake = json.loads((args.manifest_root / 'EARTH_MATERIALS_1K_RECEIPT.json').read_text(encoding='utf-8'))
    if manifest['license'] != 'CC0-1.0' or intake['manifest_sha256'] != sha256(manifest_bytes):
        raise ValueError('The frozen CC0 intake manifest does not match its receipt.')
    asset = next(x for x in manifest['assets'] if x['id'] == 'weathered_planks')
    source_records = {}
    images = {}
    for channel, (name, expected_sha) in SOURCES.items():
        relative = 'weathered_planks/' + name
        entry = next(x for x in manifest['objects'] if x['relative_path'] == relative)
        acquired = next(x for x in intake['objects'] if x['relative_path'] == relative)
        data = (source_root / relative).read_bytes()
        if len(data) != entry['expected_bytes'] or hashlib.md5(data).hexdigest() != entry['publisher_md5']:
            raise ValueError('Source differs from publisher size/checksum: ' + relative)
        if sha256(data) != expected_sha or acquired['local_sha256'] != expected_sha:
            raise ValueError('Source differs from approved SHA256: ' + relative)
        image = bpy.data.images.load(str(source_root / relative), check_existing=False)
        if tuple(image.size) != (1024, 1024):
            raise ValueError('Expected actual 1024x1024 source: ' + relative)
        image.colorspace_settings.name = 'sRGB' if channel == 'color' else 'Non-Color'
        images[channel] = image
        source_records[channel] = {
            'asset_id': 'weathered_planks', 'relative_path': relative,
            'url': entry['url'], 'bytes': len(data), 'sha256': expected_sha,
            'publisher_md5': entry['publisher_md5'], 'width': 1024, 'height': 1024,
            'color_space': 'sRGB' if channel == 'color' else 'scalar; no gamma conversion',
        }
    output.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    settings = scene.render.image_settings
    settings.color_depth = '8'
    derivatives = {}
    for channel, image in images.items():
        image.scale(SIZE, SIZE)
        scene.view_settings.view_transform = 'Standard' if channel == 'color' else 'Raw'
        settings.file_format = 'JPEG' if channel == 'color' else 'PNG'
        settings.color_mode = 'RGB' if channel == 'color' else 'BW'
        settings.quality = 82
        settings.compression = 100
        destination = output / OUTPUTS[channel]
        image.save_render(str(destination), scene=scene)
        data = destination.read_bytes()
        scalar_verification = None
        removed_metadata = []
        if channel == 'roughness':
            data, removed_metadata = scalar_png(data)
            scalar_verification = verify_scalar_png(image, data)
            destination.write_bytes(data)
        derivatives[channel] = {
            'file': destination.name, 'mime': 'image/jpeg' if channel == 'color' else 'image/png',
            'bytes': len(data), 'sha256': sha256(data), 'width': SIZE, 'height': SIZE,
            'channels': 3 if channel == 'color' else 1, 'bit_depth': 8,
            'color_space': 'sRGB' if channel == 'color' else 'scalar; no gamma conversion',
            'settings': {
                'resize': 'Blender Image.scale default resampling; 1024 to 512 on both axes',
                'view_transform': scene.view_settings.view_transform, 'look': 'None',
                'exposure': 0, 'gamma': 1, 'format': settings.file_format,
                'color_mode': settings.color_mode,
                **({'jpeg_quality': 82} if channel == 'color' else {'png_compression': 100}),
            },
            **({'removed_png_metadata': removed_metadata, 'scalar_verification': scalar_verification} if channel == 'roughness' else {}),
        }
    final_color = bpy.data.images.load(str(output / OUTPUTS['color']), check_existing=False)
    final_color.colorspace_settings.name = 'sRGB'
    if tuple(final_color.size) != (SIZE, SIZE):
        raise ValueError('Final JPEG dimensions differ from the resized image.')
    color_pixels = final_color.pixels[:]
    # Loaded byte JPEG Image.pixels exposes normalized encoded sRGB values.
    # Decode each sample before averaging; decoding the mean would be wrong.
    mean = [sum(srgb_to_linear(color_pixels[(y * SIZE + x) * 4 + c]) for y in range(SIZE) for x in range(51, 103)) / (SIZE * 52) for c in range(3)]
    calibration = {'stripMeanLinearRGB': mean, 'crop': [0.10, 0.20, 0, 1]}
    combined = sum(x['bytes'] for x in derivatives.values())
    receipt = {
        'schema': 1, 'material_id': MATERIAL_ID, 'width': SIZE, 'height': SIZE,
        'prepared_at_utc': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'provider': manifest['provider'], 'credit': manifest['credit'],
        'source_asset': {'id': asset['id'], 'page': asset['page'], 'authors': asset['authors']},
        'license': manifest['license'], 'license_url': manifest['license_url'],
        'source_manifest_sha256': sha256(manifest_bytes), 'sources': source_records,
        'derivatives': derivatives, 'combined_bytes': combined, 'budget_bytes': BUDGET,
        'calibration': calibration,
        'calibration_measurement': {'image': OUTPUTS['color'], 'pixel_bounds': {'x_start': 51, 'x_end_exclusive': 103, 'y_start': 0, 'y_end_exclusive': SIZE},
                                    'sample_count': SIZE * 52, 'decoder': 'Blender byte JPEG Image.pixels (encoded sRGB) then per-sample standard sRGB transfer to linear RGB',
                                    'srgb_transfer': 'c/12.92 when c<=0.04045; ((c+0.055)/1.055)^2.4 otherwise; average after conversion'},
        'software': {'name': 'Blender', 'version': bpy.app.version_string,
                     'build_hash': bpy.app.build_hash.decode('ascii'),
                     'preparation_script_sha256': sha256(Path(__file__).read_bytes())},
        'limitations': [
            'One 512x512 timber surface pair for an offline renderer proof; no normal or displacement map.',
            'JPEG color is lossy. Maps preserve the source orientation and tile field without cropping.',
            'Color is sRGB for renderer decoding; roughness is an 8-bit single-channel scalar.',
            'Blender authoring and source checks do not prove browser upload, visual quality, GPU cost or human approval.',
        ],
    }
    (output / 'provenance.json').write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8', newline='\n')
    if combined > BUDGET:
        raise ValueError(f'Derivatives exceed the {BUDGET}-byte budget ({combined}); retained for inspection.')
    # A post-write check binds the result to unchanged acquired source bytes.
    for channel, (name, expected_sha) in SOURCES.items():
        if sha256((source_root / 'weathered_planks' / name).read_bytes()) != expected_sha:
            raise ValueError('Acquired source changed during preparation: ' + name)
    print(json.dumps({'material_id': MATERIAL_ID, 'combined_bytes': combined, 'receipt': str(output / 'provenance.json')}))


if __name__ == '__main__':
    main()
