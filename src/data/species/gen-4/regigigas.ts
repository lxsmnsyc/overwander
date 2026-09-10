import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * The one that made the other three and towed the continents into
 * place, shut in a temple in the snow ever since
 */
export default function registerRegigigasSpecies(): void {
  registerSpecies(Species.Regigigas, {
    dexNumber: 486,
    name: 'Regigigas',
    category: 'Colossal Pokemon',
    height: 3.7,
    weight: 420,
    family: Families.Regigigas,
    stats: {
      [Stats.HP]: 110,
      [Stats.Attack]: 160,
      [Stats.Defense]: 110,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 110,
      [Stats.Speed]: 100,
    },
    types: [Types.Normal],
    abilities: [Abilities.SlowStart],
    // The other three are this registry's: every move it starts with
    // is a punch, and 3.7 metres arriving is felt before it swings
    hiddenAbilities: [Abilities.IronFist, Abilities.Sturdy, Abilities.Intimidate],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Glacier, Biome.Tundra],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [
          Moves.ConfuseRay,
          Moves.DizzyPunch,
          Moves.FirePunch,
          Moves.Foresight,
          Moves.IcePunch,
          Moves.KnockOff,
          Moves.ThunderPunch,
        ],
        25: [Moves.Revenge],
        50: [Moves.ZenHeadbutt],
        75: [Moves.CrushGrip],
        100: [Moves.GigaImpact],
      },
      teachable: [
        Moves.AerialAce,
        Moves.AncientPower,
        Moves.Avalanche,
        Moves.BrickBreak,
        Moves.DoubleTeam,
        Moves.DrainPunch,
        Moves.EarthPower,
        Moves.Earthquake,
        Moves.Endure,
        Moves.Facade,
        Moves.FirePunch,
        Moves.Fling,
        Moves.FocusBlast,
        Moves.FocusPunch,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IcePunch,
        Moves.IcyWind,
        Moves.IronHead,
        Moves.MudSlap,
        Moves.NaturalGift,
        Moves.PsychUp,
        Moves.RainDance,
        Moves.Return,
        Moves.RockClimb,
        Moves.RockPolish,
        Moves.RockSlide,
        Moves.RockSmash,
        Moves.RockTomb,
        Moves.Safeguard,
        Moves.SecretPower,
        Moves.ShockWave,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.StoneEdge,
        Moves.Strength,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Superpower,
        Moves.Swagger,
        Moves.Thunder,
        Moves.ThunderPunch,
        Moves.ThunderWave,
        Moves.Thunderbolt,
        Moves.Toxic,
        Moves.ZenHeadbutt,
      ],
    },
  });
}
