# Log

- Test scans src .ts/.tsx, finds plain `text-gold` (any variant), and passes it only when it sits inside a JSX opening tag (nearest `<` starts a tag, no closing `>` that is not `=>` before the match) that has `aria-hidden="true"` or `role="img"`. Anything outside a tag fails. The checker is `findGoldWords`, tested on fixtures.
- Star rows in CatchCard and PortraitSection are glyph spans with `role="img"` and a label, not aria-hidden, so `role="img"` counts as a glyph.
- Announcements close button: icon only, hover changed to `hover:text-gold-dark`.
- Bite check: plain `text-gold` on the announcement message failed the test, reverted.
