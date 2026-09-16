---
'overwander': minor
---

A world can be grown with a second generation, which never repeats and keeps its placements steady.

- The live world is unchanged. A deployment can switch to the second with `VITE_WORLD_GENERATION=2`.
- Positions, found towns, gym seats, raids, stops and claims are kept per generation, so switching hides the other world's instead of losing them.
- The second generation's terrain fields do not tile, where the first repeats every 6,144 chunks.
- Its rock and water edges carry a finer octave, and every biome keeps the share of the world it has now.
- Adding a roll to how the second generation places things no longer moves anything already placed.
- Working out the ground is faster on both generations.
- The board and world demos can show either generation.
