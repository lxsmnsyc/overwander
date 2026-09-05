import { beforeAll, describe, expect, it } from 'vitest';
import Abilities from '../src/data/ids/abilities';
import { EncounterType } from '../src/overworld/encounter';
import { Genders, Species } from '../src/data/ids/species';
import Natures from '../src/data/ids/natures';
import { PERFECT_IVS, packIVs } from '../src/data/constants/stats';
import { Balls, Items } from '../src/data/ids/items';
import { Moves } from '../src/data/ids/moves';
import { Acquisition, asCaughtPokemon } from '../src/auth/caught-record';
import Biome from '../src/data/ids/biome';
import { BIOME_NAMES } from '../src/data/biome/names';
import { getMaxHealth } from '../src/auth/health';
import { getSpeciesData } from '../src/data/species';
import matchesCatch, {
  CATCH_VOCABULARY,
  orderCatches,
  planCatchSearch,
} from '../src/auth/catch-search';
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
    expect(parseQuery('pikachu')).toEqual([{ field: '', value: 'pikachu', negated: false }]);
  });

  it('reads a pair, and keeps the value as it was typed', () => {
    expect(parseQuery('type:Fire')).toEqual([{ field: 'type', value: 'Fire', negated: false }]);
  });

  it('keeps a quoted value in one piece', () => {
    expect(parseQuery('move:"Solar Beam"')).toEqual([
      { field: 'move', value: 'Solar Beam', negated: false },
    ]);
    expect(parseQuery('"little guy"')).toEqual([
      { field: '', value: 'little guy', negated: false },
    ]);
  });

  it('takes several terms at once', () => {
    expect(parseQuery('shiny:1  type:fire  sparky')).toEqual([
      { field: 'shiny', value: '1', negated: false },
      { field: 'type', value: 'fire', negated: false },
      { field: '', value: 'sparky', negated: false },
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
    expect(planCatchSearch('is:shiny')).toEqual([
      { on: 'row', column: 'shiny', op: 'eq', value: true },
    ]);
    // The player's own mark is stored under the record's word for it
    expect(planCatchSearch('not:locked')).toEqual([
      { on: 'row', column: 'guarded', op: 'eq', value: false },
    ]);
    // A word no mark answers to asks nothing of the store
    expect(planCatchSearch('is:sparkly')).toEqual([]);
  });

  it('turns a level into a pair of bounds, and one number into an equality', () => {
    expect(planCatchSearch('level:30-60')).toEqual([
      { on: 'row', column: 'level', op: 'gte', value: 30 },
      { on: 'row', column: 'level', op: 'lte', value: 60 },
    ]);
    expect(planCatchSearch('level:45')).toEqual([
      { on: 'row', column: 'level', op: 'eq', value: 45 },
    ]);
    // An end nobody named is left off rather than pushed as an infinity
    expect(planCatchSearch('level:50-')).toEqual([
      { on: 'row', column: 'level', op: 'gte', value: 50 },
    ]);
    expect(planCatchSearch('level:>50')).toEqual([
      { on: 'row', column: 'level', op: 'gt', value: 50 },
    ]);
  });

  it('joins the child tables, each term on an alias of its own', () => {
    expect(planCatchSearch('move:ember')).toEqual([
      {
        on: 'child',
        alias: 'q0',
        table: 'caught_moves',
        column: 'move',
        op: 'eq',
        value: Moves.Ember,
      },
    ]);
    // Two moves are two joins: one alias asked to be both moves at
    // once is a row that cannot exist
    const both = planCatchSearch('move:ember move:growl');

    expect(both).toHaveLength(2);
    expect(both[0]).toHaveProperty('alias', 'q0');
    expect(both[1]).toHaveProperty('alias', 'q1');
  });

  it('expands a family into the species it holds', () => {
    const [planned] = planCatchSearch('family:charmander');

    expect(planned).toBeDefined();
    expect(planned).toHaveProperty('column', 'species');
    expect(planned).toHaveProperty('op', 'in');
    expect('value' in planned ? planned.value : []).toContain(Species.Charizard);
  });

  it('pushes every term the store can answer, in query order', () => {
    // One WHERE takes them all: the one-push rule was a composite
    // index economy the relational store does not need
    expect(planCatchSearch('is:shiny move:ember level:10-90')).toEqual([
      { on: 'row', column: 'shiny', op: 'eq', value: true },
      {
        on: 'child',
        alias: 'q1',
        table: 'caught_moves',
        column: 'move',
        op: 'eq',
        value: Moves.Ember,
      },
      { on: 'row', column: 'level', op: 'gte', value: 10 },
      { on: 'row', column: 'level', op: 'lte', value: 90 },
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
      { on: 'row', column: 'nature', op: 'eq', value: Natures.Adamant },
    ]);
    expect(planCatchSearch('gender:female')).toEqual([
      { on: 'row', column: 'gender', op: 'eq', value: Genders.Female },
    ]);
    expect(planCatchSearch('ball:ultra')).toEqual([
      { on: 'row', column: 'ball', op: 'eq', value: Balls.UltraBall },
    ]);
    expect(planCatchSearch('met:rocket')).toEqual([
      { on: 'row', column: 'type', op: 'eq', value: EncounterType.Rocket },
    ]);
    expect(planCatchSearch('is:perfect')).toEqual([
      { on: 'row', column: 'ivs', op: 'eq', value: PERFECT_IVS },
    ]);
    expect(planCatchSearch('is:traded')).toEqual([
      { on: 'row', column: 'traded', op: 'eq', value: true },
    ]);
    expect(planCatchSearch('not:egg')).toEqual([
      { on: 'row', column: 'egg', op: 'eq', value: false },
    ]);
    expect(planCatchSearch('is:fainted')).toEqual([
      { on: 'row', column: 'health', op: 'eq', value: 0 },
    ]);
    expect(planCatchSearch('friendship:150-255')).toEqual([
      { on: 'row', column: 'friendship', op: 'gte', value: 150 },
      { on: 'row', column: 'friendship', op: 'lte', value: 255 },
    ]);
  });

  it('turns a written date into bounds on the stamp', () => {
    // The stamp is a column now, so a month is the span between its
    // first instant and the first instant of the month after it
    expect(planCatchSearch('caught:2026-08')).toEqual([
      { on: 'row', column: 'caught_at_local', op: 'gte', value: '2026-08-01T00:00:00' },
      { on: 'row', column: 'caught_at_local', op: 'lt', value: '2026-09-01T00:00:00' },
    ]);
  });

  it('turns fighting into the same line the lock is drawn at', () => {
    const [live] = planCatchSearch('is:fighting');
    const [free] = planCatchSearch('not:fighting');

    expect(live).toHaveProperty('column', 'locked_at');
    expect(free).toHaveProperty('column', 'locked_at');
    // One is everything since the cutoff, the other everything before
    expect(live).toHaveProperty('op', 'gt');
    expect(free).toHaveProperty('op', 'lte');
  });

  it('leaves the elemental type to the runtime', () => {
    // A search that pushed fire and read water would be quick for one
    // half of the game and slow for the other, which is worse than
    // being the same either way
    expect(planCatchSearch('type:fire')).toEqual([]);
    expect(matchesCatch(pokemon({ species: Species.Charmander }), 'type:fire')).toBe(true);
  });
});

describe('the grammar a term is written in', () => {
  it('refuses a term written with a ! in front of it', () => {
    const shiny = pokemon({ shiny: true, level: 40 });

    expect(matchesCatch(shiny, '!is:shiny')).toBe(false);
    expect(matchesCatch(shiny, '!level:10-20')).toBe(true);
    // A plain word refuses the same way
    expect(matchesCatch(shiny, '!squirtle')).toBe(true);
    expect(matchesCatch(shiny, '!charmander')).toBe(false);
  });

  it('leaves a dash alone, since values are full of them', () => {
    const grown = pokemon({ level: 45, caughtAt: '2026-08-10T22:14:03.123+08:00' });

    // The refusal mark moved off `-` so a range and a written date read
    // as themselves rather than as a term somebody refused
    expect(matchesCatch(grown, 'level:40-50')).toBe(true);
    expect(matchesCatch(grown, 'caught:2026-08')).toBe(true);
    expect(parseQuery('-50')).toEqual([{ field: '', value: '-50', negated: false }]);
  });

  it('accepts any alternative of a value split on a bar', () => {
    expect(matchesCatch(pokemon({ species: Species.Charmander }), 'type:water|fire')).toBe(true);
    expect(matchesCatch(pokemon({ species: Species.Charmander }), 'type:water|grass')).toBe(false);
    expect(matchesCatch(pokemon({ level: 40 }), 'level:10|40')).toBe(true);
    expect(matchesCatch(pokemon({ shiny: true }), 'is:shadow|shiny')).toBe(true);
  });

  it('reads a comparison as well as a range', () => {
    const grown = pokemon({ level: 45 });

    expect(matchesCatch(grown, 'level:>40')).toBe(true);
    expect(matchesCatch(grown, 'level:>45')).toBe(false);
    expect(matchesCatch(grown, 'level:>=45')).toBe(true);
    expect(matchesCatch(grown, 'level:<50')).toBe(true);
    expect(matchesCatch(grown, 'level:<=44')).toBe(false);
  });

  it('never hides a row for the two terms that only arrange the list', () => {
    // A row cannot fail `sort:level`, and one that tried would empty
    // the box the moment somebody typed it
    expect(matchesCatch(pokemon({}), 'sort:level order:desc')).toBe(true);
    expect(planCatchSearch('sort:level order:desc')).toEqual([]);
  });

  it('puts the answers in the order the search asked for', () => {
    const box = [pokemon({ level: 10 }), pokemon({ level: 50 }), pokemon({ level: 30 })];

    // Highest first when nobody said which way round: a box sorted by
    // level is being asked which the best one is
    expect(orderCatches(box, 'sort:level', (one) => one).map((one) => one.level)).toEqual([
      50, 30, 10,
    ]);
    expect(
      orderCatches(box, 'sort:level order:desc', (one) => one).map((one) => one.level),
    ).toEqual([50, 30, 10]);
    expect(orderCatches(box, 'sort:level order:asc', (one) => one).map((one) => one.level)).toEqual(
      [10, 30, 50],
    );
    // A word nothing reads leaves the box in the order it arrived
    expect(orderCatches(box, 'sort:colour', (one) => one).map((one) => one.level)).toEqual([
      10, 50, 30,
    ]);
  });

  it('only pushes a refusal the store can state exactly', () => {
    expect(planCatchSearch('!is:shiny')).toEqual([
      { on: 'row', column: 'shiny', op: 'neq', value: true },
    ]);
    // A refused range is two of them either side, which is two
    // queries: the second pass answers it instead
    expect(planCatchSearch('!level:30-60')).toEqual([]);
    expect(planCatchSearch('!move:ember')).toEqual([]);
  });

  it('leaves a value with alternatives to the runtime where it cannot be one filter', () => {
    // Two natures are two columns' worth of "either", so the store is
    // asked nothing and the box answers it
    expect(planCatchSearch('level:10|40')).toEqual([]);
    expect(planCatchSearch('is:shiny|shadow')).toEqual([]);
    // Names that resolve to several ids are one `in` rather than none
    expect(planCatchSearch('family:charmander|squirtle')).toHaveLength(1);
  });
});

describe('what the box learned to be asked', () => {
  it('reads where it came from', () => {
    const met = pokemon({
      origin: { timestamp: 0, x: 3, y: 4, biome: Biome.Volcano, place: 'Pallet Town' },
      locale: 'en-PH',
    });

    expect(matchesCatch(met, 'biome:volcano')).toBe(true);
    expect(matchesCatch(met, 'biome:tundra')).toBe(false);
    expect(matchesCatch(met, 'place:pallet')).toBe(true);
    expect(matchesCatch(met, 'locale:en-ph')).toBe(true);
    expect(planCatchSearch('place:pallet')).toEqual([
      { on: 'row', column: 'origin_place', op: 'ilike', value: '%pallet%' },
    ]);
  });

  it('reads the values one stat at a time, and all six together', () => {
    const rolled = pokemon({ ivs: packIVs({ 0: 31, 1: 0, 2: 20, 3: 31, 4: 10, 5: 31 }) });

    expect(matchesCatch(rolled, 'iv:atk:0')).toBe(true);
    expect(matchesCatch(rolled, 'iv:atk:31')).toBe(false);
    expect(matchesCatch(rolled, 'iv:spe:>=28')).toBe(true);
    expect(matchesCatch(rolled, 'iv:120-130')).toBe(true);
    // A stat nobody has heard of refuses the term rather than asking
    // about the whole spread
    expect(matchesCatch(rolled, 'iv:luck:31')).toBe(false);
    expect(planCatchSearch('iv:spe:31')).toEqual([
      { on: 'row', column: 'iv_spe', op: 'eq', value: 31 },
    ]);
  });

  it('reads what a fight left it carrying', () => {
    const hurt = pokemon({ health: 12, statuses: 0b01_0001 });

    expect(matchesCatch(hurt, 'hp:0-20')).toBe(true);
    expect(matchesCatch(hurt, 'status:burn')).toBe(true);
    expect(matchesCatch(hurt, 'status:poison')).toBe(true);
    expect(matchesCatch(hurt, 'status:freeze')).toBe(false);
    expect(planCatchSearch('status:burn')).toEqual([
      { on: 'row', column: 'status_burned', op: 'eq', value: true },
    ]);
  });

  it('counts the steps an egg still has to be carried', () => {
    const egg = pokemon({ egg: true, steps: 900, hatchSteps: 1_000 });

    expect(matchesCatch(egg, 'hatch:-200')).toBe(true);
    expect(matchesCatch(egg, 'hatch:>500')).toBe(false);
    expect(planCatchSearch('hatch:-200')).toEqual([
      { on: 'row', column: 'hatch_left', op: 'lte', value: 200 },
    ]);
  });

  it('reads whose hands it has been through', () => {
    const handed = pokemon({
      traded: true,
      history: [
        {
          owner: '',
          name: 'Red',
          acquiredAt: '2026-01-01T00:00:00+00:00',
          kind: Acquisition.Caught,
        },
        {
          owner: 'trainer',
          acquiredAt: '2026-08-01T00:00:00+00:00',
          kind: Acquisition.Auction,
          paid: 5_000,
        },
      ],
    });

    expect(matchesCatch(handed, 'from:red')).toBe(true);
    expect(matchesCatch(handed, 'from:blue')).toBe(false);
    expect(matchesCatch(handed, 'hands:2')).toBe(true);
    expect(matchesCatch(handed, 'paid:1000-9000')).toBe(true);
    expect(matchesCatch(handed, 'got:auction')).toBe(true);
    expect(planCatchSearch('paid:1000-9000')).toEqual([
      {
        on: 'child',
        alias: 'q0',
        table: 'caught_history',
        column: 'paid',
        op: 'gte',
        value: 1_000,
      },
      {
        on: 'child',
        alias: 'q0',
        table: 'caught_history',
        column: 'paid',
        op: 'lte',
        value: 9_000,
      },
    ]);
  });

  it('answers the marks that need more than the one record', () => {
    const caught = pokemon({ species: Species.Charmander });
    const context = {
      id: 'catch-a',
      buddy: 'catch-a',
      listed: new Set(['catch-b']),
      raiding: new Set(['catch-a']),
      duplicates: new Set([Species.Charmander]),
    };

    expect(matchesCatch(caught, 'is:buddy', context)).toBe(true);
    expect(matchesCatch(caught, 'is:raiding', context)).toBe(true);
    expect(matchesCatch(caught, 'is:listed', context)).toBe(false);
    expect(matchesCatch(caught, 'is:duplicate', context)).toBe(true);
    // A list that read none of it answers no rather than yes: an
    // unanswerable term hides the row, the way an unknown field does
    expect(matchesCatch(caught, 'is:buddy')).toBe(false);
  });

  it('joins the row that would prove one of them', () => {
    expect(planCatchSearch('is:listed')).toEqual([
      { on: 'exists', alias: 'q0', table: 'auctions', equals: { settled: false } },
    ]);
    expect(planCatchSearch('is:raiding')).toEqual([
      { on: 'exists', alias: 'q0', table: 'team_catches', equals: {} },
    ]);
    // The other way round is a row that must not exist, which an inner
    // join cannot say
    expect(planCatchSearch('not:listed')).toEqual([]);
  });

  it('reads the marks about the record itself', () => {
    expect(matchesCatch(pokemon({ nickname: 'Sparky' }), 'is:named')).toBe(true);
    expect(matchesCatch(pokemon({}), 'is:named')).toBe(false);
    expect(matchesCatch(pokemon({ type: EncounterType.Hatched }), 'is:hatched')).toBe(true);
    expect(matchesCatch(pokemon({ level: 100 }), 'is:maxed')).toBe(true);
    expect(matchesCatch(pokemon({ species: Species.Charmander }), 'is:evolvable')).toBe(true);
    expect(matchesCatch(pokemon({ species: Species.Charizard }), 'is:evolvable')).toBe(false);
  });

  it('reads a date as a span, a comparison or the last few days', () => {
    const stamped = pokemon({ caughtAt: '2026-08-10T22:14:03.123+08:00' });

    expect(matchesCatch(stamped, 'caught:2026')).toBe(true);
    expect(matchesCatch(stamped, 'caught:2026-01..2026-08')).toBe(true);
    expect(matchesCatch(stamped, 'caught:2026-01..2026-07')).toBe(false);
    expect(matchesCatch(stamped, 'caught:>2026-07')).toBe(true);
    expect(matchesCatch(stamped, 'caught:<2026-08')).toBe(false);
  });
});

describe('the cheap filters over what the registries already know', () => {
  it('reads health as a share of the maximum, not only as a number', () => {
    const whole = pokemon({ species: Species.Charmander, level: 20 });
    const hurt = pokemon({
      species: Species.Charmander,
      level: 20,
      health: Math.floor(getMaxHealth(whole) / 4),
    });

    expect(matchesCatch(hurt, 'hp:<50%')).toBe(true);
    expect(matchesCatch(hurt, 'hp:>50%')).toBe(false);
    expect(matchesCatch(whole, 'hp:>90%')).toBe(true);
    // The absolute number still answers, for anybody who wants one
    expect(matchesCatch(whole, `hp:${getMaxHealth(whole)}`)).toBe(true);
    // A share is derived from the species, so no query can be asked it
    expect(planCatchSearch('hp:<50%')).toEqual([]);
  });

  it('works one stat out the way a sheet prints it', () => {
    const fast = pokemon({
      species: Species.Charmander,
      level: 50,
      ivs: PERFECT_IVS,
      nature: Natures.Timid,
    });
    const slow = pokemon({
      species: Species.Charmander,
      level: 50,
      ivs: 0,
      nature: Natures.Brave,
    });

    expect(matchesCatch(fast, 'stat:spe:>80')).toBe(true);
    expect(matchesCatch(slow, 'stat:spe:>80')).toBe(false);
    // The stat has to be named: the six added together is not a
    // question anybody is asking
    expect(matchesCatch(fast, 'stat:120')).toBe(false);
    expect(matchesCatch(fast, 'stat:luck:>1')).toBe(false);
  });

  it('answers how a type lands on it, over its own types', () => {
    const charizard = pokemon({ species: Species.Charizard });

    // Fire and Flying: Rock is doubly effective, Ground does nothing
    expect(matchesCatch(charizard, 'weak:rock')).toBe(true);
    expect(matchesCatch(charizard, 'immune:ground')).toBe(true);
    expect(matchesCatch(charizard, 'resists:grass')).toBe(true);
    expect(matchesCatch(charizard, 'weak:grass')).toBe(false);
  });

  it('reads the state a fight left it in', () => {
    const whole = pokemon({ species: Species.Charmander, level: 20 });

    expect(matchesCatch(pokemon({ health: 5 }), 'is:hurt')).toBe(true);
    expect(matchesCatch(whole, 'is:hurt')).toBe(false);
    expect(matchesCatch(pokemon({ statuses: 0b01_0000 }), 'is:sick')).toBe(true);
    expect(matchesCatch(whole, 'not:sick')).toBe(true);
    expect(planCatchSearch('is:sick')).toEqual([
      { on: 'row', column: 'statuses', op: 'neq', value: 0 },
    ]);
  });

  it('knows whether a wing is worth spending on it', () => {
    expect(matchesCatch(pokemon({ level: 50 }), 'is:trainable')).toBe(true);
    expect(matchesCatch(pokemon({ level: 0, effortBonus: 0 }), 'is:trainable')).toBe(false);
  });

  it('knows a same-type move and a hidden ability when it sees one', () => {
    const blazing = pokemon({ species: Species.Charmander, moves: [Moves.Ember] });
    const plain = pokemon({ species: Species.Charmander, moves: [Moves.Tackle] });

    expect(matchesCatch(blazing, 'is:stab')).toBe(true);
    expect(matchesCatch(plain, 'is:stab')).toBe(false);

    const [rare] = getSpeciesData(Species.Charmander).hiddenAbilities ?? [];

    expect(rare).toBeDefined();
    expect(matchesCatch(pokemon({ abilities: [rare] }), 'is:hidden')).toBe(true);
    expect(matchesCatch(pokemon({ abilities: [Abilities.Blaze] }), 'is:hidden')).toBe(false);
  });

  it('reads what the dex says about the species', () => {
    const charmander = pokemon({ species: Species.Charmander });

    expect(matchesCatch(charmander, 'dex:4')).toBe(true);
    expect(matchesCatch(charmander, 'dex:1-9')).toBe(true);
    expect(matchesCatch(charmander, 'dex:>100')).toBe(false);
    expect(matchesCatch(charmander, 'egg-group:monster')).toBe(true);
    expect(matchesCatch(charmander, 'egg-group:water')).toBe(false);
    expect(matchesCatch(charmander, 'catch-rate:45')).toBe(true);
    expect(matchesCatch(charmander, 'catch-rate:>100')).toBe(false);
    expect(matchesCatch(pokemon({ species: Species.Mewtwo }), 'rarity:legendary')).toBe(true);
    expect(matchesCatch(charmander, 'rarity:legendary')).toBe(false);
    // A dex number is a species, so the store can be asked it
    expect(planCatchSearch('dex:4')).toEqual([
      { on: 'row', column: 'species', op: 'eq', value: Species.Charmander },
    ]);
  });

  it('tells where the species lives from where this one was met', () => {
    const met = pokemon({
      species: Species.Charmander,
      origin: { timestamp: 0, x: 0, y: 0, biome: Biome.Beyond },
    });
    const lives = getSpeciesData(Species.Charmander).biomes;

    expect(lives.length).toBeGreaterThan(0);
    expect(matchesCatch(met, `spawns:${BIOME_NAMES[lives[0]]}`)).toBe(true);
    // It was met nowhere in particular, which is not where it lives
    expect(matchesCatch(met, 'biome:beyond')).toBe(true);
  });

  it('reads what it could learn against what it knows', () => {
    const charmander = pokemon({ species: Species.Charmander, moves: [Moves.Tackle] });

    expect(matchesCatch(charmander, 'learns:ember')).toBe(true);
    expect(matchesCatch(charmander, 'move:ember')).toBe(false);
    expect(matchesCatch(charmander, 'move-type:normal')).toBe(true);
    expect(matchesCatch(charmander, 'move-type:fire')).toBe(false);
  });

  it('measures the individual rather than the species', () => {
    const listed = getSpeciesData(Species.Charmander).weight;
    const small = pokemon({ species: Species.Charmander, traitValue: 1 });
    const large = pokemon({ species: Species.Charmander, traitValue: 0x7fff_ffff });

    // Both are Charmanders and neither weighs what the dex says
    expect(matchesCatch(small, `weight:<${listed * 4}`)).toBe(true);
    expect(matchesCatch(large, 'height:>0')).toBe(true);
  });

  it('tells an egg none of it', () => {
    const egg = pokemon({ egg: true, species: Species.Charmander, moves: [Moves.Ember] });

    expect(matchesCatch(egg, 'weak:water')).toBe(false);
    expect(matchesCatch(egg, 'dex:4')).toBe(false);
    expect(matchesCatch(egg, 'learns:ember')).toBe(false);
    expect(matchesCatch(egg, 'stat:spe:>1')).toBe(false);
    expect(matchesCatch(egg, 'is:stab')).toBe(false);
    expect(matchesCatch(egg, 'not:stab')).toBe(false);
  });
});

describe('what the box says it can be asked', () => {
  it('gives every field a line, so none goes missing from the guide', () => {
    // The field list is read off the table that answers them, so one
    // added there arrives here on its own. The line about it cannot
    const bare = CATCH_VOCABULARY.fields.filter((field) => field.hint === '');

    expect(bare.map((field) => field.name)).toEqual([]);
  });

  it('offers only values the field would actually answer to', () => {
    const kinds = CATCH_VOCABULARY.fields.find((field) => field.name === 'type');
    const fire = pokemon({ species: Species.Charmander });

    expect(kinds?.values?.()).toContain('Fire');
    // A suggested value that matched nothing would be the box
    // offering a search it knows comes back empty
    for (const kind of kinds?.values?.() ?? []) {
      expect(matchesCatch(fire, `type:${kind}`)).toBe(kind === 'Fire');
    }
  });

  it('offers the marks that `is:` actually reads', () => {
    const marks = CATCH_VOCABULARY.fields.find((field) => field.name === 'is');
    const shiny = pokemon({ shiny: true });

    expect(marks?.values?.()).toContain('shiny');
    expect(matchesCatch(shiny, 'is:shiny')).toBe(true);
  });

  it('knows the two terms that arrange rather than narrow', () => {
    const named = CATCH_VOCABULARY.fields.map((field) => field.name);

    expect(named).toContain('sort');
    expect(named).toContain('order');
  });
});
