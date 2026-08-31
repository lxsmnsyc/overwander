---
'overwander': minor
---

A command bar for staff who run the game, opened with Ctrl+K from the overworld.

- `/tp` moves a player, to chunk coordinates or to where somebody else is
  standing. An axis left out is drawn at random.
- `/locate` finds the nearest chunk answering to a species, a biome or a sky.
- `/gift-item`, `/gift-catch` and `/gift-encounter` put something on one
  player's shelf or on everybody's.
- `/ban` and `/unban` shut a player out of the game and let them back in.
- `/view` opens somebody's profile.

A player is named however staff have them: a nickname, an email address or a
friend code. The bar wears the slash beside the box rather than asking for it,
so a line is typed as `tp x:100`. It finishes what is being typed the way the
search boxes do, offering the commands, then the parameters each one takes,
then their values. Tab takes an offer and Enter runs the line, printing what it
did above the box and leaving the bar open for the next one.
