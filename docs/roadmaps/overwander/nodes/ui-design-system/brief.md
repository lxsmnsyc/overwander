---
id: ui-design-system
title: Design system for the UI redesign
status: done
spent: 390252
priority: must
type: feature
outline: false
milestone: now
size: L
added: 2026-11-03
owns:
  - src/app.css
  - src/components/styled/**
  - src/components/app/settings.ts
  - docs/design/**
  - .changeset/ui-design-system.md
shared: []
provides: []
depends_on: []
---

# Design system for the UI redesign

## Goal

Build the approved "Field Kit" system into the game: tokens, type, motion and the styled primitives, so the five area redesigns after it restyle screens on one base. No screen layouts change in this node; that is the area nodes' work.

## The approved direction

- Canvas (approved by the maintainer on 2026-11-03): https://claude.ai/artifact/1sg3qZ2ZoP1ar6V2K46cnD. Board "Field Kit: the system" is the spec for this node; the screen boards show where it is going and are the area nodes' starting points.
- Rules: the world first (chrome hugs the edges), things have weight (2px keyline, hard offset shadow plus a cast, a press that squashes and lands), motion has an origin (a panel grows out of what opened it and returns to it), colour is a word (tide frames and places, leaf offers, ember cannot be undone, gold is value, arcane is channelled), pixels stay pixels (sprites never smoothed; stepped timing only for sprites).
- Type: Fredoka for names and numbers, Nunito for text read, both from Google Fonts (the game's first downloaded fonts: self-host them or load with `display=swap`, and keep the rounded system fallback, Hiragino Maru Gothic for Japanese).
- Colour: the board's day and night values for tide, leaf, ember, gold, arcane, paper, ink, muted, line, line-soft, keeping today's token names in `src/app.css` (`parchment`, `paper`, `ink`, `muted`, `line`, `leaf`, `ember`, `gold`, `tide`, `arcane` and their `-dark` / `-soft`), so no component has to be renamed.
- Shape: radius 8 chip, 12 button, 18 card, 24 sheet, pill; elevation rest / float / sheet; a 4px grid; 44px targets (56px grid squares).
- Motion tokens: durations tap 90, quick 140, base 240, move 360, scene 560 ms; easings settle `cubic-bezier(.2,.8,.2,1)`, spring `cubic-bezier(.34,1.56,.64,1)`, exit `cubic-bezier(.5,0,.75,0)`, pixel `steps(n)`; an exit takes 70% of its entrance; lists stagger 30ms a row, six rows at most; the hover card opens after 300ms (was 400). Reduce motion (`.reduce-motion`, `src/components/app/settings.ts`) turns every move into a 120ms crossfade, keeping the 1ms floor the dialogs need for `transitionend`.

## Steps

- [ ] Copy the approved boards into `docs/design/field-kit/` (the nine `*.dc.html` boards and `canvas.json`), so the spec is versioned with the code. Source: the canvas artifact above, or the matching local copy in the maintainer's last session scratchpad, `/private/tmp/claude-501/-Users-alexis-Documents-GitHub-poketerra/a9e019ff-3f54-4e29-99c4-c4880ac70d58/scratchpad/fieldkit/project` (same SHA-256 as the artifact's live version `1793706728-01cf`).
- [ ] Tokens: colours (day and night), radii, elevations, the motion durations and easings as CSS custom properties and Tailwind theme entries in `src/app.css`; the fonts.
- [ ] Primitives in `src/components/styled/`, restyled and given their motion, keeping every prop and behaviour: Button (tones, squash and land), Dialog (nameplate slides in after the sheet lands; the sheet springs in and leaves on exit; an optional origin so a panel can grow from the control that opened it), DialogActions, Tabs (a sliding indicator), Menu and Popover panels (spring from their trigger), Hover card and Tooltip (300ms delay, rise), Toast (spring in, lifetime bar, pauses on hover), Badge, Pager, StatTile, Switch, RadioGroup, Slider, inputs.
- [ ] A short `docs/design/field-kit.md` the area nodes read: the rules, the tokens, the motion table, and the inventory rule below.
- [ ] Before and after captures of the primitives in light and dark, at desktop and phone width, with the Node and Playwright script method (the maintainer's method for comparing with artboards), compared with the system board.

## The inventory rule (for this node and every area node)

Before a screen is restyled or laid out anew, write its inventory from its `.tsx` (every control, section and piece of state it shows) and keep it as a checklist: every element keeps a place, each move is written as "from -> to, why", and anything new is labelled a proposal until the maintainer agrees to it. A redesign may change layout and hierarchy; it may not lose an element.

## Acceptance

- [ ] The tokens and primitives match the system board in light and dark; no screen loses a control; reduce motion works.
- [ ] `docs/design/field-kit.md` is written.
- [ ] Changeset `minor` (the maintainer calls the new look a feature, 2026-11-04). Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test` (2 workers on this machine).

## Still to design (not this node)

- Phone versions of the redesigned screens, after the desktop boards, which the maintainer approved on 2026-11-03.
- The other screens: box, Pokédex, bag, dex entry, quests, profile, settings, trades, auctions, raids lobby, gifts, news, NPC conversations and forms. Each area node starts with its inventory and mockups on the same canvas.
