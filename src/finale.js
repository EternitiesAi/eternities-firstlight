/* The finale's rules, with no simulation and no save. The echo ledger becomes chains and freed allies; the tables in
 * finale-data.js say who, where and how long. earth-homecoming.js owns the state and the fight. */
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
 const chains=(coercive.length?coercive:[null]).map((e,i)=>({id:e?'chain-'+e.id:'chain-spring',echo:e?e.id:null,line:e?e.line:d.LINES.defaultChain,site:site(e?group(e.id):'spring'),hp:Math.floor(budget/n)+(i<budget%n?1:0),appearAt:t.firstChain+i*t.chainGap}));
 const allies=freeing.map((e,i)=>{const c=chains[i]||null,card=d.ALLY_CARDS[e.id]||{name:e.ally,color:'#c9b79c',line:e.line};return{id:'ally-'+e.id,echo:e.id,ally:card.name,color:card.color,line:card.line,site:site(group(e.id)),breaks:c?c.id:null,arriveAt:(c?c.appearAt:t.firstChain+i*t.chainGap)+t.freedDelay};});
 return{chains,allies};
}
// one anchor per realm the valley remembers; lit when that realm's choice was freed.
function anchors(ledger){const freed=new Set((ledger?.freeing||[]).map(e=>group(e.id)));return Object.keys(T().SITES).filter(k=>k!=='spring').map(realm=>({realm,x:T().SITES[realm].x,z:T().SITES[realm].z,label:T().SITES[realm].label,lit:freed.has(realm)}));}
const api=Object.freeze({phases,plan,anchors,timing:()=>T().TIMING,route:()=>T().ROUTE,text:key=>T().LINES[key]??'',group});
G.RealmFinale=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
