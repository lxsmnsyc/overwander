---
'overwander': patch
---

Pokemon sprite sheets are packed tighter. The packer laid every sheet out
as a tree, which keeps it square and leaves a corner empty when the
pictures are all about one size; it now also tries rows at every width
and keeps whichever is smaller. Across the 171 sheets that ship this
takes 13% off the pixels a browser decodes, 81% full to 92%. Spinarak is
161x151 where it was, and 89x220 now.
