# Dungeon strategy

How landmarks with floors come to the game: syndicate hideouts, explorable legendary lairs, Victory Road, the Elite Four tower, the Battle Frontier, the Endless Stair and the Companion Trail. It is written fresh on today's `main`. PR #141 (`git fetch origin pull/141/head:dungeons`, last commit `cca72e31c`) is a reference for ideas and nothing is merged from it.

## Where things stand

- **The landmarks a dungeon would take over exist as single fights:** `TeamRocket` (and the other syndicates' stops), `LegendaryLair`, `EliteFour`, `Champion` and `FrontierBrain` in `src/data/ids/landmarks.ts`.
- **Caves already show how a walkable layer works** (`src/overworld/cave.ts`, `world-caves.md`): the player leaves the board for terrain of its own, walked on the same grid.
- **What moved since #141 that a fresh build has to follow:**
  - The world's first generation is frozen. Anything placed on the ground goes to the live generation through named `world.draws(key)` rolls, and the fingerprint test must not move (`world-generation`).
  - The server reads and writes Postgres through `src/server/`, with no row policies: each server function decides who may act (`server-reads`, `server-function-validation`).
  - NPCs are `createNpc` folders that talk through forms (`action-forms`).
  - The board draws terrain from the new sheet, with terraces and cliffs (`terraces`, `board-modes`).

## Decided

The spec the earlier design settled stays, unless a batch's questions change it:

- **Names stay off the mainline facilities**, so those can be added later as themselves: the endless climb is the Endless Stair, not a Battle Tower, which is Anabel's in the Frontier.
- **A run.** The entrance is a landmark outside towns, cleared once per window like a raid. Failing lets the player start again from floor 1 in the same window. The party is locked at the entrance, HP, status and fainting carry from fight to fight, and only the player's own medicine heals. Losing any fight ends the run.
- **The Elite Four tower plays by the same run rules**: locked party, only your own medicine, once per window, a failed climb starting again from the first floor.
- **The Endless Stair** locks the party too, and only the player's own medicine heals it, except for a full heal after every 8th floor. A climb can start at any time, and the best floor reached is the score.
- **The Companion Trail is the easy one**, after the DPPt partners (Cheryl, Mira, Riley). A partner NPC meets the player at the entrance and walks the trail with them. Every fight is a double battle with the partner's pokemon on the player's side, driven by the AI, as raids already put several teams on one side. The partner heals the player's party after every other fight. At the exit the partner gives something of their own, an item, an egg or a TM. Its run rewards are weaker than the other kinds'.
- **Floors are walked on the board**, the way the mainline games' hideouts and caves are, never drawn as a map inside a dialog. A room grid (3×3 up to 5×5 rooms with doors) is only the plan a floor is generated from.
- **Trainers engage by line of sight.** A wild guardian horde is a cell walked into.
- **The four kinds:**

  | Kind | Replaces | Floors | Who fights | At the end |
  | --- | --- | --- | --- | --- |
  | Hideout | The syndicate boss's rare roll on its stop, which keeps only its grunts | Several, each with a layout gimmick | Grunts in the rooms, an executive at the stairs | The syndicate boss |
  | Legendary lair | Nothing: it stands beside today's single-fight lair, which stays | Several, each with a layout gimmick | Wild guardian hordes of up to 6 of the biome's species, not catchable, stronger each floor | The same legendary as the lair beside it, which cannot flee |
  | Elite Four tower | The `EliteFour` and `Champion` landmarks | Four, one member each, in a straight ladder | Each member's own team, with their trainers on the floor | The Champion |
  | Victory Road | Nothing: it is new, one in front of each Elite Four tower | Several, each with a layout gimmick | Strong trainers in the rooms | The way into its own tower: clearing it opens that tower, and only that one, for good |
  | Battle Frontier | The `FrontierBrain` landmark | Seven, in a straight ladder | Trainers with three from the Factory's rental crate, under the Brain's house rule | The Brain |
  | Endless Stair | Nothing: it is new, apart from the Frontier | Endless, in a straight ladder | Trainers, against the player's own team | No end: the floor reached goes on a leaderboard |
  | Companion Trail | Nothing: it is new | Several | Trainers only, fought as double battles beside a partner NPC | The partner's gift |

- **Layout gimmicks**, for hideouts and lairs, one per floor:
  - movement: spinner tiles, warp pads, ice floor, cracked floor;
  - access: field-move blocks (Strength, Rock Smash, Cut, Surf), locked doors with a floor key, barrier switches, one-way ledges;
  - visibility: dark floor (lit by Illuminate, Flash or the Explorer Kit), unmarked rooms, plain floor.
- **Art:** a hideout is `dark-cobbles` and the `ring-cliff` recoloured slate; a lair floor is the cave exactly as the cave layer draws it. Spinner arrows, barriers, barrier switches and cracked floor are drawn in code, the one agreed exception to "no drawn stand-ins".

## The order

| # | Batch | Content |
| --- | --- | --- |
| 0 | Questions | Everything under "Still to decide", answered before anything is built |
| 1 | Runs | The `dungeon_runs` table and migration, the server functions that open, advance, fail and clear a run, the party lock (candy, Nurse Joy and items refuse a locked catch), and the window sweep |
| 2 | Floors | The floor generator: rooms, doors, stairs and gimmicks from a seed, in `src/overworld/`, pure and tested |
| 3 | Walking | The floor layer on the board: entering, stairs, line-of-sight trainers, hordes, and leaving |
| 4 | Elite Four tower | The straight ladder first, since it needs no gimmicks: four floors and the Champion, replacing the `EliteFour` and `Champion` landmarks. The Champion's title, rewards and standings move to the top floor |
| 5 | Battle Frontier | Seven floors under each Brain's house rule, replacing the `FrontierBrain` landmark |
| 6 | Endless Stair | The endless ladder and its leaderboard |
| 7 | Companion Trail | The partner NPCs, the AI partner on the player's side, the heal every other fight, and the gift at the exit |
| 8 | Gimmicks | Spinners, warp pads, ice, cracked floor, field-move blocks, keys, switches, ledges and dark floors, each with a test |
| 9 | Victory Road | The gimmick floors before the tower, and the tower's gate on clearing it |
| 10 | Hideouts | The syndicate hideouts, placed through named draws on the live generation |
| 11 | Legendary lairs | The explorable lairs |
| 12 | Standings and rewards | Cleared runs in landmark standings, rewards per kind, release page |

## What every batch does

1. **Branch** `dungeon-<slug>`, stacked on the previous batch, linked with `gh stack link`.
2. **Server first:** a run's rules are decided by server functions, and the browser only shows them.
3. **Generation:** nothing placed on the ground moves on the frozen generation.
4. **Look at it** in `/demo/board` with `pnpm dev` and `pnpm db`.
5. **Changeset**, `minor` where something new exists.
6. **Checks:** `pnpm test`, `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test`, and `pnpm test:db` for the run tables.

## Still to decide

- **The Companion Trail's partners:** who they are, what each gives, and whether a trail's floors carry layout gimmicks.
- **Rewards** per kind, and what an explorable lair offers over the single-fight lair beside it (better odds of a shiny or a perfect catch, or rewards of its own).

## Pace

- **One batch per PR, stacked.** Batch 0's questions come 4 at a time.
