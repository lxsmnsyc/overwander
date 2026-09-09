import { describe, expect, it } from 'vitest';
import {
  BattleEvents,
  type CheckUnitAIMoveUsableEvent,
  EffectType,
  MoveTargetType,
} from '../../../src/battle/events';
import type Battle from '../../../src/battle/core';
import type Unit from '../../../src/battle/unit';
import { Stages, Stats } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import { Items } from '../../../src/data/ids/items';
import { Moves } from '../../../src/data/ids/moves';
import { Statuses } from '../../../src/data/ids/status';
import turns from '../../../src/battle/turn';
import { createBattle, createUnit, pinRandom } from '../harness';

/** A plain cause, for the damage and heals these tests stage by hand */
const MOVE_CAUSE = { type: EffectType.None } as const;

function unitTarget(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

const NONE_TARGET = { type: MoveTargetType.None } as const;

function usable(battle: Battle, source: Unit, move: Moves, aim: Unit): boolean {
  const event: CheckUnitAIMoveUsableEvent = {
    id: 'CheckUnitAIMoveUsable',
    disabled: false,
    source,
    move,
    target: unitTarget(aim),
    usable: true,
  };

  battle.emit(BattleEvents.CheckUnitAIMoveUsable, event);
  return event.usable;
}

describe("Sinnoh's moves", () => {
  it('puts a roosting flyer on the ground, and lets it back up', () => {
    const { battle, teamA, teamB } = createBattle();
    const bird = createUnit(battle, teamA, [Types.Normal, Types.Flying]);
    const other = createUnit(battle, teamB);

    bird.enter();
    other.enter();
    bird.damage(MOVE_CAUSE, bird, bird.checkStat(Stats.HP, 0) / 2, 0);

    const hurt = bird.health;

    bird.triggerMoveEffect(Moves.Roost, NONE_TARGET, 0);
    battle.tick(1);

    // The heal landed and the bird is down while it rests
    expect(bird.health).toBeGreaterThan(hurt);
    expect(bird.status[Statuses.Roosting]).not.toBeNull();

    // And it is back on the wing once the rest is over
    battle.tick(turns(2));
    expect(bird.status[Statuses.Roosting]).toBeUndefined();
  });

  it('reads a Dark type with Miracle Eye without opening it to everything', () => {
    const { battle, teamA, teamB } = createBattle();
    const seer = createUnit(battle, teamA);
    const dark = createUnit(battle, teamB, [Types.Dark]);

    seer.enter();
    dark.enter();
    seer.triggerMoveEffect(Moves.MiracleEye, unitTarget(dark), 0);
    battle.tick(1);

    expect(dark.status[Statuses.MindRead]).not.toBeNull();
    // Foresight's own mark is a different one, so neither move stands
    // in for the other
    expect(dark.status[Statuses.Identified]).toBeUndefined();

    // Nothing is worth reading twice
    expect(usable(battle, seer, Moves.MiracleEye, dark)).toBe(false);
  });

  it('swaps Attack and Defense over for a Power Trick, and back again', () => {
    const { battle, teamA, teamB } = createBattle();
    const tricked = createUnit(battle, teamA);

    createUnit(battle, teamB).enter();
    tricked.enter();

    const attack = tricked.checkStat(Stats.Attack, 0);
    const defense = tricked.checkStat(Stats.Defense, 0);

    tricked.triggerMoveEffect(Moves.PowerTrick, NONE_TARGET, 0);
    battle.tick(1);
    expect(tricked.checkStat(Stats.Attack, 0)).toBe(defense);
    expect(tricked.checkStat(Stats.Defense, 0)).toBe(attack);

    // Casting it again is what puts them back
    tricked.triggerMoveEffect(Moves.PowerTrick, NONE_TARGET, 0);
    battle.tick(1);
    expect(tricked.checkStat(Stats.Attack, 0)).toBe(attack);
  });

  it('refuses every heal while Heal Block holds', () => {
    const { battle, teamA, teamB } = createBattle();
    const blocker = createUnit(battle, teamA);
    const blocked = createUnit(battle, teamB);

    blocker.enter();
    blocked.enter();
    blocked.damage(MOVE_CAUSE, blocked, blocked.checkStat(Stats.HP, 0) / 2, 0);

    blocker.triggerMoveEffect(Moves.HealBlock, unitTarget(blocked), 0);
    battle.tick(1);
    expect(blocked.status[Statuses.HealBlocked]).not.toBeNull();

    const hurt = blocked.health;

    blocked.heal(MOVE_CAUSE, blocked, 50, 0);
    expect(blocked.health).toBe(hurt);

    // And it wears off rather than being taken off
    battle.tick(turns(6));
    expect(blocked.status[Statuses.HealBlocked]).toBeUndefined();
    blocked.heal(MOVE_CAUSE, blocked, 50, 0);
    expect(blocked.health).toBeGreaterThan(hurt);
  });

  it('hands an ailment over with Psycho Shift, and keeps none of it', () => {
    const { battle, teamA, teamB } = createBattle();
    const sick = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    sick.enter();
    target.enter();
    sick.addStatus(Statuses.Burned, MOVE_CAUSE);
    expect(sick.status[Statuses.Burned]).not.toBeNull();

    sick.triggerMoveEffect(Moves.PsychoShift, unitTarget(target), 0);
    battle.tick(1);

    expect(target.status[Statuses.Burned]).not.toBeNull();
    expect(sick.status[Statuses.Burned]).toBeUndefined();
  });

  it('takes a berry off a target with Pluck and gets what it was worth', () => {
    const { battle, teamA, teamB } = createBattle();
    const bird = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);

    bird.enter();
    holder.enter();
    holder.addItem(Items.OranBerry);

    bird.attack(holder, Moves.Pluck, 1, Types.Flying, 0, 0);
    battle.tick(1);

    // The berry is off the target either way: eaten is eaten
    expect(holder.items[Items.OranBerry]).toBeUndefined();
  });

  it('leaves nothing to throw once a Fling has been thrown', () => {
    const { battle, teamA, teamB } = createBattle();
    const thrower = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    thrower.enter();
    target.enter();

    // Nothing in hand is nothing to throw
    expect(usable(battle, thrower, Moves.Fling, target)).toBe(false);

    thrower.addItem(Items.OranBerry);
    expect(usable(battle, thrower, Moves.Fling, target)).toBe(true);

    thrower.attack(target, Moves.Fling, 1, Types.Dark, 0, 0);
    battle.tick(1);
    expect(thrower.items[Items.OranBerry]).toBeUndefined();
  });

  it('presses two stages onto one stat with Acupressure', () => {
    const { battle, teamA, teamB } = createBattle();
    const presser = createUnit(battle, teamA);

    createUnit(battle, teamB).enter();
    presser.enter();
    pinRandom(battle, 0);

    presser.triggerMoveEffect(Moves.Acupressure, unitTarget(presser), 0);
    battle.tick(1);

    // The first point on the list at a pinned roll, two stages of it
    expect(presser.stages[Stages.Attack]).toBe(2);
  });

  it('doubles the whole side up while a Tailwind is behind it', () => {
    const { battle, teamA, teamB } = createBattle();
    const caster = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const other = createUnit(battle, teamB);

    caster.enter();
    other.enter();

    const before = mate.checkStat(Stats.Speed, 0);
    const enemy = other.checkStat(Stats.Speed, 0);

    caster.triggerMoveEffect(Moves.Tailwind, { type: MoveTargetType.Team, team: teamA }, 0);
    battle.tick(1);

    // Everybody on that side, whether or not they were on the field
    expect(mate.checkStat(Stats.Speed, 0)).toBe(before * 2);
    // And nobody on the other
    expect(other.checkStat(Stats.Speed, 0)).toBe(enemy);

    battle.tick(turns(4));
    expect(mate.checkStat(Stats.Speed, 0)).toBe(before);
  });
});
