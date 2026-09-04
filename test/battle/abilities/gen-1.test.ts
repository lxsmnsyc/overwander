import { describe, expect, it } from 'vitest';
import { AttackPriority, EventPriority } from '../../../src/core/event-emitter';
import type Battle from '../../../src/battle/core';
import {
  BattleEvents,
  EffectType,
  MoveTargetType,
  type UnitAttackEvent,
  type UnitAttackResolveCriticalEvent,
} from '../../../src/battle/events';
import { MOVE_DELAY } from '../../../src/battle/mechanics/move';
import turns from '../../../src/battle/turn';
import type Unit from '../../../src/battle/unit';
import { Stages, Stats, StatsKind } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import Abilities from '../../../src/data/ids/abilities';
import { Items } from '../../../src/data/ids/items';
import { DamageFlags, MoveCategories, Moves } from '../../../src/data/ids/moves';
import { Genders } from '../../../src/data/ids/species';
import { Statuses, TeamStatuses, Weathers } from '../../../src/data/ids/status';
import { packSlots } from '../../../src/data/constants/slots';
import { createBattle, createUnit, pinRandom } from '../harness';

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

  it('shields the holder from sandstorm chip damage', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    holder.addAbility(Abilities.SandVeil);

    battle.setWeather(Weathers.Sandstorm);
    battle.tick(turns(1));

    expect(holder.health).toBe(160);
    expect(plain.health).toBe(150);
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

  it('still pays what the holder spends on purpose', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.MagicGuard);

    // A Substitute's price and an Explosion's own life are costs, not
    // damage done to the holder: shrugging off indirect damage is no
    // excuse for not paying
    holder.triggerMoveEffect(Moves.Substitute, { type: MoveTargetType.None }, 0);

    expect(holder.status[Statuses.Substituted]).toBeDefined();
    expect(holder.health).toBe(160 - Math.floor(160 / 4));
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
    // It calls up the sun by casting the move for it, and the move
    // lands a delay later like any other
    battle.tick(MOVE_DELAY);

    expect(battle.weather.current).toBe(Weathers.Sunny);
  });

  it('calls up the sun by casting the move for it', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    let cast: Moves | null = null;

    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
      cast = event.move;
    });

    holder.addAbility(Abilities.Drought);

    // A Drought is a Sunny Day nobody had to learn: one path to the
    // sky rather than two that have to agree with each other
    expect(cast).toBe(Moves.SunnyDay);
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

describe('Dry Skin', () => {
  it('absorbs Water moves and heals a quarter of max health', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0.99);
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    holder.addAbility(Abilities.DrySkin);
    holder.setHealth(100);

    const target = { type: MoveTargetType.Unit, unit: holder } as const;

    expect(attacker.checkMoveImmunity(Moves.WaterGun, target, Types.Water)).toBe(true);

    attacker.triggerMoveTarget(Moves.WaterGun, target, 0);

    expect(holder.health).toBe(140); // 100 + 160 / 4
  });

  it('takes extra damage from Fire moves', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);

    const attacker = createUnit(battle, teamA);
    const plain = createUnit(battle, teamB);
    const dry = createUnit(battle, teamB);
    dry.addAbility(Abilities.DrySkin);

    const normal = dealDamage(attacker, plain, Moves.Ember, 40, Types.Fire, MoveCategories.Special);
    const boosted = dealDamage(attacker, dry, Moves.Ember, 40, Types.Fire, MoveCategories.Special);

    expect(boosted / normal).toBeCloseTo(1.25);
  });
});

describe('Wonder Skin', () => {
  it('drops accurate status moves to 50 percent, leaving attacks alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    holder.addAbility(Abilities.WonderSkin);

    const target = { type: MoveTargetType.Unit, unit: holder } as const;

    expect(attacker.checkMoveAccuracy(Moves.StunSpore, target)).toBe(50);
    expect(attacker.checkMoveAccuracy(Moves.Tackle, target)).toBe(100);
  });
});

describe('Arena Trap', () => {
  it('traps grounded enemies, sparing Flying types and Run Away', () => {
    const { battle, teamA, teamB } = createBattle();
    const trapper = createUnit(battle, teamA);
    trapper.addAbility(Abilities.ArenaTrap);

    const grounded = createUnit(battle, teamB);
    const flying = createUnit(battle, teamB, [Types.Flying]);
    const runner = createUnit(battle, teamB);
    runner.addAbility(Abilities.RunAway);

    expect(grounded.checkEscape()).toBe(false);
    expect(flying.checkEscape()).toBe(true);
    expect(runner.checkEscape()).toBe(true);
    // The trapper's own side is unaffected
    expect(trapper.checkEscape()).toBe(true);

    // The Grounded status (e.g. Gravity) drags airborne units down
    flying.addStatus(Statuses.Grounded, NONE_CAUSE);
    expect(flying.checkEscape()).toBe(false);
  });
});

describe('Sand Force', () => {
  it('boosts Ground, Rock and Steel power in a sandstorm only', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SandForce);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMovePower(Moves.Earthquake, target)).toBe(100);

    teamA.weather.current = Weathers.Sandstorm;

    expect(holder.checkMovePower(Moves.Earthquake, target)).toBeCloseTo(130);
    expect(holder.checkMovePower(Moves.Tackle, target)).toBe(40);
  });
});

describe('Technician', () => {
  it('boosts weak moves only', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Technician);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMovePower(Moves.Tackle, target)).toBe(60); // 40 * 1.5
    expect(holder.checkMovePower(Moves.Slash, target)).toBe(70); // above threshold
  });
});

describe('Limber', () => {
  it('cannot be paralyzed', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.Limber);

    holder.addStatus(Statuses.Paralyzed, NONE_CAUSE);

    expect(holder.status[Statuses.Paralyzed]).toBeUndefined();
  });
});

describe('Pickup', () => {
  it('scavenges an item another unit consumed', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const consumer = createUnit(battle, teamB);
    holder.addAbility(Abilities.Pickup);

    consumer.addItem(Items.OranBerry);
    consumer.triggerItem(Items.OranBerry);

    expect(holder.items[Items.OranBerry]).toBe(true);
  });

  it('needs a free item slot within the battle limit', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const consumer = createUnit(battle, teamB);
    holder.addAbility(Abilities.Pickup);
    holder.addItem(Items.CheriBerry); // fills the only slot

    consumer.addItem(Items.OranBerry);
    consumer.triggerItem(Items.OranBerry);

    expect(holder.items[Items.OranBerry]).toBeUndefined();
  });

  it('scavenges into a slot the record left free', () => {
    const { battle, teamA, teamB } = createBattle('test-seed', undefined, packSlots(1, 2, 4));
    const holder = createUnit(battle, teamA);
    const consumer = createUnit(battle, teamB);

    holder.setSlots(packSlots(1, 2, 4));
    holder.addAbility(Abilities.Pickup);
    holder.addItem(Items.CheriBerry);

    consumer.addItem(Items.OranBerry);
    consumer.triggerItem(Items.OranBerry);

    expect(holder.items[Items.OranBerry]).toBe(true);
  });

  it('leaves what it finds where it lies while its own hands are full', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const consumer = createUnit(battle, teamB);

    holder.addAbility(Abilities.Pickup);
    holder.addItem(Items.CheriBerry);

    consumer.addItem(Items.OranBerry);
    consumer.triggerItem(Items.OranBerry);

    expect(holder.items[Items.OranBerry]).toBeUndefined();
  });
});

describe('Swift Swim', () => {
  it('doubles speed in the rain', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    unit.addAbility(Abilities.SwiftSwim);

    expect(unit.checkStat(Stats.Speed, 0)).toBe(105);

    teamA.weather.current = Weathers.Rain;

    expect(unit.checkStat(Stats.Speed, 0)).toBe(210);
  });
});

describe('Cloud Nine', () => {
  it('suppresses weather effects for everyone while up', () => {
    const { battle, teamA, teamB } = createBattle();
    const swimmer = createUnit(battle, teamA);
    swimmer.addAbility(Abilities.SwiftSwim);
    teamA.weather.current = Weathers.Rain;

    expect(swimmer.checkStat(Stats.Speed, 0)).toBe(210);

    const duck = createUnit(battle, teamB);
    duck.addAbility(Abilities.CloudNine);
    duck.enter();

    expect(swimmer.checkWeather()).toBe(Weathers.None);
    expect(swimmer.checkStat(Stats.Speed, 0)).toBe(105);

    // Suppression lifts when the holder goes down
    duck.faint(duck);

    expect(swimmer.checkStat(Stats.Speed, 0)).toBe(210);
  });
});

describe('Vital Spirit', () => {
  it('cannot fall asleep, with a cue on real attempts only', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.VitalSpirit);

    let cues = 0;
    battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Post, (event) => {
      if (event.ability === Abilities.VitalSpirit) {
        cues += 1;
      }
    });

    // Speculative immunity checks stay silent
    holder.checkStatusImmunity(Statuses.Sleeping, NONE_CAUSE);
    expect(cues).toBe(0);

    holder.addStatus(Statuses.Sleeping, NONE_CAUSE);

    expect(holder.status[Statuses.Sleeping]).toBeUndefined();
    expect(cues).toBe(1);
  });
});

describe('Anger Point', () => {
  it('maxes attack when struck by a critical hit', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0); // crits always land
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    holder.addAbility(Abilities.AngerPoint);

    attacker.attack(
      holder,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
      2, // MoveAttackFlags.Critical
    );

    expect(holder.stages[Stages.Attack]).toBe(6);
  });
});

describe('Defiant', () => {
  it('raises attack sharply when an enemy lowers a stat', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Defiant);

    holder.addStage(Stages.Defense, -1, {
      type: EffectType.Move,
      move: Moves.TailWhip,
      unit: enemy,
    });

    expect(holder.stages[Stages.Attack]).toBe(2);
  });
});

describe('Justified', () => {
  it('raises attack when hit by a Dark move', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    holder.addAbility(Abilities.Justified);

    holder.damage({ type: EffectType.Move, move: Moves.Bite, unit: attacker }, holder, 10, 0);

    expect(holder.stages[Stages.Attack]).toBe(1);

    // Non-Dark moves leave it unmoved
    holder.damage({ type: EffectType.Move, move: Moves.Tackle, unit: attacker }, holder, 10, 0);

    expect(holder.stages[Stages.Attack]).toBe(1);
  });
});

describe('Water Absorb', () => {
  it('absorbs Water moves and heals a quarter of max health', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0.99);
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    holder.addAbility(Abilities.WaterAbsorb);
    holder.setHealth(100);

    const target = { type: MoveTargetType.Unit, unit: holder } as const;

    expect(attacker.checkMoveImmunity(Moves.WaterGun, target, Types.Water)).toBe(true);

    attacker.triggerMoveTarget(Moves.WaterGun, target, 0);

    expect(holder.health).toBe(140); // 100 + 160 / 4
  });
});

describe('Synchronize', () => {
  it('reflects poison, burn, and paralysis onto the inflicter', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    holder.addAbility(Abilities.Synchronize);

    holder.addStatus(Statuses.Poisoned, {
      type: EffectType.Move,
      move: Moves.PoisonPowder,
      unit: attacker,
    });

    expect(holder.status[Statuses.Poisoned]).toBeDefined();
    expect(attacker.status[Statuses.Poisoned]).toBeDefined();
  });

  it('does not reflect sleep', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    holder.addAbility(Abilities.Synchronize);

    holder.addStatus(Statuses.Sleeping, {
      type: EffectType.Move,
      move: Moves.Hypnosis,
      unit: attacker,
    });

    expect(attacker.status[Statuses.Sleeping]).toBeUndefined();
  });
});

describe('No Guard', () => {
  it('removes the accuracy check both ways and reaches hidden targets', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.NoGuard);

    // Outgoing and incoming inaccurate moves lose their check
    expect(
      holder.checkMoveAccuracy(Moves.Hypnosis, { type: MoveTargetType.Unit, unit: enemy }),
    ).toBeUndefined();
    expect(
      enemy.checkMoveAccuracy(Moves.Hypnosis, { type: MoveTargetType.Unit, unit: holder }),
    ).toBeUndefined();

    // Semi-invulnerable targets can still be reached
    pinRandom(battle, 1);
    enemy.triggerMoveEffect(Moves.Fly, { type: MoveTargetType.Unit, unit: holder }, 1);
    const before = holder.health;
    holder.attack(enemy, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    expect(holder.health).toBe(before); // sanity: holder untouched

    holder.triggerMoveTarget(Moves.Tackle, { type: MoveTargetType.Unit, unit: enemy }, 0);
    expect(enemy.health).toBeLessThan(160);
  });
});

describe('Steadfast', () => {
  it('gains speed when flinching', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.Steadfast);

    holder.addStatus(Statuses.Flinched, NONE_CAUSE);

    expect(holder.stages[Stages.Speed]).toBe(1);
  });
});

describe('Clear Body', () => {
  it('blocks stat drops from other units but not its own', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.ClearBody);

    holder.addStage(Stages.Attack, -1, {
      type: EffectType.Move,
      move: Moves.Growl,
      unit: enemy,
    });
    expect(holder.stages[Stages.Attack]).toBe(0);

    // Self-inflicted drops still apply
    holder.addStage(Stages.Attack, -1, NONE_CAUSE);
    expect(holder.stages[Stages.Attack]).toBe(-1);
  });
});

describe('Liquid Ooze', () => {
  it('makes drains backfire on the drinker', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const drinker = createUnit(battle, teamB);
    holder.addAbility(Abilities.LiquidOoze);

    drinker.triggerMoveEffect(Moves.MegaDrain, { type: MoveTargetType.Unit, unit: holder }, 0);

    const dealt = 160 - holder.health;
    expect(dealt).toBeGreaterThan(0);
    // Half the damage dealt comes back as damage, not healing
    expect(160 - drinker.health).toBeCloseTo(dealt / 2);
  });
});

describe('Rock Head', () => {
  it('takes no recoil damage', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.RockHead);

    holder.triggerMoveEffect(Moves.TakeDown, { type: MoveTargetType.Unit, unit: enemy }, 0);

    expect(enemy.health).toBeLessThan(160);
    expect(holder.health).toBe(160); // no recoil
  });
});

describe('Sturdy', () => {
  it('endures a lethal blow from full health and blocks OHKO moves', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    holder.addAbility(Abilities.Sturdy);

    expect(
      attacker.checkMoveImmunity(
        Moves.Fissure,
        { type: MoveTargetType.Unit, unit: holder },
        Types.Ground,
      ),
    ).toBe(true);

    attacker.damage(NONE_CAUSE, holder, 999, 0);

    expect(holder.health).toBe(1);
    expect(holder.alive).toBe(true);

    // Not from full health: goes down normally
    attacker.damage(NONE_CAUSE, holder, 999, 0);
    expect(holder.alive).toBe(false);
  });
});

describe('Damp', () => {
  it('forbids self-destructing while a holder is on the field', () => {
    const { battle, teamA, teamB } = createBattle();
    const bomber = createUnit(battle, teamA);
    const damp = createUnit(battle, teamB);
    bomber.addMove(Moves.SelfDestruct);
    bomber.addMove(Moves.Tackle);

    expect(bomber.checkCanCast(Moves.SelfDestruct, { type: MoveTargetType.None })).toBe(true);

    damp.addAbility(Abilities.Damp);
    damp.enter();

    expect(bomber.checkCanCast(Moves.SelfDestruct, { type: MoveTargetType.None })).toBe(false);
    expect(bomber.checkCanCast(Moves.Tackle, { type: MoveTargetType.None })).toBe(true);

    // Suppression lifts when the holder goes down
    damp.faint(damp);
    expect(bomber.checkCanCast(Moves.SelfDestruct, { type: MoveTargetType.None })).toBe(true);
  });
});

describe('Flame Body', () => {
  it('may burn contact attackers', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);

    const holder = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    holder.addAbility(Abilities.FlameBody);

    holder.damage({ type: EffectType.Move, move: Moves.Tackle, unit: attacker }, holder, 10, 0);

    expect(attacker.status[Statuses.Burned]).toBeDefined();
  });
});

describe('Oblivious', () => {
  it('cannot be infatuated and shrugs off Intimidate', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Oblivious);
    holder.setGender(Genders.Male);
    enemy.setGender(Genders.Female);
    enemy.addAbility(Abilities.Intimidate);

    holder.addStatus(Statuses.Infatuated, {
      type: EffectType.Ability,
      ability: Abilities.CuteCharm,
      unit: enemy,
    });
    expect(holder.status[Statuses.Infatuated]).toBeUndefined();

    enemy.enter();
    expect(holder.stages[Stages.Attack]).toBe(0);
  });
});

describe('Own Tempo', () => {
  it('cannot be confused', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.OwnTempo);

    holder.addStatus(Statuses.Confused, NONE_CAUSE);

    expect(holder.status[Statuses.Confused]).toBeUndefined();
  });
});

describe('Regenerator', () => {
  it('restores a third of max health on withdrawing', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.Regenerator);
    holder.enter();
    holder.setHealth(60);

    holder.leave();

    expect(holder.health).toBeCloseTo(60 + 160 / 3);
  });
});

describe('Magnet Pull', () => {
  it('traps Steel-type enemies only', () => {
    const { battle, teamA, teamB } = createBattle();
    const magnet = createUnit(battle, teamA);
    magnet.addAbility(Abilities.MagnetPull);

    const steel = createUnit(battle, teamB, [Types.Steel]);
    const plain = createUnit(battle, teamB);

    expect(steel.checkEscape()).toBe(false);
    expect(plain.checkEscape()).toBe(true);
  });
});

describe('Analytic', () => {
  it('boosts power against targets committed to a move', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Analytic);
    enemy.addMove(Moves.Tackle);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMovePower(Moves.Tackle, target)).toBe(40);

    enemy.cast(Moves.Tackle, { type: MoveTargetType.Unit, unit: holder });

    expect(holder.checkMovePower(Moves.Tackle, target)).toBeCloseTo(40 * 1.3);
  });
});

describe('Early Bird', () => {
  it('sleeps for half the usual duration', () => {
    const { battle, teamA } = createBattle();
    const bird = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    bird.addAbility(Abilities.EarlyBird);

    bird.addStatus(Statuses.Sleeping, NONE_CAUSE);
    plain.addStatus(Statuses.Sleeping, NONE_CAUSE);

    // Half of the sleep: the bird is up, the other is not
    battle.tick(turns(1) + 100);
    expect(bird.status[Statuses.Sleeping]).toBeUndefined();
    expect(plain.status[Statuses.Sleeping]).toBeDefined();

    battle.tick(turns(1));
    expect(plain.status[Statuses.Sleeping]).toBeUndefined();
  });
});

describe('Hydration', () => {
  it('blocks major status conditions in the rain', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    unit.addAbility(Abilities.Hydration);
    teamA.weather.current = Weathers.Rain;

    unit.addStatus(Statuses.Poisoned, NONE_CAUSE);
    expect(unit.status[Statuses.Poisoned]).toBeUndefined();

    teamA.weather.current = Weathers.None;

    unit.addStatus(Statuses.Poisoned, NONE_CAUSE);
    expect(unit.status[Statuses.Poisoned]).toBeDefined();
  });
});

describe('Ice Body', () => {
  it('heals a sixteenth of max health on cast in hail', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    unit.addAbility(Abilities.IceBody);
    teamA.weather.current = Weathers.Hail;
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

  it('shields the holder from hail chip damage', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    holder.addAbility(Abilities.IceBody);

    battle.setWeather(Weathers.Hail);
    battle.tick(turns(1));

    expect(holder.health).toBe(160);
    expect(plain.health).toBe(150);
  });
});

describe('Sticky Hold', () => {
  it('blocks item removal forced by other units', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const thief = createUnit(battle, teamB);
    holder.addAbility(Abilities.StickyHold);
    holder.addItem(Items.OranBerry);

    holder.removeItem(Items.OranBerry, {
      type: EffectType.Move,
      move: Moves.Tackle,
      unit: thief,
    });
    expect(holder.items[Items.OranBerry]).toBe(true);

    // Self-removal (e.g. consuming a berry) still goes through
    holder.removeItem(Items.OranBerry, {
      type: EffectType.Item,
      item: Items.OranBerry,
      unit: holder,
    });
    expect(holder.items[Items.OranBerry]).toBeUndefined();
  });
});

describe('Poison Touch', () => {
  it('poisons the target on direct contact damage', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);

    const attacker = createUnit(battle, teamA);
    const victim = createUnit(battle, teamB);
    attacker.addAbility(Abilities.PoisonTouch);

    attacker.damage({ type: EffectType.Move, move: Moves.Tackle, unit: attacker }, victim, 10, 0);

    expect(victim.status[Statuses.Poisoned]).toBeDefined();
  });
});

describe('Shell Armor', () => {
  it('blocks critical hits', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0); // every roll would crit

    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    const plain = createUnit(battle, teamB);
    holder.addAbility(Abilities.ShellArmor);

    for (const [defender, expected] of [
      [holder, false],
      [plain, true],
    ] as const) {
      const event: UnitAttackResolveCriticalEvent = {
        id: 'UnitAttackResolveCriticalHit',
        disabled: false,
        parent: makeAttack(attacker, defender, Moves.Tackle, Types.Normal, MoveCategories.Physical),
        critical: false,
      };

      battle.emit(BattleEvents.UnitAttackResolveCriticalHit, event);

      expect(event.critical).toBe(expected);
    }
  });
});

describe('Battle Armor', () => {
  it('blocks critical hits like Shell Armor', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0); // every roll would crit

    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    holder.addAbility(Abilities.BattleArmor);

    const event: UnitAttackResolveCriticalEvent = {
      id: 'UnitAttackResolveCriticalHit',
      disabled: false,
      parent: makeAttack(attacker, holder, Moves.Tackle, Types.Normal, MoveCategories.Physical),
      critical: false,
    };

    battle.emit(BattleEvents.UnitAttackResolveCriticalHit, event);

    expect(event.critical).toBe(false);
  });
});

describe('Skill Link', () => {
  it('multi-hit moves always strike the maximum count', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(unit.checkMoveHits(Moves.SpikeCannon, target, 2, 5)).toBe(2);

    unit.addAbility(Abilities.SkillLink);

    expect(unit.checkMoveHits(Moves.SpikeCannon, target, 2, 5)).toBe(5);
  });
});

describe('Overcoat', () => {
  it('is immune to powder moves', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    holder.addAbility(Abilities.Overcoat);

    const target = { type: MoveTargetType.Unit, unit: holder } as const;

    expect(attacker.checkMoveImmunity(Moves.SleepPowder, target, Types.Grass)).toBe(true);
    expect(attacker.checkMoveImmunity(Moves.Tackle, target, Types.Normal)).toBe(false);
  });

  it('shields the holder from both weather chips', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.Overcoat);

    battle.setWeather(Weathers.Sandstorm);
    battle.tick(1000);
    battle.setWeather(Weathers.Hail);
    battle.tick(1000);

    expect(holder.health).toBe(160);
  });
});

describe('Levitate', () => {
  it('lifts the holder off the ground and blocks Ground moves', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);

    expect(holder.checkGrounded()).toBe(true);

    holder.addAbility(Abilities.Levitate);

    expect(holder.checkGrounded()).toBe(false);

    const target = { type: MoveTargetType.Unit, unit: holder } as const;

    expect(attacker.checkMoveImmunity(Moves.Earthquake, target, Types.Ground)).toBe(true);
  });

  it('is overridden by the Grounded status', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.Levitate);
    holder.addStatus(Statuses.Grounded, NONE_CAUSE);

    expect(holder.checkGrounded()).toBe(true);
  });
});

describe('Insomnia', () => {
  it('blocks sleep', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.Insomnia);

    holder.addStatus(Statuses.Sleeping, NONE_CAUSE);

    expect(holder.status[Statuses.Sleeping]).toBeUndefined();
  });
});

describe('Forewarn', () => {
  it('disables the strongest enemy move on entry', () => {
    const { battle, teamA, teamB } = createBattle();
    const enemy = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);
    enemy.addMove(Moves.Tackle);
    other.addMove(Moves.HyperBeam);

    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.Forewarn);
    holder.enter();

    expect(other.moves[Moves.HyperBeam]?.disabled).toBe(true);
    expect(enemy.moves[Moves.Tackle]?.disabled).toBe(false);
  });

  it('hands the move back once the lockout runs out', () => {
    const { battle, teamA, teamB } = createBattle();
    const enemy = createUnit(battle, teamB);
    enemy.addMove(Moves.Tackle);

    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.Forewarn);
    holder.enter();

    expect(enemy.moves[Moves.Tackle]?.disabled).toBe(true);

    battle.tick(turns(4));

    expect(enemy.moves[Moves.Tackle]?.disabled).toBe(false);
  });

  it('hands the move back when the forewarner leaves', () => {
    const { battle, teamA, teamB } = createBattle();
    const enemy = createUnit(battle, teamB);
    enemy.addMove(Moves.Tackle);

    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.Forewarn);
    holder.enter();
    holder.leave();

    expect(enemy.moves[Moves.Tackle]?.disabled).toBe(false);
  });
});

describe('Frisk', () => {
  it('pockets one enemy item while it stands', () => {
    const { battle, teamA, teamB } = createBattle();
    const enemy = createUnit(battle, teamB);
    enemy.addItem(Items.LifeOrb);

    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.Frisk);
    holder.enter();

    expect(enemy.hasItem(Items.LifeOrb)).toBe(false);
    expect(enemy.items[Items.LifeOrb]).toBe(true); // still in the grip

    holder.leave();

    expect(enemy.hasItem(Items.LifeOrb)).toBe(true);
  });

  it('leaves berries alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const enemy = createUnit(battle, teamB);
    enemy.addItem(Items.SitrusBerry);

    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.Frisk);
    holder.enter();

    expect(enemy.hasItem(Items.SitrusBerry)).toBe(true);
  });
});

describe('Soundproof', () => {
  it('is immune to sound-based moves', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    holder.addAbility(Abilities.Soundproof);

    const target = { type: MoveTargetType.Unit, unit: holder } as const;

    expect(attacker.checkMoveImmunity(Moves.Growl, target, Types.Normal)).toBe(true);
    expect(attacker.checkMoveImmunity(Moves.Tackle, target, Types.Normal)).toBe(false);
  });
});

describe('Aftermath', () => {
  it('damages the attacker when knocked out by contact', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    holder.addAbility(Abilities.Aftermath);

    attacker.damage({ type: EffectType.Move, move: Moves.Tackle, unit: attacker }, holder, 999, 0);

    expect(holder.alive).toBe(false);
    expect(attacker.health).toBe(120); // a quarter of 160 max HP
  });

  it('is suppressed while a Damp unit is on the field', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    const damp = createUnit(battle, teamB);
    holder.addAbility(Abilities.Aftermath);
    damp.addAbility(Abilities.Damp);

    attacker.damage({ type: EffectType.Move, move: Moves.Tackle, unit: attacker }, holder, 999, 0);

    expect(holder.alive).toBe(false);
    expect(attacker.health).toBe(160);
  });
});

describe('Harvest', () => {
  it('regrows a self-consumed berry on cast in the sun', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    unit.addAbility(Abilities.Harvest);
    unit.addItem(Items.OranBerry);
    teamA.weather.current = Weathers.Sunny;

    unit.removeItem(Items.OranBerry, {
      type: EffectType.Item,
      item: Items.OranBerry,
      unit,
    });
    expect(unit.items[Items.OranBerry]).toBeUndefined();

    battle.emit(BattleEvents.UnitCast, {
      id: 'UnitCast',
      disabled: false,
      source: unit,
      move: Moves.Tackle,
      target: { type: MoveTargetType.None },
    });

    expect(unit.items[Items.OranBerry]).toBe(true);
  });
});

describe('Hyper Cutter', () => {
  it('blocks attack drops from other units only', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.HyperCutter);

    holder.addStage(Stages.Attack, -1, {
      type: EffectType.Move,
      move: Moves.Growl,
      unit: enemy,
    });

    expect(holder.stages[Stages.Attack]).toBe(0);

    // Self-inflicted drops still apply
    holder.addStage(Stages.Attack, -1, {
      type: EffectType.Move,
      move: Moves.Growl,
      unit: holder,
    });

    expect(holder.stages[Stages.Attack]).toBe(-1);
  });
});

describe('Weak Armor', () => {
  it('trades defense for speed when hit by a physical move', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    holder.addAbility(Abilities.WeakArmor);

    // Special moves leave the armor intact
    attacker.damage({ type: EffectType.Move, move: Moves.Ember, unit: attacker }, holder, 10, 0);

    expect(holder.stages[Stages.Defense]).toBe(0);

    attacker.damage({ type: EffectType.Move, move: Moves.Tackle, unit: attacker }, holder, 10, 0);

    expect(holder.stages[Stages.Defense]).toBe(-1);
    expect(holder.stages[Stages.Speed]).toBe(2);
  });
});

describe('Boss', () => {
  it('multiplies stats: twentyfold HP, doubled otherwise', () => {
    const { battle, teamA } = createBattle();
    const boss = createUnit(battle, teamA);
    boss.addAbility(Abilities.Boss);

    // 160 * 20, so a raid is as long as the species is bulky
    expect(boss.checkStat(Stats.HP, 0)).toBe(3200);
    expect(boss.checkStat(Stats.Attack, 0)).toBe(210);
    expect(boss.checkStat(Stats.Speed, 0)).toBe(210);
  });

  it('is immune to negative stage applications', () => {
    const { battle, teamA, teamB } = createBattle();
    const boss = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    boss.addAbility(Abilities.Boss);

    const cause = { type: EffectType.Move, move: Moves.Growl, unit: enemy } as const;

    boss.addStage(Stages.Attack, -1, cause);
    boss.removeStage(Stages.Defense, 1, cause);

    expect(boss.stages[Stages.Attack]).toBe(0);
    expect(boss.stages[Stages.Defense]).toBe(0);

    // Positive applications still land
    boss.addStage(Stages.Attack, 1, cause);
    expect(boss.stages[Stages.Attack]).toBe(1);
  });

  it('cannot be healed', () => {
    const { battle, teamA, teamB } = createBattle();
    const boss = createUnit(battle, teamA);
    const ally = createUnit(battle, teamB);
    const cause = { type: EffectType.Move, move: Moves.Recover, unit: boss } as const;

    boss.addAbility(Abilities.Boss);
    boss.setHealth(boss.checkStat(Stats.HP, 0) - 1000);
    ally.setHealth(ally.checkStat(Stats.HP, 0) - 100);

    const hurt = boss.health;

    boss.heal(cause, boss, 500, 0);
    // The pool is the timer a raid is run against, so nothing puts it
    // back — but everybody else heals as they always did
    expect(boss.health).toBe(hurt);

    ally.heal(cause, ally, 50, 0);
    expect(ally.health).toBeGreaterThan(ally.checkStat(Stats.HP, 0) - 100);
  });

  it('gets nothing back from Rest either', () => {
    const { battle, teamA } = createBattle();
    const boss = createUnit(battle, teamA);

    boss.addAbility(Abilities.Boss);
    boss.setHealth(boss.checkStat(Stats.HP, 0) - 1000);

    const hurt = boss.health;

    boss.triggerMoveEffect(Moves.Rest, { type: MoveTargetType.Unit, unit: boss }, 0);
    // Rest used to put the health on directly, which asked nobody
    expect(boss.health).toBe(hurt);
    // It still sleeps: what the ability refuses is the healing
    expect(boss.getStatus(Statuses.Sleeping)).not.toBeUndefined();
  });

  it('is immune to health-scaling damage', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const boss = createUnit(battle, teamB);
    boss.addAbility(Abilities.Boss);

    // Super Fang halves health; the boss shrugs it off
    attacker.triggerMoveEffect(Moves.SuperFang, { type: MoveTargetType.Unit, unit: boss }, 0);
    expect(boss.health).toBe(160);

    // Health-scaled indirect damage (e.g. residuals) is ignored too
    attacker.damage(NONE_CAUSE, boss, 10, DamageFlags.Indirect | DamageFlags.HealthScaled);
    expect(boss.health).toBe(160);

    // Plain damage still lands
    attacker.damage(NONE_CAUSE, boss, 10, 0);
    expect(boss.health).toBe(150);
  });

  it('is immune to indirect damage, crashes included', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const boss = createUnit(battle, teamB);
    boss.addAbility(Abilities.Boss);

    // Whatever the source — a burn, a seed, the weather — nothing
    // indirect takes health off a boss
    attacker.damage(NONE_CAUSE, boss, 10, DamageFlags.Indirect);
    expect(boss.health).toBe(160);

    // A crash off a missed Jump Kick is its own damage, and it is
    // refused the same way — a plain unit would be down to half here
    boss.addMove(Moves.JumpKick);
    battle.emit(BattleEvents.UnitTriggerMoveMissed, {
      id: 'UnitTriggerMoveMissed',
      disabled: false,
      parent: {
        id: 'UnitTriggerMove',
        disabled: false,
        source: boss,
        move: Moves.JumpKick,
        target: { type: MoveTargetType.Unit, unit: attacker },
        steps: 0,
      },
    });
    expect(boss.health).toBe(160);

    // A drain rides the same event as a negative amount, so healing
    // still reaches it — a boss' pool is far above the health these
    // units are built with, so there is room to climb
    boss.damage(NONE_CAUSE, boss, -10, DamageFlags.Indirect);
    expect(boss.health).toBe(170);

    // A hit still lands
    attacker.damage(NONE_CAUSE, boss, 30, 0);
    expect(boss.health).toBe(140);

    // What a boss spends on purpose it still pays: a Substitute's
    // price and an Explosion's own life are costs, not damage
    boss.damage(NONE_CAUSE, boss, 20, DamageFlags.Indirect | DamageFlags.Cost);
    expect(boss.health).toBe(120);
  });

  it('shrugs off disruption statuses unless self-inflicted', () => {
    const { battle, teamA, teamB } = createBattle();
    const boss = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    boss.addAbility(Abilities.Boss);

    const hostile = { type: EffectType.Move, move: Moves.Hypnosis, unit: enemy } as const;

    boss.addStatus(Statuses.Sleeping, hostile);
    boss.addStatus(Statuses.Trapped, hostile);
    boss.addStatus(Statuses.Flinched, hostile);
    boss.addStatus(Statuses.Frozen, hostile);

    expect(boss.status[Statuses.Sleeping]).toBeUndefined();
    expect(boss.status[Statuses.Trapped]).toBeUndefined();
    expect(boss.status[Statuses.Flinched]).toBeUndefined();
    expect(boss.status[Statuses.Frozen]).toBeUndefined();

    // Self-inflicted sleep (e.g. Rest) still lands
    boss.addStatus(Statuses.Sleeping, { type: EffectType.Move, move: Moves.Rest, unit: boss });

    expect(boss.status[Statuses.Sleeping]).toBeDefined();
  });

  it('cannot be infatuated', () => {
    const { battle, teamA, teamB } = createBattle();
    const boss = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const charmer = createUnit(battle, teamB);
    boss.addAbility(Abilities.Boss);

    // Infatuation only takes hold between opposite genders, so the
    // three of them are given one — otherwise a boss that shrugged
    // nothing off would still come out unaffected and the test would
    // pass for the wrong reason
    boss.setGender(Genders.Male);
    plain.setGender(Genders.Male);
    charmer.setGender(Genders.Female);

    const smitten = {
      type: EffectType.Ability,
      ability: Abilities.CuteCharm,
      unit: charmer,
    } as const;

    plain.addStatus(Statuses.Infatuated, smitten);
    boss.addStatus(Statuses.Infatuated, smitten);

    // A lobby is up to ten parties, so somebody always has the gender
    // the boss would fall for: an Attract that landed would turn the
    // raid into a queue of who brought the right pokemon
    expect(plain.status[Statuses.Infatuated]).toBeDefined();
    expect(boss.status[Statuses.Infatuated]).toBeUndefined();
  });

  it('cannot have its moves disabled', () => {
    const { battle, teamA } = createBattle();
    const boss = createUnit(battle, teamA);
    boss.addAbility(Abilities.Boss);
    boss.addMove(Moves.Tackle);

    boss.disableMove(Moves.Tackle);

    expect(boss.moves[Moves.Tackle]?.disabled).toBe(false);
  });

  it('cannot be forced out', () => {
    const { battle, teamA, teamB } = createBattle();
    const enemy = createUnit(battle, teamA);
    const boss = createUnit(battle, teamB);
    createUnit(battle, teamB); // bench replacement
    boss.addAbility(Abilities.Boss);

    let switches = 0;
    battle.on(BattleEvents.UnitSwitch, EventPriority.Post, () => {
      switches += 1;
    });

    enemy.triggerMoveEffect(Moves.Roar, { type: MoveTargetType.Unit, unit: boss }, 0);

    expect(switches).toBe(0);
  });

  it('casts twice as slowly but cannot be interrupted', () => {
    const { battle, teamA, teamB } = createBattle();
    const boss = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    boss.addAbility(Abilities.Boss);
    boss.addMove(Moves.Tackle);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(boss.checkMoveCastTime(Moves.Tackle, target)).toBe(
      plain.checkMoveCastTime(Moves.Tackle, target) * 2,
    );

    boss.cast(Moves.Tackle, target);
    expect(boss.casting).toBeDefined();

    boss.interrupt();
    expect(boss.casting).toBeDefined();
  });

  it('takes no recoil damage', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const boss = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    boss.addAbility(Abilities.Boss);

    boss.triggerMoveEffect(Moves.TakeDown, { type: MoveTargetType.Unit, unit: enemy }, 0);

    expect(enemy.health).toBeLessThan(160);
    expect(boss.health).toBe(160); // no recoil (stored health unchanged)
  });

  it('lies dormant for ten seconds on its first entry only', () => {
    const { battle, teamA } = createBattle();
    const boss = createUnit(battle, teamA);
    boss.addAbility(Abilities.Boss);
    boss.addMove(Moves.Tackle);

    boss.enter();

    const target = { type: MoveTargetType.None } as const;

    expect(boss.status[Statuses.Dormant]).toBeDefined();
    expect(boss.checkCanCast(Moves.Tackle, target)).toBe(false);

    // Still warming up halfway through
    battle.tick(5000);

    expect(boss.status[Statuses.Dormant]).toBeDefined();

    battle.tick(5000);

    expect(boss.status[Statuses.Dormant]).toBeUndefined();
    expect(boss.checkCanCast(Moves.Tackle, target)).toBe(true);

    // Later entries skip the warm-up
    boss.leave();
    boss.enter();

    expect(boss.status[Statuses.Dormant]).toBeUndefined();
  });

  it('is roused early when its health falls to half', () => {
    const { battle, teamA, teamB } = createBattle();
    const boss = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);
    boss.addAbility(Abilities.Boss);
    boss.addMove(Moves.Tackle);

    boss.enter();

    expect(boss.status[Statuses.Dormant]).toBeDefined();

    // A dent that leaves it above half leaves it sleeping
    const half = boss.checkStat(Stats.HP, 0) / 2;

    attacker.damage({ type: EffectType.None }, boss, boss.health - Math.floor(half) - 1, 0);

    expect(boss.status[Statuses.Dormant]).toBeDefined();

    attacker.damage({ type: EffectType.None }, boss, 1, 0);

    expect(boss.status[Statuses.Dormant]).toBeUndefined();
    expect(boss.checkCanCast(Moves.Tackle, { type: MoveTargetType.None })).toBe(true);
  });

  it('widens single-target enemy moves to every enemy', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const boss = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const first = createUnit(battle, teamB);
    const second = createUnit(battle, teamB);
    boss.addAbility(Abilities.Boss);

    battle.emit(BattleEvents.UnitTriggerMoveEnd, {
      id: 'UnitTriggerMoveEnd',
      disabled: false,
      source: boss,
      move: Moves.Tackle,
      target: { type: MoveTargetType.Unit, unit: first },
      steps: 0,
    });

    expect(first.health).toBeLessThan(160);
    expect(second.health).toBeLessThan(160);
    expect(ally.health).toBe(160);
  });
});

describe('Shadow', () => {
  function resolveDamage(battle: Battle, parent: UnitAttackEvent, value: number): number {
    const event = {
      id: 'UnitAttackResolveDamage',
      disabled: false,
      parent,
      value,
    } as const;

    battle.emit(BattleEvents.UnitAttackResolveDamage, event);

    return event.value;
  }

  it('amplifies damage dealt and received by 20%', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const shadow = createUnit(battle, teamA);
    const other = createUnit(battle, teamB);
    const plainA = createUnit(battle, teamA);
    const plainB = createUnit(battle, teamB);
    shadow.addAbility(Abilities.Shadow);

    const baseline = resolveDamage(
      battle,
      makeAttack(plainA, plainB, Moves.Tackle, Types.Normal, MoveCategories.Physical),
      40,
    );

    const dealt = makeAttack(shadow, other, Moves.Tackle, Types.Normal, MoveCategories.Physical);
    expect(resolveDamage(battle, dealt, 40)).toBeCloseTo(baseline * 1.2);

    const received = makeAttack(other, shadow, Moves.Tackle, Types.Normal, MoveCategories.Physical);
    expect(resolveDamage(battle, received, 40)).toBeCloseTo(baseline * 1.2);
  });

  it('stacks between two shadow units', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const shadow = createUnit(battle, teamA);
    const mirror = createUnit(battle, teamB);
    const plainA = createUnit(battle, teamA);
    const plainB = createUnit(battle, teamB);
    shadow.addAbility(Abilities.Shadow);
    mirror.addAbility(Abilities.Shadow);

    const baseline = resolveDamage(
      battle,
      makeAttack(plainA, plainB, Moves.Tackle, Types.Normal, MoveCategories.Physical),
      40,
    );

    const attack = makeAttack(shadow, mirror, Moves.Tackle, Types.Normal, MoveCategories.Physical);

    expect(resolveDamage(battle, attack, 40)).toBeCloseTo(baseline * 1.44);
  });
});

describe('Reckless', () => {
  it('boosts recoil and crash move power', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addAbility(Abilities.Reckless);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(unit.checkMovePower(Moves.TakeDown, target)).toBeCloseTo(90 * 1.2);
    expect(unit.checkMovePower(Moves.JumpKick, target)).toBeCloseTo(100 * 1.2);
    expect(unit.checkMovePower(Moves.Tackle, target)).toBe(40);
  });
});

describe('Iron Fist', () => {
  it('boosts punching move power', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addAbility(Abilities.IronFist);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(unit.checkMovePower(Moves.FirePunch, target)).toBeCloseTo(75 * 1.2);
    expect(unit.checkMovePower(Moves.Tackle, target)).toBe(40);
  });
});

describe('Unburden', () => {
  it('doubles speed after losing its item until it leaves', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    unit.addAbility(Abilities.Unburden);
    unit.addItem(Items.OranBerry);

    expect(unit.checkStat(Stats.Speed, 0)).toBe(105);

    unit.removeItem(Items.OranBerry, {
      type: EffectType.Item,
      item: Items.OranBerry,
      unit,
    });

    expect(unit.checkStat(Stats.Speed, 0)).toBe(210);

    unit.leave();

    expect(unit.checkStat(Stats.Speed, 0)).toBe(105);
  });
});

describe('crash moves', () => {
  it('hurt the user for half its max health on a miss', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addMove(Moves.JumpKick);

    battle.emit(BattleEvents.UnitTriggerMoveMissed, {
      id: 'UnitTriggerMoveMissed',
      disabled: false,
      parent: {
        id: 'UnitTriggerMove',
        disabled: false,
        source: unit,
        move: Moves.JumpKick,
        target: { type: MoveTargetType.Unit, unit: enemy },
        steps: 0,
      },
    });

    expect(unit.health).toBe(80);
  });
});

describe('Neutralizing Gas', () => {
  it('suppresses other abilities while a holder is fielded', () => {
    const { battle, teamA, teamB } = createBattle();
    const runner = createUnit(battle, teamA);
    runner.addAbility(Abilities.SandRush);

    expect(runner.hasAbility(Abilities.SandRush)).toBe(true);

    const gas = createUnit(battle, teamB);
    gas.addAbility(Abilities.NeutralizingGas);
    gas.enter();

    expect(runner.hasAbility(Abilities.SandRush)).toBe(false);

    gas.leave();

    expect(runner.hasAbility(Abilities.SandRush)).toBe(true);
  });

  it('suppresses abilities gained under the gas but spares specials', () => {
    const { battle, teamA, teamB } = createBattle();
    const gas = createUnit(battle, teamA);
    gas.addAbility(Abilities.NeutralizingGas);
    gas.enter();

    const late = createUnit(battle, teamB);
    late.addAbility(Abilities.Limber);
    late.addAbility(Abilities.Boss);

    expect(late.hasAbility(Abilities.Limber)).toBe(false);
    expect(late.hasAbility(Abilities.Boss)).toBe(true);
  });

  it('suppresses before other entry listeners of the same event', () => {
    const { battle, teamA, teamB } = createBattle();
    const runner = createUnit(battle, teamA);
    runner.addAbility(Abilities.SandRush);
    const gas = createUnit(battle, teamB);
    gas.addAbility(Abilities.NeutralizingGas);

    let seen: boolean | undefined;
    battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
      if (event.source === gas) {
        seen = runner.hasAbility(Abilities.SandRush);
      }
    });

    gas.enter();

    expect(seen).toBe(false);
  });

  it('keeps suppressing while another holder remains', () => {
    const { battle, teamA, teamB } = createBattle();
    const runner = createUnit(battle, teamA);
    runner.addAbility(Abilities.SandRush);

    const first = createUnit(battle, teamB);
    const second = createUnit(battle, teamB);
    first.addAbility(Abilities.NeutralizingGas);
    second.addAbility(Abilities.NeutralizingGas);
    first.enter();
    second.enter();

    first.leave();
    expect(runner.hasAbility(Abilities.SandRush)).toBe(false);

    second.leave();
    expect(runner.hasAbility(Abilities.SandRush)).toBe(true);
  });
});

describe('protected abilities', () => {
  it('Boss and Shadow cannot be disabled', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    unit.addAbility(Abilities.Boss);
    unit.addAbility(Abilities.Shadow);

    unit.disableAbility(Abilities.Boss);
    unit.disableAbility(Abilities.Shadow);

    expect(unit.hasAbility(Abilities.Boss)).toBe(true);
    expect(unit.hasAbility(Abilities.Shadow)).toBe(true);
  });
});

describe('Natural Cure', () => {
  it('cures status conditions on leaving the field', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    unit.addAbility(Abilities.NaturalCure);
    unit.addStatus(Statuses.Poisoned, NONE_CAUSE);

    unit.leave();

    expect(unit.status[Statuses.Poisoned]).toBeUndefined();
  });
});

describe('Serene Grace', () => {
  it('doubles secondary effect chances', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SereneGrace);

    const event = {
      id: 'CheckUnitAttackEffectChance',
      disabled: false,
      parent: makeAttack(holder, enemy, Moves.BodySlam, Types.Normal, MoveCategories.Physical),
      value: undefined as number | undefined,
    };

    battle.emit(BattleEvents.CheckUnitAttackEffectChance, event);

    expect(event.value).toBe(60); // Body Slam's 30% doubled
  });
});

describe('Healer', () => {
  it('may cure an ally on cast', () => {
    const { battle, teamA } = createBattle();
    pinRandom(battle, 0); // the cure always procs
    const healer = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    healer.addAbility(Abilities.Healer);
    ally.addStatus(Statuses.Burned, NONE_CAUSE);

    battle.emit(BattleEvents.UnitCast, {
      id: 'UnitCast',
      disabled: false,
      source: healer,
      move: Moves.Pound,
      target: { type: MoveTargetType.None },
    });

    expect(ally.status[Statuses.Burned]).toBeUndefined();
  });
});

describe('Leaf Guard', () => {
  it('blocks major status conditions in the sun', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    unit.addAbility(Abilities.LeafGuard);
    teamA.weather.current = Weathers.Sunny;

    unit.addStatus(Statuses.Poisoned, NONE_CAUSE);

    expect(unit.status[Statuses.Poisoned]).toBeUndefined();
  });
});

describe('Water Veil', () => {
  it('blocks burns', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.WaterVeil);

    holder.addStatus(Statuses.Burned, NONE_CAUSE);

    expect(holder.status[Statuses.Burned]).toBeUndefined();
  });
});

describe('Scrappy', () => {
  it('hits Ghosts with Normal and Fighting moves', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const ghost = createUnit(battle, teamB);
    ghost.types.add(Types.Ghost);

    const target = { type: MoveTargetType.Unit, unit: ghost } as const;

    expect(attacker.checkMoveImmunity(Moves.Tackle, target, Types.Normal)).toBe(true);

    attacker.addAbility(Abilities.Scrappy);

    expect(attacker.checkMoveImmunity(Moves.Tackle, target, Types.Normal)).toBe(false);
  });
});

describe('Filter', () => {
  it('softens super-effective hits by a quarter', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    const plain = createUnit(battle, teamB);
    holder.types.add(Types.Grass);
    plain.types.add(Types.Grass);
    holder.addAbility(Abilities.Filter);

    attacker.triggerMoveEffect(Moves.Ember, { type: MoveTargetType.Unit, unit: plain }, 0);
    attacker.triggerMoveEffect(Moves.Ember, { type: MoveTargetType.Unit, unit: holder }, 0);

    const plainDamage = 160 - plain.health;
    const filteredDamage = 160 - holder.health;

    expect(plainDamage).toBeGreaterThan(0);
    expect(filteredDamage).toBeCloseTo(plainDamage * 0.75);
  });

  it('leaves neutral hits alone', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    const plain = createUnit(battle, teamB);
    holder.addAbility(Abilities.Filter);

    attacker.triggerMoveEffect(Moves.Tackle, { type: MoveTargetType.Unit, unit: plain }, 0);
    attacker.triggerMoveEffect(Moves.Tackle, { type: MoveTargetType.Unit, unit: holder }, 0);

    expect(holder.health).toBe(plain.health);
  });
});

describe('Moxie', () => {
  it('raises attack after a direct knock-out', () => {
    const { battle, teamA, teamB } = createBattle();
    const hunter = createUnit(battle, teamA);
    const victim = createUnit(battle, teamB);
    hunter.addAbility(Abilities.Moxie);

    hunter.damage({ type: EffectType.Move, move: Moves.Tackle, unit: hunter }, victim, 999, 0);

    expect(victim.alive).toBe(false);
    expect(hunter.stages[Stages.Attack]).toBe(1);
  });
});

describe('Mold Breaker', () => {
  it('pierces Levitate with Ground moves', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const floater = createUnit(battle, teamB);
    floater.addAbility(Abilities.Levitate);

    const target = { type: MoveTargetType.Unit, unit: floater } as const;

    attacker.triggerMoveTarget(Moves.Earthquake, target, 0);
    expect(floater.health).toBe(160); // Levitate holds without the mold breaker

    attacker.addAbility(Abilities.MoldBreaker);

    attacker.triggerMoveTarget(Moves.Earthquake, target, 0);
    expect(floater.health).toBeLessThan(160);

    // The window closed: Levitate reads as present again
    expect(floater.hasAbility(Abilities.Levitate)).toBe(true);
  });

  it('closes its window even when the attack is disabled mid-flight', () => {
    const { battle, teamA, teamB } = createBattle();
    const breaker = createUnit(battle, teamA);
    const victim = createUnit(battle, teamB);
    breaker.addAbility(Abilities.MoldBreaker);
    victim.addAbility(Abilities.SandRush);

    // A later listener kills the resolution mid-flight
    battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Pre, (event) => {
      event.disabled = true;
    });

    breaker.triggerMoveTarget(Moves.Tackle, { type: MoveTargetType.Unit, unit: victim }, 0);

    expect(victim.health).toBe(160);
    expect(victim.hasAbility(Abilities.SandRush)).toBe(true);
  });

  it('pierces Filter during damage resolution', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const breaker = createUnit(battle, teamA);
    const filtered = createUnit(battle, teamB);
    const plain = createUnit(battle, teamB);
    breaker.addAbility(Abilities.MoldBreaker);
    filtered.types.add(Types.Grass);
    plain.types.add(Types.Grass);
    filtered.addAbility(Abilities.Filter);

    breaker.triggerMoveEffect(Moves.Ember, { type: MoveTargetType.Unit, unit: plain }, 0);
    breaker.triggerMoveEffect(Moves.Ember, { type: MoveTargetType.Unit, unit: filtered }, 0);

    expect(filtered.health).toBe(plain.health);
  });
});

describe('Rattled', () => {
  it('gains speed when hit by scary types or intimidated', () => {
    const { battle, teamA, teamB } = createBattle();
    const karp = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    karp.addAbility(Abilities.Rattled);

    // A Normal hit does not rattle
    enemy.damage({ type: EffectType.Move, move: Moves.Tackle, unit: enemy }, karp, 10, 0);
    expect(karp.stages[Stages.Speed]).toBe(0);

    // A Ghost hit does
    enemy.damage({ type: EffectType.Move, move: Moves.Lick, unit: enemy }, karp, 10, 0);
    expect(karp.stages[Stages.Speed]).toBe(1);

    // Intimidate rattles too (modern mechanics)
    karp.addStage(Stages.Attack, -1, {
      type: EffectType.Ability,
      ability: Abilities.Intimidate,
      unit: enemy,
    });
    expect(karp.stages[Stages.Speed]).toBe(2);
  });
});

describe('Imposter', () => {
  it('copies the strongest enemy on entry', () => {
    const { battle, teamA, teamB } = createBattle();
    const weak = createUnit(battle, teamB);
    const strong = createUnit(battle, teamB);
    weak.types.add(Types.Water);
    weak.setHealth(20);
    strong.types.add(Types.Fire);
    strong.addMove(Moves.Ember);

    const ditto = createUnit(battle, teamA);
    ditto.addAbility(Abilities.Imposter);
    ditto.enter();

    expect(ditto.types.has(Types.Fire)).toBe(true);
    expect(ditto.types.has(Types.Water)).toBe(false);
    expect(ditto.moves[Moves.Ember]).toBeDefined();
  });
});

describe('Adaptability', () => {
  it('raises STAB to double', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.types.add(Types.Fire);
    unit.addAbility(Abilities.Adaptability);

    const event = {
      id: 'UnitAttackResolveSTAB',
      disabled: false,
      parent: makeAttack(unit, enemy, Moves.Ember, Types.Fire, MoveCategories.Special),
      value: 0,
    };

    battle.emit(BattleEvents.UnitAttackResolveSTAB, event);

    expect(event.value).toBe(2);
  });
});

describe('Volt Absorb', () => {
  it('absorbs Electric moves as healing', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    holder.addAbility(Abilities.VoltAbsorb);
    holder.setHealth(100);

    attacker.triggerMoveTarget(Moves.ThunderShock, { type: MoveTargetType.Unit, unit: holder }, 0);

    expect(holder.health).toBe(140); // healed a quarter of 160
  });
});

describe('Quick Feet', () => {
  it('speeds up while statused', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    unit.addAbility(Abilities.QuickFeet);

    expect(unit.checkStat(Stats.Speed, 0)).toBe(105);

    unit.addStatus(Statuses.Poisoned, NONE_CAUSE);

    expect(unit.checkStat(Stats.Speed, 0)).toBeCloseTo(105 * 1.5);
  });
});

describe('Anticipation', () => {
  it('halves the damage of the move it braced for', () => {
    const { battle, teamA, teamB } = createBattle();
    const enemy = createUnit(battle, teamB);
    enemy.addMove(Moves.KarateChop); // Fighting vs Normal: super effective

    let triggers = 0;
    battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Post, (event) => {
      if (event.ability === Abilities.Anticipation) {
        triggers += 1;
      }
    });

    const eevee = createUnit(battle, teamA);
    eevee.types.add(Types.Normal);
    eevee.addAbility(Abilities.Anticipation);
    eevee.enter();

    expect(triggers).toBe(1);

    // Same blow twice, differing only in which move id carries it
    pinRandom(battle, 1);

    const braced = dealDamage(
      enemy,
      eevee,
      Moves.KarateChop,
      50,
      Types.Fighting,
      MoveCategories.Physical,
    );
    const plain = dealDamage(
      enemy,
      eevee,
      Moves.Tackle,
      50,
      Types.Fighting,
      MoveCategories.Physical,
    );

    expect(braced).toBeCloseTo(plain * 0.5);
  });
});

describe('Trace', () => {
  it('copies the strongest enemy ability and replaces itself', () => {
    const { battle, teamA, teamB } = createBattle();
    const enemy = createUnit(battle, teamB);
    enemy.addAbility(Abilities.SwiftSwim);

    const porygon = createUnit(battle, teamA);
    porygon.addAbility(Abilities.Trace);
    porygon.enter();

    expect(porygon.hasAbility(Abilities.SwiftSwim)).toBe(true);
    expect(porygon.hasAbility(Abilities.Trace)).toBe(false);
  });
});

describe('Download', () => {
  it('boosts the attack matching the softer enemy side', () => {
    const { battle, teamA, teamB } = createBattle();
    const enemy = createUnit(battle, teamB);
    enemy.setStat(StatsKind.Base, Stats.Defense, 50); // softer physical side

    const porygon = createUnit(battle, teamA);
    porygon.addAbility(Abilities.Download);
    porygon.enter();

    expect(porygon.stages[Stages.Attack]).toBe(1);
    expect(porygon.stages[Stages.SpecialAttack]).toBe(0);
  });
});

describe('Pressure', () => {
  it('halves effective PP for moves aimed at the holder', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    holder.addAbility(Abilities.Pressure);

    const target = { type: MoveTargetType.Unit, unit: holder } as const;

    expect(attacker.checkMovePP(Moves.Tackle, target)).toBe(17.5); // 35 / 2

    // The holder's own moves are unaffected
    expect(holder.checkMovePP(Moves.Tackle, { type: MoveTargetType.Unit, unit: attacker })).toBe(
      35,
    );

    // A Boss caster shrugs the pressure off
    attacker.addAbility(Abilities.Boss);
    expect(attacker.checkMovePP(Moves.Tackle, target)).toBe(35);
  });
});

describe('Immunity', () => {
  it('blocks both poison forms', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.Immunity);

    holder.addStatus(Statuses.Poisoned, NONE_CAUSE);
    holder.addStatus(Statuses.BadlyPoisoned, NONE_CAUSE);

    expect(holder.status[Statuses.Poisoned]).toBeUndefined();
    expect(holder.status[Statuses.BadlyPoisoned]).toBeUndefined();
  });
});

describe('Snow Cloak', () => {
  it('taxes incoming accuracy in hail and shields the chip', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    holder.addAbility(Abilities.SnowCloak);

    const target = { type: MoveTargetType.Unit, unit: holder } as const;

    expect(attacker.checkMoveAccuracy(Moves.Tackle, target)).toBe(100);

    battle.setWeather(Weathers.Hail);

    expect(attacker.checkMoveAccuracy(Moves.Tackle, target)).toBeCloseTo(80);

    battle.tick(1000);
    expect(holder.health).toBe(160); // no hail chip
  });
});

describe('Marvel Scale', () => {
  it('hardens defense while statused', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.MarvelScale);

    expect(holder.checkStat(Stats.Defense, 0)).toBe(105);

    holder.addStatus(Statuses.Burned, NONE_CAUSE);

    expect(holder.checkStat(Stats.Defense, 0)).toBeCloseTo(105 * 1.5);
  });
});

describe('Multiscale', () => {
  it('halves damage taken at full health only', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    holder.addAbility(Abilities.Multiscale);

    const before = holder.health;
    attacker.triggerMoveEffect(Moves.Tackle, { type: MoveTargetType.Unit, unit: holder }, 0);
    const first = before - holder.health;

    attacker.triggerMoveEffect(Moves.Tackle, { type: MoveTargetType.Unit, unit: holder }, 0);
    const second = before - first - holder.health;

    expect(second).toBeCloseTo(first * 2);
  });
});

describe('interaction fixes', () => {
  it('Quick Feet ignores the paralysis speed drop', () => {
    const { battle, teamA } = createBattle();
    const slow = createUnit(battle, teamA);
    const quick = createUnit(battle, teamA);
    quick.addAbility(Abilities.QuickFeet);

    slow.addStatus(Statuses.Paralyzed, NONE_CAUSE);
    quick.addStatus(Statuses.Paralyzed, NONE_CAUSE);

    expect(slow.checkStat(Stats.Speed, 0)).toBeCloseTo(105 * 0.5);
    expect(quick.checkStat(Stats.Speed, 0)).toBeCloseTo(105 * 1.5);
  });

  it('Keen Eye attacks ignore the target evasion stages', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const dodger = createUnit(battle, teamB);
    dodger.addStage(Stages.Evasion, 6, NONE_CAUSE);

    const parent = {
      id: 'UnitTriggerMove',
      disabled: false,
      source: attacker,
      move: Moves.Tackle,
      target: { type: MoveTargetType.Unit, unit: dodger },
      steps: 0,
    } as const;

    const resolve = (): number | undefined => {
      const event = {
        id: 'UnitTriggerMoveResolveAccuracy',
        disabled: false,
        parent,
        accuracy: undefined as number | undefined,
      };
      battle.emit(BattleEvents.UnitTriggerMoveResolveAccuracy, event);
      return event.accuracy;
    };

    expect(resolve()).toBeCloseTo(100 / 3);

    attacker.addAbility(Abilities.KeenEye);

    expect(resolve()).toBeCloseTo(100);
  });

  it('Overcoat blocks Effect Spore procs', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0); // the spore would always proc
    const holder = createUnit(battle, teamA);
    const cloaked = createUnit(battle, teamB);
    holder.addAbility(Abilities.EffectSpore);
    cloaked.addAbility(Abilities.Overcoat);

    cloaked.damage({ type: EffectType.Move, move: Moves.Tackle, unit: cloaked }, holder, 10, 0);

    expect(cloaked.status[Statuses.Poisoned]).toBeUndefined();
  });

  it('Mold Breaker attacks still trigger contact punishers', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0); // Static would always proc
    const breaker = createUnit(battle, teamA);
    const staticHolder = createUnit(battle, teamB);
    breaker.addAbility(Abilities.MoldBreaker);
    staticHolder.addAbility(Abilities.Static);

    breaker.triggerMoveTarget(Moves.Tackle, { type: MoveTargetType.Unit, unit: staticHolder }, 0);

    expect(staticHolder.health).toBeLessThan(160);
    expect(breaker.status[Statuses.Paralyzed]).toBeDefined();
  });

  it('Lightning Rod draws single-target Electric moves to the holder', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const plain = createUnit(battle, teamB);
    const rod = createUnit(battle, teamB);
    rod.addAbility(Abilities.LightningRod);

    attacker.triggerMoveTarget(Moves.ThunderShock, { type: MoveTargetType.Unit, unit: plain }, 0);

    expect(plain.health).toBe(160); // redirected away
    expect(rod.health).toBe(160); // absorbed
    expect(rod.stages[Stages.SpecialAttack]).toBe(1);
  });

  it('gaining a status-immunity ability cures the status', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    unit.addStatus(Statuses.Paralyzed, NONE_CAUSE);

    unit.addAbility(Abilities.Limber);

    expect(unit.status[Statuses.Paralyzed]).toBeUndefined();
  });

  it('lifting Neutralizing Gas re-triggers entry abilities', () => {
    const { battle, teamA, teamB } = createBattle();
    const victim = createUnit(battle, teamA);
    const gas = createUnit(battle, teamA);
    gas.addAbility(Abilities.NeutralizingGas);
    gas.enter();

    const intimidator = createUnit(battle, teamB);
    intimidator.addAbility(Abilities.Intimidate);
    intimidator.enter(); // suppressed: no drop

    expect(victim.stages[Stages.Attack]).toBe(0);

    gas.leave();

    expect(victim.stages[Stages.Attack]).toBe(-1);
  });

  it('lifting Neutralizing Gas does not replay genuine entry side-effects', () => {
    const { battle, teamA, teamB } = createBattle();
    const gas = createUnit(battle, teamA);
    gas.addAbility(Abilities.NeutralizingGas);
    gas.enter();

    const target = createUnit(battle, teamB);

    // Stand-in for one-time entry side-effects (entry hazards,
    // first-entry dormancy): they only honor genuine entries
    let genuineEntries = 0;
    battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
      if (event.source === target && !event.reactivation) {
        genuineEntries += 1;
      }
    });

    target.enter();
    expect(genuineEntries).toBe(1);

    // The gas lifting re-activates abilities without counting as an
    // entry
    gas.leave();
    expect(genuineEntries).toBe(1);
  });
});

describe('Gale Wings', () => {
  it('winds up Flying moves a bracket faster while at full health', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.GaleWings);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMovePriority(Moves.WingAttack, target)).toBe(1);
    expect(holder.checkMovePriority(Moves.Tackle, target)).toBe(0);

    // A scratch is enough to ground it
    holder.setHealth(holder.health - 1);

    expect(holder.checkMovePriority(Moves.WingAttack, target)).toBe(0);
  });
});

describe('Rough Skin', () => {
  it('costs the attacker an eighth of its health on contact', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    holder.addAbility(Abilities.RoughSkin);

    attacker.damage({ type: EffectType.Move, move: Moves.Tackle, unit: attacker }, holder, 10, 0);

    // an eighth of 160 max HP
    expect(attacker.health).toBe(140);
  });

  it('leaves a move that never touched it alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    holder.addAbility(Abilities.RoughSkin);

    attacker.damage({ type: EffectType.Move, move: Moves.Ember, unit: attacker }, holder, 10, 0);

    expect(attacker.health).toBe(160);
  });
});

describe('Solid Rock', () => {
  it('softens super-effective hits by a quarter', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    const plain = createUnit(battle, teamB);
    holder.types.add(Types.Grass);
    plain.types.add(Types.Grass);
    holder.addAbility(Abilities.SolidRock);

    attacker.triggerMoveEffect(Moves.Ember, { type: MoveTargetType.Unit, unit: plain }, 0);
    attacker.triggerMoveEffect(Moves.Ember, { type: MoveTargetType.Unit, unit: holder }, 0);

    const plainDamage = 160 - plain.health;
    const softenedDamage = 160 - holder.health;

    expect(plainDamage).toBeGreaterThan(0);
    expect(softenedDamage).toBeCloseTo(plainDamage * 0.75);
  });
});

describe('Slush Rush', () => {
  it('doubles Speed in hail only', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.SlushRush);

    const plain = holder.checkStat(Stats.Speed, 0);

    teamA.weather.current = Weathers.Hail;

    expect(holder.checkStat(Stats.Speed, 0)).toBe(plain * 2);

    teamA.weather.current = Weathers.Sandstorm;

    expect(holder.checkStat(Stats.Speed, 0)).toBe(plain);
  });
});

describe('Cursed Body', () => {
  it('shuts off the move that hit it', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    attacker.addMove(Moves.Tackle);
    holder.addAbility(Abilities.CursedBody);

    // The lock reads what the attacker is committed to
    attacker.cast(Moves.Tackle, { type: MoveTargetType.Unit, unit: holder });
    attacker.damage({ type: EffectType.Move, move: Moves.Tackle, unit: attacker }, holder, 10, 0);
    // The lock is Disable's, cast like any other move, so it lands a
    // delay later
    battle.tick(MOVE_DELAY);

    expect(attacker.moves[Moves.Tackle]?.disabled).toBe(true);
  });

  it('leaves the move alone when the roll misses', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    attacker.addMove(Moves.Tackle);
    holder.addAbility(Abilities.CursedBody);

    attacker.cast(Moves.Tackle, { type: MoveTargetType.Unit, unit: holder });
    attacker.damage({ type: EffectType.Move, move: Moves.Tackle, unit: attacker }, holder, 10, 0);
    battle.tick(MOVE_DELAY);

    expect(attacker.moves[Moves.Tackle]?.disabled).toBe(false);
  });
});

describe('Bad Dreams', () => {
  it('bites sleeping enemies each time the holder acts', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const asleep = createUnit(battle, teamB);
    const awake = createUnit(battle, teamB);
    const ally = createUnit(battle, teamA);
    holder.addAbility(Abilities.BadDreams);

    asleep.addStatus(Statuses.Sleeping, NONE_CAUSE);
    ally.addStatus(Statuses.Sleeping, NONE_CAUSE);

    battle.emit(BattleEvents.UnitCast, {
      id: 'UnitCast',
      disabled: false,
      source: holder,
      move: Moves.Tackle,
      target: { type: MoveTargetType.None },
    });

    // an eighth of 160 max HP, and only from the enemy asleep
    expect(asleep.health).toBe(140);
    expect(awake.health).toBe(160);
    expect(ally.health).toBe(160);
  });
});

describe('Sharpness', () => {
  it('boosts slicing move power only', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Sharpness);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMovePower(Moves.Slash, target)).toBeCloseTo(70 * 1.5);
    expect(holder.checkMovePower(Moves.Tackle, target)).toBe(40);
  });
});

describe('Strong Jaw', () => {
  it('boosts biting move power only', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.StrongJaw);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMovePower(Moves.Bite, target)).toBeCloseTo(60 * 1.5);
    expect(holder.checkMovePower(Moves.Tackle, target)).toBe(40);
  });
});

describe('Snow Warning', () => {
  it('calls up hail as the holder enters', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);

    holder.addAbility(Abilities.SnowWarning);
    battle.tick(MOVE_DELAY);

    expect(battle.weather.current).toBe(Weathers.Hail);
  });
});

describe('Drizzle', () => {
  it('calls up rain as the holder enters', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);

    holder.addAbility(Abilities.Drizzle);
    battle.tick(MOVE_DELAY);

    expect(battle.weather.current).toBe(Weathers.Rain);
  });
});

describe('Protean', () => {
  it('takes the type of the move it is about to use', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA, [Types.Normal]);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Protean);

    holder.triggerMove(Moves.Ember, { type: MoveTargetType.Unit, unit: enemy }, 0);

    expect([...holder.types]).toEqual([Types.Fire]);
  });

  it('leaves a type it is already wearing alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA, [Types.Fire]);
    const enemy = createUnit(battle, teamB);
    let triggered = 0;

    holder.addAbility(Abilities.Protean);
    battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Post, (event) => {
      if (event.ability === Abilities.Protean) {
        triggered += 1;
      }
    });

    holder.triggerMove(Moves.Ember, { type: MoveTargetType.Unit, unit: enemy }, 0);

    expect([...holder.types]).toEqual([Types.Fire]);
    expect(triggered).toBe(0);
  });
});
