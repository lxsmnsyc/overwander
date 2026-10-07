# TODOS

Ordered by priority, highest first. The platform work leads because every
later feature adds more text to translate and more data to load at boot.

## 1. Platform

The three plans touch the same registries, so they are sequenced: decide how
text leaves the registries (i18n) before splitting them for loading, and keep
the database copy independent of both. Game data moves to YAML a registry at a
time, a folder per field so each part can load on its own (see the `data-yaml`
skill); behaviour stays TypeScript.

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
      per-locale text tables keyed by id (species already use
      `src/data/text/en/species.yaml`), read through `getSpeciesName(id)` and
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
- [x] **Split the species record by field, as source files.** Done as YAML:
      `world/`, `stats/`, `abilities/` and `learnsets/`, families filed in
      blocks of 25 dex numbers per region, with names filed the same way
      under `text/en/species/`. They still load eagerly; loading each field
      when it is first wanted is the next step.
- [ ] **Move the other registries to YAML** on the same pipeline. Moves,
      abilities, items and the per-move battle numbers are done; the biome
      pools and lairs are next. The Megas and true
      shadows can follow once the YAML can say `inherits:`.
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
- [ ] **An NPC API.** One NPC is spread over many places today: its id, name,
      charsets and visit tag in `src/data/overworld/npc.ts`, its counter under
      `src/components/overworld/npc-dialog/counters/` and its entry in
      `counter.tsx`, its server handler under `src/server/npcs/` with a client
      wrapper in `src/auth/npcs.ts`, the trader list in `src/server/validate.ts`,
      and where it stands in `chunk-snapshot.ts`. A `createNpc` definition
      should declare all of it in one place, the way `createAbility` does for
      abilities, so adding the Jeweler or the Archaeologist above is one file.

- [ ] **Type: Null and Silvally.** When Gen 7 lands, Silvally's 17 Memories
      are form items the way the Plates are: rows in `FORM_ITEMS` derived from
      the type each Memory loads, gated on RKS System through `SHAPE_NEEDS` the
      way Arceus is gated on Multitype, with the Memory floating over the
      changed shape like every other held form (`form-mark.ts`). Type: Null has
      no forms and evolves by friendship; its Battle Armor and the helmet are
      the only thing to decide.

## 3. Player systems

Things a player owns and arranges, rather than finds in the world. Each one is
private to its owner and stored, so none of them touches world generation.

### Boxes

Folders for catches. The catches list opens on the boxes instead of one long
grid.

- [x] **Data.** A `boxes` table (`id, player, name, colour, position`) and two
      nullable columns on `caught`: `box` and `box_slot`. A catch with no box is
      in **Default**, which is not a row, so every existing catch landed there
      with no migration of its rows. A slot is a square and may leave gaps.
- [x] **Actions.** Make, rename, recolour and delete a box. Deleting one sends
      its catches back to Default. File one catch (from its sheet) or a picked
      set (Move N to), drag onto a box in the rail or onto a square, lay a box
      out by dex number, close up its gaps, move everything to another box.
- [x] **Limits.** 32 boxes and a 24-character name, checked in the server
      function. A box holds any number of catches and pages at the box size.
- [x] **Pickers.** Every catch picker over the player's own pokemon draws a
      box switcher once they have made a box, and a square shows which box it
      lives in while all of them are showing.
- [ ] **Reorder boxes by drag.** `arrangeBoxes` is written; the rail has no
      grip to drive it yet.
- [ ] **Shift-press picks a run, and Pick all N.** In the boxes design, not built.
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
      for the buddy's egg (`creditedEggSteps` and the step report in
      `src/server/eggs.ts`). Incubated eggs are credited from the same report, at
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

## 7. Ideas, not committed to

### Dungeons

Landmarks with floors, cleared once per window: syndicate hideouts going down
to the boss, dungeons ending in a legendary of the biome, and the Battle
Frontier houses as seven-floor towers. Floors are walked on the board like the
caves, with layout rules (spinners, warp pads, ice, cracked floors, obstacles,
locked doors, barriers, ledges) and dark floors. The party is locked in at the
entrance, and only the player's own medicine heals it.

It was built as PR #141 (`add: dungeons`, 74 files) and parked on 2026-10-03,
about 430 commits behind `main`. The last commit is `cca72e31c`, and
`git fetch origin pull/141/head:dungeons` brings the branch back. Its design
is in the branch's `docs/mechanics/dungeons.md` and `docs/database/dungeons.md`.

Most of it still fits: the floor generator, the walk and the server's game
rules were already server functions on `getSql()`. What moved underneath it:

- [ ] **Migration.** `supabase/migrations/20260924000100_dungeon_runs.sql`
      becomes the next `db/migrations/NNNN_dungeon_runs.sql`: `player`
      references `public.users`, and the row policy goes, since the server is
      the only door. The hourly `cron.schedule` sweep stays.
- [ ] **Standings.** `src/auth/landmark-standings.ts` read `dungeon_runs` with
      the Supabase client. Cleared runs join the server read instead: a `runs`
      list in `StandingIds`, `STANDING_IDS` and `readStandingRows` in
      `src/server/landmark-standings.ts`.
- [ ] **Healing locks.** A catch locked into a live run mends only on its own
      medicine. The check (`runLockedCatches` in `src/server/dungeon-lock.ts`)
      goes back into `src/server/candy.ts`, which now takes `opensRun` and
      returns `{ from, level }`, and into Nurse Joy, now a `createNpc` folder in
      `src/overworld/npcs/nurse-joy`. New server function parameters go at the
      end (`server-function-order`).
- [ ] **Stops.** `src/server/stops.ts` reads weather through
      `getWorldOfChunk(...)` now, and the boss no longer standing on a Team
      Rocket cell has to be redone there.
- [ ] **World generation.** The branch moved the first generation's
      fingerprint, and the first generation is frozen. Hideouts and dungeons
      either go to the second generation only, behind named
      `world.draws(...)` rolls, or are read off what already stands (the
      Frontier towers already are). The fingerprint test must not move.
- [ ] **Chunk snapshot.** `src/overworld/chunk-snapshot.ts` and the board demo
      conflict in four places. Main has since added lairs on the water and
      spawns placed by surface, so re-check what a dungeon cell may stand on.
- [ ] **Tests.** `test/rls/dungeons.test.ts` becomes a `test/db` suite on the
      dev database, through the server functions.
- [ ] **Art.** Regenerate rather than merge: `scripts/dungeon-terrain.ts`,
      `scripts/landmarks.ts`, then `sprite-stamps`. The tileset review sheets
      under `tileset-review/dungeon` do not need to come back.
- [ ] **The cliff hover ring.** The branch also carried a small fix, the hover
      ring lying on a cliff tile's slope (`.changeset/cliff-hover-ring.md`).
      Take it on its own first.
- [ ] **Land it as a stack.** Data and generation, then the migration and the
      server, then the board and the dialog, linked with `gh stack link`.

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
