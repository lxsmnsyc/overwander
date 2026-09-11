import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.Psychic,
  Moves.FireBlast,
  Moves.Flamethrower,
  Moves.SolarBeam,
  Moves.SunnyDay,
  Moves.ShadowBall,
  Moves.ZapCannon,
  Moves.DoubleTeam,
  Moves.Flash,
  Moves.Rest,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.Detect,
  Moves.DreamEater,
  Moves.PsychUp,
  Moves.Endure,
  Moves.Rollout,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.DefenseCurl,
  Moves.Headbutt,
  Moves.MudSlap,
  Moves.RockSmash,
  Moves.Swift,
  Moves.BodySlam,
  Moves.Counter,
  Moves.Facade,
  Moves.LightScreen,
  Moves.MegaKick,
  Moves.MegaPunch,
  Moves.Mimic,
  Moves.Reflect,
  Moves.SecretPower,
  Moves.SeismicToss,
  Moves.ShockWave,
  Moves.SoftBoiled,
  Moves.ThunderWave,
  Moves.WaterPulse,
];

const FAMILY_ABILITIES = [Abilities.Hustle, Abilities.SereneGrace];

// The line learns the same list either side of evolving
const FAMILY_LEVEL = {
  1: [Moves.Charm, Moves.Growl],
  7: [Moves.Metronome],
  18: [Moves.SweetKiss],
  25: [Moves.Encore],
  31: [Moves.Safeguard],
  38: [Moves.DoubleEdge],
};

export default function registerTogepiSpecies(): void {
  registerSpecies(Species.Togepi, {
    dexNumber: 175,
    evolvesInto: [
      {
        species: Species.Togetic,
        method: EvolutionMethod.Friendship,
      },
    ],
    name: 'Togepi',
    category: 'Spike Ball Pokemon',
    height: 0.3,
    weight: 1.5,
    family: Families.Togepi,
    stats: {
      [Stats.HP]: 35,
      [Stats.Attack]: 20,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 20,
    },
    types: [Types.Fairy],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.SuperLuck],
    // A baby has nothing to breed with: it is what an egg holds
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: [7, 1],
    catchRate: 190,
    biomes: [Biome.Grassland, Biome.Woodland, Biome.TemperateForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        ...FAMILY_LEVEL,
        16: [Moves.Yawn],
        21: [Moves.AncientPower],
        26: [Moves.FollowMe],
        31: [...FAMILY_LEVEL[31], Moves.Wish],
        41: [Moves.BatonPass],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Foresight,
        Moves.FutureSight,
        Moves.MirrorMove,
        Moves.Peck,
        Moves.Present,
        Moves.Substitute,
      ],
    },
  });

  registerSpecies(Species.Togetic, {
    dexNumber: 176,
    name: 'Togetic',
    category: 'Happiness Pokemon',
    height: 0.6,
    weight: 3.2,
    family: Families.Togepi,
    evolvesFrom: Species.Togepi,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 40,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 105,
      [Stats.Speed]: 40,
    },
    types: [Types.Fairy, Types.Flying],
    abilities: [...FAMILY_ABILITIES],
    // Nothing invented here: Togetic gains Togekiss in a later
    // generation, so it is not a final evolution to fill
    hiddenAbilities: [Abilities.SuperLuck],
    eggGroups: [EggGroups.Flying, EggGroups.Fairy],
    genderRatio: [7, 1],
    catchRate: 75,
    biomes: [Biome.Grassland, Biome.Woodland, Biome.TemperateForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        ...FAMILY_LEVEL,
        1: [...FAMILY_LEVEL[1], Moves.MagicalLeaf],
        16: [Moves.Yawn],
        21: [Moves.AncientPower],
        26: [Moves.FollowMe],
        31: [...FAMILY_LEVEL[31], Moves.Wish],
        41: [Moves.BatonPass],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.Fly,
        Moves.SteelWing,
        Moves.HyperBeam,
        Moves.AerialAce,
        Moves.BrickBreak,
        Moves.FocusPunch,
        Moves.Substitute,
      ],
    },
  });
}
