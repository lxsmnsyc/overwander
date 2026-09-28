import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * The key ring. It collects keys it has no lock for and rattles them
 * at anything that comes close
 */
export default function registerKlefkiSpecies(): void {
  registerSpecies(Species.Klefki, {
    dexNumber: 707,
    name: 'Klefki',
    category: 'Key Ring Pokemon',
    height: 0.2,
    weight: 3.0,
    family: Families.Klefki,
    stats: {
      [Stats.HP]: 57,
      [Stats.Attack]: 80,
      [Stats.Defense]: 91,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 87,
      [Stats.Speed]: 75,
    },
    types: [Types.Steel, Types.Fairy],
    abilities: [Abilities.Prankster],
    // Levitate and Frisk are this line's invented fillers: the
    // mainline gives Klefki the two above and nothing else
    hiddenAbilities: [Abilities.Magician, Abilities.Levitate, Abilities.Frisk],
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Shrubland, Biome.Badlands],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.FairyLock],
        5: [Moves.FairyWind],
        8: [Moves.Astonish],
        12: [Moves.MetalSound],
        15: [Moves.Spikes],
        18: [Moves.DrainingKiss],
        23: [Moves.CraftyShield],
        27: [Moves.FoulPlay],
        32: [Moves.Torment],
        34: [Moves.MirrorShot],
        36: [Moves.Imprison],
        40: [Moves.Recycle],
        43: [Moves.PlayRough],
        44: [Moves.MagicRoom],
        50: [Moves.HealBlock],
      },
      teachable: [
        Moves.Attract,
        Moves.CalmMind,
        Moves.Confide,
        Moves.Covet,
        Moves.Cut,
        Moves.DazzlingGleam,
        Moves.DoubleTeam,
        Moves.Facade,
        Moves.FlashCannon,
        Moves.FoulPlay,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IronDefense,
        Moves.LastResort,
        Moves.LightScreen,
        Moves.MagicCoat,
        Moves.MagicRoom,
        Moves.MagnetRise,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Psychic,
        Moves.Psyshock,
        Moves.RainDance,
        Moves.Recycle,
        Moves.Reflect,
        Moves.Rest,
        Moves.Return,
        Moves.Round,
        Moves.Safeguard,
        Moves.SecretPower,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Thief,
        Moves.ThunderWave,
        Moves.Torment,
        Moves.Toxic,
      ],
      egg: [Moves.IronDefense, Moves.LockOn, Moves.Switcheroo, Moves.Thief],
    },
  });
}
