# Gym seats

A **seat** is the one place in the world where players fight each other without
either of them arranging it. What separates it from every other staged fight in
the schema is that it belongs to a **cell** rather than to a window: a grunt is
rolled from the chunk seed and gone in three hours, while a seat is held by
whoever last took it, for as long as nobody takes it off them.

Written by [`src/server/gym-seats.ts`](../../src/server/gym-seats.ts); the rules
both sides read live in
[`src/auth/gym-seat-record.ts`](../../src/auth/gym-seat-record.ts).

## `gym_seats`

| Column                             | Type             | Notes                                                      |
| ---------------------------------- | ---------------- | ---------------------------------------------------------- |
| `seat_id`                          | `text`           | Derived from the chunk and the cell, so it names the place |
| `holder`                           | `uuid`           | Who is sitting there; null while the seat is open          |
| `snapshot_id`                      | `text`           | The frozen party a challenger fights                       |
| `chunk_seed`, `chunk_x`, `chunk_y` | `text`/`integer` | Where it stands                                            |
| `cell`                             | `integer`        | The landmark cell                                          |
| `seated_at`                        | `bigint`         | When this stand began                                      |
| `defenses`                         | `integer`        | Challenges turned away, reset with the holder              |
| `ousted`                           | `uuid`           | Who was just turned out                                    |
| `freed_at`                         | `bigint`         | When they were, which is what the bar counts from          |

The party is a **`team_snapshots` row**: a frozen copy, so the holder walks away
with their pokemon still theirs to raise and fight. Nothing here locks a catch.

Sitting down reads the row `for update`, so two players cannot both find a seat
free and both take it.

Tier 1: a seat is a public fact about a cell, the way a raid lobby is, and it
rides the realtime stream so a seat changing hands is visible from across the
chunk.

## `gym_challenges`

One challenge in flight per seat and challenger. The row **is** the claim: it
carries the battle the challenge became, and the outcome is read off that battle
rather than stored twice.

| Column       | Type      | Notes                                                 |
| ------------ | --------- | ----------------------------------------------------- |
| `seat_id`    | `text`    | The seat challenged                                   |
| `challenger` | `uuid`    | Who challenged it                                     |
| `battle_id`  | `text`    | The fight                                             |
| `held_by`    | `uuid`    | Whose seat it was when the challenge was accepted     |
| `started_at` | `bigint`  | When it opened                                        |
| `settled`    | `boolean` | Whether the result has been paid                      |
| `settled_at` | `bigint`  | What the retry cooldown counts from                   |
| `window_at`  | `bigint`  | The start of the rolling day the take is counted in   |
| `taken`      | `integer` | What this challenger has stripped off this seat in it |

`held_by` is what keeps a late report honest: a challenge that settles after
somebody else has taken the seat pays nothing, because what was beaten is not
what is standing there now. Every write on settlement is keyed on that holder,
and the row count is what says whether it still applies.

Readable by the two people in it: the challenger, and whoever held the seat.

## What a fight moves

The loser pays the winner a **share of their purse**, both directions. The share
scales with what each side actually has, so a poor trainer risks little and a
rich one feels it, and it is clamped by what the loser holds so nobody is pushed
below nothing.

| Rail               | Value             | Why                                                  |
| ------------------ | ----------------- | ---------------------------------------------------- |
| `SEAT_STAKE_SHARE` | 10% of the purse  | A share rather than a flat sum, which would go stale |
| `SEAT_STAKE_LIMIT` | 60,000 a fight    | A tenth of a Relic Crown: it only clips the tail     |
| `SEAT_DAILY_TAKE`  | 3 x the limit     | The most one challenger strips off one seat in a day |
| `SEAT_TAKE_WINDOW` | 24 hours, rolling | Rolling, so the cap cannot be dodged at midnight     |
| `SEAT_COOLDOWN`    | 30 minutes        | A seat cannot be attacked in a tight loop            |
| `SEAT_OUSTED_BAR`  | 1 hour            | How long a beaten holder stays off their own seat    |

Only the **challenger's** take is capped: they chose the fight, and the holder
was not there to refuse it.

## Winning empties the cell

A beaten seat is **freed rather than handed over**. The winner takes the purse
and the cell opens; they then sit down on it like anybody else, with whatever
their party has left. The ousted holder is barred from it for `SEAT_OUSTED_BAR`,
or until somebody else sits down, whichever comes first, so the seat is genuinely
open without ever being locked away for good.

The row survives the seat being emptied rather than being deleted, because
`gym_challenges` hangs off it and that is where the cooldown and the daily take
live. Cascading those away on every win would hand every challenger a clean
slate.

## Settlement

A gym fight is the **one** player-versus-player battle that settles an aftermath,
and only for the challenger: their party was there and carries the wear out with
it. The holder's side is a frozen copy standing in for somebody who is not
present, and settling it would charge them for a fight they never saw. See
[`recordAftermath`](raids.md#battle_aftermaths).

## See also

- [Raids and battles](raids.md)
- [Battles](../mechanics/battles.md#gym-seats): the same rules for players
