# Inbox

Work that is parked: blocked on art that does not exist yet, or not committed to. An entry becomes a node in `nodes/` once it is unblocked and given a priority.

## Blocked on art

The collection in `../SpriteCollab/compact` is checked against its `GAPS.md`. Each line keeps its reserved id, and its signature and fillers are already approved: build it the day its sheet lands.

### SpriteCollab lines

Galar, Hisui and Paldea are in, apart from what the collection has not drawn
(`../SpriteCollab/compact`, checked against `GAPS.md`). Each line below keeps
its reserved id, and its signature and fillers are already approved: build it
the day its sheet lands.

| Line | Signature | Fillers |
| --- | --- | --- |
| Rolycoly, Carkol, Coalossal | **Tar Coat**: Each Fire move it lands casts Tar Shot on the target. | Coalossal is full |
| Cufant, Copperajah | **Patina**: Each hit it takes turns it greener: +1 Special Defense, up to +3. | Copperajah: Thick Fat, Steelworker |
| Zarude | **Vine Swing**: Its moves wind up 30% faster against the last enemy that hit it. | Pickpocket, Tough Claws, Sap Sipper |
| Galarian Stunfisk | **Bear Trap**: The first contact move each enemy lands on it snaps shut: that enemy cannot act for 1 second. | Strong Jaw, Iron Barbs, Limber |
| Mr. Rime | Joins the Mime family's signature. | Full |
| Squawkabilly | **Pile On**: Its moves hit 1.3x a target a teammate has landed a move on in the last 2 seconds. Renamed from Gang Up, which is Scraggy's. | Keen Eye, shared by every plumage |
| Maschiff, Mabosstiff | **Snarl Reply**: A contact move landing on it makes it cast Snarl, at most once every 10 seconds. | Mabosstiff is full |
| Shroodle, Grafaiai | **Pilfer Dash**: Each time it takes an item off someone, its next move winds up 50% faster. | Grafaiai is full |
| Klawf | **Snap Back**: A contact move landing on it makes it cast Crabhammer at the attacker, at most once every 8 seconds. | Hyper Cutter |
| Bombirdier | **Heavy Load**: While it holds an item, it takes 0.85x from every hit. | Sniper |
| Flamigo | **In Step**: Its moves wind up 20% faster while a teammate is winding up a move at the same time. | Dancer |
| Brute Bonnet | **Fungal Feast**: It heals 1/8 of its HP each time an enemy falls asleep, from any source. | Effect Spore, Strong Jaw, Guts |
| Iron Jugulis | **Searchlight**: Its moves hit a target that is mid-Fly, Dig, Dive, Bounce or Phantom Force. | Sniper, Infiltrator, Keen Eye |
| Iron Boulder | **Rock Blade**: Its Rock moves count as slicing moves, so Sharpness's 1.5x reaches them. | Sharpness, Justified, Sturdy |
| Iron Crown | **Tachyon Edge**: Its slicing moves cannot miss and wind up 15% faster. | Sharpness, Justified, Clear Body |

Already built and waiting only for art: Wo-Chien and Chien-Pao (the Ruin
frame) and Okidogi (the Loyal Three's).

- [ ] Final stages, whose first stage ships as its line's end marked
      `awaiting: evolution`: Brambleghast, Toedscruel, Rabsca, Espathra.
- [ ] Forms not yet registered: Zarude Dada (with Zarude), Gimmighoul Chest,
      Squawkabilly's colours (with Squawkabilly), Terapagos Stellar, and every
      Gigantamax. Galarian Zen Darmanitan, Cramorant Gulping and Gorging, Morpeko
      Hangry, Calyrex Ice and Shadow Rider, Oinkologne's female and
      Three-Segment Dudunsparce are registered and wait only for their sheets.
- [ ] Zeniths for every line above and every final stage below, once each is
      built, Mr. Rime's included. The Zenith plan is finished and deleted; its
      rules are held by `test/data/zeniths.test.ts`, and the plan itself is in
      `git show 061577f96:docs/strategy/zeniths.md`.
- [ ] Falinks' own sheet, which retires its Brass stand-in and hidden id.
- [ ] Mimicry, with Galarian Stunfisk.

### Alola trainers

Skipped until five core trainers have overworld sprites. The Pokéngine Alola
collection (`10v2m11k`) has only a placeholder for each, and no other upload or
pack has them.

- [ ] Hala (kahuna, Elite Four in Sun and Moon)
- [ ] Ilima (trial captain)
- [ ] Acerola (trial captain, Elite Four)
- [ ] Mina (trial captain)
- [ ] Plumeria (Team Skull admin)

Everything else the set needs has a sheet there: the other kahunas and
captains, Molayne, Kahili, Kukui, Hau, Gladion, Guzma, the Skull grunts, the
Aether staff, Faba and Lusamine, and most of Alola's trainer classes. Most
overworlds are DiegoWT's, under kyledove's battle sprites, free to use with
credit. Collector and Golfer have no Alolan overworld either.

### Mega sprites

- [ ] Venusaur
- [x] Charizard X
- [ ] Charizard Y
- [ ] Blastoise
- [ ] Pidgeot
- [ ] Raichu X
- [ ] Raichu Y
- [x] Alakazam
- [ ] Victreebel
- [x] Slowbro
- [x] Gengar
- [x] Kangaskhan (no baby)
- [ ] Starmie
- [ ] Pinsir
- [ ] Gyarados
- [ ] Aerodactyl
- [ ] Dragonite
- [ ] Mewtwo X
- [x] Mewtwo Y
- [ ] Meganium
- [ ] Feraligatr
- [x] Steelix
- [ ] Scizor
- [ ] Heracross
- [x] Houndoom
- [ ] Tyranitar

## Not designed yet

### More items

Remaining items after the PP restoratives, the charms and Room Service, with no order or design yet:

- Poké Balls: Safari and Sport, then the Hisui and legend-specific sets (Cherish,
  Dream, Park, Origin, Strange, the Hisuian and feather/wing/jet sets).
- Flutes, all 5. The Poké Flute wakes sleepers; Black and White adjust
  encounter rate and level, which is overworld work.
- Key items: Coin Case, Berry Pots, Poké Radar, Vs Seeker, Dowsing Machine.

### True species

Pre-existing species with new types. One line in the old todo; needs a design before it can be a node.

## Ideas, not committed to

### Open world gimmicks

Secret bases are deliberately left out: they were already on the table when this
list was drawn up. Each line says what the mechanic does and what it would cost
a player, since a gimmick whose payoff is invisible or already reachable is not
worth building.

- [ ] **Fishing.** Three rods, never consumed. Press an adjacent water cell,
      rolled from `${window}:${worldCell}:cast:${n}` so everyone standing there
      in that window sees the same fish, on a 20 second cooldown. Rod tier and
      shelf versus deep water pick the band; a fish that breaks off is gone from
      that cell for the window. Reaches for what is under the water rather than
      filling an empty cell, since water already holds swimmers and floaters.
- [ ] **Tracks.** A rare spawn does not stand in the open. It leaves three or
      four footprints on the ground pointing the way it went, redrawn each
      window, and the trail can go cold. Chase it or keep walking.
- [ ] **A camera.** Photograph a wild pokemon instead of catching it: it fills
      the dex sighting and pays nothing else, so the choice is on the encounter
      itself.
- [ ] **A roaming legendary.** One per region, in a real chunk each three hour
      window and moving when the window turns. The world map names the region it
      is in, never the cell. It flees on contact; corner it three times in three
      windows and it stands.
- [ ] **Itemfinder.** Caches stop being visible landmarks and become buried,
      with a bag tool that pings by distance. Turns a chunk into something to
      sweep rather than something to cross.
- [ ] **Contests.** A second axis of worth for a catch that is not its stats,
      scored off nature, friendship and a move's flavour. Nothing currently makes
      a pokemon worth raising for anything but a fight.
- [ ] **A phone.** A beaten trainer gives you their number. Once a window one
      calls, names the cell they are standing on, and wants a rematch with a
      stronger party.
- [ ] **Berry farming.** Plant in a cell you pick rather than harvesting what
      the world placed. Hours to grow, waterable, and the plot is public the way
      a gym seat is, so a stranger can water it or take the crop.
- [ ] **Seasons.** Four, world wide, one per real week. A quarter of every
      biome's rolls comes from a season pool. Winter freezes water touching
      ground into walkable ice and spring floods the lowest ground band, so
      routes open and close. A generation change, so the world moves under
      everybody at once and a stored position can wake up in water. Deerling's
      coats already put four seasons on the clock at one month each, but only
      for the coat a deer is met in, not for terrain or spawn rolls.
- [ ] **Deliveries.** A wanderer hands over a parcel for a town six or eight
      chunks off, payable inside one window. A detour with a clock on it.
- [ ] **A bike.** Halves the step pace, and an egg counts no steps while riding.
      Speed against the thing walking is for.
- [ ] **Camp cooking.** Pitch every 30 minutes for 3 berries and run one
      encounter power for 20 minutes, picked by dominant flavour: spawn count,
      shiny odds, egg steps, wild levels or item finds. No stacking. The weakest
      of the set, since lures and the buddy already hand out most of it.

Pairs that would ship as one release: tracks and the camera, which turn a walk
into looking; fishing and seasons, since both change what water holds.

### Seeing other players in the overworld

Feasible, and most of it is already written.

Every other thing on the map is derived from the world seed plus the coordinates
plus the clock, and generation runs on the client. Another player's position is
the first piece of overworld state that cannot be computed and has to be sent.

What already exists:

- `positions` holds every player's `chunk_x, chunk_y, cell_x, cell_y, depth,
moved_at` (`db/migrations/0001_baseline.sql:728`), and the table already sends
  its changes to the live feed (`src/server/live/rules.ts:34`).
- `profiles.sprite` already holds the charset a trainer walks as, and it is
  already readable by anybody.
- `readPositions(uids)` already reads many players' rows in one query
  (`src/server/positions.ts:109`), and `getPlayerPosition(uid)` already reads
  anybody's through the server (`src/auth/positions.ts:73`). The profile card
  uses it today to say where a trainer is standing.
- The chunk canvas already draws several people on several cells in several
  charsets, facing correctly, with cast shadows, occlusion veiling and press
  targets. `loadOWChar` hands each caller its own clone so two people in the same
  charset stand apart (`src/canvas/overworld/char-sprites.ts:47`). What is missing is a
  prop saying who else is here: `personOn` reads landmarks only
  (`src/components/overworld/chunk-canvas/index.tsx:801`).

What is in the way:

- [ ] **The live feed sends a position to its own player only**
      (`src/server/live/rules.ts:34`), so a socket watching the table sees one
      row. This is deliberate, but it was decided when the stream was only for
      reconciling one player's two devices. The project has already made the
      opposite call elsewhere: `getPlayerPosition` says where a trainer is
      standing is as public as their nickname.
- [ ] **Nothing queries by region.** The key is `(player, generation)` and there
      is no index on `chunk_x, chunk_y`. "Who else is in this chunk" is a query
      that does not exist.
- [ ] **Positions are saved every few seconds rather than every step**
      (`src/model/position-record.ts:16`), and only the local player has a slide.
      Anybody else would hop between saves without one.

The objection to answer first: the world is effectively endless, so two players
are almost never in the same chunk, and an ambient version would show an empty
map to nearly everyone nearly always. Gym seats are drawn as an aura rather than
a figure for the same reason, since what is worth knowing is who holds the cell
rather than who walked past it.

Three scopes, ascending in cost:

- [ ] **Friends only.** `friends` already exists, the query stays a list of uids,
      and `readPositions` already takes one, so no spatial index is needed at all.
      Cheapest of the three by a wide margin.
- [ ] **Where people already converge.** Towns, gyms and raid landmarks only.
      `towns` is already readable by anybody and raid lobbies are already live,
      so people appear exactly where there was a reason to be.
- [ ] **Ambient presence.** Everyone nearby, wanting the policy change, the
      spatial index and per-character interpolation.
