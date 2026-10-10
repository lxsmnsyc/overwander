// Galar's legends: Zacian, Zamazenta, Eternatus, Kubfu, the two new
// Regis, Calyrex and its steeds, and the Galarian birds.

import { describe, expect, it } from 'vitest';
import {
  REIGN_MEND_FRACTION,
  SEALED_DURATION,
  SEALED_SCALE,
  WOKEN_SCALE,
  WOKEN_STAGES,
} from '../../../../src/battle/abilities/signature/__create';
import {
  DARKEST_DAY_FRACTION,
  KATA_INTERVAL,
} from '../../../../src/battle/abilities/signature/galar-legends';
import type Battle from '../../../../src/battle/core';
import { BattleEvents } from '../../../../src/battle/events';
import type Unit from '../../../../src/battle/unit';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Statuses } from '../../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, act, dealDamage, resolveAttackDamage } from './helpers';

/** Long enough for any cast move to have resolved */
const FLIGHT = 1000;

function enter(battle: Battle, unit: Unit): void {
  battle.emit(BattleEvents.UnitEntersField, {
    id: 'UnitEntersField',
    disabled: false,
    source: unit,
    reactivation: false,
  });
}

/** Takes the unit from full to just under half */
function halve(foe: Unit, unit: Unit): void {
  foe.damage(NONE_CAUSE, unit, unit.checkStat(Stats.HP, 0) / 2 + 1, 0);
}

describe('Sworn Blade', () => {
  it('casts Sacred Sword at whoever takes it or a teammate under half, once each', () => {
    const { battle, teamA, teamB } = createBattle();
    const zacian = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const full = foe.checkStat(Stats.HP, 0);

    pinRandom(battle, 1);
    zacian.addAbility(Abilities.SwornBlade);

    // Above half is nothing to answer
    foe.damage(NONE_CAUSE, mate, 10, 0);
    battle.tick(FLIGHT);

    expect(foe.health).toBe(full);

    halve(foe, mate);
    battle.tick(FLIGHT);

    const struck = foe.health;

    expect(struck).toBeLessThan(full);

    // Once for the teammate
    foe.damage(NONE_CAUSE, mate, 10, 0);
    battle.tick(FLIGHT);

    expect(foe.health).toBe(struck);

    // And once more for itself
    halve(foe, zacian);
    battle.tick(FLIGHT);

    expect(foe.health).toBeLessThan(struck);
  });

  it('answers nothing its own side did', () => {
    const { battle, teamA, teamB } = createBattle();
    const zacian = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const full = foe.checkStat(Stats.HP, 0);

    pinRandom(battle, 1);
    zacian.addAbility(Abilities.SwornBlade);

    halve(zacian, mate);
    battle.tick(FLIGHT);

    expect(foe.health).toBe(full);
  });
});

describe('Sworn Shield', () => {
  it('casts Follow Me the first time a teammate falls under half', () => {
    const { battle, teamA, teamB } = createBattle();
    const zamazenta = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    zamazenta.addAbility(Abilities.SwornShield);

    halve(foe, mate);
    battle.tick(FLIGHT);

    expect(zamazenta.status[Statuses.Centered]).toBeDefined();
  });

  it('never steps in front of itself', () => {
    const { battle, teamA, teamB } = createBattle();
    const zamazenta = createUnit(battle, teamA);
    createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    zamazenta.addAbility(Abilities.SwornShield);

    halve(foe, zamazenta);
    battle.tick(FLIGHT);

    expect(zamazenta.status[Statuses.Centered]).toBeUndefined();
  });
});

describe('Darkest Day', () => {
  it('drains every acting enemy into itself', () => {
    const { battle, teamA, teamB } = createBattle();
    const eternatus = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const max = foe.checkStat(Stats.HP, 0);
    const drain = max * DARKEST_DAY_FRACTION;

    eternatus.addAbility(Abilities.DarkestDay);
    eternatus.setHealth(max / 2);

    act(battle, foe);

    expect(foe.health).toBeCloseTo(max - drain, 5);
    expect(eternatus.health).toBeCloseTo(max / 2 + drain, 5);

    // Its own side acts freely
    act(battle, mate);

    expect(mate.health).toBe(max);
  });
});

describe('Kata', () => {
  it('casts Bulk Up on every third move it lands', () => {
    const { battle, teamA, teamB } = createBattle();
    const kubfu = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    kubfu.addAbility(Abilities.Kata);

    for (let move = 1; move < KATA_INTERVAL; move++) {
      act(battle, kubfu);
      dealDamage(kubfu, foe, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);
      battle.tick(FLIGHT);
    }

    expect(kubfu.stages[Stages.Attack]).toBe(0);

    act(battle, kubfu);
    dealDamage(kubfu, foe, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);
    battle.tick(FLIGHT);

    expect(kubfu.stages[Stages.Attack]).toBe(1);
    expect(kubfu.stages[Stages.Defense]).toBe(1);
  });

  it('counts a multi-hit move once', () => {
    const { battle, teamA, teamB } = createBattle();
    const kubfu = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    kubfu.addAbility(Abilities.Kata);

    act(battle, kubfu);

    for (let hit = 0; hit < KATA_INTERVAL; hit++) {
      dealDamage(kubfu, foe, Moves.SurgingStrikes, 25, Types.Water, MoveCategories.Physical);
    }

    battle.tick(FLIGHT);

    expect(kubfu.stages[Stages.Attack]).toBe(0);
  });
});

describe('the Galar golems', () => {
  const GOLEMS = [
    { name: 'Volt Seal', ability: Abilities.VoltSeal, stage: Stages.Speed },
    { name: 'Wyrm Seal', ability: Abilities.WyrmSeal, stage: Stages.SpecialAttack },
  ];

  for (const { name, ability, stage } of GOLEMS) {
    it(`stands sealed and then wakes for ${name}`, () => {
      const { battle, teamA, teamB } = createBattle();
      pinRandom(battle, 0);
      const holder = createUnit(battle, teamA);
      const bare = createUnit(battle, teamA);
      const enemy = createUnit(battle, teamB);
      holder.addAbility(ability);

      const clean = resolveAttackDamage(battle, bare, enemy);
      const incoming = resolveAttackDamage(battle, enemy, bare);

      expect(resolveAttackDamage(battle, holder, enemy)).toBeCloseTo(clean * SEALED_SCALE, 5);
      expect(resolveAttackDamage(battle, enemy, holder)).toBeCloseTo(incoming * SEALED_SCALE, 5);

      battle.tick(SEALED_DURATION);

      expect(holder.stages[stage]).toBe(WOKEN_STAGES);
      expect(resolveAttackDamage(battle, holder, enemy)).toBeCloseTo(clean * WOKEN_SCALE, 5);
      expect(resolveAttackDamage(battle, enemy, holder)).toBeCloseTo(incoming, 5);
    });
  }
});

describe("the king's reins", () => {
  const STEEDS = [
    { name: 'Frostreign', ability: Abilities.Frostreign, stage: Stages.Attack },
    { name: 'Shadereign', ability: Abilities.Shadereign, stage: Stages.SpecialAttack },
  ];

  for (const { name, ability, stage } of STEEDS) {
    it(`lifts the whole team for each knockout under ${name}`, () => {
      const { battle, teamA, teamB } = createBattle();
      const steed = createUnit(battle, teamA);
      const mate = createUnit(battle, teamA);
      const first = createUnit(battle, teamB);
      const second = createUnit(battle, teamB);

      steed.addAbility(ability);

      // A blow that leaves the enemy standing lifts nothing
      steed.damage(NONE_CAUSE, first, 10, 0);

      expect(mate.stages[stage]).toBe(0);

      steed.damage(NONE_CAUSE, first, 1000, 0);

      expect(steed.stages[stage]).toBe(1);
      expect(mate.stages[stage]).toBe(1);
      expect(second.stages[stage]).toBe(0);

      steed.damage(NONE_CAUSE, second, 1000, 0);

      expect(mate.stages[stage]).toBe(2);
    });
  }

  it('mends the whole team for each knockout under Crownreign', () => {
    const { battle, teamA, teamB } = createBattle();
    const king = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const max = mate.checkStat(Stats.HP, 0);

    king.addAbility(Abilities.Crownreign);
    king.setHealth(max / 2);
    mate.setHealth(max / 2);

    // Knocking out its own side is no conquest
    king.damage(NONE_CAUSE, createUnit(battle, teamA), 1000, 0);

    expect(mate.health).toBe(max / 2);

    king.damage(NONE_CAUSE, foe, 1000, 0);

    expect(king.health).toBeCloseTo(max / 2 + max * REIGN_MEND_FRACTION, 5);
    expect(mate.health).toBeCloseTo(max / 2 + max * REIGN_MEND_FRACTION, 5);
  });
});

describe('the mirror birds', () => {
  const MIRRORS = [
    {
      name: 'Glarewing',
      ability: Abilities.Glarewing,
      kanto: Abilities.Frostwing,
      stage: Stages.Speed,
    },
    {
      name: 'Strikewing',
      ability: Abilities.Strikewing,
      kanto: Abilities.Stormwing,
      stage: Stages.SpecialDefense,
    },
    {
      name: 'Wrathwing',
      ability: Abilities.Wrathwing,
      kanto: Abilities.Emberwing,
      stage: Stages.Defense,
    },
  ];

  for (const { name, ability, kanto, stage } of MIRRORS) {
    it(`takes a stage off the whole far side as ${name} arrives`, () => {
      const { battle, teamA, teamB } = createBattle();
      const holder = createUnit(battle, teamA);
      const ally = createUnit(battle, teamA);
      const first = createUnit(battle, teamB);
      const second = createUnit(battle, teamB);
      holder.addAbility(ability);

      enter(battle, holder);

      expect(first.stages[stage]).toBe(-1);
      expect(second.stages[stage]).toBe(-1);
      expect(ally.stages[stage]).toBe(0);
      expect(holder.stages[stage]).toBe(0);
    });

    it(`beats nothing either way when ${name} faces its Kanto mirror`, () => {
      const { battle, teamA, teamB } = createBattle();
      const galarian = createUnit(battle, teamA);
      const galarianMate = createUnit(battle, teamA);
      const kantonian = createUnit(battle, teamB);
      const kantonianMate = createUnit(battle, teamB);
      galarian.addAbility(ability);
      kantonian.addAbility(kanto);

      // The Galarian bird arriving into the Kanto one
      enter(battle, galarian);

      expect(kantonian.stages[stage]).toBe(0);
      expect(kantonianMate.stages[stage]).toBe(0);

      // And the Kanto bird arriving into the Galarian one
      enter(battle, kantonian);

      expect(galarian.stages[stage]).toBe(0);
      expect(galarianMate.stages[stage]).toBe(0);
    });

    it(`still beats when ${name} shares a side with its mirror`, () => {
      const { battle, teamA, teamB } = createBattle();
      const galarian = createUnit(battle, teamA);
      const kantonian = createUnit(battle, teamA);
      const foe = createUnit(battle, teamB);
      galarian.addAbility(ability);
      kantonian.addAbility(kanto);

      enter(battle, galarian);
      enter(battle, kantonian);

      expect(foe.stages[stage]).toBe(-2);
    });
  }

  it('is answered only by its own mirror', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const other = createUnit(battle, teamB);
    holder.addAbility(Abilities.Glarewing);
    other.addAbility(Abilities.Stormwing);

    enter(battle, holder);

    expect(other.stages[Stages.Speed]).toBe(-1);
  });
});
