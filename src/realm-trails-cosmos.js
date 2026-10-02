/* A finite Near Expanse comparator commission. Pure authored terms, not save
 * authority or an astronomical model. The fixed image and crown are existing
 * submitted art anchors; their local XZ separation supplies the dial readings.
 */
(function(G){'use strict';
function freeze(value){
 if(value&&typeof value==='object'&&!Object.isFrozen(value)){
  Object.values(value).forEach(freeze);Object.freeze(value);
 }
 return value;
}
const targets=[{x:-52,z:-110},{x:3,z:-49}];
function separation(x,z){
 const a=Math.atan2(targets[0].x-x,targets[0].z-z);
 const b=Math.atan2(targets[1].x-x,targets[1].z-z);
 return Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)))*180/Math.PI;
}
function instrument(x,z){
 return {min:0,max:90,target:separation(x,z),tolerance:2,initial:45,
  targetLabels:['fixed sky image','observatory crown'],
  targets:targets.map(p=>({...p}))};
}
const definitions=freeze([
 {
  id:'cosmos-split-bearing-v1',realm:'cosmos',
  title:'Two Stations, One Honest Bearing',
  summary:'Teren needs a comparator scale that names the observer’s station. Adjust a real sight frame on each road, compare the fixed sky image with the observatory crown, then fit the two accepted readings at the service arm. Return to Three Lamps for one declared payment.',
  danger:'Both sight stations and the service arm stand on the existing dry roads. Walk around the central ridge and visible cover; the sky image supplies a view, not ground or a road. There is no timed alignment, telescope journey or requirement to leave the Near Expanse.',
  giver:{id:'lamps',name:'Teren · route keeper',x:3,z:7},
  reward:{xp:25,coins:10,ore:2},
  completionText:'“Two stations, two readings, and both named. That is a scale another traveler can use.” Teren pays for this local comparator fitting once. The image’s changed relation to the crown is recorded; its distance, origin and any road beyond it remain unknown.',
  steps:[
   {id:'west-sight',name:'Align the west-road comparator',kind:'interact',x:-14,z:-28,y:4.343333333333334,medium:'dry',requires:[],optional:false,
    text:'Stand at the west sight frame and turn its comparator scale. The two arms refer to the fixed sky image’s centre and the observatory crown’s axis. Match their local horizontal separation within two scale degrees, then record the setting. A mismatched setting keeps the job open and spends nothing.',
    instrument:instrument(-14,-28)},
   {id:'east-sight',name:'Align the east-road comparator',kind:'interact',x:14,z:-28,y:4.343333333333334,medium:'dry',requires:[],optional:false,
    text:'Reach the east sight frame by the supported road and Common Landing. Adjust this scale from the new station: the same authored image and crown have a different local separation here. Match the two arms within two scale degrees and record this station’s reading. The first reading does not stand in for the second.',
    instrument:instrument(14,-28)},
   {id:'service-arm',name:'Fit both readings at the observatory service arm',kind:'interact',x:-1,z:-43,y:4.77,medium:'dry',requires:['west-sight','east-sight'],optional:false,
    text:'At the open service arm beside the observatory, fit the two accepted station scales to one comparator chart. Keep the station names beside their readings. This is a local view comparison, not a measurement of astronomical distance or proof of a sky road. Return down either grounded approach to Teren at Three Lamps for the declared once-only payment.'}
  ]
 }
]);
const api={definitions};G.RealmTrailsCosmos=api;
if(typeof module!=='undefined')module.exports=api;
})(globalThis);
