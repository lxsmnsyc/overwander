import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Acrobatics,
  Moves.Attract,
  Moves.BrickBreak,
  Moves.BulkUp,
  Moves.Bulldoze,
  Moves.CalmMind,
  Moves.Confide,
  Moves.DoubleTeam,
  Moves.Earthquake,
  Moves.Endeavor,
  Moves.Facade,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.IronHead,
  Moves.KnockOff,
  Moves.LastResort,
  Moves.LowSweep,
  Moves.Payback,
  Moves.Protect,
  Moves.PsychUp,
  Moves.Quash,
  Moves.Return,
  Moves.RockSlide,
  Moves.Round,
  Moves.ShadowClaw,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.StompingTantrum,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Superpower,
  Moves.Swagger,
  Moves.SwordsDance,
  Moves.Toxic,
  Moves.UTurn,
  Moves.WorkUp,
  Moves.ZenHeadbutt,
];

export default function registerKomalaSpecies(): void {
  registerSpecies(Species.Komala, {
    dexNumber: 775,
    name: 'Komala',
    category: 'Drowsing Pokemon',
    height: 0.4,
    weight: 19.9,
    family: Families.Komala,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 115,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 75,
      [Stats.SpecialDefense]: 95,
      [Stats.Speed]: 65,
    },
    types: [Types.Normal],
    abilities: [Abilities.Comatose],
    hiddenAbilities: [Abilities.Oblivious, Abilities.Unaware, Abilities.StickyHold],
    eggGroups: [EggGroups.Field],
    genderRatio: [4, 4],
    catchRate: 45,
    biomes: [Biome.TropicalSeasonalForest, Biome.Savanna],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day | TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.DefenseCurl, Moves.Rollout],
        6: [Moves.SpitUp, Moves.Stockpile, Moves.Swallow],
        11: [Moves.RapidSpin],
        16: [Moves.Yawn],
        21: [Moves.Slam],
        26: [Moves.Flail],
        31: [Moves.SuckerPunch],
        36: [Moves.PsychUp],
        41: [Moves.WoodHammer],
        46: [Moves.Thrash],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Charm, Moves.PlayRough, Moves.Sing, Moves.Wish],
    },
  });
}
