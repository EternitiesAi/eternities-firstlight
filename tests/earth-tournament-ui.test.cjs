/* CPU presentation/controller checks. DOM is deliberately stubbed here;
 * native layout, keyboard, cameras and persistence still require Chromium. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),E=require('../src/earth.js'),R=require('../src/earth-tournament.js'),UI=require('../src/earth-tournament-ui.js'),Art=require('../src/earth-tournament-art.js');
function fixture(){const sim=new C.Simulation();sim.state.player={x:11,z:9,yaw:0};sim.adventureCommand('kit','start');sim.room=E.ROOM;sim.returnPos={x:0,z:23,yaw:0};sim.state.player={x:5,z:-27.6,yaw:0};const calls=[];
 const rpg={sim,quest:'story',tab:'earth-tournament',api:{tournamentContext:()=>({sim:rpg.sim,active:'ui-rain',current:()=>true}),tournamentCommand:(type,p)=>{calls.push({type,p});return R.command(rpg.api.tournamentContext(),type,p,{save:()=>({ok:true})});},toast:text=>calls.push({text}),walkLocal:(x,z)=>calls.push({walk:[x,z]}),focusWorld:()=>calls.push({focus:true})},open(tab){this.tab=tab;this.sim.paused=true;},close(){this.sim.paused=false;},tick(){}};
 const ui=new UI.TournamentUI(rpg);return{sim,rpg,ui,calls,act:(type,extra={})=>ui.action({dataset:{rpg:'tournament-'+type,owner:'ui-rain',revision:String(rpg.sim.state.adventure.revision),family:'blade',...extra}})};}
test('unaccepted terms disclose cost, timing, both families, medals and interrupted results without writing',()=>{
 const f=fixture(),before=f.sim.snapshot(),html=f.ui.page('earth-tournament').html;
 for(const term of ['2.65m','0.52s','11m','0.75s','6 stamina','Bronze at 2','silver at 4','gold at 6','No campaign','F strikes once','autoattack','unrecorded result is not saved']){
  assert.ok(html.includes(term),term);
 }
 assert.deepEqual(f.sim.snapshot(),before);assert.equal(f.calls.length,0);
});
test('visible entry closes the paused rules, dispatches exact owner terms and returns control without autowalk or autoequip',()=>{
 const f=fixture(),gear={...f.sim.state.adventure.equipment};f.rpg.open('earth-tournament');f.sim.playerPath=[{x:-1,z:-28}];f.act('enter');assert.equal(f.sim.paused,false);assert.equal(f.rpg.quest,'earth-tournament');assert.equal(R.fighting(f.sim),true);assert.deepEqual(f.sim.playerPath,[]);assert.deepEqual(f.sim.state.adventure.equipment,gear);assert.equal(f.calls[0].p.expectedActive,'ui-rain');assert.ok(f.calls.some(c=>c.focus));
});
test('stale rendered entry refuses and remains reviewable without issuing a run',()=>{
 const f=fixture();f.rpg.open('earth-tournament');f.act('enter',{revision:'999'});assert.equal(f.sim.state.adventure.earthTournament.issued,0);assert.equal(f.sim.paused,true);assert.equal(R.view(f.sim),null);
});
test('observation, route and tracker are not acceptance or medals',()=>{
 const f=fixture(),before=f.sim.snapshot();for(const action of ['observe','walk','track'])f.act(action);assert.deepEqual(f.sim.snapshot(),before);assert.equal(f.calls.some(c=>c.type),false);assert.equal(f.rpg.quest,'earth-tournament');assert.deepEqual(f.calls.find(c=>c.walk).walk,[5,-27.6]);
});
test('interrupted attempt shows recovery without a fabricated record button',()=>{
 const f=fixture();f.act('enter');f.rpg.sim=new C.Simulation(f.sim.snapshot());const html=f.ui.page('earth-tournament').html;assert.ok(html.includes('no live scoring proof'));assert.ok(html.includes('Withdraw this attempt'));assert.equal(html.includes('Record this result'),false);f.act('withdraw');assert.equal(f.rpg.sim.state.adventure.earthTournament.closed,1);
});
test('scene decoration is bounded, read-only, grounded and non-solid; reduced motion preserves the visible cue',()=>{
 const f=fixture(),out=()=>({box:[],round:[],octa:[],disc:[]}),before=f.sim.snapshot();f.sim.state.settings.reducedMotion=true;const saved=f.sim.snapshot();
 const parts=out();Art.draw(parts,f.sim,100);const items=Object.values(parts).flat();assert.ok(items.length<80);assert.ok(items.every(p=>p.appearanceOnly&&p.cameraSolid===false&&p.cutaway===false));assert.equal(items.filter(p=>p.tournamentPart==='chalk-boundary').length,40);
 for(const p of items.filter(p=>p.tournamentPart==='chalk-boundary'))assert.ok(Math.abs(p.p[1]-p.s[1]/2-E.height(0,p.p[2]))<1e-7);
 assert.deepEqual(f.sim.snapshot(),saved);assert.equal(f.sim.state.adventure.earthTournament.issued,before.adventure.earthTournament.issued);
 const second=out();Art.draw(second,f.sim,200);assert.deepEqual(second,parts,'quiet art does not sway as wall time changes');
});
