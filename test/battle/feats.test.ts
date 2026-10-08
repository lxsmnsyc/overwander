import { describe, expect, it } from 'vitest';
import { EffectType } from '../../src/battle/events';
import { Stats } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import { TimeOfDay } from '../../src/data/ids/biome';
import type { Items } from '../../src/data/ids/items';
import { MoveAttackFlags, MoveCategories, Moves } from '../../src/data/ids/moves';
import { Genders, Species } from '../../src/data/ids/species';
import { BASE_FRIENDSHIP } from '../../src/data/constants/friendship';
import {
  type EvolutionContext,
  getAvailableEvolutions,
  getConsumedItem,
  getSpeciesData,
  meetsEvolutionCriteria,
} from '../../src/data/species';
import { meetsBattleFeat } from '../../src/data/species/feats';
import { createBattle, createUnit, pinRandom } from './harness';

const NONE_CAUSE = { type: EffectType.None } as const;

describe('measuring a battle feat', () => {
  it('counts the critical hits a unit lands', () => {
    const { battle, teamA, teamB } = createBattle();
    // Every roll a critical, and the defender too sturdy to fall
    pinRandom(battle, 0);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    defender.setHealth(9999);

    for (let hit = 0; hit < 3; hit += 1) {
      attacker.attack(
        defender,
        Moves.Tackle,
        40,
        Types.Normal,
        MoveCategories.Physical,
        MoveAttackFlags.Critical,
      );
    }

    expect(attacker.criticals).toBe(3);
    expect(defender.criticals).toBe(0);
  });

  it('counts no critical for a blow that could not crit, or one only weighed', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    attacker.attack(defender, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    attacker.attack(
      defender,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
      MoveAttackFlags.Critical | MoveAttackFlags.Simulated,
    );

    expect(attacker.criticals).toBe(0);
  });

  it('counts the health a unit takes, overkill left out', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const victim = createUnit(battle, teamB);

    attacker.damage(NONE_CAUSE, victim, 30, 0);
    attacker.damage(NONE_CAUSE, victim, 25, 0);
    expect(victim.taken).toBe(55);

    attacker.damage(NONE_CAUSE, victim, 9999, 0);
    expect(victim.taken).toBe(victim.checkStat(Stats.HP, 0));
    expect(attacker.taken).toBe(0);
  });
});

describe('the feats', () => {
  it("asks a Galarian Farfetch'd for three criticals", () => {
    expect(meetsBattleFeat(Species.FarfetchdGalar, { criticals: 3, taken: 0, health: 1 })).toBe(
      true,
    );
    expect(meetsBattleFeat(Species.FarfetchdGalar, { criticals: 2, taken: 0, health: 1 })).toBe(
      false,
    );
  });

  it('asks a Galarian Yamask to take 49 and still be standing', () => {
    expect(meetsBattleFeat(Species.YamaskGalar, { criticals: 0, taken: 49, health: 1 })).toBe(true);
    expect(meetsBattleFeat(Species.YamaskGalar, { criticals: 0, taken: 48, health: 1 })).toBe(
      false,
    );
    expect(meetsBattleFeat(Species.YamaskGalar, { criticals: 0, taken: 99, health: 0 })).toBe(
      false,
    );
  });

  it('asks nothing of a species with no feat', () => {
    expect(meetsBattleFeat(Species.Farfetchd, { criticals: 9, taken: 99, health: 1 })).toBe(false);
  });
});

describe('a feat evolution', () => {
  const stats: Record<Stats, number> = {
    [Stats.HP]: 50,
    [Stats.Attack]: 50,
    [Stats.Defense]: 50,
    [Stats.SpecialAttack]: 50,
    [Stats.SpecialDefense]: 50,
    [Stats.Speed]: 50,
  };

  function contextOf(species: Species, canEvolve: boolean): EvolutionContext {
    return {
      species,
      level: 30,
      carried: new Set<Items>(),
      held: new Set<Items>(),
      canEvolve,
      stats,
      friendship: BASE_FRIENDSHIP,
      time: TimeOfDay.Day,
      moves: new Set<Moves>(),
      gender: Genders.Male,
    };
  }

  it("opens Sirfetch'd and Runerigus once the feat has set the flag", () => {
    createBattle();

    for (const [from, into] of [
      [Species.FarfetchdGalar, Species.Sirfetchd],
      [Species.YamaskGalar, Species.Runerigus],
    ] as const) {
      expect(getAvailableEvolutions(contextOf(from, false))).toEqual([]);

      const [road] = getAvailableEvolutions(contextOf(from, true));

      expect(road.species).toBe(into);
      // Nothing spent out of the bag: the fight was the price
      expect(getConsumedItem(road, true)).toBeNull();
    }
  });

  it('keeps a feat evolution shut for a species with no feat behind it', () => {
    createBattle();
    const [road] = getSpeciesData(Species.FarfetchdGalar).evolvesInto ?? [];

    // The same road read for a species the table does not name: the
    // flag alone is a trade's word, not a feat's
    expect(meetsEvolutionCriteria(road, contextOf(Species.Machoke, true))).toBe(false);
  });
});
