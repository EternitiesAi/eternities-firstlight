#!/usr/bin/env python3
"""Actual silent Writ campaign footage from a labelled command-earned prepared
checkpoint, using native import/UI/keys and ordinary RAF. No test flags,
simulation steps, commands, grants, position edits or camera-state writes.
Known-route automation is not human pacing or sustained GPU qualification.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import argparse, hashlib, json, math, os, subprocess, threading, time, traceback
from browser_support import launch_kwargs
ROOT=Path(__file__).resolve().parents[1]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--source',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--renderer',choices=['hardware','software'],default='hardware');a=p.parse_args()
 out=a.output.resolve();source=a.source.resolve()
 if not a.output.is_absolute() or os.name=='nt' and out.drive.lower()!='d:' or out.exists():p.error('Use a fresh absolute output directory on D: on Windows.')
 seed=json.loads(source.read_text(encoding='utf-8-sig'));r=seed.get('hellCampaign',{})
 if not r.get('accepted') or 'challenge-veyr' not in r.get('steps',[]) or 'warden-resolved' in r.get('steps',[]) or r.get('claimed'):p.error('Use the labelled command-earned prepared checkpoint before Warden victory.')
 out.mkdir(parents=True);(out/'SOURCE_WORLD.json').write_bytes(source.read_bytes());profile=out/'profile';profile.mkdir()
 files=list((ROOT/'src').glob('*'))+[ROOT/'build.py',Path(__file__).resolve()];hashes={str(f.relative_to(ROOT)):sha(f) for f in files if f.is_file()}
 report={'status':'running','method':__doc__,'source':str(source),'source_sha256':sha(source),'git_head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'git_status':subprocess.check_output(['git','status','--short'],cwd=ROOT,text=True).splitlines(),'html_sha256':sha(ROOT/'index.html'),'source_hashes':hashes,'checks':[],'events':[],'errors':[],'viewport':{'width':1440,'height':900},'human_acceptance':False,'performance_qualification':False}
 class Handler(SimpleHTTPRequestHandler):
  def __init__(self,*args,**kw):super().__init__(*args,directory=str(ROOT),**kw)
  def log_message(self,*args):pass
 server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();origin='http://127.0.0.1:'+str(server.server_port);report['origin']=origin
 from playwright.sync_api import sync_playwright
 started=time.monotonic();context=None;video=None;pw=None
 def check(name,ok,detail=None):
  report['checks'].append({'name':name,'ok':bool(ok),'detail':detail})
  if not ok:raise AssertionError(name+': '+str(detail))
 try:
  pw=sync_playwright().start()
  if pw:
   context=pw.chromium.launch_persistent_context(str(profile),**launch_kwargs(a.renderer),viewport=report['viewport'],record_video_dir=str(out),record_video_size=report['viewport']);page=context.new_page();video=page.video
   for blank in context.pages:
    if blank!=page:blank.close()
   context.route('**/*',lambda route:route.continue_() if route.request.url.startswith(origin+'/') else route.abort())
   page.on('pageerror',lambda e:report['errors'].append(str(e)))
   response=page.goto(origin+'/index.html',wait_until='load');page.wait_for_function('()=>!!window.Realm');page.wait_for_function('()=>getComputedStyle(document.querySelector("#loading")).opacity==="0"')
   check('exact served build',hashlib.sha256(response.body()).hexdigest()==report['html_sha256']);check('ordinary production surface',page.evaluate('()=>typeof Realm.test==="undefined"'))
   state=lambda:page.evaluate('()=>Realm.state');diag=lambda:page.evaluate('()=>Realm.diagnostics')
   def click(s):
    q=page.locator(s);check('unique native selector '+s,q.count()==1,q.count());q.click()
   def close():
    if page.locator('#rpg-window').evaluate('(e)=>e.open'):click('#rpg-close')
   def workspace(tab):
    close();page.keyboard.press('j')
    if tab=='hell-campaign':click('#rpg-content [data-rpg="hell-campaign-open"]')
    else:click('#rpg-tabs [data-rpg="open"][data-id="'+tab+'"]')
   def mark(label):
    d=diag();report['events'].append({'label':label,'seconds':time.monotonic()-started,'diagnostics':d,'ledger':state()['hellCampaign']});page.screenshot(path=str(out/(label+'.png')))
   def walk(id):
    workspace('hell-campaign');click('#rpg-content [data-rpg="hell-campaign-walk"][data-id="'+id+'"]');point=next(s for s in definition['steps'] if s['id']==id) if id!='claim' else definition['giver'];t0=time.monotonic();last=None;stable=None
    while time.monotonic()-t0<100:
     d=diag();pos=d['adventure']['player'];check('traveller alive while walking '+id,state()['adventure']['hp']>0);dist=math.hypot(pos['x']-point['x'],pos['z']-point['z']);motion=math.inf if last is None else math.hypot(pos['x']-last['x'],pos['z']-last['z'])
     if dist<2.8 and motion<.015:
      stable=stable or time.monotonic()
      if time.monotonic()-stable>.3:return
     else:stable=None
     last=pos;page.wait_for_timeout(120)
    raise TimeoutError('Native walking failed '+id)
   workspace('characters')
   with page.expect_file_chooser() as chooser:click('#rpg-content [data-rpg="chars-import"]')
   chooser.value.set_files(str(source));page.wait_for_selector('#rpg-content [data-rpg="chars-confirm-import"]');click('#rpg-content [data-rpg="chars-confirm-import"]');page.wait_for_function('()=>Realm.diagnostics.characters.active==="character-2"&&Realm.diagnostics.characters.writer')
   check('prepared ownership imported unchanged',state()['hellCampaign']==seed['hellCampaign']);close();click('#settings');page.locator('#quality').select_option('balanced');page.locator('#setting-timeFlow').uncheck();click('#close-panel')
   d=diag();report['browser']=context.new_cdp_session(page).send('Browser.getVersion');report['renderer']=d['renderer'];check('real WebGL2',d['mode']=='webgl2');check('hardware renderer when requested',a.renderer!='hardware' or not any(s in d['renderer'].lower() for s in ['swiftshader','software','llvmpipe']))
   workspace('worlds')
   if page.locator('#rpg-content [data-rpg="world-list"]').count():click('#rpg-content [data-rpg="world-list"]')
   click('#rpg-content [data-rpg="world-select"][data-id="hell"]');click('#rpg-content [data-rpg="world-preview"]');click('#rpg-content [data-rpg="world-confirm"]');page.wait_for_function('()=>Realm.diagnostics.scene==="world-hell"')
   definition=page.evaluate('()=>RealmHellCampaign.definition');mark('01_refuge');walk('warden-resolved');close();click('#rpg-hud [data-rpg="camera"][data-id="adventure"]');page.keyboard.press('Tab');check('explicit Warden selected',diag()['adventure']['tactics']['target']==definition['enemy']['id']);click('#target-framing');page.keyboard.press('1');mark('02_fight-start')
   t0=time.monotonic();last=0;frames=[];side_done=False;guarded=0;style_swapped=False;movement=None;returned=False
   def approach_with_keys():
    # Native corrective walking, never teleport or an autoattack chase. Keep
    # the successful sidestep through contact, then re-enter blade reach.
    for _ in range(16):
     d=diag();ad=d['adventure'];p=ad['player'];e=next((e for e in ad['enemies'] if e['id']==definition['enemy']['id']),None)
     if not e or math.hypot(e['x']-p['x'],e['z']-p['z'])<2.3:return
     if e['mode']!='recover':return
     yaw=d['camera']['yaw'];x=(e['x']-p['x'])*math.cos(yaw)-(e['z']-p['z'])*math.sin(yaw);z=(e['x']-p['x'])*math.sin(yaw)+(e['z']-p['z'])*math.cos(yaw)
     key=('d' if x>0 else 'a') if abs(x)>abs(z) else ('s' if z>0 else 'w')
     page.keyboard.down(key);page.wait_for_timeout(140);page.keyboard.up(key)
   while time.monotonic()-t0<150 and 'warden-resolved' not in state()['hellCampaign']['steps']:
    d=diag();ad=d['adventure'];enemy=next((e for e in ad['enemies'] if e['id']==definition['enemy']['id']),None);check('ordinary combat alive',state()['adventure']['hp']>0)
    if not enemy:break
    if enemy['mode']=='windup' and not side_done:
     movement={'health_before':state()['adventure']['hp'],'locked':enemy['strike'],'before':ad['player']};page.keyboard.down('d');page.wait_for_timeout(800);page.keyboard.up('d');movement['after']=diag()['adventure']['player'];side_done=True;mark('03_movement-response')
    elif enemy['mode']=='windup' and state()['adventure']['elapsed']>=ad['tactics']['cooldowns']['guard'] and state()['adventure']['stamina']>=20:page.keyboard.press('3');guarded+=1
    if enemy['mode']=='recover' and movement and not returned:
     movement.update({'health_after_contact':state()['adventure']['hp'],'contact_hit':enemy['contactHit'],'contact_at':enemy['contactAt'],'contact_frame':enemy['strike']});check('native sidestep avoids the real locked contact',enemy['contactAt'] is not None and enemy['contactHit'] is False and movement['locked']==enemy['strike'] and movement['health_before']==movement['health_after_contact']);returned=True
    if enemy['mode']=='recover' and returned and ad['weapon']['style']=='blade':approach_with_keys()
    if state()['adventure']['hp']<40 and state()['adventure']['tonics']:page.keyboard.press('6')
    now=time.monotonic()-t0
    if now-last>.3:frames.append({'wall':now,'enemy':enemy,'health':state()['adventure']['hp'],'arrows':ad['arrows'],'hits':ad['tactics']['hits']});last=now
    if enemy['mode']=='recover' and not style_swapped and now>3:page.keyboard.press('v');style_swapped=True;mark('04_diorama-combat')
    page.wait_for_timeout(100)
   check('actual combat earned resolution','warden-resolved' in state()['hellCampaign']['steps']);check('recorded native movement and camera exchange',returned and style_swapped);check('confirmed actual damage including possible companion contribution',any(h.get('n',0)>0 for h in diag()['adventure']['tactics']['hits']) or any(h.get('n',0)>0 for f in frames for h in f['hits']));report['combat']={'seconds':time.monotonic()-t0,'observations':frames,'guard_commands':guarded,'movement':movement,'native_camera_exchange':style_swapped};mark('05_resolved')
   walk('stabilize-service-engine');workspace('hell-campaign');click('#rpg-content [data-rpg="hell-campaign-step"][data-id="stabilize-service-engine"]');click('#rpg-content [data-rpg="hell-campaign-review"][data-id="unbind"]');check('preview leaves disposition undecided',state()['hellCampaign']['choice'] is None);mark('06_choice-preview');click('#rpg-content [data-rpg="hell-campaign-confirm"][data-id="unbind"]');check('explicit choice saved',state()['hellCampaign']['choice']=='unbind');close();mark('07_release-fixture')
   walk('verify-route');workspace('hell-campaign');click('#rpg-content [data-rpg="hell-campaign-step"][data-id="verify-route"]');close();mark('08_verified');walk('claim');workspace('hell-campaign');before=state();click('#rpg-content [data-rpg="hell-campaign-claim"]');paid=state();check('one exact fixed payment',paid['hellCampaign']['claimed'] and paid['adventure']['coins']-before['adventure']['coins']==20 and paid['adventure']['ore']-before['adventure']['ore']==4);mark('09_claimed-recognition');close();mark('10_refuge-return')
   page.reload(wait_until='load');page.wait_for_function('()=>!!window.Realm');page.wait_for_function('()=>getComputedStyle(document.querySelector("#loading")).opacity==="0"');check('native reload preserves paid choice',state()['hellCampaign']==paid['hellCampaign']);check('no browser errors',not report['errors'],report['errors']);check('frozen runtime inputs',hashes=={str(f.relative_to(ROOT)):sha(f) for f in files if f.is_file()});mark('11_native-reload');report['status']='passed'
 except Exception:
  report['status']='failed';report['failure']=traceback.format_exc()
 finally:
  try:
   if context:context.close()
   if video:report['raw_video']=str(video.path())
  except Exception:report['cleanup_failure']=traceback.format_exc();report['status']='failed'
  finally:
   if pw:pw.stop()
  server.shutdown();server.server_close();report['wall_seconds']=time.monotonic()-started;(out/'REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps({'status':report['status'],'checks':len(report['checks']),'seconds':report['wall_seconds'],'video':report.get('raw_video'),'failure':report.get('failure')},indent=2))
 return 0 if report['status']=='passed' else 1
if __name__=='__main__':raise SystemExit(main())
