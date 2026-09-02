---
'overwander': patch
---

The end to end tests read the board off the canvas that carries its name. The
chunk is painted on one canvas and pressed on another, the painting one comes
first, and it is `aria-hidden`: every question the tests asked the board came
back empty, which read as a world that had not loaded.
