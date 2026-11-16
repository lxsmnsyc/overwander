# Log: ui-redesign-social

## Inventory (2026-11-16, read from the components)

Paths are under `src/components/`. Each item is ticked when it has a place in the built screen. "Board" names a file in `docs/design/field-kit/`. The lobby parts that live in `battle/` are in this node's owned paths.

### Profile panes: friends, requests, trades, bids, selling (`friends/FriendsTab.tsx`, `RequestsTab.tsx`, `FriendEntry.tsx`, `trades/TradesTab.tsx`, `auctions/BidsList.tsx`, `SellingList.tsx`, Board `ProfileSocial.dc.html`)

The frame (hero, rail) is built by `ui-redesign-shell`; these are the panes in it.
- [ ] Friends: search above `SEARCH_FROM`, count, rows (`FriendEntry`: face, name, since, press to open the profile) with Trade and Remove, Blocked list with Unblock, paged, Add a friend button in the pane's top right.
- [ ] Requests: asked of you (Accept, Decline), waiting on them (Cancel), empty notes.
- [ ] Trades: Pending (count badge) / Settled; offered to you (Accept with a second press "Are you sure?", Answer for an open ask, Decline), waiting on them (Take back, same second press), a divider; settled rows with a word and date, paged.
- [ ] Deal line: gives, asks, gold riding, "their pick" wording; `NamedCatch` names.
- [ ] Bids: lots bid on with winning, outbid or won state.
- [ ] Selling: lots on the block (take back), lots waiting in escrow (collect), stranded count on the rail.
- [ ] Moves: rows become the `row` card (face, two lines, buttons right); the pane header holds the segmented tabs and the primary action.

### Trade offer (`trades/TradeOfferDialog.tsx`, Board `Trades.dc.html`)

- [ ] Title "Trade with name", description.
- [ ] Your side: the picked pokemon (`NamedCatch`) or "nothing picked", Pick yours / Change -> opens the catch picker in place of the dialog.
- [ ] Their side: named ask, "their pick" or ask for one, Change, clear to leave it to them.
- [ ] Gold select (none, I give, I ask) and amount field with the limit, notes for when gold is taken.
- [ ] Ask note (`trade_ask_note`).
- [ ] Send (disabled until ready), Never mind.
- [ ] Answer flow: the catch picker "Answer with", reasons it refuses (battle, egg, favourite, buddy).
- [ ] Moves: the two sides face each other in two framed cards with a swap mark between them; gold becomes a segmented control with the amount beside it.

### Auctions (`auctions/auction-tab/*`, `AuctionDialog.tsx`, Board `Auctions.dc.html`)

- [ ] Dialog `wide` -> `rail`; Add a lot / Back to the board in the dock beside Close.
- [ ] Gold badge (not when `viewOnly`), search above `SEARCH_FROM` with the price vocabulary.
- [ ] Items grid and Pokemon grid of lots, newest first; hover card per lot (record, seller, bid, View, bid or collect or take back actions).
- [ ] Loading, empty and no-match notes.
- [ ] Sell mode replaces the board: hint (duration, catches, items, unsold), "from your bag" tray, "from your records" picker, running-lot note, Back to the board.
- [ ] Bid dialog: lot, top bid and least raise, amount field, refusals (dear, own, winning), Bid, Never mind.
- [ ] List dialog (`AuctionDialog`): subject, opening bid, least raise, Put up, then the confirm dialog (catch or item, payment, description), failures.
- [ ] Collect, take back and bid statuses.
- [ ] Moves: the gold badge moves into a left rail. Proposal: Everything / Items / Pokemon filters in that rail.

### Raids (`raids/RaidsTab.tsx`, `RaidLobby.tsx`, `RaidDialog.tsx`, Board `Raids.dc.html`)

- [ ] List: Invited (boss asleep, name, types, "called you to fight or watch", Open, Dismiss), Gathering n with the next-window countdown, rows (sprite, name, types, where and team count, Open), paged, empty and loading notes.
- [ ] Lobby: dialog `broad`, named for the lair; boss card (sleeping sprite, level and name, types, Tera type, weak to, resists, immune, relic spent note, hosting or waiting badge).
- [ ] Trainers x / y, search above `SEARCH_FROM` (`is:host`), rows (player plate with the host tag, party strip), your row first and highlighted, scrolls inside.
- [ ] Watching disclosure with `SpectatorList`.
- [ ] Notice line (watch only, full, start needs a team), status line.
- [ ] Dock: Invite (host or a team member), Form a team / Change team (`PickTeamForm`), Start (host, disabled with no team), Leave.
- [ ] Lair dialog (`RaidDialog`): boss asleep at 4x on a floor, terms (waiting, types, Tera type), the description, the action (open, join, and so on), Walk on; the empty lair panel.
- [ ] Moves: list rows become a 2-column grid of lair cards; the boss card gets a field floor; the lair dialog gets the hero band.

### Duels (`duels/DuelsTab.tsx`, `DuelLobby.tsx`, `battle/DuelRulesDialog.tsx`, `LobbyParty.tsx`, `SpectatorList.tsx`, Board `Duels.dc.html`)

- [ ] List: intro note, Invited (Join, Dismiss), Your lobbies (host or guest, in the room count, "being fought"), Host a lobby, Host and watch.
- [ ] Lobby: rules chips (team size, moves, abilities, items, stat total, bans, Unranked), Change rules (host).
- [ ] Two seats facing across the field with VS; a seat: face, name, host tag, seat number, party (`LobbyParty`), Change team, Ready stamp; the open seat with Take the seat.
- [ ] Watching: faces and a disclosure list.
- [ ] Dock note (waiting, blockers, "the host starts the fight"), status, Invite, Start (host, blocked reasons), Close the lobby or Leave.
- [ ] Rules dialog: moves, abilities, held items, team size, highest stat total, three bans, hint, note, Save, Cancel.
- [ ] Moves: rules chips stay as terms; the field and seats are kept and restyled.

### Friends and the lobby invite (`friends/AddFriendDialog.tsx`, `battle/LobbyInviteDialog.tsx`, Board `Friends.dc.html`)

- [ ] Add a friend: your code with Copy and the copied state, their code with Look up, the found player (View, Add), loading and no-code notes.
- [ ] Lobby invite (raids and duels): role select when more than one, invite by code, friends list (Invite, Invited, Already here), paged, empty note, Close.
- [ ] Moves: role select becomes a segmented control; the code row keeps its place.

### Gifts and notifications (`gifts/GiftsTab.tsx`, `notifications/NotificationsTab.tsx`, Board `Gifts.dc.html`)

- [ ] Gifts: tabs Pokemon / Items / Encounters with counts, the open tab defaults to the first with something; Pokemon and Encounters as a box grid with a hover card (mystery gift, the record preview, reason, ledger note, Take or Meet), items as an item grid; empty notes by tab; dashboard modes `viewOnly` and `everything` keep their cell and ledger notes.
- [ ] Notifications: rows by kind (raid, battle, friend, trade, auction) with a tone badge, the line, the sender as a person row when there is one, the date, an action that opens the right panel, paged, empty note.
- [ ] Moves: tabs become a segmented control; notification rows get a colour edge by kind.

## Proposals

- Auctions rail filters (Everything / Items / Pokemon).
- Trade offer: none beyond layout.
- Others: none.

## Phone notes

- Rails become chip rows. Lobbies stack: boss card above trainers; duel seats stack with VS between. The trade sides stack with the swap mark between. Grids stay 4 to 6 wide, tooltips and hover cards become a sheet at the foot.
