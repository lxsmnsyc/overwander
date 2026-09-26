# Overwander: player's guide

**Overwander** is a Pokémon-style game played on a world that is generated as it
is walked. Players explore an endless map of chunks, meet wild pokemon, throw
balls at them, dig items out of the ground, hatch eggs, fight raids, trainers
and Team Rocket grunts, hold gym seats against other players, and trade rare
finds at an auction house.

The pokemon are the first 493, Kanto, Johto, Hoenn and Sinnoh, with the moves,
abilities and items of the modern games. Battles run in real time rather than in turns, and pokemon grow on candy
rather than on experience.

This guide describes the rules of the game as a player meets them. It is written
for players; the developer documentation lives in
[The database](database.md) and [The battle engine](engine.md).

## Contents

| Page | What it covers |
| ---- | -------------- |
| [The world](mechanics/world.md) | The map, biomes, chunks, towns, scenery and landmarks |
| [Weather](mechanics/weather.md) | How a sky is decided, the rare ones, and what each is worth |
| [The clock](mechanics/world-time.md) | Refresh windows, the time of day, and the species day |
| [Caves](mechanics/world-caves.md) | Where caves are, what lives in them, and the dark |
| [Getting around](mechanics/world-travel.md) | Walking, and the portals a Portal Key opens |
| [Meeting pokemon](mechanics/encounters.md) | Which pokemon appear, how rare they are, what they come with |
| [Catching](mechanics/catching.md) | Balls, berries, catch odds, and when a pokemon flees |
| [Battles](mechanics/battles.md) | Real-time combat, damage, statuses and how a fight ends |
| [Raids](mechanics/raids.md) | Lairs, lobbies, the raid boss, and the rules a raid changes |
| [Who you fight](mechanics/battle-opponents.md) | Trainers, the syndicates, gym seats, duels, and how a built party is made |
| [What a fight pays](mechanics/battle-rewards.md) | What a fight costs, and the purse each one pays |
| [Raising a pokemon](mechanics/raising.md) | Candy, levels, healing, held items and abilities |
| [Training](mechanics/training.md) | Evolution, training points, friendship and teaching a move |
| [Eggs](mechanics/eggs.md) | Nests, breeding, inheritance, hatching |
| [People you meet](mechanics/npcs.md) | The vendor, Nurse Joy and the specialists |
| [Trainers on the road](mechanics/npc-trainers.md) | The syndicates, the duelling trainers and their classes |
| [The league](mechanics/npc-league.md) | Gym leaders, the Elite Four, champions and the Battle Frontier |
| [Items](mechanics/items.md) | The item pool, battle gear, berries and what each item does |
| [Where items come from](mechanics/item-sources.md) | Caches, berry patches, apricorn trees, phenomena and Pickup |
| [Gold and auctions](mechanics/economy.md) | Where gold comes from, where it goes, and the auction house |
| [Gifts](mechanics/gifts.md) | Starters, and what else the game sets aside for a player |
| [Friends](mechanics/friends.md) | Friend codes, trading, and blocking |
| [Battle lobbies](mechanics/duels.md) | Fighting another player on purpose, and who watches |
| [Quests](mechanics/quests.md) | What the game asks of you, and what each ask pays |
| [Awards and titles](mechanics/awards.md) | Badges, achievements, and what a trainer is called |
| [Settings](mechanics/settings.md) | What a player sets for themselves on this machine |

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

- [Releases](update.md): what each major release brought
- [The battle engine](engine.md), for how the real-time engine is built
- [The database](database.md): what the game stores and who may write it
- [Credits](credits.md), for the people, libraries and art behind the game
