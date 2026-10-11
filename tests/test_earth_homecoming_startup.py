"""Actual extracted startup/HTTP code with explicitly synthetic CPU interfaces.

No Playwright import, browser, socket, profile, media, Core or game clock exists.
These controls qualify observation and exception transport, not real startup.
"""
from pathlib import Path
import ast
import copy
import hashlib
import time
import types
import unittest

ROOT = Path(__file__).resolve().parents[1]
NATIVE = ROOT / 'tools/earth_homecoming_browser.py'
BASE = ROOT / 'tools/heaven_campaign_browser.py'
DOCUMENT = b'SYNTHETIC CPU loopback response; no actual HTML admission'
DOCUMENT_SHA = hashlib.sha256(DOCUMENT).hexdigest()


class CpuHTTPBoundary:
    def __init__(self, server, path='/', directory=None):
        self.server, self.path, self.directory = server, path, directory

    def do_GET(self):
        if self.server.error is not None:
            raise self.server.error
        self.send_response(200)
        self.end_headers()

    def send_response(self, code, message=None):
        self.server.status = code

    def end_headers(self):
        self.server.headers = True


class CpuProbeResponse:
    status = 200

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self, limit):
        if limit != 8 * 1024 * 1024 + 1:
            raise AssertionError('Original bounded HTTP read changed')
        return DOCUMENT


def actual_extracts():
    tree = ast.parse(NATIVE.read_text(encoding='utf8'))
    cls = next(n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == 'EarthMixin')
    start = next(n for n in cls.body if isinstance(n, ast.FunctionDef) and n.name == 'start')
    init = next(n.value for n in tree.body if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'INITIALIZE' for t in n.targets))
    shared = ast.parse(BASE.read_text(encoding='utf8'))
    selected = [n for n in shared.body if isinstance(n, (ast.FunctionDef, ast.ClassDef)) and n.name in ['Handler', 'capture_navigation_failure']]
    env = {'time': time, 'hashlib': hashlib, 'ROOT': ROOT,
           'SimpleHTTPRequestHandler': CpuHTTPBoundary,
           'sha': lambda path: 'SYNTHETIC PNG boundary; no media written',
           'urlrequest': types.SimpleNamespace(urlopen=lambda url, timeout: CpuProbeResponse())}
    exec(compile(ast.fix_missing_locations(ast.Module(body=selected, type_ignores=[])), str(BASE)+'#actual-extracted', 'exec'), env)
    env['INITIALIZE'] = ast.literal_eval(init)
    exec(compile(ast.fix_missing_locations(ast.Module(body=[start], type_ignores=[])), str(NATIVE)+'#actual-extracted', 'exec'), env)
    return env


class CpuPage:
    def __init__(self, host, blank=False):
        self.host, self.blank, self.events = host, blank, {}
        self.url = 'about:blank'
        self.closed = False

    def on(self, event, callback):
        self.events.setdefault(event, []).append(callback)

    def emit(self, event, subject=None):
        for callback in self.events.get(event, []):
            callback() if subject is None else callback(subject)

    def close(self):
        self.closed = True
        self.emit('close')

    def goto(self, url, wait_until, timeout):
        self.host.calls.append(('goto', url, wait_until, timeout))
        if (wait_until, timeout) != ('load', 30000):
            raise AssertionError('Original load deadline changed')
        self.url = url
        request = types.SimpleNamespace(resource_type='document', url=url, failure='SYNTHETIC CPU crash')
        self.emit('request', request)
        handler = self.host.extracted['Handler'](self.host.server)
        handler.do_GET()
        response = types.SimpleNamespace(request=request, url=url, status=200, body=lambda: DOCUMENT)
        self.emit('response', response)
        self.emit('requestfinished', request)
        self.emit('framenavigated', self.main_frame)
        if self.host.scenario == 'crash':
            self.emit('crash')
            self.emit('requestfailed', request)
        if self.host.scenario in ['load-timeout', 'crash']:
            raise self.host.primary
        self.emit('domcontentloaded')
        self.emit('load')
        return response

    def wait_for_function(self, predicate, timeout):
        self.host.calls.append(('ready', predicate, timeout))
        if timeout != 30000:
            raise AssertionError('Original readiness deadline changed')
        if predicate == '()=>!!window.Realm&&!!RealmEarthHomecoming' and self.host.scenario == 'ready-timeout':
            raise self.host.primary

    def screenshot(self, path, timeout):
        self.host.calls.append(('screenshot-boundary', str(path), timeout))
        if timeout != 3000:
            raise AssertionError('Original shared failure screenshot budget changed')


class CpuContext:
    def __init__(self, host):
        self.host, self.pages = host, [CpuPage(host, blank=True)]

    def add_init_script(self, script):
        self.host.calls.append(('init', script))

    def new_page(self):
        page = CpuPage(self.host)
        page.main_frame = types.SimpleNamespace(url=self.host.url)
        self.pages.append(page)
        return page

    def route(self, pattern, callback):
        self.host.calls.append(('route', pattern))


class CpuHost:
    def __init__(self, scenario='success'):
        self.extracted = actual_extracts()
        self.scenario, self.calls = scenario, []
        self.primary = RuntimeError('SYNTHETIC CPU '+scenario)
        self.server = types.SimpleNamespace(navigation_http_events=[], error=None, status=None, headers=False)
        self.url = 'http://127.0.0.1:1/'  # String only; no connection or server allocation.
        self.variant, self.record = 'blade', {'navigation': []}
        self.report = {'html_sha256': DOCUMENT_SHA, 'browser_errors': []}
        self.args = types.SimpleNamespace(renderer='software', output=ROOT/'CPU-ONLY-NO-OUTPUT')
        self.profile = ROOT/'CPU-ONLY-NO-PROFILE'
        self.game_facts = {'syntheticSentinel': ['unchanged'], 'notAWorld': True}
        self.base = types.SimpleNamespace(launch_kwargs=lambda renderer: {'syntheticBoundary': renderer}, capture_navigation_failure=self.extracted['capture_navigation_failure'])
        self.pw = types.SimpleNamespace(chromium=types.SimpleNamespace(launch_persistent_context=self.launch))

    def launch(self, profile, **options):
        self.calls.append(('launch-boundary', profile, options))
        return CpuContext(self)

    def console(self, message):
        self.calls.append(('console-boundary', message))

    def ev(self, code):
        self.calls.append(('readonly-render-adapter-boundary', code))

    def render(self):
        self.calls.append(('original-render-boundary',))

    def diag(self):
        return {'mode': 'webgl2', 'renderer': 'SYNTHETIC CPU swiftshader string; not renderer proof'}

    def check(self, name, passed, detail=None):
        self.calls.append(('guard-boundary', name, passed))
        if not passed:
            raise AssertionError(name)

    def run(self):
        return self.extracted['start'](self)


class EarthHomecomingStartupObservation(unittest.TestCase):
    def test_success_records_actual_startup_and_http_phases_without_changing_guards(self):
        host = CpuHost(); before = copy.deepcopy(host.game_facts)
        host.run()
        observation = host.record['navigation'][0]
        self.assertEqual([v['event'] for v in observation['events']], ['request', 'response', 'requestfinished', 'commit', 'domcontentloaded', 'load'])
        self.assertEqual([v['event'] for v in observation['http_events']], ['request', 'response_status', 'headers_write_complete', 'body_write_complete'])
        self.assertTrue(all(v['seconds'] >= 0 for v in observation['events']+observation['http_events']))
        self.assertEqual(observation['observation_errors'], [])
        self.assertEqual(len(host.record['navigation']), 2)  # Added timeline plus exact old successful guard receipt.
        self.assertTrue(host.record['navigation'][1]['capture_freezes_ordinary_RAF'])
        self.assertEqual(host.game_facts, before)
        self.assertEqual([v[1] for v in host.calls if v[0]=='guard-boundary'], ['exact frozen actual HTML served', 'actual WebGL2 renderer', 'requested renderer observed'])
        self.assertEqual([v for v in host.calls if v[0]=='goto'][0][2:], ('load',30000))
        self.assertEqual([v for v in host.calls if v[0]=='ready'][0][1:], ('()=>!!window.Realm&&!!RealmEarthHomecoming',30000))

    def test_load_timeout_retains_exact_primary_and_partial_http_without_acceptance(self):
        host = CpuHost('load-timeout')
        with self.assertRaises(RuntimeError) as caught: host.run()
        self.assertIs(caught.exception, host.primary)
        self.assertEqual(len(host.record['navigation']), 1)
        timeline = host.record['navigation'][0]
        self.assertNotIn('load', [v['event'] for v in timeline['events']])
        self.assertEqual([v['event'] for v in timeline['http_events']], ['request', 'response_status', 'headers_write_complete', 'body_write_complete'])
        self.assertTrue(host.record['navigation_failure']['http_probe']['exact_html'])
        self.assertEqual(host.record['navigation_failure']['document_observation'], 'Lifecycle events only; no failed-renderer evaluation.')
        self.assertFalse(any(v[0] in ['ready','guard-boundary','original-render-boundary'] for v in host.calls))
        self.assertEqual(len(host.record['navigation']), 1)

    def test_crash_and_later_owned_close_are_observed_and_never_pass(self):
        host = CpuHost('crash')
        with self.assertRaises(RuntimeError) as caught: host.run()
        self.assertIs(caught.exception, host.primary)
        host.page.close()  # Synthetic boundary; actual observer receives the event.
        events = [v['event'] for v in host.record['navigation'][0]['events']]
        self.assertIn('crash', events); self.assertIn('requestfailed', events); self.assertEqual(events[-1], 'close')
        self.assertFalse(any(v[0]=='guard-boundary' for v in host.calls))

    def test_ready_timeout_retains_completed_load_as_distinct_observation(self):
        host = CpuHost('ready-timeout')
        with self.assertRaises(RuntimeError) as caught: host.run()
        self.assertIs(caught.exception, host.primary)
        self.assertIn('load', [v['event'] for v in host.record['navigation'][0]['events']])
        self.assertEqual(len([v for v in host.calls if v[0]=='ready']), 1)
        self.assertFalse(any(v[0]=='guard-boundary' for v in host.calls))

    def test_failure_capture_error_is_retained_without_masking_primary(self):
        host = CpuHost('load-timeout')
        def fail_observation(*args): raise ValueError('SYNTHETIC CPU observer retention failure')
        host.base.capture_navigation_failure = fail_observation
        with self.assertRaises(RuntimeError) as caught: host.run()
        self.assertIs(caught.exception, host.primary)
        self.assertEqual(host.record['navigation'][0]['observation_errors'][0]['event'], 'failure_capture')
        self.assertIn('observer retention failure', host.record['navigation'][0]['observation_errors'][0]['error'])

    def test_actual_shared_http_handler_retains_error_and_ignores_nonroot(self):
        extracted = actual_extracts(); original = OSError('SYNTHETIC CPU body-write failure')
        server = types.SimpleNamespace(navigation_http_events=[], error=original, status=None, headers=False)
        handler = extracted['Handler'](server)
        with self.assertRaises(OSError) as caught: handler.do_GET()
        self.assertIs(caught.exception, original)
        self.assertEqual([v['event'] for v in server.navigation_http_events], ['request', 'handler_error'])
        self.assertIn('body-write failure', server.navigation_http_events[-1]['error'])
        server.error = None; server.navigation_http_events = []
        extracted['Handler'](server, '/asset').do_GET()
        self.assertEqual(server.navigation_http_events, [])
        self.assertEqual(handler.directory, str(ROOT))


    def test_failure_capture_interruptions_retain_identical_primary_and_observation(self):
        for interruption in (KeyboardInterrupt('SYNTHETIC CPU helper interruption'), SystemExit('SYNTHETIC CPU helper exit')):
            with self.subTest(kind=type(interruption).__name__):
                host = CpuHost('load-timeout')
                def fail_observation(*args): raise interruption
                host.base.capture_navigation_failure = fail_observation
                caught = None
                try: host.run()
                except BaseException as error: caught = error
                self.assertIs(caught, host.primary)
                timeline = host.record['navigation'][0]
                self.assertEqual(timeline['observation_errors'], [dict(event='failure_capture', error=repr(interruption))])
                self.assertFalse(any(v[0] in ['ready', 'guard-boundary', 'original-render-boundary'] for v in host.calls))


if __name__ == '__main__':
    unittest.main()
