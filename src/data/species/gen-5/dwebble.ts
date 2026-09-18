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
  Moves.AerialAce,
  Moves.Attract,
  Moves.Block,
  Moves.BugBite,
  Moves.Bulldoze,
  Moves.Cut,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.Earthquake,
  Moves.Endure,
  Moves.Facade,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.HoneClaws,
  Moves.IronDefense,
  Moves.KnockOff,
  Moves.NaturePower,
  Moves.PoisonJab,
  Moves.Protect,
  Moves.Rest,
  Moves.Return,
  Moves.RockBlast,
  Moves.RockPolish,
  Moves.RockSlide,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.Round,
  Moves.SandTomb,
  Moves.Sandstorm,
  Moves.SecretPower,
  Moves.ShadowClaw,
  Moves.SleepTalk,
  Moves.SmackDown,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.Spikes,
  Moves.StealthRock,
  Moves.StoneEdge,
  Moves.Strength,
  Moves.StruggleBug,
  Moves.Substitute,
  Moves.Swagger,
  Moves.SwordsDance,
  Moves.Toxic,
  Moves.XScissor,
];

// What it does from inside the rock, whichever rock it is carrying
const FAMILY_LEVEL = {
  12: [Moves.BugBite],
  13: [Moves.FeintAttack],
  16: [Moves.Flail],
  19: [Moves.RockPolish],
  20: [Moves.Slash],
  24: [Moves.RockSlide, Moves.StealthRock],
};

/**
 * The masons: a Dwebble bores its own rock to live in and carries it
 * everywhere, and a Crustle that loses its slab loses the will to
 * fight along with it
 */
export default function registerDwebbleSpecies(): void {
  registerSpecies(Species.Dwebble, {
    dexNumber: 557,
    evolvesInto: [
      {
        species: Species.Crustle,
        method: EvolutionMethod.Level,
        level: 34,
      },
    ],
    name: 'Dwebble',
    category: 'Rock Inn Pokemon',
    height: 0.3,
    weight: 14.5,
    family: Families.Dwebble,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 65,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 35,
      [Stats.Speed]: 55,
    },
    types: [Types.Bug, Types.Rock],
    abilities: [Abilities.Sturdy, Abilities.ShellArmor],
    hiddenAbilities: [Abilities.WeakArmor],
    eggGroups: [EggGroups.Bug, EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Desert, Biome.Badlands],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.SandAttack, Moves.FuryCutter],
        4: [Moves.Withdraw],
        5: [Moves.RockBlast],
        8: [Moves.SmackDown],
        ...FAMILY_LEVEL,
        35: [Moves.XScissor],
        37: [Moves.ShellSmash],
        43: [Moves.RockWrecker],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Block,
        Moves.Counter,
        Moves.Curse,
        Moves.Endure,
        Moves.IronDefense,
        Moves.KnockOff,
        Moves.NightSlash,
        Moves.SandTomb,
        Moves.Spikes,
        Moves.WideGuard,
      ],
    },
  });
  registerSpecies(Species.Crustle, {
    dexNumber: 558,
    name: 'Crustle',
    category: 'Stone Home Pokemon',
    height: 1.4,
    weight: 200,
    family: Families.Dwebble,
    evolvesFrom: Species.Dwebble,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 105,
      [Stats.Defense]: 125,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 45,
    },
    types: [Types.Bug, Types.Rock],
    abilities: [Abilities.Sturdy, Abilities.ShellArmor],
    // Solid Rock is the invented fourth: the line reaches three, and
    // the slab on its back is what the worst of a hit lands on
    hiddenAbilities: [Abilities.WeakArmor, Abilities.SolidRock],
    eggGroups: [EggGroups.Bug, EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Desert, Biome.Badlands],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [
          Moves.SandAttack,
          Moves.Withdraw,
          Moves.FuryCutter,
          Moves.RockBlast,
          Moves.SmackDown,
          Moves.ShellSmash,
        ],
        ...FAMILY_LEVEL,
        38: [Moves.XScissor],
        55: [Moves.RockWrecker],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.GigaImpact, Moves.HeavySlam, Moves.HyperBeam],
    },
  });
}
