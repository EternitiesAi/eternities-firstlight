"""Offline timber receipt, image-header and assembly refusal checks.

These checks do not qualify browser decoding, texture upload, GPU performance
or visual taste. They use copied repository inputs, never personal saves.
"""
from contextlib import redirect_stdout
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import shutil
import struct
import tempfile
import unittest
import zlib

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('surface_build', ROOT / 'build.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


def png_chunk(kind, payload):
    return struct.pack('>I', len(payload)) + kind + payload + struct.pack('>I', zlib.crc32(kind + payload))


def scalar_png(header=None, samples=None, extra=b''):
    if header is None:
        header = struct.pack('>IIBBBBB', 512, 512, 8, 0, 0, 0, 0)
    if samples is None:
        samples = bytes(512 * 513)
    return b'\x89PNG\r\n\x1a\n' + png_chunk(b'IHDR', header) + extra + png_chunk(b'IDAT', zlib.compress(samples)) + png_chunk(b'IEND', b'')


class SurfaceAssetTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        scratch = ROOT / 'verification'
        scratch.mkdir(exist_ok=True)
        cls.temporary = tempfile.TemporaryDirectory(prefix='timber-source-tests-', dir=scratch)
        cls.root = Path(cls.temporary.name)
        for folder in ('src', 'assets/concept-art', 'assets/materials/timber', 'docs/art/material-proof-2026-09-30'):
            shutil.copytree(ROOT / folder, cls.root / folder)
        cls.folder = cls.root / 'assets/materials/timber'
        cls.receipt_path = cls.folder / 'provenance.json'
        cls.original_receipt = cls.receipt_path.read_text(encoding='utf-8')
        cls.color = (cls.folder / 'color-512.jpg').read_bytes()
        cls.roughness = (cls.folder / 'roughness-512.png').read_bytes()

    @classmethod
    def tearDownClass(cls):
        cls.temporary.cleanup()

    def setUp(self):
        self.receipt_path.write_text(self.original_receipt, encoding='utf-8')
        (self.folder / 'color-512.jpg').write_bytes(self.color)
        for name in ('index.html', 'FIRSTLIGHT_VALLEY.html'):
            (self.root / name).write_bytes(b'previous verified output')

    def refused_receipt(self, mutator):
        receipt = json.loads(self.original_receipt)
        mutator(receipt)
        self.receipt_path.write_text(json.dumps(receipt), encoding='utf-8')
        with self.assertRaises(ValueError):
            builder.timber_replacements(self.root)

    def refused_source(self, path, mutator, message):
        path = self.root / path
        original = path.read_text(encoding='utf-8')
        path.write_text(mutator(original), encoding='utf-8')
        try:
            with self.assertRaisesRegex(ValueError, message):
                builder.build(self.root)
            for name in ('index.html', 'FIRSTLIGHT_VALLEY.html'):
                self.assertEqual((self.root / name).read_bytes(), b'previous verified output')
        finally:
            path.write_text(original, encoding='utf-8')

    def test_actual_jpeg_dimensions(self):
        self.assertEqual(builder.validate_timber_image(self.color, 'color'), (512, 512))

    def test_actual_grayscale_png_dimensions(self):
        self.assertEqual(builder.validate_timber_image(self.roughness, 'roughness'), (512, 512))

    def test_truncated_jpeg_refused(self):
        with self.assertRaises(ValueError):
            builder.validate_timber_image(self.color[:-2], 'color')

    def test_jpeg_frame_wrong_dimensions_refused(self):
        data = bytearray(self.color)
        frame = data.index(b'\xff\xc0')
        data[frame + 5:frame + 7] = struct.pack('>H', 256)
        with self.assertRaises(ValueError):
            builder.validate_timber_image(bytes(data), 'color')

    def test_jpeg_grayscale_refused(self):
        data = bytearray(self.color)
        data[data.index(b'\xff\xc0') + 9] = 1
        with self.assertRaises(ValueError):
            builder.validate_timber_image(bytes(data), 'color')

    def test_png_wrong_dimensions_refused(self):
        with self.assertRaises(ValueError):
            builder.validate_timber_image(scalar_png(struct.pack('>IIBBBBB', 256, 512, 8, 0, 0, 0, 0)), 'roughness')

    def test_png_rgb_refused(self):
        with self.assertRaises(ValueError):
            builder.validate_timber_image(scalar_png(struct.pack('>IIBBBBB', 512, 512, 8, 2, 0, 0, 0)), 'roughness')

    def test_png_alpha_refused(self):
        with self.assertRaises(ValueError):
            builder.validate_timber_image(scalar_png(struct.pack('>IIBBBBB', 512, 512, 8, 4, 0, 0, 0)), 'roughness')

    def test_png_gamma_metadata_refused(self):
        with self.assertRaises(ValueError):
            builder.validate_timber_image(scalar_png(extra=png_chunk(b'gAMA', struct.pack('>I', 45455))), 'roughness')

    def test_png_checksum_refused(self):
        data = bytearray(self.roughness)
        data[29] ^= 1
        with self.assertRaises(ValueError):
            builder.validate_timber_image(bytes(data), 'roughness')

    def test_png_wrong_sample_count_refused(self):
        with self.assertRaises(ValueError):
            builder.validate_timber_image(scalar_png(samples=bytes(512)), 'roughness')

    def test_png_filter_refused(self):
        samples = bytearray(512 * 513)
        samples[0] = 5
        with self.assertRaises(ValueError):
            builder.validate_timber_image(scalar_png(samples=bytes(samples)), 'roughness')

    def test_png_trailing_content_refused(self):
        with self.assertRaises(ValueError):
            builder.validate_timber_image(self.roughness + b'extra', 'roughness')

    def test_derivative_hash_mismatch_refused(self):
        self.refused_receipt(lambda r: r['derivatives']['color'].update(sha256='0' * 64))

    def test_source_hash_mismatch_refused(self):
        self.refused_receipt(lambda r: r['sources']['roughness'].update(sha256='0' * 64))

    def test_source_manifest_mismatch_refused(self):
        self.refused_receipt(lambda r: r.update(source_manifest_sha256='0' * 64))

    def test_receipt_combined_bytes_mismatch_refused(self):
        self.refused_receipt(lambda r: r.update(combined_bytes=r['combined_bytes'] + 1))

    def test_normal_map_receipt_refused(self):
        self.refused_receipt(lambda r: r['derivatives'].update(normal={}))

    def test_color_space_receipt_refused(self):
        self.refused_receipt(lambda r: r['derivatives']['roughness'].update(color_space='sRGB'))

    def test_nonfinite_calibration_refused(self):
        self.refused_receipt(lambda r: r['calibration'].update(stripMeanLinearRGB=[float('nan'), .5, .5]))

    def test_combined_budget_refused_even_when_each_map_fits(self):
        # Keep the real JPEG header/scan and terminator while increasing byte cost.
        data = self.color[:-2] + bytes(130_000 - len(self.color)) + self.color[-2:]
        (self.folder / 'color-512.jpg').write_bytes(data)
        def mutate(receipt):
            receipt['derivatives']['color'].update(bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
            receipt['combined_bytes'] = len(data) + len(self.roughness)
        self.assertLess(len(data), builder.TIMBER_BUDGET)
        self.assertLess(len(self.roughness), builder.TIMBER_BUDGET)
        self.refused_receipt(mutate)

    def test_external_script_resource_refused(self):
        with self.assertRaises(ValueError):
            builder.OfflineResources().feed('<script src="https://example.invalid/library.js"></script>')

    def test_external_image_resource_refused(self):
        with self.assertRaises(ValueError):
            builder.OfflineResources().feed('<img src="/map.png">')

    def test_unknown_image_placeholder_refused(self):
        self.refused_source('src/surface-assets.js', lambda text: text.replace('__TIMBER_COLOR_BASE64__', '__WRONG_COLOR_BASE64__'), 'placeholder')

    def test_missing_module_placeholder_refused(self):
        self.refused_source('src/shell.html', lambda text: text.replace('/*__SURFACE_ASSETS__*/', ''), 'placeholder')

    def test_embedded_script_terminator_refused(self):
        self.refused_source('src/surface-assets.js', lambda text: text + '\n// </script>', 'terminator')

    def test_offline_assembly_is_identical_repeatable_and_precedes_engine(self):
        with redirect_stdout(io.StringIO()):
            builder.build(self.root)
            first = (self.root / 'index.html').read_bytes()
            builder.build(self.root)
        self.assertEqual(first, (self.root / 'FIRSTLIGHT_VALLEY.html').read_bytes())
        self.assertEqual(first, (self.root / 'index.html').read_bytes())
        engine_start = (self.root / 'src/engine.js').read_bytes()[:50]
        self.assertLess(first.index(b'RealmSurfaceAssets='), first.index(engine_start))
        self.assertNotIn(b'__TIMBER_', first)
        self.assertIn(b'data:image/jpeg;base64,', first)
        self.assertIn(b'data:image/png;base64,', first)


if __name__ == '__main__':
    unittest.main()
