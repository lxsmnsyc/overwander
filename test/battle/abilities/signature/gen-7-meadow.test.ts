// Crabrawler through Rockruff.

import { describe, expect, it } from 'vitest';
import type Battle from '../../../../src/battle/core';
import { BattleEvents, type MoveTarget } from '../../../../src/battle/events';
import type Unit from '../../../../src/battle/unit';
import { unitTarget } from '../../../../src/battle/utils';
import {
  DIZZY_TWIRL_SCALE,
  REBOUND_PUNCH_SCALE,
} from '../../../../src/battle/abilities/signature/oricorio-to-crabrawler';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Items } from '../../../../src/data/ids/items';
import { MoveAttackFlags, MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Statuses } from '../../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, dealDamage } from './helpers';

/** Walk the battle clock forward in frame-sized ticks */
function advance(battle: Battle, duration: number): void {
  const frame = 1000 / 60;

  for (let elapsed = 0; elapsed < duration; elapsed += frame) {
    battle.tick(frame);
  }
}

/** Throw a move for real and let it land, returning what it took off */
function throwMove(battle: Battle, source: Unit, target: Unit, move: Moves): number {
  const before = target.health;
  const aim = unitTarget(target);

  source.triggerMove(move, aim, 0);
  advance(battle, source.checkMoveDelay(move, aim));
  return before - target.health;
}

/** What the AI asks before it scores a move at all */
function usable(battle: Battle, source: Unit, move: Moves, target: MoveTarget): boolean {
  const event = {
    id: 'CheckUnitAIMoveUsable',
    disabled: false,
    source,
    move,
    target,
    usable: true,
  };

  battle.emit(BattleEvents.CheckUnitAIMoveUsable, event);
  return event.usable;
}

describe('Rebound Punch', () => {
  it('hits 1.5x with the punch after one that missed, and spends it landing', () => {
    const { battle, teamA, teamB } = createBattle();
    const crab = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    pinRandom(battle, 1);
    crab.addAbility(Abilities.ReboundPunch);

    const plain = crab.checkMovePower(Moves.MachPunch, at) ?? 0;
    const tackle = crab.checkMovePower(Moves.Tackle, at);

    // Out of reach, so the punch goes wide
    foe.addStage(Stages.Evasion, 6, NONE_CAUSE);

    expect(throwMove(battle, crab, foe, Moves.MachPunch)).toBe(0);
    expect(crab.checkMovePower(Moves.MachPunch, at)).toBeCloseTo(plain * REBOUND_PUNCH_SCALE, 5);
    // Only its punches
    expect(crab.checkMovePower(Moves.Tackle, at)).toBe(tackle);

    foe.addStage(Stages.Evasion, -6, NONE_CAUSE);

    const charged = throwMove(battle, crab, foe, Moves.MachPunch);

    expect(charged).toBeGreaterThan(0);
    expect(crab.checkMovePower(Moves.MachPunch, at)).toBe(plain);

    // The same punch with nothing behind it lands softer
    foe.setHealth(foe.checkStat(Stats.HP, 0));

    expect(throwMove(battle, crab, foe, Moves.MachPunch)).toBeLessThan(charged);
  });

  it('charges on a punch a guard turned away', () => {
    const { battle, teamA, teamB } = createBattle();
    const crab = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    pinRandom(battle, 1);
    crab.addAbility(Abilities.ReboundPunch);

    const plain = crab.checkMovePower(Moves.MachPunch, at) ?? 0;

    foe.addStatus(Statuses.Protected, NONE_CAUSE);

    expect(throwMove(battle, crab, foe, Moves.MachPunch)).toBe(0);
    expect(crab.checkMovePower(Moves.MachPunch, at)).toBeCloseTo(plain * REBOUND_PUNCH_SCALE, 5);
  });

  it('is not charged by a move that is not a punch', () => {
    const { battle, teamA, teamB } = createBattle();
    const crab = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    pinRandom(battle, 1);
    crab.addAbility(Abilities.ReboundPunch);

    const plain = crab.checkMovePower(Moves.MachPunch, at);

    foe.addStage(Stages.Evasion, 6, NONE_CAUSE);

    expect(throwMove(battle, crab, foe, Moves.Tackle)).toBe(0);
    expect(crab.checkMovePower(Moves.MachPunch, at)).toBe(plain);
  });
});

describe('Dizzy Twirl', () => {
  it('never hits itself while confused, where anybody else does', () => {
    const { battle, teamA, teamB } = createBattle();
    const dancer = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const full = dancer.checkStat(Stats.HP, 0);

    dancer.addAbility(Abilities.DizzyTwirl);
    dancer.addMove(Moves.Tackle);
    plain.addMove(Moves.Tackle);
    dancer.addStatus(Statuses.Confused, NONE_CAUSE);
    plain.addStatus(Statuses.Confused, NONE_CAUSE);

    // At or past a third, which is a self-hit
    pinRandom(battle, 0.5);

    expect(dancer.checkCanCast(Moves.Tackle, unitTarget(foe))).toBe(true);
    expect(dancer.health).toBe(full);

    expect(plain.checkCanCast(Moves.Tackle, unitTarget(foe))).toBe(false);
    expect(plain.health).toBeLessThan(full);
  });

  it('hits 1.3x while it carries confusion, and only then', () => {
    const { battle, teamA, teamB } = createBattle();
    const dancer = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    dancer.addAbility(Abilities.DizzyTwirl);

    const plain = dancer.checkMovePower(Moves.AirSlash, at) ?? 0;

    dancer.addStatus(Statuses.Confused, NONE_CAUSE);

    expect(dancer.checkMovePower(Moves.AirSlash, at)).toBeCloseTo(plain * DIZZY_TWIRL_SCALE, 5);

    dancer.removeStatus(Statuses.Confused, NONE_CAUSE);

    expect(dancer.checkMovePower(Moves.AirSlash, at)).toBe(plain);
  });

  it('is not confused on purpose by the AI', () => {
    const { battle, teamA, teamB } = createBattle();
    const dancer = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    dancer.addAbility(Abilities.DizzyTwirl);

    expect(usable(battle, foe, Moves.ConfuseRay, unitTarget(dancer))).toBe(false);
    expect(usable(battle, foe, Moves.ConfuseRay, unitTarget(plain))).toBe(true);
  });
});

describe('Honey Share', () => {
  it('makes a teammate’s berry heal 1.5x as much', () => {
    const { battle, teamA } = createBattle();
    const bee = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);

    bee.addAbility(Abilities.HoneyShare);
    mate.addItem(Items.OranBerry);
    mate.setHealth(50);

    expect(mate.items[Items.OranBerry]).toBeUndefined();
    expect(mate.health).toBe(65);
  });

  it('does nothing for its own berry or for an enemy’s', () => {
    const { battle, teamA, teamB } = createBattle();
    const bee = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    bee.addAbility(Abilities.HoneyShare);
    bee.addItem(Items.OranBerry);
    foe.addItem(Items.OranBerry);
    bee.setHealth(50);
    foe.setHealth(50);

    expect(bee.health).toBe(60);
    expect(foe.health).toBe(60);
  });

  it('rounds a stat berry’s rise up to a whole stage more', () => {
    const { battle, teamA } = createBattle();
    const bee = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);

    bee.addAbility(Abilities.HoneyShare);
    mate.addItem(Items.LiechiBerry);
    mate.setHealth(mate.checkStat(Stats.HP, 0) / 4);

    expect(mate.items[Items.LiechiBerry]).toBeUndefined();
    expect(mate.stages[Stages.Attack]).toBe(2);
  });

  it('shares nothing once it has fallen', () => {
    const { battle, teamA, teamB } = createBattle();
    const bee = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    bee.addAbility(Abilities.HoneyShare);
    dealDamage(foe, bee, Moves.Tackle, 9999, Types.Normal, MoveCategories.Physical);

    expect(bee.alive).toBe(false);

    mate.addItem(Items.OranBerry);
    mate.setHealth(50);

    expect(mate.health).toBe(60);
  });
});

describe('Provoke', () => {
  it('turns the next single-target move of an enemy it hit onto itself, once', () => {
    const { battle, teamA, teamB } = createBattle();
    const pup = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    pup.addAbility(Abilities.Provoke);
    foe.addMove(Moves.Ember);

    dealDamage(pup, foe, Moves.Tackle, 20, Types.Normal, MoveCategories.Physical);

    foe.cast(Moves.Ember, unitTarget(mate));

    expect(foe.casting?.target).toEqual(unitTarget(pup));

    foe.stopCast();
    foe.finishCooldown(Moves.Ember);
    foe.cast(Moves.Ember, unitTarget(mate));

    expect(foe.casting?.target).toEqual(unitTarget(mate));
  });

  it('waits past a move the enemy aims at its own side', () => {
    const { battle, teamA, teamB } = createBattle();
    const pup = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    pinRandom(battle, 1);
    pup.addAbility(Abilities.Provoke);
    foe.addMove(Moves.Ember);

    dealDamage(pup, foe, Moves.Tackle, 20, Types.Normal, MoveCategories.Physical);

    foe.cast(Moves.Ember, unitTarget(other));

    expect(foe.casting?.target).toEqual(unitTarget(other));

    foe.stopCast();
    foe.finishCooldown(Moves.Ember);
    foe.cast(Moves.Ember, unitTarget(mate));

    expect(foe.casting?.target).toEqual(unitTarget(pup));
  });

  it('is not provoked by a blow the AI only weighed, or thrown by a teammate', () => {
    const { battle, teamA, teamB } = createBattle();
    const pup = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    pup.addAbility(Abilities.Provoke);
    foe.addMove(Moves.Ember);

    pup.attack(
      foe,
      Moves.Tackle,
      20,
      Types.Normal,
      MoveCategories.Physical,
      MoveAttackFlags.Simulated,
    );
    dealDamage(mate, foe, Moves.Tackle, 20, Types.Normal, MoveCategories.Physical);

    foe.cast(Moves.Ember, unitTarget(mate));

    expect(foe.casting?.target).toEqual(unitTarget(mate));
  });

  it('lets go once it has fallen', () => {
    const { battle, teamA, teamB } = createBattle();
    const pup = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    pup.addAbility(Abilities.Provoke);
    foe.addMove(Moves.Ember);

    dealDamage(pup, foe, Moves.Tackle, 20, Types.Normal, MoveCategories.Physical);
    dealDamage(foe, pup, Moves.Tackle, 9999, Types.Normal, MoveCategories.Physical);

    expect(pup.alive).toBe(false);

    foe.cast(Moves.Ember, unitTarget(mate));

    expect(foe.casting?.target).toEqual(unitTarget(mate));
  });
});
