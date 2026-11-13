'use strict';
/* After the credits there is no story beat left: the tracker shows the postgame card (title Firstlight, the roads stay
 * open and the side work remains) in place of any chapter fallback. Before the credits there is no card. The wiring is
 * checked where it sits: the card is read after the beat block and before the target panel, and the envoy is kept off the
 * spring by the same finale predicate in both the figure and the label. */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { test } = require('node:test');
const ROOT = path.resolve(process.env.FIRSTLIGHT_ROOT || path.join(__dirname, '..'));
const FIN = require(path.join(ROOT, 'src/finale.js'));
const text = f => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8');

test('the postgame card is the Firstlight card once the credits have rolled, and no card before them', () => {
 assert.equal(FIN.postgameCard({ saga: { postgame: false, credits: false } }), null, 'no card while the story runs');
 assert.equal(FIN.postgameCard(undefined), null);
 const card = FIN.postgameCard({ saga: { postgame: true, credits: true } });
 assert.equal(card.title, 'Firstlight');
 assert.match(card.detail, /roads stay open/, 'the roads stay open');
 assert.match(card.detail, /side work/, 'the side work remains');
 assert.ok(card.progress.length > 0);
});

test('the story tracker reads the postgame card after the beat block and before the target panel', () => {
 const src = text('rpg-ui.js');
 const beat = src.indexOf('main.detail;}'), card = src.indexOf('G.RealmFinale?.postgameCard?.(sim.state)');
 const panel = src.indexOf("$('#target-framing')", card);
 assert.ok(beat > 0 && card > beat, 'the card comes after the beat block');
 assert.ok(panel > card, 'and before the target panel that follows it');
 assert.match(src.slice(card, panel), /tracked-title'\)\.textContent=pg\.title/, 'it writes the title from the card');
});

test('the valley envoy is kept off the spring by the finale predicate, in its figure and in its label', () => {
 const art = text('adventure-art.js'), ui = text('adventure-ui.js');
 assert.match(art, /RealmFinale\?\.fighting\(sim\.state\)/, 'the envoy figure checks the finale');
 assert.match(ui, /angelSeen&&!G\.RealmFinale\?\.fighting\(sim\.state\)/, 'the envoy label checks the finale');
 assert.match(ui, /l\.text==='The Regent of Ash'/, 'the Regent keeps his own label through the filter');
});
