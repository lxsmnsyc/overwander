---
'overwander': patch
---

Three things that rebuilt themselves over news that did not concern them.

**The world stopped reloading when a pokemon ran off.** Leaving an encounter
re-reads what has fled, and a resource being re-read is a resource that is
loading, so the board was thrown back to its boundary: the chunk went away and
"Reading the world…" stood in its place until the answer came back. Nothing was
lost by it and it looked exactly like the world reloading because something
walked off. A refetch now leaves the last answer standing until the new one
lands, and only the first read of a session waits.

**Sprites stopped restarting when a square beside them was picked.** Taking one
pokemon out of a box rebuilds every entry in it, and an effect wakes on its
sources changing rather than on its answer changing: every square then refetched
its sheet, was handed a new playhead and began its idle again from the first
frame. Thirty pokemon flinched in unison every time the player took one. They
are read through their values now, so a square whose pokemon has not changed
does not notice.

**A line stops being a silhouette once its end is registered.** The sheet read
the reader's dex once when the dialog was first built, which is once a session:
a player who caught a Dragonite and then opened their Dragonair was shown the
shadow of a pokemon standing in their own box. The dex is re-read for each sheet
opened, and again when the record changes, so evolving one fills in the line
under it without the sheet being closed.
