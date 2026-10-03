import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

const TEACHABLE = [
  Moves.Acrobatics,
  Moves.AerialAce,
  Moves.Attract,
  Moves.CalmMind,
  Moves.Confide,
  Moves.Covet,
  Moves.Defog,
  Moves.DoubleTeam,
  Moves.Embargo,
  Moves.Facade,
  Moves.Fly,
  Moves.Frustration,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.IcyWind,
  Moves.Protect,
  Moves.Quash,
  Moves.Rest,
  Moves.Return,
  Moves.RolePlay,
  Moves.Roost,
  Moves.Round,
  Moves.Safeguard,
  Moves.Sandstorm,
  Moves.SkyAttack,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.SteelWing,
  Moves.Substitute,
  Moves.Swagger,
  Moves.SwordsDance,
  Moves.Tailwind,
  Moves.Taunt,
  Moves.Toxic,
  Moves.UTurn,
  Moves.WorkUp,
];

/**
 * The four dances, one per island's flowers. Each style lives where
 * its flower grows, so the place it was met decides its type: the
 * dry heat for the red, the open meadow for the yellow, the shore for
 * the pink and the deep forest for the purple
 */
const STYLES: { species: Species; name: string; type: Types; biome: Biome }[] = [
  { species: Species.Oricorio, name: 'Oricorio', type: Types.Fire, biome: Biome.Savanna },
  {
    species: Species.OricorioPomPom,
    name: 'Pom-Pom Oricorio',
    type: Types.Electric,
    biome: Biome.Grassland,
  },
  { species: Species.OricorioPau, name: "Pa'u Oricorio", type: Types.Psychic, biome: Biome.Beach },
  {
    species: Species.OricorioSensu,
    name: 'Sensu Oricorio',
    type: Types.Ghost,
    biome: Biome.TropicalRainforest,
  },
];

export default function registerOricorioSpecies(): void {
  for (const style of STYLES) {
    registerSpecies(style.species, {
      dexNumber: 741,
      name: style.name,
      category: 'Dancing Pokemon',
      height: 0.6,
      weight: 3.4,
      family: Families.Oricorio,
      ...(style.species === Species.Oricorio ? {} : { baseForm: false }),
      stats: {
        [Stats.HP]: 75,
        [Stats.Attack]: 70,
        [Stats.Defense]: 70,
        [Stats.SpecialAttack]: 98,
        [Stats.SpecialDefense]: 70,
        [Stats.Speed]: 93,
      },
      // Its own type first, since Revelation Dance is thrown as it
      types: [style.type, Types.Flying],
      abilities: [Abilities.Dancer],
      // The three past Dancer are this registry's: a dancer's footwork
      // stays sure, its eye on the partner, and its wings quick
      hiddenAbilities: [Abilities.TangledFeet, Abilities.KeenEye, Abilities.GaleWings],
      eggGroups: [EggGroups.Flying],
      genderRatio: [1, 3],
      catchRate: 45,
      biomes: [style.biome],
      activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
      learnSet: {
        level: {
          1: [Moves.Pound],
          4: [Moves.Growl],
          6: [Moves.Peck],
          10: [Moves.HelpingHand],
          13: [Moves.AirCutter],
          16: [Moves.BatonPass],
          20: [Moves.FeatherDance],
          23: [Moves.DoubleSlap],
          26: [Moves.TeeterDance],
          30: [Moves.Roost],
          33: [Moves.Captivate],
          36: [Moves.AirSlash],
          40: [Moves.RevelationDance],
          43: [Moves.MirrorMove],
          46: [Moves.Agility],
          50: [Moves.Hurricane],
        },
        teachable: [...TEACHABLE],
        egg: [Moves.Captivate, Moves.Pluck, Moves.Safeguard, Moves.Tailwind],
      },
    });
  }
}
