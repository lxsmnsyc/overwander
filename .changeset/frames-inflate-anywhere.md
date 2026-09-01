---
'overwander': patch
---

Pokemon sheets draw on browsers with no `DecompressionStream`, Safari before 16.4
and Firefox before 113, which until now saw every pokemon as Missingno. They
inflate the frames with `fflate` instead, fetched only where the platform has no
inflate of its own.
