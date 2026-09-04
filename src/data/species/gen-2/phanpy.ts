import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// GSC TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.Earthquake,
  Moves.Sandstorm,
  Moves.SunnyDay,
  Moves.DoubleTeam,
  Moves.Rest,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.Endure,
  Moves.Rollout,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.DefenseCurl,
  Moves.Headbutt,
  Moves.MudSlap,
  Moves.RockSmash,
  Moves.Strength,
  Moves.Roar,
];

export default function registerPhanpySpecies(): void {
  registerSpecies(Species.Phanpy, {
    dexNumber: 231,
    evolvesInto: [
      {
        species: Species.Donphan,
        method: EvolutionMethod.Level,
        level: 25,
      },
    ],
    name: 'Phanpy',
    category: 'Long Nose Pokemon',
    height: 0.5,
    weight: 33.5,
    family: Families.Phanpy,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 60,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 40,
    },
    types: [Types.Ground],
    abilities: [Abilities.Pickup],
    hiddenAbilities: [Abilities.SandVeil],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Savanna, Biome.Steppe, Biome.Badlands],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.Tackle],
        9: [Moves.DefenseCurl],
        17: [Moves.Flail],
        25: [Moves.TakeDown],
        33: [Moves.Rollout],
        41: [Moves.Endure],
        49: [Moves.DoubleEdge],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.AncientPower, Moves.BodySlam, Moves.FocusEnergy, Moves.WaterGun],
    },
  });

  registerSpecies(Species.Donphan, {
    dexNumber: 232,
    name: 'Donphan',
    category: 'Armor Pokemon',
    height: 1.1,
    weight: 120,
    family: Families.Phanpy,
    evolvesFrom: Species.Phanpy,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 120,
      [Stats.Defense]: 120,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 50,
    },
    types: [Types.Ground],
    abilities: [Abilities.Sturdy],
    // Stamina is this registry's rather than the mainline's, filling a
    // final evolution to four: the armour sets harder the more it is
    // hit
    hiddenAbilities: [Abilities.SandVeil, Abilities.Stamina],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Savanna, Biome.Steppe, Biome.Badlands],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.HornAttack],
        9: [Moves.DefenseCurl],
        17: [Moves.Flail],
        25: [Moves.FuryAttack],
        33: [Moves.Rollout],
        41: [Moves.RapidSpin],
        49: [Moves.Earthquake],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
