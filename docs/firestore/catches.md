# Catch records

Written by `recordCatch` in [`src/server/caught.ts`](../../src/server/caught.ts). A
catch is **one document** with a Firestore auto-id, so recording one is a single
write. Its abilities, held items and ownership history were once three side
stores keyed by that same id (`caughtAbilities`, `caughtItems`, `caughtOwners`);
they are fields now, which turned showing a pokemon from four reads into one and
removed the three rule blocks that had to `get()` the parent to find an owner.

## `caught/{catchId}`

| Field                  | Type                    | Notes                                                                   |
| ---------------------- | ----------------------- | ----------------------------------------------------------------------- |
| `owner`                | `string`                | Current owner's uid; changes on trade                                   |
| `type`                 | `EncounterType`         | How it was originally met                                               |
| `species`              | `Species`               |                                                                         |
| `level`                | `number`                |                                                                         |
| `individualValue`      | `number`                | 32-bit roll the IVs slice from                                          |
| `traitValue`           | `number`                | 32-bit roll driving level, gender, ability, nature                      |
| `ivs`                  | `number`                | The six 0-31 values, five bits each, in stat order                      |
| `gender`               | `Genders`               |                                                                         |
| `nature`               | `Natures`               |                                                                         |
| `moves`                | `Moves[]`               |                                                                         |
| `abilities`            | `Abilities[]`           | The rolled ability, plus Shadow for a shadow catch                      |
| `slots`                | `number`                | Room for abilities, held items and moves — three bits each              |
| `items`                | `Items[]`               | Held items; starts empty, up to `HELD_ITEM_LIMIT`                       |
| `history`              | `OwnershipRecord[]`     | `{ owner, acquiredAt, kind }`, oldest first                             |
| `flags`                | `number`                | `PokemonFlags` bits — see [What the player sets](#what-the-player-sets) |
| `lockedAt`             | `number`                | `startedAt` of the battle holding it; 0 when free                       |
| `steps`                | `number`                | Steps walked in the shell; only eggs accrue any                         |
| `walked`               | `number`                | Steps walked as buddy since hatching; buys friendship                   |
| `hatchSteps`           | `number`                | What hatching costs, frozen when the egg was found                      |
| `steppedAt`            | `number`                | Server instant steps were last credited at                              |
| `health`               | `number`                | Health left; 0 is fainted. The maximum is derived                       |
| `statuses`             | `number`                | Mask of the non-volatile statuses it is carrying                        |
| `ball`                 | `Balls`                 | Ball the catch was made with                                            |
| `caughtAt`             | `string`                | Local ISO 8601 with offset ([Time][time])                               |
| `locale`               | `string`                | The catcher's locale tag, e.g. `en-PH`                                  |
| `effortValues`         | `Record<Stats, number>` | Training put into each stat; starts at zero                             |
| `effortBonus`          | `number`                | Effort granted by wings, over the level allowance                       |
| `friendship`           | `number`                | 0-255; a missing field reads as `BASE_FRIENDSHIP`                       |
| `origin.timestamp`     | `number`                | Snapshot window the spawn belonged to                                   |
| `origin.x`, `origin.y` | `number`                | Chunk coordinates                                                       |
| `origin.biome`         | `Biome`                 |                                                                         |

Queried by `listCaught` with `where('owner', '==', uid)`, which needs a
single-field index on `owner` — Firestore provides that automatically.

## Training and friendship

Effort is not earned from what a pokemon happened to fight. Every level pays
`EFFORT_PER_LEVEL` (5) points into a pool the player spends where they like, so
a freshly caught level 20 pokemon arrives with 100 points nobody has assigned.
The arithmetic is in [`src/auth/effort.ts`](../../src/auth/effort.ts) and both
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
  with a negative amount. Nothing is consumed — the points came with the levels.
- **`useWing`** spends a wing for `WING_EFFORT` (3) points in the wing's own
  stat and raises `effortBonus` by the same, so a wing grants training rather
  than spending the pool. That is what makes one worth the same at level 5 as at
  100.
- **`feedEffortBerry`** spends a bitter berry to take `BERRY_EFFORT_DROP` (10)
  points off one stat. They return to the pool rather than being lost, and the
  pokemon thinks better of the player for it.

Every one of them rescales `health` the way a bottle cap does: a bigger pool
keeps the share the pokemon was carrying.

Friendship follows the mainline's Gen 4 rules, tiered so that every gain shrinks
as the number grows ([`src/data/constants/friendship.ts`](../../src/data/constants/friendship.ts)):

| What happened    | Where it is written                   | 0-99 | 100-199 | 200-255 |
| ---------------- | ------------------------------------- | ---- | ------- | ------- |
| Level taken      | `useCandy`                            | +5   | +3      | +2      |
| 256 steps walked | `recordSteps`, for a hatched buddy    | +2   | +2      | +1      |
| Bitter berry fed | `feedEffortBerry`                     | +10  | +5      | +2      |
| Herbal medicine  | `useHealingItem`, per mouthful        | -5   | -5      | -10     |
| Knocked out      | `recordAftermath`, when health hits 0 | -1   | -1      | -1      |

A catch starts at `BASE_FRIENDSHIP` (70) and something hatched starts at
`HATCHED_FRIENDSHIP` (120) — the carrying has already happened.

Herbal medicine is the one loss that **grows** with the band, which is the
mainline's own asymmetry: a pokemon that hardly knows the player swallows
something horrible and shrugs, while one that trusted them takes it badly.

Every **gain** above is doubled for a pokemon whose `ball` is a **Luxury Ball**
(`friendshipFactor`); neither loss is. The ball is a field of the record, so the
bonus is decided at the catch and holds for good, and no writer has to look
anything else up to apply it.

### Packed fields

Four groups of fields are stored as integers rather than as the shapes a
reader wants, and each is one call away in either direction
([`flags.ts`](../../src/data/constants/flags.ts),
[`stats.ts`](../../src/data/constants/stats.ts),
[`status.ts`](../../src/data/ids/status.ts),
[`slots.ts`](../../src/data/constants/slots.ts)):

| Stored     | Was                              | Read with                       |
| ---------- | -------------------------------- | ------------------------------- |
| `flags`    | `shiny`, `shadow`, `egg`, `lock` | `hasFlag` / `withFlag`          |
| `ivs`      | `Record<Stats, number>` of six   | `getIV` / `setIV` / `unpackIVs` |
| `statuses` | `Statuses[]`                     | `statusFlag` / `unpackStatuses` |
| `slots`    | Three shared constants           | `getSlots` / `withSlots`        |

`slots` is how much room this pokemon has for each of its three lists —
abilities, held items, moves — three bits each, stored **0-based** so a count of
one reads out of a zero. A ceiling belongs to the individual rather than to the
game: a shadow carries two abilities where everything else carries one, and it
keeps that room once purified. The defaults are 1 ability (2 for a shadow), 1
held item and 4 moves, and three bits gives each of them room to reach 8.

Both places that enforce a ceiling read it off the record rather than off a
constant: `giveItem` asks `Slots.Item` before it hands anything over, and
`teachMove` asks `Slots.Move` to decide whether a machine teaches a further move
or costs one. A record written before the field existed reads its old defaults
from its own abilities, so nothing needs backfilling.

`statuses` is a bitfield of its own — `StatusFlags`, six flags starting at the
first bit — rather than shifts of the battle engine's `Statuses` enum. A stored
record should not have its layout decided by where a status happens to sit in an
enum the engine owns, and a volatile status has no bit at all, so a report
claiming a pokemon is confused cannot be written even by accident. `statusFlag`
and `flagStatus` are the only place the two numberings meet.

The reasons are the same in each case. A record that answers half a dozen
yes-or-no questions answers them in one field; a snapshot copies one field
instead of six; a set of named things compares, unions and masks as an integer
(what a Full Heal takes off is one AND, not a filtered list); and the next
question costs a bit rather than a migration.

Two rules keep that honest. **A flag's bit is never reused** — a stored record
carries no version number, and the day one bit means two things is the day old
records start lying. And **a writer that cares about one bit passes the others
through**: `lockFields(flags, startedAt)` takes the current flags and hands back
the same ones with `Locked` set, so locking a pokemon cannot drop the fact that
it sparkles.

`individualValue` stays exactly where it was, beside the packed `ivs`. It is the
32-bit roll the values were originally sliced from; the two agree for a wild
catch and disagree for a bred egg or a polished one, which is the whole reason
both are kept.

`species`, `level`, `ivs`, `health` and `statuses` are the mutable fields: `useCandy` raises the level,
`evolveCatch` in [`src/auth/evolution.ts`](../../src/auth/evolution.ts) swaps the
species, and a bottle cap polishes the values (see [Bottle
caps](#bottle-caps)). An evolution that uses an item decrements
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

## Health and status

A battle leaves a party where it left it. A pokemon walks out of a raid at
whatever health it had when the boss fell, still burned if it was burned, and
walks into the next fight that way — which is what makes a party something a
player looks after rather than a row of levels. The report that writes it is
[`battleAftermaths`](raids.md#battleaftermathsbattleiduid); the rules both sides
read are in [`src/auth/health.ts`](../../src/auth/health.ts).

**Maximum health is derived, never stored.** It comes from the same formula the
battle fights on (`getHealthStat` in
[`src/data/constants/stats.ts`](../../src/data/constants/stats.ts)), so it follows
a level, an evolution or a polished value on its own. Only the current figure is
a field.

**When the maximum moves, the share moves with it.** A pokemon at 50 of 100
comes out of an evolution at 60 of 120, and out of a bottle cap the same way.
Two edges are deliberate: a pokemon that was down stays down — an evolution is
not a revival — and one that was up never falls to zero on a rounding step.

The same rescaling happens **into** a battle. An ability can change what a
unit's pool is worth — a `Boss` carries a raid-sized one — and the record it was
copied from knows nothing about that, so the stored health is read against the
stored maximum and applied against the pool the unit actually fights with. A
boss at full takes the field at full rather than at a tenth of itself, and a
half-hurt pokemon stays half hurt whatever its pool turns out to be.

**Only non-volatile statuses survive, and all of them do.** Poison, bad poison,
sleep, paralysis, a burn and ice are carried out; confusion, flinching, a
substitute and the field's own effects end with the battle. A unit can hold
several at once — poisoned and asleep is an ordinary way to come out of a raid —
so the record keeps the whole list, and a berry clears everything it covers
rather than the first thing it finds. Stored statuses are applied to the unit
when it is fielded, through the ordinary path — so an immunity refuses one, and
a held Rawst Berry eats itself to cure the burn before the first turn.

**A fainted pokemon cannot fight.** `joinRaid` refuses a party holding one, and
`publishTeamSnapshot` drops one from the freeze; a team that fields nothing is
no team, so a party of fainted pokemon cannot start a battle at all.

Three things put a pokemon right, and they all run through one call —
`useHealingItem` ([`src/server/healing.ts`](../../src/server/healing.ts)) — with
`healedByItem` deciding what any given item is worth to any given pokemon:

- **A berry.** What each one restores or cures is the berry's own table in
  [`src/data/items/berries.ts`](../../src/data/items/berries.ts), shared with the
  battle, so an Oran Berry is worth ten points on either side of a fight. The
  battle's threshold is a battle rule only: out of one, the player decides when
  it is worth it.
- **Medicine**, in [`src/data/items/medicine.ts`](../../src/data/items/medicine.ts).
  A **potion** gives health back (20 / 60 / 120 / the whole pool), a **cure**
  takes a status off (one each for poison, burns, ice, sleep and paralysis; a
  Full Heal takes the lot), a **Full Restore** does both, and a **revive** brings
  a fainted pokemon round on half a pool — a Max Revive on a whole one. Unlike a
  berry, none of it is holdable: a potion cannot be drunk mid-raid, which is what
  keeps a berry worth carrying into one. Medicine is the one thing gold is always
  worth spending on, so all of it is `Marketable`, and the everyday half of it is
  in the overworld item pool as well.
- **Herbal medicine**, the same file's last four entries. Each undercuts the
  bottle it competes with and does more of the job — Energy Powder 50 points,
  Energy Root 200, Heal Powder every status, Revival Herb a whole pool off the
  floor — and is paid for in `friendship` instead. `bitter` on the entry is how
  many mouthfuls it counts as, and `useHealingItem` docks
  `gainFriendship(current, 'herb', mouthfuls)` in the **same write** as the
  healing, so the cure and its cost can never come apart. The `factor` is not
  passed: a Luxury Ball multiplies gains and never losses.
- **A level**, through `useCandy` — the slow way. Growing is also mending: a
  level comes with full health and a clean slate.

Two rules cut across all of it. **A revive is the only thing that reaches a
fainted pokemon**, and the only thing that does nothing to one still standing —
a potion poured over a pokemon that is already down does nothing, exactly as in
the mainline games. And **an item that would change nothing is refused rather
than spent**: the wrong cure, a pokemon already whole, a Leppa or a Persim, whose
effects nothing stores.

A record written before these fields existed has neither, and reading a missing
`health` as zero would faint every pokemon caught until now. Missing means
whole: `asCaughtPokemon` derives the maximum for those records, which is what
they meant.

## What the player sets

Four of the six `PokemonFlags` are the game's own — shiny, shadow, egg, and the
battle lock. Two are the player's, set from the catch dialog and cleared the same
way, and neither says anything about the pokemon itself:

| Flag       | Button              | What it refuses                                                                                  |
| ---------- | ------------------- | ------------------------------------------------------------------------------------------------ |
| `Favorite` | Favorite/Unfavorite | Releasing, listing at auction, and trading when there is trading                                 |
| `Guarded`  | Lock/Unlock         | Levels, training, values moved, evolution, fights, healing, purifying, items given or taken back |

They answer different questions on purpose. A **favorite** is about *parting*
with a pokemon: it guards the two irreversible things a mis-click can do —
`releaseCatch` deletes a record outright, and `openAuction` puts one somewhere it
cannot be taken back from. It changes nothing about what the pokemon can do, so a
favorite still fights, still trains and can still be a buddy.

A **guarded** pokemon is about *keeping one as it is*. The line is drawn around
the sheet: anything that would rewrite a stored field is refused, and anything
that only ever adds to the pokemon is left alone.

Refused: `useCandy` (a level), `trainEffort`, `useWing` and `feedEffortBerry`
(effort), `useBottleCap` (values), `evolveCatch`, `useHealingItem`,
`usePurifyingGem`, `visitNurse` (she heals and purifies), `joinRaid`, and both
`giveItem` and `takeItem` — a locked pokemon is not reached into in either
direction, so what it is holding stays what it was holding.
`publishTeamSnapshot` drops it from a party the way it drops an egg or a fainted
pokemon, so a rocket fight leaves it behind too.

Still allowed: walking as the **buddy** and the steps that come with it,
**friendship** from every source that grants it, and standing as a **parent** at
the breeder — `breedCatches` consumes neither parent and writes the egg as a
third record, so a locked pokemon comes back from the breeder exactly as it left.
`groomCatch` is allowed for the same reason: friendship is the one field a lock
does not fence off.

Neither flag is enforced by the client. Every one of those calls checks the
stored record, through `isFavoriteRecord` and `isGuardedRecord` in
[`src/server/catch-fields.ts`](../../src/server/catch-fields.ts); the catch dialog
greys out every section a lock refuses, and the pickers say *a favorite* or
*locked* so the refusal is visible before the press.

`setFavorite` and `setGuarded` ([`src/server/caught.ts`](../../src/server/caught.ts))
write through `withFlag`, so setting one cannot drop another — a shiny shadow
stays a shiny shadow — and both refuse while the pokemon is **fighting**, the way
every other edit to a live record does.

## Whose hands it has passed through

`history` is one entry per owner, oldest first, and each says **when** that owner
received it — a local ISO 8601 string in *their* own zone, the way a catch date
is — and **how**:

| `Acquisition` | Written by     | What it means                              |
| ------------- | -------------- | ------------------------------------------ |
| `Caught`      | `recordCatch`  | They threw the ball                        |
| `Egg`         | `writeEgg`     | It came to them as an egg, nest or breeder |
| `Auction`     | `claimAuction` | They won it on the block                   |
| `Trade`       | nothing yet    | Reserved for trading                       |

It is a different question from the record's own `type`
([Encounter kinds](encounters.md#encounter-kinds)), which says how the pokemon
was first met and never changes. A Mewtwo can be a legendary raid prize *and*
something its second owner bought, and the two fields say so separately.

`Trade` exists before trading does on purpose: a member added later would leave
old records needing to be told apart from new ones by their shape.

A record written before the field existed still reads correctly, because both
cases are knowable. The **first** entry is where the pokemon began, which the
record's `type` already says — `Hatched` means an egg, anything else means a
catch — and every entry **after** it can only be a sale, since the auction house
has been the one thing that ever appended one. `reclaimAuction` appends nothing:
an unsold lot came back to the same person.

The catch dialog shows the chain under **Owners**, oldest first: who, how they
came by it, and the day they did. Names come from `profiles/{uid}`, which every
signed-in player can read — that is what a nickname is for — and the reader is
"You" rather than their own nickname. A trainer whose profile has since gone
still holds their place in the list as "A trainer": an owner is a fact about the
pokemon, and a missing profile must not quietly shorten its history.

## Where it came from

`type` says how a pokemon was met — see
[Encounter kinds](encounters.md#encounter-kinds) — and for a raid prize `lair`
says **where**. It is the same field the lobby was named after
([Raids](raids.md)), so a record reads the way the raid did: a Mewtwo won under
a mountain says `Cerulean Cave`, and a shadow raid that stood in no named place
says `Shadow Mountain Lair`, derived from the `origin.biome` beside it.

Everything met any other way carries `null` there and is described by its
encounter kind alone.

A **mythical** goes further: its `origin.biome` is `Biome.Beyond`, a biome that
is nowhere on the map. No climate targets it (`BIOME_CONFIGS` excludes it by
type, so `getBiome` cannot return it), no spawn pool is registered for it, and
nothing is ever generated there. A relic is spent wherever the player happens to
be standing, but that chunk is not where the pokemon came from — walking back to
it finds nothing — so the record says `Beyond` rather than naming a place that
would be a lie.

## Bottle caps

Individual values are rolled once, when the encounter is staged, and nothing
else in the game moves them afterwards — which is what makes a bad roll on a
pokemon somebody already raised worth an item of its own.

`useBottleCap` ([`src/server/bottle-caps.ts`](../../src/server/bottle-caps.ts))
spends one and writes `ivs` in the same transaction, so a cap is never spent on
a pokemon that did not change and a pokemon never changes without one being
spent. Which stats it raises is the **server's** roll, seeded by the catch, the
item and the instant: a client that chose would simply choose the stat it
wanted, and the cap would stop being a cap.

| Item                  | Band    | What it does                                    |
| --------------------- | ------- | ----------------------------------------------- |
| **Golden Bottle Cap** | Special | Raises every value to `MAX_IV` (31)             |
| **Bottle Cap**        | Rare    | Raises one value, drawn from the imperfect ones |

Both are found in the overworld item pool and nowhere else: neither is stocked,
neither is holdable, and each is consumed by the use. The rules both sides read
live in [`src/data/items/bottle-caps.ts`](../../src/data/items/bottle-caps.ts).

Only stats below `MAX_IV` are drawn from, so a plain cap never lands on a stat
that needed nothing — the item is spent either way, and a pick that could waste
it would make the cap worse the closer a pokemon came to perfect. A pokemon that
is **already perfect** is refused outright, on both sides: the dialog hides the
buttons and the server returns null without touching the bag.

The use is refused for the same reasons every other catch write is: the catch is
not the player's, it is locked into a live battle, or it is still an egg — what
is inside an egg was decided when it was found and stays that way until it
hatches.

`individualValue` is not rewritten. It is the roll the encounter was staged
from, and the stored per-stat values are what every reader uses — the same
reason a bred egg's `ivs` can disagree with it.

## Purifying a shadow

A shadow catch comes out of a shadow raid carrying the `Shadow` ability for good
and paying twice the candy at every level. The **Purifying Gem** — a rare find
in the overworld item pool, never stocked — undoes that trade, and the rules for
it live in
[`src/data/items/purifying-gem.ts`](../../src/data/items/purifying-gem.ts).

Three fields move, in one transaction with the gem leaving the bag
([`src/server/purify.ts`](../../src/server/purify.ts)):

| Field       | Before             | After                                   |
| ----------- | ------------------ | --------------------------------------- |
| `abilities` | `[rolled, Shadow]` | `[rolled, Purified]`                    |
| `flags`     | `Shadow` bit set   | `Shadow` bit clear — candy cost reverts |
| `ivs`       | as rolled          | every value `+PURIFY_IV_BOOST`, capped  |

`Purified` is **entirely cosmetic**: no listener reads it, nothing in a battle
changes. It is the mark left where the `Shadow` ability was, so a pokemon that
came out of a shadow raid still says so afterwards — purifying changes what it
costs, not what it was.

The doubled levelling cost is read off the `Shadow` **flag** rather than the
ability (`getCandyCost` in
[`src/auth/candy-rules.ts`](../../src/auth/candy-rules.ts)), so clearing that bit
is what reverts it. Nothing else in the flags is touched: a shiny shadow is
still shiny.

Health is rescaled with the change, since two more HP points is a bigger pool
and the share of it the pokemon was carrying is what it keeps. A pokemon that is
not a shadow is refused outright — a gem spent on nothing would be a rare item
wasted — as is one that is not the player's, is locked into a battle, or is
still an egg.

The gem is not the only way. **Nurse Joy** purifies for free, along with the
healing, once per NPC window — see
[Wandering NPCs](overworld.md#wandering-npcs).

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

## Escrow

A pokemon put up for auction is not deleted and not held anywhere else: it stays
its own document with `owner` set to the empty string, which is nobody. Every
write that touches a catch asks whether the caller is its `owner`, and a uid is
never empty, so an escrowed pokemon is refused to the seller, the bidders and
everyone else by the checks that were already there — while staying **readable**,
which is what lets a bidder see what they are bidding on. Collecting the lot
writes the winner's uid into `owner`, appends the sale to `history` and resets
`friendship` to `BASE_FRIENDSHIP` — the pokemon has just met its new trainer, and
what it thought of the last one was theirs. A lot nobody bid on goes back to the
seller instead, which restores `owner` and leaves both `history` and `friendship`
alone — it never changed hands. See [Auctions](auctions.md).

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
`evolveCatch` turn it down, `openAuction` will not put one on the block — a
bidder cannot see into one and the seller can — `publishTeamSnapshot` leaves it
out of the party it freezes, and `resolveBuddy` reports no buddy effects for one
— it is carried, not accompanied, so its ability and nature change nothing in
the overworld.

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

The stream is seeded by the pair, the window, the player and the instant, so the
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

`hatchSteps` is settled when the egg is written, and two things move it: a shadow
egg doubles it, and a **Flame Body** buddy standing beside the player at the
pick-up halves it. Both are frozen onto the record rather than asked again during
the walk — once an egg is being carried it *is* the buddy, so there is nothing
beside the player left to ask.

A report also credits whatever a **Pickup** buddy found along the way: the same
call rolls it from the item pool and writes the stack in the same transaction, so
a find cannot be reported twice or lost between the walk and the bag.

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
