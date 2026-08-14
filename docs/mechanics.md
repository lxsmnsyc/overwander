# Poketerra: player's guide

**Poketerra** is a Pokémon-style game played on a world that is generated as it
is walked. Players explore an endless map of chunks, meet wild pokemon, throw
balls at them, dig items out of the ground, hatch eggs, fight raids and Team
Rocket grunts, and trade rare finds at an auction house.

The pokemon are the first 151, with the moves, abilities and items of the modern
games. Battles run in real time rather than in turns, and pokemon grow on candy
rather than on experience.

This guide describes the rules of the game as a player meets them. It is written
for players; the developer documentation lives in
[Firestore](firestore.md) and [The battle engine](engine.md).

## Contents

| Page                                       | What it covers                                               |
| ------------------------------------------ | ------------------------------------------------------------ |
| [The world](mechanics/world.md)            | The map, biomes, chunks, landmarks, refresh windows, portals |
| [Meeting pokemon](mechanics/encounters.md) | Which pokemon appear, how rare they are, what they come with |
| [Catching](mechanics/catching.md)          | Balls, berries, catch odds, and when a pokemon flees         |
| [Battles](mechanics/battles.md)            | Real-time combat, damage, statuses, raids, Team Rocket       |
| [Raising a pokemon](mechanics/raising.md)  | Candy, evolution, training, friendship, moves, healing       |
| [Eggs](mechanics/eggs.md)                  | Nests, breeding, inheritance, hatching                       |
| [People you meet](mechanics/npcs.md)       | The vendor and the six travelling specialists                |
| [Items and gold](mechanics/items.md)       | The item pool, berries, the economy, the auction house       |

## Overview

### A world that is calculated, not stored

Nothing about the map is saved anywhere. Biomes, landmarks, buried items and the
pokemon standing about are all worked out from the world's single seed number at
the moment somebody looks. Two players standing in the same place at the same
time therefore see exactly the same things. The only things kept are the results
of what players did: catches, claims and bids.

### Shared time, local calendars

Every timed event is measured against one central clock, so no device can gain an
advantage by changing its own. What counts as morning, evening or night, however,
is read in each player's own timezone, and it decides which pokemon they meet. A
player on the far side of the world walking the same field at the same instant is
walking it at a different hour, and finds different pokemon there.

### Deliberate interaction

Nothing is triggered by walking over it. A player steps within reach of a pokemon
or a landmark and clicks it. Crossing a cell sets nothing off, so nothing is ever
lost by passing through.

### Reproducible battles

A battle is a calculation rather than a broadcast. Every participant and
spectator runs the same fight from the same starting point and arrives at the
same result, which is why a replay costs nothing and pays nothing.

## See also

- [The battle engine](engine.md) — how the real-time engine is built
- [Firestore](firestore.md) — what the game stores and who may write it
- [Credits](credits.md) — the people, libraries and art behind the game
