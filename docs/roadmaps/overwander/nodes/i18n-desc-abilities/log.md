# Log: i18n-desc-abilities

- Dumped the English lines with the official ja and es names to the scratchpad, wrote a key-to-ja/es table per file and merged with a script that checks keys, full stops, kanji, dashes, double spaces, numbers and the official names of every ability, move or item a line names.
- Gluttony's English said treats lift a throw "1.5x as far"; the engine raises the cap on the treat bonus (`CheckTreats`). Fixed in a separate `fix:` commit.
- `special.yaml` and three `legends-za.yaml` abilities have no official name, so their ja and es entries hold a description only.
- The test now lists the abilities from the English text (all but `signature/`), minimum 300 (318 present).
- Ran `pnpm official-names` after the merge: no diff, descriptions kept.
