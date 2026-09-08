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
 * A gem eater that turns up nowhere anybody else does: caves and the
 * dark of the badlands
 */
export default function registerSableyeSpecies(): void {
  registerSpecies(Species.Sableye, {
    dexNumber: 302,
    name: 'Sableye',
    category: 'Darkness Pokemon',
    height: 0.5,
    weight: 11,
    family: Families.Sableye,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 75,
      [Stats.Defense]: 75,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 50,
    },
    types: [Types.Dark, Types.Ghost],
    abilities: [Abilities.KeenEye, Abilities.Stall],
    hiddenAbilities: [Abilities.Prankster, Abilities.StickyHold],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Badlands, Biome.MontaneForest],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Leer, Moves.Scratch],
        5: [Moves.Foresight],
        9: [Moves.NightShade],
        13: [Moves.Astonish],
        17: [Moves.FurySwipes],
        21: [Moves.FakeOut],
        25: [Moves.Detect],
        29: [Moves.FeintAttack],
        33: [Moves.KnockOff],
        37: [Moves.ConfuseRay],
        41: [Moves.ShadowBall],
        45: [Moves.MeanLook],
      },
      teachable: [
        Moves.FocusPunch,
        Moves.WaterPulse,
        Moves.CalmMind,
        Moves.Toxic,
        Moves.HiddenPower,
        Moves.SunnyDay,
        Moves.Taunt,
        Moves.Protect,
        Moves.RainDance,
        Moves.Frustration,
        Moves.Return,
        Moves.Dig,
        Moves.Psychic,
        Moves.ShadowBall,
        Moves.BrickBreak,
        Moves.DoubleTeam,
        Moves.ShockWave,
        Moves.RockTomb,
        Moves.AerialAce,
        Moves.Torment,
        Moves.Facade,
        Moves.SecretPower,
        Moves.Rest,
        Moves.Attract,
        Moves.Thief,
        Moves.Snatch,
        Moves.Cut,
        Moves.Flash,
        Moves.RockSmash,
        Moves.MegaPunch,
        Moves.MegaKick,
        Moves.BodySlam,
        Moves.DoubleEdge,
        Moves.Counter,
        Moves.SeismicToss,
        Moves.Mimic,
        Moves.Metronome,
        Moves.DreamEater,
        Moves.Substitute,
        Moves.DynamicPunch,
        Moves.PsychUp,
        Moves.Snore,
        Moves.Endure,
        Moves.MudSlap,
        Moves.IcePunch,
        Moves.Swagger,
        Moves.FuryCutter,
        Moves.ThunderPunch,
        Moves.FirePunch,
        Moves.SleepTalk,
      ],
      egg: [Moves.Moonlight, Moves.Recover],
    },
  });
}
