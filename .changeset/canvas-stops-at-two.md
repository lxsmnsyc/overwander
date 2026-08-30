---
'overwander': patch
---

The board and the field stop at two real pixels each.

Both canvases are the size of the page and sized their backing store at the
whole of `devicePixelRatio`, so a phone reporting 3 was drawing nine times the
pixels of one reporting 1, and every full-screen fill over them was paid for at
that size. Everything on them comes from pixel-art sheets that are sharp at two
and no sharper at three.

The cap lives in one place both canvases read, which also gives the field the
floor the board already had: a browser that reports nothing useful is drawn for
one pixel each rather than sized to `NaN`.
