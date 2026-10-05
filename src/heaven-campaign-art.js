/* Original Garden fittings and apparatus. Rules own ground, damage, the
 * courier and activation; this module only projects their accepted facts. */
(function(G){'use strict';
const FLOOR=1.57,TAU=Math.PI*2,ACTIVATION_DURATION=1.2;
const colors={bone:0xe6dcc2,gold:0xbd9655,ruby:0x8f294a,ink:0x35465e,sage:0x86b2a0,pale:0xc5d8ce,beam:0xecb87f,pulse:0xcf99c8,warningInk:0x352839};
const clamp=n=>Math.max(0,Math.min(1,n)),finite=(...v)=>v.every(Number.isFinite);
function definition(){const h=G.RealmHeavenCampaign;return typeof h?.definition==='function'?h.definition():h?.definition||G.RealmHeavenCampaignData?.definition;}
function painter(out,sim,anchor,yaw=0,extra={}){
 const M=G.RealmEngine.M,root=M.compose(anchor.x,FLOOR,anchor.z,1,1,1,0,yaw,0),r=sim.state.heavenCampaign;
 const emit=(kind,p,s,c,part,opt={})=>{const m=M.mul(root,M.compose(...p,...s,...(opt.r||[0,0,0])));out[kind].push({p:M.transform(root,p),s:s.slice(),m,c,rough:.86,cameraSolid:false,cutaway:false,appearanceOnly:true,heavenCampaignPart:part,heavenCampaignChoice:r.choice,...extra,...opt});};
 return{root,emit,box:(x,y,z,w,h,d,c,part,opt)=>emit('box',[x,y,z],[w,h,d],c,part,opt)};
}
function recordStand(out,sim,anchor,fixture,part){const{box}=painter(out,sim,anchor,0,{heavenCampaignFixture:fixture});
 box(0,.33,0,.64,.66,.43,colors.ink,'record-stand');box(0,.68,0,.68,.045,.47,colors.bone,part);
 for(let i=0;i<3;i++)box(0,.71,-.13+i*.13,.44,.014,.024,i===1?colors.ruby:colors.gold,'compared-account-line');
}
function activationStroke(sim,choice){
 const activation=G.RealmHeavenCampaign?.runtime(sim).activation,elapsed=sim.state.adventure.elapsed;
 if(sim.paused||sim.state.settings.reducedMotion||!activation?.active||activation.choice!==choice||!finite(activation.at,elapsed))return 0;
 const age=elapsed-activation.at;return age>0&&age<ACTIVATION_DURATION?Math.sin(Math.PI*age/ACTIVATION_DURATION):0;
}
function welcome(out,sim,anchor){const r=sim.state.heavenCampaign,d=definition(),choice=r.steps.includes('arrangement')&&d.choices.some(c=>c.id===r.choice)?r.choice:null;
 const stroke=choice?activationStroke(sim,choice):0,{box,emit}=painter(out,sim,anchor,0,{heavenCampaignFixture:'arrival-assembly',heavenCampaignActivation:stroke>0});
 // This supplied assembly stands beside the old response/complete return arm.
 // It neither duplicates nor replaces the Broken Choir repair.
 box(0,.12,0,.91,.24,.67,colors.ink,'arrival-plinth');
 for(const x of[-.34,.34])box(x,.71,0,.11,1.08,.32,colors.bone,'arrival-upright');
 box(0,1.22,0,.80,.12,.36,colors.gold,'arrival-crosspiece');
 box(0,.99,0,.56,.13,.25,colors.bone,'retained-ceremonial-rail');
 for(let i=0;i<3;i++)for(const z of[-.147,.147])box(-.18+i*.18,.99,z,.045,.075,.036,colors.ruby,'retained-ceremonial-notch');
 if(choice==='accessible-assist'){
  box(-.14,.60-stroke*.075,0,.36,.09,.38,colors.sage,'lower-assist-lever');
  for(const z of[-.27,.27]){box(-.14,.60-stroke*.075,z,.43,.11,.12,colors.pale,'ordinary-assist-grip');box(.21,.60,z*.74,.20,.27,.055,colors.bone,'request-plate');box(.21,.60,z*.86,.13,.032,.025,colors.ruby,'request-inscription');}
  box(-.14,.39,0,.075,.37,.09,colors.gold,'assist-return-link');
 }else if(choice==='broadened-activation'){
  box(0,.66-stroke*.085,0,.68,.13,.57,colors.sage,'broad-activation-plate');
  for(const z of[-.32,.32]){box(0,.66-stroke*.085,z,.58,.09,.075,colors.pale,'ordinary-press-rim');box(0,.43,z*.62,.42,.15,.045,colors.bone,'open-activation-inscription');box(0,.43,z*.73,.26,.032,.022,colors.ruby,'open-activation-mark');}
  box(0,.40,0,.10,.35,.12,colors.gold,'broad-return-link');
 }else box(0,.52,0,.52,.14,.41,colors.sage,'supplied-arrival-fitting');
 emit('octa',[0,1.39,0],[.22,.20,.22],colors.pale,'arrival-status',{em:.12});
}
function draw(out,sim,time){const d=definition(),r=sim.state.heavenCampaign;if(!d||sim.room!==d.room||!r?.accepted)return;
 const steps=new Set(r.steps),byId=id=>d.steps.find(s=>s.id===id);
 if(steps.has('witness-account')){const s=byId('witness-account');recordStand(out,sim,{x:s.x-.95,z:s.z},'witness-record','preserved-witness-account');}
 if(steps.has('compare-arrival-marks')){const s=byId('compare-arrival-marks');recordStand(out,sim,{x:s.x+1.1,z:s.z},'arrival-marks','compared-arrival-marks');}
 if(steps.has('inspect-false-relay')){
  const s=byId('inspect-false-relay'),{box}=painter(out,sim,{x:s.x+1.1,z:s.z},0,{heavenCampaignFixture:'false-signal-record'});
  box(0,.17,0,.58,.34,.46,colors.ink,'signal-record-base');box(0,.36,0,.49,.04,.37,colors.bone,'false-rescue-account');
  for(const z of[-.1,.1])box(0,.39,z,.35,.025,.028,colors.ruby,'retained-wrong-signal-line');
  const mirror=byId('ground-mirror'),fitted=steps.has('ground-mirror'),p=painter(out,sim,{x:mirror.x+.95,z:mirror.z},0,{heavenCampaignFixture:'ground-mirror',heavenCampaignFitted:fitted});
  p.box(0,.12,0,.71,.24,.56,colors.ink,'mirror-supply-base');
  if(fitted){p.box(0,.63,0,.10,.86,.13,colors.gold,'grounded-mirror-stem');p.box(0,.91,0,.57,.49,.10,colors.bone,'seated-mirror-frame');for(const z of[-.069,.069])p.box(0,.91,z,.43,.34,.03,colors.pale,'grounded-mirror-face');}
  else{p.box(0,.29,0,.57,.10,.41,colors.bone,'supplied-loose-mirror');p.box(0,.351,0,.43,.027,.28,colors.pale,'unseated-mirror-face');}
 }
 if(steps.has('secure-service-route'))for(let i=0;i<d.escort.route.length;i++){
  const q=d.escort.route[i],{box}=painter(out,sim,{x:q.x+.75,z:q.z+.65},0,{heavenCampaignFixture:'service-waymark',heavenCampaignWaypoint:i});
  box(0,.25,0,.065,.50,.09,colors.gold,'supplied-route-post');box(0,.54,0,.31,.11,.15,colors.ink,'supported-loop-waymark');
  for(const z of[-.086,.086])box(.06,.54,z,.11,.045,.018,colors.pale,'loop-direction-inlay');
 }
 if(steps.has('fit-arrival-assist')){const s=byId('fit-arrival-assist');welcome(out,sim,{x:s.x+1.15,z:s.z});}
}
function beamWarning(out,sim,e,strike){if(strike.kind!=='beam'||!finite(strike.x,strike.z,strike.yaw,strike.length,strike.halfWidth)||strike.length<=0||strike.halfWidth<=.04)return;
 const l=Math.min(strike.length,G.RealmHeavenCampaign?.beamLength?.(sim,e)??strike.length);if(!Number.isFinite(l)||l<=0)return;
 const p=painter(out,sim,strike,strike.yaw,{heavenCampaignActor:e.id,heavenCampaignTelegraph:true,heavenCampaignPattern:'beam',heavenCampaignStrike:{...strike}}),w=strike.halfWidth;
 // Two quiet strokes sit above the real paving/inlays. Each stays wholly
 // inside the already clipped locked rectangle, even for very short beams.
 const edge=Math.min(.12,w),cap=Math.min(.12,l),notch=Math.min(.09,l/4);
 for(const x of[-w+edge/2,w-edge/2]){p.box(x,.075,l/2,edge,.025,l,colors.warningInk,'locked-beam-edge');p.box(x,.093,l/2,edge*.38,.02,l,colors.beam,'locked-beam-edge-core',{em:.15});}
 for(const z of new Set([cap/2,l-cap/2])){p.box(0,.075,z,2*w,.025,cap,colors.warningInk,'locked-beam-end');p.box(0,.093,z,Math.max(.015,2*w-.07),.02,cap*.38,colors.beam,'locked-beam-end-core',{em:.15});}
 for(let i=1;i<=3;i++){p.box(0,.075,l*i/4,Math.min(w,.23),.025,notch,colors.warningInk,'directed-beam-notch');p.box(0,.093,l*i/4,Math.min(w,.23)*.55,.02,notch*.55,colors.beam,'directed-beam-notch-core',{em:.15});}
}
function pulseWarning(out,sim,e,strike){if(strike.kind!=='pulse'||!finite(strike.x,strike.z,strike.radius)||strike.radius<=.12)return;
 const N=32,r=strike.radius,R=(r-.065)*Math.cos(Math.PI/N)-.06,L=2*(r-.065)*Math.sin(Math.PI/N)*.95;
 const p=painter(out,sim,strike,0,{heavenCampaignActor:e.id,heavenCampaignTelegraph:true,heavenCampaignPattern:'pulse',heavenCampaignStrike:{...strike}});
 for(let i=0;i<N;i++){const a=i*TAU/N,x=Math.cos(a)*R,z=Math.sin(a)*R;p.box(x,.075,z,.12,.025,L,colors.warningInk,'locked-pulse-perimeter',{r:[0,-a,0]});p.box(x,.093,z,.045,.02,L*.95,colors.pulse,'locked-pulse-perimeter-core',{r:[0,-a,0],em:.15});}
 for(let i=0;i<4;i++){const a=i*TAU/4,x=Math.cos(a)*(r-.24),z=Math.sin(a)*(r-.24);p.box(x,.075,z,.24,.025,.08,colors.warningInk,'radial-pulse-notch',{r:[0,-a,0]});p.box(x,.093,z,.13,.02,.04,colors.pulse,'radial-pulse-notch-core',{r:[0,-a,0],em:.15});}
}
function drawEnemy(out,sim,e,time){const d=definition(),r=sim.state.heavenCampaign,terms=d?.enemies.find(v=>v.id===e?.id);
 if(!terms||sim.room!==d.room||!r?.accepted||e.heavenCampaign!==d.id||!terms.spawnAfter.every(id=>r.steps.includes(id))||r.steps.includes(terms.defeatStep)||!finite(e.hp,e.x,e.z,e.yaw??0)||e.hp<=0||!G.RealmAdventure.runtime(sim).enemies.includes(e))return false;
 const windup=e.mode==='windup',recover=e.mode==='recover',quiet=sim.paused||sim.state.settings.reducedMotion,ratio=clamp(e.timer/(e.windup||terms.attack.windup)),lean=windup?(quiet?.5:1-ratio):0;
 const p=painter(out,sim,e,e.yaw??0,{heavenCampaignActor:e.id}),flash=e.flash>sim.state.adventure.elapsed,bone=flash?0xffedc9:colors.bone,ink=flash?0xffedc9:colors.ink;
 if(terms.attack.kind==='beam'){
  for(const x of[-.23,.23]){p.box(x,.12,0,.22,.24,.40,ink,'glasswing-foot');p.box(x,.54,0,.08,.68,.19,colors.gold,'glasswing-stanchion');}
  p.box(0,.85,0,.58,.13,.30,ink,'glasswing-connected-carriage');p.box(0,1.18,0,.27,.67,.28,bone,'glasswing-lens-cage');
  for(const x of[-.32,.32])p.box(x,1.20,0,.17,.66,.20,colors.ruby,'glasswing-angular-wing',{r:[0,0,x<0?.26:-.26]});
  for(const z of[-.19,.19])p.emit('disc',[0,1.22,z],[.43,.04,.43],colors.gold,'glasswing-lens-rim',{r:[Math.PI/2,0,0]});
  p.emit('round',[0,1.22,.225],[.25,.25,.14],windup?colors.beam:recover?colors.sage:colors.pale,'glasswing-directed-lens',{em:windup?.35:.1});
  p.box(0,1.60,0,.38,.13,.31,bone,'glasswing-crosshead');p.box(0,1.52-lean*.055,.21,.13,.14,.05,windup?colors.beam:colors.ruby,'glasswing-aim-tab');
 }else{
  for(const x of[-.30,.30]){p.box(x,.12,0,.26,.24,.52,ink,'relay-foot');p.box(x,.86,0,.12,1.38,.32,bone,'relay-upright');}
  p.box(0,1.55,0,.82,.17,.36,colors.gold,'relay-connected-arch');p.box(0,.62,0,.68,.13,.28,ink,'relay-crossbrace');
  p.box(0,1.12,0,.10,.92,.16,colors.gold,'relay-signal-stem');p.emit('octa',[0,1.19,0],[.39,.40,.34],windup?colors.pulse:colors.pale,'relay-counterfeit-signal',{em:windup?.35:.08});
  for(const z of[-.23,.23]){p.box(0,1.72,z,.64,.10,.10,colors.ruby,'relay-borrowed-road-sign');p.box(0,1.72,z*1.26,.42,.036,.024,windup?colors.pulse:colors.bone,'relay-repeating-signal-line');}
  p.box(0,.78-lean*.05,.18,.26,.08,.10,recover?colors.sage:colors.ruby,'relay-phase-tab');
 }
 if(windup&&e.strike){if(terms.attack.kind==='beam')beamWarning(out,sim,e,e.strike);else pulseWarning(out,sim,e,e.strike);}
 return{actor:e.id,root:Array.from(p.root),base:FLOOR,x:e.x,z:e.z,yaw:e.yaw??0,mode:e.mode,pattern:terms.attack.kind};
}
function drawEscort(out,sim,actor,time){const d=definition(),r=sim.state.heavenCampaign;
 if(!d||sim.room!==d.room||!r?.accepted||!actor||G.RealmHeavenCampaign?.runtime(sim).escort!==actor||actor.id!==d.escort.id||!['idle','following','lagging','awaiting-save','arrived'].includes(actor.phase)||(actor.phase!=='idle'&&!r.steps.includes(d.escort.startStep))||!finite(actor.x,actor.z,actor.yaw??0))return false;
 const p=painter(out,sim,actor,actor.yaw??0,{heavenCampaignEscort:actor.id});
 // Distance comes only from the rule owner's actual supported movement.
 // Waiting, pause and reduced motion use a quiet grounded stance.
 const moving=actor.phase==='following'&&actor.walking&&!sim.paused&&!sim.state.settings.reducedMotion;
 const stride=moving&&Number.isFinite(actor.distance)?Math.sin(actor.distance*5.4):0;
 for(const x of[-.115,.115]){const sign=x<0?-1:1,forward=stride*sign*.08,lift=Math.max(0,stride*sign)*.035;p.box(x,.095+lift,forward,.15,.19,.30,colors.ink,'courier-foot');p.box(x,.39+lift*.4,forward*.5,.105,.46,.15,colors.ink,'courier-leg');}
 p.box(0,.73,0,.35,.30,.28,colors.ruby,'courier-coat-hem');p.box(0,1.00,0,.31,.38,.23,colors.ruby,'courier-coat');
 p.box(0,1.23,0,.095,.10,.11,colors.bone,'courier-neck');p.emit('round',[0,1.40,0],[.26,.28,.25],colors.bone,'courier-head');
 p.box(0,1.53,0,.31,.09,.29,colors.ink,'courier-cap');p.box(0,1.49,.17,.28,.05,.10,colors.ink,'courier-cap-brim');
 for(const x of[-.195,.195])p.box(x,.98,0,.095,.32,.15,colors.ruby,'courier-sleeve');
 p.box(.18,.75,.11,.21,.25,.17,colors.sage,'courier-bell-bag');p.emit('octa',[.18,.91,.15],[.11,.13,.10],colors.gold,'courier-bell-mark');
 return{actor:actor.id,root:Array.from(p.root),base:FLOOR,x:actor.x,z:actor.z,yaw:actor.yaw??0,phase:actor.phase};
}
const api={draw,drawEnemy,drawEscort,ACTIVATION_DURATION};G.RealmHeavenCampaignArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
