import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Habitat, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole line
const FAMILY_TEACHABLE = [
  Moves.Attract,
  Moves.BodySlam,
  Moves.Charm,
  Moves.Confide,
  Moves.Curse,
  Moves.DoubleTeam,
  Moves.DracoMeteor,
  Moves.DragonPulse,
  Moves.Endure,
  Moves.Facade,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.Infestation,
  Moves.IronTail,
  Moves.MudShot,
  Moves.MuddyWater,
  Moves.Outrage,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.RockSlide,
  Moves.Round,
  Moves.SecretPower,
  Moves.ShockWave,
  Moves.SleepTalk,
  Moves.SludgeBomb,
  Moves.SludgeWave,
  Moves.Snore,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.TakeDown,
  Moves.Thunderbolt,
  Moves.Toxic,
  Moves.WaterPulse,
];

// The wet ground the slugs keep to
const FAMILY_BIOMES = [Biome.Bog, Biome.Swamp];

// What the slug knows however much of it there is
const FAMILY_LEVEL = {
  13: [Moves.Bide],
  20: [Moves.Flail],
  25: [Moves.RainDance, Moves.WaterPulse],
  32: [Moves.BodySlam],
  38: [Moves.MuddyWater],
  43: [Moves.Curse],
};

/**
 * The weakest dragon there is, and what it grows into. The slime is
 * the point: a blow sinks into it rather than landing, and what it
 * costs arrives a moment later
 */
export default function registerGoomySpecies(): void {
  registerSpecies(Species.Goomy, {
    dexNumber: 704,
    evolvesInto: [
      {
        species: Species.Sliggoo,
        method: EvolutionMethod.Level,
        level: 40,
      },
    ],
    name: 'Goomy',
    category: 'Soft Tissue Pokemon',
    height: 0.3,
    weight: 2.8,
    family: Families.Goomy,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 50,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 40,
    },
    types: [Types.Dragon],
    abilities: [Abilities.SapSipper, Abilities.Hydration],
    hiddenAbilities: [Abilities.Gooey],
    eggGroups: [EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 45,
    habitat: Habitat.Amphibious,
    biomes: [...FAMILY_BIOMES],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Bubble, Moves.Absorb],
        5: [Moves.WaterGun],
        6: [Moves.AcidSpray],
        9: [Moves.Protect],
        10: [Moves.DragonBreath],
        11: [Moves.AcidArmor],
        ...FAMILY_LEVEL,
        18: [Moves.WaterPulse],
        41: [Moves.Curse],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.AcidArmor,
        Moves.Counter,
        Moves.Curse,
        Moves.Endure,
        Moves.IronTail,
        Moves.PoisonTail,
      ],
    },
  });
  registerSpecies(Species.Sliggoo, {
    dexNumber: 705,
    evolvesInto: [
      {
        // The mainline asks for rain as well, which nothing here can
        // measure yet, so the level is the whole condition
        species: Species.Goodra,
        method: EvolutionMethod.Level,
        level: 50,
      },
    ],
    name: 'Sliggoo',
    category: 'Soft Tissue Pokemon',
    height: 0.8,
    weight: 17.5,
    family: Families.Goomy,
    evolvesFrom: Species.Goomy,
    stats: {
      [Stats.HP]: 68,
      [Stats.Attack]: 75,
      [Stats.Defense]: 53,
      [Stats.SpecialAttack]: 83,
      [Stats.SpecialDefense]: 113,
      [Stats.Speed]: 60,
    },
    types: [Types.Dragon],
    abilities: [Abilities.SapSipper, Abilities.Hydration],
    hiddenAbilities: [Abilities.Gooey],
    eggGroups: [EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 45,
    habitat: Habitat.Amphibious,
    biomes: [...FAMILY_BIOMES],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [
          Moves.Tackle,
          Moves.Bubble,
          Moves.Absorb,
          Moves.WaterGun,
          Moves.AcidSpray,
          Moves.AcidArmor,
          Moves.DragonBreath,
        ],
        9: [Moves.Protect],
        ...FAMILY_LEVEL,
        35: [Moves.DragonPulse],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.AcidSpray,
        Moves.Blizzard,
        Moves.IceBeam,
        Moves.Thunder,
      ],
    },
  });
  registerSpecies(Species.Goodra, {
    dexNumber: 706,
    name: 'Goodra',
    category: 'Dragon Pokemon',
    height: 2.0,
    weight: 150.5,
    family: Families.Goomy,
    evolvesFrom: Species.Sliggoo,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 100,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 110,
      [Stats.SpecialDefense]: 150,
      [Stats.Speed]: 80,
    },
    types: [Types.Dragon],
    abilities: [Abilities.SapSipper, Abilities.Hydration],
    // Water Absorb is this line's invented filler: the mainline gives
    // the slug Sap Sipper, Hydration and Gooey, and Hisuian Goodra's
    // Shell Armor belongs to that form rather than to this one
    hiddenAbilities: [Abilities.Gooey, Abilities.WaterAbsorb],
    eggGroups: [EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 45,
    habitat: Habitat.Amphibious,
    biomes: [...FAMILY_BIOMES],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [
          Moves.Tackle,
          Moves.Bubble,
          Moves.Absorb,
          Moves.WaterGun,
          Moves.AcidSpray,
          Moves.DragonBreath,
          Moves.Protect,
          Moves.Feint,
          Moves.Outrage,
          Moves.PoisonTail,
          Moves.AquaTail,
        ],
        ...FAMILY_LEVEL,
        35: [Moves.DragonPulse],
        50: [Moves.PowerWhip],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.AcidSpray,
        Moves.AquaTail,
        Moves.Assurance,
        Moves.Blizzard,
        Moves.Bulldoze,
        Moves.DragonClaw,
        Moves.DragonTail,
        Moves.Earthquake,
        Moves.FireBlast,
        Moves.FirePunch,
        Moves.Flamethrower,
        Moves.FocusBlast,
        Moves.FocusPunch,
        Moves.GigaImpact,
        Moves.Hail,
        Moves.HydroPump,
        Moves.HyperBeam,
        Moves.IceBeam,
        Moves.Incinerate,
        Moves.KnockOff,
        Moves.MegaKick,
        Moves.MegaPunch,
        Moves.PoisonTail,
        Moves.PowerWhip,
        Moves.RockSmash,
        Moves.Scald,
        Moves.Strength,
        Moves.Superpower,
        Moves.Surf,
        Moves.Thunder,
        Moves.ThunderPunch,
        Moves.WeatherBall,
        Moves.BrutalSwing,
        Moves.StompingTantrum,
        Moves.LaserFocus,
      ],
    },
  });
}
