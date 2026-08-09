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
}
