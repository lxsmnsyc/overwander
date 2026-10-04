import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { MINIOR_FORMS, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Acrobatics,
  Moves.Attract,
  Moves.Bulldoze,
  Moves.CalmMind,
  Moves.ChargeBeam,
  Moves.Confide,
  Moves.DazzlingGleam,
  Moves.DoubleTeam,
  Moves.Earthquake,
  Moves.Endeavor,
  Moves.Explosion,
  Moves.Facade,
  Moves.Frustration,
  Moves.GigaImpact,
  Moves.Gravity,
  Moves.GyroBall,
  Moves.HiddenPower,
  Moves.HyperBeam,
  Moves.IronHead,
  Moves.LastResort,
  Moves.LightScreen,
  Moves.MagnetRise,
  Moves.Protect,
  Moves.PsychUp,
  Moves.Psychic,
  Moves.Reflect,
  Moves.Rest,
  Moves.Return,
  Moves.RockPolish,
  Moves.RockSlide,
  Moves.RockTomb,
  Moves.Round,
  Moves.Safeguard,
  Moves.Sandstorm,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.StealthRock,
  Moves.StoneEdge,
  Moves.Substitute,
  Moves.Swagger,
  Moves.Telekinesis,
  Moves.Toxic,
  Moves.UTurn,
  Moves.ZenHeadbutt,
];

// The shell and the cores share everything but their stats and their weight
const MINIOR_SHARED = {
  dexNumber: 774,
  category: 'Meteor Pokemon',
  family: Families.Minior,
  types: [Types.Rock, Types.Flying],
  abilities: [Abilities.ShieldsDown],
  hiddenAbilities: [Abilities.WeakArmor, Abilities.MagicGuard, Abilities.Sturdy],
  eggGroups: [EggGroups.Mineral],
  genderRatio: [0, 0] as [number, number],
  catchRate: 30,
  activeTimes: TimeOfDay.Morning | TimeOfDay.Day | TimeOfDay.Evening | TimeOfDay.Night,
  height: 0.3,
  learnSet: {
    level: {
      1: [Moves.Tackle],
      3: [Moves.DefenseCurl],
      8: [Moves.Rollout],
      10: [Moves.ConfuseRay],
      15: [Moves.Swift],
      17: [Moves.AncientPower],
      22: [Moves.SelfDestruct],
      24: [Moves.StealthRock],
      29: [Moves.TakeDown],
      31: [Moves.Autotomize],
      36: [Moves.CosmicPower],
      38: [Moves.PowerGem],
      43: [Moves.DoubleEdge],
      45: [Moves.ShellSmash],
      50: [Moves.Explosion],
    },
    teachable: [...FAMILY_TEACHABLE],
  },
};

const CORE_COLOURS = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet'];

export default function registerMiniorSpecies(): void {
  registerSpecies(Species.Minior, {
    ...MINIOR_SHARED,
    name: 'Minior',
    weight: 40,
    biomes: [Biome.Mountain, Biome.AlpineTundra],
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 60,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 60,
    },
  });
  for (const [at, colour] of CORE_COLOURS.entries()) {
    registerSpecies(MINIOR_FORMS[at + 1], {
      ...MINIOR_SHARED,
      name: `${colour} Core Minior`,
      // Shields Down cracks the shell open mid-fight, so a core is never met on its own
      baseForm: false,
      worn: true,
      weight: 0.3,
      biomes: [],
      stats: {
        [Stats.HP]: 60,
        [Stats.Attack]: 100,
        [Stats.Defense]: 60,
        [Stats.SpecialAttack]: 100,
        [Stats.SpecialDefense]: 60,
        [Stats.Speed]: 120,
      },
    });
  }
}
