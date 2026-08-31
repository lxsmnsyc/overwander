import { beforeAll, describe, expect, it } from 'vitest';
import { type CatchGift, GiftKind, type ItemGift, type MysteryGift } from '../src/auth/gift-record';
import { Balls, Items } from '../src/data/ids/items';
import { Genders, Species } from '../src/data/ids/species';
import matchesGift, {
  GIFT_VOCABULARY,
  type GiftContext,
  orderGifts,
} from '../src/auth/gift-search';
import registerGameData from '../src/data';

beforeAll(() => {
  registerGameData();
});

/** The instant every test below reads as "now" */
const NOW = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

function item(fields: Partial<ItemGift> = {}): ItemGift {
  return {
    kind: GiftKind.Item,
    id: 'staff-1',
    reason: 'A welcome present.',
    expiresAt: null,
    item: Items.RareCandy,
    amount: 3,
    ...fields,
  };
}

function pokemon(fields: Partial<CatchGift> = {}): CatchGift {
  return {
    kind: GiftKind.Catch,
    id: 'staff-2',
    reason: 'Launch day.',
    expiresAt: null,
    species: Species.Bulbasaur,
    level: 20,
    shiny: false,
    shadow: false,
    individualValue: 0,
    traitValue: 0,
    gender: Genders.Male,
    nature: null,
    ivs: null,
    abilities: [],
    moves: [],
    items: [],
    place: 'Pallet Town',
    slots: 0,
    ball: Balls.PremierBall,
    owner: '',
    ...fields,
  };
}

/** A ledger line, with only what a test cares about set */
function ledger(fields: GiftContext = {}): GiftContext {
  return { recipient: null, claims: 0, expired: false, offeredAt: NOW, now: NOW, ...fields };
}

describe('searching the gift ledger', () => {
  it('matches everything while nothing has been typed', () => {
    expect(matchesGift(item(), '', ledger())).toBe(true);
  });

  it('finds a gift by what it is', () => {
    expect(matchesGift(item(), 'candy', ledger())).toBe(true);
    expect(matchesGift(pokemon(), 'bulba', ledger())).toBe(true);
    expect(matchesGift(item(), 'bulba', ledger())).toBe(false);
  });

  it('finds one by the sentence it carries', () => {
    expect(matchesGift(item(), 'reason:welcome', ledger())).toBe(true);
    expect(matchesGift(item(), 'welcome', ledger())).toBe(true);
    expect(matchesGift(item(), 'reason:launch', ledger())).toBe(false);
  });

  it('reads an open offer as being for everybody', () => {
    expect(matchesGift(item(), 'for:everybody', ledger())).toBe(true);
    expect(matchesGift(item(), 'for:red', ledger({ recipient: 'Red' }))).toBe(true);
    expect(matchesGift(item(), 'for:everybody', ledger({ recipient: 'Red' }))).toBe(false);
  });

  it('picks out what nobody has come for', () => {
    expect(matchesGift(item(), 'is:waiting', ledger())).toBe(true);
    expect(matchesGift(item(), 'is:taken', ledger({ claims: 4 }))).toBe(true);
    expect(matchesGift(item(), 'taken:>2', ledger({ claims: 4 }))).toBe(true);
    expect(matchesGift(item(), 'taken:>2', ledger({ claims: 1 }))).toBe(false);
    expect(matchesGift(item(), '!is:expired', ledger({ expired: true }))).toBe(false);
  });

  it('tells the two kinds of gift apart', () => {
    expect(matchesGift(item(), 'is:item', ledger())).toBe(true);
    expect(matchesGift(pokemon(), 'is:pokemon', ledger())).toBe(true);
    expect(matchesGift(pokemon({ shiny: true }), 'is:shiny', ledger())).toBe(true);
    expect(matchesGift(pokemon(), 'is:shiny', ledger())).toBe(false);
  });

  it('counts what a line holds and how old it is', () => {
    expect(matchesGift(item({ amount: 3 }), 'amount:3', ledger())).toBe(true);
    expect(matchesGift(pokemon(), 'level:<25', ledger())).toBe(true);
    expect(matchesGift(item(), 'offered:>5', ledger({ offeredAt: NOW - 9 * DAY }))).toBe(true);
    expect(matchesGift(item(), 'offered:>5', ledger())).toBe(false);
  });

  it('refuses a field nobody has a reading for', () => {
    expect(matchesGift(item(), 'colour:red', ledger())).toBe(false);
  });

  it('arranges the rows a search kept', () => {
    const rows = [
      { gift: item() as MysteryGift, context: ledger({ claims: 1 }) },
      { gift: pokemon(), context: ledger({ claims: 9 }) },
    ];

    expect(orderGifts(rows, 'sort:taken', (row) => row).map((row) => row.context.claims)).toEqual([
      1, 9,
    ]);
    expect(
      orderGifts(rows, 'sort:taken order:desc', (row) => row).map((row) => row.context.claims),
    ).toEqual([9, 1]);
  });

  it('gives every field a line for the guide', () => {
    const bare = GIFT_VOCABULARY.fields.filter((field) => field.hint === '');

    expect(bare.map((field) => field.name)).toEqual([]);
  });

  it('offers only marks the ledger would actually answer to', () => {
    const marks = GIFT_VOCABULARY.fields.find((field) => field.name === 'is');

    expect(marks?.values?.()).toContain('waiting');
    for (const mark of marks?.values?.() ?? []) {
      expect(matchesGift(item(), `is:${mark}`) === matchesGift(item(), `not:${mark}`)).toBe(false);
    }
  });

  it('knows the two terms that arrange rather than narrow', () => {
    const named = GIFT_VOCABULARY.fields.map((field) => field.name);

    expect(named).toContain('sort');
    expect(named).toContain('order');
  });
});
