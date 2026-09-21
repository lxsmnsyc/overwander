# Eggs

An egg is an ordinary catch record with `egg` still set, plus the steps its
owner has to walk before it hatches.

## What an egg is

Everything about the pokemon inside it, its species and rolls and the move it
inherited, is written by `grantNestEgg`
([`src/server/eggs.ts`](../../src/server/eggs.ts)) the moment the nest is
claimed, so hatching reveals rather than rolls: asking again cannot produce a
better pokemon than the nest gave. Every egg starts at level 1 and holds
nothing.

What the record does not do is show it. The catch dialog hides everything read
off the species, so the name, gender, abilities, moves and size are all hidden
until the flag comes off, and the list, the team picker and the buddy line all
say only "Egg". This is presentation, not secrecy: catch rows are readable, so a
determined player can read the species straight out of the table, and nothing is
staked on them not doing so.

An egg is refused everywhere a pokemon is expected. `giveItem`, `useCandy` and
`evolveCatch` turn it down, `openAuction` will not put one on the block, since a
bidder cannot see into one and the seller can, `publishTeamSnapshot` leaves it
out of the party it freezes, and `resolveBuddy` reports no buddy effects for
one, since it is carried rather than accompanied.

## Bred eggs

A breeder's egg is written the same way a nest's is, by `grantBredEgg`, and
differs only in where the pokemon inside comes from. Three of its six individual
values are copied straight off one parent or the other and the rest are rolled.
The moves its line can only inherit are passed on by whichever parent actually
knows them, which is what makes breeding a way to _teach_ a move rather than
roll one. Its nature, ability and gender are its own.

A shadow parent may pass the shadow on, on a coin toss, so breeding two of them
is no more certain than one. An egg that inherits it is written `shadow: true`,
hatches with the Shadow ability for good, costs double candy to raise
afterwards, and takes `SHADOW_HATCH_FACTOR` (2×) the usual steps to open.

The stream is seeded by the pair, the window, the player and the instant, so the
same two left with the breeder again are a different egg, and no egg can be
re-rolled by asking twice.

One thing to know about the record: a bred egg's `ivs` are the **inheritance**,
so they are no longer slices of its `individualValue`. Everything that matters,
the battle snapshot and the dialog, reads the stored `ivs`, and nothing
re-derives them from the roll.

## Walking

Only the buddy walks. The client counts cells crossed and reports them in
batches of eight through `walk` ([`src/auth/eggs.ts`](../../src/auth/eggs.ts)).
`recordSteps` credits them **against the server's own clock**, so a report buys
no more than `(now - steppedAt) / MIN_STEP_INTERVAL` steps whatever it claims,
at 250 ms a pace, capped at 64 a report, and never past `hatchSteps`. The stamp
moves on every report, credited or not, so a refused one banks no time for the
next. That is why `stepped_at` lives on the catch row, which only the server
writes, rather than beside the profile's `buddy_id`, which the player writes.

`hatchSteps` is settled when the egg is written. It starts from the **species'
own** hatch cycles. `getEggHatchSteps` runs at `STEPS_PER_EGG_CYCLE` (128) a
cycle, so a Magikarp's 5 cycles are 640 steps and a Mewtwo's 120 are 15,360. Two
things move it from there: a shadow egg doubles it, and a **Flame Body** buddy
standing beside the player at the pick-up halves it. Both are frozen onto the
record rather than asked again during the walk, since once an egg is being
carried it _is_ the buddy and there is nothing beside the player left to ask.

What a report is **worth** is asked fresh each time instead. `creditedEggSteps`
pays 1.2 paces for every one walked while the egg's own family is the day's
featured one. The perk belongs to the day rather than to the egg, so it cannot
be frozen onto the record.

A report also credits whatever a **Pickup** buddy found along the way: the same
call rolls it from the item pool and writes the stack in the same transaction,
so a find cannot be reported twice or lost between the walk and the bag.

`hatchEgg` takes the flag off once `steps` has reached `hatchSteps` and pays the
family's candy, exactly as meeting the pokemon any other way would have. The
shared rules both sides read, `getEggHatchSteps`, `canHatch`, `creditableSteps`
and `creditedEggSteps`, are in [`src/auth/egg.ts`](../../src/auth/egg.ts).

## See also

- [Catch records](catches.md): the `caught` row an egg is, and the box search
- [Training and friendship](catch-training.md): the `HATCHED_FRIENDSHIP` (120) a
  hatched pokemon starts on
- [Health, status and the battle lock](catch-state.md): why a party drops an egg
- [Owners and origin](catch-history.md): the `Egg` entry a nest or breeder
  writes
- [Eggs](../mechanics/eggs.md): the same thing from the player's side
