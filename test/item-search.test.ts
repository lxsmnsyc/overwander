import { beforeAll, describe, expect, it } from 'vitest';
import { Items, getMachineItem } from '../src/data/ids/items';
import { Moves } from '../src/data/ids/moves';
import matchesItem, { ITEM_VOCABULARY } from '../src/data/items/search';
import registerGameData from '../src/data';

beforeAll(() => {
  registerGameData();
});

describe('searching a bag', () => {
  it('matches everything while nothing has been typed', () => {
    expect(matchesItem(Items.PokeBall, '')).toBe(true);
  });

  it('finds one by part of its name', () => {
    expect(matchesItem(Items.UltraBall, 'ultra')).toBe(true);
    expect(matchesItem(Items.UltraBall, 'ULTRA')).toBe(true);
    expect(matchesItem(Items.UltraBall, 'potion')).toBe(false);
  });

  it('narrows by the shelf it sits on', () => {
    expect(matchesItem(Items.OranBerry, 'type:berries')).toBe(true);
    expect(matchesItem(Items.OranBerry, 'type:medicine')).toBe(false);
  });

  it('reads the line under the name, so an effect can be searched for', () => {
    // Nobody remembers which item cures what; the description does
    expect(matchesItem(Items.Antidote, 'about:poison')).toBe(true);
    expect(matchesItem(Items.Antidote, 'about:burn')).toBe(false);
  });

  it('names a machine after the move it teaches', () => {
    expect(matchesItem(getMachineItem(Moves.Ember), 'move:ember')).toBe(true);
    expect(matchesItem(getMachineItem(Moves.Ember), 'move:surf')).toBe(false);
    // Anything that teaches nothing answers no rather than throwing
    expect(matchesItem(Items.PokeBall, 'move:ember')).toBe(false);
  });

  it('asks the yes-or-no facts by name', () => {
    expect(matchesItem(Items.Potion, 'is:usable')).toBe(true);
    expect(matchesItem(Items.Potion, 'is:machine')).toBe(false);
    expect(matchesItem(Items.Potion, 'not:machine')).toBe(true);
    expect(matchesItem(getMachineItem(Moves.Ember), 'is:machine')).toBe(true);
  });

  it('narrows by what it is worth', () => {
    expect(matchesItem(Items.PokeBall, 'buy:1-500')).toBe(true);
    expect(matchesItem(Items.PokeBall, 'buy:5000-')).toBe(false);
  });

  it('counts what is carried, where the shelf knows', () => {
    expect(matchesItem(Items.PokeBall, 'amount:5-20', { amount: 12 })).toBe(true);
    expect(matchesItem(Items.PokeBall, 'amount:5-20', { amount: 2 })).toBe(false);
    // A gift shelf or a lot on the block carries no count, so the
    // question is unanswerable rather than true
    expect(matchesItem(Items.PokeBall, 'amount:5-20')).toBe(false);
  });

  it('narrows rather than widens, and refuses what it cannot answer', () => {
    expect(matchesItem(Items.OranBerry, 'type:berries is:holdable')).toBe(true);
    expect(matchesItem(Items.OranBerry, 'type:berries type:medicine')).toBe(false);
    expect(matchesItem(Items.OranBerry, 'colour:red')).toBe(false);
    expect(matchesItem(Items.OranBerry, 'is:sparkly')).toBe(false);
  });
});

describe('what the bag says it can be asked', () => {
  it('gives every field a line, so none goes missing from the guide', () => {
    // The list is read off the table that answers the fields, so a
    // field added there arrives here on its own. What cannot arrive on
    // its own is the line about it
    const bare = ITEM_VOCABULARY.fields.filter((field) => field.hint === '');

    expect(bare.map((field) => field.name)).toEqual([]);
  });

  it('offers only values the field would actually answer to', () => {
    const shelves = ITEM_VOCABULARY.fields.find((field) => field.name === 'type');

    expect(shelves?.values?.()).toContain('Berries');
    // Every offered value has to find something, or the box is
    // suggesting a search that comes back empty
    for (const shelf of shelves?.values?.() ?? []) {
      expect(matchesItem(Items.OranBerry, `type:${shelf}`)).toBe(shelf === 'Berries');
    }
  });

  it('knows the two terms that arrange rather than narrow', () => {
    const named = ITEM_VOCABULARY.fields.map((field) => field.name);

    expect(named).toContain('sort');
    expect(named).toContain('order');
  });
});
