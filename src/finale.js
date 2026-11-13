/* The finale's rules, with no simulation and no save. The echo ledger becomes chains and freed allies; the tables in
 * finale-data.js say who, where and how long. Every story line is read from the story script (scene(id, state)); a
 * scene the script does not hold reads as nothing, never as an old stand-in. earth-homecoming.js owns the state and the fight. */
(function(G){'use strict';
const T=()=>G.RealmFinaleData||(typeof require==='function'?require('./finale-data.js'):null);
const group=id=>String(id||'').split('-')[0];
const site=realm=>T().SITES[realm]||T().SITES.spring;
// the boss table is another lane's. a missing or malformed table keeps the data's three bodies.
function phases(){
 const fallback=T().BODIES,list=typeof G.RealmDifficulty?.boss==='function'?G.RealmDifficulty.boss('regent')?.phases:null;
 const ok=Array.isArray(list)&&list.length===3&&list.every(p=>Number.isFinite(p?.hp)&&p.hp>0&&Number.isFinite(p?.damage)&&p.damage>0);
 return Object.freeze((ok?list:fallback).map((p,i)=>Object.freeze({id:String(p.id||fallback[i].id),hp:p.hp,damage:p.damage})));
}
// chain i appears at its time, and the i-th freed person breaks chain i shortly after. with no chain left they just arrive.
function plan(ledger){
 const d=T(),t=d.TIMING,coercive=ledger?.coercive||[],freeing=ledger?.freeing||[],budget=phases()[0].hp,n=Math.max(1,coercive.length);
 const chains=(coercive.length?coercive:[null]).map((e,i)=>({id:e?'chain-'+e.id:'chain-spring',echo:e?e.id:null,line:e?e.line:'',site:site(e?group(e.id):'spring'),hp:Math.floor(budget/n)+(i<budget%n?1:0),appearAt:t.firstChain+i*t.chainGap}));
 const allies=freeing.map((e,i)=>{const c=chains[i]||null,card=d.ALLY_CARDS[e.id]||{name:e.ally,color:'#c9b79c',line:e.line};return{id:'ally-'+e.id,echo:e.id,ally:card.name,color:card.color,line:card.line,site:site(group(e.id)),breaks:c?c.id:null,arriveAt:(c?c.appearAt:t.firstChain+i*t.chainGap)+t.freedDelay};});
 return{chains,allies};
}
// one anchor per realm the valley remembers; lit when that realm's choice was freed.
function anchors(ledger){const freed=new Set((ledger?.freeing||[]).map(e=>group(e.id)));return Object.keys(T().SITES).filter(k=>k!=='spring').map(realm=>({realm,x:T().SITES[realm].x,z:T().SITES[realm].z,label:T().SITES[realm].label,lit:freed.has(realm)}));}
// the script's scene for a key. the interface words stay local; everything else is the story's.
const SCENE={begin:'finale.rise',eve:'finale.eve',allies:'finale.allies',runs:'finale.runs',down:'finale.offer',offer:'finale.offer',refused:'finale.answer',taken:'finale.answer',last:'finale.last',won:'finale.ending',credits:'epilogue.credits','merged.stair':'finale.merged.stair','merged.road':'finale.merged.road','merged.briar':'finale.merged.briar'};
function script(){if(!G.RealmStoryScript&&typeof require==='function'){try{require('./story-script.js');}catch{}}return G.RealmStoryScript||null;}
function scene(id,state){const S=script();return S&&S.scene?S.scene(id,state):null;}
const joined=s=>s?s.lines.map(l=>l.text).join(' '):'';
// a key is either an interface word (LINES) or a story line (the script). unknown keys read as nothing.
function text(key,state){if(Object.hasOwn(T().LINES,key))return T().LINES[key];return joined(scene(SCENE[key]||key,state));}
// the options a scene offers, with the script's own labels; an empty list when the scene offers none.
function choices(key,state){const s=scene(SCENE[key]||key,state);return s&&s.choice?s.choice.options.map(o=>({id:o.id,label:o.label})):[];}
// a chain or an ally, by its echo id: the script's own line when it has one, else the given fallback (empty by default).
function chainText(echo,state,fallback=''){return joined(scene('finale.chain.'+(echo||'spring'),state))||fallback;}
function allyText(echo,state,fallback=''){return joined(scene('finale.ally.'+echo,state))||fallback;}
// the finale is on while the Regent is up: the valley's envoy steps off the spring for the fight.
function fighting(state){const s=state?.saga?.finale;return !!s&&s.phase>=1&&s.phase<=3&&!s.won&&!state.saga.credits;}
// after the credits the tracker reads this card in place of any chapter: the roads stay open, and the side work is still there.
function postgameCard(state){if(!state?.saga?.postgame)return null;const L=T().LINES;return{title:L.postgameTitle,detail:L.postgameDetail,progress:L.postgameProgress};}
const api=Object.freeze({phases,plan,anchors,timing:()=>T().TIMING,route:()=>T().ROUTE,text,choices,scene,chainText,allyText,group,fighting,postgameCard});
G.RealmFinale=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
