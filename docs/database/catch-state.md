# Health, status and the battle lock

The fields that say how a catch is doing right now: what a fight left behind,
the two flags its owner sets, and the lock a live battle holds it under.

## Health and status

A battle leaves a party in the state it ended in. A pokemon walks out of a raid
at whatever health it had when the boss fell, still burned if it was burned, and
walks into the next fight that way. The report that writes it is
[`battle_aftermaths`](battle-rows.md#battle_aftermaths), and the rules both
sides read are in [`src/auth/health.ts`](../../src/auth/health.ts).

**The maximum is stored beside the current figure.** It comes from the same
formula the battle fights on (`getHealthStat` in
[`src/data/constants/stats.ts`](../../src/data/constants/stats.ts)), and only
what that formula reads writes it: a level, an evolution, a polished value and a
training session. It is stored so that `hurt` can be a generated column, which
is what `is:hurt` and Nurse Joy's list both ask. Like `auctionable` it is
advisory, and a caller re-derives before acting on it.

**When the maximum moves, the share moves with it.** A pokemon at 50 of 100
comes out of an evolution at 60 of 120, and out of a bottle cap the same way.
Two edges are deliberate. A pokemon that was down stays down, since an evolution
is not a revival, and one that was up never falls to zero on a rounding step.

The same rescaling happens **into** a battle. An ability can change what a
unit's pool is worth, and a `Boss` carries a raid-sized one, and the record it
was copied from knows nothing about that. So the stored health is read against
the stored maximum and applied against the pool the unit actually fights with. A
boss at full takes the field at full rather than at a tenth of itself, and a
half-hurt pokemon stays half hurt whatever its pool turns out to be.

**Only non-volatile statuses survive, and all of them do.** Poison, bad poison,
sleep, paralysis, a burn and ice are carried out. Confusion, flinching, a
substitute and the field's own effects end with the battle. A unit can hold
several at once, since poisoned and asleep is an ordinary way to come out of a
raid, so the record keeps the whole list, and a berry clears everything it
covers rather than the first thing it finds. Stored statuses are applied to the
unit when it is fielded, through the ordinary path, so an immunity refuses one
and a held Rawst Berry eats itself to cure the burn before the first turn.

**A fainted pokemon cannot fight.** `joinRaid` refuses a party holding one, and
`publishTeamSnapshot` drops one from the freeze. A team that fields nothing is
no team, so a party of fainted pokemon cannot start a battle at all.

Three things put a pokemon right, and they all run through one call,
`useHealingItem` ([`src/server/healing.ts`](../../src/server/healing.ts)), with
`healedByItem` deciding what any given item is worth to any given pokemon:

- **A berry**, from the table in
  [`src/data/items/berries.ts`](../../src/data/items/berries.ts) that the battle
  shares, so an Oran Berry is worth ten points on either side of a fight. The
  battle's use-at-a-threshold rule is a battle rule only; out of one the player
  decides when it is worth it.
- **Medicine**, in
  [`src/data/items/medicine.ts`](../../src/data/items/medicine.ts): a potion (20
  / 60 / 120 / the whole pool), a cure for one status or a Full Heal for all of
  them, a Full Restore for both, and a revive that lifts a fainted pokemon on
  half a pool, and a Max Revive on a whole one. None of it is holdable, which is
  what keeps a berry worth carrying into a raid, and all of it is `Marketable`.
- **Herbal medicine**, the same file's last four entries: cheaper than the
  bottle each competes with and better at the job. Energy Powder is 50 points,
  Energy Root 200, Heal Powder every status and Revival Herb a whole pool off
  the floor, and paid for in `friendship`. `bitter` is how many mouthfuls it
  counts as, and `useHealingItem` docks
  `gainFriendship(current, 'herb', mouthfuls)` in the **same write** as the
  healing, so the cure and its cost cannot come apart. No `factor` is passed: a
  Luxury Ball multiplies gains and never losses.
- **A level**, through `useCandy`. A level comes with full health and a clean
  slate.

Two rules cut across all of it. **A revive is the only thing that reaches a
fainted pokemon**, and the only thing that does nothing to one still standing. A
potion poured over a pokemon that is already down does nothing, exactly as in
the mainline games. And **an item that would change nothing is refused rather
than spent**: the wrong cure, a pokemon already whole, or a Leppa or Persim,
whose effects nothing stores.

A record written before these fields existed has neither, and reading a missing
`health` as zero would faint every pokemon caught until now. Missing means
whole: `asCaughtPokemon` derives the maximum for those records, which is what
they meant.

## What the player sets

Four of the six `PokemonFlags` are the game's own: shiny, shadow, egg, and the
battle lock. Two are the player's, set from the catch dialog and cleared the
same way, and neither says anything about the pokemon itself:

| Flag       | Button              | What it refuses                                                                                  |
| ---------- | ------------------- | ------------------------------------------------------------------------------------------------ |
| `Favorite` | Favorite/Unfavorite | Releasing, listing at auction, and trading when there is trading                                 |
| `Guarded`  | Lock/Unlock         | Levels, training, values moved, evolution, fights, healing, purifying, items given or taken back |

They answer different questions on purpose.

A **favorite** is about parting with a pokemon. It guards the two irreversible
things a mis-click can do: `releaseCatch` deletes a record outright, and
`openAuction` puts one somewhere it cannot be taken back from. It changes
nothing about what the pokemon can do, so a favorite still fights, still trains
and can still be a buddy.

A **guarded** pokemon is about keeping one as it is. The line is drawn around
the sheet: anything that would rewrite a stored field is refused, and anything
that only ever adds to the pokemon is left alone.

Refused: `useCandy` (a level), `trainEffort`, `useWing` and `feedEffortBerry`
(effort), `useBottleCap` (values), `evolveCatch`, `useHealingItem`,
`usePurifyingGem`, `visitNurse` (she heals and purifies), `joinRaid`, and both
`giveItem` and `takeItem`, since a locked pokemon is not reached into in either
direction, so what it is holding stays what it was holding.
`publishTeamSnapshot` drops it from a party the way it drops an egg or a fainted
pokemon, so a stop fight leaves it behind too.

Still allowed: walking as the **buddy** and the steps that come with it,
**friendship** from every source that grants it, and standing as a **parent** at
the breeder. `breedCatches` consumes neither parent and writes the egg as a
third record, so a locked pokemon comes back from the breeder exactly as it
left. `groomCatch` is allowed for the same reason: friendship is the one field a
lock does not fence off.

Neither flag is enforced by the client. Every one of those calls checks the
stored record, through `isFavoriteRecord` and `isGuardedRecord` in
[`src/server/catch-fields.ts`](../../src/server/catch-fields.ts). The catch
dialog greys out every section a lock refuses, and the pickers say _a favorite_
or _locked_, so the refusal is visible before the press.

`setFavorite` and `setGuarded`
([`src/server/caught.ts`](../../src/server/caught.ts)) write through `withFlag`,
so setting one cannot drop another, and a shiny shadow stays a shiny shadow.
Both refuse while the pokemon is **fighting**, the way every other edit to a
live record does.

## Catches are locked while they fight

A battle runs on a **frozen** snapshot of the party, so a record that moved
underneath it would leave the two describing different pokemon. The worst case
is not cosmetic: a player who pulls a berry back into the bag mid-raid would
have it eaten in the battle and still be holding it afterwards.

So `startRaid` sets `lock` as it freezes each team, in the **same transaction**
as the snapshot, and every write that edits a catch refuses while the lock
holds: `giveItem`, `takeItem`, `useCandy`, `evolveCatch`, and `joinRaid`, which
will not field a pokemon already fighting elsewhere. Trading will ask the same
question: a locked pokemon is not up for trade.

`isCatchLocked` ([`src/server/locks.ts`](../../src/server/locks.ts)) answers
from the two columns alone, against the server's own clock; no row is fetched.
Two things end a lock:

- **The fight.** `finishBattle` stamps the outcome and then calls
  `releaseBattleLocks`, which frees every catch its team snapshots name.
- **The clock.** A lock is ignored once `BATTLE_TIMEOUT` (10 minutes) has passed
  since `lockedAt`, so a battle nobody ever reports, from a closed tab or a
  party that walked out, does not hold pokemon forever. It is the same window
  that decides an abandoned raid may be restaged.

`lockedAt` is the battle's own `startedAt`, which is what keeps the release
honest: it frees only catches whose lock still carries **that** stamp, so a late
report cannot unlock a pokemon that has since been taken by a newer fight.

Because freezing a team locks it, `startRaid` **claims the raid first** and
freezes afterwards, and a start that loses the race to another host holds
nothing. A claim whose teams then field nothing leaves the raid pointing at a
battle row that was never written, which reads as lost and restages.

The client asks the same question through `isLockLive`
([`src/auth/battle-lock.ts`](../../src/auth/battle-lock.ts)) so the catch dialog
can grey its buttons out and say why. The refusal itself is the server's.

## See also

- [Catch records](catches.md): the `caught` row, its children, and the box
  search
- [Training and friendship](catch-training.md): the friendship herbal medicine
  costs, and the marks beside these flags
- [Changing a catch](catch-changes.md): the writes a lock and a guard refuse
- [Battle rows](battle-rows.md): `team_snapshots`, `battles` and
  `battle_aftermaths`
