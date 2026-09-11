import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM and tutor moves both stages share
const FAMILY_TEACHABLE = [
  Moves.CalmMind,
  Moves.Toxic,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.Taunt,
  Moves.Protect,
  Moves.RainDance,
  Moves.Frustration,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Return,
  Moves.Psychic,
  Moves.ShadowBall,
  Moves.DoubleTeam,
  Moves.ShockWave,
  Moves.Torment,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Thief,
  Moves.SkillSwap,
  Moves.Snatch,
  Moves.Flash,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.DreamEater,
  Moves.ThunderWave,
  Moves.Substitute,
  Moves.PsychUp,
  Moves.Snore,
  Moves.IcyWind,
  Moves.Endure,
  Moves.Swagger,
  Moves.SleepTalk,
];

export default function registerShuppetSpecies(): void {
  registerSpecies(Species.Shuppet, {
    dexNumber: 353,
    evolvesInto: [
      {
        species: Species.Banette,
        method: EvolutionMethod.Level,
        level: 37,
      },
    ],
    name: 'Shuppet',
    category: 'Puppet Pokemon',
    height: 0.6,
    weight: 2.3,
    family: Families.Shuppet,
    stats: {
      [Stats.HP]: 44,
      [Stats.Attack]: 75,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 63,
      [Stats.SpecialDefense]: 33,
      [Stats.Speed]: 45,
    },
    types: [Types.Ghost],
    abilities: [Abilities.Insomnia, Abilities.Frisk],
    hiddenAbilities: [Abilities.CursedBody],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 225,
    biomes: [Biome.Woodland, Biome.TemperateForest],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.KnockOff],
        8: [Moves.Screech],
        13: [Moves.NightShade],
        20: [Moves.Curse],
        25: [Moves.Spite],
        32: [Moves.WillOWisp],
        37: [Moves.FeintAttack],
        44: [Moves.ShadowBall],
        49: [Moves.Snatch],
        56: [Moves.Grudge],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Astonish, Moves.DestinyBond, Moves.Disable, Moves.Foresight, Moves.Imprison],
    },
  });

  registerSpecies(Species.Banette, {
    dexNumber: 354,
    name: 'Banette',
    category: 'Marionette Pokemon',
    height: 1.1,
    weight: 12.5,
    family: Families.Shuppet,
    evolvesFrom: Species.Shuppet,
    stats: {
      [Stats.HP]: 64,
      [Stats.Attack]: 115,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 83,
      [Stats.SpecialDefense]: 63,
      [Stats.Speed]: 65,
    },
    types: [Types.Ghost],
    abilities: [Abilities.Insomnia, Abilities.Frisk],
    // One the mainline never gave it: a doll thrown away takes a
    // piece of whoever finished it
    hiddenAbilities: [Abilities.CursedBody, Abilities.Aftermath],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Woodland, Biome.TemperateForest],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.KnockOff, Moves.Screech, Moves.NightShade, Moves.Curse],
        25: [Moves.Spite],
        32: [Moves.WillOWisp],
        39: [Moves.FeintAttack],
        48: [Moves.ShadowBall],
        55: [Moves.Snatch],
        64: [Moves.Grudge],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.Metronome, Moves.MudSlap],
    },
  });
}
