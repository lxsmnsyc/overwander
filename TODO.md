# TODOS

- [ ] Remaining Held Items
- [ ] add Jeweler
- [ ] add Archaeologist
- [ ] adjacent chunk preload
- [ ] Mini Boss ability
- [ ] catch tags

Held items blocked on engine features (13): the four terrain seeds and Terrain Extender (no terrain), Heavy-Duty Boots (no entry hazards), Room Service (no Trick Room)

Held items I'd leave alone (22): the signature items whose species are past gen 1 — Adamant/Lustrous/Griseous/Red/Blue Orb, Soul Dew, Rusted Sword and Shield, the four Genesect drives.

Battle items — Max Mushrooms.

Medicine — 21 missing. The interesting ones: Ether / Max Ether / Elixir / Max Elixir, which map cleanly onto clearing cooldowns the way the Leppa Berry already does; Rare Candy; Sacred Ash (revive the whole party); Ability Capsule.

Poké Balls — 24 missing, 8 of them implementable now with the catch-rate hooks that already exist: Level, Lure, Moon, Friend, Love, Heavy, Fast, Safari/Sport. The rest are Hisui and legend-specific (Beast, Cherish, Dream, Park, Origin, Strange, the Hisuian and feather/wing/jet sets).

Flutes — all 5 missing. Poké Flute wakes sleepers; Black and White adjust encounter rate and level, which is overworld work.

Key items — mostly plot props, but four are the same shape as the Shiny Charm you already have: Exp Charm, Oval Charm, Catching Charm, Mark Charm. Also plausible: Coin Case, Berry Pots, Poké Radar, Vs Seeker, Dowsing Machine.

Shortest path to real value, in order: the four PP restoratives (the Leppa hook is written), the four charms (the Shiny Charm pattern is written), the eight ball variants, then Everstone. The X items need a battle bag flow before any of them mean anything.

## Johto moves

All 83 are registered, in the Kanto learnsets, and backed by the engine. What
is still short of the mainline, in rough order of how much it matters:

- **Sketch** keeps what it drew, but only out of a raid or an npc fight: a
  sketch drawn in any fight between players ends with the battle.
- **Beat Up** counts the party rather than reading each member's Attack, so
  every strike lands at the user's own figure.
- **Hidden Power** takes its type off the genes but always hits at 60.
- **Encore** locks what the AI may pick; nothing forces a move on a unit that
  is already casting something else.
- **Present** and **Magnitude** roll their power per cast, so neither can be
  read off a card before it is thrown.
- **Whirlpool** does not yet reach a submerged target, because Dive is not in.

## Available Mega Sprites

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

## True Species

- Pre-existing species with new types

## Non-canon abilities

- Add non-canon abilities per family.
  
## Open world gimmicks

Candidates, none committed to. Secret bases are deliberately left out: they were
already on the table when this list was drawn up. Each line says what the
mechanic does and what it would cost a player, since a gimmick whose payoff is
invisible or already reachable is not worth building.

- [ ] **Rides.** Read off the buddy already carried: deep water opens to a Water
      or Flying buddy, surface rock to a Rock, Ground or Fighting one, and a
      Flying or Dragon buddy glides a straight line of up to 5 cells, landing on
      the first walkable cell. Shelf water stays open to everyone, so nobody
      loses ground they walk on today. Makes the buddy slot a route choice as
      well as an odds choice, against the lure and shiny boost it already holds.
- [ ] **Fishing.** Three rods, never consumed. Press an adjacent water cell,
      rolled from `${window}:${worldCell}:cast:${n}` so everyone standing there
      in that window sees the same fish, on a 20 second cooldown. Rod tier and
      shelf versus deep water pick the band; a fish that breaks off is gone from
      that cell for the window. Reaches for what is under the water rather than
      filling an empty cell, since water already holds swimmers and floaters.
- [ ] **Seasons.** Four, world wide, on the UTC clock the daily board uses, one
      per real week. A quarter of every biome's rolls comes from a season pool.
      Winter freezes water touching ground into walkable ice and spring floods
      the lowest ground band, so routes open and close. A generation change, so
      the world moves under everybody at once and a stored position can wake up
      in water.
- [ ] **Camp cooking.** Pitch every 30 minutes for 3 berries and run one
      encounter power for 20 minutes, picked by dominant flavour: spawn count,
      shiny odds, egg steps, wild levels or item finds. No stacking. The weakest
      of the set, since lures and the buddy already hand out most of it.
- [ ] **Tracks.** A rare spawn does not stand in the open. It leaves three or
      four footprints on the ground pointing the way it went, redrawn each
      window, and the trail can go cold. Chase it or keep walking.
- [ ] **Itemfinder.** Caches stop being visible landmarks and become buried,
      with a bag tool that pings by distance. Turns a chunk into something to
      sweep rather than something to cross.
- [ ] **A roaming legendary.** One per region, in a real chunk each three hour
      window and moving when the window turns. The world map names the region it
      is in, never the cell. It flees on contact; corner it three times in three
      windows and it stands.
- [ ] **Berry farming.** Plant in a cell you pick rather than harvesting what
      the world placed. Hours to grow, waterable, and the plot is public the way
      a gym seat is, so a stranger can water it or take the crop.
- [ ] **A phone.** A beaten trainer gives you their number. Once a window one
      calls, names the cell they are standing on, and wants a rematch with a
      stronger party.
- [ ] **A bike.** Halves the step pace, and an egg counts no steps while riding.
      Speed against the thing walking is for.
- [ ] **Deliveries.** A wanderer hands over a parcel for a town six or eight
      chunks off, payable inside one window. A detour with a clock on it.
- [ ] **A camera.** Photograph a wild pokemon instead of catching it: it fills
      the dex sighting and pays nothing else, so the choice is on the encounter
      itself.
- [ ] **Contests.** A second axis of worth for a catch that is not its stats,
      scored off nature, friendship and a move's flavour. Nothing currently makes
      a pokemon worth raising for anything but a fight.

Pairs that would ship as one release: rides and fishing, both wanting the same
water; tracks and the camera, which turn a walk into looking; seasons and rides,
since a frozen lake and a Lapras answer the same closed route.
