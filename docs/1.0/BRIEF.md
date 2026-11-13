# Firstlight 1.0 ... the brief

dom, 2026-11-13: "build the fucking game out ... im tired of it dying to neglect and time. i want the whole fucking thing done."
lead: claude (opus 5.5), synthesizer of all final code. builders: ten haiku 5.5 lanes. aide: one opus 5.5. heavy runs: the aws box.

1. **deliverable.** Firstlight 1.0 on `main` of EternitiesAi/eternities-firstlight: one offline HTML page (index.html and
   FIRSTLIGHT_VALLEY.html, identical), a 2.5 to 4 hour action rpg with a title screen, a real story from the valley to a
   finale and credits, and a postgame. dom gets a private link he can play, plus the local launcher.
2. **license.** read every file, rewrite any player-facing text, add modules, retune numbers, add original art in code,
   generate an original score on the box (ACE-Step, apache-2.0), use cc0 sound effects. run as long as it takes.
3. **originality.** the feather's sight (true roads in gold, counterfeit roads in ash red), the echo ledger (the regent
   quotes your own choices back as chains in the finale; the people you freed break them), the false briar you refuse by
   a habit you actually had, and the finale's last hit lifting the camera from third person to the diorama of everything
   you restored.
4. **the bar.** someone who has played fable and dragon's dogma plays the first hour and says "how did a tiny team make
   this", and a first-time player reaches the credits without reading a manual.
5. **bans.** compliance prose in the story ("this records a victory, not a claim"), fees or claims on the main path,
   developer words on screen (prototype, provisional, realm 10, luna2, epoch), a final boss weaker than the bosses before
   it, code-made beeps where real sound exists, stubs, todos, tests deleted to go green, one green run passed off as proof,
   a month of evidence ceremony per outing.
6. **flavor.** storybook-warm fantasy with a cosmic edge. earth green and gold, heaven bone-white/gold/ruby, hell
   coal/iron/ember. characters speak like people. ui sentence case. the envoy's first lines are the tone to match.
7. **whole.** title, new game, continue, settings (volume, text size, keys, motion), pause, onboarding that teaches by
   doing, a main quest that is always findable, side content that is optional and says so, a finale with three phases,
   an epilogue that changes the valley, credits, a postgame, old saves that still load, phones that work.
8. **proof.** the full verifier green on the box at the release head (counts read from the log, skips named); a
   command-driven bot plays a fresh character from the title to the credits; real-gpu frames of every act in both
   cameras, looked at; 30 fps or better measured on the box gpu at balanced; the definition of done in SAGA.md checked
   line by line. what only a human can judge (fun, feel) is said plainly as not proven.

## decisions taken on dom's behalf (each reversible)

- briar is **taken**, not killed, on the night the warning failed. she comes back in the nearshore. (the canticle draft
  kills her; one switch in saga data restores that if dom wants it.)
- the five realms run in one chain: hell, heaven, the drowned witness (atlantis and cosmos), the nearshore, home.
- earth side work (gate captain, tournament, masterwork, fishing, wild signs, local life) stays in the game as optional
  side work, labelled optional, never required by the main path.
- old saves load; the saga infers where they are from what they already did.
