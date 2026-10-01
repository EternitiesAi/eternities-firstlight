"""Real component UI/Web Audio; synthetic host, account and checkpoint fixtures.

Does not assert the complete Firstlight app/engine or save migration passed.
The five component sources and production earth.js are exact local inputs.
"""
from pathlib import Path
import hashlib,json,os,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'verification';OUT.mkdir(exist_ok=True)
report={'scope':__doc__,'checks':[],'page_errors':[],'network_requests':[],'source_sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'src').glob('*')}}
html='''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gathering component fixture — not the game</title>
<style>body{background:#132529;color:#eee;font:16px system-ui}dialog{position:fixed;inset:8px;width:min(1050px,calc(100vw - 60px));max-height:90vh;overflow:auto;color:#eee;background:#172c30;border:1px solid #ae9470;border-radius:12px;padding:18px}button{background:#27443d;color:#fff4db;border:1px solid #b59d6c;border-radius:8px;cursor:pointer}button:disabled{opacity:.45;cursor:default}button:focus-visible{outline:3px solid #ebd27a}#rpg-content{overflow-wrap:anywhere}</style>
<link rel="stylesheet" href="/src/gathering.css"><div id="rpg-hud"></div><dialog id="rpg-window"><h1 id="rpg-heading"></h1><div id="rpg-content"></div></dialog>
<script src="/src/earth.js"></script><script src="/src/gathering.js"></script><script src="/src/gathering-music.js"></script><script src="/tests/gathering_ui_host.js"></script><script src="/src/gathering-ui.js"></script>
<script>Component.rpg=new RealmRPGUI.RPGUI();Component.rpg.open();</script>'''
(ROOT/'COMPONENT_FIXTURE.html').write_text(html,encoding='utf-8')
def check(label,value):
 report['checks'].append({'name':label,'passed':bool(value)});print(('PASS ' if value else 'FAIL ')+label,flush=True)
 if not value:raise AssertionError(label)
try:
 with sync_playwright() as pw:
  executable=os.environ.get('FIRSTLIGHT_CHROMIUM_PATH') or shutil.which('chromium')
  launch={'headless':True}
  if executable:launch['executable_path']=executable
  browser=pw.chromium.launch(**launch)
  context=browser.new_context(viewport={'width':1280,'height':900});page=context.new_page()
  page.on('pageerror',lambda e:report['page_errors'].append(str(e)))
  page.on('request',lambda r:report['network_requests'].append(r.url))
  # This environment refuses localhost navigation. Inject owned, hash-recorded
  # component bytes into a blank page; this does NOT exercise native app routing
  # or origin persistence. No browser policy flags are disabled.
  import re
  rendered=html.replace('<link rel="stylesheet" href="/src/gathering.css">','<style>'+(ROOT/'src/gathering.css').read_text(encoding='utf-8')+'</style>')
  rendered=re.sub(r'<script src="/([^"]+)"></script>',lambda m:'<script>'+(ROOT/m.group(1)).read_text(encoding='utf-8')+'</script>',rendered)
  report['document_method']='page.set_content with owned component bytes; local navigation refused by environment policy'
  page.set_content(rendered);page.wait_for_function('()=>!!window.Component?.rpg?.gathering')
  def ev(s):return page.evaluate(s)
  def click(act,id=None):page.locator('[data-rpg="table-'+act+'"]'+('[data-id="'+id+'"]' if id else '')).click()
  def fixture_ready():
   ev("()=>{Component.rpg.close();const s=Component.makeFixture();Component.setActive(s);RealmGathering.handle(s,'gathering-accept');for(const t of RealmGathering.TASKS){s.state.player={x:t.x,z:t.z};RealmGathering.handle(s,'gathering-prepare',{id:t.id});}s.state.player={...RealmGathering.TABLE};Component.rpg.open();}")
  check('arrival produces the explicit optional invitation',page.locator('[data-rpg="table-accept"]').count()==1)
  initial=ev('()=>JSON.stringify(Component.active.state.music)');click('accept')
  check('acceptance does not choose an arrangement',ev('()=>Component.active.state.adventure.earthGathering.verse===null'))
  for name in ['cloth','lantern','stand']:
   ev("()=>{const t=RealmGathering.TASKS.find(t=>t.id==='"+name+"');Component.active.state.player={x:t.x,z:t.z};Component.rpg.paint();}")
   click('prepare',name)
   check('actual component prepares '+name,ev("()=>Component.active.state.adventure.earthGathering.prepared.includes('"+name+"')"))
  ev('()=>{Component.active.state.player={...RealmGathering.TABLE};Component.rpg.paint();}')
  check('three alternative arrangements remain available',page.locator('[data-rpg="table-select"]').count()==3)
  click('select','mill');check('consideration focuses a separate confirm control',ev('()=>document.activeElement.dataset.rpg==="table-confirm"'))
  check('consideration alone is not consent',ev('()=>Component.active.state.adventure.earthGathering.verse===null'))
  click('cancel');check('cancel returns keyboard focus to the considered arrangement',ev('()=>document.activeElement.dataset.rpg==="table-select"&&document.activeElement.dataset.id==="mill"'))
  click('select','quarry');page.keyboard.press('Enter')
  check('keyboard confirmation chooses exactly the reviewed arrangement',ev('()=>Component.active.state.adventure.earthGathering.verse==="quarry"'))
  click('share');check('silent completion does not enable audio',ev('()=>Component.active.state.adventure.earthGathering.shared&&!Component.audio.enabled'))
  check('the personal composition remains byte-identical',ev('()=>JSON.stringify(Component.active.state.music)')==initial)
  check('unpaid delivery, XP and money are unchanged',ev('()=>!Component.active.state.adventure.earthStory.claimed&&Component.active.state.adventure.xp===95&&Component.active.state.adventure.coins===12'))
  ev('()=>{const q=Component.active.state.adventure.earthGathering;Component.active.state.adventure.earthGathering=RealmGathering.validate(JSON.parse(JSON.stringify(q)),Component.active.state.adventure);Component.rpg.paint();}')
  check('pure component serialization preserves the chosen memory',ev('()=>Component.active.state.adventure.earthGathering.shared&&Component.active.state.adventure.earthGathering.verse==="quarry"'))
  click('play','mill');page.wait_for_function('()=>Component.rpg.gathering.player.status==="playing"')
  check('real Web Audio context is running from explicit user input',ev('()=>Component.audio.ctx.state==="running"'))
  check('listening after completion does not rewrite the kept arrangement',ev('()=>Component.active.state.adventure.earthGathering.verse==="quarry"'))
  click('stop');check('stop releases current playback',ev('()=>Component.rpg.gathering.player.source===null&&Component.rpg.gathering.player.owner===null'))
  fixture_ready();click('select','mill');before_count=ev('()=>Component.commandCount')
  ev('()=>{Component.active.state.adventure.revision++;}');click('confirm')
  check('stale revision confirmation submits no command',ev('()=>Component.commandCount')==before_count)
  check('stale revision retains a null choice',ev('()=>Component.active.state.adventure.earthGathering.verse===null'))
  fixture_ready();click('select','mill');before_count=ev('()=>Component.commandCount')
  ev('()=>{const newer=Component.makeFixture();newer.state.adventure.earthGathering={version:1,accepted:true,prepared:["cloth","lantern","stand"],verse:null,shared:false};Component.setActive(newer);}')
  click('confirm');check('stale character confirmation submits no command',ev('()=>Component.commandCount')==before_count)
  fixture_ready();click('play','detour');page.wait_for_function('()=>Component.rpg.gathering.player.status==="playing"')
  ev('()=>{Component.active.state.player={x:0,z:24};Component.rpg.tick();}')
  check('leaving the table stops playing audio',ev('()=>Component.rpg.gathering.player.source===null'))
  fixture_ready();click('play','mill');page.wait_for_function('()=>Component.rpg.gathering.player.status==="playing"')
  ev('()=>Component.rpg.open("journal")');check('opening another panel stops playback',ev('()=>Component.rpg.gathering.player.source===null'))
  fixture_ready();click('play','mill');page.wait_for_function('()=>Component.rpg.gathering.player.status==="playing"')
  page.keyboard.press('Escape');check('Escape closes the panel and stops audio',ev('()=>!Component.rpg.dialog.open&&Component.rpg.gathering.player.source===null'))
  fixture_ready();click('play','mill');page.wait_for_function('()=>Component.rpg.gathering.player.status==="playing"')
  ev('()=>window.dispatchEvent(new Event("blur"))');check('window blur stops audio',ev('()=>Component.rpg.gathering.player.source===null'))
  fixture_ready();click('play','mill');page.wait_for_function('()=>Component.rpg.gathering.player.status==="playing"')
  ev('()=>{Component.audio.enabled=false;Component.rpg.tick();}');check('global mute stops table audio',ev('()=>Component.rpg.gathering.player.source===null'))
  # Browser-level fault injection: delayed resume boundary, not actual permission UI.
  ev('()=>{window.realAudio={ctx:Component.audio.ctx,master:Component.audio.master};Component.audio.enabled=true;Component.audio.ctx={state:"suspended",resume:()=>new Promise(r=>window.releaseResume=r)};Component.rpg.paint();}')
  click('play','mill');page.wait_for_function('()=>Component.rpg.gathering.player.status==="starting"')
  ev('()=>{Component.active.state.player={x:0,z:24};Component.rpg.tick();window.releaseResume();}')
  page.wait_for_timeout(30);check('leaving during pending resume cancels the request',ev('()=>Component.rpg.gathering.player.owner===null&&Component.rpg.gathering.player.source===null'))
  ev('()=>{Component.audio.ctx=window.realAudio.ctx;Component.audio.master=window.realAudio.master;}');fixture_ready()
  page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(50)
  check('mobile document has no horizontal overflow',ev('()=>document.documentElement.scrollWidth<=window.innerWidth'))
  check('mobile arrangement cards use a single column',ev('()=>getComputedStyle(document.querySelector(".table-verses")).gridTemplateColumns.split(" ").length===1'))
  check('all choice buttons have usable hit targets',ev('()=>[...document.querySelectorAll(".table-reading button")].every(b=>b.getBoundingClientRect().height>=42)'))
  page.screenshot(path=str(OUT/'GATHERING_COMPONENT_MOBILE.png'),full_page=True)
  page.set_viewport_size({'width':1280,'height':900});page.screenshot(path=str(OUT/'GATHERING_COMPONENT_DESKTOP.png'),full_page=True)
  check('no component browser exceptions',not report['page_errors'])
  check('test fetched no external media or services',not report['network_requests'])
  report['browser_version']=browser.version;context.close();browser.close()
except Exception as e:
 report['error']=str(e);raise
finally:
 (OUT/'COMPONENT_BROWSER.json').write_text(json.dumps(report,indent=2)+'\n')
print('Component browser checks:',len(report['checks']))
