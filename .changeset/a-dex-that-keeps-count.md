---
'overwander': patch
---

Dex bookkeeping, and the line between a legendary and a mythical.

- A pokemon that arrives without ever being met is written to both tallies, so
  the caught column can no longer climb past the seen one. Evolving and
  hatching were the two ways it could.
- Every battle now writes down what the other side fielded, staged rather than
  settled: a raid boss, a Team Rocket party, a gym seat's holder or a duelling
  player's team is met by standing in front of it. It is one statement inside
  one transaction, however many were on the field.
- **Legendaries and mythicals are separate tiers**, with a band each. A
  legendary sits in the special band at 1/4096; a mythical sits in a band of
  its own, eight times thinner at 1/32768, in the one place it lives.
- Giovanni's sixth is drawn from the lairs the world stages, so his party can
  no longer end in a mythical.
- Changes world generation.
