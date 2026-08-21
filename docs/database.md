# The database

Every table the game writes to today: the row it holds, the key that addresses
it, and the access it needs. The game runs on **Supabase**, which is Postgres
with authentication, row-level security and a realtime stream over it.

Reads go through the Supabase **client** from `src/auth/*`, under the policies in
[Security](database/security.md). Everything that creates or moves value is
written by `src/server/*` over a **direct Postgres connection as the table
owner**, which row-level security does not bind. The policies therefore describe
one thing only: what a signed-in browser may do on its own.

What the game does with all of it, how a world is derived, what a thrown ball is
worth, how a fight resolves, is in the [Player's guide](mechanics.md), and how
the battle engine runs is in [The battle engine](engine.md). These pages are the
storage side of the same thing.

The schema itself lives in [`supabase/migrations/`](../supabase/migrations),
applied in filename order. `pnpm db` starts a local stack and `pnpm db:reset`
rebuilds it from the migrations.

## The tables

| Page                                             | What it covers                                                                                             |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| [Player-owned tables](database/player-stores.md) | `profiles` (buddy included), `bag_items`, `bag_candies`, `pokedex_entries`, `positions`, `fled_encounters` |
| [Catch records](database/catches.md)             | `caught` and its children, the battle lock, and eggs waiting to be walked                                  |
| [Shared overworld tables](database/overworld.md) | `snapshots`, `snapshot_spawns`, `encounters`, and the landmark claim markers                               |
| [Raids and battles](database/raids.md)           | `raids`, `teams`, `team_snapshots`, `battles`, `rocket_stops`, `raid_rewards`                              |
| [Auctions](database/auctions.md)                 | `auctions`, `auction_sellers`, `bids`, and the escrow a lot sits in                                        |
| [Mystery gifts](database/gifts.md)               | `gifts`, `gift_claims`: what is waiting on a shelf, and who has taken it                                   |
| [Friends](database/friends.md)                   | `friends`, `friend_requests`, `blocks`                                                                     |
| [Encounter kinds](database/encounters.md)        | `EncounterType`: what each way of meeting a pokemon is recorded as                                         |
| [Time](database/time.md)                         | The server clock, and the player-local zone everything is read in                                          |
| [Security](database/security.md)                 | Privileged writes, the policies, the grants, and the indexes the queries need                              |

## How to read these

Four ideas run through all of it, and are worth having in hand first:

- **The server owns anything that creates or moves value.** A catch, a purse, an
  item stack, a raid's outcome: the client asks, `src/server/*` decides. See
  [Privileged writes](database/security.md#privileged-writes).
- **The world is derived, not stored.** Landmarks, spawn rolls, cache rewards and
  raid bosses come out of a seed and a window rather than a row, so two players
  compute the same world without exchanging it. See
  [Derived, never stored](database/overworld.md#derived-never-stored).
- **Instants are the server's, calendars are the player's.** The clock is central
  so a device cannot move time. The zone it is read in is the player's own, and
  it scopes the world they walk. See [Time](database/time.md).
- **The database enforces what the server merely intends.** Foreign keys,
  checks and write-once triggers mean a claim marker, a frozen replay or a
  settled battle cannot be rewritten even by a mistake on the server.
