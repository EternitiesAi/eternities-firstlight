# the ten lanes

wave a starts at once (no story dependency). wave b starts when `src/saga.js` lands on `build/whole-20261113`.
each lane: owner files, the job, acceptance. shared files only as small hooks (see BUILDERS.md).

## wave a

### look ... `src/engine.js` (shaders, post, water, sky), `src/world.js` (trees)
the world reads as flat mannequins in fog. make it look good without a rewrite: hemisphere bounce from below and rim
light in the fragment shader, a contact-darkening term near the ground, shadow bias down to ~0.03-0.05 m with a wider
pcf, fxaa in the post pass (keep `mainF` the resolved target the cutaway test reads), a warmer split-tone grade with less
grey, water with stronger normals, broader glitter and a higher fresnel floor, a sun glow in the sky, lobed tree crowns.
keep every substring and hash the tests pin (tests/world_atlantis_earth.test.cjs:265-268,
tests/earth_expedition_art.test.cjs:160, tests/grazer_mesh.test.cjs:32-35, tests/world_art.test.cjs:15): if a pin blocks
a real improvement, add a new kind instead of changing a pinned one. acceptance: before/after frames of 4 scenes rendered
on the box gpu (`tools/record_browser_gameplay.py` or `tools/measure_gpu_browser.py --renderer hardware`), and fps not
worse than before.

### people ... `src/traveler-art.js`, new `src/story-art.js`
characters are boxes with eye dots. give the traveler and residents faces (eye whites and pupils, brows, a mouth), capsule
limbs as a new geometry kind (add a case to `geometry()` in engine.js, nothing else there), better proportions. then
build `G.RealmStoryArt` for the story cast, each a function returning instances in the existing instance format: the
regent of ash (tall, ash-grey long coat, ember-lit seams, a crown of cooling cinders, a smile), the envoy (luminous,
folded wings of light, bone-white and gold), briar (the existing fox) plus `briarFalse` (identical but too clean, faint
cold glow, no scuffs), a severing device (iron and ember), chain links for the finale. keep tests/traveler_rig.test.cjs's
pinned count by adding parts through a new path if needed. acceptance: box-gpu frames of each figure in both cameras.

### sound ... `src/soundscape.js`, `src/grounded-footfalls.js`, new `src/audio.js`, `assets/audio/`, the audio part of
`build.py`
all sound is code-made sine tones, off at boot, no volume control. build `G.RealmAudio`: buses (music, effects,
ambience, ui) with volumes, `cue(name)`, `music(trackId)` with crossfades, `ambience(area)`. on the box: generate an
original score with ACE-Step (apache-2.0; pin the model revision and hash it; smoke one 20 s clip first) for valley,
road, battle, hell, heaven, sea, cosmos, finale, credits (1.5-2.5 min each, loopable, instrumental); fetch cc0 effects
(kenney.nl audio packs: impact, rpg, ui, footsteps) and record their source and license in `assets/audio/SOURCES.md`.
encode to small opus/ogg (music ~48 kbps mono or stereo 64, effects short) and embed through build.py. keep code-made
sounds only where no real one fits. keep the music desk's own synthesis (it is an instrument). the whole page must stay
under 12 MB. acceptance: every cue mapped, levels balanced (no clipping, measured peak), a listening list for dom.

### shell ... `src/shell.html` (layout), new `src/title.js` + `src/title.css`, new `src/pause.js`, new `src/credits.js`,
the settings and copy parts of `src/app.js` and `src/rpg-ui.js`, `src/rpg.css`, `src/style.css`
there is no title, no pause menu, controls are hidden, phones are awkward, and the screen leaks internal names. build: a
title screen (continue, new game, characters, settings, credits) over a slow drift of the valley; esc opens a pause menu
(resume, settings, save and quit to title); settings gains volume per bus (through `G.RealmAudio` if present, a no-op
otherwise), text size, a key table, motion that follows the os setting for new worlds; a first-run card that teaches
movement, camera, attack and interact by doing and then gets out of the way; phone nav buttons with names and 44 px
targets, `touch-action: none` on the world canvas; remove "prototype", "realm 10", "luna", "luna2", "no language model is
connected" and similar from every player-visible string you own; `G.RealmCredits.show(sections)` as a real rolling
credits screen. the page title becomes "Firstlight". acceptance: each screen walked in the browser on the box at desktop
and 390 px widths, frames looked at.

### fight ... `src/combat.js`, `src/adventure-art.js`, the ENEMIES tables and combat functions in `src/adventure.js`,
`src/road.js`, `src/beacon.js`, `src/crossing.js`, `src/starter.js` (numbers and combat code only; story text in those
files belongs to the act lanes), new `src/difficulty.js`
hits have no weight, bosses do not threaten, level caps at 5 before chapter III. build: hit-stop (40-70 ms), a small
camera shake on heavy hits, floating damage numbers, poise (hits interrupt non-boss windups), explicit windup per enemy
(fix `windup??1`), two new boss patterns each for the hart, the ram, the herald and the keeper (a line slam, a double ring,
a charge you can bait into a wall), a diminishing armour curve, the level cap raised to 12 by appending thresholds after
260 (never move the existing four), each level adding attack and hp. `src/difficulty.js` exports `G.RealmDifficulty`
with the main-path boss table the act lanes read: hart 240, ram 320, herald 350, keeper 410, foundry warden 520, relay
seraph 620, drowned witness guardian 720, regent 3 phases 380 + 400 + 420, damage rising the same way. a multi-phase boss
helper the finale lane can call. acceptance: rules tests for every formula; a command journey shows a level-1 player
standing still loses to the hart, and a played route reaches the keeper at level ~5-6 and the regent at ~11-12.

## wave b (after saga.js lands)

### act i-ii ... `src/adventure.js` (story text and beats only), `src/road.js`/`src/beacon.js`/`src/crossing.js` text,
their -ui.js, new `src/feather-sight.js` + art
rewrite every player-facing line from the kit to bellweather in the game's voice. at the spring the envoy speaks the
prophecy ("the first light will not descend from heaven. it will rise from below.") and gives you the feather's sight:
hold f to see true roads gold and counterfeit roads ash red (instances added along the roads, a gentle desaturation of
everything else). at the beacon: regent sighting 1. mark the beats through `G.RealmSaga`. acceptance: chapter journeys
still pass; a feather-sight frame from the box.

### the night ... new `src/night.js`, `src/night-ui.js`, `src/night-art.js`, the companion presence of briar
(`src/briar-*.js`, `src/companion*.js`)
after bellweather, night falls on the crossing: travellers to lead out under a sky gone wrong, the severing device found
by briar, briar breaking it and being pulled into the counterfeit road. then a long quiet: no new marker for a while, the
envoy comes, does not bargain, promises to help find her. briar is absent from the world while taken (no follow, the bowl
empty). the habit recorder (`RealmSaga.recordHabit`) counts where you stop with briar from the kit onward. acceptance: a
command journey through the night; old saves with a bonded briar flow into it.

### hell and heaven ... `src/hell-campaign*.js`, `src/heaven-campaign*.js`, `src/realm-trails-north.js`, `src/world-heaven-hell.js`
rewrite both realms as one chain. hell: the trail of the stolen pattern to the regent's foundry; open its outer works; take
the pattern back; regent sighting 2; boss the foundry warden. heaven: arrive in peace (bells, gardens, no hostiles in the
first area), the envoy's home, the prophecy reread ("rise from below" means from the ones who were taken, not from the
deep); then the counterfeit relay turns the rescue corridors hostile; boss the relay seraph. strip every disclaimer and fee
from the main path. stats from `G.RealmDifficulty`. acceptance: both campaign journeys pass on the new story.

### the witness and the nearshore ... `src/atlantis-campaign*.js`, `src/cosmos-campaign*.js`, `src/realm-trails-south.js`,
`src/realm-trails-cosmos.js`, `src/world-atlantis-earth.js` (realm parts), new `src/nearshore.js` + ui + art
atlantis proves the pattern was stolen (the drowned witness), the cosmos shows the cure: independent anchors, no master
key; regent sighting 3 at the confluence; boss the drowned witness guardian. then the nearshore: the regent offers a
faultless briar who obeys perfectly; the real briar goes to the place you actually stopped most (`RealmSaga.habitPlace`);
choosing her brings briar home. choosing the false one is a soft failure you can recover from. acceptance: journeys
through both realms and both nearshore choices.

### the finale ... `src/earth-homecoming*.js` (rewritten into the finale), new `src/finale.js` + ui + art, new
`src/epilogue.js`, the side-work labels in `src/earth-gate*.js`, `src/earth-tournament*.js`, `src/earth-masterwork*.js`
the regent of ash at the spring junction in the home valley. phase 1: chains anchored to places you saved, one per
coercive choice in the echo ledger (`RealmSaga.echoLedger`); allies you freed break chains for you. phase 2: the merged
valley (heaven bridges, hell chains, sea through the fields) as he flees across it. phase 3: he offers invulnerability;
refuse it, and end him. briar tracks his hidden route. as the last hit lands the camera rises from third person into the
diorama. epilogue: ilan plays, the windbells ring, a new arch, briar curled by the workshop, 5+ visible changes; then
`G.RealmCredits`. postgame free roads. label optional side work as optional. acceptance: the full bot journey title to
credits; finale frames of all three phases from the box.
