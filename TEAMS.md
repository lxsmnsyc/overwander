# Team suggestions

Four suggested teams: NPC and PvP battles, and raid battles, each with and without
legendaries. Every species, move, ability and item below was checked against the
registries in `src/data`.

---

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
- **Shadow?** says whether that slot is worth a shadow catch. Shadow is +25% to both
  attacking stats and -25% to both defending ones, so it suits the units paid for by
  the damage they deal and ruins the ones paid for by standing on the field. The rules
  are under "Shadows" below.
- **Backup pick** is who to field instead when the matchup is bad. It keeps the role,
  not the species.
- **Protect or Substitute** is decided per unit rather than by habit. Substitute costs
  1/4 of the user's HP and the decoy holds 1/4 of its HP, but **overkill is discarded**
  ([`substituted.ts`](src/battle/status/substituted.ts)), so it eats one hit of any
  size, and it blocks the other side's status and stat drops while it stands. Protect
  is free and turns away everything for 2 seconds, but it cannot be cast twice in a row
  and both moves come round only every 12 to 16 seconds. So: **Substitute on anything
  the team heals, Protect on anything it does not, and Protect against sound moves and
  Infiltrator**, which walk straight through a decoy.
- **One table per team.** Role, pokemon, nature, EVs, whether to shadow it, abilities,
  the eight moves with the priority four in bold, the eight items with the priority one
  first, and the backup. Everything about one pokemon is on its own row.
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

---

## Rules that shaped these teams

Everything in this part applies to every team below. The teams themselves follow.

### Egg moves, and the ones later generations made TMs

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

### Megas

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

### Shadows

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

### True shadows

Four species are shadows by what they are rather than by what was done to them:
**XD-144, XD-145, XD-146 and XD-150**, the Articuno, Zapdos, Moltres and Mewtwo of the
dark ([`true-shadow.ts`](src/data/species/true-shadow.ts)). Each copies its
counterpart's types, abilities and learnset and adds **+10 to every stat**, and each
carries the Shadow ability permanently.

| | True shadow |
| --- | --- |
| Where | Only under a **dark day**: in the special band of the wild pool at a legendary's own weight, and in shadow lairs, which hold one instead of an ordinary shadow raid |
| Stats | Its counterpart's, +10 in every stat, then Shadow's +25% attacking and -25% defending |
| Purifying | **Never.** A Purifying Gem refuses one, because there is nothing done to it to undo |
| Candy | Double at every level, for good |
| Friendship | Starts at zero and never gets the base arrival back, so friendship-gated things stay slow |
| Mega | **No.** `megaOf` matches a stone against the base form, and a true shadow is its own species, so no stone finds it |

**My read:** XD-150 is the hardest-hitting special attacker in the game, at about 205
effective Special Attack before Genetic Apex, and it is worth the trade on a team whose
Mega is already spoken for. The three birds are not: Articuno and Zapdos are paid for by
their bulk and their auras, and Shadow taxes exactly that. The +10 across the board is
nearly irrelevant next to the ±25%, so what makes a true shadow strong is the ability
rather than the tier.

### What the Kalos species changed

The teams were first built before the Kalos species landed. Re-checking them against
the registries moved two things and added a row of backups.

| Change | Why |
| --- | --- |
| **Florges replaces Blissey** as the non-legendary raid cleric | Blissey's Heal Bell and Aromatherapy are both egg-only, so it never actually cleansed anything. Florges learns both by levelling, and **Hothouse** lets every teammate defend special moves with Florges's 154 Special Defense whenever theirs is lower, a team-wide special wall no other support offers |
| **Clawitzer is flagged, not recommended** | **Ranging Shot** puts a floor of 1/8 of the target's HP under every special move it lands, applied to ordinary attack damage rather than to the indirect and share-of-HP damage the raid cap covers. Against a boss's 60x pool that reads as enormous. It may be unintended, so it is marked as worth testing rather than offered as a pick |
| **New backups across every role** | Klefki (Prankster, and Keyring grants a ninth item slot), Goodra (150 Special Defense, Seepage), Aegislash (Stance Change, 150 Attack in blade), Carbink (150/150 defences), Heliolisk (Backfeed heals the party on every Electric hit), and Slurpuff and Sylveon, which both reach Heal Bell without breeding |

Everything else held: the attackers, the field control and the clock plan are unchanged.

---

## NPC and PvP battles, without legendaries

Two cores that take something off the field, and four supports that keep them standing.

| Role | Pokemon | Nature | EV priority | Shadow? | Abilities (4) | Moves, priority four in bold | Items, priority first |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Field control | **Whimsicott** 60/67/85/77/75/116 | Timid | 252 Speed, 248 HP | No | Spore Drift, Prankster, Magic Bounce, Infiltrator | **Taunt, Cotton Spore, Tailwind, Stun Spore**, then Leech Seed, Charm, Moonblast, Substitute | **Focus Sash**, Leftovers, Bright Powder, Clear Amulet, Lax Incense, Mental Herb, Shell Bell, Quick Claw |
| Redirector | **Togekiss** 85/50/95/120/115/80 | Calm | 252 HP, 248 Special Defense | No | Fair Share, Serene Grace, Friend Guard, Super Luck | **Follow Me, Air Slash, Roost, Thunder Wave**, then Dazzling Gleam, Wish, Light Screen, Encore | **Rocky Helmet**, Leftovers, Bright Powder, Lax Incense, Shell Bell, Light Clay, Focus Band, Wide Lens |
| Protector and healer | **Clefable** 95/70/73/95/90/60 | Bold | 252 HP, 248 Defense | No | Wishing Well, Magic Guard, Unaware, Friend Guard | **Reflect, Light Screen, Soft-Boiled, Moonblast**, then Encore, Charm, Thunder Wave, Follow Me | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
| Core, spread damage | **Hydreigon** 92/105/90/125/90/98 | Modest | 252 Special Attack, 248 Speed | **Yes** | Three Heads, Levitate, Berserk, Pressure | **Draco Meteor, Dark Pulse, Flamethrower, Nasty Plot**, then Earth Power, Flash Cannon, Tailwind, Protect | **White Herb**, Expert Belt, Leftovers, Wise Glasses, Focus Sash, Shell Bell, Wide Lens, Scope Lens |
| Core, setup sweeper | **Dragonite** 91/134/95/100/100/80 | Adamant | 252 Attack, 248 Speed | Only if healed | Serene Storm, Multiscale, Marvel Scale, Inner Focus | **Hone Claws, Dragon Claw, Fire Punch, Roost**, then Iron Head, Thunder Punch, Waterfall, Substitute | **Protective Pads**, Leftovers, Expert Belt, Muscle Band, Shell Bell, Focus Sash, Wide Lens, Quick Claw |
| Core, immediate damage | **Metagross** 80/135/130/95/90/70 | Adamant | 252 Attack, 248 HP | **Yes**, first pick | Hive Mind, Steelworker, Clear Body, Levitate | **Meteor Mash, Bullet Punch, Zen Headbutt, Ice Punch**, then Iron Head, Hammer Arm, Rock Slide, Protect | **Expert Belt**, Wide Lens, Muscle Band, Leftovers, Shell Bell, Scope Lens, Protective Pads, Quick Claw |
| | | | | | | | |
| Field control, backup | **Klefki** 57/80/91/80/87/75 | Bold | 252 HP, 248 Defense | No | Keyring, Prankster, Levitate, Magician | **Thunder Wave, Reflect, Light Screen, Spikes**, then Dazzling Gleam, Safeguard, Foul Play, Protect | **Light Clay**, Leftovers, Bright Powder, Lax Incense, Shell Bell, Focus Band, Mental Herb, Quick Claw |
| Redirector, backup | **Amoonguss** 114/85/70/85/80/30 | Bold | 252 HP, 248 Defense | No | Sporeburst, Regenerator, Effect Spore, Overcoat | **Rage Powder, Spore, Giga Drain, Sludge Bomb**, then Synthesis, Protect, Toxic, Substitute | **Leftovers**, Rocky Helmet, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Light Clay |
| Protector and healer, backup | **Florges** 78/65/68/112/154/75 | Calm | 252 HP, 248 Special Defense | Never, Hothouse shares its Special Defense | Hothouse, Flower Veil, Unaware, Symbiosis | **Wish, Heal Bell, Aromatherapy, Moonblast**, then Light Screen, Safeguard, Helping Hand, Protect | **Leftovers**, Light Clay, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| Core, spread damage, backup | **Goodra** 90/100/70/110/150/80 | Modest | 252 Special Attack, 248 HP | No, its 150 Special Defense is the point | Seepage, Sap Sipper, Hydration, Water Absorb | **Draco Meteor, Thunderbolt, Flamethrower, Sludge Bomb**, then Ice Beam, Protect, Toxic, Substitute | **White Herb**, Leftovers, Expert Belt, Wise Glasses, Shell Bell, Bright Powder, Focus Sash, Wide Lens |
| Core, setup sweeper, backup | **Aegislash** 60/50/140/50/140/60 | Adamant | 252 Attack, 248 HP | No, the shield stance is half its value | Turn the Blade, Stance Change, Clear Body, Cursed Body | **Swords Dance, Iron Head, Sacred Sword, King's Shield**, then Shadow Ball, Flash Cannon, Substitute, Protect | **Leftovers**, Expert Belt, Muscle Band, Shell Bell, Wide Lens, Scope Lens, Focus Band, Protective Pads |
| Core, immediate damage, backup | **Tyrantrum** 82/121/119/69/59/71 | Adamant | 252 Attack, 248 HP | **Yes** | Jaw Snap, Strong Jaw, Rock Head, Intimidate | **Crunch, Iron Head, Stone Edge, Dragon Claw**, then Head Smash, Rock Slide, Superpower, Protect | **Expert Belt**, Muscle Band, Leftovers, Shell Bell, Wide Lens, Scope Lens, Protective Pads, Focus Band |

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

---

## NPC and PvP battles, with legendaries

The same six roles, with legendaries allowed. Rayquaza is the Mega here, since Dragon Ascent needs no stone.

| Role | Pokemon | Nature | EV priority | Shadow? | Abilities (4) | Moves, priority four in bold | Items, priority first |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Field control | **Tornadus** 79/115/70/125/80/111 | Timid | 252 Special Attack, 248 Speed | **Yes** | Windfall, Prankster, Defiant, Wind Rider | **Tailwind, Taunt, Hurricane, Heat Wave**, then Air Slash, Knock Off, Nasty Plot, U-turn | **Wide Lens**, Leftovers, Expert Belt, Wise Glasses, Focus Sash, Zoom Lens, Bright Powder, Shell Bell |
| Protector and healer | **Latias** 80/80/90/110/130/110 | Calm | 252 HP, 248 Special Defense | No | Eon Shield, Levitate, Healer, Multiscale | **Wish, Heal Pulse, Reflect, Light Screen**, then Recover, Dragon Pulse, Tailwind, Helping Hand | **Soul Dew**, Light Clay, Leftovers, Shell Bell, Bright Powder, Focus Sash, Lax Incense, Wide Lens |
| Redirector | **Togekiss** 85/50/95/120/115/80 | Calm | 252 HP, 248 Special Defense | No | Fair Share, Serene Grace, Friend Guard, Super Luck | **Follow Me, Air Slash, Roost, Thunder Wave**, then Dazzling Gleam, Wish, Light Screen, Encore | **Rocky Helmet**, Leftovers, Bright Powder, Lax Incense, Shell Bell, Light Clay, Focus Band, Wide Lens |
| Core, special | **XD-150** 116/120/100/164/100/140 | Timid | 252 Special Attack, 248 Speed | Always, it is one by nature | Genetic Apex, Magic Guard, Pressure, Unnerve | **Calm Mind, Psystrike, Aura Sphere, Ice Beam**, then Recover, Thunderbolt, Shadow Ball, Taunt | **Focus Sash**, Expert Belt, Leftovers, Wise Glasses, Shell Bell, Scope Lens, Bright Powder, Quick Claw |
| Core, physical | **Rayquaza** 105/150/90/150/90/95 | Adamant | 252 Attack, 248 Speed | Yes, but walk its friendship up first | Primal Sky, Multiscale, Intimidate, Air Lock | **Dragon Dance, Dragon Ascent, Extreme Speed, Dragon Claw**, then Iron Head, Stone Edge, Waterfall, Protect | **Protective Pads**, Leftovers, Muscle Band, Expert Belt, Shell Bell, Focus Sash, Scope Lens, Wide Lens |
| Second protector | **Clefable** 95/70/73/95/90/60 | Bold | 252 HP, 248 Defense | No | Wishing Well, Magic Guard, Unaware, Friend Guard | **Reflect, Light Screen, Soft-Boiled, Moonblast**, then Encore, Charm, Thunder Wave, Follow Me | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
| | | | | | | | |
| Field control, backup | **Whimsicott** 60/67/85/77/75/116 | Timid | 252 Speed, 248 HP | No | Spore Drift, Prankster, Magic Bounce, Infiltrator | **Taunt, Cotton Spore, Tailwind, Stun Spore**, then Leech Seed, Charm, Moonblast, Substitute | **Focus Sash**, Leftovers, Bright Powder, Clear Amulet, Lax Incense, Mental Herb, Shell Bell, Quick Claw |
| Protector and healer, backup | **Florges** 78/65/68/112/154/75 | Calm | 252 HP, 248 Special Defense | Never, Hothouse shares its Special Defense | Hothouse, Flower Veil, Unaware, Symbiosis | **Wish, Heal Bell, Aromatherapy, Moonblast**, then Light Screen, Safeguard, Helping Hand, Protect | **Leftovers**, Light Clay, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| Redirector, backup | **Clefable** 95/70/73/95/90/60 | Bold | 252 HP, 248 Defense | No | Wishing Well, Magic Guard, Unaware, Friend Guard | **Follow Me, Soft-Boiled, Reflect, Light Screen**, then Moonblast, Encore, Charm, Thunder Wave | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
| Core, special, backup | **Mewtwo** 106/110/90/154/90/130 | Timid | 252 Special Attack, 248 Speed | **Yes** | Genetic Apex, Magic Guard, Pressure, Unnerve | **Calm Mind, Psystrike, Aura Sphere, Ice Beam**, then Recover, Thunderbolt, Shadow Ball, Taunt | **Expert Belt**, Leftovers, Wise Glasses, Focus Sash, Shell Bell, Scope Lens, Bright Powder, Quick Claw |
| Core, physical, backup | **Dragonite** 91/134/95/100/100/80 | Adamant | 252 Attack, 248 Speed | Only if healed | Serene Storm, Multiscale, Marvel Scale, Inner Focus | **Hone Claws, Dragon Claw, Fire Punch, Roost**, then Iron Head, Thunder Punch, Waterfall, Substitute | **Protective Pads**, Leftovers, Expert Belt, Muscle Band, Shell Bell, Focus Sash, Wide Lens, Quick Claw |
| Second protector, backup | **Goodra** 90/100/70/110/150/80 | Calm | 252 HP, 248 Special Defense | No, its 150 Special Defense is the point | Seepage, Sap Sipper, Hydration, Water Absorb | **Draco Meteor, Thunderbolt, Protect, Toxic**, then Flamethrower, Ice Beam, Sludge Bomb, Substitute | **Leftovers**, Shell Bell, Bright Powder, Wise Glasses, Expert Belt, Focus Band, Lax Incense, Wide Lens |

### Notes

- Windfall gives the team 1.3x on Flying moves, which Togekiss's Air Slash collects as well. Wide Lens is Tornadus's first item because Hurricane sits at 70 accuracy.
- Eon Shield 0.8x multiplies with Clefable's Friend Guard 0.75x, so a hit on anyone but Latias lands at 0.6x before screens.
- Primal Sky pays in +2 Special Attack and 1.3x Dragon, so an Adamant Rayquaza collects the Dragon half only. Run Naughty or Hardy to keep both halves.
- Rayquaza consumes the team's one Mega automatically once it knows Dragon Ascent. Drop the move if you want the Mega elsewhere.
- **XD-150 takes the special core over Mewtwo** because this team's Mega is Rayquaza's anyway, and a true shadow cannot Mega Evolve. It gives up nothing here and gains +10 in every stat plus Shadow's 1.25x on Special Attack, which reads about 205. It pays for that with 75/75 effective defences, double candy at every level for good, and no way to purify it, so field it behind Follow Me and the screens. Run Mewtwo instead on any team that wants the Mega.

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

---

## Raid battles, without legendaries

A boss has 60x HP, doubled stats, and its single-target moves hit your whole side. It is immune to sleep, freeze, flinch, trapping, infatuation, Taunt, Encore, Torment and Imprison, and to forced switching. Burn, poison, paralysis, Leech Seed, Curse and confusion all land, and redirection is worthless. The plan is several capped clocks at once, plus uncapped multipliers on three attackers.

| Role | Pokemon | Nature | EV priority | Shadow? | Abilities (4) | Moves, priority four in bold | Items, priority first |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Burn, Curse, main special damage | **Chandelure** 60/55/90/145/90/80 | Modest | 252 Special Attack, 248 HP | No, it dies to the boss | Hexlight, Infiltrator, Flash Fire, Flame Body | **Will-O-Wisp, Curse, Hex, Fire Blast**, then Calm Mind, Shadow Ball, Substitute, Confuse Ray | **Wide Lens**, Focus Sash, Expert Belt, Leftovers, Wise Glasses, Shell Bell, Bright Powder, Zoom Lens |
| Leech Seed and party multiplier | **Breloom** 60/130/80/60/60/70 | Adamant | 252 Attack, 248 HP | No, Mycelium needs it standing | Mycelium, Poison Heal, Technician, Quick Feet | **Leech Seed, Drain Punch, Facade, Mach Punch**, then Seed Bomb, Swords Dance, Substitute, Sludge Bomb | **Toxic Orb**, Big Root, Expert Belt, Wide Lens, Muscle Band, Leftovers, Shell Bell, Protective Pads |
| Toxic and per-action chip | **Magcargo** 60/50/120/90/80/30 | Bold | 252 HP, 248 Defense | No | Magma Trail, Flame Body, Solid Rock, Magma Armor | **Lava Plume, Fire Blast, Protect, Toxic**, then Earth Power, Rock Slide, Yawn, Rest | **Leftovers**, Rocky Helmet, Shell Bell, Wide Lens, Wise Glasses, Bright Powder, Focus Band, Light Clay |
| Primary physical damage | **Metagross** 80/135/130/95/90/70 | Adamant | 252 Attack, 248 HP | **Yes**, first pick | Hive Mind, Steelworker, Clear Body, Levitate | **Meteor Mash, Bullet Punch, Zen Headbutt, Ice Punch**, then Iron Head, Hammer Arm, Rock Slide, Substitute | **Expert Belt**, Wide Lens, Muscle Band, Leftovers, Shell Bell, Scope Lens, Protective Pads, Focus Band |
| Protector and passive healer | **Clefable** 95/70/73/95/90/60 | Bold | 252 HP, 248 Defense | No | Wishing Well, Magic Guard, Unaware, Friend Guard | **Reflect, Light Screen, Soft-Boiled, Toxic**, then Thunder Wave, Charm, Moonblast, Protect | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
| Cleric and damage support | **Florges** 78/65/68/112/154/75 | Calm | 252 HP, 248 Special Defense | Never, Hothouse shares its Special Defense | Hothouse, Flower Veil, Unaware, Symbiosis | **Wish, Heal Bell, Aromatherapy, Moonblast**, then Light Screen, Safeguard, Helping Hand, Protect | **Leftovers**, Light Clay, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| | | | | | | | |
| Burn and special damage, backup | **Cofagrigus** 58/50/145/95/105/30 | Modest | 252 HP, 248 Special Attack | No, its 145/105 defences are the point | Death Mask, Mummy, Cursed Body, Pressure | **Will-O-Wisp, Hex, Curse, Shadow Ball**, then Toxic, Nasty Plot, Pain Split, Protect | **Leftovers**, Expert Belt, Wise Glasses, Shell Bell, Light Clay, Bright Powder, Focus Band, Wide Lens |
| Leech Seed, backup | **Trevenant** 85/110/76/65/82/56 | Adamant | 252 Attack, 248 HP | No | Undergrowth, Harvest, Natural Cure, Frisk | **Leech Seed, Will-O-Wisp, Horn Leech, Wood Hammer**, then Shadow Ball, Protect, Toxic, Substitute | **Leftovers**, Big Root, Expert Belt, Muscle Band, Shell Bell, Rocky Helmet, Wide Lens, Focus Band |
| Toxic carrier, backup | **Amoonguss** 114/85/70/85/80/30 | Bold | 252 HP, 248 Defense | No | Sporeburst, Regenerator, Effect Spore, Overcoat | **Toxic, Sludge Bomb, Giga Drain, Protect**, then Synthesis, Rage Powder, Substitute, Seed Bomb | **Leftovers**, Rocky Helmet, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Light Clay |
| Primary physical damage, backup | **Aegislash** 60/50/140/50/140/60 | Adamant | 252 Attack, 248 HP | No, the shield stance is half its value | Turn the Blade, Stance Change, Clear Body, Cursed Body | **Swords Dance, Iron Head, Sacred Sword, King's Shield**, then Shadow Ball, Flash Cannon, Substitute, Protect | **Leftovers**, Expert Belt, Muscle Band, Shell Bell, Wide Lens, Scope Lens, Focus Band, Protective Pads |
| Protector, backup | **Carbink** 50/50/150/50/150/50 | Bold | 252 HP, 248 Defense | Never, it is nothing but defences | Crystal Growth, Clear Body, Sturdy, Levitate | **Reflect, Light Screen, Moonblast, Safeguard**, then Calm Mind, Power Gem, Protect, Rest | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| Cleric, backup | **Blissey** 255/10/10/75/135/55 | Calm | 252 Defense, 248 Special Defense | Never | Cushioned, Healer, Friend Guard, Serene Grace | **Soft-Boiled, Heal Pulse, Helping Hand, Safeguard**, then Light Screen, Reflect, Tail Whip, Protect | **Leftovers**, Light Clay, Bright Powder, Shell Bell, Focus Band, Lax Incense, Mental Herb, Quick Claw |

### Notes

- **Florges replaces Blissey**, which is the one change the Kalos species forced. Blissey's Heal Bell and Aromatherapy are both egg-only, so it could not actually cleanse; Florges learns both by levelling, and its Hothouse lets every teammate defend special moves with Florges's 154 Special Defense whenever theirs is lower. That is why its EVs go into Special Defense: the stat is shared with the party.
- Cast Will-O-Wisp first. Against the burn, Hex doubles to 130 base and takes Hexlight 1.4x and Mycelium 1.2x, neither of which is capped.
- Clefable applies the Toxic clock rather than Magcargo, because it acts far more often.
- Blissey is still the better pick if the boss deals no status: 255 HP and Cushioned outlast Florges, they simply cannot cure anything.
- **Clefable carries the paralysis.** Thunder Wave is the team's only one, and it is worth a slot: a quarter fewer boss actions, a 25% chance each attempt is stopped, and a second status keeping Mycelium and Hexlight paid if the burn cannot land on a Fire-type boss.
- **Charm halves the boss's Attack stat** (-2 stages reads 0.5x), which roughly halves its physical damage and stacks with the burn halving it again, to about 0.25x. Two caveats: it does nothing against a special attacker, and **Clefable itself does not benefit**, because Unaware makes it ignore the other side's stat stages in blows it takes, so a charmed boss still hits Clefable at full Attack. The rest of the party gets the discount.
- **Overheat is out, Calm Mind is in.** Overheat is 130 power at 90 accuracy but drops Chandelure's Special Attack two stages after it lands, and nothing here clears stat drops, so its own damage halves for the rest of a long fight. Calm Mind raises Special Attack and Special Defense a stage each, compounds over the fight, and helps the one unit whose defences the boss punishes. Keep Overheat only if you carry a White Herb, as a one-off opener.

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

**Paralysis is worth the clock it costs.** It halves the boss's Speed, which cuts its
action rate by about a quarter, and it also gives every attempt a **25% chance of being
stopped outright**, with a 2 second lockout after each proc
([`paralyzed.ts`](src/battle/status/paralyzed.ts)). Statuses stack here, so Clefable's
Thunder Wave sits on the boss beside the burn and the poison. The price is that Curse
and Magma Trail are paid per boss action, so both lose roughly a quarter of their
income. Take the trade when the party is dying and skip it when the fight is a damage
race.

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
| 2,000 | Heal Bell, Helping Hand, Light Screen, Protect x3, Reflect, Rest, Safeguard, Soft-Boiled, Substitute x3, Swords Dance, Toxic x2 |
| 5,000 | Drain Punch, Facade, Ice Punch, Iron Head, Rock Slide |
| 12,000 | Fire Blast x2, Sludge Bomb |

Machines for this team come to **93,000** in total.

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

Items for this team come to **196,000**, so the whole team costs about **289,000** plus what you find.

**Not stocked by the market, so these have to be found**: Leftovers x6, Big Root x1.

---

---

## Raid battles, with legendaries

The same five clocks, with a sun core, and deliberately not built entirely out of Fire: one rolled Flash Fire, Heatproof or Thick Fat, or simply a Fire-type boss, would otherwise blank both the damage and the status.

| Role | Pokemon | Nature | EV priority | Shadow? | Abilities (4) | Moves, priority four in bold | Items, priority first |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Burn, Curse, special damage | **Chandelure** 60/55/90/145/90/80 | Modest | 252 Special Attack, 248 HP | No, it dies to the boss | Hexlight, Infiltrator, Flash Fire, Flame Body | **Will-O-Wisp, Curse, Hex, Fire Blast**, then Calm Mind, Shadow Ball, Substitute, Confuse Ray | **Wide Lens**, Focus Sash, Expert Belt, Leftovers, Wise Glasses, Shell Bell, Bright Powder, Zoom Lens |
| Sun setter, per-action clock, sweeper | **Volcarona** 85/60/65/135/105/100 | Modest | 252 Special Attack, 248 HP | No, Quiver Dance needs it alive | Ember Halo, Drought, Magic Guard, Flame Body | **Quiver Dance, Fiery Dance, Bug Buzz, Roost**, then Heat Wave, Flamethrower, Giga Drain, Substitute | **Leftovers**, Expert Belt, Wise Glasses, Shell Bell, Focus Sash, Bright Powder, Wide Lens, Zoom Lens |
| Primary physical damage | **Metagross** 80/135/130/95/90/70 | Adamant | 252 Attack, 248 HP | **Yes**, first pick | Hive Mind, Steelworker, Clear Body, Levitate | **Meteor Mash, Bullet Punch, Zen Headbutt, Ice Punch**, then Iron Head, Hammer Arm, Rock Slide, Substitute | **Expert Belt**, Wide Lens, Muscle Band, Leftovers, Shell Bell, Scope Lens, Protective Pads, Focus Band |
| Leech Seed and party multiplier | **Breloom** 60/130/80/60/60/70 | Adamant | 252 Attack, 248 HP | No, Mycelium needs it standing | Mycelium, Poison Heal, Technician, Quick Feet | **Leech Seed, Drain Punch, Facade, Mach Punch**, then Seed Bomb, Swords Dance, Substitute, Sludge Bomb | **Toxic Orb**, Big Root, Expert Belt, Wide Lens, Muscle Band, Leftovers, Shell Bell, Protective Pads |
| Protector and healer | **Latias** 80/80/90/110/130/110 | Calm | 252 HP, 248 Special Defense | Never, Eon Shield stops when it falls | Eon Shield, Levitate, Healer, Multiscale | **Wish, Heal Pulse, Reflect, Light Screen**, then Recover, Helping Hand, Dragon Pulse, Protect | **Soul Dew**, Light Clay, Leftovers, Shell Bell, Bright Powder, Focus Sash, Lax Incense, Wide Lens |
| Second protector and Toxic clock | **Clefable** 95/70/73/95/90/60 | Bold | 252 HP, 248 Defense | No | Wishing Well, Magic Guard, Unaware, Friend Guard | **Toxic, Reflect, Light Screen, Soft-Boiled**, then Thunder Wave, Charm, Moonblast, Protect | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
| | | | | | | | |
| Burn and special damage, backup | **Cofagrigus** 58/50/145/95/105/30 | Modest | 252 HP, 248 Special Attack | No, its 145/105 defences are the point | Death Mask, Mummy, Cursed Body, Pressure | **Will-O-Wisp, Hex, Curse, Shadow Ball**, then Toxic, Nasty Plot, Pain Split, Protect | **Leftovers**, Expert Belt, Wise Glasses, Shell Bell, Light Clay, Bright Powder, Focus Band, Wide Lens |
| Sun core, backup | **Heliolisk** 62/55/52/109/94/109 | Modest | 252 Special Attack, 248 Speed | **Yes** | Backfeed, Dry Skin, Solar Power, Overcoat | **Thunderbolt, Thunder, Dark Pulse, Solar Beam**, then Discharge, Thunder Wave, Protect, Substitute | **Expert Belt**, Wise Glasses, Leftovers, Focus Sash, Shell Bell, Wide Lens, Bright Powder, Zoom Lens |
| Primary damage, conditional swap | **Heatran** 91/90/106/130/106/77 | Modest | 252 Special Attack, 248 HP | No | Lavadome, Flash Fire, Flame Body, Magma Armor | **Lava Plume, Earth Power, Flamethrower, Protect**, then Magma Storm, Flash Cannon, Will-O-Wisp, Heat Wave | **Expert Belt**, Leftovers, Wise Glasses, Wide Lens, Shell Bell, Focus Sash, Bright Powder, Zoom Lens |
| Leech Seed, backup | **Trevenant** 85/110/76/65/82/56 | Adamant | 252 Attack, 248 HP | No | Undergrowth, Harvest, Natural Cure, Frisk | **Leech Seed, Will-O-Wisp, Horn Leech, Wood Hammer**, then Shadow Ball, Protect, Toxic, Substitute | **Leftovers**, Big Root, Expert Belt, Muscle Band, Shell Bell, Rocky Helmet, Wide Lens, Focus Band |
| Protector and healer, backup | **Florges** 78/65/68/112/154/75 | Calm | 252 HP, 248 Special Defense | Never, Hothouse shares its Special Defense | Hothouse, Flower Veil, Unaware, Symbiosis | **Wish, Heal Bell, Aromatherapy, Moonblast**, then Light Screen, Safeguard, Helping Hand, Protect | **Leftovers**, Light Clay, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| Second protector, backup | **Goodra** 90/100/70/110/150/80 | Calm | 252 HP, 248 Special Defense | No, its 150 Special Defense is the point | Seepage, Sap Sipper, Hydration, Water Absorb | **Draco Meteor, Thunderbolt, Protect, Toxic**, then Flamethrower, Ice Beam, Sludge Bomb, Substitute | **Leftovers**, Shell Bell, Bright Powder, Wise Glasses, Expert Belt, Focus Band, Lax Incense, Wide Lens |

### Notes

- **Heatran is the conditional swap.** Its Lavadome gives the whole party 1.25x against a burned boss, the best multiplier this team can reach, but it is burn-locked and a third Fire body. Put it in for Metagross once you know the boss is neither Fire-type nor carrying Flash Fire, Heatproof or Thick Fat.
- **Clawitzer is worth testing, and may be a bug.** Ranging Shot puts a floor of 1/8 of the target's HP under every special move it lands, and it is applied to ordinary attack damage rather than to the indirect or share-of-HP damage the boss cap covers. Against 60x HP that reads as enormous. Treat it as untested rather than as a recommendation, and expect it to change.
- Drought gives every Fire move on the team 1.5x. Morning Sun would heal two thirds under it, but it is egg-only on Volcarona, so Roost is the heal.
- Ember Halo is a second per-action clock beside Curse, and unlike Curse it costs nothing to set up and needs no cast.
- **Clefable carries the paralysis** here too, through Thunder Wave. Latias also learns it if you would rather spend Clefable's slot elsewhere.
- **Charm halves the boss's Attack stat**, stacking with the burn's own halving, but Clefable's Unaware means Clefable itself still takes a charmed boss's hits at full Attack. The discount is for the other five.
- **Chandelure runs Calm Mind rather than Overheat**, since Overheat's two-stage Special Attack drop is permanent in a fight nothing here can Haze, and the sun already gives its Fire moves 1.5x.

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

**Paralysis is worth the clock it costs**, for the reasons the other raid team lists:
a quarter fewer boss actions, a 25% chance each attempt is stopped outright, and a
status that keeps Mycelium and Hexlight paying if the burn ever fails. Clefable's
Thunder Wave carries it. Curse and Ember Halo each lose about a quarter of their income
in exchange.

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
| 2,000 | Light Screen, Protect x2, Reflect x2, Roost, Soft-Boiled, Substitute x4, Swords Dance, Toxic |
| 5,000 | Drain Punch, Facade, Giga Drain, Ice Punch, Iron Head, Rock Slide |
| 12,000 | Fire Blast, Flamethrower, Sludge Bomb |

Machines for this team come to **92,000** in total.

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

Items for this team come to **189,000**, so the whole team costs about **281,000** plus what you find.

**Not stocked by the market, so these have to be found**: Leftovers x6, Big Root x1, Soul Dew x1.

---
