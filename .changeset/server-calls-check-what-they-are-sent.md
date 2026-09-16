---
'overwander': patch
---

Every server call now checks its arguments before it acts. A request with a
coordinate outside the world, a list longer than the game allows, or a field of
the wrong kind is refused instead of being read.
