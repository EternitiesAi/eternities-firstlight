/* Frame saves for the night's set piece. Both come from the crossing journey's earned chapter-IV save and pass the real
 * validators before they are written: the lit crossing (the night has begun, Briar has not yet found the device) and the
 * quiet after the bite (every traveller across, the device broken, Briar taken as the saga writes it). */
'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const C=require('../src/core.js');
const out=process.argv[2];if(!out)throw Error('usage: night_frames_save.cjs <folder>');
fs.mkdirSync(out,{recursive:true});
const chapter=fs.mkdtempSync(path.join(os.tmpdir(),'night-frames-'));
require('../tests/crossing_journey.cjs').journey({out:chapter});
const base=JSON.parse(fs.readFileSync(path.join(chapter,'CHAPTER_IV_COMPLETE_EARNED.json'),'utf8'));
const lit=JSON.parse(JSON.stringify(base));
lit.night={version:1,started:true,safe:[],device:'hidden',envoy:false};
const quiet=JSON.parse(JSON.stringify(base));
quiet.night={version:1,started:true,safe:['tessa','hob','marl','ennis','pip'],device:'broken',envoy:false};
quiet.saga.beats.night={day:quiet.day};
quiet.saga.briar={state:'taken',habit:quiet.saga.briar.habit,takenDay:quiet.day};
for(const[name,save]of[['night-lit',lit],['night-quiet',quiet]]){C.validate(save);fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(save));}
console.log(JSON.stringify({saves:['night-lit.json','night-quiet.json']}));
