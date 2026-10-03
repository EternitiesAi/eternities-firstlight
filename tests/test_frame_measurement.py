"""Protect reported percentile meaning without needing a browser installation."""
from pathlib import Path
import importlib.util
import unittest

spec = importlib.util.spec_from_file_location(
    'frame_measurement', Path(__file__).resolve().parents[1] / 'tools/measure_gpu_browser.py')
measurement = importlib.util.module_from_spec(spec)
spec.loader.exec_module(measurement)


class FrameMeasurementTests(unittest.TestCase):
    def test_nearest_rank_matches_six_hundred_frame_acceptance_report(self):
        samples = list(range(600, 0, -1))
        self.assertEqual(measurement.percentile(samples, .5), 300)
        self.assertEqual(measurement.percentile(samples, .9), 540)
        self.assertEqual(measurement.percentile(samples, .95), 570)
        self.assertEqual(measurement.percentile(samples, .99), 594)
        self.assertEqual(samples[0], 600)

    def test_small_sample_and_extremes_stay_in_the_observed_distribution(self):
        self.assertEqual(measurement.percentile([33.4, 16.7], .5), 16.7)
        self.assertEqual(measurement.percentile([33.4, 16.7], .95), 33.4)
        self.assertEqual(measurement.percentile([33.4, 16.7], 0), 16.7)
        self.assertEqual(measurement.percentile([33.4, 16.7], 1), 33.4)
        self.assertEqual(measurement.percentile([51], .99), 51)

    def test_empty_samples_and_invalid_fraction_cannot_be_reported(self):
        for samples, fraction in [([], .95), ([1], -.1), ([1], 1.1)]:
            with self.assertRaises(ValueError):
                measurement.percentile(samples, fraction)
