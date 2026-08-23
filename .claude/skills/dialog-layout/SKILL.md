---
name: dialog-layout
description: >
  Dialog furniture is aligned by the styled primitives: the title bar
  and the DialogActions row at the foot center their content, and the
  action bar under the title sits to the right. Applies when building
  or changing any dialog in src/components.
---

The panel's furniture is aligned by the styled primitives in
`src/components/styled/dialog.tsx`, never per dialog: the heading
centers its title, `DialogActions` centers whatever it holds, and the
optional `bar` row under the heading keeps its buttons to the **right**,
where the rest of the game puts what can be done to a thing.

## Rules

- Use `Dialog` and `DialogActions` from `../styled` and the alignment
  comes for free. Do not re-align them per dialog.
- Do not add alignment props back to `DialogActions`; it had a
  `center` opt-in once and the opt-in became the only behaviour.
- Buttons in `DialogActions` keep their written order, with the way
  out (Close, Never mind) last.
- A control that belongs to the panel rather than its content goes in
  the bottom bar beside Close (the auction board's Add/Board toggle),
  not in the heading's `aside`.
