#!/usr/bin/env python3
"""Prepared first-load native acceptance; importing this file never opens a browser.

Positive journeys use normal app RAF, native import/travel/work/claim controls and
native WASD following. No test mode, accelerated tick, actor placement, arrival
grant or direct reward edit. Original EE inputs have explicit current or historical
command-earned provenance and frozen receipts. Capacity derivatives and Storage refusal
are separately labelled boundaries. Synthetic profiles and all evidence remain.
Automated known-route acceptance is not human feel, performance or release proof.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import argparse
import hashlib
import importlib.util
import json
import math
import os
import subprocess
import sys
import tempfile
import threading
import time
import traceback

ROOT = Path(__file__).resolve().parents[1]
JOB = 'earth-first-load-through-v1'
VARIANTS = {'blade':'fresh-blade', 'bow':'fresh-bow', 'veteran':'veteran'}
OLD_IDS = ('heaven-propagation-bed-v1','hell-refuge-water-v1','atlantis-bellglass-lamp-v1','cosmos-drawing-shelf-v1')
STORY = ('assess-load','prepare-allocation','read-water','clear-crossing','read-root-load','clear-root-pests','brace-root-channel','deliver-allocation')
FRESH = {'accepted':False,'choice':None,'steps':[],'claimed':False}
MODULES = ('earth-consignment-data.js','earth-consignment.js','earth-consignment-motion.js','earth-consignment-ui.js','earth-consignment-art.js','local-life.js','core.js','app.js','rpg-ui.js','world-foundations-ui.js')
EARNED_MODULES = ('earth-expedition.js','earth-fieldcraft.js','core.js','adventure.js','combat.js','arsenal.js','world-foundations.js','elderweald-world.js')
INITIALIZE = r"""(()=>{const key='eternities.realm10.characters.v1';window.__flStartup=localStorage.getItem(key);const old=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){const r=old.call(this,k,v);if(k===key)console.debug('__FL_NATIVE_WRITE__'+String(v));return r;};})()"""


def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def read(path):return json.loads(Path(path).read_text(encoding='utf-8-sig'))
def write_new(path, value):
    with Path(path).open('x',encoding='utf-8',newline='\n') as f:
        f.write(value if isinstance(value,str) else json.dumps(value,indent=2)+'\n')
def distance(a,b):return math.hypot(a['x']-b['x'],a['z']-b['z'])


def source_check(world, receipt, variant):
    if receipt.get('status')!='passed' or receipt.get('variant')!=VARIANTS[variant] or receipt.get('sourceDrift') is not False:
        raise ValueError('Exact passed command-earned cohort receipt required')
    for k in ('positionEdits','inventoryGrants','manualDamage','plantedDefeats'):
        if type(receipt.get(k)) is not int or receipt[k]!=0:raise ValueError('Original earned source has an injection or missing disclosure: '+k)
    if receipt.get('canonicalPreservation') is not True or not receipt.get('sourceHashes') or not receipt.get('harnessSha256'):
        raise ValueError('Original source/caller/preservation receipt required')
    s=world.get('earthExpedition',{}).get('story',{})
    if world.get('version')!=9 or world.get('adventure',{}).get('version')!=12 or s.get('accepted') is not True or s.get('claimed') is not True or s.get('steps')!=list(STORY):
        raise ValueError('Exact genuinely claimed original EE story required')
    if s.get('branch') not in ('stormfall-recovery','managed-coppice') or receipt.get('branch')!=s['branch']:
        raise ValueError('Immutable original source branch differs')
    if world['earthExpedition'].get('patrol')!={'lastClaim':0,'active':None}:
        raise ValueError('Use 04_FIRST_CLAIMED before new patrol actors, not a planted cleared roster')
    if world.get('localLife',{}).get('records',{}).get(JOB,FRESH)!=FRESH:
        raise ValueError('Positive source may not contain new-load acceptance, arrivals or payment')
    if not world['adventure'].get('started') or world['adventure'].get('hp',0)<=0:
        raise ValueError('Living earned traveller required')
    return 'stormfall' if s['branch']=='stormfall-recovery' else 'coppice'


def current_epoch(root):
    return {'mode':'current-command-earned','head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),
            'htmlSha256':sha(root/'index.html'),
            'runtimeSources':{p.relative_to(root).as_posix():sha(p) for p in sorted((root/'src').glob('*')) if p.is_file()},
            'callerSha256':sha(root/'tests/earth_expedition_journey.cjs')}


def current_receipt(receipt,epoch):
    hashes=receipt.get('sourceHashes',{})
    if receipt.get('harnessSha256')!=epoch['callerSha256'] or not set(EARNED_MODULES).issubset(hashes):raise ValueError('Current original EE caller/owner receipt required')
    if any(Path(k).name!=k or epoch['runtimeSources'].get('src/'+k)!=v for k,v in hashes.items()):raise ValueError('Original EE producer source differs from current integrated epoch')


def cohort(path,root=None):
    manifest=read(path)
    if manifest.get('schema')!='first-load-native-cohort-v1' or set(manifest.get('variants',{}))!=set(VARIANTS):raise ValueError('Exact three-cohort manifest required')
    mode=manifest.get('epoch',{}).get('mode')
    if mode not in ('historical-frozen-native03','current-command-earned'):raise ValueError('Explicit historical or current prerequisite provenance required')
    epoch=None
    if mode=='current-command-earned':
        if root is None:root=Path(os.environ.get('FIRSTLIGHT_ROOT',ROOT)).resolve()
        epoch=current_epoch(root)
        if manifest.get('epoch')!=epoch:raise ValueError('Current prerequisite full source epoch changed; do not rehash or fall back')
    result={}
    for variant,row in manifest['variants'].items():
        resolved={}
        for kind in ('source','journey'):
            link=row[kind];p=Path(link['path'])
            if not p.is_absolute():p=Path(path).parent/p
            p=p.resolve()
            if not p.is_file() or sha(p)!=link['sha256']:raise ValueError('Frozen original '+kind+' receipt changed')
            resolved[kind]=p
        world,receipt=read(resolved['source']),read(resolved['journey'])
        if resolved['source'].name!='04_FIRST_CLAIMED.json' or resolved['journey'].parent!=resolved['source'].parent:raise ValueError('Exact sibling original caller stage required')
        suffix=source_check(world,receipt,variant)
        if epoch:current_receipt(receipt,epoch)
        result[variant]={**resolved,'world':world,'receipt':receipt,'suffix':suffix,'provenance':mode}
    if {r['suffix'] for r in result.values()}!={'stormfall','coppice'}:raise ValueError('Sources must cover both immutable original branches')
    return result


def current_preflight(path,root):
    path=Path(path)
    if not path.is_file():raise ValueError('Explicit current prerequisite cohort missing; no historical fallback')
    manifest=read(path)
    if manifest.get('epoch',{}).get('mode')!='current-command-earned':raise ValueError('Mandatory verifier requires the current invocation earned cohort')
    rows=cohort(path,root)
    if build_epoch(root)!=manifest['epoch']['htmlSha256']:raise ValueError('Current cohort/build epoch differs')
    return rows


def preserved(world):
    # Runtime clocks/health/camera/journal are allowed to advance. Owned facts are not.
    keys=('journeys','realmTrails','earthExpedition','hellCampaign','heavenCampaign','atlantisCampaign','cosmosCampaign','earthHomecoming','bridgeCommunity','homeHistory','notes','score','scoreRevision','retreat','visitor','flowers','seed','version','visited')
    a=world['adventure'];exclude={'elapsed','hp','stamina','revision','coins'}
    return {'world':{k:world[k] for k in keys},'adventure':{k:v for k,v in a.items() if k not in exclude},
            'oldLocal':{k:world['localLife']['records'][k] for k in OLD_IDS},
            'sandbox':{k:v for k,v in world['sandbox'].items() if k not in ('inventory','elapsed')}}


def import_preserved(original, imported):
    """Compare immediate live import to its sealed source before a new baseline.

    The generic history predicate excludes economy for later payment checks.
    Import has no payment authority: both economy owners must match exactly.
    """
    try:
        before, after = original['adventure']['coins'], imported['adventure']['coins']
        inventory_before, inventory_after = original['sandbox']['inventory'], imported['sandbox']['inventory']
        return (preserved(imported) == preserved(original)
                and type(before) is int and type(after) is int and after == before
                and isinstance(inventory_before, dict) and isinstance(inventory_after, dict)
                and set(inventory_after) == set(inventory_before)
                and all(type(v) is int and type(inventory_after[k]) is int
                        and inventory_after[k] == v for k, v in inventory_before.items()))
    except (KeyError, TypeError):
        return False


def payment(before,after):
    return after['adventure']['coins']==before['adventure']['coins']+4 and after['adventure']['xp']==before['adventure']['xp'] and after['adventure']['ore']==before['adventure']['ore'] and after['sandbox']['inventory']=={k:v+(2 if k in ('wood','fiber') else 0) for k,v in before['sandbox']['inventory'].items()}


def native_keys(player,worker,yaw):
    """Inverse of actual app camera-relative manual basis; no model movement."""
    dx,dz=worker['x']-player['x'],worker['z']-player['z']
    if math.hypot(dx,dz)<=1.05:return ()
    x,z=dx*math.cos(yaw)-dz*math.sin(yaw),dx*math.sin(yaw)+dz*math.cos(yaw)
    choices=[(('w',),0,-1),(('w','d'),1,-1),(('d',),1,0),(('s','d'),1,1),(('s',),0,1),(('s','a'),-1,1),(('a',),-1,0),(('w','a'),-1,-1)]
    return max(choices,key=lambda p:(x*p[1]+z*p[2])/math.hypot(p[1],p[2]))[0]


def standing_follow_boundary(initial,actual,limits):
    """Read-only standing-player oracle, including prospective-step suspension.

    Motion refuses the next bounded step before crossing its follow radius.
    A stationary traveller therefore sees the load stop within one step of
    that radius, never beyond it. A player deliberately retreating differs.
    """
    try:
        if any(type(limits[k]) not in (int,float) or not math.isfinite(limits[k]) for k in ('farWait','speed','maxDt')):return False
        if (limits['farWait'],limits['speed'],limits['maxDt'])!=(10,1.6,.1):return False
        v=actual['view'];gap=distance(actual['player'],v)
        return (actual['scene']=='world-earthlands' and not actual['paused'] and actual['hp']>0
                and actual['focused'] is True and actual['hidden'] is False
                and v['status']=='waiting' and v['reason']=='player-far' and v['ready'] is False
                and distance(initial['player'],actual['player'])<1e-8 and v['distanceTraveled']>0
                and actual['prefix']==[]
                and limits['farWait']-limits['speed']*limits['maxDt']-1e-9<=gap<=limits['farWait']+1e-9)
    except (KeyError,TypeError,ValueError):return False


def build_epoch(root):
    html=(root/'index.html').read_text(encoding='utf-8-sig')
    for name in MODULES:
        source=root/'src'/name
        if not source.is_file() or source.read_text(encoding='utf-8-sig') not in html:raise ValueError('Integrated exact-source build pending: '+name)
    if sha(root/'index.html')!=sha(root/'FIRSTLIGHT_VALLEY.html'):raise ValueError('Identical generated HTML required')
    return sha(root/'index.html')


def pixels_valid(data):
    return data['changed']>10 and data['delta']==0 and data['glError']==0 and data['unchanged'] is True and data['restored'] is True


class NativeInputDeadline(RuntimeError):
    """Validated ordinary-RAF budget expiry; native journeys remain strict."""
    def __init__(self,timeout_ms,frames,elapsed_ms):
        self.timeout_ms,self.frames,self.elapsed_ms=timeout_ms,frames,elapsed_ms
        super().__init__('Native input RAF deadline: two ordinary frames were not observed within '+str(timeout_ms)+' ms')


RAF_NATIVE_INPUT = r"""limit=>new Promise(resolve=>{
 const start=performance.now();let done=false,frames=0,timer;
 const deadline=()=>{if(done)return;const elapsedMs=performance.now()-start;
  if(elapsedMs<limit){timer=setTimeout(deadline,Math.ceil(limit-elapsedMs));return;}
  done=true;clearTimeout(timer);resolve({deadline:true,frames,elapsedMs});};
 timer=setTimeout(deadline,limit);
 const frame=()=>{if(done)return;if(performance.now()-start>=limit){deadline();return;}
  if(++frames===2){done=true;clearTimeout(timer);resolve({frames,elapsedMs:performance.now()-start});}
  else requestAnimationFrame(frame);};
 requestAnimationFrame(frame);
})"""

class Native:
    def __init__(self,pw,args,report,origin,case):
        self.pw,self.args,self.report,self.origin,self.case=pw,args,report,origin,case
        self.context=self.page=None;self.raw=None;self.legacy=None;self.first_legacy=False
        self.folder=args.output/case;self.folder.mkdir();self.profile=Path(tempfile.mkdtemp(prefix='synthetic-owned-',dir=self.folder))
        self.row={'profile':str(self.profile),'checks':[],'restarts':[],'walks':[],'samples':[],'nativeWrites':0,'boundary':case.startswith('SYNTHETIC-')};report['cases'][case]=self.row
    def check(self,name,ok,detail=None):
        self.row['checks'].append({'name':name,'passed':bool(ok),'detail':detail})
        print(('PASS ' if ok else 'FAIL ')+self.case+' '+name,flush=True)
        if not ok:raise AssertionError(self.case+': '+name+' '+repr(detail))
    def ev(self,js,arg=None):return self.page.evaluate(js,arg)
    def state(self):return self.ev('()=>Realm.state')
    def diag(self):return self.ev('()=>Realm.diagnostics')
    def view(self):return self.diag()['consignment']['view']
    def record(self):return self.state()['localLife']['records'][JOB]
    def click(self,selector):
        loc=self.page.locator(selector);self.check('unique native '+selector,loc.count()==1,loc.count());loc.click()
    def close(self):
        if self.page.locator('#rpg-window').evaluate('(e)=>e.open'):self.click('#rpg-close')
        if self.page.locator('#drawer').evaluate('(e)=>e.classList.contains("open")'):self.click('#close-panel')
    def workspace(self,tab):
        self.close();self.page.keyboard.press('j');self.click('#rpg-tabs [data-rpg="open"][data-id="'+tab+'"]')
    def panel(self):
        self.workspace('journal');self.click('[data-rpg="civic-open"][data-id="earthlands"]');self.page.wait_for_selector('[data-consignment-panel]')
    def action(self,kind,id=None):
        self.panel();s='[data-rpg="consignment-'+kind+'"][data-job="'+JOB+'"]'+('' if id is None else '[data-id="'+id+'"]');self.click(s)
    def start(self):
        spec=importlib.util.spec_from_file_location('firstload_browser_support',self.args.root/'tools/browser_support.py');support=importlib.util.module_from_spec(spec);spec.loader.exec_module(support)
        self.context=self.pw.chromium.launch_persistent_context(str(self.profile),**support.launch_kwargs(self.args.renderer),viewport={'width':1440,'height':960})
        self.context.add_init_script(INITIALIZE)
        def route(r):
            if r.request.url.startswith(self.origin+'/'):r.continue_()
            else:self.report['externalRequests'].append(r.request.url);r.abort()
        self.context.route('**/*',route);self.page=self.context.pages[0] if self.context.pages else self.context.new_page()
        def console(msg):
            if msg.text.startswith('__FL_NATIVE_WRITE__'):self.raw=msg.text[len('__FL_NATIVE_WRITE__'):];self.row['nativeWrites']+=1
        self.page.on('console',console);self.page.on('pageerror',lambda e:self.report['browserErrors'].append(str(e)))
        response=self.page.goto(self.origin+'/index.html',wait_until='load',timeout=60000);self.page.wait_for_function('()=>!!window.Realm&&getComputedStyle(document.querySelector("#loading")).opacity==="0"')
        self.check('exact served epoch',hashlib.sha256(response.body()).hexdigest()==self.report['html_sha256'])
        self.check('production ordinary RAF without test controls',self.ev('()=>typeof Realm.test==="undefined"'))
        self.check('read-only actual consignment diagnostics installed',self.ev('()=>typeof RealmEarthConsignmentData!=="undefined"&&Object.hasOwn(Realm.diagnostics,"consignment")'))
        self.check('canonical actual four compound choices and route counts',self.ev('()=>{const D=RealmEarthConsignmentData;return D.ID==="earth-first-load-through-v1"&&RealmEarthConsignmentMotion.DEFINITION===D.definition&&Object.isFrozen(D.definition)&&!Object.hasOwn(D.definition,"steps")&&JSON.stringify(D.choices.map(c=>c.id).sort())===JSON.stringify(["south-stormfall","north-stormfall","south-coppice","north-coppice"].sort())&&D.required("south-stormfall").length===5&&D.required("south-coppice").length===5&&D.required("north-stormfall").length===12&&D.required("north-coppice").length===12;}'))
        d=self.diag();software=any(s in d['renderer'].lower() for s in ('swiftshader','llvmpipe','software'))
        self.check('requested actual WebGL2 renderer',d['mode']=='webgl2' and software==(self.args.renderer=='software'),d['renderer'])
        legacy=self.ev('()=>localStorage.getItem(RealmCore.KEY)')
        if not self.first_legacy:self.legacy=legacy;self.first_legacy=True
        else:self.check('legacy key survives whole browser restart',legacy==self.legacy)
        self.ev('()=>{const p=RealmArt.WorldArt.prototype,o=p.commit;p.commit=function(...a){const r=o.apply(this,a);window.__flArt=this;return r;};}')
    def import_world(self,source):
        self.workspace('characters')
        with self.page.expect_file_chooser() as chooser:self.click('[data-rpg="chars-import"]')
        chooser.value.set_files(str(source));self.page.wait_for_selector('[data-rpg="chars-confirm-import"]');self.click('[data-rpg="chars-confirm-import"]')
        self.page.wait_for_function('()=>Realm.diagnostics.characters.active==="character-2"&&Realm.diagnostics.characters.writer===true')
        self.close();self.click('#settings');self.page.locator('#setting-timeFlow').uncheck()
        quality='low' if self.args.renderer=='software' else 'balanced'
        self.page.locator('#quality').select_option(quality);self.click('#close-panel')
        actual=self.state()['settings']['quality'];self.row['nativeQuality']={'requested':quality,'actual':actual,'rendererRequest':self.args.renderer}
        self.check('actual native rendering quality selected through settings UI',actual==quality,self.row['nativeQuality'])
    def stored(self):
        return self.ev('()=>{const s=RealmCharacters.validate(JSON.parse(localStorage.getItem(RealmCharacters.KEY)));return s.slots.find(v=>v.id===s.active).world;}')
    def capture(self,label):
        w=self.state();write_new(self.folder/(label+'_WORLD.json'),w)
        raw=self.ev('()=>localStorage.getItem(RealmCharacters.KEY)');write_new(self.folder/(label+'_NATIVE_STORE.json'),raw)
        self.page.screenshot(path=str(self.folder/(label+'.png')));return w
    def enter(self):
        def select():
            self.workspace('worlds')
            if self.page.locator('[data-rpg="world-list"]').count():self.click('[data-rpg="world-list"]')
            self.click('[data-rpg="world-select"][data-id="earthlands"]')
        select()
        if self.page.locator('[data-rpg="world-road"]').count() and not self.page.locator('[data-rpg="world-preview"]').count():
            self.click('[data-rpg="world-road"]');self.settle({'x':18,'z':6},2.8);select()
        self.click('[data-rpg="world-preview"]');self.click('[data-rpg="world-confirm"]');self.page.wait_for_function('()=>Realm.diagnostics.scene==="world-earthlands"')
        self.home_checkpoint=self.state()['player'];self.close()
    def settle(self,target,near=2.8):
        start=time.monotonic();stable=None;last=None
        while time.monotonic()-start<240:
            d=self.diag();p=d['adventure']['player'];now=time.monotonic()
            if not d['adventure']['paused'] and distance(p,target)<=near and last and distance(p,last)<.01:
                stable=stable or now
                if now-stable>=.3:self.row['walks'].append({'target':target,'player':p,'seconds':now-start});return
            else:stable=None
            last=p;self.page.wait_for_timeout(100)
        raise TimeoutError('Native walking did not settle: '+repr(target))
    def walk_work(self,which):
        target=self.ev('id=>id==="giver"?RealmEarthConsignmentData.definition.giver:id==="return"?RealmEarthConsignmentData.definition.returner:Realm.diagnostics.consignment.view',which)
        if which=='return' and self.record()['claimed']:
            # Paid UI correctly has no new-load work/claim controls. Merren is
            # still an existing physical world point; do not fabricate a button.
            self.walk_world('merren');return
        else:self.action('walk',which)
        self.settle(target)
    def walk_world(self,id):
        target=self.ev('id=>RealmWorldFoundations.definition("earthlands").points.find(p=>p.id===id)',id)
        self.workspace('atlas');self.click('[data-rpg="world-walk"][data-id="'+id+'"]');self.settle(target)
    def home(self):
        self.close();self.click('#world-home');self.page.wait_for_function('()=>Realm.diagnostics.scene==="valley"')
        self.check('free return actual original travel checkpoint',distance(self.diag()['adventure']['player'],self.home_checkpoint)<.01)
    def restart(self,label):
        self.close();before=self.state();stored=self.stored();self.check('exact record/economy/history durable before restart',stored['localLife']==before['localLife'] and stored['sandbox']['inventory']==before['sandbox']['inventory'] and stored['adventure']['coins']==before['adventure']['coins'] and preserved(stored)==preserved(before))
        self.context.close();self.context=None
        self.check('successful native writes captured through close',self.raw is not None)
        write_new(self.folder/(label+'_CLOSED_NATIVE_BYTES.json'),self.raw);raw=self.raw;self.start()
        self.check('startup reads exact final native bytes',self.ev('()=>window.__flStartup')==raw)
        after=self.state();self.check('whole browser restart preserves saved checkpoint and owner facts',self.diag()['scene']=='valley' and after['localLife']==before['localLife'] and after['sandbox']['inventory']==before['sandbox']['inventory'] and after['adventure']['coins']==before['adventure']['coins'] and preserved(after)==preserved(before))
        self.row['restarts'].append(label)
    def follow_sample(self):
        # One JS turn: no RAF tick can separate player/view/prefix/clock reads.
        value=self.ev(r"""()=>{const d=Realm.diagnostics,s=Realm.state;return {
         scene:d.scene,player:d.adventure.player,view:d.consignment?.view||null,
         paused:d.adventure.paused,fps:d.fps,yaw:d.camera.yaw,frame:d.consignment?.frame||null,
         hp:s.adventure.hp,elapsed:s.adventure.elapsed,quality:s.settings.quality,
         prefix:s.localLife.records["earth-first-load-through-v1"].steps,
         focused:document.activeElement===document.querySelector("#world"),hidden:document.hidden};}""")
        value['head']=self.report.get('head')
        retained={k:v for k,v in value.items() if k!='frame'}
        history=self.row.setdefault('followDiagnostics',[]);history.append(retained);del history[:-5]
        return value

    def hold_native_keys_for_frames(self,keys,timeout_ms=10000):
        # Capture may share this helper with its own smaller remaining budget.
        if type(timeout_ms) is not int or not 1<=timeout_ms<=10000:
            raise ValueError('Native RAF input budget must be 1..10000 ms')
        if not isinstance(keys,(tuple,list)) or any(k not in ('w','a','s','d') for k in keys):
            raise ValueError('Only native traveller movement keys are allowed')
        try:
            for key in keys:self.page.keyboard.down(key)
            observed=self.ev(RAF_NATIVE_INPUT,timeout_ms)
            valid=(isinstance(observed,dict) and type(observed.get('frames')) is int and
                   type(observed.get('elapsedMs')) in (int,float) and math.isfinite(observed['elapsedMs']))
            if valid and observed.get('deadline') is True:
                if set(observed)!={'deadline','frames','elapsedMs'} or not 0<=observed['frames']<2 or observed['elapsedMs']<timeout_ms:
                    raise RuntimeError('Native input did not confirm a valid ordinary RAF deadline')
                raise NativeInputDeadline(timeout_ms,observed['frames'],observed['elapsedMs'])
            if (not valid or set(observed)!={'frames','elapsedMs'} or observed['frames']!=2 or
                    not 0<=observed['elapsedMs']<timeout_ms):
                raise RuntimeError('Native input did not confirm two bounded ordinary RAF callbacks')
            return observed
        finally:
            for key in keys:self.page.keyboard.up(key)

    def follow(self,stop_after=None):
        self.close();start=time.monotonic();initial=self.view();prefix=self.record()['steps'];moving_sample=None
        self.page.locator('#world').focus()
        try:
            while time.monotonic()-start<240:
                d=self.follow_sample()
                if time.monotonic()-start>=240:raise TimeoutError('Real native carrier leg did not complete within 240 seconds')
                v=d['view'];p=d['player']
                if d['prefix']!=prefix:raise AssertionError('Automatic durable arrival bypassed native record control')
                if d['hp']<=0:raise AssertionError('Actual traveller died; no rescued positive result')
                if not v or d['scene']!='world-earthlands':raise AssertionError('Actual Earthlands carrier context disappeared')
                if d['paused'] or v['status']=='paused':raise AssertionError('Actual traveller/carrier paused unexpectedly during native following')
                if d['hidden'] or not d['focused']:raise AssertionError('Actual native canvas lost visible input focus')
                if v['status']=='blocked':raise AssertionError('Actual threat/support blocked: '+str(v.get('detail') or v.get('reason')))
                if v['ready']:
                    self.check('normal RAF actually transported carrier without automatic arrival',distance(initial,v)>.5 and v['distanceTraveled']>0 and moving_sample is not None)
                    self.row['samples'].append({'initial':initial,'ready':v,'seconds':time.monotonic()-start,'movingFrame':moving_sample});return v
                if v['status']!='moving':raise AssertionError('Actual carrier stopped during native following: '+str(v['status'])+' / '+str(v.get('detail') or v.get('reason')))
                if d['frame'] and d['frame']['walking']:moving_sample=d['frame']
                if stop_after is not None and distance(initial,v)>=stop_after:return v
                remaining=240-(time.monotonic()-start)
                if remaining<=0:break
                self.hold_native_keys_for_frames(native_keys(p,v,d['yaw']),min(10000,max(1,math.floor(remaining*1000))))
            raise TimeoutError('Real native carrier leg did not complete within 240 seconds')
        except Exception as error:
            self.row['followError']=str(error);raise
        finally:
            for key in ('w','a','s','d'):self.page.keyboard.up(key)
    def compact(self):
        before=self.state();labels=before['settings']['labels']
        self.close();self.click('#settings')
        self.page.locator('#setting-labels').set_checked(not labels)
        self.page.locator('#setting-labels').set_checked(labels)
        self.click('#close-panel')
        self.check('native settings close restores external focus and preserves accounts',self.ev('()=>document.activeElement.id==="settings"&&!document.querySelector("#drawer").contains(document.activeElement)') and import_preserved(before,self.state()) and self.state()['settings']['labels']==labels)
        self.panel()
        bounds=self.ev('()=>{const d=document.querySelector("#drawer");return{width:innerWidth,documentWidth:document.documentElement.scrollWidth,drawerOpen:d.classList.contains("open"),drawerInert:d.inert,drawerRectCount:d.getClientRects().length};}')
        self.row.setdefault('compactLayout',[]).append({'phase':'closed-wide-workspace',**bounds})
        self.check('closed settings drawer does not extend the current work viewport',bounds['documentWidth']<=bounds['width']+1 and not bounds['drawerOpen'] and bounds['drawerInert'],bounds)
        self.page.set_viewport_size({'width':390,'height':844});self.panel()
        bounds=self.ev('()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth})')
        self.row['compactLayout'].append({'phase':'compact-workspace',**bounds})
        self.check('compact readable controls without horizontal overflow',bounds['documentWidth']<=bounds['width']+1,bounds)
        for loc in self.page.locator('[data-consignment-panel] button').all():
            loc.scroll_into_view_if_needed();r=loc.bounding_box();self.check('compact native button remains reachable',r is not None and r['x']>=-1 and r['x']+r['width']<=391,r)
        self.page.screenshot(path=str(self.folder/'COMPACT.png'))
        self.close();self.click('#settings')
        bounds=self.ev('()=>{const d=document.querySelector("#drawer"),r=d.getBoundingClientRect();return{left:r.left,right:r.right,open:d.classList.contains("open"),inert:d.inert,focused:d.contains(document.activeElement),display:getComputedStyle(d).display};}')
        self.check('compact settings reopen keeps visible focused controls within viewport',bounds['open'] and not bounds['inert'] and bounds['focused'] and bounds['display']!='none' and bounds['left']>=-1 and bounds['right']<=391,bounds)
        self.page.keyboard.press('Escape')
        self.check('native Escape closes compact settings without layout or focus leakage',self.ev('()=>{const d=document.querySelector("#drawer");return!d.classList.contains("open")&&d.inert&&d.getClientRects().length===0&&document.activeElement.id==="settings"&&document.documentElement.scrollWidth<=innerWidth+1;}'))
        self.page.set_viewport_size({'width':1440,'height':960});self.panel()
        self.check('native settings roundtrip retains all original accounts and economy',import_preserved(before,self.state()) and self.state()['settings']['labels']==labels)
    def far_wait_probe(self):
        """One real standing-player retreat boundary, with visible recovery.

        The carrier walks normally while the player deliberately stays behind.
        Neither position nor saved progress is edited to manufacture this wait.
        """
        self.close();self.page.locator('#world').focus();start=time.monotonic();initial=self.follow_sample()
        while time.monotonic()-start<60:
            actual=self.follow_sample();v=actual['view']
            if actual['paused'] or actual['hp']<=0 or not v or v['status']=='blocked':raise AssertionError('Actual carrier far-wait probe interrupted')
            if v['status']=='waiting' and v['reason']=='player-far':break
            self.page.wait_for_timeout(100)
        else:raise TimeoutError('Actual standing-player separation did not suspend carrier')
        limits=self.ev('()=>RealmEarthConsignmentMotion.LIMITS')
        self.row['farWaitProbe']={'initial':initial,'far':actual,'seconds':time.monotonic()-start,'limits':limits,'distance':distance(actual['player'],v)}
        self.check('real carrier auto-wait refuses the next step beyond its follow boundary without moving the traveller or saving arrival',standing_follow_boundary(initial,actual,limits) and self.record()['steps']==[],self.row['farWaitProbe'])
        self.page.wait_for_function('()=>document.querySelector("#tracked-detail").textContent.includes("catch up to the load")')
        self.check('actual far tracker explains catchup and deliberate Continue','deliberately choose Continue' in self.page.locator('#tracked-detail').inner_text())
        self.page.set_viewport_size({'width':390,'height':844});self.hold_native_keys_for_frames(())
        self.check('actual compact far-wait feedback stays visible without overflow',self.page.locator('#tracked-detail').is_visible() and self.ev('()=>document.documentElement.scrollWidth<=innerWidth+1'))
        self.page.screenshot(path=str(self.folder/'FAR_WAIT_COMPACT.png'));self.page.set_viewport_size({'width':1440,'height':960})
        self.walk_work('carrier');near=self.follow_sample()
        self.check('native catchup retains actual waiting load without auto-resume',near['view']['status']=='waiting' and near['view']['reason']=='player-far' and distance(near['view'],v)<1e-8 and self.record()['steps']==[])
        self.page.wait_for_function('()=>document.querySelector("#tracked-detail").textContent.includes("Carrier waiting · E · deliberately choose Continue")')
        self.action('continue');self.check('deliberate native Continue resumes after catchup',self.view()['status']=='moving')
    def pixels(self,label,stock=False):
        for camera in ('follow','adventure'):
            self.close();self.click('#rpg-hud [data-rpg="camera"][data-id="'+camera+'"]');self.page.keyboard.press('r');self.page.wait_for_timeout(250)
            data=self.ev(r"""stock=>{const e=__flArt.e,di=Realm.diagnostics,c=di.consignment,simBefore=JSON.stringify(Realm.state),groups=e.dynamic.map(b=>({b,items:b.items,data:b.data,count:b.count})),args=[Realm.state.adventure.elapsed,Realm.state.hour,Realm.state.weather==='rain'];const roles={};for(const p of c.parts)roles[p.consignmentPart]=(roles[p.consignmentPart]||0)+1;const root=c.frame,p=Realm.project(root.x,root.base+1.1,root.z),read=()=>{const a=new Uint8Array(e.mainF.w*e.mainF.h*4),g=e.gl;g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);g.readPixels(0,0,e.mainF.w,e.mainF.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;},restore=()=>{for(const q of groups){q.b.items=q.items;q.b.data=q.data;e.updateBatch(q.b);q.b.count=q.count;}};e.render(...args);const full=read();try{for(const q of groups){q.b.items=q.items.filter(i=>!(stock?i.consignmentPart?.startsWith('received-'):i.consignmentPart?.startsWith('carrier-')||i.consignmentPart?.startsWith('carried-')));e.updateBatch(q.b);}e.render(...args);const absent=read();restore();e.render(...args);const same=read();let changed=0,delta=0;for(let i=0;i<full.length;i+=4){if([0,1,2].some(k=>Math.abs(full[i+k]-absent[i+k])>2))changed++;for(const k of[0,1,2])delta+=Math.abs(full[i+k]-same[i+k]);}return{roles,frame:root,changed,delta,p,barTop:document.querySelector('#skillbar').getBoundingClientRect().top,glError:e.gl.getError(),unchanged:simBefore===JSON.stringify(Realm.state),restored:groups.every(q=>q.b.items===q.items&&q.b.data===q.data&&q.b.count===q.count)};}finally{restore();}}""",stock)
            self.check(label+' actual projected '+camera+' pixels',pixels_valid(data),data)
            self.check(label+' actual carrier body clear of bottom HUD',data['p']['visible'] and data['p']['y']<data['barTop']-8,data['p'])
            expected=4 if self.record()['choice'].endswith('stormfall') else 3;pieces=data['frame']['stockPieces'] if stock else data['frame']['cargoPieces']
            self.check(label+' exact new supplier cargo without double display',len(pieces)==expected and (not stock or not data['frame']['cargoPieces']),pieces)
            self.capture(label+'_'+camera)
    def refuse(self,on):
        self.ev(r"""on=>{if(on){if(window.__flQuota)throw Error('already refusing');window.__flQuota=Storage.prototype.setItem;window.__flRefused=0;Storage.prototype.setItem=function(k,v){if(k===RealmCharacters.KEY){__flRefused++;throw new DOMException('Labelled first-load native quota refusal','QuotaExceededError');}return __flQuota.call(this,k,v);};}else{Storage.prototype.setItem=__flQuota;delete window.__flQuota;}}""",on)
    def run(self,origin,route):
        self.start();self.import_world(origin['source']);self.check('native import retains original earned source facts and economy',import_preserved(origin['world'],self.state()) and self.record()==FRESH)
        self.row['origin']={'source':str(origin['source']),'sha256':sha(origin['source']),'journey':str(origin['journey']),'journey_sha256':sha(origin['journey']),'producerSourceHashes':origin['receipt']['sourceHashes'],'provenance':origin['provenance'],'prerequisitesReplayedByDriver':False,'currentCallerMatched':origin['provenance']=='current-command-earned'}
        self.enter();self.walk_work('giver');self.panel();before=self.state();choices=self.ev('()=>Array.from(document.querySelectorAll("[data-rpg=consignment-accept]")).map(b=>b.dataset.id)')
        self.check('two immutable branch-matching choices before acceptance',set(choices)=={'south-'+origin['suffix'],'north-'+origin['suffix']})
        self.check('exact payment disclosed before acceptance','4 sunmarks · 2 timber · 2 meadow fibre · no XP' in self.page.locator('[data-consignment-panel]').inner_text())
        self.compact();self.action('accept',route+'-'+origin['suffix']);self.check('native acceptance changes no earlier history or materials',preserved(self.state())==preserved(before) and self.state()['sandbox']['inventory']==before['sandbox']['inventory'] and self.record()['steps']==[])
        self.restart('ACCEPTED');self.enter();self.walk_work('carrier');self.pixels('SUPPLIED');self.action('wait');self.close();v=self.view();self.page.wait_for_timeout(450);self.check('explicit Wait retains actual unsaved position',distance(v,self.view())<1e-8 and self.record()['steps']==[])
        count=5 if route=='south' else 12;self.action('continue')
        if self.case=='blade-south':self.far_wait_probe()
        for index in range(count):
            self.follow();self.panel();ready=self.state();self.check('leg is unpaid and materials retained before native arrival',preserved(ready)==preserved(before) and ready['sandbox']['inventory']==before['sandbox']['inventory'] and ready['adventure']['coins']==before['adventure']['coins'])
            self.action('continue');self.check('native arrival appends exactly one expected contiguous stop',len(self.record()['steps'])==index+1 and self.record()['steps']==self.ev('()=>RealmEarthConsignmentData.required(Realm.state.localLife.records[RealmEarthConsignmentData.ID]).slice(0,Realm.state.localLife.records[RealmEarthConsignmentData.ID].steps.length)'))
            if index==0:
                partial=self.follow(stop_after=3);self.home();self.restart('PARTIAL_DISCARDED');self.enter();checkpoint=self.ev('()=>RealmEarthConsignmentData.checkpoint(Realm.state.localLife.records[RealmEarthConsignmentData.ID])')
                self.check('cold reload discards actual unsaved leg at declared saved stop',distance(self.view(),checkpoint)<1e-9 and distance(partial,checkpoint)>2 and len(self.record()['steps'])==1)
                self.walk_work('carrier');self.action('continue')
        self.check('complete exact selected route, payment still unclaimed',len(self.record()['steps'])==count and not self.record()['claimed']);unpaid=self.capture('READY_UNPAID');self.pixels('RECEIVED_UNPAID',True)
        self.restart('READY_UNPAID');self.enter();self.walk_work('return');self.panel();before_pay=self.state();self.action('claim');after=self.state();self.check('explicit native Merren pays the whole finite fee once',payment(before_pay,after) and self.record()['claimed'] and preserved(before_pay)==preserved(after))
        self.home();self.restart('PAID');self.enter();self.walk_work('return');self.panel();self.check('cold paid page has no second claim',self.page.locator('[data-rpg="consignment-claim"]').count()==0 and self.state()['sandbox']['inventory']==after['sandbox']['inventory'] and self.state()['adventure']['coins']==after['adventure']['coins'])
        self.walk_world('delivery-register');self.pixels('RECEIVED_PAID',True);self.check('legacy native key remains untouched',self.ev('()=>localStorage.getItem(RealmCore.KEY)')==self.legacy);self.capture('FINAL');return unpaid
    def boundary(self,source,capacity=False):
        self.start();self.import_world(source);self.enter();self.walk_work('return');self.panel();before=self.state();raw=self.ev('()=>localStorage.getItem(RealmCharacters.KEY)')
        if not capacity:self.refuse(True)
        try:
            self.action('claim');self.check('labelled refused fee retains exact paused world and native bytes',self.state()==before and self.ev('()=>localStorage.getItem(RealmCharacters.KEY)')==raw and not self.record()['claimed'])
            self.check('refusal cause shown by actual native controller',('Make room' if capacity else 'refus') in self.page.locator('[data-consignment-notice]').inner_text())
            if not capacity:self.check('actual Store attempted refused write',self.ev('()=>window.__flRefused')>0)
        finally:
            if not capacity:self.refuse(False)
        if not capacity:
            self.action('claim');self.check('same actual earned unpaid record retries once after quota refusal',payment(before,self.state()) and self.record()['claimed'])
        self.capture('BOUNDARY_FINAL');self.restart('BOUNDARY_COLD');self.check('boundary cold status retained',self.record()['claimed'] is (not capacity))
    def finish(self):
        failing=sys.exc_info()[0] is not None;problem=None;closed=self.context is None
        if self.context:
            try:
                if failing:
                    try:self.page.screenshot(path=str(self.folder/'FAILURE.png'),timeout=3000)
                    except Exception as e:self.row['failureScreenshotError']=repr(e)
                self.close();self.capture('CLOSE_RECEIPT')
            except Exception as e:
                problem=e;self.row['closeEvidenceError']=repr(e)
            finally:
                try:self.context.close();self.context=None;closed=True
                except Exception as e:
                    self.row['contextCloseError']=repr(e);problem=problem or e
        if self.raw:write_new(self.folder/'FINAL_NATIVE_BYTES.json',self.raw)
        self.row['contextClosed']=closed
        if problem is not None and not failing:raise problem


def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--root',type=Path,default=ROOT);p.add_argument('--cohort',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--renderer',choices=('hardware','software'),required=True);args=p.parse_args(argv)
    absolute=args.output.is_absolute();args.root=args.root.resolve();args.output=args.output.resolve()
    if not absolute or (os.name=='nt' and args.output.drive.lower()!='d:') or args.output.exists():p.error('Fresh absolute D-drive output required; no reuse or cleanup')
    if args.output==args.root or args.root in args.output.parents:p.error('Evidence must be outside the production checkout')
    origins=cohort(args.cohort,args.root);build_epoch(args.root)
    from playwright.sync_api import sync_playwright
    args.output.mkdir();report={'status':'running','method':__doc__,'cases':{},'browserErrors':[],'externalRequests':[],'harness_sha256':sha(__file__),'cohort_sha256':sha(args.cohort),'cohortProvenance':next(iter(origins.values()))['provenance'],'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=args.root,text=True).strip(),'html_sha256':sha(args.root/'index.html'),'sources':{str(x.relative_to(args.root)):sha(x) for x in sorted((args.root/'src').glob('*')) if x.is_file()},'execution':'ordinary-RAF-native-input','humanAcceptance':False,'performanceCertified':False,'errors':[]}
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self,*a,**kw):super().__init__(*a,directory=str(args.root),**kw)
        def log_message(self,*a):pass
    server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();origin='http://127.0.0.1:'+str(server.server_port);report['origin']=origin;h=None
    try:
        with sync_playwright() as pw:
            first_unpaid=None
            for variant,data in origins.items():
                for route in ('south','north'):
                    h=Native(pw,args,report,origin,variant+'-'+route)
                    try:
                        unpaid=h.run(data,route)
                        if first_unpaid is None:first_unpaid=unpaid
                    finally:h.finish()
            for capacity in (True,False):
                name='SYNTHETIC-capacity' if capacity else 'SYNTHETIC-quota';world=json.loads(json.dumps(first_unpaid))
                if capacity:world['adventure']['coins']=9999
                source=args.output/(name+'_INPUT.json');write_new(source,world)
                report.setdefault('boundaries',[]).append({'path':str(source),'sha256':sha(source),'base':'actual first positive native READY_UNPAID','edits':{'adventure.coins':9999} if capacity else {'Storage.setItem':'temporary labelled refusal only'},'positiveProgressInjected':False})
                h=Native(pw,args,report,origin,name)
                try:h.boundary(source,capacity)
                finally:h.finish()
        if report['browserErrors'] or report['externalRequests']:raise AssertionError('Runtime errors or external requests retained')
        if sha(args.root/'index.html')!=report['html_sha256'] or any(sha(args.root/k)!=v for k,v in report['sources'].items()):raise AssertionError('Source epoch changed during native run')
        report['status']='passed'
    except Exception:
        report['status']='failed';report['errors'].append(traceback.format_exc())
        if h and h.page:
            try:h.page.screenshot(path=str(args.output/'FAILURE.png'),timeout=3000)
            except Exception as e:report['failureScreenshotError']=repr(e)
        raise
    finally:
        server.shutdown();server.server_close();report['serverClosed']=True;write_new(args.output/'FIRST_LOAD_NATIVE_REPORT.json',report)


if __name__=='__main__':main()
