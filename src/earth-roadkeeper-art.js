/* Ordinary civilian primitives. Geometry carries no cargo or gameplay power. */
(function(G){'use strict';
const E=G.RealmEngine,O=G.RealmEarthRoadkeeperMotion;if(!E?.M||!O)throw Error('Load Engine and Roadkeeper Motion before Roadkeeper Art.');
const KINDS=['box','round','octa'],PALETTE=Object.freeze({coat:0x6d7770,shirt:0xc1b79a,skin:0xb79b80,boots:0x3f433d,cap:0x536064,
 signed:0x749268,cleared:0xb19a69,leather:0x75624b,wood:0x8e7955});
function shape(pose){
 if(!pose||!['x','z','base','yaw','gait'].every(k=>Number.isFinite(pose[k]))||!['signed-loop','cleared-pocket'].includes(pose.resolution))throw TypeError('Use a bounded canonical roadkeeper pose.');
 const root=E.M.compose(pose.x,pose.base,pose.z,1,1,1,0,pose.yaw,0),out=[],quiet=pose.reducedMotion||pose.paused||!!pose.suspended;
 const emit=(kind,p,s,c,part,rotation=[0,0,0])=>out.push({kind,p:E.M.transform(root,p),s:s.slice(),m:E.M.mul(root,E.M.compose(...p,...s,...rotation)),
  c:E.hex(c),rough:.97,cameraSolid:false,cutaway:false,appearanceOnly:true,roadkeeperActor:O.ID,roadkeeperPart:part,roadkeeperResolution:pose.resolution});
 const stride=pose.walking&&!quiet?Math.sin(pose.gait)*.12:0,lift=pose.walking&&!quiet?Math.abs(Math.cos(pose.gait))*.025:0;
 emit('box',[0,.98,0],[.48,.64,.28],PALETTE.coat,'work-coat');
 emit('box',[0,1.24,.151],[.16,.23,.018],PALETTE.shirt,'shirt-front');
 emit('box',[0,.91,.157],[.44,.10,.025],pose.resolution==='signed-loop'?PALETTE.signed:PALETTE.cleared,'chosen-account-band');
 emit('round',[0,1.53,0],[.26,.33,.25],PALETTE.skin,'head');
 emit('box',[0,1.72,-.012],[.32,.11,.29],PALETTE.cap,'soft-work-cap');
 emit('box',[0,1.687,.12],[.34,.035,.16],PALETTE.cap,'cap-brim');
 emit('round',[0,1.515,.132],[.075,.075,.09],PALETTE.skin,'nose');
 for(const side of[-1,1]){
  const id=side<0?'left':'right',step=side*stride;
  emit('box',[side*.135,.45,step*.4],[.15,.63,.17],PALETTE.coat,id+'-trouser',[step*.8,0,0]);
  emit('box',[side*.135,.09+lift,step+.04],[.18,.18,.27],PALETTE.boots,id+'-boot');
  emit('box',[side*.30,1.02,-step*.35],[.14,.49,.16],PALETTE.coat,id+'-sleeve',[-step*.7,0,side*-.10]);
  emit('round',[side*.31,.755,-step*.35],[.12,.14,.13],PALETTE.skin,id+'-hand');
 }
 emit('box',[-.275,.78,-.035],[.15,.25,.22],PALETTE.leather,'small-tool-pouch');
 emit('box',[-.28,.865,.085],[.11,.035,.018],PALETTE.shirt,'pouch-fastener');
 emit('box',[.30,.66,.05],[.035,.32,.035],PALETTE.wood,'plain-handled-tool');
 emit('box',[.30,.84,.05],[.07,.08,.04],PALETTE.cap,'small-tool-head');
 if(out.length>24)throw RangeError('Roadkeeper primitive budget exceeded.');return out;
}
function draw(out,view,ctx){
 if(!out||!KINDS.every(k=>Array.isArray(out[k])&&Object.isExtensible(out[k])&&Object.getOwnPropertyDescriptor(out[k],'length').writable))throw TypeError('Use actual writable primitive output arrays.');
 if(!O.isProjection(view,ctx)||view.hidden)return 0;
 const parts=shape(view);for(const {kind,...item}of parts)out[kind].push(item);return parts.length;
}
const api=Object.freeze({PALETTE,shape,draw});G.RealmEarthRoadkeeperArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
