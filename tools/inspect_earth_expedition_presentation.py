"""Controlled appearance comparisons on actual Earth draw batches.
Command-earned save snapshots supply the ledger/gear. Body/camera placements are
explicit synthetic presentation fixtures; this does not prove a walked outing,
ordinary RAF, native storage, GPU performance or human acceptance. Each control
uses identical captured renderer arguments, then restores batches and fog.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
import argparse,base64,hashlib,json,subprocess,threading,traceback
from playwright.sync_api import sync_playwright
from browser_support import launch_kwargs
ROOT=Path(__file__).resolve().parents[1]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
OBSERVER=r'''()=>{
 const proto=RealmArt.WorldArt.prototype,commit=proto.commit;let owner=null,args=null;
 proto.commit=function(...a){const result=commit.apply(this,a);if(this.room==='world-earthlands'){owner=this;proto.commit=commit;const e=owner.e,writer=e.render,own=Object.hasOwn(e,'render');e.render=function(...a){args=a;if(own)e.render=writer;else delete e.render;return writer.apply(this,a);};}return result;};
 const clone=v=>JSON.parse(JSON.stringify(v));
 const signature=()=>JSON.stringify({state:Realm.state,body:Realm.diagnostics.adventure.player,camera:owner.e.camera,vp:Array.from(owner.e.vp),solids:owner.e.cameraSolids,definition:RealmWorldFoundations.definition(owner.room)});
 const read=(e,f)=>{const g=e.gl,a=new Uint8Array(f.w*f.h*4);g.bindFramebuffer(g.FRAMEBUFFER,f.f);g.readPixels(0,0,f.w,f.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;};
 const png=(a,w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d'),im=ctx.createImageData(w,h);for(let y=0;y<h;y++)im.data.set(a.subarray((h-1-y)*w*4,(h-y)*w*4),y*w*4);ctx.putImageData(im,0,0);return c.toDataURL('image/png');};
 window.__earthPresentation={
  ready:()=>!!owner&&!!args,
  snapshot(){const e=owner.e,parts=[];for(const b of[...e.batches,...e.dynamic])for(let j=0;j<b.items.length;j++){const i=b.items[j];if(i.expeditionPart||i.earthBinding||i.expeditionBeastPart)parts.push({kind:b.kind,item:clone(i),matrix:Array.from(b.data.slice(j*24,j*24+16)),supported:!!b.vao});}return{parts,static:e.batches.reduce((n,b)=>n+b.count,0),dynamic:e.dynamic.reduce((n,b)=>n+b.count,0),camera:clone(e.camera),fog:clone(e.worldFog),center:clone(e.worldFogCenter),metrics:clone(e.metrics),observerRestored:proto.commit===commit};},
  compare(control){if(!this.ready())throw Error('No current actual Earth owner');const e=owner.e,writer=e.render,before=signature(),saved=[...e.batches,...e.dynamic].map(b=>({b,items:b.items,data:b.data,count:b.count})),fog=e.worldFog,lastShadow=e.lastShadow;
   const frame=()=>{e.lastShadow=-1;writer.apply(e,args);return{main:read(e,e.mainF),reflection:read(e,e.refF),metrics:clone(e.metrics)};};
   let a,b,c,removed=0;
   try{
    a=frame();
    if(control==='raw-ground'){
     const d=RealmWorldFoundations.definition(owner.room),cells=RealmWorldFoundationsArt.rawPartitions(d),batch=e.batches.find(b=>b.kind==='box'),old=batch.items,drop=new Set();
     for(let j=0;j<old.length;j++)if(old[j].worldGround){drop.add(old[j]);if(!/bridge/.test(old[j].worldGround)){const n=old[j+1];if(!n||n.p[0]!==old[j].p[0]||n.p[2]!==old[j].p[2]||n.s[0]!==old[j].s[0]||n.s[2]!==old[j].s[2])throw Error('Unrecognized actual shore mass');drop.add(n);}}
     const decor={cameraSolid:false,cutaway:false,rough:.96},raw=[];for(const p of cells){raw.push({p:[p.x,p.y-.055,p.z],s:[p.w,.11,p.d],c:p.color,...decor,terrain:true,worldGround:p.source});if(!/bridge/.test(p.source))raw.push({p:[p.x,(p.y-.11-.5)/2,p.z],s:[p.w,p.y-.11+.5,p.d],c:d.palette.stone,...decor});}
     removed=drop.size;batch.items=[...raw,...old.filter(i=>!drop.has(i))];e.updateBatch(batch);
    }else if(control==='old-coordinate-fog')e.worldFog=null;
    else{const selected=i=>control==='binding'?!!i.earthBinding:control==='brace'?i.expeditionPart==='installed-brace'||i.expeditionPart==='brace-fastening':control==='delivery'?i.expeditionPart==='delivered-stock'||i.expeditionPart==='delivery-binding':control==='beast'?!!i.expeditionBeastPart:!!i.expeditionPart;
     for(const{b:batch}of saved){const filtered=batch.items.filter(i=>!selected(i));removed+=batch.items.length-filtered.length;if(filtered.length!==batch.items.length){batch.items=filtered;e.updateBatch(batch);}}
    }
    b=frame();for(const s of saved){s.b.items=s.items;s.b.data=s.data;e.updateBatch(s.b);}e.worldFog=fog;c=frame();
    const delta=(x,y)=>{let changed=0,max=0,sum=0;for(let j=0;j<x.length;j+=4){let n=0;for(let k=0;k<3;k++)n+=Math.abs(x[j+k]-y[j+k]);if(n>6)changed++;max=Math.max(max,n);sum+=n;}return{changedPixels:changed,maxRGBDelta:max,sumRGBDelta:sum};};
    return{control,removed,width:e.mainF.w,height:e.mainF.h,renderArguments:args,main:delta(a.main,b.main),reflection:delta(a.reflection,b.reflection),restoreMain:delta(a.main,c.main),restoreReflection:delta(a.reflection,c.reflection),baselineMetrics:a.metrics,controlMetrics:b.metrics,canonicalCameraCollisionUnchanged:before===signature(),batchesRestored:saved.every(s=>s.b.items===s.items&&s.b.data===s.data&&s.b.count===s.count),fogRestored:e.worldFog===fog,glError:e.gl.getError(),baselinePNG:png(a.main,e.mainF.w,e.mainF.h),controlPNG:png(b.main,e.mainF.w,e.mainF.h),restoredPNG:png(c.main,e.mainF.w,e.mainF.h)};
   }finally{for(const s of saved){s.b.items=s.items;s.b.data=s.data;e.updateBatch(s.b);}e.worldFog=fog;e.lastShadow=lastShadow;}
  }
 };
}'''
def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--earned-dir',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);ap.add_argument('--quality',choices=['low','balanced','high'],default='balanced');ap.add_argument('--variant',choices=['fresh-blade','fresh-bow','veteran']);args=ap.parse_args();out=args.output.resolve()
 if out.exists() and any(out.iterdir()):ap.error('Output must be empty; existing evidence is preserved')
 out.mkdir(parents=True,exist_ok=True)
 report={'method':__doc__,'quality':args.quality,'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'html_sha256':sha(ROOT/'index.html'),'harness_sha256':sha(Path(__file__)),'checks':[],'browser_errors':[],'comparisons':[],'snapshots':[],'sources':{str(p.relative_to(ROOT)):sha(p) for p in sorted((ROOT/'src').glob('*')) if p.is_file()}}
 class Handler(SimpleHTTPRequestHandler):
  def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
  def log_message(self,*a):pass
 server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
 def check(name,ok,evidence=None):
  report['checks'].append({'name':name,'passed':bool(ok),'evidence':evidence});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
  if not ok:raise AssertionError(name)
 try:
  with sync_playwright() as pw:
   browser=pw.chromium.launch(**launch_kwargs('software'))
   try:
    page=browser.new_page(viewport={'width':1440,'height':960});page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;');page.on('pageerror',lambda e:report['browser_errors'].append(str(e)));response=page.goto(f'http://127.0.0.1:{server.server_port}/');page.wait_for_function('()=>!!window.Realm');check('exact assembled source loads',hashlib.sha256(response.body()).hexdigest()==report['html_sha256'])
    for variant in ([args.variant] if args.variant else ['fresh-blade','fresh-bow','veteran']):
     fixture=args.earned_dir/variant/'05_BOUND_RELOADED.json';source=json.loads(fixture.read_text(encoding='utf-8'));report.setdefault('fixtures',[]).append({'path':str(fixture),'sha256':sha(fixture),'label':'Command-earned completed/bound save; presentation placement below is synthetic'})
     page.evaluate(OBSERVER);page.evaluate('s=>Realm.test.replace(s)',source);r=page.evaluate('()=>{Realm.test.pause(false);const move=Realm.test.move(18,6);if(!move.ok)return move;for(let i=0;i<3000&&Realm.test.path.length;i++)Realm.test.step(.05);return Realm.test.worldTravel(RealmWorldFoundations.preview(Realm.test.worldContext(),"earthlands").ticket);}');check(variant+' real crossing terms permit earned source',r['ok'],r)
     for location,pos,controls in [('camp',[-76,-12],['work','raw-ground']),('wetland',[-125,-49],['raw-ground','old-coordinate-fog']),('brace',[-141,-77],['brace','raw-ground']),('glade',[-110,-108],['delivery','binding','raw-ground'])]:
      for view in ['adventure','follow']:
       page.evaluate('p=>{const sim=Realm.test.worldContext().sim;sim.paused=true;sim.state.player={x:p[0],z:p[1],yaw:.6};Realm.test.setTime(17);}',pos);page.locator('[data-rpg="camera"][data-id="'+view+'"]').click();page.evaluate("Realm.test.quality('"+args.quality+"');Realm.test.view({yaw:1.05,elevation:.26,distance:8,half:12});Realm.test.captureFrame(11)");check('actual Earth renderer and observer ready',page.evaluate('()=>__earthPresentation.ready()&&Realm.diagnostics.mode==="webgl2"'))
       shot=f'{variant}-{location}-{view}';page.screenshot(path=str(out/(shot+'.png')));report['snapshots'].append({'label':shot,**page.evaluate('()=>__earthPresentation.snapshot()')})
       for control in controls:
        result=page.evaluate('c=>__earthPresentation.compare(c)',control);label=shot+'-'+control
        for key in ['baselinePNG','controlPNG','restoredPNG']:
         data=result.pop(key);(out/(label+'-'+key+'.png')).write_bytes(base64.b64decode(data.split(',',1)[1]))
        report['comparisons'].append({'label':label,**result});check(label+' exact state/camera/collision/batch restoration',result['canonicalCameraCollisionUnchanged'] and result['batchesRestored'] and result['fogRestored'] and result['restoreMain']['sumRGBDelta']==0 and result['restoreReflection']['sumRGBDelta']==0 and result['glError']==0,result['restoreMain'])
        if control=='raw-ground' and args.quality=='low':check(label+' stable explicit-ground material stays within measured raster bound',result['main']['changedPixels']<=result['width']*result['height']*.005 and result['main']['sumRGBDelta']<=result['width']*result['height']*3*.1,result['main'])
        if control not in ['raw-ground','old-coordinate-fog']:check(label+' contributes actual visible pixels',result['removed']>0 and result['main']['changedPixels']>0,result['main'])
    check('runtime sources and identical HTML stayed fixed',sha(ROOT/'index.html')==report['html_sha256'] and sha(ROOT/'FIRSTLIGHT_VALLEY.html')==report['html_sha256'] and all(sha(ROOT/p)==h for p,h in report['sources'].items()));check('no runtime browser errors',not report['browser_errors']);report['status']='passed'
   finally:browser.close()
 except Exception:report['status']='failed';report['error']=traceback.format_exc();print(report['error'])
 finally:server.shutdown();server.server_close();(out/'REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
 print(json.dumps({'status':report['status'],'checks':len(report['checks']),'output':str(out)},indent=2));return 0 if report['status']=='passed' else 1
if __name__=='__main__':raise SystemExit(main())
