"""Integrated realm giver art in isolated software Chromium.

The labelled Chapter I command-earned character is imported through the actual
character preview/confirmation UI. Roads and native giver approaches use real
production UI and ordinary RAF movement, never accelerated ticks or planted
player/actor state. Synchronous appearance-only sampling/ablation is labelled;
it does not establish human readability, pacing, GPU speed or enjoyment.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from contextlib import contextmanager
import argparse, copy, hashlib, json, math, os, subprocess, tempfile, threading, time, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, default=ROOT/'evidence10/realm-givers-browser')
parser.add_argument('--drawer-probe', action='store_true', help='Bounded native close-button overlap reproduction only.')
parser.add_argument('--labels-only', action='store_true', help='Bounded Tovan/Merren companion-label and native control regression only.')
args = parser.parse_args()
assert not (args.drawer_probe and args.labels_only), 'Choose one bounded probe.'
OUT = args.output.resolve()
if os.name == 'nt':
    assert OUT.drive.upper() == 'D:', 'Heavy Windows evidence must remain on D.'
OUT.mkdir(parents=True, exist_ok=True)
SOURCE = ROOT/'examples/CHAPTER_COMPLETED_EARNED.json'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
fixture = json.loads(SOURCE.read_text(encoding='utf-8'))
report = {'method': __doc__, 'status': 'running', 'checks': [], 'events': [],
          'browser_errors': [], 'errors': [], 'screenshots': [], 'givers': [],
          'ablations': [], 'companion_labels': [],
          'scope': 'companion-labels-only' if args.labels_only else 'drawer-only' if args.drawer_probe else 'all-givers-and-companion-labels',
          'html_sha256': sha(ROOT/'index.html'),
          'earned_source': {'path': str(SOURCE), 'sha256': sha(SOURCE)},
          'source_head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
          'accelerated_ticks': False, 'capture_mode': False, 'state_replacements': 0,
          'player_position_edits': 0, 'actor_position_edits': 0, 'inventory_grants': 0,
          'appearance_ablation': 'Temporary giver draw omission in one synchronous JS task; restored before RAF resumes.'}

def check(name, ok, detail=None):
    report['checks'].append({'name': name, 'passed': bool(ok), 'detail': detail})
    print(('PASS ' if ok else 'FAIL ')+name, flush=True)
    if not ok:
        raise AssertionError(name+(': '+str(detail) if detail is not None else ''))

def preserved(s):
    a = s['adventure']
    return {'adventure': {k: v for k, v in a.items() if k not in ['elapsed', 'stamina']},
            'sandbox': {k: s['sandbox'][k] for k in ['inventory','placed','nextId','stats','milestones','bridge','recentCommands']},
            **{k: s[k] for k in ['notes', 'score', 'scoreRevision', 'retreat',
                                'visitor', 'flowers', 'journeys', 'realmTrails']}}

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)
    def log_message(self, *a):
        pass

@contextmanager
def failure_capture():
    try:
        yield
    except Exception:
        try:
            report['failure_context']={'diagnostics':diag(),'toast':page.locator('#toast').inner_text(),
                'close':page.locator('#close-panel').bounding_box(),'home':page.locator('#world-home').bounding_box()}
            screenshot('FAILURE')
        except Exception:
            pass
        raise

INSTALL = r"""()=>{
 const old=window.__giverProbe;if(old?.installed)return;
 const serial=v=>JSON.parse(JSON.stringify(v,(_,n)=>ArrayBuffer.isView(n)?Array.from(n):n));
 const p=window.__giverProbe={installed:true,calls:0,last:{},pure:true,hidden:null};
 const original=RealmGiversArt.draw;p.original=original;
 RealmGiversArt.draw=function(out,point,options){
  const before=JSON.stringify(Realm.state),sizes=Object.fromEntries(['box','round','octa'].map(k=>[k,out[k].length]));
  const frame=original.call(this,out,point,options);
  const parts=['box','round','octa'].flatMap(kind=>out[kind].slice(sizes[kind]).map(it=>({kind,...it})));
  p.pure&&=JSON.stringify(Realm.state)===before;p.calls++;
  p.last[point.id]=serial({point,options,frame,parts,scene:Realm.diagnostics.scene});
  if(p.hidden===point.id)for(const kind of ['box','round','octa'])out[kind].splice(sizes[kind]);
  return frame;
 };
 const render=RealmEngine.Engine.prototype.render;
 RealmEngine.Engine.prototype.render=function(...args){p.engine=this;return render.apply(this,args);};
}"""

VALIDATE = r"""id=>{
 const r=__giverProbe.last[id],M=RealmEngine.M,d=RealmWorldFoundations.definition(Realm.diagnostics.scene);
 if(!r||!d)return{ok:false,reason:'No actual integrated draw'};
 const point=d.points.find(p=>p.id===id),base=RealmWorldFoundations.height(d.room,point.x,point.z),yaw=point.yaw??Math.PI;
 const expected=M.compose(point.x,base,point.z,1,1,1,0,yaw,0),near=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]))<1e-5;
 let finite=true,supported=true,grips=true,minY=Infinity,maxY=-Infinity,maxRadius=0;
 for(const p of r.parts){finite&&=p.m.every(Number.isFinite)&&p.s.every(v=>Number.isFinite(v)&&v>0);
  const mesh=RealmEngine.geometry(p.kind);
  for(let i=0;i<mesh.length;i+=6){const v=M.transform(p.m,[mesh[i],mesh[i+1],mesh[i+2]]);finite&&=v.every(Number.isFinite);
   minY=Math.min(minY,v[1]);maxY=Math.max(maxY,v[1]);maxRadius=Math.max(maxRadius,Math.hypot(v[0]-point.x,v[2]-point.z));
   supported&&=v[1]>=base-2e-6&&d.patches.some(p=>Math.abs(v[0]-p.x)<=p.w/2+1e-6&&Math.abs(v[2]-p.z)<=p.d/2+1e-6);
  }
 }
 for(const t of r.frame.tools){const part=r.parts.find(p=>p.name===t.part);grips&&=!!part&&near(M.transform(part.m,t.partPoint),t.gripWorld)&&near(M.transform(r.frame.root,r.frame.joints[t.hand]),t.gripWorld);}
 const dynamic=__giverProbe.engine.dynamic.flatMap(b=>b.items.filter(i=>i.realmGiver===id));
 const projection=Realm.project(point.x,base+.90,point.z);
 return{ok:true,id,point:r.point,options:r.options,root:r.frame.root,instances:r.parts.length,
  declaredInstances:r.frame.instances,productionInstances:dynamic.length,finite,supported,grips,minY,maxY,maxRadius,
  anchorMatches:near(r.frame.root,Array.from(expected)),baseMatches:r.options.base===base,yawMatches:r.options.yaw===yaw,
  realmMatches:r.options.realm===d.id,pausedMatches:r.options.paused===Realm.diagnostics.adventure.paused,
  reducedMotionMatches:r.options.reducedMotion===Realm.state.settings.reducedMotion,
  projection,pure:__giverProbe.pure,tools:r.frame.tools,metrics:Realm.diagnostics.metrics};
}"""

ABLATE = r"""id=>{
 const p=__giverProbe,e=p.engine,g=e.gl,before=JSON.stringify(Realm.state),player=JSON.stringify(Realm.diagnostics.adventure.player);
 const read=()=>{const prior=g.getParameter(g.FRAMEBUFFER_BINDING);g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);
  const a=new Uint8Array(e.mainF.w*e.mainF.h*4);g.readPixels(0,0,e.mainF.w,e.mainF.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,prior);return a;};
 const diff=(a,b)=>a.reduce((n,v,i)=>n+(v!==b[i]),0);
 let full,absent,restored;
 try{for(let i=0;i<10;i++)Realm.test.render();full=read();p.hidden=id;Realm.test.render();absent=read();}
 finally{p.hidden=null;Realm.test.render();restored=read();}
 return{id,changedChannels:diff(full,absent),restoredChannels:diff(full,restored),width:e.mainF.w,height:e.mainF.h,
  glError:g.getError(),statePure:JSON.stringify(Realm.state)===before,playerPure:JSON.stringify(Realm.diagnostics.adventure.player)===player,writerRestored:p.hidden===null};
}"""

server = None
try:
    embedded = ['realm-givers-art.js', 'world-foundations-art.js', 'world-foundations-ui.js', 'adventure-ui.js',
                'world-foundations.js', 'world-heaven-hell.js', 'world-atlantis-earth.js', 'app.js']
    html = (ROOT/'index.html').read_text(encoding='utf-8')
    check('exact integrated sources are embedded in the offline build', all((ROOT/'src'/n).read_text(encoding='utf-8').strip() in html for n in embedded))
    check('labelled Chapter I command-earned source has the declared hash', sha(SOURCE)=='27cb70f57c3584f7de69f667544c8215c6fbc5f7f3d45d7fb7bc241f1cabce49')
    report['source_hashes'] = {n: sha(ROOT/'src'/n) for n in embedded}
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    with tempfile.TemporaryDirectory(prefix='firstlight-givers-') as profile, sync_playwright() as pw, failure_capture():
        context = pw.chromium.launch_persistent_context(profile, **chromium_launch_kwargs(), viewport={'width':1280,'height':800})
        page = context.new_page()
        page.set_default_timeout(15000)
        page.on('pageerror', lambda e: report['browser_errors'].append(str(e)))
        page.add_init_script('window.__ETERNITIES_TEST_MODE=true;')
        ev = lambda js, arg=None: page.evaluate(js, arg)
        state = lambda: ev('Realm.state')
        diag = lambda: ev('Realm.diagnostics')
        def close():
            if page.locator('#rpg-window').evaluate('(e)=>e.open'):
                page.locator('#rpg-close').click()
            if page.locator('#drawer').evaluate('(e)=>e.classList.contains("open")'):
                page.locator('#close-panel').click()
        def screenshot(name):
            path = OUT/(name+'.png');page.screenshot(path=str(path))
            report['screenshots'].append({'path':str(path),'sha256':sha(path),'scene':diag()['scene'],'camera':diag()['camera']['preset']})
        def wait_path(name):
            started = time.monotonic()
            page.wait_for_function('()=>!Realm.test.path.length', timeout=240000, polling=250)
            check(name+' finishes through ordinary RAF', not ev('Realm.test.path.length') and not diag()['adventure']['paused'])
            report['events'].append({'action':name,'wall_seconds':time.monotonic()-started,'elapsed':state()['adventure']['elapsed'],'player':diag()['adventure']['player']})
        def walk(x,z,name):
            close();r=ev('([x,z])=>Realm.test.move(x,z)',[x,z]);check(name+' movement is accepted',r.get('ok'),r)
            wait_path(name);p=diag()['adventure']['player'];check(name+' reaches its physical destination',math.hypot(p['x']-x,p['z']-z)<.25)
        def roads(realm):
            close();page.keyboard.press('j');page.locator('#rpg-tabs [data-rpg="open"][data-id="worlds"]').click()
            if page.locator('#rpg-content [data-rpg="world-list"]').count():page.locator('#rpg-content [data-rpg="world-list"]').click()
            page.locator('#rpg-content [data-rpg="world-select"][data-id="'+realm+'"]').click()
        def enter(realm):
            walk(18,6,'Walk to Roads marker');roads(realm)
            text=page.locator('#rpg-content').inner_text()
            check(realm+' crossing terms disclose free return and separate work consent','available at any time, free' in text and 'Crossing makes no allegiance' in text)
            page.locator('#rpg-content [data-rpg="world-preview"]').click()
            check(realm+' requires explicit crossing confirmation',page.locator('#rpg-content [data-rpg="world-confirm"]').is_visible())
            page.locator('#rpg-content [data-rpg="world-confirm"]').click()
            page.wait_for_function('(id)=>Realm.diagnostics.world?.id===id',arg=realm)
            now=preserved(state())
            check(realm+' crossing does not accept or pay work',now==baseline,{'changedProjectionFields':[k for k in now if now[k]!=baseline[k]]})
        def drawer_regression(label, compact=False, diving=False):
            close()
            if compact:page.set_viewport_size({'width':390,'height':844})
            page.locator('#settings').click()
            page.wait_for_function('()=>document.body.classList.contains("panel-open")')
            check(label+' drawer suppresses the home/label overlays',not page.locator('#world-home').is_visible() and not page.locator('#world-labels').is_visible())
            if diving:check(label+' drawer also suppresses the real depth overlay',not page.locator('#world-depth').is_visible())
            hit=page.locator('#close-panel').evaluate('(e)=>{const r=e.getBoundingClientRect(),t=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e===t||e.contains(t)}')
            check(label+' normal close control wins its actual hit test',hit)
            screenshot(label+'-settings')
            page.locator('#close-panel').click()
            check(label+' normal click closes Settings and restores free return',not page.locator('#drawer').evaluate('(e)=>e.classList.contains("open")') and page.locator('#world-home').is_visible())
            hit=page.locator('#world-home').evaluate('(e)=>{const r=e.getBoundingClientRect(),t=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e===t||e.contains(t)}')
            check(label+' restored home control is normally hit-testable',hit)
            if diving:check(label+' closing Settings restores actual depth information',page.locator('#world-depth').is_visible())
            if compact:page.set_viewport_size({'width':1280,'height':800})
        def companion_labels(point):
            """Real commands/walking only; record exact legitimate mode receipts."""
            id=point['id'];record={'id':id,'observations':[],'commands':[]};report['companion_labels'].append(record)
            def observe(stage):
                data=ev('''()=>{const d=Realm.diagnostics,s=Realm.state,c=d.adventure.companion,rig=Realm.test.companion(),def=RealmWorldFoundations.definition(d.scene),name=s.adventure.companion.name;
                 const e=[...document.querySelectorAll('#adventure-labels .adventure-label')].find(e=>e.textContent.startsWith(name+' ·'));
                 const expected=rig?Realm.project(c.x,rig.placement.base+1.45,c.z):null;
                 return{player:d.adventure.player,runtime:c,canonical:s.adventure.companion,camera:d.camera.preset,labelsEnabled:s.settings.labels,
                  nearPeople:def.points.filter(p=>p.kind==='person'&&Math.hypot(p.x-d.adventure.player.x,p.z-d.adventure.player.z)<=2.8).map(p=>p.id),
                  rig:rig?{placement:rig.placement,instances:rig.parts.length}:null,expected,
                  label:e?{text:e.textContent,x:parseFloat(e.style.left),y:parseFloat(e.style.top),visible:getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none'}:null};}''')
                data['stage']=stage;record['observations'].append(data);return data
            def cameras(stage, hidden):
                close()
                for camera in ['adventure','follow']:
                    if (diag()['camera']['preset']=='adventure')!=(camera=='adventure'):page.keyboard.press('v')
                    page.wait_for_timeout(400)
                    data=observe(stage+'-'+camera)
                    check(id+' '+stage+' '+camera+' keeps the actual bonded actor grounded and present',data['labelsEnabled'] and data['rig'] and data['rig']['instances']==33 and data['rig']['placement']['bonded'] and data['runtime']['room']==diag()['scene'] and math.hypot(data['rig']['placement']['x']-data['runtime']['x'],data['rig']['placement']['z']-data['runtime']['z'])<.02)
                    if hidden:
                        check(id+' '+stage+' '+camera+' suppresses only the companion tag at actual person range',id in data['nearPeople'] and data['label'] is None,data)
                    else:
                        check(id+' '+stage+' '+camera+' restores the visible tag outside every person range',not data['nearPeople'] and data['label'] and data['label']['visible'] and data['expected'] and data['expected']['visible'] and abs(data['label']['x']-data['expected']['x'])<1 and abs(data['label']['y']-data['expected']['y'])<1,data)
                    screenshot(id+'-tag-'+stage+'-'+camera)
            def mode(which):
                close();page.keyboard.press('c');page.locator('#rpg-tabs [data-rpg="open"][data-id="companion"]').click()
                button=page.locator('#rpg-content [data-rpg="companion"][data-id="'+which+'"]')
                check(id+' actual '+which+' control remains enabled in the Companion workspace',button.is_visible() and button.is_enabled() and diag()['adventure']['paused'])
                before=state();button.click();after=state();prior=before['adventure']['receipts'];receipts=after['adventure']['receipts'];added=receipts[-1]
                check(id+' '+which+' records exactly one accepted command with real terms',added['id'] not in [r['id'] for r in prior] and added['ok'] and json.loads(added['fp'])==['companion-mode',{'mode':which}] and receipts==(prior+[added])[-100:],added)
                expected=copy.deepcopy(preserved(before));expected['adventure']['companion']['mode']=which;expected['adventure']['revision']+=1;expected['adventure']['receipts']=receipts
                check(id+' '+which+' preserves currency, gear, bond and history except its explicit mode and receipt',preserved(after)==expected)
                check(id+' '+which+' retains working selected-mode feedback',page.locator('#rpg-content [data-rpg="companion"][data-id="'+which+'"]').is_disabled())
                record['commands'].append({'mode':which,'receipt':added,'revision_before':before['adventure']['revision'],'revision_after':after['adventure']['revision']})
                screenshot(id+'-companion-'+which);close()
                return preserved(after)
            check(id+' label regression starts with the existing earned follow bond',state()['adventure']['companion']=={'bonded':True,'name':'Briar','mode':'follow'})
            cameras('near',True)
            drawer_regression(id+'-tag-close',compact=id=='merren')
            after_stay=mode('stay');still=diag()['adventure']['companion']
            cameras('near-stay',True)
            p=diag()['adventure']['player']
            goal=ev('''([point,p])=>{const d=RealmWorldFoundations.definition(Realm.diagnostics.scene),angle=Math.atan2(p.x-point.x,p.z-point.z);
             for(const turn of [0,.35,-.35,.7,-.7,Math.PI/2,-Math.PI/2,Math.PI]){const q={x:point.x+Math.sin(angle+turn)*5.2,z:point.z+Math.cos(angle+turn)*5.2};
              if(RealmWorldFoundations.segment(d.room,p,q)&&d.points.every(t=>t.kind!=='person'||Math.hypot(q.x-t.x,q.z-t.z)>3.5))return q;}return null;}''',[point,p])
            check(id+' has a supported clear walk beyond the real suppression boundary',goal is not None,goal)
            walk(goal['x'],goal['z'],'Walk away from '+id+' while Briar stays');page.wait_for_timeout(350)
            c=diag()['adventure']['companion']
            moved=observe('away-stay')
            check(id+' Stay holds the physical actor while the player actually walks away',state()['adventure']['companion']['mode']=='stay' and math.hypot(c['x']-still['x'],c['z']-still['z'])<.001 and math.hypot(c['x']-moved['player']['x'],c['z']-moved['player']['z'])>2,{'held_before':still,'actual_after':c,'player_before':p,'player_after':moved['player']})
            check(id+' real walking and label suppression add no other canonical work',preserved(state())==after_stay)
            after_follow=mode('follow')
            page.wait_for_function('()=>{const d=Realm.diagnostics,c=d.adventure.companion,p=d.adventure.player;return Math.hypot(c.x-p.x,c.z-p.z)<1.5}',timeout=15000)
            check(id+' Follow physically brings Briar back without granting or recalling a new actor',math.hypot(diag()['adventure']['companion']['x']-still['x'],diag()['adventure']['companion']['z']-still['z'])>.5 and diag()['adventure']['companion']['status'] in ['Following','Beside you'])
            cameras('away-follow',False)
            close();page.keyboard.press('m');page.locator('#rpg-content [data-rpg="world-walk"][data-id="'+id+'"]').click();wait_path('Native reapproach to '+id)
            cameras('reapproach',True)
            check(id+' completed near/far control round trip preserves the exact permitted state',preserved(state())==after_follow)
            return after_follow
        response=page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='load')
        page.wait_for_function('()=>!!window.Realm')
        check('browser response matches frozen offline HTML',hashlib.sha256(response.body()).hexdigest()==report['html_sha256'])
        check('ordinary software WebGL RAF is active',diag()['mode']=='webgl2' and not ev('window.__ETERNITIES_CAPTURE_MODE===true'))
        report['renderer']=diag()['renderer']
        # Import is a real new character slot, with separate preview and confirmation.
        page.locator('#rpg-hud .rpg-nav [data-rpg="open"][data-id="more"]').click()
        page.locator('#rpg-content [data-rpg="open"][data-id="characters"]').click()
        before_import=diag()['characters']
        with page.expect_file_chooser() as choice:
            page.locator('#rpg-content [data-rpg="chars-import"]').click()
        choice.value.set_files(str(SOURCE))
        try:page.wait_for_selector('.chars-import-preview')
        except Exception:
            report['import_failure']={'toast':page.locator('#toast').inner_text(),'diagnostics':diag(),'page':page.locator('#rpg-content').inner_text()}
            screenshot('import-FAILURE');raise
        check('actual Import character opens a preview without creating a slot',diag()['characters']['count']==before_import['count'])
        screenshot('00-import-preview')
        page.locator('#rpg-content [data-rpg="chars-confirm-import"]').click()
        page.wait_for_function('(n)=>Realm.diagnostics.characters.count===n+1&&Realm.diagnostics.characters.writer',arg=before_import['count'])
        close();ev(INSTALL)
        migrated=state()
        check('confirmed earned character retains original currency, gear and Chapter I history',all(migrated['adventure'][k]==fixture['adventure'][k] for k in ['xp','coins','ore','owned','equipment','defeated','reward','relic','angelSeen']))
        baseline=preserved(migrated);home=diag()['adventure']['player'];report['imported_character']=diag()['characters']
        # Quality is a disclosed UI setting, not a performance or fidelity claim.
        page.locator('#settings').click();page.locator('#quality').select_option('low');page.locator('#close-panel').click()
        close()
        all_ids=[]
        for realm in (['hell','earthlands'] if args.labels_only else ['heaven','hell','atlantis','earthlands']):
            enter(realm)
            if args.drawer_probe:
                page.locator('#settings').click();page.locator('#setting-reducedMotion').check()
                report['drawer_probe']=ev('''()=>{const c=document.querySelector('#close-panel'),h=document.querySelector('#world-home'),r=c.getBoundingClientRect();return{close:r.toJSON(),home:h.getBoundingClientRect().toJSON(),topAtClose:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.id,drawerZ:getComputedStyle(document.querySelector('#drawer')).zIndex,homeZ:getComputedStyle(h).zIndex};}''')
                screenshot('drawer-close-overlap')
                page.locator('#close-panel').click(timeout=2500)
                check('normal drawer close remains reachable inside a realm',not page.locator('#drawer').evaluate('(e)=>e.classList.contains("open")'))
                break
            if realm=='heaven':
                drawer_regression('desktop-close')
                drawer_regression('compact-close',compact=True)
            d=ev('(id)=>RealmWorldFoundations.definition(id)',realm)
            targets=[p for p in d['points'] if p['kind']=='person' and ev('(id)=>Object.hasOwn(RealmGiversArt.profiles,id)',p['id'])]
            if args.labels_only:targets=[p for p in targets if p['id'] in ['hell-tovan','merren']]
            page.wait_for_function('()=>!!__giverProbe.engine')
            for point in targets:
                id=point['id'];all_ids.append(id)
                close();page.keyboard.press('m')
                page.locator('#rpg-content [data-rpg="world-walk"][data-id="'+id+'"]').click()
                wait_path('Native approach to '+id)
                p=diag()['adventure']['player'];distance=math.hypot(p['x']-point['x'],p['z']-point['z'])
                check(id+' native conversation offset is 1.7m',abs(distance-1.7)<.20,{'distance':distance,'player':p,'point':point})
                page.wait_for_function('(name)=>document.querySelector("#context-text").textContent.includes(name)',arg=point['name'])
                check(id+' close context names the actual person',point['name'] in page.locator('#context-text').inner_text())
                check(id+' close overhead label is intentionally suppressed',point['name'] not in page.locator('#world-labels').inner_text())
                if id in ['hell-tovan','merren']:
                    check(id+' approaches preserve state before any real companion command',preserved(state())==baseline)
                    baseline=companion_labels(point)
                if args.labels_only:
                    page.keyboard.press('e');page.wait_for_selector('#rpg-content .world-dialogue')
                    check(id+' tag repair retains the normal physical E dialogue',point['name'] in page.locator('#rpg-content').inner_text() and point['text'] in page.locator('#rpg-content .world-dialogue').inner_text())
                    screenshot(id+'-tag-interaction');close();continue
                for camera in ['adventure','follow']:
                    close()
                    if (diag()['camera']['preset']=='adventure')!=(camera=='adventure'):page.keyboard.press('v')
                    page.wait_for_timeout(350)
                    data=ev(VALIDATE,id);data['camera']=diag()['camera']['preset'];data['projectionMode']=diag()['camera']['projection'];report['givers'].append(data)
                    check(id+' '+camera+' uses the real point, ground, yaw and realm',data.get('ok') and all(data[k] for k in ['anchorMatches','baseMatches','yawMatches','realmMatches']))
                    check(id+' '+camera+' submits bounded attached production geometry',all(data[k] for k in ['finite','supported','grips','pure']) and data['instances']==data['declaredInstances']==data['productionInstances'] and 30<=data['instances']<=45 and data['maxRadius']<.65)
                    check(id+' '+camera+' honors caller pause and reduced motion',data['pausedMatches'] and data['reducedMotionMatches'])
                    check(id+' '+camera+' actor center is inside the current camera view',data['projection'] and data['projection']['visible'],data['projection'])
                    screenshot(id+'-'+camera)
                    appearance=ev(ABLATE,id);appearance['camera']=camera;report['ablations'].append(appearance)
                    check(id+' '+camera+' actual framebuffer contains this giver',appearance['changedChannels']>30,appearance)
                    check(id+' '+camera+' appearance ablation restores exact pixels and authority',appearance['restoredChannels']==0 and appearance['glError']==0 and appearance['statePure'] and appearance['playerPure'] and appearance['writerRestored'],appearance)
                page.keyboard.press('e');page.wait_for_selector('#rpg-content .world-dialogue')
                check(id+' physical E opens that existing name and dialogue',point['name'] in page.locator('#rpg-content').inner_text() and point['text'] in page.locator('#rpg-content .world-dialogue').inner_text())
                screenshot(id+'-interaction')
                before=ev('JSON.stringify(Realm.state)');ev('()=>{for(let i=0;i<3;i++)Realm.test.render()}')
                check(id+' repeated production drawing is byte-pure while modal-paused',ev('JSON.stringify(Realm.state)')==before and ev('__giverProbe.pure'))
                quiet_a=ev('(id)=>__giverProbe.last[id]',id);page.wait_for_timeout(300);quiet_b=ev('(id)=>__giverProbe.last[id]',id)
                check(id+' modal pause freezes actual body and tool matrices',quiet_a['options']['paused'] and [p['m'] for p in quiet_a['parts']]==[p['m'] for p in quiet_b['parts']])
                close()
            # Settings act through the real drawer; caller reduced-motion must
            # reach every actual point and remove time-dependent idle geometry.
            if not args.labels_only:
                page.locator('#settings').click();page.locator('#setting-reducedMotion').check();page.locator('#close-panel').click()
                page.wait_for_timeout(250)
                quiet_a=ev('Object.fromEntries(Object.entries(__giverProbe.last).filter(([id,r])=>r.options.realm===Realm.diagnostics.world.id))')
                page.wait_for_timeout(500);quiet_b=ev('Object.fromEntries(Object.entries(__giverProbe.last).filter(([id,r])=>r.options.realm===Realm.diagnostics.world.id))')
                check(realm+' UI reduced motion freezes all local giver geometry',all(r['options']['reducedMotion'] and [p['m'] for p in r['parts']]==[p['m'] for p in quiet_b[id]['parts']] for id,r in quiet_a.items()) and len(quiet_a)==len(targets))
                page.locator('#settings').click();page.locator('#setting-reducedMotion').uncheck();page.locator('#close-panel').click()
            check(realm+' visiting and inspecting preserve complete earned work/history',preserved(state())==baseline)
            if realm=='heaven':
                page.keyboard.press('e');saved=state();active=diag()['characters']['active'];check('managed native save commits through the app writer',ev('Realm.test.save()').get('ok'))
                page.reload(wait_until='load');page.wait_for_function('()=>!!window.Realm&&Realm.diagnostics.characters.writer');ev(INSTALL)
                check('native reload retains character and canonical history at home checkpoint',diag()['scene']=='valley' and diag()['characters']['active']==active and preserved(state())==preserved(saved))
                check('native reload leaves every local work unaccepted',all(r['active'] is None for r in state()['journeys']['realms'].values()) and all(not r['accepted'] for r in state()['realmTrails']['records'].values()))
            else:
                if realm=='atlantis':
                    close();page.keyboard.press('m');page.locator('#rpg-content [data-rpg="world-walk"][data-id="'+d['dive']['entryId']+'"]').click()
                    wait_path('Native approach to Tide Steps')
                    page.keyboard.press('e');page.locator('#rpg-content [data-rpg="world-dive"]').click()
                    page.wait_for_function('()=>Realm.diagnostics.world.dive!==null')
                    check('real gallery entry exposes current depth information',page.locator('#world-depth').is_visible())
                    drawer_regression('gallery-close',diving=True)
                page.locator('#world-home').click();page.wait_for_function('()=>Realm.diagnostics.scene==="valley"')
                check(realm+' native free return preserves canonical earned state',preserved(state())==baseline)
        if args.labels_only:
            check('bounded label probe covers exactly Tovan and Merren',all_ids==['hell-tovan','merren'] and len(report['companion_labels'])==2)
        elif not args.drawer_probe:
            check('all and only the nine adopted giver profiles were qualified',sorted(all_ids)==sorted(ev('Object.keys(RealmGiversArt.profiles)')) and len(all_ids)==9)
            calls=ev('__giverProbe.calls');page.wait_for_timeout(250)
            check('old home NPC route invokes no adopted giver drawing',ev('__giverProbe.calls')==calls)
            enter('cosmos');page.wait_for_timeout(250)
            check('existing Cosmos people retain their original drawing path',ev('__giverProbe.calls')==calls)
            page.locator('#world-home').click();page.wait_for_function('()=>Realm.diagnostics.scene==="valley"')
            check('Cosmos negative control returns freely without new work',preserved(state())==baseline)
        check('final managed save succeeds',ev('Realm.test.save()').get('ok'));final=state();active=diag()['characters']['active']
        page.reload(wait_until='load');page.wait_for_function('()=>!!window.Realm&&Realm.diagnostics.characters.writer');ev(INSTALL)
        check('final native reload preserves character ownership, gear, currencies and history',diag()['scene']=='valley' and diag()['characters']['active']==active and preserved(state())==preserved(final)==baseline)
        check('no browser or app errors',not report['browser_errors'] and not diag()['errors'])
        report['final_state']=state();report['final_diagnostics']=diag();report['status']='passed';screenshot('final-home');context.close()
except Exception:
    report['status']='failed';report['errors'].append(traceback.format_exc())
    try:screenshot('FAILURE')
    except Exception:pass
    raise
finally:
    if server:server.shutdown();server.server_close()
    (OUT/'REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
