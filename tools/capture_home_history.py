"""Record real-time native home crafting and placement in an isolated profile.

Imports an explicitly command-earned save as a separate character. Visible workbench/gathering routes, exact-cost craft and deliberate placement
buttons plus V own this home loop after previously earned local commissions. No test mode, direct rule command, tick/position/HP/inventory edit
or fake participant is used. Optional hardware mode must report NVIDIA rather
than silently substituting software. This is a known-route engineering tour,
not novice pacing, human enjoyment or complete world/performance qualification.
"""
from pathlib import Path
from contextlib import ExitStack
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
import argparse,hashlib,json,math,os,subprocess,sys,tempfile,threading,time,traceback
from playwright.sync_api import sync_playwright
from browser_support import launch_kwargs

# Frozen original membership; the supplied carrier is covered by its own suites.
OLD_LOCAL_IDS = ('heaven-propagation-bed-v1', 'hell-refuge-water-v1',
                 'atlantis-bellglass-lamp-v1', 'cosmos-drawing-shelf-v1')
NEW_LOCAL_ID = 'earth-first-load-through-v1'

def fresh_consignment(world):
 records=world['localLife']['records'];record=records.get(NEW_LOCAL_ID)
 return (set(records)==set((*OLD_LOCAL_IDS,NEW_LOCAL_ID)) and isinstance(record,dict)
         and set(record)=={'accepted','choice','steps','claimed'}
         and record['accepted'] is False and record['choice'] is None
         and isinstance(record['steps'],list) and len(record['steps'])==0
         and record['claimed'] is False)

ROOT=Path(__file__).resolve().parents[1]
def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--fixture',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);ap.add_argument('--renderer',choices=['software','hardware'],default='software');args=ap.parse_args()
 out=args.output.resolve();out.mkdir(parents=True,exist_ok=True);fixture=args.fixture.resolve();sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
 report={'method':__doc__,'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'html_sha256':sha(ROOT/'index.html'),'harness_sha256':sha(Path(__file__)),'fixture_sha256':sha(fixture),'source_role':'Authoring source; Git HEAD can be the base before commit. HTML and harness hashes identify this recording.', 'renderer_requested':args.renderer,'checks':[],'routes':[],'frames':{},'errors':[],'browser_errors':[],'position_edits':0,'resource_grants':0,'accelerated_ticks':0,'human_pacing':False}
 class Handler(SimpleHTTPRequestHandler):
  def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
  def log_message(self,*a):pass
 server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();report['origin']=url=f'http://127.0.0.1:{server.server_port}/index.html'
 context=None;page=None;video=None;started=time.monotonic()
 def check(name,ok,data=None):
  report['checks'].append({'name':name,'passed':bool(ok),'evidence':data});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
  if not ok:raise AssertionError(name)
 def ev(js,arg=None):return page.evaluate(js,arg)
 def state():return ev('Realm.state')
 def diag():return ev('Realm.diagnostics')
 def close():
  if page.locator('#rpg-window').evaluate('e=>e.open'):page.locator('#rpg-close').click()
  if page.locator('#drawer').evaluate('e=>e.classList.contains("open")'):page.locator('#close-panel').click()
 def workspace(tab):
  close();page.keyboard.press('j');page.locator('#rpg-tabs [data-rpg="open"][data-id="'+tab+'"]').click()
 def local():
  workspace('journal');page.locator('[data-rpg="civic-open"][data-id="cosmos"]').first.click()
 def route(selector,target,label,tolerance=2.6):
  start=time.monotonic();page.locator(selector).first.click();samples=[]
  while time.monotonic()-start<150:
   d=diag();p=d['adventure']['player'];samples.append({'x':p['x'],'z':p['z'],'hp':state()['adventure']['hp']})
   if math.hypot(p['x']-target['x'],p['z']-target['z'])<tolerance:break
   page.wait_for_timeout(250)
  else:raise TimeoutError('Normal-time visible route did not arrive: '+label)
  check('normal route reaches '+label,samples[-1]['hp']>0 and math.hypot(samples[-1]['x']-target['x'],samples[-1]['z']-target['z'])<tolerance)
  report['routes'].append({'label':label,'method':'Visible route button; ordinary RAF/pathfinder','wall_seconds':time.monotonic()-start,'samples':samples})
 def shot(label):page.screenshot(path=str(out/(label+'.png')))
 def measure(label):
  values=ev('''()=>new Promise(resolve=>{const values=[];let last=null;const frame=t=>{if(last!==null)values.push(t-last);last=t;if(values.length<600)requestAnimationFrame(frame);else resolve(values);};requestAnimationFrame(frame);})''');ordered=sorted(values)
  report['frames'][label]={'method':'600 ordinary requestAnimationFrame intervals while Playwright video recording is enabled; recording workload only, not isolated GPU performance or inferred FPS','raw_ms':values,'p50_ms':ordered[math.ceil(.5*len(values))-1],'p95_ms':ordered[math.ceil(.95*len(values))-1],'p99_ms':ordered[math.ceil(.99*len(values))-1],'max_ms':max(values),'above_33_333_ms':sum(v>1000/30 for v in values),'above_50_ms':sum(v>50 for v in values),'scene':diag()['scene'],'camera':diag()['camera'],'renderer':diag()['renderer'],'quality':state()['settings']['quality']}
 try:
  with sync_playwright() as pw,ExitStack() as cleanup:
   profile=cleanup.enter_context(tempfile.TemporaryDirectory(prefix='local-life-recording-',dir=out))
   kw=launch_kwargs(args.renderer);kw['headless']=True
   context=pw.chromium.launch_persistent_context(profile,**kw,viewport={'width':1280,'height':800},record_video_dir=str(out/'raw-video'),record_video_size={'width':1280,'height':800})
   def release():
    nonlocal context
    if context:
     try:
      if page and (sys.exc_info()[0] is not None or report['errors']):
       try:
        shot('FAILURE');report['last_ui']={'url':page.url,'text':page.locator('body').inner_text(),'diagnostics':diag(),'state':state()}
       except Exception as e:report['errors'].append('Failure inspection: '+str(e))
     finally:
      try:
       if page and not page.is_closed():
        # beforeunload closure returns before the close event; save_as requires
        # the page closed while the browser connection is still available.
        with page.expect_event('close'):page.close(run_before_unload=True)
       save_video()
      finally:context.close();context=None
   def save_video():
    if video:
     try:video.save_as(str(out/'HOME_NORMAL_UI.webm'));report['video']={'path':'HOME_NORMAL_UI.webm','sha256':sha(out/'HOME_NORMAL_UI.webm'),'bytes':(out/'HOME_NORMAL_UI.webm').stat().st_size}
     except Exception as e:report['errors'].append('Video: '+str(e));report['status']='failed'
   cleanup.callback(release)
   page=context.pages[0] if context.pages else context.new_page();video=page.video;page.on('pageerror',lambda e:report['browser_errors'].append(str(e)));response=page.goto(url,wait_until='load',timeout=60000);page.wait_for_function('()=>!!window.Realm',polling=100)
   check('served exact current HTML',hashlib.sha256(response.body()).hexdigest()==report['html_sha256']);check('normal scheduling has no test or capture hooks',ev('!Realm.test&&!window.__ETERNITIES_TEST_MODE&&!window.__ETERNITIES_CAPTURE_MODE'))
   report['browser']=context.browser.version if context.browser else ev('navigator.userAgent');report['user_agent']=ev('navigator.userAgent');report['renderer']=diag()['renderer'];check('requested renderer actually owns WebGL2',diag()['mode']=='webgl2' and (('NVIDIA' in str(report['renderer']) and 'SwiftShader' not in str(report['renderer'])) if args.renderer=='hardware' else 'SwiftShader' in str(report['renderer'])),report['renderer'])
   workspace('characters');old_key=ev('localStorage.getItem(RealmCore.KEY)')
   with page.expect_file_chooser() as chooser:page.locator('[data-rpg="chars-import"]').click()
   chooser.value.set_files(str(fixture));page.wait_for_selector('[data-rpg="chars-confirm-import"]');page.locator('[data-rpg="chars-confirm-import"]').click();page.wait_for_function('()=>Realm.diagnostics.characters.active==="character-2"&&Realm.diagnostics.characters.writer',polling=100)
   initial=state();check('exact original catalogue membership',ev('RealmEarthConsignmentData.OLD_IDS')==list(OLD_LOCAL_IDS));check('separate supplied load remains fresh in the earned home fixture',fresh_consignment(initial));check('earned import has four claimed commissions and no home pieces',len(initial['homeHistory']['owned'])==0 and all(initial['localLife']['records'][id]['claimed'] for id in OLD_LOCAL_IDS));close();page.locator('#settings').click();page.locator('#quality').select_option('balanced' if args.renderer=='hardware' else 'low');page.locator('#close-panel').click()
   ev('label=>{const el=document.createElement("div");el.textContent="ACTUAL HOME PLAYTHROUGH · NORMAL TIME · "+label;el.style="position:fixed;bottom:4px;right:8px;z-index:100000;background:#193236e8;color:#e9eddd;padding:5px 8px;font:10px sans-serif;pointer-events:none";document.body.append(el);}',args.renderer.upper())
   def room():
    workspace('journal');page.locator('[data-rpg="panel"][data-id="retreat"]').first.click()
   room();shot('01-home-designs');page.wait_for_timeout(1800);page.locator('[data-action="memory-pin"][data-id="memory-farroad"]').click();check('explicit home pin leaves equipment project and commissions intact',state()['homeHistory']['pinned']=='memory-farroad' and state()['adventure']['pursuit']==initial['adventure']['pursuit'] and state()['localLife']==initial['localLife'])
   for definition in ev('RealmHomeHistory.definitions.filter(d=>d.source!=="bridgeCommunity")'):
    kind=definition['id'];room()
    for material,n in definition['cost'].items():
     if state()['sandbox']['inventory'][material]<n:
      start=time.monotonic();page.locator('[data-action="memory-gather"][data-id="'+material+'"]').first.click()
      while time.monotonic()-start<150 and state()['sandbox']['inventory'][material]<n:page.wait_for_timeout(300)
      check('normal-time visible renewable gathering '+material,state()['sandbox']['inventory'][material]>=n);room()
    route('[data-action="memory-bench"]',{'x':11,'z':9},'outdoor workbench for '+kind,.2);room();before=state();page.locator('[data-action="memory-craft"][data-id="'+kind+'"]').click();after=state();check('visible once-only craft '+kind,kind in after['homeHistory']['owned'] and all(after['sandbox']['inventory'][k]==before['sandbox']['inventory'][k]-n for k,n in definition['cost'].items()) and after['retreat']==before['retreat'] and after['adventure']['equipment']==before['adventure']['equipment']);page.wait_for_timeout(650)
   shot('02-four-made-unplaced');room();route('[data-action="retreat-walk"]',{'x':37,'z':0},'your lantern house',.15);page.keyboard.press('e');page.wait_for_function('()=>Realm.diagnostics.scene==="retreat"');check('ordinary UI opens the real retreat',diag()['scene']=='retreat')
   for i,definition in enumerate(ev('RealmHomeHistory.definitions.filter(d=>d.source!=="bridgeCommunity")')):
    kind=definition['id'];room();page.locator('[data-action="slot"][data-id="'+['n','sw','se','w'][i]+'"]').click();page.locator('[data-action="memory-propose"][data-id="'+kind+'"]').click();page.wait_for_timeout(700);page.locator('[data-action="memory-place"]').click();check('deliberate placement '+kind,len([i for i in state()['retreat']['items'] if i['kind']==kind])==1)
   close();page.wait_for_timeout(4500)
   for projection in ['orthographic','perspective']:
    if diag()['camera']['projection']!=projection:page.keyboard.press('v')
    page.keyboard.press('r');page.wait_for_function('v=>Realm.diagnostics.camera.projection===v',arg=projection);page.wait_for_timeout(500);shot('03-room-'+projection);measure('room-'+projection)
   room();page.locator('[data-action="slot"][data-id="sw"]').click();page.locator('[data-action="remove-furniture"]').click();check('remove keeps the owned piece',state()['homeHistory']['owned']==[d['id'] for d in ev('RealmHomeHistory.definitions.filter(d=>d.source!=="bridgeCommunity")')]);page.locator('[data-action="layout-undo"]').click();close();page.wait_for_timeout(1800);shot('04-room-final');check('gear story local claims and old browser key retained',state()['adventure']['equipment']==initial['adventure']['equipment'] and state()['adventure']['arsenal']==initial['adventure']['arsenal'] and state()['localLife']==initial['localLife'] and ev('localStorage.getItem(RealmCore.KEY)')==old_key);report['final_world']=state();check('no runtime errors',not diag()['errors'] and not report['browser_errors']);report['status']='passed'
 except Exception:
  report['status']='failed';report['errors'].append(traceback.format_exc());print(report['errors'][-1])
 finally:
  server.shutdown();server.server_close()
  report['wall_seconds']=time.monotonic()-started;report['passed']=sum(c['passed'] for c in report['checks']);report['failed']=sum(not c['passed'] for c in report['checks']);(out/'REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
 print(json.dumps({'status':report['status'],'passed':report['passed'],'failed':report['failed'],'output':str(out)},indent=2));return 0 if report['status']=='passed' else 1
if __name__=='__main__':raise SystemExit(main())
