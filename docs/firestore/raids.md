# Raids and battles

Raids run on their own three-hour clock (`RAID_INTERVAL` in
[`src/overworld/chunk-snapshot.ts`](../../src/overworld/chunk-snapshot.ts)) rather
than the 5-minute spawn window, so a lobby stands long enough to gather a party.
See [Windows](overworld.md#windows) for how a chunk's clocks line up.
There are two landmark kinds, and both are **lairs**: a place rather than a
pokemon. `Lairs` ([`src/data/overworld/lair.ts`](../../src/data/overworld/lair.ts))
names the ones the mainline games gave these legendaries — Seafoam Islands,
Power Plant, Mt. Ember, Cerulean Cave — maps each to the one legendary at home
in it, and lists which of them a biome can host. A player who has met Articuno
before knows what a Seafoam Islands lair is without being told.

- **Legendary lairs** draw from the **lairs the biome hosts**, not from its
  spawn pool: the place is the roll, and the place decides who is in it. A biome
  with no lair to its name stages none, which is most of them.
- **Shadow lairs** draw from the biome's rare band, except one draw in eight
  (`SHADOW_RAID_LEGENDARY_CHANCE`) which takes over one of the biome's own lairs
  instead. Their boss carries the `Shadow` ability alongside `Boss`.

A raid is **named after the place**, by `getLairTitle`: a lair is called after
itself (`Seafoam Islands`), a shadowed one is that name with a word in front of
it (`Shadow Seafoam Islands`), and a shadow raid that reached for a rare species
stands in no named place at all, so it is called after the ground it is on
(`Shadow Woodland Lair`). The species is no longer the title — two Articuno
raids in one chunk were two of the same word for different things.

A third kind is not staged by the world at all. A **mythical raid** is opened by
spending a **raid item**, and stands on no landmark:

- **Mythical raids** are called out by a relic — `RAID_ITEMS` in
  [`src/data/items/raid-items.ts`](../../src/data/items/raid-items.ts) maps each to
  the species it calls, e.g. the Old Sea Map to Mew. Its lobby is named after
  the mythical's own lair — `Faraway Island` — and both the lobby and the catch
  it pays out record `Biome.Beyond`, since a relic calls something out of a
  place the world does not contain. The world never rolls a
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

Once open it is an ordinary lobby: it appears in the window's listing, anyone
may join it, and it is fought, cleared and claimed through the same calls.

A fourth landmark runs on a clock of its own length (`ROCKET_INTERVAL`, also
three hours) without being a raid at all: the **Team Rocket Stop**, a solo
trainer fight described under
[`rocketStops`](#rocketstopsstopiduid) below.

## `raids/{chunkSeed}@{raidTimestamp}${kind}{cell}`

Written by `enterRaid` in [`src/auth/raids.ts`](../../src/auth/raids.ts). The id is
derived, so every player who walks onto the landmark in the same window joins the
lobby that is already standing; the first to arrive hosts it. The kind tag is
`raid` for a legendary raid and `shadow` for a shadow one, so the two landmark
types never collide on a cell. The read and the create share a transaction, so
one landmark stages exactly one raid per window even when two players walk in
together — a player either opens the lobby or joins the one already there.

| Field        | Type             | Notes                                                       |
| ------------ | ---------------- | ----------------------------------------------------------- |
| `kind`       | `RaidKind`       | Legendary (0) or Shadow (1)                                 |
| `species`    | `Species`        | What is being staged                                        |
| `lair`       | `Lairs \| null`  | The place it stands in; null for a shadow on a rare species |
| `biome`      | `Biome`          | What a lairless shadow raid is named after                  |
| `traitValue` | `number`         | 32-bit roll the boss' nature and ability derive from        |
| `host`       | `string`         | Only this uid may start the raid                            |
| `teams`      | `string[]`       | `teams/{teamId}` ids, appended via `arrayUnion`             |
| `battle`     | `string \| null` | The battle the host started, null while gathering           |
| `timestamp`  | `number`         | The **local** raid window, for listing the live lobbies     |
| `offset`     | `number`         | Minutes east of UTC the window was read in                  |
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
cleared; that is the Raids tab. Both are needed: the window is local, so two zones
can floor to the same one, and what they stage at a landmark is not the same
boss. The lobby id carries the zone for the same reason.

## Walking up to a lair

Looking at a lair stages nothing. `peekRaid` reads the cell, the stored lobby
and — where one exists — its battle, and answers with what is standing there and
the **one** thing this player may do about it. Nothing is written, so a player
who opens the dialog and thinks better of it leaves no lobby behind them; before
this, looking *was* hosting.

| `RaidAction` | When                                                      | What the button does                      |
| ------------ | --------------------------------------------------------- | ----------------------------------------- |
| `Host`       | No lobby, or the last party failed — and they own pokemon | `enterRaid` stages it, then the Raids tab |
| `Join`       | A lobby is gathering and they own pokemon                 | `enterRaid` adopts it, then the Raids tab |
| `Spectate`   | The battle has started, or they own no pokemon            | Opens the battle, or the lobby, to watch  |

The dialog shows that button and `Close`, rather than three of which two would be
refused. It resolves null — and the player is told the lair is quiet — when the
cell stages no raid this window, the raid has been cleared, or there is nothing
standing and the player has nothing to stage it with.

`peekRaid` decides all of that the same way `enterRaid` does, so the button is
honoured when it is pressed. It can still be beaten to it: a lobby cleared or
started between the look and the press is handled by `enterRaid` itself, which
is the only writer either way — a `Join` that arrives after the fight started
becomes a seat.

The window gives the boss one defeat, not one fight:

- **Cleared.** `clearRaid` sets `cleared` when the boss goes down, and the
  landmark shuts: `enterRaid` resolves null for the rest of the window, and the
  next window rolls a new raid at the same cell.
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

Its move list is filtered through `BANNED_BOSS_MOVES`
([`src/battle/abilities/special.ts`](../../src/battle/abilities/special.ts)).
**Transform** is on it because a boss that copies a player stops being a boss:
the copy takes the opponent's stats and throws away the raid-sized health pool
the fight is built around. **Metronome**, **Mirror Move** and **Mimic** are on it
because each is a way back to the first — one calls anything registered, one
casts back whatever the target last used, and one takes a copy of it — so
banning them is simpler than teaching three different copies what a boss may not
become.

The ban is applied before the four moves are taken, so a boss barred from one
still comes with a full set.

Some species are not staged as bosses at all. `canStageBoss` keeps them out of
both the legendary and the shadow draw, on two rules: it is not in
`BANNED_BOSS_SPECIES`, and it has something left to cast once the banned moves
are taken off it. **Ditto** is the whole of the first list — what it does is
become something else, and a boss is the one thing that must not — and the
second rule is a rule rather than a list, so a later move ban cannot quietly
strand a species with an empty kit.

What the `Boss` ability itself does to damage is worth stating plainly. Only a
**hit** takes health off a boss: health-scaling damage never lands, and neither
does anything indirect — poison, a burn, a seed, the weather, the crash off a
missed Jump Kick. Two things still get through on purpose. A **cost**
(`DamageFlags.Cost`) is paid whatever the payer is, so a boss that explodes still
dies by it and one that puts up a Substitute still pays for it; and a negative
amount is a heal, so drains reach it as they would anything else.

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

## `battleAftermaths/{battleId}:{uid}`

| Field    | Type     | Notes                     |
| -------- | -------- | ------------------------- |
| `player` | `string` | The uid settled           |
| `battle` | `string` | The battle it settled for |

A battle costs a party three things, and all three stick: the items it spent,
the health it lost and the statuses it walked out with. A berry eaten in a raid
comes off the catch record the way it does in the mainline games, and a pokemon
that finished the fight on two hit points starts the next one there — see
[Health and status](catches.md#health-and-status).

They are reported together because they are one fight: a Sitrus Berry gone and
the health it restored describe the same moment. Every removal during the battle
is remembered on the unit (`Unit.consumed`), the health and the carried status
are read off it at the end, and `recordAftermath(battleId, aftermath)` reports
the player's **own** party — the outcome is stamped once by whoever sees the
fight settle, but the aftermath lands per player, since nobody else's catches
are theirs to write.

Every one of the player's units is reported, not only the ones that spent
something: health is owed either way.

What the server can check, it checks against the team snapshots it froze itself:
an item that was not fielded by that catch cannot be stripped, a catch that has
changed hands since is left alone, health is clamped to what the record can
actually hold, and the statuses are kept to the ones a pokemon carries out of a
fight, one of each. What it cannot check is the number itself — nothing replays a live
battle — so health is trusted exactly as far as the outcome is. The marker above
settles each player once per battle, so a repeated report changes nothing
further. It applies whichever way the fight went — a berry eaten against a boss
that survived is still eaten — and a replay reports nothing at all.

The aftermath is written **before** the outcome is stamped: the catches are
[locked](catches.md#catches-are-locked-while-they-fight) while the battle is
live, and stamping the outcome is what frees
them, so reporting afterwards would leave a window in which a berry could be
pulled back into the bag and kept.

## `rocketStops/{stopId}:{uid}`

A **Team Rocket Stop** is a landmark that stands a grunt on a cell for
`ROCKET_INTERVAL` (3 hours). Unlike a raid it is not a lobby: the grunt fights each passer-by on their
own, so the state is **per player** and one player's victory closes nothing for
anybody else.

The stop id is `{chunkSeed}{zone}@{rocketTimestamp}$rocket{cell}` and the document
appends the uid.

| Field       | Type              | Notes                                                     |
| ----------- | ----------------- | --------------------------------------------------------- |
| `player`    | `string`          | The uid this state belongs to                             |
| `party`     | `RocketPokemon[]` | `{ species, individualValue, traitValue }`, weakest first |
| `battle`    | `string \| null`  | The fight under way, or the last one fought               |
| `timestamp` | `number`          | The local rocket window                                   |
| `offset`    | `number`          | Minutes east of UTC                                       |
| `chunk`     | `{ seed, x, y }`  | Where the stop stands                                     |
| `cell`      | `number`          | The landmark cell                                         |
| `defeated`  | `boolean`         | Set when the grunt goes down                              |

`enterRocketStop` rolls the party from the chunk itself — one from the biome's
**base**, **uncommon** and **rare** bands for the window, each with its own
individual and trait values, and a band the window leaves empty borrows from the
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
again until the window turns over. Winning is what closes it —
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
