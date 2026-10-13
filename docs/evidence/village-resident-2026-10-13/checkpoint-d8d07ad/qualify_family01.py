"""Native village family: actual Settings/People controls and Core movement.
Preparation/settled/interior checks use labelled accelerated ticks; one bounded
ordinary-RAF recording uses no step/render/actor-position injection. Software Low.
Range values are changed through their DOM input event, not sim/state assignment.
Each camera observes a real outgoing or homeward route selected by the clock.
10:00 was selected for readable daytime exterior art; 19:00 triggers the real return.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
import sys,json,threading,time,traceback,hashlib
ROOT=Path('D:/07-GAMES/Firstlight/verification/current-qualified-game')
ARC=Path(__file__).resolve().parent
OUT=ARC/'NATIVE01'
sys.path.insert(0,str(ROOT/'tools'))
import briar_outing_browser as N
from browser_support import launch_kwargs
from playwright.sync_api import sync_playwright

def main():
 head=N.git(ROOT,'rev-parse','HEAD');gate=N.source_gate(ARC/'REMOTE_SOURCE02_EXIT.json',ROOT,head)
 assert not N.git(ROOT,'status','--porcelain=v1','--untracked-files=all')
 assert not OUT.exists();OUT.mkdir()
 report={'status':'running','head':head,'htmlSha256':N.sha(ROOT/'index.html'),'sourceGate':gate,'callerSha256':N.sha(__file__),'method':__doc__,
  'checks':[],'errors':[],'browserErrors':[],'externalRequests':[],'admissions':[],'samples':[],
  'actorPositionEdits':0,'inventoryGrants':0,'plantedQuestFacts':0,'humanAcceptance':False,'performanceCertified':False}
 def check(name,ok,detail=None):
  report['checks'].append({'name':name,'passed':bool(ok),'detail':detail});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
  if not ok:raise AssertionError(name+' '+repr(detail))
 class Handler(SimpleHTTPRequestHandler):
  def __init__(self,*a,**k):super().__init__(*a,directory=str(ROOT),**k)
  def log_message(self,*a):pass
 server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();origin=f'http://127.0.0.1:{server.server_port}'
 profile=OUT/'task-owned-profile';pw=ctx=page=None;ordinary=False;closed={'browser':True,'driver':True}
 def launch(normal=False):
  nonlocal pw,ctx,page,ordinary
  assert ctx is None;ordinary=normal;report['admissions'].append(N.admission());pw=sync_playwright().start();closed['driver']=False;opts=launch_kwargs('software')
  if normal:opts.update(record_video_dir=str(OUT/'video'),record_video_size={'width':1280,'height':800})
  ctx=pw.chromium.launch_persistent_context(str(profile),viewport={'width':1280,'height':800},**opts);closed['browser']=False
  ctx.add_init_script('window.__ETERNITIES_TEST_MODE=true;'+('' if normal else 'window.__ETERNITIES_CAPTURE_MODE=true;')+'window.__familyStartup=Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]));')
  def route(r):
   if r.request.url.startswith(origin+'/'):r.continue_()
   else:report['externalRequests'].append(r.request.url);r.abort()
  ctx.route('**/*',route);page=ctx.pages[0] if ctx.pages else ctx.new_page();page.on('pageerror',lambda e:report['browserErrors'].append(str(e)))
  response=page.goto(origin+'/index.html',wait_until='load',timeout=60000);page.wait_for_function('()=>!!window.Realm&&getComputedStyle(document.querySelector("#loading")).opacity==="0"',timeout=60000)
  check('served exact qualified HTML',hashlib.sha256(response.body()).hexdigest()==report['htmlSha256'])
  check('actual software WebGL2',ev('()=>Realm.diagnostics.mode')=='webgl2' and 'swiftshader' in ev('()=>Realm.diagnostics.renderer').lower(),ev('()=>Realm.diagnostics.renderer'))
  return page.video
 def close():
  nonlocal ctx,pw
  try:
   if ctx is not None:ctx.close();closed['browser']=True
  finally:
   ctx=None
   if pw is not None:pw.stop();closed['driver']=True
   pw=None
 def ev(code,arg=None):return page.evaluate(code,arg)
 def click(selector):page.locator(selector).click(timeout=20000)
 def render():
  assert not ordinary;ev('()=>Realm.test.render()')
 def step(seconds=.2):
  assert not ordinary;ev('(t)=>{Realm.test.step(t);Realm.test.render()}',seconds)
 def state():return ev('()=>Realm.state')
 def family():return ev('()=>Realm.test.family()')
 def settings(hour=None,mode=None,reduced=None):
  click('#settings')
  if hour is not None:page.locator('#time-slider').evaluate('(el,v)=>{el.value=String(v);el.dispatchEvent(new Event("input",{bubbles:true}))}',hour)
  if mode is not None:page.locator('#camera-mode').select_option(mode)
  if reduced is not None:page.locator('#setting-reducedMotion').set_checked(reduced)
  click('#close-panel')
  if ordinary:page.wait_for_timeout(350)
  else:render()
 def follow(id):
  page.locator('#world').focus();page.keyboard.press('o')
  sel=page.locator('[data-action="select-resident"][data-id="'+id+'"]')
  if sel.count():sel.click()
  q=page.locator('[data-action="follow"][data-id="'+id+'"]')
  if q.inner_text().strip()=='Follow':q.click()
  if page.locator('#close-panel').is_visible():click('#close-panel')
  if ordinary:page.wait_for_timeout(500)
  else:render()
 def sample(label,image=True):
  f=family();f['label']=label;f['ordinaryRAF']=ordinary;f['mode']=state()['settings']['cameraMode'];f['camera']=ev('()=>Realm.diagnostics.camera');f['metrics']=ev('()=>Realm.diagnostics.metrics')
  report['samples'].append(f)
  if image:page.screenshot(path=str(OUT/(label+'.png')))
  check(label+' unique visible IDs',len([r['id'] for r in f['residents'] if r['visible']])==len(set(r['id'] for r in f['residents'] if r['visible'])))
  for r in f['residents']:
   if r['visible']:check(label+' '+r['id']+' bounded submitted geometry',0<len(r['parts'])<=60 and all(all(__import__('math').isfinite(n) for n in p['m']) for p in r['parts']))
  return f
 def settle():
  for _ in range(160):
   step(.5)
   f=family()
   if all(not r['run']['walking'] and r['run']['pathLength']==0 for r in f['residents']):step(1);return
  raise AssertionError('Actual Core routes did not settle')
 def walk(x,z):
  check('supported player path',ev('([x,z])=>Realm.test.move(x,z)',[x,z]).get('ok'))
  for _ in range(250):
   step(.2)
   if __import__('math').hypot(ev('()=>Realm.diagnostics.adventure.player')['x']-x,ev('()=>Realm.diagnostics.adventure.player')['z']-z)<.12:return
  raise AssertionError('No arrival')
 try:
  launch();click('#settings');page.locator('#quality').select_option('low');page.locator('#setting-timeFlow').uncheck();page.locator('#time-slider').evaluate('(el)=>{el.value="19";el.dispatchEvent(new Event("input",{bubbles:true}))}');click('#close-panel');settle()
  check('all family reached home through Core',all(r['run']['inside'] for r in family()['residents']))
  check('fresh character retains optional campaign',not state()['adventure']['started'])
  check('save accepted',ev('()=>Realm.test.save()').get('ok'));stored=ev('()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))');check('nonempty production save exists',bool(stored) and any(len(v)>1000 for v in stored.values()));close()
  video=launch(True);check('whole-browser restart retained exact store',ev('()=>window.__familyStartup')==stored)
  settings(10);start=time.monotonic()
  for mode in ['adventure','follow']:
   settings(10 if mode=='adventure' else 19)
   for id in ['ilan','mara','oren']:
    settings(mode=mode);follow(id);first=sample('walking_'+mode+'_'+id);page.wait_for_timeout(1100);second=sample('motion_'+mode+'_'+id,False)
    a=next(r for r in first['residents'] if r['id']==id);b=next(r for r in second['residents'] if r['id']==id)
    check('ordinary '+mode+' '+id+' actual displacement and stride',a['visible'] and b['visible'] and __import__('math').hypot(a['core']['x']-b['core']['x'],a['core']['z']-b['core']['z'])>1e-6 and a['motion']['phase']!=b['motion']['phase'])
    check('bounded recording window',time.monotonic()-start<100)
  report['recordingActionSeconds']=time.monotonic()-start;ev('()=>Realm.test.save()');video_path=video.path();close();report['video']=str(video_path);report['videoBytes']=Path(video_path).stat().st_size
  launch();settings(10);settle()
  for mode in ['adventure','follow']:
   for id in ['ilan','mara','oren']:
    settings(mode=mode);follow(id);f=sample('settled_'+mode+'_'+id);r=next(r for r in f['residents'] if r['id']==id);check('settled '+id+' stance',r['visible'] and not r['run']['walking'] and r['motion']['blend']==0)
  settings(19);settle();walk(-11,-1.6);page.locator('#world').focus();page.keyboard.press('e');render();check('actual home entry',family()['scene']=='home')
  walk(0,2.6)
  for mode in ['adventure','follow']:
   settings(mode=mode);f=sample('home_'+mode);check('all three at home anchors',all(r['visible'] and r['frame']['anchor']=={'ilan':[-3.1,1.57,1.1],'mara':[3.2,1.57,1.1],'oren':[2,1.57,3.2]}[r['id']] for r in f['residents']))
  before=state();render();after=state();check('repeated rendering preserves exact complete saved state',before==after)
  settings(reduced=True);f=sample('home_reduced');check('reduced motion reaches each resident',all(r['frame']['reducedMotion'] for r in f['residents']))
  check('browser has no runtime errors',not report['browserErrors'],report['browserErrors']);check('no external requests',not report['externalRequests'],report['externalRequests'])
  report['status']='passed'
 except Exception as e:
  report['status']='failed';report['errors'].append(repr(e));traceback.print_exc()
  if page:
   try:page.screenshot(path=str(OUT/'failure.png'))
   except Exception:pass
 finally:
  try:close()
  except Exception as e:report['errors'].append('closure '+repr(e));report['status']='failed'
  server.shutdown();server.server_close();report['ownedServerClosed']=True;report['ownedBrowserDriverClosed']=all(closed.values());report['successfulClosures']=closed.copy()
  N.write_new(OUT/'REPORT.json',report)
 if report['status']!='passed':raise SystemExit(1)
if __name__=='__main__':main()
