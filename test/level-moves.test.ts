import { beforeAll, describe, expect, it } from 'vitest';
import { asCaughtPokemon } from '../src/auth/caught-record';
import { Moves } from '../src/data/ids/moves';
import { Species } from '../src/data/ids/species';
import registerGameData from '../src/data';
import {
  getLevelMoves,
  getLevelMovesBetween,
  nextOfferLevel,
} from '../src/components/items/use-item';

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
    // Bulbasaur learns at 3, then every third level from 6 to 24, so a
    // jump from five to twenty-five crosses all of those
    const caught = pokemon({ level: 5, moves: [Moves.Tackle, Moves.Growl] });

    expect(getLevelMovesBetween(caught, 6, 25)).toEqual([
      Moves.Growth,
      Moves.LeechSeed,
      Moves.RazorLeaf,
      Moves.PoisonPowder,
      Moves.SleepPowder,
      Moves.SeedBomb,
      Moves.TakeDown,
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
      Moves.Growth,
      Moves.LeechSeed,
      Moves.PoisonPowder,
      Moves.SleepPowder,
      Moves.SeedBomb,
      Moves.TakeDown,
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
    const caught = pokemon({ level: 21, moves: [] });

    expect(getLevelMovesBetween(caught, 22, 23)).toEqual([]);
  });

  it('offers nothing at all for an egg, however far it is carried', () => {
    const caught = pokemon({ level: 5, moves: [], egg: true, hatchSteps: 2560, steps: 10 });

    expect(getLevelMovesBetween(caught, 6, 46)).toEqual([]);
  });
});

/**
 * Where a run of candy presses has to stop.
 *
 * The store teaches a levelled move only while the pokemon is
 * standing on the level that offers it, so a feeding lands on each of
 * those levels and settles it before going on. Everything between two
 * of them goes over in one call
 */
describe('the next level that asks a question', () => {
  // Bulbasaur learns at 1, 3, and every third level from 6 to 36
  it('names the next threshold above the level given', () => {
    const caught = pokemon({ level: 5, moves: [Moves.Tackle, Moves.Growl] });

    expect(nextOfferLevel(caught, 5)).toBe(6);
    expect(nextOfferLevel(caught, 6)).toBe(9);
    expect(nextOfferLevel(caught, 23)).toBe(24);
  });

  it('steps over a threshold whose move the pokemon already knows', () => {
    // Everything level 6 offers is already on it, so the run has no
    // reason to stop there
    const knows = getLevelMoves(pokemon({ level: 5, moves: [] }), 6);
    const caught = pokemon({ level: 5, moves: knows });

    expect(nextOfferLevel(caught, 5)).toBe(9);
  });

  it('answers null once nothing above asks anything', () => {
    const caught = pokemon({ level: 46, moves: [] });

    expect(nextOfferLevel(caught, 46)).toBeNull();
  });

  it('answers null for an egg, which has learned nothing yet', () => {
    const caught = pokemon({ level: 5, moves: [], egg: true, hatchSteps: 2560, steps: 10 });

    expect(nextOfferLevel(caught, 5)).toBeNull();
  });

  it('stops on every level a run would cross, and nowhere else', () => {
    // Walking the run the way the sheet does: land on the next
    // threshold, offer it, ask again from there
    const caught = pokemon({ level: 5, moves: [Moves.Tackle, Moves.Growl] });
    const stops: number[] = [];

    for (let at = 5; at < 25;) {
      const asks = nextOfferLevel(caught, at);

      if (asks == null || asks > 25) {
        break;
      }
      stops.push(asks);
      at = asks;
    }
    expect(stops).toEqual([6, 9, 12, 15, 18, 21, 24]);
    // And every one of them has something to offer
    for (const stop of stops) {
      expect(getLevelMoves(caught, stop).length).toBeGreaterThan(0);
    }
  });
});
