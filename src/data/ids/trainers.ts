/**
 * The people who stand at a duelling landmark: the Ace Trainer, who
 * fields the best of anything, and the type experts, who each field
 * one type and nothing else.
 *
 * A class is rolled per stop per window the way a grunt's party is,
 * so the same cell is a Bug Catcher one afternoon and a Channeler the
 * next, out of the ones that country puts on the road. What a player
 * has put down is counted for life, and that count is what the
 * class' own title is worn off.
 *
 * The number is what a win is counted under, so a class is appended
 * and never renumbered. What each fields, wears, is called and says is
 * data, in `src/data/overworld/trainers/` and
 * `src/data/text/en/trainers/`
 */

const enum TrainerClass {
  /** No specialty and the strongest roadside party there is */
  AceTrainer = 0,
  Lass = 1,
  BlackBelt = 2,
  BirdKeeper = 3,
  Biker = 4,
  Hiker = 5,
  PokeManiac = 6,
  BugCatcher = 7,
  Channeler = 8,
  Burglar = 9,
  Swimmer = 10,
  Rocker = 11,
  Psychic = 12,
  Sage = 13,
  Skier = 14,
  Scientist = 15,
  /** Johto's own of the trades Kanto already put on the road */
  JohtoPokeManiac = 16,
  JohtoBurglar = 17,
  JohtoAceTrainer = 18,
  JohtoLass = 19,
  JohtoBlackBelt = 20,
  JohtoBirdKeeper = 21,
  JohtoBiker = 22,
  JohtoBugCatcher = 23,
  JohtoSwimmer = 24,
  Firebreather = 25,
  Medium = 26,
  Teacher = 27,
  SchoolKid = 28,
  Youngster = 29,
  Camper = 30,
  Beauty = 31,
  Fisherman = 32,
  Sailor = 33,
  Gentleman = 34,
  SuperNerd = 35,
  Juggler = 36,
  Tamer = 37,
  Engineer = 38,
  Gambler = 39,
  JohtoGentleman = 40,
  JohtoSuperNerd = 41,
  JohtoJuggler = 42,
  Boarder = 43,

  /**
   * Hoenn's own three, and the only new **trades** it brings. A trade
   * carries a title numbered `300 + trade * 2`, and the professors'
   * titles start at 400, so a trade past 49 would answer to one of
   * theirs: new trades take the free low numbers, and every class
   * after them is one region's version of a trade that already exists
   */
  NinjaBoy = 44,
  Tuber = 45,
  PokeFan = 46,
  /** Hoenn's own of the trades already on the road, under its name for them */
  HoennAceTrainer = 47,
  HoennLass = 48,
  HoennBirdKeeper = 49,
  HoennBugCatcher = 50,
  HoennSwimmer = 51,
  HoennYoungster = 52,
  HoennSchoolKid = 53,
  HoennCamper = 54,
  HoennBeauty = 55,
  HoennFisherman = 56,
  HoennSailor = 57,
  HoennGentleman = 58,
  HoennScientist = 59,
  // The same trades under Hoenn's own names: a guitarist is a
  // rocker, an aroma lady a sage, a street thug a burglar
  Guitarist = 60,
  Kindler = 61,
  BattleGirl = 62,
  Expert = 63,
  RuinManiac = 64,
  StreetThug = 65,
  DragonTamer = 66,
  AromaLady = 67,

  /**
   * Sinnoh's own trades, which are the first to sit above the 50 the
   * old title band held: a trade past that carries its title in the
   * second band rather than in the professors' numbers. See
   * `trainerTitle` in src/data/ids/titles.ts
   */
  Ranger = 68,
  Worker = 69,
  Rancher = 70,
  Cyclist = 71,
  PokeKid = 72,
  Collector = 73,
  Artist = 74,
  Reporter = 75,
  RichBoy = 76,
  Waiter = 77,
  ParasolLady = 78,
  Twins = 79,
  Policeman = 80,
  Jogger = 81,
  Breeder = 82,
  /** And its own of the trades already on the road */
  SinnohAceTrainer = 83,
  SinnohLass = 84,
  SinnohBugCatcher = 85,
  SinnohSwimmer = 86,
  SinnohYoungster = 87,
  SinnohSchoolKid = 88,
  SinnohCamper = 89,
  SinnohBeauty = 90,
  SinnohFisherman = 91,
  SinnohSailor = 92,
  SinnohGentleman = 93,
  SinnohScientist = 94,
  SinnohBirdKeeper = 95,
  SinnohHiker = 96,
  SinnohPsychic = 97,
  SinnohSkier = 98,
  SinnohBlackBelt = 99,
  SinnohDragonTamer = 100,
  SinnohGuitarist = 101,
  SinnohAromaLady = 102,
  SinnohRuinManiac = 103,
  SinnohNinjaBoy = 104,
  SinnohTuber = 105,
  SinnohPokeFan = 106,
  SinnohRoughneck = 107,
  SinnohClown = 108,

  /**
   * The Young Couple, who both later regions put on the road, and
   * Hoenn's own of the trades Sinnoh turned out to have brought
   * first: the art for all seven shipped with Hoenn and was worn by
   * nobody
   */
  Couple = 109,
  HoennBreeder = 110,
  HoennRanger = 111,
  HoennCollector = 112,
  HoennReporter = 113,
  HoennRichBoy = 114,
  HoennParasolLady = 115,
  SinnohCouple = 116,

  /**
   * Unova's own trades, which are the city ones the road never had:
   * the counter, the depot, the ball court and the stage. Its
   * numbers sit in the second title band with Sinnoh’s
   */
  Backpacker = 117,
  Baker = 118,
  Clerk = 119,
  Dancer = 120,
  DepotAgent = 121,
  Doctor = 122,
  Harlequin = 123,
  Hoopster = 124,
  Infielder = 125,
  Janitor = 126,
  Lady = 127,
  Linebacker = 128,
  Maid = 129,
  Musician = 130,
  NurseryAide = 131,
  Pilot = 132,
  Smasher = 133,
  Socialite = 134,
  Striker = 135,
  SuitActor = 136,
  Veteran = 137,
  Backers = 138,
  /** And its own of the trades already on the road */
  UnovaAceTrainer = 139,
  UnovaArtist = 140,
  UnovaBattleGirl = 141,
  UnovaBeauty = 142,
  UnovaBiker = 143,
  UnovaBlackBelt = 144,
  UnovaBreeder = 145,
  UnovaCyclist = 146,
  UnovaFisherman = 147,
  UnovaGentleman = 148,
  UnovaGuitarist = 149,
  UnovaHiker = 150,
  UnovaLass = 151,
  UnovaParasolLady = 152,
  UnovaPokeFan = 153,
  UnovaPoliceman = 154,
  UnovaPsychic = 155,
  UnovaRanger = 156,
  UnovaRichBoy = 157,
  UnovaRoughneck = 158,
  UnovaSchoolKid = 159,
  UnovaScientist = 160,
  UnovaSwimmer = 161,
  UnovaWaiter = 162,
  UnovaWorker = 163,
  UnovaYoungster = 164,
  /** Kalos's own of the trades already on the road */
  KalosAceTrainer = 165,
  KalosLass = 166,
  KalosYoungster = 167,
  KalosBlackBelt = 168,
  KalosBattleGirl = 169,
  KalosBeauty = 170,
  KalosFisherman = 171,
  KalosSwimmer = 172,
  KalosHiker = 173,
  KalosPsychic = 174,
  KalosHexManiac = 175,
  KalosScientist = 176,
  KalosWorker = 177,
  KalosRichBoy = 178,
  KalosPokeFan = 179,
  KalosRanger = 180,
  KalosBreeder = 181,
  KalosBackpacker = 182,
  KalosArtist = 183,
  KalosCyclist = 184,
  KalosGentleman = 185,
  KalosLady = 186,
  KalosWaiter = 187,
  KalosMaid = 188,
  KalosTwins = 189,
  KalosVeteran = 190,
  KalosSchoolKid = 191,
  KalosPreschooler = 192,
  KalosRollerSkater = 193,
  KalosPunkGuy = 194,
  KalosPunkGirl = 195,
  KalosSocialite = 196,
  KalosChef = 197,
  KalosClerk = 198,
  KalosGardener = 199,
  /**
   * Kalos's own trades: the sky, the fairy tale, the kimono, the
   * household, the tour and the stage. Their titles sit in the second
   * band with Sinnoh's and Unova's
   */
  SkyTrainer = 200,
  FairyTaleGirl = 201,
  FurisodeGirl = 202,
  Butler = 203,
  Tourist = 204,
  RisingStar = 205,
}

export { TrainerClass };
export default TrainerClass;
