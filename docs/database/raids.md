# Raids

Raids run on their own three-hour clock (`RAID_INTERVAL` in
[`src/overworld/chunk-snapshot.ts`](../../src/overworld/chunk-snapshot.ts))
rather than the 5-minute spawn window, so a lobby stands long enough to gather a
party. See [Windows](overworld.md#windows) for how a chunk's clocks line up.

Two landmark kinds stage raids, and both are **lairs**. A lair is a place, not a
pokemon. `Lairs`
([`src/data/overworld/lair.ts`](../../src/data/overworld/lair.ts)) names the
places the mainline games gave these legendaries (Seafoam Islands, Power Plant,
Mt. Ember, Cerulean Cave), maps each to the legendary that lives in it, and
lists which of them a biome can host.

- **Legendary lairs** draw from the **lairs the biome hosts** rather than from
  its spawn pool. The roll picks a place, and the place decides which legendary
  stands in it. A biome with no lair of its own stages none, which is most of
  them.
- **Shadow lairs** draw from the biome's rare band, except one draw in eight
  (`SHADOW_RAID_LEGENDARY_CHANCE`), which takes over one of the biome's own
  lairs instead. Their boss carries the `Shadow` ability alongside `Boss`.

A raid is **named after the place**, by `getLairTitle`.

| Raid                            | Title                    |
| ------------------------------- | ------------------------ |
| A lair                          | `Seafoam Islands`        |
| A shadowed lair                 | `Shadow Seafoam Islands` |
| A shadow raid on a rare species | `Shadow Woodland Lair`   |

A shadow raid on a rare species stands in no named place, so it is named after
the ground it is on. The species is not the title, because two raids on the same
species in one chunk would then carry the same name.

A third kind is not staged by the world. A **mythical raid** is opened by
spending a **raid item**, and it stands on no landmark. `RAID_ITEMS` in
[`src/data/items/raid-items.ts`](../../src/data/items/raid-items.ts) maps each
relic to the species it calls, the Old Sea Map to Mew for instance. Its lobby is
named after the mythical's own lair (`Faraway Island`). Both the lobby and the
catch it pays out record `Biome.Beyond`, since a relic calls a species the world
never places. The world never rolls a mythical of its own (`isMythicalSpecies`
is excluded from every landmark roll), so carrying the relic is the only way to
face one. A raid item is found in the **special** band of the overworld item
pool and nowhere else. It cannot be bought or sold.

`hostMythicalRaid` spends the relic **before** the lobby is written, so a raid
item opens exactly one lobby and is gone whether the boss falls or the party
does. Nothing restages it. The landmark rule that reopens a failed raid has no
lobby to reopen, since the id is
`{chunkSeed}{zone}@{raidTimestamp}$mythical{item}:{uid}` and its record already
exists. Hosting also refuses a player with no pokemon, rather than spending the
relic on a lobby nobody can start.

Once open it is an ordinary lobby: it appears in the window's listing, anyone
may join it, and it is fought, cleared and claimed through the same calls.

A fourth fight is not a raid. A **Team Rocket grunt** stands at a `WanderingNpc`
cell, and it runs on the three-hour `NPC_INTERVAL` rather than a raid window. It
is described under [`rocket_stops`](raid-stops.md#rocket_stops).

## `raids`

Written by `enterRaid` in [`src/auth/raids.ts`](../../src/auth/raids.ts). The id
is `{chunkSeed}@{raidTimestamp}${kind}{cell}`, derived, so every player who
walks onto the landmark in the same window joins the lobby already standing, and
the first to arrive hosts it. The kind tag is `raid` for a legendary raid and
`shadow` for a shadow one, so the two landmark types never collide on a cell.
The read and the create share a transaction, so one landmark stages exactly one
raid per window even when two players walk in together: a player either opens
the lobby or joins the one already there.

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
id on the lobby first, in its own transaction, and only then writes the battle.
A claim whose battle never lands is a designed state: it reads as lost, and the
lobby restages.

A raid is fought with pokemon of one's own, so `canJoinRaids(uid)` gates taking
part: `hasAnyCaught` in [`src/auth/caught.ts`](../../src/auth/caught.ts), a
single one-row read. A player who owns nothing neither opens a lobby nor
restages a failed one, and `joinRaid` refuses their team. They may still watch:
walking in on a running raid opens it as a replay, which settles nothing and
pays nothing.

`listLiveRaids(raidTimestamp, offset)` queries `window_at` and `utc_offset`
together, on the `raids_window` index, and keeps the lobbies that are neither
started nor cleared. That is the Raids tab. Both fields are needed: the window
is local, so two zones can floor to the same one, and what they stage at a
landmark is not the same boss. The lobby id carries the zone for the same
reason.

## Walking up to a lair

Looking at a lair stages nothing. `peekRaid` reads the cell, the stored lobby
and, where one exists, its battle, then answers with what is standing there and
the **one** thing this player may do about it. Nothing is written, so a player
who opens the dialog and thinks better of it leaves no lobby behind.

| `RaidAction` | When                                                     | What the button does                      |
| ------------ | -------------------------------------------------------- | ----------------------------------------- |
| `Host`       | No lobby, or the last party failed, and they own pokemon | `enterRaid` stages it, then the Raids tab |
| `Join`       | A lobby is gathering and they own pokemon                | `enterRaid` adopts it, then the Raids tab |
| `Spectate`   | The battle has started, or they own no pokemon           | Opens the battle, or the lobby, to watch  |

The dialog shows that button and `Close`. It resolves null, and the player is
told the lair is quiet, when the cell stages no raid this window, the raid has
been cleared, or there is nothing standing and the player has nothing to stage
it with.

`peekRaid` decides all of that the same way `enterRaid` does, so the button is
honoured when it is pressed. It can still be beaten to it. A lobby cleared or
started between the look and the press is handled by `enterRaid` itself, which
is the only writer either way, and a `Join` that arrives after the fight started
becomes a spectator seat.

The window allows one defeat of the boss, not one fight:

- **Cleared.** `clearRaid` sets `cleared` when the boss goes down, and the
  landmark shuts: `enterRaid` resolves null for the rest of the window, and the
  next window rolls a new raid at the same cell.
- **Lost.** `enterRaid` reads the lobby's battle in the same transaction. A
  battle recorded as `Lost`, one whose row is gone, or one still `Unfinished`
  more than `RAID_BATTLE_TIMEOUT` (10 minutes) after its `startedAt` counts as
  failed, since an abandoned party is not a beaten boss. The arrival restages
  the lobby in place: same id, same `species` and `traitValue`, a new host, no
  teams and no battle. It reappears in the live listing on its own, since the
  watcher keeps whatever has `battle == null`.
- **Under way.** A battle that is neither won nor timed out is what the arrival
  walks into. `joinRaid` refuses once `battle_id` is set, so a player who walks
  onto the landmark then is sent into the battle as a **replay**: they watch the
  same deterministic fight, settle nothing, and are owed nothing.

Restaging keeps the id, so [`raid_rewards`](raid-stops.md#raid_rewards) still
pays each player once: a claim is checked against the raid's _current_ battle,
which only a winning party appears in.

## `teams` and `team_catches`

| Column       | Type     | Notes                                    |
| ------------ | -------- | ---------------------------------------- |
| `id`         | `text`   | The team                                 |
| `player`     | `uuid`   | Owner                                    |
| `raid_id`    | `text`   | The raid it was brought to               |
| `joined_seq` | `bigint` | Identity column, so the host stays first |

The party itself is `team_catches`, one row per slot: `(team_id, slot,
caught_id)`, up to `TEAM_SIZE` (6), unique on the catch so a pokemon cannot be
entered twice.

A team holds ids, so it follows whatever those catches become, until a battle
freezes them.

Catch ids are readable by any signed-in player, so the server cannot trust a
submitted party. `joinRaid` in
[`src/server/raids/index.ts`](../../src/server/raids/index.ts) rejects one that
repeats a catch or names a catch the player does not own, and nothing but the
server writes `teams`, so there is no way around that check.

Ownership is re-checked where it matters. [Freezing a
team](battle-rows.md#team_snapshots) leaves out any catch whose `owner` no
longer matches the team's player, which covers a catch traded away between
joining the lobby and the host starting the raid, and resolves null when nothing
survives, so `startRaid` drops that team rather than fielding an empty side, and
its player is not listed among the battle's `players`.

**One pokemon, one fight.** A catch cannot be brought to a raid while it is
already committed elsewhere, and that is checked in three places:

- `joinRaid` refuses a party holding a **locked** catch, meaning one in a live
  battle.
- `joinRaid` also refuses one already **queued**. `isAnyCatchQueued` joins
  `team_catches` to the player's own teams, on the `team_catches_caught` index,
  and blocks when any of the party is still listed by a raid that has not
  started. This is why a team names its `raid`: without it, answering would mean
  reading every lobby in the world. Teams of raids that started, were cleared,
  or were left behind do not count.
- Freezing drops a catch that is locked by the time the host starts, so a player
  sitting in two lobbies with the same party has it fielded by whichever raid
  started first and simply left out of the other.

The team picker greys out anything it can see is fighting (`isLockLive`, from
the two lock fields it already has), so the refusal is usually visible before
the join is attempted.

## Searching the lobby

A full lobby is twenty rows, so it carries a search box of its own, with the
same grammar as everything else. `TEAM_VOCABULARY` and `matchesTeam` live in
[`team-search.ts`](../../src/auth/team-search.ts).

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
raid and recipient, whoever sent it first, carrying the `role` they are called
in as (a fighter or a watcher). It goes when the raid does, when the friend
dismisses it, or when they join and it has done its work. Readable by the two
ends alone.

**`raid_watchers`** is who is standing in a lobby without a party: written on
the way in, dropped on the way out, and taken by the cascade when the lobby
goes. A player who owns no pokemon can do nothing else, and the row is what lets
the lobby list them. Tier 1, the way the lobby itself is, since who is watching
a raid is as public as who has joined it.

Both are published to realtime, so an invited list and a crowd both move while
somebody is looking at them.

## See also

- [Battle rows](battle-rows.md), the frozen teams, the battle and its aftermath
- [Stops and rewards](raid-stops.md), the NPC stops and what a cleared raid pays
- [The overworld](overworld.md), the chunk, its landmarks and its windows
