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
 * The jewel that formed underground and kept growing. It waits out a
 * fight rather than winning it quickly, and thickens by a layer for
 * every stretch it is left standing
 */
export default function registerCarbinkSpecies(): void {
  registerSpecies(Species.Carbink, {
    dexNumber: 703,
    name: 'Carbink',
    category: 'Jewel Pokemon',
    height: 0.3,
    weight: 5.7,
    family: Families.Carbink,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 50,
      [Stats.Defense]: 150,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 150,
      [Stats.Speed]: 50,
    },
    types: [Types.Rock, Types.Fairy],
    abilities: [Abilities.ClearBody],
    // Both are this line's invented fillers: the mainline gives the
    // jewel Clear Body and Sturdy and nothing else, and it is drawn
    // floating, which is where the Levitate comes from
    hiddenAbilities: [Abilities.Sturdy, Abilities.Levitate, Abilities.SolidRock],
    eggGroups: [EggGroups.Fairy, EggGroups.Mineral],
    genderRatio: [0, 0],
    catchRate: 60,
    biomes: [Biome.Mountain, Biome.Badlands],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Harden],
        5: [Moves.RockThrow, Moves.GuardSplit],
        8: [Moves.Sharpen],
        10: [Moves.SmackDown],
        15: [Moves.Flail],
        18: [Moves.Reflect],
        20: [Moves.AncientPower],
        21: [Moves.StealthRock],
        25: [Moves.RockPolish],
        30: [Moves.LightScreen],
        35: [Moves.RockSlide],
        40: [Moves.SkillSwap],
        45: [Moves.PowerGem],
        49: [Moves.StoneEdge],
        50: [Moves.Moonblast],
        70: [Moves.Safeguard],
      },
      teachable: [
        Moves.AfterYou,
        Moves.AllySwitch,
        Moves.BodySlam,
        Moves.CalmMind,
        Moves.Charm,
        Moves.Confide,
        Moves.Covet,
        Moves.DazzlingGleam,
        Moves.DoubleEdge,
        Moves.DoubleTeam,
        Moves.EarthPower,
        Moves.Endeavor,
        Moves.Endure,
        Moves.Explosion,
        Moves.Facade,
        Moves.Flash,
        Moves.FlashCannon,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.Gravity,
        Moves.GuardSwap,
        Moves.GyroBall,
        Moves.Hail,
        Moves.HeavySlam,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IronDefense,
        Moves.IronHead,
        Moves.LightScreen,
        Moves.MagicCoat,
        Moves.MagnetRise,
        Moves.MistyTerrain,
        Moves.NaturePower,
        Moves.PowerGem,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Reflect,
        Moves.Rest,
        Moves.Return,
        Moves.RockBlast,
        Moves.RockPolish,
        Moves.RockSlide,
        Moves.RockTomb,
        Moves.Round,
        Moves.Safeguard,
        Moves.SandTomb,
        Moves.Sandstorm,
        Moves.SecretPower,
        Moves.SkillSwap,
        Moves.SleepTalk,
        Moves.SmackDown,
        Moves.Snore,
        Moves.Spikes,
        Moves.StealthRock,
        Moves.StoneEdge,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.TakeDown,
        Moves.Telekinesis,
        Moves.Toxic,
        Moves.TrickRoom,
        Moves.WonderRoom,
      ],
    },
  });
}
