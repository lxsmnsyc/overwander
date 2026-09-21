# The clock

Every part of a chunk runs on a clock: how often it refreshes, which pokemon the
hour brings, and which family the day features.

## Refresh windows

Different parts of a chunk refresh on different timers. The easier something is
to obtain, the sooner it returns.

| What changes                                    | How often  |
| ----------------------------------------------- | ---------- |
| The pokemon standing in a chunk                 | 5 minutes  |
| Item caches, berry patches and apricorn trees   | 15 minutes |
| Where things are happening, and what they are   | 1 hour     |
| The weather over a chunk                        | 1 hour     |
| Legendary and shadow raids                      | 3 hours    |
| Who is at a wandering-NPC cell, grunts included | 3 hours    |
| Which counter a market stall is keeping         | 3 hours    |
| Which trainer is standing at a trainer cell     | 3 hours    |
| The egg lying in a nest                         | 12 hours   |

Every one of these is a whole number of five-minute windows and all of them are
counted from the same instant, so a landmark never changes halfway through what
a player is doing at it. An item cache that has been emptied stays empty while
the pokemon around it turn over three times.

Windows follow each player's **local** clock. What a player eight hours ahead
found in a chunk says nothing about what another player will find there.

## Time of day

Four periods divide the day, and each has its own pokemon:

| Period  | Hours          |
| ------- | -------------- |
| Morning | 04:00 to 10:00 |
| Day     | 10:00 to 17:00 |
| Evening | 17:00 to 20:00 |
| Night   | 20:00 to 04:00 |

These are read in the player's own timezone. There is no time of day
underground: see [The caves](world-caves.md).

## The species day

One pokemon family is featured each day of the year, and it is the same family
for every player in the world. The species day is counted in UTC, so it turns
over at the same instant everywhere rather than sweeping around the world with
local midnight.

There are far fewer families than days in the year, so most days feature no
family at all.

On its day, the featured family receives six bonuses:

| Bonus                | Size | Effect                                         |
| -------------------- | ---- | ---------------------------------------------- |
| Shiny odds           | ×8   | The chance of meeting a shiny one              |
| How often it appears | ×4   | Its share of the pokemon that turn up          |
| Candy from a catch   | ×4   | What catching one pays, whatever it is         |
| Catch chance         | ×2   | How readily a thrown ball sticks               |
| Hidden ability       | ×2   | How often one turns up with its hidden ability |
| Egg steps            | ×1.2 | Every pace walked with one of their eggs       |

Appearing more often does not move a species between rarity bands. A featured
rare pokemon is still rare to encounter. It simply wins its band far more often
than usual. The catch bonus is deliberately small, because balls and berries
already raise catch chance a good deal.

The egg bonus counts the walking done on the day itself rather than discounting
the walk. An egg carried past midnight keeps the paces it banked and goes back
to ordinary paces.

A raid cleared on the featured family's own day hands over a pokemon whose
individual stats are all at least 10. That floor stacks with the one a favouring
sky gives: see [Weather](weather.md).

## See also

- [The world](world.md)
- [Weather](weather.md)
- [Meeting pokemon](encounters.md)
- [Eggs](eggs.md)
- [Catching](catching.md)
