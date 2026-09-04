# Raids and battles

Raids run on their own three-hour clock (`RAID_INTERVAL` in
[`src/overworld/chunk-snapshot.ts`](../../src/overworld/chunk-snapshot.ts)) rather
than the 5-minute spawn window, so a lobby stands long enough to gather a party.
See [Windows](overworld.md#windows) for how a chunk's clocks line up.

Two landmark kinds stage raids, and both are **lairs**: a place rather than a
pokemon. `Lairs` ([`src/data/overworld/lair.ts`](../../src/data/overworld/lair.ts))
names the ones the mainline games gave these legendaries (Seafoam Islands, Power
Plant, Mt. Ember, Cerulean Cave), maps each to the legendary at home in it, and
lists which of them a biome can host. A player who has met Articuno before knows
what a Seafoam Islands lair is without being told.

- **Legendary lairs** draw from the **lairs the biome hosts** rather than from its
  spawn pool: the place is the roll, and the place decides who is in it. A biome
  with no lair to its name stages none, which is most of them.
- **Shadow lairs** draw from the biome's rare band, except one draw in eight
  (`SHADOW_RAID_LEGENDARY_CHANCE`), which takes over one of the biome's own lairs
  instead. Their boss carries the `Shadow` ability alongside `Boss`.

A raid is **named after the place**, by `getLairTitle`. A lair is called after
itself (`Seafoam Islands`), a shadowed one is that name with a word in front of it
(`Shadow Seafoam Islands`), and a shadow raid that reached for a rare species
stands in no named place at all, so it is called after the ground it is on
(`Shadow Woodland Lair`). The species is no longer the title: two Articuno raids
in one chunk were two of the same word for different things.

A third kind is not staged by the world at all. A **mythical raid** is opened by
spending a **raid item** and stands on no landmark. `RAID_ITEMS` in
[`src/data/items/raid-items.ts`](../../src/data/items/raid-items.ts) maps each
relic to the species it calls, the Old Sea Map to Mew for instance. Its lobby is
named after the mythical's own lair (`Faraway Island`), and both the lobby and the
catch it pays out record `Biome.Beyond`, since a relic calls something out of a
place the world does not contain. The world never rolls a mythical of its own
(`isMythicalSpecies` is excluded from every landmark roll), so carrying the relic
is the only way to face one. A raid item is found in the **special** band of the
overworld item pool and nowhere else: it cannot be bought or sold.

`hostMythicalRaid` spends the relic **before** the lobby is written, so a raid
item opens exactly one lobby and is gone whether the boss falls or the party does.
Nothing restages it: the landmark rule that reopens a failed raid has no lobby to
reopen, since the id is
`{chunkSeed}{zone}@{raidTimestamp}$mythical{item}:{uid}` and its record already
exists. Hosting also refuses a player with no pokemon, rather than spending the
relic on a lobby nobody can start.

Once open it is an ordinary lobby: it appears in the window's listing, anyone may
join it, and it is fought, cleared and claimed through the same calls.

A fourth fight is not a raid at all: a **Team Rocket grunt** at a `WanderingNpc`
cell, which runs on the three-hour `NPC_INTERVAL` rather than a raid window. It is
described under [`rocketStops`](#rocket_stops) below.

## `raids`

Written by `enterRaid` in [`src/auth/raids.ts`](../../src/auth/raids.ts). The id
is `{chunkSeed}@{raidTimestamp}${kind}{cell}`, derived, so every player who walks onto the landmark in the same window joins
the lobby already standing, and the first to arrive hosts it. The kind tag is
`raid` for a legendary raid and `shadow` for a shadow one, so the two landmark
types never collide on a cell. The read and the create share a transaction, so one
landmark stages exactly one raid per window even when two players walk in
together: a player either opens the lobby or joins the one already there.

| Column                             | Type             | Notes                                                       |
| ---------------------------------- | ---------------- | ----------------------------------------------------------- |
| `id`                               | `text`           | The derived lobby id                                        |
| `kind`                             | `smallint`       | Legendary (0) or Shadow (1)                                 |
| `species`                          | `integer`        | What is being staged                                        |
| `lair`                             | `smallint`       | The place it stands in; null for a shadow on a rare species |
| `biome`                            | `smallint`       | What a lairless shadow raid is named after                  |
| `trait_value`                      | `integer`        | 32-bit roll the boss' nature and ability derive from        |
| `host`                             | `uuid`           | Only this player may start the raid                         |
| `battle_id`                        | `text`           | The battle the host started, null while gathering           |
| `window_at`                        | `bigint`         | The **local** raid window, for listing the live lobbies     |
| `utc_offset`                       | `smallint`       | Minutes east of UTC the window was read in                  |
| `chunk_seed`, `chunk_x`, `chunk_y` | `text`/`integer` | Where the lobby stands, for a listing with no chunk in hand |
| `cell`                             | `integer`        | The landmark cell                                           |
| `cleared`                          | `boolean`        | Set when the boss goes down                                 |

Who has joined is `teams` rows pointing back at the raid rather than a list on
the lobby, so two players joining at once cannot overwrite each other and the
order they arrived in is the identity column on those rows. `startRaid` writes
`battle_id` inside a transaction, so a second start finds it taken.

`battle_id` deliberately carries **no foreign key**. Starting a raid claims the
id on the lobby first, in its own transaction, and only then writes the battle. A
claim whose battle never lands is a designed state: it reads as lost, and the
lobby restages.

A raid is fought with pokemon of one's own, so `canJoinRaids(uid)` gates taking
part: `hasAnyCaught` in [`src/auth/caught.ts`](../../src/auth/caught.ts), a single
one-row read. A player who owns nothing neither opens a lobby nor restages a
failed one, and `joinRaid` refuses their team. They may still watch: walking in on
a running raid opens it as a replay, which settles nothing and pays nothing.
Hosting counts as taking part, since an empty lobby nobody can start is worse than
no lobby.

`listLiveRaids(raidTimestamp, offset)` queries `window_at` and `utc_offset`
together, on the `raids_window` index, and keeps the lobbies that are neither
started nor cleared. That is the Raids tab. Both fields are needed: the window is local, so two
zones can floor to the same one, and what they stage at a landmark is not the same
boss. The lobby id carries the zone for the same reason.

## Walking up to a lair

Looking at a lair stages nothing. `peekRaid` reads the cell, the stored lobby and,
where one exists, its battle, then answers with what is standing there and the
**one** thing this player may do about it. Nothing is written, so a player who
opens the dialog and thinks better of it leaves no lobby behind. Before this,
looking _was_ hosting.

| `RaidAction` | When                                                     | What the button does                      |
| ------------ | -------------------------------------------------------- | ----------------------------------------- |
| `Host`       | No lobby, or the last party failed, and they own pokemon | `enterRaid` stages it, then the Raids tab |
| `Join`       | A lobby is gathering and they own pokemon                | `enterRaid` adopts it, then the Raids tab |
| `Spectate`   | The battle has started, or they own no pokemon           | Opens the battle, or the lobby, to watch  |

The dialog shows that button and `Close`, rather than three of which two would be
refused. It resolves null, and the player is told the lair is quiet, when the
cell stages no raid this window, the raid has been cleared, or there is nothing
standing and the player has nothing to stage it with.

`peekRaid` decides all of that the same way `enterRaid` does, so the button is
honoured when it is pressed. It can still be beaten to it: a lobby cleared or
started between the look and the press is handled by `enterRaid` itself, which is
the only writer either way, and a `Join` that arrives after the fight started
becomes a seat.

The window gives the boss one defeat, not one fight:

- **Cleared.** `clearRaid` sets `cleared` when the boss goes down, and the
  landmark shuts: `enterRaid` resolves null for the rest of the window, and the
  next window rolls a new raid at the same cell.
- **Lost.** `enterRaid` reads the lobby's battle in the same transaction. A battle
  recorded as `Lost`, one whose row is gone, or one still `Unfinished` more
  than `RAID_BATTLE_TIMEOUT` (10 minutes) after its `startedAt` counts as failed,
  since an abandoned party is not a beaten boss. The arrival restages the lobby in
  place: same id, same `species` and `traitValue`, a new host, no teams and no
  battle. It reappears in the live listing on its own, since the watcher keeps
  whatever has `battle == null`.
- **Under way.** A battle that is neither won nor timed out is what the arrival
  walks into, and walking in on a running raid is spectating it.

Restaging keeps the id, so `raid_rewards` still pays each player
once: a claim is checked against the raid's _current_ battle, which only a winning
party appears in.

## `teams` and `team_catches`

| Column       | Type     | Notes                                    |
| ------------ | -------- | ---------------------------------------- |
| `id`         | `text`   | The team                                 |
| `player`     | `uuid`   | Owner                                    |
| `raid_id`    | `text`   | The raid it was brought to               |
| `joined_seq` | `bigint` | Identity column, so the host stays first |

The party itself is `team_catches`, one row per slot: `(team_id, slot, caught_id)`,
up to `TEAM_SIZE` (6), unique on the catch so a pokemon cannot be entered twice.

A team holds ids, so it follows whatever those catches become, until a battle
freezes them.

Catch ids are readable by any signed-in player, so a submitted party cannot be
trusted on its word. `joinRaid` in
[`src/server/raids.ts`](../../src/server/raids.ts) rejects one that repeats a
catch or names a catch the player does not own, and nothing but the server writes
`teams`, so there is no way around that check.

Ownership is re-checked where it matters. Freezing a team leaves out any catch
whose `owner` no longer matches the team's player, which covers a catch traded
away between joining the lobby and the host starting the raid, and resolves null
when nothing survives, so `startRaid` drops that team rather than fielding an empty
side, and its player is not listed among the battle's `players`.

**One pokemon, one fight.** A catch cannot be brought to a raid while it is
already committed elsewhere, and that is checked in three places:

- `joinRaid` refuses a party holding a **locked** catch, meaning one in a live
  battle.
- `joinRaid` also refuses one already **queued**. `isAnyCatchQueued` joins
  `team_catches` to the player's own teams, on the `team_catches_caught` index,
  and blocks when any of the party is still listed by a raid that has not
  started. This is
  why a team names its `raid`: without it, answering would mean reading every
  lobby in the world. Teams of raids that started, were cleared, or were left
  behind do not count.
- Freezing drops a catch that is locked by the time the host starts, so a player
  sitting in two lobbies with the same party has it fielded by whichever raid
  started first and simply left out of the other.

The team picker greys out anything it can see is fighting (`isLockLive`, from the
two lock fields it already has), so the refusal is usually visible before the join
is attempted.

## Searching the lobby

A full lobby is twenty rows of strangers, so it carries a search box of its own
with the same grammar as everything else. `TEAM_VOCABULARY` and `matchesTeam`
live in [`team-search.ts`](../../src/auth/team-search.ts).

| Field             | What it narrows by                               |
| ----------------- | ------------------------------------------------ |
| a plain word      | The nickname the lobby shows, or the player's id |
| `player:`         | The same, asked by name                          |
| `size:`           | How many pokemon they brought                    |
| `is:`, `not:`     | `mine`, `host`, `alone`                          |
| `sort:`, `order:` | `name`, `size`                                   |

What each pokemon in a party is stays out of the grammar: a lobby holds catch
ids, and the records behind them are read by the row that draws them rather than
by the row that filters.

A lobby holds `RAID_PLAYER_LIMIT` (20) **players** rather than teams: somebody
fielding two parties still fills one place. Both sides read the limit, so the
join button and the server refuse together.

## `raid_invites` and `raid_watchers`

A lobby stands open in the world, so anybody may walk into one. Two tables cover
the people who arrive some other way.

**`raid_invites`** is a player in a lobby calling a friend into it: one row per
raid and recipient, whoever sent it first, carrying the `role` they are called in
as (a fighter or a watcher). It goes when the raid does, when the friend
dismisses it, or when they join and it has done its work. Readable by the two
ends alone.

**`raid_watchers`** is who is standing in a lobby without a party: written on the
way in, dropped on the way out, and taken by the cascade when the lobby goes. A
player who owns no pokemon can do nothing else, and a raid has always had
onlookers; the row is what lets the lobby say so. Tier 1, the way the lobby
itself is, since who is watching a raid is as public as who has joined it.

Both are published to realtime, so an invited list and a crowd both move while
somebody is looking at them.

## `team_snapshots`

| Column     | Type       | Notes                                        |
| ---------- | ---------- | -------------------------------------------- |
| `id`       | `text`     | The snapshot                                 |
| `player`   | `uuid`     | Owner; null for the raid boss                |
| `alliance` | `smallint` | Teams sharing a number fight side by side    |
| `catches`  | `jsonb`    | The party frozen as it stood at battle start |

The party rides as `jsonb` in a schema that otherwise normalizes, because a
snapshot is a sealed replay artifact: written once, read whole by the engine, and
never queried per field. A `write_once` trigger refuses to let it be rewritten at
all.

A **catch snapshot**
([`src/auth/catch-snapshot.ts`](../../src/auth/catch-snapshot.ts)) copies `caught`
(the source id), `species`, `level`, `ivs`, `effortValues`, `nature`, `gender`,
`height`, `weight`, `shiny`, `moves`, `abilities` and `items`. It is never
rewritten: levelling, evolving or handing an item over mid-raid must not change
units already fighting.

`height` and `weight` are the individual's own rather than the species' listed
ones, and they are **not** stored on the `caught` row.
`deriveSize(species, traitValue)` in
[`src/overworld/encounter.ts`](../../src/overworld/encounter.ts) reads them off the
trait value against the species as it stands, so evolving grows the pokemon while
keeping its place in the band. The snapshot freezes the result at battle start, and
the battle unit carries it through `setHeight` / `setWeight`.

The raid boss gets a snapshot of its own: perfect (31) IVs, zero effort values, no
held items, level `RAID_BOSS_LEVEL`, with nature and ability derived from the
raid's `trait_value` and an empty `caught` id. Its abilities are `Boss` plus the
rolled one, and a shadow boss carries `Shadow` between them. It fights alone under
`BOSS_ALLIANCE`; every player team shares `PLAYER_ALLIANCE`.

Its move list is filtered through `BANNED_BOSS_MOVES`
([`src/battle/abilities/special.ts`](../../src/battle/abilities/special.ts)).
**Transform** is on that list because a boss that copies a player stops being a
boss: the copy takes the opponent's stats and throws away the raid-sized health
pool the fight is built around. **Metronome**, **Mirror Move** and **Mimic** are
on it because each is a way back to the first (one calls anything registered, one
casts back whatever the target last used, and one takes a copy of it), so banning
them is simpler than teaching three different copies what a boss may not
become.

The ban is applied before the four moves are taken, so a boss barred from one
still comes with a full set.

Some species are not staged as bosses at all. `canStageBoss` keeps them out of both
the legendary and the shadow draw on two rules: the species is not in
`BANNED_BOSS_SPECIES`, and it has something left to cast once the banned moves
are removed. **Ditto** is the whole of the first list, since what it does is
become something else and a boss is the one thing that must not, and the second
rule is a rule rather than a list, so a later move ban cannot quietly strand a
species with an empty kit.

What the `Boss` ability does to damage is worth stating plainly. Only a **hit**
takes health off a boss: health-scaling damage never lands, and neither does
anything indirect, whether poison, a burn, a seed, the weather or the crash off a
missed Jump Kick. Two things still get through on purpose. A **cost**
(`DamageFlags.Cost`) is paid whatever the payer is, so a boss that explodes still
dies by it and one that puts up a Substitute still pays for it. And a negative
amount is a heal, so drains reach it as they would anything else.

## `battles` and `battle_teams`

| Column       | Type       | Notes                                               |
| ------------ | ---------- | --------------------------------------------------- |
| `id`         | `text`     | The battle, and its RNG seed                        |
| `raid_id`    | `text`     | The raid it was fought for; null for PvP            |
| `species`    | `integer`  | What was fought, so a listing can name it           |
| `outcome`    | `smallint` | Unfinished (0), Won (1), Lost (2)                   |
| `started_at` | `bigint`   | Server-clock milliseconds                           |
| `biome`      | `smallint` | The ground it is fought on; Beyond (24) for nowhere |
| `weather`    | `smallint` | The sky it was started under; Clear (0) for none    |
| `limits`     | `integer`  | The engine limits the fight ran under               |
| `rules`      | `smallint` | The Frontier house rule it was held under; 0 for none |

`biome` is what the field draws its ground from: a raid takes its lobby's, a
grunt's fight takes the chunk the stop stands in, and a fight with no place of
its own is left at Beyond, which draws the plain field. It is stored rather than
looked up for the same reason `limits` is. A raid lobby is cleared when the raid
ends and a rocket stop is a row of the player's own, so a battle that had to
chase either would lose its setting the moment somebody watched it back.

`rules` is the house rule a Battle Frontier fight was held under, and 0 for every
other fight in the game. A rule changes what the engine does — the Battle Arena
stops a fight on the clock — so it is stored for the reason `limits` is: the
window that staged the Brain who set it is gone within the hour, and a fight
replays as the fight it was. See `FrontierRule` in
[`src/data/overworld/experts.ts`](../../src/data/overworld/experts.ts).

`weather` is the sky the fight was started under, and only an overworld trainer's
fight carries one. It is stored for the reason `biome` is and for one of its own:
the world's sky is quantised to the hour, so a fight replayed an hour later would
otherwise replay under different weather. Clear is the default and clear does
nothing, so every other kind of fight is fought under no weather at all.

Who fought is `battle_teams`, one row per side: `(battle_id, position,
snapshot_id, player)`, boss first, and the boss row names no player.

The battle id doubles as the fight's RNG seed, so every participant and spectator
replays the same rolls from the same frozen teams.

`finishBattle` stamps the outcome once the fight settles, and every participant
computes the same one, since the fight is deterministic. The `settle_once` trigger
holds it to that: an outcome may move from Unfinished exactly once, and nothing
else on the row may move at all. The profile's battle history reads
`battle_teams` for the player, on its own index, and drops anything still
`Unfinished`, since an abandoned fight is not a result. Replaying a history entry
rebuilds the battle from that seed and those snapshots, so it plays out identically
and awards nothing.

## `battle_aftermaths`

| Column       | Type     | Notes                     |
| ------------ | -------- | ------------------------- |
| `battle_id`  | `text`   | The battle it settled for |
| `player`     | `uuid`   | The player settled        |
| `settled_at` | `bigint` | When they settled         |
| `fainted`    | `smallint` | How many of their party ended it down |

The pair is the primary key, and a `write_once` trigger refuses any rewrite, so a
battle settles once per player however many times it is reported.

`fainted` is how many of that player's side were down when the report arrived. It
counts the **team** rather than the records, so a party the Battle Factory lent
counts too: such a fight settles nothing onto a record and still writes this row,
which is the only thing it has to say.
It is the client's word, like the health beside it, and the Frontier is what
reads it: a facility hangs its gold symbol on taking the house without losing a
pokemon.

A battle costs a party three things, and all three stick: the items it spent, the
health it lost and the statuses it walked out with. A berry eaten in a raid comes
off the catch record the way it does in the mainline games, and a pokemon that
finished the fight on two hit points starts the next one there. See
[Health and status](catches.md#health-and-status).

They are reported together because they are one fight: a Sitrus Berry gone and the
health it restored describe the same moment. Every removal during the battle is
remembered on the unit (`Unit.consumed`), the health and the carried status are
read off it at the end, and `recordAftermath(battleId, aftermath)` reports the
player's **own** party. The outcome is stamped once by whoever sees the fight
settle, but the aftermath lands per player, since nobody else's catches are theirs
to write.

Every one of the player's units is reported, not only the ones that spent
something: health is owed either way.

What the server can check, it checks against the team snapshots it froze itself.
An item that was not fielded by that catch cannot be stripped, a catch that has
changed hands since is left alone, health is clamped to what the record can
actually hold, and the statuses are kept to the ones a pokemon carries out of a
fight, one of each. What it cannot check is the number itself, since nothing
replays a live battle, so health is trusted exactly as far as the outcome is.

The marker above settles each player once per battle, so a repeated report changes
nothing further. It applies whichever way the fight went, so a berry eaten
against a boss that survived is still eaten, and a replay reports nothing at
all.

The aftermath is written **before** the outcome is stamped. The catches are
[locked](catches.md#catches-are-locked-while-they-fight) while the battle is live
and stamping the outcome is what frees them, so reporting afterwards would leave a
window in which a berry could be pulled back into the bag and kept.

## `rocket_stops`

A **Team Rocket grunt** (`Npc.RocketGrunt`) stands at a `TeamRocket` cell for
`NPC_INTERVAL` (3 hours), the window that decides who is at one.

Unlike a raid it is not a lobby. The grunt fights each passer-by on their own, so
the state is **per player**, and one player's victory closes nothing for anybody
else.

The stop id is `{chunkSeed}{zone}@{npcTimestamp}$rocket{cell}`, and the row is
keyed by that and the player.

| Column                             | Type             | Notes                                        |
| ---------------------------------- | ---------------- | -------------------------------------------- |
| `stop_id`                          | `text`           | The stop and its window                      |
| `player`                           | `uuid`           | Who this state belongs to                    |
| `battle_id`                        | `text`           | The fight under way, or the last one fought  |
| `window_at`                        | `bigint`         | The local NPC window the grunt was rolled in |
| `utc_offset`                       | `smallint`       | Minutes east of UTC                          |
| `chunk_seed`, `chunk_x`, `chunk_y` | `text`/`integer` | Where the stop stands                        |
| `cell`                             | `integer`        | The landmark cell                            |
| `defeated`                         | `boolean`        | Set when the grunt goes down                 |

The grunt's three ride in `rocket_party`, one row per slot, weakest first:
`(slot, species, individual_value, trait_value)`.

`enterRocketStop` rolls the party from the chunk itself: one from the biome's
**base**, **uncommon** and **rare** bands for the window, each with its own
individual and trait values. A band the window leaves empty borrows from the
commonest one that is not. The record is written on first approach.

`startRocketBattle` freezes the player's party exactly as `startRaid` does, with
the same snapshot, the same lock and the same refusal of a pokemon already
fighting or waiting in a lobby. It freezes the grunt's three beside it at
`ROCKET_PARTY_LEVEL` (50), all shadowed, and writes a battle with no raid. It is an ordinary trainer
battle: `BattleModes.PvP`, and **no side is flagged as a boss**, so a mutual
knockout is a draw rather than a win.

The party is stored rather than re-derived because a party frozen at the fight
should stay what it was, whatever the window does afterwards.

The prize is recorded as **`EncounterType.Rocket`**. A grunt is fought alone, pays
a fixed low-level commoner and hands over a shadow, so a catch record that called
it a raid prize would be saying the wrong thing about where it came from. See
[Encounter kinds](encounters.md#encounter-kinds).

Losing changes nothing: the grunt is still standing, and the stop can be fought
again until the window turns over. Winning is what closes it.
`claimRocketReward` pays `ROCKET_STOP_GOLD` (500) and stages one of the grunt's
two **commoner** species as an encounter, never the rare one, shadowed and at a
fixed `ROCKET_REWARD_LEVEL` (10). The same grunt is therefore worth
the same to everyone who put them down, and what is handed over is a commoner
taken off a thief rather than anything like the level-50 party it came from. The
`defeated` flag is both the record of the win and the marker guarding it: it is
set inside a transaction, and only the call that sets it pays.

## `raid_rewards`

| Column    | Type      | Notes                   |
| --------- | --------- | ----------------------- |
| `raid_id` | `text`    | The raid collected from |
| `player`  | `uuid`    | Who collected           |
| `gold`    | `integer` | The purse it paid       |

The pair is the primary key and the row is write-once, which is what makes the
claim a claim.

`claimRaidReward(raidId)` hands over what a cleared raid owes: the pokemon, and a
purse that depends on the kind of raid.

| Raid      | Gold                         | Prize recorded as             |
| --------- | ---------------------------- | ----------------------------- |
| Mythical  | `MYTHICAL_RAID_GOLD` (3000)  | `EncounterType.MythicalRaid`  |
| Legendary | `LEGENDARY_RAID_GOLD` (2000) | `EncounterType.LegendaryRaid` |
| Shadow    | `SHADOW_RAID_GOLD` (1000)    | `EncounterType.ShadowRaid`    |

Every fighter is paid the same amount: the boss decides it, not who landed the
last hit. The call refuses unless the battle was **won** and the player has a
`battle_teams` row in it, and the marker above guards both halves, so neither the
gold nor the pokemon is collected twice. The reward waits rather than expiring,
so a player who ran from the encounter or left the battle early claims it later
from their battle history.

The encounter itself is not stored as a reward. `deriveRaidReward` rolls a spawn
tuple from the raid id and the player's uid, and the encounter is derived against
the **raid's own** chunk and window rather than wherever the player is standing, so
a late claim meets exactly what the raid staged. It lands through the usual `encounters` path.

A raid already under way cannot be joined: `joinRaid` refuses once `battle_id` is
set, and a player who walks onto the landmark then is sent into the battle as a
**replay**: they watch the same deterministic fight, settle nothing, and are owed
nothing.
