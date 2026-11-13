const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../src/difficulty.js');
const ORDER=['hart','ram','herald','keeper','foundryWarden','relaySeraph','witnessGuardian','regent'];
test('boss table has the pinned keys in main-path order',()=>{assert.deepEqual(Object.keys(D.BOSSES),ORDER);});
test('every boss has positive finite hp, damage and windup',()=>{
 for(const id of ORDER)for(const k of['hp','damage','windup'])assert.ok(Number.isFinite(D.BOSSES[id][k])&&D.BOSSES[id][k]>0,id+' '+k);
});
test('hp matches the lane numbers',()=>{
 const hp=Object.fromEntries(ORDER.map(id=>[id,D.BOSSES[id].hp]));
 assert.deepEqual(hp,{hart:240,ram:320,herald:350,keeper:410,foundryWarden:520,relaySeraph:620,witnessGuardian:720,regent:1200});
});
test('damage rises along the main path and past the keeper',()=>{
 const damage=ORDER.map(id=>D.BOSSES[id].damage);
 for(let i=1;i<damage.length;i++)assert.ok(damage[i]>damage[i-1],ORDER[i]+' must hit harder than '+ORDER[i-1]);
 for(const id of['foundryWarden','relaySeraph','witnessGuardian','regent'])assert.ok(D.BOSSES[id].damage>D.BOSSES.keeper.damage,id);
});
test('regent phases are 380, 400 and 420 and add up to its hp',()=>{
 const r=D.BOSSES.regent;
 assert.deepEqual(r.phases.map(p=>p.hp),[380,400,420]);
 assert.equal(r.phases.reduce((s,p)=>s+p.hp,0),r.hp);
 assert.ok(r.phases.every(p=>Array.isArray(p.patterns)&&p.patterns.length>0));
 assert.equal(r.damage,Math.max(...r.phases.map(p=>p.damage)));
});
test('boss returns a copy and refuses unknown ids',()=>{
 const a=D.boss('hart');a.hp=1;a.name='changed';
 assert.equal(D.BOSSES.hart.hp,240);
 assert.equal(D.boss('hart').hp,240);
 assert.equal(D.boss('nobody'),null);
 assert.equal(D.boss('__proto__'),null);
});
test('phases gives contiguous remaining-hp edges from the full hp to zero',()=>{
 const p=D.phases(D.BOSSES.regent);
 assert.deepEqual(p.map(x=>[x.index,x.from,x.to]),[[1,1200,820],[2,820,420],[3,420,0]]);
 assert.deepEqual(p[0].patterns,['homecoming-line']);
 p[0].patterns.push('mutated');assert.equal(D.BOSSES.regent.phases[0].patterns.length,1);
 assert.deepEqual(D.phases(D.BOSSES.hart),[]);
 assert.deepEqual(D.phases(null),[]);
});
