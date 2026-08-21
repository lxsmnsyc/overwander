# Mystery gifts

A gift is something the game, or the staff, decides somebody is owed and then
waits with. It is **offered**, written down whole with the pokemon it holds
already rolled, and **claimed** later from the gifts dialog. Nothing is theirs
until they take it.

An offer is for **one player or for everybody**. A personal one is written under
its player's uid; an open one names nobody, stands on every shelf at once, and is
taken once each. That is why taking one is a row of its own: a single offer has
as many claims as there are players.

`gifts` ([`src/auth/gift-record.ts`](../../src/auth/gift-record.ts))

| Column       | Type     | What it is                                            |
| ------------ | -------- | ----------------------------------------------------- |
| `id`         | `text`   | What the gift calls itself                            |
| `player`     | `uuid`   | Whose it is; null for one anybody may take            |
| `offered_at` | `bigint` | When it was shelved                                   |
| `gift`       | `jsonb`  | What the player sees: `MysteryGift`, below            |
| `encounter`  | `jsonb`  | The rolled meeting, for a catch gift and nothing else |

The offer rides as `jsonb` because it is a write-once union of three shapes, read
whole by the server and never queried by field, the same argument that froze team
snapshots. The two columns beside it are the only things a shelf asks the table:
whose it is, and when it went up.

A personal gift's id is `{gift}:{uid}`, which is what stops a second one being
opened for the same player; an open gift's id is its own. Either way
the id is what the gift calls itself, and what a claim names.

`gift` is one of three shapes, each carrying an `id`, a `reason` sentence shown
on its card, and an `expiresAt` after which it is neither listed nor claimable:

| Kind        | Id  | Extra fields                                      |
| ----------- | --- | ------------------------------------------------- |
| `Catch`     | 0   | the pokemon fields below, plus `ball` and `owner` |
| `Item`      | 1   | `item`, `amount`                                  |
| `Encounter` | 2   | the pokemon fields below                          |

The pokemon fields are `species`, `level`, `shiny`, `shadow`, `individualValue`,
`traitValue`, `gender`, `nature`, `ivs`, `abilities`, `moves`, `items`, the
`place` it says it happened (a name, since a fateful meeting is at no coordinate
anybody walked to) and the `slots` of room it walks in with.
`abilities` and `moves` are whole lists rather than one each: a gift may be
written with as many of either as it has room for, and a shadowed one keeps the
`Shadow` ability on top of them.

Everything beyond the species and the level is optional: a null field, or an
empty list, is whatever the roll produced. What is set is written over the roll
rather than searched for, since an ability or a nature that had to be rolled
until it came up would be a search with no end. **Shininess is set the same way**: a coat
is otherwise the observer's id against the trait value, and a gift is the one
pokemon whose coat was decided by whoever wrote it.

A **`Catch`** is handed over finished, in the `ball` the gift names, and `owner`
is a trainer's _name_, "Red", written as the first entry of the record's
ownership history. There is no such account, so `caught_history` keeps it in
`owner_name` with no uid beside it, and the sheet reads the name off the entry
instead of looking up a profile. A trigger holds the rule that an entry must name
one or the other.

An **`Encounter`** is not handed over at all. Claiming it stages the meeting in
`encounters` under the gift's id and the player throws their own ball at it,
which is why it names none: a `Fateful` meeting never flees and never breaks out, so what
the record ends up saying is whichever ball they threw.

`gift_claims`, keyed by the gift and the player

| Column       | Type     | What it is                                     |
| ------------ | -------- | ---------------------------------------------- |
| `gift_id`    | `text`   | Which offer was taken                          |
| `player`     | `uuid`   | Who took it                                    |
| `claimed_at` | `bigint` | When                                           |
| `catch_id`   | `text`   | The record a pokemon landed in; null for items |

A trigger allows exactly one update: backfilling `catch_id` once, inside the
hand-over transaction. Nothing else about a claim may move.

## The gift encounter

A catch gift stores the whole `EncounterRecord` it will become
([Encounter kinds](encounters.md)) rather than a seed to re-roll on the way out,
and that one rolled meeting is what **every** taker receives. Two people taking
one open gift get the same individual, which is what a distribution is.

The rolls are drawn against one fixed chunk and the world's own window rather
than against wherever the taker is standing: an offer that took its place from
whoever opened it would be a different meeting for every player who took it.
Where it says it happened is the gift's `place`, "Pallet Town", which the record
keeps in `origin_place` and the sheet reads back.

The `place` and the `slots` travel on the meeting itself rather than beside it,
so a gift caught out of an `Encounter` keeps both: the record is written by the
ordinary catch, which knows nothing about gifts.

A `Catch` is written through `writeCaughtRecord` with `Acquisition.Gift` when it
is claimed; an `Encounter` is staged and written the ordinary way, by being
caught.

## Offered once, taken once each

Offering reads and writes the whole giving in one transaction, so two tabs
signing in together cannot both find nothing there. Claiming writes the claim row
**before** anything is handed over, so a second press or a second tab finds it
already taken rather than being paid twice.

Both tables are **closed to clients**: row-level security is on and no policy is
written, so a browser reading them gets nothing back. Shelves and claims travel
through the server.

Offers and claims are both kept rather than deleted: what has been given out, and
to whom, stays readable.

## What is given today

Four open offers, standing on every shelf:

- `starter-{species}`: Bulbasaur, Charmander and Squirtle, each at level 5.
- `starterBalls`: 20 Poke Balls.

They are written the first time anybody asks for their shelf, all four in one
transaction, and every later ask reads what is already there. Each is taken once
per player, so a first partner is a choice rather than a die the game throws, and
nothing stops somebody taking all three.

See [`src/server/gifts.ts`](../../src/server/gifts.ts).
