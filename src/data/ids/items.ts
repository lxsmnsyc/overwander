export const enum ItemTypes {
  Medicine = 0,
  PokeBall = 1,
  Berry = 2,
  Held = 3,
  Machine = 4,
  KeyItem = 5,
  Evolution = 6,
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
