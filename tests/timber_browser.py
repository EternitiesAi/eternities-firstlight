"""Embedded timber maps in actual WebGL2: pixels, lifetime and existing cameras.

Synthetic shader probes are labelled separately from accepted production travel.
Software WebGL is regression evidence, not hardware performance or art approval.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import hashlib, json, tempfile, threading, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'evidence10/timber'; OUT.mkdir(parents=True, exist_ok=True)
report = {'method': __doc__, 'checks': [], 'errors': [], 'browser_errors': [],
          'html_sha256': hashlib.sha256((ROOT / 'index.html').read_bytes()).hexdigest()}
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=str(ROOT), **k)
    def log_message(self, *_): pass
def check(name, value):
    report['checks'].append({'name': name, 'passed': bool(value)})
    print(('PASS ' if value else 'FAIL ') + name, flush=True)
    if not value: raise AssertionError(name)
server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/'
try:
    with tempfile.TemporaryDirectory(prefix='firstlight-timber-') as profile, sync_playwright() as pw:
        ctx = pw.chromium.launch_persistent_context(profile, **chromium_launch_kwargs(), viewport={'width': 1280, 'height': 800})
        page = ctx.new_page(); requests = []
        page.on('pageerror', lambda e: report['browser_errors'].append(str(e)))
        page.on('request', lambda r: requests.append(r.url))
        page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
        response = page.goto(url, wait_until='load'); page.wait_for_function('()=>!!window.Realm')
        ev = page.evaluate
        def render(): ev('()=>Realm.test.render()')
        def ready():
            page.wait_for_function("()=>{Realm.test.render();return Realm.diagnostics.metrics?.surfaceMaterials?.status==='ready'}")
        ready()
        check('exact standalone build loads with WebGL2', hashlib.sha256(response.body()).hexdigest() == report['html_sha256'] and ev('()=>Realm.diagnostics.mode') == 'webgl2')
        info = ev('()=>Realm.diagnostics.metrics.surfaceMaterials'); report['surface'] = info
        check('both embedded maps decode at 512px with explicit color formats', info['ready'] and info['width'] == info['height'] == 512 and info['colorFormat'] == 'SRGB8_ALPHA8' and info['roughnessFormat'] == 'R8')
        check('two-map mip allocation estimate is bounded', info['totalTextureBytes'] == 1747625)
        check('CPU timings are labelled separately from GPU completion', info['decodeWallMs'] >= 0 and info['uploadCpuMs'] >= 0 and 'excludes GPU completion' in info['timingScope'])
        def walk(x, z):
            r = ev('''([x,z])=>{const r=Realm.test.move(x,z);if(!r.ok)return r;for(let i=0;i<3500&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render();const p=Realm.diagnostics.adventure.player;return{ok:Math.hypot(p.x-x,p.z-z)<.25}}''', [x, z])
            check(f'accepted walking reaches {x},{z}', r.get('ok'))
        def enter():
            walk(0, 23); page.keyboard.press('e'); render()
            page.locator('[data-rpg="earth-confirm"]').click(); render()
            check('explicit existing invitation enters Earth', ev('()=>Realm.diagnostics.scene') == 'earth-hearthwater-approach')
        enter(); walk(0, 10); walk(7, 2); walk(8.9, -7.9)
        ev("()=>{Realm.test.setTime(16);Realm.test.quality('balanced');Realm.test.view({yaw:.95,elevation:.32,distance:8});Realm.test.render()}")
        totals = ev('()=>Realm.diagnostics.metrics'); report['earth_metrics'] = totals
        check('original eight mill pieces plus eight gate parts use static and dynamic groups', totals['texturedInstances'] == 16 and 2 <= totals['texturedDrawCalls'] <= 4 and ev("()=>Realm.test.millGate().parts.filter(i=>i.kind==='timber-panel').length") == 8)
        saved = ev('()=>Realm.state')
        for mode in ['third', 'diorama']:
            if (ev('()=>Realm.diagnostics.camera.projection') == 'orthographic') != (mode == 'diorama'):
                page.keyboard.press('v'); render()
            check(mode + ' camera retains correct projection', ev('()=>Realm.diagnostics.camera.projection') == ('orthographic' if mode == 'diorama' else 'perspective'))
            page.screenshot(path=str(OUT / ('MILL_' + mode.upper() + '.png')))
            ev('()=>{Realm.test.surfaceMaterials(false);Realm.test.render()}'); off = ev('()=>Realm.diagnostics.metrics')
            ev('()=>{Realm.test.surfaceMaterials(true);Realm.test.render()}'); on = ev('()=>Realm.diagnostics.metrics')
            check(mode + ' fallback preserves draw geometry', all(off[k] == on[k] for k in ['instances', 'triangles', 'drawCalls']) and off['texturedDrawCalls'] == 0)
        check('material toggle cannot mutate adventure, creations or choices', all(ev('()=>Realm.state')[k] == saved[k] for k in ['adventure', 'notes', 'score', 'retreat', 'sandbox']))
        ev("()=>{Realm.test.quality('low');Realm.test.render()}")
        check('low mode keeps valid surface sampling', ev('()=>Realm.diagnostics.metrics.texturedInstances') == 16 and ev('()=>document.querySelector("#world").getContext("webgl2").getError()') == 0)
        ev('()=>{Realm.test.save();Realm.test.render()}'); adventure = ev('()=>Realm.state.adventure')
        for _ in range(3):
            page.locator('#earth-home').click(); render(); enter()
        check('scene rebuilds keep original texture lifetime and allocation', ev('()=>Realm.diagnostics.metrics.surfaceMaterials')['decodeWallMs'] == info['decodeWallMs'] and ev('()=>Realm.diagnostics.metrics.surfaceMaterials')['totalTextureBytes'] == 1747625)
        ev('()=>Realm.test.save()'); adventure = ev('()=>Realm.state.adventure')
        page.reload(); page.wait_for_function('()=>!!window.Realm'); ready()
        check('reload retains exact adventure history at source checkpoint', ev('()=>Realm.diagnostics.scene') == 'valley' and ev('()=>Realm.state.adventure') == adventure)
        # Independent synthetic scene: actual main/reflection pixels, no quest state.
        ev('''()=>{const c=document.createElement('canvas');c.style.display='none';document.body.append(c);const e=window.probe=new RealmEngine.Engine(c);e.resize(800,600,1);e.quality='balanced';e.waterStill=true;e.cutawayFocus=[0,2,0];e.setCamera({eye:[0,18,24],target:[0,2,0],half:10,aspect:4/3});const wall=window.wall={p:[0,5,4],s:[7,8,1],c:[.60,.45,.28],cutaway:true};e.batch('timber-panel',[wall]);e.batch('box',[{p:[0,2,0],s:[1.6,3,1.6],c:[.01,.05,1],em:.8}]);}''')
        page.wait_for_function("()=>probe.surfaceMaterialInfo.status==='ready'")
        # Independently inspect the uploaded scalar texels and sRGB sampling.
        values = ev('''async()=>{const e=probe,g=e.gl,f=g.createFramebuffer();g.bindFramebuffer(g.FRAMEBUFFER,f);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,e._surfaceTextures.roughness,0);const complete=g.checkFramebufferStatus(g.FRAMEBUFFER)===g.FRAMEBUFFER_COMPLETE,out=[];for(const [x,y,want]of[[51,0,188],[75,128,186],[256,256,187]]){const p=new Uint8Array(4);g.readPixels(x,y,1,1,g.RGBA,g.UNSIGNED_BYTE,p);out.push({x,y,want,actual:Array.from(p)});}g.bindFramebuffer(g.FRAMEBUFFER,null);g.deleteFramebuffer(f);
         const image=new Image();image.src=RealmSurfaceAssets.timber.maps.color;await image.decode();const c=document.createElement('canvas');c.width=c.height=512;const context=c.getContext('2d',{colorSpace:'srgb'});context.drawImage(image,0,0);const encoded=Array.from(context.getImageData(51,0,1,1).data).slice(0,3),expected=encoded.map(v=>{const x=v/255;return Math.round((x<=.04045?x/12.92:((x+.055)/1.055)**2.4)*255)});
         const target=e.framebuffer(1,1),p=e.programOf('#version 300 es\\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0.,1.);}', '#version 300 es\\nprecision highp float;uniform sampler2D color;out vec4 frag;void main(){frag=vec4(texelFetch(color,ivec2(51,0),0).rgb,1.);}');g.bindFramebuffer(g.FRAMEBUFFER,target.f);g.viewport(0,0,1,1);g.disable(g.DEPTH_TEST);g.useProgram(p);g.activeTexture(g.TEXTURE3);g.bindTexture(g.TEXTURE_2D,e._surfaceTextures.color);e.uni(p,'color','i',3);g.bindVertexArray(e.emptyVAO);g.drawArrays(g.TRIANGLES,0,3);const actual=new Uint8Array(4);g.readPixels(0,0,1,1,g.RGBA,g.UNSIGNED_BYTE,actual);g.bindFramebuffer(g.FRAMEBUFFER,null);e.cache.delete(p);g.deleteProgram(p);g.deleteFramebuffer(target.f);g.deleteTexture(target.tex);g.deleteRenderbuffer(target.depth);return{complete,roughness:out,color:{encoded,expected,actual:Array.from(actual)},error:g.getError()};}''')
        report['uploaded_values'] = values
        check('synthetic probe: roughness upload preserves exact scalar bytes', values['complete'] and all(s['actual'] == [s['want'], 0, 0, 255] for s in values['roughness']))
        check('synthetic probe: JPEG sampling follows sRGB transfer', all(abs(values['color']['actual'][i] - values['color']['expected'][i]) <= 2 for i in range(3)) and values['color']['actual'][3] == 255 and values['error'] == 0)
        checks = ev('''()=>{const e=probe,g=e.gl,read=f=>{g.bindFramebuffer(g.FRAMEBUFFER,f.f);let a=new Uint8Array(f.w*f.h*4);g.readPixels(0,0,f.w,f.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;},diff=(a,b)=>{let n=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])n++;return n;},blue=a=>{let n=0;for(let y=245;y<355;y++)for(let x=360;x<440;x++){let i=4*(y*e.mainF.w+x);if(a[i+2]>a[i]*1.6&&a[i+2]>60)n++;}return n;};e.cutaway=false;e.surfaceMaterialsEnabled=false;e.lastShadow=-1;e.render(1,16,false);const plain=read(e.mainF);e.surfaceMaterialsEnabled=true;e.lastShadow=-1;e.render(1,16,false);const mapped=read(e.mainF),refOff=read(e.refF);e.cutaway=true;e.lastShadow=-1;e.render(1,16,false);const cut=read(e.mainF),refOn=read(e.refF);const a=[['real texture sampling changes visible pixels',diff(plain,mapped)>1000],['textured occluder retains character cutaway',blue(cut)>blue(mapped)+100],['cutaway does not corrupt mapped reflection',diff(refOff,refOn)===0],['mapped passes have no GL errors',g.getError()===0]];e.clear();e.batch('box',[{p:[0,3,0],s:[4,4,4],c:[.6,.4,.2]}]);e.surfaceMaterialsEnabled=false;e.render(1,16,false);const base=read(e.mainF);e.surfaceMaterialsEnabled=true;e.render(1,16,false);a.push(['untextured scene stays pixel-identical',diff(base,read(e.mainF))===0]);return a;}''')
        for name, passed in checks: check('synthetic probe: ' + name, passed)
        # Real browser image decode failures: no successful-looking partial material.
        for case in ['corrupt', 'wrong-size']:
            ev('''kind=>{probe.disposeSurfaceMaterials();const original=RealmSurfaceAssets,copy={...original.timber,maps:{...original.timber.maps}};if(kind==='corrupt'){const bytes=atob(copy.maps.roughness.split(',')[1]).slice(0,33);copy.maps.roughness='data:image/png;base64,'+btoa(bytes);}else{const c=document.createElement('canvas');c.width=c.height=1;copy.maps.color=c.toDataURL('image/jpeg');}window.RealmSurfaceAssets={...original,timber:copy};const c=document.createElement('canvas');window.failedProbe=new RealmEngine.Engine(c);window.RealmSurfaceAssets=original;}''', case)
            page.wait_for_function("()=>failedProbe.surfaceMaterialInfo.status==='error'")
            failure = ev('''()=>{const e=failedProbe;e.resize(128,128,1);e.waterStill=true;e.setCamera({eye:[0,6,10],target:[0,3,0],half:5,aspect:1});const g=e.gl,read=()=>{g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);const a=new Uint8Array(128*128*4);g.readPixels(0,0,128,128,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;},it={p:[0,3,0],s:[3,3,3],c:[.6,.4,.2]};e.batch('timber-panel',[it]);e.lastShadow=-1;e.render(1,16,false);const fallback=read(),draws=e.metrics.texturedDrawCalls;e.clear();e.batch('box',[it]);e.lastShadow=-1;e.render(1,16,false);const plain=read(),center=4*(64*128+64);return{info:e.surfaceMaterialInfo,draws,error:g.getError(),identical:fallback.every((v,i)=>v===plain[i]),visible:fallback[center]>fallback[center+2]+10};}''')
            check(case + ' map refuses atomically and renders plain fallback', not failure['info']['ready'] and failure['info']['totalTextureBytes'] == 0 and failure['draws'] == 0 and failure['error'] == 0)
            check(case + ' fallback has visible pixels identical to ordinary wood', failure['identical'] and failure['visible'])
            ev('()=>failedProbe.disposeSurfaceMaterials()')
        ev('''()=>{const c=document.createElement('canvas');window.lostProbe=new RealmEngine.Engine(c);lostProbe.gl.getExtension('WEBGL_lose_context').loseContext();}''')
        page.wait_for_function("()=>lostProbe.surfaceMaterialInfo.status==='context-lost'")
        page.wait_for_timeout(80)
        check('context loss retires pending maps without resurrection', ev('()=>lostProbe.surfaceMaterialInfo.ready===false&&lostProbe.surfaceMaterialInfo.totalTextureBytes===0'))
        ev('()=>lostProbe.disposeSurfaceMaterials()')
        before_loss = ev('()=>Realm.state')
        ev('()=>document.querySelector("#world").getContext("webgl2").getExtension("WEBGL_lose_context").loseContext()')
        page.wait_for_function('()=>Realm.diagnostics.mode==="map"')
        check('production context loss displays the usable map fallback', page.locator('#map-fallback').is_visible() and 'local state is intact' in page.locator('#fallback-banner').inner_text())
        check('production context loss preserves export and local save', json.loads(ev('()=>Realm.export()')) == before_loss and ev('()=>Realm.test.save()') is not False and ev('()=>Realm.state') == before_loss)
        check('only loopback or embedded asset requests', all(u.startswith((url, 'data:', 'blob:')) for u in requests))
        check('no unhandled browser errors', not report['browser_errors'])
        ctx.close()
except Exception as e:
    report['errors'].append(str(e)); traceback.print_exc()
finally:
    server.shutdown()
    (OUT / 'report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(f"Timber browser: {sum(x['passed'] for x in report['checks'])}/{len(report['checks'])}; errors: {len(report['errors'])}", flush=True)
if report['errors'] or report['browser_errors']: raise SystemExit(1)
