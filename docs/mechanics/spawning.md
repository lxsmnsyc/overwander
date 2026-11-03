# Spawning

Wild pokemon do not all appear and vanish together. Each chunk has a handful of
places where a pokemon can stand, and each place keeps its own time: a pokemon
arrives, stays a few minutes, leaves, and after a short rest another arrives.
Walk through a chunk and some are always coming and some are always leaving.

Everything here is worked out from the world seed, the chunk and the clock, so
two players in the same chunk at the same moment see the same pokemon in the
same places. Nothing about where a pokemon is gets sent between players.

## Slots

A chunk has **eight** slots for the pokemon an ordinary walker sees. Three more
are visible only to a player whose buddy attracts pokemon (a lure, see
[Meeting pokemon](encounters.md)), and one more is kept for rare pokemon.

Each slot repeats the same cycle:

| Stage   | How long                                  |
| ------- | ----------------------------------------- |
| Present | 3.5 to 4.5 minutes, different every cycle |
| Rest    | 1 to 2 minutes, the rest of 5.5 minutes   |

A slot starts at its own moment in the 5.5 minutes, so the eight are never in step.
On average five or six of a chunk's eight are standing at any time.

When a slot's rest ends, it rolls again: a new species, a new individual with
its own level, nature and values, and a new cell. The roll comes from the chunk,
the zone and the slot's cycle number, so it is the same for everyone.

A cycle never runs past the end of the local hour. Anything the hour changes,
such as the weather and where things are happening, is settled before a pokemon
arrives and holds until it leaves.

## Where a pokemon starts

A pokemon starts on a free cell of its slot's own share of the chunk, so two
never start on the same cell. Cells that hold a landmark, a decoration, rock, lava
or something happening this hour stay empty. A water cell rolls from the water
pool and a land cell from the land pool, as in [Meeting pokemon](encounters.md).

In a town, some slots belong to the streets and roll the town's own pokemon.

## Lures and rare pokemon

A lure does not make anything appear. The three extra slots are always there,
standing and resting like the rest, and a lure lets you see and meet them. Pure
Incense, a Cleanse Tag and Stench take slots out of what you see in the same way.
A pokemon you have already seen stays on your board until it leaves.

Mythical, special and prized pokemon do not take an ordinary slot. They have a
slot of their own that every player sees whatever the buddy does. It rolls on the
same odds as before, so a chunk still turns up one about every four hours.

## Meeting, catching and running

A pokemon can be met from the moment it appears until it leaves. The server
checks the time when you press it, with a second of leeway for the connection, so
a pokemon that has left cannot be met and one that has arrived can.

Whether you caught it or it ran, **it is gone for you** and no one else. Other
players still see it and can meet it until its cycle ends. Your slot of it does
not come back sooner for having caught it: the next pokemon in that slot arrives
when the slot's own clock says, and it is a new one.

A pokemon you ran from is not met again. A meeting you walked away from without
catching can be walked back into until the pokemon leaves.

## Moving about

Wild pokemon will walk once roaming is in. An idle pokemon picks a new spot every
five seconds, within four cells of where it started, and walks to it at one cell
every half second, which is half a player's pace. Two things hold it back:

- It stays on what its kind can stand on. Ground pokemon walk on land and ice,
  water pokemon on water, flying pokemon on both, and an amphibious water pokemon
  on land as well.
- It does not walk onto a landmark, a decoration, rock, lava or the cell of
  something happening. Country pokemon never walk into a town, and a pokemon of
  the streets stays on them and keeps within two cells.

It uses the same ramps between levels that a player can walk. Two pokemon may stand on one cell. A pokemon never leaves its chunk. Where it stands at any moment is worked out from
the clock, so everyone sees it on the same cell. When you press it, the server
works out where it is and accepts a press within a cell of that.

## What is yours alone

Which pokemon you have caught, met or seen run is your own. So is whether a
pokemon is shiny for you. The way a pokemon fades in as it arrives, and how it is
drawn walking, are only on your screen. Fading is slower for a pokemon that
arrives right next to you, so none pops up under your feet.

## Numbers

| Rule                                   | Value                 |
| -------------------------------------- | --------------------- |
| Slots a chunk shows an ordinary walker | 8                     |
| Slots only a lure shows                | 3                     |
| Slots for rare pokemon                 | 1                     |
| Present                                | 3.5 to 4.5 min        |
| Rest                                   | 1 to 2 min            |
| Roam distance                          | 4 cells (2 in a town) |
| Roam pace                              | 1 cell in 0.5 s       |
| New spot                               | every 5 s             |
| Leeway on a press                      | 1 second, 1 cell      |
