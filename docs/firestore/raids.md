# Raids and battles

Raids run on their own hour-long clock (`RAID_INTERVAL` in
[`src/overworld/chunk-snapshot.ts`](../../src/overworld/chunk-snapshot.ts)) rather
than the 5-minute spawn window, so a lobby stands long enough to gather a party.
There are two landmark kinds:

- **Legendary raids** draw from the chunk biome's special tier for the raid
  hour's time of day, filtered to legendaries — mythicals are never staged.
- **Shadow raids** draw from the biome's rare band, except one draw in eight
  (`SHADOW_RAID_LEGENDARY_CHANCE`) which reaches the legendary pool instead.
  Their boss carries the `Shadow` ability alongside `Boss`.

A third kind is not staged by the world at all. A **mythical raid** is opened by
spending a **raid item**, and stands on no landmark:

- **Mythical raids** are called out by a relic — `RAID_ITEMS` in
  [`src/data/items/raid-items.ts`](../../src/data/items/raid-items.ts) maps each to
  the species it calls, e.g. the Old Sea Map to Mew. The world never rolls a
  mythical of its own (`isMythicalSpecies` is excluded from every landmark
  roll), so carrying the relic is the only way to face one. A raid item is found
  in the **special** band of the overworld item pool and nowhere else: it cannot
  be bought or sold.

`hostMythicalRaid` spends the relic **before** the lobby is written, so a raid
item opens exactly one lobby and is gone whether the boss falls or the party
does. Nothing restages it — the landmark rule that reopens a failed raid has no
lobby to reopen, since the id is `{chunkSeed}{zone}@{raidTimestamp}$mythical{item}:{uid}`
and its record already exists. Hosting also refuses a player with no pokemon,
rather than spending the relic on a lobby nobody can start.

Once open it is an ordinary lobby: it appears in the hour's listing, anyone may
join it, and it is fought, cleared and claimed through the same calls.

A fourth landmark runs on the same hour without being a raid at all: the **Team
Rocket Stop**, a solo trainer fight described under
[`rocketStops`](#rocketstopsstopiduid) below.

## `raids/{chunkSeed}@{raidTimestamp}${kind}{cell}`

Written by `enterRaid` in [`src/auth/raids.ts`](../../src/auth/raids.ts). The id is
derived, so every player who walks onto the landmark in the same hour joins the
lobby that is already standing; the first to arrive hosts it. The kind tag is
`raid` for a legendary raid and `shadow` for a shadow one, so the two landmark
types never collide on a cell. The read and the create share a transaction, so
one landmark stages exactly one raid per hour even when two players walk in
together — a player either opens the lobby or joins the one already there.

| Field        | Type             | Notes                                                       |
| ------------ | ---------------- | ----------------------------------------------------------- |
| `kind`       | `RaidKind`       | Legendary (0) or Shadow (1)                                 |
| `species`    | `Species`        | What is being staged                                        |
| `traitValue` | `number`         | 32-bit roll the boss' nature and ability derive from        |
| `host`       | `string`         | Only this uid may start the raid                            |
| `teams`      | `string[]`       | `teams/{teamId}` ids, appended via `arrayUnion`             |
| `battle`     | `string \| null` | The battle the host started, null while gathering           |
| `timestamp`  | `number`         | The **local** raid hour, for listing the live lobbies        |
| `offset`     | `number`         | Minutes east of UTC the hour was read in                    |
| `chunk`      | `{ seed, x, y }` | Where the lobby stands, for a listing with no chunk in hand |
| `cell`       | `number`         | The landmark cell                                           |
| `cleared`    | `boolean`        | Set when the boss goes down                                 |

`joinRaid` writes the party as its own team document and appends only the id, so
two players joining at once cannot overwrite each other. `startRaid` writes
`battle` inside a transaction, so a second start finds it taken.

A raid is fought with pokemon of one's own, so `canJoinRaids(uid)` —
`hasAnyCaught` in [`src/auth/caught.ts`](../../src/auth/caught.ts), a single
`limit(1)` read — gates taking part. A player who owns nothing neither opens a
lobby nor restages a failed one (`enterRaid` resolves the standing lobby, or
null when there is none) and `joinRaid` refuses their team. They may still watch:
walking in on a running raid opens it as a replay, which settles nothing and
pays nothing. Hosting counts as taking part — an empty lobby nobody can start is
worse than no lobby.

`listLiveRaids(raidTimestamp, offset)` queries `timestamp` and `offset` together
— **a composite index** — and keeps the lobbies that are neither started nor
cleared; that is the Raids tab. Both are needed: the hour is local, so two zones
can floor to the same one, and what they stage at a landmark is not the same
boss. The lobby id carries the zone for the same reason.

The hour gives the boss one defeat, not one fight:

- **Cleared.** `clearRaid` sets `cleared` when the boss goes down, and the
  landmark shuts: `enterRaid` resolves null for the rest of the hour, and the
  next hour rolls a new raid at the same cell.
- **Lost.** `enterRaid` reads the lobby's battle in the same transaction. A
  battle recorded as `Lost`, one whose document is gone, or one still
  `Unfinished` more than `RAID_BATTLE_TIMEOUT` (10 minutes) after its
  `startedAt` counts as failed — an abandoned party is not a beaten boss. The
  arrival restages the lobby in place: same id, same `species` and `traitValue`,
  a new host, no teams and no battle. It reappears in the live listing on its
  own, since the watcher keeps whatever has `battle == null`.
- **Under way.** A battle that is neither won nor timed out is what the arrival
  walks into, and walking in on a running raid is spectating it.

Restaging keeps the id, so `raidRewards/{raidId}:{uid}` still pays each player
once: a claim is checked against the raid's _current_ battle, which only a
winning party appears in.

## `teams/{teamId}`

| Field     | Type       | Notes                                        |
| --------- | ---------- | -------------------------------------------- |
| `player`  | `string`   | Owning uid                                   |
| `raid`    | `string`   | The `raids/{raidId}` it was brought to       |
| `catches` | `string[]` | Up to `TEAM_SIZE` (6) `caught/{catchId}` ids |

A team holds ids, so it follows whatever those catches become — until a battle
freezes them.

Catch ids are readable by any signed-in player, so a submitted party cannot be
trusted on its word. `joinRaid` in
[`src/server/raids.ts`](../../src/server/raids.ts) rejects one that repeats a catch
or names a catch the player does not own — and the rules make `teams`
server-only, so there is no way around that check. Ownership is still
re-checked where it matters: freezing a team leaves out any catch
whose `owner` no longer matches `team.player` — which also covers a catch traded
away between joining the lobby and the host starting the raid — and resolves
null when nothing survives, so `startRaid` drops that team rather than fielding
an empty side, and its player is not listed among the battle's `players`.

**One pokemon, one fight.** A catch cannot be brought to a raid while it is
already committed elsewhere, and that is checked in three places:

- `joinRaid` refuses a party holding a **locked** catch — one in a live battle.
- `joinRaid` also refuses one already **queued**: `isAnyCatchQueued` reads the
  player's own teams (`player ==` uid, `catches array-contains-any` the party)
  and blocks when any of them is still listed by a raid that has not started.
  This is why a team names its `raid` — without it, answering would mean reading
  every lobby in the world. Teams of raids that started, were cleared, or were
  left behind do not count.
- Freezing drops a catch that is locked by the time the host starts, so a player
  sitting in two lobbies with the same party has it fielded by whichever raid
  started first and simply left out of the other.

The team picker greys out anything it can see is fighting (`isLockLive`, from
the two lock fields it already has), so the refusal is usually visible before
the join is attempted.

## `teamSnapshots/{snapshotId}`

| Field      | Type              | Notes                                        |
| ---------- | ----------------- | -------------------------------------------- |
| `player`   | `string`          | Owning uid; empty for the raid boss          |
| `alliance` | `number`          | Teams sharing a number fight side by side    |
| `catches`  | `CatchSnapshot[]` | The party frozen as it stood at battle start |

A **catch snapshot** ([`src/auth/catch-snapshot.ts`](../../src/auth/catch-snapshot.ts))
copies `caught` (the source id), `species`, `level`, `ivs`, `effortValues`,
`nature`, `gender`, `height`, `weight`, `shiny`, `moves`, `abilities` and
`items`. It is never rewritten: levelling, evolving or handing an item over
mid-raid must not change units already fighting.

`height` and `weight` are the individual's own, not the species' listed ones.
They are **not** stored on `caught/{catchId}`: `deriveSize(species, traitValue)`
in [`src/overworld/encounter.ts`](../../src/overworld/encounter.ts) reads them off
the trait value against the species as it stands, so evolving grows the pokemon
while keeping its place in the band. The snapshot freezes the result at battle
start, and the battle unit carries it through `setHeight` / `setWeight`.

The raid boss gets a snapshot of its own — perfect (31) IVs, zero effort values,
no held items, level `RAID_BOSS_LEVEL`, with nature and ability derived from the
raid's `traitValue` and an empty `caught` id. Its abilities are `Boss` plus the
rolled one, and a shadow boss carries `Shadow` between them. It fights alone
under `BOSS_ALLIANCE`; every player team shares `PLAYER_ALLIANCE`.

## `battles/{battleId}`

| Field       | Type            | Notes                                        |
| ----------- | --------------- | -------------------------------------------- |
| `teams`     | `string[]`      | `teamSnapshots/{snapshotId}` ids, boss first |
| `players`   | `string[]`      | Every uid that fielded a team                |
| `raid`      | `string`        | The raid it was fought for; empty for PvP    |
| `species`   | `Species`       | What was fought, so a listing can name it    |
| `outcome`   | `BattleOutcome` | Unfinished (0), Won (1), Lost (2)            |
| `startedAt` | `number`        | Server-clock milliseconds                    |

The document id doubles as the battle's RNG seed, so every participant and
spectator replays the same rolls from the same frozen teams.

`finishBattle` stamps the outcome once the fight settles; every participant
computes the same one, since the fight is deterministic. The profile's battle
history queries `where('players', 'array-contains', uid)` and drops anything
still `Unfinished` — an abandoned fight is not a result. Replaying a history
entry rebuilds the battle from that seed and those snapshots, so it plays out
identically and awards nothing.

## `battleConsumptions/{battleId}:{uid}`

| Field    | Type     | Notes                  |
| -------- | -------- | ---------------------- |
| `player` | `string` | The uid billed         |
| `battle` | `string` | The battle it paid for |

An item a unit spends in battle is spent for good: a berry eaten in a raid comes
off the catch record when the fight ends, the way it does in the mainline games.
Every removal during the battle is remembered on the unit (`Unit.consumed`), and
`consumeHeldItems(battleId, consumed)` reports what the player's **own** party
lost — the outcome is stamped once by whoever sees the fight settle, but the
items come off per player, since nobody else's catches are theirs to empty.

The server checks the report against the team snapshots it froze itself: an item
that was not fielded by that catch cannot be stripped, and a catch that has
changed hands since is left alone. The marker above bills each player once per
battle, so a repeated report takes nothing further. It applies whichever way the
fight went — a berry eaten against a boss that survived is still eaten — and a
replay reports nothing at all.

The bill is settled **before** the outcome is stamped: the catches are
[locked](catches.md#catches-are-locked-while-they-fight) while the battle is
live, and stamping the outcome is what frees
them, so reporting afterwards would leave a window in which a berry could be
pulled back into the bag and kept.

## `rocketStops/{stopId}:{uid}`

A **Team Rocket Stop** is a landmark that stands a grunt on a cell for the raid
hour. Unlike a raid it is not a lobby: the grunt fights each passer-by on their
own, so the state is **per player** and one player's victory closes nothing for
anybody else.

The stop id is `{chunkSeed}{zone}@{raidTimestamp}$rocket{cell}` and the document
appends the uid.

| Field       | Type              | Notes                                                     |
| ----------- | ----------------- | --------------------------------------------------------- |
| `player`    | `string`          | The uid this state belongs to                             |
| `party`     | `RocketPokemon[]` | `{ species, individualValue, traitValue }`, weakest first |
| `battle`    | `string \| null`  | The fight under way, or the last one fought               |
| `timestamp` | `number`          | The local raid hour                                       |
| `offset`    | `number`          | Minutes east of UTC                                       |
| `chunk`     | `{ seed, x, y }`  | Where the stop stands                                     |
| `cell`      | `number`          | The landmark cell                                         |
| `defeated`  | `boolean`         | Set when the grunt goes down                              |

`enterRocketStop` rolls the party from the chunk itself — one from the biome's
**base**, **uncommon** and **rare** bands for the hour, each with its own
individual and trait values, and a band the hour leaves empty borrows from the
commonest one that is not. The record is written on first approach.

`startRocketBattle` freezes the player's party exactly as `startRaid` does —
same snapshot, same lock, same refusal of a pokemon already fighting or waiting
in a lobby — freezes the grunt's three beside it at `ROCKET_PARTY_LEVEL` (50),
all shadowed, and writes a battle whose `raid` is empty. It is an ordinary
trainer battle: `BattleModes.PvP`, and **no side is flagged as a boss**, so a
mutual knockout is a draw rather than a win.

The party is stored rather than re-derived because Firestore holds no array of
arrays, and because a party frozen at the fight should stay what it was.

The prize is recorded as **`EncounterType.Rocket`**: a grunt is fought alone,
pays a fixed low-level commoner and hands over a shadow, so a catch record that
called it a raid prize would be saying the wrong thing about where it came from.
See [Encounter kinds](encounters.md#encounter-kinds).

Losing changes nothing: the grunt is still standing, and the stop can be fought
again until the hour turns over. Winning is what closes it —
`claimRocketReward` pays `ROCKET_STOP_GOLD` (500) and stages one of the grunt's
two **commoner** species as an encounter (the rare one is never handed over),
shadowed, at a fixed `ROCKET_REWARD_LEVEL` (10) — so the same grunt is worth the
same to everyone who put them down, and what is handed over is a commoner taken
off a thief rather than anything like the level-50 party it came from. The `defeated` flag is
both the record of the win and the marker guarding it: it is set inside a
transaction, and only the call that sets it pays.

## `raidRewards/{raidId}:{uid}`

| Field    | Type     | Notes                   |
| -------- | -------- | ----------------------- |
| `player` | `string` | Claiming uid            |
| `raid`   | `string` | The raid collected from |
| `gold`   | `number` | The purse it paid       |

`claimRaidReward(raidId)` hands over what a cleared raid owes: the legendary,
and a purse of gold — `LEGENDARY_RAID_GOLD` (2000), or `SHADOW_RAID_GOLD`
(1000) for the commoner of the two. Every fighter is paid the same; the boss
decides the amount, not who landed the last hit. It refuses unless the battle
was **won** and the uid appears in `battles/{battleId}.players`, and the marker
above guards both halves, so neither the gold nor the pokemon is collected
twice. The reward waits rather than expiring: a player who ran from the
encounter or left the battle early claims it later from their battle history.

The encounter itself is not stored as a reward — `deriveRaidReward` rolls a
spawn tuple from the raid id and the player's uid, and the encounter is derived
against the **raid's own** chunk and window (not wherever the player is
standing), so a late claim meets exactly what the raid staged. It lands through
the usual `encounters/{spawnId}:{uid}` path with `EncounterType.Raid`.

A raid already under way cannot be joined: `joinRaid` refuses once `battle` is
set, and a player who walks onto the landmark then is sent into the battle as a
**replay** — they watch the same deterministic fight, settle nothing, and are
owed nothing.
