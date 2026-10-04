import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Habitat, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Attract,
  Moves.Block,
  Moves.Confide,
  Moves.DoubleTeam,
  Moves.GastroAcid,
  Moves.Hail,
  Moves.HelpingHand,
  Moves.LightScreen,
  Moves.PainSplit,
  Moves.Protect,
  Moves.PsychUp,
  Moves.Quash,
  Moves.RainDance,
  Moves.Recycle,
  Moves.Reflect,
  Moves.Rest,
  Moves.Safeguard,
  Moves.SleepTalk,
  Moves.Spite,
  Moves.Substitute,
  Moves.Swagger,
  Moves.Taunt,
  Moves.Toxic,
];

export default function registerPyukumukuSpecies(): void {
  registerSpecies(Species.Pyukumuku, {
    dexNumber: 771,
    name: 'Pyukumuku',
    category: 'Sea Cucumber Pokemon',
    height: 0.3,
    weight: 1.2,
    family: Families.Pyukumuku,
    habitat: Habitat.Amphibious,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 60,
      [Stats.Defense]: 130,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 130,
      [Stats.Speed]: 5,
    },
    types: [Types.Water],
    abilities: [Abilities.InnardsOut],
    hiddenAbilities: [Abilities.Unaware, Abilities.Regenerator, Abilities.LiquidOoze],
    eggGroups: [EggGroups.Water1],
    genderRatio: [4, 4],
    catchRate: 60,
    biomes: [Biome.Beach, Biome.RockyCoast],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day | TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.BatonPass, Moves.Bide, Moves.Harden, Moves.MudSport, Moves.WaterSport],
        5: [Moves.HelpingHand],
        9: [Moves.Taunt],
        13: [Moves.Safeguard],
        17: [Moves.Counter],
        21: [Moves.Purify],
        25: [Moves.Curse],
        29: [Moves.GastroAcid],
        33: [Moves.PainSplit],
        37: [Moves.Recover],
        41: [Moves.Soak],
        45: [Moves.Toxic],
        49: [Moves.Memento],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Bestow, Moves.Endure, Moves.Spite, Moves.Tickle, Moves.VenomDrench],
    },
  });
}
