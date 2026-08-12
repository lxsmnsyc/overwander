# Battles

Battles are **real time**, not turn based. Nobody waits for anybody: a pokemon
winds up a move, the move lands, and that move then has to cool down before it
can be used again. Two pokemon with fast moves trade several times while a third
is still charging a Solar Beam.

Underneath, it is one event engine
([`src/battle/core.ts`](../../src/battle/core.ts)) with every mechanic, move,
status, ability, item and the AI registered against it as listeners. Nothing that
resolves a hit names an ability; each effect is written once and listens for the
questions it has an opinion about.

## Time and determinism

The battle's clock is `battle.tick(duration)`. In the browser a
`requestAnimationFrame` loop feeds it fixed 1/60-second steps and swallows the
remainder, so a slow frame produces several ticks rather than one long one, and
the fight advances at the same rate on every machine. Tests and replays call
`tick` themselves and run a fight in microseconds.

Every roll comes from one seeded generator, and the seed is the **battle
document's id**. Nothing about a fight is streamed between players: each
participant and each spectator runs the same computation over the same frozen
teams and gets the same result. A replay is that computation run again, which is
why it settles nothing and pays nothing.

## What a unit does with its time

| Phase        | What it is                               | How long                       |
| ------------ | ---------------------------------------- | ------------------------------ |
| **Cast**     | Winding up the chosen move               | `(104 − 16 × priority)` frames |
| **Trigger**  | The move landing, once per step          | Immediate                      |
| **Channel**  | The remaining steps of a multi-step move | The cast time again, per step  |
| **Cooldown** | That one move being unusable again       | `180 / PP` seconds             |

A base cast is 104 frames — about 1.73 seconds — and each point of move priority
takes 16 frames off it, so Quick Attack is genuinely quicker to get out rather
than being sorted first in a queue. Priority is the mainline number doing
real-time work.

Cooldown is derived from **PP**, which has no other job here: `PP_COOLDOWN_BASIS`
is 180, so a move is usable its full PP's worth of times in three minutes. A
35-PP tackle comes round every five seconds; a 5-PP Hyper Beam every thirty-six.
PP is a rate rather than a pool, so nothing runs out mid-raid and a strong move
is still rationed.

A cast is **interruptible**: flinching stops it, and so does its target leaving
the field or fainting. A move that has already triggered cannot be taken back.

A move with `steps` triggers once as its cast ends and then **channels** the
rest, one trigger per step, each step running as long as the wind-up that opened
it — the engine's stand-in for a turn. That is how Dig spends time underground,
how Thrash swings three times at the pace it swung first, and how Teleport
vanishes before it goes. Moves that want longer say so on top of it: Bide doubles
its step. A channel is not a second cast, so it is not gated on the move's
cooldown — that cooldown started when the cast finished, and the channel is the
rest of that same use.

This half of the engine was dead until recently: the channel asked
`CheckUnitCanCast` instead of `CheckUnitCanChannel`, which refused it on the
cooldown its own cast had just started, and the tick that advances a channel was
guarded on `casting`. So **no multi-step move ever ran past its first step** —
and since the first step of Dig, Fly and Teleport is the one that hides the user,
a pokemon that teleported was invulnerable, and stayed invulnerable, for the rest
of the fight. Both halves are tested now by stepping a battle a frame at a time
rather than leaping over the phase boundary.

Units are driven by the AI in [`src/battle/ai/`](../../src/battle/ai/). Every
tick, each **idle** unit — alive, not casting, not channelling, no triggered move
still pending, not locked out by a status — picks its best move and casts it. The
idle set is maintained by the lifecycle events rather than rescanned, and the
outcome check deliberately never asks the AI what it *would* do, since consuming
a random would pull every replay off its seed.

A set that stands in for a check is only worth keeping while it cannot go stale,
so two rules hold it up. **Bookkeeping opens before the thing it tracks and
closes before anything that could veto the close**: a move with no delay ends
inside the very event that started it, so a listener that marked the trigger
pending afterwards would run after the end had already come and gone and leave
its unit pending for the rest of the fight. Both halves run at `Pre`. And
**pending triggers are counted rather than flagged**, because one move can put
several in the air at once — Mirror Move casts its copy from inside the trigger
it is finishing — and a flag cleared by the first to land would free the unit
while the rest were still coming. The tick loop walks a copy of the set and
re-asks the check before letting anything act, so a stale entry costs a wasted
comparison rather than a move.

### A move the AI picks is a move that works

Before a candidate is scored it is asked whether it would **do** anything, and
one that would not is dropped rather than ranked last. A cast is time, a
cooldown and an opening, and a move that resolves to "but it failed!" spends all
three for nothing.

The first question is whether there is anybody to aim at. A move that reaches
only the far side has nothing to do once the far side is down, and a move with no
candidate target is left **out of the running** rather than offered with nothing
named — which is how a unit ends up winding up move after move at an empty field,
for ever. What reaches its own side always has the user to reach, so a survivor
can still buff itself; the rule is about who the move is for, not about whether
anybody is left at all.

Every effect that can refuse a move on trigger answers the same question
speculatively, next to the refusal itself so the two cannot drift apart:
immunity of any of the three kinds, a status the target already carries or cannot
take, Dream Eater against somebody awake, Counter with no hit to return, Mirror
Move or Mimic with nothing to copy, Disable with nothing to lock, Substitute the
user cannot afford, Rest by something that cannot sleep, a switch-out with an
empty bench, and anything a boss shrugs off. A unit whose every move is refused
casts nothing that tick and asks again on the next one, which is the honest
answer: the field, not the unit, is what has to change.

Both AI questions — is it usable, and what is it worth — run on the
**`AttackPriority`** scale, the one with a `Prepare`/`Cleanup` bracket that always
closes. That is what lets an ability scope the AI's guess the same way it scopes
the real thing: **Mold Breaker** opens its suppression window around the two
speculative events exactly as it does around `UnitTriggerMoveTarget` and
`UnitAttack`, so its holder weighs a Bone Club against a Levitating target as the
hit it will actually be. Without it the holder refuses the one move its ability
exists to let it use, and the AI would need a second, rotting copy of what Mold
Breaker ignores.

Most abilities need no such wiring, because the speculative pass already asks
what they answer: every immunity query, and the whole damage pipeline behind the
score. Two thirds of the roster reaches the AI that way — Levitate, the absorbs,
Thick Fat, Filter, Multiscale, Guts, Technician, the weather ones. What does not
is anything that only acts when a move **actually resolves**, and five of those
change what a good pick is. Each says so itself, next to the effect:

| Ability                              | What the AI is told                                 |
| ------------------------------------ | --------------------------------------------------- |
| **Damp**                             | The move cannot be cast at all — refused            |
| **Magic Guard**                      | A poison that will take no health — refused         |
| **Liquid Ooze**                      | A drain that comes back the other way — discouraged |
| **Synchronize**                      | A status that lands on the user too — discouraged   |
| **Static** and the contact punishers | Touching costs something — discouraged              |

Discouraged rather than refused, for the last three: the move still does its job,
so it loses to an equally good one that is free and beats standing about. Damp
is the odd one, because its veto lives on the cast check and the AI **cannot ask
that** — infatuation answers the same question with a coin toss, and a
speculative flip would pull every replay off its seed.

#### Setting up is for the side that has to last

In a raid the AI adds a bonus to friendly stage boosts, big enough to outbid any
non-lethal damage: a party facing a health pool that size wants its first casts
spent making the rest of them count.

**The boss is exempt.** It is not a side that has to survive a long fight — it is
the clock everybody else is racing — and its casts are already doubled, so one
spent winding up a Withdraw is one handed to the lobby. It attacks, and the buffs
it does pick it picks on their own merits like anybody outside a raid.

### What it looks like

| Phase     | The caster plays                                        |
| --------- | ------------------------------------------------------- |
| Cast      | The move's own `cast` list, **stretched over the cast** |
| Channel   | The same clip again, stretched over **each step**       |
| Otherwise | `Idle`, or `Hurt` once knocked out                      |

A move carries a **`cast`** list — animation clip names, most wanted first — and
the battle plays the first one the sprite in front of it actually has.

Sprite sheets are not uniform. Every one of them carries eleven **common** clips
(`Idle`, `Sleep`, `Hurt`, `Attack`, `Charge`, `Shoot`, `Double`, `Hop`, `Rotate`,
`Walk`, `Swing`); twenty-three more are there or not depending on what the
pokemon was drawn doing. A Machop has a `Punch`; a Magikarp does not. Naming one
clip per move would mean either every move looking the same or half the roster
playing nothing, so a move names a **preference** instead:

| Move        | Asks for                        | On a sheet without `Punch` |
| ----------- | ------------------------------- | -------------------------- |
| Fire Punch  | `Punch` → `Uppercut` → `Attack` | Swings                     |
| Blizzard    | `Emit` → `Shoot` → `Charge`     | —                          |
| Thunderbolt | `Shock` → `Emit` → `Attack`     | —                          |

The last entry is always a common clip, so the walk cannot run off the end;
[a registry test](../../test/data.test.ts) checks that of every registered move,
along with no repeats and no invented names. The sprite is asked directly —
`SpeciesSpriteAnimation.has` — rather than a table being kept of which species
owns which clip, since the sheet is the truth and a second copy of it would rot.

#### Stretched, not looped

The clip fills the **whole cast** rather than repeating inside it. A cast is
`(104 − 16 × priority)` frames and a drawn clip is however long it was drawn;
looping would run a short clip two and a half times and leave it part-way through
at the moment the move fires, which reads as a twitch rather than a wind-up.

`play(name, { duration })` scales the playhead so one pass takes exactly that
long — every frame held proportionally longer or shorter, nothing dropped. The
canvas passes the **whole** window rather than what is left of it: a rate worked
out afresh from the remainder on every frame is a rate that climbs as the
remainder shrinks, and a clip driven that way races to its end about two thirds
of the way through.

**Channelling is drawn the same way.** `ChannelingData extends CastingData`, so
the rest of a multi-step move carries the same two things a cast does — which
move, and how long this window runs — and neither needs its own case. The clip
gets one pass per **step**, so a Fury Swipes is five swipes rather than one swipe
and four seconds of standing about, and the two halves of a move look like one
move. A one-shot that has run out while the unit is still working is `restart`ed
for the next step rather than held on its last frame.

The side effect is the point: a slow move is a visibly slow wind-up and Quick
Attack is a visibly fast one. Priority stops being a number nobody can see and
becomes how long the pokemon spends gathering itself.

Nothing about this reaches the mechanics. `cast` sits beside `delay` as a purely
presentational field: the fight is the same fight with the canvas closed.

### Watching one

[`/demo/raid`](../../src/routes/demo/raid.tsx) stages a raid out of a seed: one
boss against `DEMO_TEAMS` (8) parties of `DEMO_TEAM_SIZE` (6), rolled by
[`createDemoRaidTeams`](../../src/overworld/demo-raid.ts) and fought by the same
`createRaidBattle` a real lobby uses, over the same `TeamSnapshotRecord` shape a
real lobby publishes. It writes nothing, settles no raid and pays nobody.

It exists because the engine and the sprite canvas are the two parts of the game
that need a **fight** before they can be looked at at all, and every fight the
game stages is one somebody walked to, filled a lobby for and paid for — which
made the loop that most wants watching the hardest one to reach. The seed is in
the URL, so a fight is a link and two people watch the same frames.

It also carries no session. `/demo/*` is named in `AuthProvider` as sessionless:
the provider is still mounted so `useAuth` works anywhere, but it opens no
listener and never calls `initializeApp`, and Firebase itself is imported **on
demand** inside `onMount` rather than at the top of the module. A demo battle
that opened an auth listener would be a demo battle talking to a project. The
side effect is that the SDK — by a long way the heaviest thing the browser
downloads — sits in a chunk of its own, asked for only by the pages that have a
player.

It earned its keep immediately: nothing had ever called `unit.enter()` when a
battle was built, so the AI's idle set started empty and **no unit in any raid
ever acted**. A built battle and a working battle look identical until somebody
watches one for five seconds. `addUnit` now enters each unit once it is finished
— after its health and statuses are set, since a unit announced before its health
is not alive yet and would be left out of the idle set for the same reason.

Watching it for another five turned up the next one: every unit acted **once**
and then stood still forever, because a move that resolves in the frame it
triggers closed its pending trigger before the AI had opened it. Both are the
same class of bug — a fight that is being run but not watched looks exactly like
a fight that works — and both are now held down by a test that steps a battle and
counts what happens rather than only checking that it was built.

The parties are rolled between `DEMO_MIN_LEVEL` (70) and `DEMO_MAX_LEVEL` (80),
high enough that a field of them lasts long enough against a maxed boss to be
worth watching — and out of the **fully evolved** species only (81 of the 151),
since at level 70 a Caterpie is a pokemon that would have evolved twice over long
ago, and a finished pokemon is the one with the sprite and the moveset worth
looking at. Eight full parties is a lobby the canvas can draw as eight points
of a circle, and a crowd besides: whatever the canvas does with a busy field, it
does here first.

#### Two ways to draw a field

A player watches a fight from behind their own party, so the canvas draws two
rows: the viewer's below, what it is up against above, and everybody else's team
left out — a full raid would otherwise be forty-eight pokemon, most of them
nobody's business.

A **spectator** of a raid has no party to stand behind and no reason to leave
anybody out, so they get the fight as it actually is: the **boss in the middle**,
the parties on an ellipse around it, each party a small ring of its own, and
every pokemon turned to face the middle. It says two things a pair of rows
cannot — **who came with whom**, since a party is a cluster rather than a stretch
of a line somebody has to count along, and **what the fight is**, which is one
thing with a lobby closed around it.

Facing is worked out per unit by [`facingToward`](../../src/canvas/facing.ts),
which rounds the angle to the boss to one of the eight rows a sheet carries. It
sits in its own module with its own test because a canvas y axis grows
**downward** — `down` is the larger y — and getting that backwards turns a lobby
inside out, everybody looking away from the thing they came for, without anything
failing.

A slot too small to hold its own name no longer prints one, and its bars are
drawn no wider than it is. Forty-eight overlapping names say less than none, and
the readout underneath names every one of them anyway.

**The canvas and the readout bind to the battle they are mounted with.** Both
hang their listeners on it once and hold the roster they read off it, so a new
fight needs new ones — which is why the demo renders them under a **keyed**
`Show`. Rolling another seed without that ends the old battle and then goes on
drawing it, which looks exactly like a demo that has frozen.

## Damage

The Gen V formula, resolved through events so that anything can have a say:

```text
base   = (2 × level / 5 + 2) × power × attack / defence / 50 + 2
damage = base × critical × random(0.85–1.0) × type effectiveness × STAB
```

| Part               | Value                                                   |
| ------------------ | ------------------------------------------------------- |
| Critical chance    | `1/16 × 2^ratio`, the ratio clamped to 0–4              |
| Critical damage    | ×2, and it ignores the stages that would have hurt it   |
| STAB               | ×1.5 when the move shares one of the user's types       |
| Type effectiveness | The full chart, multiplied once per type the target has |
| Random factor      | 0.85 to 1.0                                             |

A critical hit ignores the attacker's *lowered* attack stages and the defender's
*raised* defence stages, and nothing else — the mainline rule, so a sweeper that
has been snarled at still gets its crits through.

Three immunities are checked before any of that: the type chart's own, **powder**
moves against Grass types, and **Ground** moves against anything airborne — a
Flying type or a floating unit — which the `Grounded` status drags back into
range.

Physical moves read Attack against Defence and special moves Special Attack
against Special Defence; a handful of moves are flagged `Pure` and skip the
formula entirely, which is how fixed-damage moves work.

## Statuses and weather

Twenty-two statuses exist, from the familiar six to the ones that only live
inside a fight: seeded, raging, biding, recharging, substituted, trapped,
flinched, minimized, invulnerable, floating, submerged and dormant.

**Only the six non-volatile ones leave the battle** — poison, bad poison, sleep,
paralysis, burn and freeze — and all six do, so a pokemon can walk out of a raid
both poisoned and asleep. Everything else ends with the fight. Statuses are
applied to a unit when it is fielded through the ordinary path, so an immunity
refuses one and a held Rawst Berry eats itself to cure the burn before the first
move is cast.

The ones that chip away do it on their own timer rather than per turn, since
there are no turns. **Poison bites every two seconds** for an eighth — about once
per cast, which is what a turn was worth — so it is chip a fight can be played
around rather than a clock it is racing. Bad poison still bites every second and
climbs a sixteenth each time it does, which is the point of it.

Nine weathers are defined, from plain sun and rain up to the extreme forms. In a
**raid**, a weather change only affects the changing
unit's own team — unless the boss is what changed it, in which case it affects
everyone. Otherwise one player setting rain would be setting it for a party of
strangers.

## When a fight ends

Rather than watching for knockouts, the engine asks after every tick whether the
fight can still go anywhere: is anything mid-cast or mid-channel, and could any
unit still act against a living enemy? Once neither holds, the battle is over.

Reading it that way settles fights a knockout watcher would miss — a side that is
alive but permanently unable to act ends the battle exactly as a wiped one does.

Both questions are asked **only while more than one side is standing**, since
that is the only time the answer can still change anything. One side left — or
none — is a decided fight whatever anybody is still winding up. Waiting for the
field to fall quiet instead is waiting for something that may never come: a
survivor can buff itself on an empty field for ever, and a lobby of forty-eight
of them is never all idle on the same tick, so a won raid would hang there being
won.

| Field                                | Winner                                                      |
| ------------------------------------ | ----------------------------------------------------------- |
| One alliance still standing          | That alliance                                               |
| Nobody standing, in a raid           | The party — a boss taken down with the last of it is beaten |
| Nobody standing, anywhere else       | A draw                                                      |
| Several standing, nobody able to act | A draw                                                      |

The player is told so in a **dialog** rather than a line of text: the verdict
opens the moment the engine settles the fight, names it (victory, defeat or a
draw), says what it was worth, and offers the way out. Closing it leaves the
player standing on the finished field to look it over — nothing is owed to
pressing the button, since the aftermath and the outcome are written by the
effect that watches the battle settle, not by the dialog. The same sentence stays
on the page underneath afterwards, so a dismissed verdict is not a lost one.

## The four kinds of fight

| Kind                 | Sides                      | Mode | Ends the landmark for      |
| -------------------- | -------------------------- | ---- | -------------------------- |
| **Legendary raid**   | A party against a boss     | Raid | Everyone, for the window   |
| **Shadow raid**      | A party against a boss     | Raid | Everyone, for the window   |
| **Mythical raid**    | A party against a boss     | Raid | Nothing; a relic opened it |
| **Team Rocket stop** | One player against a grunt | PvP  | Only that player           |

Raids are staged by a **lair**, which is a place rather than a pokemon: the lair
decides who is at home in it, and a raid is named after the place, so two
Articuno raids in one chunk are two different names. A mythical raid is not
staged by the world at all — it is called out by spending a relic, and the world
never rolls a mythical of its own.

A lobby stands for the three-hour raid window and anyone may join it; the host
starts it. The window gives the boss **one defeat, not one fight**: a cleared
raid shuts the landmark until the next window, and a lost or abandoned one (still
unfinished ten minutes after it started) restages in place with a new host.

The plumbing — lobbies, teams, snapshots, who may claim what — is in
[Raids and battles](../firestore/raids.md).

### The raid boss

A boss is a maxed legendary with perfect IVs, zero effort, and its nature and
ability derived from the raid's own trait value, so every player in the lobby
fights exactly the same build. It carries the **`Boss`** ability alongside its
rolled one, which is what makes the fight a raid: the raid-sized health pool, the
stage immunities and the sweeping single-target moves all ride on it.

A boss opens the fight **dormant**: for the first ten seconds it is on the field
and cannot cast, which is the window a lobby has to arrive, buff up and land the
opening hits before it starts casting back. Only its first entry lies dormant —
being sent out again mid-fight skips the warm-up, so nothing can farm it.

It also shrugs off everything that would take the fight away rather than make it
harder: sleep, freeze, flinch, trapping and **infatuation**, unless it did it to
itself — a boss that Rests still sleeps. Infatuation is on that list twice over,
since a lobby of up to ten parties always contains somebody of the gender the
boss would fall for, and an Attract that landed would turn a raid into a queue of
who brought the right pokemon.

What `Boss` does to damage is worth stating plainly. **Only a hit takes health
off a boss.** Health-scaling damage never lands, and neither does anything
indirect — poison, a burn, a seed, the weather, the crash off a missed Jump Kick.
Two things still get through on purpose: a **cost** is paid whatever the payer is
(a boss that explodes still dies by it, and one that puts up a Substitute still
pays for it), and a negative amount is a heal, so drains reach it as they would
anything.

Some moves are taken off a boss before it is staged. **Transform** is banned
because a boss that copies a player stops being a boss — the copy takes the
player's stats and throws away the health pool the fight is built around — and
**Metronome**, **Mirror Move** and **Mimic** follow it, since each is a way back
to the first. **Ditto** is not staged as a boss at all: with Transform gone it
would have nothing to do, and the honest answer is that Ditto is not a raid boss
rather than that Ditto is a quiet one.

### A Team Rocket stop

A grunt fields three pokemon — one each from the biome's base, uncommon and rare
bands — all shadowed, all at `ROCKET_PARTY_LEVEL` (50), so the fight is about
what the player brought rather than how the window rolled. It is an ordinary
trainer battle: no side is flagged as a boss, so a mutual knockout is a draw
rather than a win.

The grunt fights each passer-by alone. One player's victory closes nothing for
anybody else, and losing changes nothing at all — the grunt is still standing and
can be fought again until the window turns over.

## What a fight costs and pays

A battle leaves a party where it left it. Health lost, items eaten and statuses
carried all stick, and the pokemon walks into the next fight that way — which is
what makes a party something a player looks after rather than a row of levels.

| Prize                | Gold  | Pokemon                          |
| -------------------- | ----- | -------------------------------- |
| **Legendary raid**   | 2,000 | The legendary, at level 50       |
| **Mythical raid**    | 3,000 | The mythical, at level 30        |
| **Shadow raid**      | 1,000 | A shadow, at level 25            |
| **Team Rocket stop** | 500   | A shadowed commoner, at level 10 |

Every fighter in a raid is paid the same purse: the boss decides the amount, not
who landed the last hit. A reward waits rather than expiring, so a player who
left the battle early claims it later from their history.

While a fight is live, every catch in it is **locked**: it cannot be levelled,
evolved, handed an item, traded, listed at auction or brought to a second raid.
The battle runs on a frozen snapshot, and a record that moved underneath it would
leave the two describing different pokemon — the worst case being a berry pulled
back into the bag mid-raid, eaten in the battle and still in the bag afterwards.
A lock also expires ten minutes after the fight started, so a closed tab does not
hold a party forever.
