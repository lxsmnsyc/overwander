---
name: dialog-layout
description: >
  Dialog bars keep their content centered: the title bar, the action
  bar under it, and the DialogActions row at the foot. Applies when
  building or changing any dialog in src/components.
---

The bars at both ends of a dialog panel center their content. This is
built into the styled primitives in `src/components/styled/dialog.tsx`:
the heading centers its title, the optional `bar` row under it centers
its buttons, and `DialogActions` centers whatever it holds.

## Rules

- Use `Dialog` and `DialogActions` from `../styled` and the centering
  comes for free. Do not re-align them per dialog.
- Do not add alignment props back to `DialogActions`; it had a
  `center` opt-in once and the opt-in became the only behaviour.
- Buttons in `DialogActions` keep their written order, with the way
  out (Close, Never mind) last.
- A control that belongs to the panel rather than its content goes in
  the bottom bar beside Close (the auction board's Add/Board toggle),
  not in the heading's `aside`.
