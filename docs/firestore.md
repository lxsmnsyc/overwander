# Firestore

Every store the game writes to today: the document shape it holds, the id scheme
that addresses it, and the access it needs. Reads go through the Firebase
**client** SDK from `src/auth/*`. Everything that creates or moves value is
written by the **Admin** SDK from `src/server/*`, behind a verified caller. The
rules must hold against a signed-in player writing directly, which is why most
collections are read-only to clients.

What the game _does_ with all of it — how a world is derived, what a thrown ball
is worth, how a fight resolves — is in the [Player's guide](mechanics.md), and
how the battle engine runs is in [The battle engine](engine.md). These pages are
the storage side of the same thing.

[`firestore.rules`](../firestore.rules) at the repository root is the deployed
ruleset, and [Security](firestore/security.md) explains it. Deploy it before the
game is exposed to real players.

## The stores

| Page                                              | What it covers                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| [Player-owned stores](firestore/player-stores.md) | `profiles` (buddy included), `bags`, `pokedex`, `positions`, `fled`        |
| [Catch records](firestore/catches.md)             | `caught`, the battle lock, and eggs waiting to be walked                   |
| [Shared overworld stores](firestore/overworld.md) | `snapshots` (spawns included), `encounters`, the landmark claim markers    |
| [Raids and battles](firestore/raids.md)           | `raids`, `teams`, `teamSnapshots`, `battles`, `rocketStops`, `raidRewards` |
| [Auctions](firestore/auctions.md)                 | `auctions`, `auctionSellers`, and the escrow a lot sits in                 |
| [Mystery gifts](firestore/gifts.md)               | `gifts`: what the game is holding for a player until they claim it         |
| [Encounter kinds](firestore/encounters.md)        | `EncounterType`: what each way of meeting a pokemon is recorded as         |
| [Time](firestore/time.md)                         | The server clock, and the player-local zone everything is read in          |
| [Security](firestore/security.md)                 | Privileged writes, the rules to deploy, and the indexes they need          |

## How to read these

Three ideas run through all of it, and are worth having in hand first:

- **The server owns anything that creates or moves value.** A catch, a purse, an
  item stack, a raid's outcome — the client asks, `src/server/*` decides. See
  [Privileged writes](firestore/security.md#privileged-writes).
- **The world is derived, not stored.** Landmarks, spawn rolls, cache rewards
  and raid bosses come out of a seed and a window rather than a document, so two
  players compute the same world without exchanging it. See
  [Derived, never stored](firestore/overworld.md#derived-never-stored).
- **Instants are the server's, calendars are the player's.** The clock is central
  so a device cannot move time. The _zone_ it is read in is the player's own, and
  it scopes the world they walk. See [Time](firestore/time.md).
