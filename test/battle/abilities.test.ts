import { describe, expect, it } from 'vitest';
import type Battle from '../../src/battle/core';
import {
  BattleEvents,
  EffectType,
  MoveTargetType,
  type UnitAttackEvent,
} from '../../src/battle/events';
import type Unit from '../../src/battle/unit';
import { Stages, Stats } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import Abilities from '../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../src/data/ids/moves';
import { Genders } from '../../src/data/ids/species';
import { Statuses, TeamStatuses, Weathers } from '../../src/data/ids/status';
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
): number {
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
): number {
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

    const parent = makeAttack(attacker, defender, Moves.Ember, Types.Fire, MoveCategories.Special);

    // Full health: no boost
    expect(resolveAttackStat(battle, parent, attacker, Stats.SpecialAttack, 100)).toBe(100);

    attacker.setHealth(40); // 40 <= 160 / 3

    expect(resolveAttackStat(battle, parent, attacker, Stats.SpecialAttack, 100)).toBe(150);
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

    expect(resolveAttackStat(battle, parent, attacker, Stats.Attack, 100)).toBe(100);
  });
});

describe('Thick Fat', () => {
  it('halves the attacker offensive stat against Fire moves', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    defender.addAbility(Abilities.ThickFat);

    const parent = makeAttack(attacker, defender, Moves.Ember, Types.Fire, MoveCategories.Special);

    expect(resolveAttackStat(battle, parent, attacker, Stats.SpecialAttack, 100)).toBe(50);

    // The defensive stat of the target is untouched
    expect(resolveAttackStat(battle, parent, defender, Stats.SpecialDefense, 100)).toBe(100);
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

    expect(unit.checkMovePower(Moves.Tackle, target)).toBeCloseTo((40 * 5325) / 4096);
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

    const cast = (): void => {
      battle.emit(BattleEvents.UnitCast, {
        id: 'UnitCast',
        disabled: false,
        source: unit,
        move: Moves.Tackle,
        target: { type: MoveTargetType.None },
      });
    };

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
      parent: makeAttack(attacker, defender, Moves.Slash, Types.Normal, MoveCategories.Physical),
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

    expect(resolveAttackStat(battle, parent, attacker, Stats.Attack, 100)).toBe(100);

    attacker.addStatus(Statuses.Paralyzed, NONE_CAUSE);

    expect(resolveAttackStat(battle, parent, attacker, Stats.Attack, 100)).toBe(150);
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

    const parent = makeAttack(unit, enemy, Moves.Tackle, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, parent, unit, Stats.Attack, 100)).toBe(150);

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

    expect(attacker.checkMoveImmunity(Moves.Thunderbolt, target, Types.Electric)).toBe(true);

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

    attacker.damage({ type: EffectType.Move, move: Moves.Tackle, unit: attacker }, holder, 10, 0);

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
    expect(unit.checkMovePower(Moves.BodySlam, target)).toBeCloseTo((85 * 5325) / 4096);
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

    const hit = (defender: Unit): number =>
      dealDamage(unit, defender, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(hit(male)).toBeCloseTo(19.6 * 1.25);
    expect(hit(female)).toBeCloseTo(19.6 * 0.75);
    expect(hit(genderless)).toBeCloseTo(19.6);
  });
});

describe('Magic Guard', () => {
  it('blocks indirect damage only', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    holder.addAbility(Abilities.MagicGuard);

    holder.addStatus(Statuses.Poisoned, {
      type: EffectType.Move,
      move: Moves.PoisonPowder,
      unit: attacker,
    });
    battle.tick(1000);
    expect(holder.health).toBe(160); // poison chip blocked

    pinRandom(battle, 1);
    attacker.attack(holder, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    expect(holder.health).toBeCloseTo(160 - 19.6); // direct damage lands
  });
});

describe('Friend Guard', () => {
  it('reduces damage taken by teammates, not the holder', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const guard = createUnit(battle, teamA);
    const protectedAlly = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    guard.addAbility(Abilities.FriendGuard);

    attacker.attack(protectedAlly, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    expect(160 - protectedAlly.health).toBeCloseTo(19.6 * 0.75);

    attacker.attack(guard, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    expect(160 - guard.health).toBeCloseTo(19.6);
  });
});

describe('Unaware', () => {
  it('ignores the attacker offensive stages when defending', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const unaware = createUnit(battle, teamB);
    const normal = createUnit(battle, teamB);
    unaware.addAbility(Abilities.Unaware);

    attacker.addStage(Stages.Attack, 2, NONE_CAUSE);

    attacker.attack(normal, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    expect(160 - normal.health).toBeCloseTo(0.44 * 40 * 2 + 2); // boosted

    attacker.attack(unaware, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    expect(160 - unaware.health).toBeCloseTo(19.6); // boost ignored
  });
});

describe('Cute Charm', () => {
  it('infatuates opposite-gender attackers on contact', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);

    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    holder.addAbility(Abilities.CuteCharm);
    holder.setGender(Genders.Female);
    attacker.setGender(Genders.Male);

    attacker.damage({ type: EffectType.Move, move: Moves.Tackle, unit: attacker }, holder, 10, 0);

    expect(attacker.status[Statuses.Infatuated]).toBeDefined();
  });
});

describe('Flash Fire', () => {
  it('absorbs Fire moves and boosts its own Fire power', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    holder.addAbility(Abilities.FlashFire);

    const target = { type: MoveTargetType.Unit, unit: holder } as const;
    const enemy = { type: MoveTargetType.Unit, unit: attacker } as const;

    expect(attacker.checkMoveImmunity(Moves.Ember, target, Types.Fire)).toBe(true);

    // Not yet activated: Ember is at its base power
    expect(holder.checkMovePower(Moves.Ember, enemy)).toBe(40);

    const before = holder.health;
    attacker.triggerMoveTarget(Moves.Ember, target, 0);

    expect(holder.health).toBe(before);
    expect(holder.checkMovePower(Moves.Ember, enemy)).toBe(60);

    // The boost is lost when the holder leaves the field
    holder.leave();
    expect(holder.checkMovePower(Moves.Ember, enemy)).toBe(40);
  });
});

describe('Drought', () => {
  it('turns the battle sunny when the holder gains it', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);

    expect(battle.weather.current).toBe(Weathers.None);

    holder.addAbility(Abilities.Drought);

    expect(battle.weather.current).toBe(Weathers.Sunny);
  });
});

describe('Competitive', () => {
  it('raises special attack sharply when an enemy lowers a stat', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Competitive);

    holder.addStage(Stages.Attack, -1, {
      type: EffectType.Move,
      move: Moves.Growl,
      unit: enemy,
    });

    expect(holder.stages[Stages.SpecialAttack]).toBe(2);
  });

  it('ignores self-inflicted drops', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.Competitive);

    holder.addStage(Stages.Attack, -1, NONE_CAUSE);

    expect(holder.stages[Stages.SpecialAttack]).toBe(0);
  });
});

describe('Inner Focus', () => {
  it('cannot flinch', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.InnerFocus);

    holder.addStatus(Statuses.Flinched, NONE_CAUSE);

    expect(holder.status[Statuses.Flinched]).toBeUndefined();
  });

  it('is unfazed by Intimidate', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const exposed = createUnit(battle, teamA);
    const intimidator = createUnit(battle, teamB);
    holder.addAbility(Abilities.InnerFocus);
    intimidator.addAbility(Abilities.Intimidate);

    intimidator.enter();

    expect(holder.stages[Stages.Attack]).toBe(0);
    expect(exposed.stages[Stages.Attack]).toBe(-1);
  });
});

describe('Infiltrator', () => {
  it('attacks through screens', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);

    const plain = createUnit(battle, teamA);
    const infiltrator = createUnit(battle, teamA);
    infiltrator.addAbility(Abilities.Infiltrator);

    const targetA = createUnit(battle, teamB);
    const targetB = createUnit(battle, teamB);
    teamB.addStatus(TeamStatuses.Reflect, NONE_CAUSE);

    const screened = dealDamage(
      plain,
      targetA,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );
    const bypassed = dealDamage(
      infiltrator,
      targetB,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    expect(bypassed / screened).toBeCloseTo(4096 / 2732);
  });
});

describe('Stench', () => {
  it('may flinch the target on damaging hits', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);

    const holder = createUnit(battle, teamA);
    const victim = createUnit(battle, teamB);
    holder.addAbility(Abilities.Stench);

    victim.damage({ type: EffectType.Move, move: Moves.Tackle, unit: holder }, victim, 10, 0);

    expect(victim.status[Statuses.Flinched]).toBeDefined();
  });
});

describe('Effect Spore', () => {
  it('afflicts contact attackers, sparing Grass types', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0); // lowest roll: poison

    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    const grass = createUnit(battle, teamB, [Types.Grass]);
    holder.addAbility(Abilities.EffectSpore);

    const hit = (unit: typeof attacker): void => {
      holder.damage({ type: EffectType.Move, move: Moves.Tackle, unit }, holder, 10, 0);
    };

    hit(attacker);
    expect(attacker.status[Statuses.Poisoned]).toBeDefined();

    hit(grass);
    expect(grass.status[Statuses.Poisoned]).toBeUndefined();
  });
});

describe('Infiltrator vs Substitute', () => {
  it('pierces the substitute while plain attacks are absorbed', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);

    const plain = createUnit(battle, teamA);
    const infiltrator = createUnit(battle, teamA);
    infiltrator.addAbility(Abilities.Infiltrator);

    const targetA = createUnit(battle, teamB);
    const targetB = createUnit(battle, teamB);
    targetA.addStatus(Statuses.Substituted, NONE_CAUSE);
    targetB.addStatus(Statuses.Substituted, NONE_CAUSE);

    const absorbed = dealDamage(
      plain,
      targetA,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );
    const pierced = dealDamage(
      infiltrator,
      targetB,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    expect(absorbed).toBe(0);
    expect(pierced).toBeCloseTo(0.44 * 40 + 2);
  });
});
