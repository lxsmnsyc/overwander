import { registerMoves } from '../../src/data/moves';
import { beforeAll, describe, expect, it } from 'vitest';
import type { EggProgress } from '../../src/auth/egg';
import {
  EGG_HATCH_STEPS,
  EGG_LEVEL,
  MAX_STEP_REPORT,
  MIN_STEP_INTERVAL,
  STEPS_PER_EGG_CYCLE,
  boostedSteps,
  canHatch,
  creditableSteps,
  creditedEggSteps,
  getEggHatchSteps,
  stepsRemaining,
} from '../../src/auth/egg';
import { STAT_ORDER, Stats, getIV, packIVs } from '../../src/data/constants/stats';
import Abilities from '../../src/data/ids/abilities';
import { Balls } from '../../src/data/ids/items';
import type { Moves } from '../../src/data/ids/moves';
import Natures from '../../src/data/ids/natures';
import { Genders, Species } from '../../src/data/ids/species';
import {
  ABILITY_INHERITANCE_CHANCE,
  type BreedingParent,
  DESTINY_KNOT_IVS,
  HIDDEN_ABILITY_INHERITANCE_CHANCE,
  INHERITED_IVS,
  SHADOW_INHERITANCE_CHANCE,
  canBreed,
  getEggSpecies,
  inheritAbility,
  inheritBall,
  inheritIVs,
  inheritMoves,
  inheritNature,
  inheritsShadow,
  rollEggSpecies,
} from '../../src/overworld/breeding';
import { MAX_LEVEL } from '../../src/data/constants/levels';
import {
  DEFAULT_EGG_CYCLES,
  SPECIES_DAY_STEP_BOOST,
  getEggCycles,
  getEggMoves,
  getLevelUpMoves,
  getRegisteredSpecies,
  getSpeciesData,
  registerSpecies,
} from '../../src/data/species';
import { deriveEggMoves, deriveMoves } from '../../src/overworld/encounter';

beforeAll(() => {
  registerMoves();
  registerSpecies();
});

/**
 * An egg part-way through, as the rules read one
 */
function egg(steps: number): EggProgress {
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

describe('a species day walk', () => {
  it('is worth more to an egg of the day’s own family', () => {
    // Family 0 is Bulbasaur's, so the first day of the year is its own
    const YEAR_START = Date.UTC(2026, 0, 1);
    const BLANK_DAY = YEAR_START + 200 * 24 * 60 * 60 * 1000;

    expect(creditedEggSteps(Species.Bulbasaur, 100, YEAR_START)).toBe(
      Math.floor(100 * SPECIES_DAY_STEP_BOOST),
    );
    // The whole family, and nobody outside it
    expect(creditedEggSteps(Species.Venusaur, 100, YEAR_START)).toBeGreaterThan(100);
    expect(creditedEggSteps(Species.Charmander, 100, YEAR_START)).toBe(100);
    // And on a day featuring nobody, a pace is a pace
    expect(creditedEggSteps(Species.Bulbasaur, 100, BLANK_DAY)).toBe(100);

    // It rounds down rather than handing out a part-step
    expect(Number.isInteger(creditedEggSteps(Species.Bulbasaur, 7, YEAR_START))).toBe(true);
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
 * The first move in the list that matches, or a thrown failure. The
 * move tests pick theirs out of the real learn sets rather than naming
 * one, so a data change moves the test instead of silently emptying it
 */
function findMove(moves: Moves[], keep: (move: Moves) => boolean): Moves {
  const found = moves.find(keep);

  if (found == null) {
    throw new Error('No move in the list matched');
  }
  return found;
}

/**
 * A parent as the breeding rules read one. Everything past the moves
 * is passed by name, since most tests care about exactly one of them
 */
function parent(
  species: Species,
  gender: Genders,
  iv: number,
  moves: Moves[] = [],
  extra: Partial<BreedingParent> = {},
): BreedingParent {
  return {
    species,
    gender,
    ivs: packIVs({
      [Stats.HP]: iv,
      [Stats.Attack]: iv,
      [Stats.Defense]: iv,
      [Stats.SpecialAttack]: iv,
      [Stats.SpecialDefense]: iv,
      [Stats.Speed]: iv,
    }),
    moves,
    shadow: false,
    nature: Natures.Hardy,
    ability: Abilities.Overgrow,
    ball: Balls.PokeBall,
    everstone: false,
    destinyKnot: false,
    powerStat: null,
    egg: false,
    ...extra,
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

    expect([getIV(low, Stats.HP), getIV(low, Stats.Attack), getIV(low, Stats.Defense)]).toEqual([
      31, 31, 31,
    ]);
    expect([
      getIV(low, Stats.SpecialAttack),
      getIV(low, Stats.SpecialDefense),
      getIV(low, Stats.Speed),
    ]).toEqual([0, 0, 0]);

    // Pinned to its ceiling: the last three are inherited, from the
    // right parent, and the rolled ones top out
    const high = inheritIVs(left, right, () => 0.999_999);

    expect([
      getIV(high, Stats.SpecialAttack),
      getIV(high, Stats.SpecialDefense),
      getIV(high, Stats.Speed),
    ]).toEqual([15, 15, 15]);
    expect([getIV(high, Stats.HP), getIV(high, Stats.Attack), getIV(high, Stats.Defense)]).toEqual([
      31, 31, 31,
    ]);
  });
});

describe('a Destiny Knot', () => {
  it('copies five of the six instead of three', () => {
    const left = parent(Species.Bulbasaur, Genders.Male, 31, [], { destinyKnot: true });
    const right = parent(Species.Bulbasaur, Genders.Female, 15);
    // Pinned to the floor: the pool is taken from the front, every
    // copy comes off the left parent, and whatever is left is rolled
    // at the bottom of the range
    const ivs = inheritIVs(left, right, () => 0);
    const copied = STAT_ORDER.filter((stat) => getIV(ivs, stat) === 31);

    expect(copied).toHaveLength(DESTINY_KNOT_IVS);
    expect(getIV(ivs, Stats.Speed)).toBe(0);

    // Either parent's knot is the pair's knot
    expect(
      STAT_ORDER.filter(
        (stat) =>
          getIV(
            inheritIVs(right, left, () => 0),
            stat,
          ) > 0,
      ),
    ).toHaveLength(DESTINY_KNOT_IVS);
  });
});

describe('a power item', () => {
  it('copies its own stat off whoever is holding it', () => {
    const holder = parent(Species.Bulbasaur, Genders.Male, 31, [], { powerStat: Stats.Speed });
    const other = parent(Species.Bulbasaur, Genders.Female, 15);
    const ivs = inheritIVs(holder, other, () => 0);

    // Speed is last in the pool and would have been rolled to nothing
    // at this floor; the item is the only way it is 31 here
    expect(getIV(ivs, Stats.Speed)).toBe(31);
    // And it counts against the three: two more are copied, not three
    expect(STAT_ORDER.filter((stat) => getIV(ivs, stat) > 0)).toHaveLength(INHERITED_IVS);
  });

  it('takes the stat off its holder rather than off either parent', () => {
    const plain = parent(Species.Bulbasaur, Genders.Male, 31);
    const holder = parent(Species.Bulbasaur, Genders.Female, 15, [], { powerStat: Stats.Speed });

    // Every drawn copy comes off the left parent at this floor, so the
    // 15 can only have come from the item
    expect(
      getIV(
        inheritIVs(plain, holder, () => 0),
        Stats.Speed,
      ),
    ).toBe(15);
  });

  it('forces one stat however many are being worn', () => {
    const left = parent(Species.Bulbasaur, Genders.Male, 31, [], { powerStat: Stats.Attack });
    const right = parent(Species.Bulbasaur, Genders.Female, 15, [], { powerStat: Stats.Speed });
    const ivs = inheritIVs(left, right, () => 0);

    // The floor picks the left holder, so Attack is forced and Speed
    // is left to the draw — which rolls it to nothing
    expect(getIV(ivs, Stats.Attack)).toBe(31);
    expect(getIV(ivs, Stats.Speed)).toBe(0);
  });
});

describe('a two-species line', () => {
  it('rolls which half of Nidoran is in the shell', () => {
    expect(rollEggSpecies(Species.NidoranF, () => 0)).toBe(Species.NidoranF);
    expect(rollEggSpecies(Species.NidoranF, () => 0.9)).toBe(Species.NidoranM);
    // The male half lays the same pair, for the Ditto pairing that is
    // the only way it is ever the parent an egg is read off
    expect(rollEggSpecies(Species.NidoranM, () => 0.9)).toBe(Species.NidoranM);
    expect(rollEggSpecies(Species.NidoranM, () => 0)).toBe(Species.NidoranF);

    // Everything else is only ever itself
    expect(rollEggSpecies(Species.Bulbasaur, () => 0.9)).toBe(Species.Bulbasaur);
  });

  it('still reads the line off the mother', () => {
    // The pair answers her line; which half of it hatched is the
    // roll's business, not the pairing's
    expect(
      getEggSpecies(
        parent(Species.NidoranM, Genders.Male, 0),
        parent(Species.Nidorina, Genders.Female, 0),
      ),
    ).toBe(Species.NidoranF);
  });
});

describe('inherited ability', () => {
  it('comes off the mother, and not every time', () => {
    const mother = parent(Species.Bulbasaur, Genders.Female, 0, [], {
      ability: Abilities.Overgrow,
    });
    const father = parent(Species.Bulbasaur, Genders.Male, 0, [], {
      ability: Abilities.Chlorophyll,
    });

    expect(inheritAbility(Species.Bulbasaur, father, mother, () => 0)).toBe(Abilities.Overgrow);
    expect(
      inheritAbility(Species.Bulbasaur, father, mother, () => ABILITY_INHERITANCE_CHANCE),
    ).toBeNull();
  });

  it('passes a hidden ability across a narrower gap', () => {
    const mother = parent(Species.Bulbasaur, Genders.Female, 0, [], {
      ability: Abilities.Chlorophyll,
    });
    const father = parent(Species.Bulbasaur, Genders.Male, 0);
    const between = (HIDDEN_ABILITY_INHERITANCE_CHANCE + ABILITY_INHERITANCE_CHANCE) / 2;

    expect(inheritAbility(Species.Bulbasaur, father, mother, () => 0)).toBe(Abilities.Chlorophyll);
    // A draw an ordinary ability would have survived, and this one
    // does not
    expect(inheritAbility(Species.Bulbasaur, father, mother, () => between)).toBeNull();
  });

  it('refuses an ability the egg’s own line has never had', () => {
    // A cross-group pair can leave the mother holding something the
    // hatchling could not have
    const mother = parent(Species.Vulpix, Genders.Female, 0, [], { ability: Abilities.FlashFire });
    const father = parent(Species.Rattata, Genders.Male, 0);

    expect(inheritAbility(Species.Rattata, father, mother, () => 0)).toBeNull();
  });
});

describe('the ball an egg is laid into', () => {
  it('is the mother’s own', () => {
    const mother = parent(Species.Bulbasaur, Genders.Female, 0, [], { ball: Balls.LuxuryBall });
    const father = parent(Species.Bulbasaur, Genders.Male, 0, [], { ball: Balls.DuskBall });

    expect(inheritBall(father, mother)).toBe(Balls.LuxuryBall);
    expect(inheritBall(mother, father)).toBe(Balls.LuxuryBall);

    // A Ditto stands in for her, so the ball is the other parent's
    expect(inheritBall(parent(Species.Ditto, Genders.Genderless, 0), father)).toBe(Balls.DuskBall);
  });

  it('is never a Master Ball', () => {
    const mother = parent(Species.Bulbasaur, Genders.Female, 0, [], { ball: Balls.MasterBall });
    const father = parent(Species.Bulbasaur, Genders.Male, 0);

    expect(inheritBall(father, mother)).toBe(Balls.PokeBall);
  });
});

describe('what an egg costs to open', () => {
  it('is what its own species costs, not one figure for the dex', () => {
    expect(getEggHatchSteps(Species.Magikarp)).toBe(
      getEggCycles(Species.Magikarp) * STEPS_PER_EGG_CYCLE,
    );
    // The ordinary egg is the one the shared constant describes
    expect(getEggHatchSteps(Species.Bulbasaur)).toBe(EGG_HATCH_STEPS);
    expect(getEggCycles(Species.Bulbasaur)).toBe(DEFAULT_EGG_CYCLES);

    // And the ends of the table are a long way apart
    expect(getEggHatchSteps(Species.Magikarp)).toBeLessThan(getEggHatchSteps(Species.Bulbasaur));
    expect(getEggHatchSteps(Species.Snorlax)).toBeGreaterThan(getEggHatchSteps(Species.Bulbasaur));
  });

  it('is the line’s figure, whichever stage is asked', () => {
    // A raid can hand out an egg of something already evolved, and a
    // Gyarados egg is still a Magikarp's walk
    expect(getEggCycles(Species.Gyarados)).toBe(getEggCycles(Species.Magikarp));
    expect(getEggCycles(Species.Dragonite)).toBe(getEggCycles(Species.Dratini));
    expect(getEggCycles(Species.Golem)).toBe(getEggCycles(Species.Geodude));
  });
});

describe('inherited shadow', () => {
  it('comes only from a shadow parent, and only half the time', () => {
    const plain = parent(Species.Bulbasaur, Genders.Male, 0);
    const shadow = parent(Species.Bulbasaur, Genders.Female, 0, [], { shadow: true });

    expect(inheritsShadow(plain, plain, () => 0)).toBe(false);
    expect(inheritsShadow(plain, shadow, () => 0)).toBe(true);
    expect(inheritsShadow(shadow, plain, () => SHADOW_INHERITANCE_CHANCE)).toBe(false);
    // Two shadows are no more certain than one
    expect(inheritsShadow(shadow, shadow, () => 0.9)).toBe(false);
  });
});

describe('inherited nature', () => {
  it('comes from whichever parent is holding the Everstone', () => {
    const plain = parent(Species.Bulbasaur, Genders.Male, 0, [], { nature: Natures.Adamant });
    const held = parent(Species.Bulbasaur, Genders.Female, 0, [], {
      nature: Natures.Modest,
      everstone: true,
    });

    // Nobody holding one: the egg rolls its own, so nothing is passed
    expect(inheritNature(plain, plain, () => 0)).toBeNull();

    expect(inheritNature(plain, held, () => 0)).toBe(Natures.Modest);
    expect(inheritNature(held, plain, () => 0.999)).toBe(Natures.Modest);
  });

  it('picks between two stones rather than always taking the first', () => {
    const left = parent(Species.Bulbasaur, Genders.Male, 0, [], {
      nature: Natures.Adamant,
      everstone: true,
    });
    const right = parent(Species.Bulbasaur, Genders.Female, 0, [], {
      nature: Natures.Modest,
      everstone: true,
    });

    expect(inheritNature(left, right, () => 0)).toBe(Natures.Adamant);
    expect(inheritNature(left, right, () => 0.9)).toBe(Natures.Modest);
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

  it('hands down a move both parents know, years before it is due', () => {
    const hatchesWith = new Set(deriveMoves(Species.Bulbasaur, EGG_LEVEL));
    // Something the line is owed much later, so a hatchling knowing it
    // can only have been given it
    const late = findMove(
      getLevelUpMoves(Species.Bulbasaur, MAX_LEVEL),
      (move) => !hatchesWith.has(move),
    );
    const father = parent(Species.Bulbasaur, Genders.Male, 0, [late]);
    const mother = parent(Species.Bulbasaur, Genders.Female, 0, [late]);

    expect(inheritMoves(Species.Bulbasaur, father, mother, EGG_LEVEL)).toContain(late);

    // One parent knowing it is not enough: it is the pair that teaches
    const alone = parent(Species.Bulbasaur, Genders.Female, 0);

    expect(inheritMoves(Species.Bulbasaur, father, alone, EGG_LEVEL)).not.toContain(late);
  });

  it('hands down nothing the line could not have levelled into', () => {
    const learnable = new Set(getLevelUpMoves(Species.Bulbasaur, MAX_LEVEL));
    const inheritable = new Set(getEggMoves(Species.Bulbasaur));
    const foreign = findMove(
      getLevelUpMoves(Species.Pikachu, MAX_LEVEL),
      (move) => !learnable.has(move) && !inheritable.has(move),
    );
    const passed = inheritMoves(
      Species.Bulbasaur,
      parent(Species.Bulbasaur, Genders.Male, 0, [foreign]),
      parent(Species.Bulbasaur, Genders.Female, 0, [foreign]),
      EGG_LEVEL,
    );

    expect(passed).not.toContain(foreign);
    expect(passed).toEqual(deriveMoves(Species.Bulbasaur, EGG_LEVEL));
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
