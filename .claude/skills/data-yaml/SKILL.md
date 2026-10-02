---
name: data-yaml
description: Species, moves, abilities and items are written as YAML, a folder per part of the record, and every name in them is checked against its enum when the data loads. Applies whenever adding, editing or reading species, move, ability or item data, or adding an enum member the YAML should be able to name.
---

The species, moves, abilities and items are data, not code. Each part of a record lives in a folder of its own, and the player-facing words live apart from the numbers under `src/data/text/<locale>/`, so a second locale is another folder beside `en/`.

## Species

Under `src/data/species/`, with a folder per region inside each field:

| folder                   | holds                                                                    |
| ------------------------ | ------------------------------------------------------------------------ |
| `world/`                 | types, egg groups, habitat, biomes, active hours, evolutions, form flags |
| `stats/`                 | base stats, catch rate, height, weight, gender ratio                     |
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
- **`active: any`** is every hour of the day. `base-form: false` marks a form, and `worn: true` a shape put on mid-fight. `dex` is written only where the id's own dex number would be wrong.

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
