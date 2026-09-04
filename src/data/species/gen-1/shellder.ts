import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Rage,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.SelfDestruct,
  Moves.Rest,
  Moves.Explosion,
  Moves.Substitute,
  Moves.Surf,
  Moves.Swift,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.IcyWind,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.Whirlpool,
  Moves.Dive,
  Moves.Facade,
  Moves.SecretPower,
  Moves.WaterPulse,
];

const FAMILY_ABILITIES = [Abilities.ShellArmor, Abilities.SkillLink];

export default function registerShellderSpecies(): void {
  registerSpecies(Species.Shellder, {
    dexNumber: 90,
    evolvesInto: [
      {
        species: Species.Cloyster,
        method: EvolutionMethod.UsedItem,
        item: Items.WaterStone,
      },
    ],
    name: 'Shellder',
    category: 'Bivalve Pokemon',
    height: 0.3,
    weight: 4,
    family: Families.Shellder,
    stats: {
      [Stats.HP]: 30,
      [Stats.Attack]: 65,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 25,
      [Stats.Speed]: 40,
    },
    types: [Types.Water],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.Overcoat],
    eggGroups: [EggGroups.Water3],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Ocean, Biome.Beach, Biome.RockyCoast],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Withdraw],
        8: [Moves.IcicleSpear],
        9: [Moves.Supersonic],
        17: [Moves.AuroraBeam],
        23: [Moves.Clamp],
        25: [Moves.Protect],
        33: [Moves.Leer],
        49: [Moves.IceBeam],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.BubbleBeam, Moves.TakeDown, Moves.Barrier, Moves.Screech, Moves.RapidSpin],
    },
  });

  registerSpecies(Species.Cloyster, {
    dexNumber: 91,
    name: 'Cloyster',
    category: 'Bivalve Pokemon',
    height: 1.5,
    weight: 132.5,
    family: Families.Shellder,
    evolvesFrom: Species.Shellder,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 95,
      [Stats.Defense]: 180,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 70,
    },
    types: [Types.Water, Types.Ice],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.Overcoat, Abilities.Sturdy],
    eggGroups: [EggGroups.Water3],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Ocean, Biome.PolarOcean, Biome.RockyCoast],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Withdraw, Moves.Supersonic, Moves.Clamp, Moves.AuroraBeam, Moves.Protect],
        33: [Moves.Spikes],
        41: [Moves.SpikeCannon],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.Torment],
    },
  });
}
