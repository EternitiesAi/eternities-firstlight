/* Original, pure presentation for nine existing realm work-giver points.
 * Recovered proposal names/roles stay provisional; tools never grant items or
 * portray quest completion. Shared world art owns anchors, time and interaction. */
(function(G){'use strict';
const profiles={
 'heaven-rielle':{id:'heaven-rielle',realm:'heaven',name:'Rielle · bellwright',source:'recovered-heaven-proposal',height:1.69,width:.43,style:'bellwright',hairStyle:'tied',tool:'tuning-mallet',palette:{cloth:0xe8dfc9,layer:0xbeb49e,trim:0x8f1538,skin:0xc49d7e,hair:0x675047,boot:0x655644,metal:0xb89a60}},
 'heaven-calen':{id:'heaven-calen',realm:'heaven',name:'Calen · field guide',source:'recovered-heaven-proposal',height:1.76,width:.45,style:'guide',hairStyle:'short',tool:'folded-map',palette:{cloth:0xd9d0b9,layer:0xb7ac87,trim:0xbe914c,skin:0xb69277,hair:0x5e5749,boot:0x625742,metal:0xbe914c}},
 'heaven-yselle':{id:'heaven-yselle',realm:'heaven',name:'Yselle · gardener',source:'recovered-heaven-proposal',height:1.65,width:.46,style:'gardener',hairStyle:'bob',tool:'cultivator',palette:{cloth:0x85a692,layer:0xe6ddc7,trim:0x962d3e,skin:0x9b775b,hair:0x514439,boot:0x655441,metal:0x8b9285}},
 'hell-istra':{id:'hell-istra',realm:'hell',name:'Istra · return keeper',source:'recovered-hell-proposal',height:1.73,width:.44,style:'returnkeeper',hairStyle:'hood',tool:'return-lantern',palette:{cloth:0x44454b,layer:0xb1ada1,trim:0xc5a473,skin:0xc0a58c,hair:0x6a625c,boot:0x3b3936,metal:0x8e8f88}},
 'hell-tovan':{id:'hell-tovan',realm:'hell',name:'Tovan · riveter',source:'recovered-hell-proposal',height:1.70,width:.52,style:'riveter',hairStyle:'short',tool:'rivet-hammer',palette:{cloth:0x8e9aa3,layer:0x51483e,trim:0xb1ada1,skin:0xa58065,hair:0x77736b,boot:0x403c36,metal:0x5b6268}},
 vessa:{id:'vessa',realm:'earthlands',name:'Vessa · bridge keeper',source:'original-coastward-provisional',height:1.72,width:.43,style:'bridgekeeper',hairStyle:'cap',tool:'folding-rule',palette:{cloth:0x9b7952,layer:0x576b68,trim:0xc5b58b,skin:0xc4a083,hair:0x514337,boot:0x514438,metal:0xb3aa89}},
 merren:{id:'merren',realm:'earthlands',name:'Merren · field steward',source:'original-coastward-provisional',height:1.68,width:.50,style:'steward',hairStyle:'short',tool:'field-register',palette:{cloth:0x6c7b54,layer:0xc8ba94,trim:0x98744e,skin:0x906c54,hair:0x5a5142,boot:0x594a38,metal:0xb1a281}},
 nereme:{id:'nereme',realm:'atlantis',name:'Nereme · pilot',source:'recovered-atlantis-proposal',height:1.74,width:.46,style:'pilot',hairStyle:'cap',tool:'pilot-line',palette:{cloth:0x3b6c73,layer:0x96b2ae,trim:0xccb993,skin:0xae876b,hair:0x453b35,boot:0x4a5551,metal:0xa28550}},
 sahra:{id:'sahra',realm:'atlantis',name:'Sahra · instrument-maker',source:'recovered-atlantis-proposal',height:1.66,width:.42,style:'instrumentmaker',hairStyle:'tied',tool:'measuring-frame',palette:{cloth:0x719994,layer:0xd3c8aa,trim:0xa28550,skin:0xc0a089,hair:0x73614f,boot:0x555b50,metal:0xa28550}},
 'elderweald-rill':{id:'elderweald-rill',realm:'earthlands',name:'Rill · forestkeeper',source:'original-elderweald-provisional',height:1.74,width:.48,style:'forestkeeper',hairStyle:'short',tool:'rivet-hammer',palette:{cloth:0x657966,layer:0x9b8662,trim:0xd2b47e,skin:0xb88c6c,hair:0x4d493f,boot:0x494838,metal:0x8e9788}},
 'elderweald-sela':{id:'elderweald-sela',realm:'earthlands',name:'Sela · herbalist',source:'original-elderweald-provisional',height:1.65,width:.43,style:'gardener',hairStyle:'tied',tool:'cultivator',palette:{cloth:0x84998a,layer:0xbfb79a,trim:0x7c6951,skin:0x96735b,hair:0x423e35,boot:0x5e5443,metal:0x969d86}}
};
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
freeze(profiles);
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),scale=(a,n)=>a.map(v=>v*n);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>scale(a,1/(Math.hypot(...a)||1)),mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const known=id=>typeof id==='string'&&Object.hasOwn(profiles,id);
const quiet=options=>!!options.reducedMotion||!!options.paused;

function build(id,options={}){
 const M=G.RealmEngine?.M;if(!known(id)||!M||!options||typeof options!=='object'||Array.isArray(options)||options.time!=null&&!Number.isFinite(options.time))return null;
 const profile=profiles[id],c=profile.palette,k=profile.height/1.705,w=profile.width;
 const breath=quiet(options)?0:Math.sin((options.time??0)*1.05+Object.keys(profiles).indexOf(id)*.71)*.003;
 const upper=v=>[v[0],v[1]*k+breath,v[2]],lower=v=>[v[0],v[1]*k,v[2]];
 const parts=[],tools=[],joints={head:upper([0,1.54,.006]),neck:upper([0,1.395,0]),
  leftShoulder:upper([-w*.53,1.28,0]),rightShoulder:upper([w*.53,1.28,0]),
  leftHip:lower([-.12,.835,0]),rightHip:lower([.12,.835,0]),
  leftKnee:lower([-.12,.50,.015]),rightKnee:lower([.12,.50,.015]),
  leftAnkle:lower([-.12,.18,.02]),rightAnkle:lower([.12,.18,.02])};
 let left=upper([-.28,.89,.15]),right=upper([.30,1.02,.26]);
 const board=id==='heaven-calen'||id==='merren',boardCenter=upper([0,1.045,.34]),boardSize=[.37,.25*k,.045];
 if(board){left=add(boardCenter,[-boardSize[0]/2,0,0]);right=add(boardCenter,[boardSize[0]/2,0,0]);}
 if(id==='hell-istra')right=upper([.32,1.04,.30]);
 if(id==='heaven-yselle')right=upper([.30,.99,.25]);
 if(id==='sahra')right=upper([.30,1.01,.27]);
 joints.leftHand=left;joints.rightHand=right;
 const part=(kind,name,p,s,col,rotation=[0,0,0],extra={})=>{
  const m=M.compose(...p,...s,...rotation);
  parts.push({kind,name,p:p.slice(),s:s.slice(),m,c:col,rough:.87,cameraSolid:false,cutaway:false,realmGiver:id,...extra});
 };
 const box=(name,p,s,col,rotation,extra)=>part('box',name,p,s,col,rotation,extra);
 const body=(kind,name,p,s,col,rotation,extra)=>part(kind,name,upper(p),[s[0],s[1]*k,s[2]],col,rotation,extra);
 const beam=(name,a,b,width,depth,col,extra={},kind='box')=>{
  const delta=sub(b,a),length=Math.hypot(...delta),y=unit(delta),reference=Math.abs(y[2])<.90?[0,0,1]:[1,0,0],x=unit(cross(y,reference)),z=cross(x,y),center=mix(a,b,.5),sy=kind==='octa'?length/1.3:length;
  const m=new Float32Array([...scale(x,width),0,...scale(y,sy),0,...scale(z,depth),0,...center,1]);
  parts.push({kind,name,p:center,s:[width,sy,depth],m,c:col,rough:.88,cameraSolid:false,cutaway:false,realmGiver:id,joins:[a.slice(),b.slice()],...extra});
 };
 for(const [side,sign]of[['left',-1],['right',1]]){
  box(side+'-sole',lower([sign*.12,.030,.067]),[.18,.060*k,.30],c.boot);
  box(side+'-boot',lower([sign*.12,.125,.060]),[.16,.20*k,.28],c.boot);
  beam(side+'-thigh',joints[side+'Hip'],joints[side+'Knee'],.15,.17,0x52564b);
  beam(side+'-shin',joints[side+'Knee'],joints[side+'Ankle'],.125,.145,0x484e46);
 }
 body('box','coat-waist',[0,.94,0],[w*.79,.30,.26],c.cloth);
 body('box','coat-chest',[0,1.205,0],[w,.29,.27],c.cloth);
 for(const sign of[-1,1])body('box','coat-hem-'+sign,[sign*w*.22,.79,.008],[w*.49,.23,.26],c.cloth,[0,0,sign*.035]);
 body('box','belt',[0,.925,.008],[w*.83,.055,.279],c.boot);
 body('round','neck',[0,1.395,0],[.11,.13,.12],c.skin);
 body('round','head',[0,1.54,.006],[.245,.265,.24],c.skin);
 body('box','hair-crown',[0,1.655,-.012],[.23,.10,.21],c.hair);
 body('box','hair-back',[0,1.55,-.112],[.22,.23,.063],c.hair);
 for(const sign of[-1,1]){
  body('box','eye-'+sign,[sign*.049,1.566,.125],[.025,.018,.012],0x303733);
  body('round','ear-'+sign,[sign*.122,1.54,.004],[.041,.063,.05],c.skin);
 }
 body('octa','nose',[0,1.546,.142],[.047,.056,.06],c.skin);
 for(const [side,sign,hand]of[['left',-1,left],['right',1,right]]){
  const elbow=mix(joints[side+'Shoulder'],hand,.52);elbow[0]+=sign*.05;elbow[2]-=.07;
  joints[side+'Elbow']=elbow;
  body('box',side+'-shoulder',[sign*w*.53,1.28,0],[.16,.13,.245],c.cloth,[0,0,sign*.10]);
  beam(side+'-sleeve',joints[side+'Shoulder'],elbow,.125,.14,c.cloth);
  beam(side+'-forearm',elbow,hand,.10,.11,id==='hell-tovan'||id==='heaven-yselle'?c.skin:c.cloth);
  part('round',side+'-hand',hand,[.10,.11*k,.10],c.skin);
 }
 if(profile.hairStyle==='tied')body('round','hair-knot',[.035,1.58,-.175],[.135,.12,.11],c.hair);
 if(profile.hairStyle==='bob')body('box','hair-side',[-.102,1.52,-.017],[.057,.19,.17],c.hair);
 if(profile.hairStyle==='cap'){
  body('box','cap-band',[0,1.654,.014],[.25,.047,.245],c.layer);
  body('box','cap-brim',[0,1.66,.116],[.30,.026,.18],c.layer);
 }
 if(profile.hairStyle==='hood'){
  body('box','hood-back',[0,1.58,-.14],[.275,.30,.10],c.cloth);
  body('box','hood-crown',[0,1.697,-.025],[.28,.052,.265],c.cloth);
 }
 if(['bellwright','gardener','riveter','steward','instrumentmaker'].includes(profile.style)){
  body('box','working-apron',[0,.98,.145],[w*.65,.51,.032],c.layer);
  body('box','apron-neck-strap',[0,1.26,.145],[.043,.18,.026],c.layer);
 }
 if(profile.style==='bellwright'){
  beam('ruby-cuff',mix(joints.rightElbow,right,.80),mix(joints.rightElbow,right,.95),.124,.126,c.trim);
 }
 if(profile.style==='gardener')body('box','red-tool-cord',[0,.98,.176],[w*.71,.034,.022],c.trim);
 if(profile.style==='riveter')for(const sign of[-1,1])body('box','apron-rivet-'+sign,[sign*.12,1.17,.168],[.025,.026,.015],c.trim);
 if(profile.style==='guide'){
  for(const sign of[-1,1])body('box','ivory-cloak-'+sign,[sign*.125,1.105,-.176],[.22,.61,.048],c.layer,[.085,0,-sign*.035]);
  body('octa','gold-clasp',[.09,1.326,.15],[.048,.059,.028],c.trim);
  body('box','satchel',[.23,.90,-.018],[.20,.22,.17],c.boot);
  body('box','satchel-flap',[.23,.998,.005],[.213,.06,.183],c.layer);
  beam('satchel-strap',upper([-.16,1.31,.154]),upper([.24,1.0,.16]),.038,.021,c.boot);
  for(const sign of[-1,1]){
   const cloak=parts.find(p=>p.name==='ivory-cloak-'+sign),root=M.transform(cloak.m,[0,.25,-.5]),fold=upper([sign*.205,1.055,-.265]),tip=upper([sign*.225,.835,-.28]);
   joints['wingRoot'+sign]=root;
   beam('folded-wing-upper-'+sign,root,fold,.145,.063,c.cloth,{wing:true,attachment:cloak.name,attachmentPoint:[0,.25,-.5]},'octa');
   beam('folded-wing-lower-'+sign,fold,tip,.12,.066,c.cloth,{wing:true,attachment:'cloak'},'octa');
   beam('folded-feather-'+sign,mix(fold,tip,.15),mix(fold,tip,.84),.026,.071,0xefe7d4,{wing:true,attachment:'folded-wing'});
  }
 }
 if(profile.style==='forestkeeper'){
  for(const sign of[-1,1])body('box','field-cloak-'+sign,[sign*.13,1.11,-.175],[.23,.55,.05],c.layer,[.06,0,-sign*.045]);
  body('box','field-satchel',[.23,.92,-.018],[.18,.20,.15],c.boot);
  body('box','field-satchel-flap',[.23,1.01,.005],[.19,.05,.16],c.layer);
  body('octa','keeper-clasp',[.09,1.326,.15],[.046,.05,.026],c.trim);
 }
 if(profile.style==='returnkeeper'){
  body('box','refuge-sash',[-.105,1.10,.152],[.093,.53,.031],c.layer,[0,0,-.10]);
  body('box','mantle',[0,1.27,-.102],[w+.08,.18,.09],c.layer);
 }
 if(profile.style==='bridgekeeper')body('box','bridge-shoulder-band',[0,1.28,.144],[w*.84,.067,.025],c.layer);
 if(profile.style==='steward')body('box','register-pocket',[-.12,.93,.18],[.12,.11,.024],c.trim);
 if(profile.style==='pilot'){
  body('box','pilot-collar',[0,1.342,.078],[.33,.072,.15],c.layer);
  body('box','pilot-coat-edge',[.14,1.06,.146],[.043,.37,.022],c.trim);
 }
 if(profile.style==='instrumentmaker')body('box','bronze-apron-band',[0,.92,.167],[w*.66,.03,.016],c.trim);

 const toolPart=(kind,name,p,s,col,rotation,extra={})=>part(kind,'tool-'+name,p,s,col,rotation,{tool:profile.tool,...extra});
 const toolBeam=(name,a,b,width,depth,col,extra={},kind='box')=>beam('tool-'+name,a,b,width,depth,col,{tool:profile.tool,...extra},kind);
 const grip=(name,hand,partName,partPoint=[0,0,0])=>tools.push({name,hand,part:'tool-'+partName,partPoint:partPoint.slice(),gripLocal:joints[hand].slice()});
 if(['tuning-mallet','rivet-hammer','cultivator','folding-rule'].includes(profile.tool)){
  const handle=right,wood=0x806345;
  toolBeam('grip',add(handle,[0,-.16*k,0]),add(handle,[0,.16*k,0]),.040,.044,wood,{},'round');grip(profile.tool,'rightHand','grip');
  const top=add(handle,[0,.16*k,0]);
  if(profile.tool==='cultivator'){
   toolPart('box','fork-cross',top,[.18,.045*k,.07],c.metal);
   for(const sign of[-1,1])toolBeam('fork-prong-'+sign,add(top,[sign*.057,0,0]),add(top,[sign*.057,.095*k,.025]),.035,.04,c.metal);
  }else if(profile.tool==='folding-rule'){
   toolBeam('folded-rule',top,add(top,[.16,.10*k,0]),.043,.047,c.layer);
   for(const y of[-.05,.075])toolPart('box','rule-mark-'+y,add(handle,[0,y*k,.025]),[.045,.012*k,.012],c.trim);
  }else{
   const hammer=profile.tool==='rivet-hammer';
   toolPart('box','head',top,[hammer?.24:.19,(hammer?.12:.09)*k,hammer?.14:.10],hammer?c.metal:0x9b7f5b);
   toolPart('box','ferrule',add(top,[0,-.045*k,0]),[.063,.060*k,.061],c.metal);
  }
 }
 if(board){
  toolPart('box','board',boardCenter,boardSize,profile.tool==='field-register'?0x756347:0xc9ba94);
  toolPart('box','pages',add(boardCenter,[0,0,.026]),[.31,.20*k,.014],0xe3d9bb);
  grip(profile.tool,'leftHand','board',[-.5,0,0]);grip(profile.tool,'rightHand','board',[.5,0,0]);
 }
 if(profile.tool==='return-lantern'){
  const top=right,cap=add(top,[0,-.15*k,0]),bottom=add(top,[0,-.405*k,0]);
  toolPart('box','grip',top,[.20,.038*k,.048],c.metal);grip(profile.tool,'rightHand','grip');
  for(const sign of[-1,1])toolBeam('handle-'+sign,add(top,[sign*.08,0,0]),add(cap,[sign*.08,0,0]),.025,.028,c.metal);
  toolPart('box','upper-cap',cap,[.25,.055*k,.19],c.metal);
  toolPart('octa','glass',mix(cap,bottom,.5),[.21,.185*k,.17],0xe7bb74,undefined,{em:.45,rough:.60});
  toolPart('box','lower-cap',bottom,[.24,.05*k,.18],c.metal);
 }
 if(profile.tool==='pilot-line'){
  const radius=.11,theta=3*Math.PI/4,center=add(right,[-Math.cos(theta)*radius,-Math.sin(theta)*radius,0]);
  for(let i=0;i<8;i++){
   const a=theta+i*Math.PI/4,b=theta+(i+1)*Math.PI/4,start=add(center,[Math.cos(a)*radius,Math.sin(a)*radius,0]),end=add(center,[Math.cos(b)*radius,Math.sin(b)*radius,0]);
   toolBeam('coil-'+i,start,end,.031,.036,0xc0ae88);
  }
  grip(profile.tool,'rightHand','coil-0',[0,-.5,0]);
 }
 if(profile.tool==='measuring-frame'){
  toolBeam('grip',add(right,[0,-.08*k,0]),add(right,[0,.08*k,0]),.045,.047,c.boot);grip(profile.tool,'rightHand','grip');
  const bottom=add(right,[0,.08*k,0]),top=add(right,[0,.33*k,0]);
  for(const [name,p]of[['lower',bottom],['upper',top]])toolPart('box','frame-'+name,p,[.24,.037*k,.06],c.metal);
  for(const sign of[-1,1])toolBeam('frame-side-'+sign,add(bottom,[sign*.10,0,0]),add(top,[sign*.10,0,0]),.031,.048,c.metal);
  toolPart('box','frame-crossbar',add(bottom,[0,.08*k,0]),[.21,.033*k,.06],c.metal);
  toolBeam('pointer',add(bottom,[-.05,.04*k,.034]),add(bottom,[.055,.16*k,.034]),.022,.024,0xd9ceaa);
  toolPart('octa','dial',add(bottom,[0,.08*k,.035]),[.055,.060*k,.035],0x8fb9b4);
 }
 return {parts,joints,tools};
}
function parts(id,options={}){return build(id,options)?.parts||[];}
function draw(out,point,options={}){
 const empty={id:null,instances:0,root:null,joints:{},tools:[]},M=G.RealmEngine?.M;
 if(!M||!known(point?.id)||point.kind!=='person'||!options||typeof options!=='object'||Array.isArray(options)||![point.x,point.z,options.base,options.yaw??point.yaw??Math.PI].every(Number.isFinite)||
  options.realm!=null&&options.realm!==profiles[point.id].realm||!['box','round','octa'].every(kind=>Array.isArray(out?.[kind])&&Object.isExtensible(out[kind])))return empty;
 const local=build(point.id,options);if(!local)return empty;
 const root=M.compose(point.x,options.base,point.z,1,1,1,0,options.yaw??point.yaw??Math.PI,0);
 for(const p of local.parts){const {kind,...instance}=p;out[kind].push({...instance,p:M.transform(root,p.p),s:p.s.slice(),m:M.mul(root,p.m)});}
 return {id:point.id,instances:local.parts.length,root,joints:Object.fromEntries(Object.entries(local.joints).map(([name,p])=>[name,p.slice()])),
  tools:local.tools.map(tool=>({...tool,partPoint:tool.partPoint.slice(),gripLocal:tool.gripLocal.slice(),gripWorld:M.transform(root,tool.gripLocal)}))};
}
const api={profiles,parts,draw};G.RealmGiversArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
