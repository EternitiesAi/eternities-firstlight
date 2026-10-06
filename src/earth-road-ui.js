/* Readable, deliberately confirmed local Earth connection. No progression authority. */
(function(G){'use strict';const R=G.RealmEarthRoad;
const button=(label,action)=>'<button data-rpg="earth-road-'+action+'">'+label+'</button>';
class EarthRoadUI{
 constructor(rpg){this.rpg=rpg;this.ticket=null;}
 get sim(){return this.rpg.sim;}
 reset(){R.cancel(this.ticket);this.ticket=null;}
 context(){return R.route(this.sim)?'E · '+(this.sim.room===G.RealmEarth.ROOM?'Coastward road':'Hearthwater road'):null;}
 interact(){if(!this.context())return false;this.reset();this.rpg.open('earth-road');return true;}
 action(el){const a=el.dataset.rpg;if(!a?.startsWith('earth-road-'))return false;
  if(a==='earth-road-read'){this.reset();this.rpg.open('earth-road');}
  if(a==='earth-road-walk'){const p=R.endpoint(this.sim.room);if(p){this.rpg.close();this.rpg.api.walkLocal(p.x,p.z);}}
  if(a==='earth-road-confirm'){const r=this.rpg.api.earthRoadTravel(this.ticket);this.ticket=null;if(r.ok){this.rpg.close();this.rpg.api.toast(r.text);}else{this.rpg.api.toast(r.error);this.rpg.paint();}}
  return true;
 }
 invitation(){const p=R.endpoint(this.sim.room);return p?'<section class="earth-invitation earth-road-invitation"><small>CONNECTED EARTH ROADS</small><h3>'+p.name+'</h3><p>Follow the signed track to the neighboring region. Keep your original home checkpoint and accepted work.</p>'+button('Read the road and return route','read')+'</section>':'';}
 page(tab){if(tab!=='earth-road')return null;const p=R.endpoint(this.sim.room);if(!p)return{title:'Earth roads',html:'<p>Find this connection on the Hearthwater northern fork or the Coastward arrival bank.</p>'};
  const out=this.sim.room===G.RealmEarth.ROOM;if(!this.ticket){const v=R.preview(this.rpg.api.worldContext());if(v.ok)this.ticket=v.ticket;}
  return{title:out?'The road to Coastward':'The road through Hearthwater',html:'<article class="earth-reading earth-road-reading"><small>ORDINARY EARTH TRAVEL</small><h2>'+(out?'Follow the channel-bank track.':'The orchard road leads home.')+'</h2><p class="earth-quote">'+(out?'Cart ruts turn east before Bellweather’s bell. Beyond the bend, a long timber bridge joins working fields and woodland.':'The channel bank narrows into the familiar ridge and orchard roads. The lake footbridge leads back toward Firstlight.')+'</p><div class="earth-terms"><section><h3>The route ahead</h3><p>'+(out?'The arrival bank leads across the channel bridge to Vessa, Merren’s fields and Rill’s woodland circuit. Follow local maps and return by this same signed track.':'The northern fork joins both Hearthwater lanes. Go west for the riverbank worksite and shelter, or follow the ridge south to the lake footbridge.')+'</p></section><section><h3>Work and danger</h3><p>'+(out?'Coastward has optional local work and hostile creatures in its side paths. Accept work deliberately with each giver; existing materials and equipment projects keep their declared rewards.':'Hearthwater’s main roads are quiet. The riverbank has hostile creatures and requires Oren’s initial expedition kit. Bellweather retains its existing chapter prerequisites.')+' This road grants no XP, item, quest acceptance or story choice.</p></section><section><h3>Your original way home</h3><p>Return to Firstlight stays free from either region. Saving, reopening or switching characters resumes at your original Firstlight departure point, retaining earned progress.</p></section></div><div class="earth-actions">'+(this.ticket?button(out?'Continue on foot to Coastward':'Follow the road to Hearthwater','confirm'):button('Walk to the signed continuation','walk'))+'<button data-rpg="open" data-id="atlas">Read the local map</button></div><p class="earth-note">V exchanges your remembered third person and diorama views. Crossing preserves your selected tracker.</p></article>'};
 }
}
G.RealmEarthRoadUI={EarthRoadUI};
})(globalThis);
