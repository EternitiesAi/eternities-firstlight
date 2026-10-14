/* Commission controls project saved rules; previewing never performs work. */
(function(G){'use strict';
const M=()=>G.RealmEarthMasterwork,D=()=>M().definition,TAB='earth-masterwork';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(text,type,id='',attrs='')=>'<button data-rpg="masterwork-'+type+'" data-id="'+esc(id)+'" '+attrs+'>'+esc(text)+'</button>';
function comparison(a,id){const AR=G.RealmArsenal,g=G.RealmAdventure.GEAR[id];if(!g||g.slot!=='weapon')return'';
 const old=AR.special(a,{weapon:id,learned:false}),next=AR.special(a,{weapon:id,learned:true}),candidate={...a,equipment:{...a.equipment,weapon:id}},attack=G.RealmAdventure.stats(candidate).attack;
 const row=(label,x,y)=>'<tr><th scope="row">'+label+'</th><td>'+esc(x)+'</td><td>'+esc(y)+'</td></tr>',coverage=f=>f.targets==='radial'?'All visible nearby foes':f.pierce===2?'Up to two bodies in flight':'One target';
 return'<table class="guide-comparison masterwork-comparison"><caption>'+esc(g.name)+' · special on 2/Q if equipped</caption><thead><tr><th scope="col">Effect</th><th scope="col">'+old.name+'</th><th scope="col">'+next.name+'</th></tr></thead><tbody>'+row('Damage before enemy/class modifiers',Math.round(attack*old.multiplier),Math.round(attack*next.multiplier))+row('Stamina',old.cost,next.cost)+row('Recovery',old.cooldown+'s',next.cooldown+'s')+row('Reach',old.reach+'m',next.reach+'m')+row('Coverage',coverage(old),coverage(next))+'</tbody></table><p class="fineprint">Lower cost and shorter recovery trade away burst and coverage. Primary attacks, guard, health, socket and existing fittings stay unchanged. Both forms share the same current recovery timer.</p>';
}
class MasterworkUI{
 constructor(rpg){this.rpg=rpg;this.pending=null;}
 get sim(){return this.rpg.sim;}get state(){return M().status(this.sim);}
 reset(){this.pending=null;}
 ticket(){return this.rpg.api.masterworkContext();}
 attrs(){const c=this.ticket();return'data-owner="'+esc(c.active)+'" data-revision="'+this.sim.state.adventure.revision+'"';}
 act(text,type,id=''){return btn(text,type,id,this.attrs());}
 same(p){return p&&p.sim===this.sim&&p.state===this.sim.state&&p.active===this.ticket().active&&p.revision===this.sim.state.adventure.revision;}
 local(){if(!M().eligible(this.sim.state))return null;if(M().at(this.sim,D().giver))return D().giver;return this.state.accepted&&this.rpg.quest===TAB?D().evidence.find(p=>M().at(this.sim,p))||null:null;}
 context(){const p=this.local();return p?'E · '+p.name:null;}
 interact(){if(!this.local())return false;this.rpg.open(TAB);return true;}
 envelope(el){return{quest:D().id,expectedActive:el.dataset.owner,expectedRevision:Number(el.dataset.revision)};}
 submit(type,payload){this.rpg.close();const result=this.rpg.api.masterworkCommand(type,payload);this.rpg.api.toast(result.ok?result.text:result.error);if(result.ok&&!result.duplicate&&type==='accept')this.rpg.quest=TAB;this.rpg.open(TAB);return result;}
 action(el){const action=el.dataset.rpg;if(!action?.startsWith('masterwork-'))return false;const type=action.slice(11),id=el.dataset.id;
  if(type==='open'){this.rpg.open(TAB);return true;}
  if(type==='track'){this.rpg.quest=TAB;this.rpg.tick();return true;}
  if(type==='walk'){const p=id==='giver'?D().giver:D().evidence.find(e=>e.id===id);if(p&&p.room===this.sim.room){this.rpg.close();this.rpg.api.walkLocal(p.x,p.z);}return true;}
  if(type==='cancel'){this.pending=null;this.rpg.paint();return true;}
  if(type==='preview-learn'||type==='preview-resolve'){
   const c=this.ticket();this.pending={type:type.slice(8),id,sim:this.sim,state:this.sim.state,active:c.active,revision:this.sim.state.adventure.revision};this.rpg.paint();return true;
  }
  if(type==='confirm'){
   const pending=this.pending;if(!this.same(pending)){this.pending=null;this.rpg.api.toast('The character changed. Read the current terms again.');this.rpg.paint();return true;}
   const payload={quest:D().id,expectedActive:pending.active,expectedRevision:pending.revision,[pending.type==='learn'?'weapon':'resolution']:pending.id};this.pending=null;this.submit(pending.type,payload);return true;
  }
  const fields={inspect:'evidence',compare:'finding',participation:'participation',enable:'enabled'};
  if(['accept','inspect','compare','participation','enable'].includes(type)){const payload=this.envelope(el);if(fields[type])payload[fields[type]]=type==='enable'?id==='true':id;this.submit(type,payload);}return true;
 }
 journal(){const q=this.state;return'<section class="earth-invitation"><small>EARTH · ONE COMMISSION</small><h3>'+D().title+'</h3><p>'+(q.resolution?'The corrected credit is retained. Your optional weapon lesson remains separate.':q.accepted?M().next(this.sim).name:D().summary)+'</p>'+btn(q.accepted?'Review the commission':'Read the apprentice’s request','open')+'</section>';}
 lesson(id){const a=this.sim.state.adventure,q=this.state;if(!id||!G.RealmAdventure.GEAR[id]||G.RealmAdventure.GEAR[id].slot!=='weapon')return'';
  let html=comparison(a,id);if(q.weapon===id)html+='<p><strong>Lesson learned · '+(q.enabled?'lesson selected':'original special selected')+'</strong></p>'+this.act(q.enabled?'Use original special':'Use learned special','enable',String(!q.enabled));
  else if(q.weapon)html+='<p>The finite lesson belongs to '+esc(G.RealmAdventure.GEAR[q.weapon].name)+'. This weapon retains its ordinary special.</p>';
  else html+='<p>'+(q.resolution?'The lesson is offered, unchosen. Choose one owned weapon at the workshop.':'Complete the apprentice’s commission to be offered this optional lesson.')+'</p>'+btn('Read masterwork commission','open');return'<section class="masterwork-lesson">'+html+'</section>';
 }
 travel(p){if(p.room===this.sim.room)return btn('Walk to '+p.name,'walk',p===D().giver||p.id==='workshop-apprentice'?'giver':p.id);return p.room===null?'<p>Take the free Hearthwater return to Firstlight, then visit the workshop.</p><button data-rpg="open" data-id="atlas">Read current map</button>':'<p>From Firstlight’s lake, enter Hearthwater. Cross the long footbridge, follow the eastern mill-road fork, and continue along the ridge to Darric’s quarry order.</p><button data-rpg="open" data-id="earth">Read the Hearthwater trail</button>';}
 page(tab){if(tab!==TAB)return null;const q=this.state,a=this.sim.state.adventure,d=D(),near=M().at(this.sim,d.giver);
  let html='<article class="earth-reading masterwork-reading"><small>HEARTHWATER COMMISSION</small><h2>'+d.title+'</h2><p class="earth-quote">“My marks are in the stone. My name isn’t in the account. I want the work corrected—but I need a say in how.”</p><p>'+esc(d.summary)+'</p><p>'+esc(d.route)+'</p><section class="masterwork-offer"><h3>The same offer, for either correction</h3><p>'+esc(d.reward)+'</p>'+comparison(a,a.equipment.weapon||'trail_blade')+'</section>';
  if(!a.started)html+='<p>Collect your expedition kit from Oren first.</p>';
  else if(!q.accepted)html+=near?this.act('Accept the commission · no cost','accept'):this.travel(d.giver);
  else{
   html+='<ol class="masterwork-evidence">'+d.evidence.map(p=>'<li data-masterwork-evidence="'+p.id+'"><h3>'+esc(p.name)+(q.evidence.includes(p.id)?' · retained':'')+'</h3><p>'+esc(q.evidence.includes(p.id)?p.text:p.hint)+'</p>'+(q.evidence.includes(p.id)?'':M().at(this.sim,p)?this.act('Inspect this physical evidence','inspect',p.id):this.travel(p))+'</li>').join('')+'</ol>';
   if(!q.compared&&q.evidence.length===3)html+='<section><h3>What identifies the maker?</h3>'+(near?this.act('The stamp alone proves who cut the pattern','compare','stamp-proves-maker')+this.act('The earlier toolmarks match the assigned order','compare','maker-before-stamp'):this.travel(d.giver))+'</section>';
   if(q.compared&&!q.participation)html+='<section><h3>Ask the apprentice how to participate</h3><p>The evidence is compared. A private correction protects their name; a co-authored correction permits public credit. Neither choice changes the lesson.</p>'+(near?this.act('Ask for a private correction','participation','private')+this.act('Invite the apprentice to co-author the correction','participation','coauthor'):this.travel(d.giver))+'</section>';
   if(q.participation&&!q.resolution)html+='<section><h3>Agree on the correction</h3><p>'+esc(q.participation==='private'?'The apprentice asked to remain private.':'The apprentice has agreed to co-author the public correction; a private correction remains possible.')+'</p>'+d.resolutions.filter(r=>r.id!=='public-correction'||q.participation==='coauthor').map(r=>'<h4>'+esc(r.name)+'</h4><p>'+esc(r.text)+'</p>'+(near?btn('Review '+r.name,'preview-resolve',r.id):'')).join('')+(!near?this.travel(d.giver):'')+'</section>';
   if(q.resolution)html+='<section class="masterwork-recorded"><h3>'+esc(d.resolutions.find(r=>r.id===q.resolution).name)+'</h3><p>'+esc(d.resolutions.find(r=>r.id===q.resolution).text)+'</p><p>“The account now tells the truth about the work. There is a place for your next commission here.” — workshop apprentice</p></section>';
   if(q.resolution&&!q.weapon)html+='<section><h3>Choose one weapon to learn with—or leave this offer open</h3><p>This choice binds the finite lesson to that existing weapon. Nothing equips or enables itself.</p>'+a.owned.filter(id=>G.RealmAdventure.GEAR[id].slot==='weapon').map(id=>comparison(a,id)+(near?btn('Review lesson for '+G.RealmAdventure.GEAR[id].name,'preview-learn',id):'')).join('')+(!near?this.travel(d.giver):'')+'</section>';
   if(q.weapon)html+=this.lesson(q.weapon)+'<button data-rpg="open" data-id="equipment">Inspect and equip your weapon</button><button data-rpg="pursuit-route" data-id="practice">Try it at the practice worksite</button>';
   html+=btn('Track this commission','track');
  }
  if(this.pending){const p=this.pending,r=d.resolutions.find(r=>r.id===p.id),g=G.RealmAdventure.GEAR[p.id];html+='<section class="masterwork-confirm" aria-label="Confirm masterwork choice"><h3>Confirm '+esc(p.type==='learn'?g?.name:r?.name)+'</h3><p>'+esc(p.type==='learn'?'Bind the single lesson to this owned weapon. Your original special remains selected; equip and enable deliberately afterward.':r?.text)+'</p>'+(this.same(p)?btn('Confirm this choice','confirm'):'<p>The character changed. Cancel and review again.</p>')+btn('Cancel · keep the choice open','cancel')+'</section>';}
  return{title:d.title,html:html+'<p class="fineprint">V switches camera views. Reading and walking perform no work. Cold reload retains the commission and returns you to your existing Firstlight checkpoint.</p></article>'};
 }
 tick(){const doc=G.document,q=this.state,toggle=doc?.querySelector('.tracker-switch [data-id="earth-masterwork"]');if(toggle)toggle.hidden=!q.accepted;if(this.pending&&!this.same(this.pending))this.pending=null;if(this.rpg.quest!==TAB)return;const p=M().next(this.sim),detail=q.weapon?'Lesson retained · inspect equipment and choose its special':q.resolution?'Correction retained · optional lesson unchosen':p.room!==this.sim.room?p.room===null?'Return to Firstlight’s workshop':'Hearthwater · eastern quarry road':p.name;for(const[sel,text]of Object.entries({'#tracked-chapter':'EARTH · A MASTERWORK’S CREDIT','#tracked-title':D().title,'#tracked-detail':detail,'#tracked-progress':q.resolution?'Correction retained · J to review':q.evidence.length+'/3 evidence · J account · M routes'})){const e=doc?.querySelector(sel);if(e)e.textContent=text;}}
}
const api={MasterworkUI,comparison};G.RealmEarthMasterworkUI=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
