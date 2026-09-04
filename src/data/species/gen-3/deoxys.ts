import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { DEOXYS_FORMS } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * Deoxys, and the three arrangements it puts itself into. Only the
 * first is ever met: the other three are worn, and a Meteorite in its
 * hands is what moves it between them.
 *
 * Every shape has the same 50 HP and the same moves. What changes is
 * where the other 550 points sit, which is the whole of what the
 * species is about
 */
const SHAPES: { name: string; stats: Record<Stats, number> }[] = [
  {
    name: 'Deoxys',
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 150,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 150,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 150,
    },
  },
  {
    name: 'Attack Deoxys',
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 180,
      [Stats.Defense]: 20,
      [Stats.SpecialAttack]: 180,
      [Stats.SpecialDefense]: 20,
      [Stats.Speed]: 150,
    },
  },
  {
    name: 'Defense Deoxys',
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 70,
      [Stats.Defense]: 160,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 160,
      [Stats.Speed]: 90,
    },
  },
  {
    name: 'Speed Deoxys',
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 95,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 180,
    },
  },
];

export default function registerDeoxysSpecies(): void {
  for (const [at, species] of DEOXYS_FORMS.entries()) {
    const shape = SHAPES[at];

    registerSpecies(species, {
      dexNumber: 386,
      name: shape.name,
      category: 'DNA Pokemon',
      height: 1.7,
      weight: 60.8,
      family: Families.Deoxys,
      baseForm: at === 0 ? undefined : false,
      // Worn rather than met: the three arrangements are reached
      // through the rock it holds, so the dex fills them in with the
      // shape it arrived as
      worn: at === 0 ? undefined : true,
      stats: shape.stats,
      types: [Types.Psychic],
      abilities: [Abilities.Pressure],
      eggGroups: [EggGroups.NoEggsDiscovered],
      genderRatio: undefined,
      catchRate: 3,
      // Where it came down, which is a bare island shore. It is
      // habitat rather than a spawn: no pool lists a mythical, so the
      // ticket is still the only way to one. A worn shape lives
      // nowhere, being reached through the rock instead
      biomes: at === 0 ? [Biome.Beach] : [],
      activeTimes: AnyTimeOfDay,
      learnSet: {
        level: {
          1: [Moves.Wrap, Moves.Leer],
          5: [Moves.NightShade],
          10: [Moves.Teleport],
          15: [Moves.KnockOff],
          20: [Moves.Pursuit],
          25: [Moves.Psychic],
          30: [Moves.Snatch],
          35: [Moves.CosmicPower],
          40: [Moves.Recover],
          45: [Moves.PsychoBoost],
          50: [Moves.HyperBeam],
        },
        teachable: [
          Moves.FocusPunch,
          Moves.CalmMind,
          Moves.Toxic,
          Moves.HiddenPower,
          Moves.SunnyDay,
          Moves.Taunt,
          Moves.IceBeam,
          Moves.HyperBeam,
          Moves.LightScreen,
          Moves.Protect,
          Moves.RainDance,
          Moves.Safeguard,
          Moves.Frustration,
          Moves.SolarBeam,
          Moves.Thunderbolt,
          Moves.Thunder,
          Moves.Return,
          Moves.Psychic,
          Moves.ShadowBall,
          Moves.BrickBreak,
          Moves.DoubleTeam,
          Moves.Reflect,
          Moves.ShockWave,
          Moves.RockTomb,
          Moves.AerialAce,
          Moves.Torment,
          Moves.Facade,
          Moves.SecretPower,
          Moves.Rest,
          Moves.SkillSwap,
          Moves.Snatch,
          Moves.Cut,
          Moves.Strength,
          Moves.Flash,
          Moves.RockSmash,
          Moves.WaterPulse,
        ],
      },
    });
  }
}
