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

All 83 Johto moves are registered and in the Kanto learnsets, but the engine
only backs part of them so far.

Working: everything that lands damage with a secondary status or stat stage
(Sludge Bomb, Spark, Crunch, Iron Tail, Ancient Power, Icy Wind, ...), the
drains and heals (Giga Drain, Milk Drink, and the three sun-reading heals), the
crit pair (Aeroblast, Cross Chop), the multi-hits (Bone Rush, Triple Kick),
Outrage, the priority moves and the plain stage droppers (Charm, Scary Face,
Cotton Spore, Sweet Scent, Swagger).

Nothing yet, 25 status moves: Sketch, Spider Web, Mind Reader, Lock-On,
Nightmare, Curse, Conversion 2, Spite, Protect, Detect, Endure, Spikes,
Foresight, Destiny Bond, Perish Song, Belly Drum, Mean Look, Attract, Sleep
Talk, Heal Bell, Safeguard, Pain Split, Baton Pass, Encore, Psych Up.

Nothing yet, 7 attacks whose power is worked out rather than registered: Flail,
Reversal, Return, Frustration, Present, Magnitude, Mirror Coat.

Landing but incomplete: Thief takes nothing, Pursuit does not punish a swap,
Fury Cutter and Rollout do not escalate, Triple Kick does not step up, False
Swipe can knock out, Snore ignores whether the user is asleep, Flame Wheel and
Sacred Fire do not thaw, Twister does not reach a target in the air, Rapid Spin
sweeps no spikes, Hidden Power is always Normal 60, Beat Up strikes once, and
Future Sight lands immediately.
