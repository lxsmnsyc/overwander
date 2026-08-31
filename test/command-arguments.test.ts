import { beforeAll, describe, expect, it } from 'vitest';
import type { CommandArguments } from '../src/core/command';
import { GiftKind } from '../src/auth/gift-record';
import { Genders, Species } from '../src/data/ids/species';
import { Items } from '../src/data/ids/items';
import { MAX_IV, Stats, packIVs, unpackIVs } from '../src/data/constants/stats';
import { Moves } from '../src/data/ids/moves';
import Biome from '../src/data/ids/biome';
import Natures from '../src/data/ids/natures';
import readGift from '../src/components/app/command-bar/gift';
import readPlayer from '../src/components/app/command-bar/player';
import readTeleport from '../src/components/app/command-bar/teleport';
import registerGameData from '../src/data';
import { LocateKind, readLocate } from '../src/components/app/command-bar/locate';

/**
 * What each command makes of what it was given, before anything is
 * sent. Every refusal here is somebody's slip at the bar rather than
 * an answer worth a round trip.
 */

beforeAll(() => {
  registerGameData();
});

/** A typed line's parameters, as the grammar hands them over */
function given(pairs: Record<string, string | string[]>): CommandArguments {
  return new Map(
    Object.entries(pairs).map(([name, value]) => [name, Array.isArray(value) ? value : [value]]),
  );
}

describe('reading what a teleport was asked for', () => {
  it('moves the caller when nobody was named', () => {
    const asked = readTeleport(given({ x: '10', y: '20' }));

    expect(asked.ok && asked.value.player).toBe('self');
    expect(asked.ok && asked.value.wanted).toEqual({ x: 10, y: 20, to: undefined });
  });

  it('keeps whoever was named', () => {
    const asked = readTeleport(given({ player: 'someone@example.com' }));

    expect(asked.ok && asked.value.player).toBe('someone@example.com');
  });

  it('leaves an axis nobody named to be drawn', () => {
    const asked = readTeleport(given({ x: '10' }));

    // Undefined rather than zero: the server draws what was left out
    expect(asked.ok && asked.value.wanted.x).toBe(10);
    expect(asked.ok && asked.value.wanted.y).toBeUndefined();
  });

  it('takes a negative coordinate, and truncates a written fraction', () => {
    const asked = readTeleport(given({ x: '-2048', y: '3.7' }));

    expect(asked.ok && asked.value.wanted).toEqual({ x: -2048, y: 3, to: undefined });
  });

  it('refuses a coordinate that is not a number', () => {
    expect(readTeleport(given({ x: 'over-there' }))).toEqual({
      ok: false,
      reason: 'The coordinates have to be numbers.',
    });
    // An empty value is somebody who stopped mid-word, not a draw
    expect(readTeleport(given({ y: '' })).ok).toBe(false);
  });

  it('refuses a coordinate and a destination at once', () => {
    expect(readTeleport(given({ x: '1', to: 'self' })).ok).toBe(false);
    expect(readTeleport(given({ y: '1', to: 'self' })).ok).toBe(false);
  });

  it('takes a destination on its own', () => {
    const asked = readTeleport(given({ player: 'self', to: '0000-1111-2222' }));

    expect(asked.ok && asked.value.wanted).toEqual({
      x: undefined,
      y: undefined,
      to: '0000-1111-2222',
    });
  });
});

describe('reading what a command about one trainer was given', () => {
  it('keeps the name and the reason', () => {
    const asked = readPlayer(given({ player: 'Ash', reason: 'Botting' }));

    expect(asked.ok && asked.value).toEqual({ player: 'Ash', reason: 'Botting' });
  });

  it('refuses a line naming nobody, rather than acting on the caller', () => {
    expect(readPlayer(given({})).ok).toBe(false);
    expect(readPlayer(given({ player: '  ' })).ok).toBe(false);
  });
});

describe('reading what a gift was asked for', () => {
  it('takes an item gift, and counts one when no amount was given', () => {
    const asked = readGift(
      GiftKind.Item,
      given({ to: 'Ash', item: 'Rare Candy', reason: 'Sorry' }),
    );

    expect(asked.ok && asked.value.to).toBe('Ash');
    expect(asked.ok && asked.value.gift).toEqual({
      kind: GiftKind.Item,
      item: Items.RareCandy,
      amount: 1,
      reason: 'Sorry',
      expiresAt: null,
    });
  });

  it('puts a gift on every shelf when nobody was named', () => {
    const asked = readGift(GiftKind.Item, given({ item: 'Potion', reason: 'Launch' }));

    expect(asked.ok && asked.value.to).toBeNull();
    expect(
      readGift(GiftKind.Item, given({ to: 'everybody', item: 'Potion', reason: 'x' })).ok,
    ).toBe(true);
  });

  it('refuses a gift with nothing said about it', () => {
    expect(readGift(GiftKind.Item, given({ item: 'Potion' })).ok).toBe(false);
  });

  it('refuses an item that names nothing, or more than one thing', () => {
    expect(readGift(GiftKind.Item, given({ item: 'Nonesuch', reason: 'x' })).ok).toBe(false);
    expect(readGift(GiftKind.Item, given({ item: 'Ball', reason: 'x' })).ok).toBe(false);
  });

  it('takes a pokemon pinned down every way it can be', () => {
    const asked = readGift(
      GiftKind.Catch,
      given({
        to: 'Ash',
        species: 'Charmander',
        reason: 'A starter',
        level: '25',
        is: ['shiny', 'shadow'],
        nature: 'Adamant',
        gender: 'female',
        move: ['Ember', 'Growl'],
        item: 'Oran Berry',
        location: 'Pallet Town',
        trainer: 'Blue',
        ball: 'Luxury Ball',
      }),
    );

    expect(asked.ok).toBe(true);
    if (!asked.ok || asked.value.gift.kind !== GiftKind.Catch) {
      return;
    }
    const gift = asked.value.gift;

    expect(gift.species).toBe(Species.Charmander);
    expect(gift.level).toBe(25);
    expect(gift.shiny).toBe(true);
    expect(gift.shadow).toBe(true);
    expect(gift.nature).toBe(Natures.Adamant);
    expect(gift.gender).toBe(Genders.Female);
    expect(gift.moves).toEqual([Moves.Ember, Moves.Growl]);
    expect(gift.items).toEqual([Items.OranBerry]);
    expect(gift.place).toBe('Pallet Town');
    expect(gift.owner).toBe('Blue');
  });

  it('leaves everything nobody pinned to the roll', () => {
    const asked = readGift(GiftKind.Encounter, given({ species: 'Pikachu', reason: 'x' }));

    expect(asked.ok && asked.value.gift.kind).toBe(GiftKind.Encounter);
    if (!asked.ok || asked.value.gift.kind === GiftKind.Item) {
      return;
    }
    expect(asked.value.gift.nature).toBeNull();
    expect(asked.value.gift.gender).toBeNull();
    expect(asked.value.gift.ivs).toBeNull();
    expect(asked.value.gift.level).toBe(5);
  });

  it('sets the values it was given and leaves the rest perfect', () => {
    const asked = readGift(
      GiftKind.Encounter,
      given({ species: 'Pikachu', reason: 'x', iv: ['speed:0', 'hp:20'] }),
    );

    expect(asked.ok).toBe(true);
    if (!asked.ok || asked.value.gift.kind === GiftKind.Item) {
      return;
    }
    expect(asked.value.gift.ivs).toBe(
      packIVs({
        ...unpackIVs(0),
        [Stats.HP]: 20,
        [Stats.Attack]: MAX_IV,
        [Stats.Defense]: MAX_IV,
        [Stats.SpecialAttack]: MAX_IV,
        [Stats.SpecialDefense]: MAX_IV,
        [Stats.Speed]: 0,
      }),
    );
  });

  it('refuses a level, a value or a room outside what it can be', () => {
    const base = { species: 'Pikachu', reason: 'x' };

    expect(readGift(GiftKind.Encounter, given({ ...base, level: '0' })).ok).toBe(false);
    expect(readGift(GiftKind.Encounter, given({ ...base, level: '101' })).ok).toBe(false);
    expect(readGift(GiftKind.Encounter, given({ ...base, iv: 'speed:99' })).ok).toBe(false);
    expect(readGift(GiftKind.Encounter, given({ ...base, iv: 'quickness:1' })).ok).toBe(false);
    expect(readGift(GiftKind.Encounter, given({ ...base, slots: 'move:0' })).ok).toBe(false);
  });

  it('refuses a way of arriving that is neither shiny nor shadow', () => {
    expect(
      readGift(GiftKind.Encounter, given({ species: 'Pikachu', reason: 'x', is: 'golden' })).ok,
    ).toBe(false);
  });

  it('refuses an expiry that is not a date', () => {
    expect(
      readGift(GiftKind.Item, given({ item: 'Potion', reason: 'x', expires: 'soon' })).ok,
    ).toBe(false);
  });
});

describe('reading what to locate', () => {
  it('takes one of the three', () => {
    expect(readLocate(given({ biome: 'Volcano' }))).toEqual({
      ok: true,
      value: { kind: LocateKind.Biome, biome: Biome.Volcano },
    });
    expect(readLocate(given({ species: 'Bulbasaur' })).ok).toBe(true);
    expect(readLocate(given({ weather: 'Thunderstorm' })).ok).toBe(true);
  });

  it('refuses a line asking for none of them, or for two at once', () => {
    expect(readLocate(given({})).ok).toBe(false);
    expect(readLocate(given({ biome: 'Volcano', weather: 'Clear' })).ok).toBe(false);
  });

  it('refuses a name that is nothing, or more than one thing', () => {
    expect(readLocate(given({ biome: 'Nowhere' })).ok).toBe(false);
    // Several biomes hold it, and none of them is called just that
    expect(readLocate(given({ biome: 'Forest' })).ok).toBe(false);
    // An exact name still wins over the ones that merely hold it
    expect(readLocate(given({ biome: 'Ocean' })).ok).toBe(true);
  });
});
