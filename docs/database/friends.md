# Friends

A player can ask another player to be their friend. The other answers, and until
they do the request stands where both of them can see it: the asker under
"Friend requests" as something they can take back, the asked as something to
accept or decline.

A player can also **block** somebody, which undoes the friendship, drops both
requests, and stops either of them asking the other again. A block is one-sided
to read: nothing tells the blocked player, which is the whole point of one.

The three tables are **read by the player they are about and written by
nobody**. Each policy matches on the column naming that player, the way `bids`
does, and all three are published to realtime, so the lists follow the database
live and a request that arrives while the panel is open appears in it. Every write goes through
[`src/server/friends.ts`](../../src/server/friends.ts): a client that could write
a friendship could put itself on somebody else's list, and one that could delete
a block could lift somebody else's.

A row holds uids and a date and nothing else. What a trainer is **called** is read
from their profile, live, so a rename cannot leave a friends list showing what
they used to be.

## What is stored

`friends`, keyed by `(owner, friend)`

| Column   | Type     | What it is                   |
| -------- | -------- | ---------------------------- |
| `owner`  | `uuid`   | Whose list this row is on    |
| `friend` | `uuid`   | Who is on it                 |
| `since`  | `bigint` | When the friendship was made |

A friendship is written **twice**, once from each side, so that "who are mine" is
a prefix scan of the primary key rather than a search of everybody's. Both rows are written in the same
transaction and both are deleted together: a list holding one half would show a
friend to somebody who is a stranger back.

`friend_requests`, keyed by `(sender, recipient)`

| Column      | Type     | What it is      |
| ----------- | -------- | --------------- |
| `sender`    | `uuid`   | Who asked       |
| `recipient` | `uuid`   | Who was asked   |
| `sent_at`   | `bigint` | When they asked |

One row, pointing one way. The pair is the primary key, so asking twice rewrites
the request that was already standing rather than adding a second. An index on
`recipient` is what answers "who is waiting on me".

`blocks`, keyed by `(blocker, blocked)`

| Column    | Type     | What it is      |
| --------- | -------- | --------------- |
| `blocker` | `uuid`   | Who set it      |
| `blocked` | `uuid`   | Who is shut out |
| `since`   | `bigint` | When it was set |

Read by the blocker alone. Lifting it does not put back the friendship it
undid.

## `trades`

A friend-to-friend swap: the one place a pokemon passes between players without
gold deciding who gets it. Written by
[`src/server/trades.ts`](../../src/server/trades.ts).

| Column                                    | Type                | Notes                                                                   |
| ----------------------------------------- | ------------------- | ----------------------------------------------------------------------- |
| `id`                                      | `text`              | The offer                                                               |
| `proposer`                                | `uuid`              | Who made it                                                             |
| `receiver`                                | `uuid`              | Who was asked; must already be a friend                                 |
| `offered_caught`                          | `text`              | What is on the table, in escrow while it stands                         |
| `asked_caught`                            | `text`              | What was asked for, or null for an open ask                             |
| `given_caught`                            | `text`              | What the receiver actually gave; fills at accept                        |
| `gold`                                    | `bigint`            | Signed: positive rides with the offer, negative asks it of the receiver |
| `status`                                  | `smallint`          | Open (0), Accepted (1), Declined (2), Cancelled (3)                     |
| `created_at`, `resolved_at`, `utc_offset` | `bigint`/`smallint` | When, and in whose zone                                                 |

**The offered catch is escrowed as the offer is written**, its `owner` set to
null the way an auction lot's is, so an offer is something the receiver can trust
until it is answered. Gold riding with the offer is taken then too. The **asked**
catch is never escrowed: it is checked again at accept, since it may have gone
into a lobby or onto the block while the offer sat.

A partial unique index holds one open offer per direction of a pair, so a
proposer cannot bury a friend under offers.

Tier 2: a trade is the two parties' business and nobody else's, and it is
published to realtime so an inbox sees an offer arrive.

`TRADE_GOLD_LIMIT` caps what may ride along at a million either way.

A settled trade appends `Acquisition.Trade` to both records' histories, resets
`friendship`, and sets `traded`, which is what opens a
[trade evolution](catches.md).

## Asking, and answering

`sendFriendRequest` reads three rows in a transaction: the friendship, the
request this player has standing, and the one coming the other way. A request
that **crosses** one already coming back makes the friendship on the spot, since
both sides have now said yes, and clears both directions, so nobody is left holding a
request from somebody who is already a friend.

Declining and cancelling are the same write from opposite ends, which is why
there is one `dropFriendRequest` rather than two calls.

A friendship, a request and a block between the same two players are the same
pair of uids in three tables, so a standing is read back by which table answered
rather than by any id.

A block outranks everything else in that read: it is what the one press left has
to undo, and there is nothing else to offer a trainer who has been shut out.

## Limits

`FRIEND_LIMIT` is 100, checked before a request is sent and again before one is
accepted. Every screen reads the whole of a list, and a list is drawn one profile
at a time.

## Finding somebody

"Add a friend" looks a trainer up by their **friend code**: twelve digits in
three groups, minted the first time its owner opens the dialog and shown there
with a copy button.

A name is not a handle: two players may call themselves the same thing, and a
player who renames themselves is unfindable by the old one. A list of everybody
playing is also a list of everybody to be asked by strangers. A code has to be
given by the person it belongs to, which is the whole check.

The codes live in `friend_codes`, readable only by their owners, and the lookup
is a server call. It answers nothing for a code nobody holds, for a banned
account, for somebody who signed in once and never opened a profile, and for
the reader's own, since nobody befriends themselves.
