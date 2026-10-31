# Team suggestions

Six teams: PvP and raids, each without legendaries, with legendaries, and with mythicals.
Every species, move, ability and item below was checked against the registries in
`src/data`. A team gets one Mega, one Zenith, one Z-Move, one Dynamax and one Tera, and
each row says which of them it takes.

## How to read a row

- Moves are eight, which is the cap. The first four in bold are the ones to take first.
- Abilities are four, which is the cap. A signature ability counts as one of the four.
- Items are eight, which is the cap. The first one listed is the one to get first.
- Held change says which of the five once-a-fight changes the row takes: Mega, Zenith,
  Z-Move, Dynamax or Tera (with its Tera type). The item for it is the first item listed,
  and the moves are already set for it. None means the row holds no change. See
  [Held changes](#held-changes) for what each one does.
- A team holds one of each change. A backup takes the change of the main it replaces, and
  a backup marked None leaves that change unused while it is fielded.
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

### Held changes

Five changes are held rather than pressed, and each is once a side a fight. One pokemon
holds one change, so a team can field all five on five different pokemon.

| Change | Held item | Who takes it | Where the item comes from |
| --- | --- | --- | --- |
| **Mega** | its own Mega Stone | the holder with the highest level, then the biggest Mega by base-stat total, then whoever stands earliest, as it takes the field | the rare band of the item pool, never sold |
| **Zenith** | its own Zenith Shard | picked the way the Mega is, and apart from it, as it takes the field | the prized band, buried only where the line lives |
| **Z-Move** | a Z-Crystal | the first holder to throw a matching move | the rare band, dust clouds, and a Totem's first clear |
| **Dynamax** | a Dynamax Band | the first holder whose HP falls from half or more to under half | the rare band, dust clouds, and one Max Raid clear in ten |
| **Tera** | a Tera Orb | the first holder to take the field | the rare band, dust clouds, and one Tera raid clear in ten |

- A pokemon holding a Mega Stone, a Zenith Shard or a Z-Crystal never Dynamaxes or
  Terastallizes. A Dynamax Band holder never Terastallizes. A Mega, a Zenith and their
  holders never throw a Z-Move.
- A form item (an orb, a Plate, the Prison Bottle, the Rusted Sword) is none of the five.
  It leaves all of them free, but a pokemon whose shape comes from a held item has no
  Zenith.

### Megas

- Rayquaza needs no stone, only Dragon Ascent.
- The Mega's ability is worn on top of the catch's four. Stats and types change. Moves,
  other items and the catch's own abilities stay.
- Where a line already reaches its Mega's canon ability, the Mega wears a different one
  (its `filler` in [`species/megas/`](../src/data/species/megas)).

| Mega | Stat line | Ability it wears |
| --- | --- | --- |
| **Mega Metagross** | 80/145/150/105/110/110 | Tough Claws, and every move on its set makes contact |
| **Mega Latias** | 80/100/120/140/150/110 | Friend Guard, which multiplies with its own Eon Shield |
| **Mega Chandelure** | 60/75/110/175/110/90 | Cursed Body, since the line already reaches Infiltrator |
| **Mega Heatran** | 91/120/106/175/141/67 | Solid Rock |
| **Mega Darkrai** | 70/120/130/165/130/85 | Dark Aura, 1.33x on every Dark move on the field, the enemy's too |
| **Mega Clefable** | 95/80/93/135/110/70, Fairy and Flying | Magic Bounce |
| **Mega Dragonite** | 91/124/115/145/125/100 | Gale Wings, since the line already reaches Multiscale |
| **Mega Mewtwo Y** | 106/150/70/194/120/140 | Insomnia |
| **Mega Mewtwo X** | 106/190/100/154/100/130 | Steadfast |
| **Mega Rayquaza** | 105/180/100/180/100/115 | Delta Stream |
| **Mega Diancie** | 50/160/110/160/110/110 | Queenly Majesty |
| **Mega Audino** | 103/60/126/80/126/50 | Triage, which puts every heal 3 priority brackets early |

Mega Chandelure is the new raid Mega: 30 more Special Attack and 20 more in each defence,
on the pokemon that already deals the most. Mega Dragonite moves 10 Attack into 45
Special Attack, which a physical set does not want, so Dragonite takes the Tera instead.
Mega Clefable gains Special Attack but turns Fairy and Flying, weak to Rock, Electric,
Ice, Poison and Steel, so it stays plain.

Two traps. The automatic pick reads level first, so one stone and one shard per team is
the simple rule. Rayquaza cannot opt out once it knows Dragon Ascent.

### Zeniths

A Zenith is this game's own Mega for a final stage that has none. It fights 100 above its
pokemon's base-stat total, none of it in HP, sometimes with a new type, and wears an
ability its line can never be born with on top of the catch's four. A pokemon with a Mega
has no Zenith, and neither does one whose shape a held item decides. On these teams that
rules out Metagross, Latias, Mewtwo, Rayquaza, Clefable, Dragonite, Chandelure, Darkrai,
Heatran, Diancie, Arceus, Hoopa, Tornadus, Zacian and Genesect.

| Zenith | Stat line | Types | Ability it wears | What it does for the row |
| --- | --- | --- | --- | --- |
| **Hydreigon** | 92/105/100/160/100/143 | Dark, Dragon | Mega Launcher | Dark Pulse and Dragon Pulse hit 1.5x |
| **Primarina** | 80/74/94/166/116/100 | Water, Fairy | Water Bubble | Liquid Voice makes Hyper Voice a Water move, so it hits 2x and still reaches the whole enemy side |
| **Volcarona** | 85/60/85/160/120/140 | Bug, Fire | Simple | Each Quiver Dance is +2 to three stats. Every drop it takes counts double too |
| **Breloom** | 60/161/93/60/72/114 | Grass, Fighting | Iron Fist | Drain Punch and Mach Punch hit 1.2x |
| **Jirachi** | 100/113/125/112/125/125 | Steel, Psychic | Comatose | No status lands on it, so a raid boss's paralysis never slows Seven Wishes |
| **Togekiss** | 85/50/113/143/133/121 | Fairy, Flying | Pixilate | Only pays with Hyper Voice. The real gain is 18 in each defence and 41 Speed |
| **Celebi** | 100/100/125/125/125/125 | Psychic, Grass | Grassy Surge | In a raid the grass covers your own party only, and heals each grounded member 1/16 of its HP every time it acts |
| **Blissey** | 255/10/35/100/160/80 | Normal, Fairy | Misty Surge | In a raid the mist covers your own party only, so the boss's status cannot land on your grounded five while yours still lands on it |
| **Florges** | 78/65/118/142/154/95 | Fairy | Triage | Wish goes off a step ahead of everything else |
| **Carbink** | 50/50/180/70/180/70 | Rock, Fairy | Stamina | +1 Defense per hit, and a raid boss hits constantly |
| **Aegislash** | 60/50/160/50/160/120 | Steel, Ghost | Sharpness | Sacred Sword hits 1.5x, in both stances |
| **Tyrantrum** | 82/166/119/69/74/111 | Rock, Dragon | Supreme Overlord | Up to 1.5x as teammates fall |
| **Ribombee** | 60/55/85/130/95/139 | Bug, Fairy | Prankster | Tailwind, Stun Spore and the screens go out first |
| **Heliolisk** | 62/55/72/149/104/139 | Electric, Normal | Drought | A sun setter of its own |
| **Goodra** | 90/100/110/150/150/100 | Dragon, Water | Drizzle | Its rain halves Fire, so never beside the sun core |
| **Volcanion** | 80/110/120/170/110/110 | Fire, Water | Sheer Force | 1.3x on Steam Eruption and Flamethrower, and their burn never lands. Will-O-Wisp still burns |
| **Mew** | 100/118/118/129/118/117 | Psychic | Download | +1 to whichever attack the enemy is softer against |
| **Keldeo** | 91/72/95/164/95/163 | Water, Fighting | Sniper | 1.5x on critical hits |
| **Manaphy** | 100/100/118/147/118/117 | Water | Adaptability | Its Water moves hit 2x |

Two cautions. Misty Terrain also refuses the poison Breloom's Toxic Orb gives it, so a
Zenith Blissey costs Breloom its Poison Heal and its Facade. Cofagrigus and Trevenant wear
Shadow Tag, which does nothing here: a raid boss cannot be trapped, and nobody flees a
fight between players. Take either for the stats or not at all.

### Dynamax

- The holder grows the first time its HP falls under half: twice its HP, current and max,
  for its next three moves. Then it shrinks back with the share of HP it had.
- Every damaging move goes off as the Max Move of its type, and every status move as
  Max Guard. Never give the band to a pokemon whose value is its status moves: three
  casts of Max Guard replace its screens, heals and redirection.
- The Max Moves worth building for raise a stage on the user's whole side every cast:
  Steel gives Max Steelspike (+1 Defense), Fighting Max Knuckle (+1 Attack), Poison Max
  Ooze (+1 Special Attack), Ground Max Quake (+1 Special Defense) and Flying Max Airstream
  (+1 Speed). Three casts are +3, and a raid boss's clear only takes its own drops.
- Fire, Water, Ice and Rock set sun, rain, hail and sand. In a raid that sky covers only
  your own party, so an Ice move hails on your own five and any of the four replaces a
  teammate's sun.
- None of the rows below can Gigantamax. The G-Max Moves worth a slot are G-Max Resonance
  (Lapras, Aurora Veil on the side), G-Max Finale (Alcremie, heals the side 1/6), G-Max
  Sweetness (Appletun, cures the side's statuses), and G-Max Vine Lash, Wildfire, Cannonade
  and Volcalith (Venusaur, Charizard, Blastoise, Coalossal), which take 1/6 a turn for four
  turns from every foe not of their type. Against a raid boss those four are one more
  clock under the shared allowance.

### Tera

- The holder Terastallizes as it takes the field and stays so for the fight.
- A Tera type that is one of its own types lifts that type's moves from 1.5x to 2x (2.25x
  with Adaptability) for the whole fight, a flat 1.33x. Its other type keeps 1.5x.
- It is hit as its Tera type alone, so the Tera type also decides its weaknesses.
- A catch's Tera type is usually one of its own types. Fifty Tera Shards of a type change
  it, and Tera raids pay them.

### Z-Moves

A type crystal turns one damaging move into a Z-Move of 100 to 200 power, once a side.
On a status move of its type it pays a Z-effect instead, at most a stage, a heal or a
clear, and spends the side's Z-Move on whichever matching move goes out first. On these
teams every attacker already holds a stone, a shard, a band or an orb, so only the
backup Mew holds a crystal: Mewnium Z turns its Psychic into Genesis Supernova, 185 power
and Psychic Terrain.

### Worn shapes

A form item is a held item that decides which shape its holder fights in
([`forms.ts`](../src/battle/items/forms.ts)). It is not a Mega. It costs an item slot and
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

Seventeen true shadows are the Articuno, Zapdos, Moltres, Mewtwo, Raikou, Entei, Suicune,
Lugia, Ho-Oh, Regirock, Regice, Registeel, Latias, Latios, Kyogre, Groudon and Rayquaza of
the dark: XD-144 to XD-146, XD-150, XD-243 to XD-245, XD-249, XD-250 and XD-377 to XD-384
([`true-shadows.yaml`](../src/data/species/true-shadows.yaml)). Each copies its
counterpart and adds 10 to every stat, and each carries Shadow permanently.

- They are only found under a dark day, in the special band of the wild pool and in
  shadow lairs.
- A Purifying Gem refuses one.
- A true shadow takes only the worn shapes drawn in its own colours: XD-382 and XD-383
  revert to their Primals with the orb, and XD-384 Mega Evolves through Dragon Ascent.
  No Mega Stone fits any of them, so XD-150 never Mega Evolves.
- A true shadow can still hold a Dynamax Band or a Tera Orb.
- XD-150 hits hardest of the first nine, at about 205 effective Special Attack. XD-250 is
  the physical one, at about 175 effective Attack. The three birds, XD-245 and XD-249 are
  not worth it, because Shadow taxes the bulk they are built on.

### Mythicals

Nineteen families sit in the mythical band: Mew, Celebi, Jirachi, Deoxys, Manaphy,
Darkrai, Shaymin, Arceus, Victini, Keldeo, Meloetta, Genesect, Diancie, Hoopa, Volcanion,
Magearna, Marshadow, Zeraora and Meltan.

- Each is called by one relic, which is dug up from the item pool and spent when the raid
  starts ([`raid-items.ts`](../src/data/items/raid-items.ts)).
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

| Role | Pokemon | Nature | EV priority | Shadow? | Held change | Abilities (4) | Moves, priority four in bold | Items, priority first |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Field control | **Whimsicott** 60/67/85/77/75/116 | Timid | 252 Speed, 248 HP | No | None | Spore Drift, Prankster, Magic Bounce, Infiltrator | **Taunt, Encore, Cotton Spore, Tailwind**, then Stun Spore, Charm, Moonblast, Substitute | **Focus Sash**, Leftovers, Bright Powder, Clear Amulet, Lax Incense, Mental Herb, Shell Bell, Quick Claw |
| Redirector | **Togekiss** 85/50/95/120/115/80 | Calm | 252 HP, 248 Special Defense | No | **Dynamax** | Fair Share, Serene Grace, Friend Guard, Super Luck | **Follow Me, Air Slash, Roost, Thunder Wave**, then Life Dew, Dazzling Gleam, Wish, Light Screen | **Dynamax Band**, Rocky Helmet, Leftovers, Bright Powder, Lax Incense, Shell Bell, Light Clay, Focus Band |
| Protector and healer | **Clefable** 95/70/73/95/90/60 | Bold | 252 HP, 248 Defense | No | None | Wishing Well, Magic Guard, Unaware, Friend Guard | **Reflect, Light Screen, Life Dew, Moonblast**, then Soft-Boiled, Encore, Charm, Thunder Wave | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
| Core, spread damage | **Hydreigon** 92/105/90/125/90/98 | Modest | 252 Special Attack, 248 Speed | **Yes** | **Zenith** | Three Heads, Levitate, Berserk, Pressure | **Dragon Pulse, Dark Pulse, Flamethrower, Nasty Plot**, then Draco Meteor, Earth Power, Flash Cannon, Protect | **Hydreigon Zenith Shard**, White Herb, Expert Belt, Leftovers, Wise Glasses, Focus Sash, Shell Bell, Wide Lens |
| Core, setup sweeper | **Dragonite** 91/134/95/100/100/80 | Adamant | 252 Attack, 248 Speed | Only if healed | **Tera** Dragon | Serene Storm, Multiscale, Marvel Scale, Inner Focus | **Dragon Dance, Dragon Claw, Fire Punch, Roost**, then Iron Head, Thunder Punch, Waterfall, Substitute | **Tera Orb**, Protective Pads, Leftovers, Expert Belt, Muscle Band, Shell Bell, Focus Sash, Wide Lens |
| Core, immediate damage | **Metagross** 80/135/130/95/90/70 | Adamant | 252 Attack, 248 HP | **Yes**, first pick | **Mega** | Hive Mind, Steelworker, Clear Body, Levitate | **Meteor Mash, Bullet Punch, Zen Headbutt, Ice Punch**, then Iron Head, Hammer Arm, Rock Slide, Protect | **Metagrossite**, Expert Belt, Wide Lens, Muscle Band, Leftovers, Shell Bell, Scope Lens, Protective Pads |
| | | | | | | | | |
| Field control, backup | **Klefki** 57/80/91/80/87/75 | Bold | 252 HP, 248 Defense | No | None | Keyring, Prankster, Levitate, Magician | **Thunder Wave, Reflect, Light Screen, Spikes**, then Dazzling Gleam, Safeguard, Foul Play, Protect | **Light Clay**, Leftovers, Bright Powder, Lax Incense, Shell Bell, Focus Band, Mental Herb, Quick Claw |
| Redirector, backup | **Amoonguss** 114/85/70/85/80/30 | Bold | 252 HP, 248 Defense | No | **Dynamax** | Sporeburst, Regenerator, Effect Spore, Overcoat | **Rage Powder, Spore, Giga Drain, Sludge Bomb**, then Synthesis, Protect, Toxic, Substitute | **Dynamax Band**, Leftovers, Rocky Helmet, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb |
| Protector and healer, backup | **Ribombee** 60/55/60/95/70/124 | Timid | 252 Speed, 248 HP | No | None | Honey Share, Friend Guard, Sweet Veil, Shield Dust | **Pollen Puff, Tailwind, Stun Spore, Light Screen**, then Reflect, Aromatherapy, Quiver Dance, Protect | **Light Clay**, Leftovers, Bright Powder, Focus Sash, Shell Bell, Lax Incense, Mental Herb, Quick Claw |
| Core, spread damage, backup | **Primarina** 80/74/74/126/116/60 | Modest | 252 Special Attack, 248 HP | **Yes** | **Zenith** | Aria Audience, Liquid Voice, Torrent, Hydration | **Hyper Voice, Moonblast, Ice Beam, Encore**, then Scald, Helping Hand, Light Screen, Protect | **Primarina Zenith Shard**, Throat Spray, Wise Glasses, Leftovers, Expert Belt, Shell Bell, Bright Powder, Focus Sash |
| Core, setup sweeper, backup | **Aegislash** 60/50/140/50/140/60 | Adamant | 252 Attack, 248 HP | No, the shield stance is half its value | **Tera** Steel | Turn the Blade, Stance Change, Clear Body, Cursed Body | **Swords Dance, Iron Head, Sacred Sword, King's Shield**, then Shadow Ball, Flash Cannon, Substitute, Protect | **Tera Orb**, Leftovers, Expert Belt, Muscle Band, Shell Bell, Wide Lens, Scope Lens, Focus Band |
| Core, immediate damage, backup | **Tyrantrum** 82/121/119/69/59/71 | Adamant | 252 Attack, 248 HP | **Yes** | None | Jaw Snap, Strong Jaw, Rock Head, Intimidate | **Crunch, Iron Head, Stone Edge, Dragon Claw**, then Head Smash, Rock Slide, Superpower, Protect | **Expert Belt**, Muscle Band, Leftovers, Shell Bell, Wide Lens, Scope Lens, Protective Pads, Focus Band |

Notes.

- Zenith Hydreigon is 160 Special Attack and 143 Speed, and Mega Launcher lifts Dark Pulse
  and Dragon Pulse 1.5x. Dragon Pulse takes Draco Meteor's place in the first four: 85
  power at 1.5x with no drop, on 10 PP to Draco Meteor's 5.
- Togekiss holds the Dynamax Band because doubled HP under half keeps the redirector
  standing. Air Slash becomes Max Airstream, +1 Speed to all six a cast. Follow Me is Max
  Guard while it is grown, so it redirects only from the cast before.
- Tera Dragon gives Dragonite's Dragon Claw 2x. Pure Dragon takes Ice at 2x rather than
  4x, and gives up the Ground immunity.
- A backup takes the held change of the main it replaces. Tyrantrum has neither a Mega nor
  a free Zenith, so fielding it leaves the team without a Mega. Primarina wants the Zenith
  more than Hydreigon does: Water Bubble doubles a spread Hyper Voice on 166 Special
  Attack.
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

| Role | Pokemon | Nature | EV priority | Shadow? | Held change | Abilities (4) | Moves, priority four in bold | Items, priority first |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Field control | **Tornadus** 79/115/70/125/80/111 | Timid | 252 Special Attack, 248 Speed | **Yes** | **Dynamax** | Windfall, Prankster, Defiant, Wind Rider | **Tailwind, Taunt, Hurricane, Heat Wave**, then Air Slash, Knock Off, Nasty Plot, U-turn | **Dynamax Band**, Wide Lens, Leftovers, Expert Belt, Wise Glasses, Focus Sash, Zoom Lens, Bright Powder |
| Protector and healer | **Latias** 80/80/90/110/130/110 | Calm | 252 HP, 248 Special Defense | No | None | Eon Shield, Levitate, Healer, Multiscale | **Wish, Heal Pulse, Reflect, Light Screen**, then Recover, Dragon Pulse, Tailwind, Helping Hand | **Soul Dew**, Light Clay, Leftovers, Shell Bell, Bright Powder, Focus Sash, Lax Incense, Wide Lens |
| Redirector | **Togekiss** 85/50/95/120/115/80 | Calm | 252 HP, 248 Special Defense | No | **Zenith** | Fair Share, Serene Grace, Friend Guard, Super Luck | **Follow Me, Air Slash, Roost, Thunder Wave**, then Life Dew, Hyper Voice, Wish, Light Screen | **Togekiss Zenith Shard**, Rocky Helmet, Leftovers, Bright Powder, Lax Incense, Shell Bell, Light Clay, Focus Band |
| Core, special | **XD-150** 116/120/100/164/100/140 | Timid | 252 Special Attack, 248 Speed | Always, it is one by nature | **Tera** Psychic | Genetic Apex, Magic Guard, Pressure, Unnerve | **Calm Mind, Psystrike, Aura Sphere, Ice Beam**, then Recover, Thunderbolt, Shadow Ball, Taunt | **Tera Orb**, Focus Sash, Expert Belt, Leftovers, Wise Glasses, Shell Bell, Scope Lens, Bright Powder |
| Core, physical | **Rayquaza** 105/150/90/150/90/95 | Adamant | 252 Attack, 248 Speed | Yes, but walk its friendship up first | **Mega**, through Dragon Ascent | Primal Sky, Multiscale, Intimidate, Air Lock | **Dragon Dance, Dragon Ascent, Extreme Speed, Dragon Claw**, then Iron Head, Stone Edge, Waterfall, Protect | **Protective Pads**, Leftovers, Muscle Band, Expert Belt, Shell Bell, Focus Sash, Scope Lens, Wide Lens |
| Second protector | **Clefable** 95/70/73/95/90/60 | Bold | 252 HP, 248 Defense | No | None | Wishing Well, Magic Guard, Unaware, Friend Guard | **Reflect, Light Screen, Life Dew, Moonblast**, then Soft-Boiled, Encore, Charm, Thunder Wave | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
| | | | | | | | | |
| Field control, backup | **Whimsicott** 60/67/85/77/75/116 | Timid | 252 Speed, 248 HP | No | None | Spore Drift, Prankster, Magic Bounce, Infiltrator | **Taunt, Encore, Cotton Spore, Tailwind**, then Stun Spore, Charm, Moonblast, Substitute | **Focus Sash**, Leftovers, Bright Powder, Clear Amulet, Lax Incense, Mental Herb, Shell Bell, Quick Claw |
| Protector and healer, backup | **Florges** 78/65/68/112/154/75 | Calm | 252 HP, 248 Special Defense | Never, Hothouse shares its Special Defense | None | Hothouse, Flower Veil, Unaware, Symbiosis | **Wish, Heal Bell, Aromatherapy, Moonblast**, then Light Screen, Safeguard, Helping Hand, Protect | **Leftovers**, Light Clay, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| Redirector, backup | **Clefable** 95/70/73/95/90/60 | Bold | 252 HP, 248 Defense | No | None | Wishing Well, Magic Guard, Unaware, Friend Guard | **Follow Me, Life Dew, Reflect, Light Screen**, then Soft-Boiled, Moonblast, Encore, Charm | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
| Core, special, backup | **Mewtwo** 106/110/90/154/90/130 | Timid | 252 Special Attack, 248 Speed | **Yes** | **Tera** Psychic | Genetic Apex, Magic Guard, Pressure, Unnerve | **Calm Mind, Psystrike, Aura Sphere, Ice Beam**, then Recover, Thunderbolt, Shadow Ball, Taunt | **Tera Orb**, Expert Belt, Leftovers, Wise Glasses, Focus Sash, Shell Bell, Scope Lens, Bright Powder |
| Core, physical, backup | **Zacian** 92/150/115/80/115/148 crowned | Adamant | 252 Attack, 248 Speed | **Yes** | None | Sworn Blade, Intrepid Sword, Sharpness, Justified | **Swords Dance, Iron Head, Sacred Sword, Play Rough**, then Close Combat, Psycho Cut, Quick Attack, Protect | **Rusted Sword**, Muscle Band, Expert Belt, Leftovers, Shell Bell, Scope Lens, Wide Lens, Focus Sash |
| Second protector, backup | **Goodra** 90/100/70/110/150/80 | Calm | 252 HP, 248 Special Defense | No, its 150 Special Defense is the point | None | Seepage, Sap Sipper, Hydration, Water Absorb | **Draco Meteor, Thunderbolt, Protect, Toxic**, then Flamethrower, Ice Beam, Sludge Bomb, Substitute | **Leftovers**, Shell Bell, Bright Powder, Wise Glasses, Expert Belt, Focus Band, Lax Incense, Wide Lens |

Notes.

- Zenith Togekiss has 113/133 defences and 121 Speed. Hyper Voice takes Dazzling Gleam's
  place in its back four, so Pixilate has something to turn. None of the other main slots
  can take the Zenith: Latias, Clefable and XD-150's counterpart have Megas, and Tornadus's
  shape is the Reveal Glass's.
- Dynamaxed, Tornadus's Hurricane becomes Max Airstream, +1 Speed to all six a cast, and
  Heat Wave Max Flare. Tailwind and Taunt are Max Guard for those three casts.
- Tera Psychic gives XD-150's Psystrike 2x for the whole fight. A true shadow cannot Mega
  Evolve, but nothing stops it Terastallizing.
- Goodra's Zenith wears Drizzle, whose rain halves Tornadus's Heat Wave, so Goodra stays
  plain.
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

| Role | Pokemon | Nature | EV priority | Shadow? | Held change | Abilities (4) | Moves, priority four in bold | Items, priority first |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Field control | **Whimsicott** 60/67/85/77/75/116 | Timid | 252 Speed, 248 HP | No | None | Spore Drift, Prankster, Magic Bounce, Infiltrator | **Taunt, Encore, Cotton Spore, Tailwind**, then Stun Spore, Charm, Moonblast, Substitute | **Focus Sash**, Leftovers, Bright Powder, Clear Amulet, Lax Incense, Mental Herb, Shell Bell, Quick Claw |
| Redirector | **Togekiss** 85/50/95/120/115/80 | Calm | 252 HP, 248 Special Defense | No | **Dynamax** | Fair Share, Serene Grace, Friend Guard, Super Luck | **Follow Me, Air Slash, Roost, Thunder Wave**, then Life Dew, Dazzling Gleam, Wish, Light Screen | **Dynamax Band**, Rocky Helmet, Leftovers, Bright Powder, Lax Incense, Shell Bell, Light Clay, Focus Band |
| Protector and healer | **Jirachi** 100/100/100/100/100/100 | Calm | 252 HP, 248 Special Defense | Never, no mythical can be shadowed | **Zenith** | Seven Wishes, Magic Bounce, Levitate, Healer | **Wish, Life Dew, Reflect, Light Screen**, then Helping Hand, Cosmic Power, Toxic, Protect | **Jirachi Zenith Shard**, Light Clay, Leftovers, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb |
| Cleric and second protector | **Celebi** 100/100/100/100/100/100 | Calm | 252 HP, 248 Special Defense | Never, no mythical can be shadowed | None | Timeline Split, Healer, Anticipation, Natural Cure | **Heal Bell, Recover, Leech Seed, Light Screen**, then Life Dew, Giga Drain, Reflect, Protect | **Big Root**, Leftovers, Light Clay, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb |
| Core, special | **Arceus** 120/120/120/120/120/120 | Modest | 252 Special Attack, 248 HP | Never, no mythical can be shadowed | None | Firstlight, Multitype, Adaptability, Filter | **Judgment, Calm Mind, Recover, Thunder Wave**, then Ice Beam, Flamethrower, Earth Power, Protect | **Pixie Plate**, Leftovers, Wise Glasses, Expert Belt, Shell Bell, Bright Powder, Focus Sash, Wide Lens |
| Core, second attacker | **Hoopa Unbound** 80/160/60/170/130/80 | Modest | 252 Special Attack, 248 HP | Never, no mythical can be shadowed | **Tera** Dark | Ringback, Prankster, Levitate, Trace | **Nasty Plot, Hyperspace Hole, Dark Pulse, Thunder Wave**, then Psyshock, Focus Blast, Taunt, Substitute | **Tera Orb**, Prison Bottle, Life Orb, Leftovers, Wise Glasses, Black Glasses, Shell Bell, Focus Sash |
| | | | | | | | | |
| Field control, backup | **Darkrai** 70/90/90/135/90/125 | Timid | 252 Special Attack, 248 Speed | Never, no mythical can be shadowed | **Mega** | Waxing Dark, Prankster, Bad Dreams, Infiltrator | **Taunt, Thunder Wave, Nasty Plot, Dark Pulse**, then Will-O-Wisp, Dark Void, Substitute, Protect | **Darkranite**, Focus Sash, Black Glasses, Leftovers, Wide Lens, Bright Powder, Lax Incense, Shell Bell |
| Redirector, backup | **Clefable** 95/70/73/95/90/60 | Bold | 252 HP, 248 Defense | No | None | Wishing Well, Magic Guard, Unaware, Friend Guard | **Follow Me, Life Dew, Reflect, Light Screen**, then Soft-Boiled, Moonblast, Encore, Charm | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
| Protector and healer, backup | **Manaphy** 100/100/100/100/100/100 | Calm | 252 HP, 248 Special Defense | Never, no mythical can be shadowed | None | Heartcurrent, Friend Guard, Healer, Water Absorb | **Reflect, Light Screen, Aqua Ring, Helping Hand**, then Tail Glow, Surf, Ice Beam, Protect | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| Cleric, backup | **Meloetta** 100/77/77/128/128/90 | Calm | 252 HP, 248 Special Defense | Never, no mythical can be shadowed | None | Countertune, Healer, Serene Grace, Soundproof | **Heal Bell, Light Screen, Thunder Wave, Psychic**, then Charm, Fake Tears, Helping Hand, Protect | **Leftovers**, Light Clay, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| Core, special, backup | **Mew** 100/100/100/100/100/100 | Modest | 252 Special Attack, 248 Speed | Never, no mythical can be shadowed | **Z-Move** | Ancestral Memory, Protean, Adaptability, Trace | **Nasty Plot, Aura Sphere, Psychic, Soft-Boiled**, then Taunt, Tailwind, Thunder Wave, Protect | **Mewnium Z**, Wise Glasses, Leftovers, Focus Sash, Shell Bell, Bright Powder, Lax Incense, Wide Lens |
| Core, second attacker, backup | **Keldeo** 91/72/90/129/90/108 | Timid | 252 Special Attack, 248 Speed | Never, no mythical can be shadowed | **Tera** Water | Tide Vigil, Justified, Analytic, Swift Swim | **Secret Sword, Hydro Pump, Calm Mind, Taunt**, then Scald, Icy Wind, Substitute, Protect | **Tera Orb**, Mystic Water, Leftovers, Wise Glasses, Expert Belt, Shell Bell, Focus Sash, Bright Powder |

Notes.

- None of the six main slots has a Mega. Field Darkrai with its Darkranite to give the
  team one: 165 Special Attack on 130/130 defences, and Dark Aura lifts its Dark Pulse and
  Hoopa's 1.33x.
- Zenith Jirachi wears Comatose, so no status lands on the protector, on 125 in both
  defences and 125 Speed.
- Togekiss holds the Dynamax Band for the same reasons as on the team without
  legendaries.
- Tera Dark gives Hoopa's Dark Pulse 2x, and pure Dark takes Bug at 2x rather than 4x. The
  Prison Bottle is a form item, so it does not block the orb.
- Arceus holds no change. Its Plate already decides its type, and a Terastallized Arceus
  is hit as its Tera type whatever the Plate says.
- Mew holds Mewnium Z, which turns its Psychic into Genesis Supernova, 185 power and
  Psychic Terrain, once a fight.
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

| Role | Pokemon | Nature | EV priority | Shadow? | Held change | Abilities (4) | Moves, priority four in bold | Items, priority first |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Burn, Curse, main special damage | **Chandelure** 60/55/90/145/90/80 | Modest | 252 Special Attack, 248 HP | No, it dies to the boss | **Mega** | Hexlight, Infiltrator, Flash Fire, Flame Body | **Will-O-Wisp, Curse, Hex, Fire Blast**, then Calm Mind, Shadow Ball, Substitute, Confuse Ray | **Chandelurite**, Wide Lens, Focus Sash, Expert Belt, Leftovers, Wise Glasses, Shell Bell, Bright Powder |
| Leech Seed and party multiplier | **Breloom** 60/130/80/60/60/70 | Adamant | 252 Attack, 248 HP | No, Mycelium needs it standing | **Zenith** | Mycelium, Poison Heal, Technician, Quick Feet | **Leech Seed, Drain Punch, Facade, Mach Punch**, then Seed Bomb, Swords Dance, Substitute, Sludge Bomb | **Breloom Zenith Shard**, Toxic Orb, Big Root, Expert Belt, Wide Lens, Muscle Band, Leftovers, Shell Bell |
| Toxic and per-action chip | **Magcargo** 60/50/120/90/80/30 | Bold | 252 HP, 248 Defense | No | None | Magma Trail, Flame Body, Solid Rock, Magma Armor | **Lava Plume, Fire Blast, Protect, Toxic**, then Earth Power, Rock Slide, Yawn, Rest | **Leftovers**, Rocky Helmet, Shell Bell, Wide Lens, Wise Glasses, Bright Powder, Focus Band, Light Clay |
| Primary physical damage | **Metagross** 80/135/130/95/90/70 | Adamant | 252 Attack, 248 HP | **Yes**, first pick | **Dynamax** | Hive Mind, Steelworker, Clear Body, Levitate | **Meteor Mash, Bullet Punch, Iron Head, Hammer Arm**, then Zen Headbutt, Agility, Iron Defense, Substitute | **Dynamax Band**, Expert Belt, Wide Lens, Muscle Band, Leftovers, Shell Bell, Scope Lens, Protective Pads |
| Protector and passive healer | **Clefable** 95/70/73/95/90/60 | Bold | 252 HP, 248 Defense | No | None | Wishing Well, Magic Guard, Unaware, Friend Guard | **Reflect, Light Screen, Life Dew, Toxic**, then Thunder Wave, Charm, Soft-Boiled, Protect | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
| Cleric and damage support | **Florges** 78/65/68/112/154/75 | Calm | 252 HP, 248 Special Defense | Never, Hothouse shares its Special Defense | None | Hothouse, Flower Veil, Unaware, Symbiosis | **Wish, Heal Bell, Aromatherapy, Moonblast**, then Light Screen, Safeguard, Helping Hand, Protect | **Leftovers**, Light Clay, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| | | | | | | | | |
| Burn and special damage, backup | **Cofagrigus** 58/50/145/95/105/30 | Modest | 252 HP, 248 Special Attack | No, its 145/105 defences are the point | None | Death Mask, Mummy, Cursed Body, Pressure | **Will-O-Wisp, Hex, Curse, Shadow Ball**, then Toxic, Nasty Plot, Pain Split, Protect | **Leftovers**, Expert Belt, Wise Glasses, Shell Bell, Light Clay, Bright Powder, Focus Band, Wide Lens |
| Leech Seed, backup | **Trevenant** 85/110/76/65/82/56 | Adamant | 252 Attack, 248 HP | No | None | Undergrowth, Harvest, Natural Cure, Frisk | **Leech Seed, Will-O-Wisp, Horn Leech, Wood Hammer**, then Shadow Ball, Protect, Toxic, Substitute | **Leftovers**, Big Root, Expert Belt, Muscle Band, Shell Bell, Rocky Helmet, Wide Lens, Focus Band |
| Toxic carrier, backup | **Amoonguss** 114/85/70/85/80/30 | Bold | 252 HP, 248 Defense | No | None | Sporeburst, Regenerator, Effect Spore, Overcoat | **Toxic, Sludge Bomb, Giga Drain, Protect**, then Synthesis, Rage Powder, Substitute, Seed Bomb | **Leftovers**, Rocky Helmet, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Light Clay |
| Primary physical damage, backup | **Aegislash** 60/50/140/50/140/60 | Adamant | 252 Attack, 248 HP | No, the shield stance is half its value | **Dynamax** | Turn the Blade, Stance Change, Clear Body, Cursed Body | **Swords Dance, Iron Head, Sacred Sword, King's Shield**, then Shadow Ball, Flash Cannon, Substitute, Protect | **Dynamax Band**, Leftovers, Expert Belt, Muscle Band, Shell Bell, Wide Lens, Scope Lens, Focus Band |
| Protector, backup | **Carbink** 50/50/150/50/150/50 | Bold | 252 HP, 248 Defense | Never, it is nothing but defences | None | Crystal Growth, Clear Body, Sturdy, Levitate | **Reflect, Light Screen, Moonblast, Safeguard**, then Calm Mind, Power Gem, Protect, Rest | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| Cleric, backup | **Blissey** 255/10/10/75/135/55 | Calm | 252 Defense, 248 Special Defense | Never | None | Cushioned, Healer, Friend Guard, Serene Grace | **Life Dew, Soft-Boiled, Heal Pulse, Helping Hand**, then Safeguard, Light Screen, Reflect, Protect | **Leftovers**, Light Clay, Bright Powder, Shell Bell, Focus Band, Lax Incense, Mental Herb, Quick Claw |

Clocks: burn and Curse from Chandelure, Leech Seed from Breloom, Toxic and paralysis from
Clefable, and Magma Trail from Magcargo.

Notes.

- Mega Chandelure is 175 Special Attack, and 110 in each defence on the row that used to
  die to the boss.
- Zenith Breloom is 161 Attack and 114 Speed, and Iron Fist lifts Drain Punch and Mach
  Punch 1.2x.
- Metagross holds the Dynamax Band. Doubled HP comes once the boss drives it under half,
  and its Steel and Fighting moves become Max Steelspike (+1 Defense) and Max Knuckle (+1
  Attack) to all six a cast. Its moves are set for that: Ice Punch would become Max
  Hailstorm and hail on your own five, and Rock Slide Max Rockfall and sand.
- Nobody holds the Tera Orb. The three attackers hold the other changes, and the rest are
  worth their status moves.
- Mega Metagross is still the pick against a boss you cannot out-damage. Then the band has
  no attacker to go to, since Breloom holds the shard. Zenith Blissey, fielded, keeps the
  boss's status off your grounded five, but it also refuses Breloom's Toxic Orb poison, so
  move the shard from Breloom to Blissey when you field it.
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

| Role | Pokemon | Nature | EV priority | Shadow? | Held change | Abilities (4) | Moves, priority four in bold | Items, priority first |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Burn, Curse, special damage | **Chandelure** 60/55/90/145/90/80 | Modest | 252 Special Attack, 248 HP | No, it dies to the boss | **Mega** | Hexlight, Infiltrator, Flash Fire, Flame Body | **Will-O-Wisp, Curse, Hex, Fire Blast**, then Calm Mind, Shadow Ball, Substitute, Confuse Ray | **Chandelurite**, Wide Lens, Focus Sash, Expert Belt, Leftovers, Wise Glasses, Shell Bell, Bright Powder |
| Sun setter, per-action clock, sweeper | **Volcarona** 85/60/65/135/105/100 | Modest | 252 Special Attack, 248 HP | No, Quiver Dance needs it alive | **Zenith** | Ember Halo, Drought, Magic Guard, Flame Body | **Quiver Dance, Fiery Dance, Bug Buzz, Roost**, then Heat Wave, Flamethrower, Giga Drain, Substitute | **Volcarona Zenith Shard**, Leftovers, Expert Belt, Wise Glasses, Shell Bell, Focus Sash, Bright Powder, Wide Lens |
| Primary physical damage | **Metagross** 80/135/130/95/90/70 | Adamant | 252 Attack, 248 HP | **Yes**, first pick | **Dynamax** | Hive Mind, Steelworker, Clear Body, Levitate | **Meteor Mash, Bullet Punch, Iron Head, Hammer Arm**, then Zen Headbutt, Agility, Iron Defense, Substitute | **Dynamax Band**, Expert Belt, Wide Lens, Muscle Band, Leftovers, Shell Bell, Scope Lens, Protective Pads |
| Leech Seed and party multiplier | **Breloom** 60/130/80/60/60/70 | Adamant | 252 Attack, 248 HP | No, Mycelium needs it standing | None | Mycelium, Poison Heal, Technician, Quick Feet | **Leech Seed, Drain Punch, Facade, Mach Punch**, then Seed Bomb, Swords Dance, Substitute, Sludge Bomb | **Toxic Orb**, Big Root, Expert Belt, Wide Lens, Muscle Band, Leftovers, Shell Bell, Protective Pads |
| Protector and healer | **Latias** 80/80/90/110/130/110 | Calm | 252 HP, 248 Special Defense | Never, Eon Shield stops when it falls | None | Eon Shield, Levitate, Healer, Multiscale | **Wish, Heal Pulse, Reflect, Light Screen**, then Recover, Helping Hand, Dragon Pulse, Protect | **Soul Dew**, Light Clay, Leftovers, Shell Bell, Bright Powder, Focus Sash, Lax Incense, Wide Lens |
| Second protector and Toxic clock | **Clefable** 95/70/73/95/90/60 | Bold | 252 HP, 248 Defense | No | None | Wishing Well, Magic Guard, Unaware, Friend Guard | **Toxic, Reflect, Light Screen, Life Dew**, then Thunder Wave, Charm, Soft-Boiled, Protect | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
| | | | | | | | | |
| Burn and special damage, backup | **Cofagrigus** 58/50/145/95/105/30 | Modest | 252 HP, 248 Special Attack | No, its 145/105 defences are the point | None | Death Mask, Mummy, Cursed Body, Pressure | **Will-O-Wisp, Hex, Curse, Shadow Ball**, then Toxic, Nasty Plot, Pain Split, Protect | **Leftovers**, Expert Belt, Wise Glasses, Shell Bell, Light Clay, Bright Powder, Focus Band, Wide Lens |
| Sun core, backup | **Heliolisk** 62/55/52/109/94/109 | Modest | 252 Special Attack, 248 Speed | **Yes** | **Zenith** | Backfeed, Dry Skin, Solar Power, Overcoat | **Thunderbolt, Thunder, Dark Pulse, Solar Beam**, then Discharge, Thunder Wave, Protect, Substitute | **Heliolisk Zenith Shard**, Expert Belt, Wise Glasses, Leftovers, Focus Sash, Shell Bell, Wide Lens, Bright Powder |
| Primary damage, conditional swap | **Heatran** 91/90/106/130/106/77 | Modest | 252 Special Attack, 248 HP | No | **Mega**, in Chandelure's place | Lavadome, Flash Fire, Flame Body, Magma Armor | **Lava Plume, Earth Power, Flamethrower, Protect**, then Magma Storm, Flash Cannon, Will-O-Wisp, Heat Wave | **Heatranite**, Expert Belt, Leftovers, Wise Glasses, Wide Lens, Shell Bell, Focus Sash, Bright Powder |
| Leech Seed, backup | **Trevenant** 85/110/76/65/82/56 | Adamant | 252 Attack, 248 HP | No | None | Undergrowth, Harvest, Natural Cure, Frisk | **Leech Seed, Will-O-Wisp, Horn Leech, Wood Hammer**, then Shadow Ball, Protect, Toxic, Substitute | **Leftovers**, Big Root, Expert Belt, Muscle Band, Shell Bell, Rocky Helmet, Wide Lens, Focus Band |
| Protector and healer, backup | **Florges** 78/65/68/112/154/75 | Calm | 252 HP, 248 Special Defense | Never, Hothouse shares its Special Defense | None | Hothouse, Flower Veil, Unaware, Symbiosis | **Wish, Heal Bell, Aromatherapy, Moonblast**, then Light Screen, Safeguard, Helping Hand, Protect | **Leftovers**, Light Clay, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| Second protector, backup | **Goodra** 90/100/70/110/150/80 | Calm | 252 HP, 248 Special Defense | No, its 150 Special Defense is the point | None | Seepage, Sap Sipper, Hydration, Water Absorb | **Draco Meteor, Thunderbolt, Protect, Toxic**, then Flamethrower, Ice Beam, Sludge Bomb, Substitute | **Leftovers**, Shell Bell, Bright Powder, Wise Glasses, Expert Belt, Focus Band, Lax Incense, Wide Lens |

Clocks: burn and Curse from Chandelure, Leech Seed from Breloom, Toxic and paralysis from
Clefable, and Ember Halo from Volcarona.

Notes.

- Zenith Volcarona wears Simple: each Quiver Dance is +2 Special Attack, Special Defense
  and Speed, on 160 Special Attack and 140 Speed. Zenith Heliolisk brings its own Drought,
  so it is the sun core backup that needs no Volcarona.
- Metagross holds the Dynamax Band as on the team without legendaries. When Metagross is
  the Mega instead, the band goes to Breloom, whose Drain Punch and Mach Punch become Max
  Knuckle.
- Keep Ice and Water moves off the Dynamax: they replace Drought's sun with hail or rain.
  Max Flare only resets the sun. Zenith Goodra brings rain, so Goodra stays plain.
- Drought gives every Fire move 1.5x. Morning Sun is egg-only on Volcarona, so Roost is
  the heal.
- Ember Halo is a second per-action clock beside Curse, and it needs no cast.
- Primal Groudon is the better sky. The Red Orb is a held item, not the Mega, so Groudon
  raises extreme sun that no ordinary setter can overwrite, Fire keeps its 1.5x, and the
  boss's Water damaging moves fail. Keep Volcarona instead when you want Ember Halo. Never
  pair Groudon with Mega Rayquaza.
- Heatran is the conditional swap. Lavadome gives the party 1.25x against a burned boss,
  the best multiplier here, but it is burn-locked and a third Fire body.
- Chandelure holds the stone by default. Move it to Latias (Latiasite) against a boss
  that is killing you, or to Metagross (Metagrossite) against one you cannot out-damage,
  and give Chandelure back its Zoom Lens. Mega Heatran, at 175 Special Attack and 141
  Special Defense, is the reason to field the conditional swap with its stone.

## Raids, with mythicals

Four damage clocks instead of five. The fifth slot buys Regalia, which gives the party +1
Defense every 10 seconds up to +3, and Seven Wishes, which heals all six a quarter of
their HP for no action.

| Role | Pokemon | Nature | EV priority | Shadow? | Held change | Abilities (4) | Moves, priority four in bold | Items, priority first |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Burn, Curse, main special damage | **Chandelure** 60/55/90/145/90/80 | Modest | 252 Special Attack, 248 HP | No, it dies to the boss | **Mega** | Hexlight, Infiltrator, Flash Fire, Flame Body | **Will-O-Wisp, Curse, Hex, Fire Blast**, then Calm Mind, Shadow Ball, Substitute, Confuse Ray | **Chandelurite**, Wide Lens, Focus Sash, Expert Belt, Leftovers, Wise Glasses, Shell Bell, Bright Powder |
| Leech Seed and party multiplier | **Breloom** 60/130/80/60/60/70 | Adamant | 252 Attack, 248 HP | No, Mycelium needs it standing | None | Mycelium, Poison Heal, Technician, Quick Feet | **Leech Seed, Drain Punch, Facade, Mach Punch**, then Seed Bomb, Swords Dance, Substitute, Sludge Bomb | **Toxic Orb**, Big Root, Expert Belt, Wide Lens, Muscle Band, Leftovers, Shell Bell, Protective Pads |
| Toxic, cleric and team Defense | **Diancie** 50/100/150/100/150/50 | Bold | 252 HP, 248 Defense | Never, no mythical can be shadowed | None | Regalia, Magic Bounce, Solid Rock, Clear Body | **Toxic, Heal Bell, Reflect, Light Screen**, then Charm, Fake Tears, Diamond Storm, Protect | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb, Quick Claw |
| Paralysis and flexible damage | **Arceus** 120/120/120/120/120/120 | Modest | 252 Special Attack, 248 HP | Never, no mythical can be shadowed | None | Firstlight, Multitype, Adaptability, Filter | **Judgment, Thunder Wave, Calm Mind, Recover**, then Will-O-Wisp, Toxic, Earth Power, Protect | **Pixie Plate**, Leftovers, Wise Glasses, Expert Belt, Shell Bell, Bright Powder, Focus Sash, Wide Lens |
| Party heal and screens | **Jirachi** 100/100/100/100/100/100 | Calm | 252 HP, 248 Special Defense | Never, no mythical can be shadowed | **Zenith** | Seven Wishes, Magic Bounce, Levitate, Healer | **Wish, Life Dew, Reflect, Light Screen**, then Helping Hand, Cosmic Power, Toxic, Protect | **Jirachi Zenith Shard**, Light Clay, Leftovers, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb |
| Primary physical damage | **Metagross** 80/135/130/95/90/70 | Adamant | 252 Attack, 248 HP | **Yes**, first pick | **Dynamax** | Hive Mind, Steelworker, Clear Body, Levitate | **Meteor Mash, Bullet Punch, Iron Head, Hammer Arm**, then Zen Headbutt, Agility, Iron Defense, Substitute | **Dynamax Band**, Expert Belt, Wide Lens, Muscle Band, Leftovers, Shell Bell, Scope Lens, Protective Pads |
| | | | | | | | | |
| Burn and special damage, backup | **Volcanion** 80/110/120/130/90/70 | Modest | 252 Special Attack, 248 HP | Never, no mythical can be shadowed | None | Boiler, Water Absorb, Flash Fire, Steam Engine | **Steam Eruption, Will-O-Wisp, Flamethrower, Protect**, then Hydro Pump, Earth Power, Haze, Substitute | **Charcoal**, Leftovers, Wise Glasses, Expert Belt, Shell Bell, Bright Powder, Safety Goggles, Wide Lens |
| Leech Seed and cleric, backup | **Celebi** 100/100/100/100/100/100 | Calm | 252 HP, 248 Special Defense | Never, no mythical can be shadowed | None | Timeline Split, Healer, Anticipation, Natural Cure | **Leech Seed, Heal Bell, Recover, Light Screen**, then Life Dew, Giga Drain, Toxic, Protect | **Big Root**, Leftovers, Light Clay, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb |
| Toxic and protector, backup | **Clefable** 95/70/73/95/90/60 | Bold | 252 HP, 248 Defense | No | None | Wishing Well, Magic Guard, Unaware, Friend Guard | **Reflect, Light Screen, Life Dew, Toxic**, then Thunder Wave, Charm, Soft-Boiled, Protect | **Light Clay**, Leftovers, Shell Bell, Bright Powder, Focus Band, Mental Herb, Lax Incense, Quick Claw |
| Paralysis and damage, backup | **Genesect** 71/120/95/120/95/99 | Modest | 252 Special Attack, 248 HP | Never, no mythical can be shadowed | None | Overclock, Download, Analytic, Adaptability | **Techno Blast, Thunder Wave, Flamethrower, Bug Buzz**, then Ice Beam, Thunderbolt, Flash Cannon, Protect | **Burn Drive**, Leftovers, Wise Glasses, Expert Belt, Shell Bell, Bright Powder, Wide Lens, Focus Sash |
| Party heal, backup | **Florges** 78/65/68/112/154/75 | Calm | 252 HP, 248 Special Defense | Never, Hothouse shares its Special Defense | **Zenith** | Hothouse, Flower Veil, Unaware, Symbiosis | **Wish, Heal Bell, Aromatherapy, Moonblast**, then Light Screen, Safeguard, Helping Hand, Protect | **Florges Zenith Shard**, Leftovers, Light Clay, Shell Bell, Bright Powder, Focus Band, Lax Incense, Mental Herb |
| Primary physical damage, backup | **Aegislash** 60/50/140/50/140/60 | Adamant | 252 Attack, 248 HP | No, the shield stance is half its value | **Dynamax** | Turn the Blade, Stance Change, Clear Body, Cursed Body | **Swords Dance, Iron Head, Sacred Sword, King's Shield**, then Shadow Ball, Flash Cannon, Substitute, Protect | **Dynamax Band**, Leftovers, Expert Belt, Muscle Band, Shell Bell, Wide Lens, Scope Lens, Focus Band |

Clocks: burn and Curse from Chandelure, Leech Seed from Breloom, Toxic from Diancie, and
paralysis from Arceus.

Notes.

- Chandelure holds the stone as on the team without legendaries. Mega Diancie trades 40
  in each defence for offence, which undoes what Diancie is here for.
- Zenith Jirachi wears Comatose, which keeps the boss's paralysis off the party healer, so
  Seven Wishes keeps its pace. Florges takes the shard when it replaces Jirachi. Zenith
  Celebi is the other party heal: its Grassy Terrain covers only your party and heals each
  grounded member 1/16 every time it acts.
- Metagross holds the Dynamax Band as on the team without legendaries, and its Max
  Steelspike Defense stacks with Regalia's.
- Nobody holds the Tera Orb. Arceus fights as its Plate's type, which the boss's weakness
  picks.
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
| Tera raid | Its own types: it is hit as its Tera type alone | Read every row above off the Tera type the lobby shows. A Fire Tera turns away the burn whatever its species |
| Max Raid | Twice the HP, and every move is a Max Move that drops your stages or lays a sky that covers everybody | Its status moves come out as Max Guard, so no Haze or Thunder Wave. Your own Dynamax's Max Steelspike and Max Knuckle win back the Defense and Attack its drops take. Crowned Zacian's Behemoth Blade and Crowned Zamazenta's Behemoth Bash hit it 2x |
| Max Raid with rain or hail | Max Geyser's rain halves the sun core's Fire, and Max Hailstorm chips your five | Take the team without the sun core, and lead the damage with Metagross and Breloom |

Never let one type carry both the status engine and the damage. A single rolled ability
takes out both at once.

## Shopping

A machine is stocked as `TM <move name>` and is spent on use, so two pokemon wanting
Protect need two machines. The costs below cover all twelve rows of a team, mains and
backups, so building the six alone costs roughly half. They were counted before the held
changes went into the rows: each change item pushed out the row's last item, and the Dynamax
Metagross rows swap Ice Punch and Rock Slide for Agility and Iron Defense, so the figures
are close but not exact.

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
So are the Zenith Shards, each buried only where its own line lives, the Z-Crystals, the
Dynamax Band, the Tera Orb, the Max Mushrooms and the Tera Shards. None of these are in
the costs above.
