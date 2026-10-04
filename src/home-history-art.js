/* Original home-piece geometry. The caller owns slot transforms and batches;
 * visual parts never mutate inventory, progress or ownership. */
(function(G){'use strict';
function draw(kind,at){
 const b=(x,y,z,w,h,d,c,opt={})=>at('box',x,y,z,w,h,d,c,{rough:.73,...opt,homeMemoryKind:kind});
 const a=(shape,x,y,z,w,h,d,c,opt={})=>at(shape,x,y,z,w,h,d,c,{rough:.6,...opt,homeMemoryKind:kind});
 if(kind==='memory-crossing'){
  for(const x of[-.37,.37])b(x,2.02,0,.075,.88,.48,0x7e7056);b(0,2.57,0,.92,.64,.085,0xa68d68);b(0,2.58,.054,.76,.48,.035,0xdfd1aa);
  for(let i=0;i<6;i++)b(-.28+i*.1,2.58+Math.sin(i*.9)*.14,.079,.13,.04,.016,0x719488,{r:[0,0,Math.cos(i*.9)*.25]});for(const x of[-.035,.035])b(x,2.56,.091,.025,.27,.016,0x81694c);
 }else if(kind==='memory-cuttings'){
  b(0,1.65,0,1.14,.12,.66,0x967b54);b(0,1.72,0,.96,.07,.48,0x514c38);
  for(const x of[-.54,.54])b(x,1.79,0,.06,.24,.66,0xc2a67a);for(const z of[-.3,.3])b(0,1.79,z,1.14,.24,.06,0xc2a67a);
  for(const x of[-.3,0,.3]){b(x,1.76,0,.045,.08,.55,0xcdbb8c);a('cylinder',x,1.89,0,.038,.31,.038,0x5e7950);a('round',x-.055,1.96,.015,.2,.11,.13,0x91b77a,{r:[0,0,.45]});a('round',x+.055,2.03,-.015,.18,.1,.13,0xb4c99c,{r:[0,0,-.4]});}
 }else if(kind==='memory-refuge'){
  a('cylinder',0,1.67,0,.56,.23,.56,0x7b7c70);a('cylinder',0,1.84,0,.4,.14,.4,0xa36f4f);b(0,2.02,0,.18,.26,.18,0xe2ad67,{em:.7});
  for(const x of[-.24,.24])b(x,2.04,0,.035,.47,.035,0x685c4c);b(0,2.27,0,.5,.06,.12,0x685c4c);
  for(const x of[-.21,.21])b(x,2.44,0,.05,.31,.055,0xb3936a);b(0,2.58,0,.45,.06,.065,0xb3936a);
 }else if(kind==='memory-bellglass'){
  a('cylinder',0,1.65,0,.55,.17,.55,0xa27e59);a('cylinder',0,2.01,0,.11,.62,.11,0x876b50);
  a('cylinder',0,2.39,0,.34,.13,.34,0xb39167);a('octa',0,2.69,.035,.24,.48,.24,0x8ed7d4,{em:.6,rough:.18});
  for(const x of[-.19,.19])b(x,2.69,-.03,.045,.58,.06,0xbd996f);a('cone',0,3,0,.6,.23,.6,0x557d7b);b(0,2.74,-.16,.39,.35,.055,0x557d7b);
 }else if(kind==='memory-farroad'){
  for(const x of[-.47,.47]){b(x,1.99,0,.08,.84,.6,0x7e725c);b(x,2.27,.05,.075,.5,.075,0xae9771,{r:[-.5,0,0]});}
  b(0,2.44,0,1.15,.09,.72,0xba9d73,{r:[-.16,0,0]});b(0,2.53,0,.73,.04,.5,0xdfd2ae,{r:[-.16,0,0]});
  b(0,2.56,.02,.04,.045,.51,0x8f7bab,{r:[-.16,0,0]});for(const z of[-.08,.05,.17])b(.17,2.575,z,.22,.012,.018,0x9d8f7b);a('octa',-.4,2.59,-.15,.11,.15,.11,0xb9a5d7,{em:.08});
 }else return false;return true;
}
const api={draw};G.RealmHomeHistoryArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
