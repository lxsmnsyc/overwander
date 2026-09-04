import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerCrobatSpecies(): void {
  registerSpecies(Species.Crobat, {
    dexNumber: 169,
    name: 'Crobat',
    category: 'Bat Pokemon',
    height: 1.8,
    weight: 75,
    family: Families.Zubat,
    evolvesFrom: Species.Golbat,
    stats: {
      [Stats.HP]: 85,
      [Stats.Attack]: 90,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 130,
    },
    types: [Types.Poison, Types.Flying],
    abilities: [Abilities.InnerFocus],
    // Poison Touch and Tinted Lens are this registry's rather than
    // the mainline's, filling it to four: it bites, and half the dex
    // shrugs its poison off
    hiddenAbilities: [Abilities.Infiltrator, Abilities.PoisonTouch, Abilities.TintedLens],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Mountain, Biome.MontaneForest],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.LeechLife, Moves.Screech, Moves.Supersonic],
        6: [Moves.Supersonic],
        12: [Moves.Bite],
        19: [Moves.ConfuseRay],
        30: [Moves.WingAttack],
        42: [Moves.MeanLook],
        55: [Moves.Haze],
      },
      teachable: [
        Moves.Attract,
        Moves.Curse,
        Moves.Detect,
        Moves.DoubleTeam,
        Moves.Endure,
        Moves.Fly,
        Moves.Frustration,
        Moves.GigaDrain,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.Protect,
        Moves.Rest,
        Moves.Return,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SteelWing,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Swift,
        Moves.Thief,
        Moves.Toxic,
      ],
    },
  });
}
