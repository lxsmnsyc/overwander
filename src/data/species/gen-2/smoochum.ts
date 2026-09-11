import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerSmoochumSpecies(): void {
  registerSpecies(Species.Smoochum, {
    dexNumber: 238,
    evolvesInto: [
      {
        species: Species.Jynx,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'Smoochum',
    category: 'Kiss Pokemon',
    height: 0.4,
    weight: 6,
    family: Families.Jynx,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 30,
      [Stats.Defense]: 15,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 65,
    },
    types: [Types.Ice, Types.Psychic],
    abilities: [Abilities.Oblivious, Abilities.Forewarn],
    hiddenAbilities: [Abilities.Hydration],
    // A baby lays no egg of its own: the stage above it does
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: [0, 1],
    catchRate: 45,
    biomes: [Biome.Glacier, Biome.Tundra, Biome.Taiga],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Lick, Moves.Pound],
        9: [Moves.SweetKiss],
        13: [Moves.PowderSnow],
        21: [Moves.Confusion],
        25: [Moves.Sing],
        33: [Moves.MeanLook],
        37: [Moves.Psychic, Moves.FakeTears],
        45: [Moves.PerishSong],
        49: [Moves.Blizzard],
      },
      teachable: [
        Moves.Attract,
        Moves.Blizzard,
        Moves.Curse,
        Moves.DoubleTeam,
        Moves.DreamEater,
        Moves.DynamicPunch,
        Moves.Endure,
        Moves.Frustration,
        Moves.HiddenPower,
        Moves.IceBeam,
        Moves.IcePunch,
        Moves.IcyWind,
        Moves.MudSlap,
        Moves.Nightmare,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.ShadowBall,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.Swagger,
        Moves.SweetScent,
        Moves.Thief,
        Moves.Toxic,

        Moves.BodySlam,
        Moves.CalmMind,
        Moves.Counter,
        Moves.DoubleEdge,
        Moves.Facade,
        Moves.Flash,
        Moves.LightScreen,
        Moves.MegaKick,
        Moves.MegaPunch,
        Moves.Metronome,
        Moves.Mimic,
        Moves.Reflect,
        Moves.SecretPower,
        Moves.SeismicToss,
        Moves.SkillSwap,
        Moves.Substitute,
        Moves.WaterPulse,
      ],
      egg: [Moves.LovelyKiss, Moves.Meditate, Moves.FakeOut, Moves.Wish],
    },
  });
}
