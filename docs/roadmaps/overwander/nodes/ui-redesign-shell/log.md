# Log: ui-redesign-shell

## Inventory (2026-11-16, read from the components)

Paths are under `src/components/`. Each item is ticked when it has a place in the built screen. "Board" names a file in `docs/design/field-kit/`.

### Title screen and sign in (`app/LoginForm.tsx`, the signed-out `Home` in `routes/index.tsx`, Board `Login.dc.html`)

- [ ] Card on the world's grid: "Overwander" in display type, tagline `landing_tagline`, theme toggle at the card's top right -> a card with a tinted header holding the name and tagline; the toggle stays top right as a 40px square.
- [ ] Loading note (`landing_loading`) while auth resolves.
- [ ] Mode tabs Sign in / Create (`TabBar`, full width) -> a segmented control across the card.
- [ ] Email field (`autocomplete="username webauthn"`), password field (`current-password` or `new-password`), the length hint on Create.
- [ ] Error `Status` above the button; submit button (Sign in or Create).
- [ ] "or" divider and other ways: passkey (Sign in tab only), one button per provider; hidden when nothing is left to offer -> a two-column grid of buttons.
- [ ] Second factor step: note (app or backup), code field, "Trust this device for 30 days" (app only), Continue, Use a backup code / Use the app, Back.
- [ ] Banned screen (`refusal_banned`, reason, Sign out) in `routes/index.tsx` takes the card look.

### Announcements and the command bar (`app/Announcements.tsx`, `app/command-bar/*`, Board `CommandBar.dc.html`)

- [ ] Announcement banners: fixed top centre, one per live message, gold, dismiss button with the id remembered per device -> gold-soft cards with a 28px close; unchanged place.
- [ ] Command bar: opens near the top (12%), 34rem, `Escape` closes; hidden unless `allowed`.
- [ ] Answer or refusal `Status` above the input.
- [ ] Input with the `/` mark, `combobox` roles, Tab completes, arrows choose, Enter runs, running state.
- [ ] Suggestion list (label, right-aligned hint, active row) under the input, 64px high, scrolls.
- [ ] Proposal: a one-line key hint under the list ("Tab completes, Up and Down choose, Enter runs, Escape closes").

### Settings (`settings/SettingsTab.tsx`, `SecurityPane.tsx`, `CreditsCard.tsx`, Board `Settings.dc.html`)

- [ ] Dialog `wide` -> `rail` (59rem).
- [ ] Panes (`SETTINGS_PANES`): Display, Controls, World, Play, Audio, Security, About, Development (dev build only); About keeps its divider; the open pane is remembered per device -> a rail with a colour square each, the same order.
- [ ] Display: theme switch, language radio (each language named in itself), reduce motion switch, clock radio (24h, 12h).
- [ ] Controls: note, one key row per action (up, down, left, right, interact, menu) that rebinds on a key press (`KeyBind`).
- [ ] World: grid lines, chunk lines, map grid, flat board switches, board edge radio (haze, full, plain), detailed map switch.
- [ ] Play: keep ball switch, box width radio (5, 6, 8).
- [ ] Audio: note, sound slider, music slider.
- [ ] Security: password state, passkeys (list, name field, add, remove), authenticator app (offer, scan, turn on, turn off), backup codes (new codes), password confirmation step.
- [ ] About: Overwander card (description, author, dex line, source and licence), Credits card (art, sprites, overworld, scenery, libraries, loading note), "not affiliated" card.
- [ ] Development: step highlight, shiny boost switches.
- [ ] Moves: radio rows (language, clock, edge, box width) become option cards (the same `RadioGroup cards` as Bottle Cap); the pane's cards keep their grouping.

### Profile (`profile/*`, `battle/BattleHistory.tsx`, `catches/BuddyCard.tsx`, Board `Profile.dc.html`)

- [ ] Own profile: dialog `broad` -> `sheet` (76rem); visited profile (`ProfileDialog`) `wide` -> the same sheet without the rail.
- [ ] Trainer card: face (`PlayerFace`, 64px), nickname, worn title badge (tier metal for line and type titles, gold for ladder titles), gold, place line (`PlayerPlace`) -> the hero band: face 72px, name, badges, place line on the left.
- [ ] Buddy card (`BuddyCard`: walking with, friendship, steps, change, egg states, empty note) -> the hero's right half.
- [ ] Actions menu: own (Edit profile, Add a friend, Sign out); visited (Battle, friend action by tie, Block unless blocked) -> the same menu at the hero's right edge.
- [ ] Own sections in a side list grouped Record (Battles, Awards, Teams), Social (Friends, Requests, Trades), Market (Bids, Selling), with ember counts (requests waiting, lots stranded) -> the rail.
- [ ] Visited: Battles / Awards tabs -> a segmented control.
- [ ] Battles (`BattleHistory`): kind filter, rows (verdict, vs, when, Watch replay, Copy link), waiting claims by kind, empty notes, paged.
- [ ] Awards (`AwardsCard`): summary (badges, elite, champion), tabs Badges / Types / Trainers / Achievements, regions with earned and unearned medals, tiers.
- [ ] Teams (`TeamsCard`): saved presets (name, party, default mark, edit, delete), new team, limits and hints, empty and shortfall notes.
- [ ] Friends, Requests, Trades, Bids, Selling panes are drawn in the social node's `ProfileSocial.dc.html` and built there.
- [ ] Edit profile dialog: nickname with hint, sprite picker, title combobox with search and hint, Save and Saving, Close.
- [ ] Status lines: saved, error, friend error.
- [ ] Moves: "Sign out" stays in the menu; the rail and hero replace the stacked card; the Edit dialog widens to `wide` and shows the sprites as a tray.

### Quests (`quests/quests-tab/*`, Board `Quests.dc.html`)

- [ ] Dialog `wide` -> `rail`; hint (rotation, after-midnight, chains, claim) -> a `?` at the top right.
- [ ] Today (three dailies) and This week (one) -> the first two rail rows under "Rotating".
- [ ] Chains accordion (a row per chain: name, ready badge, claimed / total; open when something is ready) -> rail rows under "Chains" with a leaf count for ready and a count for claimed / total; the open chain fills the pane.
- [ ] Asked of anybody, Done -> rail rows under "Other".
- [ ] Quest card: name, Claim (primary, disabled until ready or while busy), Claimed badge; requirement tiles (icon, text, turn-in note, progress bar, have / asked, met check); Pays line with gold badges and item sprites; locked card -> same content, always open in the pane.
- [ ] Re-reads on reopen and after a claim.
- [ ] Proposal: a progress track at the head of the pane (claimed over total), read from counts the board already has.

### News (`news/NewsTab.tsx`, `markdown.tsx`, `releases.ts`, Board `News.dc.html`)

- [ ] Dialog `wide` -> `rail`.
- [ ] Release list: name, Latest badge on the first, the "brought" line -> a rail of releases.
- [ ] Release page (a nested dialog today) -> the pane beside the rail, rendered by `markdown.tsx`; on a phone it stays a sheet.
- [ ] Empty note (`news_empty`).
- [ ] Proposal: the rail is paged at `LIST_PAGE` (the list grows with every update).

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
