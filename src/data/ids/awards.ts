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
  [Awards.BrunoDefeated]: 'Bruno Defeated',
  [Awards.AgathaDefeated]: 'Agatha Defeated',
  [Awards.LanceDefeated]: 'Lance Defeated',
  [Awards.KantoChampion]: 'Kanto Champion',
  [Awards.KantoDexMedal]: 'Kanto Dex Medal',
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
 * The marks of Kanto's 4 Elite Four members: the whole set is what
 * the Champion asks to see
 */
export const KANTO_HONORS: Awards[] = [
  Awards.LoreleiDefeated,
  Awards.BrunoDefeated,
  Awards.AgathaDefeated,
  Awards.LanceDefeated,
];
