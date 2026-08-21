# Encounter kinds

`EncounterType` ([`src/overworld/encounter.ts`](../../src/overworld/encounter.ts))
is stored on both the encounter and the catch it becomes. Every way of meeting a
pokemon is its own kind, because a record should say where it actually came from:

| Kind            | Id  | Shown as              | Where it comes from                     |
| --------------- | --- | --------------------- | --------------------------------------- |
| `Wild`          | 0   | Wild                  | A chunk snapshot's spawns               |
| `Hatched`       | 1   | Hatched               | An egg                                  |
| `LegendaryRaid` | 2   | Legendary Raid        | A cleared legendary raid                |
| `Fateful`       | 3   | Event                 | An event or mystery gift                |
| `Rocket`        | 4   | Team Rocket           | A beaten Team Rocket grunt              |
| `ShadowRaid`    | 5   | Shadow Raid           | A cleared shadow raid                   |
| `MythicalRaid`  | 6   | Mythical Raid         | A cleared mythical raid                 |
| `Revived`       | 7   | Revived from a fossil | A fossil opened by the Fossil Scientist |

The three raids are kept apart because they are not the same prize:

- A **legendary raid** stages a legendary and hands it over at level 50.
- A **shadow raid** usually stages one of the biome's **rare** species, hands it
  over at level 25, and its catch keeps the `Shadow` ability for good.
- A **mythical raid** stages what a relic called and hands it over at level 30,
  once.

Where they are alike — the species-day IV floor (`RAID_FAMILY_DAY_MIN_IV`) and a
prize that never bolts from a safari throw — `isRaidEncounter` covers all three,
so nothing has to list them separately to treat them the same.

A **fateful** meeting is the one nobody met anywhere: it never bolts, and the
first ball that reaches it catches it. Three fields exist for it alone — `place`, the
name it says it happened at, `slots`, the room it walks in with, and `abilities`,
the whole list where it walks in with more than the one it rolled — and all
three are absent from everything met in the world. They ride the encounter rather
than the gift so a pokemon caught out of a gift keeps them: the catch that writes
the record knows nothing about gifts.

`ENCOUNTER_TYPE_NAMES` is what the catch dialog's **Met** row shows.

> Records written before the split carry `type: 2`, which now reads as _Legendary
> Raid_. A catch that actually came from a shadow raid can be told by its
> `shadow: true`, so a backfill is possible if the distinction matters
> retroactively.
