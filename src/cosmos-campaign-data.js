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
 {id:'material',name:'Material independence',inspect:'material-inspect',complete:'material-fit',assistance:'assist-material',configure:'configure-material',
  mode:'An independent supplied brace takes the local output without borrowing another reach’s support.',
  supplied:'Anik supplies tested struts, seated shoes and a pre-checked brace alternative. No ore, timber, gear or earlier regional contract is required.'},
 {id:'living',name:'Living adaptation',inspect:'living-inspect',complete:'living-fit',assistance:'assist-living',configure:'configure-living',
  mode:'The garden return can adjust locally instead of being held to one copied setting.',
  supplied:'A supplied wick-loop and an already tested adaptive return provide the assistance alternative. No rare seed, pet, growth timer or missed nursery quest is required.'},
 {id:'observation',name:'Observational accountability',inspect:'observation-inspect',complete:'observation-fit',assistance:'assist-observation',configure:'configure-observation',
  mode:'Both named station records and their limits remain beside the independent interval setting.',
  supplied:'The earlier comparator stays intact. A supplied named-station record provides explicit assistance without a private testimony, personal archive or new astronomical claim.'}
]);
const definition=freeze({
 id:'cosmos-open-confluence-v1',title:'The Open Confluence',room:'cosmos-near-expanse',realm:'cosmos',
 prerequisite:'cosmos-split-bearing-v1',entry:{kit:'adventure.started',prior:'claimed realmTrails record'},
 giver:{id:'anik',name:'Anik · observer',x:3,z:-43,y:4.77},
 reward:{xp:50,coins:20,ore:5,materials:{wood:4,fiber:3,crystal:2}},
 summary:'Anik’s named-station comparator reveals a local cost hidden by Avar Senn’s elegant service diagram. Accept this separate operation on the grounded observatory service reach. Fit any two distinct material, living and observational supports; each has a disclosed supplied assistance alternative. Test the service approach, settle an actual Optical Reclaimer, isolate its feed, then confront the Still Meridian Guardian. Exhausting either machine grants no independent loot. Physically release both guardian feeds, disable the central synchronization, choose a bounded accountability record and reconfigure any two prepared supports. Verify the independently open local apparatus before deliberately claiming one fixed fee from Anik.',
 danger:'All extension paths are permanently supported at 4.77 and keep a normal return. Fight two separate anchored machines with ordinary blade or bow, movement, Brace and actual cover. The Reclaimer has fixed 84 health and 8 damage; the Guardian has fixed 168 health and 12 damage. The Guardian warns an annulus with a clear inner circle, then a locked cross with clear quadrants. Its physical east release narrows future outer rings; its west release removes the transverse bar from future crosses. Health, damage and timing never scale with equipment. Release controls can be operated during the live encounter or after genuine combat exhaustion; no deadline, material loss or hidden optional prerequisite applies. Public access and private story consent remain separate.',
 completionText:'Avar’s harmful local synchronization is disabled. At least two prepared supports now operate independently, the public apparatus retains the chosen accountability record, and the local open state persists. The public service loop was always real ground; this work changed its controls, not collision. Anik has paid 20 sunmarks, 5 ore, 4 timber, 3 fibre and 2 crystal once; XP credits up to 50 within the existing stored cap. These are materials for chosen ordinary projects, not a universal weapon upgrade. The comparator, drawing shelf and earlier claims remain separate. Full Sidereth, Elaris, Far Confluence, the Regent’s terrestrial defeat and the ultimate Answering remain beyond this adaptation.',
 witnesses:[
  {id:'cosmos-raven-service-v1',name:'Raven · support planner',x:20,z:-38,appearsAfter:['read-local-cost']},
  {id:'cosmos-avar-senn-v1',name:'Avar Senn · created scholar',x:45,z:-35,appearsAfter:['disable-central-link']}
 ],
 steps:[
  step('read-local-cost','Read the omitted local support cost','interact',14,-40,[],
   'Compare the public service diagram with the garden-return and branch-feed marks. Avar’s earlier stabilization helped people in the recovered proposal; this local operation stops the imposed synchronization and records its actual service cost. Anik and Raven offer all three supplied assistance alternatives before operation.'),
  step('material-inspect','Inspect the independent brace shoes','interact',22,-40,['read-local-cost'],
   'Check the independent shoes against the service load marks. These are supplied job parts, not an ordinary material payment.',{optional:true,lead:'material'}),
  step('material-fit','Seat the material support','configure',22,-46,['material-inspect'],
   'Fit the supplied struts into both independent shoes. The completed brace prepares one distinct material support.',{optional:true,lead:'material',setting:'seat-independent-shoes'}),
  step('assist-material','Fit the supplied pre-checked material support','configure',22,-46,['read-local-cost'],
   'Choose the explicitly supplied pre-checked brace instead of this lead’s inspection. Physically seat it here. This is the same one material support, with no second support count or inventory charge.',{optional:true,lead:'material',alternativeTo:'material-fit',setting:'seat-tested-brace'}),
  step('living-inspect','Inspect the garden’s adjustable return','interact',26,-27,['read-local-cost'],
   'Read the local return marks beside the supplied garden bed. The bounded authored mechanism can adjust locally; this catalogue does not simulate an ecosystem or harvest.',{optional:true,lead:'living'}),
  step('living-fit','Fit the independent living return','configure',26,-33,['living-inspect'],
   'Fit the supplied wick-loop to the garden return. Preserve an independent adjustment instead of copying the central schedule.',{optional:true,lead:'living',setting:'retain-local-adjustment'}),
  step('assist-living','Fit the supplied tested living return','configure',26,-33,['read-local-cost'],
   'Physically fit the already tested adaptive return. No rare seed, companion, growth timer or prior garden job is needed. It counts as this one living support.',{optional:true,lead:'living',alternativeTo:'living-fit',setting:'fit-tested-return'}),
  step('observation-inspect','Read both named local stations','interact',26,-48,['read-local-cost'],
   'Read the supplied pair of service-station records and their limits. The previously claimed sky comparator stays true; this pair concerns only the local service interval.',{optional:true,lead:'observation'}),
  step('observation-fit','Fit the named-station interval record','configure',30,-40,['observation-inspect'],
   'Keep both station names and their limits on the independent instrument. Neither a beautiful picture nor an unnamed average can erase the differing observations.',{optional:true,lead:'observation',setting:'retain-both-stations'}),
  step('assist-observation','Fit the supplied checked station record','configure',30,-40,['read-local-cost'],
   'Use the explicitly supplied checked public station pair and physically fit it here. No private history or archive participation is required. This prepares one observational support.',{optional:true,lead:'observation',alternativeTo:'observation-fit',setting:'fit-checked-stations'}),
  step('test-service-route','Test the independently supported service approach','interact',30,-40,['read-local-cost'],
   'At the actual service junction, check at least two distinct prepared support fittings and the clear public approach. The third lead remains optional; any disclosed assistance alternative qualifies equally.',{requiresSupports:2}),
  step('challenge-reclaimer','Begin the local optical defense','interact',33,-40,['test-service-route'],
   'Deliberately start the grounded Optical Reclaimer. Its locked narrow line reads the real road and opaque cover. Select its actual body with the existing target control; use ordinary blade or bow.'),
  step('reclaimer-settled','Settle the actual Optical Reclaimer','defeat',36,-40,['challenge-reclaimer'],
   'Only actual owned combat exhaustion records this fact. No journal button, independent XP or drop substitutes for it.'),
  step('isolate-service-feed','Physically isolate the imposed service feed','configure',40,-40,['reclaimer-settled'],
   'Turn the isolated service branch to its supplied independent setting. The public approach remains available. This physical operation is separate from combat exhaustion.',{setting:'isolate-imposed-feed'}),
  step('challenge-guardian','Begin the Still Meridian Guardian operation','interact',47,-44,['isolate-service-feed'],
   'Read the two safe responses and both physical feed releases before beginning. The Guardian remains anchored on its grounded court. Avar is accountable for this local project; he is not a repeatable unique-death reward.'),
  step('release-west-feed','Release the transverse-bar feed','configure',49,-49,['challenge-guardian'],
   'Physically release the west feed. The transverse bar is omitted from newly locked crosses; a current warning/contact frame remains unchanged. This release can be done before or after actual Guardian exhaustion.',{setting:'release-transverse-feed'}),
  step('release-east-feed','Release the outer-ring feed','configure',59,-39,['challenge-guardian'],
   'Physically release the east feed. New rings have a 3.2 outer radius instead of 4.6; the clear 1.8 inner circle and ordinary damage/timing remain. A current locked frame stays unchanged.',{setting:'release-outer-feed'}),
  step('guardian-settled','Settle the actual Still Meridian Guardian','defeat',54,-44,['challenge-guardian'],
   'Actual owned combat must exhaust the Guardian. This fact alone neither releases its two feeds nor stops the central project, opens the apparatus or grants a fee.'),
  step('disable-central-link','Disable the coercive central synchronization','configure',54,-48,['release-west-feed','release-east-feed','guardian-settled'],
   'Physically disconnect the imposed synchronization after both actual releases and genuine Guardian exhaustion. Avar’s harmful local project is stopped. Regional accountability and independent reconfiguration remain.',{setting:'disconnect-central-synchronization'}),
  step('accountability','Record the local accountability arrangement','choice',45,-35,['disable-central-link'],
   'Choose the public mechanical account alone or add Avar’s bounded authored statement in local custody. Both retain the full service-cost facts and responsibility. No personal archive, cosmic verdict, class or soul choice is required.'),
  step('configure-material','Set the prepared material branch independently','configure',22,-46,['accountability'],
   'Give the prepared material fitting its own rated setting. Any two distinct prepared branches must be physically reconfigured; a third remains optional.',{optional:true,requiresSupport:'material',setting:'independent-material-interval'}),
  step('configure-living','Set the prepared garden return independently','configure',26,-33,['accountability'],
   'Set the prepared return’s local adjustment. It remains a bounded authored fixture, not an offline cultivation economy.',{optional:true,requiresSupport:'living',setting:'independent-living-interval'}),
  step('configure-observation','Publish the prepared named interval independently','configure',30,-40,['accountability'],
   'Set the prepared named-station instrument to its independent interval and preserve its limits.',{optional:true,requiresSupport:'observation',setting:'independent-observation-interval'}),
  step('open-confluence','Open the independent local service interval','configure',32.5,-29,['accountability'],
   'At this real public-loop instrument, open the interval only after at least two prepared branches have actually been reconfigured. The persistent local open state changes apparatus and recognition. Ground and solids remain static in every state.',{requiresConfiguredSupports:2,setting:'open-independent-interval'}),
  step('verify-open-bearings','Verify the open apparatus and public account','interact',44,-29,['open-confluence'],
   'At the supported public-loop marker, check the independently open apparatus against the saved account and selected support fittings. No city, private archive, real Luna service or ultimate Answering is certified. Return normally to Anik and explicitly claim the fixed fee.')
 ],
 choices:[
  {id:'public-record',name:'Public mechanical account',text:'Publish the public mechanical account of the local feed marks, harmful synchronization, disabling and independent settings. Keep Avar’s responsibility visible without requiring his whole personal history.',
   consequence:'The service instrument displays the public mechanical account and Anik’s continuing check marks. Avar’s local project stays disabled; his wider fate and formal proceedings remain outside this adaptation.',
   recognition:[{name:'Anik',text:'Both stations and the local cost remain named. The mechanism is open to inspection.'},{name:'Avar Senn',text:'The service marks show the cost I excluded. This installation is no longer mine to hold in that configuration.'}]},
  {id:'bounded-account',name:'Public facts with bounded testimony',text:'Keep the same public mechanical account and accept Avar’s declared short statement in Anik’s local custody. Do not demand a private life or treat limited testimony as amnesty.',
   consequence:'The public mechanical facts remain beside a marked local testimony folder. Anik records its scope. Avar’s responsibility and disabled local project persist; no private account is mined and no global pardon is granted.',
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
