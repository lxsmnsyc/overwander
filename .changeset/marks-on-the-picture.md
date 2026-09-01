---
'overwander': patch
---

Pokemon sprite descriptions keep their anchor marks on the picture rather than on
every frame that draws it, halving them: the 210 that ship go from 9.0MB to 4.4MB,
and about the same gzipped. `pnpm lift-marks` is what converts an older one.
