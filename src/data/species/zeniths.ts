import { Stats } from '../constants/stats';
import { Types } from '../constants/types';
import Abilities from '../ids/abilities';
import { Items } from '../ids/items';
import { FORMS_PER_SPECIES, speciesDexNumber, speciesFormIndex } from '../ids/forms';
import { Species } from '../ids/species';
import { getSpeciesData, registerSpecies } from './__create';

/**
 * The Zeniths: this engine's own answer to a Mega, for a pokemon that
 * has none. A final stage holding its Zenith Shard fights at its peak,
 * 100 points above its own base stat total, wearing an ability it
 * cannot otherwise reach and sometimes a type it does not have.
 *
 * A pokemon with a Mega, or with a shape some other held item puts it
 * in, has no Zenith: one held transformation per pokemon. Like a Mega,
 * each is worn rather than met, and everything it does not change is
 * read off the pokemon it is a Zenith of, so these register after
 * every generation. The battle side is `src/battle/gimmicks/zenith.ts`.
 */

export interface ZenithShape {
  zenith: Species;
  base: Species;
  /** Who it is for, written out since items register apart from species */
  holder: string;
  /** HP, Attack, Defense, Special Attack, Special Defense, Speed */
  stats: [number, number, number, number, number, number];
  types: Types[];
  /** Worn on top of the catch's own, and never one the line can be born with */
  ability: Abilities;
  /** The shard held to reach it */
  shard: Items;
}

export const ZENITH_SHAPES: ZenithShape[] = [
  {
    // Its Confusion and Psybeam made a type, and a dancer of Quiver Dance
    zenith: Species.ButterfreeZenith,
    base: Species.Butterfree,
    holder: 'Butterfree',
    stats: [70, 45, 60, 125, 100, 95],
    types: [Types.Bug, Types.Psychic],
    ability: Abilities.Dancer,
    shard: Items.ButterfreeZenithShard,
  },
  {
    // The scout rat, quick to punish whatever just walked in
    zenith: Species.RaticateZenith,
    base: Species.Raticate,
    holder: 'Raticate',
    stats: [75, 111, 70, 50, 80, 127],
    types: [Types.Normal],
    ability: Abilities.Stakeout,
    shard: Items.RaticateZenithShard,
  },
  {
    // Drill Run's beak made a type, and luck to find the weak spot
    zenith: Species.FearowZenith,
    base: Species.Fearow,
    holder: 'Fearow',
    stats: [80, 120, 70, 61, 71, 140],
    types: [Types.Flying, Types.Ground],
    ability: Abilities.SuperLuck,
    shard: Items.FearowZenithShard,
  },
  {
    // The hood pattern made menace: no mercy for poisoned prey
    zenith: Species.ArbokZenith,
    base: Species.Arbok,
    holder: 'Arbok',
    stats: [80, 125, 79, 65, 89, 110],
    types: [Types.Poison, Types.Dark],
    ability: Abilities.Merciless,
    shard: Items.ArbokZenithShard,
  },
  {
    // Claws hardened into steel
    zenith: Species.SandslashZenith,
    base: Species.Sandslash,
    holder: 'Sandslash',
    stats: [85, 130, 130, 45, 75, 85],
    types: [Types.Ground, Types.Steel],
    ability: Abilities.ToughClaws,
    shard: Items.SandslashZenithShard,
  },
  {
    // Its spines scatter where it is struck
    zenith: Species.NidoqueenZenith,
    base: Species.Nidoqueen,
    holder: 'Nidoqueen',
    stats: [110, 102, 112, 85, 110, 86],
    types: [Types.Poison, Types.Ground],
    ability: Abilities.ToxicDebris,
    shard: Items.NidoqueenZenithShard,
  },
  {
    // The venom of its horn
    zenith: Species.NidokingZenith,
    base: Species.Nidoking,
    holder: 'Nidoking',
    stats: [91, 132, 87, 115, 85, 95],
    types: [Types.Poison, Types.Ground],
    ability: Abilities.ToxicChain,
    shard: Items.NidokingZenithShard,
  },
  {
    // The thousand-year curse of its legend
    zenith: Species.NinetalesZenith,
    base: Species.Ninetales,
    holder: 'Ninetales',
    stats: [83, 76, 85, 126, 115, 120],
    types: [Types.Fire, Types.Ghost],
    ability: Abilities.CursedBody,
    shard: Items.NinetalesZenithShard,
  },
  {
    // Its voice at full volume
    zenith: Species.WigglytuffZenith,
    base: Species.Wigglytuff,
    holder: 'Wigglytuff',
    stats: [150, 70, 75, 115, 80, 45],
    types: [Types.Normal, Types.Fairy],
    ability: Abilities.PunkRock,
    shard: Items.WigglytuffZenithShard,
  },
  {
    // Its pollen spreads when it is shaken
    zenith: Species.VileplumeZenith,
    base: Species.Vileplume,
    holder: 'Vileplume',
    stats: [85, 80, 105, 140, 115, 65],
    types: [Types.Grass, Types.Poison],
    ability: Abilities.SeedSower,
    shard: Items.VileplumeZenithShard,
  },
  {
    // The mushroom has wholly taken the host
    zenith: Species.ParasectZenith,
    base: Species.Parasect,
    holder: 'Parasect',
    stats: [80, 125, 100, 60, 100, 40],
    types: [Types.Bug, Types.Ghost],
    ability: Abilities.MyceliumMight,
    shard: Items.ParasectZenithShard,
  },
  {
    // Its wings beat faster as the fight goes on
    zenith: Species.VenomothZenith,
    base: Species.Venomoth,
    holder: 'Venomoth',
    stats: [80, 65, 70, 125, 90, 120],
    types: [Types.Bug, Types.Poison],
    ability: Abilities.SpeedBoost,
    shard: Items.VenomothZenithShard,
  },
  {
    // It digs under anything that would stop it
    zenith: Species.DugtrioZenith,
    base: Species.Dugtrio,
    holder: 'Dugtrio',
    stats: [55, 130, 70, 50, 80, 140],
    types: [Types.Ground],
    ability: Abilities.MoldBreaker,
    shard: Items.DugtrioZenithShard,
  },
  {
    // The haughty cat's tricks
    zenith: Species.PersianZenith,
    base: Species.Persian,
    holder: 'Persian',
    stats: [85, 100, 70, 80, 80, 125],
    types: [Types.Normal],
    ability: Abilities.Prankster,
    shard: Items.PersianZenithShard,
  },
  {
    // The gem on its brow awake
    zenith: Species.GolduckZenith,
    base: Species.Golduck,
    holder: 'Golduck',
    stats: [90, 82, 88, 130, 100, 110],
    types: [Types.Water, Types.Psychic],
    ability: Abilities.PsychicSurge,
    shard: Items.GolduckZenithShard,
  },
  {
    // The Legendary Pokemon of old scrolls, at last living up to it:
    // the speed of its legend, and the jaws of a guardian lion
    zenith: Species.ArcanineZenith,
    base: Species.Arcanine,
    holder: 'Arcanine',
    stats: [90, 130, 90, 110, 100, 135],
    types: [Types.Fire, Types.Dragon],
    ability: Abilities.StrongJaw,
    shard: Items.ArcanineZenithShard,
  },
  {
    // The swimmer's fists
    zenith: Species.PoliwrathZenith,
    base: Species.Poliwrath,
    holder: 'Poliwrath',
    stats: [110, 125, 105, 70, 100, 100],
    types: [Types.Water, Types.Fighting],
    ability: Abilities.IronFist,
    shard: Items.PoliwrathZenithShard,
  },
  {
    // Four arms and no fear of a Ghost
    zenith: Species.MachampZenith,
    base: Species.Machamp,
    holder: 'Machamp',
    stats: [100, 160, 90, 65, 95, 95],
    types: [Types.Fighting],
    ability: Abilities.Scrappy,
    shard: Items.MachampZenithShard,
  },
  {
    // A jellyfish regrows what it loses
    zenith: Species.TentacruelZenith,
    base: Species.Tentacruel,
    holder: 'Tentacruel',
    stats: [90, 70, 85, 110, 130, 130],
    types: [Types.Water, Types.Poison],
    ability: Abilities.Regenerator,
    shard: Items.TentacruelZenithShard,
  },
  {
    // A boulder that throws itself
    zenith: Species.GolemZenith,
    base: Species.Golem,
    holder: 'Golem',
    stats: [100, 150, 150, 55, 85, 55],
    types: [Types.Rock, Types.Ground],
    ability: Abilities.RockyPayload,
    shard: Items.GolemZenithShard,
  },
  {
    // A mane hot enough to bring out the sun
    zenith: Species.RapidashZenith,
    base: Species.Rapidash,
    holder: 'Rapidash',
    stats: [75, 130, 80, 85, 90, 140],
    types: [Types.Fire],
    ability: Abilities.Drought,
    shard: Items.RapidashZenithShard,
  },
  {
    // A master of its leek
    zenith: Species.FarfetchdZenith,
    base: Species.Farfetchd,
    holder: "Farfetch'd",
    stats: [72, 120, 70, 58, 72, 85],
    types: [Types.Normal, Types.Flying],
    ability: Abilities.Technician,
    shard: Items.FarfetchdZenithShard,
  },
  {
    // Three heads, three chances
    zenith: Species.DodrioZenith,
    base: Species.Dodrio,
    holder: 'Dodrio',
    stats: [80, 140, 80, 60, 70, 140],
    types: [Types.Normal, Types.Flying],
    ability: Abilities.SereneGrace,
    shard: Items.DodrioZenithShard,
  },
  {
    // It brings the snow its body thrives in
    zenith: Species.DewgongZenith,
    base: Species.Dewgong,
    holder: 'Dewgong',
    stats: [110, 70, 100, 100, 115, 80],
    types: [Types.Water, Types.Ice],
    ability: Abilities.SnowWarning,
    shard: Items.DewgongZenithShard,
  },
  {
    // Sludge that clings to whatever touches it
    zenith: Species.MukZenith,
    base: Species.Muk,
    holder: 'Muk',
    stats: [125, 125, 95, 65, 120, 70],
    types: [Types.Poison],
    ability: Abilities.Gooey,
    shard: Items.MukZenithShard,
  },
  {
    // The shell at last covers its weak side
    zenith: Species.CloysterZenith,
    base: Species.Cloyster,
    holder: 'Cloyster',
    stats: [70, 115, 180, 85, 85, 90],
    types: [Types.Water, Types.Ice],
    ability: Abilities.IceScales,
    shard: Items.CloysterZenithShard,
  },
  {
    // The pendulum never misses its mark
    zenith: Species.HypnoZenith,
    base: Species.Hypno,
    holder: 'Hypno',
    stats: [95, 73, 90, 110, 135, 80],
    types: [Types.Psychic],
    ability: Abilities.CompoundEyes,
    shard: Items.HypnoZenithShard,
  },
  {
    // One claw, all of its strength
    zenith: Species.KinglerZenith,
    base: Species.Kingler,
    holder: 'Kingler',
    stats: [75, 150, 120, 50, 80, 100],
    types: [Types.Water],
    ability: Abilities.Adaptability,
    shard: Items.KinglerZenithShard,
  },
  {
    // Everything it does is a discharge, Explosion included
    zenith: Species.ElectrodeZenith,
    base: Species.Electrode,
    holder: 'Electrode',
    stats: [80, 80, 80, 110, 90, 150],
    types: [Types.Electric],
    ability: Abilities.Galvanize,
    shard: Items.ElectrodeZenithShard,
  },
  {
    // A walking jungle
    zenith: Species.ExeggutorZenith,
    base: Species.Exeggutor,
    holder: 'Exeggutor',
    stats: [105, 105, 95, 150, 100, 75],
    types: [Types.Grass, Types.Psychic],
    ability: Abilities.GrassySurge,
    shard: Items.ExeggutorZenithShard,
  },
  {
    // The mother's bone, and the grudge of the one who lost her
    zenith: Species.MarowakZenith,
    base: Species.Marowak,
    holder: 'Marowak',
    stats: [80, 110, 120, 50, 95, 70],
    types: [Types.Ground, Types.Fighting],
    ability: Abilities.Mummy,
    shard: Items.MarowakZenithShard,
  },
  {
    // Legs that stretch past any guard
    zenith: Species.HitmonleeZenith,
    base: Species.Hitmonlee,
    holder: 'Hitmonlee',
    stats: [70, 150, 68, 35, 120, 112],
    types: [Types.Fighting],
    ability: Abilities.LongReach,
    shard: Items.HitmonleeZenithShard,
  },
  {
    // Elemental punches thrown for power alone
    zenith: Species.HitmonchanZenith,
    base: Species.Hitmonchan,
    holder: 'Hitmonchan',
    stats: [70, 135, 99, 35, 125, 91],
    types: [Types.Fighting],
    ability: Abilities.SheerForce,
    shard: Items.HitmonchanZenithShard,
  },
  {
    // A gas that eats through anything
    zenith: Species.WeezingZenith,
    base: Species.Weezing,
    holder: 'Weezing',
    stats: [85, 90, 130, 115, 100, 70],
    types: [Types.Poison],
    ability: Abilities.Corrosion,
    shard: Items.WeezingZenithShard,
  },
  {
    // The queen of the river, too dazzling to rush
    zenith: Species.SeakingZenith,
    base: Species.Seaking,
    holder: 'Seaking',
    stats: [90, 122, 85, 65, 90, 98],
    types: [Types.Water],
    ability: Abilities.Dazzling,
    shard: Items.SeakingZenithShard,
  },
  {
    // Invisible walls that blunt the worst of a hit
    zenith: Species.MrMimeZenith,
    base: Species.MrMime,
    holder: 'Mr. Mime',
    stats: [70, 45, 95, 125, 130, 95],
    types: [Types.Psychic, Types.Fairy],
    ability: Abilities.PrismArmor,
    shard: Items.MrMimeZenithShard,
  },
  {
    // The ice queen, whom nobody strikes first
    zenith: Species.JynxZenith,
    base: Species.Jynx,
    holder: 'Jynx',
    stats: [85, 50, 65, 140, 110, 105],
    types: [Types.Ice, Types.Psychic],
    ability: Abilities.QueenlyMajesty,
    shard: Items.JynxZenithShard,
  },
  {
    // It charges head first and feels nothing
    zenith: Species.TaurosZenith,
    base: Species.Tauros,
    holder: 'Tauros',
    stats: [95, 130, 105, 40, 90, 130],
    types: [Types.Normal],
    ability: Abilities.RockHead,
    shard: Items.TaurosZenithShard,
  },
  {
    // It sings across the sea
    zenith: Species.LaprasZenith,
    base: Species.Lapras,
    holder: 'Lapras',
    stats: [150, 85, 100, 120, 115, 65],
    types: [Types.Water, Types.Ice],
    ability: Abilities.LiquidVoice,
    shard: Items.LaprasZenithShard,
  },
  {
    // It melts into the water it fights in
    zenith: Species.VaporeonZenith,
    base: Species.Vaporeon,
    holder: 'Vaporeon',
    stats: [150, 65, 80, 140, 115, 75],
    types: [Types.Water],
    ability: Abilities.WaterBubble,
    shard: Items.VaporeonZenithShard,
  },
  {
    // Its static charges the ground
    zenith: Species.JolteonZenith,
    base: Species.Jolteon,
    holder: 'Jolteon',
    stats: [85, 65, 80, 140, 105, 150],
    types: [Types.Electric],
    ability: Abilities.ElectricSurge,
    shard: Items.JolteonZenithShard,
  },
  {
    // Its mane at its fullest
    zenith: Species.FlareonZenith,
    base: Species.Flareon,
    holder: 'Flareon',
    stats: [85, 150, 85, 95, 125, 85],
    types: [Types.Fire],
    ability: Abilities.Fluffy,
    shard: Items.FlareonZenithShard,
  },
  {
    // The ancient sea comes back with it
    zenith: Species.OmastarZenith,
    base: Species.Omastar,
    holder: 'Omastar',
    stats: [85, 60, 135, 140, 90, 85],
    types: [Types.Rock, Types.Water],
    ability: Abilities.Drizzle,
    shard: Items.OmastarZenithShard,
  },
  {
    // The hunter that grows bolder with each kill
    zenith: Species.KabutopsZenith,
    base: Species.Kabutops,
    holder: 'Kabutops',
    stats: [80, 145, 115, 65, 80, 110],
    types: [Types.Rock, Types.Water],
    ability: Abilities.Moxie,
    shard: Items.KabutopsZenithShard,
  },
  {
    // It fights in its sleep
    zenith: Species.SnorlaxZenith,
    base: Species.Snorlax,
    holder: 'Snorlax',
    stats: [180, 130, 85, 65, 130, 50],
    types: [Types.Normal],
    ability: Abilities.Comatose,
    shard: Items.SnorlaxZenithShard,
  },
  {
    // Feathers of ice that turn the first blow
    zenith: Species.ArticunoZenith,
    base: Species.Articuno,
    holder: 'Articuno',
    stats: [105, 85, 115, 130, 140, 105],
    types: [Types.Ice, Types.Flying],
    ability: Abilities.Multiscale,
    shard: Items.ArticunoZenithShard,
  },
  {
    // Lightning made flesh
    zenith: Species.ZapdosZenith,
    base: Species.Zapdos,
    holder: 'Zapdos',
    stats: [100, 90, 100, 150, 105, 135],
    types: [Types.Electric, Types.Flying],
    ability: Abilities.Transistor,
    shard: Items.ZapdosZenithShard,
  },
  {
    // The flame that never goes out
    zenith: Species.MoltresZenith,
    base: Species.Moltres,
    holder: 'Moltres',
    stats: [100, 100, 100, 155, 105, 120],
    types: [Types.Fire, Types.Flying],
    ability: Abilities.MagicGuard,
    shard: Items.MoltresZenithShard,
  },
  {
    // The ancestor reads every foe
    zenith: Species.MewZenith,
    base: Species.Mew,
    holder: 'Mew',
    stats: [115, 115, 115, 125, 115, 115],
    types: [Types.Psychic],
    ability: Abilities.Download,
    shard: Items.MewZenithShard,
  },
];

/**
 * The pokemon left without a Zenith although nothing else spoken for
 * them. Ditto's whole kit is becoming something else, and a Zenith
 * set on entry would undo the copy Imposter has just made
 */
export const NO_ZENITH = new Set<Species>([Species.Ditto]);

/** What marks an item id as a Zenith Shard */
export const ZENITH_SHARD_BAND = 2000000;

/**
 * The shard id a Zenith should have: the band, the dex number times
 * 100, and 01 for the species' own Zenith (slot 99), 02 for the next
 * one down, and so on
 */
export function zenithShardId(zenith: Species): number {
  return (
    ZENITH_SHARD_BAND +
    speciesDexNumber(zenith) * FORMS_PER_SPECIES +
    (FORMS_PER_SPECIES - speciesFormIndex(zenith))
  );
}

/** What a Zenith adds to the base stat total of the pokemon it is a Zenith of */
export const ZENITH_BONUS = 100;

const ZENITH_BASES = new Map<Species, Species>();
const ZENITH_OF = new Map<Species, ZenithShape>();

for (const shape of ZENITH_SHAPES) {
  ZENITH_BASES.set(shape.zenith, shape.base);
  ZENITH_OF.set(shape.base, shape);
}

/** Whether this is a Zenith rather than an ordinary pokemon */
export function isZenithSpecies(species: Species): boolean {
  return ZENITH_BASES.has(species);
}

/** The pokemon this Zenith is a Zenith of, or null for everything else */
export function getZenithBase(species: Species): Species | null {
  return ZENITH_BASES.get(species) ?? null;
}

/** The Zenith this pokemon reaches, or null for one that has none */
export function getZenithShape(base: Species): ZenithShape | null {
  return ZENITH_OF.get(base) ?? null;
}

/** Every Zenith there is, in the order the dex meets their pokemon */
export function listZeniths(): Species[] {
  return [...ZENITH_BASES.keys()];
}

/** Registered after every generation, since each one is read off the pokemon it is a Zenith of */
export default function registerZenithSpecies(): void {
  for (const shape of ZENITH_SHAPES) {
    const base = getSpeciesData(shape.base);
    const [hp, attack, defense, specialAttack, specialDefense, speed] = shape.stats;

    registerSpecies(shape.zenith, {
      ...base,
      name: `Zenith ${shape.holder}`,
      baseForm: false,
      worn: true,
      stats: {
        [Stats.HP]: hp,
        [Stats.Attack]: attack,
        [Stats.Defense]: defense,
        [Stats.SpecialAttack]: specialAttack,
        [Stats.SpecialDefense]: specialDefense,
        [Stats.Speed]: speed,
      },
      types: shape.types,
      abilities: [shape.ability],
      hiddenAbilities: [],
      // Put on in a fight rather than grown into, so it stands in no
      // line and nothing stages it
      evolvesFrom: undefined,
      evolvesInto: undefined,
      eggSpecies: undefined,
      biomes: [],
    });
  }
}
