# Quests, achievements and awards

Four tables and one column, all of them counters or claim markers, all written
by the server alone. A client that could write its own counters could write
itself rewards.

## `quest_progress`

Lifetime counters, a `(metric, param)` grid per player.

| Column   | Type       | Notes                                                |
| -------- | ---------- | ---------------------------------------------------- |
| `player` | `uuid`     | Whose counters                                       |
| `metric` | `smallint` | A `Metric`: what is being counted                    |
| `param`  | `integer`  | What narrows it: a species, an item, an npc, a biome |
| `count`  | `bigint`   | How many                                             |

The metrics are the `Metric` enum in
[`src/auth/quest-record.ts`](../../src/auth/quest-record.ts): catches, hatches,
level-ups, item uses, steps, npc visits, landmark claims, raid runs and wins,
trades, friends, auctions, purifies, evolutions, releases, moves learned, battle
wins, gold earned and spent, gifts, bids, shiny catches, trainer wins, biomes
seen, and effort assigned.

Some metrics deliberately **double-count**: a shiny counts under `ShinyCatches`
and `Catches` both, and a duelling trainer counts under `TrainerWins` and
`BattleWins` both, since one answers "how many did I beat" and the other "which
kind". `Biomes` is marked once per biome and never added to, so its total is how
many different ones the player has stood in.

`bumpProgress` in
[`src/server/quest-progress.ts`](../../src/server/quest-progress.ts) is the one
door: every call that does something countable raises its counters in the same
transaction it does the thing.

The counters were **backfilled** from what the game had already written down, so
a veteran did not start at zero. Steps, level-ups and item uses left nothing
behind to count and began fresh.

## `quest_claims`

One row per player and quest, written as the reward is paid, which is what pays a
quest exactly once.

## `rotation_baselines` and `rotation_claims`

The daily and weekly quests are **derived from the date** in code, the way the
species day is, so nothing about the board is stored. What the database keeps is
where the lifetime counter stood when the window first saw this player, and which
slots have been claimed.

| Table                | Row                                      | What it settles                              |
| -------------------- | ---------------------------------------- | -------------------------------------------- |
| `rotation_baselines` | `(player, window_key, slot, baseline)`   | What this window's progress is measured from |
| `rotation_claims`    | `(player, window_key, slot, claimed_at)` | That a slot pays once                        |

A window key is the UTC date (`d2026-8-27`) or the ISO week (`w2026-35`), so both
boards turn over at the same instant everywhere. A baseline is written once per
window and slot, so neither a relist nor a second press moves anything.

## `awards`

| Column      | Type       | Notes                                    |
| ----------- | ---------- | ---------------------------------------- |
| `player`    | `uuid`     | Who earned it                            |
| `award`     | `smallint` | An `Awards` id: badges, marks, the medal |
| `earned_at` | `bigint`   | When it was first earned                 |
| `wins`      | `bigint`   | How many times its fight has been won    |

Anybody signed in may read them, since a profile shows its badges to visitors,
and only the server writes them: an award is a battle outcome rather than a
client's claim.

`wins` is there because a gym can be re-fought every window. The award says the
fight was won; the count is the shelf's bragging right.

## `profiles.title`

The title a player wears, or null for none. A `Title` id from
[`src/data/ids/titles.ts`](../../src/data/ids/titles.ts), which is a number
rather than an enum entry per name because nearly all of them are systematic:
every achievement line carries a pair, and so does every type and every trainer
class.

There is **no client grant** on the column. Entitlement is derived from the
counters and the awards, so the server is the only writer, and a title nobody has
earned cannot be worn by writing it.

## Achievements are not stored at all

An achievement is a tier reached on a counter, and
[`src/data/achievements.ts`](../../src/data/achievements.ts) works it out
wherever it is shown. Nothing is written when one is reached: the counters are
the truth, and a stored tier would only be something to fall out of step with.

## Access

`quest_progress`, `quest_claims`, `rotation_baselines` and `rotation_claims` are
**closed** end to end: row-level security is on and no policy is written, so a
browser reading them gets nothing back. Everything is served through the server.
`awards` is tier 1, readable by anybody signed in.

## See also

- [Quests](../mechanics/quests.md), [Awards and titles](../mechanics/awards.md)
- [Mystery gifts](gifts.md): how a quest reward is actually handed over
