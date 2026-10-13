/* Real RPG dispatch/render methods over a small CPU dialog adapter. Native
 * browser focus, geometry and footage are separate acceptance. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),B=require('../src/briar-outing.js');
require('../src/rpg-ui.js');const UI=global.RealmRPGUI.RPGUI;
function fixture(wasPaused=false){
 const sim=new C.Simulation();sim.state.adventure.started=true;sim.state.adventure.companion.bonded=true;sim.state.player={...B.definition.home,yaw:0};A.syncScene(sim);
 const lease=Object.freeze({});sim.briarOwnerLease=lease;
 const ctx=()=>({sim,active:'ui-briar-character',revision:1,definition:B.definition,ownerLease:lease,current:ctx});sim.briarContext=ctx;
 const ui=Object.create(UI.prototype),calls=[];ui.dialog={open:true,close(){this.open=false;calls.push('close');}};ui.wasPaused=wasPaused;sim.paused=true;
 for(const name of ['wildSigns','earthHomecoming','cosmosCampaign','atlantisCampaign','heavenCampaign','hellCampaign','community','civic','expedition','trails','worlds','realmAtlas','gathering','earth','cosmos','classes','characters','starter','crossing','pursuit'])ui[name]={action(){return false;},reset(){}};
 ui.api={sim:()=>sim,briarContext:ctx,briarCommand(type,payload){calls.push(type);return B.command(ctx(),type,payload,{save:()=>({ok:false,error:'synthetic no storage'})});},clearKeys(){calls.push('keys');},focusWorld(){calls.push('focus');},toast(t){calls.push(t);}};ui.paint=()=>{};ui.tick=()=>{};
 return{sim,ui,calls,ctx};
}
test('Companion page exposes the real new outing without a fake reward',()=>{
 const f=fixture(),html=f.ui.companion();assert.match(html,/The Bowl Beside the Door/);assert.match(html,/data-rpg="briar" data-id="start"/);
 assert.match(html,/cloth/i);assert.match(html,/doorstep/i);
});
test('native movement action closes the workspace, restores pause and reaches the real owner',()=>{
 const f=fixture();f.ui.dispatchAction({dataset:{rpg:'briar',id:'start'}});assert.equal(f.ui.dialog.open,false);assert.equal(f.sim.paused,false);
 assert.ok(f.calls.indexOf('close')<f.calls.indexOf('start'));assert.ok(f.calls.includes('focus'));assert.equal(B.current(f.ctx()).phase,'outbound');
});
test('a prior P pause stays paused and cannot secretly start a route',()=>{
 const f=fixture(true);f.ui.dispatchAction({dataset:{rpg:'briar',id:'start'}});assert.equal(f.sim.paused,true);assert.equal(B.current(f.ctx()),null);
});
test('nonmovement actions preserve the dialog pause even when saving refuses',()=>{
 const f=fixture();f.ui.dispatchAction({dataset:{rpg:'briar',id:'take'}});assert.equal(f.sim.paused,true);assert.equal(f.ui.dialog.open,true);
 assert.ok(f.calls.includes('take'));assert.deepEqual(f.sim.state.briarMoments.moments,[]);
});
