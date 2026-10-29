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
- **The Companion Trail is the easy one**, after the DPPt partners. A partner NPC meets the player at the entrance and walks the trail with them. Every fight is a double battle with the partner's pokemon on the player's side, driven by the AI, as raids already put several teams on one side. The partner heals the player's party after every other fight. At the exit the partner gives something of their own. Its run rewards are weaker than the other kinds', and its floors carry no puzzles.

  | Partner | Their DPPt route | Partner's pokemon | Trail stands in | Gift |
  | --- | --- | --- | --- | --- |
  | Cheryl | Eterna Forest | Chansey | Forest | Lucky Egg (Chansey's own held item) |
  | Mira | Wayward Cave | Kadabra | Cave | Twisted Spoon (Kadabra's own held item) |
  | Riley | Iron Island | Lucario | Island | A Riolu egg, as in DPPt |
  | Buck | Stark Mountain | Claydol | Volcano | Flame Orb |
  | Marley | Route 228 | Arcanine | Rough route | Quick Claw |

  The gift comes on the first clear only, and later clears pay a little gold. Buck's and Marley's gifts are this game's own picks, since the mainline gives none.
- **Floors are walked on the board**, the way the mainline games' hideouts and caves are, never drawn as a map inside a dialog. How a floor is generated is under "Floor generation" below.
- **Trainers engage by line of sight.** A wild guardian horde is a cell walked into.
- **The seven kinds:**

  | Kind | Replaces | Floors | Who fights | At the end |
  | --- | --- | --- | --- | --- |
  | Hideout | The syndicate boss's rare roll on its stop, which keeps only its grunts | Several, each with a puzzle theme | Grunts in the rooms, an executive at the stairs | The syndicate boss |
  | Legendary lair | Nothing: it stands beside today's single-fight lair, which stays | Several, each with a puzzle theme | Wild guardian hordes of up to 6 of the biome's species, not catchable, stronger each floor | The same legendary as the lair beside it, which cannot flee |
  | Elite Four tower | The `EliteFour` and `Champion` landmarks | Four, one member each, in a straight ladder | Each member's own team, with their trainers on the floor | The Champion |
  | Victory Road | Nothing: it is new, one in front of each Elite Four tower | Several, each with a puzzle theme | Strong trainers in the rooms | The way into its own tower: clearing it opens that tower, and only that one, for good |
  | Battle Frontier | The `FrontierBrain` landmark | Seven, in a straight ladder | Trainers with three from the Factory's rental crate, under the Brain's house rule | The Brain |
  | Endless Stair | Nothing: it is new, apart from the Frontier | Endless, in a straight ladder | Trainers, against the player's own team | No end: the floor reached goes on a leaderboard |
  | Companion Trail | Nothing: it is new | Several | Trainers only, fought as double battles beside a partner NPC | The partner's gift |

- **Art:** a hideout is `dark-cobbles` and the `ring-cliff` recoloured slate; a lair floor is the cave exactly as the cave layer draws it. Spinner arrows, barriers, barrier switches and cracked floor are drawn in code, the one agreed exception to "no drawn stand-ins".

## Floor generation

PR #141 laid every floor out as a grid of equal 5×5 rooms joined by a random depth-first tree, with one gimmick over the whole floor. This design keeps its solver check and replaces the rest.

1. **Seed.** A floor is seeded by the dungeon's cell, the window and the floor's number, so every player meets the same floor in a window, as with raids. The server derives the same floor to check a run. Nothing on a floor is placed on the world, so the frozen generation and `world.draws` are not involved.
2. **A path plan first.** The floor starts as a graph, not a map:
   - a main path from the entry to the stairs, 4 to 6 rooms on the first floors and 8 to 10 deeper down;
   - puzzle rooms on the main path as gates, the way on opening only once the puzzle is solved;
   - the stairs' guard in the main path's last room;
   - side branches off the path, each ending in a stash, a trainer or a key;
   - 1 or 2 loops, so going back is not always through a dead end.
3. **Rooms.** The floor's rectangle is split by a binary partition, and each part takes a room of its own size, from 5×5 to 11×9 cells. Puzzle rooms take the bigger sizes.
4. **Pathways.** Corridors 1 or 2 cells wide join doorways with L or Z bends. A lair's corridors wander like a cave's, and a hideout's run straight.
5. **Who stands where.** Trainers face down corridors so their line of sight covers the way through. Hordes stand in rooms, and stashes sit at dead ends.
6. **Check, then cells.** A search walks the floor from the entry to the stairs, puzzles included. A floor that fails is drawn again, and after a set number of tries the floor settles for a plain maze. Only a floor that passes is laid out in cells on the board.

```
 ┌───────┐        ┌─────────────┐
 │ ENTRY ├────────┤  ICE ROOM   │
 └───┬───┘        │  (gate 1)   │      ┌─────┐
     │            └──────┬──────┘      │stash│
 ┌───┴──┐                │             └──┬──┘
 │trainr│         ┌──────┴──────┐  ┌──────┴──┐
 └──────┘         │  BOULDERS   ├──┤   key   │
                  │  (gate 2)   │  └─────────┘
                  └──────┬──────┘
                    ┌────┴────┐
                    │ guard + │
                    │ STAIRS  │
                    └─────────┘
```

## Puzzles

A floor has one puzzle theme, as a gym has one gimmick: the first puzzle room teaches it, the second is harder, and a third, where there is one, guards a stash instead of the way on.

| Puzzle | After | How a room is generated |
| --- | --- | --- |
| Ice sliding | Pryce's and Candice's gyms, Ice Path | Rocks scattered, then a search of where each slide stops from the doorway. A layout is kept when the shortest solution is long enough |
| Boulders | Strength caves, boulders onto switches or into holes | Worked backwards: from the solved room, boulders are pulled away from their goals, so the room is always solvable |
| Rotating gates | Fortree Gym | Turnstiles placed, then a search over every gate's turn for the fewest pushes |
| Warp pads | Silph Co., Mossdeep Gym | Islands joined only by pads, a few of which lead back. The pad network is the puzzle |
| Conveyors and spinners | Rocket Hideout | Arrow lanes, some with no way off, searched as one-way links between cells |
| Barrier switches | Sunyshore Gym | Two sets of barriers, one open at a time, searched over the switch's state |
| Cracked floor | Sky Pillar | A tile holds once. Falling drops the player to the floor above, never out of the run |
| Dark floor | Flash caves | Pitch black past 2 cells. Illuminate, Flash or the Explorer Kit sees 5 |

- **Difficulty comes from the search**, which knows a room's shortest solution. Each floor depth has a band to land in, and deeper floors take bigger rooms with longer solutions.
- **Nothing locks a player in.** Leaving a puzzle room and coming back resets it, the way a mainline cave resets its boulders. The main path never asks for a field move: Cut, Rock Smash and Surf blocks close side branches only, and keys and locked doors sit on the same floor.
- **Themes by kind:**
  - Hideout: conveyors, spinners, warp pads, barrier switches and locked doors.
  - Legendary lair: ice, boulders, cracked floor and dark floors.
  - Victory Road: boulders, ledges and rotating gates, one per floor.
  - Companion Trail: none.
  - Elite Four tower, Battle Frontier and Endless Stair: none. Each floor is one room in a straight ladder.
- **Who checks what.** The browser plays the puzzles. The server checks what moves a run: fights won, stairs taken in order, and each stash claimed once per window, deriving the floor from its seed to confirm the stash is there. A player who cheats a puzzle skips only the walk, never a fight or a prize.

## Prizes

For now, until play shows they need moving. Everything here is paid in what the game already pays with: gold, items, a caught pokemon at a level with a shiny boost, and awards. Each kind pays once per window, as raids do.

| Kind | Prize |
| --- | --- |
| Hideout | Gold for each grunt and executive. The boss pays what a syndicate stop pays today, plus the boss's mark on the first clear |
| Legendary lair | The same legendary as the lair beside it, which cannot flee, with a 16× shiny boost instead of a raid's 8× and 3 perfect IVs. Each floor's hordes leave items |
| Elite Four tower | Today's badges, marks and Champion titles, moved to the top floor, plus gold for each floor |
| Victory Road | Opening its tower for good, plus gold and one rare item on the first clear |
| Battle Frontier | Today's silver and gold symbols, plus gold for each floor |
| Endless Stair | A place on the leaderboard, plus a prize the first time each 8th floor is reached: a Bottle Cap through floor 40, a Golden Bottle Cap from floor 48 on |
| Companion Trail | The partner's gift on the first clear, a little gold after |

### Gold

Settled in [docs/debates/dungeon-gold/debate.md](../debates/dungeon-gold/debate.md).

- **A fight pays what the same foe pays as a stop** (`src/overworld/stop/gold.ts`), and the run's end pays its boss's purse. A run that fails is still paid for the fights it won.
- **Once per window.** Each fight's purse is keyed by the dungeon, the window, the floor, the room and the player, the way a stop's is, so a run restarted after a loss refights for nothing it was already paid.
- **At most 2 paying fights in a floor's rooms**, plus the stairs' guard.
- **Luck Incense** doubles each purse, as it does every purse today.

| Kind | Rooms, each fight | Stairs guard | End | A run's mean |
| --- | --- | --- | --- | --- |
| Hideout, 3 to 5 floors | Grunt, 5k to 15k | Executive, 40k to 90k | Boss, 120k to 250k | 440k to 610k |
| Legendary lair, 3 to 7 floors | Horde, 10k to 25k | Horde, 25k to 60k | Legendary, 80k | 310k to 620k |
| Elite Four tower, 4 floors | Ace trainer, 25k to 60k | Member, 50k to 110k | Champion, 150k to 300k (a legend seat 250k to 500k) | about 885k |
| Victory Road, 3 to 5 floors | Ace trainer, 25k to 60k | Ace trainer, 25k to 60k | Nothing: the tower's gate | 380k to 640k |
| Battle Frontier, 7 floors | None | Factory trainer, 25k to 60k | Brain, 200k to 400k | about 600k |
| Endless Stair | None | None | None | 2,500 × the floor, once per account, on each 8th floor |
| Companion Trail, 3 to 5 floors | Trainer, 2,500 to 7,500 | Trainer, 2,500 to 7,500 | The partner's gift | 45k to 75k |

The Endless Stair pays no gold per floor, because it has no window and its easy floors would be farmed. Each purse goes through `grantGold` with a reason of its own (`dungeon-reward`, `stair-milestone`), so the ledger shows after release what dungeons pay beside stops and raids.

## The order

| # | Batch | Content |
| --- | --- | --- |
| 0 | Questions | Everything under "Still to decide", answered before anything is built |
| 1 | Runs | The `dungeon_runs` table and migration, the server functions that open, advance, fail and clear a run, the party lock (candy, Nurse Joy and items refuse a locked catch), and the window sweep |
| 2 | Floors | The floor generator under "Floor generation": path plan, partitioned rooms, corridors, contents and the solver check, in `src/overworld/`, pure and tested |
| 3 | Walking | The floor layer on the board: entering, stairs, line-of-sight trainers, hordes, and leaving |
| 4 | Elite Four tower | The straight ladder first, since it needs no gimmicks: four floors and the Champion, replacing the `EliteFour` and `Champion` landmarks. The Champion's title, rewards and standings move to the top floor |
| 5 | Battle Frontier | Seven floors under each Brain's house rule, replacing the `FrontierBrain` landmark |
| 6 | Endless Stair | The endless ladder and its leaderboard |
| 7 | Companion Trail | The partner NPCs, the AI partner on the player's side, the heal every other fight, and the gift at the exit |
| 8 | Puzzles | Each puzzle under "Puzzles", with its room generator, its search and a test, plus field-move blocks, keys and ledges on side branches |
| 9 | Victory Road | The puzzle floors before the tower, and the tower's gate on clearing it |
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

- **Prize items:** which rare item Victory Road gives on its first clear, and which items hordes leave, for batch 12 to pick.

## Pace

- **One batch per PR, stacked.** Batch 0's questions come 4 at a time.
