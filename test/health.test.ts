import { beforeAll, describe, expect, it } from 'vitest';
import { ACQUISITION_NAMES, Acquisition, asCaughtPokemon } from '../src/auth/caught-record';
import type { HealthSource, HealthState } from '../src/auth/health';
import {
  NON_VOLATILE_STATUSES,
  carriedStatuses,
  getMaxHealth,
  healedByItem,
  isFainted,
  isNonVolatileStatus,
  needsCare,
  rescaleHealth,
} from '../src/auth/health';
import { Stats, getHealthStat, packIVs } from '../src/data/constants/stats';
import { Items } from '../src/data/ids/items';
import { bitterness, isHerbal } from '../src/data/items/medicine';
import { Species } from '../src/data/ids/species';
import { Statuses, packStatuses, unpackStatuses } from '../src/data/ids/status';
import registerGen1Moves from '../src/data/moves/gen-1';
import { EncounterType } from '../src/overworld/encounter';
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
function pokemon(species: Species, level: number, iv = 31): HealthSource {
  return { species, level, ivs: packIVs(evenly(iv)), effortValues: evenly(0) };
}

describe('maximum health', () => {
  it('derives it from the same formula the battle fights on', () => {
    const bulbasaur = pokemon(Species.Bulbasaur, 50);
    const base = getSpeciesData(Species.Bulbasaur).stats[Stats.HP];

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
    const both = packStatuses([Statuses.Poisoned, Statuses.Sleeping]);

    expect(carriedStatuses(both)).toBe(both);
    expect(unpackStatuses(both)).toEqual([Statuses.Poisoned, Statuses.Sleeping]);
    // What ended with the battle is masked off, and a set has no
    // room for the same thing twice
    expect(
      carriedStatuses(packStatuses([Statuses.Burned, Statuses.Confused, Statuses.Flinched])),
    ).toBe(packStatuses([Statuses.Burned]));
    expect(carriedStatuses(0)).toBe(0);
  });

  it('calls a pokemon on nothing fainted', () => {
    const whole = { ...pokemon(Species.Bulbasaur, 50), statuses: 0 };
    const max = getMaxHealth(whole);

    expect(isFainted({ ...whole, health: 0 })).toBe(true);
    expect(isFainted({ ...whole, health: 1 })).toBe(false);

    // Care is anything short of whole and clean
    expect(needsCare({ ...whole, health: max })).toBe(false);
    expect(needsCare({ ...whole, health: max - 1 })).toBe(true);
    expect(needsCare({ ...whole, health: max, statuses: packStatuses([Statuses.Burned]) })).toBe(
      true,
    );
  });
});

describe('berries between battles', () => {
  const hurt = (health: number, statuses: Statuses[] = []): HealthState & HealthSource => ({
    ...pokemon(Species.Bulbasaur, 50),
    health,
    statuses: packStatuses(statuses),
  });

  it('restores what the berry is worth, and no more than the pool', () => {
    const max = getMaxHealth(pokemon(Species.Bulbasaur, 50));

    expect(healedByItem(hurt(20), Items.OranBerry)).toEqual({ health: 30, statuses: 0 });
    expect(healedByItem(hurt(20), Items.SitrusBerry)).toEqual({
      health: 20 + Math.floor(max / 4),
      statuses: 0,
    });
    expect(healedByItem(hurt(max - 1), Items.SitrusBerry)).toEqual({
      health: max,
      statuses: 0,
    });
  });

  it('cannot reach a pokemon that is down', () => {
    // A berry or a potion on a fainted pokemon does nothing, the way
    // it does not in the mainline games: that is what a revive is for
    expect(healedByItem(hurt(0), Items.OranBerry)).toBeNull();
    expect(healedByItem(hurt(0), Items.HyperPotion)).toBeNull();
    expect(healedByItem(hurt(0, [Statuses.Burned]), Items.FullHeal)).toBeNull();
  });

  it('cures only what the berry covers', () => {
    const max = getMaxHealth(pokemon(Species.Bulbasaur, 50));

    expect(healedByItem(hurt(max, [Statuses.Poisoned]), Items.PechaBerry)).toEqual({
      health: max,
      statuses: 0,
    });
    expect(healedByItem(hurt(max, [Statuses.BadlyPoisoned]), Items.PechaBerry)).toEqual({
      health: max,
      statuses: 0,
    });
    expect(healedByItem(hurt(max, [Statuses.Burned]), Items.LumBerry)).toEqual({
      health: max,
      statuses: 0,
    });

    // The wrong cure does nothing, and a berry that does nothing is
    // never spent
    expect(healedByItem(hurt(max, [Statuses.Burned]), Items.PechaBerry)).toBeNull();
    // Nor is one handed to a pokemon in perfect shape
    expect(healedByItem(hurt(max), Items.OranBerry)).toBeNull();
    // Leppa restores what this engine spends as a cooldown, and
    // Persim cures something no record carries: neither has anything
    // to do out of a battle
    expect(healedByItem(hurt(1), Items.LeppaBerry)).toBeNull();
    expect(healedByItem(hurt(max, [Statuses.Burned]), Items.PersimBerry)).toBeNull();
  });

  it('cures everything the berry covers, not the first of them', () => {
    // A Lum on a pokemon that is poisoned *and* paralyzed clears
    // both; a Pecha beside it takes only the poison
    const ailing = hurt(20, [Statuses.Poisoned, Statuses.Paralyzed]);

    expect(healedByItem(ailing, Items.LumBerry)).toEqual({ health: 20, statuses: 0 });
    expect(healedByItem(ailing, Items.PechaBerry)).toEqual({
      health: 20,
      statuses: packStatuses([Statuses.Paralyzed]),
    });
  });
});

describe('medicine', () => {
  const hurt = (health: number, statuses: Statuses[] = []): HealthState & HealthSource => ({
    ...pokemon(Species.Bulbasaur, 50),
    health,
    statuses: packStatuses(statuses),
  });
  const max = (): number => getMaxHealth(pokemon(Species.Bulbasaur, 50));

  it('pours a potion in by the flat figure it is worth', () => {
    expect(healedByItem(hurt(20), Items.Potion)).toEqual({ health: 40, statuses: 0 });
    expect(healedByItem(hurt(20), Items.SuperPotion)).toEqual({ health: 80, statuses: 0 });
    // A Bulbasaur's pool is smaller than a Hyper Potion is worth, so
    // the pour stops at the brim
    expect(healedByItem(hurt(20), Items.HyperPotion)).toEqual({ health: max(), statuses: 0 });

    // A Max Potion is as much as the pool holds, and no potion
    // overfills one
    expect(healedByItem(hurt(20), Items.MaxPotion)).toEqual({ health: max(), statuses: 0 });
    expect(healedByItem(hurt(max() - 1), Items.HyperPotion)).toEqual({
      health: max(),
      statuses: 0,
    });

    // A potion carries no cure, and one poured over a whole pokemon
    // is one spent on nothing
    expect(healedByItem(hurt(max() - 5, [Statuses.Burned]), Items.Potion)).toEqual({
      health: max(),
      statuses: packStatuses([Statuses.Burned]),
    });
    expect(healedByItem(hurt(max()), Items.Potion)).toBeNull();
  });

  it('takes off exactly what the cure covers', () => {
    const ailing = hurt(20, [Statuses.Poisoned, Statuses.Paralyzed, Statuses.Burned]);

    expect(healedByItem(ailing, Items.Antidote)).toEqual({
      health: 20,
      statuses: packStatuses([Statuses.Paralyzed, Statuses.Burned]),
    });
    expect(healedByItem(ailing, Items.ParalyzeHeal)).toEqual({
      health: 20,
      statuses: packStatuses([Statuses.Poisoned, Statuses.Burned]),
    });
    // Full Heal takes the lot; a cure that covers none of it is not
    // spent, and none of them gives health back
    expect(healedByItem(ailing, Items.FullHeal)).toEqual({ health: 20, statuses: 0 });
    expect(healedByItem(hurt(20, [Statuses.Burned]), Items.Antidote)).toBeNull();
    expect(healedByItem(hurt(20, [Statuses.Sleeping]), Items.Awakening)).toEqual({
      health: 20,
      statuses: 0,
    });
  });

  it('does both halves of the job with a Full Restore', () => {
    expect(healedByItem(hurt(20, [Statuses.Frozen]), Items.FullRestore)).toEqual({
      health: max(),
      statuses: 0,
    });
  });

  it('revives only what is down, and only a revive does', () => {
    // Half a pool for a Revive, the whole of it for a Max — and the
    // statuses go with the faint
    expect(healedByItem(hurt(0, [Statuses.Burned]), Items.Revive)).toEqual({
      health: Math.round(max() / 2),
      statuses: 0,
    });
    expect(healedByItem(hurt(0), Items.MaxRevive)).toEqual({ health: max(), statuses: 0 });

    // A revive is worth nothing to a pokemon still standing, however
    // badly hurt it is
    expect(healedByItem(hurt(1), Items.Revive)).toBeNull();
    expect(healedByItem(hurt(1), Items.MaxRevive)).toBeNull();
  });

  it('reads herbal medicine as medicine, and charges friendship for it', () => {
    // Each herb out-does the bottle it stands beside: the powder
    // beats a Super Potion, the root beats a Hyper Potion, and the
    // herb is a Max Revive that grows out of the ground
    expect(healedByItem(hurt(20), Items.EnergyPowder)).toEqual({ health: 70, statuses: 0 });
    expect(healedByItem(hurt(20), Items.EnergyRoot)).toEqual({ health: max(), statuses: 0 });
    expect(healedByItem(hurt(20, [Statuses.Frozen]), Items.HealPowder)).toEqual({
      health: 20,
      statuses: 0,
    });
    expect(healedByItem(hurt(0), Items.RevivalHerb)).toEqual({ health: max(), statuses: 0 });

    // And each is refused where it would do nothing, exactly as its
    // bottled counterpart is
    expect(healedByItem(hurt(max()), Items.EnergyPowder)).toBeNull();
    expect(healedByItem(hurt(0), Items.EnergyRoot)).toBeNull();
    expect(healedByItem(hurt(1), Items.RevivalHerb)).toBeNull();

    // What separates them from the bottles is the bill, counted in
    // mouthfuls of bitterness
    expect(isHerbal(Items.EnergyPowder)).toBe(true);
    expect(isHerbal(Items.MaxRevive)).toBe(false);
    expect(bitterness(Items.EnergyPowder)).toBe(1);
    expect(bitterness(Items.HealPowder)).toBe(1);
    expect(bitterness(Items.EnergyRoot)).toBe(2);
    expect(bitterness(Items.RevivalHerb)).toBe(3);
    expect(bitterness(Items.Potion)).toBe(0);
  });
});

describe('stored records', () => {
  /**
   * The fields every stored record needs before it can be read back:
   * the maximum health is derived, so a record has to name a species
   */
  const bulbasaur = {
    species: Species.Bulbasaur,
    level: 50,
    ivs: packIVs(evenly(31)),
    effortValues: evenly(0),
  };

  it('reads a record written before health as whole', () => {
    // Nothing backfills the field, and reading a missing one as zero
    // would faint every pokemon caught until now
    const stored = {
      owner: 'trainer',
      species: Species.Bulbasaur,
      level: 50,
      ivs: packIVs(evenly(31)),
      effortValues: evenly(0),
    };
    const restored = asCaughtPokemon(stored);

    expect(restored.health).toBe(getMaxHealth(pokemon(Species.Bulbasaur, 50)));
    expect(restored.statuses).toBe(0);

    // A stored zero is a fainted pokemon, not a missing field
    expect(asCaughtPokemon({ ...stored, health: 0 }).health).toBe(0);
    const carried = packStatuses([Statuses.Burned, Statuses.Poisoned]);

    expect(asCaughtPokemon({ ...stored, statuses: carried }).statuses).toBe(carried);
  });

  it('says how each owner came by the pokemon', () => {
    const owned = asCaughtPokemon({
      ...bulbasaur,
      owner: 'buyer',
      type: EncounterType.Wild,
      history: [
        { owner: 'catcher', acquiredAt: '2026-01-01T00:00:00+08:00', kind: Acquisition.Caught },
        { owner: 'buyer', acquiredAt: '2026-02-01T00:00:00+08:00', kind: Acquisition.Auction },
      ],
    });

    expect(owned.history.map((entry) => entry.kind)).toEqual([
      Acquisition.Caught,
      Acquisition.Auction,
    ]);
    // Every kind has something to call it, including the one nothing
    // writes yet
    expect(ACQUISITION_NAMES[Acquisition.Trade]).not.toBe('');
  });

  it('reads a history written before the kind existed', () => {
    // The first entry is where the pokemon began, which the record's
    // own type knows; anything after it can only be a sale, since the
    // auction house is the one thing that has ever appended an entry
    const entries = [
      { owner: 'first', acquiredAt: '2026-01-01T00:00:00+08:00' },
      { owner: 'second', acquiredAt: '2026-02-01T00:00:00+08:00' },
    ];

    expect(
      asCaughtPokemon({ ...bulbasaur, type: EncounterType.Wild, history: entries }).history.map(
        (one) => one.kind,
      ),
    ).toEqual([Acquisition.Caught, Acquisition.Auction]);

    expect(
      asCaughtPokemon({ ...bulbasaur, type: EncounterType.Hatched, history: entries }).history.map(
        (one) => one.kind,
      ),
    ).toEqual([Acquisition.Egg, Acquisition.Auction]);
  });
});
