# Battle rows

The rows a fight is written to: the teams frozen at its start, the battle
itself, and what each player carries out of it.

## `team_snapshots`

| Column     | Type       | Notes                                        |
| ---------- | ---------- | -------------------------------------------- |
| `id`       | `text`     | The snapshot                                 |
| `player`   | `uuid`     | Owner; null for the raid boss                |
| `alliance` | `smallint` | Teams sharing a number fight side by side    |
| `catches`  | `jsonb`    | The party frozen as it stood at battle start |

The party rides as `jsonb` in a schema that otherwise normalizes, because a
snapshot is written once, read whole by the engine, and never queried per field.
A `write_once` trigger refuses to let it be rewritten at all.

A **catch snapshot**
([`src/auth/catch-snapshot.ts`](../../src/auth/catch-snapshot.ts)) copies
`caught` (the source id), `species`, `level`, `ivs`, `effortValues`, `nature`,
`gender`, `height`, `weight`, `shiny`, `moves`, `abilities` and `items`. It is
never rewritten: levelling, evolving or handing an item over mid-raid must not
change units already fighting.

`height` and `weight` are the individual's own rather than the species' listed
ones, and they are **not** stored on the `caught` row. `deriveSize(species,
traitValue)` in
[`src/overworld/encounter/index.ts`](../../src/overworld/encounter/index.ts)
reads them off the trait value against the species as it stands, so evolving
grows the pokemon while keeping its place in the band. The snapshot freezes the
result at battle start, and the battle unit carries it through `setHeight` /
`setWeight`.

## The raid boss

The raid boss gets a snapshot of its own: perfect (31) IVs, zero effort values,
no held items, level `RAID_BOSS_LEVEL`, with nature and ability derived from the
raid's `trait_value` and an empty `caught` id. Its abilities are `Boss` plus the
rolled one, and a shadow boss carries `Shadow` between them. It fights alone
under `BOSS_ALLIANCE`; every player team shares `PLAYER_ALLIANCE`.

Its move list is filtered through `BANNED_BOSS_MOVES`
([`src/battle/abilities/special.ts`](../../src/battle/abilities/special.ts)).

| Banned move | Why                                                                 |
| ----------- | ------------------------------------------------------------------- |
| Transform   | The copy takes the opponent's stats and drops the raid health pool  |
| Metronome   | It calls any registered move, Transform included                    |
| Mirror Move | It casts back whatever the target last used                         |
| Mimic       | It takes a copy of the target's move                                |

The last three are banned because each is a route back to the first. Banning
them is simpler than teaching three different copies what a boss may not become.

The ban is applied before the four moves are taken, so a boss barred from one
still comes with a full set.

Some species are not staged as bosses at all. `canStageBoss` keeps them out of
both the legendary and the shadow draw on two rules: the species is not in
`BANNED_BOSS_SPECIES`, and it has something left to cast once the banned moves
are removed. **Ditto** is the whole of the first list, since what it does is
become something else and a boss is the one thing that must not. The second rule
is a rule rather than a list, so a later move ban cannot quietly strand a
species with an empty kit.

What the `Boss` ability does to damage is worth stating plainly. Only a **hit**
takes health off a boss: health-scaling damage never lands, and neither does
anything indirect, whether poison, a burn, a seed, the weather or the crash off
a missed Jump Kick. Two things still get through on purpose. A **cost**
(`DamageFlags.Cost`) is paid whatever the payer is, so a boss that explodes
still dies by it and one that puts up a Substitute still pays for it. And a
negative amount is a heal, so drains reach it as they would anything else.

## `battles` and `battle_teams`

| Column            | Type       | Notes                                                 |
| ----------------- | ---------- | ----------------------------------------------------- |
| `id`              | `text`     | The battle, and its RNG seed                          |
| `raid_id`         | `text`     | The raid it was fought for; null for PvP              |
| `species`         | `integer`  | What was fought, so a listing can name it             |
| `outcome`         | `smallint` | Unfinished (0), Won (1), Lost (2)                     |
| `started_at`      | `bigint`   | Server-clock milliseconds                             |
| `biome`           | `smallint` | The ground it is fought on; Beyond (24) for nowhere   |
| `weather`         | `smallint` | The sky it was started under; Clear (0) for none      |
| `limits`          | `integer`  | The engine limits the fight ran under                 |
| `rules`           | `smallint` | The Frontier house rule it was held under; 0 for none |
| `opponent`        | `text`     | Who an unowned side was; empty otherwise              |
| `opponent_sprite` | `text`     | The charset they wore, for the history to draw        |

`biome` is what the field draws its ground from: a raid takes its lobby's, a
grunt's fight takes the chunk the stop stands in, and a fight with no place of
its own is left at Beyond, which draws the plain field. It is stored rather than
looked up for the same reason `limits` is. A raid lobby is cleared when the raid
ends and a stop is a row of the player's own, so a battle that had to chase
either would lose its setting the moment somebody watched it back.

`rules` is the house rule a Battle Frontier fight was held under, and 0 for
every other fight in the game. A rule changes what the engine does, since the
Battle Arena stops a fight on the clock, so it is stored for the reason `limits`
is: the window that staged the Brain who set it is gone within the hour, and a
fight replays as the fight it was. See `FrontierRule` in
[`src/data/overworld/experts/index.ts`](../../src/data/overworld/experts/index.ts).

`weather` is the sky the fight was started under, and only an overworld
trainer's fight carries one. It is stored for the reason `biome` is and for one
of its own: the world's sky is quantised to the hour, so a fight replayed an
hour later would otherwise replay under different weather. Clear is the default
and clear does nothing, so every other kind of fight is fought under no weather
at all.

`opponent` and `opponent_sprite` are who an unowned side was. A stop stages a
grunt, Giovanni, a duelling trainer, a gym leader, one of the Elite Four or a
champion, and which one is the window's roll. The window is gone an hour later,
so the name and the coat are kept here for a history read back a week on, beside
the species a raid keeps for the same reason. Both are empty where a player or a
boss was on the other side.

Who fought is `battle_teams`, one row per side: `(battle_id, position,
snapshot_id, player)`, boss first, and the boss row names no player.

The battle id doubles as the fight's RNG seed, so every participant and
spectator replays the same rolls from the same frozen teams.

`finishBattle` stamps the outcome once the fight settles, and every participant
computes the same one, since the fight is deterministic. The `settle_once`
trigger holds it to that: an outcome may move from Unfinished exactly once, and
nothing else on the row may move at all. The profile's battle history reads
`battle_teams` for the player, on its own index, and drops anything still
`Unfinished`, since an abandoned fight is not a result. Replaying a history
entry rebuilds the battle from that seed and those snapshots, so it plays out
identically and awards nothing.

## `battle_aftermaths`

| Column       | Type     | Notes                     |
| ------------ | -------- | ------------------------- |
| `battle_id`  | `text`   | The battle it settled for |
| `player`     | `uuid`   | The player settled        |
| `settled_at` | `bigint` | When they settled         |

The pair is the primary key, and a `write_once` trigger refuses any rewrite, so
a battle settles once per player however many times it is reported. It is the
client's word, like the health beside it, and the Frontier is what reads it: a
facility hangs its gold symbol on taking the house without losing a pokemon.

A battle costs a party three things, and all three stick: the items it spent,
the health it lost and the statuses it walked out with. A berry eaten in a raid
comes off the catch record the way it does in the mainline games, and a pokemon
that finished the fight on two hit points starts the next one there. See [Health
and status](catch-state.md#health-and-status).

They are reported together because they are one fight: a Sitrus Berry gone and
the health it restored describe the same moment. Every removal during the battle
is remembered on the unit (`Unit.consumed`), the health and the carried status
are read off it at the end, and `recordAftermath(battleId, aftermath)` reports
the player's **own** party. The outcome is stamped once by whoever sees the
fight settle, but the aftermath lands per player, since nobody else's catches
are theirs to write.

Every one of the player's units is reported, not only the ones that spent
something: health is owed either way.

What the server can check, it checks against the team snapshots it froze itself.
An item that was not fielded by that catch cannot be stripped, a catch that has
changed hands since is left alone, health is clamped to what the record can
actually hold, and the statuses are kept to the ones a pokemon carries out of a
fight, one of each. What it cannot check is the number itself, since nothing
replays a live battle, so health is trusted exactly as far as the outcome is.

The marker above settles each player once per battle, so a repeated report
changes nothing further. It applies whichever way the fight went, so a berry
eaten against a boss that survived is still eaten, and a replay reports nothing
at all.

The aftermath is written **before** the outcome is stamped. The catches are
[locked](catch-state.md#catches-are-locked-while-they-fight) while the battle is
live and stamping the outcome is what frees them, so reporting afterwards would
leave a window in which a berry could be pulled back into the bag and kept.

## See also

- [Raids](raids.md), the lobby the teams are gathered in
- [Stops and rewards](raid-stops.md), the NPC stops and what a cleared raid pays
- [Catches](catches.md), the records a snapshot is taken from
