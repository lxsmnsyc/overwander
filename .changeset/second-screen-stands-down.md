---
'overwander': minor
---

One walk, however many screens are signed in.

A player signed in twice had two boards writing one position row, each
overwriting the other every second and a half, with neither screen aware of it.
Now the row is streamed, and a screen that sees it standing in a chunk it is
not in stands down: it stops walking, hands over the paces it had not reported
yet, and says where the walk went. One press takes it back, which stands the
other screen down in turn.

Only the chunk is compared. Two screens in the same chunk write cells over each
other and neither view moves, which is untidy and harmless, and a rule that
noticed it would fire on every ordinary step. A screen also recognises its own
writes coming back around the subscription, since one that could not would
stand itself down mid-walk.
