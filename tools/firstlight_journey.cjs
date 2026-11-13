#!/usr/bin/env node
'use strict';
/* The firstlight journey bot. One fresh character runs the producers' real-command journeys in story order, each stage
 * starting from the previous stage's saved world (the same chain the whole-draft tool uses). Times, levels, hp and gear
 * are read from the saved worlds. A beat with no producer wired here is printed as not wired, with the reason; the bot
 * never plants a defeat, edits a position or a stat. Usage:
 *   node tools/firstlight_journey.cjs [--out <dir>]
 * Importable: require('./firstlight_journey.cjs').run({ out }) returns { rows, creditsRolled, stoppedAt }. */
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
process.env.FIRSTLIGHT_ROOT = process.env.FIRSTLIGHT_ROOT || ROOT;
const AD = require(path.join(ROOT, 'src/adventure.js'));

// the story in order. a beat with no producer says why it is not wired.
const NOT_WIRED = {
 hell: 'the realm trail and the hell campaign need their own inputs; not chained here yet',
 heaven: 'the realm trail and the heaven campaign need their own inputs; not chained here yet',
 atlantis: 'the atlantis producer reads a historical fixture, not a fresh save',
 cosmos: 'the cosmos producer reads a historical fixture, not a fresh save',
 nearshore: 'no producer for the nearshore choice in this build',
 finale: 'the finale is checked separately from an earned late world (tests/finale.test.cjs); not reached fresh',
 credits: 'not reached: the chain stops before the finale'
};

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
// the state a beat leaves: simulated time, level, hp, and the gear the saved world wears.
function state(world) {
 const a = world.adventure, s = AD.stats(a);
 return { t: a.elapsed, level: AD.level(a), hp: a.hp, maxHP: s.maxHP, gear: Object.values(a.equipment || {}).filter(Boolean).join(' + ') || 'none' };
}
function row(rows, beat, from, to, log, detail) {
 const a = to ? state(to) : null, b = from ? state(from) : { t: 0 };
 const r = { beat, status: 'ran', secs: a ? +(a.t - b.t).toFixed(1) : 0, level: a ? a.level : null, hp: a ? a.hp + '/' + a.maxHP : null, gear: a ? a.gear : null, detail: detail || '' };
 rows.push(r); if (log) log(r);
 return r;
}
function blocked(rows, beat, why, log) { const r = { beat, status: 'blocked', why: String(why).slice(0, 220) }; rows.push(r); if (log) log(r); return r; }
function notWired(rows, beat, log) { const r = { beat, status: 'not wired', why: NOT_WIRED[beat] }; rows.push(r); if (log) log(r); return r; }

function run(options = {}) {
 const out = options.out || fs.mkdtempSync(path.join(os.tmpdir(), 'firstlight-journey-'));
 fs.mkdirSync(out, { recursive: true });
 const log = options.quiet ? null : r => console.log(fmt(r));
 const rows = []; let creditsRolled = false, stoppedAt = null;
 const fresh = { adventure: { elapsed: 0, xp: 0, hp: 100, equipment: {} } };
 let world = null;

 // chapter one: kit, the hollow hart and the envoy, from the first fresh save
 const c1 = path.join(out, '01-chapter-one');
 try {
  require(path.join(ROOT, 'tests/chapter_journey.cjs')).journey({ out: c1, reward: 'warden_stone' });
  const start = readJson(path.join(c1, 'OPTIONAL_CHAPTER_START.json')), before = readJson(path.join(c1, 'ENVOY_BEFORE_CHOICE.json'));
  world = readJson(path.join(c1, 'CHAPTER_COMPLETED.json'));
  row(rows, 'kit', fresh, start, log, 'workshop supplies, the pickaxe and the repaired crossing');
  row(rows, 'hart', start, before, log, 'the underways, Briar rescued, the hart freed, the relic');
  row(rows, 'envoy', before, world, log, 'prophecy and the feather sight; the warden stone chosen');
 } catch (e) { blocked(rows, 'kit', e.message, log); stoppedAt = 'kit'; }

 // act II: the road, with Tessa's caravan and the sunscar ram
 if (world) {
  const c2 = path.join(out, '02-road');
  try {
   const prev = world;
   require(path.join(ROOT, 'tests/road_journey.cjs')).journey({ out: c2, start: prev });
   world = readJson(path.join(c2, 'CHAPTER_II_COMPLETE_EARNED.json'));
   row(rows, 'road', prev, world, log, 'the sunward road, Tessa, the ram');
  } catch (e) { blocked(rows, 'road', e.message, log); stoppedAt = 'road'; world = null; }
 }

 // act III: the beacon, the stranger, the herald's defence
 if (world) {
  const c3 = path.join(out, '03-beacon');
  try {
   const prev = world;
   require(path.join(ROOT, 'tests/beacon_journey.cjs')).journey({ out: c3, source: path.join(out, '02-road', 'CHAPTER_II_COMPLETE_EARNED.json') });
   world = readJson(path.join(c3, 'CHAPTER_III_COMPLETE_EARNED.json'));
   row(rows, 'beacon', prev, world, log, 'the sighting, then the defence of the beacon');
  } catch (e) { blocked(rows, 'beacon', e.message, log); stoppedAt = 'beacon'; world = null; }
 }

 // the bellweather crossing: Rowan's bell and the hushbound keeper
 if (world) {
  const c4 = path.join(out, '04-bellweather');
  try {
   const prev = world;
   require(path.join(ROOT, 'tests/crossing_journey.cjs')).journey({ out: c4, source: path.join(out, '03-beacon', 'CHAPTER_III_COMPLETE_EARNED.json') });
   world = readJson(path.join(c4, 'HOME_AFTER_BELL_EARNED.json'));
   row(rows, 'bellweather', prev, world, log, 'the crossing, the keeper, Rowan\'s bell');
  } catch (e) { blocked(rows, 'bellweather', e.message, log); stoppedAt = 'bellweather'; world = null; }
 }

 // the rest of the story has no wired producer here; each beat says why.
 // the night the warning failed: its producer replays the crossing from a fresh start, then runs the night's commands.
 if (!stoppedAt) {
  try {
   const dir = path.join(out, '05-night');
   fs.mkdirSync(dir, { recursive: true });
   const n = require(path.join(ROOT, 'tests/night_journey.cjs')).journey({ out: dir });
   const r = { beat: 'night', status: 'ran', secs: null, level: null, hp: null, gear: null, detail: 'own fresh run: the producer replays the crossing, then the night commands (' + n.commands + ' commands, ' + n.status + ')' };
   rows.push(r); if (log) log(r);
   stoppedAt = 'hell';
  } catch (e) { blocked(rows, 'night', e.message, log); stoppedAt = 'night'; }
 }
 for (const beat of ['hell', 'heaven', 'atlantis', 'cosmos', 'nearshore', 'finale', 'credits']) notWired(rows, beat, log);

 const ran = rows.filter(r => r.status === 'ran');
 const totals = { beatsRan: ran.length, beatsTotal: rows.length, simulatedSeconds: ran.length ? +ran.reduce((n, r) => n + r.secs, 0).toFixed(1) : 0, creditsRolled };
 if (log) console.log('--- ' + totals.beatsRan + ' of ' + totals.beatsTotal + ' beats ran; ' + totals.simulatedSeconds + 's simulated; credits ' + (creditsRolled ? 'rolled' : 'not reached (stopped before ' + stoppedAt + ')'));
 return { rows, creditsRolled, stoppedAt, totals, out };
}

function fmt(r) {
 if (r.status !== 'ran') return (r.status === 'blocked' ? 'BLOCKED ' : 'not wired ') + r.beat.padEnd(11) + ' ' + r.why;
 const time = r.secs === null ? 'n/a' : r.secs + 's';
 return 'ran     ' + r.beat.padEnd(11) + ' ' + time.padStart(8) + '  lv ' + (r.level ?? '-') + '  hp ' + (r.hp ?? '-') + '  ' + (r.gear ?? '-') + '  ' + r.detail;
}

module.exports = { run };
if (require.main === module) {
 const i = process.argv.indexOf('--out');
 const result = run({ out: i > 0 ? process.argv[i + 1] : null });
 process.exitCode = result.creditsRolled ? 0 : 1;
}
