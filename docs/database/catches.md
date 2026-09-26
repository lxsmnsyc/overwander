# Catch records

Written by `recordCatch` in
[`src/server/caught.ts`](../../src/server/caught.ts). A catch is one `caught`
row under a 20-character id, plus four child tables that hang off it by foreign
key: `caught_moves`, `caught_abilities`, `caught_items` and `caught_history`.
All five are written in one transaction, and a reader unpacks them in one query
with PostgREST embeds.

This page covers the row itself and the search over a box of them. The rest of a
catch is on the pages beside it:

- [Training and friendship](catch-training.md): effort, friendship, the packed
  integers, and the boolean marks
- [Health, status and the battle lock](catch-state.md): health, statuses, the
  two flags a player sets, and the lock a live fight holds
- [Owners and origin](catch-history.md): `caught_history`, and where a pokemon
  was met
- [Changing a catch](catch-changes.md): evolution, held items, bottle caps,
  purifying, releasing, escrow
- [Eggs](eggs.md): eggs, bred eggs, and walking one until it hatches

## `caught`

| Column                                | Type        | Notes                                                    |
| ------------------------------------- | ----------- | -------------------------------------------------------- |
| `id`                                  | `text`      | 20-character id, and the primary key                     |
| `owner`                               | `uuid`      | Current owner; null while a lot sits in escrow           |
| `type`                                | `smallint`  | `EncounterType`: how it was originally met               |
| `species`                             | `integer`   |                                                          |
| `nickname`                            | `text`      | What its owner calls it; empty until named               |
| `level`                               | `smallint`  | 1 to 100, checked                                        |
| `individual_value`                    | `integer`   | 32-bit roll the values were sliced from                  |
| `trait_value`                         | `integer`   | 32-bit roll driving level, gender, ability, nature       |
| `ivs`                                 | `integer`   | The six 0-31 values, five bits each, in stat order       |
| `gender`, `nature`                    | `smallint`  |                                                          |
| `slots`                               | `smallint`  | Room for abilities, held items and moves                 |
| `shiny`, `shadow`, `egg`              | `boolean`   | What it is                                               |
| `traded`                              | `boolean`   | Has changed hands; what the box search reads             |
| `can_evolve`                          | `boolean`   | A handover has met what a trade evolution asks           |
| `favorite`, `guarded`                 | `boolean`   | See [What the player sets][player-sets]                  |
| `auctionable`                         | `boolean`   | Advisory; the opener re-derives it                       |
| `hidden`                              | `boolean`   | Folded into a fusion; nothing reads it yet               |
| `locked_at`                           | `bigint`    | `started_at` of the battle holding it; 0 when free       |
| `steps`                               | `integer`   | Steps walked in the shell; only eggs accrue any          |
| `hatch_steps`                         | `integer`   | What hatching costs, frozen when the egg was found       |
| `stepped_at`                          | `bigint`    | Server instant steps were last credited at               |
| `walked`                              | `integer`   | Steps walked as buddy since hatching                     |
| `health`                              | `integer`   | Health left; 0 is fainted                                |
| `max_health`                          | `integer`   | What it is measured against; advisory                    |
| `hurt`                                | `boolean`   | Generated: `health < max_health`                         |
| `statuses`                            | `smallint`  | Mask of the non-volatile statuses it carries             |
| `lair`                                | `smallint`  | Where a raid prize was won, else null                    |
| `ball`                                | `integer`   | Ball the catch was made with                             |
| `caught_at_local`, `caught_at_offset` | `timestamp` | The catcher's wall clock and their zone ([Time][time])   |
| `locale`                              | `text`      | The catcher's locale tag, e.g. `en-PH`                   |
| `ev_hp` … `ev_spe`                    | `smallint`  | Training put into each stat; starts at zero              |
| `effort_bonus`                        | `smallint`  | Effort granted by wings, over the level allowance        |
| `friendship`                          | `smallint`  | 0 to 255, checked                                        |
| `origin_timestamp`                    | `bigint`    | Snapshot window the spawn belonged to                    |
| `origin_x`, `origin_y`                | `integer`   | Chunk coordinates                                        |
| `origin_biome`                        | `smallint`  |                                                          |
| `origin_place`                        | `text`      | The named place, where there was one                     |

Four child tables carry what a pokemon has several of, one row per slot:

| Table              | Row                                                                     |
| ------------------ | ----------------------------------------------------------------------- |
| `caught_moves`     | `(slot, move, points)`; a move and its PP Ups travel together           |
| `caught_abilities` | `(slot, ability)`; the rolled one, plus Shadow for a shadow             |
| `caught_items`     | `(slot, item)`; held items, up to `HELD_ITEM_LIMIT`                     |
| `caught_history`   | `(seq, owner, owner_name, acquired_at, kind, paid, ball)`, oldest first |

Each cascades on delete, so releasing a pokemon takes its moves and its history
with it in one statement.

The `slot` on the first three is the owner's own order, not the order things
were learned in. A battle takes as many of each as it allows from the top of the
list, so the order decides what a pokemon brings to a fight that allows fewer
than it has. `arrangeCatch` in [`caught.ts`](../../src/server/caught.ts) is what
writes it, and it accepts only a rearrangement of what is already stored, so
nothing is learned or handed over by arranging.

Columns are snake_case and the TypeScript record that reads them is camelCase;
[`caught-rows.ts`](../../src/auth/caught-rows.ts) is where the two meet. A box
is still one query however many pokemon are in it, because the children ride
along as PostgREST embeds (`CAUGHT_EMBED`).

The two 32-bit rolls, the packed `ivs`, the `slots` triple and the `statuses`
mask stay packed integers. The engine consumes each whole, so unpacking them
into columns would only build a shape the code immediately re-packs. Where a
search needs to see inside one, the schema adds a generated column rather than
changing how it is stored. See [Packed fields](catch-training.md#packed-fields).

Catch rows are readable by any signed-in player, since other players inspect a
pokemon before a trade, and writable by nobody but the server. A box is queried
by `listCaught` with `owner = uid`, on the `caught_owner` index.

### The nickname

`setNickname` is what writes it. The server cleans what it is handed rather than
trusting it: `asNickname` trims the ends, counts a run of spaces as one, drops
control characters and cuts the rest to `NICKNAME_LIMIT`. A name that cleans to
nothing empties the column. A **guarded** catch may still be named, since what
guarding protects is everything that changes what a pokemon _is_. A **fighting**
one may not, for the usual reason.

An empty `nickname` is not a missing one: it means nobody has named this
pokemon, and every reader calls it by its species instead (`getCatchName`). The
species' name is **not** copied into the column on creation, because a stored
copy goes stale the moment the pokemon evolves. An unnamed Bulbasaur should read
as Venusaur afterwards, not as a Venusaur called Bulbasaur. A pokemon that was
named keeps its name through evolution, which is the point of having given it
one.

## Searching a box

The search box over a box of pokemon takes `field:value` pairs (`type:fire
is:shiny level:30-60`, quoting anything with a space) and runs in **two
passes**. Every yes-or-no fact is asked through one field: `is:shiny`,
`is:favorite`, `not:fainted`, rather than a field each with a 1 or a 0 after it.
`planCatchSearch` works out which terms the store can answer and `searchCaught`
asks them beside the owner. Everything else is answered by `matchesCatch` over
what came back.

Three things widen a term rather than narrowing it. A leading `!` refuses it
(`!is:egg`), a `|` inside a value accepts any of its alternatives
(`type:fire|water`), and a numeric value takes a comparison (`level:>50`) or a
range (`level:30-60`, `caught:2026-01..2026-06`) as well as an exact number.

`sort:` and `order:` are the exception to all of it. They arrange the answers
rather than narrowing them, so a matcher skips them and `orderCatches` applies
them last, over whatever the predicate kept. A `sort:` word nothing has a
reading for leaves the box in the order it arrived. A box and a bag arrange
**descending** unless an `order:asc` says otherwise, since somebody sorting one
is looking for the best of what is in it. There is no `limit:`: a box that
already pages has nothing to do with one.

### What the box offers

Nobody has to memorise the grammar or the four dozen fields. Each search
declares a **vocabulary**: its field names, one line about each, and the values
a field takes where there is a closed list of them. `CATCH_VOCABULARY`,
`ITEM_VOCABULARY`, `AUCTION_VOCABULARY` and `TEAM_VOCABULARY` read their field
lists off the tables that answer the fields, so a field added there arrives in
the box on its own. Only the line about it is written by hand, and a test fails
where one is missing.

The box uses the vocabulary three ways:

- It finishes the word the caret is in. Field names are offered before the
  colon, that field's values after it. Tab takes the highlighted offer, or fills
  in as far as every offer agrees.
- It keeps every finished term as a badge **inside the box**, coloured by what
  the term does. Blue narrows, amber refuses, grey arranges, and red is a field
  nobody has a reading for, which matches nothing rather than being ignored.
  Each badge carries a cross that takes the term back off. A term becomes a
  badge once a space follows it, and Backspace at the head of the box takes the
  last one apart to be edited.
- It carries the grammar itself on a card behind the information icon, written
  in the vocabulary's own words, so the card attached to the bag is about the
  bag.

### What the store answers

A term is pushed only when the query is **implied** by the predicate. A
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

Each joined term gets an **alias of its own** (`q0`, `q1`), for two reasons. Two
terms over one table are two rows, so `move:ember move:growl` is a pokemon that
knows both rather than one move that is somehow both. The aliased join also sits
beside the embed the reader unpacks rather than filtering it, so a pokemon does
not come back holding only the move that was searched for.

Three shapes are not stored as they are asked, so
[`20260821000100_search.sql`](../../supabase/migrations/20260821000100_search.sql)
generates a column each: the six values out of the packed `ivs`, the six
statuses out of the packed mask, `hatch_left` out of the difference between two
columns, and trigram indexes for the substring matches.

### What the box answers

A plain name is read rather than queried: it matches the nickname or the
species, which is two columns and a fallback rather than one filter. So is
`type:`, which is a fact about the species rather than about the row. It would
be `species in [...]`, which fits for Fire and not for Water, and quick for half
the game and slow for the other half is worse than being the same either way. So
are `hands` and `moves`, which are counts nothing stores; `is:evolvable`, which
the species registry knows and no column does; and `is:duplicate`, which is a
fact about the whole box rather than about any row in it.

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

A refused term is pushed only where the store can state the opposite exactly. A
plain equality inverts. A range would be two queries either side of it, and the
opposite of a join is a row that must **not** exist, which an inner join cannot
say. A value with alternatives is pushed where the alternatives collapse into
one `in` and left behind where they do not, since "either of two columns" is not
a filter.

### What a search cannot be told

`is:buddy`, `is:listed`, `is:raiding` and `is:duplicate` are not in the record.
The box reads them once beside its rows, with `readCatchContext` for the first
three and `findDuplicates` over what was loaded for the last, and passes them in
as a `CatchContext`. A list that read none of them answers those marks **no**,
which is the same answer an unknown field gets and for the same reason: a term
that cannot be answered hides the row rather than being quietly dropped.

The **bag** takes the same grammar and has no query half at all. It is one row
per stack, read whole however much is in it, and every term is answered over
what came back. See
[`src/data/items/search.ts`](../../src/data/items/search.ts).

[time]: time.md#local-time
[player-sets]: catch-state.md#what-the-player-sets
