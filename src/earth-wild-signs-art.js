/* Staged static field marks. Canonical recorded facts select appearance only;
 * no collision, camera obstacle, actor, resource, proof or save authority. */
(function(G){'use strict';
const D=G.RealmEarthWildSignsData,E=G.RealmEngine,W=G.RealmWorldFoundations;
if(!D||!E?.M||!W)throw Error('Load canonical WildSigns Data, Engine and WorldFoundations before field-mark art.');
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
const LAYOUT=freeze({floor:1.57,
 gouge:{id:'timber-gouge',x:D.evidence[0].x-1.2,z:D.evidence[0].z,yaw:.12},
 feeding:{id:'feeding-track',x:D.evidence[1].x-1.2,z:D.evidence[1].z,yaw:-.18},
 scrape:{id:'pest-scrape',x:D.evidence[2].x-1.3,z:D.evidence[2].z-.35,yaw:.26},
 signs:[{id:'north',x:D.bypass[0].x+1.2,z:D.bypass[0].z-1.1,from:D.bypass[0],to:D.bypass[1]},
  {id:'south',x:D.bypass.at(-1).x+2,z:D.bypass.at(-1).z,from:D.bypass.at(-1),to:D.bypass.at(-2)}],
 notice:{x:D.giver.x+1.4,z:D.giver.z+.45}});
const PALETTE=freeze({wood:0xb3a079,cut:0x423c33,fresh:0xd6c39a,soil:0x554d3c,hoof:0x3e4637,
 earth:0x88785a,tab:0xd9d0b3,ink:0x3c5148,route:0x668b70,arrow:0xe1d1a0,stone:0x787c70});
const KEYS=['box','round','octa'];
function record(sim){try{return sim?.room===D.ROOM&&!sim.worldDive&&sim.state?.adventure?.started===true&&
 Object.hasOwn(sim.state,'earthWildSigns')?D.crossValidate(sim.state.earthWildSigns,sim.state):null;}catch{return null;}}
function parts(sim){
 const r=record(sim);if(!r?.accepted)return[];const out=[];
 const emit=(kind,frame,p,s,c,role,extra={})=>{
  out.push({kind,p:E.M.transform(frame,p),s:s.slice(),m:E.M.mul(frame,E.M.compose(...p,...s)),c:E.hex(c),rough:.98,
   appearanceOnly:true,cameraSolid:false,cutaway:false,wildSignsPart:role,wildSignsQuest:D.ID,...extra});
 };
 const root=p=>E.M.compose(p.x,W.height(D.ROOM,p.x,p.z),p.z,1,1,1,0,p.yaw||0,0);
 const tab=(p,frame)=>{if(r.evidence.includes(p.id)){
  emit('box',frame,[.30,.011,.36],[.18,.022,.12],PALETTE.tab,'recorded-field-tab',{wildSignsEvidence:p.id});
  emit('box',frame,[.30,.0255,.36],[.09,.007,.023],PALETTE.ink,'recorded-tab-stroke',{wildSignsEvidence:p.id});
 }};
 // Abandoned roadside timber, not one of the installed supplied sections.
 // Split top pieces leave one genuinely recessed narrow cut across the grain.
 const g=LAYOUT.gouge,gm=root(g),ge={wildSignsEvidence:g.id};
 emit('box',gm,[0,.03,0],[.32,.06,1.20],PALETTE.wood,'abandoned-timber-bed',ge);
 for(const side of[-1,1])emit('box',gm,[0,.105,side*.3225],[.32,.09,.555],PALETTE.wood,'gouged-timber-face',ge);
 emit('box',gm,[0,.063,0],[.30,.006,.074],PALETTE.cut,'narrow-recessed-gouge',ge);
 for(const side of[-1,1])emit('octa',gm,[side*.25,.030,side*.07],[.095,.044,.11],PALETTE.fresh,'fresh-timber-chip',ge);
 tab(g,gm);
 // Three paired broad cloven prints; different footprint from the narrow scrape.
 const f=LAYOUT.feeding,fm=root(f),fe={wildSignsEvidence:f.id};
 for(let step=0;step<3;step++)for(const side of[-1,1]){
  const x=side*.095+(step%2?.035:0),z=(step-1)*.37;
  emit('round',fm,[x,.015,z],[.13,.025,.25],PALETTE.hoof,'broad-cloven-feeding-print',{...fe,wildSignsPrint:step});
 }
 for(const side of[-1,1])emit('box',fm,[side*.29,.021,.08],[.13,.015,.38],PALETTE.earth,'disturbed-feeding-soil',fe);
 tab(f,fm);
 // A small linear furrow and low spoil mound, no creature or fake defeat.
 const s=LAYOUT.scrape,sm=root(s),se={wildSignsEvidence:s.id};
 for(const side of[-1,1])emit('box',sm,[side*.047,.016,0],[.043,.022,.62],PALETTE.soil,'narrow-burrowing-furrow',se);
 emit('round',sm,[0,.044,-.36],[.28,.075,.22],PALETTE.earth,'burrow-spoil',se);
 for(let i=0;i<2;i++)emit('octa',sm,[i?-.15:.13,.019,-.37+i*.06],[.065,.028,.072],PALETTE.stone,'scrape-pebble',se);
 tab(s,sm);
 // Only the selected response adds two direction pointers at the actual mouths.
 // These are local signs, never an unearned course, safety guarantee or marker.
 if(r.resolution==='signed-loop')for(const sign of LAYOUT.signs){
  const dx=sign.to.x-sign.from.x,dz=sign.to.z-sign.from.z,frame=root({...sign,yaw:-Math.atan2(dz,dx)}),extra={wildSignsSign:sign.id,wildSignsRoute:'signed-loop',wildSignsDirection:[dx,dz]};
  emit('box',frame,[0,.40,0],[.10,.80,.10],PALETTE.wood,'signed-loop-post',extra);
  emit('box',frame,[0,.835,0],[.78,.07,.25],PALETTE.route,'signed-loop-pointer-board',extra);
  emit('box',frame,[-.08,.879,0],[.38,.015,.040],PALETTE.arrow,'signed-loop-arrow-shaft',extra);
  for(const side of[-1,1]){
   const local=E.M.mul(frame,E.M.compose(.18,.879,side*.057,1,1,1,0,side*.62,0));
   emit('box',local,[0,0,0],[.20,.015,.040],PALETTE.arrow,'signed-loop-arrow-tip',extra);
  }
 }
 // A small retained ground account beside existing Sela, only after actual claim.
 if(r.claimed){const frame=root(LAYOUT.notice);
  emit('box',frame,[0,.035,0],[.78,.07,.60],PALETTE.stone,'sela-retained-account-stone');
  emit('box',frame,[0,.0775,0],[.48,.015,.32],PALETTE.tab,'sela-retained-account-page');
  for(let i=0;i<3;i++)emit('box',frame,[-.04,.090,(i-1)*.065],[.21,.008,.016],PALETTE.ink,'sela-recorded-account-line');
  emit('octa',frame,[.16,.093,.105],[.085,.017,.075],PALETTE.route,'sela-paid-account-seal');
 }
 if(out.length>48)throw RangeError('Field-mark presentation budget exceeded.');
 return out;
}
function draw(out,sim){
 if(!out||!KEYS.every(k=>Array.isArray(out[k])&&Object.isExtensible(out[k])&&Object.getOwnPropertyDescriptor(out[k],'length').writable))throw TypeError('Use actual writable box/round/octa primitive arrays.');
 const ps=parts(sim);for(const {kind,...item}of ps)out[kind].push(item);return ps.length;
}
const api=Object.freeze({LAYOUT,PALETTE,parts,draw});G.RealmEarthWildSignsArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
