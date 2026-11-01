# Log: i18n-ui-social

- Started on branch `i18n-ui-social` (status commit on top of origin/main after #261 merged). No earlier work for this node.
- Extraction (22c99c58a): 360 English messages across 25 files under `src/components/{auctions,trades,raids,quests,profile}`, prefixed `auction_`, `trade_`, `raid_`, `quest_`, `profile_` and `award_`. Done by one agent; en.json was left unformatted, folded into the same commit with oxfmt.
- Translation (54241d4dd): ja and es for every key, by one agent. Term list extended for auctions, trades, quests, awards and the profile.
- Review: one fresh agent. Fixed in 6e4337770. It found that quest goals with a count of one read "Beat 1 duelling trainers" in English too, so the landmark and foe goals became a sentence per kind.
- Screenshots: two fixes in 46742c78e. The es price chip on auction squares truncated ("650 de din…"), now `{amount} ₽`. Gold amounts on the board and in trades were raw numbers (25000), now through `formatNumber`.
- Full suite: four world and data tests timed out under load; all four pass alone.
