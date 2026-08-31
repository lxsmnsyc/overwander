---
'overwander': patch
---

The board's ground and grid are drawn on a layer of their own, in batches.

A tilted cell is not a rectangle, so every one of the 324 tiles was laid
through its own skewed transform: a save, a transform, a blit and a restore
each. The grid over them was 324 more paths, built and stroked one cell at a
time. Together that is most of what a phone was spending a frame on, and none
of it fell when the window did.

Both now go into one buffer on a WebGL layer beneath the board, handed over in
a few calls: one per run of tiles that came off the same sheet, and one for the
whole grid. The layer sits under everything because nothing on the board is
drawn beneath the ground, so the order the passes already ran in is the order
they still run in. A browser that will not give a WebGL context, or one that
takes it away again, falls back to drawing both exactly as before.

The grid still rules every cell's own four edges rather than ruling a lattice,
so two cells sharing an edge lay their lines over each other and that edge
stays the weight it has always been.

Two things look slightly different, both of them corrections. A tile is laid on
its cell's true four corners rather than on the parallelogram a 2D transform can
describe, so it sits on the grid line drawn under it. And the label shown while
a chunk is still arriving is no longer painted over by the ground it was meant
to be read against.

The weather is batched the same way. A blizzard was about two thousand stroked
drops a frame; it is one draw call now. Rain, a downpour and a sandstorm used to
be drawn as two scrolling sheets rather than drop by drop, which was only ever a
way of not paying for eleven thousand strokes. A batch does not charge for them,
so those three get their own paces back.

The batching happens off the page and is laid into the picture where each pass
belongs, rather than on canvases stacked over the board. A canvas above another
cannot be washed by it: the hour's light is multiplied over the whole picture,
and a multiply has to read what is under it. Drawn off to one side and blitted
in, the ground is inside the picture and every pass after it behaves as it
always did.

One thing is not identical. A tile's texels land through a different rasteriser
now, so the pattern inside a tile can shift by a pixel here and there. Same
tiles, same colours, same edges: it shows up in a pixel comparison and not on a
board being played.

The stand-in art is gone with it. A decoration used to be drawn as a cone or a
mound, and a landmark as a lettered disc, for as long as their sheets took to
arrive. Every decoration and every landmark that is drawn as a thing has a
picture now, so a cell shows nothing until its own picture is in hand rather
than something the game does not otherwise use.

The ring under a person stays. It is not a stand-in: a charset says which coat
somebody is wearing and nothing about whether walking up to them starts a fight,
which is the whole of what the ring is for. It is drawn once into a shared sheet
and stamped from there, which is where the art that has no picture is headed.

Everything else on the board followed it into the batch: the phenomena, the ring
under a person, the ring of ground within reach, the scenery, the plants, the
people, the pokemon and their shadows, the cursor and the border round the
board. Each sprite class answers with the rectangle it would have drawn instead
of drawing it, and its own `draw` is written in terms of that answer, so the two
ways of putting a sprite on the board cannot come to disagree.

The phenomena are the one thing here that is drawn in code and moves while it is
drawn, so each is repainted into a small picture of its own once a frame rather
than once a cell. A picture that size costs nothing to hand over; the whole
screen would cost too much, which is the rule the rest of this follows too.

The battlefield's own ground is batched now as well. It is 448 tiles a frame at
the ordinary camera, laid the same way the board's were: a save, a skewed
transform, a blit and a restore each, whatever the fight is doing. Writing them
into a batch costs about half a millisecond against six for painting them.

It sits on a WebGL canvas stacked under the one the fight is drawn on, rather
than off the page and copied in. Nothing on the battlefield is washed over the
whole picture the way the hour's light washes the board, so there is nothing
here that has to read what is beneath it, and a stacked layer costs nothing per
frame where a copy would cost a full screen of it.

A cell of a tilted plane is not a parallelogram, and a 2D context can only draw
one: the tile used to be fitted to the longer of each pair of opposite edges so
that neighbours lapped over rather than falling short. It is drawn on its four
true corners now. Tiles are sampled half a texel inside their own edges, since
a sheet packs them against each other and a sampler at an edge reaches past it.

The field's own colour is the layer's background rather than a rectangle painted
over the canvas every frame, so a biome with no tileset packed for it looks
exactly as it did.

The compass is four marks now rather than four letters. Each is a triangle
pointing the way it stands for, and north is the game's own ember, so which edge
of the board is which is read as a shape and a colour rather than as four
letters read one at a time. They stand where the letters stood and turn with the
board the same way, each on a halo of its own so it shows against pale country
and dark alike.

It is also the last thing on the board that was writing. A triangle is three
corners, which the batch takes as it takes anything else, so nothing on the
board needs a font any more.

The board is one pass now. The batch learned the two blend modes the hour's light
is made of, and that was the whole of what kept the picture in two pieces: a
multiply has to read what is under it, so the light could not be laid on a canvas
stacked over the board and had to be painted onto the same one, which meant
copying the batched layer across twice a frame. Both copies are gone.

For a wash to mean anything it has to fall on something opaque, so the layer
paints the country itself rather than letting the page show through. That is the
same colour the page behind it was painted anyway. It does mean the ground
outside the board is darkened by the evening the same way the ground inside it
is, where before the light was multiplied over the board and laid flat over the
country beside it.

Everything else that was still painted went with it: the waiting label, the
sparkle a shiny throws, the dots that stand in for a sheet still coming, the
aurora's curtains and the rainbow's arc. Words are baked at the size and in the
font they are drawn in rather than baked once and stretched, which is what made
a scaled halo come out heavier than the stroke drew it.

Shadows are the thing itself now. A pokemon or a person on the board throws its
own silhouette rather than an ellipse standing in for one, and a shadow at dawn
is recognisably the shape that cast it. It costs the same one quad the sprite
did.

It is a skew rather than a turn. The edge under the feet stays square to the
picture and exactly where the picture put it, so a shadow is always joined to the
thing that cast it; only the far edge leans, and it leans the way the light
throws it. What carries the direction is the pose. A shadow is the silhouette from where the
light stands, so which of a sheet's eight frames is laid down is the angle
between the way the thing faces and the way the light is, not the shadow's own
bearing: something looking straight at the light lays its front down, and the
same thing with the light off its left lays its right down.

Two things about the light itself were wrong and are fixed with it. The board
counts down the picture, so a step north is a step toward smaller numbers, and
the shadow's bearing was read as though it counted up: everything with any north
or south in it lay the wrong way round, and turning the board swung it somewhere
else again rather than turning it. And the bearing was laid back by a number of
its own rather than by the board's, so it pointed a few degrees off the ground it
was supposed to be lying on. Both now come from the tilt the board is drawn at,
and a test holds the shadow's bearing against the board's own projection of the
same step at every hour and every turn.

The battlefield followed. The pokemon, their shadows, the auras a shadow or a
purified one stands in, the health and cast bars, the name of whatever is being
wound up, and the weather are all written into the batch now; a fight is a
handful of calls where it was several a pokemon. Move effects stay painted on the
canvas above: there is at most one on screen, and a layer that is never copied
costs nothing to leave there.
