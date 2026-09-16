The world is read with one `Generation` (`src/overworld/world.ts`). **First** is the live world and its output never changes: `test/overworld/generation-fingerprint.test.ts` pins it. **Second** uses hashed simplex fields and keyed rolls, and is pinned too.

- Anything that places something on the ground (scenery, landmarks, towns, portals, cave mouths, start positions) takes its rolls from `world.draws(key)`, never a fresh `AleaRNG`.
- Every roll has a name: `draws.random('count')`. The first generation ignores it and reads in call order, so never reorder calls in an existing roll. The second keys on the name, so a new decision gets a new name.
- A helper that wants a plain source takes `sourceOf(draws, name)`.
- Clock-driven content (spawns, raids, NPCs, caches, nests) and the battle engine keep their own `AleaRNG` seeds.
- A second-generation field is `SimplexNoise(hashString(seed), salt, octaves)`, mapped onto the first generation's spread so thresholds cut the same proportions.
