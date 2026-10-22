---
name: data-yaml
description: Species, moves, abilities, items, the per-move battle numbers and the spawn pools are written as YAML, a folder per part of the record, and every name in them is checked against its enum when the data loads. Applies whenever adding, editing or reading species, move, ability, item, battle or spawn data, or adding an enum member the YAML should be able to name.
---

The species, moves, abilities and items are data, not code. Each part of a record lives in a folder of its own, and the player-facing words live apart from the numbers under `src/data/text/<locale>/`, so a second locale is another folder beside `en/`.

## Species

Under `src/data/species/`, with a folder per region inside each field:

| folder                   | holds                                                                    |
| ------------------------ | ------------------------------------------------------------------------ |
| `world/`                 | types, egg groups, habitat, biomes, active hours, evolutions, form flags, `held` items, `rank`, `awaiting`, `spawns-as` |
| `stats/`                 | base stats, catch rate, height, weight, gender ratio, `egg-cycles`       |
| `abilities/`             | `abilities` and `hidden`                                                 |
| `learnsets/`             | level, teachable and egg moves, plus a `family-teachable` list           |
| `text/en/species/`       | each name and category                                                   |

- **A file is a block of 25 dex numbers** from the region's first (`kanto/051-075.yaml`), and holds every family whose lowest dex number falls in it. A short tail of 5 or fewer folds into the block before it, so Kanto ends at `126-151.yaml`.
- **Each family is keyed by its own name, with its species beneath it**, in the same block in every field. A species missing from one field fails the load, and so does one written twice or under two families.

```yaml
Growlithe:
  Growlithe:
    types: [Fire]
  Arcanine:
    types: [Fire]
```

- **`family-teachable`, under a family, holds the moves the whole family can be taught.** Each species' `teachable` list adds to it.
- **`held`** is what a wild one carries: `{ common, uncommon, rare }`, at 1/2, 1/20 and 1/100, each slot left out for none. Every stage of a line writes the same.
- **`rank`** is a hand-kept class the shape of a line cannot say: `legendary` (what a raid or lair stages), `mythical` (what a relic calls), `baby`, `prized` and `mythical-odds` (rarity alone). A true shadow takes its counterpart's, and a Mega has none.
- **`awaiting: baby | evolution`** marks a line whose missing stage a later generation adds. Take it off when that stage is written down.
- **`spawns-as: water | ground`** overrides the spawn kind the types and egg groups give (the `spawn-surfaces` skill).
- **`egg-cycles`** is written only on the stage a line hatches at, and only where it is not 20.
- **`active: any`** is every hour of the day. `base-form: false` marks a form, and `worn: true` a shape put on mid-fight. `dex` is written only where the id's own dex number would be wrong.

## Megas and Zeniths

| file                              | holds                                                                 |
| --------------------------------- | --------------------------------------------------------------------- |
| `species/megas/gen-N.yaml`        | each Mega by species: `base`, `stats`, `types`, `ability`, `filler`, `height`, `weight` |
| `species/zeniths/<region>.yaml`   | each Zenith by species: `base`, `stats`, `types`, `ability`, `shard`  |
| `text/en/megas.yaml`              | each Mega's name                                                      |
| `text/en/zeniths.yaml`            | who each Zenith is for; the Zenith is named after them in code        |

- **Order is the list.** `listMegas()` walks the Mega files by generation and `listZeniths()` the Zenith files by region, each in the order it writes them, and the Zenith Shards follow the same order.
- **`filler`** is worn instead of the mainline's `ability` where the line already reaches that ability.
- Everything else, from learnsets to egg groups, is read off `base` when `species/megas.ts` and `species/zeniths.ts` register them.

## Species pairings

| file                         | holds                                                              |
| ---------------------------- | ------------------------------------------------------------------ |
| `species/true-shadows.yaml`  | each legendary's true shadow (`shadows`), and the worn `shapes` a shadow can take |
| `species/fusions.yaml`       | each fused shape: `husk`, `partner`, the `item` that joins them, and `wears-partner` |
| `species/feats.yaml`         | the battle feat a `Special` evolution asks: `criticals`, `endured`, `landed`, `recoil`, `cumulative` |
| `species/ultra-beasts.yaml`  | the Ultra Beasts                                                   |

What a true shadow is (its stats, its name) stays code in `true-shadow.ts`; the files say only who pairs with whom.

## Regions

`src/data/species/regions.yaml` holds each region by its enum name: the `dex` numbers it covers, ends included, and, for a region with a dex chain, the `milestones` each rung asks for and the `medal` the last one hangs. A rung keeps its number for good, so milestones are appended, never inserted. The sprite folder names stay in `regions.ts` beside the enum.

## Overworld

| file                              | holds                                                                 |
| --------------------------------- | --------------------------------------------------------------------- |
| `overworld/lairs.yaml`            | each lair's `species` (in the order a raid picks), `stands` (`water` or `island`), `underground`, `reserved` |
| `overworld/biome-lairs.yaml`      | each biome's lairs, in the order a landmark draws them                |
| `text/en/lairs.yaml`              | each lair's name                                                      |
| `overworld/item-pool.yaml`        | the ground's items by band, item to weight; a lowercase key is a whole family (`wings: 3`) |
| `overworld/berry-pool.yaml`       | what a berry patch grows, the same shape as the item pool           |
| `overworld/honey-tree.yaml`       | what a lathered honey tree draws out, by band like a biome's pool   |
| `overworld/biome-items.yaml`      | the ground each item is buried in, by biome or by a named `groups` run; an item not listed is buried everywhere |
| `overworld/totems.yaml`           | Alola's own Totems: `aura` (or `all`), height, weight and the trial's `crystal`; every other Totem is by rule |
| `overworld/nobles.yaml`           | Hisui's Nobles: the `treasure` each leaves and the Frenzy `burst` it throws |
| `overworld/experts/frontier-rooms.yaml` | the Pike's `curtains` (status left, or null) and the Arcade's `panels` (sky put up, or null), in the order the roll draws them |
| `constants/status-cast.yaml`      | the clips a pokemon carrying a status is drawn in, statuses in the order they win |
| `overworld/weather/biomes.yaml`   | each biome's six skies, and the four `corners` every country shares   |
| `overworld/weather/kinds.yaml`    | each sky's map `color`, the types it `favours` (`[]` for none, `everything` for all) and the `battle` sky it is fought under |
| `text/en/weather.yaml`            | each sky's name and description                                       |
| `biome/colors.yaml`               | each biome's map color                                                |
| `overworld/boss-banned.yaml`      | the moves a boss is never staged with, each under a comment saying why |
| `biome/ground.yaml`               | the type each biome's ground counts as (`biomes`), and the move and status each type of ground gives (`effects`) |

- **Order is part of the world.** A biome's lair list and each band of the item and berry pools are walked by a seeded roll, so moving an entry changes what every player's map holds. Append; never reorder.
- **A lair is numbered by the enum in `ids/lairs.ts`,** since a raid prize records it. A new lair is an enum member, a row in each lair file, and `pnpm id-names`. `reserved: true` keeps it out of the world until its batch lists it.
- **An item family a pool names** is listed in `ITEM_FAMILIES` in `overworld/item-pool.ts`.
- **A trainer class is an Ace** with `ace: true` in its `trainers/classes/<region>.yaml` row: one a region, fielding every type at the Ace levels.

## Quests

| file                     | holds                                                                  |
| ------------------------ | ---------------------------------------------------------------------- |
| `quests/quests.yaml`     | the written `chains`, in the board's order, and each quest's `requirements` and `rewards` |
| `quests/daily.yaml`      | the pool the third daily slot draws from                               |
| `text/en/quests.yaml`    | each chain's, quest's and daily's name                                 |

- **A quest and a chain are numbered by their enums in `quests/types.ts`,** since a claim records the number. A new one is an enum member, a row in each file, and `pnpm id-names`.
- **The daily pool's order is part of every player's board.** A seed picks by position, so append and never reorder.
- A requirement is a counter (`metric` and `count`, narrowed by at most one of `species`, `family`, `type`, `item`, `npc`, `landmark`, `move`, `foe` or `trainer`), `dex: n`, or `turn-in`. A reward is `item` and `amount`, `catch`, `encounter`, `egg` or `award`. The metrics, landmarks and foes are the enums in `src/model/quest-record.ts`.

## Achievements

`src/data/achievements.yaml` holds each achievement line by its enum name (`ids/achievements.ts`): the `metric` it climbs, narrowed by an `npc` or a `landmark`, and its four `tiers`. Beside them are the type lines' `types` and `type-tiers`, the `trainer-tiers`, and each metal's `colors`. A worn title is recorded against a line's number, so a line is appended to the enum and never renumbered.

## Names and lines

The words for the smaller enums sit under `src/data/text/en/`, each keyed by member name and read with `stringTable` from `src/data/yaml.ts` (or a loader of its own where an entry holds more than a string). Every member needs an entry.

| file                                        | holds                                                          |
| ------------------------------------------- | -------------------------------------------------------------- |
| `biomes.yaml`, `times-of-day.yaml`, `spawn-rarities.yaml` | what each biome, part of the day and rarity band is called |
| `stats.yaml`                                | the six stats under `stats:`, the seven stages under `stages:` |
| `item-types.yaml`                           | each bag shelf's name                                          |
| `statuses.yaml`                             | how each status reads                                          |
| `families.yaml`, `natures.yaml`, `egg-groups.yaml` | the names `ids/text.ts` reads                           |
| `awards.yaml`                               | each award's name; its `color` and `sprite` are `src/data/awards.yaml` |
| `achievements.yaml`                         | each tier's name under `tiers:`, each line's `name` and `deed` under `lines:` |
| `titles.yaml`                               | the titles numbered one by one (`ids/ladder-titles.ts`)        |
| `frontier-rooms.yaml`                       | the Pike's `curtains:` and the Arcade's `panels:`              |
| `dex-rungs.yaml`                            | the rungs of a dex chain below the last, in order              |
| `gym-leaders.yaml`, `elite.yaml`            | each expert's `name` and the `quote` they challenge with       |
| `champions.yaml`, `legends.yaml`            | each one's `name` and the whole `greeting` line                |
| `frontier.yaml`                             | each Brain's `name`, `house` and `greeting`                    |

An enum these files name is listed in `scripts/data/id-names.ts`, so it lives in `src/data/ids/` with nothing else in its file that reads YAML: `names.ts` imports it, and a loader beside it would import `names.ts` back.

## Moves

Under `src/data/moves/`, each part filed by generation and the stretch of moves it was written in (`gen-1/bulbasaur-to-blastoise.yaml`), every move keyed by its name:

| folder             | holds                                                                   |
| ------------------ | ----------------------------------------------------------------------- |
| `battle/`          | type, category, power, accuracy, priority, pp, target, affects, flags, steps, `projectile` |
| `cast/`            | the clips the caster plays, most wanted first, ending on a common one   |
| `visual/`          | how it is drawn where the canvas's rules get it wrong: `landing`, `wait` as `{ winding, striking }`, `winding` (`none` or a shape), `color` (a hex or a stage) |
| `text/en/moves/`   | each name and description, in the file of the same name                |

- `flags` and `affects` are lists of names (`flags: [Contact, Sound]`); leave `flags` out for none and `affects` out for the default the way the move is cast.
- A flag is what a family of moves shares and an ability or a mechanic reads: `Contact`, `Sound`, `Powder`, `Bite`, `Slicing`, `Wind`, `Punch` (Iron Fist), `Kick`, `Dance` (Dancer), `Ballistic` (Bulletproof) and `HighCrit` (a critical hit ratio a stage up). A move joins one by naming it, not by a list in the code.
- `projectile: true` is a move that flies across the gap before it lands.
- **`visual/shapes.yaml`** holds each landing shape by name: `span`, `jolt`, `arrives`, the `wait` it implies, `color`, `staged` and the `types` that fall back on it. Shape names are not an enum, so they are checked against `EFFECT_SHAPES` and `DELAY_SHAPES` in `visual/shape-names.ts`; a new one is added there and `pnpm id-names` run. The painters stay in `src/canvas/battle/moves/` (the `move-visuals` skill).
- Moves register in id order, which is the pool Metronome draws from, so where a move is filed changes nothing.
- What a move does beyond its numbers is code, in `src/battle/moves/`. Which sky a weather move calls up is `src/data/moves/weather.ts`.

## Battle numbers

The numbers a fight reads off each move live apart from the move, in `src/data/battle/`, a file per mechanic keyed by move:

| file                  | holds                                                            |
| --------------------- | ---------------------------------------------------------------- |
| `statuses.yaml`       | the status a move puts on its `target`, its `self` or its `team` |
| `added-statuses.yaml` | the status a damaging move may leave, and its `chance` out of 100 |
| `added-stages.yaml`   | the `stages` a damaging move may push, by `value`, at a `chance`, on its user when `self` |
| `stages.yaml`         | the stages a status move changes, in the order it changes them  |
| `multi-hit.yaml`      | `min` and `max` strikes, and whether each is `escalating`        |
| `recoil.yaml`, `drain.yaml`, `heal.yaml` | a share, as a number or a fraction such as `1/3` |
| `z-power.yaml`        | a type Z-Move's power, for the moves the table by power gets wrong |
| `z-effects.yaml`      | what a type crystal adds to a status move: `stages` raised by `value`, or `heal`, `clear`, `critical`, `centre` or `curse` |
| `recharge.yaml`       | a list: the moves that leave the user standing still once they land |
| `tutor-only.yaml`     | a list: the signature moves only the Move Tutor teaches          |
| `pseudo.yaml`         | a list: the moves that are not a pokemon's own (confusion, Struggle, the bare swing) |
| `gmax.yaml`           | each Gigantamax `species` with its G-Max `move` and `type`, and the `fixed` ones that always hit at 160 |
| `max-moves.yaml`      | the Max Move each type becomes, and the `weathers`, `terrains`, `foe-stages` and `ally-stages` each one brings |
| `z-moves.yaml`        | the Z-Move each type becomes, and the `signatures`                |
| `guards.yaml`         | each guard move and the status it puts on the user (`Protected`, `Enduring`) |
| `ai-roles.yaml`       | a `MoveRole` to the moves the AI files under it by hand, added to what it reads off each move |

`src/data/battle/index.ts` reads them into the tables the battle files re-export (`STATUS_MOVES`, `RECOIL_MOVES` and the rest). A move is added to a mechanic by adding it to that file; what the mechanic does with the number stays in `src/battle/moves/`.

## Expert builds

What the expert builder pays for a move or an ability lives in `src/data/builds/`, read by `src/data/builds/index.ts`:

| file                | holds                                                                   |
| ------------------- | ----------------------------------------------------------------------- |
| `status-moves.yaml` | each priced status move's `worth`, its `kind` (a `StatusKind`, Cripple when left out) and the split a setup `serves` |
| `attacks.yaml`      | a damaging move's `drawback` factor, or the `power` a move with none is worth |
| `abilities.yaml`    | an ability's `worth` against 100 for an ordinary one, and its `lean` (`offense` or `guard`) |

- **Every number decides an expert party.** Changing one changes the parties already staged in the world, so change them on purpose. `StatusKind` and `BuildRole` are in `src/data/ids/builds.ts`.

## Spawn pools

`src/data/biome/pools/<biome>.yaml` holds a biome's pools by surface (`land`, `water`, `ice`), then by time of day, then by rarity band, each band a map from species to weight, and the `cave-legends` met in the caves under it. `cave.yaml` and `town.yaml` hold the two shared pools under `pool:`.

- **A weight is a share of every roll**, in hundredths of a percent: `2010` is 20.1%, and a pool adds up to about 10,000. Only the `prized`, `special` and `mythical` bands keep fixed odds (1/512, 1/4096, 1/4096); everything else is one draw by weight.
- **Bands base to elusive are labels.** They decide how rare a species reads (candy, level, badge) and which rank a landmark draws from, not how often it is met. A species is filed in the band its line puts it in.
- **A surface's pool is everything met on that surface.** Nothing is borrowed from another surface, so a water pool lists every species met on water.
- Each band is written heaviest first, and a species is written once per band. Two times that share a pool write it once and point at it: `day: *land-morning`.
- `prized` is the weight every prized species shares, and `Unown: forms` lays down each Unown form at weight 1.
- `test/data/spawn-balance.test.ts` holds the pools to a few rules: no species is most of a pool, no evolution is met much more often than what it evolves from, and every drawn wild line can be met somewhere.

## Abilities

An ability is a name and a line, so all of it is text: `text/en/abilities/gen-N.yaml`, grouped under a comment naming the line that introduces it, `text/en/abilities/signature/<region>.yaml` for the signatures, and `text/en/abilities/special.yaml` for the marks of what a pokemon is (Boss, Shadow, Totem, Totem Ally, Purified). Which family is granted which signature is `src/data/abilities/signatures/<region>.yaml`, under `families:`, with a regional line's own under `forms:`. A family is filed under the region its species files are.

`src/data/abilities/flags.yaml` lists the abilities a mechanic treats apart, by flag: `unreceivable` (Receiver and Power of Alchemy skip them), `protected` (nothing disables them), `mold-proof` (Mold Breaker cannot see past them) and `always-known` (the AI knows them without a cue). Each list keeps its order.

## Items

A file per family in two folders, each item keyed by name:

| folder                 | holds                                                         |
| ---------------------- | ------------------------------------------------------------- |
| `items/records/`       | type, icon (`sheet/name`), flags, buy and sell; flags and prices left out for none. Also the one thing the item names, where it names one |
| `text/en/items/`       | each name, and a written-out `description` where the line is the item's own |

- **A line that follows a table is a template.** The family's text file keeps the sentence under `templates:` with `{placeholders}`, the item leaves its `description` out, and the family's `describeX(item)` fills it in with `itemText` from the table the engine reads (the `registry-descriptions` skill). The describer is listed in `DESCRIBERS` in `src/data/items/index.ts`.
- **The family order is `ITEM_FAMILIES` in `src/data/items/index.ts`**, and a shelf lists a type's items in that order, each file's in the order it writes them. A new family is added there.
- **Which thing an item names is a record field; what it does with it stays in the family's TS file.** The type a gem lifts and the Mega a stone opens are written on the record, and what a berry does or how a lifted type is lifted is code. The family's TS file builds its table (`GEMS`, `MEGA_STONES`) out of its records with `recordField` or `readFamilyRecords` from `items/yaml.ts`, in the order the file writes them. The fields:

  | field                  | on                                                  |
  | ---------------------- | --------------------------------------------------- |
  | `mega`, `forms`        | a Mega Stone: its Mega, and the Megas of the species' other forms |
  | `z-type`, `z-move`     | a type Z-Crystal: the type it turns and its Z-Move  |
  | `holders`, `move`, `z-move` | a signature Z-Crystal                          |
  | `species`, `pairs`     | a whole fossil's species; a top half's `{ bottom: species }` |
  | `lifts`                | a gem, plate, incense or type booster: the type it lifts |
  | `move-type`            | a Drive or Memory: the type it gives its move       |
  | `tera`                 | a Tera Shard's type                                 |
  | `stat`, `fills`        | a vitamin, wing or power item's stat; the stat a Max one fills |
  | `nature`               | a mint's nature                                     |
  | `calls`                | a raid item's mythical                              |
  | `stage`                | an X item's stage                                   |
  | `restore`, `cures`, `revives`, `bitter` | medicine: health (`full` for the pool), statuses (`all` for every one), a revive's share, herbal mouthfuls |

- The machines are generated from the learnsets, so they have no records, only templates.

## Rules

- **Names, not numbers.** Write things the way the code names them: `Arcanine`, `FlareBlitz`, `FireStone`, `UsedItem`, `Contact`. Each registry's `yaml.ts` loader checks every name against its enum through `src/data/ids/names.ts` and fails the load on a typo.
- **A new enum member needs `pnpm id-names`** before the YAML can use it. It rewrites the name tables and the JSON Schemas in `src/data/schema/`, and a test fails when either is out of date. The schemas are for the editor only (completion and squiggles through the Red Hat YAML extension, mapped in `.vscode/settings.json`); the loaders are still what decide whether the data is right, so a field added to a loader is added to `scripts/data/schemas.ts` too.
- **Keep a file readable in one sitting.** When a file grows past a few hundred lines, split it the way its neighbours are split rather than letting it grow.
- **Comments are welcome.** They say why a value is what it is, the way they did in the code.
- **Behaviour stays in TypeScript.** Rules that choose a form (`species/forms.ts`), building a Mega, Zenith or true shadow from its base species, weather pairings, and anything that runs in a fight are code. The Mega and Zenith tables themselves are YAML.

The build turns each `.yaml` file into a module (`scripts/vite/yaml.ts`), so the browser never parses YAML.
