"""Firstlight10 browser acceptance: exact offline HTML with actual UI, keyboard,
validated path commands and accelerated simulation. Initial state is a command-
earned ChapterIII completion. Known-answer completed/commission fixtures are
separate and labelled. Map-backed localStorage is not native persistence proof.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs, read_utf8
import json,hashlib,math,traceback
R=Path(__file__).resolve().parents[1];O=R/'evidence10/browser';O.mkdir(parents=True,exist_ok=True)
HTML=read_utf8(R/'FIRSTLIGHT_VALLEY.html');report={'method':__doc__,'build_sha256':hashlib.sha256(HTML.encode()).hexdigest(),'checks':[],'errors':[]};errors=[];requests=[]
def ck(name,v):
 report['checks'].append({'name':name,'passed':bool(v)});print(('PASS ' if v else 'FAIL ')+name,flush=True)
 if not v:raise AssertionError(name)
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(**chromium_launch_kwargs())
  ctx=b.new_context(viewport={'width':1440,'height':960},offline=True,accept_downloads=True)
  def spawn(save,context=ctx,capture=True,fallback=False):
   q=context.new_page();q.on('pageerror',lambda e:errors.append(str(e)));q.on('request',lambda r:requests.append(r.url));q.on('dialog',lambda d:d.accept())
   q.evaluate('''({save,capture,fallback})=>{window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=capture;window.ST=new Map([['eternities.realm10.save.v9',JSON.stringify(save)]]);Object.defineProperty(window,'localStorage',{value:{getItem:k=>ST.get(k)||null,setItem:(k,v)=>ST.set(k,String(v)),removeItem:k=>ST.delete(k)}});if(fallback){let old=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return t==='webgl2'?null:old.call(this,t,...a)}}}''',{'save':save,'capture':capture,'fallback':fallback})
   q.set_content(HTML,wait_until='load');q.wait_for_function('window.Realm');q.evaluate('Realm.test.quality("low");Realm.test.render()');return q
  initial=json.loads(read_utf8(R/'examples/REALM10_CROSSING_READY_EARNED.json'));p=spawn(initial)
  ev=lambda js,arg=None:p.evaluate(js,arg)
  state=lambda:ev('Realm.state');dg=lambda:ev('Realm.diagnostics')
  def render():ev('Realm.test.render()')
  def step(t):ev('(t)=>{Realm.test.step(t);Realm.test.render()}',t)
  def close():
   if p.locator('#rpg-window').evaluate('(e)=>e.open'):p.click('#rpg-close')
  def key(k):p.keyboard.press(k);render()
  def act(kind,id):
   sel='[data-rpg="'+kind+'"][data-id="'+id+'"]';root=p.locator('#rpg-window') if p.locator('#rpg-window').evaluate('(e)=>e.open') else p;root.locator(sel).first.click();render()
  def advance_path():
   ev('()=>{for(let i=0;i<6000&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render()}')
  def walk(x,z):
   close();r=ev('([x,z])=>Realm.test.move(x,z)',[x,z]);ck('Valid route '+str((x,z)),r['ok']);advance_path();q=dg()['adventure']['player'];ck('Reached '+str((x,z)),math.hypot(q['x']-x,q['z']-z)<.2)
  def place(id):
   close();key('m');act('cross-walk',id);advance_path();ck('Map route closes menu: '+id,not p.locator('#rpg-window').evaluate('(e)=>e.open'))
  def image(name,view=None):
   if view:ev('(v)=>Realm.test.view(v)',view)
   ev('Realm.test.quality("balanced");Realm.test.render()');p.wait_for_timeout(100);p.screenshot(path=str(O/name));ev('Realm.test.quality("low");Realm.test.render()')
  ck('Edition10 and migrated world/adventure versions',dg()['version']=='10.0.0' and state()['version']==9 and state()['adventure']['version']==12)
  ck('Existing three chapters preserved',state()['adventure']['beacon']['complete'] and not state()['adventure']['crossing']['entered'])
  ck('Camera cutaway default enabled',dg()['cutaway']['enabled'])
  key('m');ck('M opens a real map workspace',p.locator('#rpg-heading').inner_text()=='The roads you know')
  ck('Map pauses local simulation',dg()['adventure']['paused']);ck('Map is usable size',p.locator('#cross-atlas-map').bounding_box()['height']>400)
  ck('Undiscovered village travel is disabled',p.locator('[data-rpg="cross-travel"][data-id="bellweather"]').is_disabled())
  old=state()['adventure'];act('cross-travel','sunward');ck('Known anchor travels to Sunward',dg()['scene']=='road')
  ck('Travel no healing or money grant',state()['adventure']['hp']==old['hp'] and state()['adventure']['coins']==old['coins'])
  place('cross-enter');key('e');ck('Northern gate loads village',dg()['scene']=='crossing' and state()['adventure']['crossing']['entered'])
  ck('Village geometry real instance count',dg()['metrics']['instances']>1800)
  ck('Chapter tracker advances to Bell Road','THE BELL ROAD' in p.locator('#tracked-chapter').inner_text())
  ck('New local minimap visible',p.locator('#minimap').is_visible())
  place('waystone');key('e');ck('Waystone opens local service',p.locator('#rpg-heading').inner_text()=='Bellweather waystone');act('cross-do','cross-attune');ck('Attunement saved',state()['adventure']['crossing']['attuned']);close()
  place('keeper');key('e');ck('Rowan contextual dialogue','Rowan' in p.locator('#rpg-heading').inner_text());ck('No chapters completed by arriving',not state()['adventure']['crossing']['complete']);act('cross-do','cross-meet');ck('Keeper quest accepted',state()['adventure']['crossing']['met']);image('FIRSTLIGHT_10_Rowan.png');close()
  key('m');ck('Local numbered routes visible',p.locator('.cross-atlas-list > button[data-rpg="cross-walk"]').count()==10);ck('Explicit fox search disclosed',p.locator('[data-rpg="cross-do"][data-id="cross-seek"]').count()==1);image('FIRSTLIGHT_10_Map.png');close()
  place('inscription');key('e');ck('Clue supplies textual order','Leaf takes the first breath' in p.locator('#rpg-content').inner_text());act('cross-do','cross-inspect');ck('Inscription persists',state()['adventure']['crossing']['inscription']);close();key('j');ck('Journal retains clue','Wave carries it onward' in p.locator('#rpg-content').inner_text());ck('Journal has six chapter objectives',p.locator('.cross-steps li').count()==6);close()
  place('shop');key('e');ck('Merchant service clear','Edda' in p.locator('#rpg-heading').inner_text());old=state()['adventure'];act('cross-trade','coat');ck('Merchant exact payment and unique ownership',state()['adventure']['coins']==old['coins']-24 and state()['adventure']['owned'].count('keeper_coat')==1);ck('Duplicate purchase button disabled',p.locator('[data-rpg="cross-trade"][data-id="coat"]').is_disabled());image('FIRSTLIGHT_10_Merchant.png');act('open','equipment');act('item','gear:keeper_coat');ck('Coat has real comparison',p.locator('.compare-stats').is_visible());hp=state()['adventure']['hp'];act('equip','keeper_coat');ck('Equip alters guard without free healing',state()['adventure']['equipment']['armor']=='keeper_coat' and state()['adventure']['hp']==hp);close()
  place('inn');key('e');ck('Inn explicitly a porch service','porch' in p.locator('#rpg-content').inner_text().lower());act('cross-do','cross-rest');ck('Inn restores resources',state()['adventure']['hp']==dg()['adventure']['stats']['maxHP'] and state()['adventure']['tonics']==3);close()
  place('board');key('e');ck('Two commissions displayed',p.locator('[data-rpg="cross-project"]').count()==2);ck('Commission shows costs','Four' in p.locator('#rpg-content').inner_text() or 'plank' in p.locator('#rpg-content').inner_text().lower());close()
  place('workbench');key('e');ck('Public forge uses unified crafting','workbench' in p.locator('#rpg-heading').inner_text().lower());close()
  walk(1,10);ck('Context prompt shows Map key away from a service',p.locator('#context kbd').inner_text()=='M');p.click('#context');ck('Clicking Map prompt opens map',p.locator('#rpg-window').evaluate('(e)=>e.open'));close();image('FIRSTLIGHT_10_Bellweather.png',{'half':18,'yaw':.34,'elevation':.89,'overview':False})
  place('thicket');key('m');ck('Briar explicit seek now available',not p.locator('[data-rpg="cross-do"][data-id="cross-seek"]').is_disabled());act('cross-do','cross-seek');ck('Search starts without teleporting fox',dg()['adventure']['crossing']['seek']);close();step(5);ck('Briar uncovers the clapper',state()['adventure']['crossing']['clapperRevealed']);key('m');ck('Discovered clue added to map',p.locator('[data-rpg="cross-walk"][data-id="clapper"]').count()>=1);close()
  # Automated browser combat uses actual input events and validated movement.
  ev('''()=>{window.battleStep=(id)=>{const D=Realm.diagnostics,S=Realm.state,a=S.adventure,d=D.adventure,p=d.player,e=d.enemies.find(e=>e.id===id);const key=k=>{const c=document.querySelector('#world');c.focus();c.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}));c.dispatchEvent(new KeyboardEvent('keyup',{key:k,bubbles:true}));};if(!e||e.hp<=0)return {done:true};if(a.hp<=0)throw Error('Defeated in browser '+id);if(d.tactics.target!==id){for(let i=0;i<12;i++){key('Tab');if(Realm.diagnostics.adventure.tactics.target===id)break;}}if(!Realm.diagnostics.adventure.tactics.auto)key('1');if(a.hp<d.stats.maxHP-40&&a.tonics)key('6');let distance=Math.hypot(p.x-e.x,p.z-e.z),escape=false;if(e.mode==='windup'&&e.aim){if(e.custom==='bell'){let dd=Math.hypot(p.x-e.aim.x,p.z-e.aim.z);if(e.ringMode==='outer'?dd>2.1&&dd<6.2:dd<2.8){let q=e.ringMode==='outer'?e.aim:{x:e.aim.x+(p.x<e.aim.x?-1:1)*3.5,z:e.aim.z};if(RealmCrossing.walkable(q.x,q.z)){Realm.test.move(q.x,q.z);escape=true;}}}else if(e.timer<.45&&Math.hypot(p.x-e.aim.x,p.z-e.aim.z)<1.6){key('3');}}if(!escape&&!Realm.test.path.length&&(distance>d.weapon.reach-.35||!RealmCrossing.line(p,e))){for(let i=0;i<16;i++){let q={x:e.x+Math.sin(i*Math.PI/8)*1.65,z:e.z+Math.cos(i*Math.PI/8)*1.65};if(RealmCrossing.walkable(q.x,q.z)&&Realm.test.move(q.x,q.z).ok)break;}}if(distance<3.3&&a.stamina>65)key('2');Realm.test.step(.1);return{done:false,mode:e.mode,ringMode:e.ringMode,hp:a.hp,enemy:e.hp};};}''')
  def fight(id,capture=False):
   tells=set();got=False
   for n in range(500):
    # Small batches leave the browser able to render a real windup screenshot.
    v=ev('(id)=>{let out=[];for(let i=0;i<5;i++){let r=battleStep(id);out.push(r);if(r.done)break;}return out;}',id)
    for q in v:
     if q.get('mode')=='windup' and q.get('ringMode'):tells.add(q['ringMode'])
    if capture and not got and 'outer' in tells and dg()['adventure']['enemies'][-1]['mode']=='windup':
     image('FIRSTLIGHT_10_Hushbound-Keeper.png',{'half':16,'yaw':.5,'elevation':.91,'overview':False});got=True
    if v[-1].get('done'):break
   render();ck('Actual keyboard battle defeats '+id,id in state()['adventure']['defeated']);ev('(id)=>Realm.test.adventure(id,"target-clear",{})','clear-'+id)
   return tells
  fight('cross-thorn');walk(-10,-7);key('e');ck('Prowler cache collected once','cross-thorn' not in state()['adventure']['drops']);walk(-13,-9);key('e');ck('Quest part recovered',state()['adventure']['crossing']['clapper'])
  walk(0,-10);fight('cross-prism');walk(8,-13);key('e');ck('Tuner cache collected','cross-prism' not in state()['adventure']['drops']);place('inn');key('e');act('cross-do','cross-rest');close()
  walk(0,-15);tells=fight('cross-warden',True);ck('Keeper uses both ring modes',{'outer','inner'}.issubset(tells));walk(0,-23);key('e');ck('Keeper cache collected','cross-warden' not in state()['adventure']['drops'])
  place('court');key('e');ck('Court shows actual repair requirements','clapper' in p.locator('#rpg-content').inner_text().lower());act('cross-do','cross-repair');ck('Repair persisted',state()['adventure']['crossing']['repaired']);ck('No reward before melody',not state()['adventure']['crossing']['reward']);close()
  walk(3,-20);key('e');ck('Wrong first tone resets only melody',dg()['adventure']['crossing']['tones']==[] and not state()['adventure']['crossing']['complete']);walk(-3,-20);key('e');ck('First resonator accepted',dg()['adventure']['crossing']['tones']==['leaf']);walk(0,-18.5);key('e');ck('Second resonator accepted',dg()['adventure']['crossing']['tones']==['leaf','wave']);walk(3,-20);key('e');ck('Third tone completes restoration',state()['adventure']['crossing']['complete']);ck('Sound stays off unless enabled',dg()['audio']['state']=='not-created');image('FIRSTLIGHT_10_Restored-Court.png',{'half':16,'yaw':.5,'elevation':.95,'overview':False})
  place('keeper');key('e');coins=state()['adventure']['coins'];act('cross-do','cross-reward');ck('Reward adds 18 and charm once',state()['adventure']['coins']==coins+18 and state()['adventure']['owned'].count('chime_clasp')==1);ck('Repeat claim disabled',p.locator('[data-rpg="cross-do"][data-id="cross-reward"]').is_disabled());close()
  key('c');act('item','gear:chime_clasp');act('equip','chime_clasp');ck('Quest charm equipped',state()['adventure']['equipment']['charm']=='chime_clasp');close();place('waystone');key('m');old=state();act('cross-travel','commons');ck('New network returns home',dg()['scene']=='valley');ck('Travel preserves earned and creative state',state()['score']==initial['score'] and state()['retreat']==initial['retreat'] and state()['adventure']['crossing']['reward'] and state()['adventure']['beacon']['soul']==initial['adventure']['beacon']['soul']);ck('No automatic targeting after travel',not dg()['adventure']['tactics']['auto'] and dg()['adventure']['tactics']['target'] is None)
  saved=state();(O/'BROWSER_CHAPTER_IV_COMPLETE.json').write_text(json.dumps(saved,indent=2));ev('Realm.test.save()');p2=spawn(saved);ck('Cold storage fixture retains complete chapter',p2.evaluate('Realm.state.adventure.crossing.reward'));ck('Cold restart does not resume a fight',p2.evaluate('!Realm.diagnostics.adventure.tactics.auto && Realm.diagnostics.scene==="valley"'));p2.close()
  # Known-answer community fixture: resources assigned only here, not in the journey above.
  fixture=json.loads(json.dumps(saved));fixture['sandbox']['inventory'].update({'plank':8,'stone':12,'berry':8});ev('(s)=>Realm.test.replace(s)',fixture);render();key('m');act('cross-travel','bellweather');place('board');key('e');old=state();act('cross-project','lamps');ck('Lantern commission deducts exact material and pays once',state()['sandbox']['inventory']['plank']==old['sandbox']['inventory']['plank']-4 and state()['sandbox']['inventory']['stone']==old['sandbox']['inventory']['stone']-6 and state()['adventure']['coins']==old['adventure']['coins']+12);ck('Lantern commission repeat disabled',p.locator('[data-rpg="cross-project"][data-id="lamps"]').is_disabled());old=state();act('cross-project','pantry');ck('Harvest commission consumes 4 and gives one ruby',state()['sandbox']['inventory']['berry']==old['sandbox']['inventory']['berry']-4 and state()['adventure']['arsenal']['gems']['ruby']==old['adventure']['arsenal']['gems']['ruby']+1);close();ck('Both project flags persisted',len(state()['adventure']['crossing']['projects'])==2);image('FIRSTLIGHT_10_Evening-Market.png',{'half':20,'yaw':.3,'elevation':.92,'overview':False})
  # Physical-size emulation is not a phone playtest.
  mobile=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1,offline=True);q=spawn(saved,mobile);q.click('.rpg-nav [data-id="atlas"]');ck('Touch map opens via nav icon',q.locator('#rpg-window').evaluate('(e)=>e.open'));box=q.locator('#cross-atlas-map').bounding_box();ck('Touch map has readable dimensions',box['width']>250 and box['height']>250);ck('Active Map tab scrolls into view on touch',q.locator('#rpg-tabs').evaluate('(nav)=>{let a=nav.querySelector(`[aria-current="page"]`).getBoundingClientRect(),n=nav.getBoundingClientRect();return a.left>=n.left&&a.right<=n.right}'));ck('No horizontal page overflow',q.evaluate('document.documentElement.scrollWidth<=innerWidth+2'));q.screenshot(path=str(O/'FIRSTLIGHT_10_Mobile-Map.png'));q.click('#rpg-close');ck('Mobile map can close',not q.locator('#rpg-window').evaluate('(e)=>e.open'));q.close();mobile.close()
  # Normal RAF, not the accelerated test stepper, proves map pause.
  q=spawn(saved,capture=False);q.bring_to_front();q.keyboard.press('m');t=q.evaluate('Realm.state.adventure.elapsed');q.wait_for_timeout(350);ck('Map pauses normal RAF progression',q.evaluate('Realm.state.adventure.elapsed')==t);q.click('#rpg-close');q.wait_for_function('(t)=>Realm.state.adventure.elapsed>t',arg=t,timeout=10000);ck('Closing resumes normal RAF progression',q.evaluate('Realm.state.adventure.elapsed')>t);q.close()
  q=spawn(saved,fallback=True);ck('Fallback map still boots durable chapter',q.evaluate('Realm.diagnostics.mode==="map" && Realm.state.adventure.crossing.reward'));q.keyboard.press('m');q.locator('[data-rpg="cross-travel"][data-id="bellweather"]').click();ck('Fallback travels through same rules',q.evaluate('Realm.diagnostics.scene==="crossing"'));q.close()
  ck('No unhandled browser errors',not errors);ck('No external resource requests',not [u for u in requests if u.startswith(('http:','https:'))]);report['passed']=True;b.close()
except Exception:
 report['errors'].append(traceback.format_exc());print(traceback.format_exc(),flush=True);report['passed']=False
finally:
 report['browser_errors']=errors;report['network_requests']=requests;report['checks_passed']=sum(c['passed'] for c in report['checks']);(O/'CROSSING_BROWSER_REPORT.json').write_text(json.dumps(report,indent=2))
 if not report.get('passed'):raise SystemExit(1)
