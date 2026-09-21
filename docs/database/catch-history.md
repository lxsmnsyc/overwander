# Owners and origin

Who has held a catch, how each of them came by it, and where the pokemon was met
in the first place.

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

It is a different question from the record's own `type` ([Encounter
kinds](encounters.md#encounter-kinds)), which says how the pokemon was first met
and never changes. A Mewtwo can be a legendary raid prize _and_ something its
second owner bought, and the two fields say so separately.

`Trade` exists before player-to-player trading does, so a member added later
cannot leave old records to be told apart from new ones by their shape. A lot
won at auction is recorded as `Auction`, and it is what sets the record's
`traded` field today.

An entry also carries `paid`: what that owner spent in gold, where the handover
cost gold at all. Only `claimAuction` writes it, with the winning bid. It
belongs to the **handover** rather than to the pokemon. A Mewtwo may come round
the block twice, and what the second winner paid says nothing about what the
first did. It is the only place the figure survives, since the lot is settled
and gone a moment later. A sale written before the price was kept reads as
`null`, which is not the same as a lot won for nothing.

And `ball`: the ball it was in when that owner received it. The pokemon's own
`ball` is whatever it sits in **today**, since any owner can spend a spare ball
from the bag to re-ball it, so the entry keeps the one it arrived in. A handover
written before the ball was kept reads as `null`.

A record written before the field existed still reads correctly, because both
cases are knowable. The **first** entry is where the pokemon began, which the
record's `type` already says, where `Hatched` means an egg and anything else
means a catch. Every entry **after** it can only be a sale, since the auction
house has been the one thing that ever appended one. `reclaimAuction` appends
nothing: an unsold lot came back to the same person.

The catch dialog shows the chain under **Owners**, oldest first: who, how they
came by it, and the day they did. Names come from `profiles`, which every
signed-in player can read, and the reader is "You" rather than their own
nickname. A trainer whose profile has since gone still holds their place in the
list as "A trainer": an owner is a fact about the pokemon, and a missing profile
must not quietly shorten its history.

## Where it came from

`type` says how a pokemon was met, listed in
[Encounter kinds](encounters.md#encounter-kinds), and for a raid prize `lair`
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
be standing, but that chunk is not where the pokemon came from, and walking back
to it finds nothing, so the record says `Beyond` rather than naming a place that
would be wrong.

## See also

- [Catch records](catches.md): the `caught` row, its children, and the box
  search
- [Encounter kinds](encounters.md): what each way of meeting a pokemon is
  recorded as
- [Changing a catch](catch-changes.md): escrow, and the sale that appends an
  entry here
- [Auctions](auctions.md): where an `Auction` entry and its `paid` come from
