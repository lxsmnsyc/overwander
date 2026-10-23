# App logic strategy

How the game's logic moves out of the Solid components, so the UI layer draws and forwards input and nothing else.

## Where things stand

The split is done on `app-logic-store`, waiting to be played and merged. Batches 0 to 6 shipped there; 7 and 8 were dropped (see below).

| Batch | Now lives in | Out of |
| --- | --- | --- |
| Store | `src/game/store.ts`, `components/app/store-signal.ts` | |
| Session | `src/game/session/` (walk, rewards, notices, due quests) | `app/game-context.tsx`, 968 lines, now an adapter |
| Battle | `src/game/battle/watch.ts`, `src/canvas/battle/field/` | `battle-view` (838 to 430 lines), `battle-canvas` (1,827 lines, now a mount) |
| Board renderer | `src/canvas/overworld/chunk-view/` | `chunk-canvas` (4,487 lines, now a mount) |
| Walk, windows, interactions | `src/game/overworld/` (`walk.ts`, `windows.ts`, `interact.ts`, `board-view.ts`, `challengers.ts`) | `overworld-tab/board.tsx` (3,228 to 1,456 lines) |
| Catches | `src/game/catches/candy-feed.ts`, `src/model/level-moves.ts` | `catch-dialog/sheet.tsx` |
| Items | `src/game/items/use-item.ts`, `src/game/details.ts` | `items/use-item.ts`, `details.ts` |

Lint refuses Solid and component imports under both `src/game` and `src/canvas`. The pattern each module follows is the `app-logic` skill.

**Left in the components on purpose:**
- Actions that are one server call and a toast: the catch sheet's rename, favourite, lock, release, evolve, fuse and held items, the trades and the gifts. Moving them adds a layer and separates nothing.
- View state: the box's scroll window, drag and drop, selection and drafts in the pickers.
- The raid lobby, duels, friends, quests, profile, admin, settings and the demo pages (batches 7 and 8). Their rules already live in `src/model` and `src/auth`; what is left is rendering.
- Anything that opens a form (`openForm`, `visitNpc`) or pushes a toast: a module in `src/game` asks for it through a callback.

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
| 5 | Catches | Candy feeding and the level-move questions out of the catch sheet |
| 6 | Items | Spending an item on a pokemon, and the words it is described in |

## What every batch does

1. **One branch, a commit per batch.** The batches landed on `app-logic-store` one after another rather than as a stack.
2. **Move and thin together.** Each commit moves the logic and cuts the component down in one step, with no behaviour change.
3. **Tests** for the moved module, without a DOM.
4. **Check** the area in the browser with `pnpm dev` and `pnpm db`: nothing a player sees changes.
5. **Changeset:** none for a pure move. Where a batch fixes something it found, `patch` for that.
6. **Checks:** `pnpm test`, `pnpm typecheck`, and `rtk proxy pnpm exec oxlint src test`, read by its exit code.

## Pace

- **One PR for the branch.** No batch changes what the player sees.
