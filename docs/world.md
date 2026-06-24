# The World

## Generation

### World Seed

- The world seed is a secret value used to initialize the RNG of the entire world.
- World seed defines (or rather "seeds") the noise function used to generate the biomes.

### Landmark

- Stop
- Gym
- Portal
- Nest
- Grotto

### Chunk

- A `chunk` is a piece of `world`. Each chunk has an specific `biome`, defined by `temperature`, `elevation` and `humidity` (by ranges `-1.0` to `1.0`)
- To initialize, an RNG instance will be created with a seed derived from:
  - the `world` seed
  - the X coordinate
  - the Y coordinate
- Biome can be defined immediately from the X and Y coordinate alone

### Biomes

- Tundra
- Taiga
- Ocean
- Deep Ocean
- Savanah
- Desert
- Forest
- Mountain
- Prairie
- Marsh
  