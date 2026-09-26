import { describe, expect, it } from 'vitest';
import check, {
  AUCTION_OFFER,
  BASKET,
  CELL,
  CHUNK_COORDINATE,
  CLAIM_QUERIES,
  DEPTH,
  GAME_ID,
  ID,
  LOCALE,
  MAYBE_ID,
  NICKNAME,
  OFFSET,
  PARTY,
  STAFF_GIFT,
  TRADE_OFFER,
} from '../src/server/validate';
import { AuctionLot } from '../src/auth/auction-record';
import { Depth } from '../src/overworld/depth';
import { GiftKind } from '../src/auth/gift-record';
import { MAX_PACKED_IVS } from '../src/data/constants/stats';
import { Items } from '../src/data/ids/items';
import { Species } from '../src/data/ids/species';

/**
 * What a server function will take as an argument.
 *
 * The parameter list of a `'use server'` function is erased by the
 * time a call arrives, so these schemas are the only thing between a
 * hand-written request and the privileged writes underneath
 */

describe('checking one argument', () => {
  it('hands the argument back as it arrived', () => {
    expect(check(ID, 'seed$seat12')).toBe('seed$seat12');
    expect(check(CELL, 0)).toBe(0);
  });

  it('refuses a value of the wrong kind rather than coercing it', () => {
    expect(() => check(CELL, '3')).toThrow();
    expect(() => check(ID, 42)).toThrow();
    expect(() => check(GAME_ID, Number.NaN)).toThrow();
  });
});

describe('ids', () => {
  it('takes the keys the store actually holds', () => {
    expect(() => check(ID, 'a2c1f0e4-0000-4000-8000-000000000000')).not.toThrow();
    expect(() => check(ID, '12,-8@1756000000000#3')).not.toThrow();
  });

  it('refuses an empty one, an endless one, and one carrying control characters', () => {
    expect(() => check(ID, '')).toThrow();
    expect(() => check(ID, 'x'.repeat(1000))).toThrow();
    expect(() => check(ID, `seed${String.fromCharCode(0)}seat`)).toThrow();
  });

  it('lets empty stand for nothing where the caller may name nothing', () => {
    expect(() => check(MAYBE_ID, '')).not.toThrow();
  });
});

describe('where a caller says they are', () => {
  it('refuses a chunk outside the world and a cell outside its chunk', () => {
    expect(() => check(CHUNK_COORDINATE, 1e9)).toThrow();
    expect(() => check(CHUNK_COORDINATE, 4.5)).toThrow();
    expect(() => check(CELL, 256)).toThrow();
    expect(() => check(CELL, -1)).toThrow();
  });

  it('takes the two layers and nothing else', () => {
    expect(() => check(DEPTH, Depth.Cave)).not.toThrow();
    expect(() => check(DEPTH, 2)).toThrow();
  });

  it('refuses a zone no clock is in', () => {
    expect(() => check(OFFSET, 480)).not.toThrow();
    expect(() => check(OFFSET, 100_000)).toThrow();
  });

  it('refuses a locale tag that is not one', () => {
    expect(() => check(LOCALE, 'en-PH')).not.toThrow();
    expect(() => check(LOCALE, 'en_PH; drop')).toThrow();
  });
});

describe('lists', () => {
  it('holds a party to the size of one', () => {
    expect(() => check(PARTY, ['a', 'b', 'c', 'd', 'e', 'f'])).not.toThrow();
    expect(() => check(PARTY, ['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toThrow();
  });

  it('refuses a board asking about more chunks than a board has', () => {
    const query = { x: 0, y: 0, offset: 0, depth: Depth.Surface };

    expect(() => check(CLAIM_QUERIES, [query])).not.toThrow();
    expect(() =>
      check(
        CLAIM_QUERIES,
        Array.from({ length: 64 }, () => query),
      ),
    ).toThrow();
  });

  it('takes a basket as pairs, a sale being the negative side of one', () => {
    expect(() => check(BASKET, [[Items.PokeBall, -3]])).not.toThrow();
    expect(() => check(BASKET, [[Items.PokeBall]])).toThrow();
  });
});

describe('what an offer says', () => {
  it('takes a trade the way the dialog sends it', () => {
    expect(() =>
      check(TRADE_OFFER, {
        friend: 'a2c1f0e4-0000-4000-8000-000000000000',
        caught: 'catch-1',
        asked: '',
        gold: 500,
      }),
    ).not.toThrow();
  });

  it('refuses a trade whose friend is not an account', () => {
    expect(() =>
      check(TRADE_OFFER, {
        friend: 'nobody',
        caught: 'catch-1',
        asked: '',
        gold: 500,
      }),
    ).toThrow();
  });

  it('refuses a lot that names neither an item nor a pokemon', () => {
    expect(() =>
      check(AUCTION_OFFER, { lot: AuctionLot.Item, item: Items.PokeBall }),
    ).not.toThrow();
    expect(() => check(AUCTION_OFFER, { lot: AuctionLot.Item, caught: 'catch-1' })).toThrow();
  });
});

describe('what a player wrote', () => {
  it('refuses a name longer than a name may be', () => {
    expect(() => check(NICKNAME, 'Rocket')).not.toThrow();
    expect(() => check(NICKNAME, 'R'.repeat(25))).toThrow();
  });
});

describe('a gift written by hand', () => {
  const encounter = {
    kind: GiftKind.Encounter,
    reason: 'Launch week',
    expiresAt: new Date('2026-10-05T23:59:59'),
    player: null,
    species: Species.Pikachu,
    level: 5,
    shiny: false,
    shadow: false,
    gender: null,
    nature: null,
    ivs: MAX_PACKED_IVS,
    abilities: [],
    moves: [],
    items: [],
    place: '',
    slots: 0,
  };

  it('takes a pokemon with every individual value at its best', () => {
    expect(() => check(STAFF_GIFT, encounter)).not.toThrow();
    expect(() => check(STAFF_GIFT, { ...encounter, ivs: MAX_PACKED_IVS + 1 })).toThrow();
  });

  it('takes an expiry as a date and refuses one that is not a day', () => {
    expect(() => check(STAFF_GIFT, { ...encounter, expiresAt: null })).not.toThrow();
    expect(() => check(STAFF_GIFT, { ...encounter, expiresAt: new Date('nope') })).toThrow();
    expect(() => check(STAFF_GIFT, { ...encounter, expiresAt: Date.now() })).toThrow();
  });
});
