# Log: ui-redesign-social

## Inventory (2026-11-16, read from the components)

Paths are under `src/components/`. Each item is ticked when it has a place in the built screen. "Board" names a file in `docs/design/field-kit/`. The lobby parts that live in `battle/` are in this node's owned paths.

### Profile panes: friends, requests, trades, bids, selling (`friends/FriendsTab.tsx`, `RequestsTab.tsx`, `FriendEntry.tsx`, `trades/TradesTab.tsx`, `auctions/BidsList.tsx`, `SellingList.tsx`, Board `ProfileSocial.dc.html`)

The frame (hero, rail) is built by `ui-redesign-shell`; these are the panes in it.
- [x] Friends: search above `SEARCH_FROM`, count, rows (`FriendEntry`: face, name, since, press to open the profile) with Trade and Remove, Blocked list with Unblock, paged, Add a friend button in the pane's top right.
- [x] Requests: asked of you (Accept, Decline), waiting on them (Cancel), empty notes.
- [x] Trades: Pending (count badge) / Settled; offered to you (Accept with a second press "Are you sure?", Answer for an open ask, Decline), waiting on them (Take back, same second press), a divider; settled rows with a word and date, paged.
- [x] Deal line: gives, asks, gold riding, "their pick" wording; `NamedCatch` names.
- [x] Bids: lots bid on with winning, outbid or won state.
- [x] Selling: lots on the block (take back), lots waiting in escrow (collect), stranded count on the rail.
- [x] Moves: rows become the `row` card (face, two lines, buttons right); the pane header holds the segmented tabs and the primary action.

### Trade offer (`trades/TradeOfferDialog.tsx`, Board `Trades.dc.html`)

- [x] Title "Trade with name", description.
- [x] Your side: the picked pokemon (`NamedCatch`) or "nothing picked", Pick yours / Change -> opens the catch picker in place of the dialog.
- [x] Their side: named ask, "their pick" or ask for one, Change, clear to leave it to them.
- [x] Gold select (none, I give, I ask) and amount field with the limit, notes for when gold is taken.
- [x] Ask note (`trade_ask_note`).
- [x] Send (disabled until ready), Never mind.
- [x] Answer flow: the catch picker "Answer with", reasons it refuses (battle, egg, favourite, buddy).
- [x] Moves: the two sides face each other in two framed cards with a swap mark between them; gold becomes a segmented control with the amount beside it.

### Auctions (`auctions/auction-tab/*`, `AuctionDialog.tsx`, Board `Auctions.dc.html`)

- [x] Dialog `wide` -> `rail`; Add a lot / Back to the board in the dock beside Close.
- [x] Gold badge (not when `viewOnly`), search above `SEARCH_FROM` with the price vocabulary.
- [x] Items grid and Pokemon grid of lots, newest first; hover card per lot (record, seller, bid, View, bid or collect or take back actions).
- [x] Loading, empty and no-match notes.
- [x] Sell mode replaces the board: hint (duration, catches, items, unsold), "from your bag" tray, "from your records" picker, running-lot note, Back to the board.
- [x] Bid dialog: lot, top bid and least raise, amount field, refusals (dear, own, winning), Bid, Never mind.
- [x] List dialog (`AuctionDialog`): subject, opening bid, least raise, Put up, then the confirm dialog (catch or item, payment, description), failures.
- [x] Collect, take back and bid statuses.
- [x] Moves: the gold badge moves into a left rail. Proposal: Everything / Items / Pokemon filters in that rail.

### Raids (`raids/RaidsTab.tsx`, `RaidLobby.tsx`, `RaidDialog.tsx`, Board `Raids.dc.html`)

- [x] List: Invited (boss asleep, name, types, "called you to fight or watch", Open, Dismiss), Gathering n with the next-window countdown, rows (sprite, name, types, where and team count, Open), paged, empty and loading notes.
- [x] Lobby: dialog `broad`, named for the lair; boss card (sleeping sprite, level and name, types, Tera type, weak to, resists, immune, relic spent note, hosting or waiting badge).
- [x] Trainers x / y, search above `SEARCH_FROM` (`is:host`), rows (player plate with the host tag, party strip), your row first and highlighted, scrolls inside.
- [x] Watching disclosure with `SpectatorList`.
- [x] Notice line (watch only, full, start needs a team), status line.
- [x] Dock: Invite (host or a team member), Form a team / Change team (`PickTeamForm`), Start (host, disabled with no team), Leave.
- [x] Lair dialog (`RaidDialog`): boss asleep at 4x on a floor, terms (waiting, types, Tera type), the description, the action (open, join, and so on), Walk on; the empty lair panel.
- [x] Moves: list rows become a 2-column grid of lair cards; the boss card gets a field floor; the lair dialog gets the hero band.

### Duels (`duels/DuelsTab.tsx`, `DuelLobby.tsx`, `battle/DuelRulesDialog.tsx`, `LobbyParty.tsx`, `SpectatorList.tsx`, Board `Duels.dc.html`)

- [x] List: intro note, Invited (Join, Dismiss), Your lobbies (host or guest, in the room count, "being fought"), Host a lobby, Host and watch.
- [x] Lobby: rules chips (team size, moves, abilities, items, stat total, bans, Unranked), Change rules (host).
- [x] Two seats facing across the field with VS; a seat: face, name, host tag, seat number, party (`LobbyParty`), Change team, Ready stamp; the open seat with Take the seat.
- [x] Watching: faces and a disclosure list.
- [x] Dock note (waiting, blockers, "the host starts the fight"), status, Invite, Start (host, blocked reasons), Close the lobby or Leave.
- [x] Rules dialog: moves, abilities, held items, team size, highest stat total, three bans, hint, note, Save, Cancel.
- [x] Moves: rules chips stay as terms; the field and seats are kept and restyled.

### Friends and the lobby invite (`friends/AddFriendDialog.tsx`, `battle/LobbyInviteDialog.tsx`, Board `Friends.dc.html`)

- [x] Add a friend: your code with Copy and the copied state, their code with Look up, the found player (View, Add), loading and no-code notes.
- [x] Lobby invite (raids and duels): role select when more than one, invite by code, friends list (Invite, Invited, Already here), paged, empty note, Close.
- [x] Moves: role select becomes a segmented control; the code row keeps its place.

### Gifts and notifications (`gifts/GiftsTab.tsx`, `notifications/NotificationsTab.tsx`, Board `Gifts.dc.html`)

- [x] Gifts: tabs Pokemon / Items / Encounters with counts, the open tab defaults to the first with something; Pokemon and Encounters as a box grid with a hover card (mystery gift, the record preview, reason, ledger note, Take or Meet), items as an item grid; empty notes by tab; dashboard modes `viewOnly` and `everything` keep their cell and ledger notes.
- [x] Notifications: rows by kind (raid, battle, friend, trade, auction) with a tone badge, the line, the sender as a person row when there is one, the date, an action that opens the right panel, paged, empty note.
- [x] Moves: tabs become a segmented control; notification rows get a colour edge by kind.

## Proposals

- Auctions rail filters (Everything / Items / Pokemon).
- Trade offer: none beyond layout.
- Others: none.

## Phone notes

- Rails become chip rows. Lobbies stack: boss card above trainers; duel seats stack with VS between. The trade sides stack with the swap mark between. Grids stay 4 to 6 wide, tooltips and hover cards become a sheet at the foot.

## Build notes (2026-11-16)

- Every inventory item above is ticked: each has the place the board draws.
- Shared pieces added in `src/components/styled`: `row-card.tsx` (`RowCard`, `RowText`, `RowActions`, `Pill`, `GroupLabel`), `Segmented` option `hot`, `Button` tone `ghost-danger` (the boards' outlined danger button), `Select` `labelFace`, `Dialog` width `wider` (50rem).
- Splits: `raids/RaidLobby.tsx` became `raids/raid-lobby/`, `duels/DuelLobby.tsx` became `duels/duel-lobby/`. The auction board kept `board.tsx` and gained `rail.tsx` and `sell.tsx`.
- Order followed: profile panes, trade offer, raids, duels and lobby pieces, friends, gifts and notifications, auctions.
- Boards read element by element while building. Not built from a board, and why, is in `outcome.md` (Deviations).
- Fast check: typecheck, oxlint (exit 0), oxfmt, `vitest run test/components test/i18n` (16 files, 101 tests).

- Coordinator follow-ups built: phone sheet for lot and gift cards, ten-wide sell trays, social profile dock notes, answer picker dock note and Give button, one-sheet listing with an in-place second press, relative times with the date as tooltip, six unused messages deleted. Fast check rerun: typecheck, oxlint exit 0, oxfmt, `vitest run test/components test/i18n`.

- Review fixes built (items 1 to 16): pill and line messages, listing sheet and title, Suspense reads, empty-kind note, phone column counts, lair row buttons, duel dock order, always-visible Leave it to their pick, sell hint in the dialog corner, picker cleanup, explicit `ItemGrid` sheet, `lot-actions.tsx` split, ja wording, outcome corrected.
