export const enum Genders {
  Genderless = 0,
  Male = 1,
  Female = 2,
}

/**
 * What each is called in words, for anything that reads or is read: a
 * label under a sprite, a search asking for one
 */
export const GENDER_NAMES: Record<Genders, string> = {
  [Genders.Genderless]: 'Genderless',
  [Genders.Male]: 'Male',
  [Genders.Female]: 'Female',
};

/**
 * How a species evolves, as combinable bit flags (e.g. a trade while
 * holding an item is Trade | HeldItem)
 */
export const enum EvolutionMethod {
  /**
   * Reaching a level threshold
   */
  Level = 0b1,
  /**
   * An evolution item used on the pokemon (e.g. stones)
   */
  UsedItem = 0b10,
  /**
   * Holding an item when the trigger fires
   */
  HeldItem = 0b100,
  /**
   * Being traded
   */
  Trade = 0b1000,
  /**
   * High friendship
   */
  Friendship = 0b10000,
  /**
   * Day/night restriction
   */
  TimeOfDay = 0b100000,
  /**
   * Gender restriction
   */
  Gender = 0b1000000,
  /**
   * A specific location or field condition
   */
  Location = 0b10000000,
  /**
   * Knowing a specific move
   */
  KnownMove = 0b100000000,
  /**
   * A specific party composition (e.g. a certain species or type
   * present)
   */
  PartyCondition = 0b1000000000,
  /**
   * A specific weather
   */
  Weather = 0b10000000000,
  /**
   * A stat comparison (e.g. Attack vs Defense)
   */
  StatComparison = 0b100000000000,
  /**
   * A one-off condition outside the other flags
   */
  Special = 0b1000000000000,
}

export const enum Species {
  Missingno = 100000,
  Egg = 100001,
  Substitute = 100002,
  /**
   * Forms live past a million, at `1000000 + dexNumber * 100 +
   * formIndex`, which keeps `Species === dexNumber` true of every
   * base form, gives each species a hundred slots (Alcremie's 63 is
   * the largest set the mainline prints) and sorts a species' forms
   * after it for free. The unowns are the first to use it.
   *
   * Nothing else may claim the band. An id reaches a player's rows,
   * so it cannot be renumbered afterwards
   */
  Bulbasaur = 1,
  Ivysaur = 2,
  Venusaur = 3,
  Charmander = 4,
  Charmeleon = 5,
  Charizard = 6,
  Squirtle = 7,
  Wartortle = 8,
  Blastoise = 9,
  Caterpie = 10,
  Metapod = 11,
  Butterfree = 12,
  Weedle = 13,
  Kakuna = 14,
  Beedrill = 15,
  Pidgey = 16,
  Pidgeotto = 17,
  Pidgeot = 18,
  Rattata = 19,
  Raticate = 20,
  Spearow = 21,
  Fearow = 22,
  Ekans = 23,
  Arbok = 24,
  Pikachu = 25,
  Raichu = 26,
  Sandshrew = 27,
  Sandslash = 28,
  NidoranF = 29,
  Nidorina = 30,
  Nidoqueen = 31,
  NidoranM = 32,
  Nidorino = 33,
  Nidoking = 34,
  Clefairy = 35,
  Clefable = 36,
  Vulpix = 37,
  Ninetales = 38,
  Jigglypuff = 39,
  Wigglytuff = 40,
  Zubat = 41,
  Golbat = 42,
  Oddish = 43,
  Gloom = 44,
  Vileplume = 45,
  Paras = 46,
  Parasect = 47,
  Venonat = 48,
  Venomoth = 49,
  Diglett = 50,
  Dugtrio = 51,
  Meowth = 52,
  Persian = 53,
  Psyduck = 54,
  Golduck = 55,
  Mankey = 56,
  Primeape = 57,
  Growlithe = 58,
  Arcanine = 59,
  Poliwag = 60,
  Poliwhirl = 61,
  Poliwrath = 62,
  Abra = 63,
  Kadabra = 64,
  Alakazam = 65,
  Machop = 66,
  Machoke = 67,
  Machamp = 68,
  Bellsprout = 69,
  Weepinbell = 70,
  Victreebel = 71,
  Tentacool = 72,
  Tentacruel = 73,
  Geodude = 74,
  Graveler = 75,
  Golem = 76,
  Ponyta = 77,
  Rapidash = 78,
  Slowpoke = 79,
  Slowbro = 80,
  Magnemite = 81,
  Magneton = 82,
  Farfetchd = 83,
  Doduo = 84,
  Dodrio = 85,
  Seel = 86,
  Dewgong = 87,
  Grimer = 88,
  Muk = 89,
  Shellder = 90,
  Cloyster = 91,
  Gastly = 92,
  Haunter = 93,
  Gengar = 94,
  Onix = 95,
  Drowzee = 96,
  Hypno = 97,
  Krabby = 98,
  Kingler = 99,
  Voltorb = 100,
  Electrode = 101,
  Exeggcute = 102,
  Exeggutor = 103,
  Cubone = 104,
  Marowak = 105,
  Hitmonlee = 106,
  Hitmonchan = 107,
  Lickitung = 108,
  Koffing = 109,
  Weezing = 110,
  Rhyhorn = 111,
  Rhydon = 112,
  Chansey = 113,
  Tangela = 114,
  Kangaskhan = 115,
  Horsea = 116,
  Seadra = 117,
  Goldeen = 118,
  Seaking = 119,
  Staryu = 120,
  Starmie = 121,
  MrMime = 122,
  Scyther = 123,
  Jynx = 124,
  Electabuzz = 125,
  Magmar = 126,
  Pinsir = 127,
  Tauros = 128,
  Magikarp = 129,
  Gyarados = 130,
  Lapras = 131,
  Ditto = 132,
  Eevee = 133,
  Vaporeon = 134,
  Jolteon = 135,
  Flareon = 136,
  Porygon = 137,
  Omanyte = 138,
  Omastar = 139,
  Kabuto = 140,
  Kabutops = 141,
  Aerodactyl = 142,
  Snorlax = 143,
  Articuno = 144,
  Zapdos = 145,
  Moltres = 146,
  Dratini = 147,
  Dragonair = 148,
  Dragonite = 149,
  Mewtwo = 150,
  Mew = 151,
  Chikorita = 152,
  Bayleef = 153,
  Meganium = 154,
  Cyndaquil = 155,
  Quilava = 156,
  Typhlosion = 157,
  Totodile = 158,
  Croconaw = 159,
  Feraligatr = 160,
  Sentret = 161,
  Furret = 162,
  Hoothoot = 163,
  Noctowl = 164,
  Ledyba = 165,
  Ledian = 166,
  Spinarak = 167,
  Ariados = 168,
  Crobat = 169,
  Chinchou = 170,
  Lanturn = 171,
  Pichu = 172,
  Cleffa = 173,
  Igglybuff = 174,
  Togepi = 175,
  Togetic = 176,
  Natu = 177,
  Xatu = 178,
  Mareep = 179,
  Flaaffy = 180,
  Ampharos = 181,
  Bellossom = 182,
  Marill = 183,
  Azumarill = 184,
  Sudowoodo = 185,
  Politoed = 186,
  Hoppip = 187,
  Skiploom = 188,
  Jumpluff = 189,
  Aipom = 190,
  Sunkern = 191,
  Sunflora = 192,
  Yanma = 193,
  Wooper = 194,
  Quagsire = 195,
  Espeon = 196,
  Umbreon = 197,
  Murkrow = 198,
  Slowking = 199,
  Misdreavus = 200,
  /**
   * The A form, and the base form the other twenty-seven are
   * numbered off. Their ids are the reserved form band, so they
   * sort straight after this one
   */
  Unown = 201,
  UnownB = 1020101,
  UnownC = 1020102,
  UnownD = 1020103,
  UnownE = 1020104,
  UnownF = 1020105,
  UnownG = 1020106,
  UnownH = 1020107,
  UnownI = 1020108,
  UnownJ = 1020109,
  UnownK = 1020110,
  UnownL = 1020111,
  UnownM = 1020112,
  UnownN = 1020113,
  UnownO = 1020114,
  UnownP = 1020115,
  UnownQ = 1020116,
  UnownR = 1020117,
  UnownS = 1020118,
  UnownT = 1020119,
  UnownU = 1020120,
  UnownV = 1020121,
  UnownW = 1020122,
  UnownX = 1020123,
  UnownY = 1020124,
  UnownZ = 1020125,
  UnownExclamation = 1020126,
  UnownQuestion = 1020127,
  Wobbuffet = 202,
  Girafarig = 203,
  Pineco = 204,
  Forretress = 205,
  Dunsparce = 206,
  Gligar = 207,
  Steelix = 208,
  Snubbull = 209,
  Granbull = 210,
  Qwilfish = 211,
  Scizor = 212,
  Shuckle = 213,
  Heracross = 214,
  Sneasel = 215,
  Teddiursa = 216,
  Ursaring = 217,
  Slugma = 218,
  Magcargo = 219,
  Swinub = 220,
  Piloswine = 221,
  Corsola = 222,
  Remoraid = 223,
  Octillery = 224,
  Delibird = 225,
  Mantine = 226,
  Skarmory = 227,
  Houndour = 228,
  Houndoom = 229,
  Kingdra = 230,
  Phanpy = 231,
  Donphan = 232,
  Porygon2 = 233,
  Stantler = 234,
  Smeargle = 235,
  Tyrogue = 236,
  Hitmontop = 237,
  Smoochum = 238,
  Elekid = 239,
  Magby = 240,
  Miltank = 241,
  Blissey = 242,
  Raikou = 243,
  Entei = 244,
  Suicune = 245,
  Larvitar = 246,
  Pupitar = 247,
  Tyranitar = 248,
  Lugia = 249,
  HoOh = 250,
  Celebi = 251,
  Treecko = 252,
  Grovyle = 253,
  Sceptile = 254,
  Torchic = 255,
  Combusken = 256,
  Blaziken = 257,
  Mudkip = 258,
  Marshtomp = 259,
  Swampert = 260,
}

/**
 * Where form ids start. Below it an id is a dex number; at or above
 * it an id is `SPECIES_FORM_BAND + dexNumber * FORMS_PER_SPECIES +
 * formIndex`
 */
export const SPECIES_FORM_BAND = 1000000;

/** How many slots each species is given in the band. */
export const FORMS_PER_SPECIES = 100;

/**
 * The dex number an id belongs to: its own below the band, and the
 * species it is a form of above it. Missingno, the egg and the
 * substitute answer their own id, having no dex number to give
 */
export function speciesDexNumber(species: Species): number {
  const id: number = species;

  return id < SPECIES_FORM_BAND ? id : Math.floor((id - SPECIES_FORM_BAND) / FORMS_PER_SPECIES);
}

/** Which form of its species an id is, counting the default as 0. */
export function speciesFormIndex(species: Species): number {
  const id: number = species;

  return id < SPECIES_FORM_BAND ? 0 : (id - SPECIES_FORM_BAND) % FORMS_PER_SPECIES;
}

/**
 * The default form of whatever this is: itself for a base form, and
 * the species it is a costume of for a variant. It works off the id
 * alone because a base form's id **is** its dex number
 */
export function getBaseFormSpecies(species: Species): Species {
  // tsc requires the assertion to produce a Species from the number;
  // tsgolint resolves the const enum to number
  // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
  return speciesDexNumber(species) as Species;
}

/**
 * Every unown, in alphabet order, A first.
 *
 * One pokemon wearing twenty-eight faces, and the only species so far
 * with forms at all. The list is here rather than beside the species
 * data because the spawn pools and the dex both want it and neither
 * should have to read the registry to get it
 */
export const UNOWN_FORMS: Species[] = [
  Species.Unown,
  Species.UnownB,
  Species.UnownC,
  Species.UnownD,
  Species.UnownE,
  Species.UnownF,
  Species.UnownG,
  Species.UnownH,
  Species.UnownI,
  Species.UnownJ,
  Species.UnownK,
  Species.UnownL,
  Species.UnownM,
  Species.UnownN,
  Species.UnownO,
  Species.UnownP,
  Species.UnownQ,
  Species.UnownR,
  Species.UnownS,
  Species.UnownT,
  Species.UnownU,
  Species.UnownV,
  Species.UnownW,
  Species.UnownX,
  Species.UnownY,
  Species.UnownZ,
  Species.UnownExclamation,
  Species.UnownQuestion,
];

/** The two marks the alphabet is followed by. */
const UNOWN_MARKS = ['!', '?'];

const UNOWN_LETTERS = new Map<Species, string>(
  UNOWN_FORMS.map((species, at) => [
    species,
    at < 26 ? String.fromCharCode(65 + at) : UNOWN_MARKS[at - 26],
  ]),
);

/**
 * The character an unown is shaped like: a letter, and the two marks
 * that come after Z. Null for anything that is not an unown, which is
 * how a caller asks whether it is looking at one
 */
export function unownLetter(species: Species): string | null {
  return UNOWN_LETTERS.get(species) ?? null;
}
