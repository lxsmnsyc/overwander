---
'overwander': patch
---

The battle AI weighs several kinds of move it was reading wrongly, and a
pokemon with nothing that works no longer stands still for the rest of
the fight.

Fixed-damage moves carry no power, so Seismic Toss, Night Shade, Dragon
Rage, Sonic Boom, Super Fang, Psywave and the three one-hit knockouts
were all read as doing nothing at all and picked only when everything
else was worse. They are asked what they take off now. A multi-hit move
is counted for every strike rather than the first, and how often a move
lands is part of what it is worth, so a thirty percent Fissure no longer
weighs the same as a certainty.

Moves that cost the user something now say so: an Explosion while the
user is healthy, recoil on a pokemon that cannot afford it, a Jump Kick
whose miss would be fatal, the turn Hyper Beam spends recharging, and
the cast anything with a wind-up spends before it lands. A rampage is
exempt, since it strikes on every one of those. Stat-stage moves are
declined once the stage they push is pinned, which they only were in
raids before, and Haze is declined by the side that is ahead, since it
clears the user's own boosts along with everybody else's. Healing is
weighed by what it would actually put back rather than by a threshold,
and a drain is worth more to a pokemon that is hurt.

Two things that were plainly wrong: weighing a move against a target
holding a resist berry ate the berry, and the AI's damage estimate drew
from the battle's random stream once per move it considered.

Struggle covers a pokemon that cannot reach anybody rather than only one
whose moves have been shut off. A Normal type facing nothing but Ghosts
has a full move set and no way to touch anyone with it, and used to
stand there until the fight ended. A cooldown is still not that: a
pokemon waiting for its moves to come back waits, the way it always did.
Raid bosses stand there too, since a boss struggling itself down would
hand the lobby the raid.
