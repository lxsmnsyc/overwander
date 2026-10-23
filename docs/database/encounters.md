# Encounter kinds

`EncounterType` ([`src/overworld/encounter/index.ts`](../../src/overworld/encounter/kinds.ts))
is stored on both the encounter and the catch it becomes. Every way of meeting a
pokemon is its own kind, because a record should say where it actually came from:

| Kind            | Id | Shown as               | Where it comes from                     |
| --------------- | -- | ---------------------- | --------------------------------------- |
| `Wild`          | 0  | Wild                   | A chunk snapshot's spawns               |
| `Hatched`       | 1  | Hatched                | An egg                                  |
| `LegendaryRaid` | 2  | Legendary Raid         | A cleared legendary raid                |
| `Fateful`       | 3  | Fateful encounter      | An event or mystery gift                |
| `Rocket`        | 4  | Taken from a syndicate | A beaten syndicate grunt                |
| `ShadowRaid`    | 5  | Shadow Raid            | A cleared shadow raid                   |
| `MythicalRaid`  | 6  | Mythical Raid          | A cleared mythical raid                 |
| `Revived`       | 7  | Revived from a fossil  | A fossil opened by the Fossil Scientist |
| `TotemRaid`     | 8  | Totem Raid             | A cleared Totem raid                    |
| `MaxRaid`       | 9  | Max Raid               | A cleared Max Raid                      |
| `AlphaRaid`     | 10 | Alpha Raid             | A cleared Alpha raid                    |
| `NobleRaid`     | 11 | Noble Raid             | A Noble raid (never caught, see below)  |
| `TeraRaid`      | 12 | Tera Raid              | A cleared Tera raid                     |

The raids are kept apart because they are not the same prize:

- A **legendary raid** stages a legendary and hands it over at level 50.
- A **shadow raid** usually stages one of the biome's **rare** species, hands it
  over at level 25, and its catch keeps the `Shadow` ability for good.
- A **mythical raid** stages what a relic called and hands it over at level 30,
  once.
- A **Totem**, **Max**, **Alpha** or **Tera raid** hands its prize over at level
  40. A Totem or Alpha prize keeps three perfect stats, a Gigantamax Max Raid
  prize keeps the Gigantamax Factor, and a Tera prize keeps the boss's Tera type.
- A **Noble raid** ends with the Noble calmed rather than caught, so no record
  carries it. The kind exists to name the lobby.

Where they are alike, in the species-day IV floor (`RAID_FAMILY_DAY_MIN_IV`) and
in a prize that never bolts from a safari throw, `isRaidEncounter` covers all of them,
so nothing has to list them separately to treat them the same.

A **fateful** meeting is the one nobody met anywhere: it never bolts, and the
first ball that reaches it catches it. Three fields are written for it: `place`, the
name it says it happened at, `slots`, the room it walks in with, and `abilities`,
the whole list where it walks in with more than the one it rolled. `place` and
`slots` are absent from everything met in the world, and `abilities` is too,
except for the few meetings a fata morgana hands the family's signature. They
ride the encounter record
([`src/model/encounter-record.ts`](../../src/model/encounter-record.ts)) rather
than the gift so a pokemon caught out of a gift keeps them: the catch that writes
the record knows nothing about gifts.

`ENCOUNTER_TYPE_NAMES` is what the catch dialog's **Met** line shows. A raid
prize instead reads as where it was fought (_Caught at Seafoam Islands_), or as
_Caught in a Max Raid_ for the kinds that stand in no lair.

> Records written before the split carry `type: 2`, which now reads as _Legendary
> Raid_. A catch that actually came from a shadow raid can be told by its
> `shadow: true`, so a backfill is possible if the distinction matters
> retroactively.
