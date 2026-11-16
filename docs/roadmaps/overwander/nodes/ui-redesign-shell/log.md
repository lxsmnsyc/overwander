# Log: ui-redesign-shell

## Inventory (2026-11-16, read from the components)

Paths are under `src/components/`. Each item is ticked when it has a place in the built screen. "Board" names a file in `docs/design/field-kit/`.

### Title screen and sign in (`app/LoginForm.tsx`, the signed-out `Home` in `routes/index.tsx`, Board `Login.dc.html`)

- [x] Card on the world's grid: "Overwander" in display type, tagline `landing_tagline`, theme toggle at the card's top right -> a card with a tinted header holding the name and tagline; the toggle stays top right as a 40px square.
- [x] Loading note (`landing_loading`) while auth resolves.
- [x] Mode tabs Sign in / Create (`TabBar`, full width) -> a segmented control across the card.
- [x] Email field (`autocomplete="username webauthn"`), password field (`current-password` or `new-password`), the length hint on Create.
- [x] Error `Status` above the button; submit button (Sign in or Create).
- [x] "or" divider and other ways: passkey (Sign in tab only), one button per provider; hidden when nothing is left to offer -> a two-column grid of buttons.
- [x] Second factor step: note (app or backup), code field, "Trust this device for 30 days" (app only), Continue, Use a backup code / Use the app, Back.
- [x] Banned screen (`refusal_banned`, reason, Sign out) in `routes/index.tsx` takes the card look.

### Announcements and the command bar (`app/Announcements.tsx`, `app/command-bar/*`, Board `CommandBar.dc.html`)

- [x] Announcement banners: fixed top centre, one per live message, gold, dismiss button with the id remembered per device -> gold-soft cards with a 28px close; unchanged place.
- [x] Command bar: opens near the top (12%), 34rem, `Escape` closes; hidden unless `allowed`.
- [x] Answer or refusal `Status` above the input.
- [x] Input with the `/` mark, `combobox` roles, Tab completes, arrows choose, Enter runs, running state.
- [x] Suggestion list (label, right-aligned hint, active row) under the input, 64px high, scrolls.
- [x] Proposal: a one-line key hint under the list ("Tab completes, Up and Down choose, Enter runs, Escape closes").

### Settings (`settings/SettingsTab.tsx`, `SecurityPane.tsx`, `CreditsCard.tsx`, Board `Settings.dc.html`)

- [x] Dialog `wide` -> `rail` (59rem).
- [x] Panes (`SETTINGS_PANES`): Display, Controls, World, Play, Audio, Security, About, Development (dev build only); About keeps its divider; the open pane is remembered per device -> a rail with a colour square each, the same order.
- [x] Display: theme switch, language radio (each language named in itself), reduce motion switch, clock radio (24h, 12h).
- [x] Controls: note, one key row per action (up, down, left, right, interact, menu) that rebinds on a key press (`KeyBind`).
- [x] World: grid lines, chunk lines, map grid, flat board switches, board edge radio (haze, full, plain), detailed map switch.
- [x] Play: keep ball switch, box width radio (5, 6, 8).
- [x] Audio: note, sound slider, music slider.
- [x] Security: password state, passkeys (list, name field, add, remove), authenticator app (offer, scan, turn on, turn off), backup codes (new codes), password confirmation step.
- [x] About: Overwander card (description, author, dex line, source and licence), Credits card (art, sprites, overworld, scenery, libraries, loading note), "not affiliated" card.
- [x] Development: step highlight, shiny boost switches.
- [x] Moves: radio rows (language, clock, edge, box width) become option cards (the same `RadioGroup cards` as Bottle Cap); the pane's cards keep their grouping.

### Profile (`profile/*`, `battle/BattleHistory.tsx`, `catches/BuddyCard.tsx`, Board `Profile.dc.html`)

- [x] Own profile: dialog `broad` -> `sheet` (76rem); visited profile (`ProfileDialog`) `wide` -> the same sheet without the rail.
- [x] Trainer card: face (`PlayerFace`, 64px), nickname, worn title badge (tier metal for line and type titles, gold for ladder titles), gold, place line (`PlayerPlace`) -> the hero band: face 72px, name, badges, place line on the left.
- [x] Buddy card (`BuddyCard`: walking with, friendship, steps, change, egg states, empty note) -> the hero's right half.
- [x] Actions menu: own (Edit profile, Add a friend, Sign out); visited (Battle, friend action by tie, Block unless blocked) -> the same menu at the hero's right edge.
- [x] Own sections in a side list grouped Record (Battles, Awards, Teams), Social (Friends, Requests, Trades), Market (Bids, Selling), with ember counts (requests waiting, lots stranded) -> the rail.
- [x] Visited: Battles / Awards tabs -> a segmented control.
- [x] Battles (`BattleHistory`): kind filter, rows (verdict, vs, when, Watch replay, Copy link), waiting claims by kind, empty notes, paged.
- [x] Awards (`AwardsCard`): summary (badges, elite, champion), tabs Badges / Types / Trainers / Achievements, regions with earned and unearned medals, tiers.
- [x] Teams (`TeamsCard`): saved presets (name, party, default mark, edit, delete), new team, limits and hints, empty and shortfall notes.
- [x] Friends, Requests, Trades, Bids, Selling panes are drawn in the social node's `ProfileSocial.dc.html` and built there.
- [x] Edit profile dialog: nickname with hint, sprite picker, title combobox with search and hint, Save and Saving, Close.
- [x] Status lines: saved, error, friend error.
- [x] Moves: "Sign out" stays in the menu; the rail and hero replace the stacked card; the Edit dialog widens to `wide` and shows the sprites as a tray.

### Quests (`quests/quests-tab/*`, Board `Quests.dc.html`)

- [x] Dialog `wide` -> `rail`; hint (rotation, after-midnight, chains, claim) -> a `?` at the top right.
- [x] Today (three dailies) and This week (one) -> the first two rail rows under "Rotating".
- [x] Chains accordion (a row per chain: name, ready badge, claimed / total; open when something is ready) -> rail rows under "Chains" with a leaf count for ready and a count for claimed / total; the open chain fills the pane.
- [x] Asked of anybody, Done -> rail rows under "Other".
- [x] Quest card: name, Claim (primary, disabled until ready or while busy), Claimed badge; requirement tiles (icon, text, turn-in note, progress bar, have / asked, met check); Pays line with gold badges and item sprites; locked card -> same content, always open in the pane.
- [x] Re-reads on reopen and after a claim.
- [x] Proposal: a progress track at the head of the pane (claimed over total), read from counts the board already has.

### News (`news/NewsTab.tsx`, `markdown.tsx`, `releases.ts`, Board `News.dc.html`)

- [x] Dialog `wide` -> `rail`.
- [x] Release list: name, Latest badge on the first, the "brought" line -> a rail of releases.
- [x] Release page (a nested dialog today) -> the pane beside the rail, rendered by `markdown.tsx`; on a phone it stays a sheet.
- [x] Empty note (`news_empty`).
- [x] Proposal: the rail is paged at `LIST_PAGE` (the list grows with every update).

## The moves, in one place

- Settings, Quests, News: a left rail replaces tabs, an accordion and a nested dialog.
- Profile: stacked card becomes a hero band over a rail.
- Settings radios become option cards.
- Title screen: tinted header, segmented mode control.
- Nothing is dropped.

## Proposals

- Command bar key hint line.
- Quests progress track.
- News rail pager.

## Phone notes

- Rails become a scrolling chip row over the pane. The Profile hero stacks (face and name, then buddy). The Quests chain rail is a chip row with ready counts. News shows the list, and a release opens as a sheet.

## Where each item went (2026-11-16, built)

- Title screen: `TitleCard` in `app/LoginForm.tsx` (tinted header, 40px theme square, 420px, both routes and the banned screen); `Segmented fill` for the mode; `TextField labelFace tall`; buttons 44/46px.
- Announcements: gold-soft card, 28px close, `rise-in`. Command bar: sheet panel, 46px input with tide halo, 38px rows, answer as a soft card, key hint line (proposal) under the list, top 8% on a phone.
- Settings: `settings/settings-tab/` (index = rail and pane head, `panes.tsx`, `choices.ts`), `setting-card.tsx` (card, note, line, state row), `Switch`/`Slider`/`KeyBind` `row`, `RadioGroup cards named columns`. Security rows are state rows with an On/off pill. Dock note `settings_dock_note`.
- Profile: `profile/profile-sheet/` (`state.ts`, `hero.tsx`, `body.tsx`, `title-badge.tsx`, `index.tsx`), `profile/awards-card/`, `ProfileTab.tsx` kept as the dialog-less view the staff panel uses. Buddy bars became text (friendship number, steps walked, hatch steps); the friendship words are the tooltip.
- Battles: row cards, `Segmented` kind filter, "n fought" count; the frozen team strip stays on each row. Teams: header with lede, Hint and New team; white rows with the strip under the name. No "default" mark exists in the code, so none is drawn.
- Awards: tiles, `Segmented` shelves, a card per region of medals, "Beyond the regions" card for the Frontier, syndicates and legends. The per-region summary sentences are now the count pill's label for a screen reader.
- Quests: `quests-tab/board.tsx` rail and panes, `cards.tsx`, `hint.tsx`. News: `news/NewsTab.tsx`, `ReleaseLine` in `markdown.tsx`.

## Review fixes

Duplicate backup codes removed, board language notes, progress track on every quest pane, News rail on RailTabs, icons moved to components/icons, Switch track 26px. See outcome.md.
