# Time

## Clock

Anything time-bound reads the server clock through
[`src/auth/clock.ts`](../../src/auth/clock.ts) rather than `Date.now()`. A
`'use server'` function returns the server's time, the client measures the offset
once, and it derives locally for the next minute.

Timestamps are epoch milliseconds and carry no timezone. The server pins its
process to **UTC** ([`src/server/timezone.ts`](../../src/server/timezone.ts)), so
two deploys on differently-configured machines agree about what instant it is. A
skewed device cannot shift the instants it is given, only how they are read.

## Local time

Which _day and hour_ an instant falls in is the player's own, and
[`src/auth/local-time.ts`](../../src/auth/local-time.ts) decides it. The offset
is minutes east of UTC (`+480` for UTC+8), reported by the client from its own
zone and normalized with `asOffset` to something a zone can actually be.

Two things ride on it:

- **The window is local**, so a player walking at night meets what the night pool
  holds wherever they are. The instant behind it is still the server's; only the
  reading is theirs.
- **The zone is in the seed.** `ChunkSnapshot.key` is `chunkSeed` + zone, so a
  chunk is one world per zone rather than one world on several clocks. What a
  player in UTC+8 finds there says nothing about what a player in UTC−5 will
  find, however the two line up their hours. Spawns, item caches, berry patches,
  phenomena and raid rolls all move with it.

A client can misreport its zone. Everything derived from the offset is therefore
**scoped by** it: the snapshot row, the spawn ids, the claim markers and the raid
lobby ids, so inventing a zone yields that zone's world rather than a second
helping of your own.

The ceiling on that is the roughly 27 offsets a day holds: a determined client
can re-claim a landmark once per zone it invents, at the cost of walking a
different world each time. If that ever matters, the fix is to lock the offset to
the profile.

## Stored dates

Dates a player reads are stored the way they read them, as a wall clock and the
zone it was read in: `caught_at_local` beside `caught_at_offset`, and
`acquired_at_local` beside `acquired_at_offset` on every history row. Keeping the
two apart is what lets a search for a year or a month stay a plain range scan.
[`caught-rows.ts`](../../src/auth/caught-rows.ts) re-attaches the offset on the
way out, so a reader still sees `2026-08-10T22:14:03.123+08:00`.

The **species day is the exception**: `getDayOfYear` counts in UTC, so the
featured family turns over at the same moment for everybody rather than rolling
around the world with local midnight.
