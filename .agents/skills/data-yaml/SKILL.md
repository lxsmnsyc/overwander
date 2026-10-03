---
name: data-yaml
description: Species, moves, abilities, items, the per-move battle numbers and the spawn pools are written as YAML, a folder per part of the record, and every name in them is checked against its enum when the data loads. Applies whenever adding, editing or reading species, move, ability, item, battle or spawn data, or adding an enum member the YAML should be able to name.
---

The species, moves, abilities and items are data, not code. Each part of a record lives in a folder of its own, and the player-facing words live apart from the numbers under `src/data/text/<locale>/`, so a second locale is another folder beside `en/`.

## Species

Under `src/data/species/`, with a folder per region inside each field:

| folder                   | holds                                                                    |
| ------------------------ | ------------------------------------------------------------------------ |
| `world/`                 | types, egg groups, habitat, biomes, active hours, evolutions, form flags, `held` items, `rank`, `awaiting` |
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
- **`egg-cycles`** is written only on the stage a line hatches at, and only where it is not 20.
- **`active: any`** is every hour of the day. `base-form: false` marks a form, and `worn: true` a shape put on mid-fight. `dex` is written only where the id's own dex number would be wrong.

## Regions

`src/data/species/regions.yaml` holds each region by its enum name: the `dex` numbers it covers, ends included, and, for a region with a dex chain, the `milestones` each rung asks for and the `medal` the last one hangs. A rung keeps its number for good, so milestones are appended, never inserted. The sprite folder names stay in `regions.ts` beside the enum.

## Moves

Under `src/data/moves/`, each part filed by generation and the stretch of moves it was written in (`gen-1/bulbasaur-to-blastoise.yaml`), every move keyed by its name:

| folder             | holds                                                                   |
| ------------------ | ----------------------------------------------------------------------- |
| `battle/`          | type, category, power, accuracy, priority, pp, target, affects, flags, steps, `projectile` |
| `cast/`            | the clips the caster plays, most wanted first, ending on a common one   |
| `text/en/moves/`   | each name and description, in the file of the same name                |

- `flags` and `affects` are lists of names (`flags: [Contact, Sound]`); leave `flags` out for none and `affects` out for the default the way the move is cast.
- `projectile: true` is a move that flies across the gap before it lands.
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

`src/data/battle/index.ts` reads them into the tables the battle files re-export (`STATUS_MOVES`, `RECOIL_MOVES` and the rest). A move is added to a mechanic by adding it to that file; what the mechanic does with the number stays in `src/battle/moves/`.

## Spawn pools

`src/data/biome/pools/<biome>.yaml` holds a biome's pools by surface (`land`, `water`, `ice`), then by time of day, then by rarity band, each band a map from species to weight, and the `cave-legends` met in the caves under it. `cave.yaml` and `town.yaml` hold the two shared pools under `pool:`.

- **A weight is a share of every roll**, in hundredths of a percent: `2010` is 20.1%, and a pool adds up to about 10,000. Only the `prized`, `special` and `mythical` bands keep fixed odds (1/512, 1/4096, 1/4096); everything else is one draw by weight.
- **Bands base to elusive are labels.** They decide how rare a species reads (candy, level, badge) and which rank a landmark draws from, not how often it is met. A species is filed in the band its line puts it in.
- **A surface's pool is everything met on that surface.** Nothing is borrowed from another surface, so a water pool lists every species met on water.
- Each band is written heaviest first, and a species is written once per band. Two times that share a pool write it once and point at it: `day: *land-morning`.
- `prized` is the weight every prized species shares, and `Unown: forms` lays down each Unown form at weight 1.
- `test/data/spawn-balance.test.ts` holds the pools to a few rules: no species is most of a pool, no evolution is met much more often than what it evolves from, and every drawn wild line can be met somewhere.

## Abilities

An ability is a name and a line, so all of it is text: `text/en/abilities/gen-N.yaml`, grouped under a comment naming the line that introduces it, and `text/en/abilities/signature/<region>.yaml` for the signatures. Which family is granted which signature is `src/data/abilities/signatures/<region>.yaml`, under `families:`, with a regional line's own under `forms:`. A family is filed under the region its species files are.

## Items

A file per family in two folders, each item keyed by name:

| folder                 | holds                                                         |
| ---------------------- | ------------------------------------------------------------- |
| `items/records/`       | type, icon (`sheet/name`), flags, buy and sell; flags and prices left out for none |
| `text/en/items/`       | each name, and a written-out `description` where the line is the item's own |

- **A line that follows a table is a template.** The family's text file keeps the sentence under `templates:` with `{placeholders}`, the item leaves its `description` out, and the family's `describeX(item)` fills it in with `itemText` from the table the engine reads (the `registry-descriptions` skill). The describer is listed in `DESCRIBERS` in `src/data/items/index.ts`.
- **The family order is `ITEM_FAMILIES` in `src/data/items/index.ts`**, and a shelf lists a type's items in that order, each file's in the order it writes them. A new family is added there.
- **Behaviour stays in the family's TS file**: what a berry does, how much a drink gives back, which type a gem lifts. The machines are generated from the learnsets, so they have no records, only templates.

## Rules

- **Names, not numbers.** Write things the way the code names them: `Arcanine`, `FlareBlitz`, `FireStone`, `UsedItem`, `Contact`. Each registry's `yaml.ts` loader checks every name against its enum through `src/data/ids/names.ts` and fails the load on a typo.
- **A new enum member needs `pnpm id-names`** before the YAML can use it. It rewrites the name tables and the JSON Schemas in `src/data/schema/`, and a test fails when either is out of date. The schemas are for the editor only (completion and squiggles through the Red Hat YAML extension, mapped in `.vscode/settings.json`); the loaders are still what decide whether the data is right, so a field added to a loader is added to `scripts/data-schemas.ts` too.
- **Keep a file readable in one sitting.** When a file grows past a few hundred lines, split it the way its neighbours are split rather than letting it grow.
- **Comments are welcome.** They say why a value is what it is, the way they did in the code.
- **Behaviour stays in TypeScript.** Rules that choose a form (`species/forms.ts`), the Megas and true shadows (built from their base species), weather pairings, and anything that runs in a fight are code.

The build turns each `.yaml` file into a module (`plugins/yaml.ts`), so the browser never parses YAML.
