"""Probe exact standalone file and loopback HTTP in the unmodified browser policy.
No storage replacement; no navigation-policy bypass. A policy denial is recorded
as an environment limitation, not recategorized as a game pass.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
import json,hashlib
R=Path(__file__).resolve().parents[1];O=R/'evidence07';O.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(R)))
Thread(target=server.serve_forever,daemon=True).start()
report={'build_sha256':hashlib.sha256((R/'FIRSTLIGHT_VALLEY.html').read_bytes()).hexdigest(),'scope':'Native navigation and localStorage smoke; not full combat replay','origins':[]}
args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=gl-egl','--enable-webgl','--ignore-gpu-blocklist','--disable-gpu-sandbox']
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=args)
 for name,url in [('file',(R/'FIRSTLIGHT_VALLEY.html').as_uri()+'#play'),('loopback',f'http://127.0.0.1:{server.server_port}/FIRSTLIGHT_VALLEY.html#play')]:
  c=b.new_context(viewport={'width':1000,'height':800});q=c.new_page();errors=[];q.on('pageerror',lambda e:errors.append(str(e)));item={'origin_type':name,'storage_fixture':False}
  try:
   q.goto(url,wait_until='load',timeout=12000);q.wait_for_function('window.Realm',timeout=10000)
   item.update({'loaded':True,'renderer':q.evaluate('Realm.diagnostics.mode'),'saveState':q.evaluate('Realm.diagnostics.saveState')})
   q.click('#chronicle');q.fill('#note-text','Native-origin continuity check');q.click('[data-action="note"]');q.wait_for_timeout(300);q.reload(wait_until='load',timeout=12000);q.wait_for_function('window.Realm');item['note_survives_reload']=q.evaluate('Realm.state.notes.some(n=>n.text==="Native-origin continuity check")');item['errors']=errors;item['passed']=item['note_survives_reload'] and not errors
  except Exception as e:item.update({'loaded':False,'passed':False,'limitation':str(e)[:1400]})
  report['origins'].append(item);c.close()
 b.close()
server.shutdown();(O/'NATIVE_ORIGIN_REPORT.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
