import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerSkarmorySpecies(): void {
  registerSpecies(Species.Skarmory, {
    dexNumber: 227,
    name: 'Skarmory',
    category: 'Armor Bird Pokemon',
    height: 1.7,
    weight: 50.5,
    family: Families.Skarmory,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 80,
      [Stats.Defense]: 140,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 70,
    },
    types: [Types.Steel, Types.Flying],
    abilities: [Abilities.KeenEye, Abilities.Sturdy],
    // Mirror Armor is this registry's rather than the mainline's,
    // filling it to four: steel plate sends a blow back the way it
    // came, which is the one thing that gets past 140 Defense
    hiddenAbilities: [Abilities.WeakArmor, Abilities.MirrorArmor],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 25,
    biomes: [Biome.Mountain, Biome.AlpineTundra, Biome.Badlands],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        29: [Moves.AirCutter],
        42: [Moves.Spikes],
        45: [Moves.MetalSound],
        1: [Moves.Leer, Moves.Peck],
        13: [Moves.SandAttack],
        19: [Moves.Swift],
        25: [Moves.Agility],
        37: [Moves.FuryAttack],
        49: [Moves.SteelWing],
      },
      teachable: [
        Moves.Toxic,
        Moves.SteelWing,
        Moves.Fly,
        Moves.Cut,
        Moves.Sandstorm,
        Moves.SunnyDay,
        Moves.DoubleTeam,
        Moves.Rest,
        Moves.Thief,
        Moves.Snore,
        Moves.Curse,
        Moves.Protect,
        Moves.Detect,
        Moves.Endure,
        Moves.Swagger,
        Moves.Attract,
        Moves.SleepTalk,
        Moves.Return,
        Moves.Frustration,
        Moves.HiddenPower,
        Moves.MudSlap,
        Moves.Swift,

        Moves.AerialAce,
        Moves.Counter,
        Moves.DoubleEdge,
        Moves.Facade,
        Moves.Mimic,
        Moves.Roar,
        Moves.RockSlide,
        Moves.RockSmash,
        Moves.SecretPower,
        Moves.Substitute,
        Moves.Taunt,
        Moves.Torment,
      ],
      egg: [Moves.DrillPeck, Moves.Pursuit, Moves.SkyAttack, Moves.Whirlwind],
    },
  });
}
