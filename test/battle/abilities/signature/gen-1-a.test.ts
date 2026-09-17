// Bulbasaur through Shellder.

import { describe, expect, it } from 'vitest';
import {
  FIELD_LOWERED_SCALE,
  FIELD_RAISED_SCALE,
  REGAL_COURT_MAX_ENEMIES,
  REGAL_COURT_STEP,
} from '../../../../src/battle/abilities/signature/__create';
import { AttackPriority } from '../../../../src/core/event-emitter';
import {
  CHAIN_LIGHTNING_FRACTION,
  NIBBLE_FRACTION,
  RELENTLESS_MAX_STACKS,
  RELENTLESS_STEP,
  SLIPSTREAM_SCALE,
  SQUEEZE_FRACTION,
  SQUEEZE_INTERVAL,
  TWIN_STINGER_POWER_SCALE,
} from '../../../../src/battle/abilities/signature/bulbasaur-to-pikachu';
import {
  DELAYED_REACTION_DELAY,
  DELAYED_REACTION_SHARE,
  GALLOP_MAX_STACKS,
  GALLOP_STEP,
  LEEK_DUELIST_CRITICAL_SCALE,
  LEEK_DUELIST_CRITICAL_STAGES,
  LEEK_DUELIST_EXPOSED_SCALE,
  REPULSION_FIELD_SCALE,
  SECOND_HEAD_INTERVAL,
  SECOND_HEAD_POWER_SCALE,
  SLEEK_HIDE_CONTACT_SCALE,
  SLEEK_HIDE_RANGED_SCALE,
  SOLID_CORE_PHYSICAL_SCALE,
  SOLID_CORE_SPECIAL_SCALE,
  SPIKE_SHELL_CONTACT_SCALE,
  SPIKE_SHELL_FRACTION,
} from '../../../../src/battle/abilities/signature/geodude-to-drowzee';
import {
  BLIND_RAGE_ACCURACY_SCALE,
  BLIND_RAGE_ATTACK_SCALE,
  CHASE_DOWN_SCALE,
  CHASE_DOWN_THRESHOLD,
  DIGEST_HEAL_FRACTION,
  DIGEST_THRESHOLD,
  DUST_STORM_MAX_STACKS,
  DUST_STORM_STEP,
  FUNGAL_BLOOM_FRACTION,
  HEADACHE_BURST_SCALE,
  HYPNOTIC_SPIRAL_CAST_SCALE,
  OVERHEAD_THROW_HEAVY_SCALE,
  OVERHEAD_THROW_LIGHT_SCALE,
  TELEPORT_GUARD_WINDOW,
  UNDERMINE_MAX_STACKS,
  UNDERMINE_STEP,
} from '../../../../src/battle/abilities/signature/paras-to-tentacool';
import {
  BLOODTHIRST_DRAIN_SCALE,
  BLOODTHIRST_HEAL_SCALE,
  LULLABY_POWER_SCALE,
  LULLABY_SLEEP_SCALE,
  NINE_TAILS_MAX_STACKS,
  NINE_TAILS_STEP,
} from '../../../../src/battle/abilities/signature/sandshrew-to-oddish';
import type Battle from '../../../../src/battle/core';
import { BattleEvents, EffectType, MoveTargetType } from '../../../../src/battle/events';
import type Unit from '../../../../src/battle/unit';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Items } from '../../../../src/data/ids/items';
import { MoveCategories, MoveTargets, Moves } from '../../../../src/data/ids/moves';
import { Statuses } from '../../../../src/data/ids/status';
import turns from '../../../../src/battle/turn';
import { unitTarget } from '../../../../src/battle/utils';
import { createBattle, createUnit, pinRandom } from '../../harness';
import {
  NONE_CAUSE,
  act,
  dealDamage,
  makeAttack,
  resolveAttackStat,
  rollMove,
  rolled,
} from './helpers';

describe('the Kanto starters', () => {
  const FIELDS = [
    {
      name: 'Verdant Field',
      ability: Abilities.VerdantField,
      raised: Types.Grass,
      lowered: Types.Water,
    },
    {
      name: 'Ember Field',
      ability: Abilities.EmberField,
      raised: Types.Fire,
      lowered: Types.Grass,
    },
    {
      name: 'Deluge Field',
      ability: Abilities.DelugeField,
      raised: Types.Water,
      lowered: Types.Fire,
    },
  ];

  function resolve(battle: Battle, attacker: Unit, target: Unit, type: Types): number {
    const event = {
      id: 'UnitAttackResolveDamage',
      disabled: false,
      parent: makeAttack(attacker, target, Moves.Pound, type, MoveCategories.Special),
      value: 0,
    };
    battle.emit(BattleEvents.UnitAttackResolveDamage, event);
    return event.value;
  }

  for (const { name, ability, raised, lowered } of FIELDS) {
    it(`tilts the field both ways for ${name}`, () => {
      const { battle, teamA, teamB } = createBattle();
      // The damage roll is pinned, so the blows differ only by the tilt
      pinRandom(battle, 0);
      const holder = createUnit(battle, teamA);
      const enemy = createUnit(battle, teamB);

      const bareRaised = resolve(battle, enemy, holder, raised);
      const bareLowered = resolve(battle, enemy, holder, lowered);

      holder.addAbility(ability);

      // Both sides stand in it: this is the enemy throwing them
      expect(resolve(battle, enemy, holder, raised)).toBeCloseTo(
        bareRaised * FIELD_RAISED_SCALE,
        5,
      );
      expect(resolve(battle, enemy, holder, lowered)).toBeCloseTo(
        bareLowered * FIELD_LOWERED_SCALE,
        5,
      );
      // Anything else is thrown as usual
      expect(resolve(battle, enemy, holder, Types.Normal)).toBeCloseTo(
        resolve(battle, holder, enemy, Types.Normal),
        5,
      );
    });
  }
});

describe('Slipstream', () => {
  it('shortens what its own side winds up and leaves the enemy alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    const target = unitTarget(enemy);
    const bare = ally.checkMoveCastTime(Moves.Flamethrower, target);
    const theirs = enemy.checkMoveCastTime(Moves.Flamethrower, unitTarget(ally));

    holder.addAbility(Abilities.Slipstream);

    expect(ally.checkMoveCastTime(Moves.Flamethrower, target)).toBeCloseTo(
      bare * SLIPSTREAM_SCALE,
      5,
    );
    expect(enemy.checkMoveCastTime(Moves.Flamethrower, unitTarget(ally))).toBeCloseTo(theirs, 5);
  });
});

describe('Nibble', () => {
  it('takes a bite on top of every move that lands', () => {
    const plain = createBattle();
    pinRandom(plain.battle, 1);
    const plainHolder = createUnit(plain.battle, plain.teamA);
    const plainEnemy = createUnit(plain.battle, plain.teamB);
    const bare = dealDamage(
      plainHolder,
      plainEnemy,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Nibble);

    const bitten = dealDamage(
      holder,
      enemy,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    expect(bitten - bare).toBeCloseTo(enemy.checkStat(Stats.HP, 0) * NIBBLE_FRACTION, 5);
  });
});

describe('Powder Burst', () => {
  it('widens a status move it aims at one enemy over the whole far side', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    createUnit(battle, teamB);
    holder.addAbility(Abilities.PowderBurst);

    // A status move aimed at one enemy is recast at nobody, which is
    // what fans it out over the enemy side
    expect(holder.checkMoveTargeting(Moves.SleepPowder).target).toBe(MoveTargets.None);

    // An attacking move still picks its one target
    expect(holder.checkMoveTargeting(Moves.Tackle).target).toBe(MoveTargets.Unit);
  });
});

describe('Twin Stinger', () => {
  it('lands a physical move twice at reduced power', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.TwinStinger);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMovePower(Moves.Tackle, target)).toBeCloseTo(
      40 * TWIN_STINGER_POWER_SCALE,
      5,
    );

    let landed = 0;
    battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
      if (event.source === holder && event.success) {
        landed += 1;
      }
    });

    holder.attack(enemy, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(landed).toBe(2);
  });

  it('leaves special moves and moves that already strike several times alone', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.TwinStinger);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMovePower(Moves.Ember, target)).toBe(40);
    expect(holder.checkMovePower(Moves.DoubleSlap, target)).toBe(15);

    let landed = 0;
    battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
      if (event.source === holder && event.success) {
        landed += 1;
      }
    });

    holder.attack(enemy, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(landed).toBe(1);
  });
});

describe('Relentless', () => {
  it('presses one target harder each time it lands, and starts over on another', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const first = createUnit(battle, teamB);
    const second = createUnit(battle, teamB);
    holder.addAbility(Abilities.Relentless);

    const atFirst = { type: MoveTargetType.Unit, unit: first } as const;
    const atSecond = { type: MoveTargetType.Unit, unit: second } as const;

    expect(holder.checkMovePower(Moves.Tackle, atFirst)).toBe(40);

    for (let landed = 1; landed <= RELENTLESS_MAX_STACKS + 1; landed += 1) {
      holder.attack(first, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
      first.setHealth(first.checkStat(Stats.HP, 0));

      expect(holder.checkMovePower(Moves.Tackle, atFirst)).toBeCloseTo(
        40 * (1 + RELENTLESS_STEP * Math.min(RELENTLESS_MAX_STACKS, landed)),
        5,
      );

      // Nothing carries over to anybody else
      expect(holder.checkMovePower(Moves.Tackle, atSecond)).toBe(40);
    }

    holder.attack(second, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(holder.checkMovePower(Moves.Tackle, atFirst)).toBe(40);
  });
});

describe('Squeeze', () => {
  it('tightens on the last thing it touched while it is winding up', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Squeeze);

    const maxHP = enemy.checkStat(Stats.HP, 0);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    const caught = enemy.health;

    // Nothing while it stands idle
    battle.tick(SQUEEZE_INTERVAL);

    expect(enemy.health).toBe(caught);

    battle.emit(BattleEvents.UnitCast, {
      id: 'UnitCast',
      disabled: false,
      source: holder,
      move: Moves.SolarBeam,
      target: { type: MoveTargetType.Unit, unit: enemy },
    });

    battle.tick(SQUEEZE_INTERVAL);

    expect(caught - enemy.health).toBeCloseTo(maxHP * SQUEEZE_FRACTION, 5);
  });

  it('needs contact to get hold of anything', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Squeeze);

    holder.attack(enemy, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    const before = enemy.health;

    battle.emit(BattleEvents.UnitCast, {
      id: 'UnitCast',
      disabled: false,
      source: holder,
      move: Moves.SolarBeam,
      target: { type: MoveTargetType.Unit, unit: enemy },
    });
    battle.tick(SQUEEZE_INTERVAL);

    expect(enemy.health).toBe(before);
  });
});

describe('Chain Lightning', () => {
  it('arcs a third of the blow to the next enemy along', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const struck = createUnit(battle, teamB);
    const next = createUnit(battle, teamB);
    holder.addAbility(Abilities.ChainLightning);

    const before = next.health;
    const dealt = dealDamage(
      holder,
      struck,
      Moves.ThunderShock,
      40,
      Types.Electric,
      MoveCategories.Special,
    );

    expect(before - next.health).toBeCloseTo(dealt * CHAIN_LIGHTNING_FRACTION, 5);
  });

  it('does not arc off a move of another type', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const struck = createUnit(battle, teamB);
    const next = createUnit(battle, teamB);
    holder.addAbility(Abilities.ChainLightning);

    const before = next.health;

    dealDamage(holder, struck, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(next.health).toBe(before);
  });
});

describe('Curl Up', () => {
  it('casts Defense Curl on itself for every hit it takes', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.CurlUp);

    const maxHP = holder.checkStat(Stats.HP, 0);

    enemy.damage(NONE_CAUSE, holder, 1, 0);
    battle.tick(turns(1));

    expect(holder.stages[Stages.Defense]).toBe(1);

    holder.setHealth(maxHP);
    enemy.damage(NONE_CAUSE, holder, 1, 0);
    battle.tick(turns(1));

    expect(holder.stages[Stages.Defense]).toBe(2);
  });
});

describe('the Nidoran pair', () => {
  const COURTS = [
    { name: "Queen's Court", ability: Abilities.QueensCourt, defends: true },
    { name: "King's Court", ability: Abilities.KingsCourt, defends: false },
  ];

  for (const { name, ability, defends } of COURTS) {
    it(`pays ${name} for every poisoned enemy, up to the cap`, () => {
      const { battle, teamA, teamB } = createBattle();
      const holder = createUnit(battle, teamA);
      const enemies = [
        createUnit(battle, teamB),
        createUnit(battle, teamB),
        createUnit(battle, teamB),
        createUnit(battle, teamB),
      ];
      holder.addAbility(ability);

      const parent = defends
        ? makeAttack(enemies[0], holder, Moves.Pound, Types.Normal, MoveCategories.Physical)
        : makeAttack(holder, enemies[0], Moves.Pound, Types.Normal, MoveCategories.Physical);
      const stat = defends ? Stats.Defense : Stats.Attack;

      // Nothing owed while the far side is clean
      expect(resolveAttackStat(battle, parent, holder, stat, 100)).toBe(100);

      for (const [index, enemy] of enemies.entries()) {
        enemy.addStatus(Statuses.Poisoned, NONE_CAUSE);

        const counted = Math.min(REGAL_COURT_MAX_ENEMIES, index + 1);

        expect(resolveAttackStat(battle, parent, holder, stat, 100)).toBeCloseTo(
          100 * (1 + REGAL_COURT_STEP * counted),
          5,
        );
      }
    });
  }

  it('pays each half on its own side of the blow only', () => {
    const { battle, teamA, teamB } = createBattle();
    const queen = createUnit(battle, teamA);
    const king = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    queen.addAbility(Abilities.QueensCourt);
    king.addAbility(Abilities.KingsCourt);
    enemy.addStatus(Statuses.Poisoned, NONE_CAUSE);

    const struck = makeAttack(enemy, queen, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const thrown = makeAttack(king, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const owed = 100 * (1 + REGAL_COURT_STEP);

    // She is paid defending and he attacking, and neither the other way
    expect(resolveAttackStat(battle, struck, queen, Stats.Defense, 100)).toBeCloseTo(owed, 5);
    expect(resolveAttackStat(battle, struck, enemy, Stats.Attack, 100)).toBe(100);
    expect(resolveAttackStat(battle, thrown, king, Stats.Attack, 100)).toBeCloseTo(owed, 5);
    expect(resolveAttackStat(battle, thrown, enemy, Stats.Defense, 100)).toBe(100);
  });

  it('counts the poison either of them landed', () => {
    const { battle, teamA, teamB } = createBattle();
    const queen = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    queen.addAbility(Abilities.QueensCourt);

    enemy.addStatus(Statuses.BadlyPoisoned, NONE_CAUSE);

    const struck = makeAttack(enemy, queen, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, struck, queen, Stats.SpecialDefense, 100)).toBeCloseTo(
      100 * (1 + REGAL_COURT_STEP),
      5,
    );
  });
});

describe('Wishing Well', () => {
  it('casts Wish on the ally furthest from full', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);
    holder.addAbility(Abilities.WishingWell);

    const maxHP = hurt.checkStat(Stats.HP, 0);
    hurt.setHealth(maxHP / 4);
    holder.setHealth(1);

    let wished: Unit | undefined;
    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
      if (event.move === Moves.Wish && event.target.type === MoveTargetType.Unit) {
        wished = event.target.unit;
      }
    });

    act(battle, holder);

    expect(wished).toBe(hurt);
  });
});

describe('Nine Tails', () => {
  it('buys Special Attack with every hit it survives, up to nine', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.NineTails);

    const bare = holder.checkStat(Stats.SpecialAttack, 0);
    const maxHP = holder.checkStat(Stats.HP, 0);

    for (let taken = 1; taken <= NINE_TAILS_MAX_STACKS + 2; taken += 1) {
      enemy.damage(NONE_CAUSE, holder, 1, 0);
      holder.setHealth(maxHP);

      expect(holder.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(
        bare * (1 + NINE_TAILS_STEP * Math.min(NINE_TAILS_MAX_STACKS, taken)),
        5,
      );
    }
  });
});

describe('Lullaby', () => {
  it('holds its own sleep longer and hits a sleeper harder', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Lullaby);

    const fromHolder = {
      type: EffectType.Ability,
      ability: Abilities.Lullaby,
      unit: holder,
    } as const;

    const bare = enemy.checkStatusDuration(Statuses.Sleeping, turns(3), NONE_CAUSE);

    expect(enemy.checkStatusDuration(Statuses.Sleeping, turns(3), fromHolder)).toBeCloseTo(
      bare * LULLABY_SLEEP_SCALE,
      5,
    );

    const parent = makeAttack(holder, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, parent, holder, Stats.Attack, 100)).toBe(100);

    enemy.addStatus(Statuses.Sleeping, NONE_CAUSE);

    expect(resolveAttackStat(battle, parent, holder, Stats.Attack, 100)).toBeCloseTo(
      100 * LULLABY_POWER_SCALE,
      5,
    );
  });
});

describe('Bloodthirst', () => {
  it('drinks deeper and eats worse', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Bloodthirst);

    expect(holder.checkDrain(enemy, 20)).toBeCloseTo(20 * BLOODTHIRST_DRAIN_SCALE, 5);

    holder.setHealth(10);
    holder.heal(NONE_CAUSE, holder, 20, 0);

    expect(holder.health).toBeCloseTo(10 + 20 * BLOODTHIRST_HEAL_SCALE, 5);

    // A drain is not one of the heals it is bad at
    holder.setHealth(10);
    holder.heal({ type: EffectType.Move, move: Moves.MegaDrain, unit: holder }, holder, 20, 0);

    expect(holder.health).toBeCloseTo(30, 5);
  });
});

describe('Deep Roots', () => {
  it('casts Ingrain on itself as it arrives', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.DeepRoots);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });
    battle.tick(turns(1));

    expect(holder.status[Statuses.Rooted]).not.toBeUndefined();
  });
});

describe('Fungal Bloom', () => {
  it('feeds on every status it lands on an enemy', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.FungalBloom);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);

    enemy.addStatus(Statuses.Poisoned, {
      type: EffectType.Move,
      move: Moves.PoisonPowder,
      unit: holder,
    });

    expect(holder.health).toBeCloseTo(maxHP / 2 + maxHP * FUNGAL_BLOOM_FRACTION, 5);

    // A status it puts on itself feeds it nothing
    holder.setHealth(maxHP / 2);
    holder.addStatus(Statuses.Poisoned, {
      type: EffectType.Move,
      move: Moves.Toxic,
      unit: holder,
    });

    expect(holder.health).toBeCloseTo(maxHP / 2, 5);
  });
});

describe('Dust Storm', () => {
  it('reads every ailing enemy, up to what the dust can cover', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.DustStorm);

    const enemies = [
      createUnit(battle, teamB),
      createUnit(battle, teamB),
      createUnit(battle, teamB),
      createUnit(battle, teamB),
      createUnit(battle, teamB),
    ];
    const bare = holder.checkStat(Stats.SpecialAttack, 0);

    expect(bare).toBeGreaterThan(0);

    enemies.forEach((enemy, index) => {
      enemy.addStatus(Statuses.Poisoned, NONE_CAUSE);

      expect(holder.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(
        bare * (1 + DUST_STORM_STEP * Math.min(DUST_STORM_MAX_STACKS, index + 1)),
        5,
      );
    });
  });

  it('reads nothing off its own side', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    holder.addAbility(Abilities.DustStorm);

    const bare = holder.checkStat(Stats.SpecialAttack, 0);
    ally.addStatus(Statuses.Poisoned, NONE_CAUSE);

    expect(holder.checkStat(Stats.SpecialAttack, 0)).toBe(bare);
  });
});

describe('Undermine', () => {
  it('leaves a target taking more from everybody, up to the cap', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Undermine);

    const maxHP = enemy.checkStat(Stats.HP, 0);
    const fromAlly = makeAttack(ally, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, fromAlly, ally, Stats.Attack, 100)).toBe(100);

    for (let passes = 1; passes <= UNDERMINE_MAX_STACKS + 2; passes += 1) {
      holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);
      enemy.setHealth(maxHP);

      // The ally profits from the digging as much as the digger does
      expect(resolveAttackStat(battle, fromAlly, ally, Stats.Attack, 100)).toBeCloseTo(
        100 * (1 + UNDERMINE_STEP * Math.min(UNDERMINE_MAX_STACKS, passes)),
        5,
      );
    }
  });
});

describe('Cutpurse', () => {
  it('takes an item once from each enemy', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Cutpurse);

    enemy.addItem(Items.OranBerry);

    expect(enemy.items[Items.OranBerry]).not.toBeUndefined();

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.items[Items.OranBerry]).toBeUndefined();

    // Pockets already turned out stay empty: a second item is safe
    enemy.setHealth(enemy.checkStat(Stats.HP, 0));
    enemy.addItem(Items.OranBerry);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.items[Items.OranBerry]).not.toBeUndefined();
  });
});

describe('Headache Burst', () => {
  it('comes on at half health and takes the misses out of Psychic moves', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.HeadacheBurst);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;
    const bare = holder.checkStat(Stats.SpecialAttack, 0);

    expect(holder.checkMoveAccuracy(Moves.Psybeam, target)).not.toBeUndefined();

    holder.setHealth(holder.checkStat(Stats.HP, 0) / 2);

    expect(holder.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(bare * HEADACHE_BURST_SCALE, 5);
    expect(holder.checkMoveAccuracy(Moves.Psybeam, target)).toBeUndefined();

    // A move of another type still has to land the ordinary way
    expect(holder.checkMoveAccuracy(Moves.WaterGun, target)).not.toBeUndefined();
  });
});

describe('Blind Rage', () => {
  it('swings harder, aims worse, and refuses every heal', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.BlindRage);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;
    const bareAttack = createUnit(battle, teamB).checkStat(Stats.Attack, 0);

    expect(holder.checkStat(Stats.Attack, 0)).toBeCloseTo(bareAttack * BLIND_RAGE_ATTACK_SCALE, 5);
    expect(holder.checkMoveAccuracy(Moves.Pound, target)).toBeCloseTo(
      100 * BLIND_RAGE_ACCURACY_SCALE,
      5,
    );

    holder.setHealth(10);
    holder.heal(NONE_CAUSE, holder, 50, 0);

    expect(holder.health).toBe(10);
  });
});

describe('Chase Down', () => {
  it('hits quarry harder and will not let it leave', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.ChaseDown);

    const parent = makeAttack(holder, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, parent, holder, Stats.Attack, 100)).toBe(100);
    expect(enemy.checkEscape()).toBe(true);

    enemy.setHealth(enemy.checkStat(Stats.HP, 0) * CHASE_DOWN_THRESHOLD);

    expect(resolveAttackStat(battle, parent, holder, Stats.Attack, 100)).toBeCloseTo(
      100 * CHASE_DOWN_SCALE,
      5,
    );
    expect(enemy.checkEscape()).toBe(false);
  });
});

describe('Hypnotic Spiral', () => {
  it('slows the next cast of whoever touches it', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.HypnoticSpiral);

    const target = { type: MoveTargetType.None } as const;
    const bare = enemy.checkMoveCastTime(Moves.Flamethrower, target);

    // A ranged move leaves the spiral out of reach
    enemy.attack(holder, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(enemy.checkMoveCastTime(Moves.Flamethrower, target)).toBe(bare);

    enemy.attack(holder, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.checkMoveCastTime(Moves.Flamethrower, target)).toBeCloseTo(
      bare * HYPNOTIC_SPIRAL_CAST_SCALE,
      5,
    );

    battle.emit(BattleEvents.UnitCast, {
      id: 'UnitCast',
      disabled: false,
      source: enemy,
      move: Moves.Flamethrower,
      target,
    });

    expect(enemy.checkMoveCastTime(Moves.Flamethrower, target)).toBe(bare);
  });
});

describe('Teleport Guard', () => {
  it('blinks away from one attack, then has to gather itself', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.TeleportGuard);

    // The blow that would have landed does not
    rollMove(battle, enemy, holder, Moves.Pound, true);

    // The next one lands: the blink is spent
    const second = rolled(battle, enemy, holder, Moves.Pound);

    expect(second).toBe(true);

    battle.tick(TELEPORT_GUARD_WINDOW);

    expect(rolled(battle, enemy, holder, Moves.Pound)).toBe(false);
  });
});

describe('Overhead Throw', () => {
  it('throws a heavier target harder than a lighter one', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const heavy = createUnit(battle, teamB);
    const light = createUnit(battle, teamB);
    holder.addAbility(Abilities.OverheadThrow);

    holder.setWeight(100);
    heavy.setWeight(200);
    light.setWeight(50);

    const atHeavy = makeAttack(holder, heavy, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const atLight = makeAttack(holder, light, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const ranged = makeAttack(holder, heavy, Moves.Ember, Types.Fire, MoveCategories.Special);

    expect(resolveAttackStat(battle, atHeavy, holder, Stats.Attack, 100)).toBeCloseTo(
      100 * OVERHEAD_THROW_HEAVY_SCALE,
      5,
    );
    expect(resolveAttackStat(battle, atLight, holder, Stats.Attack, 100)).toBeCloseTo(
      100 * OVERHEAD_THROW_LIGHT_SCALE,
      5,
    );

    // Nothing it does not get its hands on
    expect(resolveAttackStat(battle, ranged, holder, Stats.SpecialAttack, 100)).toBe(100);
  });
});

describe('Digest', () => {
  it('feeds on a target that is nearly finished', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Digest);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);

    // A healthy target is no meal
    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(holder.health).toBeCloseTo(maxHP / 2, 5);

    enemy.setHealth(enemy.checkStat(Stats.HP, 0) * DIGEST_THRESHOLD);
    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(holder.health).toBeCloseTo(maxHP / 2 + maxHP * DIGEST_HEAL_FRACTION, 5);
  });
});

describe('Tentacle Grasp', () => {
  it('holds whatever it has touched while it stands', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const untouched = createUnit(battle, teamB);
    holder.addAbility(Abilities.TentacleGrasp);

    expect(enemy.checkEscape()).toBe(true);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.checkEscape()).toBe(false);
    expect(untouched.checkEscape()).toBe(true);

    // The grip goes with the holder
    holder.faint(enemy);

    expect(enemy.checkEscape()).toBe(true);
  });
});

describe('Solid Core', () => {
  it('shrugs off physical blows and eats special ones', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SolidCore);

    const physical = makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const special = makeAttack(enemy, holder, Moves.Ember, Types.Fire, MoveCategories.Special);

    expect(resolveAttackStat(battle, physical, enemy, Stats.Attack, 100)).toBeCloseTo(
      100 * SOLID_CORE_PHYSICAL_SCALE,
      5,
    );
    expect(resolveAttackStat(battle, special, enemy, Stats.SpecialAttack, 100)).toBeCloseTo(
      100 * SOLID_CORE_SPECIAL_SCALE,
      5,
    );

    // Its own defensive stat is left alone
    expect(resolveAttackStat(battle, physical, holder, Stats.Defense, 100)).toBe(100);
  });
});

describe('Gallop', () => {
  it('gathers speed as it acts and loses it all to one hit', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Gallop);

    const bare = holder.checkStat(Stats.Speed, 0);

    for (let strides = 1; strides <= GALLOP_MAX_STACKS + 2; strides += 1) {
      act(battle, holder);

      expect(holder.checkStat(Stats.Speed, 0)).toBeCloseTo(
        bare * (1 + GALLOP_STEP * Math.min(GALLOP_MAX_STACKS, strides)),
        5,
      );
    }

    enemy.damage(NONE_CAUSE, holder, 1, 0);

    expect(holder.checkStat(Stats.Speed, 0)).toBe(bare);
  });
});

describe('Delayed Reaction', () => {
  it('feels half the blow now and the rest in four seconds', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.DelayedReaction);

    const maxHP = holder.checkStat(Stats.HP, 0);

    enemy.damage(NONE_CAUSE, holder, 40, 0);

    expect(holder.health).toBeCloseTo(maxHP - 40 * DELAYED_REACTION_SHARE, 5);

    battle.tick(DELAYED_REACTION_DELAY / 2);

    expect(holder.health).toBeCloseTo(maxHP - 40 * DELAYED_REACTION_SHARE, 5);

    battle.tick(DELAYED_REACTION_DELAY / 2);

    expect(holder.health).toBeCloseTo(maxHP - 40, 5);

    // The debt settles once and does not come round again
    battle.tick(DELAYED_REACTION_DELAY);

    expect(holder.health).toBeCloseTo(maxHP - 40, 5);
  });
});

describe('Repulsion Field', () => {
  it('dampens special moves from both sides', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.RepulsionField);

    const incoming = makeAttack(enemy, holder, Moves.Ember, Types.Fire, MoveCategories.Special);
    const outgoing = makeAttack(holder, enemy, Moves.Ember, Types.Fire, MoveCategories.Special);
    const physical = makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, incoming, enemy, Stats.SpecialAttack, 100)).toBeCloseTo(
      100 * REPULSION_FIELD_SCALE,
      5,
    );
    expect(resolveAttackStat(battle, outgoing, holder, Stats.SpecialAttack, 100)).toBeCloseTo(
      100 * REPULSION_FIELD_SCALE,
      5,
    );

    // Nothing swung rather than thrown
    expect(resolveAttackStat(battle, physical, enemy, Stats.Attack, 100)).toBe(100);
  });
});

describe('Leek Duelist', () => {
  it('crits more often and harder, and takes everything harder too', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.LeekDuelist);

    const outgoing = makeAttack(holder, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const incoming = makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);

    const ratio = {
      id: 'UnitAttackCheckCriticalRatio',
      disabled: false,
      parent: outgoing,
      value: 0,
    };
    battle.emit(BattleEvents.UnitAttackCheckCriticalRatio, ratio);

    expect(ratio.value).toBe(LEEK_DUELIST_CRITICAL_STAGES);

    const mult = {
      id: 'UnitAttackResolveCriticalMult',
      disabled: false,
      parent: outgoing,
      value: 0,
    };
    battle.emit(BattleEvents.UnitAttackResolveCriticalMult, mult);

    expect(mult.value).toBeCloseTo(2 * LEEK_DUELIST_CRITICAL_SCALE, 5);

    expect(resolveAttackStat(battle, incoming, enemy, Stats.Attack, 100)).toBeCloseTo(
      100 * LEEK_DUELIST_EXPOSED_SCALE,
      5,
    );
  });
});

describe('Second Head', () => {
  it('gives the spare head every third blow', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SecondHead);

    const powers: number[] = [];
    battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
      if (event.source === holder) {
        powers.push(event.value);
      }
    });

    for (let landed = 0; landed < SECOND_HEAD_INTERVAL; landed += 1) {
      holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);
      enemy.setHealth(enemy.checkStat(Stats.HP, 0));
    }

    // Three blows thrown, and the third brings a fourth with it. The
    // spare head's blow resolves inside the third, so it is recorded
    // before it
    expect(powers).toHaveLength(SECOND_HEAD_INTERVAL + 1);
    expect(powers.filter((power) => power === 40 * SECOND_HEAD_POWER_SCALE)).toHaveLength(1);
  });
});

describe('Sleek Hide', () => {
  it('sheds contact and takes the rest badly', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SleekHide);

    const contact = makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const ranged = makeAttack(enemy, holder, Moves.Ember, Types.Fire, MoveCategories.Special);

    expect(resolveAttackStat(battle, contact, enemy, Stats.Attack, 100)).toBeCloseTo(
      100 * SLEEK_HIDE_CONTACT_SCALE,
      5,
    );
    expect(resolveAttackStat(battle, ranged, enemy, Stats.SpecialAttack, 100)).toBeCloseTo(
      100 * SLEEK_HIDE_RANGED_SCALE,
      5,
    );
  });
});

describe('Corrosive Ooze', () => {
  it('eats the item off whoever touches it', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.CorrosiveOoze);

    enemy.addItem(Items.OranBerry);
    enemy.attack(holder, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    // Nothing thrown from a distance touches the sludge
    expect(enemy.items[Items.OranBerry]).not.toBeUndefined();

    enemy.attack(holder, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.items[Items.OranBerry]).toBeUndefined();
  });
});

describe('Spike Shell', () => {
  it('blunts a contact blow and costs the arm that threw it', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SpikeShell);

    const contact = makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, contact, enemy, Stats.Attack, 100)).toBeCloseTo(
      100 * SPIKE_SHELL_CONTACT_SCALE,
      5,
    );

    const maxHP = enemy.checkStat(Stats.HP, 0);
    const before = enemy.health;

    enemy.attack(holder, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(before - enemy.health).toBeCloseTo(maxHP * SPIKE_SHELL_FRACTION, 5);
  });
});
