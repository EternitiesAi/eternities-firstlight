#!/usr/bin/env node
'use strict';
/* The firstlight journey bot. One fresh character runs the producers' real-command journeys in story order. Each stage
 * starts from the previous stage's saved world, so the character continues: chapter one, the road, the beacon, the
 * bellweather crossing, the night, the local realms, then the hell and heaven campaigns (the connected helpers take the
 * live world). Times, levels, hp and gear come from the saved worlds. Beats with no producer print as not wired, with the
 * reason, and the bot stops at the first blocked beat. The bot never plants a defeat, edits a position or a stat.
 * Usage: node tools/firstlight_journey.cjs [--out <dir>]
 * Importable: require('./firstlight_journey.cjs').run({ out, quiet }) returns { rows, creditsRolled, stoppedAt, totals }. */
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
process.env.FIRSTLIGHT_ROOT = process.env.FIRSTLIGHT_ROOT || ROOT;
const AD = require(path.join(ROOT, 'src/adventure.js'));
const TACTICS = require('./journey_tactics.cjs');
const BEATS = ['kit', 'hart', 'envoy', 'road', 'beacon', 'bellweather', 'night', 'hell', 'heaven', 'atlantis', 'cosmos', 'nearshore', 'finale', 'credits'];
const NOT_YET = {
 atlantis: 'the atlantis helper runs after heaven; heaven is blocked',
 cosmos: 'the cosmos helper runs after atlantis; not reached',
 nearshore: 'no nearshore producer yet (src/nearshore.js commands are not driven)',
 finale: 'the finale check (tests/finale.test.cjs) uses an earned world; the fresh finale is not reached',
 credits: 'not reached: the chain stops before the finale'
};

// a folder the connected helpers accept: evidence belongs on D: when D: exists, otherwise the system temp folder.
function outFolder(explicit) {
 if (explicit) return explicit;
 const base = fs.existsSync('D:/') ? 'D:/firstlight/runs' : os.tmpdir();
 return fs.mkdtempSync(path.join(base, 'firstlight-journey-'));
}
const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));
// what a saved world shows: simulated time, level, hp, and the gear it wears.
function state(world) {
 const a = world.adventure, s = AD.stats(a);
 return { t: a.elapsed, level: AD.level(a), hp: a.hp, maxHP: s.maxHP, gear: Object.values(a.equipment || {}).filter(Boolean).join(' + ') || 'none' };
}
function ran(rows, beat, from, to, detail, log) {
 const a = state(to), b = from ? state(from) : { t: 0 };
 const r = { beat, status: 'ran', secs: +(a.t - b.t).toFixed(1), level: a.level, hp: a.hp + '/' + a.maxHP, gear: a.gear, detail };
 rows.push(r); if (log) log(r); return r;
}
function ranNoWorld(rows, beat, detail, log) { const r = { beat, status: 'ran', secs: null, level: null, hp: null, gear: null, detail }; rows.push(r); if (log) log(r); return r; }
function blocked(rows, beat, why, log) { const r = { beat, status: 'blocked', why: String(why).split('\n')[0].slice(0, 200) }; rows.push(r); if (log) log(r); return r; }
function notReached(rows, beat, log) { const r = { beat, status: 'not reached', why: NOT_YET[beat] }; rows.push(r); if (log) log(r); return r; }
function fmt(r) {
 if (r.status !== 'ran') return (r.status === 'blocked' ? 'BLOCKED   ' : 'not reached ') + r.beat.padEnd(11) + ' ' + r.why;
 const time = r.secs === null ? 'n/a' : r.secs + 's';
 return 'ran       ' + r.beat.padEnd(11) + ' ' + time.padStart(8) + '  lv ' + (r.level ?? '-') + '  hp ' + (r.hp ?? '-') + '  ' + (r.gear ?? '-') + '  ' + r.detail;
}

function run(options = {}) {
 TACTICS.install(); TACTICS.reset();
 const out = outFolder(options.out);
 fs.mkdirSync(out, { recursive: true });
 const log = options.quiet ? null : r => console.log(fmt(r));
 const rows = []; let stoppedAt = null, creditsRolled = false;
 const sub = n => path.join(out, n);
 const f = (dir, file) => path.join(sub(dir), file);
 const fresh = { adventure: { elapsed: 0, xp: 0, hp: 100, equipment: {} } };
 let world = null; // the path of the saved world the next stage starts from

 // chapter one: kit, the hollow hart and the envoy, from a fresh save
 try {
  require(path.join(ROOT, 'tests/chapter_journey.cjs')).journey({ out: sub('01'), reward: 'warden_stone' });
  const start = readJson(f('01', 'OPTIONAL_CHAPTER_START.json')), before = readJson(f('01', 'ENVOY_BEFORE_CHOICE.json'));
  const done = readJson(f('01', 'CHAPTER_COMPLETED.json'));
  ran(rows, 'kit', fresh, start, 'workshop supplies, the pickaxe, the repaired crossing', log);
  ran(rows, 'hart', start, before, 'the underways, Briar rescued, the hart freed, the relic', log);
  ran(rows, 'envoy', before, done, 'prophecy and the feather sight; the warden stone chosen', log);
  world = f('01', 'CHAPTER_COMPLETED.json');
 } catch (e) { blocked(rows, 'kit', e.message, log); stoppedAt = 'kit'; }

 // act II: the road
 const stage = (beat, dir, file, fn, detail) => {
  if (!world) return;
  const prev = world, before = readJson(prev);
  try { fs.mkdirSync(sub(dir), { recursive: true }); fn(); const next = f(dir, file); ran(rows, beat, before, readJson(next), detail, log); world = next; }
  catch (e) { blocked(rows, beat, e.message, log); stoppedAt = stoppedAt || beat; world = null; }
 };
 stage('road', '02', 'CHAPTER_II_COMPLETE_EARNED.json', () => require(path.join(ROOT, 'tests/road_journey.cjs')).journey({ out: sub('02'), start: readJson(world) }), 'the sunward road, Tessa, the ram');
 stage('beacon', '03', 'CHAPTER_III_COMPLETE_EARNED.json', () => require(path.join(ROOT, 'tests/beacon_journey.cjs')).journey({ out: sub('03'), source: world }), 'the sighting, then the defence of the beacon');
 stage('bellweather', '04', 'CHAPTER_IV_COMPLETE_EARNED.json', () => require(path.join(ROOT, 'tests/crossing_journey.cjs')).journey({ out: sub('04'), source: world }), 'the crossing, the keeper, Rowan\'s bell');

 // the night the warning failed: it starts from the crossing save and leaves its own save
 stage('night', '05', 'NIGHT_COMPLETE.json', () => require(path.join(ROOT, 'tests/night_journey.cjs')).journey({ out: sub('05'), source: world }), 'Briar bites the device; the travellers are called out; the envoy speaks');

 // the local realms (Earth side) and the hell campaign: the connected helper takes the live world
 TACTICS.setDodge(false); // the connected realm helpers brace and stand; see journey_tactics.cjs
 let hellRaw = null;
 if (world) {
  const before = readJson(world);
  try {
   const er = require(path.join(ROOT, 'tools/earth-homecoming-journey/early_realms.cjs')).run({ input: world, bow: false, folder: sub('06') });
   const hell = require(path.join(ROOT, 'tools/earth-homecoming-journey/connected_hell.cjs')).journey({ root: ROOT, inheritedWorld: er.final, connectedVariant: 'connected-blade', bow: false, output: sub('07') });
   if (hell.status !== 'passed') throw new Error('hell helper status ' + hell.status);
   hellRaw = f('07', 'connected-blade/FINAL_WORLD.json');
   ran(rows, 'hell', before, readJson(hellRaw), 'the local realms, then the foundry: the stolen pattern, the regent\'s hall', log);
   world = hellRaw;
  } catch (e) { blocked(rows, 'hell', e.message, log); stoppedAt = stoppedAt || 'hell'; world = null; }
 }

 // heaven: the campaign helper takes the hell save
 if (world) {
  const before = readJson(world);
  try {
   const h = require(path.join(ROOT, 'tools/earth-homecoming-journey/connected_heaven.cjs')).journey({ root: ROOT, inheritedWorld: world, connectedVariant: 'connected-blade', bow: false, output: sub('08') });
   if (h.status !== 'passed') throw new Error('heaven helper status ' + h.status);
   world = f('08', 'connected-blade/FINAL_WORLD.json');
   ran(rows, 'heaven', before, readJson(world), 'the gardens, the envoy\'s home, the prophecy reread', log);
  } catch (e) { blocked(rows, 'heaven', e.message, log); stoppedAt = stoppedAt || 'heaven'; world = null; }
 }

 // atlantis and cosmos: the connected helpers take the heaven save, as the campaigns before them did
 for (const [beat, file, dir, detail] of [['atlantis', 'connected_atlantis.cjs', '09', 'the drowned witness: the pattern proven stolen'], ['cosmos', 'connected_cosmos.cjs', '10', 'the cosmos: the cure without a master key']]) {
  if (!world) break;
  const before = readJson(world);
  try {
   const h = require(path.join(ROOT, 'tools/earth-homecoming-journey/' + file)).journey({ root: ROOT, inheritedWorld: world, connectedVariant: 'connected-blade', bow: false, output: sub(dir) });
   if (h.status !== 'passed') throw new Error(beat + ' helper status ' + h.status);
   world = f(dir, 'connected-blade/FINAL_WORLD.json');
   ran(rows, beat, before, readJson(world), detail, log);
  } catch (e) { blocked(rows, beat, e.message, log); stoppedAt = stoppedAt || beat; world = null; }
 }

 TACTICS.setDodge(true);
 // the nearshore: the live witness save walks out to the pier, and the real Briar at her habit place is chosen
 if (world) {
  const before = readJson(world);
  try {
   const n = require(path.join(ROOT, 'tests/nearshore_journey.cjs')).journey({ out: sub('11'), source: world });
   world = n.final;
   ran(rows, 'nearshore', before, readJson(world), 'the lantern pier: the real Briar at her habit place is chosen', log);
  } catch (e) { blocked(rows, 'nearshore', e.message, log); stoppedAt = stoppedAt || 'nearshore'; world = null; }
 }

 // the finale runs its own dodges (the regent's pursuit and the walked route); the shared step would fight them
 TACTICS.setDodge(false);
 // the finale, fresh: the live nearshore save walks to the spring, fights to the offer, refuses it, and rolls the credits
 if (world) {
  const before = readJson(world);
  try {
   const fz = require(path.join(ROOT, 'tests/finale_journey.cjs')).journey({ out: sub('12'), source: world });
   world = fz.final;
   const numbers = fz.fights.map(f => f.label + ' ' + f.seconds + 's, ' + f.hits + ' hits, ' + f.strikesLocked + ' strikes locked, ' + f.dodgeSteps + ' dodges, lost ' + f.hpLost + ' hp, ends ' + f.hpEnd).join('; ');
   ran(rows, 'finale', before, readJson(world), numbers, log);
   creditsRolled = fz.creditsRolled;
   if (creditsRolled) { const r = { beat: 'credits', status: 'ran', secs: null, level: null, hp: null, gear: null, detail: 'the rise, then the credits; postgame ' + (fz.postgame ? 'open' : 'closed') }; rows.push(r); if (log) log(r); }
   else { blocked(rows, 'credits', 'the finale ended without the credits flag (status ' + fz.status + ')', log); stoppedAt = stoppedAt || 'credits'; }
  } catch (e) { blocked(rows, 'finale', e.message, log); stoppedAt = stoppedAt || 'finale'; world = null; }
 }

 for (const beat of BEATS) if (!rows.some(r => r.beat === beat)) notReached(rows, beat, log);

 const ranRows = rows.filter(r => r.status === 'ran');
 const totals = { beatsRan: ranRows.length, beatsTotal: BEATS.length, simulatedSeconds: +ranRows.reduce((n, r) => n + (r.secs || 0), 0).toFixed(1), creditsRolled };
 if (log) console.log('--- ' + totals.beatsRan + ' of ' + totals.beatsTotal + ' beats ran; ' + totals.simulatedSeconds + 's simulated; credits ' + (creditsRolled ? 'rolled' : 'not reached (stopped at ' + (stoppedAt || 'the end') + ')'));
 const fights = TACTICS.table();
 if (log && fights.length) { console.log('--- boss fights: time, player hits, hp lost, tonics used'); for (const f of fights) console.log('  ' + f.boss.padEnd(18) + ' ' + f.outcome.padEnd(7) + ' ' + (f.secs + 's').padStart(8) + '  hits ' + f.hits + '  hp lost ' + f.hpLost + '  tonics ' + f.tonics); }
 if (log) console.log('--- shared fight step: ' + TACTICS.dodges() + ' step-outs from warned spots');
 return { rows, creditsRolled, stoppedAt, totals, out, fights, dodges: TACTICS.dodges() };
}

module.exports = { run, BEATS };
if (require.main === module) {
 const i = process.argv.indexOf('--out');
 const result = run({ out: i > 0 ? process.argv[i + 1] : null });
 process.exitCode = result.creditsRolled ? 0 : 1;
}
