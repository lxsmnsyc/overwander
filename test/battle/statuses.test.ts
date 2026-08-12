import { describe, expect, it } from 'vitest';
import { EventPriority } from '../../src/core/event-emitter';
import { BattleEvents, EffectType, MoveTargetType } from '../../src/battle/events';
import { RESIDUAL_TICK } from '../../src/battle/status/__create';
import type Unit from '../../src/battle/unit';
import { Stages } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import { MoveCategories, Moves } from '../../src/data/ids/moves';
import { Genders } from '../../src/data/ids/species';
import { Statuses, TeamStatuses } from '../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from './harness';

const NONE_CAUSE = { type: EffectType.None } as const;

function moveCause(
  unit: Unit,
  move = Moves.Tackle,
): { readonly type: EffectType.Move; readonly move: Moves; readonly unit: Unit } {
  return { type: EffectType.Move, move, unit } as const;
}

function unitTarget(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

describe('Poisoned', () => {
  it('drains an eighth of max health per tick and is curable', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const victim = createUnit(battle, teamB);

    victim.addStatus(Statuses.Poisoned, moveCause(attacker));

    // It bites every two seconds, so a second of it costs nothing yet
    battle.tick(1000);
    expect(victim.health).toBe(160);

    battle.tick(1000);
    expect(victim.health).toBe(140);

    victim.cure(NONE_CAUSE);
    battle.tick(2000);
    expect(victim.health).toBe(140);
  });

  it('cannot be reapplied while active', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const victim = createUnit(battle, teamB);

    let applications = 0;
    battle.on(BattleEvents.UnitAddStatus, 2, (event) => {
      if (event.status === Statuses.Poisoned) {
        applications += 1;
      }
    });

    victim.addStatus(Statuses.Poisoned, moveCause(attacker));
    victim.addStatus(Statuses.Poisoned, moveCause(attacker));

    expect(applications).toBe(1);
  });
});

describe('Badly Poisoned', () => {
  it('escalates its damage every tick', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const victim = createUnit(battle, teamB);

    victim.addStatus(Statuses.BadlyPoisoned, moveCause(attacker, Moves.Toxic));

    // Every two seconds, like every other status that chips away
    battle.tick(1000);
    expect(victim.health).toBe(160);

    battle.tick(1000);
    expect(victim.health).toBe(150); // 1/16

    battle.tick(RESIDUAL_TICK);
    expect(victim.health).toBe(130); // + 2/16
  });
});

describe('Burned', () => {
  it('drains a sixteenth per tick and halves physical damage', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const victim = createUnit(battle, teamB);

    const healthy = (() => {
      const before = victim.health;
      attacker.attack(victim, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
      return before - victim.health;
    })();

    attacker.addStatus(Statuses.Burned, moveCause(victim, Moves.Ember));

    const before = victim.health;
    attacker.attack(victim, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    expect(before - victim.health).toBeCloseTo(healthy / 2);

    const attackerBefore = attacker.health;
    battle.tick(1000);
    expect(attacker.health).toBe(attackerBefore);

    battle.tick(1000);
    expect(attackerBefore - attacker.health).toBe(10); // 160 / 16
  });
});

describe('Leech Seed', () => {
  it('drains the victim and heals the seeder', () => {
    const { battle, teamA, teamB } = createBattle();
    const seeder = createUnit(battle, teamA);
    const victim = createUnit(battle, teamB);
    seeder.setHealth(100);

    victim.addStatus(Statuses.Seeding, moveCause(seeder, Moves.LeechSeed));

    battle.tick(1000);

    expect(victim.health).toBe(160);
    expect(seeder.health).toBe(100);

    battle.tick(1000);

    expect(victim.health).toBe(140);
    expect(seeder.health).toBe(120);
  });
});

describe('Sleeping', () => {
  it('blocks casting until it wears off', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);

    unit.addStatus(Statuses.Sleeping, NONE_CAUSE);
    expect(unit.checkCanCast(Moves.Tackle, unitTarget(enemy))).toBe(false);

    battle.tick(2000);
    expect(unit.status[Statuses.Sleeping]).toBeUndefined();
    expect(unit.checkCanCast(Moves.Tackle, unitTarget(enemy))).toBe(true);
  });
});

describe('Frozen', () => {
  it('blocks casting and thaws on Fire damage', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);

    unit.addStatus(Statuses.Frozen, NONE_CAUSE);
    expect(unit.checkCanCast(Moves.Tackle, unitTarget(enemy))).toBe(false);

    enemy.triggerMoveEffect(Moves.Ember, unitTarget(unit), 0);

    expect(unit.status[Statuses.Frozen]).toBeUndefined();
  });
});

describe('Flinched', () => {
  it('briefly blocks casting', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);

    unit.addStatus(Statuses.Flinched, NONE_CAUSE);
    expect(unit.checkCanCast(Moves.Tackle, unitTarget(enemy))).toBe(false);

    battle.tick(500);
    expect(unit.checkCanCast(Moves.Tackle, unitTarget(enemy))).toBe(true);
  });
});

describe('Paralyzed', () => {
  it('blocks actions a quarter of the time', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);
    unit.addStatus(Statuses.Paralyzed, NONE_CAUSE);

    pinRandom(battle, 0.5); // roll 50 > 25
    expect(unit.checkCanCast(Moves.Tackle, unitTarget(enemy))).toBe(true);

    pinRandom(battle, 0); // roll 0 <= 25
    expect(unit.checkCanCast(Moves.Tackle, unitTarget(enemy))).toBe(false);
  });

  it('locks out new attempts for a second after a proc', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);
    unit.addStatus(Statuses.Paralyzed, NONE_CAUSE);

    pinRandom(battle, 0); // proc
    expect(unit.checkCanCast(Moves.Tackle, unitTarget(enemy))).toBe(false);

    // A winning roll changes nothing while the numbness lasts
    pinRandom(battle, 0.5);
    expect(unit.checkCanCast(Moves.Tackle, unitTarget(enemy))).toBe(false);

    battle.tick(1000);
    expect(unit.checkCanCast(Moves.Tackle, unitTarget(enemy))).toBe(true);
  });
});

describe('Trapped', () => {
  it('blocks escape and drains health until it expires', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const victim = createUnit(battle, teamB);

    victim.addStatus(Statuses.Trapped, moveCause(attacker, Moves.FireSpin));
    expect(victim.checkEscape()).toBe(false);

    battle.tick(1000);
    expect(victim.health).toBe(140); // 1/8

    battle.tick(3000);
    expect(victim.status[Statuses.Trapped]).toBeUndefined();
    expect(victim.checkEscape()).toBe(true);
  });
});

describe('Confused', () => {
  it('sometimes blocks the action and hits the user instead', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);
    unit.addStatus(Statuses.Confused, NONE_CAUSE);

    pinRandom(battle, 0.5); // >= 1/3: hurts itself
    expect(unit.checkCanCast(Moves.Tackle, unitTarget(enemy))).toBe(false);
    expect(unit.health).toBeLessThan(160);

    pinRandom(battle, 0.1); // < 1/3: acts normally
    expect(unit.checkCanCast(Moves.Tackle, unitTarget(enemy))).toBe(true);
  });
});

describe('Reflect', () => {
  it('reduces physical damage for the team until it expires', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const guarded = createUnit(battle, teamB);

    teamB.addStatus(TeamStatuses.Reflect, moveCause(guarded, Moves.Reflect));

    const before = guarded.health;
    attacker.attack(guarded, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    expect(before - guarded.health).toBeCloseTo(19.6 * (2732 / 4096));

    battle.tick(10000);
    expect(teamB.status[TeamStatuses.Reflect]).toBeUndefined();
  });
});

describe('status type immunities', () => {
  it('Fire types cannot be burned', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const fire = createUnit(battle, teamB, [Types.Fire]);

    fire.addStatus(Statuses.Burned, moveCause(attacker, Moves.Ember));

    expect(fire.status[Statuses.Burned]).toBeUndefined();
  });
});

describe('Infatuated', () => {
  it('only takes hold between opposite genders', () => {
    const { battle, teamA, teamB } = createBattle();
    const charmer = createUnit(battle, teamA);
    const smitten = createUnit(battle, teamB);
    const sameGender = createUnit(battle, teamB);
    charmer.setGender(Genders.Female);
    smitten.setGender(Genders.Male);
    sameGender.setGender(Genders.Female);

    const cause = {
      type: EffectType.Move,
      move: Moves.Tackle,
      unit: charmer,
    } as const;

    smitten.addStatus(Statuses.Infatuated, cause);
    sameGender.addStatus(Statuses.Infatuated, cause);

    expect(smitten.status[Statuses.Infatuated]).toBeDefined();
    expect(sameGender.status[Statuses.Infatuated]).toBeUndefined();
  });

  it('blocks actions half the time and breaks when the charmer faints', () => {
    const { battle, teamA, teamB } = createBattle();
    const charmer = createUnit(battle, teamA);
    const smitten = createUnit(battle, teamB);
    charmer.setGender(Genders.Female);
    smitten.setGender(Genders.Male);
    smitten.addMove(Moves.Tackle);

    smitten.addStatus(Statuses.Infatuated, {
      type: EffectType.Move,
      move: Moves.Tackle,
      unit: charmer,
    });

    pinRandom(battle, 0); // roll < 0.5: immobilized
    expect(smitten.checkCanCast(Moves.Tackle, unitTarget(charmer))).toBe(false);

    pinRandom(battle, 0.9);
    expect(smitten.checkCanCast(Moves.Tackle, unitTarget(charmer))).toBe(true);

    charmer.damage(NONE_CAUSE, charmer, 999, 0);
    expect(smitten.status[Statuses.Infatuated]).toBeUndefined();
  });
});

describe('timed status progression', () => {
  it('exposes timer progress through events, like casting', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    const seen: number[] = [];
    battle.on(BattleEvents.UnitUpdateStatusTimer, EventPriority.Post, (event) => {
      if (event.status === Statuses.Sleeping && event.data.progress != null) {
        seen.push(event.data.progress);
      }
    });

    unit.addStatus(Statuses.Sleeping, NONE_CAUSE);

    battle.tick(500);
    battle.tick(500);

    expect(seen).toEqual([500, 1000]);
    expect(unit.status[Statuses.Sleeping]).toBeDefined();
  });

  it('the progression event is authoritative and can fast-forward', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    unit.addStatus(Statuses.Sleeping, NONE_CAUSE);

    // Jump straight past the 2000ms duration
    unit.updateStatusTimer(Statuses.Sleeping, { progress: 2000 });

    expect(unit.status[Statuses.Sleeping]).toBeUndefined();
  });
});

describe('positional statuses', () => {
  it('grounded, floating and submerged are mutually exclusive', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    unit.addStatus(Statuses.Floating, NONE_CAUSE);
    unit.addStatus(Statuses.Grounded, NONE_CAUSE);

    expect(unit.status[Statuses.Floating]).toBeUndefined();
    expect(unit.status[Statuses.Grounded]).toBeDefined();

    unit.addStatus(Statuses.Submerged, NONE_CAUSE);

    expect(unit.status[Statuses.Grounded]).toBeUndefined();
    expect(unit.status[Statuses.Submerged]).toBeDefined();
  });
});

describe('Mist', () => {
  it('shields the team from stage drops by others until it expires', () => {
    const { battle, teamA, teamB } = createBattle();
    const veiled = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    veiled.triggerMoveEffect(Moves.Mist, { type: MoveTargetType.Team, team: teamA }, 0);

    const hostile = { type: EffectType.Move, move: Moves.Growl, unit: enemy } as const;

    veiled.addStage(Stages.Attack, -1, hostile);
    expect(veiled.stages[Stages.Attack]).toBe(0);

    // Self-inflicted drops still apply
    veiled.addStage(Stages.Attack, -1, {
      type: EffectType.Move,
      move: Moves.Growl,
      unit: veiled,
    });
    expect(veiled.stages[Stages.Attack]).toBe(-1);

    battle.tick(10000);

    veiled.addStage(Stages.Attack, -1, hostile);
    expect(veiled.stages[Stages.Attack]).toBe(-2);
  });
});
