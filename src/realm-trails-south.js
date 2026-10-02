/* Finite Coastward and Bellglass outings. Pure authored terms, never save authority.
 * Recovered design packages supply the civic/landscape premise; these local
 * commissions, coordinates and reward values are original implementation terms.
 */
(function(G){'use strict';
function freeze(value){
 if(value&&typeof value==='object'&&!Object.isFrozen(value)){
  Object.values(value).forEach(freeze);Object.freeze(value);
 }
 return value;
}
const definitions=freeze([
 {
  id:'atlantis-bellglass-chart-v1',realm:'atlantis',
  title:'A Chart With Room for Depth',
  summary:'Sahra needs one visitor chart that distinguishes the old lower road, the modern wet lane and Bellglass’s air court. Read both depth marks, correct the chart in the court, and add a modern marker beside the old masonry.',
  danger:'This job enters the existing bounded gallery. F ascends, G descends, and depth holds when released. The visitor envelope has no breath timer. Bellglass’s doorway and the east wet lane remain the way out; free passage home remains available.',
  giver:{id:'sahra',name:'Sahra · instrument-maker',x:-5,z:-10},
  reward:{xp:30,coins:12,ore:2},
  completionText:'“There. A traveler can see the depth before choosing the lane. The older mark keeps its place, and the new one says what is safe today.” Sahra keeps the corrected visitor chart. This small commission does not settle the missing cargo or the harbour’s disputed receipts.',
  steps:[
   {id:'upper-gauge',name:'Read the upper visitor gauge',kind:'interact',x:8,z:-22,y:-1.05,medium:'water',requires:[],optional:false,
    text:'The bronze gauge labels a shallower visitor depth. Read it from the water at this level; the public deck overhead is a separate road. Sahra’s instrument records this first depth without taking any material.'},
   {id:'lower-masonry',name:'Compare the old lower-road mark',kind:'interact',x:8,z:-28,y:-2.55,medium:'water',requires:[],optional:false,
    text:'Descend to the older worked-stone mark. Its lower depth differs from the visitor gauge. The old address is still useful history: copy the mark, leave the masonry intact, and carry both readings to Bellglass.'},
   {id:'depth-chart',name:'Correct the chart in the Bellglass air court',kind:'interact',x:8,z:-35,y:-2.7,medium:'court',requires:['upper-gauge','lower-masonry'],optional:false,
    text:'The two readings cannot share one flat route line. At the dry court desk, choose a chart that names both depth layers, marks their connection and shows the court’s doorway. You can correct a mistaken choice without spending supplies.',
    choices:[
     {id:'one-flat-line',label:'Draw one flat line through every marker',text:'The marks have different measured depths. One flat line hides the change and makes the court look like part of the wet lane. Keep the readings and try another chart.'},
     {id:'depth-layers',label:'Show two depth layers, their connection and the air-court doorway',text:'The chart distinguishes the shallower visitor gauge, the lower old road and the dry court. It also marks the east wet lane to the far landing. These lines describe the actual bounded passage.'},
     {id:'erase-old-road',label:'Erase the old mark and draw only the modern lane',text:'The modern lane needs a clear marker, but the old address is still evidence. Add the present safe route without deleting the lower-road record. No supplies are spent by this choice.'}
    ],correctChoice:'depth-layers'},
   {id:'modern-marker',name:'Fit the modern landing marker',kind:'interact',x:12,z:-38.4,y:-1.4,medium:'water',requires:['depth-chart'],optional:false,
    text:'Leave through Bellglass’s open doorway, follow the wet east lane, and place the new marker beside the far landing. It names today’s visitor route; the old lower-road mark remains. Return to Sahra on the dry civic road to claim the declared payment.'}
  ]
 },
 {
  id:'earthlands-coastward-materials-v1',realm:'earthlands',
  title:'Wood, Reed and a Road Home',
  summary:'Vessa offers one supply commission across Coastward’s coppice and shore spurs. Prepare a fallen bough, a small reed bundle and loose shore stone, then pack the job supplies beside the bridge. The paid bundle uses existing crafting materials.',
  danger:'The coppice has one territorial skitter farther south. The northern lip of the spur gives a clear approach to the fallen bough. No fight is required. Stay on the supported road and shore overlook; this outing adds no Earth swimming, boats or harvesting of standing trees.',
  giver:{id:'vessa',name:'Vessa · bridge keeper',x:-7,z:97},
  reward:{xp:25,coins:10,ore:0,materials:{wood:6,fiber:4,stone:2}},
  completionText:'“Sound bough, tied reeds, loose stone. You brought back useful things without taking the shelter trees.” Vessa releases the six timber, four meadow fibre and two stone from this one commission. They can supply an ashwood trail bow at an existing workbench, or another existing recipe you choose. The road and bridge stay open.',
  steps:[
   {id:'fallen-bough',name:'Prepare the fallen coppice bough',kind:'interact',x:-25,z:-11,y:1.57,medium:'dry',requires:[],optional:false,
    text:'Follow the north side of the coppice spur to the loose fallen bough. Trim and tie the sound pieces for Vessa’s order. The standing woodland trees and the existing homestead resource nodes are untouched; these pieces belong to the accepted job until its claim.'},
   {id:'shore-reeds',name:'Tie the shore reed bundle',kind:'interact',x:28,z:-16,y:1.57,medium:'dry',requires:[],optional:false,
    text:'On the supported shore overlook, gather the marked cut reeds and tie them above the damp ground. Keep the living bank cover in place. This finite bundle is an ordinary meadow-fibre supply, not a new currency or an unlimited harvest.'},
   {id:'shore-stone',name:'Sort the loose shore stone',kind:'interact',x:30,z:-25,y:1.57,medium:'dry',requires:[],optional:false,
    text:'Sort the small loose stones from the marked dry stack. Leave the overlook foundation where it is. These two pieces are for Vessa’s order; Darric’s reserved public stone, the quarry story and all earlier payouts keep their separate ownership.'},
   {id:'road-pack',name:'Pack the three supplies by the bridge',kind:'interact',x:-3,z:97,y:1.57,medium:'dry',requires:['fallen-bough','shore-reeds','shore-stone'],optional:false,
    text:'Return by the east woodland road and the physical timber bridge. Tie the three prepared supplies into one load at the arrival bank, then speak to Vessa nearby. Packing records the completed job; the declared materials enter your ordinary inventory only when its once-only claim succeeds.'}
  ]
 }
]);
const api={definitions};G.RealmTrailsSouth=api;
if(typeof module!=='undefined')module.exports=api;
})(globalThis);
