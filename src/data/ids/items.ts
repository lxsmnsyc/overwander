import type { Moves } from './moves';

export const enum ItemTypes {
  Medicine = 0,
  PokeBall = 1,
  Berry = 2,
  Held = 3,
  Machine = 4,
  KeyItem = 5,
  Evolution = 6,
  /**
   * Carried only to be sold: a nugget does nothing in a battle or
   * on a pokemon
   */
  Valuable = 7,
}

export const enum ItemFlags {
  /**
   * Consumed when its effect triggers or when used
   */
  Consumable = 0b001,
  /**
   * Can be held by a unit to trigger on its own in battle
   */
  Holdable = 0b010,
  /**
   * Can be actively used on a unit (e.g. potions, medicine)
   */
  Usable = 0b100,
  /**
   * Stocked by the item market. What the overworld grows or hides —
   * berries, nuggets, pearls — is found rather than bought, and
   * carries no market listing however well it sells
   */
  Marketable = 0b1000,
}

/**
 * Poke Ball variants a catch can be made with
 */
export const enum Balls {
  PokeBall = 0,
  GreatBall = 1,
  UltraBall = 2,
  MasterBall = 3,
  PremierBall = 4,
  HealBall = 5,
  LuxuryBall = 6,
  NetBall = 7,
  DiveBall = 8,
  NestBall = 9,
  RepeatBall = 10,
  TimerBall = 11,
  QuickBall = 12,
  DuskBall = 13,
}

export const enum Items {
  // Battle berries
  CheriBerry = 0,
  ChestoBerry = 1,
  PechaBerry = 2,
  RawstBerry = 3,
  AspearBerry = 4,
  LeppaBerry = 5,
  OranBerry = 6,
  PersimBerry = 7,
  LumBerry = 8,
  SitrusBerry = 9,
  // Evolution stones
  FireStone = 10,
  WaterStone = 11,
  ThunderStone = 12,
  LeafStone = 13,
  MoonStone = 14,
  // Poke balls
  PokeBall = 15,
  GreatBall = 16,
  UltraBall = 17,
  MasterBall = 18,
  PremierBall = 19,
  HealBall = 20,
  LuxuryBall = 21,
  NetBall = 22,
  DiveBall = 23,
  NestBall = 24,
  RepeatBall = 25,
  TimerBall = 26,
  QuickBall = 27,
  DuskBall = 28,
  // Key items
  ShinyCharm = 29,
  // Valuables: found in the overworld, worth only what they sell for
  Nugget = 30,
  Pearl = 31,
  BigPearl = 32,
  Stardust = 33,
  StarPiece = 34,
  // Type-enhancing held items: one per attacking type
  SilkScarf = 35,
  BlackBelt = 36,
  SharpBeak = 37,
  PoisonBarb = 38,
  SoftSand = 39,
  HardStone = 40,
  SilverPowder = 41,
  SpellTag = 42,
  MetalCoat = 43,
  Charcoal = 44,
  MysticWater = 45,
  MiracleSeed = 46,
  Magnet = 47,
  TwistedSpoon = 48,
  NeverMeltIce = 49,
  DragonFang = 50,
  BlackGlasses = 51,
  FairyFeather = 52,

  /**
   * Raid items: a relic that calls a mythical out to be fought once.
   * Each names the species it stages
   */
  OldSeaMap = 53,

  /**
   * Stat-enhancing held items: what a pokemon carries to be stronger
   * than it is, rather than to hit one type harder
   */
  ChoiceBand = 54,
  ChoiceSpecs = 55,
  ChoiceScarf = 56,
  AssaultVest = 57,
  Eviolite = 58,
  /**
   * The relics: worth nothing to anything but the one species that
   * knows what to do with them
   */
  LightBall = 59,
  ThickClub = 60,
  MetalPowder = 61,
  QuickPowder = 62,
}

/**
 * Technical machines are not written out one by one: there is one
 * per teachable move, so the item id is the move's id lifted into a
 * reserved range. New moves bring their own machine along, and the
 * enum above stays a list of hand-written items
 */
export const MACHINE_ITEM_BASE = 10_000;

/**
 * The machine that teaches the move
 */
export function getMachineItem(move: Moves): Items {
  // tsc needs the assertion to treat the offset id as an Items;
  // tsgolint resolves the const enum to number and disagrees
  // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
  return (MACHINE_ITEM_BASE + move) as Items;
}

/**
 * The move a machine teaches, or null when the item is not one
 */
export function getMachineMove(item: Items): Moves | null {
  // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
  return isMachineItem(item) ? ((item - MACHINE_ITEM_BASE) as Moves) : null;
}

export function isMachineItem(item: Items): boolean {
  // The comparison is against the reserved range, not against
  // another member of the enum
  // oxlint-disable-next-line typescript/no-unsafe-enum-comparison
  return item >= MACHINE_ITEM_BASE;
}

/**
 * The inventory item behind each ball variant
 */
export const BALL_ITEMS: Record<Balls, Items> = {
  [Balls.PokeBall]: Items.PokeBall,
  [Balls.GreatBall]: Items.GreatBall,
  [Balls.UltraBall]: Items.UltraBall,
  [Balls.MasterBall]: Items.MasterBall,
  [Balls.PremierBall]: Items.PremierBall,
  [Balls.HealBall]: Items.HealBall,
  [Balls.LuxuryBall]: Items.LuxuryBall,
  [Balls.NetBall]: Items.NetBall,
  [Balls.DiveBall]: Items.DiveBall,
  [Balls.NestBall]: Items.NestBall,
  [Balls.RepeatBall]: Items.RepeatBall,
  [Balls.TimerBall]: Items.TimerBall,
  [Balls.QuickBall]: Items.QuickBall,
  [Balls.DuskBall]: Items.DuskBall,
};
