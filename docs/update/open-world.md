# Open world

Open world takes the edges off the map. The board scrolls with you instead of
stopping at a chunk, caves run under the ground, and every region has a named
town to find.

Every pokemon, league and landmark from before is still here.

## A world with no edges

- **The board moves with you.** You stand in the middle of it and the world
  scrolls as you walk. There is no chunk boundary to cross and nothing to wait
  for at one.
- **The board is a circle**, so you see the same distance in every direction.
- **You can press anything you can see.** The country is drawn 20 cells out on
  every side, and every square of it can be walked to.
- **What is past a boundary is already live.** The board watches every chunk it
  straddles, so the far side is ready before you get there.
- **Borders wander.** Climate is read a cell at a time, so one chunk can hold
  two countries.
- **Lakes, rivers and ridges run on** from one chunk into the next instead of
  being grown inside one.
- **No more empty corridors.** Scenery, landmarks and pokemon can stand on any
  cell, where every chunk used to keep a clear rim.
- **Open country is quieter.** A chunk rolls 2 to 4 landmarks instead of 5 to 8,
  so what is out there is worth the walk.

## Caves under the world

- **A second layer sits under the first**, at the same coordinates. Step into a
  cave mouth and you are under the cell you stood on. Come out at another mouth
  and you surface as far across the world as you walked.
- **A cave is the way under a ridge** the surface makes you walk around. A
  network runs about seven chunks before it ends.
- **Caves have a spawn pool of their own**, the same at every hour: Zubat, Onix,
  Aron, Makuhita, Sableye, Mawile, Dunsparce, Larvitar and more.
- **There is plenty to find down there**: item caches, nests, Team Rocket,
  duelling trainers and both kinds of raid lair.
- **A cave under the open sea is its own network**, cut off by the shore.
  **Kyogre, Articuno and Lugia** keep their lairs there.
- **It is dark at every hour.** You see **2 cells** on your own, and **3** with
  an Illuminate buddy or the new **Explorer Kit**. The two do not stack.
- **The Escape Rope** takes you up at the nearest mouth, up to 8 chunks away,
  and is spent doing it.

## Towns

Each 8x8 chunk region with dry ground for one holds a **town**: a settled circle
28 cells across, with 9 to 14 lots.

- **Every town has a name**, built from its country and its county, such as
  **Rimefell Village, Ashmarch**. No two towns share a name.
- **Every town has a Pokemon Center** with Nurse Joy at the counter. She no
  longer wanders the open country.
- **A town holds the market, the auction board, a gym seat and the ladder.**
- **Walking in says the town's name**, every time you arrive.
- **A town found by one player is found for everybody.** Anyone can travel to
  it, and a town nobody has visited cannot be reached.
- **A portal asks for a town by name** and finishes the name as you type. It
  opens onto that town's plaza. Every region has exactly one portal, so the
  network reaches every country, the open seas included.
- **Streets run out of the plaza** to every lot, turning square corners and
  going round anything in their way.
- **Streets have their own pokemon**, the kind that live around people:
  Rattata, Meowth, Grimer, Voltorb, Magnemite, Zigzagoon, Kecleon and more.
  **Porygon** is met on town streets now rather than beside a portal.
- **The world map marks every town** in view at its real size.

## The ground is drawn from tilesets

Every biome has its own ground, cliff, water and paving.

- **Terraces stand up** with a rock wall between one level and the next.
- **A cliff hides what is behind it** a pixel at a time, and the grid, cell
  marks and shadows lie on the ground they belong to.
- **The camera climbs with you.** Walk up a terrace and the picture centres on
  the level you are standing on.
- **A cliff stops a walk** unless a road, a route, a natural pass or water cuts
  through it. Passes cross every cliff about every 20 cells.
- **A way through a step is drawn as a ramp**, so a climbable step no longer
  looks like a cliff.
- **Water on a step is a waterfall**, and you can always cross it.
- **Rivers are never a hairline of puddles.** Water is laid in 2x2 blocks.
- **Small islands break the open seas**, and the sea has scenery standing in it.
- **Beaches meet the sea at sea level**, with no cliff in between.
- **Routes between towns are beaten-earth trails** in each country's colours.
  Town streets are drawn as paths that tile and turn corners.
- **Lava stays in its crater** and never runs into the pool next door.
- **The ground keeps its way round** as you turn the board. Only the shoreline
  follows the camera.
- **A battle's floor is its country's own ground tile.**

## Landmarks, redrawn

- **A raid lair is a statue.** A shadow lair is the same statue in violet.
- **A lair no longer changes with its biome**, and a shadow lair is never
  boarded over.
- **A portal is a gatepost** with a poke ball set into it.
- **A gym seat carries the gym's own signage.**

## Fixes along the way

- **The sky follows the hour** instead of the biome. A cave shows darkness
  behind the board.
- **A lake or river in dry country holds only pokemon that belong there**: what
  swims, the Flying types and the hoverers.
- **Trees lose the flat shadow baked into their art**, so the board's own
  shadows are the only ones on the ground.
- **A savanna waterhole is a clear pond** rather than brown water that looked
  dried out.
- **The rocky coast's walls are grey sea stone**, matching its shingle.
- **A walk heads for its goal in a staircase** instead of going one way and then
  the other.
- **A live view reads once when it opens** rather than twice. A dropped
  connection still re-reads when it comes back.
- **The board keeps its subscriptions as it moves**, so a walk asks the server a
  fraction of what it used to.

## See also

- [Hoenn](hoenn.md), the release before this one.
- [Player's guide](../mechanics.md), for the rules in full.
- [Credits](../credits.md), for the people, libraries and art behind it.
