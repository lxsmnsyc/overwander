import { describe, expect, it } from 'vitest';
import {
  KNOCKBACK_SETBACK,
  TRIPWIRE_SCALE,
} from '../../../../src/battle/abilities/signature/lechonk-to-tandemaus';
import { EffectType } from '../../../../src/battle/events';
import turns from '../../../../src/battle/turn';
import { unitTarget } from '../../../../src/battle/utils';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Items } from '../../../../src/data/ids/items';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Statuses } from '../../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../../harness';

describe('Pig Out', () => {
  it('casts Stockpile on itself for a Berry it eats, and not for one taken from it', () => {
    const { battle, teamA, teamB } = createBattle();
    const pig = createUnit(battle, teamA);

    createUnit(battle, teamB);
    pig.addAbility(Abilities.PigOut);

    pig.addItem(Items.OranBerry);
    pig.removeItem(Items.OranBerry, { type: EffectType.Move, move: Moves.KnockOff, unit: pig });
    battle.tick(turns(1));

    expect(pig.stages[Stages.Defense]).toBe(0);

    pig.addItem(Items.OranBerry);
    pig.removeItem(Items.OranBerry, { type: EffectType.Item, item: Items.OranBerry, unit: pig });
    battle.tick(turns(1));

    expect(pig.stages[Stages.Defense]).toBe(1);
    expect(pig.stages[Stages.SpecialDefense]).toBe(1);
  });
});

describe('Tripwire', () => {
  it('slows the first wind-up of an enemy that arrives mid-fight', () => {
    const { battle, teamA, teamB } = createBattle();
    const spider = createUnit(battle, teamA);
    const opener = createUnit(battle, teamB);
    const newcomer = createUnit(battle, teamB);
    const target = unitTarget(spider);

    spider.addAbility(Abilities.Tripwire);
    newcomer.addMove(Moves.Tackle);

    const plain = newcomer.checkMoveCastTime(Moves.Tackle, target);

    // Standing there when the fight opens is not crossing the thread
    opener.enter();
    expect(opener.checkMoveCastTime(Moves.Tackle, target)).toBe(plain);

    battle.tick(100);
    newcomer.enter();

    expect(newcomer.checkMoveCastTime(Moves.Tackle, target)).toBeCloseTo(plain * TRIPWIRE_SCALE);

    // Only the first move pays
    newcomer.cast(Moves.Tackle, target);
    expect(newcomer.casting?.time.duration).toBeCloseTo(plain * TRIPWIRE_SCALE);
    expect(newcomer.checkMoveCastTime(Moves.Tackle, target)).toBe(plain);
  });

  it('lets a teammate of the holder arrive untouched', () => {
    const { battle, teamA, teamB } = createBattle();
    const spider = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const target = unitTarget(foe);

    spider.addAbility(Abilities.Tripwire);

    const plain = mate.checkMoveCastTime(Moves.Tackle, target);

    battle.tick(100);
    mate.enter();

    expect(mate.checkMoveCastTime(Moves.Tackle, target)).toBe(plain);
  });
});

describe('Knockback', () => {
  it("pushes a contact target's wind-up back half a second", () => {
    const { battle, teamA, teamB } = createBattle();
    const bug = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    bug.addAbility(Abilities.Knockback);
    foe.addMove(Moves.Tackle);
    foe.cast(Moves.Tackle, unitTarget(bug));

    const duration = foe.casting?.time.duration ?? 0;

    battle.tick(Math.floor(duration * 0.75));

    const progress = foe.casting?.time.progress ?? 0;

    expect(progress).toBeGreaterThan(KNOCKBACK_SETBACK);

    bug.attack(foe, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(foe.casting?.time.progress).toBe(progress - KNOCKBACK_SETBACK);
    expect(foe.casting?.time.duration).toBe(duration);
  });

  it('leaves the wind-up alone for a move without contact', () => {
    const { battle, teamA, teamB } = createBattle();
    const bug = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    bug.addAbility(Abilities.Knockback);
    foe.addMove(Moves.Tackle);
    foe.cast(Moves.Tackle, unitTarget(bug));
    battle.tick(Math.floor((foe.casting?.time.duration ?? 0) * 0.75));

    const progress = foe.casting?.time.progress;

    bug.attack(foe, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(foe.casting?.time.progress).toBe(progress);
  });
});

describe('Static Palms', () => {
  it('paralyses with a punch that rolls under 20%', () => {
    const { battle, teamA, teamB } = createBattle();
    const mouse = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    mouse.addAbility(Abilities.StaticPalms);
    pinRandom(battle, 0.19);
    mouse.attack(foe, Moves.MachPunch, 40, Types.Fighting, MoveCategories.Physical, 0);

    expect(foe.status[Statuses.Paralyzed]).toBeDefined();
  });

  it('does nothing on a roll of 20% or more, or with a move that is not a punch', () => {
    const { battle, teamA, teamB } = createBattle();
    const mouse = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    mouse.addAbility(Abilities.StaticPalms);
    pinRandom(battle, 0.2);
    mouse.attack(foe, Moves.MachPunch, 40, Types.Fighting, MoveCategories.Physical, 0);
    pinRandom(battle, 0);
    mouse.attack(foe, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(foe.status[Statuses.Paralyzed]).toBeUndefined();
  });
});

describe('Scatter Brood', () => {
  it('sends each strike of a multi-hit move at the next standing enemy in turn', () => {
    const { battle, teamA, teamB } = createBattle();
    const mouse = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);
    const full = foe.health;
    const struck: Record<string, number> = { foe: 0, other: 0 };

    mouse.addAbility(Abilities.ScatterBrood);
    pinRandom(battle, 0.5);

    let foeHealth = foe.health;
    let otherHealth = other.health;

    mouse.triggerMove(Moves.TripleDive, unitTarget(foe), 0);
    for (let step = 0; step < 40; step += 1) {
      battle.tick(50);
      if (foe.health < foeHealth) {
        struck.foe += 1;
        foeHealth = foe.health;
      }
      if (other.health < otherHealth) {
        struck.other += 1;
        otherHealth = other.health;
      }
    }

    // Aimed, the other, then back to the aimed one
    expect(struck.foe).toBe(2);
    expect(struck.other).toBe(1);
    expect(foe.health).toBeLessThan(full);
  });

  it('keeps every strike on the target without it', () => {
    const { battle, teamA, teamB } = createBattle();
    const mouse = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);
    const before = other.health;

    pinRandom(battle, 0.5);
    mouse.triggerMove(Moves.TripleDive, unitTarget(foe), 0);
    battle.tick(2000);

    expect(foe.health).toBeLessThan(foe.checkStat(Stats.HP, 0));
    expect(other.health).toBe(before);
  });
});
