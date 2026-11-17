# Log: items-pp-restoratives

- The ids sat under a TODO in `src/data/ids/items.ts`; replaced it with a doc comment.
- Records go in `records/medicine.yaml` as the brief says, as type `Held` with `Consumable, Holdable, Marketable`. The medicine reader skips a record with no restore, cure or revive, so they stay out of `MEDICINES`. Their table is `PP_RESTORATIVES` in `src/data/items/medicine.ts`.
- First tried the Medicine vendor shelf. `test/data/items.test.ts` says Honey is the only held item on it, and gear and one-shots are on no shelf either, so they are found only: weights in `item-pool.yaml` (Ether 6 and Elixir 4 in uncommon, Max Ether 5 and Max Elixir 3 in scarce).
- Every unit carries the plain attack and Struggle as moves with no cooldown, so "every move cooling down" ignores those two (`NOT_A_CHOICE`). Found when the first Elixir test never fired.
- Halving takes half of what is left (`progress` kept), so an Elixir on a move that has already run a while is not a bonus. An Ether's cooldown has just started, so it is half of the whole.
