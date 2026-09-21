import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by both shapes
const FAMILY_TEACHABLE = [
  Moves.Acrobatics,
  Moves.AerialAce,
  Moves.Agility,
  Moves.AirCutter,
  Moves.AirSlash,
  Moves.Attract,
  Moves.BrickBreak,
  Moves.Confide,
  Moves.Cut,
  Moves.DarkPulse,
  Moves.Defog,
  Moves.DoubleTeam,
  Moves.DracoMeteor,
  Moves.DragonClaw,
  Moves.DragonPulse,
  Moves.DreamEater,
  Moves.EchoedVoice,
  Moves.Endure,
  Moves.Facade,
  Moves.Fly,
  Moves.Frustration,
  Moves.HeatWave,
  Moves.HiddenPower,
  Moves.Hurricane,
  Moves.HyperVoice,
  Moves.IronTail,
  Moves.LeechLife,
  Moves.Outrage,
  Moves.Protect,
  Moves.Psychic,
  Moves.Rest,
  Moves.Return,
  Moves.Roost,
  Moves.Round,
  Moves.Screech,
  Moves.SecretPower,
  Moves.ShadowBall,
  Moves.ShadowClaw,
  Moves.SkyAttack,
  Moves.SleepTalk,
  Moves.Snatch,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.SteelWing,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.SuperFang,
  Moves.Swagger,
  Moves.Swift,
  Moves.Tailwind,
  Moves.TakeDown,
  Moves.Taunt,
  Moves.Thief,
  Moves.Torment,
  Moves.Toxic,
  Moves.UTurn,
  Moves.Uproar,
  Moves.WaterPulse,
  Moves.WildCharge,
  Moves.XScissor,
];

// The caves the colony hangs in, and the wood it hunts over
const FAMILY_BIOMES = [Biome.Woodland, Biome.TropicalRainforest];

// What the bat knows at either size
const FAMILY_LEVEL = {
  5: [Moves.LeechLife],
  12: [Moves.DoubleTeam],
  13: [Moves.Bite],
  16: [Moves.WingAttack],
  18: [Moves.Agility],
  23: [Moves.AirCutter],
  27: [Moves.Roost],
  28: [Moves.Whirlwind],
  31: [Moves.RazorWind],
  32: [Moves.SuperFang],
  35: [Moves.Tailwind],
  36: [Moves.AirSlash],
};

/**
 * The bat that hunts by sound and outruns whatever it finds. A
 * Noivern at 123 Speed is faster than nearly everything it meets,
 * which is the whole of what its signature reads
 */
export default function registerNoibatSpecies(): void {
  registerSpecies(Species.Noibat, {
    dexNumber: 714,
    evolvesInto: [
      {
        species: Species.Noivern,
        method: EvolutionMethod.Level,
        level: 48,
      },
    ],
    name: 'Noibat',
    category: 'Sound Wave Pokemon',
    height: 0.5,
    weight: 8.0,
    family: Families.Noibat,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 30,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 55,
    },
    types: [Types.Flying, Types.Dragon],
    abilities: [Abilities.Frisk, Abilities.Infiltrator],
    hiddenAbilities: [Abilities.Telepathy],
    eggGroups: [EggGroups.Flying, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Absorb, Moves.Supersonic, Moves.Screech],
        4: [Moves.Gust],
        ...FAMILY_LEVEL,
        52: [Moves.Hurricane],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Defog,
        Moves.DragonRush,
        Moves.Outrage,
        Moves.Snatch,
        Moves.Switcheroo,
        Moves.Tailwind,
      ],
    },
  });
  registerSpecies(Species.Noivern, {
    dexNumber: 715,
    name: 'Noivern',
    category: 'Sound Wave Pokemon',
    height: 1.5,
    weight: 85.0,
    family: Families.Noibat,
    evolvesFrom: Species.Noibat,
    stats: {
      [Stats.HP]: 85,
      [Stats.Attack]: 70,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 97,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 123,
    },
    types: [Types.Flying, Types.Dragon],
    abilities: [Abilities.Frisk, Abilities.Infiltrator],
    // Soundproof is this line's invented filler: the mainline gives
    // the bat Frisk, Infiltrator and Telepathy and nothing else
    hiddenAbilities: [Abilities.Telepathy, Abilities.Soundproof],
    eggGroups: [EggGroups.Flying, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Tackle,
          Moves.Absorb,
          Moves.Supersonic,
          Moves.Screech,
          Moves.Gust,
          Moves.Boomburst,
          Moves.Hurricane,
          Moves.Moonlight,
          Moves.DragonPulse,
        ],
        ...FAMILY_LEVEL,
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.BodySlam,
        Moves.DoubleEdge,
        Moves.DragonDance,
        Moves.DragonTail,
        Moves.Flamethrower,
        Moves.FocusBlast,
        Moves.GigaImpact,
        Moves.HoneClaws,
        Moves.HyperBeam,
        Moves.ScaryFace,
      ],
    },
  });
}
