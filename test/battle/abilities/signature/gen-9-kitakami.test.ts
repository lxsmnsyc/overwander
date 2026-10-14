import { describe, expect, it } from 'vitest';
import { AVENGING_CAST_SCALE } from '../../../../src/battle/abilities/signature/__create';
import { MASK_AURA_SCALE } from '../../../../src/battle/abilities/signature/gen-9/kitakami-legends';
import type Battle from '../../../../src/battle/core';
import { BattleEvents, MoveTargetType } from '../../../../src/battle/events';
import type Unit from '../../../../src/battle/unit';
import { unitTarget } from '../../../../src/battle/utils';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, MoveTargets, Moves } from '../../../../src/data/ids/moves';
import { Species } from '../../../../src/data/ids/species';
import { Statuses } from '../../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, makeAttack } from './helpers';

/** A holder of one oath, its teammate and two enemies */
function loyal(ability: Abilities): {
  battle: Battle;
  holder: Unit;
  mate: Unit;
  foe: Unit;
  other: Unit;
} {
  const { battle, teamA, teamB } = createBattle();
  const holder = createUnit(battle, teamA);
  const mate = createUnit(battle, teamA);
  const foe = createUnit(battle, teamB);
  const other = createUnit(battle, teamB);

  pinRandom(battle, 0.99);
  holder.addAbility(ability);
  return { battle, holder, mate, foe, other };
}

/** Whether a Tackle from this unit lands as a critical hit */
function critical(battle: Battle, source: Unit, target: Unit): boolean {
  const event = {
    id: 'UnitAttackResolveCriticalHit',
    disabled: false,
    parent: makeAttack(source, target, Moves.Tackle, Types.Normal, MoveCategories.Physical),
    critical: false,
  };
  battle.emit(BattleEvents.UnitAttackResolveCriticalHit, event);
  return event.critical;
}

describe('Avenging Chain', () => {
  it('badly poisons with the next damaging move once a teammate faints, and only that one', () => {
    const { battle, holder, mate, foe, other } = loyal(Abilities.MonkeysOath);

    mate.faint(foe);
    holder.triggerMove(Moves.Tackle, unitTarget(foe), 0);
    battle.tick(5000);

    expect(foe.status[Statuses.BadlyPoisoned]).toBeDefined();

    holder.triggerMove(Moves.Tackle, unitTarget(other), 0);
    battle.tick(5000);

    expect(other.status[Statuses.BadlyPoisoned]).toBeUndefined();
  });

  it('waits out a status move', () => {
    const { battle, holder, mate, foe } = loyal(Abilities.MonkeysOath);

    mate.faint(foe);
    holder.triggerMove(Moves.Growl, { type: MoveTargetType.None }, 0);
    battle.tick(5000);
    holder.triggerMove(Moves.Tackle, unitTarget(foe), 0);
    battle.tick(5000);

    expect(foe.status[Statuses.BadlyPoisoned]).toBeDefined();
  });

  it('is not armed by an enemy falling', () => {
    const { battle, holder, foe, other } = loyal(Abilities.MonkeysOath);

    other.faint(holder);
    holder.triggerMove(Moves.Tackle, unitTarget(foe), 0);
    battle.tick(5000);

    expect(foe.status[Statuses.BadlyPoisoned]).toBeUndefined();
  });

  it("Monkey's Oath winds the avenging move up 40% faster", () => {
    const { battle, holder, mate, foe } = loyal(Abilities.MonkeysOath);
    const at = unitTarget(foe);
    const plain = holder.checkMoveCastTime(Moves.Tackle, at);
    const growl = holder.checkMoveCastTime(Moves.Growl, at);

    mate.faint(foe);
    expect(holder.checkMoveCastTime(Moves.Tackle, at)).toBeCloseTo(plain * AVENGING_CAST_SCALE, 5);
    expect(holder.checkMoveCastTime(Moves.Growl, at)).toBe(growl);

    holder.triggerMove(Moves.Tackle, at, 0);
    battle.tick(5000);

    expect(holder.checkMoveCastTime(Moves.Tackle, at)).toBe(plain);
  });

  it("Hound's Oath makes the avenging move a critical hit", () => {
    const { battle, holder, mate, foe } = loyal(Abilities.HoundsOath);

    expect(critical(battle, holder, foe)).toBe(false);

    mate.faint(foe);
    expect(critical(battle, holder, foe)).toBe(true);

    holder.triggerMove(Moves.Tackle, unitTarget(foe), 0);
    battle.tick(5000);

    expect(foe.status[Statuses.BadlyPoisoned]).toBeDefined();
    expect(critical(battle, holder, foe)).toBe(false);
  });

  it("Pheasant's Oath carries the avenging move to every enemy", () => {
    const { battle, holder, mate, foe, other } = loyal(Abilities.PheasantsOath);

    expect(holder.checkMoveTargeting(Moves.Tackle).target).toBe(MoveTargets.Unit);

    mate.faint(foe);
    expect(holder.checkMoveTargeting(Moves.Tackle).target).toBe(MoveTargets.None);

    const before = other.health;

    holder.triggerMove(Moves.Tackle, unitTarget(foe), 0);
    battle.tick(5000);

    expect(other.health).toBeLessThan(before);
    expect(foe.status[Statuses.BadlyPoisoned]).toBeDefined();
    expect(other.status[Statuses.BadlyPoisoned]).toBeDefined();
    expect(holder.checkMoveTargeting(Moves.Tackle).target).toBe(MoveTargets.Unit);
  });
});

describe('Mask Aura', () => {
  it("lifts a teammate's moves of the mask's type 1.2x, and nobody else's", () => {
    const { battle, teamA, teamB } = createBattle();
    const ogre = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    ogre.setSpecies(Species.OgerponHearthflame);
    const fire = mate.checkMovePower(Moves.Ember, at) ?? 0;
    const grass = mate.checkMovePower(Moves.VineWhip, at);
    const own = ogre.checkMovePower(Moves.Ember, at);
    const enemy = foe.checkMovePower(Moves.Ember, unitTarget(mate));

    ogre.addAbility(Abilities.MaskAura);

    expect(mate.checkMovePower(Moves.Ember, at)).toBeCloseTo(fire * MASK_AURA_SCALE, 5);
    expect(mate.checkMovePower(Moves.VineWhip, at)).toBe(grass);
    expect(ogre.checkMovePower(Moves.Ember, at)).toBe(own);
    expect(foe.checkMovePower(Moves.Ember, unitTarget(mate))).toBe(enemy);
  });

  it('follows the mask into its Terastal shape, Grass for the Teal', () => {
    const { battle, teamA, teamB } = createBattle();
    const ogre = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const at = unitTarget(createUnit(battle, teamB));

    ogre.setSpecies(Species.OgerponTealTera);
    const grass = mate.checkMovePower(Moves.VineWhip, at) ?? 0;

    ogre.addAbility(Abilities.MaskAura);

    expect(mate.checkMovePower(Moves.VineWhip, at)).toBeCloseTo(grass * MASK_AURA_SCALE, 5);
  });
});

describe('Prismatic', () => {
  it('turns its Normal moves into the type that hits the target hardest', () => {
    const { battle, teamA, teamB } = createBattle();
    const turtle = createUnit(battle, teamA);
    const rock = createUnit(battle, teamB, [Types.Rock, Types.Ground]);
    const ghost = createUnit(battle, teamB, [Types.Ghost]);

    turtle.addAbility(Abilities.Prismatic);

    expect(turtle.checkMoveType(Moves.Tackle, unitTarget(rock))).toBe(Types.Water);
    expect(turtle.checkMoveType(Moves.Tackle, unitTarget(ghost))).toBe(Types.Ghost);
    expect(turtle.checkMoveType(Moves.Ember, unitTarget(rock))).toBe(Types.Fire);
  });

  it('keeps Normal where nothing does better', () => {
    const { battle, teamA, teamB } = createBattle();
    const turtle = createUnit(battle, teamA);
    const plain = createUnit(battle, teamB);

    turtle.addAbility(Abilities.Prismatic);

    expect(turtle.checkMoveType(Moves.Tackle, unitTarget(plain))).toBe(Types.Normal);
  });
});

describe('Puppet Strings', () => {
  it("sends a confused enemy's single-target move to that enemy's teammate", () => {
    const { battle, teamA, teamB } = createBattle();
    const puppet = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const foeMate = createUnit(battle, teamB);
    const at = unitTarget(puppet);

    puppet.addAbility(Abilities.PuppetStrings);

    expect(foe.checkMoveRedirect(Moves.Tackle, at)).toEqual(at);

    foe.addStatus(Statuses.Confused, NONE_CAUSE);

    expect(foe.checkMoveRedirect(Moves.Tackle, at)).toEqual(unitTarget(foeMate));
  });

  it('holds when the enemy stands alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const puppet = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(puppet);

    puppet.addAbility(Abilities.PuppetStrings);
    foe.addStatus(Statuses.Confused, NONE_CAUSE);

    expect(foe.checkMoveRedirect(Moves.Tackle, at)).toEqual(at);
  });
});
