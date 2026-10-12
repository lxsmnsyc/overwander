import { describe, expect, it } from 'vitest';
import { EffectType, MoveTargetType } from '../../src/battle/events';
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
import {
  BATTLE_FEATS,
  describeFeat,
  meetsBattleFeat,
  settleBattleFeat,
} from '../../src/data/species/feats';
import registerData from '../../src/data';
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

describe('measuring a feat counted across fights', () => {
  it('counts the uses a unit lands, by move', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    defender.setHealth(9999);

    for (let hit = 0; hit < 2; hit += 1) {
      attacker.attack(defender, Moves.PsyshieldBash, 70, Types.Psychic, MoveCategories.Physical, 0);
    }
    attacker.attack(defender, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    // Weighed rather than thrown, so it never landed
    attacker.attack(
      defender,
      Moves.PsyshieldBash,
      70,
      Types.Psychic,
      MoveCategories.Physical,
      MoveAttackFlags.Simulated,
    );

    expect(attacker.landed.get(Moves.PsyshieldBash)).toBe(2);
    expect(attacker.landed.get(Moves.Tackle)).toBe(1);
    expect(defender.landed.size).toBe(0);
  });

  it('counts the recoil a unit takes from its own move', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    attacker.triggerMoveEffect(Moves.WaveCrash, { type: MoveTargetType.Unit, unit: defender }, 0);

    expect(attacker.recoil).toBeGreaterThan(0);
    expect(attacker.recoil).toBeCloseTo(attacker.checkStat(Stats.HP, 0) - attacker.health);
    expect(defender.recoil).toBe(0);
  });

  it('counts no recoil for a hit taken from somebody else', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const victim = createUnit(battle, teamB);

    attacker.damage(NONE_CAUSE, victim, 30, 0);

    expect(victim.recoil).toBe(0);
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

describe('the feats counted across fights', () => {
  const fight = { criticals: 0, taken: 0, health: 1 };

  it('asks a Stantler for Psyshield Bash 20 times over as many fights as it takes', () => {
    expect(settleBattleFeat(Species.Stantler, { ...fight, landed: 7 }, 0)).toEqual({
      progress: 7,
      met: false,
    });
    expect(settleBattleFeat(Species.Stantler, { ...fight, landed: 13 }, 7)).toEqual({
      progress: 20,
      met: true,
    });
    // Capped at the goal, so a total never runs past what it asks
    expect(settleBattleFeat(Species.Stantler, { ...fight, landed: 30 }, 0).progress).toBe(20);
    // One fight alone is never enough to open it the one-fight way
    expect(meetsBattleFeat(Species.Stantler, { ...fight, landed: 20 })).toBe(false);
  });

  it('asks a Hisuian Qwilfish for Barb Barrage 20 times', () => {
    expect(settleBattleFeat(Species.QwilfishHisui, { ...fight, landed: 19 }, 0).met).toBe(false);
    expect(settleBattleFeat(Species.QwilfishHisui, { ...fight, landed: 1 }, 19).met).toBe(true);
  });

  it('asks a white-striped Basculin for 294 recoil, a fainted fight adding nothing', () => {
    expect(settleBattleFeat(Species.BasculinWhite, { ...fight, recoil: 200 }, 0)).toEqual({
      progress: 200,
      met: false,
    });
    expect(
      settleBattleFeat(Species.BasculinWhite, { ...fight, recoil: 200, health: 0 }, 200),
    ).toEqual({ progress: 200, met: false });
    expect(settleBattleFeat(Species.BasculinWhite, { ...fight, recoil: 94 }, 200)).toEqual({
      progress: 294,
      met: true,
    });
  });

  it('keeps no total for a one-fight feat or a species with none', () => {
    expect(settleBattleFeat(Species.FarfetchdGalar, { ...fight, criticals: 3 }, 0)).toEqual({
      progress: 0,
      met: true,
    });
    expect(settleBattleFeat(Species.Pidgey, { ...fight, landed: 50, recoil: 500 }, 0)).toEqual({
      progress: 0,
      met: false,
    });
  });

  it('says what each asks, and how far along it is', () => {
    registerData();
    const say = (species: Species, progress?: number): string => {
      const feat = BATTLE_FEATS.get(species);

      return feat == null ? '' : describeFeat(feat, progress);
    };

    expect(say(Species.Stantler)).toBe('land Psyshield Bash 20 times');
    expect(say(Species.Stantler, 7)).toBe('land Psyshield Bash 20 times (7/20)');
    expect(say(Species.BasculinWhite)).toBe('take 294 recoil damage without fainting');
    expect(say(Species.FarfetchdGalar, 2)).toBe('land 3 critical hits in one fight');
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
      [Species.Stantler, Species.Wyrdeer],
      [Species.QwilfishHisui, Species.Overqwil],
      [Species.BasculinWhite, Species.Basculegion],
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
