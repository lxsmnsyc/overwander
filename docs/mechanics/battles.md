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
| **Channel**  | The remaining steps of a multi-step move | Per move                       |
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

Units are driven by the AI in [`src/battle/ai/`](../../src/battle/ai/). Every
tick, each **idle** unit — alive, not casting, not channelling, no triggered move
still pending, not locked out by a status — picks its best move and casts it. The
idle set is maintained by the lifecycle events rather than rescanned, and the
outcome check deliberately never asks the AI what it *would* do, since consuming
a random would pull every replay off its seed.

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

| Field                                | Winner                                                      |
| ------------------------------------ | ----------------------------------------------------------- |
| One alliance still standing          | That alliance                                               |
| Nobody standing, in a raid           | The party — a boss taken down with the last of it is beaten |
| Nobody standing, anywhere else       | A draw                                                      |
| Several standing, nobody able to act | A draw                                                      |

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
