---
name: signature-abilities
description: >
  A signature ability is one invented ability per evolution family,
  numbered in the 200000 band and granted rather than rolled at birth.
  A legendary **group** shares one theme across its members. Applies
  whenever designing, naming, implementing or reviewing a signature
  ability.
---

Every evolution family gets one non-canon **signature ability**, themed on both what the line is and how it fights. They are not part of any pool: the ids sit in their own band from `200001` up in [`abilities.ts`](../../../src/data/ids/abilities.ts), and nothing rolls one at birth or breeds for one, so a line's four ordinary abilities stay four and the [`ability-pools`](../ability-pools/SKILL.md) walk is untouched.

## A legendary group shares one theme

**The members of a legendary group are designed as a set: one idea told several ways, never a separate design each.** Pick the frame from what the group shares, usually their lore or the ability all of them carry, then vary one axis per member.

- The three beasts share what Ho-Oh did for them in the burned tower. Each survives the first blow that would finish it, is cured, and comes back a stage sharper in the stat it is built on: Raikou Speed, Entei Attack, Suicune Defense.
- The three Kanto birds share the beat of their wings as one takes the field, each taking a different stat off the whole enemy side: Articuno Speed, Zapdos Special Defense, Moltres Defense.

This covers every set the mainline presents as a set, the tower duo and the weather trio and the Regis and the Lati pair among them. A legendary that stands alone, Mewtwo for instance, needs no shared frame.

Because the members then share one behaviour, the implementation goes in a **meta factory** beside the other shared ones in [`signature/__create.ts`](../../../src/battle/abilities/signature/__create.ts) (`createRisenAbility`, `createWingbeatAbility`), never copied per member. That is the repository's standing rule for abilities that share an effect, and it is what keeps the group's numbers in one place.

## What the design may not do

**A name may never be the same as a move's or an item's.** All three appear in the same lists and tooltips, so one word standing for two mechanics is confusing however it is described. A name that merely contains a move's word is fine: Mimed Barrier stands beside Barrier. Check `src/data/moves` and `src/data/items` before proposing, not after.

**Nothing shortens a cooldown.** Speed already decides how fast a unit's moves come back, and a second source of the same thing muddies what the stat means. Reach for Speed itself, or for cast and channel times, which Speed does not govern. A cooldown **penalty** is a different thing and is fair as the cost side of a trade, the way the Squirtle line's Overpressure adds to its own cooldowns for the power it gains.

**Nothing keys on whether a move repeats the last one landed**, in either direction. The AI scores each move on its own merits through the speculative resolvers and has no notion of what it threw a moment ago, so a rule written on move history plays completely differently in a player's hands than in the AI's. Counting landed moves without caring which they were is fine, and so is keying on the target rather than the move.

## Reach for a move before writing machinery

**Where a move already does the thing, cast it.** Drought casts Sunny Day and Cursed Body casts Disable, and a signature that wants weather, a screen, a trap, a heal, a hazard or a status should reach for the move rather than a hand-written listener: the move's own duration, power and cure list stay authoritative, so tuning the move tunes every ability built on it. Cast with `unit.triggerMove(move, target, 0)`, and remember a cast move resolves on its own flight delay, which a test has to advance the clock for.

## Building one

The concept is the user's decision and is put up for approval before any of it is written; how it is built is not. Once a concept is settled, a signature ability costs four things:

1. An id in the signature band, appended rather than inserted, since an id reaches a player's caught rows.
2. A registry entry in [`signature.ts`](../../../src/data/abilities/signature.ts) with a one-line player-facing description, grouped under a comment naming the family.
3. An implementation in the region's file under [`abilities/signature/`](../../../src/battle/abilities/signature/), wired through the list in that folder's `index.ts`. A test checks the registry against every ability the engine implements, so a missing entry fails rather than going quiet.
4. A test suite asserting real engine state, and a changeset. Work that only changes something introduced on the same branch edits that branch's changeset in place instead of adding one.
