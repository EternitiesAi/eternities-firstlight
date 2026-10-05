/* Original portable claim apparatus. Appearance owns no ground or progress. */
(function(G){'use strict';
const H=()=>G.RealmEarthHomecoming,D=()=>H().definition,C={ash:0x252f35,slate:0x314048,gold:0xd8b879,paper:0xd6dddc,checked:0xaec0b3,claim:0xb98474},TAU=Math.PI*2,finite=(...xs)=>xs.every(Number.isFinite);
// Existing Firstlight worktable: world.js table centerY2.05, height.16.
// The right table's tool stack ends at z8.305; its front edge is z8.8.
// The record's full plate fits in that clear front portion; no new support.
const HOME_ACCOUNT=Object.freeze({x:12.5,z:8.55,base:2.05+.16/2});
const q=sim=>sim?.state?.earthHomecoming;
function paint(out,sim,p,yaw=0,tags={},base=G.RealmWorldFoundations.height(sim.room,p.x,p.z)){const M=G.RealmEngine.M,root=M.compose(p.x,base,p.z,1,1,1,0,yaw,0);
 const emit=(kind,pos,size,c,part,opt={})=>out[kind].push({p:M.transform(root,pos),s:size.slice(),m:M.mul(root,M.compose(...pos,...size,...(opt.r||[0,0,0]))),c,rough:.82,appearanceOnly:true,cameraSolid:false,cutaway:false,earthHomecomingPart:part,...tags,...opt});
 return{root,base,emit,box:(x,y,z,w,h,d,c,part,opt)=>emit('box',[x,y,z],[w,h,d],c,part,opt)};
}
function body(out,sim,e){const p=paint(out,sim,e,e.yaw||0,{earthHomecomingActor:e.id}),hot=e.mode==='windup',light=hot?C.gold:C.claim;
 p.box(0,.055,0,.88,.11,.64,C.ash,'regent-grounded-sole');
 for(const x of[-.23,.23]){p.box(x,.16,.015,.24,.21,.34,C.slate,'regent-grounded-boot');p.box(x,.41,0,.16,.40,.21,C.ash,'regent-connected-leg');}
 p.box(0,.67,0,.64,.20,.36,C.slate,'regent-hip-brace');p.box(0,.98,0,.59,.48,.32,C.ash,'regent-connected-torso');
 for(const x of[-.36,.36]){p.box(x,.93,-.02,.20,.68,.27,C.slate,'regent-mantle-fold');p.box(x,1.27,0,.32,.14,.32,C.gold,'regent-shoulder-seam');p.box(x,1.12,.08,.09,.31,.13,C.ash,'regent-connected-arm');}
 p.box(0,1.29,0,.76,.10,.30,C.slate,'regent-mantle-yoke');p.box(0,1.43,0,.13,.24,.16,C.gold,'regent-neck-link');
 p.box(0,1.64,0,.40,.34,.27,C.ash,'regent-split-face');p.box(0,1.68,.15,.23,.035,.035,light,'regent-seizure-window',{em:hot ? .22 : 0});
 p.box(0,1.83,0,.56,.10,.27,C.gold,'regent-crown-bridge');for(const x of[-.21,.21])p.box(x,2.01,0,.095,.32,.16,C.gold,'regent-split-crown');
 p.emit('octa',[0,1.06,.21],[.21,.22,.085],light,'regent-held-claim');p.box(0,.85,.20,.38,.08,.05,C.paper,'regent-claim-inscription');return p;
}
function stroke(p,x,z,length,width,yaw,part){if(!finite(x,z,length,width,yaw)||length<=0||width<=0)return;
 p.box(x,.145,z,width,.035,length,C.ash,part+'-border',{r:[0,yaw,0]});p.box(x,.169,z,width*.34,.014,length*.995,C.gold,part+'-inlay',{r:[0,yaw,0],em:.24});
}
function rectangle(p,s){if(!finite(s.length,s.halfWidth)||s.length<=0||s.halfWidth<=0)return;const edge=Math.min(.055,s.length*.25,s.halfWidth*.2),width=s.halfWidth*2;
 for(const x of[-s.halfWidth+edge/2,s.halfWidth-edge/2])stroke(p,x,s.length/2,s.length,edge,0,'locked-lane-side');
 for(const z of[edge/2,s.length-edge/2])stroke(p,0,z,width,edge,Math.PI/2,'locked-lane-cap');
}
function rim(p,radius,inner,part){if(!finite(radius)||radius<=0)return;const width=Math.min(.055,radius*.08),r=radius+(inner?width*1.1:-width*1.1),n=48;
 for(let i=0;i<n;i++){const a=i/n*TAU,b=(i+1)/n*TAU,x1=Math.sin(a)*r,z1=Math.cos(a)*r,x2=Math.sin(b)*r,z2=Math.cos(b)*r;stroke(p,(x1+x2)/2,(z1+z2)/2,Math.hypot(x2-x1,z2-z1),width,Math.atan2(x2-x1,z2-z1),part);}
}
function warning(out,sim,e){const s=e.strike;if(!s||!finite(s.x,s.z,s.yaw))return;
 const p=paint(out,sim,s,s.yaw,{earthHomecomingActor:e.id,earthHomecomingTelegraph:true,earthHomecomingPattern:s.pattern,earthHomecomingStrike:JSON.parse(JSON.stringify(s))});
 if(s.kind==='line')rectangle(p,s);else if(s.kind==='annulus'&&finite(s.innerRadius,s.outerRadius)&&s.innerRadius>0&&s.outerRadius>s.innerRadius){rim(p,s.innerRadius,true,'quiet-inner-rim');rim(p,s.outerRadius,false,'danger-outer-rim');}
}
function drawEnemy(out,sim,e){const d=D(),r=q(sim);if(sim.room!==d.room||!r?.accepted||e?.earthHomecoming!==d.id||e.id!==d.enemy.id||!H().owned(sim,e)||!finite(e.x,e.z,e.hp)||e.hp<=0)return false;
 const p=body(out,sim,e);if(e.mode==='windup')warning(out,sim,e);return{actor:e.id,x:e.x,z:e.z,yaw:e.yaw||0,base:p.base,root:Array.from(p.root),mode:e.mode};
}
function relay(out,sim,s,done){const p=paint(out,sim,s,0,{earthHomecomingFixture:s.id,earthHomecomingRecorded:done});p.box(0,.035,0,.50,.07,.43,C.slate,'supplied-relay-plate');
 for(const x of[-.18,.18])p.box(x,.30,0,.065,.49,.07,C.gold,'open-relay-upright');p.box(0,.55,0,.42,.06,.08,C.gold,'open-relay-crosshead');p.box(0,.34,.045,.23,.19,.035,done?C.checked:C.claim,'isolated-relay-tab');p.box(done ? .27 : .12,.17,.02,.13,.06,.075,C.paper,'disconnected-relay-plug');
 const end=D().enemy,dx=end.x-s.x,dz=end.z-s.z,gap=done ? .45 : 0,length=Math.hypot(dx,dz)-gap,yaw=Math.atan2(dx,dz),mid={x:s.x+Math.sin(yaw)*(gap+length/2),z:s.z+Math.cos(yaw)*(gap+length/2)},cable=paint(out,sim,mid,yaw,{earthHomecomingFixture:s.id,earthHomecomingRecorded:done});cable.box(0,.028,0,.025,.025,length,done?C.ash:C.gold,'laid-claim-cable');
}
function screen(out,sim,fitted){const s=D().steps.find(p=>p.id==='supplied-screen'),p=paint(out,sim,s,0,{earthHomecomingFixture:s.id,earthHomecomingRecorded:fitted});p.box(0,.035,0,.45,.07,.35,C.slate,'supplied-signal-kit');
 if(fitted){for(const x of[-.17,.17])p.box(x,.40,0,.045,.73,.045,C.gold,'open-signal-support');p.box(0,.78,0,.39,.06,.055,C.gold,'fitted-warning-signal');for(const x of[-.11,0,.11])p.box(x,.51,0,.045,.34,.025,C.paper,'warning-signal-slat');}
 else p.box(0,.10,0,.34,.06,.25,C.paper,'folded-warning-signal');
}
function trace(out,sim,choice,home=false){const anchor=home?HOME_ACCOUNT:{x:D().enemy.x,z:D().enemy.z+1.2};
 // A record resting on the existing table is a prop, not an actor standing here.
 // Actual physical home-return is required by draw(); table support is fixed.
 const p=paint(out,sim,anchor,0,{earthHomecomingChoice:choice,earthHomecomingTrace:home?'home':'road'},home?HOME_ACCOUNT.base:undefined),k=home ? .62 : 1;
 p.box(0,.035,0,.63*k,.07,.49*k,C.slate,'independent-account-plate');
 if(choice==='public-watch'){p.box(0,.20*k,0,.045,.33*k,.055,C.gold,'public-watch-record-post');p.box(0,.33*k,.045,.48*k,.18*k,.025,C.paper,'public-checked-record');p.box(-.20*k,.075,.14*k,.09*k,.05,.09*k,C.checked,'open-watch-mark');}
 else if(choice==='reviewed-custody'){p.box(0,.16*k,0,.44*k,.23*k,.32*k,C.ash,'detached-core-cover');p.box(0,.285*k,0,.49*k,.035,.36*k,C.gold,'reviewed-custody-seal');p.box(0,.18*k,.17*k,.21*k,.09*k,.025,C.paper,'bounded-evidence-label');}
}
function draw(out,sim){const d=D(),r=q(sim);if(!r?.accepted)return;
 if(sim.room===null){if(r.steps.includes('home-return')&&r.steps.includes('aftermath')&&d.choices.some(c=>c.id===r.choice))trace(out,sim,r.choice,true);return;}
 if(sim.room!==d.room||sim.worldDive)return;
 for(const id of['west-relay-isolated','east-relay-isolated'])relay(out,sim,d.steps.find(p=>p.id===id),r.steps.includes(id));screen(out,sim,r.steps.includes('supplied-screen'));
 const p=paint(out,sim,d.enemy,0,{earthHomecomingFixture:'portable-claim',earthHomecomingRecorded:r.steps.includes('passage-secured')});p.box(0,.025,0,.78,.05,.54,C.slate,'portable-claim-footplate');p.box(0,.061,0,.50,.022,.30,r.steps.includes('passage-secured')?C.checked:C.claim,'portable-claim-record');
 if(r.steps.includes('passage-secured')){p.box(0,.09,-.27,.65,.055,.04,C.checked,'independent-restraint');}
 if(r.steps.includes('aftermath')&&d.choices.some(c=>c.id===r.choice))trace(out,sim,r.choice);
}
const api={draw,drawEnemy};G.RealmEarthHomecomingArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
