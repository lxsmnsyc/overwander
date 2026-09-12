---
'overwander': minor
---

- The ground is drawn from tilesets: each biome has a ground, a cliff, water and paving, laid water first and seams last.
- Terraces stand up on the laid-back board, with a rock wall between one level and the next. Nothing is laid over the ground at the lip of a step: the top of a cliff is the country's own ground.
- The board is drawn as a scene with a depth buffer, so a cliff hides what stands behind it a pixel at a time and a sprite beside the corner of a step is covered exactly where the rock is nearer.
- The grid, the marks on a cell and a thrown shadow lie on the ground they belong to, so a cliff in front of them hides them and whatever stands there covers them.
- The picture is centred on the ground the player is standing on, so walking up a terrace carries the camera up with them and the ring round them is drawn on the level they are on.
- A cliff is a step between levels and nothing else. It stops a walk unless a road or water cuts through it.
- The dungeon tileset rips are gone, with the loader, the processor's three tileset tools and the scripts that wrote them: one pack of terrain answers every country now, and a battle's floor is that country's own ground tile.
- Water is laid in 2x2 blocks, so every water cell has three others square with it: a hairline river dries up rather than being drawn as a row of puddles, and no cell is left touching the water only at a corner.
- Water never sits at the lip of a step with dry ground below it. Where the ground below is water too the step is a fall, drawn in the water's own art rather than in rock, and nothing stops a crossing there.
- A fall carries a walk only where it runs one way. Water at the corner of a terrace, pouring off two sides of itself at once, is part of the cliff rather than a way down it.
- A step with a way through it, a road or a route, is drawn as a ramp: the cell slopes straight down the step to the ground below instead of standing a wall, so a step a player can climb no longer looks like a cliff.
- Only the edge between water and ground follows the camera. The rest of the country keeps its way round as the board is turned, so the ground no longer spins under a walk.
- Nothing above ground walls a cell off any more. The stone field still says where a hillside is, which is where a cave has its way in, which water may not stand on and where the shallows are drawn, but a step between two levels is the only thing on the surface that stops a walk.
- A volcano's lava stays in its crater: it dries off a cell short of the country's edge, so it never runs into an ordinary pool next door.
- Small islands break the surface of the open seas, a few cells of the country's own ground with a long way of water round them, so the sea is no longer featureless.
