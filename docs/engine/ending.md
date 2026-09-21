# How a fight ends

The check the engine runs after every tick to decide whether a battle is over.

Rather than watching for knockouts, the engine asks after every tick whether the
fight can still go anywhere. Two questions:

- Is anything mid-cast or mid-channel?
- Could any unit still act against a living enemy?

Once neither holds, the battle is over.

Reading it that way settles fights a knockout watcher would miss. A side that is
alive but permanently unable to act ends the battle exactly as a wiped one does.

Both questions are asked **only while more than one side is standing**, since
that is the only time the answer can still change anything. One side left, or
none, is a decided fight whatever anybody is still winding up.

Waiting instead for every unit to be idle would be waiting for something that
may never come. A survivor can buff itself on an empty field forever, and a
lobby of forty-eight of them is never all idle on the same tick, so a won raid
would never be reported as over.

## See also

- [The battle engine](../engine.md): the index for these pages
- [The AI](ai.md): why the outcome check never asks the AI what it would do
- [Time and phases](time-and-phases.md): the tick the check runs after, and the
  casts and channels it looks for
- [Battles](../mechanics/battles.md): the same rules as a player meets them
