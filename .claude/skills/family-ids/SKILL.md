---
name: family-ids
description: >
  A family id in `src/data/ids/families.ts` must sit in national dex
  order, and it cannot be renumbered afterwards because players' candy
  stacks are keyed by it. Applies whenever a new evolution family is
  registered.
---

`Families` is ordered by the national dex number of each family's first
stage, and the numbers ascend with it. Appending a new family to the end
of the enum is only right when its first stage outranks every family
already there.

## Why it cannot be fixed later

A family id is stored player data. `bag_candies.family` holds the number,
so renumbering a registered family silently moves everybody's candy from
one stack to another. The ordering is therefore a numbering contract, not
a formatting preference: nothing above the newest id may ever shift.

## Reserving the gaps

Adding several families at once means looking ahead along the dex for the
species that will start their own families **between** the ones being
added, and leaving a numbered gap for each with a comment naming it. A
species that joins a family already registered (a baby stage, a late
evolution) needs no gap: it takes its family's existing id.

```ts
  Chinchou = 85,
  // 86 is Togepi's, 89 Marill's and 90 Sudowoodo's: their dex numbers
  // fall between these, and an id is stored in a player's candy
  // stacks, so a later family cannot be renumbered into place
  Natu = 87,
  Mareep = 88,
  Hoppip = 91,
```

Guessing wrong costs nothing: an unused gap is a number nobody spends. A
missing gap costs a data migration.
