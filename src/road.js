/* Firstlight 07: authored surface expedition. Owns geometry and persisted
 * chapter facts. No network, financial service or model-generated character. */
(function(G){'use strict';
const D=G.RealmDifficulty||(typeof require==='function'?require('./difficulty.js'):null);
const GATE=Object.freeze({x:44,z:6}),ENTRY=Object.freeze({x:0,z:17,yaw:Math.PI}),MERCHANT=Object.freeze({x:-10,z:12}),BEACON=Object.freeze({x:0,z:-24});
const ENEMIES=Object.freeze([
{id:'road-prowler',name:'Thicket prowler',kind:'skitter',x:-2,z:8,hp:65,damage:13,xp:20,ore:1,coins:5,windup:.75,poise:true},
{id:'road-prism',name:'Gloam prism',kind:'sentinel',x:6,z:-8,hp:95,damage:16,xp:25,ore:2,coins:7,windup:1.05,poise:true},
{id:'road-ram',name:'The Sunscar Ram',kind:'charger',boss:true,x:0,z:-19,hp:D.boss('ram').hp,damage:D.boss('ram').damage,xp:55,ore:3,coins:12,windup:D.boss('ram').windup,attackOrder:['charge','bait','line'],attackSpec:{bait:{windup:1.4,length:13,stun:2.8},line:{windup:1.1,length:5,half:.8}}}]);
const CACHES=Object.freeze([{id:'cart-latch',name:'The missing brass latch',x:-11,z:3,ore:1,coins:2},{id:'old-surveyor',name:'A surveyor’s lost cache',x:11,z:-13,ore:2,coins:5}]);
const OBSTACLES=Object.freeze([{x:-5,z:-10,r:2},{x:10,z:10,r:1.5},{x:-10,z:-17,r:1.3},{x:14,z:-3,r:1.2},{x:-13,z:-4,r:1.3},{x:7,z:-22,r:1.4},{x:-12.2,z:11,w:2.6,d:3},{x:-13,z:-22,w:3,d:3.5},{x:13,z:15,r:1.1},{x:15,z:-18,r:1.2}]);
const TREES=[[-12,17,1.05,1],[-15,8,1.1,0],[-16,1,1,2],[-14,-9,1.2,0],[-13,-14,.9,1],[-8,-23,1,0],[-4,-26,.8,1],[5,-25,.65,1],[11,-20,1.1,0],[15,-13,1,1],[16,-7,.9,0],[15,3,1.1,2],[13,8,1.2,1],[10,16,1,1],[6,19,.8,2],[-6,19,.8,0]];
const SOLIDS=[...OBSTACLES,...TREES.map(t=>({x:t[0],z:t[1],r:.24*t[2]}))];
function land(x,z,r=0){return Number.isFinite(x)&&Number.isFinite(z)&&(Math.pow(x/(18-r),2)+Math.pow((z+3)/(26-r),2)<1);}
function riverZ(x){return Math.sin(x*.13)*.6;}
function walkable(x,z,r=.31){if(!land(x,z,r))return false;if(Math.abs(z-riverZ(x))<1.8+r&&Math.abs(x-2)>2.4-r)return false;for(const o of SOLIDS)if(o.r!==undefined?Math.hypot(x-o.x,z-o.z)<o.r+r:Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r)return false;return true;}
function line(a,b){if(!a||!b||!walkable(a.x,a.z,.04)||!walkable(b.x,b.z,.04))return false;const n=Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.15);for(let i=0;i<=n;i++){const u=n?i/n:0;if(!walkable(a.x+(b.x-a.x)*u,a.z+(b.z-a.z)*u,.04))return false;}return true;}
function fresh(){return{version:1,entered:false,revealed:[],claimed:[],cartRepaired:false,beaconLit:false,reported:false};}
function validate(raw,adventure){const bad=k=>{throw Error('Invalid road: '+k);};if(!raw||raw.version!==1)bad('version');const s=fresh();for(const k of['entered','cartRepaired','beaconLit','reported']){if(typeof raw[k]!=='boolean')bad(k);s[k]=raw[k];}for(const k of['revealed','claimed']){if(!Array.isArray(raw[k])||raw[k].length>CACHES.length||new Set(raw[k]).size!==raw[k].length||raw[k].some(id=>!CACHES.some(c=>c.id===id)))bad(k);s[k]=raw[k].slice();}if(s.claimed.some(id=>!s.revealed.includes(id)))bad('unrevealed cache claim');if(!s.entered&&(s.revealed.length||s.cartRepaired||s.beaconLit||s.reported))bad('entry prerequisites');if(s.cartRepaired&&!s.claimed.includes('cart-latch'))bad('cart prerequisites');if(s.reported&&(!s.beaconLit||!s.cartRepaired))bad('return prerequisites');if(adventure){if(s.entered&&!adventure.reward)bad('chapter I incomplete');if(s.revealed.length&&!adventure.companion.bonded)bad('companion prerequisite');if(s.beaconLit&&!ENEMIES.every(e=>adventure.defeated.includes(e.id)))bad('beacon guards');if(adventure.defeated.some(id=>ENEMIES.some(e=>e.id===id))&&!s.entered)bad('unvisited encounters');}return s;}
function objectives(a){const s=a.road;return[
{title:'A road beyond home',detail:'After the envoy’s gift, visit the far-water lookout and take the Sunward Road.',done:s.entered},
{title:'A use for a keen nose',detail:'Ask your fox to Seek near the broken cart. Follow it to the missing latch.',done:s.claimed.includes('cart-latch')},
{title:'Help a stranded trader',detail:'Clear the prowler. Repair Tessa’s cart with its recovered latch and 2 copper.',done:s.cartRepaired},
{title:'The charge before the dawn',detail:'Cross the stone bridge. Evade the Sunscar Ram’s marked charge lane.',done:a.defeated.includes('road-ram')},
{title:'Light the Sunward Beacon',detail:'Clear the three route encounters, then kindle the lantern on the north ridge.',done:s.beaconLit},
{title:'Bring the light home',detail:'Return to the spring and tell the envoy. Unlock the wayfarer’s band and a commemorative light.',done:s.reported}];}
G.RealmRoad={TREES,GATE,ENTRY,MERCHANT,BEACON,ENEMIES,CACHES,OBSTACLES,land,riverZ,walkable,line,fresh,validate,objectives};if(typeof module!=='undefined')module.exports=G.RealmRoad;
})(globalThis);
