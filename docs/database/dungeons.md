# Dungeon runs

A hideout, a dungeon or a Frontier tower is walked one player at a time. The
floors are derived from the chunk and the NPC window on both sides, so the table
keeps only what the player changed. The code is in `src/server/dungeons.ts`.

## `dungeon_runs`

The run id is `{chunkSeed}{zone}@{npcTimestamp}$dungeon{cell}`, and the row is
keyed by the generation, that id and the player.

| Column                             | Type             | Notes                                                        |
| ---------------------------------- | ---------------- | ------------------------------------------------------------ |
| `generation`                       | `smallint`       | The world generation the dungeon stands in                  |
| `run_id`                           | `text`           | The dungeon and its window                                   |
| `player`                           | `uuid`           | Whose run it is                                              |
| `kind`                             | `smallint`       | `DungeonKind`: hideout, dungeon or Frontier                  |
| `window_at`                        | `bigint`         | The local NPC window                                         |
| `utc_offset`                       | `smallint`       | Minutes east of UTC                                          |
| `chunk_seed`, `chunk_x`, `chunk_y` | `text`/`integer` | Where it stands                                              |
| `depth`                            | `smallint`       | The layer, surface or cave                                   |
| `cell`                             | `integer`        | The landmark cell                                            |
| `party`                            | `jsonb`          | The catch ids locked in at the entrance; empty before a run  |
| `floor`                            | `smallint`       | The floor the player is on                                   |
| `state`                            | `jsonb`          | Where they stand and what they changed; null before a run    |
| `beaten`                           | `jsonb`          | Rooms beaten on this floor                                   |
| `looted`                           | `jsonb`          | Stashes taken this window, as `floor:room`                   |
| `battle_id`, `battle_room`         | `text`/`smallint`| The room fight under way                                     |
| `cleared`                          | `boolean`        | Set once the last floor is won                               |

`state` is a `FloorState` (`src/overworld/dungeon/walk.ts`): the room, whether
the barriers are flipped, keys held, locked doors opened, keys and passes taken,
crumbled rooms, the pass, and the rooms seen.

Every step goes through `moveInDungeon`, which runs the same `step` the client
draws with, so a client cannot walk through a wall. A lost fight or a walk-out
resets `party`, `floor`, `state` and `beaten`. `looted` survives it, so a restart
never pays a stash twice. Clearing is guarded in the statement that sets
`cleared`, so it pays once.

`runLockedCatches` (`src/server/dungeon-lock.ts`) reads the live runs, and Nurse
Joy and candy refuse to mend a catch in one. Medicine is the only heal mid-run.

Browsers read their own rows. The hourly `sweep-old-dungeon-runs` job deletes
rows a day past their window.
