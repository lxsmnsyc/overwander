---
'overwander': patch
---

Selecting a run of pokemon no longer slows down as the run grows.

Picking the thirtieth pokemon in the Catches dialog lagged, and the reason was
that almost nothing on the way to a square was held. Every press rebuilt the
whole box: the list was filtered, sorted by date, searched and ordered again,
and the set of what was already picked was rebuilt once per square rather than
once per press. That last one is what made it worse the more was selected, since
the cost was everything on the page multiplied by everything picked.

Worse, the page itself was sliced on demand, and a grid asks for the page it is
drawing once per square. Measured against a list of two hundred with a box
thirty wide, fifty reads of the page rebuilt the list fifty times; it now builds
once and the rest are free. The live picker also handed its selection to the
caller and was handed the same selection straight back, redrawing the box a
second time for a press that had already been drawn.

The list, the search over it, the page under it and the set of what is picked
are all held now, a square looks its own record up by id instead of scanning for
it, and an echo from the caller is recognised and ignored.
