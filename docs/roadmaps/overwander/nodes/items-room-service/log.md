# Log: items-room-service

- Trick Room kept its state inside `src/battle/moves/trick-room.ts` with no event for the room going up. Added `BattleEvents.StartTrickRoom` (157), emitted once when a casting raises the room and not when a second casting takes it down.
- `src/battle/items/room-service.ts` listens on it at Post, spends the item on every living unit that holds it and drops its Speed one stage.
- Registered like the other one-shots: record and en/es/ja text in the `one-shots` family, and `ONE_SHOTS` in `src/data/items/one-shots.ts`, which is what puts it on the market and in the `one-shots` item-pool family without a pool edit. The `held/room-service` icon already existed.
- Moved `RoomService` out of the "blocked" TODO in `src/data/ids/items.ts`.
