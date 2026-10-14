"""ET06 native UI journey on isolated loopback storage.

Production moveTo and accepted .05s ticks accelerate travel/setup. No pose,
inventory, health, quest or damage injection. Quest choices and skill/camera
selection use native controls. Optional short canvas footage uses ordinary RAF
only. This is software-WebGL evidence, not human pacing or RTX qualification.
"""
from pathlib import Path
import argparse, base64, functools, hashlib, json, os, tempfile, threading, traceback
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright
from browser_support import launch_kwargs

ROOT = Path(__file__).resolve().parents[1]
INIT = "window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=false;window.__masterworkStartup=Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]));"

def finish_report(report, out):
    """Write the actual terminal result, and fail the process on incomplete proof."""
    report['passed']=(bool(report['checks']) and all(c['passed'] is True for c in report['checks'])
        and not report['errors'] and not report['browser_errors'] and report.get('source_unchanged') is True
        and all(report['resources'].get(k) is True for k in ('context_closed', 'server_closed')))
    with (out/'REPORT.json').open('x', encoding='utf-8') as stream:
        stream.write(json.dumps(report, indent=2)+'\n')
    print(json.dumps({'passed':report['passed'],'checks':len(report['checks']),'errors':len(report['errors'])}),flush=True)
    if not report['passed']:raise RuntimeError('Masterwork native qualification is incomplete; see REPORT.json')

def main(argv=None):
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True);parser.add_argument('--bow',action='store_true');parser.add_argument('--record',action='store_true');parser.add_argument('--both',action='store_true');args=parser.parse_args(argv)
    out=args.output.resolve()
    if not args.output.is_absolute() or out==Path(out.anchor) or out==ROOT or out.is_relative_to(ROOT) or ROOT.is_relative_to(out) or os.name=='nt' and out.drive.upper()!='D:':raise ValueError('Use fresh bounded D evidence separate from the game')
    if args.both:
        if args.bow or args.record or out.exists():raise ValueError('Both-family gate requires fresh output and no single-family or recording override')
        main(['--output',str(out/'blade')]);main(['--output',str(out/'bow'),'--bow']);return
    out.mkdir(parents=True,exist_ok=False)
    source_files=sorted([*ROOT.glob('src/*.js'),*ROOT.glob('src/*.css'),ROOT/'src/shell.html',ROOT/'build.py',Path(__file__).resolve()])
    source_identity=lambda:{str(p.relative_to(ROOT)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in source_files}
    report={'source_sha256':source_identity(),'save_versions':{'world':9,'adventure':13,'masterwork':1},'method':__doc__,'variant':'bow-public' if args.bow else 'blade-private','checks':[],'errors':[],'browser_errors':[],'accelerated_ticks':True,'manual_state_grants':False,'human_playtest':False,'renderer':'software','viewport':[1280,800],'quality':'low','resources':{'context_closed':False,'server_closed':False},'html_sha256':hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()}
    class Handler(SimpleHTTPRequestHandler):
        def log_message(self,*_args):pass
    server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)));thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    context=None
    def check(name,ok):
        report['checks'].append({'name':name,'passed':bool(ok)});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
        if not ok:raise AssertionError(name)
    try:
      with tempfile.TemporaryDirectory(prefix='firstlight-masterwork-') as profile,sync_playwright() as pw:
        def start():
            nonlocal context
            context=pw.chromium.launch_persistent_context(profile,**launch_kwargs(),viewport={'width':1280,'height':800})
            page=context.pages[0] if context.pages else context.new_page();page.on('pageerror',lambda e:report['browser_errors'].append(str(e)));page.add_init_script(INIT)
            response=page.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='load');page.wait_for_function('!!window.Realm')
            check('served exact current HTML',hashlib.sha256(response.body()).hexdigest()==report['html_sha256']);page.evaluate("Realm.test.quality('low');Realm.test.render()")
            return page
        page=start();ev=lambda js,arg=None:page.evaluate(js,arg);state=lambda:ev('Realm.state');quest=lambda:state()['adventure']['earthMasterwork']
        def close():
            if page.locator('#rpg-window').evaluate('e=>e.open'):page.locator('#rpg-close').click()
        def render():ev('Realm.test.render()')
        def key(k):page.locator('#world').focus();page.keyboard.press(k);render()
        def walk(x,z):
            close();result=ev("([x,z])=>{const r=Realm.test.move(x,z);if(!r.ok)return r;for(let i=0;i<12000&&Realm.test.path.length;i++)Realm.test.step(.05);const p=Realm.diagnostics.adventure.player;return{ok:Math.hypot(p.x-x,p.z-z)<.3}}",[x,z]);check(f'actual supported walk {x},{z}',result.get('ok'));render()
        def action(kind,id=None,prefix='masterwork-'):
            selector=f'[data-rpg="{prefix}{kind}"]'+(f'[data-id="{id}"]' if id is not None else '')
            page.locator(selector).first.click();render()
        def workspace():
            close();key('j');action('open')
        def shot(name):page.screenshot(path=str(out/(name+'.png')))
        check('fresh character has no accepted masterwork or kit',not quest()['accepted'] and not state()['adventure']['started'])
        walk(11,9);key('e');check('native E earns Oren kit',state()['adventure']['started'])
        if args.bow:
            for node in ['timber-1','timber-2','fibre-1','fibre-2','stone-1']:
                point=ev('(id)=>RealmSandbox.NODES.find(n=>n.id===id)',node);walk(point['x']+1.1,point['z'])
                check('gather actual '+node,ev("id=>{let n=0;while(Realm.state.sandbox.nodes.find(n=>n.id===id).hp){const r=Realm.test.sandbox('mw-gather-'+id+'-'+n++,'gather',{node:id});if(!r.ok)return false;Realm.test.step(1.1);}return true}",node))
            walk(11,9);check('craft owned bow from gathered materials',ev("Realm.test.adventure('mw-bow','arsenal-craft',{id:'trail_bow'}).ok"));check('explicitly equip crafted bow',ev("Realm.test.adventure('mw-equip','equip',{id:'trail_bow'}).ok"))
        initial=state();walk(14.5,10.5);key('e');text=page.locator('#rpg-content').inner_text();check('offer explains physical route and optional reward before acceptance',all(t in text for t in ['Hearthwater','No currency','Recovery','Coverage']));shot('01-OFFER')
        action('accept');check('native acceptance owns empty evidence',quest()['accepted'] and quest()['evidence']==[])
        action('track');walk(9.8,9.7);key('e');action('inspect','tool-sample');check('native sample inspection once',quest()['evidence']==['tool-sample'])
        walk(0,23);key('e');action('confirm',prefix='earth-');check('native travel reaches Hearthwater',ev('Realm.diagnostics.scene')=='earth-hearthwater-approach')
        if args.record:
            ev("()=>{const stream=document.querySelector('#world').captureStream(25),chunks=[];window.__mwClip={stream,chunks,recorder:new MediaRecorder(stream,{mimeType:'video/webm',videoBitsPerSecond:800000})};__mwClip.recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};__mwClip.recorder.start();}")
            ev('Realm.test.move(0,10)');page.wait_for_timeout(8000);key('v');ev('Realm.test.move(7,5)');page.wait_for_timeout(12000)
            data=ev("()=>new Promise(resolve=>{const c=__mwClip;c.recorder.onstop=async()=>{const bytes=new Uint8Array(await new Blob(c.chunks,{type:'video/webm'}).arrayBuffer());c.stream.getTracks().forEach(t=>t.stop());let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));delete window.__mwClip;resolve(btoa(text));};c.recorder.stop();})")
            clip=base64.b64decode(data);(out/'MASTERWORK_OUTING.webm').write_bytes(clip);report['footage']={'bytes':len(clip),'normalRAF':True,'requestedSeconds':20,'canvasOnly':True};check('short ordinary-RAF clip has encoded data',len(clip)>30000)
        walk(0,10);walk(12,-26);workspace();action('inspect','commission-order');plaque=ev('RealmEarthMasterwork.definition.evidence[2]');walk(plaque['x'],plaque['z']);workspace();action('inspect','credited-plaque');check('all three native evidence actions retained',len(quest()['evidence'])==3);close()
        for mode in ['diorama','third']:
            projection=ev('Realm.diagnostics.camera.projection')
            if (projection=='orthographic')!=(mode=='diorama'):key('v')
            page.wait_for_timeout(300);shot('02-QUARRY-'+mode);check(mode+' projection selected by native V',ev('Realm.diagnostics.camera.projection')==('orthographic' if mode=='diorama' else 'perspective'))
        walk(0,24);key('e');check('native return reaches existing Firstlight checkpoint',ev('Realm.diagnostics.scene')=='valley');walk(14.5,10.5);key('e');action('compare','maker-before-stamp');action('participation','coauthor' if args.bow else 'private')
        resolution='public-correction' if args.bow else 'private-correction';action('preview-resolve',resolution);check('preview does not resolve the commission',quest()['resolution'] is None);action('confirm');check('explicit correction retained',quest()['resolution']==resolution)
        weapon='trail_bow' if args.bow else 'trail_blade';action('preview-learn',weapon);check('lesson preview grants nothing',quest()['weapon'] is None);action('confirm');check('learning stays disabled and never equips',quest()['weapon']==weapon and not quest()['enabled'] and state()['adventure']['equipment']==initial['adventure']['equipment']);shot('03-LESSON')
        action('enable','true');check('native explicit enable updates actual special',ev('RealmArsenal.special(Realm.state.adventure).learned') is True)
        close();walk(0,23);key('e');action('confirm',prefix='earth-');walk(0,10);walk(plaque['x'],plaque['z']);close()
        for mode in ['diorama','third']:
            if (ev('Realm.diagnostics.camera.projection')=='orthographic')!=(mode=='diorama'):key('v')
            page.wait_for_timeout(300);shot('03-CORRECTED-'+mode)
        check('correction survives actual return to quarry',quest()['resolution']==resolution)
        walk(0,24);key('e')
        close();walk(15,7);key('e');check('enter existing riverbank practice',ev('Realm.diagnostics.scene')=='riverbank');walk(-5,11.5);key('Tab');check('native selected target is practice',page.locator('#target-name').inner_text()=='Oren’s practice bundle')
        before=ev('RealmCombat.runtime(Realm.test.worldContext().sim).hits.length');key('q');page.wait_for_timeout(500);check('native Q creates confirmed real practice impact',ev('RealmCombat.runtime(Realm.test.worldContext().sim).hits.length')>before);check('new special label visible',page.locator('#skill-special small').inner_text()==('Quick draw' if args.bow else 'Cut'));shot('04-PRACTICE')
        check('quest and practice preserve XP, sockets, old class and soul',all(state()['adventure'][k]==initial['adventure'][k] for k in ['xp','arsenal','classPath','beacon','earthBinding','realmCraft']))
        key('p');ev('Realm.test.save()');expected=state();raw=ev('Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))');context.close();context=None;page=start()
        check('whole-browser restart retains exact original stored bytes',ev('window.__masterworkStartup')==raw);check('cold load retains exact commission and equipment',quest()==expected['adventure']['earthMasterwork'] and state()['adventure']['equipment']==expected['adventure']['equipment']);check('legacy browser keys remain absent',not any(k in raw for k in ['eternities.realm09.save.v8','eternities.realm08.save.v7']))
        report['final_record']=quest();check('no unhandled browser errors',not report['browser_errors']);context.close();context=None;report['resources']['context_closed']=True
    except Exception:
        report['errors'].append(traceback.format_exc());raise
    finally:
        if context is not None:
            try:context.close();report['resources']['context_closed']=True
            except Exception as error:report['errors'].append('context cleanup: '+str(error))
        server.shutdown();server.server_close();thread.join(timeout=5);report['resources']['server_closed']=not thread.is_alive()
        report['source_unchanged']=source_identity()==report['source_sha256']
        if not report['source_unchanged']:report['errors'].append('Source changed while native evidence was captured')
        finish_report(report, out)

if __name__=='__main__':main()
