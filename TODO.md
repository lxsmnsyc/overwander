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
