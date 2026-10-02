"""North trail UI and native-origin persistence in isolated software Chromium.

Fixtures are regenerated through command-earned Node journeys. Browser movement,
AI, Brace, autoattack, arrows and escort use production commands and accelerated
50 ms ticks. Static software screenshots do not measure human pacing, normal RAF,
hardware performance or enjoyment. No health, inventory, damage, actor position
or accepted facts are planted in these playable cases.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import argparse, hashlib, json, os, subprocess, tempfile, threading, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, default=ROOT/'evidence10/realm-trails-north-browser')
parser.add_argument('--sources', type=Path, default=ROOT/'evidence10/realm-trails-north-browser/earned-sources')
args = parser.parse_args()
OUT, SOURCES = args.output.resolve(), args.sources.resolve()
if os.name == 'nt':
    assert OUT.drive.upper() == 'D:' and SOURCES.drive.upper() == 'D:', 'Heavy local Windows evidence must remain on D.'
OUT.mkdir(parents=True, exist_ok=True)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
report = {'method': __doc__, 'checks': [], 'browser_errors': [], 'errors': [],
          'html_sha256': sha(ROOT/'index.html'), 'events': [], 'combats': [],
          'screenshots': [], 'source_receipts': [], 'accelerated_ticks': True,
          'manual_damage': 0, 'health_grants': 0, 'inventory_grants': 0,
          'actor_position_edits': 0, 'planted_story_facts': 0}

def check(name, ok, detail=None):
    report['checks'].append({'name': name, 'passed': bool(ok), 'detail': detail})
    print(('PASS ' if ok else 'FAIL ')+name, flush=True)
    if not ok:
        raise AssertionError(name+(': '+str(detail) if detail is not None else ''))

def preserved(s):
    a = s['adventure']
    return {'adventure': {k: a[k] for k in ['owned', 'equipment', 'arsenal', 'pursuit', 'starter',
            'classPath', 'road', 'beacon', 'crossing', 'earthStory', 'earthNotes', 'earthGathering',
            'companion', 'defeated', 'drops', 'reward', 'relic', 'angelSeen', 'realmCraft']},
            'sandbox': {k: s['sandbox'][k] for k in ['inventory', 'placed', 'nextId', 'stats', 'milestones', 'bridge', 'recentCommands']},
            **{k: s[k] for k in ['notes', 'score', 'scoreRevision', 'retreat', 'visitor', 'flowers', 'journeys']}}

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)
    def log_message(self, *a):
        pass

server = None
try:
    embedded = ['core.js', 'adventure.js', 'combat.js', 'arsenal.js', 'realm-trails.js',
                'realm-trails-north.js', 'realm-trails-south.js', 'realm-trails-ui.js',
                'realm-trails-art.js', 'realm-craft.js', 'world-foundations.js']
    if (ROOT/'src/realm-trails-cosmos.js').exists():
        embedded.append('realm-trails-cosmos.js')
    html = (ROOT/'index.html').read_text(encoding='utf-8')
    check('offline HTML embeds the current runtime and trail sources',
          all((ROOT/'src'/name).read_text(encoding='utf-8').strip() in html for name in embedded))
    report['runtime_source_hashes'] = {name: sha(ROOT/'src'/name) for name in embedded}
    # The initial browser worlds are outputs of fresh production commands, not
    # hand-authored ready/dead fixtures. Their full journeys are separate proof.
    for variant, flags in [('fresh-blade', []), ('fresh-bow', ['--bow'])]:
        command = ['node', 'tests/realm_trails_journey.cjs', *flags, '--output', str(SOURCES)]
        result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, timeout=180)
        receipt = SOURCES/variant/'REALM_TRAILS_JOURNEY_REPORT.json'
        check('regenerated command-earned '+variant+' source', result.returncode == 0, result.stdout+result.stderr)
        proof = json.loads(receipt.read_text(encoding='utf-8'))
        check(variant+' source has no grants, manual damage or drift', proof['status'] == 'passed' and
              not proof['sourceDrift'] and all(proof[k] == 0 for k in ['positionEdits', 'inventoryGrants', 'manualDamage', 'plantedDefeats']))
        report['source_receipts'].append({'variant': variant, 'command': command,
            'receipt': str(receipt), 'receipt_sha256': sha(receipt),
            'world': str(SOURCES/variant/'00_COMMAND_EARNED_KIT.json'),
            'sourceHashes': proof['sourceHashes']})
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{server.server_port}/'
    with tempfile.TemporaryDirectory(prefix='firstlight-north-ui-', dir=OUT) as profile, sync_playwright() as pw:
        context = pw.chromium.launch_persistent_context(profile, **chromium_launch_kwargs(), viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        page.on('pageerror', lambda e: report['browser_errors'].append(str(e)))
        page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
        response = page.goto(url, wait_until='load')
        page.wait_for_function('window.Realm')
        check('exact current offline HTML served over isolated loopback', hashlib.sha256(response.body()).hexdigest() == report['html_sha256'])
        ev = lambda js, arg=None: page.evaluate(js, arg)
        state = lambda: ev('Realm.state')
        rec = lambda d: state()['realmTrails']['records'][d['id']]
        scope = lambda selector: page.locator('#rpg-content '+selector)

        def render():
            ev("()=>{Realm.test.quality('low');Realm.test.render()}")

        def close():
            if page.locator('#rpg-window').evaluate('(e)=>e.open'):
                page.locator('#rpg-close').click()
            if page.locator('#drawer').evaluate('(e)=>e.classList.contains("open")'):
                page.locator('#close-panel').click()

        def shot(name):
            render()
            filename = OUT/(name+'.png')
            page.screenshot(path=str(filename))
            report['screenshots'].append({'path': str(filename), 'sha256': sha(filename),
                                         'camera': ev('Realm.diagnostics.camera.projection')})

        def walk(x, z, label=None):
            close()
            result = ev('''([x,z])=>{const start={...Realm.diagnostics.adventure.player},r=Realm.test.move(x,z);
              if(!r.ok)return r;let frames=0;while(Realm.test.path.length&&frames++<18000)Realm.test.step(.05);
              Realm.test.render();const p=Realm.diagnostics.adventure.player;
              return{ok:frames<18000&&Math.hypot(p.x-x,p.z-z)<.25&&Realm.state.adventure.hp>0,frames,start,end:p};}''', [x, z])
            check(label or f'physical walk {x},{z}', result.get('ok'), result)
            report['events'].append({'walk': [x, z], **result})

        def open_local():
            close()
            page.locator('#tracked-open').click()
            render()

        def enter(realm):
            close(); walk(18, 6)
            page.keyboard.press('j')
            page.locator('#rpg-tabs [data-rpg="open"][data-id="worlds"]').click()
            if scope('[data-rpg="world-list"]').count():
                scope('[data-rpg="world-list"]').click()
            scope(f'[data-rpg="world-select"][data-id="{realm}"]').click()
            scope('[data-rpg="world-preview"]').click()
            check(realm+' travel needs its visible confirmation', scope('[data-rpg="world-confirm"]').is_visible())
            scope('[data-rpg="world-confirm"]').click(); render()
            check('travel enters '+realm+' without implicit acceptance', ev('Realm.diagnostics.scene') == 'world-'+realm)

        def act(d, step):
            s = next(s for s in d['steps'] if s['id'] == step)
            walk(s['x'], s['z'])
            open_local()
            scope(f'[data-rpg="trail-step"][data-id="{step}"]').click(); render()
            check('visible physical action records '+step, step in rec(d)['steps'])
            close()

        def walk_giver(d):
            target = ev('''d=>[[d.giver.x,d.giver.z+1.7],[d.giver.x+1.7,d.giver.z],
              [d.giver.x,d.giver.z-1.7],[d.giver.x-1.7,d.giver.z]].find(([x,z])=>
                RealmWorldFoundations.walkable('world-'+d.realm,x,z))''', d)
            check(d['realm']+' giver has a supported readable 1.7 m approach', target is not None)
            walk(*target)

        def prepare(d):
            walk_giver(d); open_local()
            terms = scope(f'[data-trail="{d["id"]}"]').inner_text()
            check(d['realm']+' acceptance terms disclose exact reward, danger, free return and no allegiance',
                  all(s in terms for s in ['Danger and route', 'Exact reward', str(d['reward']['xp'])+' XP',
                      str(d['reward']['coins'])+' sunmarks', str(d['reward']['ore'])+' ore', '9999', 'initial kit', 'allegiance', 'free']))
            check(d['realm']+' travel alone did not accept work', not rec(d)['accepted'])
            shot(d['realm']+'-before-accept')
            before = state(); scope('[data-rpg="trail-accept"]').click(); render()
            check(d['realm']+' explicit acceptance preserves equipment, inventory and older history',
                  rec(d)['accepted'] and preserved(state()) == preserved(before))
            close()
            for i, step in enumerate(d['enemy']['spawnAfter']):
                act(d, step)
                exists = ev('(id)=>Realm.diagnostics.adventure.enemies.some(e=>e.id===id)', d['enemy']['id'])
                check(d['realm']+f' declared encounter spawn gate {i+1}', exists == (i == len(d['enemy']['spawnAfter'])-1))
                if i == 0:
                    reload_check(d['realm']+' accepted partial preparation', d, False)

        def inspect(d):
            return ev('''id=>{const sim=Realm.test.worldContext().sim,e=RealmAdventure.runtime(sim).enemies.find(e=>e.id===id);
              return{enemy:e?{id:e.id,x:e.x,z:e.z,hp:e.hp,mode:e.mode,timer:e.timer,recovery:e.recovery}:null,
              player:{...sim.state.player},hp:sim.state.adventure.hp,elapsed:sim.state.adventure.elapsed,
              stamina:sim.state.adventure.stamina,tactics:JSON.parse(JSON.stringify(RealmCombat.runtime(sim))),
              arrows:RealmArsenal.runtime(sim).arrows.length,fx:RealmAdventure.runtime(sim).fx.map(f=>({...f})),cue:RealmCombat.threat(sim)};}''', d['enemy']['id'])

        def until_phase(d, phase, max_frames=500):
            result = ev('''([id,phase,max])=>{for(let i=0;i<max;i++){const sim=Realm.test.worldContext().sim,
              e=RealmAdventure.runtime(sim).enemies.find(e=>e.id===id);if(e?.mode===phase&&e.timer>.15)return{ok:true,timer:e.timer};
              Realm.test.step(.05);}return{ok:false};}''', [d['enemy']['id'], phase, max_frames])
            check(d['realm']+' actual '+phase+' AI window occurs', result['ok'], result)
            render()
            check(d['realm']+' visible '+phase+' cue mirrors AI', page.locator('#target-cue').is_visible() and
                  page.locator('#target-cue').get_attribute('data-phase') == phase)
            return result

        def approach(d, bow=False):
            e = d['enemy']; walk(e['x'], e['z']+12); walk(e['x'], e['z']+(4 if bow else 1.1))
            close(); page.keyboard.press('Tab'); render()
            check(d['realm']+' normal Tab selects the actual story actor', inspect(d)['tactics']['target'] == e['id'])

        def fight(d, bow=False):
            approach(d, bow)
            until_phase(d, 'windup')
            check('windup tells muted player to Brace or move', 'Brace' in page.locator('#target-cue-detail').inner_text() or 'Braced' in page.locator('#target-cue-detail').inner_text())
            before_guard = inspect(d)
            if before_guard['elapsed'] >= before_guard['tactics']['cooldowns']['guard']:
                page.locator('#skill-guard').click(); render()
                check('normal Brace button arms real mitigation', inspect(d)['tactics']['guardUntil'] > before_guard['elapsed'])
            shot(d['realm']+('-bow' if bow else '-blade')+'-windup-braced')
            if bow:
                # A single real projectile is fired while the bearing is closed.
                # Damage numbers/confirmed-hit FX must remain absent on impact.
                before = inspect(d)
                result = ev('(id)=>Realm.test.adventure("north-browser-closed-arrow","attack",{target:id})', d['enemy']['id'])
                check('closed-bearing regression launches an actual bow shot', result['ok'], result)
                blocked = ev('''([id,at,hp])=>{let arrows=false;for(let i=0;i<18;i++){
                  const sim=Realm.test.worldContext().sim;arrows ||= RealmArsenal.runtime(sim).arrows.length>0;
                  Realm.test.step(.05);const e=RealmAdventure.runtime(sim).enemies.find(e=>e.id===id),
                  fx=RealmAdventure.runtime(sim).fx.filter(f=>f.at>=at),walls=fx.filter(f=>f.kind==='arrow-wall');
                  if(walls.length)return{ok:arrows&&e.hp===hp&&walls.length===1&&!fx.some(f=>['hit','arrow-hit'].includes(f.kind))&&RealmCombat.runtime(sim).hits.length===0,
                    arrows,hp:e.hp,walls:walls.length,successFx:fx.filter(f=>['hit','arrow-hit'].includes(f.kind)).length};}
                  return{ok:false,arrows};}''', [d['enemy']['id'], before['elapsed'], before['enemy']['hp']])
                check('closed bearing has one obstruction cue, no success cue and no damage', blocked['ok'], blocked)
                render(); check('closed arrow emits no displayed damage number', page.locator('#combat-numbers span').count() == 0)
                shot('heaven-bow-closed-bearing')
            opening = until_phase(d, 'recover')
            if d['realm'] == 'heaven':
                check('prepared Choir actual recovery timer and visible cue are 2.6 seconds',
                      abs(opening['timer']-2.6) < 1e-8 and '2.6s' in page.locator('#target-cue-title').inner_text())
            check('recovery explicitly invites a real opening strike', 'Recovery opening' in page.locator('#target-cue-title').inner_text())
            shot(d['realm']+('-bow' if bow else '-blade')+'-recovery')
            baseline = state(); page.locator('#skill-auto').click(); render()
            check('normal autoattack button enables production intent', inspect(d)['tactics']['auto'])
            result = ev('''d=>{const sim=Realm.test.worldContext().sim,start=sim.state.adventure.elapsed,impacts=[],phases=new Set();
              let frames=0,guards=0,heals=0,arrows=false,lastHP=90,closed=0;
              while(!sim.state.realmTrails.records[d.id].steps.includes(d.enemy.defeatStep)&&frames++<2400){
                const e=RealmAdventure.runtime(sim).enemies.find(e=>e.id===d.enemy.id),a=sim.state.adventure,
                t=RealmCombat.runtime(sim),r=RealmAdventure.runtime(sim),cue=RealmCombat.threat(sim);
                if(a.hp<=0)return{ok:false,error:'traveler died',frames};if(cue)phases.add(cue.phase);
                if(cue?.phase==='windup'&&a.stamina>=20&&a.elapsed>=t.cooldowns.guard){Realm.test.adventure('north-brace-'+frames,'guard');guards++;}
                if(a.hp<45&&a.tonics&&a.elapsed>=r.cooldowns.heal){Realm.test.adventure('north-heal-'+frames,'heal');heals++;}
                const w=RealmArsenal.weapon(a),radius=w.style==='bow'?4:1.1;
                if(Math.hypot(sim.state.player.x-e.x,sim.state.player.z-e.z)>=w.reach-.2&&!Realm.test.path.length){
                  const move=Realm.test.move(e.x,e.z+radius);if(!move.ok)return{ok:false,error:move.error};}
                const mode=e.mode,hp=e.hp,hits=t.hits.length;Realm.test.step(.05);arrows ||= RealmArsenal.runtime(sim).arrows.length>0;
                if(d.realm==='heaven'&&mode!=='recover'&&e.mode!=='recover'&&e.hp===hp&&t.hits.length===hits)closed++;
                if(e.hp<lastHP){impacts.push({at:a.elapsed-start,mode:e.mode,before:lastHP,hp:e.hp});lastHP=e.hp;}
              }
              return{ok:frames<2400&&lastHP===0,frames,seconds:sim.state.adventure.elapsed-start,guards,heals,arrows,
                phases:[...phases],impacts,closed,healthAfter:sim.state.adventure.hp};}''', d)
            check(d['realm']+(' bow' if bow else ' blade')+' earns actual actor defeat through timed combat', result.get('ok'), result)
            check('fight includes multiple real impacts and AI warning/recovery', len(result['impacts']) >= 2 and 'windup' in result['phases'] and 'recover' in result['phases'])
            if d['realm'] == 'heaven':
                check('all successful bearing damage lands only in real recovery', all(i['mode'] == 'recover' for i in result['impacts']) and result['closed'] > 0)
            if bow:
                check('bow defeat includes actual in-flight projectiles', result['arrows'])
            check('story defeat gives no older XP, drop or defeated reward',
                  all(state()['adventure'][k] == baseline['adventure'][k] for k in ['xp', 'coins', 'ore', 'drops', 'defeated']) and preserved(state()) == preserved(baseline))
            report['combats'].append({'quest': d['id'], 'weapon': 'bow' if bow else 'blade', **result})
            shot(d['realm']+('-bow' if bow else '-blade')+'-disabled')
            ev('Realm.test.adventure("north-clear","target-clear")')

        def reload_check(label, d, expected):
            close(); before = state(); check(label+' saves native origin', ev('Realm.test.save()')['ok'])
            page.reload(wait_until='load'); page.wait_for_function('window.Realm'); render()
            after = state()
            check(label+' native reload retains ledger and canonical property', after['realmTrails'] == before['realmTrails'] and
                  preserved(after) == preserved(before) and all(after['adventure'][k] == before['adventure'][k] for k in ['xp', 'coins', 'ore']))
            check(label+' resumes the home checkpoint', ev('Realm.diagnostics.scene') == 'valley')
            enter(d['realm'])
            check(label+' retains expected unpaid/paid status', rec(d)['claimed'] == expected)

        def claim(d, prefix):
            walk_giver(d); open_local()
            required = [s['id'] for s in d['steps'] if not s['optional']]
            check(prefix+' complete but unpaid UI has explicit claim', all(s in rec(d)['steps'] for s in required) and not rec(d)['claimed'] and scope('[data-rpg="trail-claim"]').is_visible())
            shot(prefix+'-ready-unpaid')
            reload_check(prefix+' ready', d, False)
            check(prefix+' disabled story actor stays absent after reload', not ev('(id)=>Realm.diagnostics.adventure.enemies.some(e=>e.id===id)', d['enemy']['id']))
            walk_giver(d); open_local(); before = state()
            scope('[data-rpg="trail-claim"]').click(); render(); after = state()
            check(prefix+' native explicit claim pays the exact declared fee once', rec(d)['claimed'] and
                  all(after['adventure'][k]-before['adventure'][k] == d['reward'][k] for k in ['xp', 'coins', 'ore']) and preserved(after) == preserved(before))
            check(prefix+' paid UI replaces claim with completion', 'TRAIL COMPLETE' in scope(f'[data-trail="{d["id"]}"]').inner_text() and scope('[data-rpg="trail-claim"]').count() == 0)
            shot(prefix+'-paid')
            paid = state(); result = ev('(q)=>Realm.test.trailCommand("claim",{quest:q,request:"different-browser-id"})', d['id'])
            check(prefix+' different request cannot replay reward', result.get('duplicate') and state() == paid)
            reload_check(prefix+' paid', d, True)
            walk_giver(d); open_local()
            check(prefix+' native reload keeps visible paid recognition and no claim control',
                  'TRAIL COMPLETE' in scope(f'[data-trail="{d["id"]}"]').inner_text() and scope('[data-rpg="trail-claim"]').count() == 0)
            close(); page.keyboard.press('v'); render(); check(prefix+' V reaches diorama', ev('Realm.diagnostics.camera.projection') == 'orthographic'); shot(prefix+'-diorama')
            page.keyboard.press('v'); render(); check(prefix+' V returns to third person', ev('Realm.diagnostics.camera.projection') == 'perspective'); shot(prefix+'-third')
            before = state(); page.locator('#world-home').click(); render()
            check(prefix+' free home return preserves work and balance', ev('Realm.diagnostics.scene') == 'valley' and state()['realmTrails'] == before['realmTrails'] and
                  all(state()['adventure'][k] == before['adventure'][k] for k in ['xp', 'coins', 'ore']))

        def install(variant):
            close(); raw = json.loads((SOURCES/variant/'00_COMMAND_EARNED_KIT.json').read_text(encoding='utf-8'))
            ev('s=>Realm.test.replace(s)', raw); render()
            page.locator('#settings').click(); page.locator('#setting-reducedMotion').check(); page.locator('#close-panel').click(); render()
            check(variant+' uses muted reduced-motion actual UI setting', not ev('Realm.diagnostics.audio.enabled') and state()['settings']['reducedMotion'] and page.locator('body').evaluate('(e)=>e.classList.contains("reduced")'))
            report['events'].append({'fixture': variant, 'file': str(SOURCES/variant/'00_COMMAND_EARNED_KIT.json'), 'sha256': sha(SOURCES/variant/'00_COMMAND_EARNED_KIT.json')})

        install('fresh-blade')
        enter('heaven'); heaven = ev('RealmTrails.definition("heaven-broken-choir-v1")'); prepare(heaven)
        approach(heaven); until_phase(heaven, 'windup'); page.locator('#skill-guard').click(); until_phase(heaven, 'recover')
        check('unprepared Choir real recovery is 1.8 seconds', abs(inspect(heaven)['enemy']['recovery']-1.8) < 1e-8 and '1.8s' in page.locator('#target-cue-title').inner_text())
        before_core = inspect(heaven)['enemy']; act(heaven, 'spillway')
        after_core = inspect(heaven)['enemy']
        check('physical optional spillway extends future real recovery to 2.6 without replacing health', after_core['recovery'] == 2.6 and after_core['hp'] == before_core['hp'])
        fight(heaven); act(heaven, 'garden-repair'); claim(heaven, 'heaven-blade')
        enter('hell'); hell = ev('RealmTrails.definition("hell-open-cage-v1")'); prepare(hell); fight(hell); act(hell, 'escort-start')
        open_local(); scope('[data-rpg="trail-escort-wait"]').click(); render()
        actor = lambda: ev('()=>JSON.parse(JSON.stringify(RealmTrails.escort(Realm.test.worldContext().sim)))')
        stopped = actor(); close(); ev('Realm.test.step(.4)')
        check('native Wait stops the actual ally without earning arrival', actor()['x'] == stopped['x'] and actor()['z'] == stopped['z'] and not rec(hell)['assisted'] and 'refuge-arrival' not in rec(hell)['steps'])
        open_local(); shot('hell-neris-wait-ui'); scope('[data-rpg="trail-escort-follow"]').click(); close()
        walk(-31, -83); ev('Realm.test.step(9)')
        check('Neris really follows to the first safe checkpoint', rec(hell)['checkpoint'] >= 1 and 'refuge-arrival' not in rec(hell)['steps'])
        checkpoint = rec(hell)['checkpoint']; reload_check('Neris partial escorted route', hell, False)
        after_actor = actor()
        check('cold browser reload reconstructs Neris at the durable safe checkpoint',
              checkpoint == rec(hell)['checkpoint'] and abs(after_actor['x']-hell['escort']['route'][checkpoint]['x']) < .001 and abs(after_actor['z']-hell['escort']['route'][checkpoint]['z']) < .001)
        # Player-only arrival is a negative control using a real walk; it cannot
        # move a distant waiting ally or record her arrival.
        walk(-12, 27); ev('Realm.test.step(.3)')
        check('player reaching Refuge alone cannot complete Neris arrival', 'refuge-arrival' not in rec(hell)['steps'] and 'Waiting' in actor()['status'])
        shot('hell-refuge-player-only-unpaid'); near = actor(); walk(near['x'], near['z'])
        escorted = ev('''d=>{const sim=Realm.test.worldContext().sim;let frames=0,pauses=0,catchups=0;
          const distance=(p,q)=>Math.hypot(p.x-q.x,p.z-q.z);
          while(!sim.state.realmTrails.records[d.id].steps.includes(d.escort.arrivalStep)&&frames++<5000){
            const r=sim.state.realmTrails.records[d.id],a=RealmTrails.escort(sim),next=d.escort.route[r.checkpoint+1];
            if(!a||!next)return{ok:false,error:'missing actor/route'};
            if(distance(sim.state.player,a)>6){
              const behind=distance(sim.state.player,next)>distance(a,next)+.5;
              if(behind){catchups++;for(let j=0;j<600&&distance(sim.state.player,RealmTrails.escort(sim))>3;j++){
                  const ally=RealmTrails.escort(sim);if(!Realm.test.path.length||j%20===0){const m=Realm.test.move(ally.x,ally.z);if(!m.ok)return{ok:false,error:m.error};}
                  Realm.test.step(.05);frames++;}}
              else{Realm.test.move(sim.state.player.x,sim.state.player.z);pauses++;
                for(let j=0;j<300&&distance(sim.state.player,RealmTrails.escort(sim))>3;j++){Realm.test.step(.05);frames++;}}}
            if(!Realm.test.path.length&&Math.hypot(sim.state.player.x-next.x,sim.state.player.z-next.z)>.2){const m=Realm.test.move(next.x,next.z);if(!m.ok)return{ok:false,error:m.error};}
            const old={...RealmTrails.escort(sim)},oldPlayer={...sim.state.player};Realm.test.step(.05);const a2=RealmTrails.escort(sim);
            if(!RealmWorldFoundations.walkable(sim.room,a2.x,a2.z)||!RealmWorldFoundations.segment(sim.room,oldPlayer,sim.state.player))return{ok:false,error:'unsupported actual movement'};
            if(r.checkpoint===old.checkpoint&&!RealmWorldFoundations.segment(sim.room,old,a2))return{ok:false,error:'ally crossed collision'};
          }const r=sim.state.realmTrails.records[d.id],a=RealmTrails.escort(sim),end=d.escort.route.at(-1);
          return{ok:frames<5000&&!r.assisted&&r.checkpoint===d.escort.route.length-1&&Math.hypot(a.x-end.x,a.z-end.z)<.3,frames,pauses,catchups,actor:{...a},player:{...sim.state.player},record:{...r}};}''', hell)
        check('real Neris walks the supported route into Refuge with no assisted extraction', escorted['ok'], escorted)
        report['events'].append({'escort': escorted}); shot('hell-neris-actual-refuge'); claim(hell, 'hell-blade')
        install('fresh-bow'); enter('heaven'); prepare(heaven); act(heaven, 'spillway'); fight(heaven, True); act(heaven, 'garden-repair'); claim(heaven, 'heaven-bow')
        check('all camera/claim/reload cases keep sound muted and reduced motion on', not ev('Realm.diagnostics.audio.enabled') and state()['settings']['reducedMotion'])
        check('no browser runtime or diagnostics errors', not report['browser_errors'] and not ev('Realm.diagnostics.errors'))
        report['renderer'] = ev('Realm.diagnostics.renderer')
        report['final_world'] = state()
        check('offline HTML remained stable throughout this focused run', sha(ROOT/'index.html') == report['html_sha256'])
        report['status'] = 'passed'
        context.close()
except Exception:
    report['status'] = 'failed'
    report['errors'].append(traceback.format_exc())
    raise
finally:
    if server:
        server.shutdown(); server.server_close()
    report['final_html_sha256'] = sha(ROOT/'index.html')
    report['source_drift'] = report['final_html_sha256'] != report['html_sha256']
    (OUT/'REPORT.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
