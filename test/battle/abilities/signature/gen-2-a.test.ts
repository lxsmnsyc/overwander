// Chikorita through Shuckle.

import { describe, expect, it } from 'vitest';
import {
  MARK_DEEP_FRACTION,
  MARK_FRACTION,
} from '../../../../src/battle/abilities/signature/__create';
import {
  BACKLASH_SHARE,
  SHARED_MISERY_THRESHOLD,
  SUNLIT_CHARGE_SCALE,
} from '../../../../src/battle/abilities/signature/chikorita-to-celebi';
import { AttackPriority } from '../../../../src/core/event-emitter';
import type Battle from '../../../../src/battle/core';
import { BattleEvents, EffectType, MoveTargetType } from '../../../../src/battle/events';
import type Unit from '../../../../src/battle/unit';
import { Stages, Stats, StatsKind } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Items } from '../../../../src/data/ids/items';
import { MoveCategories, MoveTargets, Moves, StatFlags } from '../../../../src/data/ids/moves';
import { Statuses, TeamStatuses } from '../../../../src/data/ids/status';
import turns from '../../../../src/battle/turn';
import { layersUnder } from '../../../../src/battle/moves/spikes';
import { unitTarget } from '../../../../src/battle/utils';
import { SWITCHING_SPAN } from '../../../../src/battle/status/switching';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, act, makeAttack, resolveAttackStat, rollMove, rolled } from './helpers';

describe('the Johto starters', () => {
  it('marks what Sapmark lands on, and drinks the same', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Sapmark);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);

    // Nothing is marked until something lands
    act(battle, enemy);

    expect(enemy.health).toBe(enemy.checkStat(Stats.HP, 0));

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    const before = enemy.health;
    holder.setHealth(maxHP / 2);

    act(battle, enemy);

    const share = enemy.checkStat(Stats.HP, 0) * MARK_FRACTION;

    expect(enemy.health).toBeCloseTo(before - share, 5);
    expect(holder.health).toBeCloseTo(maxHP / 2 + share, 5);
  });

  it('bites deeper with Embermark once the target is burning', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Embermark);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    const maxHP = enemy.checkStat(Stats.HP, 0);
    let before = enemy.health;

    act(battle, enemy);

    expect(enemy.health).toBeCloseTo(before - maxHP * MARK_FRACTION, 5);

    enemy.addStatus(Statuses.Burned, NONE_CAUSE);
    before = enemy.health;

    act(battle, enemy);

    // The burn's own residual rides on top, so only the floor is checked
    expect(enemy.health).toBeLessThanOrEqual(before - maxHP * MARK_DEEP_FRACTION);
  });

  it('holds one thing at a time with Jawmark', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const first = createUnit(battle, teamB);
    const second = createUnit(battle, teamB);
    holder.addAbility(Abilities.Jawmark);

    holder.attack(first, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);
    holder.attack(second, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    const firstHealth = first.health;
    const secondBefore = second.health;

    act(battle, first);
    act(battle, second);

    // The jaw let the first one go when it took the second
    expect(first.health).toBe(firstHealth);
    expect(second.health).toBeCloseTo(
      secondBefore - second.checkStat(Stats.HP, 0) * MARK_DEEP_FRACTION,
      5,
    );
  });
});

describe('Sentry', () => {
  it('refuses a critical hit anywhere on its side', () => {
    const { battle, teamA, teamB } = createBattle();
    const lookout = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    lookout.addAbility(Abilities.Sentry);

    function rollCritical(target: Unit): boolean {
      const event = {
        id: 'UnitAttackResolveCriticalHit',
        disabled: false,
        parent: makeAttack(enemy, target, Moves.Pound, Types.Normal, MoveCategories.Physical),
        critical: true,
      };
      battle.emit(BattleEvents.UnitAttackResolveCriticalHit, event);
      return event.critical;
    }

    expect(rollCritical(ally)).toBe(false);
    expect(rollCritical(lookout)).toBe(false);

    // The far side still crits as usual
    expect(rollCritical(enemy)).toBe(true);
  });
});

describe('Watchful Roost', () => {
  it('puts Reflect up over its side as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    createUnit(battle, teamB);
    holder.addAbility(Abilities.WatchfulRoost);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });
    // The cast move takes its own flight time to arrive
    battle.tick(turns(1));

    expect(teamA.status[TeamStatuses.Reflect]).not.toBeUndefined();
    expect(teamB.status[TeamStatuses.Reflect]).toBeUndefined();
  });
});

describe('Relay', () => {
  it('hands its stat stages to the teammate coming in', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const replacement = createUnit(battle, teamA);
    createUnit(battle, teamB);
    holder.addAbility(Abilities.Relay);

    holder.addStage(Stages.Attack, 2, NONE_CAUSE);
    holder.addStage(Stages.Speed, -1, NONE_CAUSE);

    holder.forceSwitch(replacement);
    battle.tick(SWITCHING_SPAN);

    expect(replacement.stages[Stages.Attack]).toBe(2);
    expect(replacement.stages[Stages.Speed]).toBe(-1);

    // What left the field still leaves it empty-handed
    expect(holder.stages[Stages.Attack]).toBe(0);
  });

  it('passes nothing when it had nothing built up', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const replacement = createUnit(battle, teamA);
    createUnit(battle, teamB);
    holder.addAbility(Abilities.Relay);

    holder.forceSwitch(replacement);
    battle.tick(SWITCHING_SPAN);

    expect(replacement.stages[Stages.Attack]).toBe(0);
  });
});

describe('Silk Snare', () => {
  it('casts String Shot over the whole enemy side as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const first = createUnit(battle, teamB);
    const second = createUnit(battle, teamB);
    holder.addAbility(Abilities.SilkSnare);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });
    battle.tick(turns(1));

    expect(first.stages[Stages.Speed]).toBeLessThan(0);
    expect(second.stages[Stages.Speed]).toBeLessThan(0);
    expect(holder.stages[Stages.Speed]).toBe(0);
  });
});

describe('Lantern Lure', () => {
  it('casts Confuse Ray at an enemy as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.LanternLure);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });
    battle.tick(turns(1));

    expect(enemy.status[Statuses.Confused]).not.toBeUndefined();
  });
});

describe('Fair Share', () => {
  it('caps a run of luck on the same ally', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.FairShare);

    // Hypnosis is 60 accuracy; a pinned roll of 0 always lands it
    pinRandom(battle, 0);

    rollMove(battle, enemy, ally, Moves.Hypnosis, false);

    const second = {
      id: 'UnitTriggerMoveRollHit',
      disabled: false,
      parent: {
        id: 'UnitTriggerMove',
        disabled: false,
        source: enemy,
        move: Moves.Hypnosis,
        target: unitTarget(ally),
        steps: 0,
      },
      hit: false,
    };
    battle.emit(BattleEvents.UnitTriggerMoveRollHit, second);

    // The second chancy move running cannot land on the same ally
    expect(second.hit).toBe(false);

    const third = {
      id: 'UnitTriggerMoveRollHit',
      disabled: false,
      parent: {
        id: 'UnitTriggerMove',
        disabled: false,
        source: enemy,
        move: Moves.Hypnosis,
        target: unitTarget(ally),
        steps: 0,
      },
      hit: false,
    };
    battle.emit(BattleEvents.UnitTriggerMoveRollHit, third);

    expect(third.hit).toBe(true);
  });

  it('says nothing about a move that never misses', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.FairShare);
    pinRandom(battle, 0);

    for (let blows = 0; blows < 3; blows += 1) {
      expect(rolled(battle, enemy, ally, Moves.Pound)).toBe(true);
    }
  });
});

describe('Prophecy', () => {
  it('casts Future Sight at an enemy as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Prophecy);

    let cast: Moves | undefined;
    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
      if (event.source === holder) {
        cast = event.move;
      }
    });

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });

    expect(cast).toBe(Moves.FutureSight);

    // The promise is kept two turns after the cast has flown
    battle.tick(turns(4));

    expect(enemy.health).toBeLessThan(enemy.checkStat(Stats.HP, 0));
  });
});

describe('Live Wire', () => {
  it('casts Thunder Wave at an enemy as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.LiveWire);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });
    // The cast move takes its own flight time to arrive
    battle.tick(turns(1));

    expect(enemy.status[Statuses.Paralyzed]).not.toBeUndefined();
  });
});

describe('Spillover', () => {
  it('throws what will not fit at an enemy', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Spillover);

    const maxHP = holder.checkStat(Stats.HP, 0);
    const enemyHP = enemy.health;
    holder.setHealth(maxHP - 10);

    holder.heal(NONE_CAUSE, holder, 40, 0);

    expect(holder.health).toBe(maxHP);
    expect(enemy.health).toBe(enemyHP - 30);
  });

  it('spills nothing while there is room for the heal', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Spillover);

    const maxHP = holder.checkStat(Stats.HP, 0);
    const enemyHP = enemy.health;
    holder.setHealth(maxHP / 2);

    holder.heal(NONE_CAUSE, holder, 40, 0);

    expect(enemy.health).toBe(enemyHP);
  });
});

describe('False Wood', () => {
  function effectiveness(battle: Battle, attacker: Unit, target: Unit, type: Types): number {
    const event = {
      id: 'UnitAttackResolveEffectiveness',
      disabled: false,
      parent: makeAttack(attacker, target, Moves.WaterGun, type, MoveCategories.Special),
      defendingType: Types.Rock,
      multiplier: 1,
    };
    battle.emit(BattleEvents.UnitAttackResolveEffectiveness, event);
    return event.multiplier;
  }

  it('answers a blow as a tree rather than a rock', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA, [Types.Rock]);
    const enemy = createUnit(battle, teamB);

    // Water is twice as bad against rock and half as bad against grass
    expect(effectiveness(battle, enemy, holder, Types.Water)).toBeCloseTo(2, 5);

    holder.addAbility(Abilities.FalseWood);

    expect(effectiveness(battle, enemy, holder, Types.Water)).toBeCloseTo(0.5, 5);
  });

  it('drops the act on the first hit that lands', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA, [Types.Rock]);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.FalseWood);

    enemy.damage(NONE_CAUSE, holder, 10, 0);

    expect(effectiveness(battle, enemy, holder, Types.Water)).toBeCloseTo(2, 5);

    // Taking the field again puts the disguise back up
    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });

    expect(effectiveness(battle, enemy, holder, Types.Water)).toBeCloseTo(0.5, 5);
  });
});

describe('Updraft', () => {
  it('gets away from whatever is holding it', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    createUnit(battle, teamB);

    holder.addStatus(Statuses.Trapped, NONE_CAUSE);

    expect(holder.checkEscape()).toBe(false);

    holder.addAbility(Abilities.Updraft);

    expect(holder.checkEscape()).toBe(true);
  });

  it('keeps its Speed where it is', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Updraft);

    const cause = { type: EffectType.Ability, ability: Abilities.Updraft, unit: enemy } as const;

    holder.addStage(Stages.Speed, -2, cause);

    expect(holder.stages[Stages.Speed]).toBe(0);

    // Everything else still slips through, and a raise is welcome
    holder.addStage(Stages.Attack, -2, cause);
    holder.addStage(Stages.Speed, 1, cause);

    expect(holder.stages[Stages.Attack]).toBe(-2);
    expect(holder.stages[Stages.Speed]).toBe(1);
  });
});

describe('Tailthrow', () => {
  it('casts Fling at an enemy as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Tailthrow);
    holder.addItem(Items.OranBerry);

    let cast: Moves | undefined;
    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
      if (event.source === holder) {
        cast = event.move;
      }
    });

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });

    expect(cast).toBe(Moves.Fling);

    // The cast move takes its own flight time to arrive
    battle.tick(turns(1));

    expect(enemy.health).toBeLessThan(enemy.checkStat(Stats.HP, 0));
  });
});

describe('Sunlit Charge', () => {
  it('makes what it holds down land harder', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    const bare = holder.checkMovePower(Moves.SolarBeam, target);

    holder.addAbility(Abilities.SunlitCharge);

    expect(holder.checkMovePower(Moves.SolarBeam, target)).toBeCloseTo(
      (bare ?? 0) * SUNLIT_CHARGE_SCALE,
      5,
    );

    // A move let go at once gains nothing
    expect(holder.checkMovePower(Moves.Pound, target)).toBe(40);
  });

  it('holds the channel through an interrupt', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SunlitCharge);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    holder.channel(Moves.SolarBeam, target, 0);
    plain.channel(Moves.SolarBeam, target, 0);

    expect(holder.channeling).not.toBeUndefined();

    holder.interrupt();
    plain.interrupt();

    expect(holder.channeling).not.toBeUndefined();
    expect(plain.channeling).toBeUndefined();
  });
});

describe('Resonance', () => {
  it('carries a sound move across the whole enemy side', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Resonance);

    // Uproar is sound; Pound is not
    expect(holder.checkMoveTargeting(Moves.Uproar).target).toBe(MoveTargets.None);
    expect(holder.checkMoveTargeting(Moves.Pound).target).toBe(MoveTargets.Unit);

    // Everybody else still aims a sound at one target
    expect(enemy.checkMoveTargeting(Moves.Uproar).target).toBe(MoveTargets.Unit);
  });
});

describe('Contagious Yawn', () => {
  it('casts Yawn at an enemy as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.ContagiousYawn);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });
    // The cast move takes its own flight time to arrive
    battle.tick(turns(1));

    expect(enemy.status[Statuses.Drowsy]).not.toBeUndefined();
  });
});

describe('Magpie', () => {
  it('pockets whatever is taken off somebody else', () => {
    const { battle, teamA, teamB } = createBattle();
    const crow = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    crow.addAbility(Abilities.Magpie);
    enemy.addItem(Items.OranBerry);

    enemy.removeItem(Items.OranBerry, {
      type: EffectType.Ability,
      ability: Abilities.Magpie,
      unit: crow,
    });

    expect(enemy.items[Items.OranBerry]).toBeUndefined();
    expect(crow.items[Items.OranBerry]).not.toBeUndefined();
  });

  it('leaves a berry its owner ate alone, and never robs itself', () => {
    const { battle, teamA, teamB } = createBattle();
    const crow = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    crow.addAbility(Abilities.Magpie);
    enemy.addItem(Items.OranBerry);

    // Eaten rather than knocked loose: the cause names the holder
    enemy.removeItem(Items.OranBerry, {
      type: EffectType.Item,
      item: Items.OranBerry,
      unit: enemy,
    });

    expect(crow.items[Items.OranBerry]).toBeUndefined();

    crow.addItem(Items.SitrusBerry);
    crow.removeItem(Items.SitrusBerry, {
      type: EffectType.Ability,
      ability: Abilities.Magpie,
      unit: enemy,
    });

    expect(crow.items[Items.SitrusBerry]).toBeUndefined();
  });
});

describe('Shared Misery', () => {
  it('casts Pain Split at the healthiest enemy once it is nearly done', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamB);
    const healthy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SharedMisery);

    const maxHP = holder.checkStat(Stats.HP, 0);
    hurt.setHealth(maxHP / 4);

    let cast: { move: Moves; at: Unit } | undefined;
    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
      if (event.source === holder && event.target.type === MoveTargetType.Unit) {
        cast = { move: event.move, at: event.target.unit };
      }
    });

    // Still standing: nothing to share yet
    healthy.damage(NONE_CAUSE, holder, maxHP * 0.5, 0);

    expect(cast).toBeUndefined();

    healthy.damage(NONE_CAUSE, holder, maxHP * SHARED_MISERY_THRESHOLD, 0);

    expect(cast?.move).toBe(Moves.PainSplit);
    expect(cast?.at).toBe(healthy);

    // Once per turn on the field, not once per hit
    cast = undefined;
    healthy.damage(NONE_CAUSE, holder, 1, 0);

    expect(cast).toBeUndefined();
  });
});

describe('Ruinous Script', () => {
  it("shuts the far side's items down while it stands", () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const ally = createUnit(battle, teamA);
    enemy.addItem(Items.OranBerry);
    ally.addItem(Items.SitrusBerry);

    expect(enemy.hasItem(Items.OranBerry)).toBe(true);

    holder.addAbility(Abilities.RuinousScript);

    expect(enemy.hasItem(Items.OranBerry)).toBe(false);
    // Its own side reads as usual
    expect(ally.hasItem(Items.SitrusBerry)).toBe(true);

    holder.faint(enemy);

    expect(enemy.hasItem(Items.OranBerry)).toBe(true);
  });
});

describe('Backlash', () => {
  it('gives back a share of what was put into it as it moves', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Backlash);

    const enemyHP = enemy.health;
    // A blow with somebody behind it: there is nobody to pay a
    // causeless hit back to
    const blow = { type: EffectType.Move, move: Moves.Pound, unit: enemy } as const;

    enemy.damage(blow, holder, 40, 0);
    enemy.damage(blow, holder, 20, 0);

    // Nothing is paid until it acts
    expect(enemy.health).toBe(enemyHP);

    act(battle, holder);

    expect(enemy.health).toBeCloseTo(enemyHP - 60 * BACKLASH_SHARE, 5);

    // The bank is spent, not kept
    act(battle, holder);

    expect(enemy.health).toBeCloseTo(enemyHP - 60 * BACKLASH_SHARE, 5);
  });
});

describe('Ambidextrous', () => {
  it('swings with the better of its two attacking stats', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Ambidextrous);

    holder.setStat(StatsKind.Base, Stats.Attack, 20);
    holder.setStat(StatsKind.Base, Stats.SpecialAttack, 200);

    const physical = makeAttack(holder, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const special = holder.resolveStat(Stats.SpecialAttack, StatFlags.Attack);

    expect(resolveAttackStat(battle, physical, holder, Stats.Attack, 30)).toBeCloseTo(special, 5);

    // The defending end is untouched
    const incoming = makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, incoming, holder, Stats.Defense, 50)).toBe(50);
  });
});

describe('Shrapnel', () => {
  it('lays both hazard layers on the enemy side as it goes down', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Shrapnel);

    holder.faint(enemy);
    // The cast moves take their own flight time to arrive
    battle.tick(turns(1));

    expect(layersUnder(teamB)).toBe(1);
    expect(teamB.status[TeamStatuses.ToxicSpikes]).not.toBeUndefined();
    expect(layersUnder(teamA)).toBe(0);
  });
});
