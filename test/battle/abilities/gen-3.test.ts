import { describe, expect, it } from 'vitest';
import { Stages, Stats } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import Abilities from '../../../src/data/ids/abilities';
import { Moves } from '../../../src/data/ids/moves';
import type { EffectCause } from '../../../src/battle/events';
import { EffectType, MoveTargetType } from '../../../src/battle/events';
import type Unit from '../../../src/battle/unit';
import { Statuses } from '../../../src/data/ids/status';
import turns from '../../../src/battle/turn';
import { createBattle, createUnit } from '../harness';

/** A poison with somebody behind it, which is what chips at all. */
function laidBy(unit: Unit): EffectCause {
  return { type: EffectType.Move, unit, move: Moves.Toxic };
}

/** Small enough that a cast is watched rather than jumped over. */
const STEP = 100;

describe('Truant', () => {
  it('loafs for a turn after every move it finishes', () => {
    const { battle, teamA, teamB } = createBattle();
    const slacker = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    slacker.addAbility(Abilities.Truant);
    slacker.addMove(Moves.Scratch);

    const aim = { type: MoveTargetType.Unit, unit: target } as const;

    expect(slacker.checkCanCast(Moves.Scratch, aim)).toBe(true);

    slacker.cast(Moves.Scratch, aim);

    while (slacker.casting != null) {
      battle.tick(STEP);
    }

    // The cast is done and it is loafing rather than swinging again
    expect(slacker.status[Statuses.Recharging]).not.toBeUndefined();
    expect(slacker.checkCanCast(Moves.Scratch, aim)).toBe(false);

    battle.tick(turns(1));

    expect(slacker.status[Statuses.Recharging]).toBeUndefined();

    // The move's own cooldown is a separate clock, so it is cleared
    // to show the loafing is what had been in the way
    slacker.finishCooldown(Moves.Scratch);

    expect(slacker.checkCanCast(Moves.Scratch, aim)).toBe(true);
  });

  it('leaves anybody else alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const slacker = createUnit(battle, teamA);
    const busy = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    slacker.addAbility(Abilities.Truant);
    busy.addMove(Moves.Scratch);

    const aim = { type: MoveTargetType.Unit, unit: target } as const;

    busy.cast(Moves.Scratch, aim);

    while (busy.casting != null) {
      battle.tick(STEP);
    }

    expect(busy.status[Statuses.Recharging]).toBeUndefined();
  });
});

describe('Poison Heal', () => {
  it('takes the poison back as health', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const poisoner = createUnit(battle, teamB);
    holder.addAbility(Abilities.PoisonHeal);

    holder.setHealth(holder.checkStat(Stats.HP, 0) / 2);
    holder.addStatus(Statuses.Poisoned, laidBy(poisoner));

    const before = holder.health;
    battle.tick(turns(1));

    expect(holder.health).toBeGreaterThan(before);
    // Still poisoned: only the health it takes turns around
    expect(holder.status[Statuses.Poisoned]).not.toBeUndefined();
  });

  it('leaves a poisoned pokemon without it alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const plain = createUnit(battle, teamA);
    const poisoner = createUnit(battle, teamB);

    plain.addStatus(Statuses.Poisoned, laidBy(poisoner));

    const before = plain.health;
    battle.tick(turns(1));

    expect(plain.health).toBeLessThan(before);
  });
});

describe('Wind Rider', () => {
  it('turns a wind move away and takes an Attack stage from it', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    holder.addAbility(Abilities.WindRider);

    const target = { type: MoveTargetType.Unit, unit: holder } as const;

    expect(attacker.checkMoveImmunity(Moves.Gust, target, Types.Flying)).toBe(true);

    // Asking is not being hit, so nothing is gained by the question
    expect(holder.stages[Stages.Attack]).toBe(0);

    const before = holder.health;
    attacker.triggerMoveTarget(Moves.Gust, target, 0);

    expect(holder.health).toBe(before);
    expect(holder.stages[Stages.Attack]).toBe(1);
  });

  it('rides the wind whatever type it comes as', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    holder.addAbility(Abilities.WindRider);

    const target = { type: MoveTargetType.Unit, unit: holder } as const;

    expect(attacker.checkMoveImmunity(Moves.Blizzard, target, Types.Ice)).toBe(true);
    expect(attacker.checkMoveImmunity(Moves.SilverWind, target, Types.Bug)).toBe(true);
  });

  it('stands in the way of anything that is not wind', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    holder.addAbility(Abilities.WindRider);

    const target = { type: MoveTargetType.Unit, unit: holder } as const;

    expect(attacker.checkMoveImmunity(Moves.WingAttack, target, Types.Flying)).toBe(false);

    const before = holder.health;
    attacker.triggerMoveTarget(Moves.WingAttack, target, 0);

    expect(holder.health).toBeLessThan(before);
    expect(holder.stages[Stages.Attack]).toBe(0);
  });
});
