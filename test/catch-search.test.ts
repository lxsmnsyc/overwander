import { beforeAll, describe, expect, it } from 'vitest';
import Abilities from '../src/data/ids/abilities';
import { EncounterType } from '../src/overworld/encounter';
import { Genders, Species } from '../src/data/ids/species';
import Natures from '../src/data/ids/natures';
import { PERFECT_IVS } from '../src/data/constants/stats';
import { Balls, Items } from '../src/data/ids/items';
import { Moves } from '../src/data/ids/moves';
import { asCaughtPokemon } from '../src/auth/caught-record';
import matchesCatch, { planCatchSearch } from '../src/auth/catch-search';
import parseQuery from '../src/core/query';
import registerGameData from '../src/data';

beforeAll(() => {
  registerGameData();
});

/** One of the player's pokemon, with only what a test cares about set */
function pokemon(fields: Record<string, unknown>): ReturnType<typeof asCaughtPokemon> {
  return asCaughtPokemon({ owner: 'trainer', species: Species.Charmander, level: 20, ...fields });
}

describe('search syntax', () => {
  it('reads a plain word as a plain word', () => {
    expect(parseQuery('pikachu')).toEqual([{ field: '', value: 'pikachu' }]);
  });

  it('reads a pair, and keeps the value as it was typed', () => {
    expect(parseQuery('type:Fire')).toEqual([{ field: 'type', value: 'Fire' }]);
  });

  it('keeps a quoted value in one piece', () => {
    expect(parseQuery('move:"Solar Beam"')).toEqual([{ field: 'move', value: 'Solar Beam' }]);
    expect(parseQuery('"little guy"')).toEqual([{ field: '', value: 'little guy' }]);
  });

  it('takes several terms at once', () => {
    expect(parseQuery('shiny:1  type:fire  sparky')).toEqual([
      { field: 'shiny', value: '1' },
      { field: 'type', value: 'fire' },
      { field: '', value: 'sparky' },
    ]);
  });

  it('asks nothing of an empty box', () => {
    expect(parseQuery('   ')).toEqual([]);
  });
});

describe('searching a box of pokemon', () => {
  it('matches everything while nothing has been typed', () => {
    expect(matchesCatch(pokemon({}), '')).toBe(true);
  });

  it('finds one by its species or by the name its owner gave it', () => {
    const named = pokemon({ nickname: 'Sparky' });

    expect(matchesCatch(named, 'sparky')).toBe(true);
    expect(matchesCatch(named, 'charmander')).toBe(true);
    expect(matchesCatch(named, 'squirtle')).toBe(false);
  });

  it('narrows rather than widens: every term has to be answered', () => {
    const shiny = pokemon({ shiny: true, level: 40 });

    expect(matchesCatch(shiny, 'is:shiny level:30-50')).toBe(true);
    expect(matchesCatch(shiny, 'is:shiny level:60-70')).toBe(false);
  });

  it('answers two of the same field as both', () => {
    const charizard = pokemon({ species: Species.Charizard });

    expect(matchesCatch(charizard, 'type:fire type:flying')).toBe(true);
    expect(matchesCatch(charizard, 'type:fire type:water')).toBe(false);
  });

  it('reads a level as one number or as a range with either end open', () => {
    const grown = pokemon({ level: 45 });

    expect(matchesCatch(grown, 'level:45')).toBe(true);
    expect(matchesCatch(grown, 'level:44')).toBe(false);
    expect(matchesCatch(grown, 'level:40-50')).toBe(true);
    expect(matchesCatch(grown, 'level:50-')).toBe(false);
    expect(matchesCatch(grown, 'level:-50')).toBe(true);
  });

  it('knows what it is carrying, what it knows and what it can do', () => {
    const armed = pokemon({
      moves: [Moves.Ember, Moves.Growl],
      abilities: [Abilities.Blaze],
      items: [Items.Charcoal],
    });

    expect(matchesCatch(armed, 'move:ember')).toBe(true);
    expect(matchesCatch(armed, 'move:surf')).toBe(false);
    expect(matchesCatch(armed, 'ability:blaze')).toBe(true);
    expect(matchesCatch(armed, 'item:charcoal')).toBe(true);
    expect(matchesCatch(armed, 'family:charmander')).toBe(true);
  });

  it('reads the marks the player put on it', () => {
    const kept = pokemon({ favorite: true, guarded: true });

    expect(matchesCatch(kept, 'is:favorite is:locked')).toBe(true);
    expect(matchesCatch(kept, 'not:favorite')).toBe(false);
    expect(matchesCatch(pokemon({}), 'not:locked')).toBe(true);
  });

  it('refuses a term it cannot answer rather than ignoring it', () => {
    // A field nobody has heard of, and a yes-or-no term that says
    // neither: both come back empty, since the alternative is a search
    // that quietly drops the half that was typed most carefully
    expect(matchesCatch(pokemon({ shiny: true }), 'colour:red')).toBe(false);
    expect(matchesCatch(pokemon({ shiny: true }), 'is:sparkly')).toBe(false);
  });

  it('gives nothing away about what is inside an egg', () => {
    const egg = pokemon({ egg: true, shiny: true, species: Species.Charmander, favorite: true });

    expect(matchesCatch(egg, 'egg')).toBe(true);
    expect(matchesCatch(egg, 'charmander')).toBe(false);
    expect(matchesCatch(egg, 'type:fire')).toBe(false);
    expect(matchesCatch(egg, 'is:shiny')).toBe(false);
    // Even the answer "no" would say something, so a coat question is
    // unanswerable either way round
    expect(matchesCatch(egg, 'not:shiny')).toBe(false);
    // What its owner marked is theirs to search
    expect(matchesCatch(egg, 'is:favorite')).toBe(true);
    expect(matchesCatch(egg, 'is:egg')).toBe(true);
  });
});

describe('planning the store half of a search', () => {
  it('asks nothing of the store for a plain name', () => {
    // No document store answers "holds these letters somewhere", so a
    // name is read and filtered rather than queried
    expect(planCatchSearch('charmander')).toEqual([]);
  });

  it('pushes a mark down as an equality', () => {
    expect(planCatchSearch('is:shiny')).toEqual([{ field: 'shiny', is: true }]);
    // The player's own mark is stored under the record's word for it
    expect(planCatchSearch('not:locked')).toEqual([{ field: 'guarded', is: false }]);
    // A word no mark answers to asks nothing of the store
    expect(planCatchSearch('is:sparkly')).toEqual([]);
  });

  it('turns a level into a range, and one number into a range of one', () => {
    expect(planCatchSearch('level:30-60')).toEqual([{ field: 'level', low: 30, high: 60 }]);
    expect(planCatchSearch('level:45')).toEqual([{ field: 'level', low: 45, high: 45 }]);
  });

  it('names a move only when the word means exactly one of them', () => {
    expect(planCatchSearch('move:ember')).toEqual([{ field: 'moves', has: Moves.Ember }]);
    // "beam" is several moves, and a query has to name an id
    expect(planCatchSearch('move:beam')).toEqual([]);
  });

  it('names an ability the same way it names a move', () => {
    expect(planCatchSearch('ability:blaze')).toEqual([
      { field: 'abilities', has: Abilities.Blaze },
    ]);
  });

  it('expands a family into the species it holds', () => {
    const [planned] = planCatchSearch('family:charmander');

    expect(planned).toBeDefined();
    expect(planned).toHaveProperty('field', 'species');
    expect('oneOf' in planned ? planned.oneOf : []).toContain(Species.Charizard);
  });

  it('pushes one term and no more, choosing the narrowest', () => {
    // Every field asked beside the owner needs its own composite
    // index; one keeps that list one entry per field
    expect(planCatchSearch('shiny:1 move:ember level:10-90')).toEqual([
      { field: 'moves', has: Moves.Ember },
    ]);
  });

  it('never pushes what it cannot answer exactly', () => {
    expect(planCatchSearch('is:sparkly')).toEqual([]);
    expect(planCatchSearch('colour:red')).toEqual([]);
  });
});

describe('the fields added for the query builder', () => {
  it('reads what the record states about itself', () => {
    const caught = pokemon({
      nature: Natures.Adamant,
      gender: Genders.Female,
      ball: Balls.UltraBall,
      type: EncounterType.Rocket,
      traded: true,
      auctionable: true,
    });

    expect(matchesCatch(caught, 'nature:adamant')).toBe(true);
    expect(matchesCatch(caught, 'nature:timid')).toBe(false);
    expect(matchesCatch(caught, 'gender:female')).toBe(true);
    expect(matchesCatch(caught, 'ball:ultra')).toBe(true);
    expect(matchesCatch(caught, 'met:rocket')).toBe(true);
    expect(matchesCatch(caught, 'is:traded is:auctionable')).toBe(true);
  });

  it('knows a perfect spread, and nothing else about the values', () => {
    expect(matchesCatch(pokemon({ ivs: PERFECT_IVS }), 'is:perfect')).toBe(true);
    expect(matchesCatch(pokemon({ ivs: 0 }), 'is:perfect')).toBe(false);
    // Anything else is a word this does not know
    expect(matchesCatch(pokemon({ ivs: PERFECT_IVS }), 'is:flawless')).toBe(false);
  });

  it('answers what a fight left it as', () => {
    expect(matchesCatch(pokemon({ health: 0 }), 'is:fainted')).toBe(true);
    expect(matchesCatch(pokemon({ health: 20 }), 'is:fainted')).toBe(false);
    expect(matchesCatch(pokemon({ health: 20 }), 'not:fainted')).toBe(true);
  });

  it('counts the walking, the friendship and the hatching', () => {
    const carried = pokemon({ friendship: 200, walked: 4_000, steps: 1_500 });

    expect(matchesCatch(carried, 'friendship:150-255')).toBe(true);
    expect(matchesCatch(carried, 'walked:5000-')).toBe(false);
    expect(matchesCatch(carried, 'steps:-2000')).toBe(true);
  });

  it('reads the date by the front of the stamp', () => {
    const stamped = pokemon({ caughtAt: '2026-08-10T22:14:03.123+08:00' });

    expect(matchesCatch(stamped, 'caught:2026-08')).toBe(true);
    expect(matchesCatch(stamped, 'caught:2026-08-10')).toBe(true);
    expect(matchesCatch(stamped, 'caught:2026-07')).toBe(false);
  });

  it('pushes each of them down as the store would ask it', () => {
    expect(planCatchSearch('nature:adamant')).toEqual([
      { field: 'nature', equals: Natures.Adamant },
    ]);
    expect(planCatchSearch('gender:female')).toEqual([{ field: 'gender', equals: Genders.Female }]);
    expect(planCatchSearch('ball:ultra')).toEqual([{ field: 'ball', equals: Balls.UltraBall }]);
    expect(planCatchSearch('met:rocket')).toEqual([
      { field: 'type', equals: EncounterType.Rocket },
    ]);
    expect(planCatchSearch('is:perfect')).toEqual([{ field: 'ivs', equals: PERFECT_IVS }]);
    expect(planCatchSearch('is:traded')).toEqual([{ field: 'traded', is: true }]);
    expect(planCatchSearch('not:egg')).toEqual([{ field: 'egg', is: false }]);
    expect(planCatchSearch('is:fainted')).toEqual([{ field: 'health', low: 0, high: 0 }]);
    expect(planCatchSearch('friendship:150-255')).toEqual([
      { field: 'friendship', low: 150, high: 255 },
    ]);
    expect(planCatchSearch('caught:2026-08')).toEqual([{ field: 'caughtAt', prefix: '2026-08' }]);
  });

  it('turns fighting into the same line the lock is drawn at', () => {
    const [live] = planCatchSearch('is:fighting');
    const [free] = planCatchSearch('not:fighting');

    expect(live).toHaveProperty('field', 'lockedAt');
    expect(free).toHaveProperty('field', 'lockedAt');
    // One is everything since the cutoff, the other everything before
    expect('high' in live ? live.high : 0).toBe(Number.POSITIVE_INFINITY);
    expect('low' in free ? free.low : 0).toBe(Number.NEGATIVE_INFINITY);
  });

  it('leaves the elemental type to the runtime, whatever its size', () => {
    // A search that pushed fire and read water would be quick for one
    // half of the game and slow for the other, which is worse than
    // being the same either way
    expect(planCatchSearch('type:fire')).toEqual([]);
    expect(matchesCatch(pokemon({ species: Species.Charmander }), 'type:fire')).toBe(true);
  });
});
