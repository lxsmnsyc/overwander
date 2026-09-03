import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { CASTFORM_FORMS } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * Castform and the three skies it wears. Forecast puts the holder
 * into whichever one the weather calls for, so only the plain shape
 * is ever spawned, caught or stored: the other three are worn.
 *
 * Everything but the name and the type is shared, the stats included:
 * a Castform is the same pokemon under every sky
 */
const SHAPES: { name: string; type: Types }[] = [
  { name: 'Castform', type: Types.Normal },
  { name: 'Sunny Castform', type: Types.Fire },
  { name: 'Rainy Castform', type: Types.Water },
  { name: 'Snowy Castform', type: Types.Ice },
];

export default function registerCastformSpecies(): void {
  for (const [at, species] of CASTFORM_FORMS.entries()) {
    const shape = SHAPES[at];

    registerSpecies(species, {
      dexNumber: 351,
      name: shape.name,
      category: 'Weather Pokemon',
      height: 0.3,
      weight: 0.8,
      family: Families.Castform,
      baseForm: at === 0 ? undefined : false,
      // A sky is worn rather than met: the dex fills these in with
      // the plain shape, since none of them is ever spawned
      worn: at === 0 ? undefined : true,
      stats: {
        [Stats.HP]: 70,
        [Stats.Attack]: 70,
        [Stats.Defense]: 70,
        [Stats.SpecialAttack]: 70,
        [Stats.SpecialDefense]: 70,
        [Stats.Speed]: 70,
      },
      types: [shape.type],
      abilities: [Abilities.Forecast],
      // Levitate for a thing that is mostly cloud, Adaptability
      // because whatever shape it is in is what it hits with, and
      // Serene Grace for the small weather it carries around
      hiddenAbilities: [Abilities.Levitate, Abilities.Adaptability, Abilities.SereneGrace],
      eggGroups: [EggGroups.Fairy, EggGroups.Amorphous],
      genderRatio: [1, 1],
      catchRate: 45,
      // Open sky, since the weather is the point; a worn shape lives
      // nowhere, being reached through Forecast rather than caught
      biomes: at === 0 ? [Biome.Grassland, Biome.Steppe] : [],
      activeTimes: AnyTimeOfDay,
      learnSet: {
        level: {
          1: [Moves.Tackle],
          10: [Moves.WaterGun, Moves.Ember, Moves.PowderSnow],
          20: [Moves.RainDance, Moves.SunnyDay, Moves.Hail],
          30: [Moves.WeatherBall],
        },
        teachable: [
          Moves.WaterPulse,
          Moves.Toxic,
          Moves.Hail,
          Moves.HiddenPower,
          Moves.SunnyDay,
          Moves.IceBeam,
          Moves.Blizzard,
          Moves.Protect,
          Moves.RainDance,
          Moves.Frustration,
          Moves.SolarBeam,
          Moves.Thunderbolt,
          Moves.Thunder,
          Moves.Return,
          Moves.ShadowBall,
          Moves.DoubleTeam,
          Moves.ShockWave,
          Moves.Flamethrower,
          Moves.Sandstorm,
          Moves.FireBlast,
          Moves.Facade,
          Moves.SecretPower,
          Moves.Rest,
          Moves.Attract,
          Moves.Thief,
          Moves.Flash,
          Moves.BodySlam,
          Moves.DoubleEdge,
          Moves.Mimic,
          Moves.ThunderWave,
          Moves.Substitute,
          Moves.PsychUp,
          Moves.Snore,
          Moves.IcyWind,
          Moves.Endure,
          Moves.Swagger,
          Moves.SleepTalk,
          Moves.DefenseCurl,
          Moves.Swift,
        ],
        egg: [Moves.FutureSight],
      },
    });
  }
}
