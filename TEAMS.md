# Team suggestions

Six teams: PvP and raids, each without legendaries, with legendaries, and with mythicals.
Every species, move, ability and item below was checked against the registries in
`src/data`.

## How to read a row

- Moves are eight, which is the cap. The first four in bold are the ones to take first.
- Abilities are four, which is the cap. A signature ability counts as one of the four.
- Items are eight, which is the cap. The first one listed is the one to get first.
- EV priority is 252 in the first stat and 248 in the second. A catch earns 5 points a
  level and 500 by level 100, and 252 is the most one stat takes.
- Shadow? says whether a shadow catch suits the slot.
- A backup keeps the role, not the species. Field it when the matchup is bad.
- No egg moves are used. Every move listed is a level-up move or a machine, on that
  species or on a pre-evolution.
- Protect or Substitute is decided per row. Substitute costs 1/4 of the user's HP, the
  decoy holds 1/4, and overkill is discarded, so it eats one hit of any size and blocks
  status and stat drops. Protect is free and turns away everything for 2 seconds but
  cannot be cast twice in a row. Use Substitute on anything the team heals and Protect on
  anything it does not. Use Protect against sound moves and Infiltrator, which ignore a
  substitute.

## Rules

### Moves and abilities

- PP sets the cooldown. A move comes back after `180 / pp` seconds before Speed cuts it,
  so a 5 PP move fires once in 36 seconds and a 20 PP move four times as often.
- Earthquake, Surf, Bulldoze, Sludge Wave, Explosion, Self-Destruct, Searing Shot and
  Sparkling Aria all hit your own five. None of them are used here.
- Friend Guard does not stack. A second copy only covers the first one falling.
- Regenerator and Natural Cure trigger on leaving the field, and there is no bench, so
  they do almost nothing.
- Choice items lock the holder to its first move, which is wrong for every set here.

### Raid bosses

- A boss has 60x HP and doubled stats, and its single-target moves hit your whole side.
- It is immune to sleep, freeze, flinch, trapping, infatuation, Taunt, Encore, Torment
  and Imprison, and to forced switching.
- Indirect damage and share-of-HP damage are capped at 200 per source. Each source is
  capped on its own, so several clocks add up. Every fraction printed below is the rule
  as written. Against a boss each one pays at most 200.
- Wide Guard does not block a boss. It reads the move's own data, and a boss throws
  single-target moves that are retargeted as they go out.

### Egg moves the main series later sold as machines

Three moves are left out because this game's learnsets stop where they do. If those
machine lists are imported, the sets improve.

| Move | Main-series machine | What it changes |
| --- | --- | --- |
| Dragon Dance | TR51 in Sword and Shield, TM100 in Scarlet and Violet | Dragonite takes Dragon Dance over Hone Claws |
| Encore | TM122 in Scarlet and Violet | Whimsicott takes Encore into its first four |
| Fake Tears | TM47 in Sword and Shield, TM003 in Scarlet and Violet | Whimsicott or Breloom gets -2 Special Defense on the target |

Wish, Heal Bell, Aromatherapy and Morning Sun are machines in no generation, so Clefable,
Blissey and Volcarona never get them by levelling. That is why Florges holds the raid
cleric slot.

### Megas

- A Mega Stone is a held item, so it takes one of the eight item slots. Rayquaza needs no
  stone, only Dragon Ascent.
- A team Mega Evolves once per fight. The game picks the highest level first, then the
  biggest base-stat total, then whoever stands earliest.
- The Mega's ability is worn on top of the catch's four. Stats and types change. Moves,
  other items and the catch's own abilities stay.
- Stones are never sold. They sit in the rarest band of the item pool.
- Where a line already reaches its Mega's canon ability, the Mega wears a different one
  ([`megas.ts`](src/data/species/megas.ts)).

| Mega | Stat line | Ability it wears |
| --- | --- | --- |
| **Mega Metagross** | 80/145/150/105/110/110 | Tough Claws, and every move on its set makes contact |
| **Mega Latias** | 80/100/120/140/150/110 | Friend Guard, which multiplies with its own Eon Shield |
| **Mega Mewtwo Y** | 106/150/70/194/120/140 | Insomnia |
| **Mega Mewtwo X** | 106/190/100/154/100/130 | Steadfast |
| **Mega Rayquaza** | 105/180/100/180/100/115 | Delta Stream |
| **Mega Diancie** | 50/160/110/160/110/110 | Queenly Majesty |
| **Mega Audino** | 103/60/126/80/126/50 | Triage, which puts every heal 3 priority brackets early |

Two traps. The automatic pick reads level first, so one stone per team is the simple
rule. Rayquaza cannot opt out once it knows Dragon Ascent.

### Worn shapes

A form item is a held item that decides which shape its holder fights in
([`forms.ts`](src/battle/items/forms.ts)). It is not a Mega. It costs an item slot and
leaves the team's one Mega free, and the shape's ability is worn on top of the four.

| Item | Holder | Shape | Ability worn |
| --- | --- | --- | --- |
| **Red Orb** | Groudon | Primal Groudon 100/180/160/150/90/90, Ground and Fire | Desolate Land |
| **Blue Orb** | Kyogre | Primal Kyogre 100/150/90/180/160/90, Water | Primordial Sea |
| **Prison Bottle** | Hoopa | Hoopa Unbound 80/160/60/170/130/80, Psychic and Dark | none |
| **Gracidea** | Shaymin | Sky Shaymin | Serene Grace |
| **Adamant, Lustrous, Griseous Orb** | Dialga, Palkia, Giratina | the Origin forme | Unaware, Shadow Tag, Levitate |
| **any Plate** | an Arceus with Multitype | Arceus of that Plate's type | none |

A primal sky is the strongest field effect in the game.

- Desolate Land and Primordial Sea hold for as long as their holder stands, and no
  ordinary setter can overwrite one.
- Desolate Land gives Fire moves 1.5x and makes every Water damaging move fail.
- Primordial Sea gives Water moves 1.5x and makes every Fire damaging move fail.
- The ban is read off the field, so it binds both sides. Status moves of the banned type
  still work, so Will-O-Wisp casts in heavy rain.
- Delta Stream, which Mega Rayquaza wears, makes nothing super effective against a Flying
  type and blocks other weather.
- Never field a primal beside Mega Rayquaza. The three skies lock each other out, the
  last holder to arrive sets the weather, and it drops when that holder leaves.

The Reveal Glass is on branch `reveal-glass`, not on `main`. It gives the three genies
their Therian formes. Tornadus Therian is 79/100/80/110/90/121 and wears Regenerator,
which does almost nothing here, so the trade is 15 Special Attack for 10 Speed and 10 in
both defences.

### Shadows

- Attack and Special Attack count 1.25x. Defense and Special Defense count 0.75x. HP and
  Speed are unchanged.
- Shadow costs no ability slot and cannot be suppressed.
- A shadow pays double candy at every level and starts at zero friendship, which no
  groomer will raise.
- A Purifying Gem undoes all of it, adds two to every value, and gives the catch a fresh
  arrival's friendship.
- A shadow can still Mega Evolve, and the two stack.

Shadow the rows whose value is the damage they deal. Never shadow the rows whose value is
that they are still standing, because Friend Guard, Eon Shield, Wishing Well, Hothouse,
Follow Me and the screens all stop when they fall. On these six teams that is one or two
shadows, not six.

### True shadows

XD-144, XD-145, XD-146 and XD-150 are the Articuno, Zapdos, Moltres and Mewtwo of the
dark ([`true-shadow.ts`](src/data/species/true-shadow.ts)). Each copies its counterpart
and adds 10 to every stat, and each carries Shadow permanently.

- They are only found under a dark day, in the special band of the wild pool and in
  shadow lairs.
- A Purifying Gem refuses one.
- No stone finds one, so a true shadow never Mega Evolves.
- XD-150 is the hardest-hitting special attacker in the game at about 205 effective
  Special Attack. The three birds are not worth it, because Shadow taxes the bulk they
  are built on.

### Mythicals

Fifteen species sit in the mythical band. Mew, Celebi, Jirachi, the four Deoxys, Darkrai,
Manaphy, Shaymin, Arceus, Keldeo, Victini, Meloetta, Genesect, Diancie, Hoopa and
Volcanion. The world never stages one.

- Each is called by one relic, which sits in the rarest band of the item pool and is
  spent when the raid starts ([`raid-items.ts`](src/data/items/raid-items.ts)).
- The prize arrives at level 30, against a legendary's 50.
- No mythical can ever be a Shadow, so none of them collects Shadow's +25%.
- No mythical has egg moves.
- A signature ability still costs one of the four slots.
- Clearing one pays 200,000 gold.
- Most mythical signature moves have 5 PP, so they fire once in 36 seconds before Speed.

Four level-up moves decide the builds. Judgment is level 100, so a fresh Arceus is a 120
stat line with machine coverage until the cap. Aura Sphere is level 100 on Mew. Nasty
Plot is level 90 on Mew and 75 on Darkrai, and neither can buy it. Celebi reaches Heal
Bell, Recover and Leech Seed at level 1, which is why it needs nothing.

### Alola, as far as it is written

Fifteen Alola families are registered. The Alolan forms, the tapus, the ultra beasts and
Alola's mythicals are on branches, not on `main`.

Two of them take backup slots on the PvP team below. Ribombee heals half a teammate's HP
with Pollen Puff on a 12 second cycle, which is faster than any other heal here, and it
adds Friend Guard and Sweet Veil. Primarina reaches about 176 effective Special Attack
with four teammates standing, and Liquid Voice turns Hyper Voice into a Water move that
hits the whole enemy side.

Six more are worth knowing, and none of them displaces a main slot yet.

| Pokemon | What it brings |
| --- | --- |
| **Vikavolt** 77/70/90/145/75/43 | Battery lifts every teammate's special move to 1.3x. Trickle Charge adds 10% Special Attack per Electric move anybody lands, up to 1.5x. It acts slowly at 43 Speed |
| **Araquanid** 68/70/92/50/132/42 | Bubble Ward gives the whole team 0.75x against Fire and stops them being burned. Water Bubble halves Fire on itself and doubles its own Water moves. Mirror Armor sends a stat drop back at whoever aimed it |
| **Tsareena** 72/120/98/50/98/72 | Queenly Majesty blocks every enemy priority move aimed at the side. Trop Kick always drops the target's Attack |
| **Mudsdale** 100/125/100/55/85/35 | Heavy Hooves is 1.4x on its physical moves at 920 kg. Stamina adds a Defense stage every time a hit lands, and a raid boss lands hits constantly. High Horsepower is single target, so it spares your own side |
| **Lurantis** 70/105/90/80/90/45 | Contrary turns Superpower into +1 Attack and +1 Defense a cast. Sharpness adds 1.5x to Leaf Blade, Night Slash, X-Scissor and Solar Blade |
| **Incineroar** 95/115/90/80/90/60 | Heel Audience is 1.1x Attack per enemy standing, up to 1.4x, on top of Intimidate and Tough Claws |

Battery and Bubble Ward are the two to build around if the Alola set grows.

## PvP and NPC battles, without legendaries

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
| Protector and healer, backup | **Ribombee** 60/55/60/95/70/124 | Timid | 252 Speed, 248 HP | No | Honey Share, Friend Guard, Sweet Veil, Shield Dust | **Pollen Puff, Tailwind, Stun Spore, Light Screen**, then Reflect, Aromatherapy, Quiver Dance, Protect | **Light Clay**, Leftovers, Bright Powder, Focus Sash, Shell Bell, Lax Incense, Mental Herb, Quick Claw |
| Core, spread damage, backup | **Primarina** 80/74/74/126/116/60 | Modest | 252 Special Attack, 248 HP | **Yes** | Aria Audience, Liquid Voice, Torrent, Hydration | **Hyper Voice, Moonblast, Ice Beam, Encore**, then Scald, Helping Hand, Light Screen, Protect | **Throat Spray**, Wise Glasses, Leftovers, Expert Belt, Shell Bell, Bright Powder, Focus Sash, Wide Lens |
| Core, setup sweeper, backup | **Aegislash** 60/50/140/50/140/60 | Adamant | 252 Attack, 248 HP | No, the shield stance is half its value | Turn the Blade, Stance Change, Clear Body, Cursed Body | **Swords Dance, Iron Head, Sacred Sword, King's Shield**, then Shadow Ball, Flash Cannon, Substitute, Protect | **Leftovers**, Expert Belt, Muscle Band, Shell Bell, Wide Lens, Scope Lens, Focus Band, Protective Pads |
| Core, immediate damage, backup | **Tyrantrum** 82/121/119/69/59/71 | Adamant | 252 Attack, 248 HP | **Yes** | Jaw Snap, Strong Jaw, Rock Head, Intimidate | **Crunch, Iron Head, Stone Edge, Dragon Claw**, then Head Smash, Rock Slide, Superpower, Protect | **Expert Belt**, Muscle Band, Leftovers, Shell Bell, Wide Lens, Scope Lens, Protective Pads, Focus Band |

Notes.

- Whimsicott moves first at 116 Speed with Prankster. Spore Drift makes Stun Spore and
  Cotton Spore unmissable, and Magic Bounce returns an enemy status move to its sender.
- Togekiss holds Follow Me so the two cores get a free setup cast. Serene Grace doubles
  Air Slash's flinch chance to 60%.
- Clefable's Wishing Well heals the lowest teammate every time it acts, so the heal costs
  no move slot.
- Hydreigon's Three Heads hits a second enemy for a third of the damage on every move,
  with no friendly fire.
- Metagross has the team's only priority move in Bullet Punch. Steelworker 1.5x and Hive
  Mind 1.3x put Meteor Mash near 175 effective power.
- Primarina is the core backup to field while the team is whole, because Aria Audience
  only pays 1.4x with four teammates standing. Goodra is the pick instead when you want
  150 Special Defense that depends on nobody.

## PvP and NPC battles, with legendaries

The same six roles. Rayquaza is the Mega, because Dragon Ascent needs no stone.

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

Notes.

- Windfall gives the team 1.3x on Flying moves, which Togekiss collects as well. Wide Lens
  is Tornadus's first item because Hurricane is 70 accuracy.
- Eon Shield 0.8x multiplies with Friend Guard 0.75x, so a hit on anyone but Latias lands
  at 0.6x before screens.
- Primal Sky pays +2 Special Attack and 1.3x Dragon. An Adamant Rayquaza only collects the
  Dragon half, so run Naughty or Hardy to keep both.
- Rayquaza takes the team's Mega automatically once it knows Dragon Ascent. Drop the move
  to put the Mega elsewhere.
- XD-150 takes the special core over Mewtwo because the Mega is Rayquaza's anyway and a
  true shadow cannot Mega Evolve. It gains 10 in every stat and Shadow on top.

## PvP and NPC battles, with mythicals

Four of the six are mythicals. No mythical learns Follow Me or Rage Powder, so Togekiss
keeps the redirector slot, and Whimsicott's unmissable powder beats anything a mythical
offers in field control.

| Role | Pokemon | Nature | EV priority | Shadow? | Abilities (4) | Moves, priority four in bold | Items, priority first |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Field control | **Whimsicott** 60/67/85/77/75/116 | Timid | 252 Speed, 248 HP | No | Spore Drift, Prankster, Magic Bounce, Infiltrator | **Taunt, Cotton Spore, Tailwind, Stun Spore**, then Leech Seed, Charm, Moonblast, Substitute | **Focus Sash**, Leftovers, Bright Powder, Clear Amulet, Lax Incense, Mental Herb, Shell Bell, Quick Claw |
| Redirector | **Togekiss** 85/50/95/120/115/80 | Calm | 252 HP, 248 Special Defense | No | Fair Share, Serene Grace, Friend Guard, Super Luck | **Follow Me, Air Slash, Roost, Thunder Wave**, then Dazzling Gleam, Wish, Light Screen, Encore | **Rocky Helmet**, Leftovers, Bright Powder, Lax Incense, Shell Bell, Light Clay, Focus Band, Wide Lens |
| Protector and healer | **Jirachi** 100/100/100/100/100/100 | Calm | 252 HP, 248 Special Defense | Never, no mythical can be shadowed | Seven Wishes, Magic Bounce, Levitate, Healer | **Wish, Helping Hand, Reflect, Light Screen**, then Cosmic Power, Iron Head, Toxic, Protect | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| Cleric and second protector | **Celebi** 100/100/100/100/100/100 | Calm | 252 HP, 248 Special Defense | Never, no mythical can be shadowed | Timeline Split, Healer, Anticipation, Natural Cure | **Heal Bell, Recover, Leech Seed, Light Screen**, then Giga Drain, Perish Song, Reflect, Protect | **Big Root**, Leftovers, Light Clay, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb |
| Core, special | **Arceus** 120/120/120/120/120/120 | Modest | 252 Special Attack, 248 HP | Never, no mythical can be shadowed | Firstlight, Multitype, Adaptability, Filter | **Judgment, Calm Mind, Recover, Thunder Wave**, then Ice Beam, Flamethrower, Earth Power, Protect | **Pixie Plate**, Leftovers, Wise Glasses, Expert Belt, Shell Bell, Bright Powder, Focus Sash, Wide Lens |
| Core, second attacker | **Hoopa Unbound** 80/160/60/170/130/80 | Modest | 252 Special Attack, 248 HP | Never, no mythical can be shadowed | Ringback, Prankster, Levitate, Trace | **Nasty Plot, Hyperspace Hole, Dark Pulse, Thunder Wave**, then Psyshock, Focus Blast, Taunt, Substitute | **Prison Bottle**, Life Orb, Leftovers, Wise Glasses, Black Glasses, Shell Bell, Focus Sash, Bright Powder |
| | | | | | | | |
| Field control, backup | **Darkrai** 70/90/90/135/90/125 | Timid | 252 Special Attack, 248 Speed | Never, no mythical can be shadowed | Waxing Dark, Prankster, Bad Dreams, Infiltrator | **Taunt, Thunder Wave, Nasty Plot, Dark Pulse**, then Will-O-Wisp, Dark Void, Substitute, Protect | **Focus Sash**, Black Glasses, Leftovers, Wide Lens, Bright Powder, Lax Incense, Shell Bell, Quick Claw |
| Redirector, backup | **Clefable** 95/70/73/95/90/60 | Bold | 252 HP, 248 Defense | No | Wishing Well, Magic Guard, Unaware, Friend Guard | **Follow Me, Soft-Boiled, Reflect, Light Screen**, then Moonblast, Encore, Charm, Thunder Wave | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
| Protector and healer, backup | **Manaphy** 100/100/100/100/100/100 | Calm | 252 HP, 248 Special Defense | Never, no mythical can be shadowed | Heartcurrent, Friend Guard, Healer, Water Absorb | **Reflect, Light Screen, Aqua Ring, Helping Hand**, then Tail Glow, Surf, Ice Beam, Protect | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| Cleric, backup | **Meloetta** 100/77/77/128/128/90 | Calm | 252 HP, 248 Special Defense | Never, no mythical can be shadowed | Countertune, Healer, Serene Grace, Soundproof | **Heal Bell, Light Screen, Thunder Wave, Psychic**, then Charm, Fake Tears, Helping Hand, Protect | **Leftovers**, Light Clay, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| Core, special, backup | **Mew** 100/100/100/100/100/100 | Modest | 252 Special Attack, 248 Speed | Never, no mythical can be shadowed | Ancestral Memory, Protean, Adaptability, Trace | **Nasty Plot, Aura Sphere, Psychic, Soft-Boiled**, then Taunt, Tailwind, Thunder Wave, Protect | **Wise Glasses**, Leftovers, Focus Sash, Shell Bell, Bright Powder, Lax Incense, Wide Lens, Quick Claw |
| Core, second attacker, backup | **Keldeo** 91/72/90/129/90/108 | Timid | 252 Special Attack, 248 Speed | Never, no mythical can be shadowed | Tide Vigil, Justified, Analytic, Swift Swim | **Secret Sword, Hydro Pump, Calm Mind, Taunt**, then Scald, Icy Wind, Substitute, Protect | **Mystic Water**, Leftovers, Wise Glasses, Expert Belt, Shell Bell, Focus Sash, Bright Powder, Wide Lens |

Notes.

- Arceus is the strongest unit here and the slowest to finish. Multitype makes it the type
  of its Plate, Judgment is thrown as that type, Adaptability doubles the same-type bonus,
  and Firstlight reads a resistance as 1x. Only an immunity stops it. The Pixie Plate is
  the default because nothing is immune to Fairy. Judgment is a level 100 move.
- Hoopa Unbound spends one item slot on the Prison Bottle. Hyperspace Hole never misses
  and goes through Protect. Hyperspace Fury is the physical half and wants an Adamant set.
- Jirachi's Seven Wishes heals the whole party a quarter of its HP every seventh time
  Jirachi acts, and cures Jirachi, for no action at all.
- Celebi needs nothing bought. Heal Bell, Recover and Leech Seed are level 1 moves, and
  Timeline Split clears every status and stat drop on it the first time it drops below
  half HP.
- Darkrai's sleep is a gamble. Dark Void is 50 accuracy even with Prankster casting it
  first and Waxing Dark running it 1.5x as long. Its real value is Prankster Taunt and
  Thunder Wave.
- Keldeo's Tide Vigil makes its teammates refuse every enemy stat drop and never flinch,
  which blanks Charm, Snarl, Fake Tears, Intimidate and Noble Roar. Secret Sword is
  tutor-only.
- Victini is the seventh pick. Victory Star gives the team 1.1x accuracy, Magic Guard
  stops every residual, and Winner's Share adds +1 Attack and +1 Special Attack per enemy
  that faints. Run V-create with a White Herb, never Searing Shot.

## Raids, without legendaries

Five clocks, a physical attacker, a protector and a cleric.

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

Clocks: burn and Curse from Chandelure, Leech Seed from Breloom, Toxic and paralysis from
Clefable, and Magma Trail from Magcargo.

Notes.

- Cast Will-O-Wisp first. Against a burned boss Hex doubles to 130 base and takes Hexlight
  1.4x and Mycelium 1.2x, neither of which is capped.
- Clefable applies Toxic rather than Magcargo, because it acts far more often.
- Clefable carries the paralysis too. It is worth the slot: a quarter fewer boss actions,
  a 25% chance each attempt is stopped, and a second status keeping Hexlight and Mycelium
  paying if the burn fails.
- Charm reads -2 Attack stages, so about 0.5x physical damage, and it stacks with the
  burn's own halving. Clefable's Unaware means Clefable itself still takes full hits.
- Florges holds the cleric slot because Blissey's Heal Bell and Aromatherapy are egg-only.
  Blissey is still better against a boss that lands no status, on 255 HP and Cushioned.
- Chandelure runs Calm Mind, not Overheat. Overheat drops its Special Attack two stages
  and nothing here clears that.
- Clawitzer is worth testing and may be a bug. Ranging Shot puts a floor of 1/8 of the
  target's HP under every special move it lands, and that floor is applied to ordinary
  attack damage rather than to the capped kind.

## Raids, with legendaries

The same five clocks with a sun core. Deliberately not all Fire, because one rolled Flash
Fire, Heatproof or Thick Fat would blank the damage and the status at once.

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

Clocks: burn and Curse from Chandelure, Leech Seed from Breloom, Toxic and paralysis from
Clefable, and Ember Halo from Volcarona.

Notes.

- Drought gives every Fire move 1.5x. Morning Sun is egg-only on Volcarona, so Roost is
  the heal.
- Ember Halo is a second per-action clock beside Curse, and it needs no cast.
- Primal Groudon is the better sky. The Red Orb is a held item, not the Mega, so Groudon
  raises extreme sun that no ordinary setter can overwrite, Fire keeps its 1.5x, and the
  boss's Water damaging moves fail. Keep Volcarona instead when you want Ember Halo. Never
  pair Groudon with Mega Rayquaza.
- Heatran is the conditional swap. Lavadome gives the party 1.25x against a burned boss,
  the best multiplier here, but it is burn-locked and a third Fire body.
- Mega Latias and Mega Metagross are the two Mega choices. Take Latias against a boss that
  is killing you and Metagross against one you cannot out-damage.

## Raids, with mythicals

Four damage clocks instead of five. The fifth slot buys Regalia, which gives the party +1
Defense every 10 seconds up to +3, and Seven Wishes, which heals all six a quarter of
their HP for no action.

| Role | Pokemon | Nature | EV priority | Shadow? | Abilities (4) | Moves, priority four in bold | Items, priority first |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Burn, Curse, main special damage | **Chandelure** 60/55/90/145/90/80 | Modest | 252 Special Attack, 248 HP | No, it dies to the boss | Hexlight, Infiltrator, Flash Fire, Flame Body | **Will-O-Wisp, Curse, Hex, Fire Blast**, then Calm Mind, Shadow Ball, Substitute, Confuse Ray | **Wide Lens**, Focus Sash, Expert Belt, Leftovers, Wise Glasses, Shell Bell, Bright Powder, Zoom Lens |
| Leech Seed and party multiplier | **Breloom** 60/130/80/60/60/70 | Adamant | 252 Attack, 248 HP | No, Mycelium needs it standing | Mycelium, Poison Heal, Technician, Quick Feet | **Leech Seed, Drain Punch, Facade, Mach Punch**, then Seed Bomb, Swords Dance, Substitute, Sludge Bomb | **Toxic Orb**, Big Root, Expert Belt, Wide Lens, Muscle Band, Leftovers, Shell Bell, Protective Pads |
| Toxic, cleric and team Defense | **Diancie** 50/100/150/100/150/50 | Bold | 252 HP, 248 Defense | Never, no mythical can be shadowed | Regalia, Magic Bounce, Solid Rock, Clear Body | **Toxic, Heal Bell, Reflect, Light Screen**, then Charm, Fake Tears, Diamond Storm, Protect | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| Paralysis and flexible damage | **Arceus** 120/120/120/120/120/120 | Modest | 252 Special Attack, 248 HP | Never, no mythical can be shadowed | Firstlight, Multitype, Adaptability, Filter | **Judgment, Thunder Wave, Calm Mind, Recover**, then Will-O-Wisp, Toxic, Earth Power, Protect | **Pixie Plate**, Leftovers, Wise Glasses, Expert Belt, Shell Bell, Bright Powder, Focus Sash, Wide Lens |
| Party heal and screens | **Jirachi** 100/100/100/100/100/100 | Calm | 252 HP, 248 Special Defense | Never, no mythical can be shadowed | Seven Wishes, Magic Bounce, Levitate, Healer | **Wish, Helping Hand, Reflect, Light Screen**, then Cosmic Power, Iron Head, Toxic, Protect | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| Primary physical damage | **Metagross** 80/135/130/95/90/70 | Adamant | 252 Attack, 248 HP | **Yes**, first pick | Hive Mind, Steelworker, Clear Body, Levitate | **Meteor Mash, Bullet Punch, Zen Headbutt, Ice Punch**, then Iron Head, Hammer Arm, Rock Slide, Substitute | **Expert Belt**, Wide Lens, Muscle Band, Leftovers, Shell Bell, Scope Lens, Protective Pads, Focus Band |
| | | | | | | | |
| Burn and special damage, backup | **Volcanion** 80/110/120/130/90/70 | Modest | 252 Special Attack, 248 HP | Never, no mythical can be shadowed | Boiler, Water Absorb, Flash Fire, Steam Engine | **Steam Eruption, Will-O-Wisp, Flamethrower, Protect**, then Hydro Pump, Earth Power, Haze, Substitute | **Charcoal**, Leftovers, Wise Glasses, Expert Belt, Shell Bell, Bright Powder, Safety Goggles, Wide Lens |
| Leech Seed and cleric, backup | **Celebi** 100/100/100/100/100/100 | Calm | 252 HP, 248 Special Defense | Never, no mythical can be shadowed | Timeline Split, Healer, Anticipation, Natural Cure | **Leech Seed, Heal Bell, Recover, Light Screen**, then Giga Drain, Toxic, Perish Song, Protect | **Big Root**, Leftovers, Light Clay, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb |
| Toxic and protector, backup | **Clefable** 95/70/73/95/90/60 | Bold | 252 HP, 248 Defense | No | Wishing Well, Magic Guard, Unaware, Friend Guard | **Reflect, Light Screen, Soft-Boiled, Toxic**, then Thunder Wave, Charm, Moonblast, Protect | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
| Paralysis and damage, backup | **Genesect** 71/120/95/120/95/99 | Modest | 252 Special Attack, 248 HP | Never, no mythical can be shadowed | Overclock, Download, Analytic, Adaptability | **Techno Blast, Thunder Wave, Flamethrower, Bug Buzz**, then Ice Beam, Thunderbolt, Flash Cannon, Protect | **Burn Drive**, Leftovers, Wise Glasses, Expert Belt, Shell Bell, Bright Powder, Wide Lens, Focus Sash |
| Party heal, backup | **Florges** 78/65/68/112/154/75 | Calm | 252 HP, 248 Special Defense | Never, Hothouse shares its Special Defense | Hothouse, Flower Veil, Unaware, Symbiosis | **Wish, Heal Bell, Aromatherapy, Moonblast**, then Light Screen, Safeguard, Helping Hand, Protect | **Leftovers**, Light Clay, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| Primary physical damage, backup | **Aegislash** 60/50/140/50/140/60 | Adamant | 252 Attack, 248 HP | No, the shield stance is half its value | Turn the Blade, Stance Change, Clear Body, Cursed Body | **Swords Dance, Iron Head, Sacred Sword, King's Shield**, then Shadow Ball, Flash Cannon, Substitute, Protect | **Leftovers**, Expert Belt, Muscle Band, Shell Bell, Wide Lens, Scope Lens, Focus Band, Protective Pads |

Clocks: burn and Curse from Chandelure, Leech Seed from Breloom, Toxic from Diancie, and
paralysis from Arceus.

Notes.

- Diancie is why this team survives. Regalia reaches +3 Defense about 30 seconds in, which
  is roughly 0.4x incoming physical damage, and it stacks with Reflect and with the burn.
  The catch is 50 HP behind those 150/150 defences, so Reflect goes up first.
- Jirachi replaces Florges, and the trade is real. The party loses Hothouse's shared 154
  Special Defense and gains a free party heal. Diancie carries Heal Bell, so nothing goes
  uncleansed.
- Arceus carries the paralysis, because neither Jirachi nor Diancie reaches Thunder Wave.
  Pick the Plate the boss is weak to and Firstlight covers the rest.
- The fifth clock is the price of Regalia. Only a Ghost gets Curse's per-action version,
  and the only Ghost here is already casting it. Volcarona takes Jirachi's slot if you
  want Ember Halo back.
- Volcanion is the body against a Fire or Water boss, holding Water Absorb and Flash Fire
  at once. Its Boiler only pays in ordinary rain or sun, and under a teammate's Primal
  Groudon its Water moves fail.
- Genesect's Overclock casts 25% faster above half HP and costs 1/16 of its HP per action
  at or below it.

## Matchups that break a raid team

| Boss trait | What it takes away | What to do |
| --- | --- | --- |
| Fire type | Will-O-Wisp fails and Fire damage is resisted | Lead with Toxic as the status that feeds Hexlight and Mycelium. Leave the Fire swaps out |
| Flash Fire | Fire moves do nothing and the boss's own Fire gains 1.5x | Chandelure still brings Curse, Hex and the burn. Metagross or Arceus carries the damage |
| Heatproof or Thick Fat | Fire damage halved | Metagross and Breloom carry the damage |
| Air Lock or Cloud Nine | Drought's 1.5x | Volcarona still has Ember Halo and Quiver Dance |
| Steel or Poison type | Toxic fails | The burn is the status instead |
| Grass type | Leech Seed fails | Breloom takes Swords Dance |
| Electric type | Paralysis fails | That slot becomes Will-O-Wisp or a second attack |
| Magic Bounce | Toxic, Thunder Wave and Charm come back at you | Diancie's own Magic Bounce returns them again. Lead with damage |
| Dry Skin | nothing, it takes 1.25x from Fire | Bring both Fire attackers |

Never let one type carry both the status engine and the damage. A single rolled ability
takes out both at once.

## Shopping

A machine is stocked as `TM <move name>` and is spent on use, so two pokemon wanting
Protect need two machines. The costs below cover all twelve rows of a team, mains and
backups, so building the six alone costs roughly half.

| Team | Machines | Held items | Total |
| --- | --- | --- | --- |
| PvP and NPC battles, without legendaries | 285,000 | 384,000 | **669,000** |
| PvP and NPC battles, with legendaries | 284,000 | 379,000 | **663,000** |
| PvP and NPC battles, with mythicals | 231,000 | 361,000 | **592,000** |
| Raids, without legendaries | 233,000 | 389,000 | **622,000** |
| Raids, with legendaries | 344,000 | 384,000 | **728,000** |
| Raids, with mythicals | 284,000 | 374,000 | **658,000** |

### Moves no machine sells

No machine is sold for these. A move listed on a pre-evolution has to be learned before
the catch evolves, or put back later by the Move Reminder for a Heart Scale. Moves a
species levels into below level 35 are left out, since a finished catch already has
them.

| Pokemon | Move | Where |
| --- | --- | --- |
| Amoonguss | Rage Powder | level 54 |
| Amoonguss | Spore | level 62 |
| Arceus | Judgment | level 100 |
| Arceus | Recover | level 70 |
| Blissey | Heal Pulse | level 38 |
| Breloom | Seed Bomb | level 41 |
| Carbink | Moonblast | level 50 |
| Celebi | Perish Song | level 50 |
| Clefable | Charm | level 1 as Cleffa |
| Clefable | Encore | level 4 as Clefairy |
| Clefable | Follow Me | level 17 as Clefairy |
| Clefable | Moonblast | level 46 as Clefairy |
| Darkrai | Dark Void | level 66 |
| Darkrai | Nasty Plot | level 75 |
| Heatran | Lava Plume | level 49 |
| Heatran | Magma Storm | level 96 |
| Jirachi | Cosmic Power | level 45 |
| Keldeo | Hydro Pump | level 67 |
| Keldeo | Secret Sword | Move Tutor, at full friendship |
| Latias | Dragon Pulse | level 70 |
| Latias | Heal Pulse | level 65 |
| Latias | Recover | level 45 |
| Magcargo | Earth Power | level 66 |
| Magcargo | Lava Plume | level 40 |
| Magcargo | Rock Slide | level 48 |
| Manaphy | Aqua Ring | level 54 |
| Metagross | Hammer Arm | level 45 |
| Metagross | Meteor Mash | level 55 |
| Mew | Aura Sphere | level 100 |
| Mew | Nasty Plot | level 90 |
| Mewtwo | Aura Sphere | level 100 |
| Mewtwo | Psystrike | level 100 |
| Mewtwo | Recover | level 70 |
| Primarina | Moonblast | level 44 |
| Rayquaza | Dragon Ascent | Move Tutor, at full friendship |
| Rayquaza | Extreme Speed | level 60 |
| Ribombee | Aromatherapy | level 42 |
| Ribombee | Quiver Dance | level 49 |
| Togekiss | Encore | level 25 as Togetic |
| Togekiss | Follow Me | level 26 as Togetic |
| Togekiss | Wish | level 31 as Togetic |
| Trevenant | Wood Hammer | level 44 |
| Tyrantrum | Head Smash | level 58 |
| Whimsicott | Charm | level 28 as Cottonee |
| Whimsicott | Moonblast | level 50 |
| Whimsicott | Stun Spore | level 10 as Cottonee |
| XD-150 | Aura Sphere | level 100 |
| XD-150 | Psystrike | level 100 |
| XD-150 | Recover | level 70 |

### Items no shop sells

Leftovers, Big Root, Soul Dew, the Plates, the Drives, the Mega Stones, the orbs and the
Prison Bottle are found rather than bought. So is every relic.
