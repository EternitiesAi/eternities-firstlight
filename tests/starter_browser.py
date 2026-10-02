"""Real UI and native loopback storage; accelerated command movement is labelled.
No personal profile, planted completion flags, or human pacing claim.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import hashlib, json, math, threading, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'evidence10/starter-browser';OUT.mkdir(parents=True,exist_ok=True)
report={'method':__doc__,'html_sha256':hashlib.sha256((ROOT/'FIRSTLIGHT_VALLEY.html').read_bytes()).hexdigest(),'checks':[],'browser_errors':[]}
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
    def log_message(self,*_):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
def check(name,ok):
    report['checks'].append({'name':name,'passed':bool(ok)})
    print(('PASS ' if ok else 'FAIL ')+name,flush=True)
    if not ok:raise AssertionError(name)
try:
    with sync_playwright() as pw:
        browser=pw.chromium.launch(**chromium_launch_kwargs())
        context=browser.new_context(viewport={'width':1440,'height':960})
        context.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
        page=context.new_page();page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
        response=page.goto(f'http://127.0.0.1:{server.server_port}/FIRSTLIGHT_VALLEY.html',wait_until='load')
        page.wait_for_function('window.Realm');page.evaluate('Realm.test.quality("low");Realm.test.render()')
        check('Actual HTTP bytes match rebuilt HTML',hashlib.sha256(response.body()).hexdigest()==report['html_sha256'])
        def ev(js,arg=None):return page.evaluate(js,arg)
        def render():ev('Realm.test.render()')
        def key(k):page.keyboard.press(k);render()
        def close():
            if page.locator('#rpg-window').evaluate('(e)=>e.open'):page.click('#rpg-close')
        def walk(x,z):
            close();check(f'Accepted walking route {x},{z}',ev('([x,z])=>Realm.test.move(x,z)',[x,z])['ok'])
            ev('()=>{for(let i=0;i<6000&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render()}')
            p=ev('Realm.diagnostics.adventure.player');check(f'Reached {x},{z}',math.hypot(p['x']-x,p['z']-z)<.25)
        walk(11,9);key('e');check('Initial kit collected through E',ev('Realm.state.adventure.started'))
        key('e');check('Oren offers explicit outing acceptance',page.locator('[data-rpg="starter-accept"]').count()==1)
        check('Reward comparisons are visible before acceptance',page.locator('.starter-reward').count()==3 and page.locator('.starter-compare').count()==3)
        check('Every Oren reward comparison declares current-XP equipment scope',all('at your current XP' in s for s in page.locator('.starter-compare caption').all_text_contents()) and page.locator('.starter-xp-preview').count()==3)
        check('Exact route and objective counts are disclosed','three' in page.locator('#rpg-content').inner_text().lower() and 'Old Bristle' in page.locator('#rpg-content').inner_text())
        check('World pauses for reward review',ev('Realm.diagnostics.adventure.paused'))
        page.locator('[data-rpg="starter-accept"]').click();render();check('Acceptance uses persistent quest state',ev('Realm.state.adventure.starter.accepted'))
        close();ev('Realm.test.save()');page.reload(wait_until='load');page.wait_for_function('window.Realm');render()
        check('Native reload retains accepted outing',ev('Realm.state.adventure.starter.accepted'))
        key('j');check('Journal exposes optional outing','riverbank' in page.locator('#rpg-content').inner_text().lower());close()
        key('m');check('Commons map exposes riverbank gate',page.locator('[data-rpg="cross-walk"][data-id="river-gate"]').count()>=1);close()
        walk(15,7);key('e');check('Initial-kit route reaches actual riverbank scene',ev('Realm.diagnostics.scene')=='riverbank')
        check('Scene is rendered in WebGL',ev('Realm.diagnostics.mode')=='webgl2')
        page.screenshot(path=str(OUT/'riverbank-arrival.png'))
        serial=0
        def command(t,p=None):
            global serial
            serial+=1
            result=ev('([id,t,p])=>Realm.test.adventure(id,t,p)',[f'browser-starter-{serial}',t,p or {}])
            check('Accepted '+t,result['ok']);render();return result
        def reload_at(label):
            close();before=ev('Realm.state');ev('Realm.test.save()');page.reload(wait_until='load');page.wait_for_function('window.Realm');render()
            after=ev('Realm.state')
            check('Native reload: '+label,after['adventure']['starter']==before['adventure']['starter'] and after['adventure']['equipment']==before['adventure']['equipment'] and after['adventure']['defeated']==before['adventure']['defeated'])
        def reenter():
            walk(15,7);key('e');check('Re-enter riverbank',ev('Realm.diagnostics.scene')=='riverbank')
        def fight(id):
            command('target-select',{'id':id});key('1')
            outcome=ev("""(id)=>{let steps=0,hits=0,last=0,tells=0,guarded=0;for(;steps<4000;steps++){
              const d=Realm.diagnostics.adventure,a=Realm.state.adventure,e=d.enemies.find(e=>e.id===id);if(!e||e.hp<=0)break;if(a.hp<=0)throw Error('Died fighting '+id);
              const h=d.tactics.hits.at(-1);if(h&&h.id!==last){hits++;last=h.id;}
              if(a.hp<48&&a.tonics)Realm.test.adventure('heal-'+id+'-'+steps,'heal',{});
              if(e.mode==='windup'){tells++;if(a.stamina>=20&&a.elapsed>=d.tactics.cooldowns.guard){const g=Realm.test.adventure('guard-'+id+'-'+steps,'guard',{});if(g.ok)guarded++;}}
              const p=d.player,range=d.weapon.reach;if(!Realm.test.path.length&&(Math.hypot(p.x-e.x,p.z-e.z)>=range-.2||!RealmStarter.line(p,e))){
                const radius=d.weapon.style==='bow'?5:1.6;for(let j=0;j<16;j++){const x=e.x+Math.sin(j*Math.PI/8)*radius,z=e.z+Math.cos(j*Math.PI/8)*radius;if(RealmStarter.walkable(x,z)&&RealmStarter.line({x,z},e)&&Realm.test.move(x,z).ok)break;}
              }Realm.test.step(.1);
            }Realm.test.render();return {steps,hits,tells,guarded,hp:Realm.state.adventure.hp,defeated:Realm.state.adventure.defeated.includes(id)}; }""",id)
            check('Stationary autoattack and actual damage defeat '+id,outcome['defeated']);report.setdefault('combats',[]).append({'id':id,**outcome});command('target-clear')
        def outing(choice):
            for i,(bundle,x,z,enemy) in enumerate([('river-rope',-7,3,'river-skitter-west'),('river-tools',5,-3,'river-skitter-east'),('river-canvas',-5,-11,'river-old-bristle')]):
                walk(x,z);key('e');check('Visible pickup '+bundle,bundle in ev('Realm.state.adventure.starter.bundles'));reload_at('partial objectives '+str(i+1));reenter();walk(x,z);fight(enemy)
            reload_at('objectives complete before turn-in');walk(11,9);key('e')
            check('Turn-in offers exact deliberate choices',page.locator(f'[data-rpg="starter-claim"][data-id="{choice}"]').is_enabled())
            previous=ev('Realm.state.adventure.equipment.weapon');page.screenshot(path=str(OUT/(choice+'-reward-review.png')))
            page.locator(f'[data-rpg="starter-claim"][data-id="{choice}"]').click();render();check('Reward never auto-equips',ev('Realm.state.adventure.equipment.weapon')==previous)
            reload_at('reward selected before equip');walk(11,9);key('e');check('Oren recognizes completion','properly finished' in page.locator('#rpg-content').inner_text())
            page.locator(f'[data-rpg="equip"][data-id="{choice}"]').click();render();check('Explicit reward equip',ev('Realm.state.adventure.equipment.weapon')==choice)
            reload_at('reward equipped');key('c');page.screenshot(path=str(OUT/(choice+'-character.png')));close();reenter();walk(-5,11.5);command('target-select',{'id':'river-practice'});key('1');ev('Realm.test.step(1.6);Realm.test.render()')
            check('Equipped reward has confirmed practice impacts',len(ev('Realm.diagnostics.adventure.tactics.hits'))>0);check('Weapon family is correct',ev('Realm.diagnostics.adventure.weapon.style')==('bow' if choice.endswith('bow') else 'blade'))
            page.screenshot(path=str(OUT/(choice+'-practice.png')));key('1');command('target-clear')
        outing('oren_sunblade')
        # This bow was crafted by the fresh accepted-command producer, never granted.
        import subprocess
        subprocess.run(['node','tests/starter_journey.cjs','--bow'],cwd=ROOT,check=True,capture_output=True)
        fixture=json.loads((ROOT/'evidence10/starter/fresh-bow/02_BOW_CRAFTED_EARNED.json').read_text(encoding='utf-8'));ev('(s)=>Realm.test.replace(s)',fixture);render()
        walk(11,9);key('e');page.locator('[data-rpg="starter-accept"]').click();render();close();reenter();outing('oren_reedbow')
        command('target-select',{'id':'river-practice'});key('2');check('New bow skill launches a piercing projectile',any(x['special'] for x in ev('Realm.diagnostics.adventure.arrows')));ev('Realm.test.step(.4);Realm.test.render()');check('Piercing arrow produces a confirmed practice hit',len(ev('Realm.diagnostics.adventure.tactics.hits'))>0);command('target-clear')
        subprocess.run(['node','tests/starter_veteran.cjs'],cwd=ROOT,check=True,capture_output=True)
        veteran=json.loads((ROOT/'evidence10/starter/veteran/02_OBJECTIVES_COMPLETE.json').read_text(encoding='utf-8'));ev('(s)=>Realm.test.replace(s)',veteran);render();walk(11,9);key('e')
        check('Strongest earned veteran has exact temper comparison','42' in page.locator('.starter-reward').last.inner_text() and '44' in page.locator('.starter-reward').last.inner_text())
        page.locator('[data-rpg="starter-claim"][data-id="temper"]').click();render();check('Deliberate veteran temper keeps equipped identity',ev('Realm.state.adventure.equipment.weapon')=='dawn_edge' and ev('Realm.diagnostics.adventure.stats.attack')==44);reload_at('strongest veteran temper');key('c');page.screenshot(path=str(OUT/'veteran-temper.png'));close()
        # Labelled capacity boundary based on an earned completed outing. This is
        # separate from the command-earned journeys and is never a personal save.
        boundary=json.loads(json.dumps(veteran));boundary['adventure']['coins']=9994;ev('(s)=>Realm.test.replace(s)',boundary);render();walk(11,9);key('e');before=ev('Realm.state')
        page.locator('[data-rpg="starter-claim"][data-id="temper"]').click();render();check('Capacity-blocked visible turn-in is atomic',ev('Realm.state')==before);check('Refused reward remains available for retry',ev('Realm.state.adventure.starter.reward') is None)
        check('No unhandled browser errors',not report['browser_errors'])
        context.close();browser.close()
except Exception:
    report['exception']=traceback.format_exc();print(report['exception'])
finally:
    server.shutdown();server.server_close()
    report['passed']=not report.get('exception') and not report['browser_errors'] and all(c['passed'] for c in report['checks'])
    (OUT/'STARTER_BROWSER_REPORT.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('RESULT',len(report['checks']),report['passed'])
raise SystemExit(0 if report['passed'] else 1)
