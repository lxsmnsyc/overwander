import { describe, expect, it } from 'vitest';
import type { Battle } from '../../src/battle/core';
import {
  BattleEvents,
  EffectType,
  MoveTargetType,
  type UnitAttackEvent,
} from '../../src/battle/events';
import type { Unit } from '../../src/battle/unit';
import { Stages, Stats } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import { Abilities } from '../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../src/data/ids/moves';
import { Genders } from '../../src/data/ids/species';
import { Statuses, Weathers } from '../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from './harness';

const NONE_CAUSE = { type: EffectType.None } as const;

function makeAttack(
  source: Unit,
  target: Unit,
  move: Moves,
  type: Types,
  category: MoveCategories,
): UnitAttackEvent {
  return {
    id: 'UnitAttack',
    disabled: false,
    source,
    target,
    move,
    value: 0,
    category,
    type,
    flags: 0,
    success: false,
  };
}

function resolveAttackStat(
  battle: Battle,
  parent: UnitAttackEvent,
  unit: Unit,
  stat: Stats,
  value: number,
) {
  const event = {
    id: 'UnitAttackResolveStat',
    disabled: false,
    parent,
    unit,
    stat,
    value,
  };
  battle.emit(BattleEvents.UnitAttackResolveStat, event);
  return event.value;
}

/** Deterministic direct attack; returns the health lost by the target */
function dealDamage(
  attacker: Unit,
  defender: Unit,
  move: Moves,
  power: number,
  type: Types,
  category: MoveCategories,
) {
  const before = defender.health;
  attacker.attack(defender, move, power, type, category, 0);
  return before - defender.health;
}

describe('Blaze (pinch abilities)', () => {
  it('boosts the offensive stat by 1.5 below a third of max health', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    attacker.addAbility(Abilities.Blaze);

    const parent = makeAttack(
      attacker,
      defender,
      Moves.Ember,
      Types.Fire,
      MoveCategories.Special,
    );

    // Full health: no boost
    expect(
      resolveAttackStat(battle, parent, attacker, Stats.SpecialAttack, 100),
    ).toBe(100);

    attacker.setHealth(40); // 40 <= 160 / 3

    expect(
      resolveAttackStat(battle, parent, attacker, Stats.SpecialAttack, 100),
    ).toBe(150);
  });

  it('does not boost moves of other types', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    attacker.addAbility(Abilities.Blaze);
    attacker.setHealth(40);

    const parent = makeAttack(
      attacker,
      defender,
      Moves.Tackle,
      Types.Normal,
      MoveCategories.Physical,
    );

    expect(resolveAttackStat(battle, parent, attacker, Stats.Attack, 100)).toBe(
      100,
    );
  });
});

describe('Thick Fat', () => {
  it('halves the attacker offensive stat against Fire moves', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    defender.addAbility(Abilities.ThickFat);

    const parent = makeAttack(
      attacker,
      defender,
      Moves.Ember,
      Types.Fire,
      MoveCategories.Special,
    );

    expect(
      resolveAttackStat(battle, parent, attacker, Stats.SpecialAttack, 100),
    ).toBe(50);

    // The defensive stat of the target is untouched
    expect(
      resolveAttackStat(battle, parent, defender, Stats.SpecialDefense, 100),
    ).toBe(100);
  });
});

describe('Chlorophyll', () => {
  it('doubles speed in sunny weather', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    unit.addAbility(Abilities.Chlorophyll);

    expect(unit.checkStat(Stats.Speed, 0)).toBe(105);

    teamA.weather.current = Weathers.Sunny;

    expect(unit.checkStat(Stats.Speed, 0)).toBe(210);
  });
});

describe('Solar Power', () => {
  it('doubles special attack and chips health on cast in the sun', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    unit.addAbility(Abilities.SolarPower);
    teamA.weather.current = Weathers.Sunny;

    expect(unit.checkStat(Stats.SpecialAttack, 0)).toBe(210);

    battle.emit(BattleEvents.UnitCast, {
      id: 'UnitCast',
      disabled: false,
      source: unit,
      move: Moves.Tackle,
      target: { type: MoveTargetType.None },
    });

    // 160 max HP - 1/8
    expect(unit.health).toBe(140);
  });
});

describe('Tough Claws', () => {
  it('boosts contact move power only', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addAbility(Abilities.ToughClaws);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(unit.checkMovePower(Moves.Tackle, target)).toBeCloseTo(
      (40 * 5325) / 4096,
    );
    expect(unit.checkMovePower(Moves.Ember, target)).toBe(40);
  });
});

describe('Rain Dish', () => {
  it('heals a sixteenth of max health on cast in the rain', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    unit.addAbility(Abilities.RainDish);
    teamA.weather.current = Weathers.Rain;
    unit.setHealth(100);

    battle.emit(BattleEvents.UnitCast, {
      id: 'UnitCast',
      disabled: false,
      source: unit,
      move: Moves.Tackle,
      target: { type: MoveTargetType.None },
    });

    expect(unit.health).toBe(110);
  });
});

describe('Shield Dust', () => {
  it('blocks secondary effects of incoming attacks', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const guarded = createUnit(battle, teamB);
    const exposed = createUnit(battle, teamB);
    guarded.addAbility(Abilities.ShieldDust);

    for (const defender of [guarded, exposed]) {
      battle.emit(BattleEvents.UnitAttackEffect, {
        id: 'UnitAttackEffect',
        disabled: false,
        parent: makeAttack(
          attacker,
          defender,
          Moves.BodySlam,
          Types.Normal,
          MoveCategories.Physical,
        ),
      });
    }

    expect(guarded.status[Statuses.Paralyzed]).toBeUndefined();
    expect(exposed.status[Statuses.Paralyzed]).toBeDefined();
  });
});

describe('Run Away', () => {
  it('always allows escaping, even while trapped', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    unit.addStatus(Statuses.Trapped, NONE_CAUSE);

    expect(unit.checkEscape()).toBe(false);

    unit.addAbility(Abilities.RunAway);

    expect(unit.checkEscape()).toBe(true);
  });
});

describe('Shed Skin', () => {
  it('cures a major status on cast when the roll passes', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    unit.addAbility(Abilities.ShedSkin);
    unit.addStatus(Statuses.Poisoned, NONE_CAUSE);

    const cast = () =>
      battle.emit(BattleEvents.UnitCast, {
        id: 'UnitCast',
        disabled: false,
        source: unit,
        move: Moves.Tackle,
        target: { type: MoveTargetType.None },
      });

    pinRandom(battle, 0.99);
    cast();
    expect(unit.status[Statuses.Poisoned]).toBeDefined();

    pinRandom(battle, 0);
    cast();
    expect(unit.status[Statuses.Poisoned]).toBeUndefined();
  });
});

describe('Compound Eyes', () => {
  it('multiplies accuracy by 1.3', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addAbility(Abilities.CompoundEyes);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(unit.checkMoveAccuracy(Moves.Tackle, target)).toBeCloseTo(130);
  });
});

describe('Sniper', () => {
  it('multiplies the critical multiplier by 1.5', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    attacker.addAbility(Abilities.Sniper);

    const event = {
      id: 'UnitAttackResolveCriticalMult',
      disabled: false,
      parent: makeAttack(
        attacker,
        defender,
        Moves.Slash,
        Types.Normal,
        MoveCategories.Physical,
      ),
      value: 2,
    };
    battle.emit(BattleEvents.UnitAttackResolveCriticalMult, event);

    expect(event.value).toBe(3);
  });
});

describe('Keen Eye', () => {
  it('blocks accuracy drops from other units only', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addAbility(Abilities.KeenEye);

    unit.addStage(Stages.Accuracy, -1, {
      type: EffectType.Move,
      move: Moves.SandAttack,
      unit: enemy,
    });
    expect(unit.stages[Stages.Accuracy]).toBe(0);

    // Self-inflicted drops still apply
    unit.addStage(Stages.Accuracy, -1, NONE_CAUSE);
    expect(unit.stages[Stages.Accuracy]).toBe(-1);
  });
});

describe('Big Pecks', () => {
  it('blocks defense drops from other units', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addAbility(Abilities.BigPecks);

    unit.addStage(Stages.Defense, -1, {
      type: EffectType.Move,
      move: Moves.Leer,
      unit: enemy,
    });

    expect(unit.stages[Stages.Defense]).toBe(0);
  });
});

describe('Tangled Feet', () => {
  it('doubles evasion while confused', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    unit.addAbility(Abilities.TangledFeet);
    unit.addStage(Stages.Evasion, 1, NONE_CAUSE);

    expect(unit.checkStage(Stages.Evasion, 0)).toBe(1);

    unit.addStatus(Statuses.Confused, NONE_CAUSE);

    expect(unit.checkStage(Stages.Evasion, 0)).toBe(2);
  });
});

describe('Guts', () => {
  it('boosts the attack stat by 1.5 while statused', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    attacker.addAbility(Abilities.Guts);

    const parent = makeAttack(
      attacker,
      defender,
      Moves.Tackle,
      Types.Normal,
      MoveCategories.Physical,
    );

    expect(resolveAttackStat(battle, parent, attacker, Stats.Attack, 100)).toBe(
      100,
    );

    attacker.addStatus(Statuses.Paralyzed, NONE_CAUSE);

    expect(resolveAttackStat(battle, parent, attacker, Stats.Attack, 100)).toBe(
      150,
    );
  });

  it('nets 1.5x physical damage while burned (halving compensated)', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);

    const attacker = createUnit(battle, teamA);
    attacker.addAbility(Abilities.Guts);

    const healthyTarget = createUnit(battle, teamB);
    const burnedTarget = createUnit(battle, teamB);

    const healthy = dealDamage(
      attacker,
      healthyTarget,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    attacker.addStatus(Statuses.Burned, NONE_CAUSE);

    const burned = dealDamage(
      attacker,
      burnedTarget,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    /**
     * base = ((2 * 50 / 5 + 2) * 40 * (attack / 105)) / 50 + 2
     * Healthy: attack 105 -> 19.6. Burned + Guts: attack 157.5 -> 28.4,
     * then the burn halving (0.5) and the Guts compensation (2) cancel.
     */
    expect(healthy).toBeCloseTo(19.6);
    expect(burned).toBeCloseTo(28.4);
  });
});

describe('Hustle', () => {
  it('boosts the attack stat and taxes physical accuracy', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addAbility(Abilities.Hustle);

    const parent = makeAttack(
      unit,
      enemy,
      Moves.Tackle,
      Types.Normal,
      MoveCategories.Physical,
    );

    expect(resolveAttackStat(battle, parent, unit, Stats.Attack, 100)).toBe(
      150,
    );

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(unit.checkMoveAccuracy(Moves.Tackle, target)).toBeCloseTo(80);
    // Special moves are unaffected
    expect(unit.checkMoveAccuracy(Moves.Ember, target)).toBe(100);
  });
});

describe('Static', () => {
  it('paralyzes attackers on direct contact damage', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);

    const holder = createUnit(battle, teamA);
    const contactAttacker = createUnit(battle, teamB);
    const rangedAttacker = createUnit(battle, teamB);
    holder.addAbility(Abilities.Static);

    contactAttacker.damage(
      { type: EffectType.Move, move: Moves.Tackle, unit: contactAttacker },
      holder,
      10,
      0,
    );
    expect(contactAttacker.status[Statuses.Paralyzed]).toBeDefined();

    rangedAttacker.damage(
      { type: EffectType.Move, move: Moves.Ember, unit: rangedAttacker },
      holder,
      10,
      0,
    );
    expect(rangedAttacker.status[Statuses.Paralyzed]).toBeUndefined();
  });
});

describe('Lightning Rod', () => {
  it('absorbs Electric moves and boosts special attack', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    holder.addAbility(Abilities.LightningRod);

    const target = { type: MoveTargetType.Unit, unit: holder } as const;

    expect(
      attacker.checkMoveImmunity(Moves.Thunderbolt, target, Types.Electric),
    ).toBe(true);

    // Speculative immunity checks grant no boost
    expect(holder.stages[Stages.SpecialAttack]).toBe(0);

    const before = holder.health;
    attacker.triggerMoveTarget(Moves.Thunderbolt, target, 0);

    expect(holder.health).toBe(before);
    expect(holder.stages[Stages.SpecialAttack]).toBe(1);
  });
});

describe('Tinted Lens', () => {
  it('doubles damage on not-very-effective hits', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);

    const plain = createUnit(battle, teamA);
    const lens = createUnit(battle, teamA);
    lens.addAbility(Abilities.TintedLens);

    // Grass vs Fire resists to 0.5
    const targetA = createUnit(battle, teamB, [Types.Fire]);
    const targetB = createUnit(battle, teamB, [Types.Fire]);

    const withoutLens = dealDamage(
      plain,
      targetA,
      Moves.VineWhip,
      45,
      Types.Grass,
      MoveCategories.Physical,
    );
    const withLens = dealDamage(
      lens,
      targetB,
      Moves.VineWhip,
      45,
      Types.Grass,
      MoveCategories.Physical,
    );

    expect(withLens / withoutLens).toBeCloseTo(2);
  });
});

describe('Intimidate', () => {
  it('lowers enemy attack on entering the field', () => {
    const { battle, teamA, teamB } = createBattle();
    const intimidator = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    intimidator.addAbility(Abilities.Intimidate);

    intimidator.enter();

    expect(enemy.stages[Stages.Attack]).toBe(-1);
    expect(ally.stages[Stages.Attack]).toBe(0);
  });
});

describe('Sand Veil', () => {
  it('taxes incoming accuracy in a sandstorm', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    holder.addAbility(Abilities.SandVeil);

    const target = { type: MoveTargetType.Unit, unit: holder } as const;

    expect(attacker.checkMoveAccuracy(Moves.Tackle, target)).toBe(100);

    teamB.weather.current = Weathers.Sandstorm;

    expect(attacker.checkMoveAccuracy(Moves.Tackle, target)).toBeCloseTo(80);
  });
});

describe('Sand Rush', () => {
  it('doubles speed in a sandstorm', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    unit.addAbility(Abilities.SandRush);

    expect(unit.checkStat(Stats.Speed, 0)).toBe(105);

    teamA.weather.current = Weathers.Sandstorm;

    expect(unit.checkStat(Stats.Speed, 0)).toBe(210);
  });
});

describe('Poison Point', () => {
  it('poisons attackers on direct contact damage', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);

    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    holder.addAbility(Abilities.PoisonPoint);

    attacker.damage(
      { type: EffectType.Move, move: Moves.Tackle, unit: attacker },
      holder,
      10,
      0,
    );

    expect(attacker.status[Statuses.Poisoned]).toBeDefined();
  });
});

describe('Sheer Force', () => {
  it('boosts effect-carrying moves and suppresses their effects', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0); // secondary effects would always proc
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addAbility(Abilities.SheerForce);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    // Body Slam carries a paralysis effect: boosted, effect suppressed
    expect(unit.checkMovePower(Moves.BodySlam, target)).toBeCloseTo(
      (85 * 5325) / 4096,
    );
    unit.triggerMoveTarget(Moves.BodySlam, target, 0);
    expect(enemy.status[Statuses.Paralyzed]).toBeUndefined();

    // Tackle has no effect: unchanged
    expect(unit.checkMovePower(Moves.Tackle, target)).toBe(40);
  });
});

describe('Rivalry', () => {
  it('scales damage by gender matchup', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);

    const unit = createUnit(battle, teamA);
    unit.addAbility(Abilities.Rivalry);
    unit.setGender(Genders.Male);

    const male = createUnit(battle, teamB);
    const female = createUnit(battle, teamB);
    const genderless = createUnit(battle, teamB);
    male.setGender(Genders.Male);
    female.setGender(Genders.Female);

    const hit = (defender: Unit) =>
      dealDamage(
        unit,
        defender,
        Moves.Tackle,
        40,
        Types.Normal,
        MoveCategories.Physical,
      );

    expect(hit(male)).toBeCloseTo(19.6 * 1.25);
    expect(hit(female)).toBeCloseTo(19.6 * 0.75);
    expect(hit(genderless)).toBeCloseTo(19.6);
  });
});
