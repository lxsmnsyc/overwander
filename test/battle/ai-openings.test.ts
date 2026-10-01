import { beforeAll, describe, expect, it } from 'vitest';
import registerGameData from '../../src/data';
import { Species } from '../../src/data/ids/species';
import { getMoveData } from '../../src/data/moves';
import { getSpeciesData } from '../../src/data/species';
import { type SimOptions, buildTeams, runBattle } from '../sim/ai-sim';

/**
 * How a few fixed fights open, pinned so a change to the AI's scoring
 * shows up in review as a changed opening rather than going unnoticed.
 * A deliberate change updates the snapshot with `vitest -u`
 */
const OPTIONS: SimOptions = { size: 3, level: 50, abilities: 1, items: 1 };

/** Casts read, across both sides */
const OPENING = 12;

const MATCHUPS: [string, Species[], Species[]][] = [
  [
    'kanto classics',
    [Species.Clefable, Species.Gengar, Species.Snorlax],
    [Species.Blastoise, Species.Alakazam, Species.Machamp],
  ],
  [
    'walls against sweepers',
    [Species.Skarmory, Species.Starmie, Species.Venusaur],
    [Species.Tyranitar, Species.Gyarados, Species.Charizard],
  ],
];

describe('how a fight opens', () => {
  beforeAll(() => {
    registerGameData();
  });

  for (const [name, a, b] of MATCHUPS) {
    it(name, () => {
      const { casts } = runBattle(name, buildTeams(name, [a, b], OPTIONS), OPENING);
      const lines: string[] = [];

      for (const cast of casts) {
        lines.push(
          `${'ab'[cast.side]} ${getSpeciesData(cast.species).name}: ${getMoveData(cast.move).name}`,
        );
      }
      expect(lines).toMatchSnapshot();
    });
  }
});
