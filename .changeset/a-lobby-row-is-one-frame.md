---
'overwander': patch
---

A raid lobby shows each party at a size worth looking at.

Every row in the lobby drew two frames around the same thing: the row's own
bordered container, and inside it the strip of squares, which draws a frame of
its own. The name plate shared that container, so the strip was pushed onto a
second line and capped at 240 pixels, which is six squares of about 33 pixels
each. At that size one pokemon looks much like another, which defeats the point
of showing a party before the fight.

The row carries no frame now. The name plate wears one instead, and the strip
takes the width the row has left: on a wide screen that is roughly 500 pixels,
so the squares are about two and a half times what they were, and the row is
shorter than the two-line version it replaces. On a narrow screen the plate
sits above the strip and the strip takes the whole width, which is still
larger than the old cap.
