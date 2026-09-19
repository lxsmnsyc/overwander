import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.AfterYou,
  Moves.Attract,
  Moves.Covet,
  Moves.Cut,
  Moves.DoubleTeam,
  Moves.DreamEater,
  Moves.EnergyBall,
  Moves.Facade,
  Moves.Flash,
  Moves.Frustration,
  Moves.GigaDrain,
  Moves.GrassKnot,
  Moves.HealBell,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.Protect,
  Moves.Rest,
  Moves.Return,
  Moves.Round,
  Moves.Safeguard,
  Moves.SeedBomb,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Synthesis,
  Moves.Toxic,
  Moves.WorrySeed,
];

/**
 * The flowers: a Petilil's leaves are bitter enough to wake anybody
 * up, and a Lilligant is a garden nobody can keep
 */
export default function registerPetililSpecies(): void {
  registerSpecies(Species.Petilil, {
    dexNumber: 548,
    evolvesInto: [
      {
        species: Species.Lilligant,
        method: EvolutionMethod.UsedItem,
        item: Items.SunStone,
      },
    ],
    name: 'Petilil',
    category: 'Bulb Pokemon',
    height: 0.5,
    weight: 6.6,
    family: Families.Petilil,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 35,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 30,
    },
    types: [Types.Grass],
    abilities: [Abilities.Chlorophyll, Abilities.OwnTempo],
    hiddenAbilities: [Abilities.LeafGuard],
    eggGroups: [EggGroups.Grass],
    // Every one of them is female, so a Ditto is the only way to breed
    // another
    genderRatio: [0, 1],
    catchRate: 190,
    biomes: [Biome.TemperateForest, Biome.Grassland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Absorb],
        4: [Moves.Growth],
        8: [Moves.LeechSeed],
        10: [Moves.SleepPowder],
        13: [Moves.MegaDrain],
        17: [Moves.Synthesis],
        19: [Moves.MagicalLeaf],
        22: [Moves.StunSpore],
        26: [Moves.GigaDrain],
        28: [Moves.Aromatherapy],
        31: [Moves.HelpingHand],
        35: [Moves.EnergyBall],
        37: [Moves.Entrainment],
        40: [Moves.SunnyDay],
        44: [Moves.AfterYou],
        46: [Moves.LeafStorm],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Bide,
        Moves.Charm,
        Moves.Endure,
        Moves.GrassWhistle,
        Moves.HealingWish,
        Moves.Ingrain,
        Moves.NaturalGift,
        Moves.SweetScent,
      ],
    },
  });
  registerSpecies(Species.Lilligant, {
    dexNumber: 549,
    name: 'Lilligant',
    category: 'Flowering Pokemon',
    height: 1.1,
    weight: 16.3,
    family: Families.Petilil,
    evolvesFrom: Species.Petilil,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 60,
      [Stats.Defense]: 75,
      [Stats.SpecialAttack]: 110,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 90,
    },
    types: [Types.Grass],
    abilities: [Abilities.Chlorophyll, Abilities.OwnTempo],
    // Serene Grace is the invented fourth: the line reaches three, and
    // what it throws is powder and petals, all of it added effect
    hiddenAbilities: [Abilities.LeafGuard, Abilities.SereneGrace],
    eggGroups: [EggGroups.Grass],
    genderRatio: [0, 1],
    catchRate: 75,
    biomes: [Biome.TemperateForest, Biome.Grassland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Growth, Moves.LeechSeed, Moves.MegaDrain, Moves.Synthesis],
        10: [Moves.TeeterDance],
        28: [Moves.QuiverDance],
        46: [Moves.PetalDance],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.LightScreen,
        Moves.RolePlay,
        Moves.SwordsDance,
      ],
    },
  });
}
