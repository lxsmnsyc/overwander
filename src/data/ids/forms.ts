import { Species } from './species';

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

/** The three schools of Basculin, the red stripe first and Hisui's white last */
export const BASCULIN_FORMS = [Species.Basculin, Species.BasculinBlue, Species.BasculinWhite];

/** Each genie's two shapes, the one it is usually met in first */
export const TORNADUS_FORMS = [Species.Tornadus, Species.TornadusTherian];
export const THUNDURUS_FORMS = [Species.Thundurus, Species.ThundurusTherian];
export const LANDORUS_FORMS = [Species.Landorus, Species.LandorusTherian];

/** Vivillon and the seventeen countries' wings it comes out with */
export const VIVILLON_FORMS: Species[] = [
  Species.Vivillon,
  Species.VivillonIcySnow,
  Species.VivillonPolar,
  Species.VivillonTundra,
  Species.VivillonContinental,
  Species.VivillonGarden,
  Species.VivillonElegant,
  Species.VivillonModern,
  Species.VivillonMarine,
  Species.VivillonArchipelago,
  Species.VivillonHighPlains,
  Species.VivillonSandstorm,
  Species.VivillonRiver,
  Species.VivillonMonsoon,
  Species.VivillonSavannah,
  Species.VivillonSun,
  Species.VivillonOcean,
  Species.VivillonJungle,
  Species.VivillonFancy,
  Species.VivillonPokeBall,
];

/** Each deer's four coats, spring first, in the order the year turns */
/** The two Meowstic, the male first: what a cat's own Espurr grew into */
export const MEOWSTIC_FORMS: Species[] = [Species.Meowstic, Species.MeowsticFemale];

/** The two stances a royal sword takes, the shield first */
export const AEGISLASH_FORMS: Species[] = [Species.Aegislash, Species.AegislashBlade];

/** Each colour of flower, the red one first: what a Flabebe was met carrying */
export const FLABEBE_FORMS: Species[] = [
  Species.Flabebe,
  Species.FlabebeYellow,
  Species.FlabebeOrange,
  Species.FlabebeBlue,
  Species.FlabebeWhite,
];

/** The same colours grown, with the flower that never wilts at the end */
export const FLOETTE_FORMS: Species[] = [
  Species.Floette,
  Species.FloetteYellow,
  Species.FloetteOrange,
  Species.FloetteBlue,
  Species.FloetteWhite,
  Species.FloetteEternal,
];

export const FLORGES_FORMS: Species[] = [
  Species.Florges,
  Species.FlorgesYellow,
  Species.FlorgesOrange,
  Species.FlorgesBlue,
  Species.FlorgesWhite,
];

/** The two Hoopa, bound first: the rings in, then the rings out */
export const HOOPA_FORMS: Species[] = [Species.Hoopa, Species.HoopaUnbound];

/** What a Zygarde has gathered of itself, half first, then a tenth, then all */
export const ZYGARDE_FORMS: Species[] = [
  Species.Zygarde,
  Species.ZygardeTenPercent,
  Species.ZygardeComplete,
];

/** Each size a pumpkin comes in, the middling one first */
export const PUMPKABOO_FORMS: Species[] = [
  Species.Pumpkaboo,
  Species.PumpkabooSmall,
  Species.PumpkabooLarge,
  Species.PumpkabooSuper,
];

/** The same four sizes grown */
export const GOURGEIST_FORMS: Species[] = [
  Species.Gourgeist,
  Species.GourgeistSmall,
  Species.GourgeistLarge,
  Species.GourgeistSuper,
];

/** Each deer's four coats, spring first, in the order the year turns */
export const DEERLING_FORMS = [
  Species.Deerling,
  Species.DeerlingSummer,
  Species.DeerlingAutumn,
  Species.DeerlingWinter,
];

export const SAWSBUCK_FORMS = [
  Species.Sawsbuck,
  Species.SawsbuckSummer,
  Species.SawsbuckAutumn,
  Species.SawsbuckWinter,
];

/** The song and the step, the song first */
export const MELOETTA_FORMS = [Species.Meloetta, Species.MeloettaPirouette];

/** Genesect and the four shapes its Drives repaint it in */
export const GENESECT_FORMS = [
  Species.Genesect,
  Species.GenesectDouse,
  Species.GenesectShock,
  Species.GenesectBurn,
  Species.GenesectChill,
];

/** Darmanitan standing and Darmanitan sat down, the standing one first */
export const DARMANITAN_FORMS = [Species.Darmanitan, Species.DarmanitanZen];

/** Cherrim shut and Cherrim open, the shut one first */
export const CHERRIM_FORMS = [Species.Cherrim, Species.CherrimSunshine];

/** Pichu, and the spiky-eared one Celebi brought */
export const PICHU_FORMS = [Species.Pichu, Species.PichuSpikyEared];

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

/** The four dances an Oricorio takes on, Baile at the base */
export const ORICORIO_FORMS: Species[] = [
  Species.Oricorio,
  Species.OricorioPomPom,
  Species.OricorioPau,
  Species.OricorioSensu,
];

/** The three hours a Lycanroc can grow up at, Midday at the base */
export const LYCANROC_FORMS: Species[] = [
  Species.Lycanroc,
  Species.LycanrocMidnight,
  Species.LycanrocDusk,
];

/** The Alolan forms written so far, each a variant of the Kanto species it is named after */
export const ALOLAN_FORMS: Species[] = [
  Species.RattataAlola,
  Species.RaticateAlola,
  Species.RaichuAlola,
  Species.SandshrewAlola,
  Species.SandslashAlola,
  Species.VulpixAlola,
  Species.NinetalesAlola,
  Species.DiglettAlola,
  Species.DugtrioAlola,
  Species.MeowthAlola,
  Species.PersianAlola,
  Species.GeodudeAlola,
  Species.GravelerAlola,
  Species.GolemAlola,
  Species.GrimerAlola,
  Species.MukAlola,
  Species.ExeggutorAlola,
  Species.MarowakAlola,
];

/**
 * The Galarian forms, each a variant of the older species it is named
 * after. They belong to Galar whichever dex number they share
 */
export const GALARIAN_FORMS: Species[] = [
  Species.MeowthGalar,
  Species.PonytaGalar,
  Species.RapidashGalar,
  Species.SlowpokeGalar,
  Species.SlowbroGalar,
  Species.FarfetchdGalar,
  Species.WeezingGalar,
  Species.MrMimeGalar,
  Species.ArticunoGalar,
  Species.ZapdosGalar,
  Species.MoltresGalar,
  Species.SlowkingGalar,
  Species.CorsolaGalar,
  Species.ZigzagoonGalar,
  Species.LinooneGalar,
  Species.DarumakaGalar,
  Species.DarmanitanGalar,
  Species.DarmanitanGalarZen,
  Species.YamaskGalar,
  Species.StunfiskGalar,
];

/** The Hisuian forms, the same way */
export const HISUIAN_FORMS: Species[] = [
  Species.GrowlitheHisui,
  Species.ArcanineHisui,
  Species.VoltorbHisui,
  Species.ElectrodeHisui,
  Species.TyphlosionHisui,
  Species.QwilfishHisui,
  Species.SneaselHisui,
  Species.SamurottHisui,
  Species.LilligantHisui,
  Species.ZoruaHisui,
  Species.ZoroarkHisui,
  Species.BraviaryHisui,
  Species.SliggooHisui,
  Species.GoodraHisui,
  Species.AvaluggHisui,
  Species.DecidueyeHisui,
];

/**
 * The Paldean forms, the same way. Bloodmoon Ursaluna is not one: the
 * collection files it beside Ursaluna, under Hisui
 */
export const PALDEAN_FORMS: Species[] = [
  Species.TaurosPaldeaCombat,
  Species.TaurosPaldeaBlaze,
  Species.TaurosPaldeaAqua,
  Species.WooperPaldea,
];

/** A Maushold's family of four, and the one in a hundred that is three */
export const MAUSHOLD_FORMS: Species[] = [Species.Maushold, Species.MausholdThree];

/** The two Oinkologne, the male first */
export const OINKOLOGNE_FORMS: Species[] = [Species.Oinkologne, Species.OinkologneFemale];

/** A Dudunsparce's two segments, and the one in a hundred with three */
export const DUDUNSPARCE_FORMS: Species[] = [Species.Dudunsparce, Species.DudunsparceThree];

/** The fake teas at the base and the true antiques, Sinistea's line then Poltchageist's */
export const TEA_FORMS: Species[] = [
  Species.SinisteaAntique,
  Species.PolteageistAntique,
  Species.PoltchageistArtisan,
  Species.SinistchaMasterpiece,
];

/** A Palafin, and the hero it comes back as once it has left the field */
export const PALAFIN_FORMS: Species[] = [Species.Palafin, Species.PalafinHero];

/** The three shapes a Tatsugiri is met in, Curly at the base */
export const TATSUGIRI_FORMS: Species[] = [
  Species.Tatsugiri,
  Species.TatsugiriStretchy,
  Species.TatsugiriDroopy,
];

/** Ogerpon in each of its masks, the Teal at the base, then each mask Terastallized */
export const OGERPON_FORMS: Species[] = [
  Species.Ogerpon,
  Species.OgerponWellspring,
  Species.OgerponHearthflame,
  Species.OgerponCornerstone,
  Species.OgerponTealTera,
  Species.OgerponWellspringTera,
  Species.OgerponHearthflameTera,
  Species.OgerponCornerstoneTera,
];

/** A Terapagos, and the Terastal shape its Tera Shift takes */
export const TERAPAGOS_FORMS: Species[] = [Species.Terapagos, Species.TerapagosTerastal];

/** A Cramorant, and what it comes back up with after a dive: the small catch, then the big one */
export const CRAMORANT_FORMS: Species[] = [
  Species.Cramorant,
  Species.CramorantGulping,
  Species.CramorantGorging,
];

/** The two keys a Toxtricity is born into by its nature, Amped at the base */
export const TOXTRICITY_FORMS: Species[] = [Species.Toxtricity, Species.ToxtricityLowKey];

/** Alcremie's seven Sweets on Vanilla Cream, Strawberry at the base */
export const ALCREMIE_FORMS: Species[] = [
  Species.Alcremie,
  Species.AlcremieBerry,
  Species.AlcremieLove,
  Species.AlcremieStar,
  Species.AlcremieClover,
  Species.AlcremieFlower,
  Species.AlcremieRibbon,
];

/** An Eiscue with its ice, and the face it is left with once the ice breaks */
export const EISCUE_FORMS: Species[] = [Species.Eiscue, Species.EiscueNoice];

/** The two Indeedee, the male first */
export const INDEEDEE_FORMS: Species[] = [Species.Indeedee, Species.IndeedeeFemale];

/** A Morpeko full, and the hungry mood it swings into */
export const MORPEKO_FORMS: Species[] = [Species.Morpeko, Species.MorpekoHangry];

/** Zacian, and the crowned shape it takes up the Rusted Sword in */
export const ZACIAN_FORMS: Species[] = [Species.Zacian, Species.ZacianCrowned];

/** Zamazenta, and the crowned shape it takes up the Rusted Shield in */
export const ZAMAZENTA_FORMS: Species[] = [Species.Zamazenta, Species.ZamazentaCrowned];

/** The two styles an Urshifu fights in, Single Strike at the base */
export const URSHIFU_FORMS: Species[] = [Species.Urshifu, Species.UrshifuRapidStrike];

/** The two Basculegion, the male first */
export const BASCULEGION_FORMS: Species[] = [Species.Basculegion, Species.BasculegionFemale];

/** Enamorus, and the Therian shape the Reveal Glass shows */
export const ENAMORUS_FORMS: Species[] = [Species.Enamorus, Species.EnamorusTherian];

/** Calyrex alone, then astride Glastrier or Spectrier */
export const CALYREX_FORMS: Species[] = [
  Species.Calyrex,
  Species.CalyrexIce,
  Species.CalyrexShadow,
];

/** A Wishiwashi alone, and the school it calls together from level 20 */
export const WISHIWASHI_FORMS: Species[] = [Species.Wishiwashi, Species.WishiwashiSchool];

/** Silvally, and the seventeen types a Memory sets it to, in the Memories' order */
export const SILVALLY_FORMS: Species[] = [
  Species.Silvally,
  Species.SilvallyFighting,
  Species.SilvallyFlying,
  Species.SilvallyPoison,
  Species.SilvallyGround,
  Species.SilvallyRock,
  Species.SilvallyBug,
  Species.SilvallyGhost,
  Species.SilvallySteel,
  Species.SilvallyFire,
  Species.SilvallyWater,
  Species.SilvallyGrass,
  Species.SilvallyElectric,
  Species.SilvallyPsychic,
  Species.SilvallyIce,
  Species.SilvallyDragon,
  Species.SilvallyDark,
  Species.SilvallyFairy,
];

/** Mimikyu under its rag, and the rag once a blow has broken it */
export const MIMIKYU_FORMS: Species[] = [Species.Mimikyu, Species.MimikyuBusted];

/** Minior in its shell, and the seven cores Shields Down can crack it open to */
export const MINIOR_FORMS: Species[] = [
  Species.Minior,
  Species.MiniorRed,
  Species.MiniorOrange,
  Species.MiniorYellow,
  Species.MiniorGreen,
  Species.MiniorBlue,
  Species.MiniorIndigo,
  Species.MiniorViolet,
];

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

/** Magearna as it is met, then in the colours it was first painted in */
export const MAGEARNA_FORMS: Species[] = [Species.Magearna, Species.MagearnaOriginal];

/** Necrozma alone, with the sun or the moon inside it, and its light let out */
export const NECROZMA_FORMS: Species[] = [
  Species.Necrozma,
  Species.NecrozmaDuskMane,
  Species.NecrozmaDawnWings,
  Species.NecrozmaUltra,
];

export const DEOXYS_FORMS: Species[] = [
  Species.Deoxys,
  Species.DeoxysAttack,
  Species.DeoxysDefense,
  Species.DeoxysSpeed,
];
