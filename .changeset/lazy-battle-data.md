---
'overwander': minor
---

The data a fight needs is fetched when something needs it, rather than shipped
with the first frame.

- `registerWorldData()` at boot registers the species and the spawn pools,
  which is what the overworld reads to draw itself. Moves, abilities and items
  are dynamically imported by `ensureBattleData()` on first ask, memoized, and
  prefetched behind the first frame once the app has mounted.
- Panels that read one of those registries — the box, the dex, the bag, the
  gifts, the quest board, a catch sheet, a fight — sit inside a `BattleData`
  boundary that waits for them. The server has no first frame to protect, so it
  takes the whole dex at import instead and every privileged read stays
  synchronous.
- The battle engine and the modules that field one are loaded only when a fight
  starts: the raid and trainer builders split into a record half both sides
  read and a fight half only a browser does, and the battle view is a
  `clientOnly` component.
- The engine leaves the eagerly loaded chunks: the move and item registries are
  now two chunks of their own, and the engine rides with the battle canvas in
  the chunk a fight fetches.
