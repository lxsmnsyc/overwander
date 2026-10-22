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
  /** The one above the league, met where a champion would have been */
  RedDefeated = 27,
  /** Team Rocket's boss, beaten where his grunts stand */
  GiovanniDefeated = 28,
  ArcherDefeated = 29,
  ArianaDefeated = 30,
  ProtonDefeated = 31,
  PetrelDefeated = 32,
  /** Any one of the rank and file put down */
  RocketGruntDefeated = 33,
  /** Johto's dex filled to 99 caught */
  JohtoDexMedal = 34,
  StoneBadge = 35,
  KnuckleBadge = 36,
  DynamoBadge = 37,
  HeatBadge = 38,
  BalanceBadge = 39,
  FeatherBadge = 40,
  MindBadge = 41,
  RainBadge = 42,
  /** Hoenn's dex filled to 133 caught */
  HoennDexMedal = 43,
  SidneyDefeated = 44,
  PhoebeDefeated = 45,
  GlaciaDefeated = 46,
  DrakeDefeated = 47,
  HoennChampion = 48,
  /** The one above Hoenn's league, met where a champion would be */
  StevenDefeated = 49,
  /**
   * The Frontier's symbols, silver for the win and gold for taking
   * one without losing a pokemon
   */
  SilverBraveSymbol = 50,
  GoldBraveSymbol = 51,
  SilverGutsSymbol = 52,
  GoldGutsSymbol = 53,
  SilverLuckSymbol = 54,
  GoldLuckSymbol = 55,
  SilverKnowledgeSymbol = 56,
  GoldKnowledgeSymbol = 57,
  SilverAbilitySymbol = 58,
  GoldAbilitySymbol = 59,
  SilverSpiritsSymbol = 60,
  GoldSpiritsSymbol = 61,
  SilverTacticsSymbol = 62,
  GoldTacticsSymbol = 63,
  MagmaGruntDefeated = 64,
  TabithaDefeated = 65,
  CourtneyDefeated = 66,
  MaxieDefeated = 67,
  AquaGruntDefeated = 68,
  MattDefeated = 69,
  ShellyDefeated = 70,
  ArchieDefeated = 71,
  CoalBadge = 72,
  ForestBadge = 73,
  CobbleBadge = 74,
  FenBadge = 75,
  RelicBadge = 76,
  MineBadge = 77,
  IcicleBadge = 78,
  BeaconBadge = 79,
  AaronDefeated = 80,
  BerthaDefeated = 81,
  FlintDefeated = 82,
  LucianDefeated = 83,
  SinnohChampion = 84,
  /** Sinnoh's dex filled to 103 caught */
  SinnohDexMedal = 85,
  GalacticGruntDefeated = 86,
  MarsDefeated = 87,
  JupiterDefeated = 88,
  SaturnDefeated = 89,
  CyrusDefeated = 90,
  /**
   * Sinnoh's Frontier hangs prints rather than symbols, silver for
   * the win and gold for taking the house again
   */
  SilverTowerPrint = 91,
  GoldTowerPrint = 92,
  SilverFactoryPrint = 93,
  GoldFactoryPrint = 94,
  SilverArcadePrint = 95,
  GoldArcadePrint = 96,
  SilverCastlePrint = 97,
  GoldCastlePrint = 98,
  SilverHallPrint = 99,
  GoldHallPrint = 100,
  TrioBadge = 101,
  BasicBadge = 102,
  InsectBadge = 103,
  BoltBadge = 104,
  QuakeBadge = 105,
  JetBadge = 106,
  FreezeBadge = 107,
  LegendBadge = 108,
  ToxicBadge = 109,
  WaveBadge = 110,
  ShauntalDefeated = 111,
  MarshalDefeated = 112,
  GrimsleyDefeated = 113,
  CaitlinDefeated = 114,
  /** Unova's dex filled to 152 caught */
  UnovaDexMedal = 115,
  UnovaChampion = 116,
  /** The one above Unova's league, met where a champion would be */
  NDefeated = 117,
  /** Any one of Team Plasma's rank and file put down */
  PlasmaGruntDefeated = 118,
  ColressDefeated = 119,
  ZinzolinDefeated = 120,
  GhetsisDefeated = 121,
  /** Unova's champion before Iris, met where a champion would be */
  AlderDefeated = 122,
  BugBadge = 123,
  CliffBadge = 124,
  RumbleBadge = 125,
  PlantBadge = 126,
  VoltageBadge = 127,
  FairyBadge = 128,
  PsychicBadge = 129,
  IcebergBadge = 130,
  MalvaDefeated = 131,
  SieboldDefeated = 132,
  WikstromDefeated = 133,
  DrasnaDefeated = 134,
  KalosChampion = 135,
  /** The king who ended a war with a weapon, met where a champion would be */
  AZDefeated = 136,
  /** Any one of Team Flare's rank and file put down */
  FlareGruntDefeated = 137,
  XerosicDefeated = 138,
  AlianaDefeated = 139,
  BryonyDefeated = 140,
  CelosiaDefeated = 141,
  MableDefeated = 142,
  LysandreDefeated = 143,
}

export default Awards;

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

/**
 * And Hoenn's 8, in gym order. The Mind Badge is one badge for one
 * gym, which two people keep between them
 */
export const HOENN_BADGES: Awards[] = [
  Awards.StoneBadge,
  Awards.KnuckleBadge,
  Awards.DynamoBadge,
  Awards.HeatBadge,
  Awards.BalanceBadge,
  Awards.FeatherBadge,
  Awards.MindBadge,
  Awards.RainBadge,
];

/**
 * And Sinnoh's 8, in gym order, which its Elite Four ask to see
 */
export const SINNOH_BADGES: Awards[] = [
  Awards.CoalBadge,
  Awards.ForestBadge,
  Awards.CobbleBadge,
  Awards.FenBadge,
  Awards.RelicBadge,
  Awards.MineBadge,
  Awards.IcicleBadge,
  Awards.BeaconBadge,
];

/** And Kalos's 8, in gym order */
export const KALOS_BADGES: Awards[] = [
  Awards.BugBadge,
  Awards.CliffBadge,
  Awards.RumbleBadge,
  Awards.PlantBadge,
  Awards.VoltageBadge,
  Awards.FairyBadge,
  Awards.PsychicBadge,
  Awards.IcebergBadge,
];

/**
 * And Unova's 10, in gym order, the sequels' two gyms last. The
 * region runs more gyms than any other because two of its towns
 * changed hands between one league and the next, and Striaton is
 * kept by three people who each fight a different type
 */
export const UNOVA_BADGES: Awards[] = [
  Awards.TrioBadge,
  Awards.BasicBadge,
  Awards.InsectBadge,
  Awards.BoltBadge,
  Awards.QuakeBadge,
  Awards.JetBadge,
  Awards.FreezeBadge,
  Awards.LegendBadge,
  Awards.ToxicBadge,
  Awards.WaveBadge,
];

/**
 * And Hoenn's 4, which its champion asks to see
 */
export const HOENN_HONORS: Awards[] = [
  Awards.SidneyDefeated,
  Awards.PhoebeDefeated,
  Awards.GlaciaDefeated,
  Awards.DrakeDefeated,
];

/**
 * And Sinnoh's 4, which Cynthia asks to see
 */
export const SINNOH_HONORS: Awards[] = [
  Awards.AaronDefeated,
  Awards.BerthaDefeated,
  Awards.FlintDefeated,
  Awards.LucianDefeated,
];

/** And Kalos's 4 */
export const KALOS_HONORS: Awards[] = [
  Awards.MalvaDefeated,
  Awards.SieboldDefeated,
  Awards.WikstromDefeated,
  Awards.DrasnaDefeated,
];

/**
 * And Unova's 4, who keep their seats in both of its leagues
 */
export const UNOVA_HONORS: Awards[] = [
  Awards.ShauntalDefeated,
  Awards.MarshalDefeated,
  Awards.GrimsleyDefeated,
  Awards.CaitlinDefeated,
];

/** Each league's Elite Four, by the name the league is written in */
export const LEAGUE_HONORS: Record<string, Awards[]> = {
  Kanto: KANTO_HONORS,
  Johto: JOHTO_HONORS,
  Hoenn: HOENN_HONORS,
  Sinnoh: SINNOH_HONORS,
  Unova: UNOVA_HONORS,
  Kalos: KALOS_HONORS,
};

/**
 * What the Frontier hangs, silver then gold, in facility order:
 * Hoenn's seven symbols, then Sinnoh's five prints
 */
export const FRONTIER_SYMBOLS: Awards[] = [
  Awards.SilverBraveSymbol,
  Awards.GoldBraveSymbol,
  Awards.SilverGutsSymbol,
  Awards.GoldGutsSymbol,
  Awards.SilverLuckSymbol,
  Awards.GoldLuckSymbol,
  Awards.SilverKnowledgeSymbol,
  Awards.GoldKnowledgeSymbol,
  Awards.SilverAbilitySymbol,
  Awards.GoldAbilitySymbol,
  Awards.SilverSpiritsSymbol,
  Awards.GoldSpiritsSymbol,
  Awards.SilverTacticsSymbol,
  Awards.GoldTacticsSymbol,
  Awards.SilverTowerPrint,
  Awards.GoldTowerPrint,
  Awards.SilverFactoryPrint,
  Awards.GoldFactoryPrint,
  Awards.SilverArcadePrint,
  Awards.GoldArcadePrint,
  Awards.SilverCastlePrint,
  Awards.GoldCastlePrint,
  Awards.SilverHallPrint,
  Awards.GoldHallPrint,
];
