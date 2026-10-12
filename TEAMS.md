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

- A boss has 110x HP and doubled stats, and its single-target moves hit your whole side.
- It fights with the moves it levels into, its hardest attacks first, never a machine's.
  Its status moves (Darkrai's Haze, Zapdos' Thunder Wave, Zygarde's Glare) land on all six
  of you.
- At half HP and again at a quarter it clears its status, its stat drops, Leech Seed and
  Curse. Plan to reapply the burn and Charm twice.
- It is immune to sleep, freeze, flinch, trapping, infatuation, Taunt, Encore, Torment
  and Imprison, and to forced switching.
- Indirect damage and share-of-HP damage share one allowance. It holds 200 and refills at
  50 a second, so stacking clocks no longer adds up: five clocks pay what one pays.
- Wide Guard does not block a boss. It reads the move's own data, and a boss throws
  single-target moves that are retargeted as they go out.

### Egg moves and Life Dew

The Gen 8 learnsets turned most of the old egg-only moves into level-up moves or
machines. Dragonite now takes Dragon Dance (level 62, or a machine) over Hone Claws, and
Whimsicott takes Encore into its first four. These are still egg-only, so they are left
out.

| Move | Egg-only on | Out of reach for |
| --- | --- | --- |
| Wish | Clefable, as Cleffa | Blissey |
| Heal Bell | Blissey, as Happiny | Clefable |
| Aromatherapy | Clefable and Blissey, as Cleffa and Happiny | |
| Morning Sun | Volcarona, as Larvesta | |
| Fake Tears | Breloom, as Shroomish | |

That is why Florges still holds the raid cleric slot: it cleanses and nothing else on
these teams does.

Life Dew is new with Gen 8. It heals every teammate 1/4 of their HP and comes back every
18 seconds (10 PP), but it cures nothing. Togekiss and Clefable learn it at level 1,
Blissey at 12, Jirachi at 21, and Celebi and Mew at 40. Florges, Latias, Manaphy and
Diancie cannot learn it. It now sits on every Togekiss, Clefable, Blissey, Jirachi and
Celebi row.

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
| **Reveal Glass** | Tornadus, Thundurus, Landorus | the Therian forme | Regenerator, Volt Absorb, Intimidate |
| **Rusted Sword** | Zacian | Crowned Zacian 92/150/115/80/115/148, and Iron Head becomes Behemoth Blade | none |
| **Rusted Shield** | Zamazenta | Crowned Zamazenta 92/120/140/80/140/128, and Iron Head becomes Behemoth Bash | none |

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

Tornadus Therian is 79/100/80/110/90/121 and wears Regenerator, which does almost nothing
here, so the Reveal Glass trades 15 Special Attack for 10 Speed and 10 in both defences.
The incarnate Tornadus stays the pick.

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

Nine true shadows are the Articuno, Zapdos, Moltres, Mewtwo, Raikou, Entei, Suicune,
Lugia and Ho-Oh of the dark: XD-144, XD-145, XD-146, XD-150, XD-243, XD-244, XD-245,
XD-249 and XD-250 ([`true-shadow.ts`](src/data/species/true-shadow.ts)). Each copies its
counterpart and adds 10 to every stat, and each carries Shadow permanently.

- They are only found under a dark day, in the special band of the wild pool and in
  shadow lairs.
- A Purifying Gem refuses one.
- No stone finds one, so a true shadow never Mega Evolves.
- XD-150 hits hardest of the nine, at about 205 effective Special Attack. XD-250 is the
  physical one, at about 175 effective Attack. The three birds, XD-245 and XD-249 are not
  worth it, because Shadow taxes the bulk they are built on.

### Mythicals

Nineteen families sit in the mythical band: Mew, Celebi, Jirachi, Deoxys, Manaphy,
Darkrai, Shaymin, Arceus, Victini, Keldeo, Meloetta, Genesect, Diancie, Hoopa, Volcanion,
Magearna, Marshadow, Zeraora and Meltan.

- Each is called by one relic, which is dug up from the item pool and spent when the raid
  starts ([`raid-items.ts`](src/data/items/raid-items.ts)).
- Alola's four are also met now and then in the wild in their home biomes. The world
  never stages the other fifteen.
- The prize arrives at level 30, against a legendary's 50.
- No mythical can ever be a Shadow, so none of them collects Shadow's +25%.
- No mythical has egg moves.
- A signature ability still costs one of the four slots.
- Clearing one pays 200,000 gold.
- Most mythical signature moves have 5 PP, so they fire once in 36 seconds before Speed.

A prize arrives at level 30, so the level-up moves decide how soon a build is whole.

- Judgment is level 100, so a fresh Arceus is a 120 stat line with machine coverage
  until the cap.
- Mew learns Nasty Plot at 50 and Aura Sphere at 90, and a machine teaches both. Darkrai
  learns Nasty Plot at 75, and no machine sells it to Darkrai.
- Celebi has Heal Bell on arrival, but Leech Seed waits until 50 and Recover until 60.
- The signature moves come late: Steam Eruption at 72, Techno Blast at 84 and Diamond
  Storm at 91. Until then Volcanion leads with Flamethrower and Genesect with
  Flamethrower and Bug Buzz.

### Alola and Galar

Both regions are on `main`: every Alola family with its Alolan forms, the Tapus, the
Ultra Beasts and Alola's mythicals, and Galar's families, regional forms and legends.

Two Alola pokemon take backup slots on the PvP team below. Ribombee heals half a teammate's HP
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

Battery and Bubble Ward are the two to build around from Alola.

One Galar legend takes a backup slot: Crowned Zacian is the physical core backup on the
legendary PvP team. The Rusted Sword is a form item, so the team's one Mega stays free
for Rayquaza. Sworn Blade casts Sacred Sword at whoever first drops Zacian or a teammate
below half HP, once per unit. Sharpness lifts Sacred Sword, Behemoth Blade and Psycho Cut
1.5x.

| Pokemon | What it brings |
| --- | --- |
| **Crowned Zamazenta** 92/120/140/80/140/128 | Sworn Shield casts Follow Me the first time an enemy leaves a teammate below half HP, once per teammate. It redirects without a move slot |
| **Eternatus** 140/85/95/145/95/130 | Darkest Day takes 1/16 of every enemy's HP each time that enemy acts and heals Eternatus by the same. Against a raid boss it is one more clock under the shared allowance |
| **Calyrex riders** Ice 100/165/150/85/130/50, Shadow 100/85/80/165/100/150 | The Reins of Unity seat Calyrex on Glastrier or Spectrier and are spent on each use. Crownreign heals the whole team 1/8 of their HP per knockout, and As One adds +1 Attack or +1 Special Attack per knockout |
| **Magearna** 80/95/115/130/115/65 | Soul-Heart gives +1 Special Attack whenever any other pokemon faints, and Soul Relay takes on a fainted teammate's raised stages. Fleur Cannon is level 90 |
| **Perrserker** 70/110/100/50/60/50 | Steely Spirit lifts the team's Steel moves 1.5x, on top of Metagross's Steelworker and Hive Mind |
| **Cresselia** 120/70/110/75/120/85 | Lunar Blessing, at level 57 and 5 PP, heals the whole team 1/4 of their HP and cures them. Waning Light halves every timed status on its own team, the helpful ones included |

## PvP and NPC battles, without legendaries

Two cores that take something off the field, and four supports that keep them standing.

| Role | Pokemon | Nature | EV priority | Shadow? | Abilities (4) | Moves, priority four in bold | Items, priority first |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Field control | **Whimsicott** 60/67/85/77/75/116 | Timid | 252 Speed, 248 HP | No | Spore Drift, Prankster, Magic Bounce, Infiltrator | **Taunt, Encore, Cotton Spore, Tailwind**, then Stun Spore, Charm, Moonblast, Substitute | **Focus Sash**, Leftovers, Bright Powder, Clear Amulet, Lax Incense, Mental Herb, Shell Bell, Quick Claw |
| Redirector | **Togekiss** 85/50/95/120/115/80 | Calm | 252 HP, 248 Special Defense | No | Fair Share, Serene Grace, Friend Guard, Super Luck | **Follow Me, Air Slash, Roost, Thunder Wave**, then Life Dew, Dazzling Gleam, Wish, Light Screen | **Rocky Helmet**, Leftovers, Bright Powder, Lax Incense, Shell Bell, Light Clay, Focus Band, Wide Lens |
| Protector and healer | **Clefable** 95/70/73/95/90/60 | Bold | 252 HP, 248 Defense | No | Wishing Well, Magic Guard, Unaware, Friend Guard | **Reflect, Light Screen, Life Dew, Moonblast**, then Soft-Boiled, Encore, Charm, Thunder Wave | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
| Core, spread damage | **Hydreigon** 92/105/90/125/90/98 | Modest | 252 Special Attack, 248 Speed | **Yes** | Three Heads, Levitate, Berserk, Pressure | **Draco Meteor, Dark Pulse, Flamethrower, Nasty Plot**, then Earth Power, Flash Cannon, Tailwind, Protect | **White Herb**, Expert Belt, Leftovers, Wise Glasses, Focus Sash, Shell Bell, Wide Lens, Scope Lens |
| Core, setup sweeper | **Dragonite** 91/134/95/100/100/80 | Adamant | 252 Attack, 248 Speed | Only if healed | Serene Storm, Multiscale, Marvel Scale, Inner Focus | **Dragon Dance, Dragon Claw, Fire Punch, Roost**, then Iron Head, Thunder Punch, Waterfall, Substitute | **Protective Pads**, Leftovers, Expert Belt, Muscle Band, Shell Bell, Focus Sash, Wide Lens, Quick Claw |
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
  Encore, now a machine, locks a setup sweeper into its boost.
- Togekiss holds Follow Me so the two cores get a free setup cast. Serene Grace doubles
  Air Slash's flinch chance to 60%.
- Clefable's Wishing Well heals the lowest teammate every time it acts, so the heal costs
  no move slot. Life Dew tops up the whole team on top of it, which is why it takes
  Soft-Boiled's place in the first four.
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
| Redirector | **Togekiss** 85/50/95/120/115/80 | Calm | 252 HP, 248 Special Defense | No | Fair Share, Serene Grace, Friend Guard, Super Luck | **Follow Me, Air Slash, Roost, Thunder Wave**, then Life Dew, Dazzling Gleam, Wish, Light Screen | **Rocky Helmet**, Leftovers, Bright Powder, Lax Incense, Shell Bell, Light Clay, Focus Band, Wide Lens |
| Core, special | **XD-150** 116/120/100/164/100/140 | Timid | 252 Special Attack, 248 Speed | Always, it is one by nature | Genetic Apex, Magic Guard, Pressure, Unnerve | **Calm Mind, Psystrike, Aura Sphere, Ice Beam**, then Recover, Thunderbolt, Shadow Ball, Taunt | **Focus Sash**, Expert Belt, Leftovers, Wise Glasses, Shell Bell, Scope Lens, Bright Powder, Quick Claw |
| Core, physical | **Rayquaza** 105/150/90/150/90/95 | Adamant | 252 Attack, 248 Speed | Yes, but walk its friendship up first | Primal Sky, Multiscale, Intimidate, Air Lock | **Dragon Dance, Dragon Ascent, Extreme Speed, Dragon Claw**, then Iron Head, Stone Edge, Waterfall, Protect | **Protective Pads**, Leftovers, Muscle Band, Expert Belt, Shell Bell, Focus Sash, Scope Lens, Wide Lens |
| Second protector | **Clefable** 95/70/73/95/90/60 | Bold | 252 HP, 248 Defense | No | Wishing Well, Magic Guard, Unaware, Friend Guard | **Reflect, Light Screen, Life Dew, Moonblast**, then Soft-Boiled, Encore, Charm, Thunder Wave | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
| | | | | | | | |
| Field control, backup | **Whimsicott** 60/67/85/77/75/116 | Timid | 252 Speed, 248 HP | No | Spore Drift, Prankster, Magic Bounce, Infiltrator | **Taunt, Encore, Cotton Spore, Tailwind**, then Stun Spore, Charm, Moonblast, Substitute | **Focus Sash**, Leftovers, Bright Powder, Clear Amulet, Lax Incense, Mental Herb, Shell Bell, Quick Claw |
| Protector and healer, backup | **Florges** 78/65/68/112/154/75 | Calm | 252 HP, 248 Special Defense | Never, Hothouse shares its Special Defense | Hothouse, Flower Veil, Unaware, Symbiosis | **Wish, Heal Bell, Aromatherapy, Moonblast**, then Light Screen, Safeguard, Helping Hand, Protect | **Leftovers**, Light Clay, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| Redirector, backup | **Clefable** 95/70/73/95/90/60 | Bold | 252 HP, 248 Defense | No | Wishing Well, Magic Guard, Unaware, Friend Guard | **Follow Me, Life Dew, Reflect, Light Screen**, then Soft-Boiled, Moonblast, Encore, Charm | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
| Core, special, backup | **Mewtwo** 106/110/90/154/90/130 | Timid | 252 Special Attack, 248 Speed | **Yes** | Genetic Apex, Magic Guard, Pressure, Unnerve | **Calm Mind, Psystrike, Aura Sphere, Ice Beam**, then Recover, Thunderbolt, Shadow Ball, Taunt | **Expert Belt**, Leftovers, Wise Glasses, Focus Sash, Shell Bell, Scope Lens, Bright Powder, Quick Claw |
| Core, physical, backup | **Zacian** 92/150/115/80/115/148 crowned | Adamant | 252 Attack, 248 Speed | **Yes** | Sworn Blade, Intrepid Sword, Sharpness, Justified | **Swords Dance, Iron Head, Sacred Sword, Play Rough**, then Close Combat, Psycho Cut, Quick Attack, Protect | **Rusted Sword**, Muscle Band, Expert Belt, Leftovers, Shell Bell, Scope Lens, Wide Lens, Focus Sash |
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
- Crowned Zacian replaces Dragonite as the physical backup. The Rusted Sword is a form
  item, not a Mega, so it sits beside Rayquaza's Mega. Intrepid Sword is +1 Attack on its
  first entry, and Sworn Blade answers the first hit that takes it or a teammate below
  half HP with a free Sacred Sword. Iron Head is there to become Behemoth Blade.

## PvP and NPC battles, with mythicals

Four of the six are mythicals. No mythical learns Follow Me or Rage Powder, so Togekiss
keeps the redirector slot, and Whimsicott's unmissable powder beats anything a mythical
offers in field control.

| Role | Pokemon | Nature | EV priority | Shadow? | Abilities (4) | Moves, priority four in bold | Items, priority first |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Field control | **Whimsicott** 60/67/85/77/75/116 | Timid | 252 Speed, 248 HP | No | Spore Drift, Prankster, Magic Bounce, Infiltrator | **Taunt, Encore, Cotton Spore, Tailwind**, then Stun Spore, Charm, Moonblast, Substitute | **Focus Sash**, Leftovers, Bright Powder, Clear Amulet, Lax Incense, Mental Herb, Shell Bell, Quick Claw |
| Redirector | **Togekiss** 85/50/95/120/115/80 | Calm | 252 HP, 248 Special Defense | No | Fair Share, Serene Grace, Friend Guard, Super Luck | **Follow Me, Air Slash, Roost, Thunder Wave**, then Life Dew, Dazzling Gleam, Wish, Light Screen | **Rocky Helmet**, Leftovers, Bright Powder, Lax Incense, Shell Bell, Light Clay, Focus Band, Wide Lens |
| Protector and healer | **Jirachi** 100/100/100/100/100/100 | Calm | 252 HP, 248 Special Defense | Never, no mythical can be shadowed | Seven Wishes, Magic Bounce, Levitate, Healer | **Wish, Life Dew, Reflect, Light Screen**, then Helping Hand, Cosmic Power, Toxic, Protect | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| Cleric and second protector | **Celebi** 100/100/100/100/100/100 | Calm | 252 HP, 248 Special Defense | Never, no mythical can be shadowed | Timeline Split, Healer, Anticipation, Natural Cure | **Heal Bell, Recover, Leech Seed, Light Screen**, then Life Dew, Giga Drain, Reflect, Protect | **Big Root**, Leftovers, Light Clay, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb |
| Core, special | **Arceus** 120/120/120/120/120/120 | Modest | 252 Special Attack, 248 HP | Never, no mythical can be shadowed | Firstlight, Multitype, Adaptability, Filter | **Judgment, Calm Mind, Recover, Thunder Wave**, then Ice Beam, Flamethrower, Earth Power, Protect | **Pixie Plate**, Leftovers, Wise Glasses, Expert Belt, Shell Bell, Bright Powder, Focus Sash, Wide Lens |
| Core, second attacker | **Hoopa Unbound** 80/160/60/170/130/80 | Modest | 252 Special Attack, 248 HP | Never, no mythical can be shadowed | Ringback, Prankster, Levitate, Trace | **Nasty Plot, Hyperspace Hole, Dark Pulse, Thunder Wave**, then Psyshock, Focus Blast, Taunt, Substitute | **Prison Bottle**, Life Orb, Leftovers, Wise Glasses, Black Glasses, Shell Bell, Focus Sash, Bright Powder |
| | | | | | | | |
| Field control, backup | **Darkrai** 70/90/90/135/90/125 | Timid | 252 Special Attack, 248 Speed | Never, no mythical can be shadowed | Waxing Dark, Prankster, Bad Dreams, Infiltrator | **Taunt, Thunder Wave, Nasty Plot, Dark Pulse**, then Will-O-Wisp, Dark Void, Substitute, Protect | **Focus Sash**, Black Glasses, Leftovers, Wide Lens, Bright Powder, Lax Incense, Shell Bell, Quick Claw |
| Redirector, backup | **Clefable** 95/70/73/95/90/60 | Bold | 252 HP, 248 Defense | No | Wishing Well, Magic Guard, Unaware, Friend Guard | **Follow Me, Life Dew, Reflect, Light Screen**, then Soft-Boiled, Moonblast, Encore, Charm | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
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
  Jirachi acts, and cures Jirachi, for no action at all. Life Dew, at level 21, adds the
  same party heal every 18 seconds.
- Celebi needs nothing bought, but it is not whole on arrival. Heal Bell is there at
  level 30, Leech Seed comes at 50 and Recover at 60. Timeline Split clears every status
  and stat drop on it the first time it drops below half HP.
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
| Protector and passive healer | **Clefable** 95/70/73/95/90/60 | Bold | 252 HP, 248 Defense | No | Wishing Well, Magic Guard, Unaware, Friend Guard | **Reflect, Light Screen, Life Dew, Toxic**, then Thunder Wave, Charm, Soft-Boiled, Protect | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
| Cleric and damage support | **Florges** 78/65/68/112/154/75 | Calm | 252 HP, 248 Special Defense | Never, Hothouse shares its Special Defense | Hothouse, Flower Veil, Unaware, Symbiosis | **Wish, Heal Bell, Aromatherapy, Moonblast**, then Light Screen, Safeguard, Helping Hand, Protect | **Leftovers**, Light Clay, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| | | | | | | | |
| Burn and special damage, backup | **Cofagrigus** 58/50/145/95/105/30 | Modest | 252 HP, 248 Special Attack | No, its 145/105 defences are the point | Death Mask, Mummy, Cursed Body, Pressure | **Will-O-Wisp, Hex, Curse, Shadow Ball**, then Toxic, Nasty Plot, Pain Split, Protect | **Leftovers**, Expert Belt, Wise Glasses, Shell Bell, Light Clay, Bright Powder, Focus Band, Wide Lens |
| Leech Seed, backup | **Trevenant** 85/110/76/65/82/56 | Adamant | 252 Attack, 248 HP | No | Undergrowth, Harvest, Natural Cure, Frisk | **Leech Seed, Will-O-Wisp, Horn Leech, Wood Hammer**, then Shadow Ball, Protect, Toxic, Substitute | **Leftovers**, Big Root, Expert Belt, Muscle Band, Shell Bell, Rocky Helmet, Wide Lens, Focus Band |
| Toxic carrier, backup | **Amoonguss** 114/85/70/85/80/30 | Bold | 252 HP, 248 Defense | No | Sporeburst, Regenerator, Effect Spore, Overcoat | **Toxic, Sludge Bomb, Giga Drain, Protect**, then Synthesis, Rage Powder, Substitute, Seed Bomb | **Leftovers**, Rocky Helmet, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Light Clay |
| Primary physical damage, backup | **Aegislash** 60/50/140/50/140/60 | Adamant | 252 Attack, 248 HP | No, the shield stance is half its value | Turn the Blade, Stance Change, Clear Body, Cursed Body | **Swords Dance, Iron Head, Sacred Sword, King's Shield**, then Shadow Ball, Flash Cannon, Substitute, Protect | **Leftovers**, Expert Belt, Muscle Band, Shell Bell, Wide Lens, Scope Lens, Focus Band, Protective Pads |
| Protector, backup | **Carbink** 50/50/150/50/150/50 | Bold | 252 HP, 248 Defense | Never, it is nothing but defences | Crystal Growth, Clear Body, Sturdy, Levitate | **Reflect, Light Screen, Moonblast, Safeguard**, then Calm Mind, Power Gem, Protect, Rest | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| Cleric, backup | **Blissey** 255/10/10/75/135/55 | Calm | 252 Defense, 248 Special Defense | Never | Cushioned, Healer, Friend Guard, Serene Grace | **Life Dew, Soft-Boiled, Heal Pulse, Helping Hand**, then Safeguard, Light Screen, Reflect, Protect | **Leftovers**, Light Clay, Bright Powder, Shell Bell, Focus Band, Lax Incense, Mental Herb, Quick Claw |

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
  Blissey is the better healer against a boss that lands no status, on 255 HP and
  Cushioned, and it now leads with Life Dew.
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
| Second protector and Toxic clock | **Clefable** 95/70/73/95/90/60 | Bold | 252 HP, 248 Defense | No | Wishing Well, Magic Guard, Unaware, Friend Guard | **Toxic, Reflect, Light Screen, Life Dew**, then Thunder Wave, Charm, Soft-Boiled, Protect | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
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
| Party heal and screens | **Jirachi** 100/100/100/100/100/100 | Calm | 252 HP, 248 Special Defense | Never, no mythical can be shadowed | Seven Wishes, Magic Bounce, Levitate, Healer | **Wish, Life Dew, Reflect, Light Screen**, then Helping Hand, Cosmic Power, Toxic, Protect | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| Primary physical damage | **Metagross** 80/135/130/95/90/70 | Adamant | 252 Attack, 248 HP | **Yes**, first pick | Hive Mind, Steelworker, Clear Body, Levitate | **Meteor Mash, Bullet Punch, Zen Headbutt, Ice Punch**, then Iron Head, Hammer Arm, Rock Slide, Substitute | **Expert Belt**, Wide Lens, Muscle Band, Leftovers, Shell Bell, Scope Lens, Protective Pads, Focus Band |
| | | | | | | | |
| Burn and special damage, backup | **Volcanion** 80/110/120/130/90/70 | Modest | 252 Special Attack, 248 HP | Never, no mythical can be shadowed | Boiler, Water Absorb, Flash Fire, Steam Engine | **Steam Eruption, Will-O-Wisp, Flamethrower, Protect**, then Hydro Pump, Earth Power, Haze, Substitute | **Charcoal**, Leftovers, Wise Glasses, Expert Belt, Shell Bell, Bright Powder, Safety Goggles, Wide Lens |
| Leech Seed and cleric, backup | **Celebi** 100/100/100/100/100/100 | Calm | 252 HP, 248 Special Defense | Never, no mythical can be shadowed | Timeline Split, Healer, Anticipation, Natural Cure | **Leech Seed, Heal Bell, Recover, Light Screen**, then Life Dew, Giga Drain, Toxic, Protect | **Big Root**, Leftovers, Light Clay, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb |
| Toxic and protector, backup | **Clefable** 95/70/73/95/90/60 | Bold | 252 HP, 248 Defense | No | Wishing Well, Magic Guard, Unaware, Friend Guard | **Reflect, Light Screen, Life Dew, Toxic**, then Thunder Wave, Charm, Soft-Boiled, Protect | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
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
  Special Defense and gains two party heals, Seven Wishes and Life Dew. Diancie carries
  Heal Bell, so nothing goes uncleansed.
- Arceus carries the paralysis. Diancie cannot learn Thunder Wave, and Jirachi can now
  buy it but has no slot left beside its heals and screens. Pick the Plate the boss is
  weak to and Firstlight covers the rest.
- The fifth clock is the price of Regalia. Only a Ghost gets Curse's per-action version,
  and the only Ghost here is already casting it. Volcarona takes Jirachi's slot if you
  want Ember Halo back.
- Volcanion is the body against a Fire or Water boss, holding Water Absorb and Flash Fire
  at once. Its Boiler only pays in ordinary rain or sun, and under a teammate's Primal
  Groudon its Water moves fail.
- Genesect's Overclock casts 25% faster above half HP and costs 1/16 of its HP per action
  at or below it. Techno Blast waits until level 84 and Steam Eruption until 72, so both
  backups lead with Flamethrower until then.

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
| Unseen Fist | Its contact moves go through Protect and King's Shield | Use Substitute where a row offers it, and put the screens up first |

Never let one type carry both the status engine and the damage. A single rolled ability
takes out both at once.

## Shopping

A machine is stocked as `TM <move name>` and is spent on use, so two pokemon wanting
Protect need two machines. The costs below cover all twelve rows of a team, mains and
backups, so building the six alone costs roughly half.

| Team | Machines | Held items | Total |
| --- | --- | --- | --- |
| PvP and NPC battles, without legendaries | 321,000 | 384,000 | **705,000** |
| PvP and NPC battles, with legendaries | 327,000 | 374,000 | **701,000** |
| PvP and NPC battles, with mythicals | 260,000 | 361,000 | **621,000** |
| Raids, without legendaries | 240,000 | 389,000 | **629,000** |
| Raids, with legendaries | 353,000 | 384,000 | **737,000** |
| Raids, with mythicals | 285,000 | 374,000 | **659,000** |

### Moves no machine sells

No machine is sold for these. A move the catch has passed can be put back by the Move
Reminder for a Heart Scale. Moves a species levels into below level 35 are left out,
since a finished catch already has them.

| Pokemon | Move | Where |
| --- | --- | --- |
| Amoonguss | Rage Powder | level 42 |
| Amoonguss | Spore | level 54 |
| Arceus | Judgment | level 100 |
| Arceus | Recover | level 70 |
| Breloom | Seed Bomb | level 44 |
| Carbink | Moonblast | level 55 |
| Celebi | Leech Seed | level 50 |
| Celebi | Life Dew | level 40 |
| Celebi | Recover | level 60 |
| Cofagrigus | Curse | level 38 |
| Darkrai | Dark Void | level 66 |
| Darkrai | Nasty Plot | level 75 |
| Diancie | Diamond Storm | level 91 |
| Genesect | Techno Blast | level 84 |
| Heatran | Lava Plume | level 42 |
| Heatran | Magma Storm | level 72 |
| Keldeo | Secret Sword | Move Tutor, at full friendship |
| Latias | Heal Pulse | level 50 |
| Manaphy | Aqua Ring | level 54 |
| Metagross | Meteor Mash | level 52 |
| Mewtwo | Psystrike | level 72 |
| Mewtwo | Recover | level 80 |
| Primarina | Moonblast | level 51 |
| Rayquaza | Dragon Ascent | Move Tutor, at full friendship |
| Ribombee | Quiver Dance | level 64 |
| Trevenant | Wood Hammer | level 44 |
| Tyrantrum | Head Smash | level 66 |
| Volcanion | Steam Eruption | level 72 |
| XD-150 | Psystrike | level 72 |
| XD-150 | Recover | level 80 |

### Items no shop sells

Leftovers, Big Root, Soul Dew, the Plates, the Drives, the Mega Stones, the orbs, the
Prison Bottle, the Reveal Glass and the Rusted Sword are found rather than bought. So is every relic.
