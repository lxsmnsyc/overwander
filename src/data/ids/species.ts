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

/** Where a species can be met: on the ground, in the water, or either */
export const enum Habitat {
  Ground = 0,
  Water = 1,
  Amphibious = 2,
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
  Poochyena = 261,
  Mightyena = 262,
  Zigzagoon = 263,
  Linoone = 264,
  Wurmple = 265,
  Silcoon = 266,
  Beautifly = 267,
  Cascoon = 268,
  Dustox = 269,
  Lotad = 270,
  Lombre = 271,
  Ludicolo = 272,
  Seedot = 273,
  Nuzleaf = 274,
  Shiftry = 275,
  Taillow = 276,
  Swellow = 277,
  Wingull = 278,
  Pelipper = 279,
  Ralts = 280,
  Kirlia = 281,
  Gardevoir = 282,
  Surskit = 283,
  Masquerain = 284,
  Shroomish = 285,
  Breloom = 286,
  Slakoth = 287,
  Vigoroth = 288,
  Slaking = 289,
  Nincada = 290,
  Ninjask = 291,
  Shedinja = 292,
  Whismur = 293,
  Loudred = 294,
  Exploud = 295,
  Makuhita = 296,
  Hariyama = 297,
  Azurill = 298,
  Nosepass = 299,
  Skitty = 300,
  Delcatty = 301,
  Sableye = 302,
  Mawile = 303,
  Aron = 304,
  Lairon = 305,
  Aggron = 306,
  Meditite = 307,
  Medicham = 308,
  Electrike = 309,
  Manectric = 310,
  Plusle = 311,
  Minun = 312,
  Volbeat = 313,
  Illumise = 314,
  Roselia = 315,
  Gulpin = 316,
  Swalot = 317,
  Carvanha = 318,
  Sharpedo = 319,
  Wailmer = 320,
  Wailord = 321,
  Numel = 322,
  Camerupt = 323,
  Torkoal = 324,
  Spoink = 325,
  Grumpig = 326,
  Spinda = 327,
  Trapinch = 328,
  Vibrava = 329,
  Flygon = 330,
  Cacnea = 331,
  Cacturne = 332,
  Swablu = 333,
  Altaria = 334,
  Zangoose = 335,
  Seviper = 336,
  Lunatone = 337,
  Solrock = 338,
  Barboach = 339,
  Whiscash = 340,
  Corphish = 341,
  Crawdaunt = 342,
  Baltoy = 343,
  Claydol = 344,
  Lileep = 345,
  Cradily = 346,
  Anorith = 347,
  Armaldo = 348,
  Feebas = 349,
  Milotic = 350,
  Castform = 351,
  CastformSunny = 1035101,
  CastformRainy = 1035102,
  CastformSnowy = 1035103,
  Kecleon = 352,
  Shuppet = 353,
  Banette = 354,
  Duskull = 355,
  Dusclops = 356,
  Tropius = 357,
  Chimecho = 358,
  Absol = 359,
  Wynaut = 360,
  Snorunt = 361,
  Glalie = 362,
  Spheal = 363,
  Sealeo = 364,
  Walrein = 365,
  Clamperl = 366,
  Huntail = 367,
  Gorebyss = 368,
  Relicanth = 369,
  Luvdisc = 370,
  Bagon = 371,
  Shelgon = 372,
  Salamence = 373,
  Beldum = 374,
  Metang = 375,
  Metagross = 376,
  Regirock = 377,
  Regice = 378,
  Registeel = 379,
  Latias = 380,
  Latios = 381,
  Kyogre = 382,
  Groudon = 383,
  Rayquaza = 384,
  Jirachi = 385,
  Deoxys = 386,
  Turtwig = 387,
  Grotle = 388,
  Torterra = 389,
  Chimchar = 390,
  Monferno = 391,
  Infernape = 392,
  Piplup = 393,
  Prinplup = 394,
  Empoleon = 395,
  Starly = 396,
  Staravia = 397,
  Staraptor = 398,
  Bidoof = 399,
  Bibarel = 400,
  Kricketot = 401,
  Kricketune = 402,
  Shinx = 403,
  Luxio = 404,
  Luxray = 405,
  Budew = 406,
  Roserade = 407,
  Cranidos = 408,
  Rampardos = 409,
  Shieldon = 410,
  Bastiodon = 411,
  Burmy = 412,
  Wormadam = 413,
  Mothim = 414,
  Combee = 415,
  Vespiquen = 416,
  Pachirisu = 417,
  Buizel = 418,
  Floatzel = 419,
  Cherubi = 420,
  Cherrim = 421,
  Shellos = 422,
  Gastrodon = 423,
  Ambipom = 424,
  Drifloon = 425,
  Drifblim = 426,
  Buneary = 427,
  Lopunny = 428,
  Mismagius = 429,
  Honchkrow = 430,
  Glameow = 431,
  Purugly = 432,
  Chingling = 433,
  Stunky = 434,
  Skuntank = 435,
  Bronzor = 436,
  Bronzong = 437,
  Bonsly = 438,
  MimeJr = 439,
  Happiny = 440,
  Chatot = 441,
  Spiritomb = 442,
  Gible = 443,
  Gabite = 444,
  Garchomp = 445,
  Munchlax = 446,
  Riolu = 447,
  Lucario = 448,
  Hippopotas = 449,
  Hippowdon = 450,
  Skorupi = 451,
  Drapion = 452,
  Croagunk = 453,
  Toxicroak = 454,
  Carnivine = 455,
  Finneon = 456,
  Lumineon = 457,
  Mantyke = 458,
  Snover = 459,
  Abomasnow = 460,
  Weavile = 461,
  Magnezone = 462,
  Lickilicky = 463,
  Rhyperior = 464,
  Tangrowth = 465,
  Electivire = 466,
  Magmortar = 467,
  Togekiss = 468,
  Yanmega = 469,
  Leafeon = 470,
  Glaceon = 471,
  Gliscor = 472,
  Mamoswine = 473,
  PorygonZ = 474,
  Gallade = 475,
  Probopass = 476,
  Dusknoir = 477,
  Froslass = 478,
  Rotom = 479,
  Uxie = 480,
  Mesprit = 481,
  Azelf = 482,
  Dialga = 483,
  Palkia = 484,
  Heatran = 485,
  Regigigas = 486,
  Giratina = 487,
  Cresselia = 488,
  Phione = 489,
  Manaphy = 490,
  Darkrai = 491,
  Shaymin = 492,
  Arceus = 493,

  /**
   * Unova, numbered ahead of its data so the ids are settled before
   * anything is written against them.
   *
   * The sprite collection has drawn nothing for Blitzle, Zebstrika,
   * Simisear, Simipour, Tranquill, Throh, Crustle, Tirtouga,
   * Carracosta, Amoonguss, Frillish, Jellicent, Shelmet, Stunfisk and
   * Bouffalant, so those lines cannot be released until it does
   */
  Victini = 494,
  Snivy = 495,
  Servine = 496,
  Serperior = 497,
  Tepig = 498,
  Pignite = 499,
  Emboar = 500,
  Oshawott = 501,
  Dewott = 502,
  Samurott = 503,
  Patrat = 504,
  Watchog = 505,
  Lillipup = 506,
  Herdier = 507,
  Stoutland = 508,
  Purrloin = 509,
  Liepard = 510,
  Pansage = 511,
  Simisage = 512,
  Pansear = 513,
  Simisear = 514,
  Panpour = 515,
  Simipour = 516,
  Munna = 517,
  Musharna = 518,
  Pidove = 519,
  Tranquill = 520,
  Unfezant = 521,
  Blitzle = 522,
  Zebstrika = 523,
  Roggenrola = 524,
  Boldore = 525,
  Gigalith = 526,
  Woobat = 527,
  Swoobat = 528,
  Drilbur = 529,
  Excadrill = 530,
  Audino = 531,
  Timburr = 532,
  Gurdurr = 533,
  Conkeldurr = 534,
  Tympole = 535,
  Palpitoad = 536,
  Seismitoad = 537,
  Throh = 538,
  Sawk = 539,
  Sewaddle = 540,
  Swadloon = 541,
  Leavanny = 542,
  Venipede = 543,
  Whirlipede = 544,
  Scolipede = 545,
  Cottonee = 546,
  Whimsicott = 547,
  Petilil = 548,
  Lilligant = 549,
  Basculin = 550,
  Sandile = 551,
  Krokorok = 552,
  Krookodile = 553,
  Darumaka = 554,
  Darmanitan = 555,
  Maractus = 556,
  Dwebble = 557,
  Crustle = 558,
  Scraggy = 559,
  Scrafty = 560,
  Sigilyph = 561,
  Yamask = 562,
  Cofagrigus = 563,
  Tirtouga = 564,
  Carracosta = 565,
  Archen = 566,
  Archeops = 567,
  Trubbish = 568,
  Garbodor = 569,
  Zorua = 570,
  Zoroark = 571,
  Minccino = 572,
  Cinccino = 573,
  Gothita = 574,
  Gothorita = 575,
  Gothitelle = 576,
  Solosis = 577,
  Duosion = 578,
  Reuniclus = 579,
  Ducklett = 580,
  Swanna = 581,
  Vanillite = 582,
  Vanillish = 583,
  Vanilluxe = 584,
  Deerling = 585,
  Sawsbuck = 586,
  Emolga = 587,
  Karrablast = 588,
  Escavalier = 589,
  Foongus = 590,
  Amoonguss = 591,
  Frillish = 592,
  Jellicent = 593,
  Alomomola = 594,
  Joltik = 595,
  Galvantula = 596,
  Ferroseed = 597,
  Ferrothorn = 598,
  Klink = 599,
  Klang = 600,
  Klinklang = 601,
  Tynamo = 602,
  Eelektrik = 603,
  Eelektross = 604,
  Elgyem = 605,
  Beheeyem = 606,
  Litwick = 607,
  Lampent = 608,
  Chandelure = 609,
  Axew = 610,
  Fraxure = 611,
  Haxorus = 612,
  Cubchoo = 613,
  Beartic = 614,
  Cryogonal = 615,
  Shelmet = 616,
  Accelgor = 617,
  Stunfisk = 618,
  Mienfoo = 619,
  Mienshao = 620,
  Druddigon = 621,
  Golett = 622,
  Golurk = 623,
  Pawniard = 624,
  Bisharp = 625,
  Bouffalant = 626,
  Rufflet = 627,
  Braviary = 628,
  Vullaby = 629,
  Mandibuzz = 630,
  Heatmor = 631,
  Durant = 632,
  Deino = 633,
  Zweilous = 634,
  Hydreigon = 635,
  Larvesta = 636,
  Volcarona = 637,
  Cobalion = 638,
  Terrakion = 639,
  Virizion = 640,
  Tornadus = 641,
  Thundurus = 642,
  Reshiram = 643,
  Zekrom = 644,
  Landorus = 645,
  Kyurem = 646,
  Keldeo = 647,
  Meloetta = 648,
  Genesect = 649,
  DeoxysAttack = 1038601,
  DeoxysDefense = 1038602,
  DeoxysSpeed = 1038603,

  /** The shapes the creation trio take in the world behind this one */
  DialgaOrigin = 1048301,
  PalkiaOrigin = 1048401,
  GiratinaOrigin = 1048701,

  /** The five appliances a Rotom gets into, one machine apiece */
  RotomHeat = 1047901,
  RotomWash = 1047902,
  RotomFrost = 1047903,
  RotomFan = 1047904,
  RotomMow = 1047905,

  /**
   * The seventeen shapes a Plate puts an Arceus in, filed the way the
   * sprite collection files them: by the type's own name
   */
  ArceusBug = 1049301,
  ArceusDark = 1049302,
  ArceusDragon = 1049303,
  ArceusElectric = 1049304,
  ArceusFighting = 1049305,
  ArceusFire = 1049306,
  ArceusFlying = 1049307,
  ArceusGhost = 1049308,
  ArceusGrass = 1049309,
  ArceusGround = 1049310,
  ArceusIce = 1049311,
  ArceusPoison = 1049312,
  ArceusPsychic = 1049313,
  ArceusRock = 1049314,
  ArceusSteel = 1049315,
  ArceusWater = 1049316,
  ArceusFairy = 1049317,

  /** The shape a Shaymin opens into with the flower in its hands */
  ShayminSky = 1049201,

  /** The three cloaks, which are what a Burmy was met wearing */
  BurmySandy = 1041201,
  BurmyTrash = 1041202,
  WormadamSandy = 1041301,
  WormadamTrash = 1041302,

  /** The blossom a Cherrim opens into once the sun is out */
  CherrimSunshine = 1042101,

  /** The far shore's shell, met east of the meridian */
  ShellosEast = 1042201,
  GastrodonEast = 1042301,

  /**
   * Unova's forms, numbered the way the sprite collection numbers
   * them. A Mega and a Gigantamax are left out: neither is data this
   * game has yet
   */
  BasculinBlue = 1055001,
  BasculinWhite = 1055002,
  DarumakaGalar = 1055401,
  DarmanitanZen = 1055501,
  DarmanitanGalar = 1055502,
  DarmanitanGalarZen = 1055503,
  YamaskGalar = 1056201,
  ZoruaHisui = 1057001,
  ZoroarkHisui = 1057101,
  StunfiskGalar = 1061801,
  BraviaryHisui = 1062801,

  /** The four seasons a Deerling wears, and its stag with them */
  DeerlingSummer = 1058501,
  DeerlingAutumn = 1058502,
  DeerlingWinter = 1058503,
  SawsbuckSummer = 1058601,
  SawsbuckAutumn = 1058602,
  SawsbuckWinter = 1058603,

  /** The shapes the two the storms answer to take, and the third with them */
  TornadusTherian = 1064101,
  ThundurusTherian = 1064201,
  LandorusTherian = 1064501,

  /** What Kyurem becomes with one of the dragons inside it */
  KyuremBlack = 1064601,
  KyuremWhite = 1064602,

  /** The colt that draws the sword, and the singer that dances */
  KeldeoResolute = 1064701,
  MeloettaPirouette = 1064801,

  /** The four drives a Genesect is loaded with, one cassette apiece */
  GenesectDouse = 1064901,
  GenesectShock = 1064902,
  GenesectBurn = 1064903,
  GenesectChill = 1064904,

  /** The two Hisui draws differently, of the lines Unova started */
  SamurottHisui = 1050301,
  LilligantHisui = 1054901,
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

const UNOWN_LETTERS = (() => {
  const letters = new Map<Species, string>();

  for (const [at, species] of UNOWN_FORMS.entries()) {
    letters.set(species, at < 26 ? String.fromCharCode(65 + at) : UNOWN_MARKS[at - 26]);
  }
  return letters;
})();

/**
 * The character an unown is shaped like: a letter, and the two marks
 * that come after Z. Null for anything that is not an unown, which is
 * how a caller asks whether it is looking at one
 */
export function unownLetter(species: Species): string | null {
  return UNOWN_LETTERS.get(species) ?? null;
}

/**
 * A Burmy's three cloaks, the plant one first: unlike a Castform's
 * skies, these are met rather than worn, and the one it was met in is
 * the one it keeps
 */
export const BURMY_FORMS = [Species.Burmy, Species.BurmySandy, Species.BurmyTrash];

/** What each cloak grows into, in the same order */
export const WORMADAM_FORMS = [Species.Wormadam, Species.WormadamSandy, Species.WormadamTrash];

/** The two shells, the west one first, split by the world's own meridian */
export const SHELLOS_FORMS = [Species.Shellos, Species.ShellosEast];

export const GASTRODON_FORMS = [Species.Gastrodon, Species.GastrodonEast];

/** The two schools of Basculin, the red stripe first */
export const BASCULIN_FORMS = [Species.Basculin, Species.BasculinBlue];

/** Each genie's two shapes, the one it is usually met in first */
export const TORNADUS_FORMS = [Species.Tornadus, Species.TornadusTherian];
export const THUNDURUS_FORMS = [Species.Thundurus, Species.ThundurusTherian];
export const LANDORUS_FORMS = [Species.Landorus, Species.LandorusTherian];

/** Darmanitan standing and Darmanitan sat down, the standing one first */
export const DARMANITAN_FORMS = [Species.Darmanitan, Species.DarmanitanZen];

/** Cherrim shut and Cherrim open, the shut one first */
export const CHERRIM_FORMS = [Species.Cherrim, Species.CherrimSunshine];

/** Keldeo, and the shape it takes once it has learned Secret Sword */
export const KELDEO_FORMS = [Species.Keldeo, Species.KeldeoResolute];

/**
 * Castform's four shapes, its plain one first. Unlike an unown's,
 * these are not caught: Forecast puts the holder into whichever the
 * sky calls for, so only the first is ever spawned or stored
 */
export const CASTFORM_FORMS: Species[] = [
  Species.Castform,
  Species.CastformSunny,
  Species.CastformRainy,
  Species.CastformSnowy,
];

/**
 * Deoxys and the three shapes it rearranges itself into. Like a
 * Castform's skies they are worn rather than met: a Meteorite in its
 * hands is what moves it between them
 */
/** A creation trio member and the shape its own orb holds it in */
export const DIALGA_FORMS: Species[] = [Species.Dialga, Species.DialgaOrigin];
export const PALKIA_FORMS: Species[] = [Species.Palkia, Species.PalkiaOrigin];
export const GIRATINA_FORMS: Species[] = [Species.Giratina, Species.GiratinaOrigin];

/** Rotom and the five machines it gets into */
export const ROTOM_FORMS: Species[] = [
  Species.Rotom,
  Species.RotomHeat,
  Species.RotomWash,
  Species.RotomFrost,
  Species.RotomFan,
  Species.RotomMow,
];

/** Arceus and the seventeen shapes its Plates put it in */
export const ARCEUS_FORMS: Species[] = [
  Species.Arceus,
  Species.ArceusBug,
  Species.ArceusDark,
  Species.ArceusDragon,
  Species.ArceusElectric,
  Species.ArceusFighting,
  Species.ArceusFire,
  Species.ArceusFlying,
  Species.ArceusGhost,
  Species.ArceusGrass,
  Species.ArceusGround,
  Species.ArceusIce,
  Species.ArceusPoison,
  Species.ArceusPsychic,
  Species.ArceusRock,
  Species.ArceusSteel,
  Species.ArceusWater,
  Species.ArceusFairy,
];

/** Shaymin and the shape the Gracidea opens it into */
export const SHAYMIN_FORMS: Species[] = [Species.Shaymin, Species.ShayminSky];

/** The husk and the two shapes a dragon folded into it puts it in */
export const KYUREM_FORMS: Species[] = [Species.Kyurem, Species.KyuremBlack, Species.KyuremWhite];

export const DEOXYS_FORMS: Species[] = [
  Species.Deoxys,
  Species.DeoxysAttack,
  Species.DeoxysDefense,
  Species.DeoxysSpeed,
];
