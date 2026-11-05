import fc from 'fast-check';
import { beforeAll, describe, expect, it } from 'vitest';
import registerGameData from '../../../src/data';
import { battleArbitrary, raidArbitrary, readFuzzParameters } from '../arbitraries';
import { Rule, playCasts, watchFight, watchRaid } from './watch';

/**
 * Random AI-against-AI fights checked on every tick. A failure prints
 * the fight that broke the rule, shrunk, and the seed and path to play
 * it again: FUZZ_SEED=<seed> FUZZ_PATH=<path> pnpm fuzz. FUZZ_TRACE=1
 * prints where each draw a guess made came from
 */
beforeAll(() => {
  registerGameData();
});

const parameters = readFuzzParameters();

describe('random battles', () => {
  it('keeps HP within 0 and max, and every stat and stage a number', () => {
    fc.assert(
      fc.property(battleArbitrary, (input) => {
        expect(watchFight(input).broken[Rule.Bounds]).toEqual([]);
      }),
      parameters,
    );
  });

  it('settles every fight before the time limit', () => {
    fc.assert(
      fc.property(battleArbitrary, (input) => {
        expect(watchFight(input).broken[Rule.Settles]).toEqual([]);
      }),
      parameters,
    );
  });

  it('changes nothing while the AI weighs its moves', () => {
    fc.assert(
      fc.property(battleArbitrary, (input) => {
        expect(watchFight(input).broken[Rule.Purity]).toEqual([]);
      }),
      parameters,
    );
  });

  it('moves held items only through the item events, and keeps what was not used up', () => {
    fc.assert(
      fc.property(battleArbitrary, (input) => {
        expect(watchFight(input).broken[Rule.Items]).toEqual([]);
      }),
      parameters,
    );
  });

  it('plays the same fight twice from the same seed', () => {
    fc.assert(
      fc.property(battleArbitrary, (input) => {
        expect(playCasts(input)).toEqual(playCasts(input));
      }),
      parameters,
    );
  });
});

describe('random raids', () => {
  const raidParameters = {
    ...parameters,
    numRuns: Math.max(1, Math.ceil((parameters.numRuns ?? 100) / 4)),
  };

  it('holds share-of-HP damage on the boss to its allowance', () => {
    fc.assert(
      fc.property(raidArbitrary, (input) => {
        expect(watchRaid(input).broken[Rule.BossCap]).toEqual([]);
      }),
      raidParameters,
    );
  });

  it('keeps the other rules in a raid', () => {
    fc.assert(
      fc.property(raidArbitrary, (input) => {
        const { broken } = watchRaid(input);

        expect([...broken[Rule.Bounds], ...broken[Rule.Purity], ...broken[Rule.Items]]).toEqual([]);
      }),
      raidParameters,
    );
  });
});
