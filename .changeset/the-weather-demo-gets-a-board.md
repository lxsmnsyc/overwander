---
'overwander': patch
---

The weather demo stands its skies on a board.

It used to draw them over a flat checkered country, which was fine while the sky
was painted on the glass and useless the moment it stopped being: weather that
stands in the world needs a world to stand in, so on that page every sky was
falling back to the flat version of itself and the demo was quietly showing the
wrong picture.

There is a board now, drawn through the same camera the overworld uses, its
cells checkered and its marks standing on the ground rather than on the screen.
Drag it to walk the camera round, which is the only way to see what weather in
the world is actually doing, and it takes a two-finger twist the same way the
overworld does. The drag is the overworld's own: a bit of the plane is taken
hold of and the board turns so it stays under the pointer, rather than the
sideways slide the page started with.

Both switches that made the page worth having are still there and there is a
third. Turning WebGL off gives the 2D pass, which is the only way to catch the
two renderers drifting apart. Taking it off the board gives the flat sky every
painter still falls back to without a camera, so that path stays somewhere it
can be looked at rather than only somewhere it can be tested.
