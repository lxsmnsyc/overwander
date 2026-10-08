# Generation 8 strategy

How Galar and Hisui go in, batch by batch, on top of `gen-8-data`.

## Where things stand

- **Batches 0 and 2 are merged.** `main` has the Gen 8 ids, the Galar and Hisui regions, the form lists and the ability-pool audit.
- **Batch 1 is merged except its release page.** The 89 Galar and Hisui moves have their behaviour and pictures, and every region's species learn them.
- **Left from the audit for later batches:**
  - Stantler's and Ursaring's `awaiting: evolution` marks come off in batch 18.
  - Mime Jr.'s second evolution lands with Galarian Mr. Mime in batch 12.
  - Galarian Darmanitan's Zen Mode stays off until its Zen form is drawn.

## What SpriteCollab has

Only what the collection has built ships (`../SpriteCollab/compact`, checked against `GAPS.md`). Anything missing keeps its reserved id and waits for upstream.

Checked against the collection as of 8 October 2026.

- **Not drawn, so held back:**
  - whole families: Rolycoly, Cufant (Copperajah is drawn, but not its first stage), and Zarude;
  - evolutions: Mr. Rime, so Galarian Mr. Mime ships as its line's end, marked `awaiting: evolution`;
  - forms: Stunfisk-Galar, Darmanitan-Galar Zen, Cramorant Gulping and Gorging, Calyrex Ice and Shadow Rider, Zarude Dada, and every Gigantamax.
- **Drawn short and filled out from the standing pose**, the way Jellicent and Toucannon already ship: Sirfetch'd, Stonjourner, Arctovish, Morpeko Hangry and Eternatus Eternamax. All of them ship.
- **Drawn:**
  - every other Galar species, and Eiscue's Noice Face;
  - Zacian and Zamazenta Crowned, both Urshifu styles, Enamorus Therian;
  - all 16 Hisuian forms and Hisui's seven new species;
  - every Galarian form except Stunfisk and Darmanitan Zen;
  - Basculegion's and Indeedee's females, as female coats on the male's sheet, the way Meowstic's is.
- **Falinks ships drawn as its Brass, for now.** The collection has only the troop's pieces (Brass, the leader, and Trooper) and no sheet for Falinks itself. Brass gets a hidden id so the import takes its sheet, and a stand-in rule draws Falinks with it. When a base sheet is drawn, the stand-in and the hidden id are removed.
- **No shiny coat**, which ships anyway and draws in the regular colours: Eternamax. Every other Gen 8 species and form has one, Alcremie's seven Sweets included.
- **Alcremie ships its seven Sweets on Vanilla Cream only** (`AlcremieBerry` to `AlcremieRibbon`, Strawberry being the base). The other eight creams are left out on purpose, not for lack of art.
- **The collection files Hisui's new species under `galar/`.** `scripts/import-sprites.ts` refiles dex 899 to 905 under `hisui`, where the game looks for them.
- **What follows from the gaps:**
  - The Zarude lair and relic stay reserved.
  - The fossil set ships all four.
  - Calyrex's fusion waits for its riders to be drawn.
- **A gap is not a reason to rework a design.** A signature stays written for the whole line or set, so the missing member slots in the day it is drawn.

## The order

Same as Alola: ids, then moves, then the moves on older species, then each family where it is met, legends after the routes, mythicals and gimmicks last. A batch is 3 to 5 families, or one legendary group.

| # | Batch | Families or content |
| --- | --- | --- |
| 0 | Catch up | Merge `main` into `gen-8-data`, redoing the TS data edits in YAML |
| 1 | Galar and Hisui moves | Finish `gen-8-moves`: visuals, teach the moves to every region's species, release page |
| 2 | Scaffolding | `Galar` and `Hisui` regions, `regions.yaml` rows, sprite import keys, `GALARIAN_FORMS`/`HISUIAN_FORMS`, the ability-pool audit below |
| 3 | Starters | Grookey, Scorbunny, Sobble |
| 4 | Postwick and Route 1 | Skwovet, Rookidee, Blipbug, Nickit, Gossifleur |
| 5 | Route 2 and the Wild Area | Wooloo, Chewtle, Yamper |
| 6 | Galar Mine and Route 4 | Applin (with Tart and Sweet Apple), Silicobra, Cramorant, Arrokuda |
| 7 | Route 5 and Hulbury | Toxel, Sizzlipede, Clobbopus, Pincurchin |
| 8 | Glimwood Tangle | Sinistea (with the Pots), Hatenna, Impidimp, Milcery (Alcremie's seven Sweets) |
| 9 | Route 8 to Circhester | Snom, Eiscue, Indeedee, Falinks (drawn as Brass) |
| 10 | Spikemuth and the late routes | Morpeko, Duraludon, Dreepy, Stonjourner |
| 11 | Fossils | Dracozolt, Arctozolt, Dracovish, Arctovish |
| 12 | Galarian forms, first half | Meowth to Perrserker, Farfetch'd, Mr. Mime, Corsola to Cursola, Zigzagoon to Obstagoon, Yamask to Runerigus |
| 13 | Galarian forms, second half | Ponyta, Slowpoke line (with Galarica Cuff and Wreath), Weezing, Darumaka |
| 14 | The heroes and Eternatus | Zacian, Zamazenta (Rusted Sword and Shield), Eternatus |
| 15 | Isle of Armor | Kubfu and both Urshifu |
| 16 | Crown Tundra | Regieleki and Regidrago, the Galarian birds, Calyrex with Glastrier and Spectrier (no fusion yet) |
| 17 | Hisuian forms | Growlithe, Voltorb, Typhlosion, Samurott, Decidueye, Qwilfish, Sneasel, Lilligant, Zorua, Braviary, Sliggoo, Avalugg, Basculin (two batches) |
| 18 | Hisui's new evolutions | Wyrdeer, Kleavor (Black Augurite), Ursaluna (Peat Block), Basculegion, Sneasler, Overqwil |
| 19 | Enamorus | Joins the forces of nature, so it shares their signature frame |
| 20 | Dynamax and Gigantamax | The battle mechanic, Max Moves, G-Max Moves, the Gigantamax Factor and Max Mushrooms |

Routes follow Sword and Shield's order. The order of batches 4 to 11 may shift where a family's biome is written better beside another.

## What every batch does

1. **Branch** `galar-<slug>`, stacked on the previous batch. Open a PR into that branch and link the stack with `gh stack link`, so a merged base never closes the rest.
2. **Species YAML** in the four field folders plus `text/en/species`, a `galar` or `hisui` folder each. The files are blocks of 25 dex numbers (`data-yaml`).
   - New forms follow `species-forms`.
   - A stage joining an older family takes that family's id (`family-ids`).
3. **Abilities from PokeAPI**, never from memory (`ability-pools`).
   - Count the pool by walking up the chain.
   - Propose fillers for any final stage short of four.
   - Build each mainline Gen 8 ability the batch needs, in a new `src/battle/abilities/gen-8.ts`, with a test.
4. **Signature ability, approved first.** Each family's concept goes to you before any of it is written (`signature-abilities`). Groups share one frame:
   - the starters;
   - the fossils;
   - Zacian and Zamazenta;
   - the Regis, which already have one;
   - the Galarian birds, which take the Kanto birds' frame;
   - Calyrex and its steeds;
   - Enamorus, which takes the forces of nature's.
5. **Spawns** in `biome/pools/*.yaml` (`spawn-surfaces`).
   - `spawn-balance.test.ts` must pass.
   - A legendary batch takes its lairs off `reserved` and adds their wild spawns in the same change (`lair-spawns`).
6. **Items** the batch's species need, in the same batch. Evolution items ship with the species that uses them.
7. **Sprites:** `pnpm import-sprites && pnpm compact-sprites`, plus the family candies.
8. **Text:** every description ends in a full stop (`registry-descriptions`). Run `pnpm id-names` after any enum change.
9. **Changeset**, `minor`, with one bullet per family. Then a section in the release page for the group of batches.
10. **Checks:** `pnpm test`, `pnpm exec tsc --noEmit`, and `rtk proxy pnpm exec oxlint src test`, read by its exit code.

A batch is done when all of that is green and a test asserts each new signature ability against real engine state.

## Audit before the first species

Checked against the data on this branch. All of these land in batch 2.

- **Farfetch'd is owed a filler: Sharpness (approved).**
  - It reaches only Keen Eye, Inner Focus and Defiant, and the Kantonian line never evolves: Sirfetch'd comes from the Galarian form.
  - It was skipped because `ability-pools` wrongly lists Farfetch'd and Mr. Mime among lines that gain an evolution. Drop both names there and in the mirrored copies.
- **Stantler and Ursaring** carry `awaiting: evolution` (`world/johto/227-251.yaml:45`, `world/johto/202-226.yaml:138`).
  - Remove both marks when Wyrdeer and Ursaluna land.
  - Ursaring's ability comment (`abilities/johto/202-226.yaml:77`) becomes present tense.
- **Basculin's invented Swift Swim stays off BasculinWhite.**
  - Swift Swim is Basculegion's own ability, and White is not a final stage.
  - Reword "both stripes take it" (`abilities/unova/544-568.yaml:22`) to the red and blue stripes.
- **Bug: Zen Mode would turn a Galarian Darmanitan into the Unovan one.**
  - `gen-5.ts:217` checks the base form, and DarmanitanGalar passes as dex 555.
  - Decided: Galarian Darmanitan keeps Zen Mode, and its Zen form is built.
    - Zen Mode maps each line to its own Zen form: Darmanitan to DarmanitanZen, DarmanitanGalar to DarmanitanGalarZen.
    - SpriteCollab has no sprite at all for Galarian Zen (tracker `0555/0003`: no sprite files, a portrait only). Until it does, the Galarian line's switch stays off.
- **Clean, nothing to change:**
  - Scyther, Meowth, Persian, Sneasel and Weavile carry nothing invented.
  - The fillers on Qwilfish, Corsola, Linoone, Cofagrigus and Mr. Mime stay valid, because their new evolutions hang off the regional forms.
  - Each regional form gets its own mainline list, and no copied fillers.
- **Mime Jr. gains a second evolution condition**, to Galarian Mr. Mime.
- **Basculegion's female** needs an id: `1090201`, after the Meowstic female precedent.

## Signatures and fillers

**Approved, every batch below.** Each concept was yours to decide (`signature-abilities`), family by family, along with the fillers. Anything that changes later is put to you again first.

- **Pools are PokeAPI's current lists**, walked up the chain.
- **Fillers** go in `hidden`, one per slot a final stage is short of four.
- **Cost:** every filler below is already implemented. The mainline abilities these lines bring that are not built yet are listed after the tables.
- **New moves:** a signature that casts a Galar move (Octolock, Decorate) waits for batch 1.

### Batch 3: the starters

**Approved, signatures and fillers.** The Cue frame: Galar's first partner plays for the team: landing a move of its own type casts an assist move for its side, at most once every 8 seconds. One `createCueAbility` factory serves all three.

| Family | Signature | Fillers |
| --- | --- | --- |
| Grookey | **Drum Cue**: Each Grass move it lands casts Helping Hand on its teammate with the highest Attack or Special Attack, once every 8 seconds. | Rillaboom: Grass Pelt, Punk Rock |
| Scorbunny | **Kick Cue**: Each Fire move it lands casts After You on a teammate winding up a move, once every 8 seconds. | Cinderace: Reckless, Quick Feet |
| Sobble | **Scope Cue**: Each Water move it lands casts Spotlight on that target, so its team's single-target moves are drawn there, once every 8 seconds. | Inteleon: Infiltrator, Super Luck |

### Batches 4 and 5: Postwick to the Wild Area

**Approved, signatures and fillers.**

| Family | Signature | Fillers |
| --- | --- | --- |
| Skwovet | **Pantry Raid**: While it stands, any Berry an enemy would eat goes into its own cheeks instead, healing or curing it as the Berry would. | Greedent: Ripen, Harvest |
| Rookidee | **Steel Escort**: When an enemy starts winding up a move that hits its whole side, it casts Wide Guard, once every 10 seconds. | Corviknight is full |
| Blipbug | **Early Warning**: When an enemy starts winding up a single-target move at a teammate, that teammate casts Detect, once every 10 seconds. | Orbeetle is full |
| Nickit | **Fence**: Any item it steals goes to its teammate lowest on HP with empty hands, so its own hands stay free. | Thievul: Pickpocket |
| Gossifleur | **Cotton Cradle**: While it stands, its team regains 1.5x from Leech Seed, Ingrain and Grassy Terrain. | Eldegoss: Wind Rider |
| Wooloo | **Shorn**: The first Fire move to land on it each fight singes the fleece off: any burn is cured and it casts Agility. | Dubwool is full |
| Chewtle | **Shell Snap**: Its biting moves break Reflect, Light Screen and Aurora Veil on the target's side, as Brick Break does. | Drednaw: Rock Head |
| Yamper | **Zoomies**: Each time its Speed rises, it casts Charge on itself. | Boltund is full |

### Batches 6 to 8: Galar Mine to Glimwood Tangle

**Approved, signatures and fillers.** Coil Burrow was kept knowing it overlaps the Water signature that reaches every enemy.

Hatenna and Impidimp are a cancelling pair: each listener checks for the other's ability (the Sun Glare and Moon Pull shape).

| Family | Signature | Fillers |
| --- | --- | --- |
| Applin | **Shared Harvest**: Whenever it eats a Berry, its worst-hurt teammate gets that Berry's effect too. | Flapple and Appletun are full |
| Silicobra | **Coil Burrow**: While a sandstorm is up, its Ground moves strike every enemy instead of one. | Sandaconda: Sand Force |
| Cramorant | **Throat Pouch**: Each Water move it lands casts Stockpile on it. | Gluttony, Oblivious, Swift Swim |
| Arrokuda | **Spearhead**: When an enemy starts winding up a move at it, it casts Aqua Jet at that enemy, once every 6 seconds. | Barraskewda: Strong Jaw, Sniper |
| Toxel | **Venom Charge**: Each time poison costs an enemy HP, it casts Charge on itself, at most once every 6 seconds. | Toxtricity is full |
| Sizzlipede | **Cinder Coils**: Each Fire move it lands burns up the target's held Berry, as Incinerate does. | Centiskorch: Strong Jaw |
| Clobbopus | **Arm Lock**: Its contact moves catch the target in Octolock, if it is not already holding someone. | Grapploct: Suction Cups, Iron Fist |
| Pincurchin | **Live Spines**: Whoever lands a contact move on it is struck back with Thunder Shock. | Static, Water Absorb |
| Sinistea | **Last Pour**: When it faints, it casts Healing Wish on its worst-hurt teammate. | Polteageist: Levitate, Heatproof |
| Hatenna | **Silent Wrath**: An enemy loses 1/8 of its HP each time it raises a stat of its own, unless a Despair Feast holder stands on the field. | Hatterene: Soundproof |
| Impidimp | **Despair Feast**: It heals 1/8 of its HP each time an enemy loses a stat stage, unless a Silent Wrath holder stands on the field. | Grimmsnarl: Iron Fist |
| Milcery | **Sugarcoat**: Each status move it casts on a teammate casts Decorate on them as well. | Alcremie: Healer, Cute Charm |

### Batches 9 to 11: Circhester, Spikemuth and the fossils

**Approved, signatures and fillers.**

**Fossil frame, approved: the halves are stitched together.** Each fossil's moves of its head type (Bolt is Electric, Gill is Water) strike as its tail type (Drake is Dragon, Frost is Ice) against any target the tail type hits harder. One `createStitchedAbility(id, head, tail)` factory serves all four.

| Family | Signature | Fillers |
| --- | --- | --- |
| Snom | **Mirror Scales**: The added effects of moves that hit it, such as a burn, a flinch or a stat drop, land on whoever threw them instead. | Frosmoth: Snow Cloak, Tinted Lens |
| Eiscue | **Chipped Ice**: A physical hit that lands on it casts Hail, if no weather is up. | Swift Swim, Ice Body, Slush Rush |
| Falinks | **Rank and File**: A trooper takes the hit: the first 5 hits it takes each land at 0.5x. Drawn as Brass until it has a sheet of its own. | Steadfast, Intimidate |
| Indeedee | **Attendant**: When a teammate takes a super-effective hit, it casts Heal Pulse on them, once every 8 seconds. | Telepathy |
| Morpeko | **Hangry Spark**: Whenever an enemy eats a Berry, it casts Nuzzle at them. | Cheek Pouch, Gluttony, Anger Point |
| Duraludon | **Overhang**: An enemy move that would strike several of its party strikes it alone instead. | Not final (Archaludon), so not filled |
| Dreepy | **Dreepy Launch**: Once every 10 seconds, a Dragon move it lands launches a Dreepy: it casts Dragon Darts at a second enemy. Waits for Dragon Darts (batch 1). | Dragapult: Levitate |
| Stonjourner | **Solstice**: Every 30 seconds, its team's moves hit 1.3x for 6 seconds. | Sturdy, Solid Rock, Clear Body |
| Dracozolt | **Boltdrake**: Its Electric moves strike as Dragon moves against any target Dragon hits harder. | Sheer Force |
| Arctozolt | **Boltfrost**: Its Electric moves strike as Ice moves against any target Ice hits harder. | Ice Body |
| Dracovish | **Gilldrake**: Its Water moves strike as Dragon moves against any target Dragon hits harder. | Swift Swim |
| Arctovish | **Gillfrost**: Its Water moves strike as Ice moves against any target Ice hits harder. | Water Veil |

### Batches 12 and 13: the Galarian forms

**Approved, signatures and fillers.**

These go under `forms:` in the region file of each line's first stage, the way the Alolan lines do. Only a line whose every stage is regional gets one.

- **Lines that keep their family's signature,** because an earlier stage is not regional: Weezing, Mr. Mime, and the Hisuian finals Typhlosion, Samurott, Decidueye, Lilligant, Braviary, Goodra and Avalugg.
- **New evolutions that join their family's signature:** Wyrdeer, Kleavor and Ursaluna.

All of them still read sensibly.

| Line | Signature | Fillers |
| --- | --- | --- |
| Meowth, Perrserker | **War Spoils**: Any enemy it knocks out leaves it their held item, or the item goes to an empty-handed teammate if its own hands are full. | Perrserker is full |
| Ponyta, Rapidash | **Mending Horn**: Its Fairy moves heal its worst-hurt teammate for 1/2 of the damage they deal. | Rapidash: Misty Surge |
| Slowpoke, Slowbro, Slowking | **Slow Venom**: Each enemy is badly poisoned by the third move it lands on them. | Full |
| Farfetch'd, Sirfetch'd | **Leek Shield**: Each attack it lands raises its leek as a shield: the next blow it takes lands at 0.6x. | Sirfetch'd: Sharpness, Super Luck |
| Corsola, Cursola | **Coral Husk**: When it faints, its husk stays standing for 6 seconds and draws every enemy single-target move. | Cursola: Liquid Ooze |
| Zigzagoon, Linoone, Obstagoon | **Blockade**: A contact move that lands on it while it is not casting or channelling takes 2 stages of Defense off the attacker. | Obstagoon is full |
| Darumaka, Darmanitan | **Cold Sink**: Ice moves aimed at its teammates are drawn onto it, and each one that reaches it raises its Attack 1 stage instead of hurting it. | Full, Zen Mode kept |
| Yamask, Runerigus | **Carved Grudge**: When it faints, every enemy that landed a move on it loses 1/8 of its HP. | Runerigus: Cursed Body, Solid Rock, Shadow Tag |

### Batches 14 to 16: the legends

**Approved, signatures and fillers.**

- **Zacian and Zamazenta: Sworn.** The heroes answer the blow that breaks one of their own. The sword strikes back and the shield steps in front, from one `createSwornAbility` factory.
- **The Regis** extend `createSealedAbility` with the two stats the trio left free: Speed for Regieleki, Special Attack for Regidrago.
- **Calyrex and the steeds: the King's Reins.** A knockout lifts the whole team rather than only the holder, the team-wide side of Chilling Neigh and Grim Neigh. One `createReignAbility(id, reward)` factory serves all three.
- **The Galarian birds: Mirror birds.** Each lowers the same stat on arrival as its Kanto counterpart, and the two cancel when one faces the other. The cancelling shape is the Sun Glare and Moon Pull one: each listener checks for the other's ability.

| Family | Signature | Fillers |
| --- | --- | --- |
| Zacian | **Sworn Blade**: The first time it or a teammate falls below 1/2 HP, it casts Sacred Sword at whoever did it. Once per unit. | Justified, Sharpness, Defiant |
| Zamazenta | **Sworn Shield**: The first time a teammate falls below 1/2 HP, it casts Follow Me to draw the enemy's moves off them. Once per teammate. | Justified, Bulletproof, Sturdy |
| Eternatus | **Darkest Day**: While it stands, every enemy loses 1/16 of its HP each time it acts, and it heals what they lose. | Corrosion, Levitate, Neutralizing Gas |
| Kubfu | **Kata**: Every third move it lands casts Bulk Up on itself. | Both Urshifu: Sniper, Iron Fist |
| Regieleki | **Volt Seal**: For 8 seconds it deals and takes 0.5x, then deals 1.25x and gains 2 stages of Speed. | Clear Body, Galvanize, Lightning Rod |
| Regidrago | **Wyrm Seal**: For 8 seconds it deals and takes 0.5x, then deals 1.25x and gains 2 stages of Special Attack. | Clear Body, Multiscale, Berserk |
| Glastrier | **Frostreign**: Each enemy it knocks out raises its whole team's Attack 1 stage. | Slush Rush, Ice Body, Stamina |
| Spectrier | **Shadereign**: Each enemy it knocks out raises its whole team's Special Attack 1 stage. | Infiltrator, Cursed Body, Speed Boost |
| Calyrex | **Crownreign**: Each enemy it knocks out heals its whole team 1/8 of their HP. | Harvest, Telepathy, Flower Veil |
| Articuno-Galar | **Glarewing**: Every enemy loses a stage of Speed as it arrives on the field. Against a Frostwing holder neither wingbeat lands. | Telepathy, Synchronize, Magic Bounce |
| Zapdos-Galar | **Strikewing**: Every enemy loses a stage of Special Defense as it arrives on the field. Against a Stormwing holder neither wingbeat lands. | Scrappy, Guts, Quick Feet |
| Moltres-Galar | **Wrathwing**: Every enemy loses a stage of Defense as it arrives on the field. Against an Emberwing holder neither wingbeat lands. | Merciless, Infiltrator, Unnerve |

### Batches 17 to 19: Hisui

**Approved, signatures and fillers.**

Enamorus joins the forces of nature through their `createGenieAbility` frame (Bloomfall approved). Its Therian Overcoat goes in `SHAPE_ABILITIES` the way Tornadus Therian's does.

| Line | Signature | Fillers |
| --- | --- | --- |
| Growlithe, Arcanine | **Watchfire**: When an enemy starts casting at one of its teammates, its own next move at that enemy casts 40% faster. | Arcanine: Justified |
| Voltorb, Electrode | **Husk Burst**: The first time it drops below 1/2 HP, it casts Leech Seed on every enemy. | Electrode: Grassy Surge |
| Qwilfish, Overqwil | **Venom Feast**: It heals 1/2 of whatever poison costs the enemy side while it stands. | Overqwil: Merciless |
| Sneasel, Sneasler | **Nerve Venom**: Its contact moves paralyse a poisoned target 30% of the time, and the poison stays. | Sneasler is full |
| Zorua, Zoroark | **Afterhaunt**: The first time it would faint it lingers for 4 seconds, untouchable and still fighting, then falls. Once per fight. | Zoroark: Cursed Body, Infiltrator, Anger Point |
| Basculin (white), Basculegion | **Soul Cloak**: Each teammate that faints wraps it in their soul: the next blow it takes lands at 1/2. | Basculegion is full |
| Enamorus | **Bloomfall**: Its team throws Fairy moves at 1.3x while it stands. | Misty Surge, Fairy Aura |

The finals that keep their family's signature still need fillers:

| Final stage | Fillers |
| --- | --- |
| Typhlosion | Flame Body |
| Samurott | Moxie |
| Decidueye | Super Luck |
| Wyrdeer | Telepathy |

### Held back until SpriteCollab draws them

**Approved, signatures and fillers.** Each is written up now and ships in the batch its area belongs to once its sprite is built.

| Line | Signature | Fillers |
| --- | --- | --- |
| Rolycoly, Carkol, Coalossal | **Tar Coat**: Each Fire move it lands casts Tar Shot on the target. Waits for Tar Shot (batch 1). | Coalossal is full |
| Cufant, Copperajah | **Patina**: Each hit it takes turns it greener: +1 Special Defense, up to +3. | Copperajah: Thick Fat, Steelworker |
| Zarude | **Vine Swing**: Its moves wind up 30% faster against the last enemy that hit it. | Pickpocket, Tough Claws, Sap Sipper |
| Galarian Stunfisk | **Bear Trap**: The first contact move each enemy lands on it snaps shut: that enemy cannot act for 1 second. | Strong Jaw, Iron Barbs, Limber |
| Mr. Rime | Joins the Mime family's signature. | Full |

### Mainline abilities to build first

Each lands in the batch that brings its line, with a test.

- **Starters and routes:** Libero, Punk Rock, Cotton Down, Ball Fetch, Gulp Missile, Propeller Tail, Ice Scales, Ice Face, Hunger Switch, Stalwart.
- **Galarian forms:** Pastel Veil, Quick Draw, Curious Medicine, Steely Spirit, Gorilla Tactics, Screen Cleaner, Wandering Spirit.
- **Legends:** Intrepid Sword, Dauntless Shield, Unseen Fist, Transistor, Dragon's Maw, Chilling Neigh, Grim Neigh.
- **Held-back lines:** Power Spot, Mimicry, Screen Cleaner (Steam Engine is built).
- **Waiting for their forms to be drawn:** both As One abilities.

### Decided along the way

- **Fossils revive from two halves.**
  - Fossilized Bird or Fish is the top, Drake or Dino the bottom.
  - The reviver takes one of each: Bird and Drake make Dracozolt, Bird and Dino Arctozolt, Fish and Drake Dracovish, Fish and Dino Arctovish.
  - `FOSSIL_SPECIES` grows a pair table beside its one-item map.
- **Gulp Missile, Ice Face and Hunger Switch behave as in the mainline**, form change included.
  - Eiscue's Noice Face is drawn (`galar/0875/0001`), so Ice Face ships whole.
  - Cramorant's Gulping and Gorging and Morpeko's Hangry are not drawn. Their behaviour still runs, and the unit keeps its base sheet until SpriteCollab draws the form.

## Dynamax and Gigantamax

Batch 20, built the way Megas and Z-Moves were: automatic, once per side, with nothing to press, so a player and the AI get it the same way.

- **Dynamax.**
  - The first unit on a side to cross a trigger grows. The trigger is decided in the batch, for example entering the field holding a Dynamax Band.
  - For `turns(3)` it has doubled HP and throws its damaging moves as the Max Move of their type.
  - Its status moves become Max Guard.
  - The Max Move ids are already reserved.
- **Gigantamax.**
  - A species with the Gigantamax Factor throws its G-Max Move in place of that one Max Move.
  - The factor is a catch flag, set by Max Soup or rolled rarely on the species that have one.
- **Drawing it.**
  - SpriteCollab has no Gigantamax art, so a Dynamaxed or Gigantamaxed unit is its own sheet drawn larger, with a red glow.
  - Gigantamax form ids wait until the collection draws them.
- **What it shares with Megas and Z-Moves.**
  - A unit holding a Mega Stone or a Z-Crystal never Dynamaxes.
  - A side's Mega, Z-Move and Dynamax are each once per fight.
- **Items:** the Max Mushrooms, plus Max Soup if the factor is a catch flag.
- **Raids are left as they are.** A raid boss does not Dynamax; that is a later decision once the mechanic exists.

## Decided

- **Signatures and fillers:** approved family by family in [Signatures and fillers](#signatures-and-fillers), held-back lines included.
- **Dynamax and Gigantamax:** in, as batch 20.
- **Forms:** only what SpriteCollab has.
- **Galar trainers and gym leaders:** not yet.

## Pace

- **One batch per PR, stacked.**
- **Release pages:** one per group: Galar's routes (3 to 11), the forms (12 and 13), the legends (14 to 16), Hisui (17 to 19), and Dynamax (20). Each gets a row in `docs/update.md`.
- **Batches 3 onward each wait on your signature approval**, so I will propose the concepts for the next batch while the current one is in review.
