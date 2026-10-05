/* Firstlight 09 player-facing interface. One paused workspace, one skill bar.
 * Visual item catalogue is a projection of the real three-slot inventory. */
(function(G){'use strict';
const A=G.RealmAdventure,AR=G.RealmArsenal,B=G.RealmBeacon,T=G.RealmCombat,S=G.RealmSandbox,C=G.RealmCore;
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={
 blade:'M17 47 43 8 50 6 50 14 24 51M14 40l15 11M16 48l-7 9',
 bow:'M17 8c37 8 37 40 0 48M17 8l9 24-9 24M7 32h43m-8-6 8 6-8 6',
 armor:'M22 9h20l13 10-8 11-5-4v30H22V26l-5 4L9 19zM26 10q6 13 12 0',
 charm:'M15 8q17 36 34 0M32 29l10 13-10 15-10-15z',
 wood:'M13 45 37 13l14 12-24 31zM38 14l-5 17M16 46l14 4M34 39l12-8',
 stone:'M9 40l8-23 21-6 17 22-10 18-23 3zM17 17l16 20 22-4M33 37l-11 17',
 fiber:'M31 56V14M31 33Q10 36 12 15q15-2 19 18M31 43q23-2 23-24-22 2-23 24',
 gem:'M11 23l10-12h22l10 12-21 33zM11 23h42M21 11l11 45 11-45',
 tonic:'M25 9h14v13l10 17q7 17-17 17T15 39l10-17zM23 9h18M20 39h25',
 shield:'M12 15l20-7 20 7v19Q48 49 32 57 16 49 12 34zM32 17v29m-9-21 9 9 14-15',
 paw:'M20 37q12-20 24 0l7 10q0 10-19 5-19 5-19-5zM15 16v9m12-16v13m12-13v13m11-6v9',
 light:'M32 5v54M5 32h54M14 14l36 36m0-36L14 50M25 25l7-12 7 12 12 7-12 7-7 12-7-12-12-7z',
 flame:'M29 7q20 13 13 24l8-8q13 28-17 33T19 24q0 17 10 5z',
 book:'M7 12q13-5 25 4 12-9 25-4v40q-14-5-25 2-11-7-25-2zM32 16v38M13 23h11m-11 8h11m17-8h10',
 hammer:'M28 9l23 13-8 13-10-6-17 29-8-5 17-29-8-5z',
 house:'M7 29 32 8l25 21M14 26v30h36V26M26 56V39h12v17',
 coin:'M32 7a25 25 0 1 1-.1 0M32 16v32m8-24c-14-15-24 9-5 10s1 22-12 9',
 map:'M8 14l16-6 16 6 16-6v43l-16 6-16-6-16 6zM24 8v43m16-37v43',
 lantern:'M22 13h20l6 9v30H16V22zM22 13V8h20v5M16 26h32M26 33l6-5 6 5-6 12z',
 seed:'M15 46q-6-29 36-33 5 36-27 38zM21 46l22-25',
 grid:'M9 9h46v46H9zM24 9v46m16-46v46M9 24h46M9 40h46',
 arrow:'M10 50 50 10M30 10h20v20M10 36v14h14'
};
function icon(kind,color='currentColor'){return '<svg viewBox="0 0 64 64" aria-hidden="true" style="color:'+esc(color)+'"><path d="'+(paths[kind]||paths.gem)+'" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';}
function kind(id){if(id.includes('bow'))return'bow';if(id.includes('blade')||id==='dawn_edge')return'blade';if(A.GEAR[id]?.slot==='armor')return'armor';if(A.GEAR[id]?.slot==='charm')return'charm';return ({wood:'wood',fiber:'fiber',stone:'stone',plank:'wood',block:'stone',axe:'hammer',pick:'hammer',lantern:'lantern',seeds:'seed',berry:'seed',bed:'seed',floor:'grid',wall:'house',masonry:'stone',bench:'house',fire:'flame',workbench:'hammer',coins:'coin',tonics:'tonic',ore:'stone'})[id]||'gem';}
function button(text,action,id='',disabled=false,extra=''){return '<button data-rpg="'+action+'" data-id="'+esc(id)+'" '+(disabled?'disabled ':'')+extra+'>'+text+'</button>';}
class RPGUI{
 constructor(api){
  this.api=api;this.tab='equipment';this.filter='all';this.search='';this.item=null;this.recipe='trail_bow';this.craftFilter='weapons';this.quest='story';this.serial=0;this.seenPhase='';this.preview=null;this.previewYaw=.5;this.lastPreview=-1;
  document.body.classList.add('rpg-edition');
  const hud=document.createElement('div');hud.id='rpg-hud';hud.innerHTML=`
   <nav class="rpg-nav" aria-label="Main game menus">
    ${button(icon('charm')+'<span>Character</span><kbd>C</kbd>','open','equipment')}
    ${button(icon('book')+'<span>Journal</span><kbd>J</kbd>','open','journal')}
    ${button(icon('hammer')+'<span>Crafting</span><kbd>K</kbd>','open','craft')}
    ${button(icon('grid')+'<span>More</span>','open','more')}
   </nav>
   <section id="quest-tracker" aria-label="Tracked quest"><div class="tracker-switch">${button('Story','track','story')}${button('Homestead','track','homestead')}${button('Living road','track','expedition',false,'hidden')}${button('Local life','track','local-life',false,'hidden')}${button('Community','track','community',false,'hidden')}${button('Hell campaign','track','hell-campaign',false,'hidden')}</div><button id="tracked-open"><small id="tracked-chapter"></small><strong id="tracked-title"></strong><span id="tracked-detail"></span><i id="tracked-progress"></i></button></section>
   <section id="target-frame" hidden aria-label="Selected enemy"><div id="target-icon">${icon('shield')}</div><div><small id="target-rank"></small><strong id="target-name"></strong><div class="target-health"><i id="target-health-fill"></i></div><span id="target-state"></span><div id="target-cue" hidden aria-label="Selected foe action"><b id="target-cue-title"></b><span id="target-cue-detail"></span></div><button id="target-framing" title="Third person: face a selected foe within 12 metres. Drag still orbits freely.">Frame foe</button></div><button id="target-clear" aria-label="Clear target">×</button></section>
   <section id="beacon-tracker" hidden aria-label="Beacon defense"><small>CHAPTER III · THE BEACON ANSWERS</small><strong id="beacon-phase"></strong><div class="ward-meter"><i id="ward-fill"></i></div><span id="beacon-status"></span><button id="beacon-menu">Approach & speak · E</button></section>
   <div class="camera-presets" aria-label="Camera styles: V switches, R resets the current view">${button('3rd person','camera','adventure')}${button('Diorama','camera','follow')}${button('Tactical','camera','tactical')}${button('Wide','camera','wide')}</div>
   <div id="enemy-health" aria-hidden="true"></div><div id="combat-numbers" aria-hidden="true"></div>
   <section id="skillbar" aria-label="Combat skill bar">
    <button id="health-orb" title="Character & equipment"><b id="rpg-health">100</b><small>HEALTH</small></button>
    <div class="skill-main"><div class="stamina-track"><i id="rpg-stamina"></i><span id="stamina-label"></span></div><div class="skill-row">
     ${[['auto','1','blade','Autoattack'],['special','2','light','Weapon skill'],['guard','3','shield','Brace'],['insight','4','paw','Briar'],['spirit','5','light','Soul skill'],['heal','6','tonic','Tonic'],['dodge','␣','arrow','Dodge']].map(([id,key,ic,label])=>`<button class="skill" id="skill-${id}" data-skill="${id}"><kbd>${key}</kbd><span class="skill-icon">${icon(ic)}</span><small>${label}</small><b class="skill-cooldown"></b></button>`).join('')}
    <button class="skill skill-class" id="skill-class" data-skill="class-technique"><kbd>X</kbd><span class="skill-icon">✦</span><small>Path</small><b class="skill-cooldown"></b></button></div><div class="combat-help" id="combat-help">TAB selects · 1 toggles autoattack · 2–6 skills · X path · SPACE dodge</div></div>
   </section>`;
  $('#hud').append(hud);
  // Size changes only: narrow layouts stack the ward below the actual target panel.
  this.targetSize=new ResizeObserver(entries=>{const e=entries[0],height=e.borderBoxSize?.[0]?.blockSize??e.target.getBoundingClientRect().height;hud.style.setProperty('--target-frame-height',height+'px');});
  this.targetSize.observe($('#target-frame'));
  const d=document.createElement('dialog');d.id='rpg-window';d.setAttribute('aria-labelledby','rpg-heading');d.innerHTML='<header><div><small>FIRSTLIGHT · YOUR JOURNEY</small><h2 id="rpg-heading">Character</h2></div><span class="paused-note">World paused while open</span><button id="rpg-close" aria-label="Close character workspace">×</button></header><nav id="rpg-tabs" aria-label="Character sections"></nav><div id="rpg-content"></div>';document.body.append(d);this.dialog=d;
  $('#rpg-close').onclick=()=>this.close();d.addEventListener('cancel',e=>{e.preventDefault();this.close();});
  const click=e=>{const b=e.target.closest('[data-rpg],[data-realm-art]');if(b)this.action(b);};d.addEventListener('click',click);hud.addEventListener('click',click);
  d.addEventListener('input',e=>{if(e.target.id==='bag-search'){this.search=e.target.value;this.paintBag();}});
  $('#tracked-open').onclick=()=>this.open(this.quest==='hell-campaign'?'hell-campaign':this.quest==='community'?'community':this.quest==='local-life'?'local-life':this.quest==='expedition'?'expedition':this.worlds.local()?'worlds':this.earth.notes.active()&&[null,G.RealmEarth.ROOM,'observatory'].includes(this.sim.room)?'earth-notes':this.sim.room===G.RealmEarth.ROOM&&this.state.earthStory.accepted?'earth-story':this.quest==='project'?'pursuit':'journal');$('#beacon-menu').onclick=()=>{if(B.runtime(this.sim).phase==='assault')this.run('beacon-repair');else this.open('beacon');};$('#target-framing').onclick=()=>{const r=this.api.frameFoe();if(!r.ok)this.api.toast(r.error);};$('#target-clear').onclick=()=>this.run('target-clear');$('#health-orb').onclick=()=>this.open('equipment');
  for(const el of hud.querySelectorAll('[data-skill]'))el.onclick=()=>this.skill(el.dataset.skill);
  this.crossing=new G.RealmCrossingUI.CrossingUI(this);this.starter=new G.RealmStarterUI.StarterUI(this);this.pursuit=new G.RealmPursuitUI.PursuitUI(this);this.characters=new G.RealmCharactersUI.CharactersUI(this);this.classes=new G.RealmClassesUI.ClassesUI(this);this.cosmos=new G.RealmCosmosUI.CosmosUI(this);this.realmAtlas=new G.RealmVisualAtlas(this);this.gathering=new G.RealmGatheringUI.GatheringUI(this);this.earth=new G.RealmEarthUI.EarthUI(this);this.worlds=new G.RealmWorldFoundationsUI.WorldUI(this);this.trails=new G.RealmTrailsUI.TrailsUI(this);this.hellCampaign=new G.RealmHellCampaignUI.HellCampaignUI(this);this.community=new G.RealmBridgeCommunityUI.BridgeCommunityUI(this);this.civic=new G.RealmLocalLifeUI.LocalLifeUI(this);this.expedition=new G.RealmEarthExpeditionUI.ExpeditionUI(this);if(this.state.starter.accepted&&!this.state.starter.reward)this.quest='starter';if(this.sim.state.earthExpedition.story.accepted&&!this.sim.state.earthExpedition.story.claimed||this.sim.state.earthExpedition.patrol.active)this.quest='expedition';
 }
 get sim(){return this.api.sim();} get state(){return this.sim.state.adventure;}
 run(t,p={},quiet=false){const paused=this.sim.paused;try{if(this.dialog.open)this.sim.paused=false;const r=this.api.adventure().run(t,p,quiet);if(r.ok&&this.dialog.open)this.paint();return r;}finally{this.sim.paused=paused;}}
 open(tab='equipment'){
  if(tab!=='hell-campaign')this.hellCampaign?.reset();if(tab!=='expedition')this.expedition?.reset();if(tab!=='worlds')this.worlds?.reset();if(tab!=='gathering')this.gathering?.reset();if(tab!=='cosmos')this.cosmos?.reset();if(tab!=='earth')this.earth?.reset();
  if(!this.dialog.open){this.api.closePanel();this.api.endBuild();this.api.clearKeys();this.api.adventure().stopAuto();if(document.querySelector('#studio-dialog[open]'))document.querySelector('#studio-close').click();T.stop(this.sim);this.wasPaused=this.sim.paused;this.sim.paused=true;this.dialog.showModal();}
  this.tab=tab;this.paint();$('#rpg-content').scrollTop=0;$('#rpg-close').focus();
 }
 close(){this.hellCampaign?.reset();this.expedition?.reset();this.worlds?.reset();this.gathering?.reset();this.cosmos?.reset();this.earth?.reset();if(!this.dialog.open)return;this.dialog.close();this.sim.paused=this.wasPaused;this.api.clearKeys();this.api.focusWorld();}
 cameraPaint(mode){for(const el of document.querySelectorAll('[data-rpg="camera"]'))el.setAttribute('aria-pressed',String(el.dataset.id===mode));}
 reset(){this.realmAtlas?.reset();this.gathering?.reset();if(this.dialog.open)this.close();this.item=null;this.seenPhase='';this.filter='all';this.search='';this.recipe='trail_bow';this.craftFilter='weapons';this.avatarDrag=null;this.lastPreview=-1;this.pursuit.selected=null;this.starter.temper=null;this.starter.destination=null;this.starter.lastSound=0;this.starter.lastSoundScene=null;this.crossing.destination=null;this.crossing.uiRoom=null;this.characters.reset();this.classes.reset();this.earth?.notes.reset();this.earth?.reset();}
 action(el){if(this.hellCampaign.action(el))return;if(this.community.action(el))return;if(this.civic.action(el))return;if(this.expedition.action(el))return;if(this.trails.action(el))return;if(this.worlds.action(el))return;if(this.realmAtlas.action(el))return;if(this.gathering.action(el))return;if(this.earth.action(el))return;if(this.cosmos.action(el))return;if(this.classes.action(el))return;if(this.characters.action(el))return;if(this.starter.action(el))return;if(this.crossing.action(el))return;if(this.pursuit.action(el))return;const act=el.dataset.rpg,id=el.dataset.id,a=this.state;
  if(act==='open'){this.open(id);return;}
  if(act==='track'){this.quest=id;if(this.dialog.open)this.paint();this.tick();return;}
  if(act==='camera'){this.api.camera(id);return;}
  if(act==='item'){this.item=id;this.paintBag();return;}
  if(act==='filter'){this.filter=id;this.paintBag();return;}
  if(act==='recipe'){this.recipe=id;this.paint();return;}
  if(act==='craft-filter'){this.craftFilter=id;this.recipe=null;this.paint();return;}
  if(act==='equip'){this.run('equip',{id});return;}
  if(act==='socket'){const select=$('#rpg-socket');this.run('socket',{weapon:id,gem:select.value||null});return;}
  if(act==='craft'){
   const recipe=this.recipes().find(r=>r.id===id);if(!recipe)return;
   const was=this.sim.paused,request='rpg-craft-'+Date.now()+'-'+(++this.serial),domain=recipe.type==='sandbox'?'sandbox':'adventure',type=recipe.type==='sandbox'?'craft':recipe.type==='forge'?'forge':'arsenal-craft',payload=recipe.type==='sandbox'?{recipe:id}:recipe.type==='forge'?{}:{id};let result;
   try{this.sim.paused=false;result=this.api.workshopCommand?this.api.workshopCommand(domain,request,type,payload):domain==='sandbox'?this.sim.sandboxCommand(request,type,payload):this.sim.adventureCommand(request,type,payload);}finally{this.sim.paused=was;}
   this.api.toast(result.text||result.error);if(result.ok&&!this.api.workshopCommand)this.api.save();this.paint();return;
  }
  if(act==='trade'){this.run('trade',{offer:id});return;}
  if(act==='rename'){this.run('rename',{name:$('#rpg-companion-name').value});return;}
  if(act==='companion'){this.run('companion-mode',{mode:id});return;}
  if(act==='soul-equip'){this.run('soul-equip',{power:id||null});return;}
  if(act==='relic'){this.run('beacon-relic',{choice:id});return;}
  if(act==='chart'){this.run('beacon-route',{route:id});return;}
  if(act==='power'||act==='beacon-command'){
   const result=this.run(id);if(result.ok&&['beacon-answer','beacon-defend','beacon-replay'].includes(id))this.close();return;
  }
  if(act==='preview-turn'){this.previewYaw+=.65;return;}
  if(act==='export'){this.api.exportWorld();return;}
  if(act==='import'){this.close();$('#import-file').click();return;}
  // Navigation executes only after restoring the world, never a position edit.
  if(act==='go'){this.close();this.api.adventure().go(id);return;}
  if(act==='road-route'){this.close();this.api.adventure().roadRoute(id);return;}
  if(act==='mine-route'){this.close();this.api.adventure().action({dataset:{action:'adv-seek',id}});return;}
  if(act==='panel'){this.close();this.api.openPanel(id);return;}
  if(act==='music'){this.close();this.api.music();return;}
  if(act==='gather'){this.close();this.api.gather(id);return;}
  if(act==='range'){this.close();this.run('range-enter');return;}
 }
 skill(id){
  if(this.dialog.open||document.querySelector('dialog[open]')||this.api.panel())return;
  const t=T.runtime(this.sim);this.api.adventure().stopAuto();
  if(id==='auto'){this.run('auto-toggle');return;}
  if(id==='special'){this.run('pulse',t.target?{target:t.target}:{});return;}
  if(id==='insight'){
   if(this.sim.room==='crossing'&&!A.runtime(this.sim).enemies.some(e=>e.hp>0&&Math.hypot(e.x-this.sim.state.player.x,e.z-this.sim.state.player.z)<10)){this.run('cross-seek');return;}
   if(this.sim.room==='road'&&!A.runtime(this.sim).enemies.some(e=>e.hp>0&&e.kind!=='practice'&&Math.hypot(e.x-this.sim.state.player.x,e.z-this.sim.state.player.z)<13)){this.run('seek');return;}
  }
  if(id==='class-technique'){this.run('class-technique');return;}
  this.run(id==='dodge'?'dodge':id==='heal'?'heal':id,id==='dodge'?this.api.direction():{});
 }
 key(e){
  const k=e.key.toLowerCase();
  if(this.dialog.open)return false;
  if(k==='m'){this.open('atlas');return true;}
  if(k==='tab'&&A.combatScene(this.sim)&&!this.api.panel()){this.run('target-cycle',{reverse:e.shiftKey},true);return true;}
  if(k==='escape'&&!this.api.panel()&&(T.runtime(this.sim).auto||T.runtime(this.sim).target)){this.run('target-clear',{},true);this.api.adventure().stopAuto();return true;}
  const slots={1:'auto',2:'special',3:'guard',4:'insight',5:'spirit',6:'heal',' ':'dodge',q:'special',g:'heal',x:'class-technique'};
  if(slots[k]){this.skill(slots[k]);return true;}
  if(k==='f'){if(this.api.panel())return true;const t=T.runtime(this.sim);this.run('attack',t.target?{target:t.target}:{},true);return true;}
  if(k==='escape'&&!this.api.panel()&&A.combatScene(this.sim)){this.open('more');return true;}
  if(k==='c'||k==='i'||k==='7'){this.open(k==='c'?'equipment':'bag');return true;}
  if(k==='j'||k==='u'||k==='8'){this.open('journal');return true;}
  if(k==='k'||k==='9'){this.open('craft');return true;}
  if(k==='o'){this.api.openPanel('inhabitants');return true;}
  if(k==='r'){if(!this.api.panel())this.api.resetCamera();return true;}
  if(k==='['||k===']'){if(this.api.panel())return true;this.api.rotate(k==='['?-.7854:.7854);return true;}
  return false;
 }
 intercept(name){const map={armory:'craft',craft:'craft',pack:'bag',adventure:'journal',journey:'journal'};if(map[name]){if(name==='journey')this.quest='homestead';this.open(map[name]);return true;}return false;}
 interact(){
  if(this.hellCampaign.interact())return true;if(this.community.interact())return true;if(this.civic.interact())return true;if(this.expedition.interact())return true;if(this.trails.interact())return true;if(this.worlds.interact())return true;
  if(this.gathering.interact())return true;
  if(this.earth.interact())return true;
  if(this.cosmos.interact())return true;
  if(this.starter.interact())return true;
  if(this.crossing.interact())return true;
  if(this.sim.room==='road'&&this.state.road.cartRepaired&&Math.hypot(this.sim.state.player.x+10,this.sim.state.player.z-12)<3){this.open('merchant');return true;}
  if(!B.near(this.sim)||!this.state.road.beaconLit||!this.state.road.cartRepaired)return false;
  const r=B.runtime(this.sim);
  if(['assault','intermission'].includes(r.phase)){if(r.phase==='assault')this.run('beacon-repair');else this.api.toast('Regroup. Another breach is approaching.');return true;}
  if(r.phase==='arrival'){this.api.toast('The envoy is descending. The family is on its way.');return true;}
  this.open('beacon');return true;
 }
 paint(){
  const realmPage=this.realmAtlas.page(this.tab);
  const extra=this.hellCampaign.page(this.tab)||this.community.page(this.tab)||this.civic.page(this.tab)||this.expedition.page(this.tab)||this.worlds.page(this.tab)||(realmPage?{title:'Realms',html:realmPage}:null)||(this.tab==='gathering'?{title:'A Table After the Rain',html:this.gathering.page()}:null)||this.earth.page(this.tab)||this.cosmos.page(this.tab)||this.classes.page(this.tab)||this.characters.page(this.tab)||this.pursuit.page(this.tab)||this.starter.page(this.tab)||this.crossing.page(this.tab);
  const titles={equipment:'Your character',bag:'Your belongings',companion:'Your companion',soul:'The paths within',craft:'The workbench',journal:'Your journal',beacon:'The Beacon Answers',more:'Life in Firstlight',merchant:'Tessa’s road shop',pursuit:'Field guide'};
  $('#rpg-heading').textContent=extra?.title||titles[this.tab]||'Firstlight';
  $('#rpg-tabs').innerHTML=[['equipment','Equipment'],['bag','Inventory'],['companion','Companion'],['soul','Soul'],['craft','Crafting'],['pursuit','Field guide'],['journal','Journal'],['atlas','Map'],['characters','Characters'],['classes','Path'],['realms','Realms'],['worlds','Roads'],['expedition','Living road']].map(([id,n])=>button(n,'open',id,false,'aria-current="'+(this.tab===id?'page':'false')+'"'+(id==='realms'?' data-tab="realms"':'' ))).join('');
  const nav=$('#rpg-tabs'),active=nav.querySelector('[aria-current="page"]');if(active){const nr=nav.getBoundingClientRect(),ar=active.getBoundingClientRect();if(ar.right>nr.right-8)nav.scrollLeft+=ar.right-nr.right+12;else if(ar.left<nr.left+8)nav.scrollLeft-=nr.left+12-ar.left;}
  const body=$('#rpg-content');
  if(extra){body.innerHTML=extra.html;}
  else if(['equipment','bag'].includes(this.tab)){body.innerHTML=this.inventory();this.paintBag();this.attachPreview();}
  else if(this.tab==='craft')body.innerHTML=this.workbench();
  else if(this.tab==='companion')body.innerHTML=this.companion();
  else if(this.tab==='soul')body.innerHTML=this.soul();
  else if(this.tab==='journal')body.innerHTML=this.journal();
  else if(this.tab==='pursuit')body.innerHTML=this.pursuit.html();
  else if(this.tab==='beacon')body.innerHTML=this.beacon();
  else if(this.tab==='merchant')body.innerHTML=this.merchant();
  else body.innerHTML=this.more();
  if(['journal','more'].includes(this.tab))body.insertAdjacentHTML('beforeend',this.gathering.invitation());
  if(['pursuit','craft'].includes(this.tab))body.insertAdjacentHTML('afterbegin',this.expedition.fitting()+this.trails.fitting());
  if(!this.sim.room&&['atlas','more'].includes(this.tab))body.insertAdjacentHTML('afterbegin',this.worlds.invitation()+this.earth.invitation()+this.cosmos.invitation());
  if(this.tab==='craft')body.insertAdjacentHTML('afterbegin',G.RealmHomeHistoryUI.teaser(this.sim.state));
  if(this.tab==='journal')body.insertAdjacentHTML('afterbegin',G.RealmHomeHistoryUI.teaser(this.sim.state)+this.hellCampaign.journal()+this.community.invitation()+this.expedition.invitation()+this.trails.journal()+this.civic.journal()+this.starter.journal());if(this.tab==='characters')this.characters.attach();if(this.tab==='classes')this.classes.attach();
 }
 inventory(){
  const a=this.state,st=A.stats(a),slots=['weapon','armor','charm'];
  return `<div class="character-layout"><section class="paperdoll"><div class="character-name"><small>LEVEL ${st.level} · ${esc(G.RealmClasses.definition(a)?.name.toUpperCase()||'UNASSIGNED PATH')}</small><h3>${esc(this.sim.state.visitor.name)}</h3></div><div class="avatar-well"><div id="avatar-mount"></div><button data-rpg="preview-turn" aria-label="Rotate character preview">↻</button></div><div class="equipment-slots">${slots.map(slot=>{const id=a.equipment[slot],g=A.GEAR[id];return button('<i>'+icon(id?kind(id):slot==='weapon'?'blade':slot==='armor'?'armor':'charm',g?.color)+'</i><span><small>'+slot+'</small><b>'+esc(g?.name||'Empty slot')+'</b></span>'+(a.arsenal.sockets[id]?'<em>◆</em>':''),'item',id?'gear:'+id:'',!id);}).join('')}</div><div class="character-stats"><span><b>${st.attack}</b>Attack</span><span><b>${st.defense}</b>Guard</span><span><b>${st.maxHP}</b>Max health</span><span><b>${a.xp}</b>Experience</span></div><p class="fineprint">Three real slots. More equipment types come with their gameplay, not empty promises.</p></section><section class="bag-section"><div class="bag-heading"><h3>Inventory</h3><span>${icon('coin')} ${a.coins} sunmarks</span></div><div class="bag-tools"><input id="bag-search" placeholder="Find an item…" aria-label="Search inventory" value="${esc(this.search)}"><div id="bag-filters"></div></div><div id="bag-items" class="inventory-grid"></div><p class="fineprint">Select an item to inspect and compare. No items are destroyed by this screen.</p></section><section id="item-detail" class="item-detail" aria-live="polite"></section></div>`;
 }
 items(){const a=this.state,inv=this.sim.state.sandbox.inventory;
  return [
   ...a.owned.map(id=>({key:'gear:'+id,id,name:A.GEAR[id].name,category:'gear',n:1,...A.GEAR[id]})),
   ...Object.entries(inv).filter(([,n])=>n>0).map(([id,n])=>({key:'material:'+id,id,name:S.ITEMS[id].name,category:'materials',n,color:S.ITEMS[id].color})),
   ...Object.entries(a.arsenal.gems).filter(([,n])=>n>0).map(([id,n])=>({key:'gem:'+id,id,name:AR.GEMS[id].name,category:'gems',n,color:AR.GEMS[id].css})),
   ...[{id:'ore',name:'Copper ore',n:a.ore,color:'#d7a17c'},{id:'tonics',name:'Trail tonic',n:a.tonics,color:'#b9d6b1'}].filter(x=>x.n>0).map(x=>({...x,key:'supply:'+x.id,category:'materials'}))
  ].sort((x,y)=>x.category.localeCompare(y.category)||x.name.localeCompare(y.name));
 }
 paintBag(){
  if(!$('#bag-items'))return;const items=this.items(),filtered=items.filter(x=>(this.filter==='all'||x.category===this.filter)&&x.name.toLowerCase().includes(this.search.toLowerCase()));
  $('#bag-filters').innerHTML=[['all','All'],['gear','Gear'],['materials','Materials'],['gems','Gems']].map(([id,n])=>button(n,'filter',id,false,'aria-pressed="'+(id===this.filter)+'"')).join('');
  $('#bag-items').innerHTML=filtered.length?filtered.map(x=>button('<i style="--item-color:'+x.color+'">'+icon(kind(x.id),x.color)+'</i><span>'+esc(x.name)+'</span><b class="quantity">'+(x.n>1?x.n:'')+'</b>'+(this.state.equipment[x.slot]===x.id?'<small class="equipped-badge">EQUIPPED</small>':''),'item',x.key,false,'class="inventory-item '+(this.item===x.key?'selected':'')+'" title="'+esc(x.name)+'"')).join(''):'<p class="empty-bag">Nothing in this category yet. Gather or explore to find something worth keeping.</p>';
  let it=items.find(x=>x.key===this.item)||items.find(x=>x.key==='gear:'+this.state.equipment.weapon)||items[0];
  if(!it){$('#item-detail').innerHTML='<h3>A new beginning</h3><p>Visit Oren’s workshop for your first equipment.</p>'+button('Walk to Oren','go','workshop');return;}
  const a=this.state;let h='<div class="detail-art">'+icon(kind(it.id),it.color)+'</div><small class="item-tier">'+esc(it.tier||it.category)+'</small><h3 style="color:'+it.color+'">'+esc(it.name)+'</h3>';
  if(it.category==='gear'){
   const on=a.equipment[it.slot]===it.id,copy=JSON.parse(JSON.stringify(a));copy.equipment[it.slot]=it.id;const now=A.stats(a),next=A.stats(copy);
   h+='<p>'+esc(it.desc)+'</p><dl class="compare-stats">'+[['attack','Attack'],['defense','Guard'],['maxHP','Max health']].map(([k,n])=>'<div><dt>'+n+'</dt><dd>'+now[k]+' → '+next[k]+' <em class="'+(next[k]<now[k]?'negative':'positive')+'">'+(next[k]===now[k]?'—':(next[k]>now[k]?'+':'')+(next[k]-now[k]))+'</em></dd></div>').join('')+'</dl>'+button(on?'Equipped':'Equip '+it.slot,'equip',it.id,on,'class="primary"');
   if(it.slot==='weapon'){
    const gem=a.arsenal.sockets[it.id],station=AR.atBench(this.sim);
    h+='<p>River fittings: '+G.RealmPursuit.stage(a,it.id)+'/2 · +'+G.RealmPursuit.bonus(a,it.id)+' attack. Oren temper: +'+G.RealmStarter.bonus(a,it.id)+'. Realm fitting: +'+G.RealmCraft.bonus(a,it.id)+'.</p>'+button('Inspect equipment project','open','pursuit');
    h+='<div class="socket-detail"><h4>◆ Weapon socket</h4><p>'+(gem?esc(AR.GEMS[gem].name)+' · '+esc(AR.GEMS[gem].desc):'Empty. A fitted gem applies only while this weapon is equipped.')+'</p><label for="rpg-socket">Fit or reclaim</label><select id="rpg-socket"><option value="">Empty · reclaim fitted gem</option>'+Object.entries(AR.GEMS).map(([id,g])=>'<option value="'+id+'" '+(gem===id?'selected':'')+'>'+g.name+' · '+a.arsenal.gems[id]+' loose</option>').join('')+'</select>'+button(station?'Apply socket':'Visit a workbench to socket','socket',it.id,!station)+'</div>';
   }
  }else if(it.category==='gems')h+='<p>'+esc(AR.GEMS[it.id].desc)+'</p><p>Select an owned weapon and fit this at a workbench. Removing it returns the gem intact.</p><b>'+it.n+' in your pouch</b>';
  else{h+='<p>'+it.n+' in your inventory.</p>';if(S.ITEMS[it.id]){h+='<p>Used by crafting, construction or gathering. Tools are separate from your combat weapon.</p>'+button('Open crafting','open','craft');if(['wood','stone','fiber','crystal'].includes(it.id))h+=button('Find more nearby','gather',it.id);}else h+='<p>'+(it.id==='ore'?'Mine copper seams or collect encounter caches.':it.id==='coins'?'Earned from encounters and trades. Used by forging and Tessa’s shop.':'Skill 6 restores up to 48 health. Rest at the spring to refill.')+'</p>';}
  $('#item-detail').innerHTML=h;
 }
 recipes(){
  return [
   ...Object.entries(AR.RECIPES).map(([id,q])=>({id,name:q.name,desc:q.gear?A.GEAR[q.gear].desc:AR.GEMS[q.gem].desc,category:q.gear?'weapons':'gems',type:'arsenal',station:true,cost:{...q.materials,ore:q.ore||0,coins:q.coins||0},gear:q.gear,requires:q.requires})),
   {id:'copper_blade',name:'Copper-edged blade',desc:A.GEAR.copper_blade.desc,category:'weapons',type:'forge',station:true,cost:{...A.FORGE},gear:'copper_blade'},
   ...S.RECIPES.map(q=>({...q,name:S.ITEMS[q.id].name,type:'sandbox',category:['axe','pick'].includes(q.id)?'tools':['plank','block'].includes(q.id)?'components':'building'}))
  ];
 }
 workbench(){
  const a=this.state,inv=this.sim.state.sandbox.inventory,station=AR.atBench(this.sim),list=this.recipes().filter(r=>r.category===this.craftFilter),q=list.find(r=>r.id===this.recipe)||list[0];if(q)this.recipe=q.id;
  const categories=[['weapons','Weapons'],['tools','Tools'],['components','Components'],['building','Building'],['gems','Gems']];
  let h='<div class="workshop-banner"><div>'+icon('hammer')+'<div><small>'+(station?'AT AN OUTDOOR WORKBENCH':'BLUEPRINTS · NOT AT A WORKBENCH')+'</small><h3>'+(station?'Make something for the road.':'Plan here. Craft at the bench.')+'</h3></div></div><div>'+button('Walk to Oren','go','workshop')+button('Archery court','range','',!station||!!this.sim.room||!a.started)+'</div></div>';
  if(!a.started)h+='<div class="supplies-banner"><p><strong>Begin with Oren’s expedition kit.</strong> Trail blade, coat, lantern and three tonics.</p>'+button('Collect supplies','beacon-command','start',!station)+'</div>';
  h+='<div class="workshop-layout"><aside class="craft-categories">'+categories.map(([id,n])=>button(n,'craft-filter',id,false,'aria-pressed="'+(this.craftFilter===id)+'"')).join('')+'</aside><div class="recipe-list">'+list.map(r=>button(icon(kind(r.id))+'<span><b>'+r.name+'</b><small>'+(r.out?'Makes '+r.out:r.category==='gems'?'One removable gem':'One equipment item')+'</small></span>','recipe',r.id,false,'class="'+(q?.id===r.id?'selected':'')+'"')).join('')+'</div><section class="recipe-detail">';
  if(q){const have=k=>k==='ore'?a.ore:k==='coins'?a.coins:inv[k]||0,own=q.gear&&a.owned.includes(q.gear)||q.unique&&inv[q.id]>0,need=Object.entries(q.cost).filter(([,n])=>n>0),enough=need.every(([k,n])=>have(k)>=n),missingReq=q.requires&&!a.owned.includes(q.requires),allowed=enough&&(!q.station||station)&&!own&&!missingReq&&(q.type==='sandbox'||a.started);
   h+='<div class="detail-art">'+icon(kind(q.id))+'</div><h3>'+q.name+'</h3><p>'+q.desc+'</p><div class="recipe-costs">'+need.map(([k,n])=>'<div class="'+(have(k)>=n?'enough':'missing')+'">'+icon(kind(k))+'<span>'+esc(S.ITEMS[k]?.name||({ore:'Copper ore',coins:'Sunmarks'})[k])+'</span><b>'+have(k)+' / '+n+'</b></div>').join('')+'</div>'+(missingReq?'<p class="missing">Make the trail bow first; it will be kept.</p>':'')+button(own?'Already owned':!station&&q.station?'A workbench is required':!enough?'Missing materials':'Craft '+q.name,'craft',q.id,!allowed,'class="primary"')+'<p class="fineprint">Materials are spent only when crafting succeeds. No random failure.</p>';
  }return h+'</section></div>';
 }
 companion(){const c=this.state.companion;return '<div class="narrative-layout"><div class="companion-emblem">'+icon('paw')+'</div><section><small>A CAPABILITY YOU DO NOT HAVE</small><h3>'+esc(c.bonded?c.name:'A briarfox beneath Wildwood')+'</h3><p>'+(c.bonded?'Briar follows, fights beside you, and senses concealed things. Its name and bond persist.':'An injured animal is waiting in the mine’s western alcove. Clear the nearby threat, then offer help.')+'</p>'+(c.bonded?'<label for="rpg-companion-name">Companion name</label><input id="rpg-companion-name" maxlength="24" value="'+esc(c.name)+'"><div class="button-row">'+button('Keep name','rename')+button('Follow & assist','companion','follow',c.mode==='follow')+button('Stay','companion','stay',c.mode==='stay')+'</div><article><h4>4 · Briar’s insight</h4><p>Near enemies: reveal hidden invaders and expose your target for 6 seconds. Interrupts a winding-up attack. With no foe nearby on the Sunward Road, follows a buried scent instead.</p></article><p class="fineprint">No companion death, hunger or offline affection loss. Evolution is future content.</p>':button('Find the mine','go','mine'))+'</section></div>';}
 soul(){const b=this.state.beacon,s=b.soul;return '<div class="soul-intro"><small>HUMAN · FREE TO CHOOSE</small><h3>You are not your last choice.</h3><p>Radiance and corruption are separate story facts, not a hidden score judging ordinary play. Only explicit choices here change them. These are fictional game powers.</p></div><div class="soul-cards"><article>'+icon('light','#e9d39a')+'<h3>Radiance</h3><b>'+s.radiance+'</b><p>'+(s.grace?'You accepted the first Grace.':'You have not accepted a Grace.')+'</p>'+button('Equip Dawn aegis','soul-equip','aegis',!s.grace)+'</article><article>'+icon('flame','#dc899d')+'<h3>Corruption</h3><b>'+s.corruption+'</b><p>'+(b.relic==='accepted'?'The cinder is yours. Its first invocation records corruption.':'No infernal power is currently held.')+'</p>'+button('Equip Cinder surge','soul-equip','cinder',b.relic!=='accepted')+'</article><article>'+icon('book','#acbfae')+'<h3>History</h3><p>'+esc(s.scars.length?s.scars.map(x=>x==='cinder-invoked'?'Invoked the cinder':'Relinquished the cinder').join(' · '):'No infernal choice recorded.')+'</p><p>A relinquished power is gone; its history remains.</p>'+button('Remain mortal · empty skill 5','soul-equip','')+'</article></div><div class="button-row">'+button('Speak at the beacon','open','beacon')+(b.relic==='accepted'?button('Relinquish cinder at the beacon','power','soul-purify',!B.near(this.sim)):'')+'</div><p class="fineprint">Only one soul technique can be equipped. Neither choice changes your class, starts PvP, or harms other people.</p>';}
 journal(){if(this.state.beacon.complete&&this.quest==='story')return this.crossing.journal();const a=this.state,story=a.road.beaconLit&&a.road.cartRepaired?3:a.reward?2:1;let tasks=this.quest==='homestead'?S.objectives(this.sim.state.sandbox):story===3?[
 {title:'A road to Heaven',detail:'Return to the lit beacon and witness the descent.',done:a.beacon.introduced},
 {title:'The first infernal breach',detail:'Defend with Oren, Mara, Ilan and Briar. Three waves; keep the ward above zero.',done:a.beacon.complete},
 {title:'A community’s reward',detail:'Collect 15 sunmarks and a moonstone.',done:a.beacon.reward},
 {title:'A power left behind',detail:'Choose whether to keep or seal the cinder. Neither is forced.',done:a.beacon.relic!=='undecided'},
 {title:'The lost roads',detail:'Chart one future campaign destination. Five optional local roads are already available through Roads of Light.',done:!!a.beacon.route}]:story===2?G.RealmRoad.objectives(a):A.objectives(a);
 let h='<div class="journal-layout"><section><div class="journal-title"><small>'+(this.quest==='homestead'?'OPTIONAL FIELD GUIDE':'CHAPTER '+story)+'</small><h3>'+(this.quest==='homestead'?'A place of your own':story===3?'The Beacon Answers':story===2?'The Sunward Road':'The Feather Beneath Wildwood')+'</h3><div class="button-row">'+button('Story','track','story')+button('Homestead','track','homestead')+'</div></div>'+tasks.map((q,i)=>'<article class="quest-row '+(q.done?'complete':'')+'"><b>'+(q.done?'✓':i+1)+'</b><div><h4>'+q.title+'</h4><p>'+q.detail+'</p></div></article>').join('')+'</section><aside><h3>Find your way</h3>';
 if(this.sim.room==='road')h+=button('Tessa’s supplies & trading','open','merchant')+[['cart','Tessa’s camp'],['beacon','Sunward Beacon'],['scent','Western meadow'],['ruins','Northern ruins'],['exit','Waygate home']].map(([id,n])=>button(n,'road-route',id)).join('')+button('Beacon meeting','open','beacon');
 else if(this.sim.room==='mine')h+=['fox',...A.ENEMIES.map(e=>e.id),'relic','exit'].map(id=>button(({fox:'Fox alcove',relic:'Feather dais',exit:'Lantern exit'})[id]||A.ENEMIES.find(e=>e.id===id).name,'mine-route',id)).join('');
 else h+=button('Oren’s workshop','go','workshop')+button('Mine entrance','go','mine')+button('Far-water lookout · road gate','go','road')+button('Firstlight spring','go','spring');
 h+='<hr>'+button('Explore all places','panel','explore')+button('Construction & gardening','panel','build')+button('Notes & full chronicle','panel','chronicle')+'<p class="fineprint">Routes walk to a place. E acts when you arrive. Selecting a route does not complete a quest.</p></aside></div>';return h;
 }
 beacon(){const a=this.state,b=a.beacon,r=B.runtime(this.sim),near=B.near(this.sim),available=a.road.beaconLit&&a.road.cartRepaired;
  let h='<div class="beacon-intro"><small>THE SUNWARD BEACON</small><h3>'+(b.complete?'Earth answered.':b.introduced?'Hold the road open.':'It was a door.')+'</h3><p>'+(b.introduced?'The envoy holds the unstable passage. Oren repairs its ward, Mara reveals breaches, and Ilan keeps the signal steady. You and Briar defend the perimeter.':'Return to the lit beacon. An angel can cross where the ancient light has been restored.')+'</p></div>';
  if(!near)h+='<div class="notice">Actions require you beside the Sunward Beacon.</div>'+button(this.sim.room==='road'?'Walk to the beacon':'Find the road gate',this.sim.room==='road'?'road-route':'go',this.sim.room==='road'?'beacon':'road');
  if(!b.introduced)return h+button('Answer the beacon','beacon-command','beacon-answer',!near||!available,'class="primary"');
  if(!b.complete){h+='<div class="beacon-choices"><article><h4>“A world we thought lost has opened its door.”</h4><p>Heaven cannot hold this road without you. Hell has felt the light as well.</p><p><strong>Defend three breaches.</strong> The enemy attacks the ward as well as you. E beside the beacon repairs it for 20 stamina. The veiled desecrator can be revealed by Briar; Mara can also expose it.</p></article><article><h4>A first Grace</h4><p>Dawn aegis grants a temporary barrier. Accepting is optional; blade, bow, Brace and Briar are enough to attempt the defense.</p>'+button(b.soul.grace?'Grace accepted':'Accept Dawn aegis','beacon-command','beacon-grace',!near||b.soul.grace||r.phase==='arrival')+'</article></div>'+button(b.status==='corrupted'?'Reclaim the beacon':'Begin the defense','beacon-command','beacon-defend',!near||!['idle','ready','failed'].includes(r.phase),'class="primary"')+'<p class="fineprint">Health and tonics refill at the start. Losing begins a reclamation attempt; your home and earlier chapters are safe.</p>';return h;}
  h+='<div class="beacon-choices"><article><h4>The light held</h4><p>A one-time reward for keeping this road open.</p>'+button(b.reward?'Reward collected':'Claim 15 sunmarks + moonstone','beacon-command','beacon-reward',!near||b.reward)+'</article><article><h4>The herald’s cinder</h4><p>Its offer is real: a heavy strike for 12 health. The first use records corruption and a lasting history. Accepting it alone does not. You can relinquish the power here later.</p>'+(b.relic==='undecided'?'<div class="button-row">'+button('Keep the cinder','relic','accept',!near)+button('Seal it away','relic','seal',!near)+'</div>':'<p class="choice-record">Cinder: '+esc(b.relic)+'</p>')+'</article></div>';
  if(!b.soul.grace)h+=button('Accept the first Grace · optional','beacon-command','beacon-grace',!near||!['won','idle'].includes(r.phase));
  h+=button('Invite another breach · no repeat loot','beacon-command','beacon-replay',!near||!['won','idle'].includes(r.phase))+'<p class="fineprint">Repeat assaults let you try weapons and soul techniques. They do not award more money, gems or story completion. Cinder use still records your choice.</p>';
  h+='<h3>The roads beyond</h3><div class="network-map"><svg viewBox="0 0 700 190" aria-label="Future campaign beacon routes from the playable Sunward Beacon. These charted destinations remain unbuilt."><path d="M350 150 125 42M350 150 350 30M350 150 575 42M125 42 52 110M575 42 653 105" fill="none" stroke="#64766f" stroke-width="2" stroke-dasharray="5 7"/><g fill="#3c4c50" stroke="#97a99e"><circle cx="125" cy="42" r="12"/><circle cx="350" cy="30" r="12"/><circle cx="575" cy="42" r="12"/></g><g fill="#a54962"><circle cx="52" cy="110" r="7"/><circle cx="653" cy="105" r="7"/></g><circle cx="350" cy="150" r="16" fill="#efd098"/><g fill="#dfdccb" font-size="13" text-anchor="middle"><text x="125" y="73">Monastery</text><text x="350" y="62">Fallen kingdom</text><text x="575" y="73">Living forest</text><text x="350" y="183">Sunward · restored</text></g></svg></div><div class="button-row">'+Object.entries(B.ROUTES).map(([id,n])=>button((b.route===id?'Charted: ':'Chart: ')+n,'chart',id,!near)).join('')+'</div><p class="fineprint">The monastery, fallen kingdom and living forest remain charted future campaign regions. The five optional local realms are reached separately through Roads of Light.</p>';return h;
 }
 merchant(){const a=this.state,near=this.sim.room==='road'&&Math.hypot(this.sim.state.player.x+10,this.sim.state.player.z-12)<3,offers=[['mantle','Courier’s storm mantle','armor','18 sunmarks · +7 guard, +20 max health',a.coins<18||a.owned.includes('courier_mantle')],['tonic','Trail tonic','tonic','2 sunmarks · carry up to 3',a.coins<2||a.tonics>=3],['sell-copper','Sell two copper','stone','Receive 3 sunmarks',a.ore<2],['sell-berries','Sell two sunberries','seed','Receive 1 sunmark',this.sim.state.sandbox.inventory.berry<2]];return '<div class="notice">'+(near?'Tessa is ready to trade.':'Travel to Tessa’s camp on the Sunward Road to trade.')+' · '+a.coins+' sunmarks</div><div class="more-grid">'+offers.map(([id,name,ic,desc,disabled])=>button(icon(ic)+'<b>'+name+'</b><span>'+desc+'</span>','trade',id,!near||disabled||!a.road.cartRepaired)).join('')+'</div>'+button('Walk to Tessa’s camp','road-route','cart',this.sim.room!=='road')+'<p class="fineprint">Trades use your real local inventory. Online player trading is not part of this build.</p>';}
 more(){return '<div class="more-grid">'+[
 ['Class path','Compare Hunter and Magician. Choose deliberately at Oren’s workshop.','light','open','classes'],['Characters','Create, switch or export your separate local worlds.','charm','open','characters'],['Explore','Choose a named route through the valley.','map','panel','explore'],['Build','Your homestead, crops and construction.','house','panel','build'],['Music desk','Compose; export real WAV, MIDI and scores.','light','music',''],['People','Ilan, Mara and Oren’s lives and projects.','paw','panel','inhabitants'],['Your retreat','Arrange a private room and its colors.','house','panel','retreat'],['Appearance','Change your visitor’s name and palette.','charm','panel','visitor'],['Chronicle','Notes, local history and world backups.','book','panel','chronicle'],['Settings','Graphics, camera, sound and accessibility.','grid','panel','settings']
 ].map(([n,desc,ic,act,id])=>button(icon(ic)+'<b>'+n+'</b><span>'+desc+'</span>',act,id)).join('')+'</div><div class="button-row">'+button('Export world JSON','export')+button('Import a saved world','import')+'</div><p class="fineprint">Offline prototype · no accounts, online players or connected AI. Keep a JSON backup before changing versions.</p>';}
 attachPreview(){
  if(!$('#avatar-mount'))return;
  if(!this.avatarCanvas){this.avatarCanvas=document.createElement('canvas');this.avatarCanvas.setAttribute('aria-label','Your current procedural character, with equipped weapon');this.avatarCanvas.addEventListener('pointerdown',e=>{this.avatarDrag=e.clientX;this.avatarCanvas.setPointerCapture(e.pointerId);});this.avatarCanvas.addEventListener('pointermove',e=>{if(this.avatarDrag!==null&&this.avatarDrag!==undefined){this.previewYaw+=(e.clientX-this.avatarDrag)*.013;this.avatarDrag=e.clientX;}});this.avatarCanvas.addEventListener('pointerup',()=>{this.avatarDrag=null;});this.avatarCanvas.addEventListener('pointercancel',()=>{this.avatarDrag=null;});}
  $('#avatar-mount').append(this.avatarCanvas);
  if(this.preview===null)try{
   const e=new G.RealmEngine.Engine(this.avatarCanvas);e.quality='low';e.isInterior=true;e.ambientOverride=.72;e.resize(260,275,1);this.preview={e,batches:{}};for(const k of['box','octa','round','disc'])this.preview.batches[k]=e.batch(k,[],true);
  }catch{this.preview=false;this.avatarCanvas.replaceWith(Object.assign(document.createElement('p'),{textContent:'Character preview unavailable. Equipment and stats remain usable.'}));}
 }
 paintPreview(){if(!this.dialog.open||!this.preview||!$('#avatar-mount')||!this.avatarCanvas.isConnected)return;
  const out={box:[],octa:[],round:[],disc:[]},a=this.state,x=this.sim.state.visitor,yaw=this.previewYaw;
  G.RealmArt.WorldArt.prototype.person(out,0,0,yaw,A.GEAR[a.equipment.armor]?.color||G.RealmCreative.CLOAKS[x.cloak],0,false,'visitor',true,0,x);
  const col=A.GEAR[a.equipment.weapon]?.color||'#bcb590';
  if(a.equipment.weapon){const add=(xx,y,z,sx,sy,sz,c)=>out.box.push({p:[xx*Math.cos(yaw)+z*Math.sin(yaw),y,-xx*Math.sin(yaw)+z*Math.cos(yaw)],s:[sx,sy,sz],c,r:[0,yaw,0]});
   if(G.RealmCraft.bonus(a,a.equipment.weapon))add(.52,.96,.08,.22,.09,.18,'#a997cc');
   if(G.RealmStarter.bonus(a,a.equipment.weapon))add(.52,.52,.08,.20,.1,.17,'#82beb0');
   for(let i=0;i<G.RealmPursuit.stage(a,a.equipment.weapon);i++)add(.52,.69+i*.16,.09,.18,.065,.17,i?'#ece0b6':'#d39366');
   if(AR.weapon(a).style==='bow'){for(let i=0;i<11;i++){let u=i/10*Math.PI;add(.52+Math.sin(u)*.24,.24+i*.112,.12,.065,.14,.07,col);}add(.52,.8,.12,.022,1.1,.022,'#ddd5b8');}else{add(.52,.84,.08,.10,1.1,.10,col);add(.52,.58,.08,.4,.07,.13,'#c4a66f');}
  }
  out.disc.push({p:[0,-.08,0],s:[2.0,.12,2.0],c:0x566864});
  const e=this.preview.e,mount=$('#avatar-mount'),width=Math.max(100,Math.round(mount.clientWidth)),height=Math.max(140,Math.round(mount.clientHeight));if(this.preview.width!==width||this.preview.height!==height){e.resize(width,height,1);this.preview.width=width;this.preview.height=height;}for(const [k,b]of Object.entries(this.preview.batches))b.items=out[k];e.setCamera({eye:[3,2.1,6],target:[0,.8,0],half:Math.max(1.18,.83/(width/height)),aspect:width/height});e.render(0,10,false);
 }
 targetCue(){
  const cue=T.threat(this.sim),root=$('#target-cue');root.hidden=!cue;
  root.dataset.phase=cue?.phase||'';$('#target-cue-title').textContent='';$('#target-cue-detail').textContent='';if(!cue)return;
  const a=this.state,t=T.runtime(this.sim),braced=t.guardUntil>a.elapsed,ready=a.stamina>=T.skills.guard.cost&&a.elapsed>=t.cooldowns.guard;
  const defense=braced?'Braced · move clear if needed':ready?'Brace (3) or move clear':'Move clear · Brace unavailable';
  const copy=cue.phase==='recover'?['Recovery opening','Strike if ready; close if out of range']:cue.phase==='charge'?['Charging',defense]:({
   strike:['Marked strike',defense],charge:['Charge incoming',defense],
   'writ-sweep':['Writ sweep',defense+' · short wide lane'],
   'writ-line':['Writ line',defense+' · long narrow lane'],
   'bank-sweep':['Bank sweep',braced?'Braced · incoming damage reduced':ready?'Brace (3) or step beside the marked lane':'Step beside the lane · Brace unavailable'],
   'bell-outer':['Wide ring','Step into its quiet center'],
   'bell-inner':['Inner strike','Step out of the circle'],
   ward:['Beacon strike','The marked strike targets the ward']
  })[cue.kind];
  $('#target-cue-title').textContent=copy[0]+(cue.remaining===null?'':' · '+(Math.ceil(cue.remaining*10)/10).toFixed(1)+'s');
  $('#target-cue-detail').textContent=copy[1];
 }
 tick(){
  const sim=this.sim,a=this.state,t=T.runtime(sim),r=A.runtime(sim),b=B.runtime(sim),st=A.stats(a),e=T.selected(sim),w=AR.weapon(a),now=a.elapsed;
  document.body.classList.toggle('has-equipment',a.started);document.body.classList.toggle('rpg-battle',A.combatScene(sim));
  if(this.dialog.open&&performance.now()-this.lastPreview>45){this.paintPreview();this.lastPreview=performance.now();}
  const stage=a.road.beaconLit&&a.road.cartRepaired?3:a.reward?2:1;
  const obj=this.quest==='homestead'?S.objectives(sim.state.sandbox):stage===3?[B.objective(a)]:stage===2?G.RealmRoad.objectives(a):A.objectives(a),next=obj.find(x=>!x.done)||{title:'A place made your own',detail:'Explore, create, or choose the Story tracker.'};
  for(const el of document.querySelectorAll('.tracker-switch [data-rpg=track]'))el.setAttribute('aria-pressed',String(el.dataset.id===this.quest));
  $('#tracked-chapter').textContent=this.quest==='homestead'?'FIELD GUIDE · OPTIONAL':'CHAPTER '+stage;
  $('#tracked-title').textContent=next.title;$('#tracked-detail').textContent=next.detail;$('#tracked-progress').textContent=stage===3&&this.quest==='story'?'Journal · J':obj.filter(x=>x.done).length+' / '+obj.length+' complete · Journal J';
  $('#target-framing').disabled=!this.api.canFrameFoe?.();$('#target-frame').hidden=!e;if(e){$('#target-name').textContent=e.name;$('#target-rank').textContent=(e.kind==='practice'?'PRACTICE':e.kind==='boss'||e.kind==='charger'||e.kind==='siegeboss'?'ELITE':'HOSTILE')+' · '+Math.ceil(Math.hypot(e.x-sim.state.player.x,e.z-sim.state.player.z))+' PACES';$('#target-health-fill').style.width=e.hp/e.maxHP*100+'%';$('#target-state').textContent=Math.ceil(e.hp)+' / '+e.maxHP+' · '+T.readiness(sim);}
  $('#skillbar').hidden=!a.started;$('#rpg-health').textContent=Math.ceil(a.hp);$('#health-orb').style.setProperty('--hp',a.hp/st.maxHP*100+'%');$('#rpg-stamina').style.width=a.stamina+'%';$('#stamina-label').textContent=Math.floor(a.stamina)+' STAMINA';
  const classStatus=G.RealmClasses.status(sim),classDef=G.RealmClasses.definition(a),classButton=$('#skill-class');document.body.classList.toggle('has-class',!!classDef);classButton.hidden=!classDef;classButton.disabled=!classDef||!A.combatScene(sim)||sim.room==='range'||classStatus.remaining>0||a.stamina<classStatus.cost;classButton.querySelector('small').textContent=classDef?.id==='hunter'?'Mark':'Flare';classButton.querySelector('.skill-icon').textContent=classDef?.id==='hunter'?'⌁':'✦';classButton.querySelector('.skill-icon').style.color='#'+(classDef?.color||0xd4b175).toString(16).padStart(6,'0');classButton.querySelector('.skill-cooldown').textContent=classStatus.remaining>0?classStatus.remaining.toFixed(classStatus.remaining<1?1:0):'';classButton.title=classStatus.name+' · '+classStatus.cost+' stamina · '+classStatus.description;classButton.setAttribute('aria-label',classStatus.name+' · X'+(classStatus.remaining?' · '+classStatus.remaining.toFixed(1)+' seconds remaining':''));classButton.style.setProperty('--cool',Math.min(100,classStatus.remaining/classStatus.cooldown*100)+'%');
  const power=a.beacon.soul.equipped,buttons={auto:{cd:r.cooldowns.attack,cost:w.stamina,txt:w.style==='bow'?'Arrow':'Strike',name:w.primary,disabled:!A.combatScene(sim)},special:{cd:r.cooldowns.pulse,cost:30,txt:w.style==='bow'?'Pierce':'Sweep',name:w.special,disabled:!A.combatScene(sim)},guard:{cd:t.cooldowns.guard,cost:20,txt:'Brace',name:T.skills.guard.description,disabled:!A.combatScene(sim)},insight:{cd:t.cooldowns.insight,cost:0,txt:'Briar',name:T.skills.insight.description,disabled:!a.companion.bonded||a.companion.mode!=='follow'},spirit:{cd:t.cooldowns.spirit,cost:power==='aegis'?25:0,txt:power==='aegis'?'Aegis':power==='cinder'?'Cinder':'Unchosen',name:power?T.skills[power].description:'Choose a soul technique at the beacon, or remain mortal.',disabled:!power||!A.combatScene(sim)},heal:{cd:r.cooldowns.heal,cost:0,txt:'Tonic ×'+a.tonics,name:'Restore up to 48 health. Refill at the spring.',disabled:!a.tonics||a.hp>=st.maxHP},dodge:{cd:r.cooldowns.dodge,cost:22,txt:'Dodge',name:'Move out of harm. Brief avoidance, 22 stamina.',disabled:!A.combatScene(sim)}};
  for(const[id,q]of Object.entries(buttons)){const el=$('#skill-'+id),cool=Math.max(0,q.cd-now);el.querySelector('small').textContent=q.txt;el.querySelector('.skill-cooldown').textContent=cool>0?cool.toFixed(cool<1?1:0):'';el.title=q.name;el.disabled=!!q.disabled||(id!=='auto'&&(cool>0||a.stamina<q.cost));el.setAttribute('aria-label',q.txt+(cool>0?' · '+cool.toFixed(1)+' seconds remaining':''));el.style.setProperty('--cool',Math.min(100,cool/(id==='special'?5.5:id==='guard'?8:id==='insight'?10:id==='spirit'?18:3)*100)+'%');}
  if(this.lastWeapon!==w.style){$('#skill-auto .skill-icon').innerHTML=icon(w.style==='bow'?'bow':'blade');this.lastWeapon=w.style;}
  if(this.lastPower!==power){$('#skill-spirit .skill-icon').innerHTML=icon(power==='cinder'?'flame':'light',power==='cinder'?'#e99da9':'#f0d6a2');this.lastPower=power;}
  $('#skill-auto').classList.toggle('auto-on',t.auto);$('#skill-auto').setAttribute('aria-pressed',String(t.auto));$('#combat-help').textContent=classStatus.markedTarget?'Quarry marked · '+classStatus.markRemaining.toFixed(1)+'s · land a weapon hit':t.auto?T.readiness(sim):'TAB selects · 1 autoattack · 2–6 skills'+(classDef?' · X '+(classDef.id==='hunter'?'mark':'flare'):'')+' · SPACE dodge';
  $('#beacon-tracker').hidden=!(sim.room==='road'&&a.beacon.introduced);if(!$('#beacon-tracker').hidden){$('#beacon-phase').textContent=({arrival:'A road believed dead',ready:'Prepare the defense',assault:'Breach '+b.wave+' / 3',intermission:'Regroup · '+Math.max(0,Math.ceil(b.nextWave-b.time))+'s',failed:'The ward has fallen',won:'The light held'})[b.phase]||'The envoy awaits';$('#ward-fill').style.width=b.ward+'%';$('#beacon-status').textContent='Ward '+Math.ceil(b.ward)+' / 100 · '+(b.phase==='assault'?'E repairs near the light':'Your community stands beside you.');}
  const bm=$('#beacon-menu');bm.textContent=b.phase==='assault'?'Repair ward · E · 20 stamina':'Speak with the envoy · E';bm.disabled=b.phase==='assault'&&(!B.near(sim)||b.ward>=100||b.time<b.playerRepairAt||a.stamina<20);
  sim.presentation=sim.presentation||{};sim.presentation.attackTarget=t.target||(this.api.adventure().intent?.kind==='attack'?this.api.adventure().intent.id:null);
  const lastHit=t.hits.at(-1);if(lastHit&&this.soundedHit!==lastHit){this.soundedHit=lastHit;if(a.elapsed-lastHit.at<.25)this.api.adventure().sound('confirmed-hit');}
  this.targetCue();this.numbers();this.worldHealth();this.crossing.tick();this.starter.tick();this.pursuit.tick();this.cosmos.tick();this.earth.tick();this.gathering.tick();this.worlds.tick();this.trails.tick();this.expedition.tick();this.civic.tick();this.community.tick();this.hellCampaign.tick();
 }
 worldHealth(){
  const root=$('#enemy-health');root.replaceChildren();if(!this.sim.presentation?.perspective||!A.combatScene(this.sim))return;
  const selected=T.runtime(this.sim).target,player=this.sim.state.player;
  for(const e of A.runtime(this.sim).enemies){if(e.hp<=0||e.hidden||e.kind==='practice'||(e.id!==selected&&Math.hypot(e.x-player.x,e.z-player.z)>16))continue;
   const pos=this.api.project(e.x,e.kind==='boss'||e.custom==='bell'?5.4:e.eventEnemy?3.8:3.05,e.z);if(!pos?.visible)continue;
   const bar=document.createElement('div');bar.className='enemy-health'+(e.id===selected?' selected':'');bar.style.left=pos.x+'px';bar.style.top=pos.y+'px';const fill=document.createElement('i');fill.style.width=(100*e.hp/e.maxHP)+'%';bar.append(fill);root.append(bar);
  }
 }
 numbers(){const t=T.runtime(this.sim),now=this.state.elapsed,root=$('#combat-numbers');root.replaceChildren();for(const h of t.hits){const pos=this.api.project(h.x,3.3+(this.sim.state.settings.reducedMotion?0:now-h.at),h.z);if(!pos?.visible)continue;const el=document.createElement('span');el.textContent=h.n;el.style.left=pos.x+'px';el.style.top=pos.y+'px';el.style.opacity=String(Math.max(0,1-(now-h.at)/.9));root.append(el);}}
}
G.RealmRPGUI={RPGUI,icon};
})(globalThis);
