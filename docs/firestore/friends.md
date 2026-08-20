# Friends

A player can ask another player to be their friend. The other answers, and until
they do the request stands where both of them can see it — the asker under
"Friend requests" as something they can take back, the asked as something to
accept or decline.

A player can also **block** somebody, which undoes the friendship, drops both
requests, and stops either of them asking the other again. A block is one-sided
to read: nothing tells the blocked player, which is the whole point of one.

The three collections are **read by the player they are about and written by
nobody**. The rules hand over rows filtered on the field naming that player — the
way `bids` does — so the lists follow the store live and a request that arrives
while the panel is open appears in it. Every write goes through
[`src/server/friends.ts`](../../src/server/friends.ts): a client that could write
a friendship could put itself on somebody else's list, and one that could delete
a block could lift somebody else's.

A row holds uids and a date and nothing else. What a trainer is **called** is read
from their profile, live, so a rename cannot leave a friends list showing what
they used to be.

## What is stored

`friends/{owner}:{friend}`

| Field    | Type     | What it is                   |
| -------- | -------- | ---------------------------- |
| `owner`  | `string` | Whose list this row is on    |
| `friend` | `string` | Who is on it                 |
| `since`  | `number` | When the friendship was made |

A friendship is written **twice**, once from each side, so that "who are mine" is
one query rather than a scan of everybody's. Both rows are written in the same
transaction and both are deleted together: a list holding one half would show a
friend to somebody who is a stranger back.

`friendRequests/{from}:{to}`

| Field    | Type     | What it is      |
| -------- | -------- | --------------- |
| `from`   | `string` | Who asked       |
| `to`     | `string` | Who was asked   |
| `sentAt` | `number` | When they asked |

One row, pointing one way. The id is made of the two uids, so asking twice
rewrites the request that was already standing rather than adding a second.

`blocks/{blocker}:{blocked}`

| Field     | Type     | What it is      |
| --------- | -------- | --------------- |
| `blocker` | `string` | Who set it      |
| `blocked` | `string` | Who is shut out |
| `since`   | `number` | When it was set |

Read by the blocker alone. Lifting it does not put back the friendship it
undid.

## Asking, and answering

`sendFriendRequest` reads three documents in a transaction: the friendship, the
request this player has standing, and the one coming the other way. A request
that **crosses** one already coming back makes the friendship on the spot — both
sides have now said yes — and clears both directions, so nobody is left holding a
request from somebody who is already a friend.

Declining and cancelling are the same write from opposite ends, which is why
there is one `dropFriendRequest` rather than two calls.

A friendship, a request and a block between the same two players share an id —
they differ only by collection — so a standing is read back **by position** in the
`getAll` rather than by document id.

A block outranks everything else in that read: it is what the one press left has
to undo, and there is nothing else to offer a trainer who has been shut out.

## Limits

`FRIEND_LIMIT` is 100, checked before a request is sent and again before one is
accepted. Every screen reads the whole of a list, and the reads are paid per
friend.

## Finding somebody

"Add a friend" looks a trainer up by the **address they signed up with**, exactly.

A name is not a handle: two players may call themselves the same thing, and a
player who renames themselves is unfindable by the old one. A list of everybody
playing is also a list of everybody to be asked by strangers. An address has to
be given by the person it belongs to, which is the whole check.

The addresses live in Firebase Auth, which a browser cannot query and which
cannot match part of one anyway, so the lookup is a server call. It answers
nothing for an address nobody plays under, for a banned account, for somebody who
signed in once and never opened a profile, and for the reader's own — nobody
befriends themselves.
