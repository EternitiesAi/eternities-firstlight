/* A small mechanical exhibition post. Read-only cues, never combat authority.
 * The quiet demonstration is scenery, with no participant, score or payout. */
(function(G){'use strict';
function draw(out,sim,t,art){const R=G.RealmEarthTournament,d=R.definition;if(sim.room!==d.room)return;
 const a=d.arena,E=G.RealmEarth,quiet=sim.state.settings.reducedMotion,live=R.view(sim),now=sim.state.adventure.elapsed;
 // North common is rendered as half-metre strips centred at x=0. Ground these
 // props on that actual surface, rather than the rules' per-x slope estimate.
 const h=z=>E.height(0,z),add=(kind,x,y,z,w,hi,depth,c,part,extra={})=>out[kind].push({p:[x,y,z],s:[w,hi,depth],c,rough:.88,cameraSolid:false,cutaway:false,appearanceOnly:true,tournamentPart:part,...extra});
 for(let i=0;i<40;i++){const ang=i*Math.PI/20,x=a.x+Math.sin(ang)*a.radius,z=a.z+Math.cos(ang)*a.radius;add('box',x,h(z)+.013,z,.065,.026,.42,0xe1d6b6,'chalk-boundary',{r:[0,ang,0]});}
 const b=h(a.z);add('box',a.x,b+.13,a.z,.92,.26,.92,0x726b57,'post-foot');add('box',a.x,b+1.0,a.z,.20,1.84,.20,0x827359,'post');
 const cycle=now%9,phase=live?.phase||(cycle<2?'ready':cycle<3.4?'tell':cycle<6.4?'opening':'rest'),aim=live?.aim||{x:a.x,z:a.z+3};
 const yaw=Math.atan2(aim.x-a.x,aim.z-a.z),c=phase==='opening'?0xeee6c9:phase==='tell'?0xd9ab58:0x748d85;
 const e=G.RealmAdventure.runtime(sim).enemies.find(e=>e.rainTournament&&R.owned(sim,e)),flash=e?.flash>now;
 add('box',a.x,b+1.25,a.z,.88,.92,.25,flash?0xf9ebac:0xab9770,'target-face',{r:[0,yaw,0]});
 add('box',a.x+Math.sin(yaw)*.14,b+1.25,a.z+Math.cos(yaw)*.14,.40,.46,.035,c,'target-mark',{r:[0,yaw,0]});
 add('box',a.x,b+2.15,a.z,.08,.55,.08,0x73654d,'pennant-pole');
 add('box',a.x+.28,b+(phase==='opening'?2.37:2.12),a.z,.50,.27,.045,c,'pennant',{r:[0,quiet?0:Math.sin(t*2)*.08,0]});
 if(phase==='tell'){
  const half=d.rounds[Math.min(live?.index||0,2)].halfWidth,length=a.radius,ux=Math.sin(yaw),uz=Math.cos(yaw);
  // Length and edges project the same locked one-sided strip used by the rules.
  for(let i=0;i<9;i++){const f=(i+.5)*length/9,x=a.x+ux*f,z=a.z+uz*f;add('box',x,h(z)+.045,z,half*2,.025,length/9,0xd6ab60,'warning-ribbon',{r:[0,yaw,0],em:.12});}
 }
 const p=d.giver;add('box',p.x-.9,h(p.z)+.65,p.z,.07,1.3,.07,0x726349,'rules-stand');add('box',p.x-.9,h(p.z)+1.31,p.z,.80,.07,.51,0xd8caa5,'rules-card');
 if(art?.person){const person={};for(const k of Object.keys(out))person[k]=[];art.person(person,p.x+.7,p.z+.15,Math.PI,'#698e88',quiet?0:t,false,'craftsperson',false,h(p.z+.15));for(const[k,items]of Object.entries(person))for(const item of items)out[k].push({...item,cameraSolid:false,cutaway:false,appearanceOnly:true,tournamentPart:'steward'});}
}
G.RealmEarthTournamentArt={draw};if(typeof module!=='undefined')module.exports=G.RealmEarthTournamentArt;
})(globalThis);
