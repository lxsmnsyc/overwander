# TODOS

- [ ] Remaining Held Items
- [ ] More berries
- [ ] overworld weather
- [ ] add Jeweler
- [ ] add Archaeologist
- [ ] ability/item descriptions
- [ ] replace ball feature
- [ ] catch picker = view catch
- [ ] friends
- [ ] trading
- [ ] egg move by parent
- [ ] held item on encounter
- [ ] adjacent chunk preload
- [ ] Mini Boss ability
- [ ] Battle summary
- [ ] Admin page + role (mystery gift creation)
- [ ] Make sign in with email + password dev-only
- [ ] add "attack"
- [ ] effect sprites

Held items blocked on engine features (13): the four terrain seeds and Terrain Extender (no terrain), Heavy-Duty Boots (no entry hazards), Room Service (no Trick Room), Protective Pads (every contact reaction in gen-1.ts would have to consult it).

Held items I'd leave alone (22): the Trick/Fling fodder that is pure downside without either move (Iron Ball, Lagging Tail, Ring Target, Sticky Barb, Float Stone); and the signature items whose species are past gen 1 — Adamant/Lustrous/Griseous/Red/Blue Orb, Soul Dew, Rusted Sword and Shield, the four Genesect drives.

Battle items — all 9 missing, and nothing can use them. X Attack, X Defense, X Sp. Atk, X Sp. Def, X Speed, X Accuracy, Dire Hit, Guard Spec, Max Mushrooms. There is no in-battle item flow anywhere in src/server or src/battle — a player cannot reach into the bag mid-fight. The effects are trivial (stages, crit stage, Mist); the missing piece is the flow.

Medicine — 21 missing. The interesting ones: Ether / Max Ether / Elixir / Max Elixir, which map cleanly onto clearing cooldowns the way the Leppa Berry already does; Rare Candy; Sacred Ash (revive the whole party); Ability Capsule. The rest are drinks and regional sweets that are just cheaper potions and a friendship bump — Moomoo Milk, Fresh Water, Soda Pop, Lemonade, Berry Juice, Lava Cookie, Old Gateau, Casteliacone, and so on.

Poké Balls — 24 missing, 8 of them implementable now with the catch-rate hooks that already exist: Level, Lure, Moon, Friend, Love, Heavy, Fast, Safari/Sport. The rest are Hisui and legend-specific (Beast, Cherish, Dream, Park, Origin, Strange, the Hisuian and feather/wing/jet sets).

Flutes — all 5 missing. Poké Flute wakes sleepers; Black and White adjust encounter rate and level, which is overworld work.

Key items — mostly plot props, but four are the same shape as the Shiny Charm you already have: Exp Charm, Oval Charm, Catching Charm, Mark Charm. Also plausible: Coin Case, Berry Pots, Poké Radar, Vs Seeker, Dowsing Machine.

Shortest path to real value, in order: the four PP restoratives (the Leppa hook is written), the four charms (the Shiny Charm pattern is written), the eight ball variants, then Everstone. The X items need a battle bag flow before any of them mean anything.