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
- **Abilities** are four, which is the cap. A signature ability counts against that
  cap, so a species with a signature runs it plus three of its pool.
- **Items** are listed eight at a time, which is also the cap. The **first is the
  priority pick**.
- **Natures** name the stat raised and the stat dropped, so a support never pays for
  an attacking stat it does not use.

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
- **Moves**: Taunt, Encore, Tailwind, Stun Spore, then Leech Seed, Fake Tears,
  Moonblast, Substitute.
- **Items**: Focus Sash, Leftovers, Bright Powder, Clear Amulet, Lax Incense,
  Mental Herb, Shell Bell, Quick Claw.
- Prankster puts its status moves a priority step ahead, Magic Bounce returns an
  enemy status move to its sender, and Spore Drift makes Stun Spore unmissable and
  ignores immunity to it.

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
- **Moves**: Reflect, Light Screen, Soft-Boiled, Moonblast, then Encore, Wish,
  Thunder Wave, Follow Me.
- **Items**: Light Clay, Leftovers, Shell Bell, Bright Powder, Focus Band,
  Mental Herb, Lax Incense, Quick Claw.
- Wishing Well casts Wish on the lowest teammate every time it acts, so healing costs
  no move slot. Unaware ignores an enemy sweeper's boosts, and Magic Guard makes it
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
- **Moves**: Dragon Dance, Dragon Claw, Fire Punch, Roost, then Iron Head,
  Thunder Punch, Waterfall, Substitute.
- **Items**: Protective Pads, Leftovers, Expert Belt, Muscle Band, Shell Bell,
  Focus Sash, Wide Lens, Quick Claw.
- Everything on this set is physical, so Dragon Dance boosts all of it. Fire Punch
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
- **Moves**: Reflect, Light Screen, Soft-Boiled, Moonblast, then Encore, Wish,
  Thunder Wave, Follow Me.
- **Items**: Light Clay, Leftovers, Shell Bell, Bright Powder, Focus Band,
  Mental Herb, Lax Incense, Quick Claw.
- Friend Guard 0.75x multiplies with Latias's Eon Shield 0.8x, so a hit on anyone but
  Latias lands at 0.6x before screens.

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
- **Moves**: Reflect, Light Screen, Soft-Boiled, Toxic, then Moonblast, Charm, Wish,
  Protect.
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
- **Moves**: Soft-Boiled, Heal Bell, Heal Pulse, Helping Hand, then Light Screen,
  Aromatherapy, Tail Whip, Protect.
- **Items**: Leftovers, Light Clay, Bright Powder, Shell Bell, Focus Band,
  Lax Incense, Mental Herb, Quick Claw.
- Cushioned caps any single hit at a quarter of its HP, so a 255 HP body cannot be
  burst down. Helping Hand pointed at Metagross's Meteor Mash is worth more than
  anything Blissey could throw itself.

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
- **Moves**: Quiver Dance, Fiery Dance, Bug Buzz, Morning Sun, then Heat Wave,
  Flamethrower, Roost, Protect.
- **Items**: Leftovers, Expert Belt, Wise Glasses, Shell Bell, Focus Sash,
  Bright Powder, Wide Lens, Zoom Lens.
- Drought gives every Fire move on the team 1.5x and lifts Morning Sun from half its
  HP to two thirds. Ember Halo is written as 1/16 of each enemy's HP every time that
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
- **Moves**: Toxic, Reflect, Light Screen, Soft-Boiled, then Charm, Moonblast, Wish,
  Protect.
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
