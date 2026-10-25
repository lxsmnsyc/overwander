# Zenith strategy

How every generation after Kanto gets its Zeniths, region by region, after [the app logic split](app-logic.md), the way [the Kanto Zeniths](../../src/data/species/zeniths/kanto.yaml) went in.

## Where things stand

- **Kanto, Johto, Hoenn and Sinnoh are done:** 49, 40, 50 and 54 Zeniths, one for every eligible pokemon of each. Batch 0 (Zenith shapes, Unown) is in.
- **The rules are held by `test/data/zeniths.test.ts`.** A Zenith belongs to a final stage with no Mega and no other held-item shape. It fights 100 above its base stat total, none of it in HP, and wears an ability its line can never be born with. Its shard id is `2000000 + dex × 100 + 01`, and the shard is buried in the prized band only where its line is met.
- **Left to do: about 281 Zeniths.**

  | Region | Eligible | Notes |
  | --- | --- | --- |
  | Unova | 69 | Kyurem, with a shape for Black and White Kyurem. Born forms such as Basculin's stripes and Sawsbuck's seasons get shapes under one shard each |
  | Kalos | 27 | Zygarde, with a shape for its 10% Forme |
  | Alola | 50 | Necrozma, with a shape for Dusk Mane and Dawn Wings |
  | Galar | 46 | Calyrex, with a shape for each Rider |
  | Hisui | 6 | |
  | Paldea | 59 | Ogerpon, with a shape for each mask. Bramblin, Toedscool, Rellor and Flittle wait for their final stages |
  | Regional finals | about 30 | Alolan, Galarian, Hisuian and Paldean finals |

## Decided

- **Legendaries and mythicals get one**, as Kanto's birds and Mew did.
- **Shedinja and Smeargle get one.** Shedinja keeps its 1 HP, as every Zenith keeps its HP.
- **Shape-shifters get one**, Unown excepted: Castform, Darmanitan, Aegislash, Wishiwashi, Minior, Eternatus, Terapagos, and the other pokemon that change shape mid-fight (Mimikyu, Eiscue, Morpeko, Cramorant, Palafin, Meloetta). Each proposal says how the Zenith sits with the form change, such as whether the shape it changes into keeps the Zenith's stats.
- **Kept shapes share one shard.** A pokemon that is put into a shape for good, as a Meteorite does to Deoxys, has one Zenith with a Zenith shape for each kept shape (`forms` in the YAML), all wearing one ability. Whichever shape holds the shard fights as that shape's Zenith. The gap test counts these pokemon, and a test holds that every kept shape has its Zenith shape. Shapes take form slot 98 and down, after any regional final.
- **Born shapes share one shard too.** A form a pokemon is met in rather than changed into, such as a Trash Wormadam or an East Sea Gastrodon, gets a Zenith shape under the same shard, and a test holds that every same-region form has one. A true shadow gets none: nothing puts one right, and its counterpart's shard does nothing for it.
- **Unown gets none.** It joins Ditto in `NO_ZENITH`, with its reason in the comment.
- **Regional finals get one** in form slot 98 and down, in the batch of the region whose form it is: Alolan Ninetales goes in with Alola, not Kanto. A regional final's Zenith wears an ability of its own, never its base line's Zenith ability: only shapes changed into in battle share one.
- **No two Zeniths of one region wear the same ability.** A later region may reuse an earlier one's.
- **Proposals come 4 pokemon at a time**, through questions. Each pokemon's abilities, ancestors' included, and its team role come first. Each question offers 3 or 4 concepts for one pokemon, each with its stat spread, worn ability and any type change, and every concept serves that role: an ability that undoes the pokemon's own best move, or a spread bent to fit the ability, is not offered. Before a round goes out, every option is checked against the abilities the region has already approved, so nothing taken is offered again. A region is built once every pokemon in it is approved.

## The order

| # | Batch | Content |
| --- | --- | --- |
| 0 | Scaffolding | Unown in `NO_ZENITH`, and a way for a Zenith to carry through a form change in battle, so each shape-shifter's proposal can say what its other shape keeps. A test that lists, region by region, every eligible pokemon still without a Zenith, so each batch can see what it owes |
| 1 | Johto | 40 |
| 2 | Hoenn | 50, Deoxys included |
| 3 | Sinnoh | 54 |
| 4 | Unova | 69 |
| 5 | Kalos | 27 |
| 6 | Alola | 50, then the Alolan finals of Kanto lines |
| 7 | Galar | 46, then the Galarian finals |
| 8 | Hisui | 6, then the Hisuian finals |
| 9 | Paldea | 59, then the Paldean Tauros breeds |

## What every batch does

1. **Branch** `zenith-<region>`, stacked on the previous batch, linked with `gh stack link`.
2. **Propose, 4 at a time.** For each pokemon, 3 or 4 concepts:
   - a stat spread exactly 100 above its base total, with HP left as it is;
   - a worn ability from any generation that its line can never be born with, built already or built in this batch (`ability-pools`);
   - a type change only where its moves or its look already argue for one, as Butterfree's Psychic does.
   The comment above each entry in the YAML says the reason in one line, as Kanto's do.
3. **Data:** `src/data/species/zeniths/<region>.yaml`, the holder's name in `text/en/zeniths.yaml`, the species ids in form slot 99 (98 and down for regional forms), and the shard ids.
4. **Shards:** placed in the prized band where the line is met, with each shard's tint in `scripts/art/item-icons.ts` on a `zenith/<region>` sheet.
5. **Abilities:** any worn ability not built yet is built in this batch, with a test.
6. **Changeset**, `minor`, with one line for the region. A release page per region, with a row in `docs/update.md`.
7. **Checks:** `pnpm test`, `pnpm typecheck`, and `rtk proxy pnpm exec oxlint src test`, read by its exit code.

## Approved

### Unova

Approved so far, built once all 68 are in.

| Pokemon | Types | Worn ability | HP / Atk / Def / SpA / SpD / Spe |
| --- | --- | --- | --- |
| Victini | Psychic/Fire | Speed Boost | 100 / 140 / 105 / 100 / 105 / 150 |
| Serperior | Grass/Dragon | Queenly Majesty | 75 / 75 / 110 / 115 / 115 / 138 |
| Samurott | Water/Fighting | Sharpness | 95 / 135 / 95 / 108 / 80 / 115 |
| Watchog | Normal | Compound Eyes | 60 / 100 / 99 / 60 / 99 / 102 |
| Stoutland | Normal | Guard Dog | 85 / 135 / 110 / 45 / 110 / 115 |
| Liepard | Dark | Tough Claws | 64 / 123 / 70 / 88 / 70 / 131 |
| Simisage | Grass | Grassy Surge | 75 / 98 / 78 / 138 / 78 / 131 |
| Simisear | Fire | Drought | 75 / 98 / 78 / 138 / 78 / 131 |
| Simipour | Water | Drizzle | 75 / 98 / 78 / 138 / 78 / 131 |
| Musharna | Psychic/Fairy | Bad Dreams | 116 / 55 / 110 / 127 / 120 / 59 |
| Unfezant | Normal/Flying | Gale Wings | 80 / 140 / 85 / 65 / 75 / 143 |
| Zebstrika | Electric | Rock Head | 75 / 135 / 83 / 80 / 73 / 151 |
| Gigalith | Rock | Solid Rock | 85 / 155 / 150 / 60 / 140 / 25 |
| Swoobat | Psychic/Flying | Serene Grace | 67 / 57 / 65 / 107 / 65 / 164 |
| Conkeldurr | Fighting | Stamina | 105 / 160 / 125 / 55 / 95 / 65 |
| Seismitoad | Water/Ground | Punk Rock | 105 / 95 / 85 / 130 / 90 / 104 |
| Throh | Fighting | Unaware | 120 / 110 / 120 / 30 / 120 / 65 |
| Sawk | Fighting | Iron Fist | 75 / 150 / 85 / 30 / 80 / 145 |
| Leavanny | Bug/Grass | Tinted Lens | 75 / 143 / 90 / 70 / 90 / 132 |
| Whimsicott | Grass/Fairy | Cotton Down | 60 / 67 / 115 / 97 / 105 / 136 |
| Lilligant | Grass | Dancer | 70 / 60 / 90 / 135 / 90 / 135 |
| Basculin | Water/Dark | Moxie | 70 / 127 / 75 / 80 / 65 / 143 |
| Krookodile | Ground/Dark | Strong Jaw | 95 / 152 / 95 / 65 / 85 / 127 |
| Darmanitan | Fire/Fighting, Zen Fire/Psychic | Berserk | 105 / 165 / 75 / 30 / 75 / 130, Zen 105 / 30 / 120 / 175 / 120 / 90 |
| Maractus | Grass | Iron Barbs | 75 / 86 / 112 / 116 / 97 / 75 |
| Crustle | Bug/Rock | Rocky Payload | 70 / 140 / 135 / 65 / 85 / 90 |
| Sigilyph | Psychic/Flying | Psychic Surge | 72 / 58 / 95 / 133 / 95 / 137 |
| Cofagrigus | Ghost | Shadow Tag | 58 / 50 / 165 / 135 / 135 / 40 |
| Carracosta | Water/Rock | Adaptability | 74 / 138 / 143 / 83 / 75 / 82 |
| Archeops | Rock/Flying | Multiscale | 75 / 150 / 85 / 112 / 85 / 160 |
| Garbodor | Poison | Toxic Debris | 80 / 115 / 112 / 60 / 102 / 105 |
| Zoroark | Dark | Libero | 60 / 115 / 70 / 150 / 70 / 145 |
| Cinccino | Normal/Fairy | Fur Coat | 75 / 115 / 90 / 65 / 70 / 155 |
| Gothitelle | Psychic/Dark | Magic Bounce | 70 / 55 / 115 / 120 / 130 / 100 |
| Reuniclus | Psychic | Analytic | 110 / 65 / 105 / 165 / 115 / 30 |
| Swanna | Water/Flying | Swift Swim | 75 / 87 / 78 / 122 / 78 / 133 |
| Vanilluxe | Ice | Slush Rush | 71 / 95 / 95 / 135 / 105 / 134 |
| Sawsbuck | Normal/Grass | Reckless | 80 / 140 / 85 / 60 / 85 / 125 |
| Emolga | Electric/Flying | Prankster | 55 / 75 / 85 / 95 / 85 / 133 |
| Escavalier | Bug/Steel | Mirror Armor | 70 / 165 / 135 / 60 / 145 / 20 |
| Amoonguss | Grass/Poison | Mycelium Might | 114 / 85 / 110 / 85 / 120 / 50 |
| Jellicent | Water/Ghost | Water Bubble | 100 / 60 / 95 / 115 / 125 / 85 |
| Alomomola | Water | Magic Guard | 165 / 75 / 105 / 40 / 95 / 90 |
| Galvantula | Bug/Electric | Transistor | 70 / 77 / 70 / 132 / 70 / 153 |
| Klinklang | Steel | Steelworker | 60 / 140 / 125 / 70 / 95 / 130 |
| Beheeyem | Psychic/Electric | Neuroforce | 75 / 75 / 105 / 160 / 130 / 40 |
| Haxorus | Dragon/Steel | Dragon's Maw | 76 / 177 / 100 / 60 / 80 / 147 |
| Ferrothorn | Grass/Steel | Bulletproof | 74 / 114 / 166 / 54 / 161 / 20 |
| Beartic | Ice/Fighting | Thick Fat | 95 / 150 / 100 / 70 / 100 / 90 |
| Cryogonal | Ice | Prism Armor | 80 / 50 / 90 / 115 / 145 / 135 |
| Accelgor | Bug | Protean | 80 / 70 / 70 / 140 / 80 / 155 |
| Stunfisk | Ground/Electric | Arena Trap | 109 / 66 / 104 / 106 / 119 / 67 |
| Mienshao | Fighting | Unseen Fist | 65 / 150 / 70 / 95 / 70 / 160 |
| Druddigon | Dragon | Guts | 77 / 155 / 105 / 60 / 105 / 83 |
| Bouffalant | Normal | Fluffy | 95 / 130 / 125 / 40 / 115 / 85 |
| Braviary | Fighting/Flying | Intimidate | 100 / 143 / 95 / 57 / 95 / 120 |
| Mandibuzz | Dark/Flying | Regenerator | 110 / 65 / 135 / 55 / 125 / 120 |
| Heatmor | Fire | Long Reach | 85 / 122 / 76 / 120 / 76 / 105 |
| Durant | Bug/Steel | Sheer Force | 58 / 139 / 122 / 48 / 63 / 154 |
| Hydreigon | Dark/Dragon | Mega Launcher | 92 / 105 / 100 / 160 / 100 / 143 |
| Volcarona | Bug/Fire | Simple | 85 / 60 / 85 / 160 / 120 / 140 |
| Reshiram | Dragon/Fire | Competitive | 100 / 120 / 110 / 180 / 130 / 140 |
| Zekrom | Dragon/Electric | Defiant | 100 / 180 / 130 / 120 / 110 / 140 |
| Cobalion | Steel/Fighting | Steely Spirit | 91 / 120 / 139 / 90 / 92 / 148 |
| Terrakion | Rock/Fighting | Sand Stream | 91 / 159 / 110 / 72 / 110 / 138 |
| Virizion | Grass/Fighting | Seed Sower | 91 / 120 / 92 / 90 / 139 / 148 |
| Keldeo | Water/Fighting | Sniper | 91 / 72 / 95 / 164 / 95 / 163, Resolute the same |
| Kyurem | Dragon/Ice | Ice Scales | 125 / 150 / 110 / 150 / 110 / 115, Black 125 / 200 / 115 / 120 / 110 / 130, White 125 / 120 / 110 / 200 / 115 / 130 |
| Meloetta | Normal/Psychic | Scrappy | 100 / 77 / 97 / 158 / 138 / 130, Pirouette (Normal/Fighting) 100 / 158 / 100 / 77 / 97 / 168 |

## Pace

- **One region per PR, stacked.**
- **Proposals for the next round go up while the current one is in review.**
