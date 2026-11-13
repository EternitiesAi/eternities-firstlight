#!/usr/bin/env node
'use strict';
/* The firstlight journey: title to credits, through the owners' commands. The beat list is data. A beat whose module is
 * not in this build prints as skipped with the module's path; a beat with no command wired here prints as skipped with
 * why. The finale segment starts from an earned late world (not a fresh character) and says so. Usage:
 *   node tools/firstlight_journey.cjs            (prints every beat and the simulated time)
 *   node tools/firstlight_journey.cjs --finale   (only the finale segment) */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'src/core.js')), SG = require(path.join(ROOT, 'src/saga.js'));
const LATE = 'tests/fixtures/earth-homecoming-prerequisites/blade/ALL_TWELVE_PREREQUISITES_EARNED.json';
const here = p => fs.existsSync(path.join(ROOT, p));

// the story, in order. owner is the module the beat needs; cmd says which command this journey runs for it.
const BEATS = [
 { id: 'title', owner: 'src/title.js', cmd: 'browser title screen' },
 { id: 'kit', owner: 'src/adventure.js', cmd: null },
 { id: 'hart', owner: 'src/adventure.js', cmd: null },
 { id: 'envoy', owner: 'src/adventure.js', cmd: null },
 { id: 'road', owner: 'src/road.js', cmd: null },
 { id: 'beacon', owner: 'src/beacon.js', cmd: null },
 { id: 'bellweather', owner: 'src/crossing.js', cmd: null },
 { id: 'night', owner: 'src/night.js', cmd: null },
 { id: 'hell', owner: 'src/hell-campaign.js', cmd: null, note: 'needs the hell rewrite' },
 { id: 'heaven', owner: 'src/heaven-campaign.js', cmd: null, note: 'needs the heaven rewrite' },
 { id: 'witness', owner: 'src/atlantis-campaign.js', cmd: null, note: 'needs the witness and cosmos rewrite' },
 { id: 'nearshore', owner: 'src/nearshore.js', cmd: null },
 { id: 'finale', owner: 'src/finale.js', cmd: 'finale owner commands' },
 { id: 'epilogue', owner: 'src/epilogue.js', cmd: 'epilogue and credits' },
];

const log = [];
let t0 = 0, sim = null;
function beat(id, ok, text) { const at = sim ? sim.state.adventure.elapsed - t0 : 0; log.push({ id, ok, text, at }); console.log((ok ? 'ran    ' : 'skipped') + ' ' + id.padEnd(12) + ' ' + text + '  [' + at.toFixed(1) + 's]'); }
function skip(b) { beat(b.id, false, 'owner ' + b.owner + ' is not in this build' + (b.note ? ' (' + b.note + ')' : '') + '; the beat is not played'); }

// the finale segment runs on an earned late world with the saga at the nearshore. the beats before it are the skipped list above.
function lateWorld() {
 const raw = JSON.parse(fs.readFileSync(path.join(ROOT, LATE), 'utf8')); delete raw.saga;
 const w = C.validate(raw); w.saga = { ...SG.infer(w), beats: { night: { day: 10 } }, briar: { state: 'returned', habit: {}, takenDay: 10, returnedDay: 10 } };
 return C.validate(JSON.parse(JSON.stringify(w)));
}
function walkTo(x, z, cap = 60) { sim.moveTo(x, z); for (let t = 0; t < cap; t += .1) { sim.tick(.1); if (Math.hypot(sim.state.player.x - x, sim.state.player.z - z) < .6) return true; } return false; }
const tick = s => { for (let i = 0; i < s * 10; i++) sim.tick(.1); };
const bodyOf = ph => globalThis.RealmAdventure.runtime(sim).enemies.find(e => e.finaleRole === 'regent' && e.finalePhase === ph);
const phase = () => sim.state.saga.finale.phase;

function finaleSegment() {
 const EH = globalThis.RealmEarthHomecoming, E = require(path.join(ROOT, 'src/epilogue.js'));
 sim = new C.Simulation(lateWorld()); sim.earthHomecomingSave = io => { sim.saved = JSON.parse(JSON.stringify(io)); return { ok: true }; };
 t0 = sim.state.adventure.elapsed;
 beat('start', walkTo(0, 6) && (tick(.3), phase() === 1), 'walked to the spring; the Regent rises (phase ' + phase() + ')');
 let guard = 0; while (phase() < 2 && guard++ < 600) tick(.1);
 beat('chains', phase() === 2, 'chains broken: ' + (sim.saved?.earthHomecoming?.finale?.broken || []).join(', ') + '; the freed allies broke them; phase ' + phase());
 tick(.3); const b2 = bodyOf(2);
 globalThis.RealmAdventure.damageEnemy(sim, b2, 100000); tick(.2);
 beat('merged', phase() === 3, 'the second body fell; the Regent falls back and offers a gift (phase ' + phase() + ')');
 const ctx = { sim, active: 'journey' };
 const r = EH.command(ctx, 'offer', { quest: EH.definition.id, expectedActive: 'journey', expectedRevision: sim.state.adventure.revision, choice: 'refuse' }, { save: io => { sim.saved = JSON.parse(JSON.stringify(io)); return { ok: true }; } });
 beat('offer', r.ok === true, r.ok ? 'refused the gift; the last fight is open' : 'refusal refused: ' + r.error);
 tick(.2); globalThis.RealmAdventure.damageEnemy(sim, bodyOf(3), 100000); tick(.2);
 beat('won', sim.state.saga.finale.won === true, 'the last hit landed; the camera rises (view ' + (EH.view(sim) ? 'on' : 'off') + ')');
 tick(8.5);
 beat('credits', sim.state.saga.credits === true && sim.state.saga.postgame === true, 'credits rolled; postgame ' + sim.state.saga.postgame);
 const changes = E.changes(sim.state).map(c => c.id);
 beat('epilogue', changes.length >= 5, 'the valley changed in ' + changes.length + ' places: ' + changes.join(', '));
 const credits = E.credits().flatMap(s => s.lines);
 beat('lines', credits.includes('made by Dom (Eternities) with Claude'), 'credits read: ' + credits[0]);
}

function main() {
 const only = process.argv.includes('--finale');
 const start = Date.now();
 if (!only) for (const b of BEATS) { if (!here(b.owner)) skip(b); else beat(b.id, false, 'owner present; no command is wired in this journey yet'); }
 console.log('--- finale segment: an earned late world, not a fresh character ---');
 finaleSegment();
 const ran = log.filter(x => x.ok).length, total = log.length;
 console.log('--- ' + ran + ' of ' + total + ' beats ran; simulated ' + (sim ? (sim.state.adventure.elapsed - t0).toFixed(1) : '0') + 's; wall ' + ((Date.now() - start) / 1000).toFixed(1) + 's');
 if (log.some(x => !x.ok)) process.exitCode = 1;
}
main();
