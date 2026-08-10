import { beforeAll, describe, expect, it } from 'vitest';
import {
  EGG_HATCH_STEPS,
  EGG_LEVEL,
  MAX_STEP_REPORT,
  MIN_STEP_INTERVAL,
  boostedSteps,
  canHatch,
  creditableSteps,
  stepsRemaining,
} from '../../src/auth/egg';
import { Stats } from '../../src/data/constants/stats';
import registerGen1Moves from '../../src/data/moves/gen-1';
import type { Moves } from '../../src/data/ids/moves';
import { Genders, Species } from '../../src/data/ids/species';
import {
  type BreedingParent,
  SHADOW_INHERITANCE_CHANCE,
  canBreed,
  getEggSpecies,
  inheritIVs,
  inheritMoves,
  inheritsShadow,
} from '../../src/overworld/breeding';
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

describe('a warmed egg', () => {
  it('gains half the requirement from wherever it stood', () => {
    const half = EGG_HATCH_STEPS / 2;

    // A quarter of the way along comes out three quarters of the way
    expect(boostedSteps(egg(EGG_HATCH_STEPS / 4))).toBe(Math.floor(EGG_HATCH_STEPS / 4 + half));
    expect(boostedSteps(egg(0))).toBe(half);

    // It is a share of the requirement, not a place on it: one past
    // the half-way mark finishes rather than going backwards
    expect(boostedSteps(egg(EGG_HATCH_STEPS - 1))).toBe(EGG_HATCH_STEPS);
    expect(boostedSteps(egg(half))).toBe(EGG_HATCH_STEPS);
    // And it never overshoots
    expect(boostedSteps(egg(EGG_HATCH_STEPS))).toBe(EGG_HATCH_STEPS);
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

/**
 * A parent as the breeding rules read one
 */
function parent(
  species: Species,
  gender: Genders,
  iv: number,
  moves: Moves[] = [],
  shadow = false,
): BreedingParent {
  return {
    species,
    gender,
    ivs: {
      [Stats.HP]: iv,
      [Stats.Attack]: iv,
      [Stats.Defense]: iv,
      [Stats.SpecialAttack]: iv,
      [Stats.SpecialDefense]: iv,
      [Stats.Speed]: iv,
    },
    moves,
    shadow,
    egg: false,
  };
}

describe('breeding pairs', () => {
  it('hatches the first stage of the mother line', () => {
    const father = parent(Species.Bulbasaur, Genders.Male, 31);
    const mother = parent(Species.Ivysaur, Genders.Female, 31);

    // An evolved mother still lays what her line hatches as
    expect(getEggSpecies(father, mother)).toBe(Species.Bulbasaur);
    expect(getEggSpecies(mother, father)).toBe(Species.Bulbasaur);

    // Two lines that share an egg group but not a family follow the
    // mother, not the father
    expect(
      getEggSpecies(
        parent(Species.Rattata, Genders.Male, 0),
        parent(Species.Vulpix, Genders.Female, 0),
      ),
    ).toBe(Species.Vulpix);
  });

  it('lets Ditto stand in for either parent, but not for both', () => {
    const ditto = parent(Species.Ditto, Genders.Genderless, 0);

    expect(getEggSpecies(ditto, parent(Species.Pikachu, Genders.Male, 0))).toBe(Species.Pikachu);
    // Even a genderless species breeds, so long as it is with Ditto
    expect(getEggSpecies(ditto, parent(Species.Magnemite, Genders.Genderless, 0))).toBe(
      Species.Magnemite,
    );
    // Two of them come to nothing
    expect(getEggSpecies(ditto, parent(Species.Ditto, Genders.Genderless, 0))).toBeNull();
  });

  it('refuses what cannot breed', () => {
    // Same gender
    expect(
      getEggSpecies(
        parent(Species.Bulbasaur, Genders.Male, 0),
        parent(Species.Bulbasaur, Genders.Male, 0),
      ),
    ).toBeNull();
    // Nothing in common
    expect(
      getEggSpecies(
        parent(Species.Bulbasaur, Genders.Male, 0),
        parent(Species.Magnemite, Genders.Genderless, 0),
      ),
    ).toBeNull();
    // A legendary has no eggs to discover, whoever it is put with
    expect(
      getEggSpecies(
        parent(Species.Articuno, Genders.Genderless, 0),
        parent(Species.Ditto, Genders.Genderless, 0),
      ),
    ).toBeNull();
    // An egg is not a parent
    expect(
      canBreed(
        { ...parent(Species.Bulbasaur, Genders.Male, 0), egg: true },
        parent(Species.Bulbasaur, Genders.Female, 0),
      ),
    ).toBe(false);
  });
});

describe('inherited stats', () => {
  it('copies three of the six from a parent and rolls the rest', () => {
    const left = parent(Species.Bulbasaur, Genders.Male, 31);
    const right = parent(Species.Bulbasaur, Genders.Female, 15);

    // A stream pinned to its floor: the first three stats of the
    // pool are inherited, each from the left parent, and what is
    // rolled comes out at the bottom of the range
    const low = inheritIVs(left, right, () => 0);

    expect([low[Stats.HP], low[Stats.Attack], low[Stats.Defense]]).toEqual([31, 31, 31]);
    expect([low[Stats.SpecialAttack], low[Stats.SpecialDefense], low[Stats.Speed]]).toEqual([
      0, 0, 0,
    ]);

    // Pinned to its ceiling: the last three are inherited, from the
    // right parent, and the rolled ones top out
    const high = inheritIVs(left, right, () => 0.999_999);

    expect([high[Stats.SpecialAttack], high[Stats.SpecialDefense], high[Stats.Speed]]).toEqual([
      15, 15, 15,
    ]);
    expect([high[Stats.HP], high[Stats.Attack], high[Stats.Defense]]).toEqual([31, 31, 31]);
  });
});

describe('inherited shadow', () => {
  it('comes only from a shadow parent, and only half the time', () => {
    const plain = parent(Species.Bulbasaur, Genders.Male, 0);
    const shadow = parent(Species.Bulbasaur, Genders.Female, 0, [], true);

    expect(inheritsShadow(plain, plain, () => 0)).toBe(false);
    expect(inheritsShadow(plain, shadow, () => 0)).toBe(true);
    expect(inheritsShadow(shadow, plain, () => SHADOW_INHERITANCE_CHANCE)).toBe(false);
    // Two shadows are no more certain than one
    expect(inheritsShadow(shadow, shadow, () => 0.9)).toBe(false);
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

  it('passes on what a parent actually knows, and nothing else', () => {
    const [inheritable] = getEggMoves(Species.Bulbasaur);
    const father = parent(Species.Bulbasaur, Genders.Male, 0, [inheritable]);
    const mother = parent(Species.Bulbasaur, Genders.Female, 0);
    const passed = inheritMoves(Species.Bulbasaur, father, mother, EGG_LEVEL);

    // The move the father knows is first, so it survives the limit
    expect(passed[0]).toBe(inheritable);
    expect(passed.length).toBeLessThanOrEqual(4);
    expect(passed).toHaveLength(new Set(passed).size);

    // A pair that knows none of them passes none of them on: a bred
    // egg inherits, where a nest egg is given
    const bare = inheritMoves(Species.Bulbasaur, mother, mother, EGG_LEVEL);

    expect(new Set(getEggMoves(Species.Bulbasaur)).has(bare[0])).toBe(false);
    expect(bare).toEqual(deriveMoves(Species.Bulbasaur, EGG_LEVEL));
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
