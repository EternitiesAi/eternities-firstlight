"""Actual Mara commons corridor after a command-earned preparation and cold restart.
Reuse only Native04's verified-closed task profile. No recording or new profile.
Preparation uses accepted Core ticks; corridor observation uses ordinary RAF,
actual People/Follow and P controls, and readonly frame samples. No actor edits.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
import sys,json,threading,time,traceback,math
ROOT=Path('D:/07-GAMES/Firstlight/verification/current-qualified-game')
ARC=Path(__file__).resolve().parent
OUT=ARC/'CORRIDOR02'
PROFILE=ARC/'NATIVE04/task-owned-profile'
sys.path.insert(0,str(ROOT/'tools'))
import briar_outing_browser as N
from browser_support import launch_kwargs
from playwright.sync_api import sync_playwright

def main():
 prior=json.loads((ARC/'NATIVE04/REPORT.json').read_text());assert prior['status']=='passed' and prior['ownedBrowserDriverClosed'] and prior['ownedServerClosed']
 head=N.git(ROOT,'rev-parse','HEAD');gate=N.source_gate(ARC/'REMOTE_SOURCE04_EXIT.json',ROOT,head)
 assert head==prior['head'] and not N.git(ROOT,'status','--porcelain') and PROFILE.is_dir() and not OUT.exists()
 OUT.mkdir();report=dict(status='running',head=head,sourceGate=gate,callerSha256=N.sha(__file__),method=__doc__,checks=[],errors=[],browserErrors=[],externalRequests=[],admissions=[],frames=[],videoCreated=False,newProfileCreated=False)
 pw=ctx=page=None;closed={'browser':True,'driver':True}
 def check(name,ok,detail=None):
  report['checks'].append(dict(name=name,passed=bool(ok),detail=detail));print(('PASS ' if ok else 'FAIL ')+name,flush=True)
  if not ok:raise AssertionError(name)
 class Handler(SimpleHTTPRequestHandler):
  def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
  def log_message(self,*a):pass
 server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();origin=f'http://127.0.0.1:{server.server_port}'
 def ev(s,arg=None):return page.evaluate(s,arg)
 def launch(capture):
  nonlocal pw,ctx,page
  pw=sync_playwright().start();closed['driver']=False;report['admissions'].append(N.admission());closed['browser']=False
  ctx=pw.chromium.launch_persistent_context(str(PROFILE),viewport={'width':1280,'height':800},**launch_kwargs('software'))
  ctx.add_init_script('window.__ETERNITIES_TEST_MODE=true;'+('window.__ETERNITIES_CAPTURE_MODE=true;' if capture else '')+'window.__corridorCold=Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]));')
  def route(r):
   if r.request.url.startswith(origin+'/'):r.continue_()
   else:report['externalRequests'].append(r.request.url);r.abort()
  ctx.route('**/*',route);page=ctx.pages[0] if ctx.pages else ctx.new_page();page.on('pageerror',lambda e:report['browserErrors'].append(str(e)))
  response=page.goto(origin+'/index.html',wait_until='load');page.wait_for_function('()=>!!window.Realm&&getComputedStyle(document.querySelector("#loading")).opacity==="0"')
  check('exact source page',__import__('hashlib').sha256(response.body()).hexdigest()==N.sha(ROOT/'index.html'))
  check('software WebGL2',ev('()=>Realm.diagnostics.mode')=='webgl2' and 'swiftshader' in ev('()=>Realm.diagnostics.renderer').lower())
 def close():
  nonlocal ctx,pw
  try:
   if ctx is not None:ctx.close();closed['browser']=True
  finally:
   ctx=None
   if pw is not None:pw.stop();closed['driver']=True
   pw=None
 def pause(value):
  if ev('()=>Realm.diagnostics.adventure.paused')!=value:page.locator('#world').focus();page.keyboard.press('p')
  if value:ev('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
  check('actual pause control',ev('()=>Realm.diagnostics.adventure.paused')==value)
 def settings(hour):
  page.locator('#settings').click();page.locator('#time-slider').evaluate('(el,v)=>{el.value=String(v);el.dispatchEvent(new Event("input",{bubbles:true}))}',hour)
  page.locator('#setting-timeFlow').uncheck();page.locator('#setting-reducedMotion').uncheck();page.locator('#camera-mode').select_option('adventure');page.locator('#close-panel').click()
 def snapshot():return ev('()=>({family:Realm.test.family(),camera:Realm.diagnostics.camera,paused:Realm.diagnostics.adventure.paused,mode:Realm.state.settings.cameraMode})')
 def image(label):
  before=snapshot();page.screenshot(path=str(OUT/(label+'.png')));after=snapshot()
  report[label]=dict(before=before,after=after)
  check(label+' paused image operands stable',before['paused'] and after['paused'] and before['family']==after['family'])
  check(label+' third-person readable image brackets',before['mode']==after['mode']=='adventure' and all(x['camera']['projection']=='perspective' and x['camera']['actualDistance']>=3.4 for x in (before,after)))
 def observe_until(x):
  rows=ev("""target=>new Promise((resolve,reject)=>{
   const rows=[],start=performance.now();let done=false;
   const timeout=setTimeout(()=>{if(!done){done=true;reject(Error('ordinary corridor timeout'));}},30000);
   function sample(){
    if(done)return;
    const f=Realm.test.family(),r=f.residents.find(r=>r.id==='mara'),d=Realm.diagnostics;
    rows.push({time:f.time,core:r.core,phase:r.motion.phase,visible:r.visible,walking:r.run.walking,pathLength:r.run.pathLength,mode:Realm.state.settings.cameraMode,paused:d.adventure.paused,camera:d.camera});
    if(r.core.x>=target){done=true;clearTimeout(timeout);resolve(rows);}
    else if(rows.length>=1800){done=true;clearTimeout(timeout);reject(Error('bounded frame count exceeded'));}
    else requestAnimationFrame(sample);
   }requestAnimationFrame(sample);
  })""",x)
  report['frames'].extend(rows)
 try:
  launch(True)
  if ev('()=>Realm.test.family().scene')=='home':page.locator('#world').focus();page.keyboard.press('e')
  check('ordinary home exit',ev('()=>Realm.test.family().scene') is None)
  settings(19)
  ev('()=>{for(let i=0;i<160;i++)Realm.test.step(.5);Realm.test.render()}')
  check('accepted Core route returned family home',ev('()=>Realm.test.family().residents.every(r=>r.run.inside)'))
  settings(10)
  report['acceptedRoute']=ev('()=>RealmCore.pathfind(RealmCore.LANDMARKS.find(l=>l.id==="home"),RealmCore.LANDMARKS.find(l=>l.id==="observatory"))')
  for _ in range(100):
   ev('()=>{Realm.test.step(.1);Realm.test.render()}')
   if ev('()=>Realm.state.residents.find(r=>r.id==="mara").x')>=-8.4:break
  check('accepted preparation before corridor',ev('()=>{const r=Realm.state.residents.find(r=>r.id==="mara");return r.x>=-8.5&&r.x<-8.2}'))
  check('production save',ev('()=>Realm.test.save()').get('ok'));store=ev('()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))');close()
  launch(False);check('exact whole-browser cold readback',ev('()=>window.__corridorCold')==store);pause(True)
  page.locator('#world').focus();page.keyboard.press('o')
  select=page.locator('[data-action="select-resident"][data-id="mara"]')
  if select.count():select.click()
  follow=page.locator('[data-action="follow"][data-id="mara"]')
  if follow.inner_text().strip()=='Follow':follow.click()
  if page.locator('#close-panel').is_visible():page.locator('#close-panel').click()
  page.wait_for_function('()=>{const r=Realm.state.residents.find(r=>r.id==="mara"),c=Realm.diagnostics.camera.center;return Math.hypot(r.x-c[0],r.z-c[2])<.25}',timeout=12000)
  image('APPROACH')
  check('ordinary sample starts before repaired corridor',ev('()=>Realm.state.residents.find(r=>r.id==="mara").x')<-7)
  pause(False);observe_until(-5.75);pause(True);image('BENCH')
  pause(False);observe_until(-3.9);pause(True);image('DEPARTURE')
  rows=report['frames'];corridor=[r for r in rows if -7<r['core']['x']<-4 and -2<r['core']['z']<1]
  check('ordinary continuous repaired corridor sampled',len(corridor)>=10 and min(r['core']['x'] for r in rows)<-7 and max(r['core']['x'] for r in rows)>=-3.9,len(corridor))
  check('every observed corridor frame readable and unpaused',all(r['visible'] and not r['paused'] and r['mode']=='adventure' and r['camera']['preset']=='adventure' and r['camera']['actualDistance']>=3.4 for r in corridor))
  # Core.advance returns false on an already-arrived tiny segment while shifting
  # that waypoint. Preserve that real path transition, not a perpetual-walk fiction.
  stopped=[(i,r) for i,r in enumerate(rows) if r in corridor and not r['walking']]
  check('any nonwalking frame is an accepted waypoint with actual continuation',all(
   r['pathLength']>0 and any(math.hypot(r['core']['x']-p['x'],r['core']['z']-p['z'])<=.011 for p in report['acceptedRoute'])
   and i+1<len(rows) and rows[i+1]['time']>r['time'] and rows[i+1]['core']['x']>r['core']['x']
   for i,r in stopped),[r for _,r in stopped])
  check('real displacement and articulated stride',rows[-1]['core']['x']>rows[0]['core']['x'] and len(set(r['phase'] for r in rows))>1)
  check('no browser or network errors',not report['browserErrors'] and not report['externalRequests'])
  report['status']='passed'
 except Exception as e:
  report['status']='failed';report['errors'].append(repr(e));traceback.print_exc()
 finally:
  try:close()
  except Exception as e:report['status']='failed';report['errors'].append('closure '+repr(e))
  server.shutdown();server.server_close();report['ownedServerClosed']=True;report['ownedBrowserDriverClosed']=all(closed.values())
  if not report['ownedBrowserDriverClosed']:report['status']='failed'
  N.write_new(OUT/'REPORT.json',report)
 if report['status']!='passed':raise SystemExit(1)
if __name__=='__main__':main()
