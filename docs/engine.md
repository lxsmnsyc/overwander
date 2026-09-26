# The battle engine

Developer notes on how the real-time battle actually runs. What a _player_ needs
to know is in [Battles](mechanics/battles.md). These pages are the machinery
underneath it.

The whole thing is one event engine
([`src/battle/core.ts`](../src/battle/core.ts)), with every mechanic, move,
status, ability, item and the AI registered against it as listeners. Nothing
that resolves a hit names an ability. Each effect is written once and listens
for the questions it has an opinion about.

## Contents

| Page                                         | What it covers                                                          |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| [Time and phases](engine/time-and-phases.md) | The clock, the seed, cast, trigger, channel, cooldown, and switching    |
| [The AI](engine/ai.md)                       | How an idle unit picks a move, and how candidates are refused or scored |
| [Animation](engine/animation.md)             | The clip a move asks for, and how one pass fills a cast or a step       |
| [Drawing a fight](engine/canvas.md)          | The two field layouts, the damage marks, and the demo pages             |
| [How a fight ends](engine/ending.md)         | The outcome check that runs after every tick                            |

## See also

- [Player's guide](mechanics.md): the rules of the game as a player meets them
- [The database](database.md): what the game stores, and who may write it
