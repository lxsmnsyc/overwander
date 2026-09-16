---
'overwander': minor
---

A world can be grown with a second generation, which never repeats and keeps its placements steady.

- The live world is unchanged. A new seed can opt in with `VITE_WORLD_GENERATION=2`.
- The second generation's terrain fields do not tile, where the first repeats every 6,144 chunks.
- Its rock and water edges carry a finer octave, and every biome keeps the share of the world it has now.
- Adding a roll to how the second generation places things no longer moves anything already placed.
- The board and world demos can show either generation.
