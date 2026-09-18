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
  Moves.Amnesia,
  Moves.Attract,
  Moves.DarkPulse,
  Moves.DoubleTeam,
  Moves.DrainPunch,
  Moves.Endure,
  Moves.Explosion,
  Moves.Facade,
  Moves.Frustration,
  Moves.GigaDrain,
  Moves.GunkShot,
  Moves.HiddenPower,
  Moves.PainSplit,
  Moves.Payback,
  Moves.Protect,
  Moves.RainDance,
  Moves.Recycle,
  Moves.Rest,
  Moves.Return,
  Moves.RockBlast,
  Moves.Round,
  Moves.SecretPower,
  Moves.SeedBomb,
  Moves.SelfDestruct,
  Moves.SleepTalk,
  Moves.SludgeBomb,
  Moves.SludgeWave,
  Moves.Snore,
  Moves.Spikes,
  Moves.Spite,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Thief,
  Moves.Toxic,
  Moves.ToxicSpikes,
  Moves.Venoshock,
];

// What comes out of the bag, whichever size the bag is
const FAMILY_LEVEL = {
  9: [Moves.Amnesia],
  12: [Moves.ClearSmog],
  14: [Moves.DoubleSlap],
  18: [Moves.Sludge],
  21: [Moves.Stockpile, Moves.Swallow],
  27: [Moves.SludgeBomb],
  30: [Moves.Toxic],
};

/**
 * The rubbish: a Trubbish is a bag somebody left out that started
 * breathing, and a Garbodor is the rest of the tip that joined it
 */
export default function registerTrubbishSpecies(): void {
  registerSpecies(Species.Trubbish, {
    dexNumber: 568,
    evolvesInto: [
      {
        species: Species.Garbodor,
        method: EvolutionMethod.Level,
        level: 36,
      },
    ],
    name: 'Trubbish',
    category: 'Trash Bag Pokemon',
    height: 0.6,
    weight: 31,
    family: Families.Trubbish,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 50,
      [Stats.Defense]: 62,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 62,
      [Stats.Speed]: 65,
    },
    types: [Types.Poison],
    abilities: [Abilities.Stench, Abilities.StickyHold],
    hiddenAbilities: [Abilities.Aftermath],
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Badlands, Biome.Bog],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.PoisonGas],
        3: [Moves.Recycle],
        6: [Moves.AcidSpray],
        7: [Moves.ToxicSpikes],
        ...FAMILY_LEVEL,
        24: [Moves.TakeDown],
        37: [Moves.PainSplit],
        39: [Moves.GunkShot],
        42: [Moves.Explosion],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Autotomize,
        Moves.Curse,
        Moves.Haze,
        Moves.MudSport,
        Moves.RockBlast,
        Moves.Rollout,
        Moves.SandAttack,
        Moves.SelfDestruct,
        Moves.Spikes,
      ],
    },
  });
  registerSpecies(Species.Garbodor, {
    dexNumber: 569,
    name: 'Garbodor',
    category: 'Trash Heap Pokemon',
    height: 1.9,
    weight: 107.3,
    family: Families.Trubbish,
    evolvesFrom: Species.Trubbish,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 95,
      [Stats.Defense]: 82,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 82,
      [Stats.Speed]: 75,
    },
    types: [Types.Poison],
    // Sticky Hold walks up from Trubbish, so the line reaches four
    // without an invention
    abilities: [Abilities.Stench, Abilities.WeakArmor],
    hiddenAbilities: [Abilities.Aftermath],
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Badlands, Biome.Bog],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Pound,
          Moves.TakeDown,
          Moves.PoisonGas,
          Moves.MetalClaw,
          Moves.Recycle,
          Moves.ToxicSpikes,
          Moves.AcidSpray,
        ],
        ...FAMILY_LEVEL,
        24: [Moves.BodySlam],
        39: [Moves.PainSplit],
        43: [Moves.GunkShot],
        48: [Moves.Explosion],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.BodySlam,
        Moves.CrossPoison,
        Moves.Fling,
        Moves.FocusBlast,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.Psychic,
        Moves.RockPolish,
        Moves.Screech,
        Moves.SmackDown,
        Moves.SolarBeam,
        Moves.Thunderbolt,
      ],
    },
  });
}
