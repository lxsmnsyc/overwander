import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerAerodactylSpecies(): void {
  registerSpecies(Species.Aerodactyl, {
    dexNumber: 142,
    name: 'Aerodactyl',
    category: 'Fossil Pokemon',
    height: 1.8,
    weight: 59,
    family: Families.Aerodactyl,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 105,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 130,
    },
    types: [Types.Rock, Types.Flying],
    abilities: [Abilities.RockHead, Abilities.Pressure],
    hiddenAbility: Abilities.Unnerve,
    eggGroups: [EggGroups.Flying],
    genderRatio: [7, 1],
    catchRate: 45,
    // Extinct: nothing brings one back but a fossil, so it lives
    // nowhere on the map
    biomes: [],
    activeTimes: TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.WingAttack, Moves.Agility],
        33: [Moves.Supersonic],
        38: [Moves.Bite],
        45: [Moves.TakeDown],
        54: [Moves.HyperBeam],
      },
      teachable: [
        Moves.Toxic,
        Moves.RazorWind,
        Moves.Whirlwind,
        Moves.TakeDown,
        Moves.DoubleEdge,
        Moves.HyperBeam,
        Moves.Rage,
        Moves.DragonRage,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Reflect,
        Moves.Bide,
        Moves.FireBlast,
        Moves.Swift,
        Moves.SkyAttack,
        Moves.Rest,
        Moves.Substitute,
        Moves.Fly,
      ],
    },
  });
}
