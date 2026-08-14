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
  /**
   * Spent on a pokemon to change what it is rather than what it can
   * do: a bottle cap polishes individual values, which nothing else
   * in the game can touch once a catch is made
   */
  Training = 8,
  /**
   * Dug out of the ground with a pokemon still in it. A fossil does
   * nothing on its own — it is carried until somebody with the
   * machinery to revive it is found, and spent there
   */
  Fossil = 9,
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

  /**
   * The incenses: held smokes, each one a small edge somewhere
   */
  FullIncense = 63,
  LaxIncense = 64,
  LuckIncense = 65,
  OddIncense = 66,
  PureIncense = 67,
  RockIncense = 68,
  RoseIncense = 69,
  SeaIncense = 70,
  WaveIncense = 71,

  /**
   * The gems: one per attacking type, each spent the moment its
   * holder lands a move of that type
   */
  NormalGem = 72,
  FightingGem = 73,
  FlyingGem = 74,
  PoisonGem = 75,
  GroundGem = 76,
  RockGem = 77,
  BugGem = 78,
  GhostGem = 79,
  SteelGem = 80,
  FireGem = 81,
  WaterGem = 82,
  GrassGem = 83,
  ElectricGem = 84,
  PsychicGem = 85,
  IceGem = 86,
  DragonGem = 87,
  DarkGem = 88,
  FairyGem = 89,

  /**
   * The orbs: held for what they do to their own holder
   */
  FlameOrb = 90,
  ToxicOrb = 91,
  LifeOrb = 92,

  /**
   * The plates: old stone tablets, one for every type but Normal
   */
  FistPlate = 93,
  SkyPlate = 94,
  ToxicPlate = 95,
  EarthPlate = 96,
  StonePlate = 97,
  InsectPlate = 98,
  SpookyPlate = 99,
  IronPlate = 100,
  FlamePlate = 101,
  SplashPlate = 102,
  MeadowPlate = 103,
  ZapPlate = 104,
  MindPlate = 105,
  IciclePlate = 106,
  DracoPlate = 107,
  DreadPlate = 108,
  PixiePlate = 109,

  // Candy items: carried by the buddy, paid out on a catch
  ExpShare = 110,
  LuckyEgg = 111,

  /**
   * The bottle caps: dug up, then spent on one pokemon to polish the
   * values it was born with
   */
  GoldenBottleCap = 112,
  BottleCap = 113,

  /**
   * Medicine: what a party is put right with between fights. The
   * potions give health back, the cures take a status off, and the
   * revives are the only things that bring a fainted pokemon round
   */
  Potion = 114,
  SuperPotion = 115,
  HyperPotion = 116,
  MaxPotion = 117,
  FullRestore = 118,
  Antidote = 119,
  BurnHeal = 120,
  IceHeal = 121,
  Awakening = 122,
  ParalyzeHeal = 123,
  FullHeal = 124,
  Revive = 125,
  MaxRevive = 126,

  /**
   * Spent on a shadow pokemon to put it right: the shadow comes off,
   * and what it cost to raise comes back down with it
   */
  PurifyingGem = 127,

  /**
   * Opens a portal, and is spent doing it: the network is walked one
   * key at a time
   */
  PortalKey = 128,

  /**
   * The type-resist berries: one per type, eaten to take half off a
   * blow of that type that would otherwise land hard. Chilan is the
   * odd one — Normal is the type nothing resists, so it answers every
   * Normal move rather than only the effective ones
   */
  OccaBerry = 129,
  PasshoBerry = 130,
  WacanBerry = 131,
  RindoBerry = 132,
  YacheBerry = 133,
  ChopleBerry = 134,
  KebiaBerry = 135,
  ShucaBerry = 136,
  CobaBerry = 137,
  PayapaBerry = 138,
  TangaBerry = 139,
  ChartiBerry = 140,
  KasibBerry = 141,
  HabanBerry = 142,
  ColburBerry = 143,
  BabiriBerry = 144,
  ChilanBerry = 145,
  RoseliBerry = 146,

  /**
   * The pinch berries: held against the moment the holder is nearly
   * out, and spent lifting one stat when it comes
   */
  LiechiBerry = 147,
  GanlonBerry = 148,
  SalacBerry = 149,
  PetayaBerry = 150,
  ApicotBerry = 151,
  LansatBerry = 152,
  StarfBerry = 153,
  CustapBerry = 154,
  MicleBerry = 155,

  /**
   * The bitter berries: a third of the holder's health back, and a
   * turn of confusion for the ones whose nature cannot stand the
   * taste
   */
  FigyBerry = 156,
  WikiBerry = 157,
  MagoBerry = 158,
  AguavBerry = 159,
  IapapaBerry = 160,

  /**
   * The berries that answer a blow rather than wait for one: what a
   * holder gives back to whoever hit them, and what a hard hit gives
   * back to the holder
   */
  EnigmaBerry = 161,
  KeeBerry = 162,
  MarangaBerry = 163,
  JabocaBerry = 164,
  RowapBerry = 165,

  /**
   * The wings: a feather's worth of training in one stat, and the only
   * effort a pokemon ever gets that its levels did not pay for
   */
  HealthWing = 166,
  MuscleWing = 167,
  ResistWing = 168,
  GeniusWing = 169,
  CleverWing = 170,
  SwiftWing = 171,

  /**
   * The bitter berries a pokemon is fed to take training back off one
   * stat. They taste terrible and are good for it, which is why a
   * pokemon thinks better of whoever feeds it one
   */
  PomegBerry = 172,
  KelpsyBerry = 173,
  QualotBerry = 174,
  HondewBerry = 175,
  GrepaBerry = 176,
  TamatoBerry = 177,

  /**
   * Herbal medicine: the cheap way to put a pokemon right. Each does
   * more than the potion it stands next to and costs a fraction of
   * the gold, and every one of them is bitter enough that the pokemon
   * thinks less of whoever made it swallow one
   */
  EnergyPowder = 178,
  EnergyRoot = 179,
  HealPowder = 180,
  RevivalHerb = 181,

  /**
   * What the Move Reminder is paid in. It buys nothing else and no
   * vendor will take one off a player's hands, so a scale in the bag
   * is a move a pokemon can have back and nothing besides
   */
  HeartScale = 182,

  /**
   * The rest of the evolution stones. Every one of them is spent the
   * way the five above are; what none of them has yet is a species
   * that answers, since each is asked for by a line no generation
   * registered here reaches. They are written now so that the day one
   * is, the item is already what it will always be
   */
  SunStone = 183,
  ShinyStone = 184,
  DuskStone = 185,
  DawnStone = 186,
  IceStone = 187,

  /**
   * The trade items: what the mainline hands a pokemon before passing
   * it to somebody else. Here a trade opens an evolution rather than
   * performing one — see the `traded` field on a catch — so these are
   * used on a pokemon like a stone, and the trade is the other half of
   * what the evolution asks for.
   *
   * Metal Coat is not among them because it is already registered, as
   * the Steel type booster it also is: one item, one id, and the
   * evolution reads the same entry the battle does
   */
  KingsRock = 188,
  DragonScale = 189,
  UpGrade = 190,
  DubiousDisc = 191,
  Protector = 192,
  Electirizer = 193,
  Magmarizer = 194,
  ReaperCloth = 195,
  RazorClaw = 196,
  RazorFang = 197,
  PrismScale = 198,
  DeepSeaTooth = 199,
  DeepSeaScale = 200,
  Sachet = 201,
  WhippedDream = 202,

  /**
   * The vitamins: ten points of effort in one stat, bought rather than
   * found. They are the wings' opposite number — a wing is three
   * points blown along the ground, a vitamin is ten off a shelf — and
   * between them they are the only training a pokemon's own levels did
   * not pay for
   */
  HPUp = 203,
  Protein = 204,
  Iron = 205,
  Calcium = 206,
  Zinc = 207,
  Carbos = 208,

  /**
   * What is spent on a move rather than on a stat. In a game whose
   * fights run on cooldowns, a move's PP is how often it comes back —
   * so these shorten the wait rather than adding uses
   */
  PPUp = 209,
  PPMax = 210,

  /**
   * The fossils: an extinct pokemon, still in the rock. Each one
   * names exactly one species and is spent bringing it back — see
   * [`FOSSIL_SPECIES`](../items/fossils.ts) — which is the only way
   * any of the three is ever met, since nothing that came out of a
   * fossil spawns in the world any more
   */
  HelixFossil = 211,
  DomeFossil = 212,
  OldAmber = 213,

  /**
   * The rest of what the ground gives up for gold and nothing else.
   * They do nothing to a pokemon, nothing in a fight and nothing at a
   * landmark: a walk turns one up, a vendor takes it, and that is the
   * whole of what they are for
   */
  TinyMushroom = 214,
  BigMushroom = 215,
  BalmMushroom = 216,
  BigNugget = 217,
  PearlString = 218,
  CometShard = 219,
  RareBone = 220,
  PrettyWing = 221,
  ShoalSalt = 222,
  ShoalShell = 223,
  SlowpokeTail = 224,
  RelicCopper = 225,
  RelicSilver = 226,
  RelicGold = 227,
  RelicVase = 228,
  RelicBand = 229,
  RelicStatue = 230,
  RelicCrown = 231,

  /**
   * The gear: held items that do their work for as long as they are
   * carried and are never spent. Each is one small standing rule —
   * health back every second, a tenth more accuracy, a share of what
   * touching the holder costs — written against a hook the battle
   * engine already has. The battle side of them lives in
   * [`src/battle/items/gear.ts`](../../battle/items/gear.ts)
   */
  Leftovers = 232,
  ShellBell = 233,
  BigRoot = 234,
  MuscleBand = 235,
  WiseGlasses = 236,
  ExpertBelt = 237,
  Metronome = 238,
  WideLens = 239,
  ScopeLens = 240,
  BrightPowder = 241,
  QuickClaw = 242,
  FocusBand = 243,
  RockyHelmet = 244,
  SafetyGoggles = 245,
  UtilityUmbrella = 246,
  SmokeBall = 247,
  DestinyKnot = 248,

  /**
   * The gear nobody stocks: a lump of sludge that is food to a Poison
   * type and poison to everyone else, and two more species relics —
   * a punching bag only a Chansey has the hands for, and the leek a
   * Farfetch'd was already carrying
   */
  BlackSludge = 249,
  LuckyPunch = 250,
  Stick = 251,

  /**
   * The one-shots: held against a single moment and gone once it
   * comes. A sash is worth exactly one blow that would have finished
   * its holder, a policy is worth one hit taken badly, and a herb is
   * worth one move. See
   * [`src/battle/items/one-shots.ts`](../../battle/items/one-shots.ts)
   */
  FocusSash = 252,
  AirBalloon = 253,
  WeaknessPolicy = 254,
  BlunderPolicy = 255,
  AbsorbBulb = 256,
  CellBattery = 257,
  Snowball = 258,
  LuminousMoss = 259,
  ThroatSpray = 260,
  WhiteHerb = 261,
  MentalHerb = 262,
  PowerHerb = 263,

  /**
   * The gear that lengthens or deepens something already running: a
   * screen, and the grip of whatever is holding a pokemon still
   */
  LightClay = 264,
  GripClaw = 265,
  BindingBand = 266,

  /**
   * Held against being sized up: the holder answers a stare-down by
   * being quicker for it, once
   */
  AdrenalineOrb = 267,

  /**
   * The weather rocks: one per sky, each holding whatever its holder
   * called up out for longer
   */
  DampRock = 268,
  HeatRock = 269,
  IcyRock = 270,
  SmoothRock = 271,

  /**
   * Gear for the two moments a pokemon is least able to help itself:
   * a lens that reads a target too busy to dodge, and a shell that
   * gets its holder out of whatever is holding it
   */
  ZoomLens = 272,
  ShedShell = 273,

  /**
   * The one-shots that put somebody on the bench. A card sends whoever
   * threw the blow away, and the two ejectors send the holder
   */
  RedCard = 274,
  EjectButton = 275,
  EjectPack = 276,
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
