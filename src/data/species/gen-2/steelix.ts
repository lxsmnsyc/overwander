import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerSteelixSpecies(): void {
  registerSpecies(Species.Steelix, {
    dexNumber: 208,
    name: 'Steelix',
    category: 'Iron Snake Pokemon',
    height: 9.2,
    weight: 400,
    family: Families.Onix,
    evolvesFrom: Species.Onix,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 85,
      [Stats.Defense]: 200,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 30,
    },
    types: [Types.Steel, Types.Ground],
    abilities: [Abilities.RockHead, Abilities.Sturdy],
    hiddenAbilities: [Abilities.SheerForce],
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 25,
    biomes: [Biome.Mountain, Biome.ColdDesert],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Screech, Moves.Tackle],
        10: [Moves.Bind],
        14: [Moves.RockThrow],
        23: [Moves.Harden],
        27: [Moves.Rage],
        36: [Moves.Sandstorm],
        40: [Moves.Slam],
        49: [Moves.Crunch],
      },
      teachable: [
        Moves.Attract,
        Moves.Curse,
        Moves.Cut,
        Moves.DefenseCurl,
        Moves.Dig,
        Moves.DoubleTeam,
        Moves.DragonBreath,
        Moves.Earthquake,
        Moves.Endure,
        Moves.Frustration,
        Moves.Headbutt,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IronTail,
        Moves.MudSlap,
        Moves.Protect,
        Moves.Rest,
        Moves.Return,
        Moves.Roar,
        Moves.RockSmash,
        Moves.Rollout,
        Moves.Sandstorm,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.Strength,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Toxic,
      ],
    },
  });
}
