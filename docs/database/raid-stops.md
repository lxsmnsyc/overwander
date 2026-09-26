# Stops and rewards

The landmarks that fight a passer-by one at a time, and the purse a cleared raid
owes the party that cleared it.

## `rocket_stops`

A **stop** is any landmark cell that bars the way with somebody who fights. Six
of them stage one: `TeamRocket`, `Trainer`, `GymLeader`, `EliteFour`, `Champion`
and `FrontierBrain`. Whoever is standing there holds the cell for `NPC_INTERVAL`
(3 hours), the window that decides who is at one.

The two tables are still named for Team Rocket because it was the only kind when
they were written. They hold every kind now, and the code that reads them lives
in `src/server/stops.ts`. Renaming them would mean renaming what a scheduled
sweep deletes from, so the names stay and this note stands in their place.

Unlike a raid a stop is not a lobby. It fights each passer-by on their own, so
the state is **per player**, and one player's victory closes nothing for anybody
else.

The stop id is `{chunkSeed}{zone}@{npcTimestamp}$rocket{cell}`, and the row is
keyed by that and the player. The `rocket` in it is a stored key rather than a
word: every stop row already written is keyed by it.

| Column                             | Type             | Notes                                       |
| ---------------------------------- | ---------------- | ------------------------------------------- |
| `stop_id`                          | `text`           | The stop and its window                     |
| `player`                           | `uuid`           | Who this state belongs to                   |
| `battle_id`                        | `text`           | The fight under way, or the last one fought |
| `window_at`                        | `bigint`         | The local NPC window it was rolled in       |
| `utc_offset`                       | `smallint`       | Minutes east of UTC                         |
| `chunk_seed`, `chunk_x`, `chunk_y` | `text`/`integer` | Where the stop stands                       |
| `cell`                             | `integer`        | The landmark cell                           |
| `defeated`                         | `boolean`        | Set when whoever stands there goes down     |

The party rides in `rocket_party`, one row per slot, weakest first: `(slot,
species, individual_value, trait_value)`. Everybody fields six.

`enterStop` rolls the party from the chunk itself, and what it rolls is the
landmark's business: a grunt takes one commoner, two uncommons and three rares,
an executive six rares, Giovanni five and a legendary, and a league seat or a
duelling trainer fields what their own list says. The record is written on first
approach.

`startStopBattle` freezes the player's party exactly as `startRaid` does, with
the same [snapshot](battle-rows.md#team_snapshots), the same lock and the same
refusal of a pokemon already fighting or waiting in a lobby. It freezes the
stop's six beside it in the level band `stopPartyLevels` gives for that
landmark, shadowed only for Team Rocket, and writes a battle with no raid. It is
an ordinary trainer battle: `BattleModes.PvP`, and **no side is flagged as a
boss**, so a mutual knockout is a draw rather than a win.

The party is stored rather than re-derived because a party frozen at the fight
should stay what it was, whatever the window does afterwards.

Losing changes nothing: whoever was standing there still is, and the stop can be
fought again until the window turns over. Winning is what closes it.
`claimStopReward` pays a purse rolled in the landmark's own band, and for the
rungs above a grunt it also rolls one item off the biome's pool. The `defeated`
flag is both the record of the win and the marker guarding it: it is set inside
a transaction, and only the call that sets it pays.

Only a Team Rocket stop leaves a pokemon behind. It is recorded as
**`EncounterType.Rocket`**, shadowed and at a fixed `ROCKET_REWARD_LEVEL` (10),
so the same grunt is worth the same to everyone who put them down. A catch
record that called it a raid prize would be saying the wrong thing about where
it came from. See [Encounter kinds](encounters.md#encounter-kinds).

## `raid_rewards`

| Column    | Type      | Notes                   |
| --------- | --------- | ----------------------- |
| `raid_id` | `text`    | The raid collected from |
| `player`  | `uuid`    | Who collected           |
| `gold`    | `integer` | The purse it paid       |

The pair is the primary key and the row is write-once, which is what makes the
claim a claim.

`claimRaidReward(raidId)` hands over what a cleared raid owes: the pokemon, and
a purse that depends on the kind of raid.

| Raid      | Gold                         | Prize recorded as             |
| --------- | ---------------------------- | ----------------------------- |
| Mythical  | `MYTHICAL_RAID_GOLD` (3000)  | `EncounterType.MythicalRaid`  |
| Legendary | `LEGENDARY_RAID_GOLD` (2000) | `EncounterType.LegendaryRaid` |
| Shadow    | `SHADOW_RAID_GOLD` (1000)    | `EncounterType.ShadowRaid`    |

Every fighter is paid the same amount: the boss decides it, not who landed the
last hit. The call refuses unless the battle was **won** and the player has a
`battle_teams` row in it, and the marker above guards both halves, so neither
the gold nor the pokemon is collected twice. The reward waits rather than
expiring, so a player who ran from the encounter or left the battle early claims
it later from their battle history.

The encounter itself is not stored as a reward. `deriveRaidReward` rolls a spawn
tuple from the raid id and the player's uid, and the encounter is derived
against the **raid's own** chunk and window rather than wherever the player is
standing, so a late claim meets exactly what the raid staged. It lands through
the usual `encounters` path.

## See also

- [Raids](raids.md), the lobby and the lair a reward is claimed from
- [Battle rows](battle-rows.md), the battle a stop or a raid writes
- [Encounter kinds](encounters.md), how a prize is recorded
