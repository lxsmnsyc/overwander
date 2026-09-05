# Catch records

Written by `recordCatch` in
[`src/server/caught.ts`](../../src/server/caught.ts). A catch is one `caught` row
under a 20-character id, plus four child tables that hang off it by foreign key:
`caught_moves`, `caught_abilities`, `caught_items` and `caught_history`. All five
are written in one transaction, and a reader unpacks them in one query with
PostgREST embeds.

## `caught`

| Column                                | Type        | Notes                                                  |
| ------------------------------------- | ----------- | ------------------------------------------------------ |
| `id`                                  | `text`      | 20-character id, and the primary key                   |
| `owner`                               | `uuid`      | Current owner; null while a lot sits in escrow         |
| `type`                                | `smallint`  | `EncounterType`: how it was originally met             |
| `species`                             | `integer`   |                                                        |
| `nickname`                            | `text`      | What its owner calls it; empty until named             |
| `level`                               | `smallint`  | 1 to 100, checked                                      |
| `individual_value`                    | `integer`   | 32-bit roll the values were sliced from                |
| `trait_value`                         | `integer`   | 32-bit roll driving level, gender, ability, nature     |
| `ivs`                                 | `integer`   | The six 0-31 values, five bits each, in stat order     |
| `gender`, `nature`                    | `smallint`  |                                                        |
| `slots`                               | `smallint`  | Room for abilities, held items and moves               |
| `shiny`, `shadow`, `egg`              | `boolean`   | What it is                                             |
| `traded`                              | `boolean`   | Has changed hands; opens a trade evolution             |
| `favorite`, `guarded`                 | `boolean`   | See [What the player sets](#what-the-player-sets)      |
| `auctionable`                         | `boolean`   | Advisory; the opener re-derives it                     |
| `locked_at`                           | `bigint`    | `started_at` of the battle holding it; 0 when free     |
| `steps`                               | `integer`   | Steps walked in the shell; only eggs accrue any        |
| `hatch_steps`                         | `integer`   | What hatching costs, frozen when the egg was found     |
| `stepped_at`                          | `bigint`    | Server instant steps were last credited at             |
| `walked`                              | `integer`   | Steps walked as buddy since hatching                   |
| `health`                              | `integer`   | Health left; 0 is fainted. The maximum is derived      |
| `statuses`                            | `smallint`  | Mask of the non-volatile statuses it carries           |
| `lair`                                | `smallint`  | Where a raid prize was won, else null                  |
| `ball`                                | `integer`   | Ball the catch was made with                           |
| `caught_at_local`, `caught_at_offset` | `timestamp` | The catcher's wall clock and their zone ([Time][time]) |
| `locale`                              | `text`      | The catcher's locale tag, e.g. `en-PH`                 |
| `ev_hp` … `ev_spe`                    | `smallint`  | Training put into each stat; starts at zero            |
| `effort_bonus`                        | `smallint`  | Effort granted by wings, over the level allowance      |
| `friendship`                          | `smallint`  | 0 to 255, checked                                      |
| `origin_timestamp`                    | `bigint`    | Snapshot window the spawn belonged to                  |
| `origin_x`, `origin_y`                | `integer`   | Chunk coordinates                                      |
| `origin_biome`                        | `smallint`  |                                                        |
| `origin_place`                        | `text`      | The named place, where there was one                   |

Four child tables carry what a pokemon has several of, one row per slot:

| Table              | Row                                                                     |
| ------------------ | ----------------------------------------------------------------------- |
| `caught_moves`     | `(slot, move, points)`; a move and its PP Ups travel together           |
| `caught_abilities` | `(slot, ability)`; the rolled one, plus Shadow for a shadow             |
| `caught_items`     | `(slot, item)`; held items, up to `HELD_ITEM_LIMIT`                     |
| `caught_history`   | `(seq, owner, owner_name, acquired_at, kind, paid, ball)`, oldest first |

Each cascades on delete, so releasing a pokemon takes its moves and its history
with it in one statement.

Columns are snake_case and the TypeScript record that reads them is camelCase;
[`caught-rows.ts`](../../src/auth/caught-rows.ts) is where the two meet. A box is
still one query however many pokemon are in it, because the children ride along
as PostgREST embeds (`CAUGHT_EMBED`).

The two 32-bit rolls, the packed `ivs`, the `slots` triple and the `statuses`
mask stay packed integers. The engine consumes each whole, so unpacking them into
columns would only build a shape the code immediately re-packs. Where a search
needs to see inside one, the schema adds a generated column rather than changing
how it is stored.

`setNickname` is what writes it. The server cleans what it is handed rather than
trusting it: `asNickname` trims the ends, counts a run of spaces as one, drops
control characters and cuts the rest to `NICKNAME_LIMIT`. A name that cleans to
nothing empties the column. A **guarded** catch may still be named, since what
guarding protects is everything that changes what a pokemon _is_; a **fighting**
one may not, for the usual reason.

An empty `nickname` is not a missing one: it means nobody has named this pokemon,
and every reader calls it by its species instead (`getCatchName`). The species'
name is **not** copied into the column on creation, because a stored copy goes
stale the moment the pokemon evolves: an unnamed Bulbasaur should read as
Venusaur afterwards, not as a Venusaur called Bulbasaur. A pokemon that was named
keeps its name through evolution, which is the point of having given it one.

Queried by `listCaught` with `owner = uid`, on the `caught_owner` index.

### Searching a box

The search box over a box of pokemon takes `field:value` pairs (`type:fire
is:shiny level:30-60`, quoting anything with a space) and runs in **two
passes**. Every yes-or-no fact is asked through one field: `is:shiny`,
`is:favorite`, `not:fainted`, rather than a field each with a 1 or a 0 after it.
`planCatchSearch` works out which terms the store can answer and `searchCaught`
asks them beside the owner; everything else is answered by `matchesCatch` over
what came back.

Three things widen a term rather than narrowing it. A leading `!` refuses it
(`!is:egg`), a `|` inside a value accepts any of its alternatives
(`type:fire|water`), and a numeric value takes a comparison (`level:>50`) or a
range (`level:30-60`, `caught:2026-01..2026-06`) as well as an exact number.

`sort:` and `order:` are the exception to all of it: they arrange the answers
rather than narrowing them, so a matcher skips them and `orderCatches` applies
them last, over whatever the predicate kept. A `sort:` word nothing has a
reading for leaves the box in the order it arrived. There is no `limit:`: a box
that already pages has nothing to do with one.

#### What the box offers

Neither the grammar nor the four dozen fields are worth memorising, so the box
says what it knows. Each search declares a **vocabulary**: its field names, one
line about each, and the values a field takes where there is a closed list of
them. `CATCH_VOCABULARY`, `ITEM_VOCABULARY`, `AUCTION_VOCABULARY` and `TEAM_VOCABULARY`
read their field lists off the tables that answer the fields, so a field added
there arrives in the box on its own; only the line about it is written by hand,
and a test fails where one is missing.

The box uses the vocabulary three ways. It finishes the word the caret is in,
offering field names before the colon and that field's values after it, with Tab
taking the highlighted offer or filling in as far as every offer agrees. It keeps
every finished term as a badge **inside the box**, coloured by what the term does.
Blue narrows, amber refuses, grey arranges, and red is a field nobody has a
reading for, which matches nothing rather than being ignored. Each badge carries
a cross that takes the term back off. A term becomes a badge once a space follows
it, and Backspace at the head of the box takes the last one apart to be edited.
And it carries the grammar itself on a card behind the information icon, written
in the vocabulary's own words so the card attached to the bag is about the bag.

#### What the store answers

A term is pushed only when the query is **implied** by the predicate, since a
narrowing that drops a record the runtime would have kept is a wrong answer
rather than a faster one. What that leaves is:

| Kind               | Terms                                                                            | How                                                       |
| ------------------ | -------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Columns of the row | `level`, `friendship`, `walked`, `steps`, `hatch`, `hp`, `bonus`, `iv`, `caught` | A comparison each, or a pair for a range                  |
| Names of ids       | `species`, `family`, `nature`, `gender`, `ball`, `met`, `biome`, `lair`          | `eq` for one, `in` for several, with no cap on how many   |
| Substrings         | `nickname`, `place`, `locale`                                                    | `ilike`, on the trigram indexes                           |
| Child tables       | `move`, `ability`, `item`, `got`, `from`, `paid`, `pp`                           | An inner join, one alias per term                         |
| Rows elsewhere     | `is:buddy`, `is:listed`, `is:raiding`                                            | An inner join on `profiles`, `auctions` or `team_catches` |
| Marks              | every `is:`/`not:` word with a column behind it                                  | An equality on that column                                |

Each joined term gets an **alias of its own** (`q0`, `q1`), for two reasons.
Two terms over one table are two rows, so `move:ember move:growl` is a pokemon
that knows both rather than one move that is somehow both. The aliased join sits
beside the embed the reader unpacks rather than filtering it, so a pokemon does
not come back holding only the move that was searched for.

Three shapes are not stored as they are asked, so
[`20260821000100_search.sql`](../../supabase/migrations/20260821000100_search.sql)
generates a column each: the six values out of the packed `ivs`, the six statuses
out of the packed mask, `hatch_left` out of the difference between two columns,
and trigram indexes for the substring matches.

#### What the box answers

A plain name is read rather than queried: it matches the nickname or the
species, which is two columns and a fallback rather than one filter. So is
`type:`, which is a fact about the species rather than about the row: it would
be `species in [...]`, which fits for Fire and not for Water, and quick for half
the game and slow for the other half is worse than being the same either way.
So are `hands` and `moves`, which are counts nothing stores; `is:evolvable`,
which the species registry knows and no column does; and `is:duplicate`, which
is a fact about the whole box rather than about any row in it.

Most of what a search can ask is answered here, because most of it is derived
rather than stored:

| Terms                                                                             | Derived from                                                                                |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `hp:<50%`                                                                         | The share of `getMaxHealth`, which follows the species, the level and the values            |
| `stat:spe:>120`                                                                   | The stat as a sheet prints it: base, level, values, training and nature                     |
| `weak:`, `resists:`, `immune:`                                                    | The type chart against the species' types, multiplied the way a hit is                      |
| `is:hurt`, `is:trainable`, `is:stab`, `is:hidden`                                 | Missing health, unspent effort, a move of its own type, its species' rarer ability          |
| `learns:`, `move-type:`                                                           | The learnset, and the types of the moves it knows                                           |
| `dex:`, `category:`, `egg-group:`, `catch-rate:`, `rarity:`, `spawns:`, `active:` | The species registry. `dex:` is the one that pushes, since a dex range is a list of species |
| `weight:`, `height:`                                                              | `deriveSize` off the trait value, so two of a species disagree                              |

`spawns:` and `biome:` are a pair worth keeping apart: the first is where the
species lives, the second is where this one was met.

A refused term is pushed only where the store can state the opposite exactly: a
plain equality inverts, a range would be two queries either side of it, and the
opposite of a join is a row that must **not** exist, which an inner join cannot
say. A value with alternatives is pushed where the alternatives collapse into
one `in` and left behind where they do not, since "either of two columns" is not
a filter.

#### What a search cannot be told

`is:buddy`, `is:listed`, `is:raiding` and `is:duplicate` are not in the record.
The box reads them once beside its rows, with `readCatchContext` for the first
three and `findDuplicates` over what was loaded for the last, and passes them in as a
`CatchContext`. A list that read none of them answers those marks **no**, which
is the same answer an unknown field gets and for the same reason: a term that
cannot be answered hides the row rather than being quietly dropped.

The **bag** takes the same grammar and has no query half at all: it is one row
per stack, read whole however much is in it, and every term is answered over what
came back. See [`src/data/items/search.ts`](../../src/data/items/search.ts).

## Training and friendship

Effort is not earned from what a pokemon happened to fight. Every level pays
`EFFORT_PER_LEVEL` (5) points into a pool the player spends where they like, so a
freshly caught level 20 pokemon arrives with 100 points nobody has assigned. The
arithmetic is in [`src/auth/effort.ts`](../../src/auth/effort.ts), and both sides
read it: the catch sheet to say what is possible, the server to decide it again
against the stored record.

| Quantity | How it is worked out                        |
| -------- | ------------------------------------------- |
| budget   | `level * EFFORT_PER_LEVEL + effortBonus`    |
| spent    | The six `effortValues` added up             |
| unused   | `budget - spent`, never below zero          |
| per stat | Never more than `MAX_EFFORT_PER_STAT` (252) |

Three server calls in [`src/server/training.ts`](../../src/server/training.ts)
move it, each in one transaction:

- **`trainEffort`** spends unused points into a stat, or takes them back out with
  a negative amount. Nothing is consumed, since the points came with the levels.
- **`useWing`** spends a wing for `WING_EFFORT` (3) points in the wing's own stat
  and raises `effortBonus` by the same, so a wing grants training rather than
  spending the pool. That is what makes one worth the same at level 5 as at 100.
- **`feedEffortBerry`** spends a bitter berry to take `BERRY_EFFORT_DROP` (10)
  points off one stat. They return to the pool rather than being lost, and the
  pokemon thinks better of the player for it.

Every one of them rescales `health` the way a bottle cap does: a bigger pool
keeps the share the pokemon was carrying.

Friendship follows the mainline's Gen 4 rules, tiered so that every gain shrinks
as the number grows
([`src/data/constants/friendship.ts`](../../src/data/constants/friendship.ts)):

| What happened    | Where it is written                   | 0-99 | 100-199 | 200-255 |
| ---------------- | ------------------------------------- | ---- | ------- | ------- |
| Level taken      | `useCandy`                            | +5   | +3      | +2      |
| 256 steps walked | `recordSteps`, for a hatched buddy    | +2   | +2      | +1      |
| Bitter berry fed | `feedEffortBerry`                     | +10  | +5      | +2      |
| Herbal medicine  | `useHealingItem`, per mouthful        | -5   | -5      | -10     |
| Knocked out      | `recordAftermath`, when health hits 0 | -1   | -1      | -1      |

A catch starts at `BASE_FRIENDSHIP` (70). Something hatched starts at
`HATCHED_FRIENDSHIP` (120), since the carrying has already happened.

Herbal medicine is the one loss that **grows** with the band, which is the
mainline's own asymmetry: a pokemon that hardly knows the player swallows
something horrible and shrugs, while one that trusted them takes it badly.

Every **gain** above is doubled for a pokemon whose `ball` is a **Luxury Ball**
(`friendshipFactor`); neither loss is. The ball is a field of the record, so the
bonus follows whatever ball the pokemon is in now, and since `useBall`
([`balls.ts`](../../src/server/balls.ts)) lets an owner spend a spare ball to
replace it, the bonus can be bought for a pokemon that was caught in something
else. What a ball did at the moment of the catch, such as a Heal Ball mending it or
the odds a Dusk Ball improved, was settled then and is not revisited.

### Packed fields

Three groups of fields are stored as integers rather than as the shapes a reader
wants, and each is one call away in either direction
([`stats.ts`](../../src/data/constants/stats.ts),
[`status.ts`](../../src/data/ids/status.ts),
[`slots.ts`](../../src/data/constants/slots.ts)):

| Stored     | Was                            | Read with                       |
| ---------- | ------------------------------ | ------------------------------- |
| `ivs`      | `Record<Stats, number>` of six | `getIV` / `setIV` / `unpackIVs` |
| `statuses` | `Statuses[]`                   | `statusFlag` / `unpackStatuses` |
| `slots`    | Three shared constants         | `getSlots` / `withSlots`        |

`slots` is how much room this pokemon has for each of its three lists: abilities,
held items and moves. Three bits each, stored **0-based** so a count of
one reads out of a zero. A ceiling belongs to the individual rather than to the
game: a shadow carries two abilities where everything else carries one, and it
keeps that room once purified. The defaults are 1 ability (2 for a shadow), 1
held item and 4 moves, and three bits gives each of them room to reach 8.

Both places that enforce a ceiling read it off the record rather than off a
constant: `giveItem` asks `Slots.Item` before it hands anything over, and
`teachMove` asks `Slots.Move` to decide whether a machine teaches a further move
or costs one. A record written before the field existed reads its old defaults
from its own abilities, so nothing needs backfilling.

`statuses` is a bitfield of its own, `StatusFlags` with six flags starting at the
first bit, rather than shifts of the battle engine's `Statuses` enum. A stored
record should not have its layout decided by where a status happens to sit in an
enum the engine owns. A volatile status has no bit at all, so a report claiming a
pokemon is confused cannot be written even by accident. `statusFlag` and
`flagStatus` are the only place the two numberings meet.

The reason is the same in each case: a set of named things compares, unions and
masks as an integer, so what a Full Heal takes off is one AND rather than a filtered list,
and the shape a reader wants is one call away.

### The marks are columns, not bits

`shiny`, `shadow`, `egg`, `favorite` and `guarded` are boolean columns rather than
bits of one packed mark, because each is something a box search filters on:
`listCaughtMarked(owner, 'shiny')` is a plain equality beside the owner, where a
packed value could only be compared whole.

#### `auctionable` is the sixth, and a different kind

The other five are **stated** about a record. `auctionable` is **derived** from
three columns the row already carries (`ivs`, `shiny` and `species`) and stored
anyway. It answers "would somebody else pay for this": perfect values, **no**
values, shiny, or a special-tier species. See
[`isAuctionableCatch`](../../src/auth/caught-record.ts), and
[Auctions](auctions.md#what-may-go-on-the-block) for what asks.

Storing a derived value is the thing this codebase otherwise refuses to do: the
world's spawns, landmarks and passers-by are all re-derived rather than kept. It
is kept here because the rule needs the registry rather than the row. Which
species are special-tier is data the database does not have, so the question
cannot be asked of it as a filter, and the sell picker would otherwise read every
pokemon a player owns to find the few worth listing.

Two rules keep it from rotting into a lie:

- **Every write that moves an input rewrites it.** Catching, writing an egg, a
  bottle cap (`ivs`), purifying (`ivs`, all six up by two), evolving (`species`).
  Nothing else can change any of the three. `shiny` is fixed at the encounter,
  and hatching only lifts the shell. Both cap paths matter in _both_ directions: a
  cap can complete a perfect set, and it can also break a blank one, which is the
  only way a catch stops being auctionable.
- **Nothing decides anything by it.** `openAuction` re-derives from the record it
  is already holding, and the sell picker re-checks every row the query returns.
  The field can cost a listing its place in a list; it can never authorize one.

**There is no lock among them.** `locked_at` carries the whole answer: a stamp of
zero is a free pokemon, and the stamp itself is what tells this battle's lock from
a later one's.

`individual_value` stays beside the packed `ivs`. It is the
32-bit roll the values were originally sliced from. The two agree for a wild catch
and disagree for a bred egg or a polished one, which is the whole reason both are
kept.

`species`, `level`, `ivs`, `health` and `statuses` are the mutable fields.
`useCandy` raises the level, `evolveCatch` in
[`src/auth/evolution.ts`](../../src/auth/evolution.ts) swaps the species, and a
bottle cap polishes the values (see [Bottle caps](#bottle-caps)). An evolution
that uses an item takes the stack out of `bag_items` in the same transaction, so
the stone and the new species land together or not at all. Criteria are re-checked
against the stored rows inside that transaction, never trusted from the
caller.

Which evolutions are offered comes from
[`src/data/species/evolution.ts`](../../src/data/species/evolution.ts). Four
methods can be verified against what is stored: `Level`, `UsedItem`, `HeldItem`
and `Trade`. An evolution carrying any other flag, such as friendship or
weather, is never offered rather than waved through. A held item is required but
not consumed; only a used item is spent.

`Trade` reads the record's own `traded` field rather than watching a handover
happen. The mainline evolves a pokemon _during_ the trade, which is a moment this
game has nowhere to put, so changing hands opens the evolution and the record
carries the fact for good. Winning a lot at auction is the one handover there is
so far.

An **Everstone** refuses every evolution while it is held, and it answers here
rather than at the moment of evolving, so the catch sheet stops offering what the
stone would refuse.

Catch rows are readable by any signed-in player, since other players inspect a
pokemon before a trade, and writable by nobody but the server.

Held items move through `giveItem` and `takeItem` in
[`src/server/caught.ts`](../../src/server/caught.ts). Each reads the catch and the
inventory stack, then writes the stack and the catch's `items` **in one
transaction**, so an item is never in the bag and on a pokemon at once, nor lost
between them. Only items flagged `Holdable` can be handed over, and a catch holds
at most `HELD_ITEM_LIMIT` (1), matching the battle's per-unit item limit. This is
the path the Shiny Charm needs: a buddy holding it lifts the shiny odds of every
encounter its owner starts.

## Health and status

A battle leaves a party where it left it. A pokemon walks out of a raid at
whatever health it had when the boss fell, still burned if it was burned, and
walks into the next fight that way, which is what makes a party something a
player looks after rather than a row of levels. The report that writes it is
[`battle_aftermaths`](raids.md#battle_aftermaths), and the rules both
sides read are in [`src/auth/health.ts`](../../src/auth/health.ts).

**Maximum health is derived, never stored.** It comes from the same formula the
battle fights on (`getHealthStat` in
[`src/data/constants/stats.ts`](../../src/data/constants/stats.ts)), so it follows
a level, an evolution or a polished value on its own. Only the current figure is a
field.

**When the maximum moves, the share moves with it.** A pokemon at 50 of 100 comes
out of an evolution at 60 of 120, and out of a bottle cap the same way. Two edges
are deliberate. A pokemon that was down stays down, since an evolution is not a
revival, and one that was up never falls to zero on a rounding step.

The same rescaling happens **into** a battle. An ability can change what a unit's
pool is worth, and a `Boss` carries a raid-sized one, and the record it was copied
from knows nothing about that, so the stored health is read against the stored
maximum and applied against the pool the unit actually fights with. A boss at full
takes the field at full rather than at a tenth of itself, and a half-hurt pokemon
stays half hurt whatever its pool turns out to be.

**Only non-volatile statuses survive, and all of them do.** Poison, bad poison,
sleep, paralysis, a burn and ice are carried out; confusion, flinching, a
substitute and the field's own effects end with the battle. A unit can hold
several at once, since poisoned and asleep is an ordinary way to come out of a raid,
so the record keeps the whole list, and a berry clears everything it covers rather
than the first thing it finds. Stored statuses are applied to the unit when it is
fielded, through the ordinary path, so an immunity refuses one and a held Rawst
Berry eats itself to cure the burn before the first turn.

**A fainted pokemon cannot fight.** `joinRaid` refuses a party holding one, and
`publishTeamSnapshot` drops one from the freeze. A team that fields nothing is no
team, so a party of fainted pokemon cannot start a battle at all.

Three things put a pokemon right, and they all run through one call,
`useHealingItem` ([`src/server/healing.ts`](../../src/server/healing.ts)), with
`healedByItem` deciding what any given item is worth to any given pokemon:

- **A berry**, from the table in
  [`src/data/items/berries.ts`](../../src/data/items/berries.ts) that the battle
  shares, so an Oran Berry is worth ten points on either side of a fight. The
  battle's use-at-a-threshold rule is a battle rule only; out of one the player
  decides when it is worth it.
- **Medicine**, in
  [`src/data/items/medicine.ts`](../../src/data/items/medicine.ts): a potion
  (20 / 60 / 120 / the whole pool), a cure for one status or a Full Heal for all
  of them, a Full Restore for both, and a revive that lifts a fainted pokemon on
  half a pool, and a Max Revive on a whole one. None of it is holdable, which is what
  keeps a berry worth carrying into a raid, and all of it is `Marketable`.
- **Herbal medicine**, the same file's last four entries: cheaper than the bottle
  each competes with and better at the job. Energy Powder is 50 points, Energy
  Root 200, Heal Powder every status and Revival Herb a whole pool off the floor, and
  paid for in `friendship`. `bitter` is how many mouthfuls it counts as, and
  `useHealingItem` docks `gainFriendship(current, 'herb', mouthfuls)` in the
  **same write** as the healing, so the cure and its cost cannot come apart. No
  `factor` is passed: a Luxury Ball multiplies gains and never losses.
- **A level**, through `useCandy`. Growing is mending too: a level comes with full
  health and a clean slate.

Two rules cut across all of it. **A revive is the only thing that reaches a
fainted pokemon**, and the only thing that does nothing to one still standing. A
potion poured over a pokemon that is already down does nothing, exactly as in the
mainline games. And **an item that would change nothing is refused rather than
spent**: the wrong cure, a pokemon already whole, or a Leppa or Persim, whose
effects nothing stores.

A record written before these fields existed has neither, and reading a missing
`health` as zero would faint every pokemon caught until now. Missing means whole:
`asCaughtPokemon` derives the maximum for those records, which is what they meant.

## What the player sets

Four of the six `PokemonFlags` are the game's own: shiny, shadow, egg, and the
battle lock. Two are the player's, set from the catch dialog and cleared the same
way, and neither says anything about the pokemon itself:

| Flag       | Button              | What it refuses                                                                                  |
| ---------- | ------------------- | ------------------------------------------------------------------------------------------------ |
| `Favorite` | Favorite/Unfavorite | Releasing, listing at auction, and trading when there is trading                                 |
| `Guarded`  | Lock/Unlock         | Levels, training, values moved, evolution, fights, healing, purifying, items given or taken back |

They answer different questions on purpose.

A **favorite** is about _parting_ with a pokemon. It guards the two irreversible
things a mis-click can do: `releaseCatch` deletes a record outright, and
`openAuction` puts one somewhere it cannot be taken back from. It changes nothing
about what the pokemon can do, so a favorite still fights, still trains and can
still be a buddy.

A **guarded** pokemon is about _keeping one as it is_. The line is drawn around
the sheet: anything that would rewrite a stored field is refused, and anything
that only ever adds to the pokemon is left alone.

Refused: `useCandy` (a level), `trainEffort`, `useWing` and `feedEffortBerry`
(effort), `useBottleCap` (values), `evolveCatch`, `useHealingItem`,
`usePurifyingGem`, `visitNurse` (she heals and purifies), `joinRaid`, and both
`giveItem` and `takeItem`, since a locked pokemon is not reached into in either
direction, so what it is holding stays what it was holding.
`publishTeamSnapshot` drops it from a party the way it drops an egg or a fainted
pokemon, so a rocket fight leaves it behind too.

Still allowed: walking as the **buddy** and the steps that come with it,
**friendship** from every source that grants it, and standing as a **parent** at
the breeder. `breedCatches` consumes neither parent and writes the egg as a third
record, so a locked pokemon comes back from the breeder exactly as it left.
`groomCatch` is allowed for the same reason: friendship is the one field a lock
does not fence off.

Neither flag is enforced by the client. Every one of those calls checks the stored
record, through `isFavoriteRecord` and `isGuardedRecord` in
[`src/server/catch-fields.ts`](../../src/server/catch-fields.ts). The catch dialog
greys out every section a lock refuses, and the pickers say _a favorite_ or
_locked_, so the refusal is visible before the press.

`setFavorite` and `setGuarded`
([`src/server/caught.ts`](../../src/server/caught.ts)) write through `withFlag`,
so setting one cannot drop another, and a shiny shadow stays a shiny shadow, and
both refuse while the pokemon is **fighting**, the way every other edit to a live
record does.

## Whose hands it has passed through

`history` is one entry per owner, oldest first. Each says **when** that owner
received it, as a local ISO 8601 string in _their_ own zone the way a catch date
is, and **how**:

| `Acquisition` | Written by         | What it means                                  |
| ------------- | ------------------ | ---------------------------------------------- |
| `Caught`      | `recordCatch`      | They threw the ball                            |
| `Egg`         | `writeEgg`         | It came to them as an egg, nest or breeder     |
| `Auction`     | `claimAuction`     | They won it on the block                       |
| `Trade`       | nothing yet        | Reserved for a swap between two players        |
| `Gift`        | `claimMysteryGift` | They took it out of a mystery gift             |
| `Revived`     | `reviveFossil`     | They carried a fossil to somebody with a bench |

It is a different question from the record's own `type`
([Encounter kinds](encounters.md#encounter-kinds)), which says how the pokemon was
first met and never changes. A Mewtwo can be a legendary raid prize _and_
something its second owner bought, and the two fields say so separately.

`Trade` exists before player-to-player trading does, so a member added later
cannot leave old records to be told apart from new ones by their shape. A lot won
at auction is recorded as `Auction`, and it is what sets the record's `traded`
field today.

An entry also carries `paid`: what that owner spent in gold, where the handover
cost gold at all. Only `claimAuction` writes it, with the winning bid. It belongs
to the **handover** rather than to the pokemon. A Mewtwo may come round the block
twice, and what the second winner paid says nothing about what the first did. It
is the only place the figure survives, since the lot is settled and gone a
moment later. A sale written before the price was kept reads as `null`, which is
not the same as a lot won for nothing.

And `ball`: the ball it was in when that owner received it. The pokemon's own
`ball` is whatever it sits in **today**, since any owner can spend a spare ball
from the bag to re-ball it, so the entry keeps the one it arrived in. A handover
written before the ball was kept reads as `null`.

A record written before the field existed still reads correctly, because both
cases are knowable. The **first** entry is where the pokemon began, which the
record's `type` already says, where `Hatched` means an egg and anything else
means a catch. Every entry **after** it can only be a sale, since the auction house has
been the one thing that ever appended one. `reclaimAuction` appends nothing: an
unsold lot came back to the same person.

The catch dialog shows the chain under **Owners**, oldest first: who, how they
came by it, and the day they did. Names come from `profiles`, which every
signed-in player can read, and the reader is "You" rather than their own
nickname. A trainer whose profile has since gone still
holds their place in the list as "A trainer": an owner is a fact about the
pokemon, and a missing profile must not quietly shorten its history.

## Where it came from

`type` says how a pokemon was met, listed in
[Encounter kinds](encounters.md#encounter-kinds), and for a raid prize `lair`
says **where**. It is the same field the lobby was named after
([Raids](raids.md)), so a record reads the way the raid did: a Mewtwo won under a
mountain says `Cerulean Cave`, and a shadow raid that stood in no named place says
`Shadow Mountain Lair`, derived from the `origin.biome` beside it.

Everything met any other way carries `null` there and is described by its
encounter kind alone.

A **mythical** goes further: its `origin.biome` is `Biome.Beyond`, a biome that is
nowhere on the map. No climate targets it (`BIOME_CONFIGS` excludes it by type, so
`getBiome` cannot return it), no spawn pool is registered for it, and nothing is
ever generated there. A relic is spent wherever the player happens to be standing,
but that chunk is not where the pokemon came from, and walking back to it finds
nothing, so the record says `Beyond` rather than naming a place that would be a
lie.

## Bottle caps

Individual values are rolled once, when the encounter is staged, and nothing else
in the game moves them afterwards. That is what makes a bad roll on a pokemon
somebody already raised worth an item of its own.

`useBottleCap` ([`src/server/bottle-caps.ts`](../../src/server/bottle-caps.ts))
spends one and writes `ivs` in the same transaction, so a cap is never spent on a
pokemon that did not change and a pokemon never changes without one being spent.
Which stats it raises is the **server's** roll, seeded by the catch, the item and
the instant: a client that chose would simply choose the stat it wanted, and the
cap would stop being a cap.

| Item                  | Band    | What it does                                    |
| --------------------- | ------- | ----------------------------------------------- |
| **Golden Bottle Cap** | Special | Raises every value to `MAX_IV` (31)             |
| **Bottle Cap**        | Prized  | Raises one value, drawn from the imperfect ones |

Both are found in the overworld item pool and nowhere else: neither is stocked,
neither is holdable, and each is consumed by the use. The rules both sides read
live in [`src/data/items/bottle-caps.ts`](../../src/data/items/bottle-caps.ts).

Only stats below `MAX_IV` are drawn from, so a plain cap never lands on a stat
that needed nothing, since the item is spent either way and a pick that could waste it
would make the cap worse the closer a pokemon came to perfect. A pokemon that is
**already perfect** is refused outright on both sides: the dialog hides the buttons
and the server returns null without touching the bag.

The use is refused for the same reasons every other catch write is: the catch is
not the player's, it is locked into a live battle, or it is still an egg. What is
inside an egg was decided when it was found and stays that way until it hatches.

`individualValue` is not rewritten. It is the roll the encounter was staged from,
and the stored per-stat values are what every reader uses, which is the same
reason a bred egg's `ivs` can disagree with it.

## Purifying a shadow

A shadow catch comes out of a shadow raid carrying the `Shadow` ability for good
and paying twice the candy at every level. The **Purifying Gem**, a rare find in
the overworld item pool that is never stocked, undoes that trade, and the rules for it
live in
[`src/data/items/purifying-gem.ts`](../../src/data/items/purifying-gem.ts).

Three fields move, in one transaction with the gem leaving the bag
([`src/server/purify.ts`](../../src/server/purify.ts)):

| Field       | Before             | After                                  |
| ----------- | ------------------ | -------------------------------------- |
| `abilities` | `[rolled, Shadow]` | `[rolled, Purified]`                   |
| `shadow`    | `true`             | `false`, and the candy cost reverts    |
| `ivs`       | as rolled          | every value `+PURIFY_IV_BOOST`, capped |

`Purified` is **entirely cosmetic**: no listener reads it, and nothing in a battle
changes. It is the mark left where the `Shadow` ability was, so a pokemon that
came out of a shadow raid still says so afterwards. Purifying changes what it
costs, not what it was.

The doubled levelling cost is read off the `Shadow` **flag** rather than the
ability (`getCandyCost` in
[`src/auth/candy-rules.ts`](../../src/auth/candy-rules.ts)), so clearing that bit
is what reverts it. Nothing else about it is touched: a shiny shadow is still
shiny.

Health is rescaled with the change, since two more HP points is a bigger pool and
the share of it the pokemon was carrying is what it keeps. A pokemon that is not a
shadow is refused outright, since a gem spent on nothing would be a rare item
wasted, as is one that is not the player's, is locked into a battle, or is still an egg.

The gem is not the only way. **Nurse Joy** purifies for free, along with the
healing, once per NPC window. See [Wandering NPCs](overworld.md#wandering-npcs).

## Releasing

`releaseCatch` ([`src/server/caught.ts`](../../src/server/caught.ts)) **deletes**
the row rather than flagging it: a released pokemon is gone, and nothing in
the game reads a catch its owner no longer has. Three things move with it, in the
same transaction, so nothing is left pointing at a record that has vanished:

- whatever it was holding goes back to the bag, since the item was the player's
  rather than the pokemon's;
- the profile's `buddy` is cleared when it named the released catch;
- a catch that is **locked** into a live battle is refused outright, since the
  fight is running on a snapshot of a record that has to still be there when it
  ends.

Releasing pays the family `getReleaseCandy` of the released record, one candy per
25 levels rounded up, so a level 76 to 100 pokemon pays 4 and a fresh catch pays
1. It is written inside the same transaction as the deletion, so a record cannot
vanish without the candy landing. Rarity has no say on the way out, and neither
does the family-day bonus: that one belongs to meeting the pokemon.

The dialog asks twice before calling it, and there is no undo.

## Escrow

A pokemon put up for auction is not deleted and not held anywhere else. It stays
its own row with `owner` set to **null**, which is nobody. The foreign key stays
honest that way, where the old empty-string sentinel could not.

Every write that touches a catch asks whether the caller is its `owner`, and a uid
is never null, so an escrowed pokemon is refused to the seller, the bidders and
everyone else by the checks that were already there, while staying **readable**,
which is what lets a bidder see what they are bidding on.

Collecting the lot writes the winner's uid into `owner`, appends the sale to
`history`, with what it went for in `paid`, and resets `friendship` to
`BASE_FRIENDSHIP`: the pokemon has just met
its new trainer, and what it thought of the last one was theirs. A lot nobody bid
on goes back to the seller instead, which restores `owner` and leaves both
`history` and `friendship` alone, since it never changed hands. See
[Auctions](auctions.md).

## Eggs

An egg is an ordinary catch record with `egg` still set. Everything about the
pokemon inside it, its species and rolls and the move it inherited, is written by
`grantNestEgg` ([`src/server/eggs.ts`](../../src/server/eggs.ts)) the moment the
nest is claimed, so hatching reveals rather than rolls: asking again cannot
produce a better pokemon than the nest gave. Every egg starts at level 1 and holds
nothing.

What the record does not do is show it. The catch dialog hides everything read off
the species, so the name, gender, abilities, moves and size are all hidden until the flag comes off,
and the list, the team picker and the buddy line all say only "Egg". This is
presentation, not secrecy: catch rows are readable, so a determined player can
read the species straight out of the table, and nothing is staked on them not
doing so.

An egg is refused everywhere a pokemon is expected. `giveItem`, `useCandy` and
`evolveCatch` turn it down, `openAuction` will not put one on the block, since a
bidder cannot see into one and the seller can, `publishTeamSnapshot` leaves it out of the
party it freezes, and `resolveBuddy` reports no buddy effects for one, since it is
carried rather than accompanied.

### Bred eggs

A breeder's egg is written the same way a nest's is, by `grantBredEgg`, and differs
only in where the pokemon inside comes from. Three of its six individual values are
copied straight off one parent or the other and the rest are rolled. The moves its
line can only inherit are passed on by whichever parent actually knows them, which
is what makes breeding a way to _teach_ a move rather than roll one. Its nature,
ability and gender are its own.

A shadow parent may pass the shadow on, on a coin toss, so breeding two of them
is no more certain than one. An egg that inherits it is written `shadow: true`, hatches
with the Shadow ability for good, costs double candy to raise afterwards, and takes
`SHADOW_HATCH_FACTOR` (2×) the usual steps to open: what is in there should not be,
and it takes longer to come out.

The stream is seeded by the pair, the window, the player and the instant, so the
same two left with the breeder again are a different egg, and no egg can be
re-rolled by asking twice.

One thing to know about the record: a bred egg's `ivs` are the **inheritance**, so
they are no longer slices of its `individualValue`. Everything that matters, the battle
snapshot and the dialog, reads the stored `ivs`, and nothing re-derives them
from the roll.

### Walking

Only the buddy walks. The client counts cells crossed and reports them in batches
of eight through `walk` ([`src/auth/eggs.ts`](../../src/auth/eggs.ts)).
`recordSteps` credits them **against the server's own clock**, so a report buys no
more than `(now - steppedAt) / MIN_STEP_INTERVAL` steps whatever it claims, at
250 ms a pace, capped at 64 a report, and never past `hatchSteps`. The stamp moves on
every report, credited or not, so a refused one banks no time for the next. That is
why `stepped_at` lives on the catch row, which only the server writes, rather than
beside the profile's `buddy_id`, which the player writes.

`hatchSteps` is settled when the egg is written. It starts from the **species'
own** hatch cycles. `getEggHatchSteps` runs at `STEPS_PER_EGG_CYCLE` (128) a
cycle, so a Magikarp's 5 cycles are 640 steps and a Mewtwo's 120 are 15,360. Two
things move it from there: a shadow egg doubles it, and a **Flame Body** buddy
standing beside the player at the pick-up halves it. Both are frozen onto the
record rather than asked again during the walk, since once an egg is being carried
it _is_ the buddy and there is nothing beside the player left to ask.

What a report is **worth** is asked fresh each time instead: `creditedEggSteps`
pays 1.2 paces for every one walked while the egg's own family is the day's
featured one. The perk belongs to the day rather than to the egg, so it cannot be
frozen onto the record.

A report also credits whatever a **Pickup** buddy found along the way: the same
call rolls it from the item pool and writes the stack in the same transaction, so a
find cannot be reported twice or lost between the walk and the bag.

`hatchEgg` takes the flag off once `steps` has reached `hatchSteps` and pays the
family's candy, exactly as meeting the pokemon any other way would have. The shared
rules both sides read, `getEggHatchSteps`, `canHatch`, `creditableSteps` and
`creditedEggSteps`, are in [`src/auth/egg.ts`](../../src/auth/egg.ts).

## Catches are locked while they fight

A battle runs on a **frozen** snapshot of the party, so a record that moved
underneath it would leave the two describing different pokemon. The worst case is
not cosmetic: a player who pulls a berry back into the bag mid-raid would have it
eaten in the battle and still be holding it afterwards.

So `startRaid` sets `lock` as it freezes each team, in the **same transaction** as
the snapshot, and every write that edits a catch refuses while the lock
holds: `giveItem`, `takeItem`, `useCandy`, `evolveCatch`, and `joinRaid`, which
will not field a pokemon already fighting elsewhere. Trading will ask the same
question: a locked pokemon is not up for trade.

`isCatchLocked` ([`src/server/locks.ts`](../../src/server/locks.ts)) answers from
the two columns alone, against the server's own clock; no row is fetched. Two
things end a lock:

- **The fight.** `finishBattle` stamps the outcome and then calls
  `releaseBattleLocks`, which frees every catch its team snapshots name.
- **The clock.** A lock is ignored once `BATTLE_TIMEOUT` (10 minutes) has passed
  since `lockedAt`, so a battle nobody ever reports, from a closed tab or a party
  that walked out, does not hold pokemon forever. It is the same window that decides an
  abandoned raid may be restaged.

`lockedAt` is the battle's own `startedAt`, which is what keeps the release honest:
it frees only catches whose lock still carries **that** stamp, so a late report
cannot unlock a pokemon that has since been taken by a newer fight.

Because freezing a team locks it, `startRaid` **claims the raid first** and freezes
afterwards, and a start that loses the race to another host holds nothing. A claim
whose teams then field nothing leaves the raid pointing at a battle row that was
never written, which reads as lost and restages.

The client asks the same question through `isLockLive`
([`src/auth/battle-lock.ts`](../../src/auth/battle-lock.ts)) so the catch dialog
can grey its buttons out and say why. The refusal itself is the server's.

[time]: time.md#local-time
