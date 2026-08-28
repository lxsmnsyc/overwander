import { beforeAll, describe, expect, it } from 'vitest';
import { AuctionLot, type AuctionRecord, asAuctionRecord } from '../src/auth/auction-record';
import { Items } from '../src/data/ids/items';
import { Species } from '../src/data/ids/species';
import { asCaughtPokemon } from '../src/auth/caught-record';
import matchesAuction, { AUCTION_VOCABULARY, orderAuctions } from '../src/auth/auction-search';
import registerGameData from '../src/data';

beforeAll(() => {
  registerGameData();
});

/** One hour from the instant every test below reads as "now" */
const NOW = 1_700_000_000_000;
const HOUR = 60 * 60 * 1000;

/** One lot on the block, with only what a test cares about set */
function lot(fields: Record<string, unknown>): AuctionRecord {
  return asAuctionRecord({
    seller: 'trainer',
    lot: AuctionLot.Item,
    item: Items.RareCandy,
    startingBid: 100,
    increment: 10,
    endsAt: NOW + 6 * HOUR,
    createdAt: NOW - HOUR,
    ...fields,
  });
}

function pokemon(fields: Record<string, unknown> = {}): ReturnType<typeof asCaughtPokemon> {
  return asCaughtPokemon({ owner: 'trainer', species: Species.Charmander, level: 20, ...fields });
}

describe('searching the auction board', () => {
  it('matches everything while nothing has been typed', () => {
    expect(matchesAuction(lot({}), '', { name: 'Rare Candy', now: NOW })).toBe(true);
  });

  it('finds a lot by part of what it is called', () => {
    const context = { name: 'Rare Candy', now: NOW };

    expect(matchesAuction(lot({}), 'candy', context)).toBe(true);
    expect(matchesAuction(lot({}), 'potion', context)).toBe(false);
  });

  it('narrows to one trainer', () => {
    const context = { name: 'Rare Candy', seller: 'Blue', now: NOW };

    expect(matchesAuction(lot({}), 'seller:blue', context)).toBe(true);
    expect(matchesAuction(lot({}), 'seller:red', context)).toBe(false);
  });

  it('tells the two kinds of lot apart', () => {
    const item = lot({});
    const catchLot = lot({ lot: AuctionLot.Catch, item: null, caught: 'one' });

    expect(matchesAuction(item, 'is:item', { now: NOW })).toBe(true);
    expect(matchesAuction(item, 'is:pokemon', { now: NOW })).toBe(false);
    expect(matchesAuction(catchLot, 'is:pokemon', { now: NOW })).toBe(true);
  });

  it('asks what a pokemon lot is', () => {
    const context = { caught: pokemon({ shiny: true }), now: NOW };
    const catchLot = lot({ lot: AuctionLot.Catch, item: null, caught: 'one' });

    expect(matchesAuction(catchLot, 'species:charmander', context)).toBe(true);
    expect(matchesAuction(catchLot, 'type:fire', context)).toBe(true);
    expect(matchesAuction(catchLot, 'type:water', context)).toBe(false);
    expect(matchesAuction(catchLot, 'level:>10', context)).toBe(true);
    expect(matchesAuction(catchLot, 'is:shiny', context)).toBe(true);
  });

  it('asks nothing of a pokemon lot the board has not read yet', () => {
    const catchLot = lot({ lot: AuctionLot.Catch, item: null, caught: 'one' });

    expect(matchesAuction(catchLot, 'species:charmander', { now: NOW })).toBe(false);
  });

  it('prices a lot at the bid where there is one, and the asking price where there is not', () => {
    expect(matchesAuction(lot({}), 'price:100', { now: NOW })).toBe(true);
    expect(matchesAuction(lot({ bid: 450, bidder: 'other' }), 'price:450', { now: NOW })).toBe(
      true,
    );
    expect(matchesAuction(lot({ bid: 450, bidder: 'other' }), 'start:100', { now: NOW })).toBe(
      true,
    );
    expect(matchesAuction(lot({ bid: 450, bidder: 'other' }), 'price:<200', { now: NOW })).toBe(
      false,
    );
  });

  it('counts the hours a lot has left', () => {
    expect(matchesAuction(lot({}), 'ends:<8', { now: NOW })).toBe(true);
    expect(matchesAuction(lot({}), 'ends:<2', { now: NOW })).toBe(false);
    expect(matchesAuction(lot({ endsAt: NOW - HOUR }), 'ends:0', { now: NOW })).toBe(true);
  });

  it('knows where the reader stands on it', () => {
    const mine = { name: 'Rare Candy', mine: true, now: NOW };

    expect(matchesAuction(lot({}), 'is:mine', mine)).toBe(true);
    expect(matchesAuction(lot({}), '!is:mine', mine)).toBe(false);
    expect(matchesAuction(lot({}), 'is:bidding', { bidding: true, now: NOW })).toBe(true);
    expect(matchesAuction(lot({}), 'is:unbid', { now: NOW })).toBe(true);
    expect(matchesAuction(lot({ bid: 200, bidder: 'other' }), 'is:bid', { now: NOW })).toBe(true);
  });

  it('says whether bidding is still open', () => {
    expect(matchesAuction(lot({}), 'is:live', { now: NOW })).toBe(true);
    expect(matchesAuction(lot({ endsAt: NOW - HOUR }), 'is:ended', { now: NOW })).toBe(true);
    expect(matchesAuction(lot({ endsAt: NOW - HOUR }), 'is:live', { now: NOW })).toBe(false);
  });

  it('matches nothing for a field nobody has heard of', () => {
    expect(matchesAuction(lot({}), 'colour:red', { name: 'Rare Candy', now: NOW })).toBe(false);
  });

  it('arranges the board by what it stands at', () => {
    const rows = [lot({ bid: 800, bidder: 'other' }), lot({}), lot({ startingBid: 400 })];
    const cheapest = orderAuctions(rows, 'sort:price', (auction) => ({ auction }));

    expect(
      cheapest.map((auction) => (auction.bid > 0 ? auction.bid : auction.startingBid)),
    ).toEqual([100, 400, 800]);
    expect(
      orderAuctions(rows, 'sort:price order:desc', (auction) => ({ auction })).map((auction) =>
        auction.bid > 0 ? auction.bid : auction.startingBid,
      ),
    ).toEqual([800, 400, 100]);
  });

  it('gives every field a line for the guide', () => {
    const bare = AUCTION_VOCABULARY.fields.filter((field) => field.hint === '');

    expect(bare.map((field) => field.name)).toEqual([]);
  });

  it('offers only marks the board would actually answer to', () => {
    const marks = AUCTION_VOCABULARY.fields.find((field) => field.name === 'is');
    const item = lot({});

    expect(marks?.values?.()).toContain('pokemon');
    // A mark nobody answers is false both ways round, which is a
    // suggestion that finds nothing whichever way it is typed
    for (const mark of marks?.values?.() ?? []) {
      const yes = matchesAuction(item, `is:${mark}`, { now: NOW });
      const no = matchesAuction(item, `not:${mark}`, { now: NOW });

      expect(yes === no).toBe(false);
    }
  });

  it('knows the two terms that arrange rather than narrow', () => {
    const named = AUCTION_VOCABULARY.fields.map((field) => field.name);

    expect(named).toContain('sort');
    expect(named).toContain('order');
  });
});
