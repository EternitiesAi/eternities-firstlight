"""Actual field-guide UI on isolated loopback storage. Accelerated command setup, not human pacing."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import hashlib, json, math, threading, traceback, subprocess
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'evidence10/pursuit-browser';OUT.mkdir(parents=True,exist_ok=True)
report={'method':__doc__,'html_sha256':hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest(),'checks':[],'browser_errors':[]}
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
        response=page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='load')
        page.wait_for_selector('#rpg-hud')
        def ev(js,arg=None):return page.evaluate(js,arg)
        def render():ev('Realm.test.quality("low");Realm.test.render()')
        def key(k):page.keyboard.press(k);render()
        def close():
            if page.locator('#rpg-window').evaluate('(e)=>e.open'):page.click('#rpg-close')
        def walk(x,z):
            close();check(f'Accepted walking {x},{z}',ev('([x,z])=>Realm.test.move(x,z)',[x,z])['ok'])
            ev('()=>{for(let i=0;i<6000&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render()}')
            p=ev('Realm.diagnostics.adventure.player');check(f'Reached {x},{z}',math.hypot(p['x']-x,p['z']-z)<.25)
        def guide():
            key('c');page.locator('#rpg-tabs [data-id="pursuit"]').click();render()
        serial=0
        def command(t,p=None):
            global serial
            serial+=1
            r=ev('([id,t,p])=>Realm.test.adventure(id,t,p)',[f'pursuit-ui-{serial}',t,p or {}])
            check('Accepted '+t,r['ok']);render();return r
        def reload_case(label):
            close();before=ev('Realm.state');ev('Realm.test.save()');page.reload(wait_until='load');page.wait_for_selector('#rpg-hud');render();after=ev('Realm.state')
            check('Native reload retains '+label,after['adventure']['pursuit']==before['adventure']['pursuit'] and after['adventure']['equipment']==before['adventure']['equipment'] and after['adventure']['arsenal']==before['adventure']['arsenal'])
        def fight(id):
            command('target-select',{'id':id});key('1')
            result=ev("""id=>{let steps=0,guards=0;for(;steps<4000;steps++){
                const d=Realm.diagnostics.adventure,a=Realm.state.adventure,e=d.enemies.find(e=>e.id===id);
                if(!e||e.hp<=0)break;if(a.hp<=0)throw Error('Died during '+id);
                if(a.hp<48&&a.tonics&&a.elapsed>=d.cooldowns.heal)Realm.test.adventure('ph-'+id+'-'+steps,'heal',{});
                if(e.mode==='windup'&&a.stamina>=20&&a.elapsed>=d.tactics.cooldowns.guard){if(Realm.test.adventure('pg-'+id+'-'+steps,'guard',{}).ok)guards++;}
                const p=d.player,range=d.weapon.reach;
                if(!Realm.test.path.length&&(Math.hypot(p.x-e.x,p.z-e.z)>=range-.2||!RealmStarter.line(p,e))){
                    const radius=d.weapon.style==='bow'?5:1.6;
                    for(let j=0;j<16;j++){const x=e.x+Math.sin(j*Math.PI/8)*radius,z=e.z+Math.cos(j*Math.PI/8)*radius;
                        if(RealmStarter.walkable(x,z)&&RealmStarter.line({x,z},e)&&Realm.test.move(x,z).ok)break;}
                }Realm.test.step(.1);
            }Realm.test.render();return{steps,guards,hp:Realm.state.adventure.hp,defeated:Realm.state.adventure.pursuit.active.defeated};}""",id)
            check('Real combat clears '+id,id.split(':')[-1] in result['defeated']);report.setdefault('combats',[]).append({'id':id,**result});command('target-clear')
        render();check('Served HTML equals regenerated build',hashlib.sha256(response.body()).hexdigest()==report['html_sha256'])
        walk(11,9);key('e');check('Initial kit earned through E',ev('Realm.state.adventure.started'))
        guide();check('Field guide is a real visible workspace',page.locator('#rpg-heading').inner_text()=='Field guide')
        page.locator('[data-rpg="pursuit-select"][data-id="copper_bow"]').click();render();initial=ev('Realm.state')
        check('Fresh next step names actual Ashwood prerequisite',page.locator('.guide-recipe').get_attribute('data-result-weapon')=='trail_bow' and 'PREREQUISITE' in page.locator('.guide-recipe>small').inner_text())
        check('Fresh actual next-equipped attack is 13 versus current 16',page.locator('[data-preview="step"] [data-stat="attack"]').inner_text().split()==['Attack','16','13'])
        check('Fresh next step distinguishes real blade-to-bow cadence reach and stamina',page.locator('[data-preview="step"] [data-stat="cooldown"]').inner_text().split()==['Strike','cooldown','0.52s','0.75s'] and page.locator('[data-preview="step"] [data-stat="reach"]').inner_text().split()==['Reach','2.65','11'] and page.locator('[data-preview="step"] [data-stat="stamina"]').inner_text().split()==['Stamina','/','strike','0','6'])
        check('Fresh lower-attack prerequisite gets an honest warning','Ashwood trail bow has less attack' in page.locator('.guide-caution').inner_text())
        check('Fresh exact material cost appears without pretending to be affordable',page.locator('.guide-costs b').all_text_contents()==['0 / 6','0 / 4','0 / 2'] and page.locator('[data-rpg="pursuit-recipe"]').is_disabled())
        check('Longbow project summary retains its distinct 21-attack goal','21 attack if equipped' in page.locator('.guide-target summary').inner_text())
        page.locator('.guide-target summary').focus();page.keyboard.press('Enter');render()
        check('Keyboard can inspect the distinct long-term target',page.locator('.guide-target').evaluate('(e)=>e.open') and page.locator('[data-preview="target"] [data-stat="attack"]').inner_text().split()==['Attack','16','21'])
        for width in [820,390]:
            page.set_viewport_size({'width':width,'height':844});render()
            check(f'Fresh prerequisite and expanded target fit {width}px',page.locator('#rpg-content').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1') and page.locator('.guide-comparison').evaluate_all('(tables)=>tables.every(t=>t.scrollWidth<=t.clientWidth+1)'))
            page.locator('.guide-recipe').scroll_into_view_if_needed();page.screenshot(path=str(OUT/f'prerequisite-{width}.png'))
        page.set_viewport_size({'width':1440,'height':960});render();page.locator('.guide-recipe').scroll_into_view_if_needed();page.screenshot(path=str(OUT/'00-fresh-prerequisite.png'))
        check('Inspecting both outcomes and resizing leaves save state unchanged',ev('Realm.state')==initial)
        mode=ev('Realm.state.settings.cameraMode');key('v');check('View shortcut remains consumed inside prerequisite preview',ev('Realm.state.settings.cameraMode')==mode)
        page.locator('.guide-caution [data-rpg="pursuit-select"]').click();render()
        check('Lower prerequisite offers an actual owned fitting alternative',page.locator('.guide-detail').get_attribute('data-weapon')=='trail_blade' and page.locator('[data-preview="step"] [data-stat="attack"]').inner_text().split()==['Attack','16','18'] and ev('Realm.state')==initial)
        page.locator('[data-rpg="pursuit-pin"][data-id="trail_blade"]').click();render()
        check('Pin reaches production save state',ev('Realm.state.adventure.pursuit.pinned')=='trail_blade')
        close();check('Pinned weapon has a concrete HUD next action','Trail blade' in page.locator('#tracked-title').inner_text())
        guide();page.locator('[data-rpg="pursuit-pin"][data-id=""]').click();render()
        check('Unpin clears only project selection',ev('Realm.state.adventure.pursuit.pinned') is None and ev('Realm.state.adventure.equipment.weapon')=='trail_blade')
        page.locator('[data-rpg="pursuit-pin"][data-id="trail_blade"]').click();render()
        page.locator('[data-rpg="pursuit-start"]').click();render()
        check('Accept creates the first run without entering or equipping',ev('Realm.state.adventure.pursuit.active.id')=='riverbank-survey/1' and ev('Realm.diagnostics.scene')=='valley')
        walk(15,7);key('e');walk(-7,3);key('e')
        check('Actual E records the current survey sample',ev('Realm.state.adventure.pursuit.active.samples')==['west-sample'])
        reload_case('partly sampled survey');walk(15,7);key('e')
        key('m');check('Map exposes actual survey sample and threat routes',page.locator('.cross-atlas-list button[data-rpg="starter-walk"][data-id="east-sample"]').count()==1 and page.locator('.cross-atlas-list button[data-rpg="starter-walk"][data-id="riverbank-survey/1:west"]').count()==1);close()
        for run in range(1,4):
            if run>1:
                walk(0,3);command('rest');walk(11,9);guide();page.locator('[data-rpg="pursuit-start"]').click();render();close();walk(15,7);key('e')
            walk(-7,3);fight(f'riverbank-survey/{run}:west')
            if run>1:key('e')
            walk(5,-3);fight(f'riverbank-survey/{run}:east');walk(5,-11);key('e')
            check('Both samples recorded through E',len(ev('Realm.state.adventure.pursuit.active.samples'))==2)
            if run==1:
                check('Complete riverbank survey points to the actual southern exit','southern path' in page.locator('#tracked-detail').inner_text())
                reload_case('completed unclaimed survey');walk(15,7);key('e')
            walk(0,12);key('e')
            if run==1: check('Village guidance no longer points back to the riverbank exit','southern path' not in page.locator('#tracked-detail').inner_text() and 'Oren' in page.locator('#tracked-detail').inner_text())
            walk(11,9)
            if run==1: check('Beside Oren the HUD names the available claim interaction','E opens your survey' in page.locator('#tracked-detail').inner_text())
            key('e')
            check('Oren opens the outstanding survey',page.locator('#rpg-heading').inner_text()=='Field guide')
            page.locator('[data-rpg="pursuit-claim"]').click();render()
            check(f'Explicit run {run} pays once',ev('Realm.state.adventure.pursuit.claimed')==run)
            if run==1:
                page.locator('[data-rpg="pursuit-select"][data-id="trail_blade"]').click();render()
                check('Fitting compares actual attack with retained cadence',page.locator('[data-preview="step"] [data-stat="attack"]').inner_text().split()==['Attack','16','18'])
                page.screenshot(path=str(OUT/'01-before-fitting.png'))
                page.locator('[data-rpg="pursuit-recipe"]').click();render();check('Confirmed first fitting spends exact full payout',ev('Realm.state.adventure.pursuit.fittings.trail_blade')==1 and ev('Realm.state.adventure.ore')==0 and ev('Realm.state.adventure.coins')==0 and ev('Realm.state.sandbox.inventory.fiber')==0)
                reload_case('first fitting');key('v');render();check('Diorama switch retains fitting and pin',ev('Realm.state.settings.cameraMode')=='follow' and ev('Realm.state.adventure.pursuit.pinned')=='trail_blade')
            close()
        guide();page.locator('[data-rpg="pursuit-select"][data-id="trail_blade"]').click();render();page.locator('[data-rpg="pursuit-recipe"]').click();render()
        check('Finite second fitting applied through visible command',ev('Realm.state.adventure.pursuit.fittings.trail_blade')==2)
        check('Main campaign and XP remain untouched',ev('Realm.state.adventure.xp')==0 and ev('Realm.state.adventure.reward') is None and ev('Realm.state.adventure.defeated')==[] and not ev('Realm.state.adventure.starter.accepted'))
        page.screenshot(path=str(OUT/'02-after-fitting.png'));reload_case('finished chain')
        walk(15,7);key('e');walk(-5,11.5);command('target-select',{'id':'river-practice'});key('1');ev('Realm.test.step(1.4);Realm.test.render()')
        check('Improved blade produces real 20-damage practice impacts',ev('Realm.diagnostics.adventure.tactics.hits.at(-1).n')==20)
        command('target-clear');page.screenshot(path=str(OUT/'03-practice-diorama.png'))
        # Fresh producer inputs, never planted inventory, defeats or ownership.
        for variant,flag in [('fresh-bow','--bow'),('veteran','--veteran')]:
            subprocess.run(['node','tests/pursuit_journey.cjs',flag],cwd=ROOT,check=True,capture_output=True)
            if variant=='fresh-bow':
                prerequisite=ROOT/'evidence10/pursuit/fresh-bow/02_PREREQUISITE_READY.json'
                close();ev('(s)=>Realm.test.replace(s)',json.loads(prerequisite.read_text(encoding='utf-8')));render();guide()
                page.locator('[data-rpg="pursuit-select"][data-id="copper_bow"]').click();render();before_step=ev('Realm.state');projected=ev('RealmPursuit.nextStep(Realm.state.adventure,"copper_bow")')
                check('Earned materials make the actual prerequisite craft available',not page.locator('[data-rpg="pursuit-recipe"]').is_disabled() and projected['weapon']=='trail_bow')
                page.locator('[data-rpg="pursuit-recipe"]').click();render();made=ev('Realm.state')
                check('Visible prerequisite craft preserves pin and explicit equip choice',made['adventure']['equipment']==before_step['adventure']['equipment'] and made['adventure']['pursuit']['pinned']=='copper_bow' and 'trail_bow' in made['adventure']['owned'])
                check('Prerequisite craft spends exactly its declared materials',all(before_step['sandbox']['inventory'][k]-made['sandbox']['inventory'][k]==n for k,n in projected['recipe']['materials'].items()) and made['adventure']['ore']==before_step['adventure']['ore'] and made['adventure']['coins']==before_step['adventure']['coins'])
                check('Next recipe advances to the copper target after prerequisite ownership',page.locator('.guide-recipe').get_attribute('data-result-weapon')=='copper_bow' and page.locator('.guide-target').count()==0 and page.locator('[data-preview="step"] [data-stat="attack"]').inner_text().split()==['Attack','16','21'])
                command('equip',{'id':'trail_bow'});check('Explicitly equipped prerequisite matches its actual preview',ev('RealmAdventure.stats(Realm.state.adventure)')==projected['after'] and ev('RealmArsenal.weapon(Realm.state.adventure)')==projected['afterWeapon'])
                reload_case('earned prerequisite with copper target still pinned')
                report.setdefault('fixtures',[]).append({'variant':'earned-prerequisite','path':str(prerequisite.relative_to(ROOT)),'sha256':hashlib.sha256(prerequisite.read_bytes()).hexdigest()})
            source=ROOT/f'evidence10/pursuit/{variant}/03_BASE_CRAFTED.json'
            # Bow begins before base crafting so this test exercises that visible production action.
            if variant=='fresh-bow':source=ROOT/'evidence10/pursuit/fresh-bow/run5_04_CLAIMED.json'
            fixture=json.loads(source.read_text(encoding='utf-8'));close();ev('(s)=>Realm.test.replace(s)',fixture);render()
            report.setdefault('fixtures',[]).append({'variant':variant,'path':str(source.relative_to(ROOT)),'sha256':hashlib.sha256(source.read_bytes()).hexdigest()})
            weapon='copper_bow' if variant=='fresh-bow' else 'dawn_edge';before=ev('Realm.state');guide()
            page.locator(f'[data-rpg="pursuit-select"][data-id="{weapon}"]').click();render()
            if variant=='fresh-bow':
                check('Guide previews true ranged behavior',page.locator('[data-preview="step"] [data-stat="cooldown"]').inner_text().split()==['Strike','cooldown','0.75s','0.75s'])
                old=ev('Realm.state.adventure.equipment.weapon');page.locator('[data-rpg="pursuit-recipe"]').click();render()
                check('Actual copper-bow craft is deliberate and keeps old bow equipped',ev('Realm.state.adventure.equipment.weapon')==old and 'copper_bow' in ev('Realm.state.adventure.owned'))
            else:
                page.locator('[data-rpg="pursuit-select"][data-id="copper_blade"]').click();render();check('Veteran sees an honest starter-weapon warning',page.locator('.guide-caution').count()==1)
                page.locator('.guide-catalogue [data-rpg="pursuit-select"][data-id="dawn_edge"]').click();render()
                check('Veteran preview includes the existing Oren temper','+2 attack retained' in page.locator('.guide-detail').inner_text())
            for step in [1,2]:
                page.locator('[data-rpg="pursuit-recipe"]').click();render();check(f'{variant} confirms finite fitting {step}',ev(f'Realm.state.adventure.pursuit.fittings.{weapon}')==step)
            check('Completed project offers no third fitting',page.locator('[data-rpg="pursuit-recipe"]').count()==0)
            if variant=='fresh-bow':page.locator(f'.guide-detail [data-rpg="equip"][data-id="{weapon}"]').click();render()
            after=ev('Realm.state');check(variant+' keeps original sockets, XP and story',after['adventure']['arsenal']['sockets']==before['adventure']['arsenal']['sockets'] and after['adventure']['xp']==before['adventure']['xp'] and all(after['adventure'][k]==before['adventure'][k] for k in ['starter','beacon','road','crossing','companion']))
            mode=ev('Realm.state.settings.cameraMode');key('v');check('Camera shortcut is consumed inside guide',ev('Realm.state.settings.cameraMode')==mode)
            page.set_viewport_size({'width':390,'height':844});render();check(variant+' guide fits narrow viewport',page.locator('#rpg-content').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'));page.screenshot(path=str(OUT/(variant+'-narrow.png')));page.set_viewport_size({'width':1440,'height':960});render()
            reload_case(variant+' crafted fitted equipped weapon');walk(15,7);key('e');walk(-5,6 if variant=='fresh-bow' else 11.5);command('target-select',{'id':'river-practice'});key('1');ev('Realm.test.step(1.6);Realm.test.render()')
            check(variant+' confirmed upgraded practice damage',ev('Realm.diagnostics.adventure.tactics.hits.at(-1).n')==(25 if variant=='fresh-bow' else 48));command('target-clear');page.screenshot(path=str(OUT/(variant+'-practice.png')))
        # Labelled synthetic cap boundary based on an earned unclaimed survey.
        fixture=json.loads((ROOT/'evidence10/pursuit/fresh-bow/run1_03_OBJECTIVES.json').read_text(encoding='utf-8'));fixture['adventure']['ore']=9998
        close();ev('(s)=>Realm.test.replace(s)',fixture);render();guide()
        check('Capacity-blocked claim is visibly disabled',page.locator('[data-rpg="pursuit-claim"]').is_disabled())
        state=ev('Realm.state');result=ev('Realm.test.adventure("capacity-new-request","pursuit-claim",{run:"riverbank-survey/1"})')
        check('Rejected UI bypass cannot spend or lose entitlement',not result['ok'] and ev('Realm.state')==state);reload_case('capacity-blocked earned entitlement')
        check('No browser errors',not report['browser_errors'])
        context.close();browser.close()
    report['status']='passed'
except Exception:
    report['status']='failed';report['traceback']=traceback.format_exc();raise
finally:
    server.shutdown();server.server_close()
    (OUT/'PURSUIT_BROWSER_REPORT.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
