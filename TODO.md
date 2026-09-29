# TODOS

Ordered by priority, highest first. The platform work leads because every
later feature adds more text to translate and more data to load at boot.

## 1. Platform

The three plans touch the same registries, so they are sequenced: decide how
text leaves the registries (i18n) before splitting them for loading, and keep
the database copy independent of both. Game data stays hand-written TypeScript
throughout; nothing here turns it into generated JSON.

### Internationalization

Nothing is translatable today: there is no i18n library, and every player-facing
string is hard-coded English, in registry `name` and `description` fields, the
`*_NAMES` tables, component copy, toasts, NPC quotes and server refusals.

- [ ] **Pick the library.** Paraglide JS is the lead candidate: typed message
      functions, one reviewable message file per locale, and each locale split
      into its own chunk so a player downloads only theirs.
      `@solid-primitives/i18n` is the lighter fallback.
- [ ] **Locale plumbing.** A locale setting beside the theme, defaulting from
      `Accept-Language` on the server render, reflected in `<html lang>`.
- [ ] **Formatting.** Replace the four `toLocaleString('en-US')` calls and any
      hand-built dates with `Intl`, reading the active locale.
- [ ] **Registry text out of the entries.** Names and descriptions move into
      per-locale text tables keyed by id (for example
      `src/data/text/en/species.ts`), read through `getSpeciesName(id)` and
      friends. Derived descriptions (`describeBerry`, the gems, valuables)
      become message templates with parameters rather than string
      concatenation.
- [ ] **Interface copy.** Extract component strings into message files, one
      area at a time, most-seen first: overworld HUD, battle, bag, catch sheet,
      then the dialogs.
- [ ] **Server text.** Server functions answer with a code and parameters, not
      an English sentence, and the browser renders the message.
- [ ] **First extra locale.** Species, move, ability and item names come from
      PokeAPI's localized names for free. Descriptions describe this engine
      rather than the mainline, so they need translating.
- [ ] **Tests.** Every key exists in every locale, and English is the fallback.

### Deferring data and runtime at boot

Everything in `src/data/` registers at boot today. The overworld needs only a
thin slice of it.

- [ ] **Measure first.** Walk the Vite manifest's static graph for the main
      route to get today's startup total and the size of each chunk.
- [ ] **Stop the board deriving whole encounters.**
      `board-view.ts:405` calls `deriveEncounter` for every visible spawn only
      to read `.shiny`, which rolls moves, abilities, held items and level.
      Split out a `deriveShiny`. After this the overworld needs no learn sets,
      ability pools or held-item tables.
- [ ] **Split the species record in two, as source files.** The world half is
      what spawning and the board read: id, name, family, types, habitat,
      `evolvesFrom`, `evolvesInto`, `dexNumber`, `eggGroups`, plus the spawn
      pools. The detail half holds learn sets, stats, ability pools, held
      items, catch rate, height, weight and gender ratio, in a matching file
      that loads later.
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
      written up yet (Archen and Archeops name Defeatist, which has no
      registry entry).
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

## 3. Remaining items

Shortest path to real value, in order:

- [ ] **The four PP restoratives:** Ether, Max Ether, Elixir, Max Elixir. They
      map onto clearing cooldowns the way the Leppa Berry already does.
- [ ] **The three charms left:** Exp Charm, Oval Charm, Mark Charm, on the
      pattern the Shiny and Catching Charms already use.
- [ ] **Terrain seeds, Terrain Extender and Room Service.** The engine now has
      terrain and Trick Room, which is what blocked them.

After that:

- Battle items: Max Mushrooms.
- Poké Balls: Safari and Sport, then the Hisui and legend-specific sets (Beast,
  Cherish, Dream, Park, Origin, Strange, the Hisuian and feather/wing/jet sets).
- Flutes, all 5. The Poké Flute wakes sleepers; Black and White adjust
  encounter rate and level, which is overworld work.
- Key items: Coin Case, Berry Pots, Poké Radar, Vs Seeker, Dowsing Machine.
- Left alone until their species exist: Rusted Sword and Rusted Shield.

## 4. Engine gaps in Johto moves

What is still short of the mainline, in rough order of how much it matters:

- **Sketch** keeps what it drew, but only out of a raid or an npc fight: a
  sketch drawn in any fight between players ends with the battle.
- **Beat Up** counts the party rather than reading each member's Attack, so
  every strike lands at the user's own figure.
- **Hidden Power** takes its type off the genes but always hits at 60.
- **Encore** locks what the AI may pick; nothing forces a move on a unit that
  is already casting something else.
- **Present** and **Magnitude** roll their power per cast, so neither can be
  read off a card before it is thrown.

## 5. Content

### True Species

- Pre-existing species with new types

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

## 6. Ideas, not committed to

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
moved_at` (`db/migrations/0001_baseline.sql:732`), and the table already sends
  its changes to the live feed (`src/server/live/rules.ts:34`).
- `profiles.sprite` already holds the charset a trainer walks as, and it is
  already readable by anybody.
- `readPositions(uids)` already reads many players' rows in one query
  (`src/server/positions.ts:98`), and `getPlayerPosition(uid)` already reads
  anybody's through the server (`src/auth/positions.ts:71`). The profile card
  uses it today to say where a trainer is standing.
- The chunk canvas already draws several people on several cells in several
  charsets, facing correctly, with cast shadows, occlusion veiling and press
  targets. `loadOWChar` hands each caller its own clone so two people in the same
  charset stand apart (`src/canvas/ow-char-sprites.ts:46`). What is missing is a
  prop saying who else is here: `personOn` reads landmarks only
  (`src/components/overworld/chunk-canvas/index.tsx:769`).

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
      (`src/auth/position-record.ts:15`), and only the local player has a slide.
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
