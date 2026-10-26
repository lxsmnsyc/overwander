# Zenith strategy

How every generation after Kanto gets its Zeniths, region by region, after [the app logic split](app-logic.md), the way [the Kanto Zeniths](../../src/data/species/zeniths/kanto.yaml) went in.

## Where things stand

- **Every region is done:** Kanto 49, Johto 40, Hoenn 50, Sinnoh 54, Unova 69, Kalos 26, Alola 60, Galar 54, Hisui 16 and Paldea 60, 478 Zeniths in all. Alola's count holds its 10 Alolan finals, Galar's its 8 Galarian finals, Hisui's its 10 Hisuian finals and Paldea's the Paldean Tauros. Batch 0 (Zenith shapes, Unown) is in.
- **The rules are held by `test/data/zeniths.test.ts`.** A Zenith belongs to a final stage with no Mega and no other held-item shape. It fights 100 above its base stat total, none of it in HP, and wears an ability its line can never be born with. Its shard id is `2000000 + dex × 100 + 01`, and the shard is buried in the prized band only where its line is met.
- **Still waiting, outside this plan:** Mr. Rime, and the Paldea pokemon whose sheets are not drawn yet, get their Zeniths when they are built. Bramblin, Toedscool, Rellor and Flittle wait for their final stages.

## Decided

- **Legendaries and mythicals get one**, as Kanto's birds and Mew did.
- **Shedinja and Smeargle get one.** Shedinja keeps its 1 HP, as every Zenith keeps its HP.
- **Shape-shifters get one**, Unown excepted: Castform, Darmanitan, Aegislash, Wishiwashi, Minior, Eternatus, Terapagos, and the other pokemon that change shape mid-fight (Mimikyu, Eiscue, Morpeko, Cramorant, Palafin, Meloetta). Each proposal says how the Zenith sits with the form change, such as whether the shape it changes into keeps the Zenith's stats.
- **Kept shapes share one shard.** A pokemon that is put into a shape for good, as a Meteorite does to Deoxys, has one Zenith with a Zenith shape for each kept shape (`forms` in the YAML), all wearing one ability. Whichever shape holds the shard fights as that shape's Zenith. The gap test counts these pokemon, and a test holds that every kept shape has its Zenith shape. Shapes take form slot 98 and down, after any regional final.
- **Born shapes share one shard too.** A form a pokemon is met in rather than changed into, such as a Trash Wormadam or an East Sea Gastrodon, gets a Zenith shape under the same shard, and a test holds that every same-region form has one. A true shadow gets none: nothing puts one right, and its counterpart's shard does nothing for it.
- **A shape only a held item makes gets no Zenith shape.** Ultra Necrozma needs its Ultranecrozium Z held where the shard would go.
- **A worn ability is checked against every shape's pool.** Lycanroc wears Moxie because a Dusk Lycanroc can be born with Tough Claws.
- **Unown gets none.** It joins Ditto in `NO_ZENITH`, with its reason in the comment.
- **Zygarde gets none.** Power Construct can take any Zygarde to the Complete Forme, which has a Mega, so the tests count a Mega of a shape an ability reaches as the whole pokemon's.
- **Regional finals get one** in form slot 98 and down, in the batch of the region whose form it is: Alolan Ninetales goes in with Alola, not Kanto. A regional final's Zenith wears an ability of its own, never its base line's Zenith ability: only shapes changed into in battle share one.
- **No two Zeniths of one region wear the same ability.** A later region may reuse an earlier one's.
- **A worn ability never copies one the line is born with.** Mummy is not offered to Runerigus, which has Wandering Spirit, nor Sand Stream to Sandaconda, which has Sand Spit.
- **A pokemon still waiting for its next stage waits for its Zenith too.** Galarian Mr. Mime is `awaiting: evolution` until Mr. Rime is in, and the gap test skips it.
- **Proposals come 4 pokemon at a time**, through questions. Each pokemon's abilities, ancestors' included, and its team role come first. Each question offers 3 or 4 concepts for one pokemon, each with its stat spread, worn ability and any type change, and every concept serves that role and ties to the pokemon's look or lore: an ability that undoes the pokemon's own best move, or a spread bent to fit the ability, is not offered. The question itself carries the pokemon's types, base stats, its total before and after, its abilities and its role, and each option shows the change on every stat it moves. Before a round goes out, every option is checked against the abilities the region has already approved, so nothing taken is offered again. A region is built once every pokemon in it is approved.

## The order

| # | Batch | Content |
| --- | --- | --- |
| 0 | Scaffolding | Unown in `NO_ZENITH`, and a way for a Zenith to carry through a form change in battle, so each shape-shifter's proposal can say what its other shape keeps. A test that lists, region by region, every eligible pokemon still without a Zenith, so each batch can see what it owes |
| 1 | Johto | 40 |
| 2 | Hoenn | 50, Deoxys included |
| 3 | Sinnoh | 54 |
| 4 | Unova | 69 |
| 5 | Kalos | 26 |
| 6 | Alola | 50, then the 10 Alolan finals of Kanto lines |
| 7 | Galar | 46, then the 8 Galarian finals |
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

## Pace

- **One region per PR, stacked.**
- **Proposals for the next round go up while the current one is in review.**
