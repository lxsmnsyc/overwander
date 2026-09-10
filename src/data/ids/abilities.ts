const enum Abilities {
  // Bulbasaur
  Overgrow = 0,
  Chlorophyll = 1,
  ThickFat = 2,
  // Charmander
  Blaze = 3,
  SolarPower = 4,
  ToughClaws = 5,
  Drought = 6,
  // Squirtle
  Torrent = 7,
  RainDish = 8,
  // Caterpie
  ShieldDust = 9,
  RunAway = 10,
  // Metapod
  ShedSkin = 11,
  // Butterfree
  CompoundEyes = 12,
  TintedLens = 13,
  // Beedrill
  Swarm = 14,
  Sniper = 15,
  // Pidgey
  KeenEye = 16,
  TangledFeet = 17,
  BigPecks = 18,
  // Rattata
  Guts = 19,
  Hustle = 20,
  // Ekans
  Intimidate = 21,
  Unnerve = 22,
  // Pikachu
  Static = 23,
  LightningRod = 24,
  // Sandshrew
  SandVeil = 25,
  SandRush = 26,
  // Nidoran
  PoisonPoint = 27,
  Rivalry = 28,
  SheerForce = 29,
  // Clefairy
  CuteCharm = 30,
  MagicGuard = 31,
  FriendGuard = 32,
  Unaware = 33,
  // Vulpix
  FlashFire = 34,
  // Jigglypuff
  Competitive = 35,
  Frisk = 36,
  // Zubat
  InnerFocus = 37,
  Infiltrator = 38,
  // Oddish
  Stench = 39,
  EffectSpore = 40,
  // Paras
  DrySkin = 41,
  Damp = 42,
  // Venonat
  WonderSkin = 43,
  // Diglett
  ArenaTrap = 44,
  SandForce = 45,
  // Meowth
  Pickup = 46,
  Technician = 47,
  Limber = 48,
  // Psyduck
  CloudNine = 49,
  SwiftSwim = 50,
  // Mankey
  VitalSpirit = 51,
  AngerPoint = 52,
  Defiant = 53,
  // Growlithe
  Justified = 54,
  // Poliwag
  WaterAbsorb = 55,
  // Abra
  Synchronize = 56,
  // Machop
  NoGuard = 57,
  Steadfast = 58,
  // Bellsprout
  Gluttony = 59,
  // Tentacool
  ClearBody = 60,
  LiquidOoze = 61,
  // Geodude
  RockHead = 62,
  Sturdy = 63,
  // Ponyta
  FlameBody = 64,
  // Slowpoke
  Oblivious = 65,
  OwnTempo = 66,
  Regenerator = 67,
  // Magnemite
  MagnetPull = 68,
  Analytic = 69,
  // Doduo
  EarlyBird = 70,
  // Seel
  Hydration = 71,
  IceBody = 72,
  // Grimer
  StickyHold = 73,
  PoisonTouch = 74,
  // Shellder
  ShellArmor = 75,
  SkillLink = 76,
  Overcoat = 77,
  // Gastly
  Levitate = 78,
  // Onix
  WeakArmor = 79,
  // Drowzee
  Insomnia = 80,
  Forewarn = 81,
  // Krabby
  HyperCutter = 82,
  // Voltorb
  Soundproof = 83,
  Aftermath = 84,
  // Exeggcute
  Harvest = 85,
  // Cubone
  BattleArmor = 86,
  // Tyrogue (Hitmonlee/Hitmonchan)
  Reckless = 87,
  Unburden = 88,
  IronFist = 89,
  // Koffing
  NeutralizingGas = 90,
  // Chansey
  NaturalCure = 91,
  SereneGrace = 92,
  Healer = 93,
  // Tangela
  LeafGuard = 94,
  // Kangaskhan
  Scrappy = 95,
  // Goldeen
  WaterVeil = 96,
  // Staryu
  Illuminate = 97,
  // MrMime
  Filter = 98,
  // Pinsir
  Moxie = 99,
  MoldBreaker = 100,
  // Magikarp
  Rattled = 101,
  // Ditto
  Imposter = 102,
  // Eevee
  Adaptability = 103,
  Anticipation = 104,
  // Jolteon
  VoltAbsorb = 105,
  QuickFeet = 106,
  // Porygon
  Trace = 107,
  Download = 108,
  // Aerodactyl
  Pressure = 109,
  // Snorlax
  Immunity = 110,
  // Articuno
  SnowCloak = 111,
  // Dratini
  MarvelScale = 112,
  // Dragonite
  Multiscale = 113,
  // Pidgeot
  GaleWings = 114,
  // Sandslash
  RoughSkin = 115,
  // Golem
  SolidRock = 116,
  // Gengar
  CursedBody = 117,
  // Dewgong
  SlushRush = 118,
  // Hypno
  BadDreams = 119,
  // Kabutops
  Sharpness = 120,
  // Aerodactyl
  StrongJaw = 121,
  // Articuno
  SnowWarning = 122,
  // Zapdos
  Drizzle = 123,
  // Mew
  Protean = 124,
  // Cyndaquil
  Berserk = 125,
  // Natu
  MagicBounce = 126,
  // Mareep
  Plus = 127,
  MotorDrive = 128,
  // Sunkern
  FlowerGift = 129,
  // Slugma
  MagmaArmor = 130,
  // Remoraid
  SuctionCups = 131,
  Moody = 132,
  // Phanpy
  Stamina = 133,
  /**
   * From here on an id is allocated in the order the ability is added
   * rather than by the dex number of the line that introduces it. The
   * ones above were renumbered once while they were hours old; an id
   * reaches a player's caught rows, so that cannot happen again
   */
  // Togepi
  SuperLuck = 134,
  // Shuckle
  Contrary = 135,
  // Corsola
  StormDrain = 136,
  // Skarmory
  MirrorArmor = 137,
  // Smeargle
  Prankster = 138,
  // Larvitar
  SandStream = 139,
  // Heracross
  SapSipper = 140,
  // Teddiursa
  HoneyGather = 141,
  // Marill
  HugePower = 142,
  // Yanma
  SpeedBoost = 143,
  // Sneasel
  Pickpocket = 144,
  // Wobbuffet
  ShadowTag = 145,
  Telepathy = 146,
  // Scizor
  LightMetal = 147,
  // Unown
  QueenlyMajesty = 148,
  Comatose = 149,
  // Shiftry
  WindRider = 150,
  // Slakoth
  Truant = 151,
  // Shroomish
  PoisonHeal = 152,
  // Shedinja
  WonderGuard = 153,
  // Skitty
  Normalize = 154,
  // Meditite
  PurePower = 155,
  // Electrike
  Minus = 156,
  // Aron
  HeavyMetal = 157,
  // Sableye
  Stall = 158,
  // Zangoose
  ToxicBoost = 159,
  // Plusle
  Battery = 160,
  // Torkoal
  WhiteSmoke = 161,
  // Kecleon
  ColorChange = 162,
  // Castform
  Forecast = 163,
  // Metagross
  Steelworker = 164,
  // Numel
  Simple = 165,
  // Rayquaza
  AirLock = 166,
  // Drifloon
  FlareBoost = 167,
  // Buneary
  Klutz = 168,
  // Bronzor
  Heatproof = 169,
  // Regigigas
  SlowStart = 170,
  // Arceus
  Multitype = 171,
  // Diglett
  TanglingHair = 172,
  // Meowth
  SteelySpirit = 173,
  // Geodude
  Galvanize = 174,
  // Ponyta
  PastelVeil = 175,
  // Slowpoke
  QuickDraw = 176,
  CuriousMedicine = 177,
  // Grimer
  PowerOfAlchemy = 178,
  // Kangaskhan
  ParentalBond = 179,
  // Pinsir
  Aerilate = 180,
  // Eevee
  Pixilate = 181,
  // Chikorita
  MegaSol = 182,
  // Totodile
  Dragonize = 183,
  // Pichu
  SurgeSurfer = 184,
  // Girafarig
  CudChew = 185,
  ArmorTail = 186,
  // Teddiursa
  MindsEye = 187,
  // Corsola
  PerishBody = 188,
  // Kyogre
  PrimordialSea = 189,
  // Groudon
  DesolateLand = 190,
  // Rayquaza
  DeltaStream = 191,
  // MimeJr
  ScreenCleaner = 192,
  // Riolu
  AuraGuard = 193,
  // Victini
  VictoryStar = 194,
  // Drilbur
  PiercingDrill = 195,
  // Darumaka
  ZenMode = 196,
  GorillaTactics = 197,
  // Yamask
  Mummy = 198,
  WanderingSpirit = 199,
  // Archen
  Defeatist = 200,
  // Zorua
  Illusion = 201,
  // Ferroseed
  IronBarbs = 202,
  // Tynamo
  Eelevate = 203,
  // Stunfisk
  Mimicry = 204,
  // Pawniard
  SupremeOverlord = 205,
  // Reshiram
  Turboblaze = 206,
  // Zekrom
  Teravolt = 207,
  // Chespin
  Bulletproof = 208,
  // Fennekin
  Magician = 209,
  // Froakie
  BattleBond = 210,
  // Bunnelby
  CheekPouch = 211,
  // Litleo
  FireMane = 212,
  // Flabebe
  FlowerVeil = 213,
  Symbiosis = 214,
  // Skiddo
  GrassPelt = 215,
  // Furfrou
  FurCoat = 216,
  // Honedge
  StanceChange = 217,
  // Spritzee
  AromaVeil = 218,
  // Swirlix
  SweetVeil = 219,
  // Clauncher
  MegaLauncher = 220,
  // Amaura
  Refrigerate = 221,
  // Goomy
  Gooey = 222,
  // Xerneas
  FairyAura = 223,
  // Yveltal
  DarkAura = 224,
  // Zygarde
  AuraBreak = 225,
  PowerConstruct = 226,
  // Rowlet
  LongReach = 227,
  // Popplio
  LiquidVoice = 228,
  // Yungoos
  Stakeout = 229,
  // Oricorio
  Dancer = 230,
  // Wishiwashi
  Schooling = 231,
  // Mareanie
  Merciless = 232,
  // Dewpider
  WaterBubble = 233,
  // Salandit
  Corrosion = 234,
  // Stufful
  Fluffy = 235,
  // Comfey
  Triage = 236,
  // Passimian
  Receiver = 237,
  // Wimpod
  WimpOut = 238,
  EmergencyExit = 239,
  // Sandygast
  WaterCompaction = 240,
  // Pyukumuku
  InnardsOut = 241,
  // TypeNull
  RksSystem = 242,
  // Minior
  ShieldsDown = 243,
  // Mimikyu
  Disguise = 244,
  // Bruxish
  Dazzling = 245,
  // TapuKoko
  ElectricSurge = 246,
  // TapuLele
  PsychicSurge = 247,
  // TapuBulu
  GrassySurge = 248,
  // TapuFini
  MistySurge = 249,
  // Cosmog
  FullMetalBody = 250,
  ShadowShield = 251,
  // Nihilego
  BeastBoost = 252,
  // Necrozma
  PrismArmor = 253,
  Neuroforce = 254,
  // Magearna
  SoulHeart = 255,
  // Scorbunny
  Libero = 256,
  // Gossifleur
  CottonDown = 257,
  // Yamper
  BallFetch = 258,
  // Rolycoly
  SteamEngine = 259,
  // Applin
  Ripen = 260,
  SupersweetSyrup = 261,
  // Silicobra
  SandSpit = 262,
  // Cramorant
  GulpMissile = 263,
  // Arrokuda
  PropellerTail = 264,
  // Toxel
  PunkRock = 265,
  // Snom
  IceScales = 266,
  // Stonjourner
  PowerSpot = 267,
  // Eiscue
  IceFace = 268,
  // Morpeko
  HungerSwitch = 269,
  // Duraludon
  Stalwart = 270,
  // Zacian
  IntrepidSword = 271,
  // Zamazenta
  DauntlessShield = 272,
  // Kubfu
  UnseenFist = 273,
  // Regieleki
  Transistor = 274,
  // Regidrago
  DragonsMaw = 275,
  // Glastrier
  ChillingNeigh = 276,
  // Spectrier
  GrimNeigh = 277,
  // Calyrex
  AsOneGlastrier = 278,
  AsOneSpectrier = 279,
  // Lechonk
  LingeringAroma = 280,
  // Fidough
  WellBakedBody = 281,
  // Smoliv
  SeedSower = 282,
  // Nacli
  PurifyingSalt = 283,
  // Tadbulb
  Electromorphosis = 284,
  // Wattrel
  WindPower = 285,
  // Maschiff
  GuardDog = 286,
  // Toedscool
  MyceliumMight = 287,
  // Klawf
  AngerShell = 288,
  // Capsakid
  SpicySpray = 289,
  // Flittle
  Opportunist = 290,
  // Bombirdier
  RockyPayload = 291,
  // Finizen
  ZeroToHero = 292,
  // Orthworm
  EarthEater = 293,
  // Glimmet
  ToxicDebris = 294,
  // Flamigo
  Costar = 295,
  // Tatsugiri
  Commander = 296,
  // GreatTusk
  Protosynthesis = 297,
  // IronTreads
  QuarkDrive = 298,
  // Frigibax
  ThermalExchange = 299,
  // Gimmighoul
  GoodAsGold = 300,
  // WoChien
  TabletsOfRuin = 301,
  // ChienPao
  SwordOfRuin = 302,
  // TingLu
  VesselOfRuin = 303,
  // ChiYu
  BeadsOfRuin = 304,
  // Koraidon
  OrichalcumPulse = 305,
  // Miraidon
  HadronEngine = 306,
  // Poltchageist
  Hospitality = 307,
  // Okidogi
  ToxicChain = 308,
  // Ogerpon
  EmbodyAspect = 309,
  // Terapagos
  TeraShift = 310,
  TeraShell = 311,
  TeraformZero = 312,
  // Pecharunt
  PoisonPuppeteer = 313,
  // Special (non-standard abilities outside the regular pool)
  Boss = 100001,
  Shadow = 100002,
  /**
   * What a shadow becomes when a Purifying Gem is spent on it. It does
   * nothing at all — no listener reads it — and that is the point: it
   * is the mark left where the Shadow ability was, so a pokemon that
   * came out of a shadow raid still says so after it has been put
   * right
   */
  Purified = 100003,
  /**
   * Signature (one per family, granted rather than rolled at birth).
   * They sit outside the pools walk, so a line's four ordinary
   * abilities stay four
   */
  VerdantField = 200001,
  EmberField = 200002,
  DelugeField = 200003,
  PowderBurst = 200004,
  TwinStinger = 200005,
  Slipstream = 200006,
  Nibble = 200007,
  Relentless = 200008,
  Squeeze = 200009,
  ChainLightning = 200010,
  CurlUp = 200011,
  QueensCourt = 200012,
  KingsCourt = 200013,
  WishingWell = 200014,
  NineTails = 200015,
  Lullaby = 200016,
  Bloodthirst = 200017,
  DeepRoots = 200018,
  FungalBloom = 200019,
  DustStorm = 200020,
  Undermine = 200021,
  Cutpurse = 200022,
  HeadacheBurst = 200023,
  BlindRage = 200024,
  ChaseDown = 200025,
  HypnoticSpiral = 200026,
  TeleportGuard = 200027,
  OverheadThrow = 200028,
  Digest = 200029,
  TentacleGrasp = 200030,
  SolidCore = 200031,
  Gallop = 200032,
  DelayedReaction = 200033,
  RepulsionField = 200034,
  LeekDuelist = 200035,
  SecondHead = 200036,
  SleekHide = 200037,
  CorrosiveOoze = 200038,
  SpikeShell = 200039,
  NightTerror = 200040,
  LivingTunnel = 200041,
  DreamFeast = 200042,
  HeavyPincer = 200043,
  Overload = 200044,
  Psyseed = 200045,
  MourningBone = 200046,
  SecondWind = 200047,
  TasteEverything = 200048,
  SmogScreen = 200049,
  Corkscrew = 200050,
  Cushioned = 200051,
  VineWeb = 200052,
  MothersShield = 200053,
  WhirlCurrent = 200054,
  Upstream = 200055,
  CoreReset = 200056,
  MimedBarrier = 200057,
  CleanCut = 200058,
  IcyCharm = 200059,
  StaticField = 200060,
  BlastFurnace = 200061,
  Snapjaw = 200062,
  Bullheaded = 200063,
  LateBloomer = 200064,
  SafePassage = 200065,
  Formless = 200066,
  LatentPotential = 200067,
  Rollback = 200068,
  HelixShell = 200069,
  DomeBlade = 200070,
  PredatorsDive = 200071,
  FullBelly = 200072,
  Frostwing = 200073,
  Stormwing = 200074,
  Emberwing = 200075,
  SereneStorm = 200076,
  GeneticApex = 200077,
  AncestralMemory = 200078,
  Sapmark = 200079,
  Embermark = 200080,
  Jawmark = 200081,
  Sentry = 200082,
  WatchfulRoost = 200083,
  Relay = 200084,
  SilkSnare = 200085,
  LanternLure = 200086,
  FairShare = 200087,
  Prophecy = 200088,
  LiveWire = 200089,
  Spillover = 200090,
  FalseWood = 200091,
  Updraft = 200092,
  Tailthrow = 200093,
  SunlitCharge = 200094,
  Resonance = 200095,
  ContagiousYawn = 200096,
  Magpie = 200097,
  SharedMisery = 200098,
  RuinousScript = 200099,
  Backlash = 200100,
  Ambidextrous = 200101,
  Shrapnel = 200102,
  HiddenDen = 200103,
  SandRider = 200104,
  Bully = 200105,
  LastBarb = 200106,
  Fermenter = 200107,
  Heave = 200108,
  SharpClaw = 200109,
  SweetPaw = 200110,
  MagmaTrail = 200111,
  Icebreaker = 200112,
  CoralBloom = 200113,
  Standoff = 200114,
  Delivery = 200115,
  Escort = 200116,
  Steelmolt = 200117,
  PackHowl = 200118,
  Momentum = 200119,
  MindFog = 200120,
  Palette = 200121,
  Cowbell = 200122,
  RisenThunder = 200123,
  RisenFlame = 200124,
  RisenTide = 200125,
  Tyrant = 200126,
  SilverAegis = 200127,
  RainbowRekindling = 200128,
  TimelineSplit = 200129,
  SapSurge = 200130,
  EmberSurge = 200131,
  SiltSurge = 200132,
  PackHunt = 200133,
  CrookedRun = 200134,
  Cocoon = 200135,
  WaterBloom = 200136,
  SunRoot = 200137,
  MigrantsWind = 200138,
  GullsGreed = 200139,
  Empath = 200140,
  SurfaceWalk = 200141,
  Mycelium = 200142,
  WideSwing = 200143,
  VanishingAct = 200144,
  EchoChamber = 200145,
  Shove = 200146,
  Magnetize = 200147,
  KittenPace = 200148,
  ShadowTax = 200149,
  JawClaim = 200150,
  OreHunger = 200151,
  MindOverBody = 200152,
  JoltStart = 200153,
  CheerOn = 200154,
  JeerAt = 200155,
  TailLight = 200156,
  LureScent = 200157,
  Perennial = 200158,
  Bottomless = 200159,
  FeedingFrenzy = 200160,
  Spout = 200161,
  MagmaVent = 200162,
  BodyHeat = 200163,
  StoredBounce = 200164,
  UniqueSpots = 200165,
  AntlionPit = 200166,
  PatientStalk = 200167,
  CloudStep = 200168,
  FeudClaws = 200169,
  DeepeningVenom = 200170,
  MoonPull = 200171,
  SunGlare = 200172,
  SiltBed = 200173,
  DirtyFighter = 200174,
  SpinBalance = 200175,
  RootHold = 200176,
  ClawRush = 200177,
  ScarredBeauty = 200178,
  WeatherWorn = 200179,
  BlendIn = 200180,
  MalicePool = 200181,
  SoulHarvest = 200182,
  FruitCrop = 200183,
  RingingHead = 200184,
  DoomMark = 200185,
  ColdSnap = 200186,
  Applause = 200187,
  PearlGuard = 200188,
  Unchanged = 200189,
  SharedHeart = 200190,
  SkullCharge = 200191,
  HiveMind = 200192,
  StoneSeal = 200193,
  FrostSeal = 200194,
  IronSeal = 200195,
  EonShield = 200196,
  EonLance = 200197,
  PrimalSea = 200198,
  PrimalLand = 200199,
  PrimalSky = 200200,
  SevenWishes = 200201,
  FormDrift = 200202,
  BarkBrace = 200203,
  CinderBrace = 200204,
  CrestBrace = 200205,
}

export default Abilities;
