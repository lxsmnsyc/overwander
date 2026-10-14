import { describe, expect, it } from 'vitest';
import {
  GLIMMERING_SCALE,
  REDLINE_MAX_QUICKEN,
  SLAG_TRAIL_COOLDOWN,
} from '../../../../src/battle/abilities/signature/gen-9/finizen-to-glimmet';
import { EffectType } from '../../../../src/battle/events';
import { layersUnder } from '../../../../src/battle/moves/spikes';
import turns from '../../../../src/battle/turn';
import type Unit from '../../../../src/battle/unit';
import { unitTarget } from '../../../../src/battle/unit-checks';
import { Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Statuses } from '../../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, dealDamage } from './helpers';

/** A direct blow from an enemy's move, for an exact amount */
function strike(source: Unit, target: Unit, amount: number): void {
  source.damage({ type: EffectType.Move, move: Moves.Pound, unit: source }, target, amount, 0);
}

describe('Lifeguard', () => {
  it('takes a blow that would knock out a teammate, once per teammate', () => {
    const { battle, teamA, teamB } = createBattle();
    const guard = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    guard.addAbility(Abilities.Lifeguard);
    mate.setHealth(10);

    const before = guard.health;

    strike(foe, mate, 15);

    expect(mate.alive).toBe(true);
    expect(mate.health).toBe(10);
    expect(before - guard.health).toBe(15);

    strike(foe, mate, 15);

    expect(mate.alive).toBe(false);
  });

  it('lets a blow through while it is at 1/2 HP or below, or that would not knock out', () => {
    const { battle, teamA, teamB } = createBattle();
    const guard = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    guard.addAbility(Abilities.Lifeguard);
    mate.setHealth(10);
    strike(foe, mate, 5);

    expect(mate.health).toBe(5);

    guard.setHealth(Math.floor(guard.checkStat(Stats.HP, 0) / 2));

    const before = guard.health;

    strike(foe, mate, 15);

    expect(mate.alive).toBe(false);
    expect(guard.health).toBe(before);
  });
});

describe('Redline', () => {
  it('winds up faster the lower its HP, up to 30% near 0 HP', () => {
    const { battle, teamA, teamB } = createBattle();
    const car = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const target = unitTarget(foe);
    const plain = car.checkMoveCastTime(Moves.Tackle, target);

    car.addAbility(Abilities.Redline);

    expect(car.checkMoveCastTime(Moves.Tackle, target)).toBeCloseTo(plain);

    const whole = car.checkStat(Stats.HP, 0);

    car.setHealth(whole / 2);
    expect(car.checkMoveCastTime(Moves.Tackle, target)).toBeCloseTo(
      plain * (1 - REDLINE_MAX_QUICKEN / 2),
    );

    car.setHealth(1);
    expect(car.checkMoveCastTime(Moves.Tackle, target)).toBeCloseTo(
      plain * (1 - REDLINE_MAX_QUICKEN * (1 - 1 / whole)),
    );
  });
});

describe('Shed Decoy', () => {
  it('puts up a free substitute the first time its HP drops below 1/2', () => {
    const { battle, teamA, teamB } = createBattle();
    const lizard = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const whole = lizard.checkStat(Stats.HP, 0);

    lizard.addAbility(Abilities.ShedDecoy);
    strike(foe, lizard, Math.floor(whole * 0.3));

    expect(lizard.status[Statuses.Substituted]).toBeUndefined();

    strike(foe, lizard, Math.floor(whole * 0.3));

    expect(lizard.status[Statuses.Substituted]).toBeDefined();
    // Only the two blows were taken, nothing paid for the substitute
    expect(lizard.health).toBe(whole - 2 * Math.floor(whole * 0.3));
  });

  it('sheds only once a fight', () => {
    const { battle, teamA, teamB } = createBattle();
    const lizard = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const whole = lizard.checkStat(Stats.HP, 0);

    lizard.addAbility(Abilities.ShedDecoy);
    strike(foe, lizard, Math.ceil(whole * 0.6));
    lizard.removeStatus(Statuses.Substituted, NONE_CAUSE);
    lizard.setHealth(whole);
    strike(foe, lizard, Math.ceil(whole * 0.6));

    expect(lizard.status[Statuses.Substituted]).toBeUndefined();
  });
});

describe('Slag Trail', () => {
  it('lays Spikes under the target side when a Steel move lands, every 10 seconds at most', () => {
    const { battle, teamA, teamB } = createBattle();
    const worm = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    worm.addAbility(Abilities.SlagTrail);
    dealDamage(worm, foe, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);
    battle.tick(turns(1));

    expect(layersUnder(teamB)).toBe(0);

    dealDamage(worm, foe, Moves.IronHead, 40, Types.Steel, MoveCategories.Physical);
    battle.tick(turns(1));

    expect(layersUnder(teamB)).toBe(1);
    expect(layersUnder(teamA)).toBe(0);

    dealDamage(worm, foe, Moves.IronHead, 40, Types.Steel, MoveCategories.Physical);
    battle.tick(turns(1));

    expect(layersUnder(teamB)).toBe(1);

    battle.tick(SLAG_TRAIL_COOLDOWN);
    dealDamage(worm, foe, Moves.IronHead, 40, Types.Steel, MoveCategories.Physical);
    battle.tick(turns(1));

    expect(layersUnder(teamB)).toBe(2);
  });
});

describe('Glimmering', () => {
  it('slows the wind-up of every poisoned enemy by 20% while it stands', () => {
    const { battle, teamA, teamB } = createBattle();
    const gem = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const clean = createUnit(battle, teamB);
    const target = unitTarget(gem);
    const plain = foe.checkMoveCastTime(Moves.Tackle, target);

    gem.addAbility(Abilities.Glimmering);
    foe.addStatus(Statuses.Poisoned, NONE_CAUSE);

    expect(foe.status[Statuses.Poisoned]).toBeDefined();
    expect(foe.checkMoveCastTime(Moves.Tackle, target)).toBeCloseTo(plain * GLIMMERING_SCALE);
    expect(clean.checkMoveCastTime(Moves.Tackle, target)).toBeCloseTo(plain);

    gem.setHealth(0);
    gem.faint(foe);

    expect(foe.checkMoveCastTime(Moves.Tackle, target)).toBeCloseTo(plain);
  });
});
