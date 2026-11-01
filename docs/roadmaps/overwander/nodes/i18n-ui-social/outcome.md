# Outcome: i18n-ui-social

## Built

- 360 Paraglide messages for the auction board and its dialogs, bids and selling lists, trades and the trade offer dialog, the raids tab and raid lobby, the quests tab, and the profile with its awards, teams, sprite picker and edit dialog, in `src/i18n/messages/{en,ja,es}.json`. Prefixes: `auction_`, `trade_`, `raid_`, `quest_`, `profile_`, `award_`.
- Read by every text-bearing file under `src/components/{auctions,trades,raids,quests,profile}`. Quest goals (`quests-tab/describe.tsx`) are messages.
- Module tables now hold message functions or are built when shown: `BID_STATE_LABELS` (BidsList), `LOT_STATE_LABELS` (SellingList), `ACTION_LABELS` (RaidDialog), `SETTLED_WORDS` (TradesTab), `readGoldModes()` (TradeOfferDialog), `readSectionGroups()` (ProfileTab).
- Quest goals for one kind of landmark or foe are one message per kind (`quest_landmark_*`, `quest_foe_*`, each taking `count`), so the noun agrees with the count. This also fixes English, which read "Beat 1 duelling trainers".
- `trades/NamedCatch.tsx` takes an optional `say` prop, and `fillSentence` places a catch that is still loading inside a message, so the trade line can be reordered per language.
- The raid lobby's player search matches the translated word for "You" (`battle_you`).
- Gold amounts on the auction board, in bids, selling, the bid dialog and trades go through `formatNumber`. The price chip on an auction square is `auction_price_chip` (es `{amount} ₽`).
- The unsold-lot hint names the profile's Market group, as the screen does (English said "Auction").
- `docs/strategy/translations-terms.md`: auction, lot, opening bid, least raise, collect, take back, trade offer, quest, claim, daily, weekly, wanderer, award, achievement, tier, title, profile, nickname, Balm; and the price chip under Money and counts.
- Changeset `.changeset/i18n-ui-social.md`, patch.

## Deviations

- None outside the owned paths.

## Stubs left

- Quest names, award names, titles, raid titles, `LINE_NAMES`, `LINE_DEEDS`, `TIER_NAMES` and `tierName` (data/achievements), `describeWhere` on raid rows, trainer class names, family names, NPC names and region names in quest goals stay on their lookups (batch 9).
- Item descriptions on the auction card stay English (batch 8).
- Search examples (`price:<500`, `is:host`) stay English, since search parses English. The placeholders around them are messages.
- `raid_kind_noble` uses バーム and Bálsamo for Balm as a stopgap, not checked against the item registry; batch 8 should take the names from there.
- `RaidDialog`'s `reason` prop is a string from a caller outside these folders and is shown as passed.

## Gotchas

- `openAuctionBoard` and `boardOf` in `e2e/walk.ts` find the board and the nav by their English names, so they fail under ja or es. The screenshot script used `getByRole('application')` and the localized nav name.
- The menu buttons carry count badges ("1プロフィール"), so an exact name match misses them; match the end of the name.
- The auction board is a landmark, not a menu panel.
- Paraglide's parameter test compares a translation's inputs with the English, so a ja message must keep `{count}` wherever the English plural takes it.
- Bids seeded straight into `auctions.bidder` did not show in the profile's Bids section; it reads another source. Not investigated.

## Proposed learnings

- A noun passed into a counted sentence cannot agree with the count; give each kind its own counted message | quest goals | src/components | yes: the parameter test keeps ja and es on `count`

## Verification

- Extraction (22c99c58a): English unchanged; typecheck, lint (exit 0), `test/components` and `test/game` pass; `test/i18n` failed only for the missing ja and es keys.
- Translation (54241d4dd): `test/i18n` passes (37 tests), typecheck passes.
- Review: one fresh agent read ja and es against the English and the term list. Applied in 6e4337770: ja trade lines (を … と こうかん), counters (1ぴき), the profile path in the unsold hint, a spacing slip, the rejoin buttons, es agreement for counts of one, "A su elección", Aturdido for staggered, the nickname hint, and the quest goal plurals. Kept: es "Campeones" capitalised, as the games write it.
- Screenshots at 1280x720 (Playwright against the e2e dev server and the dev database) in ja and es: the auction board with a lot card, the raids tab, the quests tab, the profile and each of its eight sections, and a trade offer in the Trades section. Two fixes (46742c78e): the es price chip truncated, and gold amounts were not grouped.
- `pnpm typecheck` passes. `rtk proxy pnpm exec oxlint src test` exits 0.
- `pnpm test`: 277 files, 5758 tests. Four timed out under full load (experts, noble-sites, raid-sites, tera-sites); all four pass when rerun alone (76 tests).

## Size

- Estimated L, actual L. 360 strings over 25 files.
