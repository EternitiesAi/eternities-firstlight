"""Exercise the local launch boundary with real isolated loopback servers."""
from pathlib import Path
from http.server import BaseHTTPRequestHandler
import importlib.util
import tempfile
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('play_local', ROOT / 'tools/play_local.py')
play = importlib.util.module_from_spec(spec)
spec.loader.exec_module(play)


class LocalPlayTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.html = b'<!doctype html><title>Isolated Firstlight fixture</title>'
        for name in ['index.html', 'FIRSTLIGHT_VALLEY.html']:
            (self.root / name).write_bytes(self.html)
        self.servers = []

    def tearDown(self):
        for server in self.servers:
            server.shutdown()
            server.server_close()
        self.temp.cleanup()

    def host(self):
        server, reused = play.prepare_server(self.root, 0)
        self.assertFalse(reused)
        self.servers.append(server)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        return server, f'http://127.0.0.1:{server.server_port}'

    def test_serves_identical_game_bytes_on_loopback_only(self):
        server, url = self.host()
        self.assertEqual(server.server_address[0], '127.0.0.1')
        for route in ['/', '/index.html', '/FIRSTLIGHT_VALLEY.html?test=1']:
            with urlopen(url + route) as response:
                self.assertEqual(response.read(), self.html)
                self.assertEqual(response.headers['Cache-Control'], 'no-store')

    def test_reuses_an_existing_matching_build(self):
        server, _ = self.host()
        new_server, reused = play.prepare_server(self.root, server.server_port)
        self.assertTrue(reused)
        self.assertIsNone(new_server)

    def test_refuses_an_occupied_origin_with_different_bytes(self):
        server, url = self.host()
        for name in ['index.html', 'FIRSTLIGHT_VALLEY.html']:
            (self.root / name).write_bytes(self.html + b'new revision')
        with self.assertRaisesRegex(RuntimeError, 'different build'):
            play.prepare_server(self.root, server.server_port)
        with urlopen(url) as response:
            self.assertEqual(response.read(), self.html)

    def test_refuses_missing_or_mismatched_generated_outputs(self):
        (self.root / 'index.html').write_bytes(b'wrong')
        with self.assertRaisesRegex(RuntimeError, 'identical'):
            play.prepare_server(self.root, 0)
        (self.root / 'index.html').unlink()
        with self.assertRaisesRegex(RuntimeError, 'Build Firstlight'):
            play.prepare_server(self.root, 0)

    def test_existing_origin_cannot_redirect_build_verification_elsewhere(self):
        _, matching_url = self.host()
        class Redirect(BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(302)
                self.send_header('Location', matching_url + '/FIRSTLIGHT_VALLEY.html')
                self.end_headers()
            def log_message(self, *_args):
                pass
        redirect = play.LocalServer(('127.0.0.1', 0), Redirect)
        self.servers.append(redirect)
        threading.Thread(target=redirect.serve_forever, daemon=True).start()
        with self.assertRaisesRegex(RuntimeError, 'different build'):
            play.prepare_server(self.root, redirect.server_port)

    def test_does_not_serve_repository_or_neighbor_files(self):
        _, url = self.host()
        (self.root / 'private-notes.txt').write_text('synthetic private content')
        for route in ['/private-notes.txt', '/tools/play_local.py', '/../private-notes.txt']:
            with self.assertRaises(HTTPError) as error:
                urlopen(url + route)
            self.assertEqual(error.exception.code, 404)
            error.exception.close()

    def test_build_is_consistent_while_source_files_are_rebuilt(self):
        _, url = self.host()
        (self.root / 'index.html').write_bytes(b'rebuilding')
        with urlopen(url + '/index.html') as response:
            self.assertEqual(response.read(), self.html)


if __name__ == '__main__':
    unittest.main()
