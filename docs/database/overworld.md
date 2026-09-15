# Shared overworld tables

These are the synchronization surface. Every player observing a chunk must derive
the same spawns, so the rolls are published once and read by everyone.

## Windows

Nothing in a chunk turns over on one clock. A window is as long as what it holds
is worth: the pokemon a player walks past are the fastest thing in the world, the
ground they dig up is slower, and anything worth making a trip for outlives the
trip. Every interval is a whole number of `SNAPSHOT_INTERVAL`s, so a landmark
never rolls over halfway through the window a player is standing in.

| Window                | Length     | What it turns over                                                       |
| --------------------- | ---------- | ------------------------------------------------------------------------ |
| `SNAPSHOT_INTERVAL`   | 5 minutes  | The shared window row and its spawns                                     |
| `LANDMARK_INTERVAL`   | 15 minutes | Item stashes and berry patches                                           |
| `PHENOMENON_INTERVAL` | 1 hour     | What is happening over a chunk's open ground, and where                  |
| `WEATHER_INTERVAL`    | 1 hour     | The sky over a chunk                                                     |
| `RAID_INTERVAL`       | 3 hours    | Legendary and shadow raid lobbies                                        |
| `NPC_INTERVAL`        | 3 hours    | Who is at a wandering-NPC cell, and the party a Team Rocket grunt fields |
| `NEST_INTERVAL`       | 12 hours   | The egg lying in a nest                                                  |

All of them derive from the one snapshot the player is standing in
([`src/overworld/chunk-snapshot.ts`](../../src/overworld/chunk-snapshot.ts)).
`timestamp` is floored to the spawn window, and `landmarkTimestamp`,
`phenomenonTimestamp`, `raidTimestamp`, `npcTimestamp` and `nestTimestamp` floor
that again to their own. A Team Rocket stop derives against `npcTimestamp`, like
everything else at a wandering cell.

Every claim marker and lobby id is stamped with the window its landmark actually
runs on, so a stash cannot be re-dug three times while the hole is still empty.

## `snapshots`

Written by `resolveSnapshotWindow` in
[`src/auth/snapshots.ts`](../../src/auth/snapshots.ts), through the
`publish_snapshot` function rather than by a table write. Keyed by
`(chunk_seed, zone)`.

| Column       | Type       | Notes                                                         |
| ------------ | ---------- | ------------------------------------------------------------- |
| `chunk_seed` | `text`     | The chunk this window belongs to                              |
| `zone`       | `text`     | The timezone it was read in                                   |
| `utc_offset` | `smallint` | Minutes east of UTC the window was read in                    |
| `window_at`  | `bigint`   | The 5-minute **local** window, floored to `SNAPSHOT_INTERVAL` |

This is the one client write in the game besides the profile, and the function is
what makes it safe: it refuses a window older than the stored one, and swaps the
spawn rows in the same statement. Whoever finds the row missing or expired writes
the new window and is told they refreshed it. Everyone else **in the same zone** adopts the stored
timestamp. The instant used to judge expiry comes from the
[server clock](time.md#clock), never the device; only the zone it is read in is
the player's.

The zone is part of the key because the window is local: a chunk is not one world
seen from several clocks but one per zone. See [Local time](time.md#local-time).

## `snapshot_spawns`

A spawn has no life apart from the window that rolled it: it is rolled with the
window, replaced with it, and never read without it. So the rows hang off the
snapshot by foreign key, cascade with it, and carry their roll order in `idx`.

| Column               | Type       | Notes                       |
| -------------------- | ---------- | --------------------------- |
| `chunk_seed`, `zone` | `text`     | The snapshot they belong to |
| `idx`                | `smallint` | Roll order, from zero       |
| `species`            | `integer`  |                             |
| `individual_value`   | `integer`  |                             |
| `trait_value`        | `integer`  |                             |

Where a spawn stands is not stored. The cells are re-derived from the same seed
and window by `getSpawnCells`, so the nth roll is the nth placed cell on every
screen. Its **name** is derived too, `{chunkSeed}:{zone}@{timestamp}#{index}` from
`spawnId`, which is what an encounter row is keyed by, so nothing has to keep a
row alive just to give a spawn a name.

Publishing is therefore one call, and a window that rolls over replaces its own
spawns inside it, so there is nothing stale to sweep up.

A window publishes `SPAWN_COUNT` (8) spawns plus `LURE_SPAWN_BONUS` (3) more. The
extras are rolled for every chunk so that all its visitors share one set of rolls,
and a **lure** buddy (Arena Trap, Illuminate or No Guard) decides who can see
them rather than whether they exist. A player without one neither sees the last
three on the map nor may meet them: `meetSpawn` compares the index off the spawn
id against `checkSpawnCount(SPAWN_COUNT)` and refuses anything past it.

Two held items answer the same question the other way: a **Pure Incense** and a
**Cleanse Tag** each take 3 off what their holder can see, floored at nothing.

`meetSpawn` also checks the whole name against the live window before it reads the
roll, so a spawn from a window that has turned over, or from a chunk away, is
not standing there to be met.

## `encounters`

Written by `startEncounter`: the per-player view of a shared spawn (shininess,
gender, ability, nature, moves, and the rest) derived once and reused afterwards.
Keyed by `(spawn_id, player)`, with `encounter_moves`, `encounter_items` and
`encounter_abilities` hanging off that pair.

`fed` is the berry the pokemon was given, and null for the ones nobody fed. A
Pinap pays its extra candy at the catch, which is a later call than the one that
fed it, and the catch is recorded from the staged row, so the row is where the
berry has to live.

Its `shiny` and `shadow` columns and its packed `ivs` are the same shapes the
catch row stores, see [Packed fields](catches.md#packed-fields), so recording a
catch copies them across rather than converting them. Only the named player may
read it, and only the server writes it.

The buddy at the player's side shapes this row, the way a party leader shapes
a wild encounter in the mainline. The overworld asks for each of these through an
event engine of its own
([`src/overworld/core.ts`](../../src/overworld/core.ts)), built the same way the
battle engine is: every field ability and held-item effect is written once, in
[`src/overworld/abilities/gen-1.ts`](../../src/overworld/abilities/gen-1.ts) or
[`src/overworld/items/key-items.ts`](../../src/overworld/items/key-items.ts), and
registers itself against the questions it has an opinion about. Nothing that
stages a spawn or an encounter names an ability.

**Synchronize** passes its own nature on half the time, **Cute Charm** brings out
the opposite gender two draws in three, and a buddy holding the **Shiny Charm**
lifts the odds eightfold. Each rolls on a stream seeded by the spawn id and the
uid, so the client shows the player exactly what the server will stage, and two
players on one cell get their own answers.

What a chunk holds is the same for everyone standing in it: no field effect
changes which species turned up, only how many of them a player can see.

Two of the encounter's own fields are worth calling out:

- **Shiny** is a resonance between the trainer id and the **trait** value, so
  shininess is independent of the IVs a pokemon rolled, and the same spawn can
  sparkle for one player and not another. The odds are multiplied by the species
  day (×8 for the featured family) and by the Shiny Charm (×8) when the player's
  buddy is holding it. `startEncounter` checks the profile's `buddy_id` and that
  catch's held items before deriving.
- **Shadow** marks a shadow raid's reward. `recordCatch` then writes
  `Abilities.Shadow` into the catch's `abilities` alongside the rolled one, so it
  keeps the ability for good.

A raid reward derived on its family's own day floors every IV at
`RAID_FAMILY_DAY_MIN_IV` (10), leaving rolls above the floor alone. Its level is
fixed rather than rolled, `LEGENDARY_RAID_REWARD_LEVEL` (50) or
`SHADOW_RAID_REWARD_LEVEL` (25), so clearing the same kind of raid is worth the
same to everyone, and the level-up moves follow that level.

## `cache_claims`

Written by `claimItemCache` inside a transaction. The row **being there** is the
whole semantic: it is the marker that stops a player collecting the same cache
twice in one window. The server inserts `on conflict do nothing`, and the row
count is what says whether this press was the one that landed.

| Column       | Type     | Notes                                                 |
| ------------ | -------- | ----------------------------------------------------- |
| `marker`     | `text`   | `{chunkSeed}@{landmarkTimestamp}${cell}`              |
| `player`     | `uuid`   | Claiming player; the two together are the primary key |
| `claimed_at` | `bigint` | When it was taken                                     |

What the stash held rides in `cache_claim_items`, one `(item, amount)` row each.

A cache holds a **stash**, not an item. `pickItems` reads the band roll as a
_ceiling_ rather than a choice: it is the best thing in the stash, and one kind of
it is guaranteed. How many kinds is a separate draw (up to `MAX_KINDS`, 3), and
every kind after the first rolls its own band on the same odds, clamped to that
ceiling. So a stash may hold two rares and a base, or three commons, or one of
each. Rarity and count being independent is what stops a good dig from being the
same three slots every time.

Each kind carries up to `MAX_STACK` (3) pieces, on a draw of its own, and two
kinds landing on the same item merge into one stack that still never exceeds
`MAX_STACK`.

A special is a ceiling like any other band, so a stash may well be a Master Ball
and two stones. Two things it may never be: **two specials**, since only the
opening draw reaches that band and every kind after it is clamped to rare at best,
and **more than one piece** of a special, since a Master Ball found three at a
time would stop being a Master Ball.

The whole stash is granted stack by stack and recorded on the marker, so what a
cache paid is readable afterwards rather than only that it paid.

Claims are never updated or deleted: an expired window simply produces a new
marker string. A `write_once` trigger makes that a rule rather than a habit, and
the rows are readable by the player named on them alone.

## `berry_claims`

Written by `claimBerryPatch`, the same one-claim-per-window marker as an item
cache, on `{chunkSeed}@{landmarkTimestamp}$berry{cell}`. A berry patch fruits on
the 15-minute landmark window: picked or not, the next window grows something new.

| Column   | Type      | Notes                      |
| -------- | --------- | -------------------------- |
| `marker` | `text`    | The patch and its window   |
| `player` | `uuid`    | Claiming player            |
| `item`   | `integer` | The berry that was picked  |
| `amount` | `integer` | How many came off the bush |

What grows comes from the berry pool in
[`src/data/overworld/berry-pool.ts`](../../src/data/overworld/berry-pool.ts),
rolled on the same rarity bands as a spawn pool:

| Band     | What grows there                                                              |
| -------- | ----------------------------------------------------------------------------- |
| base     | The five single-status cures                                                  |
| uncommon | Leppa, Oran, Persim, and the five bitter berries that trade health for a risk |
| rare     | Lum, Sitrus, the five that answer a blow, and the eighteen type-resists       |
| special  | The pinch berries, held against the moment the holder is nearly out           |

The eighteen type-resist berries share the rare band the way the plates share
their slot in the item pool, one thin slot each, so digging up the one that
answers what a party is about to walk into stays luck rather than shopping.

A berry pool keeps its **prized** band empty. That band is for the things that
change a pokemon for good, like a Bottle Cap or a Purifying Gem, and a berry is
eaten. Its slice of the roll falls through to the rare band below, the way any
empty band does.

A patch is a bush rather than a buried box, so it bears **one kind** and
`MIN_BERRY_PICK` to `MAX_BERRY_PICK` (3 to 5) pieces of it: the rarity is the
interesting draw and the count is only how good a season it had. That is the
difference from a cache, which rolls several kinds but rarely more than one or two
of each.

## `phenomenon_claims`

Written by `claimPhenomenon`, the same one-claim-per-window marker as an item
cache, on the phenomenon's own **one-hour** window.

| Column   | Type       | Notes                                               |
| -------- | ---------- | --------------------------------------------------- |
| `marker` | `text`     | `{chunkSeed}@{phenomenonTimestamp}$happening{cell}` |
| `player` | `uuid`     | Claiming player                                     |
| `kind`   | `smallint` | Item, pokemon or egg: which fired                   |

A **phenomenon is not a landmark**. Everything else a player walks up to is a
place the chunk seed fixed forever; something happening is not, so `getPhenomena()`
rolls up to `MAX_PHENOMENA` of them across the chunk's open ground each hour and
they fall elsewhere the next one. Cells already carrying scenery, a landmark or a
rock are excluded, and dry ground is taken first where a chunk has any, so a
marsh still hides grottos while the open sea, which has none, only ripples.
What each one is comes from `BIOME_PHENOMENA[biome]`
([`src/data/overworld/phenomenon.ts`](../../src/data/overworld/phenomenon.ts)), so
water only ripples where there is water and dust only rises where there is dust.

The roll rides an `AleaRNG` of its own seeded on `(chunk key, phenomenon hour)`,
**not** the snapshot's generator: that one is the sequential stream the spawn
roll draws from, and taking draws out of it here would shift every pokemon in the
chunk.

The clock is the hour rather than the five-minute spawn window, and that is
load-bearing. The claim marker and the startled pokemon's rolls are both named
for `(chunk, hour, cell)`, so a cell that moved inside the hour would let the
same player claim the same event again. `getPhenomenonReward(cell)` resolves what
one turns out to be, seeded the same way, so every visitor of that cell this hour
finds the same thing. `listClaimedPhenomena` tells a board which of them
this player has already taken, so a spent one stops being drawn for them alone.

| Phenomenon         | Half the time                     | The other half                         |
| ------------------ | --------------------------------- | -------------------------------------- |
| **Hidden Grotto**  | No item side at all               | A pokemon, or 1/64 an egg of the biome |
| **Dust Cloud**     | One gem, stone, plate or valuable | A pokemon                              |
| **Rippling Water** | One valuable                      | A pokemon                              |
| **Flying Shadow**  | One wing                          | A pokemon                              |

The pokemon is the biome's **uncommon** band, or its **rare** band one draw in
eight (`PHENOMENON_RARE_CHANCE`), with either standing in for the other when it is
empty. The base band is not in it, since what a player can meet by walking is not
worth stopping for, and neither is the special one, so no phenomenon ever stages
a legendary.

An item reward lands in the inventory as part of the claim, one piece:
everything a phenomenon leaves is worth carrying home on its own. A pokemon
reward comes back as a spawn tuple whose two rolls derive from
`{seed}{phenomenonTimestamp}happening{cell}spawn`, passed to `startEncounter`
under the id `{chunkSeed}@{phenomenonTimestamp}$happening{cell}`, which has no
`snapshot_spawns` row behind it. A grotto's egg is written by `grantNestEgg`, exactly
as a nest's is.

## `nest_claims`

Written by `claimNest` in
[`src/server/overworld.ts`](../../src/server/overworld.ts), the same
one-claim-per-window marker as an item cache, on
`{chunkSeed}{zone}@{nestTimestamp}$nest{cell}`, except that a nest's window is
`NEST_INTERVAL`, **twelve local hours**. A nest refills at midnight and at noon
where the player is standing, so it gives each of them one egg per half day.

| Column    | Type      | Notes                                 |
| --------- | --------- | ------------------------------------- |
| `marker`  | `text`    | The nest and its window               |
| `player`  | `uuid`    | Claiming player                       |
| `species` | `integer` | What the nest was holding that window |

The player still has to be standing in the chunk's **live 5-minute window** to
reach it; the half-day window only decides what is lying there and how often. The
claim grants an egg by writing a `caught` row with `egg` set, see
[Eggs](catches.md#eggs), rather than an inventory item or an encounter.

What a nest holds is one draw on the biome's **egg pool** for that window's time
of day (`getEggPool`): the base, uncommon and rare bands walked back to the first
stage of each line and merged by species, since a nest holds what hatches rather
than what it grows into. Merging is what makes it one list and one draw, so
`resolveNest` no longer flattens three bands at every roll. The distribution is
unchanged, because everything that reduces to the same egg has its weight added to
that egg. The pool is built once per registered biome and kept against it.

Two bands are left out, for different reasons. The **special** tier is not in it
at all, so no nest ever holds a legendary, and a mythical is still called with a
relic or not at all. The **prized** tier is left out because a baby is _already_
in the list: it is the first stage of its line, so every ordinary entry of that
line walks back to it, and adding the band would count it twice. That leaves out
the unown, which has no line to be walked back along: it is met rather than
hatched.

The hatchling is guaranteed one move off its line's egg list, which is the reason
to walk the egg at all.

## Wandering NPCs

A `WanderingNpc` landmark has **no table of its own**. The cell is fixed by the
chunk seed like any landmark, but who is standing on it is drawn afresh every
`NPC_INTERVAL` (3 hours) from `getWanderingNpcs`, the same window a raid stands
for. A player who needs a breeder and finds a daycare lady waits for the next
window or walks to another one.

`NPCS` holds **nine** of them. `Npc.RocketGrunt` bars the cell and fights whoever
accepts, and its state lives in [`rocket_stops`](raids.md#rocket_stops), the
stop table every fighting landmark shares, rather
than in a claim marker. The
eight who do something to a pokemon are below.

None of them trusts the caller about who they are talking to: `src/server/npcs.ts`
re-derives the chunk, the zone and the window and checks the NPC standing there
**before** doing anything.

**Each of them serves a player once per window**, the vendor and the fossil
scientist aside, since what those two hand over is paced by a purse and by a bag
of fossils rather than by the clock. A row in `npc_claims`, whose marker is
`{npc}{cell}` stamped with the NPC window, records that this player has been seen,
and a second ask before the passer-by changes is turned away whatever they can
pay. Its `payload` holds whatever the visit is worth remembering, such as which
pokemon the nurse tended. It is write-once audit data and nothing queries it by
field.

The marker is per cell, so walking to another wandering cell finds somebody who
has not seen you yet. That walk is what a second egg costs.

The marker is taken as late as each call can manage, once the visit is known to be
one that will land: a pair that cannot breed, an egg already ready to hatch, or a
party that needed nothing is refused without spending it. The two that charge
claim the visit _before_ taking the gold, since a player already seen should not
be charged to be told so, and both the gold and the visit go back if the write
behind them fails.

Nurse Joy takes no marker at all: she heals as often as she is asked, so there
is no visit to spend. She is not a wanderer either. A `PokemonCenter` landmark
is chartered into every town at a chance of 1 and is rolled nowhere in the open
country, so `getStandingNpc` answers `Npc.NurseJoy` for that cell the way it
answers `Npc.Vendor` for a `Market` one.

- **Breeder** takes two of the player's pokemon and `BREEDING_FEE` gold, and
  writes an egg. Neither parent is consumed, held or locked: they are handed back
  the moment the egg exists. What the pair may produce is decided by
  [`src/overworld/breeding.ts`](../../src/overworld/breeding.ts) from the
  **stored** rows: a shared egg group, opposite genders (or a Ditto standing in
  for one, but not for two), nothing from the undiscovered group, and no eggs. The
  egg is the first stage of the mother's line, or the non-Ditto parent's when a
  Ditto stands in.

- **Daycare Lady** takes an egg and `DAYCARE_FEE` gold and adds
  `hatch_steps / 2` to wherever it already stood (`boostedSteps`), so an egg a
  quarter of the way along comes out three quarters of the way. It is a share of
  the requirement rather than a fixed place on it, so one past the half-way mark
  is finished by a single boost and any egg is finished by two, and the fee is
  what paces it. Only an egg already ready to hatch is refused. `stepped_at` moves
  with the jump, since those steps were not walked and the time they would have
  taken must not be banked for the next report.

- **Nurse Joy** takes the player's pokemon a press at a time, up to
  `NURSE_CARE_LIMIT` (6) per handover, and charges **nothing**. Each comes back
  at full health with its statuses cleared, and a shadow is
  [purified](catches.md#purifying-a-shadow) on the way. Nothing paces her: she
  takes no marker and turns nobody away, and one that needed nothing is handed
  straight back.

- **Groomer** takes one of the player's pokemon and `GROOMING_FEE` gold, and
  hands it back thinking half again as well of them. `groomedFriendship` adds half
  of whatever is _left_ to give, the same bargain the daycare lady makes with an
  egg. It is worth a great deal to a pokemon fresh out of a ball and almost
  nothing to one that is already inseparable, and because it is always half of the
  remainder it can never buy the last of a friendship, which is walked for. A
  pokemon that can gain nothing is refused before anything is charged, and an egg
  is refused outright: what is inside one has not met anybody yet.

- **Move Reminder** takes one **Heart Scale** and puts back a move the pokemon
  learned by levelling and has since lost. What he can give back is
  `getRecallableMoves`: the species' `learnSet.level` up to the pokemon's level,
  minus the moves it still knows, derived again on the server from the stored
  record. It is the species' own list rather than its line's, since an evolved
  species relists what its line starts with at level 1 and walking `evolvesFrom`
  would only offer a Charizard moves a Charizard never learns.

  He shares [`learnMove`](../mechanics/raising.md#teaching-a-move) with the
  machines, so a full list asks which move goes and a list with room asks nothing.
  The scale leaves the bag in the **same transaction** the move list is written
  in, so it is only ever consumed when the move is actually taught, and the
  window's marker is given back when he refuses.

  He is the one wanderer whose price is not gold: a scale is dug out of the
  ground, no vendor stocks one and no vendor takes one, so what paces him is
  walking.

- **Fossil Maniac** carries **two of the three fossils**, drawn without repeats
  from the same seed he was (`getFossilOffer`), and will part with **one** of them
  for `FOSSIL_PRICES` gold while he is standing there. He is the only place in the
  game a fossil can be bought, since everywhere else one is dug out of the
  ground, and which two he has is the window's, so a player after a particular one waits
  for it or walks somewhere else. `buyFossil` claims the visit before the trade
  and gives it back when the purse will not stretch, and the gold and the rock
  move in the same transaction the vendor's trades move in.

- **Fossil Scientist** takes a fossil and hands back what was in it, and takes
  **nothing else**. Which species comes out belongs to the rock (`FOSSIL_SPECIES`),
  and it arrives at `FOSSIL_REVIVE_LEVEL` (20), so the only thing the player
  decides is which fossil to hand over. The record is written as an
  `EncounterType.Revived` catch with `Acquisition.Revived` in its history: nobody
  met it, and calling it wild would name a chunk the species has not lived in for
  a very long time.

  He is another wanderer who takes **no marker**. What paces him is how many
  fossils have been dug up rather than the window, since turning away the second
  of two already carried would only be a walk to the next cell to do the same
  thing. The
  fossil leaves the bag first and is put back if the record is never written,
  since a fossil spent on nothing cannot be walked off.

- **Vendor**, the shop, another who takes **no marker at all**. What most of
  the others hand over is something the world cannot make twice in a window; what
  he hands over is a potion, so a player may deal with him as often as their purse
  allows while he is standing there.

  What he **sells** is a crate of `VENDOR_STOCK_KINDS` (6) kinds, derived from the
  same seed he was (`getVendorStock`), so it is part of who walked up rather than
  anything stored, and every player who reaches him this window is offered the
  same six things. Two are always the staples, a Poke Ball and a Potion; the rest
  are drawn without repeats from the balls and the medicine. The price is the
  registry's `buy`, so an item costs the same from every vendor in the world.

  What he **buys** is wider: anything `Marketable` at all, at the registry's
  `sell`, which is where the pearls, star pieces and nuggets a walk turns up
  finally become gold. `sell` is half of `buy` everywhere, so nothing bought from
  him can be sold back at a profit.

  The **Master Ball is excluded by arithmetic rather than by a list**: it is the
  one ball registered without `Marketable` and with a `buy` of 0, and both sides
  of his counter ask that flag first. `buyFromVendor` and `sellToVendor` move the
  purse and the item stack in **one transaction**, so a player is never charged
  for something that was never handed over.

What a bred egg inherits, and what it does not, is in [Eggs](catches.md#eggs).

## Portals

A `Portal` landmark is a way through to another one. It does nothing on its own:
opening it takes a **Portal Key**, the rarest band's newest entry, and the key is
**spent in the crossing**.

The traveller names a **town**, never a destination. Where they come out is that
town's own portal, on its plaza, derived in
[`src/overworld/portal.ts`](../../src/overworld/portal.ts) by `portalInRegion`
from the region's seed alone. The client already knows where it is going and the
server sites the region again when the crossing is asked for, so there is
nothing in the request to lie about except which way to go.

The **name** is derived too, so nothing here asks a store what a place is
called. See [Naming a town](#naming-a-town). What is stored is only which towns
anybody has walked into, which is what the crossing is checked against. A region
with no town has a portal out in the country: somewhere to leave from, and
nowhere to arrive at, since nothing names it.

`usePortal` ([`src/server/portals.ts`](../../src/server/portals.ts)) checks that
the cell really is a portal in a live window, checks the named region is on the
register, sites it again, and takes the key **last**, so a player refused a
destination keeps it. It cannot move anybody:
the game stores no position for it, so it answers with the chunk and cell and the
client walks through.

## Naming a town

A town's name is **worked out from where it stands**, never rolled and never
stored, and two towns can never share one.

`nameTown` ([`src/data/overworld/town-names.ts`](../../src/data/overworld/town-names.ts))
builds it from five parts: an optional mark, a head drawn from the town's **own
biome's** word list, a tail welded onto it, a title, and the **county**. So a
full name reads `Rimefell Village, Ashmarch`.

The county is what makes it work. Without one, a name would have to be unique
across the world's 262,144 regions, and one biome's words only make 49,920
names, five times less world than words. A county is 64x64 regions, so a name
only has to be unique inside **one county and one biome**: 4,096 regions against
49,920 names, which leaves room to spend the 3,840 unmarked names first, so only
about 1 town in 16 carries a mark.

Two towns of different biomes can never collide anyway, since no two biomes
share a head word and a test pins that. Within a county, the region's local
index is run through a bijection (`SPIN`, odd, so multiplying is a permutation)
and read off as digits, so neighbouring towns do not read as a numbered
sequence.

`floor(region / 64)` reads a town's own coordinates and nothing else, so **none
of this depends on how big the world is**. Growing `WORLD_SIZE` leaves every
existing town in the county it was already in, under the name it already had,
and only wants more county names at the new edges. `nameTown` throws for a
region outside the county names rather than folding it onto a county that
exists, and a test walks the world's corners to prove it cannot.

## The register

`towns` holds the one fact no derivation can reach: **whether anybody has walked
in**. Just `(region_x, region_y, found_by, found_at)`, no name column and no
unique index, because there is nothing to reserve.

Every row is public, and that is the point. A town one player found is a town
everybody can cross to, so the portal's name box is a shared register rather
than each player's own list. A portal crossing names a **region**, and
`usePortal` refuses one nobody has walked into, so guessing a name is not a way
to reach a town that has never been found.

## The caves

A cave is the same `World` at another `Depth`, not a subsystem. The pair shares
every noise field and every coordinate, and a cave world changes exactly two
things:

- **chunk seeds** become `` `${seed}cave(x, y)` ``, so landmarks, spawns and
  window rows all re-derive underground for free. `chunk_seed` is `text`, so
  `snapshots` and `snapshot_spawns` needed **no migration**.
- **`roleAt`** reads the depth: underground a cell is `ground` where
  `isCaveFloor` says so and `wall` everywhere else. There is no water below.

`isCaveFloor` ([`src/overworld/fields.ts`](../../src/overworld/fields.ts)) is
three things: **chambers** where the surface has rock, **veins** joining them,
and **elbows** making the veins walkable.

A vein is a ridge read off `world.stone` at a coarser step and a different
corner of itself, the way `isRiver` reads the lake field. Its width is what
stops a cave being a second overworld, and it is tuned against what a player can
actually walk, counting **orthogonal steps only**, over the most mountainous
country the world grows in a 300-cell square:

| vein width | open | biggest walkable | reach |
| ---------- | ---- | ---------------- | ----- |
| chambers only | 16.5% | 195 | 34 |
| **0.008** | **21.3%** | **1,562** | **115** |
| 0.02 | 23.8% | 2,771 | 220 |
| 0.03 | 25.8% | 16,518 | 299 (the whole square) |

An **elbow** is the fix for a passage that steps diagonally. A vein corners
wherever the field does, and nothing in this game moves diagonally, so two cells
touching only at their corners are two dead ends. Where a diagonal pair has both
of its connecting cells solid, the **westerly** one opens: the two candidates
see the same pair with both offsets negated, so exactly one of them acts without
either having to ask. It is not exhaustive, since an elbow can meet another
elbow, but those are under 1% of floor cells and a second pass would widen the
passages more than it is worth.

Measuring this before the elbows existed gave a reach of 79 cells, which was an
artifact: the field was that connected all along and simply could not be walked.

Nothing is decorated underground. `getDecorationCells` takes an empty kind list
at depth, since a cave carries the biome overhead so its spawns and lairs know
where they are, not so it can sprout that biome's trees.

Every cell where the surface crosses between sea and land is solid, so the sea
caves are a separate network.

### Mouths

A mouth is a **pair of cells**, derived rather than rolled
([`src/overworld/cave.ts`](../../src/overworld/cave.ts)): surface ground with
rock beside it, and that rock, which is floor below. Both layers stage
`Landmark.CaveMouth` on their own half, placed in `getLandmarkCells` outside the
roll the way `portalCellIn` places the portal. The region's portal keeps its ring
and is refused a mouth **in the scan itself**, so a mouth the surface had no room
for is not staged underground either: a way in is always a way back out.

The scan is cheap-first, because every chunk in the world runs it: one `isRock`
sample per cell, cached per chunk, and the full `roleAt` reading only for the
pairs that get past it.

### Which layer a call is about

`depth` rides beside `offset` through every call that resolves a chunk, for the
same reason `offset` does: the server has to derive the chunk the client was
looking at. It is optional and defaults to `Depth.Surface`, so the paths that can
only ever happen above ground (the NPCs, the gyms, the portals) are untouched.
`ChunkSnapshot.depth` is what the client hands over, so no client-facing
signature changed. A player who lies about their layer stands somewhere they are
not and finds exactly what is there, which is the rule positions already follow.

`positions.depth` is the one stored fact: the same cell is open ground above and
solid rock below, so a reload that guessed would put somebody inside a mountain.

## Derived, never stored

Landmarks, item-cache rewards, berry patches, phenomena, the species a nest is
holding, the party a Team Rocket grunt fields and cell placement are **not** in
the database. They re-derive from the chunk seed, the zone and the snapshot
window (`src/overworld/chunk.ts`, `src/overworld/chunk-snapshot.ts`), so two
players in the same zone and window compute identical results from the little
`snapshots` does store, and two players in different zones compute different
ones.

### Reaching, not treading

Nothing triggers by being walked over. A player steps within the 3x3 around a
pokemon or a landmark and **clicks** it; passing through a cell springs nothing.

That is a client rule. A player's position _is_ stored
([`positions`](player-stores.md#positions)), but it is their own report
of themselves, written every second and a half rather than every step. There is no
path in it, and nothing checks a claim against it. What the server checks is that
the cell really holds the thing, in a live window, which is what keeps a claim
honest: reach decides what a player _bothers_ to walk to, not what they are
allowed to claim.

Placement leaves room to walk. Every **fixture**, scenery and landmarks alike,
keeps the ring of cells around it clear, diagonals included, so no two of them
touch.
Spawns are exempt: `getSpawns` skips the decoration and landmark **cells** and
nothing more, and keeps no ring of its own. The walk's `passable` test blocks both fixtures and neither spawn: a tree is
walked round, a pokemon is walked through.

They are placed in order, decorations then landmarks then spawns, into the
central 14x14, which leaves a clear cell all the way round the chunk. The first
two are fixed to the chunk seed forever and only the spawns roll again each
window, so the fixed furniture is laid down first and the pokemon fit around it. A chunk rolls **eight to twelve** decorations and as many
landmarks, and each placement costs up to nine cells, so a crowded roll can run
out of room. Every loop stops early when it does, taking fewer rather than
crowding them.
