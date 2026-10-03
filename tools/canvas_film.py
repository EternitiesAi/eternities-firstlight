"""Record the actual rendered game canvas and opted-in app audio in one stream.

The separate Playwright video still records visible HUD/menu UI. This stream is
the WebGL canvas with browser-synchronized Web Audio, not a composited trailer or
offline replacement soundtrack. Installation observes the first destination
connection before app startup; start adds one removable recording-only tap.
"""
import base64
import hashlib


HOOK = r'''(() => {
 'use strict';
 const original=AudioNode.prototype.connect;
 let master=null, context=null, destination=null, stream=null, recorder=null;
 let chunks=[],started=null,ended=null,videoTrack=null;
 AudioNode.prototype.connect=function(...args){
  const result=original.apply(this,args);
  if(!master&&args[0]===this.context.destination){
   master=this;context=this.context;AudioNode.prototype.connect=original;
  }
  return result;
 };
 window.__FirstlightCanvasFilm={
  start(){
   if(recorder)throw Error('A canvas film already owns this recorder');
   if(!master||context.state!=='running')throw Error('Opt in to running app audio first');
   const canvas=document.querySelector('#world');
   if(!canvas||!canvas.captureStream)throw Error('Canvas capture unavailable');
   const mime='video/webm;codecs=vp8,opus';
   if(!MediaRecorder.isTypeSupported(mime))throw Error('VP8/Opus capture unavailable');
   destination=context.createMediaStreamDestination();
   original.call(master,destination);
   videoTrack=canvas.captureStream(30).getVideoTracks()[0];
   stream=new MediaStream([videoTrack,...destination.stream.getAudioTracks()]);
   recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:5000000,audioBitsPerSecond:128000});
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   started=performance.now();recorder.start(1000);
   return{mime,startedAtPageMilliseconds:started,contextState:context.state,
    canvas:{width:canvas.width,height:canvas.height},videoTrack:videoTrack.getSettings(),
    audioTracks:stream.getAudioTracks().length,videoTracks:stream.getVideoTracks().length};
  },
  async stop(){
   if(!recorder||recorder.state!=='recording')throw Error('No active canvas film');
   await new Promise(resolve=>{recorder.onstop=resolve;recorder.stop();});ended=performance.now();
   const blob=new Blob(chunks,{type:recorder.mimeType});
   const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(blob);});
   master.disconnect(destination);destination.disconnect();
   for(const track of stream.getTracks())track.stop();
   const facts={mime:recorder.mimeType,startedAtPageMilliseconds:started,endedAtPageMilliseconds:ended,
    elapsedMilliseconds:ended-started,bytes:blob.size,contextState:context.state,data};
   chunks=[];return facts;
  }
 };
})();'''


def install(page):
    page.add_init_script(HOOK)


def start(page):
    return page.evaluate('()=>window.__FirstlightCanvasFilm.start()')


def finish(page, path):
    result = page.evaluate('()=>window.__FirstlightCanvasFilm.stop()')
    encoded = result.pop('data')
    prefix, payload = encoded.rsplit(';base64,', 1)
    if not prefix.startswith('data:video/webm;'):
        raise ValueError('Unexpected actual recording encoding')
    data = base64.b64decode(payload, validate=True)
    if len(data) != result['bytes'] or not data.startswith(bytes.fromhex('1a45dfa3')):
        raise ValueError('Recorded WebM identity failed')
    path.write_bytes(data)
    return {**result, 'path': str(path), 'sha256': hashlib.sha256(data).hexdigest(),
            'includes_hud': False, 'soundtrack': 'actual opted-in app master',
            'timing': 'one browser MediaRecorder stream with real canvas and real Web Audio'}
