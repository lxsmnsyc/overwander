// Sandygast through Togedemaru, with Water Compaction, Sand Spit, Innards Out and Shields Down.

import { describe, expect, it } from 'vitest';
import { AttackPriority, EventPriority } from '../../../../src/core/event-emitter';
import {
  BattleEvents,
  type EffectCause,
  EffectType,
  MoveTargetType,
} from '../../../../src/battle/events';
import type Unit from '../../../../src/battle/unit';
import { unitTarget } from '../../../../src/battle/utils';
import { getMiniorCore } from '../../../../src/battle/abilities/gen-7';
import {
  CASTLE_DRAIN_FRACTION,
  CHARGED_SPINES_SCALE,
  STARFALL_SCALE,
} from '../../../../src/battle/abilities/signature/sandygast-to-togedemaru';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { MINIOR_FORMS, Species } from '../../../../src/data/ids/species';
import { Statuses } from '../../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, act, dealDamage } from './helpers';

type Blow = readonly [Moves, number, Types, MoveCategories];

const TACKLE: Blow = [Moves.Tackle, 80, Types.Normal, MoveCategories.Physical];
const SWIFT: Blow = [Moves.Swift, 80, Types.Normal, MoveCategories.Special];
const WATER_GUN: Blow = [Moves.WaterGun, 40, Types.Water, MoveCategories.Special];
const SHOCK: Blow = [Moves.ThunderShock, 40, Types.Electric, MoveCategories.Special];

function max(unit: Unit): number {
  return unit.checkStat(Stats.HP, 0);
}

function tackleFrom(unit: Unit): EffectCause {
  return { type: EffectType.Move, move: Moves.Tackle, unit };
}

describe('Water Compaction', () => {
  it('raises its Defense 2 stages for each Water move that lands', () => {
    const { battle, teamA, teamB } = createBattle();
    const sand = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    sand.addAbility(Abilities.WaterCompaction);

    dealDamage(foe, sand, ...TACKLE);

    expect(sand.stages[Stages.Defense]).toBe(0);

    dealDamage(foe, sand, ...WATER_GUN);

    expect(sand.stages[Stages.Defense]).toBe(2);
  });
});

describe('Sand Spit', () => {
  it('casts Sandstorm when a damaging move lands on it', () => {
    const { battle, teamA, teamB } = createBattle();
    const castle = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const storms: unknown[] = [];

    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
      if (event.move === Moves.Sandstorm) {
        storms.push(event.source);
      }
    });

    pinRandom(battle, 1);
    castle.addAbility(Abilities.SandSpit);
    dealDamage(foe, castle, ...TACKLE);

    expect(storms).toEqual([castle]);
  });
});

describe('Innards Out', () => {
  it('deals whoever knocks it out the HP it had left', () => {
    const { battle, teamA, teamB } = createBattle();
    const cuke = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    cuke.addAbility(Abilities.InnardsOut);
    cuke.setHealth(30);

    foe.damage(tackleFrom(foe), cuke, 10, 0);

    expect(foe.health).toBe(max(foe));

    foe.damage(tackleFrom(foe), cuke, 500, 0);

    expect(cuke.alive).toBe(false);
    expect(max(foe) - foe.health).toBe(20);
  });
});

describe('Shields Down', () => {
  it('keeps its shell above 1/2 HP and cracks to its own core below', () => {
    const { battle, teamA, teamB } = createBattle();
    const meteor = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    meteor.caught = 'a-minior';
    meteor.setSpecies(Species.Minior);
    meteor.setHealth(max(meteor));
    meteor.addAbility(Abilities.ShieldsDown);
    meteor.enter();
    foe.enter();

    const core = getMiniorCore(meteor);

    expect(MINIOR_FORMS.slice(1)).toContain(core);
    expect(meteor.species).toBe(Species.Minior);

    // The shell keeps a status out
    meteor.addStatus(Statuses.Poisoned, NONE_CAUSE);

    expect(meteor.status[Statuses.Poisoned]).toBeUndefined();

    foe.damage(NONE_CAUSE, meteor, max(meteor) * 0.6, 0);

    expect(meteor.species).toBe(core);

    meteor.addStatus(Statuses.Poisoned, NONE_CAUSE);

    expect(meteor.status[Statuses.Poisoned]).toBeDefined();

    meteor.heal(NONE_CAUSE, meteor, max(meteor), 0);

    expect(meteor.species).toBe(Species.Minior);
  });

  it('reads the same core off the same record every time', () => {
    const { battle, teamA } = createBattle();
    const cores = new Set<Species>();

    for (const id of ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']) {
      const first = createUnit(battle, teamA);
      const again = createUnit(battle, teamA);

      first.caught = id;
      again.caught = id;
      expect(getMiniorCore(first)).toBe(getMiniorCore(again));
      cores.add(getMiniorCore(first));
    }
    expect(cores.size).toBeGreaterThan(1);
  });
});

describe('Castle Drain', () => {
  it('drains 1/8 of the HP of whoever lands a contact move on it', () => {
    const { battle, teamA, teamB } = createBattle();
    const castle = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    castle.addAbility(Abilities.CastleDrain);

    dealDamage(foe, castle, ...SWIFT);

    expect(foe.health).toBe(max(foe));

    castle.setHealth(max(castle));

    const blow = dealDamage(foe, plain, ...TACKLE);
    // What it lost, net of what it drained back
    const lost = dealDamage(foe, castle, ...TACKLE);
    const drained = max(foe) * CASTLE_DRAIN_FRACTION;

    expect(max(foe) - foe.health).toBeCloseTo(drained, 5);
    expect(lost).toBeCloseTo(blow - drained, 5);
  });
});

describe('Tossed Back', () => {
  it('survives the first finishing blow on 1 HP and leaves for its strongest teammate', () => {
    const { battle, teamA, teamB } = createBattle();
    const cuke = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const switched: [Unit, Unit][] = [];

    battle.on(BattleEvents.UnitSwitch, EventPriority.Post, (event) => {
      switched.push([event.source, event.target]);
    });

    cuke.addAbility(Abilities.TossedBack);
    cuke.enter();
    foe.enter();

    foe.damage(tackleFrom(foe), cuke, max(cuke) * 2, 0);

    expect(cuke.alive).toBe(true);
    expect(cuke.health).toBe(1);
    expect(switched).toEqual([[cuke, mate]]);

    // Once per battle
    foe.damage(tackleFrom(foe), cuke, max(cuke) * 2, 0);

    expect(cuke.alive).toBe(false);
  });
});

describe('Starfall', () => {
  it('hurries the first cast after each entrance', () => {
    const { battle, teamA } = createBattle();
    const star = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const none = { type: MoveTargetType.None } as const;
    const base = plain.checkMoveCastTime(Moves.Tackle, none);

    star.addAbility(Abilities.Starfall);
    star.enter();

    expect(star.checkMoveCastTime(Moves.Tackle, none)).toBeCloseTo(base * STARFALL_SCALE, 5);

    act(battle, star);

    expect(star.checkMoveCastTime(Moves.Tackle, none)).toBe(base);

    star.leave();
    star.enter();

    expect(star.checkMoveCastTime(Moves.Tackle, none)).toBeCloseTo(base * STARFALL_SCALE, 5);
  });
});

describe('Charged Spines', () => {
  it('stores a touch for its next Electric move that lands', () => {
    const { battle, teamA, teamB } = createBattle();
    const toge = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const at = unitTarget(foe);

    pinRandom(battle, 1);
    toge.addAbility(Abilities.ChargedSpines);

    const shock = toge.checkMovePower(Moves.ThunderShock, at) ?? 0;
    const tackle = toge.checkMovePower(Moves.Tackle, at);

    dealDamage(foe, toge, ...SWIFT);

    expect(toge.checkMovePower(Moves.ThunderShock, at)).toBe(shock);

    dealDamage(foe, toge, ...TACKLE);

    expect(toge.checkMovePower(Moves.ThunderShock, at)).toBeCloseTo(
      shock * CHARGED_SPINES_SCALE,
      5,
    );
    expect(toge.checkMovePower(Moves.Tackle, at)).toBe(tackle);

    dealDamage(toge, foe, ...SHOCK);

    expect(toge.checkMovePower(Moves.ThunderShock, at)).toBe(shock);
  });
});
