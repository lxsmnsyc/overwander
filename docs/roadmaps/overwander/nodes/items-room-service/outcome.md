# Outcome: items-room-service

## Built

- `src/battle/items/room-service.ts`: `ROOM_SERVICE_STAGES` (1) and the held item, wired in `src/battle/items/index.ts`.
- `BattleEvents.StartTrickRoom` (`src/battle/events/names.ts`, `map.ts`), emitted from `src/battle/moves/trick-room.ts` when the room goes up.
- Record, en/es/ja text and the `ONE_SHOTS` entry, so it is sold and found with the other one-shots.
- `test/battle/items/room-service.test.ts`: the holder drops one Speed stage and spends the item; a room coming down does nothing.

## Deviations

- Files touched beyond the owned list: `src/battle/events/names.ts`, `src/battle/events/map.ts`, `src/battle/moves/trick-room.ts` (the new event), `src/battle/items/index.ts`, `src/data/items/one-shots.ts`, `src/data/items/records/one-shots.yaml`, `src/data/text/{en,es,ja}/items/one-shots.yaml`, `src/data/ids/items.ts`.
- A holder that takes the field while a room already stands is not served: the item answers the room going up only.

## Checks

- `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm exec oxfmt src test`.
- `pnpm exec vitest run test/battle/items/room-service.test.ts test/data/items.test.ts`: 65 passed.

## Left

- Nothing.
