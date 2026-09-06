---
'overwander': patch
---

The overworld no longer slows down as more of the world is walked: each frame advances only the pokemon standing in the chunk on screen, and the sheets are held in a bounded cache that lets go of what has not been drawn lately.
