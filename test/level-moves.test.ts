import { beforeAll, describe, expect, it } from 'vitest';
import { asCaughtPokemon } from '../src/auth/caught-record';
import { Moves } from '../src/data/ids/moves';
import { Species } from '../src/data/ids/species';
import registerGameData from '../src/data';
import { getLevelMoves, getLevelMovesBetween } from '../src/components/items/use-item';

/**
 * What a run of candy presses has to offer.
 *
 * The catch sheet gathers a run of presses into one feeding, so a
 * pokemon can pass through twenty levels between two reads of its
 * record. Every move it went through is as much its own as the one it
 * stopped on.
 */

beforeAll(() => {
  registerGameData();
});

/** One of the player's pokemon, with only what these tests care about set */
function pokemon(fields: Record<string, unknown>): ReturnType<typeof asCaughtPokemon> {
  return asCaughtPokemon({ owner: 'trainer', species: Species.Bulbasaur, level: 5, ...fields });
}

describe('the moves a run of levels offers', () => {
  it('hands over every level crossed, in the order they were grown through', () => {
    // Bulbasaur learns at 7, 10, 15, 20 and 25, so a jump from five to
    // twenty-five crosses all of them
    const caught = pokemon({ level: 5, moves: [Moves.Tackle, Moves.Growl] });

    expect(getLevelMovesBetween(caught, 6, 25)).toEqual([
      Moves.LeechSeed,
      Moves.VineWhip,
      Moves.PoisonPowder,
      Moves.SleepPowder,
      Moves.RazorLeaf,
      Moves.SweetScent,
    ]);
  });

  it('is the same list a level at a time would have given', () => {
    const caught = pokemon({ level: 5, moves: [Moves.Tackle, Moves.Growl] });
    const one: Moves[] = [];

    for (let level = 6; level <= 25; level++) {
      one.push(...getLevelMoves(caught, level));
    }
    expect(getLevelMovesBetween(caught, 6, 25)).toEqual(one);
  });

  it('leaves out what the pokemon already knows', () => {
    const caught = pokemon({ level: 5, moves: [Moves.VineWhip, Moves.RazorLeaf] });

    expect(getLevelMovesBetween(caught, 6, 25)).toEqual([
      Moves.LeechSeed,
      Moves.PoisonPowder,
      Moves.SleepPowder,
      Moves.SweetScent,
    ]);
  });

  it('asks about a move listed at two of the levels once', () => {
    // Nothing in the game does this today, and a learnset that did
    // would otherwise ask the same question twice in one feeding
    const caught = asCaughtPokemon({
      owner: 'trainer',
      species: Species.Bulbasaur,
      level: 5,
      moves: [],
    });
    const learned = getLevelMovesBetween(caught, 1, 46);

    expect(new Set(learned).size).toBe(learned.length);
  });

  it('offers nothing for a run that crosses no threshold', () => {
    const caught = pokemon({ level: 20, moves: [] });

    expect(getLevelMovesBetween(caught, 21, 24)).toEqual([]);
  });

  it('offers nothing at all for an egg, however far it is carried', () => {
    const caught = pokemon({ level: 5, moves: [], egg: true, hatchSteps: 2560, steps: 10 });

    expect(getLevelMovesBetween(caught, 6, 46)).toEqual([]);
  });
});
