/**
 * Everything a player can be awarded and keep for good: gym badges,
 * the marks of beaten Elite Four members, and regional champion
 * titles. An award is earned once and never spent, which is what
 * tells it apart from an item
 */
const enum Awards {
  BoulderBadge = 0,
  CascadeBadge = 1,
  ThunderBadge = 2,
  RainbowBadge = 3,
  SoulBadge = 4,
  MarshBadge = 5,
  VolcanoBadge = 6,
  EarthBadge = 7,
  LoreleiDefeated = 8,
  BrunoDefeated = 9,
  AgathaDefeated = 10,
  LanceDefeated = 11,
  KantoChampion = 12,
  /** Kanto's dex filled to 150 caught */
  KantoDexMedal = 13,
  ZephyrBadge = 14,
  HiveBadge = 15,
  PlainBadge = 16,
  FogBadge = 17,
  StormBadge = 18,
  MineralBadge = 19,
  GlacierBadge = 20,
  RisingBadge = 21,
  WillDefeated = 22,
  KogaDefeated = 23,
  KarenDefeated = 24,
  /** Bruno's other seat, in Johto's league */
  JohtoBrunoDefeated = 25,
  JohtoChampion = 26,
}

export default Awards;

export const AWARD_NAMES: Record<Awards, string> = {
  [Awards.BoulderBadge]: 'Boulder Badge',
  [Awards.CascadeBadge]: 'Cascade Badge',
  [Awards.ThunderBadge]: 'Thunder Badge',
  [Awards.RainbowBadge]: 'Rainbow Badge',
  [Awards.SoulBadge]: 'Soul Badge',
  [Awards.MarshBadge]: 'Marsh Badge',
  [Awards.VolcanoBadge]: 'Volcano Badge',
  [Awards.EarthBadge]: 'Earth Badge',
  [Awards.LoreleiDefeated]: 'Lorelei Defeated',
  [Awards.BrunoDefeated]: 'Bruno Defeated (Kanto)',
  [Awards.AgathaDefeated]: 'Agatha Defeated',
  [Awards.LanceDefeated]: 'Lance Defeated',
  [Awards.KantoChampion]: 'Kanto Champion',
  [Awards.KantoDexMedal]: 'Kanto Dex Medal',
  [Awards.ZephyrBadge]: 'Zephyr Badge',
  [Awards.HiveBadge]: 'Hive Badge',
  [Awards.PlainBadge]: 'Plain Badge',
  [Awards.FogBadge]: 'Fog Badge',
  [Awards.StormBadge]: 'Storm Badge',
  [Awards.MineralBadge]: 'Mineral Badge',
  [Awards.GlacierBadge]: 'Glacier Badge',
  [Awards.RisingBadge]: 'Rising Badge',
  [Awards.WillDefeated]: 'Will Defeated',
  [Awards.KogaDefeated]: 'Koga Defeated',
  [Awards.KarenDefeated]: 'Karen Defeated',
  [Awards.JohtoBrunoDefeated]: 'Bruno Defeated (Johto)',
  [Awards.JohtoChampion]: 'Johto Champion',
};

/**
 * Kanto's 8 gym badges, in gym order: the whole set is what the
 * Elite Four ask to see
 */
export const KANTO_BADGES: Awards[] = [
  Awards.BoulderBadge,
  Awards.CascadeBadge,
  Awards.ThunderBadge,
  Awards.RainbowBadge,
  Awards.SoulBadge,
  Awards.MarshBadge,
  Awards.VolcanoBadge,
  Awards.EarthBadge,
];

/**
 * Johto's 8 gym badges, in gym order. They are numbered after Kanto's
 * rather than beside them: an award id is what a player's shelf is
 * stored as, so the enum can only ever be appended to
 */
export const JOHTO_BADGES: Awards[] = [
  Awards.ZephyrBadge,
  Awards.HiveBadge,
  Awards.PlainBadge,
  Awards.FogBadge,
  Awards.StormBadge,
  Awards.MineralBadge,
  Awards.GlacierBadge,
  Awards.RisingBadge,
];

/**
 * The marks of Kanto's 4 Elite Four members: the whole set is what
 * the Champion asks to see
 */
export const KANTO_HONORS: Awards[] = [
  Awards.LoreleiDefeated,
  Awards.BrunoDefeated,
  Awards.AgathaDefeated,
  Awards.LanceDefeated,
];

/**
 * And Johto's 4. Bruno sits in both leagues, but each seat is its own
 * fight with its own mark: a challenger who has only walked one
 * region's gyms beats the Bruno who takes them and earns that mark
 * alone
 */
export const JOHTO_HONORS: Awards[] = [
  Awards.WillDefeated,
  Awards.KogaDefeated,
  Awards.JohtoBrunoDefeated,
  Awards.KarenDefeated,
];
