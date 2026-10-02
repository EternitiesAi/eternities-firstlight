#!/usr/bin/env python3
"""Normal-RAF realm gameplay from labelled command-earned sources on the RTX desktop.
No artificial ticks, position edits, damage or reward grants occur during filming.
Menu reading pauses through the production UI. Setup imports the named earned save
and adjusts only time/quality/camera. Short RAF samples are presentation cadence,
not sustained throughput or human enjoyment. Footage is silent browser video.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
import argparse,hashlib,json,statistics,threading,time,traceback
from playwright.sync_api import sync_playwright
from browser_support import launch_kwargs
ROOT=Path(__file__).resolve().parents[1]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--variant',choices=['heaven','hell','cosmos','fit-veteran'],required=True);parser.add_argument('--source',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
 out=args.output.resolve();source=args.source.resolve()
 if out.drive.lower()!='d:' or not args.output.is_absolute():parser.error('heavy footage must stay on D:')
 if out.exists() and any(out.iterdir()):parser.error('preserve previous takes: choose an empty output directory')
 initial=json.loads(source.read_text(encoding='utf-8'));assert initial['adventure']['started'];out.mkdir(parents=True,exist_ok=True)
 report={'method':__doc__,'variant':args.variant,'source':str(source),'source_sha256':sha(source),'html_sha256':sha(ROOT/'index.html'),'viewport':{'width':1280,'height':720},'quality':'balanced','events':[],'samples':[],'browser_errors':[],'external_requests':[],'human_acceptance':False,'sustained_performance_qualification':False,'artificial_ticks':0,'position_edits':0,'manual_damage':0,'inventory_grants':0}
 class Handler(SimpleHTTPRequestHandler):
  def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
  def log_message(self,*a):pass
 server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();origin=f'http://127.0.0.1:{server.server_port}';started=time.monotonic();browser=context=page=None
 try:
  with sync_playwright() as pw:
   try:
    browser=pw.chromium.launch(**launch_kwargs('hardware'));report['browser']=browser.version;context=browser.new_context(viewport=report['viewport'],record_video_dir=str(out),record_video_size=report['viewport'])
    def route(request):
     if request.request.url.startswith(origin+'/'):request.continue_()
     else:report['external_requests'].append(request.request.url);request.abort()
    context.route('**/*',route);page=context.new_page();page.add_init_script('window.__ETERNITIES_TEST_MODE=true;');page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
    response=page.goto(origin+'/index.html');page.wait_for_function('()=>!!window.Realm');page.wait_for_function('()=>getComputedStyle(document.querySelector("#loading")).opacity==="0"');assert sha(ROOT/'index.html')==hashlib.sha256(response.body()).hexdigest();page.evaluate('(w)=>Realm.test.replace(w)',initial);page.evaluate('Realm.test.quality("balanced");Realm.test.setTime(17)')
    report['renderer']=page.evaluate('Realm.diagnostics.renderer');assert 'NVIDIA' in report['renderer'] and '3080' in report['renderer']
    ev=lambda js,arg=None:page.evaluate(js,arg);state=lambda:ev('Realm.state')
    def close():
     if page.locator('#rpg-window').evaluate('(e)=>e.open'):page.locator('#rpg-close').click()
    def mark(name):
     d=ev('Realm.diagnostics');assert not ev('document.hidden');event={'name':name,'seconds':time.monotonic()-started,'scene':d['scene'],'player':d['adventure']['player'],'camera':d['camera'],'paused':d['adventure']['paused'],'realm_trails':state()['realmTrails']};report['events'].append(event);print(name,round(event['seconds'],2),flush=True)
    def shot(name):page.screenshot(path=str(out/(name+'.png')));mark(name)
    def view(mode,yaw=.25,distance=9):
     if (ev('Realm.diagnostics.camera.projection')=='orthographic')!=(mode=='diorama'):page.keyboard.press('v')
     ev('v=>Realm.test.view(v)',{'yaw':yaw,'elevation':.66 if mode=='diorama' else .18,'half':16,'distance':distance,'zoom':16/17.5,'overview':False});page.wait_for_timeout(350);mark(mode+' camera')
    def walk(x,z):
     close();assert ev('([x,z])=>Realm.test.move(x,z)',[x,z])['ok'];page.wait_for_function('()=>Realm.test.path.length===0',timeout=90000);p=ev('Realm.diagnostics.adventure.player');assert ((p['x']-x)**2+(p['z']-z)**2)**.5<.3;assert state()['adventure']['hp']>0;mark('normal walk '+str([x,z]))
    def local():close();page.locator('#tracked-open').click()
    def enter(realm):
     walk(18,6);page.keyboard.press('j');page.locator('[data-rpg="open"][data-id="worlds"]').click()
     if page.locator('[data-rpg="world-list"]').count():page.locator('[data-rpg="world-list"]').click()
     page.locator('[data-rpg="world-select"][data-id="'+realm+'"]').click();page.locator('[data-rpg="world-preview"]').click();page.locator('[data-rpg="world-confirm"]').click();mark('deliberate crossing '+realm)
    def act(d,id):
     s=next(s for s in d['steps'] if s['id']==id);q=ev('(s)=>RealmTrailsUI.approach(Realm.test.worldContext().sim,s)',s);walk(q['x'],q['z']);page.keyboard.press('e');page.locator('[data-rpg="trail-step"][data-id="'+id+'"]').click();assert id in state()['realmTrails']['records'][d['id']]['steps'];close();mark('real interaction '+id)
    def claim(d):
     walk(d['giver']['x'],d['giver']['z']+1.7);page.keyboard.press('e');page.locator('[data-rpg="trail-claim"]').click();assert state()['realmTrails']['records'][d['id']]['claimed'];shot('explicit-claim');close()
    def measure(label):
     data=ev('''async()=>{const xs=[];let last=null;await new Promise(done=>{function frame(t){if(last!==null)xs.push(t-last);last=t;if(xs.length<180)requestAnimationFrame(frame);else done();}requestAnimationFrame(frame);});const d=Realm.diagnostics,c=document.querySelector('#world');return{intervals_ms:xs,scene:d.scene,projection:d.camera.projection,hidden:document.hidden,paused:d.adventure.paused,renderer:d.renderer,drawing_buffer:{width:c.width,height:c.height},metrics:d.metrics};}''');assert not data['paused'] and not data['hidden'];xs=sorted(data['intervals_ms']);data.update(label=label,median_ms=statistics.median(xs),p95_nearest_rank_ms=xs[170],maximum_ms=max(xs),over_33_333_ms=sum(x>33.333 for x in xs));report['samples'].append(data)
    if args.variant in ['heaven','hell']:
     enter(args.variant);d=ev('(realm)=>RealmTrails.definitions().find(d=>d.realm===realm)',args.variant);r=state()['realmTrails']['records'][d['id']];assert r['accepted']
     if args.variant=='heaven':
      assert not d['enemy']['defeatStep'] in r['steps']
      for s in d['steps']:
       if s['id'] in d['enemy']['spawnAfter'] and s['id'] not in state()['realmTrails']['records'][d['id']]['steps']:act(d,s['id'])
      e=d['enemy'];walk(e['x'],e['z']+12);view('third',yaw=.1,distance=8);walk(e['x'],e['z']+4);page.keyboard.press('Tab');assert ev('Realm.diagnostics.adventure.tactics.target')==e['id'];page.keyboard.press('1');mark('real Tab and stationary autoattack')
      began=time.monotonic();guards=0
      while d['enemy']['defeatStep'] not in state()['realmTrails']['records'][d['id']]['steps']:
       assert time.monotonic()-began<90 and state()['adventure']['hp']>0
       data=ev('()=>{const sim=Realm.test.worldContext().sim;return{cue:RealmCombat.threat(sim),ready:RealmCombat.readiness(sim),hp:sim.state.adventure.hp,guardCD:RealmCombat.runtime(sim).cooldowns.guard,elapsed:sim.state.adventure.elapsed,stamina:sim.state.adventure.stamina}}')
       if data['cue'] and data['cue']['phase']=='windup' and data['stamina']>=20 and data['elapsed']>=data['guardCD']:page.keyboard.press('3');guards+=1
       page.wait_for_timeout(70)
      report['actual_guard_inputs']=guards;shot('core-folded');measure('Heaven apron third-person after real bow fight');act(d,'garden-repair');view('diorama',yaw=.75);shot('garden-return-arm-diorama');view('third',yaw=.65);shot('garden-return-arm-third');claim(d)
     else:
      assert d['enemy']['defeatStep'] in r['steps'] and d['escort']['startStep'] not in r['steps'];act(d,d['escort']['startStep']);local();page.locator('[data-rpg="trail-escort-wait"]').click();shot('neris-wait');page.locator('[data-rpg="trail-escort-follow"]').click();close();view('third',yaw=.35,distance=10)
      for index,p in enumerate(d['escort']['route'][1:],1):
       walk(p['x'],p['z']);page.wait_for_function('([q,n])=>Realm.state.realmTrails.records[q].checkpoint>=n',arg=[d['id'],index],timeout=45000)
       if index==2:view('diorama',yaw=.85);shot('walked-rescue-diorama');view('third',yaw=.35)
      r=state()['realmTrails']['records'][d['id']];assert r['checkpoint']==5 and not r['assisted'];walk(-10,27);shot('neris-safe-separate');measure('Hell refuge with actual arrived Neris');claim(d)
    elif args.variant=='cosmos':
     enter('cosmos');d=ev('RealmTrails.definitions().find(d=>d.realm==="cosmos")');walk(d['giver']['x'],d['giver']['z']);local();shot('cosmos-terms');page.locator('[data-rpg="trail-accept"]').click();close();view('third',yaw=.3)
     for s in d['steps']:
      q=ev('(s)=>RealmTrailsUI.approach(Realm.test.worldContext().sim,s)',s);walk(q['x'],q['z']);page.keyboard.press('e')
      if s.get('instrument'):
       inp=page.locator('[data-trail-dial="'+s['id']+'"]');inp.press('Home')
       for i in range(round(s['instrument']['target']*10)):inp.press('ArrowRight')
       shot(s['id']+'-aligned')
      page.locator('[data-rpg="trail-step"][data-id="'+s['id']+'"]').click();assert s['id'] in state()['realmTrails']['records'][d['id']]['steps'];close()
      if s.get('instrument'):view('diorama',yaw=.6);shot(s['id']+'-world-diorama');view('third',yaw=.4);shot(s['id']+'-world-third');measure('Cosmos '+s['id'])
     claim(d)
    else:
     assert initial['adventure']['equipment']['weapon']=='dawn_edge' and initial['adventure']['realmCraft']['weapon'] is None
     walk(11,9);page.keyboard.press('k');page.locator('[data-rpg="trail-fit-preview"][data-id="dawn_edge"]').click();shot('veteran-48-to-51-preview');old=state();attack=ev('RealmAdventure.stats(Realm.state.adventure).attack');page.locator('[data-rpg="trail-fit-confirm"][data-id="dawn_edge"]').click();close();after=state();assert ev('RealmAdventure.stats(Realm.state.adventure).attack')==attack+3;assert old['adventure']['equipment']==after['adventure']['equipment'];report['fitting']={'before':attack,'after':attack+3,'weapon':'dawn_edge'}
     view('third',yaw=2.7,distance=5);shot('veteran-fitted-band-third');view('diorama',yaw=1.3);shot('veteran-fitted-band-diorama');walk(15,7);assert ev('Realm.test.adventure("hardware-fitting-enter","starter-enter")')['ok'];walk(-5,11.5);view('third',yaw=2.8,distance=6);assert ev('Realm.test.adventure("hardware-practice-target","target-select",{id:"river-practice"})')['ok'];page.keyboard.press('1');page.wait_for_function('()=>RealmAdventure.runtime(Realm.test.worldContext().sim).training?.lastDamage===51');shot('actual-51-damage-practice');report['measured_practice_damage']=51;page.keyboard.press('Tab');measure('Fitted campaign blade at real practice target')
    final=state();(out/'FINAL_WORLD.json').write_text(json.dumps(final,indent=2)+'\n',encoding='utf-8');assert not report['browser_errors'] and not ev('Realm.diagnostics.errors');assert not report['external_requests'];assert sha(ROOT/'index.html')==report['html_sha256'];assert sha(source)==report['source_sha256'];report['status']='passed';report['normal_time_seconds']=time.monotonic()-started
   finally:
    if context:
     context.close()
     if page and page.video:report['video_path']=str(page.video.path())
    if browser:browser.close()
 except Exception:
  report['status']='failed';report['traceback']=traceback.format_exc();raise
 finally:
  server.shutdown();server.server_close();(out/'REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
if __name__=='__main__':main()
