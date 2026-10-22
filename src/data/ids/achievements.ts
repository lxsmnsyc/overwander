/** The four metals an achievement line climbs, and none */
const enum AchievementTier {
  None = 0,
  Bronze = 1,
  Silver = 2,
  Gold = 3,
  Platinum = 4,
}

/**
 * The achievement lines. A worn title is recorded against the number,
 * so a line is appended and never renumbered. What each counts is
 * `src/data/achievements.yaml`
 */
const enum AchievementLine {
  Collector = 0,
  Hatcher = 1,
  Coach = 2,
  Wayfarer = 3,
  Socialite = 4,
  Forager = 5,
  Raider = 6,
  Trader = 7,
  Auctioneer = 8,
  Confidant = 9,
  Wayfinder = 10,
  Matchmaker = 11,
  Purifier = 12,
  Pathfinder = 13,
}

export { AchievementLine, AchievementTier };
