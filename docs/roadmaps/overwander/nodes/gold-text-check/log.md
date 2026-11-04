# Log

- Test scans src .ts/.tsx, finds plain `text-gold` (any variant), reads the whole opening tag, passes it when it has `aria-hidden="true"` or `role="img"`.
- Star rows in CatchCard and PortraitSection are glyph spans with `role="img"` and a label, not aria-hidden, so `role="img"` counts as a glyph.
- Announcements close button: icon only, hover changed to `hover:text-gold-dark`.
- Bite check: plain `text-gold` on the announcement message failed the test, reverted.
