import { beforeAll, describe, expect, it } from 'vitest';
import { asCaughtPokemon } from '../src/auth/caught-record';
import type { HealthSource, HealthState } from '../src/auth/health';
import {
  NON_VOLATILE_STATUSES,
  carriedStatuses,
  getMaxHealth,
  healedByBerry,
  isFainted,
  isNonVolatileStatus,
  needsCare,
  rescaleHealth,
} from '../src/auth/health';
import { STAT_ORDER, Stats, getHealthStat } from '../src/data/constants/stats';
import { Items } from '../src/data/ids/items';
import { Species } from '../src/data/ids/species';
import { Statuses } from '../src/data/ids/status';
import registerGen1Moves from '../src/data/moves/gen-1';
import { getSpeciesData, registerSpecies } from '../src/data/species';

beforeAll(() => {
  registerGen1Moves();
  registerSpecies();
});

/**
 * A stat spread with the same value everywhere
 */
function evenly(value: number): Record<Stats, number> {
  return {
    [Stats.HP]: value,
    [Stats.Attack]: value,
    [Stats.Defense]: value,
    [Stats.SpecialAttack]: value,
    [Stats.SpecialDefense]: value,
    [Stats.Speed]: value,
  };
}

/**
 * A pokemon as the health rules read one
 */
function pokemon(
  species: Species,
  level: number,
  iv = 31,
): {
  species: Species;
  level: number;
  ivs: Record<Stats, number>;
  effortValues: Record<Stats, number>;
} {
  return { species, level, ivs: evenly(iv), effortValues: evenly(0) };
}

describe('maximum health', () => {
  it('derives it from the same formula the battle fights on', () => {
    const bulbasaur = pokemon(Species.Bulbasaur, 50);
    const base = getSpeciesData(Species.Bulbasaur).stats[STAT_ORDER[0]];

    expect(getMaxHealth(bulbasaur)).toBe(getHealthStat(50, base, 31, 0));

    // Everything that makes a pokemon bigger makes its pool bigger:
    // a level, an evolution, a polished value
    expect(getMaxHealth(pokemon(Species.Bulbasaur, 51))).toBeGreaterThan(getMaxHealth(bulbasaur));
    expect(getMaxHealth(pokemon(Species.Venusaur, 50))).toBeGreaterThan(getMaxHealth(bulbasaur));
    expect(getMaxHealth(pokemon(Species.Bulbasaur, 50, 0))).toBeLessThan(getMaxHealth(bulbasaur));
  });

  it('keeps the share when the pool changes', () => {
    // The figure the mechanic is written around: half of a hundred
    // is sixty of a hundred and twenty
    expect(rescaleHealth(50, 100, 120)).toBe(60);
    expect(rescaleHealth(100, 100, 120)).toBe(120);

    // A pokemon that was down stays down — an evolution is not a
    // revival — and one that was up never falls to zero on a
    // rounding step it did not deserve
    expect(rescaleHealth(0, 100, 120)).toBe(0);
    expect(rescaleHealth(1, 400, 40)).toBe(1);

    // A smaller pool takes the share with it rather than overflowing
    expect(rescaleHealth(50, 100, 40)).toBe(20);
    expect(rescaleHealth(50, 0, 120)).toBe(0);
  });
});

describe('what a battle leaves behind', () => {
  it('names the statuses a pokemon carries out of one', () => {
    // Poison, sleep, paralysis, a burn and ice are the fight's
    // leftovers; everything else belongs to the fight
    for (const status of NON_VOLATILE_STATUSES) {
      expect(isNonVolatileStatus(status)).toBe(true);
    }
    expect(NON_VOLATILE_STATUSES).toHaveLength(6);
    for (const status of [Statuses.Confused, Statuses.Flinched, Statuses.Substituted]) {
      expect(isNonVolatileStatus(status)).toBe(false);
    }
  });

  it('keeps every carried status, and drops what ended with the fight', () => {
    // A unit can be several things at once — poisoned and asleep is
    // an ordinary way to come out of a raid — and all of it travels
    expect(carriedStatuses([Statuses.Poisoned, Statuses.Sleeping])).toEqual([
      Statuses.Poisoned,
      Statuses.Sleeping,
    ]);
    // What ended with the battle is dropped, and one of each is kept
    expect(
      carriedStatuses([Statuses.Burned, Statuses.Confused, Statuses.Burned, Statuses.Flinched]),
    ).toEqual([Statuses.Burned]);
    expect(carriedStatuses([])).toEqual([]);
  });

  it('calls a pokemon on nothing fainted', () => {
    const whole = { ...pokemon(Species.Bulbasaur, 50), statuses: [] };
    const max = getMaxHealth(whole);

    expect(isFainted({ ...whole, health: 0 })).toBe(true);
    expect(isFainted({ ...whole, health: 1 })).toBe(false);

    // Care is anything short of whole and clean
    expect(needsCare({ ...whole, health: max })).toBe(false);
    expect(needsCare({ ...whole, health: max - 1 })).toBe(true);
    expect(needsCare({ ...whole, health: max, statuses: [Statuses.Burned] })).toBe(true);
  });
});

describe('berries between battles', () => {
  const hurt = (health: number, statuses: Statuses[] = []): HealthState & HealthSource => ({
    ...pokemon(Species.Bulbasaur, 50),
    health,
    statuses,
  });

  it('restores what the berry is worth, and no more than the pool', () => {
    const max = getMaxHealth(pokemon(Species.Bulbasaur, 50));

    expect(healedByBerry(hurt(20), Items.OranBerry)).toEqual({ health: 30, statuses: [] });
    expect(healedByBerry(hurt(20), Items.SitrusBerry)).toEqual({
      health: 20 + Math.floor(max / 4),
      statuses: [],
    });
    expect(healedByBerry(hurt(max - 1), Items.SitrusBerry)).toEqual({
      health: max,
      statuses: [],
    });
  });

  it('brings a fainted pokemon back, since nothing else revives', () => {
    expect(healedByBerry(hurt(0), Items.OranBerry)).toEqual({ health: 10, statuses: [] });
  });

  it('cures only what the berry covers', () => {
    const max = getMaxHealth(pokemon(Species.Bulbasaur, 50));

    expect(healedByBerry(hurt(max, [Statuses.Poisoned]), Items.PechaBerry)).toEqual({
      health: max,
      statuses: [],
    });
    expect(healedByBerry(hurt(max, [Statuses.BadlyPoisoned]), Items.PechaBerry)).toEqual({
      health: max,
      statuses: [],
    });
    expect(healedByBerry(hurt(max, [Statuses.Burned]), Items.LumBerry)).toEqual({
      health: max,
      statuses: [],
    });

    // The wrong cure does nothing, and a berry that does nothing is
    // never spent
    expect(healedByBerry(hurt(max, [Statuses.Burned]), Items.PechaBerry)).toBeNull();
    // Nor is one handed to a pokemon in perfect shape
    expect(healedByBerry(hurt(max), Items.OranBerry)).toBeNull();
    // Leppa restores what this engine spends as a cooldown, and
    // Persim cures something no record carries: neither has anything
    // to do out of a battle
    expect(healedByBerry(hurt(1), Items.LeppaBerry)).toBeNull();
    expect(healedByBerry(hurt(max, [Statuses.Burned]), Items.PersimBerry)).toBeNull();
  });

  it('cures everything the berry covers, not the first of them', () => {
    // A Lum on a pokemon that is poisoned *and* paralyzed clears
    // both; a Pecha beside it takes only the poison
    const ailing = hurt(20, [Statuses.Poisoned, Statuses.Paralyzed]);

    expect(healedByBerry(ailing, Items.LumBerry)).toEqual({ health: 20, statuses: [] });
    expect(healedByBerry(ailing, Items.PechaBerry)).toEqual({
      health: 20,
      statuses: [Statuses.Paralyzed],
    });
  });
});

describe('stored records', () => {
  it('reads a record written before health as whole', () => {
    // Nothing backfills the field, and reading a missing one as zero
    // would faint every pokemon caught until now
    const stored = {
      owner: 'trainer',
      species: Species.Bulbasaur,
      level: 50,
      ivs: evenly(31),
      effortValues: evenly(0),
    };
    const restored = asCaughtPokemon(stored);

    expect(restored.health).toBe(getMaxHealth(pokemon(Species.Bulbasaur, 50)));
    expect(restored.statuses).toEqual([]);

    // A stored zero is a fainted pokemon, not a missing field
    expect(asCaughtPokemon({ ...stored, health: 0 }).health).toBe(0);
    expect(
      asCaughtPokemon({ ...stored, statuses: [Statuses.Burned, Statuses.Poisoned] }).statuses,
    ).toEqual([Statuses.Burned, Statuses.Poisoned]);
  });
});
