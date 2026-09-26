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
  Moves.Attract,
  Moves.Covet,
  Moves.DoubleTeam,
  Moves.DreamEater,
  Moves.Endeavor,
  Moves.EnergyBall,
  Moves.Facade,
  Moves.Flash,
  Moves.Frustration,
  Moves.GigaDrain,
  Moves.GrassKnot,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.KnockOff,
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
  Moves.Tailwind,
  Moves.Taunt,
  Moves.Toxic,
  Moves.WorrySeed,
  Moves.Confide,
  Moves.DazzlingGleam,
];

/**
 * The cotton: a Cottonee goes wherever the wind takes it, and a
 * Whimsicott is somewhere else by the time anybody looks
 */
export default function registerCottoneeSpecies(): void {
  registerSpecies(Species.Cottonee, {
    dexNumber: 546,
    evolvesInto: [
      {
        species: Species.Whimsicott,
        method: EvolutionMethod.UsedItem,
        item: Items.SunStone,
      },
    ],
    name: 'Cottonee',
    category: 'Cotton Puff Pokemon',
    height: 0.3,
    weight: 0.6,
    family: Families.Cottonee,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 27,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 37,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 66,
    },
    types: [Types.Grass, Types.Fairy],
    abilities: [Abilities.Prankster, Abilities.Infiltrator],
    hiddenAbilities: [Abilities.Chlorophyll],
    eggGroups: [EggGroups.Fairy, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Grassland, Biome.Shrubland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Absorb, Moves.FairyWind],
        4: [Moves.Growth],
        8: [Moves.LeechSeed],
        10: [Moves.StunSpore],
        13: [Moves.MegaDrain],
        17: [Moves.CottonSpore],
        19: [Moves.RazorLeaf],
        22: [Moves.PoisonPowder],
        26: [Moves.GigaDrain],
        28: [Moves.Charm],
        31: [Moves.HelpingHand],
        35: [Moves.EnergyBall],
        37: [Moves.CottonGuard],
        40: [Moves.SunnyDay],
        44: [Moves.Endeavor],
        46: [Moves.SolarBeam],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.BeatUp,
        Moves.Encore,
        Moves.FakeTears,
        Moves.GrassWhistle,
        Moves.Memento,
        Moves.NaturalGift,
        Moves.Switcheroo,
        Moves.Tickle,
      ],
    },
  });
  registerSpecies(Species.Whimsicott, {
    dexNumber: 547,
    name: 'Whimsicott',
    category: 'Windveiled Pokemon',
    height: 0.7,
    weight: 6.6,
    family: Families.Cottonee,
    evolvesFrom: Species.Cottonee,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 67,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 77,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 116,
    },
    types: [Types.Grass, Types.Fairy],
    abilities: [Abilities.Prankster, Abilities.Infiltrator],
    // Magic Bounce is the invented fourth: the line reaches three, and
    // a trickster that hands a status back is what it already plays at
    hiddenAbilities: [Abilities.Chlorophyll, Abilities.MagicBounce],
    eggGroups: [EggGroups.Fairy, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Grassland, Biome.Shrubland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      // A stone evolution learns nothing further on its own, beyond
      // the wind it comes into
      level: {
        1: [Moves.CottonSpore, Moves.Growth, Moves.LeechSeed, Moves.MegaDrain],
        10: [Moves.Gust],
        28: [Moves.Tailwind],
        46: [Moves.Hurricane],
        50: [Moves.Moonblast],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.Fling,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.LightScreen,
        Moves.Psychic,
        Moves.ShadowBall,
        Moves.Thief,
        Moves.TrickRoom,
        Moves.UTurn,
      ],
    },
  });
}
