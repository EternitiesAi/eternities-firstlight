# Cosmos native01 controller failure, 2026-10-05

At tooling/capture head2c79fb5dc6b4a4f38b3285e7692dcbd2ecbd0646, the first isolated native run ended with actual process exit1. All679 reached assertions passed, but an unhandled30-second click timeout made the whole run fail. The real Reclaimer reached zeroHP and its production defeat owner saved reclaimer-settled. No complete native cohort is claimed.

The finally block tried to click the autoattack button while the production cooldown still disabled it. Test time was frozen outside explicit steps, so a wall-clock click wait could never clear that cooldown. The corrected controller uses the actual Escape clear-target key and verifies both autoattack=false and target=null before continuing. G is the existing heal key and is not used as a substitute. No production combat, timing, UI, progress or generated page changed.

Original native01 REPORT, screenshot, isolated profile and console remain under D:/07-GAMES/Firstlight/artifacts/cosmos-open-confluence-20261005/native01. Browser/console errors were empty and source drift was false. The corrected native02 requires a new evidence directory/profile family and actual execution; its outcome is pending here. This is a controller repair, not a passing full-game or native gate.
