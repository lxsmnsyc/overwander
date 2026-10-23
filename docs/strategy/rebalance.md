# Re-balancing strategy

How the experts are buffed, and how the signature abilities are measured, and how the ones that sit too far from the rest, or that write by hand what a move already does, are reworked.

## Where things stand

- **About 550 signatures** across nine generations, in `src/battle/abilities/signature/gen-*`, one per evolution family plus the shared frames of legendary groups, starter trios and counterpart pairs.
- **Each was approved as a concept, one at a time.** None was measured against the others.
- **Few signatures fire a move.** `unit.triggerMove(...)` lets an ability cast an existing move, the way Drought casts Sunny Day, so the move's own numbers, rules and picture apply. Only about 60 of the 550 use it, and unevenly: 17 in Galar and 13 in Johto, but 1 in Hoenn and 2 in Kalos. The rest write their weather, statuses, stat changes and heals by hand.
- **The engine already runs without a screen.** `test/battle/harness.ts` builds a battle, the trainer AI picks moves (`src/battle/ai/`), and `battle.tick(ms)` drives time.

## Decided

- **Measure, then propose.** A headless simulation ranks every signature by how much it moves the win rate, and only the outliers are put up for rework.
- **A weak family's signature is raised too.** A signature is the family's one thing of its own, so it pulls its weight within its tier, and the family's base stats are what keep it weak.
- **Signatures only.** Mainline abilities and items keep their mainline behaviour in real time. One is touched only where it breaks a signature's numbers, and that fix is put up as a question of its own.
- **Move-firing signatures are part of the rework.** Wherever a signature writes by hand what a move already does, it is reworked to fire that move. Every rework question offers at least one concept that fires a move.
- **Reworks are proposed 4 at a time**, through questions, each with 3 or 4 options. A rework keeps the family's theme and its frame where it shares one (`signature-abilities`).

## Expert buffs

The league's top and the syndicates' top all fight at the level cap, and rank shows in the loadout instead. Today every expert fields 4 moves ([`best-moves.ts`](../../src/overworld/builds/best-moves.ts) `BEST_MOVE_COUNT`), and their levels and loadouts live in [`stop/levels.ts`](../../src/overworld/stop/levels.ts) and [`stop/outfits.ts`](../../src/overworld/stop/outfits.ts).

| Rank | Level today | Level | Moves | Items | Abilities |
| --- | --- | --- | --- | --- | --- |
| Gym Leader | 45 to 65 | 60 to 90 | 4 | 1 | 1 |
| Elite Four, syndicate executives | 65 to 85 | 100 | 6 (from 4) | 2 (from 1) | 2 |
| Champions, syndicate bosses | 85 to 100 | 100 | 7 (from 4) | 3 (from 2) | 3 (from 2) |
| Legends | 100 | 100 | 8 (from 4) | 4 (from 3) | 4 (from 3) |

- **The gym band fills the gap** between roadside trainers (40 to 60) and the league at 100.
- **Frontier Brains are unchanged:** 100, with 4 moves, 2 items and 2 abilities.
- **The builds learn to fill more than 4 moves.** The move picker takes the count from the outfit, and its coverage and role rules scale with it. The held-item and ability pickers do the same.
- **Every count stays inside the catch caps** (8 moves, 8 items, 4 abilities), and a pokemon whose pool has fewer abilities than its outfit allows fields what it has.

## How a signature is measured

- **The fight.** A family's final stage, at a fixed level with its usual moves and its usual item, fights a pool of opponents of its own tier. The same fight is run twice from the same seeds, once with its signature and once with a neutral filler from its own pool.
- **The number.** The signature's lift is the difference in win rate between the two. A wide sample of seeds keeps the noise below the gap being measured.
- **Tiers.** Lift is read against the family's tier (route families, pseudo-legendaries, legendaries, mythicals), so a legend is not compared to a route pokemon.
- **What it cannot see.** Raids, Max Raids and 2v2 fights are run as their own pools, since a support signature only shows there.
- **Frames.** Signatures from one factory (the Cue frame, the Sworn pair, the Ruin four) are read side by side, so one member does not drift from the rest.

## The order

| # | Batch | Content |
| --- | --- | --- |
| 0 | Expert buffs | The table above: the level bands, the outfits' move, item and ability counts, and the builds filling them, with tests. Shipped first, since it is decided and needs no measuring |
| 1 | Simulator | `scripts/balance/`: build the pools, run a family both ways across seeds, write a table. Deterministic from its seeds, so a run can be repeated |
| 2 | First run | Every signature measured, written to `docs/balance/signatures.md` as a ranked table with each tier's spread |
| 3 | Move audit | Every signature that writes by hand what a move already does (a status, a stat change, weather, a terrain, a screen, a heal, a trap), listed with the move it would fire, in the same table |
| 4 | Bounds | You set the band a signature should land in for each tier, from the table |
| 5 onward | Reworks | The signatures outside the band and the ones the move audit found, worst first, 4 at a time. Each batch is reworked, re-measured and checked against the band |

## What every rework batch does

1. **Branch** `rebalance-<slug>`, stacked on the previous batch, linked with `gh stack link`.
2. **Propose** 4 signatures at a time: each with its measured lift and 3 or 4 reworks, which may be a retune of numbers or a new mechanic.
3. **Build** the approved rework, update its description (`registry-descriptions`) and its test against real engine state.
4. **Re-measure** the batch with the simulator and write the new numbers into the table.
5. **Team suggestions:** re-check the rows in `docs/teams.md` that lean on a reworked signature.
6. **Changeset**, `patch`, one line per signature changed.
7. **Checks:** `pnpm test`, `pnpm typecheck`, and `rtk proxy pnpm exec oxlint src test`, read by its exit code.

## Still to decide

- **The band per tier**, from the first run (batch 4).

## Pace

- **The simulator runs one family at a time** on this machine, never in parallel.
- **One batch per PR, stacked.**
