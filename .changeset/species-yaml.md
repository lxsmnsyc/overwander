---
'overwander': patch
---

The species data is now written as YAML: a folder per field (`world`, `stats`, `abilities`, `learnsets`) with one file per family, and names in `src/data/text/en/species.yaml`. Nothing about the species themselves changes. The build checks every name in the files against the game's own ids, so a typo fails the build instead of reaching a fight.
