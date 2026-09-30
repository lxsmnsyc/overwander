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
therefore permanent, not a gap that a later import closes.

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

| Role | Pokemon |
| --- | --- |
| Field control | Whimsicott |
| Redirector | Togekiss |
| Protector and healer | Clefable |
| Core, spread damage | Hydreigon |
| Core, setup sweeper | Dragonite |
| Core, immediate damage | Metagross |

### Whimsicott (PvP, no legendaries) 60/67/85/77/75/116

- **Role**: field control. It moves before anything else and decides what the enemy
  is allowed to do.
- **Nature**: Timid (Speed up, Attack down).
- **Abilities**: Spore Drift, Prankster, Magic Bounce, Infiltrator.
- **Moves**: Taunt, Cotton Spore, Tailwind, Stun Spore, then Leech Seed, Charm,
  Moonblast, Substitute.
- **Items**: Focus Sash, Leftovers, Bright Powder, Clear Amulet, Lax Incense,
  Mental Herb, Shell Bell, Quick Claw.
- Prankster puts its status moves a priority step ahead, Magic Bounce returns an
  enemy status move to its sender, and Spore Drift makes both Stun Spore and Cotton
  Spore unmissable and ignores immunity to them. Cotton Spore drops the target's Speed
  two stages, which slows its cooldowns. Encore and Fake Tears are egg-only on this
  line, so Charm takes the debuff slot instead; both are machines in the later main
  series games.

### Togekiss (PvP, no legendaries) 85/50/95/120/115/80

- **Role**: redirector. It pulls attacks off the two setup cores while they boost.
- **Nature**: Calm (Special Defense up, Attack down).
- **Abilities**: Fair Share, Serene Grace, Friend Guard, Super Luck.
- **Moves**: Follow Me, Air Slash, Roost, Thunder Wave, then Dazzling Gleam, Wish,
  Light Screen, Encore.
- **Items**: Rocky Helmet, Leftovers, Bright Powder, Lax Incense, Shell Bell,
  Light Clay, Focus Band, Wide Lens.
- Air Slash flinches 30% of the time, which Serene Grace doubles to 60%. Fair Share
  makes the next sub-100% move aimed at a party member miss after one lands.

### Clefable (PvP, no legendaries) 95/70/73/95/90/60

- **Role**: protector and healer, in one slot.
- **Nature**: Bold (Defense up, Attack down).
- **Abilities**: Wishing Well, Magic Guard, Unaware, Friend Guard.
- **Moves**: Reflect, Light Screen, Soft-Boiled, Moonblast, then Encore, Charm,
  Thunder Wave, Follow Me.
- **Items**: Light Clay, Leftovers, Shell Bell, Bright Powder, Focus Band,
  Mental Herb, Lax Incense, Quick Claw.
- Wishing Well casts Wish on the lowest teammate every time it acts, so healing costs
  no move slot, which matters because Wish itself is egg-only on this line. Unaware ignores an enemy sweeper's boosts, and Magic Guard makes it
  immune to poison, burn, weather and hazards.

### Hydreigon (PvP, no legendaries) 92/105/90/125/90/98

- **Role**: core, spread damage.
- **Nature**: Modest (Special Attack up, Attack down).
- **Abilities**: Three Heads, Levitate, Berserk, Pressure.
- **Moves**: Draco Meteor, Dark Pulse, Flamethrower, Nasty Plot, then Earth Power,
  Flash Cannon, Tailwind, Protect.
- **Items**: White Herb, Expert Belt, Leftovers, Wise Glasses, Focus Sash, Shell Bell,
  Wide Lens, Scope Lens.
- Three Heads makes every move it lands also bite a second enemy for a third of the
  damage, with no friendly fire. White Herb undoes Draco Meteor's Special Attack drop
  once. Levitate gives the team a Ground immunity.

### Dragonite (PvP, no legendaries) 91/134/95/100/100/80

- **Role**: core, setup sweeper.
- **Nature**: Adamant (Attack up, Special Attack down).
- **Abilities**: Serene Storm, Multiscale, Marvel Scale, Inner Focus.
- **Moves**: Hone Claws, Dragon Claw, Fire Punch, Roost, then Iron Head,
  Thunder Punch, Waterfall, Substitute.
- **Items**: Protective Pads, Leftovers, Expert Belt, Muscle Band, Shell Bell,
  Focus Sash, Wide Lens, Quick Claw.
- Dragon Dance is egg-only on this line, so the setup move is Hone Claws, which raises
  Attack and accuracy a stage each. Dragon Dance is a machine from Sword and Shield
  onwards in the main series, so this is the first swap to revisit if those lists are
  imported. Everything on this set is physical, so it boosts
  all of it, and the accuracy half also helps Waterfall and Iron Head. Fire Punch
  answers Steel; swap in Iron Head against a Fairy-heavy field, since Dragon moves do
  nothing there. Protective Pads stops Rough Skin and Rocky Helmet punishing its
  contact moves.

### Metagross (PvP, no legendaries) 80/135/130/95/90/70

- **Role**: core, immediate damage.
- **Nature**: Adamant (Attack up, Special Attack down).
- **Abilities**: Hive Mind, Steelworker, Clear Body, Levitate.
- **Moves**: Meteor Mash, Bullet Punch, Zen Headbutt, Ice Punch, then Iron Head,
  Hammer Arm, Rock Slide, Protect.
- **Items**: Expert Belt, Wide Lens, Muscle Band, Leftovers, Shell Bell, Scope Lens,
  Protective Pads, Quick Claw.
- Steelworker gives Steel moves 1.5x and Hive Mind another 1.3x with three teammates
  standing, so Meteor Mash lands around 175 effective power. Bullet Punch is the
  team's only priority move. Wide Lens covers Meteor Mash's 90 accuracy.


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

| Role | Pokemon |
| --- | --- |
| Field control | Tornadus |
| Protector and healer | Latias |
| Redirector | Togekiss |
| Core, special | Mewtwo |
| Core, physical | Rayquaza |
| Second protector | Clefable |

### Tornadus (PvP, legendaries) 79/115/70/125/80/111

- **Role**: field control.
- **Nature**: Timid (Speed up, Attack down).
- **Abilities**: Windfall, Prankster, Defiant, Wind Rider.
- **Moves**: Tailwind, Taunt, Hurricane, Heat Wave, then Air Slash, Knock Off,
  Nasty Plot, U-turn.
- **Items**: Wide Lens, Leftovers, Expert Belt, Wise Glasses, Focus Sash, Zoom Lens,
  Bright Powder, Shell Bell.
- Prankster Tailwind lands before anything else acts, and Windfall gives the whole
  team 1.3x on Flying moves, which Togekiss's Air Slash collects as well. Wide Lens
  is first because Hurricane sits at 70 accuracy.

### Latias (PvP, legendaries) 80/80/90/110/130/110

- **Role**: protector and healer.
- **Nature**: Calm (Special Defense up, Attack down).
- **Abilities**: Eon Shield, Levitate, Healer, Multiscale.
- **Moves**: Wish, Heal Pulse, Reflect, Light Screen, then Recover, Dragon Pulse,
  Tailwind, Helping Hand.
- **Items**: Soul Dew, Light Clay, Leftovers, Shell Bell, Bright Powder, Focus Sash,
  Lax Incense, Wide Lens.
- Eon Shield gives every teammate 0.8x damage taken, and it covers all damage rather
  than one category, so it stacks with Clefable's Friend Guard. It does not cover
  Latias itself. Soul Dew is species-locked to the Eon pair and gives its Psychic and
  Dragon moves 1.2x.

### Togekiss (PvP, legendaries) 85/50/95/120/115/80

- **Role**: redirector. Same set as the non-legendary team.
- **Nature**: Calm (Special Defense up, Attack down).
- **Abilities**: Fair Share, Serene Grace, Friend Guard, Super Luck.
- **Moves**: Follow Me, Air Slash, Roost, Thunder Wave, then Dazzling Gleam, Wish,
  Light Screen, Encore.
- **Items**: Rocky Helmet, Leftovers, Bright Powder, Lax Incense, Shell Bell,
  Light Clay, Focus Band, Wide Lens.
- Its Friend Guard is the team's second copy and only matters once Clefable falls.

### Mewtwo (PvP, legendaries) 106/110/90/154/90/130

- **Role**: core, special.
- **Nature**: Timid (Speed up, Attack down).
- **Abilities**: Genetic Apex, Magic Guard, Pressure, Unnerve.
- **Moves**: Calm Mind, Psystrike, Aura Sphere, Ice Beam, then Recover, Thunderbolt,
  Shadow Ball, Taunt.
- **Items**: Expert Belt, Leftovers, Wise Glasses, Focus Sash, Shell Bell, Scope Lens,
  Bright Powder, Quick Claw.
- Genetic Apex gives its highest stat 1.25x, which is its 154 Special Attack, and
  costs 0.8x on its lowest. Magic Guard means residual damage never touches it, and
  Recover keeps it in the fight without support.

### Rayquaza (PvP, legendaries) 105/150/90/150/90/95

- **Role**: core, physical.
- **Nature**: Adamant (Attack up, Special Attack down).
- **Abilities**: Primal Sky, Multiscale, Intimidate, Air Lock.
- **Moves**: Dragon Dance, Dragon Ascent, Extreme Speed, Dragon Claw, then Iron Head,
  Stone Edge, Waterfall, Protect.
- **Items**: Protective Pads, Leftovers, Muscle Band, Expert Belt, Shell Bell,
  Focus Sash, Scope Lens, Wide Lens.
- Extreme Speed is real priority off 150 Attack, and Intimidate cuts an enemy attacker
  on arrival. Note that Primal Sky pays in +2 Special Attack and 1.3x on Dragon moves,
  so a physical Adamant build collects the Dragon half and wastes the rest; run Naughty
  or Hardy instead if you would rather keep both. Dragon Ascent drops its own Defense
  and Special Defense a stage each time it lands, which is why Multiscale and the
  team's screens matter.

### Clefable (PvP, legendaries) 95/70/73/95/90/60

- **Role**: second protector, and the team's passive healer.
- **Nature**: Bold (Defense up, Attack down).
- **Abilities**: Wishing Well, Magic Guard, Unaware, Friend Guard.
- **Moves**: Reflect, Light Screen, Soft-Boiled, Moonblast, then Encore, Charm,
  Thunder Wave, Follow Me.
- **Items**: Light Clay, Leftovers, Shell Bell, Bright Powder, Focus Band,
  Mental Herb, Lax Incense, Quick Claw.
- Friend Guard 0.75x multiplies with Latias's Eon Shield 0.8x, so a hit on anyone but
  Latias lands at 0.6x before screens.


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

A boss has 60x HP, doubled stats, and its single-target moves hit your whole side. It
is immune to sleep, freeze, flinch, trapping, infatuation, Taunt, Encore, Torment and
Imprison, and to forced switching. Burn, poison, paralysis, Leech Seed, Curse and
confusion all land. Redirection is worthless, since its attacks reach everybody.

The plan is several capped clocks running at once plus uncapped multipliers on three
attackers.

| Role | Pokemon |
| --- | --- |
| Burn, Curse and main special damage | Chandelure |
| Leech Seed and party damage multiplier | Breloom |
| Toxic and per-action chip | Magcargo |
| Primary physical damage | Metagross |
| Protector and passive healer | Clefable |
| Cleric and damage support | Blissey |

### Chandelure (raid, no legendaries) 60/55/90/145/90/80

- **Role**: status setter and main special damage.
- **Nature**: Modest (Special Attack up, Attack down).
- **Abilities**: Hexlight, Infiltrator, Flash Fire, Flame Body.
- **Moves**: Will-O-Wisp, Curse, Hex, Fire Blast, then Overheat, Shadow Ball,
  Protect, Confuse Ray.
- **Items**: Wide Lens, Focus Sash, Expert Belt, Leftovers, Wise Glasses, Shell Bell,
  Bright Powder, Zoom Lens.
- Cast Will-O-Wisp first, always. Against the burn, Hex doubles to 130 base and then
  takes Hexlight's 1.4x and Breloom's 1.2x, neither of which is capped. Curse is
  written as a quarter of the target's HP every time it acts, so against a boss it
  pays the capped 200 per action, bought once for half of Chandelure's own HP. Flame
  Body burns whatever touches Chandelure, which is a second route onto the burn if the
  first is ever cleared.

### Breloom (raid, no legendaries) 60/130/80/60/60/70

- **Role**: Leech Seed clock and party damage multiplier.
- **Nature**: Adamant (Attack up, Special Attack down).
- **Abilities**: Mycelium, Poison Heal, Technician, Quick Feet.
- **Moves**: Leech Seed, Drain Punch, Facade, Mach Punch, then Seed Bomb,
  Swords Dance, Protect, Substitute.
- **Items**: Toxic Orb, Big Root, Expert Belt, Wide Lens, Muscle Band, Leftovers,
  Shell Bell, Protective Pads.
- Mycelium is the reason it is here: everything on the team hits the statused boss for
  1.2x, and that multiplier is not capped. Toxic Orb poisons Breloom, Poison Heal
  turns that into 1/8 of Breloom's own HP back per tick, and the poison doubles Facade
  to 140. Big Root gives drain 1.3x, which is worth a lot on Drain Punch and little on
  Leech Seed against a boss, since the seed's damage is capped before the heal is
  taken from it. Technician boosts Mach Punch to 60.

### Magcargo (raid, no legendaries) 60/50/120/90/80/30

- **Role**: per-action chip clock.
- **Nature**: Bold (Defense up, Attack down).
- **Abilities**: Magma Trail, Flame Body, Solid Rock, Magma Armor.
- **Moves**: Lava Plume, Fire Blast, Protect, Toxic, then Earth Power, Rock Slide,
  Yawn, Rest.
- **Items**: Leftovers, Rocky Helmet, Shell Bell, Wide Lens, Wise Glasses,
  Bright Powder, Focus Band, Light Clay.
- Magma Trail is written as 1/16 of the target's HP every time it acts, so against a
  boss it pays the capped 200 per action, for as long as Magcargo stands. It only
  needs to land one move to arm it. Its own 30 Speed
  costs about 35% of its casting rate but nothing at all of the clock, which runs on
  the boss's actions. It has no Recover, so Leftovers and the healers carry it.

### Metagross (raid, no legendaries) 80/135/130/95/90/70

- **Role**: primary physical damage.
- **Nature**: Adamant (Attack up, Special Attack down).
- **Abilities**: Hive Mind, Steelworker, Clear Body, Levitate.
- **Moves**: Meteor Mash, Bullet Punch, Zen Headbutt, Ice Punch, then Iron Head,
  Hammer Arm, Rock Slide, Protect.
- **Items**: Expert Belt, Wide Lens, Muscle Band, Leftovers, Shell Bell, Scope Lens,
  Protective Pads, Focus Band.
- Steelworker 1.5x and Hive Mind 1.3x, on top of Mycelium's 1.2x against the burned
  boss.

### Clefable (raid, no legendaries) 95/70/73/95/90/60

- **Role**: protector and passive healer.
- **Nature**: Bold (Defense up, Attack down).
- **Abilities**: Wishing Well, Magic Guard, Unaware, Friend Guard.
- **Moves**: Reflect, Light Screen, Soft-Boiled, Toxic, then Moonblast, Charm,
  Cosmic Power, Protect.
- **Items**: Light Clay, Leftovers, Shell Bell, Bright Powder, Focus Band,
  Mental Herb, Lax Incense, Quick Claw.
- It applies the Toxic clock rather than Magcargo, because it acts far more often.
  Badly poisoned normally bites harder the longer it holds, but against a boss it
  reaches the cap almost at once, so it is a flat 200 a tick rather than a growing
  one. Charm drops the boss's Attack two stages, which halves that stat, and the burn
  halves its physical damage again.

### Blissey (raid, no legendaries) 255/10/10/75/135/55

- **Role**: cleric and damage support.
- **Nature**: Calm (Special Defense up, Attack down).
- **Abilities**: Cushioned, Healer, Friend Guard, Serene Grace.
- **Moves**: Soft-Boiled, Heal Pulse, Helping Hand, Safeguard, then Light Screen,
  Reflect, Tail Whip, Protect.
- **Items**: Leftovers, Light Clay, Bright Powder, Shell Bell, Focus Band,
  Lax Incense, Mental Herb, Quick Claw.
- Cushioned caps any single hit at a quarter of its HP, so a 255 HP body cannot be
  burst down. Helping Hand pointed at Metagross's Meteor Mash is worth more than
  anything Blissey could throw itself. Heal Bell and Aromatherapy are both egg-only on
  this line, so the team prevents status with Safeguard rather than curing it: nothing
  here cleanses, and Natural Cure needs a switch that this game does not have.

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
| Fire type | Fire cannot be burned, so Will-O-Wisp fails and Lavadome-style burn payoffs are dead. Chandelure and Magcargo are both resisted | Clefable's Toxic becomes the status that feeds Mycelium and Hexlight. Metagross and Breloom carry the damage |
| Flash Fire, Heatproof or Thick Fat | Fire damage blanked or halved | Same answer. Swap Magcargo for a second support, since only its Magma Trail still works |
| Steel or Poison type | Toxic fails | Keep the burn as the status, and let Magcargo apply it through Lava Plume and Flame Body |
| Grass type | Leech Seed fails | Breloom runs Swords Dance in its place |
| Levitate or Flying | Magcargo's Earth Power misses | Rock Slide instead |

Two of this team's six are Fire, but its damage core is Metagross (Steel) and Breloom
(Fighting and Grass), so a Fire-immune boss costs it the burn rather than the fight.


### Collect this before you build the team

**Machines to buy.** A machine is stocked by the item market as `TM <move name>`, and
it is **spent on use**, so the counts below are per pokemon rather than per move: two
pokemon wanting Protect need two machines.

| Price each | Moves |
| --- | --- |
| 2,000 | Helping Hand, Protect x6, Reflect x2, Rest, Safeguard, Soft-Boiled, Substitute, Swords Dance, Toxic x2 |
| 5,000 | Drain Punch, Facade, Ice Punch, Iron Head, Rock Slide |
| 12,000 | Fire Blast x2 |

Machines for this team come to **81,000** in total.

**Learn these before evolving**, since they sit on a pre-evolution's level-up list. If you miss one, the Move Reminder will put it back for a Heart Scale:

- Bullet Punch (Metagross: level 32 as Metang)
- Charm (Clefable: level 1 as Cleffa)
- Confuse Ray (Chandelure: level 10 as Litwick)
- Cosmic Power (Clefable: level 33 as Clefairy)
- Curse (Chandelure: level 32 as Litwick)
- Earth Power (Magcargo: level 56 as Slugma)
- Heal Pulse (Blissey: level 38 as Chansey)
- Hex (Chandelure: level 16 as Litwick)
- Lava Plume (Magcargo: level 38 as Slugma)
- Leech Seed (Breloom: level 10 as Shroomish)
- Light Screen (Blissey: level 48 as Chansey)
- Light Screen (Clefable: level 48 as Clefairy)
- Meteor Mash (Metagross: level 50 as Metang)
- Moonblast (Clefable: level 46 as Clefairy)
- Overheat (Chandelure: level 52 as Litwick)
- Rock Slide (Magcargo: level 43 as Slugma)
- Seed Bomb (Breloom: level 41 as Shroomish)
- Shadow Ball (Chandelure: level 36 as Litwick)
- Soft-Boiled (Blissey: level 13 as Chansey)
- Tail Whip (Blissey: level 9 as Chansey)
- Will-O-Wisp (Chandelure: level 16 as Litwick)
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

Items for this team come to **196,000**, so the whole team costs about **277,000** plus what you find.

**Not stocked by the market, so these have to be found**: Leftovers x6, Big Root x1.

---

## Raid battles, with legendaries

Same plan, with a sun core, but deliberately not built entirely out of Fire. A boss
rolls one of its own species abilities alongside Boss
([`raid.ts`](src/overworld/raid.ts)), so a single roll of Flash Fire, Heatproof or
Thick Fat, or simply a Fire-type boss, can blank a team whose damage and status both
come from Fire.

| Role | Pokemon |
| --- | --- |
| Burn, Curse and special damage | Chandelure |
| Sun setter, per-action clock, sweeper | Volcarona |
| Primary physical damage | Metagross |
| Leech Seed and party damage multiplier | Breloom |
| Protector and healer | Latias |
| Second protector and Toxic clock | Clefable |

**Heatran is the conditional swap.** Its Lavadome gives the whole party 1.25x against
a burned boss, which is the best multiplier available to this team, but it is
burn-locked and Heatran is a third Fire body. Put it in for Metagross once you know
the boss is neither Fire-type nor carrying Flash Fire, Heatproof or Thick Fat.

### Chandelure (raid, legendaries) 60/55/90/145/90/80

- **Role**: burn setter, Curse clock, special damage.
- **Nature**: Modest (Special Attack up, Attack down).
- **Abilities**: Hexlight, Infiltrator, Flash Fire, Flame Body.
- **Moves**: Will-O-Wisp, Curse, Hex, Fire Blast, then Overheat, Shadow Ball,
  Protect, Confuse Ray.
- **Items**: Wide Lens, Focus Sash, Expert Belt, Leftovers, Wise Glasses, Shell Bell,
  Bright Powder, Zoom Lens.
- Under Volcarona's sun its Fire moves gain another 1.5x.

### Volcarona (raid, legendaries) 85/60/65/135/105/100

- **Role**: sun setter, per-action clock, and the team's sweeper.
- **Nature**: Modest (Special Attack up, Attack down).
- **Abilities**: Ember Halo, Drought, Magic Guard, Flame Body.
- **Moves**: Quiver Dance, Fiery Dance, Bug Buzz, Roost, then Heat Wave,
  Flamethrower, Giga Drain, Protect.
- **Items**: Leftovers, Expert Belt, Wise Glasses, Shell Bell, Focus Sash,
  Bright Powder, Wide Lens, Zoom Lens.
- Drought gives every Fire move on the team 1.5x. Morning Sun would heal two thirds of
  its HP under that sun, but it is egg-only on this line, so Roost is the heal. Ember Halo is written as 1/16 of each enemy's HP every time that
  enemy acts, so against a boss it pays the capped 200 per action. That is a second
  per-action clock beside Curse, and unlike Curse it costs nothing to set up and needs
  no cast. Magic Guard means it pays nothing for residuals. Quiver Dance makes it the
  only unit here that grows through a long fight.

### Metagross (raid, legendaries) 80/135/130/95/90/70

- **Role**: primary physical damage, and the team's answer to a Fire-immune boss.
- **Nature**: Adamant (Attack up, Special Attack down).
- **Abilities**: Hive Mind, Steelworker, Clear Body, Levitate.
- **Moves**: Meteor Mash, Bullet Punch, Zen Headbutt, Ice Punch, then Iron Head,
  Hammer Arm, Rock Slide, Protect.
- **Items**: Expert Belt, Wide Lens, Muscle Band, Leftovers, Shell Bell, Scope Lens,
  Protective Pads, Focus Band.
- Steelworker 1.5x and Hive Mind 1.3x are uncapped and owe nothing to Fire, the sun or
  the burn, which is exactly why this slot exists. Levitate also answers a Ground
  boss.

### Heatran (raid, legendaries, conditional swap) 91/90/106/130/106/77

- **Role**: burn multiplier and second special attacker.
- **Nature**: Modest (Special Attack up, Attack down).
- **Abilities**: Lavadome, Flash Fire, Flame Body, Magma Armor.
- **Moves**: Lava Plume, Earth Power, Flamethrower, Protect, then Magma Storm,
  Flash Cannon, Will-O-Wisp, Heat Wave.
- **Items**: Expert Belt, Leftovers, Wise Glasses, Wide Lens, Shell Bell, Focus Sash,
  Bright Powder, Zoom Lens.
- Lavadome makes a burned enemy take 1.25x **from everything**, so it multiplies the
  whole party, not just itself, and that multiplier is not capped. It is the single
  best reason to bring a legendary to this team. Will-O-Wisp is a backup burn if
  Chandelure falls. Magma Storm is demoted out of the priority four because its bind
  does not hold on a boss: Trapped is one of the statuses a boss refuses, so it is
  only a 100 power move at 75 accuracy there.

### Breloom (raid, legendaries) 60/130/80/60/60/70

- **Role**: Leech Seed clock and party damage multiplier.
- **Nature**: Adamant (Attack up, Special Attack down).
- **Abilities**: Mycelium, Poison Heal, Technician, Quick Feet.
- **Moves**: Leech Seed, Drain Punch, Facade, Mach Punch, then Seed Bomb,
  Swords Dance, Protect, Substitute.
- **Items**: Toxic Orb, Big Root, Expert Belt, Wide Lens, Muscle Band, Leftovers,
  Shell Bell, Protective Pads.

### Latias (raid, legendaries) 80/80/90/110/130/110

- **Role**: protector and healer.
- **Nature**: Calm (Special Defense up, Attack down).
- **Abilities**: Eon Shield, Levitate, Healer, Multiscale.
- **Moves**: Wish, Heal Pulse, Reflect, Light Screen, then Recover, Helping Hand,
  Dragon Pulse, Protect.
- **Items**: Soul Dew, Light Clay, Leftovers, Shell Bell, Bright Powder, Focus Sash,
  Lax Incense, Wide Lens.
- Eon Shield covers all damage rather than one category, which matters against a boss
  that alternates physical and special.

### Clefable (raid, legendaries) 95/70/73/95/90/60

- **Role**: second protector and the Toxic clock.
- **Nature**: Bold (Defense up, Attack down).
- **Abilities**: Wishing Well, Magic Guard, Unaware, Friend Guard.
- **Moves**: Toxic, Reflect, Light Screen, Soft-Boiled, then Charm, Moonblast,
  Cosmic Power, Protect.
- **Items**: Light Clay, Leftovers, Shell Bell, Bright Powder, Focus Band,
  Mental Herb, Lax Incense, Quick Claw.

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
| 2,000 | Light Screen, Protect x7, Reflect x2, Roost, Soft-Boiled, Substitute, Swords Dance, Toxic, Will-O-Wisp |
| 5,000 | Drain Punch, Facade, Flash Cannon, Giga Drain, Ice Punch, Iron Head, Rock Slide |
| 12,000 | Fire Blast, Flamethrower x2 |

Machines for this team come to **103,000** in total.

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
- Earth Power (Heatran: level 73)
- Heal Pulse (Latias: level 65)
- Heat Wave (Heatran: level 81)
- Magma Storm (Heatran: level 96)

**Held items to buy:**

| Item | Copies | Price each |
| --- | --- | --- |
| Shell Bell | 7 | 5,000 |
| Wide Lens | 6 | 5,000 |
| Bright Powder | 5 | 5,000 |
| Expert Belt | 5 | 5,000 |
| Focus Sash | 4 | 3,000 |
| Wise Glasses | 3 | 5,000 |
| Zoom Lens | 3 | 5,000 |
| Focus Band | 2 | 5,000 |
| Lax Incense | 2 | 3,000 |
| Light Clay | 2 | 5,000 |
| Muscle Band | 2 | 5,000 |
| Protective Pads | 2 | 5,000 |
| Mental Herb | 1 | 3,000 |
| Quick Claw | 1 | 5,000 |
| Scope Lens | 1 | 5,000 |
| Toxic Orb | 1 | 6,000 |

Items for this team come to **222,000**, so the whole team costs about **325,000** plus what you find.

**Not stocked by the market, so these have to be found**: Leftovers x7, Big Root x1, Soul Dew x1.
