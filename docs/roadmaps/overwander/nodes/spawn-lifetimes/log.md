# Log: spawn-lifetimes

- Branch feat/spawn-lifetimes from batch/overwander. Nothing of the wiring existed.
- Board: spawns come from `liveSpawns` for the chunks within `boardChunks`, with or without a window record (a no-record chunk gets a snapshot floored at now for the press path).
- Time: `nextSpawnEdge` in windows.ts plus an `awaitEdge` timer that rebuilds `live` at the soonest cycle edge.
- Server: `meetSpawn` takes `cell` and `individualValue`, calls `checkMeeting`; `INT32` exported from validate.ts.
- Tests moved: board-view, world-buddies, meetings fuzz, board-window (one assertion).
- Docs: world-time.md and encounters.md.
