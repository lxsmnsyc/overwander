import { Stats } from '../constants/stats';
import { Types } from '../constants/types';
import { Abilities } from '../ids/abilities';
import { EggGroups } from '../ids/egg-groups';
import { Families } from '../ids/families';
import { Moves } from '../ids/moves';
import { Species } from '../ids/species';
import { registerSpecies } from './__create';

export function registerBulbasaurSpecies() {
  registerSpecies(Species.Bulbasaur, {
    dexNumber: 1,
    name: 'Bulbasaur',
    category: 'Seed Pokemon',
    family: Families.Bulbasaur,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 49,
      [Stats.Defense]: 49,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 45,
    },
    types: [Types.Grass, Types.Poison],
    abilities: [Abilities.Chlorophyll, Abilities.Overgrow],
    eggGroups: [EggGroups.Monster, EggGroups.Grass],
    genderRatio: [7, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: Moves.Tackle,
      },
      teachable: [

      ],
    },
  });

  // TODO Ivysaur
  // TODO Venusaur
}
