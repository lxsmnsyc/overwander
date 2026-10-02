---
name: species-yaml
description: Species are written as YAML, one folder per field, with each region's families filed in blocks of 25 dex numbers, and every name in them is checked against its enum when the data loads. Applies whenever adding, editing or reading species data, or adding an enum member the YAML should be able to name.
---

The species are data, not code. Each field of the record lives in a folder of its own under `src/data/species/`, with a folder per region inside it:

| folder       | holds                                                             |
| ------------ | ----------------------------------------------------------------- |
| `world/`     | types, egg groups, habitat, biomes, active hours, evolutions, form flags |
| `stats/`     | base stats, catch rate, height, weight, gender ratio              |
| `abilities/` | `abilities` and `hidden`                                          |
| `learnsets/` | level, teachable and egg moves, plus a `family-teachable` list    |

Names and categories live in `src/data/text/en/species.yaml`, so a second locale is another folder beside it.

## Rules

- **A file is a block of 25 dex numbers** from the region's first (`kanto/051-075.yaml`), and holds every family whose lowest dex number falls in it. A short tail of 5 or fewer folds into the block before it, so Kanto ends at `126-151.yaml`.
- **Each family is keyed by its own name, with its species beneath it**, in the same block in every field. A species missing from one field fails the load, and so does one written twice or under two families.

```yaml
Growlithe:
  Growlithe:
    types: [Fire]
  Arcanine:
    types: [Fire]
```
- **Names, not numbers.** Write things the way the code names them: `Arcanine`, `FlareBlitz`, `FireStone`, `UsedItem`. The loader (`src/data/species/yaml.ts`) checks each against its enum through `src/data/ids/names.ts` and fails the load on a typo.
- **A new enum member needs `pnpm id-names`** before the YAML can use it. A test fails when the tables are out of date.
- **`family-teachable`, under a family, holds the moves the whole family can be taught.** Each species' `teachable` list adds to it.
- **`active: any`** is every hour of the day. `base-form: false` marks a form, and `worn: true` a shape put on mid-fight. `dex` is written only where the id's own dex number would be wrong.
- **Comments are welcome.** They say why a value is what it is, the way they did in the code.
- **Behaviour stays in TypeScript.** Rules that choose a form (`forms.ts`), the Megas and true shadows (built from their base species), and anything that runs in a fight are code.

The build turns each `.yaml` file into a module (`plugins/yaml.ts`), so the browser never parses YAML.
