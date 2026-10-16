# Generation 9 strategy

How Paldea, Kitakami and the Blueberry Academy go in, batch by batch, on top of `gen-9-data`. The Gen 8 plan this one follows is in [docs/strategy/gen-8.md](docs/strategy/gen-8.md).

## Where things stand

- **Batch 0 is done** on `gen-9-data`: the species, form and family ids, the 69 moves, the items and the reserved lairs. All 47 Gen 9 ability ids were already on `main`.
- **Gen 9 by PokeAPI:** 120 species (906 to 1025), 69 moves and 47 abilities.
- **Batch 1 is done** on `gen-9-moves`: the moves, every older species' Scarlet and Violet learnsets, and a picture for every signature move.
- **Batch 2 is done** on `paldea-scaffolding`: the Paldea region (dex 906 to 1025), `PALDEAN_FORMS`, and the sprite and candy keys.
- **Batches 3 to 10 are built** on `paldea-starters`, as one PR for Paldea's routes. Decided while building them:
  - Pawmo evolves once it has walked 1,000 steps as the buddy, counted on the catch's walked steps.
  - Tandemaus always grows into the family of four. The family of three waits for a way to roll it.
  - Gimmighoul and Gholdengo wait: the collection draws only the Roaming form, not the base Gimmighoul a line needs at its root.
  - Tadbulb, Bellibolt, Wiglett and Wugtrio are amphibious, so they are met on land despite their water egg groups.
- **Batches 11 and 12 are built** on `paldea-evolutions`. Dipplin evolves into Hydrapple at any level once it knows Dragon Cheer (a TM), and Kingambit at 60 holding a Leader's Crest, since the game cannot count defeated Bisharp. The Masterpiece Teacup waits with the Artisan forms.
- **Batches 13 to 17 are built** on `paldea-legends`, with Gimmighoul and Gholdengo from batch 10. Gimmighoul is drawn as its Roaming form and Miraidon in Low Power mode, through `STAND_INS`. Gholdengo costs 999 Gimmighoul candies, standing in for the 999 coins. The Paradox pokemon are prized finds rather than lair legends.
- **Batch 18 is built** on `paldea-terastal`. Decided while building: a Tera type shows as a type badge on the catch sheet and in a raid lobby, and a Tera raid pays 5 to 8 Tera Shards of the boss's Tera type on top of a raid's gold. A Tera raid boss is off its own types half the time, so every type's shards can be won.
- **Batches 19 and 20 are built** on `paldea-kitakami`. A worn shape's ability now follows the species change itself, so Teal Ogerpon wears Defiant with nothing in hand and Terapagos picks up Tera Shell through Tera Shift. Each sits on top of the catch's own ability, as an Origin forme's does. Okidogi, Stellar Terapagos and Teraform Zero wait for their art.
- **Lines waiting on Gen 9,** marked `awaiting: evolution`: Primeape (Annihilape), Girafarig (Farigiraf), Dunsparce (Dudunsparce), Applin (Dipplin), Duraludon (Archaludon) and Bisharp (Kingambit). Each mark comes off with its evolution.
  - Galarian Mr. Mime keeps its mark in `world/kanto/101-125.yaml`: Mr. Rime is still not drawn.
  - The ability audit is clean. None of these lines carries an invented filler, so their evolutions break no pool.
  - Bloodmoon Ursaluna is not in `PALDEAN_FORMS`. The collection files it beside Ursaluna, under Hisui.

## What SpriteCollab has

Only what the collection has built ships (`../SpriteCollab/compact`, checked against `GAPS.md`). Anything missing keeps its reserved id and waits for upstream.

Checked against the collection as of 12 October 2026: 102 of the 120 species are drawn.

- **Not drawn, so held back:**
  - whole families: Squawkabilly, Maschiff and Mabosstiff, Klawf, Bombirdier, Flamigo;
  - a first stage: Shroodle, so Grafaiai waits with it;
  - final stages: Brambleghast, Toedscruel, Rabsca and Espathra, so Bramblin, Toedscool, Rellor and Flittle ship as their line's end, marked `awaiting: evolution`;
  - legends: Wo-Chien, Chien-Pao, Brute Bonnet, Iron Jugulis, Okidogi, Iron Boulder and Iron Crown;
  - forms: Terapagos Stellar, Gimmighoul Chest, Dudunsparce Three-Segment, Squawkabilly's colours and Oinkologne's female.
- **Drawn short and filled out from the standing pose:** Tarountula, Dolliv, Grafaiai, Toedscool, Orthworm, Iron Treads, Ting-Lu, Gouging Fire, Raging Bolt and Pecharunt.
- **Forms drawn:** Paldean Tauros in all three breeds, Paldean Wooper, Bloodmoon Ursaluna, both Maushold, Palafin Hero, Tatsugiri's three, Gimmighoul Roaming, Ogerpon's four masks and their Terastal shapes, Terapagos Terastal, Koraidon, and Miraidon in its Low Power mode.
- **A gap is not a reason to rework a design.** A signature stays written for the whole line or group, so the missing member slots in the day it is drawn.

## The order

Same as Galar: ids, then moves, then the moves on older species, then each family where it is met, legends after the routes, the gimmick, and what needs the gimmick last. A batch is 3 to 5 families, or one legendary group.

| # | Batch | Families or content |
| --- | --- | --- |
| 0 | Ids | `gen-9-data`: species, form and family ids, the 69 move ids, the items, the reserved lairs and Pecharunt's relic |
| 1 | Gen 9 moves | Behaviour and pictures, every region's species taught them from SV's learnsets, release page |
| 2 | Scaffolding | `Paldea` region, `regions.yaml` rows, sprite import keys, form lists, the ability-pool audit, the `awaiting` marks |
| 3 | Starters | Sprigatito, Fuecoco, Quaxly |
| 4 | South Province | Lechonk, Tarountula, Nymble, Pawmi, Tandemaus |
| 5 | South Province | Fidough, Smoliv, Nacli, Charcadet |
| 6 | West Province | Tadbulb, Wattrel, Bramblin, Toedscool |
| 7 | East Province | Capsakid, Rellor, Flittle, Tinkatink, Wiglett |
| 8 | The coast and the roads | Finizen, Varoom, Cyclizar, Orthworm, Glimmet |
| 9 | North Province | Greavard, Cetoddle, Veluza, Dondozo, Tatsugiri |
| 10 | Glaseado and the treasure | Frigibax, Gimmighoul (Roaming) |
| 11 | New evolutions | Annihilape, Clodsire, Farigiraf, Dudunsparce, Kingambit, Dipplin and Hydrapple, Archaludon |
| 12 | Paldean and Kitakami forms | Paldean Tauros (three breeds), Paldean Wooper, Bloodmoon Ursaluna, Poltchageist and Sinistcha |
| 13 | Treasures of Ruin | Ting-Lu and Chi-Yu ship; Wo-Chien and Chien-Pao wait |
| 14 | Paradox, Ancient | Great Tusk, Scream Tail, Flutter Mane, Slither Wing, Sandy Shocks, Roaring Moon |
| 15 | Paradox, Ancient, later | Walking Wake, Gouging Fire, Raging Bolt; Brute Bonnet waits |
| 16 | Paradox, Future | Iron Treads, Iron Bundle, Iron Hands, Iron Moth, Iron Thorns, Iron Valiant, Iron Leaves; Iron Jugulis, Iron Boulder and Iron Crown wait |
| 17 | Koraidon and Miraidon | Miraidon drawn in its Low Power mode |
| 18 | Terastallization | The mechanic, Tera types, Tera Blast, the Tera Orb, Tera Shards, and Tera raids |
| 19 | Kitakami's legends | Munkidori and Fezandipiti (Okidogi waits), Ogerpon with its masks and Terastal shapes |
| 20 | Terapagos and Pecharunt | Terapagos with Tera Shell and Teraform Zero; Pecharunt is mythical, so it has a relic |

Routes follow Scarlet and Violet's order. The order of batches 4 to 10 may shift where a family's biome is written better beside another. Ogerpon and Terapagos come after Terastallization, because their forms are Terastal ones.

## What every batch does

1. **Branch** `paldea-<slug>`, stacked on the previous batch. Open a PR into that branch and link the stack with `gh stack link`, so a merged base never closes the rest.
2. **Species YAML** in the four field folders plus `text/en/species`, in a `paldea` folder each, in blocks of 25 dex numbers (`data-yaml`).
   - New forms follow `species-forms`.
   - A stage joining an older family takes that family's id (`family-ids`); a new family takes the next id at the end.
3. **Abilities from PokeAPI**, never from memory (`ability-pools`).
   - Count the pool by walking up the chain.
   - Propose fillers for any final stage short of four.
   - Build each mainline Gen 9 ability the batch needs, in a new `src/battle/abilities/gen-9.ts`, with a test.
4. **Signature ability, approved first.** Each family's concept goes to you before any of it is written (`signature-abilities`). Groups that share one frame:
   - the starters;
   - the Treasures of Ruin;
   - Koraidon and Miraidon;
   - the Loyal Three;
   - Ogerpon, with one shape of the frame per mask.

   Every Paradox pokemon gets a signature of its own, with no shared frame.
5. **Spawns** in `biome/pools/*.yaml` (`spawn-surfaces`). `spawn-balance.test.ts` must pass. A legendary batch takes its lairs off `reserved` and adds their wild spawns in the same change.
6. **Items** the batch's species need, in the same batch. Evolution items ship with the species that uses them, such as the Syrupy Apple, the Metal Alloy, the Unremarkable and Masterpiece Teacups, and the Leader's Crest.
7. **Sprites:** `pnpm import-sprites && pnpm compact-sprites`, plus the family candies.
8. **Text:** every description ends in a full stop (`registry-descriptions`). Run `pnpm id-names` after any enum change.
9. **Changeset**, `minor`, with one bullet per family. Then a section in the release page for the group of batches.
10. **Checks:** `pnpm test`, `pnpm exec tsc --noEmit`, and `rtk proxy pnpm exec oxlint src test`, read by its exit code.

A batch is done when all of that is green and a test asserts each new signature ability against real engine state.

## Signatures and fillers

Each concept is yours to decide (`signature-abilities`), family by family, along with the fillers. Anything that changes later is put to you again first.

- **Pools are PokeAPI's current lists**, walked up the chain.
- **Fillers** go in `hidden`, one per slot a final stage is short of four.

### Batch 3: the starters

**Approved, signatures and fillers.** The Scatter frame: each performer widens what one of its blows does.

| Family | Signature | Fillers |
| --- | --- | --- |
| Sprigatito | **Petal Scatter**: A Grass critical hit it lands splashes 1/4 of its damage onto every other enemy. | Meowscarada: Prankster, Magician |
| Fuecoco | **Spreading Flame**: A burn it inflicts with a Fire move also burns the other enemy lowest on HP. | Skeledirge: Punk Rock, Flash Fire |
| Quaxly | **Wake**: A Water move it lands drops the target's Speed 1 stage and every other enemy's by 1 as well, at most once every 8 seconds. | Quaquaval: Dancer, Quick Feet |

### Batch 4: South Province

**Approved, signatures and fillers.**

| Family | Signature | Fillers |
| --- | --- | --- |
| Lechonk | **Pig Out**: Each time it eats a Berry, it casts Stockpile on itself. | Male Oinkologne is full; female Oinkologne: Ripen |
| Tarountula | **Tripwire**: An enemy that takes the field mid-fight winds up its first move 50% slower. | Spidops: Compound Eyes, Battle Armor |
| Nymble | **Knockback**: Each contact move it lands pushes the target's current wind-up back 0.5 seconds. | Lokix: Sniper, Hustle |
| Pawmi | **Static Palms**: Its punching moves paralyse the target 20% of the time. | Pawmot is full |
| Tandemaus | **Scatter Brood**: Its multi-hit moves send each strike at a different standing enemy in turn. | Maushold is full |

### Batch 5: South Province, later

**Approved, signatures and fillers.** Charcadet's one signature covers both branches.

| Family | Signature | Fillers |
| --- | --- | --- |
| Fidough | **Fresh Batch**: Every 20 seconds it hands a Sitrus Berry to the teammate lowest on HP whose hands are empty. | Dachsbun is full |
| Smoliv | **Anoint**: Any heal it gives a teammate also cures that teammate's major status. | Arboliva: Grassy Surge |
| Nacli | **Brine Rebound**: A Water move landing on it makes it cast Salt Cure at whoever threw it, at most once every 10 seconds. | Garganacl: Water Absorb |
| Charcadet | **Kindling**: Each Fire move it lands makes its next move wind up 25% faster. | Armarouge: Magic Guard; Ceruledge: Sharpness |

### Batch 6: West Province

**Approved, signatures and fillers.** Brambleghast and Toedscruel are not drawn yet, so Bramblin and Toedscool ship as their line's end, carrying the signature and waiting for the fillers' stage.

| Family | Signature | Fillers |
| --- | --- | --- |
| Tadbulb | **Bubble Shock**: Its Electric moves hit 1.5x a target that a Water move has landed on in the last 4 seconds. | Bellibolt is full |
| Wattrel | **Lightning Dive**: Its Electric moves hit 1.3x while Tailwind blows on its side. | Kilowattrel: Gale Wings |
| Bramblin | **Windswept**: When a wind move lands on anybody, its own next move winds up 50% faster. | Brambleghast: Rough Skin, Levitate |
| Toedscool | **Mycelium Mat**: While it stands, each time Grassy Terrain heals one of its teammates it also cures one major status from them. Replaces Leech Tendril, which repeated Sweet Paw. | Toedscruel: Effect Spore, Overcoat, Liquid Ooze |

### Batch 7: East Province

**Approved, signatures and fillers.** Rabsca and Espathra are not drawn yet, so Rellor and Flittle ship as their line's end. Both finals already reach four.

| Family | Signature | Fillers |
| --- | --- | --- |
| Capsakid | **Heat Tolerance**: A burn heals it 1/8 of its HP each time it acts instead of hurting it, and does not halve its Attack. | Scovillain is full |
| Rellor | **Ball Toss**: When a teammate drops below 1/3 HP with empty hands, it hands them its own held item, once per fight. | Rabsca is full |
| Flittle | **Stare Down**: Each Psychic move it lands casts Taunt at the target, at most once every 10 seconds per target. | Espathra is full |
| Tinkatink | **Tinker**: The first time each teammate uses up its held item, it remakes it, once per teammate per battle. | Tinkaton: Sheer Force |
| Wiglett | **Sand Duck**: Ground moves aimed at it miss, and each one that does raises its Speed 1 stage. | Wugtrio: Sand Rush |

### Batch 8: the coast and the roads

**Approved, signatures and fillers.**

| Family | Signature | Fillers |
| --- | --- | --- |
| Finizen | **Lifeguard**: While it is above 1/2 HP, the first blow each fight that would knock out a teammate is taken by it instead, once per teammate per battle. | Palafin: Justified, Swift Swim |
| Varoom | **Redline**: Its moves wind up faster the lower its HP, from 0% at full to 30% near 0 HP. | Revavroom: Speed Boost |
| Cyclizar | **Shed Decoy**: The first time its HP drops below 1/2 each fight, it casts Substitute without paying the HP for it. | Stamina, Quick Feet |
| Orthworm | **Slag Trail**: Each Steel move it lands lays a layer of Spikes under the target's side, at most once every 10 seconds. | Sturdy, Heavy Metal |
| Glimmet | **Glimmering**: While it stands, every poisoned enemy winds up its moves 20% slower. | Glimmora: Poison Point, Solid Rock |

### Batches 9 and 10: North Province, Glaseado and the treasure

**Approved, signatures and fillers.** Dondozo and Tatsugiri are paired by Commander and share the shelter frame, each working on its own.

| Family | Signature | Fillers |
| --- | --- | --- |
| Greavard | **Grave Digger**: When a teammate faints holding an item and its own hands are empty, the item goes into its hands. | Houndstone: Cursed Body |
| Cetoddle | **Snow Hoard**: While snow or hail falls, it gains 1 stage of Attack every 4 seconds, up to +3 from this. | Cetitan is full |
| Veluza | **Fillet Thrift**: Moves that cost HP to use (Fillet Away, Substitute, Belly Drum, Shed Tail) cost it half. | Swift Swim, Telepathy |
| Dondozo | **Mouthful**: When a teammate drops below 1/3 HP, it swallows them: untargetable for 4 seconds and healing 1/4 of their HP, once per teammate per battle. | Thick Fat |
| Tatsugiri | **Back Seat Orders**: While it is untargetable, behind a Substitute or under its own Protect, each move a teammate lands hits 1.2x. Its own moves reach cover through Substitute and Protect, since it learns no move that hides it. | Swift Swim, Rattled |
| Frigibax | **Glaive Guard**: After a move that leaves it exposed (Glaive Rush, Outrage, a recharge), its Defense and Special Defense are +2 until it next acts. | Baxcalibur: Sharpness, Slush Rush |
| Gimmighoul | **Coin Scatter**: Each damaging move it lands scatters coins as Pay Day does, under Pay Day's own ceiling. | Gholdengo: Steelworker, Pickup |

### Batches 11 and 12: new evolutions and the regional lines

**Approved, signatures and fillers.**

- **New evolutions keep their family's signature,** all of which still read sensibly: Annihilape (Blind Rage), Farigiraf (Ambidextrous), Dudunsparce (Hidden Den), Kingambit (Honed), Dipplin and Hydrapple (Shared Harvest), Archaludon (Overhang).
- **Bloodmoon Ursaluna keeps the Teddiursa family's Sweet Paw,** as a lone regional stage, the way Alolan Raichu keeps Pikachu's.
- **Paldean Wooper and Paldean Tauros are regional all the way down,** so each line has a signature of its own.
- **Poltchageist is Sinistea's counterpart,** and complements Last Pour as the support half of the tea pair.

| Line | Signature | Fillers |
| --- | --- | --- |
| Paldean Wooper, Clodsire | **Bog Down**: An enemy that lands a Ground move on it cannot switch out for 6 seconds. | Clodsire: Damp |
| Paldean Tauros (all three breeds) | **Raging**: While its Attack is raised above +0, its moves wind up 20% faster. | Combat: Guts; Blaze: Flash Fire; Aqua: Swift Swim |
| Poltchageist, Sinistcha | **Tea Service**: Its healing moves aimed at a teammate wind up 40% faster. | Sinistcha: Cursed Body, Levitate |
| Bloodmoon Ursaluna | Sweet Paw, the family's | Keen Eye, Insomnia, Sniper |
| Annihilape, Farigiraf, Kingambit, Hydrapple, Archaludon | The family's | Full |
| Dudunsparce | The family's | Simple |

### Batches 13 and 17: the Treasures of Ruin, Koraidon and Miraidon

**Approved, signatures and fillers.**

- **The Treasures of Ruin: Stunted.** Each move one lands curses the target: for 6 seconds the target's stat matching its Ruin cannot rise, refreshed on each hit. One factory serves all four.
- **Koraidon and Miraidon: Full Throttle.** Each rides fastest in its own field. One factory serves both.

| Family | Signature | Fillers |
| --- | --- | --- |
| Wo-Chien | **Withered Tablets**: A target it lands a move on cannot raise its Attack for 6 seconds. | Sap Sipper, Liquid Ooze, Natural Cure |
| Chien-Pao | **Shattered Sword**: A target it lands a move on cannot raise its Defense for 6 seconds. | Sharpness, Ice Body, Slush Rush |
| Ting-Lu | **Cracked Vessel**: A target it lands a move on cannot raise its Special Attack for 6 seconds. | Sand Stream, Solid Rock, Stamina |
| Chi-Yu | **Scattered Beads**: A target it lands a move on cannot raise its Special Defense for 6 seconds. | Flash Fire, Levitate, Flame Body |
| Koraidon | **Sun Sprint**: While sun shines, its moves wind up 20% faster. | Tough Claws, Guts, Intimidate |
| Miraidon | **Drive Mode**: While Electric Terrain is up, its moves wind up 20% faster. | Levitate, Download, Transistor |

### Batches 14 to 16: the Paradox pokemon

**Approved, signatures and fillers.** Each has a signature of its own, with no shared frame. Each reaches only Protosynthesis or Quark Drive, so each takes three fillers.

| Pokemon | Signature | Fillers |
| --- | --- | --- |
| Great Tusk | **Headlong Guard**: The stat drops its own moves give it (Headlong Rush, Close Combat) are undone the next time it lands a contact move. | Rock Head, Sturdy, Sand Force |
| Scream Tail | **Shriek Speed**: Its sound moves wind up 30% faster. | Punk Rock, Competitive, Moody |
| Brute Bonnet | **Fungal Feast**: It heals 1/8 of its HP each time an enemy falls asleep, from any source. | Effect Spore, Strong Jaw, Guts |
| Flutter Mane | **Eerie Flutter**: A single-target move aimed at it has a 20% chance to go to a random standing teammate of the attacker instead, or to miss if the attacker stands alone. | Levitate, Infiltrator, Cursed Body |
| Slither Wing | **Ancient Cocoon**: The first time it drops below 1/3 HP each fight, it casts Quiver Dance on itself. | Flame Body, Swarm, Tinted Lens |
| Sandy Shocks | **Earth Current**: Its Electric moves hit Ground types for neutral damage instead of not at all. | Magnet Pull, Sand Force, Analytic |
| Roaring Moon | **Moon Howl**: As it takes the field, every enemy's next move winds up 30% slower. | Intimidate, Moxie, Tough Claws |
| Walking Wake | **Steam Surge**: While sun shines, its Water moves are not weakened by the sun and wind up 20% faster. | Swift Swim, Inner Focus, Water Absorb |
| Gouging Fire | **Molten Bulwark**: Each time one of its protect moves blocks a move, it heals 1/8 of its HP. | Flash Fire, Rock Head, Inner Focus |
| Raging Bolt | **Storm Cloud**: Each Electric move it lands has a 15% chance to lay Electric Terrain. | Volt Absorb, Inner Focus, Static |
| Iron Treads | **Track Laying**: Each Ground move it lands lays a layer of Stealth Rock under the target's side, at most once every 15 seconds. | Sturdy, Clear Body, Heavy Metal |
| Iron Bundle | **Ice Pack**: Its Ice moves aimed at a teammate heal that teammate 1/4 of their max HP instead of hurting them. | Vital Spirit, Ice Body, Swift Swim |
| Iron Hands | **Iron Grip**: A target it lands a punching move on cannot use protect moves for 4 seconds. | Iron Fist, Sheer Force, Guts |
| Iron Jugulis | **Searchlight**: Its moves hit a target that is mid-Fly, Dig, Dive, Bounce or Phantom Force. | Sniper, Infiltrator, Keen Eye |
| Iron Moth | **Toxic Exhaust**: Its Fire moves poison the target 20% of the time. | Levitate, Flame Body, Light Metal |
| Iron Thorns | **Sand Generator**: An Electric move landing on it whips up a sandstorm, at most once every 15 seconds. | Sand Stream, Motor Drive, Unnerve |
| Iron Valiant | **Afterimage**: For 1 second after it takes a hit, its next move winds up 40% faster. | Sharpness, Trace, Download |
| Iron Leaves | **Terrain Edge**: Its slicing moves hit 1.3x while any terrain is up. | Sharpness, Justified, Leaf Guard |
| Iron Boulder | **Rock Blade**: Its Rock moves count as slicing moves, so Sharpness's 1.5x reaches them. | Sharpness, Justified, Sturdy |
| Iron Crown | **Tachyon Edge**: Its slicing moves cannot miss and wind up 15% faster. | Sharpness, Justified, Clear Body |

### Batches 19 and 20: Kitakami's legends, Terapagos and Pecharunt

**Approved, signatures and fillers.**

- **The Loyal Three: Avenging Chain.** When a teammate faints, its next damaging move is sure to badly poison, with one more effect per member. One factory serves all three.
- **Ogerpon has no base ability.** It is always in one of its four masks, Teal included, so every mask's ability (Defiant, Water Absorb, Mold Breaker, Sturdy) is worn in battle by form, the way the Origin Formes wear theirs, and its pool is four fillers. Embody Aspect is worn by the Terastal shapes.
- **Terapagos's Tera Shift gates its shapes:** one born with a filler keeps its base shape. Tera Shell and Teraform Zero are worn by the Terastal and Stellar shapes.

| Pokemon | Signature | Fillers |
| --- | --- | --- |
| Okidogi | **Hound's Oath**: When a teammate faints, its next damaging move is sure to badly poison and is a critical hit. | Iron Fist, Guts |
| Munkidori | **Monkey's Oath**: When a teammate faints, its next damaging move is sure to badly poison and winds up 40% faster. | Pickpocket, Prankster |
| Fezandipiti | **Pheasant's Oath**: When a teammate faints, its next damaging move is sure to badly poison and strikes every enemy. | Keen Eye, Big Pecks |
| Ogerpon | **Mask Aura**: While it wears a mask, its teammates' moves of that mask's type hit 1.2x: Grass for Teal, Water for Wellspring, Fire for Hearthflame, Rock for Cornerstone. | Grass Pelt, Inner Focus, Leaf Guard, Sap Sipper |
| Terapagos | **Prismatic**: Its Normal moves become whichever type hits the target hardest, as they go off. | Analytic, Solid Rock, Shell Armor |
| Pecharunt | **Puppet Strings**: A confused enemy's single-target moves aimed at it go to one of that enemy's own teammates instead, if one stands. | Levitate, Cursed Body, Corrosion |

### Held back until SpriteCollab draws them

**Approved, signatures and fillers.** Each is written up now and ships in the batch its area belongs to once its sprite is built.

| Family | Signature | Fillers |
| --- | --- | --- |
| Squawkabilly | **Gang Up**: Its moves hit 1.3x a target a teammate has landed a move on in the last 2 seconds. | Keen Eye, shared by every plumage |
| Maschiff | **Snarl Reply**: A contact move landing on it makes it cast Snarl, at most once every 10 seconds. | Mabosstiff is full |
| Shroodle | **Pilfer Dash**: Each time it takes an item off someone, its next move winds up 50% faster. | Grafaiai is full |
| Klawf | **Snap Back**: A contact move landing on it makes it cast Crabhammer at the attacker, at most once every 8 seconds. | Hyper Cutter |
| Bombirdier | **Heavy Load**: While it holds an item, it takes 0.85x from every hit. | Sniper |
| Flamigo | **In Step**: Its moves wind up 20% faster while a teammate is winding up a move at the same time. | Dancer |

## Terastallization

Batch 18, built the way Megas, Z-Moves and Dynamax were: automatic, once per side, with nothing to press, so a player and the AI get it the same way. Decided:

- **The trigger.** A unit holding a **Tera Orb** Terastallizes as it takes the field. Only the first such unit on a side does, once a fight.
- **The Tera type.** Each catch has one, rolled at birth: usually one of its own types, rarely any type. It is kept on the catch row, and changed by spending 50 **Tera Shards** of the new type.
- **What it does,** as in the mainline:
  - When hit, it is only its Tera type.
  - It keeps its original types' 1.5x bonus and gains 1.5x on the Tera type. Where the Tera type is one of its own, that bonus is 2x, or 2.25x with Adaptability.
  - Its Tera-type moves under 60 power rise to 60, except multi-hit and priority moves.
  - It lasts the rest of the fight, through switching out.
- **Tera Blast** follows the Tera type once the user has Terastallized, and lands as a physical move where Attack is higher.
- **What it shares with the others.** A unit holding a Mega Stone, a Z-Crystal or a Dynamax Band never Terastallizes. A side's Mega, Z-Move, Dynamax and Terastallization are each once a fight.
- **Drawing it, proposed.** A Terastallized unit wears a crystal sheen in its Tera type's colour, with the Tera type's jewel floating over it the way a Mega's stone does. Stellar waits for its art.
- **Tera raids.** A new raid kind at a Tera crystal landmark, the way Max, Alpha and Noble raids stand: a Terastallized boss of the biome. Clearing one pays Tera Shards of the boss's Tera type. The landmark takes a share of rolls that were already landmarks, so nothing else on any map moves.

## Decided

- **Terastallization:** in, as batch 18, as above.
- **Tera raids:** in, with Terastallization.
- **Paradox signatures:** each its own.
- **Forms:** only what SpriteCollab has.
- **Paldea's trainers and gym leaders:** not yet.
- **Signatures and fillers:** approved family by family in [Signatures and fillers](#signatures-and-fillers), held-back lines included.

## Still to decide

- Nothing for Terastallization: both open questions were settled in batch 18.

## Pace

- **One group of batches per PR, stacked.** The groups are: the moves (1), Paldea's routes (3 to 10), the new evolutions and forms (11 and 12), the legends (13 to 17), Terastallization (18), and Kitakami's legends with Terapagos and Pecharunt (19 and 20).
- **Release pages:** one per group, each with a row in `docs/update.md`.
- **Batches 3 onward each wait on your signature approval,** so I propose the concepts for the next batch while the current one is in review.
