import { Stats } from '../constants/stats';

const enum Natures {
  Hardy = 0,
  Lonely = 1,
  Brave = 2,
  Adamant = 3,
  Naughty = 4,
  Bold = 5,
  Docile = 6,
  Relaxed = 7,
  Impish = 8,
  Lax = 9,
  Timid = 10,
  Hasty = 11,
  Serious = 12,
  Jolly = 13,
  Naive = 14,
  Modest = 15,
  Mild = 16,
  Quiet = 17,
  Bashful = 18,
  Rash = 19,
  Calm = 20,
  Gentle = 21,
  Sassy = 22,
  Careful = 23,
  Quirky = 24,
}

export default Natures;

export interface NatureEffect {
  up: Stats;
  down: Stats;
}

/**
 * The stat each nature raises and lowers by 10%; neutral natures
 * (Hardy, Docile, Serious, Bashful, Quirky) are absent
 */
export const NATURE_EFFECTS: { [key in Natures]?: NatureEffect } = {
  [Natures.Lonely]: { up: Stats.Attack, down: Stats.Defense },
  [Natures.Brave]: { up: Stats.Attack, down: Stats.Speed },
  [Natures.Adamant]: { up: Stats.Attack, down: Stats.SpecialAttack },
  [Natures.Naughty]: { up: Stats.Attack, down: Stats.SpecialDefense },
  [Natures.Bold]: { up: Stats.Defense, down: Stats.Attack },
  [Natures.Relaxed]: { up: Stats.Defense, down: Stats.Speed },
  [Natures.Impish]: { up: Stats.Defense, down: Stats.SpecialAttack },
  [Natures.Lax]: { up: Stats.Defense, down: Stats.SpecialDefense },
  [Natures.Timid]: { up: Stats.Speed, down: Stats.Attack },
  [Natures.Hasty]: { up: Stats.Speed, down: Stats.Defense },
  [Natures.Jolly]: { up: Stats.Speed, down: Stats.SpecialAttack },
  [Natures.Naive]: { up: Stats.Speed, down: Stats.SpecialDefense },
  [Natures.Modest]: { up: Stats.SpecialAttack, down: Stats.Attack },
  [Natures.Mild]: { up: Stats.SpecialAttack, down: Stats.Defense },
  [Natures.Quiet]: { up: Stats.SpecialAttack, down: Stats.Speed },
  [Natures.Rash]: { up: Stats.SpecialAttack, down: Stats.SpecialDefense },
  [Natures.Calm]: { up: Stats.SpecialDefense, down: Stats.Attack },
  [Natures.Gentle]: { up: Stats.SpecialDefense, down: Stats.Defense },
  [Natures.Sassy]: { up: Stats.SpecialDefense, down: Stats.Speed },
  [Natures.Careful]: { up: Stats.SpecialDefense, down: Stats.SpecialAttack },
};

export function getNatureFactor(nature: Natures, stat: Stats): number {
  const effect = NATURE_EFFECTS[nature];

  if (effect == null) {
    return 1;
  }
  if (effect.up === stat) {
    return 1.1;
  }
  if (effect.down === stat) {
    return 0.9;
  }
  return 1;
}
