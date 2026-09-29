import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import { AnyTimeOfDay, TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.AerialAce,
  Moves.Attract,
  Moves.Block,
  Moves.BrickBreak,
  Moves.Bulldoze,
  Moves.Confide,
  Moves.DarkPulse,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.DracoMeteor,
  Moves.DragonClaw,
  Moves.DragonPulse,
  Moves.DragonTail,
  Moves.EarthPower,
  Moves.Earthquake,
  Moves.Facade,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.HoneClaws,
  Moves.HyperVoice,
  Moves.IronDefense,
  Moves.IronHead,
  Moves.IronTail,
  Moves.Outrage,
  Moves.Protect,
  Moves.Rest,
  Moves.Return,
  Moves.Roar,
  Moves.RockPolish,
  Moves.RockSlide,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.Round,
  Moves.Sandstorm,
  Moves.SecretPower,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.StealthRock,
  Moves.StoneEdge,
  Moves.Strength,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Superpower,
  Moves.Swagger,
  Moves.Toxic,
  Moves.ZenHeadbutt,
];

// What the king learns whichever size it is
const FAMILY_LEVEL = {
  1: [Moves.Tackle, Moves.TailWhip],
  6: [Moves.Roar],
  10: [Moves.Stomp],
  12: [Moves.Bide],
  15: [Moves.StealthRock],
  17: [Moves.Bite],
  20: [Moves.Charm],
  26: [Moves.AncientPower],
  30: [Moves.DragonTail],
  34: [Moves.Crunch],
  37: [Moves.DragonClaw],
};

/**
 * The jaw in the rock. Nothing comes out of a Jaw Fossil but this,
 * and nothing in the world grows one any more, so the bench is the
 * only road to it
 */
export default function registerTyruntSpecies(): void {
  registerSpecies(Species.Tyrunt, {
    dexNumber: 696,
    evolvesInto: [
      {
        species: Species.Tyrantrum,
        method: EvolutionMethod.Level | EvolutionMethod.TimeOfDay,
        level: 39,
        time: TimeOfDay.Morning | TimeOfDay.Day,
      },
    ],
    name: 'Tyrunt',
    category: 'Royal Heir Pokemon',
    height: 0.8,
    weight: 26.0,
    family: Families.Tyrunt,
    stats: {
      [Stats.HP]: 58,
      [Stats.Attack]: 89,
      [Stats.Defense]: 77,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 48,
    },
    types: [Types.Rock, Types.Dragon],
    abilities: [Abilities.StrongJaw],
    hiddenAbilities: [Abilities.Sturdy],
    eggGroups: [EggGroups.Monster, EggGroups.Dragon],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        ...FAMILY_LEVEL,
        40: [Moves.Thrash],
        44: [Moves.Earthquake],
        49: [Moves.HornDrill],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Curse,
        Moves.DragonDance,
        Moves.FireFang,
        Moves.IceFang,
        Moves.PoisonFang,
        Moves.RockPolish,
        Moves.ThunderFang,
      ],
    },
  });
  registerSpecies(Species.Tyrantrum, {
    dexNumber: 697,
    name: 'Tyrantrum',
    category: 'Despot Pokemon',
    height: 2.5,
    weight: 270.0,
    family: Families.Tyrunt,
    evolvesFrom: Species.Tyrunt,
    stats: {
      [Stats.HP]: 82,
      [Stats.Attack]: 121,
      [Stats.Defense]: 119,
      [Stats.SpecialAttack]: 69,
      [Stats.SpecialDefense]: 59,
      [Stats.Speed]: 71,
    },
    types: [Types.Rock, Types.Dragon],
    abilities: [Abilities.StrongJaw],
    // Intimidate is this line's invented filler: the mainline gives
    // the two shapes Strong Jaw, Sturdy and Rock Head between them
    hiddenAbilities: [Abilities.RockHead, Abilities.Intimidate],
    eggGroups: [EggGroups.Monster, EggGroups.Dragon],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        ...FAMILY_LEVEL,
        42: [Moves.Thrash],
        47: [Moves.Earthquake],
        53: [Moves.HornDrill],
        58: [Moves.HeadSmash],
        68: [Moves.RockSlide],
        75: [Moves.GigaImpact],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.GigaImpact, Moves.HyperBeam],
    },
  });
}
