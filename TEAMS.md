# Team suggestions

Four suggested teams: NPC and PvP battles, and raid battles, each with and without
legendaries. Every species, move, ability and item below was checked against the
registries in `src/data`.

## How to read this

- **Roles** are the six jobs a party of six is built around: two cores that take
  something off the field, and four supports that keep the cores standing and the
  far side hampered.
- **Moves** are listed eight at a time, because that is the cap
  ([`slots.ts`](src/data/constants/slots.ts)). The **first four are the priority
  selection**: take those first, and add the rest as the pokemon earns slots.
- **Egg moves are excluded throughout.** Every move below is reachable from the
  species' own level-up list or its teachable list, or from a pre-evolution's, so a
  caught pokemon can get there without breeding for it. See the note below on the ones
  the main series later turned into TMs.
- **Abilities** are four, which is the cap. A signature ability counts against that
  cap, so a species with a signature runs it plus three of its pool.
- **Items** are listed eight at a time, which is also the cap. The **first is the
  priority pick**.
- **Natures** name the stat raised and the stat dropped, so a support never pays for
  an attacking stat it does not use.
- **EV priority** is where the points go first. A catch earns 5 per level, 500 by level
  100, and 252 is the most any one stat takes
  ([`stats.ts`](src/data/constants/stats.ts)), so a spread is one stat maxed and the
  rest into the second. Nothing here needs a third.
- **Backup pick** is who to field instead when the matchup is bad. It keeps the role,
  not the species.
- **Each team ends with "Collect this before you build the team"**: the machines to
  buy and what they cost, the moves that have to be learned before the pokemon
  evolves, the moves only the Move Tutor teaches, and the held items with how many
  copies you need. Machines are consumed when used, so a move two pokemon both want
  is two machines.

Mechanics that shaped these picks, all verified in the engine:

- Earthquake, Surf, Bulldoze, Sludge Wave, Explosion and Self-Destruct carry
  `MoveAffects.Own`, so they hit your own five units. None of them appear here.
- Friend Guard does not stack: its listener stops at the first holder, so a second
  copy is only insurance for when the first falls.
- Regenerator and Natural Cure both trigger on leaving the field, and there is no
  bench, so they are nearly dead abilities.
- Choice items lock the holder to the first move it casts, which is wrong for every
  four-move set here.
- Against a raid boss, indirect and share-of-HP damage is capped at 200 per instance
  ([`special.ts`](src/battle/abilities/special.ts)), but each source is capped
  separately, so several clocks at once add up. **Every fraction printed in this file
  is the rule as written; against a boss each one pays at most 200.** A boss's pool is
  60x, so any share of it lands far above the cap, and the clocks are worth a flat 200
  each rather than a proportion.

## Egg moves that later generations made TMs

Three of the moves left out above are egg moves in this game only because its
learnsets stop at the generations it has imported. The main series later handed them
out as machines, and where this game and the mainline diverge it follows the newest
generation's rule. If those machine lists are ever imported, these sets get better:

| Move | Main-series machine | What it changes here |
| --- | --- | --- |
| Dragon Dance | TR51 in Sword and Shield, TM100 in Scarlet and Violet | Dragonite goes back to Dragon Dance over Hone Claws: +1 Attack and +1 Speed rather than +1 Attack and +1 accuracy |
| Encore | TM122 in Scarlet and Violet | Whimsicott takes Encore back into its priority four, locking an enemy into one move under Prankster |
| Fake Tears | TM47 in Sword and Shield, TM003 in Scarlet and Violet | Whimsicott or Breloom gets -2 Special Defense on the target, which is the biggest single damage swing available to a support |

The other three exclusions are not machines in any generation, so they stay out
whatever gets imported: **Wish** (Clefable), **Heal Bell** and **Aromatherapy**
(Blissey), and **Morning Sun** (Volcarona). Blissey losing both cleansing moves is
permanent, which is why Florges took its slot on the raid team.

---

## What the Kalos species changed

The teams were first built before the Kalos species landed. Re-checking them against
the registries moved two things and added a row of backups.

| Change | Why |
| --- | --- |
| **Florges replaces Blissey** as the non-legendary raid cleric | Blissey's Heal Bell and Aromatherapy are both egg-only, so it never actually cleansed anything. Florges learns both by levelling, and **Hothouse** lets every teammate defend special moves with Florges's 154 Special Defense whenever theirs is lower, a team-wide special wall no other support offers |
| **Clawitzer is flagged, not recommended** | **Ranging Shot** puts a floor of 1/8 of the target's HP under every special move it lands, applied to ordinary attack damage rather than to the indirect and share-of-HP damage the raid cap covers. Against a boss's 60x pool that reads as enormous. It may be unintended, so it is marked as worth testing rather than offered as a pick |
| **New backups across every role** | Klefki (Prankster, and Keyring grants a ninth item slot), Goodra (150 Special Defense, Seepage), Aegislash (Stance Change, 150 Attack in blade), Carbink (150/150 defences), Heliolisk (Backfeed heals the party on every Electric hit), and Slurpuff and Sylveon, which both reach Heal Bell without breeding |

Everything else held: the attackers, the field control and the clock plan are unchanged.

---

## Megas

Megas are not on `main` yet: everything here reads the `kalos-megas` branch
([`src/data/species/megas.ts`](src/data/species/megas.ts) and
[`src/battle/items/megas.ts`](src/battle/items/megas.ts)). If you are playing `main`,
skip this section.

**The rules, as that branch has them:**

- A Mega Stone is an ordinary **held item**, so it takes one of the eight item slots.
  Rayquaza is the exception: it needs no stone, only to know **Dragon Ascent**.
- Stones are **never sold**. They sit in the rarest band of the item pool, one weight
  each alongside the plates, so they are dug up rather than bought. A shop buys one
  back for 2,000.
- **A team Mega Evolves once per fight**, and the game picks who: the **highest level**
  first, then the **biggest Mega** by base-stat total, then whoever stands earliest in
  the party. It happens as that unit takes the field.
- The Mega's own ability is **worn on top** of the catch's four, the way an Origin
  forme's is, so nothing is given up. Stats and types change; moves, the other items
  and the catch's own abilities stay.

**The Megas these teams can reach:**

| Mega | Stat line | Ability it wears | What changes |
| --- | --- | --- | --- |
| **Mega Metagross** | 80/145/150/105/110/110 | Tough Claws (contact moves 1.3x) | +10 Attack, +20 Defense, +20 Special Defense, **+40 Speed**, and every move on its set is a contact move |
| **Mega Latias** | 80/100/120/140/150/110 | Levitate | +30 Defense, +30 Special Attack, +20 Special Defense, with Eon Shield still covering the team |
| **Mega Mewtwo Y** | 106/150/70/194/120/140 | Insomnia | +40 Special Attack and +10 Speed over Mewtwo, at the cost of 20 Defense |
| **Mega Mewtwo X** | 106/190/100/154/100/130 | Steadfast | Psychic and Fighting, with 190 Attack, for a physical build only |
| **Mega Rayquaza** | 105/180/100/180/100/115 | Delta Stream | +30 in both attacking stats and +20 Speed, and it needs no stone |

**What to do on each team:**

- **PvP without legendaries**: the stone goes on **Metagross** (Metagrossite). Tough
  Claws gives Meteor Mash, Bullet Punch, Zen Headbutt and Ice Punch 1.3x each, all
  four being contact moves, and 110 Speed turns it from the slow half of the team into
  the fast half. It is the only Mega on that six.
- **PvP with legendaries**: **Mega Rayquaza** takes the slot for free, since Dragon
  Ascent is already in its set and no stone is needed. Do not also carry a stone for
  Mewtwo or Latias: the team only gets one Mega, and Rayquaza is both the highest
  base-stat total and, at the levels these fights run at, usually the pick.
- **Raids without legendaries**: **Metagross** again, for the same reason. Against a
  boss it also gains from Tough Claws stacking with Steelworker and Hive Mind.
- **Raids with legendaries**: this is the real choice. **Mega Latias** keeps Eon Shield
  running and adds 30 Special Defense to the unit the party leans on, while **Mega
  Metagross** is 1.3x on the team's main attacker. Take Latias for a boss that is
  killing you and Metagross for a boss you are failing to out-damage.

**Two traps in the automatic pick:**

1. **It reads level before anything else.** A higher-level teammate holding any stone
   takes the Mega, whatever you intended. The simplest rule is one stone per team.
2. **Rayquaza cannot opt out.** Knowing Dragon Ascent is enough, so it will consume the
   team's one Mega even if you would rather Mega Evolve something else. Drop Dragon
   Ascent from its set if you want the Mega elsewhere.

**Worth knowing for other builds:** **Mega Audino** (103/60/126/80/126/50, Healer) is
the best Mega available to a stall team, and the weather Megas set weather without a
move: **Mega Charizard Y** carries Drought, **Mega Tyranitar** Sand Stream and
**Mega Abomasnow** Snow Warning.

## Shadows

A shadow is caught from a shadow raid and carries the **Shadow** ability for good. It
is a stat trade, read straight off the sheet
([`special.ts`](src/battle/abilities/special.ts)):

- **Attack and Special Attack count 1.25x.**
- **Defense and Special Defense count 0.75x**, so it takes about a third more damage.
- HP and Speed are untouched.
- Shadow is in the special tier, so it **costs no ability slot** and cannot be
  suppressed. A shadow still holds its own four abilities.

Two costs that are not on the stat sheet:

- A shadow **pays twice the candy at every level**.
- A shadow **arrives with zero friendship**, and no groomer will take one, so every
  point has to be walked for. That matters for Return and for the Move Tutor, who only
  teaches at the most friendship a pokemon can have.
- A **Purifying Gem** undoes all of it: Shadow becomes the cosmetic `Purified`, the
  candy cost drops back, **every value goes up by two**, and it is handed the
  friendship a fresh catch gets. Purifying is the right move on a shadow you wanted for
  its values rather than for the trade.

A shadow can still Mega Evolve, and the Mega's ability is worn on top, so the two stack.

**Who should be a shadow**

| Pokemon | Shadow? | Why |
| --- | --- | --- |
| **Metagross** | **Yes**, first pick | Attack reads 169 rather than 135, and its 130 Defense can afford to drop to 98. It is the one unit on three of the four teams whose whole job is damage |
| **Hydreigon** | **Yes** | Special Attack reads 156. Its damage is the PvP team's spread threat, and Levitate plus the team's screens cover the softer defences |
| **Mewtwo** | **Yes** | Special Attack reads 193, and Magic Guard plus Recover keep it standing without needing its defences |
| **Rayquaza** | **Yes, with a warning** | 188 in both attacking stats, but Dragon Ascent comes from the Move Tutor at full friendship, and a shadow starts at zero. Walk the friendship up before the tutor, or it has no Mega and no Flying move |
| **Chandelure** | **Only in PvP** | 181 Special Attack is the biggest single gain on any of these teams, but in a raid the boss hits your whole side and 68/68 defences on a 60 HP body will not survive it |
| **Breloom** | **No** | Its defences are already 80/60, and Mycelium only multiplies the party's damage **while it stands**. A dead Breloom costs more than 162 Attack is worth |
| **Volcarona** | **No** | It wins by surviving long enough to stack Quiver Dance. Dropping its 105 Special Defense works against the only plan it has |
| **Clefable, Blissey, Latias, Togekiss, Magcargo, Whimsicott** | **Never** | Every one of them is paid for by standing: Friend Guard, Eon Shield, Wishing Well, Ward, Magma Trail, Follow Me and the screens all stop the moment they fall. A third more damage taken is the exact opposite of what they are for |

**The rule of thumb**: shadow the units whose contribution is the damage they deal, and
never the units whose contribution is that they are still on the field. On these four
teams that means one or two shadows, not six.

**If you catch a shadow of a support**, purify it. The gem turns a liability into two
extra points in every value, which is a straight upgrade for a Clefable or a Blissey.

---

## NPC and PvP battles, without legendaries

Two cores that take something off the field, and four supports that keep them standing.

| Role | Pokemon | Nature | EV priority | Backup pick |
| --- | --- | --- | --- | --- |
| Field control | **Whimsicott** 60/67/85/77/75/116 | Timid (+Speed, -Attack) | 252 Speed, 248 HP | Klefki (Prankster, screens, Thunder Wave) |
| Redirector | **Togekiss** 85/50/95/120/115/80 | Calm (+Special Defense, -Attack) | 252 HP, 248 Special Defense | Clefable (Follow Me, Friend Guard) |
| Protector and healer | **Clefable** 95/70/73/95/90/60 | Bold (+Defense, -Attack) | 252 HP, 248 Defense | Florges (Wish, Heal Bell, Hothouse) |
| Core, spread damage | **Hydreigon** 92/105/90/125/90/98 | Modest (+Special Attack, -Attack) | 252 Special Attack, 248 Speed | Goodra (Draco Meteor, 150 Special Defense) |
| Core, setup sweeper | **Dragonite** 91/134/95/100/100/80 | Adamant (+Attack, -Special Attack) | 252 Attack, 248 Speed | Aegislash (Swords Dance, 150 Attack in blade) |
| Core, immediate damage | **Metagross** 80/135/130/95/90/70 | Adamant (+Attack, -Special Attack) | 252 Attack, 248 HP | Aegislash, or Tyrantrum (Jaw Snap) |

### Loadouts

| Pokemon | Abilities (4) | Moves, priority four | Moves 5 to 8 | Items, priority first |
| --- | --- | --- | --- | --- |
| Whimsicott | Spore Drift, Prankster, Magic Bounce, Infiltrator | Taunt, Cotton Spore, Tailwind, Stun Spore | Leech Seed, Charm, Moonblast, Substitute | Focus Sash, Leftovers, Bright Powder, Clear Amulet, Lax Incense, Mental Herb, Shell Bell, Quick Claw |
| Togekiss | Fair Share, Serene Grace, Friend Guard, Super Luck | Follow Me, Air Slash, Roost, Thunder Wave | Dazzling Gleam, Wish, Light Screen, Encore | Rocky Helmet, Leftovers, Bright Powder, Lax Incense, Shell Bell, Light Clay, Focus Band, Wide Lens |
| Clefable | Wishing Well, Magic Guard, Unaware, Friend Guard | Reflect, Light Screen, Soft-Boiled, Moonblast | Encore, Charm, Thunder Wave, Follow Me | Light Clay, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
| Hydreigon | Three Heads, Levitate, Berserk, Pressure | Draco Meteor, Dark Pulse, Flamethrower, Nasty Plot | Earth Power, Flash Cannon, Tailwind, Protect | White Herb, Expert Belt, Leftovers, Wise Glasses, Focus Sash, Shell Bell, Wide Lens, Scope Lens |
| Dragonite | Serene Storm, Multiscale, Marvel Scale, Inner Focus | Hone Claws, Dragon Claw, Fire Punch, Roost | Iron Head, Thunder Punch, Waterfall, Substitute | Protective Pads, Leftovers, Expert Belt, Muscle Band, Shell Bell, Focus Sash, Wide Lens, Quick Claw |
| Metagross | Hive Mind, Steelworker, Clear Body, Levitate | Meteor Mash, Bullet Punch, Zen Headbutt, Ice Punch | Iron Head, Hammer Arm, Rock Slide, Protect | Expert Belt, Wide Lens, Muscle Band, Leftovers, Shell Bell, Scope Lens, Protective Pads, Quick Claw |

### Notes

- Whimsicott moves first at Speed 116 with Prankster. Spore Drift makes Stun Spore and Cotton Spore unmissable, and Magic Bounce returns an enemy status move to its sender.
- Togekiss holds Follow Me so Dragonite and Hydreigon get a free setup turn. Serene Grace doubles Air Slash's 30% flinch to 60%.
- Clefable's Wishing Well heals the lowest teammate every time it acts, so healing costs no move slot.
- Hydreigon's Three Heads bites a second enemy for a third of the damage on every move, with no friendly fire.
- Dragonite runs Hone Claws because Dragon Dance is egg-only here. Swap Fire Punch for Iron Head against a Fairy-heavy field.
- Metagross carries the team's only priority move in Bullet Punch, and Steelworker 1.5x with Hive Mind 1.3x puts Meteor Mash near 175 effective power.
- **EV note**: a level 100 catch has 500 points, 5 per level, and 252 is the most any one stat takes, so every spread here is one stat maxed and the rest into the second.

### Collect this before you build the team

**Machines to buy.** A machine is stocked by the item market as `TM <move name>`, and
it is **spent on use**, so the counts below are per pokemon rather than per move: two
pokemon wanting Protect need two machines.

| Price each | Moves |
| --- | --- |
| 2,000 | Hone Claws, Light Screen, Protect x2, Reflect, Roost, Soft-Boiled, Substitute x2, Tailwind, Taunt, Thunder Wave x2 |
| 5,000 | Dark Pulse, Dazzling Gleam, Dragon Claw, Fire Punch, Flash Cannon, Ice Punch, Iron Head x2, Rock Slide, Thunder Punch, Waterfall |
| 12,000 | Draco Meteor, Earth Power, Flamethrower |

Machines for this team come to **117,000** in total.

**Learn these before evolving**, since they sit on a pre-evolution's level-up list. If you miss one, the Move Reminder will put it back for a Heart Scale:

- Bullet Punch (Metagross: level 32 as Metang)
- Charm (Clefable: level 1 as Cleffa)
- Charm (Whimsicott: level 28 as Cottonee)
- Cotton Spore (Whimsicott: level 17 as Cottonee)
- Encore (Clefable: level 4 as Cleffa)
- Encore (Togekiss: level 25 as Togepi)
- Follow Me (Clefable: level 17 as Clefairy)
- Follow Me (Togekiss: level 26 as Togepi)
- Leech Seed (Whimsicott: level 8 as Cottonee)
- Light Screen (Clefable: level 48 as Clefairy)
- Meteor Mash (Metagross: level 50 as Metang)
- Moonblast (Clefable: level 46 as Clefairy)
- Nasty Plot (Hydreigon: level 56 as Deino)
- Stun Spore (Whimsicott: level 10 as Cottonee)
- Wish (Togekiss: level 31 as Togepi)
- Zen Headbutt (Metagross: level 52 as Metang)

**Held items to buy:**

| Item | Copies | Price each |
| --- | --- | --- |
| Shell Bell | 6 | 5,000 |
| Quick Claw | 4 | 5,000 |
| Wide Lens | 4 | 5,000 |
| Bright Powder | 3 | 5,000 |
| Expert Belt | 3 | 5,000 |
| Focus Sash | 3 | 3,000 |
| Lax Incense | 3 | 3,000 |
| Focus Band | 2 | 5,000 |
| Light Clay | 2 | 5,000 |
| Mental Herb | 2 | 3,000 |
| Muscle Band | 2 | 5,000 |
| Protective Pads | 2 | 5,000 |
| Scope Lens | 2 | 5,000 |
| Clear Amulet | 1 | 5,000 |
| Rocky Helmet | 1 | 5,000 |
| White Herb | 1 | 3,000 |
| Wise Glasses | 1 | 5,000 |

Items for this team come to **192,000**, so the whole team costs about **309,000** plus what you find.

**Not stocked by the market, so these have to be found**: Leftovers x6.

---

## NPC and PvP battles, with legendaries

The same six roles, with legendaries allowed. Rayquaza is the Mega here, since Dragon Ascent needs no stone.

| Role | Pokemon | Nature | EV priority | Backup pick |
| --- | --- | --- | --- | --- |
| Field control | **Tornadus** 79/115/70/125/80/111 | Timid (+Speed, -Attack) | 252 Special Attack, 248 Speed | Whimsicott (Prankster, Taunt, Encore) |
| Protector and healer | **Latias** 80/80/90/110/130/110 | Calm (+Special Defense, -Attack) | 252 HP, 248 Special Defense | Florges (Hothouse, Wish, Heal Bell) |
| Redirector | **Togekiss** 85/50/95/120/115/80 | Calm (+Special Defense, -Attack) | 252 HP, 248 Special Defense | Clefable (Follow Me, Friend Guard) |
| Core, special | **Mewtwo** 106/110/90/154/90/130 | Timid (+Speed, -Attack) | 252 Special Attack, 248 Speed | Hydreigon (Three Heads spread) |
| Core, physical | **Rayquaza** 105/150/90/150/90/95 | Adamant (+Attack, -Special Attack) | 252 Attack, 248 Speed | Dragonite (Multiscale, Hone Claws) |
| Second protector | **Clefable** 95/70/73/95/90/60 | Bold (+Defense, -Attack) | 252 HP, 248 Defense | Goodra (150 Special Defense, Seepage) |

### Loadouts

| Pokemon | Abilities (4) | Moves, priority four | Moves 5 to 8 | Items, priority first |
| --- | --- | --- | --- | --- |
| Tornadus | Windfall, Prankster, Defiant, Wind Rider | Tailwind, Taunt, Hurricane, Heat Wave | Air Slash, Knock Off, Nasty Plot, U-turn | Wide Lens, Leftovers, Expert Belt, Wise Glasses, Focus Sash, Zoom Lens, Bright Powder, Shell Bell |
| Latias | Eon Shield, Levitate, Healer, Multiscale | Wish, Heal Pulse, Reflect, Light Screen | Recover, Dragon Pulse, Tailwind, Helping Hand | Soul Dew, Light Clay, Leftovers, Shell Bell, Bright Powder, Focus Sash, Lax Incense, Wide Lens |
| Togekiss | Fair Share, Serene Grace, Friend Guard, Super Luck | Follow Me, Air Slash, Roost, Thunder Wave | Dazzling Gleam, Wish, Light Screen, Encore | Rocky Helmet, Leftovers, Bright Powder, Lax Incense, Shell Bell, Light Clay, Focus Band, Wide Lens |
| Mewtwo | Genetic Apex, Magic Guard, Pressure, Unnerve | Calm Mind, Psystrike, Aura Sphere, Ice Beam | Recover, Thunderbolt, Shadow Ball, Taunt | Expert Belt, Leftovers, Wise Glasses, Focus Sash, Shell Bell, Scope Lens, Bright Powder, Quick Claw |
| Rayquaza | Primal Sky, Multiscale, Intimidate, Air Lock | Dragon Dance, Dragon Ascent, Extreme Speed, Dragon Claw | Iron Head, Stone Edge, Waterfall, Protect | Protective Pads, Leftovers, Muscle Band, Expert Belt, Shell Bell, Focus Sash, Scope Lens, Wide Lens |
| Clefable | Wishing Well, Magic Guard, Unaware, Friend Guard | Reflect, Light Screen, Soft-Boiled, Moonblast | Encore, Charm, Thunder Wave, Follow Me | Light Clay, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |

### Notes

- Windfall gives the team 1.3x on Flying moves, which Togekiss's Air Slash collects as well. Wide Lens is Tornadus's first item because Hurricane sits at 70 accuracy.
- Eon Shield 0.8x multiplies with Clefable's Friend Guard 0.75x, so a hit on anyone but Latias lands at 0.6x before screens.
- Primal Sky pays in +2 Special Attack and 1.3x Dragon, so an Adamant Rayquaza collects the Dragon half only. Run Naughty or Hardy to keep both halves.
- Rayquaza consumes the team's one Mega automatically once it knows Dragon Ascent. Drop the move if you want the Mega elsewhere.

### Collect this before you build the team

**Machines to buy.** A machine is stocked by the item market as `TM <move name>`, and
it is **spent on use**, so the counts below are per pokemon rather than per move: two
pokemon wanting Protect need two machines.

| Price each | Moves |
| --- | --- |
| 2,000 | Calm Mind, Light Screen x2, Protect, Reflect x2, Roost, Soft-Boiled, Tailwind, Taunt x2, Thunder Wave x2 |
| 5,000 | Dazzling Gleam, Iron Head, Knock Off, Shadow Ball, U-turn, Waterfall |
| 12,000 | Heat Wave, Ice Beam, Stone Edge, Thunderbolt |

Machines for this team come to **104,000** in total.

**Move Tutor, one Heart Scale each**: Dragon Ascent (Rayquaza). No machine is sold for these, and the tutor only teaches them at full friendship.

**Learn these before evolving**, since they sit on a pre-evolution's level-up list. If you miss one, the Move Reminder will put it back for a Heart Scale:

- Charm (Clefable: level 1 as Cleffa)
- Encore (Clefable: level 4 as Cleffa)
- Encore (Togekiss: level 25 as Togepi)
- Follow Me (Clefable: level 17 as Clefairy)
- Follow Me (Togekiss: level 26 as Togepi)
- Light Screen (Clefable: level 48 as Clefairy)
- Moonblast (Clefable: level 46 as Clefairy)
- Wish (Togekiss: level 31 as Togepi)

**Late level-up moves**, which the pokemon only reaches near the level cap:

- Aura Sphere (Mewtwo: level 100)
- Dragon Pulse (Latias: level 70)
- Extreme Speed (Rayquaza: level 60)
- Heal Pulse (Latias: level 65)
- Psystrike (Mewtwo: level 100)
- Recover (Mewtwo: level 70)

**Held items to buy:**

| Item | Copies | Price each |
| --- | --- | --- |
| Shell Bell | 6 | 5,000 |
| Bright Powder | 5 | 5,000 |
| Focus Sash | 4 | 3,000 |
| Wide Lens | 4 | 5,000 |
| Expert Belt | 3 | 5,000 |
| Lax Incense | 3 | 3,000 |
| Light Clay | 3 | 5,000 |
| Focus Band | 2 | 5,000 |
| Quick Claw | 2 | 5,000 |
| Scope Lens | 2 | 5,000 |
| Wise Glasses | 2 | 5,000 |
| Mental Herb | 1 | 3,000 |
| Muscle Band | 1 | 5,000 |
| Protective Pads | 1 | 5,000 |
| Rocky Helmet | 1 | 5,000 |
| Zoom Lens | 1 | 5,000 |

Items for this team come to **189,000**, so the whole team costs about **293,000** plus what you find.

**Not stocked by the market, so these have to be found**: Leftovers x6, Soul Dew x1.

---

## Raid battles, without legendaries

A boss has 60x HP, doubled stats, and its single-target moves hit your whole side. It is immune to sleep, freeze, flinch, trapping, infatuation, Taunt, Encore, Torment and Imprison, and to forced switching. Burn, poison, paralysis, Leech Seed, Curse and confusion all land, and redirection is worthless. The plan is several capped clocks at once, plus uncapped multipliers on three attackers.

| Role | Pokemon | Nature | EV priority | Backup pick |
| --- | --- | --- | --- | --- |
| Burn, Curse, main special damage | **Chandelure** 60/55/90/145/90/80 | Modest (+Special Attack, -Attack) | 252 Special Attack, 248 HP | Gengar (Will-O-Wisp, Hex, Night Terror) |
| Leech Seed and party multiplier | **Breloom** 60/130/80/60/60/70 | Adamant (+Attack, -Special Attack) | 252 Attack, 248 HP | Amoonguss (Spore, Rage Powder, Regenerator) |
| Toxic and per-action chip | **Magcargo** 60/50/120/90/80/30 | Bold (+Defense, -Attack) | 252 HP, 248 Defense | Trevenant (Harvest, Natural Cure) |
| Primary physical damage | **Metagross** 80/135/130/95/90/70 | Adamant (+Attack, -Special Attack) | 252 Attack, 248 HP | Aegislash (150 Attack in blade, Turn the Blade) |
| Protector and passive healer | **Clefable** 95/70/73/95/90/60 | Bold (+Defense, -Attack) | 252 HP, 248 Defense | Carbink (150/150 defences, Crystal Growth) |
| Cleric and damage support | **Florges** 78/65/68/112/154/75 | Calm (+Special Defense, -Attack) | 252 HP, 248 Special Defense | Blissey (255 HP, Cushioned, but no cleansing) |

### Loadouts

| Pokemon | Abilities (4) | Moves, priority four | Moves 5 to 8 | Items, priority first |
| --- | --- | --- | --- | --- |
| Chandelure | Hexlight, Infiltrator, Flash Fire, Flame Body | Will-O-Wisp, Curse, Hex, Fire Blast | Overheat, Shadow Ball, Protect, Confuse Ray | Wide Lens, Focus Sash, Expert Belt, Leftovers, Wise Glasses, Shell Bell, Bright Powder, Zoom Lens |
| Breloom | Mycelium, Poison Heal, Technician, Quick Feet | Leech Seed, Drain Punch, Facade, Mach Punch | Seed Bomb, Swords Dance, Protect, Substitute | Toxic Orb, Big Root, Expert Belt, Wide Lens, Muscle Band, Leftovers, Shell Bell, Protective Pads |
| Magcargo | Magma Trail, Flame Body, Solid Rock, Magma Armor | Lava Plume, Fire Blast, Protect, Toxic | Earth Power, Rock Slide, Yawn, Rest | Leftovers, Rocky Helmet, Shell Bell, Wide Lens, Wise Glasses, Bright Powder, Focus Band, Light Clay |
| Metagross | Hive Mind, Steelworker, Clear Body, Levitate | Meteor Mash, Bullet Punch, Zen Headbutt, Ice Punch | Iron Head, Hammer Arm, Rock Slide, Protect | Expert Belt, Wide Lens, Muscle Band, Leftovers, Shell Bell, Scope Lens, Protective Pads, Focus Band |
| Clefable | Wishing Well, Magic Guard, Unaware, Friend Guard | Reflect, Light Screen, Soft-Boiled, Toxic | Moonblast, Charm, Cosmic Power, Protect | Light Clay, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
| Florges | Hothouse, Flower Veil, Unaware, Symbiosis | Wish, Heal Bell, Aromatherapy, Moonblast | Light Screen, Safeguard, Helping Hand, Protect | Leftovers, Light Clay, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |

### Notes

- **Florges replaces Blissey**, which is the one change the Kalos species forced. Blissey's Heal Bell and Aromatherapy are both egg-only, so it could not actually cleanse; Florges learns both by levelling, and its Hothouse lets every teammate defend special moves with Florges's 154 Special Defense whenever theirs is lower. That is why its EVs go into Special Defense: the stat is shared with the party.
- Cast Will-O-Wisp first. Against the burn, Hex doubles to 130 base and takes Hexlight 1.4x and Mycelium 1.2x, neither of which is capped.
- Clefable applies the Toxic clock rather than Magcargo, because it acts far more often.
- Blissey is still the better pick if the boss deals no status: 255 HP and Cushioned outlast Florges, they simply cannot cure anything.

### What runs at once on this team

| Clock | Source | Written as | Against a boss | When |
| --- | --- | --- | --- | --- |
| Burn | Chandelure, two Flame Bodies as backup | 1/16 of max HP | 200 | every 2 seconds |
| Badly poisoned | Clefable | a growing share | 200 | every 2 seconds |
| Leech Seed | Breloom | 1/8 of max HP | 200 | every 2 seconds |
| Curse | Chandelure, for half its own HP | 1/4 of max HP | 200 | every boss action |
| Magma Trail | Magcargo, once it has landed a move | 1/16 of max HP | 200 | every boss action |

Uncapped multipliers on top: Mycelium 1.2x for the whole party against the statused
boss, Hexlight 1.4x for Chandelure, Hex doubling to 130 base, and Steelworker 1.5x
with Hive Mind 1.3x on Metagross.

Do not paralyse the boss with this team. Paralysis halves its Speed, and both Curse
and Magma Trail are paid per boss action.

### Matchups that break this team

A boss rolls one of its own species abilities alongside Boss
([`raid.ts`](src/overworld/raid.ts)), so plan for the roll.

| Boss trait | What it takes away | What to do |
| --- | --- | --- |
| Fire type | Fire cannot be burned, so Will-O-Wisp fails. Chandelure and Magcargo are both resisted | Clefable's Toxic becomes the status that feeds Mycelium and Hexlight. Metagross and Breloom carry the damage |
| Flash Fire, Heatproof or Thick Fat | Fire damage blanked or halved | Same answer, and swap Magcargo for Blissey or Carbink, since only its Magma Trail still works |
| Steel or Poison type | Toxic fails | Keep the burn as the status, applied by Magcargo's Lava Plume and Flame Body |
| Grass type | Leech Seed fails | Breloom runs Swords Dance in its place |
| Levitate or Flying | Magcargo's Earth Power misses | Rock Slide instead |
| Heavy status output | Florges is the whole answer, with Heal Bell and Aromatherapy | Keep Florges over Blissey |

Two of this team's six are Fire, but its damage core is Metagross (Steel) and Breloom
(Fighting and Grass), so a Fire-immune boss costs it the burn rather than the fight.

### Collect this before you build the team

**Machines to buy.** A machine is stocked by the item market as `TM <move name>`, and
it is **spent on use**, so the counts below are per pokemon rather than per move: two
pokemon wanting Protect need two machines.

| Price each | Moves |
| --- | --- |
| 2,000 | Heal Bell, Helping Hand, Light Screen, Protect x6, Reflect, Rest, Safeguard, Soft-Boiled, Substitute, Swords Dance, Toxic x2 |
| 5,000 | Drain Punch, Facade, Ice Punch, Iron Head, Rock Slide |
| 12,000 | Fire Blast x2 |

Machines for this team come to **83,000** in total.

**Learn these before evolving**, since they sit on a pre-evolution's level-up list. If you miss one, the Move Reminder will put it back for a Heart Scale:

- Aromatherapy (Florges: level 33 as Flabebe)
- Bullet Punch (Metagross: level 32 as Metang)
- Charm (Clefable: level 1 as Cleffa)
- Confuse Ray (Chandelure: level 10 as Litwick)
- Cosmic Power (Clefable: level 33 as Clefairy)
- Curse (Chandelure: level 32 as Litwick)
- Earth Power (Magcargo: level 56 as Slugma)
- Hex (Chandelure: level 16 as Litwick)
- Lava Plume (Magcargo: level 38 as Slugma)
- Leech Seed (Breloom: level 10 as Shroomish)
- Light Screen (Clefable: level 48 as Clefairy)
- Meteor Mash (Metagross: level 50 as Metang)
- Moonblast (Clefable: level 46 as Clefairy)
- Moonblast (Florges: level 41 as Flabebe)
- Overheat (Chandelure: level 52 as Litwick)
- Rock Slide (Magcargo: level 43 as Slugma)
- Seed Bomb (Breloom: level 41 as Shroomish)
- Shadow Ball (Chandelure: level 36 as Litwick)
- Will-O-Wisp (Chandelure: level 16 as Litwick)
- Wish (Florges: level 20 as Flabebe)
- Yawn (Magcargo: level 1 as Slugma)
- Zen Headbutt (Metagross: level 52 as Metang)

**Held items to buy:**

| Item | Copies | Price each |
| --- | --- | --- |
| Shell Bell | 6 | 5,000 |
| Bright Powder | 4 | 5,000 |
| Focus Band | 4 | 5,000 |
| Wide Lens | 4 | 5,000 |
| Expert Belt | 3 | 5,000 |
| Light Clay | 3 | 5,000 |
| Lax Incense | 2 | 3,000 |
| Mental Herb | 2 | 3,000 |
| Muscle Band | 2 | 5,000 |
| Protective Pads | 2 | 5,000 |
| Quick Claw | 2 | 5,000 |
| Wise Glasses | 2 | 5,000 |
| Focus Sash | 1 | 3,000 |
| Rocky Helmet | 1 | 5,000 |
| Scope Lens | 1 | 5,000 |
| Toxic Orb | 1 | 6,000 |
| Zoom Lens | 1 | 5,000 |

Items for this team come to **196,000**, so the whole team costs about **279,000** plus what you find.

**Not stocked by the market, so these have to be found**: Leftovers x6, Big Root x1.

---

## Raid battles, with legendaries

The same five clocks, with a sun core, and deliberately not built entirely out of Fire: one rolled Flash Fire, Heatproof or Thick Fat, or simply a Fire-type boss, would otherwise blank both the damage and the status.

| Role | Pokemon | Nature | EV priority | Backup pick |
| --- | --- | --- | --- | --- |
| Burn, Curse, special damage | **Chandelure** 60/55/90/145/90/80 | Modest (+Special Attack, -Attack) | 252 Special Attack, 248 HP | Gengar (Night Terror blocks the boss healing) |
| Sun setter, per-action clock, sweeper | **Volcarona** 85/60/65/135/105/100 | Modest (+Special Attack, -Attack) | 252 Special Attack, 248 HP | Heliolisk (Backfeed heals the team on every Electric hit) |
| Primary physical damage | **Metagross** 80/135/130/95/90/70 | Adamant (+Attack, -Special Attack) | 252 Attack, 248 HP | Aegislash, or Clawitzer (see the note) |
| Leech Seed and party multiplier | **Breloom** 60/130/80/60/60/70 | Adamant (+Attack, -Special Attack) | 252 Attack, 248 HP | Amoonguss (Spore, Rage Powder) |
| Protector and healer | **Latias** 80/80/90/110/130/110 | Calm (+Special Defense, -Attack) | 252 HP, 248 Special Defense | Florges (Hothouse, Heal Bell, Aromatherapy) |
| Second protector and Toxic clock | **Clefable** 95/70/73/95/90/60 | Bold (+Defense, -Attack) | 252 HP, 248 Defense | Goodra (150 Special Defense, Seepage) |

### Loadouts

| Pokemon | Abilities (4) | Moves, priority four | Moves 5 to 8 | Items, priority first |
| --- | --- | --- | --- | --- |
| Chandelure | Hexlight, Infiltrator, Flash Fire, Flame Body | Will-O-Wisp, Curse, Hex, Fire Blast | Overheat, Shadow Ball, Protect, Confuse Ray | Wide Lens, Focus Sash, Expert Belt, Leftovers, Wise Glasses, Shell Bell, Bright Powder, Zoom Lens |
| Volcarona | Ember Halo, Drought, Magic Guard, Flame Body | Quiver Dance, Fiery Dance, Bug Buzz, Roost | Heat Wave, Flamethrower, Giga Drain, Protect | Leftovers, Expert Belt, Wise Glasses, Shell Bell, Focus Sash, Bright Powder, Wide Lens, Zoom Lens |
| Metagross | Hive Mind, Steelworker, Clear Body, Levitate | Meteor Mash, Bullet Punch, Zen Headbutt, Ice Punch | Iron Head, Hammer Arm, Rock Slide, Protect | Expert Belt, Wide Lens, Muscle Band, Leftovers, Shell Bell, Scope Lens, Protective Pads, Focus Band |
| Breloom | Mycelium, Poison Heal, Technician, Quick Feet | Leech Seed, Drain Punch, Facade, Mach Punch | Seed Bomb, Swords Dance, Protect, Substitute | Toxic Orb, Big Root, Expert Belt, Wide Lens, Muscle Band, Leftovers, Shell Bell, Protective Pads |
| Latias | Eon Shield, Levitate, Healer, Multiscale | Wish, Heal Pulse, Reflect, Light Screen | Recover, Helping Hand, Dragon Pulse, Protect | Soul Dew, Light Clay, Leftovers, Shell Bell, Bright Powder, Focus Sash, Lax Incense, Wide Lens |
| Clefable | Wishing Well, Magic Guard, Unaware, Friend Guard | Toxic, Reflect, Light Screen, Soft-Boiled | Charm, Moonblast, Cosmic Power, Protect | Light Clay, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |

### Notes

- **Heatran is the conditional swap.** Its Lavadome gives the whole party 1.25x against a burned boss, the best multiplier this team can reach, but it is burn-locked and a third Fire body. Put it in for Metagross once you know the boss is neither Fire-type nor carrying Flash Fire, Heatproof or Thick Fat.
- **Clawitzer is worth testing, and may be a bug.** Ranging Shot puts a floor of 1/8 of the target's HP under every special move it lands, and it is applied to ordinary attack damage rather than to the indirect or share-of-HP damage the boss cap covers. Against 60x HP that reads as enormous. Treat it as untested rather than as a recommendation, and expect it to change.
- Drought gives every Fire move on the team 1.5x. Morning Sun would heal two thirds under it, but it is egg-only on Volcarona, so Roost is the heal.
- Ember Halo is a second per-action clock beside Curse, and unlike Curse it costs nothing to set up and needs no cast.

### What runs at once on this team

| Clock | Source | Written as | Against a boss | When |
| --- | --- | --- | --- | --- |
| Burn | Chandelure, Volcarona's Flame Body as backup | 1/16 of max HP | 200 | every 2 seconds |
| Badly poisoned | Clefable | a growing share | 200 | every 2 seconds |
| Leech Seed | Breloom | 1/8 of max HP | 200 | every 2 seconds |
| Curse | Chandelure, for half its own HP | 1/4 of max HP | 200 | every boss action |
| Ember Halo | Volcarona, automatically | 1/16 of max HP | 200 | every boss action |

The three on the two-second clock are worth about 100 damage a second each. The two
per-action clocks pay 200 every time the boss acts. Against a pool of 60x HP none of
them is a share of anything: they are five flat trickles that ignore the boss's
defences entirely.

Uncapped multipliers on top: sun 1.5x on Fire, Mycelium 1.2x for the party, Hexlight
1.4x for Chandelure, Steelworker 1.5x with Hive Mind 1.3x on Metagross, and Quiver
Dance stacking on Volcarona. With Heatran swapped in, Lavadome adds 1.25x for
everybody against a burned boss.

Do not add paralysis to this team. It slows the boss, and both Curse and Ember Halo
are paid per boss action.

### Matchups that break this team

| Boss trait | What it takes away | What to do |
| --- | --- | --- |
| Fire type | Fire cannot be burned, so Will-O-Wisp fails, Lavadome is dead, and Fire damage is resisted | Lead with Clefable's Toxic as the status that feeds Mycelium and Hexlight. Keep Metagross, leave Heatran out |
| Flash Fire | Fire moves do nothing, and the boss's own Fire moves gain 1.5x | Same answer. Chandelure still contributes Curse, Hex and the burn |
| Heatproof or Thick Fat | Fire damage halved | Metagross and Breloom carry the damage; Heatran stays out |
| Air Lock or Cloud Nine | Drought is cancelled, so the sun's 1.5x disappears | Volcarona still brings Ember Halo and Quiver Dance, which do not need the sun |
| Steel or Poison type | Toxic fails | The burn is your status instead, so this is the case where Heatran is best |
| Grass type | Leech Seed fails | Drop it for Swords Dance on Breloom |
| Electric type | Paralysis fails, which this team never used anyway | Nothing |
| Dry Skin | Nothing: it takes 1.25x from Fire | Bring Heatran and both Fire attackers |

The rule this team is built around: **never let one type carry both the status engine
and the damage**, because a single rolled ability takes out both at once.

### Collect this before you build the team

**Machines to buy.** A machine is stocked by the item market as `TM <move name>`, and
it is **spent on use**, so the counts below are per pokemon rather than per move: two
pokemon wanting Protect need two machines.

| Price each | Moves |
| --- | --- |
| 2,000 | Light Screen, Protect x6, Reflect x2, Roost, Soft-Boiled, Substitute, Swords Dance, Toxic |
| 5,000 | Drain Punch, Facade, Giga Drain, Ice Punch, Iron Head, Rock Slide |
| 12,000 | Fire Blast, Flamethrower |

Machines for this team come to **82,000** in total.

**Learn these before evolving**, since they sit on a pre-evolution's level-up list. If you miss one, the Move Reminder will put it back for a Heart Scale:

- Bug Buzz (Volcarona: level 42 as Larvesta)
- Bullet Punch (Metagross: level 32 as Metang)
- Charm (Clefable: level 1 as Cleffa)
- Confuse Ray (Chandelure: level 10 as Litwick)
- Cosmic Power (Clefable: level 33 as Clefairy)
- Curse (Chandelure: level 32 as Litwick)
- Hex (Chandelure: level 16 as Litwick)
- Leech Seed (Breloom: level 10 as Shroomish)
- Light Screen (Clefable: level 48 as Clefairy)
- Meteor Mash (Metagross: level 50 as Metang)
- Moonblast (Clefable: level 46 as Clefairy)
- Overheat (Chandelure: level 52 as Litwick)
- Seed Bomb (Breloom: level 41 as Shroomish)
- Shadow Ball (Chandelure: level 36 as Litwick)
- Will-O-Wisp (Chandelure: level 16 as Litwick)
- Zen Headbutt (Metagross: level 52 as Metang)

**Late level-up moves**, which the pokemon only reaches near the level cap:

- Dragon Pulse (Latias: level 70)
- Heal Pulse (Latias: level 65)

**Held items to buy:**

| Item | Copies | Price each |
| --- | --- | --- |
| Shell Bell | 6 | 5,000 |
| Wide Lens | 5 | 5,000 |
| Bright Powder | 4 | 5,000 |
| Expert Belt | 4 | 5,000 |
| Focus Sash | 3 | 3,000 |
| Focus Band | 2 | 5,000 |
| Lax Incense | 2 | 3,000 |
| Light Clay | 2 | 5,000 |
| Muscle Band | 2 | 5,000 |
| Protective Pads | 2 | 5,000 |
| Wise Glasses | 2 | 5,000 |
| Zoom Lens | 2 | 5,000 |
| Mental Herb | 1 | 3,000 |
| Quick Claw | 1 | 5,000 |
| Scope Lens | 1 | 5,000 |
| Toxic Orb | 1 | 6,000 |

Items for this team come to **189,000**, so the whole team costs about **271,000** plus what you find.

**Not stocked by the market, so these have to be found**: Leftovers x6, Big Root x1, Soul Dew x1.
