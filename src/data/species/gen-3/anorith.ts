import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM and tutor moves both stages share
const FAMILY_TEACHABLE = [
  Moves.WaterPulse,
  Moves.Toxic,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.Protect,
  Moves.Frustration,
  Moves.Return,
  Moves.Dig,
  Moves.BrickBreak,
  Moves.DoubleTeam,
  Moves.Sandstorm,
  Moves.RockTomb,
  Moves.AerialAce,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Cut,
  Moves.RockSmash,
  Moves.SwordsDance,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.RockSlide,
  Moves.Substitute,
  Moves.Snore,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.FuryCutter,
  Moves.SleepTalk,
];

export default function registerAnorithSpecies(): void {
  registerSpecies(Species.Anorith, {
    dexNumber: 347,
    evolvesInto: [
      {
        species: Species.Armaldo,
        method: EvolutionMethod.Level,
        level: 40,
      },
    ],
    name: 'Anorith',
    category: 'Old Shrimp Pokemon',
    height: 0.7,
    weight: 12.5,
    family: Families.Anorith,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 95,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 75,
    },
    types: [Types.Rock, Types.Bug],
    abilities: [Abilities.BattleArmor],
    hiddenAbilities: [Abilities.SwiftSwim],
    eggGroups: [EggGroups.Water3],
    genderRatio: [7, 1],
    catchRate: 45,
    // Nowhere: what comes out of a fossil is not in the world any more
    biomes: [],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Scratch],
        7: [Moves.Harden],
        13: [Moves.MudSport],
        19: [Moves.WaterGun],
        25: [Moves.MetalClaw],
        31: [Moves.Protect],
        37: [Moves.AncientPower],
        43: [Moves.FuryCutter],
        49: [Moves.Slash],
        55: [Moves.RockBlast],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.KnockOff, Moves.RapidSpin],
    },
  });

  registerSpecies(Species.Armaldo, {
    dexNumber: 348,
    name: 'Armaldo',
    category: 'Plate Pokemon',
    height: 1.5,
    weight: 68.2,
    family: Families.Anorith,
    evolvesFrom: Species.Anorith,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 125,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 45,
    },
    types: [Types.Rock, Types.Bug],
    abilities: [Abilities.BattleArmor],
    // Two the mainline never gave it: plate armour that will not be
    // broken through in one blow, and a body built for exactly the
    // two things it is made of
    hiddenAbilities: [Abilities.SwiftSwim, Abilities.Sturdy, Abilities.Adaptability],
    eggGroups: [EggGroups.Water3],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Harden, Moves.MudSport, Moves.WaterGun],
        25: [Moves.MetalClaw],
        31: [Moves.Protect],
        37: [Moves.AncientPower],
        46: [Moves.FuryCutter],
        55: [Moves.Slash],
        64: [Moves.RockBlast],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.HyperBeam,
        Moves.IronTail,
        Moves.Earthquake,
        Moves.Strength,
        Moves.SeismicToss,
      ],
    },
  });
}
