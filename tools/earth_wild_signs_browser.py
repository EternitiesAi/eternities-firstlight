#!/usr/bin/env python3
"""Prepared ordinary-RAF WildSigns acceptance. Importing never starts a browser.

Only an installed, current-head, command-earned claimed-load/fresh-signs cohort
is admitted. Native import, walking, original DOM clicks and weapon controls own
progress. Render probes remove and restore actual batch members while paused;
they never acknowledge behavior or issue intent. Execution remains pending.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import argparse
import copy
import hashlib
import importlib.util
import json
import math
import os
import subprocess
import sys
import threading
import time
import traceback

ID = 'earth-beast-wrong-name-v1'
LOAD = 'earth-first-load-through-v1'
PEST = 'earth-wild-signs-burrow-skitter-v1'
ACTOR = 'elderweald-moss-grazer-v1'
PRODUCER = 'tools/earth-wild-signs-journey/produce_wild_signs_prerequisites.cjs'
HELPER = 'tools/earth-wild-signs-journey/earned_wild_signs.cjs'
FRESH = dict(version=1, accepted=False, evidence=[], observed=False,
             resolution=None, cleared=False, claimed=False)
MODULES = ('earth-wild-signs-data.js', 'earth-wild-signs.js', 'earth-grazer-motion.js',
           'earth-grazer-art.js', 'earth-grazer-visibility.js', 'earth-wild-signs-art.js',
           'earth-wild-signs-ui.js', 'earth-wild-signs.css')
CASES = (('blade', 'signed-loop', False), ('bow', 'cleared-pocket', True),
         ('veteran', 'signed-loop', True))
CONFIGS = ((1440, 960, 'adventure', 80, False),
           (1440, 960, 'follow', 45, False),
           (390, 844, 'adventure', 45, True),
           (390, 844, 'follow', 80, True))


def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def read(p): return json.loads(Path(p).read_text(encoding='utf-8'))
def need(ok, text):
    if not ok: raise ValueError(text)
def dump(p, value):
    with Path(p).open('x', encoding='utf-8', newline='\n') as f:
        json.dump(value, f, ensure_ascii=False, indent=2); f.write('\n')


def load_base(root):
    p = Path(root) / 'tools/earth_consignment_browser.py'
    s = importlib.util.spec_from_file_location('wild_signs_native_base', p)
    m = importlib.util.module_from_spec(s); s.loader.exec_module(m)
    return m


def strict_link(directory, link):
    need(type(link) is dict and set(link) == {'path', 'sha256'}, 'Exact source/receipt link required')
    raw = link['path']; need(type(raw) is str and raw and '\\' not in raw, 'Canonical relative cohort leaf required')
    p = Path(raw)
    need(not p.is_absolute() and not p.drive and all(v not in ('', '.', '..') for v in raw.split('/')),
         'Cohort link must stay inside its explicit directory')
    file = (directory / p).resolve()
    need(directory in file.parents and file.is_file() and sha(file) == link['sha256'], 'Sealed cohort leaf changed')
    return file


# Read-only actual installed validators. No Simulation, ticks, saves or issuers.
VALIDATE_JS = r"""
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.argv[1],world=JSON.parse(fs.readFileSync(process.argv[2]));
const D=require(path.join(root,'src/earth-wild-signs-data.js'));
require(path.join(root,'src/core.js'));
const C=globalThis.RealmCore,CD=globalThis.RealmEarthConsignmentData;
const sorted=v=>JSON.stringify(v,(_,o)=>o&&typeof o==='object'&&!Array.isArray(o)?Object.fromEntries(Object.keys(o).sort().map(k=>[k,o[k]])):o);
assert.equal(sorted(C.validate(world)),sorted(world),'Admission must not silently migrate or alter the sealed source');
const r=CD.crossValidate(world.localLife.records[CD.ID],world.earthExpedition);
assert.ok(r.accepted&&r.claimed);assert.deepEqual(r.steps,CD.required(r));
assert.deepEqual(D.crossValidate(world.earthWildSigns,world),D.fresh());
assert.equal(D.ID,'earth-beast-wrong-name-v1');assert.equal(D.enemy.id,'earth-wild-signs-burrow-skitter-v1');
assert.deepEqual(D.definition.reward,{xp:0,coins:4,ore:0,materials:{fiber:3}});
console.log(JSON.stringify({ok:true,choice:r.choice,arrivalIds:CD.required(r)}));
"""


def validate_source(root, source):
    raw = subprocess.check_output(['node', '-e', VALIDATE_JS, str(root), str(source)],
                                  text=True, timeout=30)
    result = json.loads(raw); need(result.get('ok') is True, 'Actual Core/data admission refused')
    return result


def clean_source_tree(root):
    paths=['src', 'index.html', 'FIRSTLIGHT_VALLEY.html', PRODUCER, HELPER,
           'tools/earth_consignment_browser.py', 'tools/browser_support.py',
           'tools/earth_wild_signs_browser.py']
    git=['git','-c','core.longpaths=true','-C',str(root)]
    leaves=['src/'+p for p in MODULES]+[PRODUCER,HELPER,
            'tools/earth_wild_signs_browser.py']
    subprocess.check_output(git+['ls-files','--error-unmatch','--']+leaves,stderr=subprocess.STDOUT,text=True)
    need(not subprocess.check_output(git+['status','--porcelain','--untracked-files=all','--']+paths,text=True).strip(),
         'Only committed unchanged current source/caller leaves can qualify this native cohort')


def source_relationship(base, before, after, variant, receipt, canonical):
    """Independent original-vs-earned owner/economy checks, never manifest labels."""
    need(base.preserved(after) == base.preserved(before), 'Original protected histories/gear/companion changed')
    need(after.get('earthWildSigns') == FRESH, 'WildSigns must start genuinely fresh')
    branch = before['earthExpedition']['story']['branch']
    need(branch in ('stormfall-recovery', 'managed-coppice'), 'Actual immutable EE branch required')
    choice = ('north' if variant == 'veteran' else 'south') + ('-coppice' if branch == 'managed-coppice' else '-stormfall')
    r = after['localLife']['records'][LOAD]
    need(canonical['choice'] == choice and r == dict(accepted=True, choice=choice,
         steps=canonical['arrivalIds'], claimed=True), 'Exact crossvalidated paid fifth route required')
    need(receipt['load']['choice'] == choice and receipt['load']['arrivalIds'] == r['steps'], 'Actual arrival receipt differs')
    a, b = before['sandbox']['inventory'], after['sandbox']['inventory']
    need(type(before['adventure']['coins']) is int and type(after['adventure']['coins']) is int
         and after['adventure']['coins'] == before['adventure']['coins'] + 4, 'Exactly the existing carrier coin payment')
    need(type(a) is dict and type(b) is dict and set(a) == set(b)
         and all(type(v) is int and type(b[k]) is int and b[k] == v + (2 if k in ('wood', 'fiber') else 0)
                 for k, v in a.items()), 'Exactly existing carrier wood/fiber payment, no other inventory edits')


def preflight(root, cohort, original_cohort, base=None, validator=validate_source):
    root, cohort, original_cohort = map(lambda p: Path(p).resolve(), (root, cohort, original_cohort))
    need(cohort.is_file() and original_cohort.is_file(), 'Explicit current claimed-load and original EE cohorts required; no fallback')
    base = base or load_base(root)
    original = base.current_preflight(original_cohort, root)
    epoch = base.current_epoch(root); m = read(cohort)
    need(m.get('schema') == 'wild-signs-native-cohort-v1' and set(m.get('variants', {})) == {'blade','bow','veteran'}, 'Exact new three-case cohort required')
    expected = {k: epoch[k] for k in ('mode','head','htmlSha256','runtimeSources')}
    need(m.get('epoch') == {**expected, 'producer': {'path': PRODUCER, 'sha256': sha(root / PRODUCER)}},
         'Actual current HEAD/runtime/HTML/installed producer epoch required')
    need(sha(root / 'FIRSTLIGHT_VALLEY.html') == epoch['htmlSha256'], 'Both built pages must agree')
    for leaf in MODULES:
        need('src/'+leaf in epoch['runtimeSources'], 'Future runtime owner/render/UI module missing: '+leaf)
        if leaf.endswith('.js'):
            need((root/'src'/leaf).read_text(encoding='utf-8-sig') in (root/'index.html').read_text(encoding='utf-8-sig'), 'Actual module is not embedded: '+leaf)
    need(m.get('originalCohortSha256') == sha(original_cohort), 'Original cohort was replaced')
    binding = m.get('binding', {})
    need(binding.get('mode') == 'installed-current-modules' and binding.get('sourceHead') == epoch['head']
         and binding.get('sourceHeadAfter') == epoch['head'] and binding.get('inputsUnchanged') is True, 'Producer inputs drifted')
    rows, used = {}, set()
    for variant, row in m['variants'].items():
        need(type(row) is dict and set(row) == {'source','journey'}, 'Exact two prerequisite leaves required')
        files = {k: strict_link(cohort.parent, row[k]) for k in ('source','journey')}
        need(not used.intersection(files.values()), 'Duplicate cohort leaf/owner refused'); used.update(files.values())
        world, receipt = read(files['source']), read(files['journey'])
        need(receipt.get('schema') == 'wild-signs-native-prerequisites-v1' and receipt.get('status') == 'passed'
             and receipt.get('variant') == variant and receipt.get('sourceHead') == epoch['head'], 'Actual current producer receipt required')
        for key, value in (('producerSha256', sha(root/PRODUCER)), ('helperSha256', sha(root/HELPER)),
                           ('sourceHashes', epoch['runtimeSources']), ('originalCohortSha256', sha(original_cohort)),
                           ('originalSourceSha256', sha(original[variant]['source'])),
                           ('originalJourneySha256', sha(original[variant]['journey']))):
            need(receipt.get(key) == value, 'Prerequisite binding differs: '+key)
        for key in ('coldSavedEquality','canonicalPreservation','priorReceiptsPreserved'):
            need(receipt.get(key) is True, 'Actual prior receipts/cold equality required')
        need(receipt.get('browserPersistence') is False and receipt.get('humanPacing') is False, 'CPU prerequisites are not native or human evidence')
        injections = receipt.get('injections', {})
        need(set(injections) == {'positionEdits','inventoryGrants','hpEdits','manualDamage','plantedDefeats'}
             and all(type(v) is int and v == 0 for v in injections.values()), 'No planted prerequisites allowed')
        metrics, load = receipt.get('metrics', {}), receipt.get('load', {})
        need(all(type(metrics.get(k)) is int and metrics[k] == 0 for k in ('positionEdits','inventoryGrants','hpEdits','plantedDefeats')),
             'Actual producer metrics must agree with its no-injection statement')
        need(all(type(metrics.get(k)) is int and metrics[k] == 0 for k in ('observationFrames','clearanceCalls','combatCommands')),
             'Producer must not issue investigation witnesses or combat')
        need(metrics.get('coldLoads') == 1 and len(metrics.get('claims', [])) == 1
             and metrics['claims'][0]['owner'] == LOAD and load.get('claimed') is True,
             'Only one actual carrier claim/cold checkpoint allowed')
        need(type(load.get('motionFrames')) is int and load['motionFrames'] > 0
             and type(load.get('physicalDistance')) in (float,int) and math.isfinite(load['physicalDistance'])
             and load['physicalDistance'] > 0 and load['motionFrames'] == metrics.get('workerFrames')
             and load['physicalDistance'] == metrics.get('workerDistance') and load.get('arrivalIds') == metrics.get('arrivalIds'), 'Actual physical carrier leg receipt required')
        source_relationship(base, original[variant]['world'], world, variant, receipt, validator(root, files['source']))
        rows[variant] = {**files, 'world': world, 'receipt': receipt}
    # Rehash these exact admitted bytes after execution; no receipt rewriting.
    leaves = [cohort, original_cohort, root/PRODUCER, root/HELPER,
              root/'tools/earth_consignment_browser.py', root/'tools/browser_support.py',
              root/'index.html', root/'FIRSTLIGHT_VALLEY.html']
    leaves += [root/k for k in epoch['runtimeSources']]
    leaves += [v[k] for group in (rows, original) for v in group.values() for k in ('source','journey')]
    return rows, {str(p):sha(p) for p in leaves}, epoch


def pixels_valid(p):
    return (p.get('restored') is True and p.get('stateUnchanged') is True and p.get('glError') == 0
            and p.get('pixels',0) >= 30 and p.get('headPixels',0) >= 6
            and p.get('parts',0) >= 4 and p.get('clipped') == 0
            and p.get('span',{}).get('width',0) >= 40 and p.get('span',{}).get('height',0) >= 20)


PIXEL_SNAPSHOT_JS = r"""()=>{
 const d=Realm.diagnostics;
 return JSON.parse(JSON.stringify({world:Realm.state,sample:{elapsed:Realm.state.adventure.elapsed,
  paused:d.adventure.paused,scene:d.scene,signs:Realm.state.earthWildSigns,
  view:d.wildSigns?.view||null,visibility:d.wildSigns?.visibility||null,player:d.adventure.player}}));
}"""


def changed_fields(before, after, path=''):
    if before == after: return []
    if type(before) is dict and type(after) is dict:
        return [field for key in sorted(set(before) | set(after))
                for field in (changed_fields(before[key], after[key], path+'.'+key if path else key)
                              if key in before and key in after else [path+'.'+key if path else key])]
    return [path]


# Deliberately manual rendering while native P-paused. No app frame ACK is called.
# The same actual submitted matrices feed projection and full/on-off/restored pixels.
# Exact snapshots bracket this synchronous operation, including the final render.
PIXELS_JS = r"""actor=>{
 const art=window.__flArt,e=art?.e,g=e?.gl;if(!g||!Realm.diagnostics.adventure.paused)throw Error('Actual paused renderer required');
 const before=JSON.stringify(Realm.state),snapshot=PIXEL_SNAPSHOT,probeBefore=snapshot(),t=Realm.state.adventure.elapsed,h=Realm.state.hour,rain=Realm.state.weather==='rain';
 const snap=e.dynamic.map(b=>({b,items:b.items,data:b.data,count:b.count}));
 const all=snap.flatMap(q=>q.items.map((item,i)=>({kind:q.b.kind,item,packed:q.data.subarray(i*24,(i+1)*24)}))).filter(q=>q.item.grazerActor===actor);
 const head=new Set(['slender-head','feeding-muzzle','soft-nose','left-eye','right-eye']);
 const project=all.flatMap(q=>{const raw=RealmEngine.geometry(q.kind),stride=q.kind==='timber-panel'?8:6,m=Array.from(q.packed.slice(0,16)),out=[];
   for(let i=0;i<raw.length;i+=stride){const p=RealmEngine.M.transform(m,Array.from(raw.slice(i,i+3)));out.push(e.project(...p));}return out;});
 const w=e.canvas.clientWidth,hc=e.canvas.clientHeight,bar=document.querySelector('#skillbar').getBoundingClientRect().top,clipped=project.filter(p=>!p.visible||p.x<1||p.x>w-1||p.y<1||p.y>Math.min(hc-1,bar-8)).length;
 const span={width:Math.max(...project.map(p=>p.x))-Math.min(...project.map(p=>p.x)),height:Math.max(...project.map(p=>p.y))-Math.min(...project.map(p=>p.y))};
 const read=()=>{e.render(t,h,rain);const b=new Uint8Array(e.mainF.w*e.mainF.h*4);g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);g.readPixels(0,0,e.mainF.w,e.mainF.h,g.RGBA,g.UNSIGNED_BYTE,b);g.bindFramebuffer(g.FRAMEBUFFER,null);return b;};
 const restore=()=>{for(const q of snap){q.b.items=q.items;q.b.data=q.data;e.updateBatch(q.b);q.b.count=q.count;}};
 const hide=predicate=>{for(const q of snap){q.b.items=q.items.filter(v=>!predicate(v));e.updateBatch(q.b);}};
 const diff=(a,b)=>{let n=0;for(let i=0;i<a.length;i+=4)if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>12)n++;return n;};
 let result;
 try{const on=read();hide(v=>v.grazerActor===actor);const off=read();restore();hide(v=>v.grazerActor===actor&&head.has(v.grazerPart));const noHead=read();restore();const back=read();result={parts:all.length,span,clipped,pixels:diff(on,off),headPixels:diff(on,noHead),restored:diff(on,back)===0&&snap.every(q=>q.b.items===q.items&&q.b.data===q.data&&q.b.count===q.count),stateUnchanged:before===JSON.stringify(Realm.state),glError:g.getError()};}
 finally{restore();e.render(t,h,rain);}
 const probeAfter=snapshot();
 return {...result,stateUnchanged:result.stateUnchanged&&before===JSON.stringify(Realm.state),probeBefore,probeAfter};
}""".replace('PIXEL_SNAPSHOT', PIXEL_SNAPSHOT_JS)


def driver_class(base):
    class WildSigns(base.Native):
        def start(self):
            super().start()
            self.check('actual current WildSigns runtime and sanitized diagnostic installed',self.ev("()=>{const D=RealmEarthWildSignsData,w=Realm.diagnostics.wildSigns;return D.ID==='earth-beast-wrong-name-v1'&&D.enemy.id==='earth-wild-signs-burrow-skitter-v1'&&JSON.stringify(D.definition.reward)===JSON.stringify({xp:0,coins:4,ore:0,materials:{fiber:3}})&&w&&Object.keys(w).sort().join(',')==='prepared,record,renderer,view,visibility'&&(!w.view||!['ownerLease','submission','inputStamp','presentedFrame','ticket'].some(k=>Object.hasOwn(w.view,k)));}"))
        def signs(self): return self.state()['earthWildSigns']
        def signs_view(self): return self.diag()['wildSigns']
        def panel(self):
            self.workspace('journal'); self.click('[data-rpg="wild-signs-open"][data-quest="'+ID+'"]')
            self.page.wait_for_selector('[data-wild-signs-panel]')
        def action(self, kind, id=None, live=False):
            if not live: self.panel()
            self.click('[data-rpg="wild-signs-'+kind+'"][data-quest="'+ID+'"]'+('' if id is None else '[data-id="'+id+'"]'))
        def walk_sign(self, id):
            target = self.ev("id=>{const D=RealmEarthWildSignsData,U=RealmEarthWildSignsUI;return [D.giver,...D.evidence,D.overlook,U.CONTACT].find(p=>p.id===id);}", id)
            self.check('canonical native walk target', bool(target), id)
            self.action('walk', id); self.settle(target)
        def stable_facts(self, w):
            facts = base.preserved(w); facts['adventure'].pop('receipts', None)
            facts['fifth'] = w['localLife']['records'][LOAD]
            return facts
        def guard(self):
            w = self.state()
            self.check('all old owners/XP/gear/sockets/companion and paid fifth remain', self.stable_facts(w) == self.original_facts)
            old = self.origin_world['adventure']['receipts']; current = w['adventure']['receipts']
            # Real weapon commands retain the existing bounded receipt cap.
            overlap = next((n for n in range(min(len(old),len(current)), -1, -1) if old[-n:] == current[:n]), 0)
            if old == current: overlap = len(old)
            self.check('old receipt order retained within existing cap', overlap > 0 and current[:overlap] == old[-overlap:])
            self.check('ordinary production has no test issuer', self.ev('()=>typeof Realm.test==="undefined"'))
            self.check('traveller remains alive', w['adventure']['hp'] > 0)
            return w
        def restart(self, label):
            # Base restart owns actual closed Storage byte equality and old history.
            signs, fifth = copy.deepcopy(self.signs()), copy.deepcopy(self.state()['localLife']['records'][LOAD])
            self.check('new owner really durable before restart', self.stored()['earthWildSigns'] == signs)
            super().restart(label)
            self.check('new owner and fifth survive actual native close/reload', self.signs() == signs and self.state()['localLife']['records'][LOAD] == fifth)
            self.guard()
        def configure(self, config):
            w,h,mode,fov,reduced = config
            self.close(); self.page.set_viewport_size({'width':w,'height':h})
            self.click('#settings'); self.page.locator('#camera-mode').select_option('adventure')
            control=self.page.locator('#camera-fov');control.focus()
            self.page.keyboard.press('Home')
            if fov == 80: self.page.keyboard.press('End')
            self.page.keyboard.press('Tab')  # native blur/change persists the range
            self.page.locator('#setting-reducedMotion').set_checked(reduced)
            self.page.locator('#camera-mode').select_option(mode);self.click('#close-panel')
            d=self.diag();s=self.state()['settings']
            self.check('native selected exact camera/FOV/reducedMotion', d['camera']['preset']==mode and s['cameraFov']==fov and s['reducedMotion'] is reduced, config)
            self.action('look'); self.check('intentional Look closes account', not self.page.locator('#rpg-window').evaluate('(e)=>e.open'))
            self.hold_native_keys_for_frames(())  # Two actual ordinary frames finish aspect/camera updates.
            self.row.setdefault('configurations', []).append(list(config))
        def clear_toast(self):
            self.page.wait_for_function('()=>!document.querySelector("#toast").classList.contains("show")',timeout=15000)
        def sample(self):
            return self.ev("()=>{const d=Realm.diagnostics;return {elapsed:Realm.state.adventure.elapsed,paused:d.adventure.paused,scene:d.scene,signs:Realm.state.earthWildSigns,view:d.wildSigns?.view||null,visibility:d.wildSigns?.visibility||null,player:d.adventure.player};}")
        def pause_and_photo_negative(self):
            self.panel(); before=self.sample(); self.check('menu actually pauses', before['paused'] is True)
            self.page.wait_for_timeout(1200);after=self.sample()
            self.check('menu cannot advance or record a browse', before==after, {'before':before,'after':after})
            self.close();self.page.keyboard.press('p');self.check('native P pauses world', self.diag()['adventure']['paused'] is True)
            before=self.sample();self.page.keyboard.press('h');self.page.wait_for_timeout(500)
            self.check('photo mode does not issue observed progress', self.signs()['observed'] is False and self.sample()['elapsed']==before['elapsed'])
            self.page.keyboard.press('h');self.click('#settings')
            with self.page.expect_download(timeout=30000) as download:self.click('[data-action="capture"]')
            file=self.folder/'PAUSED_APP_PHOTO.png';download.value.save_as(str(file))
            self.check('actual app photo render cannot record behavior or advance world',file.stat().st_size>0 and self.signs()['observed'] is False and self.sample()['elapsed']==before['elapsed'])
            self.click('#close-panel');self.page.keyboard.press('p')
        def watch(self, label):
            started=time.monotonic();phases=set();low=False; recovered=False; moved=False;startpos=None; visible_frames=0
            while time.monotonic()-started < 240:
                s=self.sample();v=s['view'];vis=s['visibility'];self.row['samples'].append(s)
                self.check('watch is live Earth, alive and unpaused', not s['paused'] and s['scene']=='world-earthlands' and self.state()['adventure']['hp']>0)
                self.check('watching alone never saves observed fact', s['signs']['observed'] is False)
                if v and vis and vis.get('visible') is True and vis.get('phase')==v['phase'] and abs(vis.get('lower',-1)-v['lower'])<1e-7:
                    visible_frames+=1;phases.add(v['phase'])
                    if v['lower']>=.8:
                        low=True;startpos={'x':v['x'],'z':v['z']}
                    if low and v['lower']<=.1:recovered=True
                    if recovered and v['walking']:
                        moved=moved or bool(startpos and base.distance(v,startpos)>=.05)
                    if v.get('observationReady') is True:
                        self.check('actual visible lower/recover/resumed physical walk before original Observe', low and recovered and moved and visible_frames>=3, {'phases':sorted(phases),'frames':visible_frames})
                        self.row.setdefault('watches',[]).append({'label':label,'seconds':time.monotonic()-started,'phases':sorted(phases),'visibleSamples':visible_frames,'postRecoverDistanceAtLeast':.05})
                        self.clear_toast();self.capture(label+'_READY');return
                self.page.wait_for_timeout(80)
            raise TimeoutError('Full native visible browse was not witnessed within 240 seconds: '+label)
        def pixel_config(self, config, label):
            self.configure(config)
            # No cached diagnostic can certify a changed camera. Only the actual
            # new packed silhouette and head pixels below certify this view.
            self.clear_toast()
            self.page.keyboard.press('p');before=self.ev(PIXEL_SNAPSHOT_JS);self.check('pixel probe uses native pause', before['sample']['paused'] is True)
            data=self.ev(PIXELS_JS,ACTOR);after=self.ev(PIXEL_SNAPSHOT_JS)
            # Ordinary RAF can refresh prepared paused/walking projection between
            # evaluate calls. Retain that exact delta separately from manual proof.
            data['ordinaryRafBoundary']={'before':before,'after':after,'changedFields':changed_fields(before,after),
                                        'scope':'Separate evaluate calls may include ordinary paused App RAF; not manual-render attribution.'}
            self.row.setdefault('pixelControls',[]).append({'configuration':list(config),**data,'scope':'Actual GPU packed WorldArt probes; manual paused render is not ordinary-frame proof.'})
            self.check('actual mesh silhouette and full/head on-off-restored pixels',pixels_valid(data),data)
            self.check('manual renderer never issues witness or mutates state',data['probeAfter']==data['probeBefore'],
                       {'before':data['probeBefore'],'after':data['probeAfter'],'changedFields':changed_fields(data['probeBefore'],data['probeAfter'])})
            witnesses=lambda v:tuple((v.get('sample',{}).get('view') or {}).get(k) for k in ('observedBehavior','observationReady'))
            self.check('native paused interval preserves complete world and existing witness',
                       before['world']==after['world'] and before['sample']['paused'] is True and after['sample']['paused'] is True
                       and witnesses(before)==witnesses(after),data['ordinaryRafBoundary'])
            self.page.screenshot(path=str(self.folder/(label+'.png')))
            self.page.keyboard.press('p')
            self.panel();self.check('native account fits and scrolls at requested width', self.ev('()=>{const d=document.querySelector("#rpg-window"),p=d.getBoundingClientRect();return document.documentElement.scrollWidth<=innerWidth&&p.left>=0&&p.right<=innerWidth&&d.open;}'))
            el=self.page.locator('[data-rpg="wild-signs-look"]');el.focus();self.check('Look keyboard focus retained',el.evaluate('(e)=>document.activeElement===e'))
            self.close()
        def native_observe(self, quota=False):
            self.panel();self.check('genuine ready menu proof retained',self.signs_view()['view']['observationReady'] is True)
            if quota:
                before=self.state();raw=self.ev('()=>localStorage.getItem(RealmCharacters.KEY)');self.refuse(True)
                self.action('observe',live=True)
                self.check('quota refusal attempted actual store and preserves exact paused world/native bytes',self.ev('()=>window.__flRefused')>0 and self.state()==before and self.ev('()=>localStorage.getItem(RealmCharacters.KEY)')==raw)
                self.check('refused observation proof stays ready',self.signs_view()['view']['observationReady'] is True and not self.signs()['observed'])
                self.refuse(False)
            self.action('observe',live=True)
            self.check('original trusted native Observe records only observed fact',self.signs()['observed'] is True and self.signs()['resolution'] is None)
            self.guard()
        def stale_outing(self):
            saved=copy.deepcopy(self.signs());self.home();self.panel()
            self.check('outgoing witness cannot offer native Observe at home',self.page.locator('[data-rpg="wild-signs-observe"]:not([disabled])').count()==0)
            self.check('outgoing actual owner remains unchanged',self.signs()==saved)
            self.enter();self.walk_sign('grazer-overlook');self.action('look')
            self.check('new outing does not backfill old ready witness',not (self.signs_view().get('view') or {}).get('observationReady',False))
        def signed_bypass(self):
            self.workspace('journal');self.click('[data-rpg="wild-signs-track"][data-quest="'+ID+'"]')
            self.workspace('atlas')
            self.check('manually pinned signed map has exact six-point line',self.page.locator('[data-wild-signs-route="selected"]').count()==1 and self.page.locator('[data-wild-signs-route="selected"]').get_attribute('points').strip().count(' ')==5)
            self.close();points=self.ev('()=>RealmEarthWildSignsData.bypass');saved=copy.deepcopy(self.signs())
            # Walk the already measured line in reverse from the comparison end.
            # Every displacement comes from held native keys and real Core RAF.
            for point in reversed(points):
                started=time.monotonic();initial=self.diag()['adventure']['player'];last=initial
                while time.monotonic()-started<120:
                    d=self.diag();player=d['adventure']['player']
                    self.check('signed bypass stays alive and unpaused',not d['adventure']['paused'] and self.state()['adventure']['hp']>0)
                    if base.distance(player,point)<=1.1:break
                    keys=base.native_keys(player,point,d['camera']['yaw'])
                    self.hold_native_keys_for_frames(keys)
                    after=self.diag()['adventure']['player']
                    self.check('actual complete Core bypass walking segment supported',self.ev('p=>RealmWorldFoundations.segment("world-earthlands",p[0],p[1],.31)',[last,after]))
                    last=after
                else:raise TimeoutError('Native signed bypass walking stalled: '+repr(point))
                self.row['walks'].append({'kind':'native-keys-signed-bypass','target':point,'from':initial,'player':player,'seconds':time.monotonic()-started})
            self.check('physical bypass issues no additional resolution/payment',self.signs()==saved);self.guard()
        def pest(self):
            self.walk_sign('wild-signs-pest-contact');self.close()
            self.check('actual equipped weapon is bow',self.diag()['adventure']['weapon']['style']=='bow')
            for _ in range(12):
                self.page.keyboard.press('Tab')
                if self.diag()['adventure']['tactics'].get('target')==PEST:break
            self.check('canonical real enemy selected by native Tab',self.diag()['adventure']['tactics'].get('target')==PEST)
            before=self.state();coins=before['adventure']['coins'];inventory=copy.deepcopy(before['sandbox']['inventory']);arrows=set();self.refuse(True);started=time.monotonic();shots=0
            while time.monotonic()-started < 120:
                d=self.diag();enemy=next((e for e in d['adventure']['enemies'] if e['id']==PEST),None)
                self.check('real new enemy remains in current roster',enemy is not None)
                if enemy['hp']<=0:break
                self.page.keyboard.press('f');shots+=1
                for _ in range(6):
                    for a in self.diag()['adventure']['arrows']:arrows.add(a['id'])
                    self.page.wait_for_timeout(80)
            else:raise TimeoutError('Native projectile pest encounter did not complete')
            self.panel();paused=self.state();raw=self.ev('()=>localStorage.getItem(RealmCharacters.KEY)')
            self.check('real projectile and death reached honest refused clearance',bool(arrows) and shots>0 and not self.signs()['cleared'] and self.ev('()=>window.__flRefused')>0)
            self.check('new pest has no generic kill payout/history',paused['adventure']['coins']==coins and paused['sandbox']['inventory']==inventory and PEST not in paused['adventure']['defeated'] and PEST not in paused['adventure']['drops'] and paused['adventure']['xp']==before['adventure']['xp'] and paused['adventure']['ore']==before['adventure']['ore'])
            self.action('retry-clearance',live=True)
            self.check('explicit quota retry preserves exact paused refusal state',self.state()==paused and self.ev('()=>localStorage.getItem(RealmCharacters.KEY)')==raw and not self.signs()['cleared'])
            self.refuse(False);self.action('retry-clearance',live=True)
            self.check('fresh original native retry saves actual dead enemy clearance',self.signs()['cleared'] is True)
            self.row['combat']={'nativeShotsRequested':shots,'actualProjectileIds':sorted(arrows),'quotaRefused':True,'explicitRetry':True}
            self.guard()
        def quality_refresh(self):
            original=self.state()['settings']['quality'];signs=self.signs()
            self.click('#settings')
            try:
                for quality,count in (('balanced',128),('low',64),('high',128),(original,64 if original=='low' else 128)):
                    self.page.locator('#quality').select_option(quality)
                    actual=self.ev('()=>window.__flArt.e.batches.flatMap(b=>b.items).filter(p=>p.habitatPart).length')
                    self.check('native Graphics immediately refreshes '+quality+' habitat',actual==count,{'expected':count,'actual':actual})
                self.check('Graphics leaves accepted field-account facts unchanged',self.signs()==signs)
            finally:self.close()
        def run_signs(self, source, resolution, reverse, variant):
            self.start();self.import_world(source['source']);self.origin_world=source['world']
            self.original_facts=self.stable_facts(self.origin_world)
            self.check('immediate import matches sealed economy and all owners',base.import_preserved(self.origin_world,self.state()) and self.signs()==FRESH and self.state()['localLife']['records'][LOAD]==self.origin_world['localLife']['records'][LOAD])
            self.enter();self.quality_refresh();self.walk_sign('elderweald-sela');self.action('accept');self.check('native invitation accepted',self.signs()['accepted'] is True)
            self.workspace('journal');self.click('[data-rpg="wild-signs-track"][data-quest="'+ID+'"]')
            if variant=='blade':self.restart('ACCEPTED');self.enter()
            order=['feeding-track','timber-gouge'] if reverse else ['timber-gouge','feeding-track']
            self.walk_sign(order[0]);self.action('read',order[0]);self.check('first nearby read exact',self.signs()['evidence']==order[:1])
            if variant=='bow':self.restart('PARTIAL');self.enter()
            self.walk_sign(order[1]);self.action('read',order[1]);self.walk_sign('grazer-overlook')
            self.configure(CONFIGS[0]);self.pause_and_photo_negative();self.action('look');self.watch('FIRST_BROWSE')
            if variant=='blade':
                for i,c in enumerate(CONFIGS):self.pixel_config(c,'PIXELS_'+str(i))
                self.stale_outing();self.configure(CONFIGS[0]);self.watch('FRESH_OUTING_BROWSE')
            self.native_observe(quota=variant=='veteran')
            if variant=='veteran':self.restart('OBSERVED');self.enter()
            self.walk_sign('pest-scrape');self.action('read','pest-scrape');self.action('choose',resolution)
            self.check('explicit canonical resolution frozen',self.signs()['resolution']==resolution)
            if resolution=='cleared-pocket':self.pest()
            else:
                self.check('signed loop creates no combat target/reward',not any(e['id']==PEST for e in self.diag()['adventure']['enemies']))
                if variant=='blade':self.signed_bypass()
            if variant=='blade':self.restart('RESOLVED');self.enter()
            self.walk_sign('elderweald-sela');self.panel();before=self.state();self.action('claim',live=True);after=self.guard()
            expected={k:v+(3 if k=='fiber' else 0) for k,v in before['sandbox']['inventory'].items()}
            self.check('exact separate 4 coin/3 fibre one-time payment',after['earthWildSigns']['claimed'] is True and after['adventure']['coins']==before['adventure']['coins']+4 and after['sandbox']['inventory']==expected and after['adventure']['xp']==before['adventure']['xp'] and after['adventure']['ore']==before['adventure']['ore'])
            self.check('paid menu offers no second claim',self.page.locator('[data-rpg="wild-signs-claim"]:not([disabled])').count()==0)
            self.capture('PAID');self.restart('PAID_COLD');self.check('history retained once after cold native load',self.signs()['claimed'] is True)
            self.check('original legacy save key never changed',self.ev('()=>localStorage.getItem(RealmCore.KEY)')==self.legacy)
    return WildSigns


def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__)
    for name in ('root','cohort','original-cohort','output'):p.add_argument('--'+name,type=Path,required=True)
    p.add_argument('--renderer',choices=('hardware','software'),required=True)
    p.add_argument('--check-only',action='store_true',help='Admission only; never import Playwright or create evidence/server/profile')
    args=p.parse_args(argv);absolute=args.output.is_absolute();args.root=args.root.resolve();args.output=args.output.resolve()
    need(absolute and not args.output.exists() and args.root not in args.output.parents and args.output!=args.root
         and (os.name!='nt' or args.output.drive.lower()=='d:'), 'Fresh absolute bounded D output outside ROOT required')
    clean_source_tree(args.root)
    base=load_base(args.root);rows,frozen,epoch=preflight(args.root,args.cohort,args.original_cohort,base)
    frozen[str(Path(__file__).resolve())]=sha(__file__)
    if args.check_only:
        print(json.dumps({'status':'admitted-only','head':epoch['head'],'variants':sorted(rows),
                          'browserExecuted':False,'serverStarted':False,'filesystemWrites':0,'inputs':frozen},indent=2))
        return
    from playwright.sync_api import sync_playwright
    args.output.mkdir();report={'status':'running','head':epoch['head'],'html_sha256':epoch['htmlSha256'],
      'harnessSha256':sha(__file__),'admittedInputs':frozen,'cases':{},'browserErrors':[],'externalRequests':[],
      'errors':[],'execution':'ordinary-RAF/original-native-input','humanAcceptance':False,'performanceCertified':False}
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self,*a,**kw):super().__init__(*a,directory=str(args.root),**kw)
        def log_message(self,*a):pass
    server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
    origin='http://127.0.0.1:'+str(server.server_port);report['origin']=origin;Native=driver_class(base)
    try:
        with sync_playwright() as pw:
            for variant,resolution,reverse in CASES:
                h=Native(pw,args,report,origin,variant+'-'+resolution)
                try:h.run_signs(rows[variant],resolution,reverse,variant)
                finally:h.finish()
        need(not report['browserErrors'] and not report['externalRequests'], 'Runtime errors/external requests retained')
        need(all(Path(k).is_file() and sha(k)==v for k,v in frozen.items()), 'Source/cohort/caller input bytes changed during native execution')
        need(base.current_epoch(args.root)==epoch, 'Actual source HEAD changed during native execution')
        clean_source_tree(args.root)
        report['status']='passed'
    except Exception:
        report['status']='failed';report['errors'].append(traceback.format_exc());raise
    finally:
        server.shutdown();server.server_close();report['serverClosed']=True
        report['retention']='All failure/success synthetic profiles, close receipts, screenshots and exact native bytes retained; no deletion.'
        dump(args.output/'WILD_SIGNS_NATIVE_REPORT.json',report)


if __name__=='__main__':main()
