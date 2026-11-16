---
id: ui-redesign-shell
title: Redesign settings, profile, quests and the shell
status: todo
priority: must
type: feature
story: ui-redesign-finish
outline: false
milestone: now
size: L
added: 2026-11-03
owns:
  - src/components/app/LoginForm.tsx
  - src/components/app/Announcements.tsx
  - src/components/app/command-bar/**
  - src/components/settings/**
  - src/components/profile/**
  - src/components/quests/**
  - src/components/news/**
  - src/components/battle/BattleHistory.tsx
  - src/components/catches/BuddyCard.tsx
shared:
  - src/components/styled/**
  - src/routes/index.tsx
  - src/routes/battle/[id].tsx
provides: []
depends_on:
  - on: ui-redesign-finish-boards
    kind: hard
    why: Built to the boards approved at its gate
  - on: ui-redesign-overworld-dialogs
    kind: hard
    why: One node at a time on this device; shares src/components/styled and builds on the last one's pieces
  - on: ui-design-system
    kind: hard
    why: Built on its tokens and primitives
---

# Redesign settings, profile, quests and the shell

## Goal

Rebuild the title screen, announcements, command bar, settings, profile, quests and news on the Field Kit system. Build to the six boards the maintainer approves at the gate of `ui-redesign-finish-boards`, proposals included.

## Context

- Spec: `docs/design/field-kit/Login.dc.html`, `CommandBar.dc.html`, `Settings.dc.html`, `Profile.dc.html`, `Quests.dc.html`, `News.dc.html`, and their notes `inv-login`, `inv-commandbar`, `inv-settings`, `inv-profile`, `inv-quests`, `inv-news` in `docs/design/field-kit/canvas.json`. The profile's Friends, Requests, Trades, Bids and Selling panes are on `ProfileSocial.dc.html` and are built by `ui-redesign-social`. System: `docs/design/field-kit.md`.
- The inventory is in `log.md` in this folder, read from every component on 2026-11-16. Tick each item as it gets a place.
- Read the outcomes of `ui-design-system`, `ui-redesign-overworld`, `ui-redesign-box-dex-bag` and `ui-redesign-overworld-dialogs` first. They give the rail pieces (`RAIL`, `railRow`, `RailTab`, `RailTabs`), `Segmented`, `CARD`, `Dialog` widths (`rail`, `sheet`), option cards (`RadioGroup cards`), `text-gold-dark`, the hero band from the dialogs node and `MORPH`.
- `GameMenu.tsx` and `FullscreenToggle.tsx` belong to `ui-redesign-overworld`, not this node.
- The dialogs are mounted in `src/routes/index.tsx` (shared path: widths and wrappers only). `LoginForm` is also drawn by `src/routes/battle/[id].tsx`.
- Renderer: none changes. DOM only.

## The moves (from the boards)

Title screen (`app/LoginForm.tsx`, signed-out `Home` and the banned screen in `routes/index.tsx`):
- The card gets a tinted header with the name and tagline. The theme toggle stays top right as a 40px square.
- Sign in / Create is a full-width `Segmented`. The passkey and provider buttons sit in a two-column grid under the "or" divider.
- The code step keeps its note, field, trust box, Continue, swap and Back.

Announcements and command bar (`app/Announcements.tsx`, `app/command-bar/*`):
- Banners stay at top centre as gold-soft cards with a 28px close. Dismissal is still remembered per device.
- The command bar is a sheet near the top. The answer is above the input, the suggestions under it, hints right-aligned. Keys are unchanged.
- Proposal, for the maintainer at the gate: a one-line key hint under the list.

Settings (`settings/*`):
- `rail` width. The panes become a rail with a colour square each, About after a divider, Development in a dev build only. The open pane is still remembered per device.
- Language, clock, board edge and box width become option cards. Switches, sliders and key rows keep their rows, one card per pane group.
- Security, About and Credits keep their content.

Profile (`profile/*`, `battle/BattleHistory.tsx`, `catches/BuddyCard.tsx`):
- `sheet` width, own and visited. The trainer card and the buddy card become the hero band's two halves. The actions menu sits at the hero's right edge.
- Own: the rail of sections (Record, Social, Market with the ember counts). Visited: a `Segmented` Battles / Awards, no rail.
- Battles, Awards and Teams are restyled inside the pane. Friends, Requests, Trades, Bids and Selling mount the social node's panes in the same pane slot.
- The edit dialog opens at `wide` with the trainer sprites as a tray. Sign out stays in the menu.

Quests (`quests/quests-tab/*`):
- `rail` width. Today and This week are the first rail rows, each chain a row with a leaf count for ready and a claimed / total count, then Asked of anybody and Done. The open chain fills the pane. The hint is a `?` at the top right.
- Proposal, for the maintainer at the gate: a progress track at the pane's head (claimed over total).

News (`news/*`):
- `rail` width. The release list is the rail, the release page is the pane beside it. A phone keeps the sheet.
- Proposal, for the maintainer at the gate: the rail pages at `LIST_PAGE` (`paged-lists` skill).

## Phone

Decided here, at 390x844: every screen is one column. Rails become a scrolling chip row over the pane (settings panes, profile sections, quest chains). The profile hero stacks: face and name first, then the buddy card. The title card fills the width with 16px gutters. The command bar fills the width 8% from the top. News shows the release list, and a release opens as a sheet. Settings option cards stack in one column.

## Steps

- [ ] Split any file past reading in one sitting first (`component-layout` skill), behaviour unchanged, as its own commit. `profile/ProfileTab.tsx` (558 lines), `settings/SettingsTab.tsx` (476) and `profile/AwardsCard.tsx` (651) are the candidates.
- [ ] Build the title screen, announcements and command bar.
- [ ] Build settings.
- [ ] Build the profile hero, rail, Battles, Awards, Teams, the visited view and the edit dialog.
- [ ] Build quests.
- [ ] Build news.
- [ ] Build the phone layouts above.
- [ ] Fast check: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), and the test files this node touched.

## Acceptance

- [ ] Every item in `log.md` is ticked: none is lost.
- [ ] Fast check passes.
- [ ] Behaviour is unchanged: sign in and second factor, bindings and their storage, claims, edits, sign out.
- [ ] Words in gold use `text-gold-dark`.
- [ ] Captures, `pnpm test` and the changeset belong to the story `ui-redesign-finish`, not to this node.

## Sizing

L: six screens, a profile with a hero and a rail, and settings with eight panes. If it runs long, finish settings and the profile first, then leave quests and news for a follow-up commit on the same branch rather than cutting the inventory.

## Notes for the worker

- Every string goes through the message functions, with ja and es present. Decide the wording yourself.
- Do not change what the screens save or how.
- The profile mounts panes owned by `ui-redesign-social`. Leave their slots and props as they are, and hand over the rail's section list in `outcome.md`.
- The profile's pane slot must stay a plain container so the social panes can fill it.
- `BuddyCard` is read-only when the profile is visited. Keep that.
- `LoginForm` is drawn by two routes. Check both after the change.
- Lists that can grow are paged (`paged-lists` skill): the release rail is, and the battle history already is.
