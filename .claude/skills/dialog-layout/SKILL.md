---
name: dialog-layout
description: >
  Dialog furniture is aligned by the styled primitives: the heading is
  left-aligned on white, and the DialogActions row at the foot and the
  action bar under the heading both keep their buttons to the right.
  A dialog has one way out, a button of its own, never a second ×.
  Applies when building or changing any dialog in src/components.
---

The panel's furniture is drawn and aligned by the styled primitives in
`src/components/styled/dialog.tsx`, never per dialog. A dialog is the
same family as the tooltip and the hover card: a white sheet on a soft
edge with no bar across the top.

- The heading puts the title and the description on the left, `lead`
  before them and `aside` after them. It carries no close button: the
  way out is the dialog's own (Close, Walk on, Leave), last in
  `DialogActions` or in the `bar` row, and a dialog never has two.
- `DialogActions` keeps its buttons to the **right**, under a divider.
- The optional `bar` row under the heading keeps its buttons to the
  **right** too, where the rest of the game puts what can be done to a
  thing.

## Rules

- Use `Dialog` and `DialogActions` from `../styled` and the alignment
  comes for free. Do not re-align them per dialog.
- Do not add alignment props to `DialogActions`. Its one, `centred`,
  is for the safari alone: a game screen whose controls stand under the
  field rather than a form that ends on its buttons.
- Buttons in `DialogActions` keep their written order, with the way
  out (Close, Never mind) last, which puts it rightmost.
- A control that belongs to the panel rather than its content goes in
  the bottom bar beside Close (the auction board's Add/Board toggle),
  not in the heading's `aside`.
