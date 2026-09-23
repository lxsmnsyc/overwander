import { Stats } from '../constants/stats';
import { Types } from '../constants/types';
import Abilities from '../ids/abilities';
import { Species } from '../ids/species';
import { getSpeciesData, registerSpecies } from './__create';

/**
 * The Megas: the shape a pokemon holding its Mega Stone takes in a
 * fight. Each is worn rather than met, so it is never spawned, caught
 * or bred, and the dex fills it in the day its own pokemon is met.
 *
 * Everything a Mega does not change is read off the pokemon it is a
 * Mega of, which is why these are registered after every generation.
 * The battle side is `src/battle/items/megas.ts`.
 */

interface MegaShape {
  mega: Species;
  base: Species;
  name: string;
  /** HP, Attack, Defense, Special Attack, Special Defense, Speed */
  stats: [number, number, number, number, number, number];
  types: Types[];
  /** The mainline's, worn on top of the catch's own unless a filler stands in */
  ability: Abilities;
  height: number;
  weight: number;
}

const MEGA_SHAPES: MegaShape[] = [
  {
    mega: Species.VenusaurMega,
    base: Species.Venusaur,
    name: 'Mega Venusaur',
    stats: [80, 100, 123, 122, 120, 80],
    types: [Types.Grass, Types.Poison],
    ability: Abilities.ThickFat,
    height: 2.4,
    weight: 155.5,
  },
  {
    mega: Species.CharizardMegaX,
    base: Species.Charizard,
    name: 'Mega Charizard X',
    stats: [78, 130, 111, 130, 85, 100],
    types: [Types.Fire, Types.Dragon],
    ability: Abilities.ToughClaws,
    height: 1.7,
    weight: 110.5,
  },
  {
    mega: Species.CharizardMegaY,
    base: Species.Charizard,
    name: 'Mega Charizard Y',
    stats: [78, 104, 78, 159, 115, 100],
    types: [Types.Fire, Types.Flying],
    ability: Abilities.Drought,
    height: 1.7,
    weight: 100.5,
  },
  {
    mega: Species.BlastoiseMega,
    base: Species.Blastoise,
    name: 'Mega Blastoise',
    stats: [79, 103, 120, 135, 115, 78],
    types: [Types.Water],
    ability: Abilities.MegaLauncher,
    height: 1.6,
    weight: 101.1,
  },
  {
    mega: Species.BeedrillMega,
    base: Species.Beedrill,
    name: 'Mega Beedrill',
    stats: [65, 150, 40, 15, 80, 145],
    types: [Types.Bug, Types.Poison],
    ability: Abilities.Adaptability,
    height: 1.4,
    weight: 40.5,
  },
  {
    mega: Species.PidgeotMega,
    base: Species.Pidgeot,
    name: 'Mega Pidgeot',
    stats: [83, 80, 80, 135, 80, 121],
    types: [Types.Normal, Types.Flying],
    ability: Abilities.NoGuard,
    height: 2.2,
    weight: 50.5,
  },
  {
    mega: Species.AlakazamMega,
    base: Species.Alakazam,
    name: 'Mega Alakazam',
    stats: [55, 50, 65, 175, 105, 150],
    types: [Types.Psychic],
    ability: Abilities.Trace,
    height: 1.2,
    weight: 48.0,
  },
  {
    mega: Species.SlowbroMega,
    base: Species.Slowbro,
    name: 'Mega Slowbro',
    stats: [95, 75, 180, 130, 80, 30],
    types: [Types.Water, Types.Psychic],
    ability: Abilities.ShellArmor,
    height: 2.0,
    weight: 120.0,
  },
  {
    mega: Species.GengarMega,
    base: Species.Gengar,
    name: 'Mega Gengar',
    stats: [60, 65, 80, 170, 95, 130],
    types: [Types.Ghost, Types.Poison],
    ability: Abilities.ShadowTag,
    height: 1.4,
    weight: 40.5,
  },
  {
    mega: Species.KangaskhanMega,
    base: Species.Kangaskhan,
    name: 'Mega Kangaskhan',
    stats: [105, 125, 100, 60, 100, 100],
    types: [Types.Normal],
    ability: Abilities.ParentalBond,
    height: 2.2,
    weight: 100.0,
  },
  {
    mega: Species.PinsirMega,
    base: Species.Pinsir,
    name: 'Mega Pinsir',
    stats: [65, 155, 120, 65, 90, 105],
    types: [Types.Bug, Types.Flying],
    ability: Abilities.Aerilate,
    height: 1.7,
    weight: 59.0,
  },
  {
    mega: Species.GyaradosMega,
    base: Species.Gyarados,
    name: 'Mega Gyarados',
    stats: [95, 155, 109, 70, 130, 81],
    types: [Types.Water, Types.Dark],
    ability: Abilities.MoldBreaker,
    height: 6.5,
    weight: 305.0,
  },
  {
    mega: Species.AerodactylMega,
    base: Species.Aerodactyl,
    name: 'Mega Aerodactyl',
    stats: [80, 135, 85, 70, 95, 150],
    types: [Types.Rock, Types.Flying],
    ability: Abilities.ToughClaws,
    height: 2.1,
    weight: 79.0,
  },
  {
    mega: Species.MewtwoMegaX,
    base: Species.Mewtwo,
    name: 'Mega Mewtwo X',
    stats: [106, 190, 100, 154, 100, 130],
    types: [Types.Psychic, Types.Fighting],
    ability: Abilities.Steadfast,
    height: 2.3,
    weight: 127.0,
  },
  {
    mega: Species.MewtwoMegaY,
    base: Species.Mewtwo,
    name: 'Mega Mewtwo Y',
    stats: [106, 150, 70, 194, 120, 140],
    types: [Types.Psychic],
    ability: Abilities.Insomnia,
    height: 1.5,
    weight: 33.0,
  },
  {
    mega: Species.AmpharosMega,
    base: Species.Ampharos,
    name: 'Mega Ampharos',
    stats: [90, 95, 105, 165, 110, 45],
    types: [Types.Electric, Types.Dragon],
    ability: Abilities.MoldBreaker,
    height: 1.4,
    weight: 61.5,
  },
  {
    mega: Species.SteelixMega,
    base: Species.Steelix,
    name: 'Mega Steelix',
    stats: [75, 125, 230, 55, 95, 30],
    types: [Types.Steel, Types.Ground],
    ability: Abilities.SandForce,
    height: 10.5,
    weight: 740.0,
  },
  {
    mega: Species.ScizorMega,
    base: Species.Scizor,
    name: 'Mega Scizor',
    stats: [70, 150, 140, 65, 100, 75],
    types: [Types.Bug, Types.Steel],
    ability: Abilities.Technician,
    height: 2.0,
    weight: 125.0,
  },
  {
    mega: Species.HeracrossMega,
    base: Species.Heracross,
    name: 'Mega Heracross',
    stats: [80, 185, 115, 40, 105, 75],
    types: [Types.Bug, Types.Fighting],
    ability: Abilities.SkillLink,
    height: 1.7,
    weight: 62.5,
  },
  {
    mega: Species.HoundoomMega,
    base: Species.Houndoom,
    name: 'Mega Houndoom',
    stats: [75, 90, 90, 140, 90, 115],
    types: [Types.Dark, Types.Fire],
    ability: Abilities.SolarPower,
    height: 1.9,
    weight: 49.5,
  },
  {
    mega: Species.TyranitarMega,
    base: Species.Tyranitar,
    name: 'Mega Tyranitar',
    stats: [100, 164, 150, 95, 120, 71],
    types: [Types.Rock, Types.Dark],
    ability: Abilities.SandStream,
    height: 2.5,
    weight: 255.0,
  },
  {
    mega: Species.SceptileMega,
    base: Species.Sceptile,
    name: 'Mega Sceptile',
    stats: [70, 110, 75, 145, 85, 145],
    types: [Types.Grass, Types.Dragon],
    ability: Abilities.LightningRod,
    height: 1.9,
    weight: 55.2,
  },
  {
    mega: Species.BlazikenMega,
    base: Species.Blaziken,
    name: 'Mega Blaziken',
    stats: [80, 160, 80, 130, 80, 100],
    types: [Types.Fire, Types.Fighting],
    ability: Abilities.SpeedBoost,
    height: 1.9,
    weight: 52.0,
  },
  {
    mega: Species.SwampertMega,
    base: Species.Swampert,
    name: 'Mega Swampert',
    stats: [100, 150, 110, 95, 110, 70],
    types: [Types.Water, Types.Ground],
    ability: Abilities.SwiftSwim,
    height: 1.9,
    weight: 102.0,
  },
  {
    mega: Species.GardevoirMega,
    base: Species.Gardevoir,
    name: 'Mega Gardevoir',
    stats: [68, 85, 65, 165, 135, 100],
    types: [Types.Psychic, Types.Fairy],
    ability: Abilities.Pixilate,
    height: 1.6,
    weight: 48.4,
  },
  {
    mega: Species.SableyeMega,
    base: Species.Sableye,
    name: 'Mega Sableye',
    stats: [50, 85, 125, 85, 115, 20],
    types: [Types.Dark, Types.Ghost],
    ability: Abilities.MagicBounce,
    height: 0.5,
    weight: 161.0,
  },
  {
    mega: Species.MawileMega,
    base: Species.Mawile,
    name: 'Mega Mawile',
    stats: [50, 105, 125, 55, 95, 50],
    types: [Types.Steel, Types.Fairy],
    ability: Abilities.HugePower,
    height: 1.0,
    weight: 23.5,
  },
  {
    mega: Species.AggronMega,
    base: Species.Aggron,
    name: 'Mega Aggron',
    stats: [70, 140, 230, 60, 80, 50],
    types: [Types.Steel],
    ability: Abilities.Filter,
    height: 2.2,
    weight: 395.0,
  },
  {
    mega: Species.MedichamMega,
    base: Species.Medicham,
    name: 'Mega Medicham',
    stats: [60, 100, 85, 80, 85, 100],
    types: [Types.Fighting, Types.Psychic],
    ability: Abilities.PurePower,
    height: 1.3,
    weight: 31.5,
  },
  {
    mega: Species.ManectricMega,
    base: Species.Manectric,
    name: 'Mega Manectric',
    stats: [70, 75, 80, 135, 80, 135],
    types: [Types.Electric],
    ability: Abilities.Intimidate,
    height: 1.8,
    weight: 44.0,
  },
  {
    mega: Species.SharpedoMega,
    base: Species.Sharpedo,
    name: 'Mega Sharpedo',
    stats: [70, 140, 70, 110, 65, 105],
    types: [Types.Water, Types.Dark],
    ability: Abilities.StrongJaw,
    height: 2.5,
    weight: 130.3,
  },
  {
    mega: Species.CameruptMega,
    base: Species.Camerupt,
    name: 'Mega Camerupt',
    stats: [70, 120, 100, 145, 105, 20],
    types: [Types.Fire, Types.Ground],
    ability: Abilities.SheerForce,
    height: 2.5,
    weight: 320.5,
  },
  {
    mega: Species.AltariaMega,
    base: Species.Altaria,
    name: 'Mega Altaria',
    stats: [75, 110, 110, 110, 105, 80],
    types: [Types.Dragon, Types.Fairy],
    ability: Abilities.Pixilate,
    height: 1.5,
    weight: 20.6,
  },
  {
    mega: Species.BanetteMega,
    base: Species.Banette,
    name: 'Mega Banette',
    stats: [64, 165, 75, 93, 83, 75],
    types: [Types.Ghost],
    ability: Abilities.Prankster,
    height: 1.2,
    weight: 13.0,
  },
  {
    mega: Species.AbsolMega,
    base: Species.Absol,
    name: 'Mega Absol',
    stats: [65, 150, 60, 115, 60, 115],
    types: [Types.Dark],
    ability: Abilities.MagicBounce,
    height: 1.2,
    weight: 49.0,
  },
  {
    mega: Species.GlalieMega,
    base: Species.Glalie,
    name: 'Mega Glalie',
    stats: [80, 120, 80, 120, 80, 100],
    types: [Types.Ice],
    ability: Abilities.Refrigerate,
    height: 2.1,
    weight: 350.2,
  },
  {
    mega: Species.SalamenceMega,
    base: Species.Salamence,
    name: 'Mega Salamence',
    stats: [95, 145, 130, 120, 90, 120],
    types: [Types.Dragon, Types.Flying],
    ability: Abilities.Aerilate,
    height: 1.8,
    weight: 112.6,
  },
  {
    mega: Species.MetagrossMega,
    base: Species.Metagross,
    name: 'Mega Metagross',
    stats: [80, 145, 150, 105, 110, 110],
    types: [Types.Steel, Types.Psychic],
    ability: Abilities.ToughClaws,
    height: 2.5,
    weight: 942.9,
  },
  {
    mega: Species.LatiasMega,
    base: Species.Latias,
    name: 'Mega Latias',
    stats: [80, 100, 120, 140, 150, 110],
    types: [Types.Dragon, Types.Psychic],
    ability: Abilities.Levitate,
    height: 1.8,
    weight: 52.0,
  },
  {
    mega: Species.LatiosMega,
    base: Species.Latios,
    name: 'Mega Latios',
    stats: [80, 130, 100, 160, 120, 110],
    types: [Types.Dragon, Types.Psychic],
    ability: Abilities.Levitate,
    height: 2.3,
    weight: 70.0,
  },
  {
    mega: Species.RayquazaMega,
    base: Species.Rayquaza,
    name: 'Mega Rayquaza',
    stats: [105, 180, 100, 180, 100, 115],
    types: [Types.Dragon, Types.Flying],
    ability: Abilities.DeltaStream,
    height: 10.8,
    weight: 392.0,
  },
  {
    mega: Species.LopunnyMega,
    base: Species.Lopunny,
    name: 'Mega Lopunny',
    stats: [65, 136, 94, 54, 96, 135],
    types: [Types.Normal, Types.Fighting],
    ability: Abilities.Scrappy,
    height: 1.3,
    weight: 28.3,
  },
  {
    mega: Species.GarchompMega,
    base: Species.Garchomp,
    name: 'Mega Garchomp',
    stats: [108, 170, 115, 120, 95, 92],
    types: [Types.Dragon, Types.Ground],
    ability: Abilities.SandForce,
    height: 1.9,
    weight: 95.0,
  },
  {
    mega: Species.LucarioMega,
    base: Species.Lucario,
    name: 'Mega Lucario',
    stats: [70, 145, 88, 140, 70, 112],
    types: [Types.Fighting, Types.Steel],
    ability: Abilities.Adaptability,
    height: 1.3,
    weight: 57.5,
  },
  {
    mega: Species.AbomasnowMega,
    base: Species.Abomasnow,
    name: 'Mega Abomasnow',
    stats: [90, 132, 105, 132, 105, 30],
    types: [Types.Grass, Types.Ice],
    ability: Abilities.SnowWarning,
    height: 2.7,
    weight: 185.0,
  },
  {
    mega: Species.GalladeMega,
    base: Species.Gallade,
    name: 'Mega Gallade',
    stats: [68, 165, 95, 65, 115, 110],
    types: [Types.Psychic, Types.Fighting],
    ability: Abilities.InnerFocus,
    height: 1.6,
    weight: 56.4,
  },
  {
    mega: Species.AudinoMega,
    base: Species.Audino,
    name: 'Mega Audino',
    stats: [103, 60, 126, 80, 126, 50],
    types: [Types.Normal, Types.Fairy],
    ability: Abilities.Healer,
    height: 1.5,
    weight: 32.0,
  },
  {
    mega: Species.DiancieMega,
    base: Species.Diancie,
    name: 'Mega Diancie',
    stats: [50, 160, 110, 160, 110, 110],
    types: [Types.Rock, Types.Fairy],
    ability: Abilities.MagicBounce,
    height: 1.1,
    weight: 27.8,
  },
];

/**
 * Where the line already reaches the mainline's ability, wearing it
 * would add nothing, so the Mega wears one the line does not have
 */
const FILLERS = new Map<Species, Abilities>([
  [Species.ScizorMega, Abilities.ToughClaws],
  [Species.TyranitarMega, Abilities.SandForce],
  [Species.BlazikenMega, Abilities.Reckless],
  [Species.MedichamMega, Abilities.IronFist],
  [Species.LatiasMega, Abilities.FriendGuard],
  [Species.LatiosMega, Abilities.TintedLens],
  [Species.AbomasnowMega, Abilities.ThickFat],
  [Species.AudinoMega, Abilities.Triage],
  [Species.DiancieMega, Abilities.QueenlyMajesty],
]);

/** Each Mega and the pokemon it is a Mega of */
const MEGA_BASES = new Map<Species, Species>();

for (const shape of MEGA_SHAPES) {
  MEGA_BASES.set(shape.mega, shape.base);
}

/** Whether this is a Mega rather than an ordinary pokemon */
export function isMegaSpecies(species: Species): boolean {
  return MEGA_BASES.has(species);
}

/** The pokemon this Mega is a Mega of, or null for everything else */
export function getMegaBase(species: Species): Species | null {
  return MEGA_BASES.get(species) ?? null;
}

/** Every Mega there is, in the order the dex meets their pokemon */
export function listMegas(): Species[] {
  return [...MEGA_BASES.keys()];
}

/** Registered after every generation, since each one is read off the pokemon it is a Mega of */
export default function registerMegaSpecies(): void {
  for (const shape of MEGA_SHAPES) {
    const base = getSpeciesData(shape.base);
    const [hp, attack, defense, specialAttack, specialDefense, speed] = shape.stats;

    registerSpecies(shape.mega, {
      ...base,
      name: shape.name,
      baseForm: false,
      worn: true,
      height: shape.height,
      weight: shape.weight,
      stats: {
        [Stats.HP]: hp,
        [Stats.Attack]: attack,
        [Stats.Defense]: defense,
        [Stats.SpecialAttack]: specialAttack,
        [Stats.SpecialDefense]: specialDefense,
        [Stats.Speed]: speed,
      },
      types: shape.types,
      abilities: [FILLERS.get(shape.mega) ?? shape.ability],
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
