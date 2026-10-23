# App logic strategy

How the game's logic moves out of the Solid components, so the UI layer draws and forwards input and nothing else.

## Where things stand

- **The engines are already free of the UI.**
  - `src/battle`, `src/overworld`, `src/data`, `src/model` and `src/core` import nothing from Solid.
  - `src/canvas` is drawing code with no Solid in it.
  - The only Solid file outside `src/components` is `src/auth/context.tsx`.
- **The app logic is not.** About 72,000 lines live in `src/components`, and much of it is state and rules rather than markup:

  | Component | Lines | Holds |
  | --- | --- | --- |
  | `overworld/chunk-canvas/index.tsx` | 4,487 | Chunk loading, the walk, encounters, the board's draw loop |
  | `overworld/overworld-tab/board.tsx` | 3,228 | What a board cell does when pressed, landmark flows |
  | `catches/catch-dialog/sheet.tsx` | 2,108 | Catch actions and their rules |
  | `battle/battle-canvas/index.tsx` | 1,827 | Turning engine events into what the field draws |
  | `app/game-context.tsx` | 968 | The game's session state: player, position, team, bag |

  The rest of `overworld/`, `catches/` and `battle/` follow the same pattern.

## Decided

- **It goes first**, before the Zeniths and every other plan. The translations pull strings out of these same components and the dungeons add new screens, so after the split each is written once, in its final place.
- **The point is the split, not a port.** No other platform is planned, so there is no public API. The server functions stay as they are.
- **The line:**
  - **Logic** lives in `src/game/`, as plain TypeScript. It holds state, applies rules, calls `src/auth/`, and exposes what the UI reads through a small observable store.
  - **UI** lives in `src/components/`. It reads those stores, renders, and forwards input as calls into `src/game/`.
- **No Solid in `src/game/`.** A store is a plain value with a `subscribe`. One adapter in `src/components/` turns a store into a Solid signal.
- **Drawing goes to `src/canvas`.** A component's draw loop moves into `src/canvas` as a plain function the component mounts, and lint keeps Solid out of `src/canvas` as it does `src/game`.
- **Tests:** a module in `src/game/` is tested without a DOM, the way the battle engine is.

## The order

Largest and most-used first, one area at a time, each leaving the game working.

| # | Batch | Content |
| --- | --- | --- |
| 0 | Store | The observable store, the Solid adapter, and a lint rule that refuses `solid-js` under `src/game/` |
| 1 | Session | `game-context.tsx` becomes `src/game/session/`: player, position, team, bag, settings |
| 2 | Battle | The event-to-picture mapping and the battle view's state out of `battle-canvas` and `battle-view` |
| 3a | Board renderer | `chunk-canvas` becomes `src/canvas/overworld/chunk-view`, the way the battle field became `src/canvas/battle/field` |
| 3b | Walk | Position, steps, journeys, Surf, Fly, Dig and Teleport, and step reports out of `overworld-tab/board.tsx` into `src/game/overworld/walk.ts` |
| 3c | Windows | Watched windows, snapshots and claims out of `board.tsx` |
| 4 | Overworld board | What pressing a cell does (NPCs, stops, lairs, seats, portals, eggs), out of `board.tsx` |
| 5 | Catches | The catch sheet, the box and the picker's actions and filters |
| 6 | Items and trades | Inventory, auctions, trades, gifts |
| 7 | Social | Raids, duels, friends, quests, profile |
| 8 | The rest | Admin, settings and the demo pages |

## What every batch does

1. **Branch** `app-logic-<slug>`, stacked on the previous batch, linked with `gh stack link`.
2. **Move, then thin.** The logic moves into `src/game/` with no behaviour change, then the component is cut down to rendering. Two commits, so the move can be read alone.
3. **Tests** for the moved module, without a DOM.
4. **Check** the area in the browser with `pnpm dev` and `pnpm db`: nothing a player sees changes.
5. **Changeset:** none for a pure move. Where a batch fixes something it found, `patch` for that.
6. **Checks:** `pnpm test`, `pnpm typecheck`, and `rtk proxy pnpm exec oxlint src test`, read by its exit code.

## Pace

- **One batch per PR, stacked.** No batch changes what the player sees.
