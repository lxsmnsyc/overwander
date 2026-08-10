import { beforeAll, describe, expect, it } from 'vitest';
import {
  EGG_HATCH_STEPS,
  EGG_LEVEL,
  MAX_STEP_REPORT,
  MIN_STEP_INTERVAL,
  canHatch,
  creditableSteps,
  stepsRemaining,
} from '../../src/auth/egg';
import registerGen1Moves from '../../src/data/moves/gen-1';
import { Species } from '../../src/data/ids/species';
import {
  getEggMoves,
  getRegisteredSpecies,
  getSpeciesData,
  registerSpecies,
} from '../../src/data/species';
import { deriveEggMoves, deriveMoves } from '../../src/overworld/encounter';

beforeAll(() => {
  registerGen1Moves();
  registerSpecies();
});

/**
 * An egg part-way through, as the rules read one
 */
function egg(steps: number): { egg: boolean; steps: number; hatchSteps: number } {
  return { egg: true, steps, hatchSteps: EGG_HATCH_STEPS };
}

describe('egg progress', () => {
  it('is ready only once it has been carried the whole way', () => {
    expect(canHatch(egg(0))).toBe(false);
    expect(canHatch(egg(EGG_HATCH_STEPS - 1))).toBe(false);
    expect(canHatch(egg(EGG_HATCH_STEPS))).toBe(true);

    expect(stepsRemaining(egg(0))).toBe(EGG_HATCH_STEPS);
    expect(stepsRemaining(egg(EGG_HATCH_STEPS + 100))).toBe(0);

    // Something already hatched has nowhere left to walk
    const hatched = { egg: false, steps: 0, hatchSteps: EGG_HATCH_STEPS };

    expect(canHatch(hatched)).toBe(false);
    expect(stepsRemaining(hatched)).toBe(0);
  });
});

describe('credited steps', () => {
  it('pays for no more walking than the time allows', () => {
    // Ten paces reported after ten paces' worth of time is ten
    expect(creditableSteps(10, MIN_STEP_INTERVAL * 10, EGG_HATCH_STEPS)).toBe(10);

    // The same ten reported a second later is however many that
    // second could have been walked in
    expect(creditableSteps(10, MIN_STEP_INTERVAL * 4, EGG_HATCH_STEPS)).toBe(4);
    expect(creditableSteps(1000, 1000, EGG_HATCH_STEPS)).toBe(Math.floor(1000 / MIN_STEP_INTERVAL));

    // A report is capped whatever the elapsed time was, and nothing
    // is credited past the finish line
    expect(creditableSteps(10_000, MIN_STEP_INTERVAL * 10_000, EGG_HATCH_STEPS)).toBe(
      MAX_STEP_REPORT,
    );
    expect(creditableSteps(MAX_STEP_REPORT, MIN_STEP_INTERVAL * MAX_STEP_REPORT, 3)).toBe(3);
  });

  it('credits nothing for standing still or walking backwards', () => {
    expect(creditableSteps(0, 60_000, EGG_HATCH_STEPS)).toBe(0);
    expect(creditableSteps(10, 0, EGG_HATCH_STEPS)).toBe(0);
    // A clock that went backwards buys nothing rather than a refund
    expect(creditableSteps(10, -60_000, EGG_HATCH_STEPS)).toBe(0);
    expect(creditableSteps(10, MIN_STEP_INTERVAL * 10, 0)).toBe(0);
  });
});

describe('hatchling moves', () => {
  it('guarantees one move off its line, in place of a learned one', () => {
    // Bulbasaur's line inherits; every draw of the stream is one of
    // the moves it can only inherit
    const inheritable = new Set(getEggMoves(Species.Bulbasaur));

    expect(inheritable.size).toBeGreaterThan(0);
    for (const roll of [0, 0.4, 0.99]) {
      const moves = deriveEggMoves(Species.Bulbasaur, EGG_LEVEL, () => roll);

      expect(moves.length).toBeGreaterThan(0);
      expect(moves).toHaveLength(new Set(moves).size);
      expect(inheritable.has(moves[0])).toBe(true);
      // Four is still the limit, inherited move included
      expect(moves.length).toBeLessThanOrEqual(4);
    }
  });

  it('hatches a line with nothing to inherit knowing only its own', () => {
    // An evolution carries no list of its own — what it knows it
    // hatched with, as its base stage
    expect(getEggMoves(Species.Ivysaur)).toEqual([]);
    expect(deriveEggMoves(Species.Ivysaur, EGG_LEVEL, () => 0)).toEqual(
      deriveMoves(Species.Ivysaur, EGG_LEVEL),
    );
  });

  it('keeps inherited move lists on the stage that hatches', () => {
    for (const species of getRegisteredSpecies()) {
      if (getEggMoves(species).length > 0) {
        expect(getSpeciesData(species).evolvesFrom).toBeUndefined();
      }
    }
  });
});
