#!/usr/bin/env node
'use strict';
/* Command-earned checkpoints for the story tour. Each owning journey runs its own commands into its own folder; every save
 * it writes is read back through the real validator and listed in MANIFEST.json with the saga beats it completes and the
 * beat it is on. beats-index.json then picks one save per tour scene from that evidence. A journey that throws, or writes
 * nothing, is recorded with why. The finale is the same command sequence as tools/firstlight_journey.cjs, saved at each
 * phase. Usage: node tools/story_tour_saves.cjs <folder>
 */
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), childProcess = require('node:child_process');
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
  { id: 'cosmos', module: 'tests/cosmos_campaign_journey.cjs', option: 'output', outside: true },
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

// command-level checkpoints. A rule writes the sim's state the first time its predicate holds around a real command, so the
// writer never edits state: the journey runs the same sim commands the page runs. The methods are restored afterwards.
function watch(rules, owner, names) {
  const originals = names.map(name => owner[name]);
  names.forEach((name, i) => {
    owner[name] = function (...args) {
      const type = args[1];
      for (const rule of rules) if (!rule.done && rule.before && rule.before(this, type)) write(rule, this);
      const result = originals[i].apply(this, args);
      for (const rule of rules) if (!rule.done && rule.after && rule.after(this, type)) write(rule, this);
      return result;
    };
  });
  return () => names.forEach((name, i) => { owner[name] = originals[i]; });
}
function write(rule, sim) {
  rule.done = true;
  fs.mkdirSync(path.dirname(rule.path), { recursive: true });
  fs.writeFileSync(rule.path, JSON.stringify(sim.snapshot(), null, 2) + '\n');
}
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
  // a journey that refuses output inside the checkout writes to a temp folder; its saves are copied under the journey's folder.
  const target = j.outside ? fs.mkdtempSync(path.join(os.tmpdir(), 'story-tour-' + j.id + '-')) : dir;
  collect(j.id, j.module, dir, () => {
    require(path.join(ROOT, j.module)).journey({ [j.option]: target });
    if (target === dir) return;
    for (const file of walkJson(target)) {
      const copy = path.join(dir, path.relative(target, file));
      fs.mkdirSync(path.dirname(copy), { recursive: true });
      fs.copyFileSync(file, copy);
    }
  });
}

// the night set piece, command-driven: the night journey's own commands. Checkpoints are written when the night has begun
// (lit: device hidden) and after the bite (quiet: device broken), as the game saves them, at home.
{
  const dir = path.join(root, 'night');
  fs.mkdirSync(dir, { recursive: true });
  const rules = [
    { path: path.join(dir, 'NIGHT_LIT_AT_HOME.json'), after: sim => sim.state.night?.started === true && sim.state.night?.device === 'hidden' },
    { path: path.join(dir, 'NIGHT_QUIET_AT_HOME.json'), after: sim => sim.state.night?.device === 'broken' },
  ];
  // the night can start on a tick as well as on a command, so the ticks are watched too.
  const stop = watch(rules, C.Simulation.prototype, ['adventureCommand', 'act', 'sagaCommand', 'tick']);
  try {
    collect('night', 'tests/night_journey.cjs', dir, () => { require(path.join(ROOT, 'tests/night_journey.cjs')).journey({ out: dir }); });
  } finally {
    stop();
  }
}

// the nearshore: the choice is open after the regent offers the faultless fox, before the real choose. The source is the first
// command-earned save the journeys above wrote where the witness is done and Briar is taken. None means the nearshore is a gap.
{
  const dir = path.join(root, 'nearshore');
  fs.mkdirSync(dir, { recursive: true });
  const SG = require(path.join(ROOT, 'src/saga.js'));
  const source = walkJson(root).find(p => {
    try { const s = C.validate(JSON.parse(fs.readFileSync(p, 'utf8'))); return SG.done(s, 'witness') && s.saga.briar.state === 'taken'; } catch (error) { return false; }
  });
  collect('nearshore', 'tests/nearshore_journey.cjs', dir, () => {
    if (!source) throw Error('no witness-finished save with Briar taken was written by the journeys above');
    require(path.join(ROOT, 'tests/nearshore_journey.cjs')).journey({
      out: dir,
      source,
      beforeChoose: sim => fs.writeFileSync(path.join(dir, 'NEARSHORE_CHOICE_OPEN.json'), JSON.stringify(sim.snapshot(), null, 2) + '\n'),
    });
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
// the crossing is a waystone room: the page enters it with the real travel command after the home checkpoint is loaded.
const TRAVEL_BELL = [{ act: { id: 'tour-travel-bellweather', type: 'waystone-travel', payload: { id: 'bellweather' } } }];
const SCENES = [
  { scene: 'envoy', file: 'chapter/ENVOY_BEFORE_CHOICE.json', why: 'at the spring before the envoy chooses; envoy and feather done' },
  { scene: 'feather', file: 'chapter/CHAPTER_COMPLETED.json', why: 'after the feather sight at the spring; feather done' },
  { scene: 'beacon', file: 'beacon/BEACON_READY_EARNED.json', why: 'at the beacon before it is lit; beacon is current' },
  { scene: 'bellweather', file: 'crossing/CROSSING_READY_EARNED.json', steps: TRAVEL_BELL, why: 'the Roads of Light travel to the crossing (waystone-travel)' },
  { scene: 'night-lit', file: 'night/NIGHT_LIT_AT_HOME.json', steps: TRAVEL_BELL, why: 'the night has begun; the crossing is reached by the real travel' },
  { scene: 'night-quiet', file: 'night/NIGHT_QUIET_AT_HOME.json', steps: TRAVEL_BELL, why: 'after the bite, Briar taken; the crossing is reached by the real travel' },
  { scene: 'hell', file: 'hell/fresh-blade/04_WARDEN_RESOLVED.json', why: 'the foundry warden is resolved' },
  { scene: 'heaven', file: 'heaven/05_ACTUAL_COURIER_ARRIVAL.json', why: 'the courier arrives in heaven' },
  { scene: 'relay', file: 'heaven/03_FALSE_SIGNAL_WATCH.json', why: 'the counterfeit relay signal; the seraph fight itself is not checkpointed' },
  { scene: 'witness', file: 'atlantis/07_ACTUAL_BEARING_EXPOSED.json', why: 'the drowned witness bearing is exposed' },
  { scene: 'cosmos', file: 'cosmos/08_INDEPENDENT_SUPPORT_SETTINGS.json', why: 'independent cosmos anchors; the central link is disabled' },
  { scene: 'nearshore', file: 'nearshore/NEARSHORE_CHOICE_OPEN.json', why: 'the regent has offered the faultless fox; the choice is open (two foxes)' },
  { scene: 'finale-1', file: 'finale/phase1_rises.json', why: 'the Regent rises at the spring junction; phase 1' },
  { scene: 'finale-2', file: 'finale/phase2_chains.json', why: 'chains broken; phase 2' },
  { scene: 'finale-3', file: 'finale/phase3_merged.json', why: 'the merged valley; phase 3' },
  { scene: 'epilogue', file: 'finale/epilogue_credits.json', why: 'the valley after the last hit' },
  { scene: 'credits', file: 'finale/epilogue_credits.json', why: 'credits rolled (saga credits true)' },
];
// a checkpoint is found by its file name under its journey's folder; campaign journeys keep their saves in variant subfolders.
function findSave(source, name) {
  const hit = walkJson(path.join(root, source)).find(p => path.basename(p) === name);
  return hit ? path.relative(root, hit).split(path.sep).join('/') : null;
}
const index = SCENES.map(spec => {
  if (!spec.file) return { scene: spec.scene, file: null, why: spec.why };
  const parts = spec.file.split('/');
  const found = findSave(parts[0], parts[parts.length - 1]);
  return found ? { scene: spec.scene, file: found, why: spec.why, steps: spec.steps || [] } : { scene: spec.scene, file: null, why: 'the journey wrote no ' + spec.file };
});
fs.writeFileSync(path.join(root, 'MANIFEST.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(root, 'beats-index.json'), JSON.stringify(index, null, 2));
for (const row of index) console.log((row.file ? 'scene    ' : 'UNREACHED ') + row.scene.padEnd(13) + (row.file || row.why));
