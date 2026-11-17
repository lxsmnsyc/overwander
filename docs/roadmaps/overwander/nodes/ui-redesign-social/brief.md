---
id: ui-redesign-social
title: Redesign trades, auctions, raids and friends
status: done
priority: must
type: feature
story: ui-redesign-finish
outline: false
milestone: now
size: L
added: 2026-11-03
spent: 683188
owns:
  - src/components/trades/**
  - src/components/auctions/**
  - src/components/raids/**
  - src/components/duels/**
  - src/components/friends/**
  - src/components/gifts/**
  - src/components/notifications/**
  - src/components/battle/DuelRulesDialog.tsx
  - src/components/battle/LobbyInviteDialog.tsx
  - src/components/battle/LobbyParty.tsx
  - src/components/battle/SpectatorList.tsx
shared:
  - src/components/styled/**
  - src/routes/index.tsx
provides: []
depends_on:
  - on: ui-redesign-finish-boards
    kind: hard
    why: Built to the boards approved at its gate
  - on: ui-redesign-shell
    kind: hard
    why: One node at a time on this device; shares src/components/styled and builds on the last one's pieces
  - on: ui-design-system
    kind: hard
    why: Built on its tokens and primitives
---

# Redesign trades, auctions, raids and friends

## Goal

Rebuild the profile's social panes, trades, auctions, raids, duels, friends, gifts and notifications on the Field Kit system. Build to the seven boards the maintainer approves at the gate of `ui-redesign-finish-boards`, proposals included.

## Context

- Spec: `docs/design/field-kit/ProfileSocial.dc.html`, `Trades.dc.html`, `Auctions.dc.html`, `Raids.dc.html`, `Duels.dc.html`, `Friends.dc.html`, `Gifts.dc.html`, and their notes (`inv-profilesocial`, `inv-trades`, `inv-auctions`, `inv-raids`, `inv-duels`, `inv-friends`, `inv-gifts`) in `docs/design/field-kit/canvas.json`. System: `docs/design/field-kit.md`.
- The inventory is in `log.md` in this folder, read from every component on 2026-11-16. Tick each item as it gets a place.
- Read the outcomes of `ui-design-system`, `ui-redesign-battle`, `ui-redesign-box-dex-bag`, `ui-redesign-overworld-dialogs` and `ui-redesign-shell` first. They give the rail pieces, `Segmented`, `DetailPanel`, `CARD`, the lobby pieces from the battle node (`GLASS`, `HealthTrack`, `TeamCard`), the hero band, `Dialog` widths (`wide`, `rail`, `broad`, `sheet`) and the profile's pane slot.
- The panes of Friends, Requests, Trades, Bids and Selling mount inside the profile `ui-redesign-shell` builds. The lobby parts that live in `src/components/battle/` (`DuelRulesDialog`, `LobbyInviteDialog`, `LobbyParty`, `SpectatorList`) are owned here.
- The dialogs are mounted in `src/routes/index.tsx` (shared path: widths and wrappers only).
- Renderer: none changes. DOM only.

## The moves (from the boards)

Profile panes (`friends/FriendsTab.tsx`, `RequestsTab.tsx`, `FriendEntry.tsx`, `trades/TradesTab.tsx`, `auctions/BidsList.tsx`, `SellingList.tsx`):
- Rows become the row card: face, two lines, a state pill, buttons right.
- Pending / Settled is a `Segmented` at the pane's head. Add a friend sits at the pane's top right.
- Accept, Take back and Remove keep the second press. Answer, collect and take back keep their flows.

Trades (`trades/TradeOfferDialog.tsx`):
- `wide`-plus width. The two sides are framed cards facing each other with a swap mark between them. Gold is a `Segmented` (none, I give, I ask) with the amount and its note beside it. The answer picker opens at `rail` width with its reasons on the squares.

Auctions (`auctions/auction-tab/*`, `AuctionDialog.tsx`):
- `rail` width. The gold badge moves into a left rail. Items and Pokemon keep their order and grids, 8 wide. The hover card carries seller, bid, View and the bid, collect or take-back actions. Sell mode still replaces the board. Bid and List are narrow sheets with a lot row on top.
- Proposal, for the maintainer at the gate: Everything / Items / Pokemon filters in the rail.

Raids (`raids/RaidsTab.tsx`, `RaidLobby.tsx`, `RaidDialog.tsx`):
- The list is a 2-column grid of lair cards, Invited above with an ember wash, the next-window tile at the right of the Gathering heading. The lobby is `broad`: the boss card with a field floor on the left, trainers on the right with your row first and highlighted, the dock as today. The lair dialog gets the hero band with the sleeping boss on the floor.

Duels (`duels/DuelsTab.tsx`, `DuelLobby.tsx`, `battle/DuelRulesDialog.tsx`, `LobbyParty.tsx`, `SpectatorList.tsx`):
- The list keeps its sections in a narrower sheet. The lobby keeps the rules chips, the field, the seats, VS, the Ready stamp and the dock note. The rules dialog is a two-column field grid with the bans as switches.

Friends and invites (`friends/AddFriendDialog.tsx`, `battle/LobbyInviteDialog.tsx`):
- Your code is a tinted card with Copy. The role select is a `Segmented`.

Gifts and notifications (`gifts/GiftsTab.tsx`, `notifications/NotificationsTab.tsx`):
- Gifts: `rail` width, a `Segmented` with counts, the grid and hover card as today. Notifications: rows with a colour edge by kind, the sender as a face and name, the action as the primary button.

## Phone

Decided here, at 390x844: every screen is one column. Profile panes use the profile's chip row. Lobbies stack: the raid boss card sits above the trainers, the duel seats stack with VS between them, and the trade sides stack with the swap mark between them. Grids stay 4 to 6 wide. Hover cards on lots and gifts become a sheet across the foot, as the bag's detail panel does. Dock buttons are full width.

## Steps

- [ ] Split any file past reading in one sitting first (`component-layout` skill), behaviour unchanged, as its own commit. `raids/RaidLobby.tsx` (about 800 lines), `auctions/auction-tab/board.tsx` and `duels/DuelLobby.tsx` are the candidates.
- [ ] Build the profile panes.
- [ ] Build trades.
- [ ] Build auctions.
- [ ] Build raids.
- [ ] Build duels and the shared lobby pieces.
- [ ] Build friends, gifts and notifications.
- [ ] Build the phone layouts above.
- [ ] Fast check: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), and the test files this node touched.

## Acceptance

- [ ] Every item in `log.md` is ticked: none is lost.
- [ ] Fast check passes.
- [ ] Behaviour is unchanged: offers, bids, listings, lobbies, starts, claims and every refusal.
- [ ] Words in gold use `text-gold-dark`.
- [ ] Captures, `pnpm test` and the changeset belong to the story `ui-redesign-finish`, not to this node.

## Sizing

L: seven boards, two lobbies, an auction board with three dialogs, and the profile's five panes. If it runs long, finish the profile panes, trades and the lobbies first, then leave gifts and notifications for a follow-up commit on the same branch rather than cutting the inventory.

## Notes for the worker

- Every string goes through the message functions, with ja and es present. Decide the wording yourself.
- Do not change what the screens save or how.
- Lists that can grow are paged (`paged-lists` skill): friends, trades, lots, lairs and notifications already are.
- `LobbyInviteDialog` and `DuelRulesDialog` are used by both lobbies. Check both after a change.
- The trade and auction pickers share the catch picker with other screens. Change them through their props only.
- The lobbies' battle-view pieces (`TeamCard`, `HealthTrack`) belong to `ui-redesign-battle`. Reuse them and do not edit them.
