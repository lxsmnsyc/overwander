---
name: let-layout-explain
description: >
  Avoid unnecessary secondary labels and descriptions. Let the layout do the
  explaining. Applies whenever building or changing a screen, dialog, card or
  control in src/components, and whenever adding a subtitle, caption, hint or
  helper line to one.
---

**One label per thing. The layout says the rest.**

Where a control sits, what it sits beside and how it is grouped already tells
the player what it is for. A second line that repeats that in words is one more
thing to read before the screen can be used.

## Rules

- **No subtitle under a title** that restates it. A dialog's nameplate says what
  the dialog is; the sheet below it does not need a sentence saying it again.
- **No caption on a self-evident control.** A button labelled `Bid` beside a
  price needs no "Place a bid on this item" under it.
- **No section heading over a single group.** A heading earns its place only when
  there are several groups to tell apart.
- **No hint that names the obvious gesture**, such as "Click to select" on a
  square that highlights on hover.
- **Group, align and order instead of explaining.** Related things sit together,
  the way out sits on the left of the dock and the action on the right, and the
  most important value is the largest. If a screen only reads with a paragraph
  of help, fix the layout rather than writing the paragraph.

## What still gets words

- A label the control cannot carry itself: an icon-only button keeps its
  tooltip and its `aria-label`.
- A consequence the player cannot see from the layout: an action that cannot be
  undone, a cost, a cooldown.
- An empty state, which has no layout to read.
- What a square in a grid is, which `grid-cards` puts in its tooltip.
