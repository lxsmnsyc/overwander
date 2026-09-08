import { describe, expect, it } from 'vitest';
import {
  SEED_CACHE_BANK_FRACTION,
  SEED_CACHE_CAP_FRACTION,
} from '../../../src/battle/abilities/signature';
import { EffectType } from '../../../src/battle/events';
import { Stats } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import Abilities from '../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../src/data/ids/moves';
import { createBattle, createUnit, pinRandom } from '../harness';

const NONE_CAUSE = { type: EffectType.None } as const;

/** Deterministic direct attack; returns the health lost by the target */
function dealDamage(
  attacker: ReturnType<typeof createUnit>,
  defender: ReturnType<typeof createUnit>,
  move: Moves,
  power: number,
  type: Types,
  category: MoveCategories,
): number {
  const before = defender.health;
  attacker.attack(defender, move, power, type, category, 0);
  return before - defender.health;
}

describe('Seed Cache', () => {
  it('banks a quarter of what it takes and spends it on a Grass move', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SeedCache);

    enemy.damage(NONE_CAUSE, holder, 40, 0);

    const spent = dealDamage(
      holder,
      enemy,
      Moves.VineWhip,
      45,
      Types.Grass,
      MoveCategories.Physical,
    );
    const plain = dealDamage(
      holder,
      enemy,
      Moves.VineWhip,
      45,
      Types.Grass,
      MoveCategories.Physical,
    );

    expect(spent - plain).toBeCloseTo(40 * SEED_CACHE_BANK_FRACTION, 5);
  });

  it('empties the bank once it is spent, and only Grass spends it', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SeedCache);

    enemy.damage(NONE_CAUSE, holder, 40, 0);

    const normal = dealDamage(
      holder,
      enemy,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );
    const plainNormal = dealDamage(
      holder,
      enemy,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    // A Normal move leaves the bank where it is
    expect(normal).toBeCloseTo(plainNormal, 5);

    const first = dealDamage(
      holder,
      enemy,
      Moves.VineWhip,
      45,
      Types.Grass,
      MoveCategories.Physical,
    );
    const second = dealDamage(
      holder,
      enemy,
      Moves.VineWhip,
      45,
      Types.Grass,
      MoveCategories.Physical,
    );

    expect(first - second).toBeCloseTo(40 * SEED_CACHE_BANK_FRACTION, 5);
  });

  it('fills no further than half its HP', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SeedCache);

    const maxHP = holder.checkStat(Stats.HP, 0);

    // Fed far past the cap, healed back each time so it survives
    for (let i = 0; i < 20; i += 1) {
      enemy.damage(NONE_CAUSE, holder, 100, 0);
      holder.setHealth(maxHP);
    }

    const spent = dealDamage(
      holder,
      enemy,
      Moves.VineWhip,
      45,
      Types.Grass,
      MoveCategories.Physical,
    );
    const plain = dealDamage(
      holder,
      enemy,
      Moves.VineWhip,
      45,
      Types.Grass,
      MoveCategories.Physical,
    );

    expect(spent - plain).toBeCloseTo(maxHP * SEED_CACHE_CAP_FRACTION, 5);
  });
});
