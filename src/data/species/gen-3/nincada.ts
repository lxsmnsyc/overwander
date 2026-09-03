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
  Moves.Toxic,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.Protect,
  Moves.GigaDrain,
  Moves.Frustration,
  Moves.SolarBeam,
  Moves.Return,
  Moves.Dig,
  Moves.ShadowBall,
  Moves.DoubleTeam,
  Moves.Sandstorm,
  Moves.AerialAce,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Cut,
  Moves.Flash,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.Substitute,
  Moves.Snore,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.FuryCutter,
  Moves.SleepTalk,
];

export default function registerNincadaSpecies(): void {
  registerSpecies(Species.Nincada, {
    dexNumber: 290,
    // The mainline hands over both at once, and an evolution here
    // spends the pokemon it was. So the shed husk is the other
    // choice rather than a second prize, and it costs the ball the
    // mainline asks to be carrying
    evolvesInto: [
      {
        species: Species.Ninjask,
        method: EvolutionMethod.Level,
        level: 20,
      },
      {
        species: Species.Shedinja,
        method: EvolutionMethod.Level | EvolutionMethod.UsedItem,
        level: 20,
        item: Items.PokeBall,
      },
    ],
    name: 'Nincada',
    category: 'Trainee Pokemon',
    height: 0.5,
    weight: 5.5,
    family: Families.Nincada,
    stats: {
      [Stats.HP]: 31,
      [Stats.Attack]: 45,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 30,
      [Stats.Speed]: 40,
    },
    types: [Types.Bug, Types.Ground],
    abilities: [Abilities.CompoundEyes],
    hiddenAbilities: [Abilities.RunAway],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Woodland, Biome.Badlands],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Harden],
        5: [Moves.LeechLife],
        9: [Moves.SandAttack],
        14: [Moves.FurySwipes],
        19: [Moves.MindReader],
        25: [Moves.FalseSwipe],
        31: [Moves.MudSlap],
        38: [Moves.MetalClaw],
        45: [Moves.Dig],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Gust, Moves.FeintAttack, Moves.SilverWind],
    },
  });

  registerSpecies(Species.Ninjask, {
    dexNumber: 291,
    name: 'Ninjask',
    category: 'Ninja Pokemon',
    height: 0.8,
    weight: 12,
    family: Families.Nincada,
    evolvesFrom: Species.Nincada,
    stats: {
      [Stats.HP]: 61,
      [Stats.Attack]: 90,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 160,
    },
    types: [Types.Bug, Types.Flying],
    abilities: [Abilities.SpeedBoost],
    hiddenAbilities: [Abilities.Infiltrator],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Woodland, Biome.Badlands],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Harden, Moves.LeechLife, Moves.SandAttack],
        14: [Moves.FurySwipes],
        19: [Moves.MindReader],
        20: [Moves.DoubleTeam, Moves.FuryCutter, Moves.Screech],
        25: [Moves.SwordsDance],
        31: [Moves.Slash],
        38: [Moves.Agility],
        45: [Moves.BatonPass],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.HyperBeam,
        Moves.Attract,
        Moves.Thief,
        Moves.Swift,
        Moves.SwordsDance,
      ],
    },
  });

  registerSpecies(Species.Shedinja, {
    dexNumber: 292,
    name: 'Shedinja',
    category: 'Shed Pokemon',
    height: 0.8,
    weight: 1.2,
    family: Families.Nincada,
    evolvesFrom: Species.Nincada,
    stats: {
      [Stats.HP]: 1,
      [Stats.Attack]: 90,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 30,
      [Stats.Speed]: 40,
    },
    types: [Types.Bug, Types.Ghost],
    abilities: [Abilities.WonderGuard],
    // Cursed Body is this registry's rather than the mainline's: a
    // husk that answers whatever touches it, and a final evolution is
    // filled to four
    hiddenAbilities: [Abilities.CursedBody],
    // A shed shell is not something anything breeds with
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 45,
    // Nothing meets one: a husk is what a Nincada leaves behind, the
    // way a fossil is something revived rather than found walking
    biomes: [],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Harden],
        5: [Moves.LeechLife],
        9: [Moves.SandAttack],
        14: [Moves.FurySwipes],
        19: [Moves.MindReader],
        25: [Moves.Spite],
        31: [Moves.ConfuseRay],
        38: [Moves.ShadowBall],
        45: [Moves.Grudge],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.DreamEater, Moves.Thief],
    },
  });
}
