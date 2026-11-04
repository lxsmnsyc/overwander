# Outcome: gold-text-check

## Built

- `test/components/gold-text.test.ts`: scans `.ts` and `.tsx` under `src`, fails on plain `text-gold` (with or without a variant) in an element that is neither `aria-hidden="true"` nor `role="img"`. `text-gold-dark` and `text-gold-soft` pass.

## Deviations

- Glyphs also pass with `role="img"`: the two star rows (`CatchCard.tsx`, `PortraitSection.tsx`) are labelled images, not aria-hidden. No catch file was edited.
- `src/components/app/Announcements.tsx`: the dismiss icon hover is now `hover:text-gold-dark` (the icon sits on `gold-soft`, where pale gold was unreadable). Added `.changeset/gold-text-check.md` (patch).

## Stubs left

- None.

## Gotchas

- The tag is the nearest `<` that starts a JSX tag, with no `>` (other than `=>`) between it and the class; a class outside a tag fails. A `>` comparison inside an attribute would end the tag early.

## Proposed learnings

- Words in gold use `text-gold-dark` | contrast on white | src/components | yes (this test)

## Verification

- New test passes, with fixture cases for the checker; fails with plain `text-gold` on words (checked, reverted). typecheck, oxlint exit 0, full suite pass.

## Size

- Estimated S, actual S.
