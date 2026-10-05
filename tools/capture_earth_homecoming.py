#!/usr/bin/env python3
"""One ordinary-RAF Earth homecoming take from a byte-linked earned relay checkpoint.

Native import, travel menus, physical Walk links, WASD, Tab/F/Auto/Brace, camera
buttons, aftermath preview/confirmation, Vessa and Oren actions own all play.
Diagnostics guide keyboard inputs only. No test API/flags, stepping, direct game
commands, pose/HP/cycle/camera writes, time scaling or progress grants are used.
The take omits earlier chapters, kit, twelve accounts, acceptance and relay work.
Repeated observations are not independent tests or human/performance proof.
Import/help/preflight-only launch nothing and create no profile, server or movie.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import argparse
import hashlib
import importlib.util
import json
import math
import os
import re
import sys
import threading
import time
import traceback

sys.dont_write_bytecode = True
ROOT = Path(os.environ.get('FIRSTLIGHT_ROOT', Path(__file__).resolve().parents[1])).resolve()
CHECKPOINT = '02_RELAYS'
CHOICES = ('public-watch', 'reviewed-custody')
CAMPAIGN = 'earth-road-can-refuse-v1'
ENEMY = 'earth-regent-incursion-v1'
ROOM = 'world-earthlands'
INTERACTIONS = ('challenge-regent', 'passage-secured', 'return-verified', 'home-return')
MINIMUM = {'regent-repelled', 'passage-secured', 'aftermath'}
DIAGNOSTICS = '''()=>{const d=Realm.diagnostics;return{scene:d.scene,mode:d.mode,
renderer:d.renderer,earthHomecoming:d.earthHomecoming,adventure:d.adventure,
characters:d.characters,camera:{preset:d.camera.preset,yaw:d.camera.yaw,
projection:d.camera.projection},saveState:d.saveState,errors:d.errors};}'''
STARTUP = '''(()=>{try{window.__earthTakeStartupBytes=localStorage.getItem('eternities.realm10.characters.v1');}
catch(e){window.__earthTakeStartupError=String(e);}})()'''
RAF_START = '''()=>{if(window.__earthTakeRaf)throw new Error('RAF observation already started');
const o={active:true,limit:50000,timestamps:[],callback_arrival_timestamps:[],dropped:0};window.__earthTakeRaf=o;
function observe(t){if(!o.active)return;if(o.timestamps.length<o.limit){o.timestamps.push(t);o.callback_arrival_timestamps.push(performance.now());}else o.dropped++;
requestAnimationFrame(observe);}requestAnimationFrame(observe);return{start:performance.now(),limit:o.limit};}'''
RAF_STOP = '''()=>{const o=window.__earthTakeRaf;if(!o)return null;o.active=false;
return{timestamps:o.timestamps,callback_arrival_timestamps:o.callback_arrival_timestamps,dropped:o.dropped,limit:o.limit,end:performance.now()};}'''


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def digest(value):
    return hashlib.sha256(value.encode('utf8')).hexdigest() if value is not None else None


def read_json(path):
    result=json.loads(Path(path).read_text(encoding='utf-8-sig'))
    if not isinstance(result,dict):raise ValueError('Expected an object receipt: '+str(path))
    return result


def write_new(path,value):
    with Path(path).open('x',encoding='utf8') as handle:
        json.dump(value,handle,indent=2,ensure_ascii=False);handle.write('\n')


def load_module(path,name):
    spec=importlib.util.spec_from_file_location(name,path)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    return module


def load_guards(root):
    path=Path(root)/'tools/earth_homecoming_browser.py'
    if not path.is_file():raise ValueError('The installed complete earned-source preflight is required.')
    return load_module(path,'earth_take_actual_native_preflight')


def prepared_terms(world):
    q=world.get('earthHomecoming',{});steps=q.get('steps',[])
    ordinary=['bridge-record','register-record','inspect-claim','west-relay-isolated','east-relay-isolated']
    supplied=ordinary[:3]+['supplied-screen']+ordinary[3:]
    if (type(q.get('version')) is not int or q['version']!=1 or q.get('accepted') is not True or
        q.get('claimed') is not False or q.get('choice') is not None or steps not in (ordinary,supplied)):
        raise ValueError('Only the ordered earned relay checkpoint before challenge/aftermath/fee is permitted.')
    return q


def preflight(source,output,root,cohort_sha,caller_root=None,*,windows=None,guards=None):
    root=Path(root).resolve();guards=guards or load_guards(root)
    if not Path(source).is_absolute() or not Path(output).is_absolute():
        raise ValueError('Use explicit absolute input and output paths.')
    source,output=guards.bounded(source,windows),guards.bounded(output,windows)
    if source.name!=CHECKPOINT+'.json' or not source.is_file() or source.parent.name!='earth':
        raise ValueError('Use the actual blade/earth/02_RELAYS.json checkpoint.')
    variant=source.parent.parent.name;sources=source.parents[2]
    if variant!='blade':raise ValueError('This one-take controller records the genuine carried blade path only.')
    if any(guards.within(a,b) for a,b in ((output,root),(root,output),(output,sources),(sources,output))):
        raise ValueError('Output/profile must be separate from game and earned-input trees.')
    if output.exists():raise FileExistsError('Use a fresh D take root; prior evidence is never overwritten.')
    if not isinstance(cohort_sha,str) or not re.fullmatch('[a-f0-9]{64}',cohort_sha):
        raise ValueError('Explicit SHA256 of the complete current earned cohort is required.')
    provenance,frozen=guards.read_provenance(sources,('blade',),cohort_sha,root,caller_root)
    proof=provenance['blade']
    linked=Path(proof['checkpoints'][CHECKPOINT]).resolve()
    if linked!=source or str(source) not in frozen or sha(source)!=frozen[str(source)]:
        raise ValueError('Recording source must match the complete journey checkpoint path and bytes.')
    initial=read_json(source);prepared_terms(initial)
    for path in (Path(__file__),root/'tools/browser_support.py'):
        frozen[str(path.resolve())]=sha(path)
    return source,output,initial,proof,frozen,guards


def direction_keys(point,snapshot):
    """Eight ordinary camera-relative key chords; no axis-only wall scraping."""
    player,yaw=snapshot['adventure']['player'],snapshot['camera']['yaw']
    dx,dz=point['x']-player['x'],point['z']-player['z']
    x,z=dx*math.cos(yaw)-dz*math.sin(yaw),dx*math.sin(yaw)+dz*math.cos(yaw)
    if not all(math.isfinite(v) for v in (x,z)):raise ValueError('Finite diagnostic coordinates/yaw required.')
    if abs(x)+abs(z)<1e-10:return []
    edge=math.tan(math.pi/8);keys=[]
    if abs(x)>=abs(z)*edge:keys.append('d' if x>0 else 'a')
    if abs(z)>=abs(x)*edge:keys.append('s' if z>0 else 'w')
    return keys


def action_selector(identifier):
    if identifier not in INTERACTIONS:raise ValueError('Only real physical interactions have a step button.')
    return f'#rpg-content [data-rpg="earth-homecoming-step"][data-id="{identifier}"]'


def remaining_band(hp):
    if not math.isfinite(hp) or hp<0:raise ValueError('Actual finite nonnegative target HP required.')
    return 'claims' if hp>112 else 'false-shelter' if hp>56 else 'local-stand' if hp>0 else 'exhausted'


def wallet(world):
    return {k:world['adventure'][k] for k in ('xp','coins','ore')}


def camera_projection(view):
    if view not in ('adventure','follow','tactical','wide'):raise ValueError('Unknown native camera preset.')
    return 'perspective' if view=='adventure' else 'orthographic'


def frame_statistics(timestamps,dropped=0):
    if type(dropped) is not int or dropped<0 or any(type(t) not in (int,float) or not math.isfinite(t) for t in timestamps):
        raise ValueError('Finite timestamps and explicit nonnegative dropped count required.')
    intervals=[b-a for a,b in zip(timestamps,timestamps[1:])]
    if any(d<=0 for d in intervals):raise ValueError('RAF timestamps must strictly advance; invalid intervals cannot be hidden.')
    ordered=sorted(intervals)
    def quantile(q):
        if not ordered:return None
        f=(len(ordered)-1)*q;lo=math.floor(f);hi=math.ceil(f)
        return ordered[lo]+(ordered[hi]-ordered[lo])*(f-lo)
    return {'callbacks':len(timestamps),'intervals':len(intervals),'p50_ms':quantile(.5),'p95_ms':quantile(.95),
            'p99_ms':quantile(.99),'max_ms':max(intervals) if intervals else None,'dropped_callbacks':dropped,'truncated':dropped>0,
            'sample_span_ms':timestamps[-1]-timestamps[0] if len(timestamps)>1 else 0,
            **{label:sum(d>limit for d in intervals) for label,limit in (('over_33_33_ms',1000/30),('over_50_ms',50),('over_100_ms',100),('over_250_ms',250))},
            'percentile_method':'Linear interpolation in sorted interval samples; omitted/dropped callbacks are not reconstructed.',
            'scope':'Additional RAF callback intervals during the whole recorded play window, including native menu pauses/screenshots. Not GPU timing, 60FPS, foreground desktop, human pacing or performance qualification.'}


def callback_arrival_statistics(timestamps,arrivals,dropped=0):
    if not isinstance(arrivals,list) or len(arrivals)!=len(timestamps):
        raise ValueError('Animation and callback-arrival timestamps must have the same retained sample count.')
    frame_statistics(timestamps,dropped)  # Validate both clocks; never drop invalid paired samples.
    result=frame_statistics(arrivals,dropped)
    result['scope']='performance.now callback-arrival intervals during the same bounded play window, including menus/screenshots; event-loop delay proxy, not GPU timing, rendered FPS, foreground desktop, human pacing or performance qualification.'
    return result


def minimum_excerpt(world,warnings):
    return (MINIMUM.issubset(world['earthHomecoming']['steps']) and
            {(p,v) for p in ('claim-lane','false-shelter','closing-ring') for v in ('adventure','follow')}.issubset(set(map(tuple,warnings))))


class TakeBoundReached(RuntimeError):
    pass


class Capture:
    def __init__(self,args,report,initial):
        self.args,self.report,self.initial=args,report,initial
        self.page=self.context=self.pw=self.server=self.video=None
        self.held=set();self.started=time.monotonic();self.play_started=None;self.serial=0
        self.last_heal=-100;self.warning_pairs=set();self.playing=False

    def check(self,name,ok,detail=None):
        self.report['condition_evaluations'].append({'name':name,'ok':bool(ok),'detail':detail,'seconds':time.monotonic()-self.started})
        if not ok:raise AssertionError(name+': '+str(detail))

    def budget(self):
        if self.playing and time.monotonic()-self.play_started>=self.args.max_take_seconds:
            raise TakeBoundReached('Ordinary play reached the declared take bound; unfinished work is retained.')

    def state(self):return self.page.evaluate('()=>Realm.state')
    def diag(self):return self.page.evaluate(DIAGNOSTICS)
    def actor(self,d=None):return next((e for e in (d or self.diag())['adventure']['enemies'] if e['id']==ENEMY),None)

    def click(self,selector):
        self.budget()
        control=self.page.locator(selector);self.check('unique native control '+selector,control.count()==1,control.count())
        self.report['inputs'].append({'click':selector,'seconds':time.monotonic()-self.started});control.click()

    def press(self,key):
        self.budget()
        self.report['inputs'].append({'key':key,'seconds':time.monotonic()-self.started});self.page.keyboard.press(key)

    def hold(self,keys,ms):
        self.report['inputs'].append({'hold':list(keys),'milliseconds':ms,'seconds':time.monotonic()-self.started})
        try:
            for key in keys:self.page.keyboard.down(key);self.held.add(key)
            self.page.wait_for_timeout(ms)
        finally:
            for key in tuple(self.held):self.page.keyboard.up(key);self.held.discard(key)

    def close(self):
        if self.page.locator('#rpg-window').evaluate('(e)=>e.open'):self.click('#rpg-close')

    def workspace(self,tab='earth-homecoming'):
        self.close();self.press('j')
        if tab=='earth-homecoming':self.click('#rpg-content [data-rpg="earth-homecoming-open"]')
        else:self.click(f'#rpg-tabs [data-rpg="open"][data-id="{tab}"]')

    def mark(self,label):
        self.serial+=1;path=self.args.output/f'{self.serial:02d}_{label}.png'
        self.report['events'].append({'label':label,'seconds':time.monotonic()-self.started,'diagnostics':self.diag(),'campaign':self.state()['earthHomecoming']})
        self.page.screenshot(path=str(path));self.report['screenshots'].append({'path':str(path),'sha256':sha(path)})
        if self.report.get('raf_start') and not self.report.get('raf_observation'):
            self.report.setdefault('raf_bookmarks',[]).append({'label':label,'scene':self.report['events'][-1]['diagnostics']['scene'],'at_ms':self.page.evaluate('performance.now()')})

    def ready(self):
        self.page.wait_for_function('()=>!!window.Realm',timeout=30000)
        self.page.wait_for_function('()=>getComputedStyle(document.querySelector("#loading")).opacity==="0"',timeout=30000)
        self.check('ordinary client exposes no test API or flags',self.page.evaluate('()=>!Reflect.has(Realm,"test")&&!window.__ETERNITIES_TEST_MODE&&!window.__ETERNITIES_CAPTURE_MODE'))

    def new_context(self,record):
        support=load_module(self.args.root/'tools/browser_support.py','earth_take_browser_support')
        options={'viewport':self.report['viewport']}
        if record:options.update(record_video_dir=str(self.args.output),record_video_size=self.report['viewport'])
        self.context=self.pw.chromium.launch_persistent_context(str(self.args.output/'profile'),**support.launch_kwargs(self.args.renderer),**options)
        self.context.add_init_script(STARTUP)
        self.page=self.context.pages[0] if self.context.pages else self.context.new_page()
        for p in self.context.pages:
            if p!=self.page:p.close()
        if record:self.video=self.page.video
        self.context.route('**/*',lambda r:r.continue_() if r.request.url.startswith(self.origin+'/') else r.abort())
        self.page.on('pageerror',lambda e:self.report['errors'].append(str(e)))
        self.page.on('console',lambda m:self.report['console_errors'].append(m.text) if m.type=='error' else None)
        response=self.page.goto(self.origin+'/index.html');self.ready()
        self.check('exact frozen source HTML served',hashlib.sha256(response.body()).hexdigest()==self.report['html_sha256'])
        d=self.diag();software=bool(re.search(r'swiftshader|llvmpipe',d['renderer'] or '',re.I))
        self.check('real WebGL renderer matches request',d['mode']=='webgl2' and bool(d['renderer']) and software==(self.args.renderer=='software'),d['renderer'])
        self.report['renderer_actual']=d['renderer']
        self.report['browser_surface']={'headless':True,'document_visible':self.page.evaluate('document.visibilityState==="visible"'),'hardware_acceleration_requested':self.args.renderer=='hardware','desktop_foreground_observed':False,'driver_resource_context':'Parent may record separately at execution; not inferred by this controller.'}

    def start_raf(self):
        self.report['raf_start']=self.page.evaluate(RAF_START)

    def stop_raf(self):
        if self.report.get('raf_start') and not self.report.get('raf_observation') and self.page:
            observed=self.page.evaluate(RAF_STOP)
            self.check('bounded timestamps-only RAF observer retained samples',observed is not None and len(observed['timestamps'])>=2)
            self.report['raf_observation']=frame_statistics(observed['timestamps'],observed['dropped'])
            self.report['raf_observation'].update({'observation_start_ms':self.report['raf_start']['start'],'observation_end_ms':observed['end'],'limit':observed['limit'],'surface':'headless Chromium; visibility/readback recorded; no foreground desktop or device feel claim'})
            self.report['raf_observation']['clock']='requestAnimationFrame animation timestamp'
            self.report['callback_arrival_observation']=callback_arrival_statistics(observed['timestamps'],observed['callback_arrival_timestamps'],observed['dropped'])
            self.report['callback_arrival_observation'].update({k:self.report['raf_observation'][k] for k in ('observation_start_ms','observation_end_ms','limit','surface')})
            self.report['callback_arrival_observation']['clock']='performance.now at the same rAF callback arrival'
            path=self.args.output/'RAF_TIMESTAMPS.json';write_new(path,observed)
            self.report['raf_timestamps_file']={'path':str(path),'bytes':path.stat().st_size,'sha256':sha(path)}

    def defend(self):
        d=self.diag();a=self.state()['adventure'];self.check('actual player remains alive',a['hp']>0,a['hp'])
        e=self.actor(d)
        if e and e['mode']=='windup' and a['stamina']>=20 and a['elapsed']>=d['adventure']['tactics']['cooldowns']['guard']:
            self.press('3');self.report['native_guard_inputs']+=1
        if a['hp']<45 and a['tonics']>0 and a['elapsed']-self.last_heal>4:
            self.press('6');self.last_heal=a['elapsed']

    def still_near(self,point,label,timeout=165):
        began=time.monotonic();last=None;stable=0
        while time.monotonic()-began<timeout:
            self.budget();self.defend();p=self.diag()['adventure']['player']
            near=math.hypot(p['x']-point['x'],p['z']-point['z'])<2.75
            motion=math.hypot(p['x']-last['x'],p['z']-last['z']) if last else 1
            stable=stable+.1 if near and motion<.015 else 0
            if stable>=.4:
                self.report['walks'].append({'label':label,'point':point,'arrived':p,'seconds':time.monotonic()-began,'caller':'native journal/Map Walk with ordinary RAF'})
                return
            last=p;self.page.wait_for_timeout(100)
        self.check('native physical Walk finishes '+label,False,self.diag())

    def walk(self,identifier):
        self.workspace();point=self.definition['claim'] if identifier=='claim' else self.steps[identifier]
        selector=f'#rpg-content [data-rpg="earth-homecoming-walk"][data-id="{identifier}"]'
        control=self.page.locator(selector)
        if control.count()==1:
            self.click(selector);self.still_near(point,identifier)
        else:
            # An actual physical action is the visible positive control for an
            # already-near anchor. Never turn an absent route into a teleport.
            valid=action_selector(identifier) if identifier in INTERACTIONS else '#rpg-content [data-rpg="earth-homecoming-review"]' if identifier=='aftermath' else '#rpg-content [data-rpg="earth-homecoming-claim"]'
            self.check('already near actual physical action '+identifier,control.count()==0 and self.page.locator(valid).count()>0)
            self.close()

    def physical(self,identifier):
        self.walk(identifier);self.workspace();before=self.state()
        self.click(action_selector(identifier));after=self.state()
        self.check('actual physical work saved '+identifier,identifier in after['earthHomecoming']['steps'])
        self.check('physical work gives no independent payout',wallet(after)==wallet(before) and after['sandbox']['inventory']==before['sandbox']['inventory'])
        self.report['completed_stages'].append(identifier);self.close()

    def camera(self,view):
        self.close();self.click(f'#rpg-hud [data-rpg="camera"][data-id="{view}"]');self.press('r')
        projection=camera_projection(view)
        self.page.wait_for_function('p=>Realm.diagnostics.camera.projection===p',arg=projection,timeout=5000)
        self.check('native camera selected '+view,self.diag()['camera']['preset']==view)

    def steer(self,point,label,timeout=15,arrival_tolerance=.32):
        if type(arrival_tolerance) not in (int,float) or not math.isfinite(arrival_tolerance) or not 0<arrival_tolerance<=.32:
            raise ValueError('Arrival tolerance must be finite, positive and no looser than the ordinary .32 default.')
        self.close();began=time.monotonic();best=math.inf;progress=began
        while time.monotonic()-began<timeout:
            self.budget();self.defend();d=self.diag();p=d['adventure']['player'];distance=math.hypot(point['x']-p['x'],point['z']-p['z'])
            if distance<arrival_tolerance:
                self.report['movements'].append({'label':label,'target':point,'arrived':p,'seconds':time.monotonic()-began,'caller':'native camera-relative WASD, ordinary RAF','arrival_tolerance':arrival_tolerance})
                return
            if distance<best-.03:best=distance;progress=time.monotonic()
            self.check('ordinary keyboard steering still advances '+label,time.monotonic()-progress<5,{'distance':distance,'player':p})
            self.hold(direction_keys(point,d),max(30,min(100,distance*75)))
        self.check('ordinary keyboard destination reached '+label,False,self.diag())

    def select(self):
        for _ in range(8):
            self.press('Tab')
            if self.diag()['adventure']['tactics']['target']==ENEMY:return
        self.check('native Tab selects the real Regent',False)

    def observe_pattern(self,pattern):
        needed={(pattern,v) for v in ('adventure','follow')};self.camera('adventure')
        began=time.monotonic();trace=[]
        while time.monotonic()-began<60 and not needed.issubset(self.warning_pairs):
            self.budget();self.defend();d=self.diag();e=self.actor(d)
            self.check('live anchored Regent owns ordinary warning',e is not None and e['hp']>0 and e['earthHomecoming']==CAMPAIGN and math.hypot(e['x']-1,e['z']+35)<1e-6,e)
            frame=e.get('strike');view=d['camera']['preset'];pair=(frame.get('pattern'),view) if frame else (None,view)
            trace.append({'seconds':time.monotonic()-began,'actor':e,'player':d['adventure']['player'],'hp':self.state()['adventure']['hp']})
            if e['mode']=='windup' and e['timer']>.55 and pair in needed and pair not in self.warning_pairs:
                self.mark('locked_'+pattern+'_'+view);after=self.actor()
                if after and after['mode']=='windup' and after.get('strike')==frame:self.warning_pairs.add(pair)
                else:self.report['missed_warning_frames'].append({'pattern':pattern,'view':view,'reason':'ordinary screenshot latency crossed the actual warning'})
            opposite='follow' if view=='adventure' else 'adventure'
            if (pattern,view) in self.warning_pairs and (pattern,opposite) not in self.warning_pairs:self.camera(opposite)
            self.page.wait_for_timeout(80)
        self.report['warnings'].append({'pattern':pattern,'seen':sorted(self.warning_pairs),'trace':trace,'seconds':time.monotonic()-began})
        self.check('natural '+pattern+' warning shown in both views',needed.issubset(self.warning_pairs),sorted(self.warning_pairs))

    def weapon_effect(self):
        before=self.diag();e=self.actor(before);began=time.monotonic()
        self.check('blade effect has exact native target and quiet companion',before['adventure']['tactics']['target']==ENEMY and before['adventure']['weapon']['style']=='blade' and self.state()['adventure']['companion']['mode']=='stay')
        self.press('f')
        while time.monotonic()-began<3:
            self.budget();d=self.diag();live=self.actor(d)
            if (live and live['hp']<e['hp']) or 'regent-repelled' in self.state()['earthHomecoming']['steps']:
                self.report['weapon_effects'].append({'key':'F','source':'native owned blade attack, selected actual Regent, Briar staying and Auto off','beforeHP':e['hp'],'afterHP':live['hp'] if live else 0,'player':before['adventure']['player'],'weapon':before['adventure']['weapon'],'seconds':time.monotonic()-began})
                return
            self.page.wait_for_timeout(30)
        self.check('native F causes actual Regent HP decrease',False,{'before':e,'current':self.actor(),'weapon':d['adventure']['weapon']})

    def advance_band(self,target):
        began=time.monotonic()
        while remaining_band(self.actor()['hp'])!=target:
            self.budget();self.defend();self.check('real weapon reaches requested phase without skipping it',time.monotonic()-began<25,{'target':target,'actor':self.actor()})
            self.weapon_effect();self.page.wait_for_timeout(750)
        self.check('real attacks moved HP into '+target,remaining_band(self.actor()['hp'])==target)

    def quiet_ring_response(self):
        self.steer({'x':1,'z':-33.95},'supported quiet centre inside the ring',arrival_tolerance=.10)
        began=time.monotonic();frame=None;contact=None
        while time.monotonic()-began<18:
            self.budget();self.defend();d=self.diag();e=self.actor(d)
            self.check('Regent remains alive for actual quiet-centre response',e is not None and e['hp']>0)
            if frame is None and e['mode']=='windup' and e.get('strike',{}).get('pattern')=='closing-ring' and e['timer']>.5:
                frame=e['strike'];contact=e.get('contactAt');self.mark('actual_locked_ring_quiet_centre')
            elif frame is not None and e.get('contactAt')!=contact:
                p=d['adventure']['player'];distance=math.hypot(p['x']-frame['x'],p['z']-frame['z'])
                self.check('actual locked ring misses its real quiet centre',e.get('strike')==frame and e.get('contactHit') is False and distance<frame['innerRadius']-.24,{'actor':e,'player':p,'distance':distance})
                self.report['quiet_centre_response']={'frame':frame,'player':p,'contactAt':e['contactAt'],'contactHit':e['contactHit'],'seconds':time.monotonic()-began,'caller':'native WASD and naturally scheduled production contact; no actor/frame/HP edits'}
                return
            self.page.wait_for_timeout(60)
        self.check('natural ring contact observed at quiet centre',False,self.diag())

    def fight(self):
        self.physical('challenge-regent');before=self.state();self.camera('adventure')
        self.steer({'x':1,'z':-32.9},'supported 2.1-pace blade stand');self.select()
        self.check('no Auto while observing genuine phase changes',not self.diag()['adventure']['tactics']['auto'])
        self.observe_pattern('claim-lane')
        self.camera('adventure');self.select();self.advance_band('false-shelter');self.mark('actual_blade_impact_mid_phase')
        self.observe_pattern('false-shelter');self.camera('adventure');self.select();self.advance_band('local-stand')
        self.observe_pattern('closing-ring')
        # The ring's true quiet centre is a separate deliberate movement response.
        self.quiet_ring_response()
        self.camera('follow');self.select();self.press('1');began=time.monotonic()
        while 'regent-repelled' not in self.state()['earthHomecoming']['steps'] and time.monotonic()-began<45:
            self.budget();self.defend();self.page.wait_for_timeout(100)
        after=self.state();self.check('actual live combat saved the local repulse','regent-repelled' in after['earthHomecoming']['steps'])
        if self.diag()['adventure']['tactics']['auto']:self.press('1')
        self.check('Regent gives no generic replay or independent fee',wallet(after)==wallet(before) and after['sandbox']['inventory']==before['sandbox']['inventory'] and all(after['adventure'][k]==before['adventure'][k] for k in ('defeated','drops')))
        self.report['completed_stages'].append('regent-repelled');self.report['warning_pairs']=sorted(self.warning_pairs)
        self.mark('actual_local_repulse')

    def companion(self,mode):
        self.workspace('companion');self.click(f'#rpg-content [data-rpg="companion"][data-id="{mode}"]');self.close()
        self.check('native companion mode '+mode,self.state()['adventure']['companion']['mode']==mode)

    def choice_and_return(self):
        self.physical('passage-secured');self.walk('aftermath');self.workspace();before=self.state()
        self.click(f'#rpg-content [data-rpg="earth-homecoming-review"][data-id="{self.args.choice}"]')
        self.check('aftermath preview changes no game facts',self.state()==before)
        self.mark('aftermath_preview')
        self.click(f'#rpg-content .earth-homecoming-confirm [data-rpg="earth-homecoming-confirm"][data-id="{self.args.choice}"]')
        self.check('deliberate aftermath retained',self.state()['earthHomecoming']['choice']==self.args.choice)
        self.report['completed_stages'].append('aftermath');self.close()
        for view in ('adventure','follow'):self.camera(view);self.mark('quiet_local_'+self.args.choice+'_'+view)
        self.physical('return-verified');self.workspace();self.mark('vessa_names_the_return');self.close()
        self.check('the checked Earth account is still unpaid',not self.state()['earthHomecoming']['claimed'] and 'home-return' not in self.state()['earthHomecoming']['steps'])
        self.click('#world-home');self.page.wait_for_function('()=>Realm.diagnostics.scene==="valley"',timeout=10000)
        self.check('free return alone grants no home arrival','home-return' not in self.state()['earthHomecoming']['steps'])
        self.report['completed_stages'].append('free-return');self.mark('free_return_still_home_unpaid')
        self.physical('home-return');self.workspace();self.mark('oren_receives_account_unpaid');before=self.state()
        self.click('#rpg-content [data-rpg="earth-homecoming-claim"]');paid=self.state();fee=self.definition['reward'];expected=dict(before['sandbox']['inventory'])
        for key,n in fee['materials'].items():expected[key]+=n
        self.check('separate whole Oren fee claimed once',paid['earthHomecoming']['claimed'] and paid['adventure']['xp']-before['adventure']['xp']==min(fee['xp'],9999-before['adventure']['xp']) and all(paid['adventure'][k]-before['adventure'][k]==fee[k] for k in ('coins','ore')) and paid['sandbox']['inventory']==expected)
        self.check('claim equips/refills nothing',all(paid['adventure'][k]==before['adventure'][k] for k in ('equipment','hp','stamina','tonics')))
        self.report['completed_stages'].append('fee');self.close();self.mark('paid_home_account')

    def start_and_play(self):
        root=self.args.root
        class Handler(SimpleHTTPRequestHandler):
            def __init__(self,*a,**kw):super().__init__(*a,directory=str(root),**kw)
            def log_message(self,*a):pass
        self.server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
        threading.Thread(target=self.server.serve_forever,daemon=True).start();self.origin='http://127.0.0.1:'+str(self.server.server_port)
        self.report['origin']=self.origin
        from playwright.sync_api import sync_playwright
        self.pw=sync_playwright().start();self.new_context(record=True)
        self.report['browser']=self.page.evaluate('navigator.userAgent');self.workspace('characters')
        self.legacy=self.page.evaluate('()=>localStorage.getItem(RealmCore.KEY)')
        with self.page.expect_file_chooser() as chooser:self.click('#rpg-content [data-rpg="chars-import"]')
        chooser.value.set_files(str(self.args.source));self.page.wait_for_selector('[data-rpg="chars-confirm-import"]');self.click('[data-rpg="chars-confirm-import"]')
        self.page.wait_for_function('()=>Realm.diagnostics.characters.active==="character-2"&&Realm.diagnostics.characters.writer',timeout=30000)
        imported=self.state();self.active=self.diag()['characters']['active']
        self.original_slot=self.page.evaluate('()=>{const r=JSON.parse(localStorage.getItem(RealmCharacters.KEY));return r.slots.find(s=>s.id!==r.active);}')
        self.check('native import retains byte-earned relay and old owner facts',imported['earthHomecoming']==self.initial['earthHomecoming'] and self.args.guards.ownership(imported)==self.args.guards.ownership(self.initial) and wallet(imported)==wallet(self.initial) and imported['sandbox']['inventory']==self.initial['sandbox']['inventory'])
        self.check('isolated import preserves original legacy bytes',self.page.evaluate('()=>localStorage.getItem(RealmCore.KEY)')==self.legacy)
        self.definition=self.page.evaluate('RealmEarthHomecoming.definition');self.steps={p['id']:p for p in self.definition['steps']}
        self.original_companion=imported['adventure']['companion'];self.imported=imported
        self.original_camera=imported['settings']['cameraMode']
        self.check('actual carried kit is a blade without equipping',self.diag()['adventure']['weapon']['style']=='blade')
        self.start_raf()
        if self.original_companion['bonded'] and self.original_companion['mode']!='stay':self.companion('stay')
        self.play_started=time.monotonic();self.playing=True;self.workspace()
        self.click('#rpg-content [data-rpg="world-select"][data-id="earthlands"]')
        if self.page.locator('#rpg-content [data-rpg="world-road"]').count():
            self.click('#rpg-content [data-rpg="world-road"]');self.still_near(self.page.evaluate('RealmWorldFoundations.GATE'),'ordinary five-light marker');self.workspace();self.click('#rpg-content [data-rpg="world-select"][data-id="earthlands"]')
        self.click('#rpg-content [data-rpg="world-preview"][data-id="earthlands"]');self.click('#rpg-content [data-rpg="world-confirm"]')
        self.check('ordinary crossing enters the supported Earth road',self.diag()['scene']==ROOM)
        self.report['completed_stages'].append('earth-entry');self.mark('earned_relay_continuation')
        self.fight();self.choice_and_return();self.playing=False

    def finish_receipt(self):
        # The sole pause occurs after recorded play. This is a storage barrier,
        # never a way to stop an enemy while playing or prolong a warning frame.
        self.playing=False;self.stop_raf();self.close()
        if hasattr(self,'original_companion') and self.state()['adventure']['companion']['mode']!=self.original_companion['mode']:
            self.companion(self.original_companion['mode'])
        if not self.diag()['adventure']['paused']:self.press('p')
        self.check('native pause begins only after recorded play',self.diag()['adventure']['paused'])
        # Native camera preference saving happens AFTER pause. At home there is
        # no return command to commit the last ordinary-time frame otherwise.
        if hasattr(self,'original_camera'):self.camera(self.original_camera)
        if self.diag()['scene']==ROOM:
            self.check('unfinished take retains its real free return',self.page.locator('#world-home').is_visible());self.click('#world-home')
            self.page.wait_for_function('()=>Realm.diagnostics.scene==="valley"',timeout=10000)
        final=self.state()
        self.check('all earlier owner/gear/choice histories retained',self.args.guards.ownership(final)==self.args.guards.ownership(self.imported))
        native=self.page.evaluate('()=>localStorage.getItem(RealmCharacters.KEY)');library=json.loads(native)
        current=next(slot['world'] for slot in library['slots'] if slot['id']==library['active'])
        self.check('exact paused final native snapshot committed',current==final and self.diag()['saveState']=='saved')
        self.report['storage_observation_barrier']={'input':'Native P only after play; actual free return or preceding native camera-save commits the snapshot.','paused':True,'directSaveAPI':False}
        self.report['final_world']=final;self.report['native_library_sha256']=digest(native);self.mark('final_stored_home')
        self.context.close();self.context=self.page=None;self.raw_receipt()
        self.new_context(record=False)
        self.page.wait_for_function('id=>Realm.diagnostics.characters.active===id&&Realm.diagnostics.characters.writer',arg=self.active,timeout=30000)
        startup=self.page.evaluate('()=>window.__earthTakeStartupBytes')
        self.check('whole Chromium cold reopen retains exact native library',startup==native)
        reloaded=self.state()
        self.check('cold owner/fee/gear retained without recording another take',reloaded['earthHomecoming']==final['earthHomecoming'] and self.args.guards.ownership(reloaded)==self.args.guards.ownership(final) and wallet(reloaded)==wallet(final) and reloaded['sandbox']['inventory']==final['sandbox']['inventory'] and self.diag()['scene']=='valley')
        slot=self.page.evaluate('()=>{const r=JSON.parse(localStorage.getItem(RealmCharacters.KEY));return r.slots.find(s=>s.id!==r.active);}')
        self.check('initial other slot and legacy bytes retained',slot==self.original_slot and self.page.evaluate('()=>localStorage.getItem(RealmCore.KEY)')==self.legacy)
        self.report['cold_reload']={'recorded':False,'same_profile':True,'startup_sha256':digest(startup),'exact_library':startup==native,'world':reloaded,'scope':'Library bytes are observed before app executes. Ordinary clock/resident time can advance after reopening.'}
        self.mark('unrecorded_cold_home');self.check('no hidden console/browser/game errors',not self.report['errors'] and not self.report['console_errors'] and not self.diag()['errors'])

    def raw_receipt(self):
        if self.video:
            path=Path(self.video.path());self.report['raw_video']={'path':str(path),'bytes':path.stat().st_size,'sha256':sha(path),'speed':'original ordinary-RAF recorder output, unretimed'};self.video=None

    def stop(self):
        if self.page:
            for key in tuple(self.held):
                try:self.page.keyboard.up(key);self.held.discard(key)
                except Exception:self.report.setdefault('key_release_errors',[]).append(traceback.format_exc())
        observation_failure=None
        try:
            try:self.stop_raf()
            except Exception as error:
                observation_failure=error;self.report['raf_cleanup_failure']=traceback.format_exc()
            if self.context:self.context.close();self.context=self.page=None
            self.raw_receipt()
        finally:
            try:
                if self.pw:self.pw.stop()
            finally:
                if self.server:self.server.shutdown();self.server.server_close()
        if observation_failure:raise observation_failure


def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,default=ROOT)
    parser.add_argument('--source',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--cohort-sha',required=True,help='Exact SHA256 of the complete current earned cohort report.')
    parser.add_argument('--earned-caller-root',type=Path)
    parser.add_argument('--renderer',choices=('hardware','software'),default='hardware')
    parser.add_argument('--choice',choices=CHOICES,default='public-watch')
    parser.add_argument('--max-take-seconds',type=int,default=360,help='Ordinary-play bound 90..600; no speedup. A completed local excerpt may leave return/fee unfinished.')
    parser.add_argument('--source-head',help='Optional parent-supplied head; byte hashes remain authoritative.')
    parser.add_argument('--preflight-only',action='store_true')
    args=parser.parse_args(argv);args.root=args.root.resolve()
    try:
        if not 90<=args.max_take_seconds<=600:raise ValueError('Take bound must be between 90 and 600 seconds.')
        if args.source_head and not re.fullmatch('[a-f0-9]{40}',args.source_head):raise ValueError('Source head must be a full supplied SHA.')
        args.source,args.output,initial,proof,frozen,args.guards=preflight(args.source,args.output,args.root,args.cohort_sha,args.earned_caller_root)
        if args.preflight_only:
            print(json.dumps({'status':'preflight-only','source':str(args.source),'source_sha256':sha(args.source),'cohort_sha256':args.cohort_sha,'journey_sha256':sha(args.source.with_name('EARTH_HOMECOMING_JOURNEY_REPORT.json')),'html_sha256':sha(args.root/'index.html'),'frozen_files':len(frozen),'output_created':False,'browser_launched':False,'server_started':False,'capture_completed':False},indent=2));return 0
        args.output.mkdir(parents=True,exist_ok=False)
    except (OSError,ValueError,json.JSONDecodeError) as error:parser.error(str(error))
    report={'status':'running','method':__doc__,'source':str(args.source),'source_sha256':sha(args.source),'source_receipts':frozen,
            'parent_supplied_head':args.source_head,'html_sha256':sha(args.root/'index.html'),'cohort_sha256':args.cohort_sha,
            'journey_sha256':sha(args.source.with_name('EARTH_HOMECOMING_JOURNEY_REPORT.json')),'origin':proof['cohort_row']['origin'],
            'provenance_contract':proof['provenance_contract'],'renderer_requested':args.renderer,'choice_requested':args.choice,
            'max_take_seconds':args.max_take_seconds,'viewport':{'width':1440,'height':900},'condition_evaluations':[],'inputs':[],
            'events':[],'screenshots':[],'errors':[],'console_errors':[],'warnings':[],'warning_pairs':[],'missed_warning_frames':[],
            'weapon_effects':[],'walks':[],'movements':[],'completed_stages':[],'native_guard_inputs':0,'normal_time_footage':True,
            'simulation_steps':0,'time_scaling':0,'direct_game_commands':0,'pose_writes':0,'actor_position_writes':0,'camera_state_writes':0,
            'manual_damage':0,'inventory_grants':0,'health_grants':0,'forced_cycles':0,'planted_facts':0,'profile_limit':1,'raw_take_limit':1,
            'source_copies':0,'profile_copies':0,'human_acceptance':False,'performance_qualification':False,'fps_claim':False,
            'scope':'Resumed blade chapter after historically command-earned kit/original chapters/twelve claimed accounts and the current-source earned continuation. Acceptance, bridge/register records, inspection and both relay isolations are omitted from the take. Portable origin/migration disclosure remains in the linked reports.',
            'condition_scope':'Repeated completion/safety observations are not independent test counts.',
            'canon_limit':'Local Regent repulse and chosen home account only; First Answer, full Answering, Briar loss/reunion and wider victory remain unresolved.'}
    write_new(args.output/'RUN_INPUTS.json',report);capture=Capture(args,report,initial)
    try:
        try:capture.start_and_play();report['status']='passed'
        except TakeBoundReached as error:
            report['bound_reached']=str(error);report['warning_pairs']=sorted(capture.warning_pairs)
            if not minimum_excerpt(capture.state(),capture.warning_pairs):raise
            report['status']='bounded-excerpt'
        capture.finish_receipt()
        final=report['final_world']['earthHomecoming']
        report['chapter_completed_in_take']=bool(final['claimed'])
        report['unfinished_required_work']=[p['id'] for p in capture.definition['steps'] if not p['optional'] and p['id'] not in final['steps']]+([] if final['claimed'] else ['separate-Oren-fee'])
    except Exception:
        report['status']='failed';report['failure']=traceback.format_exc()
        if capture.page:
            try:capture.mark('FAILURE');report['failure_world']=capture.state();report['failure_diagnostics']=capture.diag()
            except Exception:report['failure_capture_error']=traceback.format_exc()
    finally:
        report['warning_pairs']=sorted(capture.warning_pairs)
        try:capture.stop()
        except Exception:report['cleanup_failure']=traceback.format_exc();report['status']='failed'
        try:
            report['final_source_receipts']={p:sha(p) if Path(p).is_file() else None for p in frozen}
            expected_src={p for p in proof['journey']['sourceEpoch']['actual'] if p.startswith('src/')}
            final_src={p.relative_to(args.root).as_posix() for p in (args.root/'src').iterdir() if p.is_file()}
            report['source_membership_frozen']=final_src==expected_src
            report['source_frozen']=report['final_source_receipts']==frozen and report['source_membership_frozen']
        except Exception:report['source_frozen']=False;report['source_read_failure']=traceback.format_exc()
        raw=list(args.output.glob('*.webm'));report['raw_file_count']=len(raw)
        report['retained_raw_files']=[{'path':str(p),'sha256':sha(p),'bytes':p.stat().st_size} for p in raw]
        if not report['source_frozen'] or len(raw)!=1 or 'raw_video' not in report:report['status']='failed'
        report['wall_seconds']=time.monotonic()-capture.started;write_new(args.output/'REPORT.json',report)
        print(json.dumps({k:report.get(k) for k in ('status','chapter_completed_in_take','unfinished_required_work','wall_seconds','raw_video','source_frozen','failure')},indent=2))
    return 0 if report['status'] in ('passed','bounded-excerpt') else 1


if __name__=='__main__':raise SystemExit(main())
