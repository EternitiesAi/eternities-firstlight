"""Record a short real browser gameplay session on an isolated loopback origin."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import argparse, hashlib, json, threading
from playwright.sync_api import sync_playwright
from browser_support import launch_kwargs
ROOT=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**k): super().__init__(*a,directory=str(ROOT),**k)
    def log_message(self,*_a): pass
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--seconds',type=float,default=20);ap.add_argument('--fixture',type=Path,help='command-earned save JSON fixture');ap.add_argument('--actions',type=Path,help='JSON list: key, click selector, evaluate expression, wait_ms');ap.add_argument('--output',type=Path,default=Path('evidence10/gameplay-video'));a=ap.parse_args();a.output.mkdir(parents=True,exist_ok=True)
    server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/FIRSTLIGHT_VALLEY.html';report={'origin':url,'html_sha256':hashlib.sha256((ROOT/'FIRSTLIGHT_VALLEY.html').read_bytes()).hexdigest(),'default_duration_requested_seconds':a.seconds if not a.actions else None,'performance_claim':False}
    try:
        with sync_playwright() as pw:
            b=pw.chromium.launch(**launch_kwargs('hardware'));report['browser_version']=b.version;c=b.new_context(viewport={'width':1280,'height':720},record_video_dir=str(a.output),record_video_size={'width':1280,'height':720});p=c.new_page();fixture=json.loads(a.fixture.read_text(encoding='utf-8')) if a.fixture else None; init='window.__ETERNITIES_TEST_MODE=true;'+(f"window.__ETERNITIES_FIXTURE={json.dumps(fixture)};" if fixture else '');p.add_init_script(init);p.goto(url,wait_until='load');p.wait_for_function('window.Realm');
            if fixture: p.evaluate('(s)=>Realm.test.replace(s)',fixture)
            p.evaluate('Realm.test.render()'); report['fixture']=str(a.fixture) if a.fixture else None;report['fixture_sha256']=hashlib.sha256(a.fixture.read_bytes()).hexdigest() if a.fixture else None;report['method']='Automated accepted commands and UI on normal real-time RAF; '+('command-earned checkpoint' if fixture else 'fresh production-created character')+', no gameplay state grants; video is not an FPS measurement.';report['actions']=[];report['browser_errors']=[];p.on('pageerror',lambda e:report['browser_errors'].append(str(e)));p.evaluate('''()=>{const e=document.createElement('div');e.textContent='ENGINEERING PLAYTHROUGH · REAL-TIME CHROME · RTX 3080';e.style='position:fixed;bottom:3px;right:8px;font:10px sans-serif;color:#fff;background:#183335;padding:5px;z-index:100000;pointer-events:none';document.body.append(e)}''')
            actions=json.loads(a.actions.read_text(encoding='utf-8')) if a.actions else [{'key':'m','wait_ms':int(a.seconds*1000)},{'key':'Escape','wait_ms':0}]
            for action_index, action in enumerate(actions):
                print(f'Action {action_index + 1}/{len(actions)}: '+next(iter(action)), flush=True)
                if 'key' in action: p.keyboard.press(action['key'])
                elif 'click' in action: p.locator(action['click']).click()
                elif 'fill' in action: p.locator(action['fill']['selector']).fill(action['fill']['value'])
                elif 'evaluate' in action: report['actions'].append({'action':action,'result':p.evaluate(action['evaluate'])})
                elif 'scroll' in action: p.locator(action['scroll']).scroll_into_view_if_needed()
                elif 'walk' in action:
                    result=p.evaluate('([x,z])=>Realm.test.move(x,z)',action['walk']);assert result['ok'],result;p.evaluate('''async()=>{const start=performance.now();while(Realm.test.path.length){if(performance.now()-start>45000)throw Error('Walking timed out');await new Promise(r=>setTimeout(r,50));}}''')
                elif 'fight' in action:
                    result=p.evaluate('''async(id)=>{const cmd=(t,p={})=>Realm.test.adventure('video-'+t+'-'+performance.now(),t,p);const first=cmd('target-select',{id});if(!first.ok)throw Error(first.error);cmd('auto-toggle');const start=performance.now();let guards=0;
                    while(performance.now()-start<45000){const d=Realm.diagnostics.adventure,a=Realm.state.adventure,e=d.enemies.find(e=>e.id===id);if(!e||e.hp<=0){cmd('target-clear');return{defeated:true,seconds:(performance.now()-start)/1000,guards};}if(a.hp<=0)throw Error('Player died');if(e.mode==='windup'&&a.stamina>=20&&a.elapsed>=d.tactics.cooldowns.guard){if(cmd('guard').ok)guards++;}if(a.hp<48&&a.tonics&&a.elapsed>=0)cmd('heal');if(!Realm.test.path.length&&(Math.hypot(d.player.x-e.x,d.player.z-e.z)>=d.weapon.reach-.2||!RealmStarter.line(d.player,e))){const rad=d.weapon.style==='bow'?5:1.6;for(let i=0;i<16;i++){const x=e.x+Math.sin(i*Math.PI/8)*rad,z=e.z+Math.cos(i*Math.PI/8)*rad;if(RealmStarter.walkable(x,z)&&RealmStarter.line({x,z},e)&&Realm.test.move(x,z).ok)break;}}await new Promise(r=>setTimeout(r,60));}throw Error('Fight timed out: '+id);}''',action['fight']);report['actions'].append({'fight':action['fight'],**result})
                p.wait_for_timeout(int(action.get('wait_ms',0)))
                report['completed_actions']=action_index+1
                report['last_checkpoint']=p.evaluate('()=>({world:Realm.state,diagnostics:Realm.diagnostics,practiceText:document.querySelector("#target-state")?.textContent})')
                (a.output/'PROGRESS.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
            report['final_diagnostics']=p.evaluate('Realm.diagnostics');report['final_quest']=p.evaluate('Realm.state.adventure.starter');report['final_pursuit']=p.evaluate('Realm.state.adventure.pursuit');c.close();report['video_path']=str(p.video.path())
            b.close()
    finally: server.shutdown()
    (a.output/'REPORT.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,indent=2))
if __name__=='__main__':main()
