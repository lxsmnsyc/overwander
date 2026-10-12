# Generation 9 strategy

How Paldea, Kitakami and the Blueberry Academy go in, batch by batch, on top of `gen-9-data`. The Gen 8 plan this one follows is in [docs/strategy/gen-8.md](docs/strategy/gen-8.md).

## Where things stand

- **Already on `main`:** the Gen 9 ability ids, `LingeringAroma` (280) to `PoisonPuppeteer` (313).
- **Not yet:** species, form and family ids past Gen 8, the Gen 9 moves, and a Paldea region.
- **Gen 9 by PokeAPI:** 120 species (906 to 1025), 69 moves and 47 abilities.
- **Lines waiting on Gen 9,** marked `awaiting: evolution`: Primeape (Annihilape), Girafarig (Farigiraf), Dunsparce (Dudunsparce), Applin (Dipplin) and Duraludon (Archaludon). The mark in `world/kanto/101-125.yaml` is checked in batch 2.

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
| 0 | Ids | `gen-9-data`: species, form and family ids, the 69 move ids, the ability ids not yet reserved, the reserved lairs and relics |
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

## Still to decide

- The signatures and fillers, batch by batch, starting with the starters.
- How a Tera type is shown on the catch sheet and in a raid lobby.
- What else a Tera raid pays beside Tera Shards.

## Pace

- **One group of batches per PR, stacked.** The groups are: the moves (1), Paldea's routes (3 to 10), the new evolutions and forms (11 and 12), the legends (13 to 17), Terastallization (18), and Kitakami's legends with Terapagos and Pecharunt (19 and 20).
- **Release pages:** one per group, each with a row in `docs/update.md`.
- **Batches 3 onward each wait on your signature approval,** so I propose the concepts for the next batch while the current one is in review.
