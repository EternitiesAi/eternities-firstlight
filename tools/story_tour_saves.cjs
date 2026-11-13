#!/usr/bin/env node
'use strict';
/* Command-earned checkpoints for the story tour. Each owning journey runs its own commands into its own folder; every save
 * it writes is read back through the real validator and listed in MANIFEST.json with the saga beats it completes and the
 * beat it is on. beats-index.json then picks one save per tour scene from that evidence. A journey that throws, or writes
 * nothing, is recorded with why. The finale is the same command sequence as tools/firstlight_journey.cjs, saved at each
 * phase. Usage: node tools/story_tour_saves.cjs <folder>
 */
const fs = require('node:fs'), path = require('node:path'), childProcess = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'src/core.js')), SG = require(path.join(ROOT, 'src/saga.js'));

const folder = process.argv[2];
if (!folder) throw Error('usage: node tools/story_tour_saves.cjs <folder>');
const root = path.resolve(folder);
fs.mkdirSync(root, { recursive: true });

// journey module, the option that names its output folder. Heaven, atlantis and cosmos refuse non-D: folders on Windows
// only, so the box (Linux) is where this runs in full.
const JOURNEYS = [
  { id: 'chapter', module: 'tests/chapter_journey.cjs', option: 'out' },
  { id: 'beacon', module: 'tests/beacon_journey.cjs', option: 'out' },
  { id: 'road', module: 'tests/road_journey.cjs', option: 'out', prepare: ['chapter1'] },
  { id: 'crossing', module: 'tests/crossing_journey.cjs', option: 'out' },
  { id: 'hell', module: 'tests/hell_campaign_journey.cjs', option: 'output' },
  { id: 'heaven', module: 'tests/heaven_campaign_journey.cjs', option: 'output' },
  { id: 'atlantis', module: 'tests/atlantis_campaign_journey.cjs', option: 'output' },
  { id: 'cosmos', module: 'tests/cosmos_campaign_journey.cjs', option: 'output' },
  { id: 'realm-south', module: 'tests/realm_trails_south_journey.cjs', option: 'output' },
  { id: 'realm-cosmos', module: 'tests/realm_trails_cosmos_journey.cjs', option: 'output' },
];

// the saga's view of one save: the beats it completes, the beat it is on, and the finale and credits flags.
function describe(state) {
  const done = SG.BEATS.map(b => b.id).filter(id => SG.done(state, id));
  return { done, current: SG.current(state)?.id ?? null, finalePhase: state.saga?.finale?.phase ?? null, credits: state.saga?.credits === true };
}

function walkJson(dir) {
  const found = [];
  const visit = d => { for (const name of fs.readdirSync(d).sort()) { const p = path.join(d, name); if (fs.statSync(p).isDirectory()) visit(p); else if (name.endsWith('.json')) found.push(p); } };
  if (fs.existsSync(dir)) visit(dir);
  return found;
}

function saveEntry(file) {
  const name = path.relative(root, file).split(path.sep).join('/');
  try {
    const state = C.validate(JSON.parse(fs.readFileSync(file, 'utf8')));
    return { file: name, valid: true, ...describe(state) };
  } catch (error) {
    return { file: name, valid: false, error: String(error && error.message || error).slice(0, 160) };
  }
}

const manifest = { made: new Date().toISOString(), sources: [] };
function collect(id, module, dir, run) {
  const entry = { id, module, ok: false, error: null, files: [] };
  try { run(); entry.ok = true; } catch (error) { entry.error = String(error && error.message || error).slice(0, 400); }
  entry.files = walkJson(dir).map(saveEntry);
  if (entry.ok && entry.files.length === 0) entry.error = 'ran but wrote no save';
  manifest.sources.push(entry);
  console.log((entry.ok ? 'ran    ' : 'failed ') + id.padEnd(12) + ' saves ' + entry.files.length + (entry.error ? '  ' + entry.error : ''));
  return entry;
}

for (const j of JOURNEYS) {
  const dir = path.join(root, j.id);
  fs.mkdirSync(dir, { recursive: true });
  for (const sub of j.prepare || []) fs.mkdirSync(path.join(dir, sub), { recursive: true });
  collect(j.id, j.module, dir, () => { require(path.join(ROOT, j.module)).journey({ [j.option]: dir }); });
}

// the night set piece: the lead's frame saves, from the crossing journey's earned chapter IV save.
{
  const dir = path.join(root, 'night');
  fs.mkdirSync(dir, { recursive: true });
  collect('night', 'tools/night_frames_save.cjs', dir, () => {
    childProcess.execFileSync(process.execPath, [path.join(ROOT, 'tools/night_frames_save.cjs'), dir], { stdio: 'pipe' });
  });
}

// the finale: the same commands as tools/firstlight_journey.cjs, saved at phase 1, phase 2, phase 3, the won hit, and the
// credits roll. The late world is an earned fixture, not a fresh character.
{
  const dir = path.join(root, 'finale');
  fs.mkdirSync(dir, { recursive: true });
  const LATE = 'tests/fixtures/earth-homecoming-prerequisites/blade/ALL_TWELVE_PREREQUISITES_EARNED.json';
  collect('finale', LATE, dir, () => {
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, LATE), 'utf8')); delete raw.saga;
    const w = C.validate(raw);
    w.saga = { ...SG.infer(w), beats: { night: { day: 10 } }, briar: { state: 'returned', habit: {}, takenDay: 10, returnedDay: 10 } };
    const sim = new C.Simulation(C.validate(JSON.parse(JSON.stringify(w))));
    const EH = globalThis.RealmEarthHomecoming;
    const io = { save: v => { sim.saved = JSON.parse(JSON.stringify(v)); return { ok: true }; } };
    sim.earthHomecomingSave = io.save;
    const phase = () => sim.state.saga.finale.phase;
    const tick = s => { for (let i = 0; i < s * 10; i++) sim.tick(.1); };
    const walkTo = (x, z, cap = 60) => { sim.moveTo(x, z); for (let t = 0; t < cap; t += .1) { sim.tick(.1); if (Math.hypot(sim.state.player.x - x, sim.state.player.z - z) < .6) return true; } return false; };
    const bodyOf = ph => globalThis.RealmAdventure.runtime(sim).enemies.find(e => e.finaleRole === 'regent' && e.finalePhase === ph);
    const save = name => { const p = path.join(dir, name + '.json'); fs.writeFileSync(p, JSON.stringify(sim.snapshot(), null, 2) + '\n'); };
    if (!(walkTo(0, 6) && (tick(.3), phase() === 1))) throw Error('the finale did not begin at the spring (phase ' + phase() + ')');
    save('phase1_rises');
    let guard = 0; while (phase() < 2 && guard++ < 600) tick(.1);
    if (phase() !== 2) throw Error('phase 2 was not reached');
    save('phase2_chains');
    tick(.3); globalThis.RealmAdventure.damageEnemy(sim, bodyOf(2), 100000); tick(.2);
    if (phase() !== 3) throw Error('phase 3 was not reached');
    save('phase3_merged');
    const r = EH.command({ sim, active: 'journey' }, 'offer', { quest: EH.definition.id, expectedActive: 'journey', expectedRevision: sim.state.adventure.revision, choice: 'refuse' }, io);
    if (r.ok !== true) throw Error('the refusal was refused: ' + r.error);
    tick(.2); globalThis.RealmAdventure.damageEnemy(sim, bodyOf(3), 100000); tick(.2);
    if (sim.state.saga.finale.won !== true) throw Error('the last hit did not land');
    save('won');
    tick(8.5);
    if (!(sim.state.saga.credits === true && sim.state.saga.postgame === true)) throw Error('the credits did not roll');
    save('epilogue_credits');
  });
}

// one save per tour scene, named from the journeys' own checkpoints. The why column says what the saga reports for that
// save (see the manifest). A scene whose checkpoint did not come out of its journey is reported as unreached, with why.
const SCENES = [
  { scene: 'envoy', file: 'chapter/ENVOY_BEFORE_CHOICE.json', why: 'at the spring before the envoy chooses; envoy and feather done' },
  { scene: 'feather', file: 'chapter/CHAPTER_COMPLETED.json', why: 'after the feather sight at the spring; feather done' },
  { scene: 'beacon', file: 'beacon/BEACON_READY_EARNED.json', why: 'at the beacon before it is lit; beacon is current' },
  { scene: 'bellweather', file: 'crossing/CROSSING_READY_EARNED.json', why: 'at the crossing; bellweather is current' },
  { scene: 'night-lit', file: 'night/night-lit.json', why: 'the night has begun; night is current (lead night save)' },
  { scene: 'night-quiet', file: 'night/night-quiet.json', why: 'after the bite, Briar taken (lead night save)' },
  { scene: 'hell', file: 'hell/fresh-blade/04_WARDEN_RESOLVED.json', why: 'the foundry warden is resolved' },
  { scene: 'heaven', file: 'heaven/05_ACTUAL_COURIER_ARRIVAL.json', why: 'the courier arrives in heaven' },
  { scene: 'relay', file: 'heaven/03_FALSE_SIGNAL_WATCH.json', why: 'the counterfeit relay signal; the seraph fight itself is not checkpointed' },
  { scene: 'witness', file: 'atlantis/07_ACTUAL_BEARING_EXPOSED.json', why: 'the drowned witness bearing is exposed' },
  { scene: 'cosmos', file: 'cosmos/08_INDEPENDENT_SUPPORT_SETTINGS.json', why: 'independent cosmos anchors; the central link is disabled' },
  { scene: 'nearshore', file: null, why: 'no checkpoint writer for the nearshore in this build; its path is a test file' },
  { scene: 'finale-1', file: 'finale/phase1_rises.json', why: 'the Regent rises at the spring junction; phase 1' },
  { scene: 'finale-2', file: 'finale/phase2_chains.json', why: 'chains broken; phase 2' },
  { scene: 'finale-3', file: 'finale/phase3_merged.json', why: 'the merged valley; phase 3' },
  { scene: 'epilogue', file: 'finale/epilogue_credits.json', why: 'the valley after the last hit' },
  { scene: 'credits', file: 'finale/epilogue_credits.json', why: 'credits rolled (saga credits true)' },
];
const index = SCENES.map(spec => {
  if (!spec.file) return { scene: spec.scene, file: null, why: spec.why };
  const present = fs.existsSync(path.join(root, spec.file));
  return present ? { scene: spec.scene, file: spec.file, why: spec.why } : { scene: spec.scene, file: null, why: 'the journey wrote no ' + spec.file };
});
fs.writeFileSync(path.join(root, 'MANIFEST.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(root, 'beats-index.json'), JSON.stringify(index, null, 2));
for (const row of index) console.log((row.file ? 'scene    ' : 'UNREACHED ') + row.scene.padEnd(13) + (row.file || row.why));
