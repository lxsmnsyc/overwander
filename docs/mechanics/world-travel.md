# Getting around

A player crosses the country on foot a cell at a time, and crosses the world
through a portal.

## Movement

A player clicks where they want to go and their character walks there one cell
at a time, in straight lines only. Nothing moves diagonally. A cell takes a
quarter of a second to cross. The route is recalculated at every step, so a
pokemon appearing in the way, or a landmark changing mid-walk, never strands
anybody.

Landmarks and pokemon are obstacles rather than destinations. Clicking one walks
the player up **beside** it and interacts on arrival.

The player stays in the middle of the board and the world scrolls under them, so
walking is continuous. There is no boundary to step over and no wait when one is
crossed. Anywhere inside the ruled circle can be pressed, which is ten cells in
any direction. The country drawn past it is looked out over rather than walked
to a square at a time. Four compass marks stand at the edge of the ruled circle
and turn with the map as the camera moves. Each one points the way it stands
for, and north is the red one.

The board can be turned: drag it with the right button, or twist two fingers on
a touch screen. A drag or a twist that moved the camera does not count as a
press on whatever it finished over. A card that opens on hover is opened by a
**hold** instead where there is no pointer to hover with.

The player's position is saved every second and a half rather than at every
step, so a page reload never undoes a long walk.

**One walk, however many screens are signed in.** A second screen that finds the
walk has gone somewhere it is not stands down: it stops walking, hands over the
paces it had not reported yet, and says where the walk went. One press takes it
back, which stands the other screen down in turn.

## Portals

A **Portal** landmark does nothing until a player spends a **Portal Key**, which
is one of the rarer items in the game. The key is consumed by the crossing.

The traveller **names a town**. The box finishes a name once a few letters of it
have been typed, and what it knows is every town anybody has ever walked into,
so a name a friend passes on is a place that can be reached. Arriving puts the
player on the portal in that town's plaza, whatever the distance.

A portal stands in a town's plaza and nowhere else. A region with no town has no
portal, because a portal with no town name cannot be named as a destination.

If a destination is refused for any reason, the key is not spent.

## See also

- [The world](world.md): towns, and the names a portal is given
- [The caves](world-caves.md): the one place with no portal in it
- [Where items come from](item-sources.md): where a Portal Key is found
- [Meeting pokemon](encounters.md)
