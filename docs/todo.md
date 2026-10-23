# TODOS

Ordered by priority, highest first. The platform work leads because every
later feature adds more text to translate and more data to load at boot. The
larger plans are in [strategy/](strategy/README.md).

## 1. Platform

The three plans touch the same registries, so they are sequenced: decide how
text leaves the registries (i18n) before splitting them for loading, and keep
the database copy independent of both. Game data moves to YAML a registry at a
time, a folder per field so each part can load on its own (see the `data-yaml`
skill); behaviour stays TypeScript.

### Internationalization

Planned in [strategy/translations.md](strategy/translations.md): Japanese and Spanish
beside English.

### Deferring data and runtime at boot

Everything in `src/data/` registers at boot today. The overworld needs only a
thin slice of it.

- [ ] **Measure first.** Walk the Vite manifest's static graph for the main
      route to get today's startup total and the size of each chunk.
- [ ] **Stop the board deriving whole encounters.**
      `board-view.ts:435` calls `deriveEncounter` for every visible spawn only
      to read `.shiny`, which rolls moves, abilities, held items and level.
      Split out a `deriveShiny`. After this the overworld needs no learn sets,
      ability pools or held-item tables.
- [x] **Split the species record by field, as source files.** Done as YAML:
      `world/`, `stats/`, `abilities/` and `learnsets/`, families filed in
      blocks of 25 dex numbers per region, with names filed the same way
      under `text/en/species/`. They still load eagerly; loading each field
      when it is first wanted is the next step.
- [ ] **Move the other registries to YAML** on the same pipeline. Moves,
      abilities, items, the per-move battle numbers, the spawn pools and the
      lairs are done, and so are the Mega and Zenith tables. The true shadows
      can follow once the YAML can say `inherits:`.
- [ ] **Load moves, abilities and items on demand** in the browser, behind a
      Suspense gate around the panels and the battle view. The server keeps
      registering everything eagerly.
- [ ] **Give learn sets their own loader.** They are read by encounter
      and NPC team building, breeding, the dex, the reminder and tutor
      counters, TMs and catch search, but never by the battle engine, so they
      should not ride on the fight data's loader.
- [ ] **Set abilities up on demand.** An ability's listeners are attached when
      a unit on the field first gains it, with listener ranks reserved up front
      so a late setup still answers in list order.
- [ ] **Later: load by id.** A loader map per registry from id to its family
      file, an `await load(ids)` at each entry point (chunk derive, panel open,
      battle start, NPC team build), and getters that stay synchronous.
      Metronome and other moves that call moves preload their pool.

### Game data in the database

The registries are copied into Postgres so player rows can be searched against
them in SQL. The TypeScript stays the source.

- [ ] **Schema.** A `game_data` schema holding `species` (base stats as
      columns, types, egg groups and biomes as `smallint[]` with a GIN index),
      `species_abilities`, `species_evolutions`, `learn_set` (one row per
      species, move and source, indexed on move), `moves`, `abilities`, `items`
      and a `version` row.
- [ ] **Sync.** At server start, after the migrations: hash the rows built from
      the registries, and when the hash differs, truncate and reload the schema
      in one transaction. A failed sync stops the server, as a failed
      migration does.
- [ ] **No foreign keys from player tables** into `game_data`, and none from
      the join tables to moves or abilities, since a species may name one not
      written up yet.
- [ ] **Move box search and auction search to SQL**, which lets them filter
      rows the browser never downloads.
- [ ] **Localized names.** Once i18n lands, a `names (kind, id, locale, name)`
      table so search works in the player's language.
- [ ] **Later: a data endpoint.** Serve registry entries by id from these
      tables, cached under the build hash, as the transport for loading by id.

## 2. Next up

Small and unblocked.

- [ ] add Jeweler
- [ ] add Archaeologist
- [ ] adjacent chunk preload
- [ ] Mini Boss ability
- [ ] catch tags
- [ ] **Zeniths for every region after Kanto:** [strategy/zeniths.md](strategy/zeniths.md).

## 3. Player systems

Things a player owns and arranges, rather than finds in the world. Each one is
private to its owner and stored, so none of them touches world generation.

### Boxes

Folders for catches. The catches list opens on the boxes instead of one long
grid.

- [ ] **`box:<name>` in the search grammar**, for a query that narrows to one
      box without the switcher.
- [ ] **Overlap to settle.** "Catch tags" in Next up covers some of the same
      need. Decide whether tags ship as well (a catch in one box, with many
      tags) or are dropped in favour of boxes.

### Incubators

Today only the buddy's egg earns steps, so a player hatches one egg at a time
and the daycare lady's boost is the only way to hurry it.

- [ ] **Pick the model.** Two shapes, not both:
  - **Slots.** A fixed number of incubator slots per player (for example 3),
    raised by a key item or a quest. Every egg in a slot earns the steps the
    buddy walks. Simple, and a player always knows what they have.
  - **Items.** An Incubator item used on an egg, spent after a set number of
    hatches (for example 3), and an Infinite Incubator from a quest that is never
    spent. It turns incubators into a gold and loot sink and a reason to dig.
- [ ] **Recommendation.** Slots, with the item as a later extension that adds a
      slot. It keeps one rule for how an egg earns steps, and the buddy stays the
      only way to get the boosts (Flame Body, the species of the day).
- [ ] **Where it hooks in.** Step credit already runs through one server path
      for the buddy's egg (`creditedEggSteps` in `src/model/egg.ts` and the
      step report in `src/server/eggs.ts`). Incubated eggs are credited from the same report, at
      the same clamp, so walking faster than the clamp still earns nothing.
- [ ] **Balance.** Incubated eggs could earn a share of the steps (for example
      half) so the buddy slot keeps its value.

### Garden

A private patch of plots where berries are planted and harvested.

- [ ] **Plots.** A small number per player (for example 4), raised later by a
      quest or an item. Each plot holds one berry, its planting time and whether
      it has been watered, in a `garden_plots` table.
- [ ] **Growth.** Real time, several hours per berry (longer for rarer ones),
      read off the planting time rather than ticked, like the egg clock. A ripe
      plot yields 2 to 5 of the berry. An unharvested plot wilts after a day and
      yields nothing.
- [ ] **Care.** Watering once per growth stage raises the yield, and a Mulch
      item can speed growth or delay wilting. Both are optional, so the garden
      rewards checking in without punishing a player who does not.
- [ ] **Why it matters.** Berries today come from bushes in the world. A garden
      turns a rare berry into something a player can multiply, which gives the
      flavour berries a use beyond bait once cooking lands.
- [ ] **Relation to the idea below.** "Berry farming" under Ideas is a public
      plot on a world cell that strangers can water or take. The garden is the
      private, safe version; the public one could come after it.

### Pokéblocks and Poffins

Cooking berries into treats.

- [ ] **What a treat does.** Pick one purpose before building, since the
      mainline's purpose (contest condition) does not exist here yet:
  - **Friendship and training.** A treat raises friendship, more if the flavour
    matches the nature's liked flavour, and less or not at all if it is the
    disliked one. The nature data already knows both flavours.
  - **Encounters.** A treat set out in the overworld draws wild pokemon of a
    type tied to its flavour for a while, like a lure. "Camp cooking" under Ideas
    already sketches this.
  - **Contests.** Only once "Contests" under Ideas is built, since that is where
    the mainline's condition stats would live.
- [ ] **Recommendation.** Friendship and training first. It uses data that
      already exists, it does not overlap the lures, and it gives the flavour
      berries a second use.
- [ ] **Cooking.** Two to four berries in, one treat out. The treat's flavours are
      the sum of the berries' flavours, and its level comes from how many distinct
      berries went in. No timing minigame at first; a cooking step at a counter
      NPC or from the bag.
- [ ] **Items.** Pokéblocks and Poffins as one family of items with a flavour
      profile, so the bag, the market and the auction house handle them like any
      other item.
- [ ] **Depends on.** The garden, so berries are not the bottleneck.

## 4. Remaining items

Shortest path to real value, in order:

- [ ] **The four PP restoratives:** Ether, Max Ether, Elixir, Max Elixir. They
      map onto clearing cooldowns the way the Leppa Berry already does.
- [ ] **The three charms left:** Exp Charm, Oval Charm, Mark Charm, on the
      pattern the Shiny and Catching Charms already use.
- [ ] **Room Service.** The engine now has Trick Room, which is what blocked
      it.

After that:

- Poké Balls: Safari and Sport, then the Hisui and legend-specific sets (Cherish,
  Dream, Park, Origin, Strange, the Hisuian and feather/wing/jet sets).
- Flutes, all 5. The Poké Flute wakes sleepers; Black and White adjust
  encounter rate and level, which is overworld work.
- Key items: Coin Case, Berry Pots, Poké Radar, Vs Seeker, Dowsing Machine.

## 5. Engine gaps in Johto moves

What is still short of the mainline, in rough order of how much it matters:

- **Sketch** keeps what it drew, but only out of a raid or an npc fight: a
  sketch drawn in any fight between players ends with the battle.
- **Beat Up** counts the party rather than reading each member's Attack, so
  every strike lands at the user's own figure.
- **Hidden Power** takes its type off the genes but always hits at 60.
- **Present** and **Magnitude** roll their power per cast, so neither can be
  read off a card before it is thrown.

## 6. Content

### True Species

- Pre-existing species with new types

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

### Available Mega Sprites

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

### Waiting for SpriteCollab

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
- [ ] Forms: Darmanitan-Galar Zen (Zen Mode stays off on the Galarian line
      until then), Cramorant Gulping and Gorging, Morpeko Hangry, Calyrex Ice
      and Shadow Rider (with As One), Zarude Dada, Gimmighoul Chest,
      Dudunsparce Three-Segment, Squawkabilly's colours, Oinkologne's female,
      Terapagos Stellar, and every Gigantamax.
- [ ] Falinks' own sheet, which retires its Brass stand-in and hidden id.
- [ ] Mimicry, with Galarian Stunfisk.

## 7. Ideas, not committed to

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
