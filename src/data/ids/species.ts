export const enum Genders {
  Genderless = 0,
  Male = 1,
  Female = 2,
}

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
  Missingno = 0,
  Egg = 1,
  Substitute = 2,
  Bulbasaur = 3,
  Ivysaur = 4,
  Venusaur = 5,
  Charmander = 6,
  Charmeleon = 7,
  Charizard = 8,
  Squirtle = 9,
  Wartortle = 10,
  Blastoise = 11,
  Caterpie = 12,
  Metapod = 13,
  Butterfree = 14,
  Weedle = 15,
  Kakuna = 16,
  Beedrill = 17,
  Pidgey = 18,
  Pidgeotto = 19,
  Pidgeot = 20,
  Rattata = 21,
  Raticate = 22,
  Spearow = 23,
  Fearow = 24,
  Ekans = 25,
  Arbok = 26,
  Pikachu = 27,
  Raichu = 28,
  Sandshrew = 29,
  Sandslash = 30,
  NidoranF = 31,
  Nidorina = 32,
  Nidoqueen = 33,
  NidoranM = 34,
  Nidorino = 35,
  Nidoking = 36,
  Clefairy = 37,
  Clefable = 38,
  Vulpix = 39,
  Ninetales = 40,
  Jigglypuff = 41,
  Wigglytuff = 42,
  Zubat = 43,
  Golbat = 44,
  Oddish = 45,
  Gloom = 46,
  Vileplume = 47,
  Paras = 48,
  Parasect = 49,
  Venonat = 50,
  Venomoth = 51,
  Diglett = 52,
  Dugtrio = 53,
  Meowth = 54,
  Persian = 55,
  Psyduck = 56,
  Golduck = 57,
  Mankey = 58,
  Primeape = 59,
  Growlithe = 60,
  Arcanine = 61,
  Poliwag = 62,
  Poliwhirl = 63,
  Poliwrath = 64,
  Abra = 65,
  Kadabra = 66,
  Alakazam = 67,
  Machop = 68,
  Machoke = 69,
  Machamp = 70,
  Bellsprout = 71,
  Weepinbell = 72,
  Victreebel = 73,
  Tentacool = 74,
  Tentacruel = 75,
  Geodude = 76,
  Graveler = 77,
  Golem = 78,
  Ponyta = 79,
  Rapidash = 80,
  Slowpoke = 81,
  Slowbro = 82,
  Magnemite = 83,
  Magneton = 84,
  Farfetchd = 85,
  Doduo = 86,
  Dodrio = 87,
  Seel = 88,
  Dewgong = 89,
  Grimer = 90,
  Muk = 91,
  Shellder = 92,
  Cloyster = 93,
  Gastly = 94,
  Haunter = 95,
  Gengar = 96,
  Onix = 97,
  Drowzee = 98,
  Hypno = 99,
  Krabby = 100,
  Kingler = 101,
  Voltorb = 102,
  Electrode = 103,
  Exeggcute = 104,
  Exeggutor = 105,
  Cubone = 106,
  Marowak = 107,
  Hitmonlee = 108,
  Hitmonchan = 109,
  Lickitung = 110,
  Koffing = 111,
  Weezing = 112,
  Rhyhorn = 113,
  Rhydon = 114,
  Chansey = 115,
  Tangela = 116,
  Kangaskhan = 117,
  Horsea = 118,
  Seadra = 119,
  Goldeen = 120,
  Seaking = 121,
  Staryu = 122,
  Starmie = 123,
  MrMime = 124,
  Scyther = 125,
  Jynx = 126,
  Electabuzz = 127,
  Magmar = 128,
  Pinsir = 129,
  Tauros = 130,
  Magikarp = 131,
  Gyarados = 132,
  Lapras = 133,
  Ditto = 134,
  Eevee = 135,
  Vaporeon = 136,
  Jolteon = 137,
  Flareon = 138,
  Porygon = 139,
  Omanyte = 140,
  Omastar = 141,
  Kabuto = 142,
  Kabutops = 143,
  Aerodactyl = 144,
  Snorlax = 145,
  Articuno = 146,
  Zapdos = 147,
  Moltres = 148,
  Dratini = 149,
  Dragonair = 150,
  Dragonite = 151,
  Mewtwo = 152,
  Mew = 153,
}
