/**
 * The titles numbered one by one, below 100. A stored title is a
 * number on a profile, so append only
 */
const enum LadderTitle {
  /** All 8 of the region's badges */
  LeagueChallenger = 0,
  /** All 4 of the Elite Four beaten */
  EliteConqueror = 1,
  /** The Champion's own seat */
  KantoChampion = 2,
  JohtoChampion = 3,
  /** Any legend's mark: the fight the league does not ask for */
  LegendBreaker = 4,
  HoennChampion = 5,
  SinnohChampion = 6,
}

export default LadderTitle;
