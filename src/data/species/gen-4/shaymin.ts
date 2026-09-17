import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * The flower that grows back whatever was ruined, and the shape it
 * opens into with a Gracidea in its hands: the same pokemon lying
 * down and the same pokemon in the air
 */

// What both shapes are taught
const SHAYMIN_TEACHABLE = [
  Moves.BulletSeed,
  Moves.DoubleTeam,
  Moves.Endure,
  Moves.EnergyBall,
  Moves.Facade,
  Moves.Flash,
  Moves.Frustration,
  Moves.GigaDrain,
  Moves.GigaImpact,
  Moves.GrassKnot,
  Moves.HiddenPower,
  Moves.HyperBeam,
  Moves.LastResort,
  Moves.MudSlap,
  Moves.NaturalGift,
  Moves.Protect,
  Moves.PsychUp,
  Moves.Psychic,
  Moves.Rest,
  Moves.Return,
  Moves.Safeguard,
  Moves.SecretPower,
  Moves.SeedBomb,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Swift,
  Moves.SwordsDance,
  Moves.Synthesis,
  Moves.Toxic,
  Moves.ZenHeadbutt,
];

export default function registerShayminSpecies(): void {
  registerSpecies(Species.Shaymin, {
    dexNumber: 492,
    name: 'Shaymin',
    category: 'Gratitude Pokemon',
    height: 0.2,
    weight: 2.1,
    family: Families.Shaymin,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 100,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 100,
    },
    types: [Types.Grass],
    abilities: [Abilities.NaturalCure],
    // Serene Grace is Sky Forme's own, so it stays there. The three
    // here are this registry's: a flower answers the sun, and a thing
    // that gives back is what the species is named for
    hiddenAbilities: [Abilities.Chlorophyll, Abilities.Harvest, Abilities.LeafGuard],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 45,
    biomes: [Biome.Grassland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Growth],
        10: [Moves.MagicalLeaf],
        19: [Moves.LeechSeed],
        28: [Moves.Synthesis],
        37: [Moves.SweetScent],
        46: [Moves.NaturalGift],
        55: [Moves.WorrySeed],
        64: [Moves.Aromatherapy],
        73: [Moves.EnergyBall],
        82: [Moves.SweetKiss],
        91: [Moves.HealingWish],
        100: [Moves.SeedFlare],
      },
      teachable: [...SHAYMIN_TEACHABLE, Moves.EarthPower, Moves.Endeavor],
    },
  });
  registerSpecies(Species.ShayminSky, {
    dexNumber: 492,
    name: 'Shaymin Sky',
    baseForm: false,
    // Worn rather than met: the flower is what opens it, so the dex
    // fills it in the day the shape it lies down in is
    worn: true,
    category: 'Gratitude Pokemon',
    height: 0.4,
    weight: 5.2,
    family: Families.Shaymin,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 103,
      [Stats.Defense]: 75,
      [Stats.SpecialAttack]: 120,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 127,
    },
    types: [Types.Grass, Types.Flying],
    // Serene Grace is the shape's own, the way Levitate is Giratina
    // Origin's: what it does on the ground it does on purpose, and
    // what it does in the air keeps happening
    abilities: [Abilities.SereneGrace],
    hiddenAbilities: [],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 45,
    // Worn rather than met, so no pool stages one
    biomes: [],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Growth],
        10: [Moves.MagicalLeaf],
        19: [Moves.LeechSeed],
        28: [Moves.QuickAttack],
        37: [Moves.SweetScent],
        46: [Moves.NaturalGift],
        55: [Moves.WorrySeed],
        64: [Moves.AirSlash],
        73: [Moves.EnergyBall],
        82: [Moves.SweetKiss],
        91: [Moves.LeafStorm],
        100: [Moves.SeedFlare],
      },
      teachable: [...SHAYMIN_TEACHABLE, Moves.AirCutter, Moves.OminousWind],
    },
  });
}
