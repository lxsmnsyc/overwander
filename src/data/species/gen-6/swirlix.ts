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

// TM, HM and tutor moves shared by both shapes
const FAMILY_TEACHABLE = [
  Moves.AfterYou,
  Moves.Amnesia,
  Moves.Attract,
  Moves.CalmMind,
  Moves.Charm,
  Moves.Confide,
  Moves.Covet,
  Moves.DazzlingGleam,
  Moves.DoubleTeam,
  Moves.DrainingKiss,
  Moves.DreamEater,
  Moves.Endeavor,
  Moves.Endure,
  Moves.EnergyBall,
  Moves.Facade,
  Moves.FakeTears,
  Moves.Flamethrower,
  Moves.Flash,
  Moves.Frustration,
  Moves.GastroAcid,
  Moves.HealBell,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.LightScreen,
  Moves.MagicCoat,
  Moves.PlayRough,
  Moves.Protect,
  Moves.PsychUp,
  Moves.Psychic,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.Round,
  Moves.Safeguard,
  Moves.SecretPower,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Surf,
  Moves.Swagger,
  Moves.Thief,
  Moves.Thunderbolt,
  Moves.Toxic,
];

// The open country the sweet shop keeps to
const FAMILY_BIOMES = [Biome.Grassland, Biome.Shrubland];

// What the shop knows at either size
const FAMILY_LEVEL = {
  9: [Moves.Aromatherapy],
  10: [Moves.FakeTears],
  12: [Moves.DrainingKiss],
  13: [Moves.Round],
  17: [Moves.CottonSpore],
  21: [Moves.Endeavor, Moves.StringShot],
  27: [Moves.EnergyBall],
  30: [Moves.Wish],
  33: [Moves.PlayRough],
  36: [Moves.CottonGuard],
  58: [Moves.LightScreen],
  67: [Moves.Safeguard],
};

/**
 * The cotton dog that eats sugar and is made of it. Whatever it
 * finishes off is handed round the rest of the team, which is what
 * its signature pays out
 */
export default function registerSwirlixSpecies(): void {
  registerSpecies(Species.Swirlix, {
    dexNumber: 684,
    evolvesInto: [
      {
        species: Species.Slurpuff,
        method: EvolutionMethod.Trade | EvolutionMethod.HeldItem,
        item: Items.WhippedDream,
      },
    ],
    name: 'Swirlix',
    category: 'Cotton Candy Pokemon',
    height: 0.4,
    weight: 3.5,
    family: Families.Swirlix,
    stats: {
      [Stats.HP]: 62,
      [Stats.Attack]: 48,
      [Stats.Defense]: 66,
      [Stats.SpecialAttack]: 59,
      [Stats.SpecialDefense]: 57,
      [Stats.Speed]: 49,
    },
    types: [Types.Fairy],
    abilities: [Abilities.SweetVeil],
    hiddenAbilities: [Abilities.Unburden],
    eggGroups: [EggGroups.Fairy],
    genderRatio: [1, 1],
    catchRate: 200,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.SweetScent],
        3: [Moves.PlayNice],
        5: [Moves.FairyWind],
        ...FAMILY_LEVEL,
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.AfterYou, Moves.BellyDrum, Moves.Copycat, Moves.StickyWeb, Moves.Yawn],
    },
  });
  registerSpecies(Species.Slurpuff, {
    dexNumber: 685,
    name: 'Slurpuff',
    category: 'Meringue Pokemon',
    height: 0.8,
    weight: 5.0,
    family: Families.Swirlix,
    evolvesFrom: Species.Swirlix,
    stats: {
      [Stats.HP]: 82,
      [Stats.Attack]: 80,
      [Stats.Defense]: 86,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 72,
    },
    types: [Types.Fairy],
    abilities: [Abilities.SweetVeil],
    // Both are this line's invented fillers: the mainline gives it
    // Sweet Veil and Unburden and nothing else
    hiddenAbilities: [Abilities.Unburden, Abilities.FriendGuard, Abilities.ThickFat],
    eggGroups: [EggGroups.Fairy],
    genderRatio: [1, 1],
    catchRate: 140,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.SweetScent, Moves.PlayNice, Moves.FairyWind],
        ...FAMILY_LEVEL,
        42: [Moves.StickyWeb],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.DrainPunch,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.Metronome,
        Moves.Thunder,
      ],
    },
  });
}
