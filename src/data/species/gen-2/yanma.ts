import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerYanmaSpecies(): void {
  registerSpecies(Species.Yanma, {
    dexNumber: 193,
    name: 'Yanma',
    category: 'Clear Wing Pokemon',
    height: 1.2,
    weight: 38,
    family: Families.Yanma,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 65,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 75,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 95,
    },
    types: [Types.Bug, Types.Flying],
    abilities: [Abilities.SpeedBoost, Abilities.CompoundEyes],
    hiddenAbilities: [Abilities.Frisk],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Bog, Biome.Swamp, Biome.TropicalRainforest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        23: [Moves.Hypnosis],
        1: [Moves.Foresight, Moves.Tackle],
        7: [Moves.QuickAttack],
        13: [Moves.DoubleTeam],
        19: [Moves.SonicBoom],
        25: [Moves.Detect],
        31: [Moves.Supersonic],
        37: [Moves.Swift, Moves.WingAttack, Moves.Uproar],
        43: [Moves.Screech],
      },
      teachable: [
        Moves.Attract,
        Moves.Curse,
        Moves.Detect,
        Moves.DoubleTeam,
        Moves.Endure,
        Moves.Flash,
        Moves.Frustration,
        Moves.GigaDrain,
        Moves.Headbutt,
        Moves.HiddenPower,
        Moves.Protect,
        Moves.Rest,
        Moves.Return,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SolarBeam,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Swift,
        Moves.Thief,
        Moves.Toxic,

        Moves.AerialAce,
        Moves.DoubleEdge,
        Moves.DreamEater,
        Moves.Facade,
        Moves.Mimic,
        Moves.Psychic,
        Moves.SecretPower,
        Moves.ShadowBall,
        Moves.SteelWing,
        Moves.Substitute,
      ],
      egg: [Moves.LeechLife, Moves.Reversal, Moves.Whirlwind, Moves.SignalBeam, Moves.SilverWind],
    },
  });
}
