/* Original service machinery. State and actual actors own every visible fact. */
(function(G){'use strict';
const FLOOR=1.57,TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n));
function definition(){const h=G.RealmHellCampaign;return typeof h?.definition==='function'?h.definition():h?.definition||G.RealmHellCampaignData?.definition;}
function painter(out,sim,anchor,yaw=0,extra={}){const M=G.RealmEngine.M,root=M.compose(anchor.x,FLOOR,anchor.z,1,1,1,0,yaw,0),r=sim.state.hellCampaign;
 const emit=(kind,p,s,c,part,opt={})=>{const m=M.mul(root,M.compose(...p,...s,...(opt.r||[0,0,0])));out[kind].push({p:M.transform(root,p),s:s.slice(),m,c,rough:.87,cameraSolid:false,cutaway:false,appearanceOnly:true,hellCampaignPart:part,hellCampaignChoice:r.choice,...extra,...opt});};
 return{root,emit,box:(x,y,z,w,h,d,c,part,opt)=>emit('box',[x,y,z],[w,h,d],c,part,opt)};
}
function plate(out,sim,anchor,stage,choice=null){const{box,emit}=painter(out,sim,anchor,0,{hellCampaignFixture:'route-plate'}),metal=0x8e8c7a,paper=0xe1cfaa;
 for(const x of[-.32,.32])box(x,.48,0,.09,.96,.12,0x686d65,'plate-leg');
 box(0,1.08,0,1.1,.68,.10,metal,'service-writ-plate');
 for(let i=0;i<4;i++)box(-.35,1.29-i*.13,.057,.46,.035,.015,paper,'writ-line');
 if(stage==='read'||stage==='verified')box(.30,.94,.061,.22,.14,.025,stage==='verified'?0xa9c5af:0xd3af75,'copied-route-record');
 if(choice==='unbind'){for(const x of[-.34,.34])box(x,1.4,.076,.09,.12,.035,0xdac798,'released-plate-tab');box(.27,1.15,.075,.23,.055,.02,0x243c3c,'cancelled-claim-line');box(.32,1.48,.16,.08,.25,.07,0xcdc29c,'open-release-handle');box(.42,1.60,.16,.28,.055,.07,0xcdc29c,'open-release-grip');}
 else if(choice==='divert'){box(.29,1.15,.075,.045,.36,.025,0xa4ccbd,'public-route-line');box(.41,1.31,.075,.27,.045,.025,0xa4ccbd,'public-route-arrow');box(.32,1.5,.16,.36,.07,.30,0x748d7c,'hooded-service-marker');emit('octa',[.32,1.39,.16],[.12,.17,.12],0xcbd5ae,'sheltered-marker-light',{em:.16});}
 else if(choice==='license'){for(const x of[.16,.43])emit('disc',[x,1.15,.078],[.20,.025,.20],0xc69d61,'named-crew-seal',{r:[Math.PI/2,0,0]});box(.31,.95,.075,.34,.035,.025,0xddc995,'limited-license-line');}
}
function service(out,sim,step){const r=sim.state.hellCampaign,{box,emit}=painter(out,sim,step,0,{hellCampaignFixture:'service-engine'}),stable=r.steps.includes('stabilize-service-engine'),choice=r.steps.includes('disposition')?r.choice:null;
 box(0,.13,0,.94,.26,.80,0x5e625d,'service-plinth');
 for(const x of[-.34,.34])box(x,.69,0,.13,1.05,.52,0x74796e,'service-rail');
 box(0,1.19,0,.92,.18,.59,0x94907b,'service-head');
 box(0,.64,.17,.44,.55,.12,stable?0xaaa386:0x665d57,'pressure-carriage');
 for(const x of[-.13,.13])box(x,.61,.244,.045,.41,.025,stable?0xcfd1ac:0xa37762,'pressure-reading');
 emit('octa',[0,1.38,0],[.28,.28,.28],stable?0xb9d1ae:0x9c735d,'service-status',{em:stable?.18:0});
 if(choice==='unbind'){
  box(0,1.05,.33,.52,.08,.17,0xcfc6a1,'released-writ-jaw');
  for(const x of[-.31,.31])box(x,.40,.40,.15,.22,.09,0xb6a888,'detached-claim-clamp');
  box(0,.22,.40,.25,.05,.11,0xd9c5a3,'retired-writ-stack');
  box(.30,1.33,.33,.07,.26,.07,0xd5c5a0,'open-release-handle');box(.22,1.46,.33,.28,.055,.07,0xd5c5a0,'open-release-grip');
 }else if(choice==='divert'){
  for(const x of[-.39,.39])box(x,.69,.22,.08,.75,.08,0x9ac5b5,'public-service-riser');
  box(0,1.06,.30,.76,.065,.12,0xa9d0bd,'public-service-manifold');
  for(const x of[-.23,0,.23])emit('octa',[x,.26,.37],[.15,.18,.15],0xc5dcb9,'public-service-outlet');
  box(0,1.60,0,.46,.08,.40,0x708976,'hooded-service-marker');
 }else if(choice==='license'){
  box(0,.69,.30,.72,.54,.07,0xb39765,'limited-license-guard');
  for(const x of[-.26,0,.26])box(x,.69,.343,.035,.36,.023,0xead3a0,'license-register-column');
  for(const x of[-.16,.16])emit('disc',[x,1.08,.32],[.23,.026,.23],0xd2b177,'named-crew-seal',{r:[Math.PI/2,0,0]});
 }
}
function draw(out,sim,time){const d=definition(),r=sim.state.hellCampaign;if(!d||sim.room!==d.room||!r?.accepted)return;
 const steps=new Set(r.steps),byId=id=>d.steps.find(s=>s.id===id);
 if(steps.has('witness-record')){const p=byId('witness-record'),{box}=painter(out,sim,{x:p.x-.95,z:p.z});box(0,.43,0,.76,.86,.48,0x857b66,'witness-record-stand');box(0,.88,0,.66,.04,.41,0xe0cba7,'preserved-witness-account');for(let i=0;i<3;i++)box(-.08,.907,-.11+i*.10,.42,.012,.026,0x6e7d70,'witness-measurement-line');}
 if(steps.has('tovan-account')){const p=byId('tovan-account'),{box}=painter(out,sim,{x:p.x+.95,z:p.z+.8});box(0,.13,0,.76,.26,.50,0x626961,'riveter-record-box');box(0,.277,0,.60,.026,.38,0xd0be94,'riveter-measurement-copy');for(const x of[-.2,0,.2])box(x,.30,0,.04,.04,.22,0x8b997d,'riveter-reference-notch');}
 if(steps.has('read-service-writ')){const p=byId('read-service-writ');plate(out,sim,{x:p.x-1.05,z:p.z},steps.has('verify-route')?'verified':'read',steps.has('disposition')?r.choice:null);service(out,sim,byId('stabilize-service-engine'));}
 for(const id of['west-shunt','east-brace']){
  if(!steps.has('read-service-writ'))continue;const fitted=steps.has(id),p=byId(id),{box,emit}=painter(out,sim,{x:p.x+.95,z:p.z},0,{hellCampaignFixture:id,hellCampaignFitted:fitted});
  box(0,.16,0,.76,.32,.66,0x666c62,id+'-base');
  if(id==='west-shunt'){
   if(fitted){box(0,.59,0,.38,.67,.37,0x87998a,'seated-shunt');box(0,.95,0,.55,.08,.11,0xabc8b3,'shunt-handle');for(const x of[-.16,.16])box(x,.57,.205,.04,.40,.035,0xc4ceac,'shunt-pressure-channel');}
   else{box(0,.40,0,.52,.16,.37,0x87998a,'supplied-loose-shunt');box(0,.51,0,.55,.07,.11,0xb4b08d,'unseated-shunt-handle');}
  }else if(fitted){for(const x of[-.24,.24])box(x,.51,0,.09,.70,.16,0x988b72,'seated-brace-pin');box(0,.81,0,.63,.09,.18,0xc9b488,'brace-crosspiece');emit('octa',[0,.89,0],[.14,.14,.14],0xc5d1b0,'brace-lock-tab');}
  else{for(const z of[-.15,.15])box(0,.38,z,.64,.10,.08,0x988b72,'supplied-loose-brace-pin');box(0,.48,0,.63,.09,.18,0xc9b488,'unseated-brace-crosspiece');}
 }
}
function drawEnemy(out,sim,e,time){const d=definition(),r=sim.state.hellCampaign;if(!d||sim.room!==d.room||!r?.accepted||r.steps.includes(d.enemy.defeatStep)||e?.hellCampaign!==d.id||e.id!==d.enemy.id||!Number.isFinite(e.hp)||e.hp<=0||!G.RealmAdventure.runtime(sim).enemies.includes(e))return false;
 if(![e.x,e.z,e.yaw??0].every(Number.isFinite))return false;
 const quiet=sim.state.settings.reducedMotion||sim.paused,windup=e.mode==='windup',recover=e.mode==='recover',ratio=clamp(e.timer/(e.windup||1.1)),anticipation=windup?(quiet?.65:1-ratio):0;
 const{box,emit,root}=painter(out,sim,e,e.yaw??0,{hellCampaignActor:e.id}),flash=e.flash>sim.state.adventure.elapsed,iron=flash?0xf8e4b9:0x626e68,brass=flash?0xf8e4b9:0xb8a57a;
 for(const x of[-.27,.27]){box(x,.12,0,.28,.24,.46,iron,'warden-foot');box(x,.49,0,.14,.56,.23,0x717a70,'warden-pillar');}
 box(0,.80,0,.74,.27,.48,iron,'warden-carriage');
 box(0,1.22,0,.61,.61,.47,iron,'warden-body');
 for(const x of[-.40,.40])box(x,1.25,0,.13,.68,.38,brass,'warden-rail');
 box(0,1.72,0,.99,.17,.39,brass,'warden-crosshead');
 box(0,1.95,0,.42,.33,.36,0x939d86,'warden-crown');
 const jaw=recover?1.35:1.16-.14*anticipation;
 box(0,jaw,.31,.48,.12,.13,recover?0xd1c8a0:brass,'warden-writ-jaw');
 box(0,1.09,.335,.25,.28,.055,recover?0xaed2b4:0x665b55,'warden-exposed-bearing',{em:recover?.28:0});
 for(const x of[-.15,.15])box(x,1.95,.19,.065,.095,.035,windup?0xd7b489:0xabbcaa,'warden-eye',{em:windup?.3:.05});
 for(let i=0;i<3;i++)box(-.14+i*.14,1.28,.255,.035,.21,.025,0xd7c496,'warden-register-notch');
 const strike=e.strike;
 if(windup&&strike&&[strike.x,strike.z,strike.yaw,strike.length,strike.halfWidth].every(Number.isFinite)&&strike.length>0&&strike.halfWidth>.04){
  const p=painter(out,sim,strike,strike.yaw,{hellCampaignActor:e.id,hellCampaignTelegraph:true,hellCampaignPattern:strike.kind,hellCampaignStrike:{...strike}}),w=strike.halfWidth,l=strike.length,c=strike.kind==='line'?0xe0bc86:0xcdb7df;
  for(const x of[-w+.025,w-.025])p.box(x,.035,l/2,.05,.035,l,c,'locked-strike-edge',{em:.48});
  for(const z of[.025,l-.025])p.box(0,.035,z,2*w,.035,.05,c,'locked-strike-end',{em:.48});
  const n=strike.kind==='line'?3:2;for(let i=1;i<=n;i++)p.box(0,.054,l*i/(n+1),Math.min(w,.22),.025,.065,c,'locked-strike-notch',{em:.38});
 }
 return{actor:e.id,root:Array.from(root),base:FLOOR,x:e.x,z:e.z,yaw:e.yaw??0,mode:e.mode,pattern:strike?.kind??null};
}
const api={draw,drawEnemy};G.RealmHellCampaignArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
