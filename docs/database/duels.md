# Battle lobbies

A duel is staged rather than found. Nothing in the world opens one, so it lives
on invitations alone and is readable only by the people standing in it. That
privacy is the whole of what separates it from a raid lobby, which stands open in
the world for anybody to walk into.

Written by [`src/server/duels.ts`](../../src/server/duels.ts), read through
[`src/auth/duel-record.ts`](../../src/auth/duel-record.ts).

## `duels`

| Column       | Type     | Notes                                     |
| ------------ | -------- | ----------------------------------------- |
| `id`         | `text`   | The lobby                                 |
| `host`       | `uuid`   | Who opened it; only they may start        |
| `battle_id`  | `text`   | The fight it became, null while gathering |
| `created_at` | `bigint` | When it opened                            |

Like a raid's, `battle_id` carries no foreign key: the id is claimed on the lobby
first and the battle written after.

## `duel_members`

Everyone standing in the lobby, keyed by `(duel_id, player)`.

| Column       | Type       | Notes                                      |
| ------------ | ---------- | ------------------------------------------ |
| `role`       | `smallint` | `LobbyRole`: Fighter (0) or Spectator (1)  |
| `ready`      | `boolean`  | A fighter saying this party is the one     |
| `joined_seq` | `bigint`   | Identity column, so arrival order survives |

At most **two** members fight (`DUEL_FIGHTERS`); the rest watch, the host
included when they staged the fight for other people. The host may start only
once both fighters are ready, which is what a duel has and a raid does not:
there are two of them, and both chose to be there.

## `duel_catches`

The party a fighter has assembled, one row per slot, up to `TEAM_SIZE` (6), and
unique on the catch so a pokemon cannot be entered twice. It cascades from the
member row, so leaving takes the party with it.

Changing a party takes back that fighter's `ready`. The foreign key on
`caught_id` **cascades on delete**: a pokemon released while it was waiting in a
lobby takes its place in that party with it rather than the release being
refused.

## `duel_invites`

One call per lobby and player, keyed by `(duel_id, recipient)`, carrying the
`role` they are called in as. A recipient may decline, which drops the row.

## `in_duel(target, who)`

Whether somebody has any business seeing a lobby: they are in it, or they have
been called into it.

It is a `security definer` function rather than a subquery written into the
policies, because a policy on `duel_members` that reads `duel_members` is
recursion, which Postgres refuses outright. Running as the owner is what steps
outside the policy that is being evaluated.

## Access

Every table here is tier 2: readable only by the people in the lobby, through
`in_duel`, and written by nobody but the server. All four are published to
realtime with `replica identity full`, because everything in a lobby moves while
somebody is looking at it: a second player arriving, a party assembled, a ready
taken back, the host's start.

## The fight

`startDuel` freezes both parties into `team_snapshots` the way `startRaid` does
and writes an ordinary `battles` row with a **player on each side**. That is what
keeps a duel out of every settlement: `recordAftermath` refuses any battle with
two players in it, except a gym seat's challenger. A duel therefore costs
nothing and pays nothing, and neither party carries the fight out with it.

It runs under `PVP_BATTLE_LIMITS`, and neither side is a boss, so a mutual
knockout is a draw.

## See also

- [Raids and battles](raids.md): lobbies the world stages, and `raid_watchers`
- [Battle lobbies](../mechanics/duels.md): the same thing for players
