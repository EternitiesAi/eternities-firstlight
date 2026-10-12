# A completed Choir account without a refused route

Base: fb299666a17601e4dd9d8c261e506c3bfd105059, draft PR66.
Branch: gameplay/choir-completed-account-20261012.
Owner: parent Firstlight checkout. Existing two colleagues review source only.

A valid paid Broken Choir account can omit the optional service spillway.
Its page offered a spillway walk button that the existing route dispatcher
always refuses for a claimed trail. The optional step now says "not recorded
at payment" and that obsolete walk control is absent. Unpaid partial work keeps
its routes. The physical handle, nearby E prompt and deliberate late step remain
available through their original rules; operating it cannot pay the trail again.

Only two lines in src/realm-trails-ui.js change. No navigation, quest definition,
combat, claim, reward, fitting, migration or persistence owner changes. Reading
still mutates no state. A deliberate physical step retains its original save
and revision increment. World9 / Adventure12 / WildSigns1, XP, personal keys,
equipment/sockets/upgrades, companion, housing, music and both cameras persist.

Four detecting cases are appended to the existing26-test component without
changing its original prefix. They cover paid omission with blade, deliberately
equipped bow and labelled synthetic veteran equipment history; nearby optional
step without second payment; preparation recorded before payment; and unpaid
partial blade/bow routes. Completed-required boundaries and positions are
explicitly synthetic. Kit, travel, acceptance, physical step, claim, equip and
fitting go through production commands. This is not an earned full encounter,
browser persistence, rendered UI, GPU measurement or human playtest.

RED01:30tests,28pass/2fail/0skip. One failure detected the dead route; the other
was a new oracle error expecting adventure revision to stay unchanged after a
successful physical command. The oracle now explicitly expects the existing
one revision increment while every other adventure field stays equal. Corrected
RED02:new4cases,3pass/1fail/0skip at the unchanged UI. GREEN complete component:
30pass/0fail/0skip,659.5023ms. Preserve both RED logs rather than hide the mistake.

Actual offline build emits identical3318581B pages, SHA256
2cb6e1aa906be8d5448fc11c1380d6bf341e21d323b206c54e29981d183f32d0.
Each page grows64B. Existing generated outputs are rebuilt in place; no full
game archive, browser profile, recording or asset is added. Raw focused/build
evidence is at D:/07-GAMES/Firstlight/artifacts/choir-completed-account-20261012.

Two source reviews and fresh remote component/build evidence are separate
delivery gates. Complete current source/native qualification remains pending:
the predecessor9ef two-worker full source timed out at the original180s deadline
after build/all142syntax; Python/later journeys did not run. Keep that failure.
Broad work requires at least6GiB host free immediately before launch; this is
conservative admission, not a RAM guarantee. VM/Claude work remains untouched.

Next acceptance: complete current source under supported scheduling/headroom,
earn current cohorts, retain exact native restart operands, and play ordinary
blade/bow Choir/forest plus garden framing in both views. Ask Dom later whether
the paid account and next equipment action are clear. No human response is
invented. Goal ACTIVE unfinished; heartbeat PAUSED; no merge or deployment.
