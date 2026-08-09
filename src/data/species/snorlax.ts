import { Stats } from '../constants/stats';
import { Types } from '../constants/types';
import Abilities from '../ids/abilities';
import EggGroups from '../ids/egg-groups';
import Families from '../ids/families';
import { Moves } from '../ids/moves';
import { Species } from '../ids/species';
import { registerSpecies } from './__create';

export default function registerSnorlaxSpecies(): void {
  registerSpecies(Species.Snorlax, {
    dexNumber: 143,
    name: 'Snorlax',
    category: 'Sleeping Pokemon',
    family: Families.Snorlax,
    stats: {
      [Stats.HP]: 160,
      [Stats.Attack]: 110,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 110,
      [Stats.Speed]: 30,
    },
    types: [Types.Normal],
    abilities: [Abilities.Gluttony, Abilities.Immunity, Abilities.ThickFat],
    eggGroups: [EggGroups.Monster],
    genderRatio: [7, 1],
    catchRate: 25,
    learnSet: {
      level: {
        1: [Moves.Headbutt, Moves.Amnesia, Moves.Rest],
        35: [Moves.BodySlam],
        41: [Moves.Harden],
        48: [Moves.DoubleEdge],
        56: [Moves.HyperBeam],
      },
      teachable: [
        Moves.Toxic,
        Moves.MegaPunch,
        Moves.MegaKick,
        Moves.BodySlam,
        Moves.TakeDown,
        Moves.DoubleEdge,
        Moves.BubbleBeam,
        Moves.WaterGun,
        Moves.IceBeam,
        Moves.Blizzard,
        Moves.HyperBeam,
        Moves.Submission,
        Moves.Counter,
        Moves.SeismicToss,
        Moves.Rage,
        Moves.SolarBeam,
        Moves.Thunderbolt,
        Moves.Thunder,
        Moves.Earthquake,
        Moves.Fissure,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Reflect,
        Moves.Bide,
        Moves.Metronome,
        Moves.SelfDestruct,
        Moves.SkullBash,
        Moves.Rest,
        Moves.Psychic,
        Moves.Psywave,
        Moves.RockSlide,
        Moves.FireBlast,
        Moves.Substitute,
        Moves.Surf,
        Moves.Strength,
      ],
    },
  });
}
