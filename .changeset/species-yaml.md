---
'overwander': patch
---

The species data is now written as YAML: a folder per field (`world`, `stats`, `abilities`, `learnsets`), with each region's families filed in blocks of 25 dex numbers, and names in `src/data/text/en/species.yaml`. Nothing about the species themselves changes. The build checks every name in the files against the game's own ids, so a typo fails the build instead of reaching a fight.
