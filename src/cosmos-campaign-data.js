/* Original bounded adaptation of recovered Open Confluence direction.
 * Catalogue only: importing this file creates no game state, ground, actors,
 * damage, consent, payout, collision changes or archive access. Exact staging,
 * identities and tuning below are new proposals, not manuscript canon. */
(function(G){'use strict';
function freeze(o){if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;}
const point=(x,z)=>({x,z});
const step=(id,name,kind,x,z,requires,text,extra={})=>({id,name,kind,x,z,y:4.77,medium:'dry',requires,optional:false,text,...extra});
const geometry=freeze({
 status:'prospective-static-extension',owner:'RealmCosmos physical geometry; not campaign art or saved history',
 connection:point(13,-40),height:4.77,bounds:{minX:-20,maxX:66,minZ:-56,maxZ:23},
 patches:[
  {id:'confluence-service-edge',x:18,z:-40,w:12,d:6,y:4.77},
  {id:'confluence-support-junction',x:26,z:-40,w:6,d:6,y:4.77},
  {id:'confluence-living-garden',x:26,z:-29,w:14,d:20,y:4.77},
  {id:'confluence-records-bay',x:26,z:-47,w:14,d:10,y:4.77},
  {id:'confluence-arena-road',x:42,z:-40,w:26,d:8,y:4.77},
  {id:'confluence-guardian-court',x:54,z:-44,w:20,d:22,y:4.77},
  {id:'confluence-public-loop',x:42,z:-29,w:24,d:8,y:4.77}
 ],
 solids:[
  {id:'confluence-records-back',x:26,z:-51,w:10,d:.5,h:2.4},
  {id:'confluence-garden-edge',x:26,z:-20,w:10,d:.4,h:1},
  {id:'confluence-material-table',x:22,z:-44.8,w:.8,d:.8,h:1.1},
  {id:'confluence-living-bed',x:26,z:-24,w:7,d:2,h:.45},
  {id:'confluence-west-court-cover',x:49,z:-44,w:.8,d:.8,h:1.4},
  {id:'confluence-east-court-cover',x:59,z:-46,w:.8,d:.8,h:1.4},
  {id:'confluence-west-court-post',x:45,z:-51,w:.6,d:.6,h:2.2},
  {id:'confluence-east-court-post',x:63,z:-51,w:.6,d:.6,h:2.2}
 ],
 // These paths demonstrate prospective clear movement; they do not move actors.
 routes:[
  {id:'existing-east-service',radius:.31,points:[point(3,-43),point(8,-40),point(14,-40),point(22,-40)]},
  {id:'material-work',radius:.31,points:[point(22,-40),point(24,-40),point(24,-46),point(22,-46)]},
  {id:'living-work',radius:.31,points:[point(22,-40),point(26,-38),point(26,-33),point(26,-27)]},
  {id:'observational-work',radius:.31,points:[point(22,-40),point(26,-40),point(26,-48),point(30,-48),point(30,-40)]},
  {id:'service-and-reclaimer',radius:.65,points:[point(22,-40),point(30,-40),point(36,-40),point(40,-40)]},
  {id:'guardian-court',radius:.95,points:[point(40,-40),point(47,-40),point(47,-44),point(47,-47),point(54,-47),point(54,-44),point(54,-48)]},
  {id:'west-feed',radius:.31,points:[point(47,-44),point(47,-49),point(49,-49)]},
  {id:'east-feed',radius:.31,points:[point(54,-48),point(61,-48),point(61,-39),point(59,-39)]},
  {id:'public-loop',radius:.31,points:[point(47,-44),point(47,-34),point(47,-29),point(44,-29),point(32.5,-29),point(26,-29),point(26,-38),point(22,-40)]}
 ],
 dynamicCollision:false,neutralTravel:'The public loop and ordinary return are always supported/open. Saved opening changes apparatus and accountability, never ground or solids.'
});
const patterns=freeze({
 reclaimer:{line:{kind:'line',reach:5.4,length:5,halfWidth:.55,windup:1.2,recovery:1.7,clip:'whole-width support and opaque cover'}},
 guardian:{
  ring:{kind:'annulus',reach:5.4,innerRadius:1.8,outerRadius:4.6,windup:1.6,recovery:2,
   afterEastRelease:{outerRadius:3.2},response:'Move inside the clear inner circle or outside the outer rim; Brace and actual cover remain valid.'},
  cross:{kind:'cross',reach:7,halfLength:6.5,halfWidth:.55,axes:[0,Math.PI/2],windup:1.4,recovery:2.2,
   afterWestRelease:{axes:[0]},clip:'Each locked arm uses whole-width support and opaque cover.',
   response:'Move to a clear quadrant beside the two locked bars. The west feed release removes the transverse bar only from the next lock.'}
 },
 rules:{damage:'Fixed enemy damage, all live phases; no gear/level scaling or recovery-only armor.',
  frame:'Lock position/yaw/shape once at windup. Feed releases affect subsequent frames only; no retargeted warning or mid-contact shortening.',
  ring:'Both rims are visible, with equivalent text and paired contrasting borders. Contact uses the actual annulus, player margin and opaque visibility.',
  mobility:'Anchored municipal service bodies. Their stated footprint stays on actual support; retreat does not trigger a hidden chase or extra reach.'}
});
const supports=freeze([
 {id:'material',name:'Material anchor',inspect:'material-inspect',complete:'material-fit',assistance:'assist-material',configure:'configure-material',
  mode:'An independent supplied brace takes the local output without borrowing another reach’s support.',
  supplied:'Anik supplies tested struts and shoes, or a brace checked in advance. No ore, timber, equipment or extra regional work is needed.'},
 {id:'living',name:'Living anchor',inspect:'living-inspect',complete:'living-fit',assistance:'assist-living',configure:'configure-living',
  mode:'The garden return can adjust locally instead of being held to one copied setting.',
  supplied:'Use the supplied wick-loop or the tested adaptive return. Neither needs a rare seed, companion, growth timer or an earlier garden job.'},
 {id:'observation',name:'Observation anchor',inspect:'observation-inspect',complete:'observation-fit',assistance:'assist-observation',configure:'configure-observation',
  mode:'Both named station records and their limits remain beside the independent interval setting.',
  supplied:'Anik supplies a checked record of both named stations. The earlier comparator stays intact; no private testimony, personal archive or new astronomical claim is required.'}
]);
const definition=freeze({
 id:'cosmos-open-confluence-v1',title:'The Open Confluence',room:'cosmos-near-expanse',realm:'cosmos',
 prerequisite:'cosmos-split-bearing-v1',entry:{kit:'adventure.started',prior:'claimed realmTrails record'},
 giver:{id:'anik',name:'Anik · observer',x:3,z:-43,y:4.77},
 reward:{xp:150,coins:20,ore:5,materials:{wood:4,fiber:3,crystal:2}},
 summary:'Anik: Avar’s plan asks every branch to follow one setting, and the Confluence has no owner but him. Read what that costs, then help Raven fit any two anchors. Each has a tested, supplied alternative. Disable the Optical Reclaimer, isolate its feed, and face the Still Meridian Guardian. Release both feeds, disconnect the central link, and record Avar’s responsibility. Set two anchors on their own, check the open apparatus, then return to Anik.',
 danger:'Both anchored machines can be fought with blade or bow. Move beside the marked attacks, use cover, or Brace. The Optical Reclaimer has 84 health and 8 damage. The Still Meridian Guardian has 168 health and 12 damage; it marks rings with a clear center or crosses with clear quadrants. The east feed shrinks later rings; the west feed removes the transverse bar from later crosses. Health, damage and timing stay the same for every weapon. An attack already marked stays as it is. You may release the feeds during the fight or afterward. There is no deadline and no material loss, and the road home stays open.',
 completionText:'Avar’s central synchronization is stopped. Two anchors now hold their own settings, and the instrument keeps the account you chose. The public service loop and the road home stay open. Anik gives you 20 sunmarks, 5 ore, 4 timber, 3 fibre and 2 crystal, plus up to 50 XP within your stored cap. Use the materials for projects you choose; your equipment is unchanged. The comparator and the drawing shelf keep their own records. Sidereth, Elaris and the Far Confluence are still ahead.',
 witnesses:[
  {id:'cosmos-raven-service-v1',name:'Raven · support planner',x:20,z:-38,appearsAfter:['read-local-cost']},
  {id:'cosmos-avar-senn-v1',name:'Avar Senn · created scholar',x:45,z:-35,appearsAfter:['disable-central-link']}
 ],
 steps:[
  step('read-local-cost','Read what Avar’s plan leaves out of the local cost','interact',14,-40,[],
   'Anik: Avar’s plan helped people, but his diagram leaves out what each branch has to carry. Raven and I have tested an anchor for every branch. Compare the marks.'),
  step('material-inspect','Check Anik’s brace shoes against the load marks','interact',22,-40,['read-local-cost'],
   'Check the brace shoes against the service load marks. Anik supplies the parts for this job; you do not spend your own materials.',{optional:true,lead:'material'}),
  step('material-fit','Seat the material anchor with your own struts','configure',22,-46,['material-inspect'],
   'Fit the supplied struts into both independent shoes. The completed brace prepares one distinct material support.',{optional:true,lead:'material',setting:'seat-independent-shoes'}),
  step('assist-material','Fit the brace Anik checked in advance','configure',22,-46,['read-local-cost'],
   'Seat the brace that Anik has checked in advance. It prepares the material support without an inspection or any cost to you. Choose this brace or fit the other one; either carries the same branch.',{optional:true,lead:'material',alternativeTo:'material-fit',setting:'seat-tested-brace'}),
  step('living-inspect','Read the garden return’s marks','interact',26,-27,['read-local-cost'],
   'Read the garden’s return marks. This fitting can be set locally instead of copying the central schedule.',{optional:true,lead:'living'}),
  step('living-fit','Set the garden return on its own adjustment','configure',26,-33,['living-inspect'],
   'Fit the supplied wick-loop to the garden return. Preserve an independent adjustment instead of copying the central schedule.',{optional:true,lead:'living',setting:'retain-local-adjustment'}),
  step('assist-living','Fit the tested return Anik supplied','configure',26,-33,['read-local-cost'],
   'Fit the tested adaptive return here. It prepares the living support without a rare seed, companion, growth timer or prior garden job.',{optional:true,lead:'living',alternativeTo:'living-fit',setting:'fit-tested-return'}),
  step('observation-inspect','Read both named stations and their limits','interact',26,-48,['read-local-cost'],
   'Read the supplied pair of service-station records and their limits. The sky comparator you set still stands; this pair concerns only the local service interval.',{optional:true,lead:'observation'}),
  step('observation-fit','Keep both station names on the interval record','configure',30,-40,['observation-inspect'],
   'Keep both station names and their limits on the independent instrument. Neither a beautiful picture nor an unnamed average can erase the differing observations.',{optional:true,lead:'observation',setting:'retain-both-stations'}),
  step('assist-observation','Fit the checked station record Anik supplied','configure',30,-40,['read-local-cost'],
   'Fit the checked public record of both stations. This prepares the observational support without private history or archive participation.',{optional:true,lead:'observation',alternativeTo:'observation-fit',setting:'fit-checked-stations'}),
  step('test-service-route','Walk the service road on two anchors of your own','interact',30,-40,['read-local-cost'],
   'Check the clear service approach and any two different anchors. The third is optional. A tested, supplied alternative holds its branch just as an inspected fitting does.',{requiresSupports:2}),
  step('challenge-reclaimer','Draw out the Optical Reclaimer','interact',33,-40,['test-service-route'],
   'Start the Optical Reclaimer deliberately. It marks a narrow attack along the service road; cover can block it. Select the machine with Tab or click, then use your blade or bow.'),
  step('reclaimer-settled','Bring the Optical Reclaimer down','defeat',36,-40,['challenge-reclaimer'],
   'Disable the Optical Reclaimer with your blade or bow, then isolate its service feed. Anik gives your reward after the whole operation is checked.'),
  step('isolate-service-feed','Turn the imposed feed to your own setting','configure',40,-40,['reclaimer-settled'],
   'Turn this branch to its independent setting. The public approach stays open. Stopping the machine does not turn the feed for you.',{setting:'isolate-imposed-feed'}),
  step('challenge-guardian','Enter the Still Meridian’s court','interact',47,-44,['isolate-service-feed'],
   'Read the ring and cross warnings. The Guardian stays in its court: move into the clear center or a clear quadrant, use cover, or Brace. You may release either feed during the fight or afterward. Avar must still account for the work he imposed.'),
  step('release-west-feed','Release the west feed, so the crosses stop reaching','configure',49,-49,['challenge-guardian'],
   'Release the west feed to remove the transverse bar from later crosses. If an attack is already marked, that attack still follows its mark. You may make this release during the fight or after the Guardian stops.',{setting:'release-transverse-feed'}),
  step('release-east-feed','Release the east feed, so the rings shrink','configure',59,-39,['challenge-guardian'],
   'Release the east feed. New rings reach 3.2 paces instead of 4.6. The 1.8-pace clear center, damage and timing stay the same. A ring already marked does not change.',{setting:'release-outer-feed'}),
  step('guardian-settled','Bring the Still Meridian Guardian down','defeat',54,-44,['challenge-guardian'],
   'Disable the Guardian with your blade or bow. Both feeds must also be released before you disconnect the central link. The account and your anchors still wait.'),
  step('disable-central-link','Hold at one of your anchors until the central link answers','configure',54,-48,['release-west-feed','release-east-feed','guardian-settled'],
   'With the Guardian stopped and both feeds released, disconnect the central synchronization. Avar can no longer impose one setting on every branch. Next, record his responsibility and set your anchors on their own.',{setting:'disconnect-central-synchronization'}),
  step('accountability','Decide how Avar’s part is kept on the record','choice',45,-35,['disable-central-link'],
   'Choose the public mechanical account alone, or keep Avar’s short statement in Anik’s custody as well. Both keep the full service costs and Avar’s responsibility. No personal archive or cosmic verdict is needed.'),
  step('configure-material','Set the material anchor on its own rating','configure',22,-46,['accountability'],
   'Give the prepared material anchor its own rated setting. Any two anchors must be set by hand; a third is optional.',{optional:true,requiresSupport:'material',setting:'independent-material-interval'}),
  step('configure-living','Set the garden return on its own interval','configure',26,-33,['accountability'],
   'Give the prepared garden return its own setting, separate from the central schedule.',{optional:true,requiresSupport:'living',setting:'independent-living-interval'}),
  step('configure-observation','Set the observation anchor on its own interval','configure',30,-40,['accountability'],
   'Set the prepared named-station instrument to its independent interval and preserve its limits.',{optional:true,requiresSupport:'observation',setting:'independent-observation-interval'}),
  step('open-confluence','Open the Confluence on the anchors you set','configure',32.5,-29,['accountability'],
   'Once at least two anchors hold their own settings, open the independent interval at this public-loop instrument. It keeps those settings and the account you chose. The public road stays open.',{requiresConfiguredSupports:2,setting:'open-independent-interval'}),
  step('verify-open-bearings','Check the open Confluence against the account you kept','interact',44,-29,['open-confluence'],
   'Compare the open apparatus with the account and the anchors you set. Each anchor keeps its own setting, and none of them owns the road. That is the Answering in small: many anchors, no master key. Return to Anik for your reward.')
 ],
 choices:[
  {id:'public-record',name:'Public mechanical account',text:'Publish the public mechanical account of the local feed marks, harmful synchronization, disabling and independent settings. Keep Avar’s responsibility visible without requiring his whole personal history.',
   consequence:'The instrument displays the public mechanical account and Anik’s continuing check marks. Avar’s local project stays disabled. His wider fate is still his to answer for.',
   recognition:[{name:'Anik',text:'Both stations and the local cost remain named. The mechanism is open to inspection.'},{name:'Avar Senn',text:'The service marks show the cost I excluded. This installation is no longer mine to hold in that configuration.'}]},
  {id:'bounded-account',name:'Public facts with bounded testimony',text:'Keep the same public mechanical account, and accept Avar’s short statement in Anik’s local custody. His private history remains his own; limited testimony is not amnesty.',
   consequence:'The public mechanical facts remain beside a marked testimony folder. Anik records its limits. Avar remains responsible, and his local project stays disabled. No private account is searched and no global pardon is granted.',
   recognition:[{name:'Anik',text:'The public marks remain complete. The additional statement has its own declared limits.'},{name:'Avar Senn',text:'I have given this limited account of the installation. It does not cancel the cost or let me restart it.'}]}
 ],
 enemies:[
  {id:'cosmos-optical-reclaimer-v1',name:'Optical Reclaimer',kind:'sentinel',x:36,z:-40,hp:84,damage:8,radius:.65,anchored:true,spawnAfter:['challenge-reclaimer'],defeatStep:'reclaimer-settled',pattern:'reclaimer'},
  {id:'cosmos-still-meridian-guardian-v1',name:'Still Meridian Guardian',kind:'sentinel',x:54,z:-44,hp:168,damage:12,radius:.95,anchored:true,spawnAfter:['challenge-guardian'],defeatStep:'guardian-settled',pattern:'guardian'}
 ],
 state:{version:1,accepted:false,steps:[],choice:null,opened:false,claimed:false},
 stateContract:{field:'cosmosCampaign',version:1,absent:'Empty and unaccepted; no backfill from old surveys or comparator claims.',
  opened:'True exactly when open-confluence is durably recorded; apparatus state only, no dynamic collider.',
  choice:'One lasting accountability choice, exactly when accountability is recorded.',
  claimed:'Requires all mandatory steps plus any two prepared AND reconfigured distinct supports. Completed work may remain open and unpaid.',
  supports:'Derived from completed support/assistance step IDs. A lead cannot record both completion alternatives or contribute twice.',
  refusal:'Future/malformed/impossible histories refuse; candidate save before adopt; actual defeat refusal remains retryable, never an unstored exhausted owner.',
  transient:'Attack/contact/target/path/scene are transient. Reload resumes the saved normal home checkpoint; accepted work, unique exhaustion and local open state persist.'},
 costs:{supplied:true,accept:{},actions:{},claim:{},normalInventoryCosts:false,
  fee:'The full material/currency payload is capacity-checked and saved once before adoption; only XP clips at 9999. No heal, refill, auto-equip, socket, level-curve or old-payment change.'},
 scope:'A Near Expanse service-reach adaptation of CT37/39/40. Recovered names are proposed fiction. Exact coordinates, support fixtures, encounters and effects are original provisional terms. CT38 and the full cities/Answering/Regent/online/private-archive arcs are not implemented here.'
});
function completedSupports(steps){const set=new Set(steps);return supports.filter(s=>set.has(s.complete)||set.has(s.assistance)).map(s=>s.id);}
function configuredSupports(steps){const set=new Set(steps);return supports.filter(s=>(set.has(s.complete)||set.has(s.assistance))&&set.has(s.configure)).map(s=>s.id);}
const supportRule=freeze({required:2,distinct:supports.map(s=>s.id),assistance:'Every lead has an explicit supplied physical alternative; optional outside quests never enter the gate.'});
const sources=freeze([
 {status:'recovered-proposed-fiction',path:'design/03_CAMPAIGN_AND_CHARACTERS.md',anchors:['2. Avar Senn and the Still Meridian','7. Movement Five — The Still Crown','8. Movement Six — The Open Confluence'],
  supplies:'Avar’s imposed regional configuration, independent material/living/observational leads, physical disabling, local victory and retained accountability.'},
 {status:'recovered-proposed-fiction',path:'design/06_QUEST_AND_EVENT_ATLAS.md',anchors:['CT37','CT39','CT40'],
  supplies:'Any two supported leads or declared assistance, actual guardian/commander resolution, durable bounded open state and ordinary return.'},
 {status:'current-source-owner',path:'src/cosmos.js',anchors:['ROOM','PATCHES','SOLIDS','POINTS','height','segment','pick'],supplies:'Existing grounded observatory edge, Anik/Teren, physical slope/support/cover and normal return.'},
 {status:'current-source-owner',path:'src/world-foundations.js',anchors:['definitions','height','land','walkable','segment'],supplies:'Shared map/prospective whole-body ground and solid route predicates.'},
 {status:'current-source-owner',path:'src/realm-trails-cosmos.js',anchors:['cosmos-split-bearing-v1','service-arm'],supplies:'Exact claimed comparator prerequisite; existing stations and instrument stay separate.'},
 {status:'current-source-owner',path:'src/local-life.js',anchors:['cosmos-drawing-shelf-v1'],supplies:'Existing shelf, giver/returner and supplies keep their old ledger.'}
]);
const api=freeze({definition,geometry,patterns,supports,supportRule,sources,completedSupports,configuredSupports});
G.RealmCosmosCampaignData=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
