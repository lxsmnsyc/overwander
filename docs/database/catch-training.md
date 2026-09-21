# Training and friendship

What a player puts into a catch, and the packed integers and boolean marks the
row stores it in.

## Effort and friendship

Effort is not earned from what a pokemon happened to fight. Every level pays
`EFFORT_PER_LEVEL` (5) points into a pool the player spends where they like, so
a freshly caught level 20 pokemon arrives with 100 points nobody has assigned.
The arithmetic is in [`src/auth/effort.ts`](../../src/auth/effort.ts), and both
sides read it: the catch sheet to say what is possible, the server to decide it
again against the stored record.

| Quantity | How it is worked out                        |
| -------- | ------------------------------------------- |
| budget   | `level * EFFORT_PER_LEVEL + effortBonus`    |
| spent    | The six `effortValues` added up             |
| unused   | `budget - spent`, never below zero          |
| per stat | Never more than `MAX_EFFORT_PER_STAT` (252) |

Three server calls in [`src/server/training.ts`](../../src/server/training.ts)
move it, each in one transaction:

- **`trainEffort`** spends unused points into a stat, or takes them back out
  with a negative amount. Nothing is consumed, since the points came with the
  levels.
- **`useWing`** spends a wing for `WING_EFFORT` (3) points in the wing's own
  stat and raises `effortBonus` by the same, so a wing grants training rather
  than spending the pool. That is what makes one worth as much at level 100 as
  at level 5.
- **`feedEffortBerry`** spends a bitter berry to take `BERRY_EFFORT_DROP` (10)
  points off one stat. They return to the pool rather than being lost, and the
  pokemon gains friendship for it.

Every one of them rescales `health` the way a bottle cap does: a bigger pool
keeps the share the pokemon was carrying.

Friendship follows the mainline's Gen 4 rules, tiered so that every gain shrinks
as the number grows
([`src/data/constants/friendship.ts`](../../src/data/constants/friendship.ts)):

| What happened    | Where it is written                   | 0-99 | 100-199 | 200-255 |
| ---------------- | ------------------------------------- | ---- | ------- | ------- |
| Level taken      | `useCandy`                            | +5   | +3      | +2      |
| 256 steps walked | `recordSteps`, for a hatched buddy    | +2   | +2      | +1      |
| Bitter berry fed | `feedEffortBerry`                     | +10  | +5      | +2      |
| Herbal medicine  | `useHealingItem`, per mouthful        | -5   | -5      | -10     |
| Knocked out      | `recordAftermath`, when health hits 0 | -1   | -1      | -1      |

A catch starts at `BASE_FRIENDSHIP` (70). Something hatched starts at
`HATCHED_FRIENDSHIP` (120), since the carrying has already happened.

Herbal medicine is the one loss that **grows** with the band, which is the
mainline's own asymmetry.

Every **gain** above is doubled for a pokemon whose `ball` is a **Luxury Ball**
(`friendshipFactor`); neither loss is. The ball is a field of the record, so the
bonus follows whatever ball the pokemon is in now. Since `useBall`
([`balls.ts`](../../src/server/balls.ts)) lets an owner spend a spare ball to
replace it, the bonus can be bought for a pokemon that was caught in something
else. What a ball did at the moment of the catch, such as a Heal Ball mending it
or the odds a Dusk Ball improved, was settled then and is not revisited.

## Packed fields

Three groups of fields are stored as integers rather than as the shapes a reader
wants, and each is one call away in either direction
([`stats.ts`](../../src/data/constants/stats.ts),
[`status.ts`](../../src/data/ids/status.ts),
[`slots.ts`](../../src/data/constants/slots.ts)):

| Stored     | Was                            | Read with                       |
| ---------- | ------------------------------ | ------------------------------- |
| `ivs`      | `Record<Stats, number>` of six | `getIV` / `setIV` / `unpackIVs` |
| `statuses` | `Statuses[]`                   | `statusFlag` / `unpackStatuses` |
| `slots`    | Three shared constants         | `getSlots` / `withSlots`        |

`slots` is how much room this pokemon has for each of its three lists:
abilities, held items and moves. Three bits each, stored **0-based** so a count
of one reads out of a zero. A ceiling belongs to the individual rather than to
the game: a shadow carries two abilities where everything else carries one, and
it keeps that room once purified. The defaults are 1 ability (2 for a shadow), 1
held item and 4 moves.

Three bits would hold 8 of each, but the width is the field's own limit rather
than a rule about pokemon, so the rule is stated separately: **1 to 4 abilities,
1 to 8 held items, 4 to 8 moves**. Both ends are held on the way in and on the
way out, so a record written while a ceiling was higher reads inside the one
that holds now and nothing has to be rewritten. Moves start at 4 because every
catch can already use four; the four above that are what it earns.

Both places that enforce a ceiling read it off the record rather than off a
constant. `giveItem` asks `Slots.Item` before it hands anything over, and
`teachMove` asks `Slots.Move` to decide whether a machine teaches a further move
or costs one. A record written before the field existed reads its old defaults
from its own abilities, so nothing needs backfilling.

`statuses` is a bitfield of its own, `StatusFlags` with six flags starting at
the first bit, rather than shifts of the battle engine's `Statuses` enum. A
stored record should not have its layout decided by where a status happens to
sit in an enum the engine owns. A volatile status has no bit at all, so a report
claiming a pokemon is confused cannot be written even by accident. `statusFlag`
and `flagStatus` are the only place the two numberings meet.

The reason is the same in each case. A set of named things compares, unions and
masks as an integer, so what a Full Heal takes off is one AND rather than a
filtered list, and the shape a reader wants is one call away.

`individual_value` stays beside the packed `ivs`. It is the 32-bit roll the
values were originally sliced from. The two agree for a wild catch and disagree
for a bred egg or a polished one, which is the whole reason both are kept.

## The marks are columns, not bits

`shiny`, `shadow`, `egg`, `favorite` and `guarded` are boolean columns rather
than bits of one packed mark, because each is something a box search filters on.
`listCaughtMarked(owner, 'shiny')` is a plain equality beside the owner, where a
packed value could only be compared whole.

**None of the five is a lock.** `locked_at` carries that whole answer: a stamp
of zero is a free pokemon, and the stamp itself is what tells this battle's lock
from a later one's. See
[Catches are locked while they fight](catch-state.md#catches-are-locked-while-they-fight).

### `auctionable` is the sixth, and a different kind

The other five are **stated** about a record. `auctionable` is **derived** from
three columns the row already carries (`ivs`, `shiny` and `species`) and stored
anyway. It answers "would somebody else pay for this": perfect values, **no**
values, shiny, or a special-tier species. See
[`isAuctionableCatch`](../../src/auth/caught-record.ts), and
[Auctions](auctions.md#what-may-go-on-the-block) for what asks.

Storing a derived value is the thing this codebase otherwise refuses to do: the
world's spawns, landmarks and passers-by are all re-derived rather than kept. It
is kept here because the rule needs the registry rather than the row. Which
species are special-tier is data the database does not have, so the question
cannot be asked of it as a filter, and the sell picker would otherwise read
every pokemon a player owns to find the few worth listing.

Two rules keep it from going out of date:

- **Every write that moves an input rewrites it.** Catching, writing an egg, a
  bottle cap (`ivs`), purifying (`ivs`, all six up by two), evolving
  (`species`). Nothing else can change any of the three. `shiny` is fixed at the
  encounter, and hatching only lifts the shell. Both cap paths matter in _both_
  directions: a cap can complete a perfect set, and it can also break a blank
  one, which is the only way a catch stops being auctionable.
- **Nothing decides anything by it.** `openAuction` re-derives from the record
  it is already holding, and the sell picker re-checks every row the query
  returns. The field can cost a listing its place in a list; it can never
  authorize one.

## See also

- [Catch records](catches.md): the `caught` row, its children, and the box
  search
- [Health, status and the battle lock](catch-state.md): what `useHealingItem`
  and a lock refuse
- [Changing a catch](catch-changes.md): evolution, bottle caps, purifying,
  releasing
- [Owners and origin](catch-history.md): `caught_history`, and where it was met
- [Eggs](eggs.md): hatching, and the friendship a hatched pokemon starts on
