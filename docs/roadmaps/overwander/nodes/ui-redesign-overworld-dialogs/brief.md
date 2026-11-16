---
id: ui-redesign-overworld-dialogs
title: Redesign the overworld dialogs
status: todo
priority: must
type: feature
story: ui-redesign-finish
outline: false
milestone: now
size: L
added: 2026-11-04
owns:
  - src/components/overworld/*Dialog.tsx
  - src/components/overworld/WorldMapCanvas.tsx
  - src/components/overworld/visit-npc.tsx
  - src/components/overworld/NpcSprite.tsx
  - src/components/forms/**
shared:
  - src/components/styled/**
  - src/routes/index.tsx
provides: []
depends_on:
  - on: ui-redesign-finish-boards
    kind: hard
    why: Built to the boards approved at its gate
  - on: ui-design-system
    kind: hard
    why: Built on its tokens and primitives
  - on: ui-redesign-overworld
    kind: hard
    why: Shares the overworld folder and takes the HUD's handoffs
---

# Redesign the overworld dialogs

## Goal

Rebuild the stop, portal, gym seat, honey tree and nest counters, the Safari encounter, the world map and the NPC visit with its forms on the Field Kit system. Build to the four boards the maintainer approves at the gate of `ui-redesign-finish-boards`, proposals included.

## Context

- Spec: `docs/design/field-kit/Counters.dc.html`, `Safari.dc.html`, `WorldMap.dc.html`, `Talk.dc.html`, and their notes `inv-counters`, `inv-safari`, `inv-worldmap`, `inv-talk` in `docs/design/field-kit/canvas.json`. System: `docs/design/field-kit.md`. Motion: `Motion.dc.html`.
- The inventory is in `log.md` in this folder, read from every component on 2026-11-16, as a checklist. Tick each item as it gets a place.
- Read the outcomes of `ui-design-system`, `ui-redesign-overworld`, `ui-redesign-catches`, `ui-redesign-battle` and `ui-redesign-box-dex-bag` first. They give `Dialog` widths (`wide`, `rail`) and `origin`, the presets (`GROW`, `MORPH`, `RISE`), `text-gold-dark` (a test enforces it), the HUD glass, `Segmented`, the rail pieces, `CARD` and the option cards (`RadioGroup cards`).
- The dialogs are mounted from `src/routes/index.tsx` and `src/components/overworld/overworld-tab`. Only widths and wrappers change there.
- Renderer: none changes. DOM only. `WorldMapCanvas` keeps how it draws; sprites stay as drawn today.

## The moves (from the boards)

Counters (`overworld/StopDialog.tsx`, `PortalDialog.tsx`, `GymSeatDialog.tsx`, `HoneyTreeDialog.tsx`, `NestDialog.tsx`, `forms/terms.tsx`):
- All five open at `wide` (44rem).
- The nameplate keeps its title. The portrait or landmark sprite moves from the 28px `HeadingPortrait` to a 76px stage in a hero band under the nameplate. The `description` becomes the speech bubble beside it. The band is washed in the place's colour: Rocket ember, Factory gold, Portal arcane, Seat tide, Honey gold, Nest leaf.
- `CounterTerms` becomes one chip strip under the hero. Tones stay: gold for money, ember when short.
- Line-ups (Stop, Seat) sit in a framed 3-wide tray in ember or tide wash. The Factory's crate is the gold tray with the pick count in its label.
- Portal towns are cards with a biome-coloured square, search above and the pager under.
- The seat's holder is a row card with a Profile button. The spent, cooling, bare and unseen panels keep their wording and take the card look.
- `forms/terms.tsx` is the shared furniture: restyle `CounterTerms`, `CostBadge`, `CounterStep`, `PickedRow` and `CounterSpent` once and every form and counter follows.
- Dock: Walk on left, the action right with its cost pill, as today.
- Proposal, for the maintainer at the gate: a one-line dock note (what happens next, or "n of 3 picked").

Safari (`overworld/SafariDialog.tsx`):
- `wide` width, a 250px field held in height, a glass plate top left with the held, flight and ability badges and the caught-before mark.
- Run, Throw and Bag stay three tiles, restyled as `Button` with the squash. Throw shows the ball in hand and its count. Bag opens the 6-wide tray in place of the tiles, with Never mind under it.
- Caught shows Walk on and Have a look. Fled and exited show Walk on.

World map (`overworld/WorldMapDialog.tsx`):
- `rail` width with a left rail: a Ground / Sky `Segmented`, the "you are in" line, the key (you, town, biomes in view) and, with Sky on, the "Worth a walk" rows.
- The steering `Hint` becomes a `?` at the top right. The pan pad, the coordinates plate and the canvas stay.

NPC visit and forms (`overworld/visit-npc.tsx`, `NpcSprite.tsx`, `forms/*`):
- The conversation frame gets the hero band: a 64px portrait stage and the speaker's line as the bubble. The nameplate is the speaker's name.
- Width by form: say and ask `wide`, shop and team pick `rail`, teach a move `wide`. Forms keep their bodies and filters.
- Ask: option cards, or the list with a have-line and an action when `list` is set. Shop: `Segmented` Buy / Sell over the tray. Team pick: party strip, then the Box / Saved `Segmented`, then the box. Teach: terms, the new move in a tide card, known moves as the catch sheet's move cards, the forgotten one struck in ember.

## Phone

Decided here, at 390x844: every dialog is one column. The counter hero stacks the stage above the bubble. Line-up and crate trays stay 3 wide. Dock buttons are full width, the action on top. Safari keeps its three tiles in a row with the field at 200px. The world map's rail becomes a scrolling chip row over the map (Ground, Sky, then the showpieces), and the key sits behind a Key chip as today. The map pad stays on the canvas. Conversation forms use the full width; the team pick's party strip stays above the box.

## Steps

- [ ] Split any file past reading in one sitting first (`component-layout` skill), behaviour unchanged, as its own commit. `SafariDialog.tsx` (944 lines) is the candidate: field, textbox and tiles.
- [ ] Restyle `forms/terms.tsx` and add the hero band as one shared component.
- [ ] Build the five counters on it.
- [ ] Build Safari.
- [ ] Build the world map with its rail.
- [ ] Build the conversation frame and every form.
- [ ] Build the phone layouts above.
- [ ] Fast check: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), and the test files this node touched.

## Acceptance

- [ ] Every item in `log.md` is ticked: none is lost.
- [ ] Fast check passes.
- [ ] Behaviour is unchanged: what each counter charges, grants and refuses, and how a throw, a pan and a form answer work.
- [ ] Words in gold use `text-gold-dark`.
- [ ] Captures, `pnpm test` and the changeset belong to the story `ui-redesign-finish`, not to this node.

## Sizing

L: five counters, Safari, the map and eleven forms, with shared furniture in `forms/terms.tsx`. If it runs long, finish the shared hero and the counters first, then leave the forms for a follow-up commit on the same branch rather than cutting the inventory.

## Notes for the worker

- Every string goes through the message functions, with ja and es present. Decide the wording yourself.
- Do not change what the dialogs save or how. Layout, look and the approved proposals only.
- The world map keeps its canvas, key and pan handlers. Only the chrome around it moves.
- `NpcSprite` and the landmark atlas sprites keep their sizes and smoothing rules (pixels stay pixels).
- The `PickTeamForm`, `CatchPicker` and `ItemTray` pieces are shared with other screens. Change them only through their props or the shared `styled` pieces, and leave the box, bag and picker looks as `ui-redesign-box-dex-bag` made them.
- Lists that can grow are paged (`paged-lists` skill). The portal's town list already is.
- Leave handoffs for `ui-redesign-shell` and `ui-redesign-social` in `outcome.md`: the hero band component and the counter furniture.
