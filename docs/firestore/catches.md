# Catch records

Written by `recordCatch` in [`src/server/caught.ts`](../../src/server/caught.ts). A
catch is **one document** with a Firestore auto-id, so recording one is a single
write. Its abilities, held items and ownership history were once three side
stores keyed by that same id (`caughtAbilities`, `caughtItems`, `caughtOwners`);
they are fields now, which turned showing a pokemon from four reads into one and
removed the three rule blocks that had to `get()` the parent to find an owner.

## `caught/{catchId}`

| Field                  | Type                    | Notes                                                     |
| ---------------------- | ----------------------- | --------------------------------------------------------- |
| `owner`                | `string`                | Current owner's uid; changes on trade                     |
| `type`                 | `EncounterType`         | How it was originally met                                 |
| `species`              | `Species`               |                                                           |
| `level`                | `number`                |                                                           |
| `individualValue`      | `number`                | 32-bit roll the IVs slice from                            |
| `traitValue`           | `number`                | 32-bit roll driving level, gender, ability, nature        |
| `ivs`                  | `Record<Stats, number>` | 0-31 per stat, stored explicitly so records are queryable |
| `gender`               | `Genders`               |                                                           |
| `nature`               | `Natures`               |                                                           |
| `shiny`                | `boolean`               | Frozen at catch time; trades cannot change it             |
| `shadow`               | `boolean`               | From a shadow raid; keeps Shadow, costs double candy      |
| `moves`                | `Moves[]`               |                                                           |
| `abilities`            | `Abilities[]`           | The rolled ability, plus Shadow for a shadow catch        |
| `items`                | `Items[]`               | Held items; starts empty, up to `HELD_ITEM_LIMIT`         |
| `history`              | `OwnershipRecord[]`     | `{ owner, acquiredAt }`, oldest first; trades append      |
| `lock`                 | `boolean`               | Whether it is fielded in a battle right now               |
| `lockedAt`             | `number`                | `startedAt` of the battle holding it; 0 when free         |
| `egg`                  | `boolean`               | Still an egg: shows nothing, does nothing, cannot fight   |
| `steps`                | `number`                | Steps walked with it as buddy; only eggs accrue any       |
| `hatchSteps`           | `number`                | What hatching costs, frozen when the egg was found        |
| `steppedAt`            | `number`                | Server instant steps were last credited at                |
| `ball`                 | `Balls`                 | Ball the catch was made with                              |
| `caughtAt`             | `string`                | Local ISO 8601 with offset ([Time][time])                 |
| `locale`               | `string`                | The catcher's locale tag, e.g. `en-PH`                    |
| `effortValues`         | `Record<Stats, number>` | Starts at zero across the board                           |
| `origin.timestamp`     | `number`                | Snapshot window the spawn belonged to                     |
| `origin.x`, `origin.y` | `number`                | Chunk coordinates                                         |
| `origin.biome`         | `Biome`                 |                                                           |

Queried by `listCaught` with `where('owner', '==', uid)`, which needs a
single-field index on `owner` — Firestore provides that automatically.

`species` and `level` are the two mutable fields: `useCandy` raises the level,
and `evolveCatch` in [`src/auth/evolution.ts`](../../src/auth/evolution.ts) swaps
the species. An evolution that uses an item decrements
`inventories/{uid}:{item}` in the same transaction, so the stone and the new
species land together or not at all. Criteria are re-checked against the stored
documents inside that transaction, never trusted from the caller.

Which evolutions are offered comes from
[`src/data/species/evolution.ts`](../../src/data/species/evolution.ts): only the
`Level`, `UsedItem` and `HeldItem` methods can be verified against what is
stored today, so an evolution carrying any other flag — trade, friendship,
weather — is never offered rather than waved through. A held item is required
but not consumed; only a used item is spent.

Catch records are readable by any signed-in player (other players inspect a
pokemon before a trade) and writable only by the owner the document itself
names.

Held items move through `giveItem` and `takeItem` in
[`src/server/caught.ts`](../../src/server/caught.ts): each reads the catch and the
inventory stack, then writes the stack and the catch's `items` **in one
transaction**, so an item is never in the bag and on a pokemon at once, nor lost
between them. Only items flagged `Holdable` can be handed over, and a catch
holds at most `HELD_ITEM_LIMIT` (1) — matching the battle's per-unit item limit.
This is the path the Shiny Charm needs: a buddy holding it lifts the shiny odds
of every encounter its owner starts.

## Releasing

`releaseCatch` ([`src/server/caught.ts`](../../src/server/caught.ts)) **deletes**
the document rather than flagging it: a released pokemon is gone, and nothing in
the game reads a catch its owner no longer has. Three things move with it, in the
same transaction, so nothing is left pointing at a record that has vanished:

- whatever it was holding goes back to the bag — the item was the player's, not
  the pokemon's;
- `buddies/{uid}` is deleted when it named the released catch;
- a catch that is **locked** into a live battle is refused outright, since the
  fight is running on a snapshot of a record that has to still be there when it
  ends.

Releasing pays no candy. Catching already pays `CANDY_PER_CATCH`, so paying
again on the way out would make catch-and-release a way of farming candy from
the same spawn rather than a way of clearing space.

The dialog asks twice before calling it, and there is no undo.

## Eggs

An egg is an ordinary catch record with `egg` still set. Everything about the
pokemon inside it — species, rolls, the move it inherited — is written by
`grantNestEgg` ([`src/server/eggs.ts`](../../src/server/eggs.ts)) the moment the
nest is claimed, so hatching reveals rather than rolls: asking again cannot
produce a better pokemon than the nest gave. Every egg starts at level 1 and
holds nothing.

What the record does not do is show it. The catch dialog hides everything read
off the species — the name, gender, abilities, moves, size — until the flag comes
off, and the list, the team picker and the buddy line all say only "Egg". This is
presentation, not secrecy: catch documents are readable, so a determined player
can read the species out of Firestore directly. Nothing is staked on them not
doing so.

An egg is refused everywhere a pokemon is expected: `giveItem`, `useCandy` and
`evolveCatch` turn it down, `publishTeamSnapshot` leaves it out of the party it
freezes, and `resolveBuddy` reports no buddy effects for one — it is carried, not
accompanied, so its ability and nature change nothing in the overworld.

### Bred eggs

A breeder's egg is written the same way a nest's is, by `grantBredEgg`, and
differs only in where the pokemon inside comes from. Three of its six individual
values are copied straight off one parent or the other and the rest are rolled;
the moves its line can only inherit are passed on by whichever parent actually
knows them, which is what makes breeding a way to *teach* a move rather than
roll one. Its nature, ability and gender are its own.

A shadow parent may pass the shadow on — a coin toss, so breeding two of them is
no more certain than one. An egg that inherits it is written `shadow: true`,
hatches with the Shadow ability for good, costs double candy to raise
afterwards, and takes `SHADOW_HATCH_FACTOR` (2×) the usual steps to open: what
is in there should not be, and it takes longer to come out.

The stream is seeded by the pair, the hour, the player and the instant, so the
same two left with the breeder again are a different egg — and no egg can be
re-rolled by asking twice.

One thing to know about the record: a bred egg's `ivs` are the **inheritance**,
so they are no longer slices of its `individualValue`. Everything that matters —
the battle snapshot, the dialog — reads the stored `ivs`, and nothing re-derives
them from the roll.

### Walking

Only the buddy walks. The client counts cells crossed and reports them in
batches of eight through `walk` ([`src/auth/eggs.ts`](../../src/auth/eggs.ts));
`recordSteps` credits them **against the server's own clock**, so a report buys
no more than `(now - steppedAt) / MIN_STEP_INTERVAL` steps whatever it claims —
250 ms a pace, capped at 64 a report, and never past `hatchSteps`. The stamp
moves on every report, credited or not, so a refused one banks no time for the
next. That is why `steppedAt` lives on the catch document (server-written) rather
than on `buddies/{uid}` (client-written).

`hatchEgg` takes the flag off once `steps` has reached `hatchSteps` and pays the
family's candy, exactly as meeting the pokemon any other way would have. The
shared rules both sides read — `EGG_HATCH_STEPS`, `canHatch`, `creditableSteps` —
are in [`src/auth/egg.ts`](../../src/auth/egg.ts).

## Catches are locked while they fight

A battle runs on a **frozen** snapshot of the party, so a record that moved
underneath it would leave the two describing different pokemon — and the worst
case is not cosmetic: a player who pulls a berry back into the bag mid-raid
would have it eaten in the battle and still be holding it afterwards.

So `startRaid` sets `lock` as it freezes each team, in the **same transaction**
as the snapshot, and every write that edits a catch — `giveItem`, `takeItem`,
`useCandy`, `evolveCatch`, and `joinRaid`, which will not field a pokemon
already fighting elsewhere — refuses while the lock holds. Trading will ask the
same question: a locked pokemon is not up for trade.

`isCatchLocked` ([`src/server/locks.ts`](../../src/server/locks.ts)) answers from
the two fields alone, against the server's own clock — no document is fetched.
Two things end a lock:

- **The fight.** `finishBattle` stamps the outcome and then calls
  `releaseBattleLocks`, which frees every catch its team snapshots name.
- **The clock.** A lock is ignored once `BATTLE_TIMEOUT` (10 minutes) has passed
  since `lockedAt`, so a battle nobody ever reports — a closed tab, a party that
  walked out — does not hold pokemon forever. It is the same window that decides
  an abandoned raid may be restaged.

`lockedAt` is the battle's own `startedAt`, which is what keeps the release
honest: it frees only catches whose lock still carries **that** stamp, so a late
report cannot unlock a pokemon that has since been taken by a newer fight.

Because freezing a team locks it, `startRaid` **claims the raid first** and
freezes afterwards — a start that loses the race to another host holds nothing.
A claim whose teams then field nothing leaves the raid pointing at a battle
document that was never written, which reads as lost and restages.

The client asks the same question through `isLockLive`
([`src/auth/battle-lock.ts`](../../src/auth/battle-lock.ts)) so the catch dialog
can grey its buttons out and say why; the refusal itself is the server's.

[time]: time.md#local-time
