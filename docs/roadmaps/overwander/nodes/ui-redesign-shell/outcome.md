# Outcome: ui-redesign-shell

## Built

Built to the approved boards `Login`, `CommandBar`, `Settings`, `Profile`, `Quests` and `News`, element by element. Behaviour is meant to be unchanged (sign in and the second factor, the bindings and where they are kept, claims, edits, sign out, the remembered pane). The one change a player can notice that is not look: the News rail is a tab list (keys move between releases), and on a phone a release opens as a sheet. Every item in `log.md` is ticked and the log says where it went. Nothing was captured or opened in a browser (the story does that).

- **Title screen** (`app/LoginForm.tsx`): exported `TitleCard` (420px card, header washed tide into white with the 44px name and tagline, the theme toggle as a 40px square at the top right). Mode is a full-width `Segmented`. Fields are 44px with the label face. Sign in is 46px, the passkey and provider buttons are a two-column grid of 44px buttons under the "or" divider; the passkey button reads "Sign in with a passkey" as the board has it. The code step keeps its note, field, trust box, Continue, swap and Back. `routes/index.tsx` (signed out, and the banned screen as a card with an ember wash) and `routes/battle/[id].tsx` both stand the form in `TitleCard`.
- **Announcements and command bar**: gold-soft cards with a 28px close and the spring rise. The command bar is a 24px sheet, 12px padding, a 46px input with the tide edge and halo, 38px suggestion rows (hint right-aligned), the answer or refusal as a soft card above the input, and the approved key hint under the list (`command_keys`). Top 12%, or 8% and full width on a phone.
- **Settings** (`settings/settings-tab/`, `settings/setting-card.tsx`): `rail` width, a rail with a colour square per pane (About after a divider, Development in a dev build), the pane's name with its line, one card per group. Switch, slider and key rows are `row` looks of the shared primitives. Language, clock, board edge and box width are `RadioGroup cards` (three across, or two). Security's passkeys and authenticator app are state rows with an On / off pill. About and Credits keep their content in the same cards. The dock carries `settings_dock_note`. The gear is on the nameplate.
- **Profile** (`profile/profile-sheet/`): `sheet` width, `layout="sheet"`, the hero under the nameplate (72px square face, name, worn title and gold pills, place on the left; the buddy card on the right; the actions menu at the edge). Own: a rail (Record, Social, Market with colour squares and ember counts) beside a plain pane. Visited: a `Segmented` Battles / Awards, no rail. Battles are row cards, Awards are tiles over a `Segmented` and a card of medals per region, Teams a header and white rows. Friends, Requests, Trades, Bids and Selling mount the existing lists in the pane. The edit dialog is `wide` with labels in the label face, 44px boxes and the trainer sprites as an eight-across tray.
- **Quests** (`quests/quests-tab/`): `rail` width, a rail of Today and This week (Rotating), every chain (a green ready count then claimed / total), then Asked of anybody and Done. The open place fills the pane with its name, a line and the progress track (proposal), then its cards (ready ring, requirement tiles, Pays pills, dashed locked card). The hint is the `?` at the sheet's top right.
- **News** (`news/`): `rail` width and `sheet` layout. The release rail pages at `LIST_PAGE` (proposal), the chosen release's page is the pane, with the index line right under its title. Below `md` the rail is the screen and a release opens as a sheet.
- **Phone**: rails are chip rows (`RailTabs`), the profile hero stacks (face and name with the menu, then the buddy card), the title card has 16px gutters, option cards stack, the command bar is full width at 8%.
- **Shared, additive**: `Segmented` `fill`; `TextField` and `Combobox` `labelFace` and `tall`; `FieldFrame` `labelFace`; `Switch`, `Slider` and `KeyBind` `row` (`SETTING_ROW` in `card.ts`); `RadioGroup` `columns` and `named`; `RailCount` `hot`; `PlayerFace` `square`.
- **Splits first**: `SettingsTab.tsx` became `settings-tab/` (index, panes, choices), `ProfileTab.tsx` became `profile-sheet/` (state, hero, body, title badge, sheet), `AwardsCard.tsx` became `awards-card/` (index, regions, slot, badges, achievements, people).
- **New strings** (en, ja, es): `login_mode`, `command_keys`, `key_change`, `security_two_step`, `security_two_step_description`, `security_off`, `settings_sections`, `settings_line_*` (8), `settings_dock_note`, `profile_sections`, `profile_dock_own`, `profile_dock_visited`, `catch_buddy_label`, `catch_buddy_label_them`, `catch_buddy_friendship`, `history_fought`, `award_tile_elite`, `award_tile_champion`, `award_group_elsewhere`, `profile_teams_lede`, `quest_sections`, `quest_group_*` (3), `quest_claimed_of`, `quest_line_*` (4), `quest_none_here`, `quest_locked_note`, `news_releases`, `news_dock_note`. Reworded: `catch_buddy_replace` (now "Change"), `profile_character` (now "Your trainer").

## Deviations

- Outside the owned paths, kept small:
  - `src/components/styled/*`: the additive props above. `src/routes/index.tsx`: widths, nameplate icons, dock notes, the quest `?` hint, `ProfileSheet` in place of the own profile `Dialog` and `ProfileTab`, and the `settings-tab` import. `src/routes/battle/[id].tsx`: `TitleCard`.
  - `src/components/battle/battle-view/results/Rewards.tsx`: its `AwardArt` import path (`profile/awards-card`, which re-exports it).
  - `src/i18n/messages/{en,ja,es}.json`.
- The profile's Dialog is built by `ProfileSheet`, which mounts when the dialog opens and goes when its fade ends, so what it follows (profile, requests, lots) is followed only while it is open, as before. `ProfileTab.tsx` stays for `admin/AdminPlayer.tsx` (staff panel), which draws the profile with no dialog.
- Buddy card: the friendship and steps bars are gone. The board draws them as one meta line ("Friendship 180 · 1,280 steps walked"), so they are numbers; an egg shows its steps of hatch steps. The friendship words are the tooltip. The gender mark, shiny pill and sigil stay on the card.
- Battles rows keep the frozen team strip (the board does not draw it; it was in the old row). The board's Teams "Default" pill is not drawn: the code has no default team.
- The Awards board draws eight round medals per region. The shelf also holds Elite marks, the Champion title and the dex medal per region and the marks that belong to no region, so a region's card holds all of them in rows of eight, and a "Beyond the regions" card holds the rest. The medal is the game's own art in a round frame, not a flat colour.
- The board's pane line for each quest chain is flavour text the data does not have; a chain's line is "n of m claimed". Chain colour squares cycle through the board's palette in chain order.
- Quests and the Rotating rows show their counts the board's way. The board's Today count is the number of dailies (3); the ready count is green.
- Quests' dock note reuses `quest_hint_claim`, not the board's sentence, since "pay arrives as gifts" is not what the game does. The profile's dock notes are written for what each profile is, since "Close keeps your place" is not true.
- Settings: the board's Language option note for English is empty (the game had no line for it); the Japanese and Spanish cards keep theirs.
- The shared `Switch` track is now the board's 44x26 with a 20px knob (it was 44x24 with a 16px knob), so every caller's switch is slightly taller.

## Review fixes

- The backup codes were drawn twice with two-step on (`SecurityPane.tsx`); one copy is gone.
- The language cards carry the board's three notes ("Language of the game", "ゲームの言語", "Idioma del juego"); the old untranslated-screens sentences are dropped.
- The quests' Asked of anybody and Done panes draw the progress track too.
- The News rail is `RailTabs` and `RailTab` (tablist, focus and keys), still paged.
- The quest and news nameplate icons are `BookmarkIcon` and `PageIcon` in `components/icons.tsx`.

## Stubs left

- None. The Friends, Requests, Trades, Bids and Selling panes still draw their old contents in a plain pane: `ui-redesign-social` restyles them.

## Handoffs

For `ui-redesign-social`:

- **The profile shell**: `src/components/profile/profile-sheet/`. `body.tsx` has `OwnBody`: a `TabGroup` over `RailTabs` and one `TabPane` per `ProfileSection`. Mount the social panes in the existing `TabPane`s for Friends, Requests, Trades, Bids and Selling. The pane container is a plain `div` (`PANE` in `body.tsx`: a column that scrolls from `md`), so a pane fills it with no card of its own. The panes are given: `FriendsTab` and the "Add a friend" button (Friends), `RequestsTab waiting={state.asking()}`, `TradesTab player`, `BidsList player`, `SellingList player lots onChanged`.
- **Section list and counts**: `readSectionGroups()` in `body.tsx` (Record: Battles, Awards, Teams; Social: Friends, Requests, Trades; Market: Bids, Selling), each with a colour square. `state.countFor(section)` gives the ember count (Requests waiting, Selling stranded). If a pane needs another count, add it there and in `RailCount hot`.
- **State**: `createProfileState` (`state.ts`) holds the profile, friend tie, requests and lots once, for the hero and the body. `state.asking()` and `state.lots()` are what the social panes read; `state.refetchLots()` reloads the lots.
- **Statuses** (saved, error, friend error) are drawn at the top of the pane by `Statuses` in `body.tsx`.
- **Shared pieces added here**: `SETTING_ROW`, `Segmented fill`, `RailCount hot`, `RadioGroup columns named`, `PlayerFace square`, `TextField`/`Combobox` `labelFace tall`. Row cards for lists in this node: `rounded-card border-2 border-line-soft bg-paper px-3 py-2` (battles, teams), which social's rows can match.
- The profile dialog also covers a visited profile (`ProfileDialog.tsx` is `ProfileSheet viewOnly`), where the pane shows Battles and Awards only.

## Gotchas

- `ProfileSheet` renders its `Dialog` inside a `Show` keyed on the last player, and clears it from `afterLeave`. A new `section` is read once as the sheet is built.
- `Segmented` `onChange` must not return a value; `createProfileState` wraps its setters for that reason.
- `RowCounts` in the quests rail wraps the green ready count and the `RailCount` in one `ml-auto` span, since two `ml-auto` children split the free space.
- The quests, settings and profile rails are `TabGroup`s over `RailTab`s with numbers: a quest chain's place is `Place.Chain + chain id`.
- News matches `(min-width: 48rem)` in an `onMount`, so the first paint on a phone shows the rail alone and a wide screen gains its pane after hydration.
- The release's index line is drawn by the markdown `Heading` builtin right under the first heading, through the `ReleaseLine` context.

## Proposed learnings

- A dialog whose hero needs state the body shares is built by a component that makes the state once and passes `hero` to the `Dialog` | the `hero` prop is outside the dialog's children | src/components/profile | no
- A setting that is a row of a card is a `row` look of its primitive (`Switch`, `Slider`, `KeyBind`) | one row shape for every pane | src/components/settings | no

## Verification

- `pnpm typecheck`: exit 0.
- `rtk proxy pnpm exec oxlint src test`: exit 0.
- `pnpm exec oxfmt src/components src/routes`: run.
- `pnpm exec vitest run test/components test/i18n`: 16 files, 101 tests passed (includes the gold text and news tests).
- No full suite, no e2e, no captures: they belong to the story.

## Size

- Estimated L, actual L.
