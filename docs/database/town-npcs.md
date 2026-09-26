# Towns and wandering NPCs

The people standing on a chunk's landmarks, the portals between towns, how a
town's name is worked out, and the one table that records a town was found.

## Wandering NPCs

A `WanderingNpc` landmark has **no table of its own**. The cell is fixed by the
chunk seed like any landmark, but who is standing on it is drawn afresh every
`NPC_INTERVAL` (3 hours) from `getWanderingNpcs`, the same window a raid stands
for. A player who needs a breeder and finds a daycare lady waits for the next
window or walks to another one.

`NPCS` holds **nine** of them. `Npc.RocketGrunt` bars the cell and fights
whoever accepts, and its state lives in
[`rocket_stops`](raid-stops.md#rocket_stops), the stop table every fighting
landmark shares, rather than in a claim marker. The eight who do something to a
pokemon are below.

None of them trusts the caller about who they are talking to.
`src/server/npcs/index.ts` re-derives the chunk, the zone and the window and
checks the NPC standing there **before** doing anything.

**Each of them serves a player once per window**, the vendor and the fossil
scientist aside, since what those two hand over is paced by a purse and by a bag
of fossils rather than by the clock. A row in `npc_claims`, whose marker is
`{npc}{cell}` stamped with the NPC window, records that this player has been
seen. A second ask before the passer-by changes is turned away whatever they can
pay. Its `payload` holds whatever the visit is worth remembering, such as which
pokemon the nurse tended. It is write-once audit data and nothing queries it by
field.

The marker is per cell, so walking to another wandering cell finds somebody who
has not seen you yet. That walk is what a second egg costs.

The marker is taken as late as each call can manage, once the visit is known to
be one that will land. A pair that cannot breed, an egg already ready to hatch,
or a party that needed nothing is refused without spending it. The two that
charge claim the visit _before_ taking the gold, since a player already seen
should not be charged to be told so, and both the gold and the visit go back if
the write behind them fails.

Nurse Joy takes no marker at all: she heals as often as she is asked, so there
is no visit to spend. She is not a wanderer either. A `PokemonCenter` landmark
is chartered into every town at a chance of 1 and is rolled nowhere in the open
country, so `getStandingNpc` answers `Npc.NurseJoy` for that cell the way it
answers `Npc.Vendor` for a `Market` one.

- **Breeder** takes two of the player's pokemon and `BREEDING_FEE` gold, and
  writes an egg. Neither parent is consumed, held or locked: they are handed
  back the moment the egg exists. What the pair may produce is decided by
  [`src/overworld/breeding.ts`](../../src/overworld/breeding.ts) from the
  **stored** rows: a shared egg group, opposite genders (or a Ditto standing in
  for one, but not for two), nothing from the undiscovered group, and no eggs.
  The egg is the first stage of the mother's line, or the non-Ditto parent's
  when a Ditto stands in.

- **Daycare Lady** takes an egg and `DAYCARE_FEE` gold and adds
  `hatch_steps / 2` to wherever it already stood (`boostedSteps`), so an egg a
  quarter of the way along comes out three quarters of the way. It is a share of
  the requirement rather than a fixed place on it, so one past the half-way mark
  is finished by a single boost and any egg is finished by two, and the fee is
  what paces it. Only an egg already ready to hatch is refused. `stepped_at`
  moves with the jump, since those steps were not walked and the time they would
  have taken must not be banked for the next report.

- **Nurse Joy** takes any number of the player's pokemon in one handover (up to
  the 200 a single call may carry) and charges **nothing**. Each comes back at
  full health with its statuses cleared, and a shadow is
  [purified](../mechanics/raising.md#purifying-a-shadow) on the way. Nothing
  paces her: she takes no marker and turns nobody away, and one that needed
  nothing is handed straight back.

- **Groomer** takes one of the player's pokemon and `GROOMING_FEE` gold, and
  hands it back thinking half again as well of them. `groomedFriendship` adds
  half of whatever is _left_ to give, the same bargain the daycare lady makes
  with an egg. It is worth a great deal to a pokemon fresh out of a ball and
  almost nothing to one that is already inseparable. Because it is always half
  of the remainder it can never buy the last of a friendship, which is walked
  for. A pokemon that can gain nothing is refused before anything is charged,
  and an egg is refused outright: what is inside one has not met anybody yet.

- **Move Reminder** takes one **Heart Scale** and puts back a move the pokemon
  learned by levelling and has since lost. What he can give back is
  `getRecallableMoves`: the species' `learnSet.level` up to the pokemon's level,
  minus the moves it still knows, derived again on the server from the stored
  record. It is the species' own list rather than its line's, since an evolved
  species relists what its line starts with at level 1. Walking `evolvesFrom`
  would only offer a Charizard moves a Charizard never learns.

  He shares [`learnMove`](../mechanics/training.md#teaching-a-move) with the
  machines, so a full list asks which move goes and a list with room asks
  nothing. The scale leaves the bag in the **same transaction** the move list is
  written in, so it is only ever consumed when the move is actually taught, and
  the window's marker is given back when he refuses.

  He is the one wanderer whose price is not gold. A scale is dug out of the
  ground, no vendor stocks one and no vendor takes one, so what paces him is
  walking.

- **Fossil Maniac** carries **two of the three fossils**, drawn without repeats
  from the same seed he was (`getFossilOffer`), and will part with **one** of
  them for `FOSSIL_PRICES` gold while he is standing there. He is the only place
  in the game a fossil can be bought, since everywhere else one is dug out of
  the ground. Which two he has is the window's, so a player after a particular
  one waits for it or walks somewhere else. `buyFossil` claims the visit before
  the trade and gives it back when the purse will not stretch, and the gold and
  the rock move in the same transaction the vendor's trades move in.

- **Fossil Scientist** takes a fossil and hands back what was in it, and takes
  **nothing else**. Which species comes out belongs to the rock
  (`FOSSIL_SPECIES`), and it arrives at `FOSSIL_REVIVE_LEVEL` (20), so the only
  thing the player decides is which fossil to hand over. The record is written
  as an `EncounterType.Revived` catch with `Acquisition.Revived` in its history.
  Nobody met it, and calling it wild would name a chunk the species has not
  lived in for a very long time.

  He is another wanderer who takes **no marker**. What paces him is how many
  fossils have been dug up rather than the window, since turning away the second
  of two already carried would only be a walk to the next cell to do the same
  thing. The fossil leaves the bag first and is put back if the record is never
  written, since a fossil spent on nothing cannot be walked off.

- **Vendor**, the shop, another who takes **no marker at all**. What most of the
  others hand over is something the world cannot make twice in a window. What he
  hands over is a potion, so a player may deal with him as often as their purse
  allows while he is standing there.

  What he **sells** is a crate of `VENDOR_STOCK_KINDS` (6) kinds, derived from
  the same seed he was (`getVendorStock`), so it is part of who walked up rather
  than anything stored, and every player who reaches him this window is offered
  the same six things. Two are always the staples, a Poke Ball and a Potion. The
  rest are drawn without repeats from the balls and the medicine. The price is
  the registry's `buy`, so an item costs the same from every vendor in the
  world.

  What he **buys** is wider: anything `Marketable` at all, at the registry's
  `sell`, which is where the pearls, star pieces and nuggets a walk turns up
  finally become gold. `sell` is half of `buy` everywhere, so nothing bought
  from him can be sold back at a profit.

  The **Master Ball is excluded by arithmetic rather than by a list**. It is the
  one ball registered without `Marketable` and with a `buy` of 0, and both sides
  of his counter ask that flag first. `buyFromVendor` and `sellToVendor` move
  the purse and the item stack in **one transaction**, so a player is never
  charged for something that was never handed over.

What a bred egg inherits, and what it does not, is in
[Bred eggs](eggs.md#bred-eggs).

## Portals

A `Portal` landmark is a way through to another one. It does nothing on its own.
Opening it takes a **Portal Key**, the rarest band's newest entry, and the key
is **spent in the crossing**.

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
destination keeps it. It cannot move anybody. The game stores no position for
it, so it answers with the chunk and cell and the client walks through.

## Naming a town

A town's name is **worked out from where it stands**, never rolled and never
stored, and two towns can never share one.

`nameTown`
([`src/data/overworld/town-names.ts`](../../src/data/overworld/town-names.ts))
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

## See also

- [Shared overworld tables](overworld.md)
- [Overworld claims](world-claims.md)
- [Cave layers](cave-layers.md)
